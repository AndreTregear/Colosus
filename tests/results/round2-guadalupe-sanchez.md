# Round 2 Evaluation: Guadalupe Sánchez — Taquería La Güera (CDMX)

**Evaluator:** Yaya Platform Test Suite  
**Date:** 2026-03-21  
**Focus:** Mexico market fit, Peru-centric gaps, platform readiness

---

## Scenario Evaluations

### Core Business (Scenarios 1-7)

**S1: "Yaya, hoy vendimos chido 🌮🔥 Coyoacán: $18,500..."** — Score: 6/10  
yaya-sales can register multi-location sales, but all examples use S/ (soles). MXN formatting untested. Uber Eats integration absent — can't pull actual delivery platform data.

**S2: "Compré en la Central: 40kg bistec a $180/kg..."** — Score: 5/10  
yaya-inventory can track purchases but isn't designed for bulk raw ingredient purchasing by weight/kg. No supplier management for Central de Abastos. Cash-only purchase tracking is weak.

**S3: "Ayúdame a sacar el costo de un taco al pastor..."** — Score: 7/10  
Basic cost calculation is doable via yaya-analytics. No dedicated food-cost/recipe-costing module, but math is straightforward. Would need manual setup of ingredient costs.

**S4: "Me pidieron 200 tacos para una fiesta el sábado..."** — Score: 6/10  
yaya-sales can handle catering orders. Ingredient quantity calculation (meat per taco × 200) is basic math the LLM handles. No catering/event-specific workflow exists.

**S5: "Hoy sobraron como 5kg de bistec y 3kg de suadero..."** — Score: 4/10  
No merma/waste tracking module. yaya-inventory tracks stock levels but not spoilage/waste analysis. Critical gap for food businesses where waste = lost margin.

**S6: "Uber Eats me reporta $8,400 en ventas hoy..."** — Score: 5/10  
yaya-analytics can calculate commission impact (simple math), but no Uber Eats/Rappi integration. Can't pull actual delivery platform data. The "is it worth it?" analysis is valuable but manual.

**S7: "Cuántos refrescos tengo?..."** — Score: 5/10  
yaya-inventory can track beverages. Aguas frescas (perishable, made daily in liters, sold by vaso) don't fit the SKU-based inventory model designed for retail products.

### Pricing & Payments (Scenarios 8-12)

**S8: "La carne subió otra vez güey!! El bistec pasó de $170 a $190..."** — Score: 6/10  
yaya-analytics can model price impact. No food-industry-specific pricing strategy (e.g., shrinkflation, combo adjustments). General business advice works.

**S9: "Un cliente dice que ya me transfirió $850 por SPEI..."** — Score: 2/10  
🚨 **PERU-CENTRIC FAIL.** yaya-payments only supports Yape/Plin/Nequi/BCP/BBVA Peru. No SPEI validation, no BBVA México, no Banorte, no Banamex. Cannot verify Mexican bank transfers AT ALL.

**S10: "Pagar nómina de la semana: 2 taqueros $3,500 c/u..."** — Score: 3/10  
No payroll/nómina skill exists. Can do basic math (sum = $26,600) but no IMSS calculations, no ISR retention on salaries, no formal payroll management. Critical gap.

**S11: "La taquería de enfrente bajó el taco de pastor a $15..."** — Score: 6/10  
yaya-analytics can provide competitive analysis advice. No market-specific intelligence. Generic but useful strategic guidance.

