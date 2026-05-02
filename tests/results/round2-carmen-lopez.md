# Round 2 Evaluation: Carmen López — Salón Bella Cali (3 Sedes)

**Evaluator:** Yaya Platform Test Engine  
**Date:** 2026-03-21  
**Focus:** Colombia market fit, multi-location service business, Peru-centric gaps

---

## Scenario Evaluations

### Core Business (S01–S07)

**S01** — "Oiga Yaya, ventas de hoy en Granada: $2,800,000..." — **Score: 6/10**  
yaya-sales can register sales, yaya-analytics can track by location. Multi-sede breakdown is conceptually supported via multi-warehouse. Gap: no explicit multi-location P&L structure. Payment split (Nequi/efectivo/datáfono) needs 3 payment methods — datáfono not in skill list. Currency shows S/ not COP $.

**S02** — "Mija agende cita para mañana: Sra. Martínez, tinte + corte + brushing..." — **Score: 8/10**  
yaya-appointments is the strongest skill for Carmen. Multi-service booking, provider selection (Paola), multi-location slots all supported. Duration combination (tinte+corte+brushing) handled. Price estimate included. Strong fit.

**S03** — "Cuántas citas hay mañana en cada sede?" — **Score: 7/10**  
yaya-appointments has daily schedule view per provider. Multi-location view would need aggregation across 3 "provider groups" (sedes). Gap: no consolidated multi-sede dashboard in a single view.

**S04** — "Hice extensiones a la Sra. Duarte: $850,000..." — **Score: 7/10**  
yaya-sales handles high-value service registration. Split payment (mitad Nequi mitad efectivo) supported conceptually. Good fit.

**S05** — "Compré a L'Oréal Professionnel: 20 tintes... 10 shampoos... 5 tratamientos..." — **Score: 5/10**  
No purchasing/procurement skill. yaya-inventory tracks stock levels but doesn't process purchase orders or supplier management. Bancolombia transfer payment for purchases not tracked. 🚨 **GAP: No purchasing skill**

**S06** — "Calcúleme las comisiones: Paola vendió $2,400,000..." — **Score: 4/10**  
No payroll/commission calculation skill. yaya-analytics could theoretically compute 35% of each stylist's sales, but commission management, payment tracking to employees, and nómina are absent. This is Carmen's weekly core task. 🚨 **GAP: No payroll/commission skill**

**S07** — "Otra clienta que no llegó a la cita!! $250,000..." — **Score: 7/10**  
yaya-appointments has no-show tracking, repeat offender flagging, and penalization discussion. Good coverage. Gap: no automatic no-show policy enforcement or deposit collection.

### Pricing & Payments (S08–S12)

**S08** — "Oiga Nequi otra vez con problemas!! 5 clientas..." — **Score: 6/10**  
yaya-payments can suggest alternative payment methods (efectivo, datáfono). Nequi outage handling is practical advice, not technical. Gap: no Nequi status API integration; datáfono not explicitly in payment methods list.

**S09** — "Los tintes subieron 20% de costo. Si cobraba $120,000..." — **Score: 6/10**  
yaya-analytics could do margin math. But no cost-based repricing tool. The calculation (cost up 20%, maintain 55% margin → new price) is simple math the LLM can do, but systematic price update across services isn't automated.

**S10** — "Paquete Novia: maquillaje + peinado + manicure + pedicure..." — **Score: 7/10**  
yaya-appointments handles multi-service packages. Price bundling with discount is basic math. yaya-sales can create combo products. Good fit.

**S11** — "Cuánto estoy vendiendo en productos para el pelo al mes?" — **Score: 7/10**  
yaya-analytics can segment by product category (services vs retail products). Product sales analysis supported.

**S12** — "Siento que Chipichape no me rinde. Arriendo $4,500,000/mes..." — **Score: 5/10**  
yaya-analytics has revenue reporting but no expense tracking per location. Rent, utilities, staff costs not captured. Profitability by sede needs expense data that no skill collects. 🚨 **GAP: No expense/P&L tracking**

