import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { query } from '../../db/pool.js';
import { getTenantId, getJid, type YayaToolContext } from './types.js';

/**
 * Lets the AI agent look up a customer's full interaction history from the
 * data warehouse — past orders, total spend, message count, media shared.
 * This gives the agent deep context for personalized conversations.
 */
export const getCustomerHistoryTool = createTool({
  id: 'get_customer_history',
  description: 'Get the current customer\'s full history: total orders, spend, interaction breakdown (messages, voice notes, images), and recent orders. Use this to personalize the conversation and make relevant suggestions.',
  inputSchema: z.object({}),
  execute: async (input, context: YayaToolContext) => {
    const tenantId = getTenantId(context);
    const jid = getJid(context);

    // Get customer dimension data
    const dim = await query<Record<string, unknown>>(
      `SELECT total_orders, total_spent, first_seen_at, preferred_channel, tags
       FROM wh_dim_customers dc
       JOIN customers c ON c.id = dc.customer_id AND c.tenant_id = dc.tenant_id
       WHERE dc.tenant_id = $1 AND c.jid = $2
       LIMIT 1`,
      [tenantId, jid],
    );

    // Get recent interaction counts by type
    const interactions = await query<Record<string, unknown>>(
      `SELECT interaction_type, COUNT(*) AS count
       FROM wh_fact_interactions fi
       JOIN customers c ON c.id = fi.customer_id AND c.tenant_id = fi.tenant_id
       WHERE fi.tenant_id = $1 AND c.jid = $2
       GROUP BY interaction_type`,
      [tenantId, jid],
    );

    // Get recent orders
    const orders = await query<Record<string, unknown>>(
      `SELECT o.id, o.status, o.total, o.created_at
       FROM orders o
       JOIN customers c ON c.id = o.customer_id
       WHERE o.tenant_id = $1 AND c.jid = $2
       ORDER BY o.created_at DESC LIMIT 5`,
      [tenantId, jid],
    );

    const customer = dim.rows[0];
    return JSON.stringify({
      totalOrders: customer ? Number(customer.total_orders) : 0,
      totalSpent: customer ? Number(customer.total_spent) : 0,
      firstSeenAt: customer?.first_seen_at ?? null,
      tags: customer?.tags ?? [],
      interactionBreakdown: interactions.rows.map(r => ({
        type: r.interaction_type,
        count: Number(r.count),
      })),
      recentOrders: orders.rows.map(r => ({
        id: r.id,
        status: r.status,
        total: Number(r.total),
        date: r.created_at,
      })),
    });
  },
});
