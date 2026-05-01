/**
 * Admin Analytics Routes for AI Usage
 * Queries ai_usage_events table directly
 */

import { Router, type Request, type Response } from 'express';
import { requireAdmin } from '../middleware/session-auth.js';
import { query } from '../../db/pool.js';
import { logger } from '../../shared/logger.js';

const router = Router();

router.use(requireAdmin);

/**
 * Returns the same payload for `/` and `/dashboard`.
 */
async function aiUsageDashboard(_req: Request, res: Response): Promise<void> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [todayResult, weekResult] = await Promise.all([
      query<{ requests: string; tokens: string; cost: string }>(
        `SELECT COUNT(*)::text as requests,
                COALESCE(SUM(prompt_tokens + completion_tokens), 0)::text as tokens,
                COALESCE(SUM(total_cost), 0)::text as cost
         FROM ai_usage_events WHERE timestamp >= $1`, [today]),
      query<{ requests: string; tokens: string; cost: string }>(
        `SELECT COUNT(*)::text as requests,
                COALESCE(SUM(prompt_tokens + completion_tokens), 0)::text as tokens,
                COALESCE(SUM(total_cost), 0)::text as cost
         FROM ai_usage_events WHERE timestamp >= $1`, [lastWeek]),
    ]);

    const t = todayResult.rows[0];
    const w = weekResult.rows[0];

    res.json({
      today: {
        requests: parseInt(t?.requests || '0'),
        tokens: parseInt(t?.tokens || '0'),
        cost: parseFloat(t?.cost || '0'),
      },
      thisWeek: {
        requests: parseInt(w?.requests || '0'),
        tokens: parseInt(w?.tokens || '0'),
        cost: parseFloat(w?.cost || '0'),
      },
    });
  } catch (err) {
    logger.error({ err }, 'AI usage dashboard failed');
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
}

router.get('/', aiUsageDashboard);
router.get('/dashboard', aiUsageDashboard);

/**
 * GET /api/admin/ai-usage/by-tenant
 */
router.get('/by-tenant', async (req: Request, res: Response) => {
  try {
    const days = Math.min(parseInt(req.query.days as string) || 7, 30);

    const result = await query<{
      tenant_id: string; tenant_name: string;
      requests: string; tokens: string; cost: string;
    }>(`
      SELECT t.id as tenant_id, t.name as tenant_name,
        COUNT(*) as requests,
        SUM(prompt_tokens + completion_tokens) as tokens,
        SUM(cost) as cost
      FROM ai_usage_events e
      JOIN tenants t ON t.id = e.tenant_id
      WHERE e.timestamp >= NOW() - INTERVAL '${days} days'
      GROUP BY t.id, t.name
      ORDER BY cost DESC
    `);

    res.json({
      days,
      tenants: result.rows.map(r => ({
        tenantId: r.tenant_id,
        tenantName: r.tenant_name,
        requests: parseInt(r.requests),
        tokens: parseInt(r.tokens),
        cost: parseFloat(r.cost),
      })),
    });
  } catch (err) {
    logger.error({ err }, 'Tenant usage query failed');
    res.status(500).json({ error: 'Failed to load tenant usage' });
  }
});

/**
 * GET /api/admin/ai-usage/trends
 */
router.get('/trends', async (req: Request, res: Response) => {
  try {
    const days = Math.min(parseInt(req.query.days as string) || 30, 90);

    const result = await query<{
      date: string; requests: string; tokens: string; cost: string;
    }>(`
      SELECT DATE(timestamp) as date,
        COUNT(*) as requests,
        SUM(prompt_tokens + completion_tokens) as tokens,
        SUM(cost) as cost
      FROM ai_usage_events
      WHERE timestamp >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE(timestamp)
      ORDER BY date DESC
    `);

    res.json({
      days,
      trends: result.rows.map(r => ({
        date: r.date,
        requests: parseInt(r.requests),
        tokens: parseInt(r.tokens),
        cost: parseFloat(r.cost),
      })),
    });
  } catch (err) {
    logger.error({ err }, 'Usage trends query failed');
    res.status(500).json({ error: 'Failed to load trends' });
  }
});

export { router as aiUsageAdminRouter };
