import crypto from 'node:crypto';

/**
 * Encrypt a string field value using AES-256-GCM.
 * AAD includes tenant_id + table + column to prevent ciphertext swapping.
 * Returns base64-encoded string: nonce(12) + ciphertext + authTag(16)
 */
export function encryptField(
  value: string,
  dek: Buffer,
  tenantId: string,
  table: string,
  column: string,
): string {
  const nonce = crypto.randomBytes(12);
  const aad = Buffer.from(`${tenantId}:${table}:${column}`);
  const cipher = crypto.createCipheriv('aes-256-gcm', dek, nonce);
  cipher.setAAD(aad);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([nonce, encrypted, authTag]).toString('base64');
}

/**
 * Decrypt a string field value.
 * Returns null if decryption fails (wrong key, tampered data).
 */
export function decryptField(
  encoded: string,
  dek: Buffer,
  tenantId: string,
  table: string,
  column: string,
): string | null {
  try {
    const data = Buffer.from(encoded, 'base64');
    const nonce = data.subarray(0, 12);
    const authTag = data.subarray(-16);
    const ciphertext = data.subarray(12, -16);
    const aad = Buffer.from(`${tenantId}:${table}:${column}`);
    const decipher = crypto.createDecipheriv('aes-256-gcm', dek, nonce);
    decipher.setAuthTag(authTag);
    decipher.setAAD(aad);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}

/**
 * Check if a value looks like an encrypted field (base64, min length for nonce+tag).
 */
export function isEncrypted(value: string | null | undefined): boolean {
  if (!value) return false;
  // Minimum: 12 (nonce) + 1 (ciphertext) + 16 (tag) = 29 bytes → ~40 base64 chars
  if (value.length < 40) return false;
  try {
    const buf = Buffer.from(value, 'base64');
    return buf.length >= 29 && value === buf.toString('base64');
  } catch {
    return false;
  }
}
