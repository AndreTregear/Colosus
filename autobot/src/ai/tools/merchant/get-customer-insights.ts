import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { query } from '../../../db/pool.js';
import { getTenantId, type YayaToolContext } from '../types.js';

export const getCustomerInsightsTool = createTool({
  id: 'get_customer_insights',
  description: 'Get customer analytics including total customers, active customers, new customers, and top spenders.',
  inputSchema: z.object({}),
  execute: async (_input, context: YayaToolContext) => {
    const tenantId = getTenantId(context);

    const totalCustomers = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM customers WHERE tenant_id = $1',
      [tenantId],
    );

    const activeCustomers = await query<{ count: string }>(
      `SELECT COUNT(DISTINCT o.customer_id) as count
       FROM orders o WHERE o.tenant_id = $1 AND o.created_at >= now() - INTERVAL '30 days'`,
      [tenantId],
    );

    const topCustomers = await query<{
      customer_id: number;
      customer_name: string;
      order_count: string;
      total_spent: string;
    }>(
      `SELECT o.customer_id, c.name as customer_name,
              COUNT(*) as order_count, SUM(o.total) as total_spent
       FROM orders o
       JOIN customers c ON o.customer_id = c.id
       WHERE o.tenant_id = $1 AND o.status != 'cancelled'
       GROUP BY o.customer_id, c.name
       ORDER BY total_spent DESC LIMIT 10`,
      [tenantId],
    );

    const newCustomers30d = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM customers WHERE tenant_id = $1 AND created_at >= now() - INTERVAL '30 days'`,
      [tenantId],
    );

    return JSON.stringify({
      totalCustomers: Number(totalCustomers.rows[0].count),
      activeCustomersLast30Days: Number(activeCustomers.rows[0].count),
      newCustomersLast30Days: Number(newCustomers30d.rows[0].count),
      topCustomers: topCustomers.rows.map(r => ({
        id: r.customer_id,
        name: r.customer_name || 'Unknown',
        orderCount: Number(r.order_count),
        totalSpent: Number(Number(r.total_spent).toFixed(2)),
      })),
    });
  },
});
