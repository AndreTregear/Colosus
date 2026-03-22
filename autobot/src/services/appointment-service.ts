import * as appointmentsRepo from '../db/appointments-repo.js';
import * as settingsRepo from '../db/settings-repo.js';
import { NotFoundError, InvalidTransitionError } from './errors.js';
import { appBus } from '../shared/events.js';
import { logger } from '../shared/logger.js';
import * as calcom from '../integrations/calcom-client.js';
import type { Appointment } from '../shared/types.js';

// ── Cal.com helpers ──

/** Resolve the Cal.com event type for this tenant (cached per-process) */
const eventTypeCache = new Map<string, number | null>();

async function resolveEventTypeId(tenantId: string): Promise<number | null> {
  if (eventTypeCache.has(tenantId)) return eventTypeCache.get(tenantId)!;

  // Check if tenant has a configured event type
  const configured = await settingsRepo.getEffectiveSetting(tenantId, 'calcom_event_type_id', '');
  if (configured) {
    const id = parseInt(configured, 10);
    if (!isNaN(id)) {
      eventTypeCache.set(tenantId, id);
      return id;
    }
  }

  // Fallback: use the first available event type
  const types = await calcom.listEventTypes();
  const id = types.length > 0 ? types[0].id : null;
  eventTypeCache.set(tenantId, id);
  return id;
}

// ── Booking (with race-condition protection via DB check) ──

export async function bookAppointment(
  tenantId: string,
  customerId: number,
  serviceName: string,
  scheduledAt: string,
  durationMinutes: number = 30,
  notes?: string,
): Promise<Appointment> {
  // Try Cal.com first
  const calAvailable = await calcom.isServiceAvailable();
  if (calAvailable) {
    try {
      const eventTypeId = await resolveEventTypeId(tenantId);
      if (eventTypeId) {
        const startTime = new Date(scheduledAt);
        const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
        const booking = await calcom.createBooking({
          eventTypeId,
          start: startTime.toISOString(),
          end: endTime.toISOString(),
          name: serviceName,
          email: `customer_${customerId}@placeholder.local`,
          notes,
          metadata: { tenantId, customerId: String(customerId) },
        });
        if (booking) {
          logger.info({ tenantId, bookingUid: booking.uid }, 'Appointment booked via Cal.com');
        }
      }
    } catch (err) {
      logger.error({ err, tenantId }, 'Cal.com booking failed, falling back to local DB');
    }
  }

  // Always persist locally (source of truth for our domain logic)
  const available = await appointmentsRepo.isSlotAvailable(tenantId, scheduledAt, durationMinutes);
  if (!available) {
    throw new InvalidTransitionError('appointment', 'available', 'booked');
  }

  const appointment = await appointmentsRepo.createAppointment(
    tenantId, customerId, serviceName, scheduledAt, durationMinutes, notes,
  );

  appBus.emit('appointment-booked', tenantId, appointment.id, '');
  return appointment;
}

// ── Slot Availability ──

export async function getAvailableSlots(
  tenantId: string,
  date: string,
  durationMinutes: number = 30,
): Promise<string[]> {
  // Try Cal.com availability first
  const calAvailable = await calcom.isServiceAvailable();
  if (calAvailable) {
    try {
      const eventTypeId = await resolveEventTypeId(tenantId);
      if (eventTypeId) {
        const slots = await calcom.getAvailability(eventTypeId, date, date);
        if (slots.length > 0) {
          return slots.map(s => {
            const d = new Date(s.time);
            return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
          });
        }
      }
    } catch (err) {
      logger.error({ err, tenantId }, 'Cal.com availability check failed, falling back to local');
    }
  }

  // Fallback: local calculation
  const hoursJson = await settingsRepo.getEffectiveSetting(tenantId, 'business_hours', '');
  let startHour = 9;
  let endHour = 18;

  if (hoursJson) {
    try {
      const hours = JSON.parse(hoursJson);
      const dayOfWeek = new Date(date).getDay();
      const daySchedule = hours.schedule?.[String(dayOfWeek)];
      if (daySchedule) {
        startHour = parseInt(daySchedule.open.split(':')[0], 10);
        endHour = parseInt(daySchedule.close.split(':')[0], 10);
      }
    } catch { /* use defaults */ }
  }

  const existing = await appointmentsRepo.getAppointmentsByDate(tenantId, date);
  const slots: string[] = [];

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += durationMinutes) {
      if (hour === endHour - 1 && minute + durationMinutes > 60) break;
      const slotStart = new Date(`${date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`);
      const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60 * 1000);
      const hasConflict = existing.some(apt => {
        const aptStart = new Date(apt.scheduledAt);
        const aptEnd = new Date(aptStart.getTime() + apt.durationMinutes * 60 * 1000);
        return slotStart < aptEnd && slotEnd > aptStart;
      });
      if (!hasConflict) slots.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
    }
  }
  return slots;
}

// ── Status Transitions ──

export async function cancelAppointment(
  tenantId: string,
  appointmentId: number,
  reason?: string,
): Promise<Appointment> {
  const apt = await appointmentsRepo.getAppointmentById(tenantId, appointmentId);
  if (!apt) throw new NotFoundError('appointment', appointmentId);
  if (apt.status === 'cancelled') throw new InvalidTransitionError('appointment', 'cancelled', 'cancelled');
  if (apt.status === 'completed') throw new InvalidTransitionError('appointment', 'completed', 'cancelled');

  // Best-effort cancel in Cal.com (use appointmentId as UID lookup)
  const calAvailable = await calcom.isServiceAvailable();
  if (calAvailable) {
    calcom.cancelBooking(appointmentId, reason)
      .catch(err => logger.error({ err, tenantId, appointmentId }, 'Cal.com cancel failed'));
  }

  const updated = await appointmentsRepo.updateAppointmentStatus(tenantId, appointmentId, 'cancelled');
  appBus.emit('appointment-cancelled', tenantId, appointmentId);
  return updated!;
}

export async function confirmAppointment(tenantId: string, appointmentId: number): Promise<Appointment> {
  const apt = await appointmentsRepo.getAppointmentById(tenantId, appointmentId);
  if (!apt) throw new NotFoundError('appointment', appointmentId);
  return (await appointmentsRepo.updateAppointmentStatus(tenantId, appointmentId, 'confirmed'))!;
}

export async function completeAppointment(tenantId: string, appointmentId: number): Promise<Appointment> {
  const apt = await appointmentsRepo.getAppointmentById(tenantId, appointmentId);
  if (!apt) throw new NotFoundError('appointment', appointmentId);
  return (await appointmentsRepo.updateAppointmentStatus(tenantId, appointmentId, 'completed'))!;
}

export async function markNoShow(tenantId: string, appointmentId: number): Promise<Appointment> {
  const apt = await appointmentsRepo.getAppointmentById(tenantId, appointmentId);
  if (!apt) throw new NotFoundError('appointment', appointmentId);
  return (await appointmentsRepo.updateAppointmentStatus(tenantId, appointmentId, 'no_show'))!;
}

// ── Read-Only Pass-Throughs ──

export const getAppointmentById = appointmentsRepo.getAppointmentById;
export const getUpcomingAppointments = appointmentsRepo.getUpcomingAppointments;
export const getAppointmentsByDate = appointmentsRepo.getAppointmentsByDate;
export const getUpcomingForReminders = appointmentsRepo.getUpcomingForReminders;
export const markReminderSent = appointmentsRepo.markReminderSent;
