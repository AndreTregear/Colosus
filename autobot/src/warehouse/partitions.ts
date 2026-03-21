import { query } from '../db/pool.js';
import { logger } from '../shared/logger.js';

const PARTITIONED_TABLES = [
  'wh_fact_interactions',
  'wh_fact_transactions',
  'wh_fact_ai_sessions',
];

/**
 * Ensure monthly partitions exist for the next N months.
 * Creates partitions like: wh_fact_interactions_2026_03
 */
export async function ensurePartitions(monthsAhead: number = 3): Promise<void> {
  const now = new Date();

  for (const table of PARTITIONED_TABLES) {
    for (let offset = -1; offset <= monthsAhead; offset++) {
      const date = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      const nextDate = new Date(date.getFullYear(), date.getMonth() + 1, 1);

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const partitionName = `${table}_${year}_${month}`;

      const from = date.toISOString().split('T')[0];
      const to = nextDate.toISOString().split('T')[0];

      try {
        await query(
          `CREATE TABLE IF NOT EXISTS ${partitionName}
           PARTITION OF ${table}
           FOR VALUES FROM ('${from}') TO ('${to}')`,
        );
      } catch (err: unknown) {
        // Partition may already exist or overlap — safe to ignore
        const msg = err instanceof Error ? err.message : String(err);
        if (!msg.includes('already exists') && !msg.includes('overlap')) {
          logger.warn({ table, partitionName, err }, 'Failed to create partition');
        }
      }
    }
  }

  logger.info({ tables: PARTITIONED_TABLES.length, monthsAhead }, 'Warehouse partitions verified');
}

let partitionTimer: ReturnType<typeof setInterval> | null = null;

/** Start a monthly partition check (runs every 24 hours). */
export function startPartitionManager(): void {
  // Run immediately on startup
  ensurePartitions().catch(err => logger.error(err, 'Initial partition creation failed'));

  // Then check daily
  partitionTimer = setInterval(() => {
    ensurePartitions().catch(err => logger.error(err, 'Partition maintenance failed'));
  }, 24 * 60 * 60 * 1000);
}

export function stopPartitionManager(): void {
  if (partitionTimer) {
    clearInterval(partitionTimer);
    partitionTimer = null;
  }
}
