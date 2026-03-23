-- Autobot PostgreSQL schema
-- Run once: psql $DATABASE_URL -f schema.sql

-- ── Better Auth tables (must exist before app initializes auth) ──

CREATE TABLE IF NOT EXISTS "user" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  image TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  role TEXT,
  banned BOOLEAN DEFAULT false,
  "banReason" TEXT,
  "banExpires" TIMESTAMPTZ,
  "tenantId" TEXT
);

CREATE TABLE IF NOT EXISTS "session" (
  id TEXT PRIMARY KEY,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  token TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "account" (
  id TEXT PRIMARY KEY,
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "idToken" TEXT,
  "accessTokenExpiresAt" TIMESTAMPTZ,
  "refreshTokenExpiresAt" TIMESTAMPTZ,
  scope TEXT,
  password TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "verification" (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tenants
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20),
  api_key VARCHAR(64) UNIQUE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_api_key ON tenants(api_key);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);

-- Baileys auth creds (one row per tenant)
CREATE TABLE IF NOT EXISTS tenant_auth_creds (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  creds JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Baileys signal keys (pre-keys, sessions, sender-keys, etc.)
CREATE TABLE IF NOT EXISTS tenant_auth_keys (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  key_type VARCHAR(50) NOT NULL,
  key_id VARCHAR(255) NOT NULL,
  key_data JSONB NOT NULL,
  PRIMARY KEY (tenant_id, key_type, key_id)
);

-- Session health tracking
CREATE TABLE IF NOT EXISTS tenant_sessions (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  connection_status VARCHAR(20) NOT NULL DEFAULT 'disconnected',
  last_connected_at TIMESTAMPTZ,
  last_qr_at TIMESTAMPTZ,
  reconnect_attempts INT NOT NULL DEFAULT 0,
  error_message TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Message log (per tenant)
CREATE TABLE IF NOT EXISTS message_log (
  id SERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  jid TEXT NOT NULL,
  push_name TEXT,
  direction TEXT NOT NULL,
  body TEXT NOT NULL,
  matched_rule_id INT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_message_log_tenant ON message_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_message_log_timestamp ON message_log(tenant_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_message_log_channel ON message_log(tenant_id, channel);

-- Products (per tenant)
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC(12,2) NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  product_type TEXT NOT NULL DEFAULT 'physical',
  stock INT,
  image_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_tenant ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(tenant_id, active);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(tenant_id, category);

-- Customers (per tenant)
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  jid TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  location TEXT,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  address TEXT,
  notes TEXT,
  tags JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, channel, jid)
);

CREATE INDEX IF NOT EXISTS idx_customers_tenant ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_jid ON customers(tenant_id, jid);
CREATE INDEX IF NOT EXISTS idx_customers_tags ON customers USING GIN(tags);

-- Orders (per tenant)
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  delivery_type TEXT NOT NULL DEFAULT 'none',
  delivery_address TEXT,
  notes TEXT,
  reminder_count INT NOT NULL DEFAULT 0,
  last_reminder_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_tenant ON orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(tenant_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_followup
  ON orders(tenant_id, status, created_at)
  WHERE status = 'payment_requested';

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- Payments (per tenant)
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  method TEXT NOT NULL DEFAULT 'yape',
  amount NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reference TEXT,
  confirmed_at TIMESTAMPTZ,
  confirmed_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_tenant ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);

-- Refunds
CREATE TABLE IF NOT EXISTS refunds (
  id SERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  payment_id INT NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  refunded_by TEXT NOT NULL DEFAULT 'agent',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_refunds_tenant ON refunds(tenant_id);
CREATE INDEX IF NOT EXISTS idx_refunds_order ON refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(tenant_id, status);

-- Conversations (per tenant)
CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  jid TEXT NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, channel, jid)
);

CREATE INDEX IF NOT EXISTS idx_conversations_tenant ON conversations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_conversations_jid ON conversations(tenant_id, jid);

-- Settings (per tenant)
CREATE TABLE IF NOT EXISTS settings (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, key)
);

-- Token usage tracking (per tenant, per AI call)
CREATE TABLE IF NOT EXISTS token_usage (
  id SERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  model TEXT NOT NULL,
  prompt_tokens INT NOT NULL DEFAULT 0,
  completion_tokens INT NOT NULL DEFAULT 0,
  total_tokens INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_token_usage_tenant ON token_usage(tenant_id);
CREATE INDEX IF NOT EXISTS idx_token_usage_created ON token_usage(tenant_id, created_at DESC);

-- Devices (Yaya mobile app registrations)
CREATE TABLE IF NOT EXISTS devices (
  id SERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  device_id VARCHAR(255) UNIQUE NOT NULL,
  business_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  token VARCHAR(128) UNIQUE NOT NULL,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_devices_tenant ON devices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_devices_token ON devices(token);

-- Yape notifications (synced from mobile devices)
CREATE TABLE IF NOT EXISTS yape_notifications (
  id SERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  device_id INT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  sender_name VARCHAR(255) NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL,
  notification_hash VARCHAR(64) UNIQUE NOT NULL,
  matched_payment_id INT REFERENCES payments(id),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_yape_notif_tenant ON yape_notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_yape_notif_hash ON yape_notifications(notification_hash);
CREATE INDEX IF NOT EXISTS idx_yape_notif_status ON yape_notifications(tenant_id, status);

-- Mobile users (phone-based auth for mobile app)
-- phone stores the full E.164 number (e.g. "+51999888777")
CREATE TABLE IF NOT EXISTS mobile_users (
  id SERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  phone VARCHAR(20) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mobile_users_phone ON mobile_users(phone);
CREATE INDEX IF NOT EXISTS idx_mobile_users_tenant ON mobile_users(tenant_id);

-- Appointments (service businesses — dentists, salons, consultancies)
CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'pending',
  reminder_sent BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointments_tenant ON appointments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled ON appointments(tenant_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_customer ON appointments(tenant_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_appointments_reminder
  ON appointments(tenant_id, reminder_sent, scheduled_at)
  WHERE status NOT IN ('cancelled', 'completed', 'no_show') AND reminder_sent = false;

-- Riders (delivery businesses — food delivery, courier services)
CREATE TABLE IF NOT EXISTS riders (
  id SERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp_jid TEXT,
  status TEXT NOT NULL DEFAULT 'available',
  current_lat DOUBLE PRECISION,
  current_lng DOUBLE PRECISION,
  location_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_riders_tenant ON riders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_riders_status ON riders(tenant_id, status);

-- Delivery assignments (links orders to riders)
CREATE TABLE IF NOT EXISTS delivery_assignments (
  id SERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  rider_id INT NOT NULL REFERENCES riders(id),
  status TEXT NOT NULL DEFAULT 'assigned',
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_delivery_tenant ON delivery_assignments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_delivery_order ON delivery_assignments(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_rider ON delivery_assignments(rider_id);
CREATE INDEX IF NOT EXISTS idx_delivery_status ON delivery_assignments(tenant_id, status);

-- AI paused contacts (merchant manual takeover)
CREATE TABLE IF NOT EXISTS ai_paused_contacts (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  jid TEXT NOT NULL,
  paused_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, jid)
);

-- Agent evaluations (AI performance tracking)
CREATE TABLE IF NOT EXISTS agent_evaluations (
  id SERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  jid TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  tools_used TEXT[] NOT NULL DEFAULT '{}',
  agent_steps INT NOT NULL DEFAULT 0,
  conversion BOOLEAN DEFAULT NULL,
  duration_ms INT NOT NULL DEFAULT 0,
  prompt_variant TEXT DEFAULT 'default',
  user_message TEXT,
  agent_reply TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_evaluations_tenant ON agent_evaluations(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_evaluations_variant ON agent_evaluations(tenant_id, prompt_variant);

-- Rules (auto-reply pattern matching)
CREATE TABLE IF NOT EXISTS rules (
  id SERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  pattern TEXT NOT NULL,
  match_type TEXT NOT NULL DEFAULT 'contains',
  reply TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'all',
  scope_jid TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  priority INT NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rules_tenant ON rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rules_enabled_priority ON rules(tenant_id, enabled, priority);

-- Conversation read tracking (unread counts)
CREATE TABLE IF NOT EXISTS conversation_reads (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  jid TEXT NOT NULL,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, jid)
);

CREATE INDEX IF NOT EXISTS idx_conversation_reads_tenant ON conversation_reads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_conversation_reads_jid ON conversation_reads(tenant_id, jid);

-- Tenant admin settings (owner detection + admin agent config)
CREATE TABLE IF NOT EXISTS tenant_admin_settings (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  owner_jid TEXT,
  admin_agent_enabled BOOLEAN NOT NULL DEFAULT true,
  auto_detect_owner BOOLEAN NOT NULL DEFAULT true,
  welcome_message_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Business context (AI agent configuration per tenant)
CREATE TABLE IF NOT EXISTS business_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  business_name TEXT,
  business_description TEXT,
  business_type TEXT,
  operating_hours JSONB NOT NULL DEFAULT '{}',
  services_offered TEXT[] NOT NULL DEFAULT '{}',
  products_categories TEXT[] NOT NULL DEFAULT '{}',
  tone_of_voice TEXT NOT NULL DEFAULT 'friendly',
  special_instructions TEXT,
  admin_conversation_context TEXT,
  admin_configuration_summary TEXT,
  context_version INT NOT NULL DEFAULT 1,
  last_updated_by TEXT,
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Admin conversations (owner ↔ admin agent chat history)
CREATE TABLE IF NOT EXISTS admin_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  message TEXT NOT NULL,
  direction TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'chat',
  extracted_config JSONB NOT NULL DEFAULT '{}',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_conv_tenant_session
  ON admin_conversations(tenant_id, session_id, timestamp DESC);

-- AI usage tracking (token/cost analytics)
CREATE TABLE IF NOT EXISTS ai_usage_events (
  id UUID PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id INTEGER,
  capability VARCHAR(50) NOT NULL,
  model VARCHAR(100) NOT NULL,
  request_type VARCHAR(50) NOT NULL,
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  input_cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
  output_cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
  total_cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
  latency_ms INTEGER NOT NULL,
  success BOOLEAN NOT NULL,
  error_type VARCHAR(100),
  media_count INTEGER DEFAULT 0,
  media_types TEXT[],
  total_media_size_bytes BIGINT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_tenant ON ai_usage_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_timestamp ON ai_usage_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_ai_usage_capability ON ai_usage_events(capability);
CREATE INDEX IF NOT EXISTS idx_ai_usage_model ON ai_usage_events(model);
CREATE INDEX IF NOT EXISTS idx_ai_usage_tenant_date ON ai_usage_events(tenant_id, timestamp);

-- Leads (per tenant — pre-sales contacts, separate from customers)
CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  jid TEXT NOT NULL,
  name TEXT,
  company TEXT,
  email TEXT,
  phone TEXT,
  interest TEXT,
  source TEXT NOT NULL DEFAULT 'whatsapp',
  status TEXT NOT NULL DEFAULT 'new',
  qualification_score INT,
  qualification_notes TEXT,
  notes TEXT,
  tags JSONB NOT NULL DEFAULT '[]',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, channel, jid)
);

CREATE INDEX IF NOT EXISTS idx_leads_tenant ON leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_jid ON leads(tenant_id, jid);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(tenant_id, qualification_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(tenant_id, source);
CREATE INDEX IF NOT EXISTS idx_leads_tags ON leads USING GIN(tags);

-- Website leads (public contact form — not tenant-scoped)
CREATE TABLE IF NOT EXISTS website_leads (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  business TEXT,
  message TEXT,
  source TEXT NOT NULL DEFAULT 'website',
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_website_leads_status ON website_leads(status);
CREATE INDEX IF NOT EXISTS idx_website_leads_created ON website_leads(created_at DESC);

-- ── Data integrity constraints ──
DO $$ BEGIN
  ALTER TABLE products ADD CONSTRAINT chk_products_price CHECK (price >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE products ADD CONSTRAINT chk_products_stock CHECK (stock >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tenant service accounts (SSO mappings to external services)
CREATE TABLE IF NOT EXISTS tenant_service_accounts (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  service TEXT NOT NULL,  -- 'lago', 'calcom', 'metabase'
  external_id TEXT NOT NULL,
  external_email TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (tenant_id, service)
);

CREATE INDEX IF NOT EXISTS idx_tenant_service_accounts_service ON tenant_service_accounts(service);

-- ── Performance indices for common tenant-scoped queries ──
CREATE INDEX IF NOT EXISTS idx_orders_tenant_created ON orders(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_tenant_created ON customers(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_tenant_updated ON customers(tenant_id, updated_at DESC);
