# Test Evaluation: Carlos Medrano — DAILY Scenarios (1-8)

**Persona:** Carlos Medrano, 33, Lima, Peru. MedranoCorp SAC — import/export electronics accessories & Peruvian superfoods.  
**Date:** 2026-03-20  
**Evaluator:** Yaya Platform Test Agent

---

## Scenario 1: Stock Check — iPhone 15 Cases

### Carlos's Message
> "Oye cuantas fundas iPhone 15 me quedan en stock??"

### Skill Activation
- **Primary:** `yaya-inventory` — triggered by "cuántas... me quedan en stock"
- **Secondary:** None

### MCP Tools Called
1. `erpnext-mcp → search_products` (query: "funda iPhone 15") — to find the item codes
2. `erpnext-mcp → check_stock` (item_code: result, warehouse: "Callao") — for each variant

### Ratings
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 10 | Core inventory skill, straightforward query |
| Accuracy | 9 | Direct ERPNext stock lookup; depends on warehouse data being up-to-date |
| Speed | 9 | 2 API calls max, sub-second response |
| Completeness | 8 | Can show stock per variant (color/model) but might miss in-transit stock |
| Delight | 8 | Business owner gets full numbers + variant breakdown |
| Safety | 10 | Read-only query, no risk |

### Gaps
- **Missing:** No tool to show in-transit inventory (containers from China en route). Carlos imports from Shenzhen and would want to know what's coming.
- **Missing:** No `crm-mcp` integration to show "X customers asked about this product this week" alongside stock data.
- **Minor:** `search_products` uses simple `LIKE` matching — "funda iPhone 15" might not match item names stored as "Funda para iPhone 15 Pro Max" or "Case iPhone 15". Needs fuzzy/full-text search.

### Ideal Agent Response
> 📦 Inventario de Fundas iPhone 15 — Almacén Callao:
> 
> • Funda iPhone 15 (negro) — 23 unidades
> • Funda iPhone 15 (transparente) — 15 unidades
> • Funda iPhone 15 Pro Max (negro) — 8 unidades ⚠️ stock bajo
> • Funda iPhone 15 Pro Max (azul) — 31 unidades
> 
> Total: 77 fundas iPhone 15
> 
> 🔥 La Pro Max negra se está vendiendo rápido (6/semana). A este ritmo se agota en ~9 días.
> ¿Quieres que prepare una sugerencia de reposición?

---

## Scenario 2: Payment Verification — Yape Screenshot

### Carlos's Message
> [Envía screenshot de Yape]
> "Confirma el pago de la señora Gutiérrez"

### Skill Activation
- **Primary:** `yaya-payments` — triggered by image + "confirma el pago"
- **Secondary:** `yaya-inventory` (stock reservation update after confirmation)

### MCP Tools Called
1. Vision/OCR on the Yape screenshot (Qwen3.5-27B) — extract amount, reference #, date, sender name
2. `erpnext-mcp → list_customers` (query: "Gutiérrez") — find the customer
3. `erpnext-mcp → list_orders` (customer: "Gutiérrez", status: "To Deliver and Bill") — find pending orders
4. `erpnext-mcp → update_order` or `erpnext-mcp` payment entry (not explicitly available) — mark as paid
5. `postgres-mcp` — store receipt hash for duplicate detection
6. `crm-mcp` — log payment interaction

### Ratings
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 9 | Core payment skill, well-designed flow |
| Accuracy | 8 | OCR on Yape screenshots is good but not perfect; confirmation step mitigates errors |
| Speed | 7 | Multi-step: OCR → search customer → match order → confirm. ~3-5 seconds |
| Completeness | 7 | Handles matching and confirmation well, but lacks a dedicated "record payment entry" MCP tool |
| Delight | 9 | Celebration on confirmation ("¡Pago confirmado! ✅"), professional flow |
| Safety | 9 | Confirms with Carlos before finalizing; duplicate detection; never handles credentials |

