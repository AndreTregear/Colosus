/**
 * Security headers + encryption integration tests.
 *
 * - Security Headers: Express test server, no DB needed
 * - Encryption Integration: PostgreSQL + Redis required
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import http from 'node:http';
import type { Server } from 'node:http';
import crypto from 'node:crypto';
import { securityHeaders } from '../src/web/middleware/security-headers.js';
import {
  provisionTenantKeys,
  unlockTenantKeys,
  encryptRecord,
  decryptRecord,
  encryptField,
  decryptField,
  isEncrypted,
  rotateKEK,
  evictDEK,
} from '../src/crypto/index.js';
import { query, closePool } from '../src/db/pool.js';
import { closeRedis } from '../src/queue/redis.js';

// ── Security Headers ──────────────────────────────────────────────────

describe('security headers', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    const app = express();
    app.use(securityHeaders());
    app.get('/test', (_req, res) => res.json({ ok: true }));

    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => resolve());
    });
    const addr = server.address() as { port: number };
    baseUrl = `http://127.0.0.1:${addr.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve())),
    );
  });

  async function fetchHeaders(headers?: Record<string, string>) {
    const res = await fetch(`${baseUrl}/test`, { headers });
    return { status: res.status, headers: res.headers };
  }

  it('sets all expected security headers', async () => {
    const { headers } = await fetchHeaders();
    expect(headers.get('x-content-type-options')).toBe('nosniff');
    expect(headers.get('x-frame-options')).toBe('DENY');
    expect(headers.get('x-xss-protection')).toBe('0');
    expect(headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin');
    expect(headers.get('permissions-policy')).toBeTruthy();
    expect(headers.get('content-security-policy')).toBeTruthy();
  });

  it('CSP contains required directives', async () => {
    const { headers } = await fetchHeaders();
    const csp = headers.get('content-security-policy')!;
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("style-src 'self'");
    expect(csp).toContain("img-src 'self'");
    expect(csp).toContain("connect-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
  });

  it('X-Frame-Options is DENY', async () => {
    const { headers } = await fetchHeaders();
    expect(headers.get('x-frame-options')).toBe('DENY');
  });

  it('Permissions-Policy disables camera, microphone, geolocation', async () => {
    const { headers } = await fetchHeaders();
    const pp = headers.get('permissions-policy')!;
    expect(pp).toContain('camera=()');
    expect(pp).toContain('microphone=()');
    expect(pp).toContain('geolocation=()');
  });

  it('HSTS absent in non-production env', async () => {
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';
    try {
      const { headers } = await fetchHeaders();
      expect(headers.get('strict-transport-security')).toBeNull();
    } finally {
      process.env.NODE_ENV = origEnv;
    }
  });

  it('HSTS present when NODE_ENV=production and non-localhost host', async () => {
    // Create a separate Express app that simulates production + non-localhost
    const app = express();
    app.use(securityHeaders());
    app.get('/test', (_req, res) => res.json({ ok: true }));

    const prodServer = await new Promise<Server>((resolve) => {
      const s = app.listen(0, '127.0.0.1', () => resolve(s));
    });
    const prodPort = (prodServer.address() as { port: number }).port;

    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      // Use http.request to reliably set Host header (fetch may ignore it)
      const res = await new Promise<http.IncomingMessage>((resolve, reject) => {
        const req = http.request(
          { hostname: '127.0.0.1', port: prodPort, path: '/test', headers: { Host: 'app.example.com' } },
          resolve,
        );
        req.on('error', reject);
        req.end();
      });
      expect(res.headers['strict-transport-security']).toBe(
        'max-age=31536000; includeSubDomains',
      );
    } finally {
      process.env.NODE_ENV = origEnv;
      await new Promise<void>((resolve, reject) =>
        prodServer.close((err) => (err ? reject(err) : resolve())),
      );
    }
  });

  it('HSTS absent for localhost even in production', async () => {
    const addr = server.address() as { port: number };
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const res = await new Promise<http.IncomingMessage>((resolve, reject) => {
        const req = http.request(
          { hostname: '127.0.0.1', port: addr.port, path: '/test', headers: { Host: 'localhost' } },
          resolve,
        );
        req.on('error', reject);
        req.end();
      });
      expect(res.headers['strict-transport-security']).toBeUndefined();
    } finally {
      process.env.NODE_ENV = origEnv;
    }
  });
});

// ── Encryption Integration ────────────────────────────────────────────

describe('encryption integration', () => {
  const testTenantIds: string[] = [];
  let dbAvailable = false;

  beforeAll(async () => {
    // Check DB connectivity
    try {
      await query('SELECT 1');
      dbAvailable = true;
    } catch {
      console.warn('⚠ PostgreSQL not available — skipping encryption integration tests');
      return;
    }

    // Ensure schema exists
    await query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(20),
        api_key VARCHAR(64) UNIQUE NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        settings JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await query(`
      CREATE TABLE IF NOT EXISTS tenant_encryption_keys (
        tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
        encrypted_dek BYTEA NOT NULL,
        dek_salt BYTEA NOT NULL,
        dek_nonce BYTEA NOT NULL,
        key_version INT NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        rotated_at TIMESTAMPTZ
      )
    `);
    // Customers table for full round-trip tests
    await query(`
      CREATE TABLE IF NOT EXISTS customers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name TEXT,
        phone TEXT,
        address TEXT,
        notes TEXT,
        location TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
  });

  afterAll(async () => {
    if (dbAvailable) {
      // Clean up test tenants (CASCADE deletes encryption keys + customers)
      for (const id of testTenantIds) {
        await query('DELETE FROM tenants WHERE id = $1', [id]).catch(() => {});
      }
    }
    await closePool();
    await closeRedis();
  });

  /** Create a test tenant row and return its UUID. */
  async function createTestTenant(): Promise<string> {
    const id = crypto.randomUUID();
    const slug = `sec-test-${id.slice(0, 8)}`;
    const apiKey = crypto.randomBytes(32).toString('hex');
    await query(
      'INSERT INTO tenants (id, name, slug, api_key) VALUES ($1, $2, $3, $4)',
      [id, `Security Test ${slug}`, slug, apiKey],
    );
    testTenantIds.push(id);
    return id;
  }

  // -- Full round-trip --

  it('encrypt → DB insert → DB select → decrypt round-trip', async () => {
    if (!dbAvailable) return;

    const tenantId = await createTestTenant();
    const password = 'test-password-42!';
    await provisionTenantKeys(tenantId, password);

    const plainRecord = {
      name: 'María García',
      phone: '+51987654321',
      address: 'Av. Larco 345, Miraflores',
      notes: 'VIP customer',
    };

    // Encrypt and store
    const encrypted = await encryptRecord(tenantId, 'customers', plainRecord);
    expect(encrypted.name).not.toBe(plainRecord.name);
    expect(encrypted.phone).not.toBe(plainRecord.phone);

    const inserted = await query(
      `INSERT INTO customers (tenant_id, name, phone, address, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, tenant_id, name, phone, address, notes`,
      [tenantId, encrypted.name, encrypted.phone, encrypted.address, encrypted.notes],
    );
    const dbRow = inserted.rows[0];

    // DB stores ciphertext
    expect(dbRow.name).not.toBe(plainRecord.name);
    expect(isEncrypted(dbRow.name as string)).toBe(true);

    // Decrypt from DB
    const decrypted = await decryptRecord(tenantId, 'customers', dbRow as Record<string, unknown>);
    expect(decrypted.name).toBe(plainRecord.name);
    expect(decrypted.phone).toBe(plainRecord.phone);
    expect(decrypted.address).toBe(plainRecord.address);
    expect(decrypted.notes).toBe(plainRecord.notes);
  });

  // -- Cross-tenant isolation --

  it('tenant A key cannot decrypt tenant B data', async () => {
    if (!dbAvailable) return;

    const tenantA = await createTestTenant();
    const tenantB = await createTestTenant();
    await provisionTenantKeys(tenantA, 'password-A');
    await provisionTenantKeys(tenantB, 'password-B');

    const record = { name: 'Secret Name', phone: '+51111111111' };
    const encryptedA = await encryptRecord(tenantA, 'customers', record);

    // Try to decrypt tenant A's data using tenant B's context
    const attemptDecrypt = await decryptRecord(tenantB, 'customers', {
      name: encryptedA.name,
      phone: encryptedA.phone,
    });

    // AAD mismatch → decryptField returns null → original ciphertext remains
    expect(attemptDecrypt.name).not.toBe('Secret Name');
    expect(attemptDecrypt.phone).not.toBe('+51111111111');
  });

  // -- Key rotation --

  it('key rotation: old data decryptable after KEK change', async () => {
    if (!dbAvailable) return;

    const tenantId = await createTestTenant();
    const oldPassword = 'old-pass-123';
    const newPassword = 'new-pass-456';

    await provisionTenantKeys(tenantId, oldPassword);

    // Encrypt data with original key
    const plainRecord = { name: 'Rotation Test', phone: '+51999999999' };
    const encrypted = await encryptRecord(tenantId, 'customers', plainRecord);

    await query(
      `INSERT INTO customers (tenant_id, name, phone)
       VALUES ($1, $2, $3)`,
      [tenantId, encrypted.name, encrypted.phone],
    );

    // Rotate KEK
    const rotated = await rotateKEK(tenantId, oldPassword, newPassword);
    expect(rotated).toBe(true);

    // Evict cached DEK to force re-unlock
    await evictDEK(tenantId);

    // Unlock with new password
    const unlocked = await unlockTenantKeys(tenantId, newPassword);
    expect(unlocked).toBe(true);

    // Read the same ciphertext from DB and decrypt
    const rows = await query(
      'SELECT name, phone FROM customers WHERE tenant_id = $1',
      [tenantId],
    );
    const decrypted = await decryptRecord(tenantId, 'customers', rows.rows[0] as Record<string, unknown>);
    expect(decrypted.name).toBe('Rotation Test');
    expect(decrypted.phone).toBe('+51999999999');
  });

  // -- Null/undefined field handling --

  it('encryptRecord handles null and undefined fields gracefully', async () => {
    if (!dbAvailable) return;

    const tenantId = await createTestTenant();
    await provisionTenantKeys(tenantId, 'pass');

    const record = { name: null, phone: undefined, address: '', notes: 'has value' };
    const encrypted = await encryptRecord(tenantId, 'customers', record as Record<string, unknown>);

    // null, undefined, and empty string should pass through unchanged
    expect(encrypted.name).toBeNull();
    expect(encrypted.phone).toBeUndefined();
    expect(encrypted.address).toBe('');
    // non-empty string should be encrypted
    expect(encrypted.notes).not.toBe('has value');
    expect(isEncrypted(encrypted.notes as string)).toBe(true);
  });

  // -- Double-encrypt detection --

  it('encryptRecord does not double-encrypt already-encrypted values', async () => {
    if (!dbAvailable) return;

    const tenantId = await createTestTenant();
    await provisionTenantKeys(tenantId, 'pass');

    const record = { name: 'Original', phone: '+51555555555' };
    const encryptedOnce = await encryptRecord(tenantId, 'customers', record);
    const encryptedTwice = await encryptRecord(tenantId, 'customers', encryptedOnce);

    // Decrypt should recover original values regardless of double-encrypt attempt
    const decrypted = await decryptRecord(tenantId, 'customers', encryptedTwice);
    expect(decrypted.name).toBe('Original');
    expect(decrypted.phone).toBe('+51555555555');
  });

  // -- Multiple encrypted columns --

  it('encrypts and decrypts multiple columns in one record', async () => {
    if (!dbAvailable) return;

    const tenantId = await createTestTenant();
    await provisionTenantKeys(tenantId, 'pass');

    const record = {
      name: 'Multi Column',
      phone: '+51222222222',
      address: 'Calle Falsa 123',
      notes: 'Important note',
      location: '-12.0464,-77.0428',
    };

    const encrypted = await encryptRecord(tenantId, 'customers', record);

    // All five encrypted columns should be ciphertext
    for (const col of ['name', 'phone', 'address', 'notes', 'location']) {
      expect(encrypted[col]).not.toBe(record[col as keyof typeof record]);
      expect(isEncrypted(encrypted[col] as string)).toBe(true);
    }

    const decrypted = await decryptRecord(tenantId, 'customers', encrypted);
    expect(decrypted).toMatchObject(record);
  });

  // -- Unicode round-trip --

  it('unicode text survives encrypt/decrypt round-trip', async () => {
    if (!dbAvailable) return;

    const tenantId = await createTestTenant();
    await provisionTenantKeys(tenantId, 'pass');

    const record = {
      name: 'José María Pérez Ñoño',
      phone: '+51333333333',
      address: 'Cañón del Colca, Señor de Sipán',
      notes: 'Contraseña: año, niño, piñata 🎉',
    };

    const encrypted = await encryptRecord(tenantId, 'customers', record);

    // Store in DB and read back
    const inserted = await query(
      `INSERT INTO customers (tenant_id, name, phone, address, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING name, phone, address, notes`,
      [tenantId, encrypted.name, encrypted.phone, encrypted.address, encrypted.notes],
    );

    const decrypted = await decryptRecord(
      tenantId,
      'customers',
      inserted.rows[0] as Record<string, unknown>,
    );
    expect(decrypted.name).toBe(record.name);
    expect(decrypted.phone).toBe(record.phone);
    expect(decrypted.address).toBe(record.address);
    expect(decrypted.notes).toBe(record.notes);
  });
});
