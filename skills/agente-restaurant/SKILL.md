# agente-restaurant — Menu Management, COGS & Food Service Operations

## Description
WhatsApp-native restaurant management for Peru's 143K+ formal restaurants (plus an estimated 200K+ informal food businesses). Covers menu management, cost-per-dish (COGS) tracking, daily purchase logging, sales-by-dish tracking, food cost percentage monitoring, perishable inventory, daily menu updates, staff meal tracking, waste tracking, recipe/portion standardization, and demand planning. Purpose-built for pollerías (Peru's #1 restaurant type), cevicherías, menú restaurants, chifas, and picanterías — where the owner buys fresh daily at the mercado mayorista, manages 10-30 dishes, runs on cash + Yape, and tracks everything in their head or a greasy cuaderno. Replaces mental math with real margins: "el pollo me cuesta S/23, lo vendo a S/35, me queda 34%" — and alerts when food cost creeps above 35%. Integrates with agente-expenses for daily P&L, agente-suppliers for purchase orders, and whatsapp-mcp for sharing today's menu with customers.

85.6% of Peru's restaurant workforce is informal. Average ticket: S/12-18 for menú, S/45-55 for pollo a la brasa combo. Food cost target: 30-35% of menu price. Cash is 40-60% of transactions outside Lima. Voice notes are the primary input: "Oye, compré 30 pollos hoy a dieciocho cada uno, apunta eso."

## When to Use
- Restaurant owner adds or edits a dish ("agrega ceviche a la carta", "el lomo saltado ahora cuesta S/28")
- Restaurant owner logs dish costs ("el pollo me cuesta S/18, las papas S/3, el arroz S/2")
- Restaurant owner logs daily purchases ("compré 50 pollos a S/18 cada uno en el mercado")
- Restaurant owner asks about sales by dish ("¿cuántos pollos vendí hoy?", "¿qué plato se vende más?")
- Restaurant owner asks about food cost percentage ("¿cómo anda mi costo de comida?", "¿estoy ganando?")
- Restaurant owner updates daily menu availability ("hoy no hay ceviche, se acabó el pescado")
- Restaurant owner tracks staff meals ("los chicos comieron 3 pollos", "merma de personal")
- Restaurant owner manages pollo a la brasa combos ("vendí 80 pollos hoy, 45 cuartos y 20 medios")
- Restaurant owner logs food waste ("se malograron 5 pollos", "botamos 3 kg de pescado")
- Restaurant owner wants to share today's menu via WhatsApp ("manda el menú del día a los clientes")
- Restaurant owner standardizes recipes/portions ("un cuarto de pollo lleva 350g de papa")
- Restaurant owner compares supplier prices for key ingredients ("¿quién me vende el pollo más barato?")
- Restaurant owner plans for Sunday/holiday rush ("¿cuántos pollos necesito para el domingo?")
- Food cost exceeds 35% threshold (proactive alert)
- A daily/weekly food cost report triggers via cron

## Target Users
- **Pollerías** — Peru's #1 restaurant type. Every neighborhood has one. Quarter/half/whole chicken combos. 40K+ nationwide.
- **Cevicherías** — Seafood-dependent, highly perishable inventory. Prices fluctuate daily with catch. 15K+.
- **Restaurantes de menú** — Daily set menu (entrada + segundo + refresco) at S/8-15. Highest volume, thinnest margins. 50K+.
- **Chifas** — Peruvian-Chinese restaurants. Large menus (50+ dishes), high wok-ingredient turnover. 15K+.
- **Picanterías** — Traditional regional restaurants (Arequipa, Cusco). Fixed weekly menus. 10K+.
- **Sangucherías/juguerías** — Sandwich and juice shops. Simple menus, fast turnover. 20K+.
- **Food trucks & carretillas** — Mobile food vendors. Minimal menu, maximum cost control needed.
- **Any food business** that buys ingredients daily and needs to know if they're making money

## Capabilities

### Core: Menu Management
- **Add dish from chat** — "Agrega lomo saltado a S/28" → creates dish with name, price, category auto-detected (segundo)
- **Menu categories** — Entradas, sopas, segundos, ceviches/mariscos, pollos/parrillas, guarniciones, bebidas, postres, menú del día
- **Edit price** — "El ceviche ahora cuesta S/35" → updates price, recalculates margin
- **Remove dish** — "Quita la causa del menú" → marks inactive (preserves history)
- **Daily menu toggle** — "Hoy no hay ceviche" → marks unavailable today. "Mañana sí hay" → re-enables
- **Combo/presentation variants** — Pollo: 1/4 S/25, 1/2 S/45, entero S/85. Ceviche: personal S/28, para 2 S/48
- **Menú del día** — "El menú de hoy: sopa de pollo, lomo saltado, chicha S/12" → sets today's fixed menu
- **Seasonal dishes** — "Solo vendemos rocoto relleno los viernes" → recurring availability rules

### Core: COGS Per Dish
- **Register ingredients** — "El pollo me cuesta S/18, las papas S/3, el arroz S/2, la ensalada S/1.50 = costo S/24.50"
- **Auto-calculate margin** — "Vendo a S/35 → margen S/10.50 (30%)" — shown immediately after COGS entry
- **Ingredient price updates** — "El pollo subió a S/20" → auto-recalculates COGS and margin for all dishes using pollo
- **Multi-ingredient tracking** — Track the same ingredient (pollo, arroz, aceite) across multiple dishes
- **Food cost percentage** — Target 30-35%. Calculated per dish and aggregate across menu
- **Margin alerts** — When ingredient price change pushes a dish below 30% margin: "Ojo: el 1/4 pollo bajó a 28% de margen. ¿Subimos el precio?"
- **Recipe costing** — Full recipe with portions: "1 lomo saltado = 200g lomo (S/12), 150g papa (S/1.50), 100g cebolla (S/0.80), 100g tomate (S/0.60), arroz 200g (S/0.80) = costo S/15.70"

### Core: Daily Purchase Logging
- **Log market purchases** — "Compré 50 pollos a S/18 c/u en el mercado" → S/900, category: pollo, source: mercado
- **Bulk purchase entry** — "Hoy compré: 50 pollos S/18, 20 kg papa S/2/kg, 10 kg arroz S/3.50/kg, 5 kg cebolla S/2/kg" → itemized entry
- **Voice purchase logging** — Voice note: "Compré treinta pollos a dieciocho cada uno" → parsed and logged
- **Auto-link to supplier** — If supplier is registered in agente-suppliers, auto-associate purchase
- **Market price tracking** — Records daily prices per ingredient for trend analysis
- **Purchase receipt photo** — Photo of market receipt/boleta → OCR extracts items and amounts
- **Auto-create expense** — Every purchase auto-creates an expense entry in agente-expenses (category: insumos alimentarios)

