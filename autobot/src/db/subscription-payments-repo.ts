import { query, queryOne } from './pool.js';
import { createRowMapper } from './row-mapper.js';
import type { SubscriptionPayment } from '../shared/types.js';
import type { SubscriptionPaymentRow } from './row-types.js';

const rowToPayment = createRowMapper<SubscriptionPayment>({
  id: 'id',
  tenantId: 'tenant_id',
  subscriptionType: 'subscription_type',
  subscriptionId: 'subscription_id',
  amount: { col: 'amount', type: 'number' },
  periodStart: { col: 'period_start', type: 'date' },
  periodEnd: { col: 'period_end', type: 'date' },
  status: 'status',
  paymentMethod: 'payment_method',
  yapeNotificationId: 'yape_notification_id',
  reference: 'reference',
  confirmedAt: { col: 'confirmed_at', type: 'date' },
  createdAt: { col: 'created_at', type: 'date' },
});

export interface CreatePaymentInput {
  tenantId: string;
  subscriptionType: 'platform' | 'creator';
  subscriptionId: number;
  amount: number;
  periodStart: string;
  periodEnd: string;
  paymentMethod?: string;
}

export async function createPayment(input: CreatePaymentInput): Promise<SubscriptionPayment> {
  const row = await queryOne<SubscriptionPaymentRow>(
    `INSERT INTO subscription_payments (tenant_id, subscription_type, subscription_id, amount, period_start, period_end, payment_method)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [
      input.tenantId,
      input.subscriptionType,
      input.subscriptionId,
      input.amount,
      input.periodStart,
      input.periodEnd,
      input.paymentMethod ?? 'yape',
    ],
  );
  return rowToPayment(row!);
}

export async function getPaymentById(tenantId: string, id: number): Promise<SubscriptionPayment | undefined> {
  const row = await queryOne<SubscriptionPaymentRow>('SELECT * FROM subscription_payments WHERE tenant_id = $1 AND id = $2', [tenantId, id]);
  return row ? rowToPayment(row) : undefined;
}

export async function getPendingPayments(
  subscriptionType?: string,
  subscriptionId?: number,
): Promise<SubscriptionPayment[]> {
  const conditions = ["status = 'pending'"];
  const params: unknown[] = [];
  let idx = 1;

  if (subscriptionType) {
    conditions.push(`subscription_type = $${idx++}`);
    params.push(subscriptionType);
  }
  if (subscriptionId) {
    conditions.push(`subscription_id = $${idx++}`);
    params.push(subscriptionId);
  }

  const result = await query<SubscriptionPaymentRow>(
    `SELECT * FROM subscription_payments WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`,
    params,
  );
  return result.rows.map(rowToPayment);
}

export async function getPendingByTenant(tenantId: string): Promise<SubscriptionPayment[]> {
  const result = await query<SubscriptionPaymentRow>(
    `SELECT * FROM subscription_payments WHERE tenant_id = $1 AND status = 'pending' ORDER BY created_at DESC`,
    [tenantId],
  );
  return result.rows.map(rowToPayment);
}

export async function confirmPayment(tenantId: string, id: number, reference?: string, yapeNotificationId?: number): Promise<SubscriptionPayment | undefined> {
  const row = await queryOne<SubscriptionPaymentRow>(
    `UPDATE subscription_payments
     SET status = 'confirmed', confirmed_at = now(), reference = COALESCE($3, reference), yape_notification_id = COALESCE($4, yape_notification_id)
     WHERE tenant_id = $1 AND id = $2 AND status = 'pending' RETURNING *`,
    [tenantId, id, reference ?? null, yapeNotificationId ?? null],
  );
  return row ? rowToPayment(row) : undefined;
}

export async function expireOverdue(): Promise<number> {
  const result = await query(
    `UPDATE subscription_payments SET status = 'expired' WHERE status = 'pending' AND period_end < now()`,
  );
  return result.rowCount ?? 0;
}

export async function getPaymentsBySubscription(
  tenantId: string,
  subscriptionType: string,
  subscriptionId: number,
): Promise<SubscriptionPayment[]> {
  const result = await query<SubscriptionPaymentRow>(
    `SELECT * FROM subscription_payments WHERE tenant_id = $1 AND subscription_type = $2 AND subscription_id = $3 ORDER BY created_at DESC`,
    [tenantId, subscriptionType, subscriptionId],
  );
  return result.rows.map(rowToPayment);
}
