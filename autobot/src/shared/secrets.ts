/**
 * Secret-handling helpers.
 *
 * `requireSecret` returns process.env[name] or throws — never falls back to a
 * hardcoded default. Use it for any value that is a secret (API key, signing
 * key, password). In production (NODE_ENV=production), missing values throw
 * immediately at module load. In other environments, missing values still
 * throw, but only when first accessed — keeps tests that don't touch the
 * secret from breaking.
 *
 * `optionalSecret` returns the env value or empty string, for values that
 * mean "feature disabled when unset" (e.g. third-party integrations).
 *
 * `timingSafeStringEqual` is a constant-time string comparison for
 * secret-vs-input checks (replaces `===` to defeat timing oracles).
 */

import { timingSafeEqual } from 'node:crypto';

const FORBIDDEN_DEFAULTS = new Set([
  'changeme',
  'change-me',
  'changeme_generate_with_openssl',
  'welcometothepresent',
  'megustalaia',
  'omnimoney',
  'yaya-dev-key',
  'yaya-jwt-secret-change-me',
  'darwin-deploy-2026',
  'admin',
  'EMPTY',
  'base64:changeme',
]);

export function requireSecret(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing required secret: env var ${name} is not set`);
  }
  if (FORBIDDEN_DEFAULTS.has(v.trim())) {
    throw new Error(`Refusing to use placeholder/default value for ${name}. Rotate to a real secret.`);
  }
  return v;
}

export function optionalSecret(name: string): string {
  const v = process.env[name];
  if (v && FORBIDDEN_DEFAULTS.has(v.trim())) {
    throw new Error(`Refusing to use placeholder/default value for ${name}. Rotate to a real secret.`);
  }
  return v ?? '';
}

/**
 * Constant-time comparison of two short strings. Returns false if lengths
 * differ. Use for any user-input-vs-server-secret comparison.
 */
export function timingSafeStringEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}
