import { Queue, Worker, type Job } from 'bullmq';
import { parseRedisUrl } from './redis.js';
import { REDIS_URL } from '../config.js';
import { logger } from '../shared/logger.js';
import * as ordersRepo from '../db/orders-repo.js';
import * as productsRepo from '../db/products-repo.js';
import * as customersRepo from '../db/customers-repo.js';
import { getAIClient, getModelId } from '../ai/client.js';
import { getTenantById } from '../db/tenants-repo.js';
import { appBus } from '../shared/events.js';

const DAILY_SUMMARY_QUEUE_NAME = 'daily-summary';

interface DailySummaryJobData {
  tenantId: string;
  timezone: string;
  preferredTime: string; // HH:mm format
}

interface SummaryPayload {
  orders: {
    total: number;
    byStatus: Record<string, number>;
    revenue: number;
    items: Array<{ productName: string; quantity: number }>;
  };
  customers: {
    newToday: number;
    total: number;
  };
  stock: {
    lowStock: Array<{ name: string; stock: number }>;
    outOfStock: string[];
  };
  appointments?: {
    today: number;
    upcoming: number;
    unconfirmed: number;
  };
}

let queue: Queue | null = null;
let schedulerWorker: Worker | null = null;

// Store tenant notification preferences
// In production, move to database table
interface NotificationSettings {
  enabled: boolean;
  time: string; // HH:mm
  timezone: string;
  lastSent?: Date;
}

const tenantNotificationSettings = new Map<string, NotificationSettings>();

export function setNotificationSettings(
  tenantId: string, 
  settings: NotificationSettings
): void {
  tenantNotificationSettings.set(tenantId, settings);
  scheduleDailySummary(tenantId, settings);
}

export function getNotificationSettings(tenantId: string): NotificationSettings | undefined {
  return tenantNotificationSettings.get(tenantId);
}

export function initializeDailySummaryScheduler(): void {
  if (queue) return;

  queue = new Queue(DAILY_SUMMARY_QUEUE_NAME, {
    connection: parseRedisUrl(REDIS_URL),
    defaultJobOptions: {
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 50 },
    },
  });

  // Schedule checker runs every minute
  schedulerWorker = new Worker(
    DAILY_SUMMARY_QUEUE_NAME,
    processDailySummaryJob,
    {
      connection: parseRedisUrl(REDIS_URL),
      concurrency: 5,
    }
  );

  schedulerWorker.on('completed', (job) => {
    if (job) {
      logger.info({ jobId: job.id, tenantId: job.data.tenantId }, 'Daily summary sent');
    }
  });

  schedulerWorker.on('failed', (job, err) => {
    if (job) {
      logger.error({ jobId: job.id, tenantId: job.data.tenantId, err }, 'Daily summary failed');
    }
  });

  // Start the recurring schedule checker
  startScheduleChecker();

  logger.info('Daily summary scheduler initialized');
}

function startScheduleChecker(): void {
  // Check every minute if any tenants need their summary
  setInterval(async () => {
    const now = new Date();
    
    for (const [tenantId, settings] of tenantNotificationSettings.entries()) {
      if (!settings.enabled) continue;

      const [hour, minute] = settings.time.split(':').map(Number);
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      // Check if it's time to send (within the same minute)
      if (currentHour === hour && currentMinute === minute) {
        // Check if already sent today
        if (settings.lastSent && isSameDay(settings.lastSent, now)) {
          continue;
        }

        await enqueueDailySummary(tenantId, settings);
        settings.lastSent = now;
      }
    }
  }, 60 * 1000); // Every minute
}

function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

async function scheduleDailySummary(
  tenantId: string, 
  settings: NotificationSettings
): Promise<void> {
  if (!queue) return;

  // Cancel any existing job for this tenant
  const jobs = await queue.getJobs(['delayed', 'waiting']);
  for (const job of jobs) {
    if (job.data.tenantId === tenantId) {
      await job.remove();
    }
  }

  // Calculate next occurrence
  const [hour, minute] = settings.time.split(':').map(Number);
  const nextRun = getNextOccurrence(hour, minute);

  await queue.add(
    'send-daily-summary',
    { tenantId, timezone: settings.timezone, preferredTime: settings.time },
    { jobId: `daily-summary-${tenantId}`, delay: nextRun.getTime() - Date.now() }
  );
}

