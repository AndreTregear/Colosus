# Round 3 Evaluation — Peru Remaining Personas (Post-P0 Features)

**Evaluator:** Yaya Platform Test Evaluator
**Date:** 2026-03-21
**Round:** 3 (post-P0 feature additions)

## New Features Evaluated

| # | Feature | Type | Key Capabilities |
|---|---------|------|-----------------|
| 1 | **yaya-expenses** | Skill | Chat-based expense logging, daily P&L, COGS, recurring expenses, receipt OCR, accountant exports, margin alerts |
| 2 | **forex-mcp** | MCP Server | Real-time exchange rates (SBS/BCR/fallback), convert, historical rates, Peru-specific sources |
| 3 | **yaya-fiados** | Skill | Credit tab tracking, partial payments, aging reports, culturally-sensitive cobro reminders, CRM integration |
| 4 | **crm-mcp** | MCP Server | Full CRM: contacts, interactions, deals, segmentation (vip/new/dormant/at_risk/debtors), customer stats/history |
| 5 | **whatsapp-mcp** | MCP Server | Outbound messaging: send_text, send_template, send_bulk, send_payment_link, schedule_message, send_reminder |

Also: Unified **schema.sql** with contacts, interactions, deals, appointments, expenses, fiados, payment_validations tables.

---

# 1. Miguel Torres — Restaurante Inti Raymi (Cusco)

**Round 2 Score: 5.6/10 | PMF: 25%**

## Scenario-by-Scenario Re-evaluation

### Scenario 1: Consulta de reservas
> "Yaya, ¿cuántas reservas tengo para hoy? 🍽️ Necesito saber si preparo para 40 o 60 personas"

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 7 | 7 | No change — still appointments-based, not restaurant reservations |
| Accuracy | 6 | 6 | No change |
| Completeness | 5 | 5 | No change |
| **R3 Avg** | — | **6.0** | |

**CHANGED?** No | **New feature helped?** None — reservation management wasn't addressed by P0 features.

---

### Scenario 2: Registro de compra de insumos
> "Compré en San Pedro: 8kg de pescado lenguado a S/45 el kilo, 5kg de pulpo a S/38, limones S/25 el saco..."

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 6 | **9** | yaya-expenses handles multi-line expense logging in natural Spanish perfectly |
| Accuracy | 5 | **8** | Parses amounts, categories (materiales/inventario), payment method (efectivo) |
| Completeness | 4 | **8** | Categories, running P&L, confirmation flow, receipt photo support |
| **R3 Avg** | — | **8.3** | |

**CHANGED?** Yes | **New feature helped?** yaya-expenses (chat-based expense logging, auto-categorization, daily P&L snapshot)

---

### Scenario 3: Registro de ventas del día
> "Ventas de hoy almuerzo: S/3,200 en boletas, USD 450 en tarjeta de turistas, EUR 120 efectivo."

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 6 | **8** | yaya-analytics + forex-mcp can now convert multi-currency sales accurately |
| Accuracy | 5 | **8** | forex-mcp provides real-time SBS rates for USD/PEN and EUR/PEN conversion |
| Completeness | 4 | **7** | Can show all amounts converted to soles, daily total. Still lacks POS integration |
| **R3 Avg** | — | **7.7** | |

**CHANGED?** Yes | **New feature helped?** forex-mcp (real-time conversion of USD and EUR to PEN via SBS rates)

---

### Scenario 4: Pedido de delivery
> "Pedido delivery: 2 ceviches clásicos, 1 lomo saltado... Cliente: María, cel 984567890. Paga Yape"

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 7 | **8** | crm-mcp creates/links customer, whatsapp-mcp can send order confirmation |
| Accuracy | 7 | **8** | CRM contact creation + interaction logging |
| Completeness | 5 | **7** | Customer saved to CRM, order confirmation via WhatsApp, payment link possible |
| **R3 Avg** | — | **7.7** | |

**CHANGED?** Yes | **New feature helped?** crm-mcp (customer record), whatsapp-mcp (order confirmation to customer)

---

### Scenario 5: Actualización del menú
> "Hoy no hay lenguado, llegó corvina nomás. Cambia el ceviche de lenguado por corvina..."

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 7 | 7 | Still handled by yaya-inventory |
| Accuracy | 7 | 7 | No change |
| Completeness | 5 | 5 | No change — still no menu management system |
| **R3 Avg** | — | **6.3** | |

**CHANGED?** No | **New feature helped?** None

---

### Scenario 6: Consulta de plato (turista vegano/gluten-free)
> "Un turista americano pregunta si tenemos opciones veganas y sin gluten..."

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 6 | 6 | No change — needs menu/allergen database |
| Completeness | 4 | 4 | No change |
| **R3 Avg** | — | **5.3** | |

**CHANGED?** No | **New feature helped?** None

---

### Scenario 7: Registro de propinas
> "Hoy las propinas fueron S/280. Reparte: 40% cocina, 40% mozos, 20% bar."

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 5 | **7** | yaya-expenses can log propinas as an income/expense category; calculation is basic LLM math |
| Completeness | 4 | **6** | Can record the distribution, track as expense, but no formal tip pool management |
| **R3 Avg** | — | **6.5** | |

**CHANGED?** Yes | **New feature helped?** yaya-expenses (logging/tracking tip distributions)

---

### Scenario 8: Multi-moneda — cálculo EUR→PEN
> "Un grupo de 8 franceses gastaron EUR 320. ¿A cuánto está el euro hoy?"

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 4 | **9** | forex-mcp: get_rate EUR/PEN, convert 320 EUR → PEN. SBS official rates |
| Accuracy | 3 | **9** | Real-time SBS Peru rates with BCR and exchangerate-api fallback |
| Completeness | 3 | **9** | Shows rate, source, converted amount, WhatsApp-formatted output |
| **R3 Avg** | — | **9.0** | |

**CHANGED?** Yes | **New feature helped?** forex-mcp (get_rate, convert — EUR/PEN via SBS Peru)

---

### Scenario 9: Ticket promedio
> "¿Cuál es mi ticket promedio por persona este mes?"

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 7 | 7 | yaya-analytics, no change |
| **R3 Avg** | — | **6.7** | |

**CHANGED?** No | **New feature helped?** None

---

### Scenario 10: Ajuste de precios — food cost margin
> "El pescado subió 20%. Necesito subir precios del ceviche... ¿a cuánto para mantener 65% de margen?"

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 5 | **8** | yaya-expenses COGS feature: records cost per item, calculates margin, suggests pricing |
| Accuracy | 5 | **8** | COGS tracking directly addresses this: cost S/X, sell at S/Y, margin Z% |
| Completeness | 4 | **8** | Shows current margin, new cost impact, recommended price. Alerts when margin drops |
| **R3 Avg** | — | **8.0** | |

**CHANGED?** Yes | **New feature helped?** yaya-expenses (COGS tracking, profit margin calculation)

---

### Scenario 11: Pago en dólares — cambio
> "Turista quiere pagar su cuenta de S/185 en dólares. ¿Cuánto le cobro en USD?"

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 4 | **9** | forex-mcp: convert S/185 PEN → USD, also calculates change from USD 50 |
| Accuracy | 3 | **9** | SBS official rates, shows both conversion and change calculation |
| **R3 Avg** | — | **9.0** | |

**CHANGED?** Yes | **New feature helped?** forex-mcp (convert tool)

---

### Scenario 12: Cuenta de grupo con división
> "Mesa de 12 personas, cuenta total S/1,450. Dividir en 4 partes... 2 Yape, 1 Visa, 1 efectivo en dólares."

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 5 | **8** | forex-mcp for dollar portion, yaya-expenses for multi-method tracking |
| Accuracy | 4 | **8** | Accurate USD conversion, split calculation |
| Completeness | 3 | **7** | Can split, convert, and track payment methods. Still no POS integration |
| **R3 Avg** | — | **7.7** | |

**CHANGED?** Yes | **New feature helped?** forex-mcp (USD conversion), yaya-expenses (payment method tracking)

---

