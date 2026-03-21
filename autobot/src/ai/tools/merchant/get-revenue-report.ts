import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { query } from '../../../db/pool.js';
import { getTenantId, type YayaToolContext } from '../types.js';

export const getRevenueReportTool = createTool({
  id: 'get_revenue_report',
  description: 'Get a daily revenue report showing orders and revenue per day for the specified number of days.',
  inputSchema: z.object({
    days: z.number().min(1).max(90).default(30).describe('Number of days to include in the report'),
  }),
  execute: async (input, context: YayaToolContext) => {
    const tenantId = getTenantId(context);

    const result = await query<{
      date: string;
      order_count: string;
      revenue: string;
    }>(
      `SELECT DATE(created_at) as date,
              COUNT(*) as order_count,
              COALESCE(SUM(total), 0) as revenue
       FROM orders
       WHERE tenant_id = $1 AND created_at >= now() - ($2 || ' days')::INTERVAL
         AND status != 'cancelled'
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,
      [tenantId, input.days],
    );

    const totalRevenue = result.rows.reduce((sum, r) => sum + Number(r.revenue), 0);
    const totalOrders = result.rows.reduce((sum, r) => sum + Number(r.order_count), 0);

    return JSON.stringify({
      periodDays: input.days,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalOrders,
      avgDailyRevenue: Number((totalRevenue / (input.days ?? 7)).toFixed(2)),
      dailyBreakdown: result.rows.map(r => ({
        date: r.date,
        orders: Number(r.order_count),
        revenue: Number(Number(r.revenue).toFixed(2)),
      })),
    });
  },
});
