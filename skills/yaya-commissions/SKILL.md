# yaya-commissions — Staff Commission, Tip & Payout Tracking for Service Businesses

## Description
WhatsApp-native commission calculation, tip tracking, and payout management for beauty salons, barbershops, spas, and any commission-based service business in Latin America. Business owners log services performed by each stylist/employee, track tips, handle advance payments (adelantos), deduct product usage costs, and generate weekly payout summaries — all via natural Spanish chat. Designed for the 50-80K beauty salons in Peru (73.8% women-led) plus barbershops, spas, nail studios, and similar businesses where staff earn commissions rather than fixed salaries, payments are weekly in cash, and tracking happens in notebooks or not at all. Replaces the mental math, scribbled notebooks, and Friday payout arguments with transparent, auditable commission tracking.

The skill bridges service attribution (yaya-appointments tracks who performed which service) and business cost tracking (yaya-expenses records payroll as a cost) by managing what happens in between: who did what, how much they earned, what deductions apply, and what gets paid out on Friday.

## When to Use
- Business owner logs services performed by staff ("Ana hizo 3 coloraciones y 2 cortes hoy")
- Business owner asks about commission calculations ("¿cuánto lleva Ana esta semana?", "¿cuánto le toca a Paola?")
- Business owner sets or updates commission rates ("Ana gana 35%, las juniors 25%")
- Business owner logs a tip ("la clienta dejó S/10 de propina para Ana")
- Business owner records product usage deduction ("Ana usó S/45 de tinte para la coloración")
- Business owner processes an advance payment ("Ana pidió S/200 de adelanto")
- Business owner needs weekly/monthly payout summary ("¿cuánto le pago a cada una esta semana?")
- Staff member questions their payout ("Ana dice que le falta plata, muéstrame el detalle")
- Business owner asks about performance ("¿quién es mi mejor estilista?", "¿quién vende más?")
- Business owner asks about chair utilization ("¿cuántas horas trabajó Ana hoy?")
- Business owner wants to send payout notifications via WhatsApp ("mándale su resumen a cada una")
- Business owner asks about product sales commissions ("Ana vendió shampoo, ¿cuánto gana?")
- A scheduled weekly payout summary triggers via cron (Friday/Saturday)
- Business owner wants to compare staff performance across periods

## Capabilities

### Core: Commission Rate Management
- **Set rates per employee** — "Ana gana 35% de servicios, Paola 30%, las juniors 25%" → stores individual commission rates
- **Tiered rates** — Different rates for services vs product sales: "35% en servicios, 10% en ventas de productos"
- **Rate categories** — Different rates by service type: "40% en coloración, 35% en corte, 30% en tratamientos"
- **Rate history** — Track when rates changed: "Ana subió de 30% a 35% en enero" → historical accuracy for past payouts
- **Owner-as-stylist** — Owner can track her own services and commissions for performance visibility (common in Peru)
- **New hire onboarding** — "Llegó una nueva chica, María, empieza con 25%" → creates employee profile with starting rate

### Core: Service Tracking
- **Log services from chat** — "Ana hizo 3 coloraciones (S/120 c/u), 2 cortes (S/35 c/u) y vendió 1 shampoo (S/38)" → records each service with performer, type, price
- **Bulk daily entry** — "Hoy: Ana 5 servicios S/480, Paola 4 servicios S/350, Lucía 3 servicios S/220" → fast end-of-day logging
- **Auto-attribution from appointments** — When yaya-appointments records a completed service, auto-attribute to the assigned stylist
- **Voice logging** — "Ana hizo una coloración de ciento veinte soles y un corte de treinta y cinco" via voice note
- **Service categories** — Corte, coloración, tratamiento, manicure, pedicure, barba, alisado, extensiones, maquillaje, depilación, masaje, facial, etc.
- **Product sales tracking** — Separate from services: "Ana vendió 1 shampoo (S/38)" → different commission rate applies

### Core: Daily Commission Calculation
- **Automatic calculation** — As services are logged, commissions calculate in real time based on each employee's rate
- **Split services** — When two stylists collaborate: "Ana y Paola hicieron la coloración juntas — dividir comisión"
- **Running daily total** — After each entry: "Ana lleva S/168 de comisión hoy (S/480 en servicios)"
- **Service + product breakdown** — "Ana: S/168 servicios (35%) + S/3.80 productos (10%) = S/171.80 total"

### Core: Weekly/Monthly Payout Summary
- **Weekly payout report** — Per-employee breakdown: services performed, gross revenue, commission earned, tips, deductions (product usage, adelantos), net payout
- **Payment-ready format** — Clear amounts ready to hand out on Friday: "Pagarle a Ana: S/850, a Paola: S/720, a Lucía: S/480"
- **Period selection** — "¿Cómo fue el mes de febrero?" → full month breakdown per employee
- **Year-to-date tracking** — Accumulated earnings per employee for tax/reporting purposes
- **Payout confirmation** — "Ya le pagué a Ana" → marks payout as completed, creates expense in yaya-expenses

### Core: Product Usage Deduction
- **Log product cost** — "Ana usó S/45 de tinte Igora para la coloración de la Sra. Pérez" → deducts from Ana's payout
- **Product catalog link** — Common salon products with costs: tintes, oxidantes, tratamientos, keratina, etc.
- **Per-service deduction** — Link product usage to specific service for transparency
- **Running deduction total** — "Ana lleva S/120 de productos usados esta semana"
- **Dispute-ready detail** — Every deduction has: what product, how much, for which service, which client

