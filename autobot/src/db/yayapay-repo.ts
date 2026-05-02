import { query, queryOne } from './pool.js';
import type { PaymentIntent, WebhookEvent } from '../integrations/yayapay/index.js';

export interface YayapayIntentRow {
  intent_id: string;
  tenant_id: string | null;
  client_reference_id: string | null;
  customer_jid: string | null;
  wallet: string;
  amount: number;
  currency: string;
  status: string;
  description: string | null;
  payment_link: string | null;
  qr_data: string | null;
  sender_name: string | null;
  purpose: string | null;
  metadata: Record<string, unknown> | null;
  created_at: Date;
  expires_at: Date | null;
  succeeded_at: Date | null;
}

export async function upsertIntent(args: {
  intent: PaymentIntent;
  tenantId?: string | null;
  customerJid?: string | null;
  purpose?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<void> {
  const { intent, tenantId, customerJid, purpose, metadata } = args;
  await query(
    `INSERT INTO yayapay_intents (
       intent_id, tenant_id, client_reference_id, customer_jid,
       wallet, amount, currency, status, description,
       payment_link, qr_data, sender_name, purpose, metadata,
       created_at, expires_at, succeeded_at
     ) VALUES (
       $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
       to_timestamp($15 / 1000.0),
       to_timestamp($16 / 1000.0),
       CASE WHEN $17::bigint IS NULL THEN NULL ELSE to_timestamp($17 / 1000.0) END
     )
     ON CONFLICT (intent_id) DO UPDATE SET
       status = EXCLUDED.status,
       sender_name = COALESCE(EXCLUDED.sender_name, yayapay_intents.sender_name),
       succeeded_at = COALESCE(EXCLUDED.succeeded_at, yayapay_intents.succeeded_at),
       metadata = COALESCE(EXCLUDED.metadata, yayapay_intents.metadata)`,
    [
      intent.id,
      tenantId ?? null,
      intent.clientReferenceId,
      customerJid ?? null,
      intent.wallet,
      intent.amount,
      intent.currency,
      intent.status,
      intent.description,
      intent.paymentLink,
      intent.qrData,
      intent.senderName,
      purpose ?? null,
      metadata ? JSON.stringify(metadata) : null,
      intent.createdAt,
      intent.expiresAt,
      intent.succeededAt,
    ],
  );
}

export function getIntent(intentId: string): Promise<YayapayIntentRow | null> {
  return queryOne<YayapayIntentRow>(
    `SELECT * FROM yayapay_intents WHERE intent_id = $1`,
    [intentId],
  );
}

export function getIntentByClientRef(clientReferenceId: string): Promise<YayapayIntentRow | null> {
  return queryOne<YayapayIntentRow>(
    `SELECT * FROM yayapay_intents
     WHERE client_reference_id = $1
     ORDER BY created_at DESC LIMIT 1`,
    [clientReferenceId],
  );
}

// Returns true if the event was newly recorded, false if it was a duplicate.
export async function recordEventIfNew(event: WebhookEvent): Promise<boolean> {
  const result = await query(
    `INSERT INTO yayapay_webhook_events (event_id, type, intent_id, payload)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (event_id) DO NOTHING`,
    [event.id, event.type, event.data.id, JSON.stringify(event)],
  );
  return (result.rowCount ?? 0) === 1;
}
