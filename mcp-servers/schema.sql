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
            'expenses', 'fiados', 'suppliers',
            'supplier_products', 'purchase_orders', 'reorder_points'
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

-- ══════════════════════════════════════════════════════════
-- LEDGER ENTRIES (yaya-ledger: simplified daily sales tracking)
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS business.ledger_entries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID,  -- NULL for single-business setups; FK if multi-tenant
    entry_type TEXT NOT NULL CHECK (entry_type IN (
        'sale', 'batch_sale', 'day_total',
        'cash_out', 'cash_in',
        'opening', 'closing', 'adjustment'
    )),
    amount NUMERIC(12,2) NOT NULL,
    payment_method TEXT DEFAULT 'efectivo' CHECK (payment_method IN (
        'efectivo', 'yape', 'plin', 'transferencia', 'tarjeta', 'mixto', 'fiado'
    )),
    items JSONB,            -- [{"name":"arroz","qty":3,"price":3.50}, ...]
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    business_date DATE NOT NULL DEFAULT CURRENT_DATE,
    source TEXT DEFAULT 'chat' CHECK (source IN ('chat', 'voice', 'photo', 'cron', 'api')),
    raw_message TEXT,
    confidence NUMERIC(3,2) DEFAULT 1.00,
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_ledger_biz_date ON business.ledger_entries(business_id, business_date);
CREATE INDEX IF NOT EXISTS idx_ledger_type ON business.ledger_entries(entry_type);
CREATE INDEX IF NOT EXISTS idx_ledger_date ON business.ledger_entries(business_date);

-- ══════════════════════════════════════════════════════════
-- DAILY SUMMARIES (pre-computed for fast lookups)
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS business.daily_summaries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID,
    business_date DATE NOT NULL,
    total_sales NUMERIC(12,2) DEFAULT 0,
    total_efectivo NUMERIC(12,2) DEFAULT 0,
    total_yape NUMERIC(12,2) DEFAULT 0,
    total_plin NUMERIC(12,2) DEFAULT 0,
    total_other_digital NUMERIC(12,2) DEFAULT 0,
    total_fiado NUMERIC(12,2) DEFAULT 0,
    transaction_count INTEGER DEFAULT 0,
    opening_balance NUMERIC(12,2),
    closing_balance NUMERIC(12,2),
    expected_cash NUMERIC(12,2),
    cash_difference NUMERIC(12,2),
    cash_outs NUMERIC(12,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(business_id, business_date)
);

CREATE INDEX IF NOT EXISTS idx_summary_biz_date ON business.daily_summaries(business_id, business_date);

