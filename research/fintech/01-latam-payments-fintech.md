# Latin America Payments & Fintech Landscape: Strategic Analysis for Yaya Platform

**Research Document — March 2026**
**Classification: Internal Strategic Research**

---

## Executive Summary

Latin America is undergoing a historic transformation in digital payments. With 70% of adults now holding a financial account (up from 39% in 2011), real-time payment systems processing trillions of dollars annually, and an SMB credit gap exceeding $1.8 trillion, the region presents one of the most compelling fintech opportunities globally. This document maps the payment ecosystem across Peru, Colombia, Brazil, and Mexico—Yaya Platform's primary addressable markets—and identifies strategic revenue opportunities in payment verification, lending, insurance distribution, and regulatory compliance automation.

---

## 1. Payment Ecosystem Map by Country

### 1.1 Peru: Yape/Plin Duopoly and the QR Revolution

**Market Structure:**
Peru's digital payment landscape is dominated by two digital wallets that have fundamentally reshaped consumer behavior:

- **Yape** (Banco de Crédito del Perú): 20+ million users as of 2025, with 2+ million affiliated merchants. Processes 10+ million transactions daily. Expanded to Bolivia (3 million users). Features include microcredits, international remittances, e-commerce, and currency exchange. Merchant fee: 2.95% for large merchants via "Yape Empresa"; free for P2P (Wikipedia, 2025; BCRP Working Paper 006-2025).

- **Plin** (embedded in banking apps—BBVA, Scotiabank, Interbank, others): 13+ million users by end of 2023. Operates on Visa Direct infrastructure via Yellow Pepper. Free P2P, no merchant fees for standard transactions (BCRP, Andia et al. 2025).

**Interoperability Mandate:**
The BCRP issued Circular No. 0024-2022-BCRP mandating full interoperability among digital wallets. Phase 1 (April 2023) connected Yape and Plin via Visa. Phase 2 (July 2023) extended to all Peruvian wallets. Result: 1.6+ million daily interoperable transactions, with Yape alone handling 2+ million interoperable payments daily (Wikipedia; BCRP).

**Market Share Shift:**
By December 2023, digital wallets accounted for >50% of all retail cashless transactions in Peru, surpassing card payments (23%). Cash's share of transactions dropped from 81% in 2018 to 58% in 2022 (Mastercard MMT; BCRP Working Paper). Peru's contactless card penetration is 87%—among the highest in LATAM.

**Payment Processors (API Landscape):**

| Processor | Commission (National) | Affiliation Cost | Monthly Maintenance | Key Differentiator |
|-----------|----------------------|-------------------|--------------------|--------------------|
| **Culqi** (Credicorp/BCP) | 3.44% + IGV (POS); 4.20% + $0.30 (online) | Free | Free | Best for startups; SDKs for PHP, Python, Node.js, Ruby; same-day settlement with BCP |
| **Niubiz** (ex-VisaNet) | 3.45% + IGV (Visa) | S/300 + IGV | S/50 + IGV | Largest processor—632M transactions, S/75B in 2024; Amex/Diners; CyberSource antifraude |
| **Izipay** (Interbank) | 3.44% + IGV | Free | Free | POS purchase model (no rental); instant settlement to Interbank |
| **Mercado Pago** | 3.99% + S/1.00 | Free | Free | Seller protection program; regional presence |
| **PayU** | ~4.59% + S/1.50 | — | 114 PEN + IGV | Multi-country coverage; AI antifraude |

(Sources: AdraTech Systems, 2026; eCommerceAcademy.pe, 2025; Rebill, 2026)

**Key Insight for Yaya:** Peru's digital wallet adoption is among the deepest in LATAM relative to population. The interoperability mandate creates a unified payment rail that Yaya can leverage. Culqi's developer-friendly APIs make it the natural integration partner for startups.

### 1.2 Colombia: Nequi Dominance and Bre-B Launch

