import { Router } from 'express';
import { requireMobileOrDeviceAuth } from '../middleware/mobile-auth.js';
import { getTenantId } from '../../shared/validate.js';
import { processWithOwnerAI } from '../../ai/owner-agent.js';
import { logger } from '../../shared/logger.js';

const router = Router();
router.use(requireMobileOrDeviceAuth);

/**
 * POST /api/v1/merchant-ai/chat
 * Send a message to the merchant analytics AI agent.
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
    const result = await processWithOwnerAI(tenantId, ownerJid, message);
    res.json({ reply: result.reply });
  } catch (err) {
    logger.error({ tenantId, err }, 'Merchant AI chat failed');
    res.status(500).json({ error: 'Failed to process your request' });
  }
});

export { router as merchantAIRouter };
