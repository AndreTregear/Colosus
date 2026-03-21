# yaya-cash — Cash Box & Float Management

## Description
WhatsApp-native cash management skill for LATAM micro-businesses where 60-90% of daily transactions are cash. Covers opening float (fondo de caja), denomination tracking, change optimization, daily cash reconciliation, cash-out tracking (personal withdrawals, supplier payments, expenses), shortage/surplus investigation, and cash flow forecasting. Designed for the 1M+ Peruvian MYPEs — bodegas, pollerías, ferreterías, tiendas, mercado stalls — where the owner IS the cashier and the caja chica is a plastic bag, a drawer, or a fanny pack.

Replaces the daily nightmare of "¿cuánto debería tener en caja?" with automatic tracking: every sale (from yaya-ledger or yaya-sales), every expense (from yaya-expenses), every fiado cobro (from yaya-fiados), and every cash-out is logged. End of day: "Tienes S/847 en caja. Esperado: S/862. Diferencia: -S/15. ¿Quieres investigar?" This single reconciliation flow was scored 3/10 for Doña Gladys and 4/10 for María Flores in Round 3 — the lowest-scoring universal scenario across all personas.

Cash is king in LATAM commerce. In Peru, 72% of retail transactions are still cash (BCRP 2024). In bodegas, it's 80-90%. The platform can't claim to manage a business if it can't manage cash.

## When to Use
- Business owner starts their day ("abro caja", "empiezo con S/200", "fondo de caja")
- Business owner receives cash payment (auto-tracked from yaya-sales/yaya-ledger)
- Business owner gives change ("le di S/15 de vuelto", "no tengo cambio para S/100")
- Business owner takes cash out ("saqué S/50 para pasajes", "le pagué al proveedor S/300 en efectivo")
- Business owner counts cash ("tengo S/450 en caja", "cierro caja", "cuadre de caja")
- Business owner asks about cash discrepancy ("me falta plata", "la caja no cuadra", "sobraron S/20")
- Business owner asks how much cash to prepare for tomorrow ("¿con cuánto abro mañana?")
- Business owner needs change ("necesito sencillo", "¿dónde cambio un billete de S/100?")
- Business owner tracks Yape vs cash split ("¿cuánto entró por Yape y cuánto en efectivo?")
- Business owner worries about theft/shrinkage ("me están robando", "siempre me falta")
- An end-of-day reconciliation cron triggers
- A proactive alert fires when expected cash deviates significantly from pattern

## Target Users
- **Bodegueras/bodegueros** — 500K+ in Peru. S/300-800 daily cash flow. Plastic bag under counter.
- **Pollerías/restaurantes** — 340K+. S/500-3,000 daily cash. Mix of cash + Yape.
- **Ferreterías** — 200K+. Higher ticket, more cash-on-delivery. S/1,000-5,000 daily.
- **Tiendas de abarrotes** — 300K+. Similar to bodegas.
- **Mercado stalls** — 200K+. 95%+ cash. Fanny pack caja.
- **Peluquerías** — 50-80K. Walk-in cash + Yape.
- **Any micro-business** where the owner handles cash daily and worries about it

## Capabilities

### Core: Caja Opening (Apertura)
- **Set opening float** — "Abro caja con S/200" → records start-of-day cash balance, timestamp
- **Default float** — If owner doesn't declare, use previous day's closing balance or configured default
- **Float recommendation** — Based on historical data: "Los martes necesitas al menos S/150 en sencillo. Hoy tienes S/200, estás bien ✅"
- **Denomination breakdown (optional)** — "Empiezo con: 2 de S/100, 3 de S/50, 5 de S/20, 10 de S/10, monedas S/30" → detailed float tracking
- **Auto-open** — If first cash transaction arrives without apertura, assume yesterday's closing balance. Remind: "No abriste caja hoy. Asumí S/[X] del cierre de ayer. ¿Correcto?"

