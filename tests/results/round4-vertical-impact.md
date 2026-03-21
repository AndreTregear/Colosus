# Round 4 Evaluation — Vertical Impact Assessment

**Evaluator:** Yaya Platform Test Engine (Round 4)
**Date:** 2026-03-21
**Purpose:** Re-evaluate 6 key personas against the full 26-skill platform to measure cumulative improvement since Round 2.

**New skills since Round 3:** yaya-restaurant, yaya-memberships, yaya-commissions, yaya-quotes, yaya-tax-colombia, yaya-credit, yaya-cash, yaya-ledger, yaya-suppliers

**Total platform skills:** 26
**Total MCP servers:** 11 (forex-mcp, crm-mcp, whatsapp-mcp, appointments-mcp, erpnext-mcp, invoicing-mcp, lago-mcp, payments-mcp, postgres-mcp, voice-mcp)

---

## 1. Doña Gladys Paredes — Pollería La Serranita (Huancayo)

**Round 2:** 6.1/10 avg, 52% PMF | **Business:** Pollo a la brasa, S/180K/yr, family-run, RUS

### Scenario Re-Scoring (28 scenarios)

| # | Scenario | R2 | R4 | Key Skill(s) | Notes |
|---|----------|----|----|-------------|-------|
| S01 | Onboarding pollería | 7 | 8 | yaya-onboarding, yaya-voice | Unchanged; strong flow for low-tech |
| S02 | Registrar venta diaria (45 pollos, 20 medios, salchipapas) | 7 | **9** | **yaya-restaurant** + yaya-ledger | 🆕 yaya-restaurant has exact "daily dish sales" logging. Variant tracking (1/4, 1/2, entero). Running daily totals |
| S03 | ¿Cuántos pollos me quedan? | 6 | **9** | **yaya-restaurant** | 🆕 Perishable inventory: bought - sold - waste - staff meals = remaining. Exact pollo counting |
| S04 | Pedido delivery 3 pollos enteros | 8 | 8 | yaya-sales | Unchanged; order creation strong |
| S05 | Compra del mercado (50 pollos, papa, carbón) | 6 | **9** | **yaya-restaurant** + **yaya-suppliers** | 🆕 Daily purchase logging from market, auto-expense creation, supplier price tracking |
| S06 | Se quemaron 5 pollos (merma) | 5 | **9** | **yaya-restaurant** | 🆕 Explicit waste tracking by type: spoiled/overcooked/end-of-day. Loss reporting with cost |
| S07 | Precio pollo entero + descuento? | 8 | 8 | yaya-sales | Unchanged; solid |
| S08 | Verificar pago Yape S/68 | 6 | 7 | yaya-payments | Minor improvement — still limited by Yape balance visibility |
| S09 | Cuadre de caja (efectivo S/850 + Yape S/230) | 7 | **9** | **yaya-cash** | 🆕 Cash box reconciliation: opening float, cash in, Yape in, cash out, expected vs actual. Exact scenario |
| S10 | Problema con vuelto (billete de S/200) | 3 | **8** | **yaya-cash** | 🆕 Change management, float optimization, denomination tracking. Recommendations for opening float |
| S11 | Pollo subió a S/15, ¿subo precios? | 7 | **9** | **yaya-restaurant** | 🆕 Ingredient price update → auto-recalculate COGS and margin for all chicken dishes. Margin alerts |
| S12 | Boleta por 2 pollos S/136 | 7 | 7 | yaya-tax | Unchanged; RUS boleta guidance |
| S13 | Miedo a SUNAT / límite RUS | 8 | 8 | yaya-tax | Strong; specific numbers for RUS Cat. 2 |
| S14 | Talonario de boletas agotándose | 4 | 4 | yaya-tax (partial) | Still no paper talonario tracking — electronic-focused |
| S15 | Piden factura pero soy RUS | 9 | 9 | yaya-tax | Excellent; explains RUS can't issue facturas |
| S16 | ¿Cuánto gané este mes? | 6 | **9** | **yaya-restaurant** + yaya-expenses + **yaya-ledger** | 🆕 Daily food cost %, purchase tracking, P&L: revenue - purchases - waste - staff meals = gross profit |
| S17 | Comparar febrero vs enero | 7 | 8 | yaya-analytics + **yaya-restaurant** | 🆕 Restaurant sales data enriches comparison with dish-level breakdown |
| S18 | Mejor día de venta | 8 | 8 | yaya-analytics | Unchanged; strong day-of-week analysis |
| S19 | Costo de pollos vs ganancia limpia | 5 | **9** | **yaya-restaurant** | 🆕 COGS per dish, food cost %, daily P&L. Exact scenario: "cuánto gasto en pollos y cuánto me queda" |
| S20 | Día de la Madre: ¿cuántos pollos comprar? | 5 | **9** | **yaya-restaurant** | 🆕 Demand planning: historical daily sales, day-of-week patterns, holiday/event boost estimation. "Los domingos vendes 30% más" |
| S21 | Proveedor vendió pollos feos | 5 | **8** | **yaya-suppliers** | 🆕 Supplier complaint tracking, quality scoring, alternative supplier comparison |
| S22 | Delivery tardó, cliente quiere reembolso S/68 | 7 | 7 | yaya-returns + yaya-escalation | Unchanged; handles refund + handoff |
| S23 | Horno malogrado, 30 pedidos pendientes | 4 | 5 | yaya-escalation + **yaya-restaurant** | 🆕 Rotisserie batch tracking helps reorganize batches with limited capacity, but crisis mgmt still limited |
| S24 | Caja no cuadra, faltan S/45 | 3 | **8** | **yaya-cash** | 🆕 Cash discrepancy investigation: expected vs actual, transaction-by-transaction review, shrinkage patterns |
| S25 | Audio con ruido (compra 40 pollos + carbón) | 7 | 8 | yaya-voice + **yaya-restaurant** | 🆕 Voice purchase logging parsed into restaurant daily purchases |
| S26 | "La señora del 2do piso quiere lo de siempre" | 4 | 5 | yaya-crm + yaya-sales | Marginal improvement; CRM preference lookup still requires prior data |
| S27 | Mensaje mixto (ventas + Yape + alquiler + horno nuevo) | 6 | **8** | **yaya-restaurant** + yaya-expenses + **yaya-cash** + **yaya-ledger** | 🆕 Multiple skills parse multi-topic message: sales→restaurant, Yape→cash, alquiler→expenses, horno→capex |
| S28 | 5am: ¿cuántos pollos compro? Es miércoles | 5 | **9** | **yaya-restaurant** | 🆕 Pre-market shopping list cron at 4AM. Day-of-week based purchase suggestion. Exact scenario |