### Core: Daily Sales by Dish
- **Log sales by dish** — "Hoy vendí 45 pollos, 20 ceviches, 15 lomos" → records units sold per dish
- **Quick count** — "Pollos hoy: 45" → fast single-dish entry
- **Running total** — After each entry: "Pollos: 45 × S/35 = S/1,575. Total del día hasta ahora: S/3,200"
- **End-of-day count** — "Cierre: 45 pollos, 20 ceviches, 15 lomos, 80 menús" → full day summary
- **Revenue by dish** — "¿Qué plato me deja más plata?" → ranked by total margin contribution
- **Dish velocity** — "¿Cuántos ceviches vendo al día en promedio?" → trailing 7/30-day average
- **Slow movers** — "¿Qué plato no se vende?" → identifies dishes with <2 units/day average

### Core: Food Cost Percentage Tracking
- **Daily food cost %** — Total purchases ÷ total revenue × 100. Target: 30-35%
- **Per-dish food cost %** — Ingredient cost ÷ selling price × 100
- **Weekly food cost trend** — "📈 Lunes 32%, Martes 34%, Miércoles 38% ⚠️ — el miércoles compraste de más"
- **Alert when exceeding** — If daily food cost >35%: "⚠️ Tu costo de comida hoy es 38%. Revisa si compraste de más o si algo se desperdició"
- **Monthly food cost report** — Average food cost %, trend vs previous month, top cost drivers
- **Benchmark** — "Tu costo de comida (33%) está dentro del rango saludable (30-35%) para pollerías"

### Core: Perishable Inventory
- **What was bought today** — "¿Qué compré hoy?" → list of today's purchases with quantities
- **What's left** — "¿Cuánto pollo me queda?" → estimated based on purchases - sales - waste - staff meals
- **What to buy tomorrow** — Based on average daily usage and remaining stock: "Necesitas 40 pollos, 15 kg papa, 5 kg arroz"
- **Expiry awareness** — Seafood: use within 24h. Pollo: 24-48h. Vegetables: 2-3 days. Rice/dry goods: weeks
- **FIFO tracking** — "Usa primero el pescado de ayer antes del de hoy"
- **Morning prep list** — Cron at 5 AM: "📋 Hoy necesitas preparar: 50 pollos (tienes 52 ✅), 5 kg arroz (tienes 8 ✅), ensalada para 50..."

### Pollo a la Brasa Specific
- **Chicken combos** — Track sales by presentation: 1/4 (S/25), 1/2 (S/45), entero (S/85), familiar (S/120)
- **Rotisserie count** — "Puse 30 pollos en el horno" → tracks batches. "Me quedan 8 sin vender" → end-of-day waste potential
- **Whole chicken conversion** — 1 entero = 2 medios = 4 cuartos. Track in whole-chicken equivalents: "Hoy vendiste 80 pollos equivalentes"
- **Combo tracking** — 1/4 pollo + papas + ensalada + gaseosa = combo standard. Track combo vs individual sales
- **Papas fritas tracking** — Kg of potatoes per batch, portions per kg. "20 kg papa → ~80 porciones de papas fritas"
- **Ensalada tracking** — Portions prepared vs served. Staff ensalada consumption separate
- **Peak hour tracking** — Lunch rush (12-2 PM) vs dinner rush (7-9 PM) sales by presentation
- **Charcoal/gas tracking** — "Hoy usé 2 sacos de carbón" → tracks fuel cost per chicken

### Staff Meals (Merma por Personal)
- **Log staff meals** — "Los chicos comieron 3 pollos y 5 porciones de papas" → deducted from inventory, tracked as merma
- **Staff meal policy** — Set daily allowance: "Cada trabajador come 1 menú del día" → auto-deduct
- **Staff meal cost** — Monthly report: "Merma de personal: S/1,200 (4.5% del costo de comida)"
- **Distinguish merma types** — Staff meals vs waste vs spoilage vs theft/unaccounted

### Waste Tracking
- **Log waste** — "Se malograron 5 pollos" → records waste with reason (spoiled, overcooked, dropped, returned)
- **Waste by category** — Spoilage (se malogró), overcooking (se quemó), customer return (devuelto), end-of-day (sobró)
- **Waste percentage** — "Tu merma de pollo es 4% — el promedio del rubro es 3-5%"
- **Waste cost** — "Esta semana botaste S/350 en comida. Eso es 2.5% de tus ventas"
- **Waste reduction tips** — "3 pollos sobraron ayer. ¿Consideras reducir la tanda del martes de 50 a 45?"

### Recipe & Portion Standardization
- **Standard portions** — "1/4 pollo = 350g pollo + 200g papas + 100g ensalada + 1 crema + 1 ají"
- **Yield tracking** — "1 pollo entero (1.8 kg) → 4 cuartos. Merma de hueso/grasa: ~15%"
- **Portion cost** — Auto-calculate cost per portion based on ingredient prices and standard portions
- **Variation alerts** — If actual usage vs standard differs >10%: "Estás usando 20% más papa de lo estándar. ¿Porciones más grandes o desperdicio?"
- **Recipe cards** — Store standardized recipes for consistency when training new staff

### Supplier Price Comparison (for key ingredients)
- **Track prices across suppliers** — "Pollo: Avícola S/17, Mercado S/18, Don Carlos S/16.50"
- **Auto-link with agente-suppliers** — Pull supplier prices from agente-suppliers price_history table
- **Price alert** — "El pollo subió S/2 (+12%) esta semana en el mercado. Avícola lo mantiene a S/17"
- **Best price recommendation** — "Para 50 pollos, Avícola te sale S/50 más barato que el mercado"

### Demand Planning
- **Historical daily sales** — "Los domingos vendes 30% más pollos que entre semana"
- **Holiday planning** — "El Día de la Madre vendiste 120 pollos el año pasado. ¿Quieres preparar 130 este año?"
- **Weather correlation** — "Los días de lluvia vendes 15% menos ceviche pero 20% más sopa"
- **Purchase suggestion** — Based on day-of-week + trend: "Mañana es sábado. Sugiero comprar 60 pollos (vendiste 55 el sábado pasado)"
- **Month-end/quincena boost** — "Fin de quincena: vendes ~25% más. Compra extra de insumos"

### WhatsApp Menu Sharing
- **Generate today's menu** — "Manda el menú del día" → formatted menu sent via whatsapp-mcp to customer list
- **Daily specials** — "Hoy el especial es ceviche mixto a S/30" → highlighted in menu message
- **Menu with prices** — Full menu or just today's available dishes with prices
- **Broadcast to customer list** — Send to registered customers or a WhatsApp broadcast group
- **Menu photo** — If owner sends photo of pizarra/chalkboard menu → share directly to customers

