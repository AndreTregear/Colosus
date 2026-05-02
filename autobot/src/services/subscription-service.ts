import * as tenantSubsRepo from '../db/tenant-subscriptions-repo.js';
import * as custSubsRepo from '../db/customer-subscriptions-repo.js';
import * as plansRepo from '../db/platform-plans-repo.js';
import * as creatorPlansRepo from '../db/creator-plans-repo.js';
import * as subPaymentsRepo from '../db/subscription-payments-repo.js';
import * as customersRepo from '../db/customers-repo.js';
import * as settingsRepo from '../db/settings-repo.js';
import { getMessageCountForTenant } from '../db/pg-messages-repo.js';
import { BUSINESS_CURRENCY } from '../config.js';
import { NotFoundError, ServiceError } from './errors.js';
import { logger } from '../shared/logger.js';
import * as lago from '../integrations/lago-client.js';
import type { TenantSubscription, CustomerSubscription, PlatformPlan, SubscriptionPayment } from '../shared/types.js';

// ── Subscription Status (moved from tenant-subscriptions-repo) ──

export interface SubscriptionStatus {
  planSlug: string;
  planName: string;
  isPaid: boolean;
  isActive: boolean;
  messagesUsed: number;
  messagesLimit: number;
  canSendMessages: boolean;
  currentPeriodEnd: string | null;
  billingCycle: string;
}

// ── Billing cycle calculation (shared, was duplicated in both repos) ──

export function calculatePeriodEnd(billingCycle: string, start: Date = new Date()): Date {
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
    case 'one_time':
    case 'monthly':
    default:
      end.setMonth(end.getMonth() + 1);
      break;
  }
  return end;
}

// ── Lago helpers ──

/** Ensure the tenant exists as a Lago customer (idempotent) */
async function ensureLagoCustomer(tenantId: string): Promise<boolean> {
  const existing = await lago.getCustomer(tenantId);
  if (existing) return true;
  const created = await lago.createCustomer(tenantId, tenantId, BUSINESS_CURRENCY);
  return created !== null;
}

// ── Tenant Subscriptions ──

export async function getTenantSubscriptionStatus(tenantId: string): Promise<SubscriptionStatus> {
  // Try Lago first for subscription state
  const lagoAvailable = await lago.isServiceAvailable();
  if (lagoAvailable) {
    try {
      const subs = await lago.listSubscriptions(tenantId);
      const activeSub = subs.find(s => s.status === 'active');
      if (activeSub) {
        const lagoPlan = await lago.getPlan(activeSub.plan_code);
        const planSlug = activeSub.plan_code;
        const planName = lagoPlan?.name ?? activeSub.plan_code;
        const isPaid = planSlug.startsWith('premium');
        const messagesUsed = await getMessageCountForTenant(tenantId, undefined);
        // Lago plans: extract message limits from local plan DB (Lago doesn't store our custom limits)
        const localPlan = await plansRepo.getPlanBySlug(planSlug);
        const messagesLimit = (localPlan?.limits as Record<string, number>)?.total_messages ?? 100;

        return {
          planSlug,
          planName,
          isPaid,
          isActive: true,
          messagesUsed,
          messagesLimit,
          canSendMessages: isPaid || messagesLimit === -1 || messagesUsed < messagesLimit,
          currentPeriodEnd: activeSub.ending_at ?? null,
          billingCycle: lagoPlan?.interval ?? 'monthly',
        };
      }
    } catch (err) {
      logger.error({ err, tenantId }, 'Lago subscription check failed, falling back to DB');
    }
  }

  // Fallback: local DB
  const sub = await tenantSubsRepo.getSubscription(tenantId);
  const plan = sub ? await plansRepo.getPlanById(sub.planId) : null;
  const billingCycle = plan?.billingCycle ?? 'free';
  let periodStart: string | undefined;
  if (billingCycle === 'free' || !sub?.currentPeriodStart) {
    periodStart = undefined;
  } else {
    periodStart = sub.currentPeriodStart;
  }
  const messagesUsed = await getMessageCountForTenant(tenantId, periodStart);

  const planSlug = plan?.slug ?? 'free';
  const planName = plan?.name ?? 'Gratis';
  const isPaid = planSlug.startsWith('premium');
  const messagesLimit = (plan?.limits as Record<string, number>)?.total_messages ?? 100;
  const isActive = sub?.status === 'active';

  let canSendMessages: boolean;
  if (isPaid && isActive) {
    canSendMessages = true;
  } else {
    canSendMessages = messagesLimit === -1 || messagesUsed < messagesLimit;
  }

  return {
    planSlug,
    planName,
    isPaid,
    isActive,
    messagesUsed,
    messagesLimit,
    canSendMessages,
    currentPeriodEnd: sub?.currentPeriodEnd ?? null,
    billingCycle: plan?.billingCycle ?? 'free',
  };
}

