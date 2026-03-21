# Test Results: Marco Silva — Arequipa Textiles Manufacturer

**Persona:** Marco Silva Zúñiga, 40, Arequipa, Peru
**Business:** Textiles Sillar EIRL — Alpaca wool textiles manufacturer & exporter
**Revenue:** ~S/850,000/year | **Regime:** Régimen General | **RUC:** 20456789123
**Team:** 12 employees | **Channels:** B2B wholesale (60%), retail (25%), export (15%)
**Test Date:** 2026-03-20
**Tester:** Subagent (marco-full)
**Focus Areas:** B2B invoicing, export documentation, production scheduling, Karrio shipping, raw material sourcing, SUNAT drawback claims

---

## Executive Summary

| Dimension | Score | Notes |
|-----------|-------|-------|
| **Overall Handleability** | 5.8/10 | Core invoicing and tax strong; production, export, and manufacturing gaps are critical |
| **B2B Invoicing** | 8.0/10 | Excellent — invoicing-mcp handles facturas, boletas, credit notes natively |
| **Export Documentation** | 2.5/10 | Major gap — no certificate of origin, packing list, or commercial invoice for export |
| **Production Scheduling** | 1.0/10 | Not covered — no loom/production/manufacturing skill or MCP tool |
| **Karrio Shipping** | 6.5/10 | Domestic and international rate comparison + tracking exist; no Olva/Shalom integration |
| **Raw Material Sourcing** | 3.0/10 | ERPNext can track inventory but no supplier management, fiber grading, or PO workflow |
| **SUNAT Drawback Claims** | 1.5/10 | Not covered — no drawback calculation, documentation, or SUNAT filing tool |
| **Tax Compliance** | 7.5/10 | Régimen General obligations, IGV calc, deadline reminders all work well |
| **Payment Management** | 7.0/10 | Payment validation, reconciliation, reminders all present; no SWIFT/wire tracking |
| **Analytics** | 6.0/10 | General sales analytics exist but no production-specific metrics |
| **CRM** | 6.5/10 | B2C focused; lacks B2B relationship features (net-30 terms, purchase orders, account management) |
| **Escalation** | 8.0/10 | Strong frustration detection and handoff — relevant for fiber quality disputes |

---

## Scenario-by-Scenario Analysis

### CORE BUSINESS OPERATIONS

#### Scenario 1: Raw Material Availability Check
> "La boutique Kuna de Miraflores me pidió 50 chalinas baby alpaca en 3 colores: 20 gris, 15 beige, 15 terracota. Fecha de entrega: 2 semanas. ¿Tengo suficiente fibra para producir eso?"

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Handleable | 3 | ERPNext `check_stock` can check raw material quantities, but no BOM (Bill of Materials) or fiber-to-product conversion calculation exists |
| Accuracy | 2 | Cannot calculate fiber requirements per chalina (kg of baby alpaca per scarf by color). Would need BOM data to answer accurately |
| Speed | 4 | Multi-step: check fiber stock → calculate requirements → compare. Would need agent reasoning since no tool does this automatically |
| Completeness | 2 | Can answer "how much fiber in stock" but NOT "is it enough for 50 chalinas" — needs production math |
| Delight | 2 | Marco expects a definitive yes/no with quantities. Agent would give partial/uncertain answer |
| Safety | 7 | Low risk — worst case is a vague answer, not wrong action |

**Coverage:** ⚠️ PARTIALLY COVERED
**Gap:** No BOM (Bill of Materials) system. No fiber-to-product conversion rates. ERPNext has BOM functionality but no MCP tool exposes it. Need `get_bom`, `check_material_availability` tools.

---

#### Scenario 2: Production Scheduling
> "Necesito programar la producción de la semana. Tengo estos pedidos pendientes: [lista de 6 órdenes con cantidades y fechas]. Distribúyelos entre mis 8 telares."

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Handleable | 1 | No production scheduling skill or MCP tool. No loom tracking. No capacity planning |
| Accuracy | 1 | Cannot assign orders to specific looms or calculate production time per product |
| Speed | 1 | Would require a completely custom solution |
| Completeness | 1 | Zero coverage for manufacturing/production scheduling |
| Delight | 1 | Marco's biggest pain point — whiteboard chaos — completely unaddressed |
| Safety | 5 | No risk since it can't do anything wrong; it just can't do anything |

**Coverage:** ❌ NOT COVERED
**Gap:** CRITICAL — No production scheduling, capacity planning, loom management, or work order tracking. This is Marco's #1 pain point. Need a `yaya-production` skill and either ERPNext Work Orders via MCP or a custom production MCP server.

---

