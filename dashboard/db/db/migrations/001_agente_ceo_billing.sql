-- agente.ceo billing schema
-- Idempotent. Safe to re-run.
--
-- Lives in the shared yaya_business postgres so we can cross-reference
-- Better Auth's user table without a federation layer.

CREATE TABLE IF NOT EXISTS agente_ceo_subscriptions (
  user_id            TEXT PRIMARY KEY,
  status             TEXT NOT NULL DEFAULT 'inactive'
                       CHECK (status IN ('inactive', 'pending', 'active', 'past_due', 'canceled')),
  plan               TEXT NOT NULL DEFAULT 'monthly',
  current_period_end TIMESTAMPTZ,
  yaya_intent_id     TEXT,
  amount_cents       BIGINT,
  currency           TEXT NOT NULL DEFAULT 'PEN',
  boleta_serie       TEXT,
  boleta_numero      INTEGER,
  boleta_pdf_url     TEXT,
  boleta_xml_url     TEXT,
  boleta_hash        TEXT,
  boleta_aceptada    BOOLEAN,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agente_ceo_subs_intent
  ON agente_ceo_subscriptions (yaya_intent_id);
CREATE INDEX IF NOT EXISTS idx_agente_ceo_subs_status
  ON agente_ceo_subscriptions (status, current_period_end);

-- Webhook event ledger — for replay protection and idempotency.
-- Every yayapay webhook is recorded here exactly once (intent_id + event_type).
CREATE TABLE IF NOT EXISTS agente_ceo_webhook_events (
  intent_id     TEXT NOT NULL,
  event_type    TEXT NOT NULL,
  received_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload       JSONB NOT NULL,
  PRIMARY KEY (intent_id, event_type)
);

-- Boletas issued, separate from subscriptions so we can issue more than
-- one per subscription (renewals, retries) and audit them independently.
CREATE TABLE IF NOT EXISTS agente_ceo_boletas (
  id              BIGSERIAL PRIMARY KEY,
  user_id         TEXT NOT NULL,
  intent_id       TEXT NOT NULL UNIQUE,
  serie           TEXT NOT NULL,
  numero          INTEGER NOT NULL,
  amount_cents    BIGINT NOT NULL,
  currency        TEXT NOT NULL,
  pdf_url         TEXT,
  xml_url         TEXT,
  hash            TEXT,
  aceptada        BOOLEAN,
  sunat_message   TEXT,
  raw_response    JSONB,
  issued_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_boletas_user ON agente_ceo_boletas (user_id, issued_at DESC);
