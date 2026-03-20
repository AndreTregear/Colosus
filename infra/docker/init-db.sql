-- Yaya Platform — Multi-database initialization
-- This script runs once when the postgres container is first created.
-- It creates separate databases and users for each service.

-- ── Lago Billing Database ────────────────────────────
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'lago') THEN
        CREATE ROLE lago WITH LOGIN PASSWORD 'lago_s3cur3';
    END IF;
END
$$;

CREATE DATABASE lago_db OWNER lago;

GRANT ALL PRIVILEGES ON DATABASE lago_db TO lago;

-- ── Atomic CRM Database ─────────────────────────────
-- Note: CRM uses its own Supabase postgres instance (supabase-db).
-- This entry is for any shared CRM data that needs to live in the main PG.
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'crm') THEN
        CREATE ROLE crm WITH LOGIN PASSWORD 'crm_s3cur3';
    END IF;
END
$$;

CREATE DATABASE crm_db OWNER crm;

GRANT ALL PRIVILEGES ON DATABASE crm_db TO crm;

-- ── Extensions for main yaya database ────────────────
-- Connect back to the default yaya database for extensions
\c yaya;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ── Schema for agent workspace ───────────────────────
CREATE SCHEMA IF NOT EXISTS agent;

CREATE TABLE IF NOT EXISTS agent.conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    channel TEXT NOT NULL,               -- whatsapp, telegram
    remote_id TEXT NOT NULL,             -- phone number or chat id
    business_id TEXT NOT NULL,
    started_at TIMESTAMPTZ DEFAULT now(),
    last_message_at TIMESTAMPTZ DEFAULT now(),
    metadata JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS agent.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID REFERENCES agent.conversations(id),
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    tool_calls JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent.payment_validations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id TEXT NOT NULL,
    method TEXT NOT NULL,                -- yape, plin, nequi, bank_transfer
    amount NUMERIC(12,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'PEN',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
    proof_url TEXT,                      -- minio path to screenshot
    validated_by TEXT,                   -- owner phone or 'auto'
    created_at TIMESTAMPTZ DEFAULT now(),
    validated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_conversations_remote ON agent.conversations(remote_id, business_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON agent.messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_payments_order ON agent.payment_validations(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON agent.payment_validations(status);

-- ── Lago database extensions ─────────────────────────
\c lago_db;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── CRM database extensions ─────────────────────────
\c crm_db;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
