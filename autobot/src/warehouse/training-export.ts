import crypto from 'node:crypto';
import { query } from '../db/pool.js';
import { putObject, getPresignedUrl } from '../media/s3-client.js';
import { S3_BUCKET_EXPORTS } from '../config.js';
import { logger } from '../shared/logger.js';

interface ExportOpts {
  tenantId: string;
  format: 'jsonl' | 'csv';
  dateFrom?: string;
  dateTo?: string;
  interactionTypes?: string[];
  anonymize?: boolean;
}

interface ConversationPair {
  input: string;
  output: string;
  metadata: {
    tenant: string;
    channel: string;
    timestamp: string;
    interaction_type: string;
  };
}

/** Hash a value for anonymization. */
function anonymize(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex').substring(0, 12);
}

/**
 * Export conversation pairs from the warehouse for AI training.
 * Returns a presigned URL to download the export file.
 */
export async function exportTrainingData(opts: ExportOpts): Promise<{ url: string; rowCount: number; key: string }> {
  const { tenantId, format, dateFrom, dateTo, interactionTypes, anonymize: shouldAnonymize = true } = opts;

  // Query message pairs (incoming → outgoing) from message_log
  let whereClause = 'WHERE ml_in.tenant_id = $1 AND ml_in.direction = \'incoming\'';
  const params: unknown[] = [tenantId];

  if (dateFrom) {
    params.push(dateFrom);
    whereClause += ` AND ml_in.timestamp >= $${params.length}`;
  }
  if (dateTo) {
    params.push(dateTo);
    whereClause += ` AND ml_in.timestamp <= $${params.length}`;
  }

  const result = await query<Record<string, unknown>>(
    `SELECT
       ml_in.jid,
       ml_in.body AS input_text,
       ml_out.body AS output_text,
       ml_in.channel,
       ml_in.timestamp
     FROM message_log ml_in
     INNER JOIN LATERAL (
       SELECT body
       FROM message_log ml_out
       WHERE ml_out.tenant_id = ml_in.tenant_id
         AND ml_out.jid = ml_in.jid
         AND ml_out.direction = 'outgoing'
         AND ml_out.timestamp > ml_in.timestamp
         AND ml_out.timestamp < ml_in.timestamp + INTERVAL '5 minutes'
       ORDER BY ml_out.timestamp ASC
       LIMIT 1
     ) ml_out ON true
     ${whereClause}
     ORDER BY ml_in.timestamp ASC`,
    params,
  );

  // Build export content
  const pairs: ConversationPair[] = result.rows.map(row => ({
    input: shouldAnonymize ? String(row.input_text) : String(row.input_text),
    output: String(row.output_text),
    metadata: {
      tenant: shouldAnonymize ? anonymize(tenantId) : tenantId,
      channel: String(row.channel),
      timestamp: String(row.timestamp),
      interaction_type: 'conversation',
    },
  }));

  // Anonymize PII in content if requested
  if (shouldAnonymize) {
    for (const pair of pairs) {
      // Remove phone numbers (E.164 format)
      pair.input = pair.input.replace(/\+?\d{10,15}/g, '[PHONE]');
      pair.output = pair.output.replace(/\+?\d{10,15}/g, '[PHONE]');
      // Remove email addresses
      pair.input = pair.input.replace(/[\w.-]+@[\w.-]+\.\w+/g, '[EMAIL]');
      pair.output = pair.output.replace(/[\w.-]+@[\w.-]+\.\w+/g, '[EMAIL]');
    }
  }

  let content: string;
  let contentType: string;
  let ext: string;

  if (format === 'jsonl') {
    content = pairs.map(p => JSON.stringify(p)).join('\n');
    contentType = 'application/jsonl';
    ext = 'jsonl';
  } else {
    // CSV format
    const header = 'input,output,channel,timestamp';
    const rows = pairs.map(p =>
      `"${p.input.replace(/"/g, '""')}","${p.output.replace(/"/g, '""')}","${p.metadata.channel}","${p.metadata.timestamp}"`,
    );
    content = [header, ...rows].join('\n');
    contentType = 'text/csv';
    ext = 'csv';
  }

  // Upload to S3
  const exportKey = `${tenantId}/training/${Date.now()}.${ext}`;
  await putObject(S3_BUCKET_EXPORTS, exportKey, Buffer.from(content, 'utf-8'), contentType);

  // Generate presigned download URL (1 hour)
  const url = await getPresignedUrl(S3_BUCKET_EXPORTS, exportKey, 3600);

  logger.info({ tenantId, format, rowCount: pairs.length, exportKey }, 'Training data exported');

  return { url, rowCount: pairs.length, key: exportKey };
}

/**
 * Get warehouse analytics summary for a tenant.
 */
export async function getWarehouseSummary(tenantId: string): Promise<Record<string, unknown>> {
  const [interactions, transactions, aiSessions, mediaCount] = await Promise.all([
    queryCount('wh_fact_interactions', tenantId),
    queryCount('wh_fact_transactions', tenantId),
    queryCount('wh_fact_ai_sessions', tenantId),
    queryCount('media_assets', tenantId),
  ]);

  return {
    totalInteractions: interactions,
    totalTransactions: transactions,
    totalAISessions: aiSessions,
    totalMediaAssets: mediaCount,
  };
}

async function queryCount(table: string, tenantId: string): Promise<number> {
  const row = await query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM ${table} WHERE tenant_id = $1`,
    [tenantId],
  );
  return parseInt(row.rows[0]?.count ?? '0', 10);
}
