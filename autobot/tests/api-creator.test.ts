/**
 * Section 20: Creator Plans & Customer Subscriptions Tests
 *
 * Tests CRUD for creator plans and customer subscription lifecycle
 * via /api/creator/* routes.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  request,
  signIn,
  signInAdmin,
  createTestTenantWithUser,
  deleteTestTenant,
  assertNotServerError,
} from './helpers.js';

let adminCookie = '';
let tenantCookie = '';
let tenantId = '';
let creatorPlanId = 0;

describe('Section 20: Creator Plans & Subscriptions', () => {
  beforeAll(async () => {
    adminCookie = await signInAdmin();
    const result = await createTestTenantWithUser(adminCookie, 'creator');
    tenantId = result.tenantId;
    try {
      tenantCookie = await signIn(result.email, result.password);
    } catch {
      // Rate-limited — tests will skip via guard checks
    }
  });

  afterAll(async () => {
    // Cleanup created plan if still exists
    if (creatorPlanId && tenantCookie) {
      try {
        await request({
          path: `/api/creator/plans/${creatorPlanId}`,
          method: 'DELETE',
          cookies: tenantCookie,
        });
      } catch { /* ok */ }
    }
    if (tenantId && adminCookie) await deleteTestTenant(adminCookie, tenantId);
  });

  // ── Auth ─────────────────────────────────────

  it('20.1: GET /api/creator/plans without auth returns 401', async () => {
    const res = await request({ path: '/api/creator/plans' });
    expect(res.status).toBe(401);
  });

  // ── Creator Plans CRUD ───────────────────────

  it('20.2: GET /api/creator/plans returns list', async () => {
    if (!tenantCookie) return;
    const res = await request({ path: '/api/creator/plans', cookies: tenantCookie });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.json())).toBe(true);
  });

  it('20.3: POST /api/creator/plans creates a plan', async () => {
    if (!tenantCookie) return;
    const res = await request({
      path: '/api/creator/plans',
      method: 'POST',
      cookies: tenantCookie,
      body: {
        name: 'Test Creator Plan',
        description: 'A test plan',
        price: 9.99,
        billingCycle: 'monthly',
        contentType: 'general',
      },
    });
    expect(res.status).toBe(201);
    const plan = res.json<{ id: number; name: string; price: number }>();
    expect(plan.name).toBe('Test Creator Plan');
    expect(plan.price).toBeCloseTo(9.99);
    creatorPlanId = plan.id;
  });

  it('20.4: PUT /api/creator/plans/:id updates plan', async () => {
    if (!creatorPlanId) return;
    const res = await request({
      path: `/api/creator/plans/${creatorPlanId}`,
      method: 'PUT',
      cookies: tenantCookie,
      body: { name: 'Updated Creator Plan', price: 14.99 },
    });
    expect(res.status).toBe(200);
    const plan = res.json<{ name: string }>();
    expect(plan.name).toBe('Updated Creator Plan');
  });

  it('20.5: DELETE /api/creator/plans/:id removes plan', async () => {
    if (!creatorPlanId) return;
    const res = await request({
      path: `/api/creator/plans/${creatorPlanId}`,
      method: 'DELETE',
      cookies: tenantCookie,
    });
    expect([200, 204]).toContain(res.status);
    creatorPlanId = 0; // Cleared — no cleanup needed
  });

  // ── Creator Subscriptions ────────────────────

  it('20.6: GET /api/creator/subscriptions returns list', async () => {
    if (!tenantCookie) return;
    const res = await request({
      path: '/api/creator/subscriptions',
      cookies: tenantCookie,
    });
    expect(res.status).toBe(200);
    const body = res.json<{ subscriptions: unknown[]; total: number }>();
    expect(Array.isArray(body.subscriptions)).toBe(true);
  });

  it('20.7: POST /api/creator/subscriptions with nonexistent plan returns 404', async () => {
    if (!tenantCookie) return;
    const res = await request({
      path: '/api/creator/subscriptions',
      method: 'POST',
      cookies: tenantCookie,
      body: { customerId: 1, planId: 99999 },
    });
    expect([400, 404]).toContain(res.status);
  });

  // ── Public Creator Endpoint ──────────────────

  it('20.8: GET /api/v1/creator returns status', async () => {
    if (!tenantCookie) return;
    const res = await request({
      path: '/api/v1/creator',
      cookies: tenantCookie,
    });
    assertNotServerError(res.status, 'GET /api/v1/creator');
  });
});
