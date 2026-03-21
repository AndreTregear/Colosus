import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import * as customersRepo from '../../db/customers-repo.js';
import * as ordersRepo from '../../db/orders-repo.js';
import { getTenantId, getJid, getChannel, type YayaToolContext } from './types.js';

export const createOrderTool = createTool({
  id: 'create_order',
  description: 'Create a new order for the customer. Use this after the customer has confirmed the products they want to buy. Make sure to collect their name and delivery location before creating orders for physical products.',
  inputSchema: z.object({
    items: z.array(z.object({
      product_id: z.number().int().positive().describe('Product ID from catalog'),
      quantity: z.number().int().positive().describe('Quantity to order'),
    })).min(1).describe('List of products and quantities'),
    delivery_type: z.enum(['delivery', 'pickup', 'none']).optional().describe('Delivery method'),
    delivery_address: z.string().optional().describe('Delivery address if not using saved location'),
    notes: z.string().optional().describe('Special instructions for the order'),
  }),
  execute: async (input, context: YayaToolContext) => {
    const tenantId = getTenantId(context);
    const jid = getJid(context);
    const channel = getChannel(context);

    const customer = await customersRepo.getOrCreateCustomer(tenantId, jid, channel);
    const items = input.items.map(i => ({
      productId: i.product_id,
      quantity: i.quantity,
    }));

    const order = await ordersRepo.createOrder(
      tenantId,
      customer.id,
      items,
      input.delivery_type || 'none',
      input.delivery_address || customer.address || undefined,
      input.notes || undefined,
    );

    return JSON.stringify({
      orderId: order.id,
      total: order.total,
      items: order.items?.map(i => ({
        productName: i.productName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
    });
  },
});
