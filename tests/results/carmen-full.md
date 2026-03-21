# Test Results: Carmen Rojas — Full Platform Test (All 32 Scenarios)

**Persona:** Carmen Rojas Mendoza, 29, estilista y dueña — Beauty Studio Carmen, Los Olivos, Lima  
**Business:** Salón de belleza y mini-spa, ~S/360,000/año (~$96K USD), 6 empleados (4 estilistas + 2 esteticistas)  
**Services:** Corte S/25-45, coloración S/80-200, manicure S/25-60, facial S/60-120, pestañas S/80-150, keratina S/150-250, maquillaje S/80-150, retail beauty products (~20% revenue)  
**Date:** 2026-03-20  
**Tester:** Subagent (carmen-full)  
**Scenarios Tested:** 1–32 (All categories: Core Business, Pricing/Payments, Invoicing, Scheduling, Analytics, Reconciliation, Loyalty/Gift Cards, Escalation, Edge Cases)

---

## Rating Scale

| Metric | Description |
|--------|-------------|
| **Handleable** | Can the platform handle this scenario with existing skills/tools? (0=impossible, 10=fully covered) |
| **Accuracy** | Would the response contain correct information? (0=wrong, 10=perfect) |
| **Speed** | How fast can the system respond? (0=minutes, 10=instant) |
| **Completeness** | Does the response address everything the user needs? (0=misses everything, 10=covers all) |
| **Delight** | Would the customer/owner be pleased with the experience? (0=frustrated, 10=delighted) |
| **Safety** | Does it avoid harm, data leaks, overbooking, financial errors? (0=dangerous, 10=safe) |

---

## CORE BUSINESS OPERATIONS

---

### Scenario 1: Check tomorrow's schedule — overlapping colorations

**Roleplay Message (Carmen → WhatsApp):**
> "Amiga necesito ver las citas de mañana. Creo que tengo 3 coloraciones seguidas y no me va a alcanzar el tiempo 😩"

**Skills Involved:**
- `yaya-appointments` (primary) — list_appointments for tomorrow, schedule view
- `yaya-analytics` (minor) — time utilization insight

**MCP Tools Required:**
- `appointments-mcp` → `list_appointments` (provider=Carmen, date=tomorrow)
- `appointments-mcp` → `list_services` (get durations for coloración = 2h)

**Ratings:**

| Metric | Score | Notes |
|--------|-------|-------|
| Handleable | 8 | yaya-appointments has "Business Owner: Daily Schedule View" that lists all appointments per provider. Can flag time conflicts. |
| Accuracy | 7 | Depends on appointments being in the system. If appointments are tracked in appointments-mcp DB (not WhatsApp/notebook), accurate. |
| Speed | 8 | Single MCP call to list_appointments, filtered by date and provider. Fast response. |
| Completeness | 7 | Can show schedule. However, no built-in "conflict detection" logic in the skill — agent would need to calculate that 3 × 2h colorations + buffer = 6.5h and check if that fits in the 9am-7pm window. The LLM can reason this out. |
| Delight | 8 | Conversational, emoji-friendly response. Carmen speaks with emojis and drama — skill tone matches well. |
| Safety | 8 | No overbooking risk (read-only query). |

**Gaps Identified:**
- **No automatic conflict detection tool.** The appointments-mcp `list_appointments` returns raw data; the agent must reason about overlaps. Works via LLM reasoning but no dedicated `check_conflicts` tool.
- **Migration gap:** Carmen currently uses WhatsApp + paper notebook. No automated import of existing appointments. She'd need to manually re-enter or have onboarding assistance to populate the system.

**Ideal Response:**
> 📋 Agenda de mañana — Viernes 21 de marzo
>
> ✂️ Carmen:
> • 9:00 — Sra. Pérez (Coloración completa) 🎨 — 2h
> • 11:00 — Ana Torres (Coloración + mechas) 🎨 — 2.5h
> • 2:00 — María López (Coloración raíces) 🎨 — 1.5h
> • 4:00 — Walk-in disponible
>
> ⚠️ Las 3 coloraciones suman ~6 horas. Con el break del almuerzo (1-2pm) y buffers, vas a estar justa pero sí te alcanza 💪
>
> ¿Quieres que mueva alguna cita o las dejamos así?

---

### Scenario 2: Walk-in balayage request — find a gap today

**Roleplay Message (Carmen, salon noise):**
> "Oye acaba de llegar una clienta sin cita y quiere balayage. ¿Tengo algún hueco hoy? Sino la meto mañana temprano."

**Skills Involved:**
- `yaya-appointments` (primary) — get_available_slots for today
- `yaya-inventory` (minor) — check if balayage supplies are in stock

**MCP Tools Required:**
- `appointments-mcp` → `get_available_slots` (date=today, service="balayage"/coloración, all providers)
- `appointments-mcp` → `list_appointments` (today, all providers — to find gaps)

**Ratings:**

| Metric | Score | Notes |
|--------|-------|-------|
| Handleable | 8 | yaya-appointments covers walk-in awareness and slot-finding. Multi-provider check built in. |
| Accuracy | 7 | Balayage isn't a default service in the schema — needs to be configured as a service (duration ~3h, price S/150-200). If services are set up correctly, accurate. |
| Speed | 7 | Need to check all providers' availability for today. 2-3 MCP calls. |
| Completeness | 8 | Shows today's options, tomorrow fallback, provider options. Voice note handling covered by yaya-sales Whisper integration. |
| Delight | 8 | Rapid response during salon chaos. Carmen needs quick answers — this delivers. |
| Safety | 8 | Won't double-book. Checks all providers before saying "no space." |

**Gaps Identified:**
- **Voice note processing:** Carmen sends voice notes. yaya-sales mentions Whisper transcription, but no explicit integration between voice note → appointments flow. The agent would need to transcribe first, then route to appointments skill.
- **"Balayage" as service:** The platform uses a generic service model. Carmen would need "balayage" as a distinct service with its own duration (3h) and price. Good coverage if onboarding captures this.

---

### Scenario 3: Client color formula recall

**Roleplay Message (Carmen → WhatsApp):**
> "La señora Rodríguez viene cada 6 semanas a hacerse las raíces. ¿Qué fórmula de color usé la última vez? Era un castaño pero no recuerdo si era 6.1 o 7.1 de Igora."

**Skills Involved:**
- `yaya-crm` (primary) — customer preferences, notes, service history
- `yaya-appointments` (minor) — past appointment lookup

**MCP Tools Required:**
- `crm-mcp` → `get_contact` (search "Rodríguez", get full history)
- `crm-mcp` → `search_contacts` (by name)
- `postgres-mcp` → query past appointments for Sra. Rodríguez + notes

**Ratings:**

| Metric | Score | Notes |
|--------|-------|-------|
| Handleable | 5 | **Partially covered.** yaya-crm tracks preferences and notes, but there's no dedicated "color formula" or "treatment formula" field in the data model. It relies on free-text notes being captured during or after each appointment. |
| Accuracy | 4 | Only accurate if someone (agent or Carmen) logged "Igora 6.1, 20vol, 30min" in the CRM notes during the previous appointment. No structured "formula" field exists. |
| Speed | 6 | CRM lookup is fast, but searching through unstructured notes for formula details is unreliable. |
| Completeness | 4 | CRM can show last interaction date, service performed, and any notes. But "color formula" is a salon-specific data point that the generic CRM model doesn't capture structurally. |
| Delight | 3 | If the formula wasn't logged, Carmen gets nothing useful. This is a pain point she explicitly mentioned — and the platform doesn't solve it well without customization. |
| Safety | 8 | No risk — read-only query. Worst case is no data, not wrong data. |

**Gaps Identified:**
- **🔴 CRITICAL: No structured "service notes/formula" model.** Beauty salons need per-appointment technical notes (color formula, developer volume, processing time, hair condition). The appointments table has a `notes` TEXT field, but there's no structured way to capture, search, or surface salon-specific technical data.
- **No "client card" concept.** Salons traditionally use client cards with running history of treatments. The CRM contact model doesn't support this natively.
- **Recommendation:** Add a `treatment_notes` or `service_log` table linked to appointments with structured fields for the beauty vertical (formula, brand, quantity, processing_time, developer, before_photo, after_photo).

