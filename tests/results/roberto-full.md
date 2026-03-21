# Test Evaluation: Roberto Huamán — FULL Scenario Coverage

**Persona:** Roberto Huamán Tapullima, 50, Iquitos, Peru. Amazonas Adventures — jungle tour operator (1-7 day Amazon experiences). 8-person team, ~S/520K/year revenue, highly seasonal.  
**Date:** 2026-03-20  
**Evaluator:** Yaya Platform Test Agent (subagent roberto-full)

---

## Overview & Key Findings

Roberto represents a **service-based tourism business** — the most challenging persona type for the Yaya Platform, which was primarily architected around **retail/product businesses**. His needs expose significant architectural gaps:

1. **Multi-day booking complexity** — Not a simple appointment slot; requires coordinating lodge, guide, boat, cook, and provisions across multiple days
2. **USD-primary pricing** with PEN costs — Constant forex exposure, not just display conversion
3. **5+ payment methods across 3 currencies** — PayPal, wire, USD cash, Yape, BCP, credit card links
4. **Offline/no-signal operations** — 2-4 day jungle trips with zero connectivity
5. **Bilingual communication** — Must draft tourist-facing messages in English, not just Spanish
6. **Weather-driven cancellations** — SENAMHI alerts, river levels, trail conditions → complex refund/reschedule logic
7. **Team scheduling ≠ appointment scheduling** — Guides have specialties (bilingual, birdwatching, ayahuasca), rest day requirements, and multi-day unavailability

**Overall Rating: 4.2/10** — The platform can handle fragments of Roberto's workflow (basic booking, invoicing, some analytics) but lacks the integrated tourism operations layer he needs. Most scenarios require workarounds, manual intervention, or features that don't exist.

---

## Scenario 1: Booking Inquiry — Australian Couple, 4-Day Tour

### Roberto's Message
> [Voice note, sounds of boat motor] "Causa, me acaba de escribir una pareja de Australia que quiere un tour de 4 días para la próxima semana. ¿Tengo disponibilidad del lodge Heliconia del 15 al 18? ¿Y qué guía bilingüe está libre?"

### Skill Activation
- **Primary:** `yaya-appointments` — booking availability check
- **Secondary:** `yaya-sales` — voice note transcription via Whisper
- **Tertiary:** `yaya-crm` — log inquiry, create contact for Australian couple

### MCP Tools Called (Ideal)
1. Whisper transcription of voice note → text
2. `appointments-mcp → list_providers` (filter: specialties contains "bilingual" or "english") — find bilingual guides
3. `appointments-mcp → get_provider_schedule` (provider_id: bilingual guides, date_from: "2026-03-15", date_to: "2026-03-18") — check 4-day availability
4. `appointments-mcp → list_services` (category: "multi-day") — find 4-day tour package
5. Lodge availability check — **NO TOOL EXISTS**

### Ratings
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 5 | Can check guide schedules, but no lodge/resource management |
| Accuracy | 4 | Guide availability works, but lodge availability is entirely unmapped |
| Speed | 6 | Voice transcription + multiple queries, ~5-7 seconds |
| Completeness | 3 | Missing: lodge inventory, boat availability, provision planning |
| Delight | 5 | Can respond with guide availability but can't give a full "yes/no" on the tour |
| Safety | 8 | Read-only queries, no risk |

### Gaps
- **CRITICAL: No lodge/resource inventory system.** The `appointments-mcp` tracks provider (guide) schedules but has no concept of "resource" (lodge room, boat) availability. Lodge Heliconia is a physical asset with capacity limits — not a "provider."
- **CRITICAL: Multi-day bookings.** `book_appointment` creates a single time slot. A 4-day tour isn't an appointment — it's a multi-day reservation blocking the guide, lodge, boat, and cook for 4 consecutive days. The system would need 4 separate appointments or a new "reservation" concept.
- **Missing:** Provision planning for multi-day trips (food, fuel, gear). No inventory tracking for consumables.
- **Missing:** Package pricing tied to multi-day bookings. `create_service` has a single `price` field — doesn't support per-person, per-day, group-size-based pricing.
- **Workaround:** Could use `appointments-mcp` to book the guide for 4 consecutive "all-day" service slots, but it's clunky and doesn't capture the lodge or boat.

### Ideal Agent Response
> 📋 Disponibilidad 15-18 marzo (4 días):
> 
> 🏡 Lodge Heliconia: ✅ Disponible (capacidad 8, ocupación actual 2)
> 
> 🧑‍🏫 Guías bilingües disponibles:
> • Carlos Ruiz — ✅ libre los 4 días, especialista en fauna
> • María Quispe — ❌ guiando otro grupo 15-16, libre 17-18
> • Pedro Sánchez — ✅ libre, pero tiene día de descanso el 17
> 
> 🚤 Botes: Pepe-ke y Amazonas III disponibles
> 
> Recomiendo a Carlos. ¿Cotizo para la pareja australiana?

**Score: 4.5/10**

---

## Scenario 2: Multi-Group Daily Logistics

### Roberto's Message
> "Tengo 3 grupos saliendo mañana: day trip Monkey Island (4 personas), 2-day lodge (pareja francesa), 3-day expedition (grupo de 6 americanos). Organízame la logística — guías, botes, y provisiones."

### Skill Activation
- **Primary:** `yaya-appointments` — schedule view and provider assignment
- **Secondary:** `yaya-inventory` — provision tracking (if configured for consumables)

### MCP Tools Called (Ideal)
1. `appointments-mcp → list_appointments` (date_from: tomorrow) — see existing bookings
2. `appointments-mcp → list_providers` — all active guides with specialties
3. Boat assignment — **NO TOOL EXISTS**
4. Provision calculation — **NO TOOL EXISTS**
5. Cook scheduling — **NO TOOL EXISTS**

### Ratings
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 3 | Can list guides and appointments, can't orchestrate logistics |
| Accuracy | 3 | Guide matching possible, but boat/provision/cook logic is absent |
| Speed | N/A | Can't complete the task |
| Completeness | 2 | Only covers ~20% of what Roberto needs (guide scheduling) |
| Delight | 2 | Would output a partial guide list, not the operations brief Roberto expects |
| Safety | 8 | No dangerous actions |

### Gaps
- **CRITICAL: No multi-resource scheduling.** Roberto needs to assign: guide + boat + cook per group. The system only tracks guide (provider) schedules.
- **CRITICAL: No provision calculator.** Multi-day trips need food/water/fuel planning. No integration for consumable inventory per-tour.
- **Missing:** Bilingual guide matching for the American group (6 people need bilingual guide).
- **Missing:** Rest day enforcement (guides should have at least 1 day off per 5 days worked).
- **Workaround:** Roberto would need to do all this manually and just use the agent for guide schedule lookup.

