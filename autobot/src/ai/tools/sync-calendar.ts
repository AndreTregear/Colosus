import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import * as googleCalendar from '../../integrations/google-calendar.js';
import * as appointmentsRepo from '../../db/appointments-repo.js';
import { getTenantId, type YayaToolContext } from './types.js';

export const syncCalendarTool = createTool({
  id: 'sync_calendar',
  description: 'View the combined schedule from Google Calendar and Autobot appointments for a given date. Use this to check for scheduling conflicts or to see the full day\'s schedule before booking an appointment.',
  inputSchema: z.object({
    date: z.string().optional().describe('Date in YYYY-MM-DD format. Defaults to today.'),
  }),
  execute: async ({ date }, context: YayaToolContext) => {
    const tenantId = getTenantId(context);
    const targetDate = date || new Date().toISOString().split('T')[0];
    const timeMin = `${targetDate}T00:00:00Z`;
    const timeMax = `${targetDate}T23:59:59Z`;

    // Fetch Google Calendar events
    const calendarEvents = await googleCalendar.getCalendarEvents(tenantId, timeMin, timeMax);

    // Fetch Autobot appointments for the same day
    const appointments = await appointmentsRepo.getAppointmentsByDate(tenantId, targetDate);

    // Find Google events that don't match any appointment (external events)
    const appointmentTimes = new Set(appointments.map(a => new Date(a.scheduledAt).toISOString()));
    const externalEvents = calendarEvents.filter(e => !appointmentTimes.has(e.start));

    return JSON.stringify({
      date: targetDate,
      googleCalendarConnected: calendarEvents.length > 0 || await googleCalendar.getCalendarClient(tenantId) !== null,
      calendarEvents: calendarEvents.map(e => ({
        id: e.id,
        title: e.summary,
        start: e.start,
        end: e.end,
      })),
      autobotAppointments: appointments.map(a => ({
        id: a.id,
        service: a.serviceName,
        scheduledAt: a.scheduledAt,
        duration: a.durationMinutes,
        status: a.status,
      })),
      externalEvents: externalEvents.map(e => ({
        title: e.summary,
        start: e.start,
        end: e.end,
      })),
      blockedSlots: [...calendarEvents, ...appointments.map(a => ({
        start: a.scheduledAt,
        end: new Date(new Date(a.scheduledAt).getTime() + a.durationMinutes * 60_000).toISOString(),
      }))].map(e => ({ start: ('start' in e ? e.start : ''), end: ('end' in e ? e.end : '') })),
    });
  },
});