## MCP Tools Required
- `erpnext-mcp` — Product catalog for ingredients, stock levels for perishable tracking, purchase entries
- `postgres-mcp` — Menu items, COGS records, daily sales by dish, food cost calculations, recipes, waste logs, staff meals, demand history
- `whatsapp-mcp` — Menu sharing to customers, daily reports to owner, purchase reminders

## Data Model

### PostgreSQL Tables

```sql
-- ══════════════════════════════════════════════════════════
-- MENU ITEMS (dishes on the restaurant's menu)
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS business.menu_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES business.businesses(id),
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN (
        'entrada', 'sopa', 'segundo', 'ceviche_marisco',
        'pollo_parrilla', 'guarnicion', 'bebida', 'postre',
        'menu_del_dia', 'combo', 'otro'
    )),
    price NUMERIC(10,2) NOT NULL,
    cost NUMERIC(10,2),                    -- calculated COGS per dish
    margin_percent NUMERIC(5,2),           -- (price - cost) / price * 100
    description TEXT,
    is_available BOOLEAN DEFAULT TRUE,     -- currently on the menu
    is_daily BOOLEAN DEFAULT FALSE,        -- only available certain days
    available_days TEXT[],                 -- ['lunes','martes',...] if is_daily
    has_variants BOOLEAN DEFAULT FALSE,    -- e.g., 1/4, 1/2, entero
    is_active BOOLEAN DEFAULT TRUE,        -- soft delete
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_menu_business ON business.menu_items(business_id);
CREATE INDEX IF NOT EXISTS idx_menu_category ON business.menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_available ON business.menu_items(is_available, is_active);
CREATE INDEX IF NOT EXISTS idx_menu_name_trgm ON business.menu_items USING gin (name gin_trgm_ops);

-- ══════════════════════════════════════════════════════════
-- MENU ITEM VARIANTS (presentations: 1/4 pollo, 1/2 pollo, etc.)
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS business.menu_item_variants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    menu_item_id UUID NOT NULL REFERENCES business.menu_items(id) ON DELETE CASCADE,
    variant_name TEXT NOT NULL,            -- '1/4 pollo', '1/2 pollo', 'entero', 'familiar'
    price NUMERIC(10,2) NOT NULL,
    cost NUMERIC(10,2),
    margin_percent NUMERIC(5,2),
    portion_grams NUMERIC(8,2),           -- standard portion weight
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_variant_item ON business.menu_item_variants(menu_item_id);

-- ══════════════════════════════════════════════════════════
-- INGREDIENTS (raw ingredients used across dishes)
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS business.ingredients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES business.businesses(id),
    name TEXT NOT NULL,
    unit TEXT DEFAULT 'kg' CHECK (unit IN (
        'kg', 'g', 'unidad', 'litro', 'ml',
        'saco', 'caja', 'atado', 'docena', 'otro'
    )),
    current_price NUMERIC(10,2),          -- latest purchase price per unit
    last_price_update TIMESTAMPTZ,
    category TEXT CHECK (category IN (
        'carnes', 'aves', 'pescados_mariscos', 'verduras',
        'frutas', 'granos_cereales', 'lacteos', 'aceites_grasas',
        'condimentos', 'bebidas', 'descartables', 'combustible', 'otro'
    )),
    perishable_days INTEGER,              -- shelf life in days (1 for fish, 2 for chicken, etc.)
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ingredient_business ON business.ingredients(business_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_name_trgm ON business.ingredients USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_ingredient_category ON business.ingredients(category);

-- ══════════════════════════════════════════════════════════
-- RECIPES (links dishes to ingredients with portions)
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS business.recipes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    menu_item_id UUID NOT NULL REFERENCES business.menu_items(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES business.menu_item_variants(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES business.ingredients(id) ON DELETE CASCADE,
    quantity NUMERIC(10,3) NOT NULL,       -- amount of ingredient per portion
    unit TEXT DEFAULT 'kg',               -- unit for this quantity
    notes TEXT,                           -- "picado en cubos", "crudo"
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recipe_item ON business.recipes(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_recipe_variant ON business.recipes(variant_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredient ON business.recipes(ingredient_id);

-- ══════════════════════════════════════════════════════════
-- DAILY PURCHASES (daily market/supplier purchases)
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS business.daily_purchases (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES business.businesses(id),
    ingredient_id UUID REFERENCES business.ingredients(id) ON DELETE SET NULL,
    supplier_id UUID REFERENCES business.suppliers(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,            -- as spoken: "pollo", "papa", "arroz"
    quantity NUMERIC(10,3) NOT NULL,
    unit TEXT DEFAULT 'unidad',
    unit_price NUMERIC(10,2) NOT NULL,
    total NUMERIC(12,2) NOT NULL,
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    source TEXT DEFAULT 'mercado' CHECK (source IN (
        'mercado', 'mayorista', 'proveedor', 'bodega', 'otro'
    )),
    payment_method TEXT DEFAULT 'efectivo' CHECK (payment_method IN (
        'efectivo', 'yape', 'plin', 'transferencia', 'credito', 'mixto'
    )),
    notes TEXT,
    raw_message TEXT,                      -- original WhatsApp message
    source_type TEXT DEFAULT 'chat' CHECK (source_type IN ('chat', 'voice', 'photo', 'po', 'api')),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dp_business_date ON business.daily_purchases(business_id, purchase_date);
CREATE INDEX IF NOT EXISTS idx_dp_ingredient ON business.daily_purchases(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_dp_product_trgm ON business.daily_purchases USING gin (product_name gin_trgm_ops);

-- ══════════════════════════════════════════════════════════
-- DAILY DISH SALES (units sold per dish per day)
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS business.daily_dish_sales (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES business.businesses(id),
    menu_item_id UUID NOT NULL REFERENCES business.menu_items(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES business.menu_item_variants(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL,
    total_revenue NUMERIC(12,2) NOT NULL,
    unit_cost NUMERIC(10,2),              -- COGS per unit at time of sale
    total_cost NUMERIC(12,2),             -- quantity × unit_cost
    total_margin NUMERIC(12,2),           -- total_revenue - total_cost
    sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
    shift TEXT DEFAULT 'full_day' CHECK (shift IN ('desayuno', 'almuerzo', 'cena', 'full_day')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dds_business_date ON business.daily_dish_sales(business_id, sale_date);
CREATE INDEX IF NOT EXISTS idx_dds_item ON business.daily_dish_sales(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_dds_variant ON business.daily_dish_sales(variant_id);

-- ══════════════════════════════════════════════════════════
-- DAILY FOOD COST SUMMARY (pre-computed daily metrics)
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS business.daily_food_cost (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES business.businesses(id),
    business_date DATE NOT NULL,
    total_purchases NUMERIC(12,2) DEFAULT 0,       -- sum of daily_purchases
    total_revenue NUMERIC(12,2) DEFAULT 0,         -- sum of daily_dish_sales revenue
    total_cogs NUMERIC(12,2) DEFAULT 0,            -- sum of daily_dish_sales cost
    food_cost_percent NUMERIC(5,2),                -- total_purchases / total_revenue * 100
    cogs_percent NUMERIC(5,2),                     -- total_cogs / total_revenue * 100
    waste_cost NUMERIC(12,2) DEFAULT 0,
    staff_meal_cost NUMERIC(12,2) DEFAULT 0,
    gross_margin NUMERIC(12,2),                    -- total_revenue - total_purchases - waste - staff_meals
    gross_margin_percent NUMERIC(5,2),
    dishes_sold INTEGER DEFAULT 0,                 -- total units across all dishes
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(business_id, business_date)
);

CREATE INDEX IF NOT EXISTS idx_dfc_business_date ON business.daily_food_cost(business_id, business_date);

-- ══════════════════════════════════════════════════════════
-- WASTE LOG (food waste tracking)
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS business.waste_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES business.businesses(id),
    ingredient_id UUID REFERENCES business.ingredients(id) ON DELETE SET NULL,
    menu_item_id UUID REFERENCES business.menu_items(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity NUMERIC(10,3) NOT NULL,
    unit TEXT DEFAULT 'unidad',
    estimated_cost NUMERIC(10,2),
    waste_type TEXT NOT NULL CHECK (waste_type IN (
        'spoiled',        -- se malogró
        'overcooked',     -- se quemó
        'end_of_day',     -- sobró al cierre
        'customer_return', -- devuelto
        'prep_waste',     -- merma de preparación (huesos, cáscaras)
        'other'
    )),
    reason TEXT,
    waste_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_waste_business_date ON business.waste_log(business_id, waste_date);
CREATE INDEX IF NOT EXISTS idx_waste_type ON business.waste_log(waste_type);

-- ══════════════════════════════════════════════════════════
-- STAFF MEALS (merma por personal)
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS business.staff_meals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES business.businesses(id),
    menu_item_id UUID REFERENCES business.menu_items(id) ON DELETE SET NULL,
    ingredient_id UUID REFERENCES business.ingredients(id) ON DELETE SET NULL,
    description TEXT NOT NULL,            -- "3 pollos", "5 menús", "arroz con pollo para 4"
    quantity NUMERIC(10,3) NOT NULL,
    unit TEXT DEFAULT 'unidad',
    estimated_cost NUMERIC(10,2),
    staff_count INTEGER,                  -- number of staff eating
    meal_date DATE NOT NULL DEFAULT CURRENT_DATE,
    meal_type TEXT DEFAULT 'almuerzo' CHECK (meal_type IN (
        'desayuno', 'almuerzo', 'cena', 'snack'
    )),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_meals_business_date ON business.staff_meals(business_id, meal_date);

-- ══════════════════════════════════════════════════════════
-- ROTISSERIE BATCHES (pollo a la brasa specific)
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS business.rotisserie_batches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES business.businesses(id),
    batch_number INTEGER DEFAULT 1,        -- 1st, 2nd, 3rd batch of the day
    chickens_in INTEGER NOT NULL,          -- pollos puestos al horno
    chickens_sold INTEGER DEFAULT 0,
    chickens_staff INTEGER DEFAULT 0,      -- eaten by staff
    chickens_waste INTEGER DEFAULT 0,      -- unsold/wasted
    batch_time TIMESTAMPTZ DEFAULT now(),  -- when they went in
    batch_date DATE NOT NULL DEFAULT CURRENT_DATE,
    fuel_type TEXT DEFAULT 'carbon' CHECK (fuel_type IN ('carbon', 'gas', 'lena')),
    fuel_quantity NUMERIC(6,2),           -- sacos de carbón, balones de gas
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rotisserie_business_date ON business.rotisserie_batches(business_id, batch_date);

-- ══════════════════════════════════════════════════════════
-- DAILY MENU AVAILABILITY (what's available today)
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS business.daily_menu_availability (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES business.businesses(id),
    menu_item_id UUID NOT NULL REFERENCES business.menu_items(id) ON DELETE CASCADE,
    menu_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_available BOOLEAN DEFAULT TRUE,
    unavailable_reason TEXT,              -- "se acabó el pescado", "no llegó el proveedor"
    special_price NUMERIC(10,2),          -- override price for today
    is_special BOOLEAN DEFAULT FALSE,     -- highlight as today's special
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(business_id, menu_item_id, menu_date)
);

CREATE INDEX IF NOT EXISTS idx_dma_business_date ON business.daily_menu_availability(business_id, menu_date);

-- ══════════════════════════════════════════════════════════
-- MENU CUSTOMER LIST (customers who receive daily menu)
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS business.menu_customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES business.businesses(id),
    customer_name TEXT,
    phone TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    receives_daily_menu BOOLEAN DEFAULT TRUE,
    preferred_time TEXT DEFAULT '10:00',   -- when to send menu
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mc_business ON business.menu_customers(business_id);
CREATE INDEX IF NOT EXISTS idx_mc_active ON business.menu_customers(is_active, receives_daily_menu);
```

