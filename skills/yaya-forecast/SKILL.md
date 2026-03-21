# yaya-forecast — Demand Forecasting, Smart Reorder & Purchase Planning

## Description
WhatsApp-native demand forecasting and purchase planning for Peru's 1M+ commerce businesses (bodegas, ferreterías, tiendas), 143K+ restaurants, and 80K+ service businesses. Answers the universal MYPE question: **"¿Cuánto compro mañana?"** Analyzes historical sales patterns from yaya-ledger/yaya-restaurant/yaya-analytics to predict demand by day-of-week, detect seasonality, generate smart shopping lists for mayorista trips, set reorder alerts, track commodity price trends, and estimate purchase budgets. Starts simple (last-week-same-day heuristic after just 7 days of data), grows smarter with time (moving averages, seasonal decomposition after 4+ weeks). Zero configuration — just works once the owner has been logging sales.

**The pain is universal:** Doña Gladys at 4:30am deciding how many pollos to buy. María planning her Saturday mayorista trip. Jorge knowing when to reorder cemento before running out. Every MYPE owner makes these decisions daily by gut feel, often buying too much (waste/spoilage) or too little (lost sales). Even a simple "last Saturday you sold 80 pollos, the Saturday before was 75, consider buying 85" saves real money.

**Cold start strategy:** Works from Day 1 with industry-specific defaults (average bodega sells S/350-450/day, average pollería sells 60-90 pollos on weekdays, 100-140 on weekends). After 7 days of user data, switches to personalized forecasts. After 4 weeks, adds trend detection. After 3 months, seasonal patterns emerge.

## When to Use
- Business owner asks how much to buy ("¿Cuántos pollos compro para mañana?", "¿cuánto arroz necesito?")
- Business owner is planning a mayorista/wholesale trip ("Voy al mayorista el sábado, ¿qué necesito?")
- Business owner asks about demand patterns ("¿Qué día vendo más?", "¿cuál es mi producto estrella?")
- Business owner asks for a purchase budget ("¿Cuánta plata llevo al mercado mañana?")
- Stock is running low and reorder is needed (proactive alert from yaya-inventory integration)
- Business owner asks about trends ("¿Están subiendo mis ventas?", "¿Cómo va la tendencia?")
- A weekly/monthly planning cron job triggers (e.g., Sunday night prep for Monday purchases)
- Business owner asks about waste/overstock ("¿Estoy comprando de más?", "¿Cuánto estoy botando?")
- Business owner wants to plan for a special event/holiday ("¿Cuánto compro para Fiestas Patrias?")
- Price of a key input has been rising and owner wants impact analysis
- A reorder alert fires (product fell below safety stock threshold)
- Business owner asks "¿Qué se vende más los viernes?" or similar day-pattern question

## Target Users (by vertical, largest first)
- **Bodegas/tiendas** (1M+) — Mayorista trip planning, popular product tracking, daily purchase budgets
- **Restaurantes/pollerías** (143K+) — Daily fresh ingredient purchases, perishable demand planning, weekend/holiday spikes
- **Ferreterías** (100K+) — Construction material reorder, seasonal demand cycles, bulk purchase timing
- **Farmacias/boticas** (30K+) — Medication reorder, seasonal illness patterns (flu season = more antigripales)
- **Salones/peluquerías** (80K+) — Product reorder (tintes, shampoo), busy-day staffing hints
- **Any business** that buys inventory/supplies and needs to know how much

## Capabilities

### Core: Demand Prediction
- **Next-day forecast** — "¿Cuánto voy a vender mañana?" → Uses day-of-week pattern + recent trend + known events
- **Specific product forecast** — "¿Cuántos pollos necesito para el domingo?" → Product-level prediction from dish/item sales history
- **Multi-day forecast** — "¿Cómo viene la semana?" → 7-day prediction with confidence ranges
- **Event-aware** — Incorporates known events: feriados (Fiestas Patrias, Navidad, Semana Santa), local events (festivals, football matches), payday cycles (quincena = 15th, fin de mes = 30th), school calendar
- **Weather-sensitive** — For restaurants: rain = fewer walk-ins. For bodegas: cold = more hot drinks. Optional integration with weather data