### Core: Tip Tracking
- **Log tips** — "La clienta dejó S/10 de propina para Ana" → tracked separately from commissions
- **Daily/weekly tip totals** — "Ana recibió S/65 en propinas esta semana"
- **Tip policy options** — Tips go 100% to stylist (default), or pooled and split by hours worked
- **Tip source** — Cash tip vs digital tip (Yape/Plin) — affects how it's paid out

### Core: Advance Payments (Adelantos)
- **Log adelanto** — "Ana pidió S/200 de adelanto" → recorded as advance against future earnings
- **Auto-deduct from payout** — Friday payout automatically deducts pending adelantos
- **Running adelanto balance** — "Ana tiene S/200 de adelanto pendiente esta semana"
- **Adelanto history** — "¿Cuántos adelantos ha pedido Ana este mes?" → pattern visibility
- **Adelanto limit** — Optional: set max adelanto as percentage of expected weekly earnings

### Performance Metrics
- **Services per day** — Average number of services per stylist per working day
- **Average ticket** — Average revenue per service per stylist: "Ana: S/95 promedio, Paola: S/78"
- **Client retention rate** — Percentage of clients who return to the same stylist (requires yaya-appointments data)
- **Revenue per hour** — Revenue generated per hour of availability (chair time utilization)
- **Chair time utilization** — Percentage of available working hours actually booked per stylist
- **Top performer identification** — "Ana genera 42% de tus ingresos totales y tiene la mejor retención"
- **Trend analysis** — "Paola mejoró su ticket promedio 15% vs mes pasado"
- **Product sales performance** — Who sells the most retail products? "Ana vendió S/380 en productos, Paola S/120"

### Commission Disputes
- **Detailed breakdown** — When staff questions their payout, show line-by-line: each service, price, commission rate, product deductions, tips, adelantos
- **Date-by-date detail** — "Muéstrame el detalle de Ana del martes" → every service that day
- **Comparison to previous weeks** — "Ana ganó S/850 esta semana vs S/920 la semana pasada — hizo 3 servicios menos"
- **Audit trail** — Every entry timestamped with who logged it and when

### WhatsApp Payout Notifications
- **Send individual summaries** — Each employee gets their weekly summary via WhatsApp with full breakdown
- **Bulk send** — "Mándale su resumen a cada una" → sends personalized message to all active employees
- **Professional format** — Clean, easy-to-read summary that builds trust and reduces disputes

## MCP Tools Required
- `postgres-mcp` — Commission rates, service logs, tip records, adelantos, product deductions, payout history, performance metrics
- `erpnext-mcp` — Product catalog for product usage costs, service catalog pricing
- `whatsapp-mcp` — Send weekly payout summaries to each employee, receive service logs from owner
- `appointments-mcp` — Service attribution: which stylist performed which appointment, completed service data

## Data Model

### PostgreSQL Tables