## Response Formats (WhatsApp-Optimized)

### Dish Added
```
✅ Plato registrado:
🍽️ *Lomo Saltado* (segundo)
💰 Precio: S/28.00

¿Quieres registrar el costo de los ingredientes?
Así calculamos tu margen 📊
```

### COGS Registered
```
✅ Costo registrado — *1/4 Pollo a la Brasa*

🍗 Pollo (350g) — S/6.30
🍟 Papa frita (200g) — S/1.20
🥗 Ensalada (100g) — S/0.80
🫙 Cremas + ají — S/0.50
🥤 Descartables — S/0.30

📦 *Costo total: S/9.10*
💰 Precio venta: S/25.00
✅ *Margen: S/15.90 (63.6%)*

👍 Margen saludable — el rango ideal es 60-70% para 1/4 pollo
```

### Daily Purchase Logged
```
✅ Compras del mercado registradas:

🐔 50 pollos × S/18.00 = S/900.00
🥔 20 kg papa × S/2.00/kg = S/40.00
🍚 10 kg arroz × S/3.50/kg = S/35.00
🧅 5 kg cebolla × S/2.00/kg = S/10.00
🍋 3 kg limón × S/4.00/kg = S/12.00

💰 *Total compras: S/997.00*
💵 Método: efectivo

📊 Compras del día: S/997
💡 Ayer compraste S/1,050 — hoy gastaste 5% menos 📉
```

