/**
 * Tenant Database Provisioner — creates per-tenant PostgreSQL roles with RLS.
 *
 * On tenant registration:
 *   1. Calls create_tenant_role(tenant_id) to create a scoped DB role
 *   2. The role has ALTER ROLE SET app.tenant_id = '<uuid>' baked in
 *   3. RLS policies enforce that the role can ONLY see its own tenant's data
 *   4. Credentials are stored in tenant_service_accounts (service='postgres')
 *
 * The OpenClaw agent sandbox uses these credentials for all DB queries,
 * making prompt-based tenant isolation unnecessary — even raw SQL is safe.
 */

import { query, queryOne } from '../db/pool.js';
import { logger } from '../shared/logger.js';
import { DATABASE_URL } from '../config.js';

interface TenantDbCredentials {
  role: string;
  password: string;
  host: string;
  port: number;
  database: string;
}

/**
 * Parse host, port, and database name from DATABASE_URL.
 */
function parseDbConnectionInfo(): { host: string; port: number; database: string } {
  try {
    const url = new URL(DATABASE_URL);
    return {
      host: url.hostname,
      port: url.port ? Number(url.port) : 5432,
      database: url.pathname.replace(/^\//, '') || 'yaya',
    };
  } catch {
    // Fallback for non-standard connection strings
    return { host: 'localhost', port: 5432, database: 'yaya' };
  }
}

/**
 * Provision a dedicated PostgreSQL role for a tenant.
 * The role is scoped via RLS — it can only see rows where tenant_id matches.
 *
 * Safe to call multiple times: re-creates the role with a rotated password.
 */
export async function provisionTenantDatabase(tenantId: string): Promise<TenantDbCredentials> {
  const connInfo = parseDbConnectionInfo();

  // Call the PG function that creates/updates the role
  const result = await queryOne<{ role_name: string; role_password: string }>(
    'SELECT role_name, role_password FROM create_tenant_role($1)',
    [tenantId],
  );

  if (!result) {
    throw new Error(`create_tenant_role returned no result for tenant ${tenantId}`);
  }

  const { role_name: role, role_password: password } = result;

  // Store credentials in tenant_service_accounts
  // Password is stored in metadata JSONB — the table itself is RLS-protected
  // and tenant roles have NO GRANT access to it
  await query(
    `INSERT INTO tenant_service_accounts (tenant_id, service, external_id, metadata)
     VALUES ($1, 'postgres', $2, $3)
     ON CONFLICT (tenant_id, service) DO UPDATE SET
       external_id = EXCLUDED.external_id,
       metadata = EXCLUDED.metadata`,
    [tenantId, role, JSON.stringify({ password, host: connInfo.host, port: connInfo.port, database: connInfo.database })],
  );

  logger.info({ tenantId, role }, 'Provisioned tenant PostgreSQL role with RLS');

  return { role, password, ...connInfo };
}

/**
 * Retrieve stored DB credentials for a tenant.
 * Returns null if the tenant hasn't been provisioned yet.
 */
export async function getTenantDbCredentials(tenantId: string): Promise<TenantDbCredentials | null> {
  const row = await queryOne<{ external_id: string; metadata: Record<string, unknown> }>(
    'SELECT external_id, metadata FROM tenant_service_accounts WHERE tenant_id = $1 AND service = $2',
    [tenantId, 'postgres'],
  );

  if (!row) return null;

  const connInfo = parseDbConnectionInfo();

  return {
    role: String(row.external_id),
    password: String((row.metadata as Record<string, string>).password || ''),
    host: String((row.metadata as Record<string, string>).host || connInfo.host),
    port: Number((row.metadata as Record<string, number>).port || connInfo.port),
    database: String((row.metadata as Record<string, string>).database || connInfo.database),
  };
}

/**
 * Ensure a tenant has a provisioned DB role, creating one if needed.
 * Idempotent — safe to call on every request (reads from cache first).
 */
export async function ensureTenantDbRole(tenantId: string): Promise<TenantDbCredentials> {
  const existing = await getTenantDbCredentials(tenantId);
  if (existing) return existing;

  return provisionTenantDatabase(tenantId);
}
