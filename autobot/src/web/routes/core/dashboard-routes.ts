import { Router } from 'express';
import { requireTenantAuth } from '../../middleware/tenant-auth.js';
import { getTenantId } from '../../../shared/validate.js';
import { query } from '../../../db/pool.js';
import { logger } from '../../../shared/logger.js';

const router = Router();
router.use(requireTenantAuth);

/**
 * GET /api/web/dashboard
 * Combined summary data for the dashboard home screen.
 * Returns: today's revenue, expenses, profit, pending payments, recent orders, top products.
 */
router.get('/', async (req, res) => {
  const tenantId = getTenantId(req);
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

  try {
    // Today's revenue from delivered/confirmed orders
    const { rows: [todayRevRow] } = await query<{ revenue: string; order_count: string }>(
      `SELECT COALESCE(SUM(total), 0) as revenue, COUNT(*) as order_count
       FROM orders WHERE tenant_id = $1 AND created_at::date = $2::date`,
      [tenantId, today],
    );

    // Week's revenue
    const { rows: [weekRevRow] } = await query<{ revenue: string; order_count: string }>(
      `SELECT COALESCE(SUM(total), 0) as revenue, COUNT(*) as order_count
       FROM orders WHERE tenant_id = $1 AND created_at::date >= $2::date`,
      [tenantId, weekAgo],
    );

    // Pending payments
    const { rows: [pendingRow] } = await query<{ total: string; count: string }>(
      `SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count
       FROM payments WHERE tenant_id = $1 AND status = 'pending'`,
      [tenantId],
    );

    // Recent orders (last 5)
    const { rows: recentOrders } = await query(
      `SELECT o.id, o.total, o.status, o.created_at, c.name as customer_name
       FROM orders o
       LEFT JOIN customers c ON o.customer_id = c.id AND c.tenant_id = $1
       WHERE o.tenant_id = $1
       ORDER BY o.created_at DESC LIMIT 5`,
      [tenantId],
    );

    // Top products (last 7 days)
    const { rows: topProducts } = await query(
      `SELECT p.name, SUM(oi.quantity) as total_sold, SUM(oi.quantity * oi.unit_price) as total_revenue
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       JOIN products p ON oi.product_id = p.id
       WHERE o.tenant_id = $1 AND o.created_at::date >= $2::date
       GROUP BY p.id, p.name
       ORDER BY total_revenue DESC LIMIT 5`,
      [tenantId, weekAgo],
    );

    res.json({
      today: {
        revenue: Number(todayRevRow.revenue),
        expenses: 0,
        profit: Number(todayRevRow.revenue),
        orders: Number(todayRevRow.order_count),
      },
      week: {
        revenue: Number(weekRevRow.revenue),
        orders: Number(weekRevRow.order_count),
      },
      pending_payments: {
        total: Number(pendingRow.total),
        count: Number(pendingRow.count),
      },
      recent_orders: recentOrders,
      top_products: topProducts,
    });
  } catch (err) {
    logger.error({ err, tenantId }, 'Dashboard data fetch failed');
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

export { router as dashboardApiRouter };
