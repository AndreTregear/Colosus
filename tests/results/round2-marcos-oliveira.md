# Round 2 Evaluation — Marcos Oliveira (TechMais, Recife)

**Evaluator:** Yaya Platform Test Engine
**Date:** 2026-03-21
**Persona:** Marcos Oliveira, 46, electronics retail + repair shop, Boa Viagem, Recife PE
**Revenue:** R$400K/yr | Team: 4 | Channels: Loja física (70%), WhatsApp (20%), OLX (10%)

---

## Scenario Evaluations

### Core Business (Vendas e Assistência Técnica)

**#1** "Oxe meu rei, quantos celulares usados eu tenho no estoque?" — **Score: 5/10**
yaya-inventory can list stock by product and variants. But **used/refurbished products with individual condition grades** aren't modeled. Each used phone is unique (condition, battery health, scratches). ERPNext serialized inventory could work but skill doesn't account for per-item condition descriptions.

**#2** "Registra ordem de serviço: Galaxy S23, trocar tela, Seu Antônio" — **Score: 2/10**
**No service order (OS) management skill exists.** yaya-appointments books time slots; yaya-sales creates product orders. But a repair service order needs: customer device info, problem description, diagnosis, parts required, estimated cost, deadline, and status tracking (received → diagnosed → waiting parts → repaired → ready). This is Marcos's core business and it's completely absent.

**#3** "Quantas ordens de serviço abertas? Quantas atrasadas?" — **Score: 1/10**
Without an OS management system, there's no way to track open/overdue repair orders. This is Marcos's #1 pain point (currently using a paper notebook). Complete gap.

**#4** "Vendi 2 fones, 5 películas, 1 carregador. Cliente pagou dinheiro" — **Score: 5/10**
yaya-sales can create orders and yaya-inventory can deduct stock. Cash payment recording works conceptually. Gap: language (Spanish), currency (S/ not R$), and cash register reconciliation isn't modeled.

**#5** "Seu Carlos veio buscar notebook da formatação. Quanto era?" — **Score: 2/10**
Without OS tracking, can't look up service details, pricing, or payment status for a specific repair job. Would need to search through sales/payment records which aren't structured for service lookups.

**#6** "Lista de aparelhos prontos pra retirada. Mandar WhatsApp pra essa galera" — **Score: 2/10**
No OS status tracking → can't generate "ready for pickup" list. yaya-notifications could send bulk messages IF it had the list, but the data source doesn't exist.

### Pricing & Payments

**#7** "Comprei 10 iPhones 12 usados por R$800 cada, vender a R$1.350. Lucro com 6% Simples?" — **Score: 4/10**
yaya-analytics can do margin calculations. But **Simples Nacional tax calculation is absent** (platform uses Peru tax). DAS calculation with Anexo I rates for commerce isn't modeled. Could do gross margin but not net after Brazilian taxes.

**#8** "Quanto entrou de dinheiro hoje? Conferir caixa" — **Score: 3/10**
yaya-payments tracks payment entries but **cash register management is weak.** No daily cash drawer tracking, no opening/closing balance, no cash discrepancy analysis. Cash is 25% of Marcos's sales.

**#9** "Smartwatch R$699, parcelar 6x no cartão. Taxa da PagSeguro?" — **Score: 3/10**
yaya-payments doesn't model **maquininha fees (PagSeguro/Stone)**. No installment simulation with MDR (merchant discount rate). Can't calculate: R$699 ÷ 6 = R$116.50/parcela, minus PagSeguro 4.99% = R$664.16 net. Brazil card payment economics are absent.

**#10** "Resumo pagamentos da semana: Pix, dinheiro, cartão" — **Score: 3/10**
yaya-analytics has payment breakdown but tracks Yape/Plin/transferencia. **Missing Pix (45%), dinheiro (25%), cartão PagSeguro (30%).** All three of Marcos's payment methods are unsupported.

**#11** "Cliente quer trocar celular velho como parte do pagamento de um novo" — **Score: 2/10**
**No trade-in / permuta system.** Used device valuation, trade-in credit against new purchase, and resulting fiscal treatment (NFC-e for the sale, how to account for the trade-in) are completely absent.

