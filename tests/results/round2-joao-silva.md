# Round 2 Evaluation — João Silva (Açaí do João, São Paulo)

**Evaluator:** Yaya Platform Test Engine
**Date:** 2026-03-21
**Persona:** João Silva, 33, açaí franchise owner (2 units), São Paulo SP
**Revenue:** R$600K/yr | Team: 6 | Channels: Loja física, iFood, Rappi, WhatsApp

---

## Scenario Evaluations

### Core Business (Vendas e Produtos)

**#1** "Mano, quanto de polpa de açaí a gente tem no estoque da Vila Madalena?" — **Score: 5/10**
yaya-inventory can check stock levels, but is configured for single-warehouse ERPNext. João needs **multi-warehouse** (Vila Madalena + Pinheiros) with kg-based perishable tracking. Skill has no spoilage/expiry date awareness. All examples/UI in Spanish.

**#2** "E aí, me dá o total de vendas de hoje das duas lojas" — **Score: 5/10**
yaya-analytics can generate daily summaries, but all templates are in Spanish with S/ currency. Would need PT-BR localization. Multi-store aggregation + per-store breakdown is conceptually supported but examples only show single-store.

**#3** "Tá ligado aquele bowl premium novo que a gente lançou?" — **Score: 6/10**
yaya-analytics "Specific Product Performance" flow covers this well. Gap: language (Spanish), currency (S/ not R$), and no concept of "new product launch tracking" with date-bounded analysis.

**#4** "Mano registra aí uma encomenda: a empresa XYZ quer 15 litros" — **Score: 5/10**
yaya-sales can create orders, but bulk/corporate encomendas with delivery fee logic aren't well covered. The skill would escalate to owner for bulk orders (BULK_ORDER_THRESHOLD), which defeats the purpose. No B2B order template.

**#5** "O fornecedor mandou msg dizendo que a polpa vai atrasar 2 dias" — **Score: 3/10**
yaya-inventory has stock levels but NO supply chain / supplier delay impact analysis. Can't calculate "days of stock remaining at current burn rate across 2 locations." Critical gap for perishable inventory management.

### Pricing & Payments

**#6** "Me faz as contas: açaí de 500ml a R$22,90 no iFood e eles cobram 27%" — **Score: 4/10**
yaya-analytics has margin analysis, but NO marketplace commission calculator (iFood/Rappi fees). The platform doesn't model delivery platform economics at all. Payment methods reference Yape/Plin, not Pix. **Critical Brazil gap: no iFood/Rappi integration.**

**#7** "Quanto entrou de Pix hoje?" — **Score: 2/10**
yaya-payments is built for Yape/Plin screenshot OCR validation. **Pix is completely absent from the platform.** No Pix reconciliation, no Pix receipt parsing, no integration with Brazilian banks. This is the #1 payment method in Brazil (70% of João's sales).

**#8** "Quero fazer uma promo no Rappi: açaí 300ml por R$12,90" — **Score: 3/10**
yaya-analytics can calculate margins but has no Rappi/iFood promo simulation. Can't model "volume uplift vs margin compression" for marketplace promotions. No marketplace integration whatsoever.

**#9** "Uma cliente quer pagar metade Pix metade cartão" — **Score: 3/10**
yaya-payments supports partial payments conceptually but only for Yape/Plin/bank transfer. **No Pix support, no maquininha/card payment tracking.** Split payment across different rails is not modeled.

**#10** "Resumo dos pagamentos da semana: Pix, cartão, dinheiro, iFood e Rappi" — **Score: 3/10**
yaya-analytics has payment method breakdown but only tracks Yape/Plin/transferencia. **Missing: Pix, cartão (maquininha), dinheiro, iFood repasse, Rappi repasse.** Brazil payment mix is completely different.

### Invoicing (Nota Fiscal)

**#11** "Preciso emitir nota fiscal pra aquela encomenda da empresa XYZ" — **Score: 1/10**
yaya-tax is 100% Peru/SUNAT-centric. Uses facturas/boletas, RUC/DNI, IGV 18%, PDT 621. **Brazil uses NF-e/NFC-e/NFS-e, CNPJ/CPF, ICMS/ISS/PIS/COFINS, Simples Nacional, SEFAZ.** Completely incompatible. Would need total rewrite.

**#12** "Quantas NFC-e a gente emitiu essa semana na loja de Pinheiros?" — **Score: 1/10**
NFC-e is a Brazilian-specific document type. yaya-tax has zero awareness of Brazilian fiscal documents. No SEFAZ integration, no NFC-e/NF-e distinction.

**#13** "O contador tá pedindo o total de NFs emitidas em fevereiro" — **Score: 1/10**
Same fundamental gap. yaya-tax can list invoices but only SUNAT facturas/boletas. No Brazilian nota fiscal support at all.

**#14** "Um cliente quer nota fiscal de uma compra e a gente esqueceu de emitir" — **Score: 1/10**
Brazilian retroactive NFC-e emission has specific SEFAZ rules. yaya-tax only knows about SUNAT comunicação de baja. Completely mismatched.

### Analytics

**#15** "Ranking dos 5 produtos mais vendidos do mês nas duas lojas" — **Score: 5/10**
yaya-analytics has "Top Products" capability. Multi-store comparison is partially supported. Gap: Portuguese language, R$ currency, and the per-store comparison view (Vila Madalena vs Pinheiros) isn't templated.

