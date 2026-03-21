/**
 * Section 12: Yape Payment Flow Tests
 *
 * Tests device registration and payment notification sync
 * via the /api/v1/yape/* routes.
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
let deviceToken = '';
const testDeviceId = `yape-test-${Date.now().toString(36)}`;

describe('Section 12: Yape Payment Flow', () => {
  beforeAll(async () => {
    adminCookie = await signInAdmin();
    tenant = await createTestTenant(adminCookie, 'yape');
  });

  afterAll(async () => {
    if (tenant?.id) await deleteTestTenant(adminCookie, tenant.id);
  });

  // ── Health ──────────────────────────────────

  it('12.1: GET /api/v1/yape/health returns 200', async () => {
    const res = await request({ path: '/api/v1/yape/health' });
    expect(res.status).toBe(200);
    const body = res.json<{ status: string }>();
    expect(body.status).toBe('ok');
  });

  // ── Device Registration ─────────────────────

  it('12.2: POST /api/v1/yape/devices/register with valid apiKey returns 201', async () => {
    const res = await request({
      path: '/api/v1/yape/devices/register',
      method: 'POST',
      body: {
        businessName: 'Test Yape Biz',
        phoneNumber: '51999888777',
        deviceId: testDeviceId,
        apiKey: tenant.apiKey,
      },
    });
    expect(res.status).toBe(201);
    const body = res.json<{ businessId: string; token: string }>();
    expect(typeof body.token).toBe('string');
    expect(body.token.length).toBeGreaterThan(10);
    expect(body.businessId).toBe(tenant.id);
    deviceToken = body.token;
  });

  it('12.3: POST /api/v1/yape/devices/register with invalid apiKey returns 401', async () => {
    const res = await request({
      path: '/api/v1/yape/devices/register',
      method: 'POST',
      body: {
        businessName: 'Bad Biz',
        phoneNumber: '51111222333',
        deviceId: 'dev-bad',
        apiKey: 'invalid-api-key-that-does-not-exist',
      },
    });
    expect(res.status).toBe(401);
  });

  it('12.4: POST /api/v1/yape/devices/register missing fields returns 400', async () => {
    const res = await request({
      path: '/api/v1/yape/devices/register',
      method: 'POST',
      body: { businessName: 'Incomplete' },
    });
    expect(res.status).toBe(400);
  });

  it('12.5: POST /api/v1/yape/devices/register same deviceId is idempotent', async () => {
    const res = await request({
      path: '/api/v1/yape/devices/register',
      method: 'POST',
      body: {
        businessName: 'Test Yape Biz',
        phoneNumber: '51999888777',
        deviceId: testDeviceId,
        apiKey: tenant.apiKey,
      },
    });
    // Should succeed (either 201 or 200)
    expect([200, 201]).toContain(res.status);
    const body = res.json<{ token: string }>();
    expect(typeof body.token).toBe('string');
    // Update deviceToken — re-registration generates a new token (Date.now() in HMAC)
    deviceToken = body.token;
  });

  // ── Payment Sync ────────────────────────────

  function deviceAuth(): Record<string, string> {
    return { Authorization: `Bearer ${deviceToken}` };
  }

  it('12.6: POST /api/v1/yape/payments/sync without auth returns 401', async () => {
    const res = await request({
      path: '/api/v1/yape/payments/sync',
      method: 'POST',
      body: {
        senderName: 'Juan',
        amount: 25.5,
        capturedAt: new Date().toISOString(),
        notificationHash: 'hash-noauth',
      },
    });
    expect(res.status).toBe(401);
  });

  it('12.7: POST /api/v1/yape/payments/sync with valid data returns 200', async () => {
    if (!deviceToken) return;
    const res = await request({
      path: '/api/v1/yape/payments/sync',
      method: 'POST',
      headers: deviceAuth(),
      body: {
        senderName: 'Juan Perez',
        amount: 35.0,
        capturedAt: new Date().toISOString(),
        notificationHash: `hash-${Date.now()}`,
      },
    });
    expect(res.status).toBe(200);
    const body = res.json<{ id: string | number; status: string }>();
    expect(body.id).toBeDefined();
  });

  it('12.8: POST /api/v1/yape/payments/sync missing fields returns 400', async () => {
    if (!deviceToken) return;
    const res = await request({
      path: '/api/v1/yape/payments/sync',
      method: 'POST',
      headers: deviceAuth(),
      body: { senderName: 'Incomplete' },
    });
    expect(res.status).toBe(400);
  });

  it('12.9: POST /api/v1/yape/payments/sync/batch with valid data returns 200', async () => {
    if (!deviceToken) return;
    const res = await request({
      path: '/api/v1/yape/payments/sync/batch',
      method: 'POST',
      headers: deviceAuth(),
      body: {
        payments: [
          {
            senderName: 'Ana',
            amount: 10,
            capturedAt: new Date().toISOString(),
            notificationHash: `batch-h1-${Date.now()}`,
          },
          {
            senderName: 'Carlos',
            amount: 20,
            capturedAt: new Date().toISOString(),
            notificationHash: `batch-h2-${Date.now()}`,
          },
        ],
      },
    });
    expect(res.status).toBe(200);
    const body = res.json<{ results: unknown[] }>();
    expect(Array.isArray(body.results)).toBe(true);
    expect(body.results.length).toBe(2);
  });

  it('12.10: POST /api/v1/yape/payments/sync/batch empty array returns 400', async () => {
    if (!deviceToken) return;
    const res = await request({
      path: '/api/v1/yape/payments/sync/batch',
      method: 'POST',
      headers: deviceAuth(),
      body: { payments: [] },
    });
    expect(res.status).toBe(400);
  });
});