#### Scenario 3: Raw Material Receipt Registration
> [Photo of raw alpaca fiber] "Me llegó este lote de fibra de Juliaca. Registra: 50kg baby alpaca gris, 30kg superfine blanco, calidad grado A. Proveedor: Cooperativa San Juan de Puno."

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Handleable | 4 | ERPNext can create Stock Entries (Material Receipt) but the MCP server doesn't expose stock entry creation directly; only `check_stock` and `create_order` exist |
| Accuracy | 3 | Fiber grades (baby alpaca, superfine, huacaya) aren't standard ERPNext item attributes — need custom fields |
| Speed | 5 | Could partially work with `create_order` (Purchase Receipt) if adapted, but clunky |
| Completeness | 3 | Can't handle: fiber grading, supplier registration, quality notes, lot tracking |
| Delight | 3 | Marco expects "registered ✅" but would get partial acknowledgment at best |
| Safety | 6 | Minor risk of incorrect stock entry, but low impact |

**Coverage:** ⚠️ PARTIALLY COVERED
**Gap:** ERPNext MCP needs `create_stock_entry`, `create_purchase_receipt`, `manage_suppliers` tools. Also needs support for item variants with custom attributes (fiber grade, color, micron count).

---

#### Scenario 4: Order Status Tracking
> "El pedido #2024-087 para la tienda Alpaca 111 de Cusco — ¿en qué etapa está? ¿Ya salió del telar o está en acabado?"

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Handleable | 4 | `get_order` can fetch order status from ERPNext, but production stages (telar → acabado → empaque) aren't tracked |
| Accuracy | 3 | ERPNext order status (Draft, Submitted, Completed) doesn't map to manufacturing stages |
| Speed | 7 | Single tool call to get basic order info |
| Completeness | 2 | Can say "order exists, status X" but NOT "it's on loom 3, 60% complete, finishing tomorrow" |
| Delight | 2 | Marco wants production stage detail; gets only billing/delivery status |
| Safety | 8 | Read-only query, no risk |

**Coverage:** ⚠️ PARTIALLY COVERED
**Gap:** No manufacturing execution system (MES) integration. Need production stage tracking: raw material → on loom → finishing → quality check → packaging → shipped.

---

#### Scenario 5: Finished Goods Inventory Check
> "Cuántas ponchos tengo listos en almacén? Un cliente gringo quiere comprar 5 directamente en mi taller."

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Handleable | 7 | `check_stock` and `search_products` can check finished goods inventory |
| Accuracy | 7 | If products are properly set up in ERPNext with warehouse locations, this works |
| Speed | 9 | Single tool call |
| Completeness | 6 | Can tell quantity; can't distinguish "ready to sell" vs "allocated to existing orders" without stock reservation |
| Delight | 7 | "Tienes 12 ponchos en almacén" — satisfactory answer |
| Safety | 8 | Read-only, low risk |

**Coverage:** ✅ FULLY COVERED (with minor reservation caveat)

---

### PRICING & PAYMENTS

#### Scenario 6: Wholesale Price Calculation with Margin
> "Necesito cotizar para un nuevo cliente en Lima: 100 mantas alpaca blend (70% alpaca, 30% acrílico), tamaño 1.5m x 2m. ¿Cuál debería ser mi precio mayorista manteniendo 40% de margen?"

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Handleable | 4 | No cost calculation tool. Agent could do math reasoning (cost × 1.4 = price) but doesn't know production costs |
| Accuracy | 3 | Without BOM and cost data, margin calculation is guesswork |
| Speed | 5 | Agent could reason about pricing if costs were provided verbally |
| Completeness | 3 | Can't factor in: fiber cost per kg, labor per manta, overhead allocation, blend cost |
| Delight | 3 | Marco wants a precise number backed by cost analysis. Gets general advice at best |
| Safety | 5 | Risk of suggesting unprofitable pricing without cost data |

**Coverage:** ⚠️ PARTIALLY COVERED
**Gap:** No cost accounting, BOM costing, or margin calculator. ERPNext has product costing but it's not exposed via MCP.

---

#### Scenario 7: Payment Reminder for Overdue B2B Invoice
> "La boutique Artesanías del Sur me debe 3 facturas vencidas. Total: S/4,200. Ya pasaron 45 días. Mándales un recordatorio profesional pero firme."

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Handleable | 7 | `yaya-followup` + `payments-mcp` (create_payment_reminder) can send WhatsApp reminders. `list_pending_payments` can find overdue orders |
| Accuracy | 7 | Can identify overdue payments and send personalized reminders |
| Speed | 6 | Multi-step: find overdue invoices → compose message → send reminder |
| Completeness | 6 | Sends reminder but lacks: formal collection letter template, accounts receivable aging report, credit terms management |
| Delight | 6 | Decent — sends a professional reminder. Missing: escalating tone for 45-day overdue, formal "carta de cobranza" format |
| Safety | 7 | Low risk — sending a reminder is benign |

**Coverage:** ⚠️ PARTIALLY COVERED
**Gap:** No B2B accounts receivable aging report. No formal collection letter templates. No credit terms tracking per client (net-30, net-60). `yaya-followup` is B2C-oriented; B2B collections need different tone and escalation paths.

---

