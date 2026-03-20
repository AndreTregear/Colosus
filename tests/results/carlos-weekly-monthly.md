# Test Evaluation: Carlos Medrano — Weekly & Monthly Scenarios (9–16)

**Persona:** Carlos Medrano, 33, Lima — MedranoCorp SAC (import/export electronics & superfoods)
**Evaluator:** Yaya Test Agent
**Date:** 2026-03-20
**Scope:** Scenarios 9–16 (Weekly items 9–12, Monthly items 13–16)

---

## Rating Scale

Each dimension rated 0–10:
- **Handleable** — Can the current skill+tool stack handle this at all?
- **Accuracy** — Would the response be factually correct?
- **Speed** — Can it respond within acceptable latency (< 10s)?
- **Completeness** — Does it answer everything Carlos needs?
- **Delight** — Would Carlos feel genuinely helped, not just answered?
- **Safety** — Does it avoid errors that could cause financial/legal harm?

---

## Scenario 9: Weekly Sales Summary with Comparison

### Carlos's Message
> "Oye, dame el resumen de ventas de esta semana comparado con la semana pasada. Quiero saber si estamos mejorando o nos fue peor."

### Skill Activation
- **Primary:** `yaya-analytics` — weekly sales report with period comparison
- **Secondary:** `yaya-crm` — customer counts, new vs returning

### MCP Tools Called
1. `erpnext-mcp` → Sales orders, revenue, order count for current week + previous week
2. `postgres-mcp` → Aggregation queries: revenue by day, top products, average order value, week-over-week delta
3. `crm-mcp` → `get_segments` for customer metrics, `search_contacts` for new customer count

### Ratings
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 9 | Analytics skill is purpose-built for this. Weekly report template exists. |
| Accuracy | 8 | Depends on ERPNext data completeness. Exchange rate impact on revenue NOT auto-calculated — Carlos sells in PEN but costs are in USD/RMB, so "revenue" alone is misleading without cost context. |
| Speed | 7 | Multiple MCP calls (ERPNext + postgres + CRM). May take 5-8s for aggregation. Acceptable. |
| Completeness | 7 | Revenue, order count, top products, customer metrics — all covered. **Missing:** Cost side (import costs in USD), actual margin, exchange rate impact on profitability. Carlos needs to know if he made MORE MONEY, not just more revenue. |
| Delight | 8 | WhatsApp-formatted, emoji-rich, scannable. Comparison with percentage deltas. Actionable insights at the end. |
| Safety | 9 | Read-only reporting. No financial risk. Only risk: Carlos makes restocking decisions based on incomplete margin data. |

### Gaps Identified
1. **🔴 No import cost tracking.** ERPNext has sales data, but Carlos's cost-of-goods (paid in USD/RMB) isn't integrated. Revenue comparison without margin is half the picture.
2. **🟡 No exchange rate context.** If PEN weakened 2% this week, his "8% revenue growth" might actually be flat in real terms.
3. **🟡 No `erpnext-mcp` tool listed in available MCP servers.** The analytics skill references it, but only `lago-mcp` and `crm-mcp` are implemented. This is a critical dependency gap.

### Ideal Agent Response
```
📊 Resumen semanal — 14 al 20 de marzo

💰 VENTAS
• Total: S/23,450 (142 pedidos)
• Semana anterior: S/21,200 (128 pedidos)
• Variación: ↗️ +10.6%
• Ticket promedio: S/165 (vs S/166 semana pasada)

🏆 TOP 5 PRODUCTOS
1. Funda iPhone 15 Pro Max — 89 uds — S/4,450
2. Cargador USB-C 20W — 67 uds — S/3,350
3. Cable Tipo C 2m — 54 uds — S/1,620
4. Audífonos BT — 38 uds — S/3,800
5. Funda Galaxy S24 — 31 uds — S/1,240

👥 CLIENTES
• Nuevos: 18 (vs 14 semana pasada)
• Conversaciones: 187
• Conversión: 76%

💳 COBROS
• Cobrado: S/21,890 (93%)
• Pendiente: S/1,560 (8 pedidos)
• Yape: 71% | BCP: 22% | Otro: 7%

💡 INSIGHTS
• Las fundas iPhone siguen siendo tu estrella — considera negociar mejor precio por volumen con tu proveedor
• 18 clientes nuevos es tu mejor semana del mes 🏆
• 8 pedidos sin pagar — ¿quieres que les mande recordatorio?
```

---

## Scenario 10: Stock Check with Conditional Reorder Decision

