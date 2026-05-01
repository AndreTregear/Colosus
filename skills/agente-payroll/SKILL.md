# agente-payroll — Staff Payment & Shift Tracking

## Description
WhatsApp-native staff payment and shift tracking for Latin American micro-businesses. Covers staff registry (name, role, pay rate), shift logging via natural chat ("Ana trabajó 8 horas hoy"), weekly/monthly pay calculation, overtime tracking, payment recording, adelanto/loan deductions, and attendance summaries — all in natural Spanish over WhatsApp. Designed for the 1M+ Peruvian MYPEs — bodegas, pollerías, ferreterías, peluquerías, talleres, restaurantes — where the owner pays 1-10 workers weekly in cash, workers don't have formal contracts, and "payroll" is a mental calculation done on Friday afternoon.

This is NOT full PLAME/AFP/EsSalud compliance — that's a different skill for formal employers. This is practical payroll logging for the 70%+ of Peruvian micro-businesses that pay informally: daily rates, weekly cash, commission splits, or fixed monthly amounts. The owner needs to know: who worked, how many hours, how much do I owe, and did I already pay them? Replaces the notebook, the memory, and the Friday arguments with transparent, auditable tracking.

Supports multiple payment types: fixed monthly salary, daily rate (jornal), hourly rate, and commission-based (via agente-commissions). Integrates with agente-expenses to automatically log payroll as a business cost. Sends WhatsApp pay summaries to staff so everyone agrees on the numbers.

## When to Use
- Business owner registers a new staff member ("Tengo una nueva empleada, Ana, gana S/50 al día")
- Business owner logs a shift ("Ana trabajó 8 horas hoy", "Pedro vino de 8 a 5", "hoy no vino Lucía")
- Business owner asks how much they owe ("¿Cuánto le debo a Ana esta semana?", "¿cuánto es la planilla?")
- Business owner records a payment ("Le pagué a Ana S/450", "pagué planilla")
- Business owner logs an advance/loan ("Ana pidió S/100 de adelanto", "le presté S/200 a Pedro")
- Business owner asks about attendance ("¿Cuántos días trabajó Ana este mes?", "¿quién faltó esta semana?")
- Business owner tracks overtime ("Ana se quedó 2 horas extra hoy")
- Business owner asks about payroll history ("¿Cuánto le he pagado a Ana este año?")
- Business owner wants to send pay summary to staff via WhatsApp
- Business owner changes a rate ("Ana ahora gana S/60 al día")
- Business owner asks about pending payments ("¿A quién le debo plata?")
- A scheduled weekly payroll summary triggers via cron (Friday/Saturday)
- Business owner needs to calculate total labor cost for the month

## Target Users
- **Pollerías/restaurantes** — 340K+. 2-8 staff, mix of fixed salary + daily rate. Cash weekly.
- **Bodegas/tiendas** — 500K+. 1-3 helpers, usually daily rate or monthly. Cash weekly.
- **Peluquerías/salones** — 50-80K. Commission-based via agente-commissions, but some have fixed-rate assistants too.
- **Ferreterías** — 200K+. 1-5 staff, mix of delivery drivers (daily) and counter staff (monthly).
- **Talleres mecánicos** — 100K+. Maestros + ayudantes, daily/weekly rates.
- **Mercado stalls** — 200K+. 1-2 helpers, daily rate, cash daily or weekly.
- **Any micro-business** where the owner pays workers and needs to track who got what.

## Capabilities

### Core: Staff Registry
- **Add staff member** — "Tengo una nueva empleada, Ana, mesera, gana S/50 al día" → creates staff profile with name, role, pay type, rate
- **Pay types** — Fixed monthly salary, daily rate (jornal), hourly rate, commission-based (links to agente-commissions)
- **Update rate** — "Ana ahora gana S/60 al día" → updates rate, keeps history of changes
- **Deactivate staff** — "Pedro ya no trabaja conmigo" → marks inactive, preserves history
- **Staff list** — "¿Quiénes trabajan conmigo?" → shows active staff with roles and rates
- **Multiple roles** — One person can have multiple roles: "Ana es mesera y a veces ayuda en cocina (S/60 cocina, S/50 mesera)"
- **Rate history** — Track when rates changed for accurate historical calculations