### Core: Smart Shopping List
- **Mayorista trip planner** — "Voy al mayorista el sábado, ¿qué necesito?" →
  ```
  🛒 Lista para mayorista — Sáb 22 Mar
  
  📦 Necesitas comprar:
  • Arroz (saco 50kg): 2 sacos — te queda ~15kg, vendes ~18kg/semana
  • Azúcar (saco 50kg): 1 saco — te queda ~20kg, vendes ~12kg/semana
  • Aceite (caja 12u): 1 caja — te quedan 3 botellas, vendes ~10/semana
  • Fideos (paquete 20u): 2 paquetes — te quedan 5, vendes ~8/semana
  
  💰 Presupuesto estimado: S/480-520
  (basado en precios de tu última compra)
  
  ✅ No necesitas:
  • Leche — te quedan 24 unidades (~2 semanas)
  • Gaseosas — stock suficiente
  ```
- **Budget estimation** — Calculates expected spend based on quantities × last known unit costs
- **Frequency-based** — Tracks how often each product is purchased and alerts when it's time

### Core: Reorder Alerts (Proactive)
- **Safety stock calculation** — Based on average daily sales × lead time (how long delivery takes) + buffer
- **Auto-alerts** — "⚠️ Te quedan ~3 días de cemento al ritmo actual. ¿Hacemos pedido?"
- **Smart timing** — Alerts sent during business hours, not at 2am. Considers supplier lead times
- **Integrates with yaya-suppliers** — Can auto-generate PO to preferred supplier when reorder triggered

### Core: Pattern Detection
- **Day-of-week** — "Los sábados vendes 45% más que lunes-viernes. Prepárate con más stock"
- **Quincena effect** — "Vendes 30% más entre el 15-17 y 28-2 de cada mes (días de pago)"
- **Seasonal** — After 3+ months: "En diciembre vendes 60% más. Empieza a stockear desde noviembre"
- **Holiday spikes** — Specific to Peru: Semana Santa (pescado +200%), Fiestas Patrias (pollo +80%), Navidad (panetón, chocolate caliente), Día de la Madre, Año Nuevo
- **Trend detection** — "Tus ventas de café subieron 25% en las últimas 4 semanas 📈. ¿Nuevo competidor cerró?"
- **Product lifecycle** — "Las ventas de [producto] han caído 40% en 2 meses. ¿Dejaste de exhibirlo?"

### Core: Purchase Budget Planning
- **Daily budget** — "Para mañana (miércoles), presupuesta S/[X] para compras basado en tu patrón"
- **Weekly budget** — "Esta semana necesitas ~S/[X] en compras. Desglose: lunes S/Y (mercado fresco), jueves S/Z (mayorista)"
- **Cash flow awareness** — Integrates with yaya-ledger: "Hoy tienes S/[X] en caja. Tus compras de mañana cuestan ~S/[Y]. Te quedan S/[X-Y] de margen"
- **Price trend tracking** — "El pollo ha subido 12% en 3 semanas (de S/8.50/kg a S/9.50/kg). Tu margen en pollo a la brasa bajó de 34% a 28%"

### Analytics: Forecasting Models (Progressive)

#### Level 0: Cold Start (Days 0-6, no user data)
- Uses industry-specific defaults:
  - Bodega promedio Lima: S/350-450/día, pico sábado
  - Bodega promedio provincia: S/200-300/día, pico domingo
  - Pollería promedio: 60-90 pollos L-V, 100-140 S-D
  - Ferretería promedio: S/800-1500/día, pico sábado
- Provides general guidance: "Las bodegas en Lima venden en promedio S/400/día. ¿Se parece a tu negocio?"
- Asks calibration questions: "¿Tu mejor día es sábado o domingo?", "¿Cuántos pollos vendes un día normal?"

#### Level 1: Basic Patterns (Days 7-27, 1-4 weeks of data)
- **Last-week-same-day** — "El martes pasado vendiste S/380. Considera preparar para ~S/380-420"
- **Simple moving average** (7-day window)
- **Day-of-week adjustment** — Calculates average for each day of week
- **Confidence: ±20%** — Wide range, honest about uncertainty

#### Level 2: Trend-Adjusted (Days 28-89, 1-3 months)
- **Weighted moving average** — Recent weeks weighted more heavily
- **Trend component** — "Tus ventas suben ~S/15/semana en promedio" → adjusts forecast upward
- **Quincena/payday detection** — Identifies pay-cycle spikes
- **Product-level patterns** — Which products sell more on which days
- **Confidence: ±12-15%** — Tighter with more data

