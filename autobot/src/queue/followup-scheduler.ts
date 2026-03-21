import { QueueFactory, registerQueue } from './queue-factory.js';
import { logger } from '../shared/logger.js';
import * as ordersRepo from '../db/orders-repo.js';
import * as customersRepo from '../db/customers-repo.js';
import * as appointmentsRepo from '../db/appointments-repo.js';
import { tenantManager } from '../bot/tenant-manager.js';
import { getMessage } from '../shared/message-templates.js';
import { getTenantById } from '../db/tenants-repo.js';
import type { Job } from 'bullmq';

const FOLLOWUP_QUEUE_NAME = 'followup-flows';

interface FollowupJobData {
  tenantId: string;
  type: FollowupType;
  entityId: number;
  entityType: 'order' | 'customer' | 'appointment';
  scheduledAt: string;
  templateKey: string;
  variables: Record<string, string>;
}

type FollowupType = 'post_purchase' | 'abandoned_cart' | 'no_show' | 're_engagement' | 'payment_reminder';

interface FlowConfig {
  type: FollowupType;
  trigger: 'order_delivered' | 'order_pending' | 'appointment_missed' | 'customer_inactive' | 'payment_pending';
  delayHours: number;
  templateKey: string;
  enabled: boolean;
  conditions?: Record<string, unknown>;
}

const DEFAULT_FLOWS: FlowConfig[] = [
  { type: 'post_purchase', trigger: 'order_delivered', delayHours: 24, templateKey: 'post-purchase', enabled: true },
  { type: 'abandoned_cart', trigger: 'order_pending', delayHours: 4, templateKey: 'abandoned-cart', enabled: true, conditions: { status: 'pending', minHours: 4 } },
  { type: 'no_show', trigger: 'appointment_missed', delayHours: 1, templateKey: 'no-show', enabled: true },
  { type: 're_engagement', trigger: 'customer_inactive', delayHours: 720, templateKey: 're-engagement', enabled: false, conditions: { inactiveDays: 30 } },
  { type: 'payment_reminder', trigger: 'payment_pending', delayHours: 3, templateKey: 'payment-followup', enabled: true, conditions: { maxReminders: 3 } },
];

const tenantFlows = new Map<string, FlowConfig[]>();

async function processFollowupJob(job: Job<FollowupJobData>): Promise<void> {
  const { tenantId, type, entityId, entityType, templateKey, variables } = job.data;
  logger.info({ tenantId, type, entityId }, 'Processing follow-up');

  try {
    const tenant = await getTenantById(tenantId);
    if (!tenant) throw new Error('Tenant not found');

    let customerJid: string | undefined;
    let enrichedVars = { ...variables };

    if (entityType === 'order') {
      const order = await ordersRepo.getOrderById(tenantId, entityId);
      if (order) {
        customerJid = (order as unknown as { customerJid: string }).customerJid;
        enrichedVars = { ...enrichedVars, orderId: String(order.id), total: String(order.total) };
      }
    } else if (entityType === 'appointment') {
      const appt = await appointmentsRepo.getAppointmentById(tenantId, entityId);
      if (appt) {
        const customer = await customersRepo.getCustomerById(tenantId, appt.customerId);
        if (customer) {
          customerJid = customer.jid;
          enrichedVars = { ...enrichedVars, serviceName: appt.serviceName, scheduledAt: new Date(appt.scheduledAt).toLocaleString('es-PE') };
        }
      }
    }

    if (!customerJid) {
      logger.warn({ tenantId, type, entityId }, 'No customer contact for follow-up');
      return;
    }

    const message = getMessage(templateKey, 'es', enrichedVars);
    if (!message) {
      logger.warn({ tenantId, templateKey }, 'No message template found');
      return;
    }

    await tenantManager.sendMessage(tenantId, customerJid, message);
    logger.info({ tenantId, type, entityId, customerJid }, 'Follow-up sent successfully');
  } catch (error) {
    logger.error({ error, tenantId, type, entityId }, 'Failed to send follow-up');
    throw error;
  }
}

const followupFactory = new QueueFactory({
  name: FOLLOWUP_QUEUE_NAME,
  processor: processFollowupJob,
  concurrency: 10,
  defaultJobOptions: { removeOnComplete: { count: 500 }, removeOnFail: { count: 100 }, attempts: 3, backoff: { type: 'exponential', delay: 60000 } },
});

registerQueue(FOLLOWUP_QUEUE_NAME, followupFactory);

async function scheduleFollowup(data: FollowupJobData): Promise<void> {
  const jobId = `${data.type}-${data.tenantId}-${data.entityId}`;
  const existingJob = await followupFactory.getQueue().getJob(jobId);
  if (existingJob) return;
  await followupFactory.add('send-followup', data, { jobId, delay: new Date(data.scheduledAt).getTime() - Date.now() });
}

function startAbandonedCartChecker(): void {
  setInterval(async () => {
    const now = new Date();
    for (const [tenantId, flows] of tenantFlows.entries()) {
      const flow = flows.find(f => f.type === 'abandoned_cart' && f.enabled);
      if (!flow) continue;
      try {
        const orders = await ordersRepo.getOrdersNeedingPaymentReminder(tenantId, flow.delayHours, 1);
        for (const order of orders.filter(o => o.status === 'pending')) {
          await scheduleFollowup({
            tenantId, type: 'abandoned_cart', entityId: order.id, entityType: 'order',
            scheduledAt: now.toISOString(), templateKey: flow.templateKey,
            variables: { orderId: String(order.id), total: String(order.total) },
          });
        }
      } catch (error) { logger.error({ error, tenantId }, 'Error checking abandoned carts'); }
    }
  }, 15 * 60 * 1000);
}

// Export public API
export const initializeFollowupScheduler = (): void => {
  followupFactory.getWorker();
  startAbandonedCartChecker();
  logger.info('Follow-up scheduler initialized');
};

export const getTenantFlows = (tenantId: string): FlowConfig[] => tenantFlows.get(tenantId) || DEFAULT_FLOWS;
export const setTenantFlows = (tenantId: string, flows: FlowConfig[]): void => { tenantFlows.set(tenantId, flows); };
export const toggleFlow = (tenantId: string, flowType: FollowupType, enabled: boolean): void => {
  const flow = getTenantFlows(tenantId).find(f => f.type === flowType);
  if (flow) flow.enabled = enabled;
};

export async function triggerPostPurchaseFollowup(tenantId: string, orderId: number, customerJid: string): Promise<void> {
  const flow = getTenantFlows(tenantId).find(f => f.type === 'post_purchase');
  if (!flow?.enabled) return;
  const scheduledAt = new Date();
  scheduledAt.setHours(scheduledAt.getHours() + flow.delayHours);
  await scheduleFollowup({
    tenantId, type: 'post_purchase', entityId: orderId, entityType: 'order',
    scheduledAt: scheduledAt.toISOString(), templateKey: flow.templateKey,
    variables: { orderId: String(orderId), customerName: 'Cliente' },
  });
}

export async function cancelFollowup(tenantId: string, type: FollowupType, entityId: number): Promise<void> {
  const jobId = `${type}-${tenantId}-${entityId}`;
  const job = await followupFactory.getQueue().getJob(jobId);
  if (job) {
    await job.remove();
    logger.info({ tenantId, type, entityId }, 'Follow-up cancelled');
  }
}

export const closeFollowupScheduler = (): Promise<void> => followupFactory.close();