### Gaps
- **Critical:** `erpnext-mcp` has no `record_payment_entry` tool. The server exposes `update_order` but not a proper Payment Entry creation in ERPNext. Marking an order as "paid" requires creating a Payment Entry doctype, not just updating the Sales Order.
- **Missing:** No bulk payment reconciliation tool — Carlos receives 20+ screenshots/day and would benefit from batch processing.
- **Missing:** The `crm-mcp` and `postgres-mcp` servers are referenced in the skill but not implemented yet.
- **Minor:** Carlos says "la señora Gutiérrez" — the system needs to fuzzy-match customer names (Gutiérrez, Gutierrez, GUTIÉRREZ, etc.).

### Ideal Agent Response
> 📸 Recibido! Veo tu comprobante:
> 
> 💜 Yape por S/185.00
> 📝 Referencia: YP-2026-8F3K21
> 📅 Fecha: 20/03/2026
> 👤 De: Rosa Gutiérrez
> 
> Esto coincide con el pedido #SO-00347 de la Sra. Gutiérrez (10 cables tipo C — S/185.00).
> 
> ✅ Pago confirmado y registrado. El pedido pasa a preparación.

---

## Scenario 3: Price Lookup with IGV

### Carlos's Message
> "Necesito el precio del cargador USB-C para un cliente, con IGV incluido"

### Skill Activation
- **Primary:** `yaya-inventory` — triggered by price inquiry
- **Secondary:** `yaya-sales` — context is "para un cliente" (customer-facing pricing)

### MCP Tools Called
1. `erpnext-mcp → search_products` (query: "cargador USB-C") — find matching products
2. `erpnext-mcp → get_item_price` (item_code: result) — get pricing details

### Ratings
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 9 | Straightforward price lookup |
| Accuracy | 7 | Price from ERPNext is accurate, but IGV calculation is a gap |
| Speed | 9 | 2 quick API calls |
| Completeness | 6 | IGV (18%) calculation not built into any tool — agent must compute manually |
| Delight | 7 | Can show prices clearly, but tax logic is improvised |
| Safety | 9 | Read-only; won't expose cost/margin to customer |

### Gaps
- **Significant:** No IGV/tax calculation tool. Peru's IGV is 18%, and Carlos needs prices with tax included. ERPNext stores prices but the MCP server doesn't expose tax template info. The agent must know to multiply by 1.18, which is fragile.
- **Missing:** No exchange rate tool. Carlos often needs to convert PEN ↔ USD for pricing decisions. This scenario could easily chain into "¿y cuánto es en dólares?"
- **Minor:** Multiple USB-C chargers may exist (different wattages, brands). Agent should present options.

### Ideal Agent Response
> 🔌 Cargadores USB-C disponibles:
> 
> | Producto | Precio (sin IGV) | Precio (con IGV) |
> |----------|-------------------|-------------------|
> | Cargador USB-C 20W | S/25.00 | S/29.50 |
> | Cargador USB-C 65W GaN | S/55.00 | S/64.90 |
> | Cargador USB-C 100W PD | S/85.00 | S/100.30 |
> 
> IGV incluido (18%). ¿Cuál le paso al cliente?

---

## Scenario 4: Order Creation — Multi-item with Delivery

### Carlos's Message
> "Registra este pedido: 10 fundas iPhone 15 pro max negro, 5 cables tipo C 2m, para Juan Pérez, delivery a San Borja"

### Skill Activation
- **Primary:** `yaya-sales` — order creation
- **Secondary:** `yaya-inventory` — stock validation before committing

### MCP Tools Called
1. `erpnext-mcp → search_products` (query: "funda iPhone 15 pro max negro") — resolve item code
2. `erpnext-mcp → search_products` (query: "cable tipo C 2m") — resolve item code
3. `erpnext-mcp → check_stock` (each item) — verify availability
4. `erpnext-mcp → list_customers` (query: "Juan Pérez") — find or create customer
5. `erpnext-mcp → create_customer` (if not found) — create Juan Pérez
6. `erpnext-mcp → create_order` (customer, items, notes: "delivery a San Borja")

