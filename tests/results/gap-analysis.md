# Yaya Platform — Gap Analysis for Carlos Medrano

**Persona:** Carlos Medrano, 33, Lima Peru — MedranoCorp SAC (electronics import/export, ~S/1.2M annual revenue)  
**Date:** 2026-03-20  
**Analyst:** Yaya Gap Analysis Agent

---

## 1. Coverage Matrix

### Daily Tasks

| # | Task | Skill(s) | MCP Tools Required | Coverage | Notes |
|---|------|----------|-------------------|----------|-------|
| D1 | Check WhatsApp messages from Chinese suppliers (WeChat → WhatsApp bridge) | None | None | **0%** | No WeChat integration, no supplier-facing communication skill. Yaya is 100% customer-facing. |
| D2 | Respond to customer inquiries (availability, pricing) | yaya-sales, yaya-inventory | `erpnext-mcp` (search_products, check_stock, get_item_price) | **90%** | Core strength. Handles product search, stock check, pricing in Spanish via WhatsApp. Missing: IGV-inclusive price display is not explicitly built into price formatting. |
| D3 | Check inventory levels in warehouse | yaya-inventory | `erpnext-mcp` (check_stock) | **85%** | Good coverage for single warehouse. Multi-warehouse (Callao + in-transit from China) would need configuration. No "in-transit" stock visibility from shipping/customs. |
| D4 | Process 5-15 orders per day via WhatsApp | yaya-sales | `erpnext-mcp` (create_order, create_customer), `crm-mcp` (create_contact, log_interaction) | **90%** | Excellent. Conversational order creation, customer lookup/creation, delivery notes. |
| D5 | Confirm Yape payments via screenshots | yaya-payments | `payments-mcp` (match_payment, confirm_payment), `erpnext-mcp` (get_order) | **95%** | Star feature. OCR via Qwen3.5-27B, amount matching, duplicate detection, partial payments. Exactly solves Carlos's "payment verification hell." |
| D6 | Coordinate with delivery driver | None | None | **5%** | No logistics/delivery skill. No driver messaging, route optimization, or delivery status tracking. The order exists in ERPNext but there's no last-mile delivery workflow. |
| D7 | Update pricing based on USD/PEN exchange rate | None | None | **0%** | No exchange rate lookup tool. No automatic price recalculation based on FX rates. Carlos does this manually. |
| D8 | Respond to after-hours messages | yaya-sales | All sales MCP tools | **95%** | 24/7 AI agent is a core advantage. Auto-replies, business hours awareness, queued escalations. |

### Weekly Tasks

| # | Task | Skill(s) | MCP Tools Required | Coverage | Notes |
|---|------|----------|-------------------|----------|-------|
| W1 | Review weekly sales numbers | yaya-analytics | `erpnext-mcp`, `postgres-mcp`, `crm-mcp` | **90%** | Strong. Weekly report with comparisons, top products, revenue trends. WhatsApp-formatted. |
| W2 | Place restock order to Shenzhen supplier | yaya-inventory (reorder suggestions only) | `erpnext-mcp` (check_stock) | **15%** | Yaya can suggest what to reorder based on sales velocity. But: no purchase order creation, no supplier communication, no Alibaba integration, no WeChat messaging to suppliers. |
| W3 | Pay employees (weekly payroll) | None | None | **0%** | No payroll skill. No HR/employee management. No PLAME integration. |
| W4 | Reconcile bank account with orders | None | None | **0%** | No bank feed integration. No BCP API connector. No reconciliation tool. |
| W5 | Update product catalog with new items | yaya-inventory, yaya-onboarding (partial) | `erpnext-mcp` (implicit — no "create_product" tool exists!) | **20%** | Onboarding allows initial catalog setup. But there's no `create_item` or `update_item` tool in erpnext-mcp! Carlos can't add new products via chat. Major gap. |
| W6 | Follow up with interested but non-buying customers | yaya-followup | `crm-mcp` (search_contacts, log_interaction), `erpnext-mcp` | **85%** | Good coverage: abandoned conversation recovery, restock notifications, smart timing, cooldown periods. |
| W7 | SUNAT electronic invoicing (boletas/facturas) | None | None | **0%** | Critical gap. No SUNAT integration. No boleta/factura generation. No electronic signing. ERPNext can generate invoices (create_invoice tool exists) but these are NOT SUNAT-compliant electronic documents. |
| W8 | Review shipping status of containers from China | None | None | **0%** | No shipping/tracking integration. No port/customs status visibility. |
| W9 | Meet with customs broker about pending shipments | None | None | **0%** | No customs integration. Purely offline activity, but could benefit from document preparation. |