### Doña Gladys Summary

| Metric | Round 2 | Round 4 | Delta |
|--------|---------|---------|-------|
| **Average Score** | 6.1/10 | **7.9/10** | **+1.8** |
| **PMF %** | 52% | **75%** | **+23pp** |

**Top 3 Improvements from New Skills:**
1. **yaya-restaurant** — Transforms pollería management: dish sales tracking, COGS per dish, waste tracking, demand planning, rotisserie batches. Covers 12+ scenarios directly. This is the single highest-impact skill for Doña Gladys.
2. **yaya-cash** — Solves the #1 lowest-scoring universal scenario (cash reconciliation). Opening float, denomination tracking, cuadre de caja, discrepancy investigation.
3. **yaya-suppliers** — Market purchase tracking with supplier comparison, price history, quality complaints. Replaces the mental rolodex of "quién me vende más barato."

**Remaining Top 3 Gaps:**
1. **Paper talonario tracking** — yaya-tax still focuses on electronic boletas; Doña Gladys uses physical talonarios (S14: 4/10)
2. **Delivery management** — No tracking for Carlitos's delivery routes, ETAs, or queue management
3. **Equipment/maintenance tracking** — Oven maintenance, equipment breakdowns need asset management (S23: 5/10)

**PMF Verdict: 🟢 LAUNCH READY (75%)**

---

## 2. Fernando Díaz — CrossFit Miraflores (Lima)

**Round 2:** 5.6/10 avg, 35% PMF | **Business:** CrossFit box, S/420K/yr, 8 staff, memberships + supplements

### Scenario Re-Scoring (30 scenarios)

| # | Scenario | R2 | R4 | Key Skill(s) | Notes |
|---|----------|----|----|-------------|-------|
| S01 | Nueva membresía (Alejandra, S/280 mensual, Yape) | 5 | **9** | **yaya-memberships** | 🆕 Member enrollment with plan, start date, expiration, payment tracking. Renewal reminders auto-scheduled |
| S02 | ¿Cuántos miembros activos? ¿Cuántos se vencen? | 3 | **9** | **yaya-memberships** | 🆕 Active member count, expiring-this-week list, renewal amounts, bulk collection workflow |
| S03 | Registro de clase (18 personas, WOD Fran, Coach Diego) | 3 | **7** | **yaya-memberships** (attendance) + yaya-appointments | 🆕 Attendance tracking via memberships. Group class ≠ perfect appointment fit but attendance recorded |
| S04 | Venta suplementos (3 proteínas + 2 creatinas, Yape) | 7 | 8 | yaya-sales + yaya-payments + yaya-inventory | Minor improvement from platform maturity |
| S05 | Programación de clases (horarios, coaches) | 4 | 6 | yaya-appointments + **yaya-memberships** | 🆕 Provider scheduling exists; class template scheduling still imperfect for group fitness |
| S06 | Lead nuevo de Instagram (precios, bienvenida) | 7 | 8 | yaya-meta + yaya-crm + yaya-followup | Improved lead flow with trial offer from memberships |
| S07 | Stock de proteínas y camisetas | 7 | 7 | yaya-inventory | Unchanged; variant stock check |
| S08 | Cobro masivo 35 membresías vencidas | 3 | **9** | **yaya-memberships** + yaya-notifications | 🆕 Bulk renewal tracking, expiration lists, WhatsApp payment reminders via notifications. Core scenario solved |
| S09 | Pago coach Diego (20 clases × S/50, RxH) | 5 | **8** | **yaya-commissions** + yaya-expenses | 🆕 Commission tracking per provider, payout calculation. Retención on RxH still needs yaya-tax guidance |
| S10 | Límite diario Yape, 5 miembros pendientes | 6 | 7 | yaya-payments + **yaya-cash** | 🆕 yaya-cash can suggest alternative methods and track payment method splits |
| S11 | Promo 20% off trimestral (ROI calc) | 7 | 8 | yaya-analytics + **yaya-memberships** | 🆕 Membership plan pricing with discount modeling, revenue projection for 15 sign-ups |
| S12 | Plan corporativo 20 empleados, factura con RUC | 6 | 7 | yaya-sales + yaya-tax | Improved; corporate plan as custom membership plan |
| S13 | Boleta electrónica (Alejandra, membresía trimestral) | 7 | 7 | yaya-tax | Unchanged; boleta flow |
| S14 | Factura corporativa TechCorp, RUC, 20 membresías | 6 | 7 | yaya-tax | Improved with clearer IGV breakdown |
| S15 | Retención RxH para coach Diego | 5 | 6 | yaya-tax + **yaya-commissions** | 🆕 Commissions tracks payment; tax provides retención guidance |
| S16 | Resumen tributario mensual | 6 | 7 | yaya-tax + yaya-analytics | Better integration of payment method breakdown |
| S17 | Sustitución de coach (Diego→Camila) | 5 | 6 | yaya-appointments | Marginal improvement; still not perfect for group classes |
| S18 | Competencia interna, recordatorio 2 semanas antes | 7 | 7 | yaya-followup + cron | Unchanged |
| S19 | Agendar clases de prueba (3 leads) | 7 | **8** | yaya-appointments + **yaya-memberships** | 🆕 Free trial membership auto-creation for leads |
| S20 | Churn rate: perdidos vs nuevos | 4 | **9** | **yaya-memberships** | 🆕 Churn calculation, member lifecycle tracking, renewal rate, active vs expired vs cancelled |
| S21 | Horarios más populares y vacíos | 5 | **7** | **yaya-memberships** (attendance) + yaya-analytics | 🆕 Attendance patterns by time slot from membership check-ins |
| S22 | Revenue por tipo (membresías vs suplementos vs PT) | 6 | **8** | yaya-analytics + **yaya-memberships** | 🆕 Membership revenue isolated from product/PT sales |
| S23 | Lesión de miembro, seguro, responsabilidad | 5 | 5 | yaya-escalation | Unchanged; legal/insurance beyond scope |
| S24 | Coach se va y lleva clientes | 4 | 4 | yaya-escalation | Unchanged; HR/legal issue |
| S25 | Queja grupal: clases llenas, amenaza refund | 5 | 6 | yaya-escalation + **yaya-memberships** | 🆕 Can check class capacity data; resolution still needs human |
| S26 | Influencer canje: membresía gratis × contenido | 5 | 6 | yaya-memberships + yaya-analytics | Can model barter value but marketing ROI is advisory |
| S27 | Pago en dólares (gringo, trimestral) | 5 | 7 | forex-mcp + yaya-payments | 🆕 forex-mcp provides SBS exchange rate for USD→PEN conversion |
| S28 | Membresía familiar (4 personas, menores de edad) | 4 | **7** | **yaya-memberships** | 🆕 Family/group enrollment, plan customization. Minor authorization questions still advisory |
| S29 | Emergencia médica (miembro desmayado) | 8 | 8 | yaya-escalation | Safety-critical; correctly escalates |
| S30 | Suplemento adulterado (vómito, diarrea) | 6 | 6 | yaya-escalation + yaya-inventory | Unchanged; product safety alert |