### Core: Cash Flow Tracking (During the Day)
- **Cash-in sources** — Automatically tracks:
  - Sales (efectivo) from yaya-ledger/yaya-sales
  - Fiado collections (cash) from yaya-fiados
  - Other income ("me prestaron S/100", "cobré el alquiler del segundo piso")
- **Cash-out tracking** — Automatically tracks:
  - Expenses (efectivo) from yaya-expenses
  - Supplier payments (cash) from yaya-suppliers
  - Personal withdrawals ("saqué S/80 para almuerzo de los chicos")
  - Change given (calculated from sale amount - price when applicable)
  - Fiados extended (goods out on credit)
- **Running balance** — After any cash event: "Caja: S/485 (inicio S/200 + ventas S/380 - gastos S/45 - retiros S/50)"
- **Payment method tagging** — Every transaction auto-tagged: efectivo, yape, plin, tarjeta, transferencia. Cash-only events affect caja balance

### Core: Change & Denomination Management
- **Change alert** — When customer pays with large bill: "Cliente pagó S/100, compra S/12. Vuelto: S/88. Tienes sencillo: S/95 en monedas y billetes chicos → ✅ Puedes dar vuelto"
- **Low sencillo alert** — When small denominations run low: "⚠️ Te quedan solo S/30 en sencillo (monedas + billetes de S/10). Después de 3-4 vueltos más te vas a quedar sin cambio"
- **Change optimization** — "Para dar S/88 de vuelto: 1×S/50 + 1×S/20 + 1×S/10 + 1×S/5 + 3×S/1" (minimize bills used)
- **Sencillo planning** — "Mañana necesitas: llevar S/50 en monedas de S/1, S/30 en monedas de S/2 y S/5, y 5 billetes de S/10"
- **No-change protocol** — "No tengo vuelto para S/200" → suggests: (1) Ask customer for smaller bill, (2) Round down S/1-2 as goodwill, (3) Offer Yape instead, (4) Split payment cash+Yape
- **Break request** — "Necesito cambiar un billete de S/100" → suggests nearby businesses that commonly have change (pharmacies, banks, agents) based on time of day

### Core: End-of-Day Reconciliation (Cuadre de Caja)
- **Count cash** — "Cuento S/685 en caja" or "Cierro con: 3×S/100, 2×S/50, 5×S/20, 3×S/10, monedas S/55"
- **Expected vs actual** — System calculates expected from all logged transactions:
  ```
  📊 Cuadre de Caja — Hoy
  
  💰 Apertura:           S/   200.00
  ➕ Ventas (efectivo):   S/   780.00
  ➕ Cobros fiados:       S/    45.00
  ➖ Gastos (efectivo):   S/   120.00
  ➖ Retiros personales:  S/    80.00
  ➖ Pagos proveedor:     S/   150.00
  ─────────────────────────────────
  📊 Esperado en caja:    S/   675.00
  💵 Contaste en caja:    S/   685.00
  ─────────────────────────────────
  ✅ Diferencia:          +S/   10.00 (sobrante)
  ```
- **Difference thresholds:**
  - ±S/5 → "Cuadra perfecto ✅ Diferencia normal por vueltos y redondeos"
  - S/5-20 → "Pequeña diferencia 🤔 Probablemente un vuelto mal dado o una venta no registrada"
  - S/20-50 → "⚠️ Diferencia notable. Revisemos: ¿hubo algún gasto que no registraste? ¿Diste fiado sin apuntar?"
  - >S/50 → "🔴 Diferencia grande. Posibles causas: (1) Venta no registrada, (2) Gasto olvidado, (3) Fiado no apuntado, (4) Error de vuelto, (5) Faltante"
- **Shortage investigation** — Interactive flow:
  1. "¿Pagaste algo que no registraste?" → If yes, log as expense
  2. "¿Diste fiado que no apuntaste?" → If yes, create fiado entry
  3. "¿Recibiste alguna devolución?" → If yes, log return
  4. "¿Alguien más tuvo acceso a la caja?" → Document for pattern tracking
  5. "¿Es posible que un vuelto salió mal?" → Calculate high-change transactions
  If still unresolved → log as "merma de caja" (cash shrinkage)
