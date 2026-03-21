import { query, queryOne } from './pool.js';

export async function logMessagePg(msg: {
  tenantId: string;
  channel: string;
  jid: string;
  pushName: string | null;
  direction: 'incoming' | 'outgoing';
  body: string;
  timestamp: string;
}): Promise<void> {
  await query(
    `INSERT INTO message_log (tenant_id, channel, jid, push_name, direction, body, timestamp)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [msg.tenantId, msg.channel, msg.jid, msg.pushName, msg.direction, msg.body, msg.timestamp],
  );
}

export async function getMessageCountForTenant(tenantId: string, since?: string): Promise<number> {
  if (since) {
    const result = await queryOne<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM message_log WHERE tenant_id = $1 AND direction = $2 AND timestamp >= $3',
      [tenantId, 'outgoing', since],
    );
    return Number(result?.count ?? 0);
  }
  // Fallback: count outgoing messages in the current calendar month
  const result = await queryOne<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM message_log WHERE tenant_id = $1 AND direction = $2 AND timestamp >= date_trunc('month', now())`,
    [tenantId, 'outgoing'],
  );
  return Number(result?.count ?? 0);
}

export async function getConversationList(
  tenantId: string,
  limit: number,
  offset: number,
): Promise<{
  conversations: Array<{
    jid: string;
    customerName: string | null;
    lastMessage: string;
    lastMessageDirection: string;
    lastMessageAt: string;
    unreadCount: number;
  }>;
  total: number;
}> {
  const countResult = await queryOne<{ count: string }>(
    'SELECT COUNT(DISTINCT jid)::text AS count FROM message_log WHERE tenant_id = $1',
    [tenantId],
  );
  const total = Number(countResult?.count ?? 0);

  // SQL-level pagination using a CTE for DISTINCT ON + ORDER BY + LIMIT/OFFSET
  const rows = await query(
    `WITH latest AS (
       SELECT DISTINCT ON (ml.jid)
         ml.jid,
         c.name AS customer_name,
         ml.body AS last_message,
         ml.direction AS last_message_direction,
         ml.timestamp AS last_message_at
       FROM message_log ml
       LEFT JOIN customers c ON c.tenant_id = ml.tenant_id AND c.jid = ml.jid
       WHERE ml.tenant_id = $1
       ORDER BY ml.jid, ml.timestamp DESC
     )
     SELECT * FROM latest
     ORDER BY last_message_at DESC
     LIMIT $2 OFFSET $3`,
    [tenantId, limit, offset],
  );

  // Get unread counts for all conversations in one query
  const jids = (rows.rows ?? []).map((r: any) => r.jid);
  let unreadCounts: Map<string, number> = new Map();
  
  if (jids.length > 0) {
    const unreadResult = await query(
      `SELECT 
        ml.jid,
        COUNT(*)::int as unread_count
       FROM message_log ml
       LEFT JOIN conversation_reads cr 
         ON cr.tenant_id = ml.tenant_id 
         AND cr.jid = ml.jid
       WHERE ml.tenant_id = $1 
         AND ml.jid = ANY($2)
         AND ml.direction = 'incoming'
         AND (cr.last_read_at IS NULL OR ml.timestamp > cr.last_read_at)
       GROUP BY ml.jid`,
      [tenantId, jids]
    );
    
    for (const row of (unreadResult.rows ?? [])) {
      unreadCounts.set(row.jid as string, row.unread_count as number);
    }
  }

  const conversations = (rows.rows ?? []).map((r: any) => ({
    jid: r.jid,
    customerName: r.customer_name,
    lastMessage: r.last_message,
    lastMessageDirection: r.last_message_direction,
    lastMessageAt: r.last_message_at,
    unreadCount: unreadCounts.get(r.jid) || 0,
  }));

  return { conversations, total };
}

export async function getConversationMessages(
  tenantId: string,
  jid: string,
  limit: number,
  offset: number,
): Promise<{
  messages: Array<{
    id: number;
    direction: string;
    body: string;
    timestamp: string;
    pushName: string | null;
  }>;
  total: number;
  customerName: string | null;
}> {
  const countResult = await queryOne<{ count: string }>(
    'SELECT COUNT(*)::text AS count FROM message_log WHERE tenant_id = $1 AND jid = $2',
    [tenantId, jid],
  );
  const total = Number(countResult?.count ?? 0);

  const msgRows = await query(
    `SELECT id, direction, body, timestamp, push_name
     FROM message_log
     WHERE tenant_id = $1 AND jid = $2
     ORDER BY timestamp DESC
     LIMIT $3 OFFSET $4`,
    [tenantId, jid, limit, offset],
  );

  const messages = (msgRows.rows ?? []).map((r: any) => ({
    id: r.id,
    direction: r.direction,
    body: r.body,
    timestamp: r.timestamp,
    pushName: r.push_name,
  }));

  const customerRow = await queryOne<{ name: string }>(
    'SELECT name FROM customers WHERE tenant_id = $1 AND jid = $2',
    [tenantId, jid],
  );

  return { messages, total, customerName: customerRow?.name ?? null };
}

export async function markConversationAsRead(
  tenantId: string,
  jid: string,
): Promise<void> {
  await query(
    `INSERT INTO conversation_reads (tenant_id, jid, last_read_at, updated_at)
     VALUES ($1, $2, now(), now())
     ON CONFLICT (tenant_id, jid) 
     DO UPDATE SET last_read_at = now(), updated_at = now()`,
    [tenantId, jid],
  );
}

export async function getConversationHistory(
  tenantId: string,
  jid: string,
  limit: number = 10,
): Promise<{
  messages: Array<{
    direction: 'incoming' | 'outgoing';
    body: string;
    timestamp: string;
  }>;
}> {
  const result = await query(
    `SELECT direction, body, timestamp
     FROM message_log
     WHERE tenant_id = $1 AND jid = $2
     ORDER BY timestamp DESC
     LIMIT $3`,
    [tenantId, jid, limit],
  );

  return {
    messages: (result.rows ?? []).map((r: any) => ({
      direction: r.direction,
      body: r.body,
      timestamp: r.timestamp,
    })).reverse(), // Return in chronological order
  };
}
