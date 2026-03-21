import { query, queryOne } from './pool.js';
import { createRowMapper } from './row-mapper.js';
import type { CustomerSubscription } from '../shared/types.js';
import type { CustomerSubscriptionRow } from './row-types.js';

const rowToSub = createRowMapper<CustomerSubscription>({
  id: 'id',
  tenantId: 'tenant_id',
  customerId: 'customer_id',
  planId: 'plan_id',
  status: 'status',
  currentPeriodStart: { col: 'current_period_start', type: 'date' },
  currentPeriodEnd: { col: 'current_period_end', type: 'date' },
  cancelledAt: { col: 'cancelled_at', type: 'date' },
  createdAt: { col: 'created_at', type: 'date' },
});

export interface SubscriptionFilters {
  customerId?: number;
  planId?: number;
  status?: string;
  limit?: number;
  offset?: number;
}

export async function getSubscriptions(tenantId: string, filters: SubscriptionFilters = {}): Promise<CustomerSubscription[]> {
  const conditions = ['cs.tenant_id = $1'];
  const params: unknown[] = [tenantId];
  let idx = 2;

  if (filters.customerId) {
    conditions.push(`cs.customer_id = $${idx++}`);
    params.push(filters.customerId);
  }
  if (filters.planId) {
    conditions.push(`cs.plan_id = $${idx++}`);
    params.push(filters.planId);
  }
  if (filters.status) {
    conditions.push(`cs.status = $${idx++}`);
    params.push(filters.status);
  }

  const limit = filters.limit ?? 50;
  const offset = filters.offset ?? 0;

  conditions.push(`1=1`); // ensure WHERE clause is valid
  params.push(limit);
  params.push(offset);

  const result = await query<CustomerSubscriptionRow>(
    `SELECT cs.* FROM customer_subscriptions cs
     WHERE ${conditions.join(' AND ')}
     ORDER BY cs.created_at DESC
     LIMIT $${idx++} OFFSET $${idx++}`,
    params,
  );
  return result.rows.map(rowToSub);
}

export async function getSubscription(tenantId: string, subscriptionId: number): Promise<CustomerSubscription | undefined> {
  const row = await queryOne<CustomerSubscriptionRow>(
    'SELECT * FROM customer_subscriptions WHERE tenant_id = $1 AND id = $2',
    [tenantId, subscriptionId],
  );
  return row ? rowToSub(row) : undefined;
}

function periodEnd(billingCycle: string, start: Date = new Date()): Date {
  const end = new Date(start);
  switch (billingCycle) {
    case 'weekly':
      end.setDate(end.getDate() + 7);
      break;
    case 'yearly':
      end.setFullYear(end.getFullYear() + 1);
      break;
    case 'monthly':
    default:
      end.setMonth(end.getMonth() + 1);
      break;
  }
  return end;
}

export async function subscribe(
  tenantId: string,
  customerId: number,
  planId: number,
  billingCycle: string,
): Promise<CustomerSubscription> {
  const now = new Date();
  const end = periodEnd(billingCycle, now);

  const row = await queryOne<CustomerSubscriptionRow>(
    `INSERT INTO customer_subscriptions (tenant_id, customer_id, plan_id, status, current_period_start, current_period_end)
     VALUES ($1, $2, $3, 'active', $4, $5) RETURNING *`,
    [tenantId, customerId, planId, now.toISOString(), end.toISOString()],
  );
  return rowToSub(row!);
}

export async function renewSubscription(tenantId: string, subscriptionId: number, billingCycle: string): Promise<CustomerSubscription | undefined> {
  const existing = await queryOne<CustomerSubscriptionRow>(
    'SELECT * FROM customer_subscriptions WHERE tenant_id = $1 AND id = $2',
    [tenantId, subscriptionId],
  );
  if (!existing) return undefined;

  const newStart = new Date(existing.current_period_end);
  const newEnd = periodEnd(billingCycle, newStart);

  const row = await queryOne<CustomerSubscriptionRow>(
    `UPDATE customer_subscriptions SET status = 'active', current_period_start = $1, current_period_end = $2
     WHERE tenant_id = $3 AND id = $4 RETURNING *`,
    [newStart.toISOString(), newEnd.toISOString(), tenantId, subscriptionId],
  );
  return row ? rowToSub(row) : undefined;
}

export async function cancelSubscription(tenantId: string, subscriptionId: number): Promise<CustomerSubscription | undefined> {
  const row = await queryOne<CustomerSubscriptionRow>(
    `UPDATE customer_subscriptions SET status = 'cancelled', cancelled_at = now()
     WHERE tenant_id = $1 AND id = $2 RETURNING *`,
    [tenantId, subscriptionId],
  );
  return row ? rowToSub(row) : undefined;
}

export async function getExpiring(tenantId: string, daysAhead: number): Promise<CustomerSubscription[]> {
  const result = await query<CustomerSubscriptionRow>(
    `SELECT * FROM customer_subscriptions
     WHERE tenant_id = $1 AND status = 'active' AND current_period_end <= now() + $2 * INTERVAL '1 day'`,
    [tenantId, daysAhead],
  );
  return result.rows.map(rowToSub);
}

export async function getActiveByCustomer(tenantId: string, customerId: number): Promise<CustomerSubscription[]> {
  const result = await query<CustomerSubscriptionRow>(
    `SELECT * FROM customer_subscriptions
     WHERE tenant_id = $1 AND customer_id = $2 AND status IN ('active', 'past_due')
     ORDER BY created_at DESC`,
    [tenantId, customerId],
  );
  return result.rows.map(rowToSub);
}

export async function getSubscriptionCount(tenantId: string, status?: string): Promise<number> {
  const conditions = ['tenant_id = $1'];
  const params: unknown[] = [tenantId];
  if (status) {
    conditions.push('status = $2');
    params.push(status);
  }
  const row = await queryOne<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM customer_subscriptions WHERE ${conditions.join(' AND ')}`,
    params,
  );
  return row?.count ?? 0;
}
