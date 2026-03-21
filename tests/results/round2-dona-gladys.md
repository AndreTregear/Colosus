# Round 2 Evaluation — Doña Gladys Paredes (Pollería Huancayo)

**Evaluator:** Yaya Platform Test Engine
**Date:** 2026-03-21
**Persona:** Gladys Paredes, 58, "Pollería La Serranita" — Pollo a la brasa, family-run, S/180K/yr, RUS regime

---

## Scenario Evaluations

**S01** — "ola buenas tardes me dijeron q esto ayuda para el negocio yo tengo mi polleria..."
Skills: yaya-onboarding + yaya-voice | Score: **7/10**
Gap: Onboarding flow works, but needs extreme simplification for low-tech users. Should default to voice and skip jargon.

**S02** — "oy dia vendi 45 pollos enteros y 20 medios pollos mas las salchipapas..."
Skills: yaya-sales + yaya-analytics | Score: **7/10**
Gap: Can record sales, but requires bulk daily summary entry — no quick "end-of-day batch input" mode.

**S03** — "cuantos pollos me quedan oy? xq ya son las 6 y nose si me alcanza asta las 9"
Skills: yaya-inventory | Score: **6/10**
Gap: Inventory skill is SKU-based (retail). Perishable/daily inventory (buy morning, sell by night) needs different logic.

**S04** — "me estan pidiendo 3 pollos enteros con papas y gaseosa grande para la av huancavelica 456..."
Skills: yaya-sales | Score: **8/10**
Gap: Order creation + delivery address works well. Need time-slot promise ("para las 7") and delivery queue management.

**S05** — "compre en el mercado 50 pollos a 14 soles cada uno y 2 sacos de papa a 80 soles..."
Skills: yaya-inventory | Score: **6/10**
Gap: Can record purchases but no daily cost tracking flow. Should compute "costo del día" automatically from market purchases.

**S06** — "ay hijita se me quemo 5 pollos oy dia el carbon estaba muy fuerte..."
Skills: yaya-inventory (shrinkage) | Score: **5/10**
Gap: No explicit shrinkage/waste tracking. Could log a negative stock adjustment but no waste category, no loss reporting.

**S07** — "cuanto es el pollo entero con papas y ensalada pues? y si pido 2 me aces descuento?"
Skills: yaya-sales | Score: **8/10**
Gap: Price lookup is strong. Discount handling depends on business rules config — needs owner-defined policy.

**S08** — "me pagaron por yape 68 soles el combo familiar pero nose si ya me llego la plata..."
Skills: yaya-payments | Score: **6/10**
Gap: Payments skill validates screenshots but Doña Gladys's real problem is checking if Yape received the money — no Yape balance/notification verification.

**S09** — "oy dia me entro plata efectivo como 850 soles y yape creo q 230 soles..."
Skills: yaya-analytics | Score: **7/10**
Gap: Can total cash+Yape. But this is really a "cuadre de caja" (cash register reconciliation) — no dedicated cash management flow.

**S10** — "un señor me pago con billete de 200 soles x un cuarto de pollo de 18 soles..."
Skills: None directly | Score: **3/10**
Gap: **No cash management skill.** Change management, float recommendations, and denomination tracking are common microenterprise needs.

**S11** — "el pollo subio a 15 soles por unidad en el mercado antes era 12..."
Skills: yaya-analytics + yaya-inventory | Score: **7/10**
Gap: Can calculate margin impact and suggest new price. Good analytical use case — needs input cost vs. menu price modeling.

**S12** — "un señor me pide su boleta son 2 pollos enteros con todo 136 soles..."
Skills: yaya-tax | Score: **7/10**
Gap: Boleta flow works, but Doña Gladys uses manual talonario (paper), not electronic. Skill assumes electronic invoicing which she doesn't have.

**S13** — "me dijeron q si vendo mas de 8000 soles al mes la sunat me pasa a otro regimen..."
Skills: yaya-tax | Score: **8/10**
Gap: Tax skill covers RUS limits and regime transitions well. Should reassure with specific numbers (RUS Cat. 2 limit = S/8,000/month).

**S14** — "ya se me esta acabando el talonario de boletas me queda como 20 nomas..."
Skills: yaya-tax (partial) | Score: **4/10**
Gap: Skill tracks electronic boletas, not paper talonarios. No physical boleta inventory tracking exists.

**S15** — "me piden factura pues pero yo no doy factura solo boleta le digo q no puedo..."
Skills: yaya-tax | Score: **9/10**
Gap: Excellent case — RUS businesses can't issue facturas. Skill should explain this clearly and confirm she's right.

**S16** — "hijita cuanto gane este mes? xq siento q trabaje un monton pero la plata no alcanza"
Skills: yaya-analytics | Score: **6/10**
Gap: Analytics can show revenue but she needs profit = revenue - costs (pollos, gas, carbon, alquiler, staff). No expense tracking.

**S17** — "en febrero vendi mas o menos q en enero?..."
Skills: yaya-analytics | Score: **7/10**
Gap: Period comparison exists. Needs data in the system first — cold start problem if she just started.