**Digital Wallet Landscape:**
- **Nequi** (Bancolombia): 21 million users (half of Colombia's adult population). 13 million monthly active users. 2.6 million active entrepreneurs/merchants. 869 million transactions processed. 72% activity rate. Processes two-thirds of all digital wallet payments in Colombia. 62% of users are informal workers/employees. 86% of transactions are digital (EBANX, Feb 2025; Nequi Press Release, 2023).

- **Daviplata** (Banco Davivienda): Second-largest wallet; significant for government subsidy disbursement.

- **PSE (Pagos Seguros en Línea)**: Run by ACH Colombia. Accepted by 23,000+ retailers and 30+ financial institutions. Half of Colombians use it. "Real-time" from user perspective but settled via ACH rails (Mastercard APA, 2024).

**Bre-B: Colombia's Pix Moment (Launched Oct 6, 2025):**
The Banco de la República launched Bre-B, a centralized interoperable instant payment system:
- 218 participating entities and 5 fully interoperating instant payment systems (SPBVIs) as of January 2026
- 99 million aliases registered (33+ million customers, 2.8 million merchants)
- 370+ million transactions totaling 59+ trillion COP in first 4 months
- 79% of Colombians still prefer cash—massive digital conversion opportunity
(Banco de la República, Feb 2026; Acción, Oct 2025)

**Key Insight for Yaya:** Colombia's Bre-B launch represents a "Pix moment" for the country. The 40% unbanked rate combined with Nequi's dominance creates an ideal market for payment verification services, especially among the 2.5 million merchant users managing businesses through digital wallets.

### 1.3 Brazil: Pix as Global Benchmark

**Scale:**
- 178+ million users (91% of adult population)
- 63 billion transactions in 2024, up from 9.4 billion in 2021 (53% YoY growth)
- BRL 17.2 trillion ($3.3 trillion USD) in volume in 2024
- 6-7 billion monthly transactions; ~BRL 3 trillion/month in 2025
- Daily record: 276.7 million transactions (June 2025)
- 40% of e-commerce payment share (projected 51% by 2027)
- Merchant fees: ~0.33% vs 2-5% for cards
(Central Bank of Brazil, 2025; PCMI; Faster Payments Council Q1 2025)

**Key Developments (2025-2026):**
- **Pix por Aproximação** (Contactless Pix via NFC): Launched Feb 2025
- **Pix Automático** (recurring payments): Launched June 2025—targets 60M Brazilians without credit cards
- **Pix Internacional**: Cross-border integrations being explored with BIS
- **Open Finance**: 70+ million active consents, 102 billion API calls in 2024 (+96% YoY)

**Key Insight for Yaya:** Brazil is the benchmark, not the initial market. Pix's success validates the model Yaya should replicate—zero-fee P2P, QR-based merchant payments, and embedded lending on payment rails. Pix Automático's subscription model is directly relevant to Yaya's recurring payment use cases.

### 1.4 Mexico: SPEI Scale, CoDi Failure, DiMo Promise

**SPEI (Interbank Electronic Payment System):**
- 5.34 billion transactions in 2024, totaling MXN 219 trillion (USD 12 trillion)—6.5x Mexico's GDP
- 39% annual growth in transaction volume
- Used by 6 in 10 Mexicans
(Banxico; Mexico Business News, May 2025)

**CoDi/DiMo:**
- CoDi (QR-based, launched 2019): Only 18.4 million validated accounts by 2024; only 1.5 million active users. Considered a failure due to fragmentation and poor UX.
- DiMo (phone-number-based, launched 2023): Expected to surpass CoDi's lifetime users in its first year. BBVA Mexico projected 5 million users and $560M in transactions in year one.
(Rebill, 2024; Mexico Business News, 2025)

**Real-Time Payments Market:**
- Projected to grow from $0.83B (2025) to $4.27B (2031), CAGR 31.4%
- P2P: 64.45% of 2025 volume; P2B growing at 34.1% CAGR
- SME segment growing at 31.9% CAGR
- SPEI 2.0 under development with multicurrency and intelligent processing
(Mordor Intelligence, 2025)

**Key Insight for Yaya:** Mexico's 45% banked rate (lowest among major LATAM economies) combined with SPEI's massive infrastructure creates opportunity. CoDi's failure is instructive—UX simplicity is non-negotiable. Mexico is also the second-largest remittance recipient globally.

---

## 2. Payment Verification Opportunity Analysis

### 2.1 The "Fake Yape" Problem: A Massive Market Pain Point

The proliferation of fake digital wallet payment confirmations is one of the most significant fraud vectors affecting LATAM merchants. This is **directly relevant to Yaya Platform's core value proposition**.

**How It Works:**
1. Fraudsters purchase or download apps that generate pixel-perfect fake payment screenshots for Yape, Plin, or banking apps (currently selling for S/10-200 on social media)
2. These fake apps simulate the entire payment flow: QR scanning, recipient name auto-completion, amounts, transaction IDs, timestamps, and even the confetti animation
3. Merchants see a convincing screenshot on the fraudster's phone and hand over goods/services
4. The money never arrives

**Scale of the Problem:**
- Fake Yape apps are now on version 5-6, with ongoing feature updates mimicking official app changes
- Websites freely generate fake payment screenshots (e.g., "Blog de Zheard" meme generator)
- The fraud has expanded beyond Peru to Bolivia, Chile, and Colombia
- 70% of Peruvians use digital wallets—all potentially affected
- Merchants in traditional markets (bodegas, market stalls, street vendors) are primary targets
(El Comercio, 2023; Infobae, 2024; América TV, 2023; Peru Contable, 2024)

**Current Merchant Workarounds (All Inadequate):**
1. **Manual app checking**: Merchant opens their own Yape/Plin app to verify receipt—slow (15-60 seconds), disrupts customer flow, requires smartphone literacy
2. **Wait for push notification**: Unreliable—notifications can be delayed or missed in noisy market environments
3. **Email confirmation**: Yape sends email confirmations, but merchants rarely check email in real-time at point of sale
4. **Trust-based**: Most small merchants simply trust the screenshot shown—the primary vulnerability

**Yaya Platform Opportunity:**
An automated payment verification system that:
- Provides instant audible/visual confirmation when payment is received (hardware dongle or dedicated app)
- Cross-references transaction data in real-time via Yape/Plin/bank APIs
- Generates verifiable digital receipts linked to SUNAT e-invoicing
- Works in noisy market environments (sound-based confirmation like Pix in Brazil)
- Requires zero technical sophistication from merchants

**Market Size Estimate:**
With 2.7+ million Yape merchant users and 1.6+ million daily interoperable transactions, even a S/5-10/month subscription per merchant represents a S/160M-S/320M annual addressable market in Peru alone.

### 2.2 WhatsApp Commerce Verification Gap

A significant portion of LATAM SMB commerce occurs via WhatsApp, where payment verification is entirely manual:

1. Customer sends product order via WhatsApp
2. Merchant provides Yape/Plin/bank account details
3. Customer makes payment and sends screenshot
4. Merchant manually verifies (or doesn't) and ships product

This workflow is vulnerable to screenshot fraud, reconciliation errors, and has no audit trail for tax purposes. Yaya's opportunity: integrate WhatsApp Business API with payment verification and automatic SUNAT/DIAN invoice generation.

---

## 3. Regulatory Compliance Requirements and Timelines

### 3.1 Electronic Invoicing Mandates

#### Peru (SUNAT)
- **Status**: Mandatory for ALL taxpayers since 2022
- **System**: SEE (Sistema de Emisión Electrónica) with CPE (Comprobantes de Pago Electrónicos)
- **Format**: UBL 2.1 XML, digitally signed
- **Validation**: Via SUNAT directly or authorized OSE (Operador de Servicios Electrónicos)
- **Deadline**: 3 calendar days from issuance to submit to SUNAT
- **Storage**: 5 years minimum
- **SIRE (Integrated Electronic Records)**: Mandatory for large taxpayers from January 2026; SUNAT not applying penalties for delays until July 2025
- **SUNAT + Yape Oversight**: From mid-2025, SUNAT intensified fiscal oversight of businesses using Yape, targeting those with annual revenues >45,000 PEN to cross-reference digital transactions with declared income
- **Key Documents**: Facturas (B2B/B2G), Boletas (B2C), credit/debit notes, transport guides (GRE), withholdings, collections
(SUNAT Resolution 300-2014; ecosio, 2025; EDICOM, 2026; Comarch, 2025)

#### Mexico (SAT)
- **Status**: Mandatory since 2014, with CFDI 4.0 as current standard
- **System**: CFDI (Comprobante Fiscal Digital por Internet)
- **Format**: XML with digital signature
- **Validation**: Via authorized PAC (Proveedor Autorizado de Certificación)

#### Colombia (DIAN)
- **Status**: Mandatory for all taxpayers since November 2020
- **System**: Electronic invoice with fiscal validation
- **Format**: UBL 2.1 XML
- **Key**: Real-time validation by DIAN before invoice is legally valid

#### Ecuador (SRI)
- **Status**: Mandatory for all taxpayers
- **System**: Electronic invoice via SRI online system

**Yaya Platform Opportunity:** Automated e-invoicing integration that generates SUNAT-compliant CPEs from every Yape/Plin transaction. For the >2 million Yape merchants, most of whom are micro-businesses, compliance is a major pain point. A one-click solution bundled with payment verification creates enormous value.

### 3.2 Open Banking / Open Finance Status

| Country | Status | Regulator | Key Regulation | Timeline |
|---------|--------|-----------|----------------|----------|
| **Brazil** | Live (most advanced globally) | BCB | Resolution 1/2020 | Phase 4 (Open Finance) operational; 70M+ active consents; 102B API calls/year |
| **Mexico** | In progress (stalled) | CNBV/Banxico | Ley Fintech 2018 | AIS secondary provisions 2020; PIS not yet regulated; SPEI 2.0 in development |
| **Colombia** | In progress (accelerating) | SFC/URF | Decreto 1297 de 2022 | Mandatory Open Finance draft decree June 2025; PIS phase 2 standards by Dec 2024; AIS phase 3 by 2025 |
| **Chile** | Planned (regulation finalized) | CMF | Ley Fintech N° 21.521 (2023) | General Standard 514 (July 2024); mandatory implementation starting April 2026 |
| **Peru** | Early planning | SBS | Legislative Decree 1531 (2022) | No definitive timeline; SBS evaluating framework; BCRP partnered with India's NPCI |

(Sources: Ozone API, 2025; Noda.live, 2025; Mastercard, 2024; Fiskil)

**Key Insight for Yaya:** Peru's open banking is at the "innovation trigger" stage—no regulation yet, but the BCRP's partnership with India's NPCI (UPI infrastructure) signals future direction. This is the ideal moment to build open-banking-ready infrastructure before mandates arrive. Colombia's accelerating framework creates near-term opportunity.

### 3.3 Fintech Regulatory Landscape

**Peru:**
- No comprehensive Fintech Law yet (unlike Mexico/Colombia)
- Legislative Decree 1531 (2022) amended banking law to allow SBS-authorized companies to operate digitally
- BCRP plays key role in payments regulation (interoperability mandate, wallet standards)
- SBS is the primary fintech regulator

**Colombia:**
- Regulatory sandbox framework under SFC (Superintendencia Financiera)
- Nequi operates as a business unit of Bancolombia (full banking license)
- Bre-B regulation designed with broad industry participation

**Mexico:**
- Ley Fintech (2018)—one of the first globally
- 773 domestic + 217 foreign fintechs active in 2025
- Regulatory sandbox supports innovation

---

## 4. Banking Infrastructure Gaps

### 4.1 Financial Inclusion by Country

| Metric | Peru | Colombia | Brazil | Mexico | LATAM Avg |
|--------|------|----------|--------|--------|-----------|
| Account ownership (2024) | ~73% | ~65% | 86% | ~45% | 70% |
| Cash as % of payments | 58% (2022, down from 81% in 2018) | 79% prefer cash | ~31% | High (cash-centric) | 43% use cash for >50% expenses |
| Card payments per adult/year | 35 | 32 | 238 | 65 | Varies widely |
| Cash withdrawals (% card GDV) | 66% (highest in LATAM-6) | 61% | 24% | 46% | — |
| Contactless card penetration | 87% | 62% | 35% | 22% | — |
| Mobile money account (2024) | Growing | Growing | Pix-driven | Low | 37% |

(Sources: World Bank Global Findex 2025; Mastercard MMT; BIS Paper 153, March 2025)

### 4.2 The Unbanked/Underbanked Challenge

- **91 million Latin Americans** still don't have digital accounts (Mastercard/AMI, 2023)
- **200 million more** are in early stages of financial inclusion
- Only **31% of LATAM adults** are fully financially included (Cash Displacer, True Believer, or Master levels)
- **21% remain Cash-Only Consumers**—down from 45% pre-COVID but still massive
- **Gender gap**: 8 percentage points (66% women vs 74% men have accounts)
- **Only 31% have access to loans**; only 3 in 10 have insurance or investment products
(Mastercard/AMI Financial Inclusion Report, 2023-2024; Global Findex 2025; PCMI)

### 4.3 Credit Access: The Critical Gap

- **$1.8 trillion SMB credit gap** across Latin America
- **87% of MSMBs** find their credit demands unmet
- **Over 90% of businesses** in the region are SMBs, representing 60% of employment
- **88% of firms** are classified as microenterprises
- **Nearly 50% operate informally**—creating unique credit profiles requiring contextual solutions
- Alternative SME financing sector projected to reach **$57.8 billion by 2028** (CAGR 19.6%)
- Traditional banks approve far fewer SMB loans than fintech lenders using transactional data (60% more approvals with alt-data)
(R2, 2025; OECD/CAF/SELA SME Policy Index 2024; Visa/Uplinq, Aug 2025)

### 4.4 Cross-Border Payment Challenges for SMBs

**Pain Points (directly relevant to importers like Carlos Medrano):**
- Sending $250 cross-border can involve **average fees of 23.3%**, reaching 30% depending on destination
- In Brazil, **80% of B2B cross-border payments take >4 days**; 1 in 5 take >10 days
- LAC is the **most expensive region globally** to send P2P cross-border payments
- LAC→LAC B2B/B2P transfers have the **highest costs globally**
- Average cost of sending $200 remittance to LAC: **6.19%** (vs UN 3% target)
- Political/currency volatility, fragmented regulatory environments, and multiple intermediaries drive costs
- **3 out of 5 SMEs** in the region work with international suppliers; 75% in Mexico/Brazil plan to expand
(Mastercard Borderless Payments Report, 2023/2025; FXC Intelligence; IMF Working Paper 2024/119; FSB)

**Key Insight for Yaya:** Carlos Medrano's import business represents millions of LATAM SMBs paying 5-30% fees on cross-border payments. A platform combining payment verification with FX services and supplier payment facilitation addresses enormous demand.

---

## 5. Revenue Model Opportunities for Yaya Platform

### 5.1 Payment Verification SaaS (Immediate Revenue)

**Model:** Subscription + per-transaction fee for real-time payment verification

| Tier | Monthly Fee | Target | Features |
|------|-------------|--------|----------|
| Micro | Free / S/5 | Bodega, market stall | Audio notification, basic verification |
| PYME | S/29 | Small retail, restaurants | Verification + daily reconciliation + basic SUNAT reporting |
| Business | S/99 | Multi-location, e-commerce | Full API, multi-wallet, auto-invoicing, analytics dashboard |
| Enterprise | Custom | Chains, marketplaces | White-label, custom integrations, bulk settlement |

**Revenue Estimate (Peru only):**
- Addressable: 2.7M Yape merchants + growing
- Penetration target (Year 1): 1% = 27,000 merchants
- Average ARPU: S/20/month
- Year 1 Revenue: S/6.48M (~$1.7M USD)

### 5.2 Embedded Lending (High-Margin Growth)

Leveraging transaction data from verified payments to underwrite working capital loans:

**Model:** Revenue-based lending via embedded credit infrastructure (similar to R2's model)

- Loan sizes: $500-$50,000 USD
- Revenue share: 1.5x-2.5x factor rate
- Automated repayment: percentage of daily verified transaction volume
- Risk assessment: Real-time transaction data from Yaya payment verification

**Why This Works:**
- Merchants using Yaya verification generate continuous transactional data—the best alternative credit signal
- 87% of LATAM MSMBs have unmet credit demand
- Fintech lenders using transactional data approve 60% more loans than traditional banks
- R2 has facilitated $130M+ in loans to 70,000+ businesses in Mexico, Colombia, Chile, Peru—proving the model

**Revenue Estimate:**
- If 5% of verified merchants take a loan averaging S/5,000 with 50% fee income to Yaya: S/6.75M Year 1

### 5.3 Insurance Distribution (Underserved Massive Market)

Only 3 in 10 LATAM adults have access to insurance products. Embedded insurance within payment workflows:

- **Micro-insurance**: Accident, health, and inventory protection packaged with payment verification subscriptions
- **Transaction insurance**: Protection against fraud, chargebacks, and theft (relevant given the "Trafas del Yape" criminal gangs)
- **Business interruption**: Basic coverage triggered by verifiable transaction drops

**Model:** Commission-based distribution (15-30% of premium) with underwriting partners.

### 5.4 Regulatory Compliance Automation

**SUNAT Auto-Invoicing:**
- Generate CPEs automatically from verified Yape/Plin transactions
- UBL 2.1 XML generation, digital signature, OSE submission
- SIRE integration (mandatory for large taxpayers from Jan 2026)
- Monthly compliance reporting

**Model:** Included in higher tiers or add-on at S/15-30/month.

**Market Validation:** SUNAT's mid-2025 intensification of Yape transaction auditing (targeting businesses with >S/45,000 annual revenue) creates urgent demand for compliance tools.

### 5.5 Cross-Border Payment Facilitation

For importers like Carlos Medrano:
- Supplier payment facilitation with transparent FX rates
- Stablecoin rails for reduced cost corridors (Bitso manages >10% of US-Mexico remittances)
- Multi-currency wallet for inventory purchases
- Trade finance/supply chain finance partnerships (OmniLatam, R2 models)

### 5.6 Revenue Summary (5-Year Projection Estimate)

| Revenue Stream | Year 1 | Year 3 | Year 5 |
|---------------|--------|--------|--------|
| Payment Verification SaaS | $1.7M | $8.5M | $25M |
| Embedded Lending (fee income) | $1.8M | $12M | $40M |
| Insurance Distribution | $0.2M | $2M | $8M |
| Compliance/Invoicing | $0.5M | $3M | $10M |
| Cross-Border/FX | — | $2M | $15M |
| **Total** | **$4.2M** | **$27.5M** | **$98M** |

*Assumptions: Peru as primary market, Colombia Year 2, Mexico/Brazil Year 3. Conservative penetration rates.*

---

## 6. Competitive Landscape & Strategic Positioning

### 6.1 Direct Competitors (Peru)

- **Culqi**: Developer-friendly payment gateway, but no verification or lending. Potential partner, not competitor.
- **Niubiz**: Enterprise-focused, high costs. Not serving micro-merchants.
- **Yape Empresa**: BCP's merchant product. Charges 2.95% per transaction. Does not solve verification fraud.
- **IzipayYa**: Interbank's wallet. Fragmented approach.

### 6.2 Regional Competitors

- **R2** (Mexico-based): Embedded lending infrastructure for platforms. Potential partner for Yaya's lending stack—R2 provides "Lending-as-a-Service" that Yaya could white-label.
- **Mercado Pago**: Regional giant but focused on Mercado Libre ecosystem. High fees (3.99% + S/1).
- **Ualá**, **Nubank**: Neobanks, not solving merchant verification problem.

### 6.3 Yaya's Differentiation

No player currently combines:
1. Real-time payment verification across Yape/Plin/bank wallets
2. Automatic SUNAT-compliant e-invoicing
3. Transaction-data-based credit scoring and lending
4. WhatsApp-native commerce workflow integration
5. Cross-border payment facilitation for SMB importers

This full-stack approach targeting informal and micro-merchants (the "nanostores" that represent 75% of Peruvian retail) is an unoccupied strategic position.

---

## 7. Cryptocurrency & Stablecoin Adoption

- **Bitso** manages >10% of US-Mexico remittances using crypto rails
- Stablecoin adoption growing for cross-border payments (USDT/USDC)
- Colombia seeing regulatory development for virtual asset service providers
- Argentina leading with March 2025 VASP regulations
- **El Dorado**: LATAM stablecoin-powered superapp for cross-border
- Potential for Yaya: Stablecoin settlement layer for cross-border supplier payments, reducing costs from 6-23% to <1%

---

## 8. Key Risk Factors

1. **Regulatory uncertainty**: Peru lacks comprehensive Fintech Law; open banking timeline undefined
2. **Competition from Yape itself**: BCP could build verification and lending features natively
3. **Currency volatility**: PEN fluctuations affect unit economics of cross-border features
4. **Digital literacy**: Micro-merchants may resist adoption despite clear value proposition
5. **Fraud evolution**: As verification improves, fraudsters adapt (arms race dynamic)
6. **Interoperability dependency**: Reliance on BCRP/Visa infrastructure for wallet data access

---

## Sources

### Primary Research & Data

1. **BCRP Working Paper 006-2025**. Andia, A., Aurazo, J., Paliza, M. "Adoption and welfare effects of payment innovations: The case of digital wallets in Peru." August 2025.
2. **BIS Papers No. 153**. Aurazo, J., Franco, C., Frost, J., McIntosh, J. "Fast payments and financial inclusion in Latin America and the Caribbean." March 2025.
3. **Central Bank of Brazil**. Pix Statistics Dashboard. 2025.
4. **Banco de México (Banxico)**. SPEI Transaction Data. 2024-2025.
5. **Banco de la República (Colombia)**. "Bre-B, a brief history of the interoperated instant payment system." February 2026.
6. **World Bank Global Findex Database 2025**. Financial Inclusion data.
7. **IMF Working Paper 2024/119**. Drakopoulos, D. et al. "Cross-Border Payments Integration in Latin America and the Caribbean." 2024.

### Industry Reports

8. **Mastercard/AMI**. "The State of Financial Inclusion Post COVID-19 in Latin America and the Caribbean." 2023.
9. **Mastercard/PCMI**. "The New Era of Financial Inclusion in Latin America." 2024.
10. **Mastercard/PCMI/K2**. "Small businesses, big opportunity: Unlocking SME potential in Latin America's cross-border space." July 2025.
11. **Mastercard APA**. "Open Banking in Latin America." May 2024.
12. **PCMI (Payments & Commerce Market Intelligence)**. "Pix in Brazil: What to Expect in 2025." March 2025.
13. **FXC Intelligence**. "Cross-border payments in LatAm: Trends and opportunities." 2025.
14. **Mordor Intelligence**. "Mexico Real Time Payments Market Size, Trends Report." 2025.
15. **OECD/CAF/SELA**. "SME Policy Index: Latin America and the Caribbean 2024."

### Company & Platform Sources

16. **EBANX**. "Global companies see 33% monthly growth in transaction volume from Latin American mobile platform." February 2025.
17. **R2.co**. "Embedded Credit in Action: Empowering tech platforms to unlock SMB potential in LATAM." 2025.
18. **Rebill**. "Nequi: A digital wallet that has evolved into a neobank." 2024.
19. **Rebill**. "SPEI: The promise of instant payments in Mexico." 2024.
20. **Acción**. "Instant payments: Connecting and transforming Colombia's financial ecosystem." October 2025.
21. **Visa**. "Visa Empowers Small Businesses in Latin America & Caribbean." August 2025.
22. **J.P. Morgan**. "How Latin America is Redefining Cross-Border Payments." 2025.
23. **J.P. Morgan/OmniLatam**. "Latin American fintech alliance increases access to working capital." 2026.

### Regulatory & Compliance

24. **SUNAT**. Superintendency Resolution No. 300-2014/SUNAT (e-invoicing framework).
25. **SUNAT**. Resolution No. 03-2023/SUNAT (3-day submission deadline).
26. **BCRP**. Circular No. 0024-2022-BCRP (interoperability mandate).
27. **ecosio**. "Peru E-invoicing Explained." December 2025.
28. **EDICOM**. "Electronic Invoice in Peru." March 2026.
29. **Ozone API**. "The Status of Open Finance in Latin America in 2025." August 2025.
30. **Noda.live**. "Open Banking in Latin America." July 2025.

### Fraud & Verification

31. **El Comercio (Peru)**. "Yape falso: ¿cómo reconocer esta modalidad de estafa?" May 2023.
32. **Infobae (Peru)**. "Estafas con 'Yape falso': descubre cómo funciona este fraude." August 2024.
33. **América TV (Peru)**. "¿Cómo te engañan con el Yape falso?" September 2023.
34. **Peru Contable**. "¡Cuidado! Cómo detectar comprobantes falsos en Yape." November 2024.

### Market Data

35. **Statista**. "Yape: number of users in Peru 2023." April 2024.
36. **Statista**. "Mobile wallet users in Colombia, by app 2015-2025." March 2025.
37. **AdraTech Systems**. "Izipay vs Niubiz vs Culqi 2026: Comparativa de Comisiones Perú." January 2026.
38. **eCommerceAcademy.pe**. "Pasarelas de pago en Perú 2025." November 2025.
39. **FinDev Gateway**. "Financial Inclusion in Latin America and the Caribbean." 2025.
40. **Faster Payments Council**. "Pix by the Numbers Q1 2025."

### Academic

41. **Libaque-Saenz, C.F. et al.** "Merchants' typology of digital wallet users in the Peruvian retail sector." Issues in Information Systems, Vol. 26, Issue 3, 2025.
42. **Wikipedia**. "Yape (payment)." Retrieved March 2026.

---

*Document prepared for Yaya Platform strategic planning. All data sourced from publicly available reports, academic papers, and regulatory publications. Revenue projections are illustrative estimates based on market sizing analysis and should be validated with bottom-up financial modeling.*
