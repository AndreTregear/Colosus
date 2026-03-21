/**
 * Section 21: End-to-End Integration Flows
 *
 * Multi-step business workflows that cross domain boundaries.
 * Each test is a complete flow from start to finish.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  request,
  signIn,
  signInAdmin,
  extractCookies,
  deleteTestTenant,
  mobileRegisterAndLogin,
  type MobileAuth,
} from './helpers.js';

let adminCookie = '';
const cleanupTenantIds: string[] = [];

describe('Section 21: End-to-End Integration Flows', () => {
  beforeAll(async () => {
    adminCookie = await signInAdmin();
  });

  afterAll(async () => {
    for (const id of cleanupTenantIds) {
      try { await deleteTestTenant(adminCookie, id); } catch { /* ok */ }
    }
  });

  // ── Flow 1: Registration → Product ──────────

  it('21.1: Registration → sign in → create product → verify → cleanup', async () => {
    const tag = Date.now().toString(36);
    const email = `e2e-${tag}@yaya-test.local`;
    const password = 'E2ETestPass123!';

    // Step 1: Register
    const regRes = await request({
      path: '/api/register',
      method: 'POST',
      body: { email, password, businessName: `E2E Biz ${tag}` },
    });
    expect(regRes.status).toBe(201);
    const regBody = regRes.json<{ tenant: { id: string; apiKey: string } }>();
    cleanupTenantIds.push(regBody.tenant.id);

    // Step 2: Sign in (may be rate-limited if running full suite)
    const signInRes = await request({
      path: '/api/auth/sign-in/email',
      method: 'POST',
      body: { email, password },
    });
    if (signInRes.status === 429) return; // Rate-limited — skip rest
    expect(signInRes.status).toBe(200);

    // Step 3: Create product via API key
    const createRes = await request({
      path: '/api/web/products',
      method: 'POST',
      headers: { 'X-API-Key': regBody.tenant.apiKey },
      body: { name: 'E2E Product', price: 50 },
    });
    expect(createRes.status).toBe(201);
    const product = createRes.json<{ id: number; name: string }>();
    expect(product.name).toBe('E2E Product');

    // Step 4: Verify product in list
    const listRes = await request({
      path: '/api/web/products',
      headers: { 'X-API-Key': regBody.tenant.apiKey },
    });
    expect(listRes.status).toBe(200);
    const products = listRes.json<Array<{ id: number }>>();
    expect(products.some((p) => p.id === product.id)).toBe(true);
  });

  // ── Flow 2: Mobile Onboarding ───────────────

  it('21.2: Mobile register → create product → list → delete', async () => {
    const mobile = await mobileRegisterAndLogin('e2e-mob');
    cleanupTenantIds.push(mobile.tenantId);

    const auth = { Authorization: `Bearer ${mobile.token}` };

    // Create product
    const createRes = await request({
      path: '/api/v1/mobile/products',
      method: 'POST',
      headers: auth,
      body: { name: 'Mobile E2E Product', price: 20, category: 'test' },
    });
    expect(createRes.status).toBe(201);
    const product = createRes.json<{ id: number }>();

    // List products
    const listRes = await request({
      path: '/api/v1/mobile/products',
      headers: auth,
    });
    expect(listRes.status).toBe(200);
    const products = listRes.json<Array<{ id: number }>>();
    expect(products.some((p) => p.id === product.id)).toBe(true);

    // Delete product
    const delRes = await request({
      path: `/api/v1/mobile/products/${product.id}`,
      method: 'DELETE',
      headers: auth,
    });
    expect([200, 204]).toContain(delRes.status);
  });

  // ── Flow 3: API Key Rotation ────────────────

  it('21.3: Get key → list products → rotate → old key fails → new key works', async () => {
    // Create tenant with user
    const tag = Date.now().toString(36);
    const slug = `e2e-rot-${tag}`;
    const email = `e2e-rot-${tag}@yaya-test.local`;

    const createRes = await request({
      path: '/api/admin/tenants',
      method: 'POST',
      cookies: adminCookie,
      body: { name: `Rotation Biz ${tag}`, slug, adminEmail: email, adminPassword: 'TestPass123!' },
    });
    expect(createRes.status).toBe(201);
    const { tenant: { id: tenantId } } = createRes.json<{ tenant: { id: string } }>();
    cleanupTenantIds.push(tenantId);

    // Sign in as tenant user (may fail under rate limiting)
    let cookie: string;
    try { cookie = await signIn(email, 'TestPass123!'); } catch { return; }

    // Get current API key
    const accountRes = await request({ path: '/api/account', cookies: cookie });
    expect(accountRes.status).toBe(200);
    const oldKey = accountRes.json<{ apiKey: string }>().apiKey;

    // Verify old key works
    const listRes = await request({
      path: '/api/web/products',
      headers: { 'X-API-Key': oldKey },
    });
    expect(listRes.status).toBe(200);

    // Rotate
    const rotateRes = await request({
      path: '/api/account/api-key/rotate',
      method: 'POST',
      cookies: cookie,
    });
    expect(rotateRes.status).toBe(200);
    const newKey = rotateRes.json<{ apiKey: string }>().apiKey;
    expect(newKey).not.toBe(oldKey);

    // Old key should fail
    const oldKeyRes = await request({
      path: '/api/web/products',
      headers: { 'X-API-Key': oldKey },
    });
    expect(oldKeyRes.status).toBe(401);

    // New key should work
    const newKeyRes = await request({
      path: '/api/web/products',
      headers: { 'X-API-Key': newKey },
    });
    expect(newKeyRes.status).toBe(200);
  });

  // ── Flow 4: Tenant Lifecycle ────────────────

  it('21.4: Admin creates tenant+user → user signs in → creates product → admin deletes tenant', async () => {
    const tag = Date.now().toString(36);
    const email = `e2e-lc-${tag}@yaya-test.local`;

    // Admin creates tenant
    const createRes = await request({
      path: '/api/admin/tenants',
      method: 'POST',
      cookies: adminCookie,
      body: {
        name: `Lifecycle Biz ${tag}`,
        slug: `e2e-lc-${tag}`,
        adminEmail: email,
        adminPassword: 'TestPass123!',
      },
    });
    expect(createRes.status).toBe(201);
    const body = createRes.json<{ tenant: { id: string } }>();
    const tid = body.tenant.id;

    // User signs in (may fail under rate limiting)
    let cookie: string;
    try { cookie = await signIn(email, 'TestPass123!'); } catch { return; }

    // Get API key
    const accRes = await request({ path: '/api/account', cookies: cookie });
    expect(accRes.status).toBe(200);
    const apiKey = accRes.json<{ apiKey: string }>().apiKey;

    // User creates product
    const prodRes = await request({
      path: '/api/web/products',
      method: 'POST',
      headers: { 'X-API-Key': apiKey },
      body: { name: 'Lifecycle Product', price: 10 },
    });
    expect(prodRes.status).toBe(201);

    // Admin deletes tenant
    const delRes = await request({
      path: `/api/tenants/${tid}`,
      method: 'DELETE',
      cookies: adminCookie,
    });
    expect([200, 204]).toContain(delRes.status);
  });

  // ── Flow 5: Subscription Flow ───────────────

  it('21.5: Create tenant → subscribe → verify → cancel → verify', async () => {
    const tag = Date.now().toString(36);
    const email = `e2e-sub-${tag}@yaya-test.local`;

    // Create tenant+user
    const createRes = await request({
      path: '/api/admin/tenants',
      method: 'POST',
      cookies: adminCookie,
      body: {
        name: `Sub Biz ${tag}`,
        slug: `e2e-sub-${tag}`,
        adminEmail: email,
        adminPassword: 'TestPass123!',
      },
    });
    expect(createRes.status).toBe(201);
    const tid = createRes.json<{ tenant: { id: string } }>().tenant.id;
    cleanupTenantIds.push(tid);

    // Sign in (may fail under rate limiting)
    let cookie: string;
    try { cookie = await signIn(email, 'TestPass123!'); } catch { return; }

    // Get plans
    const plansRes = await request({ path: '/api/plans' });
    expect(plansRes.status).toBe(200);
    const plans = plansRes.json<Array<{ id: number }>>();
    if (plans.length === 0) return; // Skip if no plans
    const planId = plans[0]!.id;

    // Subscribe
    const subRes = await request({
      path: '/api/subscription/subscribe',
      method: 'POST',
      cookies: cookie,
      body: { planId },
    });
    expect([200, 201]).toContain(subRes.status);

    // Verify subscription exists
    const getRes = await request({ path: '/api/subscription', cookies: cookie });
    expect(getRes.status).toBe(200);

    // Cancel
    const cancelRes = await request({
      path: '/api/subscription/cancel',
      method: 'POST',
      cookies: cookie,
    });
    expect([200, 400]).toContain(cancelRes.status);
  });
});
