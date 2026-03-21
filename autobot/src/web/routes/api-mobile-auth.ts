/**
 * Mobile app authentication: phone + password based registration and login.
 * POST /api/mobile/register
 * POST /api/mobile/login
 *
 * All handlers have a 15s request timeout to prevent hanging on DB issues.
 */
import { Router, type Request, type Response, type NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as tenantsRepo from '../../db/tenants-repo.js';
import * as mobileUsersRepo from '../../db/mobile-users-repo.js';
import * as tenantSubsRepo from '../../db/tenant-subscriptions-repo.js';
import { getTenantSubscriptionStatus } from '../../services/subscription-service.js';
import * as plansRepo from '../../db/platform-plans-repo.js';
import { logger } from '../../shared/logger.js';
import { validateBody } from '../../shared/validate.js';
import { mobileRegisterSchema, mobileLoginSchema } from '../../shared/validation.js';
import { BETTER_AUTH_SECRET } from '../../config.js';

const router = Router();

const ACCESS_TOKEN_EXPIRES_IN = '7d';
const REFRESH_TOKEN_EXPIRES_IN = '30d';
const BCRYPT_ROUNDS = 12;
const REQUEST_TIMEOUT_MS = 15_000;

function signAccessToken(userId: number, tenantId: string, phone: string): string {
  return jwt.sign({ userId, tenantId, phone, type: 'access' }, BETTER_AUTH_SECRET, { algorithm: 'HS256', expiresIn: ACCESS_TOKEN_EXPIRES_IN });
}

function signRefreshToken(userId: number, tenantId: string): string {
  return jwt.sign({ userId, tenantId, type: 'refresh' }, BETTER_AUTH_SECRET, { algorithm: 'HS256', expiresIn: REFRESH_TOKEN_EXPIRES_IN });
}

/**
 * Wraps an async route handler with a request-level timeout.
 * If the handler doesn't respond within REQUEST_TIMEOUT_MS, sends a 504.
 */
function withTimeout(handler: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      logger.error({ path: req.path, method: req.method }, 'Request timed out');
      if (!res.headersSent) {
        res.status(504).json({ error: 'Request timed out. Please try again.' });
      }
    }, REQUEST_TIMEOUT_MS);

    try {
      await handler(req, res, next);
    } catch (err) {
      if (!timedOut && !res.headersSent) {
        next(err);
      }
    } finally {
      clearTimeout(timer);
    }
  };
}

// --- Register ---

router.post('/register', validateBody(mobileRegisterSchema), withTimeout(async (req, res) => {
  const { phone, password, businessName, name, email } = req.body;

  // Check phone uniqueness (phone is full E.164 number)
  const existing = await mobileUsersRepo.getMobileUserByPhone(phone);
  if (existing) {
    res.status(409).json({ error: 'An account with this phone number already exists.' });
    return;
  }

  // Derive slug from business name
  const slug = businessName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  if (!slug) {
    res.status(400).json({ error: 'Business name must contain at least one alphanumeric character' });
    return;
  }

  // Check slug uniqueness — append random suffix if taken
  let finalSlug = slug;
  const existingTenant = await tenantsRepo.getTenantBySlug(slug);
  if (existingTenant) {
    finalSlug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  }

  try {
    // 1. Create tenant
    const tenant = await tenantsRepo.createTenant({ name: businessName, slug: finalSlug });

    // 2. Update tenant phone
    await tenantsRepo.updateTenant(tenant.id, { phone });

    // 3. Hash password and create mobile user
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await mobileUsersRepo.createMobileUser(
      phone, passwordHash, tenant.id, name, email,
    );

    // 4. Auto-assign free plan
    const freePlan = await plansRepo.getPlanBySlug('free');
    if (freePlan) {
      await tenantSubsRepo.subscribe(tenant.id, freePlan.id, 'free');
    }

    // 5. Sign tokens
    const token = signAccessToken(user.id, tenant.id, phone);
    const refreshToken = signRefreshToken(user.id, tenant.id);

    logger.info({ phone, tenantId: tenant.id }, 'New mobile user registered');

    const subscription = await getTenantSubscriptionStatus(tenant.id);
    res.status(201).json({
      token,
      refreshToken,
      tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug, apiKey: tenant.apiKey },
      user: { id: user.id, name: user.name, phone: user.phone },
      subscription,
    });
  } catch (err: unknown) {
    logger.error({ err, phone }, 'Mobile registration failed');
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
}));

// --- Login ---

router.post('/login', validateBody(mobileLoginSchema), withTimeout(async (req, res) => {
  const { phone, password } = req.body;

  const user = await mobileUsersRepo.getMobileUserByPhone(phone);
  if (!user) {
    res.status(401).json({ error: 'Invalid phone number or password.' });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: 'Invalid phone number or password.' });
    return;
  }

  // Fetch tenant info
  const tenant = await tenantsRepo.getTenantById(user.tenantId);
  if (!tenant || tenant.status !== 'active') {
    res.status(403).json({ error: 'Account is not active.' });
    return;
  }

  const token = signAccessToken(user.id, tenant.id, phone);
  const refreshToken = signRefreshToken(user.id, tenant.id);

  logger.info({ phone, tenantId: tenant.id }, 'Mobile user logged in');

  const subscription = await getTenantSubscriptionStatus(tenant.id);
  res.json({
    token,
    refreshToken,
    tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug, apiKey: tenant.apiKey },
    user: { id: user.id, name: user.name, phone: user.phone },
    subscription,
  });
}));

// --- Refresh ---

router.post('/refresh', withTimeout(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken || typeof refreshToken !== 'string') {
    res.status(400).json({ error: 'refreshToken is required.' });
    return;
  }

  let payload: { userId: number; tenantId: string; type: string };
  try {
    payload = jwt.verify(refreshToken, BETTER_AUTH_SECRET, { algorithms: ['HS256'] }) as typeof payload;
  } catch {
    res.status(401).json({ error: 'Invalid or expired refresh token.' });
    return;
  }

  if (payload.type !== 'refresh') {
    res.status(401).json({ error: 'Invalid token type.' });
    return;
  }

  // Verify the user still exists and tenant is active
  const user = await mobileUsersRepo.getMobileUserById(payload.userId);
  if (!user) {
    res.status(401).json({ error: 'User not found.' });
    return;
  }

  const tenant = await tenantsRepo.getTenantById(user.tenantId);
  if (!tenant || tenant.status !== 'active') {
    res.status(403).json({ error: 'Account is not active.' });
    return;
  }

  // Issue new token pair (rotation)
  const newAccessToken = signAccessToken(user.id, tenant.id, user.phone);
  const newRefreshToken = signRefreshToken(user.id, tenant.id);

  res.json({ token: newAccessToken, refreshToken: newRefreshToken });
}));

export { router as mobileAuthRouter };
