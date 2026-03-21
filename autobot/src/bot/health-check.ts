/**
 * HealthCheckService — monitors all tenant workers periodically.
 * Detects dead workers and attempts recovery.
 */
import { tenantManager } from './tenant-manager.js';
import { appBus } from '../shared/events.js';
import { logger } from '../shared/logger.js';

const CHECK_INTERVAL_MS = 30_000; // 30 seconds
// Cooldown between respawn attempts per tenant to avoid hammering on persistent failures
const RESPAWN_COOLDOWN_MS = 60_000; // 1 minute minimum between respawns

// Track last respawn time per tenant
const lastRespawn = new Map<string, number>();

let interval: ReturnType<typeof setInterval> | null = null;

export function startHealthCheck(): void {
  if (interval) return;

  interval = setInterval(async () => {
    const bridges = tenantManager.getAllBridges();

    for (const [tenantId, bridge] of bridges) {
      if (!bridge.isRunning()) continue;

      if (!bridge.isAlive()) {
        const now = Date.now();
        const last = lastRespawn.get(tenantId) ?? 0;
        if (now - last < RESPAWN_COOLDOWN_MS) continue; // Still in cooldown

        logger.warn({ tenantId }, 'Health check: worker appears dead, attempting respawn');
        appBus.emit('tenant-health-alert', tenantId, 'Worker unresponsive, respawning');
        lastRespawn.set(tenantId, now);

        try {
          await tenantManager.stopTenant(tenantId);
          await tenantManager.startTenant(tenantId);
          logger.info({ tenantId }, 'Health check: tenant respawned successfully');
        } catch (err) {
          logger.error({ tenantId, err }, 'Health check: respawn failed, will retry next cycle');
        }
      } else {
        // Worker is healthy — clear cooldown
        lastRespawn.delete(tenantId);
      }
    }
  }, CHECK_INTERVAL_MS);

  logger.info('Health check service started');
}

export function stopHealthCheck(): void {
  if (interval) {
    clearInterval(interval);
    interval = null;
    logger.info('Health check service stopped');
  }
}
