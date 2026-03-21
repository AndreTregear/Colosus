/**
 * Global setup — applies schema once before all test files
 * and pre-authenticates the admin to avoid rate limiting.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { query } from '../src/db/pool.js';
import { closePool } from '../src/db/pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Path where we persist the admin cookie between test file module contexts. */
export const ADMIN_COOKIE_PATH = path.resolve(__dirname, '..', '.admin-cookie-cache');

export async function setup() {
  try {
    const schema = fs.readFileSync(path.resolve(__dirname, '..', 'schema.sql'), 'utf-8');
    await query(schema);
  } catch {
    console.warn('[global-setup] PostgreSQL not available — DB tests will be skipped');
  }

  // Pre-authenticate admin and write cookie to a temp file so all test files
  // can read it without hitting the auth rate limit (20 req / 15 min).
  try {
    const BASE_URL = process.env.TEST_BASE_URL ?? 'https://yaya.sh';
    const email = process.env.ADMIN_EMAIL ?? 'andre@yaya.sh';
    const password = process.env.ADMIN_PASSWORD ?? 'sigmasigmaboy';

    const https = await import('node:https');
    const http = await import('node:http');
    const { URL } = await import('node:url');

    const targetUrl = new URL('/api/auth/sign-in/email', BASE_URL);
    const isHttps = targetUrl.protocol === 'https:';
    const lib = isHttps ? https : http;
    const bodyStr = JSON.stringify({ email, password });

    const cookie = await new Promise<string>((resolve, reject) => {
      const req = lib.request(
        {
          hostname: targetUrl.hostname,
          port: targetUrl.port ? Number(targetUrl.port) : isHttps ? 443 : 80,
          path: targetUrl.pathname,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(bodyStr),
            Origin: BASE_URL,
          },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk: Buffer) => (data += chunk));
          res.on('end', () => {
            if (res.statusCode !== 200) {
              reject(new Error(`Admin sign-in failed: ${res.statusCode} — ${data}`));
              return;
            }
            const setCookie = res.headers['set-cookie'];
            if (!setCookie) {
              reject(new Error('No cookies in admin sign-in response'));
              return;
            }
            const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
            resolve(cookies.map((c) => c.split(';')[0]).join('; '));
          });
        },
      );
      req.on('error', reject);
      req.write(bodyStr);
      req.end();
    });

    fs.writeFileSync(ADMIN_COOKIE_PATH, JSON.stringify({ cookie, ts: Date.now() }));
    console.log('[global-setup] Admin cookie cached to disk');
  } catch (err) {
    console.warn('[global-setup] Failed to pre-authenticate admin:', (err as Error).message);
  }
}

export async function teardown() {
  // Clean up cookie cache
  try { fs.unlinkSync(ADMIN_COOKIE_PATH); } catch { /* ok */ }

  try {
    await closePool();
  } catch {
    // Pool was never opened — nothing to close
  }
}
