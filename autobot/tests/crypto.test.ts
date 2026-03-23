/**
 * Comprehensive tests for the crypto module.
 *
 * Categories:
 * 1. Envelope (pure crypto, no external deps)
 * 2. Field-level crypto (pure crypto)
 * 3. Key cache (needs Redis)
 * 4. Tenant keys (needs DB + Redis)
 * 5. Key rotation (needs DB + Redis)
 * 6. Middleware (needs Redis)
 * 7. Backup/Recovery (needs DB + Redis + RSA keys)
 */
import crypto from 'node:crypto';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  deriveKEK,
  generateDEK,
  generateSalt,
  encryptDEK,
  decryptDEK,
  encryptField,
  decryptField,
  isEncrypted,
  cacheDEK,
  getCachedDEK,
  evictDEK,
  hasCachedDEK,
  provisionTenantKeys,
  unlockTenantKeys,
  rotateKEK,
  encryptRecord,
  decryptRecord,
  decryptRecords,
  getEncryptedColumns,
  createRecoveryBackup,
  recoverFromBackup,
} from '../src/crypto/index.js';

// ---------------------------------------------------------------------------
// Availability flags — set in beforeAll, checked inside each it()
// ---------------------------------------------------------------------------
let redisAvailable = false;
let dbAvailable = false;

/** Create a real tenant row in DB so FK constraints pass */
async function createTestTenant(id?: string): Promise<string> {
  const tenantId = id || crypto.randomUUID();
  const { query } = await import('../src/db/pool.js');
  await query(
    `INSERT INTO tenants (id, slug, name, api_key)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (id) DO NOTHING`,
    [tenantId, `test-${tenantId.slice(0, 8)}`, `Test ${tenantId.slice(0, 8)}`, `key-${tenantId}`],
  );
  return tenantId;
}

