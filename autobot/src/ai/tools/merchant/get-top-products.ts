import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { query } from '../../../db/pool.js';
import { getTenantId, type YayaToolContext } from '../types.js';

export const getTopProductsTool = createTool({
  id: 'get_top_products',
  description: 'Get the best-selling products ranked by revenue for a given period.',
  inputSchema: z.object({
    limit: z.number().min(1).max(20).default(10).describe('Number of top products to return'),
    period: z.enum(['week', 'month', 'quarter']).default('month').describe('Time period'),
  }),
  execute: async (input, context: YayaToolContext) => {
    const tenantId = getTenantId(context);
    const daysBack = input.period === 'week' ? 7 : input.period === 'month' ? 30 : 90;
    const since = new Date(Date.now() - daysBack * 86400_000).toISOString();

    const result = await query<{
      product_id: number;
      product_name: string;
      category: string;
      total_qty: string;
      total_revenue: string;
      order_count: string;
    }>(
      `SELECT oi.product_id, p.name as product_name, p.category,
              SUM(oi.quantity) as total_qty,
              SUM(oi.quantity * oi.unit_price) as total_revenue,
              COUNT(DISTINCT oi.order_id) as order_count
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       JOIN products p ON oi.product_id = p.id
       WHERE o.tenant_id = $1 AND o.created_at >= $2 AND o.status != 'cancelled'
       GROUP BY oi.product_id, p.name, p.category
       ORDER BY total_revenue DESC
       LIMIT $3`,
      [tenantId, since, input.limit],
    );

    return JSON.stringify({
      period: input.period,
      topProducts: result.rows.map(r => ({
        productId: r.product_id,
        name: r.product_name,
        category: r.category,
        unitsSold: Number(r.total_qty),
        revenue: Number(Number(r.total_revenue).toFixed(2)),
        orderCount: Number(r.order_count),
      })),
    });
  },
});
