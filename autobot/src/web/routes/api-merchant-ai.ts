import { Router } from 'express';
import { requireMobileOrDeviceAuth } from '../middleware/mobile-auth.js';
import { requireTenantAuth } from '../middleware/tenant-auth.js';
import { getTenantId } from '../../shared/validate.js';
import { processOwnerWithHermes } from '../../ai/hermes-bridge.js';
import { logger } from '../../shared/logger.js';

const router = Router();

/**
 * Auth: accept both mobile/device auth (Android app) and tenant web auth
 * (dashboard / API key). The previous "try-then-fallback" version was
 * broken — requireTenantAuth writes a 401 response on failure rather than
 * passing an error to next(), so the fallback never ran. Branch on the
 * auth header shape instead and commit to one path up front.
 */
async function flexAuth(req: Parameters<typeof requireMobileOrDeviceAuth>[0], res: Parameters<typeof requireMobileOrDeviceAuth>[1], next: Parameters<typeof requireMobileOrDeviceAuth>[2]) {
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'];
  if (authHeader?.startsWith('Bearer ') && !apiKey) {
    // Bearer header without X-API-Key → mobile JWT or device token.
    return requireMobileOrDeviceAuth(req, res, next);
  }
  // X-API-Key header, Better Auth cookie, or no header → tenant auth.
  return requireTenantAuth(req, res, next);
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
