# Round 2 Evaluation: Miguel Torres — Restaurante Inti Raymi (Cusco)

**Evaluator:** Yaya Platform Test Evaluator
**Date:** 2026-03-21
**Persona:** Miguel Torres Huamán, 44, restaurateur in Cusco (cevichería + cocina novoandina)
**Business:** 14 employees, S/480K annual revenue, multi-currency (PEN/USD/EUR), MYPE Tributario

---

## Scenario-by-Scenario Evaluation

---

### Scenario 1: Consulta de reservas

**Message:**
> "Yaya, ¿cuántas reservas tengo para hoy? 🍽️ Necesito saber si preparo para 40 o 60 personas"

**Skills involved:** yaya-appointments
**MCP tools needed:** `appointments-mcp → list_appointments` (filter by date=today)

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 7 | yaya-appointments can list today's appointments, but restaurant reservas ≠ appointment bookings. Restaurants need table reservations (party size, seating preference), not service appointments. |
| Accuracy | 6 | Can return appointment count, but "prepare for 40 or 60" requires summing party sizes — not just counting bookings. yaya-appointments tracks individual appointments, not party sizes per se. |
| Speed | 8 | Single MCP call, fast response. |
| Completeness | 5 | Missing: total guest count (not just reservation count), walk-in estimates, TripAdvisor/external reservation sync, table assignment. |
| Delight | 7 | Can provide a formatted summary with emojis. |
| Safety | 9 | No safety concerns. |

**Gaps:**
- **yaya-appointments is designed for service businesses (salons, clinics), NOT restaurants.** No concept of party size, table assignment, or seating capacity.
- No integration with TripAdvisor, Google reservations, or external booking platforms.
- No walk-in history/estimates to help plan capacity.
- No concept of "covers" (cubiertos) — the restaurant metric that matters.

**Ideal Response:**
> "📋 Reservas de hoy — Jueves 21/03
>
> 🍽️ Almuerzo:
> • 12:30 — Peru Hop (20 personas, menú fijo)
> • 1:00 — Familia García (6 personas)
> • 1:30 — TripAdvisor reserva (4 personas)
>
> 🌙 Cena:
> • 7:00 — Pareja (2 personas)
> • 8:00 — Sin reserva aún
>
> 👥 Total reservado: 32 personas
> 📊 Promedio walk-ins un jueves: ~15
> 💡 Prepara para ~47 personas. Más cerca de 40 que de 60.
>
> ¿Quieres confirmar alguna reserva?"

---

### Scenario 2: Registro de compra de insumos

**Message:**
> "Compré en San Pedro: 8kg de pescado lenguado a S/45 el kilo, 5kg de pulpo a S/38, limones S/25 el saco, ají amarillo S/8 el kilo (3kg), cebolla S/15 el saco. Todo efectivo"

**Skills involved:** yaya-inventory, yaya-sales (reverse — purchase recording)
**MCP tools needed:** `erpnext-mcp → create_stock_entry` (or purchase receipt), `erpnext-mcp → create_payment_entry`

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 5 | yaya-inventory handles product catalog and stock levels for SALES, not purchase/procurement recording. No skill explicitly handles purchase recording from market runs. |
| Accuracy | 4 | ERPNext has Purchase Receipts but no skill guides the agent to create them. Calculations are simple (8×45=360, etc.) but the skill gap is in knowing WHERE to record. |
| Speed | 6 | Could calculate totals quickly, but recording properly would require multiple MCP calls without clear skill guidance. |
| Completeness | 3 | No purchase order workflow. No food-specific tracking (batch dates, expiry, quality notes). No supplier management for market vendors. |
| Delight | 5 | Can confirm the math, but lacks restaurant-specific awareness. |
| Safety | 8 | No safety concerns, but should track food safety data (purchase date, expected freshness). |

**Gaps:**
- **No procurement/purchasing skill.** yaya-inventory is sell-side only.
- No food-specific inventory (perishables, batch tracking, expiry dates).
- No supplier/vendor tracking for informal market purchases.
- No concept of "mise en place" or recipe-based inventory deduction.
- ERPNext can handle Purchase Receipts, but no skill orchestrates this.

**Ideal Response:**
> "✅ Compra registrada — San Pedro, 21/03
>
> 🐟 Lenguado: 8kg × S/45 = S/360
> 🐙 Pulpo: 5kg × S/38 = S/190
> 🍋 Limones: 1 saco = S/25
> 🌶️ Ají amarillo: 3kg × S/8 = S/24
> 🧅 Cebolla: 1 saco = S/15
>
> 💰 Total: S/614 (efectivo)
>
> 📊 Tu gasto en insumos esta semana: S/2,140
> ⚠️ El lenguado subió S/3/kg vs la semana pasada.
>
> ¿Quieres que registre algo más?"

---

### Scenario 3: Registro de ventas del día

**Message:**
> "Ventas de hoy almuerzo: S/3,200 en boletas, USD 450 en tarjeta de turistas, EUR 120 efectivo. Cena todavía falta 🙏"

**Skills involved:** yaya-sales, yaya-tax, yaya-analytics
**MCP tools needed:** `erpnext-mcp → create_sales_entry`, `invoicing-mcp → list_invoices`, external API for exchange rates

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 4 | Multi-currency recording is a major gap. No skill handles USD/EUR → PEN conversion for daily sales logging. yaya-tax handles invoices but not daily cash register reconciliation. |
| Accuracy | 3 | No real-time exchange rate integration. Platform doesn't know today's USD/PEN or EUR/PEN rates. Would need external API. |
| Speed | 5 | Multi-step process without clear orchestration. |
| Completeness | 3 | No multi-currency daily sales reconciliation. No "turno" concept (almuerzo vs cena). No POS integration. No cash drawer management. |
| Delight | 5 | Could format nicely but core functionality is missing. |
| Safety | 7 | Financial recording should be accurate — partial data could cause problems. |

**Gaps:**
- **No multi-currency support.** Critical for Cusco tourism businesses.
- **No exchange rate API integration.** No MCP tool provides exchange rates.
- No concept of service periods (almuerzo/cena shifts).
- No POS system integration.
- No cash drawer/caja reconciliation.
- yaya-analytics can report on recorded sales, but can't record multi-currency cash register data.

**Ideal Response:**
> "📊 Ventas almuerzo — 21/03
>
> 🇵🇪 Boletas: S/3,200.00
> 🇺🇸 Tarjeta USD: $450 × 3.72 = S/1,674.00
> 🇪🇺 Efectivo EUR: €120 × 4.05 = S/486.00
>
> 💰 Total almuerzo: S/5,360.00
>
> (Tipo de cambio SBS del día)
>
> Falta cena. Avísame cuando cierres para el total del día 📝
>
> 📈 Vs ayer almuerzo: +S/420 (↗️ +8.5%)"

---

### Scenario 4: Pedido de delivery

**Message:**
> "Pedido delivery: 2 ceviches clásicos, 1 lomo saltado, 1 ají de gallina, 2 pisco sours. Cliente: María, cel 984567890, dirección Cuesta San Blas 456. Paga Yape"

**Skills involved:** yaya-sales, yaya-crm, yaya-payments
**MCP tools needed:** `erpnext-mcp → create_sales_order`, `crm-mcp → create_contact`, `payments-mcp` (for Yape tracking)

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 7 | yaya-sales can create orders, yaya-crm can log customers, yaya-payments can handle Yape. Good fit. |
| Accuracy | 6 | Needs menu with prices in ERPNext. If prices are loaded, accurate. If not, can't calculate total. |
| Speed | 7 | Multiple MCP calls but straightforward. |
| Completeness | 5 | No delivery tracking, no estimated delivery time, no kitchen order ticket, no driver assignment. |
| Delight | 7 | Can produce a nice order confirmation. |
| Safety | 8 | Food order — should confirm allergen info, but not critical. |

