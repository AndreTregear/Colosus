/**
 * Section 8: Queue Monitoring Routes (/api/queue/*)
 * Tests queue stats, health, and failed job management.
 * All endpoints require admin session.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { request, signInAdmin } from './helpers.js';

let adminCookie = '';

describe('Section 8: Queue Monitoring Routes', () => {
  beforeAll(async () => {
    adminCookie = await signInAdmin();
  });

  // ── Authorization ──────────────────────────

  it('Test 8.1: GET /api/queue/stats without auth returns 401', async () => {
    const res = await request({ path: '/api/queue/stats' });
    expect(res.status).toBe(401);
  });

  it('Test 8.2: GET /api/queue/health without auth returns 401', async () => {
    const res = await request({ path: '/api/queue/health' });
    expect(res.status).toBe(401);
  });

  it('Test 8.3: GET /api/queue/failed without auth returns 401', async () => {
    const res = await request({ path: '/api/queue/failed' });
    expect(res.status).toBe(401);
  });

  // ── Queue Stats ────────────────────────────

  it('Test 8.4: GET /api/queue/stats returns job counts', async () => {
    const res = await request({ path: '/api/queue/stats', cookies: adminCookie });
    expect(res.status).toBe(200);
    const body = res.json<{
      waiting: number;
      active: number;
      completed: number;
      failed: number;
      delayed: number;
    }>();
    expect(typeof body.waiting).toBe('number');
    expect(typeof body.active).toBe('number');
    expect(typeof body.completed).toBe('number');
    expect(typeof body.failed).toBe('number');
    expect(typeof body.delayed).toBe('number');
    // All counts should be non-negative
    expect(body.waiting).toBeGreaterThanOrEqual(0);
    expect(body.active).toBeGreaterThanOrEqual(0);
    expect(body.failed).toBeGreaterThanOrEqual(0);
  });

  it('Test 8.5: GET /api/queue/stats/:tenantId returns per-tenant rate limit info', async () => {
    // Use a dummy tenant ID — still returns structure even if no jobs
    const res = await request({
      path: '/api/queue/stats/00000000-0000-0000-0000-000000000001',
      cookies: adminCookie,
    });
    expect(res.status).toBe(200);
    const body = res.json<{
      tenantId: string;
      queue: { waiting: number; active: number };
      rateLimit: object;
    }>();
    expect(typeof body.tenantId).toBe('string');
    expect(typeof body.queue.waiting).toBe('number');
    expect(typeof body.queue.active).toBe('number');
  });

  // ── Queue Health ───────────────────────────

  it('Test 8.6: GET /api/queue/health returns Redis and queue status', async () => {
    const res = await request({ path: '/api/queue/health', cookies: adminCookie });
    expect(res.status).toBe(200);
    const body = res.json<{ redis: string; queue: string }>();
    expect(body.redis).toBe('connected');
    expect(['active', 'paused']).toContain(body.queue);
  });

  // ── Failed Jobs ────────────────────────────

  it('Test 8.7: GET /api/queue/failed returns failed jobs list', async () => {
    const res = await request({ path: '/api/queue/failed', cookies: adminCookie });
    expect(res.status).toBe(200);
    const body = res.json<{ total: number; jobs: unknown[] }>();
    expect(typeof body.total).toBe('number');
    expect(body.total).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(body.jobs)).toBe(true);
  });

  it('Test 8.8: GET /api/queue/failed with pagination returns 200', async () => {
    const res = await request({
      path: '/api/queue/failed?limit=10&offset=0',
      cookies: adminCookie,
    });
    expect(res.status).toBe(200);
    const body = res.json<{ total: number; jobs: unknown[] }>();
    expect(Array.isArray(body.jobs)).toBe(true);
    expect(body.jobs.length).toBeLessThanOrEqual(10);
  });

  it('Test 8.9: POST /api/queue/failed/:jobId/retry for nonexistent job returns 404', async () => {
    const res = await request({
      path: '/api/queue/failed/nonexistent-job-xyz/retry',
      method: 'POST',
      cookies: adminCookie,
    });
    expect(res.status).toBe(404);
    const body = res.json<{ error: string }>();
    expect(body.error).toMatch(/not found/i);
  });

  it('Test 8.10: DELETE /api/queue/failed/:jobId for nonexistent job returns 404', async () => {
    const res = await request({
      path: '/api/queue/failed/nonexistent-job-xyz',
      method: 'DELETE',
      cookies: adminCookie,
    });
    expect(res.status).toBe(404);
  });
});