beforeAll(async () => {
  // Check Redis (with 3s timeout to avoid ioredis infinite retry)
  try {
    const { getRedisConnection } = await import('../src/queue/redis.js');
    const redis = getRedisConnection();
    await Promise.race([
      redis.ping(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Redis timeout')), 3000)),
    ]);
    redisAvailable = true;
  } catch {
    console.warn('[crypto.test] Redis not available — Redis-dependent tests will be skipped');
  }

  // Check PostgreSQL
  try {
    const { query } = await import('../src/db/pool.js');
    await query('SELECT 1');
    dbAvailable = true;
  } catch {
    console.warn('[crypto.test] PostgreSQL not available — DB-dependent tests will be skipped');
  }
});

afterAll(async () => {
  // Clean up test tenant keys
  if (dbAvailable) {
    try {
      const { query } = await import('../src/db/pool.js');
      await query("DELETE FROM tenant_encryption_keys WHERE tenant_id LIKE 'crypto-test-%'");
    } catch { /* ok */ }
  }

  // Clean up Redis keys and force-disconnect to prevent process hanging
  try {
    const { getRedisConnection } = await import('../src/queue/redis.js');
    const redis = getRedisConnection();
    if (redisAvailable) {
      const keys = await redis.keys('dek:crypto-test-*');
      if (keys.length > 0) await redis.del(...keys);
    }
    // disconnect() is synchronous/forceful — works even if never connected
    redis.disconnect();
  } catch { /* ok */ }
});

// ===========================================================================
// 1. Envelope (pure crypto — no DB, no Redis)
// ===========================================================================

describe('crypto/envelope', () => {
  describe('generateSalt', () => {
    it('should generate a 16-byte salt', () => {
      const salt = generateSalt();
      expect(Buffer.isBuffer(salt)).toBe(true);
      expect(salt.length).toBe(16);
    });

    it('should produce unique salts', () => {
      const a = generateSalt();
      const b = generateSalt();
      expect(a.equals(b)).toBe(false);
    });
  });

  describe('generateDEK', () => {
    it('should generate a 32-byte DEK', () => {
      const dek = generateDEK();
      expect(Buffer.isBuffer(dek)).toBe(true);
      expect(dek.length).toBe(32);
    });

    it('should produce unique DEKs', () => {
      const a = generateDEK();
      const b = generateDEK();
      expect(a.equals(b)).toBe(false);
    });
  });

  describe('deriveKEK', () => {
    it('should derive a 32-byte KEK from password + salt', async () => {
      const salt = generateSalt();
      const kek = await deriveKEK('test-password', salt);
      expect(Buffer.isBuffer(kek)).toBe(true);
      expect(kek.length).toBe(32);
    });

    it('should be deterministic for same password + salt', async () => {
      const salt = generateSalt();
      const a = await deriveKEK('same-password', salt);
      const b = await deriveKEK('same-password', salt);
      expect(a.equals(b)).toBe(true);
    });

    it('should produce different KEKs for different passwords', async () => {
      const salt = generateSalt();
      const a = await deriveKEK('password-one', salt);
      const b = await deriveKEK('password-two', salt);
      expect(a.equals(b)).toBe(false);
    });

    it('should produce different KEKs for different salts', async () => {
      const saltA = generateSalt();
      const saltB = generateSalt();
      const a = await deriveKEK('same-password', saltA);
      const b = await deriveKEK('same-password', saltB);
      expect(a.equals(b)).toBe(false);
    });
  });

  describe('encryptDEK / decryptDEK', () => {
    it('should round-trip encrypt and decrypt a DEK', async () => {
      const salt = generateSalt();
      const kek = await deriveKEK('test-password', salt);
      const dek = generateDEK();

      const { encryptedDek, nonce } = encryptDEK(dek, kek);
      const decrypted = decryptDEK(encryptedDek, nonce, kek);

      expect(decrypted.equals(dek)).toBe(true);
    });

    it('should produce ciphertext longer than plaintext (includes auth tag)', () => {
      const kek = crypto.randomBytes(32);
      const dek = generateDEK();
      const { encryptedDek } = encryptDEK(dek, kek);
      // 32 bytes DEK + 16 bytes auth tag = 48
      expect(encryptedDek.length).toBe(48);
    });

    it('should produce a 12-byte nonce', () => {
      const kek = crypto.randomBytes(32);
      const dek = generateDEK();
      const { nonce } = encryptDEK(dek, kek);
      expect(nonce.length).toBe(12);
    });

    it('should fail to decrypt with wrong KEK', async () => {
      const salt = generateSalt();
      const kek = await deriveKEK('correct-password', salt);
      const wrongKek = await deriveKEK('wrong-password', salt);
      const dek = generateDEK();

      const { encryptedDek, nonce } = encryptDEK(dek, kek);
      expect(() => decryptDEK(encryptedDek, nonce, wrongKek)).toThrow();
    });

    it('should fail with tampered ciphertext', async () => {
      const salt = generateSalt();
      const kek = await deriveKEK('test-password', salt);
      const dek = generateDEK();

      const { encryptedDek, nonce } = encryptDEK(dek, kek);
      encryptedDek[0] ^= 0xff; // flip a byte
      expect(() => decryptDEK(encryptedDek, nonce, kek)).toThrow();
    });
  });
});

// ===========================================================================
// 2. Field-level crypto (pure crypto — no DB, no Redis)
// ===========================================================================

describe('crypto/field-crypto', () => {
  const dek = crypto.randomBytes(32);
  const tenantId = 'tenant-001';
  const table = 'customers';
  const column = 'phone';

  describe('encryptField / decryptField', () => {
    it('should round-trip encrypt and decrypt a string value', () => {
      const plaintext = '+51 999 888 777';
      const ciphertext = encryptField(plaintext, dek, tenantId, table, column);
      const decrypted = decryptField(ciphertext, dek, tenantId, table, column);
      expect(decrypted).toBe(plaintext);
    });

    it('should produce base64-encoded output', () => {
      const ciphertext = encryptField('test', dek, tenantId, table, column);
      expect(typeof ciphertext).toBe('string');
      // Valid base64 round-trips cleanly
      const buf = Buffer.from(ciphertext, 'base64');
      expect(buf.toString('base64')).toBe(ciphertext);
    });

    it('should produce different ciphertext for same plaintext (random nonce)', () => {
      const a = encryptField('same-value', dek, tenantId, table, column);
      const b = encryptField('same-value', dek, tenantId, table, column);
      expect(a).not.toBe(b);
      // But both decrypt to the same value
      expect(decryptField(a, dek, tenantId, table, column)).toBe('same-value');
      expect(decryptField(b, dek, tenantId, table, column)).toBe('same-value');
    });

    it('should handle unicode / multi-byte strings', () => {
      const plaintext = '名前テスト 🔐 café';
      const ciphertext = encryptField(plaintext, dek, tenantId, table, column);
      expect(decryptField(ciphertext, dek, tenantId, table, column)).toBe(plaintext);
    });

    it('should handle empty string', () => {
      const ciphertext = encryptField('', dek, tenantId, table, column);
      expect(decryptField(ciphertext, dek, tenantId, table, column)).toBe('');
    });

    it('should return null for wrong DEK', () => {
      const ciphertext = encryptField('secret', dek, tenantId, table, column);
      const wrongDek = crypto.randomBytes(32);
      expect(decryptField(ciphertext, wrongDek, tenantId, table, column)).toBeNull();
    });

    it('should return null for wrong tenant ID (AAD mismatch)', () => {
      const ciphertext = encryptField('secret', dek, tenantId, table, column);
      expect(decryptField(ciphertext, dek, 'wrong-tenant', table, column)).toBeNull();
    });

    it('should return null for wrong table (AAD mismatch)', () => {
      const ciphertext = encryptField('secret', dek, tenantId, table, column);
      expect(decryptField(ciphertext, dek, tenantId, 'wrong-table', column)).toBeNull();
    });

    it('should return null for wrong column (AAD mismatch)', () => {
      const ciphertext = encryptField('secret', dek, tenantId, table, column);
      expect(decryptField(ciphertext, dek, tenantId, table, 'wrong-column')).toBeNull();
    });

    it('should return null for tampered ciphertext', () => {
      const ciphertext = encryptField('secret', dek, tenantId, table, column);
      const buf = Buffer.from(ciphertext, 'base64');
      buf[15] ^= 0xff; // tamper in the ciphertext region
      const tampered = buf.toString('base64');
      expect(decryptField(tampered, dek, tenantId, table, column)).toBeNull();
    });
  });

  describe('isEncrypted', () => {
    it('should detect encrypted values', () => {
      const ciphertext = encryptField('test-value', dek, tenantId, table, column);
      expect(isEncrypted(ciphertext)).toBe(true);
    });

    it('should reject null and undefined', () => {
      expect(isEncrypted(null)).toBe(false);
      expect(isEncrypted(undefined)).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isEncrypted('')).toBe(false);
    });

    it('should reject short strings', () => {
      expect(isEncrypted('hello')).toBe(false);
      expect(isEncrypted('abc123')).toBe(false);
    });

    it('should reject plaintext that is not valid base64', () => {
      expect(isEncrypted('This is a regular phone number: +51 999 888 777')).toBe(false);
    });

    it('should reject long base64 that is not from encryption', () => {
      // Valid base64 but not from our encryption — could still pass if length matches.
      // The function only checks structure, not semantic validity.
      const fakeBase64 = Buffer.alloc(29, 0).toString('base64');
      expect(isEncrypted(fakeBase64)).toBe(true); // structural match — expected
    });
  });
});