---

### Scenario 4: Retail product inventory check

**Roleplay Message (Carmen → WhatsApp):**
> "Necesito saber cuántos productos de retail me quedan. Siento que se me están acabando los shampoos Schwarzkopf y no pedí."

**Skills Involved:**
- `yaya-inventory` (primary) — stock check, low stock alerts
- `yaya-analytics` (minor) — retail sales velocity

**MCP Tools Required:**
- `erpnext-mcp` → `search_products` (query "shampoo Schwarzkopf")
- `erpnext-mcp` → `check_stock` (for each matching product)

**Ratings:**

| Metric | Score | Notes |
|--------|-------|-------|
| Handleable | 7 | yaya-inventory fully covers stock checks, low stock alerts, and reorder suggestions. ERPNext handles product catalog well. |
| Accuracy | 7 | Accurate if retail products are tracked in ERPNext. Beauty salons often have 50-200 retail SKUs — all need to be in the system. |
| Speed | 7 | Product search + stock check = 2 MCP calls. Fast. |
| Completeness | 7 | Shows stock levels, reorder suggestions based on velocity. Missing: beauty-product-specific data (supplier lead times for specialty products like Schwarzkopf which may require import). |
| Delight | 7 | Gets the answer fast. Would be better with proactive alerts ("te avisé hace 3 días que estaban bajos"). |
| Safety | 8 | Read-only. No risk. |

**Gaps Identified:**
- **Dual inventory tracking needed.** Carmen uses products BOTH for services (professional use) and for retail (client purchase). ERPNext would need two "warehouses" or stock locations: "salon use" and "retail shelf". The inventory skill doesn't distinguish between consumption vs. retail stock.
- **No automatic depletion for service usage.** When Carmen does a coloración, she uses ~S/45 of product. This doesn't auto-deduct from inventory unless manually tracked.

---

### Scenario 5: Instagram DM appointment for wedding trial + event

**Roleplay Message (Carmen, forwarding screenshot):**
> [Photo of Instagram DM] "Esta chica quiere pestañas efecto gato para su matri. Agéndala para prueba el miércoles y el día del evento es sábado 15."

**Skills Involved:**
- `yaya-appointments` (primary) — book 2 appointments (trial + event day)
- `yaya-crm` (secondary) — create new contact from Instagram lead
- `yaya-sales` (minor) — handle multi-service wedding package

**MCP Tools Required:**
- `appointments-mcp` → `get_available_slots` (Wednesday, eyelash service)
- `appointments-mcp` → `book_appointment` (trial on Wednesday)
- `appointments-mcp` → `book_appointment` (event on Saturday 15)
- `crm-mcp` → `create_contact` (new client from Instagram)

**Ratings:**

| Metric | Score | Notes |
|--------|-------|-------|
| Handleable | 6 | Can book two appointments. But the "Instagram DM screenshot" parsing is not covered — no OCR/image understanding for Instagram screenshots in the appointments skill. |
| Accuracy | 6 | Agent would need to extract client name and contact info from the screenshot. yaya-payments has receipt OCR via Qwen3.5-27B vision, but no equivalent for Instagram DM screenshots. |
| Speed | 5 | Multi-step: parse screenshot → extract info → check availability × 2 dates → book × 2. Several MCP calls. |
| Completeness | 6 | Books the appointments but misses: wedding package pricing, deposit requirement for event-day booking, linking trial to event as a "package." |
| Delight | 5 | Carmen would need to manually provide the client details that would normally come from the DM screenshot. Extra friction. |
| Safety | 7 | No overbooking risk. But booking a wedding event without deposit is risky (high no-show cost). |

**Gaps Identified:**
- **🔴 No Instagram DM/screenshot parsing.** Vision capabilities exist for payment receipts but not for social media DMs. Would need to extend Qwen3.5-27B vision to parse Instagram messages.
- **No "event/package" booking concept.** Wedding bookings are multi-appointment packages (trial + event day). The appointments model treats each as independent. No linkage or package pricing.
- **No "event day" premium pricing.** Saturday event-day makeup/styling typically costs more. No dynamic pricing in the service model.

---

## PRICING & PAYMENTS

---

### Scenario 6: Tuesday 2x1 manicure promo analysis

**Roleplay Message (Carmen → WhatsApp):**
> "Quiero hacer una promo para llenar los martes que siempre están flojos: 2x1 en manicure. ¿Me conviene o pierdo plata?"

**Skills Involved:**
- `yaya-analytics` (primary) — Tuesday revenue analysis, manicure margins
- `yaya-sales` (minor) — promotion configuration

**MCP Tools Required:**
- `postgres-mcp` → query revenue by day of week (last 3 months)
- `erpnext-mcp` → get manicure service cost/price
- `postgres-mcp` → query Tuesday appointment utilization rate

**Ratings:**

| Metric | Score | Notes |
|--------|-------|-------|
| Handleable | 6 | yaya-analytics can pull revenue by day and service. But "promo analysis" (calculate if 2x1 is profitable considering chair-time, product cost, potential uplift) requires business reasoning the LLM does well, but data may be incomplete. |
| Accuracy | 5 | Needs: manicure product cost per service, Tuesday revenue baseline, estimated fill rate uplift. Product cost data may not be in ERPNext if only retail products are tracked (not service consumables). |
| Speed | 6 | Complex query: day-of-week analysis + service margins + utilization. Multiple postgres queries. |
| Completeness | 6 | Can show Tuesday is slow and estimate revenue impact. Cannot model: client acquisition value (2x1 brings new clients who return for full-price services), social media buzz from promo, competitor pricing. |
| Delight | 7 | Carmen wants a quick "sí o no" with numbers. Analytics skill provides data-driven answers which she'd love. |
| Safety | 7 | Advisory only. No financial risk from the analysis itself. |

**Gaps Identified:**
- **No promotion/discount engine.** There's no system for creating, tracking, or automatically applying promotions. The skills mention discounts in follow-up messages but there's no `promotions` table or MCP tool.
- **No service cost tracking.** Carmen knows manicure product cost (~S/5-8 per service) but the system only tracks retail product costs, not per-service consumable costs.

---

### Scenario 7: Partial Yape payment — track balance

**Roleplay Message (Carmen → WhatsApp):**
> [Yape screenshot] "La clienta del balayage pagó S/180 por Yape pero le cobré S/200. Dice que el resto lo paga la próxima vez. Anota eso."

**Skills Involved:**
- `yaya-payments` (primary) — receipt OCR, partial payment handling
- `yaya-crm` (secondary) — log balance on client account

**MCP Tools Required:**
- Qwen3.5-27B vision → OCR Yape screenshot
- `erpnext-mcp` → match to order/service, record partial payment
- `crm-mcp` → log outstanding balance on client record

**Ratings:**

| Metric | Score | Notes |
|--------|-------|-------|
| Handleable | 7 | yaya-payments explicitly handles partial payments. OCR extracts amount, matches to order, records partial. |
| Accuracy | 7 | Yape OCR is well-supported. The S/20 balance tracking depends on CRM notes or a separate balance field. |
| Speed | 6 | OCR + order matching + partial payment recording + CRM update = 3-4 MCP calls. |
| Completeness | 6 | Records the partial payment. But "the rest next time" is informal credit — no structured "client balance" system. Would be logged as a CRM note, not a queryable balance. |
| Delight | 7 | Quick confirmation of what was received and what's owed. Carmen likes fast answers. |
| Safety | 7 | Partial payment is risky (informal credit). System records it but there's no automated follow-up for the S/20 balance unless Carmen remembers to check. |

**Gaps Identified:**
- **No client balance/credit system.** "Owes S/20" needs a structured `client_balance` field, not just a CRM note. Should integrate with yaya-followup for automated reminder.
- **Service-based vs. order-based payments.** yaya-payments is designed around "orders" from ERPNext. Beauty salon payments are often per-visit, not per-order. Need a "service ticket" concept.