#### Scenario 8: FOB Export Pricing
> "Un comprador de Brooklyn me pide cotización FOB Callao por 200 scarves baby alpaca. Necesito precio en USD incluyendo mi margen, empaque de exportación y transporte Arequipa-Callao."

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Handleable | 3 | No FOB pricing calculator. Karrio can quote Arequipa→Callao shipping, but no export packing cost, no margin calc, no USD conversion tool |
| Accuracy | 2 | Would need: production cost + packing cost + domestic freight + margin → FOB price in USD |
| Speed | 4 | Multiple tool calls needed (shipping rates, forex rate), plus manual calculations |
| Completeness | 2 | Can get shipping rates and maybe exchange rate, but can't assemble a complete FOB quotation |
| Delight | 2 | Marco needs a professional export quotation template. Gets partial info |
| Safety | 6 | Risk of underquoting if costs aren't properly calculated |

**Coverage:** ⚠️ PARTIALLY COVERED
**Gap:** No export quotation generator. No FOB/CIF/EXW Incoterms price calculator. `forex-mcp` exists but limited. Need export pricing skill that combines: production cost + packing + inland freight + port charges + margin → FOB/CIF quote in USD.

---

### INVOICING (InvoiceShelf / SUNAT)

#### Scenario 9: B2B Factura Electrónica
> "Emite factura electrónica para Kuna SAC, RUC 20512345678. 50 chalinas baby alpaca a S/85 c/u. Condiciones: crédito 30 días."

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Handleable | 9 | `invoicing-mcp` has `lookup_ruc` + `create_invoice` with document_type="01". Supports payment_terms, due_date |
| Accuracy | 9 | Full SUNAT-compliant factura: RUC validation, IGV calculation, series generation, CDR response |
| Speed | 8 | 2 tool calls: validate RUC → create invoice |
| Completeness | 8 | Handles: RUC validation, line items, IGV, payment terms, PDF generation. Missing: crédito 30 días tracking in AR |
| Delight | 8 | Professional SUNAT-compliant factura with PDF link. Marco would be satisfied |
| Safety | 9 | RUC validation prevents errors. PSE handles SUNAT submission |

**Coverage:** ✅ FULLY COVERED

---

#### Scenario 10: Retail Boleta with Card Payment
> "El gringo que compró en mi taller quiere boleta. Fueron 2 ponchos a S/350 cada uno y 3 chalinas a S/120. Pagó con Visa."

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Handleable | 8 | `create_invoice` with document_type="03" (boleta). Can use anonymous or with passport/CE |
| Accuracy | 8 | Correct boleta generation with multiple line items, IGV included |
| Speed | 8 | Single tool call (or 2 if DNI lookup needed) |
| Completeness | 7 | Boleta works. Card payment recording may need manual note since `payments-mcp` doesn't have a "card" method well-integrated |
| Delight | 8 | Quick boleta emission with PDF. Good |
| Safety | 8 | Low risk |

**Coverage:** ✅ FULLY COVERED

---

#### Scenario 11: Export Invoice (Factura de Exportación)
> "Necesito preparar la factura de exportación para el envío a USA. Comprador: Andean Imports LLC, New York. 200 scarves, USD 22 cada uno, FOB Callao. ¿Qué datos necesito?"

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Handleable | 5 | `create_invoice` supports USD currency and exchange_rate. But export invoices have special SUNAT requirements not fully implemented |
| Accuracy | 4 | Export facturas (tipo operación: exportación) need special SUNAT codes, zero-rated IGV (operación no gravada), and Incoterms fields. Current invoicing-mcp doesn't distinguish export from domestic |
| Speed | 6 | Could generate a USD invoice, but wouldn't be fully SUNAT-export-compliant |
| Completeness | 3 | Missing: export operation type code, Incoterms (FOB/CIF), port of embarkation, zero-rated IGV for exports, complementary export documents |
| Delight | 3 | Marco needs a full export factura package. Gets a partial invoice |
| Safety | 5 | Risk of SUNAT rejection if export codes are wrong |

**Coverage:** ⚠️ PARTIALLY COVERED
**Gap:** CRITICAL for Marco's 15% export revenue. `invoicing-mcp` needs export-specific fields: operation type "0200" (exportación), zero-rated IGV, Incoterms, shipping port, destination country. Also needs Guía de Remisión Remitente (document type 09) for goods transport.

---

#### Scenario 12: Credit Note for Incorrect Factura
> "Hice mal una factura — puse 50 unidades pero eran 45. La boutique ya la recibió. ¿Cómo hago la nota de crédito?"

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Handleable | 9 | `create_credit_note` with reason_code="02" (corrección por error). Full SUNAT compliance |
| Accuracy | 9 | Correctly references original factura, calculates difference (5 units × price), proper IGV adjustment |
| Speed | 7 | Agent needs to: explain process → get confirmation → issue credit note → issue corrected factura |
| Completeness | 8 | Credit note + new corrected factura flow is well-supported |
| Delight | 8 | Clear explanation of the process, professional handling |
| Safety | 8 | Credit note is the correct SUNAT procedure for corrections |

**Coverage:** ✅ FULLY COVERED

---

### SHIPPING & LOGISTICS (Karrio)