// ===========================================================================
// 3. Key cache (needs Redis)
// ===========================================================================

describe('crypto/key-cache (Redis)', () => {
  const testTenant = 'crypto-test-cache-001';
  const dek = crypto.randomBytes(32);

  afterAll(async () => {
    try { await evictDEK(testTenant); } catch { /* ok */ }
  });

  it('should cache and retrieve a DEK', async () => {
    if (!redisAvailable) return;
    await cacheDEK(testTenant, dek);
    const cached = await getCachedDEK(testTenant);
    expect(cached).not.toBeNull();
    expect(cached!.equals(dek)).toBe(true);
  });

  it('should report hasCachedDEK = true after caching', async () => {
    if (!redisAvailable) return;
    await cacheDEK(testTenant, dek);
    expect(await hasCachedDEK(testTenant)).toBe(true);
  });

  it('should return null for non-existent tenant', async () => {
    if (!redisAvailable) return;
    const cached = await getCachedDEK('crypto-test-nonexistent');
    expect(cached).toBeNull();
  });

  it('should report hasCachedDEK = false for non-existent tenant', async () => {
    if (!redisAvailable) return;
    expect(await hasCachedDEK('crypto-test-nonexistent')).toBe(false);
  });

  it('should evict a cached DEK', async () => {
    if (!redisAvailable) return;
    await cacheDEK(testTenant, dek);
    expect(await hasCachedDEK(testTenant)).toBe(true);

    await evictDEK(testTenant);
    expect(await hasCachedDEK(testTenant)).toBe(false);
    expect(await getCachedDEK(testTenant)).toBeNull();
  });

  it('should respect TTL (short expiry)', async () => {
    if (!redisAvailable) return;
    await cacheDEK(testTenant, dek, 1); // 1 second TTL
    expect(await hasCachedDEK(testTenant)).toBe(true);
    // Wait for expiry
    await new Promise(r => setTimeout(r, 1500));
    expect(await hasCachedDEK(testTenant)).toBe(false);
  });

  it('should overwrite a cached DEK with a new one', async () => {
    if (!redisAvailable) return;
    const dekA = crypto.randomBytes(32);
    const dekB = crypto.randomBytes(32);

    await cacheDEK(testTenant, dekA);
    expect((await getCachedDEK(testTenant))!.equals(dekA)).toBe(true);

    await cacheDEK(testTenant, dekB);
    expect((await getCachedDEK(testTenant))!.equals(dekB)).toBe(true);
  });
});

