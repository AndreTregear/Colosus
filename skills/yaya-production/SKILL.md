# yaya-production — Artisan Network & Production Order Management

## Description
WhatsApp-native production management for artisan workshops, textile producers, small manufacturers, and any MYPE that transforms raw materials into finished goods using a network of workers/artisans. Covers production orders (pedidos de producción), artisan capacity/assignment, raw material consumption tracking, work-in-progress (WIP) monitoring, quality control, delivery deadline management, per-unit costing with labor + materials, batch tracking, and artisan payment linkage. Purpose-built for Peru's 198K manufacturing MYPEs — from Rosa Mamani managing 15 tejedoras in Juliaca to a carpintería in Villa El Salvador with 5 workers, a talabartería in Arequipa, or a confección workshop in Gamarra.

In LATAM artisan manufacturing, the "factory" is a network: the owner sources materials, distributes them to home-based workers (tejedoras, costureras, carpinteros, soldadores), tracks progress via WhatsApp and phone calls, inspects quality upon delivery, and ships finished goods to clients. There is no ERP, no production board, no MRP system. Everything lives in the owner's head, their WhatsApp chat history, and maybe a cuaderno. The result: missed deadlines, unknown capacity, unclear costs, and constant anxiety about "¿va a llegar a tiempo?"

This skill replaces that chaos with structured production tracking — without requiring the artisans themselves to use any system. The owner (Rosa, the taller owner) is the sole user. She tells Yaya what she needs made, who's making it, and when it's due. Yaya tracks the rest.

85% of Peru's manufacturing MYPEs are informal. Average production cycle: 1-4 weeks. Payment to artisans: weekly in cash. Quality issues: 5-15% rejection rate. Voice notes are the primary communication channel between owners and artisans.

## When to Use
- Owner receives a new order and needs to plan production ("me pidieron 50 gorros, necesito que estén en 2 semanas")
- Owner assigns work to artisans ("dale 20 gorros a Doña Carmen y 30 a Julia")
- Owner checks production progress ("¿cuántos gorros van listos?", "¿cómo va el pedido de Lima?")
- Owner receives finished goods from artisan ("Carmen me entregó 18 gorros, 2 salieron mal")
- Owner needs to track raw material consumption ("le di 5kg de lana a Carmen para los gorros")
- Owner asks about artisan capacity ("¿quién tiene disponibilidad esta semana?", "¿Carmen puede con más?")
- Owner asks about production costs ("¿cuánto me cuesta hacer un gorro?", "¿cuánto gano por chompa?")
- Owner needs to plan for a deadline ("el pedido de Lima tiene que salir el viernes, ¿llego?")
- Owner records quality issues ("3 chompas tienen defectos, hay que rehacer")
- Owner asks about artisan performance ("¿quién me entrega más rápido?", "¿quién tiene menos defectos?")
- Owner needs to coordinate materials distribution ("mañana reparto lana a las tejedoras")
- Owner asks about pending orders ("¿cuántos pedidos tengo abiertos?", "¿qué me falta entregar?")
- Owner needs a production summary for pricing decisions ("si me cuesta S/42 hacer una chompa, ¿a cuánto la vendo?")
- Owner wants to send production reminders to artisans ("recuérdale a Julia que necesito los gorros el jueves")
- A production deadline is approaching and progress is behind schedule (proactive alert)
- A periodic production status report triggers via cron

## Target Users
- **Textiles/tejidos** — Tejedoras networks (alpaca, oveja, algodón). Juliaca, Puno, Cusco, Huancavelica. 15-50K producers.
- **Confección/moda** — Talleres de costura. Gamarra (Lima), Arequipa. 30-50K businesses.
- **Carpintería/mueblería** — Wood workshops. Lima, Huancayo, Cusco. 20-30K businesses.
- **Joyería/orfebrería** — Silver and gold artisans. Lima, Catacaos (Piura), Cusco. 5-10K.
- **Marroquinería/talabartería** — Leather goods. Lima, Arequipa, Trujillo. 5-10K.
- **Cerámica/alfarería** — Pottery and ceramics. Quinua (Ayacucho), Chulucanas (Piura). 5-10K.
- **Zapatería** — Shoe manufacturing. Trujillo (El Porvenir), Lima. 15-20K.
- **Soldadura/metalmecánica** — Metal fabrication. Lima, Arequipa. 15-20K.
- **Any small manufacturer** with a distributed artisan/worker network producing goods to order

## Capabilities

