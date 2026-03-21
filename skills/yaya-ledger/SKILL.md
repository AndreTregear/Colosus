# yaya-ledger — Simplified Daily Sales & Cash Ledger

## Description
Ultra-simple daily sales and cash tracking for bodegas, tiendas, and micro-retailers who don't use POS systems or formal inventory. Replaces the paper cuaderno de ventas with a WhatsApp-native quick-log system. Business owners log sales as they happen — by amount, by product batch, or at end-of-day as a lump sum. Tracks cash-in-hand, Yape/Plin digital payments, calculates daily totals, and builds sales history over time for analytics. Designed for the 1M+ Peruvian bodegas and tiendas where ERPNext is overkill and the owner sells 50-200 small transactions per day from behind a counter.

No SKU catalog required. No barcode scanning. No item-level inventory. Just: "vendí S/15" or "hoy vendí S/380 total". That's it. The cuaderno digital.

## When to Use
- Business owner logs a sale ("vendí", "me pagaron", "venta", "cobré")
- Business owner logs end-of-day total ("hoy vendí S/380", "cerré caja en S/450")
- Business owner asks daily/weekly/monthly totals ("¿cuánto vendí hoy?", "¿cómo fue la semana?")
- Business owner does caja chica reconciliation ("empecé con S/100 y ahora tengo S/430")
- Business owner tracks payment method splits ("S/250 efectivo, S/130 Yape")
- Business owner logs a quick batch ("3 arroces de S/3.50, 2 aceites de S/8")
- Business owner wants to compare days/weeks ("¿vendí más ayer o hoy?", "¿cuál fue mi mejor día?")
- An end-of-day summary cron job triggers
- Business owner is onboarding and needs guided first-day data capture

## Target Users
- **Bodegueras/bodegueros** — Counter sales, 50-200 transactions/day, no POS
- **Tiendas de abarrotes** — Neighborhood grocery stores
- **Ambulantes formalizados** — Street vendors with fixed locations
- **Mercado stall owners** — Market vendors selling produce, meat, clothes
- **Peluquerías básicas** — Small salons tracking walk-in revenue
- **Any micro-business** that currently tracks sales on paper or not at all

## Capabilities

### Core: Quick Sale Logging
- **Amount-only logging** — "vendí S/15" → logged with timestamp, payment method defaults to efectivo
- **Batch logging** — "3 arroces a S/3.50 y 2 aceites a S/8" → S/26.50 total, items noted
- **End-of-day lump sum** — "hoy vendí S/380 en total" → single entry closing the day
- **Payment method** — Auto-detect: "me yapearon S/45" → Yape. "pagó con Plin" → Plin. Default: efectivo
- **Voice logging** — "Vendí veinte soles" via voice note → S/20 logged
- **Photo logging** — Send photo of paper cuaderno → OCR extracts amounts (best-effort)

### Core: Cash Box (Caja) Tracking
- **Opening balance** — "empecé con S/100 en caja" → sets day's starting cash
- **Running balance** — After each sale: "Caja: S/100 (inicio) + S/280 (ventas efectivo) - S/50 (vuelto dado) = S/330"
- **Cash out tracking** — "saqué S/50 para pasajes" → deducted from caja (logged as personal withdrawal or expense)
- **End-of-day reconciliation** — "tengo S/415 en caja" → compares vs expected. Difference flagged: "Esperado: S/430, Contaste: S/415. Diferencia: -S/15 🤔"
- **Yape/Plin separate** — Digital payments tracked separately from physical cash. "Efectivo: S/280, Yape: S/95, Plin: S/45 → Total: S/420"

### Core: Daily Summaries
- **Auto end-of-day** — Cron at 9 PM: "📊 Resumen del día:\n💰 Ventas: S/420\n💵 Efectivo: S/280\n📱 Yape: S/95\n📱 Plin: S/45\n📦 Transacciones: 23\n💸 Retiros: S/50 (pasajes)\n🏦 Caja final: S/330"
- **Comparison** — "vs ayer: +S/35 (+9%) 📈" or "vs promedio semana: -S/20 (-5%) 📉"
- **Weekly digest** — Monday morning: week totals, best day, worst day, daily average, payment method breakdown
- **Monthly report** — 1st of month: month totals, weekly trend, top days, comparison vs previous month

