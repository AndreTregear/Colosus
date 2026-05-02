// yaya_pay webhook receiver.
//
// IMPORTANT: HMAC verification needs the RAW request bytes, not re-serialised
// JSON. We declare the raw-body parser as route-scoped middleware so it
// applies regardless of the global `express.json()` mount order.

import { Router, raw } from 'express';
import { logger } from '../../shared/logger.js';
import { YAYAPAY_WEBHOOK_SECRET } from '../../config.js';
import { verifyWebhook, WebhookSignatureError } from '../../integrations/yayapay/index.js';
import * as yayapayService from '../../services/yayapay-service.js';

const router = Router();

router.post(
  '/',
  raw({ type: 'application/json', limit: '1mb' }),
  async (req, res) => {
    if (!YAYAPAY_WEBHOOK_SECRET) {
      logger.error('yaya_pay webhook hit but YAYAPAY_WEBHOOK_SECRET is not set');
      res.status(500).json({ error: 'yaya_pay webhook secret not configured' });
      return;
    }

    const sig = req.headers['yayapay-signature'];
    const sigStr = Array.isArray(sig) ? sig[0] : sig;

    let event;
    try {
      event = verifyWebhook(req.body, sigStr, YAYAPAY_WEBHOOK_SECRET);
    } catch (err) {
      if (err instanceof WebhookSignatureError) {
        logger.warn({ err: err.message }, 'yaya_pay webhook signature rejected');
        res.status(401).json({ error: err.message });
        return;
      }
      throw err;
    }

    try {
      await yayapayService.handleEvent(event);
      // 2xx → yaya_pay marks it delivered. Returning 5xx triggers exponential
      // backoff retries (5s, 25s, 125s, 625s) so make handleEvent idempotent.
      res.status(200).json({ received: true });
    } catch (err) {
      logger.error({ err, eventId: event.id, type: event.type }, 'yaya_pay webhook handler failed');
      res.status(500).json({ error: 'handler error' });
    }
  },
);

export { router as yayapayWebhookRouter };
