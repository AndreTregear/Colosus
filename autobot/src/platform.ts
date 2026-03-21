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
import { initMastraStorage } from './ai/mastra.js';
import { ensureDarwinTenant } from './web/routes/api-simulate.js';
import { logger } from './shared/logger.js';

/** Start all platform services and return a shutdown function. */
export async function startPlatform(port: number): Promise<() => Promise<void>> {
  logger.info('Platform starting...');

  // Run all SQL schemas + numbered migrations (idempotent)
  await runDatabaseMigrations();

  // Better Auth table migrations + admin user seed
  await migrateAuthTables();
  await seedAdminIfNeeded();

  // Initialize object storage (S3/MinIO)
  await ensureBuckets();
  logger.info('Object storage initialized');

  // Initialize Mastra memory storage tables
  await initMastraStorage();
  logger.info('Mastra storage initialized');

  // Ensure Darwin Sales Lab demo tenant exists
  await ensureDarwinTenant();

  createWebServer(port);
  startAIWorker();
  startMediaWorker();
  startPartitionManager();
  startETLRunner();
  await tenantManager.autoStartTenants();

  startHealthCheck();
  startReminderScheduler();
  startPaymentFollowupScheduler();
  startPaymentExpirationScheduler();
  initializeDailySummaryScheduler();
  initializeFollowupScheduler();

  // Register all event-driven notification handlers
  registerEventListeners();

  logger.info('Autobot multi-tenant platform is running');

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