### Ratings
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 9 | Core order flow, well-supported |
| Accuracy | 8 | Product matching from natural language to item codes is the tricky part |
| Speed | 6 | 5-6 API calls sequentially. Could take 5-8 seconds. |
| Completeness | 6 | Order created but delivery address/logistics not handled |
| Delight | 7 | Confirmation with summary is nice; missing delivery coordination |
| Safety | 8 | Stock check before committing prevents overselling |

### Gaps
- **Critical:** No delivery/logistics tools. Carlos coordinates with a driver for Lima metropolitan deliveries. "delivery a San Borja" is a delivery instruction, but there's no MCP tool to create a delivery note, assign a driver, or set a delivery address on the order.
- **Missing:** `create_order` doesn't accept a delivery address field. ERPNext Sales Orders support `shipping_address_name` but the MCP tool doesn't expose it.
- **Missing:** No tool to notify the driver or create a delivery task.
- **Missing:** No automatic price calculation in the order. Carlos says "10 fundas" but doesn't specify price — the agent should pull it from `get_item_price` automatically.
- **Minor:** Natural language → item_code mapping ("fundas iPhone 15 pro max negro") depends on `search_products` fuzzy matching quality.

### Ideal Agent Response
> ✅ Pedido registrado — #SO-00412
> 
> 👤 Cliente: Juan Pérez
> 📦 Items:
> • 10x Funda iPhone 15 Pro Max (negro) — S/15 c/u = S/150.00
> • 5x Cable USB-C 2m — S/12 c/u = S/60.00
> 
> 💰 Total: S/210.00 (+ IGV: S/247.80)
> 🚚 Delivery: San Borja
> 
> Métodos de pago:
> 💜 Yape al 938-438-401
> 🏦 BCP cuenta 123-456-789
> 
> ¿Le mando los datos de pago al cliente?

---

## Scenario 5: Pending Payments Query

### Carlos's Message
> "Qué pedidos tengo pendientes de pago hoy?"

### Skill Activation
- **Primary:** `yaya-payments` — payment status query
- **Secondary:** `yaya-sales` — order listing

### MCP Tools Called
1. `erpnext-mcp → list_orders` (status: "To Deliver and Bill", from_date: today, to_date: today) — pending payment orders
2. Possibly `erpnext-mcp → list_orders` (status: "To Bill") — delivered but unpaid

### Ratings
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 9 | Direct order listing with status filter |
| Accuracy | 8 | ERPNext status "To Deliver and Bill" maps well to "pendiente de pago" |
| Speed | 8 | 1-2 API calls |
| Completeness | 7 | Shows orders but doesn't aggregate totals or age the debt |
| Delight | 7 | Useful list but could be richer with payment aging |
| Safety | 10 | Read-only, internal business query |

### Gaps
- **Missing:** No aging analysis — Carlos doesn't just want today's pending, he wants to know which are overdue. `list_orders` doesn't support "days since order" natively.
- **Missing:** No payment reminder tool. After seeing the list, Carlos's next action is "send a reminder to customer X" — no automated follow-up capability.
- **Missing:** No aggregation in the MCP tool — agent must sum totals in-context, which works but isn't robust for large order sets.
- **Note:** "hoy" is ambiguous — Carlos might mean "orders placed today that haven't been paid" or "all unpaid orders as of today." The agent should clarify or default to "all currently unpaid."