### Core: Production Orders (Pedidos de Producción)
- **Create from chat** — "Me pidieron 50 gorros de alpaca para un cliente de Lima, necesito para el 4 de abril" → creates production order with: product, quantity, client (via CRM), deadline, status=planificado
- **Link to sales order** — If order came from yaya-quotes or yaya-sales, auto-link for traceability
- **Order status lifecycle** — planificado → en_produccion → control_calidad → listo → entregado
- **Multi-product orders** — "Pedido de Rosa's Boutique: 20 chompas, 30 gorros, 15 chalinas" → single order with multiple line items, each tracked independently
- **Deadline visibility** — "¿Qué pedidos tengo para esta semana?" → sorted by deadline, color-coded by risk (verde=on track, amarillo=tight, rojo=atrasado)
- **Order dashboard** — "¿Cuántos pedidos tengo abiertos?" → count, total units, total value, next deadline

### Core: Artisan Assignment & Capacity
- **Register artisans** — "Mis tejedoras son: Carmen (rápida, gorros y chompas), Julia (chompas y chalinas), Martha (gorros, lenta pero buena calidad)" → artisan profile with skills, speed rating, quality rating, location
- **Assign work** — "Dale 20 gorros a Carmen y 30 a Julia" → creates assignments linked to production order. Tracks: artisan, product, quantity, assigned_date, expected_delivery
- **Capacity check** — "¿Carmen puede con más trabajo?" → checks current assignments: "Carmen tiene 20 gorros pendientes (entrega 28/03). Si le das más, podría terminar hacia el 5/04"
- **Workload view** — "¿Quién tiene disponibilidad?" → lists all artisans with current load and estimated completion dates
- **Artisan specializations** — Track what each artisan can produce and their typical speed: "Carmen hace 3 gorros/día, Julia hace 2 chompas/día"
- **Integration: crm-mcp** — Artisans stored as CRM contacts with type=artesano/proveedor, skills and capacity in metadata

### Core: Production Progress Tracking
- **Record delivery** — "Carmen me entregó 18 gorros" → updates assignment: 18 of 20 received, 2 pending
- **Partial deliveries** — Track multiple deliveries against an assignment: "Carmen entregó 10 el lunes, 8 el miércoles"
- **Quality inspection** — "De los 18, 2 tienen defectos" → 16 aceptados, 2 rechazados (defecto). Rejection rate tracked per artisan
- **Rework tracking** — "Los 2 defectuosos, que Carmen los rehaga" → creates rework assignment, linked to original
- **Progress percentage** — "¿Cómo va el pedido de Lima?" → "Gorros: 16/50 listos (32%). Chompas: 8/20 (40%). Chalinas: 0/15 (0%). Deadline: 4 abril (14 días)"
- **Proactive alerts** — If progress rate suggests missing deadline: "⚠️ Al ritmo actual, los gorros estarían listos el 8 de abril. El deadline es el 4. ¿Asignas más tejedoras?"
- **Voice note updates** — Owner sends voice: "Carmen ya me trajo los gorros, fueron 18, dos salieron chuecos" → parsed into delivery + quality record

### Core: Raw Material Management
- **Material distribution** — "Le di 5kg de lana alpaca a Carmen para los gorros" → records material issued to artisan, deducts from inventory
- **Material per unit** — "Un gorro lleva 200g de lana" → sets bill of materials (BOM). Auto-calculates: 50 gorros × 200g = 10kg needed
- **Material requirement** — "¿Cuánta lana necesito para el pedido de Lima?" → calculates from BOM × quantity, compares vs stock
- **Waste/remnant tracking** — "Carmen me devolvió 300g de lana sobrante" → records return, updates material balance
- **Material cost tracking** — Links to yaya-expenses: "La lana alpaca me costó S/45/kg" → feeds into per-unit production cost
- **Integration: yaya-inventory** — Stock levels for raw materials. Deductions on material issue, additions on returns

### Core: Production Costing
- **Per-unit cost calculation** — Automatic: materials + labor = production cost per unit
  - Materials: BOM × material cost (from yaya-expenses/yaya-inventory)
  - Labor: artisan payment per unit (from yaya-commissions/yaya-expenses)
  - Example: "Gorro: lana 200g × S/45/kg = S/9 + tejedora S/8 = costo S/17"
- **Margin calculation** — "Si el gorro me cuesta S/17 y lo vendo a S/35, gano S/18 (51%)"
- **Cost trend** — "El costo del gorro subió de S/15 a S/17 este mes porque la lana subió"
- **Batch costing** — For the entire production order: "Pedido Lima: 50 gorros × S/17 = S/850 costo. Venta S/1,750. Ganancia S/900"
- **What-if pricing** — "Si la lana sube a S/50/kg, el gorro me costaría S/19. Para mantener 50% margen, tendría que vender a S/38"
- **Integration: yaya-expenses** — Material costs, artisan payments flow into expense tracking for P&L