**Gaps:**
- No delivery management system (driver assignment, ETA, tracking).
- No kitchen order/ticket system (KDS integration).
- No delivery radius or zone concept.
- No alcohol delivery restrictions (pisco sours — some jurisdictions restrict).

**Ideal Response:**
> "✅ Pedido delivery registrado — #PED-0234
>
> 📋 Detalle:
> • 2× Ceviche clásico — S/76
> • 1× Lomo saltado — S/42
> • 1× Ají de gallina — S/38
> • 2× Pisco sour — S/50
>
> 💰 Total: S/206
> 📍 Cuesta San Blas 456
> 👤 María — 984567890
> 💜 Pago: Yape
>
> ⏱️ Tiempo estimado: 35-45 min
>
> Le envío confirmación a María por WhatsApp?"

---

### Scenario 5: Actualización del menú

**Message:**
> "Hoy no hay lenguado, llegó corvina nomás. Cambia el ceviche de lenguado por corvina en el menú del día. Precio se mantiene S/38"

**Skills involved:** yaya-inventory
**MCP tools needed:** `erpnext-mcp → update_item` (modify product/variant)

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 5 | yaya-inventory can update products, but "daily menu" is a restaurant concept not modeled. Item substitution in a menu context is different from inventory management. |
| Accuracy | 5 | Can change a product name/description, but doesn't understand "menú del día" as a dynamic concept. |
| Speed | 7 | Simple update if properly modeled. |
| Completeness | 4 | No dynamic daily menu system. No concept of "86'd items" (restaurant term for unavailable). No propagation to customers asking about today's specials. |
| Delight | 6 | Can confirm the change. |
| Safety | 7 | Should note allergen implications of the substitution (corvina vs lenguado). |

**Gaps:**
- **No restaurant menu management system.** ERPNext product catalog ≠ daily restaurant menu.
- No "86" (unavailable item) tracking.
- No daily specials/menu rotation concept.
- No automatic notification to front-of-house staff.

**Ideal Response:**
> "✅ Menú actualizado — 21/03
>
> 🔄 Ceviche de lenguado → Ceviche de corvina
> 💰 Precio: S/38 (sin cambio)
>
> Ya actualicé para que si algún cliente pregunta, le ofrezca corvina.
>
> ⚠️ Nota: si algún cliente tiene preferencia específica por lenguado, le aviso que hoy solo hay corvina.
>
> ¿Algo más que cambiar en el menú de hoy?"

---

### Scenario 6: Consulta de plato (turista vegano/sin gluten)

**Message:**
> "Un turista americano pregunta si tenemos opciones veganas y sin gluten. ¿Qué platos le puedo ofrecer de mi menú?"

**Skills involved:** yaya-inventory (product catalog), yaya-voice (potentially English response)
**MCP tools needed:** `erpnext-mcp → search_items` (filter by tags/attributes)

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 4 | Product catalog doesn't track allergens, dietary tags, or ingredient lists. No "vegan" or "gluten-free" attributes on menu items. |
| Accuracy | 2 | Without dietary classification data, the agent would have to guess or use general knowledge about Peruvian cuisine. DANGEROUS for allergen queries. |
| Speed | 5 | Fast if data existed; slow/impossible without it. |
| Completeness | 2 | No allergen database, no ingredient tracking, no dietary filters, no cross-contamination warnings. |
| Delight | 4 | Could provide general advice about Peruvian cuisine, but not business-specific. |
| Safety | 3 | **CRITICAL SAFETY GAP.** Allergen information must be accurate. Wrong info could cause allergic reactions. Without data, should refuse to answer definitively. |

**Gaps:**
- **No allergen/dietary tracking on menu items.** Critical for restaurants serving tourists.
- No ingredient lists per dish.
- No cross-contamination warnings.
- No bilingual menu support (English for tourists).
- This is a safety-critical gap for the restaurant vertical.

**Ideal Response:**
> "🌿 Opciones para tu turista:
>
> VEGANO + SIN GLUTEN:
> • Quinoa salteada con verduras — S/32
> • Ensalada de quinoa y palta — S/28
> • Papa a la huancaína (versión vegana, verificar) — S/25
>
> VEGETARIANO + SIN GLUTEN:
> • Rocoto relleno vegetariano — S/35
>
> ⚠️ IMPORTANTE: Confirmar con el chef que no se use harina de trigo en las salsas. La cocina comparte superficies con mariscos — avisar al turista por cross-contamination.
>
> 🇬🇧 ¿Quieres que te prepare una respuesta en inglés para el turista?"

---

### Scenario 7: Registro de propinas

**Message:**
> "Hoy las propinas fueron S/280. Reparte: 40% cocina, 40% mozos, 20% bar. Dime cuánto le toca a cada uno"

**Skills involved:** None directly. Simple math, but no skill handles payroll or tip distribution.
**MCP tools needed:** None specifically designed for this.

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 6 | The LLM can do the math (280×0.4=112, 280×0.2=56). But no skill records tip distribution, and no per-person breakdown within departments. |
| Accuracy | 8 | Math is straightforward. |
| Speed | 9 | Instant calculation. |
| Completeness | 4 | Can do the department split but not per-person within each department. No tip tracking history. No payroll integration. |
| Delight | 7 | Clean math presentation. |
| Safety | 7 | Should track for labor compliance. Propinas have tax implications in Peru. |

**Gaps:**
- No payroll/HR skill. Tip distribution, salary payments, employee management are not covered.
- No per-employee breakdown (how many cooks split the 40%?).
- No historical tip tracking.
- No tax implications awareness (propinas are taxable income in Peru).

**Ideal Response:**
> "💰 Distribución de propinas — S/280
>
> 👨‍🍳 Cocina (40%): S/112.00
>    • 2 chefs + 4 cocineros = 6 personas
>    • S/18.67 por persona
>
> 🍽️ Mozos (40%): S/112.00
>    • 4 mozos
>    • S/28.00 por persona
>
> 🍸 Bar (20%): S/56.00
>    • 1 barman
>    • S/56.00
>
> ¿Registro confirmado? 📝"

---

### Scenario 8: Multi-moneda — cálculo EUR

**Message:**
> "Yaya, un grupo de 8 franceses gastaron EUR 320. ¿A cuánto está el euro hoy? Cuánto es en soles. Me pagaron con tarjeta Visa en euros 🇫🇷"

**Skills involved:** yaya-payments (conceptually), yaya-analytics
**MCP tools needed:** External exchange rate API (NOT available), `erpnext-mcp → create_payment_entry`

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 3 | No exchange rate API in any MCP tool. Cannot answer "¿a cuánto está el euro hoy?" |
| Accuracy | 1 | Without real-time exchange rates, any answer would be a guess. |
| Speed | 3 | Would need external API call that doesn't exist in the tool chain. |
| Completeness | 2 | Can't convert, can't record multi-currency, can't advise on POS exchange rate vs market rate. |
| Delight | 3 | Unable to deliver core value. |
| Safety | 6 | Financial accuracy matters. Bad exchange rate = lost money. |

**Gaps:**
- **NO exchange rate API/MCP tool.** This is a fundamental gap for any business dealing with tourists.
- No multi-currency payment recording.
- No awareness of POS vs market exchange rate differences (Visa charges at interbank rate, different from street rate).
- No SBS (Superintendencia de Banca y Seguros) rate lookup.