### Core: Shift Logging
- **Log shift by hours** — "Ana trabajó 8 horas hoy" → records shift with date, hours, calculated pay
- **Log shift by time range** — "Pedro vino de 8am a 5pm" → calculates hours automatically (9h - 1h lunch = 8h)
- **Log absence** — "Hoy no vino Lucía" → records absence, no pay accrued
- **Log partial day** — "Ana vino medio día" → records 4 hours (configurable half-day)
- **Bulk shift entry** — "Hoy: Ana 8h, Pedro 8h, Lucía no vino" → log all staff at once
- **Voice shift logging** — "Ana trabajó ocho horas y Pedro seis" via voice note
- **Late arrival** — "Ana llegó tarde, empezó a las 9:30 en vez de 8" → records actual hours, flags tardiness
- **Default shift** — If owner just says "Ana vino hoy", assume standard shift (configurable, default 8h)
- **Auto-log from appointments** — For service businesses using agente-appointments, auto-detect working hours from completed appointments

### Core: Overtime Tracking
- **Log overtime** — "Ana se quedó 2 horas extra hoy" → records OT hours separately
- **Overtime rate** — Configurable multiplier (default: 1.5x for first 2h extra, 2x beyond that — follows Peruvian labor norms even for informal)
- **Overtime calculation** — Automatically detect when logged hours exceed standard shift: "Pedro trabajó 10 horas" → 8h normal + 2h overtime
- **Weekly overtime summary** — "Ana hizo 6 horas extra esta semana (S/90 adicional)"

### Core: Pay Calculation
- **Weekly pay summary** — Per-staff breakdown: days worked, hours, regular pay, overtime, deductions, net pay
- **Monthly pay summary** — Same but for the full month
- **Mixed pay types** — Handle staff with different pay types in the same payroll run
- **Commission integration** — For commission-based staff, pull totals from agente-commissions instead of calculating from hours
- **Running total** — After each shift logged: "Ana lleva 4 días esta semana, S/200 acumulados"
- **Payroll total** — "¿Cuánto es la planilla esta semana?" → total across all staff
- **Pro-rated monthly** — For monthly salary staff who started mid-month: auto-calculate proportional amount

### Core: Payment Recording
- **Record payment** — "Le pagué a Ana S/450" → marks as paid, records amount, date, method
- **Payment method** — Cash (default), Yape, Plin, bank transfer
- **Bulk payment** — "Pagué planilla: Ana S/450, Pedro S/400, Lucía S/350" → records all at once
- **Payout confirmation** — After recording: "Registrado ✅ Ana: S/450 (efectivo). ¿Le mando su resumen por WhatsApp?"
- **Payment vs owed** — If payment amount differs from calculated: "Ana debería recibir S/480, pero registraste S/450. ¿Le descontaste algo?"
- **Auto-expense** — Every payroll payment auto-creates an expense in agente-expenses (categoría: planilla)
- **Payment history** — "¿Cuánto le he pagado a Ana este mes?" → complete payment log

### Core: Deductions (Adelantos & Loans)
- **Log adelanto** — "Ana pidió S/100 de adelanto" → recorded as advance against pay
- **Log loan** — "Le presté S/500 a Pedro, descuéntale S/100 por semana" → installment deduction
- **Auto-deduct** — Adelantos and loan installments auto-deducted from weekly payout
- **Pending balance** — "¿Cuánto le debo descontar a Pedro?" → shows remaining loan balance
- **Deduction history** — Full trail of advances and loan payments per staff member
- **Deduction limit** — Optional: don't deduct more than X% of weekly pay (protects worker, default: 30%)