- **Surplus investigation** — "Sobraron S/15. Posibilidades: (1) Un cliente pagó de más, (2) Cobraste un fiado que ya estaba registrado, (3) Te olvidaste de registrar un cobro extra"

### Core: Cash Flow History & Analytics
- **Daily cash report** — Auto-generated at closing, saved to history
- **Weekly cash patterns** — "Los sábados manejas S/1,200+ en efectivo. Los martes solo S/400. Ajusta tu sencillo"
- **Cash vs digital trend** — "Este mes: 68% efectivo, 28% Yape, 4% Plin. Yape subió 5% vs el mes pasado 📈"
- **Shrinkage tracking** — Monthly report of all unexplained cash differences. Total, frequency, average. Trend over time.
- **Float recommendation** — Based on 2-week rolling average: "Para mañana (miércoles), recomiendo abrir con S/180: S/100 en billetes chicos + S/80 en monedas"
- **Cash flow forecast** — "Esta semana necesitas: S/300 para proveedor (jueves), S/150 para alquiler prorrateo. Asegúrate de tener S/450+ en caja para el jueves"

### Integration: Automatic Cash Events
The cash skill doesn't operate in isolation — it automatically picks up cash events from other skills:

| Source Skill | Event Type | Cash Effect |
|-------------|-----------|-------------|
| yaya-ledger | Sale (efectivo) | Cash IN |
| yaya-sales | Sale (efectivo) | Cash IN |
| yaya-fiados | Cobro (efectivo) | Cash IN |
| yaya-fiados | New fiado | No cash effect (goods out, no cash in) |
| yaya-expenses | Expense (efectivo) | Cash OUT |
| yaya-suppliers | Supplier payment (cash) | Cash OUT |
| yaya-payments | Yape/Plin received | No cash effect (digital) |
| yaya-returns | Return/refund (cash) | Cash OUT |
| yaya-commissions | Commission paid (cash) | Cash OUT |

- Events from other skills are auto-logged when payment_method = "efectivo" or "cash"
- Manual cash events (withdrawals, deposits, found money) logged directly to yaya-cash
- All Yape/Plin/tarjeta transactions are tracked for the full picture but don't affect physical cash balance

### Proactive Alerts
- **Low float alert** — During the day, if cash drops below configurable minimum: "⚠️ Te quedan S/45 en caja. Con el ritmo de hoy, te podrías quedar sin sencillo en ~1 hora"
- **High cash alert** — If cash exceeds safe threshold: "💰 Tienes S/2,500+ en caja. ¿Quieres separar S/1,500 y guardarlo aparte? Es mucha plata para tener en el mostrador"
- **Pattern anomaly** — If today's cash flow is significantly different from same day of week average: "Hoy has vendido 40% menos en efectivo que un miércoles normal. ¿Todo bien?"
- **Recurring shrinkage** — If cash differences >S/20 happen 3+ times in a week: "🔴 Esta semana la caja no ha cuadrado 3 veces (total: -S/85). Puede que haya un problema sistemático"

## MCP Tools Required
- `postgres-mcp` — Cash sessions (apertura/cierre), cash events log, denomination records, reconciliation history, shrinkage log
- `yaya-ledger` / `yaya-sales` — Automatic cash-in events from sales
- `yaya-expenses` — Automatic cash-out events from expenses
- `yaya-fiados` — Cobros (cash-in) and new fiados (goods out)
- `yaya-suppliers` — Supplier cash payments
- `yaya-payments` — Digital payment tracking (Yape/Plin) for full payment method split

## Database Schema