**Ideal Response:**
> "🇪🇺 Tipo de cambio hoy (SBS):
> 1 EUR = S/4.05
>
> 💰 EUR 320 × 4.05 = S/1,296.00
> 👥 Son S/162.00 por persona
>
> 📝 Nota: Visa cobra al tipo de cambio interbancario, que suele ser un poco diferente. El cargo real en tu estado de cuenta POS puede variar ±1%.
>
> ¿Registro esta venta?"

---

### Scenario 9: Ticket promedio

**Message:**
> "¿Cuál es mi ticket promedio por persona este mes? Compara con el mes pasado. Siento que bajó"

**Skills involved:** yaya-analytics
**MCP tools needed:** `erpnext-mcp` + `postgres-mcp` for sales aggregation

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 7 | yaya-analytics is designed for exactly this kind of query. |
| Accuracy | 5 | Depends on how sales are recorded. If per-table/per-order (not per-person), "per person" ticket is impossible without covers/guest count tracking. |
| Speed | 7 | Standard aggregation query. |
| Completeness | 5 | Can show order averages but not per-person without cover tracking. Restaurant "ticket promedio por persona" requires knowing how many guests per table. |
| Delight | 8 | yaya-analytics format guidelines produce nice comparisons. |
| Safety | 9 | No safety concerns. |

**Gaps:**
- No covers (cubiertos) tracking. "Ticket per person" requires knowing guests per table.
- Restaurant analytics need food cost %, labor cost %, table turnover rate — not just sales.
- yaya-analytics examples are retail-centric, not restaurant-adapted.

**Ideal Response:**
> "📊 Ticket promedio por persona
>
> 📅 Marzo (hasta hoy): S/68
> 📅 Febrero: S/74
> 📉 Bajó S/6 (-8.1%)
>
> 🔍 Posibles causas:
> • Más menús turísticos (S/65) vs platos à la carte (S/80+)
> • Menos pedidos de pisco sour (-12% vs feb)
>
> 💡 Sugerencia: ofrecer el maridaje pisco+postre como combo para subir el ticket.
>
> ¿Quieres ver el detalle por turno (almuerzo vs cena)?"

---

### Scenario 10: Ajuste de precios (food cost)

**Message:**
> "El pescado subió 20%. Necesito subir precios del ceviche. Ahora está en S/38, ¿a cuánto debería ponerlo para mantener 65% de margen?"

**Skills involved:** yaya-analytics (conceptually), yaya-inventory (price update)
**MCP tools needed:** `erpnext-mcp → get_item_cost`, `erpnext-mcp → update_item_price`

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 5 | The math is doable but requires knowing current ingredient costs and recipe. No recipe/BOM (Bill of Materials) system exists. |
| Accuracy | 3 | Without recipe costing (BOM), can't calculate food cost %. The 65% margin calculation is simple math IF you know the cost, but the platform doesn't track recipe-level costs. |
| Speed | 6 | Fast if data existed. |
| Completeness | 3 | No recipe management, no BOM, no food cost calculation, no competitive price analysis. |
| Delight | 6 | Could present the math nicely. |
| Safety | 8 | No safety concern, but financial accuracy matters. |

**Gaps:**
- **No recipe/BOM (Bill of Materials) system.** Restaurants need to know cost per dish based on ingredients.
- No food cost percentage calculation.
- No competitive pricing analysis.
- No price sensitivity modeling (will tourists pay more?).

**Ideal Response:**
> "📊 Cálculo de precio — Ceviche
>
> Costo actual de insumos por plato: ~S/13.30
> Con pescado +20%: ~S/15.40
>
> Para mantener 65% de margen bruto:
> Precio = S/15.40 ÷ (1 - 0.65) = S/44.00
>
> 💡 Recomendación: Sube a S/42-45
> • S/42 → margen 63% (conservador, no asusta turistas)
> • S/45 → margen 66% (redondeo limpio)
>
> ⚠️ Tus competidores en San Blas cobran S/40-48 por ceviche.
>
> ¿Actualizo el precio?"

---

### Scenario 11: Pago en dólares — cambio

**Message:**
> "Turista quiere pagar su cuenta de S/185 en dólares. ¿Cuánto le cobro en USD? Y si me da USD 50 cuánto le devuelvo de vuelto en soles?"

**Skills involved:** yaya-payments (conceptually)
**MCP tools needed:** External exchange rate API (NOT available)

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 3 | No exchange rate API. |
| Accuracy | 1 | Cannot provide accurate conversion without real-time rates. |
| Speed | 3 | Blocked by missing capability. |
| Completeness | 2 | Can't convert, can't advise on rounding, can't handle mixed-currency change. |
| Delight | 3 | Core value undeliverable. |
| Safety | 5 | Incorrect exchange rate means either business loses money or tourist gets overcharged. |

**Gaps:**
- Same as Scenario 8: **No exchange rate API.**
- No cash register multi-currency management.
- No concept of "tipo de cambio del día" that restaurants set for walk-in USD/EUR payments.

**Ideal Response:**
> "💵 Conversión al tipo de cambio de hoy:
>
> Cuenta: S/185
> Tipo de cambio: 1 USD = S/3.72
> En dólares: USD 49.73 → Cobra USD 50
>
> Si te da USD 50:
> USD 50 × 3.72 = S/186.00
> Vuelto en soles: S/1.00
>
> 💡 Tip: Muchos restaurantes en San Blas usan S/3.70 para redondear. Tú decides tu tipo."

---

### Scenario 12: Cuenta de grupo con división

**Message:**
> "Mesa de 12 personas, cuenta total S/1,450. Quieren dividir en 4 partes iguales. 2 pagan Yape, 1 tarjeta Visa y 1 efectivo en dólares. Ayúdame a cuadrar"

**Skills involved:** yaya-payments, yaya-sales
**MCP tools needed:** `erpnext-mcp`, `payments-mcp`, exchange rate API (missing)

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 4 | Split billing is not supported. Multi-payment-method per order is not in any skill. Exchange rate needed for USD portion. |
| Accuracy | 4 | Math is simple (1450/4=362.50) but multi-method reconciliation and USD conversion require tools that don't exist. |
| Speed | 5 | Multiple steps, some blocked. |
| Completeness | 3 | No split billing, no multi-payment per order, no USD conversion. |
| Delight | 5 | Could present the math nicely if tools existed. |
| Safety | 6 | Financial accuracy important. |

**Gaps:**
- **No split billing / bill splitting.** Very common restaurant need.
- No multi-payment-method per single order.
- USD conversion gap (again).

**Ideal Response:**
> "🧮 División de cuenta — Mesa 12
>
> Total: S/1,450 ÷ 4 = S/362.50 cada parte
>
> 💜 Parte 1 — Yape: S/362.50
> 💜 Parte 2 — Yape: S/362.50
> 💳 Parte 3 — Visa: S/362.50
> 💵 Parte 4 — USD: $362.50 ÷ 3.72 = USD 97.45 → cobra USD 98
>    Vuelto: S/2.06
>
> 💰 Total a recibir: S/1,450 + S/2.06 (redondeo USD) = S/1,452.06
>
> ¿Confirmo los pagos?"

---

### Scenario 13: Factura a agencia de turismo

**Message:**
> "Factura para Cusco Travel Adventures SAC, RUC 20567890234. Almuerzo grupal: 25 menús turísticos a S/65 cada uno. Incluye bebida y postre. Con IGV"

