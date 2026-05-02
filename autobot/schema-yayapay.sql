-- yaya_pay payment intents — agent-driven onboarding & one-off charges.
-- The phone is authoritative for status; this table is our local cache + audit
-- trail and powers idempotency for incoming webhook deliveries.

CREATE TABLE IF NOT EXISTS yayapay_intents (
  intent_id TEXT PRIMARY KEY,                         -- pi_... from yaya_pay
  tenant_id UUID,                                     -- nullable: pre-onboarding leads have no tenant yet
  client_reference_id TEXT,                           -- our domain id; for onboarding = customer JID
  customer_jid TEXT,                                  -- denormalised for fast lookup from WhatsApp side
  wallet TEXT NOT NULL,
  amount INT NOT NULL,                                -- smallest unit (centimos)
  currency TEXT NOT NULL,
  status TEXT NOT NULL,                               -- created | succeeded | canceled | expired | failed
  description TEXT,
  payment_link TEXT,
  qr_data TEXT,
  sender_name TEXT,
  purpose TEXT,                                       -- "onboarding" | "subscription" | "ad-hoc" | ...
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  succeeded_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_yayapay_intents_tenant ON yayapay_intents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_yayapay_intents_jid ON yayapay_intents(customer_jid);
CREATE INDEX IF NOT EXISTS idx_yayapay_intents_clientref ON yayapay_intents(client_reference_id);
CREATE INDEX IF NOT EXISTS idx_yayapay_intents_status ON yayapay_intents(status);

-- Webhook event ledger — every event id we've processed. Pure idempotency
-- table: yaya_pay retries with exponential backoff on non-2xx, and we want
-- to acknowledge duplicates without re-running side effects.
CREATE TABLE IF NOT EXISTS yayapay_webhook_events (
  event_id TEXT PRIMARY KEY,                          -- evt_...
  type TEXT NOT NULL,
  intent_id TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_yayapay_events_intent ON yayapay_webhook_events(intent_id);