### Invoicing (Nota Fiscal)

**#12** "Emitir NFC-e de todas as vendas de hoje. 8 vendas no varejo" — **Score: 1/10**
**NFC-e (Nota Fiscal de Consumidor Eletrônica)** is Brazilian. yaya-tax only supports SUNAT/Peru. No SEFAZ integration, no NFC-e batch emission, no ICMS calculation for Pernambuco.

**#13** "Emitir NFS-e do serviço de troca de tela. CPF 123.456.789-01" — **Score: 1/10**
NFS-e for services requires Recife municipal system integration. CPF validation (not RUC/DNI). ISS calculation for repair services. None of this exists.

**#14** "Contador reclamando que tô misturando NFC-e e NFS-e" — **Score: 1/10**
**Dual fiscal regime (ICMS + ISS) in the same business** is Marcos's #1 accounting pain point. The platform has zero concept of: commerce = NFC-e/ICMS vs services = NFS-e/ISS, let alone separating them. yaya-tax only handles Peru's single IGV system.

**#15** "Vendi celular usado R$1.350, cliente não quer nota. Sou obrigado?" — **Score: 1/10**
Brazilian mandatory NFC-e emission rules (above R$200 or any request) aren't known to the platform. Can't advise on Brazilian fiscal obligations. In Brazil, yes — NFC-e is mandatory for retail above threshold regardless of customer request.

### Analytics

**#16** "O que é mais rentável: varejo ou assistência técnica?" — **Score: 3/10**
yaya-analytics can segment revenue but **can't separate product sales from service revenue** without an OS system feeding service data. Would need: product P&L vs service P&L with different cost structures (COGS vs labor + parts).

**#17** "Top 10 produtos mais vendidos esse mês" — **Score: 5/10**
yaya-analytics top products ranking works. Standard capability. Gap: language, currency, and used/refurbished items may not be categorized properly (each is unique).

**#18** "Tempo médio que aparelho fica na assistência" — **Score: 1/10**
Without OS tracking, can't calculate repair turnaround time. This metric requires: intake date → completion date → pickup date per service order. No data source exists.

**#19** "Compara vendas desse mês com mês passado" — **Score: 5/10**
yaya-analytics period comparison is well-built. Works for this. Gap: PT-BR language, R$ currency, and retail vs service split.

**#20** "Ticket médio varejo vs serviços" — **Score: 3/10**
Same issue as #16 — can't cleanly separate retail and service transactions without an OS system. Partial capability if sales are tagged by type.

### Escalation

**#21** "Cliente reclamando que tela trocada já tá com defeito. Registro da OS e fornecedor da peça" — **Score: 2/10**
yaya-escalation detects the complaint and notifies owner. But **can't pull OS details, parts used, or supplier info** because no OS system exists. The critical context (which screen was used, from which supplier, warranty terms) is missing.

**#22** "Acho que estoquista tá sumindo com mercadoria. Histórico de movimentação" — **Score: 4/10**
yaya-inventory tracks stock via ERPNext which has stock movement ledgers. Could show: "15 registered, 12 sold, 0 returned, 3 unaccounted." This actually works if ERPNext is properly configured. Gap: language, and alerting for inventory shrinkage patterns.

**#23** "Prefeitura mandou fiscal pedindo NFS-e e NFC-e dos últimos 3 meses" — **Score: 1/10**
Can't generate Brazilian fiscal documents or compile them for inspection. yaya-tax only stores SUNAT invoices. **A fiscal inspection in Brazil requires SPED (Sistema Público de Escrituração Digital) compliance.** Completely absent.

### Edge Cases

**#24** "Cliente trouxe celular pra reparo sem nota fiscal. Se for roubado?" — **Score: 1/10**
Brazilian law (Código Penal art. 180 — receptação) requires businesses to verify provenance of devices. Some states require a service order to include IMEI and customer ID. **No legal compliance for device intake.** Platform has no awareness of Brazilian criminal/civil liability for repair shops.

**#25** "12 aparelhos abandonados há mais de 60 dias. Posso vender?" — **Score: 1/10**
Brazilian Código de Defesa do Consumidor and local regulations govern abandoned property in repair shops. Usually requires: notification attempt, 90-day wait, formal registry. **Platform has no abandoned device workflow or legal guidance.**

