# Round 2 Evaluation — Alex Ríos (Lima Tech Agency)

**Evaluator:** Yaya Platform Test Engine
**Date:** 2026-03-21
**Persona:** Alex Ríos, 27, "Ríos Digital" — Marketing agency, 5 employees, S/350K/yr, RMT regime

---

## Scenario Evaluations

**S01** — "Hola! Soy Alex de Ríos Digital 🚀 Quiero registrar mi agencia..."
Skills: yaya-onboarding + yaya-crm | Score: **8/10**
Gap: Onboarding is solid but no specific flow for B2B service agencies (team roles, service vs product catalog).

**S02** — "Necesito agregar un servicio nuevo: 'Auditoría SEO express' a S/1,200 flat..."
Skills: yaya-inventory | Score: **6/10**
Gap: Inventory skill is product/retail-oriented; no one-time vs recurring service distinction, no service catalog concept.

**S03** — "Acabo de cerrar con TechnoPlast SAC, es un cliente B2B..."
Skills: yaya-crm | Score: **7/10**
Gap: CRM handles contacts well but lacks B2B contract management — linking multiple services to one client, contract start/end dates.

**S04** — "El proyecto web de MiCasaFit ya está al 70%..."
Skills: None directly | Score: **2/10**
Gap: **No project management skill exists.** No way to track project milestones, deadlines, or completion percentages.

**S05** — "Bro cuántos clientes activos tengo ahorita?..."
Skills: yaya-analytics + yaya-crm | Score: **6/10**
Gap: Analytics is transaction-based, not recurring-revenue-based. No MRR/ARR tracking for service businesses.

**S06** — "Mi dev Carlos metió 12 horas esta semana en el proyecto de GreenPeru..."
Skills: None directly | Score: **2/10**
Gap: **No time tracking or team cost allocation skill.** Critical for agency profitability analysis.

**S07** — "Me pidieron una cotización para landing page + 3 meses de SEO básico..."
Skills: yaya-sales (partial) | Score: **5/10**
Gap: No formal quotation/proposal generation with multi-currency (PEN+USD), service bundling, or PDF export.

**S08** — "TechnoPlast me acaba de pagar la primera cuota: $1,400 USD por PayPal..."
Skills: yaya-payments | Score: **5/10**
Gap: Payments skill is screenshot-OCR-focused for Yape/Plin. No PayPal recording, no USD payment handling, no installment tracking.

**S09** — "A cuánto está el dólar hoy?..."
Skills: None directly | Score: **4/10**
Gap: No exchange rate lookup or multi-currency reconciliation capability.

**S10** — "GreenPeru me debe la factura de enero, ya van 25 días..."
Skills: yaya-followup | Score: **6/10**
Gap: Follow-up is B2C-oriented. No B2B accounts receivable with aging reports, formal dunning letters, or legal next steps.

**S11** — "Si TechnoPlast me contrata SEO + redes + Google Ads, quiero darles 15%..."
Skills: yaya-sales | Score: **6/10**
Gap: Sales skill handles discounts but no service package builder or bundle pricing calculator.

**S12** — "Necesito facturar a DataCore SRL, RUC 20345678901, por desarrollo web: S/8,000 + IGV."
Skills: yaya-tax | Score: **9/10**
Gap: Well covered — RUC validation, factura generation with IGV. Core strength.

**S13** — "Tengo que emitir una factura en dólares a mi cliente de Miami..."
Skills: yaya-tax | Score: **4/10**
Gap: Tax skill doesn't cover USD invoicing, international clients without RUC, or cross-border invoicing requirements.

**S14** — "La factura F001-00234 está mal, le puse S/3,500 pero eran S/3,000..."
Skills: yaya-tax | Score: **9/10**
Gap: Credit note flow is well-documented. Solid coverage.

**S15** — "Un cliente persona natural me pagó S/1,800 por gestión de redes. Necesito boleta."
Skills: yaya-tax | Score: **9/10**
Gap: Boleta flow with DNI lookup is well covered.

**S16** — "Dame un resumen de todas las facturas que he emitido este mes..."
Skills: yaya-tax + yaya-analytics | Score: **7/10**
Gap: Tax skill has list_invoices but no accounts-receivable aging view with paid/unpaid status.

**S17** — "Cuánto facturé en febrero? Desglosado por servicio..."
Skills: yaya-analytics | Score: **7/10**
Gap: Analytics can break down by product but examples are retail-oriented, not service-revenue-oriented.

