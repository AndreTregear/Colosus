import { query } from './pool.js';

export interface TokenUsageRecord {
  id: number;
  tenantId: string;
  tenantName?: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  createdAt: string;
}

export interface TokenUsageSummary {
  tenantId: string;
  tenantName: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  requestCount: number;
}

export async function recordTokenUsage(
  tenantId: string,
  model: string,
  promptTokens: number,
  completionTokens: number,
): Promise<void> {
  await query(
    `INSERT INTO token_usage (tenant_id, model, prompt_tokens, completion_tokens, total_tokens)
     VALUES ($1, $2, $3, $4, $5)`,
    [tenantId, model, promptTokens, completionTokens, promptTokens + completionTokens],
  );
}

export async function getTokenUsage(opts: {
  tenantId?: string;
  from?: string;
  to?: string;
}): Promise<TokenUsageRecord[]> {
  let sql = `SELECT tu.id, tu.tenant_id, tu.model, tu.prompt_tokens, tu.completion_tokens,
             tu.total_tokens, tu.created_at, t.name as tenant_name
             FROM token_usage tu JOIN tenants t ON tu.tenant_id = t.id WHERE 1=1`;
  const params: unknown[] = [];
  if (opts.tenantId) {
    params.push(opts.tenantId);
    sql += ` AND tu.tenant_id = $${params.length}`;
  }
  if (opts.from) {
    params.push(opts.from);
    sql += ` AND tu.created_at >= $${params.length}`;
  }
  if (opts.to) {
    params.push(opts.to);
    sql += ` AND tu.created_at <= $${params.length}`;
  }
  sql += ' ORDER BY tu.created_at DESC LIMIT 500';
  const result = await query(sql, params);
  return result.rows.map((r) => ({
    id: Number(r.id),
    tenantId: String(r.tenant_id),
    tenantName: r.tenant_name != null ? String(r.tenant_name) : undefined,
    model: String(r.model),
    promptTokens: Number(r.prompt_tokens),
    completionTokens: Number(r.completion_tokens),
    totalTokens: Number(r.total_tokens),
    createdAt: (r.created_at as Date)?.toISOString?.() ?? String(r.created_at),
  }));
}

export async function getTokenUsageSummary(opts: {
  from?: string;
  to?: string;
}): Promise<TokenUsageSummary[]> {
  let sql = `SELECT tu.tenant_id, t.name as tenant_name,
             SUM(tu.prompt_tokens)::int as prompt_tokens,
             SUM(tu.completion_tokens)::int as completion_tokens,
             SUM(tu.total_tokens)::int as total_tokens,
             COUNT(*)::int as request_count
             FROM token_usage tu JOIN tenants t ON tu.tenant_id = t.id WHERE 1=1`;
  const params: unknown[] = [];
  if (opts.from) {
    params.push(opts.from);
    sql += ` AND tu.created_at >= $${params.length}`;
  }
  if (opts.to) {
    params.push(opts.to);
    sql += ` AND tu.created_at <= $${params.length}`;
  }
  sql += ' GROUP BY tu.tenant_id, t.name ORDER BY total_tokens DESC';
  const result = await query(sql, params);
  return result.rows.map((r) => ({
    tenantId: String(r.tenant_id),
    tenantName: String(r.tenant_name ?? ''),
    promptTokens: Number(r.prompt_tokens),
    completionTokens: Number(r.completion_tokens),
    totalTokens: Number(r.total_tokens),
    requestCount: Number(r.request_count),
  }));
}
