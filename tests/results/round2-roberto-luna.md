# Round 2 Evaluation: Roberto Luna — Taller Mecánico "Taller Luna" (Guadalajara)

**Evaluator:** Yaya Platform Test Suite  
**Date:** 2026-03-21  
**Focus:** Mexico market fit, Peru-centric gaps, platform readiness

---

## Scenario Evaluations

### Core Business (Scenarios 1-5)

**S1: "Me acaba de traer un señor su Jetta 2018 para afinación mayor..."** — Score: 6/10  
yaya-sales can register a service order with customer + vehicle + price. ERPNext handles service items. No vehicle-specific data model (make/model/year/plates), so it's treated like a generic product order.

**S2: "Ya no me acuerdo cuántos carros tengo pendientes..."** — Score: 7/10  
yaya-inventory + yaya-analytics can list open orders/jobs. ERPNext tracks order status. Works well for the "what's pending" query if data is entered consistently.

**S3: "Nissan Sentra 2020 y le truena la suspensión..."** — Score: 7/10  
yaya-sales can build a quote from the service price list. Suspension repair is listed at $2,500-$5,000. Can present a range to the customer. No vehicle diagnostic intelligence.

**S4: "Ya quedó la camioneta del señor Hernández..."** — Score: 7/10  
yaya-sales handles order completion + payment registration. Cash payment logging works. Straightforward close-out flow.

**S5: "El Chuy es el que sabe de clutches..."** — Score: 4/10  
No mechanic/technician assignment module. yaya-appointments handles provider scheduling for customer-facing bookings, not internal job assignment. Would need manual notes.

### Pricing & Payments (Scenarios 6-10)

**S6: "Para el cambio de radiador del Civic ocupo comprar el radiador..."** — Score: 6/10  
yaya-sales can register parts + labor as line items. The 15-25% markup on parts is a business rule that could be configured. No auto-lookup of Autozone prices.

**S7: "El ingeniero Martínez me depositó $8,000 por SPEI..."** — Score: 2/10  
🚨 **PERU-CENTRIC FAIL.** yaya-payments cannot validate SPEI transfers. Only Yape/Plin/BCP Peru screenshots supported. Partial payment (abono) concept exists but Mexican bank verification is absent.

**S8: "El licenciado Gutiérrez me debe $3,200 desde hace un mes..."** — Score: 6/10  
yaya-followup can set payment reminders. yaya-crm tracks outstanding balances. Basic accounts receivable functionality exists though not specifically designed for it.

**S9: "Don Pepe viene conmigo desde hace 15 años..."** — Score: 7/10  
yaya-sales handles discounts. yaya-crm recognizes VIP/loyal customers. Applying a $300 discount to a known loyal customer is a supported flow.

**S10: "Hoy sábado le toca al Chuy $4,500..."** — Score: 3/10  
🚨 **NO PAYROLL.** No nómina skill. Can do the math ($4,500 + $3,800 + $4,000 + $3,500 = $15,800) but no payroll tracking, no cash disbursement records, no ISR retention for informal workers. Critical for a business with 4 informal employees.

### Invoicing (Scenarios 11-14)

**S11: "La aseguradora GNP me pide factura..."** — Score: 1/10  
🚨 **PERU-CENTRIC FAIL.** Cannot generate CFDI. GNP's RFC validation, CFDI 4.0 with correct uso de CFDI, forma de pago, método de pago — all absent. yaya-tax only speaks SUNAT.

**S12: "Radio Taxi Guadalajara quiere una sola factura mensual..."** — Score: 1/10  
🚨 **PERU-CENTRIC FAIL.** Consolidated monthly CFDI is a SAT-specific process with its own rules (factura global, complemento de pagos). Completely unsupported.

**S13: "La factura tiene error en el uso de CFDI..."** — Score: 1/10  
🚨 **PERU-CENTRIC FAIL.** CFDI correction requires nota de crédito + re-emission with correct c_UsoCFDI catalog code. yaya-tax only knows SUNAT's comunicación de baja. Mexican corrective invoicing process absent.

**S14: "Me pide factura de un trabajo de hace 2 meses..."** — Score: 1/10  
🚨 **PERU-CENTRIC FAIL.** SAT rules on retroactive CFDI emission (can be done within the fiscal year with the correct fecha de emisión vs fecha de expedición) are not known. yaya-tax has no SAT knowledge.

### Analytics (Scenarios 15-19)

**S15: "Cuánto me entró este mes y cuánto gasté..."** — Score: 6/10  
yaya-analytics provides income/expense summaries IF data is entered. The "cuánto me quedó limpio" question is core P&L. Works if Roberto actually logs everything (big if, since he uses a cuaderno).

**S16: "¿Qué es lo que más me traen? ¿Afinaciones o frenos?"** — Score: 6/10  
yaya-analytics can rank services by frequency. Product performance reporting applies to services too. Requires consistent data entry.

**S17: "¿Quiénes son mis mejores clientes?"** — Score: 7/10  
yaya-crm excels here. Customer segmentation, VIP identification, purchase history — this is a core CRM capability. Can generate a list for December WhatsApp greetings.