**Score: 2.5/10**

---

## Scenario 3: Bilingual Tourist Communication

### Roberto's Message
> "A tourist just messaged me: 'Hi Roberto! We're a family of 4 with kids ages 8 and 12. What jungle tour do you recommend? We're worried about safety.' Help me respond in English."

### Skill Activation
- **Primary:** `yaya-sales` — product recommendation in English
- **Secondary:** `yaya-crm` — log inquiry, capture contact

### MCP Tools Called
1. `appointments-mcp → list_services` — get family-friendly tour options
2. `crm-mcp → create_contact` — register the family
3. Agent drafts English response

### Ratings
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 7 | LLM can draft excellent English responses with tour details |
| Accuracy | 6 | Can recommend from service catalog, but needs tour-specific safety info |
| Speed | 8 | Quick text generation |
| Completeness | 6 | Good draft but lacks automated safety brief, packing list, liability waiver |
| Delight | 8 | Natural English response, warm tone matching Roberto's brand |
| Safety | 7 | Needs to include safety disclaimers for jungle activities with children |

### Gaps
- **Missing:** Tour-specific safety profiles (age restrictions, difficulty levels, required gear). Services in `appointments-mcp` have name/duration/price but no "minimum age", "difficulty level", or "safety notes" fields.
- **Missing:** Automated packing list generation per tour type.
- **Missing:** WhatsApp template messages in English for common tourist inquiries (could save Roberto time).
- **Positive:** The LLM's bilingual capability is a genuine strength here. It can draft professional English while Roberto speaks functional-but-imperfect English.

### Ideal Agent Response (what the LLM would draft for Roberto to send)
> Hi! 😊 Great to hear from your family!
> 
> For kids aged 8 and 12, I recommend our **2-Day Family Jungle Experience** — it's designed for families:
> 
> 🌿 Day 1: Monkey Island + Pilpintuwasi butterfly/animal rescue center (gentle hike, kids love it!)
> 🏡 Night: Heliconia Eco-Lodge (screened rooms, hot water, family suite)
> 🐦 Day 2: Birdwatching canoe ride + indigenous village visit
> 
> **Safety:** All tours include a certified bilingual guide, first aid kit, life vests for boat rides, and our lodge has a nurse on call. We've hosted 200+ families since 2008.
> 
> **Price:** $320 USD per person (kids under 12 get 20% off)
> Includes: transport, lodge, all meals, guide, activities
> 
> Would you like me to check availability for your dates?

**Score: 6.8/10**

---

## Scenario 4: Weather Disruption — Flooded Trail

### Roberto's Message
> [Photo of flooded trail] "El río creció y el trail al mirador está inundado. Tengo un grupo que sale mañana para el tour de 3 días. ¿Qué alternativa les ofrezco?"

### Skill Activation
- **Primary:** `yaya-appointments` — check itinerary and reschedule options
- **Secondary:** `yaya-sales` — present alternative activities
- **Tertiary:** Image analysis (Qwen3.5-27B) — assess flooding severity from photo

### Ratings
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 4 | Can suggest generic alternatives but has no itinerary/route knowledge |
| Accuracy | 3 | No route database, no weather integration, no river level data |
| Speed | 6 | Quick LLM response |
| Completeness | 2 | Cannot check alternative routes, doesn't know trail network |
| Delight | 4 | Can draft a message to tourists but can't actually solve the logistics |
| Safety | 6 | Should flag safety concerns for flooded areas |

### Gaps
- **CRITICAL: No itinerary/route management.** Tours have specific routes with waypoints, activities, and timing. The system has no concept of "tour itinerary" — just appointment slots.
- **CRITICAL: No weather integration.** No SENAMHI API integration, no river level monitoring, no automated weather alerts.
- **Missing:** Alternative activity database (what to do when Plan A is weathered out).
- **Missing:** Automated tourist notification when itinerary changes.
- **Positive:** Image analysis via Qwen3.5-27B could assess flooding severity from photo, but there's no action to take with the result.

**Score: 3.2/10**

---

## Scenario 5: Dynamic Route Update

### Roberto's Message
> "Mi guía Carlos me dice que la familia de monos araña se movió a otra zona del río. Actualiza la ruta del day trip para pasar por la nueva ubicación."

### Skill Activation
- **Primary:** None — no route/itinerary management skill exists

### Ratings
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 1 | No itinerary/route system |
| Accuracy | N/A | |
| Speed | N/A | |
| Completeness | 1 | Completely outside platform capability |
| Delight | 1 | |
| Safety | 5 | No risk, just can't help |

### Gaps
- **CRITICAL: No route/itinerary management system.** This is a core tourism operations need — the ability to define, modify, and communicate tour routes with waypoints, GPS coordinates, timing, and highlights.
- **Missing:** Wildlife tracking/logging system — Roberto's guides track wildlife sightings, which is a key differentiator for his tours.

**Score: 1.0/10**

---

## Scenario 6: Multi-Day Tour Pricing (USD)

### Roberto's Message
> "Cotiza un tour de 5 días para 8 personas — all inclusive. Incluye lodge, comidas, guía bilingüe, transporte fluvial. Precio en USD."

### Skill Activation
- **Primary:** `yaya-sales` — pricing and quotation
- **Secondary:** `yaya-appointments` → `list_services` for package pricing
- **Tertiary:** `forex-mcp` → `get_exchange_rate` (USD/PEN) — for cost calculation

### MCP Tools Called
1. `appointments-mcp → list_services` — find 5-day package
2. `forex-mcp → get_exchange_rate` (from: "USD", to: "PEN") — current rate
3. `forex-mcp → convert_amount` — convert costs

### Ratings
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 5 | Can pull service pricing and do forex conversion |
| Accuracy | 4 | Service pricing is flat (no per-person, per-day, group-size logic) |
| Speed | 7 | Quick calculations |
| Completeness | 3 | No cost breakdown (fuel, food, guide pay, lodge fee, boat), no margin calculation |
| Delight | 5 | Can output a price but not a professional quotation |
| Safety | 7 | Need to ensure forex rate is current |

### Gaps
- **CRITICAL: No cost-of-goods / margin calculator for services.** Roberto needs to know his costs (fuel: $X, food: $Y/person/day, guide: $Z/day, lodge: $W/night) to quote profitably. `yaya-inventory` is product-focused, not service-cost-focused.
- **Missing:** Group pricing tiers (8 people should get a different per-person rate than 2 people).
- **Missing:** Professional quotation/proposal generation (PDF or formatted document with terms, inclusions/exclusions, cancellation policy).
- **Missing:** `forex-mcp` exists and can convert, but there's no margin buffer for exchange rate volatility. Roberto needs to quote USD but pay PEN costs — if the rate moves 3% before the tour, he loses money.
- **Workaround:** `forex-mcp → calculate_landed_cost` is Peru-import-focused (customs, duties) — not applicable to services.