#### Scenario 13: Domestic Shipping Quote (Lima)
> "Necesito enviar 3 cajas a Lima (Kuna Miraflores). Peso total 15kg. ¿Me cotizas Olva Courier vs. Shalom? Necesito que llegue en máximo 3 días."

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Handleable | 5 | Karrio MCP has `get_shipping_rates` for multi-carrier comparison. But Olva Courier and Shalom are Peruvian regional carriers unlikely to be in Karrio's 50+ carrier list |
| Accuracy | 4 | Karrio supports DHL, FedEx, UPS etc. — not Peruvian domestic couriers (Olva, Shalom, Cruz del Sur Cargo) |
| Speed | 7 | Single tool call if carriers exist |
| Completeness | 3 | Can't compare the two specific carriers Marco uses. Could quote DHL/FedEx domestic, but that's not what Marco wants |
| Delight | 3 | Marco specifically names Olva and Shalom. If they're not available, it's a miss |
| Safety | 7 | No risk — just information |

**Coverage:** ⚠️ PARTIALLY COVERED
**Gap:** Karrio likely doesn't integrate Peruvian domestic couriers (Olva Courier, Shalom Empresarial, Cruz del Sur Cargo). These are critical for Marco's domestic B2B shipments. Need to verify Karrio carrier list or build adapters. Alternative: direct API integration with these carriers.

---

#### Scenario 14: International Shipment Tracking (DHL to NYC)
> "El envío internacional a New York — necesito tracking. ¿Ya lo recogió DHL? El cliente me está preguntando todos los días."

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Handleable | 8 | Karrio `track_package` supports DHL tracking with full event history |
| Accuracy | 8 | Real-time tracking with status, location, estimated delivery |
| Speed | 9 | Single tool call with tracking number |
| Completeness | 8 | Full event history, current status, ETA. Missing: proactive tracking updates to Marco's client |
| Delight | 8 | "Tu envío está en tránsito, salió de Lima ayer, ETA: jueves 22" — exactly what Marco needs |
| Safety | 9 | Read-only, no risk |

**Coverage:** ✅ FULLY COVERED (assuming DHL is configured in Karrio)

---

#### Scenario 15: Pickup Scheduling
> "Coordina el recojo de un pallet desde mi taller para el envío a Callao. Necesito que el transportista venga mañana entre 9am y 12pm."

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Handleable | 7 | Karrio `schedule_pickup` supports address, date, ready time, closing time |
| Accuracy | 7 | Can schedule DHL/FedEx pickup at Marco's Arequipa workshop |
| Speed | 8 | Single tool call |
| Completeness | 6 | Pickup scheduling works for international carriers. For domestic transport to Callao port, Marco likely uses freight forwarders not in Karrio |
| Delight | 7 | Functional pickup scheduling. Missing: freight forwarder coordination for port delivery |
| Safety | 7 | Mutating action but with confirmation flow |

**Coverage:** ⚠️ PARTIALLY COVERED (DHL/FedEx pickup: yes. Domestic freight to port: no)

---

### ANALYTICS (Metabase)

#### Scenario 16: Product Margin Analysis
> "Quiero ver qué productos me dan más margen. Compara chalinas vs. ponchos vs. mantas — ventas y rentabilidad de los últimos 6 meses."

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Handleable | 5 | `yaya-analytics` can pull sales data from ERPNext. But margin analysis needs cost data (fiber + labor) which isn't tracked per product |
| Accuracy | 4 | Can show revenue by product line. Cannot calculate margin without BOM costs |
| Speed | 6 | Multi-query: sales by product category, then calculate if costs available |
| Completeness | 3 | Revenue comparison: yes. Margin/profitability: no. This is Marco's blind spot — he doesn't know true cost per piece |
| Delight | 4 | Marco wants margin analysis. Gets only revenue comparison |
| Safety | 7 | Read-only |

**Coverage:** ⚠️ PARTIALLY COVERED
**Gap:** No production cost tracking per SKU. Need BOM costing: fiber cost (by grade/color) + labor (piece-rate by product type) + overhead = cost per unit. Then margin = price - cost.

---

#### Scenario 17: Fiber Usage Optimization
> "¿Cuánto fiber estoy usando por metro de tela? Necesito optimizar — siento que estoy desperdiciando mucho."

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Handleable | 1 | No fiber consumption tracking, yield analysis, or waste measurement tool |
| Accuracy | 1 | Cannot measure input vs output ratios |
| Speed | 1 | No tool exists |
| Completeness | 1 | Complete gap |
| Delight | 1 | Marco's instinct about waste can't be validated or quantified |
| Safety | 5 | No risk since nothing happens |

**Coverage:** ❌ NOT COVERED
**Gap:** Need manufacturing analytics: raw material consumption per unit, yield rates, waste tracking, fiber-to-finished-goods conversion efficiency.

---

#### Scenario 18: Sales Channel Analysis
> "Dame el análisis de ventas por canal: boutiques Lima, boutiques Cusco, retail directo, exportación. ¿Dónde debería enfocarme?"

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Handleable | 6 | ERPNext + postgres-mcp can segment sales by customer/region if properly tagged. `yaya-analytics` supports channel breakdown |
| Accuracy | 6 | Depends on ERPNext customer tagging (Lima boutiques vs Cusco vs export). If tagged, accurate |
| Speed | 6 | Multi-query aggregation |
| Completeness | 5 | Can show revenue by channel. Missing: profitability by channel (export has higher margins but more overhead) |
| Delight | 6 | Decent channel breakdown with recommendations |
| Safety | 8 | Read-only |