**#26** "Cliente comprou fone ontem, quer devolver hoje. Caixa aberta" — **Score: 5/10**
yaya-returns handles return requests well. CDC (Código de Defesa do Consumidor) gives 7 days for online/phone purchases (arrependimento), but in-store purchases don't have mandatory return unless defective. The skill's 7-day default aligns with online returns. Gap: Brazilian CDC distinction between in-store vs remote purchases.

**#27** "Montar 3 combos: celular + película + capinha + carregador" — **Score: 5/10**
yaya-sales has bundle pricing logic. yaya-inventory can check stock for components. Could calculate margin per combo tier. Reasonably well-supported. Gap: language.

**#28** "Comprar 50 capinhas por R$8, revender a R$39. Vale a pena?" — **Score: 5/10**
Basic margin and annual revenue calculation. yaya-analytics can model: (R$39 - R$8) × 30/month × 12 = R$11,160/yr gross. Gap: doesn't account for Simples Nacional tax, storage cost, or cash flow timing.

**#29** "Técnico quer virar MEI em vez de CLT. Quanto economizo? Risco?" — **Score: 1/10**
**No labor/HR compliance skill.** CLT vs MEI/PJ analysis involves: FGTS, INSS, férias, 13º, rescisão costs vs PJ fee + MEI limitations. Also legal risk of "pejotização" (disguised employment relationship). Brazilian labor law is completely outside scope.

**#30** "Internet caiu, não consigo emitir nota nem passar cartão. 5 vendas pendentes" — **Score: 2/10**
yaya-tax mentions offline scenarios for SUNAT (not Brazil). Brazilian NFC-e has **contingência offline** (NFC-e em contingência) procedures via SEFAZ. Platform doesn't know this. Could advise to register sales manually and emit later, but without Brazilian fiscal knowledge, advice would be generic.

---

## Summary

| Metric | Value |
|--------|-------|
| **Overall Score** | **2.7 / 10** |
| **PMF Readiness for Brazil** | **~10%** |

### Top 3 Strengths
1. **Inventory tracking basics work** — Stock levels, movement history, and shrinkage detection via ERPNext are functional. Best fit for Marcos's retail side.
2. **Returns handling is reasonable** — yaya-returns flow (damage photos, refund processing, store credit) translates to Marcos's context, though CDC specifics are missing.
3. **Product bundling and margin analysis** — Combo pricing, bulk purchase ROI, and top-seller analytics provide real value for a retail operation.

### Top 3 Gaps
1. **🚨 No Service Order (OS) management** — This is Marcos's CORE business (40% of revenue). Repair intake, diagnosis, parts tracking, status updates, customer notification on completion, turnaround analytics — all absent. Without this, the platform serves only half his business.
2. **🚨 Dual fiscal regime (NFC-e + NFS-e) is unsupported** — Marcos must emit NFC-e for product sales (ICMS) AND NFS-e for repair services (ISS). The platform doesn't support either Brazilian document type, let alone the complexity of mixed-regime Simples Nacional (Anexo I for commerce, Anexo III for services).
3. **🚨 No Pix or Brazilian payment rails** — 45% Pix, 25% cash, 30% card (PagSeguro) — none of these are modeled. Cash register management is weak. PagSeguro maquininha fees for installments are absent.

### Key Insight
Marcos represents the hardest localization challenge: a **hybrid retail + service business** with dual tax obligations, serialized inventory (unique used devices), a paper-based repair workflow crying for digitization, and complex Brazilian fiscal requirements. The platform's biggest miss is the **absence of any service order/repair management system** — this would be the #1 value driver for electronics repair shops across Brazil. The fiscal complexity (NFC-e for ICMS products + NFS-e for ISS services, both under Simples Nacional with different Anexos) is also far beyond what yaya-tax handles. For Marcos's business type, the platform would need: (1) full OS management system with status tracking and customer notifications, (2) serialized/unique-item inventory for used devices, (3) NFC-e + NFS-e with Simples Nacional DAS calculation, (4) Pix + PagSeguro integration, (5) trade-in/permuta workflow, and (6) abandoned device management per Brazilian law.