### Invoicing / DIAN (S13–S16)

**S13** — "Factura para Eventos Glamour SAS, NIT 901.999.888-7..." — **Score: 1/10**  
yaya-tax is 100% SUNAT/Peru. No DIAN factura electrónica. No NIT validation. No IVA 19% on services. Complete fail for Colombian B2B invoicing. 🚨 **CRITICAL FAIL — PERU-ONLY**

**S14** — "Las estilistas... contrato vs prestación de servicios. Retefuente?" — **Score: 1/10**  
Retefuente on service contracts, Colombian labor law (contrato vs prestación de servicios), and independent contractor invoicing requirements are all absent. No Colombian employment/tax knowledge. 🚨 **CRITICAL FAIL**

**S15** — "Declaración bimestral. Consolidado de ventas 3 sedes, IVA cobrado vs compras..." — **Score: 1/10**  
IVA bimestral declaration is DIAN-specific. yaya-tax only handles PDT 621 (SUNAT Peru). No IVA descontable calculation for Colombia. No consolidated multi-sede tax reporting. 🚨 **CRITICAL FAIL**

**S16** — "Casi todo me pagan por Nequi pero no emito factura..." — **Score: 2/10**  
Tax compliance gap analysis is a good concept but yaya-tax can't assess Colombian obligations. Can't calculate unfactured revenue exposure under DIAN rules. Could flag the risk generically but not quantify it.

### Scheduling (S17–S19)

**S17** — "Paola no puede venir viernes. Quién la cubre?" — **Score: 6/10**  
yaya-appointments has provider schedule management. Cross-location coverage (Diana from Ciudad Jardín to Granada) is conceptually possible if providers are configured across sedes. Gap: no staff availability/shift management skill.

**S18** — "Día de la madre... recuérdame 3 semanas antes..." — **Score: 7/10**  
yaya-followup and Hermes cron handle scheduled reminders. Pre-event preparation checklist is a good use case. Colombia celebrates Día de la Madre on the second Sunday of May (different from some countries). Skill would need Colombian holiday calendar.

**S19** — "Capacitación de mechas balayage... primer domingo del mes..." — **Score: 6/10**  
yaya-appointments can schedule events. Recurring scheduling (first Sunday monthly) needs cron. Cost tracking ($800,000) for training as business expense not captured.

### Analytics (S20–S22)

**S20** — "Cuál sede vende más? Granada, Ciudad Jardín, Chipichape? Ranking..." — **Score: 6/10**  
yaya-analytics can rank by location if multi-warehouse/multi-location tagging is properly configured. Revenue comparison supported. Margin calculation needs expense data (see S12 gap).

**S21** — "Qué servicio es el más pedido? Y cuál deja más plata por hora?" — **Score: 6/10**  
Service popularity from yaya-analytics (top products). Revenue per hour per service is a derived metric that needs service duration data from yaya-appointments + revenue from yaya-analytics. Cross-skill calculation partially supported.

**S22** — "Cuántas clientas repiten mes a mes? Tasa de retorno por sede?" — **Score: 6/10**  
yaya-crm has retention/segmentation concepts (regular, at-risk, dormant). Per-sede retention analysis needs location tagging on interactions. Conceptually possible but not explicitly built.

### Escalation (S23–S25)

**S23** — "Diana renunció y va a abrir su propio salón..." — **Score: 4/10**  
yaya-escalation handles human handoff but this is an HR/legal issue. No knowledge of Colombian non-compete clauses (cláusula de no competencia), labor law, or client retention strategies post-staff departure. 🚨 **GAP: No HR/legal skill**

**S24** — "Una clienta tuvo reacción alérgica al tinte!!" — **Score: 6/10**  
yaya-escalation correctly identifies this as safety-critical for immediate human handoff. No liability/insurance guidance (póliza de responsabilidad civil). Gap: no incident documentation template, no ARL/EPS guidance for Colombian health system. 🚨 **PARTIAL: needs Colombian health/liability context**

