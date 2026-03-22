/**
 * Lago API Client — billing, subscriptions, usage metering, invoicing
 * Replaces custom subscription/billing code with calls to our self-hosted Lago instance.
 * https://doc.getlago.com/api-reference
 */

import { LAGO_API_URL, LAGO_API_KEY } from '../config.js';
import { logger } from '../shared/logger.js';

const TIMEOUT_MS = 8_000;

// ── Helpers ──

function headers(): Record<string, string> {
  return {
    'Authorization': `Bearer ${LAGO_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

async function lagoFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T | null> {
  const url = `${LAGO_API_URL}/api/v1${path}`;
  try {
    const res = await fetch(url, {
      ...init,
      headers: { ...headers(), ...(init.headers as Record<string, string> ?? {}) },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      logger.error({ status: res.status, body, path }, 'Lago API error');
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    logger.error({ err, path }, 'Lago API request failed');
    return null;
  }
}

// ── Health ──

export async function isServiceAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${LAGO_API_URL}/api/v1/customers?per_page=1`, {
      headers: headers(),
      signal: AbortSignal.timeout(3_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ── Customers ──

export interface LagoCustomer {
  lago_id: string;
  external_id: string;
  name: string;
  email?: string;
  currency?: string;
}

export async function createCustomer(externalId: string, name: string, currency: string): Promise<LagoCustomer | null> {
  const result = await lagoFetch<{ customer: LagoCustomer }>('/customers', {
    method: 'POST',
    body: JSON.stringify({
      customer: {
        external_id: externalId,
        name,
        currency,
      },
    }),
  });
  return result?.customer ?? null;
}

export async function getCustomer(externalId: string): Promise<LagoCustomer | null> {
  const result = await lagoFetch<{ customer: LagoCustomer }>(`/customers/${encodeURIComponent(externalId)}`);
  return result?.customer ?? null;
}

// ── Plans ──

export interface LagoPlan {
  lago_id: string;
  code: string;
  name: string;
  amount_cents: number;
  amount_currency: string;
  interval: string;
}

export async function listPlans(): Promise<LagoPlan[]> {
  const result = await lagoFetch<{ plans: LagoPlan[] }>('/plans?per_page=100');
  return result?.plans ?? [];
}

export async function getPlan(code: string): Promise<LagoPlan | null> {
  const result = await lagoFetch<{ plan: LagoPlan }>(`/plans/${encodeURIComponent(code)}`);
  return result?.plan ?? null;
}

// ── Subscriptions ──

export interface LagoSubscription {
  lago_id: string;
  external_id: string;
  external_customer_id: string;
  plan_code: string;
  status: string;
  started_at: string;
  ending_at?: string;
  canceled_at?: string;
}

export async function createSubscription(
  externalCustomerId: string,
  planCode: string,
  externalId: string,
): Promise<LagoSubscription | null> {
  const result = await lagoFetch<{ subscription: LagoSubscription }>('/subscriptions', {
    method: 'POST',
    body: JSON.stringify({
      subscription: {
        external_customer_id: externalCustomerId,
        plan_code: planCode,
        external_id: externalId,
      },
    }),
  });
  return result?.subscription ?? null;
}

export async function terminateSubscription(externalId: string): Promise<LagoSubscription | null> {
  const result = await lagoFetch<{ subscription: LagoSubscription }>(
    `/subscriptions/${encodeURIComponent(externalId)}`,
    { method: 'DELETE' },
  );
  return result?.subscription ?? null;
}

export async function getSubscription(externalId: string): Promise<LagoSubscription | null> {
  const result = await lagoFetch<{ subscription: LagoSubscription }>(
    `/subscriptions/${encodeURIComponent(externalId)}`,
  );
  return result?.subscription ?? null;
}

export async function listSubscriptions(externalCustomerId: string): Promise<LagoSubscription[]> {
  const result = await lagoFetch<{ subscriptions: LagoSubscription[] }>(
    `/subscriptions?external_customer_id=${encodeURIComponent(externalCustomerId)}&status[]=active`,
  );
  return result?.subscriptions ?? [];
}

// ── Usage Events ──

export async function sendUsageEvent(
  externalCustomerId: string,
  externalSubscriptionId: string,
  code: string,
  properties: Record<string, string | number> = {},
): Promise<boolean> {
  const result = await lagoFetch('/events', {
    method: 'POST',
    body: JSON.stringify({
      event: {
        transaction_id: `${externalSubscriptionId}_${code}_${Date.now()}`,
        external_customer_id: externalCustomerId,
        external_subscription_id: externalSubscriptionId,
        code,
        properties,
      },
    }),
  });
  return result !== null;
}

// ── Invoices ──

export interface LagoInvoice {
  lago_id: string;
  sequential_id: number;
  status: string;
  payment_status: string;
  amount_cents: number;
  amount_currency: string;
  issuing_date: string;
}

export async function listInvoices(externalCustomerId: string): Promise<LagoInvoice[]> {
  const result = await lagoFetch<{ invoices: LagoInvoice[] }>(
    `/invoices?external_customer_id=${encodeURIComponent(externalCustomerId)}&per_page=20`,
  );
  return result?.invoices ?? [];
}
