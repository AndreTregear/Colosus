# Round 3 Evaluation — Mexico + Brazil Personas

**Date:** 2026-03-21
**Evaluator:** Yaya Platform Test Framework
**Round:** 3 (post-P0 features)
**Previous Round:** R2 (baseline — skills only, no MCP servers or infrastructure)

---

## New Features Evaluated in R3

| # | Feature | Type | Key Capabilities |
|---|---------|------|-----------------|
| 1 | **yaya-expenses** | Skill | Chat-based expense tracking, P&L calculation, COGS, recurring expenses, receipt OCR, multi-currency, accountant export |
| 2 | **forex-mcp** | MCP Server | Real-time exchange rates (SBS/BCR/exchangerate-api), supports PEN/USD/EUR/MXN/BRL/COP/CNY/GBP/JPY |
| 3 | **yaya-fiados** | Skill | Informal credit tab tracking (cuaderno de fiados), partial payments, aging reports, culturally sensitive cobro reminders |
| 4 | **crm-mcp** | MCP Server | Contact management, interaction logging, customer history, segmentation (VIP/new/dormant/at_risk/debtors), deals pipeline |
| 5 | **whatsapp-mcp** | MCP Server | Outbound WhatsApp messaging — text, templates, images, documents, payment links, reminders, bulk send, scheduling |
| + | **schema.sql** | Infrastructure | Unified PostgreSQL schema: contacts, interactions, deals, appointments, expenses, fiados, payment_validations |

### Still NOT Implemented
- 🇲🇽 **SAT / CFDI** — Mexican tax invoicing (affects ~5 scenarios per Mexico persona)
- 🇧🇷 **NF-e / NFC-e / NFS-e** — Brazilian nota fiscal (affects ~3-4 scenarios per Brazil persona)
- 🇧🇷 **Pix integration** — Direct Pix payment validation/reconciliation
- 🇧🇷 **Portuguese language optimization** — Skills are Spanish-first; Portuguese users get functional but non-native UX

---

## MEXICO PERSONAS

---

### 1. Guadalupe Sánchez — Taquería La Güera (CDMX)

**R2 Score: 4.2/10 | R2 PMF: 20%**

#### Scenario-by-Scenario Evaluation

| # | Scenario | R2 | R3 | Changed? | What Helped |
|---|----------|----|----|----------|-------------|
| 1 | Registro ventas del día | 5 | 6 | ✅ | Expenses pairs with revenue for instant P&L |
| 2 | Compra Central de Abastos | 3 | 8 | ✅ | **yaya-expenses**: logs purchase by category, payment method, shows daily P&L impact |
| 3 | Costo del taco (COGS) | 3 | 8 | ✅ | **yaya-expenses COGS**: per-item cost breakdown, margin calculation |
| 4 | Pedido para evento | 5 | 6 | ✅ | **crm-mcp**: tracks client contact; **whatsapp-mcp**: sends confirmation |
| 5 | Merma del día | 3 | 7 | ✅ | **yaya-expenses**: quantifies loss as expense, shows margin impact |
| 6 | Uber Eats ventas | 4 | 7 | ✅ | **yaya-expenses**: tracks 30% commission + packaging as expense, shows real net |
| 7 | Stock de bebidas | 5 | 5 | — | Inventory was already partially covered |
| 8 | Subida de precios | 4 | 6 | ✅ | Expenses COGS shows cost increase impact on margins, data-driven pricing decision |
| 9 | SPEI verificación | 4 | 4 | — | Payment validation unchanged |
| 10 | Pago de nómina | 3 | 7 | ✅ | **yaya-expenses**: records payroll, recurring template for weekly nómina |
| 11 | Precio competitivo | 4 | 6 | ✅ | COGS data from expenses enables margin-aware pricing decisions |
| 12 | CoDi consulta | 3 | 3 | — | No change |
| 13 | CFDI para cliente | 2 | 2 | — | SAT/CFDI not implemented |
| 14 | Declaración mensual | 2 | 3 | — | Expenses data helps accountant prep but can't file |
| 15 | RESICO dudas | 2 | 2 | — | SAT/CFDI not implemented |
| 16 | IVA en alimentos | 2 | 2 | — | SAT/CFDI not implemented |
| 17 | Gastos deducibles | 2 | 3 | — | Expenses tracks purchases but can't assess deductibility without SAT |
| 18 | Turno de empleados | 4 | 4 | — | No change |
| 19 | Compra anticipada | 5 | 6 | ✅ | **whatsapp-mcp**: schedule_message for reminder |
| 20 | Inspección sanitaria | 4 | 4 | — | No change |
| 21 | Taco más vendido | 5 | 6 | ✅ | COGS data enriches "which taco is most profitable" |
| 22 | Sucursal comparativa | 5 | 6 | ✅ | Expenses P&L per sucursal |
| 23 | Horario pico | 5 | 5 | — | No change |
| 24 | Intoxicación masiva | 5 | 5 | — | Escalation unchanged |
| 25 | Robo en sucursal | 4 | 4 | — | No change |
| 26 | Empleado accidentado | 4 | 4 | — | No change |
| 27 | Turista paga en dólares | 2 | 7 | ✅ | **forex-mcp**: USD→MXN conversion, rate source, formatted output |
| 28 | Gas LP fuga | 6 | 6 | — | Safety-critical — correctly escalates |
| 29 | Extorsión | 5 | 5 | — | Safety-critical — no change |
| 30 | Delivery propio | 4 | 6 | ✅ | **whatsapp-mcp**: enables outbound order mgmt; expenses tracks delivery costs |

