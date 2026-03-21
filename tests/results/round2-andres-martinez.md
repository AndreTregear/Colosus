# Round 2 Evaluation: Andrés Martínez — Medellín Specialty Coffee

**Evaluator:** Yaya Platform Test Engine  
**Date:** 2026-03-21  
**Focus:** Colombia market fit, B2B complexity, export handling, Peru-centric gaps

---

## Scenario Evaluations

### Core Business (S01–S07)

**S01** — "Qué más pues, soy Andrés de Café Origen..." — **Score: 6/10**  
yaya-onboarding handles business setup but doesn't account for multi-channel businesses (B2B + B2C + Export). Onboarding is single-channel focused. Payment setup defaults to Yape/Plin. Tax setup is SUNAT-only — Andrés needs DIAN NIT SAS + régimen ordinario + retefuente. 🚨 **PERU-CENTRIC**

**S02** — "Parce, Restaurante Cielo me pidió 10kg de café Huila..." — **Score: 5/10**  
yaya-sales can create orders but B2B features (net-30 payment terms, recurring client orders) are weak. No accounts receivable management for credit terms. The "30 días" payment term needs invoicing + cartera tracking.

**S03** — "Ve, hoy me llegaron pedidos de: La Provincia, El Balcón, Cocina Urbana..." — **Score: 5/10**  
Multiple B2B orders in one message. yaya-sales would need to parse and create 3 separate orders with different products. Multi-order parsing from a single message isn't well-documented. Batch order creation gap.

**S04** — "Cuánto café verde me queda en bodega? Por origen..." — **Score: 6/10**  
yaya-inventory supports multi-warehouse and variant tracking (origin as variant). Could work if set up correctly. But coffee-specific concepts (green vs roasted, roast loss/merma 15-18%) aren't standard inventory features.

**S05** — "Hoy en el café vendimos bien: como $850.000..." — **Score: 6/10**  
yaya-sales can register aggregate daily sales. But multi-payment (Nequi + datáfono) split registration isn't well-handled in examples. No datáfono (POS terminal) as payment method — Colombia-specific gap.

**S06** — "Me entraron 5 pedidos en Shopify hoy..." — **Score: 4/10**  
No Shopify integration. yaya-sales is WhatsApp-first, no e-commerce platform sync. Manual re-entry of Shopify orders defeats the purpose. 🚨 **INTEGRATION GAP**

**S07** — "Parce conseguí un restaurante nuevo: Sabor Criollo..." — **Score: 6/10**  
yaya-crm can create new B2B contacts with NIT. Good fit for client registration. Gap: no credit limit/terms setup per client. No B2B onboarding workflow.

### Pricing/Payments (S08–S12)

**S08** — "El Balcón me debe 2 facturas: $650K de hace 35 días..." — **Score: 4/10**  
No accounts receivable / cartera management skill. yaya-payments is customer-to-business payment validation (screenshots), not business-to-business collections. B2B collections (cobro de cartera) is a critical gap for Andrés's 40-restaurant model. 🚨 **CRITICAL GAP**

**S09** — "Hoy me pagaron: Restaurante Cielo $650K Bancolombia..." — **Score: 6/10**  
yaya-payments can register Bancolombia payments. Multi-payment recording in one message works conceptually. Gap: no automatic invoice-to-payment reconciliation.

**S10** — "Mi cliente de Portland quiere 4 sacos... $720 USD..." — **Score: 3/10**  
No multi-currency support in yaya-sales or yaya-payments. USD invoicing not supported. FX rate lookup not available. Export documentation (certificado de origen, fitosanitario ICA) completely absent. 🚨 **CRITICAL GAP — EXPORT**

**S11** — "Sabor Criollo pregunta si mejor precio si pide 20kg..." — **Score: 5/10**  
yaya-sales has basic discount capability but no volume pricing tiers, no margin calculator for B2B negotiations. Andrés needs to know his cost structure to negotiate safely.

**S12** — "Cuáles restaurantes ya pagaron y cuáles me deben?" — **Score: 3/10**  
No accounts receivable dashboard. yaya-analytics could theoretically report on payment status but there's no cartera aging (30/60/90 days) concept. This is Andrés's #1 daily pain. 🚨 **CRITICAL GAP**

### Invoicing (S13–S17)

**S13** — "Facturar a Restaurante Cielo, NIT 900.876.543-2... IVA + retención en la fuente 2.5%..." — **Score: 1/10**  
yaya-tax is 100% SUNAT/Peru. No DIAN factura electrónica. No IVA 19%. No NIT validation. No retefuente calculation. Complete fail. 🚨 **CRITICAL FAIL — PERU-ONLY**

**S14** — "Factura de exportación para Portland Coffee Co., $720 USD..." — **Score: 1/10**  
Export invoicing not supported. IVA exemption for exports (tarifa 0%) not handled. USD invoicing absent. DIAN export documentation absent. 🚨 **CRITICAL FAIL**

**S15** — "Facturar a todos los restaurantes... como 12 facturas. En lote?" — **Score: 1/10**  
No batch invoicing at all. yaya-tax processes one invoice at a time. For 40 restaurants, this is essential. 🚨 **CRITICAL FAIL**

**S16** — "Cocina Urbana le facturé $350K pero me devolvieron 2kg..." — **Score: 2/10**  
Nota crédito concept exists but tied to SUNAT. DIAN nota crédito electrónica has different XML schema and resolution requirements.