---

### Scenario 8: Keratin pricing strategy

**Roleplay Message (Carmen → WhatsApp):**
> "Cuánto debería cobrar por una keratina brasileña si el producto me cuesta S/45 y me toma 3 horas? Quiero ganar bien pero no espantar clientas."

**Skills Involved:**
- `yaya-analytics` (primary) — pricing analysis, margin calculation
- `yaya-sales` (minor) — market context

**MCP Tools Required:**
- `postgres-mcp` → query current keratin pricing and volume
- `erpnext-mcp` → get product cost data

**Ratings:**

| Metric | Score | Notes |
|--------|-------|-------|
| Handleable | 5 | The analytics skill doesn't have a "pricing advisor" capability. The LLM can reason about costs (S/45 product + 3h labor + overhead = X), but there's no market data or competitor pricing tool. |
| Accuracy | 5 | LLM can calculate: product S/45 + 3h × hourly rate + overhead. But Carmen's hourly rate and overhead aren't in the system. Would need assumptions. |
| Speed | 7 | Mostly LLM reasoning, minimal MCP calls needed. |
| Completeness | 5 | Can give a cost-plus calculation but lacks: competitor analysis, price elasticity data, Carmen's current capacity utilization, opportunity cost of 3h blocked. |
| Delight | 6 | Gets a reasoned answer but not data-driven from her own business. Generic advice. |
| Safety | 7 | Advisory only. But bad pricing advice could hurt revenue. |

**Gaps Identified:**
- **No pricing advisor tool.** Would benefit from: (1) cost-based pricing calculation, (2) competitor benchmark data, (3) historical price-volume analysis. None exist.
- **No "chair-hour revenue" metric.** This is the key salon KPI. Revenue per chair-hour determines if a 3h service at S/150 is better than 3 × S/45 cuts.

---

### Scenario 9: Gift card generation and tracking

**Roleplay Message (Carmen → WhatsApp):**
> "Una clienta quiere comprar un gift card de S/300 para regalar a su mamá por su cumpleaños. ¿Cómo se lo genero y cómo le doy seguimiento?"

**Skills Involved:**
- `yaya-sales` (would handle the sale)
- `yaya-payments` (process payment)
- `yaya-crm` (track gift card)

**MCP Tools Required:**
- No specific gift card MCP tool exists

**Ratings:**

| Metric | Score | Notes |
|--------|-------|-------|
| Handleable | 2 | **🔴 NOT COVERED.** There is no gift card system in the platform. No generation, no tracking, no redemption, no balance management. |
| Accuracy | 1 | Cannot generate a gift card. Would have to fake it with a CRM note. |
| Speed | N/A | — |
| Completeness | 1 | Carmen's pain point #6 is gift card tracking. The platform doesn't address it at all. |
| Delight | 1 | Carmen explicitly complains about paper gift card tracking. The platform offers zero improvement. |
| Safety | 3 | Without a system, gift cards remain on paper — prone to fraud, double-use, and lost records. |

**Gaps Identified:**
- **🔴 CRITICAL: No gift card/voucher system.** This is one of Carmen's top pain points. Needs: gift card generation (unique code), balance tracking, redemption flow, expiry dates, purchase recording, and integration with payment and invoicing. Should be its own skill (`yaya-giftcards`) or integrated into yaya-sales.
- **Recommended solution:** Add a `gift_cards` table (id, code, initial_amount, balance, purchaser_id, recipient_name, expiry_date, status) and MCP tools: `create_gift_card`, `check_gift_card_balance`, `redeem_gift_card`, `list_gift_cards`.

---

## INVOICING (InvoiceShelf / SUNAT)

---

### Scenario 10: Multi-item boleta with IGV

**Roleplay Message (Carmen → WhatsApp):**
> "Hazme la boleta de hoy de la señora Gutiérrez: corte S/35, coloración S/120, tratamiento capilar S/45, 1 shampoo Schwarzkopf S/38. Total con IGV."

**Skills Involved:**
- `yaya-tax` (primary) — invoice generation, IGV calculation
- `yaya-crm` (minor) — client lookup

