/**
 * Self-service registration: creates a tenant + user account in one step.
 * POST /api/register
 *   body: { email, password, name, businessName }
 *   -> creates tenant (slug from businessName), creates Better Auth user linked to it
 */
import { Router } from 'express';
import { auth } from '../../auth/auth.js';
import * as tenantsRepo from '../../db/tenants-repo.js';
import * as tenantSubsRepo from '../../db/tenant-subscriptions-repo.js';
import * as plansRepo from '../../db/platform-plans-repo.js';
import { query } from '../../db/pool.js';
import { logger } from '../../shared/logger.js';
import { validateBody } from '../../shared/validate.js';
import { registerSchema } from '../../shared/validation.js';

const router = Router();

router.post('/', validateBody(registerSchema), async (req, res) => {
  const { email, password, name, businessName } = req.body;

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

  // Check slug uniqueness
  const existing = await tenantsRepo.getTenantBySlug(slug);
  if (existing) {
    res.status(409).json({ error: 'A business with a similar name already exists. Try a different name.' });
    return;
  }

  try {
    // 1. Create the tenant
    const tenant = await tenantsRepo.createTenant({ name: businessName, slug });

    // 2. Create the Better Auth user linked to this tenant
    try {
      const ctx = await auth.api.signUpEmail({
        body: {
          email,
          password,
          name: name || businessName,
          tenantId: tenant.id,
        },
      });
      // Better Auth's additionalFields has input:false for tenantId (security),
      // so set it directly in DB — same pattern as seedAdminIfNeeded().
      const userId = (ctx as { user: { id: string } }).user.id;
      await query('UPDATE "user" SET "tenantId" = $1 WHERE id = $2', [tenant.id, userId]);
    } catch (authErr: unknown) {
      // Rollback: delete the tenant if user creation fails
      await tenantsRepo.deleteTenant(tenant.id);
      const msg = authErr instanceof Error ? authErr.message : 'Failed to create account';
      res.status(400).json({ error: msg });
      return;
    }

    // 3. Auto-assign free plan
    const freePlan = await plansRepo.getPlanBySlug('free');
    if (freePlan) {
      await tenantSubsRepo.subscribe(tenant.id, freePlan.id, 'free');
    }

    logger.info({ email, tenantId: tenant.id, slug }, 'New tenant registered via self-service');

    res.status(201).json({
      ok: true,
      message: 'Account created. You can now sign in.',
      tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug, apiKey: tenant.apiKey },
    });
  } catch (err: unknown) {
    logger.error({ err, email }, 'Registration failed');
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

export { router as registerRouter };