### Carlos's Message
> "Revisa cuánto stock de cables me queda. Si tenemos menos de 50 de cualquier tipo, necesito pedir a China. Dame la lista de los que están bajos."

### Skill Activation
- **Primary:** `yaya-analytics` — inventory insights, stock levels
- **Secondary:** `yaya-followup` — could trigger restock notification workflow if customer waitlists exist

### MCP Tools Called
1. `erpnext-mcp` → Item stock levels, filtered by category "cables"
2. `postgres-mcp` → Stock turnover rate, days-to-stockout calculation
3. `crm-mcp` → `search_contacts` for customers who asked about out-of-stock cables (for restock notifications)

### Ratings
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 6 | Analytics skill mentions inventory insights, but there's no dedicated inventory/warehouse MCP. Stock data lives in ERPNext which has no implemented MCP server. |
| Accuracy | 5 | If ERPNext MCP existed, accuracy would be high. Without it, agent can't access real stock data. Would need to fall back to asking Carlos or checking a spreadsheet. |
| Speed | 6 | Single query if data source exists. The conditional logic (< 50 threshold) is simple agent reasoning. |
| Completeness | 4 | Carlos also wants: (a) which specific SKUs are low, (b) recommended order quantity, (c) estimated time to stockout at current sell rate, (d) supplier MOQ context. Only (a) is answerable with current tools. |
| Delight | 7 | If it works, a formatted list with stock levels, sell rate, and days-to-stockout would be exactly what Carlos needs for his Alibaba order. |
| Safety | 8 | Reorder recommendations are advisory. Carlos makes the final purchase decision. Risk: recommending too few/too many based on incomplete velocity data. |

### Gaps Identified
1. **🔴 No `erpnext-mcp` server implemented.** This is the #1 blocker — inventory data is inaccessible.
2. **🔴 No inventory/warehouse MCP.** No tool to query real-time stock by SKU, category, or location (Callao warehouse).
3. **🟡 No supplier integration.** Can't check MOQ, current prices, or lead times from Alibaba/supplier. Carlos has to do this manually.
4. **🟡 No demand forecasting.** Agent can't calculate "at current sell rate, you'll run out in X days" without historical sales velocity data.
5. **🟢 Restock notification to waitlisted customers** — yaya-followup CAN handle this once stock arrives.

### Ideal Agent Response
```
📦 Stock de cables — Almacén Callao

⚠️ BAJO STOCK (menos de 50):
• Cable Tipo C 1m — 23 uds (vendes ~8/día → 3 días)
• Cable Tipo C 2m — 41 uds (vendes ~6/día → 7 días)
• Cable Lightning 1m — 12 uds (vendes ~3/día → 4 días) ❗
• Cable micro USB — 38 uds (vendes ~2/día → 19 días)

✅ STOCK OK:
• Cable Tipo C 3m — 87 uds
• Cable HDMI 2m — 62 uds

📋 RECOMENDACIÓN DE PEDIDO
Para 30 días de stock:
• Cable Tipo C 1m — pedir 240 uds
• Cable Tipo C 2m — pedir 180 uds
• Cable Lightning 1m — pedir 90 uds ← URGENTE, 4 días de stock
• Cable micro USB — pedir 60 uds

Total estimado: ~$850 USD al precio del último pedido

⏰ El Lightning está crítico — si tu proveedor tarda 15-20 días en enviar, vas a tener quiebre de stock.

¿Quieres que prepare el detalle para tu orden de Alibaba?
```

---

## Scenario 11: Electronic Invoice Generation (Factura Electrónica)

### Carlos's Message
> "Necesito emitir la factura electrónica para Empresa XYZ SAC, RUC 20456789012, por la venta de 200 fundas iPhone a S/25 c/u. Con IGV."

### Skill Activation
- **Primary:** `yaya-billing` — invoice generation
- **Secondary:** `yaya-crm` — look up or create business contact

### MCP Tools Called
1. `crm-mcp` → `search_contacts` (query: "Empresa XYZ" or RUC) to find/create contact
2. `lago-mcp` → `create_invoice` — generate invoice with line items
3. `crm-mcp` → `log_interaction` — log the invoicing event

