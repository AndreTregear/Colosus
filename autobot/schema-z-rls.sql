-- Row-Level Security (RLS) for per-tenant data isolation
-- Run after schema.sql + all schema-*.sql files (alphabetically sorted, so "rls" > "customer-memories")
--
-- HOW IT WORKS:
--   1. Each tenant gets a dedicated PostgreSQL ROLE via create_tenant_role(tenant_id).
--   2. That role has ALTER ROLE ... SET app.tenant_id = '<uuid>' baked in.
--   3. Every table with tenant_id has a policy: row visible iff tenant_id matches current_setting('app.tenant_id').
--   4. Even raw SQL from the OpenClaw agent sandbox can't read another tenant's data.
--
-- IMPORTANT: The superuser / app pool user is NOT subject to RLS (table owners bypass policies).
-- Only the per-tenant roles created by create_tenant_role() are restricted.

-- ═══════════════════════════════════════════════════════════════
-- 1. Enable RLS on all tenant-scoped tables
-- ═══════════════════════════════════════════════════════════════

-- Core business tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Messaging & conversations
ALTER TABLE message_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_paused_contacts ENABLE ROW LEVEL SECURITY;

-- AI & analytics
ALTER TABLE business_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_memories ENABLE ROW LEVEL SECURITY;

-- Settings & rules
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;

-- Devices & mobile
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE yape_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE mobile_users ENABLE ROW LEVEL SECURITY;

-- Admin
ALTER TABLE admin_conversations ENABLE ROW LEVEL SECURITY;

-- Subscriptions (tenant-scoped)
ALTER TABLE tenant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

-- Warehouse (tenant-scoped dimensions & facts)
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_encryption_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE wh_dim_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE wh_fact_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wh_fact_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wh_fact_ai_sessions ENABLE ROW LEVEL SECURITY;

-- Internal tables — RLS enabled but tenant roles get NO GRANT access
ALTER TABLE tenant_auth_creds ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_auth_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_service_accounts ENABLE ROW LEVEL SECURITY;

-- Tenant master table — filter by id (not tenant_id)
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════
-- 2. Create RLS policies (idempotent: DROP IF EXISTS + CREATE)
-- ═══════════════════════════════════════════════════════════════

-- Helper: create a standard tenant isolation policy.
-- Uses current_setting('app.tenant_id', true) which returns NULL if unset (no error).
-- The second arg `true` means "return NULL on missing" — so unset = no rows visible.

DO $rls$
DECLARE
  -- Tables where the isolation column is `tenant_id`
  tenant_tables TEXT[] := ARRAY[
    'products', 'customers', 'orders', 'payments', 'refunds',
    'appointments', 'riders', 'delivery_assignments', 'leads',
    'message_log', 'conversations', 'conversation_reads', 'ai_paused_contacts',
    'business_context', 'agent_evaluations', 'ai_usage_events', 'token_usage',
    'customer_memories', 'settings', 'rules',
    'devices', 'yape_notifications', 'mobile_users',
    'admin_conversations',
    'tenant_subscriptions', 'creator_plans', 'customer_subscriptions', 'subscription_payments',
    'media_assets', 'tenant_encryption_keys',
    'wh_dim_customers', 'wh_fact_interactions', 'wh_fact_transactions', 'wh_fact_ai_sessions',
    'tenant_auth_creds', 'tenant_auth_keys', 'tenant_sessions',
    'tenant_admin_settings', 'tenant_service_accounts'
  ];
  tbl TEXT;
  pol_name TEXT;
BEGIN
  FOREACH tbl IN ARRAY tenant_tables LOOP
    pol_name := 'tenant_isolation_' || tbl;
    -- Drop existing policy if any (idempotent)
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol_name, tbl);
    -- Create policy: all operations (SELECT, INSERT, UPDATE, DELETE)
    EXECUTE format(
      'CREATE POLICY %I ON %I USING (tenant_id::text = current_setting(''app.tenant_id'', true))',
      pol_name, tbl
    );
  END LOOP;
END
$rls$;

-- Special policy for `tenants` table (uses `id` not `tenant_id`)
DROP POLICY IF EXISTS tenant_isolation_tenants ON tenants;
CREATE POLICY tenant_isolation_tenants ON tenants
  USING (id::text = current_setting('app.tenant_id', true));

-- Special policy for `order_items` (no tenant_id — isolate via orders FK)
DROP POLICY IF EXISTS tenant_isolation_order_items ON order_items;
CREATE POLICY tenant_isolation_order_items ON order_items
  USING (order_id IN (
    SELECT id FROM orders WHERE tenant_id::text = current_setting('app.tenant_id', true)
  ));

-- ═══════════════════════════════════════════════════════════════
-- 3. Function to create a scoped PostgreSQL role per tenant
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION create_tenant_role(tid UUID)
RETURNS TABLE(role_name TEXT, role_password TEXT) AS $$
DECLARE
  rname TEXT := 'tenant_' || replace(tid::text, '-', '_');
  rpass TEXT := encode(gen_random_bytes(24), 'hex');
  db_name TEXT := current_database();
BEGIN
  -- Create role if it doesn't already exist
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = rname) THEN
    EXECUTE format('CREATE ROLE %I WITH LOGIN PASSWORD %L', rname, rpass);
  ELSE
    -- Role exists — rotate password
    EXECUTE format('ALTER ROLE %I WITH PASSWORD %L', rname, rpass);
  END IF;

  -- Grant connectivity & schema access
  EXECUTE format('GRANT CONNECT ON DATABASE %I TO %I', db_name, rname);
  EXECUTE format('GRANT USAGE ON SCHEMA public TO %I', rname);

  -- Grant DML on business tables (NOT internal auth tables)
  EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON
    products, customers, orders, order_items, payments, refunds,
    appointments, riders, delivery_assignments, leads,
    message_log, conversations, conversation_reads, ai_paused_contacts,
    business_context, agent_evaluations, ai_usage_events, token_usage,
    customer_memories, settings, rules,
    devices, yape_notifications, mobile_users,
    admin_conversations,
    tenant_subscriptions, creator_plans, customer_subscriptions, subscription_payments,
    media_assets, tenant_encryption_keys,
    wh_dim_customers, wh_fact_interactions, wh_fact_transactions, wh_fact_ai_sessions
    TO %I', rname);

  -- Read-only access to reference tables
  EXECUTE format('GRANT SELECT ON tenants, platform_plans, wh_dim_time TO %I', rname);

  -- Sequence usage (for SERIAL inserts)
  EXECUTE format('GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO %I', rname);

  -- Ensure future tables in public also get sequence grants
  EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE ON SEQUENCES TO %I', rname);

  -- Bake the tenant_id into the role so every connection auto-sets it
  EXECUTE format('ALTER ROLE %I SET app.tenant_id = %L', rname, tid::text);

  role_name := rname;
  role_password := rpass;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only superuser / app owner should call this function
REVOKE ALL ON FUNCTION create_tenant_role(UUID) FROM PUBLIC;