### Core: Artisan Payment Management
- **Payment per piece** — "A Carmen le pago S/8 por gorro, S/25 por chompa" → per-piece rates by artisan and product
- **Payout calculation** — "¿Cuánto le debo a Carmen esta semana?" → 18 gorros × S/8 = S/144, minus S/50 adelanto = S/94 a pagar
- **Advance payments (adelantos)** — "Le di S/50 de adelanto a Carmen" → recorded against future payout
- **Material deductions** — "Carmen perdió 200g de lana" → S/9 deducted from next payout (or recorded as loss if owner absorbs)
- **Quality deductions** — If rejected units had material cost, can optionally deduct from artisan payment
- **Payment history** — "¿Cuánto le he pagado a Carmen este mes?" → S/520 (65 gorros delivered)
- **Integration: yaya-commissions** — Artisan payments tracked as per-piece commissions
- **Integration: yaya-expenses** — Artisan payments recorded as planilla/mano_de_obra expenses

### Core: Deadline & Timeline Management
- **Backward scheduling** — "Necesito 50 gorros para el 4 de abril. Carmen hace 3/día, Julia hace 2/día" → "Si empiezan hoy (21/03): Carmen termina sus 20 el 28/03, Julia termina sus 30 el 5/04. ⚠️ Julia no llega. Opciones: (1) dale 25 a Julia y 25 a Carmen, (2) agrega otra tejedora"
- **Timeline view** — "¿Cuándo estará listo cada pedido?" → ordered list with status bar: "🟢 Pedido Arequipa: 85% (2 días antes). 🟡 Pedido Lima: 35% (justo). 🔴 Pedido Cusco: 10% (atrasado 3 días)"
- **Milestone reminders** — Auto-reminders: "Mañana es el 50% checkpoint del pedido Lima. Llevas 32%. ¿Revisamos?"
- **Artisan reminders** — "Recuérdale a Julia que necesito los gorros el jueves" → WhatsApp message via whatsapp-mcp
- **Buffer planning** — "Agrega 2 días de buffer para control de calidad y empaque"

### Core: Quality Control
- **Inspection checklist per product** — "Para chompas: revisar costuras, color uniforme, medidas, etiqueta" → stored per product type
- **Accept/reject flow** — "Carmen entregó 20 chompas. 17 OK, 2 costura floja, 1 color desigual" → 17 accepted, 3 rejected with reasons
- **Rejection rate per artisan** — "Carmen: 5% rechazo (buena). Martha: 12% (necesita supervisión). Julia: 3% (excelente)"
- **Rejection trends** — "Este mes el rechazo subió de 5% a 9%. ¿Lana de peor calidad? ¿Tejedoras nuevas?"
- **Rework vs scrap** — Rejected items classified as: rework (artisan fixes), scrap (unsalvable), or second-quality (sell cheaper)

### Reporting
- **Production summary** — "¿Cómo va la producción este mes?" → Units produced, units pending, rejection rate, artisan utilization, material consumption, total production cost
- **Artisan performance** — Ranking by: speed (units/day), quality (rejection %), reliability (on-time %), volume
- **Cost analysis** — Production cost breakdown: materials %, labor %, overhead %
- **Order profitability** — Per-order P&L: revenue - materials - labor - shipping = gross profit
- **Capacity planning** — "¿Puedo aceptar un pedido de 100 chompas para mayo?" → checks artisan capacity, material availability, timeline feasibility
- **WhatsApp-formatted** — All reports formatted for mobile: bullets, emojis, short lines. No markdown tables.

## MCP Tools Required
- `postgres-mcp` — Primary: production orders, assignments, deliveries, quality records, material issues, artisan profiles, BOM, rework tracking
- `crm-mcp` — Artisan contacts with skills/capacity metadata, client contacts for orders
- `whatsapp-mcp` — Artisan reminders, delivery confirmations, production status updates to clients
- `erpnext-mcp` — Raw material inventory (stock levels, costs), finished goods receiving
- `yaya-expenses` — Material costs, artisan payments as expenses
- `yaya-commissions` — Per-piece artisan payment tracking

## Data Model

