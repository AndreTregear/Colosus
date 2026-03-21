import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { query } from '../../../db/pool.js';
import { getTenantId, type YayaToolContext } from '../types.js';

export const getSalesSummaryTool = createTool({
  id: 'get_sales_summary',
  description: 'Get a summary of sales metrics for a given period (today, this week, this month).',
  inputSchema: z.object({
    period: z.enum(['today', 'week', 'month']).describe('Time period for the summary'),
  }),
  execute: async (input, context: YayaToolContext) => {
    const tenantId = getTenantId(context);
    let dateFilter: string;
    const now = new Date();

    switch (input.period) {
      case 'today':
        dateFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        break;
      case 'week':
        dateFilter = new Date(now.getTime() - 7 * 86400_000).toISOString();
        break;
      case 'month':
        dateFilter = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        break;
      default:
        dateFilter = new Date(now.getTime() - 30 * 86400_000).toISOString();
    }

    const stats = await query<{
      total_orders: string;
      total_revenue: string;
      paid_orders: string;
      cancelled_orders: string;
      avg_order_value: string;
    }>(
      `SELECT
         COUNT(*) as total_orders,
         COALESCE(SUM(total), 0) as total_revenue,
         COUNT(*) FILTER (WHERE status IN ('paid', 'preparing', 'shipped', 'delivered')) as paid_orders,
         COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_orders,
         COALESCE(AVG(total), 0) as avg_order_value
       FROM orders WHERE tenant_id = $1 AND created_at >= $2`,
      [tenantId, dateFilter],
    );

    const row = stats.rows[0];
    return JSON.stringify({
      period: input.period,
      totalOrders: Number(row.total_orders),
      totalRevenue: Number(Number(row.total_revenue).toFixed(2)),
      paidOrders: Number(row.paid_orders),
      cancelledOrders: Number(row.cancelled_orders),
      avgOrderValue: Number(Number(row.avg_order_value).toFixed(2)),
    });
  },
});
