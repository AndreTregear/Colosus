# Elena Quispe — Integration & Second-Half Scenario Tests

**Persona:** Elena Quispe Huallpa, 45, Cusco — Sabor Cusqueño (picantería, ~S/480K annual)  
**Test Focus:** Analytics, Cal.com reservations, Metabase dashboards, InvoiceShelf, delivery platform reconciliation, escalation, edge cases  
**Date:** 2026-03-20  
**Tester:** Yaya Subagent (elena-integ)

---

## Test Matrix

### INVOICING (Scenarios 11-14) — InvoiceShelf Evaluation

#### Scenario 11: Boleta for Table 3
> "Hazme la boleta de la mesa 3: 2 menús del día, 1 lomo saltado a la carta, 3 Cusqueñas, 1 chicha morada. Propina aparte."

**Current Coverage:** `invoicing-mcp` handles `create_invoice` with document_type="03" (boleta). Supports line items with description, quantity, unit_price, IGV calculation.

**What works:**
- ✅ Boleta generation via `create_invoice(document_type="03")`
- ✅ Multiple line items (menú S/18 × 2, lomo saltado S/45 × 1, Cusqueña S/8 × 3, chicha morada S/5 × 1)
- ✅ IGV auto-calculation (18% on base, or IGV-included breakdown)
- ✅ DNI lookup via `lookup_dni` if customer provides one
- ✅ PDF generation and WhatsApp delivery
- ✅ SUNAT submission via PSE provider

**What's missing:**
- ⚠️ **No table management concept.** There's no "mesa 3" → order mapping. The agent would need to look up the order by context (customer phone? recent order?) rather than table number. ERPNext doesn't natively model restaurant tables.
- ⚠️ **Propina (tip) handling.** The invoicing system has no explicit tip field. Tips should NOT be included in the boleta (legally correct in Peru — propinas are voluntary and not subject to IGV). But the skill/MCP doesn't explicitly guide this — it's up to the agent's knowledge.
- ⚠️ **Restaurant-specific item catalog.** Elena's menu changes daily. There's no "menú del día" item that auto-updates. Each day she'd need to update the item or create a new one via `erpnext-mcp.create_item`.

**InvoiceShelf evaluation:** InvoiceShelf is a self-hosted invoicing platform. For Elena's use case, it would add:
- ✅ Recurring invoice templates (for travel agency contracts)
- ✅ Better PDF customization (bilingual invoices for tourists)
- ✅ Client portal where agencies can view outstanding invoices
- ⚠️ But it's NOT SUNAT-compliant out of the box — would still need `invoicing-mcp`'s PSE integration for legal electronic documents
- ⚠️ Creates a dual-system problem: InvoiceShelf for pretty invoices, invoicing-mcp for legal SUNAT compliance

**Score: 6/10**  
Core invoicing works. Restaurant-specific workflows (tables, tips, daily menus) are gaps. InvoiceShelf adds value for agency billing but creates complexity.

---

#### Scenario 12: Factura for Travel Agency
> "La agencia Viajes Pacífico necesita factura por el almuerzo grupal de ayer. Son S/1,250 total. Su RUC es 20398765432, razón social Viajes Pacífico SAC."

**Current Coverage:** Strong.

**What works:**
- ✅ `lookup_ruc("20398765432")` validates the RUC and returns razón social, dirección fiscal, estado contribuyente
- ✅ `create_invoice(document_type="01")` generates factura requiring RUC
- ✅ IGV breakdown: base S/1,059.32 + IGV S/190.68 = S/1,250.00
- ✅ `yaya-tax` skill provides correct guidance on factura vs boleta
- ✅ PDF delivered via WhatsApp
- ✅ SUNAT CDR confirmation

**What's missing:**
- ⚠️ **Payment terms.** Travel agencies pay on 30-day terms. The `payment_terms` field exists in `create_invoice` but there's no accounts receivable tracking. No "Viajes Pacífico owes me S/1,250 due April 20" workflow.
- ⚠️ **Recurring agency relationship.** No way to set up a standing arrangement ("Viajes Pacífico sends groups 2x/week, factura after each event").
- ⚠️ **Group meal itemization.** Agency might want the factura itemized per dish category, not just "almuerzo grupal S/1,250."

**InvoiceShelf evaluation:** This is where InvoiceShelf shines:
- ✅ Payment tracking with due dates and aging reports
- ✅ Client (agency) portal with invoice history
- ✅ Recurring invoice setup for repeat clients
- ✅ Outstanding balance tracking
- 🔴 Still needs invoicing-mcp for SUNAT legal compliance

**Score: 7/10**  
Factura generation is solid. Accounts receivable tracking for 30-day terms is the key gap InvoiceShelf would fill.

---

#### Scenario 13: Credit Note for Billing Error
> "Me equivoqué en la boleta que le di al cliente — le cobré S/85 pero era S/58. Cómo hago la nota de crédito?"