### Fernando Díaz Summary

| Metric | Round 2 | Round 4 | Delta |
|--------|---------|---------|-------|
| **Average Score** | 5.6/10 | **7.2/10** | **+1.6** |
| **PMF %** | 35% | **68%** | **+33pp** |

**Top 3 Improvements from New Skills:**
1. **yaya-memberships** — The single most transformative skill. Covers Fernando's core business: enrollment, renewals, expiration tracking, churn rate, attendance, class packs, freeze/cancel. Turns 3-4/10 scores into 7-9/10 across 10+ scenarios.
2. **yaya-commissions** — Coach payout tracking, commission rates, advance payments, product sales commissions. Weekly payout summaries via WhatsApp. Solves the "pagar a los coaches" flow.
3. **yaya-cash** — Yape limit handling, cash vs digital reconciliation, payment method alternatives when Yape fails.

**Remaining Top 3 Gaps:**
1. **Group class scheduling** — yaya-appointments is 1:1 service-oriented; group class capacity management, WOD scheduling, and class templates need adaptation (S05: 6/10)
2. **HR/legal** — Coach departures, non-compete, labor law remain unaddressed (S24: 4/10)
3. **Community management** — WhatsApp group moderation, Instagram content strategy, event planning tools (S18: 7/10 but manual)

**PMF Verdict: 🟢 LAUNCH READY (68%)**

---

## 3. Jorge Castillo — Ferretería El Volcán (Arequipa)

**Round 2:** 6.2/10 avg, 32% PMF | **Business:** Hardware store, S/600K/yr, 6 employees, 2,000+ SKUs, B2B credit-heavy

### Scenario Re-Scoring (30 scenarios)