**Score: 4.0/10**

---

## Scenario 7: Partial Payment Registration (PayPal + Cash)

### Roberto's Message
> "The client from Germany sent me a PayPal payment of $450 but the tour costs $520. He says he'll pay the rest in cash when he arrives. Register the partial payment."

### Skill Activation
- **Primary:** `yaya-payments` — partial payment handling
- **Secondary:** `yaya-crm` — log interaction

### MCP Tools Called
1. `payments-mcp → match_payment` (amount: 450, method: "paypal") — match to pending order
2. `payments-mcp → confirm_payment` (order_id, amount: 450, partial: true) — record partial payment
3. `crm-mcp → log_interaction` — note partial payment and pending cash balance

### Ratings
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 6 | `yaya-payments` explicitly supports partial payments |
| Accuracy | 5 | Can record partial payment, but PayPal-specific matching is limited |
| Speed | 6 | Multi-step process |
| Completeness | 5 | Records the partial, but no PayPal API integration to verify the transaction |
| Delight | 6 | Can confirm and note the pending balance |
| Safety | 7 | Confirms details before recording |

### Gaps
- **Missing:** PayPal API integration. `yaya-payments` does OCR on Yape/Plin/bank screenshots but has no PayPal webhook or API lookup. Roberto would need to manually verify the PayPal receipt.
- **Missing:** Multi-currency payment tracking. The order might be in USD, but PayPal may show EUR (German client). Needs automatic forex conversion at time of payment.
- **Missing:** Split payment tracking across methods (PayPal deposit + cash balance = total). The system should track "paid $450 PayPal, owes $70 cash on arrival."
- **Missing:** Wire transfer tracking (scenario 23 — BCP arrival verification). No bank API integration.
- **Positive:** `payments-mcp` has `search_payment_by_amount` which could help match approximate amounts, and partial payment is a documented capability.

**Score: 5.5/10**

---

## Scenario 8: Cost Analysis

### Roberto's Message
> "Cuánto me sale operar el tour de 3 días si cuento todo: combustible del bote, comida, guía, cocinero, lodge? Necesito saber mi costo real para fijar precios."

### Skill Activation
- **Primary:** `yaya-analytics` — cost analysis
- **Secondary:** `yaya-inventory` — consumable costs (if tracked)

### Ratings
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 2 | No cost-of-service tracking in any MCP |
| Accuracy | 1 | No data to calculate from |
| Speed | N/A | |
| Completeness | 1 | Completely missing capability |
| Delight | 1 | |
| Safety | 5 | No risk |

### Gaps
- **CRITICAL: No service cost tracking.** ERPNext tracks product costs (COGS for items) but there's no equivalent for service operations. Roberto needs:
  - Fuel cost per trip (varies by distance/river conditions)
  - Food cost per person per day
  - Guide daily rate
  - Cook daily rate  
  - Lodge per-night fee (partner lodge, not owned)
  - Equipment depreciation
  - Boat maintenance allocation
- **CRITICAL: No profitability analysis per tour type.** This is scenario 18's prerequisite.

**Score: 1.5/10**

---

## Scenario 9: Low Season Promotion

### Roberto's Message
> "Quiero hacer una promo de temporada baja: 30% off en tours de 2+ días para enero-marzo. ¿Cuánto puedo bajar sin perder plata?"

### Skill Activation
- **Primary:** `yaya-analytics` — margin analysis
- **Secondary:** `yaya-notifications` — campaign distribution
- **Tertiary:** `forex-mcp` — cost conversion

### Ratings
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 3 | Can create a promo notification campaign but can't calculate breakeven |
| Accuracy | 2 | No cost data → can't determine minimum viable price |
| Speed | N/A | |
| Completeness | 3 | Can distribute promo (yaya-notifications is solid) but can't advise on pricing |
| Delight | 3 | |
| Safety | 6 | Risk of recommending unsustainable pricing without cost data |

### Gaps
- Same cost tracking gap as Scenario 8.
- **Missing:** Historical pricing analytics — what did Roberto charge last low season? What was occupancy?
- **Positive:** `yaya-notifications` could handle the promotional campaign to past clients (segment by country, past tours taken) once pricing is decided.

**Score: 3.0/10**

---

## Scenario 10: Boleta for Tourist Payment

### Roberto's Message
> "Hazme boleta para los gringos del tour de ayer: 2 personas, Jungle Explorer 3-Day Package, USD 780 total. Pagaron PayPal."

### Skill Activation
- **Primary:** `yaya-tax` — invoice generation
- **Secondary:** `invoicing-mcp` — create boleta

### MCP Tools Called
1. `invoicing-mcp → create_invoice` (document_type: "03" [boleta], items: [...], currency: "USD", amount: 780)
2. `forex-mcp → get_exchange_rate` (USD/PEN) — for SUNAT reporting in PEN

### Ratings
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 8 | Core invoicing capability, well-implemented |
| Accuracy | 7 | Boleta creation works, but USD-denominated boletas need specific SUNAT handling |
| Speed | 7 | API call to PSE provider |
| Completeness | 7 | Creates the boleta but needs to handle dual-currency display (USD price, PEN for SUNAT) |
| Delight | 8 | Clean, professional invoice |
| Safety | 8 | Validates before submitting |

### Gaps
- **Minor:** SUNAT requires USD invoices to also show the PEN equivalent at the official exchange rate (tipo de cambio SUNAT). Needs `forex-mcp` to fetch SUNAT's official rate, not market rate.
- **Minor:** "Consumidor final" handling — foreign tourists don't have DNI. Boleta can be issued to "consumidor final" but needs passport number option.
- **Positive:** This is one of the strongest scenarios. `invoicing-mcp` has comprehensive Peru SUNAT support with create_invoice, lookup_ruc, lookup_dni, and proper document types.

**Score: 7.5/10**

---

## Scenario 11: Factura for Travel Agency

### Roberto's Message
> "La agencia Peru Luxury Travel SAC necesita factura por 3 tours que les operé este mes. RUC 20567890123. Total S/8,400."

### Skill Activation
- **Primary:** `yaya-tax` — factura generation
- **Secondary:** `invoicing-mcp` — create factura with RUC validation

### MCP Tools Called
1. `invoicing-mcp → lookup_ruc` (ruc: "20567890123") — validate and get empresa data
2. `invoicing-mcp → create_invoice` (document_type: "01" [factura], customer: {...}, items: 3 tour line items, total: 8400)

### Ratings
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 9 | Core factura capability |
| Accuracy | 8 | RUC lookup validates empresa, correct document type |
| Speed | 7 | RUC lookup + invoice creation |
| Completeness | 8 | Proper factura with IGV breakdown |
| Delight | 8 | Professional, SUNAT-compliant |
| Safety | 9 | RUC validation prevents errors |