### Core: Attendance Summary
- **Daily attendance** — "¿Quién vino hoy?" → list of present/absent staff
- **Weekly attendance** — "¿Cómo fue la asistencia esta semana?" → days worked per person
- **Monthly attendance** — Full month view with days worked, absences, tardiness, overtime
- **Absence patterns** — "Lucía ha faltado 3 lunes seguidos" → pattern detection
- **Attendance rate** — "Ana: 95% asistencia (22/23 días hábiles)" per staff member

### Core: Staff WhatsApp Notifications
- **Pay summary to staff** — Send each worker their pay breakdown via WhatsApp after payout
- **Pay slip format** — Clear, simple format: period, days worked, hours, rate, gross, deductions, net
- **Opt-in only** — Only send if business owner enables it and staff member has a WhatsApp number on file
- **Confirmation request** — Staff can reply to acknowledge receipt: "OK" or flag discrepancies

### Integration: Cross-Skill Events

| Source Skill | Event Type | Payroll Effect |
|-------------|-----------|---------------|
| agente-commissions | Commission payout | Replace hourly calc with commission total for commission-based staff |
| agente-expenses | Payroll payment | Auto-log each payment as planilla expense |
| agente-cash | Cash payment | Track cash payroll payments in caja |
| agente-appointments | Completed services | Auto-detect working hours for service-based staff |
| agente-fiados | — | No direct link |

### Proactive Alerts
- **Payday reminder** — Friday morning: "Hoy es día de pago. Planilla estimada: S/1,850. ¿Procesamos?"
- **Unpaid staff** — "⚠️ Pasaron 2 semanas y no registraste pago para Lucía. ¿Le debes?"
- **Attendance anomaly** — "Pedro ha faltado 4 veces este mes (vs 1 vez promedio). ¿Todo bien?"
- **Overtime spike** — "Esta semana Ana hizo 12 horas extra. ¿Necesitas contratar ayuda?"
- **Rate reminder** — "Llevas 6 meses sin ajustar tarifas. La inflación acumulada es 3.2%. ¿Quieres revisar?"

## MCP Tools Required
- `postgres-mcp` — Staff registry, shift logs, payment records, attendance history, loan balances, deduction tracking
- `agente-expenses` — Auto-log payroll payments as business expenses (categoría: planilla)
- `agente-commissions` — Pull commission totals for commission-based staff
- `agente-cash` — Cash payroll payments tracked in caja
- `agente-appointments` — Auto-detect working hours from completed services (optional)
- `agente-notifications` — Send pay summaries to staff via WhatsApp

## Database Schema