**S25** — "Me están desapareciendo productos de Ciudad Jardín. $1,200,000..." — **Score: 4/10**  
yaya-inventory can show discrepancies. yaya-escalation can flag. But internal theft investigation, employee management, and Colombian labor law for disciplinary processes are absent. No loss prevention skill.

### Edge Cases (S26–S30)

**S26** — "Gringa quiere pagar en dólares... $550,000 pesos en USD? Zelle?" — **Score: 3/10**  
No multi-currency support. No Zelle integration (US-based payment rail). FX conversion not in any skill. International client payment is unsupported. 🚨 **GAP**

**S27** — "Amiga de Pereira quiere franquicia. Cuánto cobro?" — **Score: 3/10**  
Franchise consulting is far outside platform scope. No business expansion or franchise skill. Would need pure LLM knowledge + human handoff.

**S28** — "Clientas piden servicio a domicilio. Cuánto cobro extra?" — **Score: 5/10**  
yaya-appointments could add "domicilio" as a service variant with surcharge. No home-service logistics (stylist routing, travel time, extra supplies). Partially addressable.

**S29** — "Secadora hizo cortocircuito en Chipichape!!" — **Score: 6/10**  
yaya-escalation handles safety-critical with immediate human handoff. Good urgency detection. Gap: no electrical safety protocol knowledge, no ARL (Administradora de Riesgos Laborales) guidance specific to Colombia.

**S30** — "Compré tinte L'Oréal a proveedor nuevo más barato. Empaque diferente..." — **Score: 5/10**  
yaya-escalation can flag safety concern and stop usage. Good instinct for human handoff. Gap: no INVIMA (Colombian health/cosmetics regulatory body) guidance. Peru would reference DIGEMID; Colombia uses INVIMA. 🚨 **PERU-CENTRIC if regulatory body referenced**

---

## Summary

| Metric | Value |
|--------|-------|
| **Overall Score** | **4.9/10** |
| **PMF Readiness (Colombia)** | **30%** |

### Top 3 Strengths
1. **Appointment management** — yaya-appointments is the strongest skill for Carmen's business. Booking, rescheduling, no-show tracking, multi-provider, and calendar sync all fit a salon perfectly.
2. **Customer relationship management** — yaya-crm handles client preferences, retention tracking, and segmentation well for a service business with repeat clients
3. **Safety escalation** — Critical incidents (allergic reaction, electrical issue, counterfeit products) correctly trigger human handoff with appropriate urgency

### Top 3 Gaps
1. 🚨 **Tax/invoicing is 100% Peru (SUNAT)** — DIAN, IVA 19%, NIT, retefuente on service contracts, IVA bimestral declaration all missing. 4/4 invoicing scenarios fail completely.
2. 🚨 **No payroll/commission management** — Carmen's 15 employees with mixed contracts (fijo + comisión + prestación de servicios) need commission calculation, nómina tracking, seguridad social, parafiscales. Zero coverage.
3. 🚨 **No multi-location P&L / expense tracking** — Carmen can't answer "is Chipichape profitable?" because no skill tracks rent, utilities, or operating expenses by sede. Revenue-only analytics mislead.

### Additional Peru-Centric Flags
- Consumer protection: SIC (Colombia) not INDECOPI (Peru)
- Health regulatory: INVIMA (Colombia) not DIGEMID (Peru)
- Labor/ARL system: Colombian ARL/EPS not Peruvian EsSalud
- Payment rails: Datáfono widely used in salons but not in payment methods
- Holidays: Colombian holidays differ (Día de la Madre on 2nd Sunday May, etc.)

### Key Insight
**Carmen is the best-fit persona for yaya-appointments**, which is the most complete skill. Her salon booking workflows are 70-80% covered. But everything around the appointment — paying employees, tracking expenses, tax compliance, multi-sede profitability — falls apart. The platform excels at customer-facing interactions but lacks back-office operations. For Colombia specifically, the salon industry has specific DIAN obligations (IVA on services, retefuente on contractors) that are completely unaddressed. **A "salon vertical" package combining appointments + Colombian tax + commission payroll would make this persona viable.**