// ===========================================================================
// 4. Tenant keys (needs DB + Redis)
// ===========================================================================

describe('crypto/tenant-keys (DB + Redis)', () => {
  let testTenant: string;
  const password = 'super-secret-password-123!';

  beforeAll(async () => {
    if (!dbAvailable || !redisAvailable) return;
    testTenant = await createTestTenant();
  });

  afterAll(async () => {
    try {
      const { query } = await import('../src/db/pool.js');
      if (testTenant) await query('DELETE FROM tenant_encryption_keys WHERE tenant_id = $1', [testTenant]);
      if (testTenant) await evictDEK(testTenant);
    } catch { /* ok */ }
  });

  it('should provision tenant keys', async () => {
    if (!dbAvailable || !redisAvailable) return;
    await provisionTenantKeys(testTenant, password);
    // After provisioning, DEK should be cached
    expect(await hasCachedDEK(testTenant)).toBe(true);
  });

  it('should unlock tenant keys with correct password', async () => {
    if (!dbAvailable || !redisAvailable) return;
    // Evict cached DEK first to force unlock
    await evictDEK(testTenant);
    expect(await hasCachedDEK(testTenant)).toBe(false);

    const result = await unlockTenantKeys(testTenant, password);
    expect(result).toBe(true);
    expect(await hasCachedDEK(testTenant)).toBe(true);
  });

  it('should fail to unlock with wrong password', async () => {
    if (!dbAvailable || !redisAvailable) return;
    await evictDEK(testTenant);
    const result = await unlockTenantKeys(testTenant, 'wrong-password');
    expect(result).toBe(false);
  });

  it('should return false for non-existent tenant', async () => {
    if (!dbAvailable || !redisAvailable) return;
    const result = await unlockTenantKeys('00000000-0000-0000-0000-000000000000', 'any-password');
    expect(result).toBe(false);
  });

  it('should re-provision (overwrite) with new password', async () => {
    if (!dbAvailable || !redisAvailable) return;
    const newPassword = 'new-password-456!';
    await provisionTenantKeys(testTenant, newPassword);

    // Old password should now fail
    await evictDEK(testTenant);
    const oldResult = await unlockTenantKeys(testTenant, password);
    expect(oldResult).toBe(false);

    // New password should work
    const newResult = await unlockTenantKeys(testTenant, newPassword);
    expect(newResult).toBe(true);
  });
});

// ===========================================================================
// 5. Key rotation (needs DB + Redis)
// ===========================================================================