### Monthly Tasks

| # | Task | Skill(s) | MCP Tools Required | Coverage | Notes |
|---|------|----------|-------------------|----------|-------|
| M1 | SUNAT monthly IGV tax declaration | None | None | **0%** | No SUNAT API. No tax calculation aggregation. No PDT/declara fácil integration. |
| M2 | Income tax advance payment | None | None | **0%** | No tax tool. |
| M3 | PLAME payroll declaration | None | None | **0%** | No payroll/PLAME tool. |
| M4 | Inventory audit (physical vs system) | yaya-inventory (partial) | `erpnext-mcp` (check_stock) | **30%** | Can report system stock levels, but no physical count workflow, no variance detection, no audit trail for adjustments. |
| M5 | Review P&L and cash flow | yaya-analytics (partial) | `erpnext-mcp`, `postgres-mcp` | **40%** | Sales revenue analytics exist. But: no cost of goods tracking, no import cost allocation, no cash flow analysis, no expense tracking. P&L requires cost data that isn't captured. |
| M6 | Negotiate with freight forwarder | None | None | **0%** | Offline activity. No freight/logistics integration. |
| M7 | Competitor pricing analysis | None | None | **0%** | No web scraping, no marketplace price monitoring. |
| M8 | Insurance review/renewal | None | None | **0%** | Offline activity, outside scope. |
| M9 | Send export documentation (Certificate of Origin, phytosanitary cert) | None | None | **0%** | No document generation. No export compliance workflow. |
| M10 | Plan purchasing trip to China | None | None | **0%** | Offline activity, outside scope. |

### Test Scenarios Coverage

| # | Scenario | Covered? | Coverage |
|---|----------|----------|----------|
| T1 | "Cuántas fundas iPhone 15 me quedan?" | ✅ yaya-inventory | **95%** |
| T2 | [Yape screenshot] "Confirma pago de Gutiérrez" | ✅ yaya-payments | **95%** |
| T3 | "Precio del cargador USB-C con IGV" | ⚠️ yaya-sales (price yes, IGV calc unclear) | **70%** |
| T4 | "Registra pedido: 10 fundas, 5 cables para Juan Pérez" | ✅ yaya-sales | **90%** |
| T5 | "Qué pedidos pendientes de pago?" | ✅ payments-mcp (list_pending_payments) | **95%** |
| T6 | [Voice note] "Cuánto vendimos esta semana" | ✅ yaya-sales (Whisper) + yaya-analytics | **90%** |
| T7 | "El cliente ya pagó, búscalo por S/150" | ✅ payments-mcp (match_payment) | **90%** |
| T8 | "Manda mensaje a todos los que preguntaron por audífonos" | ✅ yaya-followup + yaya-crm | **80%** |
| T9 | "Resumen de ventas semanal vs anterior" | ✅ yaya-analytics | **90%** |
| T10 | "Cuánto stock de cables? Pedir a China si <50" | ⚠️ Stock check yes, PO to China no | **40%** |
| T11 | "Factura electrónica para Empresa XYZ, RUC 20456789012" | ❌ No SUNAT integration | **0%** |
| T12 | "Cuánto me debe el cliente Martínez?" | ✅ payments-mcp + erpnext-mcp | **85%** |
| T13 | "Preparar declaración IGV: boletas vs facturas" | ❌ No SUNAT/tax tool | **0%** |
| T14 | "Dame P&L incluyendo costos de importación" | ⚠️ Partial — no cost tracking | **20%** |
| T15 | "Ganancia por producto, cuáles dan más margen" | ⚠️ Need cost of goods data | **15%** |
| T16 | "¿Vale la pena pedir 5000 unidades con 15% descuento?" | ⚠️ Analytics partial, no demand forecasting | **25%** |
| T17 | "ESTE PEDIDO ESTÁ MAL!!! COBRARON DOBLE!!!" | ✅ yaya-escalation | **95%** |
| T18 | "Container retenido en aduana, qué hago?" | ❌ No customs tool | **0%** |
| T19 | "Quiero hablar con alguien REAL" | ✅ yaya-escalation | **95%** |
| T20 | "Quiero devolver todo y que me regresen mi plata" | ✅ yaya-escalation (escalates refunds) | **85%** |
| T21 | [Damaged product image] "Cliente quiere devolución" | ⚠️ Escalation yes, returns workflow no | **50%** |
| T22 | "Cuánto es en dólares?" | ❌ No exchange rate tool | **0%** |
| T23 | "Cotización para 500 unidades" | ✅ erpnext-mcp (create_quotation) | **85%** |
| T24 | Mixed English/Spanish query | ✅ LLM handles multilingual naturally | **90%** |

