/**
 * AES-256-GCM symmetric encryption for service-managed secrets that the
 * server itself needs to decrypt at runtime — typically credentials for
 * connecting to other services (per-tenant DB roles, third-party API keys
 * stored on behalf of a tenant).
 *
 * Distinct from the tenant DEK / KEK system in `tenant-keys.ts`: those keys
 * require the tenant's password to unwrap, so they can't protect data the
 * server needs to access without user interaction. This helper uses a
 * master key from the env (SERVICE_SECRET_KEY).
 *
 * Wire format: base64(version || nonce[12] || ciphertext+tag)
 *   - version: 1 byte (currently 0x01)
 *   - nonce:   12 bytes (random per encryption)
 *   - ciphertext+authTag: variable
 *
 * Compromise of SERVICE_SECRET_KEY = compromise of all encrypted blobs, so
 * keep it in a real secrets manager (or at minimum a non-readable env file).
 */

import crypto from 'node:crypto';

const VERSION = 0x01;
const NONCE_LEN = 12;

let cachedKey: Buffer | null = null;

function getKey(): Buffer {
  if (cachedKey) return cachedKey;
  const raw = process.env.SERVICE_SECRET_KEY;
  if (!raw) {
    throw new Error('SERVICE_SECRET_KEY env var is required for service-secret encryption (32+ bytes, base64 or hex)');
  }
  let key: Buffer;
  if (/^[0-9a-fA-F]+$/.test(raw) && raw.length === 64) {
    key = Buffer.from(raw, 'hex');
  } else {
    try {
      key = Buffer.from(raw, 'base64');
    } catch {
      throw new Error('SERVICE_SECRET_KEY must be hex (64 chars) or base64 of 32 bytes');
    }
  }
  if (key.length !== 32) {
    throw new Error(`SERVICE_SECRET_KEY must decode to exactly 32 bytes (got ${key.length})`);
  }
  cachedKey = key;
  return key;
}

/** Encrypt a plaintext string. Returns base64. */
export function encryptServiceSecret(plaintext: string): string {
  const key = getKey();
  const nonce = crypto.randomBytes(NONCE_LEN);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, nonce);
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([Buffer.from([VERSION]), nonce, ct, tag]).toString('base64');
}

/** Decrypt a base64-encoded blob produced by encryptServiceSecret. */
export function decryptServiceSecret(blob: string): string {
  const buf = Buffer.from(blob, 'base64');
  if (buf.length < 1 + NONCE_LEN + 16) {
    throw new Error('Encrypted blob too short');
  }
  if (buf[0] !== VERSION) {
    throw new Error(`Unsupported service-secret version: ${buf[0]}`);
  }
  const nonce = buf.subarray(1, 1 + NONCE_LEN);
  const ctAndTag = buf.subarray(1 + NONCE_LEN);
  const tag = ctAndTag.subarray(ctAndTag.length - 16);
  const ct = ctAndTag.subarray(0, ctAndTag.length - 16);
  const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), nonce);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
}

/** True if the value looks like a service-secret blob (so we can read both
 *  legacy plaintext rows and migrated rows during the rollout window). */
export function looksLikeServiceSecret(value: string): boolean {
  if (!value) return false;
  try {
    const buf = Buffer.from(value, 'base64');
    return buf.length >= 1 + NONCE_LEN + 16 && buf[0] === VERSION;
  } catch {
    return false;
  }
}