```sql
-- Staff registry
CREATE TABLE IF NOT EXISTS business.payroll_staff (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    role TEXT,                                  -- mesera, cocinero, ayudante, repartidor, etc.
    phone TEXT,                                 -- for WhatsApp notifications
    pay_type TEXT NOT NULL CHECK (pay_type IN (
        'daily', 'hourly', 'monthly', 'commission'
    )),
    rate NUMERIC(12,2),                        -- S/50 daily, S/8 hourly, S/1200 monthly; NULL for commission
    commission_staff_id UUID,                  -- link to commission_staff for commission-based workers
    standard_shift_hours NUMERIC(4,1) DEFAULT 8.0,
    hire_date DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT TRUE,
    deactivated_at DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ps_business ON business.payroll_staff(business_id, is_active);
CREATE INDEX IF NOT EXISTS idx_ps_name ON business.payroll_staff(business_id, name);

-- Rate history (track rate changes)
CREATE TABLE IF NOT EXISTS business.payroll_rate_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    staff_id UUID NOT NULL REFERENCES business.payroll_staff(id) ON DELETE CASCADE,
    pay_type TEXT NOT NULL,
    rate NUMERIC(12,2),
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    changed_by TEXT DEFAULT 'owner',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prh_staff ON business.payroll_rate_history(staff_id, effective_date DESC);

-- Shift log (daily attendance + hours)
CREATE TABLE IF NOT EXISTS business.payroll_shifts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    staff_id UUID NOT NULL REFERENCES business.payroll_staff(id) ON DELETE CASCADE,
    business_id INTEGER NOT NULL,
    shift_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL CHECK (status IN (
        'worked', 'absent', 'half_day', 'late', 'holiday'
    )),
    hours_regular NUMERIC(4,1) DEFAULT 0,
    hours_overtime NUMERIC(4,1) DEFAULT 0,
    time_in TIME,                              -- optional: exact clock-in
    time_out TIME,                             -- optional: exact clock-out
    regular_pay NUMERIC(12,2) DEFAULT 0,
    overtime_pay NUMERIC(12,2) DEFAULT 0,
    notes TEXT,                                -- "llegó tarde", "salió temprano por médico"
    logged_by TEXT DEFAULT 'owner',            -- owner, auto (from appointments)
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(staff_id, shift_date)
);

CREATE INDEX IF NOT EXISTS idx_psh_staff_date ON business.payroll_shifts(staff_id, shift_date);
CREATE INDEX IF NOT EXISTS idx_psh_business_date ON business.payroll_shifts(business_id, shift_date);

-- Payroll deductions (adelantos, loans, other)
CREATE TABLE IF NOT EXISTS business.payroll_deductions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    staff_id UUID NOT NULL REFERENCES business.payroll_staff(id) ON DELETE CASCADE,
    deduction_type TEXT NOT NULL CHECK (deduction_type IN (
        'adelanto', 'loan', 'other'
    )),
    total_amount NUMERIC(12,2) NOT NULL,       -- original amount (for loans)
    remaining_balance NUMERIC(12,2) NOT NULL,  -- how much is still owed
    installment_amount NUMERIC(12,2),          -- per-period deduction (for loans)
    deduction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reason TEXT,                                -- "emergencia médica", "uniforme", "colegio"
    payment_method TEXT DEFAULT 'efectivo',
    is_settled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pd_staff ON business.payroll_deductions(staff_id, is_settled);
CREATE INDEX IF NOT EXISTS idx_pd_pending ON business.payroll_deductions(is_settled) WHERE NOT is_settled;

-- Payment records (actual payouts)
CREATE TABLE IF NOT EXISTS business.payroll_payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    staff_id UUID NOT NULL REFERENCES business.payroll_staff(id) ON DELETE CASCADE,
    business_id INTEGER NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    days_worked INTEGER DEFAULT 0,
    hours_regular NUMERIC(6,1) DEFAULT 0,
    hours_overtime NUMERIC(6,1) DEFAULT 0,
    gross_pay NUMERIC(12,2) DEFAULT 0,         -- regular + overtime + commissions
    total_deductions NUMERIC(12,2) DEFAULT 0,  -- adelantos + loan installments
    net_pay NUMERIC(12,2) DEFAULT 0,           -- gross - deductions
    commission_total NUMERIC(12,2) DEFAULT 0,  -- from agente-commissions (if applicable)
    payment_method TEXT DEFAULT 'efectivo' CHECK (payment_method IN (
        'efectivo', 'yape', 'plin', 'transferencia'
    )),
    expense_id UUID,                           -- link to agente-expenses record
    is_paid BOOLEAN DEFAULT FALSE,
    paid_at TIMESTAMPTZ,
    staff_notified BOOLEAN DEFAULT FALSE,
    staff_confirmed BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pp_staff ON business.payroll_payments(staff_id, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_pp_business ON business.payroll_payments(business_id, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_pp_unpaid ON business.payroll_payments(is_paid) WHERE NOT is_paid;
```

## Peruvian Informal Payroll Context

### Reality of Micro-Business Payroll
- 70%+ of Peruvian MYPEs operate with informal workers — no contracts, no payslips, no PLAME
- Most workers are paid weekly in cash, on Friday or Saturday
- Daily rate ("jornal") is the most common pay type for non-permanent staff: S/40-80/day depending on role and city
- Monthly salary for permanent staff: S/1,025 minimum wage (2026), but many informal workers earn less
- The owner often pays from the cash register at the end of the week — payroll and caja are intertwined
- "Adelantos" (advances) are culturally expected and very common — refusing is seen as disrespectful
- Workers often don't track their own hours — they trust the owner, but disputes happen on payday
- No overtime premium is standard in informal work, but tracking it builds trust and fairness

