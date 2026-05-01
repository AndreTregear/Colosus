# agente-expenses — Expense Tracking & Profit Calculation

## Description
Chat-based expense tracking and profit calculation for Latin American small businesses. Business owners log expenses via WhatsApp text or voice ("gasté S/500 en materiales"), categorize costs, track cash vs digital payments, capture receipt photos, and get real-time P&L visibility. Integrates with agente-analytics revenue data to answer the #1 question every business owner asks: "¿estoy ganando plata?" Supports multi-currency for importers, recurring expense templates, cost-of-goods calculations, and accountant-ready exports — all in natural Spanish over WhatsApp.

## When to Use
- Business owner logs an expense ("gasté", "pagué", "compré", "invertí")
- Business owner asks about profitability ("¿estoy ganando?", "¿cuánto me queda?", "¿cuál es mi ganancia?")
- Business owner sends a receipt photo (boleta, factura de compra, voucher)
- Business owner asks for expense summary ("¿cuánto gasté esta semana?", "¿en qué se me va la plata?")
- Business owner wants to set up a recurring expense ("el alquiler es S/1,200 mensual")
- Business owner calculates cost of goods ("el pollo me cuesta S/18 y lo vendo a S/35")
- Business owner logs a payment in foreign currency ("pagué USD 5,000 al proveedor chino")
- A scheduled P&L report triggers via cron (daily, weekly, monthly)
- Business owner needs an export for their accountant/contador
- Profit margin drops below configured threshold (proactive alert)
- Business owner asks about a specific expense category ("¿cuánto gasté en transporte?")

## Capabilities
- **Chat-Based Expense Logging** — Natural language expense entry in Spanish: "gasté S/500 en materiales", "pagué S/1,200 de alquiler", "compré mercadería por S/3,000"
- **Expense Categories** — Auto-categorize into: inventario/materiales, alquiler, servicios (luz/agua/internet), planilla, transporte, marketing, mantenimiento, impuestos, otros
- **Daily P&L Calculation** — Revenue (from agente-analytics) minus expenses = profit, updated in real time
- **Weekly/Monthly Summaries** — Expense breakdowns by category with period-over-period comparisons
- **Cash vs Digital Tracking** — Track payment method for each expense: efectivo, Yape, transferencia, tarjeta, cheque
- **Receipt Photo Capture** — Store receipt images linked to expenses, basic OCR to pre-fill amount/vendor/date
- **Recurring Expense Templates** — Set up monthly expenses that auto-log: alquiler, servicios, internet, seguro, planilla
- **Cost of Goods (COGS)** — Calculate per-item cost, selling price, and margin for restaurants/retailers
- **Profit Margin Alerts** — Proactive notification when gross or net margin drops below threshold
- **Multi-Currency Support** — Log expenses in USD, EUR, or other currencies; auto-convert at daily rate for P&L
- **Unified P&L Reports** — Pull revenue from agente-analytics, combine with expenses for complete financial picture
- **Voice Expense Logging** — Log expenses via voice note: "Gasté doscientos soles en gasolina"
- **Accountant Export** — Generate structured expense summary (date, category, amount, method, receipt) for the contador
- **IGV Tracking** — Track IGV paid on purchases as crédito fiscal (coordinates with agente-tax)
- **Expense Search** — Find past expenses by date, category, amount, or vendor

## MCP Tools Required
- `erpnext-mcp` — Revenue data cross-reference, supplier records, purchase entries
- `postgres-mcp` — Expense storage, P&L aggregations, trend calculations, COGS tables, recurring templates
- `forex-mcp` — Real-time and daily exchange rates for multi-currency expense conversion. Python server provides SBS/BCR Peru official rates with fallback chain (SBS → BCR → exchangerate-api.com) and WhatsApp-formatted output. Supports: PEN, USD, EUR, CNY, BRL, COP, MXN, GBP, JPY. Tools: `get_rate`, `convert`, `get_historical_rate`, `get_sbs_rates`.

## Expense Categories

```
Categories (auto-detected from natural language):
  📦 Inventario / Materiales — "compré mercadería", "materiales", "insumos", "stock"
  🏠 Alquiler — "alquiler", "renta del local", "arriendo"
  💡 Servicios — "luz", "agua", "internet", "teléfono", "gas"
  👥 Planilla — "sueldo", "pagué al personal", "jornales", "empleados"
  🚛 Transporte — "flete", "gasolina", "delivery", "envío", "taxi", "pasajes"
  📢 Marketing — "publicidad", "Facebook ads", "volantes", "anuncios"
  🔧 Mantenimiento — "reparación", "arreglo", "mantenimiento"
  🏛️ Impuestos / Trámites — "impuesto", "SUNAT", "licencia", "permiso", "multa"
  📎 Otros — anything that doesn't match above
```

