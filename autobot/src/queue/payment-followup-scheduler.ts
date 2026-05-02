import { SchedulerFactory } from './scheduler-factory.js';
import * as ordersRepo from '../db/orders-repo.js';
import * as settingsRepo from '../db/settings-repo.js';
import { tenantManager } from '../bot/tenant-manager.js';
import { getMessage } from '../shared/message-templates.js';
import { BUSINESS_CURRENCY } from '../config.js';

const QUEUE_NAME = 'payment-followups';
const CHECK_INTERVAL_MS = 15 * 60 * 1000;

interface PaymentFollowupData {
  tenantId: string;
  orderId: number;
  customerJid: string;
  total: number;
  reminderCount: number;
}

async function processor(job: { data: PaymentFollowupData }): Promise<void> {
  const { tenantId, orderId, customerJid, total } = job.data;
  const lang = await settingsRepo.getEffectiveSetting(tenantId, 'language', 'es');
  const currency = await settingsRepo.getEffectiveSetting(tenantId, 'currency', BUSINESS_CURRENCY);
  const yapeNumber = await settingsRepo.getEffectiveSetting(tenantId, 'yape_number');
  const message = getMessage('payment-followup', lang, {
    orderId,
    total: `${currency} ${Number(total).toFixed(2)}`,
    yapeNumber: yapeNumber || '',
  });
  await tenantManager.sendMessage(tenantId, customerJid, message);
  await ordersRepo.incrementReminderCount(tenantId, orderId);
}

async function scanner(): Promise<PaymentFollowupData[]> {
  const orders = await ordersRepo.getOrdersNeedingPaymentReminder(undefined, 4, 3);
  return orders.map(o => ({
    tenantId: o.tenantId,
    orderId: o.id,
    customerJid: (o as unknown as { customerJid: string }).customerJid,
    total: o.total,
    reminderCount: o.reminderCount,
  }));
}

const scheduler = new SchedulerFactory<PaymentFollowupData>({
  name: QUEUE_NAME,
  checkIntervalMs: CHECK_INTERVAL_MS,
  processor,
  scanner,
  getJobId: (data) => `followup-${data.orderId}-${data.reminderCount}`,
});

export const startPaymentFollowupScheduler = (): void => scheduler.start();
export const stopPaymentFollowupScheduler = (): Promise<void> => scheduler.stop();