**Skills involved:** yaya-tax
**MCP tools needed:** `invoicing-mcp → lookup_ruc`, `invoicing-mcp → create_invoice`

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 9 | yaya-tax is well-designed for exactly this. RUC validation, factura creation, IGV calculation. |
| Accuracy | 9 | Clear flow: validate RUC → calculate (25×65=1625, IGV=292.50, total=1917.50) → create invoice. |
| Speed | 8 | Two MCP calls (lookup + create). |
| Completeness | 8 | Full factura flow is supported. Could add "menú detalle" as line item description. |
| Delight | 9 | Clean confirmation with hash and PDF. |
| Safety | 9 | RUC validation before invoicing is a safety net. |

**Gaps:**
- Minor: No concept of "menú turístico" as a bundled product (bebida + postre included).
- No grupo/event invoice template.

**Ideal Response:**
> "📄 Verificando RUC 20567890234...
>
> ✅ CUSCO TRAVEL ADVENTURES SAC
> Estado: Activo — Habido
>
> Factura:
> 📋 25× Menú turístico (incluye bebida y postre) — S/65 c/u
>
> Subtotal: S/1,375.42
> IGV (18%): S/247.58
> Total: S/1,625.00
>
> ¿Confirmo la emisión? 📤"

*Note: IGV calculation — if S/65 is the final price inclusive of IGV, then base=65/1.18=55.08, IGV=9.92. If S/65 is before IGV, total=65×1.18=76.70. This ambiguity should be clarified.*

---

### Scenario 14: Boletas del día

**Message:**
> "Cuántas boletas emití hoy y por cuánto total? Necesito cuadrar con la caja"

**Skills involved:** yaya-tax
**MCP tools needed:** `invoicing-mcp → list_invoices` (filter: type=boleta, date=today)

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 8 | yaya-tax can query invoices. |
| Accuracy | 8 | Straightforward query. |
| Speed | 8 | Single MCP call. |
| Completeness | 6 | Can list boletas but can't cross-reference with cash drawer. No "cuadre de caja" feature. |
| Delight | 7 | Clean summary format. |
| Safety | 8 | Financial reconciliation is important. |

**Gaps:**
- No cash drawer / caja reconciliation feature.
- No cross-reference between boletas and actual cash/card/Yape received.

**Ideal Response:**
> "📄 Boletas emitidas hoy — 21/03
>
> Total boletas: 47
> Monto total: S/4,850.00
>
> Desglose:
> • 32 boletas almuerzo: S/3,200
> • 15 boletas cena: S/1,650
>
> 🔍 Para cuadrar caja:
> • Efectivo soles: S/2,100
> • Yape/Plin: S/1,450
> • Tarjeta: S/1,300
> Total medios: S/4,850 ✅ Cuadra
>
> ¿Todo bien?"

---

### Scenario 15: Resumen para SUNAT

**Message:**
> "Dame resumen de ventas de marzo para mi declaración. Separa: boletas, facturas, ventas en soles, ventas en dólares convertidas a soles, ventas en euros convertidas 🙏"

**Skills involved:** yaya-tax, yaya-analytics
**MCP tools needed:** `invoicing-mcp → list_invoices`, `erpnext-mcp`, `postgres-mcp`, exchange rate API (missing)

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 5 | yaya-tax can list invoices. But multi-currency conversion and SUNAT-format summary require exchange rate data and specific formatting not built in. |
| Accuracy | 4 | Boleta/factura totals are achievable. USD/EUR conversion totals require historical exchange rates for each day of the month. |
| Speed | 5 | Complex aggregation across systems. |
| Completeness | 4 | No multi-currency sales tracking with historical exchange rates. No SUNAT-specific format (PDT 621 fields). |
| Delight | 6 | Could be formatted well but data gaps limit value. |
| Safety | 7 | Tax reporting accuracy is critical. Should include disclaimer. |

**Gaps:**
- **Historical exchange rate tracking.** Each USD/EUR sale should be recorded at the day's exchange rate. The platform doesn't do this.
- No SUNAT PDT 621 field mapping.
- No automatic calculation of IGV payable (ventas IGV - compras IGV = net IGV).

**Ideal Response:**
> "📊 Resumen tributario — Marzo 2026
>
> 📄 BOLETAS:
> • Cantidad: 892
> • Total: S/52,300.00
>
> 📄 FACTURAS:
> • Cantidad: 23
> • Total: S/18,750.00
>
> 💰 VENTAS POR MONEDA:
> • Soles: S/58,200.00
> • USD convertido: $3,420 × TC prom 3.72 = S/12,722.40
> • EUR convertido: €580 × TC prom 4.05 = S/2,349.00
> • NOTA: cada venta se convirtió al TC del día
>
> 📌 BASE IMPONIBLE TOTAL: S/71,050.00
> 📌 IGV VENTAS: S/12,789.00
> 📌 IGV COMPRAS (crédito fiscal): S/8,340.00
> 📌 IGV A PAGAR: S/4,449.00
> 📌 RENTA MENSUAL (1%): S/710.50
>
> ⚠️ Orientativo. Confirma con tu contador.
> 📅 Tu declaración vence el [fecha según RUC]."

---

### Scenario 16: Factura en dólares

**Message:**
> "La agencia Gringo Tours me pide factura en dólares por USD 850. ¿Puedo emitir factura en dólares con SUNAT? ¿Qué tipo de cambio uso?"

**Skills involved:** yaya-tax
**MCP tools needed:** `invoicing-mcp → create_invoice` (currency parameter)

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 6 | yaya-tax knows SUNAT invoicing but doesn't explicitly cover multi-currency factura rules. SUNAT does allow USD-denominated invoices with specific rules. |
| Accuracy | 5 | The regulatory knowledge (yes, SUNAT allows USD invoices; use SBS tipo de cambio venta del día de emisión) requires domain expertise that may or may not be in the LLM's training. |
| Speed | 7 | Quick if the knowledge is available. |
| Completeness | 5 | Can issue the invoice but exchange rate sourcing is missing. |
| Delight | 7 | Informative response about regulations. |
| Safety | 7 | Tax compliance — wrong exchange rate is a compliance risk. Include disclaimer. |

**Gaps:**
- No SBS exchange rate lookup API.
- No explicit multi-currency invoicing guidance in the skill.
- Should reference specific SUNAT regulations (Resolución 007-99/SUNAT).

**Ideal Response:**
> "✅ Sí, SUNAT permite emitir facturas en dólares.
>
> 📋 Reglas:
> • Usa el tipo de cambio venta SBS del día de emisión
> • Hoy: 1 USD = S/3.72 (venta SBS)
> • La factura se emite en USD pero SUNAT la registra en soles
>
> Tu factura:
> 🏢 Gringo Tours (verificar RUC primero)
> 💵 USD 850.00
> 📌 Equivalente: S/3,162.00 (para efectos tributarios)
> Subtotal USD: $720.34
> IGV (18%): $129.66
> Total: $850.00
>
> ¿Me das el RUC de Gringo Tours para validar y emitir?"

---

### Scenario 17: Reserva de grupo

**Message:**
> "Reserva para mañana: grupo de 20 personas de la agencia Peru Hop. Llegan 12:30pm. Menú fijo: entrada + plato de fondo + postre + pisco sour. S/75 por persona. Confirma"

**Skills involved:** yaya-appointments, yaya-sales
**MCP tools needed:** `appointments-mcp → book_appointment`, `erpnext-mcp → create_sales_order`

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 6 | yaya-appointments can book, but group restaurant reservations with pre-set menus and per-person pricing aren't well modeled. |
| Accuracy | 6 | Can record the booking. Can calculate 20×75=1500. But linking a booking to a pre-order is not built in. |
| Speed | 7 | Straightforward if the data model fits. |
| Completeness | 5 | No group reservation features (seating arrangement, pre-order, deposit). No agency contact management. |
| Delight | 7 | Can produce a nice confirmation. |
| Safety | 8 | Should confirm dietary requirements for groups. |