### Gaps
- **Minor:** Should auto-calculate and show agency commission impact (15-25% commission → net revenue to Roberto).
- **Minor:** Batch factura for multiple tours should show per-tour line items, not just a lump sum.
- **Positive:** Strongest capability area for Roberto. SUNAT compliance is solid.

**Score: 8.2/10**

---

## Scenario 12: English Receipt for Tourist's Insurance

### Roberto's Message
> "Un turista israelí quiere receipt para su seguro de viaje. Necesita que diga 'jungle expedition tour' en inglés con el monto en USD."

### Skill Activation
- **Primary:** `yaya-tax` / `invoicing-mcp` — invoice generation
- **Secondary:** LLM drafting for English formatting

### Ratings
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 5 | Can create a boleta but English-language receipts are not standard SUNAT format |
| Accuracy | 4 | SUNAT boletas are in Spanish by law; English "receipt" would be a custom document |
| Speed | 6 | |
| Completeness | 4 | No custom receipt/letter generation tool |
| Delight | 4 | |
| Safety | 6 | Must clarify that this is not a SUNAT document |

### Gaps
- **Missing:** Custom receipt/letter generation for insurance purposes. This is a common tourism need — travelers need English-language receipts for travel insurance claims.
- **Workaround:** LLM could draft a formatted text receipt, but there's no PDF generation or letterhead integration.
- **Missing:** Multi-language invoice support in `invoicing-mcp`.

**Score: 4.5/10**

---

## Scenario 13: Calendar View — 2-Week Bookings

### Roberto's Message
> "Muéstrame el calendario de bookings de las próximas 2 semanas. Necesito ver dónde tengo huecos para meter más tours."

### Skill Activation
- **Primary:** `yaya-appointments` — schedule overview

### MCP Tools Called
1. `appointments-mcp → list_appointments` (date_from: today, date_to: today+14, status: "booked")
2. `appointments-mcp → list_providers` — all guides
3. For each provider: `appointments-mcp → get_provider_schedule` (date_from, date_to)

### Ratings
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 6 | Can show guide schedules for 2 weeks |
| Accuracy | 5 | Shows appointments but not lodge/boat utilization |
| Speed | 5 | Multiple queries per provider |
| Completeness | 4 | Guide schedules only — no lodge occupancy, no boat allocation view |
| Delight | 5 | WhatsApp-formatted list is readable but not a visual calendar |
| Safety | 8 | Read-only |

### Gaps
- **Missing:** Unified calendar view combining: guide bookings + lodge occupancy + boat availability + maintenance blocks.
- **Missing:** "Gaps" analysis — the agent should identify open days where ALL resources (guide + lodge + boat) are available, not just guide-free days.
- **Positive:** `list_appointments` with date range filtering works. The data is there for guides; it's the resource layer that's missing.

**Score: 5.0/10**

---

## Scenario 14: Full Booking — Family Williams

### Roberto's Message
> "Reserva: familia Williams (4 personas), 3-day Jungle Lodge, llegada 22 julio, guía bilingüe obligatorio. Confirmar con depósito de 50%."

### Skill Activation
- **Primary:** `yaya-appointments` — multi-day booking
- **Secondary:** `yaya-payments` — deposit tracking
- **Tertiary:** `yaya-crm` — create contact, log booking
- **Quaternary:** `yaya-followup` — schedule deposit reminder

### MCP Tools Called
1. `appointments-mcp → list_services` — find "3-day Jungle Lodge" package
2. `appointments-mcp → list_providers` (specialties: "bilingual") — available bilingual guides
3. `appointments-mcp → get_available_slots` (service_id, date_from: "2026-07-22", date_to: "2026-07-24") — check availability
4. `appointments-mcp → book_appointment` — book (×3 days or single multi-day)
5. `crm-mcp → create_contact` (name: "Williams Family", phone: ...) — register
6. `payments-mcp → create_payment_reminder` — schedule 50% deposit follow-up

### Ratings
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 5 | Can book guide slots and track deposit, but multi-day booking is hacky |
| Accuracy | 4 | 3 separate day-appointments vs. 1 multi-day reservation creates data fragmentation |
| Speed | 5 | Multiple sequential bookings |
| Completeness | 4 | No 50% deposit calculation from package price, no booking confirmation email/message to client |
| Delight | 5 | |
| Safety | 7 | Confirms before booking |

### Gaps
- **CRITICAL: No multi-day reservation concept.** Would need to create 3 separate appointments — fragile, confusing, no unified booking reference.
- **Missing:** Deposit calculation (50% of package price) and deposit tracking as a booking state (not just a payment status).
- **Missing:** Booking confirmation message to the Williams family (in English, with packing list, meeting point, weather advisory).
- **Missing:** Group size handling — "4 personas" is metadata on the booking, but `book_appointment` has no `group_size` or `pax` field.

**Score: 4.5/10**

---

## Scenario 15: Overbooking Resolution

### Roberto's Message
> "Tengo overbooking el sábado — 3 grupos quieren day trip y solo tengo 2 botes operativos. ¿Puedo mover uno al domingo? ¿El cliente aceptará?"

### Skill Activation
- **Primary:** `yaya-appointments` — reschedule
- **Secondary:** `yaya-escalation` — client communication for schedule change

### Ratings
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 4 | Can reschedule an appointment, but no boat resource tracking |
| Accuracy | 3 | Doesn't know about boat constraints — it's a guide-only system |
| Speed | 5 | |
| Completeness | 3 | No resource capacity planning |
| Delight | 4 | Can draft a reschedule message to the client |
| Safety | 6 | Reschedule requires confirmation |

### Gaps
- **CRITICAL: No resource/asset capacity tracking.** Boats are physical assets with maintenance schedules, fuel needs, and capacity limits. The platform has no concept of this.
- **Missing:** Client willingness prediction — no data on client flexibility or preferences.
- **Workaround:** `reschedule_appointment` can move the booking, but Roberto has to manually determine WHICH group to move and handle the communication.

**Score: 3.5/10**

---

## Scenario 16: Maintenance Block

### Roberto's Message
> "Bloquea toda la semana del 15-21 agosto — mantenimiento de botes. No acepto bookings esa semana."

### Skill Activation
- **Primary:** `yaya-appointments` — block schedule

### MCP Tools Called
1. For each guide: `appointments-mcp → set_working_hours` or manual blocking — **NO BLOCK TOOL**

### Ratings
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 3 | No "block dates" tool in appointments-mcp |
| Accuracy | 2 | set_working_hours is per-day-of-week (recurring), not per-date-range |
| Speed | N/A | |
| Completeness | 2 | Can't block a specific week; would need to create dummy appointments |
| Delight | 2 | |
| Safety | 5 | |