### Daily Sales Summary
```
📊 *Ventas del día — Sábado 21 Mar*

🍗 Pollo a la brasa:
   • 1/4 pollo: 45 × S/25 = S/1,125
   • 1/2 pollo: 20 × S/45 = S/900
   • Entero: 8 × S/85 = S/680
   🐔 Total pollos: 80 equivalentes

🐟 Ceviche: 18 × S/35 = S/630
🍖 Lomo saltado: 15 × S/28 = S/420
🍛 Menú del día: 60 × S/12 = S/720

💰 *Total ventas: S/4,475*
📦 *Total costo: S/1,520*
✅ *Ganancia bruta: S/2,955 (66%)*

📈 *Costo de comida: 34%* ✅ (meta: 30-35%)
```

### Food Cost Alert
```
⚠️ *Alerta de costo de comida*

Tu costo de comida hoy es *38%* (meta: 30-35%)

📊 Detalle:
💰 Ventas: S/3,200
📦 Compras: S/1,216
🗑️ Merma: S/120 (5 pollos sobraron ayer)
🍽️ Personal: S/80 (4 menús)

📈 ¿Qué pasó?
• El pollo subió de S/17 a S/19 (+12%)
• Se botaron 5 pollos (S/95)

💡 Opciones:
1. Subir precio del 1/4 pollo de S/25 a S/27
2. Reducir la tanda de pollos (compraste 55, vendiste 45)
3. Negociar precio con otro proveedor

¿Qué prefieres? 🤔
```

### Today's Menu (for customer sharing)
```
🍽️ *Menú del día — Sábado 21 Mar*
📍 Pollería El Sabrosón

🔥 *ESPECIAL DEL DÍA*
🐟 Ceviche mixto — S/30 (normalmente S/35)

🍗 *POLLOS A LA BRASA*
• 1/4 pollo + papas + ensalada — S/25
• 1/2 pollo + papas + ensalada — S/45
• Pollo entero + papas + ensalada — S/85
• Familiar (entero + papas XL + 4 gaseosas) — S/120

🥘 *PLATOS A LA CARTA*
• Lomo saltado — S/28
• Arroz con pollo — S/22
• Tallarín saltado — S/24

🍛 *MENÚ DEL DÍA — S/12*
Sopa de pollo + Seco de pollo con frejoles + Chicha

🥤 *BEBIDAS*
• Chicha morada (jarra) — S/10
• Gaseosa personal — S/3
• Gaseosa 1.5L — S/8

📞 Pedidos: 987 654 321
📱 Aceptamos Yape y Plin
```

### Waste Report
```
🗑️ *Merma de la semana — 15 al 21 Mar*

📊 Resumen:
💸 Merma total: S/480 (2.8% de ventas)

Por tipo:
• 🐔 Sobró al cierre: S/285 (12 pollos)
• 🥬 Se malogró: S/95 (verduras)
• 🍳 Se quemó: S/40 (2 pollos)
• 🍽️ Devoluciones: S/60 (2 platos)

🍽️ *Personal comió: S/320*
• 16 menús (4 trabajadores × 4 días)
• 4 pollos (sábado y domingo)

💡 Tip: Los martes te sobran ~3 pollos.
Baja la tanda de 50 a 45 los martes 📉

📊 Tu merma (2.8%) está dentro del rango
normal para pollerías (2-5%) ✅
```

### Demand Planning
```
📋 *Estimación para mañana — Domingo 22 Mar*

Basado en los últimos 4 domingos:

🐔 Pollo a la brasa:
   • Promedio domingos: 95 pollos
   • Tendencia: ↗️ +5% último mes
   • *Sugerencia: comprar 100 pollos*

🐟 Ceviche:
   • Promedio domingos: 25 porciones
   • *Sugerencia: 12 kg pescado*

🍛 Menú del día:
   • Promedio domingos: 40 menús
   • *Sugerencia: preparar para 45*

🛒 *Lista de compras sugerida:*
• 100 pollos — ~S/1,800
• 30 kg papa — ~S/60
• 15 kg arroz — ~S/52
• 12 kg pescado — ~S/540
• Verduras varias — ~S/80
• Carbón (3 sacos) — ~S/90

💰 *Compra estimada: S/2,622*
💵 *Venta estimada: S/5,800*
📈 *Margen esperado: 55%*

⚠️ Es quincena — puede ser +10-15% más.
¿Compro extra? 🤔
```

### Rotisserie Batch Tracking
```
🍗 *Tanda #2 — 3:30 PM*

🔥 Entraron: 25 pollos al horno
⏱️ Listos en: ~1 hora (4:30 PM)

📊 *Día hasta ahora:*
• Tanda 1 (11:30 AM): 30 pollos
  → Vendidos: 28 | Personal: 1 | Sobró: 1
• Tanda 2 (3:30 PM): 25 pollos
  → En horno...

🐔 Total del día: 55 pollos
📦 Vendidos hasta ahora: 28
🎯 Meta: 80 pollos (basado en sábados)
```

## Interaction Flows

### Flow 1: Registrar Plato y Costo
```
Owner: "Agrega el lomo saltado a S/28"
Agente: "✅ *Lomo Saltado* agregado a la carta
       📂 Categoría: segundo
       💰 Precio: S/28.00

       ¿Me dices cuánto te cuesta hacerlo?
       Así calculamos tu margen 📊"

Owner: "El lomo me cuesta como S/12 de carne, S/1.50 de papa, S/0.80 de cebolla, S/0.60 de tomate, S/0.80 de arroz y S/1 de aceite y condimentos"
Agente: "✅ Costo registrado — *Lomo Saltado*

       🥩 Lomo (200g) — S/12.00
       🥔 Papa — S/1.50
       🧅 Cebolla — S/0.80
       🍅 Tomate — S/0.60
       🍚 Arroz — S/0.80
       🫙 Aceite y condimentos — S/1.00

       📦 *Costo total: S/16.70*
       💰 Precio venta: S/28.00
       ✅ *Margen: S/11.30 (40.4%)*

       ⚠️ Tu margen está justo en el límite.
       Si el lomo sube de precio, considera
       ajustar la porción o el precio 💡"
```