**Gaps:**
- No group booking with pre-set menu concept.
- No deposit/prepayment for group reservations.
- No agency relationship management (CRM could help but not restaurant-specific).
- No seating capacity check (can the restaurant seat 20?).

**Ideal Response:**
> "✅ Reserva confirmada — Peru Hop
>
> 📅 Mañana 22/03 — 12:30 PM
> 👥 20 personas
> 🍽️ Menú fijo:
>    • Entrada
>    • Plato de fondo
>    • Postre
>    • Pisco sour
> 💰 S/75 × 20 = S/1,500
>
> 📋 Acciones:
> • Chef avisado para preparar para 20 ✅
> • Mesa grande armada ✅
> • ¿Necesitas factura para la agencia?
> • ¿Hay algún vegetariano o alérgico en el grupo?
>
> ¿Confirmo con la agencia por WhatsApp?"

---

### Scenario 18: Turno de personal

**Message:**
> "El mozo Carlos no viene mañana, está enfermo. ¿Quién lo puede cubrir? Necesito alguien para el turno de almuerzo 11am-4pm"

**Skills involved:** None. No HR/staff management skill exists.
**MCP tools needed:** None available.

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 1 | No employee/staff management skill. No roster, no shift scheduling, no availability tracking. |
| Accuracy | 0 | Cannot know who is available to cover. |
| Speed | 1 | Cannot answer. |
| Completeness | 0 | Complete gap. |
| Delight | 2 | Could express sympathy but can't help. |
| Safety | 5 | No concerns beyond inability to help. |

**Gaps:**
- **No HR/staff management skill.** No employee roster, shift scheduling, availability tracking, sick leave recording.
- No labor law awareness (Peru labor regulations for restaurants).
- This is a daily pain point for restaurant owners.

**Ideal Response (if skill existed):**
> "😟 Carlos enfermo. Revisando disponibilidad...
>
> Mozos libres mañana almuerzo (11am-4pm):
> • Pedro — tuvo día libre ayer, podría cubrir
> • Ana — trabaja turno cena (7pm), podría hacer doble
>
> ¿Contacto a alguno por WhatsApp para confirmar?
>
> 📝 Registré la ausencia de Carlos. ¿Sabe si vuelve pasado mañana?"

---

### Scenario 19: Evento especial (Fiestas Patrias)

**Message:**
> "Para Fiestas Patrias quiero armar un menú especial. Recuérdame 2 semanas antes para empezar a planificar. Es 28 de julio"

**Skills involved:** yaya-followup (scheduled reminder)
**MCP tools needed:** Hermes cron or reminder system

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 8 | yaya-followup or Hermes cron can schedule a reminder for July 14. |
| Accuracy | 8 | Date math is correct (28 julio - 14 días = 14 julio). |
| Speed | 8 | Quick scheduling. |
| Completeness | 6 | Can remind, but can't help with actual menu planning. No event management features. |
| Delight | 8 | Reliable reminder gives peace of mind. |
| Safety | 9 | No concerns. |

**Gaps:**
- Can remind but can't assist with event planning (menu creation, pricing, marketing, decoration, staffing).
- No holiday calendar for Peru (Fiestas Patrias, Inti Raymi, etc.).

**Ideal Response:**
> "📅 Recordatorio agendado:
>
> 🇵🇪 Menú especial Fiestas Patrias
> ⏰ Te recordaré el 14 de julio (2 semanas antes)
>
> 💡 Para ese día podrías planificar:
> • Menú especial patriótico
> • Precios de temporada alta
> • Decoración temática
> • Publicación en Instagram/TripAdvisor
> • Stock extra de pisco para pisco sours 🥂
>
> ¡Agendado! ✅"

---

### Scenario 20: Programar pedido de pescado

**Message:**
> "Agenda pedido de pescado para que salga de Lima el miércoles por la noche. Necesito 15kg lenguado, 10kg pulpo, 5kg camarones. Llega jueves temprano"

**Skills involved:** yaya-followup (reminder), yaya-inventory (conceptually)
**MCP tools needed:** Hermes cron, `erpnext-mcp → create_purchase_order` (not skill-guided)

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 5 | Can set a reminder. Can't actually place a purchase order with a supplier, track logistics, or manage delivery. |
| Accuracy | 7 | Reminder scheduling is accurate. |
| Speed | 7 | Quick for the reminder part. |
| Completeness | 3 | No supplier management, no purchase order system, no logistics tracking, no delivery confirmation. |
| Delight | 5 | Partial solution. |
| Safety | 7 | Perishable goods — should flag cold chain concerns. |

**Gaps:**
- **No supplier/procurement management.** Can't send purchase orders to suppliers.
- No delivery tracking for incoming goods.
- No cold chain / perishable goods awareness.
- No automatic reorder based on usage patterns.

**Ideal Response:**
> "📦 Pedido de pescado agendado
>
> 🗓️ Miércoles noche — envío desde Lima:
> • 🐟 Lenguado: 15kg
> • 🐙 Pulpo: 10kg
> • 🦐 Camarones: 5kg
>
> ⏰ Te recordaré el miércoles a las 3pm para que confirmes con el proveedor.
>
> 📊 Costo estimado (precios de la semana pasada):
> • Lenguado 15kg × S/45 = S/675
> • Pulpo 10kg × S/38 = S/380
> • Camarones 5kg × S/55 = S/275
> • Total estimado: S/1,330
>
> ¿Quieres que le mande el pedido al proveedor por WhatsApp?"

---

### Scenario 21: Temporada alta vs baja

**Message:**
> "Compara mis ventas de julio (temporada alta) vs enero (baja). Necesito saber cuánto cae y planificar mejor"

**Skills involved:** yaya-analytics
**MCP tools needed:** `erpnext-mcp` + `postgres-mcp`

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 7 | yaya-analytics can compare periods if data exists. |
| Accuracy | 6 | Depends on having complete sales data for both months. |
| Speed | 7 | Standard query. |
| Completeness | 6 | Can compare revenue but lacks restaurant-specific seasonality analysis (occupancy rates, covers, tourist vs local mix). |
| Delight | 8 | yaya-analytics formatting is good for comparisons. |
| Safety | 9 | No concerns. |

**Gaps:**
- No tourist seasonality modeling.
- No occupancy rate tracking.
- No forward-looking planning tools (cash flow projection for low season).

**Ideal Response:**
> "📊 Julio 2025 vs Enero 2026
>
> 💰 Ventas:
> • Julio: S/68,000 (temporada alta 🔥)
> • Enero: S/22,000 (temporada baja)
> • Caída: -68% 📉
>
> 👥 Clientes/día promedio:
> • Julio: 85 personas
> • Enero: 28 personas
>
> 🍽️ Ticket promedio:
> • Julio: S/72 (turistas gastan más)
> • Enero: S/58 (más locales)
>
> 💡 Estrategias para temporada baja:
> 1. Menú ejecutivo económico para locales (S/15-20)
> 2. Convenios con hoteles que tienen huéspedes todo el año
> 3. Delivery más agresivo en zona urbana
> 4. Reducir personal temporal en enero-marzo"

---

### Scenario 22: Food cost

**Message:**
> "Cuál es mi food cost este mes? Gasté cuánto en insumos vs cuánto vendí? Debería estar en 30-35%, dime si estoy bien"

