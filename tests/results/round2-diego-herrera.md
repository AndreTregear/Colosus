# Round 2 Evaluation: Diego Herrera — Distribuidora Herrera (Barranquilla)

**Evaluator:** Yaya Platform Test Engine  
**Date:** 2026-03-21  
**Focus:** Colombia market fit, B2B wholesale distribution, Peru-centric gaps

---

## Scenario Evaluations

### Core Business (S01–S07)

**S01** — "Ajá Yaya, pedido de Constructora Caribe SAS: 500 bultos cemento..." — **Score: 4/10**  
yaya-sales handles order creation but lacks B2B features: credit terms (45 días), cotización formal, multi-product wholesale orders with volume pricing. No quotes/proposals skill. The order complexity (4 product categories, wholesale pricing, credit terms) exceeds the skill's B2C design. 🚨 **GAP: No B2B quoting/proposals**

**S02** — "Vendí hoy a Ferretería El Costeño: 100 bultos cemento..." — **Score: 6/10**  
yaya-sales can register the sale with line items. yaya-payments tracks Bancolombia transfer. Factura electrónica request fails (DIAN). COP currency formatting needed.

**S03** — "Cuánto cemento Argos tengo en bodega? Y hierro de 1/2?" — **Score: 7/10**  
yaya-inventory handles stock queries well. Multi-product lookup supported. Warehouse-level stock (bodega Vía 40) works with multi-warehouse config. Good country-agnostic fit.

**S04** — "Argos subió el cemento 5%. Bulto me llega a $28,500..." — **Score: 5/10**  
yaya-inventory can update prices but no cost-plus pricing automation. Diego needs: new cost → apply 12% minimum margin → new selling price. No margin-based repricing skill. Manual price update possible but tedious across all cement products.

**S05** — "Despacha mañana 7am: Constructora del Norte, obra en Puerto Colombia..." — **Score: 3/10**  
No shipping/logistics/dispatch skill. No guía de remisión generation. No driver assignment. No route planning. Construction distribution relies heavily on dispatch management. 🚨 **CRITICAL GAP: No logistics skill**

**S06** — "Cotización para Constructora Costa SAS: proyecto de 50 apartamentos..." — **Score: 3/10**  
No quotation/proposal skill. An 8-month multi-product construction supply contract needs formal cotización with volume pricing, delivery schedule, credit terms. Way beyond yaya-sales capability. 🚨 **CRITICAL GAP**

**S07** — "Pagué gasolina $380,000, peajes $45,000, mantenimiento $250,000..." — **Score: 3/10**  
No expense tracking skill. Operating costs (fuel, tolls, maintenance, meals) are not captured anywhere. No petty cash management. yaya-analytics can't compute profitability without expenses. 🚨 **GAP: No expense management**

### Pricing & Payments (S08–S12)

**S08** — "Dime todos los que me deben plata con más de 30 días..." — **Score: 3/10**  
No accounts receivable / cartera management. No aging report (30/60/90 days). No collections workflow. This is Diego's #1 daily task and biggest pain point. 🚨 **CRITICAL GAP: No cartera skill**

**S09** — "Ferretería La Esquina quiere $15,000,000 a crédito 30 días..." — **Score: 2/10**  
No credit assessment or credit limit management. No client scoring for creditworthiness. No risk assessment for new B2B clients. Construction sector has high default rates. 🚨 **CRITICAL GAP**

**S10** — "Constructora Caribe abonó $8,000,000 de $18,500,000..." — **Score: 5/10**  
yaya-payments has partial payment concept. Can register abono and calculate remaining balance. But no invoice-level payment tracking or automatic application to oldest invoice.

**S11** — "3% descuento por pronto pago en pedido de $25,000,000..." — **Score: 6/10**  
Basic discount calculation (3% of $25M = $750K). yaya-sales can compute this. The cost-of-capital analysis (is losing $750K worth getting money 45 days early?) is LLM-level reasoning the platform could handle.

**S12** — "Cheque de $6,500,000 devuelto por fondos insuficientes!!" — **Score: 2/10**  
No check management at all. Cheques are 15% of Diego's payments. No dishonored check process, no legal recourse guidance (título valor, proceso ejecutivo under Colombian commercial code). No credit suspension workflow. 🚨 **CRITICAL GAP**

### Invoicing / DIAN (S13–S17)

