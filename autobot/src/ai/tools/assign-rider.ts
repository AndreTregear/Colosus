import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import * as deliveryRepo from '../../db/delivery-assignments-repo.js';
import * as ridersRepo from '../../db/riders-repo.js';
import * as ordersRepo from '../../db/orders-repo.js';
import { getTenantId, type YayaToolContext } from './types.js';

export const assignRiderTool = createTool({
  id: 'assign_rider',
  description: 'Assign a delivery rider to an order. If no rider_id is specified, the first available rider is automatically assigned. Use this after payment is confirmed for delivery orders.',
  inputSchema: z.object({
    order_id: z.number().describe('The order ID to assign a rider to'),
    rider_id: z.number().optional().describe('Specific rider ID to assign. Omit to auto-assign the first available rider.'),
  }),
  execute: async ({ order_id, rider_id }, context: YayaToolContext) => {
    const tenantId = getTenantId(context);
    const order = await ordersRepo.getOrderById(tenantId, order_id);
    if (!order) return 'Error: Order not found.';

    // Check if already assigned
    const existing = await deliveryRepo.getAssignmentByOrder(tenantId, order_id);
    if (existing && existing.status !== 'cancelled') {
      const existingRider = await ridersRepo.getRiderById(tenantId, existing.riderId);
      return `Order #${order_id} is already assigned to rider ${existingRider?.name || 'Unknown'} (status: ${existing.status}).`;
    }

    let rider;
    if (rider_id) {
      rider = await ridersRepo.getRiderById(tenantId, rider_id);
      if (!rider) return 'Error: Rider not found.';
    } else {
      // Auto-assign first available rider
      const available = await ridersRepo.getAvailableRiders(tenantId);
      if (available.length === 0) {
        return 'No riders are currently available. Please try again later or assign manually.';
      }
      rider = available[0]!;
    }

    // Create assignment and mark rider as busy
    const assignment = await deliveryRepo.createAssignment(tenantId, order_id, rider.id);
    await ridersRepo.updateRiderStatus(tenantId, rider.id, 'busy');

    return JSON.stringify({
      assignmentId: assignment.id,
      orderId: order_id,
      riderId: rider.id,
      riderName: rider.name,
      riderPhone: rider.phone,
      status: 'assigned',
    });
  },
});
