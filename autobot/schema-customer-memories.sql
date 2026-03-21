CREATE TABLE IF NOT EXISTS customer_memories (
  id            SERIAL PRIMARY KEY,
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id   INT  REFERENCES customers(id) ON DELETE CASCADE,
  channel       TEXT NOT NULL DEFAULT 'whatsapp',
  jid           TEXT NOT NULL,
  memory_type   TEXT NOT NULL DEFAULT 'fact',
  -- Values: 'preference' | 'fact' | 'personality' | 'purchase_pattern' | 'family' | 'objection'
  content       TEXT NOT NULL,
  importance    INT  NOT NULL DEFAULT 5 CHECK (importance BETWEEN 1 AND 10),
  source        TEXT NOT NULL DEFAULT 'agent',
  -- Values: 'agent' | 'manual' | 'order_history'
  confirmed     BOOLEAN NOT NULL DEFAULT false,
  last_used_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_memories_lookup
  ON customer_memories(tenant_id, jid, channel);

CREATE INDEX IF NOT EXISTS idx_customer_memories_importance
  ON customer_memories(tenant_id, customer_id, importance DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_memories_dedup
  ON customer_memories(tenant_id, jid, content);
