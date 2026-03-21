-- Yaya Platform — Unified Business Schema
-- All tables used by postgres-mcp and crm-mcp servers.
-- Run against the main 'yaya' database after init-db.sql.

-- ── Extensions ──────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ── Schema ──────────────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS business;

-- ══════════════════════════════════════════════════════════
-- CONTACTS
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS business.contacts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT,
    phone TEXT,
    email TEXT,
    company TEXT,
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    source TEXT,                           -- whatsapp, website, referral, walk_in
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contacts_phone ON business.contacts(phone);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON business.contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_name_trgm ON business.contacts USING gin (
    (coalesce(first_name, '') || ' ' || coalesce(last_name, '')) gin_trgm_ops
);
CREATE INDEX IF NOT EXISTS idx_contacts_tags ON business.contacts USING gin (tags);
CREATE INDEX IF NOT EXISTS idx_contacts_created ON business.contacts(created_at);

-- ══════════════════════════════════════════════════════════
-- INTERACTIONS
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS business.interactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    contact_id UUID NOT NULL REFERENCES business.contacts(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN (
        'call', 'message', 'email', 'purchase', 'complaint',
        'visit', 'note', 'appointment', 'payment', 'refund'
    )),
    summary TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_interactions_contact ON business.interactions(contact_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_type ON business.interactions(type);

-- ══════════════════════════════════════════════════════════
-- DEALS (sales pipeline)
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS business.deals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    contact_id UUID NOT NULL REFERENCES business.contacts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    stage TEXT NOT NULL DEFAULT 'lead' CHECK (stage IN (
        'lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'
    )),
    amount NUMERIC(12,2),
    currency TEXT DEFAULT 'PEN',
    notes TEXT,
    expected_close_date DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deals_contact ON business.deals(contact_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON business.deals(stage);

-- ══════════════════════════════════════════════════════════
-- APPOINTMENTS
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS business.services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    duration_minutes INT NOT NULL DEFAULT 60,
    price NUMERIC(10,2),
    currency TEXT DEFAULT 'PEN',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS business.providers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS business.provider_schedules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    provider_id UUID NOT NULL REFERENCES business.providers(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),  -- 0=Monday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    UNIQUE(provider_id, day_of_week)
);

CREATE TABLE IF NOT EXISTS business.appointments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    contact_id UUID REFERENCES business.contacts(id) ON DELETE SET NULL,
    provider_id UUID REFERENCES business.providers(id) ON DELETE SET NULL,
    service_id UUID REFERENCES business.services(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN (
        'scheduled', 'confirmed', 'in_progress', 'completed',
        'cancelled', 'no_show'
    )),
    notes TEXT,
    deposit_amount NUMERIC(10,2),
    deposit_status TEXT DEFAULT 'none' CHECK (deposit_status IN (
        'none', 'pending', 'paid', 'refunded'
    )),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointments_contact ON business.appointments(contact_id);
CREATE INDEX IF NOT EXISTS idx_appointments_provider ON business.appointments(provider_id);
CREATE INDEX IF NOT EXISTS idx_appointments_time ON business.appointments(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON business.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_phone ON business.appointments(customer_phone);

-- ══════════════════════════════════════════════════════════
-- EXPENSES (yaya-expenses)
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS business.expense_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS business.expenses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    category_id UUID REFERENCES business.expense_categories(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    currency TEXT DEFAULT 'PEN',
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    vendor TEXT,
    receipt_url TEXT,
    payment_method TEXT,                   -- cash, yape, plin, bank_transfer, card
    notes TEXT,
    created_by TEXT,                       -- phone or user id
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON business.expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON business.expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_vendor ON business.expenses(vendor);

-- ══════════════════════════════════════════════════════════
-- FIADOS (credit/tab tracking — yaya-fiados)
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS business.fiados (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    contact_id UUID REFERENCES business.contacts(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    description TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    currency TEXT DEFAULT 'PEN',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'partial', 'paid', 'forgiven', 'overdue'
    )),
    amount_paid NUMERIC(12,2) DEFAULT 0,
    due_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fiados_contact ON business.fiados(contact_id);
CREATE INDEX IF NOT EXISTS idx_fiados_status ON business.fiados(status);
CREATE INDEX IF NOT EXISTS idx_fiados_phone ON business.fiados(customer_phone);
CREATE INDEX IF NOT EXISTS idx_fiados_due ON business.fiados(due_date);

CREATE TABLE IF NOT EXISTS business.fiado_payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    fiado_id UUID NOT NULL REFERENCES business.fiados(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL,
    payment_method TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fiado_payments_fiado ON business.fiado_payments(fiado_id);

-- ══════════════════════════════════════════════════════════
-- PAYMENT VALIDATIONS (from agent schema, shared reference)
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS business.payment_validations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id TEXT NOT NULL,
    contact_id UUID REFERENCES business.contacts(id) ON DELETE SET NULL,
    method TEXT NOT NULL,                  -- yape, plin, nequi, bank_transfer
    amount NUMERIC(12,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'PEN',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'confirmed', 'rejected'
    )),
    proof_url TEXT,
    validated_by TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    validated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pv_order ON business.payment_validations(order_id);
CREATE INDEX IF NOT EXISTS idx_pv_status ON business.payment_validations(status);
CREATE INDEX IF NOT EXISTS idx_pv_contact ON business.payment_validations(contact_id);

-- ══════════════════════════════════════════════════════════
-- UPDATED_AT TRIGGER
-- ══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION business.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN
        SELECT unnest(ARRAY[
            'contacts', 'deals', 'appointments',
            'expenses', 'fiados'
        ])
    LOOP
        EXECUTE format(
            'DROP TRIGGER IF EXISTS trg_updated_at ON business.%I; '
            'CREATE TRIGGER trg_updated_at BEFORE UPDATE ON business.%I '
            'FOR EACH ROW EXECUTE FUNCTION business.set_updated_at();',
            t, t
        );
    END LOOP;
END;
$$;

-- ══════════════════════════════════════════════════════════
-- SEED: Default expense categories
-- ══════════════════════════════════════════════════════════
INSERT INTO business.expense_categories (name, description) VALUES
    ('inventory',     'Compra de inventario y productos'),
    ('rent',          'Alquiler del local'),
    ('utilities',     'Agua, luz, internet, teléfono'),
    ('payroll',       'Sueldos y salarios'),
    ('marketing',     'Publicidad y marketing'),
    ('supplies',      'Materiales y suministros'),
    ('transport',     'Transporte y envíos'),
    ('taxes',         'Impuestos y contribuciones'),
    ('maintenance',   'Mantenimiento y reparaciones'),
    ('other',         'Otros gastos')
ON CONFLICT (name) DO NOTHING;