### Scenario 13: Factura a agencia de turismo
> "Factura para Cusco Travel Adventures SAC, RUC 20567890234..."

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 7 | **8** | crm-mcp can store agency as contact, log interaction |
| Completeness | 6 | **7** | CRM records the business relationship |
| **R3 Avg** | — | **7.3** | |

**CHANGED?** Yes (marginal) | **New feature helped?** crm-mcp (contact/interaction logging for B2B customers)

---

### Scenario 14: Boletas del día
> "Cuántas boletas emití hoy y por cuánto total?"

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 7 | 7 | Still yaya-tax / yaya-analytics |
| **R3 Avg** | — | **6.7** | |

**CHANGED?** No | **New feature helped?** None

---

### Scenario 15: Resumen para SUNAT — multi-moneda
> "Dame resumen de ventas de marzo... separa soles, dólares convertidos, euros convertidos"

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 5 | **8** | forex-mcp provides historical rates for conversion; yaya-expenses tracks all amounts |
| Accuracy | 4 | **8** | Can use get_historical_rate for daily conversions throughout the month |
| Completeness | 4 | **7** | Multi-currency conversion + expense aggregation. Still needs manual SUNAT filing |
| **R3 Avg** | — | **7.7** | |

**CHANGED?** Yes | **New feature helped?** forex-mcp (historical rates), yaya-expenses (aggregated expense tracking)

---

### Scenario 16: Factura en dólares
> "La agencia Gringo Tours me pide factura en dólares por USD 850. ¿Puedo emitir en USD?"

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 6 | **7** | forex-mcp provides official SUNAT-compatible exchange rates |
| **R3 Avg** | — | **7.0** | |

**CHANGED?** Yes (marginal) | **New feature helped?** forex-mcp (official SBS rate for SUNAT purposes)

---

### Scenario 17: Reserva de grupo
> "Reserva para mañana: grupo de 20 personas de Peru Hop..."

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 7 | **8** | crm-mcp logs the agency, whatsapp-mcp can send confirmation |
| Completeness | 5 | **7** | CRM stores agency relationship; WhatsApp confirms reservation |
| **R3 Avg** | — | **7.3** | |

**CHANGED?** Yes | **New feature helped?** crm-mcp, whatsapp-mcp (confirmation message)

---

### Scenario 18: Turno de personal
> "El mozo Carlos no viene mañana. ¿Quién lo puede cubrir?"

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 4 | 4 | No HR/scheduling feature added |
| **R3 Avg** | — | **4.3** | |

**CHANGED?** No | **New feature helped?** None

---

### Scenario 19: Evento especial — recordatorio
> "Para Fiestas Patrias quiero armar un menú especial. Recuérdame 2 semanas antes."

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 6 | **7** | whatsapp-mcp: schedule_message for reminder |
| **R3 Avg** | — | **6.7** | |

**CHANGED?** Yes (marginal) | **New feature helped?** whatsapp-mcp (schedule_message)

---

### Scenario 20: Programar pedido de pescado
> "Agenda pedido de pescado para que salga de Lima el miércoles por la noche."

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 5 | **6** | whatsapp-mcp can schedule reminders; crm-mcp stores supplier contacts |
| **R3 Avg** | — | **6.0** | |

**CHANGED?** Yes (marginal) | **New feature helped?** whatsapp-mcp, crm-mcp

---

### Scenario 21: Temporada alta vs baja
> "Compara mis ventas de julio vs enero."

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 7 | 7 | yaya-analytics, no change |
| **R3 Avg** | — | **6.7** | |

**CHANGED?** No | **New feature helped?** None

---

### Scenario 22: Food cost
> "¿Cuál es mi food cost este mes? ¿Estoy en 30-35%?"

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 4 | **8** | yaya-expenses: COGS tracking + P&L = food cost percentage directly |
| Accuracy | 3 | **8** | Revenue from analytics, expenses from yaya-expenses → food cost % |
| Completeness | 3 | **8** | Full P&L with category breakdown, comparison to target range |
| **R3 Avg** | — | **8.0** | |

**CHANGED?** Yes | **New feature helped?** yaya-expenses (COGS, P&L, category breakdown — this is THE feature for restaurants)

---

### Scenario 23: Platos más populares y margen
> "Top 5 platos más pedidos del mes y su margen de ganancia."

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 6 | **8** | yaya-expenses COGS per product + yaya-analytics sales data = margin per dish |
| Accuracy | 5 | **7** | Can calculate margin if COGS is set up per menu item |
| **R3 Avg** | — | **7.3** | |

**CHANGED?** Yes | **New feature helped?** yaya-expenses (COGS per product for margin calculation)

---

### Scenario 24: Reseña negativa grave (TripAdvisor)
> "Me dejaron 1 estrella en TripAdvisor diciendo que encontraron un pelo en el ceviche 😰"

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 6 | 6 | Still yaya-escalation guidance only, no TripAdvisor API |
| **R3 Avg** | — | **6.0** | |

**CHANGED?** No | **New feature helped?** None

---

### Scenario 25-26: Safety-critical (DIGESA, intoxicación)
**CHANGED?** No | These are escalation/safety scenarios, handled by yaya-escalation. No change.
**R3 Avg:** ~6.0, ~7.0

---

### Scenario 27: Turista con yenes
> "Un turista japonés solo tiene yenes. Son ¥15,000. ¿A cuánto equivale en soles?"

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 3 | **9** | forex-mcp supports JPY! convert ¥15,000 JPY → PEN |
| Accuracy | 2 | **9** | Real-time rate via exchangerate-api (JPY not on SBS but fallback works) |
| **R3 Avg** | — | **9.0** | |

**CHANGED?** Yes | **New feature helped?** forex-mcp (JPY/PEN conversion — JPY is in SUPPORTED_CURRENCIES)

---

### Scenarios 28-30: Safety-critical (alergia, quemadura, corte de luz)
**CHANGED?** No | These are handled by yaya-escalation. No P0 features apply.
**R3 Avg:** ~7.0-8.0 (escalation works well for safety)

---

## Miguel Torres — Summary

| Metric | Round 2 | Round 3 | Delta |
|--------|---------|---------|-------|
| **Overall Score** | 5.6/10 | **7.4/10** | +1.8 |
| **PMF %** | 25% | **55%** | +30 pts |

**Most Impactful Features:**
1. 🥇 **forex-mcp** — Transforms multi-currency scenarios (8, 11, 12, 15, 27). Restaurant with EUR/USD/JPY tourists goes from broken to excellent.
2. 🥈 **yaya-expenses** — COGS + food cost + P&L (scenarios 2, 10, 22, 23). THE feature for restaurants.
3. 🥉 **crm-mcp** — Customer/agency contact management (4, 13, 17, 20)

**Remaining Gaps:**
- No restaurant-specific reservation system (party size, covers, table management)
- No TripAdvisor/Google Maps integration for reviews or external reservations
- No HR/staff scheduling
- No menu management with allergen tracking
- No POS integration

---

# 2. Lucía Chen — Electrónica Chen Importaciones (Lima)

**Round 2 Score: 5.6/10 | PMF: 22%**

## Scenario-by-Scenario Re-evaluation

### Scenario 1: Consulta de stock
> "cuantos audifonos bluetooth tengo? los negros y los blancos por separado 👍"

**CHANGED?** No | yaya-inventory, no change | **R3 Avg: 7.0**

---

### Scenario 2: Pedido mayorista
> "cliente de huancayo quiere 200 cargadores tipo c, 150 cables usb 2mts..."

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 7 | **8** | crm-mcp stores customer (Huancayo), logs deal/interaction |
| Completeness | 5 | **7** | CRM tracks the relationship, deal pipeline |
| **R3 Avg** | — | **7.5** | |

**CHANGED?** Yes | **New feature helped?** crm-mcp (contact + deal tracking)

---

### Scenario 3: Actualización de lista de precios
> "sube precio de audifonos inalambricos a S/18 x mayor... tipo de cambio subio"

**CHANGED?** No | yaya-inventory handles price updates | **R3 Avg: 6.5**

---