**Coverage:** ⚠️ PARTIALLY COVERED

---

#### Scenario 19: Weaver Productivity Analysis
> "¿Cuál de mis tejedores produce más metros por semana? Necesito saber para asignar los pedidos urgentes."

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Handleable | 1 | No workforce/labor tracking system. No piece-rate production logging |
| Accuracy | 1 | No data source for weaver output |
| Speed | 1 | No tool exists |
| Completeness | 1 | Complete gap |
| Delight | 1 | Marco needs this for production optimization and fair pay |
| Safety | 5 | No risk |

**Coverage:** ❌ NOT COVERED
**Gap:** Need labor/workforce tracking: per-weaver output logging (meters woven per day/week), piece-rate payroll calculation, productivity benchmarking.

---

### PAYMENT RECONCILIATION (Settler)

#### Scenario 20: Monthly Payment Reconciliation
> "Cuadra mis cobros del mes: facturas emitidas vs. pagos recibidos en BCP y BBVA. ¿Quiénes me deben todavía?"

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Handleable | 7 | `list_pending_payments` + `get_daily_collection_summary` + `list_invoices` can cross-reference |
| Accuracy | 6 | Can match invoices vs payments. Missing: multi-bank reconciliation (BCP + BBVA separate accounts) |
| Speed | 6 | Multiple queries needed |
| Completeness | 5 | Shows pending payments but doesn't reconcile bank statements. No bank feed integration |
| Delight | 6 | Functional AR aging. Missing: formatted reconciliation report with bank breakdown |
| Safety | 8 | Read-only |

**Coverage:** ⚠️ PARTIALLY COVERED
**Gap:** No bank feed integration (BCP/BBVA API). Manual reconciliation only. Need accounts receivable aging report format for B2B.

---

#### Scenario 21: International Wire Transfer Tracking
> "El wire transfer de Andean Imports LLC debería haber llegado hace 5 días — USD 4,400. Revisa si ya cayó en la cuenta de BCP dólares."

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Handleable | 3 | `search_payment_by_amount` could search by approximate amount, but no SWIFT/wire transfer tracking. No BCP bank API |
| Accuracy | 2 | Can't check bank account balances or incoming wire status |
| Speed | 5 | Could check payments-mcp for recorded payments, but can't verify with bank |
| Completeness | 2 | Can only tell if someone already recorded the payment. Can't proactively check bank |
| Delight | 2 | Marco needs "it arrived / it hasn't arrived." Gets "I don't know, check with your bank" |
| Safety | 6 | No risk |

**Coverage:** ⚠️ PARTIALLY COVERED
**Gap:** No bank API integration (BCP, BBVA). No SWIFT tracking. No incoming wire notification system. Critical for export business — 15% of revenue comes via international wire.

---

#### Scenario 22: Client Payment Timeliness Analysis
> "Necesito conciliar los pagos de mis 3 principales clientes boutique este trimestre. ¿Están pagando a tiempo o se están atrasando?"

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Handleable | 6 | `get_payment_history` per customer + `list_invoices` can build a payment timeliness picture |
| Accuracy | 6 | Can compare invoice date vs payment date if both recorded |
| Speed | 5 | Multiple queries per customer |
| Completeness | 5 | Can show payment timing but no DSO (Days Sales Outstanding) calculation, no trend analysis, no automatic "stretching to net-60" detection |
| Delight | 5 | Partial answer. Marco wants "Kuna pays on time, Alpaca 111 is always late by 15 days" |
| Safety | 8 | Read-only |

**Coverage:** ⚠️ PARTIALLY COVERED
**Gap:** Need B2B accounts receivable analytics: DSO per client, payment trend analysis, aging buckets (current, 30, 60, 90+), credit risk scoring.

---

### EXPORT & COMPLIANCE

#### Scenario 23: SUNAT Drawback Claim
> "Necesito tramitar el drawback por la exportación de febrero. FOB fue USD 8,800. ¿Me corresponde 3% de devolución? ¿Qué documentos necesito para SUNAT?"

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Handleable | 2 | No drawback calculation tool. No SUNAT drawback filing process. Agent can only explain the concept |
| Accuracy | 3 | Can calculate 3% × $8,800 = $264 mathematically. But can't verify eligibility, compile documents, or file |
| Speed | 4 | Agent reasoning can explain drawback requirements |
| Completeness | 1 | Cannot: verify drawback eligibility, generate required documents (DAM, factura de exportación, DUA), file Form 1649, check SUNAT drawback status |
| Delight | 2 | Marco needs execution, not explanation. Gets a lecture on drawback requirements |
| Safety | 4 | Risk of missing filing deadlines or providing incorrect eligibility info |