#### Level 3: Seasonal (90+ days, 3+ months)
- **Seasonal decomposition** — Monthly patterns, holiday effects
- **Year-over-year** (after 12+ months) — "Diciembre pasado vendiste S/14,000. Este diciembre proyectas S/16,200 (+16%)"
- **Event calendar overlay** — Automatic adjustment for known holidays/events
- **Anomaly detection** — "Ayer vendiste 40% menos de lo esperado. ¿Pasó algo?"
- **Confidence: ±8-10%** — Reliable for planning

### Restaurant-Specific Features
- **Ingredient demand from dish sales** — "Si mañana vendes ~80 pollos, necesitas: 80 pollos (35kg), 40kg papas, 20kg arroz, 10kg ensalada"
- **Recipe explosion** — Converts dish forecast → ingredient list → purchase quantities
- **Perishable urgency** — "Compra pescado hoy, las papas pueden esperar a mañana"
- **Mercado purchase optimizer** — "Al mercado lleva S/850: pollo S/500, verduras S/200, condimentos S/100, extras S/50"
- **Waste reduction** — "Últimas 2 semanas compraste 10% más pollo del que vendiste. Merma promedio: 7 pollos/semana = S/126 perdidos"

### Bodega-Specific Features
- **Mayorista optimizer** — Groups items by supplier/mayorista location for efficient trip planning
- **Bulk vs unit economics** — "Comprar arroz por saco (S/140/50kg = S/2.80/kg) vs por kilo (S/3.50/kg) → ahorro S/35/saco"
- **Popular product ranking** — "Tus top 5 productos esta semana: arroz, aceite, azúcar, leche, fideos"
- **Shelf life consideration** — "No compres más de 2 sacos de harina — con tu ritmo de venta, se te pasa en 3 semanas"
- **Price comparison memory** — "La última vez compraste aceite a S/6.50/botella en [mayorista]. ¿Sigue igual?"

### Ferretería-Specific Features
- **Construction season awareness** — "Temporada de construcción empieza en abril. Históricamente tus ventas de cemento suben 35%"
- **Project-based demand** — "Si un contratista te pidió cotización por 500 bolsas, prepárate para servir en 2-3 entregas"
- **Lead time alerts** — "El cemento tarda 2 días en llegar. Con tu stock actual, debes pedir antes del jueves"

## Data Model

### PostgreSQL Tables