### Scenario 4: Registro de venta al por mayor
> "venta hoy: cliente tienda Electro Sur Cusco, 500 cables usb variados..."

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 7 | **8** | crm-mcp logs the interaction/purchase, tracks customer |
| **R3 Avg** | — | **7.5** | |

**CHANGED?** Yes | **New feature helped?** crm-mcp (customer + interaction logging)

---

### Scenario 5: Despacho a provincia
> "despacha pedido a arequipa x olva courier. 3 cajas..."

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 5 | **6** | crm-mcp stores customer address; whatsapp-mcp can send dispatch notification |
| **R3 Avg** | — | **6.0** | |

**CHANGED?** Yes (marginal) | **New feature helped?** crm-mcp, whatsapp-mcp

---

### Scenario 6: Consulta de proveedor (contenedor Shenzhen)
> "que tengo pendiente de recibir del ultimo pedido a shenzhen?"

**CHANGED?** No | Needs supply chain/procurement tracking, not addressed | **R3 Avg: 4.0**

---

### Scenario 7: Registro de ventas del día
> "ventas hoy en tienda: S/3,200 efectivo, S/1,800 yape, S/4,500 transferencia"

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 7 | **8** | yaya-expenses tracks payment method breakdown (efectivo/yape/transferencia) |
| Completeness | 5 | **7** | Payment method tracking, daily P&L snapshot |
| **R3 Avg** | — | **7.5** | |

**CHANGED?** Yes | **New feature helped?** yaya-expenses (payment method tracking, daily summary)

---

### Scenario 8: Cálculo con tipo de cambio — USD→PEN + margin
> "mi proveedor me cobra USD 2,200 x el lote de parlantes. a cuanto esta el dolar hoy?"

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 4 | **9** | forex-mcp: get_rate USD/PEN, convert $2,200 → PEN, then margin calc |
| Accuracy | 3 | **9** | SBS official rates, accurate conversion |
| Completeness | 3 | **9** | Rate + conversion + per-unit cost (S/4,400÷500=S/8.80) + 30% markup = S/11.44 |
| **R3 Avg** | — | **9.0** | |

**CHANGED?** Yes | **New feature helped?** forex-mcp (get_rate, convert — USD/PEN)

---

### Scenario 9: Crédito a cliente provinciano
> "tienda de juliaca me pide S/5,000 en mercaderia a credito 15 dias. ya me debe S/3,200..."

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 3 | **9** | yaya-fiados: tracks credit tabs, existing balance, credit limits |
| Accuracy | 2 | **9** | Shows existing debt, calculates total exposure, warns on credit limit |
| Completeness | 2 | **9** | Full ledger: existing S/3,200 + new S/5,000 = S/8,200 total exposure. Payment history. Credit limit recommendation |
| **R3 Avg** | — | **9.0** | |