async function enqueueDailySummary(
  tenantId: string, 
  settings: NotificationSettings
): Promise<void> {
  if (!queue) return;

  await queue.add('send-daily-summary', {
    tenantId,
    timezone: settings.timezone,
    preferredTime: settings.time,
  });
}

function getNextOccurrence(hour: number, minute: number): Date {
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);

  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  return next;
}

async function processDailySummaryJob(job: Job<DailySummaryJobData>): Promise<void> {
  const { tenantId } = job.data;

  logger.info({ tenantId }, 'Generating daily summary');

  try {
    const tenant = await getTenantById(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const summary = await generateDailySummary(tenantId);
    const message = await generateSummaryMessage(summary, tenant.name);

    // Emit event for push notification
    appBus.emit('daily-summary-ready', tenantId, {
      title: `📊 Resumen de hoy — ${tenant.name}`,
      body: message,
      data: {
        type: 'daily-summary',
        summary,
      },
    });

  } catch (error) {
    logger.error({ error, tenantId }, 'Failed to generate daily summary');
    throw error;
  }
}

async function generateDailySummary(tenantId: string): Promise<SummaryPayload> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

    const [
      orders,
      customers,
      lowStock,
    ] = await Promise.all([
      ordersRepo.getAllOrders(tenantId, { limit: 100, offset: 0 }),
      customersRepo.getAllCustomers(tenantId, 10000),
      productsRepo.getLowStockProducts(tenantId, 5),
    ]);

  const todayOrders = orders.filter((o: typeof orders[0]) => new Date(o.createdAt) >= today);
  const todayCustomers = customers.filter((c: typeof customers[0]) => new Date(c.createdAt) >= today);

  // Group order items
  const itemCounts = new Map<string, number>();
  let revenue = 0;

  for (const order of todayOrders) {
    revenue += order.total;
    // Note: Would need to fetch order items for accurate counts
    // Simplified for now
  }

  const byStatus: Record<string, number> = {};
  for (const order of todayOrders) {
    byStatus[order.status] = (byStatus[order.status] || 0) + 1;
  }

  return {
    orders: {
      total: todayOrders.length,
      byStatus,
      revenue,
      items: Array.from(itemCounts.entries()).map(([name, quantity]) => ({ productName: name, quantity })),
    },
    customers: {
      newToday: todayCustomers.length,
      total: customers.length,
    },
    stock: {
      lowStock: lowStock.map((p: typeof lowStock[0]) => ({ name: p.name, stock: p.stock || 0 })),
      outOfStock: [], // Would need to fetch separately
    },
    appointments: undefined,
  };
}

async function generateSummaryMessage(summary: SummaryPayload, businessName: string): Promise<string> {
  const client = getAIClient();

  const prompt = `Generate a warm, conversational daily summary for a small business owner.

Business: ${businessName}
Data:
- Orders today: ${summary.orders.total}
- Revenue: S/. ${summary.orders.revenue}
- New customers: ${summary.customers.newToday}
- Low stock items: ${summary.stock.lowStock.length}

Write a brief, encouraging message in Spanish (max 2 sentences). Be warm and personal, like a helpful assistant checking in.

Example tones:
- "¡Buenos días! Hoy tienes ${summary.orders.total} pedidos listos. ¡A darle con todo! 💪"
- "Todo listo para hoy: ${summary.orders.total} pedidos por S/. ${summary.orders.revenue}. ¡Vamos a vender! 🚀"

Respond with ONLY the message, nothing else.`;

  try {
    const response = await client.chat.completions.create({
      model: getModelId(),
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 100,
    });

    return response.choices[0]?.message?.content || getDefaultSummaryMessage(summary);
  } catch {
    return getDefaultSummaryMessage(summary);
  }
}

function getDefaultSummaryMessage(summary: SummaryPayload): string {
  const parts = [`Hoy tienes ${summary.orders.total} pedidos`];
  if (summary.orders.revenue > 0) {
    parts.push(`por S/. ${summary.orders.revenue}`);
  }
  if (summary.customers.newToday > 0) {
    parts.push(`y ${summary.customers.newToday} cliente${summary.customers.newToday > 1 ? 's' : ''} nuevo${summary.customers.newToday > 1 ? 's' : ''}`);
  }
  return parts.join(' ') + '. ¡Vamos con todo! 💪';
}

export async function closeDailySummaryScheduler(): Promise<void> {
  if (schedulerWorker) {
    await schedulerWorker.close();
    schedulerWorker = null;
  }
  if (queue) {
    await queue.close();
    queue = null;
  }
}
