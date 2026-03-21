import { query, queryOne } from './pool.js';
import { createRowMapper } from './row-mapper.js';
import type { TenantSession } from '../shared/types.js';
import type { SessionRow } from './row-types.js';

const rowToSession = createRowMapper<TenantSession>({
  tenantId: 'tenant_id',
  connectionStatus: 'connection_status',
  lastConnectedAt: { col: 'last_connected_at', type: 'date' },
  lastQrAt: { col: 'last_qr_at', type: 'date' },
  reconnectAttempts: 'reconnect_attempts',
  errorMessage: 'error_message',
  updatedAt: { col: 'updated_at', type: 'date' },
});

export async function getSession(tenantId: string): Promise<TenantSession | undefined> {
  const row = await queryOne<SessionRow>('SELECT * FROM tenant_sessions WHERE tenant_id = $1', [tenantId]);
  return row ? rowToSession(row) : undefined;
}

export async function updateConnectionStatus(
  tenantId: string,
  status: 'disconnected' | 'connecting' | 'connected',
  phone?: string,
): Promise<void> {
  const extra = status === 'connected' ? ', last_connected_at = now(), reconnect_attempts = 0' : '';
  await query(
    `UPDATE tenant_sessions SET connection_status = $1, error_message = NULL, updated_at = now()${extra} WHERE tenant_id = $2`,
    [status, tenantId],
  );

  if (phone) {
    await query('UPDATE tenants SET phone = $1, updated_at = now() WHERE id = $2', [phone, tenantId]);
  }
}

export async function updateQrTimestamp(tenantId: string): Promise<void> {
  await query(
    'UPDATE tenant_sessions SET last_qr_at = now(), updated_at = now() WHERE tenant_id = $1',
    [tenantId],
  );
}

export async function incrementReconnectAttempts(tenantId: string, errorMessage?: string): Promise<number> {
  const row = await queryOne<SessionRow>(
    `UPDATE tenant_sessions SET reconnect_attempts = reconnect_attempts + 1,
     error_message = COALESCE($1, error_message), updated_at = now()
     WHERE tenant_id = $2 RETURNING reconnect_attempts`,
    [errorMessage ?? null, tenantId],
  );
  return row?.reconnect_attempts ?? 0;
}

export async function resetReconnectAttempts(tenantId: string): Promise<void> {
  await query(
    'UPDATE tenant_sessions SET reconnect_attempts = 0, error_message = NULL, updated_at = now() WHERE tenant_id = $1',
    [tenantId],
  );
}

export async function setSessionError(tenantId: string, error: string): Promise<void> {
  await query(
    "UPDATE tenant_sessions SET connection_status = 'disconnected', error_message = $1, updated_at = now() WHERE tenant_id = $2",
    [error, tenantId],
  );
}