### Common Pay Structures
| Business Type | Common Pay | Typical Rate | Pay Frequency |
|--------------|-----------|-------------|---------------|
| Restaurante/pollería | Daily rate | S/40-60/día | Weekly (sábado) |
| Bodega | Monthly | S/1,000-1,200/mes | Monthly or quincenal |
| Peluquería | Commission | 25-40% of services | Weekly (viernes) |
| Ferretería | Monthly + delivery bonus | S/1,200 + S/5/delivery | Monthly |
| Taller mecánico | Daily rate | S/50-80/día | Weekly |
| Mercado stall | Daily rate | S/35-50/día | Daily or weekly |

### Cultural Notes
- "Quincenal" (twice a month, 15th and 30th) is common for slightly more formal businesses
- Many owners pay a small "propina" or bonus for good weeks — track as bonus, not base pay
- Workers sometimes send a family member to cover a shift — record as worked by the substitute, flag for owner
- "Aguinaldo" or gratificación in July and December is legally required but rarely paid informally — owner can opt to track it
- Trust is everything: transparent tracking prevents the "me están pagando de menos" argument

## Behavior Guidelines

### Language & Tone
- **Primary language: Spanish** — Natural Peruvian Spanish
- **Numbers are sacred** — Always show exact amounts: S/450.00, not "como cuatrocientos cincuenta"
- **Use names, not IDs** — "Ana" not "empleado #3". Staff are people.
- **Neutral on absences** — Don't judge. "Lucía no vino hoy" is a fact, not a complaint. The owner decides consequences.
- **Supportive on disputes** — If staff questions pay, show the math transparently. Don't take sides.
- **Simple formatting** — Use ✅/⚠️/📊 for quick scanning. Tables for summaries. Keep messages short between clients.

### Privacy & Security
- **Payroll is highly sensitive** — Never share one worker's pay info with another worker
- **Only discuss payroll with the business owner** — Unless the owner explicitly authorizes sending summaries to staff
- **Staff notifications are opt-in** — Owner must enable before any messages go to workers
- **Don't log exact amounts in group chats** — Only in 1-on-1 with the owner

### Payment Psychology
- **Celebrate on-time payment** — "¡Planilla al día! Todos pagados esta semana ✅" builds good habits
- **Don't nag about unpaid** — Gentle reminder, once. The owner knows their cash flow situation.
- **Adelantos are normal** — Don't treat advances as a problem. Just track them clearly.
- **Deduction transparency** — Always show deduction detail when calculating net pay. Workers need to see where the money went.

## Example Flows

### Registering New Staff
```
Dueña: "Tengo una nueva empleada, se llama Ana, es mesera y le pago S/50 al día"
Agente: "✅ Registrada:
         👤 Ana — Mesera
         💰 S/50.00 por día (jornal)

         ¿Ana trabaja todos los días o solo algunos?
         Así calculo mejor su pago semanal."

Dueña: "De lunes a sábado"
Agente: "Anotado ✅ Ana trabaja 6 días/semana.
         Pago semanal estimado: S/300.00

         ¿Tiene número de WhatsApp para enviarle
         su resumen de pago cada semana?"
```

### Logging Daily Shifts
```
Dueña: "Hoy: Ana 8 horas, Pedro 8 horas, Lucía no vino"
Agente: "✅ Registrado — Miércoles 18/03:

         👤 Ana:   8h ✅  (S/50.00)
         👤 Pedro: 8h ✅  (S/55.00)
         👤 Lucía: ausente ❌

         📊 Acumulado esta semana (lun-mié):
         • Ana:   3 días, S/150.00
         • Pedro: 3 días, S/165.00
         • Lucía: 2 días, S/80.00 (faltó hoy)"
```

