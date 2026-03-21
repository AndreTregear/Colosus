import { query, queryOne } from '../db/pool.js';
import { logger } from '../shared/logger.js';
import crypto from 'node:crypto';

const ETL_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
const BATCH_SIZE = 1000;

let etlTimer: ReturnType<typeof setInterval> | null = null;

interface Checkpoint {
  lastId: number;
  lastTimestamp: string | null;
  rowsProcessed: number;
}

// ── Checkpoint management ──

async function getCheckpoint(sourceTable: string): Promise<Checkpoint> {
  const row = await queryOne<Record<string, unknown>>(
    'SELECT last_id, last_timestamp, rows_processed FROM wh_etl_checkpoints WHERE source_table = $1',
    [sourceTable],
  );
  return {
    lastId: Number(row?.last_id ?? 0),
    lastTimestamp: row?.last_timestamp ? String(row.last_timestamp) : null,
    rowsProcessed: Number(row?.rows_processed ?? 0),
  };
}

async function updateCheckpoint(sourceTable: string, lastId: number, count: number): Promise<void> {
  await query(
    `INSERT INTO wh_etl_checkpoints (source_table, last_id, last_timestamp, rows_processed, updated_at)
     VALUES ($1, $2, now(), $3, now())
     ON CONFLICT (source_table) DO UPDATE
     SET last_id = $2, last_timestamp = now(), rows_processed = wh_etl_checkpoints.rows_processed + $3, updated_at = now()`,
    [sourceTable, lastId, count],
  );
}

// ── ETL: Messages → Interactions ──

async function etlMessages(): Promise<number> {
  const cp = await getCheckpoint('message_log');

  const result = await query<Record<string, unknown>>(
    `SELECT id, tenant_id, channel, jid, direction, body, timestamp
     FROM message_log
     WHERE id > $1
     ORDER BY id ASC
     LIMIT $2`,
    [cp.lastId, BATCH_SIZE],
  );

  if (result.rows.length === 0) return 0;

  const values: unknown[] = [];
  const placeholders: string[] = [];
  let paramIdx = 1;

  for (const row of result.rows) {
    const interactionType = row.direction === 'incoming' ? 'message_in' : 'message_out';
    const contentHash = crypto.createHash('sha256').update(String(row.body ?? '')).digest('hex');

    placeholders.push(
      `($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++})`,
    );
    values.push(
      row.tenant_id,
      null, // customer_id (would need a join, kept null for now)
      row.channel,
      interactionType,
      contentHash,
      row.timestamp,
    );
  }

  await query(
    `INSERT INTO wh_fact_interactions (tenant_id, customer_id, channel, interaction_type, content_hash, created_at)
     VALUES ${placeholders.join(', ')}
     ON CONFLICT DO NOTHING`,
    values,
  );

  const lastId = Number(result.rows[result.rows.length - 1].id);
  await updateCheckpoint('message_log', lastId, result.rows.length);

  return result.rows.length;
}

// ── ETL: Media Assets → Interactions ──

async function etlMedia(): Promise<number> {
  const cp = await getCheckpoint('media_assets');

  const result = await query<Record<string, unknown>>(
    `SELECT id, tenant_id, category, created_at
     FROM media_assets
     WHERE id::text > $1
     ORDER BY id ASC
     LIMIT $2`,
    [cp.lastId ? String(cp.lastId) : '', BATCH_SIZE],
  );

  if (result.rows.length === 0) return 0;

  const values: unknown[] = [];
  const placeholders: string[] = [];
  let paramIdx = 1;

  for (const row of result.rows) {
    const interactionType = row.category === 'voice' ? 'voice_note'
      : row.category === 'video' ? 'video'
      : 'image';

    placeholders.push(
      `($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++})`,
    );
    values.push(
      row.tenant_id,
      'whatsapp', // default channel
      interactionType,
      row.id, // media_asset_id
      row.created_at,
    );
  }

  await query(
    `INSERT INTO wh_fact_interactions (tenant_id, channel, interaction_type, media_asset_id, created_at)
     VALUES ${placeholders.join(', ')}
     ON CONFLICT DO NOTHING`,
    values,
  );

  // Use 0 as placeholder since media_assets uses UUID
  await updateCheckpoint('media_assets', 0, result.rows.length);

  return result.rows.length;
}

// ── ETL: Orders + Payments → Transactions ──

async function etlTransactions(): Promise<number> {
  const cp = await getCheckpoint('orders');

  const result = await query<Record<string, unknown>>(
    `SELECT o.id, o.tenant_id, o.status AS order_status, o.total,
            COUNT(oi.id) AS item_count,
            p.method AS payment_method, p.status AS payment_status,
            o.created_at,
            CASE WHEN o.status = 'delivered' THEN o.updated_at ELSE NULL END AS fulfilled_at
     FROM orders o
     LEFT JOIN order_items oi ON oi.order_id = o.id
     LEFT JOIN payments p ON p.order_id = o.id
     WHERE o.id > $1
     GROUP BY o.id, p.method, p.status
     ORDER BY o.id ASC
     LIMIT $2`,
    [cp.lastId, BATCH_SIZE],
  );

  if (result.rows.length === 0) return 0;

  const values: unknown[] = [];
  const placeholders: string[] = [];
  let paramIdx = 1;

  for (const row of result.rows) {
    placeholders.push(
      `($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++})`,
    );
    values.push(
      row.tenant_id,
      row.id,
      Number(row.item_count) || 0,
      row.total,
      row.payment_method ?? null,
      row.payment_status ?? null,
      row.order_status,
      row.fulfilled_at ?? null,
      row.created_at,
    );
  }

  await query(
    `INSERT INTO wh_fact_transactions (tenant_id, order_id, item_count, total_amount, payment_method, payment_status, order_status, fulfilled_at, created_at)
     VALUES ${placeholders.join(', ')}
     ON CONFLICT DO NOTHING`,
    values,
  );

  const lastId = Number(result.rows[result.rows.length - 1].id);
  await updateCheckpoint('orders', lastId, result.rows.length);

  return result.rows.length;
}