| # | Scenario | R2 | R4 | Key Skill(s) | Notes |
|---|----------|----|----|-------------|-------|
| S01 | Stock de cemento Pacasmayo | 8 | 8 | yaya-inventory | Unchanged; solid |
| S02 | Venta 50 bolsas cemento a contratista Ramírez | 7 | 8 | yaya-sales + yaya-inventory + yaya-crm | Improved integration |
| S03 | Cotización obra ingeniero Medina (200 cemento, 50 fierro...) | 6 | **10** | **yaya-quotes** | 🆕 EXACT scenario: multi-item cotización with line items, IGV, totals, WhatsApp delivery, follow-up. Designed for ferreterías |
| S04 | Actualización precio cemento (S/28→S/29.50) | 7 | **8** | yaya-inventory + **yaya-quotes** | 🆕 Price change alerts for pending quotes: "Tienes 3 cotizaciones con el precio anterior" |
| S05 | Pedido a Aceros Arequipa (varillas 3/8, 1/2, 5/8) | 5 | **9** | **yaya-suppliers** | 🆕 Full purchase order creation, WhatsApp delivery to supplier, delivery tracking, partial receipts |
| S06 | Cuánto le vendí a maestro Carlos Apaza este mes (umbral S/5,000) | 6 | 7 | yaya-crm + yaya-analytics | CRM purchase history query improved |
| S07 | Gasto gasolina S/150 | 6 | 7 | yaya-expenses | Improved with category auto-detection |
| S08 | Crédito al ingeniero Soto (ya debe S/2,400) | 4 | **9** | **yaya-credit** | 🆕 Credit limit check, outstanding balance, aging, credit approval workflow. EXACT scenario for ferreterías |
| S09 | Cobranza morosos >S/1,000, >15 días | 4 | **10** | **yaya-credit** | 🆕 Aging report with filters: amount > threshold, days overdue > X. Collection workflow with WhatsApp reminders |
| S10 | Pago parcial S/800 de S/2,200 (Condori) | 5 | **9** | **yaya-credit** | 🆕 Partial payment recording with FIFO allocation, updated remaining balance, payment history |
| S11 | Comparar precio fierro con competencia | 6 | **8** | **yaya-suppliers** + **yaya-quotes** | 🆕 Supplier price comparison + competitive pricing data from quotes |
| S12 | Descuento 8% en S/15,000 — margen analysis | 6 | **8** | **yaya-quotes** | 🆕 Margin protection: discount impact calculation, cost floor warning, volume discount tiers |
| S13 | Factura para Constructora Los Andes, RUC | 7 | 8 | yaya-tax | Improved with better invoice → order linking |
| S14 | Boleta para señora, DNI, S/350 pinturas | 7 | 7 | yaya-tax | Unchanged |
| S15 | Nota de crédito (10 bolsas cemento dañadas) | 7 | 7 | yaya-tax | Unchanged |
| S16 | Declaración mensual: total facturas + boletas | 7 | 7 | yaya-tax + yaya-analytics | Unchanged |
| S17 | Cálculo IGV (ventas S/50K, compras S/38K) | 7 | 8 | yaya-tax | Improved with better breakdown |
| S18 | Programar entrega 50 bolsas mañana 7am | 6 | 7 | yaya-appointments (adapted) | Marginal improvement |
| S19 | Recordatorio pago préstamo BCP viernes | 7 | 7 | yaya-followup | Unchanged |
| S20 | Entregas programadas esta semana | 5 | 7 | **yaya-suppliers** (delivery tracking) | 🆕 PO delivery schedule with expected dates |
| S21 | Reporte ventas febrero por categoría | 7 | 8 | yaya-analytics | Better category breakdown |
| S22 | Top 10 productos + 5 menos rotan | 7 | 8 | yaya-analytics + yaya-inventory | Improved with stock turnover data |
| S23 | Rentabilidad real: ventas - costos - gastos | 5 | **8** | yaya-expenses + yaya-analytics + **yaya-ledger** | 🆕 Complete P&L: revenue from ledger, expenses tracked, profit calculated |
| S24 | Proveedor entregó 20 varillas menos | 5 | **9** | **yaya-suppliers** | 🆕 Delivery receipt with quantity verification, discrepancy detection, complaint creation, auto-claim via WhatsApp |
| S25 | Contratista moroso S/8,500 hace 3 meses | 4 | **9** | **yaya-credit** | 🆕 Aging report, credit block recommendation, collection escalation workflow, bad debt classification |
| S26 | Error en factura (RUC equivocado) | 6 | 7 | yaya-tax | Marginal improvement; void/credit note flow |
| S27 | Venta en dólares (S/4,500 en USD) | 5 | **8** | forex-mcp + **yaya-quotes** | 🆕 Real-time USD/PEN conversion, USD quote support |
| S28 | Sin stock cemento Pacasmayo, alternativa | 7 | **8** | yaya-inventory + **yaya-suppliers** | 🆕 Supplier check for alternative sources with price comparison |
| S29 | Venta solvente a joven (restricción) | 7 | 7 | yaya-escalation | Unchanged; safety-critical, advisory |
| S30 | Accidente laboral almacenero | 8 | 8 | yaya-escalation | Unchanged; safety-critical |

### Jorge Castillo Summary

| Metric | Round 2 | Round 4 | Delta |
|--------|---------|---------|-------|
| **Average Score** | 6.2/10 | **8.0/10** | **+1.8** |
| **PMF %** | 32% | **78%** | **+46pp** |

**Top 3 Improvements from New Skills:**
1. **yaya-credit** — Transforms the ferretería's #1 pain point: B2B credit management. Credit limits, aging reports, FIFO payment allocation, collection workflows, credit blocks. Lifts 4-5/10 scores to 9-10/10 on 4 scenarios.
2. **yaya-quotes** — Purpose-built for ferreterías. Multi-item cotizaciones with IGV, volume discounts, margin protection, quote-to-order conversion, follow-up reminders. The skill was literally designed for Jorge's use case.
3. **yaya-suppliers** — Purchase orders to Aceros Arequipa via WhatsApp, delivery tracking, partial receipt handling, supplier complaint management, price comparison across vendors.

**Remaining Top 3 Gaps:**
1. **Delivery/logistics** — No route management for the repartidor, no delivery scheduling beyond basic reminders (S18: 7/10)
2. **Employee management** — No shift scheduling, attendance tracking, performance evaluation tools for 6 employees
3. **Licitaciones / public tender** — Large construction project quotes sometimes require formal tender processes not covered

**PMF Verdict: 🟢 LAUNCH READY (78%)**

---

## 4. María Flores — Bodega Doña Mary (Villa El Salvador)

**Round 2:** 5.4/10 avg, 25% PMF | **Business:** Corner store, S/72K/yr, solo operator, 100% informal

### Scenario Re-Scoring (28 scenarios)

