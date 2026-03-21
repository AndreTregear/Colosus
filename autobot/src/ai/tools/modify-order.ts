import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import * as ordersRepo from '../../db/orders-repo.js';
import * as customersRepo from '../../db/customers-repo.js';
import { getTenantId, getJid, getChannel, type YayaToolContext } from './types.js';

export const modifyOrderTool = createTool({
  id: 'modify_order',
  description: 'Modify the items in an existing order that has not been paid yet. Replaces all items with the new list. Always confirm the changes with the customer before modifying.',
  inputSchema: z.object({
    order_id: z.number().int().positive().describe('The order ID to modify'),
    items: z.array(z.object({
      product_id: z.number().int().positive().describe('Product ID from catalog'),
      quantity: z.number().int().positive().describe('New quantity'),
    })).min(1).describe('Complete new list of items (replaces all existing items)'),
  }),
  execute: async (input, context: YayaToolContext) => {
    const tenantId = getTenantId(context);
    const jid = getJid(context);
    const channel = getChannel(context);

    try {
      // Verify customer owns this order
      const order = await ordersRepo.getOrderById(tenantId, input.order_id);
      if (!order) return 'Error: Order not found.';
      const customer = await customersRepo.getCustomerByJid(tenantId, jid, channel);
      if (!customer || order.customerId !== customer.id) {
        return 'Error: Order not found.';
      }

      const modified = await ordersRepo.modifyOrder(
        tenantId, input.order_id,
        input.items.map(i => ({ productId: i.product_id, quantity: i.quantity })),
      );

      return JSON.stringify({
        orderId: modified.id,
        newTotal: modified.total,
        items: modified.items?.map(i => ({
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
        status: modified.status,
      });
    } catch (err) {
      return `Error: ${(err as Error).message}`;
    }
  },
});
