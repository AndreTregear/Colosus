import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import * as appointmentsRepo from '../../db/appointments-repo.js';
import { getTenantId, type YayaToolContext } from './types.js';

export const cancelAppointmentTool = createTool({
  id: 'cancel_appointment',
  description: 'Cancel an existing appointment. Always confirm with the customer before cancelling.',
  inputSchema: z.object({
    appointment_id: z.number().describe('The appointment ID to cancel'),
    reason: z.string().optional().describe('Reason for cancellation'),
  }),
  execute: async ({ appointment_id, reason }, context: YayaToolContext) => {
    const tenantId = getTenantId(context);
    const appointment = await appointmentsRepo.getAppointmentById(tenantId, appointment_id);
    if (!appointment) return 'Error: Appointment not found.';

    if (appointment.status === 'cancelled') {
      return 'This appointment is already cancelled.';
    }
    if (appointment.status === 'completed') {
      return 'Cannot cancel a completed appointment.';
    }

    await appointmentsRepo.updateAppointmentStatus(tenantId, appointment_id, 'cancelled');
    return `Appointment #${appointment_id} for ${appointment.serviceName} has been cancelled.${reason ? ` Reason: ${reason}` : ''}`;
  },
});
