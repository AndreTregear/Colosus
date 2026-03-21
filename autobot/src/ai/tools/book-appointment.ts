import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import * as appointmentsRepo from '../../db/appointments-repo.js';
import * as customersRepo from '../../db/customers-repo.js';
import { getTenantId, getJid, getChannel, type YayaToolContext } from './types.js';

export const bookAppointmentTool = createTool({
  id: 'book_appointment',
  description: 'Book an appointment for a service at a specific date and time. Always check availability first and confirm with the customer before booking.',
  inputSchema: z.object({
    service_name: z.string().describe('Name of the service (e.g., "limpieza dental", "corte de cabello")'),
    scheduled_at: z.string().describe('Appointment date and time in ISO format (e.g., "2026-03-02T14:00:00")'),
    duration_minutes: z.number().optional().describe('Duration in minutes (default: 30)'),
    notes: z.string().optional().describe('Special notes or requests for the appointment'),
  }),
  execute: async ({ service_name, scheduled_at, duration_minutes, notes }, context: YayaToolContext) => {
    const tenantId = getTenantId(context);
    const jid = getJid(context);
    const channel = getChannel(context);
    const customer = await customersRepo.getOrCreateCustomer(tenantId, jid, channel);

    // Check if the slot is still available
    const available = await appointmentsRepo.isSlotAvailable(
      tenantId,
      scheduled_at,
      duration_minutes || 30,
    );

    if (!available) {
      return 'Error: That time slot is no longer available. Please check availability again and choose another time.';
    }

    const appointment = await appointmentsRepo.createAppointment(
      tenantId,
      customer.id,
      service_name,
      scheduled_at,
      duration_minutes || 30,
      notes,
    );

    return JSON.stringify({
      appointmentId: appointment.id,
      serviceName: appointment.serviceName,
      scheduledAt: appointment.scheduledAt,
      durationMinutes: appointment.durationMinutes,
      status: 'confirmed',
    });
  },
});
