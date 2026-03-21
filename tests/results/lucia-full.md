# Test Results: Lucía Fernández — Farmacia Santa Rosa, Trujillo

**Tester:** Yaya Platform QA (Subagent)
**Date:** 2026-03-20
**Persona:** Lucía Fernández Castillo, 35, pharmacist/owner
**Business:** Farmacia Santa Rosa — neighborhood pharmacy, ~S/720K annual revenue, 4 employees
**Tax regime:** RER (Régimen Especial de Renta) — 1.5% monthly income tax
**Regulatory:** DIGEMID-licensed, controlled substance registry, MINSA health protocols

---

## Overall Score: 5/10

**Summary:** The Yaya Platform has strong foundational skills for general retail (sales, payments, CRM, analytics, invoicing), but **critically lacks pharmacy-specific capabilities**. Lucía's most urgent needs — DIGEMID controlled substance compliance, expiry date tracking at batch/lot level, insurance claims processing, and multi-supplier purchase ordering — have **no dedicated skill or MCP tooling**. For a pharmacy where medication errors can be lethal and regulatory non-compliance can shut the business down, these gaps are not merely inconvenient — they are **safety-critical blockers**. The platform cannot be deployed for Farmacia Santa Rosa without significant development.

---

## Test Results by Scenario

### CORE BUSINESS OPERATIONS

#### Scenario 1: Urgent restock — amoxicilina 500mg low stock, multi-supplier price comparison
**Skills tested:** yaya-inventory, yaya-sales
**Score: 3/10**

- ✅ `yaya-inventory` can check stock levels via `erpnext-mcp` (`check_stock`) and trigger low-stock alerts
- ✅ Reorder suggestions based on sales velocity are well-designed (example flow shows investment estimates)
- ❌ **No multi-supplier comparison tool.** ERPNext MCP only has `search_products`, `check_stock`, `create_order` (sales orders, not purchase orders). There is NO `create_purchase_order`, `list_suppliers`, `compare_supplier_prices`, or `get_supplier_catalog` tool
- ❌ Lucía uses 6+ distributors (DROKASA, Química Suiza, ALBIS). No way to query their pricing or place orders through the platform
- ❌ No concept of purchase orders vs. sales orders in the MCP layer — `create_order` creates a sales order to customers, not a restock order from suppliers
- ❌ No automated reorder threshold triggers that generate actual POs