```sql
-- Forecast configuration per business
CREATE TABLE forecast_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id),
    business_type VARCHAR(30) NOT NULL CHECK (business_type IN (
        'bodega', 'tienda', 'restaurante', 'polleria', 'cevicheria',
        'chifa', 'ferreteria', 'farmacia', 'salon', 'other'
    )),
    -- Calibration
    avg_daily_sales DECIMAL(12,2),          -- Owner-provided or calculated
    peak_day VARCHAR(10) DEFAULT 'sabado',  -- Best sales day
    purchase_days JSONB DEFAULT '["sabado"]', -- Days they go to mayorista
    lead_time_days INTEGER DEFAULT 1,       -- Days between ordering and receiving
    safety_stock_days INTEGER DEFAULT 3,    -- Days of buffer stock desired
    -- Feature flags
    enable_reorder_alerts BOOLEAN DEFAULT true,
    enable_weekly_plan BOOLEAN DEFAULT true,
    enable_waste_tracking BOOLEAN DEFAULT false,
    -- Forecast level (auto-calculated based on data availability)
    forecast_level INTEGER DEFAULT 0 CHECK (forecast_level BETWEEN 0 AND 3),
    data_start_date DATE,                   -- First day of data
    days_of_data INTEGER DEFAULT 0,
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(business_id)
);

-- Product-level demand tracking
CREATE TABLE product_demand (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id),
    product_name VARCHAR(200) NOT NULL,     -- Normalized product name
    product_category VARCHAR(50),           -- arroz, pollo, cemento, etc.
    -- Demand metrics (rolling, updated daily)
    avg_daily_units DECIMAL(10,2),          -- Average daily units sold
    avg_weekly_units DECIMAL(10,2),         -- Average weekly units sold
    day_of_week_pattern JSONB,              -- {"lun": 5.2, "mar": 4.8, ..., "dom": 8.1}
    trend_slope DECIMAL(8,4),              -- Units/day trend (positive = growing)
    last_30d_total DECIMAL(12,2),          -- Total units last 30 days
    -- Inventory integration
    current_stock DECIMAL(10,2),           -- Last known stock (from yaya-inventory)
    reorder_point DECIMAL(10,2),           -- Auto-calculated: avg_daily × (lead_time + safety_days)
    reorder_quantity DECIMAL(10,2),         -- Suggested order quantity (covers 1-2 weeks)
    last_purchase_price DECIMAL(10,2),     -- Last known unit cost
    last_purchase_date DATE,
    -- Status
    stock_status VARCHAR(20) DEFAULT 'ok' CHECK (stock_status IN (
        'ok', 'low', 'critical', 'overstock', 'unknown'
    )),
    days_until_stockout DECIMAL(5,1),      -- Estimated days at current rate
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(business_id, product_name)
);

CREATE INDEX idx_demand_business ON product_demand(business_id);
CREATE INDEX idx_demand_status ON product_demand(stock_status);
CREATE INDEX idx_demand_stockout ON product_demand(days_until_stockout) WHERE days_until_stockout < 7;

-- Daily demand snapshots (for building history)
CREATE TABLE demand_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id),
    snapshot_date DATE NOT NULL,
    -- Aggregate metrics
    total_sales DECIMAL(12,2),
    transaction_count INTEGER,
    -- Product breakdown (top items)
    top_products JSONB,   -- [{"name": "pollo", "units": 85, "revenue": 2975}, ...]
    -- Day context
    day_of_week VARCHAR(10),
    is_holiday BOOLEAN DEFAULT false,
    is_payday_zone BOOLEAN DEFAULT false,  -- Within 2 days of 15th or 30th
    holiday_name VARCHAR(100),
    -- Weather (optional, for future use)
    weather_condition VARCHAR(30),
    temperature_high DECIMAL(4,1),
    -- Forecast vs actual (for model accuracy tracking)
    forecasted_sales DECIMAL(12,2),
    forecast_error_pct DECIMAL(5,2),       -- (actual - forecast) / forecast × 100
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(business_id, snapshot_date)
);

CREATE INDEX idx_snapshot_business_date ON demand_snapshots(business_id, snapshot_date);

-- Reorder alerts log
CREATE TABLE reorder_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id),
    product_name VARCHAR(200) NOT NULL,
    alert_type VARCHAR(20) NOT NULL CHECK (alert_type IN (
        'low_stock', 'critical_stock', 'reorder_due', 'price_spike', 'trend_change'
    )),
    message TEXT NOT NULL,
    current_stock DECIMAL(10,2),
    reorder_point DECIMAL(10,2),
    suggested_quantity DECIMAL(10,2),
    estimated_cost DECIMAL(10,2),
    -- Resolution
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'ordered', 'dismissed')),
    resolved_at TIMESTAMPTZ,
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alerts_business_status ON reorder_alerts(business_id, status);

-- Shopping lists (generated for mayorista trips)
CREATE TABLE shopping_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id),
    list_date DATE NOT NULL,               -- Date the shopping is planned for
    list_type VARCHAR(20) DEFAULT 'mayorista' CHECK (list_type IN (
        'mayorista', 'mercado_diario', 'proveedor', 'emergencia'
    )),
    items JSONB NOT NULL,  -- [{"product": "arroz", "quantity": "2 sacos", "est_cost": 280, "priority": "alta", "notes": "saco 50kg"}, ...]
    total_estimated_cost DECIMAL(12,2),
    -- Owner interaction
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'purchased', 'partial')),
    actual_cost DECIMAL(12,2),             -- What they actually spent
    notes TEXT,
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_shopping_business_date ON shopping_lists(business_id, list_date);

-- Peru event calendar (pre-populated)
CREATE TABLE peru_events (
    id SERIAL PRIMARY KEY,
    event_date DATE NOT NULL,
    event_name VARCHAR(200) NOT NULL,
    event_type VARCHAR(30) NOT NULL CHECK (event_type IN (
        'feriado_nacional', 'feriado_regional', 'comercial', 
        'religioso', 'deportivo', 'escolar', 'payday'
    )),
    -- Impact estimates by business type
    impact_restaurante DECIMAL(4,2) DEFAULT 1.0,  -- Multiplier: 1.0 = normal, 1.5 = +50%
    impact_bodega DECIMAL(4,2) DEFAULT 1.0,
    impact_ferreteria DECIMAL(4,2) DEFAULT 1.0,
    impact_general DECIMAL(4,2) DEFAULT 1.0,
    -- Scope
    region VARCHAR(50),                     -- NULL = nationwide, else specific region
    description TEXT,
    recurring BOOLEAN DEFAULT false,        -- true = same date every year
    recurring_rule VARCHAR(100)             -- e.g., "15th of every month", "Easter -2 days"
);

-- Pre-populate key Peru events
INSERT INTO peru_events (event_date, event_name, event_type, impact_restaurante, impact_bodega, impact_ferreteria, recurring, recurring_rule) VALUES
-- National holidays 2026
('2026-01-01', 'Año Nuevo', 'feriado_nacional', 0.3, 0.5, 0.2, true, 'jan-01'),
('2026-04-02', 'Jueves Santo', 'religioso', 1.4, 1.2, 0.5, true, 'easter-2'),
('2026-04-03', 'Viernes Santo', 'religioso', 1.5, 1.3, 0.3, true, 'easter-1'),
('2026-05-01', 'Día del Trabajo', 'feriado_nacional', 0.8, 0.6, 0.3, true, 'may-01'),
('2026-05-10', 'Día de la Madre', 'comercial', 1.8, 1.3, 0.8, true, 'may-second-sunday'),
('2026-06-07', 'Batalla de Arica', 'feriado_nacional', 0.7, 0.5, 0.3, true, 'jun-07'),
('2026-06-21', 'Día del Padre', 'comercial', 1.4, 1.1, 1.0, true, 'jun-third-sunday'),
('2026-06-29', 'San Pedro y San Pablo', 'feriado_nacional', 0.8, 0.7, 0.3, true, 'jun-29'),
('2026-07-23', 'Día de la Fuerza Aérea', 'feriado_nacional', 1.0, 1.0, 0.8, true, 'jul-23'),
('2026-07-28', 'Fiestas Patrias', 'feriado_nacional', 1.8, 1.5, 0.4, true, 'jul-28'),
('2026-07-29', 'Fiestas Patrias', 'feriado_nacional', 1.6, 1.4, 0.3, true, 'jul-29'),
('2026-08-06', 'Batalla de Junín', 'feriado_nacional', 0.8, 0.7, 0.3, true, 'aug-06'),
('2026-08-30', 'Santa Rosa de Lima', 'feriado_nacional', 0.8, 0.7, 0.3, true, 'aug-30'),
('2026-10-08', 'Combate de Angamos', 'feriado_nacional', 0.8, 0.7, 0.3, true, 'oct-08'),
('2026-11-01', 'Día de Todos los Santos', 'feriado_nacional', 0.8, 0.8, 0.3, true, 'nov-01'),
('2026-12-08', 'Inmaculada Concepción', 'feriado_nacional', 0.9, 1.1, 0.4, true, 'dec-08'),
('2026-12-09', 'Batalla de Ayacucho', 'feriado_nacional', 0.9, 1.1, 0.4, true, 'dec-09'),
('2026-12-25', 'Navidad', 'feriado_nacional', 0.3, 0.5, 0.2, true, 'dec-25'),
-- Payday cycles (recurring monthly)
('2026-01-15', 'Quincena', 'payday', 1.2, 1.3, 1.1, true, 'monthly-15'),
('2026-01-30', 'Fin de mes', 'payday', 1.2, 1.3, 1.1, true, 'monthly-30'),
-- Semana Santa 2026 impact zone (high fish/seafood demand)
('2026-03-30', 'Semana Santa inicio', 'religioso', 1.3, 1.2, 0.6, false, NULL),
-- Campaña navideña
('2026-12-01', 'Inicio campaña navideña', 'comercial', 1.1, 1.3, 1.0, true, 'dec-01'),
('2026-12-15', 'Pico campaña navideña', 'comercial', 1.3, 1.5, 0.8, true, 'dec-15'),
-- Escolar
('2026-03-02', 'Inicio clases (costa)', 'escolar', 1.0, 1.2, 0.9, true, 'mar-first-monday'),
('2026-07-20', 'Vacaciones medio año', 'escolar', 0.9, 0.9, 0.5, true, 'jul-third-week');
```