**#16** "Ticket médio por canal: Loja física vs iFood vs Rappi vs WhatsApp" — **Score: 3/10**
yaya-analytics doesn't model sales channels beyond WhatsApp. **No iFood/Rappi channel tracking.** Can't segment by delivery platform vs physical store vs WhatsApp encomendas.

**#17** "Qual loja tá performando melhor esse mês?" — **Score: 4/10**
Multi-location comparison is mentioned in yaya-analytics but not deeply modeled. Could work with multi-warehouse ERPNext setup, but no templated multi-store dashboard.

**#18** "Horário de pico de vendas por dia da semana" — **Score: 6/10**
yaya-analytics "best day of the week" example maps well here. Peak hour analysis is supported via postgres-mcp. Gap: language, and no integration with iFood/Rappi peak data.

**#19** "Quanto de desperdício a gente teve esse mês?" — **Score: 2/10**
yaya-inventory has NO waste/spoilage tracking. For a perishable food business, this is critical. No expiry-based loss calculation, no waste categorization (expired, damaged, etc.).

### Escalation

**#20** "URGENTE, o freezer da Vila Madalena quebrou!" — **Score: 4/10**
yaya-escalation can detect urgency and notify the owner. But the actual request (calculate freezer capacity at another location, coordinate emergency transfer) requires inventory + logistics skills that don't exist. Would escalate but can't solve.

**#21** "Tomei avaliação 1 estrela no iFood dizendo açaí derretido e com formiga" — **Score: 3/10**
yaya-escalation handles complaints. But **no iFood review management integration.** Can't pull iFood review data, can't help contest/respond through iFood's system. Would need marketplace reputation management.

**#22** "Um funcionário não apareceu e o outro quer sair mais cedo" — **Score: 2/10**
**No workforce/scheduling skill exists.** yaya-appointments is customer-facing. No staff scheduling, shift management, or contingency planning for employee no-shows.

**#23** "O iFood mudou a taxa de comissão sem avisar, tá vindo 30%" — **Score: 2/10**
No marketplace commission tracking. Can't pull historical iFood/Rappi commission data. Would need a marketplace analytics integration that doesn't exist.

### Edge Cases

**#24** "Cliente quer comprar 50 litros pra revender. Preço de atacado?" — **Score: 4/10**
yaya-sales has bulk order escalation. Could calculate minimum price with margin data. But no wholesale pricing tier system, no reseller management.

**#25** "Pensando em abrir terceira loja na Mooca. Projeção de break-even?" — **Score: 3/10**
yaya-analytics has trend data but no business expansion modeling. No break-even calculator, no rent-vs-revenue projection tool. Would need financial planning skill.

**#26** "Recebi um Pix de R$892 e não sei de quem é" — **Score: 1/10**
**Pix reconciliation is completely absent.** This is João's #1 pain point. yaya-payments only handles Yape/Plin screenshot matching. No Pix bank statement reconciliation.

**#27** "Quero lançar açaí de pitaya. Qual preço pra manter margem de 60%?" — **Score: 5/10**
yaya-analytics/inventory can calculate pricing from cost basis. The margin calculation logic is transferable. Gap: no recipe/BOM (bill of materials) for food products.

**#28** "Fiz evento de degustação e dei 200 amostras grátis. Como registro?" — **Score: 2/10**
yaya-inventory can adjust stock but has no concept of marketing expense vs inventory loss classification. No accounting categorization logic.

**#29** "Rappi quer que eu entre num programa de fidelidade deles" — **Score: 3/10**
Could do basic math (10% discount vs 25% volume increase) but no marketplace program ROI modeling. No historical Rappi data to validate the "25% more orders" claim.

**#30** "Recebi intimação da vigilância sanitária pedindo documentação de procedência" — **Score: 1/10**
**No ANVISA/vigilância sanitária compliance support.** No supplier documentation management, no certificate/laudo tracking. Critical for food businesses in Brazil.

---

## Summary

| Metric | Value |
|--------|-------|
| **Overall Score** | **3.1 / 10** |
| **PMF Readiness for Brazil** | **~15%** |

### Top 3 Strengths
1. **Analytics foundation is solid** — yaya-analytics has good report templates and trend analysis that could be adapted to PT-BR
2. **Escalation detection is language-agnostic** — frustration/urgency signals transfer across languages
3. **Inventory stock check basics work** — ERPNext-based stock queries are functional if configured for multi-warehouse

### Top 3 Gaps
1. **🚨 Zero Pix support** — Pix is 70% of João's payments and the platform doesn't know it exists. Yape/Plin are Peru-only. This alone makes the platform unusable.
2. **🚨 Tax system is 100% Peru (SUNAT)** — NF-e/NFC-e, CNPJ, ICMS, Simples Nacional, DAS — none of this exists. The entire yaya-tax skill needs a Brazilian counterpart.
3. **🚨 No marketplace integration (iFood/Rappi)** — 47% of João's revenue comes through delivery apps. No commission tracking, no review management, no promo modeling.

### Key Insight
João's business lives at the intersection of **Pix payments + iFood/Rappi delivery + nota fiscal paulista + perishable inventory** — all four are completely absent from the platform. The platform was built for Peruvian retail (Yape payments, SUNAT invoicing, walk-in customers). For a São Paulo açaí franchise, it would need a near-complete localization layer: PT-BR language, Brazilian payment rails (Pix, maquininhas), SEFAZ tax integration, iFood/Rappi APIs, and perishable inventory management. The core architecture (ERPNext + CRM + MCP) is sound, but the localization work is massive.