| # | Scenario | R2 | R4 | Key Skill(s) | Notes |
|---|----------|----|----|-------------|-------|
| S01 | Registro de venta simple (arroz, aceite, fideos) | 5 | **8** | **yaya-ledger** | 🆕 EXACT scenario: quick sale logging by amount or items, no SKU catalog needed, running daily total. "Digital cuaderno" |
| S02 | Fiado vecina Carmen S/18, cobra viernes | 3 | **9** | yaya-fiados | 🆕 Tab creation, running balance, payment date tracking, cobro reminder. Cultural dignity preservation |
| S03 | Stock bajo: sin arroz ni azúcar, compra mayorista | 5 | 7 | yaya-inventory + **yaya-suppliers** | 🆕 Reorder list based on consumption, supplier contacts, estimated cost for market trip |
| S04 | Pedido distribuidor Coca-Cola | 5 | **8** | **yaya-suppliers** | 🆕 PO creation via WhatsApp to distributor with quantities and expected delivery |
| S05 | Ganancia del día (S/380 vendidos) | 4 | **8** | **yaya-ledger** + yaya-expenses | 🆕 Ledger tracks revenue, expenses deducted, profit shown. "¿Cuánto gané?" answered |
| S06 | Precio justo arroz (saco S/120, competencia S/4.80/kg) | 5 | **7** | **yaya-ledger** + yaya-analytics | 🆕 Margin calculation from cost to retail price, competitive positioning advice |
| S07 | Recargas celular (8 recargas, comisión 5%) | 4 | **7** | **yaya-ledger** | 🆕 Can log recargas as a revenue category with configurable commission rate |
| S08 | Fiados acumulados (Carmen S/18, Pedro S/45, Rosa S/30...) | 3 | **9** | yaya-fiados | 🆕 Full debtor listing, aggregate balance, aging by customer. "¿Cuánto me deben?" with names and amounts |
| S09 | Total Yape (S/45+S/22+S/15) + efectivo (S/200) | 5 | **9** | **yaya-cash** + **yaya-ledger** | 🆕 Cash + digital reconciliation, payment method breakdown, daily total with split |
| S10 | Arroz subió S/120→S/135, ¿subo precio? | 5 | **7** | yaya-analytics + **yaya-ledger** | 🆕 Margin impact calculation, competitive context, pricing recommendation |
| S11 | Préstamo S/2,000 para mercadería (ROI calc) | 4 | 6 | yaya-analytics + yaya-expenses | Improved but working capital/loan management still limited |
| S12 | Separar plata (S/850 caja - S/200 pasajes - S/150 luz) | 4 | **7** | **yaya-cash** | 🆕 Cash allocation tracking: business vs personal. Budget visibility |
| S13 | Formalización: ¿SUNAT va a cerrarme? | 5 | 6 | yaya-tax | Improved guidance but formalization remains advisory |
| S14 | ¿Qué es el NRUS? S/20/mes | 6 | 7 | yaya-tax | Better NRUS explanation with specific steps |
| S15 | Compras sin factura en mayorista | 5 | 5 | yaya-tax | Unchanged; informality is her reality |
| S16 | Yape y SUNAT (miedo a investigación) | 5 | 6 | yaya-tax | Better reassurance with actual thresholds |
| S17 | Lista para mayorista mañana (cuánta plata llevar) | 5 | **8** | **yaya-suppliers** | 🆕 Shopping list based on stock levels and sales patterns, estimated budget |
| S18 | Cobro fiado viernes (recordatorio) | 4 | **8** | yaya-fiados + yaya-followup | 🆕 Automatic cobro reminder on payment date, dignity-preserving message |
| S19 | Horario especial domingo (cartelito) | 5 | 5 | yaya-followup | Unchanged; simple reminder |
| S20 | ¿Qué día vendo más? | 5 | **7** | **yaya-ledger** + yaya-analytics | 🆕 Day-of-week analysis from ledger data; needs enough history |
| S21 | ¿Gaseosas o abarrotes se venden más? | 5 | **7** | **yaya-ledger** + yaya-analytics | 🆕 Category breakdown from ledger entries |
| S22 | Leche cortada (producto vencido) | 6 | 6 | yaya-escalation | Unchanged; customer complaint handling |
| S23 | Robo de gaseosas por chicos | 5 | 5 | yaya-escalation | Unchanged; loss prevention advisory |
| S24 | Tambo abrió a 2 cuadras (competencia) | 5 | 6 | yaya-analytics + yaya-crm | Marginal improvement; loyalty/differentiation advisory |
| S25 | Billete falso S/100 | 5 | 5 | yaya-escalation | Unchanged; advisory |
| S26 | Aceite con olor raro (adulterado) | 6 | 6 | yaya-escalation | Safety-critical; unchanged |
| S27 | Niño 15 años quiere comprar cerveza | 8 | 8 | yaya-escalation | Safety-critical; strong |
| S28 | Enviar dinero a mamá en Huancavelica | 3 | 4 | (outside scope) | Still beyond platform scope; basic Yape guidance |

### María Flores Summary

| Metric | Round 2 | Round 4 | Delta |
|--------|---------|---------|-------|
| **Average Score** | 5.4/10 | **6.8/10** | **+1.4** |
| **PMF %** | 25% | **61%** | **+36pp** |

**Top 3 Improvements from New Skills:**
1. **yaya-ledger** — The "digital cuaderno" María needed. Quick sale logging without SKUs, running daily totals, day-of-week analysis, category tracking. Replaces paper notebook with WhatsApp-native input.
2. **yaya-fiados** — Digitizes the cuaderno de fiados. Per-customer running balance, cobro reminders on payday, aging reports, dignity-preserving collection messages. Directly addresses her #1 pain point.
3. **yaya-cash** — Cash + Yape reconciliation, personal vs business separation, float management. Solves "todo junto" financial chaos.

**Remaining Top 3 Gaps:**
1. **Informality barrier** — María has no RUC, no formal inventory, no structured catalog. Platform requires some formalization to deliver full value (S15: 5/10)
2. **Working capital/loans** — No micro-lending guidance, loan ROI calculation, or financial planning tools (S11: 6/10)
3. **Physical security** — Theft prevention, counterfeit detection, neighborhood safety beyond advisory (S23-S25: 5/10)

**PMF Verdict: 🟡 ALMOST READY (61%)**

---

## 5. Valentina García — Valen Style (Bogotá, Colombia)

**Round 2:** 5.4/10 avg, 35% PMF | **Business:** Online fashion brand, COP $180M/yr, Instagram + WhatsApp

### Scenario Re-Scoring (30 scenarios)