### Ideal Agent Response
> 📋 Pedidos pendientes de pago — 20/03/2026:
> 
> 🔴 Vencidos (>48h):
> • #SO-00389 — María López — S/350.00 (hace 3 días)
> • #SO-00391 — Pedro Salas — S/128.00 (hace 2 días)
> 
> 🟡 Pendientes de hoy:
> • #SO-00408 — Rosa Gutiérrez — S/185.00
> • #SO-00410 — Ana Torres — S/92.00
> • #SO-00411 — Carlos Ruiz — S/445.00
> 
> 💰 Total por cobrar: S/1,200.00
> 
> ¿Quieres que les mande recordatorio de pago a los vencidos?

---

## Scenario 6: Weekly Sales Summary (Voice Note)

### Carlos's Message
> 🎤 [Nota de voz en español, ~15 segundos]:
> "Necesito que me digas cuánto vendimos esta semana y cuál fue el producto más vendido"

### Skill Activation
- **Primary:** `yaya-sales` — voice note handling (Whisper transcription) + sales reporting
- **Secondary:** `yaya-inventory` — product-level sales data

### MCP Tools Called
1. Whisper transcription (language: es) — voice → text
2. `erpnext-mcp → list_orders` (from_date: Monday, to_date: today, status: "Completed" or all non-cancelled) — week's orders
3. `postgres-mcp` — aggregate sales by product for top sellers (if available)

### Ratings
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 7 | Voice transcription works, but reporting is limited |
| Accuracy | 6 | `list_orders` returns orders but not line-item breakdown. Aggregating "most sold product" requires iterating through each order's items |
| Speed | 5 | Whisper transcription + multiple API calls to fetch and aggregate. Could take 10-15 seconds |
| Completeness | 5 | No dedicated sales reporting/analytics tool. Must reconstruct from raw orders |
| Delight | 6 | Results will be useful but may miss comparisons, trends, charts |
| Safety | 10 | Read-only analytics query |

### Gaps
- **Critical:** No sales analytics/reporting MCP tool. There's no `get_sales_summary` or `get_top_products` tool. The agent would need to: (a) list all orders for the week, (b) fetch each order's line items via `get_order`, (c) aggregate manually. This is slow and fragile for 50-100+ orders.
- **Critical:** `list_orders` returns order-level data (customer, total, status) but not line items. No way to determine "most sold product" without fetching each order individually.
- **Missing:** `postgres-mcp` is referenced for complex reporting but not implemented.
- **Missing:** No comparison to prior week. Carlos would naturally want "compared to last week" context.
- **Missing:** No visualization/chart capability for WhatsApp.

### Ideal Agent Response
> 📊 Resumen de ventas — Semana del 16 al 20 de Marzo:
> 
> 💰 Ventas totales: S/8,450.00 (32 pedidos)
> 📈 vs semana anterior: +12% (+S/920)
> 
> 🏆 Top 5 productos:
> 1. Cable USB-C 2m — 45 unidades (S/540)
> 2. Funda iPhone 15 Pro Max — 38 unidades (S/570)
> 3. Cargador USB-C 20W — 22 unidades (S/550)
> 4. Audífonos Bluetooth — 15 unidades (S/1,125)
> 5. Funda iPhone 15 transparente — 12 unidades (S/108)
> 
> 💡 El cable USB-C sigue siendo tu campeón. Las fundas iPhone 15 subieron 25% esta semana.

---

## Scenario 7: Payment Search by Amount

### Carlos's Message
> "El cliente dice que ya pagó pero no veo el Yape, búscalo por S/150"

### Skill Activation
- **Primary:** `yaya-payments` — payment search/reconciliation

### MCP Tools Called
1. `erpnext-mcp → list_orders` (status: "To Deliver and Bill") — get pending orders
2. Filter in-context for orders totaling ~S/150 (±1% tolerance per skill config)
3. `postgres-mcp` — search payment receipt history for S/150 amount (if implemented)

### Ratings
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 6 | Partially supported — can search orders by amount, but can't search Yape transaction history |
| Accuracy | 5 | Can find matching orders, but can't verify if a payment was actually made in Yape |
| Speed | 7 | Quick order search, but may not find the answer |
| Completeness | 4 | Cannot access Yape/bank transaction feeds to verify incoming payments |
| Delight | 5 | Can narrow down candidates but can't definitively resolve the issue |
| Safety | 9 | Won't fabricate payment confirmation |