### Overtime Tracking
```
Dueña: "Ana se quedó 2 horas extra hoy"
Agente: "✅ Registrado:
         👤 Ana — Miércoles 18/03
         ⏰ 8h regulares + 2h extra
         💰 Regular: S/50.00
         💰 Horas extra: S/18.75 (2h × S/9.38 = 1.5x)
         ─────────────────────────
         💰 Total hoy: S/68.75

         📊 Ana esta semana:
         3 días + 2h extra = S/218.75"
```

### Adelanto (Advance Payment)
```
Dueña: "Ana me pidió S/100 de adelanto"
Agente: "Registrado ✅
         👤 Ana — Adelanto: S/100.00 (efectivo)

         📊 Estado de Ana esta semana:
         💰 Acumulado: S/218.75 (3 días + 2h extra)
         ➖ Adelanto: S/100.00
         ─────────────────────────
         💵 Le quedaría: S/118.75 (hasta ahora)

         Se descontará automáticamente del pago
         del viernes. ¿Le pago el adelanto ya?"

Dueña: "Ya le di"
Agente: "Listo ✅ Adelanto entregado y registrado.
         Se descuenta del pago del viernes."
```

### Loan with Installments
```
Dueña: "Le presté S/500 a Pedro para una emergencia, descuéntale S/100 por semana"
Agente: "Registrado ✅
         👤 Pedro — Préstamo: S/500.00
         📅 Cuotas: S/100.00/semana × 5 semanas
         📅 Liquidación estimada: viernes 18/04

         Se descontará S/100 automáticamente de
         cada pago semanal.

         📊 Pedro esta semana:
         💰 Acumulado: S/165.00 (3 días)
         ➖ Cuota préstamo: S/100.00
         💵 Le quedaría: S/65.00 (hasta ahora)"
```

### Weekly Payroll Summary (Friday)
```
Agente: "📊 Planilla Semanal — 14 al 20 de marzo

         👤 ANA — Mesera (S/50/día)
         ┌─────────────────────────────────┐
         │ 📅 Días trabajados: 6/6         │
         │ ⏰ Horas extra: 2h              │
         │ 💰 Regular: S/300.00            │
         │ 💰 Horas extra: S/18.75         │
         │ ─────────────────────────────── │
         │ 💰 Bruto: S/318.75              │
         │ ➖ Adelanto: -S/100.00           │
         │ ═══════════════════════════════ │
         │ 💵 PAGAR: S/218.75              │
         └─────────────────────────────────┘

         👤 PEDRO — Ayudante cocina (S/55/día)
         ┌─────────────────────────────────┐
         │ 📅 Días trabajados: 5/6         │
         │ ⏰ Horas extra: 0               │
         │ 💰 Regular: S/275.00            │
         │ ─────────────────────────────── │
         │ 💰 Bruto: S/275.00              │
         │ ➖ Cuota préstamo: -S/100.00     │
         │ ═══════════════════════════════ │
         │ 💵 PAGAR: S/175.00              │
         └─────────────────────────────────┘

         👤 LUCÍA — Ayudante (S/40/día)
         ┌─────────────────────────────────┐
         │ 📅 Días trabajados: 5/6         │
         │ 💰 Regular: S/200.00            │
         │ ═══════════════════════════════ │
         │ 💵 PAGAR: S/200.00              │
         └─────────────────────────────────┘

         ─────────────────────────────────────
         📊 TOTAL PLANILLA: S/593.75
         💵 Efectivo necesario: S/593.75
         ─────────────────────────────────────

         ¿Proceso los pagos?"
```

