import { betterAuth } from 'better-auth';
import { admin } from 'better-auth/plugins';
import { hashPassword } from 'better-auth/crypto';
import pg from 'pg';
import crypto from 'node:crypto';
import { DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, BUSINESS_NAME } from '../config.js';
import { logger } from '../shared/logger.js';

const { Pool } = pg;

const authOptions = {
  baseURL: BETTER_AUTH_URL,
  secret: BETTER_AUTH_SECRET,
  trustedOrigins: [
    BETTER_AUTH_URL,
    // Local dev / test harness — vitest hits the running autobot directly on :3000
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ],
  database: new Pool({ connectionString: DATABASE_URL, statement_timeout: 10000, query_timeout: 15000, connectionTimeoutMillis: 5000 }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      tenantId: {
        type: 'string' as const,
        required: false,
        defaultValue: null,
        input: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,   // 7 days
    updateAge: 60 * 60 * 24,        // refresh after 1 day
  },
  // Force HttpOnly + Secure + SameSite=Lax on session cookies. SameSite=Lax
  // blocks cross-site form-POST CSRF on dashboard mutations; HttpOnly blocks
  // JS exfil; Secure ensures the cookie only crosses HTTPS in prod.
  // (BETTER_AUTH_URL must use https:// in production for `secure` to apply.)
  advanced: {
    useSecureCookies: BETTER_AUTH_URL.startsWith('https://'),
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: BETTER_AUTH_URL.startsWith('https://'),
    },
  },
  plugins: [
    admin({
      defaultRole: 'user',
      adminRoles: ['admin'],
    }),
  ],
};

export const auth = betterAuth(authOptions);

/** Run Better Auth database migrations (idempotent — safe to call on every startup). */
export async function migrateAuthTables(): Promise<void> {
  logger.debug('Running Better Auth table migrations...');
  try {
    // better-auth v1.5+ auto-migrates when using a direct database connection.
    // Trigger initialization by making a lightweight API call.
    await auth.api.listSessions({ headers: new Headers() }).catch(() => {});
    logger.info('Better Auth tables initialized');
  } catch (err) {
    logger.warn({ err }, 'Better Auth migration check failed (tables may already exist)');
  }
}

/** Seed an admin user if ADMIN_EMAIL + ADMIN_PASSWORD env vars are set and no admin exists. */
export async function seedAdminIfNeeded(): Promise<void> {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || 'Admin';

  logger.info({
    hasEmail: !!email,
    hasPassword: !!password,
    email,
    name
  }, 'Checking admin seed configuration');

  if (!email || !password) {
    logger.warn('ADMIN_EMAIL or ADMIN_PASSWORD not set in environment - skipping admin seed');
    return;
  }

  // Query the DB directly — auth.api.listUsers requires an admin session we don't have yet
  const pool = new Pool({ connectionString: DATABASE_URL });
  try {
    // Check if user already exists
    logger.debug({ email }, 'Checking if admin user exists');
    const { rows } = await pool.query('SELECT id, role FROM "user" WHERE email = $1 LIMIT 1', [email]);

    if (rows.length > 0) {
      // User exists — ensure role is admin
      if (rows[0].role !== 'admin') {
        await pool.query('UPDATE "user" SET role = $1 WHERE id = $2', ['admin', rows[0].id]);
        logger.info({ email }, 'Existing user promoted to admin');
      } else {
        logger.debug({ email }, 'Admin user already exists with correct role');
      }
      // Always sync password from env so login works after config changes
      logger.debug({ email }, 'Syncing admin password from env');
      const hashedPassword = await hashPassword(password);
      await pool.query(
        'UPDATE "account" SET "password" = $1 WHERE "userId" = $2 AND "providerId" = $3',
        [hashedPassword, rows[0].id, 'credential']
      );
      logger.info({ email }, 'Admin password synced from env');

      // Ensure admin has a tenant (required for dashboard, QR, WhatsApp pairing)
      await ensureAdminTenant(pool, rows[0].id, name);
      return;
    }

    // Create new admin user via Better Auth
    logger.info({ email, name }, 'Creating admin user from .env configuration');
    logger.debug({ email }, 'Calling auth.api.signUpEmail for admin');
    const ctx = await auth.api.signUpEmail({
      body: { email, password, name, tenantId: '' },
    });
    const userId = (ctx as { user: { id: string } }).user.id;

    // Set role directly in DB — auth.api.setRole requires an existing admin session (chicken-and-egg)
    logger.debug({ email, userId }, 'Setting admin role in DB');
    await pool.query('UPDATE "user" SET role = $1 WHERE id = $2', ['admin', userId]);
    logger.info({ email, userId }, 'Admin user auto-created from ADMIN_EMAIL env var');

    // Create a tenant for the admin so they can use dashboard/QR/WhatsApp
    await ensureAdminTenant(pool, userId, name);
  } catch (err) {
    logger.error({ err, email }, 'Admin seed failed - this may be normal if user already exists');
  } finally {
    await pool.end();
  }
}

/** Ensure the admin user has a tenant linked. Creates one from BUSINESS_NAME if missing. */
async function ensureAdminTenant(pool: pg.Pool, userId: string, adminName: string): Promise<void> {
  const { rows } = await pool.query('SELECT "tenantId" FROM "user" WHERE id = $1', [userId]);
  if (rows[0]?.tenantId) {
    logger.debug({ userId, tenantId: rows[0].tenantId }, 'Admin already has a tenant');
    return;
  }

  const businessName = process.env.ADMIN_BUSINESS_NAME || BUSINESS_NAME || `${adminName}'s Business`;
  const slug = businessName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ñ/gi, 'n')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'admin';

  // Check if slug already exists — if so, the tenant may exist but just not be linked
  const existing = await pool.query('SELECT id FROM tenants WHERE slug = $1', [slug]);
  let tenantId: string;

  if (existing.rows.length > 0) {
    tenantId = existing.rows[0].id;
    logger.info({ userId, tenantId, slug }, 'Linking admin to existing tenant');
  } else {
    const apiKey = crypto.randomBytes(32).toString('hex');
    const result = await pool.query(
      `INSERT INTO tenants (name, slug, api_key, status, settings)
       VALUES ($1, $2, $3, 'active', '{}')
       RETURNING id`,
      [businessName, slug, apiKey],
    );
    tenantId = result.rows[0].id;
    // Initialize default settings and session row
    await pool.query(
      `INSERT INTO settings (tenant_id, key, value) VALUES ($1, 'system_prompt', ''), ($1, 'ai_enabled', '1')
       ON CONFLICT DO NOTHING`,
      [tenantId],
    );
    await pool.query(
      `INSERT INTO tenant_sessions (tenant_id) VALUES ($1) ON CONFLICT DO NOTHING`,
      [tenantId],
    );
    logger.info({ userId, tenantId, slug, businessName }, 'Created tenant for admin user');
  }

  await pool.query('UPDATE "user" SET "tenantId" = $1 WHERE id = $2', [tenantId, userId]);
  logger.info({ userId, tenantId }, 'Admin user linked to tenant');
}