```sql
-- Cash sessions: one per day per business
CREATE TABLE cash_sessions (
    id SERIAL PRIMARY KEY,
    business_id INTEGER NOT NULL,
    session_date DATE NOT NULL,
    opened_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    opening_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
    expected_closing NUMERIC(12,2),      -- calculated from all events
    actual_closing NUMERIC(12,2),        -- counted by owner
    difference NUMERIC(12,2),            -- actual - expected
    difference_resolved BOOLEAN DEFAULT FALSE,
    resolution_notes TEXT,
    status VARCHAR(20) DEFAULT 'open',   -- open, closed, reconciled
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(business_id, session_date)
);

-- Cash events: every cash movement
CREATE TABLE cash_events (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES cash_sessions(id),
    business_id INTEGER NOT NULL,
    event_type VARCHAR(30) NOT NULL,      -- sale, fiado_cobro, expense, supplier_payment, withdrawal, deposit, return, other
    direction VARCHAR(3) NOT NULL,        -- 'in' or 'out'
    amount NUMERIC(12,2) NOT NULL,
    description TEXT,
    source_skill VARCHAR(50),             -- yaya-ledger, yaya-expenses, etc.
    source_id INTEGER,                    -- reference to source record
    payment_method VARCHAR(20) DEFAULT 'efectivo',
    running_balance NUMERIC(12,2),        -- balance after this event
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Denomination records (optional detailed tracking)
CREATE TABLE cash_denominations (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES cash_sessions(id),
    record_type VARCHAR(10) NOT NULL,     -- 'opening' or 'closing'
    denomination NUMERIC(6,2) NOT NULL,   -- 200, 100, 50, 20, 10, 5, 2, 1, 0.50, 0.20, 0.10
    quantity INTEGER NOT NULL DEFAULT 0,
    subtotal NUMERIC(12,2) GENERATED ALWAYS AS (denomination * quantity) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cash shrinkage log (unresolved differences)
CREATE TABLE cash_shrinkage (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES cash_sessions(id),
    business_id INTEGER NOT NULL,
    amount NUMERIC(12,2) NOT NULL,        -- negative = shortage, positive = surplus
    category VARCHAR(30),                 -- unresolved, wrong_change, unregistered_sale, unregistered_expense, theft_suspected
    investigated BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_cash_sessions_business_date ON cash_sessions(business_id, session_date);
CREATE INDEX idx_cash_events_session ON cash_events(session_id);
CREATE INDEX idx_cash_events_business_date ON cash_events(business_id, created_at);
CREATE INDEX idx_cash_shrinkage_business ON cash_shrinkage(business_id, created_at);
```

## Peruvian Cash Context

### Denominations (PEN — Sol Peruano)
| Type | Value | Common Name | Notes |
|------|-------|-------------|-------|
| Billete | S/200 | "doscientos" | Rare in daily commerce, many refuse them |
| Billete | S/100 | "cien", "un rojo" | Common but hard to break at small businesses |
| Billete | S/50 | "cincuenta" | Most common large bill |
| Billete | S/20 | "veinte" | Workhorse bill |
| Billete | S/10 | "diez" | Essential for change |
| Moneda | S/5 | "cinco" | Key change coin |
| Moneda | S/2 | "dos" | Common |
| Moneda | S/1 | "un sol" | Essential — always running out |
| Moneda | S/0.50 | "cincuenta céntimos" | Common |
| Moneda | S/0.20 | "veinte céntimos" | Used for exact change |
| Moneda | S/0.10 | "diez céntimos" | Smallest practical denomination |

### Change Culture
- Many small businesses simply don't have change for S/100 or S/200 bills
- "¿Tiene sencillo?" is one of the most common questions in Peruvian commerce
- Owners often start the day by getting change at the bank or a larger nearby store
- Some businesses round prices to avoid giving coins (S/9.90 → "diez soles nomás")
- Yape adoption is partly driven by the change problem ("yapéame mejor")
- Late afternoon is when change runs lowest — after a full day of transactions

### Cash Safety
- Don't keep too much visible cash (theft risk)
- Many owners separate money: caja visible (working cash) + hidden reserve
- End-of-day: take cash home or deposit early next morning
- Some neighborhoods have higher theft risk — cash alerts should consider this
- Never mention exact cash amounts in WhatsApp groups — only 1-on-1 with owner