**Coverage:** ❌ NOT COVERED
**Gap:** CRITICAL for Marco's export business. Need:
- Drawback eligibility calculator (product must be manufactured with imported/local inputs)
- Required document checklist and assembly
- SUNAT Form 1649 preparation
- Tracking of drawback claim status
- Integration with customs (SUNAT-Aduanas)

---

#### Scenario 24: EU Certificate of Origin
> "El comprador europeo (Berlín) quiere certificado de origen para acogerse al acuerdo comercial UE-Perú. ¿Cómo lo tramito?"

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Handleable | 2 | No certificate of origin generation or VUCE (Ventanilla Única de Comercio Exterior) integration |
| Accuracy | 3 | Agent can explain the process (apply via Cámara de Comercio or VUCE) but can't execute |
| Speed | 3 | Informational response only |
| Completeness | 1 | Cannot: generate CO form, fill product details, submit to Cámara de Comercio, track approval |
| Delight | 2 | Marco needs action, gets instructions |
| Safety | 5 | Low risk — informational |

**Coverage:** ❌ NOT COVERED
**Gap:** Need export documentation suite:
- Certificate of Origin (EUR.1 for EU-Peru FTA)
- Packing List generation
- Commercial Invoice (export format)
- Phytosanitary certificate tracking (if required for animal fibers)
- VUCE integration

---

### ESCALATION TRIGGERS

#### Scenario 25: Moth-Damaged Fiber Emergency
> "La fibra que me llegó de Juliaca tiene POLILLA. Son 80kg de baby alpaca, S/12,000 de pérdida. ¿QUÉ HAGO? 😤 Necesito hablar con alguien YA."

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Handleable | 8 | `yaya-escalation` detects frustration (CAPS, 😤, "NECESITO") and escalates with full context |
| Accuracy | 8 | Correct escalation priority (high value loss, emotional customer). Summary includes context |
| Speed | 8 | Immediate acknowledgment + rapid escalation |
| Completeness | 6 | Escalation works. Missing: supplier claim process, quality inspection protocol, insurance claim guidance |
| Delight | 7 | Empathetic response + human handoff. Good. But Marco also needs actionable advice (file supplier claim, document damage, etc.) |
| Safety | 9 | Correct to escalate high-value quality issues |

**Coverage:** ✅ FULLY COVERED (escalation) / ⚠️ PARTIAL (supplier dispute resolution)
**Gap:** No supplier complaint/claim process. No quality inspection documentation workflow. Would benefit from a `yaya-procurement` skill for supplier management.

---

#### Scenario 26: SUNAT Audit Notification
> "SUNAT me mandó una notificación de fiscalización. Dicen que hay inconsistencias en mis facturas de exportación del año pasado. Estoy MUERTO de miedo."

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Handleable | 6 | `yaya-escalation` handles the emotional state. `yaya-tax` can provide general guidance with safety disclaimer |
| Accuracy | 5 | Can explain SUNAT audit process, suggest gathering documents. Cannot analyze specific inconsistencies |
| Speed | 7 | Quick emotional response + escalation |
| Completeness | 4 | Can: acknowledge urgency, explain general process, recommend professional help. Cannot: review export invoices for inconsistencies, prepare audit response, interface with SUNAT |
| Delight | 6 | Empathetic response + "consult your contador." Better than nothing but Marco wants more help |
| Safety | 9 | Correctly includes safety disclaimer about consulting professional tax advisor. Critical for legal matters |

**Coverage:** 🔄 NEEDS ESCALATION (correctly handled)
**Note:** `yaya-tax` safety disclaimer fires correctly here. This SHOULD be escalated to a human accountant/tax advisor.

---

### EDGE CASES

#### Scenario 27: Custom Design Quotation
> "Un cliente quiere un diseño personalizado: poncho con motivos Tiahuanaco en colores específicos. ¿Cómo cotizo algo custom que nunca he hecho?"

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Handleable | 3 | No custom product quoting tool. Agent can reason about pricing methodology but can't calculate |
| Accuracy | 3 | Could suggest cost-plus pricing approach but without cost data, can't give a number |
| Speed | 5 | Conversational guidance possible |
| Completeness | 3 | Can suggest pricing methodology (materials + labor × 1.5 + design premium). Can't calculate actual costs |
| Delight | 4 | Helpful framework but Marco wants a number |
| Safety | 5 | Risk of suggesting unsustainable pricing |

**Coverage:** ⚠️ PARTIALLY COVERED
**Gap:** Same as scenario 6 — no BOM costing. Additionally, no custom order workflow (design → sample → approval → production).

---

#### Scenario 28: Production Disruption (Sick Weavers)
> "Se me enfermaron 3 tejedores al mismo tiempo. Tengo pedidos para entregar la próxima semana. ¿Cómo reorganizo la producción?"

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Handleable | 1 | No production scheduling, no capacity planning, no workforce management |
| Accuracy | 1 | Cannot assess: which orders are affected, remaining capacity, priority ranking |
| Speed | 1 | No tool exists |
| Completeness | 1 | Complete gap |
| Delight | 1 | Marco's nightmare scenario — platform offers zero help |
| Safety | 5 | No action taken |

