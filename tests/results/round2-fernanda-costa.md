# Round 2 Evaluation — Fernanda Costa (Clínica Bella, Belo Horizonte)

**Evaluator:** Yaya Platform Test Engine
**Date:** 2026-03-21
**Persona:** Fernanda Costa, 37, aesthetic clinic owner, Savassi, BH, MG
**Revenue:** R$850K/yr | Team: 5 | Channels: WhatsApp (60%), Instagram (25%), referrals (15%)

---

## Scenario Evaluations

### Core Business (Agendamento e Serviços)

**#1** "Uai, me mostra a agenda de amanhã?" — **Score: 7/10**
yaya-appointments handles daily schedule views well, with multi-provider support (Fernanda + biomédica + dermatologista). Gap: language is Spanish, and the appointment templates reference "Dra. Sofía / Dr. Méndez" patterns. Core logic works; needs PT-BR localization.

**#2** "Dona Márcia quer harmonização mas tem histórico de alergia" — **Score: 4/10**
yaya-crm stores customer history and preferences, but **no clinical prontuário (patient record) system.** Allergy alerts, contraindication checks, and medical history tracking are critical for aesthetics but absent. CRM tracks purchase history, not medical history.

**#3** "Registrar procedimento: botox em 3 áreas, lote BTX-2026-0234" — **Score: 2/10**
**No procedure recording skill exists.** yaya-appointments books appointments but doesn't record what was done (units injected, areas treated, product lot numbers). This is mandatory for ANVISA traceability. Critical missing capability.

**#4** "Quantas sessões de laser CO2 a gente fez esse mês?" — **Score: 5/10**
yaya-analytics can count by "product/service" if procedures are recorded as sales items. But without a proper procedure recording system, the data source is unreliable. Would need procedure → analytics pipeline.