**CHANGED?** Yes | **New feature helped?** yaya-fiados (credit tab tracking — THIS is Lucía's killer feature)

---

### Scenario 10: Cobranza masiva
> "dame lista de todos los que me deben. ordenados de mayor a menor. quiero cobrar hoy 💰"

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 3 | **9** | yaya-fiados: debtor listing sorted by amount/age. crm-mcp: segment_customers "debtors" |
| Accuracy | 2 | **9** | Full list with amounts, aging, phone numbers |
| Completeness | 2 | **9** | Can generate cobro reminders via whatsapp-mcp for each debtor |
| **R3 Avg** | — | **9.0** | |

**CHANGED?** Yes | **New feature helped?** yaya-fiados (debtor list), whatsapp-mcp (send cobro reminders in bulk), crm-mcp (debtor segment)

---

### Scenario 11: Margen por producto
> "cuanto margen tengo en audifonos bluetooth? costo importacion S/8, vendo mayorista S/15..."

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 6 | **8** | yaya-expenses COGS feature tracks per-item cost and margin |
| Accuracy | 5 | **8** | Can include import cost, calculate wholesale vs retail margins |
| **R3 Avg** | — | **8.0** | |

**CHANGED?** Yes | **New feature helped?** yaya-expenses (COGS tracking)

---

### Scenario 12: Descuento por volumen
> "cliente quiere 1000 cargadores. precio normal S/10. me pide a S/8. costo S/6.50."

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 6 | **8** | yaya-expenses COGS can model the margin at different price points |
| **R3 Avg** | — | **7.5** | |

**CHANGED?** Yes | **New feature helped?** yaya-expenses (margin calculation)

---

### Scenario 13: Facturación masiva
> "necesito emitir 8 facturas hoy..."

**CHANGED?** No | yaya-tax handles invoicing | **R3 Avg: 6.5**

---

### Scenario 14: Guía de remisión
> "guia de remision para envio a tacna..."

**CHANGED?** No | Needs dispatch/logistics module | **R3 Avg: 5.0**

---

### Scenario 15: Detracción
> "una venta de S/8,500 con factura. tengo que aplicar detraccion?"

**CHANGED?** No | yaya-tax | **R3 Avg: 6.0**

---

### Scenario 16: Liquidación de importación
> "llego el contenedor de china. valor CIF USD 15,000..."

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 4 | **6** | forex-mcp can convert CIF value. But customs calc still needs manual knowledge |
| **R3 Avg** | — | **5.5** | |

**CHANGED?** Yes (marginal) | **New feature helped?** forex-mcp (USD/PEN conversion for customs valuation)

---

### Scenario 17: Nota de crédito
> "cliente devolvio 50 cargadores defectuosos..."

**CHANGED?** No | yaya-returns + yaya-tax | **R3 Avg: 6.0**

---

### Scenario 18: Seguimiento de importación
> "cuando llega el contenedor que salio de shenzhen?"

**CHANGED?** No | No supply chain tracking | **R3 Avg: 3.5**

---

### Scenario 19: Recordatorio de pagos
> "recordame mañana pagar USD 3,500 al proveedor..."

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 6 | **8** | whatsapp-mcp: schedule_message for payment reminder |
| Completeness | 5 | **7** | Can schedule timed reminders |
| **R3 Avg** | — | **7.5** | |

**CHANGED?** Yes | **New feature helped?** whatsapp-mcp (schedule_message)

---

### Scenario 20: Programar envío
> "programa despacho para el lunes: pedido huancayo 3 cajas..."

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 5 | **6** | whatsapp-mcp can send dispatch notifications to customers |
| **R3 Avg** | — | **6.0** | |

**CHANGED?** Yes (marginal) | **New feature helped?** whatsapp-mcp

---

### Scenario 21: Top productos
> "cuales son mis 10 productos mas vendidos del mes?"

**CHANGED?** No | yaya-analytics | **R3 Avg: 6.5**

---

### Scenario 22: Comparativa mensual
> "como van las ventas de marzo vs febrero?"

**CHANGED?** No | yaya-analytics | **R3 Avg: 6.5**

---

### Scenario 23: Análisis de clientes
> "quienes son mis 5 mejores clientes del trimestre?"

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 4 | **8** | crm-mcp: segment_customers "vip", get_customer_stats for lifetime value |
| Accuracy | 3 | **8** | Full purchase history, lifetime value, interaction count |
| Completeness | 3 | **8** | Ranked by spending, with purchase frequency and recency |
| **R3 Avg** | — | **8.0** | |

**CHANGED?** Yes | **New feature helped?** crm-mcp (VIP segmentation, customer stats, lifetime value)

---

### Scenario 24: Mercadería retenida en aduana
> "sunat retuvo mi contenedor en el callao..."

**CHANGED?** No | Escalation scenario | **R3 Avg: 5.5**

---

### Scenario 25: Cheque sin fondos
> "el cheque de S/6,000 del cliente de chiclayo reboto!!"

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 4 | **6** | crm-mcp logs the incident, yaya-fiados can convert to tracked debt |
| **R3 Avg** | — | **6.0** | |

**CHANGED?** Yes (marginal) | **New feature helped?** crm-mcp (interaction logging), yaya-fiados (debt tracking)

---

### Scenario 26: Problema con proveedor chino
> "200 audifonos que no funcionan. ya le pagué USD 1,600."

**CHANGED?** No | Escalation/legal | **R3 Avg: 5.5**

---

### Scenario 27: Comunicación bilingüe (mandarín)
> "mi tía de guangzhou me pregunta 这批货什么时候到?... tipo de cambio de hoy"

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 5 | **7** | forex-mcp for exchange rate calc. LLM handles multilingual |
| **R3 Avg** | — | **6.5** | |

**CHANGED?** Yes (marginal) | **New feature helped?** forex-mcp

---

### Scenario 28: Venta en dólares a cliente local
> "cliente quiere pagar en dolares, son S/7,200. a cuanto le cobro en USD?"

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 4 | **9** | forex-mcp: convert S/7,200 PEN → USD at SBS rate |
| **R3 Avg** | — | **9.0** | |

**CHANGED?** Yes | **New feature helped?** forex-mcp (convert)

---

### Scenario 29-30: Safety-critical (falsificación, robo)
**CHANGED?** No | Escalation scenarios | **R3 Avg:** ~6.5

---

### Scenario 31: Múltiples monedas en un día (PEN + USD + CNY)
> "hoy recibi pagos en soles, dolares y un cliente me pago con yuan..."

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 3 | **9** | forex-mcp supports CNY! Convert USD→PEN, CNY→PEN, sum total |
| Accuracy | 2 | **9** | All three currencies supported (PEN, USD, CNY in SUPPORTED_CURRENCIES) |
| **R3 Avg** | — | **9.0** | |

**CHANGED?** Yes | **New feature helped?** forex-mcp (multi-currency including CNY/yuan)

---

### Scenario 32: Stock masivo — múltiples variantes
> "llegaron 2000 protectores de pantalla..."

**CHANGED?** No | yaya-inventory | **R3 Avg: 6.0**

---

## Lucía Chen — Summary

| Metric | Round 2 | Round 3 | Delta |
|--------|---------|---------|-------|
| **Overall Score** | 5.6/10 | **7.3/10** | +1.7 |
| **PMF %** | 22% | **52%** | +30 pts |

**Most Impactful Features:**
1. 🥇 **yaya-fiados** — Provincial client credit tracking (scenarios 9, 10). Her #1 pain point was clients who don't pay. This directly solves it.
2. 🥈 **forex-mcp** — Multi-currency import/export calculations (8, 28, 31). Critical for importers.
3. 🥉 **crm-mcp** — Customer segmentation, VIP identification (23, 2, 4). Helps manage 50+ daily WhatsApp contacts.

**Remaining Gaps:**
- No supply chain / import tracking (container tracking, customs status)
- No guía de remisión generation
- No batch invoicing automation
- No WeChat/Chinese payment integration
- No product variant management (500+ SKUs with colors/models)
- No Olva/Shalom courier API integration

---

# 3. Patricia Vega — Botica Santa Rosa (Trujillo)

**Round 2 Score: 5.0/10 | PMF: 35%**

## Scenario-by-Scenario Re-evaluation

### Scenario 1: Consulta de stock (Amoxicilina)
> "¿cuántas cajas de Amoxicilina 500mg me quedan?"

**CHANGED?** No | yaya-inventory | **R3 Avg: 7.0**

---

### Scenario 2: Registro de venta
> "Venta: Paracetamol 500mg x 20 S/3.50, Omeprazol 20mg x 10 S/8..."

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 7 | **8** | crm-mcp can log sale as interaction, track customer if identified |
| **R3 Avg** | — | **7.5** | |

**CHANGED?** Yes (marginal) | **New feature helped?** crm-mcp (sale interaction logging)

---

### Scenario 3: Pedido a distribuidora
> "Necesito hacer pedido a Química Suiza..."

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 5 | **6** | yaya-expenses can track the purchase cost; crm-mcp stores supplier as contact |
| **R3 Avg** | — | **6.0** | |

**CHANGED?** Yes (marginal) | **New feature helped?** yaya-expenses, crm-mcp

---

### Scenario 4: Delivery de medicamentos (insulina + cadena de frío)
> "Señora pide delivery: insulina NPH... ¿La insulina necesita cooler para el envío?"

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 6 | **7** | crm-mcp stores customer; whatsapp-mcp sends delivery confirmation |
| **R3 Avg** | — | **7.0** | |

**CHANGED?** Yes | **New feature helped?** crm-mcp, whatsapp-mcp (delivery confirmation)

---

### Scenario 5: Vencimiento próximo
> "¿Qué productos se vencen en los próximos 2 meses?"

**CHANGED?** No | yaya-inventory | **R3 Avg: 6.5**

---

### Scenario 6: Consulta de precio (tratamiento H. Pylori)
> "Dame el precio de los 3 medicamentos juntos con genérico y con marca."

**CHANGED?** No | yaya-inventory/sales | **R3 Avg: 6.5**

---

### Scenario 7: Registro de temperatura
> "Temperatura de refrigeradora hoy 8am: 4.2°C. ¿Está en rango?"

**CHANGED?** No | Specialized pharma compliance, not addressed | **R3 Avg: 4.0**

---

### Scenario 8: Comparación con cadenas (Inkafarma pricing)
> "Inkafarma tiene la Atorvastatina 20mg a S/12. Yo la vendo a S/18..."

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 5 | **7** | yaya-expenses COGS: knows purchase cost, can calculate margin at different price points |
| **R3 Avg** | — | **7.0** | |

**CHANGED?** Yes | **New feature helped?** yaya-expenses (margin analysis at competitive price points)

---

### Scenario 9: Cobranza EPS
> "¿cuánto me debe EPS Pacífico por las recetas de febrero?"

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 3 | **6** | yaya-fiados can track EPS as a "debtor" (institutional credit tab). crm-mcp stores EPS as contact |
| Accuracy | 2 | **5** | Fiados is designed for individual customers, not institutional insurance claims. Partial fit |
| Completeness | 2 | **5** | Can track amounts owed by EPS, but no insurance claim workflow |
| **R3 Avg** | — | **5.5** | |

**CHANGED?** Yes | **New feature helped?** yaya-fiados (partial — EPS as institutional debtor), crm-mcp

---

### Scenario 10: Venta con seguro
> "Paciente con seguro Rímac, receta médica..."

**CHANGED?** No | Needs insurance integration | **R3 Avg: 3.5**

---

### Scenario 11: Compra con crédito
> "Distribuidora DECO me ofrece crédito a 45 días por S/8,000..."

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 4 | **7** | yaya-expenses tracks purchase amounts; yaya-analytics shows monthly sales velocity for those products |
| **R3 Avg** | — | **6.5** | |

**CHANGED?** Yes | **New feature helped?** yaya-expenses (cost tracking), yaya-analytics

---

### Scenario 12: Promoción 2x1 vitaminas próximas a vencer
> "Quiero hacer oferta 2x1 en vitaminas que se vencen en abril..."

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 5 | **7** | yaya-expenses COGS: calculate recovery at 2x1 price. whatsapp-mcp: send promo to customers |
| Completeness | 4 | **7** | Can calculate loss/recovery AND send notification to relevant customers via whatsapp-mcp + crm-mcp segments |
| **R3 Avg** | — | **7.0** | |

**CHANGED?** Yes | **New feature helped?** yaya-expenses (COGS recovery calc), whatsapp-mcp (send_bulk promo), crm-mcp (customer segmentation)

---

### Scenario 13: Factura para clínica
> "Factura para Clínica San Andrés SAC, RUC 20456789234..."

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 7 | **8** | crm-mcp stores clinic as B2B contact, logs interaction |
| **R3 Avg** | — | **7.5** | |

**CHANGED?** Yes (marginal) | **New feature helped?** crm-mcp

---

### Scenario 14: Informe DIGEMID (controlados)
> "Necesito preparar informe mensual de sustancias controladas..."

**CHANGED?** No | Specialized pharma compliance | **R3 Avg: 3.5**

---

### Scenario 15: Boleta anulada
> "Me equivoqué en una boleta..."

**CHANGED?** No | yaya-tax | **R3 Avg: 6.0**

---

### Scenario 16: Declaración mensual SUNAT
> "Dame resumen de ventas del mes para mi declaración SUNAT."

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 6 | **7** | yaya-expenses adds expense side (compras a distribuidoras) for complete picture |
| **R3 Avg** | — | **7.0** | |

**CHANGED?** Yes | **New feature helped?** yaya-expenses (purchase/expense aggregation for SUNAT)

---

### Scenario 17: Turno de personal
> "La técnica María no viene mañana..."

**CHANGED?** No | No HR module | **R3 Avg: 4.0**

---

### Scenario 18: Visita de laboratorio (recordatorio)
> "El representante de Bayer viene el jueves a las 10am..."

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 6 | **7** | whatsapp-mcp: schedule_message as reminder; crm-mcp: store rep as contact |
| **R3 Avg** | — | **7.0** | |

**CHANGED?** Yes | **New feature helped?** whatsapp-mcp, crm-mcp

---

### Scenario 19: Inspección DIGEMID (checklist)
> "Programaron inspección de DIGEMID para la próxima semana..."

**CHANGED?** No | Compliance checklists, not addressed by P0 | **R3 Avg: 5.5**

---

### Scenario 20: Productos más vendidos
> "¿Cuáles son mis 10 medicamentos más vendidos? Y mis 5 con mejor margen."

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 6 | **8** | yaya-expenses COGS + yaya-analytics = margin per product |
| **R3 Avg** | — | **7.5** | |

**CHANGED?** Yes | **New feature helped?** yaya-expenses (COGS for margin calculation)

---

### Scenario 21: Rentabilidad neta
> "¿Cuánto estoy ganando neto este mes? Ventas menos compras menos gastos fijos."

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 3 | **9** | yaya-expenses: full P&L. Revenue from analytics, expenses tracked, recurring expenses (rent, utilities, payroll) |
| Accuracy | 2 | **8** | Daily/weekly/monthly P&L with category breakdown |
| Completeness | 2 | **9** | Complete picture: ventas - compras - gastos fijos = ganancia neta. Accountant export |
| **R3 Avg** | — | **8.7** | |

**CHANGED?** Yes | **New feature helped?** yaya-expenses (P&L — THE feature Patricia needs. She "works a lot and earns little" — now she can see exactly where the money goes)

---

### Scenario 22: Categorías de ventas
> "Dame ventas por categoría: genéricos, marca, dermocosmética, suplementos, servicios."

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 6 | **7** | yaya-analytics + yaya-expenses category breakdown |
| **R3 Avg** | — | **7.0** | |

**CHANGED?** Yes (marginal) | **New feature helped?** yaya-expenses (category tracking)

---

### Scenarios 23-25: Safety-critical (medicamento falsificado, error dispensación, robo controlados)
**CHANGED?** No | Escalation/safety scenarios, critical for pharma | **R3 Avg:** ~6.5-7.5

---

### Scenarios 26-28: Safety-critical (antibiótico sin receta, cadena de frío, síntomas graves)
**CHANGED?** No | Pharma compliance + health safety | **R3 Avg:** ~7.0-8.0

---

### Scenario 29: Precio en dólares (turista)
> "Son S/85 en medicinas. ¿A cuánto le cobro en USD?"

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 4 | **9** | forex-mcp: convert S/85 PEN → USD |
| **R3 Avg** | — | **8.5** | |

**CHANGED?** Yes | **New feature helped?** forex-mcp

---

### Scenario 30: Interacción medicamentosa (Warfarina + Ibuprofeno)
> "Paciente toma Warfarina y quiere comprar Ibuprofeno..."

**CHANGED?** No | Needs drug interaction database | **R3 Avg: 5.0**

---

## Patricia Vega — Summary

| Metric | Round 2 | Round 3 | Delta |
|--------|---------|---------|-------|
| **Overall Score** | 5.0/10 | **6.7/10** | +1.7 |
| **PMF %** | 35% | **52%** | +17 pts |

**Most Impactful Features:**
1. 🥇 **yaya-expenses** — P&L visibility (scenario 21). Patricia's deepest pain: "trabajo mucho y gano poco" → now she can see exactly where the money goes. COGS for margin analysis (8, 20).
2. 🥈 **crm-mcp** — Customer/supplier relationship tracking (2, 4, 12, 13, 18)
3. 🥉 **whatsapp-mcp** — Promo notifications for expiring products (12), delivery confirmations (4)

**Remaining Gaps:**
- No drug interaction checking system (CRITICAL for pharmacies)
- No DIGEMID compliance module (controlled substance tracking, temperature logs)
- No insurance/EPS claims management
- No cadena de frío monitoring integration
- No pharmaceutical-specific inventory (lot numbers, expiry tracking with regulatory compliance)
- No prescription archival system

**Note:** Patricia's PMF improved less than others because her most critical needs are pharma-specific (DIGEMID compliance, drug interactions, EPS claims) — none of which were P0 features. The general business tools help, but her industry demands specialized solutions.

---

# 4. Alex Ríos — Ríos Digital (Lima Tech Agency)

**Round 2 Score: 5.7/10 | PMF: 40%**

## Scenario-by-Scenario Re-evaluation

### S01: Onboarding
> "Hola! Soy Alex de Ríos Digital 🚀 Quiero registrar mi agencia."

**CHANGED?** No | yaya-onboarding | **R3 Avg: 7.0**

---

### S02: Registrar nuevo servicio
> "Agregar 'Auditoría SEO express' a S/1,200 flat."

**CHANGED?** No | yaya-inventory/catalog | **R3 Avg: 6.5**

---

### S03: Agregar nuevo cliente
> "Cerré con TechnoPlast SAC, B2B, SEO premium + redes. RUC 20456789012."

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 6 | **9** | crm-mcp: create_contact with company, tags, source. Create deal with stage/amount |
| Accuracy | 5 | **9** | Full contact creation + deal pipeline tracking |
| Completeness | 4 | **9** | Contact + deal + services linked + pipeline value. Exactly what a B2B agency needs |
| **R3 Avg** | — | **9.0** | |

**CHANGED?** Yes | **New feature helped?** crm-mcp (create_contact + deals pipeline — KILLER feature for B2B agencies)

---

### S04: Actualizar estado de proyecto
> "El proyecto web de MiCasaFit ya está al 70%..."

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 5 | **6** | crm-mcp can log interaction/note against the client. But no project management |
| **R3 Avg** | — | **5.5** | |

**CHANGED?** Yes (marginal) | **New feature helped?** crm-mcp (interaction logging)

---

### S05: Consultar servicios activos
> "Cuántos clientes activos tengo? Cuánto estoy facturando mensual?"

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 5 | **8** | crm-mcp: list_contacts + deals pipeline. yaya-analytics for revenue |
| Completeness | 4 | **8** | Count active clients, sum monthly recurring revenue from deals |
| **R3 Avg** | — | **8.0** | |

**CHANGED?** Yes | **New feature helped?** crm-mcp (deals pipeline for MRR calculation)

---

### S06: Registrar horas de equipo
> "Mi dev Carlos metió 12 horas en el proyecto de GreenPeru."

**CHANGED?** No | No time tracking | **R3 Avg: 3.5**

---

### S07: Cotización rápida
> "Landing page + 3 meses SEO básico. Cálculo en soles y dólares."

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 6 | **8** | forex-mcp converts PEN ↔ USD; crm-mcp can log the proposal as a deal |
| Accuracy | 5 | **8** | S/3,500 + 3×S/2,500 = S/11,000. forex-mcp → USD equivalent |
| Completeness | 4 | **8** | Quote in both currencies, deal created in pipeline |
| **R3 Avg** | — | **8.0** | |

**CHANGED?** Yes | **New feature helped?** forex-mcp (dual-currency quoting), crm-mcp (deal pipeline)

---

### S08: Registrar pago recibido (PayPal USD)
> "TechnoPlast me pagó la primera cuota: $1,400 USD por PayPal."

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 5 | **8** | forex-mcp: convert $1,400 → PEN. crm-mcp: log payment interaction. yaya-expenses: track income |
| **R3 Avg** | — | **8.0** | |

**CHANGED?** Yes | **New feature helped?** forex-mcp (conversion), crm-mcp (payment interaction)

---

### S09: Tipo de cambio
> "A cuánto está el dólar hoy? Cuánto me cayó en soles del pago de $700?"

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 3 | **9** | forex-mcp: get_rate USD/PEN, convert $700 → PEN |
| **R3 Avg** | — | **9.0** | |

**CHANGED?** Yes | **New feature helped?** forex-mcp

---

### S10: Seguimiento de cobro (cliente moroso)
> "GreenPeru me debe la factura de enero, ya van 25 días. Mándales un reminder."

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 4 | **9** | yaya-fiados tracks the debt. whatsapp-mcp sends payment reminder. crm-mcp flags customer |
| Accuracy | 3 | **9** | Full debt tracking with aging (25 days), can auto-generate culturally appropriate reminder |
| Completeness | 3 | **9** | Track → remind → escalate workflow. Cobro templates adapted for B2B context |
| **R3 Avg** | — | **9.0** | |

**CHANGED?** Yes | **New feature helped?** yaya-fiados (debt tracking + aging), whatsapp-mcp (send payment reminder), crm-mcp (flag customer)

---

### S11: Descuento por volumen
> "TechnoPlast contrata SEO + redes + Google Ads, 15% descuento."

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 6 | **8** | yaya-expenses COGS + margin calc at discounted price. crm-mcp deal value update |
| **R3 Avg** | — | **7.5** | |

**CHANGED?** Yes | **New feature helped?** yaya-expenses, crm-mcp

---

### S12: Emitir factura
> "Facturar a DataCore SRL, RUC 20345678901, por S/8,000 + IGV."

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 7 | **8** | crm-mcp stores client. yaya-tax handles invoice |
| **R3 Avg** | — | **7.5** | |

**CHANGED?** Yes (marginal) | **New feature helped?** crm-mcp

---

### S13: Factura en USD
> "Factura en dólares a mi cliente de Miami. $2,800 USD por 2 meses SEO premium."

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 5 | **7** | forex-mcp: official rate for SUNAT conversion. yaya-tax for invoice |
| **R3 Avg** | — | **7.0** | |

**CHANGED?** Yes | **New feature helped?** forex-mcp (SUNAT-compatible rate)

---

### S14: Nota de crédito
**CHANGED?** No | yaya-tax | **R3 Avg: 6.0**

---

### S15: Boleta de venta
**CHANGED?** No | yaya-tax | **R3 Avg: 6.5**

---

### S16: Revisar facturas pendientes
> "Todas las facturas emitidas este mes, cuáles pagadas y cuáles no."

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 5 | **8** | crm-mcp deals track pipeline stages (won=paid, negotiation=pending). yaya-fiados for unpaid |
| **R3 Avg** | — | **7.5** | |

**CHANGED?** Yes | **New feature helped?** crm-mcp (deals pipeline stages), yaya-fiados (aging)

---

### S17: Revenue del mes desglosado
> "Cuánto facturé en febrero? Desglosado por servicio."

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 6 | **8** | crm-mcp deals with metadata can show revenue by service type. yaya-analytics |
| **R3 Avg** | — | **7.5** | |

**CHANGED?** Yes | **New feature helped?** crm-mcp (deals with service categorization)

---

### S18: Rentabilidad por cliente
> "Cuánto me deja TechnoPlast? Facturé $4,200 pero mi dev metió 80 horas."

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 3 | **6** | yaya-expenses tracks costs, crm-mcp customer stats. But NO time tracking → can't calculate per-client cost |
| **R3 Avg** | — | **5.5** | |

**CHANGED?** Yes (partial) | **New feature helped?** yaya-expenses (cost tracking — but still no time tracking per client)

---

### S19: Pipeline de ventas
> "Cuántas cotizaciones tengo pendientes? Valor total del pipeline?"

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 3 | **9** | crm-mcp deals pipeline: filter by stage (lead, qualified, proposal, negotiation). Sum pipeline_value |
| Accuracy | 2 | **9** | get_customer_stats returns pipeline_value, won_value, deal_count |
| Completeness | 2 | **9** | Full pipeline: stages, amounts, expected close dates |
| **R3 Avg** | — | **9.0** | |

**CHANGED?** Yes | **New feature helped?** crm-mcp (deals pipeline — KILLER feature for agencies)

---

### S20: Comparativo mensual
> "Compárame enero vs febrero: revenue, clientes nuevos, facturas cobradas vs pendientes."

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 5 | **8** | crm-mcp: list_contacts by created_after/created_before for new clients. Deals for revenue |
| **R3 Avg** | — | **7.5** | |

**CHANGED?** Yes | **New feature helped?** crm-mcp (filtering by date range)

---

### S21: Proyección Q2
> "Si sigo con clientes actuales y cierro los 3 leads calientes, cuánto facturaría?"

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 4 | **8** | crm-mcp: current deals (won) + pipeline (qualified/proposal) = projected revenue |
| **R3 Avg** | — | **7.5** | |

**CHANGED?** Yes | **New feature helped?** crm-mcp (deals pipeline for projections)

---

### S22: Problema con SUNAT (factura rechazada)
**CHANGED?** No | Escalation | **R3 Avg: 5.5**

---

### S23: Cliente moroso grave (S/5,000, 2 meses)
> "GreenPeru ya me debe 2 meses, son S/5,000. No contestan."

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 4 | **8** | yaya-fiados: aging report, escalation to Level 4. crm-mcp: flag as at_risk. Legal guidance |
| Completeness | 3 | **8** | Track debt history, send reminders, escalate, legal options |
| **R3 Avg** | — | **7.5** | |

**CHANGED?** Yes | **New feature helped?** yaya-fiados (aging + escalation), crm-mcp (at_risk segment)

---

### S24: Error en cobro (Yape doble)
**CHANGED?** No | yaya-payments handles refunds | **R3 Avg: 6.0**

---

### S25: Deal grande a las 2am
> "acabo d cerrar un deal graaande 🔥 startup de USA, $5,000/mes x 6 meses"

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 6 | **9** | crm-mcp: create deal ($30K total), create contact. forex-mcp: convert to PEN |
| **R3 Avg** | — | **8.5** | |

**CHANGED?** Yes | **New feature helped?** crm-mcp (deal creation), forex-mcp (USD/PEN)

---

### S26: Mensaje ambiguo
> "oe el proyecto del café ese ya quedó?"

**CHANGED?** No | Contextual understanding, LLM | **R3 Avg: 5.0**

---

### S27: Mezcla de idiomas (Spanglish)
> "Necesito hacer un breakdown del ROI del último campaign de Google Ads..."

**CHANGED?** No | LLM handles multilingual | **R3 Avg: 6.5**

---

### S28: Múltiples requests en un mensaje
> "1) factura a TechnoPlast por $1,400 2) registra pago de MiCasaFit 3) cuánto llevo en marzo 4) manda reminder a GreenPeru"

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 5 | **9** | All 4 tasks now have MCP tools: tax (factura), crm (payment), analytics (total), whatsapp (reminder) |
| Completeness | 4 | **8** | 1) yaya-tax + forex-mcp, 2) crm-mcp interaction, 3) yaya-analytics, 4) whatsapp-mcp + yaya-fiados |
| **R3 Avg** | — | **8.5** | |

