import * as appointmentsRepo from '../db/appointments-repo.js';
import * as settingsRepo from '../db/settings-repo.js';
import { NotFoundError, InvalidTransitionError } from './errors.js';
import { appBus } from '../shared/events.js';
import type { Appointment } from '../shared/types.js';

// ── Booking (with race-condition protection via DB check) ──

export async function bookAppointment(
  tenantId: string,
  customerId: number,
  serviceName: string,
  scheduledAt: string,
  durationMinutes: number = 30,
  notes?: string,
): Promise<Appointment> {
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
  // Read business hours from settings, fallback to 9-18
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