### Ratings
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 3 | **Critical mismatch.** `yaya-billing` manages Yaya Platform's OWN subscription billing (B2B SaaS), NOT Carlos's business invoicing. `lago-mcp` is for Lago (Yaya's billing system), not SUNAT electronic invoicing. |
| Accuracy | 2 | Lago invoices ≠ SUNAT facturas electrónicas. Peru requires XML-signed documents with specific SUNAT format, series numbering (F001-xxxxx), QR codes, and submission to SUNAT's OSE. A Lago invoice would NOT satisfy SUNAT compliance. |
| Speed | N/A | Can't produce the correct output. |
| Completeness | 2 | Carlos needs: (a) SUNAT-compliant factura, (b) correct IGV calculation (18%), (c) XML submission to OSE/SUNAT, (d) PDF for customer, (e) proper series numbering. None of this exists. |
| Delight | 1 | Generating a wrong invoice is worse than not generating one. |
| Safety | 1 | **CRITICAL.** A non-SUNAT-compliant invoice could result in tax penalties, fines, or SUNAT audit flags. This is the highest-risk gap in the entire evaluation. |

### Gaps Identified
1. **🔴🔴 No SUNAT electronic invoicing skill/MCP.** This is a showstopper for any Peruvian business. Peru mandates electronic invoicing (facturación electrónica) since 2018 for most businesses.
2. **🔴 No SUNAT MCP server.** Need integration with a SUNAT-certified PSE/OSE provider (Nubefact, Efact, Bizlinks, etc.) to generate legally valid facturas and boletas.
3. **🔴 `yaya-billing` is mismatched.** It's the platform's own billing, not the customer's invoicing. Need a separate `yaya-invoicing` skill.
4. **🟡 IGV calculation logic.** 18% is straightforward, but the skill needs to handle: base imponible, IGV line, total, detracción (for amounts > S/700), and retención rules.
5. **🟡 No boleta vs factura distinction.** Facturas (B2B, with RUC) vs boletas (B2C, with DNI) have different SUNAT rules.

### Ideal Agent Response
```
📄 Factura Electrónica generada:

📋 DATOS
• Emisor: MedranoCorp SAC — RUC 20612345678
• Cliente: Empresa XYZ SAC — RUC 20456789012
• Serie: F001-00847

📦 DETALLE
• 200x Funda iPhone 15 — S/25.00 c/u

💰 TOTALES
• Subtotal (Base Imponible): S/4,237.29
• IGV (18%): S/762.71
• Total: S/5,000.00

✅ Enviada a SUNAT — CDR aceptada
📎 PDF: [link]

⚠️ Nota: El monto supera S/700, aplica detracción del 12%.
El cliente debe depositar S/600 en tu cuenta de detracciones BN.

¿Necesitas algo más?
```

---

## Scenario 12: Customer Debt Lookup (Multiple Unpaid Orders)

### Carlos's Message
> "Cuánto me debe el cliente Martínez? Creo que tiene como 3 pedidos sin pagar, necesito cobrarle."

### Skill Activation
- **Primary:** `yaya-crm` — customer lookup, interaction/purchase history
- **Secondary:** `yaya-analytics` — payment analytics, overdue amounts
- **Tertiary:** `yaya-followup` — payment reminder workflow

### MCP Tools Called
1. `crm-mcp` → `search_contacts` (query: "Martínez") — find customer
2. `crm-mcp` → `get_contact` (contact_id) — full history with interactions
3. `crm-mcp` → `list_deals` (contact_id, stage: open/pending) — outstanding deals
4. `erpnext-mcp` → Payment entries filtered by customer (unpaid/overdue)
5. `postgres-mcp` → Aggregate unpaid amounts by order

### Ratings
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 7 | CRM can find the customer and show deals/interactions. But actual order and payment data lives in ERPNext (unimplemented). Deals in CRM are a proxy but not the source of truth for accounts receivable. |
| Accuracy | 6 | CRM deal amounts may not perfectly match actual invoiced/paid amounts. If orders are logged as deals with amounts, it's approximate. Without ERPNext, can't verify payment status authoritatively. |
| Speed | 7 | 2-3 CRM API calls. Fast if data exists. |
| Completeness | 6 | Can show: who Martínez is, deal history, logged interactions. **Missing:** precise order numbers, exact payment status per order, aging report (how many days overdue each), payment method used. |
| Delight | 8 | If Carlos gets a clear "Martínez owes you S/X across 3 orders" with a button to send payment reminder, that's high delight. |
| Safety | 7 | Sending wrong debt amount could damage customer relationship. But Carlos will verify before confronting the customer. |

### Gaps Identified
1. **🟡 No accounts receivable view.** CRM deals ≠ invoices. Need ERPNext for authoritative payment tracking.
2. **🟡 No aging report.** Can't show "Order #1: 15 days overdue, Order #2: 8 days overdue."
3. **🟢 Follow-up skill CAN send payment reminders** — good integration point.
4. **🟡 Ambiguous search.** "Martínez" might match multiple contacts. Agent needs to disambiguate.

### Ideal Agent Response
```
🔍 Cliente: Juan Martínez — +51 987 123 456
📊 Segmento: Regular | Cliente desde: nov 2025

💳 DEUDA PENDIENTE: S/847

📋 Pedidos sin pagar:
1. Pedido #1089 (5 mar) — 20 fundas iPhone — S/300 ⏰ 15 días
2. Pedido #1102 (10 mar) — 10 cargadores USB-C — S/250 ⏰ 10 días  
3. Pedido #1118 (15 mar) — 15 cables Tipo C — S/297 ⏰ 5 días

📝 Nota: Sus últimos 5 pedidos anteriores los pagó entre 1-3 días. Este retraso es inusual para él.

¿Qué quieres hacer?
1. 📱 Le mando recordatorio de pago por WhatsApp
2. 📋 Te preparo el detalle para llamarlo
3. ⏸️ Marco los pedidos como en gestión de cobro
```

---

## Scenario 13: Monthly IGV Tax Declaration Prep

### Carlos's Message
> "Ya es fin de mes. Necesito preparar la declaración de IGV. Cuánto vendí con boleta y cuánto con factura? Necesito los montos separados para el PDT 621."

### Skill Activation
- **Primary:** `yaya-analytics` — monthly financial summary
- **Secondary:** `yaya-billing` — invoice data (but wrong billing system — see Scenario 11)

### MCP Tools Called
1. `erpnext-mcp` → All sales for the month, classified by document type (boleta/factura)
2. `postgres-mcp` → Aggregation: total boletas, total facturas, IGV collected, base imponible
3. `lago-mcp` → ❌ Wrong system. Lago is Yaya's billing, not Carlos's sales invoicing.

### Ratings
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 2 | **Cannot handle.** There is no SUNAT invoicing data source. The platform doesn't track boleta vs factura classification. Even if ERPNext existed, it would need specific Peru tax module configuration. |
| Accuracy | 1 | Without actual factura/boleta data from a SUNAT-connected system, any numbers would be fabricated or incomplete. |
| Speed | N/A | Can't produce valid output. |
| Completeness | 1 | Carlos needs for PDT 621: (a) total ventas gravadas (facturas), (b) total ventas gravadas (boletas), (c) IGV collected on sales, (d) IGV paid on purchases (crédito fiscal from import invoices), (e) net IGV payable, (f) income tax advance (pago a cuenta, 1.5% of gross). None available. |
| Delight | 0 | Tax compliance that's wrong is terrifying, not delightful. |
| Safety | 0 | **CRITICAL RISK.** Incorrect tax data → wrong SUNAT declaration → fines (up to 50% of unpaid tax), interest, potential audit. This is the most dangerous gap in the platform for Peruvian users. |

### Gaps Identified
1. **🔴🔴🔴 No SUNAT integration — top priority for Peru market.** Need:
   - SUNAT electronic invoicing (emisión de comprobantes)
   - Boleta/factura classification and tracking
   - Purchase invoice registry (registro de compras) for crédito fiscal
   - PDT 621 pre-fill data export
   - IGV calculation (ventas - compras)
2. **🔴 No purchase/expense tracking.** Carlos pays import costs, customs duties, warehouse rent, payroll — all generate crédito fiscal. Without purchase-side data, can't calculate net IGV.
3. **🔴 No `yaya-tax` or `yaya-accounting` skill.** This is a completely missing vertical.
4. **🟡 No integration with Peruvian accounting software** (Contasis, SIRE SUNAT, etc.)

### Ideal Agent Response
```
🧾 Preparación IGV — Marzo 2026 (PDT 621)

📊 VENTAS DEL MES

📄 Facturas (B2B):
• Cantidad: 47 facturas emitidas
• Base imponible: S/89,200
• IGV cobrado: S/16,056
• Total facturado: S/105,256

🧾 Boletas (B2C):
• Cantidad: 312 boletas emitidas
• Base imponible: S/34,800
• IGV cobrado: S/6,264
• Total boleteado: S/41,064

💰 RESUMEN IGV VENTAS
• Total base imponible: S/124,000
• Total IGV ventas: S/22,320

📥 CRÉDITO FISCAL (compras)
• Importaciones (DUA): S/8,450 IGV
• Compras locales: S/1,200 IGV
• Total crédito fiscal: S/9,650

🏦 IGV A PAGAR
• IGV ventas: S/22,320
• Crédito fiscal: -S/9,650
• IGV neto a pagar: S/12,670

📋 PAGO A CUENTA IR
• 1.5% de ingresos netos: S/1,860

📅 Vencimiento: según último dígito de RUC (8) → 22 de abril

⚠️ Revisa con tu contador antes de presentar. ¿Quieres que exporte esto en formato para el PDT?
```

---

## Scenario 14: Monthly P&L with Import Costs

### Carlos's Message
> "Dame el estado de resultados de este mes. Necesito ver cuánto gané de verdad, incluyendo lo que pagué por el container de China, los aranceles, el flete y los sueldos."

### Skill Activation
- **Primary:** `yaya-analytics` — monthly financial review, P&L
- **Secondary:** None of the other skills handle cost accounting

### MCP Tools Called
1. `erpnext-mcp` → Revenue data, COGS if available
2. `postgres-mcp` → Aggregation of income and expenses
3. ❌ No expense/cost tracking MCP

### Ratings
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 2 | Revenue side MIGHT work via ERPNext (if implemented). Cost side is completely absent. Import costs, customs duties, freight, payroll — none are tracked in any available system. |
| Accuracy | 1 | A P&L with only revenue is not a P&L. Any margin/profit figure would be a guess. |
| Speed | N/A | Can't produce valid output. |
| Completeness | 1 | Carlos needs: Revenue, COGS (landed cost per product including freight + duty + insurance), operating expenses (payroll, rent, utilities, transport), financial expenses (bank fees, exchange rate losses), net profit. Platform covers maybe 20% of this. |
| Delight | 0 | A half-P&L would frustrate Carlos more than help him. |
| Safety | 3 | Less dangerous than tax (Scenario 13) because P&L is internal. But bad P&L → bad business decisions (e.g., thinking he's profitable when he's not). |

### Gaps Identified
1. **🔴🔴 No expense/cost tracking system.** Need:
   - Purchase order tracking (USD/RMB amounts)
   - Landed cost calculation (product cost + freight + duty + insurance ÷ units)
   - Operating expense categories
   - Payroll integration (PLAME data)
2. **🔴 No multi-currency accounting.** Carlos buys in USD/RMB, sells in PEN. Need:
   - Exchange rate at time of purchase vs time of sale
   - Realized vs unrealized FX gains/losses
   - Average cost method or FIFO for inventory valuation
3. **🔴 No `erpnext-mcp` implemented.** Even ERPNext's P&L module isn't accessible.
4. **🟡 No integration with accounting software** (QuickBooks, Xero, or Peruvian: Contasis).

### Ideal Agent Response
```
📊 Estado de Resultados — Marzo 2026

💰 INGRESOS
• Ventas brutas: S/124,000
• Devoluciones: -S/1,200
• Ventas netas: S/122,800

📦 COSTO DE VENTAS
• Mercadería importada: S/52,300
  (Container #CTN-2026-08: $14,200 USD × 3.75 = S/53,250)
  (Ajustado por tipo de cambio promedio del mes)
• Aranceles + ad valorem: S/7,845
• Flete marítimo: S/4,200
• Agente de aduana: S/1,500
• Seguro de carga: S/680
• Total costo de ventas: S/66,525

📈 UTILIDAD BRUTA: S/56,275 (45.8% margen)

🏢 GASTOS OPERATIVOS
• Planilla (5 empleados): S/12,500
  (Incluye CTS, gratificación proporcional, EsSalud)
• Alquiler almacén Callao: S/3,500
• Transporte/delivery: S/2,800
• Servicios (luz, agua, internet): S/450
• Yaya Platform: S/249
• Otros gastos: S/1,200
• Total gastos operativos: S/20,699

💵 GASTOS FINANCIEROS
• Comisiones bancarias BCP: S/180
• Pérdida cambiaria: S/1,340
  (TC compra container: 3.68 → TC promedio mes: 3.75)
• Total gastos financieros: S/1,520

📊 UTILIDAD ANTES DE IMPUESTOS: S/34,056

🏦 IMPUESTOS ESTIMADOS
• Pago a cuenta IR (1.5%): S/1,842
• IGV neto (ya calculado): S/12,670

💰 UTILIDAD NETA ESTIMADA: S/32,214

📈 Margen neto: 26.2% — ¡Buen mes, Carlos! 💪

💡 INSIGHTS
• Tu margen bruto es saludable (45.8%). El costo del container representó el 43% de tus ventas.
• La pérdida cambiaria de S/1,340 se debe a que el dólar subió entre que pagaste el container y hoy. Considera fijar TC con tu banco la próxima vez.
```

---

## Scenario 15: Profit Per Product (Margin Analysis)

### Carlos's Message
> "Quiero ver cuánto gano por cada producto este mes. Cuáles me dan mejor margen y cuáles estoy vendiendo casi al costo? Necesito decidir qué dejo de importar."

### Skill Activation
- **Primary:** `yaya-analytics` — product performance, margin analysis
- **Secondary:** None (cost data missing from all available tools)

### MCP Tools Called
1. `erpnext-mcp` → Product sales data (revenue per SKU)
2. `postgres-mcp` → Cross-reference with purchase costs
3. ❌ No landed cost per SKU available

### Ratings
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 2 | Can show revenue per product. Cannot show cost per product (landed cost including freight allocation, duties). Without cost, margin = impossible. |
| Accuracy | 1 | Revenue-only "margin" is meaningless. Each product has different FOB cost, different weight (freight allocation), different HS code (duty rate). |
| Speed | N/A | Can't produce valid output. |
| Completeness | 1 | Carlos needs: sell price, landed cost (FOB + freight share + duty + insurance share), margin %, volume, total margin contribution. None of the cost side exists. |
| Delight | 0 | This is THE question that keeps Carlos up at night ("No analytics: makes gut decisions, doesn't know true profit per product"). Failing here fails his core pain point. |
| Safety | 4 | Incorrect margin data → Carlos drops a profitable product or keeps importing a loss-maker. Material business harm. |

### Gaps Identified
1. **🔴🔴 No landed cost calculation engine.** This is import/export 101:
   - FOB price per unit (from supplier invoice, in USD/RMB)
   - Freight allocation (by weight or volume per SKU)
   - Duty rate per HS code (ad valorem % varies by product)
   - Insurance allocation
   - Customs broker fee allocation
   - Exchange rate at time of purchase
2. **🔴 No product costing MCP.** Need either ERPNext landed cost module or custom tool.
3. **🟡 No HS code / tariff database.** Peru's arancel varies by product — electronics accessories have different rates.

### Ideal Agent Response
```
📊 Margen por producto — Marzo 2026

🏆 MEJORES MÁRGENES
1. Cargador USB-C 20W
   • Venta: S/50 | Costo total: S/18.50 | Margen: 63% 🔥
   • Vendidos: 67 uds → Ganancia: S/2,110

2. Funda iPhone 15 Pro Max
   • Venta: S/25 | Costo total: S/8.20 | Margen: 67% 🔥
   • Vendidos: 89 uds → Ganancia: S/1,494

3. Cable Tipo C 2m
   • Venta: S/30 | Costo total: S/11.40 | Margen: 62%
   • Vendidos: 54 uds → Ganancia: S/1,004

⚠️ MÁRGENES BAJOS
4. Audífonos Bluetooth genéricos
   • Venta: S/100 | Costo total: S/78.50 | Margen: 21.5%
   • Vendidos: 38 uds → Ganancia: S/817
   • ⚠️ Con el TC actual, tu margen real es ~18%

5. Cable micro USB
   • Venta: S/15 | Costo total: S/12.80 | Margen: 14.7% ❌
   • Vendidos: 22 uds → Ganancia: S/48
   • 💡 Casi no vale la pena importarlo

❌ PRODUCTOS EN PÉRDIDA
6. Protector de pantalla genérico
   • Venta: S/10 | Costo total: S/11.20 | Margen: -12% 📉
   • Vendidos: 45 uds → Pérdida: -S/54
   • 🚫 Estás perdiendo plata con este producto

💡 RECOMENDACIONES
• Duplica pedido de cargadores USB-C — mejor margen + alta demanda
• Sube precio de audífonos BT a S/119 o negocia mejor FOB
• Evalúa dejar de importar protectores de pantalla
• El cable micro USB tiene demanda en caída — fase out gradual

¿Quieres que simule el impacto de subir precios en los productos de bajo margen?
```

---

## Scenario 16: Bulk Discount Analysis (Buy Decision)

### Carlos's Message
> "Mi proveedor de Shenzhen me ofrece 15% de descuento si pido 5000 unidades de fundas iPhone. Normalmente pido 1000. ¿Vale la pena? Cuánto me tardaría en venderlas y cuánto más gano?"

### Skill Activation
- **Primary:** `yaya-analytics` — sales velocity, demand forecasting, financial projection
- **Secondary:** `yaya-crm` — customer demand signals (inquiries about fundas)

### MCP Tools Called
1. `erpnext-mcp` → Historical sales velocity for fundas iPhone (units/week, trend)
2. `postgres-mcp` → Demand trend analysis, seasonality
3. `crm-mcp` → `search_contacts` or interaction queries — how many customers asked about fundas recently
4. ❌ No financial modeling tool

### Ratings
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 4 | Sales velocity data MIGHT exist in ERPNext. But the multi-factor analysis Carlos needs (cash flow impact, storage cost, opportunity cost, demand risk, exchange rate risk) requires financial modeling that no skill provides. |
| Accuracy | 3 | Historical velocity is a starting point, but predicting future demand for 5000 units (5x normal) is speculative. Agent can't account for market saturation, new iPhone release timing, or competitor pricing. |
| Speed | 5 | If data exists, the calculation itself is fast. Agent reasoning can handle the math. |
| Completeness | 3 | Carlos needs: (a) time to sell 5000 units at current rate, (b) cash flow impact (paying 5x upfront), (c) storage cost for 5x inventory, (d) risk of new iPhone model making cases obsolete, (e) exchange rate risk on larger USD outlay, (f) comparison: 5x1000 orders vs 1x5000. Most of this requires judgment the agent can provide but can't back with data. |
| Delight | 6 | Even a rough analysis with clearly stated assumptions would be valuable. Carlos currently makes this decision by gut feeling. |
| Safety | 5 | Recommending a 5x purchase that turns out wrong could tie up significant capital (~$10K+ USD). Agent should heavily caveat. |

### Gaps Identified
1. **🟡 No financial modeling/projection tool.** Agent can do basic math, but a proper buy-decision model needs: NPV, cash flow projection, break-even analysis.
2. **🔴 No landed cost data** (same as Scenarios 14-15). Can't calculate actual margin improvement from 15% FOB discount.
3. **🟡 No cash flow tracking.** Can't assess whether Carlos HAS the cash or would need to borrow (and at what cost).
4. **🟡 No storage cost data.** 5000 units need warehouse space — is Callao warehouse big enough? What's the cost?
5. **🟡 No market intelligence.** When does the next iPhone launch? When do fundas for new models obsolete old ones?

### Ideal Agent Response
```
🧮 Análisis: ¿5000 fundas con 15% descuento?

📊 TUS DATOS ACTUALES
• Ventas promedio: 89 fundas/semana (últimos 3 meses)
• Tendencia: ↗️ +5% mensual
• Pedido normal: 1,000 uds cada ~11 semanas
• Precio de venta: S/25 c/u
• Costo actual (sin descuento): $1.80 USD/ud → S/6.75 (TC 3.75)

📦 ESCENARIO A: 5x pedidos de 1,000 (sin descuento)
• Costo total: $9,000 USD (pagado en 5 cuotas)
• Costo por unidad: S/6.75
• Margen por unidad: S/18.25 (73%)
• Ganancia total: S/91,250
• Tiempo: ~56 semanas

📦 ESCENARIO B: 1 pedido de 5,000 (con 15% descuento)
• Costo total: $7,650 USD (pago único)
• Costo por unidad: S/5.74
• Margen por unidad: S/19.26 (77%)
• Ganancia total: S/96,300
• Tiempo para vender: ~56 semanas
• Ahorro neto: S/5,050 (+5.5%)

✅ VENTAJAS
• Ahorras S/5,050 en costo de mercadería
• +4 puntos de margen (73% → 77%)
• Un solo proceso de importación (ahorras ~S/3,000 en agente + trámites)
• Total beneficio real: ~S/8,050

⚠️ RIESGOS
• Necesitas ~$7,650 USD de golpe (S/28,688)
  → Hoy tu cash flow mensual libre es ~S/15,000
  → Necesitarías ~2 meses de flujo libre
• 5,000 fundas = ~12 meses de inventario
  → Si Apple lanza iPhone 16 en sept, las fundas iPhone 15 bajan de demanda
  → Podrías quedarte con 2,000+ uds de lenta rotación
• Riesgo cambiario: si el dólar sube a 3.90, tu ahorro se reduce
• Almacenaje: 5,000 uds ocupan ~2m³, verifica espacio en Callao

💡 MI RECOMENDACIÓN
Pide 3,000 en vez de 5,000. Negocia el 15% por 3,000 uds (muchos proveedores aceptan). Así:
• Reduces riesgo de obsolescencia a ~8 meses de stock
• Inversión más manejable (~$4,590 USD)
• Sigues capturando la mayoría del ahorro

¿Quieres que te ayude a redactar el mensaje al proveedor en inglés/mandarín?
```

---

## Summary: Gap Analysis

### Critical Gaps (🔴🔴 — Must Build for Peru Market)

| # | Gap | Impact | Needed |
|---|-----|--------|--------|
| 1 | **No SUNAT electronic invoicing** | Cannot legally invoice in Peru | `yaya-invoicing` skill + `sunat-mcp` server (via Nubefact/Efact API) |
| 2 | **No tax declaration support** | Monthly IGV/IR compliance impossible | `yaya-tax` skill with PDT 621 data prep, purchase registry |
| 3 | **No `erpnext-mcp` server** | Sales, inventory, payments all inaccessible | Implement ERPNext MCP server (referenced by skills but not built) |
| 4 | **No expense/cost tracking** | P&L impossible, margins unknown | Expense tracking module, purchase order system |
| 5 | **No landed cost calculation** | Per-product margin unknown | Import cost allocation engine (FOB + freight + duty ÷ units) |

### Important Gaps (🟡 — Should Build)

| # | Gap | Impact | Needed |
|---|-----|--------|--------|
| 6 | **No multi-currency accounting** | FX gains/losses invisible, true cost unknown | Exchange rate service + multi-currency ledger |
| 7 | **No inventory MCP** | Stock levels inaccessible in real-time | Warehouse/inventory MCP or ERPNext stock module access |
| 8 | **No demand forecasting** | Reorder decisions are gut-based | Sales velocity analysis + simple projection model |
| 9 | **No cash flow tracking** | Can't assess purchase capacity | Cash flow module or bank integration |
| 10 | **No supplier integration** | Can't pull MOQ, prices, lead times | Optional — manual input is acceptable initially |

### What Works Well (✅)

| Capability | Skill | Notes |
|------------|-------|-------|
| Customer lookup & history | yaya-crm | CRM MCP is solid for contact management |
| Customer segmentation | yaya-crm | VIP/regular/dormant classification works |
| Payment reminders | yaya-followup | Escalating reminder sequence is well-designed |
| Report formatting | yaya-analytics | WhatsApp-first formatting is excellent |
| Period comparison | yaya-analytics | Week-over-week, month-over-month templates ready |
| Restock notifications | yaya-followup | Can alert customers when products return |

### Overall Scores by Scenario

| # | Scenario | Handleable | Accuracy | Speed | Complete | Delight | Safety | AVG |
|---|----------|-----------|----------|-------|----------|---------|--------|-----|
| 9 | Weekly sales summary | 9 | 8 | 7 | 7 | 8 | 9 | **8.0** |
| 10 | Stock check + reorder | 6 | 5 | 6 | 4 | 7 | 8 | **6.0** |
| 11 | Electronic invoice (SUNAT) | 3 | 2 | — | 2 | 1 | 1 | **1.8** |
| 12 | Customer debt lookup | 7 | 6 | 7 | 6 | 8 | 7 | **6.8** |
| 13 | IGV tax declaration | 2 | 1 | — | 1 | 0 | 0 | **0.8** |
| 14 | Monthly P&L | 2 | 1 | — | 1 | 0 | 3 | **1.4** |
| 15 | Profit per product | 2 | 1 | — | 1 | 0 | 4 | **1.6** |
| 16 | Bulk discount analysis | 4 | 3 | 5 | 3 | 6 | 5 | **4.3** |

**Weekly Average: 5.7 / 10**
**Monthly Average: 2.0 / 10**
**Overall Average: 3.8 / 10**

### Verdict

The platform handles **customer-facing** weekly tasks reasonably well (CRM lookups, sales summaries, follow-ups). It **completely fails** on monthly financial/tax/compliance tasks that are critical for a Peruvian import/export business. The SUNAT invoicing and tax declaration gaps are **showstoppers** — no Peruvian business can operate without them. The missing `erpnext-mcp` server is a foundational blocker since 3 of 4 skills reference it but it doesn't exist.

**Priority roadmap for Carlos's use case:**
1. Build `erpnext-mcp` server (unblocks scenarios 9, 10, 12, 14, 15)
2. Build `sunat-mcp` server + `yaya-invoicing` skill (unblocks 11, 13)
3. Add expense/cost tracking + landed cost calculator (unblocks 14, 15)
4. Add multi-currency support with exchange rate service (improves all financial scenarios)
5. Add basic demand forecasting to analytics (improves 10, 16)
