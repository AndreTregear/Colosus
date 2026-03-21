import { query, queryOne } from './pool.js';
import { createRowMapper } from './row-mapper.js';
import type { KeyInfo } from '../crypto/types.js';

const rowToKey = createRowMapper<KeyInfo>({
  id: 'id',
  tenantId: 'tenant_id',
  publicKey: 'public_key',
  keyFingerprint: 'key_fingerprint',
  algorithm: 'algorithm',
  status: 'status',
  createdAt: { col: 'created_at', type: 'date' },
  rotatedAt: { col: 'rotated_at', type: 'date' },
});

export async function registerKey(
  tenantId: string,
  publicKey: string,
  fingerprint: string,
  algorithm: string = 'RSA-OAEP',
): Promise<KeyInfo> {
  const row = await queryOne<Record<string, unknown>>(
    `INSERT INTO tenant_encryption_keys (tenant_id, public_key, key_fingerprint, algorithm)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [tenantId, publicKey, fingerprint, algorithm],
  );
  return rowToKey(row!);
}

export async function getActiveKey(tenantId: string): Promise<KeyInfo | null> {
  const row = await queryOne<Record<string, unknown>>(
    `SELECT * FROM tenant_encryption_keys
     WHERE tenant_id = $1 AND status = 'active'
     ORDER BY created_at DESC LIMIT 1`,
    [tenantId],
  );
  return row ? rowToKey(row) : null;
}

export async function getKeyById(id: string): Promise<KeyInfo | null> {
  const row = await queryOne<Record<string, unknown>>(
    'SELECT * FROM tenant_encryption_keys WHERE id = $1',
    [id],
  );
  return row ? rowToKey(row) : null;
}

export async function getKeyByFingerprint(
  tenantId: string,
  fingerprint: string,
): Promise<KeyInfo | null> {
  const row = await queryOne<Record<string, unknown>>(
    'SELECT * FROM tenant_encryption_keys WHERE tenant_id = $1 AND key_fingerprint = $2',
    [tenantId, fingerprint],
  );
  return row ? rowToKey(row) : null;
}

export async function listKeys(tenantId: string): Promise<KeyInfo[]> {
  const result = await query<Record<string, unknown>>(
    'SELECT * FROM tenant_encryption_keys WHERE tenant_id = $1 ORDER BY created_at DESC',
    [tenantId],
  );
  return result.rows.map(rowToKey);
}

export async function rotateKey(id: string): Promise<void> {
  await query(
    `UPDATE tenant_encryption_keys SET status = 'rotated', rotated_at = now() WHERE id = $1`,
    [id],
  );
}

export async function revokeKey(id: string): Promise<void> {
  await query(
    `UPDATE tenant_encryption_keys SET status = 'revoked' WHERE id = $1`,
    [id],
  );
}
