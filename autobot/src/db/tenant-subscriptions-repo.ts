import { query, queryOne } from './pool.js';
import { createRowMapper } from './row-mapper.js';
import type { TenantSubscription } from '../shared/types.js';
import type { TenantSubscriptionRow } from './row-types.js';

const rowToSub = createRowMapper<TenantSubscription>({
  id: 'id',
  tenantId: 'tenant_id',
  planId: 'plan_id',
  status: 'status',
  currentPeriodStart: { col: 'current_period_start', type: 'date' },
  currentPeriodEnd: { col: 'current_period_end', type: 'date' },
  cancelledAt: { col: 'cancelled_at', type: 'date' },
  createdAt: { col: 'created_at', type: 'date' },
});

export async function getSubscription(tenantId: string): Promise<TenantSubscription | undefined> {
  const row = await queryOne<TenantSubscriptionRow>(
    `SELECT * FROM tenant_subscriptions WHERE tenant_id = $1 AND status IN ('active', 'past_due') ORDER BY created_at DESC LIMIT 1`,
    [tenantId],
  );
  return row ? rowToSub(row) : undefined;
}

function periodEnd(billingCycle: string, start: Date = new Date()): Date {
  const end = new Date(start);
  switch (billingCycle) {
    case 'weekly':
      end.setDate(end.getDate() + 7);
      break;
    case 'quarterly':
      end.setMonth(end.getMonth() + 3);
      break;
    case 'yearly':
      end.setFullYear(end.getFullYear() + 1);
      break;
    case 'free':
      end.setFullYear(end.getFullYear() + 100);
      break;
    case 'monthly':
    default:
      end.setMonth(end.getMonth() + 1);
      break;
  }
  return end;
}

export async function subscribe(tenantId: string, planId: number, billingCycle: string): Promise<TenantSubscription> {
  // Cancel any existing active subscription
  await query(
    `UPDATE tenant_subscriptions SET status = 'cancelled', cancelled_at = now() WHERE tenant_id = $1 AND status IN ('active', 'past_due')`,
    [tenantId],
  );

  const now = new Date();
  const end = periodEnd(billingCycle, now);

  const row = await queryOne<TenantSubscriptionRow>(
    `INSERT INTO tenant_subscriptions (tenant_id, plan_id, status, current_period_start, current_period_end)
     VALUES ($1, $2, 'active', $3, $4) RETURNING *`,
    [tenantId, planId, now.toISOString(), end.toISOString()],
  );
  return rowToSub(row!);
}

export async function renewSubscription(tenantId: string, subscriptionId: number, billingCycle: string): Promise<TenantSubscription | undefined> {
  const existing = await queryOne<TenantSubscriptionRow>('SELECT * FROM tenant_subscriptions WHERE tenant_id = $1 AND id = $2', [tenantId, subscriptionId]);
  if (!existing) return undefined;

  const newStart = new Date(existing.current_period_end);
  const newEnd = periodEnd(billingCycle, newStart);

  const row = await queryOne<TenantSubscriptionRow>(
    `UPDATE tenant_subscriptions SET status = 'active', current_period_start = $1, current_period_end = $2 WHERE tenant_id = $3 AND id = $4 RETURNING *`,
    [newStart.toISOString(), newEnd.toISOString(), tenantId, subscriptionId],
  );
  return row ? rowToSub(row) : undefined;
}

export async function cancelSubscription(tenantId: string, subscriptionId: number): Promise<TenantSubscription | undefined> {
  const row = await queryOne<TenantSubscriptionRow>(
    `UPDATE tenant_subscriptions SET status = 'cancelled', cancelled_at = now() WHERE tenant_id = $1 AND id = $2 RETURNING *`,
    [tenantId, subscriptionId],
  );
  return row ? rowToSub(row) : undefined;
}

export async function getExpiring(daysAhead: number): Promise<TenantSubscription[]> {
  const result = await query<TenantSubscriptionRow>(
    `SELECT * FROM tenant_subscriptions WHERE status = 'active' AND current_period_end <= now() + $1 * INTERVAL '1 day'`,
    [daysAhead],
  );
  return result.rows.map(rowToSub);
}

export async function markPastDue(subscriptionId: number): Promise<void> {
  await query(`UPDATE tenant_subscriptions SET status = 'past_due' WHERE id = $1`, [subscriptionId]);
}
