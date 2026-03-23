/**
 * SSO proxy endpoints — let a Yaya user access OSS dashboards with their credentials.
 *
 * GET /api/sso/lago     → redirect to Lago billing dashboard
 * GET /api/sso/calcom   → redirect to Cal.com scheduling
 * GET /api/sso/metabase → redirect to Metabase analytics
 */
import { Router } from 'express';
import * as tenantsRepo from '../../db/tenants-repo.js';
import * as ssoManager from '../../integrations/sso-manager.js';
import { logger } from '../../shared/logger.js';

const router = Router();

router.get('/lago', async (req, res) => {
  const tenantId = req.sessionUser?.tenantId;
  if (!tenantId) { res.status(403).json({ error: 'No tenant associated' }); return; }

  const tenant = await tenantsRepo.getTenantById(tenantId);
  if (!tenant) { res.status(404).json({ error: 'Tenant not found' }); return; }

  const portalUrl = await ssoManager.getLagoPortalUrl(tenantId, tenant.name);
  if (!portalUrl) {
    res.status(503).json({ error: 'Lago service not available. Check LAGO_API_KEY configuration.' });
    return;
  }
  logger.info({ tenantId }, 'SSO redirect to Lago');
  res.redirect(portalUrl);
});

router.get('/calcom', async (req, res) => {
  const tenantId = req.sessionUser?.tenantId;
  if (!tenantId) { res.status(403).json({ error: 'No tenant associated' }); return; }

  const tenant = await tenantsRepo.getTenantById(tenantId);
  if (!tenant) { res.status(404).json({ error: 'Tenant not found' }); return; }

  const email = req.sessionUser?.email || `${tenantId}@yaya.local`;
  const loginUrl = await ssoManager.getCalcomLoginUrl(tenantId, tenant.name, email);
  if (!loginUrl) {
    res.status(503).json({ error: 'Cal.com service not available. Check CALCOM_API_KEY configuration.' });
    return;
  }
  logger.info({ tenantId }, 'SSO redirect to Cal.com');
  res.redirect(loginUrl);
});

router.get('/metabase', async (req, res) => {
  const tenantId = req.sessionUser?.tenantId;
  if (!tenantId) { res.status(403).json({ error: 'No tenant associated' }); return; }

  const tenant = await tenantsRepo.getTenantById(tenantId);
  if (!tenant) { res.status(404).json({ error: 'Tenant not found' }); return; }

  const email = req.sessionUser?.email || `${tenantId}@yaya.local`;
  const ssoUrl = await ssoManager.getMetabaseSsoUrl(tenantId, tenant.name, email);
  if (!ssoUrl) {
    res.status(503).json({ error: 'Metabase service not available. Check METABASE_API_KEY configuration.' });
    return;
  }
  logger.info({ tenantId }, 'SSO redirect to Metabase');
  res.redirect(ssoUrl);
});

export { router as ssoRouter };
