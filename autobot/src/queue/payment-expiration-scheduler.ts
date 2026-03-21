import { SchedulerFactory } from './scheduler-factory.js';
import { query } from '../db/pool.js';
import * as ordersRepo from '../db/orders-repo.js';
import * as settingsRepo from '../db/settings-repo.js';
import { tenantManager } from '../bot/tenant-manager.js';
import { getMessage } from '../shared/message-templates.js';
import { logger } from '../shared/logger.js';
import type { OrderRow, OrderItemRow } from '../db/row-types.js';

const QUEUE_NAME = 'payment-expirations';
const CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

interface PaymentExpirationData {
  tenantId: string;
  orderId: number;
  customerJid: string;
}

async function processor(job: { data: PaymentExpirationData }): Promise<void> {
  const { tenantId, orderId, customerJid } = job.data;
  const lang = await settingsRepo.getEffectiveSetting(tenantId, 'language', 'es');

  // 1. Update order status to cancelled
  await ordersRepo.updateOrderStatus(tenantId, orderId, 'cancelled');

  // 2. Restore stock for each order item
  const itemsResult = await query<OrderItemRow>(
    'SELECT * FROM order_items WHERE order_id = $1',
    [orderId],
  );
  for (const item of itemsResult.rows) {
    await query(
      'UPDATE products SET stock = stock + $1 WHERE id = $2 AND stock IS NOT NULL',
      [item.quantity, item.product_id],
    );
  }

  // 3. Expire any pending payments for this order
  await query(
    "UPDATE payments SET status = 'expired' WHERE tenant_id = $1 AND order_id = $2 AND status = 'pending'",
    [tenantId, orderId],
  );

  // 4. Notify the customer
  const message = getMessage('payment-expired', lang, { orderId });
  await tenantManager.sendMessage(tenantId, customerJid, message);

  // 5. Log the expiration
  logger.info({ tenantId, orderId, customerJid }, 'Order expired due to non-payment');
}

async function scanner(): Promise<PaymentExpirationData[]> {
  const result = await query<OrderRow & { customer_jid: string }>(
    `SELECT o.*, c.jid as customer_jid
     FROM orders o
     JOIN customers c ON o.customer_id = c.id AND o.tenant_id = c.tenant_id
     WHERE o.status = 'payment_requested'
       AND o.created_at < now() - INTERVAL '24 hours'
       AND o.reminder_count >= 3
     ORDER BY o.created_at`,
    [],
  );
  return result.rows.map(r => ({
    tenantId: String(r.tenant_id),
    orderId: r.id,
    customerJid: String(r.customer_jid),
  }));
}

const scheduler = new SchedulerFactory<PaymentExpirationData>({
  name: QUEUE_NAME,
  checkIntervalMs: CHECK_INTERVAL_MS,
  processor,
  scanner,
  getJobId: (data) => `expiration-${data.orderId}`,
});

export const startPaymentExpirationScheduler = (): void => scheduler.start();
export const stopPaymentExpirationScheduler = (): Promise<void> => scheduler.stop();