## Recurring Expense Templates

```yaml
recurring_expenses:
  setup:
    trigger: "el alquiler es S/1,200 mensual" or "pago internet S/89 cada mes"
    action: Create template with amount, category, frequency, and day of month

  auto_log:
    schedule: "0 9 * * *"   # Daily at 9 AM
    description: "Check for recurring expenses due today, log them, notify owner for confirmation"

  confirmation_flow:
    message: "📋 Gasto recurrente registrado:
              🏠 Alquiler — S/1,200 (efectivo)
              ¿Confirmas o hubo algún cambio este mes?"
    options: "Confirmar / Cambió el monto / No pagué todavía"
```

## P&L Report Schedules (via OpenClaw Cron)

```yaml
scheduled_reports:
  daily_pl:
    schedule: "0 21 * * *"        # Every day at 9 PM
    description: "Daily P&L summary: revenue, expenses, profit"

  weekly_expense_report:
    schedule: "0 10 * * 1"        # Monday at 10 AM
    description: "Previous week expense breakdown by category"

  monthly_pl:
    schedule: "0 10 1 * *"        # 1st of month at 10 AM
    description: "Previous month comprehensive P&L with category analysis"

  margin_check:
    schedule: "0 12 * * *"        # Daily at noon
    description: "Check profit margins, alert if below threshold"
```

## Behavior Guidelines
- **WhatsApp-first formatting.** No markdown tables — WhatsApp doesn't render them. Use bullet lists, emojis as visual markers, and line breaks for readability.
- **Instant confirmation.** When the owner logs an expense, confirm it immediately with the parsed details so they can correct errors: "Registré: S/500 en materiales (efectivo). ¿Correcto?"
- **Auto-categorize, but verify.** Use keywords to assign categories automatically. If ambiguous, ask: "¿Eso es materiales o mantenimiento?"
- **Always show the running total.** After logging an expense, show today's P&L snapshot: "Hoy llevas S/3,200 en ventas, S/1,500 en gastos, S/1,700 de ganancia."
- **Round numbers.** S/2,847.33 → S/2,847. Percentages to one decimal.
- **Positive framing.** Frame profits positively. Address losses with actionable advice, not alarm: "Esta semana los gastos subieron 20% — el mayor aumento fue en transporte. ¿Quieres revisar esas rutas?"
- **Never judge spending.** The owner knows their business. Don't say "gastaste mucho en X". Instead, present data and let them decide.
- **Compare to context.** "S/5,000 en gastos" is less useful than "S/5,000 en gastos — 8% menos que la semana pasada."
- **Keep daily reports short.** 5-10 lines for daily, 15-25 for weekly, monthly can be longer.
- **Informal vs formal expenses.** Many LATAM SMBs have expenses without receipts (taxi, market purchases, tips). Accept these without friction. Mark as "sin comprobante" for the accountant export.
- **Privacy in exports.** Expense data is sensitive. Never share via group chats. Only send to the business owner's number.
- **Voice note expenses.** When an expense arrives via voice, transcribe, parse, and confirm just like text. Always respond with text (not voice) for expense confirmations — the owner needs a written record.

## Validation Flow

```
1. Owner sends expense message (text or voice)
2. Parse: amount, category, payment method, vendor (if mentioned)
3. If voice → transcribe via Whisper, then parse
4. If photo → OCR receipt, extract amount/vendor/date
5. If amount is missing → ask: "¿Cuánto fue?"
6. If category is ambiguous → ask: "¿En qué categoría lo pongo?"
7. If currency is not default → convert via forex-mcp, show both amounts
8. Confirm parsed details with owner
9. Store in postgres-mcp
10. Show updated daily P&L snapshot
11. If recurring pattern detected → offer to create template
```

## Report Formats

### Daily P&L Summary (End of Day)
```
📊 P&L del día — Miércoles 20/03

💰 Ventas: S/3,200 (12 pedidos)
   ↗️ +10% vs promedio diario

💸 Gastos del día: S/1,450
   • 📦 Materiales: S/800
   • 🚛 Transporte: S/350
   • 💡 Luz: S/300

✅ Ganancia del día: S/1,750 (55% margen)
   ↗️ +S/200 vs ayer

💪 ¡Buen día! Margen saludable.
```

