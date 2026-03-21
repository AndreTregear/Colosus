export interface EncryptedPayload {
  /** Base64-encoded encrypted data */
  encryptedData: string;
  /** Base64-encoded DEK, wrapped (encrypted) with tenant's RSA public key */
  wrappedDek: string;
  /** Base64-encoded initialization vector */
  iv: string;
  /** Base64-encoded GCM authentication tag */
  authTag: string;
  /** SHA-256 fingerprint of the public key used for wrapping */
  keyFingerprint: string;
  /** Algorithm used for data encryption */
  algorithm: 'aes-256-gcm';
}

export interface KeyInfo {
  id: string;
  tenantId: string;
  publicKey: string;
  keyFingerprint: string;
  algorithm: string;
  status: 'active' | 'rotated' | 'revoked';
  createdAt: string;
  rotatedAt: string | null;
}