**Skills involved:** yaya-analytics
**MCP tools needed:** `erpnext-mcp` + `postgres-mcp`

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 5 | yaya-analytics can compare totals IF purchases and sales are both recorded in ERPNext. But purchase recording is a gap (Scenario 2). |
| Accuracy | 4 | If purchases aren't systematically recorded, food cost calculation is impossible. |
| Speed | 6 | Standard query if data exists. |
| Completeness | 4 | No recipe-level food cost analysis. No waste tracking. No variance analysis (theoretical vs actual food cost). |
| Delight | 7 | Good if the numbers are available. |
| Safety | 8 | Financial analysis, accuracy matters. |

**Gaps:**
- Circular dependency: can't calculate food cost without proper purchase recording (Scenario 2 gap).
- No waste/spillage tracking.
- No theoretical food cost (from recipes) vs actual comparison.
- No per-dish food cost analysis.

**Ideal Response:**
> "📊 Food Cost — Marzo 2026 (hasta hoy)
>
> 🛒 Gastos en insumos: S/18,400
> 💰 Ventas totales: S/56,200
>
> 📌 Food Cost: 32.7% ✅
> (Tu rango objetivo: 30-35%)
>
> Desglose por categoría:
> • Pescado/mariscos: 45% del gasto (↗️ subió 8% vs feb)
> • Verduras/frutas: 20%
> • Licores/bar: 18%
> • Otros: 17%
>
> ⚠️ El pescado está presionando tu food cost. Si sube más, considera ajustar precios o cambiar proveedor.
>
> 💡 Si quieres bajar a 30%, necesitas reducir S/1,540 en compras o subir ventas S/5,133."

---

### Scenario 23: Platos más populares

**Message:**
> "Top 5 platos más pedidos del mes y su margen de ganancia. Quiero saber si los más populares son los más rentables 📊"

**Skills involved:** yaya-analytics
**MCP tools needed:** `erpnext-mcp` + `postgres-mcp`

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 5 | Can rank by sales volume. But "margen de ganancia" per dish requires recipe costing (BOM) — a gap. |
| Accuracy | 4 | Volume ranking: yes. Margin per dish: no (no recipe costs). |
| Speed | 6 | Volume query is fast; margin calculation is blocked. |
| Completeness | 4 | Can show popularity but not profitability. The whole point of the query is the intersection. |
| Delight | 7 | Good format for the data that IS available. |
| Safety | 9 | No concerns. |

**Gaps:**
- Same BOM/recipe costing gap as Scenario 10 and 22.
- No menu engineering matrix (stars, plowhorses, puzzles, dogs).
- Can't answer the owner's actual question: "are my popular items profitable?"

**Ideal Response:**
> "📊 Top 5 platos — Marzo 2026
>
> 🏆 Por ventas:
> 1. Ceviche clásico — 234 pedidos — S/8,892
>    Costo: ~S/13 → Margen: 66% ⭐
> 2. Lomo saltado — 189 pedidos — S/7,938
>    Costo: ~S/15 → Margen: 64% ⭐
> 3. Pisco sour — 312 pedidos — S/7,800
>    Costo: ~S/6 → Margen: 76% 🔥
> 4. Alpaca a la parrilla — 98 pedidos — S/5,390
>    Costo: ~S/22 → Margen: 60% ✅
> 5. Ají de gallina — 156 pedidos — S/5,460
>    Costo: ~S/10 → Margen: 71% 🔥
>
> 💡 Insight: Tu pisco sour es el más rentable (76% margen). Promociónalo más.
> ⚠️ La alpaca es popular pero tu margen más bajo. ¿Puedes negociar mejor precio con el proveedor?"

---

### Scenario 24: Reseña negativa (TripAdvisor)

**Message:**
> "Yaya, me dejaron 1 estrella en TripAdvisor diciendo que encontraron un pelo en el ceviche 😰 Cómo respondo profesionalmente en inglés? Esto me puede arruinar"

**Skills involved:** yaya-escalation (reputation crisis), yaya-voice (bilingual)
**MCP tools needed:** None specific — this is advisory/content generation.

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 7 | LLM can draft a professional English response. yaya-escalation recognizes this as critical. yaya-voice understands bilingual needs. |
| Accuracy | 7 | Good English response drafting is within LLM capability. |
| Speed | 8 | Immediate draft generation. |
| Completeness | 6 | Can draft response but can't post to TripAdvisor. No reputation management system. No template library for common complaint types. |
| Delight | 8 | Immediate, empathetic help with a stressful situation. |
| Safety | 8 | Should advise caution with admissions of fault. |

**Gaps:**
- No TripAdvisor/Google Maps API integration for direct posting.
- No reputation management system (review monitoring, response tracking).
- No template library for restaurant-specific complaints.
- No analysis of review trends.

**Ideal Response:**
> "😰 Entiendo tu preocupación. Una reseña así sí puede afectar. Pero una respuesta profesional puede mitigar mucho el daño. Aquí va:
>
> 🇬🇧 Respuesta sugerida:
>
> 'Dear [Guest's name],
>
> Thank you for bringing this to our attention. We sincerely apologize for this experience — it falls far below the standards we set for ourselves at Inti Raymi.
>
> We take hygiene very seriously. Upon reading your review, we've conducted an immediate review of our kitchen protocols and implemented additional measures to prevent this from happening again.
>
> We would love the opportunity to make this right. Please contact us directly at [email] so we can offer you a complimentary meal and show you the Inti Raymi experience you deserve.
>
> Warmly,
> Miguel Torres, Owner'
>
> 💡 Tips:
> • Responde dentro de 24 horas
> • NO discutas ni niegues — reconoce y ofrece solución
> • Un gesto (comida gratis) puede convertir 1⭐ en 4⭐
> • Los futuros turistas leen TUS respuestas, no solo la reseña
>
> ¿Lo publico tal cual o quieres ajustar algo?"

---

### Scenario 25: Inspección DIGESA

**Message:**
> "Mañana viene inspección sanitaria de la municipalidad. Qué documentos necesito tener listos? Revisa si tengo todo al día"

**Skills involved:** yaya-escalation (advisory), yaya-tax (compliance awareness)
**MCP tools needed:** None specific — regulatory advisory.

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 5 | LLM has general knowledge of Peru sanitary regulations. But platform has NO document management, no compliance tracking, no "what's up to date" verification. |
| Accuracy | 5 | General regulatory knowledge is available but may not be current. No way to verify Miguel's specific documents. |
| Speed | 7 | Quick advisory response. |
| Completeness | 3 | Can list general requirements but can't verify if Miguel actually has them. No document storage, no expiry tracking, no compliance checklist. |
| Delight | 6 | Helpful checklist, but hollow without actual verification. |
| Safety | 7 | Should include disclaimer about consulting with a health inspector or lawyer. |

**Gaps:**
- **No compliance/document management skill.** Licenses, permits, inspections, certifications — none tracked.
- No expiry date tracking for licenses.
- No inspection preparation checklist feature.
- Can't "review if everything is up to date" — has no documents on file.

**Ideal Response:**
> "📋 Checklist inspección sanitaria municipal:
>
> DOCUMENTOS (ten listos):
> ✅ Licencia de funcionamiento vigente
> ✅ Carnet sanitario de TODOS los empleados (14 personas)
> ✅ Certificado de fumigación (vigente, cada 6 meses)
> ✅ Análisis microbiológico de agua
> ✅ Programa de higiene y saneamiento
> ✅ Registro de temperaturas de refrigeración
> ✅ Registro de limpieza y desinfección
>
> VERIFICAR EN COCINA:
> ✅ Termómetros funcionando en refrigeradoras
> ✅ Alimentos tapados y etiquetados con fecha
> ✅ Tablas de corte por colores (rojo=carnes, verde=verduras, azul=pescado)
> ✅ Jabón y toallas en lavamanos
> ✅ Trampas de grasa limpias
> ✅ Uniformes limpios para todo el personal
>
> ⚠️ NO puedo verificar si tus documentos están vigentes porque no los tengo registrados. ¿Quieres que empecemos a llevar un control de vencimientos?
>
> 💡 Tip: Los inspectores revisan especialmente la cadena de frío del pescado. Asegúrate que el lenguado/corvina esté a máx 4°C."

