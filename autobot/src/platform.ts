import { createWebServer } from './web/server.js';
import { runDatabaseMigrations } from './db/migrate.js';
import { migrateAuthTables, seedAdminIfNeeded } from './auth/auth.js';
import { tenantManager } from './bot/tenant-manager.js';
import { startHealthCheck, stopHealthCheck } from './bot/health-check.js';
import { startAIWorker, closeAIQueue } from './queue/ai-queue.js';
import { closeRedis } from './queue/redis.js';
import { startReminderScheduler, stopReminderScheduler } from './queue/reminder-scheduler.js';
import { startPaymentFollowupScheduler, stopPaymentFollowupScheduler } from './queue/payment-followup-scheduler.js';
import { startPaymentExpirationScheduler, stopPaymentExpirationScheduler } from './queue/payment-expiration-scheduler.js';
import { initializeDailySummaryScheduler, closeDailySummaryScheduler } from './queue/daily-summary-scheduler.js';
import { initializeFollowupScheduler, closeFollowupScheduler } from './queue/followup-scheduler.js';
import { ensureBuckets } from './media/s3-client.js';
import { startMediaWorker, closeMediaQueue } from './media/media-queue.js';
import { startPartitionManager, stopPartitionManager } from './warehouse/partitions.js';
import { startETLRunner, stopETLRunner } from './warehouse/etl-runner.js';
import { registerEventListeners } from './services/notification-service.js';
import { OPENCLAW_API_URL } from './config.js';
import { logger, logStartupBanner } from './shared/logger.js';

/** Start all platform services and return a shutdown function. */
export async function startPlatform(port: number): Promise<() => Promise<void>> {
  const platformStart = Date.now();
  logStartupBanner();
  logger.info('Platform starting...');

  let stepStart = Date.now();

  // Run all SQL schemas + numbered migrations (idempotent)
  await runDatabaseMigrations();
  logger.debug({ latencyMs: Date.now() - stepStart }, 'DB migrations complete');

  // Better Auth table migrations + admin user seed
  stepStart = Date.now();
  await migrateAuthTables();
  logger.debug({ latencyMs: Date.now() - stepStart }, 'Auth tables migrated');

  stepStart = Date.now();
  await seedAdminIfNeeded();
  logger.debug({ latencyMs: Date.now() - stepStart }, 'Admin seed check complete');

  // Initialize object storage (S3/MinIO)
  stepStart = Date.now();
  await ensureBuckets();
  logger.debug({ latencyMs: Date.now() - stepStart }, 'Object storage initialized');

  logger.info({ openclawUrl: OPENCLAW_API_URL }, 'OpenClaw bridge configured');

  stepStart = Date.now();
  createWebServer(port);
  logger.debug({ latencyMs: Date.now() - stepStart }, 'Web server created');

  startAIWorker();
  startMediaWorker();
  startPartitionManager();
  startETLRunner();

  stepStart = Date.now();
  await tenantManager.autoStartTenants();
  logger.debug({ latencyMs: Date.now() - stepStart }, 'Tenants auto-started');

  startHealthCheck();
  startReminderScheduler();
  startPaymentFollowupScheduler();
  startPaymentExpirationScheduler();
  initializeDailySummaryScheduler();
  initializeFollowupScheduler();

  // Register all event-driven notification handlers
  registerEventListeners();

  logger.info({ totalStartupMs: Date.now() - platformStart }, 'Autobot multi-tenant platform is running');

  return async () => {
    logger.info('Shutting down...');
    stopHealthCheck();
    stopPartitionManager();
    stopETLRunner();
    await stopReminderScheduler();
    await stopPaymentFollowupScheduler();
    await stopPaymentExpirationScheduler();
    await closeDailySummaryScheduler();
    await closeFollowupScheduler();
    await closeMediaQueue();
    await closeAIQueue();
    await tenantManager.shutdownAll();
    await closeRedis();
  };
}