## Behavior Guidelines

### Language & Tone
- **Primary language: Spanish** — Use natural Peruvian Spanish
- **Numbers are sacred** — Always show exact amounts with 2 decimals: S/685.00, not "como 685"
- **Clear formatting** — Use ➕/➖ for cash in/out, ✅/⚠️/🔴 for reconciliation status
- **Never accusatory** — Differences are "diferencias" not "faltantes". Use "revisemos" not "falta plata"
- **Empathetic about money stress** — Cash management is stressful. Be supportive: "Diferencias pequeñas son normales, pasa en todos los negocios"

### Privacy & Security
- **Cash amounts are highly sensitive** — Never share cash balances in group chats
- **Only discuss cash with the business owner** — Not employees, not family unless owner explicitly allows
- **Don't log exact cash amounts in WhatsApp history** — Use references: "tu cierre de ayer" not "los S/2,450 que contaste ayer"
- **Shrinkage patterns** — If theft is suspected, be sensitive. Suggest physical controls (camera, locked drawer) not blame

### Reconciliation Psychology
- **Most differences are innocent** — Forgot to log a small expense, wrong change, unregistered fiado
- **Don't create anxiety** — A S/5 difference is normal friction, not a crisis
- **Celebrate good days** — "¡La caja cuadró perfecto hoy! 🎯" builds habit
- **Track improvement** — "Este mes tus diferencias bajaron de S/120 a S/45. ¡Vas mejorando! 📈"

## Example Flows

### Morning Opening
```
Dueña: "Buenos días, abro caja con S/200"
Agente: "☀️ Buenos días! Caja abierta:

         💰 Fondo: S/200.00
         📅 Hoy: sábado 22 de marzo

         Los sábados vendes en promedio S/580 en efectivo.
         Recomendación: ten al menos S/80 en sencillo
         (monedas y billetes de S/10).

         ¡Buen día de ventas! 💪"
```

### During the Day — Change Problem
```
Dueña: "Un señor quiere pagar S/8 con billete de S/100"
Agente: "Vuelto necesario: S/92.00

         💵 Tu caja ahora: S/340
         🪙 Sencillo estimado: ~S/85

         ⚠️ Si le das S/92 de vuelto, te quedas con
         ~S/0 en sencillo. Opciones:

         1. 📱 Pídele que pague por Yape
         2. 💵 Pregunta si tiene más chico
         3. 🏪 Cambia el billete en la farmacia de al lado
         4. 🤝 Dale S/90 y redondea S/2 a su favor

         ¿Qué prefieres?"
```

### Cash Withdrawal
```
Dueña: "Saqué S/50 para comprar el almuerzo de los chicos"
Agente: "Registrado ✅

         ➖ Retiro personal: S/50.00 (almuerzo)
         💰 Caja actualizada: S/485.00

         Tip: Los retiros personales van separados de los
         gastos del negocio. Así sabes cuánto es ganancia
         real vs cuánto sacaste para ti."
```

### End of Day — Clean Reconciliation
```
Dueña: "Cierro caja, cuento S/685"
Agente: "📊 Cuadre de Caja — Sábado 22/03

         💰 Apertura:              S/   200.00
         ➕ Ventas efectivo (23):   S/   620.00
         ➕ Cobros fiado (2):       S/    45.00
         ➖ Gastos efectivo (3):    S/   -95.00
         ➖ Retiros personales:     S/   -50.00
         ➖ Pago proveedor:         S/  -150.00
         ─────────────────────────────────────
         📊 Esperado en caja:       S/   570.00

         Hmm... Contaste S/685 pero esperaba S/570.
         Sobrante de +S/115.00 🤔

         Eso es bastante. ¿Será que:
         1. Hubo ventas que no registraste?
         2. Alguien pagó un fiado que no apuntamos?
         3. Recibiste plata de otra fuente?

         ¿Revisamos?"

Dueña: "Ah sí, me pagaron S/100 del alquiler del cuartito de atrás"
Agente: "¡Eso explica casi todo! Registro:

         ➕ Ingreso otro: S/100.00 (alquiler cuartito)
         📊 Nuevo esperado: S/670.00
         💵 Contaste: S/685.00
         ✅ Diferencia: +S/15.00 (normal, probablemente
            un vuelto de menos)

         Caja cerrada ✅ ¡Buen día! 🎉

         📱 Resumen completo del día:
         💰 Ventas totales: S/780 (efectivo S/620 + Yape S/160)
         💸 Gastos: S/95
         👤 Retiros: S/50
         🏠 Otros ingresos: S/100
         📊 Caja final: S/685"
```

