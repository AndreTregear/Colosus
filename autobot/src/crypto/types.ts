export interface TenantEncryptionKeys {
  tenantId: string;
  encryptedDek: Buffer;
  dekSalt: Buffer;
  dekNonce: Buffer;
  keyVersion: number;
  createdAt: Date;
  rotatedAt: Date | null;
}