**Current Coverage:** Good.

**What works:**
- ✅ `create_credit_note` with reason_code="02" (corrección por error)
- ✅ References the original boleta document
- ✅ Generates nota de crédito for the difference (S/27)
- ✅ SUNAT submission
- ✅ `yaya-tax` skill explains the process clearly

**What's missing:**
- ⚠️ **Finding the original boleta.** Elena says "the boleta I gave the customer" — the agent needs to search by amount or time range via `list_invoices`. This works but requires the agent to make the right inference.
- ⚠️ **Cash refund tracking.** If the customer paid cash, the S/27 difference needs to be returned. No cash register integration exists.

**Score: 8/10**  
Credit notes are well-covered. The invoicing-mcp handles this correctly per SUNAT requirements.

---

#### Scenario 14: Monthly Boleta vs Factura Summary
> "Cuánto vendí con boleta y cuánto con factura este mes? Necesito eso para mi contador."

**Current Coverage:** Partial.

**What works:**
- ✅ `list_invoices` can filter by document_type ("01" facturas, "03" boletas) and date range
- ✅ `yaya-analytics` could aggregate this data
- ✅ `calculate_tax` with regime="RMT" computes IGV and renta

**What's missing:**
- ⚠️ **No pre-built "accountant summary" report.** The agent would need to make multiple API calls (list boletas, sum them; list facturas, sum them; compute IGV). This is doable but not a single tool call.
- ⚠️ **No export format.** Elena's contador probably wants an Excel or PDF summary, not a WhatsApp message. No document export capability.
- ⚠️ **Cash sales not in the system.** Elena does 60% cash — if she doesn't issue a boleta for every cash sale, the system underreports. No POS/register integration.

**InvoiceShelf + Metabase evaluation:**
- InvoiceShelf could track all invoices with better reporting UI
- Metabase would allow the contador to access dashboards directly, self-serve queries on boleta/factura data
- Combined: strong improvement for accounting visibility

**Score: 5/10**  
Data is queryable but not packaged for accountant consumption. Cash sales gap is critical for a restaurant.

---

### ANALYTICS & MANAGEMENT (Scenarios 15-18) — Metabase Evaluation

#### Scenario 15: Sales by Day of Week
> "Quiero ver cuánto vendo cada día de la semana. ¿Cuál es mi mejor día? Siento que los martes son flojos pero no estoy segura."

**Current Coverage:** Partially covered by `yaya-analytics` + `erpnext-mcp.get_sales_summary`.

**What works:**
- ✅ `yaya-analytics` skill explicitly includes this use case (ad-hoc query example)
- ✅ `get_sales_summary` provides revenue and order count by date range
- ✅ WhatsApp-friendly formatting with ranked list
- ✅ Period comparison ("últimos 3 meses")

**What's missing:**
- ⚠️ **No native aggregation by day-of-week.** The `get_sales_summary` tool returns per-order data. The agent/LLM would need to aggregate client-side or use `postgres-mcp` for the GROUP BY dow query. This works but is brittle.
- ⚠️ **Restaurant-specific metrics missing.** Elena needs: covers (comensales) per day, average ticket per comensal, table turnover rate. The system tracks orders, not covers.
- ⚠️ **No visualization.** A bar chart of sales-by-day would be far more powerful than a text list.

**Metabase evaluation:**
- ✅ **Perfect fit.** Metabase excels at this exact query — SQL GROUP BY day-of-week with bar chart visualization
- ✅ Elena's contador or she herself could bookmark this dashboard
- ✅ Auto-refresh daily
- ✅ Shareable link (no login needed for public dashboards)
- 🔴 Requires Metabase deployment and database connectivity
- 🔴 Elena doesn't speak "dashboard" — needs the agent to summarize AND link to visual

**Score: 6/10**  
The data exists. Aggregation and presentation are weak. Metabase would transform this from a 6 to a 9.

---

#### Scenario 16: Best-Selling and Most Profitable Dish
> "Cuál es mi plato más vendido este mes? Y cuál me deja más ganancia?"

**Current Coverage:** Partial.

**What works:**
- ✅ `get_sales_summary` returns top_products by revenue
- ✅ `yaya-analytics` skill has "Product Performance" capability
- ✅ Can identify most-sold by volume and revenue

**What's missing:**
- 🔴 **No food cost data.** "Most profitable" requires knowing the cost of ingredients per dish. Elena buys at Mercado San Pedro daily — these costs are NOT tracked in ERPNext. There's no recipe/BOM (bill of materials) system.
- 🔴 **No recipe management.** Ají de gallina costs X soles in ingredients per serving, sells for Y soles. This data doesn't exist in the platform.
- ⚠️ **Daily menu changes complicate product tracking.** The "menú del día" is a different composition each day. Is it one product or a new one daily?