---

## 2. Missing Capabilities — Detailed Breakdown

### 2.1 SUNAT Electronic Invoicing (Boletas/Facturas)
**Current state:** Zero coverage.  
**What Carlos needs:**
- Generate **boletas** (simplified receipts for individuals) and **facturas** (invoices for businesses with RUC)
- Electronically sign documents per SUNAT requirements (UBL 2.1 XML format)
- Send to SUNAT via their REST API and receive CDR (Constancia de Recepción)
- Generate PDF for customer delivery via WhatsApp
- Monthly summary of boletas/facturas for IGV declaration
- Support for notas de crédito (credit notes) and notas de débito

**Why it's critical:** This is a legal obligation. Every business in Peru must issue electronic documents. Carlos currently does this manually, likely through a separate provider (Nubefact, PSE-SUNAT, etc.). Without this, Yaya is incomplete for any Peruvian business.

**ERPNext note:** ERPNext has Peru localization modules, but the `erpnext-mcp` doesn't expose any SUNAT/invoicing tools beyond generic `create_invoice`.

### 2.2 Exchange Rate Lookups (USD/PEN, RMB/PEN)
**Current state:** Zero coverage.  
**What Carlos needs:**
- Real-time USD/PEN and RMB/PEN exchange rates
- Buy/sell rates from SUNAT (official), BCP, and parallel market
- Historical rate lookups for cost calculations
- Automatic price recalculation when FX moves beyond threshold
- Currency conversion in conversations ("cuánto es en dólares?")

**Why it's critical:** Carlos's entire margin is FX-dependent. He buys in USD/RMB and sells in PEN. A simple API call (SUNAT, BCRP, or free services like exchangerate-api.com) would save him daily manual lookups.

### 2.3 Customs/Shipping Tracking
**Current state:** Zero coverage.  
**What Carlos needs:**
- Container tracking (by B/L number or container number)
- Callao port arrival status (SUNAT Aduanas integration)
- Customs clearance status (DAM - Declaración Aduanera de Mercancías)
- Estimated arrival dates and delay alerts
- Document status for each shipment (commercial invoice, packing list, B/L, certificate of origin)

**Feasibility note:** Container tracking APIs exist (MarineTraffic, TrackingMore, project44). SUNAT Aduanas has a portal but no public API — may need scraping.

### 2.4 Chinese Supplier Communication (WeChat Bridge)
**Current state:** Zero coverage.  
**What Carlos needs:**
- Forward messages between WeChat and WhatsApp (or at least Yaya)
- Translation assistance (Spanish ↔ Mandarin)
- Alibaba order status checking
- Supplier payment tracking (SWIFT wire status)

**Feasibility note:** WeChat API is notoriously restricted. This is the hardest gap to close. More realistic: a translation-assist tool and structured supplier communication templates.

### 2.5 Payroll Management
**Current state:** Zero coverage.  
**What Carlos needs:**
- Weekly payroll calculation for 5 employees
- PLAME monthly declaration to SUNAT
- CTS (Compensación por Tiempo de Servicios) calculations
- Gratificaciones (July/December bonuses)
- Vacations tracking
- AFP/ONP pension contributions

**Why it's relevant:** Carlos pays 5 employees weekly. This is a recurring pain point that involves SUNAT compliance (PLAME).