## MCP Tools Required
- `postgres-mcp` — Primary storage: demand data, forecasts, shopping lists, product demand
- `yaya-ledger` — Daily sales data (revenue, transaction counts, product-level if available)
- `yaya-restaurant` — Dish-level sales data, recipe ingredients for recipe explosion
- `yaya-inventory` — Current stock levels, stock movements
- `yaya-suppliers` — Supplier info, lead times, last purchase prices
- `yaya-expenses` — Purchase costs, price history for budget estimation
- `yaya-analytics` — Historical sales trends, period comparisons
- `whatsapp-mcp` — Send reorder alerts, shopping lists, weekly planning messages

## Forecasting Algorithms

### Algorithm: Last-Week-Same-Day (Level 1)
```
forecast(day) = sales(day - 7)
adjustment = (avg_last_7_days / avg_previous_7_days - 1)  // trend
forecast_adjusted = forecast(day) × (1 + adjustment × 0.5)  // damped trend
confidence_range = ±20%
```

### Algorithm: Weighted Moving Average (Level 2)
```
// Weights: most recent week gets 4x, week before 2x, week before that 1x
w = [4, 2, 1]  // last 3 same-day observations
forecast(day) = Σ(w[i] × sales(day - 7×(i+1))) / Σ(w[i])
// Payday adjustment
if is_payday_zone(day):
    payday_multiplier = avg(payday_days) / avg(non_payday_days)
    forecast *= payday_multiplier
// Day-of-week seasonal index
dow_index = avg(day_of_week_sales) / avg(all_days_sales)
forecast *= dow_index
confidence_range = ±12-15%
```