---

### Scenario 26: Intoxicación de cliente

**Message:**
> "Un turista dice que se enfermó después de comer acá y amenaza con demandar. Qué hago? Necesito protocolo de emergencia"

**Skills involved:** yaya-escalation (CRITICAL)
**MCP tools needed:** None — emergency advisory + human escalation.

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 6 | yaya-escalation can recognize this as critical and escalate. LLM can provide general guidance. But this is a legal/health emergency that requires human judgment. |
| Accuracy | 5 | General guidance is available but should NOT be treated as legal advice. |
| Speed | 8 | Immediate response is possible. |
| Completeness | 5 | Can provide emergency protocol outline but can't handle legal implications. |
| Delight | 5 | Not about delight — about crisis management. |
| Safety | 6 | **Should immediately recommend calling a lawyer and not making admissions.** The platform should be very cautious here. |

**Gaps:**
- No legal advisory capability.
- No incident management system.
- No connection to legal services, insurance, or health authorities.
- No evidence preservation guidance specific to food service.
- Should connect to a lawyer, not just provide AI advice.

**Ideal Response:**
> "🚨 PROTOCOLO DE EMERGENCIA — Posible intoxicación
>
> INMEDIATO:
> 1. NO admitas culpa ni responsabilidad (ni oral ni escrito)
> 2. Muestra preocupación genuina: '¿Está bien? ¿Necesita atención médica?'
> 3. Si necesita atención, ofrece llamar al SAMU (106) o llevarle a clínica
>
> DOCUMENTAR (AHORA):
> 4. Qué comió exactamente y a qué hora
> 5. Guardar muestras de los mismos platos que pidió (NO desechar)
> 6. Revisar si otros comensales del mismo turno tienen síntomas
> 7. Fotos de la bitácora de cocina del día
> 8. Temperaturas de refrigeración (foto del termómetro)
>
> LEGAL:
> 9. Contacta a tu abogado HOY
> 10. Contacta a tu seguro (si tienes)
> 11. NO firmes nada, NO pagues nada todavía
> 12. Si el turista quiere ir a INDECOPI, es su derecho — no te opongas
>
> ⚠️ Esto requiere asesoría legal. ¿Tienes abogado? Si no, puedo ayudarte a encontrar uno en Cusco.
>
> ¿Otros comensales han reportado síntomas?"

---

### Scenario 27: Turista con moneda rara (yenes)

**Message:**
> "Un turista japonés solo tiene yenes. Son ¥15,000. ¿A cuánto equivale en soles? ¿Le acepto o le digo que cambie en una casa de cambio?"

**Skills involved:** None (exchange rate gap)
**MCP tools needed:** Exchange rate API (NOT available)

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 3 | No exchange rate API. |
| Accuracy | 2 | LLM might know approximate JPY/PEN but not today's rate. |
| Speed | 4 | Would be fast if tool existed. |
| Completeness | 3 | Can't convert accurately. Can advise on cash-of-cambio recommendation. |
| Delight | 4 | Partial help at best. |
| Safety | 5 | Financial risk from wrong conversion. |

**Gaps:**
- Exchange rate API (same gap, third time).
- No guidance on which currencies to accept vs reject in restaurant settings.
- No nearby casa de cambio lookup.

**Ideal Response:**
> "🇯🇵 Yenes japoneses
>
> ¥15,000 ≈ S/370 al tipo de cambio de hoy (1 JPY ≈ S/0.0247)
>
> 💡 Mi recomendación: NO aceptar yenes.
>
> Razones:
> • Difícil de cambiar en Cusco (pocas casas de cambio los aceptan)
> • Alto riesgo de pérdida por tipo de cambio
> • Solo acepta USD y EUR en efectivo
>
> Sugiérele al turista:
> 1. 💳 Pagar con tarjeta (Visa/Mastercard, conversión automática)
> 2. 🏧 Sacar soles de un cajero (GlobalNet, BCP en Plaza de Armas)
> 3. 🏪 Casa de cambio en Portal de Panes (frente a Plaza de Armas)
>
> ¿Necesita ayuda con las indicaciones en inglés?"

---

### Scenario 28: Safety-critical — Alergia a mariscos

**Message:**
> "URGENTE: turista dice que es alérgico severo a mariscos y pidió lomo saltado. El chef usó la misma tabla que el ceviche. Ya comió la mitad. ¿Qué hago? 😱"

**Skills involved:** yaya-escalation (CRITICAL SAFETY)
**MCP tools needed:** None — emergency health advisory.

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 6 | LLM can provide emergency guidance. But this is a MEDICAL EMERGENCY that should result in immediate human action, not chatbot interaction. |
| Accuracy | 6 | General anaphylaxis response is well-documented. |
| Speed | 9 | Immediate response critical. |
| Completeness | 5 | Can provide first-response guidance but can't replace emergency medical response. |
| Delight | N/A | Not applicable — emergency situation. |
| Safety | 7 | **CRITICAL.** Must immediately advise: stop eating, watch for symptoms, have EpiPen ready, call emergency services. The platform should not delay. |

**Gaps:**
- No emergency response protocol system.
- No integration with local emergency services (SAMU 106, nearest hospital).
- No allergen tracking in menu items (preventive measure that would avoid this scenario).

**Ideal Response:**
> "🚨🚨🚨 EMERGENCIA ALÉRGICA — ACTÚA AHORA
>
> 1. RETIRA EL PLATO INMEDIATAMENTE
> 2. Pregúntale al turista: '¿Tiene epinefrina/EpiPen?'
> 3. OBSERVA síntomas (pueden tardar minutos a 2 horas):
>    • Hinchazón de labios/lengua/garganta
>    • Dificultad para respirar
>    • Urticaria/ronchas
>    • Mareo
>
> SI HAY CUALQUIER SÍNTOMA:
> ☎️ LLAMA AL 106 (SAMU) — YA
> 📍 Hospital Regional del Cusco: Av. de la Cultura (10 min)
> 📍 Clínica Pardo: Av. de la Cultura 710 (15 min)
>
> SI NO HAY SÍNTOMAS (aún):
> • Mantén vigilancia por 2 horas
> • Ofrece llevarle a una clínica por precaución
> • El cross-contamination puede no causar reacción severa, pero no arriesgues
>
> ⚠️ NO minimices la situación con el turista. Tómalo en serio.
>
> 📝 Después del incidente:
> • Implementa tablas de corte separadas OBLIGATORIO
> • Protocolo de alérgenos en cocina
> • Preguntar por alergias ANTES de servir"

---

### Scenario 29: Safety-critical — Accidente en cocina

**Message:**
> "El cocinero se quemó con aceite hirviendo en el brazo. Tiene ampolla grande. Qué primeros auxilios le doy? Tengo que reportar a algún lado?"

**Skills involved:** yaya-escalation (safety)
**MCP tools needed:** None — emergency advisory.

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 6 | LLM can provide first aid guidance. |
| Accuracy | 7 | Burn first aid is well-documented. |
| Speed | 9 | Immediate response. |
| Completeness | 5 | First aid yes. Labor reporting requirements need domain expertise. |
| Delight | N/A | Emergency. |
| Safety | 7 | Must provide correct burn first aid. Must advise on when to seek professional medical attention. |

