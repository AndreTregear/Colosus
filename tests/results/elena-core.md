# Elena Quispe — Core Operations Test Results

**Persona:** Elena Quispe Huallpa, 45, Cusco restaurant owner (Sabor Cusqueño)
**Test scope:** First half — Core Operations (scenarios 1-14): orders, menu, pricing, payments, allergens, multilingual, invoicing
**Tested by:** Subagent elena-core
**Date:** 2026-03-20
**Rating scale:** 0-10 per dimension (Handleable / Accuracy / Speed / Completeness / Delight / Safety)

---

## Executive Summary

| Dimension | Average | Notes |
|-----------|---------|-------|
| Handleable | 7.2/10 | Most scenarios map to existing skills+tools, but restaurant-specific gaps exist |
| Accuracy | 6.5/10 | Correct for generic commerce; lacks food/restaurant domain knowledge |
| Speed | 8.0/10 | Tool architecture supports fast responses; ERPNext queries are direct |
| Completeness | 5.8/10 | Significant gaps in allergen tracking, menu management, and restaurant ops |
| Delight | 7.0/10 | Good conversational tone in Spanish; Quechua/English support needs work |
| Safety | 4.5/10 | ⚠️ CRITICAL: No dedicated allergen system. Life-safety gap. |

**Overall: 6.5/10 — Functional foundation but NOT restaurant-ready without critical additions.**

---

## Scenario-by-Scenario Analysis

### SCENARIO 1: Daily Menu Update
> "Hoy en el mercado había trucha fresca de Urubamba y rocoto relleno me sale baratísimo. Actualiza el menú del día: entrada ceviche de trucha, fondo rocoto relleno, postre mazamorra morada. Menú a S/18."

**Skills involved:** yaya-sales, yaya-inventory
**MCP tools:** erpnext-mcp (`create_item`, `update_item`, `search_products`)

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Handleable | 6 | Can create/update items in ERPNext, but no "daily menu" concept exists. Menu = a bundle/combo, not a standalone item type. |
| Accuracy | 5 | Item creation works but no menú del día pricing logic (combo entry+main+dessert at fixed price). ERPNext doesn't natively model restaurant menus that change daily. |
| Speed | 7 | Three `create_item` or `update_item` calls + price update are fast |
| Completeness | 4 | **Missing:** No daily menu template system. No integration to post menu to WhatsApp status/Instagram. No market purchase tracking against menu items. No food cost calculation per dish. |
| Delight | 6 | Can respond warmly in Spanish but lacks food industry vocabulary |
| Safety | 5 | No allergen tagging on new menu items |

**Gaps flagged:**
- 🔴 No "menú del día" / combo / set menu concept in ERPNext
- 🔴 No social media posting integration (WhatsApp status, Instagram)
- 🟡 No food cost tracking per dish
- 🟡 No market purchase → menu link

**Ideal response (Spanish):**
> "¡Listo, Elenita! 🐟 Actualicé el menú del día:
>
> 📋 **Menú del Día — S/18**
> • Entrada: Ceviche de trucha 🐟
> • Fondo: Rocoto relleno 🌶️
> • Postre: Mazamorra morada 🍇
>
> ✅ Precio actualizado en el sistema
> 🏷️ Alérgenos marcados: pescado (ceviche), lácteos (rocoto puede llevar queso)
> 📸 ¿Quieres que lo suba a tu estado de WhatsApp e Instagram?
>
> Por cierto, la trucha de Urubamba a buen precio — ¿cuántos kilos compraste? Lo registro para calcular tu food cost del día."

---

### SCENARIO 2: Tourist Group Allergen Request (CRITICAL SAFETY)
> [Voice note] "Yayita, acaba de llegar un grupo de 15 gringos de G Adventures. Necesitan saber qué platos son gluten-free y cuáles tienen nueces. Mándame la lista rápido porfa que están sentándose."

**Skills involved:** yaya-sales (voice), yaya-inventory
**MCP tools:** erpnext-mcp (`search_products`)

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Handleable | 4 | Voice note transcription via Whisper works. But **NO allergen database exists.** ERPNext items have no allergen fields. |
| Accuracy | 2 | ⚠️ **DANGEROUS.** Without a structured allergen matrix, any response is guesswork. The agent would have to rely on general food knowledge, which is insufficient for a Peruvian kitchen where ingredients vary by day and recipe. |
| Speed | 3 | Can't give a fast answer because there's nowhere to look up allergens systematically |
| Completeness | 2 | No allergen matrix, no cross-contamination tracking, no per-dish ingredient list, no translation of allergen info to English |
| Delight | 5 | Would handle the urgency well conversationally |
| Safety | 1 | 🚨 **LIFE-THREATENING GAP.** Nut allergies and celiac disease can cause anaphylaxis and severe reactions. A wrong answer could hospitalize or kill someone. This MUST be built before any restaurant goes live. |