### Algorithm: Seasonal Decomposition (Level 3)
```
// Monthly seasonal index (after 3+ months)
month_index = avg(month_sales) / avg(all_months_sales)
// Combine: base × day_of_week × month × trend × event
forecast = base_daily × dow_index × month_index × (1 + trend_slope × days_ahead) × event_multiplier
// Event multiplier from peru_events table
confidence_range = ±8-10%
```

### Reorder Point Calculation
```
reorder_point = avg_daily_demand × (lead_time_days + safety_stock_days)
reorder_quantity = avg_daily_demand × 14  // 2-week supply
// Adjust for upcoming events
if has_event_next_7_days:
    reorder_quantity *= event_multiplier
```

### Forecast Accuracy Tracking
```
// After each day, compare forecast vs actual
error = (actual - forecast) / forecast × 100
// Rolling MAPE (Mean Absolute Percentage Error)
mape_7d = avg(abs(error)) over last 7 days
// Use MAPE to adjust confidence ranges
// If MAPE > 25%: widen confidence interval
// If MAPE < 10%: narrow confidence interval
// Track and improve over time
```

## Natural Language Patterns

### Demand Questions (Spanish)
```
Purchase planning:
  "¿Cuántos pollos compro para mañana?" → product_forecast("pollo", tomorrow)
  "¿Cuánto arroz necesito esta semana?" → product_forecast("arroz", this_week)
  "¿Qué llevo al mayorista?" → generate_shopping_list(next_purchase_day)
  "¿Cuánta plata llevo al mercado?" → purchase_budget(tomorrow)
  "¿Cuánto compro para el domingo?" → day_forecast(next_sunday)
  
Pattern questions:
  "¿Qué día vendo más?" → day_of_week_analysis()
  "¿Cuál es mi producto estrella?" → top_products(period=last_30d)
  "¿Cuánto vendí el sábado pasado?" → historical_lookup(last_saturday)
  "¿Están subiendo mis ventas?" → trend_analysis()
  "¿Cómo me va vs el mes pasado?" → period_comparison(this_month, last_month)
  
Waste/overstock:
  "¿Estoy comprando de más?" → overstock_analysis()
  "¿Cuánto estoy botando?" → waste_report() (integrates with yaya-restaurant waste tracking)
  
Event planning:
  "¿Cuánto compro para Fiestas Patrias?" → event_forecast("fiestas_patrias")
  "Viene un feriado, ¿preparo más?" → next_event_impact()
  "¿Cómo fue el Día de la Madre el año pasado?" → historical_event_lookup()
  
Reorder:
  "¿Me va a alcanzar el cemento hasta el lunes?" → stockout_estimate("cemento")
  "¿Cuándo tengo que pedir más aceite?" → reorder_timing("aceite")
```

## Behavior Guidelines

### Communication Style
- **Be concrete, not abstract.** "Compra 85 pollos" not "La demanda proyectada es de 85 unidades"
- **Round to useful numbers.** "Unos 80-85 pollos" not "83.7 pollos"
- **Include the why.** "85 pollos — el sábado pasado vendiste 78 y la tendencia viene subiendo"
- **Show confidence honestly.** "Con tu data de 2 semanas, esto es una estimación. La próxima semana será más precisa 📊"
- **Use money, not percentages.** "Estás comprando ~S/120 de más por semana en pollo" not "Tu overstock es 8.3%"