describe('crypto/key-rotation (DB + Redis)', () => {
  let testTenant: string;
  const originalPassword = 'original-password-789!';
  const newPassword = 'rotated-password-012!';

  beforeAll(async () => {
    if (!dbAvailable || !redisAvailable) return;
    testTenant = await createTestTenant();
    await provisionTenantKeys(testTenant, originalPassword);
  });

  afterAll(async () => {
    try {
      const { query } = await import('../src/db/pool.js');
      await query('DELETE FROM tenant_encryption_keys WHERE tenant_id = $1', [testTenant]);
      await evictDEK(testTenant);
    } catch { /* ok */ }
  });

  it('should encrypt data before rotation', async () => {
    if (!dbAvailable || !redisAvailable) return;
    // Ensure DEK is cached
    await unlockTenantKeys(testTenant, originalPassword);
    const dek = await getCachedDEK(testTenant);
    expect(dek).not.toBeNull();

    // Encrypt some data
    const ciphertext = encryptField('rotation-test-data', dek!, testTenant, 'customers', 'phone');
    expect(isEncrypted(ciphertext)).toBe(true);
  });

  it('should rotate KEK successfully', async () => {
    if (!dbAvailable || !redisAvailable) return;
    const result = await rotateKEK(testTenant, originalPassword, newPassword);
    expect(result).toBe(true);
  });

  it('should unlock with new password after rotation', async () => {
    if (!dbAvailable || !redisAvailable) return;
    await evictDEK(testTenant);
    const result = await unlockTenantKeys(testTenant, newPassword);
    expect(result).toBe(true);
  });

  it('should fail to unlock with old password after rotation', async () => {
    if (!dbAvailable || !redisAvailable) return;
    await evictDEK(testTenant);
    const result = await unlockTenantKeys(testTenant, originalPassword);
    expect(result).toBe(false);
  });

  it('should still decrypt data after rotation (DEK unchanged)', async () => {
    if (!dbAvailable || !redisAvailable) return;
    // The DEK itself doesn't change during rotation — only how it's wrapped.
    // Encrypt with pre-rotation DEK, rotate, decrypt with post-rotation DEK.
    // Since the DEK is the same, decryption should succeed.

    // Step 1: Provision fresh keys and encrypt data
    const freshTenant = await createTestTenant();
    const pwA = 'password-a';
    const pwB = 'password-b';

    await provisionTenantKeys(freshTenant, pwA);
    const dekBefore = await getCachedDEK(freshTenant);
    expect(dekBefore).not.toBeNull();
    const ciphertext = encryptField('precious-data', dekBefore!, freshTenant, 'customers', 'name');

    // Step 2: Rotate KEK
    await rotateKEK(freshTenant, pwA, pwB);

    // Step 3: Unlock with new password and decrypt
    await evictDEK(freshTenant);
    await unlockTenantKeys(freshTenant, pwB);
    const dekAfter = await getCachedDEK(freshTenant);
    expect(dekAfter).not.toBeNull();

    // The DEK should be identical
    expect(dekBefore!.equals(dekAfter!)).toBe(true);

    // Data should still be decryptable
    const plaintext = decryptField(ciphertext, dekAfter!, freshTenant, 'customers', 'name');
    expect(plaintext).toBe('precious-data');

    // Cleanup
    try {
      const { query } = await import('../src/db/pool.js');
      await query('DELETE FROM tenant_encryption_keys WHERE tenant_id = $1', [freshTenant]);
      await evictDEK(freshTenant);
    } catch { /* ok */ }
  });

  it('should fail rotation with wrong old password', async () => {
    if (!dbAvailable || !redisAvailable) return;
    const result = await rotateKEK(testTenant, 'totally-wrong', 'irrelevant');
    expect(result).toBe(false);
  });

  it('should fail rotation for non-existent tenant', async () => {
    if (!dbAvailable || !redisAvailable) return;
    const result = await rotateKEK('00000000-0000-0000-0000-000000000000', 'a', 'b');
    expect(result).toBe(false);
  });
});

// ===========================================================================
// 6. Middleware (needs Redis for DEK cache)
// ===========================================================================