#### Summary — Guadalupe

| Metric | R2 | R3 | Delta |
|--------|----|----|-------|
| **Score** | 4.2/10 | **5.8/10** | +1.6 |
| **PMF %** | 20% | **38%** | +18pp |
| **Scenarios Changed** | — | **15/30** (50%) | — |

**Most Impactful Features:**
1. 🥇 **yaya-expenses** — Transforms her financial visibility. COGS per taco, P&L per sucursal, real margin after Uber Eats commissions. This is the #1 unlock.
2. 🥈 **forex-mcp** — Solves the gringo-paying-in-dollars scenario cleanly.
3. 🥉 **whatsapp-mcp** — Enables proactive communication for events, delivery, reminders.

**Remaining Gaps:**
- SAT/CFDI (5 scenarios = 17% of test suite) — completely blocks invoicing workflow
- Multi-location analytics (Coyoacán vs Universidad — needs explicit multi-branch support)
- Uber Eats/Rappi integration (no direct API connection for order sync)
- Employee scheduling/HR management

---

### 2. Roberto Luna — Taller Luna (Guadalajara)

**R2 Score: 4.5/10 | R2 PMF: 25%**

#### Scenario-by-Scenario Evaluation

| # | Scenario | R2 | R3 | Changed? | What Helped |
|---|----------|----|----|----------|-------------|
| 1 | Registrar trabajo nuevo | 5 | 6 | ✅ | **crm-mcp**: creates contact, logs interaction |
| 2 | Trabajos pendientes | 4 | 5 | ✅ | CRM interactions can track open jobs |
| 3 | Cotización para cliente | 5 | 5 | — | No change |
| 4 | Trabajo terminado | 4 | 7 | ✅ | **yaya-expenses**: logs payment; **crm-mcp**: logs completion interaction |
| 5 | Asignar trabajo | 4 | 4 | — | No change |
| 6 | Refacción aparte | 3 | 7 | ✅ | **yaya-expenses**: tracks purchase cost + margin on parts |
| 7 | Transferencia SPEI abono | 3 | 8 | ✅ | **yaya-fiados**: tracks partial payment, balance, history |
| 8 | Cobrar trabajo viejo | 3 | 8 | ✅ | **yaya-fiados**: aging report + **whatsapp-mcp**: cobro reminder |
| 9 | Descuento cliente viejo | 4 | 6 | ✅ | **crm-mcp**: identifies VIP/frequent segment, history |
| 10 | Pago a mecánicos | 3 | 7 | ✅ | **yaya-expenses**: records payroll (informal+formal), recurring |
| 11 | CFDI para empresa | 2 | 2 | — | SAT/CFDI not implemented |
| 12 | Factura para flotilla | 2 | 2 | — | SAT/CFDI not implemented |
| 13 | Problema con CFDI | 2 | 2 | — | SAT/CFDI not implemented |
| 14 | Cliente pide factura retrasada | 2 | 2 | — | SAT/CFDI not implemented |
| 15 | Cuánto gané este mes | 3 | 8 | ✅ | **yaya-expenses**: full P&L report — revenue minus expenses = profit |
| 16 | Trabajo más común | 5 | 6 | ✅ | CRM interaction type analysis |
| 17 | Clientes frecuentes | 4 | 8 | ✅ | **crm-mcp**: segment_customers("frequent") + contact list for WhatsApp |
| 18 | Comparar con mes anterior | 4 | 7 | ✅ | **yaya-expenses**: period-over-period P&L comparison |
| 19 | Gasto en refacciones | 3 | 8 | ✅ | **yaya-expenses**: expense by category "materiales" |
| 20 | Reclamo de cliente | 5 | 7 | ✅ | **crm-mcp**: customer history shows original work record |
| 21 | Accidente de mecánico | 4 | 4 | — | Escalation unchanged |
| 22 | Carro abandonado | 4 | 6 | ✅ | **crm-mcp**: interaction log; **whatsapp-mcp**: automated follow-ups sent |
| 23 | Trabajo más caro | 5 | 6 | ✅ | Expenses tracks cost overrun; CRM logs customer communication |
| 24 | Cliente pagar en abonos | 3 | 8 | ✅ | **yaya-fiados**: installment tracking, partial payments, balance |
| 25 | Registro atrasado | 4 | 6 | ✅ | **yaya-expenses**: accepts retroactive logging |
| 26 | Dos trabajos al mismo carro | 5 | 6 | ✅ | CRM tracks multiple interactions per contact |
| 27 | Garantía del trabajo | 5 | 6 | ✅ | **crm-mcp**: historical interaction lookup |
| 28 | Competencia bajó precios | 4 | 6 | ✅ | Expenses COGS shows real cost basis for pricing |
| 29 | Refacciones originales BMW | 4 | 5 | ✅ | Expenses tracks sourcing cost for margin calculation |
| 30 | Gasto personal | 3 | 7 | ✅ | **yaya-expenses**: logs withdrawal, separate personal vs business |