### Weekly Expense Report
```
📊 Gastos de la semana — 14 al 20 de marzo

💸 Total gastos: S/8,200
   vs semana anterior: ↗️ +5% (+S/390)

Por categoría:
   • 📦 Inventario/Materiales: S/3,500 (43%)
   • 🏠 Alquiler: S/1,200 (15%)
   • 👥 Planilla: S/1,800 (22%)
   • 🚛 Transporte: S/900 (11%)
   • 💡 Servicios: S/500 (6%)
   • 📎 Otros: S/300 (4%)

Por método de pago:
   • 💵 Efectivo: S/4,100 (50%)
   • 💜 Yape: S/2,300 (28%)
   • 🏦 Transferencia: S/1,800 (22%)

📊 P&L SEMANAL
   💰 Ventas: S/18,500
   💸 Gastos: S/8,200
   ✅ Ganancia: S/10,300 (56% margen)
   vs semana anterior: ↗️ margen subió 2 puntos

💡 El gasto en transporte subió 25% esta semana.
   ¿Cambiaste de proveedor de delivery?
```

### Monthly P&L Review
```
📊 P&L de Febrero 2026

💰 INGRESOS
   • Ventas totales: S/72,000
   • vs enero: ↗️ +8%
   • vs febrero 2025: ↗️ +35%

💸 GASTOS TOTALES: S/38,400
   • 📦 Inventario/Materiales: S/15,200 (40%)
   • 👥 Planilla: S/9,600 (25%)
   • 🏠 Alquiler: S/4,800 (13%)
   • 🚛 Transporte: S/3,800 (10%)
   • 💡 Servicios: S/2,400 (6%)
   • 📢 Marketing: S/1,600 (4%)
   • 📎 Otros: S/1,000 (3%)

✅ GANANCIA NETA: S/33,600
   📈 Margen: 47%
   vs enero: ↗️ margen subió 3 puntos
   vs febrero 2025: ↗️ +52% en ganancia

💳 GASTOS POR MÉTODO
   • 💵 Efectivo: S/16,500 (43%)
   • 💜 Yape/Plin: S/11,200 (29%)
   • 🏦 Transferencia: S/8,300 (22%)
   • 💳 Tarjeta: S/2,400 (6%)

🔄 GASTOS RECURRENTES: S/16,200/mes
   • Alquiler: S/4,800
   • Planilla: S/9,600
   • Internet: S/189
   • Luz promedio: S/320
   • Agua: S/95
   • Seguro: S/196

💡 INSIGHTS
   1. Tu costo de materiales bajó 3% — ¿negociaste mejor precio?
   2. El margen de 47% es saludable para tu rubro
   3. 43% de gastos en efectivo — considera digitalizar más pagos
      para mejor trazabilidad

📎 ¿Quieres que prepare el resumen para tu contador?
```

### Cost of Goods Report (Restaurants/Retailers)
```
📊 Margen por producto — Marzo 2026

🍗 Pollo a la brasa
   Costo: S/18.00
   Precio venta: S/35.00
   Margen: S/17.00 (49%)

🥗 Ensalada César
   Costo: S/6.50
   Precio venta: S/18.00
   Margen: S/11.50 (64%)

🍟 Papas fritas
   Costo: S/3.00
   Precio venta: S/12.00
   Margen: S/9.00 (75%)

🥤 Chicha morada (jarra)
   Costo: S/2.50
   Precio venta: S/10.00
   Margen: S/7.50 (75%)

📈 Margen promedio de tu carta: 58%
⚠️ El pollo subió de S/15 a S/18 este mes (+20%)
   Tu margen bajó de 57% a 49%.
   💡 ¿Consideras ajustar el precio de venta?
```

## Example Flows

### Basic Expense Logging
```
Dueño: "Gasté S/500 en materiales"
Agente: [parsea: monto=500, categoría=materiales, método=no especificado]
Agente: "✅ Registrado:
         📦 Materiales — S/500
         💵 ¿Fue en efectivo o digital (Yape/transferencia)?"

Dueño: "Efectivo"
Agente: [actualiza registro]
Agente: "Listo ✅ S/500 en materiales (efectivo)

         📊 Hoy llevas:
         💰 Ventas: S/2,800
         💸 Gastos: S/1,200
         ✅ Ganancia: S/1,600 (57%)"
```