### 2.6 Document Generation
**Current state:** Zero coverage.  
**What Carlos needs:**
- Commercial invoices for export (English, formatted for Chinese customs)
- Certificates of Origin (issued by Lima Chamber of Commerce — needs application form)
- Packing lists
- Proforma invoices for suppliers
- Phytosanitary certificates (application to SENASA for superfoods)

### 2.7 Purchase Order Management
**Current state:** Reorder suggestions exist in yaya-inventory, but no PO creation.  
**What's missing in erpnext-mcp:** No `create_purchase_order`, `list_suppliers`, `get_supplier`, `list_purchase_orders` tools. ERPNext has full PO functionality, but the MCP server doesn't expose it. This means Carlos can't manage the buy-side of his business through Yaya.

### 2.8 Product Catalog Management
**Current state:** Onboarding allows initial setup, but ongoing management is broken.  
**What's missing in erpnext-mcp:** No `create_item`, `update_item`, `delete_item` tools. Carlos can't add new products from China via chat. He can only search and check existing ones.

### 2.9 Returns/Refunds Workflow
**Current state:** yaya-escalation detects refund requests and escalates to owner. No automated returns processing.  
**What Carlos needs:** A structured returns flow — log return reason, generate credit note, update inventory, process refund or store credit.

### 2.10 Delivery/Logistics Tracking
**Current state:** Zero coverage for last-mile delivery.  
**What Carlos needs:** Assign deliveries to driver, track delivery status, customer delivery notifications, proof of delivery.

### 2.11 Bank Account Integration
**Current state:** Zero coverage.  
**What Carlos needs:** BCP account balance check, transaction feed for reconciliation, automated matching of bank transactions to orders.

---

## 3. New Skills Needed

### 3.1 `yaya-tax` — Tax Compliance & SUNAT Integration
**Description:** Manages Peruvian tax compliance — SUNAT electronic invoicing (boletas/facturas/notas de crédito), monthly IGV declarations, income tax advance payments. Generates UBL 2.1 XML, signs electronically, submits to SUNAT API, and delivers PDF to customers via WhatsApp. Extensible to other LATAM tax authorities (DIAN Colombia, SAT Mexico).  
**Priority:** 🔴 Critical  
**MCP needed:** `sunat-mcp`

### 3.2 `yaya-forex` — Exchange Rate & Currency Management
**Description:** Real-time and historical exchange rate lookups for LATAM currencies. Monitors FX rates and alerts the business owner when thresholds are crossed. Handles in-conversation currency conversion ("¿cuánto es en dólares?"). Sources: SUNAT, BCRP, open exchange rate APIs.  
**Priority:** 🔴 Critical for import/export businesses  
**MCP needed:** `forex-mcp`

### 3.3 `yaya-logistics` — Delivery & Shipping Management
**Description:** Last-mile delivery coordination — assign orders to drivers, track delivery status, send customer notifications ("tu pedido va en camino 🚚"), proof of delivery via photo. For import businesses: container tracking, customs status alerts, document checklist per shipment.  
**Priority:** 🟡 High  
**MCP needed:** `logistics-mcp`

### 3.4 `yaya-purchasing` — Supplier & Purchase Management
**Description:** Manages the buy side — create purchase orders, track supplier shipments, manage supplier contacts, compare supplier pricing. Provides reorder workflows that go beyond suggestions to actual PO creation. Supports multi-currency purchasing.  
**Priority:** 🟡 High  
**MCP needed:** Extensions to `erpnext-mcp`

### 3.5 `yaya-documents` — Business Document Generation
**Description:** Generates formatted business documents from templates — commercial invoices, proforma invoices, packing lists, quotation PDFs. Delivers as PDF via WhatsApp. For export: Certificate of Origin applications, phytosanitary cert applications.  
**Priority:** 🟡 High  
**MCP needed:** `documents-mcp` (template engine + PDF generation)

### 3.6 `yaya-payroll` — Employee Payroll & HR
**Description:** Basic payroll management for small businesses — calculate pay, track hours, compute legal deductions (AFP/ONP, EsSalud), generate PLAME data for SUNAT. Supports weekly and monthly pay cycles. Track vacations, CTS, gratificaciones.  
**Priority:** 🟠 Medium  
**MCP needed:** `payroll-mcp`