**S18: "¿Este mes fue mejor que el pasado?"** — Score: 7/10  
yaya-analytics has period-over-period comparison as a demonstrated capability. Month vs month with revenue, orders, and growth percentage.

**S19: "¿Cuánto llevo gastado en refacciones este mes?"** — Score: 5/10  
Expense tracking by category (refacciones) requires purchases to be categorized. Possible but depends on how consistently parts purchases are logged.

### Escalation (Scenarios 20-22)

**S20: "Un señor dice que le cambié las balatas hace 3 semanas..."** — Score: 6/10  
yaya-crm can look up service history. yaya-returns handles complaints. The warranty lookup requires the original work order to be in the system. General dispute resolution guidance works.

**S21: "Al Ramiro le cayó una pieza en el pie..."** — Score: 3/10  
🚨 **MEXICO GAP.** No IMSS/riesgo de trabajo knowledge. Ramiro is informal (no IMSS), which means Roberto is personally liable. No understanding of Mexican labor law for informal workers, no guidance on Ley Federal del Trabajo Art. 123 obligations. yaya-escalation flags urgency but gives no actionable legal/medical guidance.

**S22: "Hay un Chevy en el taller desde hace 2 meses..."** — Score: 3/10  
🚨 **MEXICO GAP.** Abandoned vehicle in a taller requires knowledge of Mexican civil code (derecho de retención), notarial procedures, and potentially REPUVE. No legal module exists. Can only escalate.

### Edge Cases (Scenarios 23-30)

**S23: "Le dije $12,000 pero van $18,000 en refacciones..."** — Score: 6/10  
yaya-sales can update order amounts. The communication advice (how to tell the client) is LLM-general knowledge. Order modification workflow exists.

**S24: "Un señor quiere pagar en 4 quincenas..."** — Score: 5/10  
yaya-payments supports partial payments/abonos. No formal installment plan module with tracking, but manual abono registration per payment works.

**S25: "Se me olvidó anotar los trabajos del martes y miércoles..."** — Score: 6/10  
yaya-sales can backfill orders. The "reconstruct from memory" flow works — agent can create past-dated entries. This actually solves Roberto's #1 pain point (the cuaderno problem).

**S26: "Además de la afinación le cambie el aceite..."** — Score: 7/10  
yaya-sales handles multi-line orders. Adding services to an existing order is a standard ERPNext capability. Clean flow.

**S27: "¿Cuánto tiempo de garantía doy en mis trabajos?"** — Score: 4/10  
yaya-returns has return policies but no service warranty module. Automotive service warranties are different from retail returns. No taller-specific warranty framework.

**S28: "El taller de 2 cuadras está cobrando la afinación a $1,800..."** — Score: 6/10  
yaya-analytics can provide competitive pricing advice. Value-based selling guidance (quality, experience, guarantee) is good LLM territory. No market data integration.

**S29: "Cliente quiere refacciones originales en su BMW..."** — Score: 4/10  
No parts catalog integration (Autozone, refaccionarias). Can't quote original BMW parts pricing. Manual research needed. Margin calculation works once prices are known.

**S30: "Saqué $5,000 de la caja para un gasto personal..."** — Score: 5/10  
Can register as owner's draw/retiro personal. yaya-analytics can track it as non-business expense. Important for the "no sabe cuánto gana" pain point — separating personal from business.

---

## Summary

| Metric | Value |
|--------|-------|
| **Overall Score** | **4.5/10** |
| **PMF Readiness (Mexico)** | **~25%** |

### Top 3 Strengths
1. **CRM for customer relationships** — Roberto's loyal clients (Don Pepe, 15 years) can be tracked, VIP-tagged, and remembered. This directly solves his "everything is in my head" problem.
2. **Order/job tracking replaces the cuaderno** — Registering work orders, tracking pending jobs, and looking up history is exactly what Roberto needs. Digital backup of his notebook.
3. **Period-over-period analytics** — "Was this month better than last?" is answered cleanly. Revenue tracking and expense comparison help Roberto finally know if he's making money.

### Top 3 Gaps
1. 🚨 **Tax/invoicing is 100% Peru** — CFDI generation for GNP, Radio Taxi, corporate clients is completely impossible. 4 scenarios score 1/10. Roberto would lose corporate clients who require factura.
2. 🚨 **Payment verification is 100% Peru** — SPEI transfers (20% of Roberto's revenue) cannot be validated. No Mexican bank integration at all.
3. 🚨 **No payroll or labor law** — 6 employees (4 informal), weekly cash payments, IMSS obligations, workplace accident liability — zero support. This is Roberto's biggest legal risk.

### Key Insight
**Roberto is the hardest persona to convert because he distrusts technology.** The platform must be absurdly simple for him — and right now, it would fail on his very first corporate client asking for a CFDI. His "everything in the cuaderno" problem IS solvable by Yaya's order tracking, but the value proposition collapses when he can't invoice GNP, can't validate SPEI deposits, and can't manage his informal payroll. Roberto's adoption barrier is high to begin with (old-school, tech-skeptical), and early failures would permanently confirm his bias that "esas apps son para chamacos." The platform needs to nail the first 3 interactions or lose him forever.