```sql
-- ══════════════════════════════════════════════════════════
-- STAFF (employees/stylists with commission rates)
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS business.commission_staff (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    nickname TEXT,                         -- "Anita", "La Flaca" — how owner refers to them
    phone TEXT,
    whatsapp TEXT,
    role TEXT DEFAULT 'estilista' CHECK (role IN (
        'estilista', 'barbero', 'manicurista', 'esteticista',
        'masajista', 'maquilladora', 'aprendiz', 'dueña', 'otro'
    )),
    seniority TEXT DEFAULT 'junior' CHECK (seniority IN (
        'aprendiz', 'junior', 'senior', 'master'
    )),
    service_commission_rate NUMERIC(5,2) NOT NULL DEFAULT 25.00,  -- percentage: 25.00 = 25%
    product_commission_rate NUMERIC(5,2) NOT NULL DEFAULT 10.00,  -- percentage for retail product sales
    tip_policy TEXT DEFAULT 'individual' CHECK (tip_policy IN (
        'individual', 'pooled'
    )),
    weekly_hours NUMERIC(5,2) DEFAULT 48.00,   -- contracted/expected hours per week
    working_days TEXT[] DEFAULT ARRAY['lunes','martes','miercoles','jueves','viernes','sabado'],
    start_date DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT TRUE,
    deactivated_date DATE,
    deactivated_reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cs_active ON business.commission_staff(is_active);
CREATE INDEX IF NOT EXISTS idx_cs_name_trgm ON business.commission_staff USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_cs_nickname_trgm ON business.commission_staff USING gin (nickname gin_trgm_ops);

-- ══════════════════════════════════════════════════════════
-- COMMISSION RATE HISTORY (track rate changes over time)
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS business.commission_rate_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    staff_id UUID NOT NULL REFERENCES business.commission_staff(id) ON DELETE CASCADE,
    rate_type TEXT NOT NULL CHECK (rate_type IN ('service', 'product')),
    old_rate NUMERIC(5,2),
    new_rate NUMERIC(5,2) NOT NULL,
    changed_at TIMESTAMPTZ DEFAULT now(),
    reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_crh_staff ON business.commission_rate_history(staff_id, changed_at DESC);

-- ══════════════════════════════════════════════════════════
-- SERVICE CATEGORY RATES (optional per-category overrides)
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS business.commission_category_rates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    staff_id UUID NOT NULL REFERENCES business.commission_staff(id) ON DELETE CASCADE,
    service_category TEXT NOT NULL,        -- coloracion, corte, tratamiento, etc.
    commission_rate NUMERIC(5,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(staff_id, service_category)
);

CREATE INDEX IF NOT EXISTS idx_ccr_staff ON business.commission_category_rates(staff_id);

-- ══════════════════════════════════════════════════════════
-- SERVICE LOG (each service performed by a staff member)
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS business.commission_services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    staff_id UUID NOT NULL REFERENCES business.commission_staff(id) ON DELETE CASCADE,
    appointment_id UUID,                   -- link to yaya-appointments if auto-attributed
    service_date DATE NOT NULL DEFAULT CURRENT_DATE,
    service_category TEXT NOT NULL,        -- corte, coloracion, tratamiento, manicure, etc.
    service_description TEXT,              -- "Coloración completa rubio ceniza"
    client_name TEXT,                      -- optional: "Sra. Pérez"
    service_price NUMERIC(12,2) NOT NULL,  -- price charged to client
    commission_rate NUMERIC(5,2) NOT NULL, -- rate applied (snapshot at time of service)
    commission_amount NUMERIC(12,2) NOT NULL, -- calculated: price * rate / 100
    is_split BOOLEAN DEFAULT FALSE,
    split_with UUID REFERENCES business.commission_staff(id),
    split_percentage NUMERIC(5,2) DEFAULT 50.00, -- this staff member's share of the split
    is_product_sale BOOLEAN DEFAULT FALSE, -- retail product sale vs service
    logged_by TEXT DEFAULT 'owner',        -- who logged it: owner, auto (from appointments)
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_csvc_staff ON business.commission_services(staff_id, service_date);
CREATE INDEX IF NOT EXISTS idx_csvc_date ON business.commission_services(service_date);
CREATE INDEX IF NOT EXISTS idx_csvc_category ON business.commission_services(service_category);
CREATE INDEX IF NOT EXISTS idx_csvc_appointment ON business.commission_services(appointment_id);

-- ══════════════════════════════════════════════════════════
-- PRODUCT USAGE DEDUCTIONS (product cost charged to staff)
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS business.commission_product_deductions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    staff_id UUID NOT NULL REFERENCES business.commission_staff(id) ON DELETE CASCADE,
    service_id UUID REFERENCES business.commission_services(id) ON DELETE SET NULL,
    deduction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    product_name TEXT NOT NULL,            -- "Tinte Igora 7.1", "Oxidante 30vol"
    product_cost NUMERIC(12,2) NOT NULL,   -- cost to the salon
    client_name TEXT,                      -- "Sra. Pérez"
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cpd_staff ON business.commission_product_deductions(staff_id, deduction_date);
CREATE INDEX IF NOT EXISTS idx_cpd_date ON business.commission_product_deductions(deduction_date);

-- ══════════════════════════════════════════════════════════
-- TIPS
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS business.commission_tips (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    staff_id UUID NOT NULL REFERENCES business.commission_staff(id) ON DELETE CASCADE,
    tip_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount NUMERIC(12,2) NOT NULL,
    source TEXT DEFAULT 'efectivo' CHECK (source IN (
        'efectivo', 'yape', 'plin', 'tarjeta', 'otro'
    )),
    client_name TEXT,
    service_id UUID REFERENCES business.commission_services(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ct_staff ON business.commission_tips(staff_id, tip_date);
CREATE INDEX IF NOT EXISTS idx_ct_date ON business.commission_tips(tip_date);

-- ══════════════════════════════════════════════════════════
-- ADELANTOS (advance payments against future earnings)
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS business.commission_adelantos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    staff_id UUID NOT NULL REFERENCES business.commission_staff(id) ON DELETE CASCADE,
    adelanto_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount NUMERIC(12,2) NOT NULL,
    payment_method TEXT DEFAULT 'efectivo' CHECK (payment_method IN (
        'efectivo', 'yape', 'plin', 'transferencia'
    )),
    reason TEXT,                           -- optional: "emergencia médica", "colegio del hijo"
    deducted_in_payout_id UUID,            -- linked when deducted
    is_deducted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ca_staff ON business.commission_adelantos(staff_id, adelanto_date);
CREATE INDEX IF NOT EXISTS idx_ca_pending ON business.commission_adelantos(is_deducted) WHERE NOT is_deducted;

-- ══════════════════════════════════════════════════════════
-- PAYOUTS (weekly/monthly payment records)
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS business.commission_payouts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    staff_id UUID NOT NULL REFERENCES business.commission_staff(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_service_revenue NUMERIC(12,2) DEFAULT 0,   -- total billed by this staff
    total_product_revenue NUMERIC(12,2) DEFAULT 0,   -- total product sales by this staff
    service_commission NUMERIC(12,2) DEFAULT 0,      -- earned from services
    product_commission NUMERIC(12,2) DEFAULT 0,      -- earned from product sales
    total_tips NUMERIC(12,2) DEFAULT 0,
    total_product_deductions NUMERIC(12,2) DEFAULT 0, -- product usage costs
    total_adelantos NUMERIC(12,2) DEFAULT 0,          -- advances to deduct
    gross_payout NUMERIC(12,2) DEFAULT 0,  -- commissions + tips
    net_payout NUMERIC(12,2) DEFAULT 0,    -- gross - deductions - adelantos
    services_count INTEGER DEFAULT 0,
    payment_method TEXT DEFAULT 'efectivo',
    is_paid BOOLEAN DEFAULT FALSE,
    paid_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cp_staff ON business.commission_payouts(staff_id, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_cp_period ON business.commission_payouts(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_cp_unpaid ON business.commission_payouts(is_paid) WHERE NOT is_paid;
```

