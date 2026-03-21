import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import * as ridersRepo from '../../db/riders-repo.js';
import * as ordersRepo from '../../db/orders-repo.js';
import * as customersRepo from '../../db/customers-repo.js';
import { tenantManager } from '../../bot/tenant-manager.js';
import { logger } from '../../shared/logger.js';
import { getTenantId, type YayaToolContext } from './types.js';

export const notifyRiderTool = createTool({
  id: 'notify_rider',
  description: 'Send a WhatsApp message to a delivery rider with pickup and delivery details. If no message is provided, an automatic one is generated from the order details.',
  inputSchema: z.object({
    rider_id: z.number().describe('Rider ID to send the message to'),
    order_id: z.number().describe('Order ID for context'),
    message: z.string().optional().describe('Custom message to send. If omitted, an automatic message with order details is generated.'),
  }),
  execute: async ({ rider_id, order_id, message }, context: YayaToolContext) => {
    const tenantId = getTenantId(context);
    const rider = await ridersRepo.getRiderById(tenantId, rider_id);
    if (!rider) return 'Error: Rider not found.';
    if (!rider.whatsappJid) return `Error: Rider ${rider.name} does not have a WhatsApp number configured.`;

    // Build default message if not provided
    let finalMessage = message;
    if (!finalMessage) {
      const order = await ordersRepo.getOrderById(tenantId, order_id);
      const customer = order?.customerId
        ? await customersRepo.getCustomerById(tenantId, order.customerId)
        : null;

      const items = order?.items?.map(i => `${i.quantity}x ${i.productName}`).join(', ') || 'items';
      finalMessage = `Nuevo pedido #${order_id}. ${items}. `;
      if (customer?.name) finalMessage += `Cliente: ${customer.name}. `;
      if (customer?.address || customer?.location) {
        finalMessage += `Entregar a: ${customer.address || customer.location}. `;
      }
      if (customer?.locationLat && customer?.locationLng) {
        finalMessage += `Maps: https://maps.google.com/maps?q=${customer.locationLat},${customer.locationLng}`;
      }
    }

    try {
      await tenantManager.sendMessage(tenantId, rider.whatsappJid, finalMessage);
      return `Message sent to rider ${rider.name}: "${finalMessage}"`;
    } catch (err) {
      logger.error({ err, tenantId, riderId: rider_id }, 'Failed to send message to rider');
      return `Failed to send WhatsApp message to rider ${rider.name}. They may be offline.`;
    }
  },
});
