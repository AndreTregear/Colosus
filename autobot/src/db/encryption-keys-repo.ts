import { queryOne } from './pool.js';
import type { TenantEncryptionKeys } from '../crypto/types.js';

interface TenantKeyRow {
  tenant_id: string;
  encrypted_dek: Buffer;
  dek_salt: Buffer;
  dek_nonce: Buffer;
  key_version: number;
  created_at: string;
  rotated_at: string | null;
}

function rowToKeys(row: TenantKeyRow): TenantEncryptionKeys {
  return {
    tenantId: row.tenant_id,
    encryptedDek: Buffer.from(row.encrypted_dek),
    dekSalt: Buffer.from(row.dek_salt),
    dekNonce: Buffer.from(row.dek_nonce),
    keyVersion: row.key_version,
    createdAt: new Date(row.created_at),
    rotatedAt: row.rotated_at ? new Date(row.rotated_at) : null,
  };
}

export async function getKeysByTenantId(tenantId: string): Promise<TenantEncryptionKeys | null> {
  const row = await queryOne<TenantKeyRow>(
    'SELECT * FROM tenant_encryption_keys WHERE tenant_id = $1',
    [tenantId],
  );
  return row ? rowToKeys(row) : null;
}

export async function hasKeys(tenantId: string): Promise<boolean> {
  const row = await queryOne<{ exists: boolean }>(
    'SELECT EXISTS(SELECT 1 FROM tenant_encryption_keys WHERE tenant_id = $1) AS exists',
    [tenantId],
  );
  return row?.exists ?? false;
}