**Metabase evaluation:**
- ✅ Could visualize sales data beautifully
- 🔴 Can't solve the underlying data gap — food costs aren't tracked
- ⚠️ Would need integration with a recipe/costing module (not currently in platform)

**Score: 3/10**  
Most-sold: yes. Most profitable: impossible without food cost tracking. This is a fundamental data gap for restaurants.

---

#### Scenario 17: Food Cost Analysis (Market Spend vs Revenue)
> "Muéstrame cuánto estoy gastando en el mercado vs. cuánto estoy vendiendo. Necesito saber mi food cost real."

**Current Coverage:** Very low.

**What works:**
- ✅ Revenue side: `get_sales_summary` provides total sales
- ✅ `yaya-analytics` has "compare data" capability

**What's missing:**
- 🔴 **No purchase/expense tracking.** Elena buys at Mercado San Pedro with cash at 5:30 AM. These purchases are NOT recorded anywhere in the system. There's no `create_purchase_order` for market purchases (and PO is wrong model anyway — she buys ad-hoc).
- 🔴 **No expense entry tool.** No way to log "bought S/200 of trucha, S/50 of rocoto, S/80 of potatoes."
- 🔴 **Food cost percentage calculation impossible.** Target is 30% food cost — but 0% of cost data is captured.

**What would fix it:**
- A simple daily expense log (photo of market receipts → OCR → expense entry)
- Integration with a kitchen management system
- At minimum: a daily "total market spend" input field

**Metabase evaluation:**
- ✅ Would create beautiful food cost dashboards IF the data existed
- ✅ Could trend food cost % over time, compare vs target (30%)
- 🔴 Garbage in, garbage out — no data to visualize

**Score: 1/10**  
This is Elena's #1 pain point ("Can't tell if she's profitable until month end") and the platform has near-zero coverage. Critical gap.

---

#### Scenario 18: Year-over-Year Comparison
> "Compara mis ventas de junio del año pasado con este junio. ¿Cómo voy con la temporada alta?"

**Current Coverage:** Partial.

**What works:**
- ✅ `get_sales_summary` accepts date ranges, so comparing June 2025 vs June 2026 is technically possible
- ✅ `yaya-analytics` skill explicitly handles period comparison with percentage changes
- ✅ Good formatting: "S/X vs S/Y — ↗️ +Z%"

**What's missing:**
- ⚠️ **Requires data from last June.** If Elena just started using Yaya, there's no historical data. The skill acknowledges this edge case ("Todavía no tenemos suficientes datos para comparar").
- ⚠️ **No seasonal context.** The comparison should note Inti Raymi (June 24) and Cusco tourism peak. No holiday/event calendar integration.
- ⚠️ **No forecast.** "At this rate, June will close at S/X" — the analytics skill shows this capability in examples but depends on sufficient data points.

**Metabase evaluation:**
- ✅ YoY comparison charts are a core Metabase strength
- ✅ Could overlay multiple years on same x-axis
- ✅ Trend lines and projections

**Score: 6/10**  
Mechanically works if data exists. Lacks tourism-season context that would make it truly useful for a Cusco restaurant.

---

### PAYMENT RECONCILIATION (Scenarios 19-21) — Multi-Platform Evaluation

#### Scenario 19: Rappi Deposit Tracking
> "Rappi me debe el depósito de la semana pasada y no me ha caído. Cuánto debería ser y cuándo me pagaron la última vez?"

**Current Coverage:** Very low.

**What works:**
- ✅ `yaya-analytics` conceptually supports payment platform tracking
- ✅ `payments-mcp.get_payment_history` tracks payments received

**What's missing:**
- 🔴 **No Rappi API integration.** The platform cannot query Rappi's payment schedule, commission rates, or deposit history. Rappi has a partner portal but no public API for restaurants.
- 🔴 **No delivery platform aggregator.** No way to pull order data from Rappi or PedidosYa into ERPNext.
- 🔴 **No commission tracking.** Elena pays 25% to Rappi and 22% to PedidosYa. The system doesn't model platform commissions or net revenue per platform.
- 🔴 **No deposit reconciliation.** Can't compare "Rappi says they deposited S/X" vs "Bank shows S/Y arrived."

**What would fix it:**
- A `delivery-platforms-mcp` that scrapes/queries Rappi and PedidosYa partner portals
- Commission modeling per platform
- Deposit schedule tracking (Rappi pays weekly on Tuesdays, PedidosYa biweekly)
- Bank feed integration for cross-reference

**Karrio evaluation (shipping/logistics):**
- ⚠️ Karrio is a multi-carrier shipping API aggregator. It's designed for parcel shipping, not food delivery platform reconciliation.
- 🔴 Does NOT solve the Rappi/PedidosYa commission tracking problem
- ⚠️ Could help if Elena added her own delivery service (track her delivery coordinator)
- Verdict: **Wrong tool for this problem.** A custom delivery-platform MCP is needed instead.

