import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import * as appointmentsRepo from '../../db/appointments-repo.js';
import { getTenantId, type YayaToolContext } from './types.js';

export const checkAvailabilityTool = createTool({
  id: 'check_appointment_availability',
  description: 'Check available appointment time slots for a specific date. Returns a list of open times. Use this before booking to show the customer available options.',
  inputSchema: z.object({
    date: z.string().describe('Date to check availability for (YYYY-MM-DD format)'),
    service_name: z.string().optional().describe('Name of the service being booked'),
    duration_minutes: z.number().optional().describe('Duration of the appointment in minutes (default: 30)'),
  }),
  execute: async ({ date, service_name, duration_minutes }, context: YayaToolContext) => {
    const tenantId = getTenantId(context);
    const slots = await appointmentsRepo.getAvailableSlots(
      tenantId,
      date,
      duration_minutes || 30,
    );

    if (slots.length === 0) {
      return `No available slots on ${date}${service_name ? ` for ${service_name}` : ''}. Try another date.`;
    }

    return `Available slots on ${date}${service_name ? ` for ${service_name}` : ''}:\n${slots.join(', ')}`;
  },
});
