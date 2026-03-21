import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import * as ordersRepo from '../../db/orders-repo.js';
import * as customersRepo from '../../db/customers-repo.js';
import { getTenantId, getJid, getChannel, type YayaToolContext } from './types.js';

export const getOrderStatusTool = createTool({
  id: 'get_order_status',
  description: 'Get the status and details of an order. If no order_id is provided, returns the most recent order for the current customer.',
  inputSchema: z.object({
    order_id: z.number().optional().describe('Order ID to look up. Omit to get the most recent order.'),
  }),
  execute: async (input, context: YayaToolContext) => {
    const tenantId = getTenantId(context);
    const jid = getJid(context);
    const channel = getChannel(context);

    if (input.order_id) {
      const order = await ordersRepo.getOrderById(tenantId, input.order_id);
      if (!order) return 'Order not found.';
      return JSON.stringify({
        orderId: order.id,
        status: order.status,
        total: order.total,
        deliveryType: order.deliveryType,
        items: order.items?.map(i => ({
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
        createdAt: order.createdAt,
      });
    }

    // No order_id — return most recent order for this customer
    const customer = await customersRepo.getCustomerByJid(tenantId, jid, channel);
    if (!customer) return 'No orders found for this customer.';

    const orders = await ordersRepo.getOrdersByCustomer(tenantId, customer.id);
    if (orders.length === 0) return 'No orders found for this customer.';

    const latest = await ordersRepo.getOrderById(tenantId, orders[0]!.id);
    if (!latest) return 'No orders found.';

    return JSON.stringify({
      orderId: latest.id,
      status: latest.status,
      total: latest.total,
      deliveryType: latest.deliveryType,
      items: latest.items?.map(i => ({
        productName: i.productName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
      createdAt: latest.createdAt,
    });
  },
});