**S13** — "Factura para Constructora Caribe: 500 bultos cemento a $32,000, IVA del 5%?" — **Score: 1/10**  
yaya-tax is 100% Peru/SUNAT. But this scenario is extra complex: cement has IVA 5% (reduced rate) in Colombia, not the standard 19%. Multi-rate IVA (some products 5%, others 19%) is completely absent. NIT validation missing. 🚨 **CRITICAL FAIL — PERU-ONLY + MULTI-RATE IVA**

**S14** — "Constructora del Norte devolvió 20 bultos rotos. Nota crédito electrónica..." — **Score: 1/10**  
DIAN nota crédito electrónica not supported. SUNAT-only. 🚨 **CRITICAL FAIL**

**S15** — "Rete fuente 2.5%, rete ICA 0.7%. Cuánto me descuentan de $25,000,000?" — **Score: 1/10**  
Retefuente AND Rete ICA (municipal tax) both absent. Colombia's layered withholding system (national + municipal) is unique and completely unsupported. The math itself is simple but the tax concepts need proper handling. 🚨 **CRITICAL FAIL**

**S16** — "Compré tubería a un señor sin factura electrónica. Documento soporte..." — **Score: 1/10**  
Documento soporte de adquisición (for purchases from non-facturadores) is a specific DIAN requirement since 2021. Zero knowledge in the platform. This is critical for construction distributors who buy from informal suppliers. 🚨 **CRITICAL FAIL**

**S17** — "Resumen para declaración: ventas totales, IVA generado, IVA descontable, retenciones..." — **Score: 1/10**  
Colombian tax declaration summary (ventas, IVA generado, IVA descontable, retenciones practicadas, retenciones sufridas) is completely different from Peru's PDT 621. No coverage. 🚨 **CRITICAL FAIL**

### Scheduling (S18–S20)

**S18** — "5 despachos esta semana: lunes Constructora Caribe, martes Ferretería..." — **Score: 4/10**  
yaya-appointments is designed for customer-facing appointments, not logistics/dispatch scheduling. Driver assignments, truck capacity, route optimization are absent. Could crudely use appointment slots for dispatch blocks but it's a forced fit.

**S19** — "Camión NPR tiene cambio de aceite lunes. Recuérdame viernes..." — **Score: 7/10**  
Simple reminder via yaya-followup/cron. Vehicle maintenance scheduling is a basic calendar event. Good fit for simple reminder.

**S20** — "Representante de Argos viene jueves 10am. Recuérdame preparar datos..." — **Score: 7/10**  
yaya-appointments can schedule meeting + yaya-followup can remind with preparation checklist. Good fit.

### Analytics (S21–S23)

**S21** — "Mis 5 mejores clientes del trimestre? Cuánto compra y cuánto me deben?" — **Score: 5/10**  
yaya-analytics has top customers report. But combining purchase volume with outstanding debt (cartera) needs the missing AR module. Half the question (how much they owe) is unanswerable. 🚨 **PARTIAL GAP**

**S22** — "Cuál producto me deja más margen? Cemento, hierro, tubería, pintura, pisos?" — **Score: 5/10**  
yaya-analytics has product performance concept but margin requires cost data. No purchasing/cost tracking means margins can't be computed. Volume ranking is possible but profitability ranking is not.

**S23** — "Cuánto me entra vs cuánto me sale este mes? Flujo de caja..." — **Score: 3/10**  
Cash flow analysis needs both income AND expenses. yaya-analytics tracks income. No expense tracking. Diego's core issue (buys cash, sells on credit → cash squeeze) can't be diagnosed without both sides. 🚨 **CRITICAL GAP**

### Escalation (S24–S26)

**S24** — "200 bultos de cemento mojados del proveedor!! $5,700,000..." — **Score: 5/10**  
yaya-escalation handles urgency and human handoff. Supplier claims process (Argos reclamación) needs domain knowledge not present. Photo documentation mentioned. Gap: no supplier dispute management skill.

**S25** — "Camión tuvo accidente en la Vía 40 con mercancía!!" — **Score: 5/10**  
yaya-escalation correctly flags safety-critical for immediate handoff. Insurance (SOAT, póliza todo riesgo), ARL for driver injury — all Colombia-specific. No vehicle insurance or accident protocol knowledge. 🚨 **NEEDS COLOMBIAN CONTEXT**