## Behavior Guidelines

### Language & Tone
- **Primary language: Spanish** — All messages in natural Peruvian Spanish
- **Warm and direct** — Salon owners communicate fast, between clients. Keep messages short and scannable.
- **Use emojis as visual markers** — 💇 services, 💰 money, 💅 beauty, ✂️ cuts, ✅ confirmations, ⚠️ alerts
- **Use names** — Always refer to staff by name, never by ID or number
- **Round numbers** — S/847.50 → S/848. Show centavos only when exact amounts matter (deductions, disputes)

### Commission Logic
- **Always confirm rate before first calculation** — "¿Ana gana 35% de los servicios, correcto?"
- **Snapshot rates at service time** — If rate changes mid-week, services before the change keep the old rate
- **Default rate: 30% services, 10% products** — Use defaults until owner specifies, but always ask on first use
- **Owner-as-stylist** — If the owner performs services, track them for performance metrics but don't calculate "payout" (she keeps the business profit). Mark role as 'dueña'.
- **Product deductions come off net, not gross** — Commission is calculated on service price, then product costs are deducted from the payout amount

### Payout Logic
- **Default payout day: Friday** — Generate payout summary Friday afternoon, adjustable per business
- **Payout = service commission + product commission + tips - product deductions - adelantos**
- **Never allow negative payout** — If deductions exceed earnings, carry the balance to next week: "Ana tiene un saldo pendiente de S/45 para la próxima semana"
- **Confirm before marking as paid** — "¿Ya le pagaste a Ana los S/850?"
- **Create expense entry** — When payout is confirmed, auto-create expense in yaya-expenses (category: planilla/comisiones)

### Adelanto Logic
- **No judgment** — Adelantos are normal and expected. Never comment on frequency or reason.
- **Track meticulously** — Every adelanto recorded with date, amount, and method
- **Auto-deduct on payout** — All pending adelantos automatically appear in Friday payout calculation
- **Warn if adelanto exceeds projected earnings** — "Ana lleva S/600 de adelantos pero solo ha ganado S/450 esta semana. ¿Confirmo el adelanto de S/200?"

### Privacy & Sensitivity
- **Never share one employee's earnings with another** — Commission data is private
- **WhatsApp payout messages go only to the individual** — Never in group chats
- **Don't compare employees publicly** — Performance comparisons only shown to the owner
- **Disputes stay between owner and the individual** — "Te muestro el detalle de Ana" (only to owner)

## Payout Report Schedules (via OpenClaw Cron)

```yaml
scheduled_reports:
  weekly_payout_summary:
    schedule: "0 14 * * 5"         # Friday at 2 PM
    description: "Generate weekly payout summary for all active staff, send to owner for review"

  weekly_payout_notifications:
    schedule: "0 17 * * 5"         # Friday at 5 PM (after owner reviews)
    description: "Send individual payout summaries to each staff member via WhatsApp"

  monthly_performance:
    schedule: "0 10 1 * *"         # 1st of month at 10 AM
    description: "Monthly performance report: per-staff metrics, rankings, trends"

  daily_service_reminder:
    schedule: "0 21 * * 1-6"       # Mon-Sat at 9 PM
    description: "Remind owner to log today's services if none have been logged"
```

## Response Formats (WhatsApp-Optimized)

### Staff Registered
```
✅ Estilista registrada:
💇 *Ana Quispe*
📱 987 654 321
✂️ Comisión servicios: 35%
🛍️ Comisión productos: 10%
📅 Desde: 21 marzo 2026
```

### Services Logged
```
✅ Servicios de *Ana* registrados — Viernes 21/03

✂️ 3 coloraciones (S/120 c/u) = S/360
✂️ 2 cortes (S/35 c/u) = S/70
🛍️ 1 shampoo vendido = S/38

💰 Comisión del día:
   Servicios: S/150.50 (35% de S/430)
   Productos: S/3.80 (10% de S/38)
   *Total: S/154.30*

📊 Ana lleva S/687 esta semana
```

### Daily Running Total
```
📊 *Comisiones de hoy* — Viernes 21/03

💇 *Ana:* S/154 (5 servicios, S/468 facturado)
💇 *Paola:* S/108 (4 servicios, S/360 facturado)
💇 *Lucía:* S/62 (3 servicios, S/248 facturado)

💰 Total comisiones hoy: S/324
💵 Total facturado: S/1,076
```

### Product Deduction Logged
```
✅ Deducción registrada:
💇 *Ana* — Coloración Sra. Pérez
🧴 Tinte Igora 7.1: S/25.00
🧴 Oxidante 30vol: S/12.00
🧴 Tratamiento post-color: S/8.00
💸 *Total deducción: S/45.00*

📊 Ana lleva S/120 de productos esta semana
```