### Shopping List Format (WhatsApp-optimized)
```
🛒 Lista de compras — Mercado mayorista Sáb 22 Mar

🔴 URGENTE (stock < 2 días):
• Arroz: 2 sacos 50kg (~S/280)
• Aceite: 1 caja 12u (~S/78)

🟡 NECESARIO (stock < 1 semana):
• Azúcar: 1 saco 50kg (~S/130)
• Fideos: 2 paq 20u (~S/48)
• Atún: 2 cajas 48u (~S/144)

🟢 OPCIONAL (stock ok pero buen precio):
• Leche: si está en oferta

💰 Total estimado: S/680
(Llevar S/750 por variación de precios)

📊 Basado en tus ventas de las últimas 3 semanas
```

### Forecast Response Format
```
📊 Pronóstico para mañana (miércoles)

💰 Ventas estimadas: S/380-420
📦 ~25 transacciones

🔮 ¿Por qué?
• Miércoles promedio: S/370
• Tendencia reciente: +5%
• Mañana es quincena: +15% esperado

🛒 Necesitas:
• 75 pollos (vs 70 del miércoles pasado)
• Presupuesto mercado: ~S/580

⚠️ Nivel de confianza: medio (tienes 3 semanas de datos)
```

### Reorder Alert Format
```
⚠️ Stock bajo — Cemento Portland

📦 Te quedan: ~15 bolsas
📉 Ritmo de venta: 8 bolsas/día
⏰ Se acaba en: ~2 días (viernes)
🚚 Tiempo de entrega: 1 día

👉 Recomendación: Pedir hoy 50 bolsas
💰 Costo estimado: S/1,250 (última compra: S/25/bolsa)

¿Quieres que arme el pedido? (integración con yaya-suppliers)
```

### Honest About Uncertainty
- **With <7 days data:** "Aún no tengo suficientes datos de tu negocio. Basándome en negocios similares, un [tipo] promedio en [ciudad] vende ~S/[X]/día. ¿Se parece?"
- **With 7-28 days data:** "Basándome en tus últimas [N] semanas..."
- **With 28+ days data:** "Tu patrón muestra que..."
- **After wrong prediction:** "Ayer estimé S/380 y vendiste S/300. Mi pronóstico estuvo 21% arriba. Estoy ajustando para las próximas predicciones 🔄"
- **Never overconfident.** Forecasting is probabilistic. Say "estimo", "calculo", "espero" — not "vas a vender".

### Integration Behavior
- **With yaya-ledger:** Reads daily sales data. If no ledger data yet, prompts: "Para darte mejores predicciones, cuéntame tus ventas del día con yaya-ledger"
- **With yaya-restaurant:** Reads dish sales for recipe explosion (dish → ingredients → purchase list)
- **With yaya-inventory:** Reads current stock for reorder calculations. If inventory not tracked, estimates from purchase frequency
- **With yaya-suppliers:** Pulls lead times and preferred suppliers for reorder alerts. Can auto-generate PO
- **With yaya-expenses:** Reads purchase costs for budget estimation and price trend tracking

## Cron Schedules

