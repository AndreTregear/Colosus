# Test Results: Don Pepe — Panadería y Pastelería
## Persona: José "Pepe" Quispe Mamani, 52yo, Villa El Salvador, Lima
## Scenarios 1-15 (Cake Orders, Pricing, Payments, Delivery) + Scenario 23 (Allergen Safety)

**Tester:** Subagent (roleplay as Don Pepe & customers)
**Date:** 2026-03-20
**Platform version:** Yaya Platform (pre-launch)
**Test type:** Dry-run simulation against skill definitions + MCP tool capabilities

---

## Rating Dimensions (0-10 each)

| Dim | Name | What it measures |
|-----|------|-----------------|
| D1 | **Comprehension** | Can the agent understand the input? (typos, slang, voice notes, implicit context) |
| D2 | **Tool Coverage** | Do the right MCP tools/skills exist to fulfill the request? |
| D3 | **Flow Completeness** | Is the end-to-end flow designed to handle this case? |
| D4 | **Cultural Fit** | Is the response tone/format appropriate for informal Peruvian bakery context? |
| D5 | **Safety** | Does the flow protect against errors, data loss, or harm? |
| D6 | **Low-Tech Friendliness** | Can Don Pepe (one-finger typer, phone-only, WhatsApp-only) actually use this? |

---

## Scenario 1: Custom Cake Order — Birthday

**Input (customer via WhatsApp):**
> "Hola Don Pepe! Quiero una torta de chocolate para el cumple de mi hijita, para 30 personas, para el sábado"

**Skills triggered:** `yaya-sales` (product inquiry + order creation), `yaya-inventory` (stock check on ingredients), `yaya-crm` (auto-create/lookup contact)

**MCP tools needed:**
- `erpnext-mcp → search_products` (find "torta chocolate 30 personas" or equivalent)
- `erpnext-mcp → check_stock` (verify chocolate, flour, eggs, etc.)
- `erpnext-mcp → create_order` (create cake order with delivery date = Saturday)
- `crm-mcp → search_contacts / create_contact` (register the customer)
- `crm-mcp → log_interaction`

**Expected agent flow:**
1. Greet warmly, confirm details: flavor (chocolate), size (30 pax), date (sábado)
2. Quote price from catalog
3. Ask about design/decoration ("¿algún diseño especial? ¿nombre de la cumpleañera?")
4. Confirm delivery vs pickup
5. Create order in ERPNext
6. Provide payment instructions (Yape / BCP)

**Roleplay test — customer message variations:**
- `"kiero torta d choco pa sabado pa 30"` — heavy abbreviation
- `"torta cumpleaños mi hija sabado 30 personas chocolate"` — telegram style
- `[Voice note: 12 sec, background bakery noise, fast limeño Spanish]` — voice

**Ratings:**

| D1 | D2 | D3 | D4 | D5 | D6 |
|----|----|----|----|----|---|
| 7 | 7 | 7 | 8 | 6 | 7 |

**Gaps identified:**
- ⚠️ **PRODUCT CATALOG GAP:** ERPNext `search_products` is designed for retail SKUs (Air Max, Havaianas). A bakery's products are custom — "torta de chocolate para 30 personas" is not a fixed SKU. The agent would need a **configurable cake pricing formula** (e.g., base price per kilo + per-tier surcharge + decoration surcharge). No skill or tool currently supports formula-based pricing.
- ⚠️ **DECORATION/CUSTOMIZATION GAP:** No field in `create_order` for cake customization notes (design, message on cake, number of tiers, fondant vs buttercream). The `notes` field exists but is generic.
- ⚠️ **VOICE NOTE HANDLING:** `yaya-sales` mentions Whisper transcription, but no skill explicitly handles **background bakery noise** (mixers, ovens, street noise in Villa El Salvador). Transcription accuracy for informal Peruvian Spanish + noise is untested.
- ⚠️ **DATE INTERPRETATION:** "para el sábado" — the agent needs to resolve this to the NEXT Saturday. No explicit date-parsing logic documented for relative days in Spanish ("este sábado" vs "el otro sábado").
- ✅ Cultural fit is decent — `yaya-sales` says "be warm, culturally appropriate for Peru/LATAM."

---

## Scenario 2: Wedding Cake Quote — 3 Tiers

**Input (customer):**
> "Cuánto cuesta una torta de 3 pisos para matrimonio? Quiero de vainilla con manjar"

**Skills triggered:** `yaya-sales` (pricing inquiry), `yaya-inventory` (price lookup)

**MCP tools needed:**
- `erpnext-mcp → search_products` or `get_item_price` (tiered cake pricing)
- `erpnext-mcp → create_quotation` (formal quote for high-value item)