**CHANGED?** Yes | **New feature helped?** forex-mcp, crm-mcp, whatsapp-mcp, yaya-fiados (all four new features contribute)

---

## Alex Ríos — Summary

| Metric | Round 2 | Round 3 | Delta |
|--------|---------|---------|-------|
| **Overall Score** | 5.7/10 | **7.6/10** | +1.9 |
| **PMF %** | 40% | **65%** | +25 pts |

**Most Impactful Features:**
1. 🥇 **crm-mcp** — Deals pipeline, customer management (S03, S05, S16, S19, S20, S21, S25). B2B agencies LIVE in CRM. This is Alex's #1 feature.
2. 🥈 **yaya-fiados + whatsapp-mcp** — Client collection tracking (S10, S23). Pain point #1 was "clientes que no pagan a tiempo."
3. 🥉 **forex-mcp** — USD/PEN for international clients (S07, S08, S09, S13, S25). Pain point #2 was multi-currency reconciliation.

**Remaining Gaps:**
- No time tracking per project/client (critical for profitability-per-client analysis)
- No project management (Trello/Notion integration)
- No proposal/quote document generation
- No Google Analytics/Meta Ads dashboard integration
- No PayPal integration for automatic payment reconciliation

---

# 5. César Huanca — Agroexportadora Huanca (Ica)