```sql
-- ══════════════════════════════════════════════════════════
-- PRODUCTION ORDERS (pedidos de producción)
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS production.orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID NOT NULL,
    order_number TEXT,                    -- auto-generated: PRD-2026-001
    client_id UUID,                       -- CRM contact reference
    client_name TEXT,                     -- denormalized for quick display
    sales_order_id UUID,                  -- link to yaya-sales/yaya-quotes if applicable
    status TEXT DEFAULT 'planificado' CHECK (status IN (
        'planificado', 'en_produccion', 'control_calidad', 'listo', 'entregado', 'cancelado'
    )),
    deadline DATE NOT NULL,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    notes TEXT,
    total_units INTEGER DEFAULT 0,        -- sum of line items
    total_cost NUMERIC(12,2) DEFAULT 0,   -- calculated production cost
    total_revenue NUMERIC(12,2),          -- expected revenue
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_po_business ON production.orders(business_id, status);
CREATE INDEX idx_po_deadline ON production.orders(deadline);
CREATE INDEX idx_po_client ON production.orders(client_id);

-- ══════════════════════════════════════════════════════════
-- ORDER LINE ITEMS (products within an order)
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS production.order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES production.orders(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,            -- "gorro alpaca", "chompa modelo clásico"
    product_code TEXT,                     -- ERPNext item code if exists
    quantity INTEGER NOT NULL,
    units_completed INTEGER DEFAULT 0,     -- accepted + good quality
    units_rejected INTEGER DEFAULT 0,      -- failed quality
    units_rework INTEGER DEFAULT 0,        -- sent back for fixes
    unit_sale_price NUMERIC(10,2),        -- selling price per unit
    unit_cost NUMERIC(10,2),              -- calculated production cost per unit
    specifications TEXT,                   -- "color: gris claro, talla: M, modelo: clásico"
    status TEXT DEFAULT 'pendiente' CHECK (status IN (
        'pendiente', 'en_produccion', 'parcial', 'completo'
    )),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_oi_order ON production.order_items(order_id);

-- ══════════════════════════════════════════════════════════
-- ARTISAN PROFILES
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS production.artisans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID NOT NULL,
    contact_id UUID,                       -- CRM contact reference
    name TEXT NOT NULL,
    phone TEXT,
    location TEXT,                         -- "Juliaca", "Santa Lucía"
    skills TEXT[],                          -- ['gorros', 'chompas', 'chalinas']
    speed_rating TEXT DEFAULT 'normal' CHECK (speed_rating IN (
        'rapida', 'normal', 'lenta'
    )),
    quality_rating TEXT DEFAULT 'buena' CHECK (quality_rating IN (
        'excelente', 'buena', 'regular', 'requiere_supervision'
    )),
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_artisan_business ON production.artisans(business_id, is_active);

-- ══════════════════════════════════════════════════════════
-- ARTISAN RATES (payment per piece)
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS production.artisan_rates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    artisan_id UUID NOT NULL REFERENCES production.artisans(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,            -- "gorro", "chompa"
    rate_per_unit NUMERIC(10,2) NOT NULL,  -- S/8 per gorro
    units_per_day NUMERIC(5,2),            -- estimated daily output: 3 gorros/day
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_to DATE,                     -- NULL = current rate
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_rates_artisan ON production.artisan_rates(artisan_id, product_name);

-- ══════════════════════════════════════════════════════════
-- ASSIGNMENTS (work distributed to artisans)
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS production.assignments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_item_id UUID NOT NULL REFERENCES production.order_items(id) ON DELETE CASCADE,
    artisan_id UUID NOT NULL REFERENCES production.artisans(id),
    quantity_assigned INTEGER NOT NULL,
    quantity_delivered INTEGER DEFAULT 0,   -- total received from artisan
    quantity_accepted INTEGER DEFAULT 0,    -- passed quality check
    quantity_rejected INTEGER DEFAULT 0,    -- failed quality check
    rate_per_unit NUMERIC(10,2) NOT NULL,   -- payment rate for this assignment
    assigned_date DATE DEFAULT CURRENT_DATE,
    expected_delivery DATE,
    actual_delivery DATE,
    status TEXT DEFAULT 'asignado' CHECK (status IN (
        'asignado', 'en_progreso', 'entregado_parcial', 'entregado', 'completado'
    )),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_assign_order ON production.assignments(order_item_id);
CREATE INDEX idx_assign_artisan ON production.assignments(artisan_id, status);

-- ══════════════════════════════════════════════════════════
-- DELIVERIES (artisan → owner, piece by piece)
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS production.deliveries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    assignment_id UUID NOT NULL REFERENCES production.assignments(id) ON DELETE CASCADE,
    quantity_delivered INTEGER NOT NULL,
    quantity_accepted INTEGER NOT NULL DEFAULT 0,
    quantity_rejected INTEGER NOT NULL DEFAULT 0,
    rejection_reasons JSONB,               -- [{"qty": 2, "reason": "costura floja"}, {"qty": 1, "reason": "color desigual"}]
    delivered_at TIMESTAMPTZ DEFAULT now(),
    inspected_by TEXT,                      -- owner or delegate
    notes TEXT
);

CREATE INDEX idx_delivery_assign ON production.deliveries(assignment_id);

-- ══════════════════════════════════════════════════════════
-- REWORK ORDERS
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS production.rework (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    delivery_id UUID NOT NULL REFERENCES production.deliveries(id),
    artisan_id UUID NOT NULL REFERENCES production.artisans(id),
    quantity INTEGER NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pendiente' CHECK (status IN (
        'pendiente', 'en_progreso', 'completado', 'descartado'
    )),
    completed_at TIMESTAMPTZ,
    additional_cost NUMERIC(10,2) DEFAULT 0,  -- extra material or payment
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_rework_artisan ON production.rework(artisan_id, status);

-- ══════════════════════════════════════════════════════════
-- BILL OF MATERIALS (BOM) — materials per unit
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS production.bom (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID NOT NULL,
    product_name TEXT NOT NULL,             -- "gorro alpaca"
    material_name TEXT NOT NULL,            -- "lana alpaca"
    material_code TEXT,                     -- ERPNext item code
    quantity_per_unit NUMERIC(10,4) NOT NULL, -- 0.2000 (200g = 0.2kg)
    unit TEXT DEFAULT 'kg',                 -- kg, m, unidad, litro
    cost_per_material_unit NUMERIC(10,2),   -- S/45 per kg (cached from expenses/inventory)
    cost_per_product_unit NUMERIC(10,2) GENERATED ALWAYS AS (quantity_per_unit * cost_per_material_unit) STORED,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(business_id, product_name, material_name)
);

CREATE INDEX idx_bom_business ON production.bom(business_id, product_name);

-- ══════════════════════════════════════════════════════════
-- MATERIAL ISSUES (raw materials given to artisans)
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS production.material_issues (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    assignment_id UUID REFERENCES production.assignments(id),
    artisan_id UUID NOT NULL REFERENCES production.artisans(id),
    material_name TEXT NOT NULL,
    material_code TEXT,
    quantity_issued NUMERIC(10,4) NOT NULL,  -- 5.000 kg
    quantity_returned NUMERIC(10,4) DEFAULT 0, -- 0.300 kg sobrante
    unit TEXT DEFAULT 'kg',
    cost_per_unit NUMERIC(10,2),             -- S/45/kg at time of issue
    total_cost NUMERIC(10,2),
    issued_at TIMESTAMPTZ DEFAULT now(),
    returned_at TIMESTAMPTZ,
    notes TEXT
);

CREATE INDEX idx_mi_artisan ON production.material_issues(artisan_id);
CREATE INDEX idx_mi_assignment ON production.material_issues(assignment_id);

-- ══════════════════════════════════════════════════════════
-- ARTISAN PAYMENTS (payout tracking)
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS production.artisan_payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    artisan_id UUID NOT NULL REFERENCES production.artisans(id),
    business_id UUID NOT NULL,
    payment_type TEXT NOT NULL CHECK (payment_type IN (
        'produccion', 'adelanto', 'bonificacion', 'deduccion'
    )),
    amount NUMERIC(10,2) NOT NULL,          -- positive for payments/advances, negative for deductions
    payment_method TEXT DEFAULT 'efectivo',
    period_start DATE,                       -- payment covers this period
    period_end DATE,
    units_paid_for INTEGER,                  -- number of pieces this payment covers
    reference_assignments UUID[],            -- which assignments this payment covers
    notes TEXT,
    paid_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ap_artisan ON production.artisan_payments(artisan_id, paid_at);
CREATE INDEX idx_ap_business ON production.artisan_payments(business_id, paid_at);
```