```yaml
daily_demand_snapshot:
  schedule: "30 22 * * *"        # 10:30 PM every day (after day closes)
  description: "Capture daily demand snapshot, update forecasts, refresh product demand metrics"
  action: |
    1. Pull today's sales from yaya-ledger/yaya-analytics
    2. Update demand_snapshots table
    3. Recalculate product_demand averages and trends
    4. Check forecast accuracy (compare yesterday's forecast vs actual)
    5. Update forecast_level if enough data accumulated

morning_purchase_plan:
  schedule: "0 5 * * 1-6"       # 5 AM Mon-Sat (before mercado trip)
  condition: "Only if business has purchase_days including today, or is a restaurant (daily purchases)"
  description: "Send today's suggested purchase list"
  message: "🌅 Buenos días! Aquí va tu lista de compras para hoy..."
  action: |
    1. Generate shopping list based on stock levels + demand forecast
    2. Include budget estimate
    3. Send via WhatsApp

weekly_planning:
  schedule: "0 20 * * 0"        # Sunday 8 PM
  description: "Weekly demand outlook and purchase planning"
  message: "📊 Aquí va tu plan de compras para la semana..."
  action: |
    1. Generate 7-day demand forecast
    2. Identify purchase needs for the week
    3. Estimate total weekly purchase budget
    4. Flag upcoming events/holidays

reorder_check:
  schedule: "0 10,16 * * *"     # 10 AM and 4 PM daily
  description: "Check stock levels against reorder points"
  condition: "Only if yaya-inventory integration is active"
  action: |
    1. Query product_demand for items below reorder_point
    2. Generate reorder alerts for critical items
    3. Send via WhatsApp (max 2 alerts per check to avoid spam)

monthly_forecast_report:
  schedule: "0 9 1 * *"         # 1st of month, 9 AM
  description: "Monthly forecast accuracy report and next month outlook"
  action: |
    1. Calculate MAPE for last month
    2. Show best/worst predicted days
    3. Generate next month outlook with event calendar
    4. Compare vs last month actual

forecast_model_update:
  schedule: "0 3 * * 1"         # Monday 3 AM
  description: "Update forecast models, recalculate seasonal indices, refresh event calendar"
  action: |
    1. Recalculate all seasonal indices (day-of-week, monthly)
    2. Update trend slopes
    3. Refresh peru_events for upcoming events
    4. Upgrade forecast_level if data threshold crossed
```

## Onboarding Flow

### First Interaction
```
"¡Hola! Soy tu planificador de compras 🛒

Te ayudo a saber cuánto comprar y cuándo. Para empezar, necesito conocer tu negocio:

1. ¿Qué tipo de negocio tienes? (bodega, restaurante, ferretería, otro)
2. ¿Cuánto vendes en un día normal? (aproximado está bien)
3. ¿Qué día vas al mayorista?"
```

### After 7 Days
```
"📊 ¡Ya tengo 1 semana de datos!

Tu patrón hasta ahora:
• Mejor día: Sábado (S/520)
• Día más flojo: Martes (S/280)
• Promedio: S/385/día

A partir de ahora, puedo darte estimaciones más personalizadas. 
Pregúntame '¿cuánto compro para mañana?' cuando quieras 🛒"
```

### After 30 Days
```
"📊 ¡1 mes de datos! Tu pronóstico ahora es más preciso.

Descubrí que:
• Vendes ~30% más en quincena (15-17 del mes)
• Los sábados son consistentemente tu mejor día
• Tus 3 productos estrella: [x], [y], [z]

Error promedio de mis pronósticos: ±14%. Cada semana mejoro 📈"
```

## Error Handling
- **No sales data yet:** "Aún no tengo datos de tus ventas. ¿Quieres que te ayude a empezar a registrar con yaya-ledger?"
- **Insufficient data for product forecast:** "No tengo datos de venta de [producto] aún. ¿Cuánto vendes normalmente en una semana?"
- **Conflicting data:** If ledger shows S/500 but owner says "vendí S/300", ask: "Tus registros suman S/500 pero me dices S/300. ¿Cuál es el correcto?"
- **Extreme forecast error:** If error > 40%, flag it and ask: "Mi pronóstico de ayer estuvo muy lejos. ¿Pasó algo inusual? (feriado, clima, competencia nueva)"

## Privacy & Security
- Forecast data is business-private. Never share between businesses.
- Industry-average benchmarks are anonymized and aggregated (no individual business data).
- Shopping lists may be shared with suppliers via yaya-suppliers integration (owner must approve first).
- Price data is used for budget estimation only. No price-sharing between competing businesses.

## Cultural Notes
- **"Mercado" and "mayorista"** are distinct. Mercado = daily fresh market (fruits, vegetables, meat). Mayorista = bulk wholesale (rice, sugar, oil by the sack).
- **"Saco"** = standard bulk unit (typically 50kg for rice/sugar/flour)
- **"Caja"** = box/case (12-48 units depending on product)
- **"Quincena"** = 15th of month payday. "Fin de mes" = 30th/31st. Both are major purchase triggers.
- **"Campaña"** = high-sales season (navideña, escolar). Not a marketing campaign.
- **Fresh markets run early.** Pollerías buy at 4-5 AM. Bodegueros at 5-6 AM. Shopping lists need to be ready by then.
- **Weather matters regionally.** Costa: hot = more drinks. Sierra: cold = more soups. Selva: rain = lower foot traffic.
- **"Feria" vs "feriado"** — Feria = weekly/special market day (positive for sales). Feriado = holiday (many shops close, restaurants can go either way).
