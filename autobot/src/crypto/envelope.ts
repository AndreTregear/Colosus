import crypto from 'node:crypto';
import argon2 from 'argon2';

// Argon2id parameters (OWASP recommended)
const ARGON2_TIME_COST = 3;
const ARGON2_MEMORY_COST = 65536; // 64MB
const ARGON2_PARALLELISM = 4;
const ARGON2_HASH_LENGTH = 32; // 256-bit KEK

/**
 * Derive a KEK from a user's password using Argon2id.
 * Returns the raw 32-byte key (not the encoded hash).
 */
export async function deriveKEK(password: string, salt: Buffer): Promise<Buffer> {
  const hash = await argon2.hash(password, {
    type: argon2.argon2id,
    salt,
    timeCost: ARGON2_TIME_COST,
    memoryCost: ARGON2_MEMORY_COST,
    parallelism: ARGON2_PARALLELISM,
    hashLength: ARGON2_HASH_LENGTH,
    raw: true,
  });
  return hash;
}

/**
 * Generate a random DEK (Data Encryption Key).
 */
export function generateDEK(): Buffer {
  return crypto.randomBytes(32);
}

/**
 * Generate a random salt for Argon2id.
 */
export function generateSalt(): Buffer {
  return crypto.randomBytes(16);
}

/**
 * Encrypt a DEK with a KEK using AES-256-GCM.
 * Returns: { encryptedDek, nonce } (both as Buffers)
 */
export function encryptDEK(dek: Buffer, kek: Buffer): { encryptedDek: Buffer; nonce: Buffer } {
  const nonce = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', kek, nonce);
  const encrypted = Buffer.concat([cipher.update(dek), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return { encryptedDek: Buffer.concat([encrypted, authTag]), nonce };
}

/**
 * Decrypt a DEK with a KEK using AES-256-GCM.
 */
export function decryptDEK(encryptedDek: Buffer, nonce: Buffer, kek: Buffer): Buffer {
  const authTag = encryptedDek.subarray(-16);
  const ciphertext = encryptedDek.subarray(0, -16);
  const decipher = crypto.createDecipheriv('aes-256-gcm', kek, nonce);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}