### Analytics (grows over time)
- **Best/worst day** — "Tu mejor día fue el sábado: S/580. Tu peor: martes S/180"
- **Day-of-week patterns** — "Los sábados vendes 40% más que entre semana"
- **Payment method trends** — "Yape subió de 15% a 28% de tus ventas este mes"
- **Growth tracking** — "Esta semana vendiste 12% más que la semana pasada 📈"
- **Seasonality** — After 3+ months: "Diciembre suele ser tu mejor mes (S/12,000 promedio)"

### Guided Onboarding (First Week)
Day 1: "¡Hola! Soy tu cuaderno de ventas digital 📓 Solo dime cuánto vendes y yo llevo la cuenta. ¿Con cuánta plata empiezas hoy en caja?"
Day 2: "¿Cómo te fue ayer? Hoy intenta avisarme cada venta grande (más de S/10). Las chiquitas las sumamos al cierre 😉"
Day 3: "Ya llevas 2 días. Tu promedio es S/[X]. ¿Quieres que te mande un resumen automático a las 9pm?"
Day 7: "🎉 ¡Primera semana completa! Aquí va tu resumen..." [full weekly digest]

## Data Model

### PostgreSQL Tables

```sql
-- Ledger entries: each sale or cash movement
CREATE TABLE ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id),
    entry_type VARCHAR(20) NOT NULL CHECK (entry_type IN (
        'sale',           -- Normal sale
        'batch_sale',     -- Multiple items in one entry  
        'day_total',      -- End-of-day lump sum
        'cash_out',       -- Cash withdrawal (personal or expense)
        'cash_in',        -- Cash added to register
        'opening',        -- Opening balance
        'closing',        -- Closing count
        'adjustment'      -- Manual correction
    )),
    amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(20) DEFAULT 'efectivo' CHECK (payment_method IN (
        'efectivo', 'yape', 'plin', 'transferencia', 'tarjeta', 'mixto', 'fiado'
    )),
    -- Optional item details (for batch sales)
    items JSONB,  -- [{"name": "arroz", "qty": 3, "price": 3.50}, ...]
    notes TEXT,    -- Free-text notes from the owner
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    business_date DATE NOT NULL DEFAULT CURRENT_DATE,  -- The business day (may differ from created_at if logged late)
    -- Source
    source VARCHAR(20) DEFAULT 'chat' CHECK (source IN ('chat', 'voice', 'photo', 'cron', 'api')),
    -- Metadata
    raw_message TEXT,  -- Original WhatsApp message for audit trail
    confidence DECIMAL(3,2) DEFAULT 1.00  -- OCR/voice confidence score
);

CREATE INDEX idx_ledger_business_date ON ledger_entries(business_id, business_date);
CREATE INDEX idx_ledger_type ON ledger_entries(entry_type);

-- Daily summaries: pre-computed for fast lookups
CREATE TABLE daily_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id),
    business_date DATE NOT NULL,
    total_sales DECIMAL(12,2) DEFAULT 0,
    total_efectivo DECIMAL(12,2) DEFAULT 0,
    total_yape DECIMAL(12,2) DEFAULT 0,
    total_plin DECIMAL(12,2) DEFAULT 0,
    total_other_digital DECIMAL(12,2) DEFAULT 0,
    total_fiado DECIMAL(12,2) DEFAULT 0,
    transaction_count INTEGER DEFAULT 0,
    opening_balance DECIMAL(12,2),
    closing_balance DECIMAL(12,2),
    expected_cash DECIMAL(12,2),  -- Calculated: opening + efectivo sales - cash_outs
    cash_difference DECIMAL(12,2),  -- closing - expected (null if no closing logged)
    cash_outs DECIMAL(12,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(business_id, business_date)
);

CREATE INDEX idx_summary_business_date ON daily_summaries(business_id, business_date);

-- Weekly/monthly materialized views for analytics
CREATE MATERIALIZED VIEW weekly_summaries AS
SELECT 
    business_id,
    DATE_TRUNC('week', business_date)::DATE AS week_start,
    SUM(total_sales) AS total_sales,
    SUM(total_efectivo) AS total_efectivo,
    SUM(total_yape + total_plin + total_other_digital) AS total_digital,
    SUM(total_fiado) AS total_fiado,
    SUM(transaction_count) AS transaction_count,
    AVG(total_sales) AS daily_average,
    MAX(total_sales) AS best_day_amount,
    MIN(total_sales) FILTER (WHERE total_sales > 0) AS worst_day_amount,
    COUNT(*) AS days_logged
FROM daily_summaries
GROUP BY business_id, DATE_TRUNC('week', business_date);

CREATE MATERIALIZED VIEW monthly_summaries AS
SELECT 
    business_id,
    DATE_TRUNC('month', business_date)::DATE AS month_start,
    SUM(total_sales) AS total_sales,
    SUM(total_efectivo) AS total_efectivo,
    SUM(total_yape + total_plin + total_other_digital) AS total_digital,
    SUM(total_fiado) AS total_fiado,
    SUM(transaction_count) AS transaction_count,
    AVG(total_sales) AS daily_average,
    MAX(total_sales) AS best_day_amount,
    COUNT(*) AS days_logged
FROM daily_summaries
GROUP BY business_id, DATE_TRUNC('month', business_date);
```