### 3.7 `yaya-returns` — Returns & Refunds Workflow
**Description:** Structured returns processing — customer initiates return via WhatsApp (with photo evidence), agent logs the return, generates credit note (via yaya-tax), updates inventory on receipt, processes refund or store credit. Tracks return rate by product for quality insights.  
**Priority:** 🟠 Medium  
**MCP needed:** Extensions to `erpnext-mcp` + `sunat-mcp`

---

## 4. New MCP Tools Needed

### 4.1 `sunat-mcp` — SUNAT Electronic Invoicing
```
Tools:
  - create_boleta: Generate electronic boleta de venta
  - create_factura: Generate electronic factura
  - create_nota_credito: Generate credit note
  - create_nota_debito: Generate debit note
  - check_ruc: Validate and lookup RUC number (SUNAT public API)
  - get_igv_summary: Aggregate monthly IGV data for declaration
  - get_document_status: Check CDR status for a submitted document
  - list_documents: List issued electronic documents with filters
  - generate_pdf: Generate PDF of an electronic document
```
**Feasibility:** Medium. SUNAT has a REST API for OSE (Operador de Servicios Electrónicos). Alternatively, integrate with existing Peruvian e-invoicing providers (Nubefact, Efact, PSE) which have simpler APIs. UBL 2.1 XML generation is well-documented.

### 4.2 `forex-mcp` — Exchange Rate Service
```
Tools:
  - get_rate: Get current exchange rate (pair, source)
  - get_sunat_rate: Get official SUNAT exchange rate for a date
  - convert_amount: Convert amount between currencies
  - get_rate_history: Historical rates for a date range
  - set_rate_alert: Create alert when rate crosses threshold
  - list_rate_alerts: List active rate alerts
```
**Feasibility:** Easy. Multiple free APIs available (exchangerate-api.com, BCRP API, SUNAT daily rates). Could be built in a day.

### 4.3 `logistics-mcp` — Shipping & Delivery Tracking
```
Tools:
  - track_container: Track container by B/L or container number
  - create_delivery: Create delivery assignment for driver
  - update_delivery_status: Update delivery status (picked, in-transit, delivered)
  - get_delivery_status: Check delivery status for an order
  - list_pending_deliveries: List undelivered orders
  - upload_delivery_proof: Store proof of delivery photo
```
**Feasibility:** Medium. Container tracking via TrackingMore API or MarineTraffic. Last-mile delivery is a simple Postgres-based workflow.

### 4.4 `erpnext-mcp` Extensions (add to existing server)
```
New tools needed:
  - create_item: Create a new product in the catalog
  - update_item: Update product details (price, description, variants)
  - create_purchase_order: Create PO for supplier
  - list_purchase_orders: List POs with status
  - list_suppliers: Search suppliers
  - create_supplier: Create new supplier record
  - create_stock_entry: Record stock adjustments (for inventory audits)
  - get_profit_report: Get gross profit by item/period (if ERPNext supports)
```
**Feasibility:** Easy. These are standard ERPNext API endpoints. The existing MCP server pattern makes adding them straightforward.

### 4.5 `documents-mcp` — Document Generation
```
Tools:
  - generate_commercial_invoice: Create export commercial invoice PDF
  - generate_packing_list: Create packing list PDF
  - generate_proforma: Create proforma invoice PDF
  - generate_quotation_pdf: Create formatted quotation PDF
  - list_templates: List available document templates
```
**Feasibility:** Medium. Requires a template engine (e.g., Handlebars + Puppeteer for PDF) and business-specific templates.

### 4.6 `payroll-mcp` — Payroll Calculations
```
Tools:
  - calculate_payroll: Calculate pay for an employee/period
  - list_employees: List employees with pay rates
  - create_employee: Add a new employee
  - generate_plame: Generate PLAME data file for SUNAT submission
  - get_payroll_summary: Monthly payroll summary with deductions
  - calculate_cts: Calculate CTS for an employee
  - calculate_gratificacion: Calculate gratificación amounts
```
**Feasibility:** Medium-High. Peruvian labor law calculations are complex (AFP/ONP rates, EsSalud, CTS formulas, etc.). Would need careful compliance validation.

---

## 5. Priority Ranking (Impact × Feasibility)