### Tip Logged
```
✅ Propina registrada:
💇 *Ana* — S/10 (efectivo)
💰 Propinas de Ana esta semana: S/65
```

### Adelanto Logged
```
✅ Adelanto registrado:
💇 *Ana* — S/200 (efectivo)
📅 21 de marzo

📊 Resumen de Ana esta semana:
   💰 Comisiones: S/687
   💵 Propinas: S/65
   🧴 Productos: -S/120
   ⏩ Adelantos: -S/200
   ═══════════════
   💵 *Por cobrar el viernes: S/432*
```

### Weekly Payout Summary (to owner)
```
💰 *Pagos de la semana* — 15 al 21 de marzo

💇 *Ana Quispe*
   ✂️ 22 servicios — S/2,450 facturado
   💰 Comisión servicios: S/857.50 (35%)
   🛍️ Comisión productos: S/38.00 (10% de S/380)
   💵 Propinas: S/65.00
   🧴 Productos usados: -S/120.00
   ⏩ Adelantos: -S/200.00
   ═══════════════════════
   💵 *Pagar: S/640.50*

💇 *Paola Rivera*
   ✂️ 18 servicios — S/1,890 facturado
   💰 Comisión servicios: S/567.00 (30%)
   🛍️ Comisión productos: S/12.00 (10% de S/120)
   💵 Propinas: S/40.00
   🧴 Productos usados: -S/85.00
   ⏩ Adelantos: -S/0.00
   ═══════════════════════
   💵 *Pagar: S/534.00*

💇 *Lucía Torres*
   ✂️ 15 servicios — S/1,200 facturado
   💰 Comisión servicios: S/300.00 (25%)
   💵 Propinas: S/25.00
   🧴 Productos usados: -S/40.00
   ⏩ Adelantos: -S/150.00
   ═══════════════════════
   💵 *Pagar: S/135.00*

═══════════════════════════
💵 *Total a pagar: S/1,309.50*
📊 Total facturado: S/6,040
📈 Costo comisiones: 21.7% de ingresos

¿Confirmo los pagos? ✅
```

### WhatsApp Payout Notification (to employee)
```
Hola Ana 👋 Tu resumen de la semana (15-21 marzo):

✂️ 22 servicios realizados
💰 Comisión: S/857.50
🛍️ Venta productos: S/38.00
💵 Propinas: S/65.00
🧴 Productos usados: -S/120.00
⏩ Adelanto (miércoles): -S/200.00

💵 *Total a cobrar: S/640.50*

¡Excelente semana! 💪 Fuiste la #1 en servicios.
```

### Monthly Performance Report (to owner)
```
📊 *Rendimiento del equipo — Marzo 2026*

🏆 *Ranking por ingresos generados:*
1. 💇 Ana — S/9,800 (42% del total)
   📈 22 servicios/semana promedio
   💰 Ticket promedio: S/111
   🔄 Retención clientes: 78%
   ⏱️ Utilización: 85%

2. 💇 Paola — S/7,560 (32% del total)
   📈 18 servicios/semana promedio
   💰 Ticket promedio: S/105
   🔄 Retención clientes: 72%
   ⏱️ Utilización: 75%

3. 💇 Lucía — S/4,800 (21% del total)
   📈 15 servicios/semana promedio
   💰 Ticket promedio: S/80
   🔄 Retención clientes: 65%
   ⏱️ Utilización: 62%

4. 💇 María (nueva) — S/1,200 (5% del total)
   📈 8 servicios/semana promedio
   💰 Ticket promedio: S/75
   ⏱️ Utilización: 40%

📈 *Tendencias:*
   • Ana subió ticket promedio 8% vs febrero
   • Lucía mejoró retención 5 puntos
   • María en curva de aprendizaje — normal para primer mes

💰 *Costo total comisiones: S/6,840*
📊 Representa 29% de ingresos totales

💡 *Observaciones:*
   • Ana tiene la mejor utilización — considerar subir su tarifa
   • Lucía mejora cada mes — evaluar subir comisión de 25% a 28%
   • La venta de productos subió 35% — Ana vendió el 60%
```

### Commission Dispute Detail
```
📋 *Detalle de Ana — Semana 15-21 marzo*

📅 *Lunes 15:*
   • Corte — Sra. López — S/35 → S/12.25
   • Coloración — Sra. Pérez — S/120 → S/42.00
   • Corte — Sr. García — S/30 → S/10.50
   🧴 Tinte Igora: -S/25.00
   💵 Propina: +S/5.00
   📊 Día: S/44.75

📅 *Martes 16:*
   • Alisado — Sra. Rodríguez — S/180 → S/63.00
   • Corte + secado — Sra. Díaz — S/55 → S/19.25
   • Shampoo vendido — S/38 → S/3.80
   🧴 Keratina: -S/35.00
   📊 Día: S/51.05

📅 *Miércoles 17:*
   ⏩ Adelanto: -S/200.00
   • Coloración — Sra. Torres — S/150 → S/52.50
   • 2 cortes (S/35 c/u) → S/24.50
   💵 Propina: +S/10.00
   📊 Día: -S/113.00

[... continúa jueves a sábado ...]

═══════════════════════════
💰 Comisión servicios: S/857.50
🛍️ Comisión productos: S/38.00
💵 Propinas: S/65.00
🧴 Productos: -S/120.00
⏩ Adelantos: -S/200.00
💵 *Neto: S/640.50*
```