### Flow 2: Compra Diaria en el Mercado
```
Owner: [voice note] "Compré 50 pollos a dieciocho cada uno, 20 kilos de papa a dos soles el kilo, y 10 kilos de arroz a tres cincuenta"
Agente: "✅ Compras del mercado registradas:

       🐔 50 pollos × S/18.00 = S/900.00
       🥔 20 kg papa × S/2.00/kg = S/40.00
       🍚 10 kg arroz × S/3.50/kg = S/35.00

       💰 *Total: S/975.00* (efectivo)

       💡 El pollo subió S/1 vs tu última compra (S/17).
       +5.6% — eso baja tu margen del 1/4 pollo de 65% a 63%.
       Todavía saludable ✅

       ¿Compraste algo más?"
```

### Flow 3: Registro de Ventas del Día
```
Owner: "Hoy vendí 45 cuartos de pollo, 18 medios, 6 enteros, 22 ceviches y 65 menús"
Agente: "📊 *Ventas registradas — Sábado 21 Mar*

       🍗 Pollo a la brasa:
          • 1/4: 45 × S/25 = S/1,125
          • 1/2: 18 × S/45 = S/810
          • Entero: 6 × S/85 = S/510
          🐔 Total: 78 pollos equivalentes

       🐟 Ceviche: 22 × S/35 = S/770
       🍛 Menú: 65 × S/12 = S/780

       💰 *Total ventas: S/3,995*

       📊 Costo de comida:
          📦 Compras hoy: S/975
          🗑️ Merma: S/0
          🍽️ Personal: (¿comieron hoy?)

       ✅ *Food cost: 24.4%* — ¡excelente! 🎉
       (meta: 30-35%, estás por debajo)"
```

### Flow 4: Merma y Personal
```
Owner: "Los chicos comieron 4 menús y sobraron 3 pollos del cierre"
Agente: "✅ Registrado:

       🍽️ *Personal:* 4 menús × S/12 = S/48 (costo: ~S/20)
       🗑️ *Sobró:* 3 pollos × S/18 (costo) = S/54

       📊 *Actualización del día:*
       💰 Ventas: S/3,995
       📦 Compras: S/975
       🗑️ Merma: S/54
       🍽️ Personal: S/20
       ✅ *Ganancia bruta: S/2,946*
       📈 Food cost: 26.2% ✅

       💡 3 pollos sobraron — ¿consideras bajar
       la última tanda los sábados de 25 a 22?"
```

### Flow 5: Menú No Disponible Hoy
```
Owner: "Hoy no hay ceviche, no llegó buen pescado"
Agente: "✅ *Ceviche* marcado como no disponible hoy
       Razón: no llegó buen pescado

       📋 Menú de hoy actualizado:
       ✅ Pollo a la brasa (todas las presentaciones)
       ✅ Lomo saltado
       ✅ Arroz con pollo
       ❌ Ceviche — no disponible
       ✅ Menú del día (sopa + segundo + refresco)

       ¿Quieres que avise a los clientes? 📲"

Owner: "Sí, manda el menú"
Agente: "✅ Menú enviado a 45 clientes por WhatsApp 📲
       (Sin ceviche, resaltando el especial del día)"
```

### Flow 6: Comparar Precio de Proveedor
```
Owner: "¿Quién me vende el pollo más barato?"
Agente: "📊 *Comparación: Pollo entero*

       🏪 Avícola San Fernando
          S/17.00/unidad — compra del 20 mar
          🚛 Te lo trae a las 5 AM
          ⭐ 4.8/5.0

       🏪 Mercado Mayorista
          S/18.00/unidad — compra del 21 mar
          🚛 Tú vas a las 4 AM
          ⭐ Variable

       🏪 Don Carlos (avícola)
          S/16.50/unidad — compra del 15 mar
          🚛 Entrega: 6 AM (mínimo 40 pollos)
          ⭐ 4.5/5.0

       💡 *Don Carlos* es S/1.50 más barato que el mercado.
       Para 50 pollos diarios, ahorras S/75/día = S/2,250/mes
       Pero pide mínimo 40. ¿Le encargo?"
```

### Flow 7: Planificación de Domingo
```
Owner: "¿Cuántos pollos necesito para mañana domingo?"
Agente: "📋 *Estimación para Domingo 22 Mar*

       Últimos 4 domingos:
       • 1 mar: 85 pollos
       • 8 mar: 92 pollos
       • 15 mar: 88 pollos
       • Promedio: 88 pollos

       📈 Tendencia: +3% semanal
       ⚠️ Es fin de quincena → +15% histórico

       🐔 *Recomendación: 100-105 pollos*

       Distribución sugerida:
       • Tanda 1 (11 AM): 35 pollos
       • Tanda 2 (1 PM): 30 pollos
       • Tanda 3 (5 PM): 25 pollos
       • Reserva: 10-15 pollos

       🛒 Compra sugerida:
       • 105 pollos × S/18 = S/1,890
       • 35 kg papa = S/70
       • Extra ensalada y gaseosas

       💰 Venta estimada: S/5,500-6,200

       ¿Quieres que le pida a Avícola?"
```

## Integration Points

### With agente-expenses
- Daily purchases auto-create expense entries (category: insumos alimentarios)
- Food cost percentage feeds into overall P&L calculations
- Staff meal costs tracked as operational expense
- When owner asks "¿cuánto gané hoy?", combines restaurant revenue with all expenses for true daily P&L

### With agente-suppliers
- Supplier price history pulled from agente-suppliers price_history table
- Purchase orders created via agente-suppliers when ordering from registered suppliers
- Supplier comparison uses agente-suppliers data
- New market prices auto-update supplier_products current_price

### With agente-ledger
- Daily dish sales feed into ledger as revenue entries
- Payment method splits (cash, Yape, Plin) tracked in ledger
- End-of-day closing reconciles restaurant register with ledger

### With agente-analytics
- Dish velocity data feeds demand forecasting
- Day-of-week and seasonal patterns for purchasing decisions
- Food cost trends visible in analytics dashboards
- Revenue by dish category for menu optimization

### With agente-inventory / erpnext-mcp
- Perishable stock levels tracked (bought today vs used today vs remaining)
- Ingredient stock triggers reorder alerts
- Dry goods (arroz, aceite, condimentos) tracked in ERPNext for longer-term inventory

### With whatsapp-mcp
- Send daily menu to customer broadcast list
- Send daily/weekly food cost reports to owner
- Receive purchase logs via voice notes
- Send demand planning alerts before market trips

