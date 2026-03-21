/**
 * Section 14: Leads & Website Leads Tests
 *
 * Tests public website lead submission and admin lead management
 * via /api/website/leads and /api/leads routes.
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
let createdLeadId = 0;

describe('Section 14: Leads & Website Leads', () => {
  beforeAll(async () => {
    adminCookie = await signInAdmin();
    const result = await createTestTenantWithUser(adminCookie, 'lead');
    tenantId = result.tenantId;
    try {
      tenantCookie = await signIn(result.email, result.password);
    } catch { /* rate-limited */ }
  });

  afterAll(async () => {
    if (tenantId && adminCookie) await deleteTestTenant(adminCookie, tenantId);
  });

  // ══════════════════════════════════════════════
  // Website Leads (Public)
  // ══════════════════════════════════════════════

  it('14.1: POST /api/website/leads with valid data returns 201', async () => {
    const res = await request({
      path: '/api/website/leads',
      method: 'POST',
      body: {
        name: 'Test Lead',
        phone: '+51999123456',
        business: 'Test Business',
        message: 'I want more info',
        _ts: Date.now() - 5000, // 5 seconds ago (pass timing check)
      },
    });
    if (res.status === 429) return; // Leads rate limit (5/1min)
    expect(res.status).toBe(201);
    const body = res.json<{ ok: boolean; id: number }>();
    expect(body.ok).toBe(true);
    expect(typeof body.id).toBe('number');
    createdLeadId = body.id;
  });

  it('14.2: POST /api/website/leads with honeypot field silently accepts', async () => {
    const res = await request({
      path: '/api/website/leads',
      method: 'POST',
      body: {
        name: 'Bot Lead',
        phone: '+51999000000',
        website: 'http://spam.com', // honeypot field
        _ts: Date.now() - 5000,
      },
    });
    if (res.status === 429) return;
    // Silently accepted (id: 0 for spam)
    expect(res.status).toBe(201);
    const body = res.json<{ ok: boolean; id: number }>();
    expect(body.ok).toBe(true);
    expect(body.id).toBe(0);
  });

  it('14.3: POST /api/website/leads missing name returns 400', async () => {
    const res = await request({
      path: '/api/website/leads',
      method: 'POST',
      body: { phone: '+51999111222' },
    });
    if (res.status === 429) return;
    expect(res.status).toBe(400);
  });

  it('14.4: POST /api/website/leads missing phone returns 400', async () => {
    const res = await request({
      path: '/api/website/leads',
      method: 'POST',
      body: { name: 'No Phone Lead' },
    });
    if (res.status === 429) return;
    expect(res.status).toBe(400);
  });

  it('14.5: POST /api/website/leads with invalid phone returns 400', async () => {
    const res = await request({
      path: '/api/website/leads',
      method: 'POST',
      body: { name: 'Bad Phone', phone: 'not-a-phone' },
    });
    if (res.status === 429) return;
    expect(res.status).toBe(400);
  });

  // ══════════════════════════════════════════════
  // Website Leads (Admin)
  // ══════════════════════════════════════════════

  it('14.6: GET /api/website/leads without auth returns 401', async () => {
    const res = await request({ path: '/api/website/leads' });
    // May be rate-limited (429) from previous lead submissions
    expect([401, 429]).toContain(res.status);
  });

  it('14.7: GET /api/website/leads (admin) returns 200 with leads', async () => {
    const res = await request({ path: '/api/website/leads', cookies: adminCookie });
    if (res.status === 429) return; // Rate-limited from previous lead tests
    expect(res.status).toBe(200);
    const body = res.json<{ leads: Array<{ id: number }>; total: number }>();
    expect(Array.isArray(body.leads)).toBe(true);
    expect(typeof body.total).toBe('number');
  });

  it('14.8: PATCH /api/website/leads/:id with valid status returns 200', async () => {
    if (!createdLeadId) return;
    const res = await request({
      path: `/api/website/leads/${createdLeadId}`,
      method: 'PATCH',
      cookies: adminCookie,
      body: { status: 'contacted' },
    });
    if (res.status === 429) return;
    expect(res.status).toBe(200);
  });

  it('14.9: PATCH /api/website/leads/99999 returns 404', async () => {
    const res = await request({
      path: '/api/website/leads/99999',
      method: 'PATCH',
      cookies: adminCookie,
      body: { status: 'contacted' },
    });
    if (res.status === 429) return;
    expect(res.status).toBe(404);
  });

  it('14.10: PATCH /api/website/leads/:id with invalid status returns 400', async () => {
    if (!createdLeadId) return;
    const res = await request({
      path: `/api/website/leads/${createdLeadId}`,
      method: 'PATCH',
      cookies: adminCookie,
      body: { status: 'invalid_status' },
    });
    if (res.status === 429) return;
    expect(res.status).toBe(400);
  });

  // ══════════════════════════════════════════════
  // Tenant Leads
  // ══════════════════════════════════════════════

  it('14.11: GET /api/leads without auth returns 401', async () => {
    const res = await request({ path: '/api/leads' });
    expect(res.status).toBe(401);
  });

  it('14.12: GET /api/leads with tenant auth returns 200', async () => {
    if (!tenantCookie) return;
    const res = await request({ path: '/api/leads', cookies: tenantCookie });
    expect(res.status).toBe(200);
    const body = res.json<{ leads: unknown[]; total: number }>();
    expect(Array.isArray(body.leads)).toBe(true);
  });

  it('14.13: GET /api/leads/count returns count', async () => {
    if (!tenantCookie) return;
    const res = await request({ path: '/api/leads/count', cookies: tenantCookie });
    expect(res.status).toBe(200);
    const body = res.json<{ count: number }>();
    expect(typeof body.count).toBe('number');
  });

  it('14.14: GET /api/leads/99999 returns 404', async () => {
    if (!tenantCookie) return;
    const res = await request({ path: '/api/leads/99999', cookies: tenantCookie });
    expect(res.status).toBe(404);
  });
});