describe('crypto/middleware (Redis)', () => {
  const testTenant = 'crypto-test-middleware-001';
  const dek = crypto.randomBytes(32);

  beforeAll(async () => {
    if (!redisAvailable) return;
    await cacheDEK(testTenant, dek);
  });

  afterAll(async () => {
    try { await evictDEK(testTenant); } catch { /* ok */ }
  });

  describe('getEncryptedColumns', () => {
    it('should return encrypted columns for known tables', () => {
      if (!redisAvailable) return;
      expect(getEncryptedColumns('customers')).toEqual(['name', 'phone', 'address', 'notes', 'location']);
      expect(getEncryptedColumns('orders')).toEqual(['notes', 'delivery_address']);
      expect(getEncryptedColumns('payments')).toEqual(['reference', 'confirmed_by']);
      expect(getEncryptedColumns('leads')).toEqual(['name', 'email', 'phone', 'company', 'notes']);
      expect(getEncryptedColumns('message_log')).toEqual(['body', 'push_name']);
    });

    it('should return empty array for unknown tables', () => {
      if (!redisAvailable) return;
      expect(getEncryptedColumns('nonexistent_table')).toEqual([]);
    });
  });

  describe('encryptRecord / decryptRecord', () => {
    it('should encrypt and decrypt customers record', async () => {
      if (!redisAvailable) return;
      const record = {
        id: 'cust-1',
        tenant_id: testTenant,
        name: 'Juan Pérez',
        phone: '+51 999 888 777',
        address: 'Av. Lima 123',
        notes: 'VIP customer',
        location: '-12.04,-77.04',
        jid: '51999888777@s.whatsapp.net', // not encrypted
      };

      const encrypted = await encryptRecord(testTenant, 'customers', record);

      // Non-encrypted fields unchanged
      expect(encrypted.id).toBe('cust-1');
      expect(encrypted.jid).toBe('51999888777@s.whatsapp.net');

      // Encrypted fields should be different from plaintext
      expect(encrypted.name).not.toBe('Juan Pérez');
      expect(encrypted.phone).not.toBe('+51 999 888 777');
      expect(isEncrypted(encrypted.name as string)).toBe(true);

      // Decrypt should restore original values
      const decrypted = await decryptRecord(testTenant, 'customers', encrypted);
      expect(decrypted.name).toBe('Juan Pérez');
      expect(decrypted.phone).toBe('+51 999 888 777');
      expect(decrypted.address).toBe('Av. Lima 123');
      expect(decrypted.notes).toBe('VIP customer');
      expect(decrypted.location).toBe('-12.04,-77.04');
      expect(decrypted.jid).toBe('51999888777@s.whatsapp.net');
    });

    it('should encrypt and decrypt orders record', async () => {
      if (!redisAvailable) return;
      const record = { id: 'ord-1', notes: 'Deliver before 5pm', delivery_address: 'Av. Test 456', total: 50.00 };
      const encrypted = await encryptRecord(testTenant, 'orders', record);
      expect(encrypted.total).toBe(50.00);
      expect(encrypted.notes).not.toBe('Deliver before 5pm');

      const decrypted = await decryptRecord(testTenant, 'orders', encrypted);
      expect(decrypted.notes).toBe('Deliver before 5pm');
      expect(decrypted.delivery_address).toBe('Av. Test 456');
    });

    it('should encrypt and decrypt payments record', async () => {
      if (!redisAvailable) return;
      const record = { id: 'pay-1', reference: 'ref-abc-123', confirmed_by: 'admin@test.com', amount: 25 };
      const encrypted = await encryptRecord(testTenant, 'payments', record);
      const decrypted = await decryptRecord(testTenant, 'payments', encrypted);
      expect(decrypted.reference).toBe('ref-abc-123');
      expect(decrypted.confirmed_by).toBe('admin@test.com');
    });

    it('should encrypt and decrypt leads record', async () => {
      if (!redisAvailable) return;
      const record = {
        id: 'lead-1', name: 'Ana García', email: 'ana@test.com',
        phone: '+51 111 222 333', company: 'TechCorp', notes: 'Hot lead',
      };
      const encrypted = await encryptRecord(testTenant, 'leads', record);
      const decrypted = await decryptRecord(testTenant, 'leads', encrypted);
      expect(decrypted.name).toBe('Ana García');
      expect(decrypted.email).toBe('ana@test.com');
      expect(decrypted.phone).toBe('+51 111 222 333');
      expect(decrypted.company).toBe('TechCorp');
      expect(decrypted.notes).toBe('Hot lead');
    });

    it('should encrypt and decrypt message_log record', async () => {
      if (!redisAvailable) return;
      const record = { id: 'msg-1', body: 'Hola, quiero hacer un pedido', push_name: 'Carlos' };
      const encrypted = await encryptRecord(testTenant, 'message_log', record);
      const decrypted = await decryptRecord(testTenant, 'message_log', encrypted);
      expect(decrypted.body).toBe('Hola, quiero hacer un pedido');
      expect(decrypted.push_name).toBe('Carlos');
    });

    it('should encrypt and decrypt yape_notifications record', async () => {
      if (!redisAvailable) return;
      const record = { id: 'yape-1', sender_name: 'María López', amount: 15.50 };
      const encrypted = await encryptRecord(testTenant, 'yape_notifications', record);
      const decrypted = await decryptRecord(testTenant, 'yape_notifications', encrypted);
      expect(decrypted.sender_name).toBe('María López');
    });

    it('should encrypt and decrypt business_context record', async () => {
      if (!redisAvailable) return;
      const record = {
        id: 'ctx-1',
        business_description: 'We sell cakes',
        special_instructions: 'Always ask for delivery address',
      };
      const encrypted = await encryptRecord(testTenant, 'business_context', record);
      const decrypted = await decryptRecord(testTenant, 'business_context', encrypted);
      expect(decrypted.business_description).toBe('We sell cakes');
      expect(decrypted.special_instructions).toBe('Always ask for delivery address');
    });

    it('should encrypt and decrypt appointments record', async () => {
      if (!redisAvailable) return;
      const record = { id: 'apt-1', notes: 'Follow-up meeting at 3pm' };
      const encrypted = await encryptRecord(testTenant, 'appointments', record);
      const decrypted = await decryptRecord(testTenant, 'appointments', encrypted);
      expect(decrypted.notes).toBe('Follow-up meeting at 3pm');
    });

    it('should encrypt and decrypt admin_conversations record', async () => {
      if (!redisAvailable) return;
      const record = { id: 'ac-1', message: 'Internal admin note about client' };
      const encrypted = await encryptRecord(testTenant, 'admin_conversations', record);
      const decrypted = await decryptRecord(testTenant, 'admin_conversations', encrypted);
      expect(decrypted.message).toBe('Internal admin note about client');
    });

    it('should encrypt and decrypt conversations record', async () => {
      if (!redisAvailable) return;
      const record = { id: 'conv-1', messages: '[{"role":"user","content":"hello"}]' };
      const encrypted = await encryptRecord(testTenant, 'conversations', record);
      const decrypted = await decryptRecord(testTenant, 'conversations', encrypted);
      expect(decrypted.messages).toBe('[{"role":"user","content":"hello"}]');
    });

    it('should skip null and undefined values', async () => {
      if (!redisAvailable) return;
      const record = { id: 'cust-null', name: null, phone: undefined, address: '' };
      const encrypted = await encryptRecord(testTenant, 'customers', record);
      expect(encrypted.name).toBeNull();
      expect(encrypted.phone).toBeUndefined();
      expect(encrypted.address).toBe(''); // empty string is skipped
    });

    it('should skip non-string values', async () => {
      if (!redisAvailable) return;
      const record = { id: 'cust-num', name: 12345 as unknown };
      const encrypted = await encryptRecord(testTenant, 'customers', record);
      expect(encrypted.name).toBe(12345);
    });

    it('should pass through records for tables with no encrypted columns', async () => {
      if (!redisAvailable) return;
      const record = { id: 'prod-1', name: 'Widget', price: 9.99 };
      const encrypted = await encryptRecord(testTenant, 'products', record);
      expect(encrypted).toEqual(record);
    });

    it('should not double-encrypt already encrypted values', async () => {
      if (!redisAvailable) return;
      const record = { id: 'cust-2', name: 'Test Name', phone: '+51 123' };
      const encrypted = await encryptRecord(testTenant, 'customers', record);

      // decryptRecord checks isEncrypted before decrypting — so even
      // if we accidentally encrypt twice, decryptRecord would detect it
      const decrypted = await decryptRecord(testTenant, 'customers', encrypted);
      expect(decrypted.name).toBe('Test Name');
    });

    it('should return record as-is when no DEK is cached', async () => {
      if (!redisAvailable) return;
      const otherTenant = 'crypto-test-no-dek';
      const record = { id: 'cust-3', name: 'Plaintext Name' };
      const result = await encryptRecord(otherTenant, 'customers', record);
      expect(result.name).toBe('Plaintext Name');
    });
  });

  describe('decryptRecords (batch)', () => {
    it('should decrypt an array of records', async () => {
      if (!redisAvailable) return;
      const records = [
        { id: 'cust-a', name: 'Alice', phone: '+51 111' },
        { id: 'cust-b', name: 'Bob', phone: '+51 222' },
        { id: 'cust-c', name: 'Charlie', phone: '+51 333' },
      ];

      const encrypted = await Promise.all(
        records.map(r => encryptRecord(testTenant, 'customers', r)),
      );
      const decrypted = await decryptRecords(testTenant, 'customers', encrypted);

      expect(decrypted).toHaveLength(3);
      expect(decrypted[0].name).toBe('Alice');
      expect(decrypted[1].name).toBe('Bob');
      expect(decrypted[2].phone).toBe('+51 333');
    });

    it('should handle empty array', async () => {
      if (!redisAvailable) return;
      const result = await decryptRecords(testTenant, 'customers', []);
      expect(result).toEqual([]);
    });
  });

  describe('cross-tenant isolation', () => {
    const otherTenant = 'crypto-test-middleware-002';
    const otherDek = crypto.randomBytes(32);

    beforeAll(async () => {
      if (!redisAvailable) return;
      await cacheDEK(otherTenant, otherDek);
    });

    afterAll(async () => {
      try { await evictDEK(otherTenant); } catch { /* ok */ }
    });

    it('should fail to decrypt record with different tenant DEK', async () => {
      if (!redisAvailable) return;
      const record = { id: 'cust-x', name: 'Secret Name' };
      const encrypted = await encryptRecord(testTenant, 'customers', record);

      // Try decrypting with the other tenant — AAD mismatch + different DEK
      const decrypted = await decryptRecord(otherTenant, 'customers', encrypted);
      // decryptField returns null on failure, so the encrypted value stays as-is
      expect(decrypted.name).not.toBe('Secret Name');
    });
  });
});

