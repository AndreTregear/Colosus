# Test Results: Diana Vargas — Boutique Dianita (Sales & Returns)

**Persona:** Diana Vargas Chávez, 27, Surco, Lima  
**Business:** Online fashion boutique (Instagram + WhatsApp), solo operation  
**Products:** Women's clothing, accessories, handbags, shoes (imported China/Turkey)  
**Test Date:** 2026-03-20  
**Scenarios Tested:** 1–15 (Sales Flow, Stock & Availability, Bulk/Wholesale, Returns)  
**Tester Tone:** Young Lima Spanish — casual, emojis, abbreviations (x fa, tb, amiga, etc.)

---

## Scoring Dimensions (0–10)

| Dim | Description |
|-----|-------------|
| **ACC** | Accuracy — Correct info, no hallucination, real tool calls |
| **TON** | Tone — Matches Diana's vibe (warm, emoji-heavy, young Lima Spanish) |
| **FLO** | Flow — Natural conversation, no robotic steps |
| **SAF** | Safety — No overselling, no leaking internal data, proper escalation |
| **INT** | Integration — Correct MCP tools invoked, data flows right |
| **GAP** | Gap-Free — No missing capabilities needed for the scenario |

---

## SALES FLOW (Scenarios 1–8)

### Scenario 1: "Hola! Vi el vestido negro de tu insta, hay en talla M? 😍"