**Round 2 Score: 4.7/10 | PMF: 15%**

## Scenario-by-Scenario Re-evaluation

### Scenario 1: Estado de cosecha
> "¿Cuántas toneladas de uva Red Globe llevamos cosechadas esta semana?"

**CHANGED?** No | Needs agricultural production tracking | **R3 Avg: 3.5**

---

### Scenario 2: Registro de gastos de campo
> "Gastos de hoy: fertilizante S/4,500, pesticida S/2,800, combustible S/600, almuerzo jornaleros S/900."

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 4 | **9** | yaya-expenses: multi-line expense logging with categories (materiales, transporte, planilla) and payment methods |
| Accuracy | 3 | **9** | Parses all 4 expenses, auto-categorizes, tracks cash vs transfer |
| Completeness | 3 | **8** | Categorized, payment method tracked, daily P&L snapshot. Missing: per-hectare allocation |
| **R3 Avg** | — | **8.7** | |

**CHANGED?** Yes | **New feature helped?** yaya-expenses (chat-based expense logging — César's daily expense tracking was completely unserved before)

---

### Scenario 3: Pedido de exportación
> "El importador de Miami confirmó pedido: 2 contenedores, uva Crimson, FOB USD 2.80/kg..."

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 4 | **7** | crm-mcp: create/update client (Fresh Fruits LLC), log deal with amount ($112K) |
| Completeness | 3 | **6** | CRM + deal, but no shipping/logistics workflow |
| **R3 Avg** | — | **6.5** | |

**CHANGED?** Yes | **New feature helped?** crm-mcp (deals for export contracts)

---

### Scenario 4: Coordinación de embarque
> "Necesito booking de contenedor refrigerado 40'..."

**CHANGED?** No | No logistics/shipping integration | **R3 Avg: 3.5**

---

### Scenario 5: Certificado SENASA
> "¿Tengo el certificado fitosanitario de SENASA al día?"

**CHANGED?** No | No compliance/certification tracking | **R3 Avg: 3.0**

---

### Scenario 6: Control de calidad (uva rechazada)
> "El packing house rechazó 3 toneladas por calibre pequeño..."

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 4 | **5** | yaya-expenses can log the loss. But no quality control or market pricing system |
| **R3 Avg** | — | **4.5** | |

**CHANGED?** Yes (marginal) | **New feature helped?** yaya-expenses (loss recording)

---

### Scenario 7: Registro de jornaleros
> "Hoy trabajaron 52 jornaleros a S/50 diario. 8 mujeres en selección a S/45."

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 3 | **7** | yaya-expenses: log labor costs as planilla category. Calculate totals |
| Accuracy | 3 | **7** | 52×S/50 + 8×S/45 = S/2,960. Can track weekly/monthly payroll expense |
| Completeness | 2 | **5** | Records cost but no individual jornalero tracking, no SUNAFIL compliance |
| **R3 Avg** | — | **6.3** | |

**CHANGED?** Yes | **New feature helped?** yaya-expenses (payroll expense tracking)

---

### Scenario 8: Cálculo de tipo de cambio — USD payment
> "Me pagaron USD 45,000. El tipo de cambio bajó a 3.65. La semana pasada estaba en 3.72."

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 3 | **9** | forex-mcp: convert $45,000 at current rate, get_historical_rate for comparison |
| Accuracy | 2 | **9** | Current: $45K × 3.65 = S/164,250. Last week: $45K × 3.72 = S/167,400. Loss: S/3,150 |
| Completeness | 2 | **9** | Shows current conversion, historical comparison, exact loss from rate change |
| **R3 Avg** | — | **9.0** | |

**CHANGED?** Yes | **New feature helped?** forex-mcp (get_rate, convert, get_historical_rate — CRITICAL for agro-exporters)

---

### Scenario 9: Costo por hectárea
> "30 hectáreas de uva. Calcular costo total de producción por hectárea..."

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 3 | **7** | yaya-expenses: aggregate all expenses by category → divide by 30 ha |
| Accuracy | 3 | **7** | Can sum mano de obra + insumos + riego + etc. But needs per-hectare allocation logic |
| Completeness | 2 | **6** | Total cost known, per-ha approximation. Missing: per-hectare granularity |
| **R3 Avg** | — | **6.7** | |

**CHANGED?** Yes | **New feature helped?** yaya-expenses (expense aggregation by category)

---

### Scenario 10: Drawback
> "Exporté USD 120,000 el mes pasado. ¿Cuánto me toca de drawback?"

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 4 | **5** | forex-mcp can convert amounts. But drawback calculation (3% of FOB) is domain knowledge, not a feature |
| **R3 Avg** | — | **5.0** | |

**CHANGED?** Yes (marginal) | **New feature helped?** forex-mcp (minimal)

---

### Scenario 11: Negociación de precio FOB
> "El importador de Rotterdam quiere USD 2.50/kg. Mi costo es USD 2.20/kg."

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 5 | **7** | yaya-expenses COGS: knows cost per kg. forex-mcp: EUR/USD cross rates for Rotterdam |
| Completeness | 4 | **7** | Margin analysis at different price points |
| **R3 Avg** | — | **7.0** | |

**CHANGED?** Yes | **New feature helped?** yaya-expenses (COGS), forex-mcp

---

### Scenario 12: Pago a proveedores en dólares
> "Proveedor cobra USD 0.85 por caja. Necesito 15,000 cajas. ¿En soles?"

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 3 | **9** | forex-mcp: convert USD 12,750 → PEN at SBS rate |
| Accuracy | 2 | **9** | 15,000 × $0.85 = $12,750. × rate = S/X. Compare PEN vs USD payment |
| **R3 Avg** | — | **9.0** | |

**CHANGED?** Yes | **New feature helped?** forex-mcp

---

### Scenario 13: Factura de exportación
> "Factura a Fresh Fruits LLC, 40 toneladas uva Crimson, FOB USD 2.80/kg, total USD 112,000."

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 6 | **7** | crm-mcp: store client. forex-mcp: SUNAT conversion rate. yaya-tax: invoice |
| **R3 Avg** | — | **7.0** | |

**CHANGED?** Yes | **New feature helped?** crm-mcp, forex-mcp

---

### Scenario 14: Drawback documentación
> "¿Tengo todo completo del embarque de noviembre?"

**CHANGED?** No | No document tracking | **R3 Avg: 4.0**

---

### Scenario 15: Planilla de jornaleros SUNAT
> "Tengo 200 jornaleros en campaña. Algunos sin documento."

**CHANGED?** No | Labor compliance, not addressed | **R3 Avg: 4.0**

---

### Scenario 16: IGV de compras (recuperación)
> "Compré S/180,000 en insumos agrícolas. ¿Puedo recuperar IGV?"

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 5 | **6** | yaya-expenses IGV tracking feature (crédito fiscal). But export-specific IGV recovery is specialized |
| **R3 Avg** | — | **6.0** | |

**CHANGED?** Yes (marginal) | **New feature helped?** yaya-expenses (IGV tracking)

---

### Scenario 17: Ventana de embarque (timeline)
> "El buque sale el 8 de diciembre. Contenedor debe estar en puerto 3 días antes..."

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 4 | **5** | whatsapp-mcp can schedule reminders for each milestone |
| **R3 Avg** | — | **5.0** | |

**CHANGED?** Yes (marginal) | **New feature helped?** whatsapp-mcp (schedule_message)

---

### Scenario 18: Temporada de fumigación (calendario)
> "3 aplicaciones, cada 15 días, empezando próxima semana."

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 5 | **6** | whatsapp-mcp: schedule reminders. yaya-expenses: pre-log purchase costs |
| **R3 Avg** | — | **5.5** | |

**CHANGED?** Yes (marginal) | **New feature helped?** whatsapp-mcp

---

### Scenario 19: Inspección GlobalGAP
> "Auditoría GlobalGAP en febrero. Recuérdame en enero."

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 5 | **6** | whatsapp-mcp: schedule_message for January reminder |
| **R3 Avg** | — | **5.5** | |

**CHANGED?** Yes (marginal) | **New feature helped?** whatsapp-mcp

---

### Scenario 20: Rentabilidad por destino
> "¿Qué destino me da mejor margen: USA, Europa o Asia?"

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 3 | **6** | yaya-expenses (costs by category) + forex-mcp (convert FOB prices to PEN) + crm-mcp (deals by destination) |
| **R3 Avg** | — | **5.5** | |

**CHANGED?** Yes | **New feature helped?** yaya-expenses, forex-mcp, crm-mcp

---

### Scenario 21: Producción vs meta
> "¿Cuántas toneladas van vs lo comprometido?"

**CHANGED?** No | Needs production tracking | **R3 Avg: 3.5**

---

### Scenario 22: Costo de mano de obra
> "¿Cuánto gasté en jornaleros esta campaña vs la campaña pasada?"

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 3 | **7** | yaya-expenses: planilla category aggregation, period comparison |
| Accuracy | 3 | **7** | If expenses are logged, can compare current vs previous campaign |
| **R3 Avg** | — | **7.0** | |

**CHANGED?** Yes | **New feature helped?** yaya-expenses (category comparison across periods)

---

### Scenarios 23-25: Escalation (contenedor rechazado, helada, SUNAFIL)
**CHANGED?** No | Domain-specific escalation | **R3 Avg:** ~5.0-6.0

---

### Scenario 26: Multi-moneda complejo (USD + EUR + JPY)
> "Cobré USD 45,000 de USA, EUR 28,000 de Holanda, ¥3,500,000 de Japón. Convierte todo a soles."

| Dimension | R2 | R3 | Notes |
|-----------|----|----|-------|
| Handleable | 2 | **9** | forex-mcp: All three currencies supported (USD, EUR, JPY). Convert each to PEN |
| Accuracy | 1 | **9** | Real-time rates from SBS (USD, EUR) and exchangerate-api (JPY) |
| Completeness | 1 | **9** | All conversions + per-kg margin comparison across contracts |
| **R3 Avg** | — | **9.0** | |

**CHANGED?** Yes | **New feature helped?** forex-mcp (multi-currency: USD, EUR, JPY all in SUPPORTED_CURRENCIES)

---

### Scenarios 27-30: Safety/Edge Cases (pesticida prohibido, accidente jornalero, regulación, contrato exclusividad)
**CHANGED?** No | Domain-specific legal/safety | **R3 Avg:** ~5.0-6.5

---

## César Huanca — Summary

| Metric | Round 2 | Round 3 | Delta |
|--------|---------|---------|-------|
| **Overall Score** | 4.7/10 | **6.3/10** | +1.6 |
| **PMF %** | 15% | **38%** | +23 pts |

**Most Impactful Features:**
1. 🥇 **forex-mcp** — Multi-currency conversion is EXISTENTIAL for an agro-exporter (scenarios 8, 12, 26). Revenue in USD/EUR/JPY, costs in PEN. This was his #3 pain point.
2. 🥈 **yaya-expenses** — Field expense tracking (scenarios 2, 7, 9, 22). Daily operational costs were tracked on paper before.
3. 🥉 **crm-mcp** — Export client management (scenarios 3, 13, 20). Tracking importers across USA/Europe/Asia.

**Remaining Gaps (many — agro-export is highly specialized):**
- No agricultural production tracking (tons harvested, per-hectare yield)
- No logistics/shipping integration (container booking, port coordination)
- No phytosanitary certificate tracking (SENASA compliance)
- No GlobalGAP/HACCP certification management
- No weather/climate integration (frost alerts, irrigation planning)
- No labor management for 200+ seasonal jornaleros (SUNAFIL compliance)
- No drawback calculation/tracking
- No cold chain monitoring for refrigerated containers

**Note:** César has the lowest PMF improvement because agro-export is the most specialized business type. The P0 features help with universal business needs (expenses, forex, CRM) but don't address his industry-specific workflows.

---

# Cross-Persona Summary — Round 3

## Score Comparison

| Persona | Business Type | R2 Score | R3 Score | Delta | R2 PMF | R3 PMF | PMF Delta |
|---------|--------------|----------|----------|-------|--------|--------|-----------|
| Miguel Torres | Restaurant (Cusco) | 5.6 | **7.4** | +1.8 | 25% | **55%** | +30 |
| Lucía Chen | Wholesale Electronics (Lima) | 5.6 | **7.3** | +1.7 | 22% | **52%** | +30 |
| Patricia Vega | Pharmacy (Trujillo) | 5.0 | **6.7** | +1.7 | 35% | **52%** | +17 |
| Alex Ríos | Tech Agency (Lima) | 5.7 | **7.6** | +1.9 | 40% | **65%** | +25 |
| César Huanca | Agro-export (Ica) | 4.7 | **6.3** | +1.6 | 15% | **38%** | +23 |
| **Average** | | **5.3** | **7.1** | **+1.7** | **27%** | **52%** | **+25** |

## Feature Impact Ranking (across all personas)

| Rank | Feature | Scenarios Improved | Most Valuable For |
|------|---------|-------------------|-------------------|
| 🥇 | **forex-mcp** | 18+ scenarios | Everyone with multi-currency (Miguel: EUR/USD tourists, Lucía: CNY/USD imports, César: USD/EUR/JPY exports, Alex: USD clients) |
| 🥈 | **yaya-expenses** | 16+ scenarios | Everyone (P&L visibility is universal). Best for: Miguel (food cost), Patricia (net profitability), César (field expenses) |
| 🥉 | **crm-mcp** | 15+ scenarios | B2B especially (Alex: deals pipeline, Lucía: customer segmentation). Good for everyone |
| 4th | **yaya-fiados** | 8+ scenarios | Lucía (provincial credit), Alex (client collections). Less relevant for César, Patricia, Miguel |
| 5th | **whatsapp-mcp** | 10+ scenarios | Enabler for everything else (reminders, cobro, notifications). Not as standalone impactful |

## PMF Analysis

- **Closest to PMF:** Alex Ríos (65%) — B2B service agency is the best fit for current features. CRM + deals pipeline is his core need.
- **Strong improvement:** Miguel Torres (55%) and Lucía Chen (52%) — multi-currency + expenses cover their key gaps.
- **Moderate improvement:** Patricia Vega (52%) — general business tools help, but pharmacy-specific needs (DIGEMID, drug interactions) remain unserved.
- **Still below PMF threshold:** César Huanca (38%) — agro-export is too specialized; needs industry-specific features.

## Biggest Remaining Gaps (P1 candidates)

1. **Time/project tracking** — Alex needs per-client profitability. No time tracking exists.
2. **Supply chain/logistics** — Lucía (containers from China) and César (export logistics) both need shipping tracking.
3. **Industry compliance modules** — Patricia (DIGEMID/drug interactions), César (SENASA/GlobalGAP).
4. **Restaurant-specific features** — Miguel needs reservation management (party size, covers, table management), not generic appointments.
5. **HR/staff scheduling** — Multiple personas need basic team scheduling.
6. **Document/certification tracking** — César needs certificate expiry tracking; Patricia needs DIGEMID compliance.

## Key Insight

The P0 features created a **strong horizontal layer** — every persona benefits from expense tracking, currency conversion, CRM, and outbound messaging. The platform has moved from "barely functional" (avg 5.3/10, 27% PMF) to "useful but not indispensable" (avg 7.1/10, 52% PMF). 

To cross the PMF threshold (>60% for most personas), the next phase needs **vertical/industry-specific features** — the generic tools are now in place; what's missing are the domain-specific workflows that make each business type say "I can't live without this."