### Recording Payments
```
Dueña: "Ya les pagué: Ana S/220, Pedro S/175, Lucía S/200"
Agente: "✅ Pagos registrados:

         👤 Ana:   S/220.00 ✅ (efectivo)
              Diferencia vs calculado: +S/1.25
              (probablemente redondeaste, OK 👍)
         👤 Pedro: S/175.00 ✅ (efectivo)
         👤 Lucía: S/200.00 ✅ (efectivo)

         📊 Total pagado: S/595.00
         💸 Registrado como gasto (planilla) en tus gastos

         📊 Préstamo Pedro:
         Cuota S/100 descontada. Pendiente: S/400 (4 semanas)

         ¿Les mando su resumen a cada uno por WhatsApp?"

Dueña: "Sí, mándales"
Agente: [envía a Ana via WhatsApp]:
         "Hola Ana 👋 Tu resumen de pago:
          📅 Semana 14-20 marzo
          📅 Días: 6 + 2h extra
          💰 S/318.75 bruto
          ➖ S/100.00 adelanto
          💵 S/220.00 recibido ✅
          ¡Buen trabajo esta semana! 💪"

Agente: "Listo ✅ Resúmenes enviados a Ana, Pedro y Lucía."
```

### Commission-Based Staff
```
Dueña: "¿Cuánto le toca a María esta semana? Ella es por comisión"
Agente: [consulta agente-commissions]
Agente: "📊 María — Semana 14-20 marzo (comisiones)

         ✂️ Servicios: 18 atenciones
         💰 Facturado: S/2,150.00
         💇 Comisión servicios (35%): S/752.50
         🧴 Comisión productos (10%): S/12.80
         🎁 Propinas: S/45.00
         ─────────────────────────────────
         💰 Bruto: S/810.30
         ➖ Productos usados: -S/85.00
         ➖ Adelanto: -S/0.00
         ═════════════════════════════════
         💵 PAGAR: S/725.30

         (Detalle de comisiones viene de agente-commissions)"
```

### Monthly Attendance Report
```
Dueño: "¿Cómo fue la asistencia de marzo?"
Agente: "📊 Asistencia — Marzo 2026

         👤 Ana (mesera):
         ✅ Días trabajados: 24/26
         ❌ Ausencias: 2 (lunes 10, viernes 21)
         ⏰ Horas extra: 8h (4 días)
         📊 Asistencia: 92%

         👤 Pedro (ayudante cocina):
         ✅ Días trabajados: 22/26
         ❌ Ausencias: 4 (todos lunes)
         ⏰ Horas extra: 0
         📊 Asistencia: 85%
         ⚠️ Patrón: falta todos los lunes

         👤 Lucía (ayudante):
         ✅ Días trabajados: 25/26
         ❌ Ausencias: 1 (jueves 6)
         📊 Asistencia: 96% ⭐

         📊 Promedio del equipo: 91%
         ⚠️ Pedro tiene un patrón de ausencia los lunes.
            ¿Quieres hablar con él?"
```

### Monthly Payroll Cost Report
```
Agente: "📊 Costo de Planilla — Marzo 2026

         💸 RESUMEN
         • Total pagado: S/6,280.00
         • Empleados activos: 3
         • vs febrero: ↗️ +5% (+S/300)

         💸 POR EMPLEADO
         • 👤 Ana: S/2,450 (39%)
           — 24 días + 8h extra
         • 👤 Pedro: S/1,930 (31%)
           — 22 días, S/400 préstamo descontado
         • 👤 Lucía: S/1,900 (30%)
           — 25 días

         💰 DEDUCIDO ESTE MES
         • Adelantos: S/200 (Ana)
         • Préstamos: S/400 (Pedro, quedan S/100)

         📊 Planilla como % de ventas: 18%
         (referencia sector: 15-25% es saludable)

         💡 Tu costo de planilla está en rango
         saludable para tu tipo de negocio. 👍"
```

### Staff Rate Change
```
Dueña: "Ana ahora gana S/60 al día, se lo ganó"
Agente: "✅ Actualizado:
         👤 Ana — Nueva tarifa: S/60.00/día
         📅 Vigente desde: hoy 20/03/2026
         📈 Antes: S/50.00 → Ahora: S/60.00 (+20%)

         💰 Impacto semanal estimado:
         Antes: S/300/semana → Ahora: S/360/semana (+S/60)

         Historial guardado — los cálculos anteriores
         no se afectan. ¡Ana se lo merece! 💪"
```