### Gaps
- **Critical:** No Yape/bank API integration. The system can only verify payments via screenshots. If Carlos didn't receive a screenshot, the agent has no way to check if a Yape payment of S/150 was actually received. This is one of Carlos's biggest pain points ("Payment verification hell").
- **Critical:** No `search_payments` MCP tool to search by amount across recorded payment entries.
- **Missing:** No Yape webhook or notification integration to auto-capture incoming payments.
- **Missing:** `postgres-mcp` for payment audit trail isn't implemented yet.
- **Workaround:** The agent can find orders around S/150 and tell Carlos which customer/order it might be, then ask Carlos to check his Yape app manually.

### Ideal Agent Response
> 🔍 Buscando pagos por S/150...
> 
> Encontré 2 pedidos pendientes por montos cercanos a S/150:
> 
> 1. #SO-00403 — Ana Torres — S/150.00 (cable USB-C x10 + funda x2)
> 2. #SO-00407 — Luis Mendoza — S/148.00 (cargador 65W x2 + cable x2)
> 
> No tengo registro de un comprobante de Yape por ese monto.
> 
> 💡 Sugerencia: Revisa tu historial de Yape para un pago de S/150 y envíame el screenshot. También puedes preguntarle al cliente su nombre de Yape o los últimos 4 dígitos de su teléfono para ubicarlo.

---

## Scenario 8: Bulk Customer Notification

### Carlos's Message
> "Manda un mensaje a todos los que preguntaron por audífonos esta semana, ya llegó el stock"

### Skill Activation
- **Primary:** `yaya-sales` — follow-up / lead nurturing
- **Secondary:** `yaya-inventory` — confirm restock

### MCP Tools Called
1. `erpnext-mcp → search_products` (query: "audífonos") — confirm stock
2. `erpnext-mcp → check_stock` (item_code: result) — verify availability
3. `crm-mcp` — query customers who inquired about audífonos this week (wishlist/interaction log)

### Ratings
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 3 | Major gaps — CRM inquiry tracking and bulk messaging not implemented |
| Accuracy | 2 | No way to know who asked about audífonos without CRM interaction logging |
| Speed | N/A | Cannot execute |
| Completeness | 2 | Stock check works; everything else is missing |
| Delight | 1 | Cannot fulfill the request at all |
| Safety | 7 | Would need careful opt-in/spam controls if implemented |

### Gaps
- **Critical:** `crm-mcp` is not implemented. No MCP server exists to query customer interaction history ("who asked about X this week").
- **Critical:** No bulk/broadcast messaging tool. Even if the agent found the customer list, there's no way to send WhatsApp messages to multiple contacts.
- **Critical:** No conversation history search. The yaya-sales skill mentions "Lead Capture" and "Follow-up Scheduling" but there's no MCP tool to search past conversations by topic/product.
- **Missing:** WhatsApp Business API integration for broadcast messages.
- **Missing:** Opt-in/consent tracking for marketing messages (required by WhatsApp policy and data protection laws).
- **Missing:** Message template system for restock notifications.
- **Regulatory risk:** Bulk WhatsApp messaging without proper opt-in could get the business number banned.

### Ideal Agent Response (what it SHOULD look like once built)
> ✅ Stock confirmado: Audífonos Bluetooth — 40 unidades disponibles
> 
> 📋 Encontré 7 clientes que preguntaron por audífonos esta semana:
> 1. María López — preguntó el lunes
> 2. Pedro Salas — preguntó el martes
> 3. Ana Torres — preguntó el martes
> 4. Luis Mendoza — preguntó el miércoles
> 5. Carmen Flores — preguntó el jueves
> 6. Diego Ramírez — preguntó el jueves
> 7. Sofía Vargas — preguntó hoy
> 
> 📝 Mensaje sugerido:
> "¡Hola! 👋 Te escribimos de MedranoCorp. Los audífonos Bluetooth que consultaste ya están disponibles — S/75 c/u. ¿Te apartamos uno? 🎧"
> 
> ¿Lo envío a todos o quieres modificar el mensaje primero?