| # | Scenario | R2 | R4 | Key Skill(s) | Notes |
|---|----------|----|----|-------------|-------|
| S01 | Onboarding (marca de ropa online) | 6 | 7 | yaya-onboarding | Improved with Colombia payment method support (Nequi/Daviplata) |
| S02 | Venta conjunto + crop top (Nequi + Daviplata) | 7 | 8 | yaya-sales + yaya-payments | Better COP formatting and Colombian payment flow |
| S03 | Inventario jeans talla 8 y 10 | 7 | 7 | yaya-inventory | Unchanged |
| S04 | Envíos Servientrega (3 paquetes, guías) | 4 | 5 | yaya-crm (tracking numbers stored) | Still no shipping/logistics integration. PERSISTENT GAP |
| S05 | Nueva colección blazers (3 colores, 15 c/u) | 7 | 7 | yaya-inventory | Unchanged |
| S06 | Sale 20% off crop tops (flash promo) | 6 | 7 | yaya-sales + yaya-notifications | Better with bulk notification to customer list |
| S07 | Verificar pago Nequi $89,000 | 7 | 8 | yaya-payments | Improved Nequi OCR support |
| S08 | Contraentrega Barranquilla $120K + envío | 5 | 6 | yaya-sales | COD still weakly covered; no courier reconciliation |
| S09 | Bundle 3 prendas con envío gratis + 10% off | 7 | 8 | yaya-sales + **yaya-quotes** | 🆕 Better discount calculation with margin visibility |
| S10 | Nequi vs Daviplata semanal | 7 | 8 | yaya-analytics + **yaya-cash** | 🆕 Payment method breakdown enhanced by cash skill |
| S11 | Devolución jean $89K a clienta Cali | 6 | 7 | yaya-returns | Improved with Nequi refund flow |
| S12 | Factura electrónica ($380K, cédula) | 2 | **8** | **yaya-tax-colombia** | 🆕 DIAN factura electrónica with CUFE, cédula/NIT validation, IVA 19% calculation. CRITICAL FIX |
| S13 | 25 ventas sin facturar (backlog) | 2 | **7** | **yaya-tax-colombia** | 🆕 Batch facturación, DIAN resolution number tracking, consecutive range management |
| S14 | IVA 19% incluido o aparte? | 3 | **9** | **yaya-tax-colombia** | 🆕 Clear explanation of IVA inclusion, exento vs excluido, RST regime obligations |
| S15 | Nota crédito (blazer devuelto → vestido) | 2 | **8** | **yaya-tax-colombia** | 🆕 DIAN nota crédito electrónica with CUFE, linked to original factura |
| S16 | Correo DIAN con inconsistencias | 1 | **7** | **yaya-tax-colombia** | 🆕 DIAN resolution tracking, regime guidance, safety disclaimer, escalation to contador |
| S17 | Producto más vendido | 8 | 8 | yaya-analytics | Unchanged |
| S18 | Ventas día por día esta semana | 8 | 8 | yaya-analytics | Unchanged |
| S19 | Costo real de un jean (tela + costura + empaque) | 6 | 7 | yaya-expenses | Improved COGS tracking |
| S20 | Ciudades top de ventas | 5 | 6 | yaya-analytics | Marginal; still needs shipping address aggregation |
| S21 | Meta mensual $18M (progreso) | 7 | 8 | yaya-analytics + **yaya-ledger** | 🆕 Better goal tracking with ledger data |
| S22 | Envío perdido Servientrega (clienta furiosa, Instagram blast) | 5 | 6 | yaya-escalation | No Servientrega integration; escalation handles handoff |
| S23 | Clienta quiere devolución 3 meses después (SIC) | 5 | 6 | yaya-returns + yaya-escalation | Improved with Colombian consumer protection context (SIC vs INDECOPI) |
| S24 | Vendí producto sin stock (oversell) | 6 | 7 | yaya-inventory + yaya-escalation | Better oversell prevention flow |
| S25 | Flujo de caja: necesito $2M, tengo $800K | 5 | **7** | **yaya-cash** + yaya-analytics | 🆕 Cash flow visibility, pending incoming (contraentrega), available vs committed |
| S26 | Mensaje lleno de emojis (12 ventas) | 6 | 7 | yaya-sales + **yaya-ledger** | 🆕 Bulk sale logging from informal text |
| S27 | Audio transcrito: envío + pedido de Pereira | 6 | 7 | yaya-voice + yaya-sales | Improved parsing |
| S28 | "La de ayer me confirmó?" (ambiguous) | 4 | 5 | yaya-crm + yaya-sales | Marginal; context resolution still challenging |
| S29 | Multi-topic: venta + factura + devolución + meta | 6 | **8** | yaya-sales + **yaya-tax-colombia** + yaya-returns + yaya-analytics | 🆕 Multi-skill parsing with Colombian tax support |
| S30 | 11pm: 8 pedidos, ¿cuáles confirmaron pago? | 6 | 7 | yaya-payments + yaya-sales | Better payment verification workflow |

### Valentina García Summary

| Metric | Round 2 | Round 4 | Delta |
|--------|---------|---------|-------|
| **Average Score** | 5.4/10 | **7.2/10** | **+1.8** |
| **PMF %** | 35% | **68%** | **+33pp** |

**Top 3 Improvements from New Skills:**
1. **yaya-tax-colombia** — THE critical blocker is removed. DIAN factura electrónica, NIT/cédula validation, IVA 19%, nota crédito, RST regime guidance, DIAN resolution tracking. Lifts 5 scenarios from 1-3/10 to 7-9/10.
2. **yaya-cash** — Cash flow visibility across Nequi/Daviplata/Bancolombia, payment method reconciliation, personal vs business separation.
3. **yaya-ledger** — Simple daily sales logging for an informal business that doesn't always use structured orders. Goal tracking integration.

**Remaining Top 3 Gaps:**
1. **Shipping/logistics** — No Servientrega or Inter Rapidísimo integration. Tracking, claims, COD reconciliation all manual. (S04: 5/10, S22: 6/10) 🚨 BIGGEST REMAINING GAP
2. **Production/COGS for fashion** — Tela + costura + empaque as manufacturing inputs need structured cost tracking beyond basic expenses (S19: 7/10)
3. **Instagram integration** — No DM sync, no content scheduling, no oversell prevention tied to Instagram catalog (S24: 7/10)