#### Summary — Roberto

| Metric | R2 | R3 | Delta |
|--------|----|----|-------|
| **Score** | 4.5/10 | **6.3/10** | +1.8 |
| **PMF %** | 25% | **42%** | +17pp |
| **Scenarios Changed** | — | **22/30** (73%) | — |

**Most Impactful Features:**
1. 🥇 **yaya-fiados** — This IS Roberto's cuaderno de rayas digitized. Tracks who owes, partial payments, aging, cobro reminders. Perfect cultural fit for a taller that extends credit on repairs.
2. 🥈 **yaya-expenses** — Replaces his libreta for financial tracking. For the first time he can answer "¿cuánto me quedó limpio?" with real numbers.
3. 🥉 **crm-mcp** — Customer history, frequent client identification, work records. Essential for a relationship-driven business.

**Remaining Gaps:**
- SAT/CFDI (4 scenarios = 13%) — blocks invoicing for corporate clients and flotillas
- Work order management — CRM interactions are a workaround but not a proper order-of-service system
- Parts supplier management / procurement
- Employee scheduling and formalization guidance

---

### 3. Ana Castañeda — Ana Beauty MX (Monterrey)

**R2 Score: 4.1/10 | R2 PMF: 22%**

#### Scenario-by-Scenario Evaluation

| # | Scenario | R2 | R3 | Changed? | What Helped |
|---|----------|----|----|----------|-------------|
| 1 | Stock sérums | 5 | 5 | — | Inventory was already covered |
| 2 | 3 kits WhatsApp | 4 | 6 | ✅ | **crm-mcp**: tracks customer; **whatsapp-mcp**: order confirmation |
| 3 | Mascarillas agotadas | 5 | 5 | — | Inventory reorder unchanged |
| 4 | Ventas por canal | 5 | 5 | — | Analytics unchanged |
| 5 | Pedido Saltillo + envío | 4 | 5 | ✅ | **whatsapp-mcp**: shipping confirmation to customer |
| 6 | Producto nuevo catálogo | 5 | 5 | — | No change |
| 7 | Depósitos SPEI | 4 | 4 | — | Payment validation unchanged |
| 8 | Oxxo Pay error | 3 | 3 | — | No change |
| 9 | Actualizar precio margen | 4 | 7 | ✅ | **yaya-expenses**: COGS + margin calculation with supplier cost increase |
| 10 | Comisiones MercadoLibre | 3 | 7 | ✅ | **yaya-expenses**: tracks commissions as expense category, shows real margin |
| 11 | Precio mayoreo | 4 | 6 | ✅ | COGS data from expenses helps calculate minimum viable discount |
| 12 | CFDI para clienta | 2 | 2 | — | SAT/CFDI not implemented |
| 13 | Cancelar/rehacer CFDI | 2 | 2 | — | SAT/CFDI not implemented |
| 14 | Facturas emitidas | 2 | 2 | — | SAT/CFDI not implemented |
| 15 | Diferencias SAT | 2 | 2 | — | SAT/CFDI not implemented |
| 16 | Retenciones ML + factura | 2 | 2 | — | SAT/CFDI not implemented |
| 17 | Top 5 productos | 5 | 6 | ✅ | Expenses margin data enriches product ranking |
| 18 | Ticket promedio por canal | 5 | 5 | — | Analytics unchanged |
| 19 | Tasa de recompra | 4 | 6 | ✅ | **crm-mcp**: customer history, repeat purchase analysis |
| 20 | Ventas YoY comparación | 5 | 5 | — | Analytics unchanged |
| 21 | Gasto envíos % ventas | 3 | 7 | ✅ | **yaya-expenses**: shipping costs tracked by category, % of revenue |
| 22 | Paquete abierto DHL | 4 | 6 | ✅ | **crm-mcp**: logs complaint interaction; **whatsapp-mcp**: sends resolution |
| 23 | ML pausó publicación | 4 | 4 | — | Platform-specific — no change |
| 24 | Publicación clonada | 4 | 4 | — | Platform-specific — no change |
| 25 | RFC genérico IVA | 2 | 2 | — | SAT/CFDI not implemented |
| 26 | Pago dividido | 4 | 5 | ✅ | CRM tracks split payment |
| 27 | Clienta gringa dólares | 2 | 7 | ✅ | **forex-mcp**: USD→MXN conversion, rate + formatted output |
| 28 | Merma envases dañados | 4 | 6 | ✅ | **yaya-expenses**: records loss, tracks for supplier claim |
| 29 | Devolución fuera plazo | 4 | 5 | ✅ | **crm-mcp**: customer history for relationship-aware decision |
| 30 | Buen Fin descuento | 5 | 5 | — | No change |