## MCP Tools Required
- `postgres-mcp` — Primary storage: ledger entries, daily summaries, analytics queries
- `whatsapp-mcp` — Send daily/weekly summaries, reminders to log sales
- `yaya-expenses` — Cross-reference for P&L: ledger revenue + expenses = profit
- `yaya-fiados` — When payment_method='fiado', cross-link to fiado tab
- `yaya-analytics` — Feed daily totals into analytics for trend/comparison features

## Natural Language Parsing

### Sale Detection Patterns (Spanish)
```
Amount patterns:
  "vendí S/15" → sale, S/15, efectivo
  "me pagaron 20 soles" → sale, S/20, efectivo
  "venta de 35" → sale, S/35, efectivo
  "cobré S/180" → sale, S/180, efectivo
  "vendí 45 solcitos" → sale, S/45, efectivo  (diminutive)
  
Payment method detection:
  "me yapearon S/30" → sale, S/30, yape
  "pagó con Yape" → yape
  "por Plin" → plin
  "con tarjeta" → tarjeta
  "transferencia" → transferencia
  "lo anotó / se lo llevó fiado" → fiado (→ link to yaya-fiados)
  
Batch patterns:
  "3 arroces de S/3.50" → batch_sale, items: [{arroz, 3, 3.50}], total: S/10.50
  "vendí 2 aceites a 8 soles y 1 azúcar a 4" → batch_sale, S/20
  "5 recargas de S/3" → batch_sale, S/15
  
Day total patterns:
  "hoy vendí S/380" → day_total (only if no individual sales logged today)
  "total del día: S/420" → day_total
  "cerré caja en S/450" → closing balance (not sale)
  
Cash movements:
  "saqué S/50 para pasajes" → cash_out, S/50
  "puse S/200 más en caja" → cash_in, S/200
  "empecé con S/100" → opening, S/100
  "tengo S/430 en caja" → closing, S/430
```

### Ambiguity Resolution
- If unclear whether sale or expense: "¿Eso fue una venta o un gasto?"
- If amount unclear: "¿Cuánto fue? No me quedó claro el monto 🤔"
- If voice confidence < 0.7: "Escuché 'veinte soles', ¿es correcto?"
- If day_total conflicts with individual entries: "Hoy ya tienes S/[X] en ventas individuales. ¿Los S/380 son el total del día o una venta adicional?"

## Behavior Guidelines

### Simplicity Above All
- **One message = one action.** Log it, confirm it, show the running total. Done.
- **No jargon.** Say "ventas" not "revenue". Say "ganancia" not "utilidad neta". Say "caja" not "saldo de efectivo".
- **No onboarding walls.** First interaction: "Dime cuánto vendiste y yo anoto 📝". Zero setup required.
- **Forgive imprecision.** "vendí como 20 soles" → log S/20. Don't ask "¿fue exactamente S/20.00?"
- **Default to efectivo.** 70%+ of bodega sales are cash. Don't ask payment method unless they specify digital.

### Confirmation Format (WhatsApp)
```
After logging a sale:
  ✅ Venta: S/15 (efectivo)
  📊 Hoy: S/245 (17 ventas)

After logging batch:
  ✅ Venta: S/26.50
  • 3 arroz × S/3.50 = S/10.50
  • 2 aceite × S/8.00 = S/16.00
  📊 Hoy: S/271.50 (18 ventas)

After cash out:
  💸 Retiro: S/50 (pasajes)
  📊 Caja: S/195 → S/145

After closing:
  🔒 Cierre de caja:
  💰 Ventas hoy: S/420
  💵 Efectivo: S/280 | 📱 Yape: S/95 | 📱 Plin: S/45
  🏦 Caja: esperado S/330, contaste S/325
  ⚠️ Diferencia: -S/5
  
End of day summary (auto, 9 PM):
  📊 Resumen del día — Lunes 17 Mar
  💰 Total ventas: S/420
  💵 Efectivo: S/280 (67%)
  📱 Digital: S/140 (33%)
  🧾 Fiado: S/0
  📦 Transacciones: 23
  💸 Retiros: S/50
  🏦 Caja estimada: S/330
  
  vs ayer: +S/35 (+9%) 📈
  vs promedio semana: similar ✅
```