**PMF Verdict: 🟢 LAUNCH READY (68%)**

---

## 6. Carmen López — Salón Bella Cali (3 Sedes)

**Round 2:** 4.9/10 avg, 30% PMF | **Business:** Beauty salon chain, COP $450M/yr, 15 staff, 3 locations

### Scenario Re-Scoring (30 scenarios)

| # | Scenario | R2 | R4 | Key Skill(s) | Notes |
|---|----------|----|----|-------------|-------|
| S01 | Ventas del día por sede (3 sedes) | 6 | **8** | yaya-analytics + **yaya-ledger** + **yaya-cash** | 🆕 Multi-location daily sales logging, Nequi/efectivo/datáfono split, consolidated view |
| S02 | Agendar cita (Sra. Martínez, tinte+corte, Paola, Granada) | 8 | 9 | yaya-appointments | Improved with better multi-service duration handling |
| S03 | Citas mañana por sede | 7 | 8 | yaya-appointments | Better multi-location aggregation |
| S04 | Extensiones + tinte + keratina $1.17M, pago split | 7 | 8 | yaya-sales + yaya-payments | Better split payment handling (Nequi + efectivo) |
| S05 | Compra L'Oréal (20 tintes, 10 shampoos, 5 tratamientos) | 5 | **8** | **yaya-suppliers** | 🆕 Purchase order to L'Oréal distributor with items, quantities, prices. Delivery tracking |
| S06 | Comisiones: Paola $2.4M, Diana $1.8M, Sandra $2.1M, Leidy $1.5M (35%) | 4 | **9** | **yaya-commissions** | 🆕 EXACT scenario: per-stylist commission calculation at 35%, payout summary, advance deductions, WhatsApp notification |
| S07 | No-show cita $250K, tercera vez | 7 | 8 | yaya-appointments | Better no-show tracking and penalty enforcement |
| S08 | Nequi saturado sábado | 6 | **7** | yaya-payments + **yaya-cash** | 🆕 Cash alternative management, payment method redirection |
| S09 | Lista de precios: tintes +20%, mantener 55% margen | 6 | 7 | yaya-analytics | Margin math; systematic price update still manual |
| S10 | Paquete Novia ($650K→$550K) | 7 | 8 | yaya-appointments + yaya-sales | Better combo package pricing |
| S11 | Ventas de productos capilares al mes | 7 | 7 | yaya-analytics | Unchanged |
| S12 | Chipichape rentabilidad ($4.5M arriendo) | 5 | **8** | yaya-expenses + yaya-analytics + **yaya-ledger** | 🆕 Per-location P&L: revenue from ledger, rent + staff from expenses, profitability calculation |
| S13 | Factura evento corporativo, NIT, IVA 19% | 1 | **9** | **yaya-tax-colombia** | 🆕 DIAN factura electrónica, NIT validation with check digit, IVA 19% on beauty services. CRITICAL FIX |
| S14 | Nómina: contrato vs prestación, retefuente | 1 | **7** | **yaya-tax-colombia** + **yaya-commissions** | 🆕 Retefuente rates, prestación de servicios guidance, commission-based payout tracking |
| S15 | Declaración bimestral: consolidado 3 sedes, IVA | 1 | **8** | **yaya-tax-colombia** | 🆕 IVA bimestral: ventas por sede, IVA generado, IVA descontable (compras), IVA a pagar |
| S16 | Nequi sin factura (exposure) | 2 | **7** | **yaya-tax-colombia** | 🆕 Unfactured revenue analysis, DIAN compliance gap quantification |
| S17 | Turno Paola→Diana viernes | 6 | 7 | yaya-appointments + **yaya-commissions** | 🆕 Commission attribution transfers with schedule change |
| S18 | Día de la Madre (3 semanas antes, compras extra) | 7 | 7 | yaya-followup + cron | Unchanged; Colombian holiday calendar awareness |
| S19 | Capacitación balayage, primer domingo, $800K | 6 | 7 | yaya-appointments + yaya-expenses | Expense tracked as training investment |
| S20 | Comparativa sedes: ranking ventas + margen | 6 | **8** | yaya-analytics + yaya-expenses + **yaya-ledger** | 🆕 Multi-location P&L ranking with expense data |
| S21 | Servicio más pedido + ingreso por hora | 6 | **8** | yaya-analytics + yaya-appointments | Better service×duration analysis from appointment data |
| S22 | Retención de clientas por sede | 6 | 7 | yaya-crm + yaya-analytics | Marginal improvement; per-sede retention tagging |
| S23 | Diana renunció, va a abrir su propio salón | 4 | 5 | yaya-escalation | HR/legal still beyond scope |
| S24 | Reacción alérgica al tinte | 6 | 6 | yaya-escalation | Safety-critical; unchanged |
| S25 | Robo interno productos ($1.2M) | 4 | 5 | yaya-inventory + yaya-escalation | Marginal; inventory discrepancy detection improved |
| S26 | Clienta gringa: pago en USD, Zelle | 3 | **7** | forex-mcp + **yaya-tax-colombia** | 🆕 USD→COP conversion at TRM rate, invoice in COP with USD reference |
| S27 | Franquicia consulta (amiga de Pereira) | 3 | 3 | (outside scope) | Franchise consulting remains outside scope |
| S28 | Servicio a domicilio (pricing, logística) | 4 | 5 | yaya-appointments (adapted) | Home service booking partially supported; logistics gap |
| S29 | Secadora cortocircuito, chispas | 7 | 7 | yaya-escalation | Safety-critical; strong |
| S30 | Tinte L'Oréal posiblemente falsificado | 6 | 7 | yaya-escalation + **yaya-suppliers** | 🆕 Supplier complaint logging, product batch tracking |

### Carmen López Summary

| Metric | Round 2 | Round 4 | Delta |
|--------|---------|---------|-------|
| **Average Score** | 4.9/10 | **7.2/10** | **+2.3** |
| **PMF %** | 30% | **70%** | **+40pp** |