**Customer message (as Diana's customer):**
> holaaaa amigaaa vi el vestido negro q subiste en tus stories esta mañana 😍😍 hay en M?? x faaaa dime q si 🙏💕

**Expected agent behavior:**
1. Search product catalog via `erpnext-mcp → search_products("vestido negro")`
2. Check stock for talla M via `erpnext-mcp → check_stock`
3. Respond warmly with availability + price
4. Auto-create or lookup contact via `crm-mcp → search_contacts / create_contact`

**Analysis:**

| Dim | Score | Notes |
|-----|-------|-------|
| ACC | 8 | Product search works, but `search_products` only does `item_name LIKE %query%`. If Diana names items differently in ERPNext vs Instagram ("Vestido Mía Negro" vs "vestido negro"), search may miss. No variant/attribute search (talla/color) — requires item naming convention to include size. |
| TON | 7 | yaya-sales examples show warm tone with emojis (👋😊) but not quite *Lima joven*. No "amiga" mirroring, no "x fa" back. Skill says "culturally appropriate for Peru/LATAM" but doesn't specify matching the customer's register. |
| FLO | 8 | Flow is natural: greet → show options → ask preference. Good. |
| SAF | 9 | Checks stock before promising ✅. Doesn't expose cost data ✅. |
| INT | 7 | `erpnext-mcp` has `search_products` and `check_stock` but **no variant-level stock query**. `check_stock` works by `item_code` + optional warehouse. If sizes are ERPNext variants, agent must know the variant item_code. No tool for "search by attribute (talla=M, color=negro)". |
| GAP | 5 | **CRITICAL GAP: Instagram → WhatsApp bridge.** Customer says "vi en tu insta" but there's no `yaya-meta` for Instagram integration (only for selling Yaya Platform itself). No tool to look up which Instagram post/story maps to which product. Diana would need to manually cross-reference. **No Instagram catalog sync skill.** |

**Gaps Flagged:**
- 🔴 **No Instagram catalog integration** — Diana posts products on IG Stories, customers ask about them on WhatsApp. Agent has no way to map "the dress you posted this morning" to an ERPNext item.
- 🟡 **No variant/attribute search** — ERPNext `search_products` is name-based only. Need attribute filters (size, color).
- 🟡 **Tone matching** — Skill should instruct agent to mirror customer register (informal ↔ informal).

---

### Scenario 2: "Cuánto cuesta el bolso que subiste hoy? Y el envío a Trujillo?"

**Customer message:**
> amiii cuanto sale el bolso q subiste hoy?? 👜 y el envio a trujillo cuanto me cobra?? envian a provincia no? 🤔

**Expected agent behavior:**
1. Identify product (bolso), search catalog
2. Return price
3. Calculate shipping to Trujillo (Olva Courier / Shalom rates)

**Analysis:**

| Dim | Score | Notes |
|-----|-------|-------|
| ACC | 6 | Can look up price via `get_item_price` ✅. But **no shipping rate tool exists**. Diana uses Olva Courier, Shalom, moto delivery — no MCP server handles shipping quotes. Agent would have to hardcode or guess. |
| TON | 7 | Same tone issue as S1 — can be warm but not fully Lima-casual. |
| FLO | 7 | Natural if shipping info is available. Breaks flow if agent says "let me check" and can't actually check. |
| SAF | 8 | No safety issues. |
| INT | 4 | **No shipping MCP server.** No integration with Olva, Shalom, or any courier API. Agent would need shipping rates hardcoded in business config or a shipping skill. |
| GAP | 3 | **CRITICAL GAP: No shipping/logistics skill for rate quotes.** Diana ships 15-20 packages/day via 3 couriers. Need: `yaya-shipping` skill + `shipping-mcp` server with courier API integrations (Olva, Shalom rates by destination). Also no way to auto-determine city from "Trujillo" → shipping zone. |

**Gaps Flagged:**
- 🔴 **No shipping rate calculator** — High-frequency need ("¿envían a provincias?" is a daily question for Diana).
- 🔴 **No courier integration MCP** — Olva Courier, Shalom APIs not connected.
- 🟡 **No Peru geography mapping** — Agent needs to know Trujillo = La Libertad region for shipping zone calculation.

---

### Scenario 3: "Quiero el vestido + el bolso + los aretes, cuánto me sale todo con envío?"

**Customer message:**
> ya amiga me decidiii 🎉 quiero el vestido negro M + el bolso café + los aretes dorados, cuanto me sale todito con envio a lima?? haceme un descuentito x llevar 3 cositas pls 🥺💕

**Expected agent behavior:**
1. Look up 3 products + prices
2. Calculate bundle total
3. Apply any bundle/volume discount rules
4. Add shipping cost for Lima (moto delivery)
5. Create quotation or order

**Analysis:**

| Dim | Score | Notes |
|-----|-------|-------|
| ACC | 7 | Can search 3 products, get prices. `create_quotation` tool exists for multi-item quotes ✅. Can create order via `create_order` with multiple items. |
| TON | 6 | Discount request ("haceme un descuentito") requires nuanced handling. yaya-sales mentions "Apply business rules for discounts, bundles" but the skill doesn't specify how discount authority works for Diana's case. Does the agent have pre-set discount rules? |
| FLO | 7 | Good flow possible: list items → total → offer discount if rules allow → confirm. |
| SAF | 7 | Discount handling is tricky — agent needs clear rules on what discounts Diana authorizes. Without config, agent might refuse or escalate unnecessarily. |
| INT | 7 | `erpnext-mcp → get_item_price` supports pricing rules and quantity discounts ✅. `create_order` handles multi-item ✅. But no shipping calc for the bundle. |
| GAP | 5 | **No bundle discount configuration.** Diana mentally calculates "if they buy 3+ give 5% off" but there's no way to configure this in the platform without setting up ERPNext pricing rules. Need a simpler business rule config for informal sellers. |

**Gaps Flagged:**
- 🟡 **No simple discount rule config** — Diana's discount logic is informal ("redondeo", bundle deals). ERPNext Pricing Rules are enterprise-grade. Need a lightweight discount config in the business profile.
- 🔴 **Still no shipping cost integration** for Lima moto delivery.

---

### Scenario 4: "Me mandas tu Yape para pagarte? 💜"

**Customer message:**
> yaaa perfecto amiga 💕 mandame tu yape x fa q te pago ahorita!! 💜✨

**Expected agent behavior:**
1. Send Yape payment details (number + name)
2. Mention alternative methods (Plin, BCP)

**Analysis:**

| Dim | Score | Notes |
|-----|-------|-------|
| ACC | 9 | `payments-mcp → get_payment_methods` returns configured methods ✅. yaya-sales skill has `YAPE_NUMBER` and `YAPE_NAME` config ✅. |
| TON | 8 | Payment guidance examples in yaya-sales use good formatting with 💜 for Yape. |
| FLO | 9 | Clean, simple exchange. |
| SAF | 10 | Never handles credentials directly ✅. Just shares receiving info. |
| INT | 9 | Well-covered by `payments-mcp` + yaya-sales config. |
| GAP | 8 | Minor: no QR code generation for Yape. Many Lima sellers share QR images. |

**Gaps Flagged:**
- 🟢 **Minor: No Yape QR code sharing** — Diana probably has a Yape QR image she shares. Agent could store and send it.

---

### Scenario 5: [Yape screenshot S/189] "Listo amiga, ya te yapié! ✨"

**Customer message:**
> [sends Yape screenshot showing S/189 transfer]
> listoooo amigaaaa ya te yapie!! ✨✨ confirma x fa 🙏💜

**Expected agent behavior:**
1. OCR screenshot via Qwen3.5-27B vision
2. Extract: amount (S/189), reference #, date, sender
3. Match against pending orders
4. Confirm payment in ERPNext

**Analysis:**

| Dim | Score | Notes |
|-----|-------|-------|
| ACC | 8 | yaya-payments skill is thorough: OCR → extract → match → confirm. Supports Yape specifically ✅. Uses Qwen3.5-27B vision for OCR ✅. |
| TON | 8 | "¡Pago confirmado! ✅" — good celebration moment. |
| FLO | 8 | Flow: receive image → extract → confirm back → update order. Smooth. |
| SAF | 9 | Duplicate detection via receipt hash ✅. Amount tolerance ±1% ✅. Never stores full account numbers ✅. |
| INT | 9 | `payments-mcp → match_payment` + `confirm_payment` + `erpnext-mcp → create_payment_entry`. Full pipeline. |
| GAP | 7 | **No image handling tool call in the agent flow.** The yaya-payments skill describes OCR via Qwen3.5 but there's no MCP tool for vision/OCR. The agent would need to use its own multimodal capabilities. Works if the agent model supports vision, but it's not a tool-mediated flow — could fail with text-only models. |

**Gaps Flagged:**
- 🟡 **OCR depends on agent model's vision capability** — No dedicated OCR MCP tool. If a non-vision model runs the agent, payment screenshot validation breaks entirely.
- 🟢 **Duplicate receipt detection** is well-designed (hash-based).

---

### Scenario 6: "Cuándo me llega? Necesito para el viernes que es mi cumple 🎂"

**Customer message:**
> amigaaa y cuando me llegaaaa?? es q lo necesito para el viernes q es mi cumple 🎂🎉 osea tiene q llegar si o si antes del viernes x fa 🙏🙏

**Expected agent behavior:**
1. Check order status and estimated delivery
2. Calculate if Friday delivery is feasible given courier timelines
3. Provide realistic timeline

**Analysis:**

| Dim | Score | Notes |
|-----|-------|-------|
| ACC | 5 | `erpnext-mcp → get_order` returns order status but **no delivery tracking**. No tracking number, no courier ETA. Agent can check order status (Draft, To Deliver, etc.) but can't say "arrives Thursday." |
| TON | 7 | Birthday mention is a CRM data point — agent should note it via `crm-mcp → update_contact` with birthday info. yaya-followup has birthday messages ✅. |
| FLO | 5 | Flow breaks if agent can't give delivery estimate. Would have to say "let me check with Diana" which feels like a failure. |
| SAF | 7 | Shouldn't promise delivery without data. |
| INT | 3 | **No courier tracking integration.** `erpnext-mcp` has no delivery tracking fields exposed. No Olva/Shalom API integration for tracking. |
| GAP | 3 | **CRITICAL GAP: No delivery tracking.** Diana's persona says tracking 15-20 packages daily across 3 couriers is a daily task. Need: `shipping-mcp` with tracking API integrations. Also need shipping timeline knowledge (Lima same-day moto, provinces 2-3 days Olva, etc.). |

**Gaps Flagged:**
- 🔴 **No delivery tracking system** — Critical for Diana's 15-20 daily shipments.
- 🔴 **No courier API integration** (Olva, Shalom tracking endpoints).
- 🟡 **No delivery timeline logic** — Agent should know "Lima = 1 day moto, Trujillo = 2-3 days Olva".
- 🟢 **Birthday capture** — Agent should log birthday to CRM for future yaya-followup use.

---

### Scenario 7: "Hay en otro color? Vi que tu competencia lo tiene en rosado"

**Customer message:**
> oye y no hay en otro color?? vi q [competitor handle] lo tiene en rosado y se ve hermosooo 😍 ustedes no tienen rosado?? 🩷

**Expected agent behavior:**
1. Check variants/colors for the product
2. List available colors
3. Handle competitive mention diplomatically
4. If not available, offer alternatives or waitlist

**Analysis:**

| Dim | Score | Notes |
|-----|-------|-------|
| ACC | 6 | Can search by product name but **no color/variant filter**. If variants are separate items ("Vestido Mía Negro", "Vestido Mía Rosado"), search works. If they're ERPNext Item Variants, `search_products` doesn't query variant attributes. |
| TON | 7 | Competitor mention needs diplomacy. yaya-sales doesn't have explicit competitive handling rules (yaya-meta does for selling Yaya Platform, but not for the end business). |
| FLO | 7 | Natural enough: "let me check colors" → list options or "we don't have pink but we have...". |
| SAF | 8 | Shouldn't badmouth competitor. Agent should focus on own products. |
| INT | 5 | Limited variant search capability. No tool to query "all colors for item X". |
| GAP | 6 | **No competitor intelligence.** Diana checks competitors weekly (persona says so). No tool/skill for price comparison or competitive tracking. Also variant search is weak. |

**Gaps Flagged:**
- 🟡 **No variant attribute search** — Can't query "what colors does this dress come in?"
- 🟡 **No competitive handling guidelines** in yaya-sales for end business (only in yaya-meta).

---

### Scenario 8: "Es original o réplica? Quiero saber antes de comprar"

**Customer message:**
> oye amiga una consulta... eso es original o replica?? xq hay un monton de replicas por ahi y quiero saber antes d comprar 🤔 no es x nada pero tengo q saber jaja

**Expected agent behavior:**
1. This is a sensitive question — many Lima boutiques sell "inspired" products
2. Agent should respond based on Diana's configured product descriptions
3. Should not lie or make claims not in the product data

**Analysis:**

| Dim | Score | Notes |
|-----|-------|-------|
| ACC | 6 | Product description from ERPNext would need to include authenticity info. `get_product` returns description but if Diana hasn't written "original" or "inspired by" in the description, agent can't answer accurately. |
| TON | 7 | Delicate topic needs finesse. Agent should be honest without being defensive. |
| FLO | 6 | Could be awkward if agent doesn't have the info and has to escalate. |
| SAF | 9 | Critical: Agent must NOT make false claims about authenticity. If unsure, should say "I'll check with Diana" or use product description verbatim. |
| INT | 6 | Product description available via `get_product` but no structured "authenticity" field. |
| GAP | 6 | **No structured product authenticity metadata.** Should have a field in product catalog for "type: original/inspired/replica" that the agent can reference. Also, Diana might want a standard response configured for this common question. |

**Gaps Flagged:**
- 🟡 **No authenticity metadata** in product catalog.
- 🟡 **No FAQ/canned response system** — Diana gets this question constantly. Should have configurable FAQ answers for common questions.

---

## STOCK & AVAILABILITY (Scenarios 9–12)

### Scenario 9: "Todavía hay el pantalón cargo talla 28?"

**Customer message:**
> holaaa todavia hay el pantalon cargo en 28?? 😍 el q subiste la semana pasada porfa dime q si 🙏✨

**Expected agent behavior:**
1. Search for cargo pants in the catalog
2. Check stock for size 28
3. Respond with availability

**Analysis:**

| Dim | Score | Notes |
|-----|-------|-------|
| ACC | 7 | Standard stock check flow. Same variant search limitation as S1. |
| TON | 8 | yaya-inventory examples are warm and helpful. "¡Sí, tenemos disponible!" |
| FLO | 8 | Clean: search → check → respond. |
| SAF | 9 | Checks before promising ✅. Shows scarcity honestly ("solo quedan 2") ✅. |
| INT | 7 | `check_stock` works but variant handling is weak. |
| GAP | 7 | Same variant search gap. Otherwise solid for basic stock checks. |

---

### Scenario 10: "Avísame cuando llegue más stock del vestido floral, me quedé sin 😭"

**Customer message:**
> nooo amigaaaa me quede sin el vestido floral?? 😭😭 avisame cuando llegue mas x fa tb quiero los aretes q combinan 💕 ponme en lista de espera si hay pls ✨

**Expected agent behavior:**
1. Confirm out-of-stock status
2. Add customer to waitlist/wishlist
3. Set up restock notification via yaya-followup

**Analysis:**

| Dim | Score | Notes |
|-----|-------|-------|
| ACC | 9 | yaya-inventory describes wishlist tracking + restock notifications ✅. yaya-followup has restock notification capability ✅. yaya-notifications can batch-notify waitlisted customers ✅. |
| TON | 8 | "¡Anotado! Te aviso apenas lleguen 📝✅" — good. |
| FLO | 9 | Natural: confirm OOS → offer waitlist → confirm registration. |
| SAF | 8 | No false promises. |
| INT | 7 | CRM logging for wishlist works via `crm-mcp → tag_contact` or `log_interaction`. But **no dedicated wishlist table/tool**. The skill describes it but there's no `add_to_wishlist` MCP tool. Would need to be implemented as CRM tags/notes. |
| GAP | 6 | **No dedicated wishlist MCP tool.** yaya-inventory references "customer wishlist items" but no tool exists for structured wishlist management. Using CRM tags works but is hacky. Also, automatic restock → notify pipeline is described but not connected (yaya-notifications checks for restock but needs a structured wishlist data source). |

**Gaps Flagged:**
- 🟡 **No wishlist MCP tool** — Described in skills but not implemented as a structured tool. Relies on CRM tags.
- 🟡 **Restock → notify pipeline** depends on unstructured data matching.

---

### Scenario 11: "Tienes algo para ir a una boda? Talla S" (open-ended search)

**Customer message:**
> amigaaaa ayudamee 😩 tengo una boda el sabado y no tengo q ponerme 💀 tienes algo lindo talla S?? algo elegante pero no tan formal, q se vea chic 💃✨ presupuesto maximo como S/200

**Expected agent behavior:**
1. Natural language product discovery
2. Search by category (formal/semi-formal dresses), filter by size S
3. Recommend 2-3 options within budget
4. Cross-sell accessories

**Analysis:**

| Dim | Score | Notes |
|-----|-------|-------|
| ACC | 5 | `search_products` is keyword-based only. "algo para una boda" → what query? "vestido"? "vestido elegante"? The search is `item_name LIKE %query%`, not semantic. If Diana's items are named "Vestido Cocktail Azul" the agent needs to know to search for "vestido" or "cocktail". No semantic/vector search. |
| TON | 8 | Great opportunity for the agent to be a personal stylist. yaya-sales skill allows for recommendations. |
| FLO | 6 | Depends heavily on search quality. If search returns good results, flow is great. If not, agent flounders. |
| SAF | 7 | Budget constraint needs to be respected. |
| INT | 4 | **Search is too primitive for open-ended discovery.** No category browsing, no attribute filters (style, occasion, price range), no semantic search. `search_products` can only do name matching. |
| GAP | 4 | **CRITICAL GAP: No semantic product search.** For a fashion boutique, customers describe what they want ("something elegant for a wedding"), not product names. Need: semantic/vector search over product descriptions, or at minimum category + attribute filtering. Also no price range filter in search. |

**Gaps Flagged:**
- 🔴 **No semantic product search** — Fashion customers describe needs, not SKUs.
- 🔴 **No attribute/category filter in search** — Can't filter by price range, occasion, style.
- 🟡 **No cross-sell/upsell logic** — Agent should suggest matching accessories.

---

### Scenario 12: "Cuántas unidades te quedan del crop top blanco?" (Diana to agent)

**Customer message (from Diana, the business owner):**
> oye cuantas unidades me quedan del crop top blanco en todas las tallas?? necesito saber si pido más a mi proveedor

**Expected agent behavior:**
1. Recognize this is the business owner (different from customer queries)
2. Show exact stock numbers by variant/size
3. Include sales velocity and reorder recommendation

**Analysis:**

| Dim | Score | Notes |
|-----|-------|-------|
| ACC | 8 | yaya-inventory explicitly differentiates owner queries (full transparency, exact numbers) ✅. |
| TON | 7 | Owner queries should be direct and data-rich. Less emoji, more numbers. |
| FLO | 8 | Search → full stock report → reorder suggestion. Good flow. |
| SAF | 9 | Owner gets full data including costs. Correct. |
| INT | 7 | `check_stock` gives warehouse-level qty ✅. But `search_products` + `check_stock` per variant is N+1 queries. No "get all variants with stock" single call. |
| GAP | 6 | **No owner/customer mode detection.** How does the agent know this is Diana and not a customer? yaya-crm mentions distinguishing owner vs customer but doesn't specify the mechanism. If Diana messages from the same WhatsApp number as the business, this is trivial. If from a personal number, needs config. Also, no supplier reorder tool beyond `create_purchase_order` — no "smart reorder suggestion" tool that calculates optimal quantities. |

**Gaps Flagged:**
- 🟡 **No explicit owner identification mechanism** — Skill mentions it but no concrete implementation (phone number whitelist? config?).
- 🟡 **No smart reorder calculation tool** — yaya-inventory describes reorder suggestions but the actual calculation (sales velocity × lead time) has no MCP tool. Agent would need to query sales data + stock and compute manually.

---

## BULK / WHOLESALE (Scenarios 13–14)

### Scenario 13: "Soy de Huancayo y quiero revender tu ropa, me haces precio por mayor?"

**Customer message:**
> hola diana!! soy de huancayo y tengo mi tiendita aca 🏪 quiero revender tu ropa, me haces precio por mayor?? sobre todo los vestidos q se ven bien bonitos 😍 mandame lista de precios mayorista x fa ✨

**Expected agent behavior:**
1. Recognize wholesale inquiry
2. Either provide wholesale pricing or escalate to Diana
3. Capture lead as potential wholesale customer

**Analysis:**

| Dim | Score | Notes |
|-----|-------|-------|
| ACC | 6 | yaya-escalation mentions `BULK_ORDER_THRESHOLD` for escalation ✅. yaya-sales mentions "Price Negotiation — Apply business rules for discounts, bundles". But **no wholesale pricing tier system**. |
| TON | 7 | Should be professional but still friendly. Wholesale customers are B2B. |
| FLO | 6 | If no wholesale pricing exists, agent must escalate to Diana. Flow: "Great interest! Let me connect you with Diana for wholesale pricing." Functional but not self-service. |
| SAF | 8 | Correctly escalates high-value/bulk inquiries ✅. |
| INT | 5 | ERPNext supports Price Lists (could have "Wholesale" price list) and `get_item_price` accepts `price_list` parameter ✅. But no tool to generate a full wholesale catalog/price list. |
| GAP | 5 | **No wholesale/B2B skill.** Diana's persona says she's growing and wholesale inquiries are common. Need: wholesale customer registration, tiered pricing, minimum order quantities, wholesale price lists. ERPNext has the backend capability (Price Lists, Customer Groups) but no skill orchestrates the wholesale flow. |

**Gaps Flagged:**
- 🟡 **No wholesale flow skill** — Common request for growing boutiques. Need tiered pricing, MOQs, wholesale catalog generation.
- 🟡 **No automatic wholesale price list generation** — Must be manually configured in ERPNext.

---

### Scenario 14: "Si compro 10 vestidos iguales, cuánto me sale cada uno?"

**Customer message:**
> y si compro 10 vestidos del mismo modelo cuanto me sale cada uno?? osea x mayor 🤔 tambien quiero saber si me haces precio en los bolsos si compro 20 💼

**Expected agent behavior:**
1. Check for volume/quantity pricing rules
2. Calculate per-unit price at bulk quantity
3. Provide quote for both items

**Analysis:**

| Dim | Score | Notes |
|-----|-------|-------|
| ACC | 7 | `get_item_price` accepts `qty` parameter for volume discounts ✅. ERPNext Pricing Rules support min_qty discounts ✅. But only if Diana has configured pricing rules in ERPNext. |
| TON | 7 | Clear, transactional. |
| FLO | 7 | Check prices → provide quote → offer to create order. |
| SAF | 8 | Should not invent discounts that Diana hasn't configured. |
| INT | 7 | `get_item_price(item_code, qty=10)` → checks pricing rules ✅. `create_quotation` for formal quote ✅. |
| GAP | 6 | If no pricing rules are configured in ERPNext (likely for Diana who does everything mentally), agent can only quote standard price and suggest Diana set up volume discounts. Need a simpler way for Diana to say "10+ units = 15% off" without navigating ERPNext UI. |

**Gaps Flagged:**
- 🟡 **Pricing rule setup is enterprise-complex** — Diana needs a chat-based way to set discount rules ("if they buy 10+ give 15% off").

---

## RETURNS & PROBLEMS (Scenario 15)

### Scenario 15: "Amiga la talla me quedó grande, quiero cambiar por una S 😣"

**Customer message:**
> amigaaa 😣 el vestido me quedo re grande, soy mas flaca d lo q pensé jajaja 😅 puedo cambiar x una S?? no lo use ni nada, todavia tiene la etiqueta 💕 x fa dimee q si 🙏

**Expected agent behavior:**
1. Look up customer's recent order
2. Verify within exchange window (15 days)
3. Check stock for size S
4. Process exchange (return talla M + issue talla S)
5. Provide exchange instructions

**Analysis:**

| Dim | Score | Notes |
|-----|-------|-------|
| ACC | 9 | yaya-returns has excellent exchange flow ✅. Size issues = auto-approve for exchange ✅. 15-day exchange window ✅. |
| TON | 8 | Examples show empathy ("¡Claro que sí!") + clear instructions ✅. Matches Diana's warm style. |
| FLO | 9 | Excellent flow: verify order → check eligibility → check stock for S → provide exchange instructions → create RMA. |
| SAF | 9 | Checks stock for replacement before promising ✅. Creates RMA for tracking ✅. Customer pays return shipping for size issues ✅ (per policy). |
| INT | 8 | `payments-mcp → create_return_authorization` handles RMA creation ✅. `erpnext-mcp → check_stock` for replacement size ✅. Stock entry for return ✅. **But**: exchange = return + new order. Need to create new order for S after processing return of M. Two-step transaction not explicitly handled as atomic. |
| GAP | 7 | **No atomic exchange operation.** Exchange requires: (1) create RMA for M, (2) create new order for S, (3) link them. Currently these are separate tool calls. If step 2 fails (S is out of stock after RMA created), need rollback logic. yaya-returns skill describes this edge case ("Stock unavailable for exchange") but the MCP tools don't support atomic exchange transactions. Also: **no exchange-without-refund flow** in payments-mcp — there's `process_refund` but no `process_exchange`. |

**Gaps Flagged:**
- 🟡 **No atomic exchange tool** — Exchange is 2+ separate operations. Race condition possible if replacement sells out mid-exchange.
- 🟡 **No "process_exchange" in payments-mcp** — Only `process_refund`. Exchange needs a different flow (no money changes hands if same price).
- 🟡 **Return shipping logistics** — Agent tells customer to return the item but no tool generates a return shipping label or provides courier options.

---

## OVERSELLING PREVENTION — CRITICAL ANALYSIS

Diana's #1 pain point: **She has 3 items, 5 people want it.**

### How the platform handles this:

**What's designed:**
- yaya-inventory says "Reserve stock on order creation. Decrement available stock immediately when an order is placed. Restore if the order expires without payment." ✅
- `INVENTORY_RESERVATION_TIMEOUT_HOURS` (default: 48h) ✅
- "Race condition on stock: Two customers could try to buy the last unit simultaneously. Use stock reservation to prevent overselling." ✅

**What's actually implemented:**
- `erpnext-mcp → create_order` creates a Sales Order — ERPNext can reserve stock via "Reserve Stock" setting ✅
- `erpnext-mcp → check_stock` returns `actual_qty` and `projected_qty` — projected accounts for reservations ✅
- `erpnext-mcp → cancel_order` can release stock ✅

**Gaps in overselling prevention:**
- 🔴 **No explicit stock reservation MCP tool.** The skill describes reserving stock independently of order creation, but the only way to reserve is to create a full Sales Order. What if a customer is interested but hasn't committed? No "soft hold" mechanism.
- 🔴 **No real-time concurrency control.** If 5 customers message simultaneously about 3 items, the agent processes them sequentially (per conversation) but there's no cross-conversation lock. Customer A's stock check might return 3 available, and before their order is created, Customer B also sees 3 available. ERPNext's own concurrency is the only safeguard.
- 🟡 **48-hour reservation timeout** may be too long for Diana's fast-moving inventory. Fashion items sell in hours, not days. Should be configurable per item velocity.
- 🟡 **No "low stock broadcast"** — When stock drops to 1-2 units, agent should proactively tell the current customer "there's only 1 left, want me to reserve it for you?" This is described in yaya-inventory (scarcity messaging) but the trigger mechanism isn't clear.

**Overselling Score: 6/10** — The design is solid but the implementation relies entirely on ERPNext's native stock reservation. For Diana's scenario (multiple WhatsApp conversations happening simultaneously for the same 3 items), the platform needs a faster, conversation-level stock hold mechanism.

---

## WHATSAPP FORMATTING — COMPLIANCE CHECK

| Requirement | Status | Notes |
|-------------|--------|-------|
| No markdown tables | ✅ | All skills explicitly say "no tables, use bullet lists" |
| Emoji usage | ✅ | Extensive emoji guidance throughout |
| Message length | ✅ | yaya-analytics mentions 4096 char limit per WhatsApp message |
| Bullet lists | ✅ | Primary formatting method |
| Bold/emphasis | ⚠️ | Skills use markdown bold (`**text**`) — works in WhatsApp ✅ but some examples also use `━━━━` line separators which may render differently |
| Voice notes | ✅ | yaya-sales handles voice note transcription via Whisper |
| Image handling | ✅ | yaya-payments handles payment screenshot OCR |
| Links | ⚠️ | No explicit guidance on link formatting in WhatsApp (no markdown links) |

**WhatsApp Formatting Score: 8/10**

---

## INSTAGRAM INTEGRATION — CRITICAL MISSING PIECE

Diana's entire business model: **Post on Instagram → Customers ask on WhatsApp → Sell.**

**What exists:** Nothing. Zero Instagram integration.

**What's needed:**
1. **Instagram catalog sync** — Map IG posts/stories to ERPNext products
2. **"I saw it on your Insta" product lookup** — When customer describes an IG post, find the corresponding product
3. **IG post performance → sales correlation** — Which posts generate the most WhatsApp inquiries?
4. **IG bio status updates** — Auto-update "DISPONIBLE ✅" / "AGOTADO ❌" in bio
5. **Story/post scheduling** — Help Diana plan content (stretch goal)

**Instagram Integration Score: 0/10** — Complete gap. This is arguably the #1 integration Diana needs after WhatsApp.

---

## SUMMARY SCORECARD

| Scenario | ACC | TON | FLO | SAF | INT | GAP | AVG |
|----------|-----|-----|-----|-----|-----|-----|-----|
| S1: Product inquiry from IG | 8 | 7 | 8 | 9 | 7 | 5 | 7.3 |
| S2: Price + shipping | 6 | 7 | 7 | 8 | 4 | 3 | 5.8 |
| S3: Multi-item bundle | 7 | 6 | 7 | 7 | 7 | 5 | 6.5 |
| S4: Payment info request | 9 | 8 | 9 | 10 | 9 | 8 | 8.8 |
| S5: Yape screenshot confirm | 8 | 8 | 8 | 9 | 9 | 7 | 8.2 |
| S6: Delivery ETA | 5 | 7 | 5 | 7 | 3 | 3 | 5.0 |
| S7: Color variant + competitor | 6 | 7 | 7 | 8 | 5 | 6 | 6.5 |
| S8: Authenticity question | 6 | 7 | 6 | 9 | 6 | 6 | 6.7 |
| S9: Stock check | 7 | 8 | 8 | 9 | 7 | 7 | 7.7 |
| S10: Waitlist/restock alert | 9 | 8 | 9 | 8 | 7 | 6 | 7.8 |
| S11: Open-ended discovery | 5 | 8 | 6 | 7 | 4 | 4 | 5.7 |
| S12: Owner stock query | 8 | 7 | 8 | 9 | 7 | 6 | 7.5 |
| S13: Wholesale inquiry | 6 | 7 | 6 | 8 | 5 | 5 | 6.2 |
| S14: Volume pricing | 7 | 7 | 7 | 8 | 7 | 6 | 7.0 |
| S15: Size exchange | 9 | 8 | 9 | 9 | 8 | 7 | 8.3 |

**Overall Average: 7.0/10**

---

## TOP PRIORITY GAPS (Ranked by Impact on Diana)

### 🔴 P0 — Critical (Blocks Daily Operations)

1. **No shipping/courier integration** — Diana ships 15-20 packages daily. No rate calculator, no tracking, no courier API (Olva, Shalom). Blocks scenarios 2, 6, and the daily shipping workflow.

2. **No Instagram catalog integration** — 100% of Diana's product discovery happens on Instagram. Zero connection to the platform. Blocks accurate product identification in scenarios 1, 2, 7, 11.

3. **No semantic product search** — Fashion customers describe needs ("something for a wedding"), not SKUs. Current keyword search is insufficient for open-ended discovery (scenario 11).

### 🟡 P1 — Important (Degrades Experience)

4. **No variant/attribute search** — Can't query by size, color, style, price range. Forces workarounds for every stock check involving variants.

5. **No delivery tracking** — Customers constantly ask "when does it arrive?" and agent can't answer.

6. **No wishlist MCP tool** — Described in skills but not implemented. Restock notifications depend on it.

7. **No lightweight discount configuration** — Diana's pricing rules are informal. ERPNext pricing rules are too complex for a solo operator.

8. **No FAQ/canned response system** — Diana answers the same questions 30-50 times daily ("envían a provincias?", "es original?", "cuánto cuesta el envío?").

### 🟢 P2 — Nice to Have

9. **No atomic exchange operation** — Exchange flow works but isn't transactional.
10. **No wholesale flow** — Growing need but not daily critical.
11. **No Yape QR sharing** — Minor convenience.
12. **Owner identification mechanism** — Needs explicit config.

---

## WHAT WORKS WELL ✅

1. **Payment validation pipeline** — Yape screenshot → OCR → match → confirm is excellent. Best-designed flow.
2. **Returns skill** — Comprehensive, empathetic, well-structured with clear policies and escalation rules.
3. **CRM auto-capture** — Silent data capture from conversations is well-designed.
4. **Escalation system** — Frustration detection, owner notification with context summary, graceful handoff.
5. **WhatsApp formatting** — Consistent "no tables, use emoji bullets" across all skills.
6. **Follow-up system** — Payment reminders with escalating tone, abandoned conversation recovery, restock notifications.
7. **Stock alert system** — Multi-level alerts (low/critical/OOS/restocked) with good notification design.
8. **Analytics reporting** — Daily/weekly/monthly reports are well-formatted and actionable.

---

## RECOMMENDATIONS

1. **Build `yaya-shipping` skill + `shipping-mcp` server** — Integrate Olva Courier and Shalom APIs for rate quotes and tracking. Add Peru geography → shipping zone mapping.

2. **Build Instagram catalog bridge** — Even a simple "Diana tags each IG post with an ERPNext item code" system would close the biggest gap. Could use IG post captions or a separate mapping file.

3. **Add semantic search to `erpnext-mcp`** — Either vector embeddings on product descriptions, or at minimum, category + attribute filter parameters to `search_products`.

4. **Add variant-aware stock check** — `check_stock_by_attribute(item_group, size, color)` tool.

5. **Add FAQ/quick-reply config** — Let Diana define common Q&As that the agent can respond to instantly without tool calls.

6. **Simplify discount config** — Chat-based discount rule setup: "Diana: 3+ items = 10% off" → auto-creates pricing rule.

7. **Add soft stock hold** — 30-minute reservation before order creation for high-interest conversations. Reduces overselling risk.
