import crypto from 'node:crypto';
import type { EncryptedPayload } from './types.js';

/**
 * Compute the SHA-256 fingerprint of a PEM public key.
 */
export function keyFingerprint(publicKeyPem: string): string {
  return crypto.createHash('sha256').update(publicKeyPem.trim()).digest('hex');
}

/**
 * Encrypt data using envelope encryption:
 * 1. Generate random AES-256-GCM data encryption key (DEK)
 * 2. Encrypt plaintext with DEK
 * 3. Wrap DEK with tenant's RSA public key
 * 4. Return encrypted payload (server never stores the plaintext DEK)
 */
export function encrypt(plaintext: Buffer, publicKeyPem: string): EncryptedPayload {
  // Generate random DEK (256-bit AES key)
  const dek = crypto.randomBytes(32);
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM

  // Encrypt data with DEK using AES-256-GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', dek, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Wrap DEK with tenant's RSA public key
  const wrappedDek = crypto.publicEncrypt(
    {
      key: publicKeyPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    dek,
  );

  // Zero out plaintext DEK from memory
  dek.fill(0);

  return {
    encryptedData: encrypted.toString('base64'),
    wrappedDek: wrappedDek.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    keyFingerprint: keyFingerprint(publicKeyPem),
    algorithm: 'aes-256-gcm',
  };
}

/**
 * Encrypt a string field. Returns a base64-encoded JSON envelope
 * suitable for storage in a TEXT column.
 */
export function encryptField(value: string, publicKeyPem: string): string {
  const payload = encrypt(Buffer.from(value, 'utf-8'), publicKeyPem);
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

/**
 * Parse an encrypted field back to its EncryptedPayload structure.
 * Does NOT decrypt — decryption requires the tenant's private key.
 */
export function parseEncryptedField(encoded: string): EncryptedPayload {
  return JSON.parse(Buffer.from(encoded, 'base64').toString('utf-8'));
}

/**
 * Decrypt data after the client has unwrapped the DEK.
 * This function is provided for server-side use in cases where
 * the tenant explicitly provides their DEK (e.g., data export).
 * Normally, decryption happens client-side.
 */
export function decryptWithDek(payload: EncryptedPayload, dek: Buffer): Buffer {
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    dek,
    Buffer.from(payload.iv, 'base64'),
  );
  decipher.setAuthTag(Buffer.from(payload.authTag, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(payload.encryptedData, 'base64')),
    decipher.final(),
  ]);
}

/**
 * Validate that a PEM string is a valid RSA public key.
 */
export function validatePublicKey(pem: string): boolean {
  try {
    const key = crypto.createPublicKey(pem);
    const details = key.export({ type: 'spki', format: 'der' });
    return details.length > 0 && key.asymmetricKeyType === 'rsa';
  } catch {
    return false;
  }
}

/**
 * Re-wrap a DEK with a new public key (for key rotation).
 * Requires the old private key to unwrap, then wraps with new public key.
 * This is a client-side operation — included here for reference.
 */
export function rewrapDek(
  wrappedDek: string,
  oldPrivateKeyPem: string,
  newPublicKeyPem: string,
): string {
  // Unwrap DEK with old private key
  const dek = crypto.privateDecrypt(
    {
      key: oldPrivateKeyPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    Buffer.from(wrappedDek, 'base64'),
  );

  // Re-wrap with new public key
  const newWrapped = crypto.publicEncrypt(
    {
      key: newPublicKeyPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    dek,
  );

  // Zero out DEK
  dek.fill(0);

  return newWrapped.toString('base64');
}
