import { SchedulerFactory } from './scheduler-factory.js';
import * as appointmentsRepo from '../db/appointments-repo.js';
import * as settingsRepo from '../db/settings-repo.js';
import { tenantManager } from '../bot/tenant-manager.js';
import { getMessage } from '../shared/message-templates.js';

const QUEUE_NAME = 'appointment-reminders';
const CHECK_INTERVAL_MS = 5 * 60 * 1000;

interface ReminderJobData {
  tenantId: string;
  appointmentId: number;
  customerJid: string;
  serviceName: string;
  scheduledAt: string;
}

async function processor(job: { data: ReminderJobData }): Promise<void> {
  const { tenantId, appointmentId, customerJid, serviceName, scheduledAt } = job.data;
  const lang = await settingsRepo.getEffectiveSetting(tenantId, 'language', 'es');
  const message = getMessage('appointment-reminder', lang, {
    serviceName,
    scheduledAt: new Date(scheduledAt).toLocaleString(lang === 'es' ? 'es-PE' : 'en-US'),
  });
  await tenantManager.sendMessage(tenantId, customerJid, message);
  await appointmentsRepo.markReminderSent(tenantId, appointmentId);
}

async function scanner(): Promise<ReminderJobData[]> {
  const appointments = await appointmentsRepo.getUpcomingForReminders(24);
  return appointments.map(apt => ({
    tenantId: apt.tenantId,
    appointmentId: apt.id,
    customerJid: (apt as unknown as { customerJid: string }).customerJid,
    serviceName: apt.serviceName,
    scheduledAt: apt.scheduledAt,
  }));
}

const scheduler = new SchedulerFactory<ReminderJobData>({
  name: QUEUE_NAME,
  checkIntervalMs: CHECK_INTERVAL_MS,
  processor,
  scanner,
  getJobId: (data) => `reminder-${data.appointmentId}`,
});

export const startReminderScheduler = (): void => scheduler.start();
export const stopReminderScheduler = (): Promise<void> => scheduler.stop();
