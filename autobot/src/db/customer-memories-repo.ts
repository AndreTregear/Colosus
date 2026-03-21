import { query, queryOne } from './pool.js';

export interface CustomerMemory {
  id: number;
  tenantId: string;
  customerId: number | null;
  channel: string;
  jid: string;
  memoryType: 'preference' | 'fact' | 'personality' | 'purchase_pattern' | 'family' | 'objection';
  content: string;
  importance: number; // 1-10
  source: 'agent' | 'manual' | 'order_history';
  confirmed: boolean;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

function rowToMemory(r: Record<string, unknown>): CustomerMemory {
  return {
    id: r.id as number,
    tenantId: r.tenant_id as string,
    customerId: r.customer_id as number | null,
    channel: r.channel as string,
    jid: r.jid as string,
    memoryType: r.memory_type as CustomerMemory['memoryType'],
    content: r.content as string,
    importance: r.importance as number,
    source: r.source as CustomerMemory['source'],
    confirmed: r.confirmed as boolean,
    lastUsedAt: r.last_used_at as string | null,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

export async function getMemoriesForCustomer(
  tenantId: string,
  jid: string,
  channel: string,
  limit = 20,
): Promise<CustomerMemory[]> {
  const result = await query<Record<string, unknown>>(
    `SELECT * FROM customer_memories
     WHERE tenant_id = $1 AND jid = $2 AND channel = $3
     ORDER BY importance DESC, last_used_at DESC NULLS LAST
     LIMIT $4`,
    [tenantId, jid, channel, limit],
  );
  return result.rows.map(rowToMemory);
}

export async function upsertMemory(
  tenantId: string,
  jid: string,
  channel: string,
  memory: Pick<CustomerMemory, 'memoryType' | 'content' | 'importance' | 'source'>,
  customerId?: number,
): Promise<void> {
  await query(
    `INSERT INTO customer_memories (tenant_id, customer_id, channel, jid, memory_type, content, importance, source)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (tenant_id, jid, content)
     DO UPDATE SET
       importance = EXCLUDED.importance,
       memory_type = EXCLUDED.memory_type,
       updated_at = now()`,
    [
      tenantId,
      customerId ?? null,
      channel,
      jid,
      memory.memoryType,
      memory.content,
      memory.importance,
      memory.source,
    ],
  );
}

export async function touchMemories(tenantId: string, ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  await query(
    `UPDATE customer_memories SET last_used_at = now() WHERE tenant_id = $1 AND id = ANY($2)`,
    [tenantId, ids],
  );
}

export function formatMemoriesForPrompt(memories: CustomerMemory[]): string {
  if (memories.length === 0) return '';
  return memories
    .map(m => `- [${m.memoryType}] ${m.content} (importance: ${m.importance})`)
    .join('\n');
}
