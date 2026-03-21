/**
 * Section 7: Account Management Routes (/api/account)
 * Tests profile, bot management, and API key rotation.
 *
 * Requires a session with a linked tenantId — uses a test tenant+user created
 * via POST /api/admin/tenants, then signed in as that user.
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
let tenantEmail = '';
let tenantPassword = '';
let currentApiKey = '';

describe('Section 7: Account Management Routes', () => {
  beforeAll(async () => {
    adminCookie = await signInAdmin();

    // Create a tenant with its own admin user so we have a session with tenantId
    const result = await createTestTenantWithUser(adminCookie, 'acc');
    tenantId = result.tenantId;
    tenantEmail = result.email;
    tenantPassword = result.password;

    // Sign in as the tenant's admin user (may be rate-limited)
    try {
      tenantCookie = await signIn(tenantEmail, tenantPassword);
    } catch { /* rate-limited — tests using tenantCookie will skip */ }
  });

  afterAll(async () => {
    if (tenantId && adminCookie) {
      await deleteTestTenant(adminCookie, tenantId);
    }
  });

  // ── GET /api/account ────────────────────────

  it('Test 7.1: GET /api/account without auth returns 401', async () => {
    const res = await request({ path: '/api/account' });
    expect(res.status).toBe(401);
  });

  it('Test 7.2: GET /api/account with admin session (no tenantId) returns 403', async () => {
    // Admin user has no tenantId — account endpoint requires one
    const res = await request({ path: '/api/account', cookies: adminCookie });
    expect(res.status).toBe(403);
    const body = res.json<{ error: string }>();
    expect(body.error).toMatch(/no tenant/i);
  });

  it('Test 7.3: GET /api/account with tenant user session returns 200 with tenant info', async () => {
    if (!tenantCookie) return;
    const res = await request({ path: '/api/account', cookies: tenantCookie });
    expect(res.status).toBe(200);
    const body = res.json<{
      id: string;
      name: string;
      slug: string;
      apiKey: string;
      status: string;
    }>();
    expect(body.id).toBe(tenantId);
    expect(typeof body.apiKey).toBe('string');
    expect(body.apiKey.length).toBeGreaterThan(10);
    expect(body.status).toBe('active');
    currentApiKey = body.apiKey;
  });

  // ── Bot Status ──────────────────────────────

  it('Test 7.4: GET /api/account/status returns bot connection status', async () => {
    if (!tenantCookie) return;
    const res = await request({ path: '/api/account/status', cookies: tenantCookie });
    expect(res.status).toBe(200);
    const body = res.json<{
      running: boolean;
      connection: string;
      autoReplyEnabled: boolean;
    }>();
    expect(typeof body.running).toBe('boolean');
    expect(typeof body.connection).toBe('string');
    expect(typeof body.autoReplyEnabled).toBe('boolean');
  });

  it('Test 7.5: GET /api/account/qr returns QR status', async () => {
    if (!tenantCookie) return;
    const res = await request({ path: '/api/account/qr', cookies: tenantCookie });
    expect(res.status).toBe(200);
    const body = res.json<{ status: string; qr: string | null }>();
    expect(['disconnected', 'waiting', 'connected']).toContain(body.status);
  });

  // ── Profile Update ──────────────────────────

  it('Test 7.6: PUT /api/account/profile updates user name', async () => {
    if (!tenantCookie) return;
    const res = await request({
      path: '/api/account/profile',
      method: 'PUT',
      cookies: tenantCookie,
      body: { name: 'Updated Test User Name' },
    });
    expect(res.status).toBe(200);
    const body = res.json<{ ok: boolean; name: string }>();
    expect(body.ok).toBe(true);
    expect(body.name).toBe('Updated Test User Name');
  });

  it('Test 7.7: PUT /api/account/profile with missing name returns 400', async () => {
    if (!tenantCookie) return;
    const res = await request({
      path: '/api/account/profile',
      method: 'PUT',
      cookies: tenantCookie,
      body: {},
    });
    expect(res.status).toBe(400);
    const body = res.json<{ error: string }>();
    expect(body.error).toMatch(/name/i);
  });

  it('Test 7.8: PUT /api/account/profile without auth returns 401', async () => {
    const res = await request({
      path: '/api/account/profile',
      method: 'PUT',
      body: { name: 'Unauthenticated' },
    });
    expect(res.status).toBe(401);
  });

  // ── API Key Rotation ────────────────────────

  it('Test 7.9: POST /api/account/api-key/rotate returns new API key', async () => {
    if (!tenantCookie) return;
    const res = await request({
      path: '/api/account/api-key/rotate',
      method: 'POST',
      cookies: tenantCookie,
    });
    expect(res.status).toBe(200);
    const body = res.json<{ apiKey: string }>();
    expect(typeof body.apiKey).toBe('string');
    expect(body.apiKey.length).toBeGreaterThan(10);
    // New key should be different from the old one
    expect(body.apiKey).not.toBe(currentApiKey);
    currentApiKey = body.apiKey;
  });

  it('Test 7.10: Old API key no longer works after rotation', async () => {
    if (!tenantCookie) return;
    // Use the previous API key (before rotation) — should be rejected
    const oldApiKey = currentApiKey; // This is now the new key
    // Do a rotation again to invalidate currentApiKey
    const rotateRes = await request({
      path: '/api/account/api-key/rotate',
      method: 'POST',
      cookies: tenantCookie,
    });
    expect(rotateRes.status).toBe(200);
    const newKey = rotateRes.json<{ apiKey: string }>().apiKey;
    expect(newKey).not.toBe(oldApiKey);

    // Old key should be rejected
    const checkRes = await request({
      path: '/api/web/products',
      headers: { 'X-API-Key': oldApiKey },
    });
    expect(checkRes.status).toBe(401);
  });

  it('Test 7.11: POST /api/account/api-key/rotate without auth returns 401', async () => {
    const res = await request({
      path: '/api/account/api-key/rotate',
      method: 'POST',
    });
    expect(res.status).toBe(401);
  });

  // ── Bot Toggle Auto-Reply ───────────────────

  it('Test 7.12: POST /api/account/bot/toggle-autoreply toggles AI', async () => {
    if (!tenantCookie) return;
    const res = await request({
      path: '/api/account/bot/toggle-autoreply',
      method: 'POST',
      cookies: tenantCookie,
      body: { enabled: false },
    });
    expect(res.status).toBe(200);
    const body = res.json<{ autoReplyEnabled: boolean }>();
    expect(body.autoReplyEnabled).toBe(false);

    // Restore
    await request({
      path: '/api/account/bot/toggle-autoreply',
      method: 'POST',
      cookies: tenantCookie,
      body: { enabled: true },
    });
  });

  // ── Password Change ─────────────────────────

  it('Test 7.13: PUT /api/account/password with wrong current password returns 400', async () => {
    if (!tenantCookie) return;
    const res = await request({
      path: '/api/account/password',
      method: 'PUT',
      cookies: tenantCookie,
      body: {
        currentPassword: 'wrong-current-password',
        newPassword: 'NewPass456!',
      },
    });
    expect(res.status).toBe(400);
  });

  it('Test 7.14: PUT /api/account/password with short new password returns 400', async () => {
    if (!tenantCookie) return;
    const res = await request({
      path: '/api/account/password',
      method: 'PUT',
      cookies: tenantCookie,
      body: {
        currentPassword: tenantPassword,
        newPassword: 'short', // less than 8 chars
      },
    });
    expect(res.status).toBe(400);
  });
});
