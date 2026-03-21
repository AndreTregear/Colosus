import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import * as customersRepo from '../../db/customers-repo.js';
import * as productsRepo from '../../db/products-repo.js';
import { query } from '../../db/pool.js';
import { getTenantId, getJid, getChannel, type YayaToolContext } from './types.js';

export const getRecommendationsTool = createTool({
  id: 'get_recommendations',
  description: "Get personalized product recommendations based on the customer's purchase history. For new customers, returns the most popular products. Use when the customer asks for suggestions or seems undecided.",
  inputSchema: z.object({}),
  execute: async (_input, context: YayaToolContext) => {
    const tenantId = getTenantId(context);
    const jid = getJid(context);
    const channel = getChannel(context);

    const customer = await customersRepo.getCustomerByJid(tenantId, jid, channel);
    if (!customer) {
      // New customer — return popular products
      const popular = await query<{ product_id: number; name: string; order_count: string }>(
        `SELECT p.id as product_id, p.name, COUNT(oi.id) as order_count
         FROM order_items oi
         JOIN orders o ON oi.order_id = o.id
         JOIN products p ON oi.product_id = p.id
         WHERE o.tenant_id = $1 AND p.active = true
         GROUP BY p.id, p.name
         ORDER BY order_count DESC LIMIT 5`,
        [tenantId],
      );
      return JSON.stringify({
        type: 'popular',
        reason: 'New customer — showing most popular products',
        products: popular.rows.map(r => ({ id: r.product_id, name: r.name, orderCount: Number(r.order_count) })),
      });
    }

    // Returning customer — recommend based on purchase history
    const previouslyOrdered = await query<{ product_id: number; category: string; total_qty: string }>(
      `SELECT oi.product_id, p.category, SUM(oi.quantity) as total_qty
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       JOIN products p ON oi.product_id = p.id
       WHERE o.tenant_id = $1 AND o.customer_id = $2 AND o.status != 'cancelled'
       GROUP BY oi.product_id, p.category
       ORDER BY total_qty DESC`,
      [tenantId, customer.id],
    );

    const favoriteCategories = [...new Set(previouslyOrdered.rows.map(r => r.category))].slice(0, 3);
    const purchasedIds = previouslyOrdered.rows.map(r => r.product_id);

    // Find products in favorite categories not yet purchased
    const allActive = await productsRepo.getActiveProducts(tenantId);
    const recommendations = allActive
      .filter(p => favoriteCategories.includes(p.category) && !purchasedIds.includes(p.id))
      .slice(0, 5);

    // Frequently reordered items
    const reorderSuggestions = previouslyOrdered.rows.slice(0, 3).map(r => ({
      productId: r.product_id,
      category: r.category,
      previousQuantity: Number(r.total_qty),
    }));

    return JSON.stringify({
      type: 'personalized',
      favoriteCategories,
      newRecommendations: recommendations.map(p => ({ id: p.id, name: p.name, price: p.price, category: p.category })),
      reorderSuggestions,
    });
  },
});
