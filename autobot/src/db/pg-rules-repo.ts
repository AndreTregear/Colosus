import { query, queryOne } from './pool.js';
import type { Rule, CreateRuleInput, UpdateRuleInput } from '../shared/types.js';

interface RuleRow {
  id: number;
  tenant_id: string;
  name: string;
  pattern: string;
  match_type: string;
  reply: string;
  scope: string;
  scope_jid: string | null;
  enabled: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

function rowToRule(row: RuleRow): Rule {
  return {
    id: row.id,
    name: row.name,
    pattern: row.pattern,
    matchType: row.match_type as Rule['matchType'],
    reply: row.reply,
    scope: row.scope as Rule['scope'],
    scopeJid: row.scope_jid,
    enabled: row.enabled,
    priority: row.priority,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getAllRules(tenantId: string): Promise<Rule[]> {
  const rows = await query(
    'SELECT * FROM rules WHERE tenant_id = $1 ORDER BY priority ASC, id ASC',
    [tenantId]
  );
  return (rows.rows ?? []).map((r: any) => rowToRule(r));
}

export async function getRuleById(tenantId: string, id: number): Promise<Rule | undefined> {
  const row = await queryOne<RuleRow>(
    'SELECT * FROM rules WHERE tenant_id = $1 AND id = $2',
    [tenantId, id]
  );
  return row ? rowToRule(row) : undefined;
}

export async function getEnabledRulesSorted(tenantId: string): Promise<Rule[]> {
  const rows = await query(
    'SELECT * FROM rules WHERE tenant_id = $1 AND enabled = true ORDER BY priority ASC, id ASC',
    [tenantId]
  );
  return (rows.rows ?? []).map((r: any) => rowToRule(r));
}

export async function createRule(tenantId: string, input: CreateRuleInput): Promise<Rule> {
  const result = await queryOne<RuleRow>(
    `INSERT INTO rules (tenant_id, name, pattern, match_type, reply, scope, scope_jid, enabled, priority)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [tenantId, input.name, input.pattern, input.matchType, input.reply, input.scope, input.scopeJid, input.enabled, input.priority]
  );
  if (!result) throw new Error('Failed to create rule');
  return rowToRule(result);
}

export async function updateRule(tenantId: string, id: number, input: UpdateRuleInput): Promise<Rule | undefined> {
  const existing = await getRuleById(tenantId, id);
  if (!existing) return undefined;

  const merged = {
    name: input.name ?? existing.name,
    pattern: input.pattern ?? existing.pattern,
    matchType: input.matchType ?? existing.matchType,
    reply: input.reply ?? existing.reply,
    scope: input.scope ?? existing.scope,
    scopeJid: input.scopeJid !== undefined ? input.scopeJid : existing.scopeJid,
    enabled: input.enabled !== undefined ? input.enabled : existing.enabled,
    priority: input.priority ?? existing.priority,
  };

  const result = await queryOne<RuleRow>(
    `UPDATE rules SET 
       name = $1, pattern = $2, match_type = $3, reply = $4, 
       scope = $5, scope_jid = $6, enabled = $7, priority = $8, updated_at = now()
     WHERE tenant_id = $9 AND id = $10
     RETURNING *`,
    [merged.name, merged.pattern, merged.matchType, merged.reply, merged.scope, merged.scopeJid, merged.enabled, merged.priority, tenantId, id]
  );
  return result ? rowToRule(result) : undefined;
}

export async function deleteRule(tenantId: string, id: number): Promise<boolean> {
  const result = await query(
    'DELETE FROM rules WHERE tenant_id = $1 AND id = $2',
    [tenantId, id]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function getRulesCount(tenantId: string): Promise<number> {
  const result = await queryOne<{ count: string }>(
    'SELECT COUNT(*)::text AS count FROM rules WHERE tenant_id = $1',
    [tenantId]
  );
  return Number(result?.count ?? 0);
}