**Roleplay — variations:**
- `"cuanto la torta 3 pisos matrimonio vainilla manjarblanco"` — no punctuation
- `"torta pa mi matri cuanto sale 3 pisos?"` — slang "matri" for matrimonio

**Ratings:**

| D1 | D2 | D3 | D4 | D5 | D6 |
|----|----|----|----|----|---|
| 7 | 5 | 5 | 7 | 5 | 7 |

**Gaps identified:**
- 🔴 **CRITICAL: No tiered-cake pricing model.** A 3-tier wedding cake is NOT the same as 3x a 1-tier cake. Pricing depends on: tier sizes (e.g., 8"+10"+12"), filling type (manjar costs more), decoration complexity (fondant vs. buttercream), delivery (large cakes need special transport). ERPNext `get_item_price` returns a flat price per item. This needs a **quote builder** or at minimum a pricing matrix.
- 🔴 **QUOTATION TOOL EXISTS but flow is missing.** `erpnext-mcp → create_quotation` exists but `yaya-sales` skill doesn't describe a quoting flow for custom/complex products. The skill examples are all simple retail lookups.
- ⚠️ **"Manjar" ambiguity:** "Manjar" in Peru = manjarblanco/dulce de leche. Agent must understand regional terms. Not a tool issue — an LLM comprehension issue.
- ⚠️ **HIGH-VALUE ORDER:** A 3-tier wedding cake could be S/500-2000+. This likely exceeds `ESCALATION_THRESHOLD`. The `yaya-escalation` skill should route to Don Pepe (the owner) for final quote approval, but it's unclear if the agent knows Pepe IS the owner (not just a customer).

---

## Scenario 3: Order Modification — Chocolate → Tres Leches

**Input (customer):**
> "Don Pepe ya no quiero la torta de chocolate, cámbiamela a tres leches por favor"

**Skills triggered:** `yaya-sales` (order modification), `yaya-inventory` (ingredient check for tres leches)

**MCP tools needed:**
- `erpnext-mcp → list_orders` (find customer's recent cake order)
- `erpnext-mcp → update_order` (change item from chocolate to tres leches)
- `erpnext-mcp → check_stock` (verify tres leches ingredients available)

**Roleplay — variations:**
- `"ya no chocolate cambia a 3leches"` — terse, no greeting
- `"pepeeee cambiame la tortaaaa, tres leches mejor"` — informal, elongated vowels

**Ratings:**

| D1 | D2 | D3 | D4 | D5 | D6 |
|----|----|----|----|----|---|
| 6 | 7 | 6 | 7 | 6 | 7 |

**Gaps identified:**
- ⚠️ **ORDER LOOKUP BY CONTEXT:** Customer doesn't give an order number. The agent needs to infer which order they mean by looking up recent orders from this phone number. `list_orders` supports `customer` filter but requires knowing the customer name, not phone number. Need: phone-to-customer resolution chain (CRM lookup → customer name → ERPNext orders).
- ⚠️ **TIMING SAFETY:** If Pepe already started baking the chocolate cake, changing to tres leches wastes ingredients. No skill checks "is this order already in production?" — ERPNext order states (Draft/Submitted/In Production) exist but no skill documents this check.
- ⚠️ **PRICE DIFFERENCE:** Tres leches might cost differently than chocolate. Agent should recalculate and inform customer of any price change. Not in the flow.
- ✅ `update_order` tool exists and can replace items.

---

## Scenario 4: Customer Can't Remember Their Order

**Input (customer):**
> "Oye me puedes confirmar mi pedido? Creo que pedí una torta pero no me acuerdo de qué sabor"

**Skills triggered:** `yaya-sales` (order lookup), `yaya-crm` (customer context)

**MCP tools needed:**
- `crm-mcp → search_contacts` (lookup by phone number)
- `erpnext-mcp → list_orders` (find their pending orders)
- `erpnext-mcp → get_order` (details)

**Roleplay — variations:**
- `"pedí una torta y no me acuerdo d nada jaja"` — self-aware confusion
- `"mi pedido???"` — minimal effort message

**Ratings:**

| D1 | D2 | D3 | D4 | D5 | D6 |
|----|----|----|----|----|---|
| 7 | 7 | 7 | 8 | 7 | 9 |

**Gaps identified:**
- ✅ This flow works well IF the agent correctly maps WhatsApp number → CRM contact → ERPNext customer → pending orders.
- ⚠️ **PHONE-TO-ORDER CHAIN:** This is the most critical lookup chain for Don Pepe's business and it must be seamless. Currently requires 3 MCP hops. Could be slow.
- ⚠️ **MULTIPLE PENDING ORDERS:** If the customer has multiple pending orders, agent should list all of them clearly.
- ✅ Low-tech friendly — customer just needs to ask, agent does the work.

---

## Scenario 5: Rush Order — Cake for Tomorrow

**Input (customer):**
> "Necesito una torta para MAÑANA, 20 personas, lo que sea. Puedes?"

**Skills triggered:** `yaya-sales` (urgent order), `yaya-inventory` (ingredient availability), `yaya-appointments` (scheduling/capacity check)

**MCP tools needed:**
- `erpnext-mcp → check_stock` (are ingredients available for a cake NOW?)
- `erpnext-mcp → create_order` (rush order)

**Roleplay — variations:**
- `"NECESITO TORTA MAÑANA URGENTE"` — all caps urgency
- `"pepe hermano puedes una torta pa mñn? 20 pers"` — informal + typo

**Ratings:**

| D1 | D2 | D3 | D4 | D5 | D6 |
|----|----|----|----|----|---|
| 7 | 5 | 4 | 7 | 5 | 8 |

**Gaps identified:**
- 🔴 **CRITICAL: No capacity/scheduling awareness.** Don Pepe already has 2-5 custom cakes per day. The agent has NO WAY to check if Pepe has capacity for another cake tomorrow. `yaya-appointments` is designed for service businesses (salons, clinics) — not bakery production scheduling.
- 🔴 **NO PRODUCTION CALENDAR.** The platform lacks a "bakery order calendar" concept. Pepe needs to see: Saturday = 3 cakes already committed, max capacity is 5. This doesn't exist.
- ⚠️ **RUSH FEE:** Many bakeries charge extra for rush orders. No pricing surcharge mechanism in ERPNext tools.
- ⚠️ **"Lo que sea"** — Customer is flexible on flavor. Agent should suggest what's easiest/available. This requires knowledge of which cakes are faster to make (not in the system).
- ✅ The urgency detection (ALL CAPS, "MAÑANA") should work for comprehension.

---

## Scenario 6: Price Inquiry — Pan Francés

**Input (customer):**
> "Cuanto el pan frances la unidad?"

**Skills triggered:** `yaya-sales` (price lookup), `yaya-inventory` (price lookup)

**MCP tools needed:**
- `erpnext-mcp → search_products` or `get_item_price` (pan francés unit price)

**Roleplay — variations:**
- `"cuanto pan"` — extremely terse
- `"precio pan frances?"` — no greeting, direct question
- `"q precio el pan francesito"` — diminutive form

**Ratings:**

| D1 | D2 | D3 | D4 | D5 | D6 |
|----|----|----|----|----|---|
| 8 | 8 | 8 | 8 | 8 | 9 |

**Gaps identified:**
- ✅ This is the simplest, most well-covered flow. `search_products` + price lookup is the core of `yaya-sales`.
- ⚠️ **Minor: Unit pricing display.** Bread is sold per unit (S/0.30-0.50). The response format should handle sub-sol amounts cleanly ("30 céntimos" or "S/0.30").
- ✅ Extremely low-tech friendly. Customer asks one question, gets one answer.

---

## Scenario 7: Full Price List Request

**Input (customer):**
> "Pasame la lista de precios de tortas pe"

**Skills triggered:** `yaya-sales` (catalog browse), `yaya-inventory` (price list)

**MCP tools needed:**
- `erpnext-mcp → search_products` (filter by category "tortas")

**Roleplay — variations:**
- `"lista tortas"` — two words
- `"pasa precios tortas pe"` — "pe" = Peruvian filler word
- `"cuanto las tortas?"` — general question

**Ratings:**

| D1 | D2 | D3 | D4 | D5 | D6 |
|----|----|----|----|----|---|
| 7 | 6 | 5 | 7 | 7 | 6 |

**Gaps identified:**
- 🔴 **PRICE LIST FORMAT GAP:** Don Pepe currently sends **photos of his price list** via WhatsApp Status. His customers expect a visual price list, not a text list. The platform can generate text lists but has no mechanism to send a pre-designed price list image.
- ⚠️ **PRODUCT CATALOG STRUCTURE:** A bakery price list for cakes is typically by size (1kg, 2kg, 3kg) × flavor × occasion, not by SKU. The ERPNext product model (designed for retail items) may not represent this well.
- ⚠️ **"pe" HANDLING:** "pe" is a Peruvian filler word (like "pues"). Agent must recognize and ignore it, not interpret it as part of the product name. LLM should handle this but worth noting.
- ✅ WhatsApp formatting guidelines in skills (bullet lists, emojis, no tables) are appropriate.

---

## Scenario 8: Bulk Pricing Request — 100 Panes

**Input (customer):**
> "Si llevo 100 panes para un evento, me haces precio?"

**Skills triggered:** `yaya-sales` (bulk/discount pricing), `yaya-inventory` (stock check)

**MCP tools needed:**
- `erpnext-mcp → get_item_price` (check if bulk pricing exists)
- `erpnext-mcp → create_quotation` (formal quote with discount)

**Roleplay — variations:**
- `"100 panes frances cuanto sale?"` — no mention of discount, but implied
- `"haces precio x 100?"` — slang "haces precio" = give me a discount

**Ratings:**

| D1 | D2 | D3 | D4 | D5 | D6 |
|----|----|----|----|----|---|
| 6 | 6 | 5 | 7 | 5 | 7 |

**Gaps identified:**
- ⚠️ **NO BULK/TIERED PRICING IN ERPNEXT TOOLS:** `get_item_price` returns a single price. There's no documented support for quantity-based pricing tiers (e.g., 1-49 units = S/0.40, 50-99 = S/0.35, 100+ = S/0.30). ERPNext DOES support pricing rules but the MCP tool doesn't expose them.
- ⚠️ **DISCOUNT AUTHORITY:** Who can authorize bulk discounts? For Don Pepe, HE is the authority, but the agent doesn't know his discount policies (e.g., "for 100+ panes, I give 10% off"). This needs to be configured somewhere — either in ERPNext pricing rules or in the business's SOUL.md/config.
- ⚠️ **"Haces precio" COMPREHENSION:** This Peruvian idiom means "can you give me a discount?" The LLM should understand this, but it's implicit — the customer never says "descuento."
- 🔴 **ESCALATION vs AUTONOMY:** Should the agent auto-quote a bulk discount or escalate to Pepe? The `yaya-escalation` skill mentions `BULK_ORDER_THRESHOLD` but this is quantity-based, not for Pepe's own decision-making as the owner.

---

## Scenario 9: Price Complaint — Empanada Price Increase

**Input (customer):**
> "Subiste los precios? El mes pasado la empanada estaba a 2 soles"

**Skills triggered:** `yaya-sales` (price inquiry + objection handling), `yaya-escalation` (potential complaint)

**MCP tools needed:**
- `erpnext-mcp → get_item_price` (current price)
- No tool for historical pricing comparison

**Roleplay — variations:**
- `"SUBISTE LOS PRECIOS??? la empanada staba 2 soles"` — frustrated caps
- `"oye pepe todo mas caro ahora?"` — general complaint

**Ratings:**

| D1 | D2 | D3 | D4 | D5 | D6 |
|----|----|----|----|----|---|
| 7 | 5 | 4 | 6 | 5 | 8 |

**Gaps identified:**
- 🔴 **NO PRICE HISTORY:** There is no MCP tool or skill that tracks historical prices. The agent can't confirm "yes, empanadas were S/2 last month and now are S/2.50." It can only give the current price.
- ⚠️ **PRICE JUSTIFICATION:** Don Pepe's persona says flour prices went up 15%. The agent should be able to explain WHY prices changed ("los insumos subieron"). This requires configured business-level messaging — a "price change explanation" template or note in the business config.
- ⚠️ **ESCALATION SENSITIVITY:** This is a complaint, not just a question. `yaya-escalation` behavioral signals include "increasingly shorter responses" and "customer correcting the agent." The agent should handle this delicately — acknowledge, explain if possible, don't argue.
- ✅ The customer is low-tech but this is a normal text conversation. Phone-friendly.

---

## Scenario 10: Yape Payment Screenshot

**Input (customer):**
> [Yape screenshot S/85] "Ya te yapié por los panes y empanadas de hoy"

**Skills triggered:** `yaya-payments` (receipt OCR + validation)

**MCP tools needed:**
- `payments-mcp → list_pending_payments` (find pending order)
- `payments-mcp → match_payment` (match S/85 to an order)
- `payments-mcp → confirm_payment` (mark as paid)
- `crm-mcp → log_interaction`

**Roleplay — variations:**
- `[Photo] "listo"` — just the screenshot and one word
- `[Photo]` — NO TEXT at all, just the image
- `"ya yapee"` — no screenshot, just verbal claim

**Ratings:**

| D1 | D2 | D3 | D4 | D5 | D6 |
|----|----|----|----|----|---|
| 7 | 8 | 8 | 8 | 7 | 8 |

**Gaps identified:**
- ✅ **STRONG FIT:** `yaya-payments` is the most thoroughly designed skill for this exact scenario. OCR via Qwen3.5-27B, Yape support, amount matching with tolerance, duplicate detection — all present.
- ⚠️ **"Ya yapee" WITHOUT SCREENSHOT:** What if the customer claims payment but doesn't send proof? The skill says to ask for the screenshot, but for Pepe's context (neighborhood bakery, trust-based), sometimes "ya te yapié" is enough. The agent should check Yape directly... but there's no Yape API integration. **Gap: No programmatic Yape verification.**
- ⚠️ **NO TEXT WITH IMAGE:** If the customer sends ONLY a photo with zero text, the agent must proactively attempt OCR. `yaya-payments` describes this flow but it requires that the agent recognize an incoming image as a potential payment screenshot vs. just a random photo.
- ⚠️ **SMALL AMOUNTS:** S/85 is small. Pepe might not create formal orders for daily bread purchases (customers just walk in and buy). The "pending order" might not exist in ERPNext. Need: **ad-hoc payment recording** without a linked order.

---

## Scenario 11: Debt Tracking — "Cuánto te debo?"

**Input (customer):**
> "Pepe cuanto te debo? Me llevas anotando verdad?"

**Skills triggered:** `yaya-sales` (balance inquiry), `yaya-payments` (payment history)

**MCP tools needed:**
- `erpnext-mcp → get_customer_balance` (outstanding balance)
- `payments-mcp → get_payment_history` (what they've paid)
- `erpnext-mcp → list_orders` (what they've ordered)

**Roleplay — variations:**
- `"cuanto debo"` — two words
- `"me anotas verdad? cuanto me falta"` — assumes tracking is happening

**Ratings:**

| D1 | D2 | D3 | D4 | D5 | D6 |
|----|----|----|----|----|---|
| 7 | 7 | 6 | 8 | 6 | 8 |

**Gaps identified:**
- ⚠️ **"FIADO" / TAB SYSTEM:** In Peruvian neighborhood bakeries, customers often buy "al fiado" (on credit/tab). Pepe's persona says "cash management: most sales are cash, hard to track." The platform assumes formal orders → formal payments. But fiado = informal running tab. **No tool supports running tabs** (incrementing a customer balance without creating individual sales orders for every pan francés).
- ⚠️ **"Me llevas anotando verdad?"** — The customer ASSUMES Don Pepe is tracking their purchases. If the system wasn't recording them (because they were cash walk-ins), the agent can't answer. This reveals a fundamental gap for micro-retail: **informal daily transaction recording.**
- ✅ `get_customer_balance` exists and would work IF orders were formally created.

---

## Scenario 12: Split Payment — Half Now, Half Later

**Input (customer):**
> "Te pago la mitad ahora y la otra mitad cuando recojos la torta, ya?"

**Skills triggered:** `yaya-payments` (partial payment handling)

**MCP tools needed:**
- `payments-mcp → confirm_payment` (record partial payment)
- `erpnext-mcp → get_order` (check order total)

**Roleplay — variations:**
- `"mitad ahora mitad desp"` — abbreviated
- `"50% adelanto ya?"` — numeric

**Ratings:**

| D1 | D2 | D3 | D4 | D5 | D6 |
|----|----|----|----|----|---|
| 7 | 8 | 7 | 8 | 7 | 8 |

**Gaps identified:**
- ✅ **PARTIAL PAYMENTS SUPPORTED:** `yaya-payments` explicitly handles partial payments, tracks remaining balance, and sends reminders.
- ⚠️ **"recojos" (TYPO):** Customer wrote "recojos" instead of "recoges." LLM should handle this — it's standard low-literacy Spanish typo.
- ⚠️ **DEPOSIT CULTURE:** In Peru, cake orders commonly require 50% deposit. The agent should KNOW this is standard practice and proactively suggest it when creating cake orders. Currently, no skill mentions deposit/advance payment as a default for custom orders.
- ✅ Low-tech friendly. Customer states intent, agent records it.

---

## Scenario 13: Delivery Request — Bread + Empanadas

**Input (customer):**
> "Me puedes mandar 50 panes y 20 empanadas a esta dirección: Av. Revolución 456, para las 10am"

**Skills triggered:** `yaya-sales` (order creation), `yaya-inventory` (stock check)

**MCP tools needed:**
- `erpnext-mcp → search_products` (pan francés, empanada)
- `erpnext-mcp → check_stock` (50 panes, 20 empanadas available?)
- `erpnext-mcp → create_order` (with delivery address + time)
- `crm-mcp → update_contact` (save delivery address)

**Roleplay — variations:**
- `"manda 50 panes 20 empanadas av revolucion 456 10am"` — telegram style
- `[Voice note with same info, background traffic noise]`

**Ratings:**

| D1 | D2 | D3 | D4 | D5 | D6 |
|----|----|----|----|----|---|
| 7 | 6 | 5 | 7 | 5 | 7 |

**Gaps identified:**
- 🔴 **NO DELIVERY MANAGEMENT SKILL.** There is no `yaya-delivery` or `yaya-logistics` skill. Pepe has 1 delivery guy on a motorcycle. The agent needs to:
  1. Check if the delivery guy is available at 10am
  2. Check if there are conflicting deliveries (4 deliveries at the same hour is Pepe's pain point)
  3. Estimate delivery time from bakery to Av. Revolución 456
  4. Calculate delivery fee (Scenario 15)
  None of this exists.
- ⚠️ **DELIVERY ADDRESS STORAGE:** `crm-mcp → update_contact` can store addresses, but there's no delivery routing or scheduling capability.
- ⚠️ **DELIVERY TIME vs ORDER TIME:** Customer wants delivery at 10am. But are 50 panes ready at 10am? Pepe starts baking at 4am, so probably yes — but the system doesn't model production schedules.
- 🔴 **DELIVERY FEE CALCULATION:** No tool calculates delivery fees based on distance/zone.

---

## Scenario 14: Delivery Status — Waiting Customer

**Input (customer):**
> "El delivery ya pasó? Estoy esperando desde hace 1 hora"

**Skills triggered:** `yaya-sales` (order status), `yaya-escalation` (potential frustration)

**MCP tools needed:**
- `erpnext-mcp → get_order` (order/delivery status)

**Roleplay — variations:**
- `"???"` — just question marks (implicit: "where's my order?")
- `"ya pasó el delivery?"` — direct question
- `"hace 1 hora espero >:("` — with emoticon frustration

**Ratings:**

| D1 | D2 | D3 | D4 | D5 | D6 |
|----|----|----|----|----|---|
| 5 | 4 | 3 | 6 | 5 | 7 |

**Gaps identified:**
- 🔴 **CRITICAL: NO DELIVERY TRACKING.** `get_order` shows order status but NOT delivery location or ETA. There's no GPS tracking, no delivery state machine (picked up → en route → delivered), and no way to tell the customer "tu pedido está en camino, llega en 15 minutos."
- 🔴 **"???" HANDLING:** Three question marks with no context. The agent must infer from conversation history that this customer has a pending delivery. This requires maintaining conversation state across sessions (customer messaged earlier about delivery, now sends "???" hours later). The LLM can do this if chat history is available, but it's an edge case that needs testing.
- ⚠️ **FRUSTRATION DETECTION:** "Estoy esperando desde hace 1 hora" + waiting = frustration escalation trigger. `yaya-escalation` should detect this. But what does Pepe DO? He calls his delivery guy. The agent should **notify Pepe to check with the delivery guy**, not try to give a delivery update it doesn't have.
- 🔴 **REAL-TIME DELIVERY COMMUNICATION GAP:** No way for the delivery guy to update his status. He doesn't have an app — he's on a motorcycle in Villa El Salvador.

---

## Scenario 15: Delivery Fee Inquiry — Different District

**Input (customer):**
> "Cuanto cobras por delivery a San Juan de Miraflores?"

**Skills triggered:** `yaya-sales` (delivery pricing)

**MCP tools needed:**
- None exist for delivery zone pricing

**Roleplay — variations:**
- `"cuanto delivery a sjm?"` — abbreviation for San Juan de Miraflores
- `"llegan a sjm? cuanto?"` — coverage + price

**Ratings:**

| D1 | D2 | D3 | D4 | D5 | D6 |
|----|----|----|----|----|---|
| 6 | 2 | 2 | 6 | 4 | 8 |

**Gaps identified:**
- 🔴 **CRITICAL: NO DELIVERY ZONE/FEE SYSTEM.** The platform has zero delivery management. Pepe needs:
  - Delivery zones (Villa El Salvador = free/S/3, SJM = S/5, further = S/8-10+)
  - Zone boundaries (by district, not GPS)
  - "SJM" abbreviation recognition (common Lima district abbreviation)
  - Delivery coverage limits ("no hacemos delivery a Comas" = too far)
- 🔴 **"sjm" ABBREVIATION:** "SJM" = San Juan de Miraflores is common in Lima. Agent needs Lima district name resolution. This is a locale-specific knowledge gap.
- ⚠️ **DELIVERY MINIMUM ORDER:** Many bakeries have minimum orders for delivery (e.g., S/30 minimum for delivery). No configuration for this.

---

## Scenario 23: ALLERGEN SAFETY — Nut Allergy (LIFE-THREATENING)

**Input (customer):**
> "Pepe mi hija es alérgica a las nueces, la torta que pedí no tiene nueces verdad????"

**Skills triggered:** `yaya-sales` (order details), `yaya-escalation` (safety-critical), `yaya-crm` (preference/allergen tracking)

**MCP tools needed:**
- `erpnext-mcp → get_order` (check order details/ingredients)
- `crm-mcp → update_contact` (store allergen info PERMANENTLY)
- `crm-mcp → log_interaction` (document allergen disclosure)

**Roleplay — variations:**
- `"NO PUEDE TENER NUECES mi hija se muere"` — desperate, caps
- `"la torta no tiene nueces cierto? URGENTE"` — emphasis on urgency
- `"hija alergica nueces"` — minimal, assumed context

**Ratings:**

| D1 | D2 | D3 | D4 | D5 | D6 |
|----|----|----|----|----|---|
| 6 | 3 | 2 | 5 | 2 | 7 |

**Gaps identified:**
- 🔴🔴 **CRITICAL SAFETY FAILURE: NO ALLERGEN TRACKING SYSTEM.** This is the most dangerous gap in the entire platform. There is:
  - **No allergen field in the product catalog.** ERPNext items don't have `allergens[]` attribute exposed via MCP.
  - **No allergen field in the CRM contact.** `yaya-crm` mentions "preferences" and "dietary restrictions" but only as generic text notes, not structured allergen flags that trigger hard warnings.
  - **No ingredient list per product.** A chocolate cake might contain traces of nuts from shared equipment. The agent has NO WAY to verify this.
  - **No cross-contamination awareness.** Pepe's bakery likely uses shared ovens, bowls, and surfaces. Even a "nut-free" cake could have trace contamination.
  - **No safety escalation for allergens.** `yaya-escalation` detects frustration and complaint keywords, but "alérgica" and "nueces" are not listed as **safety-critical trigger words** that force IMMEDIATE human escalation.
  - **No allergen confirmation workflow.** The correct behavior is: (1) IMMEDIATELY escalate to Don Pepe or Rosa, (2) confirm specific ingredients with the baker, (3) disclose any cross-contamination risk, (4) get EXPLICIT confirmation from Pepe before responding to the customer, (5) store the allergen permanently in CRM with a hard flag.

- 🔴 **AGENT SHOULD NEVER GUESS ON ALLERGENS.** If the agent says "no, no tiene nueces" based on the product name alone (e.g., "torta de chocolate"), it could kill a child. The ONLY safe response is: "Voy a confirmarlo directamente con Don Pepe/Rosa para estar 100% seguros. Este tema es muy importante y no quiero darte información que no sea completamente segura."

- 🔴 **NO ALLERGEN DISCLAIMER.** The platform should have a configured allergen disclaimer: "Nuestros productos se preparan en una cocina donde se manipulan frutos secos, lácteos, gluten y huevo. No podemos garantizar la ausencia total de alérgenos."

**RECOMMENDATIONS FOR ALLERGEN SAFETY:**
1. Add `allergens: string[]` field to ERPNext items (via `create_item` / `update_item`)
2. Add `allergens: string[]` to CRM contacts as a STRUCTURED field (not free text)
3. Add HARD ESCALATION RULE: any mention of "alérgi*", "nuez*", "maní", "gluten", "celiac*", "intoleranci*" → IMMEDIATE owner notification, NO automated response about ingredients
4. Add per-business allergen disclaimer template
5. Add cross-contamination flag per facility/kitchen

---

## TECH BARRIER BONUS TESTS

### Voice Note Handling (Scenario 25 from persona)
- `yaya-sales` mentions Whisper transcription
- **Gap:** No documented handling for: background noise (bakery mixers), fast limeño Spanish, simultaneous speakers, poor phone microphone quality
- **Gap:** No feedback mechanism ("no te entendí bien, ¿podrías repetir?" or "escuché X, ¿es correcto?")
- **Rating: D6 = 5** — voice notes ARE Pepe's primary communication method, so this must be robust

### Typo-Heavy Messages (Scenario 26: "como ago para ver mis pedidos?")
- "ago" = "hago" (missing H is extremely common in low-literacy Spanish)
- LLM should handle this effortlessly — Peruvian Spanish typos are well-represented in training data
- **Rating: D6 = 8** — LLMs are generally good with typos

### Implicit Context (Scenario 27: "???")
- Three question marks with NO text
- Agent must infer meaning from conversation history:
  - If pending delivery → "¿dónde está mi pedido?"
  - If pending payment confirmation → "¿ya vieron mi pago?"
  - If no context → "¿en qué te puedo ayudar?"
- **Rating: D6 = 6** — works if conversation history is maintained, fails if it's a new session

---

## SUMMARY: CRITICAL GAPS FOR DON PEPE'S BAKERY

### 🔴 Showstoppers (Must fix before launch for bakeries)

| # | Gap | Impact | Affected Scenarios |
|---|-----|--------|-------------------|
| 1 | **No allergen tracking system** | Life-threatening safety risk | 23 |
| 2 | **No custom product pricing (formula-based)** | Can't price cakes properly | 1, 2, 5, 7 |
| 3 | **No delivery management** | Can't handle Pepe's biggest operational need | 13, 14, 15 |
| 4 | **No production calendar/capacity** | Will overbook cake orders | 5 |
| 5 | **No delivery tracking** | Frustrated delivery customers, no answers | 14 |

### 🟡 Important Gaps (Should fix for bakery vertical)

| # | Gap | Impact | Affected Scenarios |
|---|-----|--------|-------------------|
| 6 | No bulk/tiered pricing in MCP tools | Can't give event discounts | 8 |
| 7 | No price history | Can't explain price changes | 9 |
| 8 | No "fiado"/tab system for informal credit | Can't track daily walk-in debts | 11 |
| 9 | No deposit/advance payment defaults for custom orders | Missing standard bakery workflow | 12 |
| 10 | No delivery zone/fee configuration | Can't quote delivery costs | 15 |
| 11 | No cake customization fields (design, message, tiers) | Lost order details | 1, 2 |
| 12 | No image-based price list sending | Customers expect photo menus | 7 |

### 🟢 Working Well

| # | Capability | Scenarios |
|---|-----------|-----------|
| 1 | Payment screenshot OCR (Yape) | 10 |
| 2 | Partial payment handling | 12 |
| 3 | Simple price lookups | 6 |
| 4 | Customer order lookup | 4 |
| 5 | CRM auto-contact creation | All |
| 6 | Frustration detection & escalation | 14 |
| 7 | WhatsApp-first formatting | All |

---

## AGGREGATE SCORES

| Dimension | Avg Score (0-10) | Notes |
|-----------|-----------------|-------|
| **D1: Comprehension** | 6.8 | Good for text, uncertain for voice + implicit context |
| **D2: Tool Coverage** | 5.9 | Retail tools exist; bakery-specific tools missing |
| **D3: Flow Completeness** | 5.1 | Many flows stop short — no delivery, no capacity, no allergens |
| **D4: Cultural Fit** | 7.1 | Good tone guidelines; missing Lima-specific knowledge (districts, slang) |
| **D5: Safety** | 5.3 | Payment safety OK; allergen safety CRITICAL gap |
| **D6: Low-Tech Friendliness** | 7.5 | WhatsApp-first design is strong; voice note robustness untested |
| **OVERALL** | **6.3** | **Platform works for retail. Bakery vertical needs significant additions.** |

---

## RECOMMENDATIONS — Priority Order

1. **🚨 IMMEDIATE: Implement allergen safety system** — Structured allergen fields in products + CRM, hard escalation rules for allergen mentions, cross-contamination disclaimers. This is a liability issue.

2. **🔧 HIGH: Build bakery/food-service vertical extension:**
   - Custom product builder (size × flavor × decoration × tiers)
   - Formula-based pricing
   - Production calendar with capacity limits
   - Ingredient-level inventory tracking

3. **🔧 HIGH: Build delivery management skill (`yaya-delivery`):**
   - Delivery zones with fee structure
   - Delivery schedule (1 motorcycle, N deliveries/day)
   - Simple status updates (accepted → en route → delivered)
   - District name/abbreviation recognition for Lima

4. **🔧 MEDIUM: Add informal credit ("fiado") system:**
   - Running tab per customer without formal orders
   - End-of-week/month settlement
   - Simple "añade S/5 a la cuenta de doña María"

5. **🔧 MEDIUM: Add price list image support:**
   - Business can upload a price list image
   - Agent sends it when customers ask "pásame los precios"
   - Auto-generate from catalog as fallback

6. **📝 LOW: Lima locale pack:**
   - District names + common abbreviations (SJM, VES, VMT, SMP, SJL, etc.)
   - Peruvian food terms (manjar = manjarblanco = dulce de leche, tres leches, etc.)
   - Common bakery products (cachito, pan francés, pan de molde, biscocho)