## Behavior Guidelines

### The Artisan Network Reality
- **The owner is the only system user.** Artisans don't have smartphones, don't use apps, and shouldn't be required to. The owner manages everything through WhatsApp with Yaya.
- **Production is informal.** No barcodes, no lot numbers (unless for export). Tracking is by name, color, and approximate count. "Los gorros grises de Carmen" is a valid identifier.
- **Quality is subjective.** "Está bien" or "está chuecos" is the inspection method. Don't require formal QC checklists unless the owner wants them.
- **Deadlines are soft.** "Para la próxima semana" means "around next week." Be helpful about tracking but don't panic about 1-2 day slips.
- **Cash is king.** Artisan payments are almost always in cash, weekly. Track amounts, not payment methods.
- **Materials are expensive.** Alpaca lana is S/40-60/kg. Losing 500g matters. Material tracking is about cost control, not warehouse management.
- **Weather and seasons matter.** Rainy season slows work (drying textiles). Cold season increases demand. Feria season (Candelaria, Fiestas Patrias) drives production spikes.

### Language & Tone
- **Natural Peruvian Spanish.** Use "tejedora" not "operaria." Use "lana" not "fibra textil." Use "salió chueco" not "defecto de manufactura."
- **Informal and practical.** "Dale" not "Confirmo la asignación." "Listo" not "Registro completado."
- **Quantities are approximate.** "Le di como 5 kilos" is a valid input. Don't demand precision beyond what the owner provides.
- **Names are primary identifiers.** "Los gorros de Carmen" not "Assignment #PRD-2026-001-A1." Use names first, codes internally.