---

## Summary Scorecard

| Scenario | Handleable | Accuracy | Speed | Completeness | Delight | Safety | Avg |
|----------|-----------|----------|-------|--------------|---------|--------|-----|
| 1. Stock check | 10 | 9 | 9 | 8 | 8 | 10 | **9.0** |
| 2. Yape confirmation | 9 | 8 | 7 | 7 | 9 | 9 | **8.2** |
| 3. Price + IGV | 9 | 7 | 9 | 6 | 7 | 9 | **7.8** |
| 4. Order creation | 9 | 8 | 6 | 6 | 7 | 8 | **7.3** |
| 5. Pending payments | 9 | 8 | 8 | 7 | 7 | 10 | **8.2** |
| 6. Weekly sales (voice) | 7 | 6 | 5 | 5 | 6 | 10 | **6.5** |
| 7. Payment search | 6 | 5 | 7 | 4 | 5 | 9 | **6.0** |
| 8. Bulk notification | 3 | 2 | N/A | 2 | 1 | 7 | **2.5** |
| **Average** | **7.8** | **6.6** | **7.3** | **5.6** | **6.3** | **9.0** | **6.9** |

## Critical Gaps — Priority Order

### 🔴 P0 — Blocks core daily workflows
1. **No `crm-mcp` server** — Scenarios 6, 7, 8 depend on CRM for interaction history, customer tracking, and follow-up. This is referenced in every skill but doesn't exist.
2. **No `record_payment_entry` tool in erpnext-mcp** — Can't actually record payments in ERPNext. `update_order` is not a payment entry.
3. **No sales analytics/reporting tool** — Carlos asks for sales summaries daily. Fetching individual orders and aggregating client-side is fragile and slow.

### 🟡 P1 — Degrades experience significantly
4. **No `postgres-mcp` server** — Referenced for reporting, audit trails, and duplicate detection but doesn't exist.
5. **No bulk messaging / broadcast tool** — Carlos wants to notify groups of customers (scenario 8). Common daily need.
6. **No delivery/logistics tools** — `create_order` doesn't handle delivery addresses, driver assignment, or delivery notes.
7. **No IGV/tax calculation** — Every Peru business needs IGV-inclusive pricing. Should be built into price tools or a tax utility.

### 🟠 P2 — Nice to have, improves completeness
8. **No exchange rate tool** — Carlos buys in USD/RMB, sells in PEN. Exchange rate lookup is a daily need.
9. **No Yape/bank API integration** — Can only verify payments via screenshots, not proactively.
10. **`search_products` needs fuzzy matching** — Simple `LIKE` queries miss natural language product names.
11. **No conversation/interaction logging** — Can't search "who asked about X" without CRM.

---

## Conclusion

The platform handles **simple, synchronous queries well** (stock checks, price lookups, basic order creation — scenarios 1-5 score 7.3-9.0). The `erpnext-mcp` server is solid for CRUD operations.

However, **anything requiring cross-system intelligence falls apart** (analytics, payment reconciliation, customer follow-up — scenarios 6-8 score 2.5-6.5). The two missing MCP servers (`crm-mcp` and `postgres-mcp`) are the biggest blockers, as every skill references them.

**Carlos's #1 pain point ("Payment verification hell" — 20+ Yape screenshots/day) is partially addressed** but needs the payment entry tool and ideally Yape API integration to fully solve.

**For Carlos's daily workflow, the platform currently covers ~60% of his needs.** The remaining 40% requires implementing `crm-mcp`, `postgres-mcp`, a reporting/analytics layer, and delivery logistics tools.