**Gaps flagged:**
- 🚨 **CRITICAL:** No allergen tracking system anywhere in the platform
- 🚨 **CRITICAL:** No per-dish ingredient list in ERPNext
- 🚨 **CRITICAL:** No allergen matrix (dish × allergen cross-reference)
- 🚨 **CRITICAL:** No cross-contamination warnings
- 🔴 No English translation of allergen info for tourists
- 🔴 No "allergen quick card" generation for waitstaff

**Ideal response (bilingual for tourist context):**
> "¡Ya, Elena! 🏃‍♀️ Aquí la lista para el grupo:
>
> ✅ **GLUTEN-FREE:**
> • Ceviche de trucha (sin croutons ni aderezos con trigo)
> • Lomo saltado (confirmar que la soya sea sin trigo)
> • Papas a la huancaína ⚠️ SOLO si los galletas/crackers no se usan
>
> ❌ **CONTIENE GLUTEN:**
> • Rocoto relleno (la masa lleva harina)
> • Empanadas
>
> 🥜 **CONTIENE NUECES/MANÍ:**
> • Ají de gallina ⚠️ receta tradicional lleva MANÍ/PECANAS
> • Ocopa ⚠️ lleva maní
>
> ✅ **SIN NUECES:**
> • Ceviche de trucha
> • Lomo saltado
> • Rocoto relleno
>
> ⚠️ CROSS-CONTAMINATION: La cocina procesa maní. Avisar al grupo que no se puede garantizar ausencia total de trazas.
>
> 🇬🇧 For the tourists:
> 'Gluten-free options: Trout ceviche, Lomo saltado (stir-fried beef). Contains nuts: Ají de gallina (chicken in walnut/peanut sauce). Kitchen processes nuts — trace exposure possible.'
>
> ¿Necesitas que imprima una tarjeta de alérgenos para la mesa?"

---

### SCENARIO 3: Multilingual Tourist Dish Explanation
> "Un turista me pregunta 'What is ají de gallina? Does it contain dairy?' Necesito responderle en inglés, yo no sé cómo explicarle bien."

**Skills involved:** yaya-sales (multilingual)
**MCP tools:** erpnext-mcp (`get_product`)

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Handleable | 7 | The LLM can translate and explain Peruvian food in English — this is an AI strength |
| Accuracy | 6 | General knowledge of ají de gallina is correct (yes, it contains dairy: evaporated milk, Parmesan). But the agent doesn't know Elena's *specific* recipe which may vary. |
| Speed | 9 | Pure LLM task, no tool calls needed for the translation |
| Completeness | 6 | Can explain and translate. Missing: Elena's specific recipe/ingredient list, allergen confirmation from the kitchen |
| Delight | 8 | Natural bilingual response would delight Elena |
| Safety | 4 | Without recipe-specific data, dairy claim is based on standard recipe, not Elena's kitchen that day |

**Gaps flagged:**
- 🔴 No per-dish recipe/ingredient database to confirm allergens from the actual kitchen
- 🟡 No pre-built bilingual menu descriptions

**Ideal response:**
> "¡Claro! Dile esto al turista:
>
> 🇬🇧 'Ají de gallina is a traditional Peruvian creamy chicken dish. Shredded chicken in a sauce made with ají amarillo peppers, bread, walnuts or pecans, evaporated milk, and Parmesan cheese. Served over rice with boiled potatoes and olives.
>
> ⚠️ **Yes, it contains dairy** (evaporated milk and Parmesan cheese).
> ⚠️ It also contains **tree nuts** (walnuts/pecans) and **gluten** (bread in the sauce).
>
> Dairy-free alternative: Our trout ceviche is dairy-free and gluten-free!'
>
> Elena, ¿tu receta de hoy lleva la leche evaporada o la cambiaste? Así confirmo con el turista."

---

### SCENARIO 4: Multi-Platform Delivery Order Prioritization
> "Me llegaron 3 pedidos de Rappi al mismo tiempo y uno de PedidosYa. Necesito organizarlos por prioridad — cuál se pidió primero?"