**Coverage:** ❌ NOT COVERED
**Gap:** Same as scenario 2 + workforce management.

---

#### Scenario 29: Currency Fluctuation Decision
> "El dólar subió 5% esta semana. ¿Debo ajustar mis precios de exportación o mantengo los que cotizé?"

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Handleable | 4 | `forex-mcp` exists for exchange rates. Agent can reason about impact |
| Accuracy | 5 | Can get current exchange rate and calculate impact on margins |
| Speed | 6 | Quick data retrieval |
| Completeness | 4 | Can show the math (5% = $X impact per order). Can't advise on hedging, contract terms, or business strategy |
| Delight | 5 | Provides data but not strategic advice |
| Safety | 6 | Risk of bad business advice on FX exposure |

**Coverage:** ⚠️ PARTIALLY COVERED
**Gap:** No FX impact analysis tool. No hedging guidance. No automatic price adjustment for FX-linked export quotes.

---

#### Scenario 30: E-commerce Channel Decision
> "Quiero vender por internet — ¿Etsy o mi propia web? El ccaccau de mi compadre me dice que Etsy cobra mucho pero los gringos compran ahí."

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Handleable | 4 | Agent can provide general advice from knowledge, but no e-commerce analysis tools |
| Accuracy | 5 | General knowledge about Etsy fees (~6.5% + payment processing) vs own website costs |
| Speed | 7 | Conversational response |
| Completeness | 4 | Can discuss pros/cons but can't: analyze Marco's specific margins, calculate break-even for Etsy fees, set up either channel |
| Delight | 5 | Helpful discussion. Marco would appreciate the Arequipeño cultural understanding ("ccaccau") |
| Safety | 6 | Opinion, not critical action |

**Coverage:** ⚠️ PARTIALLY COVERED (general advice only)

---

## Summary Matrix

| Scenario | Category | Coverage | Avg Score |
|----------|----------|----------|-----------|
| 1. Raw material check | Core Ops | ⚠️ PARTIAL | 3.3 |
| 2. Production scheduling | Core Ops | ❌ NOT COVERED | 1.0 |
| 3. Material receipt | Core Ops | ⚠️ PARTIAL | 3.7 |
| 4. Order stage tracking | Core Ops | ⚠️ PARTIAL | 4.3 |
| 5. Finished goods check | Core Ops | ✅ FULL | 7.2 |
| 6. Margin pricing | Pricing | ⚠️ PARTIAL | 3.7 |
| 7. B2B payment reminder | Pricing | ⚠️ PARTIAL | 6.5 |
| 8. FOB export pricing | Pricing | ⚠️ PARTIAL | 3.2 |
| 9. B2B factura | Invoicing | ✅ FULL | 8.5 |
| 10. Retail boleta | Invoicing | ✅ FULL | 7.8 |
| 11. Export invoice | Invoicing | ⚠️ PARTIAL | 4.2 |
| 12. Credit note | Invoicing | ✅ FULL | 8.2 |
| 13. Domestic shipping | Shipping | ⚠️ PARTIAL | 4.8 |
| 14. Intl tracking | Shipping | ✅ FULL | 8.3 |
| 15. Pickup scheduling | Shipping | ⚠️ PARTIAL | 7.0 |
| 16. Margin analysis | Analytics | ⚠️ PARTIAL | 4.5 |
| 17. Fiber usage | Analytics | ❌ NOT COVERED | 1.0 |
| 18. Channel analysis | Analytics | ⚠️ PARTIAL | 6.0 |
| 19. Weaver productivity | Analytics | ❌ NOT COVERED | 1.0 |
| 20. Payment recon | Payments | ⚠️ PARTIAL | 6.3 |
| 21. Wire transfer track | Payments | ⚠️ PARTIAL | 3.0 |
| 22. Client timeliness | Payments | ⚠️ PARTIAL | 5.8 |
| 23. Drawback claim | Export | ❌ NOT COVERED | 2.3 |
| 24. Certificate of origin | Export | ❌ NOT COVERED | 2.3 |
| 25. Fiber emergency | Escalation | ✅ FULL | 7.7 |
| 26. SUNAT audit | Escalation | 🔄 ESCALATION | 6.2 |
| 27. Custom quote | Edge | ⚠️ PARTIAL | 3.8 |
| 28. Production disruption | Edge | ❌ NOT COVERED | 1.0 |
| 29. FX decision | Edge | ⚠️ PARTIAL | 5.0 |
| 30. E-commerce advice | Edge | ⚠️ PARTIAL | 5.0 |

---

## Coverage Summary

| Status | Count | % |
|--------|-------|---|
| ✅ FULLY COVERED | 6 | 20% |
| ⚠️ PARTIALLY COVERED | 17 | 57% |
| ❌ NOT COVERED | 6 | 20% |
| 🔄 NEEDS ESCALATION | 1 | 3% |

---

## Critical Gaps for Marco's Business

### 🔴 Priority 1 — Manufacturing & Production (Blocks Daily Operations)