| Rank | Gap | Impact (1-10) | Feasibility (1-10) | Score | Timeline |
|------|-----|:---:|:---:|:---:|----------|
| **1** | **erpnext-mcp extensions** (create_item, update_item, PO tools) | 9 | 10 | **90** | 1-2 days |
| **2** | **forex-mcp** (exchange rate lookups + conversion) | 8 | 10 | **80** | 1 day |
| **3** | **sunat-mcp** (electronic invoicing — boletas/facturas) | 10 | 6 | **60** | 2-4 weeks |
| **4** | **IGV-inclusive pricing** in yaya-sales (display S/ with IGV) | 7 | 9 | **63** | 2-3 hours |
| **5** | **Last-mile delivery tracking** (logistics-mcp, basic) | 7 | 8 | **56** | 3-5 days |
| **6** | **SUNAT RUC validation** (check_ruc tool) | 6 | 10 | **60** | 2-3 hours |
| **7** | **Container tracking** (logistics-mcp, import tracking) | 7 | 6 | **42** | 1-2 weeks |
| **8** | **Document generation** (documents-mcp) | 6 | 7 | **42** | 1-2 weeks |
| **9** | **Returns/refunds workflow** (yaya-returns) | 6 | 7 | **42** | 1 week |
| **10** | **Bank reconciliation** (BCP integration) | 6 | 5 | **30** | 2-3 weeks |
| **11** | **Payroll** (payroll-mcp) | 5 | 4 | **20** | 3-4 weeks |
| **12** | **PLAME generation** for SUNAT | 5 | 4 | **20** | 3-4 weeks |
| **13** | **P&L with COGS** (cost tracking in analytics) | 7 | 5 | **35** | 2-3 weeks |
| **14** | **Demand forecasting** (will 5000 units sell?) | 6 | 5 | **30** | 2-3 weeks |
| **15** | **Competitor price monitoring** | 4 | 5 | **20** | 2-3 weeks |
| **16** | **WeChat bridge** (supplier communication) | 6 | 2 | **12** | Months (API restrictions) |
| **17** | **Spanish ↔ Mandarin translation assistant** | 5 | 8 | **40** | 2-3 days |
| **18** | **Insurance/renewal tracking** | 2 | 6 | **12** | 1 week |

### Quick Wins (do this week):
1. **erpnext-mcp extensions** — Add create_item, update_item, PO tools. Unblocks catalog management and purchasing.
2. **forex-mcp** — Single API integration. Unblocks exchange rate lookups for every import/export business.
3. **IGV-inclusive pricing** — Configuration change in yaya-sales to show prices with 18% IGV by default.
4. **SUNAT RUC validation** — Free SUNAT API. Enables Carlos to validate customer RUCs for facturas.

### Medium-term (next 2-4 weeks):
5. **sunat-mcp** — Electronic invoicing is the #1 legal requirement gap. Partner with Nubefact or build direct SUNAT OSE integration.
6. **logistics-mcp (basic)** — Simple delivery tracking for last-mile.
7. **documents-mcp** — PDF generation for commercial documents.

### Long-term (1-3 months):
8. **payroll-mcp** — Complex compliance area, but high value for any Peruvian SMB.
9. **Full logistics** — Container tracking, customs integration.
10. **Bank integration** — BCP API for reconciliation.

---

## 6. Competitor Comparison

### WhatsApp Business API + Leadsales CRM vs Yaya Platform