**Top 3 Improvements from New Skills:**
1. **yaya-tax-colombia** — Removes the #1 blocker. DIAN factura electrónica, NIT validation, IVA bimestral, retefuente on services, compliance gap analysis. Lifts 4 scenarios from 1-2/10 to 7-9/10.
2. **yaya-commissions** — Purpose-built for beauty salons. Per-stylist commission rates, weekly payout summaries, tip tracking, product sales commissions, advance deductions. Solves Carmen's weekly core task.
3. **yaya-suppliers** — L'Oréal/Wella purchase order management, delivery tracking, inventory replenishment across 3 sedes. Replaces informal purchasing.

**Remaining Top 3 Gaps:**
1. **HR/labor law** — Colombian labor law (contrato vs prestación de servicios), non-compete clauses, dismissal procedures (S23: 5/10)
2. **Multi-location operations** — Consolidated dashboard for 3 sedes, cross-location staff transfers, centralized inventory management (partially solved but not seamless)
3. **Franchise/scaling** — No franchise framework, licensing models, or expansion planning tools (S27: 3/10)

**PMF Verdict: 🟢 LAUNCH READY (70%)**

---

## Cross-Persona Summary Table

| # | Persona | Country | Business Type | R2 Score | R4 Score | Δ Score | R2 PMF | R4 PMF | Δ PMF | PMF Verdict | Top Skill Impact |
|---|---------|---------|--------------|----------|----------|---------|--------|--------|-------|-------------|------------------|
| 1 | Jorge Castillo | 🇵🇪 Peru | Ferretería (B2B) | 6.2 | **8.0** | **+1.8** | 32% | **78%** | **+46pp** | 🟢 LAUNCH READY | yaya-credit + yaya-quotes + yaya-suppliers |
| 2 | Doña Gladys | 🇵🇪 Peru | Pollería (Restaurant) | 6.1 | **7.9** | **+1.8** | 52% | **75%** | **+23pp** | 🟢 LAUNCH READY | yaya-restaurant + yaya-cash + yaya-suppliers |
| 3 | Carmen López | 🇨🇴 Colombia | Salón Belleza (Multi-sede) | 4.9 | **7.2** | **+2.3** | 30% | **70%** | **+40pp** | 🟢 LAUNCH READY | yaya-tax-colombia + yaya-commissions + yaya-suppliers |
| 4 | Fernando Díaz | 🇵🇪 Peru | CrossFit Gym | 5.6 | **7.2** | **+1.6** | 35% | **68%** | **+33pp** | 🟢 LAUNCH READY | yaya-memberships + yaya-commissions + yaya-cash |
| 5 | Valentina García | 🇨🇴 Colombia | Online Fashion | 5.4 | **7.2** | **+1.8** | 35% | **68%** | **+33pp** | 🟢 LAUNCH READY | yaya-tax-colombia + yaya-cash + yaya-ledger |
| 6 | María Flores | 🇵🇪 Peru | Bodega (Informal) | 5.4 | **6.8** | **+1.4** | 25% | **61%** | **+36pp** | 🟡 ALMOST READY | yaya-ledger + yaya-fiados + yaya-cash |

### Key Insights

**Average Improvement:**
- Score: +1.8/10 average (from 5.6 → 7.4)
- PMF: +35pp average (from 34.8% → 70%)

**Biggest Winner:** Jorge Castillo (ferretería) — +46pp PMF. The trifecta of yaya-credit + yaya-quotes + yaya-suppliers was purpose-built for his business type. From 32% (NEEDS WORK) to 78% (highest PMF in the cohort).

**Biggest Delta Score:** Carmen López (salon) — +2.3 points. yaya-tax-colombia alone lifted 4 scenarios from 1-2/10 to 7-9/10.

**Most Transformed Category:** Colombian tax compliance. Both Colombia personas went from 1-2/10 to 7-9/10 on DIAN/IVA scenarios — a 6-7 point swing per scenario.

**Universal Impact Skills:**
1. **yaya-cash** — Improved ALL 6 personas (cash is universal in LATAM)
2. **yaya-suppliers** — Improved 5/6 personas (everyone buys from suppliers)
3. **yaya-ledger** — Improved 4/6 personas (simple daily tracking)

**Remaining Platform-Wide Gaps:**
1. **Shipping/logistics** — No courier integration (Servientrega, Olva, Shalom). Affects Valentina critically, others partially
2. **HR/labor law** — Employee management, labor law guidance across countries. Affects Carmen and Fernando
3. **Franchise/scaling** — Growth beyond single/multi-location not supported

**PMF Distribution:**
- 🟢 LAUNCH READY (>65%): **5 of 6 personas** (Jorge 78%, Gladys 75%, Carmen 70%, Fernando 68%, Valentina 68%)
- 🟡 ALMOST READY (50-65%): **1 of 6** (María 61%)
- 🔴 NEEDS WORK (<50%): **0 of 6** ← Down from 4 in Round 2

**Round 2 → Round 4 PMF Verdict Changes:**
- Jorge: NEEDS WORK → LAUNCH READY
- Fernando: NEEDS WORK → LAUNCH READY
- Carmen: NEEDS WORK → LAUNCH READY
- Valentina: NEEDS WORK → LAUNCH READY
- María: NEEDS WORK → ALMOST READY
- Gladys: ALMOST READY → LAUNCH READY

The platform has crossed the PMF threshold for 5 out of 6 tested personas, with the 6th (María/bodega) only 4 percentage points away. The 9 new skills since Round 3 were exceptionally well-targeted: yaya-restaurant for pollerías, yaya-memberships for gyms, yaya-credit/yaya-quotes for ferreterías, yaya-tax-colombia for the Colombian market, yaya-commissions for service businesses, yaya-cash/yaya-ledger for universal cash management, and yaya-suppliers for the purchase side of every business.
