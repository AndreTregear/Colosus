export { deriveKEK, generateDEK, generateSalt, encryptDEK, decryptDEK } from './envelope.js';
export { encryptField, decryptField, isEncrypted } from './field-crypto.js';
export { cacheDEK, getCachedDEK, evictDEK, hasCachedDEK } from './key-cache.js';
export { provisionTenantKeys, unlockTenantKeys } from './tenant-keys.js';
export { encryptRecord, decryptRecord, decryptRecords, getEncryptedColumns } from './middleware.js';
export type { TenantEncryptionKeys } from './types.js';