// ── ETL: Token Usage → AI Sessions ──

async function etlAISessions(): Promise<number> {
  const cp = await getCheckpoint('token_usage');

  const result = await query<Record<string, unknown>>(
    `SELECT id, tenant_id, model, prompt_tokens, completion_tokens, total_tokens, created_at
     FROM token_usage
     WHERE id > $1
     ORDER BY id ASC
     LIMIT $2`,
    [cp.lastId, BATCH_SIZE],
  );

  if (result.rows.length === 0) return 0;

  const values: unknown[] = [];
  const placeholders: string[] = [];
  let paramIdx = 1;

  for (const row of result.rows) {
    placeholders.push(
      `($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++})`,
    );
    values.push(
      row.tenant_id,
      Number(row.total_tokens) || 0,
      row.model,
      row.created_at,
    );
  }

  await query(
    `INSERT INTO wh_fact_ai_sessions (tenant_id, total_tokens, model, created_at)
     VALUES ${placeholders.join(', ')}
     ON CONFLICT DO NOTHING`,
    values,
  );

  const lastId = Number(result.rows[result.rows.length - 1].id);
  await updateCheckpoint('token_usage', lastId, result.rows.length);

  return result.rows.length;
}

// ── ETL: Customer Dimensions ──

async function etlCustomerDimensions(): Promise<number> {
  // Upsert customer dimension data from operational tables
  const result = await query(
    `INSERT INTO wh_dim_customers (tenant_id, customer_id, first_seen_at, total_orders, total_spent, preferred_channel, tags, updated_at)
     SELECT
       c.tenant_id,
       c.id,
       c.created_at,
       COALESCE(order_stats.order_count, 0),
       COALESCE(order_stats.total_spent, 0),
       c.channel,
       COALESCE(string_to_array(c.notes, ','), '{}'),
       now()
     FROM customers c
     LEFT JOIN (
       SELECT customer_id, COUNT(*) AS order_count, SUM(total) AS total_spent
       FROM orders
       GROUP BY customer_id
     ) order_stats ON order_stats.customer_id = c.id
     ON CONFLICT (tenant_id, customer_id) DO UPDATE
     SET total_orders = EXCLUDED.total_orders,
         total_spent = EXCLUDED.total_spent,
         updated_at = now()`,
  );

  return result.rowCount ?? 0;
}

// ── Materialized View Refresh ──

async function refreshMaterializedViews(): Promise<void> {
  try {
    await query('REFRESH MATERIALIZED VIEW CONCURRENTLY wh_mv_daily_volume');
  } catch {
    // View may not exist yet or have no unique index for CONCURRENTLY
    try { await query('REFRESH MATERIALIZED VIEW wh_mv_daily_volume'); } catch { /* ignore */ }
  }

  try {
    await query('REFRESH MATERIALIZED VIEW CONCURRENTLY wh_mv_customer_ltv');
  } catch {
    try { await query('REFRESH MATERIALIZED VIEW wh_mv_customer_ltv'); } catch { /* ignore */ }
  }
}

// ── Main ETL Runner ──

async function runETL(): Promise<void> {
  const start = Date.now();

  try {
    const msgCount = await etlMessages();
    const mediaCount = await etlMedia();
    const txCount = await etlTransactions();
    const aiCount = await etlAISessions();
    const custCount = await etlCustomerDimensions();
    await refreshMaterializedViews();

    const elapsed = Date.now() - start;
    const total = msgCount + mediaCount + txCount + aiCount + custCount;

    if (total > 0) {
      logger.info({
        messages: msgCount,
        media: mediaCount,
        transactions: txCount,
        aiSessions: aiCount,
        customers: custCount,
        elapsedMs: elapsed,
      }, `ETL cycle completed: ${total} rows processed`);
    }
  } catch (err) {
    logger.error({ err, elapsedMs: Date.now() - start }, 'ETL cycle failed');
  }
}

export function startETLRunner(): void {
  // Run first ETL after a short delay (let DB settle)
  setTimeout(() => {
    runETL().catch(err => logger.error(err, 'Initial ETL run failed'));
  }, 10_000);

  etlTimer = setInterval(() => {
    runETL().catch(err => logger.error(err, 'ETL run failed'));
  }, ETL_INTERVAL_MS);

  logger.info({ intervalMs: ETL_INTERVAL_MS }, 'ETL runner started');
}

export function stopETLRunner(): void {
  if (etlTimer) {
    clearInterval(etlTimer);
    etlTimer = null;
    logger.info('ETL runner stopped');
  }
}
