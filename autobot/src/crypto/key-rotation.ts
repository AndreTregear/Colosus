import { query, queryOne } from '../db/pool.js';
import { deriveKEK, generateSalt, encryptDEK, decryptDEK } from './envelope.js';
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
 * Key Rotation — allows changing the tenant's password without
 * re-encrypting every field in the database.
 *
 * How it works:
 * 1. Derive old KEK from old password
 * 2. Decrypt DEK with old KEK
 * 3. Derive new KEK from new password
 * 4. Re-encrypt DEK with new KEK
 * 5. Store new encrypted DEK + new salt + new nonce
 *
 * The DEK itself never changes — only how it's wrapped.
 * All encrypted data remains valid.
 */
export async function rotateKEK(
  tenantId: string,
  oldPassword: string,
  newPassword: string,
): Promise<boolean> {
  const record = await queryOne<TenantKeyRecord>(
    'SELECT tenant_id, encrypted_dek, dek_salt, dek_nonce, key_version FROM tenant_encryption_keys WHERE tenant_id = $1',
    [tenantId],
  );

  if (!record) {
    logger.warn({ tenantId }, 'Key rotation failed: no encryption keys found');
    return false;
  }

  try {
    // Step 1-2: Derive old KEK and decrypt DEK
    const oldKEK = await deriveKEK(oldPassword, record.dek_salt);
    const dek = decryptDEK(record.encrypted_dek, record.dek_nonce, oldKEK);

    // Step 3-4: Derive new KEK and re-encrypt DEK
    const newSalt = generateSalt();
    const newKEK = await deriveKEK(newPassword, newSalt);
    const { encryptedDek: newEncryptedDek, nonce: newNonce } = encryptDEK(dek, newKEK);

    // Step 5: Store new wrapped DEK
    await query(
      `UPDATE tenant_encryption_keys
       SET encrypted_dek = $1, dek_salt = $2, dek_nonce = $3,
           key_version = key_version + 1, rotated_at = now()
       WHERE tenant_id = $4`,
      [newEncryptedDek, newSalt, newNonce, tenantId],
    );

    // Re-cache the DEK so the session continues working
    await cacheDEK(tenantId, dek);

    // Zero out sensitive material
    oldKEK.fill(0);
    newKEK.fill(0);
    dek.fill(0);

    logger.info({ tenantId, newVersion: record.key_version + 1 }, 'KEK rotated successfully');
    return true;
  } catch (err) {
    logger.error({ tenantId, err }, 'Key rotation failed (wrong old password?)');
    return false;
  }
}