### Privacy & Sensitivity
- **Artisan payment rates are confidential.** Don't share Carmen's rate with Julia. Each artisan sees only their own payout.
- **Quality ratings are private.** Never tell an artisan their quality rating or compare them to others in messages. This data is for the owner only.
- **Payment deductions are sensitive.** If material was lost, frame it as "material que no cuadró" not "te robasté la lana."
- **Artisan personal data stays private.** Addresses, phone numbers, payment history — only visible to the business owner.

## Example Flows

### New Production Order
```
Rosa: "Me pidieron 50 gorros de alpaca para un cliente de Lima, necesito para el 4 de abril"
Agente: "📋 Pedido nuevo registrado:

         🧶 50 gorros alpaca
         👤 Cliente Lima (¿quién es? Nombre o teléfono)
         📅 Deadline: 4 de abril (14 días)

         Materiales necesarios:
         • Lana alpaca: 10kg (200g × 50)
         • Stock actual: 12kg ✅ Alcanza

         ¿A quién le asigno? Tus tejedoras disponibles:
         • Carmen — 5 gorros pendientes (termina 24/03)
         • Julia — libre
         • Martha — 10 chompas pendientes (termina 30/03)

         ¿Cómo repartimos?"

Rosa: "Sr. Rodríguez de Rosa's Boutique. Dale 25 a Carmen y 25 a Julia"
Agente: "Pedido asignado ✅

         📋 PRD-2026-012: 50 gorros alpaca
         👤 Sr. Rodríguez — Rosa's Boutique
         📅 Deadline: 4 de abril

         Asignaciones:
         • Carmen: 25 gorros (S/8 c/u = S/200)
           ⏰ 3/día → termina ~29/03 ✅
         • Julia: 25 gorros (S/8 c/u = S/200)
           ⏰ 2.5/día → termina ~1/04 ✅

         💰 Costo producción: S/1,250
         • Lana: 10kg × S/45 = S/450
         • Mano de obra: 50 × S/8 = S/400
         • Otros: ~S/400 (empaque, transporte)
         📊 Si vendes a S/35 c/u: ganancia ~S/500 (29%)

         ¿Le reparto la lana mañana?"
```

### Recording a Delivery
```
Rosa: "Carmen me trajo 18 gorros, pero 2 salieron chuecos"
Agente: "Entrega registrada ✅

         👩 Carmen — Gorros alpaca
         ✅ Aceptados: 16
         ❌ Rechazados: 2 (chuecos)
         📊 Pendientes: 25 - 16 = 9 gorros más

         ¿Qué hacemos con los 2 chuecos?
         1. Carmen los rehace (sin costo extra)
         2. Se venden como segunda calidad
         3. Descartados (pérdida: S/17 c/u = S/34)

         📊 Tasa de rechazo Carmen: 11% este lote
            (promedio histórico: 5%)

         ¿Le digo algo a Carmen?"

Rosa: "Que los rehaga. Y sí, dile que tenga más cuidado con las costuras"
Agente: "Registrado ✅
         • 2 gorros en rework → Carmen
         • Carmen ahora tiene: 9 nuevos + 2 rework = 11 pendientes

         Le mando mensaje:
         '¡Hola Doña Carmen! Recibí los gorros, están lindos
          la mayoría 🧶 Solo 2 salieron con la costura un
          poquito floja. ¿Me los puedes arreglar junto con
          los que faltan? ¡Gracias!'

         ¿Lo envío?"

Rosa: "Sí, dale"
Agente: "Enviado ✅"
```

### Checking Progress
```
Rosa: "¿Cómo va el pedido de Lima?"
Agente: "📋 Pedido PRD-2026-012 — Sr. Rodríguez (Lima)
         📅 Deadline: 4 de abril (12 días)

         🧶 50 gorros alpaca:

         • Carmen: 16/25 ✅ aceptados + 11 pendientes
           ⏰ ~4 días más → 25/03 ✅
         • Julia: 8/25 ✅ aceptados + 17 pendientes
           ⏰ ~7 días más → 28/03 ✅

         📊 Total: 24/50 (48%) — 🟢 En tiempo

         💰 Pagado a tejedoras: S/192 de S/400
         🧶 Lana usada: ~5.2kg de 10kg

         ¡Va bien! Deberían terminar con una semana de
         margen para calidad y empaque 👍"
```

