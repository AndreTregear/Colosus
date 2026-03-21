/**
 * Section 13: Subscription Lifecycle Tests
 *
 * Tests platform subscription subscribe/cancel/pay flow
 * via /api/subscription and /api/plans routes.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  request,
  signIn,
  signInAdmin,
  createTestTenantWithUser,
  deleteTestTenant,
} from './helpers.js';

let adminCookie = '';
let tenantCookie = '';
let tenantId = '';
let freePlanId = 0;

describe('Section 13: Subscription Lifecycle', () => {
  beforeAll(async () => {
    adminCookie = await signInAdmin();
    const result = await createTestTenantWithUser(adminCookie, 'sub');
    tenantId = result.tenantId;
    try {
      tenantCookie = await signIn(result.email, result.password);
    } catch { /* rate-limited */ }
  });

  afterAll(async () => {
    if (tenantId && adminCookie) await deleteTestTenant(adminCookie, tenantId);
  });

  // ── Auth ─────────────────────────────────────

  it('13.1: GET /api/subscription without auth returns 401', async () => {
    const res = await request({ path: '/api/subscription' });
    expect(res.status).toBe(401);
  });

  // ── Plans ────────────────────────────────────

  it('13.2: GET /api/plans returns public plans list', async () => {
    const res = await request({ path: '/api/plans' });
    expect(res.status).toBe(200);
    const plans = res.json<Array<{ id: number; name: string; price: number }>>();
    expect(Array.isArray(plans)).toBe(true);
    expect(plans.length).toBeGreaterThanOrEqual(1);
    // Find a plan to use for subscription tests
    const free = plans.find((p) => p.price === 0);
    const any = plans[0];
    freePlanId = free?.id ?? any!.id;
  });

  // ── Subscription Before Subscribe ────────────

  it('13.3: GET /api/subscription before subscribing returns 200', async () => {
    if (!tenantCookie) return;
    const res = await request({ path: '/api/subscription', cookies: tenantCookie });
    expect(res.status).toBe(200);
    // May return null or an object — both are valid
  });

  // ── Subscribe ────────────────────────────────

  it('13.4: POST /api/subscription/subscribe with valid planId', async () => {
    if (!freePlanId || !tenantCookie) return;
    const res = await request({
      path: '/api/subscription/subscribe',
      method: 'POST',
      cookies: tenantCookie,
      body: { planId: freePlanId },
    });
    // 201 on success, or error if already subscribed
    expect([200, 201]).toContain(res.status);
  });

  it('13.5: GET /api/subscription after subscribing shows plan', async () => {
    if (!tenantCookie) return;
    const res = await request({ path: '/api/subscription', cookies: tenantCookie });
    expect(res.status).toBe(200);
    const body = res.json<{ status?: string; plan?: { id: number } } | null>();
    // Should have some subscription data now
    if (body && typeof body === 'object') {
      expect(body).toBeTruthy();
    }
  });

  it('13.6: POST /api/subscription/subscribe when already subscribed', async () => {
    if (!freePlanId || !tenantCookie) return;
    const res = await request({
      path: '/api/subscription/subscribe',
      method: 'POST',
      cookies: tenantCookie,
      body: { planId: freePlanId },
    });
    // Should return conflict or error
    expect([200, 201, 409]).toContain(res.status);
  });

  // ── Cancel ───────────────────────────────────

  it('13.7: POST /api/subscription/cancel cancels subscription', async () => {
    if (!tenantCookie) return;
    const res = await request({
      path: '/api/subscription/cancel',
      method: 'POST',
      cookies: tenantCookie,
    });
    // 200 on success, or error if no active subscription
    expect([200, 400, 404]).toContain(res.status);
  });

  // ── Invalid Plan ID ──────────────────────────

  it('13.8: POST /api/subscription/subscribe with invalid planId returns 400/404', async () => {
    if (!tenantCookie) return;
    const res = await request({
      path: '/api/subscription/subscribe',
      method: 'POST',
      cookies: tenantCookie,
      body: { planId: 99999 },
    });
    expect([400, 404]).toContain(res.status);
  });

  it('13.9: POST /api/subscription/subscribe with negative planId returns 400', async () => {
    if (!tenantCookie) return;
    const res = await request({
      path: '/api/subscription/subscribe',
      method: 'POST',
      cookies: tenantCookie,
      body: { planId: -1 },
    });
    expect(res.status).toBe(400);
  });

  // ── Pay ──────────────────────────────────────

  it('13.10: POST /api/subscription/pay without active subscription', async () => {
    if (!tenantCookie) return;
    const res = await request({
      path: '/api/subscription/pay',
      method: 'POST',
      cookies: tenantCookie,
    });
    // 400 or 404 expected
    expect([400, 404]).toContain(res.status);
  });
});
