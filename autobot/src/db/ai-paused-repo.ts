import { query, queryOne } from './pool.js';

export async function pauseContact(tenantId: string, jid: string): Promise<void> {
  await query(
    `INSERT INTO ai_paused_contacts (tenant_id, jid) VALUES ($1, $2)
     ON CONFLICT (tenant_id, jid) DO NOTHING`,
    [tenantId, jid],
  );
}

export async function resumeContact(tenantId: string, jid: string): Promise<void> {
  await query('DELETE FROM ai_paused_contacts WHERE tenant_id = $1 AND jid = $2', [tenantId, jid]);
}

export async function isContactPaused(tenantId: string, jid: string): Promise<boolean> {
  const row = await queryOne<{ tenant_id: string }>(
    'SELECT tenant_id FROM ai_paused_contacts WHERE tenant_id = $1 AND jid = $2',
    [tenantId, jid],
  );
  return row !== null && row !== undefined;
}

export async function getPausedContacts(tenantId: string): Promise<Set<string>> {
  const rows = await query('SELECT jid FROM ai_paused_contacts WHERE tenant_id = $1', [tenantId]);
  return new Set((rows.rows ?? []).map((r: any) => r.jid));
}