**Skills involved:** yaya-sales
**MCP tools:** erpnext-mcp (`list_orders`)

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Handleable | 3 | **No Rappi/PedidosYa integration exists.** ERPNext `list_orders` can sort by date but delivery platform orders aren't ingested into ERPNext. |
| Accuracy | 2 | Can't prioritize what it can't see |
| Speed | 2 | Would have to ask Elena to relay order details manually |
| Completeness | 1 | No delivery platform API integration, no order aggregation dashboard, no kitchen display system, no delivery time estimation |
| Delight | 4 | Could offer general prioritization advice (FIFO) |
| Safety | 6 | No food safety risk, but missed delivery deadlines affect business |

**Gaps flagged:**
- 🔴 **No Rappi API integration**
- 🔴 **No PedidosYa API integration**
- 🔴 No delivery order aggregator/dashboard
- 🔴 No kitchen display system (KDS) integration
- 🟡 No delivery time estimation or platform commission tracking per order

**Ideal response:**
> "¡Uy, hora pico! 🔥 Déjame ordenarlos. Necesito que me digas los detalles de cada pedido (o mejor: cuando conectemos Rappi y PedidosYa, esto será automático).
>
> Por ahora, la regla de oro:
> 1. 🥇 El que se pidió PRIMERO (ver hora en la app)
> 2. 🥈 Si dos son iguales, prioriza el que tiene menor tiempo de entrega prometido
> 3. 🥉 PedidosYa suele dar menos tiempo que Rappi — revisar
>
> ⚠️ Nota: Rappi cobra 25% y PedidosYa 22%. Si alguno tiene penalidad por demora, ese va primero.
>
> 📋 Pásame los 4 pedidos y te los ordeno al toque."

---

### SCENARIO 5: Handwritten Menu Photo → System Upload
> [Photo of handwritten daily menu on a pizarra] "Este es el menú de hoy, súbelo al sistema y ponle los alérgenos de cada plato"

**Skills involved:** yaya-sales (voice/image), yaya-inventory
**MCP tools:** erpnext-mcp (`create_item`, `update_item`)

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Handleable | 6 | Vision model (Qwen3.5-27B) can OCR handwritten Spanish menu from photo. Can then create items in ERPNext. |
| Accuracy | 5 | OCR of handwritten Spanish may have errors. Allergen assignment would be based on general knowledge, not confirmed ingredients. |
| Speed | 7 | Image OCR → item creation pipeline is feasible |
| Completeness | 4 | Can OCR and create items. Cannot reliably assign allergens without a recipe database. |
| Delight | 7 | Photo-to-system is a "wow" moment for Elena |
| Safety | 3 | ⚠️ Allergen assignment from OCR + general knowledge = risky for tourist safety |

**Gaps flagged:**
- 🔴 No recipe → allergen mapping database
- 🟡 Handwritten OCR accuracy for Peruvian food terms needs validation
- 🟡 No confirmation flow for OCR results before publishing

**Ideal response:**
> "📸 ¡Leí tu pizarra! Esto es lo que veo:
>
> 📋 **Menú del Día — S/18**
> 1. Ceviche de trucha
> 2. Rocoto relleno
> 3. Mazamorra morada
>
> ¿Está correcto? Si sí, lo subo con estos alérgenos:
>
> | Plato | 🐟 Pescado | 🥛 Lácteos | 🥜 Nueces | 🌾 Gluten |
> |-------|-----------|-----------|----------|----------|
> | Ceviche de trucha | ✅ | ❌ | ❌ | ❌ |
> | Rocoto relleno | ❌ | ✅ (queso) | ❌ | ✅ (masa) |
> | Mazamorra morada | ❌ | ❌ | ❌ | ❌ |
>
> ⚠️ Elena, ¿tu rocoto relleno lleva queso adentro? Y la mazamorra, ¿le pones maicena o harina? Necesito confirmar antes de publicar los alérgenos."

---

### SCENARIO 6: Tourist Group Quotation with Factura
> "Un grupo de la agencia Condor Travel quiere un almuerzo para 25 personas el jueves. Presupuesto: entrada + fondo + postre + chicha morada. Haceme la cotización con factura, su RUC es 20512345678."

**Skills involved:** yaya-sales, yaya-tax, yaya-appointments
**MCP tools:** erpnext-mcp (`create_quotation`), invoicing-mcp (`lookup_ruc`), appointments-mcp (`book_appointment`)

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Handleable | 8 | Strong path: lookup_ruc → create_quotation → schedule reservation. All tools exist. |
| Accuracy | 7 | RUC validation, IGV calculation (18%), quotation creation all work correctly. Missing: group menu pricing vs individual pricing. |
| Speed | 8 | 3 tool calls in sequence, all fast |
| Completeness | 7 | Quotation + RUC validation + basic scheduling. Missing: payment terms (30-day credit for agencies), group-specific menu options, capacity check. |
| Delight | 8 | Professional quotation with RUC validation feels very competent |
| Safety | 8 | RUC validation prevents incorrect factura issuance. Good. |

