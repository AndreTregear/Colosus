import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import * as ordersRepo from '../../db/orders-repo.js';
import * as paymentsRepo from '../../db/payments-repo.js';
import * as refundsRepo from '../../db/refunds-repo.js';
import { getTenantId, getJid, getChannel, type YayaToolContext } from './types.js';

export const refundPaymentTool = createTool({
  id: 'refund_payment',
  description: 'Process a refund for a paid order. This will mark the order as refunded and create a refund record. Only use after confirming with the customer and for orders that are in "paid" or "preparing" status.',
  inputSchema: z.object({
    order_id: z.number().int().positive().describe('The order ID to refund'),
    reason: z.string().optional().describe('Reason for the refund'),
  }),
  execute: async (input, context: YayaToolContext) => {
    const tenantId = getTenantId(context);
    const jid = getJid(context);
    const channel = getChannel(context);

    const order = await ordersRepo.getOrderById(tenantId, input.order_id);
    if (!order) return 'Error: Order not found.';

    // Verify customer owns this order
    const { getCustomerByJid } = await import('../../db/customers-repo.js');
    const customer = await getCustomerByJid(tenantId, jid, channel);
    if (!customer || order.customerId !== customer.id) {
      return 'Error: Order not found.';
    }

    if (order.status !== 'paid' && order.status !== 'preparing') {
      return `Error: Cannot refund order #${order.id} — status is "${order.status}". Only paid or preparing orders can be refunded.`;
    }

    const payments = await paymentsRepo.getPaymentsByOrder(tenantId, order.id);
    const confirmedPayment = payments.find(p => p.status === 'confirmed');
    if (!confirmedPayment) {
      return `Error: No confirmed payment found for order #${order.id}.`;
    }

    const refund = await refundsRepo.createRefund(
      tenantId, order.id, confirmedPayment.id,
      confirmedPayment.amount, input.reason, 'agent',
    );

    await ordersRepo.updateOrderStatus(tenantId, order.id, 'refunded');

    return JSON.stringify({
      refundId: refund.id,
      orderId: order.id,
      amount: refund.amount,
      status: 'completed',
      message: `Refund of ${refund.amount} for order #${order.id} has been processed.`,
    });
  },
});