### Chair Utilization Report
```
⏱️ *Utilización — Semana 15-21 marzo*

💇 *Ana* — 85% utilización
   ⏰ 41/48 horas ocupadas
   📊 8.2 horas/día promedio
   🔥 Mejor día: martes (100%)
   📉 Peor día: jueves (65%)

💇 *Paola* — 75% utilización
   ⏰ 36/48 horas ocupadas
   📊 7.2 horas/día promedio

💇 *Lucía* — 62% utilización
   ⏰ 30/48 horas ocupadas
   📊 6.0 horas/día promedio

💡 Lucía tiene 18 horas libres. ¿Promovemos descuentos
en sus horarios vacíos para llenar su agenda?
```

## Example Flows

### Setting Up Commission Rates
```
Dueña: "Ana gana 35% de servicios, Paola 30%, y las nuevas 25%"
Yaya: "✅ Comisiones configuradas:
       💇 Ana — 35% servicios, 10% productos
       💇 Paola — 30% servicios, 10% productos
       💇 Juniors — 25% servicios, 10% productos

       ¿Los porcentajes de productos (10%) están bien
       o quieres ajustarlos?"

Dueña: "Sí, 10% está bien para productos"
Yaya: "Perfecto ✅ Todo listo.
       Cuando me digas los servicios del día,
       calculo las comisiones automáticamente."
```

### Logging a Full Day
```
Dueña: "Hoy Ana hizo 3 coloraciones de S/120, 2 cortes de S/35 y vendió un shampoo de S/38"
Yaya: "✅ Servicios de *Ana* registrados — Viernes 21/03

       ✂️ 3 coloraciones (S/120 c/u) = S/360
       ✂️ 2 cortes (S/35 c/u) = S/70
       🛍️ 1 shampoo vendido = S/38

       💰 Comisión del día:
          Servicios: S/150.50 (35% de S/430)
          Productos: S/3.80 (10% de S/38)
          *Total: S/154.30*

       📊 Ana lleva S/687 esta semana.
       ¿Registro servicios de alguien más?"
```

### Product Usage Deduction
```
Dueña: "Ana usó S/45 de tinte Igora para la coloración de la Sra. Pérez"
Yaya: "✅ Deducción registrada:
       💇 Ana — Coloración Sra. Pérez
       🧴 Tinte Igora: S/45.00

       📊 Deducción se resta de su pago del viernes.
       Ana lleva S/120 de productos esta semana."
```

### Tip Logging
```
Dueña: "La clienta dejó S/10 de propina para Ana"
Yaya: "✅ Propina registrada:
       💇 Ana — S/10 (efectivo)
       💰 Propinas de Ana esta semana: S/65"
```

### Adelanto Request
```
Dueña: "Ana pidió S/200 de adelanto"
Yaya: "📊 Ana esta semana:
       💰 Comisiones: S/687
       💵 Propinas: S/65
       🧴 Productos: -S/120
       ═══════════════
       Ganado hasta ahora: S/632

       El adelanto de S/200 deja S/432 para el viernes.
       ¿Registro el adelanto? ✅"

Dueña: "Sí"
Yaya: "✅ Adelanto registrado:
       💇 Ana — S/200 (efectivo)
       📅 21 de marzo

       💵 Por cobrar el viernes: S/432"
```

### Friday Payout
```
Dueña: "¿Cuánto le pago a cada una?"
Yaya: [genera resumen semanal]
Yaya: "💰 *Pagos de la semana* — 15 al 21 de marzo

       💇 *Ana:* S/640.50
          (S/858 comisión + S/65 propinas - S/120 productos - S/200 adelanto)

       💇 *Paola:* S/534.00
          (S/579 comisión + S/40 propinas - S/85 productos)

       💇 *Lucía:* S/135.00
          (S/300 comisión + S/25 propinas - S/40 productos - S/150 adelanto)

       💵 *Total: S/1,309.50*

       ¿Les pago y les mando su resumen por WhatsApp?"

Dueña: "Sí, mándale a cada una"
Yaya: [marca pagos como completados]
      [envía resumen individual a cada empleada via whatsapp-mcp]
      [crea gasto en yaya-expenses: S/1,309.50, categoría: planilla/comisiones]
Yaya: "✅ Pagos registrados y resúmenes enviados:
       📲 Ana — enviado ✅
       📲 Paola — enviado ✅
       📲 Lucía — enviado ✅

       💸 Gasto registrado: S/1,309.50 (comisiones)"
```

