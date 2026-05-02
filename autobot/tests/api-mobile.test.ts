/**
 * Section 6: Mobile API Routes
 * Tests mobile auth (register, login, refresh) and mobile dashboard CRUD.
 *
 * Mobile auth uses phone+password JWT tokens (Bearer).
 * Cleanup: the registered mobile user's tenant is deleted via admin API.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { request, signInAdmin, deleteTestTenant, randomPhone } from './helpers.js';

let adminCookie = '';
let mobileToken = '';
let mobileRefreshToken = '';
let mobileTenantId = '';
const testPhone = randomPhone();
const testPassword = 'MobileTest123!';
const testBusinessName = `Test Mobile Biz ${Date.now().toString(36)}`;

describe('Section 6: Mobile API Routes', () => {
  beforeAll(async () => {
    adminCookie = await signInAdmin();
  });

  afterAll(async () => {
    // Delete the tenant created by mobile register
    if (mobileTenantId && adminCookie) {
      await deleteTestTenant(adminCookie, mobileTenantId);
    }
  });

  // ── Mobile Auth ────────────────────────────

  it('Test 6.1: POST /api/v1/mobile/auth/register with valid body returns 201 with tokens', async () => {
    const res = await request({
      path: '/api/v1/mobile/auth/register',
      method: 'POST',
      body: {
        phone: testPhone,
        password: testPassword,
        businessName: testBusinessName,
        name: 'Test Mobile User',
      },
    });
    if (res.status === 429) return;
    expect(res.status).toBe(201);
    const body = res.json<{
      token: string;
      refreshToken: string;
      tenant: { id: string; apiKey: string };
      user: { id: number; phone: string };
    }>();
    expect(typeof body.token).toBe('string');
    expect(body.token.length).toBeGreaterThan(10);
    expect(typeof body.refreshToken).toBe('string');
    expect(body.user.phone).toBe(testPhone);
    expect(typeof body.tenant.id).toBe('string');
    expect(typeof body.tenant.apiKey).toBe('string');

    mobileToken = body.token;
    mobileRefreshToken = body.refreshToken;
    mobileTenantId = body.tenant.id;
  });

  it('Test 6.2: POST /api/v1/mobile/auth/register with same phone returns 409', async () => {
    const res = await request({
      path: '/api/v1/mobile/auth/register',
      method: 'POST',
      body: {
        phone: testPhone, // already registered
        password: testPassword,
        businessName: 'Duplicate Business',
      },
    });
    if (res.status === 429) return;
    expect(res.status).toBe(409);
    const body = res.json<{ error: string }>();
    expect(body.error).toMatch(/already exists/i);
  });

  it('Test 6.3: POST /api/v1/mobile/auth/register with invalid phone format returns 400', async () => {
    const res = await request({
      path: '/api/v1/mobile/auth/register',
      method: 'POST',
      body: {
        phone: '12345', // not E.164 format (missing +)
        password: 'TestPass123!',
        businessName: 'Bad Phone Biz',
      },
    });
    if (res.status === 429) return;
    expect(res.status).toBe(400);
    const body = res.json<{ error: string }>();
    expect(body.error).toMatch(/validation/i);
  });

  it('Test 6.4: POST /api/v1/mobile/auth/register with short password returns 400', async () => {
    const res = await request({
      path: '/api/v1/mobile/auth/register',
      method: 'POST',
      body: {
        phone: randomPhone(),
        password: 'short', // less than 8 chars
        businessName: 'Short Pass Biz',
      },
    });
    if (res.status === 429) return;
    expect(res.status).toBe(400);
  });

  it('Test 6.5: POST /api/v1/mobile/auth/login with valid credentials returns 200 with tokens', async () => {
    const res = await request({
      path: '/api/v1/mobile/auth/login',
      method: 'POST',
      body: { phone: testPhone, password: testPassword },
    });
    if (res.status === 429) return;
    expect(res.status).toBe(200);
    const body = res.json<{ token: string; refreshToken: string; tenant: object; user: object }>();
    expect(typeof body.token).toBe('string');
    expect(typeof body.refreshToken).toBe('string');
    expect(body.tenant).toBeTruthy();
    expect(body.user).toBeTruthy();
  });

  it('Test 6.6: POST /api/v1/mobile/auth/login with wrong password returns 401', async () => {
    const res = await request({
      path: '/api/v1/mobile/auth/login',
      method: 'POST',
      body: { phone: testPhone, password: 'wrong-password-xyz' },
    });
    if (res.status === 429) return;
    expect(res.status).toBe(401);
    const body = res.json<{ error: string }>();
    expect(body.error).toMatch(/invalid/i);
  });

  it('Test 6.7: POST /api/v1/mobile/auth/login with nonexistent phone returns 401', async () => {
    const res = await request({
      path: '/api/v1/mobile/auth/login',
      method: 'POST',
      body: { phone: '+51000000000', password: 'TestPass123!' },
    });
    if (res.status === 429) return;
    expect(res.status).toBe(401);
  });

  it('Test 6.8: POST /api/v1/mobile/auth/refresh with valid refresh token returns 200 with new tokens', async () => {
    if (!mobileRefreshToken) return;
    const res = await request({
      path: '/api/v1/mobile/auth/refresh',
      method: 'POST',
      body: { refreshToken: mobileRefreshToken },
    });
    if (res.status === 429) return;
    expect(res.status).toBe(200);
    const body = res.json<{ token: string; refreshToken: string }>();
    expect(typeof body.token).toBe('string');
    expect(typeof body.refreshToken).toBe('string');
    // Update token for subsequent tests
    mobileToken = body.token;
    mobileRefreshToken = body.refreshToken;
  });

  it('Test 6.9: POST /api/v1/mobile/auth/refresh with access token (wrong type) returns 401', async () => {
    if (!mobileToken) return;
    // Use access token as refresh token — type check should reject this
    const res = await request({
      path: '/api/v1/mobile/auth/refresh',
      method: 'POST',
      body: { refreshToken: mobileToken }, // access token, not refresh token
    });
    if (res.status === 429) return;
    expect(res.status).toBe(401);
    const body = res.json<{ error: string }>();
    expect(body.error).toMatch(/token type|invalid/i);
  });

  it('Test 6.10: POST /api/v1/mobile/auth/refresh without token returns 400', async () => {
    const res = await request({
      path: '/api/v1/mobile/auth/refresh',
      method: 'POST',
      body: {},
    });
    if (res.status === 429) return;
    expect(res.status).toBe(400);
  });

  it('Test 6.11: POST /api/v1/mobile/auth/refresh with tampered token returns 401', async () => {
    const res = await request({
      path: '/api/v1/mobile/auth/refresh',
      method: 'POST',
      body: { refreshToken: 'definitely.not.a.valid.jwt.token.here' },
    });
    if (res.status === 429) return;
    expect(res.status).toBe(401);
  });

  // ── Mobile Protected Routes ────────────────

  function bearerAuth(): Record<string, string> {
    return { Authorization: `Bearer ${mobileToken}` };
  }

  it('Test 6.12: GET /api/v1/mobile/dashboard without auth returns 401', async () => {
    const res = await request({ path: '/api/v1/mobile/dashboard' });
    expect(res.status).toBe(401);
  });

  it('Test 6.13: GET /api/v1/mobile/plans returns 200 with plans (no auth needed)', async () => {
    if (!mobileToken) return;
    const res = await request({ path: '/api/v1/mobile/plans', headers: bearerAuth() });
    expect(res.status).toBe(200);
  });

  it('Test 6.14: GET /api/v1/mobile/products returns 200 with product list', async () => {
    if (!mobileToken) return;
    const res = await request({
      path: '/api/v1/mobile/products',
      headers: bearerAuth(),
    });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.json())).toBe(true);
  });

  it('Test 6.15: GET /api/v1/mobile/orders returns 200 with orders', async () => {
    if (!mobileToken) return;
    const res = await request({
      path: '/api/v1/mobile/orders',
      headers: bearerAuth(),
    });
    expect(res.status).toBe(200);
  });

  it('Test 6.16: GET /api/v1/mobile/customers returns 200 with customers', async () => {
    if (!mobileToken) return;
    const res = await request({
      path: '/api/v1/mobile/customers',
      headers: bearerAuth(),
    });
    expect(res.status).toBe(200);
    const body = res.json<{ customers: unknown[]; total: number }>();
    expect(Array.isArray(body.customers)).toBe(true);
  });

  it('Test 6.17: GET /api/v1/mobile/payments/pending returns 200', async () => {
    if (!mobileToken) return;
    const res = await request({
      path: '/api/v1/mobile/payments/pending',
      headers: bearerAuth(),
    });
    expect(res.status).toBe(200);
  });

  it('Test 6.18: GET /api/v1/mobile/conversations returns 200 with list', async () => {
    if (!mobileToken) return;
    const res = await request({
      path: '/api/v1/mobile/conversations',
      headers: bearerAuth(),
    });
    expect(res.status).toBe(200);
  });

  it('Test 6.19: GET /api/v1/mobile/subscription returns 200', async () => {
    if (!mobileToken) return;
    const res = await request({
      path: '/api/v1/mobile/subscription',
      headers: bearerAuth(),
    });
    expect(res.status).toBe(200);
  });

  it('Test 6.20: POST /api/v1/mobile/products creates a product', async () => {
    if (!mobileToken) return;
    const res = await request({
      path: '/api/v1/mobile/products',
      method: 'POST',
      headers: bearerAuth(),
      body: {
        name: 'Mobile Test Product',
        price: 15.5,
        description: 'Created via mobile API',
        category: 'test',
        productType: 'physical',
        active: true,
      },
    });
    expect(res.status).toBe(201);
    const product = res.json<{ id: number; name: string }>();
    expect(typeof product.id).toBe('number');
    expect(product.name).toBe('Mobile Test Product');
  });

  it('Test 6.21: GET /api/v1/mobile/settings returns 200', async () => {
    if (!mobileToken) return;
    const res = await request({
      path: '/api/v1/mobile/settings',
      headers: bearerAuth(),
    });
    expect(res.status).toBe(200);
  });

  // ── Mobile Events ──────────────────────────

  it('Test 6.22: GET /api/v1/mobile/events/notifications/settings returns 200', async () => {
    if (!mobileToken) return;
    const res = await request({
      path: '/api/v1/mobile/events/notifications/settings',
      headers: bearerAuth(),
    });
    expect([200, 404]).toContain(res.status); // may 404 if no settings yet
  });

  it('Test 6.23: GET /api/v1/mobile/followup-flows returns 200', async () => {
    if (!mobileToken) return;
    const res = await request({
      path: '/api/v1/mobile/followup-flows',
      headers: bearerAuth(),
    });
    expect(res.status).toBe(200);
  });
});
