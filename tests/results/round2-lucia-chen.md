# Round 2 Test Results: Lucía Chen — Electrónica Chen Importaciones (Lima)

**Evaluator:** Yaya Platform Test Evaluator (AI)
**Date:** 2026-03-21
**Persona:** Lucía Chen Wu, 38, Electrónica Chen Importaciones, Lima (Mesa Redonda)
**Business:** Wholesale electronics & accessories, S/1,500,000 annual revenue, 12 employees, 500+ SKUs
**Tax:** RUC 20512345678, Régimen General. Importadora. Agente de retención IGV.

---

## Scenario Evaluations

### CORE BUSINESS (7 scenarios)

---

#### Scenario 1: Consulta de stock rápida

**Message:**
> "cuantos audifonos bluetooth tengo? los negros y los blancos por separado 👍"

**Skills involved:** `yaya-inventory`
**MCP tools:** `erpnext-mcp` → stock query (item: audífonos bluetooth, variants: negro, blanco)
**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 8 | Core inventory check with variant filter |
| Accuracy | 7 | Depends on variant data being properly structured in ERPNext (color as attribute) |
| Speed | 9 | Single MCP call with variant filter |
| Completeness | 6 | Can give quantity per color, but Lucía probably has multiple audífono models. Which ones? "Bluetooth" is a category, not a single SKU |
| Delight | 7 | Quick answer matches her communication style |
| Safety | 10 | No risk |

**Gaps:**
- "Audífonos bluetooth" likely maps to 5-10 different models/brands. Platform needs to either list all or ask which model. No disambiguation logic for broad product categories with many variants.
- 500+ SKUs with color/model variants could mean 2000+ individual stock lines. Need proper attribute-based queries, not just item name matching.
- Lucía's style is terse — response must be equally terse. No fluff.

**Ideal response:**
> "Audífonos bluetooth en stock:
> 
> Modelo A (in-ear):
> ⬛ Negro: 340
> ⬜ Blanco: 185
> 
> Modelo B (over-ear):
> ⬛ Negro: 120
> ⬜ Blanco: 90
> 
> Modelo C (sport):
> ⬛ Negro: 200
> ⬜ Blanco: 0 ❌
> 
> Total negro: 660 | Total blanco: 275 👍"

---

#### Scenario 2: Pedido mayorista

**Message:**
> "cliente de huancayo quiere 200 cargadores tipo c, 150 cables usb 2mts y 100 protectores iphone 15. dame precio x mayor y dime si tengo stock"

**Skills involved:** `yaya-inventory`, `yaya-sales`
**MCP tools:**
- `erpnext-mcp` → stock check (3 items)
- `erpnext-mcp` → wholesale price lookup (3 items)
- `crm-mcp` → check if Huancayo client exists

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 8 | Stock + price lookup is core capability |
| Accuracy | 7 | Depends on wholesale pricing tiers being configured in ERPNext |
| Speed | 7 | 3 stock checks + 3 price lookups |
| Completeness | 5 | Gives stock + price but doesn't handle: shipping cost to Huancayo, credit check on client, delivery timeline, guía de remisión |
| Delight | 7 | Fast number-crunching is what Lucía wants |
| Safety | 9 | No risk |

**Gaps:**
- **No wholesale pricing tier system.** Skills mention "bulk pricing" but don't define a mechanism for wholesale tiers (e.g., >100 units = price A, >500 = price B). Lucía has distinct mayorista/minorista prices.
- **No integrated shipping cost calculation.** Lucía ships to provinces daily via Olva Courier/Shalom — platform has zero logistics capability.
- **No credit check integration.** Huancayo client might have outstanding debt. No automatic cross-reference.
- Missing: package/box calculation for 450 items to determine shipping cost.

**Ideal response:**
> "Stock y precio mayorista:
> ✅ Cargadores tipo C: 520 en stock — S/10 c/u = S/2,000
> ✅ Cables USB 2m: 380 en stock — S/4 c/u = S/600
> ✅ Protectores iPhone 15: 250 en stock — S/3 c/u = S/300
> 
> Total: S/2,900
> 
> Cliente Huancayo: ¿Electro Centro? Tiene S/1,200 pendiente (8 días).
> Envío Olva estimado: ~S/85 (2 cajas, 12kg)
> ¿Facturo y despacho? ¿Crédito o pago anticipado?"

---

#### Scenario 3: Actualización de lista de precios

**Message:**
> "sube precio de audifonos inalambricos a S/18 x mayor (antes S/15). los cargadores rapidos a S/12 (antes S/10). tipo de cambio subio"

**Skills involved:** `yaya-inventory`
**MCP tools:** `erpnext-mcp` → update item price (2 items, wholesale price list)

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 7 | Price update capability exists |
| Accuracy | 6 | "Audífonos inalámbricos" — which models? All of them? Need disambiguation |
| Speed | 8 | 2 price updates |
| Completeness | 4 | Updates internal price but Lucía needs to: regenerate her WhatsApp price list, notify provincial clients, recalculate margins |
| Delight | 5 | Partial help only |
| Safety | 8 | Should confirm before changing |

**Gaps:**
- **CRITICAL: No price list generation/distribution.** Lucía's weekly task is "Actualizar lista de precios mayorista (Excel → WhatsApp)" and "Enviar catálogo actualizado a grupo de WhatsApp de clientes." Platform can't generate a shareable price list document.
- **No margin recalculation cascade.** If cost went up due to exchange rate, platform should show new margin at new price.
- **No bulk price update.** Lucía has 500+ SKUs — updating 2 at a time via chat is not scalable.
- No notification to clients about price changes.

**Ideal response:**
> "Actualizado ✅
> • Audífonos inalámbricos: S/15 → S/18 x mayor (+20%)
> • Cargadores rápidos: S/10 → S/12 x mayor (+20%)
> 
> Nuevo margen con tipo de cambio S/3.78:
> • Audífonos: costo S/8 → margen 55% ✅
> • Cargadores: costo S/6.50 → margen 46% ✅
> 
> ¿Genero nueva lista de precios para enviar al grupo de WhatsApp?"

---

#### Scenario 4: Registro de venta al por mayor

**Message:**
> "venta hoy: cliente tienda Electro Sur Cusco, 500 cables usb variados a S/4 c/u, 300 protectores a S/3 c/u. pago transferencia interbank. factura. ✅"

**Skills involved:** `yaya-sales`, `yaya-inventory`, `yaya-payments`, `yaya-tax`, `yaya-crm`
**MCP tools:**
- `erpnext-mcp` → create sales order (2 line items, customer: Electro Sur Cusco)
- `erpnext-mcp` → stock deduction (2 items)
- `erpnext-mcp` → record payment (S/2,900, Interbank transfer)
- `invoicing-mcp` → lookup_ruc + create_invoice (factura)
- `crm-mcp` → log interaction, update purchase history

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 7 | Multi-step but within capabilities of combined skills |
| Accuracy | 6 | "500 cables usb variados" — which variants? Type A, Type C, micro? Platform needs to ask or accept lump sum |
| Speed | 5 | 5+ sequential MCP calls across 4 tools |
| Completeness | 6 | Sale + payment + invoice is good. Missing: guía de remisión, despacho coordination, detracción check |
| Delight | 7 | Lucía wants one-message registration, platform can do it |
| Safety | 8 | Should confirm total and invoice details |

**Gaps:**
- **"500 cables usb variados"** — platform needs to handle lump/generic line items OR ask for breakdown. In wholesale, mixed lots are common.
- **No automatic detracción check.** Total is S/2,900 — below S/700 threshold for most goods, but platform should check automatically (Lucía is Régimen General, agente de retención).
- **No guía de remisión auto-generation.** If this is shipped to Cusco, SUNAT requires guía de remisión. Not triggered.
- **Interbank payment validation** — platform supports Interbank OCR, but business-owner-reported payments (not customer screenshots) have no validation workflow.

**Ideal response:**
> "Registrado ✅
> • Electro Sur Cusco
> • 500 cables USB variados × S/4 = S/2,000
> • 300 protectores × S/3 = S/900
> 
> Subtotal: S/2,900
> IGV (18%): S/522
> Total factura: S/3,422
> 
> Pago Interbank: ✅
> Factura F001-008835 emitida ✅
> Stock actualizado ✅
> 
> ¿Necesitas guía de remisión para el despacho?"

---

#### Scenario 5: Despacho a provincia

**Message:**
> "despacha pedido a arequipa x olva courier. 3 cajas. cliente: Electrónica Mistiana, Jr. Mercaderes 245. contraentrega S/2,800. guia de remision"

