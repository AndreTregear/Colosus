import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import * as ordersRepo from '../../db/orders-repo.js';
import * as paymentsRepo from '../../db/payments-repo.js';
import * as yapeNotifRepo from '../../db/yape-notifications-repo.js';
import { matchYapePayment } from '../../payments/yape-matcher.js';
import { getTenantId, getJid, getChannel, type YayaToolContext } from './types.js';

export const validateYapePaymentTool = createTool({
  id: 'validate_yape_payment',
  description: 'Check if a Yape payment has been received for an order. Use this when the customer says they have already paid.',
  inputSchema: z.object({
    order_id: z.number().int().positive().describe('The order ID to validate payment for'),
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

    const payments = await paymentsRepo.getPaymentsByOrder(tenantId, input.order_id);
    const confirmed = payments.find(p => p.status === 'confirmed');
    if (confirmed) {
      return JSON.stringify({
        validated: true,
        paymentId: confirmed.id,
        message: 'Payment confirmed.',
      });
    }

    // Try to match against unmatched Yape notifications
    const pendingPayment = payments.find(p => p.status === 'pending' && p.method === 'yape');
    if (pendingPayment) {
      const unmatched = await yapeNotifRepo.getUnmatchedByTenant(tenantId);
      const match = unmatched.find(n => n.amount === pendingPayment.amount);
      if (match) {
        const result = await matchYapePayment(tenantId, match.senderName, match.amount, match.id);
        if (result.matched) {
          return JSON.stringify({
            validated: true,
            paymentId: result.paymentId,
            message: 'Payment confirmed via Yape.',
          });
        }
      }
    }

    return JSON.stringify({
      validated: false,
      message: 'Payment not yet confirmed. The Yaya app will verify it automatically.',
    });
  },
});