### Capacity Planning
```
Rosa: "¿Puedo aceptar un pedido de 100 chompas para mayo?"
Agente: "Veamos la capacidad 🤔

         📊 Producción actual de chompas:
         • Carmen: 1.5 chompas/día (pero tiene gorros hasta 25/03)
         • Julia: 2 chompas/día (libre desde 1/04)
         • Martha: 1 chompa/día (termina pedido actual 30/03)

         📅 Si empiezan el 1/04 (todos libres):
         • Carmen: 1.5/día × 30 días = 45 chompas
         • Julia: 2/día × 30 días = 60 chompas
         • Martha: 1/día × 30 días = 30 chompas
         • Total capacidad: 135 chompas/mes

         ✅ 100 chompas en abril es factible

         💰 Costo estimado:
         • Lana: 100 × 500g × S/45/kg = S/2,250
         • Mano obra: 100 × S/25 = S/2,500
         • Total: ~S/4,750
         📊 A S/85 c/u: ganancia ~S/3,750 (44%)

         🧶 Necesitas: 50kg de lana. Tienes ~7kg.
         Hay que comprar ~43kg (S/1,935)

         ¿Acepto el pedido?"
```

### Artisan Payout
```
Rosa: "¿Cuánto le debo a Carmen esta semana?"
Agente: "💰 Pago semanal — Doña Carmen (17-21 mar)

         Producción entregada:
         • 18 gorros × S/8 = S/144
         • 3 chompas × S/25 = S/75
         ─────────────────────────
         📊 Subtotal: S/219

         ➖ Adelanto (lunes): -S/50
         ➖ Lana faltante (300g): -S/13.50
         ─────────────────────────
         💰 A pagar: S/155.50

         📊 Carmen este mes: S/520 (65 piezas)
         ⭐ Calidad: 95% aceptación

         ¿Le pago y registro?"

Rosa: "Sí, ya le pagué en efectivo"
Agente: "Registrado ✅ Pago S/155.50 a Carmen (efectivo)
         📊 Registrado como gasto: mano de obra"
```

### Material Distribution
```
Rosa: "Mañana reparto lana a las tejedoras"
Agente: "📦 Plan de distribución para mañana:

         Pedido activo: 50 gorros (PRD-2026-012)

         🧶 Distribución sugerida:
         • Carmen: 2kg (para 9 gorros + 2 rework)
           → Ya tiene: 0.5kg | Dar: 1.5kg
         • Julia: 3.4kg (para 17 gorros pendientes)
           → Ya tiene: 0kg | Dar: 3.4kg

         📊 Total a distribuir: 4.9kg
         📦 Stock lana alpaca: 6.8kg
         ✅ Queda: 1.9kg de reserva

         ⚠️ Si aceptas el pedido de 100 chompas,
         necesitarás comprar ~43kg más.
         ¿Llamo al acopiador?

         ¿Confirmo la distribución?"
```

### Weekly Production Summary
```
Rosa: "¿Cómo va la producción esta semana?"
Agente: "📊 Resumen semanal — 17 al 21 de marzo

         📋 Pedidos activos: 3
         • PRD-012: 50 gorros Lima — 48% ✅ en tiempo
         • PRD-011: 15 chalinas Arequipa — 80% ✅ casi listo
         • PRD-010: 5 ponchos Cusco — 100% ✅ listo para enviar

         👩‍🔧 Producción por tejedora:
         • Carmen: 18 gorros + 3 chompas = 21 piezas ⭐
         • Julia: 8 gorros + 2 chalinas = 10 piezas
         • Martha: 5 chalinas + 1 poncho = 6 piezas

         📊 Calidad:
         • Aceptadas: 35 de 37 (94.6%) ✅
         • Rechazadas: 2 (ambas de Carmen, en rework)

         💰 Costos de producción: S/567
         • Materiales: S/234
         • Mano de obra: S/333

         💰 Pagos a tejedoras esta semana: S/333
         • Carmen: S/219
         • Julia: S/80
         • Martha: S/34

         🧶 Lana usada: 7.4kg | Stock restante: 6.8kg
         ⚠️ Pedir lana antes del miércoles

         ¿Quieres ver detalle de algún pedido?"
```

### Deadline Risk Alert (Proactive)
```
Agente: "⚠️ Alerta de producción — Pedido Lima

         📋 PRD-012: 50 gorros alpaca
         📅 Deadline: 4 de abril (7 días)
         📊 Progreso: 30/50 (60%)

         Al ritmo actual:
         • Carmen: 5 pendientes → 2 días ✅
         • Julia: 15 pendientes → 6 días ⚠️

         Julia terminaría el 3 de abril — sin margen
         para calidad y empaque.

         Opciones:
         1. Pedir a Carmen que ayude con 5 más
            (ella termina los suyos en 2 días)
         2. Llamar a Doña Lucía (tejedora eventual)
         3. Hablar con el cliente para extender 3 días

         ¿Qué hacemos?"
```

## Scheduling via OpenClaw Cron

