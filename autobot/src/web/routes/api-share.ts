import { Router } from 'express';
import { logger } from '../../shared/logger.js';

export const shareRouter = Router();

const HEALTH_PHONE = process.env.HEALTH_WHATSAPP_PHONE || '51999888777';
const BUSINESS_SIGNUP = process.env.BUSINESS_SIGNUP_URL || 'https://agente.ceo/register';

// GET /api/v1/share/link — public endpoint to generate shareable links
shareRouter.get('/link', async (req, res) => {
  try {
    const product = (req.query.product as string) || 'ceo';
    const ref = req.query.ref as string | undefined;

    let url: string;
    let message: string;

    if (product === 'fit' || product === 'health') {
      // Health: direct WhatsApp link to health bot
      message = ref
        ? `Hola, quiero evaluar la salud de mi hijo ${ref}`
        : 'Hola, quiero evaluar la salud de mi hijo';
      url = `https://wa.me/${HEALTH_PHONE}?text=${encodeURIComponent(message)}`;
    } else {
      // Business: web signup with optional referral code
      const params = new URLSearchParams();
      if (ref) params.set('ref', ref);
      url = `${BUSINESS_SIGNUP}${params.toString() ? '?' + params.toString() : ''}`;
    }

    res.json({
      url,
      product,
      ref: ref || null,
    });
  } catch (err) {
    logger.error({ err }, 'Failed to generate share link');
    res.status(500).json({ error: 'Failed to generate link' });
  }
});