### Gaps
- **CRITICAL: No date-range blocking.** `set_working_hours` sets recurring weekly schedules (e.g., "Monday 9-5"), not one-time blocks. There's no "block_dates" or "create_blackout" tool.
- **Workaround:** Could create "Maintenance" appointments for each provider for each day of the week, but it's 6 guides × 7 days = 42 fake appointments. Terrible UX.
- **Missing:** Business-wide closure concept (not per-provider, but "entire operation shut down for maintenance").

**Score: 2.5/10**

---

## Scenario 17: Lost Item Shipping (Karrio)

### Roberto's Message
> "La pareja francesa dejó su cámara en el lodge. Necesito enviarla a su hotel en Lima — JW Marriott Miraflores. ¿Cómo la mando desde Iquitos de forma segura?"

### Skill Activation
- **Primary:** `yaya-sales` or generic LLM — shipping advice
- **Secondary:** Karrio MCP — **exists as a service but unclear MCP integration**

### Ratings
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 4 | Karrio exists as a service but MCP tools aren't clearly defined |
| Accuracy | 3 | Iquitos → Lima shipping is real (Olva Courier, Serpost, DHL) but not in the system |
| Speed | N/A | |
| Completeness | 3 | LLM can advise on shipping options but can't create/track shipments |
| Delight | 4 | |
| Safety | 6 | Valuable item, needs tracking |

### Gaps
- **Missing:** Karrio MCP tools not fully implemented (the `packages/mcp/README.md` exists but no source code for tools).
- **Missing:** Iquitos-specific shipping carriers. Major couriers have limited Iquitos coverage.
- **Positive:** LLM knowledge of Peruvian courier services (Olva, Shalom, Serpost) can provide useful general advice.

**Score: 3.5/10**

---

## Scenario 18: Tour Profitability Analysis

### Roberto's Message
> "¿Cuál es mi tour más rentable? Compara day trips vs. 2-day vs. 3-day vs. 5-day. Incluye todos los costos."

### Skill Activation
- **Primary:** `yaya-analytics` — profitability reporting
- **Secondary:** `postgres-mcp` — cross-system aggregation

### Ratings
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 3 | Can pull revenue by service type, but no cost data |
| Accuracy | 2 | Revenue-only analysis is misleading without costs |
| Speed | 5 | |
| Completeness | 2 | Revenue comparison possible, profitability comparison impossible |
| Delight | 3 | |
| Safety | 5 | Risk of bad business decisions based on incomplete data |

### Gaps
- Same cost-tracking gap as scenarios 8-9.
- **Missing:** Per-tour-type cost allocation (day trips have lower fuel but higher per-tourist cost, multi-day have fixed lodge costs that amortize over more days).
- **Positive:** If cost data were entered, `postgres-mcp → execute_sql` could generate sophisticated profitability reports with SQL aggregations.

**Score: 2.5/10**

---

## Scenario 19: Seasonal Dashboard

### Roberto's Message
> "Dame el dashboard de temporada: comparar mayo-octubre vs. noviembre-abril. Revenue, número de tours, ocupación, ticket promedio."

### Skill Activation
- **Primary:** `yaya-analytics` — seasonal comparison
- **Secondary:** `postgres-mcp` — aggregation queries

### MCP Tools Called
1. `postgres-mcp → execute_sql` — revenue by month/season
2. `postgres-mcp → execute_sql` — tour count by month
3. `postgres-mcp → execute_sql` — average ticket by season

### Ratings
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 5 | Can query appointment/payment data if schema is populated |
| Accuracy | 4 | Revenue and count are queryable; "occupancy" requires lodge capacity data that doesn't exist |
| Speed | 6 | SQL aggregation queries |
| Completeness | 4 | Revenue + count + avg ticket = yes; occupancy = no; client origin = no |
| Delight | 5 | WhatsApp-formatted seasonal comparison |
| Safety | 7 | Read-only |

### Gaps
- **Missing:** Lodge occupancy rate (requires lodge capacity data).
- **Missing:** Year-over-year comparison (needs 2+ years of data).
- **Positive:** `postgres-mcp` with `execute_sql` is flexible enough to build custom seasonal reports if the data exists in the database.
- **Positive:** `yaya-analytics` skill has excellent WhatsApp formatting guidelines.

**Score: 4.5/10**

---

## Scenario 20: Client Origin Analytics

### Roberto's Message
> "¿De dónde vienen mis clientes? Necesito saber por país para enfocar mi marketing — ¿más gringos, europeos, o latinos?"

### Skill Activation
- **Primary:** `yaya-analytics` + `yaya-crm` — client segmentation by origin
- **Secondary:** `postgres-mcp` — aggregation

### Ratings
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 4 | Depends on whether country is captured in CRM contacts |
| Accuracy | 3 | Phone country codes could indicate origin, but not reliably |
| Speed | 5 | |
| Completeness | 3 | CRM auto-capture doesn't explicitly extract country of origin |
| Delight | 4 | |
| Safety | 7 | |

### Gaps
- **Missing:** Country/nationality field in CRM contact creation. `crm-mcp → create_contact` has name, phone, email, source — no "country" or "nationality" field.
- **Workaround:** Phone number country codes (+1 USA, +49 Germany, +972 Israel) could be parsed, but multi-country WhatsApp numbers make this unreliable.
- **Missing:** Integration with booking source (TripAdvisor, direct WhatsApp, agency referral) for marketing attribution.

**Score: 3.5/10**

---

## Scenario 21: Cancellation Report

### Roberto's Message
> "¿Cuántas cancelaciones tuve este trimestre y cuánto perdí en refunds?"

### Skill Activation
- **Primary:** `yaya-analytics` — cancellation reporting
- **Secondary:** `appointments-mcp → list_appointments` (status: "cancelled")
- **Tertiary:** `payments-mcp → get_payment_history` or `process_refund` history

### Ratings
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 6 | Can count cancelled appointments and sum refunds |
| Accuracy | 5 | Appointment cancellations tracked; refund amounts tracked in payments-mcp |
| Speed | 6 | SQL aggregation |
| Completeness | 5 | Count + amount yes; reason breakdown (weather vs no-show vs client cancel) partially available |
| Delight | 6 | |
| Safety | 7 | |

### Gaps
- **Missing:** Net revenue impact calculation (gross bookings - refunds - opportunity cost of blocked dates).
- **Positive:** `appointments-mcp` stores `cancellation_reason` and `cancelled_at`, enabling reason-based analysis.
- **Positive:** `payments-mcp → process_refund` creates audit trail for refund amounts.

**Score: 5.5/10**

---

## Scenario 22: PayPal Reconciliation