## Proactive Behaviors
- **Food cost alert** — When daily food cost exceeds 35%: "⚠️ Tu costo de comida hoy es 38%. Revisa compras y merma"
- **Ingredient price spike** — When a key ingredient price rises >10%: "El pollo subió 12% esta semana. Tu margen del 1/4 bajó de 64% a 60%"
- **Waste trending up** — If waste exceeds 5% of purchases for 3+ days: "Tu merma lleva 3 días arriba de 5%. ¿Estás comprando de más?"
- **Pre-market shopping list** — Cron at 4 AM: "🛒 Lista para el mercado hoy: 50 pollos, 20 kg papa, 10 kg arroz..."
- **Demand estimate** — Night before: "Mañana es sábado — sugiero 80 pollos basado en las últimas 4 semanas"
- **Slow dish alert** — Weekly: "El arroz con mariscos se vendió solo 3 veces esta semana. ¿Lo sacamos de la carta?"
- **Menu not sent** — If owner hasn't shared menu by 10 AM: "¿Quieres que mande el menú del día a tus clientes?"
- **Margin recovery** — After ingredient price increase: "Si subes el 1/4 pollo S/2 (a S/27), recuperas el margen al 65%"
- **End-of-day batch reminder** — At 8 PM if rotisserie batches open: "Tienes 8 pollos sin vender de la tanda de las 5 PM. ¿Hacemos promo de cierre?"

## Cron Schedules (via OpenClaw Cron)

```yaml
pre_market_list:
  schedule: "0 4 * * *"           # 4 AM daily
  description: "Generate shopping list based on stock, sales trends, and day of week"
  action: "Calculate needed purchases, send shopping list via WhatsApp"

daily_menu_broadcast:
  schedule: "0 10 * * *"          # 10 AM daily
  description: "Send today's menu to customer list if owner hasn't sent manually"
  condition: "Only send if owner has opted in and hasn't sent menu today"
  action: "Generate menu from available dishes, send via whatsapp-mcp"

midday_sales_check:
  schedule: "0 14 * * *"          # 2 PM daily
  description: "Check lunch rush results and estimate remaining inventory"
  action: "If sales data available, show lunch summary and remaining stock estimate"

food_cost_daily:
  schedule: "0 22 * * *"          # 10 PM daily
  description: "Daily food cost summary with P&L"
  action: "Calculate food cost %, waste %, staff meal cost. Alert if >35%"

weekly_food_report:
  schedule: "0 9 * * 1"           # Monday 9 AM
  description: "Weekly food cost breakdown, best/worst days, waste report, menu performance"
  action: "Aggregate weekly data, dish-level margins, waste analysis, demand patterns"

monthly_menu_review:
  schedule: "0 10 1 * *"          # 1st of month, 10 AM
  description: "Monthly menu performance: best sellers, slow movers, margin analysis"
  action: "Full month dish analysis, COGS trends, waste trends, menu optimization suggestions"

demand_forecast:
  schedule: "0 20 * * *"          # 8 PM daily
  description: "Tomorrow's demand forecast based on day-of-week and trends"
  action: "Calculate purchase recommendation for next day"

batch_reminder:
  schedule: "0 20 * * *"          # 8 PM (for pollerías)
  description: "Check for unsold chickens from last batch"
  condition: "Only for pollerías with active rotisserie batches"
  action: "Alert if >5 chickens unsold, suggest promo or staff meal allocation"
```

## Edge Cases
- **No COGS registered** — "No tengo el costo del lomo saltado. ¿Me dices cuánto te cuestan los ingredientes? Mientras, calculo la venta sin margen"
- **Voice note with multiple items** — Parse carefully: "Compré pollos, papas y arroz" → ask for quantities and prices if unclear
- **Approximate quantities** — "Compré como 50 pollos" → log 50, don't ask for exact count. Precision kills adoption
- **Mixed personal purchase** — "Compré pollo para el restaurant y para mi casa" → "¿Cuántos son para el negocio y cuántos personales?"
- **No sales logged** — If no dish sales by 3 PM: "¿Cómo va el día? ¿Quieres que anote las ventas?"
- **Leftovers next day** — "Me sobraron 5 pollos ayer, los estoy vendiendo hoy" → deduct from yesterday's waste, don't double-count in purchases
- **Price change mid-day** — "Voy a subir el ceviche a S/38" → new price effective for new sales, historical sales keep old price
- **Combo sale parsing** — "Vendí 1/4 con gaseosa grande a S/30" → track as combo variant, not individual items
- **Holiday menu** — "Para el Día de la Madre voy a hacer menú especial" → create temporary menu, track separately
- **Multiple locations** — "Tengo 2 locales" → each location tracks independently, consolidated reports available
- **Shared kitchen** — Some restaurants share kitchen space. Purchases might be split: "La mitad del arroz es para el otro local"
- **No menu structure** — Some owners just sell "menú" (one option, no choices). Support ultra-simple mode: just log revenue
- **Seasonal fish prices** — "El lenguaje estaba carísimo hoy" → log the price, flag if >20% above average
- **Carbon/gas as ingredient** — Fuel for rotisserie is a COGS component, not a utility expense. Track per chicken

## Natural Language Parsing

### Purchase Detection Patterns (Spanish)
```
Amount patterns:
  "compré 50 pollos a S/18" → purchase, pollo, 50, S/18/u, S/900
  "compré 20 kilos de papa a 2 soles" → purchase, papa, 20kg, S/2/kg, S/40
  "gasté S/900 en pollo" → purchase, pollo, S/900 total
  "traje 30 pollos del mercado" → purchase, pollo, 30 (ask price)
  "me costó S/975 la compra del mercado" → purchase, lump sum, S/975

Sales patterns:
  "vendí 45 pollos" → dish_sale, pollo, 45
  "hoy se vendieron 20 ceviches" → dish_sale, ceviche, 20
  "salieron 80 menús" → dish_sale, menu_del_dia, 80
  "cuartos: 45, medios: 18, enteros: 6" → variant_sales, 1/4:45, 1/2:18, entero:6

Waste patterns:
  "se malograron 5 pollos" → waste, spoiled, pollo, 5
  "sobraron 3 pollos" → waste, end_of_day, pollo, 3
  "se quemó 1 pollo" → waste, overcooked, pollo, 1
  "devolvieron un ceviche" → waste, customer_return, ceviche, 1
  "botamos 2 kg de pescado" → waste, spoiled, pescado, 2kg

Staff meal patterns:
  "los chicos comieron 3 pollos" → staff_meal, pollo, 3
  "el personal almorzó 4 menús" → staff_meal, menu, 4
  "merma de personal: 5 platos" → staff_meal, generic, 5

Menu patterns:
  "hoy no hay ceviche" → unavailable, ceviche, today
  "se acabó el pescado" → unavailable, all seafood dishes, today
  "mañana sí hay causa" → available, causa, tomorrow
  "el especial de hoy es chupe de camarones" → special, chupe_de_camarones, today
```