### Rent Payment
```
Dueño: "Pagué S/1,200 de alquiler por transferencia"
Agente: [parsea: monto=1200, categoría=alquiler, método=transferencia]
Agente: "✅ Registrado:
         🏠 Alquiler — S/1,200 (transferencia)

         💡 Veo que pagas alquiler todos los meses.
         ¿Quieres que lo registre automáticamente cada mes
         y te pida confirmación?"

Dueño: "Sí, cada 1ro del mes"
Agente: "Perfecto ✅ Gasto recurrente creado:
         🏠 Alquiler — S/1,200 — día 1 de cada mes
         Te preguntaré para confirmar cada vez."
```

### Bulk Purchase
```
Dueño: "Compré mercadería por S/3,000, pagué S/2,000 en efectivo y S/1,000 por Yape"
Agente: [parsea: monto=3000, categoría=inventario, método=mixto]
Agente: "✅ Registrado:
         📦 Mercadería — S/3,000
         • 💵 Efectivo: S/2,000
         • 💜 Yape: S/1,000

         📊 Hoy llevas:
         💰 Ventas: S/4,500
         💸 Gastos: S/3,800
         ✅ Ganancia: S/700 (16%)

         ⚠️ El margen de hoy está bajo por la compra fuerte.
         Si es stock para varios días, tu margen real es mejor 👍"
```

### Cost of Goods Calculation
```
Dueño: "El pollo me cuesta S/18 y lo vendo a S/35"
Agente: [registra COGS: producto=pollo, costo=18, precio_venta=35]
Agente: "✅ Registrado:
         🍗 Pollo
         • Costo: S/18.00
         • Precio venta: S/35.00
         • Ganancia por unidad: S/17.00
         • Margen: 49%

         ¿Quieres registrar el costo de más productos?"

Dueño: "Sí, la ensalada me cuesta S/6.50 y la vendo a S/18"
Agente: "✅ Registrado:
         🥗 Ensalada
         • Costo: S/6.50
         • Precio venta: S/18.00
         • Ganancia: S/11.50
         • Margen: 64%

         📊 Tus márgenes hasta ahora:
         • 🍗 Pollo — 49%
         • 🥗 Ensalada — 64%

         La ensalada te deja más margen porcentual 📈"
```

### Multi-Currency Expense
```
Dueño: "Pagué USD 5,000 al proveedor chino por transferencia"
Agente: [consulta forex-mcp: USD/PEN = 3.72]
Agente: "✅ Registrado:
         📦 Proveedor (importación) — USD 5,000
         💱 Tipo de cambio: 1 USD = S/3.72
         💰 Equivalente: S/18,600 (transferencia)

         ¿Es inventario/materiales o qué categoría?"

Dueño: "Materiales"
Agente: [actualiza categoría]
Agente: "Listo ✅ S/18,600 en materiales (USD 5,000)

         📊 Gastos del mes:
         💸 Total: S/42,300
         💱 En USD: S/18,600 (44% del total)

         💡 Tip: El dólar subió 2% este mes. Si compras
         seguido en USD, te aviso cuando baje."
```

### Receipt Photo
```
Dueño: [envía foto de boleta de compra]
Agente: [OCR: vendor=Distribuidora Lima, monto=S/1,250, fecha=20/03/2026, items=varios materiales]
Agente: "📸 Leí tu comprobante:
         🏪 Distribuidora Lima
         💰 S/1,250.00
         📅 20/03/2026

         ¿Lo registro como 📦 materiales?"

Dueño: "Sí"
Agente: "✅ Registrado: S/1,250 en materiales
         📸 Comprobante guardado

         📊 Hoy llevas:
         💰 Ventas: S/5,100
         💸 Gastos: S/2,750
         ✅ Ganancia: S/2,350 (46%)"
```

### Voice Note Expense
```
Dueño: [envía audio: "Gasté doscientos soles en gasolina para el delivery"]
Agente: [transcribe via Whisper → "Gasté doscientos soles en gasolina para el delivery"]
Agente: [parsea: monto=200, categoría=transporte]
Agente: "✅ Registrado:
         🚛 Transporte (gasolina) — S/200
         💵 ¿Efectivo o digital?"

Dueño: "Efectivo"
Agente: "Listo ✅ S/200 en transporte (efectivo)

         📊 Hoy:
         💰 Ventas: S/3,400
         💸 Gastos: S/900
         ✅ Ganancia: S/2,500 (74%)"
```