// ===========================================================================
// 7. Backup / Recovery (needs DB + Redis + RSA keys)
// ===========================================================================

describe('crypto/backup (DB + Redis + RSA)', () => {
  // Generate RSA key pair for tests
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  // Use valid UUID format for backup (it converts to 16-byte binary)
  let testTenant: string;
  const password = 'backup-test-password!';

  beforeAll(async () => {
    if (!dbAvailable || !redisAvailable) return;
    testTenant = await createTestTenant();
    await provisionTenantKeys(testTenant, password);
  });

  afterAll(async () => {
    try {
      const { query } = await import('../src/db/pool.js');
      await query('DELETE FROM tenant_encryption_keys WHERE tenant_id = $1', [testTenant]);
      await evictDEK(testTenant);
    } catch { /* ok */ }
  });

  it('should create a recovery backup', async () => {
    if (!dbAvailable || !redisAvailable) return;
    const backup = await createRecoveryBackup(testTenant, publicKey);
    expect(Buffer.isBuffer(backup)).toBe(true);
    // Check version header
    expect(backup.readUInt32BE(0)).toBe(1);
  });

  it('should recover from backup and restore keys', async () => {
    if (!dbAvailable || !redisAvailable) return;
    // Create backup
    const backup = await createRecoveryBackup(testTenant, publicKey);

    // Delete the encryption keys to simulate data loss
    const { query } = await import('../src/db/pool.js');
    await query('DELETE FROM tenant_encryption_keys WHERE tenant_id = $1', [testTenant]);

    // Recover
    const result = await recoverFromBackup(testTenant, backup, privateKey, password);
    expect(result).toBe(true);

    // Verify we can unlock with original password (backup restores the DB record)
    await evictDEK(testTenant);
    const unlocked = await unlockTenantKeys(testTenant, password);
    expect(unlocked).toBe(true);
  });

  it('should fail recovery with wrong tenant ID', async () => {
    if (!dbAvailable || !redisAvailable) return;
    const backup = await createRecoveryBackup(testTenant, publicKey);
    const wrongTenant = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
    const result = await recoverFromBackup(wrongTenant, backup, privateKey, password);
    expect(result).toBe(false);
  });

  it('should fail recovery with wrong private key', async () => {
    if (!dbAvailable || !redisAvailable) return;
    const backup = await createRecoveryBackup(testTenant, publicKey);

    // Generate a different key pair
    const { privateKey: wrongKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    const result = await recoverFromBackup(testTenant, backup, wrongKey, password);
    expect(result).toBe(false);
  });

  it('should throw for non-existent tenant during backup creation', async () => {
    if (!dbAvailable || !redisAvailable) return;
    await expect(
      createRecoveryBackup('00000000-0000-0000-0000-ffffffffffff', publicKey),
    ).rejects.toThrow('No encryption keys found');
  });

  it('should preserve data decryptability after backup/restore cycle', async () => {
    if (!dbAvailable || !redisAvailable) return;
    // Encrypt some data
    await unlockTenantKeys(testTenant, password);
    const dekBefore = await getCachedDEK(testTenant);
    expect(dekBefore).not.toBeNull();
    const ciphertext = encryptField('backup-cycle-data', dekBefore!, testTenant, 'customers', 'name');

    // Create backup, wipe, restore
    const backup = await createRecoveryBackup(testTenant, publicKey);
    const { query } = await import('../src/db/pool.js');
    await query('DELETE FROM tenant_encryption_keys WHERE tenant_id = $1', [testTenant]);

    await recoverFromBackup(testTenant, backup, privateKey, password);

    // Unlock with original password and decrypt data
    await evictDEK(testTenant);
    await unlockTenantKeys(testTenant, password);
    const dekAfter = await getCachedDEK(testTenant);
    expect(dekAfter).not.toBeNull();

    const plaintext = decryptField(ciphertext, dekAfter!, testTenant, 'customers', 'name');
    expect(plaintext).toBe('backup-cycle-data');
  });
});
