import { Router } from 'express';
import { query } from '../../db/pool.js';
import { logger } from '../../shared/logger.js';
import { requireSession, requireAdmin } from '../middleware/session-auth.js';

const router = Router();

// POST /api/website/leads — public endpoint for contact form submissions
router.post('/', async (req, res) => {
  try {
    const { name, phone, business, message, website: honeypot, _ts } = req.body;

    // Honeypot: bots fill hidden fields — silently accept to not reveal detection
    if (honeypot) {
      return res.status(201).json({ ok: true, id: 0 });
    }

    // Timing check: reject submissions faster than 2 seconds
    if (_ts && (Date.now() - Number(_ts)) < 2000) {
      return res.status(201).json({ ok: true, id: 0 });
    }

    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }

    // Validate phone format (digits, optional +, spaces, dashes, parens — 7 to 20 chars)
    const phoneStr = String(phone).trim();
    if (!/^\+?[\d\s\-()]{7,20}$/.test(phoneStr)) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    // Basic input sanitization — limit field lengths
    const safeName = String(name).slice(0, 200);
    const safePhone = phoneStr.slice(0, 50);
    const safeBusiness = business ? String(business).slice(0, 200) : null;
    const safeMessage = message ? String(message).slice(0, 2000) : null;

    const result = await query(
      `INSERT INTO website_leads (name, phone, business, message, source)
       VALUES ($1, $2, $3, $4, 'website')
       RETURNING id, created_at`,
      [safeName, safePhone, safeBusiness, safeMessage]
    );

    logger.info({ leadId: result.rows[0]?.id }, 'Website lead captured');
    res.status(201).json({ ok: true, id: result.rows[0]?.id });
  } catch (err) {
    logger.error({ err: (err as Error).message }, 'Failed to save website lead');
    res.status(500).json({ error: 'Failed to save lead' });
  }
});

// GET /api/website/leads — admin-only: list all website leads
router.get('/', requireSession, requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Number(req.query.offset) || 0;
    const status = req.query.status as string | undefined;

    let sql = 'SELECT * FROM website_leads';
    const params: unknown[] = [];

    if (status) {
      sql += ' WHERE status = $1';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC';
    sql += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(sql, params);

    const countResult = await query(
      `SELECT COUNT(*)::int AS total FROM website_leads${status ? ' WHERE status = $1' : ''}`,
      status ? [status] : []
    );

    res.json({
      leads: result.rows,
      total: countResult.rows[0]?.total ?? 0,
      limit,
      offset,
    });
  } catch (err) {
    logger.error({ err: (err as Error).message }, 'Failed to fetch website leads');
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// PATCH /api/website/leads/:id — admin-only: update lead status
router.patch('/:id', requireSession, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['new', 'contacted', 'qualified', 'converted', 'lost'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const result = await query(
      'UPDATE website_leads SET status = $1 WHERE id = $2 RETURNING *',
      [status, Number(req.params.id)]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    logger.error({ err: (err as Error).message }, 'Failed to update website lead');
    res.status(500).json({ error: 'Failed to update lead' });
  }
});

export { router as websiteLeadsRouter };