1. **Production Scheduling Skill** (`yaya-production`)
   - Loom assignment and capacity planning
   - Order-to-loom allocation with deadlines
   - Production stage tracking (raw material → on loom → finishing → QC → packaging)
   - Work order management via ERPNext Manufacturing module
   - Workforce management (weaver availability, piece-rate tracking)

2. **ERPNext Manufacturing MCP Tools**
   - `create_work_order` — Schedule production for a sales order
   - `get_bom` — Bill of Materials for each product (fiber requirements)
   - `check_material_availability` — Can we produce X units with current stock?
   - `update_production_stage` — Move order through manufacturing stages
   - `log_production_output` — Record weaver output (meters woven)
   - `create_purchase_receipt` — Register incoming raw materials
   - `create_stock_entry` — Material transfers between warehouses

### 🔴 Priority 2 — Export Operations (15% of Revenue at Risk)

3. **Export Documentation Skill** (`yaya-export`)
   - Export invoice generation (SUNAT export factura with zero-rated IGV)
   - Certificate of Origin (EUR.1 for EU, APTA for APEC) workflow
   - Packing List generation
   - Commercial Invoice (international format)
   - Phytosanitary certificate tracking
   - SUNAT Drawback claim preparation and filing (Form 1649)
   - Customs documentation (DAM, DUA)
   - VUCE (Ventanilla Única de Comercio Exterior) integration

4. **Export Invoicing MCP Enhancement**
   - Add operation type "0200" (exportación) to `create_invoice`
   - Zero-rated IGV for export transactions
   - Incoterms support (FOB, CIF, EXW, DDP)
   - Multi-currency with SUNAT exchange rate
   - Guía de Remisión Remitente (doc type 09)

### 🟡 Priority 3 — B2B Relationship Management

5. **B2B CRM Enhancements**
   - Net-30/net-60 payment terms per client
   - Purchase order tracking
   - Accounts receivable aging report (current/30/60/90+)
   - DSO (Days Sales Outstanding) per client
   - Credit limit management
   - Formal collection letter templates ("carta de cobranza")

6. **B2B Payment Improvements**
   - SWIFT/wire transfer tracking
   - Multi-bank reconciliation (BCP + BBVA)
   - Bank feed integration (optional but valuable)

### 🟡 Priority 4 — Peruvian Domestic Shipping

7. **Karrio Carrier Expansion**
   - Olva Courier API integration
   - Shalom Empresarial API integration
   - Cruz del Sur Cargo (for bulk freight)
   - Domestic freight forwarder integration (Arequipa → Callao port)

### 🟢 Priority 5 — Business Intelligence

8. **Manufacturing Analytics**
   - Fiber consumption per product (yield analysis)
   - Production cost per SKU (BOM costing)
   - Weaver productivity metrics
   - Waste/scrap tracking
   - Capacity utilization by loom

9. **Export Analytics**
   - Revenue by market (USA, EU, domestic by city)
   - FX impact analysis
   - Drawback revenue tracking
   - Export margin vs domestic margin comparison

---

## Recommendations

### Quick Wins (< 1 week effort each)
1. Add export factura support to `invoicing-mcp` (zero-rated IGV, operation type 0200, Incoterms)
2. Add `create_stock_entry` and `create_purchase_receipt` to `erpnext-mcp`
3. Create B2B AR aging report in `yaya-analytics`
4. Add drawback calculation helper to `yaya-tax` (3% × FOB value, eligibility checklist)

### Medium-Term (2-4 weeks)
5. Build `yaya-production` skill with ERPNext Manufacturing module integration
6. Build production MCP tools (work orders, BOM, production stages)
7. Integrate Olva Courier and Shalom into Karrio (or build standalone domestic shipping MCP)
8. Build export documentation templates (packing list, commercial invoice, CO application)

### Strategic (1-3 months)
9. Full export operations skill (`yaya-export`) with VUCE integration
10. Bank API integration (BCP/BBVA) for automatic reconciliation
11. Labor/workforce management module (piece-rate payroll, productivity tracking)
12. FX hedging advisor for export businesses

---

## Final Assessment

Marco Silva represents the **most complex persona** tested to date. His business spans manufacturing, B2B wholesale, retail, AND international export — touching nearly every skill and MCP server in the platform. The current Yaya Platform handles his **invoicing and tax compliance well** (7.5-8.0/10) but has **critical gaps in manufacturing/production** (1.0/10) and **export operations** (2.0/10).

For a textiles manufacturer like Marco, the inability to schedule production across 8 looms, track raw material consumption, or generate export documentation makes the platform only **marginally useful** — essentially a fancy invoicing tool when he needs a full business operations platform.

**The manufacturing gap is the single biggest opportunity** for Yaya Platform to differentiate. Most LATAM SaaS tools ignore small manufacturers. If Yaya can solve production scheduling via WhatsApp ("distribúyeme estos 6 pedidos en mis 8 telares"), it unlocks an entirely underserved market segment.

**Overall Platform Readiness for Marco: 5.8/10** — Usable for invoicing and basic payments, but cannot support his core manufacturing and export operations.
