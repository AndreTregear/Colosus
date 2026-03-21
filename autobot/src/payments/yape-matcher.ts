import * as paymentsRepo from '../db/payments-repo.js';
import * as ordersRepo from '../db/orders-repo.js';
import * as yapeNotifRepo from '../db/yape-notifications-repo.js';
import * as subPaymentsRepo from '../db/subscription-payments-repo.js';
import * as tenantSubsRepo from '../db/tenant-subscriptions-repo.js';
import * as custSubsRepo from '../db/customer-subscriptions-repo.js';
import { appBus } from '../shared/events.js';
import { logger } from '../shared/logger.js';

export interface MatchResult {
  matched: boolean;
  paymentId?: number;
  status: 'CONFIRMED' | 'UNMATCHED' | 'PENDING';
}

/**
 * Attempt to match a synced Yape notification against pending payments.
 *
 * Matching strategy:
 *   - Exact amount match on pending yape payments for the tenant
 *   - Single match → auto-confirm
 *   - Zero matches → unmatched
 *   - Multiple matches → leave as pending (needs manual resolution)
 */
export async function matchYapePayment(
  tenantId: string,
  senderName: string,
  amount: number,
  notificationId: number,
): Promise<MatchResult> {
  const pending = await paymentsRepo.getPendingPayments(tenantId);
  const candidates = pending.filter(p => p.method === 'yape' && p.amount === amount);

  if (candidates.length === 1) {
    const payment = candidates[0];
    const reference = `yape:${senderName}:notif:${notificationId}`;
    await paymentsRepo.confirmPayment(tenantId, payment.id, reference);
    await ordersRepo.updateOrderStatus(tenantId, payment.orderId, 'paid');
    await yapeNotifRepo.markMatched(notificationId, payment.id);
    appBus.emit('yape-payment-matched', tenantId, payment.id, payment.orderId, payment.customerJid);
    logger.info({ tenantId, paymentId: payment.id, orderId: payment.orderId, amount, senderName }, 'Yape payment auto-confirmed');
    return { matched: true, paymentId: payment.id, status: 'CONFIRMED' };
  }

  if (candidates.length === 0) {
    await yapeNotifRepo.markUnmatched(notificationId);
    logger.info({ tenantId, amount, senderName }, 'Yape notification: no matching pending payment');
    return { matched: false, status: 'UNMATCHED' };
  }

  // Multiple matches — ambiguous, leave for manual resolution
  logger.warn({ tenantId, amount, senderName, matchCount: candidates.length }, 'Yape notification: multiple pending payments match — needs manual resolution');
  return { matched: false, status: 'PENDING' };
}

/**
 * Attempt to match a Yape notification against pending subscription payments.
 * Called after order-payment matching if no match was found.
 */
export async function matchYapeSubscriptionPayment(
  tenantId: string,
  senderName: string,
  amount: number,
  notificationId: number,
): Promise<MatchResult> {
  const pending = await subPaymentsRepo.getPendingByTenant(tenantId);
  const candidates = pending.filter(p => p.amount === amount);

  if (candidates.length === 1) {
    const payment = candidates[0];
    const reference = `yape:${senderName}:notif:${notificationId}`;
    await subPaymentsRepo.confirmPayment(tenantId, payment.id, reference, notificationId);
    await yapeNotifRepo.markMatched(notificationId, payment.id);

    if (payment.subscriptionType === 'platform') {
      await tenantSubsRepo.renewSubscription(tenantId, payment.subscriptionId, 'monthly');
    } else {
      await custSubsRepo.renewSubscription(tenantId, payment.subscriptionId, 'monthly');
    }

    logger.info({ tenantId, paymentId: payment.id, subscriptionType: payment.subscriptionType, amount, senderName }, 'Yape subscription payment auto-confirmed');
    return { matched: true, paymentId: payment.id, status: 'CONFIRMED' };
  }

  if (candidates.length === 0) {
    return { matched: false, status: 'UNMATCHED' };
  }

  logger.warn({ tenantId, amount, senderName, matchCount: candidates.length }, 'Yape subscription: multiple pending payments match — needs manual resolution');
  return { matched: false, status: 'PENDING' };
}