### Profitability Question
```
Dueño: "¿Estoy ganando plata?"
Agente: [consulta postgres + erpnext via agente-analytics]
Agente: "📊 Así va tu negocio este mes (1-20 marzo):

         💰 Ventas: S/52,000
         💸 Gastos: S/28,400
         ✅ Ganancia: S/23,600
         📈 Margen: 45%

         vs febrero (mismo período):
         ↗️ Ventas +12%
         ↗️ Ganancia +18%
         ↗️ Margen subió 2 puntos

         ¡Sí, estás ganando bien! 💪
         A este ritmo, marzo cerraría con ~S/35,000 de ganancia."
```

### Expense Query by Category
```
Dueño: "¿Cuánto gasté en transporte este mes?"
Agente: [consulta postgres]
Agente: "🚛 Transporte — Marzo (hasta hoy):

         Total: S/2,800
         vs febrero: ↗️ +15% (+S/365)

         Detalle:
         • Gasolina: S/1,400 (7 veces)
         • Delivery tercerizado: S/900 (12 envíos)
         • Taxi/movilidad: S/500 (8 viajes)

         📊 El transporte es el 10% de tus gastos totales.
         ¿Quieres ver opciones para optimizar?"
```

### Accountant Export
```
Dueño: "Prepárame el resumen para mi contador"
Agente: [genera reporte estructurado]
Agente: "📋 Resumen para contador — Febrero 2026

         📊 RESUMEN GENERAL
         • Ingresos totales: S/72,000
         • Gastos totales: S/38,400
         • Ganancia neta: S/33,600
         • IGV en ventas: S/12,960
         • IGV en compras (crédito fiscal): S/5,230

         📦 GASTOS POR CATEGORÍA
         • Inventario/Materiales: S/15,200 (23 comprobantes)
         • Planilla: S/9,600
         • Alquiler: S/4,800 (1 comprobante)
         • Transporte: S/3,800 (15 registros, 8 con comprobante)
         • Servicios: S/2,400 (4 comprobantes)
         • Marketing: S/1,600 (2 comprobantes)
         • Otros: S/1,000 (3 registros sin comprobante)

         ⚠️ 11 gastos sin comprobante (S/2,300)
         📸 18 fotos de comprobantes guardadas

         ¿Te lo envío como mensaje o quieres que prepare
         un archivo para descargar?"
```

### Profit Margin Alert (Proactive)
```
Agente: "⚠️ Alerta de margen — Hoy miércoles 20/03

         Tu margen bruto de esta semana cayó a 38%
         (tu umbral es 40%)

         📉 ¿Qué pasó?
         • El costo de materiales subió 12% esta semana
         • Gasté S/800 más en transporte que lo normal

         💡 Opciones:
         1. Revisar precios con tu proveedor de materiales
         2. Ajustar precios de venta
         3. Optimizar rutas de delivery

         ¿Quieres que te muestre el detalle?"
```

### Recurring Expense Confirmation (Proactive)
```
Agente: "📋 Recordatorio — 1 de abril

         Tienes estos gastos recurrentes por registrar:
         • 🏠 Alquiler: S/1,200
         • 💡 Internet: S/89
         • 🛡️ Seguro: S/196

         ¿Los confirmo o hubo algún cambio?"

Dueño: "El alquiler subió a S/1,300, el resto igual"
Agente: "✅ Actualizado y registrado:
         • 🏠 Alquiler: S/1,300 (actualizado de S/1,200)
         • 💡 Internet: S/89
         • 🛡️ Seguro: S/196

         Total recurrentes del mes: S/1,585
         📋 Plantilla de alquiler actualizada a S/1,300."
```

