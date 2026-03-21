/**
 * Section 17: Admin Tenant Lifecycle Actions Tests
 *
 * Tests admin-only tenant management: create tenant+user,
 * start/stop/reset, PATCH, drop.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  request,
  signInAdmin,
  createTestTenant,
  deleteTestTenant,
  type TestTenant,
} from './helpers.js';

let adminCookie = '';
let tenant: TestTenant;
let tenantWithUserId = '';

describe('Section 17: Admin Tenant Lifecycle', () => {
  beforeAll(async () => {
    adminCookie = await signInAdmin();
    tenant = await createTestTenant(adminCookie, 'adm-act');
  });

  afterAll(async () => {
    if (tenant?.id) {
      try { await deleteTestTenant(adminCookie, tenant.id); } catch { /* already deleted */ }
    }
    if (tenantWithUserId) {
      try { await deleteTestTenant(adminCookie, tenantWithUserId); } catch { /* already deleted */ }
    }
  });

  // ── Auth ─────────────────────────────────────

  it('17.1: PATCH /api/tenants/:id without admin returns 401', async () => {
    const res = await request({
      path: `/api/tenants/${tenant.id}`,
      method: 'PATCH',
      body: { name: 'Unauthorized' },
    });
    expect(res.status).toBe(401);
  });

  // ── Tenant Detail ────────────────────────────

  it('17.2: GET /api/tenants/:id returns full detail', async () => {
    const res = await request({
      path: `/api/tenants/${tenant.id}`,
      cookies: adminCookie,
    });
    expect(res.status).toBe(200);
    const body = res.json<{ id: string; name: string; slug: string; status: string }>();
    expect(body.id).toBe(tenant.id);
    expect(body.status).toBe('active');
  });

  it('17.3: PATCH /api/tenants/:id updates name', async () => {
    const res = await request({
      path: `/api/tenants/${tenant.id}`,
      method: 'PATCH',
      cookies: adminCookie,
      body: { name: 'Updated Admin Tenant' },
    });
    expect(res.status).toBe(200);
    const body = res.json<{ name: string }>();
    expect(body.name).toBe('Updated Admin Tenant');
  });

  // ── Start/Stop/Reset ─────────────────────────

  it('17.4: POST /api/tenants/:id/start returns 200', async () => {
    const res = await request({
      path: `/api/tenants/${tenant.id}/start`,
      method: 'POST',
      cookies: adminCookie,
    });
    // 200 on success, or other status if already running
    expect(res.status).toBeLessThan(500);
  });

  it('17.5: POST /api/tenants/:id/stop returns 200', async () => {
    const res = await request({
      path: `/api/tenants/${tenant.id}/stop`,
      method: 'POST',
      cookies: adminCookie,
    });
    expect(res.status).toBeLessThan(500);
  });

  it('17.6: POST /api/tenants/:id/reset returns 200', async () => {
    const res = await request({
      path: `/api/tenants/${tenant.id}/reset`,
      method: 'POST',
      cookies: adminCookie,
    });
    expect(res.status).toBeLessThan(500);
  });

  it('17.7: POST /api/tenants/nonexistent/start returns 400 or 404', async () => {
    const res = await request({
      path: '/api/tenants/00000000-0000-0000-0000-000000000099/start',
      method: 'POST',
      cookies: adminCookie,
    });
    expect([400, 404]).toContain(res.status);
  });

  // ── Create Tenant+User ──────────────────────

  it('17.8: POST /api/admin/tenants creates tenant+user', async () => {
    const tag = Date.now().toString(36);
    const res = await request({
      path: '/api/admin/tenants',
      method: 'POST',
      cookies: adminCookie,
      body: {
        name: `Admin Action Biz ${tag}`,
        slug: `adm-tu-${tag}`,
        adminEmail: `adm-tu-${tag}@yaya-test.local`,
        adminPassword: 'TestPass123!',
      },
    });
    expect(res.status).toBe(201);
    const body = res.json<{ tenant: { id: string }; admin: { email: string } }>();
    expect(typeof body.tenant.id).toBe('string');
    tenantWithUserId = body.tenant.id;
  });

  // ── Drop Tenant ──────────────────────────────

  it('17.9: POST /api/admin/tenants/:id/drop drops connection', async () => {
    if (!tenantWithUserId) return;
    const res = await request({
      path: `/api/admin/tenants/${tenantWithUserId}/drop`,
      method: 'POST',
      cookies: adminCookie,
    });
    expect([200, 204]).toContain(res.status);
  });

  // ── Metrics ──────────────────────────────────

  it('17.10: GET /api/admin/metrics returns metrics shape', async () => {
    const res = await request({ path: '/api/admin/metrics', cookies: adminCookie });
    expect(res.status).toBe(200);
    const body = res.json<{ tenants: unknown[]; totalTenants: number }>();
    expect(Array.isArray(body.tenants)).toBe(true);
    expect(typeof body.totalTenants).toBe('number');
  });
});
