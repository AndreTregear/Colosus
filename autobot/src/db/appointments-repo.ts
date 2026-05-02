import { BaseRepository } from './base-repository.js';
import { query, queryOne } from './pool.js';
import type { Appointment } from '../shared/types.js';
import type { Spec } from './row-mapper.js';
import { encryptRecord, decryptRecord, decryptRecords } from '../crypto/middleware.js';

const appointmentSpec: Spec<Appointment> = {
  id: 'id',
  tenantId: 'tenant_id',
  customerId: { col: 'customer_id', type: 'number' },
  serviceName: 'service_name',
  scheduledAt: { col: 'scheduled_at', type: 'date' },
  durationMinutes: { col: 'duration_minutes', type: 'number' },
  status: 'status',
  reminderSent: 'reminder_sent',
  notes: 'notes',
  createdAt: { col: 'created_at', type: 'date' },
  updatedAt: { col: 'updated_at', type: 'date' },
};

const repo = new BaseRepository<Appointment>({
  table: 'appointments',
  spec: appointmentSpec,
  tenantColumn: 'tenant_id',
});

// Encryption helpers — 'notes' entity name matches DB column name
async function dec(tenantId: string, entity: Appointment | undefined): Promise<Appointment | undefined> {
  if (!entity) return undefined;
  return decryptRecord(tenantId, 'appointments', entity as unknown as Record<string, unknown>) as unknown as Appointment;
}
async function decAll(tenantId: string, entities: Appointment[]): Promise<Appointment[]> {
  return decryptRecords(tenantId, 'appointments', entities as unknown as Record<string, unknown>[]) as unknown as Appointment[];
}

export const getAppointmentById = async (tenantId: string, id: number) =>
  dec(tenantId, await repo.findById(id, tenantId));

export async function createAppointment(
  tenantId: string,
  customerId: number,
  serviceName: string,
  scheduledAt: string,
  durationMinutes: number,
  notes?: string,
): Promise<Appointment> {
  const encrypted = await encryptRecord(tenantId, 'appointments', { notes: notes || null });
  const result = await repo.create({
    tenantId, customerId, serviceName, scheduledAt, durationMinutes,
    notes: encrypted.notes as string | null,
    status: 'confirmed', reminderSent: false,
  } as Partial<Appointment>, tenantId);
  return (await dec(tenantId, result))!;
}

export async function getAppointmentsByDate(tenantId: string, date: string): Promise<Appointment[]> {
  const result = await query<Record<string, unknown>>(
    `SELECT * FROM appointments WHERE tenant_id = $1 AND scheduled_at >= $2::date AND scheduled_at < ($2::date + INTERVAL '1 day') AND status NOT IN ('cancelled') ORDER BY scheduled_at`,
    [tenantId, date],
  );
  return decAll(tenantId, result.rows.map(r => repo.toEntity(r)));
}

export async function getUpcomingAppointments(tenantId: string, customerId: number): Promise<Appointment[]> {
  const result = await query<Record<string, unknown>>(
    `SELECT * FROM appointments WHERE tenant_id = $1 AND customer_id = $2 AND scheduled_at > now() AND status NOT IN ('cancelled', 'completed', 'no_show') ORDER BY scheduled_at LIMIT 10`,
    [tenantId, customerId],
  );
  return decAll(tenantId, result.rows.map(r => repo.toEntity(r)));
}

export async function isSlotAvailable(tenantId: string, scheduledAt: string, durationMinutes: number): Promise<boolean> {
  const row = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM appointments WHERE tenant_id = $1 AND status NOT IN ('cancelled') AND scheduled_at < ($2::timestamptz + ($3 || ' minutes')::interval) AND ($2::timestamptz) < (scheduled_at + (duration_minutes || ' minutes')::interval)`,
    [tenantId, scheduledAt, durationMinutes],
  );
  return Number(row?.count ?? 0) === 0;
}

export async function getAvailableSlots(tenantId: string, date: string, durationMinutes: number = 30): Promise<string[]> {
  const existing = await getAppointmentsByDate(tenantId, date);
  const slots: string[] = [];
  const startHour = 9, endHour = 18;

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

export async function updateAppointmentStatus(tenantId: string, id: number, status: string): Promise<Appointment | undefined> {
  const result = await repo.update(id, { status } as Partial<Appointment>, tenantId);
  return dec(tenantId, result);
}

export async function getUpcomingForReminders(hoursAhead: number = 24): Promise<(Appointment & { customerJid: string; customerChannel: string })[]> {
  const result = await query<Record<string, unknown>>(
    `SELECT a.*, c.jid as customer_jid, c.channel as customer_channel FROM appointments a JOIN customers c ON a.customer_id = c.id AND a.tenant_id = c.tenant_id WHERE a.reminder_sent = false AND a.status NOT IN ('cancelled', 'completed', 'no_show') AND a.scheduled_at > now() AND a.scheduled_at <= now() + ($1 || ' hours')::INTERVAL ORDER BY a.scheduled_at`,
    [hoursAhead],
  );
  return Promise.all(result.rows.map(async r => {
    const tid = r.tenant_id as string;
    const d = await decryptRecord(tid, 'appointments', r);
    return {
      ...repo.toEntity(d),
      customerJid: String(d.customer_jid),
      customerChannel: String(d.customer_channel),
    };
  }));
}

export async function markReminderSent(tenantId: string, id: number): Promise<void> {
  await repo.update(id, { reminderSent: true } as Partial<Appointment>, tenantId);
}
