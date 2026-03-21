import { Router, type Request, type Response } from 'express';
import { exportTrainingData, getWarehouseSummary } from '../../warehouse/training-export.js';
import { query } from '../../db/pool.js';
import { getTenantId } from '../../shared/validate.js';
import { logger } from '../../shared/logger.js';

export const warehouseRouter = Router();

/**
 * GET /api/v1/warehouse/summary
 * Get warehouse analytics summary for the authenticated tenant.
 */
warehouseRouter.get('/summary', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);

    const summary = await getWarehouseSummary(tenantId);
    res.json(summary);
  } catch (err) {
    logger.error({ err }, 'Warehouse summary failed');
    res.status(500).json({ error: 'Failed to get summary' });
  }
});

/**
 * POST /api/v1/warehouse/export/training
 * Export training data as JSONL or CSV.
 */
warehouseRouter.post('/export/training', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);

    const { format = 'jsonl', dateFrom, dateTo, interactionTypes, anonymize = true } = req.body;

    if (!['jsonl', 'csv'].includes(format)) {
      res.status(400).json({ error: 'format must be "jsonl" or "csv"' });
      return;
    }

    const result = await exportTrainingData({
      tenantId,
      format,
      dateFrom,
      dateTo,
      interactionTypes,
      anonymize,
    });

    res.json({
      downloadUrl: result.url,
      rowCount: result.rowCount,
      format,
      expiresIn: 3600,
    });
  } catch (err) {
    logger.error({ err }, 'Training export failed');
    res.status(500).json({ error: 'Export failed' });
  }
});

/**
 * GET /api/v1/warehouse/interactions
 * Query interaction facts with filters.
 */
warehouseRouter.get('/interactions', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);

    const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);
    const offset = parseInt(req.query.offset as string) || 0;
    const type = req.query.type as string | undefined;

    let where = 'WHERE tenant_id = $1';
    const params: unknown[] = [tenantId];

    if (type) {
      params.push(type);
      where += ` AND interaction_type = $${params.length}`;
    }

    params.push(limit, offset);
    const result = await query(
      `SELECT * FROM wh_fact_interactions ${where} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );

    res.json({ interactions: result.rows, limit, offset });
  } catch (err) {
    logger.error({ err }, 'Query interactions failed');
    res.status(500).json({ error: 'Query failed' });
  }
});

/**
 * GET /api/v1/warehouse/daily-volume
 * Get daily message volume from materialized view.
 */
warehouseRouter.get('/daily-volume', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);

    const days = Math.min(parseInt(req.query.days as string) || 30, 365);

    const result = await query(
      `SELECT day, interaction_type, count
       FROM wh_mv_daily_volume
       WHERE tenant_id = $1 AND day >= now() - ($2 || ' days')::INTERVAL
       ORDER BY day DESC`,
      [tenantId, days],
    );

    res.json({ data: result.rows, days });
  } catch (err) {
    logger.error({ err }, 'Daily volume query failed');
    res.status(500).json({ error: 'Query failed' });
  }
});

/**
 * GET /api/v1/warehouse/etl-status
 * Get ETL checkpoint status (admin).
 */
warehouseRouter.get('/etl-status', async (_req: Request, res: Response) => {
  try {
    const result = await query(
      'SELECT source_table, last_id, last_timestamp, rows_processed, updated_at FROM wh_etl_checkpoints ORDER BY source_table',
    );
    res.json({ checkpoints: result.rows });
  } catch (err) {
    logger.error({ err }, 'ETL status query failed');
    res.status(500).json({ error: 'Query failed' });
  }
});