### Weekly Digest (Monday 9 AM)
```
📊 Resumen semanal — 10-16 Mar

💰 Total: S/2,650
📈 Promedio/día: S/378
🏆 Mejor día: Sábado S/580
📉 Peor día: Martes S/180

💵 Efectivo: S/1,750 (66%)
📱 Digital: S/750 (28%)
🧾 Fiado: S/150 (6%)

vs semana anterior: +S/120 (+5%) 📈

💡 Tip: Los sábados vendes 53% más que entre semana. ¿Tienes suficiente stock para el próximo sábado?
```

### Integration with Other Skills
- **yaya-expenses**: Ledger provides revenue side. Expenses provides cost side. Together = P&L. When owner asks "¿cuánto gané?", combine both.
- **yaya-fiados**: When a sale is logged as "fiado", auto-create or update the customer's tab in yaya-fiados. "La vecina Carmen se llevó fiado S/12" → ledger entry (sale, fiado) + fiado tab update.
- **yaya-analytics**: Daily summaries feed into analytics for trend analysis, day-of-week patterns, seasonality detection.

### Data Quality
- **Deduplication**: If same amount logged within 60 seconds, ask: "¿Es otra venta de S/15 o la misma que acabas de registrar?"
- **Late logging**: "vendí S/200 ayer" → backdate to yesterday. "las ventas del martes fueron S/350" → backdate to Tuesday.
- **Corrections**: "la última venta no fue 15, fue 50" → update last entry. "borra la última venta" → soft delete.

## Cron Schedules (via OpenClaw Cron)

```yaml
daily_summary:
  schedule: "0 21 * * *"        # 9 PM every day
  description: "Generate and send daily sales summary"
  action: "Calculate day totals from ledger_entries, update daily_summaries, send WhatsApp digest"

weekly_digest:
  schedule: "0 9 * * 1"         # Monday 9 AM
  description: "Weekly sales recap with trends and tips"
  action: "Aggregate weekly data, compare to previous week, generate insight tips"

monthly_report:
  schedule: "0 9 1 * *"         # 1st of month, 9 AM
  description: "Monthly sales report with trends"
  action: "Full month analysis, payment method trends, growth tracking"

midday_reminder:
  schedule: "0 13 * * *"        # 1 PM daily
  description: "Gentle reminder if no sales logged by 1 PM on a weekday"
  condition: "Only send if 0 entries today AND it's Mon-Sat AND business is active"
  message: "¿Cómo va el día? Si ya vendiste algo, cuéntame para llevar la cuenta 📝"

refresh_materialized_views:
  schedule: "0 3 * * *"         # 3 AM daily
  description: "Refresh weekly and monthly materialized views"
  action: "REFRESH MATERIALIZED VIEW weekly_summaries; REFRESH MATERIALIZED VIEW monthly_summaries;"
```

## Error Handling
- **No amount detected**: "No entendí el monto. ¿Cuánto vendiste? 🤔"
- **Negative amount**: "¿Fue una devolución? Dime y lo registro como devolución 🔄"
- **Unreasonably large**: "S/50,000 es bastante 😮 ¿Confirmas que es correcto?"
- **Unreasonably small**: Accept it — bodegas sell S/0.50 items regularly
- **No internet/delayed**: Queue locally, sync when connection returns (handled by WhatsApp MCP)

## Privacy & Security
- All financial data is business-private. Never share between businesses.
- Ledger entries include raw_message for audit trail but are only accessible by the business owner.
- No financial advice — just data presentation. "Tus ventas bajaron 20%" not "Deberías subir precios."
- Receipt photos stored encrypted, auto-deleted after 90 days unless the owner opts to keep them.

## Cultural Notes
- **"Platita"** is common slang for money. Understand it.
- **"Solcitos"** = soles (diminutive, affectionate). Parse correctly.
- **"Cachuelito"** = small/extra income. Log it as a sale.
- **"Caja chica"** = petty cash / register. Core concept.
- **End-of-day** for bodegas can be 8 PM or midnight. Don't assume.
- **Sunday sales** are common — bodegas often operate 7 days/week.
- **Mixed personal/business** is reality. Don't lecture about it. Help them track the difference.