-- ══════════════════════════════════════════════════════════
-- SUPPLIERS (yaya-suppliers: supplier & procurement management)
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS business.suppliers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    contact_id UUID REFERENCES business.contacts(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    phone TEXT,
    whatsapp TEXT,
    address TEXT,
    category TEXT CHECK (category IN (
        'distribuidor', 'mayorista', 'fabricante',
        'mercado', 'importador', 'artesano', 'otro'
    )),
    payment_terms TEXT DEFAULT 'contado' CHECK (payment_terms IN (
        'contado', 'credito_7', 'credito_15', 'credito_30',
        'credito_60', 'consignacion', 'mixto'
    )),
    credit_limit NUMERIC(12,2),
    delivery_days TEXT[],
    lead_time_days INTEGER DEFAULT 1,
    minimum_order NUMERIC(12,2),
    notes TEXT,
    rating NUMERIC(3,2) DEFAULT 5.0,
    is_active BOOLEAN DEFAULT TRUE,
    deactivated_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_contact ON business.suppliers(contact_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_category ON business.suppliers(category);
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON business.suppliers(is_active);
CREATE INDEX IF NOT EXISTS idx_suppliers_name_trgm ON business.suppliers USING gin (name gin_trgm_ops);

-- SUPPLIER PRODUCTS
CREATE TABLE IF NOT EXISTS business.supplier_products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    supplier_id UUID NOT NULL REFERENCES business.suppliers(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    product_code TEXT,
    unit TEXT DEFAULT 'unidad',
    current_price NUMERIC(12,2),
    currency TEXT DEFAULT 'PEN',
    last_price_update TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sp_supplier ON business.supplier_products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_sp_product_trgm ON business.supplier_products USING gin (product_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_sp_code ON business.supplier_products(product_code);

-- PRICE HISTORY
CREATE TABLE IF NOT EXISTS business.price_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    supplier_product_id UUID NOT NULL REFERENCES business.supplier_products(id) ON DELETE CASCADE,
    price NUMERIC(12,2) NOT NULL,
    currency TEXT DEFAULT 'PEN',
    source TEXT DEFAULT 'po',
    recorded_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ph_product ON business.price_history(supplier_product_id, recorded_at DESC);

-- PURCHASE ORDERS
CREATE TABLE IF NOT EXISTS business.purchase_orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    supplier_id UUID NOT NULL REFERENCES business.suppliers(id) ON DELETE RESTRICT,
    po_number TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft', 'sent', 'confirmed', 'partial',
        'delivered', 'paid', 'cancelled', 'disputed'
    )),
    order_date TIMESTAMPTZ DEFAULT now(),
    expected_delivery DATE,
    actual_delivery TIMESTAMPTZ,
    subtotal NUMERIC(12,2) DEFAULT 0,
    tax_amount NUMERIC(12,2) DEFAULT 0,
    total NUMERIC(12,2) DEFAULT 0,
    currency TEXT DEFAULT 'PEN',
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN (
        'pending', 'partial', 'paid', 'credit'
    )),
    notes TEXT,
    sent_via TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_po_supplier ON business.purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_po_status ON business.purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_po_date ON business.purchase_orders(order_date DESC);
CREATE INDEX IF NOT EXISTS idx_po_delivery ON business.purchase_orders(expected_delivery);

-- PO LINE ITEMS
CREATE TABLE IF NOT EXISTS business.po_line_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    po_id UUID NOT NULL REFERENCES business.purchase_orders(id) ON DELETE CASCADE,
    supplier_product_id UUID REFERENCES business.supplier_products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity NUMERIC(12,3) NOT NULL,
    unit TEXT DEFAULT 'unidad',
    unit_price NUMERIC(12,2) NOT NULL,
    total NUMERIC(12,2) NOT NULL,
    received_quantity NUMERIC(12,3) DEFAULT 0,
    quality_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_poli_po ON business.po_line_items(po_id);

-- DELIVERY RECEIPTS
CREATE TABLE IF NOT EXISTS business.delivery_receipts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    po_id UUID NOT NULL REFERENCES business.purchase_orders(id) ON DELETE CASCADE,
    received_at TIMESTAMPTZ DEFAULT now(),
    received_by TEXT,
    is_complete BOOLEAN DEFAULT TRUE,
    discrepancy_notes TEXT,
    quality_issues TEXT,
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dr_po ON business.delivery_receipts(po_id);

-- SUPPLIER COMPLAINTS
CREATE TABLE IF NOT EXISTS business.supplier_complaints (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    supplier_id UUID NOT NULL REFERENCES business.suppliers(id) ON DELETE CASCADE,
    po_id UUID REFERENCES business.purchase_orders(id) ON DELETE SET NULL,
    complaint_type TEXT NOT NULL CHECK (complaint_type IN (
        'late_delivery', 'short_delivery', 'quality',
        'wrong_product', 'overcharge', 'damaged', 'other'
    )),
    description TEXT NOT NULL,
    severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status TEXT DEFAULT 'open' CHECK (status IN (
        'open', 'in_progress', 'resolved', 'unresolved'
    )),
    resolution TEXT,
    credit_amount NUMERIC(12,2),
    created_at TIMESTAMPTZ DEFAULT now(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sc_supplier ON business.supplier_complaints(supplier_id);
CREATE INDEX IF NOT EXISTS idx_sc_status ON business.supplier_complaints(status);

-- REORDER POINTS
CREATE TABLE IF NOT EXISTS business.reorder_points (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_name TEXT NOT NULL,
    product_code TEXT,
    preferred_supplier_id UUID REFERENCES business.suppliers(id) ON DELETE SET NULL,
    minimum_stock NUMERIC(12,3) NOT NULL,
    reorder_quantity NUMERIC(12,3) NOT NULL,
    unit TEXT DEFAULT 'unidad',
    check_frequency TEXT DEFAULT 'weekly' CHECK (check_frequency IN (
        'daily', 'weekly', 'monthly'
    )),
    last_checked TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════════════
-- SALON — Color Formulas, Gift Cards, Deposits, No-Shows, Client Profiles, Service Menu
-- ══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS business.salon_color_formulas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID REFERENCES business.contacts(id),
    stylist_id UUID REFERENCES business.contacts(id),
    service_date DATE NOT NULL,
    brand TEXT,
    shades JSONB DEFAULT '[]',
    developer_vol INTEGER,
    technique TEXT,
    processing_time_min INTEGER,
    products_used JSONB DEFAULT '[]',
    notes TEXT,
    photos JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_salon_formulas_client ON business.salon_color_formulas(client_id);
CREATE INDEX IF NOT EXISTS idx_salon_formulas_date ON business.salon_color_formulas(service_date DESC);

CREATE TABLE IF NOT EXISTS business.salon_gift_cards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    purchaser_id UUID REFERENCES business.contacts(id),
    recipient_name TEXT,
    original_amount DECIMAL(10,2) NOT NULL,
    current_balance DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'PEN',
    status TEXT DEFAULT 'active' CHECK (status IN ('active','fully_redeemed','expired','cancelled')),
    expires_at DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_salon_gc_code ON business.salon_gift_cards(code);

CREATE TABLE IF NOT EXISTS business.salon_gift_card_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    gift_card_id UUID REFERENCES business.salon_gift_cards(id),
    type TEXT NOT NULL CHECK (type IN ('purchase','redemption','top_up','refund','expiry')),
    amount DECIMAL(10,2) NOT NULL,
    service_description TEXT,
    processed_by TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS business.salon_deposits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID REFERENCES business.contacts(id),
    appointment_id UUID,
    amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT,
    status TEXT DEFAULT 'paid' CHECK (status IN ('paid','applied','forfeited','refunded')),
    paid_at TIMESTAMPTZ DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    resolution_note TEXT
);

CREATE INDEX IF NOT EXISTS idx_salon_deposits_client ON business.salon_deposits(client_id);
CREATE INDEX IF NOT EXISTS idx_salon_deposits_status ON business.salon_deposits(status);

CREATE TABLE IF NOT EXISTS business.salon_no_shows (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID REFERENCES business.contacts(id),
    appointment_id UUID,
    scheduled_service TEXT,
    estimated_revenue_lost DECIMAL(10,2),
    deposit_forfeited DECIMAL(10,2) DEFAULT 0,
    occurred_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_salon_noshows_client ON business.salon_no_shows(client_id);

CREATE TABLE IF NOT EXISTS business.salon_client_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID UNIQUE REFERENCES business.contacts(id),
    hair_type TEXT,
    hair_texture TEXT,
    hair_condition TEXT,
    natural_color TEXT,
    current_color TEXT,
    skin_type TEXT,
    allergies TEXT[] DEFAULT '{}',
    contraindications TEXT[] DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    notes TEXT,
    photos JSONB DEFAULT '[]',
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS business.salon_services_menu (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    duration_min INTEGER NOT NULL,
    buffer_min INTEGER DEFAULT 15,
    price DECIMAL(10,2) NOT NULL,
    senior_price DECIMAL(10,2),
    junior_price DECIMAL(10,2),
    commission_rate DECIMAL(5,4),
    products_typical JSONB DEFAULT '[]',
    requires_patch_test BOOLEAN DEFAULT FALSE,
    min_stylist_level TEXT DEFAULT 'junior',
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0
);