### Roberto's Message
> "Cuadra PayPal con las reservas de este mes. Me muestra balance de $3,200 pero tengo registradas reservas por $4,100. Faltan deposits."

### Skill Activation
- **Primary:** `yaya-payments` — reconciliation
- **Secondary:** `payments-mcp` — payment history and matching

### MCP Tools Called
1. `payments-mcp → get_daily_collection_summary` — total collected by method
2. `payments-mcp → list_pending_payments` — find unpaid bookings
3. `payments-mcp → search_payment_by_amount` — match specific amounts

### Ratings
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 4 | Can list pending payments and totals, but no PayPal API integration |
| Accuracy | 3 | One-sided reconciliation — can see internal records but can't pull PayPal transactions |
| Speed | 5 | |
| Completeness | 3 | Shows "what we expect" but can't show "what PayPal actually received" |
| Delight | 3 | |
| Safety | 6 | Financial reconciliation needs accuracy |

### Gaps
- **CRITICAL: No PayPal API integration.** True reconciliation requires pulling PayPal transaction history and matching against internal records. Currently one-sided.
- **Missing:** Wire transfer verification (bank API integration for BCP).
- **Missing:** Cash payment tracking (USD cash received on arrival — manual entry system needed).
- **Missing:** Multi-currency reconciliation (PayPal may receive USD/EUR/GBP, all need to reconcile against USD-denominated bookings).

**Score: 3.5/10**

---

## Scenario 23: Wire Transfer Verification

### Roberto's Message
> "El depósito del grupo de americanos — $1,560 wire transfer — debería haber llegado a BCP el lunes. ¿Cayó o no?"

### Skill Activation
- **Primary:** `yaya-payments` — payment verification

### Ratings
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 2 | No bank API integration |
| Accuracy | 1 | Can't check BCP balance or transactions |
| Speed | N/A | |
| Completeness | 1 | Completely unable to verify wire arrivals |
| Delight | 1 | |
| Safety | 5 | |

### Gaps
- **CRITICAL: No bank API integration.** BCP (Banco de Crédito del Perú) has APIs for corporate accounts, but they're not integrated.
- **Workaround:** Roberto checks BCP manually and tells the agent to record the payment.

**Score: 1.5/10**

---

## Scenario 24: Accounts Receivable Overview

### Roberto's Message
> "Quiero ver todas las cuentas por cobrar: depósitos pendientes, saldos por pagar al llegar, y agencias que me deben comisiones."

### Skill Activation
- **Primary:** `yaya-payments` — pending payments
- **Secondary:** `yaya-analytics` — receivables report

### MCP Tools Called
1. `payments-mcp → list_pending_payments` — deposits pending
2. `erpnext-mcp → list_customers` + outstanding balances — **limited tool**

### Ratings
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 4 | Can list pending payments from payments-mcp |
| Accuracy | 3 | Pending deposits yes; on-arrival cash balances maybe; agency commissions no |
| Speed | 5 | |
| Completeness | 3 | No agency commission tracking system |
| Delight | 3 | |
| Safety | 6 | |

### Gaps
- **CRITICAL: No commission tracking.** Agencies take 15-25% commission. There's no system to track: which tours were agency-referred, what commission rate applies, what's owed, what's been paid.
- **Missing:** "Balance on arrival" tracking — deposits received vs. total owed, with currency conversion for the cash portion.
- **Workaround:** `payments-mcp → list_pending_payments` shows what's unpaid, but can't distinguish between "tourist pending deposit" and "agency owes commission."

**Score: 3.0/10**

---

## Scenario 25: Weather Cancellation with Refund Decision

### Roberto's Message
> "Cancela el tour de mañana — el SENAMHI emitió alerta roja por lluvias. Son 4 turistas que pagaron USD 1,200 total. ¿Les devuelvo todo o les ofrezco reprogramar?"

### Skill Activation
- **Primary:** `yaya-appointments` — cancel bookings
- **Secondary:** `yaya-returns` — refund processing
- **Tertiary:** `yaya-payments` — refund execution

### MCP Tools Called
1. `appointments-mcp → cancel_appointment` (force: true, reason: "SENAMHI red alert - weather")
2. Decision support from LLM on refund vs. reschedule
3. If refund: `payments-mcp → process_refund` (order_id, amount: 1200)
4. If reschedule: `appointments-mcp → reschedule_appointment`

### Ratings
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 6 | Can cancel and process refund, with LLM advising on policy |
| Accuracy | 5 | Cancellation works; refund processing works; weather policy enforcement is manual |
| Speed | 5 | Multiple steps |
| Completeness | 5 | Cancellation + refund OR reschedule works, but no weather-specific policy engine |
| Delight | 6 | LLM can draft empathetic English message to tourists |
| Safety | 7 | Force-cancel with documented reason; refund requires confirmation |

