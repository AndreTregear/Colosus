# Round 2 Evaluation: Patricia Vega — Botica Santa Rosa (Trujillo)

**Evaluator:** Yaya Platform Test Agent
**Date:** 2026-03-21
**Persona:** Licensed pharmacist (Química Farmacéutica), 5 employees, RUC active, RMT regime, ~S/550,000 annual revenue

---

## Critical Context

Patricia is a **much better fit** for the Yaya Platform than María Flores. She has:
- A formal business with RUC, employees, and structured operations
- Customers who could message via WhatsApp for delivery orders and stock queries
- Real invoicing needs (boletas, facturas, SUNAT compliance)
- Inventory that benefits from tracking (expiration dates, controlled substances)
- Team scheduling needs
- Payment processing across multiple methods

However, the pharmacy vertical introduces **regulated domain complexity** that the platform was not specifically designed for: DIGEMID compliance, controlled substance tracking, prescription requirements, cold chain management, and safety-critical health scenarios. This is where the evaluation gets interesting.

---

## Scenario Evaluations

### Scenario 1: Consulta de stock

**Message:**
> "Yaya, ¿cuántas cajas de Amoxicilina 500mg me quedan? Tanto genérico como la de marca (Amoxil). 💊"

**Skills involved:** yaya-inventory
**MCP tools needed:** `erpnext-mcp` (get_stock_levels with item filters for Amoxicilina generic + Amoxil brand)

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 8 | Inventory skill does exactly this — stock lookup by product with variants |
| Accuracy | 7 | Can query ERPNext for item stock. Needs items pre-loaded with correct naming (generic vs brand). |
| Speed | 8 | Quick MCP call |
| Completeness | 7 | Stock count works. Doesn't show lot/batch, expiry dates, or which shelf. |
| Delight | 7 | Clean, professional response |
| Safety | 7 | Should flag if stock is below reorder point |

**Gaps:**
- No lot/batch tracking (critical for pharma — different batches have different expiry dates)
- No expiry date visibility per batch
- No shelf/location within the pharmacy
- Inventory skill doesn't differentiate "generic" vs "brand" as a first-class concept — it uses variants (size/color), which could be adapted

**Ideal response:**
> "📊 Stock de Amoxicilina 500mg:
> 
> 💊 Genérico (Lab. Portugal):
> • 32 cajas disponibles
> • Lote más próximo a vencer: Lote A234 — vence 15/08/2026
> 
> 💊 Amoxil (GSK):
> • 8 cajas disponibles
> • Lote: B567 — vence 12/11/2026
> 
> ⚠️ El genérico está bien de stock. El Amoxil está por debajo del punto de reorden (10 cajas). ¿Incluyo en el próximo pedido a Química Suiza?"

---

### Scenario 2: Registro de venta

**Message:**
> "Venta: Paracetamol 500mg x 20 tabletas S/3.50, Omeprazol 20mg x 10 S/8, Ibuprofeno 400mg x 20 S/5. Pagó efectivo. Boleta."

**Skills involved:** yaya-sales (order creation), yaya-tax (boleta generation)
**MCP tools needed:** `erpnext-mcp` (create_sales_order), `invoicing-mcp` (create_invoice, document_type="03")

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 8 | Sales + invoicing skills handle this well |
| Accuracy | 8 | Clear items, prices, payment method |
| Speed | 7 | Two MCP calls (order + boleta), should be fast |
| Completeness | 7 | Creates order and boleta. Doesn't track dispensing log or check if prescription required. |
| Delight | 7 | Professional, efficient |
| Safety | 5 | **Should check if any of these items require prescription.** Paracetamol, Omeprazol, Ibuprofeno are OTC, but the system should have this check built in. |

**Gaps:**
- No prescription requirement check per medication
- No dispensing log for DIGEMID compliance
- No Drug-Drug interaction check (even for OTC)
- boleta emission works via yaya-tax, but needs customer DNI for proper boleta (or "consumidor final")
- No pharmaceutical product category awareness

**Ideal response:**
> "✅ Venta registrada:
> 
> 💊 Paracetamol 500mg x20 — S/3.50
> 💊 Omeprazol 20mg x10 — S/8.00
> 💊 Ibuprofeno 400mg x20 — S/5.00
> 
> 💰 Total: S/16.50 — Efectivo ✅
> 📄 Boleta emitida: B001-00000245
> 
> (Todos OTC — no requieren receta ✅)
> 
> ¿Algo más?"

---

### Scenario 3: Pedido a distribuidora

**Message:**
> "Necesito hacer pedido a Química Suiza: 50 cajas Amoxicilina 500mg, 30 cajas Losartán 50mg, 20 cajas Metformina 850mg, 40 cajas Paracetamol genérico, 10 frascos Salbutamol inhalador. Revisa si tengo crédito disponible."

**Skills involved:** yaya-inventory (purchase order)
**MCP tools needed:** `erpnext-mcp` (create_purchase_order, get_supplier_credit)

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 6 | Can create purchase order in ERPNext. Credit check is theoretically possible but not a standard feature. |
| Accuracy | 6 | Items need to be in catalog. Supplier credit tracking may not exist in ERPNext config. |
| Speed | 6 | Requires multiple lookups |
| Completeness | 5 | PO creation yes. Credit check depends on supplier accounting being set up. No distributor-specific pricing. |
| Delight | 5 | Functional but missing the credit insight she specifically asked for |
| Safety | 6 | Should flag if any items are controlled substances (Amoxicilina requires prescription) |

**Gaps:**
- No supplier credit limit tracking feature
- No distributor-specific pricing (Química Suiza prices vs DECO prices vs Albis prices)
- No purchase history comparison ("last time you ordered 30 Amoxicilina, why 50 now?")
- No automatic reorder optimization based on sales velocity
- ERPNext can manage suppliers but the depth of pharmacy-distributor relationships isn't modeled

**Ideal response:**
> "📋 Pedido para Química Suiza:
> 
> 💊 50 cajas Amoxicilina 500mg
> 💊 30 cajas Losartán 50mg
> 💊 20 cajas Metformina 850mg
> 💊 40 cajas Paracetamol genérico
> 💊 10 frascos Salbutamol inhalador
> 
> 💰 Estimado del pedido: S/3,850 (basado en último precio)
> 
> 📊 Crédito con Química Suiza:
> • Línea de crédito: S/15,000
> • Utilizado: S/6,200
> • Disponible: S/8,800 ✅ Cubre este pedido
> • Facturas pendientes: 2 (vencen 28/03 y 05/04)
> 
> ¿Confirmo el pedido? También puedo enviarlo por WhatsApp al representante si tienes su número."

---

### Scenario 4: Delivery de medicamentos

**Message:**
> "Señora pide delivery: insulina NPH, jeringas de insulina x 10, tiras reactivas de glucosa x 50. Dirección: Av. Mansiche 456. Paga Yape. ¿La insulina necesita cooler para el envío?"

**Skills involved:** yaya-sales (order), yaya-payments (Yape), yaya-inventory (stock check)
**MCP tools needed:** `erpnext-mcp` (create_sales_order, check_stock), `crm-mcp` (customer lookup/create)

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 6 | Can create order with delivery address. Can process Yape payment. |
| Accuracy | 5 | Order creation works. Cold chain question is pure domain knowledge — no skill handles this. |
| Speed | 6 | Multi-step but manageable |
| Completeness | 4 | Order yes. Cold chain guidance no. Delivery coordination with repartidor not built-in. |
| Delight | 5 | Missing the safety-critical cold chain answer |
| Safety | 3 | **CRITICAL: Insulin requires cold chain (2-8°C). The platform MUST answer the cooler question correctly or patient health is at risk.** |

