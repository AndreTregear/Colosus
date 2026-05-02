import { query, queryOne } from './pool.js';
import * as tenantsRepo from './tenants-repo.js';

export async function getSetting(tenantId: string, key: string): Promise<string | undefined> {
  const row = await queryOne<{ value: string }>('SELECT value FROM settings WHERE tenant_id = $1 AND key = $2', [tenantId, key]);
  return row?.value;
}

/**
 * Unified settings lookup with full fallback chain:
 * 1. settings table (per-key store, most specific)
 * 2. tenants.settings JSONB column (camelCase key)
 * 3. provided default
 */
export async function getEffectiveSetting(tenantId: string, key: string, defaultValue: string = ''): Promise<string> {
  const tableSetting = await getSetting(tenantId, key);
  if (tableSetting !== undefined) return tableSetting;

  const tenant = await tenantsRepo.getTenantById(tenantId);
  // Convert snake_case key to camelCase for JSONB lookup
  const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
  const jsonbValue = (tenant?.settings as Record<string, unknown>)?.[camelKey];
  if (jsonbValue !== undefined && jsonbValue !== null) return String(jsonbValue);

  return defaultValue;
}

export async function setSetting(tenantId: string, key: string, value: string): Promise<void> {
  await query(
    `INSERT INTO settings (tenant_id, key, value, updated_at) VALUES ($1, $2, $3, now())
     ON CONFLICT(tenant_id, key) DO UPDATE SET value = $3, updated_at = now()`,
    [tenantId, key, value],
  );
}

export async function getAllSettings(tenantId: string): Promise<Record<string, string>> {
  const result = await query<{ key: string; value: string }>('SELECT key, value FROM settings WHERE tenant_id = $1', [tenantId]);
  const settings: Record<string, string> = {};
  for (const row of result.rows) {
    settings[row.key] = row.value;
  }
  return settings;
}

export async function deleteSetting(tenantId: string, key: string): Promise<void> {
  await query('DELETE FROM settings WHERE tenant_id = $1 AND key = $2', [tenantId, key]);
}
