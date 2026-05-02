# yaya-credit — B2B Accounts Receivable & Cartera Management

## Description
Full-featured B2B credit management and accounts receivable (cartera) skill for ferreterías, wholesalers, distributors, construction material suppliers, and any business that sells on credit terms to other businesses or contractors. Handles credit term setting, credit limit management, invoice tracking, aging reports, payment recording (including partial payments with FIFO allocation), statement generation, collection workflows, customer credit scoring, credit blocks, interest/late fee calculation, credit approval workflows, portfolio analysis, and bank reconciliation — all via natural Spanish chat over WhatsApp.

In Peru and Colombia, B2B credit is the lifeblood of commerce. Ferreterías routinely extend 30-day credit to construction contractors. Wholesalers sell on 15/30/60-day terms to tiendas and bodegas. "Cartera" (accounts receivable portfolio) management is consistently the #1 operational headache for B2B businesses — more than inventory, more than sales, more than taxes. The typical ferretería owner has S/50,000-200,000 outstanding at any time, tracked in Excel spreadsheets, paper cuadernos, or worse — in their head. Lost invoices, disputed amounts, forgotten payments, and customers who dodge cobros are the daily reality.

This skill replaces that chaos with a WhatsApp-native credit management system that tracks every sol, applies payments intelligently, sends culturally appropriate collection reminders at the right cadence, scores customers by payment behavior, and gives the business owner a real-time picture of their cartera health. Designed for the 200K+ ferreterías, 50K+ wholesalers/distributors, and thousands of construction suppliers across Peru where "el que vende a crédito y no cobra bien, quiebra" (whoever sells on credit and doesn't collect well, goes bankrupt).

Unlike yaya-fiados (which handles informal B2C credit tabs between a bodega and neighborhood customers for S/5-50 amounts), yaya-credit handles formal B2B credit relationships — invoiced amounts of S/500-50,000+, contractual payment terms, professional collection workflows, and interest calculations. The amounts are larger, the relationships are more formal (though still personal in LATAM), and the consequences of bad debt are existential.

## When to Use
- Business owner sets credit terms for a customer ("Constructora Pérez tiene 30 días de crédito")
- Business owner sets or adjusts a credit limit ("El límite de crédito de Constructora Pérez es S/5,000")
- Business owner creates or records a credit sale/invoice ("Constructora Pérez compró S/3,200 de materiales a 30 días")
- Business owner asks about outstanding invoices ("¿Cuánto me debe Constructora Pérez?", "¿Qué facturas tiene pendientes?")
- Business owner asks for aging report ("¿Quién me debe más de 30 días?", "¿Cómo está mi cartera?")
- A customer makes a full or partial payment ("Constructora Pérez pagó S/3,000 de su deuda")
- Business owner asks for a customer statement ("Mándale su estado de cuenta a Constructora Pérez")
- Business owner wants to send collection reminders ("Recuérdale a los morosos que paguen")
- Business owner asks about a customer's credit behavior ("¿Constructora Pérez es buena paga?")
- Business owner wants to block a customer from credit ("No le vendas más a crédito a Empresa X hasta que pague")
- Business owner asks about interest or late fees ("¿Cuánto le cobro de mora a Constructora Pérez?")
- Business owner asks for portfolio summary ("¿Cuánto me deben en total?", "¿Cómo anda mi cartera?")
- A new credit request needs owner approval ("Empresa Y quiere crédito de S/10,000")
- Business owner needs to reconcile bank deposits ("Me llegó un depósito de S/5,000 de Empresa Z")
- A customer's payment is overdue and automated reminders need to trigger
- Business owner asks for cash flow projection ("¿Cuánto me va a entrar este mes?")
- Business owner compares customer payment behavior ("¿Quiénes son mis mejores clientes a crédito?")
- Voice note: "oye el ingeniero Pérez no me paga la factura de hace dos meses, mándale un mensaje"
- Credit limit would be exceeded by a new sale ("Constructora Pérez quiere comprar S/2,000 más pero ya tiene S/4,500 de crédito")

## Target Users
- **Ferreterías** — 200K+ in Peru. Sell construction materials on 15-60 day credit to contractors and construction companies. Average cartera: S/50,000-200,000.
- **Wholesalers/Distribuidores** — Sell bulk goods on credit to tiendas and smaller retailers. Credit terms are standard in the industry.
- **Construction material suppliers** — Cement, steel, aggregates. Large invoices (S/5,000-50,000+), 30-60 day terms are the norm.
- **Industrial suppliers** — Sell to factories, workshops, and manufacturers on credit.
- **Agricultural input suppliers** — Sell fertilizers, seeds, tools on credit to farmers. Payment tied to harvest cycles.
- **Medical/pharmaceutical distributors** — Sell to pharmacies and clinics on 30-60 day terms.
- **Any B2B MYPE** that extends trade credit and needs to track receivables beyond informal fiado tabs.

## Capabilities

### 1. Credit Terms Management
- **Set terms per customer** — "Constructora Pérez tiene 30 días de crédito" → stores payment terms for that customer
- **Standard term options** — Contado (cash on delivery), 7 días, 15 días, 30 días, 45 días, 60 días, 90 días, a la quincena (every 15th and 30th)
- **Custom terms** — "Empresa X paga los viernes" or "Pagos cada quincena" → flexible payment schedules
- **Term inheritance** — Set default terms per customer category: "Los contratistas tienen 30 días, las tienditas 15 días"
- **Term change history** — Track when terms changed: "Constructora Pérez pasó de 30 a 15 días en marzo porque pagaba tarde"
- **Voice note support** — "Ponle 30 días de crédito a la constructora del ingeniero Pérez" → sets terms

### 2. Credit Limit Management
- **Set per-customer limits** — "El límite de crédito de Constructora Pérez es S/5,000" → enforced on new sales
- **Limit check on sale** — When yaya-sales processes a credit sale, check: current outstanding + new sale ≤ credit limit. If exceeded: "⚠️ Constructora Pérez tiene S/4,500 pendiente. Nuevo pedido de S/2,000 excede su límite de S/5,000. ¿Aprobar de todas formas?"
- **Automatic limit suggestions** — Based on payment history: "Constructora Pérez ha pagado puntual 6 meses seguidos. ¿Quieres subir su límite de S/5,000 a S/8,000?"
- **Tiered limits** — Different limits by customer type: "Límite default: S/3,000 para constructoras, S/1,000 para personas naturales"
- **Temporary limit increase** — "Sube el límite de Constructora Pérez a S/10,000 por este mes" → auto-reverts after period
- **Global exposure cap** — "No quiero tener más de S/100,000 en créditos en total" → alerts when approaching

### 3. Invoice Tracking
- **Create credit invoice** — "Constructora Pérez compró S/3,200 de materiales a 30 días" → creates invoice with due date auto-calculated
- **Invoice from yaya-sales** — When a sale is closed with payment_method='crédito', auto-create receivable invoice
- **Invoice details** — Number, customer, date, due date, items/description, amount, status (pendiente/parcial/pagada/vencida/castigada)
- **Invoice search** — "¿Qué facturas tiene pendientes Constructora Pérez?" → list with amounts and due dates
- **Invoice status updates** — As payments are applied, invoice status auto-updates: pendiente → parcial → pagada
- **Overdue detection** — Daily cron checks for invoices past due date, marks as vencida, triggers collection workflow
- **Duplicate prevention** — If same customer, same amount, same day: "Ya tienes una factura de S/3,200 para Constructora Pérez de hoy. ¿Es otra venta o la misma?"
- **Invoice notes** — "La factura 0042 es por el pedido de cemento de la obra en San Borja" → adds context for dispute resolution
- **Bulk invoice creation** — "Hoy vendí a crédito: Pérez S/3,200, González S/1,500, Torres S/800" → creates 3 invoices

### 4. Aging Report (Análisis de Antigüedad)
- **Standard aging buckets** — Vigente (current), 1-30 días vencido, 31-60, 61-90, 91-120, 120+ días
- **Quick aging query** — "¿Cómo está mi cartera?" → summary by aging bucket with totals
- **Per-customer aging** — "¿Cómo está la cuenta de Constructora Pérez?" → their invoices by aging bucket
- **Top debtors** — "¿Quiénes me deben más?" → ranked list by outstanding amount
- **Worst offenders** — "¿Quiénes están más atrasados?" → ranked by oldest unpaid invoice
- **Aging trend** — "¿Mi cartera está mejorando o empeorando?" → compare aging distribution month-over-month
- **WhatsApp-formatted** — Clean, readable aging report formatted for WhatsApp (no HTML tables)
- **Export for accountant** — Generate structured data that can be shared with the business's contador

```
📊 Reporte de Cartera — 21 Mar 2026

💰 Total por cobrar: S/87,450

🟢 Vigente (no vencido): S/35,200 (40%)
🟡 1-30 días vencido: S/28,100 (32%)
🟠 31-60 días vencido: S/14,500 (17%)
🔴 61-90 días vencido: S/6,150 (7%)
⚫ 90+ días vencido: S/3,500 (4%)

📋 Top 5 deudores:
1. Constructora Pérez — S/12,800 (vencido: S/4,200)
2. Ferretería del Norte — S/9,500 (vigente)
3. Ing. García Obras — S/8,200 (vencido: S/8,200 ⚠️)
4. Distribuidora Lima — S/7,100 (vencido: S/2,300)
5. Constructora Andes — S/6,800 (vigente)

⚠️ 3 clientes con deuda > 90 días (S/3,500)
📈 vs mes pasado: cartera +5%, mora -8%
```

### 5. Payment Recording
- **Record full payment** — "Constructora Pérez pagó S/12,800, toda su deuda" → marks all invoices as paid
- **Record partial payment** — "Constructora Pérez pagó S/3,000 de su deuda" → applies FIFO (oldest invoice first)
- **Payment method** — Auto-detect: "depositó S/5,000" → transferencia; "me yapeó" → Yape; "pagó en efectivo" → efectivo; "con cheque" → cheque
- **Payment reference** — "Depósito a BCP operación 12345" → stores reference for reconciliation
- **Payment date** — "Constructora Pérez pagó ayer S/3,000" → backdate payment to yesterday
- **Multi-invoice payment** — "El pago de S/5,000 de Pérez aplícalo a la factura 0042 y 0045" → specific invoice allocation
- **Overpayment handling** — If payment exceeds outstanding: "Constructora Pérez pagó S/15,000 pero solo debe S/12,800. ¿Los S/2,200 son adelanto para futuras compras o error?"
- **Receipt confirmation** — After recording: "✅ Pago registrado: S/3,000 de Constructora Pérez (efectivo). Saldo pendiente: S/9,800"
- **Voice payment logging** — "El ingeniero Pérez me depositó cinco mil soles" → records payment

### 6. Partial Payment Allocation (FIFO)
- **Automatic FIFO** — Payments apply to oldest invoice first: if customer has invoices of S/2,000 (45 days old) and S/3,000 (15 days old), a S/2,500 payment pays off the S/2,000 invoice completely and applies S/500 to the S/3,000 invoice
- **Manual override** — "El pago de S/2,500 aplícalo a la factura 0045" → overrides FIFO for specific allocation
- **Split payment across invoices** — "Los S/5,000 de Pérez: S/3,000 a factura 0042 y S/2,000 a factura 0045"
- **Partial invoice payment** — Track partial amounts per invoice: "Factura 0042: S/3,200 total, S/2,000 pagado, S/1,200 pendiente"
- **Running balance** — After each payment, show updated balance per invoice and total

```
✅ Pago aplicado: S/3,000 de Constructora Pérez

Asignación (antigüedad primero):
• Factura 0038 (vencida 45 días): S/2,000 → PAGADA ✅
• Factura 0042 (vencida 12 días): S/1,000 de S/3,200 → Pendiente: S/2,200

💰 Saldo total pendiente: S/9,800
```

### 7. Statement Generation (Estado de Cuenta)
- **Per-customer statement** — "Mándale su estado de cuenta a Constructora Pérez" → generates statement and sends via WhatsApp
- **Statement contents** — Opening balance, invoices issued, payments received, closing balance, aging breakdown
- **Date range** — "Estado de cuenta de Constructora Pérez del último mes" → filtered by period
- **Auto-send on request** — "Manda estados de cuenta a todos los que deben más de S/5,000"
- **Professional format** — WhatsApp-optimized format with business name, date, and clear line items

```
📄 Estado de Cuenta
🏢 [Nombre del Negocio]
👤 Constructora Pérez S.A.C.
📅 Al 21 de marzo 2026

Saldo anterior (01 Mar): S/8,500

Movimientos del mes:
📦 05 Mar — Factura 0052: +S/3,200 (cemento, fierro)
📦 12 Mar — Factura 0055: +S/1,800 (tubería, accesorios)
💵 10 Mar — Pago depósito: -S/3,000
💵 18 Mar — Pago Yape: -S/2,000

Saldo actual: S/8,500

Por antigüedad:
🟢 Vigente: S/1,800 (vence 11 Abr)
🟡 1-30 días: S/3,200 (venció 05 Mar)
🟠 31-60 días: S/3,500

📞 Para consultas: [teléfono del negocio]
```

### 8. Collection Workflow (Cobro)
- **Automated reminder schedule** — Configurable escalation at key intervals after invoice due date
- **Culturally appropriate tone** — Starts gentle, becomes firm but never aggressive. Respects LATAM cobro culture
- **Pre-due reminder** — 3 days before due date: friendly heads-up
- **Grace period** — Configurable 3-5 day grace period before formal overdue status
- **Escalation tiers** — Each tier uses progressively more direct language while remaining professional

```
Día -3 (antes de vencer):
  📱 "Hola [nombre], un recordatorio amable: tu factura [#] por S/[monto]
      vence el [fecha]. ¡Gracias por tu puntualidad! 🙏"

Día +7 (1 semana vencido):
  📱 "Hola [nombre], ¿cómo estás? Te comento que la factura [#] por
      S/[monto] venció hace una semana. ¿Me puedes confirmar cuándo
      estarías haciendo el pago? Quedo atento. 🤝"

Día +15 (2 semanas vencido):
  📱 "Estimado [nombre], te escribo respecto a la factura [#] por
      S/[monto] con 15 días de vencida. Necesitamos regularizar este
      pendiente. ¿Podemos coordinar el pago esta semana? 📋"

Día +30 (1 mes vencido):
  📱 "Estimado [nombre], la factura [#] por S/[monto] tiene 30 días
      de vencida. Es importante que regularicemos esta situación. De no
      recibir el pago, lamentablemente tendremos que suspender las
      ventas a crédito. Quedo a la espera de tu respuesta. 🙏"

Día +45 (owner notified, manual follow-up):
  📱 Al dueño: "⚠️ [nombre] tiene S/[monto] con 45+ días de mora.
      Recomiendo llamada directa o visita. ¿Quieres que le mande
      un último mensaje o prefieres llamarlo tú?"

Día +60+ (credit suspended):
  → Auto-block credit for this customer
  → Flag for potential write-off review
  → Owner decides: legal action, negotiate payment plan, or write off
```

- **Manual trigger** — "Mándale un cobro a Constructora Pérez" → sends appropriate message based on aging
- **Bulk cobro** — "Manda cobros a todos los que deben más de 30 días" → batch reminders at appropriate tier
- **Response tracking** — When customer replies to cobro WhatsApp, log the response and alert owner
- **Payment promise logging** — "Pérez dice que paga el viernes" → logs promise, creates follow-up if not fulfilled
- **Collection notes** — "Pérez dice que está esperando pago de su cliente para pagarnos" → logs context for owner
- **Cobro pause** — "No le mandes cobros a Empresa X esta semana, estamos negociando" → pauses automated reminders

### 9. Customer Credit Scoring
- **Payment history score** — Based on: average days to pay, percentage of on-time payments, current overdue amount
- **Score components:**
  - **Puntualidad** — % of invoices paid within terms (weighted most heavily)
  - **Días promedio de pago** — Average days from invoice date to payment date
  - **Tendencia** — Is the customer paying faster or slower over the last 3 months?
  - **Monto en mora** — Current overdue amount as % of credit limit
  - **Antigüedad** — How long they've been a customer (longevity bonus)
  - **Frecuencia de compra** — Active buyers who pay well get bonus points
- **Score tiers:**

```
⭐⭐⭐⭐⭐ Excelente (90-100): Paga antes del vencimiento o al día.
           → Candidato para aumento de límite, mejores términos.

⭐⭐⭐⭐ Bueno (75-89): Paga con pocos días de retraso (< 10 días).
        → Términos estándar, monitoreo normal.

⭐⭐⭐ Regular (60-74): Paga con retraso moderado (10-30 días).
      → Considerar reducir términos o límite. Monitoreo cercano.

⭐⭐ Malo (40-59): Paga con retraso frecuente (30+ días).
    → Reducir límite, cambiar a contado, cobro intensivo.

⭐ Crítico (0-39): Mora crónica o impago.
   → Bloquear crédito. Evaluar castigo de deuda.
```

- **Score query** — "¿Constructora Pérez es buena paga?" → shows score, trend, and key metrics
- **Portfolio scoring** — "¿Cómo están mis clientes de crédito?" → distribution by tier
- **Score-based recommendations** — Suggest credit limit changes, term adjustments, or blocks based on behavior

### 10. Block/Unblock Credit
- **Manual block** — "No le vendas más a crédito a Empresa X hasta que pague" → blocks new credit sales
- **Automatic block** — Triggers when: overdue > 60 days, OR overdue amount > 50% of limit, OR credit score < 40
- **Block notification** — When blocked, notify business owner and optionally the customer
- **Sales integration** — When yaya-sales processes a sale to a blocked customer: "⚠️ Empresa X tiene crédito bloqueado (deuda vencida: S/8,500). Solo venta al contado."
- **Unblock** — "Desbloquea a Empresa X, ya pagó" → removes block after verifying payment
- **Conditional unblock** — "Desbloquea a Empresa X pero bájale el límite a S/2,000"
- **Block history** — Track all blocks/unblocks with reasons and dates

### 11. Interest & Late Fees (Mora)
- **Configurable rate** — "Cobro 2% mensual de mora" → stores rate, applies to overdue invoices
- **Automatic calculation** — Daily calculation of accrued interest on overdue amounts
- **Grace period** — Interest starts accruing after configurable grace period (default: 5 days post-due)
- **Interest display** — "¿Cuánto le cobro de mora a Constructora Pérez?" → shows principal, interest, total
- **Add to statement** — Interest shown as separate line item on customer statements
- **Optional/configurable** — Many businesses in Peru don't charge formal interest to maintain relationships. This is OFF by default.
- **Flat fee option** — "Cobro S/50 de penalidad por pago tardío" → flat fee instead of percentage
- **Interest waiver** — "No le cobres mora a Empresa X este mes" → waive for specific customer/period

```
📊 Mora de Constructora Pérez:

Factura 0038 — S/2,000 (vencida 45 días)
  Mora (2% mensual): S/60.00

Factura 0042 — S/3,200 (vencida 12 días)
  Mora (2% mensual): S/25.60 (12 días de 30)

Total principal vencido: S/5,200
Total mora: S/85.60
Total a cobrar: S/5,285.60
```

### 12. Credit Approval Workflow
- **Threshold-based** — New credit requests above a configurable amount require owner approval
- **New customer request** — "Empresa Y quiere S/10,000 de crédito" → creates approval request with customer info
- **Approval flow:**

```
1. Request received (from sales team or customer)
2. Auto-check: customer exists in CRM? Previous relationship?
3. If amount > threshold → Send owner notification:
   "🆕 Solicitud de crédito:
    👤 Empresa Y (RUC: 20123456789)
    💰 Límite solicitado: S/10,000
    📋 Términos solicitados: 30 días
    ℹ️ Cliente nuevo, sin historial
    ¿Aprobar ✅, rechazar ❌, o aprobar con límite menor?"
4. Owner responds → approve/reject/modify
5. If approved → set up credit terms and limit
6. If rejected → record reason, suggest contado
```

- **Auto-approve below threshold** — "Aprueba automáticamente créditos menores a S/2,000" → streamlines small requests
- **Reference check** — Prompt owner to check references before approving large limits
- **Probation period** — "Aprueba S/3,000 por 3 meses de prueba" → temporary limit with review date

### 13. Portfolio Summary (Resumen de Cartera)
- **Total receivables** — Sum of all outstanding invoices across all customers
- **Average days outstanding** — Weighted average age of receivables (DSO — Days Sales Outstanding)
- **Bad debt ratio** — Amount written off / total credit sales (trailing 12 months)
- **Collection effectiveness** — Percentage of receivables collected within terms
- **Customer concentration** — Top 5 customers as % of total cartera (concentration risk)
- **Monthly trend** — Cartera growth/decline, DSO trend, collection rate trend
- **Cash flow projection** — Based on customer payment patterns, predict when receivables will convert to cash

```
📊 Resumen de Cartera — Marzo 2026

💰 Total por cobrar: S/87,450
👥 Clientes con saldo: 23
📅 DSO (días promedio de cobro): 34 días

📈 Composición:
🟢 Vigente: S/35,200 (40%)
🟡 Vencido 1-30d: S/28,100 (32%)
🟠 Vencido 31-60d: S/14,500 (17%)
🔴 Vencido 60+d: S/9,650 (11%)

📊 Indicadores:
✅ Tasa de cobro en plazo: 68%
📉 Índice de morosidad: 28%
⚠️ Concentración top 5: 52% del total

💸 Flujo de caja proyectado:
Esta semana: S/12,000 (esperado)
Próxima semana: S/8,500
Resto del mes: S/15,200

vs mes anterior:
Cartera: +5% | DSO: -2 días (mejorando) | Morosidad: -3% ✅
```

### 14. Bank Reconciliation
- **Match deposits to invoices** — "Me llegó un depósito de S/5,000 de Constructora Pérez" → searches outstanding invoices, suggests match
- **Auto-match** — When deposit amount matches an outstanding invoice exactly, auto-suggest: "¿El depósito de S/3,200 es por la factura 0042 de Constructora Pérez?"
- **Partial match** — When deposit doesn't match any single invoice, suggest combinations: "S/5,000 podría ser: Factura 0042 (S/3,200) + Factura 0045 (S/1,800) = S/5,000 ✅"
- **Unidentified deposits** — "Me llegó un depósito de S/7,000, no sé de quién es" → search by amount across all customers, suggest matches
- **Batch reconciliation** — "Hoy me llegaron 4 depósitos: S/5,000, S/3,200, S/1,800, S/2,500" → match each to outstanding invoices
- **Reconciliation report** — "¿Cuánto me han pagado esta semana vs cuánto esperaba?" → expected vs actual collections

### 15. Integration with Other Skills

#### yaya-sales Integration
- **Credit check on sale** — Before completing a credit sale, yaya-sales calls yaya-credit to verify:
  1. Customer has credit terms set up
  2. Customer is not blocked
  3. New sale amount + outstanding ≤ credit limit
  4. If any check fails → alert salesperson/owner with specific reason
- **Auto-invoice creation** — When yaya-sales closes a credit sale, auto-create receivable in yaya-credit
- **Credit status in customer profile** — Sales team can see credit status when interacting with customer

#### yaya-analytics Integration
- **Cash flow projections** — Feed receivables data into yaya-analytics for cash flow forecasting
- **Revenue quality** — Analytics can distinguish cash revenue vs credit revenue (credit carries collection risk)
- **Customer profitability** — Combine sales data + credit behavior for true customer value analysis
- **Trend analysis** — DSO trends, aging trends, seasonal collection patterns

#### yaya-fiados Bridge
- **Formalization path** — When a fiado customer grows into a B2B relationship: "Doña Carmen ahora tiene RUC y quiere crédito formal" → migrate from yaya-fiados to yaya-credit
- **Clear separation** — yaya-fiados = informal B2C tabs (S/5-200, neighborhood trust). yaya-credit = formal B2B receivables (S/500-50,000+, invoiced, terms-based)

#### yaya-expenses Integration
- **Bad debt write-off** — When a receivable is written off, create corresponding expense entry: "Castigo de deuda: Empresa X — S/3,500"
- **P&L impact** — Outstanding receivables affect reported revenue quality

#### yaya-ledger Integration
- **Credit sales in daily ledger** — Credit sales logged in yaya-ledger as sale type 'crédito' (revenue recognized at sale, not collection)
- **Collections in daily ledger** — Payments received logged as cash inflow

## MCP Tools Required
- `postgres-mcp` — Primary storage: credit terms, credit limits, invoices, payments, aging data, credit scores, collection logs, reconciliation records
- `erpnext-mcp` — Sales invoices, customer accounts, payment entries, financial reporting
- `crm-mcp` — Customer profiles, credit status tags, interaction history, contact info for statements and cobros
- `whatsapp-mcp` — Send statements, collection reminders, payment confirmations, approval requests to owner

## Data Model

### PostgreSQL Tables

```sql
-- Customer credit profiles
CREATE TABLE credit_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id),
    customer_id UUID NOT NULL,  -- References crm-mcp customer
    customer_name VARCHAR(255) NOT NULL,
    customer_ruc VARCHAR(20),  -- Tax ID (RUC in Peru, NIT in Colombia)
    customer_phone VARCHAR(20),
    -- Credit terms
    credit_terms VARCHAR(30) NOT NULL DEFAULT 'contado' CHECK (credit_terms IN (
        'contado', '7_dias', '15_dias', '30_dias', '45_dias', '60_dias', '90_dias', 'quincena'
    )),
    credit_limit DECIMAL(14,2) NOT NULL DEFAULT 0,
    temporary_limit DECIMAL(14,2),  -- Override limit, if set
    temporary_limit_expires DATE,
    -- Status
    credit_status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (credit_status IN (
        'active', 'blocked', 'probation', 'suspended', 'closed'
    )),
    block_reason TEXT,
    blocked_at TIMESTAMPTZ,
    blocked_by VARCHAR(100),
    -- Interest
    interest_enabled BOOLEAN DEFAULT FALSE,
    interest_rate_monthly DECIMAL(5,2) DEFAULT 0,  -- e.g., 2.00 = 2% per month
    interest_grace_days INTEGER DEFAULT 5,
    -- Scoring
    credit_score INTEGER DEFAULT 70 CHECK (credit_score BETWEEN 0 AND 100),
    avg_days_to_pay DECIMAL(6,1),
    on_time_payment_pct DECIMAL(5,2),
    total_invoiced_lifetime DECIMAL(14,2) DEFAULT 0,
    total_paid_lifetime DECIMAL(14,2) DEFAULT 0,
    total_written_off DECIMAL(14,2) DEFAULT 0,
    -- Dates
    customer_since DATE,
    last_sale_date DATE,
    last_payment_date DATE,
    terms_changed_at TIMESTAMPTZ,
    score_updated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Notes
    notes TEXT,
    UNIQUE(business_id, customer_id)
);

CREATE INDEX idx_credit_customers_business ON credit_customers(business_id);
CREATE INDEX idx_credit_customers_status ON credit_customers(business_id, credit_status);
CREATE INDEX idx_credit_customers_score ON credit_customers(business_id, credit_score);

-- Credit invoices (accounts receivable)
CREATE TABLE credit_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id),
    customer_id UUID NOT NULL REFERENCES credit_customers(id),
    invoice_number VARCHAR(50),  -- User-facing invoice number (e.g., "F-0042")
    -- Amounts
    total_amount DECIMAL(14,2) NOT NULL,
    paid_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
    balance DECIMAL(14,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
    interest_accrued DECIMAL(14,2) NOT NULL DEFAULT 0,
    -- Dates
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    paid_date DATE,  -- Date fully paid (null if outstanding)
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (status IN (
        'pendiente',   -- Not yet due, no payment
        'parcial',     -- Partially paid
        'pagada',      -- Fully paid
        'vencida',     -- Past due date
        'castigada',   -- Written off as bad debt
        'anulada'      -- Cancelled/voided
    )),
    -- Details
    description TEXT,  -- Items or services description
    items JSONB,  -- Optional: [{"desc": "cemento x50", "qty": 50, "price": 28.00}, ...]
    -- Source
    source VARCHAR(30) DEFAULT 'chat' CHECK (source IN (
        'chat', 'voice', 'yaya_sales', 'erpnext', 'manual'
    )),
    erpnext_invoice_id VARCHAR(50),  -- Link to ERPNext sales invoice
    -- Collection
    last_reminder_sent TIMESTAMPTZ,
    reminder_count INTEGER DEFAULT 0,
    reminder_paused BOOLEAN DEFAULT FALSE,
    collection_notes TEXT,
    payment_promise_date DATE,  -- Customer promised to pay by this date
    -- Metadata
    raw_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_credit_invoices_customer ON credit_invoices(customer_id);
CREATE INDEX idx_credit_invoices_business_status ON credit_invoices(business_id, status);
CREATE INDEX idx_credit_invoices_due_date ON credit_invoices(business_id, due_date);
CREATE INDEX idx_credit_invoices_overdue ON credit_invoices(business_id, status, due_date)
    WHERE status IN ('pendiente', 'parcial', 'vencida');

-- Payments received
CREATE TABLE credit_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id),
    customer_id UUID NOT NULL REFERENCES credit_customers(id),
    -- Payment details
    total_amount DECIMAL(14,2) NOT NULL,
    payment_method VARCHAR(30) NOT NULL DEFAULT 'efectivo' CHECK (payment_method IN (
        'efectivo', 'yape', 'plin', 'transferencia', 'cheque', 'deposito', 'tarjeta', 'otro'
    )),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_reference VARCHAR(100),  -- Bank reference, cheque number, etc.
    -- Allocation
    allocation JSONB NOT NULL DEFAULT '[]',
    -- [{"invoice_id": "uuid", "amount": 3000.00}, ...]
    unallocated_amount DECIMAL(14,2) DEFAULT 0,  -- Overpayment or advance
    -- Source
    source VARCHAR(30) DEFAULT 'chat' CHECK (source IN (
        'chat', 'voice', 'bank_reconciliation', 'erpnext', 'manual'
    )),
    -- Metadata
    notes TEXT,
    raw_message TEXT,
    recorded_by VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_credit_payments_customer ON credit_payments(customer_id);
CREATE INDEX idx_credit_payments_date ON credit_payments(business_id, payment_date);

-- Collection log (cobro history)
CREATE TABLE credit_collection_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id),
    customer_id UUID NOT NULL REFERENCES credit_customers(id),
    invoice_id UUID REFERENCES credit_invoices(id),
    -- Action
    action_type VARCHAR(30) NOT NULL CHECK (action_type IN (
        'reminder_auto',       -- Automated reminder sent
        'reminder_manual',     -- Manual cobro message sent
        'call_logged',         -- Phone call logged
        'visit_logged',        -- In-person visit logged
        'promise_received',    -- Customer promised payment date
        'promise_broken',      -- Promise date passed without payment
        'response_received',   -- Customer responded to reminder
        'escalation',          -- Escalated to owner/manager
        'block',               -- Credit blocked
        'unblock',             -- Credit unblocked
        'write_off',           -- Debt written off
        'payment_plan',        -- Payment plan agreed
        'dispute',             -- Customer disputes amount
        'note'                 -- General collection note
    )),
    -- Details
    message_sent TEXT,
    response_received TEXT,
    notes TEXT,
    -- Timing
    action_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    next_action_date DATE,  -- When to follow up
    next_action_type VARCHAR(30),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_collection_log_customer ON credit_collection_log(customer_id);
CREATE INDEX idx_collection_log_date ON credit_collection_log(business_id, action_date);
CREATE INDEX idx_collection_log_next ON credit_collection_log(business_id, next_action_date)
    WHERE next_action_date IS NOT NULL;

-- Credit approval requests
CREATE TABLE credit_approval_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id),
    customer_id UUID REFERENCES credit_customers(id),
    -- Request
    customer_name VARCHAR(255) NOT NULL,
    customer_ruc VARCHAR(20),
    requested_limit DECIMAL(14,2) NOT NULL,
    requested_terms VARCHAR(30),
    requester VARCHAR(100),  -- Who requested (salesperson, customer)
    -- Decision
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'approved', 'rejected', 'modified'
    )),
    approved_limit DECIMAL(14,2),
    approved_terms VARCHAR(30),
    decided_by VARCHAR(100),
    decision_date TIMESTAMPTZ,
    decision_notes TEXT,
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_approval_requests_business ON credit_approval_requests(business_id, status);

-- Pre-computed aging snapshot (refreshed daily)
CREATE TABLE credit_aging_snapshot (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id),
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    -- Totals
    total_receivable DECIMAL(14,2),
    total_current DECIMAL(14,2),       -- Not yet due
    total_1_30 DECIMAL(14,2),          -- 1-30 days overdue
    total_31_60 DECIMAL(14,2),         -- 31-60 days overdue
    total_61_90 DECIMAL(14,2),         -- 61-90 days overdue
    total_91_120 DECIMAL(14,2),        -- 91-120 days overdue
    total_120_plus DECIMAL(14,2),      -- 120+ days overdue
    -- Metrics
    customer_count INTEGER,
    overdue_customer_count INTEGER,
    dso DECIMAL(6,1),                  -- Days Sales Outstanding
    collection_rate DECIMAL(5,2),      -- % collected within terms (trailing 30d)
    bad_debt_ratio DECIMAL(5,2),       -- Written off / total (trailing 12mo)
    -- Per-customer breakdown
    customer_breakdown JSONB,
    -- [{"customer_id": "uuid", "name": "...", "total": 12800, "current": 5000, "overdue_1_30": 4200, ...}]
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(business_id, snapshot_date)
);

CREATE INDEX idx_aging_snapshot_date ON credit_aging_snapshot(business_id, snapshot_date);
```

## Natural Language Parsing

### Credit Term Patterns (Spanish)
```
Setting terms:
  "Constructora Pérez tiene 30 días" → set_terms, customer: Constructora Pérez, terms: 30_dias
  "ponle crédito a 15 días a [empresa]" → set_terms, 15_dias
  "que pague al contado" → set_terms, contado
  "dale 60 días de plazo" → set_terms, 60_dias
  "cobra a la quincena" → set_terms, quincena
  "su plazo es de 45 días" → set_terms, 45_dias

Setting limits:
  "el límite de [empresa] es S/5,000" → set_limit, 5000
  "dale hasta S/10,000 de crédito" → set_limit, 10000
  "no le fíes más de S/3,000" → set_limit, 3000
  "súbele el límite a S/8,000" → set_limit, 8000
  "bájale a S/2,000" → set_limit, 2000
```

### Invoice Patterns
```
Creating invoices:
  "Constructora Pérez compró S/3,200 a crédito" → create_invoice, 3200
  "véndele S/5,000 de cemento a 30 días" → create_invoice, 5000, terms: 30_dias
  "factura por S/8,500 para [empresa]" → create_invoice, 8500
  "anota que [empresa] debe S/1,200 del pedido de hoy" → create_invoice, 1200

Querying invoices:
  "¿qué facturas tiene pendientes [empresa]?" → list_invoices, customer
  "¿cuánto me debe [empresa]?" → customer_balance
  "¿qué me deben?" → total_receivable
  "¿cuáles están vencidas?" → overdue_invoices
```

### Payment Patterns
```
Recording payments:
  "[empresa] pagó S/3,000" → record_payment, 3000
  "[empresa] depositó S/5,000" → record_payment, 5000, method: deposito
  "me yapearon S/2,000 de [empresa]" → record_payment, 2000, method: yape
  "[empresa] pagó todo" → record_payment, full_balance
  "[empresa] abonó S/1,500" → record_payment, 1500 (partial)
  "[empresa] pagó con cheque" → record_payment, method: cheque

Payment allocation:
  "aplica el pago a la factura 0042" → allocate_to_invoice, 0042
  "el pago es por la factura del cemento" → fuzzy_match, description: cemento
```

### Aging/Report Patterns
```
  "¿cómo está mi cartera?" → portfolio_summary
  "¿quién me debe más de 30 días?" → aging_report, min_days: 30
  "¿quiénes son los morosos?" → overdue_customers
  "¿cuánto me deben en total?" → total_receivable
  "dame el aging" → aging_report
  "reporte de cartera" → aging_report
  "¿quién me debe más?" → top_debtors
```

### Cobro Patterns
```
  "mándale un cobro a [empresa]" → send_reminder, customer
  "recuérdale que me debe" → send_reminder, customer
  "manda cobros a todos los morosos" → bulk_reminders
  "mándale su estado de cuenta" → send_statement, customer
  "no le mandes cobros por ahora" → pause_reminders, customer
```

### Block/Unblock Patterns
```
  "no le vendas más a crédito a [empresa]" → block_credit, customer
  "bloquea a [empresa]" → block_credit, customer
  "córtale el crédito" → block_credit, customer
  "desbloquea a [empresa]" → unblock_credit, customer
  "ya puede comprar a crédito otra vez" → unblock_credit, customer
```

### Score/Evaluation Patterns
```
  "¿[empresa] es buena paga?" → credit_score, customer
  "¿cómo paga [empresa]?" → credit_score, customer
  "¿le doy crédito a [empresa]?" → credit_evaluation, customer
  "¿quiénes son mis mejores clientes?" → top_customers_by_score
```

### Ambiguity Resolution
- If customer name is ambiguous: "Tengo Constructora Pérez S.A.C. y Constructora Pérez Hermanos. ¿Cuál?"
- If amount unclear: "¿Cuánto fue el monto? No me quedó claro."
- If terms not specified on new credit sale: "¿A cuántos días? [empresa] tiene términos de [X] días configurados."
- If payment amount exceeds debt: "La deuda de [empresa] es S/[X] pero pagó S/[Y]. ¿Los S/[diff] son anticipo?"
- If voice confidence < 0.7: "Escuché 'tres mil doscientos soles', ¿es correcto?"

## Behavior Guidelines

### Language & Tone
- **Primary language: Spanish** — All messages in natural Peruvian/Colombian Spanish. Use formal-but-warm tone for B2B context.
- **B2B professional** — This is not fiado between neighbors. Use "estimado", "empresa", formal customer names. But still personal — LATAM B2B relationships are built on personal rapport.
- **Cobro culture** — In LATAM, cobro (collections) follows an unwritten code: start gentle, escalate gradually, always leave room for the relationship. Never aggressive, never threatening, never publicly embarrass. The owner's reputation depends on being "serio pero buena gente."
- **Respect the relationship** — Many ferretería-contractor relationships span decades. The skill must protect these relationships even when collecting overdue amounts.
- **Use WhatsApp emojis purposefully** — 💰 for payments, 📊 for reports, ⚠️ for warnings, ✅ for confirmations, 📋 for statements, 🔴🟡🟢 for aging status.

### Credit Decisions
- **Never auto-approve large credit** — Credit decisions are the owner's. The skill recommends, the owner decides.
- **Conservative by default** — When suggesting credit limits for new customers, start low. "Es mejor empezar con S/2,000 y subir que empezar alto y perder."
- **Payment behavior over promises** — Score customers by what they DO (pay on time) not what they SAY (promises).
- **Seasonal awareness** — Construction in Peru slows in rainy season (Dec-Mar in Sierra). Agricultural credit follows harvest cycles. Adjust expectations.

### Payment Processing
- **Always confirm before recording** — "¿Registro pago de S/3,000 de Constructora Pérez? Quedaría con saldo de S/9,800."
- **FIFO by default** — Payments apply to oldest invoice first unless owner specifies otherwise.
- **Track payment method** — Important for reconciliation: cash, Yape, bank deposit, cheque.
- **Never round amounts** — Credit tracking must be exact to the céntimo. Rounding causes disputes.
- **Receipts matter** — Encourage owners to log deposit references for reconciliation.

### Aging & Collections
- **Don't alarm unnecessarily** — Some industries have longer payment cycles. 45 days overdue in construction is different from 45 days overdue in retail.
- **Prioritize by impact** — Focus collection efforts on large overdue amounts first. A S/500 debt at 60 days is less urgent than a S/15,000 debt at 35 days.
- **Track promises** — When a customer says "pago el viernes", log it. If Friday passes without payment, escalate.
- **Know when to stop** — After 90+ days with no response, recommend the owner take direct action (call, visit, legal). The bot shouldn't keep sending messages into the void.

### Data Integrity
- **Duplicate detection** — Same customer, same amount, same day: "¿Es otra factura o la misma que registraste hace rato?"
- **Void vs delete** — Never delete invoices. Mark as 'anulada' with reason. Audit trail is sacred.
- **Write-off requires owner approval** — "¿Quieres castigar la deuda de S/3,500 de Empresa X? Esto se registra como pérdida."
- **Reconciliation discrepancies** — Flag but don't auto-resolve: "El depósito es S/4,800 pero la factura es S/5,000. ¿Falta S/200 o hubo descuento?"

### Privacy & Access
- **Customer data is business-private** — Never share one customer's credit info with another customer.
- **Statements go only to the customer** — Statement messages sent to the customer's own WhatsApp, nobody else.
- **Collection status is internal** — Never mention to customers that they're "blocked" or have a "bad credit score." Frame as: "Para este pedido necesitamos pago al contado."
- **Owner-only operations** — Block/unblock, write-offs, limit changes, interest configuration — owner approval only.

## Example Flows

### Setting Up Credit for a New Customer
```
Owner: "El ingeniero Pérez de Constructora Pérez quiere comprar a crédito.
        Dale hasta S/5,000 a 30 días."

Yaya:  "✅ Crédito configurado:
        👤 Constructora Pérez
        💰 Límite: S/5,000
        📅 Plazo: 30 días
        📋 Estado: Activo

        ¿Tiene RUC o teléfono para registrarlo?"

Owner: "RUC 20456789012, cel 987654321"

Yaya:  "✅ Actualizado. Constructora Pérez está listo para compras a crédito."
```

### Recording a Credit Sale
```
Owner: "Constructora Pérez compró S/3,200 de cemento y fierro, a crédito"

Yaya:  "📦 Factura registrada:
        👤 Constructora Pérez
        💰 Monto: S/3,200 (cemento y fierro)
        📅 Fecha: 21 Mar 2026
        📅 Vence: 20 Abr 2026 (30 días)

        📊 Crédito utilizado: S/3,200 de S/5,000 (64%)
        ✅ ¿Confirmo?"

Owner: "Sí"

Yaya:  "✅ Factura F-0052 creada. Constructora Pérez ahora tiene
        S/1,800 disponible de crédito."
```

### Recording a Partial Payment (FIFO)
```
Owner: "Constructora Pérez depositó S/5,000"

Yaya:  "💰 Pago recibido: S/5,000 de Constructora Pérez

        Facturas pendientes (aplicando a la más antigua primero):

        1. F-0038 — S/2,000 (vencida 45 días) → PAGADA ✅
        2. F-0042 — S/3,200 (vencida 12 días) → Abono S/3,000
           Queda pendiente: S/200

        📊 Saldo después del pago: S/3,500
        💳 Crédito disponible: S/1,500 de S/5,000

        ¿Registro así?"

Owner: "Dale"

Yaya:  "✅ Pago de S/5,000 registrado (depósito).
        F-0038 pagada. F-0042 pendiente S/200."
```

### Checking Cartera Health
```
Owner: "¿Cómo anda mi cartera?"

Yaya:  "📊 Resumen de Cartera — 21 Mar 2026

        💰 Total por cobrar: S/87,450
        👥 23 clientes con saldo

        🟢 Vigente: S/35,200 (40%)
        🟡 Vencido 1-30d: S/28,100 (32%)
        🟠 Vencido 31-60d: S/14,500 (17%)
        🔴 Vencido 60+d: S/9,650 (11%)

        📅 Días promedio de cobro: 34
        ✅ Cobro en plazo: 68%

        ⚠️ Requieren atención:
        • Ing. García — S/8,200 (62 días vencido)
        • Empresa Torres — S/3,500 (91 días vencido)
        • Distribuidora Lima — S/2,300 (38 días vencido)

        ¿Quieres que les mande cobros?"
```

### Collection Reminder Flow
```
Owner: "Mándale un cobro al ingeniero García que ya me debe 2 meses"

Yaya:  "📋 Ing. García tiene S/8,200 vencido (62 días):
        • F-0035 — S/5,000 (venció 18 Ene)
        • F-0039 — S/3,200 (venció 05 Feb)

        Ya se le mandaron 2 recordatorios previos (el último hace 15 días).
        Le enviaría este mensaje:

        'Estimado Ing. García, buen día. Le escribo respecto a sus
        facturas pendientes por S/8,200 con más de 60 días de vencidas.
        Necesitamos regularizar esta situación a la brevedad. De no
        concretar el pago, lamentablemente deberemos suspender las
        ventas a crédito. ¿Podemos coordinar? Quedo atento. 🙏'

        ¿Lo envío?"

Owner: "Sí, mándalo"

Yaya:  "✅ Cobro enviado a Ing. García (WhatsApp: 987654321).
        Te aviso si responde. Próximo seguimiento: 7 días."
```

### Credit Score Inquiry
```
Owner: "¿Constructora Pérez es buena paga?"

Yaya:  "📊 Evaluación Crediticia — Constructora Pérez

        ⭐⭐⭐⭐ Bueno (82/100)

        📅 Cliente desde: Jun 2024 (21 meses)
        💰 Total facturado: S/145,000
        💵 Total pagado: S/136,500
        📊 Saldo actual: S/8,500

        Indicadores:
        ✅ Puntualidad: 72% de facturas pagadas en plazo
        📅 Promedio de pago: 37 días (plazo: 30)
        📈 Tendencia: mejorando (últimos 3 meses: 31 días)
        🔄 Frecuencia: compra 2-3 veces/mes
        ❌ Nunca ha tenido deuda castigada

        💡 Recomendación: Buen cliente. Paga con leve retraso pero
        consistente y mejorando. Candidato para aumento de límite
        si lo solicita."
```

### Blocking a Customer
```
Owner: "No le vendas más a crédito a Empresa Torres hasta que pague"

Yaya:  "⚠️ Empresa Torres — Situación actual:
        💰 Deuda: S/3,500 (91 días vencido)
        📱 3 cobros enviados, sin respuesta
        ⭐⭐ Score: 35/100 (Crítico)

        ¿Confirmo bloqueo de crédito?
        → No podrá comprar a crédito (solo contado)
        → Se le puede notificar por WhatsApp"

Owner: "Sí, bloquéalo y avísale"

Yaya:  "✅ Crédito bloqueado para Empresa Torres.

        Mensaje enviado:
        'Estimado, le informamos que hemos suspendido temporalmente
        su línea de crédito debido al saldo pendiente de S/3,500.
        Con gusto la reactivamos una vez regularizado el pago.
        Quedamos a su disposición para coordinar. 🙏'

        Te aviso si responde."
```

### Bank Reconciliation
```
Owner: "Hoy me llegaron 3 depósitos: S/5,000, S/3,200 y S/1,800"

Yaya:  "🏦 Reconciliación de depósitos:

        1️⃣ S/5,000 → Constructora Pérez (F-0038 S/2,000 + F-0042 S/3,000) ✅ Match exacto
        2️⃣ S/3,200 → Ferretería del Norte (F-0049 S/3,200) ✅ Match exacto
        3️⃣ S/1,800 → Sin match exacto. Posibles:
           • Constructora Andes tiene F-0051 por S/1,800 (vence en 5 días)
           • Distribuidora Lima tiene pendiente S/1,750 + S/50 de mora

        ¿Los depósitos 1 y 2 los registro así?
        ¿El de S/1,800 de quién es?"

Owner: "Sí a los 2 primeros. El de 1,800 es de Constructora Andes."

Yaya:  "✅ 3 pagos registrados:
        • Constructora Pérez: S/5,000 (F-0038 pagada, F-0042 abono)
        • Ferretería del Norte: S/3,200 (F-0049 pagada)
        • Constructora Andes: S/1,800 (F-0051 pagada)

        📊 Cobrado hoy: S/10,000 💪"
```

### Credit Approval
```
Yaya:  "🆕 Solicitud de crédito:
        👤 Transportes del Sur S.A.C.
        🆔 RUC: 20567890123
        💰 Límite solicitado: S/15,000
        📅 Plazo: 30 días
        📋 Referido por: Ing. Pérez (cliente actual)
        ℹ️ Cliente nuevo, sin historial

        ⚠️ Excede el umbral de aprobación automática (S/5,000).

        ¿Aprobar ✅, rechazar ❌, o aprobar con límite menor?"

Owner: "Aprueba pero solo S/5,000 para empezar"

Yaya:  "✅ Crédito aprobado:
        👤 Transportes del Sur S.A.C.
        💰 Límite: S/5,000 (solicitó S/15,000)
        📅 Plazo: 30 días
        📋 Período de prueba: 3 meses

        Se evaluará el aumento a los 3 meses según comportamiento de pago."
```

### Late Fee Calculation
```
Owner: "¿Cuánto le cobro de mora al ingeniero García?"

Yaya:  "📊 Mora de Ing. García (tasa: 2% mensual)

        F-0035 — S/5,000 (62 días vencida)
          Mora: S/206.67 (62 días × 2%/30)

        F-0039 — S/3,200 (45 días vencida)
          Mora: S/96.00 (45 días × 2%/30)

        Resumen:
        💰 Principal vencido: S/8,200
        📈 Mora acumulada: S/302.67
        💵 Total a cobrar: S/8,502.67

        ¿Incluyo la mora en el próximo estado de cuenta?"
```

### Cash Flow Projection
```
Owner: "¿Cuánto me va a entrar este mes?"

Yaya:  "💸 Proyección de cobros — Marzo 2026

        Ya cobrado (1-21 Mar): S/42,000

        Por cobrar (22-31 Mar):
        🟢 Vencimientos esta semana: S/12,500
           • Constructora Pérez: S/3,500 (vence 25 Mar)
           • Ferretería del Norte: S/4,200 (vence 23 Mar)
           • Empresa López: S/4,800 (vence 27 Mar)

        🟡 Vencimientos próxima semana: S/8,300

        📊 Total esperado en marzo: S/62,800
        📊 Basado en historial de cobro (68%): ~S/56,000 realista

        ⚠️ Pendiente de meses anteriores: S/24,150
           Si cobras 50% de eso: +S/12,075

        💡 Rango probable: S/56,000 - S/68,000"
```

## Cron Schedules (via Hermes Cron)

```yaml
overdue_check:
  schedule: "0 8 * * 1-6"        # 8 AM Mon-Sat
  description: "Check for newly overdue invoices, update statuses, trigger reminders"
  action: |
    1. Find invoices where due_date < today AND status IN ('pendiente', 'parcial')
    2. Update status to 'vencida'
    3. For each overdue invoice, check collection schedule and send appropriate reminder
    4. Update credit scores for affected customers
    5. Auto-block customers exceeding block thresholds

aging_snapshot:
  schedule: "0 7 * * *"          # 7 AM daily
  description: "Generate daily aging snapshot for portfolio tracking"
  action: |
    Calculate aging buckets across all customers, compute DSO, collection rate,
    bad debt ratio. Store in credit_aging_snapshot table.

weekly_cartera_report:
  schedule: "0 9 * * 1"          # Monday 9 AM
  description: "Send weekly cartera summary to business owner"
  action: |
    Generate portfolio summary: total receivable, aging breakdown, collections
    this week, new credit sales, top overdue customers, DSO trend.
    Send via WhatsApp.

monthly_cartera_report:
  schedule: "0 9 1 * *"          # 1st of month, 9 AM
  description: "Send monthly cartera report with trends"
  action: |
    Full month analysis: total credit sales, total collections, net change in
    receivables, DSO trend, customer score changes, bad debt, interest accrued.

interest_calculation:
  schedule: "0 3 * * *"          # 3 AM daily
  description: "Calculate accrued interest on overdue invoices (if enabled)"
  action: |
    For businesses with interest_enabled: calculate daily interest accrual
    on overdue invoices past grace period. Update interest_accrued field.

promise_followup:
  schedule: "0 10 * * 1-6"       # 10 AM Mon-Sat
  description: "Check for broken payment promises"
  action: |
    Find invoices where payment_promise_date < today AND still unpaid.
    Alert owner: "[Empresa] prometió pagar el [fecha] pero no lo hizo."
    Log promise_broken event.

credit_score_refresh:
  schedule: "0 4 * * 0"          # 4 AM Sundays
  description: "Recalculate credit scores for all active customers"
  action: |
    For each customer with credit terms: recalculate score based on
    payment history, timeliness, current overdue, trend. Update credit_customers.
```

## Configuration

- `CREDIT_DEFAULT_TERMS` — Default payment terms for new customers (default: "30_dias")
- `CREDIT_DEFAULT_LIMIT` — Default credit limit for new customers (default: 3000)
- `CREDIT_AUTO_APPROVE_THRESHOLD` — Max limit for auto-approval without owner confirmation (default: 2000)
- `CREDIT_BLOCK_OVERDUE_DAYS` — Days overdue before auto-blocking credit (default: 60)
- `CREDIT_BLOCK_OVERDUE_PCT` — Overdue % of limit that triggers auto-block (default: 50)
- `CREDIT_GRACE_PERIOD_DAYS` — Days after due date before marking as overdue (default: 5)
- `CREDIT_INTEREST_ENABLED` — Enable interest/late fee calculation (default: false)
- `CREDIT_INTEREST_RATE_MONTHLY` — Monthly interest rate for overdue invoices (default: 2.0)
- `CREDIT_INTEREST_GRACE_DAYS` — Days after due date before interest starts accruing (default: 5)
- `CREDIT_REMINDER_SCHEDULE` — Days relative to due date for automated reminders (default: "-3,7,15,30,45")
- `CREDIT_REMINDER_PAUSE_AFTER_DAYS` — Stop automated reminders after this many days overdue (default: 60)
- `CREDIT_SCORE_BLOCK_THRESHOLD` — Credit score below which auto-block triggers (default: 40)
- `CREDIT_GLOBAL_EXPOSURE_CAP` — Maximum total outstanding receivables allowed (default: null / unlimited)
- `CREDIT_WRITE_OFF_REQUIRES_APPROVAL` — Require owner approval for write-offs (default: true)
- `CREDIT_INVOICE_PREFIX` — Prefix for invoice numbers (default: "F-")
- `CREDIT_INVOICE_NEXT_NUMBER` — Next sequential invoice number (default: 1)
- `CREDIT_RECONCILIATION_TOLERANCE` — Amount tolerance for auto-matching deposits (default: 5.00)
- `CREDIT_CURRENCY` — Currency code (default: "PEN")
- `CREDIT_PROBATION_MONTHS` — Duration of probation period for new credit customers (default: 3)
- `BUSINESS_NAME` — Business name for statements and reminders
- `BUSINESS_PHONE` — Business phone for statement footer
- `BUSINESS_TIMEZONE` — Timezone (default: "America/Lima")

## Error Handling & Edge Cases

- **Duplicate invoice:** Same customer, same amount, same day: "Ya tienes una factura de S/3,200 para Constructora Pérez hoy. ¿Es otra venta o la misma?"
- **Payment exceeds total debt:** "Constructora Pérez pagó S/15,000 pero solo debe S/12,800. ¿Los S/2,200 son anticipo o error?"
- **Payment to unknown customer:** "No tengo a 'Empresa ABC' registrada. ¿Quieres crearla o te refieres a otro cliente?"
- **Credit limit exceeded:** "Constructora Pérez tiene S/4,500 pendiente. Nuevo pedido de S/2,000 excede su límite de S/5,000 por S/1,500. ¿Aprobar esta vez?"
- **Blocked customer tries to buy:** "⚠️ Empresa Torres tiene crédito bloqueado (deuda vencida: S/3,500). Solo venta al contado."
- **Invoice void after payments:** If owner tries to void an invoice that has partial payments: "La factura F-0042 ya tiene S/1,000 pagado. ¿Quieres anular y devolver el pago, o ajustar el monto?"
- **Negative balance (credit in favor):** If overpayment creates credit balance: "Constructora Pérez tiene S/2,200 a favor. Se descuenta de la próxima factura automáticamente."
- **Terms change with outstanding debt:** If owner changes terms while invoices are outstanding: "Cambio de términos aplicará a facturas futuras. Las 3 facturas actuales mantienen su vencimiento original."
- **Write-off confirmation:** Always double-confirm: "¿Confirmas castigar S/3,500 de Empresa Torres como deuda incobrable? Esto se registra como pérdida y no se puede deshacer."
- **Seasonal late payments:** Some industries have seasonal patterns. Don't auto-block during known slow seasons if the customer is historically reliable.
- **Multiple businesses same RUC:** If a RUC matches multiple customers: "El RUC 20456789012 está registrado para Constructora Pérez S.A.C. ¿Es correcto?"
- **Currency amounts:** Always 2 decimal places. Always S/ prefix for PEN, $ for COP. Never round in calculations.
- **Voice note ambiguity:** If multiple customers match: "Tengo Constructora Pérez y Constructora Pérez Hermanos. ¿Cuál?"
- **Interest on partially paid invoices:** Interest only accrues on the unpaid balance, not the original invoice amount.
- **Reconciliation tolerance:** Auto-match deposits within ±S/5 of invoice amount: "Depósito de S/3,195 ≈ Factura F-0042 por S/3,200. ¿La diferencia de S/5 la asumimos?"
- **Off-hours messages:** Queue collection reminders for business hours (8 AM - 7 PM). Never send cobros at night or on Sundays.

## Cultural Notes

### Peru/Colombia B2B Credit Context
- **"Cartera"** — The word for accounts receivable portfolio. When someone says "mi cartera" they mean their outstanding receivables.
- **"Cobro" / "Cobranza"** — Collections. The act of collecting payment. "Hacer cobro" = to collect. "Gestión de cobranza" = collections management.
- **"Mora"** — Delinquency / late fees. "Está en mora" = is delinquent. "Cobrarle mora" = charge late fees.
- **"Castigar la deuda"** — Write off bad debt. Literally "punish the debt."
- **"Cartera pesada"** — Heavy portfolio = lots of overdue receivables. A dreaded term.
- **"Buena paga" / "Mala paga"** — Good/bad payer. Fundamental classification of customers.
- **"A la quincena"** — Payment every 15th and 30th of the month. Very common payment rhythm.
- **"Plazo"** — Payment term / deadline. "¿Cuál es el plazo?" = "What are the terms?"
- **"Línea de crédito"** — Credit line. "Darle línea" = extend credit.
- **"RUC"** (Peru) / **"NIT"** (Colombia) — Tax identification number. Essential for B2B transactions.
- **"Letras"** — Promissory notes. Some businesses still use these for large amounts.
- **Relationship-based credit** — In LATAM, extending credit is as much about the personal relationship as the financial analysis. The ingeniero, the maestro de obra, the arquitecto — you know them by name.
- **The contractor chain** — Contractors get paid by the project owner, then pay their suppliers. Delays cascade down the chain. Understanding this chain is key to realistic collection expectations.
- **Quincena rhythm** — Many businesses pay suppliers every quincena (15th and 30th). Collection timing should align with this rhythm.
- **End-of-year squeeze** — December/January are tight: businesses stock up for holidays but cash flow is strained. February-March is collection crunch time.

## Differences from yaya-fiados

| Aspect | yaya-fiados | yaya-credit |
|--------|-------------|-------------|
| **Type** | Informal B2C credit (tab) | Formal B2B accounts receivable |
| **Amounts** | S/5 - S/200 per tab | S/500 - S/50,000+ per invoice |
| **Customers** | Vecinos, neighborhood customers | Businesses, contractors, companies |
| **Documentation** | Cuaderno-style, no invoices | Formal invoices with numbers |
| **Terms** | "Paga cuando puedas" | 15/30/60/90 days contractual |
| **Interest** | Never | Optional, configurable |
| **Credit scoring** | Simple trust-based | Multi-factor numerical score |
| **Collections** | Gentle neighborhood reminders | Professional escalation workflow |
| **Volume** | Many small tabs | Fewer, larger accounts |
| **Formality** | No RUC required | RUC/NIT expected |
| **Write-offs** | "Ya ni modo" | Formal castigo with accounting impact |