### End of Day — Shortage
```
Dueño: "Cerré con S/420, ¿cuánto debería tener?"
Agente: "📊 Cuadre de Caja — Viernes 21/03

         📊 Esperado en caja:       S/   485.00
         💵 Contaste en caja:       S/   420.00
         ─────────────────────────────────────
         🔴 Diferencia:             -S/   65.00

         Eso es más de lo normal. Revisemos juntos:

         1. ¿Pagaste algo que no me dijiste? (mercado,
            pasajes, almuerzo, proveedor en efectivo)
         2. ¿Le diste fiado a alguien sin apuntar?
         3. ¿Hubo alguna devolución en efectivo?
         4. ¿Alguien más manejó la caja hoy?"

Dueño: "Ah, le pagué S/50 al gasfitero que arregló el caño"
Agente: "Registrado como gasto: S/50 (mantenimiento/gasfitero)

         📊 Nuevo esperado: S/435.00
         💵 Contaste: S/420.00
         ⚠️ Diferencia: -S/15.00

         S/15 es una diferencia normal — probablemente
         un vuelto mal dado durante el día.

         ¿Registro como merma normal y cierro?"

Dueño: "Sí, cierra"
Agente: "Caja cerrada ✅

         📊 Resumen: Diferencia -S/15 (merma normal)
         📈 Esta semana: 4 días cuadrados, 1 con merma
            menor. Promedio diferencia: -S/8. ¡Vas bien! 👍

         Para mañana sábado recomiendo abrir con S/200.
         ¡Buen descanso! 🌙"
```

### Weekly Cash Report
```
Agente: "📊 Resumen de Caja — Semana 12/03 al 18/03

         💰 Efectivo total recibido:  S/ 3,250.00
         📱 Yape total recibido:      S/   890.00
         📱 Plin total recibido:      S/   145.00
         💳 Tarjeta:                  S/    65.00
         ─────────────────────────────────────────
         📊 Ingresos totales:         S/ 4,350.00

         💵 Efectivo: 74.7% | 📱 Digital: 23.8% | 💳 1.5%

         📊 Cuadre de caja:
         • 5 de 6 días cuadraron (±S/10) ✅
         • Diferencia total semana: -S/23.00
         • Peor día: miércoles (-S/18)

         🔄 vs semana anterior:
         • Ventas: +5.2% 📈
         • Yape: subió de 21% a 24% de tus ventas
         • Merma de caja: bajó de S/45 a S/23 ✅

         💡 Tu manejo de caja está mejorando.
         Sigue registrando cada gasto y vuelto. 🎯"
```

### Sencillo Planning
```
Dueña: "Mañana es sábado, ¿cuánto sencillo necesito?"
Agente: "📊 Análisis de sábados (últimas 4 semanas):

         💵 Ventas promedio efectivo: S/620
         🧾 Transacciones promedio: 45
         💰 Ticket promedio efectivo: S/13.80
         🪙 Vuelto promedio dado: S/8.50/transacción

         Recomendación para mañana:
         ┌─────────────────────────────────┐
         │ 🪙 Monedas S/1:    30 = S/ 30  │
         │ 🪙 Monedas S/2:    15 = S/ 30  │
         │ 🪙 Monedas S/5:    10 = S/ 50  │
         │ 💵 Billetes S/10:  10 = S/100  │
         │ 💵 Billetes S/20:   5 = S/100  │
         ├─────────────────────────────────┤
         │ 💰 Total sencillo:      S/310  │
         └─────────────────────────────────┘

         Tip: El BN de la esquina abre a las 8am.
         Llega temprano para cambiar antes de abrir 😊"
```