### Gaps
- **Missing:** Weather cancellation policy engine (force majeure = full refund vs. client-initiated = partial refund vs. reschedule with credit).
- **Missing:** SENAMHI API integration for automated weather alerts.
- **Missing:** Batch cancellation — 4 tourists might be in different appointment records (or one group booking that doesn't exist as a concept).
- **Positive:** `cancel_appointment` supports `force: true` with reason logging, which is appropriate for weather cancellations.
- **Positive:** `yaya-returns` has good refund processing flow with owner approval for amounts > S/200.

**Score: 5.5/10**

---

## Scenario 26: No-Show Group

### Roberto's Message
> [Voice note, frustrated] "Causa estoy en el lodge y el grupo de brasileños no apareció. Les escribo y no contestan. Pagaron solo 30% de deposit. ¿Cómo lo registro?"

### Skill Activation
- **Primary:** `yaya-appointments` — mark as no-show
- **Secondary:** `yaya-payments` — handle partial deposit (no-show policy)
- **Tertiary:** `yaya-crm` — log no-show, flag customer

### MCP Tools Called
1. `appointments-mcp → get_appointment` — find the booking
2. Manual status update to "no_show" — `appointments-mcp` supports this status
3. `crm-mcp → update_contact` — flag as no-show
4. `payments-mcp` — record deposit as retained (per no-show policy)

### Ratings
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 6 | Can mark no-show and log it |
| Accuracy | 5 | No-show status exists in schema; deposit retention logic is manual |
| Speed | 5 | |
| Completeness | 5 | No-show tracking works; deposit retention policy needs manual decision |
| Delight | 5 | Can empathize and advise on policy |
| Safety | 7 | Documents the no-show properly |

### Gaps
- **Missing:** No-show policy engine (30% deposit retained? Full deposit retained? Configurable per booking type?).
- **Missing:** `list_no_shows` exists and tracks repeat offenders — this is a strength.
- **Positive:** Appointment status "no_show" is a first-class status in the schema. `list_no_shows` tool aggregates by customer, showing repeat no-show patterns.

**Score: 5.5/10**

---

## Scenario 27: Medical Emergency Escalation

### Roberto's Message
> "Un turista se torció el tobillo en el trail. Ya lo estamos evacuando a Iquitos. Necesito: activar el seguro, contactar a su embajada (es suizo), y documentar todo para el reporte."

### Skill Activation
- **Primary:** `yaya-escalation` — critical escalation
- **Secondary:** `yaya-crm` — document incident

### Ratings
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 4 | Can document and escalate, but no insurance/embassy integration |
| Accuracy | 3 | No insurance API, no embassy contact database |
| Speed | 5 | |
| Completeness | 3 | Documentation yes; insurance activation no; embassy contact no |
| Delight | 4 | Can draft incident report template |
| Safety | 8 | `yaya-escalation` correctly identifies this as critical |

### Gaps
- **CRITICAL: No insurance integration.** Tour operator insurance activation requires specific provider APIs or phone numbers.
- **Missing:** Embassy contact database (Swiss embassy in Lima: address, phone, emergency number).
- **Missing:** Incident report template for tourism operations (DIRCETUR reporting requirements).
- **Missing:** Medical evacuation protocol documentation/checklist.
- **Positive:** `yaya-escalation` would correctly flag this as highest priority and log all details.

**Score: 3.5/10**

---

## Scenario 28: Negative Review Response

### Roberto's Message
> "Me dejaron una review de 1 estrella en TripAdvisor diciendo que el lodge estaba sucio. ¡¡¡ES MENTIRA!!! 😡 Ayúdame a responder profesionalmente."

### Skill Activation
- **Primary:** LLM drafting — professional review response
- **Secondary:** `yaya-crm` — look up the reviewer's booking history

### Ratings
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 7 | LLM excels at drafting professional responses to negative reviews |
| Accuracy | 6 | Can look up booking history for context if the reviewer is identifiable |
| Speed | 7 | Quick text generation |
| Completeness | 6 | Great draft, but can't post to TripAdvisor automatically |
| Delight | 8 | Turns Roberto's frustration into a professional response |
| Safety | 8 | Prevents Roberto from posting an angry response |

### Gaps
- **Missing:** TripAdvisor/Google Reviews API integration for monitoring and responding.
- **Missing:** Review monitoring cron — Roberto can't check reviews from the jungle.
- **Positive:** This is a genuine LLM strength. The agent can:
  1. Acknowledge Roberto's frustration
  2. Look up the reviewer's actual booking details
  3. Draft a professional, empathetic public response
  4. Suggest private follow-up with the reviewer

**Score: 7.0/10**

---

## Scenario 29: Guide Illness — Emergency Staffing

### Roberto's Message
> "Dos guías se enfermaron con dengue 😢. Tengo tours programados toda la semana. ¿Contrato temporales o cancelo algunos tours?"

### Skill Activation
- **Primary:** `yaya-appointments` — schedule analysis
- **Secondary:** `yaya-escalation` — business-critical situation

### MCP Tools Called
1. `appointments-mcp → list_appointments` (date_from: today, date_to: today+7, status: "booked") — all upcoming tours
2. `appointments-mcp → list_providers` — remaining active guides
3. Analysis of which tours can be covered by remaining guides

### Ratings
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 5 | Can show schedule and remaining guide capacity |
| Accuracy | 5 | Can identify coverage gaps |
| Speed | 5 | |
| Completeness | 4 | Shows the problem but can't solve it (no temp guide database, no automated reassignment) |
| Delight | 5 | Can present options (cancel vs. reassign vs. temp hire) |
| Safety | 7 | Flags skill mismatches (bilingual tours need bilingual guides) |

### Gaps
- **Missing:** Guide skill-to-tour matching engine (bilingual tours can only be covered by bilingual guides; ayahuasca tours need certified guides).
- **Missing:** Temporary guide/freelancer database.
- **Missing:** Automated client notification when guide changes.
- **Positive:** `list_providers` includes `specialties` array, which enables skill matching logic (even if the automated matching doesn't exist).

**Score: 4.5/10**

---

## Scenario 30: Ayahuasca Waiver Document

### Roberto's Message
> "Un grupo quiere hacer ceremonia de ayahuasca como parte del tour. Necesito el waiver legal en inglés y español. ¿Qué debe incluir?"

### Skill Activation
- **Primary:** LLM drafting — legal document template

### Ratings
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 6 | LLM can draft a comprehensive waiver template |
| Accuracy | 5 | Legal advice disclaimer needed; LLM knows common waiver components |
| Speed | 7 | |
| Completeness | 5 | Good starting template but needs legal review |
| Delight | 6 | Bilingual draft is valuable |
| Safety | 4 | Legal liability — must add strong disclaimer |

### Gaps
- **Missing:** Legal document template library for tourism operations (waivers, safety briefings, medical questionnaires).
- **Missing:** Digital signature collection (waiver signed on tablet/phone).
- **Positive:** LLM can produce a solid bilingual waiver covering: health disclaimers, informed consent, assumption of risk, emergency contacts, medical conditions declaration.
- **SAFETY NOTE:** Agent must clearly state this is a draft requiring legal review by a Peruvian attorney.

**Score: 5.5/10**

---

## Scenario 31: Bitcoin Payment

### Roberto's Message
> "A tourist wants to pay in Bitcoin. Can I accept it? How do I convert it to soles?"

### Skill Activation
- **Primary:** LLM advisory — cryptocurrency guidance
- **Secondary:** `forex-mcp` — conversion rates (doesn't support crypto)

### Ratings
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 4 | LLM can advise on options but can't process crypto payments |
| Accuracy | 5 | General crypto advice is accurate |
| Speed | 7 | |
| Completeness | 3 | Advisory only, no integration |
| Delight | 4 | |
| Safety | 6 | Should warn about volatility and Peruvian crypto regulations |

### Gaps
- **Missing:** Crypto payment processing (BTCPay Server integration, Binance Pay, etc.).
- **Missing:** `forex-mcp` doesn't support crypto pairs (BTC/USD, BTC/PEN).
- **Positive:** LLM can advise on practical options (Binance P2P, local crypto exchanges like Buda.com).

**Score: 4.0/10**

---

## Summary: Scores by Category

### Core Business Operations (Scenarios 1-5)
| Scenario | Score | Key Issue |
|----------|-------|-----------|
| 1. Lodge/Guide Availability | 4.5 | No lodge/resource management |
| 2. Multi-Group Logistics | 2.5 | No multi-resource scheduling |
| 3. Bilingual Communication | 6.8 | LLM strength, minor gaps |
| 4. Weather Disruption | 3.2 | No itinerary/weather system |
| 5. Dynamic Route Update | 1.0 | No route management at all |
| **Category Average** | **3.6** | |

### Pricing & Payments (Scenarios 6-9)
| Scenario | Score | Key Issue |
|----------|-------|-----------|
| 6. Multi-Day USD Pricing | 4.0 | No cost tracking, basic pricing model |
| 7. Partial PayPal Payment | 5.5 | Works partially, no PayPal API |
| 8. Cost Analysis | 1.5 | No service cost tracking |
| 9. Low Season Promo | 3.0 | Can't calculate breakeven |
| **Category Average** | **3.5** | |

### Invoicing / SUNAT (Scenarios 10-12)
| Scenario | Score | Key Issue |
|----------|-------|-----------|
| 10. Boleta (USD) | 7.5 | Strong — minor forex handling gap |
| 11. Factura (Agency) | 8.2 | Strongest scenario |
| 12. English Receipt | 4.5 | No custom document generation |
| **Category Average** | **6.7** | |

### Booking & Scheduling (Scenarios 13-16)
| Scenario | Score | Key Issue |
|----------|-------|-----------|
| 13. Calendar View | 5.0 | Guide-only, no resource view |
| 14. Full Booking | 4.5 | Multi-day booking is hacky |
| 15. Overbooking | 3.5 | No resource capacity tracking |
| 16. Maintenance Block | 2.5 | No date-range blocking |
| **Category Average** | **3.9** | |

### Shipping / Logistics (Scenario 17)
| Scenario | Score | Key Issue |
|----------|-------|-----------|
| 17. Lost Item Shipping | 3.5 | Karrio MCP incomplete |
| **Category Average** | **3.5** | |

### Analytics (Scenarios 18-21)
| Scenario | Score | Key Issue |
|----------|-------|-----------|
| 18. Tour Profitability | 2.5 | No cost data for margin analysis |
| 19. Seasonal Dashboard | 4.5 | Revenue yes, occupancy no |
| 20. Client Origin | 3.5 | No country field in CRM |
| 21. Cancellation Report | 5.5 | Works with existing data |
| **Category Average** | **4.0** | |

### Payment Reconciliation (Scenarios 22-24)
| Scenario | Score | Key Issue |
|----------|-------|-----------|
| 22. PayPal Reconciliation | 3.5 | No PayPal API |
| 23. Wire Transfer Check | 1.5 | No bank API |
| 24. Accounts Receivable | 3.0 | No commission tracking |
| **Category Average** | **2.7** | |

### Cancellations & Weather (Scenarios 25-26)
| Scenario | Score | Key Issue |
|----------|-------|-----------|
| 25. Weather Cancellation | 5.5 | Cancellation works, policy engine missing |
| 26. No-Show Group | 5.5 | No-show tracking works well |
| **Category Average** | **5.5** | |

### Escalation Triggers (Scenarios 27-28)
| Scenario | Score | Key Issue |
|----------|-------|-----------|
| 27. Medical Emergency | 3.5 | No insurance/embassy integration |
| 28. Negative Review | 7.0 | LLM strength |
| **Category Average** | **5.3** | |

### Edge Cases (Scenarios 29-31)
| Scenario | Score | Key Issue |
|----------|-------|-----------|
| 29. Guide Illness | 4.5 | Schedule analysis works, no auto-reassignment |
| 30. Ayahuasca Waiver | 5.5 | LLM can draft, needs legal review |
| 31. Bitcoin Payment | 4.0 | Advisory only |
| **Category Average** | **4.7** | |

---

## Overall Rating: 4.2/10

### What Works
1. **SUNAT Invoicing (6.7/10)** — Best category. `invoicing-mcp` with Peru-specific tools (RUC lookup, boleta/factura, IGV calculation) is solid.
2. **Bilingual LLM Communication (6.8-7.0)** — The LLM's ability to draft professional English responses, review replies, and bilingual documents is a genuine differentiator for Roberto.
3. **Cancellation/No-Show Tracking (5.5)** — `appointments-mcp` has proper status tracking, cancellation reasons, and no-show aggregation.
4. **Forex Conversion** — `forex-mcp` provides real-time USD/PEN rates, useful for pricing.
5. **Escalation Framework** — `yaya-escalation` has sophisticated frustration detection and handoff protocols.

### What's Missing (Critical Gaps for Tourism)

1. **Multi-Day Reservation System** — The #1 gap. Tourism needs reservations (multi-day, multi-resource), not appointments (single time slots). Requires a new `reservations-mcp` or major extension of `appointments-mcp`.

2. **Resource/Asset Management** — Lodges, boats, vehicles, and equipment are physical assets with capacity, availability, and maintenance schedules. No system tracks these.

3. **Tour Itinerary Engine** — Routes, waypoints, activities, timing, and alternatives. Core to tour operations, completely absent.

4. **Service Cost Tracking** — Unlike retail (known COGS per product), services have variable costs (fuel, food/person/day, guide rates). No cost allocation system exists.

5. **PayPal/Wire/Bank API Integration** — Roberto receives 50% of payments via PayPal and wire transfer. One-sided reconciliation is useless.

6. **Commission Management** — Travel agency commissions (15-25%) are a major revenue factor. No tracking system.

7. **Weather/Environmental Integration** — SENAMHI alerts, river levels, and trail conditions drive daily operational decisions. No automated monitoring.

8. **Date-Range Schedule Blocking** — Can't block a week for maintenance; `set_working_hours` is recurring-only.

9. **Group Size / PAX Tracking** — No `group_size` field in bookings. A "tour for 8 people" looks the same as "tour for 2 people."

10. **Offline Operations Support** — Roberto is offline 2-4 days at a time. No queued operations, no offline-first design, no delegation to office staff with different permissions.

### Recommendations

1. **Build `reservations-mcp`** — Multi-day, multi-resource booking system. Links guides + lodges + boats + cook to a single reservation with group size, deposit status, and itinerary reference.

2. **Extend `appointments-mcp` with `block_dates`** — Simple tool: block a date range for a provider (or all providers) with a reason.

3. **Add `country` field to CRM contacts** — Parse from phone number country code or ask during booking. Critical for tourism marketing analytics.

4. **Integrate PayPal REST API** — At minimum, transaction listing and search for reconciliation. Critical for Roberto's cash flow visibility.

5. **Build service cost templates** — Per-tour-type cost structures (fuel, food/pax/day, guide/day, lodge/night) enabling profitability analysis.

6. **Add `group_size` / `pax` to appointments or reservations** — Essential for pricing, provision planning, and capacity management.

7. **Weather API cron** — SENAMHI or Open-Meteo integration for automated severe weather alerts relevant to scheduled tours.

8. **Commission tracking module** — Agency relationships with configurable commission rates, payable tracking, and net revenue calculation.
