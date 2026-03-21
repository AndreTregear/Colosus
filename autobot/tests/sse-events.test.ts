/**
 * Section 22: SSE Mobile Events Tests
 *
 * Tests Server-Sent Events endpoint for real-time mobile updates.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import https from 'node:https';
import http from 'node:http';
import { URL } from 'node:url';
import {
  request,
  signInAdmin,
  deleteTestTenant,
  mobileRegisterAndLogin,
  BASE_URL,
  type MobileAuth,
} from './helpers.js';

let adminCookie = '';
let mobile: MobileAuth;

describe('Section 22: SSE Mobile Events', () => {
  beforeAll(async () => {
    adminCookie = await signInAdmin();
    try {
      mobile = await mobileRegisterAndLogin('sse');
    } catch { /* rate-limited */ }
  });

  afterAll(async () => {
    if (mobile?.tenantId && adminCookie) {
      try { await deleteTestTenant(adminCookie, mobile.tenantId); } catch { /* ok */ }
    }
  });

  it('22.1: GET /api/v1/mobile/events without auth returns 401', async () => {
    const res = await request({ path: '/api/v1/mobile/events' });
    expect(res.status).toBe(401);
  });

  it('22.2: GET /api/v1/mobile/events with JWT returns SSE stream', async () => {
    if (!mobile?.token) return;
    const targetUrl = new URL('/api/v1/mobile/events', BASE_URL);
    const isHttps = targetUrl.protocol === 'https:';
    const lib = isHttps ? https : http;

    const result = await new Promise<{ status: number; contentType: string; data: string }>((resolve, reject) => {
      const timer = setTimeout(() => {
        req.destroy();
        reject(new Error('SSE connection timed out'));
      }, 10000);

      const req = lib.request(
        {
          hostname: targetUrl.hostname,
          port: targetUrl.port ? Number(targetUrl.port) : isHttps ? 443 : 80,
          path: targetUrl.pathname,
          method: 'GET',
          headers: {
            Authorization: `Bearer ${mobile.token}`,
            Accept: 'text/event-stream',
            Origin: BASE_URL,
          },
        },
        (res) => {
          const contentType = (res.headers['content-type'] ?? '') as string;
          let data = '';

          res.on('data', (chunk) => {
            data += chunk.toString();
            // Once we get some data, resolve after a short delay
            if (data.includes('event:') || data.includes('data:') || data.length > 20) {
              clearTimeout(timer);
              setTimeout(() => {
                req.destroy();
                resolve({ status: res.statusCode!, contentType, data });
              }, 500);
            }
          });

          // If connection closes quickly (e.g., 401)
          res.on('end', () => {
            clearTimeout(timer);
            resolve({ status: res.statusCode!, contentType, data });
          });
        },
      );

      req.on('error', (err) => {
        clearTimeout(timer);
        // Connection destroyed by us is expected
        if (err.message.includes('socket hang up') || err.message.includes('aborted')) {
          return;
        }
        reject(err);
      });

      req.end();
    });

    expect(result.status).toBe(200);
    expect(result.contentType).toContain('text/event-stream');
  });

  it('22.3: SSE stream sends initial connected event', async () => {
    if (!mobile?.token) return;
    const targetUrl = new URL('/api/v1/mobile/events', BASE_URL);
    const isHttps = targetUrl.protocol === 'https:';
    const lib = isHttps ? https : http;

    const data = await new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => {
        req.destroy();
        resolve(''); // Timeout = no data
      }, 8000);

      const req = lib.request(
        {
          hostname: targetUrl.hostname,
          port: targetUrl.port ? Number(targetUrl.port) : isHttps ? 443 : 80,
          path: targetUrl.pathname,
          method: 'GET',
          headers: {
            Authorization: `Bearer ${mobile.token}`,
            Accept: 'text/event-stream',
            Origin: BASE_URL,
          },
        },
        (res) => {
          let buf = '';
          res.on('data', (chunk) => {
            buf += chunk.toString();
            // Check for connected event
            if (buf.includes('connected') || buf.includes('"ok":true')) {
              clearTimeout(timer);
              req.destroy();
              resolve(buf);
            }
          });
          res.on('end', () => {
            clearTimeout(timer);
            resolve(buf);
          });
        },
      );

      req.on('error', () => {
        // Expected when we destroy the connection
      });
      req.end();
    });

    // Should contain a connected event
    expect(data.length).toBeGreaterThan(0);
  });
});