**Score: 1/10**  
Delivery platform reconciliation is a critical gap. This is Elena's second-biggest pain point ("delivery platform commissions eat into already thin margins"). No current or proposed submodule addresses it.

---

#### Scenario 20: End-of-Day Cash Reconciliation
> "Necesito cuadrar la caja de hoy: efectivo, Yape, tarjeta, Rappi y PedidosYa. Ayúdame a ver si cuadra con las ventas."

**Current Coverage:** Partial for some methods, zero for others.

**What works:**
- ✅ `payments-mcp.get_daily_collection_summary` breaks down collections by payment method
- ✅ Yape payments tracked via screenshot OCR
- ✅ Card payments (POS) could be logged as `create_payment_entry` with method="Credit Card"
- ✅ Cash payments could be logged manually

**What's missing:**
- 🔴 **No cash register integration.** Elena's 60% cash business isn't systematically tracked. Cash drawer count vs system expectation = impossible.
- 🔴 **No Rappi/PedidosYa integration.** Can't pull delivery platform sales into the reconciliation.
- 🔴 **No POS integration.** Visa/Mastercard transactions from the POS terminal aren't automatically imported.
- ⚠️ **Yape tracking is one-directional.** Only tracks Yape payments submitted as screenshots. If Elena receives a Yape payment and forgets to log it, it's invisible.
- ⚠️ **No "expected vs actual" cash reconciliation.** The system can't say "you should have S/2,400 in cash but you say you have S/2,350 — S/50 discrepancy."

