import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import * as ordersRepo from '../../db/orders-repo.js';
import * as customersRepo from '../../db/customers-repo.js';
import { getTenantId, getJid, getChannel, type YayaToolContext } from './types.js';

const CANCELLABLE_STATUSES = ['pending', 'confirmed', 'payment_requested'];

export const cancelOrderTool = createTool({
  id: 'cancel_order',
  description: 'Cancel a pending or unpaid order. Cannot cancel orders that are already paid, preparing, shipped, or delivered. Always confirm with the customer before cancelling.',
  inputSchema: z.object({
    order_id: z.number().int().positive().describe('The order ID to cancel'),
    reason: z.string().optional().describe('Reason for cancellation'),
  }),
  execute: async (input, context: YayaToolContext) => {
    const tenantId = getTenantId(context);
    const jid = getJid(context);
    const channel = getChannel(context);

    const order = await ordersRepo.getOrderById(tenantId, input.order_id);
    if (!order) return 'Error: Order not found.';

    // Verify customer owns this order
    const customer = await customersRepo.getCustomerByJid(tenantId, jid, channel);
    if (!customer || order.customerId !== customer.id) {
      return 'Error: Order not found.';
    }

    if (!CANCELLABLE_STATUSES.includes(order.status)) {
      return `Cannot cancel order #${order.id} — it is already in "${order.status}" status. Only pending, confirmed, or payment_requested orders can be cancelled.`;
    }

    await ordersRepo.updateOrderStatus(tenantId, order.id, 'cancelled');
    return `Order #${order.id} has been cancelled.${input.reason ? ` Reason: ${input.reason}` : ''}`;
  },
});