**Skills involved:** `yaya-tax` (guía de remisión), but **no logistics/shipping skill exists**
**MCP tools:**
- `invoicing-mcp` → create guía de remisión (if supported)
- No Olva Courier API integration
- `erpnext-mcp` → order lookup

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 3 | Guía de remisión maybe, but no shipping/dispatch management |
| Accuracy | 2 | Can't actually coordinate a shipment |
| Speed | 2 | Manual process needed |
| Completeness | 2 | No Olva/Shalom API, no tracking generation, no contra-entrega management, no dispatch queue |
| Delight | 2 | Can't fulfill the core request |
| Safety | 9 | No risk |

**Gaps:**
- **CRITICAL GAP: No shipping/logistics skill.** Lucía ships 5-10 packages daily to provinces. This is a CORE daily operation. No skill handles:
  - Courier API integration (Olva, Shalom)
  - Shipping label/guía generation
  - Tracking number assignment
  - Contra-entrega (COD) management
  - Dispatch queue management
  - Package weight/box calculation
- **Guía de remisión** is partially in `yaya-tax` (invoicing-mcp mentions it), but the scenario in the skill docs only covers invoicing, not transport documents.
- **No contra-entrega (COD) tracking.** Lucía needs to know which COD payments have been collected by the courier.

**Ideal response:**
> "Despacho programado ✅
> 📦 3 cajas → Arequipa via Olva Courier
> 📍 Electrónica Mistiana, Jr. Mercaderes 245
> 💰 Contra-entrega: S/2,800
> 
> Guía remisión: T001-005432
> Tracking Olva: OLV-2026-78432
> 
> Estimado de llegada: 2-3 días
> ¿Notifico al cliente con el tracking?"

---

#### Scenario 6: Consulta de proveedor

**Message:**
> "que tengo pendiente de recibir del ultimo pedido a shenzhen? cuando llega el contenedor?"

**Skills involved:** ❌ **No procurement/supply chain skill exists**
**MCP tools:** `erpnext-mcp` → purchase order lookup (if PO was created), but no shipping tracking

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 2 | No purchase order or import tracking capability |
| Accuracy | 1 | Can't answer when a container arrives |
| Speed | 1 | Can't process |
| Completeness | 1 | No import management: PO tracking, container tracking, customs status, ETA calculation |
| Delight | 1 | Complete failure for a critical daily question |
| Safety | 10 | No risk |

**Gaps:**
- **CRITICAL GAP: No procurement/supply chain management.** Lucía imports containers from China regularly. No skill handles:
  - Purchase order creation/tracking with international suppliers
  - Container/shipment tracking (sea freight, typically 30-45 days)
  - Customs clearance status monitoring
  - ETA calculation
  - Integration with shipping lines (Maersk, MSC, COSCO)
  - Coordination with customs broker (despachante de aduanas)
- This is arguably Lucía's most complex operational workflow. Platform is blind to it.

**Ideal response:**
> "Último pedido a Shenzhen (PO-2026-0089):
> 
> 📦 Contenido:
> • 1,000 audífonos bluetooth — USD 8,000
> • 2,000 cargadores tipo C — USD 4,400
> • 500 parlantes bluetooth — USD 2,200
> Total: USD 14,600
> 
> 🚢 Tracking: COSCO COSU6234567
> • Salió: 5 de marzo de Yantian
> • Estimado Callao: 8-12 de abril (33-37 días)
> • Estado: En tránsito — Pacífico
> 
> 📋 Pendiente: Coordinar con despachante para documentos DUA
> ¿Quieres que le envíe mensaje al despachante?"

---

#### Scenario 7: Registro rápido de ventas del día

**Message:**
> "ventas hoy en tienda: S/3,200 efectivo, S/1,800 yape, S/4,500 transferencia. registra todo"

**Skills involved:** `yaya-sales`, `yaya-payments`
**MCP tools:**
- `erpnext-mcp` → create bulk sales entries (3 payment methods)

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 5 | Can register sales, but these are AGGREGATE figures, not individual transactions |
| Accuracy | 4 | S/9,500 total with no itemization — can't update stock, can't generate invoices |
| Speed | 7 | Quick entry if accepted as lump sums |
| Completeness | 3 | No item-level detail means: no stock adjustment, no per-product analytics, no invoice generation |
| Delight | 5 | Registers the number but loses all granularity |
| Safety | 6 | Accepting unitemized sales loses audit trail |

**Gaps:**
- **No "quick daily register" mode.** Many small businesses (especially retail counters) don't register each sale individually. They need end-of-day aggregate entry by payment method. No skill supports this workflow.
- **POS integration gap.** If Lucía has a point-of-sale system, it should feed data automatically. If she doesn't (cash register + calculator), the platform needs a lightweight daily entry mode.
- Without item details, inventory won't update, analytics will be incomplete, and tax reporting will lack line items.
- **Cash sales are particularly problematic.** S/3,200 in cash with no receipts — how does this appear in SUNAT declarations?

**Ideal response:**
> "Registrado ✅ Ventas del día:
> 💵 Efectivo: S/3,200
> 💜 Yape: S/1,800
> 🏦 Transferencia: S/4,500
> 
> Total del día: S/9,500
> 
> ⚠️ Para actualizar stock y emitir comprobantes necesito el detalle de productos vendidos. ¿Me pasas el desglose o lo registramos como venta general?"

---

### PRICING & PAYMENTS (5 scenarios)

---

#### Scenario 8: Cálculo con tipo de cambio

**Message:**
> "mi proveedor me cobra USD 2,200 x el lote de parlantes. a cuanto esta el dolar hoy? cuanto es en soles? y si le sumo 30% de margen cuanto vendo cada parlante? son 500 unidades"

**Skills involved:** `yaya-analytics` (calculation), needs FX rate data
**MCP tools:** No exchange rate MCP exists. Would need web_search or external API.

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 6 | Math is trivial. Exchange rate source is the gap |
| Accuracy | 5 | Exchange rate accuracy depends on source — SBS rate vs. parallel rate vs. bank rate |
| Speed | 6 | Need external data fetch |
| Completeness | 4 | No landed cost calculation (freight, customs, aduana fees not included). 30% margin on FOB cost ≠ 30% margin on landed cost |
| Delight | 6 | Quick calculation is useful |
| Safety | 7 | Should specify which exchange rate is used |

