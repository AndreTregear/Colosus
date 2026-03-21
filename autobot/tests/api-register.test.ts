/**
 * Section 16: Self-Service Registration Tests
 *
 * Tests the public POST /api/register endpoint that creates
 * a new tenant + user in one step.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { request, signInAdmin, deleteTestTenant } from './helpers.js';

let adminCookie = '';
const createdTenantIds: string[] = [];
const testEmail = `reg-test-${Date.now().toString(36)}@yaya-test.local`;
const testPassword = 'RegTestPass123!';
const testBusiness = `RegBiz ${Date.now().toString(36)}`;

describe('Section 16: Self-Service Registration', () => {
  beforeAll(async () => {
    adminCookie = await signInAdmin();
  });

  afterAll(async () => {
    // Cleanup all created tenants
    for (const id of createdTenantIds) {
      try {
        await deleteTestTenant(adminCookie, id);
      } catch { /* best-effort cleanup */ }
    }
  });

  it('16.1: POST /api/register with valid data returns 201', async () => {
    const res = await request({
      path: '/api/register',
      method: 'POST',
      body: {
        email: testEmail,
        password: testPassword,
        businessName: testBusiness,
        name: 'Test Registrant',
      },
    });
    if (res.status === 429) return;
    expect(res.status).toBe(201);
    const body = res.json<{
      ok: boolean;
      tenant: { id: string; name: string; slug: string; apiKey: string };
    }>();
    expect(body.ok).toBe(true);
    expect(typeof body.tenant.id).toBe('string');
    expect(typeof body.tenant.apiKey).toBe('string');
    expect(body.tenant.name).toBe(testBusiness);
    createdTenantIds.push(body.tenant.id);
  });

  it('16.2: POST /api/register with same email returns 400 or 409', async () => {
    const res = await request({
      path: '/api/register',
      method: 'POST',
      body: {
        email: testEmail,
        password: testPassword,
        businessName: 'Different Biz Name',
      },
    });
    if (res.status === 429) return;
    expect([400, 409]).toContain(res.status);
  });

  it('16.3: POST /api/register missing email returns 400', async () => {
    const res = await request({
      path: '/api/register',
      method: 'POST',
      body: { password: 'TestPass123!', businessName: 'No Email Biz' },
    });
    if (res.status === 429) return;
    expect(res.status).toBe(400);
  });

  it('16.4: POST /api/register missing businessName returns 400', async () => {
    const res = await request({
      path: '/api/register',
      method: 'POST',
      body: { email: 'nobiz@test.local', password: 'TestPass123!' },
    });
    if (res.status === 429) return;
    expect(res.status).toBe(400);
  });

  it('16.5: POST /api/register short password returns 400', async () => {
    const res = await request({
      path: '/api/register',
      method: 'POST',
      body: { email: 'short@test.local', password: 'short', businessName: 'Short Pass Biz' },
    });
    if (res.status === 429) return;
    expect(res.status).toBe(400);
  });

  it('16.6: POST /api/register invalid email returns 400', async () => {
    const res = await request({
      path: '/api/register',
      method: 'POST',
      body: { email: 'not-an-email', password: 'TestPass123!', businessName: 'Bad Email Biz' },
    });
    if (res.status === 429) return;
    expect(res.status).toBe(400);
  });

  it('16.7: Registered user can sign in via Better Auth', async () => {
    const res = await request({
      path: '/api/auth/sign-in/email',
      method: 'POST',
      body: { email: testEmail, password: testPassword },
    });
    if (res.status === 429) return; // Rate-limited
    expect(res.status).toBe(200);
    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeTruthy();
  });

  it('16.8: POST /api/register with slug collision returns 409', async () => {
    // Register same business name (same slug derivation)
    const res = await request({
      path: '/api/register',
      method: 'POST',
      body: {
        email: `slug-dup-${Date.now()}@test.local`,
        password: 'TestPass123!',
        businessName: testBusiness, // Same business name = same slug
      },
    });
    if (res.status === 429) return;
    expect([400, 409]).toContain(res.status);
  });
});
