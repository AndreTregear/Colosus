import * as paymentsRepo from '../db/payments-repo.js';
import * as yapeNotifRepo from '../db/yape-notifications-repo.js';
import * as subPaymentsRepo from '../db/subscription-payments-repo.js';
import * as tenantSubsRepo from '../db/tenant-subscriptions-repo.js';
import * as custSubsRepo from '../db/customer-subscriptions-repo.js';
import * as orderService from './order-service.js';
import { appBus } from '../shared/events.js';
import { logger } from '../shared/logger.js';

export interface MatchResult {
  matched: boolean;
  paymentId?: number;
  status: 'CONFIRMED' | 'UNMATCHED' | 'PENDING';
}

/**
 * Match a Yape notification against pending order payments.
 * Single match → auto-confirm. Zero → unmatched. Multiple → pending (manual).
 */
export async function matchOrderPayment(
  tenantId: string,
  senderName: string,
  amount: number,
  notificationId: number,
): Promise<MatchResult> {
  const pending = await paymentsRepo.getPendingPayments(tenantId);
  const candidates = pending.filter(p => p.method === 'yape' && p.amount === amount);

  if (candidates.length === 1) {
    const payment = candidates[0]!;
    const reference = `yape:${senderName}:notif:${notificationId}`;

    await orderService.markPaid(tenantId, payment.orderId, payment.id, reference);
    await yapeNotifRepo.markMatched(notificationId, payment.id);

    appBus.emit('yape-payment-matched', tenantId, payment.id, payment.orderId, payment.customerJid);
    logger.info({ tenantId, paymentId: payment.id, orderId: payment.orderId, amount, senderName },
      'Yape payment auto-confirmed');

    return { matched: true, paymentId: payment.id, status: 'CONFIRMED' };
  }

  if (candidates.length === 0) {
    await yapeNotifRepo.markUnmatched(notificationId);
    logger.info({ tenantId, amount, senderName }, 'Yape notification: no matching pending payment');
    return { matched: false, status: 'UNMATCHED' };
  }

  logger.warn({ tenantId, amount, senderName, matchCount: candidates.length },
    'Yape notification: multiple pending payments match — needs manual resolution');
  return { matched: false, status: 'PENDING' };
}

/**
 * Match a Yape notification against pending subscription payments.
 * Called after order-payment matching if no match was found.
 */
export async function matchSubscriptionPayment(
  tenantId: string,
  senderName: string,
  amount: number,
  notificationId: number,
): Promise<MatchResult> {
  const pending = await subPaymentsRepo.getPendingByTenant(tenantId);
  const candidates = pending.filter(p => p.amount === amount);

  if (candidates.length === 1) {
    const payment = candidates[0]!;
    const reference = `yape:${senderName}:notif:${notificationId}`;

    await subPaymentsRepo.confirmPayment(tenantId, payment.id, reference, notificationId);
    await yapeNotifRepo.markMatched(notificationId, payment.id);

    if (payment.subscriptionType === 'platform') {
      await tenantSubsRepo.renewSubscription(tenantId, payment.subscriptionId, 'monthly');
    } else {
      await custSubsRepo.renewSubscription(tenantId, payment.subscriptionId, 'monthly');
    }

    logger.info({ tenantId, paymentId: payment.id, subscriptionType: payment.subscriptionType, amount, senderName },
      'Yape subscription payment auto-confirmed');

    return { matched: true, paymentId: payment.id, status: 'CONFIRMED' };
  }

  if (candidates.length === 0) {
    return { matched: false, status: 'UNMATCHED' };
  }

  logger.warn({ tenantId, amount, senderName, matchCount: candidates.length },
    'Yape subscription: multiple pending payments match — needs manual resolution');
  return { matched: false, status: 'PENDING' };
}

/**
 * Sync a single Yape notification: dedup, create, match order then subscription.
 */
export async function syncYapeNotification(
  tenantId: string,
  deviceId: number,
  senderName: string,
  amount: number,
  capturedAt: Date,
  notificationHash: string,
): Promise<{ notificationId: number; status: 'CONFIRMED' | 'UNMATCHED' | 'PENDING' }> {
  // Dedup
  const existing = await yapeNotifRepo.getByHash(notificationHash);
  if (existing) {
    return { notificationId: existing.id, status: existing.status.toUpperCase() as 'CONFIRMED' | 'UNMATCHED' | 'PENDING' };
  }

  const notification = await yapeNotifRepo.createNotification(
    tenantId, deviceId, senderName, amount, capturedAt, notificationHash,
  );

  appBus.emit('yape-payment-synced', tenantId, notification.id);

  let result = await matchOrderPayment(tenantId, senderName, amount, notification.id);

  if (result.status === 'UNMATCHED') {
    const subMatch = await matchSubscriptionPayment(tenantId, senderName, amount, notification.id);
    if (subMatch.matched) result = subMatch;
  }

  return { notificationId: notification.id, status: result.status };
}

/**
 * Validate whether a Yape payment exists for an order.
 * Tries to match unmatched notifications if no confirmed payment yet.
 */
export async function validatePaymentForOrder(
  tenantId: string,
  orderId: number,
): Promise<{ validated: boolean; paymentId?: number; message: string }> {
  const payments = await paymentsRepo.getPaymentsByOrder(tenantId, orderId);
  const confirmed = payments.find(p => p.status === 'confirmed');
  if (confirmed) {
    return { validated: true, paymentId: confirmed.id, message: 'Payment confirmed.' };
  }

  const pendingPayment = payments.find(p => p.status === 'pending' && p.method === 'yape');
  if (pendingPayment) {
    const unmatched = await yapeNotifRepo.getUnmatchedByTenant(tenantId);
    const match = unmatched.find(n => n.amount === pendingPayment.amount);
    if (match) {
      const result = await matchOrderPayment(tenantId, match.senderName, match.amount, match.id);
      if (result.matched) {
        return { validated: true, paymentId: result.paymentId, message: 'Payment confirmed via Yape.' };
      }
    }
  }

  return { validated: false, message: 'Payment not yet confirmed. The Yaya app will verify it automatically.' };
}

// ── Read-Only Pass-Throughs ──

export const getPendingPayments = paymentsRepo.getPendingPayments;
export const getPaymentsByOrder = paymentsRepo.getPaymentsByOrder;