**Gaps:**
- No employee incident tracking.
- No labor law compliance (Peru requires workplace accident reporting to MTPE for businesses with certain number of employees).
- No connection to ESSALUD or workers' comp.

**Ideal Response:**
> "🚑 PRIMEROS AUXILIOS — Quemadura por aceite
>
> AHORA:
> 1. Poner el brazo bajo AGUA FRÍA (NO helada) por 20 minutos
> 2. NO reventar la ampolla
> 3. NO aplicar pasta dental, mantequilla, ni remedios caseros
> 4. NO cubrir con algodón (se pega)
> 5. Cubrir con gasa estéril limpia o film transparente
> 6. Dar ibuprofeno para el dolor
>
> ⚠️ Si la ampolla es mayor a 5cm o cubre zona de articulación → MÉDICO
> 📍 ESSALUD Cusco o emergencia de hospital más cercano
>
> 📋 REPORTAR:
> • Sí, como empleador con 14 trabajadores, debes reportar:
>   • Registrar en tu 'Registro de Accidentes de Trabajo'
>   • Si la quemadura requiere más de 1 día de descanso, reportar al MTPE dentro de 24 horas (formulario en portal web)
>   • ESSALUD cubre atención médica si el trabajador está en planilla
>
> ¿El cocinero está en planilla/ESSALUD?"

---

### Scenario 30: Corte de luz durante servicio

**Message:**
> "Se fue la luz en pleno almuerzo con 35 personas sentadas. Tengo refrigeradora llena de pescado fresco. ¿Cuánto tiempo aguanta? ¿Qué hago con los clientes?"

**Skills involved:** yaya-escalation (operational emergency)
**MCP tools needed:** None — emergency advisory.

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 6 | LLM has general knowledge about food safety during power outages. |
| Accuracy | 7 | FDA/food safety guidelines on refrigeration are well-known. |
| Speed | 9 | Immediate response. |
| Completeness | 6 | Can provide food safety timeline and customer management tips. |
| Delight | 6 | Practical, actionable advice in crisis. |
| Safety | 8 | Food safety is critical. Must provide correct cold chain guidance. |

**Gaps:**
- No operational emergency protocols.
- No utility company contact integration.
- No generator/backup power management.

**Ideal Response:**
> "⚡ CORTE DE LUZ — Plan de acción
>
> 🐟 PESCADO FRESCO:
> • Refrigeradora cerrada: mantiene frío 4-6 horas
> • NO ABRIR la puerta (cada apertura = pierde 30 min)
> • Si tienes hielo, ponlo encima del pescado DENTRO de la refri
> • Si pasan 4 horas sin luz: el pescado crudo DEBE descartarse (riesgo sanitario)
>
> 👥 CLIENTES (35 personas):
> 1. Explica con calma y buen humor: 'Parece que Cusco decidió darnos un descanso ☀️'
> 2. Ofrece velas para las mesas (ambiente, no oscuridad)
> 3. Platos que YA están servidos: sin problema
> 4. Platos pendientes: lo que se pueda preparar sin electricidad (ensaladas, ceviches — no necesitan cocción)
> 5. Ofrece pisco sours como cortesía por la molestia 🍸
> 6. Si se extiende >30 min: ofrece 10% de descuento en la cuenta
>
> ☎️ ACCIONES:
> • Llama a la empresa eléctrica: Electro Sur Este → 054-223333
> • ¿Tienes generador? Si no, considera comprar uno para emergencias
>
> ¿La cocina a gas sigue funcionando? Eso te salva varios platos."

---

## Summary: Miguel Torres — Restaurante Inti Raymi

### Overall Scores (Average across all 30 scenarios)

| Dimension | Average Score |
|-----------|---------------|
| Handleable | 5.4 |
| Accuracy | 4.9 |
| Speed | 6.5 |
| Completeness | 4.1 |
| Delight | 5.9 |
| Safety | 7.0 |
| **Overall** | **5.6 / 10** |

### Top 3 Strengths

1. **Tax/Invoicing (yaya-tax)** — Factura/boleta generation, RUC validation, SUNAT compliance guidance. This is the platform's strongest vertical for Miguel. Scenarios 13-14 scored 8-9.

2. **Crisis Communication & Escalation** — The platform can generate excellent advisory responses for emergencies (Scenarios 24, 26, 28, 29, 30). The LLM's general knowledge is strong here, and yaya-escalation's framework helps prioritize.

3. **Analytics Framework (yaya-analytics)** — The STRUCTURE for reporting is excellent (formatting, comparisons, insights). If the data were properly recorded, analytics would be very strong. The skill design is solid even if data ingestion is a gap.

### Top 3 Critical Gaps

1. **🚨 NO MULTI-CURRENCY SUPPORT / EXCHANGE RATE API** — This is a DEALBREAKER for Cusco. Miguel handles PEN, USD, EUR daily. Every conversion scenario failed (Scenarios 3, 8, 11, 12, 15, 27). Without real-time exchange rates, the platform is blind to 30-40% of his revenue. **Must add an exchange rate MCP tool or API integration.**

2. **🚨 NO RESTAURANT-SPECIFIC FEATURES** — The platform is built for retail/e-commerce, not restaurants. Missing: daily menu management, recipe/BOM costing, food cost calculation, table/reservation management (party sizes, not appointments), kitchen orders, covers tracking, staff shifts. The yaya-appointments skill is for salons/clinics — not restaurants. **Needs a yaya-restaurant or yaya-menu skill.**

3. **🚨 NO PROCUREMENT/PURCHASE RECORDING** — Miguel buys ingredients daily at the market. There's no skill to record purchases, track suppliers, or manage incoming inventory for perishables. Without purchase data, food cost analysis (his #1 financial metric) is impossible. **Needs a yaya-procurement skill or expansion of yaya-inventory.**

### Additional Gaps (Important but not critical)

4. **No HR/staff management** — Shift scheduling, sick leave, payroll, tip distribution. (Scenario 18)
5. **No allergen/dietary tracking** — Critical for tourist restaurants serving international guests. (Scenario 6)
6. **No compliance/document management** — Licenses, permits, inspections. (Scenario 25)
7. **No delivery management** — No driver assignment, ETA, tracking. (Scenario 4)
8. **No POS integration** — Can't reconcile with existing POS system. (Scenario 14)

### PMF Readiness Score: 25%

**Brutal truth:** The Yaya Platform in its current form is NOT ready for a Cusco restaurant owner. It would handle maybe 4-5 of his 30 daily scenarios well (invoicing, reminders, crisis advisory). The other 25 scenarios hit fundamental gaps. Miguel would try it for a day and say "esto no entiende mi negocio."

### Key Insight for Restaurant / Tourism Segment

**Restaurants are NOT retail stores that serve food.** The platform was designed for product-based retail businesses (the zapatería examples in every skill file). Restaurants have fundamentally different needs:
- **Dynamic inventory** (daily menu changes based on market availability)
- **Multi-currency daily** (not occasional)
- **Recipe-based costing** (not unit cost)
- **Service periods** (almuerzo/cena, not business hours)
- **Table management** (not appointment slots)
- **Perishable supply chain** (daily procurement, cold chain)
- **Staff scheduling** (multiple roles, shifts, tips)

To serve restaurants, Yaya needs either a dedicated restaurant vertical or 3-4 new skills (yaya-restaurant, yaya-procurement, yaya-exchange-rates, yaya-staff). Without these, the restaurant TAM is zero.
