import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { query, queryOne } from '../../db/pool.js';
import * as ridersRepo from '../../db/riders-repo.js';
import { getTenantId, type YayaToolContext } from './types.js';

export const getLiveRiderLocationTool = createTool({
  id: 'get_live_rider_location',
  description: 'Get the live location of the delivery rider assigned to an order. Returns GPS coordinates and a Google Maps link for the customer to track their delivery.',
  inputSchema: z.object({
    order_id: z.number().describe('The order ID to get delivery tracking for'),
  }),
  execute: async ({ order_id }, context: YayaToolContext) => {
    const tenantId = getTenantId(context);
    // Find the delivery assignment for this order
    const assignment = await queryOne<{
      rider_id: number;
      status: string;
      assigned_at: Date;
    }>(
      `SELECT rider_id, status, assigned_at FROM delivery_assignments
       WHERE tenant_id = $1 AND order_id = $2 AND status NOT IN ('delivered', 'cancelled')
       ORDER BY assigned_at DESC LIMIT 1`,
      [tenantId, order_id],
    );

    if (!assignment) {
      return JSON.stringify({
        found: false,
        message: 'No active delivery assignment found for this order.',
      });
    }

    const rider = await ridersRepo.getRiderById(tenantId, assignment.rider_id);
    if (!rider) {
      return JSON.stringify({ found: false, message: 'Rider not found.' });
    }

    const hasLocation = rider.currentLat !== null && rider.currentLng !== null;
    const mapsLink = hasLocation
      ? `https://maps.google.com/maps?q=${rider.currentLat},${rider.currentLng}`
      : null;

    return JSON.stringify({
      found: true,
      rider: {
        id: rider.id,
        name: rider.name,
        phone: rider.phone,
      },
      deliveryStatus: assignment.status,
      location: hasLocation
        ? {
            lat: rider.currentLat,
            lng: rider.currentLng,
            updatedAt: rider.locationUpdatedAt,
            mapsLink,
          }
        : null,
      message: hasLocation
        ? `Rider ${rider.name} is on the way. Track here: ${mapsLink}`
        : `Rider ${rider.name} is assigned but location is not yet available.`,
    });
  },
});
