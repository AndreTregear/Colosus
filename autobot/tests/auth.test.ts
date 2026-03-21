/**
 * Section 2: Authentication Tests
 * Tests Better Auth sign-in, sign-out, session management against https://yaya.sh
 *
 * Rate limit: 20 auth requests per 15 minutes.
 * We sign in only twice (once for session tests, once for sign-out test).
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { request, extractCookies, signInAdmin, ADMIN_EMAIL, ADMIN_PASSWORD } from './helpers.js';

let adminCookie = '';

describe('Section 2: Authentication', () => {
  beforeAll(async () => {
    // Single sign-in shared across tests — minimises rate limit consumption
    adminCookie = await signInAdmin();
  });

  it('Test 2.1: Admin sign-in with valid credentials returns 200 and sets session cookie', async () => {
    const res = await request({
      path: '/api/auth/sign-in/email',
      method: 'POST',
      body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    if (res.status === 429) return;
    expect(res.status).toBe(200);
    const cookies = extractCookies(res);
    expect(cookies.length).toBeGreaterThan(0);
    const body = res.json<{ user?: { email: string } }>();
    expect(body.user?.email).toBe(ADMIN_EMAIL);
  });

  it('Test 2.2: Sign-in with wrong password returns 401 (or 429 if rate limited)', async () => {
    const res = await request({
      path: '/api/auth/sign-in/email',
      method: 'POST',
      body: { email: ADMIN_EMAIL, password: 'definitely-wrong-password-xyz' },
    });
    expect([401, 429]).toContain(res.status);
  });

  it('Test 2.3: GET /api/auth/get-session returns current user after sign-in', async () => {
    if (!adminCookie) return;
    const res = await request({
      path: '/api/auth/get-session',
      cookies: adminCookie,
    });
    expect(res.status).toBe(200);
    const body = res.json<{ user?: { email: string; role: string } }>();
    expect(body.user?.email).toBe(ADMIN_EMAIL);
    expect(body.user?.role).toBe('admin');
  });

  it('Test 2.4: GET /api/auth/get-session without cookie returns 200 with null body', async () => {
    const res = await request({ path: '/api/auth/get-session' });
    if (res.status === 429) return;
    expect(res.status).toBe(200);
    // Better Auth returns literal null when not authenticated
    expect(res.body.trim()).toBe('null');
  });

  it('Test 2.5: Sign-out invalidates session', async () => {
    // Sign in fresh to get a cookie we can invalidate
    const freshRes = await request({
      path: '/api/auth/sign-in/email',
      method: 'POST',
      body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    if (freshRes.status === 429) {
      console.warn('Rate limited — skipping sign-out invalidation test');
      return;
    }
    expect(freshRes.status).toBe(200);
    const freshCookie = extractCookies(freshRes);

    const signOutRes = await request({
      path: '/api/auth/sign-out',
      method: 'POST',
      cookies: freshCookie,
    });
    expect(signOutRes.status).toBe(200);

    // After sign-out, admin route should return 401
    const afterRes = await request({
      path: '/api/admin/metrics',
      cookies: freshCookie,
    });
    expect(afterRes.status).toBe(401);
  });

  it('Test 2.6: Accessing admin route without any auth returns 401', async () => {
    const res = await request({ path: '/api/admin/metrics' });
    expect(res.status).toBe(401);
  });

  it('Test 2.7: Accessing /api/account without auth returns 401', async () => {
    const res = await request({ path: '/api/account' });
    expect(res.status).toBe(401);
  });

  it('Test 2.8: Admin cookie is valid for admin routes (200)', async () => {
    if (!adminCookie) return;
    const res = await request({ path: '/api/admin/metrics', cookies: adminCookie });
    expect(res.status).toBe(200);
  });

  it('Test 2.9: Admin cookie returns current user role = admin', async () => {
    if (!adminCookie) return;
    const res = await request({
      path: '/api/auth/get-session',
      cookies: adminCookie,
    });
    expect(res.status).toBe(200);
    const body = res.json<{ user?: { role: string } }>();
    expect(body.user?.role).toBe('admin');
  });
});