**What would fix it:**
- Simple POS/cash register module (even just a daily cash count input)
- Rappi/PedidosYa order import
- Automatic Yape transaction feed (Yape doesn't have an API — this is hard)
- End-of-day reconciliation wizard

**Score: 3/10**  
Can report what's been logged, but can't reconcile across all payment channels. The 60% cash gap makes any reconciliation incomplete.

---

#### Scenario 21: Missing Yape Payment Search
> "Tres mesas pagaron Yape hoy pero solo veo 2 pagos en mi cuenta. Búscame el que falta — debería ser entre S/35 y S/50."

**Current Coverage:** Partial.

**What works:**
- ✅ `payments-mcp.search_payment_by_amount` searches by approximate amount with ±5% tolerance
- ✅ Can search for payments in the S/35-50 range
- ✅ Returns match quality (exact, very_close, approximate)

**What's missing:**
- ⚠️ **Only searches logged payments.** If the third Yape wasn't captured as a screenshot/log, it won't appear in the system. The search only covers what's already in the database.
- 🔴 **No Yape account feed.** Can't check Elena's actual Yape transaction history. This would require bank/wallet API integration that doesn't exist.
- ⚠️ **No table-to-payment mapping.** "Mesa 4 paid Yape" — but orders aren't linked to table numbers.

**Score: 4/10**  
Good search tool if data is in the system. But the fundamental problem — verifying against the actual Yape account — is unsolved.

---

### SCHEDULING & RESERVATIONS (Scenarios 22-23) — Cal.com Evaluation

#### Scenario 22: Tour Operator Group Reservation
> "El tour operator 'Peru Hop' quiere reservar almuerzo para 30 personas el 15 de julio a la 1pm. ¿Tengo espacio? Mi capacidad máxima es 45 personas."

**Current Coverage:** Partial via `appointments-mcp`, but poorly fitted for restaurants.

**What works:**
- ✅ `appointments-mcp.get_available_slots` checks availability
- ✅ `appointments-mcp.book_appointment` creates a booking
- ✅ Conflict prevention (double-booking checks)
- ✅ Reminders (24h and 2h before)
- ✅ `yaya-appointments` skill handles the conversation flow

**What's missing:**
- 🔴 **Capacity model is wrong.** Appointments-MCP models provider-based scheduling (1 provider = 1 slot at a time). A restaurant needs capacity-based scheduling: "45 seats total, 30 reserved = 15 remaining." This is a fundamentally different model.
- 🔴 **No partial capacity tracking.** If Peru Hop books 30 of 45 seats, the remaining 15 should still be bookable for walk-ins or smaller groups. The appointments model doesn't support this.
- 🔴 **No group menu pre-selection.** Tour operators need to pre-select the menu (vegetarian options, allergen accommodations). No way to attach menu choices to a reservation.
- ⚠️ **No deposit/prepayment tracking.** Large group reservations often require a deposit. No deposit workflow exists.
- ⚠️ **No peak-hour blocking.** Elena might want to reserve only a portion of capacity for reservations and keep the rest for walk-ins during peak lunch (11am-3pm).

**Cal.com evaluation:**
- ✅ **Better scheduling model.** Cal.com supports "round robin" and capacity-based event types that could model restaurant seating better
- ✅ Self-service booking page for tour operators (they book directly without WhatsApp back-and-forth)
- ✅ Calendar integrations (Google Calendar sync to see Elena's schedule)
- ✅ Confirmation emails with custom fields (menu selection, allergen info, group size)
- ✅ Payment integration (deposits via Stripe — though Stripe in Peru is limited)
- ⚠️ Cal.com is designed for time-based appointments, not capacity-based restaurant reservations
- ⚠️ Would need significant customization to model "45 seats" as a resource
- 🔴 Not Spanish-first (UI is English, customizable but extra work)
- 🔴 Doesn't integrate with kitchen prep workflow (knowing 30 people are coming at 1pm should trigger market purchasing adjustments)

**Better alternatives for restaurants:**
- A purpose-built restaurant reservation module (like OpenTable's model) would be more appropriate
- Or extend appointments-mcp with a "capacity" mode where the "provider" is "restaurant" with max_concurrent_bookings=45

**Score: 4/10**  
Appointments system exists but fundamentally mismodels restaurant reservations. Cal.com is a better foundation but still needs restaurant-specific customization. Neither handles capacity tracking, menu pre-selection, or deposit workflows.

---

#### Scenario 23: Weekly Reservation Overview for Market Planning
> "Muéstrame todas las reservaciones de esta semana. Necesito planificar las compras del mercado según cuánta gente viene."

**Current Coverage:** Partial.

**What works:**
- ✅ `appointments-mcp.list_appointments` with date range filter
- ✅ Returns customer names, dates, times, party sizes
- ✅ `yaya-appointments` skill has "Business Owner: Daily Schedule View" flow

**What's missing:**
- 🔴 **No headcount aggregation.** Elena needs "Monday: 15 reserved + ~30 walk-ins = ~45 total. Tuesday: 0 reserved = ~30 walk-ins." The system can list reservations but can't estimate total covers including walk-in patterns.
- 🔴 **No purchasing recommendation.** "30 people on Thursday means buy 10kg of trucha, 5kg of papas, etc." — requires recipe/ingredient quantities per dish per person. No recipe management exists.
- ⚠️ **No walk-in history.** To predict walk-ins, need historical data of actual daily covers. Not tracked.
- ⚠️ **No tourism calendar overlay.** June-August is Cusco high season. July 15 (Peru Hop reservation) is peak season. No contextual data.

**Cal.com + Metabase evaluation:**
- Cal.com would provide structured reservation data
- Metabase could aggregate reservations per day with visualizations
- Together: better than current, but still missing walk-in estimation and purchasing recommendations

**Score: 3/10**  
Can list reservations. Cannot fulfill the actual need: planning market purchases based on expected attendance. The demand-to-purchasing pipeline doesn't exist.

---

### ALLERGEN TRACKING (Scenarios 24-25)

#### Scenario 24: Update Allergen Matrix
> "Actualiza los alérgenos del ceviche de trucha: contiene pescado, limón, ají. NO contiene gluten, lácteos ni frutos secos."

**Current Coverage:** Zero dedicated system.

**What works:**
- ⚠️ The agent could store allergen data as item attributes in ERPNext (`update_item` with description field) or as CRM notes
- ⚠️ The LLM itself knows common allergen information for Peruvian dishes

**What's missing:**
- 🔴 **No allergen management system.** No dedicated allergen matrix. No structured allergen data per dish. No multilingual allergen labels (English for tourists).
- 🔴 **No allergen query tool.** "Is ají de gallina gluten-free?" should be an instant lookup, not an LLM guess.
- 🔴 **No regulatory framework.** Peru's Ley 28405 requires allergen labeling. No compliance support.

**Score: 2/10**  
Agent's LLM knowledge can partially answer allergen questions, but there's no structured, reliable allergen database. For a restaurant serving international tourists with potential life-threatening allergies, this is a safety-critical gap.

---

#### Scenario 25: Allergen Emergency
> "¡EMERGENCIA! Un turista dice que es alérgico al maní y ya pidió el ají de gallina. ¿Tiene maní ese plato?"

**Current Coverage:** Escalation works, allergen data doesn't.

**What works:**
- ✅ `yaya-escalation` detects urgency keywords ("EMERGENCIA")
- ✅ Would escalate immediately to Elena/staff
- ⚠️ LLM knows that traditional ají de gallina CAN contain peanuts (some recipes use them) — but this is probabilistic knowledge, not Elena's specific recipe

**What's missing:**
- 🔴 **No recipe-specific allergen data.** "La receta de mi mamá sí lleva [maní] pero no recuerdo si lo puse hoy" — the system can't answer this. It needs Elena's actual recipe database.
- 🔴 **No kitchen alert system.** In a real emergency, the system should alert the kitchen to STOP serving the dish until allergens are confirmed.
- 🔴 **No allergen incident log.** If a reaction occurs, there's no incident reporting or documentation system.

**Score: 3/10**  
Escalation catches the emergency. But the allergen data needed to actually answer the question doesn't exist. In a life-threatening situation, "let me check with the kitchen" is the only safe answer — which the escalation system facilitates.

---

### ESCALATION TRIGGERS (Scenarios 26-27)

#### Scenario 26: DIGESA Health Inspection Preparation
> "DIGESA viene la próxima semana para inspección sanitaria. ¿Tengo todos los papeles al día? Estoy NERVIOSA 😱"

**Current Coverage:** Escalation + general knowledge only.

**What works:**
- ✅ `yaya-escalation` would detect the stress signals (emoji, capitalized "NERVIOSA")
- ✅ The LLM can provide a general DIGESA inspection checklist (carnet sanitario, licencia de funcionamiento, BPM, fumigation records, etc.)
- ✅ Could escalate to a professional consultant if configured

**What's missing:**
- 🔴 **No document management.** Can't check if Elena's fumigation certificate is current, if employee carnets sanitarios are valid, if her licencia de funcionamiento is renewed.
- 🔴 **No compliance calendar.** No reminders for document renewals (fumigation every 6 months, carnet sanitario annual renewal).
- 🔴 **No inspection preparation workflow.** A proper system would generate a pre-inspection checklist based on Elena's specific documents and their expiry dates.
- ⚠️ The safety disclaimer applies: "Consulta con tu asesor" — appropriate but not directly helpful when inspection is next week.

**Score: 4/10**  
Can provide general guidance and emotional reassurance. Cannot verify actual document status or generate a specific preparation plan. A compliance module would be highly valuable for restaurant businesses.

---

#### Scenario 27: Negative TripAdvisor Review Response
> "Un turista dejó una reseña horrible en TripAdvisor diciendo que se enfermó. NO FUE MI COMIDA. ¿Qué hago?"

**Current Coverage:** Escalation + general guidance.

**What works:**
- ✅ `yaya-escalation` detects complaint/reputation threat signals
- ✅ LLM can advise on reputation management strategy (respond professionally, don't accuse, offer resolution privately)
- ✅ Could draft a professional response for Elena in English (addressing the tourist's language)

**What's missing:**
- 🔴 **No TripAdvisor API integration.** Can't monitor reviews, can't post responses, can't track rating trends.
- 🔴 **No review management system.** Rappi and PedidosYa also have review systems. No aggregated reputation monitoring.
- ⚠️ **No legal guidance.** If the tourist claims food poisoning, Elena may need legal documentation (supplier receipts, temperature logs). No document preparation support.

**Score: 5/10**  
The agent provides good advisory support and can draft responses. Lacks integration with review platforms and any structured reputation management.

---

### EDGE CASES (Scenarios 28-30)

#### Scenario 28: Mixed Spanish/Quechua + Supply Chain Disruption
> [Voice note in mixed Spanish/Quechua] "Yayita, ñuqaq proveedorníy — el señor de las truchas de Urubamba — dice que mañana no hay trucha. Tengo que cambiar todo el menú de mañana."

**Current Coverage:** Partial.

**What works:**
- ✅ `yaya-sales` handles voice notes via Whisper transcription (language: es — but Quechua words would mostly be phonetically captured)
- ✅ The LLM can understand the mixed Spanish/Quechua context ("ñuqaq proveedorníy" = "my supplier")
- ✅ Could help brainstorm alternative menu items
- ⚠️ `yaya-inventory` could theoretically show what's in the "almacén" if items were tracked

**What's missing:**
- 🔴 **No ingredient/pantry inventory.** "What do I have in the almacén?" requires real-time stock of raw ingredients (rice, potatoes, spices). ERPNext tracks finished goods, not kitchen pantry items.
- 🔴 **No recipe database.** Can't suggest "you have X, Y, Z ingredients → you could make A, B, C dishes" without a recipe engine.
- 🔴 **No supplier management.** The "señor de las truchas de Urubamba" isn't a tracked supplier. No supplier contact database for quick alternatives.
- ⚠️ **Quechua understanding is limited.** Whisper transcription of Quechua words will be approximate. The LLM can infer meaning from context but won't have formal Quechua language support.

**Score: 4/10**  
Voice note processing and bilingual understanding work surprisingly well for an edge case. But the underlying data (pantry inventory, recipes, alternative suppliers) doesn't exist.

---

#### Scenario 29: Power Outage Emergency
> "Se fue la luz en todo el centro histórico y tengo 20 pollos en el horno. ¿Cuánto tiempo aguantan sin dañarse? Y mis pedidos de Rappi qué hago, los cancelo?"

**Current Coverage:** General knowledge + partial operational support.

**What works:**
- ✅ LLM knows food safety guidelines (poultry can stay safe in a closed oven for 1-2 hours if temperature stays above 60°C/140°F, otherwise discard after 2 hours in the "danger zone" 4-60°C)
- ✅ Could advise on Rappi order management (cancel or pause)
- ✅ Escalation to owner if needed

**What's missing:**
- 🔴 **No Rappi order cancellation capability.** Can't actually cancel or pause incoming Rappi/PedidosYa orders. No API integration.
- 🔴 **No IoT/sensor integration.** A smart kitchen could monitor oven temperature during outage. Not in scope.
- ⚠️ **No emergency protocol system.** A restaurant emergency playbook (power outage, gas leak, earthquake — Cusco is seismically active) would be valuable.

**Score: 5/10**  
Good general advisory. Can't take action on delivery platforms. The food safety knowledge from the LLM is genuinely useful here.

---

#### Scenario 30: Split Payment (Cash + Yape)
> "Un grupo quiere pagar mitad efectivo mitad Yape. ¿Cómo registro eso?"

**Current Coverage:** Supported in concept.

**What works:**
- ✅ `payments-mcp.confirm_payment` supports partial payments
- ✅ Could record two payment entries: one cash, one Yape
- ✅ `erpnext-mcp.create_payment_entry` supports multiple payment methods
- ✅ `yaya-payments` handles partial payment flow

**What's missing:**
- ⚠️ **No split-payment shortcut.** The agent would need to process two separate payment confirmations. No single "split payment" tool exists.
- ⚠️ **Order-to-payment linking.** If there's no formal order in ERPNext (just a table of walk-ins), the payments have nothing to link to.
- ⚠️ **Cash portion is honor-system.** The Yape screenshot gets verified, but cash is just "the customer says they gave you S/X."

**Score: 6/10**  
Mechanically possible through two payment entries. The UX could be smoother with a dedicated split-payment flow.

---

## New Submodule Evaluation Summary

### Cal.com — Reservation Integration

| Aspect | Rating | Notes |
|--------|--------|-------|
| **Fit for restaurants** | 4/10 | Designed for appointments, not capacity-based reservations |
| **Self-service booking** | 8/10 | Tour operators could book directly without WhatsApp |
| **Calendar integration** | 7/10 | Google/Outlook sync is valuable |
| **Customization needed** | High | Need capacity model, group menus, deposits |
| **Language/locale** | 5/10 | Not Spanish-first, would need localization |
| **Overall for Elena** | **5/10** | Better than nothing but mismodeled for restaurant use |

**Recommendation:** Don't use Cal.com as-is. Either extend `appointments-mcp` with a capacity mode, or evaluate purpose-built restaurant reservation tools (Resy, OpenTable API) — or build a simple restaurant-specific booking module.

### Metabase — Analytics Dashboards

| Aspect | Rating | Notes |
|--------|--------|-------|
| **Fit for restaurants** | 8/10 | Excellent for visualizing sales trends, peak hours, seasonal patterns |
| **Self-service** | 7/10 | Elena probably won't write SQL, but bookmarked dashboards are powerful |
| **Data dependency** | Critical | Only as good as the data going in — cash sales and food costs are major gaps |
| **Integration effort** | 6/10 | Needs DB connection to ERPNext/Postgres, dashboard design |
| **Shared access** | 8/10 | Contador, manager, Elena all get relevant views |
| **Overall for Elena** | **7/10** | High value IF core data gaps (food costs, cash tracking) are also addressed |

**Recommendation:** Deploy Metabase and pre-build restaurant-specific dashboards (daily covers, revenue by day-of-week, food cost %, platform comparison). But simultaneously address data collection gaps — without food cost input, the most valuable analytics are impossible.

### InvoiceShelf — Invoicing

| Aspect | Rating | Notes |
|--------|--------|-------|
| **SUNAT compliance** | 2/10 | Not SUNAT-compliant; still needs invoicing-mcp for legal electronic documents |
| **Accounts receivable** | 9/10 | Excellent for tracking agency payments on 30-day terms |
| **Client portal** | 8/10 | Travel agencies can view/download invoices |
| **PDF customization** | 8/10 | Bilingual invoices, custom branding |
| **Dual-system risk** | High | Two invoicing systems creates confusion and maintenance burden |
| **Overall for Elena** | **5/10** | Adds AR tracking but creates complexity vs building it into invoicing-mcp |

**Recommendation:** Don't deploy InvoiceShelf as a separate system. Instead, extend `invoicing-mcp` with accounts receivable tracking (due dates, payment status, aging reports) and client portal features. The SUNAT integration already exists — adding AR on top is simpler than maintaining two systems.

### Karrio — Shipping/Logistics

| Aspect | Rating | Notes |
|--------|--------|-------|
| **Fit for Elena** | 2/10 | Elena doesn't ship parcels. Her "delivery" is Rappi/PedidosYa (food delivery) |
| **Rappi/PedidosYa integration** | 0/10 | Karrio tracks parcel carriers, not food delivery platforms |
| **Own delivery tracking** | 4/10 | Could track Elena's delivery coordinator if she had her own delivery service |
| **Overall for Elena** | **2/10** | Wrong tool for a restaurant's delivery needs |

**Recommendation:** Skip Karrio for restaurant personas. Build a `delivery-platforms-mcp` that integrates with Rappi and PedidosYa partner portals (order import, commission tracking, deposit reconciliation). This is a much higher-value integration for restaurants.

---

## Critical Gaps — Restaurant-Specific

These are the gaps that make or break the platform for a restaurant like Elena's:

| Gap | Impact | Difficulty | Priority |
|-----|--------|------------|----------|
| **Food cost tracking** (ingredient purchases, daily market spend) | 🔴 Critical | Medium | 🔴 P0 |
| **Delivery platform reconciliation** (Rappi/PedidosYa commissions, deposits) | 🔴 Critical | High | 🔴 P0 |
| **Cash register / POS integration** (60% cash business) | 🔴 Critical | Medium | 🔴 P0 |
| **Restaurant capacity-based reservations** (not appointment slots) | 🟡 High | Medium | 🟡 P1 |
| **Allergen management system** (structured, multilingual) | 🟡 High (safety) | Low | 🟡 P1 |
| **Recipe/menu management** (daily menu, ingredients, costs per dish) | 🟡 High | Medium | 🟡 P1 |
| **Multi-language tourist support** (allergen cards, menu explanations in EN) | 🟠 Medium | Low | 🟠 P2 |
| **Supplier management** (market vendors, alternative sourcing) | 🟠 Medium | Low | 🟠 P2 |
| **Compliance calendar** (DIGESA, licencias, carnets sanitarios) | 🟠 Medium | Low | 🟠 P2 |
| **Review/reputation monitoring** (TripAdvisor, Rappi, PedidosYa) | 🟠 Medium | High | 🟠 P2 |

---

## Overall Scores Summary

| Scenario | Category | Score | Key Issue |
|----------|----------|:-----:|-----------|
| #11 | Boleta generation | 6/10 | Works but no table/tip model |
| #12 | Factura for agency | 7/10 | Good; needs AR tracking |
| #13 | Credit note | 8/10 | Well-covered |
| #14 | Monthly boleta/factura summary | 5/10 | Queryable but not accountant-ready |
| #15 | Sales by day of week | 6/10 | Data exists, aggregation weak |
| #16 | Best-selling/profitable dish | 3/10 | No food cost data |
| #17 | Food cost analysis | 1/10 | Critical data gap |
| #18 | YoY comparison | 6/10 | Works if data exists |
| #19 | Rappi deposit tracking | 1/10 | No delivery platform integration |
| #20 | End-of-day reconciliation | 3/10 | Partial — cash and platforms missing |
| #21 | Missing Yape payment | 4/10 | Search works but no Yape feed |
| #22 | Group reservation | 4/10 | Wrong scheduling model |
| #23 | Weekly reservation overview | 3/10 | Lists reservations, can't plan purchasing |
| #24 | Allergen matrix update | 2/10 | No allergen system |
| #25 | Allergen emergency | 3/10 | Escalation works, data doesn't |
| #26 | DIGESA inspection prep | 4/10 | General guidance only |
| #27 | TripAdvisor review | 5/10 | Good advice, no integration |
| #28 | Supply chain disruption (Quechua) | 4/10 | Good language handling, no pantry data |
| #29 | Power outage emergency | 5/10 | Good advisory, can't act on platforms |
| #30 | Split payment | 6/10 | Works via two entries |

**Average Score: 4.2/10**

---

## Bottom Line

The Yaya Platform for Elena's restaurant has **strong invoicing and basic analytics** but **critical gaps in the three areas that define restaurant operations:**

1. **Food cost tracking** (the #1 restaurant KPI — impossible without purchase data)
2. **Delivery platform reconciliation** (25% of revenue goes through Rappi/PedidosYa with zero visibility)
3. **Capacity-based reservations** (appointment model doesn't fit restaurants)

The proposed new submodules have mixed relevance:
- **Metabase: High value** — but needs data to visualize (food cost data doesn't exist)
- **InvoiceShelf: Moderate value** — better to extend invoicing-mcp instead
- **Cal.com: Low value** — wrong model for restaurants
- **Karrio: Near-zero value** — irrelevant for food delivery businesses

**To make Yaya work for restaurants, the platform needs:**
1. A daily expense/purchase logger (even just photo OCR of market receipts)
2. A delivery platform integration (Rappi/PedidosYa order import + commission tracking)
3. A capacity-based reservation module (not appointment-based)
4. A structured allergen database with multilingual output