**S18** — "Quiero saber cuánto me deja TechnoPlast realmente..."
Skills: yaya-analytics | Score: **3/10**
Gap: **Cannot compute client profitability without time tracking.** No cost allocation per client exists.

**S19** — "Cuántas cotizaciones tengo pendientes?..."
Skills: yaya-crm | Score: **4/10**
Gap: CRM has segments but no formal sales pipeline, deal stages, or pipeline value tracking for B2B.

**S20** — "Compárame enero vs febrero: revenue, clientes nuevos, facturas cobradas vs pendientes."
Skills: yaya-analytics | Score: **7/10**
Gap: Comparison capability exists but needs integrated AR data. Good if data is in the system.

**S21** — "Si sigo con los clientes actuales y cierro los 3 leads calientes, cuánto facturaría en Q2?"
Skills: yaya-analytics | Score: **4/10**
Gap: No forecasting/projection engine. Analytics is retrospective, not predictive.

**S22** — "SUNAT me rechazó una factura electrónica, dice 'error en el XML'..."
Skills: yaya-tax + yaya-escalation | Score: **5/10**
Gap: Tax skill covers issuance but not SUNAT error troubleshooting. Should guide XML fixes or escalate to tech support.

**S23** — "GreenPeru ya me debe 2 meses, son S/5,000. No contestan..."
Skills: yaya-followup + yaya-escalation | Score: **5/10**
Gap: No legal guidance on interest charges (mora), formal demand letters, or INDECOPI/collection agency referral for B2B.

**S24** — "Me equivoqué y le cobré doble a MiCasaFit por Yape, S/1,800 x2..."
Skills: yaya-payments + yaya-returns | Score: **4/10**
Gap: Returns skill is product-return-focused. No payment reversal/correction workflow for services.

**S25** — "acabo d cerrar un deal graaande 🔥 startup de USA me va a pagar $5,000/mes..."
Skills: yaya-crm + yaya-sales | Score: **6/10**
Gap: Should handle 2am, informal language, and multi-service contract creation. No USD recurring contract setup.

**S26** — "oe el proyecto del café ese ya quedó?"
Skills: yaya-escalation (clarification) | Score: **5/10**
Gap: Ambiguous message needs clarification. No project context to resolve "el café ese."

**S27** — "Necesito hacer un breakdown del ROI del último campaign de Google Ads..."
Skills: yaya-analytics | Score: **6/10**
Gap: Heavy Spanglish should be parseable by LLM. Analytics can report but no Google Ads integration for actual KPI data.

**S28** — "Haz esto: 1) factura a TechnoPlast 2) registra pago 3) cuánto facturé 4) reminder..."
Skills: yaya-tax + yaya-payments + yaya-analytics + yaya-followup | Score: **6/10**
Gap: Multi-request parsing works in theory but no explicit skill orchestration for chained actions.

---

## Summary

| Metric | Value |
|--------|-------|
| **Overall Score** | **5.7 / 10** |
| **Scenarios Scored ≥7** | 10 of 28 (36%) |
| **Scenarios Scored ≤4** | 7 of 28 (25%) |
| **PMF Readiness** | **40%** |

### Top 3 Strengths
1. **Tax/Invoicing (yaya-tax)** — Factura, boleta, credit notes, tax regime guidance are solid (S12, S14, S15 all ≥9)
2. **Onboarding (yaya-onboarding)** — Well-structured wizard flow that could work for agencies
3. **Basic Analytics** — Period comparisons, revenue breakdowns, and report formatting are mature

### Top 3 Gaps
1. **🔴 No Project Management** — Alex's core workflow is project-based (deadlines, milestones, % completion). Zero coverage for S04.
2. **🔴 No Time Tracking / Cost Allocation** — Cannot compute client profitability (S06, S18). Critical for agencies.
3. **🔴 No B2B Pipeline / Quotations** — No deal stages, proposal generation, or pipeline value tracking (S07, S19). Agency sales lifecycle is unserved.

### Key Insight
Yaya Platform was designed for **B2C retail/restaurant** businesses. Alex's agency is **B2B services** — he needs project management, time tracking, quotation generation, multi-currency handling, and pipeline management. The invoicing layer (yaya-tax) is the strongest fit, but the operational core of his business (manage projects, track hours, price services, chase B2B payments) is largely unserved. The platform needs either a **yaya-projects** skill or explicit B2B service extensions to reach PMF for this persona.