## Configuration
- `PAYROLL_PAY_FREQUENCY` — Default pay frequency: "weekly", "biweekly", "monthly" (default: "weekly")
- `PAYROLL_PAY_DAY` — Day of week for weekly pay: "friday", "saturday" (default: "friday")
- `PAYROLL_STANDARD_SHIFT` — Default shift hours when not specified (default: 8)
- `PAYROLL_HALF_DAY_HOURS` — Hours for "medio día" (default: 4)
- `PAYROLL_OT_MULTIPLIER_1` — Overtime rate for first 2 extra hours (default: 1.5)
- `PAYROLL_OT_MULTIPLIER_2` — Overtime rate beyond 2 extra hours (default: 2.0)
- `PAYROLL_OT_THRESHOLD` — Hours beyond standard shift to trigger OT (default: equals PAYROLL_STANDARD_SHIFT)
- `PAYROLL_DEDUCTION_MAX_PERCENT` — Max percentage of pay deductible per period (default: 30)
- `PAYROLL_AUTO_EXPENSE` — Auto-create expense in agente-expenses when payment recorded (default: true)
- `PAYROLL_STAFF_NOTIFICATIONS` — Send pay summaries to staff via WhatsApp (default: false)
- `PAYROLL_REMINDER_ENABLED` — Send Friday payday reminder to owner (default: true)
- `PAYROLL_REMINDER_TIME` — Time to send payday reminder (default: "09:00")
- `PAYROLL_LUNCH_DEDUCTION` — Auto-deduct lunch hour from time-range shifts (default: true)
- `PAYROLL_LUNCH_HOURS` — Hours to deduct for lunch (default: 1)
- `PAYROLL_REPORT_FREQUENCY` — Monthly report day (default: 1, first of month)
- `BUSINESS_TIMEZONE` — Timezone (default: "America/Lima")
- `BUSINESS_CURRENCY` — Currency code (default: "PEN")

## Error Handling & Edge Cases
- **Duplicate shift entry:** If a shift is already logged for a staff member on the same date, ask: "Ya registré 8 horas para Ana hoy. ¿Quieres actualizar o es un error?"
- **Unknown staff name:** If the owner mentions someone not in the registry: "No tengo registrada a 'Carmen'. ¿Quieres agregarla? ¿Cuánto gana?"
- **Payment exceeds owed:** If payment recorded is more than calculated: "Ana debería recibir S/318, pero registraste S/350. ¿Le diste propina extra o hay un ajuste?"
- **Payment less than owed:** "Registraste S/200 para Ana, pero el cálculo es S/318. ¿Le quedas debiendo S/118 o hubo algún descuento que no registré?"
- **Negative net pay:** If deductions exceed earnings: "⚠️ Las deducciones de Pedro (S/200) superan lo que ganó esta semana (S/165). No puedo descontar más de lo ganado. ¿Paso S/35 a la próxima semana?"
- **Staff without shifts:** If payday arrives and no shifts logged for someone: "No registré turnos para Lucía esta semana. ¿No trabajó o se me pasó registrar?"
- **Retroactive shifts:** "Ana trabajó el lunes pero no lo registré" → accept past dates without friction. Ask for the date if vague.
- **Multiple pay types same person:** If someone works both hourly shifts and has commissions: track both, sum for total payout. Show breakdown clearly.
- **Mid-week rate change:** If rate changes mid-week, apply old rate to days before change, new rate after. Show the split in the summary.
- **Worker substitute:** "Vino el hermano de Pedro en su lugar" → log as guest/substitute worker, not as Pedro's shift. Flag for owner review.
- **Holiday pay:** If the owner marks a day as holiday, ask: "¿Les pagas a todos por el feriado o solo a los que vinieron?"
- **WhatsApp notification failure:** If staff member's phone number is invalid or message fails, notify the owner: "No pude enviar el resumen a Ana. ¿Verificamos su número?"
- **Informal to formal transition:** If a business starts formalizing, note: "Este módulo es para planilla informal. Para PLAME, AFP y EsSalud necesitarás un módulo de planilla formal."