**S12: "Un chavo quiere pagar con CoDi..."** — Score: 1/10  
🚨 **PERU-CENTRIC FAIL.** CoDi (Cobro Digital, Banxico's QR payment system) doesn't exist in any skill. yaya-payments has zero Mexican digital payment support. Complete blind spot.

### Invoicing / SAT (Scenarios 13-17)

**S13: "Un señor quiere factura CFDI por $2,350 pesos..."** — Score: 1/10  
🚨 **PERU-CENTRIC FAIL.** yaya-tax is 100% SUNAT/Peru. No CFDI 4.0 generation, no RFC validation (only RUC/DNI), no SAT integration, no uso de CFDI catalog. Complete failure.

**S14: "Toca declarar al SAT..."** — Score: 1/10  
🚨 **PERU-CENTRIC FAIL.** Declarations are PDT 621 (SUNAT) only. No SAT declaration support, no ISR provisional, no IVA declaration. Mexican tax calendar completely absent.

**S15: "Estoy en RESICO pero si paso de $3.5 millones..."** — Score: 1/10  
🚨 **PERU-CENTRIC FAIL.** RESICO (Régimen Simplificado de Confianza) is Mexico-specific. yaya-tax only knows NRUS/RER/RMT/RG (Peruvian regimes). No RESICO rules, thresholds, or implications.

**S16: "Los tacos para llevar no llevan IVA, ¿verdad?..."** — Score: 1/10  
🚨 **PERU-CENTRIC FAIL.** Mexico IVA rules for food are complex: alimentos preparados can be 0% or 16% depending on context (in-store vs takeaway varies by state). yaya-tax only knows Peru's 18% IGV. Dangerously wrong answers possible.

**S17: "Compré una plancha nueva en $25,000..."** — Score: 1/10  
🚨 **PERU-CENTRIC FAIL.** Mexican deductibility rules (requiring CFDI from supplier, activos fijos depreciation per LISR) are absent. No understanding of Mexican deduction requirements.

### Scheduling (Scenarios 18-20)

**S18: "El taquero Memo no viene mañana..."** — Score: 4/10  
yaya-appointments handles customer appointments, not employee shift management. No staff scheduling, no shift coverage logic. Can note it but can't solve it.

**S19: "El fin de semana es puente..."** — Score: 7/10  
Basic reminder/scheduling works. yaya-followup can set reminders. No awareness of Mexican holidays (puentes) but the user specifies the timing explicitly.

**S20: "Viene inspección de Salubridad..."** — Score: 6/10  
Can create checklist reminders. No COFEPRIS/Salubridad-specific compliance knowledge, but the user provides the checklist items. Reminder functionality works.

### Analytics (Scenarios 21-23)

**S21: "Cuál es el taco que más se vende?..."** — Score: 6/10  
yaya-analytics can report top products IF data is properly entered. Product-level analysis works. Margin comparison requires cost data to be tracked (not default).

**S22: "Cuál sucursal vende más?..."** — Score: 6/10  
Multi-warehouse/location comparison exists in yaya-analytics. Requires both locations to be set up as separate warehouses in ERPNext.

**S23: "A qué hora vendo más?..."** — Score: 5/10  
Time-based analytics possible but not shown in examples. Would need transaction timestamps. Feasible but not a demonstrated capability.

### Escalation (Scenarios 24-26)

**S24: "Me llamaron 3 clientes diciendo que les cayó mal la comida..."** — Score: 5/10  
yaya-escalation detects urgency. No food safety protocol, no COFEPRIS reporting guidance, no Mexico-specific legal advice for foodborne illness. Escalates to owner but lacks domain expertise.

**S25: "Se metieron a robar a la sucursal..."** — Score: 4/10  
yaya-escalation can notify owner. No insurance claim guidance for Mexico, no Ministerio Público process knowledge, no understanding of Mexican insurance/seguro comercial.

**S26: "La tortillera se quemó con el comal..."** — Score: 3/10  
🚨 **MEXICO GAP.** No IMSS (Instituto Mexicano del Seguro Social) knowledge. Doesn't know about riesgo de trabajo reporting, ST-7 form, or the difference between clínica del IMSS vs hospital. Critical for employee accidents.

### Edge Cases (Scenarios 27-30)

**S27: "Un gringo quiere pagar con dólares..."** — Score: 4/10  
No forex/exchange rate capability. Can give general advice but no real-time USD/MXN rate, no guidance on legality of accepting foreign currency in Mexico.

**S28: "GÜEY huele a gas en la cocina de Coyoacán!!"** — Score: 7/10  
yaya-escalation detects emergency keywords. Should immediately advise evacuation + call bomberos (911). Safety-critical response is the platform's strength. No Mexico-specific gas LP provider knowledge.

**S29: "Vino un tipo a pedir 'cuota' de $5,000 semanales..."** — Score: 5/10  
yaya-escalation handles this as crisis. No Mexico-specific extortion reporting guidance (denuncia anónima, 089 línea de denuncia), but general safety advice applies.

**S30: "Quiero dejar Uber Eats y hacer mi propio delivery..."** — Score: 5/10  
yaya-analytics can model cost comparison. No delivery logistics module, no Mexico-specific labor cost for repartidores, no last-mile delivery knowledge.

---

## Summary

| Metric | Value |
|--------|-------|
| **Overall Score** | **4.2/10** |
| **PMF Readiness (Mexico)** | **~20%** |

### Top 3 Strengths
1. **Emergency escalation** — Gas leaks, food poisoning, robbery all trigger appropriate urgency responses
2. **Basic analytics framework** — Product performance, branch comparison, cost analysis structures exist
3. **Reminder/scheduling backbone** — Purchase reminders, inspection checklists work as basic task management

### Top 3 Gaps
1. 🚨 **Tax/invoicing is 100% Peru** — CFDI 4.0, SAT, RFC, RESICO, ISR, Mexican IVA rules are completely absent. 5 scenarios score 1/10. This is the #1 blocker.
2. 🚨 **Payment rails are 100% Peru** — No SPEI, CoDi, Oxxo Pay, MercadoPago, or any Mexican bank support. Payment validation (core feature) is non-functional.
3. 🚨 **No payroll/HR** — Mexican employers need IMSS, ISR retention, nómina management. Zero support for the 12-person team.

### Key Insight
**Guadalupe would abandon the platform within the first week.** Her top 3 daily needs — accepting SPEI payments, issuing CFDIs, and managing cash flow in MXN — are all completely unsupported. The platform feels like it was built for a Lima shoe store, not a CDMX taquería. The food service industry needs waste tracking, recipe costing, and supplier management that don't exist. Mexico's tax system (SAT/CFDI) is fundamentally different from Peru's (SUNAT/factura electrónica) and cannot be adapted with config changes alone — it requires a new tax skill entirely.