export async function canTenantSendMessages(tenantId: string): Promise<boolean> {
  const status = await getTenantSubscriptionStatus(tenantId);
  return status.canSendMessages;
}

export async function subscribeTenant(
  tenantId: string,
  planId: number,
): Promise<{ subscription: TenantSubscription; plan: PlatformPlan; payment?: SubscriptionPayment }> {
  const plan = await plansRepo.getPlanById(planId);
  if (!plan || !plan.active) throw new NotFoundError('Plan', planId);

  // Try Lago first
  const lagoAvailable = await lago.isServiceAvailable();
  if (lagoAvailable) {
    try {
      await ensureLagoCustomer(tenantId);
      const externalSubId = `tenant_${tenantId}_plan_${plan.slug}`;
      const lagoSub = await lago.createSubscription(tenantId, plan.slug, externalSubId);
      if (lagoSub) {
        logger.info({ tenantId, planSlug: plan.slug, lagoId: lagoSub.lago_id }, 'Subscription created in Lago');
      }
    } catch (err) {
      logger.error({ err, tenantId }, 'Failed to create Lago subscription, continuing with local DB');
    }
  }

  // Always persist locally (source of truth for message limits + fast reads)
  const subscription = await tenantSubsRepo.subscribe(tenantId, plan.id, plan.billingCycle);

  let payment: SubscriptionPayment | undefined;
  if (plan.price > 0) {
    payment = await subPaymentsRepo.createPayment({
      tenantId,
      subscriptionType: 'platform',
      subscriptionId: subscription.id,
      amount: plan.price,
      periodStart: subscription.currentPeriodStart,
      periodEnd: subscription.currentPeriodEnd,
    });
  }

  // Report usage event to Lago for tracking
  if (lagoAvailable && plan.price > 0) {
    lago.sendUsageEvent(tenantId, `tenant_${tenantId}_plan_${plan.slug}`, 'subscription_created', {
      plan_slug: plan.slug,
      amount: plan.price,
    }).catch(err => logger.error({ err }, 'Failed to send Lago usage event'));
  }

  return { subscription, plan, payment };
}

export async function cancelTenantSubscription(tenantId: string): Promise<TenantSubscription> {
  const sub = await tenantSubsRepo.getSubscription(tenantId);
  if (!sub) throw new ServiceError('No active subscription found', 'NO_SUBSCRIPTION', 404);

  const plan = await plansRepo.getPlanById(sub.planId);

  // Cancel in Lago
  const lagoAvailable = await lago.isServiceAvailable();
  if (lagoAvailable && plan) {
    try {
      const externalSubId = `tenant_${tenantId}_plan_${plan.slug}`;
      await lago.terminateSubscription(externalSubId);
      logger.info({ tenantId, planSlug: plan.slug }, 'Subscription terminated in Lago');
    } catch (err) {
      logger.error({ err, tenantId }, 'Failed to cancel Lago subscription, continuing with local DB');
    }
  }

  const cancelled = await tenantSubsRepo.cancelSubscription(tenantId, sub.id);
  if (!cancelled) throw new ServiceError('Failed to cancel subscription', 'CANCEL_FAILED');
  return cancelled;
}