### Commission Dispute
```
Dueña: "Ana dice que le falta plata, que ella hizo más servicios"
Yaya: "Te muestro el detalle completo de Ana esta semana:

       📋 *Detalle de Ana — 15 al 21 de marzo*

       📅 Lunes: 3 servicios — S/64.75
       📅 Martes: 3 servicios — S/86.05
       📅 Miércoles: 3 servicios — S/77.00
       📅 Jueves: 5 servicios — S/175.00
       📅 Viernes: 4 servicios — S/145.00
       📅 Sábado: 4 servicios — S/155.50

       ✂️ Total: 22 servicios, S/2,450 facturado
       💰 Comisión 35%: S/857.50
       🛍️ Productos vendidos: S/38.00
       💵 Propinas: S/65.00
       🧴 Productos usados: -S/120.00
       ⏩ Adelanto miércoles: -S/200.00
       ═══════════════════════
       💵 Neto: S/640.50

       ¿Quieres que le mande este detalle a Ana
       para que lo revise? 📲"

Dueña: "Sí, mándale"
Yaya: [envía detalle a Ana via whatsapp-mcp]
Yaya: "📲 Detalle enviado a Ana ✅"
```

### Performance Question
```
Dueña: "¿Quién es mi mejor estilista?"
Yaya: "📊 *Ranking de marzo* (hasta hoy):

       🥇 *Ana* — S/9,800 facturado
          22 servicios/semana | S/111 ticket promedio
          78% retención | 85% utilización
          🛍️ S/380 en productos vendidos

       🥈 *Paola* — S/7,560 facturado
          18 servicios/semana | S/105 ticket promedio
          72% retención | 75% utilización

       🥉 *Lucía* — S/4,800 facturado
          15 servicios/semana | S/80 ticket promedio
          65% retención | 62% utilización

       💡 Ana genera el 42% de tus ingresos y tiene
       la mejor retención. Es tu estrella ⭐

       ¿Quieres ver más detalle de alguna?"
```

### Owner Tracks Her Own Services
```
Dueña: "Yo hice 2 cortes hoy de S/40 c/u"
Yaya: "✅ Tus servicios registrados — Viernes 21/03
       ✂️ 2 cortes (S/40 c/u) = S/80

       📊 Tu día: S/80 facturado, 2 servicios
       📊 Tu semana: S/520 facturado, 12 servicios

       (Como dueña, esto se registra para tus métricas
       pero no genera pago de comisión 👍)"
```

### Chair Utilization Question
```
Dueña: "¿Cuánto está trabajando Lucía realmente?"
Yaya: "⏱️ *Utilización de Lucía — Marzo*

       Promedio semanal: 62%
       ⏰ 30 de 48 horas ocupadas
       📊 6 horas/día promedio

       Por día:
       • Lunes: 70% (5.5h de 8h)
       • Martes: 55% (4.5h)
       • Miércoles: 60% (5h)
       • Jueves: 50% (4h) ← peor día
       • Viernes: 75% (6h)
       • Sábado: 80% (5h de 6h)

       💡 Lucía tiene 18 horas libres por semana.
       Sus horarios más vacíos: martes y jueves PM.

       ¿Quieres que la promovamos en esos horarios
       con descuentos para llenar su agenda?"
```

## Integration Points

### With yaya-appointments
- Completed appointments auto-create commission service entries attributed to the assigned provider
- Service duration feeds chair utilization calculations
- Client data enables retention rate tracking per stylist
- No-shows don't generate commissions (only completed services count)

### With yaya-expenses
- Confirmed weekly payouts create expense entries (category: planilla/comisiones)
- Commission cost visible in P&L reports as a business expense
- Product deductions reduce the commission expense, not inventory cost (already tracked separately)

### With erpnext-mcp
- Product catalog provides cost prices for product usage deductions
- Service catalog provides standard pricing for commission calculations
- Retail product sales tracked for product commission calculations

### With whatsapp-mcp
- Send individual payout summaries to each employee on payday
- Send dispute detail breakdowns when requested
- Receive service logs from owner via chat

## Proactive Behaviors
- **Friday payout reminder** — Friday 2 PM: "¿Quieres que prepare los pagos de la semana?"
- **Daily logging reminder** — 9 PM Mon-Sat: "¿Registramos los servicios de hoy?" (only if no services logged that day)
- **Adelanto warning** — When adelanto would exceed 80% of projected weekly earnings: "Ana lleva S/600 de adelantos pero solo ha ganado S/450"
- **Performance milestone** — "¡Ana llegó a 100 servicios este mes! Es su mejor mes 🎉"
- **Product cost alert** — When product deductions exceed 15% of commission: "Las deducciones de productos de Ana están altas — 18% de su comisión. ¿Revisamos?"
- **Rate review suggestion** — After 3 months: "Lucía lleva 3 meses con 25%. Su ticket promedio subió 20%. ¿Consideras subir su comisión?"
- **Utilization opportunity** — When a stylist drops below 50% utilization for 2+ weeks: suggest promotions or schedule adjustments