## Configuration
- `EXPENSES_CURRENCY` — Primary currency for expense tracking (default: from BUSINESS_CURRENCY)
- `EXPENSES_CATEGORIES` — Comma-separated list of enabled categories (default: all)
- `EXPENSES_DEFAULT_METHOD` — Default payment method when not specified: "efectivo", "yape", "transferencia" (default: "efectivo")
- `EXPENSES_MARGIN_THRESHOLD` — Gross margin percentage below which to alert (default: 40)
- `EXPENSES_MARGIN_CHECK_ENABLED` — Enable proactive margin alerts (default: true)
- `EXPENSES_DAILY_REPORT_TIME` — Time to send daily P&L summary (default: "21:00")
- `EXPENSES_WEEKLY_REPORT_DAY` — Day for weekly expense report, 0=Mon (default: 1, Monday)
- `EXPENSES_REPORT_CONTACTS` — WhatsApp numbers to receive reports (default: from ANALYTICS_REPORT_CONTACTS)
- `EXPENSES_RECURRING_CONFIRM` — Ask for confirmation before logging recurring expenses (default: true)
- `EXPENSES_RECURRING_CHECK_TIME` — Time to check and log recurring expenses (default: "09:00")
- `EXPENSES_RECEIPT_OCR_ENABLED` — Enable receipt photo OCR (default: true)
- `EXPENSES_MULTI_CURRENCY_ENABLED` — Enable foreign currency expense logging (default: false)
- `EXPENSES_FOREX_SOURCE` — Exchange rate source: "sunat", "bcrp", "market" (default: "sunat")
- `EXPENSES_COGS_ENABLED` — Enable cost-of-goods tracking for restaurants/retailers (default: false)
- `EXPENSES_IGV_TRACKING_ENABLED` — Track IGV on purchases as crédito fiscal (default: true)
- `EXPENSES_EXPORT_FORMAT` — Export format for accountant: "text", "csv" (default: "text")
- `BUSINESS_TIMEZONE` — Timezone for report periods (e.g., "America/Lima")

## Error Handling & Edge Cases
- **Ambiguous amount:** If the owner says "gasté como quinientos" (approximate), register the round number and note it as estimated. Don't ask for exact amounts on small expenses — friction kills adoption.
- **Missing category:** If auto-categorization fails and the owner doesn't clarify, default to "Otros" and move on. Better to log imperfectly than not at all.
- **Duplicate expense:** If the same amount + category + date is logged twice within an hour, ask: "Ya registré S/500 en materiales hoy. ¿Este es un gasto adicional o es el mismo?"
- **Receipt OCR failure:** If the photo is blurry or not a receipt, ask for manual input: "No logro leer bien el comprobante. ¿Me dices el monto y de qué fue?"
- **Receipt is not a purchase receipt:** If the photo is a sales receipt (boleta de venta) or something unrelated, clarify: "Esto parece una boleta de venta, no un gasto. ¿Querías registrar un gasto o es un comprobante para un cliente?"
- **Forex API failure:** If forex-mcp is unavailable, ask the owner for the exchange rate they used: "No pude obtener el tipo de cambio. ¿A cuánto compraste el dólar?"
- **Negative profit day:** Don't panic the owner. Context matters: "Hoy tuviste más gastos que ventas (-S/500), pero fue por la compra fuerte de mercadería que dura toda la semana."
- **Recurring expense changed:** If a recurring expense amount changes, update the template and note the history: "Actualicé el alquiler de S/1,200 a S/1,300. El cambio queda registrado desde abril."
- **Expenses without receipts:** Common in LATAM informal economy (market purchases, taxis, tips). Accept without friction. Flag totals without comprobante in the accountant export.
- **Mixed personal and business expenses:** If the owner logs something that seems personal (e.g., "almuerzo S/15"), don't judge. Log it. Some owners track everything. If it's a pattern, gently ask: "¿Quieres que separe tus gastos personales de los del negocio?"
- **Very large expense:** For expenses above 2x the monthly average, confirm: "S/25,000 es un monto grande. ¿Confirmas el registro?" This catches typos (extra zero).
- **Currency confusion in border regions:** Peru/Ecuador, Colombia/Venezuela borders have dual-currency use. Always confirm currency if the owner is near a border and amount could be in either currency.
- **WhatsApp message limits:** Expense reports can get long. If the monthly report exceeds ~4,000 characters, split into 2-3 messages: summary first, then category detail, then insights.
- **Accountant export timing:** Accountants typically need data by the 5th of the following month. Proactively offer: "¿Quieres que prepare el resumen de marzo para tu contador?"
- **IGV edge case:** Not all purchases have IGV (informal vendors, exempt items). Don't assume IGV on expenses without a comprobante. Only track IGV when the owner provides a factura or it's clearly a formal purchase.
- **Retroactive expense logging:** Owner says "la semana pasada gasté S/800 en...". Accept past dates without friction. Ask for the date if vague: "¿Fue el lunes o martes?"
- **Zero-expense day:** Possible but unusual. If no expenses are logged by end of day, don't alert. Some days genuinely have no expenses.
