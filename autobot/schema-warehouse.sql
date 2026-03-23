-- Autobot Data Warehouse + Media Server schema
-- Run after schema.sql: psql $DATABASE_URL -f schema-warehouse.sql

-- ═══════════════════════════════════════════════
-- Encryption Keys (client-held encryption)
-- ═══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS tenant_encryption_keys (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  encrypted_dek BYTEA NOT NULL,
  dek_salt BYTEA NOT NULL,
  dek_nonce BYTEA NOT NULL,
  key_version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  rotated_at TIMESTAMPTZ
);

-- ═══════════════════════════════════════════════
-- Media Assets (shared between media server + warehouse)
-- ═══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  original_key TEXT NOT NULL,
  processed_key TEXT,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  duration_ms INT,
  width INT,
  height INT,
  thumbnail_key TEXT,
  transcription TEXT,
  processing_status TEXT NOT NULL DEFAULT 'pending',
  metadata JSONB NOT NULL DEFAULT '{}',
  encryption_tenant_id UUID REFERENCES tenant_encryption_keys(tenant_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_assets_tenant ON media_assets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_category ON media_assets(tenant_id, category);
CREATE INDEX IF NOT EXISTS idx_media_assets_status ON media_assets(processing_status);
CREATE INDEX IF NOT EXISTS idx_media_assets_created ON media_assets(tenant_id, created_at DESC);

-- ═══════════════════════════════════════════════
-- Dimension Tables
-- ═══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS wh_dim_time (
  date DATE PRIMARY KEY,
  year INT NOT NULL,
  quarter INT NOT NULL,
  month INT NOT NULL,
  week INT NOT NULL,
  day_of_week INT NOT NULL,
  is_weekend BOOLEAN NOT NULL
);

CREATE TABLE IF NOT EXISTS wh_dim_customers (
  id SERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL,
  customer_id INT NOT NULL,
  first_seen_at TIMESTAMPTZ,
  total_orders INT NOT NULL DEFAULT 0,
  total_spent NUMERIC(12,2) NOT NULL DEFAULT 0,
  avg_response_time_ms INT,
  preferred_channel TEXT,
  tags TEXT[],
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, customer_id)
);

CREATE INDEX IF NOT EXISTS idx_wh_dim_customers_tenant ON wh_dim_customers(tenant_id);

-- ═══════════════════════════════════════════════
-- Fact Tables (partitioned by created_at)
-- ═══════════════════════════════════════════════

-- Interactions: messages, AI responses, media exchanges
CREATE TABLE IF NOT EXISTS wh_fact_interactions (
  id BIGSERIAL,
  tenant_id UUID NOT NULL,
  customer_id INT,
  channel TEXT NOT NULL,
  interaction_type TEXT NOT NULL,
  content_hash VARCHAR(64),
  media_asset_id UUID,
  token_count INT,
  response_time_ms INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE INDEX IF NOT EXISTS idx_wh_interactions_tenant ON wh_fact_interactions(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wh_interactions_type ON wh_fact_interactions(tenant_id, interaction_type);

-- Transactions: orders + payments (anonymized aggregates)
CREATE TABLE IF NOT EXISTS wh_fact_transactions (
  id BIGSERIAL,
  tenant_id UUID NOT NULL,
  order_id INT,
  item_count INT,
  total_amount NUMERIC(12,2),
  payment_method TEXT,
  payment_status TEXT,
  order_status TEXT,
  fulfilled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE INDEX IF NOT EXISTS idx_wh_transactions_tenant ON wh_fact_transactions(tenant_id, created_at DESC);

-- AI session performance tracking
CREATE TABLE IF NOT EXISTS wh_fact_ai_sessions (
  id BIGSERIAL,
  tenant_id UUID NOT NULL,
  customer_id INT,
  session_start TIMESTAMPTZ,
  session_end TIMESTAMPTZ,
  message_count INT,
  tools_used TEXT[],
  outcome TEXT,
  total_tokens INT,
  model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE INDEX IF NOT EXISTS idx_wh_ai_sessions_tenant ON wh_fact_ai_sessions(tenant_id, created_at DESC);

-- ═══════════════════════════════════════════════
-- ETL Checkpoints
-- ═══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS wh_etl_checkpoints (
  source_table TEXT PRIMARY KEY,
  last_id BIGINT NOT NULL DEFAULT 0,
  last_timestamp TIMESTAMPTZ,
  rows_processed BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════
-- Materialized Views (created after initial data load)
-- ═══════════════════════════════════════════════

-- Daily message volume per tenant
CREATE MATERIALIZED VIEW IF NOT EXISTS wh_mv_daily_volume AS
SELECT
  tenant_id,
  date_trunc('day', created_at) AS day,
  interaction_type,
  COUNT(*) AS count
FROM wh_fact_interactions
GROUP BY tenant_id, day, interaction_type;

CREATE UNIQUE INDEX IF NOT EXISTS idx_wh_mv_daily_volume
  ON wh_mv_daily_volume(tenant_id, day, interaction_type);

-- Customer lifetime value
CREATE MATERIALIZED VIEW IF NOT EXISTS wh_mv_customer_ltv AS
SELECT
  tenant_id,
  order_id,
  COUNT(*) AS order_count,
  SUM(total_amount) AS lifetime_value,
  AVG(total_amount) AS avg_order_value
FROM wh_fact_transactions
GROUP BY tenant_id, order_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_wh_mv_customer_ltv
  ON wh_mv_customer_ltv(tenant_id, order_id);