## Configuration
- `COMMISSION_DEFAULT_SERVICE_RATE` — Default commission rate for services (default: 30)
- `COMMISSION_DEFAULT_PRODUCT_RATE` — Default commission rate for product sales (default: 10)
- `COMMISSION_PAYOUT_DAY` — Day of week for payout calculation: 0=Mon, 4=Fri, 5=Sat (default: 4, Friday)
- `COMMISSION_PAYOUT_TIME` — Time to generate payout summary (default: "14:00")
- `COMMISSION_NOTIFICATION_TIME` — Time to send WhatsApp payout notifications (default: "17:00")
- `COMMISSION_WEEK_START` — First day of commission week: 0=Mon, 1=Tue (default: 0, Monday)
- `COMMISSION_ADELANTO_LIMIT_PCT` — Max adelanto as % of projected weekly earnings, 0=no limit (default: 0)
- `COMMISSION_PRODUCT_DEDUCTION_ALERT_PCT` — Alert when product deductions exceed this % of commission (default: 15)
- `COMMISSION_UTILIZATION_TARGET` — Target chair utilization percentage (default: 75)
- `COMMISSION_UTILIZATION_ALERT` — Alert when utilization drops below this % for 2+ weeks (default: 50)
- `COMMISSION_TIP_POLICY` — Default tip policy: "individual" or "pooled" (default: "individual")
- `COMMISSION_NEGATIVE_BALANCE_POLICY` — When deductions exceed earnings: "carry" or "forgive" (default: "carry")
- `COMMISSION_DAILY_REMINDER_TIME` — Time to remind owner to log services (default: "21:00")
- `COMMISSION_DAILY_REMINDER_ENABLED` — Enable daily service logging reminders (default: true)
- `COMMISSION_PAYOUT_NOTIFICATION_ENABLED` — Send WhatsApp payout summaries to staff (default: true)
- `COMMISSION_PAYOUT_CONTACTS` — Override: WhatsApp numbers to receive payout reports (default: from staff records)
- `BUSINESS_TIMEZONE` — Timezone for all scheduling (e.g., "America/Lima")
- `BUSINESS_CURRENCY` — Currency for display (default: "PEN")

## Error Handling & Edge Cases
- **No commission rate set** — First time logging services: "¿Cuánto porcentaje gana Ana de los servicios?" Don't assume — always ask before first calculation.
- **Staff not found** — Fuzzy match: "¿Te refieres a Ana Quispe o a Ana María?" Use nicknames if registered.
- **Duplicate service entry** — Same staff + same service + same amount within 30 min: "Ya registré un corte de S/35 para Ana hace 15 min. ¿Este es otro servicio o es el mismo?"
- **Negative payout** — When adelantos + deductions > commissions + tips: "Ana tiene un saldo negativo de S/45. Se traslada a la próxima semana." Never show negative amounts to the employee — just show S/0 payout with balance carried.
- **Staff leaves mid-week** — Calculate payout for days worked. "Paola trabajó hasta el miércoles. Su pago por 3 días: S/320"
- **Rate change mid-period** — Services logged before the change keep the old rate. Services after use the new rate. Show both in the payout detail.
- **Multiple payment methods for adelanto** — "S/100 en efectivo y S/100 por Yape" → log as two separate adelantos or one with mixed method.
- **Product cost unknown** — "No tengo precio del tinte Igora. ¿Cuánto cuesta?" Accept manual entry, suggest cataloging common products.
- **Owner services misclassified** — If owner is logging services but isn't marked as 'dueña': "¿Estos servicios los hiciste tú o son de otra estilista?"
- **Split service** — When two stylists collaborate: "¿Cómo dividimos la comisión? ¿50/50 o distinto?" Default 50/50.
- **Retroactive logging** — "Ana hizo 5 servicios ayer que no registré" → accept past dates, ask which specific day if vague.
- **WhatsApp delivery failure** — If payout notification fails: "No pude enviar el resumen a Lucía (número no disponible). ¿Le dices en persona o intento después?"
- **No services logged all week** — "Esta semana no hay servicios registrados para Lucía. ¿No trabajó o falta registrar?"
- **Very high commission** — If a single service yields commission > S/500: "La comisión de este servicio es S/525. ¿El precio de S/1,500 es correcto?" Catches typos.
- **Appointment auto-attribution conflict** — If appointment has a different provider than who actually performed the service: "La cita dice Dra. García pero ¿quién hizo el servicio realmente?"

## Cultural Notes
- **Adelantos are sacred** — In Peru, workers ask for adelantos regularly (school fees, medical emergencies, family needs). NEVER question or judge. Just track.
- **Weekly cash payment is standard** — Most salon workers expect cash on Friday or Saturday. Digital payments (Yape) are increasingly accepted but cash is king.
- **The owner works too** — In 90%+ of small salons, the owner is also the top stylist. She needs to see her own performance metrics even though she doesn't pay herself a commission.
- **Product deductions create conflict** — This is the #1 source of disputes. Meticulous tracking with receipts/details prevents arguments. Always link deduction to specific service and client.
- **Informal employment is the norm** — Most salon staff are not on formal payroll. They're "independent" commission workers. Don't reference payroll, SUNAT, or formal employment unless asked.
- **Seniority matters** — "Master" stylists earn 35-40%, seniors 30-35%, juniors 25-30%, apprentices 20-25%. Rates are tied to skill level and client base.
- **Beauty salon = women's space** — 73.8% of salons in Peru are women-led. Use feminine defaults in communication ("estilista", "la dueña") but adapt to barbershops ("barbero", "el dueño").
- **Saturday is the big day** — Highest revenue day. Services logged on Saturday often equal Mon-Wed combined. Payout day should be after Saturday if possible.
- **"Cómo le fue a mi salón" is the real question** — The owner cares less about individual commission math and more about total business performance. Always contextualize individual metrics within the business picture.
- **Trust is built through transparency** — Staff who can see exactly how their payout was calculated are less likely to dispute. WhatsApp summaries build this trust.