**MCP Tools Required:**
- `invoicing-mcp` → `lookup_dni` (validate Sra. Gutiérrez's DNI)
- `invoicing-mcp` → `create_invoice` (boleta with 4 line items)
- `crm-mcp` → `get_contact` (client info)

**Ratings:**

| Metric | Score | Notes |
|--------|-------|-------|
| Handleable | 8 | yaya-tax fully covers boleta generation with multiple line items. IGV calculation (18%) is built in. |
| Accuracy | 8 | Clear line items with known prices. Subtotal: S/201.69, IGV: S/36.31, Total: S/238.00. Wait — Carmen says "total con IGV" implying the prices she quoted MAY already include IGV (common in retail). This ambiguity needs handling. |
| Speed | 6 | DNI lookup + invoice creation = 2 MCP calls. |
| Completeness | 7 | Generates the boleta. But: Are Carmen's stated prices IGV-inclusive or exclusive? Salons in Peru typically quote IGV-inclusive prices to consumers. The system needs to handle both. |
| Delight | 8 | Quick invoice with PDF. Carmen loves efficiency. |
| Safety | 8 | DNI validation before issuance. SUNAT-compliant format. |

**Gaps Identified:**
- **IGV-inclusive vs. exclusive price ambiguity.** Salons almost always quote IGV-inclusive prices ("el corte cuesta S/35" = S/35 total, not S/35 + IGV). The invoicing system needs to handle "prices include IGV" mode and calculate the breakdown correctly.
- **Mixed product/service invoicing.** The boleta has both services (corte, coloración, tratamiento) and products (shampoo). Different tax treatment may apply depending on business structure.

---

### Scenario 11: Corporate event factura

**Roleplay Message (Carmen → WhatsApp):**
> "Una empresa me contrata para maquillar a 15 chicas para su evento corporativo. Necesitan factura. RUC 20612345678, razón social Corporación Vega SAC."

**Skills Involved:**
- `yaya-tax` (primary) — factura generation with RUC validation
- `yaya-escalation` (minor) — high-value order flagging

**MCP Tools Required:**
- `invoicing-mcp` → `lookup_ruc` (validate 20612345678)
- `invoicing-mcp` → `create_invoice` (factura, document_type="01")

**Ratings:**

| Metric | Score | Notes |
|--------|-------|-------|
| Handleable | 8 | yaya-tax covers factura generation with RUC validation. Corporate invoice flow is well-documented in the skill. |
| Accuracy | 8 | RUC lookup validates the company. 15 × maquillaje price = total. Needs to handle corporate pricing (potentially different from individual pricing). |
| Speed | 6 | RUC lookup + invoice creation. |
| Completeness | 7 | Generates the factura. Missing: corporate quote/proposal workflow, deposit requirement for large events, contract terms. |
| Delight | 7 | Professional factura delivery. Would be better with a formal quotation/proposal step first. |
| Safety | 8 | RUC validation ensures legitimate business. High-value order should trigger escalation review. |

**Gaps Identified:**
- **No quotation/proposal system.** Corporate events typically need a formal quote before the factura. No quote → acceptance → invoice workflow.
- **No event management.** 15 people event needs: scheduling across stylists, product inventory for 15 services, logistics coordination. The system treats this as a simple invoice.

---

### Scenario 12: Batch boleta for gift cards

**Roleplay Message (Carmen → WhatsApp):**
> "Vendí 20 gift cards este mes — necesito emitir boletas por todas. ¿Puedo hacerlo en batch?"

**Skills Involved:**
- `yaya-tax` (primary) — batch invoicing

**MCP Tools Required:**
- `invoicing-mcp` → `create_invoice` × 20 (or batch endpoint)

**Ratings:**

| Metric | Score | Notes |
|--------|-------|-------|
| Handleable | 3 | **Partially covered.** yaya-tax can create individual boletas, but there's no batch invoicing tool. 20 sequential `create_invoice` calls would be slow and error-prone. Additionally, gift card sales aren't tracked, so there's no data source to generate from. |
| Accuracy | 2 | Without gift card records, the system doesn't know who bought what. Carmen would need to dictate all 20 transactions. |
| Speed | 3 | 20 sequential API calls with SUNAT validation each. Very slow. |
| Completeness | 3 | Even if batch were supported, the data doesn't exist (no gift card system). |
| Delight | 2 | This is exactly the kind of manual drudgery Carmen wants to eliminate. |
| Safety | 5 | Risk of errors in manual entry of 20 transactions. |

**Gaps Identified:**
- **No batch invoicing tool.** `invoicing-mcp` lacks a `create_batch_invoices` tool.
- **Compounds the gift card gap.** Without gift card tracking, there's no source data for batch invoicing.

---

## SCHEDULING & APPOINTMENTS (Cal.com)

---

### Scenario 13: Full service/schedule configuration

**Roleplay Message (Carmen → WhatsApp):**
> "Configúrame el sistema de citas online. Mis servicios con duración: corte 45min, coloración 2h, manicure 45min, facial 1h, pestañas 1.5h, keratina 3h. Horario: martes a sábado 9am-7pm. Domingos y lunes cerrado."

**Skills Involved:**
- `yaya-appointments` (primary) — service creation, provider schedule setup
- `yaya-onboarding` (secondary) — initial system configuration

**MCP Tools Required:**
- `appointments-mcp` → `create_service` × 6 (one per service type)
- `appointments-mcp` → `set_working_hours` × 5 days × N providers

**Ratings:**

| Metric | Score | Notes |
|--------|-------|-------|
| Handleable | 8 | appointments-mcp has `create_service` and `set_working_hours` tools. Data model supports all of this. |
| Accuracy | 8 | Service durations and hours are straightforward. Need to set up: 6 services + working hours for each of 7 staff (Carmen + 3 stylists + 1 facial specialist + 1 nail tech + 1 aesthetician). |
| Speed | 5 | Many MCP calls: 6 create_service + ~35 set_working_hours (5 days × 7 providers). Rate limiting consideration. |
| Completeness | 7 | Sets up services and hours. Missing: which providers can do which services (not all stylists do keratina), provider-specific pricing (senior vs. junior rates), buffer time configuration per service type. |
| Delight | 8 | One-time setup that eliminates the notebook. Carmen would love it. |
| Safety | 8 | Configuration only, no booking risk. |

**Gaps Identified:**
- **No provider-service mapping.** The data model has `providers` and `services` but no `provider_services` junction table. All providers appear available for all services. Carmen's nail tech shouldn't show up for "keratina" appointments.
- **No tier-based pricing.** Senior stylists charge more than juniors for the same service. No `provider_service_pricing` model.
- **🔴 Cal.com integration is NOT implemented.** The appointments-mcp is a standalone PostgreSQL system. Cal.com is in `services/calcom/` as a separate project but there's NO MCP bridge or API integration between them. The "Cal.com appointment scheduling" referenced in Carmen's test focus doesn't exist as an integrated component.

---

### Scenario 14: Instagram booking link

**Roleplay Message (Carmen → WhatsApp):**
> "Quiero que las clientas puedan reservar por Instagram — que haya un link de booking en mi bio."

**Skills Involved:**
- `yaya-appointments` (primary) — online booking URL
- `yaya-meta` (minor) — platform capabilities

**MCP Tools Required:**
- None directly — this is a configuration/deployment question

**Ratings:**

| Metric | Score | Notes |
|--------|-------|-------|
| Handleable | 4 | **Partially covered.** Cal.com self-hosted is in the services directory and would provide a booking link. BUT: (1) Cal.com is not integrated with appointments-mcp, (2) there's no public-facing booking page generated by appointments-mcp, (3) no Instagram API integration exists. |
| Accuracy | 3 | The agent could tell Carmen "we'll generate a booking link" but the infrastructure to do so isn't connected. |
| Speed | N/A | — |
| Completeness | 3 | Cal.com has a booking page feature, but it's a separate system. Appointments booked through Cal.com wouldn't sync to appointments-mcp or the rest of the platform without custom integration. |
| Delight | 3 | Carmen's #1 marketing channel is Instagram. Not being able to put a booking link in her bio is a major miss. |
| Safety | 5 | No risk, just missing functionality. |

**Gaps Identified:**
- **🔴 CRITICAL: No public booking page.** The appointments-mcp is an internal API. There's no customer-facing web page for self-service booking. Cal.com has this but it's not integrated.
- **🔴 No Instagram integration.** Carmen depends on Instagram for 80% of new clients. No API connection, no DM automation, no booking link generation.
- **Recommended:** Either (a) integrate Cal.com as the booking frontend with appointments-mcp as the data layer, or (b) add a simple web booking page to appointments-mcp.

---

### Scenario 15: No-show deposit implementation

**Roleplay Message (Carmen → WhatsApp):**
> "Implementa depósito de S/20 para reservar cita. Si no viene, pierdo el depósito. Estoy HARTA de los plantones 😤😤😤"

**Skills Involved:**
- `yaya-appointments` (primary) — booking policy configuration
- `yaya-payments` (secondary) — deposit collection

**MCP Tools Required:**
- Configuration change (not a tool call)

**Ratings:**

| Metric | Score | Notes |
|--------|-------|-------|
| Handleable | 3 | **🔴 NOT COVERED.** There is no deposit/prepayment system in appointments-mcp. The data model has no `deposit_amount`, `deposit_status`, or `payment_reference` fields on the appointments table. |
| Accuracy | 1 | Cannot implement what doesn't exist. |
| Speed | N/A | — |
| Completeness | 1 | Carmen's #1 pain point is no-shows (15-20% rate, S/50-100 lost per no-show). The platform has no mechanism for booking deposits. |
| Delight | 1 | This is THE feature Carmen wants most. Complete miss. |
| Safety | 2 | Without deposits, Carmen continues losing S/50-100 per no-show, 2-4 times daily = S/100-400/day lost revenue. |

**Gaps Identified:**
- **🔴 CRITICAL: No deposit/prepayment for bookings.** This is Carmen's single most-requested feature. Needs:
  1. Configurable deposit amount per service or global
  2. Payment collection before confirming booking (Yape/Plin/transfer)
  3. Deposit status tracking on each appointment
  4. Automatic forfeiture on no-show
  5. Deposit application to final payment on attendance
  6. Refund policy for legitimate cancellations within window
- **Cal.com has payment integration** (Stripe), but it's not configured for LATAM payment methods (Yape/Plin). Would need a custom payment app.

---

### Scenario 16: Reschedule with automatic WhatsApp notification

**Roleplay Message (Carmen → WhatsApp):**
> "Muéveme la cita de la señora López del jueves 3pm al viernes 11am. Avísale por WhatsApp automáticamente."

**Skills Involved:**
- `yaya-appointments` (primary) — reschedule_appointment, send_reminder

**MCP Tools Required:**
- `appointments-mcp` → `reschedule_appointment` (new datetime)
- `appointments-mcp` → `send_reminder` (WhatsApp notification)

**Ratings:**

| Metric | Score | Notes |
|--------|-------|-------|
| Handleable | 7 | appointments-mcp has `reschedule_appointment` and `send_reminder` tools. Full reschedule flow documented in skill. |
| Accuracy | 7 | Finds the appointment by customer name + date, reschedules. Needs to verify new slot is available. |
| Speed | 7 | 2-3 MCP calls: find appointment, check availability, reschedule, send notification. |
| Completeness | 7 | Reschedules and notifies. But WhatsApp notification depends on `WHATSAPP_API_URL` being configured (optional in appointments-mcp — "works without these, just logs messages"). |
| Delight | 7 | Smooth if it works. Carmen wants this automated. |
| Safety | 7 | Checks availability before moving. Double-booking prevention. |

**Gaps Identified:**
- **WhatsApp integration is optional/unimplemented.** The appointments-mcp code says "optional — works without these, just logs messages." In production, this means reminders don't actually send unless the WhatsApp Business API is configured. The skill SAYS it sends WhatsApp messages but the MCP server may just log them.

---

### Scenario 17: Monthly no-show report with data

**Roleplay Message (Carmen → WhatsApp):**
> "¿Cuántos no-shows tuve este mes? Quiero datos concretos para justificar el depósito obligatorio."

**Skills Involved:**
- `yaya-appointments` (primary) — list_no_shows
- `yaya-analytics` (secondary) — no-show metrics

**MCP Tools Required:**
- `appointments-mcp` → `list_no_shows` (date range: this month)
- `postgres-mcp` → query no-show rate, revenue impact calculation

**Ratings:**

| Metric | Score | Notes |
|--------|-------|-------|
| Handleable | 7 | appointments-mcp has `list_no_shows` tool. The appointments table tracks `status = 'no_show'`. |
| Accuracy | 7 | Accurate count IF no-shows are being marked in the system. Requires staff to update appointment status after each no-show (not automatic). |
| Speed | 7 | Single query against appointments table. |
| Completeness | 6 | Can show: count of no-shows, dates, which clients. Can estimate revenue lost (no-show × avg service price). Missing: comparison with previous months, repeat offender analysis, cost of lost product prep time. |
| Delight | 7 | Concrete data to justify her deposit policy. Carmen would appreciate hard numbers. |
| Safety | 8 | Read-only analysis. |

**Gaps Identified:**
- **No automatic no-show detection.** Someone must manually mark appointments as no_show. No "appointment passed without check-in" auto-detection.
- **No "no-show score" per client.** The CRM/appointments don't track repeat no-show offenders with a score that could trigger automatic deposit requirements for habitual offenders.

---

## ANALYTICS (Metabase)

---

### Scenario 18: Full salon dashboard

**Roleplay Message (Carmen → WhatsApp):**
> "Dame el dashboard de mi salón: ingresos por servicio, por estilista, y por día de la semana. Necesito ver dónde estoy ganando y dónde estoy perdiendo."

**Skills Involved:**
- `yaya-analytics` (primary) — multi-dimensional revenue reporting

**MCP Tools Required:**
- `postgres-mcp` → complex aggregation queries (revenue by service, provider, day)
- `erpnext-mcp` → sales data by service category

**Ratings:**

| Metric | Score | Notes |
|--------|-------|-------|
| Handleable | 6 | yaya-analytics skill is comprehensive in report design. But it was designed for product retail (sneakers), not service businesses. Revenue "per service" and "per stylist" requires data from the appointments system, not ERPNext orders. |
| Accuracy | 5 | **Data architecture mismatch.** Salon revenue comes from completed appointments (not ERPNext sales orders). The analytics skill queries ERPNext for sales data, but salon services would live in the appointments database. No cross-system join exists. |
| Speed | 5 | Complex multi-dimensional queries. |
| Completeness | 5 | The skill's report templates are retail-focused (top products, order counts). Salon-specific metrics are missing: revenue per chair-hour, stylist utilization rate, average ticket per visit, service mix analysis. |
| Delight | 5 | Gets some data but not the salon-specific insights Carmen craves. |
| Safety | 8 | Read-only. |

**Gaps Identified:**
- **🔴 CRITICAL: No Metabase integration.** Metabase is in `services/metabase/` as a full source code repo, but there's NO MCP server for Metabase, no dashboard configuration, and no integration with the agent. The "stylist performance analytics via Metabase" focus area for this test is completely unimplemented.
- **Analytics skill doesn't know about appointments data.** The skill queries ERPNext and CRM. Salon revenue lives in the appointments system. No analytics queries against appointments tables.
- **No salon-specific KPIs:** chair-hour revenue, stylist utilization %, rebooking rate, service mix profitability, retail attachment rate.

---

### Scenario 19: Stylist performance comparison

**Roleplay Message (Carmen → WhatsApp):**
> "¿Cuál de mis estilistas genera más ingresos? Y cuál tiene mejor tasa de retención de clientas?"

**Skills Involved:**
- `yaya-analytics` (primary) — provider-level analytics
- `yaya-crm` (secondary) — retention data per stylist

**MCP Tools Required:**
- `postgres-mcp` → revenue aggregation by provider_id from appointments
- `postgres-mcp` → customer retention per provider (returning clients)

**Ratings:**

| Metric | Score | Notes |
|--------|-------|-------|
| Handleable | 5 | Theoretically possible with postgres-mcp querying appointments table directly. But no pre-built query or analytics template for stylist comparison exists. |
| Accuracy | 4 | Appointments table has `provider_id` and service price via `service_id` join. Revenue per stylist is calculable. Retention per stylist requires tracking which clients return to the same stylist — possible but complex query. |
| Speed | 5 | Complex aggregate queries with customer dedup. |
| Completeness | 4 | Revenue per stylist: possible. Retention rate per stylist: requires multi-query analysis. Missing: average rating per stylist (no review system), service time efficiency, upsell rate. |
| Delight | 4 | Carmen needs this for commission disputes. Partial data is frustrating. |
| Safety | 8 | Read-only. |

**Gaps Identified:**
- **No stylist performance dashboard.** This is essential for salon management. Need pre-built queries for: revenue per stylist, services per stylist, average ticket, retention rate, rebooking rate, commission calculations.
- **No review/rating integration.** Carmen checks Google/Instagram reviews but there's no system to link reviews to specific stylists.

---

### Scenario 20: Monthly sales trend

**Roleplay Message (Carmen → WhatsApp):**
> "Quiero ver la evolución de mis ventas mes a mes este año. ¿Estoy creciendo o estancada?"

**Skills Involved:**
- `yaya-analytics` (primary) — trend analysis, period comparison

**MCP Tools Required:**
- `postgres-mcp` → monthly revenue aggregation from appointments + ERPNext (retail)
- `erpnext-mcp` → monthly sales orders summary

**Ratings:**

| Metric | Score | Notes |
|--------|-------|-------|
| Handleable | 6 | yaya-analytics has month-over-month comparison capability. Trend analysis is well-documented in the skill. |
| Accuracy | 5 | Requires combining: service revenue (appointments DB) + retail revenue (ERPNext). No unified "total revenue" view across both systems. |
| Speed | 5 | Multi-system query. |
| Completeness | 5 | Shows the trend but can't separate service vs. retail contribution, or identify what's driving growth/stagnation. |
| Delight | 6 | Gets the headline number. Missing the "why" behind the trend. |
| Safety | 8 | Read-only. |

**Gaps Identified:**
- **Two revenue streams, two databases.** Services live in appointments-mcp (PostgreSQL), retail in ERPNext. No unified revenue view. This is a fundamental architecture issue for hybrid service+retail businesses like Carmen's salon.

---

### Scenario 21: Retail vs. services profitability

**Roleplay Message (Carmen → WhatsApp):**
> "¿Cuánto me deja el retail vs. los servicios? Siento que vender shampoos no vale la pena pero no estoy segura."

**Skills Involved:**
- `yaya-analytics` (primary) — revenue breakdown
- `yaya-inventory` (secondary) — product margin data

**MCP Tools Required:**
- `erpnext-mcp` → retail sales + product costs → margin
- `postgres-mcp` → service revenue from appointments
- `postgres-mcp` → service costs (product consumption per service — NOT TRACKED)

**Ratings:**

| Metric | Score | Notes |
|--------|-------|-------|
| Handleable | 4 | Retail margins can be calculated from ERPNext (sale price - cost price). Service margins CANNOT be calculated because per-service product consumption isn't tracked. |
| Accuracy | 3 | Retail: accurate if cost prices are in ERPNext. Services: only revenue is known, not true cost (product + time + overhead). |
| Speed | 5 | Multi-system queries. |
| Completeness | 3 | Can show retail revenue + margin. Services: revenue only. True comparison (margin %) impossible without service cost data. |
| Delight | 4 | Partial answer. Carmen specifically wants to know if retail is worth the shelf space and capital tied up. |
| Safety | 8 | Read-only. |

**Gaps Identified:**
- **No service cost/margin tracking.** Key missing data: how much product is consumed per service, labor cost per service (commission rate × time), overhead allocation. Without this, service profitability analysis is impossible.
- **No "retail attachment rate."** What % of service clients also buy retail? This is a critical salon metric.

---

## PAYMENT RECONCILIATION (Settler)

---

### Scenario 22: Weekly cash reconciliation

**Roleplay Message (Carmen → WhatsApp):**
> "Cuadra la caja de la semana: servicios, retail, gift cards. Yape, efectivo, POS, transferencias. Necesito que todo cuadre antes de pagar comisiones."

**Skills Involved:**
- `yaya-payments` (primary) — payment reconciliation
- `yaya-analytics` (secondary) — weekly summary

**MCP Tools Required:**
- `erpnext-mcp` → payment entries by method for the week
- `postgres-mcp` → appointment payments for the week
- `payments-mcp` → `list_pending_payments`

**Ratings:**

| Metric | Score | Notes |
|--------|-------|-------|
| Handleable | 4 | **Mostly not covered.** There's no "Settler" or cash reconciliation tool. yaya-payments validates individual payments but doesn't do end-of-period reconciliation. The analytics skill has weekly reports but they're sales-focused, not payment-method reconciliation. |
| Accuracy | 3 | Would need to: (1) sum service payments from appointments-mcp, (2) sum retail payments from ERPNext, (3) sum gift card sales (NOT TRACKED), (4) break down by payment method. Data is fragmented across systems. |
| Speed | 4 | Complex multi-system aggregation. |
| Completeness | 3 | Missing: cash count vs. recorded cash, Yape bank statement vs. recorded Yape, POS terminal settlement vs. recorded POS, gift card liability tracking. |
| Delight | 3 | Carmen needs this weekly before paying commissions. Getting it wrong means disputes with staff. |
| Safety | 5 | Financial reconciliation errors directly impact commission payments. |

**Gaps Identified:**
- **🔴 No payment reconciliation system.** "Settler" is mentioned in Carmen's test but doesn't exist in the platform. Need:
  1. Multi-source payment aggregation (Yape, cash, POS, transfer)
  2. Service revenue + retail revenue unification
  3. Payment method breakdown with expected vs. actual
  4. Cash discrepancy detection
  5. Gift card liability tracking
  6. Export for accountant

---

### Scenario 23: Stylist commission calculation

**Roleplay Message (Carmen → WhatsApp):**
> "Calcula las comisiones de esta semana: Estilista Ana (35% de sus servicios), Estilista Paola (30%), Junior Sofía (25%), Junior Katy (25%). Descuenta los productos que usaron."

**Skills Involved:**
- `yaya-analytics` (primary) — commission calculation
- `yaya-payments` (secondary) — payment data per stylist

**MCP Tools Required:**
- `postgres-mcp` → completed appointments per stylist this week with prices
- `erpnext-mcp` → product consumption per stylist (NOT TRACKED)

**Ratings:**

| Metric | Score | Notes |
|--------|-------|-------|
| Handleable | 4 | **Mostly not covered.** The platform has no commission calculation system. The appointments table has per-provider completed services, so revenue per stylist CAN be calculated. But: (1) commission rates aren't stored anywhere, (2) product deductions aren't tracked per stylist, (3) no payroll/commission payout workflow. |
| Accuracy | 3 | Revenue per stylist: possible from appointments. Commission rates: would need to be configured somewhere (currently nowhere). Product deduction: impossible — product usage isn't tracked per stylist. |
| Speed | 4 | Complex calculation even if data existed. |
| Completeness | 3 | Carmen's pain point #3 is "commission tracking nightmare." The platform doesn't address it. |
| Delight | 2 | This causes weekly disputes with staff. Not solving it is a significant failure. |
| Safety | 4 | Wrong commission calculations = unhappy employees, potential labor disputes. |

**Gaps Identified:**
- **🔴 CRITICAL: No commission management system.** Needs:
  1. Configurable commission rates per stylist per service type
  2. Automatic calculation from completed appointments
  3. Product consumption tracking and deduction per stylist
  4. Commission summary with line-by-line breakdown
  5. Historical commission records
  6. Dispute resolution (show the data behind each calculation)

---

### Scenario 24: Yape vs. boleta reconciliation

**Roleplay Message (Carmen → WhatsApp):**
> "Compara lo que me cayó en Yape este mes vs. las boletas que emití. Quiero ver si me falta cobrar algo."

**Skills Involved:**
- `yaya-payments` (primary) — Yape payment records
- `yaya-tax` (secondary) — invoice records

**MCP Tools Required:**
- `payments-mcp` → list payments by method (Yape)
- `invoicing-mcp` → `list_invoices` (this month)
- `postgres-mcp` → cross-reference amounts

**Ratings:**

| Metric | Score | Notes |
|--------|-------|-------|
| Handleable | 4 | Both data sources exist (payments in payments-mcp, invoices in invoicing-mcp). But there's no reconciliation tool that cross-references them. The LLM would need to pull both datasets and compare manually. |
| Accuracy | 4 | Yape payments may not all have corresponding boletas (many salon clients don't ask for boletas). The comparison may show more Yape than boletas, which is normal but looks like a gap. |
| Speed | 5 | Two MCP queries + LLM comparison. |
| Completeness | 4 | Can show totals but not line-by-line matching. No bank statement integration (the actual Yape balance from BCP). |
| Delight | 4 | Gets approximate numbers but not the tight reconciliation Carmen needs. |
| Safety | 5 | Tax compliance issue — if boletas don't match revenue, SUNAT could flag it. |

**Gaps Identified:**
- **No bank statement import/matching.** Real reconciliation requires comparing system records against actual bank/Yape statements. No file import capability.
- **Boleta-to-payment matching.** No system tracks which payment corresponds to which boleta.

---

## LOYALTY PROGRAM & GIFT CARDS

---

### Scenario 25: Loyalty points check

**Roleplay Message (Carmen → WhatsApp):**
> "Mi clienta habitual María tiene su tarjeta de fidelidad — creo que lleva 8 servicios. Al llegar a 10 le toca un corte gratis. Verifica cuántos le faltan."

**Skills Involved:**
- None directly applicable

**MCP Tools Required:**
- No loyalty program MCP tools exist

**Ratings:**

| Metric | Score | Notes |
|--------|-------|-------|
| Handleable | 2 | **🔴 NOT COVERED.** There is no loyalty program system in the platform. No points, no stamps, no tiers, no rewards tracking. |
| Accuracy | 1 | Cannot verify loyalty status. Would have to count past appointments manually from the appointments table, but that's not a loyalty program. |
| Speed | N/A | — |
| Completeness | 1 | Carmen's pain point #9 is "loyalty program manual management" with stamp cards getting lost. The platform doesn't solve this. |
| Delight | 1 | Carmen is losing money on honor-based stamp cards. Zero improvement. |
| Safety | 3 | Without digital tracking, clients claim more stamps than they have. Revenue leakage continues. |

**Gaps Identified:**
- **🔴 CRITICAL: No loyalty program system.** Needs:
  1. Points/stamps accumulation per visit or spend
  2. Configurable reward thresholds (10 visits = free service)
  3. Tier system (bronze/silver/gold with increasing benefits)
  4. Digital loyalty card (no more lost paper cards)
  5. Automatic point accrual on appointment completion
  6. Reward redemption tracking
  7. Loyalty analytics (program cost vs. retention benefit)
- **Recommended:** New skill `yaya-loyalty` + `loyalty-mcp` server with PostgreSQL backend.

---

### Scenario 26: Gift card validation and balance check

**Roleplay Message (Carmen → WhatsApp):**
> "Alguien viene con un gift card que dice 'S/300 - Beauty Studio Carmen'. ¿Es válido? ¿Cuánto saldo le queda?"

**Skills Involved:**
- None applicable

**MCP Tools Required:**
- No gift card MCP tools exist

**Ratings:**

| Metric | Score | Notes |
|--------|-------|-------|
| Handleable | 1 | **🔴 NOT COVERED.** Same as Scenario 9. No gift card system. |
| Accuracy | 1 | Cannot validate or check balance. |
| Speed | N/A | — |
| Completeness | 1 | Complete miss. |
| Delight | 1 | Client is standing at the counter with a gift card and Carmen can't verify it. Embarrassing. |
| Safety | 2 | Risk of accepting invalid or already-used gift cards. Financial loss. |

**Gaps Identified:**
- Same as Scenario 9. Gift card system is completely missing.

---

## ESCALATION TRIGGERS

---

### Scenario 27: Angry client demanding refund for hair color

**Roleplay Message (Carmen → WhatsApp):**
> "UNA CLIENTA ME ESTÁ HACIENDO ESCÁNDALO EN EL SALÓN 😡😡😡 Dice que el color le quedó mal y quiere su plata de vuelta. YO LE DIJE que el rubio platino no iba a quedar en su pelo pero insistió!!!"

**Skills Involved:**
- `yaya-escalation` (primary) — frustration detection, context summary
- `yaya-returns` (secondary) — refund policy guidance
- `yaya-crm` (minor) — client history

**MCP Tools Required:**
- `crm-mcp` → `get_contact` (client history, past services)
- `crm-mcp` → `log_interaction` (document the incident)

**Ratings:**

| Metric | Score | Notes |
|--------|-------|-------|
| Handleable | 7 | yaya-escalation handles frustrated customers well. yaya-returns covers refund requests. But this scenario is unique: Carmen IS the business owner AND the stylist. Escalation can't go "up" — she needs de-escalation guidance and policy advice. |
| Accuracy | 6 | Can provide: refund policy, suggest partial refund or redo, document the incident. But this is a real-time salon confrontation — WhatsApp response time may not match the urgency. |
| Speed | 6 | Quick CRM lookup + guidance. |
| Completeness | 6 | Covers refund policy and documentation. Missing: (1) legal liability guidance (did Carmen do a patch test?), (2) waiver/consent documentation (Carmen warned the client), (3) social media damage control (angry client might post on Instagram). |
| Delight | 6 | Helpful in the moment but Carmen is dealing with a screaming client — she needs instant, actionable advice, not a policy recitation. |
| Safety | 7 | Encouraging documentation is good. Not escalating to legal advice without disclaimer is important. |

**Gaps Identified:**
- **Escalation skill assumes "owner is the escalation target."** For solo-owner businesses, there's no one to escalate TO. Need a "self-escalation" mode that provides de-escalation scripts, policy templates, and documentation checklists.
- **No consent/waiver tracking.** Salons should document when a client insists on a service against professional advice. No "service consent" model.
- **No social media monitoring.** An angry client posting negative reviews is a real risk. No integration with Google Reviews or Instagram.

---

### Scenario 28: Missed SUNAT declaration

**Roleplay Message (Carmen → WhatsApp):**
> "SUNAT me mandó una notificación porque no declaré el mes pasado. Se me olvidó completamente 😭 ¿Me van a multar mucho?"

**Skills Involved:**
- `yaya-tax` (primary) — tax obligation guidance, deadline info, penalty estimation

**MCP Tools Required:**
- `invoicing-mcp` → `get_tax_obligations` (regime=RMT)
- `invoicing-mcp` → `calculate_tax` (last month's numbers)

**Ratings:**

| Metric | Score | Notes |
|--------|-------|-------|
| Handleable | 7 | yaya-tax covers tax regime obligations, deadline calculations, and has proactive reminder system (5 days, 1 day, day-of). It SHOULD have prevented this if reminders were active. |
| Accuracy | 6 | Can explain: RMT regime penalties for late declaration (gradual fines), how to file the late declaration, estimated penalty. But SUNAT penalty calculation is complex (depends on UIT, days late, voluntary vs. forced compliance). Agent should add disclaimer. |
| Speed | 7 | Quick lookup of obligations + LLM reasoning about penalties. |
| Completeness | 7 | Covers: what happened, what to do, estimated penalty, how to prevent next time. Missing: direct SUNAT portal guidance (step-by-step PDT 621 filing), and whether the agent should have caught this with proactive reminders. |
| Delight | 7 | Reassuring in a panic moment. Carmen is stressed — agent should be calming but practical. |
| Safety | 8 | Includes tax disclaimer ("consulta con tu contador"). Doesn't give definitive legal/tax advice. |

**Gaps Identified:**
- **Proactive reminder should have prevented this.** yaya-tax has deadline reminders, but were they configured? If not, the onboarding process failed to set up SUNAT deadline monitoring.
- **No SUNAT portal integration.** Agent can advise but can't file the declaration or check the actual penalty amount.

---

## EDGE CASES

---

### Scenario 29: Client allergic reaction to hair dye

**Roleplay Message (Carmen → WhatsApp):**
> "Una clienta dice que le dio alergia el tinte que le puse. Quiere que le pague el dermatólogo. ¿Qué hago? ¿Tengo responsabilidad legal?"

**Skills Involved:**
- `yaya-escalation` (primary) — high-sensitivity scenario
- `yaya-crm` (secondary) — document the incident

**MCP Tools Required:**
- `crm-mcp` → `get_contact` (client history)
- `crm-mcp` → `log_interaction` (document everything)

**Ratings:**

| Metric | Score | Notes |
|--------|-------|-------|
| Handleable | 5 | The agent can help document the incident and provide general guidance. But legal liability questions are explicitly out of scope for all skills (disclaimer required). |
| Accuracy | 5 | Can cover: document everything, check if patch test was done, save photos, suggest consulting a lawyer. Cannot give definitive legal advice. |
| Speed | 7 | Quick guidance. |
| Completeness | 5 | Covers immediate actions (document, be empathetic, don't admit fault). Missing: (1) insurance claim process (if Carmen has professional liability insurance), (2) Peruvian consumer protection law specifics, (3) INDECOPI complaint process. |
| Delight | 5 | Helpful but limited. Carmen needs a lawyer, not an AI, for this. |
| Safety | 8 | Correctly refuses to give legal advice. Recommends professional consultation. |

**Gaps Identified:**
- **No professional liability/insurance tracking.** Salon should track if they have liability insurance. Agent could help file a claim.
- **No service consent/waiver system.** If Carmen did a patch test and it was documented, she has a defense. If not, she's exposed. No system tracks this.

---

### Scenario 30: Senior stylist leaves and takes clients

**Roleplay Message (Carmen → WhatsApp):**
> "Se me fue una estilista senior — se llevó como 20 clientas a su propio salón. ¿Cómo recupero esas clientas? ¿Tengo sus datos de contacto en el sistema?"

**Skills Involved:**
- `yaya-crm` (primary) — client contact data, segmentation by provider
- `yaya-followup` (secondary) — re-engagement campaign
- `yaya-notifications` (minor) — targeted outreach

**MCP Tools Required:**
- `crm-mcp` → `search_contacts` (filter by preferred provider = departed stylist)
- `postgres-mcp` → query appointments by provider_id to find associated clients
- `crm-mcp` → `get_contact` for each affected client

**Ratings:**

| Metric | Score | Notes |
|--------|-------|-------|
| Handleable | 7 | CRM has contact data. Appointments track which clients saw which stylist. Can identify affected clients and their contact info. |
| Accuracy | 7 | If appointments were tracked in the system, can definitively list all clients who regularly saw the departed stylist. Contact info depends on CRM data quality. |
| Speed | 6 | Query appointments by provider, then cross-reference with CRM contacts. |
| Completeness | 7 | Can: identify affected clients, provide contact list, suggest re-engagement campaign. Missing: legal aspects (non-compete agreements), competitive analysis, retention offers. |
| Delight | 7 | This is exactly when having data pays off. Carmen currently tracks nothing — with the platform, she'd have all client contact info. Powerful argument for the platform. |
| Safety | 7 | No data privacy issues — Carmen owns the client data. |

**Gaps Identified:**
- **No "client-provider relationship" analytics.** Could show: how many clients exclusively see one stylist (concentration risk), which clients are "loyal to the salon" vs. "loyal to the stylist."
- **No retention campaign templates.** Would benefit from pre-built re-engagement flows for this specific scenario.

---

### Scenario 31: Expansion feasibility analysis

**Roleplay Message (Carmen → WhatsApp):**
> "Quiero abrir un segundo local en San Miguel. ¿Los datos que tengo me dicen si estoy lista para expandirme?"

**Skills Involved:**
- `yaya-analytics` (primary) — business health analysis
- `yaya-crm` (secondary) — client geographic distribution

**MCP Tools Required:**
- `postgres-mcp` → revenue trends, utilization rates, growth metrics
- `crm-mcp` → client addresses/locations (if captured)
- `erpnext-mcp` → financial data

**Ratings:**

| Metric | Score | Notes |
|--------|-------|-------|
| Handleable | 4 | Can provide some data points (revenue trend, utilization, client count) but has no "expansion readiness" framework. Missing critical data: capacity utilization %, cash reserves, debt capacity, market analysis. |
| Accuracy | 3 | Most expansion-relevant data isn't in the system: (1) current capacity utilization (chairs occupied / total chair-hours), (2) demand overflow (turned away clients), (3) geographic client distribution, (4) San Miguel market analysis. |
| Speed | 5 | Multiple queries for what data exists. |
| Completeness | 3 | Can show: revenue is growing, client base is expanding. Cannot assess: financial readiness, market opportunity, operational capacity, management bandwidth. |
| Delight | 4 | Carmen wants a data-driven answer. Gets partial data at best. |
| Safety | 7 | Should heavily disclaim — expansion decisions need a business plan and accountant. |

**Gaps Identified:**
- **No capacity utilization tracking.** The single most important metric for expansion: are current chairs full? No system tracks this.
- **No geographic client analysis.** Where do clients come from? If many already come from San Miguel, that's a signal. CRM doesn't typically capture client addresses.
- **Recommendation: out of scope** for the platform. Should honestly say "you need a business consultant for this" while providing whatever data exists.

---

### Scenario 32: Influencer barter deal evaluation

**Roleplay Message (Carmen → WhatsApp):**
> "Una influencer me pide servicio gratis a cambio de un post. Tiene 15K seguidores. ¿Me conviene? ¿Cuánto me costaría en servicios vs. cuántas clientas podría traer?"

**Skills Involved:**
- `yaya-analytics` (primary) — ROI calculation
- `yaya-crm` (secondary) — client acquisition cost data

**MCP Tools Required:**
- `postgres-mcp` → average client acquisition cost (if trackable)
- `erpnext-mcp` → service cost data

**Ratings:**

| Metric | Score | Notes |
|--------|-------|-------|
| Handleable | 4 | The LLM can reason about influencer ROI (15K followers × engagement rate × conversion rate × LTV vs. service cost), but no platform data supports this calculation. |
| Accuracy | 3 | Industry benchmarks exist (1-3% engagement rate, 0.5-2% conversion from beauty influencer posts), but these aren't in the system. LLM knowledge would fill the gap with general estimates. |
| Speed | 7 | Mostly LLM reasoning, minimal MCP calls. |
| Completeness | 4 | Can estimate: service cost (S/200-400 depending on what she requests), potential reach (15K × 3% = 450 engaged, × 1% = 4-5 new clients), LTV of new client (average spend × visits/year). Missing: the influencer's actual engagement rate, audience demographics, location match. |
| Delight | 5 | Gets a rough framework for decision-making. Not bad but not data-driven from her own business. |
| Safety | 6 | Advisory. Should note: get the influencer to agree to deliverables in writing (post format, timing, tags). |

**Gaps Identified:**
- **No marketing analytics.** No Instagram API integration to check influencer engagement rates, audience demographics, or content performance.
- **No client acquisition source tracking.** Carmen doesn't know how many clients each Instagram post brings. Without attribution, ROI is always a guess.
- **No influencer/barter management.** Would benefit from: tracking barter deals, required deliverables, actual results.

---

## SUMMARY

### Overall Platform Rating for Carmen Rojas (Beauty Salon)

| Category | Average Score | Assessment |
|----------|--------------|------------|
| Core Business Operations (1-5) | 6.3 | Good for scheduling; weak on salon-specific needs (formulas, dual inventory) |
| Pricing & Payments (6-9) | 4.3 | Partial payment works; gift cards, promotions, pricing advisor missing |
| Invoicing / SUNAT (10-12) | 5.7 | Boleta/factura generation solid; batch and gift card invoicing gaps |
| Scheduling & Appointments (13-17) | 5.6 | Core booking works; deposits, public booking page, Instagram link critical misses |
| Analytics / Metabase (18-21) | 4.5 | Retail analytics possible; salon-specific KPIs and Metabase integration missing |
| Payment Reconciliation (22-24) | 3.7 | No reconciliation, no commission system, no bank matching |
| Loyalty & Gift Cards (25-26) | 1.5 | **Completely absent.** Zero coverage. |
| Escalation (27-28) | 6.8 | Decent guidance; self-escalation mode needed for solo owners |
| Edge Cases (29-32) | 4.5 | LLM reasoning helps; platform data insufficient for complex decisions |

### **OVERALL SCORE: 4.7 / 10**

### Critical Gaps (Must-Fix for Beauty Salon Vertical)

| # | Gap | Impact | Effort |
|---|-----|--------|--------|
| 1 | **No deposit/prepayment for bookings** | Carmen loses S/100-400/day to no-shows. This is her #1 need. | Medium — add deposit fields to appointments + Yape pre-collection flow |
| 2 | **No gift card system** | 5% of revenue untracked, fraud risk, manual paper tracking | Medium — new `gift_cards` table + MCP tools + skill |
| 3 | **No loyalty program** | Client retention suffers, honor-based stamps leak money | Medium — new `loyalty` system + MCP tools + skill |
| 4 | **No commission management** | Weekly disputes with 4 stylists, Excel hell | Medium — commission rates config + auto-calculation from appointments |
| 5 | **No Cal.com integration** | No public booking page, no Instagram booking link, no self-service scheduling | High — bridge Cal.com with appointments-mcp or build booking UI |
| 6 | **No Metabase integration** | No visual dashboards, no stylist performance analytics | Medium — configure Metabase to query appointments DB + ERPNext |
| 7 | **No salon-specific data model** | No color formulas, no treatment history, no client cards | Medium — add `treatment_notes` table linked to appointments |
| 8 | **No service cost tracking** | Can't calculate service margins, commission product deductions | Low — add `service_consumables` model |
| 9 | **No Instagram integration** | 80% of new clients come from Instagram; no DM parsing, no booking link, no analytics | High — Instagram API integration |
| 10 | **Dual revenue systems** | Service revenue in appointments-mcp, retail in ERPNext — no unified view | Medium — unified reporting queries or data warehouse |

### What Works Well

1. **Appointment booking core** (create, cancel, reschedule, reminders) — solid foundation
2. **Payment screenshot OCR** (Yape/Plin) — well-designed for LATAM reality
3. **Invoice generation** (boleta/factura with SUNAT compliance) — production-ready
4. **CRM auto-capture** — builds client profiles from conversations naturally
5. **Proactive tax reminders** — could prevent Scenario 28 if configured
6. **Escalation framework** — good frustration detection and handoff protocol
7. **Multi-provider scheduling** — supports Carmen's 7-person team
8. **WhatsApp-native communication** — matches Carmen's daily workflow

### Verdict

The Yaya Platform has a strong foundation for product-retail businesses (its original design target — sneaker shops, clothing stores). For **beauty salons**, it covers maybe 40-50% of needs. The critical gaps are all salon-vertical-specific: no-show deposits, commission management, client treatment history, loyalty programs, gift cards, and Instagram integration. These aren't obscure features — they're the daily operational realities of a 6-person salon in Lima.

Carmen's pain points are well-documented and specific. The platform's skills are comprehensive but generic. Closing the gap requires **vertical-specific extensions**, not fundamental architecture changes. The building blocks (appointments-mcp, CRM, analytics patterns) are all present — they just need salon-specific features bolted on.

**Recommendation:** Build a `yaya-salon` meta-skill that bundles: treatment history, commission calculator, loyalty program, gift cards, and chair utilization metrics. Integrate Cal.com for public booking. Add Yape deposit collection to the appointment flow. These additions would raise Carmen's score from 4.7 to ~7.5.