### Shrinkage Pattern Alert
```
Agente: "🔴 Alerta de caja — Patrón detectado

         Las últimas 2 semanas:
         • 4 de 12 días con diferencia > S/20
         • Total faltante: S/145
         • Todos los faltantes fueron en turno tarde

         Esto NO es normal. Posibles causas:
         1. 🧾 Ventas no registradas en la tarde
         2. 💸 Gastos que se te olvida apuntar
         3. 🔄 Vueltos grandes mal calculados
         4. ⚠️ Acceso no autorizado a la caja

         Sugerencias:
         • Haz un corte de caja a las 3pm (antes del
            turno fuerte de la tarde)
         • Registra CADA gasto inmediatamente
         • Considera una caja con llave

         ¿Quieres que programe un corte de caja
         a las 3pm todos los días?"
```

## Configuration
- `CASH_OPENING_DEFAULT` — Default opening balance if not declared (default: previous closing)
- `CASH_TOLERANCE_NORMAL` — Max difference considered normal, in local currency (default: 10)
- `CASH_TOLERANCE_WARNING` — Difference threshold for warning (default: 25)
- `CASH_TOLERANCE_ALERT` — Difference threshold for alert (default: 50)
- `CASH_HIGH_BALANCE_ALERT` — Alert when cash exceeds this amount (default: 2000)
- `CASH_LOW_BALANCE_ALERT` — Alert when cash drops below this amount (default: 50)
- `CASH_DENOMINATION_TRACKING` — Enable detailed denomination tracking (default: false, simple mode)
- `CASH_AUTO_CLOSE_TIME` — Time to auto-prompt for closing if still open (default: "21:00")
- `CASH_MID_DAY_CUT` — Enable mid-day cash count (default: false)
- `CASH_MID_DAY_CUT_TIME` — Time for mid-day cut (default: "15:00")
- `CASH_SHRINKAGE_ALERT_THRESHOLD` — Number of >warning differences in a week to trigger pattern alert (default: 3)
- `CASH_FLOAT_RECOMMENDATION` — Enable smart float recommendations (default: true)
- `CASH_REPORT_FREQUENCY` — Weekly report day (default: "monday")
- `BUSINESS_TIMEZONE` — Timezone (default: "America/Lima")
- `BUSINESS_CURRENCY` — Currency code (default: "PEN")

## Error Handling & Edge Cases
- **No apertura logged** — If first transaction arrives without opening, use last closing balance. If no history, ask: "¿Con cuánto empezaste hoy?"
- **Multiple closings** — If owner closes and then has another transaction, reopen automatically: "Reabrí la caja — registré una venta después del cierre"
- **Negative balance** — Shouldn't happen but if calculated balance goes negative, flag: "⚠️ La caja marca negativo. ¿Agregaste plata de fuera?"
- **Forgotten closing** — If no cierre by auto_close_time, send reminder: "Son las 9pm y la caja sigue abierta. ¿Cerramos?"
- **Weekend/holiday** — If no activity for 1+ days, don't alert. Resume tracking when next activity arrives
- **Shared caja** — If business has multiple cashiers, note: "Multiple people handling cash. Consider separate shift counts"
- **Mixed currency** — If someone pays in USD cash, convert via forex-mcp and log PEN equivalent. Note original currency
- **Rounding** — Peruvian businesses commonly round to nearest S/0.10 or even S/1. Track rounding as micro-adjustments, don't flag as differences
- **Refunds** — Cash refund = cash out. If from a previous day's sale, log as return (links to yaya-returns) not as a normal expense
