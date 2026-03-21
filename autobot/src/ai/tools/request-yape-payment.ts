import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import * as ordersRepo from '../../db/orders-repo.js';
import * as paymentsRepo from '../../db/payments-repo.js';
import * as settingsRepo from '../../db/settings-repo.js';
import { BUSINESS_CURRENCY } from '../../config.js';
import { getTenantId, getJid, getChannel, type YayaToolContext } from './types.js';

const PAYABLE_STATUSES = ['pending', 'confirmed'];

export const requestYapePaymentTool = createTool({
  id: 'request_yape_payment',
  description: 'Request a Yape payment for an existing order. Returns the Yape number and amount the customer should pay. Use this after creating an order.',
  inputSchema: z.object({
    order_id: z.number().int().positive().describe('The order ID to request payment for'),
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

    // Validate order status
    if (!PAYABLE_STATUSES.includes(order.status)) {
      return `Error: Cannot request payment for order #${order.id} — status is "${order.status}".`;
    }

    // Check for existing pending payment (idempotency)
    const existingPayments = await paymentsRepo.getPaymentsByOrder(tenantId, order.id);
    const existingPending = existingPayments.find(p => p.status === 'pending');
    if (existingPending) {
      const yapeNumber = await settingsRepo.getEffectiveSetting(tenantId, 'yape_number');
      const yapeName = await settingsRepo.getEffectiveSetting(tenantId, 'yape_name');
      const currency = await settingsRepo.getEffectiveSetting(tenantId, 'currency', BUSINESS_CURRENCY);
      return JSON.stringify({
        paymentId: existingPending.id,
        yapeNumber, yapeName, amount: order.total, currency, orderId: order.id,
        message: 'Payment already requested.',
      });
    }

    const payment = await paymentsRepo.createPayment(tenantId, order.id, order.total, 'yape');
    await ordersRepo.updateOrderStatus(tenantId, order.id, 'payment_requested');

    const yapeNumber = await settingsRepo.getEffectiveSetting(tenantId, 'yape_number');
    const yapeName = await settingsRepo.getEffectiveSetting(tenantId, 'yape_name');
    const currency = await settingsRepo.getEffectiveSetting(tenantId, 'currency', BUSINESS_CURRENCY);

    return JSON.stringify({
      paymentId: payment.id,
      yapeNumber,
      yapeName,
      amount: order.total,
      currency,
      orderId: order.id,
    });
  },
});