**S26** — "Ferretería San José cerró y me debe $12,000,000!!" — **Score: 3/10**  
No legal collections guidance. Colombian insolvency law (Ley 1116), proceso ejecutivo, embargo y secuestro all absent. No bad debt write-off accounting. 🚨 **CRITICAL GAP**

### Edge Cases (S27–S30)

**S27** — "Cotización desde Zona Franca de Barranquilla. IVA diferente?" — **Score: 1/10**  
Zona Franca tax treatment (IVA tarifa 0%, considered export) is a specialized Colombian tax concept. yaya-tax has zero knowledge. This is relevant to Barranquilla's industrial landscape. 🚨 **CRITICAL FAIL**

**S28** — "Proveedor en Panamá ofrece pisos 30% más baratos. Importar directo?" — **Score: 2/10**  
No import/customs knowledge. Arancel, IVA de importación, agente aduanero, registro de importación DIAN — all absent. Total landed cost calculation needs customs + freight + FX. 🚨 **CRITICAL GAP**

**S29** — "Se cayó un rack con 100 bultos! Bodeguero atrapado, posible fractura..." — **Score: 6/10**  
yaya-escalation handles safety-critical correctly: immediate human handoff, urgency detection. Gap: ARL (Administradora de Riesgos Laborales) reporting requirements, FURAT (Formato Único de Reporte de Accidente de Trabajo), Colombian workplace accident protocol. 🚨 **NEEDS COLOMBIAN LABOR LAW**

**S30** — "Policía detuvo camión sobrecargado, 3 toneladas de más..." — **Score: 3/10**  
No knowledge of Colombian transit law (Código Nacional de Tránsito), SIMIT multas, vehicle weight regulations, merchandise seizure risk. This is a frequent real-world problem for distributors. 🚨 **GAP**

---

## Summary

| Metric | Value |
|--------|-------|
| **Overall Score** | **3.5/10** |
| **PMF Readiness (Colombia)** | **15%** |

### Top 3 Strengths
1. **Inventory management** — Stock queries, product tracking, warehouse-level visibility work for construction materials. Country-agnostic and functional.
2. **Simple reminders** — Vehicle maintenance, meeting preparation, and calendar events handled well by appointments + followup cron.
3. **Safety-critical escalation** — Workplace accidents, vehicle incidents correctly trigger immediate human handoff with appropriate urgency.

### Top 3 Gaps
1. 🚨 **Tax/invoicing 100% Peru-only AND Colombia needs multi-rate IVA** — Beyond the standard DIAN gap, construction materials have mixed IVA rates (cement 5%, others 19%), Rete ICA (municipal), documento soporte, Zona Franca treatment. The most complex tax scenario of all 4 personas.
2. 🚨 **No accounts receivable / cartera / credit management** — Diego's #1 pain point (constructoras pay 60-90 days late, $12M bad debts, bounced checks) has zero skill support. B2B wholesale distribution IS cartera management. Dealbreaker.
3. 🚨 **No logistics / dispatch / fleet management** — No guía de remisión, no driver assignment, no route planning, no vehicle weight management. Construction distribution is a logistics-first business. Dealbreaker.

### Additional Peru-Centric Flags
- Consumer protection: SIC (Colombia) not INDECOPI
- Transit law: Código Nacional de Tránsito (Colombia) not referenced
- Labor accidents: ARL + FURAT (Colombia) not EsSalud (Peru)
- Zona Franca: Colombian tax-free zone regime completely absent
- Import customs: DIAN customs vs SUNAT aduanas
- Document soporte: Colombia-specific requirement for purchases from informal sellers
- Cheques: Check management and dishonored check law (título valor) absent
- ICA tax: Municipal industry & commerce tax unique to Colombia

### Key Insight
**Diego is the worst-fit persona for the current platform.** His business is B2B wholesale distribution — a sector that runs on credit terms, accounts receivable management, logistics, and complex tax compliance. The platform was built for B2C WhatsApp retail. The gap is structural, not incremental. Diego needs: cartera management (aging, collections, credit limits), dispatch logistics (routes, drivers, remisiones), purchasing (supplier management, cost tracking), multi-rate IVA, and Zona Franca handling. **This persona type would require essentially building a mini-ERP, which contradicts the platform's WhatsApp-first simplicity philosophy.** The honest assessment: Diego should use a proper Colombian ERP (Siigo, Alegra, World Office) and Yaya should focus on simpler B2C/service businesses first. If pursued, start with cartera management as the single highest-value module.