**Gaps flagged:**
- 🟡 No group pricing / corporate pricing tiers in ERPNext
- 🟡 No 30-day payment terms tracking for agencies
- 🟡 No restaurant capacity management (45 max, is 25 available on Thursday?)
- 🟡 No allergen pre-survey for tourist groups

**Ideal response:**
> "¡Perfecto, Elena! Vamos con la cotización para Condor Travel 🏔️
>
> 🔍 Validé el RUC 20512345678:
> 🏢 CONDOR TRAVEL SAC
> ✅ Estado: Activo — Habido
>
> 📋 **Cotización — Almuerzo Grupal**
> 👥 25 personas | 📅 Jueves
>
> Por persona:
> • Entrada: Ceviche de trucha
> • Fondo: Rocoto relleno
> • Postre: Mazamorra morada
> • Bebida: Chicha morada (jarra para compartir)
>
> 💰 Precio por persona: S/35.00
> Subtotal (25 pax): S/737.29
> IGV (18%): S/132.71
> **Total: S/870.00**
>
> 📄 Se emitirá **FACTURA** (documento tipo 01) a nombre de Condor Travel SAC
> 💳 Condiciones de pago: ¿contado o crédito 30 días?
>
> ⚠️ Tu capacidad máxima es 45 personas. Con 25 del grupo, te quedan 20 asientos para walk-ins.
>
> ¿Confirmo la cotización?"

---

### SCENARIO 7: Rappi Commission Tracking
> "Cuánto me está cobrando Rappi de comisión este mes? Siento que estoy perdiendo plata con el delivery"

**Skills involved:** yaya-analytics, yaya-payments
**MCP tools:** erpnext-mcp (`get_sales_summary`), payments-mcp (`get_daily_collection_summary`)

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Handleable | 3 | **No Rappi integration.** Cannot pull commission data. ERPNext doesn't track platform fees. |
| Accuracy | 2 | Would have to estimate from general knowledge (25% Rappi, 22% PedidosYa) |
| Speed | 2 | Can't answer without data |
| Completeness | 1 | No delivery platform financial reconciliation at all |
| Delight | 4 | Could offer helpful framing ("at 25% commission, you need X margin...") |
| Safety | 7 | No safety risk, financial only |

**Gaps flagged:**
- 🔴 **No Rappi API/data integration**
- 🔴 **No PedidosYa API/data integration**
- 🔴 No per-platform profitability analysis
- 🔴 No commission reconciliation system

**Ideal response:**
> "Elena, lamentablemente todavía no estoy conectado a Rappi 😔 Pero puedo ayudarte a calcular:
>
> Si este mes vendiste S/X por Rappi a 25% de comisión:
> • Comisión Rappi: S/X × 25% = S/Y
> • Te queda: S/X - S/Y = S/Z
>
> 📊 Para saber si pierdes plata, necesito:
> 1. Tu food cost por plato (~30% según me dijiste)
> 2. Ventas totales por Rappi este mes
>
> Con 25% de comisión + 30% de food cost, tu margen es solo 45% — de ahí sale personal, local, servicios...
>
> 💡 Recomendación: Evalúa si los platos que vendes por delivery tienen margen suficiente. Los más caros suelen ser más rentables por delivery.
>
> ¿Quieres que te ayude a armar un análisis cuando conectemos Rappi?"

---

### SCENARIO 8: Yape Payment Verification
> [Yape screenshot] "La mesa 4 dice que ya pagó por Yape S/72, verificame porfa"

**Skills involved:** yaya-payments
**MCP tools:** payments-mcp (`match_payment`, `search_payment_by_amount`), erpnext-mcp (via yaya-payments OCR)

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Handleable | 8 | This is exactly what yaya-payments is designed for. OCR via Qwen3.5-27B → amount extraction → match against pending orders. |
| Accuracy | 7 | Good extraction pipeline. `search_payment_by_amount` with ±5% tolerance handles rounding. Duplicate detection via hash. |
| Speed | 8 | Single image OCR + match query |
| Completeness | 7 | OCR → match → confirm flow is solid. Missing: table-to-order mapping (no "mesa 4" concept in ERPNext). |
| Delight | 8 | "¡Pago confirmado! ✅" is the perfect response for a busy kitchen |
| Safety | 8 | Receipt hash prevents double-counting. Good. |