export async function renewTenantSubscription(
  tenantId: string,
  subscriptionId: number,
  billingCycle: string,
): Promise<TenantSubscription> {
  const renewed = await tenantSubsRepo.renewSubscription(tenantId, subscriptionId, billingCycle);
  if (!renewed) throw new NotFoundError('Subscription', subscriptionId);
  return renewed;
}

// ── Customer Subscriptions ──

export async function subscribeCustomer(
  tenantId: string,
  customerJid: string,
  channel: string,
  planId: number,
): Promise<{
  type: 'new' | 'renewal';
  subscription: CustomerSubscription;
  payment: SubscriptionPayment;
  planName: string;
  amount: number;
  currency: string;
  yapeNumber: string | undefined;
}> {
  const customer = await customersRepo.getOrCreateCustomer(tenantId, customerJid, channel);
  const plan = await creatorPlansRepo.getPlanById(tenantId, planId);
  if (!plan) throw new NotFoundError('Plan', planId);
  if (!plan.active) throw new ServiceError('This subscription plan is no longer available', 'PLAN_INACTIVE');

  const currency = await settingsRepo.getEffectiveSetting(tenantId, 'currency', BUSINESS_CURRENCY);
  const yapeNumber = await settingsRepo.getEffectiveSetting(tenantId, 'yape_number');

  // Sync customer to Lago (best-effort)
  const lagoAvailable = await lago.isServiceAvailable();
  if (lagoAvailable) {
    const customerExternalId = `${tenantId}_cust_${customer.id}`;
    lago.createCustomer(customerExternalId, customerJid, currency)
      .catch(err => logger.error({ err }, 'Failed to sync customer to Lago'));
  }

  // Check for existing active subscription to this plan
  const activeSubs = await custSubsRepo.getActiveByCustomer(tenantId, customer.id);
  const existing = activeSubs.find(s => s.planId === planId);

  if (existing) {
    // Create renewal payment
    const periodStart = existing.currentPeriodEnd;
    const periodEnd = calculatePeriodEnd(plan.billingCycle, new Date(existing.currentPeriodEnd)).toISOString();

    const payment = await subPaymentsRepo.createPayment({
      tenantId,
      subscriptionType: 'creator',
      subscriptionId: existing.id,
      amount: plan.price,
      periodStart,
      periodEnd,
    });

    return {
      type: 'renewal',
      subscription: existing,
      payment,
      planName: plan.name,
      amount: plan.price,
      currency,
      yapeNumber,
    };
  }

  // Create new subscription + payment
  const subscription = await custSubsRepo.subscribe(tenantId, customer.id, planId, plan.billingCycle);

  const payment = await subPaymentsRepo.createPayment({
    tenantId,
    subscriptionType: 'creator',
    subscriptionId: subscription.id,
    amount: plan.price,
    periodStart: subscription.currentPeriodStart,
    periodEnd: subscription.currentPeriodEnd,
  });

  // Create subscription in Lago (best-effort)
  if (lagoAvailable) {
    const customerExternalId = `${tenantId}_cust_${customer.id}`;
    const subExternalId = `${tenantId}_custsub_${subscription.id}`;
    lago.createSubscription(customerExternalId, `creator_plan_${planId}`, subExternalId)
      .catch(err => logger.error({ err }, 'Failed to create Lago customer subscription'));
  }

  return {
    type: 'new',
    subscription,
    payment,
    planName: plan.name,
    amount: plan.price,
    currency,
    yapeNumber,
  };
}

export async function cancelCustomerSubscription(
  tenantId: string,
  subscriptionId: number,
): Promise<CustomerSubscription> {
  // Cancel in Lago (best-effort)
  const lagoAvailable = await lago.isServiceAvailable();
  if (lagoAvailable) {
    const subExternalId = `${tenantId}_custsub_${subscriptionId}`;
    lago.terminateSubscription(subExternalId)
      .catch(err => logger.error({ err }, 'Failed to cancel Lago customer subscription'));
  }

  const cancelled = await custSubsRepo.cancelSubscription(tenantId, subscriptionId);
  if (!cancelled) throw new NotFoundError('Subscription', subscriptionId);
  return cancelled;
}