**Gaps:**
- **CRITICAL: No exchange rate integration.** Lucía checks USD/PEN daily (daily task #5). Platform has no FX data source. This is a core need for any importer.
- **No landed cost calculation.** "USD 2,200 for parlantes" is FOB/CIF cost. Real cost includes: shipping, customs duties (typically 6% for electronics), IGV on import (18%), customs broker fee, port charges. Lucía's real cost could be 35-40% higher than USD 2,200. Calculating margin on raw purchase price is misleading.
- **No import cost calculator.** Platform should know standard tariff rates for Lucía's product categories.

**Ideal response:**
> "Tipo de cambio hoy (SBS): S/3.78
> 
> USD 2,200 × 3.78 = S/8,316 (costo FOB)
> 
> ⚠️ Costo real estimado (landed):
> • FOB: S/8,316
> • Flete + seguro: ~S/500
> • Arancel (6%): ~S/529
> • IGV importación: ~S/1,682
> • Agente aduanas: ~S/300
> • Costo total: ~S/11,327
> 
> Con 30% margen sobre costo real:
> S/11,327 × 1.30 = S/14,725
> Precio por parlante: S/14,725 ÷ 500 = S/29.45
> 
> ¿Redondeamos a S/29 o S/30 x mayor?"

---

#### Scenario 9: Crédito a cliente provinciano

**Message:**
> "tienda de juliaca me pide S/5,000 en mercaderia a credito 15 dias. ya me debe S/3,200 de hace 10 dias. le doy? cuanto es su deuda total?"

**Skills involved:** `yaya-crm`, `yaya-analytics`
**MCP tools:**
- `crm-mcp` → customer lookup (tienda Juliaca)
- `erpnext-mcp` → outstanding receivables (customer)
- `postgres-mcp` → payment history analysis

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 5 | Can look up debt. Can't assess credit risk |
| Accuracy | 6 | Debt lookup works if data is current |
| Speed | 7 | Few MCP calls |
| Completeness | 3 | No credit limit system, no payment history scoring, no risk recommendation |
| Delight | 4 | Gives numbers but no actionable advice |
| Safety | 7 | Correctly shouldn't auto-approve |

**Gaps:**
- **No credit management system.** Same critical gap as Jorge. Provincial wholesale is overwhelmingly credit-based. Lucía's pain point #4 explicitly says "Clientes provincianos piden crédito y demoran en pagar."
- No payment behavior scoring (always pays on time? always late? getting worse?).
- No credit limit framework (e.g., max 2x monthly average purchase).
- At S/8,200 total exposure, Lucía needs risk assessment. Platform can't provide it.

**Ideal response:**
> "Tienda Juliaca (Electro Puno):
> • Deuda actual: S/3,200 (10 días, vence en 5 días)
> • Pedido nuevo: S/5,000 a 15 días
> • Deuda total si apruebas: S/8,200
> 
> Historial: 8 compras en 6 meses, promedio S/3,500
> Pago promedio: 18 días (siempre 3 días tarde)
> Mayor deuda previa: S/4,000 (pagó)
> 
> ⚠️ S/8,200 es el doble de su promedio. Riesgo medio-alto.
> Sugerencia: Aprobar si paga los S/3,200 primero. Sino, máximo S/3,000 adicional.
> ¿Qué decides?"

---

#### Scenario 10: Cobranza masiva

**Message:**
> "dame lista de todos los que me deben. ordenados de mayor a menor. quiero cobrar hoy a los que pasan de S/2,000 💰"

**Skills involved:** `yaya-analytics`, `yaya-crm`
**MCP tools:**
- `erpnext-mcp` → accounts receivable (all customers, sorted by amount desc)
- `crm-mcp` → customer contact details

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 7 | Analytics can query outstanding debts |
| Accuracy | 7 | Depends on all credit sales being registered |
| Speed | 7 | Single complex query |
| Completeness | 5 | List yes, but no bulk messaging, no aging breakdown, no prioritization by urgency |
| Delight | 6 | Actionable list |
| Safety | 9 | Internal data |

**Gaps:**
- **No AR aging report.** Should show 0-15 / 16-30 / 31-60 / 60+ day buckets per customer.
- **No bulk collection messaging.** `yaya-notifications` handles customer promos, not B2B collection reminders. Lucía needs to send payment demands to 15+ provincial clients.
- **No prioritization logic.** Who to call first: biggest debt? Oldest? Most overdue? Platform doesn't recommend.

**Ideal response:**
> "Cuentas por cobrar > S/2,000:
> 
> 🔴 Electro Norte Chiclayo — S/8,500 (45 días) — 974-XXX-XXX
> 🔴 Comercial Andina Huancayo — S/6,200 (30 días) — 964-XXX-XXX
> 🟠 Electro Sur Cusco — S/4,100 (18 días) — 984-XXX-XXX
> 🟠 Tienda Juliaca — S/3,200 (10 días) — 951-XXX-XXX
> 🟡 Electro Tacna — S/2,800 (8 días) — 952-XXX-XXX
> 🟡 Distribuidora Ica — S/2,100 (5 días) — 956-XXX-XXX
> 
> Total por cobrar: S/26,900 💰
> 
> ¿Les envío mensaje de cobro a todos? ¿O solo a los rojos?"

---

#### Scenario 11: Margen por producto

**Message:**
> "cuanto margen tengo en audifonos bluetooth? costo importacion S/8, vendo mayorista S/15, minorista S/25. incluye flete y aduana"

**Skills involved:** `yaya-analytics` (calculation)
**MCP tools:** Mostly calculation — potentially `erpnext-mcp` for cost data verification

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 8 | Straightforward margin calculation |
| Accuracy | 7 | Numbers provided by Lucía — but "incluye flete y aduana" is her claim, platform can't verify |
| Speed | 9 | Pure calculation |
| Completeness | 6 | Margin percentages are useful. Missing: comparison to competitors, volume needed to hit profit targets, per-unit fixed cost allocation |
| Delight | 7 | Quick numbers |
| Safety | 9 | No risk |

**Gaps:**
- **No cost tracking system.** Lucía says cost is S/8 "including freight and customs." Platform can't verify or track actual landed costs per product.
- **No margin monitoring over time.** With exchange rate fluctuations, margins change constantly. Platform should alert when margin drops below threshold.
- Mesa Redonda competition means margins are ultra-thin. Platform should track competitive pressure.

**Ideal response:**
> "Margen audífonos bluetooth:
> 
> Mayorista: venta S/15, costo S/8 → margen S/7 (46.7%)
> Minorista: venta S/25, costo S/8 → margen S/17 (68%)
> 
> Para cubrir gastos fijos (alquiler, planilla, servicios):
> Necesitas vender ~1,200 audífonos/mes a mayorista
> o ~700 a minorista para que cubran su parte de los gastos fijos.
> 
> ⚠️ Si el dólar sube a S/3.90, tu costo sube a ~S/8.50 y el margen mayorista baja a 43%."

---

#### Scenario 12: Descuento por volumen

**Message:**
> "cliente quiere 1000 cargadores. precio normal mayorista S/10. me pide a S/8. mi costo es S/6.50. le doy o no? cuanto gano?"

**Skills involved:** `yaya-analytics` (calculation)
**MCP tools:** Calculation only

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 9 | Pure math |
| Accuracy | 9 | Straightforward calculation |
| Speed | 9 | No MCP needed |
| Completeness | 7 | Gives margin analysis. Could add: recommendation, counter-offer strategy, comparison to normal volume |
| Delight | 8 | Fast actionable answer |
| Safety | 9 | No risk |

**Gaps:**
- No negotiation strategy framework (counter-offer at S/9? tiered: S/9 for 500, S/8.50 for 1000?).
- No cash flow consideration (1000 units = S/6,500 in inventory commitment).

**Ideal response:**
> "A S/8 por 1000 cargadores:
> • Ingreso: S/8,000
> • Costo: S/6,500
> • Ganancia: S/1,500 (margen 18.75%)
> 
> A precio normal (S/10):
> • Ganancia sería: S/3,500 (margen 35%)
> • Pierdes: S/2,000 en ganancia
> 
> Sugerencia: Ofrece S/9 (margen 27.8%, ganas S/2,500).
> Si insiste en S/8, pide pago adelantado — no crédito a ese margen.
> ¿Le doy precio o negocio?"

---

### INVOICING / SUNAT (5 scenarios)

---

#### Scenario 13: Facturación masiva

**Message:**
> "necesito emitir 8 facturas hoy. te paso los datos uno por uno. primera: Comercial Andina EIRL, RUC 20345678901, 200 audifonos a S/15. con igv"

**Skills involved:** `yaya-tax`
**MCP tools:**
- `invoicing-mcp` → lookup_ruc (20345678901)
- `invoicing-mcp` → create_invoice (document_type: "01")

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 8 | Core yaya-tax capability. Sequential invoice creation is supported |
| Accuracy | 8 | RUC validation + IGV calculation |
| Speed | 5 | 8 invoices × (RUC lookup + creation) = 16+ MCP calls. Slow one-by-one |
| Completeness | 7 | Invoice generation works. Missing: batch mode, queue management for 8 sequential invoices |
| Delight | 6 | Having to dictate 8 invoices one by one is tedious. Should offer batch/CSV upload |
| Safety | 9 | RUC validation prevents errors |

**Gaps:**
- **No batch invoicing workflow.** Lucía emits "facturación electrónica masiva" (daily task #8). Dictating 8 invoices one by one via WhatsApp is painful. Platform needs:
  - Batch invoice from sales orders
  - CSV/spreadsheet import for invoicing
  - Auto-invoice on order completion
- **No auto-invoice on sale.** When Scenario 4 registers a sale with "factura", the invoice should auto-generate, not require a separate step.
- Conversation state management for 8 sequential invoices — platform needs to handle this without losing context.

**Ideal response:**
> "RUC verificado ✅ Comercial Andina EIRL — Activo
> 
> Factura #1:
> • 200 audífonos × S/15 = S/3,000
> • IGV (18%): S/540
> • Total: S/3,540
> 
> ¿Confirmo? Luego seguimos con las otras 7.
> 
> 💡 Tip: Si tienes los datos en una lista o Excel, puedo procesarlos todos de una vez."

---

#### Scenario 14: Guía de remisión

**Message:**
> "guia de remision para envio a tacna. transportista Shalom, placa ABC-123. 5 cajas, peso 45kg. destinatario Electro Tacna SAC, RUC 20456789012"

**Skills involved:** `yaya-tax`
**MCP tools:** `invoicing-mcp` → create guía de remisión (transport document)

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 6 | invoicing-mcp may support guía de remisión, but not explicitly detailed in skill docs |
| Accuracy | 5 | Guía requires: punto de partida, punto de llegada, fecha traslado, motivo traslado. Not all info provided |
| Speed | 6 | Single creation if tool supports it |
| Completeness | 4 | Missing fields: departure address, transport reason, transfer date, item details, unit weights |
| Delight | 5 | Partial — would need to ask for missing fields |
| Safety | 8 | SUNAT compliance |

**Gaps:**
- **Guía de remisión is not well-documented in yaya-tax.** The skill focuses on facturas/boletas/notas de crédito. Guía de remisión remitente and guía de remisión transportista are critical for any business shipping goods (SUNAT requirement for transport).
- **No auto-fill from order data.** If the order was already created, guía should auto-populate items, weights, and addresses.
- **No Shalom/Olva integration.** Should auto-generate tracking.
- SUNAT's electronic guía de remisión (GRE) requirement became mandatory — platform needs this.

**Ideal response:**
> "Guía de remisión:
> 📍 Origen: Jr. de la Unión 456, Lima
> 📍 Destino: Electro Tacna SAC, Tacna
> 🚚 Transportista: Shalom — Placa ABC-123
> 📦 5 cajas — 45 kg total
> 📋 Motivo: Venta
> 
> Necesito los items y cantidades para completar.
> ¿Es del pedido de hoy (cables + protectores)?
> 
> RUC verificado: Electro Tacna SAC ✅"

---

#### Scenario 15: Detracción

**Message:**
> "una venta de S/8,500 con factura. tengo que aplicar detraccion? cuanto es? el cliente tiene que depositar en mi cuenta de detracciones?"

**Skills involved:** `yaya-tax`
**MCP tools:** `invoicing-mcp` → calculate_tax (detracción check), possibly get_tax_obligations

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 6 | yaya-tax covers tax obligations but detracciones are complex and not explicitly documented |
| Accuracy | 5 | Detracción rate depends on the type of goods/service. Electronics wholesale = "demás bienes" = 10%(?). Rules change frequently |
| Speed | 7 | Lookup if supported |
| Completeness | 4 | Should explain: rate, who deposits, deadline, account number, consequences of non-compliance |
| Delight | 5 | Partial guidance |
| Safety | 7 | Must include tax disclaimer |

**Gaps:**
- **Detracciones not explicitly covered in yaya-tax.** The skill mentions "Tax Regime Guidance" and "Tax Calculation" but the examples only show IGV/Renta calculation. Detracciones (SPOT system) are a separate, complex mechanism.
- **Detracción rules are product-specific.** Different rates for different goods/services. Platform needs a detracción rate table.
- **Agente de retención IGV.** Lucía IS an agente de retención — this means she must withhold IGV from certain suppliers. Double complexity. Not covered at all.
- **No cuenta de detracciones management.** Lucía needs to track her detracción account balance.

**Ideal response:**
> "Para venta de S/8,500 en electrónicos:
> 
> ✅ Sí, aplica detracción
> • Categoría: Demás bienes (Anexo 2)
> • Tasa: 10%
> • Monto detracción: S/850
> 
> El CLIENTE debe depositar S/850 en tu cuenta de detracciones del Banco de la Nación antes de pagar la factura.
> Tu cuenta detracciones: XXX-XXX-XXXXXX
> 
> Factura total: S/8,500 + IGV = S/10,030
> Cliente te paga: S/10,030 - S/850 = S/9,180 a tu cuenta normal
> Detracción: S/850 a tu cuenta BN
> 
> ⚠️ Si el cliente no deposita la detracción, tú no puedes usar el crédito fiscal. Verifica antes de despachar.
> 
> Orientativo. Confirma con tu contadora."

---

#### Scenario 16: Liquidación de importación

**Message:**
> "llego el contenedor de china. valor CIF USD 15,000. cuanto voy a pagar de aranceles y igv de importacion? dame estimado"

**Skills involved:** `yaya-tax` (partially)
**MCP tools:** `invoicing-mcp` → calculate_tax (if import calculation is supported)

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 4 | yaya-tax doesn't cover import duties/customs |
| Accuracy | 3 | Tariff rates depend on HS code classification. Electronics have varying rates (0-11%). Platform has no tariff database |
| Speed | 5 | Could calculate if rates were known |
| Completeness | 2 | Missing: HS code lookup, specific tariff rates, customs broker fees, port charges, percepción IGV, antidumping duties |
| Delight | 3 | Can only give very rough estimate |
| Safety | 7 | Must disclaim as estimate |

**Gaps:**
- **CRITICAL GAP: No import/customs skill.** For an importing business, this is core operations. Need:
  - HS code classification for products
  - Tariff rate lookup by HS code
  - Import tax calculation (ad valorem, IGV importación, IPM, percepción)
  - DUA (Declaración Única de Aduanas) tracking
  - Customs broker coordination
  - Port/terminal charges estimation
- Lucía does this monthly. It's a complex, high-value process that the platform completely ignores.

**Ideal response:**
> "Estimado para contenedor CIF USD 15,000:
> 
> Tipo de cambio: S/3.78
> Valor CIF en soles: S/56,700
> 
> Aranceles (electrónicos, partida 8518):
> • Ad Valorem: 6% = S/3,402
> • Sobretasa: 0%
> 
> Base imponible IGV: S/56,700 + S/3,402 = S/60,102
> • IGV importación (18%): S/10,818
> • IPM (2%): S/1,202
> • Percepción IGV (3.5%): S/2,104
> 
> Gastos adicionales estimados:
> • Agente aduanas: ~S/1,200
> • Handling + almacenaje: ~S/800
> • Transporte Callao→Lima: ~S/500
> 
> Total estimado a pagar: ~S/20,026
> 
> ⚠️ Estimado — tasas varían por partida arancelaria. Tu despachante tendrá los montos exactos."

---

#### Scenario 17: Nota de crédito

**Message:**
> "cliente devolvio 50 cargadores defectuosos de la factura F001-008834. hay que hacer nota de credito y registrar la devolucion en stock"

**Skills involved:** `yaya-tax`, `yaya-returns`, `yaya-inventory`
**MCP tools:**
- `invoicing-mcp` → get_invoice_status (F001-008834)
- `invoicing-mcp` → create_credit_note
- `erpnext-mcp` → stock adjustment (+50 cargadores, but marked as defective)

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 8 | yaya-tax + yaya-returns cover this well |
| Accuracy | 8 | Invoice lookup + credit note generation + stock adjustment |
| Speed | 6 | Multiple MCP calls across tools |
| Completeness | 7 | NC + stock adjustment. Missing: defective stock segregation, supplier claim tracking |
| Delight | 7 | Solves the problem end-to-end |
| Safety | 8 | Should verify original invoice details |

**Gaps:**
- **Defective stock handling.** 50 returned cargadores should not go back into sellable stock. Need a "defective" warehouse or write-off process. No skill handles this.
- **Supplier claim.** If these are manufacturing defects from the Shenzhen supplier, Lucía should file a claim. No skill tracks supplier quality issues.
- Otherwise, this is one of the better-handled scenarios.

**Ideal response:**
> "Factura F001-008834 encontrada:
> • Comercial Andina EIRL
> • 200 cargadores tipo C × S/10 = S/2,000 + IGV
> 
> Nota de crédito por devolución:
> • 50 cargadores × S/10 = S/500
> • IGV: S/90
> • Total NC: S/590
> 
> ✅ Nota de crédito emitida: NC01-002345
> ✅ Stock actualizado: +50 cargadores (marcados como defectuosos)
> 
> ⚠️ ¿Quieres reclamar al proveedor? Son defectos de fábrica?"

---

### SCHEDULING (3 scenarios)

---

#### Scenario 18: Seguimiento de importación

**Message:**
> "cuando llega el contenedor que salio de shenzhen el 5 de marzo? ya tiene tracking?"

**Skills involved:** ❌ No import/logistics skill
**MCP tools:** None applicable

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 1 | No container tracking capability |
| Accuracy | 0 | Can't answer |
| Speed | 0 | Can't process |
| Completeness | 0 | Complete miss |
| Delight | 1 | Total failure |
| Safety | 10 | No risk |

**Gaps:**
- Same as Scenario 6. No supply chain management. No shipping line integration. No container tracking.
- This is asked DAILY by importers. Containers take 30-45 days from China to Peru. Constant monitoring needed.

**Ideal response:**
> "Contenedor de Shenzhen (salida 5 marzo):
> 🚢 COSCO — Booking COSU6234567
> • Salió: 5/03 de Yantian
> • Transbordo: Busan 15/03 ✅ completado
> • En tránsito: Pacífico — posición actual cerca de Hawaii
> • ETA Callao: 8 de abril (±2 días)
> • Estado: En ruta — sin novedades
> 
> Siguiente paso: Contactar despachante 5 días antes de llegada para documentación.
> ¿Le envío recordatorio para el 3 de abril?"

---

#### Scenario 19: Recordatorio de pagos

**Message:**
> "recordame mañana pagar USD 3,500 al proveedor de guangzhou x western union. y el viernes la planilla"

**Skills involved:** Partial — Hermes cron for reminders, but no structured reminder skill for business owner
**MCP tools:** Hermes cron scheduling

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 6 | Can set reminder via cron |
| Accuracy | 7 | Reminder triggers are reliable |
| Speed | 8 | Quick cron creation |
| Completeness | 4 | Reminder yes, but no: Western Union workflow, FX rate at time of payment, supplier payment tracking |
| Delight | 5 | Basic but works |
| Safety | 9 | No risk |

**Gaps:**
- **No international payment tracking.** Western Union transfers to China are a regular operation for Lucía. Platform can't:
  - Track sent payments to suppliers
  - Record payment reference numbers
  - Monitor exchange rates for optimal timing
  - Generate payment receipts for accounting
- **No payroll management.** "La planilla" is a recurring weekly/biweekly obligation. No skill manages payroll.
- **No cash flow forecasting.** USD 3,500 (~S/13,230) + planilla (~S/8,000) = S/21,230 going out. Does Lucía have enough?

**Ideal response:**
> "Recordatorios programados ✅
> 📅 Mañana 9 AM: Pagar USD 3,500 al proveedor Guangzhou x Western Union
>    Tipo de cambio actual: S/3.78 = S/13,230
> 📅 Viernes 9 AM: Pagar planilla
> 
> Pagos pendientes esta semana:
> • Proveedor Guangzhou: USD 3,500
> • Planilla: ~S/8,000
> • Alquiler (si es fin de mes): S/12,000
> 
> Saldo en caja según registros: S/34,500. Alcanza ✅"

---

#### Scenario 20: Programar envío

**Message:**
> "programa despacho para el lunes: pedido huancayo 3 cajas, pedido cusco 2 cajas, pedido ica 1 caja. todos x olva"

**Skills involved:** ❌ No shipping/logistics skill
**MCP tools:** None — no Olva Courier API

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 2 | No dispatch management |
| Accuracy | 1 | Can't schedule actual shipments |
| Speed | 1 | Can't process |
| Completeness | 1 | No dispatch queue, no courier integration, no tracking, no label printing |
| Delight | 2 | Can at most set a reminder, not actually manage shipments |
| Safety | 9 | No risk |

**Gaps:**
- Same as Scenario 5. No logistics skill. Lucía ships 5-10 packages daily. This is a CORE operation.
- Platform can't: schedule pickups with Olva, generate shipping labels, create tracking numbers, manage a dispatch queue, calculate shipping costs.

**Ideal response:**
> "Despacho lunes programado ✅
> 
> 📦 Olva Courier — 3 envíos:
> 1. Huancayo — 3 cajas — Cliente: Electro Centro
> 2. Cusco — 2 cajas — Cliente: Electro Sur
> 3. Ica — 1 caja — Cliente: Distribuidora Ica
> 
> Total: 6 cajas
> Pickup Olva programado: Lunes 10 AM
> Guías de remisión: T001-005433, 005434, 005435
> 
> ¿Notifico a los clientes con tracking?"

---

### ANALYTICS (3 scenarios)

---

#### Scenario 21: Top productos

**Message:**
> "cuales son mis 10 productos mas vendidos del mes? y margen de cada uno"

**Skills involved:** `yaya-analytics`, `yaya-inventory`
**MCP tools:**
- `erpnext-mcp` → sales report (top 10, current month)
- `erpnext-mcp` → cost data per product
- `postgres-mcp` → margin calculation

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 7 | Core analytics capability |
| Accuracy | 6 | Margin accuracy depends on cost data being maintained — landed costs for imports are complex |
| Speed | 7 | Complex query |
| Completeness | 6 | Top sellers + margin. Missing: trend vs. previous month, stock days remaining, reorder signal |
| Delight | 7 | Actionable report |
| Safety | 9 | No risk |

**Gaps:**
- **Margin calculation requires accurate cost data.** For an importer, cost = purchase price + freight + customs + broker + handling. If only FOB cost is recorded, margins are overstated.
- **No cost tracking by import batch.** Same product imported at different exchange rates = different costs. FIFO/weighted average costing needed.

**Ideal response:**
> "🏆 Top 10 productos — Marzo 2026:
> 
> 1. Cargador tipo C — 2,800 unids — S/28,000 — margen 35%
> 2. Cable USB 2m — 2,200 unids — S/8,800 — margen 38%
> 3. Audífonos bluetooth (negro) — 850 unids — S/12,750 — margen 47%
> 4. Protector iPhone 15 — 1,500 unids — S/4,500 — margen 40%
> 5. Protector Samsung S24 — 1,200 unids — S/3,600 — margen 42%
> 6. Parlante bluetooth mini — 400 unids — S/11,600 — margen 32%
> 7. Audífonos bluetooth (blanco) — 450 unids — S/6,750 — margen 47%
> 8. Cable tipo C 1m — 1,800 unids — S/5,400 — margen 33%
> 9. Batería portátil 10000mAh — 300 unids — S/10,500 — margen 28%
> 10. Adaptador USB-C a 3.5mm — 900 unids — S/2,700 — margen 45%
> 
> ⚠️ Baterías portátiles tienen el menor margen (28%). Subir precio o negociar mejor costo.
> Cargadores tipo C son tu cash cow — asegurar stock."

---

#### Scenario 22: Comparativa mensual

**Message:**
> "como van las ventas de marzo vs febrero? estoy mejor o peor?"

**Skills involved:** `yaya-analytics`
**MCP tools:**
- `erpnext-mcp` → sales report (March vs February)
- `postgres-mcp` → trend calculation

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 9 | Core analytics capability, explicitly shown in skill examples |
| Accuracy | 8 | Direct data comparison |
| Speed | 7 | Period comparison query |
| Completeness | 7 | Revenue comparison. Could add: by category, by client, by channel |
| Delight | 8 | Clear actionable insight |
| Safety | 9 | No risk |

**Gaps:**
- Should contextualize with: seasonal trends (post-campaña de colegio?), exchange rate impact, new products effect.
- No channel breakdown (tienda vs. provincial wholesale).

**Ideal response:**
> "📊 Marzo vs Febrero (al día 21):
> 
> 💰 Ventas: S/98,500 vs S/112,000 — ↘️ -12%
> 📦 Pedidos: 145 vs 168 — ↘️ -14%
> 💵 Ticket promedio: S/679 vs S/667 — ↗️ +2%
> 
> Por canal:
> • Tienda (Lima): S/52,000 vs S/55,000 — ↘️ -5%
> • Provincias: S/46,500 vs S/57,000 — ↘️ -18%
> 
> ⚠️ Las provincias bajaron fuerte. ¿Campaña escolar terminó?
> A este ritmo, marzo cierra en ~S/140,000 (feb fue S/155,000).
> 
> ¿Quieres ver qué clientes compraron menos?"

---

#### Scenario 23: Análisis de clientes

**Message:**
> "quienes son mis 5 mejores clientes del trimestre? cuanto compro cada uno? quiero premiar a los buenos"

**Skills involved:** `yaya-analytics`, `yaya-crm`
**MCP tools:**
- `erpnext-mcp` → sales by customer (Q1 2026, top 5)
- `crm-mcp` → customer details

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 8 | Analytics + CRM can handle this |
| Accuracy | 8 | Direct sales data |
| Speed | 7 | Query + join |
| Completeness | 6 | Shows top buyers. Missing: payment reliability, growth trend, recommended rewards |
| Delight | 7 | Actionable list |
| Safety | 9 | No risk |

**Gaps:**
- **No loyalty/rewards program management.** Lucía wants to "premiar a los buenos" — platform has no loyalty program features (tiered discounts, loyalty points, special pricing).
- Should show: purchase trend (growing? declining?), payment behavior (always on time?), product mix.

**Ideal response:**
> "🏆 Top 5 clientes — Enero a Marzo 2026:
> 
> 1. Electro Norte Chiclayo — S/45,200 (32 pedidos) — pago: 80% a tiempo
> 2. Comercial Andina Huancayo — S/38,500 (28 pedidos) — pago: 95% a tiempo ⭐
> 3. Electro Sur Cusco — S/31,200 (24 pedidos) — pago: 90% a tiempo ⭐
> 4. Distribuidora Ica — S/22,800 (18 pedidos) — pago: 100% a tiempo ⭐⭐
> 5. Electro Tacna — S/19,500 (15 pedidos) — pago: 70% a tiempo ⚠️
> 
> Sugerencias para premiar:
> • 5% descuento adicional para los ⭐⭐
> • Crédito extendido (30 días) para los que pagan a tiempo
> • Acceso anticipado a productos nuevos
> 
> ¿Les envío mensaje de reconocimiento?"

---

### ESCALATION (3 scenarios)

---

#### Scenario 24: Mercadería retenida en aduana

**Message:**
> "me llamo el despachante, sunat retuvo mi contenedor en el callao. dicen que falta un documento. que hago?? 😫"

**Skills involved:** `yaya-escalation` (safety/urgency), general knowledge
**MCP tools:** None directly — requires customs/legal knowledge

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 4 | Can provide general guidance, can't resolve the actual issue |
| Accuracy | 4 | Customs procedures are complex and case-specific. LLM knowledge may be outdated |
| Speed | 7 | Quick general guidance |
| Completeness | 3 | No customs integration, no document tracking, no SUNAT Aduanas portal access |
| Delight | 4 | Calming but not truly helpful |
| Safety | 7 | Must disclaim as general guidance |

**Gaps:**
- **CRITICAL: No customs/import management.** Container retention is a high-stress, high-value situation (S/56,700+ in goods). Platform should:
  - Track required documents per import (DUA, packing list, commercial invoice, B/L, certificate of origin)
  - Identify which document is missing
  - Have document templates ready
  - Know SUNAT Aduanas procedures for release
  - Track detention costs (S/500+/day in storage at Callao)
- **No despachante de aduanas integration.** Platform should facilitate communication with the customs broker.
- Lucía's pain point #5: "Trámites de aduana lentos y costosos, riesgo de retención de mercadería."

**Ideal response:**
> "🚨 Retención de contenedor — pasos inmediatos:
> 
> 1. Pregunta al despachante EXACTAMENTE qué documento falta
>    (puede ser: certificado de origen, factura consular, autorización sanitaria, etc.)
> 
> 2. Documentos comunes que retienen:
>    • Certificado de origen → pide al proveedor en China urgente
>    • Invoice discrepancia → verifica que el CIF coincida con la DUA
>    • Autorización de marca → si hay logo de marca registrada
> 
> 3. Tiempo: tienes 20 días para presentar documentos antes de que SUNAT proceda a comiso
> 
> 4. Costos: ~S/150-300/día de almacenaje en terminal. Cada día cuenta.
> 
> ⚠️ Trabaja directo con tu despachante. Esta es su especialidad.
> ¿Quieres que le envíe mensaje al despachante para pedir detalles?"

---

#### Scenario 25: Cliente con cheque sin fondos

**Message:**
> "el cheque de S/6,000 del cliente de chiclayo reboto!! sin fondos. es la segunda vez. como recupero esa plata?"

**Skills involved:** `yaya-escalation`, `yaya-crm`
**MCP tools:**
- `crm-mcp` → customer history, flag account
- `erpnext-mcp` → outstanding balance

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 4 | Can flag the customer. Can't actually help recover the money |
| Accuracy | 5 | General advice is possible |
| Speed | 7 | Quick guidance |
| Completeness | 3 | No: legal process guidance, formal demand letter generation, check protest procedure, Infocorp reporting |
| Delight | 3 | Limited help for a serious financial problem |
| Safety | 7 | Must not give specific legal advice |

**Gaps:**
- **No check management system.** Platform doesn't track checks (dates, amounts, banks, maturity dates).
- **No bad check procedure.** In Peru, a bounced check can be "protestado" through the bank, which affects the client's credit rating. Platform doesn't know this workflow.
- **No legal document generation.** Carta notarial for demand is the standard first step. Platform can't generate it.
- **No customer blocking.** Should auto-block credit/checks for repeat offenders.

**Ideal response:**
> "⚠️ Cheque sin fondos — S/6,000 (Electro Norte Chiclayo)
> 
> Segunda vez → este cliente ya no es confiable con cheques.
> 
> Pasos para recuperar:
> 1. 📝 Protesta el cheque en tu banco (tienes 30 días desde la fecha del cheque)
>    → El protesto afecta su récord en Infocorp/Sentinel
> 2. 📄 Envía carta notarial exigiendo pago en 72 horas
> 3. ⚖️ Si no paga, con el cheque protestado puedes iniciar proceso ejecutivo (más rápido que demanda normal)
> 
> Acciones inmediatas que puedo tomar:
> ❌ Bloquear crédito y cheques de este cliente
> ❌ Suspender despachos pendientes
> ⚠️ Marcar en CRM como moroso
> 
> Su deuda total: S/6,000 (cheque) + S/2,500 (facturas pendientes) = S/8,500
> 
> ⚠️ Para acciones legales, consulta con tu abogado.
> ¿Bloqueo al cliente?"

---

#### Scenario 26: Problema con proveedor chino

**Message:**
> "el proveedor de shenzhen me mando 200 audifonos que no funcionan. ya le pagué USD 1,600. como reclamo? tengo fotos y video"

**Skills involved:** `yaya-escalation`, general knowledge
**MCP tools:** None directly applicable

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 4 | General advice only. Can't actually manage supplier dispute |
| Accuracy | 4 | International trade disputes are complex — no specialized knowledge |
| Speed | 7 | Quick general guidance |
| Completeness | 2 | No: supplier communication templates (in Chinese), trade dispute process, Alibaba dispute mechanism, quality claim documentation |
| Delight | 3 | Advice but no real solution |
| Safety | 7 | Must disclaim |

**Gaps:**
- **No international supplier management.** This is a common scenario for any importer. Platform should:
  - Help draft a formal complaint (ideally in Chinese — Lucía is bilingual but business disputes need formal language)
  - Know Alibaba/1688 dispute resolution processes
  - Help document the defects (photo organization, video compilation)
  - Track the claim through resolution
  - Calculate the financial exposure
- **No quality control tracking.** Platform should track defect rates by supplier over time.
- **No insurance claim guidance.** If Lucía has transport/goods insurance, this might be claimable.

**Ideal response:**
> "Reclamo por audífonos defectuosos — USD 1,600:
> 
> Pasos inmediatos:
> 1. 📸 Documenta todo: fotos y video de los defectos, guarda el embalaje
> 2. 📧 Envía reclamo formal al proveedor por email/WeChat con:
>    • Número de orden/factura
>    • Fotos y videos de los defectos
>    • Cantidad defectuosa (200 de cuántas?)
>    • Pedido: reemplazo o reembolso
> 
> ¿Compraste por Alibaba? Si sí:
> → Abre disputa en Alibaba Trade Assurance (si aplica)
> → Tienen hasta USD 2,000 de cobertura
> 
> Si fue directo:
> → Negocia: descuento en próximo pedido o reemplazo
> → Amenaza con cambiar proveedor (si tienes alternativa)
> 
> ¿Quieres que te redacte el mensaje de reclamo en chino y español?"

---

### EDGE CASES (5 scenarios)

---

#### Scenario 27: Comunicación bilingüe

**Message:**
> "mi tía de guangzhou me pregunta 这批货什么时候到? (cuando llega el pedido). le digo que revise tracking. ayudame a calcular si el lote de USD 8,000 me conviene al tipo de cambio de hoy"

**Skills involved:** `yaya-voice` (multilingual), calculation
**MCP tools:** No FX API, voice/language detection tools

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 6 | LLM can handle Chinese + Spanish. FX calculation is the gap |
| Accuracy | 5 | Chinese translation is within LLM capability. Exchange rate source missing |
| Speed | 7 | Quick response possible |
| Completeness | 4 | Translation ✅, FX conversion partial, landed cost analysis missing, "conviene" requires profitability analysis |
| Delight | 6 | Bilingual support would be impressive |
| Safety | 8 | No risk |

**Gaps:**
- **No FX rate integration** (recurring gap).
- **"Me conviene"** — Lucía needs: landed cost (FOB + freight + customs + IGV import), selling price per unit, margin, comparison to current inventory cost. Platform can't do full import profitability analysis.
- `yaya-voice` supports multilingual but mainly for customer-facing conversations. Business owner bilingual support isn't explicitly covered.

**Ideal response:**
> "Para tu tía: 告诉她查看物流追踪。集装箱大概4月8号到卡亚俄港。
> (Dile que revise el tracking. El contenedor llega aprox. 8 de abril a Callao.)
> 
> Cálculo del lote USD 8,000:
> Tipo de cambio hoy: S/3.78
> En soles: S/30,240 (FOB)
> 
> Costo estimado landed:
> • FOB: S/30,240
> • Flete/seguro: ~S/1,800
> • Aranceles (6%): ~S/1,922
> • IGV importación: ~S/6,113
> • Otros: ~S/1,000
> • Total: ~S/41,075
> 
> Si vendes el lote en S/58,000 (tu precio de lista), margen bruto ~29%.
> ¿Comparado con el dólar de hace un mes (S/3.72)?
> Habrías pagado S/29,760 — el dólar te cuesta S/480 más hoy.
> 
> ¿Le confirmo el pedido a tu tía?"

---

#### Scenario 28: Venta en dólares a cliente local

**Message:**
> "cliente quiere pagar en dolares, son S/7,200 de mercaderia. a cuanto le cobro en USD? usa tipo de cambio de hoy"

**Skills involved:** Calculation, needs FX data
**MCP tools:** No FX API

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 6 | Math is simple. FX rate source is the gap |
| Accuracy | 5 | Depends on FX rate source |
| Speed | 6 | Need external data |
| Completeness | 4 | Conversion yes, but: which rate (compra/venta/SBS)? Invoice currency? SUNAT compliance? |
| Delight | 5 | Partial answer |
| Safety | 7 | Should use official rate |

**Gaps:**
- **No FX rate integration** (recurring gap).
- **Multi-currency invoicing.** SUNAT allows invoices in USD but requires SBS exchange rate on the invoice date. Platform needs this for compliance.
- Should specify: type of change (compra vs venta), source (SBS, SUNAT, bank rate).

**Ideal response:**
> "Tipo de cambio hoy:
> • SBS venta: S/3.785
> • SBS compra: S/3.775
> 
> Para cobrar, usa tipo venta: S/3.785
> S/7,200 ÷ 3.785 = USD 1,902.25
> 
> Cobra USD 1,903 (redondeo a tu favor).
> 
> ⚠️ Si emites factura en USD, SUNAT exige usar tipo de cambio SBS del día. ¿Facturo en soles o en dólares?"

---

#### Scenario 29: Safety-critical — Producto falsificado

**Message:**
> "un cliente me ofrece un lote de 'cargadores Apple originales' a precio muy bajo. huele a falsificacion. si los vendo y son truchos que me pasa? hay multa?"

**Skills involved:** `yaya-escalation` (safety), general knowledge
**MCP tools:** None

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 7 | LLM can provide solid legal guidance on counterfeiting |
| Accuracy | 6 | General knowledge about trademark law in Peru is available but may not be current |
| Speed | 8 | Quick response |
| Completeness | 6 | Legal risks can be explained. Missing: INDECOPI procedures, specific penalties, reporting mechanism |
| Delight | 7 | Valuable warning that could save Lucía serious trouble |
| Safety | 9 | Correctly discourages illegal activity |

**Gaps:**
- **No product authenticity verification resources.** Platform could link to brand verification programs.
- **No regulatory compliance database.** Specific INDECOPI penalties and procedures should be referenced.
- Good general guidance is possible from LLM knowledge alone.

**Ideal response:**
> "🚨 NO compres ni vendas productos falsificados. Las consecuencias:
> 
> Legal (Decreto Legislativo 1075):
> • Multa INDECOPI: hasta 150 UIT (S/742,500 en 2026)
> • Decomiso de toda la mercadería falsificada
> • Posible cierre temporal del negocio
> • Antecedentes que complican importaciones futuras
> 
> Penal (si el monto es alto):
> • Delito contra propiedad industrial (Art. 222 Código Penal)
> • Pena de hasta 5 años de cárcel
> 
> En la práctica en Mesa Redonda:
> • INDECOPI hace operativos sorpresa
> • Apple y Samsung tienen equipos legales que denuncian activamente
> • Si te decomisan, pierdes todo — no solo lo falso
> 
> Consejo: Ni lo toques. No vale el riesgo. Si quieres cargadores baratos, busca marcas genéricas sin logo de marca registrada.
> 
> ⚠️ Orientativo. Consulta con tu abogado si necesitas más detalle."

---

#### Scenario 30: Safety-critical — Robo en tienda

**Message:**
> "me robaron mercaderia del almacen, calculo S/12,000 en audifonos y parlantes. ya hice denuncia policial. como registro la perdida? afecta mi declaracion sunat?"

**Skills involved:** `yaya-tax`, `yaya-inventory`, `yaya-escalation`
**MCP tools:**
- `erpnext-mcp` → stock adjustment (loss/write-off)
- `invoicing-mcp` → tax implications

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 5 | Stock write-off possible. Tax implications are complex |
| Accuracy | 4 | Tax treatment of theft losses in Peru requires specific knowledge (Art. 37 LIR) |
| Speed | 6 | Multiple steps |
| Completeness | 4 | Stock adjustment yes, but: insurance claim process, tax deductibility requirements, SUNAT notification, loss documentation |
| Delight | 5 | Partial help in a stressful situation |
| Safety | 8 | Should emphasize professional advice |

**Gaps:**
- **No loss/write-off management.** Platform doesn't have a "record loss" workflow that handles both inventory and tax implications.
- **Tax treatment of theft is complex.** In Peru, theft losses are deductible ONLY if: properly documented, police report filed, not covered by insurance, and declared to SUNAT. Platform doesn't know these specific rules.
- **No insurance claim workflow.** If Lucía has business insurance, S/12,000 loss should trigger a claim.

**Ideal response:**
> "Lamento lo del robo 😔 Pasos para registrar:
> 
> 1. ✅ Denuncia policial — hecho
> 
> 2. 📦 Inventario de pérdida:
> Necesito que me digas exactamente qué robaron (producto, cantidad, costo) para dar de baja en inventario.
> 
> 3. 💰 Impacto SUNAT:
> • La pérdida SÍ puede ser deducible como gasto para Renta (Art. 37 inc. d LIR)
> • Requisitos: denuncia policial + inventario de pérdida + que no haya cobertura de seguro
> • El IGV de las compras ya declarado NO se pierde
> • Debes comunicar la pérdida extraordinaria a SUNAT
> 
> 4. 🛡️ ¿Tienes seguro contra robo? Si sí, presenta el siniestro YA.
> 
> Acciones que puedo hacer ahora:
> ✅ Dar de baja el stock robado en inventario
> ✅ Registrar la pérdida como gasto extraordinario
> 
> ⚠️ Habla con tu contadora para la declaración y la comunicación a SUNAT.
> ¿Me pasas el detalle de lo robado?"

---

#### Scenario 31: Múltiples monedas en un día

**Message:**
> "hoy recibi pagos en soles, dolares y un cliente me pago con yuan por wechat pay (¥850). registra todo. dame total del dia en soles"

**Skills involved:** `yaya-payments`, needs FX data
**MCP tools:**
- `erpnext-mcp` → record payments (3 currencies)
- No FX API for CNY/PEN conversion
- No WeChat Pay integration

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 3 | Soles and USD maybe. Yuan via WeChat Pay? No chance |
| Accuracy | 2 | No CNY exchange rate, no WeChat Pay integration |
| Speed | 3 | Multiple unknowns |
| Completeness | 2 | No multi-currency daily reconciliation, no WeChat Pay support, no Yuan conversion |
| Delight | 2 | Can't fulfill the request |
| Safety | 7 | Should flag the WeChat Pay for tax compliance |

**Gaps:**
- **CRITICAL: No multi-currency support.** Lucía operates in PEN, USD, and occasionally CNY. Platform only handles PEN payment methods (Yape, Plin, bank transfers).
- **No WeChat Pay integration.** WeChat Pay is standard for Chinese-Peruvian commerce. Platform is blind to it.
- **No multi-currency daily reconciliation.** Converting all payments to PEN at day's exchange rate is a basic accounting need for an importer.
- **No SUNAT multi-currency compliance.** All foreign currency income must be converted at SBS rate on transaction date.

**Ideal response:**
> "Pagos de hoy registrados:
> 
> 🇵🇪 Soles: S/5,200
> 🇺🇸 Dólares: USD 850 × S/3.78 = S/3,213
> 🇨🇳 Yuan: ¥850 × S/0.52 = S/442
> 
> Total del día en soles: S/8,855
> 
> Tipos de cambio usados (SBS):
> • USD/PEN: 3.78
> • CNY/PEN: 0.52
> 
> ⚠️ El pago en yuan por WeChat Pay:
> • Registra el comprobante de WeChat para tu contadora
> • SUNAT requiere tipo de cambio SBS del día para la conversión
> • Declara como ingreso en moneda extranjera"

---

#### Scenario 32: Stock masivo — múltiples variantes

**Message:**
> "llegaron 2000 protectores de pantalla. 500 iphone 15, 300 iphone 14, 400 samsung s24, 300 samsung a54, 200 xiaomi 14, 300 redmi note 13. registra todo en inventario con codigo"

**Skills involved:** `yaya-inventory`
**MCP tools:**
- `erpnext-mcp` → stock entry (type: Material Receipt, 6 line items)
- `erpnext-mcp` → create/update items if new variants

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 7 | Stock entry with multiple items is within ERPNext capability |
| Accuracy | 7 | Straightforward data entry. SKU code generation is the question |
| Speed | 5 | 6 line items + potential new item creation = many MCP calls |
| Completeness | 5 | Can register stock. Missing: auto-SKU generation, batch/lot tracking, cost per variant, shelf location |
| Delight | 6 | Bulk registration is useful but tedious via chat |
| Safety | 8 | Should confirm totals |

**Gaps:**
- **No auto-SKU generation system.** "Registra todo con código" — platform needs a consistent SKU scheme (e.g., PROT-IPH15, PROT-SS24). No skill defines SKU generation logic.
- **No barcode generation.** Lucía's 500+ SKUs need barcodes for efficient warehouse management.
- **No batch/lot tracking.** This shipment should be tracked as a batch for cost accounting (all arrived at same FX rate, same import cost).
- **Bulk entry via chat is inefficient.** For 2,000 items in 6 variants, CSV import would be much faster.

**Ideal response:**
> "Stock registrado ✅ Protectores de pantalla — Lote 2026-03-21:
> 
> • PROT-IPH15 (iPhone 15): +500 → total: 750
> • PROT-IPH14 (iPhone 14): +300 → total: 480
> • PROT-SS24 (Samsung S24): +400 → total: 620
> • PROT-SA54 (Samsung A54): +300 → total: 510
> • PROT-XI14 (Xiaomi 14): +200 → total: 340
> • PROT-RN13 (Redmi Note 13): +300 → total: 430
> 
> Total ingresado: 2,000 unidades ✅
> Costo por lote: ¿? (necesito costo de importación para registrar)
> 
> ¿Quieres que genere códigos de barra para estos productos?"

---

## SUMMARY: Lucía Chen — Electrónica Chen Importaciones

### Overall Scores by Dimension

| Dimension | Average (32 scenarios) | Notes |
|-----------|----------------------|-------|
| Handleable | 5.6 | Many core scenarios can't be handled at all |
| Accuracy | 5.2 | Exchange rates, customs, and supply chain are black holes |
| Speed | 5.8 | When handleable, speed is reasonable |
| Completeness | 3.9 | **Worst dimension** — most answers are partial at best |
| Delight | 5.0 | Functional when it works, but Lucía needs SPEED and she gets gaps |
| Safety | 8.2 | Generally safe, good disclaimers |

**Overall Average: 5.6 / 10**

### Top 3 Strengths

1. **Tax/Invoicing (yaya-tax)** — Factura/boleta generation, credit notes, and IGV calculation are the strongest capability for Lucía. This solves a real daily pain point (daily task #8: "Emitir facturas y guías de remisión").

2. **Basic Analytics (yaya-analytics)** — Sales comparisons, top products, and customer analysis are well-designed. The WhatsApp-first formatting matches Lucía's terse communication style. Period-over-period comparisons are genuinely useful.

3. **CRM Customer Tracking (yaya-crm)** — Customer segmentation, purchase history, and interaction logging provide the "memory" Lucía needs for 50+ daily WhatsApp conversations. Knowing who a provincial client is and what they've bought before is valuable.

### Top 3 Critical Gaps

1. **🔴 No Import/Supply Chain Management** — Lucía's business IS importing. She imports containers from China monthly. The platform has ZERO capability for: purchase orders to international suppliers, container tracking, customs/DUA management, import duty calculation, despachante coordination, landed cost calculation. This is not a nice-to-have — it's the core of her business model. Without this, the platform is like a restaurant management tool that can't handle food orders. **(Scenarios 6, 16, 18, 24 — all score 0-2)**

2. **🔴 No Shipping/Logistics Skill** — Lucía ships 5-10 packages daily to provinces via Olva Courier and Shalom. No skill handles: dispatch scheduling, courier API integration, tracking number generation, contra-entrega (COD) management, guía de remisión transport documents, shipping cost calculation. This is a DAILY core operation completely missing. **(Scenarios 5, 14, 20 — all score 1-3)**

3. **🔴 No Exchange Rate / Multi-Currency Support** — Lucía checks the USD/PEN rate DAILY (daily task #5). She pays suppliers in USD, occasionally receives CNY, and sometimes invoices in USD. The platform has no FX data source, no multi-currency payment tracking, no FX impact analysis. For an importer, currency is not an edge case — it's the foundation of every cost calculation. **(Scenarios 8, 27, 28, 31 — all score 2-5)**

### Additional Critical Gaps

4. **No Credit Management** — Provincial wholesale is credit-based. Same gap as Jorge but even more critical at Lucía's volume (S/1.5M/year, dozens of provincial clients). **(Scenarios 9, 10)**
5. **No Detracción/Retención System** — Lucía is agente de retención IGV and deals with detracciones on every large sale. Platform doesn't handle these complex tax mechanisms. **(Scenario 15)**
6. **No Bulk Operations** — 8 invoices, 6 stock variants, 500+ SKUs, 50+ daily messages. Everything needs to scale, but the platform is designed for one-at-a-time interactions. **(Scenarios 7, 13, 32)**
7. **No WeChat Pay / International Payment Tracking** — Standard in Chinese-Peruvian commerce. Completely invisible to platform. **(Scenario 31)**
8. **No Price List Generation/Distribution** — Lucía's weekly task is updating and sharing a wholesale price list. Platform can't generate shareable documents. **(Scenario 3)**

### PMF Readiness Score: 22%

**Rationale:** The platform was designed for B2C retail businesses selling directly to consumers via WhatsApp (shoe stores, clothing shops, salons). Lucía's business is a B2B importer-wholesaler with fundamentally different operational needs:

| Capability | Platform Has | Lucía Needs |
|-----------|-------------|-------------|
| Sales registration | ✅ Basic | ✅ Bulk/batch |
| Invoicing | ✅ Good | ✅ Masiva + guías |
| Inventory | ✅ Basic | ⚠️ 500+ SKUs + variants |
| Customer CRM | ✅ Good | ⚠️ B2B wholesale |
| Import/Supply chain | ❌ None | 🔴 CORE NEED |
| Shipping/Logistics | ❌ None | 🔴 CORE NEED |
| Exchange rates | ❌ None | 🔴 DAILY NEED |
| Credit management | ❌ None | 🔴 CORE NEED |
| Multi-currency | ❌ None | 🔴 CORE NEED |
| Customs/Duties | ❌ None | 🔴 CORE NEED |
| Detracciones | ❌ None | 🔴 COMPLIANCE |

The platform covers roughly 20-25% of Lucía's daily operational needs. The missing 75% isn't edge cases — it's core operations.

### Key Insight for Electronics Wholesale / Import Segment

**Importers don't sell products — they manage a supply chain that happens to end with a sale.** The value chain is: Source (China) → Import → Customs → Warehouse → Distribute (provinces). The platform only touches the last step (sale + invoice).

For Lucía's segment, the platform needs to become an **import-to-sale operating system**:
1. **Supply chain visibility** — PO creation, container tracking, customs status, ETA
2. **Landed cost engine** — FOB + freight + customs + duties + handling = real cost per unit
3. **Multi-currency native** — PEN/USD/CNY as first-class currencies, real-time FX rates
4. **Logistics management** — Dispatch scheduling, courier integration, tracking, COD
5. **B2B credit management** — Credit limits, aging, collection workflows
6. **Wholesale pricing engine** — Tiered pricing, volume discounts, FX-linked price updates
7. **Compliance engine** — Detracciones, retenciones, guías de remisión, import duties
8. **Bulk operations** — Batch invoicing, bulk stock entry, mass price updates

Without these, the platform is a nice WhatsApp invoicing tool — not a business operating system. Lucía would use maybe 3 features (invoicing, analytics, CRM) and still manage 80% of her business in Excel, WhatsApp groups, and phone calls.

**The Mesa Redonda opportunity is enormous** (thousands of importers with similar needs), but the platform is at least 2-3 major development cycles away from being useful for this segment.
