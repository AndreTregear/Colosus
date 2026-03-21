import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import * as deliveryRepo from '../../db/delivery-assignments-repo.js';
import * as ridersRepo from '../../db/riders-repo.js';
import { getTenantId, type YayaToolContext } from './types.js';

export const getDeliveryStatusTool = createTool({
  id: 'get_delivery_status',
  description: 'Get the delivery status for an order, including rider info and timestamps. Use this when a customer asks about their delivery.',
  inputSchema: z.object({
    order_id: z.number().describe('The order ID to check delivery status for'),
  }),
  execute: async ({ order_id }, context: YayaToolContext) => {
    const tenantId = getTenantId(context);
    const assignment = await deliveryRepo.getAssignmentByOrder(tenantId, order_id);
    if (!assignment) {
      return `No delivery assigned yet for order #${order_id}.`;
    }

    const rider = await ridersRepo.getRiderById(tenantId, assignment.riderId);

    return JSON.stringify({
      orderId: order_id,
      deliveryStatus: assignment.status,
      riderName: rider?.name || 'Unknown',
      riderPhone: rider?.phone || null,
      assignedAt: assignment.assignedAt,
      pickedUpAt: assignment.pickedUpAt,
      deliveredAt: assignment.deliveredAt,
      notes: assignment.notes,
    });
  },
});
