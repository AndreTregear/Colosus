#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

# Pre-authenticate admin and cache cookie to avoid auth rate limiting (20 req/15min)
echo "==> Caching admin cookie..."
node -e "
const https = require('https');
const fs = require('fs');
const BASE = process.env.TEST_BASE_URL || 'https://yaya.sh';
const email = process.env.ADMIN_EMAIL || 'andre@yaya.sh';
const pass = process.env.ADMIN_PASSWORD || 'sigmasigmaboy';
const body = JSON.stringify({ email, password: pass });
const url = new URL('/api/auth/sign-in/email', BASE);
const lib = url.protocol === 'https:' ? https : require('http');
const req = lib.request({
  hostname: url.hostname,
  port: url.port || (url.protocol === 'https:' ? 443 : 80),
  path: url.pathname,
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), Origin: BASE }
}, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    if (res.statusCode === 200) {
      const cookies = (Array.isArray(res.headers['set-cookie']) ? res.headers['set-cookie'] : [res.headers['set-cookie']])
        .filter(Boolean).map(c => c.split(';')[0]).join('; ');
      fs.writeFileSync('.admin-cookie-cache', JSON.stringify({ cookie: cookies, ts: Date.now() }));
      console.log('    Admin cookie cached');
    } else {
      console.error('    Warning: admin sign-in returned', res.statusCode);
    }
  });
});
req.on('error', (e) => console.error('    Warning: sign-in failed:', e.message));
req.write(body);
req.end();
"

echo "==> Running all 24 test files (373 tests)..."
echo ""
npx vitest run --reporter=verbose "$@"