## Configuration
- `RESTAURANT_TYPE` — Type of restaurant: "polleria", "cevicheria", "menu", "chifa", "picanteria", "general" (default: "general")
- `RESTAURANT_FOOD_COST_TARGET` — Target food cost percentage (default: 33)
- `RESTAURANT_FOOD_COST_ALERT` — Alert when food cost exceeds this % (default: 35)
- `RESTAURANT_WASTE_ALERT` — Alert when waste exceeds this % of purchases (default: 5)
- `RESTAURANT_STAFF_MEAL_POLICY` — Default staff meal: "1_menu", "none", "custom" (default: "1_menu")
- `RESTAURANT_STAFF_COUNT` — Number of staff for meal calculations (default: 4)
- `RESTAURANT_SHIFTS` — Active shifts: "almuerzo", "cena", "ambos" (default: "ambos")
- `RESTAURANT_MARKET_TIME` — When owner goes to market, for shopping list cron (default: "05:00")
- `RESTAURANT_MENU_BROADCAST_TIME` — When to send daily menu to customers (default: "10:00")
- `RESTAURANT_MENU_BROADCAST_ENABLED` — Enable daily menu broadcast (default: false)
- `RESTAURANT_ROTISSERIE_ENABLED` — Enable pollo a la brasa specific features (default: false)
- `RESTAURANT_BATCH_SIZE` — Default chickens per rotisserie batch (default: 25)
- `RESTAURANT_FUEL_TYPE` — Rotisserie fuel: "carbon", "gas", "lena" (default: "carbon")
- `RESTAURANT_CURRENCY` — Currency for prices (default: "PEN")
- `RESTAURANT_DAILY_REPORT_TIME` — Time for daily food cost report (default: "22:00")
- `RESTAURANT_DEFAULT_PAYMENT` — Default payment method for purchases (default: "efectivo")
- `RESTAURANT_COMBO_DRINK` — Default drink in combos: "gaseosa", "chicha", "none" (default: "gaseosa")

## Behavior Guidelines

### Restaurant Owner First
- **The owner knows their food.** Don't lecture them on recipes or portion sizes. Present data and let them decide.
- **Speed over precision.** "Compré 50 pollos a 18" is enough. Don't ask "¿18.00 exactamente? ¿Con o sin IGV?"
- **Morning = purchases, afternoon = sales, night = numbers.** Match the rhythm of a restaurant day.
- **Voice is primary.** Restaurant owners have greasy hands, are in a loud kitchen, or driving from the mercado. Voice notes are the default input.
- **Cash is king.** Default payment method to efectivo unless told otherwise. Don't push digital.

### Numbers That Matter
- **Food cost %** is the #1 metric. Always visible. Always contextualized (vs target, vs yesterday, vs average).
- **Per-dish margin** helps menu pricing decisions. Show it every time COGS is registered or updated.
- **Daily P&L** should be available at glance. Revenue - purchases - waste - staff meals = gross profit.
- **Round numbers.** S/18.00 not S/18.00000. 34% not 34.2857%.

### WhatsApp Formatting
- Short messages. A restaurant owner checks WhatsApp between orders.
- Emojis as visual markers, not decoration. 🐔 = pollo, 🐟 = fish, 🍗 = chicken dish, 🗑️ = waste.
- No markdown tables (WhatsApp doesn't render them). Use bullet lists and bold for emphasis.
- Split long reports into 2-3 messages if needed.

## Cultural Notes
- **"Menú"** in Peru means the daily set lunch (entrada + segundo + refresco), not the full menu card (that's "la carta")
- **"Pollería"** = restaurant specializing in pollo a la brasa. National institution.
- **"Cuarto de pollo"** = quarter chicken, the base unit of pollo a la brasa ordering
- **"Merma"** = shrinkage/waste. Used for both food waste and staff meals
- **"El mercado" / "el mayorista"** = wholesale market (Gran Mercado Mayorista de Lima, or local equivalent)
- **"La tanda"** = a batch of chickens in the rotisserie oven
- **"Saqué X pollos"** = put chickens in the oven (not removed)
- **"Se acabó"** = ran out of something. Triggers unavailability update
- **"Me fían"** = supplier gives credit. Common at the mercado for regular customers
- **Buying fresh daily** is the norm, not the exception. Refrigeration exists but owners prefer fresh
- **Sunday is the biggest day** for pollerías and cevicherías. Plan accordingly
- **Quincena** (15th and end of month) = payday = rush. Demand spikes 20-30%
- **"Combinado"** = a combo plate. "Cuarto combinado" = 1/4 chicken with sides
- **Staff eats the food** — this is normal and expected, not theft. Track it without judgment
- **"Pizarra"** = chalkboard menu outside the restaurant. The original "daily menu broadcast"
- **"Carta"** = the full menu. "Menú" = the daily set lunch. These are different things
- **Price in "soles"** = PEN. "Solcitos" = affectionate diminutive. "Lucazo" = S/1 (slang). Parse all variants

## Privacy & Security
- Menu items and prices are business data — share only via customer-facing menu broadcasts, never between competing restaurants
- COGS and margin data is highly sensitive — never share externally. Some owners don't even share with employees
- Purchase prices and supplier relationships are confidential
- Staff meal data should be anonymized in reports (total count, not per-person)
- Daily P&L data only sent to business owner's number, never to group chats
- Recipe details (exact portions, ingredient ratios) are trade secrets — treat accordingly

## Error Handling
- **No purchases logged today** — "No registré compras hoy. ¿Fuiste al mercado? Si compras son de ayer, lo anotamos"
- **Sales exceed purchases** — "Vendiste 60 pollos pero solo compraste 50 hoy. ¿Tenías stock de ayer?" (normal for some ingredients)
- **Unreasonable food cost** — If food cost >60% or <15%, verify: "El costo de comida salió 65%. ¿Seguro que las ventas fueron S/1,200? Parece bajo para un sábado"
- **Ingredient not in system** — "No tengo 'langostinos' registrado. ¿A cuánto los compraste? Lo agrego"
- **Conflicting data** — "Compraste 50 pollos, vendiste 45, personal comió 3, sobraron 5 = 53. ¿Se te escapó alguno? 😅" (gentle reconciliation)
- **Photo unclear** — "No logro leer la boleta del mercado. ¿Me dices qué compraste y cuánto?"
- **Voice note garbled** — "Escuché 'compré treinta pollos a dieciocho'. ¿Es correcto?"
- **Duplicate entry** — "Ya registré 50 pollos comprados hoy. ¿Compraste más o es el mismo registro?"