**Gaps:**
- **CRITICAL: No cold chain/pharmaceutical storage knowledge.** The cooler question is a safety issue. Insulin degrades above 8°C.
- No delivery dispatch to repartidor (team member #5 in Patricia's setup)
- No prescription verification for insulin (requires medical prescription in Peru)
- No pharmaceutical product attributes (storage requirements, prescription category, controlled status)
- yaya-sales is designed for retail products, not temperature-sensitive pharmaceuticals

**Ideal response:**
> "📋 Pedido delivery:
> 
> 💊 Insulina NPH — S/42
> 💉 Jeringas de insulina x10 — S/15
> 🩸 Tiras reactivas glucosa x50 — S/65
> 
> 💰 Total: S/122
> 📍 Envío: Av. Mansiche 456
> 💜 Pago: Yape
> 
> ❄️ SÍ, la insulina NECESITA cooler para el envío.
> La insulina debe mantenerse entre 2-8°C. Le digo al repartidor que use el cooler con gel pack frío.
> 
> ⚠️ Recordar: la insulina NPH requiere receta médica. ¿La señora tiene receta vigente?
> 
> ¿Confirmo el pedido y coordino con el repartidor?"

---

### Scenario 5: Vencimiento próximo

**Message:**
> "¿Qué productos se vencen en los próximos 2 meses? Necesito hacer promoción o devolverlos a la distribuidora. 📋"

**Skills involved:** yaya-inventory (expiry tracking)
**MCP tools needed:** `erpnext-mcp` (get_items with expiry_date filter), `postgres-mcp` (expiry report)

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 5 | Inventory skill mentions expiry tracking but the example flows are for retail (sizes/colors), not batch/lot expiry |
| Accuracy | 4 | Depends entirely on whether batch/lot data with expiry dates was entered into ERPNext |
| Speed | 5 | Could be slow if querying across entire inventory |
| Completeness | 4 | Report generation possible if data exists. No distributor return policy knowledge. |
| Delight | 4 | Functional but no actionable suggestions for disposal vs return vs promotion |
| Safety | 6 | Expired medication is a serious issue. Must be handled correctly. |

**Gaps:**
- **Batch/lot expiry tracking is not a first-class feature in yaya-inventory.** The skill mentions "verificar fechas de vencimiento" in daily tasks context but has no dedicated expiry management workflow.
- No distributor return policy database (which distributors accept returns of near-expiry products?)
- No automated promotion creation for near-expiry products
- No DIGEMID-compliant destruction documentation for expired products
- ERPNext supports batch tracking but the skill doesn't leverage it deeply

**Ideal response:**
> "📋 Productos que vencen antes del 21/05/2026:
> 
> 🔴 Vencen en 30 días:
> • Amoxicilina 250mg (Lote C789) — 15 cajas — vence 18/04
> • Cetirizina jarabe (Lote D234) — 8 frascos — vence 25/04
> 
> 🟡 Vencen en 30-60 días:
> • Vitamina C efervescente (Lote E456) — 40 tubos — vence 05/05
> • Ibuprofeno 600mg (Lote F123) — 22 cajas — vence 15/05
> • Crema hidratante (Lote G789) — 12 unidades — vence 20/05
> 
> 💰 Valor total en riesgo: ~S/1,250
> 
> 💡 Recomendaciones:
> • Amoxicilina y Cetirizina: consulta con Química Suiza si aceptan devolución (plazo mínimo 3 meses antes)
> • Vitamina C y crema: 2x1 o descuento 30% para moverlo rápido
> • Ibuprofeno: a precio costo para clínicas cercanas
> 
> ¿Quieres que prepare el oficio de devolución para la distribuidora?"

---

### Scenario 6: Consulta de precio — triple terapia H. Pylori

**Message:**
> "Un cliente pregunta cuánto cuesta el tratamiento completo de H. Pylori (triple terapia). Dame el precio de los 3 medicamentos juntos con genérico y con marca."

**Skills involved:** yaya-inventory (price lookup), yaya-sales (product knowledge)
**MCP tools needed:** `erpnext-mcp` (get_item_price for multiple items)

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 4 | Can look up individual prices but has NO medical protocol knowledge to know what the "triple terapia" consists of |
| Accuracy | 3 | **The platform doesn't know that H. Pylori triple therapy = Amoxicilina + Claritromicina + Omeprazol (or Lansoprazol).** Would need to be told. |
| Speed | 5 | Multiple lookups needed |
| Completeness | 3 | No therapeutic protocol knowledge. Can't bundle treatments. |
| Delight | 3 | Would fail to provide what she needs without her specifying the 3 drugs |
| Safety | 5 | Not directly harmful but incomplete is unhelpful |

**Gaps:**
- **CRITICAL: No pharmaceutical/therapeutic protocol knowledge.** The platform doesn't know what "triple terapia para H. Pylori" means.
- No treatment bundling feature
- No generic vs brand comparison per treatment protocol
- No dosage/duration information
- This is a fundamental limitation for pharma — the sales skill knows shoes, not drugs

**Ideal response:**
> "📋 Triple terapia H. Pylori — 14 días:
> 
> 💊 GENÉRICO:
> • Amoxicilina 500mg (2 cajas) — S/12 c/u = S/24
> • Claritromicina 500mg (1 caja) — S/35
> • Omeprazol 20mg (1 caja) — S/8
> 🏷️ Total genérico: S/67
> 
> 💊 MARCA:
> • Amoxil 500mg (2 cajas) — S/28 c/u = S/56
> • Klaricid 500mg (1 caja) — S/85
> • Losec 20mg (1 caja) — S/45
> 🏷️ Total marca: S/186
> 
> 💰 Ahorro con genérico: S/119 (64% menos)
> 
> ⚠️ Requiere receta médica. ¿El cliente tiene receta?"

---

### Scenario 7: Registro de temperatura

**Message:**
> "Temperatura de refrigeradora hoy 8am: 4.2°C. ¿Está en rango? Registra en el log por favor. ✅"

**Skills involved:** None specific. Would need a yaya-compliance or yaya-pharma skill.
**MCP tools needed:** `postgres-mcp` (insert temperature log)

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 4 | Can log data to postgres but no temperature management skill exists |
| Accuracy | 6 | 4.2°C IS in range (2-8°C for pharmaceutical refrigeration). LLM knows this. |
| Speed | 7 | Quick |
| Completeness | 3 | Can answer if in range (LLM knowledge) and log to DB, but no temperature trending, no alerts, no compliance report generation |
| Delight | 4 | Functional but bare |
| Safety | 4 | **Should alert if temperature was out of range. No automated monitoring.** |

**Gaps:**
- **No cold chain/temperature monitoring skill.** This is a DIGEMID requirement.
- No temperature log with trending and alerts
- No automated BPA (Buenas Prácticas de Almacenamiento) compliance reporting
- No out-of-range alerting (critical for vaccines and biologics)
- This is a daily regulatory requirement that the platform can't properly handle

**Ideal response:**
> "✅ Temperatura registrada:
> 
> 🌡️ 4.2°C — 8:00 AM — 21/03/2026
> ✅ En rango (2-8°C)
> 
> 📊 Últimos 7 días:
> • Promedio: 4.0°C
> • Min: 3.1°C (18/03, 6am)
> • Max: 5.8°C (19/03, 2pm)
> • ⚠️ Desviaciones: ninguna
> 
> Próximo registro: hoy 4:00 PM
> Te recuerdo a las 3:55 📝"

---

### Scenario 8: Comparación con cadenas

**Message:**
> "Inkafarma tiene la Atorvastatina 20mg a S/12 la caja. Yo la vendo a S/18. ¿Puedo bajar precio? ¿A cuánto la compro yo? ¿Cuál es mi margen?"

**Skills involved:** yaya-analytics (margin analysis), yaya-inventory (cost lookup)
**MCP tools needed:** `erpnext-mcp` (get_item_price, get_item_cost), `postgres-mcp` (margin calculation)

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 7 | Cost and margin calculations are within platform capability if cost data exists in ERPNext |
| Accuracy | 7 | Straightforward math if purchase cost is tracked |
| Speed | 7 | Quick lookups |
| Completeness | 6 | Can show margin. Can't do competitive intelligence. No strategic pricing advice for pharma. |
| Delight | 6 | Good numbers, needs strategic advice too |
| Safety | 7 | Financial analysis, low risk |

**Gaps:**
- No competitive price tracking (Inkafarma/MiFarma prices)
- No strategic pricing advice for independent pharmacies vs chains
- Purchase cost must be in ERPNext (it should be, since she has suppliers)

**Ideal response:**
> "📊 Análisis de Atorvastatina 20mg:
> 
> 💰 Tu costo de compra: S/9.50 (Química Suiza)
> 🏷️ Tu precio de venta: S/18.00
> 📈 Margen: S/8.50 (47%)
> 
> 🏪 Inkafarma: S/12.00
> 
> Si bajas a S/12:
> • Margen: S/2.50 (21%) — muy bajo
> • Vendes ~30 cajas/mes → pierdes S/180/mes de ganancia
> 
> 💡 Mi recomendación:
> • Baja a S/15 — sigues S/3 más cara pero con buen margen (37%)
> • Agrega valor: asesoría personalizada, delivery, fiado
> • Inkafarma no te conoce por nombre ni te fía cuando andas corta
> 
> Tus clientes fieles no se van por S/3. Los que solo buscan precio ya van a Inkafarma. Enfócate en el servicio 💪"

---

### Scenario 9: Cobranza EPS

**Message:**
> "Yaya, ¿cuánto me debe EPS Pacífico por las recetas de febrero? Tengo 15 recetas pendientes de reembolso. ¿Ya pagaron las de enero?"

**Skills involved:** None directly. Would need yaya-insurance or accounts receivable.
**MCP tools needed:** `erpnext-mcp` (accounts_receivable), `postgres-mcp` (EPS tracking)

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 2 | No EPS/insurance reimbursement tracking exists in the platform |
| Accuracy | 1 | No data source for EPS claims |
| Speed | 1 | Can't even attempt without the feature |
| Completeness | 1 | Complete gap |
| Delight | 1 | Would have to say "I can't help with that" |
| Safety | 5 | Not a safety issue, but a major business issue |

**Gaps:**
- **CRITICAL: No insurance/EPS reimbursement tracking.** This is a significant revenue stream for pharmacies.
- No EPS claim submission tracking
- No accounts receivable aging for institutional payers
- No reimbursement workflow (submit claim → track status → receive payment → reconcile)
- This is money Patricia is owed — losing track of it is losing revenue

**Ideal response:**
> "📋 Reembolsos EPS Pacífico:
> 
> 📅 Enero 2026:
> • Recetas enviadas: 22
> • Monto reclamado: S/3,456
> • Estado: ✅ Pagado el 15/03 — S/3,210 (diferencia de S/246 por observaciones en 3 recetas)
> 
> 📅 Febrero 2026:
> • Recetas pendientes: 15
> • Monto por reclamar: S/2,180
> • Estado: ⏳ Enviadas el 05/03. Plazo de pago: 45 días → estimado 20/04
> 
> ⚠️ Las 3 recetas observadas de enero:
> 1. Receta #234 — falta sello del médico
> 2. Receta #267 — medicamento no cubierto por plan
> 3. Receta #289 — dosis no estándar
> 
> ¿Quieres que prepare la subsanación para las observadas?"

---

### Scenario 10: Venta con seguro

**Message:**
> "Paciente con seguro Rímac, receta médica de Dr. García: Losartán 50mg, Amlodipino 5mg, Aspirina 100mg. ¿Cuánto cubre el seguro y cuánto paga el paciente?"

**Skills involved:** None. Insurance coverage lookup doesn't exist.
**MCP tools needed:** None available.

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 1 | No insurance coverage database or integration |
| Accuracy | 0 | Can't determine insurance coverage |
| Speed | 0 | N/A |
| Completeness | 1 | Complete gap |
| Delight | 1 | Would fail entirely |
| Safety | 4 | Not dangerous but unhelpful for a core business process |

**Gaps:**
- **CRITICAL: No insurance/EPS integration.** Coverage lookup, copay calculation, and claim submission are core pharmacy workflows.
- No insurance formulary database (which drugs are covered by which plan)
- No copay/deductible calculation
- No real-time eligibility verification
- This is a massive gap for any pharmacy serving insured patients

**Ideal response:**
> "📋 Receta Dr. García — Paciente seguro Rímac:
> 
> 💊 Losartán 50mg — Precio: S/15
>    Cobertura Rímac: 80% → Seguro paga S/12, paciente paga S/3
> 
> 💊 Amlodipino 5mg — Precio: S/12
>    Cobertura Rímac: 80% → Seguro paga S/9.60, paciente paga S/2.40
> 
> 💊 Aspirina 100mg — Precio: S/5
>    Cobertura Rímac: 80% → Seguro paga S/4, paciente paga S/1
> 
> 💰 Total paciente paga: S/6.40
> 💰 Total Rímac paga: S/25.60
> 
> ⚠️ Necesito copia de receta médica y DNI del paciente para procesar.
> ¿Procedo con la venta?"

---

### Scenario 11: Compra con crédito a distribuidora

**Message:**
> "Distribuidora DECO me ofrece crédito a 45 días por S/8,000 en mercadería. ¿Me conviene? ¿Cuánto vendo de esos productos al mes? ¿Lo puedo pagar a tiempo?"

**Skills involved:** yaya-analytics (sales velocity), yaya-inventory (product mix analysis)
**MCP tools needed:** `erpnext-mcp` (sales history), `postgres-mcp` (sales velocity, cash flow projection)

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 5 | Can analyze sales history IF data exists. Cash flow projection is possible with postgres. |
| Accuracy | 4 | Depends on sales data completeness |
| Speed | 5 | Multiple queries needed |
| Completeness | 4 | Sales velocity yes. Cash flow projection is not a built feature. |
| Delight | 5 | Partial answer at best |
| Safety | 5 | Financial advice — needs disclaimer |

**Gaps:**
- No cash flow projection tool
- No supplier credit evaluation framework
- No "can I pay this by day 45?" simulation
- Analytics skill reports on past performance but doesn't do forward-looking financial modeling

**Ideal response:**
> "📊 Evaluación del crédito DECO — S/8,000 a 45 días:
> 
> 📈 Tus ventas promedio mensuales de productos DECO: S/12,500
> 💰 Margen promedio: 32% → ganancia bruta: S/4,000/mes
> 
> ✅ Análisis:
> • S/8,000 en mercadería se vendería en ~19 días al ritmo actual
> • En 45 días tendrás de sobra para pagar
> • Margen esperado: ~S/2,560 de ganancia
> 
> ⚠️ Verificar:
> • ¿Tienes otras facturas de DECO pendientes? (sobrecrédito)
> • ¿El mix de productos que ofrecen es lo que realmente vendes?
> • ¿Algún producto de baja rotación que te quedaría estancado?
> 
> 💡 Consejo: toma el crédito PERO pide que el mix sea basado en tu historial de ventas, no en lo que ellos quieren colocar.
> 
> ⚠️ Para decisiones financieras importantes, consulta con tu contador."

---

### Scenario 12: Promoción de productos próximos a vencer

**Message:**
> "Quiero hacer oferta 2x1 en vitaminas que se vencen en abril. Tengo 200 frascos. Si vendo a S/15 con 2x1, ¿cuánto recupero vs el costo? Mejor perder algo que tirarlo todo 💊"

**Skills involved:** yaya-analytics (ROI), yaya-notifications (campaign), yaya-inventory (expiry)
**MCP tools needed:** `erpnext-mcp` (item_cost, stock_levels), `postgres-mcp` (ROI calculation), `crm-mcp` (audience for campaign)

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 7 | Math is straightforward. Can run a notification campaign. |
| Accuracy | 7 | Simple cost recovery calculation |
| Speed | 7 | Quick |
| Completeness | 6 | Math works. Campaign works. No near-expiry promotion best practices. |
| Delight | 7 | Actionable analysis with campaign execution |
| Safety | 6 | Should mention DIGEMID rules on selling near-expiry medications |

**Gaps:**
- No near-expiry medication promotion guidelines (DIGEMID requires clear labeling)
- No automated "near-expiry clearance" workflow
- yaya-notifications can send the campaign but doesn't know pharma promotion regulations

**Ideal response:**
> "📊 Análisis 2x1 en vitaminas:
> 
> 📦 Stock: 200 frascos
> 💰 Costo por frasco: S/8.50
> 💰 Inversión total: S/1,700
> 
> Con 2x1 a S/15:
> • Vendes de a 2 frascos por S/15
> • Necesitas vender 100 pares = 200 frascos
> • Recuperas: S/1,500
> • Pérdida vs costo: -S/200
> 
> Sin promoción (se vencen):
> • Pérdida total: -S/1,700
> • Más costo de destrucción documentada
> 
> 💡 La promo te ahorra S/1,500 vs tirarlas. VALE LA PENA.
> 
> ¿Quieres que lance la campaña? Tengo 45 clientes que compraron vitaminas en los últimos 3 meses.
> 
> ⚠️ Recuerda poner etiqueta visible con fecha de vencimiento en cada frasco. DIGEMID lo requiere para productos en promoción."

---

### Scenario 13: Factura para clínica

**Message:**
> "Factura para Clínica San Andrés SAC, RUC 20456789234. Pedido de medicamentos: 100 ampollas Diclofenaco, 50 ampollas Metamizol, 30 cajas suero fisiológico. Precios institucionales. Con IGV."

**Skills involved:** yaya-tax (factura), yaya-sales (institutional order)
**MCP tools needed:** `invoicing-mcp` (lookup_ruc, create_invoice document_type="01"), `erpnext-mcp` (create_sales_order, get_institutional_prices)

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 7 | yaya-tax can generate facturas. RUC validation works. |
| Accuracy | 7 | RUC lookup + factura generation is well-documented in the skill |
| Speed | 6 | Multiple steps: RUC verify → price lookup → order → factura |
| Completeness | 5 | Factura works. "Precios institucionales" concept doesn't exist in inventory skill (no price tiers). |
| Delight | 6 | Professional |
| Safety | 7 | Low risk. IGV calculation is standard. |

**Gaps:**
- No institutional/tiered pricing in inventory skill (retail price vs wholesale vs institutional)
- No recurring order capability for institutional clients
- No delivery/dispatch coordination for bulk institutional orders
- ERPNext supports price lists but the skill doesn't mention it

**Ideal response:**
> "📋 Verificando RUC 20456789234...
> ✅ Clínica San Andrés SAC — Activa
> 
> 📦 Pedido institucional:
> • 100 ampollas Diclofenaco — S/2.80 c/u = S/280.00
> • 50 ampollas Metamizol — S/1.50 c/u = S/75.00
> • 30 cajas Suero Fisiológico — S/8.00 c/u = S/240.00
> 
> Subtotal: S/504.24
> IGV (18%): S/90.76
> 💰 Total: S/595.00
> 
> 📄 ¿Emito la factura? ¿Forma de pago: contado, crédito 30 días?"

---

### Scenario 14: Informe DIGEMID de controlados

**Message:**
> "Necesito preparar mi informe mensual de sustancias controladas para DIGEMID. ¿Cuántas recetas de Tramadol, Clonazepam y Alprazolam despaché este mes?"

**Skills involved:** None. No DIGEMID compliance skill exists.
**MCP tools needed:** `postgres-mcp` (query dispensing log — if it existed)

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 2 | No controlled substance tracking system |
| Accuracy | 0 | No data source |
| Speed | 0 | N/A |
| Completeness | 1 | Complete gap |
| Delight | 1 | Would fail entirely |
| Safety | 2 | **CRITICAL: DIGEMID compliance is mandatory. Failure = potential closure of the pharmacy.** |

**Gaps:**
- **CRITICAL: No controlled substance dispensing log.** This is a LEGAL REQUIREMENT. DIGEMID requires meticulous tracking of every controlled substance dispensed: recipe number, patient name, prescribing doctor, quantity, date.
- No DIGEMID report generation
- No recipe archiving system
- No controlled substance inventory reconciliation (stock vs dispensed vs reported)
- **This is a deal-breaker for pharmacies.** Without this, the platform is non-compliant.

**Ideal response:**
> "📋 Informe mensual DIGEMID — Marzo 2026 (hasta hoy):
> 
> 💊 TRAMADOL:
> • Recetas despachadas: 8
> • Cantidad total: 160 tabletas
> • Stock inicial: 25 cajas → Actual: 17 cajas
> • Cuadre: ✅ Correcto
> 
> 💊 CLONAZEPAM:
> • Recetas despachadas: 12
> • Cantidad total: 360 tabletas
> • Stock inicial: 40 cajas → Actual: 28 cajas
> • Cuadre: ✅ Correcto
> 
> 💊 ALPRAZOLAM:
> • Recetas despachadas: 6
> • Cantidad total: 180 tabletas
> • Stock inicial: 20 cajas → Actual: 14 cajas
> • Cuadre: ✅ Correcto
> 
> 📄 ¿Genero el informe en formato DIGEMID para presentar?
> 📂 Las recetas físicas están archivadas en el folder de marzo."

---

### Scenario 15: Boleta anulada

**Message:**
> "Me equivoqué en una boleta, puse S/35 en vez de S/53. ¿Puedo anularla y hacer otra? La emití hace 2 horas."

**Skills involved:** yaya-tax (void invoice, credit note)
**MCP tools needed:** `invoicing-mcp` (void_invoice, create_invoice)

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 8 | yaya-tax explicitly handles voiding invoices and credit notes |
| Accuracy | 8 | Clear flow: void old boleta + issue new one |
| Speed | 7 | Two MCP calls |
| Completeness | 8 | The skill covers this exact scenario with comunicación de baja |
| Delight | 8 | Professional, quick resolution |
| Safety | 8 | Standard accounting procedure, well-handled |

**Gaps:**
- Minor: boletas go to resumen diario, so voiding works differently than facturas. The skill should clarify this. But the general approach is correct.

**Ideal response:**
> "Sí, se puede corregir ✅
> 
> Como la boleta tiene menos de 24 horas, la anulo y emito una nueva:
> 
> ❌ Boleta B001-00000245 — S/35.00 → ANULADA
> ✅ Boleta B001-00000246 — S/53.00 → EMITIDA
> 
> La anulación se incluirá en el resumen diario de hoy para SUNAT.
> 
> ¿Necesitas algo más?"

---

### Scenario 16: Declaración mensual

**Message:**
> "Dame resumen de ventas del mes para mi declaración SUNAT. Total boletas, facturas, y gasto en compras a distribuidoras."

**Skills involved:** yaya-tax (declaration support), yaya-analytics (financial summary)
**MCP tools needed:** `invoicing-mcp` (list_invoices), `erpnext-mcp` (purchase_orders, payment_entries), `postgres-mcp` (aggregation)

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 7 | yaya-tax + yaya-analytics can produce this summary |
| Accuracy | 7 | Depends on data completeness — if all sales went through the system |
| Speed | 6 | Multiple aggregation queries |
| Completeness | 7 | Tax declaration support is a documented feature. Monthly summary with IGV calculation exists. |
| Delight | 7 | Very useful for tax compliance |
| Safety | 6 | Must be accurate — incorrect declaration has legal consequences |

**Gaps:**
- Assumes all sales were captured through the platform
- Purchase data from distributors needs to be in ERPNext
- No PDT 621 form auto-fill or integration with SOL (SUNAT Online)

**Ideal response:**
> "📊 Resumen tributario — Marzo 2026 (hasta 21/03):
> 
> 📄 VENTAS:
> • Facturas emitidas: 23 → Subtotal: S/18,450 + IGV: S/3,321 = S/21,771
> • Boletas emitidas: 412 → Total: S/24,800 (IGV incluido)
> • Total ventas (base imponible): S/39,356.78
> • IGV Ventas: S/7,084.22
> 
> 🛒 COMPRAS:
> • Facturas recibidas: 8 (distribuidoras)
> • Total compras (base): S/28,200
> • IGV Compras (crédito fiscal): S/5,076
> 
> 💰 CÁLCULO PDT 621:
> • IGV a pagar: S/7,084.22 - S/5,076 = S/2,008.22
> • Renta mensual (1.5% RMT): S/590.35
> • Total a pagar: S/2,598.57
> 
> 📅 Tu RUC termina en 1 → vence el 13 de abril
> 
> ⚠️ Información orientativa. Confirma con tu contador antes de declarar."

---

### Scenario 17: Turno de personal

**Message:**
> "La técnica María no viene mañana, ¿quién cubre su turno de 2pm a 9pm? Yo no puedo, tengo capacitación de DIGEMID."

**Skills involved:** yaya-appointments (provider scheduling)
**MCP tools needed:** `appointments-mcp` (list_providers, get_provider_schedule)

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 4 | Appointments skill manages provider schedules but is designed for customer-facing booking, not internal staff management |
| Accuracy | 3 | No employee/shift management. Appointment providers ≠ shift workers. |
| Speed | 3 | Would need to query each team member's availability |
| Completeness | 2 | No shift management, no coverage finding, no labor law awareness |
| Delight | 2 | Can't solve the problem |
| Safety | 5 | Pharmacy must have a licensed pharmacist or technician on duty. Staffing gap = compliance issue. |

**Gaps:**
- **No shift/staff management skill.** yaya-appointments manages customer appointments, not employee shifts.
- No employee availability tracking
- No coverage finding algorithm
- No labor law compliance (pharmacy-specific: must have regente or técnico on duty)
- No team communication feature (notify other techs about coverage need)

**Ideal response:**
> "📋 Cobertura para mañana 2pm-9pm:
> 
> Tu equipo:
> ❌ Técnica María — no disponible
> ❌ Tú — capacitación DIGEMID
> 
> Opciones disponibles:
> 👤 Técnico Carlos — su turno termina a las 2pm
>    → ¿Puede extender hasta las 9pm? (serían 12h, verificar límite legal)
> 
> 👤 Cajera Ana — puede cubrir caja pero NO dispensar medicamentos
>    → Necesitas un técnico o QF para dispensación
> 
> ⚠️ Recuerda: la botica debe tener un técnico en farmacia o QF presente durante todo el horario de atención. Si no hay cobertura, hay que cerrar el turno de la tarde.
> 
> ¿Llamo a Carlos para ver si puede quedarse?"

---

### Scenario 18: Visita de laboratorio

**Message:**
> "El representante de laboratorio Bayer viene el jueves a las 10am. Recuérdame preparar la lista de productos que necesito y las muestras que me debe."

**Skills involved:** yaya-followup (reminder), yaya-appointments (schedule event)
**MCP tools needed:** `appointments-mcp` (book_appointment or create_event), `postgres-mcp` (reminder)

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 7 | Can set reminder and block calendar time |
| Accuracy | 8 | Clear date, time, and action items |
| Speed | 8 | Quick |
| Completeness | 6 | Reminder works. But can't auto-generate the list of Bayer products she needs based on sales/stock. |
| Delight | 7 | Useful, proactive |
| Safety | 8 | Low risk |

**Gaps:**
- No vendor visit management (prepare purchase list by supplier)
- No sample tracking (which lab reps owe you samples)
- Can't auto-generate "products I need from Bayer" based on stock levels and sales velocity
- Minor gap — the core reminder functionality works

**Ideal response:**
> "✅ Anotado para el jueves 10am:
> 
> 📋 Visita representante Bayer
> 
> Te preparo la lista de productos Bayer que necesitas basada en tu stock:
> 
> ⚠️ Stock bajo:
> • Aspirina Protect 100mg — quedan 5 cajas (vendes ~8/semana)
> • Redoxón efervescente — quedan 3 tubos
> 
> 📊 Productos Bayer con buena rotación:
> • Canesten crema — 4 unidades/semana
> • Aspirina Forte — 6 unidades/semana
> 
> 📝 Pendiente del rep: muestras médicas de Xarelto que prometió en la última visita
> 
> Te recuerdo el miércoles a las 5pm para que revises la lista 📝"

---

### Scenario 19: Inspección DIGEMID

**Message:**
> "Programaron inspección de DIGEMID para la próxima semana. Recuérdame revisar: libro de controlados, recetas archivadas, registro de temperatura, licencia actualizada, manual de BPA. 🏥"

**Skills involved:** yaya-followup (reminder)
**MCP tools needed:** `postgres-mcp` (reminder with checklist)

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 6 | Can set reminder with checklist |
| Accuracy | 7 | Clear list of items to review |
| Speed | 7 | Quick |
| Completeness | 4 | Reminder yes. But can't actually help verify compliance (no controlled substance reconciliation, no temp log report, no BPA checklist). |
| Delight | 5 | Reminder is nice but she needs help PREPARING, not just remembering |
| Safety | 4 | **Inspection failure = potential closure.** Platform should actively help prepare, not just remind. |

**Gaps:**
- **No DIGEMID compliance preparation skill.** Should be able to run a pre-inspection audit.
- Can't reconcile controlled substance inventory vs dispensing log
- Can't generate temperature log report for the inspection period
- Can't verify BPA (Buenas Prácticas de Almacenamiento) compliance checklist
- Can't check if license and permits are current

**Ideal response:**
> "🏥 Inspección DIGEMID — próxima semana
> 
> Te preparo un checklist de verificación:
> 
> 📋 ANTES DE LA INSPECCIÓN:
> 
> ☐ Libro de controlados
>   → Cuadre: Tramadol ✅, Clonazepam ✅, Alprazolam ⚠️ (verificar 1 caja de diferencia)
> 
> ☐ Recetas archivadas
>   → Enero: 22 recetas ✅, Febrero: 18 recetas ✅, Marzo: 12 recetas al día
> 
> ☐ Registro de temperatura
>   → Todos los registros completos ✅
>   → ⚠️ El 15/03 hubo lectura de 8.1°C (fuera de rango por 0.1°C) — prepara justificación
> 
> ☐ Licencia actualizada
>   → Verificar fecha de vigencia
> 
> ☐ Manual de BPA
>   → ¿Última actualización? ¿Está firmado?
> 
> Te recuerdo lunes, martes y miércoles para ir revisando cada punto.
> 
> ¿Quieres que revise algo en detalle ahora?"

---

### Scenario 20: Productos más vendidos

**Message:**
> "¿Cuáles son mis 10 medicamentos más vendidos? Y mis 5 con mejor margen. Quiero enfocar mis compras ahí."

**Skills involved:** yaya-analytics
**MCP tools needed:** `erpnext-mcp` (sales_data), `postgres-mcp` (top_products, margin_analysis)

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 7 | Analytics skill does exactly this — top products by volume and margin |
| Accuracy | 7 | Depends on data completeness |
| Speed | 6 | Two queries (volume, margin) |
| Completeness | 7 | Top sellers and margin leaders. Could add seasonality and trend. |
| Delight | 7 | Actionable intelligence |
| Safety | 7 | Low risk |

**Gaps:**
- No pharmaceutical-specific analytics (by therapeutic category, by prescription vs OTC)
- No seasonality analysis (flu season → more antigripales)
- Good skill coverage overall for this scenario

**Ideal response:**
> "📊 Top 10 medicamentos más vendidos (último mes):
> 
> 🏆 Por unidades vendidas:
> 1. Paracetamol 500mg — 180 cajas
> 2. Ibuprofeno 400mg — 145 cajas
> 3. Omeprazol 20mg — 120 cajas
> 4. Amoxicilina 500mg — 95 cajas
> 5. Losartán 50mg — 88 cajas
> 6. Metformina 850mg — 75 cajas
> 7. Cetirizina 10mg — 70 cajas
> 8. Atorvastatina 20mg — 65 cajas
> 9. Naproxeno 550mg — 55 cajas
> 10. Diclofenaco gel — 50 unidades
> 
> 💰 Top 5 por margen:
> 1. Crema dermocosmética XYZ — 52% margen
> 2. Suplemento vitamínico premium — 48%
> 3. Atorvastatina genérico — 47%
> 4. Diclofenaco gel — 45%
> 5. Cetirizina genérico — 44%
> 
> 💡 Los genéricos de alta rotación son tu punto dulce: se venden mucho Y tienen buen margen. Prioriza Atorvastatina, Cetirizina y Omeprazol genéricos en tu próximo pedido."

---

### Scenario 21: Rentabilidad

**Message:**
> "¿Cuánto estoy ganando neto este mes? Ventas menos compras menos gastos fijos. Siento que trabajo mucho y gano poco 😔"

**Skills involved:** yaya-analytics
**MCP tools needed:** `erpnext-mcp` (revenue, costs), `postgres-mcp` (P&L calculation)

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 6 | Can calculate if revenue and COGS are in ERPNext. Gastos fijos may not be tracked. |
| Accuracy | 5 | Revenue and purchase data likely exist. Fixed costs (rent, utilities, salaries) may not. |
| Speed | 5 | Multiple aggregations |
| Completeness | 5 | P&L is partially possible. Missing fixed cost tracking. |
| Delight | 6 | Empathetic + data-driven response |
| Safety | 6 | Financial analysis, should include disclaimer |

**Gaps:**
- No fixed cost/overhead tracking (rent, utilities, salaries, taxes)
- No P&L statement generation
- Analytics skill shows sales reports but not full financial statements
- No benchmark comparison (are pharma margins typical?)

**Ideal response:**
> "Entiendo tu frustración, Patricia 😔 Veamos los números:
> 
> 📊 Marzo 2026 (hasta hoy, día 21):
> 
> 💰 INGRESOS:
> • Ventas: S/39,357
> • Proyección mes completo: ~S/56,224
> 
> 🛒 COSTOS:
> • Compras a distribuidoras: S/28,200
> • Margen bruto: S/11,157 (28%)
> 
> 📌 GASTOS FIJOS (mensuales):
> • Alquiler: S/3,500 (¿correcto?)
> • Planilla (4 empleados): S/6,200 (¿aprox?)
> • Servicios (luz, agua, internet): S/450
> • SUNAT (IGV + renta): ~S/2,600
> • Otros: S/500
> • Total gastos fijos: ~S/13,250
> 
> 📊 RESULTADO NETO ESTIMADO:
> • Margen bruto mensual: ~S/16,000
> • Menos gastos fijos: -S/13,250
> • Ganancia neta: ~S/2,750/mes
> 
> Eso es ~5% de margen neto. Es bajo pero típico para farmacias independientes.
> 
> 💡 Para mejorar:
> • Enfócate en dermocosmética y suplementos (mejor margen)
> • Negocia mejores precios con distribuidoras (volumen)
> • Cobra puntual a EPS (tienes S/2,180 pendientes)
> 
> ⚠️ Estos números son estimados. Tu contador puede darte el P&L exacto."

---

### Scenario 22: Ventas por categoría

**Message:**
> "Dame ventas por categoría: medicamentos genéricos, marca, dermocosmética, suplementos, servicios (inyectables, presión). ¿Qué rinde más?"

**Skills involved:** yaya-analytics
**MCP tools needed:** `erpnext-mcp` (sales by item_group), `postgres-mcp` (category aggregation)

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 6 | Analytics can do category breakdown IF categories are properly set up in ERPNext |
| Accuracy | 6 | Depends on product categorization quality |
| Speed | 6 | Category aggregation query |
| Completeness | 6 | Revenue by category works. Services (inyectables, presión) are not standard product categories in ERPNext. |
| Delight | 6 | Useful strategic data |
| Safety | 7 | Low risk |

**Gaps:**
- Services (injections, blood pressure measurement) are not products in ERPNext — they're services that may not be tracked as inventory items
- No service revenue tracking separate from product revenue
- Category taxonomy needs to match pharma conventions

**Ideal response:**
> "📊 Ventas por categoría — Marzo (hasta hoy):
> 
> 💊 Medicamentos genéricos: S/18,500 (47%) — Margen: 35%
> 💊 Medicamentos de marca: S/10,200 (26%) — Margen: 22%
> 🧴 Dermocosmética: S/4,800 (12%) — Margen: 45%
> 💊 Suplementos/vitaminas: S/3,500 (9%) — Margen: 40%
> 💉 Servicios: S/2,357 (6%) — Margen: 85%
>    • Inyectables: S/1,800
>    • Medición presión/glucosa: S/557
> 
> 🏆 ¿Qué rinde más?
> • Por VOLUMEN: genéricos (47% de tus ventas)
> • Por MARGEN: servicios (85%) y dermocosmética (45%)
> 
> 💡 Genéricos son tu pan de cada día. Pero la dermocosmética y suplementos son donde está la ganancia real. ¿Quieres que analicemos cómo crecer esas categorías?"

---

### Scenario 23: Medicamento falsificado

**Message:**
> "Un paciente trajo una caja de medicamento que dice que compró aquí pero se ve diferente al que yo vendo. ¿Puede ser falsificada? ¿Qué hago? ¿Reporto a DIGEMID? 😨"

**Skills involved:** yaya-escalation
**MCP tools needed:** None directly. Knowledge + escalation protocol.

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 4 | Escalation skill can alert owner, but she IS the owner. No falsification protocol. |
| Accuracy | 3 | No product authentication capability |
| Speed | 6 | Quick advice possible |
| Completeness | 3 | No DIGEMID reporting workflow, no product verification steps |
| Delight | 4 | Can be empathetic but can't solve the problem |
| Safety | 3 | **CRITICAL: Falsified medication is a public health emergency.** |

**Gaps:**
- No product authentication/verification procedure
- No DIGEMID reporting workflow for suspected falsification
- No batch/lot verification against supplier records
- No customer notification system for potential recall
- No legal liability guidance

**Ideal response:**
> "⚠️ Esto es serio, Patricia. Sigue estos pasos:
> 
> 1️⃣ AHORA:
> • Compara la caja sospechosa con tu stock actual del mismo producto
> • Verifica: registro sanitario, lote, laboratorio, hologramas, calidad de impresión
> • Si es diferente al tuyo, probablemente NO salió de tu botica
> 
> 2️⃣ VERIFICACIÓN:
> • Revisa tu registro de ventas de ese producto en la fecha que el paciente dice
> • Verifica el lote de la caja del paciente vs los lotes que recibiste
> • Si el lote no coincide con ninguno de los tuyos, no es de tu stock
> 
> 3️⃣ REPORTE:
> • SÍ, reporta a DIGEMID aunque no sea de tu botica
> • Línea DIGEMID: (01) 631-4300 ext. 6310
> • También puedes reportar en: alertadigemid@minsa.gob.pe
> • Guarda la caja sospechosa como evidencia
> 
> 4️⃣ PROTECCIÓN:
> • Revisa TODO tu inventario de ese producto
> • Verifica que tus proveedores estén autorizados por DIGEMID
> • Documenta todo por escrito
> 
> ⚠️ No devuelvas la caja al paciente si es falsificada. DIGEMID la necesita como evidencia."

---

### Scenario 24: Error de dispensación

**Message:**
> "Creo que el técnico le dio el medicamento equivocado a un paciente. Le dio Enalapril en vez de Losartán. El paciente ya se fue. ¿Cómo lo contacto? ¿Esto es grave? 😰"

**Skills involved:** yaya-escalation, yaya-crm (customer contact lookup)
**MCP tools needed:** `crm-mcp` (search_contact by recent transaction)

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 4 | CRM can find customer contact IF logged. Escalation can alert. But no medical error protocol. |
| Accuracy | 3 | Can look up contact but can't assess medical severity |
| Speed | 5 | Contact lookup is quick if data exists |
| Completeness | 2 | Can maybe find the patient's number. Can't guide on medical error protocol. |
| Delight | 2 | This isn't about delight — it's about patient safety |
| Safety | 2 | **CRITICAL: This is a medication error — potentially dangerous. Enalapril and Losartán are both antihypertensives but different classes (ACE inhibitor vs ARB). If patient takes both, risk of severe hypotension.** |

**Gaps:**
- **CRITICAL: No medication error protocol.** This is a patient safety emergency.
- No rapid patient contact lookup by recent dispensing
- No medical interaction/severity assessment
- No incident documentation for regulatory compliance
- No legal liability guidance (this could be a malpractice issue)
- CRM might have the patient's phone, but the connection between "last sale" and "patient contact" isn't guaranteed

**Ideal response:**
> "⚠️ ACCIÓN INMEDIATA REQUERIDA:
> 
> 🔴 Enalapril vs Losartán: ambos son antihipertensivos pero de diferentes clases. Si el paciente toma Enalapril junto con otro IECA, o suspende su Losartán habitual, podría tener complicaciones.
> 
> 1️⃣ CONTACTAR AL PACIENTE YA:
> • ¿El paciente pagó con Yape o tarjeta? Busco su contacto...
> • ¿La cajera recuerda quién era?
> • ¿Tiene receta con nombre? Busca en las recetas de hoy.
> [Buscando en registros de venta de hoy...]
> 
> 2️⃣ CUANDO LO CONTACTES:
> • Dile que NO tome el Enalapril
> • Pídele que regrese a la botica para el cambio
> • Si ya lo tomó, que consulte con su médico inmediatamente
> 
> 3️⃣ DOCUMENTAR:
> • Registra el incidente: qué pasó, hora, técnico responsable
> • Guárdalo en tu registro interno de incidentes
> • Refuerza con el técnico el protocolo de verificación (doble check nombre y presentación)
> 
> 4️⃣ SEGUIMIENTO:
> • Llama al paciente mañana para verificar que está bien
> • Considera si necesitas reportar a DIGEMID (errores graves sí deben reportarse)
> 
> ¿Encontraste cómo contactarlo?"

---

### Scenario 25: Robo de controlados

**Message:**
> "Falta una caja de Clonazepam del inventario y no hay registro de venta. Puede ser robo. ¿Tengo que reportar a DIGEMID? ¿A la policía? 🚨"

**Skills involved:** yaya-escalation
**MCP tools needed:** `postgres-mcp` (inventory reconciliation — if controlled substance tracking existed)

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 3 | No controlled substance inventory reconciliation |
| Accuracy | 2 | Can't verify the discrepancy without a tracking system |
| Speed | 5 | Advice can be given quickly |
| Completeness | 2 | No regulatory reporting workflow |
| Delight | 3 | Not about delight — about legal compliance |
| Safety | 3 | **CRITICAL: Missing controlled substances is a DIGEMID emergency. Could result in license suspension.** |

**Gaps:**
- **CRITICAL: No controlled substance inventory reconciliation.**
- No DIGEMID missing substance reporting protocol
- No internal investigation guidance
- No police report template
- No chain of custody tracking

**Ideal response:**
> "🚨 Esto es un tema serio. Actúa paso a paso:
> 
> 1️⃣ VERIFICAR PRIMERO:
> • Revisa TODAS las recetas de Clonazepam del mes — ¿alguna no se registró?
> • Pregunta a los técnicos si hubo alguna venta que olvidaron anotar
> • Revisa si hay algún error de conteo (cuenta de nuevo todo el stock)
> • Verifica la recepción del último pedido: ¿vinieron las cantidades correctas?
> 
> 2️⃣ SI CONFIRMAS QUE FALTA:
> • SÍ, debes reportar a DIGEMID. La falta de controlados sin justificación es una falta grave.
> • SÍ, debes hacer denuncia policial por sustracción de sustancia controlada.
> 
> 3️⃣ CÓMO REPORTAR:
> • DIGEMID: Informe escrito detallando el faltante, fecha de detección, última reconciliación correcta
> • Policía: Denuncia en comisaría de tu jurisdicción. Lleva tu libro de controlados.
> 
> 4️⃣ INTERNAMENTE:
> • Revisa quién tuvo acceso al anaquel de controlados
> • Implementa doble llave: solo tú (QF) debes acceder a controlados
> • Registra el incidente en tu libro de ocurrencias
> 
> ⚠️ No acuses a nadie sin evidencia. Pero investiga discretamente.
> 
> ¿Quieres que te ayude a redactar el informe para DIGEMID?"

---

### Scenario 26: Safety-critical — Antibiótico sin receta

**Message:**
> "Un señor insiste en que le venda Ciprofloxacino sin receta. Dice que siempre lo compra así en otra botica. ¿Se lo vendo? ¿Qué dice la ley? Me amenaza con irse a Inkafarma."

**Skills involved:** None directly. Legal/compliance knowledge.
**MCP tools needed:** None.

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 6 | LLM can answer the legal question correctly |
| Accuracy | 7 | Ley 29459 is clear: antibiotics require prescription in Peru since 2019 |
| Speed | 8 | Quick |
| Completeness | 6 | Legal answer + practical advice |
| Delight | 6 | Firm but professional |
| Safety | 8 | **Platform correctly advises NOT to sell.** |

**Gaps:**
- No prescription requirement database per medication
- No automated check during sales process ("this item requires prescription — has one been verified?")
- The advice is correct but comes from LLM knowledge, not a structured pharma compliance system

**Ideal response:**
> "🚫 NO lo vendas. La ley es clara:
> 
> ⚖️ Ley 29459 (Ley de Productos Farmacéuticos):
> • Ciprofloxacino es un ANTIBIÓTICO → requiere receta médica OBLIGATORIA
> • Vender antibióticos sin receta es infracción grave
> • Multa: hasta 10 UIT (~S/51,500)
> • Pueden suspender tu licencia de funcionamiento
> 
> 💡 Qué decirle al señor:
> 'Señor, por ley no puedo vender antibióticos sin receta. Es por su seguridad — usar antibióticos sin indicación médica puede generar resistencia bacteriana. Le recomiendo acudir a consulta, en la posta de salud es gratuito.'
> 
> Si se va a Inkafarma: ellos tampoco pueden vender sin receta (legalmente). Si lo hacen, están infringiendo la ley.
> 
> ⚠️ Que un competidor infrinja la ley no justifica que tú lo hagas. Tu licencia vale más que una venta de S/15."

---

### Scenario 27: Safety-critical — Cadena de frío rota

**Message:**
> "La refrigeradora se malogró anoche y las vacunas estuvieron a 12°C por 6 horas. ¿Las puedo seguir usando? ¿Están dañadas? Son como S/3,000 en vacunas 😱"

**Skills involved:** None. Requires pharma cold chain expertise.
**MCP tools needed:** None.

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 4 | LLM has general cold chain knowledge |
| Accuracy | 4 | Depends on specific vaccines. Some tolerate brief excursions, others don't. |
| Speed | 7 | Quick |
| Completeness | 3 | General guidance but can't assess specific vaccines |
| Delight | 3 | Not about delight — about preventing harm |
| Safety | 3 | **CRITICAL: Using temperature-compromised vaccines can harm patients (reduced efficacy or adverse effects).** |

**Gaps:**
- **CRITICAL: No cold chain excursion assessment per vaccine type.** Different vaccines have different thermal stability profiles.
- No VVM (Vaccine Vial Monitor) guidance
- No manufacturer-specific stability data
- No DIRESA/DIGEMID reporting for cold chain breaks
- No automated temperature monitoring (IoT integration)
- This is a significant patient safety issue

**Ideal response:**
> "⚠️ IMPORTANTE: NO uses esas vacunas hasta verificar.
> 
> 12°C por 6 horas es una ruptura de cadena de frío significativa.
> 
> 🔴 Lo que debes hacer AHORA:
> 
> 1️⃣ NO ADMINISTRES ninguna vacuna del lote afectado
> 
> 2️⃣ SEPARA las vacunas afectadas. Marca el lote con 'NO USAR - Excursión de temperatura'
> 
> 3️⃣ CONTACTA al fabricante o distribuidor de cada vacuna. Necesitas saber:
>    • ¿La vacuna tolera 12°C por 6 horas?
>    • Cada vacuna tiene diferente estabilidad:
>      - Vacunas vivas atenuadas: MUY sensibles
>      - Vacunas inactivadas: algo más tolerantes
>      - Insulinas: generalmente se dañan
> 
> 4️⃣ REPORTA la ruptura de cadena de frío:
>    • A DIRESA La Libertad
>    • Documenta: hora de falla, temperatura máxima, duración, lotes afectados
> 
> 5️⃣ REFRIGERADORA:
>    • Repara de emergencia o consigue una de respaldo
>    • Mueve productos que sí se salvaron a refrigeración temporal
> 
> 💰 Los S/3,000 duelen, pero administrar vacunas comprometidas a pacientes es mucho peor.
> 
> ¿Necesitas ayuda contactando a los distribuidores?"

---

### Scenario 28: Cliente con síntomas graves

**Message:**
> "Una señora vino con dolor de pecho y brazo izquierdo, sudoración. Me pide 'algo para el dolor'. ¿Le vendo analgésico o la mando a emergencias? ¿Cuál es mi responsabilidad legal?"

**Skills involved:** yaya-escalation (but for a medical emergency, not customer service)
**MCP tools needed:** None.

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 5 | LLM can correctly identify these as cardiac symptoms |
| Accuracy | 8 | Classic heart attack symptoms — any medical knowledge recognizes this |
| Speed | 9 | MUST respond immediately |
| Completeness | 5 | Can advise to send to ER but no formal medical emergency protocol |
| Delight | N/A | Not applicable — life-threatening |
| Safety | 7 | **Platform correctly identifies this as an emergency IF the LLM is well-calibrated.** |

**Gaps:**
- No medical emergency detection and protocol skill
- No integration with emergency services
- No legal liability guidance for pharmacists
- The LLM should handle this correctly given general medical knowledge, but there's no structured safety net

**Ideal response:**
> "🚨 EMERGENCIA — NO LE VENDAS ANALGÉSICO
> 
> Esos síntomas (dolor de pecho + brazo izquierdo + sudoración) son signos clásicos de INFARTO.
> 
> ⚠️ AHORA:
> 1. Dile que se siente y no se mueva
> 2. Llama al 116 (SAMU) o 106 (bomberos) INMEDIATAMENTE
> 3. Si tienes Aspirina 100mg, dale 1 tableta masticada (NO otro analgésico)
> 4. Si está consciente, mantenla calmada
> 5. NO la dejes ir sola a su casa
> 
> 📋 Tu responsabilidad legal:
> • Como QF, tienes deber de orientar al paciente correctamente
> • NO puedes diagnosticar, pero SÍ debes derivar a emergencias
> • Si le vendes un analgésico y algo le pasa, podrías tener responsabilidad
> 
> Hiciste bien en preguntar. Ahora llama al 116. 🚑"

---

### Scenario 29: Precio en dólares

**Message:**
> "Un turista americano quiere comprar medicamentos y solo tiene dólares. Son S/85 en medicinas. ¿A cuánto le cobro en USD? ¿Puedo aceptar dólares legalmente en mi botica?"

**Skills involved:** yaya-sales (currency handling)
**MCP tools needed:** None directly. Knowledge question.

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 6 | LLM can answer with general knowledge |
| Accuracy | 6 | Exchange rate lookup needed. Legal answer varies. |
| Speed | 7 | Quick |
| Completeness | 5 | Can advise but no real-time exchange rate integration |
| Delight | 5 | Practical help |
| Safety | 6 | Legal area — should be cautious |

**Gaps:**
- No real-time exchange rate integration
- No multi-currency support in sales
- No guidance on legal requirements for accepting foreign currency
- yaya-sales doesn't handle currency conversion

**Ideal response:**
> "📊 Para S/85 en medicinas:
> 
> 💵 Tipo de cambio hoy: ~S/3.72 por dólar
> 💰 Equivalente: USD $22.85 → cobrarle USD $23 redondeado
> 
> ⚖️ ¿Puedes aceptar dólares?
> • Legalmente SÍ, en Perú se pueden aceptar dólares en transacciones privadas
> • PERO no estás obligada a aceptarlos
> • El tipo de cambio lo fijas tú (no hay obligación de usar el oficial)
> 
> 💡 Recomendación:
> • Acepta los dólares, pero usa un tipo de cambio que te proteja (S/3.60 en vez de S/3.72)
> • Así si vas a cambiarlos en una casa de cambio, no pierdes
> • Cóbrale USD $24 (S/85 / 3.60 = $23.61, redondeado)
> 
> La boleta la emites en soles (S/85). El medio de pago registras 'efectivo - dólares'.
> 
> ¿Le hago la venta?"

---

### Scenario 30: Interacción medicamentosa

**Message:**
> "Paciente toma Warfarina y quiere comprar Ibuprofeno. Mi técnico casi se lo vende. ¿Hay interacción? ¿Qué alternativa le doy? Necesito un sistema que me alerte estas cosas 💊"

**Skills involved:** None. Drug-drug interaction checking doesn't exist.
**MCP tools needed:** None available (would need a drug interaction database/MCP)

**Ratings:**
| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 5 | LLM knows this major interaction |
| Accuracy | 8 | Warfarina + Ibuprofeno is a well-known, dangerous interaction (increased bleeding risk) |
| Speed | 7 | Quick LLM response |
| Completeness | 4 | Can answer THIS question but can't build the alert system she wants |
| Delight | 5 | Correct answer but manually — she wants automation |
| Safety | 4 | **The LLM gets it right, but the SYSTEM doesn't catch it. Her request for automated alerts is the real gap.** |

**Gaps:**
- **CRITICAL: No drug-drug interaction database or checking system.** This is a patient safety gap.
- No automated alerts during dispensing ("⚠️ This patient also takes Warfarina — interaction risk")
- No patient medication profile (which drugs each patient takes regularly)
- No integration with drug interaction databases (DrugBank, Micromedex)
- This is probably the highest-value feature request from a pharmacist's perspective

**Ideal response:**
> "🚨 SÍ, hay interacción GRAVE:
> 
> ⚠️ Warfarina + Ibuprofeno:
> • Riesgo: sangrado aumentado significativamente
> • Los AINEs (ibuprofeno, naproxeno, diclofenaco) interfieren con la coagulación
> • Con warfarina, el riesgo de hemorragia se multiplica
> • NUNCA combinar sin supervisión médica
> 
> ✅ Alternativa segura:
> • Paracetamol (acetaminofén) — S/3.50
> • Es el analgésico más seguro para pacientes con warfarina
> • Dosis: 500mg cada 6-8 horas
> • Máximo 3g/día
> 
> 💡 Sobre el sistema de alertas que pides:
> Tienes toda la razón — esto debería ser automático. Actualmente no tenemos un módulo de interacciones medicamentosas integrado. Lo registro como necesidad prioritaria.
> 
> Mientras tanto:
> • Instruye a los técnicos: SIEMPRE preguntar 'qué otros medicamentos toma'
> • Los pacientes con anticoagulantes (warfarina, acenocumarol) son de ALTO RIESGO
> • NUNCA AINEs, NUNCA aspirina sin supervisión médica
> 
> ¿Quieres que prepare un protocolo de dispensación para tus técnicos?"

---

## Summary: Patricia Vega — Botica Santa Rosa

### Overall Scores (Average across all 30 scenarios)

| Dimension | Average Score |
|-----------|--------------|
| Handleable | 5.1 |
| Accuracy | 5.0 |
| Speed | 5.7 |
| Completeness | 4.2 |
| Delight | 4.7 |
| Safety | 5.2 |
| **Overall** | **5.0 / 10** |

### Top 3 Strengths

1. **Tax compliance and invoicing (yaya-tax)** — The platform handles boletas, facturas, RUC validation, tax calculations, and SUNAT declarations well. Scenarios 13, 15, 16 all score 7+. This is a real, daily need for Patricia and the platform delivers.

2. **Analytics and business intelligence (yaya-analytics)** — Top products, margin analysis, category breakdowns, and competitive pricing analysis (Scenarios 8, 12, 20, 22) work well when data is in the system. The analytics skill is well-designed for this.

3. **Sales and order processing** — Basic sale registration, payment processing, and customer management (Scenarios 2, 4, 13) work reasonably well for straightforward transactions.

### Top 3 Critical Gaps

1. **🚨 No DIGEMID/regulatory compliance system.** Controlled substance tracking, dispensing logs, temperature logs, DIGEMID reporting, inspection preparation — NONE of these exist. This is the single biggest deal-breaker. A pharmacy without compliance tools is a pharmacy at risk of closure. **Needs: yaya-compliance or yaya-pharma-regulatory skill.**

2. **🚨 No drug interaction checking system.** Scenario 30 is Patricia's explicit cry for help. Warfarina + Ibuprofeno could kill someone. The platform has zero drug interaction awareness. No patient medication profiles, no dispensing alerts, no interaction database. **Needs: drug-interaction-mcp or integration with a pharmaceutical database.**

3. **🚨 No insurance/EPS integration.** Scenarios 9 and 10 show complete inability to handle insurance reimbursements (a major revenue stream) or insurance coverage lookups (a daily task). Pharmacies that serve insured patients need this. **Needs: yaya-insurance skill + EPS/insurance MCP integration.**

### Additional Critical Gaps

4. **No cold chain management** — Temperature logging, out-of-range alerts, excursion assessment (Scenarios 7, 27)
5. **No pharmaceutical knowledge base** — Drug protocols, therapeutic regimens, prescription requirements (Scenarios 6, 26)
6. **No staff/shift management** — Employee scheduling, coverage finding, labor compliance (Scenario 17)
7. **No batch/lot tracking with expiry** — Inventory skill needs pharma-grade batch management (Scenario 5)
8. **No patient medication profiles** — Can't track what regular patients take for interaction checking (Scenario 30)
9. **No medical emergency protocols** — Life-threatening scenarios need structured responses (Scenarios 24, 28)

### PMF Readiness Score: 35%

**The platform is partially ready for pharmacies but has critical regulatory and safety gaps.**

The platform's core strengths (tax compliance, analytics, payment processing, basic sales) cover about 30-40% of Patricia's daily needs. But the pharmacy vertical has unique regulatory requirements (DIGEMID, controlled substances, cold chain, prescription enforcement) that are completely absent. These aren't nice-to-haves — they're legal requirements that determine whether the pharmacy stays open.

The safety-critical scenarios (Scenarios 24, 27, 28, 30) reveal that the platform relies entirely on the LLM's general knowledge for life-and-death situations. While the LLM usually gets the right answer, there's no structured safety system, no guaranteed correct responses, and no audit trail for these critical interactions.

### Key Insight for This Industry/Market Segment

**Pharmacies are a high-value but high-complexity vertical.** Patricia's business is 10x María's revenue, has employees, formal tax obligations, and real operational complexity — making her a much better Yaya customer (Growth or Pro plan). But pharmacies are one of the most regulated retail businesses in Peru. The gap between "generic retail platform" and "pharmacy-ready platform" requires 4-5 new skills or MCPs:

1. **yaya-pharma-compliance** — DIGEMID reporting, controlled substance tracking, BPA compliance, inspection prep
2. **drug-interaction-mcp** — Drug-drug interaction database, prescription requirement checks, dosage validation
3. **yaya-insurance** — EPS claim submission/tracking, insurance coverage lookup, copay calculation
4. **cold-chain-mcp** — Temperature logging, alerting, excursion assessment by product
5. **yaya-staffing** — Employee scheduling, shift management, coverage finding

The ROI of building these is high: pharmacy owners pay more (S/249-499/month is reasonable given their revenue), have real pain points that justify the cost, and are more likely to stay long-term because switching costs are high once their data is in the system. But the investment is significant — these are deep, specialized features, not surface-level adaptations.

**Bottom line:** The platform can handle ~35% of Patricia's needs today. To reach 70%+ (minimum for PMF in this vertical), it needs the pharma-specific compliance, safety, and insurance features. The generic retail features (sales, payments, analytics, tax) are a solid foundation to build on.
