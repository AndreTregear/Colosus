import { Router } from 'express';
import { requireMobileOrDeviceAuth } from '../middleware/mobile-auth.js';
import { requireTenantAuth } from '../middleware/tenant-auth.js';
import { getTenantId } from '../../shared/validate.js';
import { processOwnerWithHermes } from '../../ai/hermes-bridge.js';
import { logger } from '../../shared/logger.js';

const router = Router();

/**
 * Auth: accept both mobile/device auth (Android app) and tenant web auth (dashboard).
 */
async function flexAuth(req: Parameters<typeof requireMobileOrDeviceAuth>[0], res: Parameters<typeof requireMobileOrDeviceAuth>[1], next: Parameters<typeof requireMobileOrDeviceAuth>[2]) {
  // Try tenant (web dashboard) auth first, fall back to mobile auth
  requireTenantAuth(req, res, (err?: unknown) => {
    if (!err && req.tenantId) return next();
    requireMobileOrDeviceAuth(req, res, next);
  });
}

router.use(flexAuth);

/**
 * POST /api/merchant-ai/chat
 * Send a message to the merchant AI agent via Hermes.
 */
router.post('/chat', async (req, res) => {
  const tenantId = getTenantId(req);
  const { message } = req.body;

  if (!message || typeof message !== 'string') {
    res.status(400).json({ error: 'message is required' });
    return;
  }

  try {
    const ownerJid = `${tenantId}@api`; // API-based owner interaction
    const result = await processOwnerWithHermes(tenantId, ownerJid, message);
    res.json({ reply: result.reply });
  } catch (err) {
    logger.error({ tenantId, err }, 'Merchant AI chat failed');
    res.status(500).json({ error: 'Failed to process your request' });
  }
});

export { router as merchantAIRouter };
