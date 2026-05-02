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
 * Lower-case, strip accents, collapse whitespace. Used for fuzzy
 * sender-name matching — Yape often returns "JUAN PEREZ", customer record
 * may be "Juan Pérez" — so we normalize before comparing.
 */
function normalizeName(s: string): string {
  return (s || '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Returns true if the Yape sender name shares at least one significant
 * (>=3 char) token with the customer's name. This is the defense against
 * a customer paying the right amount and having their payment auto-credited
 * to a different (unrelated) customer's pending order.
 */
function senderNameMatches(senderName: string, customerName: string | null): boolean {
  if (!customerName) return false;
  const sender = normalizeName(senderName);
  const customer = normalizeName(customerName);
  if (!sender || !customer) return false;
  if (sender === customer) return true;
  const senderTokens = new Set(sender.split(' ').filter(t => t.length >= 3));
  for (const tok of customer.split(' ')) {
    if (tok.length >= 3 && senderTokens.has(tok)) return true;
  }
  return false;
}

/**
 * Attempt to match a synced Yape notification against pending payments.
 *
 * Matching strategy:
 *   - Filter by tenant, method=yape, amount equality.
 *   - Within those, prefer the candidate whose customer name shares a
 *     token with the Yape sender name (defense against same-amount collision
 *     between two customers).
 *   - If exactly one candidate matches both amount AND name, auto-confirm.
 *   - Else zero matches → unmatched. Multiple → leave PENDING for manual.
 */
export async function matchYapePayment(
  tenantId: string,
  senderName: string,
  amount: number,
  notificationId: number,
): Promise<MatchResult> {
  const pending = await paymentsRepo.getPendingPayments(tenantId);
  const amountCandidates = pending.filter(p => p.method === 'yape' && p.amount === amount);
  const nameAndAmountCandidates = amountCandidates.filter(p => senderNameMatches(senderName, p.customerName));

  // Prefer the stricter match (amount + name). Fall back only if exactly
  // one amount candidate and we have no name to compare.
  let candidates = nameAndAmountCandidates;
  if (candidates.length === 0 && amountCandidates.length === 1 && !senderName) {
    candidates = amountCandidates;
  }

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

  if (amountCandidates.length === 0) {
    await yapeNotifRepo.markUnmatched(notificationId);
    logger.info({ tenantId, amount, senderName }, 'Yape notification: no matching pending payment');
    return { matched: false, status: 'UNMATCHED' };
  }

  // Either: multiple amount-only matches with no name disambiguation, or
  // multiple name+amount matches. Either way, ambiguous — manual review.
  logger.warn({ tenantId, amount, senderName, amountCount: amountCandidates.length, nameAndAmountCount: nameAndAmountCandidates.length }, 'Yape notification: ambiguous — needs manual resolution');
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