**S17** — "No entiendo la retefuente. Restaurante Cielo me retuvo $16.250..." — **Score: 1/10**  
Retefuente (withholding tax) is a critical Colombian tax concept with zero coverage. yaya-tax doesn't know what retefuente is. Also missing: Rete ICA, auto-retención de renta. 🚨 **CRITICAL FAIL**

### Analytics (S18–S22)

**S18** — "Cuánto vendí desglosado por canal: café, restaurantes, online, exportación..." — **Score: 5/10**  
yaya-analytics has channel breakdown concept but Andrés's 4 channels (café B2C, B2B restaurants, Shopify online, USD export) would need explicit channel tagging. Report examples are single-channel.

**S19** — "Cuánto me cuesta producir 1kg de café tostado?..." — **Score: 4/10**  
Production cost analysis (green coffee + roasting + merma + empaque) is manufacturing/COGS. No production cost module in any skill. Coffee-specific merma (15-18% weight loss in roasting) needs specialized calculation.

**S20** — "Cuáles son mis 10 mejores restaurantes por volumen de compra?" — **Score: 6/10**  
yaya-analytics top customers report covers this. B2B client ranking is conceptually supported. Gap: no trend analysis (who's increasing vs decreasing).

**S21** — "Si mantengo el ritmo... cuántos sacos de café verde necesito comprar?" — **Score: 5/10**  
yaya-inventory has reorder suggestions based on sales velocity. But coffee green-to-roasted conversion factor (merma) isn't accounted for. Raw material forecasting needs production multiplier.

**S22** — "Cuál es el ticket promedio en el café este mes?" — **Score: 7/10**  
yaya-analytics covers ticket promedio with period comparison. Good fit. Country-agnostic metric.

### Escalation (S23–S25)

**S23** — "El certificado fitosanitario del ICA venció..." — **Score: 2/10**  
No export compliance knowledge. ICA (Instituto Colombiano Agropecuario) is Colombia-specific. No guidance on fitosanitario renewal process. Export escalation completely unsupported. 🚨 **CRITICAL GAP**

**S24** — "La Terraza me debe $1.950.000 de 3 facturas. 60 días..." — **Score: 4/10**  
yaya-escalation can detect the urgency. But no legal collections guidance for Colombia. No knowledge of Colombian commercial law (cobro jurídico, título valor, proceso ejecutivo). References INDECOPI instead of SIC/Colombian courts.

**S25** — "3 restaurantes dicen que el último lote sabe diferente..." — **Score: 5/10**  
yaya-escalation can handle multi-client complaints. Quality control documentation isn't covered. No batch recall or quality tracking skill. But the human handoff is appropriate here.

### Edge Cases (S26–S28)

**S26** — "Parce mira: 1) Facturar a Cielo 2) Portland son 6 sacos..." — **Score: 3/10**  
5-topic message: invoice (DIAN fail), export update (USD fail), café sales (OK), client loss (CRM OK), purchase order (no purchasing skill). Only 2 of 5 items can be handled. 🚨 **MULTI-FAIL**

**S27** — "qué hubo pues, lo de la semana pasada ya quedó cuadrado o qué?" — **Score: 4/10**  
Highly ambiguous paisa expression. No context resolution capability. Would need conversation history search. yaya-crm could check recent interactions but "lo de la semana pasada" is too vague.

**S28** — "Parce ya estoy en la bodega, voy a tostar 50kg hoy..." — **Score: 3/10**  
Production tracking (toasting batches) not supported. No manufacturing/production skill. Scheduled stock update ("anótame cuando termine, calculo a las 11am") needs deferred task capability not present in any skill.

---

## Summary

| Metric | Value |
|--------|-------|
| **Overall Score** | **4.0/10** |
| **PMF Readiness (Colombia)** | **20%** |

### Top 3 Strengths
1. **CRM/client management** — New B2B client registration, contact enrichment, and segmentation work across countries
2. **Basic analytics** — Ticket promedio, top clients, sales summaries are solid and country-agnostic
3. **Escalation framework** — Frustration detection and human handoff work regardless of country

### Top 3 Gaps
1. 🚨 **Tax/invoicing 100% Peru-only** — DIAN, IVA 19%, NIT, retefuente, Rete ICA, auto-retención, factura electrónica DIAN all missing. 5/5 invoicing scenarios score 1-2/10. This is a dealbreaker.
2. 🚨 **No B2B accounts receivable / cartera management** — Andrés's core daily pain (40 restaurants, 40 invoices, 40 payment follow-ups) has zero skill support. No aging reports, no collection workflows, no credit limit management.
3. 🚨 **No export/multi-currency support** — USD invoicing, FX rates, export documentation (ICA fitosanitario, DIAN export docs, certificados de origen) completely absent. His $15K/year US business is unsupported.

### Key Insight
**Andrés represents the most complex persona** — multi-channel (B2B + B2C + e-commerce + export), multi-currency (COP + USD), multi-tax (IVA + retefuente + Rete ICA), manufacturing (coffee roasting with merma). The platform is fundamentally built for simple B2C retail via WhatsApp. Andrés needs: B2B cartera management, batch invoicing, production costing, export documentation, and Shopify integration. The gap between what he needs and what exists is the widest of all 4 personas. **PMF for this persona type requires a near-complete B2B module buildout.**