**Gap:** ERPNext has purchase order functionality (it's a full ERP), but the `erpnext-mcp` server exposes zero purchase-side tools. This is a fundamental gap for any business that needs to restock inventory.

#### Scenario 2: Controlled substance prescription verification (Clonazepam) + DIGEMID logging
**Skills tested:** None applicable
**Score: 0/10 — ⚠️ SAFETY CRITICAL**

- ❌ **No DIGEMID compliance skill exists.** Zero tooling for controlled substance management
- ❌ No prescription verification capability (validating prescriber credentials, DEA/DIGEMID registration, prescription format compliance)
- ❌ No SISMED integration or logging tool
- ❌ No controlled substance registry/logbook functionality
- ❌ No tool to verify that a prescription meets DIGEMID requirements: prescriber name, CMP (Colegio Médico del Perú) number, patient name, date, dosage, quantity limits
- ❌ No image analysis workflow for prescription photos (though `yaya-payments` has OCR via Qwen3.5-27B for payment screenshots — this pattern COULD be adapted)
- ❌ No alerts for controlled substance quantity limits (e.g., max days supply per prescription)
- ❌ No audit trail specifically designed for DIGEMID inspections

**Safety impact:** A single error in controlled substance dispensing can result in: patient harm/death, pharmacy license revocation, criminal charges. This is the #1 gap in the platform for pharmacy use cases.

**Recommendation:** Create `yaya-pharmacy-compliance` skill with: prescription verification (image OCR + rule validation), DIGEMID controlled substance log, SISMED integration, quantity limit enforcement, prescriber validation, and inspection readiness reports.

#### Scenario 3: Delivery verification — Química Suiza order #QS-2024-1234, 45 items
**Skills tested:** yaya-inventory
**Score: 2/10**

- ❌ No `verify_delivery`, `match_purchase_order`, or `receive_goods` tool in `erpnext-mcp`
- ❌ No purchase order reference system to compare against
- ❌ No partial delivery tracking (common in pharma distribution — backorders are frequent)
- ❌ No tool to scan or input received items and flag discrepancies
- ✅ ERPNext itself supports purchase receipts and goods received notes — but MCP doesn't expose them
- ❌ No batch/lot number capture on receipt (essential for pharma — needed for expiry and recall tracking)

**Gap:** The entire purchase-to-receive cycle is missing from the MCP layer.

#### Scenario 4: Sales velocity tracking — paracetamol 500mg weekly units
**Skills tested:** yaya-analytics, yaya-inventory
**Score: 6/10**

- ✅ `yaya-analytics` can answer "¿cuántas unidades vendí esta semana?" using `postgres-mcp` + `erpnext-mcp`
- ✅ The analytics skill's behavior guidelines explicitly support on-demand queries with context ("vs. last week", sales velocity)
- ✅ `yaya-inventory` calculates reorder suggestions based on sales velocity
- ❌ No specific pharma-aware inventory forecasting (doesn't account for seasonal flu patterns, dengue outbreaks in Trujillo region, etc.)
- ⚠️ Depends on `postgres-mcp` for complex aggregations — which is production-ready — but the SQL query capability is SELECT-only on `agent.*` schema; unclear if sales velocity data lives there

#### Scenario 5: Product lookup — Losartán 50mg genérico + alternatives
**Skills tested:** yaya-inventory, yaya-sales
**Score: 5/10**

- ✅ `search_products` can find Losartán by name
- ✅ `yaya-inventory` has "suggest alternatives for out-of-stock items" capability (search similar by category, brand, price range)
- ❌ No therapeutic equivalence database — can't suggest that Losartán can be substituted with Valsartán or Irbesartán for the same indication
- ❌ No drug interaction checking
- ❌ No generic/branded equivalence mapping (e.g., Losartán MK = Losartán IQFarma = Cozaar)
- ❌ No bioequivalence or DIGEMID sanitary registry validation

**Safety concern:** Suggesting alternatives for medications is NOT the same as suggesting alternative shoes. A wrong substitution could harm the patient. The platform needs a pharmaceutical knowledge layer.

---

### PRICING & PAYMENTS

#### Scenario 6: Competitive pricing analysis — paracetamol price increase vs. Inkafarma
**Skills tested:** yaya-analytics, yaya-inventory
**Score: 4/10**

- ✅ `yaya-inventory` supports price management — business owner can query and update prices
- ✅ `yaya-analytics` can show margin analysis by product category
- ❌ No competitor price tracking or comparison tool
- ❌ No margin impact simulation ("if I raise to S/1.10, what's my margin? If I stay at S/0.80, what's my loss?")
- ❌ No price elasticity data or customer sensitivity analysis
- ⚠️ Lucía operates on 22% average margins — pricing decisions need more sophisticated tooling than what exists

#### Scenario 7: Yape payment matching — S/67.50 payment from "señora Milagros"
**Skills tested:** yaya-payments
**Score: 7/10**

- ✅ `yaya-payments` has robust Yape screenshot OCR via Qwen3.5-27B vision
- ✅ Extracts: amount, reference #, date, sender name from Yape screenshots
- ✅ Cross-references against pending orders in ERPNext via `erpnext-mcp`
- ✅ Duplicate receipt detection (hash comparison)
- ✅ Handles exact matching with ±1% tolerance
- ⚠️ At 100+ transactions/day with 30% Yape (~30 Yape payments/day), this becomes a high-volume operation. No specific performance testing or batch reconciliation mode
- ❌ No way to search historical payments by customer name ("señora Milagros") — needs CRM integration to map informal names to payment records

#### Scenario 8: EPS insurance claims tracking — Rímac, Pacífico, La Positiva outstanding amounts
**Skills tested:** None applicable
**Score: 0/10 — CRITICAL GAP**

- ❌ **No insurance claims skill exists.** Zero capability for EPS voucher processing
- ❌ No EPS provider integration (Rímac, Pacífico, La Positiva, Mapfre, SanaSalud)
- ❌ No claims submission workflow
- ❌ No claims status tracking (submitted, approved, rejected, paid)
- ❌ No rejection reason tracking or resubmission assistance
- ❌ No aging report for outstanding claims (30/60/90 days)
- ❌ No prescription-to-claim matching
- ❌ This represents 5% of Lucía's revenue but the administrative overhead is disproportionately high

**Impact:** Insurance claims are Lucía's #2 pain point. 45-90 day payment cycles, frequent rejections for minor documentation errors, and manual resubmission are all problems the platform should solve.

**Recommendation:** Create `yaya-insurance` skill with EPS claim submission, tracking, rejection analysis, resubmission automation, and aging reports.

#### Scenario 9: Customer credit tracking — S/150 credit request
**Skills tested:** yaya-crm
**Score: 4/10**

- ✅ `yaya-crm` tracks customer purchase history and lifetime value
- ✅ Can look up customer records by name/phone
- ✅ Tag management supports custom tags like "credit_customer"
- ❌ No dedicated credit/debt tracking feature — no `credit_balance`, `credit_limit`, `payment_plan` fields
- ❌ No accounts receivable system for informal credit (very common in Peruvian neighborhood pharmacies — "me fía hasta fin de mes")
- ❌ No credit risk assessment based on payment history
- ❌ No reminder system for credit repayment (yaya-followup could be adapted, but there's no trigger mechanism)

---

### INVOICING (InvoiceShelf / SUNAT)

#### Scenario 10: Boleta generation — omeprazol, jarabe, ibuprofeno with IGV
**Skills tested:** yaya-tax, invoicing-mcp
**Score: 7/10**

- ✅ `yaya-tax` has a complete boleta generation flow with DNI lookup
- ✅ `invoicing-mcp` supports `create_invoice` with document_type "03" (boleta)
- ✅ IGV calculation is well-documented (18% included in consumer price)
- ✅ Correct handling: boletas go into resumen diario for SUNAT batch submission
- ✅ The tax calculation reference is thorough and correct for RER regime
- ⚠️ At 100-130 transactions/day, bulk boleta generation performance is a concern — no batch creation tool (one at a time via `create_invoice`)
- ❌ For high-volume retail, the conversational flow (confirm each boleta individually) is too slow. Needs a batch/POS mode

**Calculation check for scenario:**
- 2× omeprazol 20mg @ S/12 = S/24.00
- 1× jarabe para tos @ S/18 = S/18.00
- 1× ibuprofeno 400mg x30 @ S/8.50 = S/8.50
- Subtotal (valor venta) = S/50.50 / 1.18 = S/42.80 (base imponible)
- IGV = S/50.50 - S/42.80 = S/7.70
- Total = S/50.50 ✅ (prices in pharmacy are typically IGV-inclusive for consumers)

#### Scenario 11: Monthly factura for Clínica San Andrés — 35 grouped items
**Skills tested:** yaya-tax, invoicing-mcp
**Score: 5/10**

- ✅ `invoicing-mcp` supports factura creation (document_type "01") with RUC validation via `lookup_ruc`
- ✅ Multi-line item invoices are supported in the data model (`items: LineItem[]`)
- ❌ No grouped/consolidated invoice tool — would need to aggregate 35 individual dispatches into one factura. No automation for "group all deliveries to this client this month"
- ❌ No link between sales orders and factura line items for institutional clients
- ❌ No credit terms tracking (institutional clients like clinics often have net-30 or net-60 terms)
- ⚠️ At 35 items, this is a complex invoice that needs careful verification — the conversational confirmation flow would be very long

#### Scenario 12: Credit note — overcharge correction S/45 → S/35
**Skills tested:** yaya-tax, invoicing-mcp
**Score: 8/10**

- ✅ `invoicing-mcp` has `create_credit_note` tool (document_type "07")
- ✅ `yaya-tax` has a clear flow for choosing between nota de crédito and comunicación de baja
- ✅ References the original document correctly
- ✅ Handles within the 7-day void window for comunicación de baja
- ✅ SUNAT CDR tracking for the nota de crédito

---

### ANALYTICS (Metabase)

#### Scenario 13: Sales dashboard — daily, by category, month-over-month comparison
**Skills tested:** yaya-analytics
**Score: 6/10**

- ✅ `yaya-analytics` has comprehensive report templates: daily summary, weekly report, monthly review
- ✅ Period-over-period comparisons built in ("vs semana anterior", "vs mismo mes 2025")
- ✅ WhatsApp-friendly formatting (no markdown tables, uses emojis and bullets)
- ⚠️ Pharmacy-specific categories are missing — Lucía needs: genéricos, marca, OTC, cuidado personal, controlados, insumos médicos. The analytics skill uses generic retail categories
- ❌ No Metabase dashboard integration — the docs mention it but there's no `metabase-mcp` server
- ❌ No visual charts or graphs (WhatsApp text-only reports)

#### Scenario 14: Top 20 products + margin analysis
**Skills tested:** yaya-analytics
**Score: 5/10**

- ✅ "Top products" is explicitly supported in weekly/monthly reports
- ✅ Margin analysis capability is mentioned (though example flows only show revenue, not margin)
- ❌ No cost price data visible in `erpnext-mcp` tools — `search_products` returns `standard_rate` (selling price) but no purchase price or margin
- ❌ To calculate margins, you'd need purchase price data — which requires purchase order tooling that doesn't exist in the MCP layer
- ❌ Lucía's margin tiers (generics 25-30%, branded 15-20%, personal care 35-40%) can't be validated without cost data

#### Scenario 15: Inventory rotation — dead stock >90 days
**Skills tested:** yaya-inventory, yaya-analytics
**Score: 4/10**

- ✅ `yaya-inventory` mentions "Stock History — Track stock movements and identify trends"
- ✅ Analytics skill can identify slow-moving products
- ❌ No specific "dead stock" or "inventory age" report
- ❌ No batch-level rotation analysis (FEFO: First Expired, First Out — critical for pharmacy)
- ❌ No link between slow rotation and expiry risk (in pharmacy, slow rotation + near expiry = financial loss)

#### Scenario 16: Transactions per hour — staffing analysis
**Skills tested:** yaya-analytics
**Score: 6/10**

- ✅ The example flow "¿cuál es mi mejor día de la semana?" shows hourly analysis capability
- ✅ `postgres-mcp` SQL access allows custom time-based aggregations
- ✅ The analytics skill explicitly supports ad-hoc questions
- ⚠️ Whether the underlying data has hourly transaction timestamps depends on ERPNext configuration
- ❌ No specific staffing recommendation engine — can show the data but can't model "you need another técnico from 10am to 2pm"

---

### PAYMENT RECONCILIATION (Settler)

#### Scenario 17: End-of-day cash reconciliation — S/3,200 split across 4 payment methods
**Skills tested:** yaya-payments, yaya-analytics
**Score: 4/10**

- ✅ `yaya-payments` tracks payments by method (Yape, POS, cash, vouchers)
- ✅ Analytics can generate daily summaries with payment method breakdown
- ❌ No dedicated "cash register reconciliation" tool or workflow
- ❌ No way to input physical cash count for comparison
- ❌ No "Settler" or reconciliation-specific MCP server
- ❌ EPS vouchers (S/215 in this scenario) have no tracking mechanism
- ❌ Multi-method reconciliation (cash + Yape + POS + vouchers) requires manual comparison — the platform can show digital payment totals but can't handle the cash side

**Specific check:** S/1,580 + S/960 + S/445 + S/215 = S/3,200 ✅ — the math works, but the platform can't verify this automatically because cash and vouchers aren't digitally tracked.

#### Scenario 18: POS vs. bank account discrepancy — S/700 missing
**Skills tested:** yaya-payments
**Score: 2/10**

- ❌ No bank integration (BCP, BBVA, Interbank) — can't pull actual bank deposits
- ❌ No POS terminal integration (VisaNet, Niubiz) — can't pull POS settlement data
- ❌ Can't automatically identify: processing fees, withholdings, settlement delays, chargebacks
- ❌ This is a common pharmacy pain point (POS processors take 3-5% + IGV, and settlements are T+1 or T+2) — zero platform support
- ⚠️ `payments-mcp` only handles screenshot-based payment validation, not bank/POS reconciliation

#### Scenario 19: Supplier account statement — Química Suiza outstanding invoices
**Skills tested:** None applicable
**Score: 0/10**

- ❌ No accounts payable tracking
- ❌ No supplier invoice management
- ❌ No payment term tracking (net-15, net-30)
- ❌ No supplier balance or statement generation
- ❌ This is part of the broader purchase-side gap — the platform only handles the sell side

---

### EXPIRY DATE TRACKING

#### Scenario 20: Products expiring within 90 days — liquidation list
**Skills tested:** yaya-inventory
**Score: 1/10 — ⚠️ SAFETY CRITICAL**

- ❌ **No expiry date tracking exists in any skill or MCP tool.** This is Lucía's #1 pain point with 2,000+ SKUs
- ❌ ERPNext supports batch/lot tracking with expiry dates, but `erpnext-mcp` exposes ZERO batch-level tools
- ❌ No `get_expiring_items`, `check_batch_expiry`, `list_batches`, or any expiry-related tool
- ❌ No FEFO (First Expired, First Out) enforcement or guidance
- ❌ No automated alerts for approaching expiry dates
- ❌ No supplier return-for-credit workflow for near-expiry products
- ❌ No promotional pricing automation for near-expiry items

**Safety impact:** Dispensing expired medications is dangerous and illegal. The platform has no safeguards against this. A simple `check_stock` call returns quantity but not batch expiry dates.

**Recommendation:** Extend `erpnext-mcp` with batch/lot tools: `list_batches(item_code)`, `get_expiring_items(days_ahead)`, `get_batch_details(batch_no)`. Create a `yaya-pharmacy-inventory` skill on top that enforces FEFO and generates expiry alerts.

#### Scenario 21: Insulin batch — will it sell before expiry based on velocity?
**Skills tested:** yaya-inventory, yaya-analytics
**Score: 1/10**

- ❌ Same fundamental gap — no expiry date data accessible via MCP
- ❌ Even though `yaya-inventory` calculates sales velocity, it can't compare velocity against expiry dates because it doesn't have batch-level data
- ❌ No cold-chain or special storage tracking (insulin requires refrigeration — a pharmacy-specific concern)
- ⚠️ The concept is sound: sales velocity ÷ remaining stock = days to sell out, compare vs. days to expiry. But the data pipeline doesn't exist

#### Scenario 22: Expired product investigation — batch #IBU-2024-089 recall check
**Skills tested:** yaya-inventory, yaya-returns
**Score: 1/10 — ⚠️ SAFETY CRITICAL**

- ❌ No batch/lot lookup capability in `erpnext-mcp`
- ❌ No ability to trace which batch was sold to which customer (critical for recalls)
- ❌ No recall notification system
- ❌ `yaya-returns` handles general returns well but has no awareness of expired product vs. defective product — the urgency and regulatory implications are completely different
- ❌ No DIGEMID incident reporting workflow

**Safety impact:** If an expired medication was dispensed, the platform needs to: (1) identify all units of that batch still in inventory, (2) quarantine them, (3) identify which customers received that batch, (4) notify them, (5) file a DIGEMID incident report. None of this is possible.

---

### SCHEDULING (Cal.com)

#### Scenario 23: Health service appointments — blood pressure/glucose testing, 8am-12pm, 15-min slots
**Skills tested:** yaya-appointments
**Score: 7/10**

- ✅ `yaya-appointments` has full booking, availability, cancellation, and rescheduling flows
- ✅ Supports multi-service (blood pressure + glucose could be separate services)
- ✅ 15-minute slot configuration supported via `APPOINTMENT_BUFFER`
- ✅ CalDAV sync for external calendar integration
- ✅ WhatsApp-based booking is natural for pharmacy walk-in patients
- ✅ Emergency override for urgent cases
- ⚠️ The skill is designed for dedicated service businesses (clinics, salons) — a pharmacy where appointments are secondary to retail may find the overhead high
- ❌ No integration with patient health records or prescription history
- ❌ No ability to link appointment (glucose test) to product sale (if glucose is high → recommend medication)
- ❌ `appointments-mcp` server exists but status unclear (it's in the mcp-servers directory but not documented in mcp-servers.md)

#### Scenario 24: Vitamin B12 injection series — 10 sessions, every other day
**Skills tested:** yaya-appointments
**Score: 5/10**

- ✅ The appointment system can book individual appointments
- ❌ No "series booking" or recurring appointment capability — would need to book 10 individual appointments manually
- ❌ No treatment plan or protocol tracking
- ❌ No medication administration record (MAR) — needed for injectable medications
- ❌ No auto-scheduling for "día por medio" (every other day) pattern
- ⚠️ Booking 10 appointments one by one via WhatsApp conversation would be tedious

---

### ESCALATION TRIGGERS

#### Scenario 25: DIGEMID inspection preparation — compliance readiness check
**Skills tested:** yaya-escalation
**Score: 1/10 — ⚠️ REGULATORY CRITICAL**

- ❌ No DIGEMID inspection readiness skill
- ❌ No controlled substance log completeness check
- ❌ No audit of required documentation: pharmacy license, pharmacist registration (QF director técnico), product sanitary registries
- ❌ No verification of cold-chain documentation
- ❌ No MINSA health protocol compliance check
- ❌ `yaya-escalation` handles customer frustration well, but regulatory escalations are a completely different domain
- ❌ No checklist generator for DIGEMID inspection requirements

**What DIGEMID inspectors check:**
1. Pharmacist license and presence during operating hours
2. Controlled substance logbook (libro de registro) — complete and up-to-date
3. Product storage conditions (temperature, humidity, light)
4. Expiry date management (no expired products on shelves)
5. Sanitary registries for all products
6. Prescription files for controlled substances
7. Proper labeling and dispensing practices

**The platform cannot verify ANY of these.**

#### Scenario 26: Expired medication sold — emergency incident response
**Skills tested:** yaya-escalation, yaya-returns
**Score: 2/10 — ⚠️ SAFETY CRITICAL**

- ✅ `yaya-escalation` would detect customer complaint and escalate to Lucía
- ✅ `yaya-returns` can process a refund/return for the expired product
- ❌ No incident response protocol specific to expired medication dispensing
- ❌ No DIGEMID incident notification workflow
- ❌ No batch quarantine procedure
- ❌ No affected customer identification (who else got this batch?)
- ❌ No corrective action tracking
- ❌ No legal liability guidance (INDECOPI, Defensoría del Pueblo)

**What should happen:**
1. Immediately quarantine all units of the same batch
2. Identify all customers who received that batch
3. Contact them urgently (potential health risk)
4. File DIGEMID incident report
5. Document corrective actions
6. Review and fix the root cause (expiry tracking failure)

---

### EDGE CASES

#### Scenario 27: Illegible prescription OCR
**Skills tested:** yaya-payments (OCR pattern)
**Score: 3/10**

- ✅ The Qwen3.5-27B vision model is available and `yaya-payments` demonstrates OCR capability for payment screenshots
- ❌ No prescription OCR workflow exists — the pattern could be adapted but hasn't been
- ❌ No medical terminology dictionary for OCR correction
- ❌ No prescriber database to cross-reference (CMP registry)
- ❌ **Drug name misreading is potentially lethal** — "Losartan" vs "Loxapine" (one is for blood pressure, the other is an antipsychotic). OCR errors on prescriptions need special safety guardrails

#### Scenario 28: System outage — manual sale recording + batch upload
**Skills tested:** yaya-sales, yaya-inventory
**Score: 2/10**

- ❌ No offline/manual recording mode
- ❌ No batch upload tool for retroactive transaction entry
- ❌ No "catch-up" workflow for when the system comes back online
- ❌ At 100+ transactions/day, a 2-hour outage means 8-10 lost transactions minimum — no recovery mechanism
- ⚠️ `yaya-sales` mentions "If ERPNext unreachable, say 'let me verify and confirm in a few minutes'" — but that doesn't help with the business owner recording sales manually

#### Scenario 29: Suspicious pseudoephedrine purchase — DIGEMID limits
**Skills tested:** None applicable
**Score: 0/10 — ⚠️ SAFETY & REGULATORY CRITICAL**

- ❌ No controlled/restricted substance quantity limit enforcement
- ❌ No suspicious purchase flagging system
- ❌ No DIGEMID quantity regulations database
- ❌ No customer purchase history cross-check for restricted products
- ❌ Pseudoephedrine is a precursor chemical for methamphetamine — pharmacies have strict obligations to monitor and report suspicious purchases
- ❌ No reporting mechanism to DIGEMID or PNP (Policía Nacional del Perú)

**What DIGEMID requires for pseudoephedrine:**
- Maximum quantity per customer per transaction
- Customer identification mandatory
- Transaction log for audit
- Suspicious activity reporting to authorities

#### Scenario 30: Competitive strategy against Boticas Arcángel
**Skills tested:** yaya-analytics
**Score: 4/10**

- ✅ `yaya-analytics` can show which products drive the most revenue and margin
- ✅ Customer segmentation via `yaya-crm` could identify at-risk customers
- ✅ `yaya-notifications` can run re-engagement campaigns for dormant customers
- ❌ No competitor pricing intelligence
- ❌ No market analysis tools
- ❌ No differentiation strategy recommendations beyond basic data
- ❌ No loyalty program capabilities
- ⚠️ The platform can provide the data foundation, but strategic decisions need more sophisticated analytics than currently available

---

## Skills Assessment Summary

| Skill | Relevance to Lucía | Score | Notes |
|-------|-------------------|-------|-------|
| yaya-sales | Medium | 5/10 | Works for OTC sales; no prescription workflow; no batch tracking |
| yaya-payments | High | 6/10 | Yape/POS validation good; no EPS vouchers; no bank reconciliation |
| yaya-inventory | Critical | 3/10 | Basic stock check works; NO batch/lot/expiry; NO purchase orders; NO FEFO |
| yaya-tax | High | 7/10 | Boleta/factura generation solid; RER regime correct; high-volume batching needed |
| yaya-billing | Low | N/A | This is Yaya's own billing — works fine for platform subscription |
| yaya-analytics | High | 5/10 | Good reporting framework; needs pharma-specific categories and margins |
| yaya-crm | Medium | 5/10 | Customer tracking works; no credit/debt management; no patient records |
| yaya-notifications | Medium | 6/10 | Restock alerts, reminders work; needs EPS claim notifications |
| yaya-followup | Medium | 6/10 | Payment reminders solid; no prescription refill reminders |
| yaya-returns | Medium | 5/10 | General returns OK; no expired medication incident protocol |
| yaya-escalation | Medium | 4/10 | Customer frustration good; no regulatory escalation; no DIGEMID alert |
| yaya-appointments | Medium | 7/10 | Health service scheduling works well; no treatment series booking |
| yaya-onboarding | Low | 6/10 | Standard onboarding; pharmacy-specific steps not included (DIGEMID license, controlled substance setup) |
| yaya-meta | N/A | N/A | Platform sales — not relevant to Lucía's daily ops |

## MCP Servers Assessment

| MCP Server | Status | Relevance | Gap |
|------------|--------|-----------|-----|
| erpnext-mcp | Production | Critical | Missing: purchase orders, batch/lot tracking, expiry dates, supplier management, goods receipt |
| postgres-mcp | Production | High | Works as-is for analytics queries |
| crm-mcp | In Development | Medium | Needs: credit tracking, patient preference, insurance data |
| payments-mcp | In Development | High | Needs: EPS claims, bank reconciliation, POS settlement |
| lago-mcp | In Development | Low | Platform billing only |
| invoicing-mcp | Production | High | Works well for SUNAT compliance; needs batch boleta generation |
| appointments-mcp | Exists | Medium | Not documented; needs health service customization |
| forex-mcp | Exists | Low | Not needed for domestic pharmacy |

---

## Critical Gaps — Priority Ordered

### 🔴 P0: Safety-Critical (Must fix before any pharmacy deployment)

1. **DIGEMID Controlled Substance Compliance** — No prescription verification, no controlled substance log, no quantity limits, no audit trail. Medication errors can kill people. Regulatory non-compliance can close the pharmacy.

2. **Expiry Date / Batch Tracking** — No batch-level inventory, no expiry alerts, no FEFO enforcement, no expired product quarantine. Dispensing expired medications is dangerous and illegal.

3. **Prescription OCR Safety Guardrails** — If prescription OCR is implemented, drug name misreading needs fail-safe mechanisms (confirmation loops, similarity warnings, dose reasonableness checks).

### 🟠 P1: Business-Critical (Required for viable pharmacy operation)

4. **Purchase Order / Supplier Management** — Can't reorder stock, can't compare suppliers, can't receive deliveries, can't track accounts payable. Half the business is invisible to the platform.

5. **Insurance Claims (EPS) Processing** — 5% of revenue but massive administrative overhead. Claims submission, tracking, rejection handling, aging reports.

6. **Bank / POS Reconciliation** — Can't reconcile POS settlements, can't identify processing fees, can't track bank deposits vs. expected amounts.

### 🟡 P2: Important (Significantly improves value proposition)

7. **High-Volume Transaction Support** — 100+ transactions/day needs batch boleta generation, POS-mode interface, and performance optimization.

8. **Credit/Debt Management** — Informal credit is standard in Peruvian neighborhood pharmacies. Track who owes what, send reminders, manage repayment.

9. **Pharmaceutical Knowledge Layer** — Drug equivalences, interaction checking, therapeutic substitution suggestions with safety guardrails.

10. **DIGEMID Inspection Readiness** — Checklist generator, compliance dashboard, document verification.

### 🟢 P3: Nice to Have (Differentiators)

11. **Prescription Refill Reminders** — "Señora Carmen, su receta de losartán se acaba en 5 días. ¿Le preparamos la siguiente?"

12. **Seasonal Demand Forecasting** — Flu season, dengue outbreaks, back-to-school vitamins.

13. **Loyalty Program** — Compete with chain pharmacies on service, not just price.

---

## High-Volume Transaction Processing Assessment

Lucía processes 100-130 transactions/day (average ticket S/18-25). The platform's current architecture raises concerns:

| Aspect | Assessment | Concern Level |
|--------|-----------|---------------|
| Transaction recording | Via `create_order` in erpnext-mcp — one at a time | 🟠 Medium |
| Boleta generation | Via `create_invoice` in invoicing-mcp — one at a time | 🟠 Medium |
| Payment validation | Yape screenshots via OCR — ~30/day | 🟡 Low-Medium |
| Stock decrement | Via stock reservation in erpnext-mcp — per transaction | 🟠 Medium |
| CRM logging | Via crm-mcp — per interaction | 🟡 Low |

**Bottleneck analysis:** Each transaction potentially requires 3-5 MCP tool calls (stock check → create order → generate boleta → log CRM → update stock). At peak hours (10am-1pm based on typical pharmacy traffic), Lucía might process 15-20 transactions/hour. That's a tool call every 30-60 seconds. The stdio-based MCP architecture might handle this, but there's no documented performance testing.

**Recommendation:** Implement a "POS mode" that batches common operations (sale + boleta + stock update) into a single optimized call, and generates boletas in batch at end-of-day for the resumen diario submission.

---

## Insurance Claims Deep Dive

This is Lucía's second-biggest pain point and deserves detailed analysis:

**Current process (manual):**
1. Customer presents EPS insurance card + prescription
2. Lucía verifies coverage and copay amount
3. Dispenses medication, customer pays copay
4. Lucía fills out EPS voucher form (paper or basic digital)
5. Weekly: batches vouchers and submits to each EPS
6. 45-90 days later: check if claim was paid
7. If rejected: identify rejection reason, fix documentation, resubmit
8. If paid: reconcile payment against submitted claims

**What the platform would need:**
- EPS eligibility verification (API integration with Rímac, Pacífico, La Positiva)
- Copay calculation by product and plan
- Digital voucher generation
- Batch claim submission
- Claim status tracking dashboard
- Rejection analysis and resubmission workflow
- Aging report (30/60/90 days outstanding)
- Revenue recognition for accounting

**Platform support: 0%** — None of this exists.

---

## Cal.com Health Service Appointments — Detailed Assessment

The blood pressure and glucose testing service (S/5 per test) is Lucía's differentiation from chain pharmacies:

**What works:**
- ✅ Basic appointment booking via WhatsApp
- ✅ 15-minute slot configuration
- ✅ Reminder system (24h and 2h before)
- ✅ Cancellation and rescheduling
- ✅ Walk-in management when schedule is full

**What's missing for pharmacy health services:**
- ❌ Health measurement recording (BP: 120/80, glucose: 95 mg/dL)
- ❌ Historical tracking per patient (trending BP over time)
- ❌ Alert thresholds (BP > 140/90 → recommend doctor visit)
- ❌ Integration with medication dispensing (high glucose → suggest metformin consultation with physician)
- ❌ Treatment adherence tracking
- ❌ Injection series scheduling (B12, flu shots, etc.)

---

## Final Verdict

**For Lucía Fernández and Farmacia Santa Rosa: The Yaya Platform is NOT ready for deployment.**

The platform has excellent bones — the skill architecture, MCP pattern, conversational design, and LATAM-first approach are all strong. The sales, payments, CRM, and analytics skills would work well for a general retailer.

But a pharmacy is not a shoe store. The safety-critical nature of pharmaceutical dispensing, the strict regulatory environment (DIGEMID, SUNAT, EPS), and the operational complexity (2,000+ SKUs with expiry dates, controlled substances, insurance claims, multi-supplier management) require specialized capabilities that don't exist yet.

**Deploying the platform as-is for a pharmacy would be irresponsible** — the lack of expiry tracking and controlled substance compliance creates real risk of patient harm.

**Path to readiness (estimated effort):**
- P0 gaps (safety-critical): ~3-4 months of development
- P1 gaps (business-critical): ~2-3 months additional
- P2 gaps (important): ~2-3 months additional
- Total to "pharmacy-ready": ~6-8 months

**Score: 5/10** — Strong general retail platform with zero pharmacy-specific capability. The 5 reflects that roughly half the platform's existing features ARE useful to Lucía (sales, basic payments, CRM, analytics, invoicing, appointments), but the other half of her needs (and the most critical half) are completely unaddressed.