#### Summary — Ana

| Metric | R2 | R3 | Delta |
|--------|----|----|-------|
| **Score** | 4.1/10 | **5.5/10** | +1.4 |
| **PMF %** | 22% | **34%** | +12pp |
| **Scenarios Changed** | — | **14/30** (47%) | — |

**Most Impactful Features:**
1. 🥇 **yaya-expenses** — Unlocks real profitability per product after MercadoLibre commissions, shipping, packaging. Her #1 pain point.
2. 🥈 **crm-mcp** — Customer lifecycle tracking, repeat purchase analysis, complaint management.
3. 🥉 **whatsapp-mcp** — Outbound order confirmations and customer communication.

**Remaining Gaps:**
- SAT/CFDI (5 scenarios = 17%) — critical blocker for e-commerce
- MercadoLibre / MercadoPago API integration — no direct sync for orders, commissions, retenciones
- Instagram Shop integration
- Multi-channel inventory sync (her #3 pain point — still unresolved)
- DHL/Estafeta shipping label generation

---

## BRAZIL PERSONAS

> **Cross-cutting note for all Brazil personas:** The R3 features deliver real functional value (expenses, CRM, WhatsApp, forex), but there is a **language/localization gap**. Skills (yaya-expenses, yaya-fiados) are authored in Spanish with Peruvian examples (S/, soles, SUNAT, boleta). Brazilian users (R$, reais, NF-e, CNPJ) get the underlying infrastructure but not native-feeling UX. This limits the PMF improvement ceiling for Brazil.

---

### 4. João Silva — Açaí do João (São Paulo)

**R2 Score: 3.1/10 | R2 PMF: 15%**

#### Scenario-by-Scenario Evaluation

| # | Scenario | R2 | R3 | Changed? | What Helped |
|---|----------|----|----|----------|-------------|
| 1 | Estoque polpa açaí | 4 | 4 | — | Inventory unchanged |
| 2 | Total vendas duas lojas | 4 | 5 | ✅ | Expenses P&L can aggregate, but needs localization |
| 3 | Bowl premium vendas | 4 | 4 | — | Analytics unchanged |
| 4 | Encomenda empresa XYZ | 3 | 5 | ✅ | **crm-mcp**: tracks corporate client; **whatsapp-mcp**: order confirmation |
| 5 | Fornecedor atraso polpa | 4 | 4 | — | Inventory unchanged |
| 6 | Margem iFood 500ml | 2 | 6 | ✅ | **yaya-expenses**: COGS + iFood commission tracking = real margin per product |
| 7 | Total Pix hoje | 3 | 4 | ✅ | Expenses payment method tracking (partial — Pix reconciliation still missing) |
| 8 | Promo Rappi breakeven | 3 | 6 | ✅ | **yaya-expenses COGS**: cost vs promo price analysis |
| 9 | Pagamento dividido | 3 | 5 | ✅ | CRM + expenses can record split payment |
| 10 | Resumo pagamentos semana | 3 | 6 | ✅ | **yaya-expenses**: payment method breakdown (Pix/cartão/dinheiro/iFood/Rappi) |
| 11 | NF-e encomenda | 2 | 2 | — | NF-e not implemented |
| 12 | NFC-e Pinheiros | 2 | 2 | — | NFC-e not implemented |
| 13 | Total NFs fevereiro | 2 | 2 | — | NF not implemented |
| 14 | NFC-e retroativa | 2 | 2 | — | NF not implemented |
| 15 | Ranking 5 produtos | 4 | 5 | ✅ | Enriched with margin data from expenses |
| 16 | Ticket médio por canal | 4 | 4 | — | Analytics unchanged |
| 17 | Performance por loja | 3 | 6 | ✅ | **yaya-expenses**: P&L per unit (Vila Madalena vs Pinheiros) |
| 18 | Horário pico por dia | 4 | 4 | — | Analytics unchanged |
| 19 | Desperdício em reais | 3 | 6 | ✅ | **yaya-expenses**: track waste as expense category, quantify in R$ |
| 20 | Freezer quebrou | 4 | 4 | — | Escalation — emergency response unchanged |
| 21 | Avaliação 1 estrela | 4 | 5 | ✅ | **crm-mcp**: customer history for factual response |
| 22 | Funcionário faltou | 3 | 3 | — | Scheduling unchanged |
| 23 | iFood taxa comissão | 3 | 5 | ✅ | **yaya-expenses**: historical commission tracking by month |
| 24 | Atacado 50L preço | 3 | 6 | ✅ | **yaya-expenses COGS**: calculate minimum price to maintain margin |
| 25 | Projeção terceira loja | 3 | 4 | ✅ | Expenses data provides baseline cost structure |
| 26 | Pix desconhecido | 2 | 3 | ✅ | CRM contact search, but Pix reconciliation still limited |
| 27 | Açaí pitaya preço | 3 | 6 | ✅ | **yaya-expenses COGS**: input cost → target margin → selling price |
| 28 | Evento degustação registro | 3 | 6 | ✅ | **yaya-expenses**: register as marketing expense with correct categorization |
| 29 | Rappi programa fidelidade | 3 | 5 | ✅ | Expenses margin data enables informed decision |
| 30 | Vigilância sanitária docs | 3 | 3 | — | Document management unchanged |

#### Summary — João

| Metric | R2 | R3 | Delta |
|--------|----|----|-------|
| **Score** | 3.1/10 | **4.6/10** | +1.5 |
| **PMF %** | 15% | **28%** | +13pp |
| **Scenarios Changed** | — | **18/30** (60%) | — |

**Most Impactful Features:**
1. 🥇 **yaya-expenses** — COGS and margin analysis for iFood/Rappi is transformative. He can finally answer "quanto sobra pra mim?" per product per channel.
2. 🥈 **crm-mcp** — Corporate customer tracking for encomendas, customer history.
3. 🥉 **whatsapp-mcp** — Order confirmations and proactive delivery coordination.

**Remaining Gaps:**
- NF-e/NFC-e (4 scenarios = 13%) — blocks invoicing workflow
- Portuguese language UX — skills speak Spanish, João speaks paulistano
- Pix reconciliation — no direct Pix API integration
- iFood/Rappi API integration (order sync, commission tracking automatic)
- Multi-unit management (two stores without unified dashboard)
- DAS (Simples Nacional) calculation

---

### 5. Fernanda Costa — Clínica Bella (Belo Horizonte)

**R2 Score: 3.0/10 | R2 PMF: 12%**

#### Scenario-by-Scenario Evaluation

| # | Scenario | R2 | R3 | Changed? | What Helped |
|---|----------|----|----|----------|-------------|
| 1 | Agenda de amanhã | 4 | 4 | — | Appointments skill existed |
| 2 | Histórico paciente alergias | 3 | 7 | ✅ | **crm-mcp**: get_customer_history returns all interactions, notes, history |
| 3 | Registrar procedimento + lote | 3 | 6 | ✅ | **crm-mcp**: log_interaction with metadata (lote, unidades, áreas) |
| 4 | Sessões laser CO2 mês | 3 | 5 | ✅ | CRM interaction type query |
| 5 | Relatório tratamento paciente | 3 | 7 | ✅ | **crm-mcp**: get_customer_history — full treatment timeline exportable |
| 6 | Parcelamento 12x líquido | 3 | 5 | ✅ | **yaya-expenses**: tracks Stone fees as expense; can compute net |
| 7 | Total Pix hoje | 3 | 5 | ✅ | Expenses payment tracking |
| 8 | Pacote margem cálculo | 3 | 7 | ✅ | **yaya-expenses COGS**: bundle pricing vs separate, margin comparison |
| 9 | Pagamento dividido Pix+cartão | 3 | 6 | ✅ | CRM + expenses record split payment |
| 10 | Insumos vs faturamento | 2 | 7 | ✅ | **yaya-expenses**: expense by category vs revenue = margin analysis |
| 11 | NFS-e corporativa | 2 | 2 | — | NFS-e not implemented |
| 12 | NFS-e count + ISS | 2 | 2 | — | NFS-e not implemented |
| 13 | NFS-e retroativa | 2 | 2 | — | NFS-e not implemented |
| 14 | Faturamento por código serviço | 2 | 3 | ✅ | CRM interaction metadata can categorize by service type (partial) |
| 15 | Procedimentos mais lucrativos | 3 | 7 | ✅ | **yaya-expenses**: revenue by procedure minus insumo cost = margin ranking |
| 16 | Taxa retorno pacientes | 3 | 7 | ✅ | **crm-mcp**: customer history — repeat visit analysis by procedure |
| 17 | Trimestre vs anterior | 3 | 6 | ✅ | **yaya-expenses**: P&L period comparison |
| 18 | Horário/dia mais agendado + no-show | 3 | 4 | ✅ | CRM + appointments data cross-reference |
| 19 | Perfil pacientes faixa etária | 3 | 5 | ✅ | **crm-mcp**: segment_customers with custom criteria |
| 20 | Reação adversa — lote urgente | 3 | 6 | ✅ | **crm-mcp**: customer history includes lote metadata from interaction log |
| 21 | ANVISA rastreabilidade | 2 | 4 | ✅ | CRM interaction metadata has lot info (partial — not a dedicated ANVISA module) |
| 22 | Review negativo Google | 3 | 7 | ✅ | **crm-mcp**: get_customer_history for factual response with dates and procedures |
| 23 | Botox R$499 vs R$1.200 análise | 3 | 7 | ✅ | **yaya-expenses COGS**: product cost + qualification costs = value justification |
| 24 | Menor de idade autorização | 3 | 3 | — | Regulatory — no change |
| 25 | Lote validade curta | 3 | 5 | ✅ | Expenses tracks insumo usage rate → days of stock calculation |
| 26 | Crédito/vale paciente | 3 | 6 | ✅ | **yaya-fiados**: can track credit balance / store credit |
| 27 | Stone parou funcionar | 3 | 4 | ✅ | **whatsapp-mcp**: send_payment_link as Pix alternative |
| 28 | Paciente americana dólar | 2 | 7 | ✅ | **forex-mcp**: USD→BRL conversion + **yaya-expenses**: multi-currency |
| 29 | Programa fidelidade cálculo | 3 | 6 | ✅ | **crm-mcp**: customer frequency data + expenses margin impact modeling |
| 30 | Dermatologista saindo — pacientes | 3 | 7 | ✅ | **crm-mcp**: interaction history shows which patients were seen by which provider |

#### Summary — Fernanda

| Metric | R2 | R3 | Delta |
|--------|----|----|-------|
| **Score** | 3.0/10 | **5.2/10** | +2.2 |
| **PMF %** | 12% | **32%** | +20pp |
| **Scenarios Changed** | — | **23/30** (77%) | — |

**Most Impactful Features:**
1. 🥇 **crm-mcp** — Game-changer for a clinic. Patient history, treatment records, procedure metadata (lots, units), provider attribution, segmentation. Directly solves pain point #4 (prontuário fragmentado).
2. 🥈 **yaya-expenses** — Insumo cost tracking, margin per procedure, P&L visibility. Solves the "am I profitable?" question.
3. 🥉 **whatsapp-mcp** — Appointment confirmations, post-procedure follow-ups, payment alternatives. Reduces no-shows (pain point #1).

**Remaining Gaps:**
- NFS-e (3 scenarios = 10%) — blocks service invoicing
- ANVISA compliance module — CRM metadata is a workaround, not a proper regulatory system
- Portuguese language UX
- Prontuário eletrônico integration (clinical records, before/after photos)
- Stone/PagSeguro API integration for reconciliation
- ISS/PIS/COFINS calculation

---

### 6. Marcos Oliveira — TechMais (Recife)

**R2 Score: 2.7/10 | R2 PMF: 10%**

#### Scenario-by-Scenario Evaluation

| # | Scenario | R2 | R3 | Changed? | What Helped |
|---|----------|----|----|----------|-------------|
| 1 | Celulares usados estoque | 3 | 3 | — | Inventory unchanged |
| 2 | Ordem de serviço Galaxy S23 | 2 | 5 | ✅ | **crm-mcp**: create_contact + log_interaction with service metadata |
| 3 | Ordens abertas/atrasadas | 2 | 5 | ✅ | **crm-mcp**: interactions filtered by type + date |
| 4 | Vendas do dia registrar | 3 | 5 | ✅ | **yaya-expenses**: logs revenue + payment method |
| 5 | Cliente buscar notebook | 3 | 6 | ✅ | **crm-mcp**: get_customer_history — payment status, service details |
| 6 | Aparelhos prontos p/ retirada | 3 | 7 | ✅ | **crm-mcp**: filter interactions; **whatsapp-mcp**: bulk notify customers |
| 7 | Lote iPhones lucro | 2 | 7 | ✅ | **yaya-expenses COGS**: purchase cost, selling price, Simples deduction |
| 8 | Dinheiro caixa conferir | 2 | 5 | ✅ | **yaya-expenses**: cash expense tracking vs recorded revenue |
| 9 | Smartwatch parcelamento | 3 | 4 | ✅ | Expenses can model PagSeguro fees |
| 10 | Resumo pagamentos semana | 2 | 6 | ✅ | **yaya-expenses**: payment method breakdown |
| 11 | Trade-in celular abatimento | 3 | 4 | ✅ | CRM tracks customer, expenses can model value |
| 12 | NFC-e vendas do dia | 2 | 2 | — | NFC-e not implemented |
| 13 | NFS-e troca tela | 2 | 2 | — | NFS-e not implemented |
| 14 | Separar NFC-e vs NFS-e | 2 | 2 | — | NF not implemented |
| 15 | NFC-e obrigatória s/ pedido | 2 | 2 | — | NF not implemented |
| 16 | Varejo vs assistência rentabilidade | 2 | 6 | ✅ | **yaya-expenses**: P&L by category (comércio vs serviço) |
| 17 | Top 10 produtos | 3 | 4 | ✅ | Enriched with margin data |
| 18 | Tempo médio assistência | 2 | 5 | ✅ | **crm-mcp**: interaction timestamps — created_at to completion |
| 19 | Vendas mês comparação | 3 | 5 | ✅ | **yaya-expenses**: period comparison |
| 20 | Ticket médio varejo vs serviço | 3 | 5 | ✅ | Expenses data segmented by type |
| 21 | Cliente reclamando tela defeito | 3 | 7 | ✅ | **crm-mcp**: service history — part used, supplier, date |
| 22 | Estoquista sumindo mercadoria | 3 | 4 | ✅ | Better tracking through CRM + expenses, but not full inventory audit |
| 23 | Fiscal pedindo NFs | 2 | 2 | — | NF not implemented |
| 24 | Celular s/ NF — roubo? | 3 | 3 | — | Legal/regulatory — no change |
| 25 | Aparelhos abandonados 60d | 3 | 6 | ✅ | **crm-mcp**: aging query; **whatsapp-mcp**: automated contact attempts |
| 26 | Devolução fone aberto | 3 | 3 | — | Consumer rights — no change |
| 27 | Combo celular+acessórios | 3 | 5 | ✅ | **yaya-expenses COGS**: calculate margins for bundle options |
| 28 | Capinhas atacado margem | 3 | 6 | ✅ | **yaya-expenses**: cost analysis, annual projection |
| 29 | Técnico MEI vs CLT | 3 | 3 | — | HR/legal — no change |
| 30 | Internet caiu — vendas pendentes | 2 | 3 | ✅ | **yaya-expenses**: can log retroactively when connectivity returns |

#### Summary — Marcos

| Metric | R2 | R3 | Delta |
|--------|----|----|-------|
| **Score** | 2.7/10 | **4.3/10** | +1.6 |
| **PMF %** | 10% | **24%** | +14pp |
| **Scenarios Changed** | — | **21/30** (70%) | — |

**Most Impactful Features:**
1. 🥇 **crm-mcp** — Service order tracking (replaces the cadernão), customer history for warranty claims, abandoned device management. Directly addresses pain points #3 and #5.
2. 🥈 **yaya-expenses** — Margin analysis for varejo vs assistência, cost tracking for parts procurement.
3. 🥉 **whatsapp-mcp** — Notify customers when devices are ready, follow up on abandoned devices.

**Remaining Gaps:**
- NFC-e + NFS-e (4 scenarios = 13%) — dual invoice system not implemented at all
- Portuguese language UX
- Proper order-of-service (OS) management module — CRM is a workaround
- Used/reconditioned device pricing model
- PagSeguro API integration
- Simples Nacional DAS calculation (Anexo I + III)
- OLX/Marketplace integration

---

## Consolidated Results

### Score Comparison Table

| Persona | Country | Business | R2 Score | R3 Score | Δ Score | R2 PMF | R3 PMF | Δ PMF |
|---------|---------|----------|----------|----------|---------|--------|--------|-------|
| Guadalupe Sánchez | 🇲🇽 MX | Taquería (2 locations) | 4.2 | **5.8** | +1.6 | 20% | **38%** | +18pp |
| Roberto Luna | 🇲🇽 MX | Taller mecánico | 4.5 | **6.3** | +1.8 | 25% | **42%** | +17pp |
| Ana Castañeda | 🇲🇽 MX | E-commerce belleza | 4.1 | **5.5** | +1.4 | 22% | **34%** | +12pp |
| João Silva | 🇧🇷 BR | Açaí (2 locations) | 3.1 | **4.6** | +1.5 | 15% | **28%** | +13pp |
| Fernanda Costa | 🇧🇷 BR | Clínica estética | 3.0 | **5.2** | +2.2 | 12% | **32%** | +20pp |
| Marcos Oliveira | 🇧🇷 BR | Loja eletrônicos + assistência | 2.7 | **4.3** | +1.6 | 10% | **24%** | +14pp |

### Averages

| Region | R2 Avg Score | R3 Avg Score | Δ Avg | R2 Avg PMF | R3 Avg PMF | Δ PMF |
|--------|-------------|-------------|-------|-----------|-----------|-------|
| **Mexico** | 4.27 | **5.87** | +1.60 | 22.3% | **38.0%** | +15.7pp |
| **Brazil** | 2.93 | **4.70** | +1.77 | 12.3% | **28.0%** | +15.7pp |
| **Overall** | 3.60 | **5.28** | +1.68 | 17.3% | **33.0%** | +15.7pp |

### Feature Impact Ranking (across all 6 personas)

| Rank | Feature | Avg Score Impact | Personas Where #1 | Key Unlock |
|------|---------|-----------------|-------------------|------------|
| 1 | **yaya-expenses** | +1.4 | 3 (Guadalupe, Ana, João) | P&L visibility, COGS, margin analysis — the "¿estoy ganando plata?" question |
| 2 | **crm-mcp** | +1.2 | 2 (Fernanda, Marcos) | Customer history, service records, segmentation — replaces libreta/cadernão |
| 3 | **yaya-fiados** | +0.8 | 1 (Roberto) | Digitized credit tabs, perfect cultural fit for informal credit businesses |
| 4 | **whatsapp-mcp** | +0.6 | 0 | Outbound messaging — reminders, notifications, cobro — always #2-3 but never standalone |
| 5 | **forex-mcp** | +0.2 | 0 | Niche but valuable — unlocks cross-border scenarios cleanly |

### Biggest Improvement: Fernanda Costa (+2.2 points, +20pp PMF)

Fernanda saw the largest improvement because CRM + expenses together solve her two biggest pain points simultaneously: fragmented patient records (#4) and margin invisibility. Her business is relationship-heavy and data-rich — exactly where CRM + expenses shine.

### Smallest Improvement: Ana Castañeda (+1.4 points, +12pp PMF)

Ana's improvement was the smallest because her core gaps are **platform-specific integrations** (MercadoLibre, MercadoPago, Instagram Shop) and **CFDI**, none of which were addressed. The new features help at the edges but don't solve her #1 pain point (multi-channel conciliation).

---

## Key Observations

### What's Working

1. **The expense-first approach was the right call.** Every single persona benefited from expense tracking. "Am I making money?" is THE universal SMB question, and now Yaya can answer it with data.

2. **CRM fills the "who is this customer?" gap.** Talleres, clínicas, and lojas all track customers on paper. crm-mcp replaces that with searchable, analyzable data.

3. **Fiados is a cultural home run.** For Roberto specifically, this feature feels like it was built for him. The cobro reminders with escalation levels show deep understanding of LATAM trust dynamics.

4. **WhatsApp outbound completes the communication loop.** Before R3, Yaya could receive but not send. Now the platform can proactively reach customers.

5. **The unified schema is clean.** contacts → interactions → appointments → expenses → fiados is a coherent data model that naturally supports cross-feature queries.

### What's Still Missing

1. **Tax invoicing remains the #1 gap.**
   - Mexico: SAT/CFDI blocks 4-5 scenarios per persona (13-17% of test suite)
   - Brazil: NF-e/NFC-e/NFS-e blocks 3-4 scenarios per persona (10-13% of test suite)
   - Without invoicing, no persona can reach PMF >50%

2. **Brazil localization is a real gap.** Skills are written in Spanish with Peruvian examples. Portuguese-speaking users need:
   - Portuguese skill variants or language-adaptive behavior
   - R$ formatting, Brazilian categories (DAS, Simples Nacional, ICMS, ISS)
   - Brazilian payment methods (Pix API, boleto, PagSeguro/Stone)
   - This gap costs Brazil personas ~0.5-1.0 points vs their Mexico equivalents

3. **Platform integrations** (MercadoLibre, iFood, Rappi) remain absent — critical for Ana and João

4. **Work order / service ticket management** — CRM interactions are a workaround, not a proper OS system (critical for Roberto and Marcos)

### PMF Path

To reach 50% PMF across LATAM, the two most impactful next investments would be:
1. **CFDI/NF-e implementation** — unlocks 10-17% of scenarios per persona
2. **Portuguese localization** of expenses + fiados skills — closes the 0.5-1.0 point gap for Brazil

---

*Generated: 2026-03-21 | Round 3 of Yaya Platform persona evaluation*
