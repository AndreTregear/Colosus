import { query, queryOne } from '../db/pool.js';
import { generateDEK, generateSalt, encryptDEK, decryptDEK, deriveKEK } from './envelope.js';
import { cacheDEK } from './key-cache.js';
import { logger } from '../shared/logger.js';

interface TenantKeyRecord {
  tenant_id: string;
  encrypted_dek: Buffer;
  dek_salt: Buffer;
  dek_nonce: Buffer;
  key_version: number;
}

/**
 * Provision encryption keys for a new tenant.
 * Called during registration. The DEK is encrypted with a KEK derived from the password.
 */
export async function provisionTenantKeys(tenantId: string, password: string): Promise<void> {
  const salt = generateSalt();
  const kek = await deriveKEK(password, salt);
  const dek = generateDEK();
  const { encryptedDek, nonce } = encryptDEK(dek, kek);

  await query(
    `INSERT INTO tenant_encryption_keys (tenant_id, encrypted_dek, dek_salt, dek_nonce, key_version)
     VALUES ($1, $2, $3, $4, 1)
     ON CONFLICT (tenant_id) DO UPDATE SET
       encrypted_dek = $2, dek_salt = $3, dek_nonce = $4,
       key_version = tenant_encryption_keys.key_version + 1,
       rotated_at = now()`,
    [tenantId, encryptedDek, salt, nonce],
  );

  // Cache the DEK for immediate use
  await cacheDEK(tenantId, dek);

  // Zero out sensitive material
  kek.fill(0);
  dek.fill(0);

  logger.info({ tenantId }, 'Tenant encryption keys provisioned');
}

/**
 * Unlock a tenant's DEK using their password.
 * Called on login. Derives KEK, decrypts DEK, caches in Redis.
 */
export async function unlockTenantKeys(tenantId: string, password: string): Promise<boolean> {
  const record = await queryOne<TenantKeyRecord>(
    'SELECT tenant_id, encrypted_dek, dek_salt, dek_nonce, key_version FROM tenant_encryption_keys WHERE tenant_id = $1',
    [tenantId],
  );

  if (!record) {
    logger.warn({ tenantId }, 'No encryption keys found for tenant');
    return false;
  }

  try {
    const kek = await deriveKEK(password, record.dek_salt);
    const dek = decryptDEK(record.encrypted_dek, record.dek_nonce, kek);

    // Cache the DEK for the session
    await cacheDEK(tenantId, dek);

    // Zero out sensitive material
    kek.fill(0);
    dek.fill(0);

    logger.info({ tenantId, keyVersion: record.key_version }, 'Tenant keys unlocked');
    return true;
  } catch (err) {
    logger.error({ tenantId, err }, 'Failed to unlock tenant keys (wrong password?)');
    return false;
  }
}
