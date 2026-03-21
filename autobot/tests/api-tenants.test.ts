/**
 * Tests for tenant API endpoints — requires PostgreSQL.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { closePool, query } from '../src/db/pool.js';
import * as tenantsRepo from '../src/db/tenants-repo.js';

// Ensure PG connectivity — if beforeAll fails, Vitest skips all tests in this file
beforeAll(async () => {
  await query('SELECT 1');
});

afterAll(async () => {
  try { await query("DELETE FROM tenants WHERE slug LIKE 'api-test-%'"); } catch { /* PG not available */ }
  try { await closePool(); } catch { /* PG not available */ }
});

describe('tenant API key auth', () => {
  it('should authenticate tenant by API key', async () => {
    const tenant = await tenantsRepo.createTenant({ name: 'API Test', slug: 'api-test-auth' });

    // Valid key should find tenant
    const found = await tenantsRepo.getTenantByApiKey(tenant.apiKey);
    expect(found).toBeDefined();
    expect(found!.id).toBe(tenant.id);

    // Invalid key should return undefined
    const notFound = await tenantsRepo.getTenantByApiKey('invalid-key-12345');
    expect(notFound).toBeUndefined();
  });

  it('should generate unique 64-char API keys', async () => {
    const t1 = await tenantsRepo.createTenant({ name: 'Key Test 1', slug: 'api-test-key1' });
    const t2 = await tenantsRepo.createTenant({ name: 'Key Test 2', slug: 'api-test-key2' });

    expect(t1.apiKey).toHaveLength(64);
    expect(t2.apiKey).toHaveLength(64);
    expect(t1.apiKey).not.toBe(t2.apiKey);
  });
});

describe('tenant CRUD', () => {
  it('full lifecycle: create, read, update, delete', async () => {
    // Create
    const tenant = await tenantsRepo.createTenant({
      name: 'Lifecycle Test',
      slug: 'api-test-lifecycle',
      settings: { currency: 'PEN' },
    });
    expect(tenant.status).toBe('active');

    // Read
    const fetched = await tenantsRepo.getTenantById(tenant.id);
    expect(fetched!.name).toBe('Lifecycle Test');
    expect(fetched!.settings.currency).toBe('PEN');

    // Update
    const updated = await tenantsRepo.updateTenant(tenant.id, {
      name: 'Updated Name',
      settings: { currency: 'USD', yapeNumber: '123456789' },
    });
    expect(updated!.name).toBe('Updated Name');
    expect(updated!.settings.currency).toBe('USD');

    // Delete (soft)
    await tenantsRepo.deleteTenant(tenant.id);
    const deleted = await tenantsRepo.getTenantById(tenant.id);
    expect(deleted!.status).toBe('deleted');
  });
});