| Capability | WhatsApp Business API + Leadsales | Yaya Platform | Advantage |
|------------|-----------------------------------|---------------|-----------|
| **WhatsApp messaging** | ✅ Core feature | ✅ Core feature | Tie |
| **Automated responses** | ⚠️ Template-based, no AI reasoning | ✅ Full AI conversation with context | **Yaya** — AI understands intent, handles complex queries |
| **CRM** | ✅ Leadsales has basic CRM | ✅ Full CRM with auto-capture, segmentation | **Yaya** — automatic data capture from conversations |
| **Payment verification** | ❌ Manual | ✅ OCR on payment screenshots | **Yaya** — Carlos's #1 pain point, solved |
| **Inventory management** | ❌ Not included | ✅ Real-time stock via ERPNext | **Yaya** — connected to actual inventory |
| **Order management** | ❌ External tool needed | ✅ Full order lifecycle in ERPNext | **Yaya** |
| **Analytics/reports** | ⚠️ Basic conversation metrics | ✅ Business analytics (sales, products, customers) | **Yaya** — actual business intelligence |
| **Appointment booking** | ❌ External tool | ✅ Built-in | **Yaya** |
| **Follow-ups** | ⚠️ Manual or basic automation | ✅ AI-powered proactive outreach | **Yaya** |
| **Escalation** | ⚠️ Manual queue routing | ✅ AI frustration detection + context summary | **Yaya** |
| **SUNAT invoicing** | ❌ Neither | ❌ Not yet | Tie (both need external) |
| **Multi-language** | ⚠️ Template per language | ✅ AI handles any language naturally | **Yaya** |
| **Pricing** | ~$50-150/month + WhatsApp per-message fees | S/99-499/month (Yaya subscription) | Comparable |
| **Data ownership** | ❌ SaaS, vendor lock-in | ✅ Open source, self-hostable | **Yaya** |
| **LATAM-specific** | ⚠️ Generic, some LATAM features | ✅ Built for LATAM (Yape, Plin, PEN, cultural nuances) | **Yaya** |
| **Voice notes** | ❌ No processing | ✅ Whisper transcription | **Yaya** |
| **Privacy** | ❌ Data on third-party servers | ✅ Self-hosted, local AI (Qwen3.5-27B) | **Yaya** |

### Yaya's Competitive Advantages:
1. **Payment screenshot OCR** — No competitor in the LATAM SMB space does this. This alone could be the killer feature.
2. **Connected to real inventory** — Most chat tools are disconnected from the business's actual systems. Yaya talks to ERPNext.
3. **AI-powered, not template-based** — Leadsales and most competitors use decision trees. Yaya uses real AI that handles unexpected queries.
4. **Open source & self-hosted** — Data sovereignty matters in LATAM, especially for import/export businesses handling trade secrets.
5. **Cultural fit** — Built for Yape/Plin, PEN currency, Peruvian Spanish, LATAM business patterns.

### Where Competitors Win:
1. **Simplicity** — WhatsApp Business API + Leadsales is simpler to set up. Yaya requires ERPNext deployment.
2. **Established ecosystem** — Leadsales has integrations with other tools out of the box.
3. **SUNAT compliance** — Neither wins, but competitors' users typically pair with a separate invoicing SaaS (Nubefact, Facturador.pe). Yaya should own this.

### The Gap That Could Lose Carlos:
If Yaya doesn't add SUNAT electronic invoicing, Carlos will ALWAYS need a parallel system. That parallel system might eventually absorb more of his workflow, making Yaya feel redundant. **SUNAT integration is the strategic lock-in opportunity** — once Carlos's invoicing runs through Yaya, switching costs become very high.

---

## Summary

### Overall Coverage Score: **42%** of Carlos's needs

| Category | Coverage |
|----------|----------|
| Customer sales (WhatsApp) | 🟢 90% |
| Payment verification | 🟢 95% |
| Inventory (read-only) | 🟡 75% |
| CRM & follow-ups | 🟢 85% |
| Analytics & reporting | 🟡 70% |
| Escalation | 🟢 95% |
| Tax compliance (SUNAT) | 🔴 0% |
| Exchange rates | 🔴 0% |
| Purchasing/suppliers | 🔴 10% |
| Logistics/delivery | 🔴 5% |
| Payroll/HR | 🔴 0% |
| Document generation | 🔴 0% |
| Catalog management (write) | 🔴 15% |

### The Bottom Line:
Yaya is **excellent at the customer-facing sales cycle** (inquiries → orders → payments → follow-ups) but has **near-zero coverage on back-office operations** (tax, payroll, purchasing, logistics, compliance). For Carlos, Yaya would immediately solve his two biggest daily pains — payment screenshot verification and after-hours customer response — but he'd still need separate tools for SUNAT, payroll, supplier management, and logistics.

The fastest path to making Yaya indispensable for Carlos:
1. Add erpnext-mcp write tools (catalog + PO) — **1-2 days**
2. Add forex-mcp — **1 day**  
3. Add SUNAT electronic invoicing — **2-4 weeks**
4. Add basic delivery tracking — **3-5 days**

These four additions would push overall coverage from **42% to ~70%** and make Yaya the primary business tool Carlos opens every morning.