**#5** "Paciente pedindo protocolo completo do tratamento pra levar pra outro médico" — **Score: 2/10**
**No clinical report generation.** yaya-crm has interaction logs but not structured medical treatment history. LGPD (Brazil's data protection law) requires patient data portability. Platform has no awareness of LGPD requirements.

### Pricing & Payments

**#6** "Harmonização R$4.800 parcelar em 12x no cartão. Quanto líquido depois da Stone?" — **Score: 3/10**
yaya-payments doesn't model **card machine fees (maquininha Stone/PagSeguro)**. No installment simulation (12x with MDR fees, net receivable calculations). Platform only knows Yape/Plin/bank transfer. Brazilian maquininha economics are completely absent.

**#7** "Total que entrou de Pix hoje?" — **Score: 2/10**
Same Pix gap as João. **No Pix reconciliation.** Fernanda receives 40% via Pix — platform can't track any of it.

**#8** "Pacote harmonização + 3 sessões radiofrequência por R$5.800 vs separado R$6.150" — **Score: 5/10**
yaya-sales has bundle pricing logic. Could calculate margin on package deal vs individual. Gap: no service-specific cost model (insumo cost per procedure type), language.

**#9** "Pagar metade Pix, restante em 3x no cartão. Total R$2.500" — **Score: 2/10**
Split payment across Pix + installment card is not supported. yaya-payments handles partial payments but only for Yape/bank. No Pix, no card installment tracking.

**#10** "Quanto gastei em insumos vs quanto faturei. Margem acima de 65%?" — **Score: 4/10**
yaya-analytics has revenue reporting. yaya-inventory tracks stock. But **no cost-of-goods-sold by procedure type.** Can't calculate: "Botox costs R$400 in product per session, I charge R$1,200, margin = 67%." Needs procedure-level P&L.

### Invoicing (Nota Fiscal)

**#11** "Emitir NFS-e pra paciente corporativa, CNPJ 23.456.789/0001-12" — **Score: 1/10**
**NFS-e (Nota Fiscal de Serviço Eletrônica) is Brazilian municipal tax.** yaya-tax only knows SUNAT/Peru. NFS-e requires integration with BH's prefeitura system (BH ISS Digital), specific service codes (CNAE), ISS calculation. Completely absent.

**#12** "Quantas NFS-e emiti esse mês? Total de ISS?" — **Score: 1/10**
No Brazilian ISS tracking. yaya-tax calculates IGV (Peru). ISS rates vary by municipality and service code. BH has specific rates for aesthetic services. Zero support.

**#13** "Esqueci de emitir nota de R$2.800 da semana passada, retroativo?" — **Score: 1/10**
Brazilian NFS-e retroactive emission rules depend on municipal legislation (BH has specific rules). yaya-tax knows SUNAT deadlines, not Brazilian municipal fiscal rules.

**#14** "Contador pedindo relatório por código de serviço: estética facial, corporal, depilação" — **Score: 1/10**
Service code classification (CNAE/LC 116) for Brazilian tax purposes is completely absent. yaya-tax uses Peruvian service codes for SUNAT.

### Analytics

**#15** "Ranking de procedimentos mais lucrativos: receita + margem líquida" — **Score: 4/10**
yaya-analytics can rank by revenue. But **margin by procedure requires cost-per-procedure data** (product cost + provider time + overhead allocation) that isn't modeled. Partial support.

**#16** "Taxa de retorno das pacientes: botox, quantas voltaram pra reaplicar em 6 meses?" — **Score: 5/10**
yaya-crm tracks customer return visits. yaya-analytics can calculate retention by product/service. This maps reasonably well, though language and service-specific retention logic (botox lasts 4-6 months → expected return window) isn't built in.

**#17** "Comparação trimestre vs anterior: receita, atendimentos, ticket médio" — **Score: 6/10**
yaya-analytics period comparison is well-built. Templates work for this. Gap: PT-BR language, R$ currency, and "atendimentos" instead of "pedidos."

**#18** "Horário e dia da semana que mais agenda? E que mais tem no-show?" — **Score: 6/10**
yaya-appointments tracks no-shows. yaya-analytics has day-of-week analysis. Combined, this scenario is reasonably well-served. Gap: language.

**#19** "Perfil das pacientes: faixa etária, procedimentos por faixa, ticket médio" — **Score: 4/10**
yaya-crm captures customer data but **doesn't collect age/demographic data systematically.** No demographic segmentation beyond spend-based tiers. Would need age capture during registration.

### Escalation

**#20** "URGENTE! Paciente com reação adversa ao preenchimento — lote do ácido hialurônico AGORA" — **Score: 3/10**
yaya-escalation detects urgency and notifies owner. But **no adverse event protocol,** no product lot traceability for ANVISA reporting, no emergency medical procedure lookup. For a regulated clinic, this is dangerously insufficient. Would need pharmacovigilance integration.

**#21** "Notificação da ANVISA pedindo rastreabilidade de lotes de toxina botulínica" — **Score: 1/10**
**ANVISA compliance is completely absent.** No lot tracking for regulated products, no traceability reports, no ANVISA notification response workflow. yaya-inventory tracks stock quantities, not regulatory lot data. This is a legal requirement for aesthetic clinics.

**#22** "Paciente postou review negativo no Google dizendo botox não durou" — **Score: 4/10**
yaya-escalation handles complaints. yaya-crm has customer history. Could pull treatment history to compose a factual response. Gap: no Google My Business integration, response has to be done manually.

**#23** "Clínica do lado anunciando botox por R$499. Me ajuda a montar análise de valor" — **Score: 5/10**
yaya-analytics can pull cost data. Could help compose value proposition (product quality, certification, guarantee). This is more of a consulting/advisory capability — the platform can provide data but the "story" needs human input.

### Edge Cases

**#24** "Paciente menor de idade (17 anos) quer limpeza de pele. Mãe autorizou por WhatsApp" — **Score: 2/10**
**No legal compliance for minors.** No awareness of Brazilian Código de Defesa do Consumidor, ECA (Estatuto da Criança e do Adolescente), or ANVISA rules for aesthetic procedures on minors. WhatsApp authorization may not be legally sufficient — needs formal consent.

**#25** "Fornecedor mandou lote com validade de só 45 dias, normalmente 6 meses" — **Score: 3/10**
yaya-inventory can calculate usage rate. But **no expiry date tracking for regulated products.** Can't compare "45 days shelf life vs average consumption rate" automatically. No ANVISA short-dated product protocols.

**#26** "Paciente quer trocar botox por crédito pra outro procedimento" — **Score: 4/10**
yaya-returns has store credit capability. Could adapt to service credit. Gap: post-procedure services can't be "returned" — this is a credit swap, not a return. Needs service-specific credit logic.

**#27** "Maquininha Stone parou. 3 pacientes hoje que iam pagar cartão" — **Score: 3/10**
yaya-payments could suggest Pix as alternative (if it supported Pix). No maquininha status tracking, no backup payment method contingency. Would need to guide to: Pix, link de pagamento, or manual card processing.

**#28** "Paciente estrangeira americana quer pagar em dólar" — **Score: 2/10**
No multi-currency support. No USD→BRL conversion. yaya-payments only handles PEN (Peruvian sol). Brazilian tax implications of foreign currency receipts (IOF, câmbio) are completely outside scope.

**#29** "Programa de fidelidade: a cada 5 sessões, 6ª tem 30% desconto" — **Score: 3/10**
yaya-crm can track visit count. But **no loyalty program engine.** Can't model revenue impact of "30% discount every 6th visit." Would need: average visit value × frequency × discount impact calculation.

**#30** "Dermatologista parceira quer sair e levar agenda de pacientes" — **Score: 3/10**
yaya-appointments tracks provider assignments. yaya-crm has customer data. Could query "patients seen only by Dr. X vs shared." Gap: no formal provider-patient attribution system, no data portability workflow for departing providers.

---

## Summary

| Metric | Value |
|--------|-------|
| **Overall Score** | **3.0 / 10** |
| **PMF Readiness for Brazil** | **~12%** |

### Top 3 Strengths
1. **Appointment scheduling core is strong** — yaya-appointments handles multi-provider booking, no-show tracking, reminders, and rescheduling well. Best skill match for Fernanda's business.
2. **Customer retention analytics are useful** — return visit tracking, segment analysis, and period comparison can provide real value for a clinic.
3. **Escalation detection works cross-language** — urgency keywords and behavioral signals translate to Portuguese contexts.

### Top 3 Gaps
1. **🚨 No clinical records / prontuário** — An aesthetic clinic MUST track: procedures performed, products used (with lots), patient medical history, allergies, contraindications, before/after photos. None of this exists. This is both an ANVISA requirement and core to the business.
2. **🚨 No ANVISA compliance** — Regulated products (toxina botulínica, ácido hialurônico) require lot traceability, supplier documentation, and adverse event reporting. The platform has zero awareness of Brazilian health regulations.
3. **🚨 No Brazilian payment rails** — No Pix (40% of revenue), no maquininha/Stone integration (45% of revenue via card installments). Only 15% of Fernanda's revenue (dinheiro + some débito) could conceivably work, and even that poorly.

### Key Insight
Fernanda's clinic sits at the nexus of **healthcare regulation (ANVISA) + municipal tax (NFS-e/ISS) + installment card payments (Stone 12x) + clinical records (prontuário)**. The platform handles exactly one of her core needs well: appointment scheduling. Everything else — clinical documentation, regulatory compliance, Brazilian tax, payment processing — is either completely missing or Peru-specific. The regulatory gap is especially concerning: a clinic handling botox and fillers without ANVISA-compliant lot tracking could face serious legal consequences. For Brazilian aesthetics, the platform needs: (1) clinical records module, (2) ANVISA traceability, (3) NFS-e integration with BH prefeitura, (4) Pix + Stone maquininha payments, and (5) LGPD compliance for patient data.
