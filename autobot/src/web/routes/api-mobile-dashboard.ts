/**
 * Mobile Dashboard API — dedicated endpoint for the Android app
 *
 * Returns all business data the mobile app needs in a single efficient call.
 * Runs all DB queries in parallel for minimum latency.
 *
 * GET /api/v1/mobile/dashboard
 *
 * Requires mobile JWT auth (tenantId extracted from token).
 */

import { Router } from 'express';
import { requireMobileOrDeviceAuth } from '../middleware/mobile-auth.js';
import { getTenantId } from '../../shared/validate.js';
import { query, queryOne } from '../../db/pool.js';
import * as sessionsRepo from '../../db/sessions-repo.js';
import * as productsRepo from '../../db/products-repo.js';
import { logger } from '../../shared/logger.js';

const router = Router();
router.use(requireMobileOrDeviceAuth);

// GET /api/v1/mobile/dashboard
router.get('/', async (req, res) => {
  const tenantId = getTenantId(req);

  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayIso = todayStart.toISOString();

    const [
      todayMetrics,
      weekMetrics,
      monthMetrics,
      pendingPayments,
      todayAppointments,
      recentMessages,
      session,
      productsCount,
      pendingTasksCount,
    ] = await Promise.all([
      // Today's revenue + order count
      queryOne<{ revenue: string; orders: string }>(
        `SELECT COALESCE(SUM(total), 0)::text AS revenue, COUNT(*)::text AS orders
         FROM orders WHERE tenant_id = $1 AND created_at >= $2`,
        [tenantId, todayIso],
      ),

      // This week's revenue
      queryOne<{ revenue: string; orders: string }>(
        `SELECT COALESCE(SUM(total), 0)::text AS revenue, COUNT(*)::text AS orders
         FROM orders WHERE tenant_id = $1 AND created_at >= NOW() - INTERVAL '7 days'`,
        [tenantId],
      ),

      // This month's revenue
      queryOne<{ revenue: string; orders: string }>(
        `SELECT COALESCE(SUM(total), 0)::text AS revenue, COUNT(*)::text AS orders
         FROM orders WHERE tenant_id = $1 AND created_at >= date_trunc('month', NOW())`,
        [tenantId],
      ),

      // Pending payments (up to 10)
      query<{ id: number; customer: string; total: string; created_at: string }>(
        `SELECT o.id, COALESCE(c.name, 'Sin nombre') AS customer, o.total::text, o.created_at::text
         FROM orders o
         LEFT JOIN customers c ON c.id = o.customer_id AND c.tenant_id = o.tenant_id
         WHERE o.tenant_id = $1 AND o.status IN ('pending', 'payment_requested')
         ORDER BY o.created_at DESC LIMIT 10`,
        [tenantId],
      ),

      // Today's appointments
      query<{ scheduled_at: string; service_name: string; customer: string; status: string; duration_minutes: number }>(
        `SELECT a.scheduled_at, a.service_name, COALESCE(c.name, 'Sin nombre') AS customer,
                a.status, a.duration_minutes
         FROM appointments a
         LEFT JOIN customers c ON c.id = a.customer_id AND c.tenant_id = a.tenant_id
         WHERE a.tenant_id = $1 AND a.scheduled_at::date = CURRENT_DATE AND a.status NOT IN ('cancelled')
         ORDER BY a.scheduled_at`,
        [tenantId],
      ),

      // Recent messages (last 10)
      query<{ direction: string; body: string; jid: string; push_name: string; timestamp: string }>(
        `SELECT direction, body, jid, push_name, timestamp
         FROM message_log WHERE tenant_id = $1
         ORDER BY timestamp DESC LIMIT 10`,
        [tenantId],
      ),

      // WhatsApp connection status
      sessionsRepo.getSession(tenantId),

      // Products count
      productsRepo.getProductsCount(tenantId),

      // Pending tasks count
      queryOne<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM tasks WHERE tenant_id = $1 AND status = 'pending'`,
        [tenantId],
      ).catch(() => ({ count: '0' })),
    ]);

    res.json({
      metrics: {
        today: {
          revenue: todayMetrics?.revenue ?? '0',
          orders: Number(todayMetrics?.orders ?? 0),
        },
        week: {
          revenue: weekMetrics?.revenue ?? '0',
          orders: Number(weekMetrics?.orders ?? 0),
        },
        month: {
          revenue: monthMetrics?.revenue ?? '0',
          orders: Number(monthMetrics?.orders ?? 0),
        },
        productsCount,
        pendingTasksCount: Number(pendingTasksCount?.count ?? 0),
      },
      pendingPayments: pendingPayments.rows.map(r => ({
        orderId: r.id,
        customer: r.customer,
        amount: r.total,
        createdAt: r.created_at,
      })),
      todayAppointments: todayAppointments.rows.map(r => ({
        time: new Date(r.scheduled_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false }),
        customer: r.customer,
        service: r.service_name,
        status: r.status,
        durationMinutes: r.duration_minutes,
      })),
      recentMessages: recentMessages.rows.map(r => ({
        from: r.push_name || r.jid?.split('@')[0] || 'Desconocido',
        text: r.body?.substring(0, 100) || '',
        time: r.timestamp,
        direction: r.direction,
      })),
      connectionStatus: session?.connectionStatus ?? 'disconnected',
    });
  } catch (err) {
    logger.error({ tenantId, err }, 'Mobile dashboard aggregation failed');
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

export { router as mobileDashboardRouter };