```yaml
production_jobs:
  daily_progress:
    schedule: "0 19 * * 1-6"              # Mon-Sat at 7 PM
    description: "Daily production progress check — alert if any order is behind"

  weekly_summary:
    schedule: "0 10 * * 6"                # Saturday at 10 AM
    description: "Weekly production summary: orders, deliveries, quality, costs"

  deadline_check:
    schedule: "0 8 * * *"                  # Every day at 8 AM
    description: "Check orders due within 3 days — alert if not on track"

  material_check:
    schedule: "0 9 * * 1"                  # Monday at 9 AM
    description: "Check raw material levels vs active orders"

  payout_reminder:
    schedule: "0 8 * * 5"                  # Friday at 8 AM
    description: "Weekly artisan payout calculation and reminder"

  artisan_reminder:
    schedule: "0 9 * * 3"                  # Wednesday at 9 AM
    description: "Mid-week production reminder to artisans with pending deliveries"
```

## Configuration
- `PRODUCTION_DEADLINE_WARNING_DAYS` — Days before deadline to start warning (default: 3)
- `PRODUCTION_PROGRESS_CHECK_ENABLED` — Enable daily progress checks (default: true)
- `PRODUCTION_QUALITY_REJECTION_ALERT` — Alert when rejection rate exceeds this % (default: 10)
- `PRODUCTION_MATERIAL_LOW_THRESHOLD` — Alert when material stock covers fewer than X days of production (default: 5)
- `PRODUCTION_PAYOUT_DAY` — Day of week for artisan payouts (default: "viernes")
- `PRODUCTION_DEFAULT_BUFFER_DAYS` — Default buffer days for quality + packing before shipping (default: 2)
- `PRODUCTION_AUTO_COST_CALC` — Auto-calculate per-unit cost from BOM + labor (default: true)
- `PRODUCTION_REWORK_RATE_LIMIT` — Maximum acceptable rework rate before alert (default: 15)
- `PRODUCTION_CURRENCY` — Currency code (default: "PEN")
- `BUSINESS_TIMEZONE` — Timezone (default: "America/Lima")

## Integration Points

### With yaya-expenses
- Material purchases recorded as expenses (category: materiales)
- Artisan payments recorded as expenses (category: mano_de_obra)
- Production overhead (transport, packing) as operating expenses
- Per-order profitability feeds into P&L

### With yaya-inventory / erpnext-mcp
- Raw material stock levels checked before assignments
- Material issues deducted from inventory
- Finished goods added to inventory on completion
- BOM material costs synced from inventory purchase prices

### With yaya-commissions
- Artisan per-piece rates managed as commission structures
- Payout calculations leverage commission tracking
- Performance bonuses tracked as bonificaciones

### With yaya-suppliers
- Raw material purchase orders (lana from acopiador)
- Supplier price comparison for materials
- Delivery tracking for incoming materials

### With crm-mcp
- Artisans stored as contacts (type=artesano)
- Clients stored as contacts with order history
- Interaction logging for artisan communications

### With whatsapp-mcp
- Production reminders sent to artisans
- Delivery status updates sent to clients
- Payout notifications sent to artisans
- Material pickup coordination messages

### With yaya-quotes
- Sales quotations linked to production orders
- Quote → order → production flow
- Per-unit pricing informed by production cost

### With yaya-logistics
- Finished goods shipping coordination
- Interprovincial bus shipping rates and tracking
- Client delivery notifications

## Error Handling & Edge Cases
- **Artisan not in system:** "No tengo registrada a Lucía. ¿La agrego? Necesito nombre y qué sabe hacer."
- **No BOM defined:** "No tengo la receta del gorro. ¿Cuánta lana lleva?" — still create order but flag missing BOM.
- **Delivery exceeds assignment:** "Carmen trajo 30 gorros pero solo le asigné 25. ¿5 son de otro pedido o hizo extras?" Clarify before recording.
- **Material shortage:** "Necesitas 10kg de lana pero solo tienes 6.8kg. ¿Compro más antes de asignar?"
- **Artisan unavailable:** "Carmen está enferma y no puede trabajar esta semana. ¿Reasigno sus 9 gorros pendientes a Julia?"
- **Quality dispute:** If artisan disagrees with rejection: "Carmen dice que los gorros están bien. ¿Los revisamos juntos o le damos otra oportunidad?"
- **Late deadline:** If already past deadline: "El pedido de Lima tenía que salir ayer. ¿Hablo con el cliente para negociar nueva fecha?"
- **Zero cost data:** If no costs are recorded, still track production. Show "costo pendiente de calcular" rather than blocking.
- **Multiple products same order:** Handle naturally: "50 gorros y 20 chompas para el mismo cliente" → single order, two line items.
- **Artisan payment advance:** Record immediately, deduct from next payout. Track cumulative advances to avoid over-paying.
- **Seasonal capacity changes:** During feria season, artisans may take personal orders. Track reduced capacity: "Carmen solo puede dar 2 gorros/día esta semana (feria Candelaria)"
- **New artisan onboarding:** "Empezó a trabajar Doña Lucía, hace gorros. Es amiga de Carmen." → create profile, start with small assignment to assess quality.