**S18** — "cual es mi mejor dia de venta? yo creo q es domingo..."
Skills: yaya-analytics | Score: **8/10**
Gap: Day-of-week analysis is well-supported. Strong fit.

**S19** — "quiero saber cuanto gasto en pollos y cuanto me queda limpio..."
Skills: yaya-analytics | Score: **5/10**
Gap: Needs expense tracking to compute true profit. Analytics only sees sales side, not cost side comprehensively.

**S20** — "este domingo es dia de la madre cuantos pollos debo comprar?..."
Skills: yaya-analytics + yaya-inventory | Score: **5/10**
Gap: No demand forecasting for special events. Analytics is retrospective. Needs historical event data + prediction.

**S21** — "el señor del mercado me vendio pollos feos oy dia flaquitos y chiquitos..."
Skills: yaya-escalation (guidance) | Score: **5/10**
Gap: No supplier management skill. Should advise on quality control, alternative suppliers, negotiation. Escalation is customer-facing.

**S22** — "carlitos se demoro mucho con el delivery y el cliente me llamo enojado..."
Skills: yaya-returns + yaya-escalation | Score: **7/10**
Gap: Returns handles refund, escalation handles handoff. But no delivery management (tracking Carlitos, ETAs, route optimization).

**S23** — "se malogro un horno y el otro nomas esta funcionando..."
Skills: yaya-escalation | Score: **4/10**
Gap: **No operational crisis management.** Needs to help prioritize orders, estimate capacity, and suggest triage actions for kitchen emergencies.

**S24** — "oy dia la caja no cuadra me faltan 45 soles..."
Skills: yaya-analytics | Score: **4/10**
Gap: No cash register reconciliation or shrinkage investigation workflow. Should help identify where money was lost.

**S25** — "ya pues anotame... [ruido] ...40 pollos pa mañana..."
Skills: yaya-voice + yaya-inventory | Score: **7/10**
Gap: Voice transcription should handle noise. Skill should parse partial instructions and confirm: "¿40 pollos para mañana y 5 sacos de carbón?"

**S26** — "la señora del 2do piso quiere lo de siempre"
Skills: yaya-crm | Score: **5/10**
Gap: CRM can store preferences but "lo de siempre" requires robust repeat-order recognition. No regular customer shortcut system.

**S27** — "oy dia vendi 52 pollos creo y me pagaron yape como 400 soles y el alquiler me subieron..."
Skills: yaya-analytics + yaya-inventory + yaya-payments | Score: **6/10**
Gap: Multi-topic parsing works but needs to triage: sales recording, expense recording, and financial planning as separate actions.

**S28** — "ya me stoy yendo al mercado cuantos pollos compro oy? es miercoles"
Skills: yaya-analytics + yaya-inventory | Score: **5/10**
Gap: Needs purchase recommendation engine based on day-of-week sales patterns. Currently no "smart purchase" guidance.

---

## Summary

| Metric | Value |
|--------|-------|
| **Overall Score** | **6.1 / 10** |
| **Scenarios Scored ≥7** | 12 of 28 (43%) |
| **Scenarios Scored ≤4** | 4 of 28 (14%) |
| **PMF Readiness** | **52%** |

### Top 3 Strengths
1. **Tax/Compliance (yaya-tax)** — RUS regime guidance, boleta vs factura rules, SUNAT limits perfectly match her fears and needs (S13, S15)
2. **Voice-First (yaya-voice)** — Critical for Doña Gladys who sends audios and has spelling errors. Voice transcription + voice reply is the #1 UX enabler.
3. **Basic Sales & Analytics** — Daily sales recording, day-of-week analysis, period comparisons are useful and match her "cuaderno" replacement need (S02, S07, S18)

### Top 3 Gaps
1. **🔴 No Expense/Cost Tracking** — She doesn't know her profit because she can't input costs (pollos, carbón, gas, alquiler, staff). Analytics only sees revenue. Blocks S06, S16, S19.
2. **🔴 No Cash Management** — 70% of her business is cash. No cuadre de caja, float management, change tracking, or shrinkage investigation (S10, S24).
3. **🔴 No Demand Forecasting / Purchase Guidance** — Her biggest operational problem is "how many pollos do I buy tomorrow?" Needs day-of-week + seasonal + event-based predictions (S20, S28).

### Key Insight
Doña Gladys is **closer to PMF** than Alex because Yaya's core skills (sales, payments, tax, voice) map better to a B2C restaurant. Her adoption barrier is **simplicity and trust**, not feature gaps. However, the three critical gaps — cost tracking, cash management, and purchase forecasting — are exactly the tools that would make her go from "this is interesting" to "I can't live without this." She needs to answer one question every night: **"¿Cuánto gané hoy?"** — and Yaya can't answer that yet because it only sees revenue, not costs. A lightweight **yaya-expenses** skill (daily market purchases + fixed costs) would unlock the single most valuable metric for her business.
