/**
 * Subscription state access.
 *
 * Uses the shared pg pool from business-db.ts. Schema lives in
 * db/migrations/001_agente_ceo_billing.sql.
 */

import { query, queryOne } from '@/lib/business-db';

export type SubscriptionStatus =
  | 'inactive'
  | 'pending'
  | 'active'
  | 'past_due'
  | 'canceled';

export interface Subscription {
  user_id: string;
  status: SubscriptionStatus;
  plan: string;
  current_period_end: Date | null;
  yaya_intent_id: string | null;
  amount_cents: number | null;
  currency: string;
  boleta_serie: string | null;
  boleta_numero: number | null;
  boleta_pdf_url: string | null;
  boleta_xml_url: string | null;
  boleta_hash: string | null;
  boleta_aceptada: boolean | null;
  created_at: Date;
  updated_at: Date;
}

export async function getSubscription(
  userId: string,
): Promise<Subscription | null> {
  return queryOne<Subscription>(
    `SELECT * FROM agente_ceo_subscriptions WHERE user_id = $1`,
    [userId],
  );
}

export async function isActive(userId: string): Promise<boolean> {
  const sub = await getSubscription(userId);
  if (!sub) return false;
  if (sub.status !== 'active') return false;
  if (sub.current_period_end && sub.current_period_end.getTime() < Date.now()) {
    return false;
  }
  return true;
}

/**
 * Upsert — called on billing start, before the user has paid.
 * Sets status to 'pending' and records the intent we're waiting on.
 */
export async function markPending(
  userId: string,
  intentId: string,
  amountCents: number,
  plan: string,
): Promise<void> {
  await query(
    `
    INSERT INTO agente_ceo_subscriptions
      (user_id, status, plan, yaya_intent_id, amount_cents, currency, updated_at)
    VALUES ($1, 'pending', $2, $3, $4, 'PEN', NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      status = 'pending',
      plan = EXCLUDED.plan,
      yaya_intent_id = EXCLUDED.yaya_intent_id,
      amount_cents = EXCLUDED.amount_cents,
      updated_at = NOW()
    `,
    [userId, plan, intentId, amountCents],
  );
}

/**
 * Activate a subscription after a confirmed yayapay webhook.
 * Idempotent on (user_id, intent_id) — replaying the same webhook is safe.
 */
export async function activate(params: {
  userId: string;
  intentId: string;
  periodDays: number;
}): Promise<Subscription> {
  const { userId, intentId, periodDays } = params;
  const row = await queryOne<Subscription>(
    `
    INSERT INTO agente_ceo_subscriptions
      (user_id, status, yaya_intent_id, current_period_end, updated_at)
    VALUES ($1, 'active', $2, NOW() + ($3 || ' days')::interval, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      status = 'active',
      yaya_intent_id = EXCLUDED.yaya_intent_id,
      current_period_end = GREATEST(
        agente_ceo_subscriptions.current_period_end,
        NOW()
      ) + ($3 || ' days')::interval,
      updated_at = NOW()
    RETURNING *
    `,
    [userId, intentId, periodDays],
  );
  if (!row) throw new Error('Failed to activate subscription');
  return row;
}

/**
 * Record the boleta that was issued for a successful payment.
 * Called after Nubefact returns a 2xx.
 */
export async function attachBoleta(params: {
  userId: string;
  intentId: string;
  serie: string;
  numero: number;
  pdfUrl: string | null;
  xmlUrl: string | null;
  hash: string | null;
  aceptada: boolean | null;
  amountCents: number;
  currency: string;
  sunatMessage: string | null;
  rawResponse: unknown;
}): Promise<void> {
  await query(
    `
    INSERT INTO agente_ceo_boletas
      (user_id, intent_id, serie, numero, amount_cents, currency,
       pdf_url, xml_url, hash, aceptada, sunat_message, raw_response)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    ON CONFLICT (intent_id) DO NOTHING
    `,
    [
      params.userId,
      params.intentId,
      params.serie,
      params.numero,
      params.amountCents,
      params.currency,
      params.pdfUrl,
      params.xmlUrl,
      params.hash,
      params.aceptada,
      params.sunatMessage,
      JSON.stringify(params.rawResponse ?? null),
    ],
  );

  await query(
    `
    UPDATE agente_ceo_subscriptions
      SET boleta_serie = $2,
          boleta_numero = $3,
          boleta_pdf_url = $4,
          boleta_xml_url = $5,
          boleta_hash = $6,
          boleta_aceptada = $7,
          updated_at = NOW()
      WHERE user_id = $1
    `,
    [
      params.userId,
      params.serie,
      params.numero,
      params.pdfUrl,
      params.xmlUrl,
      params.hash,
      params.aceptada,
    ],
  );
}

/**
 * Record a webhook event for replay protection.
 * Returns true if this is the first time we've seen (intent, event).
 */
export async function recordWebhookEvent(
  intentId: string,
  eventType: string,
  payload: unknown,
): Promise<boolean> {
  const row = await queryOne<{ inserted: boolean }>(
    `
    INSERT INTO agente_ceo_webhook_events (intent_id, event_type, payload)
    VALUES ($1, $2, $3::jsonb)
    ON CONFLICT (intent_id, event_type) DO NOTHING
    RETURNING true AS inserted
    `,
    [intentId, eventType, JSON.stringify(payload)],
  );
  return !!row;
}
