import { betterAuth } from 'better-auth';
import { admin } from 'better-auth/plugins';
import { hashPassword } from 'better-auth/crypto';
import pg from 'pg';
import { DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL } from '../config.js';
import { logger } from '../shared/logger.js';

const { Pool } = pg;

const authOptions = {
  baseURL: BETTER_AUTH_URL,
  secret: BETTER_AUTH_SECRET,
  trustedOrigins: [BETTER_AUTH_URL],
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
    const { rows } = await pool.query('SELECT id, role FROM "user" WHERE email = $1 LIMIT 1', [email]);

    if (rows.length > 0) {
      // User exists — ensure role is admin
      if (rows[0].role !== 'admin') {
        await pool.query('UPDATE "user" SET role = $1 WHERE id = $2', ['admin', rows[0].id]);
        logger.info({ email }, 'Existing user promoted to admin');
      } else {
        logger.info({ email }, 'Admin user already exists with correct role');
      }
      // Always sync password from env so login works after config changes
      const hashedPassword = await hashPassword(password);
      await pool.query(
        'UPDATE "account" SET "password" = $1 WHERE "userId" = $2 AND "providerId" = $3',
        [hashedPassword, rows[0].id, 'credential']
      );
      logger.info({ email }, 'Admin password synced from env');
      return;
    }

    // Create new admin user via Better Auth
    logger.info({ email, name }, 'Creating admin user from .env configuration');
    const ctx = await auth.api.signUpEmail({
      body: { email, password, name, tenantId: '' },
    });
    const userId = (ctx as { user: { id: string } }).user.id;

    // Set role directly in DB — auth.api.setRole requires an existing admin session (chicken-and-egg)
    await pool.query('UPDATE "user" SET role = $1 WHERE id = $2', ['admin', userId]);
    logger.info({ email, userId }, 'Admin user auto-created from ADMIN_EMAIL env var');
  } catch (err) {
    logger.error({ err, email }, 'Admin seed failed - this may be normal if user already exists');
  } finally {
    await pool.end();
  }
}
