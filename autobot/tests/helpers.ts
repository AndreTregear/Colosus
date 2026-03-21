/**
 * Shared test helpers for integration tests against https://yaya.sh
 *
 * All helpers use Node's built-in https/http modules — no external deps.
 * Tests target the live staging server at BASE_URL (default: https://yaya.sh).
 */
import https from 'node:https';
import http from 'node:http';
import { URL } from 'node:url';

export const BASE_URL = process.env.TEST_BASE_URL ?? 'https://yaya.sh';
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'andre@yaya.sh';
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'sigmasigmaboy';

export interface TestResponse {
  status: number;
  headers: Record<string, string | string[] | undefined>;
  body: string;
  json<T = unknown>(): T;
}

export interface TestTenant {
  id: string;
  apiKey: string;
  slug: string;
  name: string;
}

/**
 * Make an HTTP/HTTPS request to BASE_URL.
 * Automatically sets Content-Type and Content-Length for JSON bodies.
 */
export function request(opts: {
  path: string;
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  cookies?: string;
}): Promise<TestResponse> {
  return new Promise((resolve, reject) => {
    const targetUrl = new URL(opts.path, BASE_URL);
    const isHttps = targetUrl.protocol === 'https:';
    const lib = isHttps ? https : http;

    const bodyStr = opts.body !== undefined ? JSON.stringify(opts.body) : undefined;
    const reqHeaders: Record<string, string | number> = { ...(opts.headers ?? {}) };

    if (bodyStr) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(bodyStr);
    }
    if (opts.cookies) {
      reqHeaders['Cookie'] = opts.cookies;
    }
    // Better Auth requires Origin for CSRF validation on state-changing requests
    if (!reqHeaders['Origin']) {
      reqHeaders['Origin'] = BASE_URL;
    }

    const req = lib.request(
      {
        hostname: targetUrl.hostname,
        port: targetUrl.port ? Number(targetUrl.port) : isHttps ? 443 : 80,
        path: targetUrl.pathname + (targetUrl.search || ''),
        method: opts.method ?? 'GET',
        headers: reqHeaders,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () =>
          resolve({
            status: res.statusCode!,
            headers: res.headers as Record<string, string | string[] | undefined>,
            body: data,
            json<T>() {
              return JSON.parse(data) as T;
            },
          }),
        );
      },
    );

    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

/**
 * Extract cookie string from Set-Cookie response header.
 * Returns a string suitable for use in subsequent Cookie: headers.
 */
export function extractCookies(res: TestResponse): string {
  const setCookieHeader = res.headers['set-cookie'];
  if (!setCookieHeader) return '';
  const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
  return cookies.map((c) => c.split(';')[0]).join('; ');
}

/**
 * Sign in via Better Auth email endpoint and return cookie string.
 */
export async function signIn(email: string, password: string): Promise<string> {
  const res = await request({
    path: '/api/auth/sign-in/email',
    method: 'POST',
    body: { email, password },
  });
  if (res.status !== 200) {
    throw new Error(`Sign in failed: HTTP ${res.status} — ${res.body}`);
  }
  const cookies = extractCookies(res);
  if (!cookies) throw new Error('No cookies in sign-in response');
  return cookies;
}

// Cache admin cookie across test files to avoid rate limiting.
// The global-setup pre-authenticates and writes the cookie to disk;
// each test file module context reads it back here.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __helpers_dirname = path.dirname(fileURLToPath(import.meta.url));
const ADMIN_COOKIE_PATH = path.resolve(__helpers_dirname, '..', '.admin-cookie-cache');

let cachedAdminCookie = '';

/** Sign in as the platform admin (reads from disk cache first). */
export async function signInAdmin(): Promise<string> {
  if (cachedAdminCookie) return cachedAdminCookie;

  // Try to read from global-setup's disk cache
  try {
    const raw = fs.readFileSync(ADMIN_COOKIE_PATH, 'utf-8');
    const { cookie, ts } = JSON.parse(raw) as { cookie: string; ts: number };
    // Use cache if less than 10 minutes old
    if (cookie && Date.now() - ts < 10 * 60 * 1000) {
      cachedAdminCookie = cookie;
      return cachedAdminCookie;
    }
  } catch { /* no cache — sign in fresh */ }

  cachedAdminCookie = await signIn(ADMIN_EMAIL, ADMIN_PASSWORD);
  // Write back so subsequent test files can reuse
  try {
    fs.writeFileSync(ADMIN_COOKIE_PATH, JSON.stringify({ cookie: cachedAdminCookie, ts: Date.now() }));
  } catch { /* non-critical */ }
  return cachedAdminCookie;
}

/**
 * Create a test tenant via POST /api/tenants (admin session required).
 * Returns the full tenant object including apiKey.
 */
export async function createTestTenant(adminCookie: string, suffix?: string): Promise<TestTenant> {
  const slug = `test-${suffix ?? Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const res = await request({
    path: '/api/tenants',
    method: 'POST',
    cookies: adminCookie,
    body: { name: `Test Tenant ${slug}`, slug },
  });
  if (res.status !== 201) {
    throw new Error(`Failed to create test tenant: HTTP ${res.status} — ${res.body}`);
  }
  const tenant = res.json<{ id: string; apiKey: string; slug: string; name: string }>();
  return { id: tenant.id, apiKey: tenant.apiKey, slug: tenant.slug, name: tenant.name };
}

/**
 * Delete a test tenant via DELETE /api/tenants/:id (admin session required).
 */
export async function deleteTestTenant(adminCookie: string, tenantId: string): Promise<void> {
  await request({
    path: `/api/tenants/${tenantId}`,
    method: 'DELETE',
    cookies: adminCookie,
  });
}

/**
 * Create a complete tenant+user combo via POST /api/admin/tenants.
 * Returns tenant id and the credentials to sign in as the tenant user.
 */
export async function createTestTenantWithUser(
  adminCookie: string,
  suffix?: string,
): Promise<{ tenantId: string; email: string; password: string }> {
  const tag = suffix ?? Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 7);
  const slug = `tenu-${tag}-${rand}`;
  const email = `test-${tag}-${rand}@yaya-test.local`;
  const password = 'TestPass123!';

  const res = await request({
    path: '/api/admin/tenants',
    method: 'POST',
    cookies: adminCookie,
    body: { name: `Test Biz ${tag}`, slug, adminEmail: email, adminPassword: password },
  });
  if (res.status !== 201) {
    throw new Error(`Failed to create tenant+user: HTTP ${res.status} — ${res.body}`);
  }
  const body = res.json<{ tenant: { id: string } }>();
  return { tenantId: body.tenant.id, email, password };
}

/** Generate a random phone in E.164 format for mobile auth tests. */
export function randomPhone(): string {
  const digits = Math.floor(10000000 + Math.random() * 89999999);
  return `+51${digits}`;
}

/** Assert that a response status is NOT 500+ (server error). */
export function assertNotServerError(status: number, label: string): void {
  if (status >= 500) {
    throw new Error(`${label} returned server error ${status} — frontend would show an error`);
  }
}

export interface MobileAuth {
  token: string;
  refreshToken: string;
  tenantId: string;
  phone: string;
}

/**
 * Register a mobile user and return JWT tokens + tenantId.
 * Caller is responsible for cleanup via deleteTestTenant().
 */
export async function mobileRegisterAndLogin(
  suffix?: string,
): Promise<MobileAuth> {
  const phone = randomPhone();
  const password = 'MobileTest123!';
  const businessName = `MobTest ${suffix ?? Date.now().toString(36)}`;

  const res = await request({
    path: '/api/v1/mobile/auth/register',
    method: 'POST',
    body: { phone, password, businessName, name: 'Test Mobile' },
  });
  if (res.status !== 201) {
    throw new Error(`Mobile register failed: HTTP ${res.status} — ${res.body}`);
  }
  const body = res.json<{
    token: string;
    refreshToken: string;
    tenant: { id: string };
    user: { phone: string };
  }>();
  return {
    token: body.token,
    refreshToken: body.refreshToken,
    tenantId: body.tenant.id,
    phone: body.user.phone,
  };
}

/**
 * Register a Yape device and return the device token.
 */
export async function registerYapeDevice(
  apiKey: string,
  deviceId?: string,
): Promise<{ token: string; businessId: string }> {
  const did = deviceId ?? `dev-${Date.now().toString(36)}`;
  const res = await request({
    path: '/api/v1/yape/devices/register',
    method: 'POST',
    body: {
      businessName: 'Test Biz',
      phoneNumber: '51999999999',
      deviceId: did,
      apiKey,
    },
  });
  if (res.status !== 201) {
    throw new Error(`Device register failed: HTTP ${res.status} — ${res.body}`);
  }
  return res.json<{ token: string; businessId: string }>();
}