**Gaps flagged:**
- 🟡 No table management system (mesa 1-N → orders)
- 🟡 No Yape account balance verification (only screenshot OCR, can't verify actual Yape receipt)
- 🟡 No tip handling (Elena mentions "propina aparte")

**Ideal response:**
> "📸 ¡Revisando el Yape de la mesa 4!
>
> 💜 Yape recibido: S/72.00
> 📝 Referencia: YP-2026-XYZ789
> 📅 Hoy, 20/03/2026 — 12:45 PM
> 👤 De: Juan Carlos P.
>
> ✅ Coincide con el pedido de mesa 4:
> • 2 menús del día (S/18 × 2 = S/36)
> • 1 lomo saltado a la carta (S/35)
> • Total: S/71 + propina S/1 = S/72
>
> ¡Pago confirmado! ✅ Mesa 4 está al día."

---

### SCENARIO 9: Seasonal Price Adjustment
> "Necesito subir los precios del menú para temporada alta. En junio viene la época de turistas. Cuánto debería cobrar si quiero mantener 35% de margen?"

**Skills involved:** yaya-analytics, yaya-inventory
**MCP tools:** erpnext-mcp (`get_sales_summary`, `get_item_price`, `update_item`)

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Handleable | 7 | Can calculate pricing from cost data if food cost is tracked. Can update prices in ERPNext. |
| Accuracy | 5 | The math is simple (price = cost / (1 - 0.35)), but food cost per dish isn't tracked in ERPNext today. Would need Elena to provide costs manually. |
| Speed | 7 | Once costs are known, calculation + batch update is fast |
| Completeness | 5 | Can calculate and update prices. Missing: competitor pricing analysis, tourist willingness-to-pay data, historical seasonal price comparison. |
| Delight | 7 | Proactive margin analysis would impress Elena |
| Safety | 8 | No safety risk |

**Gaps flagged:**
- 🔴 No food cost per dish tracking
- 🟡 No competitor / market pricing intelligence
- 🟡 No historical seasonal pricing data

**Ideal response:**
> "¡Buena idea prepararte para temporada alta! 📈
>
> Para mantener 35% de margen, la fórmula es:
> **Precio = Costo del plato ÷ 0.65**
>
> Necesito saber tu costo por plato. Según tu meta de 30% food cost:
>
> | Plato | Costo actual | Precio actual | Precio temporada alta (35% margen) |
> |-------|-------------|---------------|-------------------------------------|
> | Menú del día | ~S/5.40 | S/18 | S/8.31 ÷ 0.65 = **S/23** |
> | Lomo saltado | ~S/10.50 | S/35 | S/10.50 ÷ 0.65 = **S/42** |
> | Ceviche | ~S/9.00 | S/30 | S/9.00 ÷ 0.65 = **S/38** |
>
> 💡 Los turistas en Cusco suelen pagar S/25-35 por menú del día y S/45-65 a la carta sin pestañear. S/23 de menú sigue siendo muy competitivo.
>
> ¿Quieres que actualice los precios? Puedo hacerlo por categoría: menú del día, a la carta, bebidas."

---

### SCENARIO 10: USD Payment Conversion
> "El gringo de la mesa 7 quiere pagar con dólares. A cuánto le cobro el menú de S/45?"

**Skills involved:** yaya-sales
**MCP tools:** forex-mcp (`convert_amount`, `get_exchange_rate`)

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Handleable | 9 | forex-mcp has exactly the right tools: `convert_amount` from PEN to USD |
| Accuracy | 9 | Uses live exchange rate from open.er-api.com. Correct and current. |
| Speed | 9 | Single API call |
| Completeness | 8 | Conversion is done. Could add: SUNAT official exchange rate for invoicing, tip in USD suggestion, change calculation if tourist pays with a round USD amount. |
| Delight | 9 | Fast answer with both rate and rounded USD amount |
| Safety | 8 | Should note that SUNAT invoicing uses the official SUNAT rate, not market rate |

**Gaps flagged:**
- 🟡 Should distinguish SUNAT official rate vs. market rate for invoicing
- 🟡 No cash USD handling guidance (what bills to accept, counterfeit detection)

**Ideal response:**
> "💵 ¡Claro! Al tipo de cambio de hoy:
>
> 🔄 S/45.00 = **$12.05 USD** (TC: S/3.733 por dólar)
>
> 💡 Tip: Si te paga con un billete de $20, le devuelves:
> • $20 - $12.05 = $7.95 de vuelto
> • O S/29.67 en soles si prefiere
>
> ⚠️ Para la boleta/factura, usa el tipo de cambio de SUNAT del día (puede variar ligeramente). Si emites en USD, el sistema lo convierte automáticamente.
>
> ¿Le hago la boleta en dólares o en soles?"

---

### SCENARIO 11: Boleta Generation
> "Hazme la boleta de la mesa 3: 2 menús del día, 1 lomo saltado a la carta, 3 Cusqueñas, 1 chicha morada. Propina aparte."

**Skills involved:** yaya-tax
**MCP tools:** invoicing-mcp (`create_invoice` with document_type="03")

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Handleable | 8 | invoicing-mcp supports boleta (type 03) with DNI or anonymous. Full item list can be sent. |
| Accuracy | 8 | IGV calculation is correct (18% included in boleta). Line items supported. |
| Speed | 8 | Single `create_invoice` call |
| Completeness | 7 | Boleta creation works. Missing: table management, tip handling (propina is separate and usually not on the boleta), beer/beverage pricing lookup. |
| Delight | 8 | Quick boleta with PDF link feels professional |
| Safety | 9 | Boleta for anonymous consumer (consumidor final) is correct SUNAT procedure |

**Gaps flagged:**
- 🟡 No table → order linking
- 🟡 No tip (propina) handling — should it appear on the boleta? (No, per Peru practice — tips are voluntary and separate)
- 🟡 No beverage inventory tracking (Cusqueña beer)
- 🟡 No boleta auto-emission from order close

**Ideal response:**
> "📄 ¡Armando la boleta de mesa 3!
>
> 📋 Detalle:
> • 2× Menú del día — S/18 c/u = S/36.00
> • 1× Lomo saltado a la carta — S/35.00
> • 3× Cerveza Cusqueña — S/10 c/u = S/30.00
> • 1× Chicha morada — S/5.00
>
> Subtotal: S/89.83
> IGV (18%): S/16.17
> **Total: S/106.00**
>
> 💡 Propina no incluida (es voluntaria, no va en boleta — correcto según SUNAT).
>
> Emitida como **Boleta B001-XXXX** — Consumidor final
> 📎 PDF: [enlace]
>
> ¿La imprimo o se la mando por WhatsApp al cliente?"

---

### SCENARIO 12: Factura for Travel Agency
> "La agencia Viajes Pacífico necesita factura por el almuerzo grupal de ayer. Son S/1,250 total. Su RUC es 20398765432, razón social Viajes Pacífico SAC."

**Skills involved:** yaya-tax
**MCP tools:** invoicing-mcp (`lookup_ruc`, `create_invoice` with document_type="01")

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Handleable | 9 | Perfect match. lookup_ruc validates the RUC, then create_invoice issues factura. |
| Accuracy | 9 | RUC validation → factura (type 01) is the correct flow. IGV calculation: S/1,059.32 base + S/190.68 IGV = S/1,250.00. |
| Speed | 8 | Two calls: lookup_ruc + create_invoice |
| Completeness | 8 | Full factura flow. Could add: automatic payment terms (30 days for agencies), accounts receivable tracking, link to original quotation. |
| Delight | 9 | Professional, fast, correct |
| Safety | 9 | RUC validation prevents errors. Factura correctly requires RUC. |

**Gaps flagged:**
- 🟡 No accounts receivable / payment terms tracking for agency credit (30 days)
- 🟡 No link from factura back to the original group reservation/quotation

**Ideal response:**
> "📄 ¡Emitiendo la factura para Viajes Pacífico!
>
> 🔍 Validando RUC 20398765432...
> ✅ VIAJES PACÍFICO SAC — Activo, Habido
>
> 📋 **Factura F001-XXXX**
> 🏢 Cliente: Viajes Pacífico SAC (RUC: 20398765432)
> 📅 Fecha: 20/03/2026
>
> Almuerzo grupal:
> • 25 almuerzos completos × S/42.37 = S/1,059.32
>
> Base imponible: S/1,059.32
> IGV (18%): S/190.68
> **Total: S/1,250.00**
>
> 📎 PDF y XML enviados a SUNAT ✅
> 🔐 Hash: xK7m9...
>
> ¿Condiciones de pago? Si es crédito 30 días como suelen las agencias, lo registro."

---

### SCENARIO 13: Credit Note for Incorrect Boleta
> "Me equivoqué en la boleta que le di al cliente — le cobré S/85 pero era S/58. Cómo hago la nota de crédito?"

**Skills involved:** yaya-tax
**MCP tools:** invoicing-mcp (`create_credit_note`)

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Handleable | 9 | `create_credit_note` with reason_code "02" (corrección por error) is exactly right |
| Accuracy | 9 | Credit note references original boleta, adjusts the difference (S/85 - S/58 = S/27 credit). SUNAT procedure is correct. |
| Speed | 8 | One tool call after confirming details |
| Completeness | 8 | Credit note + new boleta. Could add: automatic refund processing if payment already collected. |
| Delight | 8 | Reassuring tone for a stressful mistake |
| Safety | 9 | Proper SUNAT credit note procedure |

**Ideal response:**
> "¡Tranquila, Elena! Esto se arregla fácil con una nota de crédito 📝
>
> Necesito el número de la boleta original (ej: B001-00000156).
>
> Lo que vamos a hacer:
> 1. Emitir **Nota de Crédito** contra la boleta original por la diferencia (S/27)
> 2. Emitir **nueva boleta** por S/58 (el monto correcto)
>
> 📄 Nota de Crédito BC01-XXXX
> • Referencia: B001-00000156
> • Motivo: Corrección por error en monto
> • Monto corregido: S/27.00 (diferencia S/85 - S/58)
>
> ✅ Enviada a SUNAT
>
> Y la nueva boleta por S/58:
> 📄 Boleta B001-XXXX — S/58.00
> ✅ Emitida
>
> Si el cliente ya pagó S/85, le debes S/27 de vuelto. ¿Quieres que le haga el reembolso por Yape?"

---

### SCENARIO 14: Monthly Boleta vs Factura Summary
> "Cuánto vendí con boleta y cuánto con factura este mes? Necesito eso para mi contador."

**Skills involved:** yaya-tax, yaya-analytics
**MCP tools:** invoicing-mcp (`list_invoices`), erpnext-mcp (`get_sales_summary`)

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Handleable | 8 | `list_invoices` with document_type filter (01 for factura, 03 for boleta) + date range gives the breakdown |
| Accuracy | 8 | Can aggregate by document type. IGV breakdown per type is calculable. |
| Speed | 7 | Two list_invoices calls (one for facturas, one for boletas) + aggregation |
| Completeness | 7 | Summary by document type with totals. Could add: IGV crédito fiscal calculation, RMT monthly calculation, export-ready format for contador. |
| Delight | 8 | Accountant-ready summary saves Elena time |
| Safety | 8 | Correct tax reporting |

**Gaps flagged:**
- 🟡 No automatic accountant export format (PDT 621 compatible)
- 🟡 No monthly IGV crédito fiscal vs débito fiscal calculation
- 🟡 No "send to my contador" feature

**Ideal response:**
> "📊 Resumen de comprobantes — Marzo 2026 (hasta hoy 20/03):
>
> 📄 **FACTURAS (empresas/agencias):**
> • Emitidas: 8 facturas
> • Total base: S/8,450.00
> • IGV: S/1,521.00
> • Total: S/9,971.00
>
> 🧾 **BOLETAS (clientes individuales/turistas):**
> • Emitidas: 312 boletas
> • Total: S/28,340.00 (IGV incluido)
> • Base: S/24,016.95
> • IGV: S/4,323.05
>
> 📋 **RESUMEN PARA TU CONTADOR:**
> • Ventas totales: S/38,311.00
> • IGV Ventas (débito fiscal): S/5,844.05
> • Tu RUC termina en 0 → fecha de declaración: 12 de abril
>
> ¿Quieres que te calcule cuánto te toca pagar de IGV y Renta este mes? Necesito saber cuánto gastaste en compras (mercado, proveedores)."

---

## Critical Gaps Summary

### 🚨 CRITICAL (Must fix before restaurant launch)

| Gap | Impact | Affected Scenarios |
|-----|--------|--------------------|
| **No allergen tracking system** | Life-threatening for tourists with allergies | 2, 3, 5, 24, 25 |
| **No per-dish ingredient/recipe database** | Cannot confirm allergens accurately | 2, 3, 5 |
| **No cross-contamination warnings** | Anaphylaxis risk | 2, 25 |

### 🔴 HIGH (Blocks core restaurant operations)

| Gap | Impact | Affected Scenarios |
|-----|--------|--------------------|
| **No daily menu (menú del día) concept** | Can't model Elena's core product (70% of revenue) | 1, 5 |
| **No Rappi/PedidosYa integration** | Can't manage delivery orders (significant revenue channel) | 4, 7 |
| **No table management system** | Can't link orders to tables | 8, 11, 20 |
| **No food cost per dish tracking** | Can't calculate real profitability | 1, 9, 17 |
| **No restaurant capacity management** | Can't prevent overbooking tourist groups | 6, 22 |

### 🟡 MEDIUM (Improves experience significantly)

| Gap | Impact | Affected Scenarios |
|-----|--------|--------------------|
| No social media menu posting | Elena posts daily menu to WhatsApp/Instagram manually | 1 |
| No bilingual menu descriptions | Tourist service is manual | 3, 5 |
| No tip handling | Common in restaurants, not modeled | 8, 11 |
| No accountant export format | Elena's contador needs PDT 621 data | 14 |
| No 30-day credit terms for agencies | Major B2B payment pattern | 6, 12 |
| No Quechua language support | Elena mixes Quechua naturally | 28 |

---

## SUNAT Boleta vs Factura Assessment

### What works well ✅
- **RUC validation** before factura issuance (lookup_ruc tool)
- **DNI validation** before boleta issuance (lookup_dni tool)
- **Correct document types**: 01 = Factura (RUC required), 03 = Boleta (DNI or anonymous)
- **IGV calculation**: 18% correctly applied
- **Credit/debit notes**: Full support with reason codes
- **Comunicación de baja**: Voiding within 7 days
- **RMT tax obligations**: Correctly returns obligations for Elena's regime
- **Monthly tax calculation**: IGV + Renta 1% for RMT correctly computed

### What needs improvement 🟡
- **No boleta for foreign tourists with passport**: invoicing-mcp supports DNI and CE (carné de extranjería) but not passport number. Tourists without DNI should get boleta as "consumidor final" — this works, but agent should explicitly guide Elena on this.
- **No auto-batch resumen diario**: Boletas need daily summary submission. This exists as a tool but no cron job triggers it.
- **No declaration deadline reminder**: The skill describes proactive reminders based on last RUC digit, but no cron is configured.
- **No IGV crédito fiscal from market purchases**: Elena buys at Mercado San Pedro with receipts — these should reduce her IGV obligation, but there's no purchase invoice tracking.

### Tourist invoicing nuance 🌍
| Customer Type | Document | ID Required | Notes |
|---------------|----------|-------------|-------|
| Peruvian individual | Boleta | DNI (8 digits) | Standard flow |
| Peruvian company | Factura | RUC (11 digits) | Standard flow |
| Foreign tourist (individual) | Boleta | Passport # or "consumidor final" | ⚠️ Agent should not require DNI |
| Foreign travel agency (with Peru RUC) | Factura | RUC | Standard flow |
| Foreign travel agency (no Peru RUC) | Boleta or special export invoice | Passport/foreign tax ID | ⚠️ Edge case not handled |

---

## Multilingual Assessment

### Spanish (Cusco dialect) ✅
- Core skill. All skills default to Spanish.
- Elena's warm style ("mamita", "Yayita") should be mirrored.
- **Gap:** No Cusco-specific vocabulary or cultural awareness in skills.

### English (Tourist interactions) 🟡
- LLM can translate on the fly — works for scenario 3.
- **Gap:** No pre-built bilingual menu, no bilingual allergen cards, no tourist-facing English templates.
- **Gap:** yaya-sales says "respond in the customer's language" but no structured English support for food terms.

### Quechua 🔴
- Elena uses Quechua words naturally ("allinmi", "ñuqa", "proveedorníy").
- **Gap:** No Quechua understanding in any skill. The LLM has some Quechua knowledge but it's not reliable.
- **Gap:** Quechua market vendors are key to Elena's supply chain — can't help with vendor communications.
- **Recommendation:** At minimum, build a Quechua ↔ Spanish glossary for common food/business terms.

---

## Recommendations Priority

1. **🚨 Build allergen tracking system** — New MCP server or ERPNext custom fields. Dish → ingredients → allergens matrix. Cross-contamination flags. Bilingual output. This is non-negotiable for restaurant vertical.

2. **🔴 Build "menú del día" concept** — Daily combo/set menu with date validity, pricing, and social media posting integration.

3. **🔴 Build Rappi/PedidosYa integration** — At least order ingestion. Commission tracking as a bonus.

4. **🔴 Build table management** — Simple: mesa # → active orders → payment status.

5. **🟡 Build food cost tracking** — Market purchase → dish cost → margin analysis.

6. **🟡 Configure SUNAT cron jobs** — Daily resumen diario, monthly declaration reminders.

7. **🟡 Build bilingual menu templates** — English/Spanish dish descriptions with allergen info for tourist groups.
