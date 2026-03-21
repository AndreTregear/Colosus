# Regulatory Compliance Roadmap — Yaya Platform
## Peru & Colombia Market Entry Analysis

**Document Version:** 1.0  
**Date:** 2026-03-21  
**Classification:** Internal — Strategic Planning  
**Research Level:** PhD-level regulatory and policy analysis

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Fintech Regulatory Sandboxes](#2-fintech-regulatory-sandboxes)
3. [AI Governance & Legislation](#3-ai-governance--legislation)
4. [Data Protection & Privacy](#4-data-protection--privacy)
5. [Electronic Invoicing Compliance](#5-electronic-invoicing-compliance)
6. [Business Messaging & Consumer Protection](#6-business-messaging--consumer-protection)
7. [AML/KYC Requirements](#7-amlkyc-requirements)
8. [Labor Law Implications](#8-labor-law-implications)
9. [Intellectual Property & Data Ownership](#9-intellectual-property--data-ownership)
10. [Data Localization Requirements](#10-data-localization-requirements)
11. [Actionable Compliance Roadmap](#11-actionable-compliance-roadmap)
12. [Risk Matrix](#12-risk-matrix)
13. [Official Regulatory Sources](#13-official-regulatory-sources)

---

## 1. Executive Summary

Yaya Platform operates at the intersection of AI, business messaging (WhatsApp), invoicing automation, and financial data processing for SMEs in Peru and Colombia. This creates a multi-layered regulatory exposure spanning **data protection**, **AI governance**, **fintech regulation**, **tax compliance**, **consumer protection**, **AML/KYC obligations**, **labor law**, and **intellectual property**.

**Key Findings:**

- **Peru enacted the first AI law in Latin America** (Law 31814), with implementing regulations establishing a three-tier risk framework effective December 2025. AI chatbots interacting with consumers may be classified as "limited risk" or "high risk" depending on use case.
- **Peru's data protection law was significantly updated** (Supreme Decree 016-2024-JUS, effective March 30, 2025) with new DPO requirements, breach notification mandates, and phased compliance deadlines through 2028.
- **Peru's SBS regulatory sandbox was reformed** (Resolution SBS N° 04142-2025, November 2025) to allow fintechs, startups, and non-supervised entities to participate — a major shift from the previous regime that admitted only one participant (BCP).
- **Colombia's AI regulation** is pending via PL 43/2025, introduced by the Executive, with a risk-based approach similar to the EU AI Act. The Ministry of Science, Technology, and Innovation would oversee implementation.
- **Electronic invoicing in Peru is fully mandatory** for all taxpayers since 2022, with SIRE system integration completed by July 2025.
- **Neither Peru nor Colombia imposes strict data localization** requirements, but cross-border data transfer restrictions apply under both Ley 29733 (Peru) and Ley 1581 (Colombia).

**Overall Risk Level:** MODERATE — The regulatory environment is evolving rapidly, creating both compliance obligations and opportunities for early movers who build compliance into product architecture.

---

## 2. Fintech Regulatory Sandboxes

### 2.1 Peru — SBS Regulatory Sandbox

**Legal Basis:** Banking Law; Resolution SBS N° 2429-2021 (original); **Resolution SBS N° 04142-2025** (reformed)

**History & Context:**
The original 2021 sandbox was widely criticized for restricting participation to entities already licensed by the SBS. This resulted in only **one participant** — Banco de Crédito del Perú (BCP), which ran the "CriptoCocos" crypto pilot. The regulator acknowledged this as a design failure.

**November 2025 Reform — Key Changes:**
- **Open to non-supervised entities:** Fintechs, startups, cooperatives, AFOCAT, and technology platforms can now apply
- **Two entry pathways:** (1) SBS-initiated open calls, or (2) formal applications from companies
- **Pilot duration:** Up to **18 months**, renewable for **12 months** (total 30 months maximum)
- **Two regulatory regimes:** "Flexibility" regime (for existing activities needing regulatory relaxation) and "Extraordinary" regime (for activities not contemplated in current regulations)
- **All entities must be formally constituted**
- **Sandbox participation ≠ operating authorization** — it does not constitute a license

**Relevance to Yaya:** If Yaya's payment verification or financial data processing features touch on activities regulated by the SBS, the sandbox provides a pathway to test models without full licensing. However, if Yaya operates purely as a SaaS automation tool (not handling funds directly), sandbox participation may not be necessary.

**Action Item:** Conduct a detailed activity mapping to determine whether any Yaya features constitute "financial intermediation" or "securities intermediation" under Peruvian law. If not, Yaya can operate without SBS authorization but must still register with UIF-Peru for AML compliance if applicable.

### 2.2 Colombia — SFC Regulatory Sandbox (InnovaSFC)

**Legal Basis:** Decree 1234 of 2020 (Regulatory Sandbox); Decree 222 of 2020 (Banking as a Service)

**Structure:**
Colombia launched Latin America's **first regulatory sandbox** in May 2018 through the SFC's InnovaSFC working group. It has two components:

1. **Supervision Sandbox (Arenera SFC):** Established 2018 for experimentation under existing SFC supervision
2. **Regulatory Sandbox (Espacio Controlado de Prueba — ECP):** For testing innovations requiring regulatory dispensation

**Graduated Projects Include:**
- **Ualet** (digital collective investment fund access)
- **Asobancaria** (digital identity verification)
- **Tpaga** (e-wallet backed by money market funds)
- **Tyba** (simplified access to collective investment funds)

**Sandbox Challenge 2022 Winners:** Agrapp (collaborative agricultural financing), Inverti (crowdlending), Virtuabastos (agricultural contracts trading platform)

**Process:**
- Open to fintechs worldwide, both SFC-supervised and non-supervised
- Selected projects receive **BID-funded technical and legal advisory**
- Winners receive a **Certificado de Operación Temporal (COT)** for up to **2 years**
- Application via innovasfc@superfinanciera.gov.co

**National Development Plan Enhancement:** Fintech companies can obtain a **temporary operating certificate** with minimum capital and conditions, operating in a two-year window before obtaining a full license.

**Relevance to Yaya:** Colombia's sandbox is more mature and accessible. If Yaya expands into financial services territory in Colombia, the InnovaSFC pathway is well-established with documented success stories.

### 2.3 Peru — No Dedicated Fintech Law

Unlike Mexico (Ley Fintech 2018) or Chile, **Peru does not have a comprehensive fintech law**. Regulation is fragmented across multiple authorities:

| Authority | Jurisdiction |
|-----------|-------------|
| **SBS** | Banking, insurance, pensions, AML |
| **SMV** | Securities markets, crowdfunding |
| **BCRP** | Payment systems, interoperability, digital wallets |
| **INDECOPI** | Consumer protection, competition |
| **ANPD** | Data protection |
| **UIF-Peru** | Financial intelligence, AML/CFT |

**Crowdfunding:** Regulated by SMV (Resolution SMV N° 021-2017-SMV/01 and DU N° 013-2020). Only two fully operational platforms exist (Inversiones.io and Prestopolis). Platform minimum capital: S/ 300,000.

**Online Lending:** Companies not collecting public savings don't need SBS authorization but must register in the "Register of Companies and Persons Engaged in Financial or Currency Exchange Operations." Must observe BCRP maximum interest rates.

---

## 3. AI Governance & Legislation

### 3.1 Peru — Law 31814 (Enacted)

**Status:** ✅ **ENACTED** — Peru is the first country in Latin America to pass an AI-specific law.

**Law 31814** promotes the use of AI for economic and social development. Draft implementing regulations were published for public consultation in September 2025, establishing:

**Three-Tier Risk Framework:**

| Risk Level | Description | Obligations |
|-----------|-------------|------------|
| **Prohibited** | Manipulative practices, autonomous weapons, unauthorized mass surveillance, predictive policing | Banned outright |
| **High Risk** | Biometric identification, critical infrastructure security, educational admissions, **employment decisions**, healthcare, financial services | Enhanced oversight, transparency, human intervention capability, documentation, pre-launch checks |
| **Low Risk** | All others | Basic compliance with general principles |

**Key Requirements for AI Systems:**
- **Transparency:** Automated decisions must be explained in clear language
- **Human oversight:** Trained personnel must be able to override AI decisions
- **12 guiding principles** including Internet governance, copyright respect, privacy-by-design
- **INDECOPI** supervises risk levels for consumer-facing AI
- **Presidency of the Council of Ministers** (via Secretariat of Government and Digital Transformation) leads implementation

**Implementation Timeline:**
- Core provisions effective: **December 8, 2025**
- Public entities: Phased 1-4 year compliance schedule
- Private sector: Phased based on sector and company size

**Regulatory sandboxes** and promotion of **open-source AI** technologies are mandated to reduce barriers to entry.

**Yaya Implications:**
- Yaya's AI chatbots interacting with consumers will likely be classified as **"limited risk"** (requiring transparency disclosures and opt-out mechanisms)
- If Yaya makes decisions affecting employment, financial access, or education, those modules could be **"high risk"**
- **Action:** Implement clear AI disclosure notices ("You are interacting with an AI system") and human escalation pathways

### 3.2 Colombia — PL 43/2025 (Pending)

**Status:** 📋 **PENDING** — Introduced by the Executive (Ministry of Science, Technology, and Innovation)

**Key Provisions:**
- **12 guiding principles** including privacy, confidentiality, and economic development promotion
- **Risk-based classification:** Prohibited, High-Risk, Limited Risk, Low Risk
- **High-risk systems:** Those that "significantly impact fundamental rights" or enable "automated decision-making without human oversight" in healthcare, justice, public security, or financial/social services
- **Limited-risk systems:** Those with "indirect effects on personal or economic decisions" — includes AI for personal assistance, recommendation engines, content generation, and systems simulating human interaction
- **Transparency obligations** for limited-risk systems: disclose AI interaction, clear information, allow opt-out/deactivation
- **Impact assessments** for high-risk systems
- **National Registry** for high-risk AI systems
- **Ministry of Science, Technology, and Innovation** leads implementation
- **SIC** (Superintendence of Industry and Commerce) enforces via audits and investigations
- **Tax benefits** for AI-based solutions
- **Regulatory sandboxes** explicitly included
- **IP protection:** Ministry to provide legal/technical assistance for AI researchers to leverage patents and copyright

**SIC Already Active:** Circular 002 of 2024 addresses AI systems; Circular 001 of 2025 addresses Fintech operations and biometric processing.

**Yaya Implications:**
- Yaya's WhatsApp chatbots would likely fall under **"limited risk"** — requiring transparency and opt-out capabilities
- If Yaya processes biometric data or makes financial decisions, enhanced compliance required
- **Action:** Monitor PL 43/2025 progress; begin building compliance features proactively

---

## 4. Data Protection & Privacy

### 4.1 Peru — Ley 29733 (Updated 2025)

**Primary Law:** Law No. 29733, Personal Data Protection Law (2011)  
**New Regulation:** Supreme Decree No. 016-2024-JUS (published November 30, 2024; **effective March 30, 2025**)  
**Authority:** Autoridad Nacional de Protección de Datos Personales (ANPD)

**Major 2025 Changes:**

| Feature | Requirement |
|---------|------------|
| **Territorial Scope** | Now applies to foreign companies serving Peruvian customers or analyzing behavior of individuals in Peru; must appoint local representative |
| **Security Standards** | ISO/IEC 27001 alignment required |
| **Breach Notification** | **NEW** — Must report incidents to ANPD and affected individuals |
| **DPO Requirement** | **NEW** — Phased by company size (see below) |
| **Database Registration** | Free registration with ANPD |
| **Consent** | Prior, informed, express, unequivocal; written for sensitive data |
| **Cross-Border Transfers** | Only to countries with adequate protection, via formal written binding contract |

**DPO Appointment Deadlines:**

| Company Size (Annual Revenue) | Deadline |
|-------------------------------|----------|
| Large (>2,300 UIT / ~$3.28M) | November 30, 2025 |
| Medium (1,700-2,300 UIT) | November 30, 2026 |
| Small (150-1,700 UIT) | November 30, 2027 |
| Micro (<150 UIT) | November 30, 2028 |

**ARCO Rights:** Access, Rectification, Cancellation, Opposition — must respond within 20 business days (extendable by 20 more).

**Penalties:**
- Minor infractions: up to ~$7,000
- Serious infractions: up to ~$70,000
- Maximum fines: up to ~$120,500

**Yaya Compliance Obligations:**
1. Register all databases with ANPD (free)
2. Implement ISO/IEC 27001-aligned security measures
3. Obtain explicit consent before processing business customer data
4. Develop and publish a clear privacy policy in Spanish
5. Establish ARCO rights response procedures
6. Implement breach notification procedures
7. Appoint DPO per revenue-based timeline
8. Create a Security Document with access management procedures

### 4.2 Colombia — Ley 1581 of 2012

**Primary Law:** Statutory Law 1581 of 2012 (General Data Protection)  
**Financial Data:** Law 1266 of 2008 (Financial Habeas Data)  
**Implementing Decrees:** Decree 1377/2013, Decree 886/2014, Decree 090/2018  
**Authority:** Superintendencia de Industria y Comercio (SIC)

**Key Requirements:**

| Feature | Requirement |
|---------|------------|
| **Constitutional Foundation** | Article 15 — Habeas Data is a fundamental right |
| **Consent** | Prior, express, and informed; proof of authorization required on demand |
| **Data Categories** | Public, Semi-Private, Private (consent required), Sensitive (processing generally prohibited) |
| **RNBD Registration** | Mandatory for entities with assets >100,000 UVT (~$1.1M USD); annual updates by March 31 |
| **Breach Notification** | Within **15 business days** of detection |
| **Privacy Policy (PDTP)** | Mandatory; must include all processing purposes, rights, procedures |
| **Cross-Border Transfers** | Prohibited to countries without adequate protection unless SIC Declaration of Conformity obtained |
| **DPO** | Strongly recommended (not yet mandatory) |
| **Biometric Processing** | Circular 001/2025 requires proportionality and enhanced security |

**Penalties:**
- Up to 2,000 minimum monthly wages (~$519,200 USD)
- Criminal penalties: 48-96 months prison for unauthorized data processing (Criminal Code §269F)
- $214M fine precedent: e-commerce firm penalized for mandatory facial recognition

**Recent SIC Enforcement Focus (2024-2026):**
- AI systems (Circular 002/2024)
- Fintech operations (Circular 001/2025)
- Biometric data
- High-risk sectors

**Yaya Compliance Obligations:**
1. Develop and publish a Personal Data Treatment Policy (PDTP) in Spanish
2. Implement prior, express, informed consent mechanisms at all data collection points
3. Register databases with RNBD if asset threshold met
4. Submit semi-annual claims reports if RNBD-registered
5. Establish ARCO rights response procedures (10 business day deadline)
6. Implement data transmission agreements with all processors
7. Ensure cross-border transfers only to adequate-protection countries or with Declaration of Conformity

---

## 5. Electronic Invoicing Compliance

### 5.1 Peru — SUNAT E-Invoicing (Fully Mandatory)

**Status:** ✅ **Mandatory for ALL taxpayers** since January 1, 2022

**Legal Framework:** Managed by SUNAT (Superintendencia Nacional de Aduanas y de Administración Tributaria)

**System Architecture:**
- **SEE (Sistema de Emisión Electrónica):** Government-approved issuance system
- **SIRE (Sistema Integrado de Registros Electrónicos):** Integrated electronic records
- **UBL 2.1 XML format** required
- **Digital signature** mandatory on all CPEs (Comprobantes de Pago Electrónicos)
- **24-hour delivery requirement**

**Key Milestones (Completed):**

| Date | Milestone |
|------|-----------|
| January 2010 | Pilot program for large taxpayers |
| January 2022 | Universal mandatory implementation |
| January 2025 | SIRE mandatory for NON-PRICOS |
| July 2025 | SIRE mandatory for PRICOS (Principal Contributors) |

**Document Types:**
- Facturas (B2B/B2G invoices)
- Boletas (B2C receipts with daily summary)
- Credit/debit notes
- Guías de remisión electrónicas (GRE — electronic transport guides)

**Archiving:** 5 years, accessible to SUNAT on request. Suppliers must provide download webpage for 1 year.

**Validation Options:**
- **Direct to SUNAT** via SOL portal
- **PSE** (Proveedor de Servicios Electrónicos) — creates and sends on your behalf
- **OSE** (Operador de Servicios Electrónicos) — validates on SUNAT's behalf, issues CDR

**Yaya Implications:**
- If Yaya automates invoice creation for SMEs, it must integrate with SUNAT's SEE infrastructure
- Generated invoices must comply with UBL 2.1 XML format
- Digital signatures must use SUNAT-accredited certificates
- **Opportunity:** Yaya can add significant value by automating SUNAT-compliant invoice generation for SMEs, particularly informal businesses transitioning to compliance
- **Action:** Integrate with a PSE or become an OSE to validate invoices

---

## 6. Business Messaging & Consumer Protection

### 6.1 WhatsApp Business Messaging — Opt-In Requirements

**No Peru-specific TCPA equivalent exists.** However, Yaya must comply with multiple overlapping frameworks:

**Layer 1 — WhatsApp Business Policy (Global):**
- **Explicit opt-in required** before sending business-initiated messages
- Consent must be **active, specific to WhatsApp, and name the business**
- Previous purchases or contact do NOT constitute consent
- **24-hour customer service window** for replies to customer-initiated conversations
- Must provide **easy opt-out** (STOP/UNSUBSCRIBE keywords)
- Violations can lead to: message blocking, template pausing, account suspension
- **Separate consent** required for marketing vs. transactional messages

**Layer 2 — Peru Data Protection (Ley 29733):**
- Processing personal data (phone numbers, message content) requires prior, informed, express consent
- Customer contact information is personal data under the law
- Must inform about processing purposes before collection
- Right to revoke consent at any time

**Layer 3 — Peru Consumer Protection (INDECOPI):**
- Consumer Protection Code (Law No. 29571)
- INDECOPI enforces fair treatment and product safety
- A bill has been introduced to regulate "digital consumers" with clearer protections for digital platforms
- Identity fraud cases in digital lending are driving stricter KYC and fraud prevention measures

**Layer 4 — Colombia Electronic Marketing (Law 527/1999 + Law 1581/2012):**
- No specific WhatsApp regulation, but data subject consent required for marketing
- SIC enforces; consent must be documented and retrievable
- Cookie/tracking consent also required

**Yaya Compliance Requirements:**
1. Implement explicit WhatsApp opt-in with clear disclosure of message types and frequency
2. Separate transactional consent from marketing consent
3. Include opt-out instructions in every outbound message
4. Maintain timestamped consent records
5. Honor opt-out requests immediately
6. Implement consent verification in chatbot onboarding flows
7. Disclose that user is interacting with AI (per upcoming AI regulations)

### 6.2 Consumer Protection for AI Chatbots in LATAM

Both Peru's Law 31814 and Colombia's pending PL 43/2025 address AI-consumer interaction:

- **Transparency:** Users must be informed they are interacting with AI
- **Opt-out:** Users must be able to request human assistance
- **Limited-risk classification:** Recommendation engines and human-simulating systems require disclosure
- **Non-discrimination:** AI systems must not produce discriminatory outcomes
- **Chile's parallel bill** provides additional guidance: transparency obligations for limited-risk AI include informing users "in a timely, clear, and intelligible manner"

---

## 7. AML/KYC Requirements

### 7.1 Peru — UIF-Peru Framework

**Primary Law:** Law 27693 (2002) — established UIF-Peru (Unidad de Inteligencia Financiera)  
**Implementing Decree:** Supreme Decree 018-2006-JUS  
**VASP Regulation:** SBS Resolution N° 02648-2024

**Key Requirements:**

| Obligation | Detail |
|-----------|--------|
| **Registration** | Online lending platforms, exchange houses, and digital wallets must register with UIF-Peru |
| **Transaction Reporting** | Operations ≥ USD $10,000 (or PEN equivalent) must be reported |
| **Suspicious Activity Reports** | Mandatory for all supervised entities |
| **KYC/CDD** | Customer due diligence, identity verification using DNI |
| **Travel Rule** | VASPs must implement by **November 2026** (FATF-aligned) |
| **Compliance Officer** | Required for supervised entities |
| **VASP-specific** | KYC for transactions >$1,000; 120-day compliance window from resolution |

**Yaya Assessment:** If Yaya **does not handle funds directly** (i.e., does not collect payments, make transfers, or hold deposits), it likely falls outside mandatory UIF-Peru registration. However, if Yaya's payment verification features touch payment flows or provide data that enables financial decisions, it may trigger "reporting entity" obligations. 

**Action:** Obtain formal legal opinion on whether Yaya's specific feature set triggers UIF-Peru reporting obligations.

### 7.2 Colombia — SARLAFT Framework

Colombia's AML framework (SARLAFT — Sistema de Administración del Riesgo de Lavado de Activos y Financiación del Terrorismo) applies to financial institutions and reporting entities. Unauthorized fundraising is a **criminal offense** under the Colombian Criminal Code.

**Key Points for Yaya:**
- If Yaya does not collect or intermediate funds, direct AML obligations are limited
- However, partnerships with Colombian financial institutions will require demonstrating adequate AML/CFT controls
- Debt and equity crowdfunding platforms must comply with Decree 1357/2018

---

## 8. Labor Law Implications

### 8.1 If Yaya Replaces Workers

**Peru:**
- **No specific law prohibiting AI displacement** of workers
- However, standard labor protections apply: wrongful termination claims, severance obligations
- Peru's labor market has **>70% informality**, creating natural "protection" against rapid displacement
- Law 31814 classifies "employment selection and worker evaluation" as **high-risk AI applications**, requiring transparency, human oversight, and documentation
- **MYPE regime** allows special labor treatment for micro/small enterprises
- Companies transitioning workers must provide **compensation equivalent to two monthly salaries per year of service** (under certain restructuring provisions)

**Colombia:**
- **Law 2101 of 2021:** Progressive reduction of working hours from 48 to 42 hours/week (third phase in 2025)
- **Law 2452 of 2025:** New Labor and Social Security Procedural Code (effective April 2026)
- Strong worker protections: reinforced stability for pregnant partners' employees (Constitutional Court C-517/2024)
- **Decree 405 of 2025:** Penalties for dismissing sexual harassment victims
- Social security contributions for contractors must be managed by contracting company

**Yaya Risk Assessment:**
- Yaya's value proposition is **augmenting** SME capacity, not replacing employees in large organizations
- Risk is low if positioned as a productivity tool for business owners (not a workforce reduction tool)
- **Recommendation:** Marketing and legal documentation should emphasize Yaya as an **assistant and augmentation tool**, not a replacement for human workers
- If client businesses use Yaya to reduce staff, Yaya has no direct liability — but reputational risk exists

### 8.2 Data Protection in Employment Context

Both Peru's updated Ley 29733 and Colombia's Ley 1581 impose specific requirements on processing employee data:
- Failure to fully inform employees about data processing: up to **~$70,000 fine** (Peru)
- AI-powered HR tools (hiring, evaluation) are classified as **high-risk** under Peru's Law 31814
- Employers must maintain transparency about AI use in workplace decisions

---

## 9. Intellectual Property & Data Ownership

### 9.1 Who Owns Business Data Processed by Yaya?

**General Principle (Both Jurisdictions):**
Under both Peruvian and Colombian law, **the business (data controller) retains ownership of its data**. The SaaS provider (Yaya) is a **data processor** — authorized to process data only according to the controller's instructions and the terms of the service agreement.

**Key Considerations:**

| Aspect | Recommendation |
|--------|---------------|
| **Customer Data** | Explicitly state in ToS that all customer-uploaded data belongs to the customer |
| **Yaya IP** | All software code, algorithms, AI models, and platform infrastructure are Yaya's IP |
| **Derived Insights** | Anonymized/aggregated analytics can be retained by Yaya if disclosed in privacy policy and consented to |
| **Training Data** | If Yaya uses customer data to train AI models, this must be explicitly disclosed and consented to |
| **Data Portability** | Customers should be able to export their data in standard formats |
| **Termination** | Upon contract termination, customer data must be returned/deleted per contract terms |

**Peru-specific:**
- Peru's copyright law (Legislative Decree 822) protects original works including software
- Data compilations with original selection/arrangement are protectable
- Raw factual business data (invoices, transactions) is not subject to copyright — it belongs to the generating business

**Colombia-specific:**
- Colombia's copyright law (Law 23 of 1982, updated by Law 1915 of 2018) protects software as literary works
- Decision 351 of the Andean Community provides regional IP framework
- PL 43/2025 (pending AI law) would provide Ministry assistance for AI researchers to leverage patents/copyright
- AI-generated content IP ownership remains legally ambiguous — no specific legislation yet

**Yaya Action Items:**
1. Draft clear Terms of Service establishing data ownership (customer owns data, Yaya owns platform)
2. Include data processing agreement as required by both Ley 29733 and Ley 1581
3. If using customer data for AI model training, implement explicit opt-in with clear disclosure
4. Provide data export functionality
5. Register Yaya's software and branding as IP in both jurisdictions

---

## 10. Data Localization Requirements

### 10.1 No Strict Data Localization in Either Jurisdiction

**Peru:**
- No requirement that data must physically reside in Peru
- Cross-border transfers allowed if destination country has **adequate protection level** (determined by ANPD)
- Alternatively: formal written binding contract with adequate safeguards
- Transfer must be communicated to data subjects
- New 2025 regulation expands territorial scope to cover foreign companies processing data of Peruvians

**Colombia:**
- No data localization mandate
- Cross-border transfers prohibited to countries without **adequate protection** (determined by SIC)
- Countries recognized include: EU member states, Argentina, Canada, US (limited frameworks)
- **Declaration of Conformity** required for transfers to non-adequate countries
- Data **transmissions** (to processors) have lighter requirements than data **transfers** (to independent controllers)
- Contracts with foreign processors must include: scope, activities, and processor obligations

**Practical Implication for Yaya:**
- Yaya can host infrastructure in the US or EU without violating data localization rules
- **However:** Must implement contractual safeguards for cross-border transfers
- **Best Practice:** Host data in a region recognized as adequate by both ANPD and SIC (EU or US with appropriate agreements)
- Maintain documentation of all cross-border data flows
- Consider regional hosting (e.g., AWS São Paulo or Bogotá region) for performance and compliance signaling

---

## 11. Actionable Compliance Roadmap

### Phase 1: Foundation (Months 1-3) — CRITICAL

| # | Action | Jurisdiction | Priority |
|---|--------|-------------|----------|
| 1.1 | Draft Privacy Policy / PDTP in Spanish covering both PE & CO requirements | Both | 🔴 Critical |
| 1.2 | Implement WhatsApp opt-in flow with separate transactional/marketing consent | Both | 🔴 Critical |
| 1.3 | Add AI interaction disclosure to all chatbot conversations | Both | 🔴 Critical |
| 1.4 | Register databases with Peru's ANPD (free) | Peru | 🔴 Critical |
| 1.5 | Establish ARCO/Habeas Data rights response procedures | Both | 🔴 Critical |
| 1.6 | Draft Terms of Service with clear data ownership provisions | Both | 🔴 Critical |
| 1.7 | Implement human escalation pathway in chatbot flows | Both | 🟡 High |
| 1.8 | Obtain legal opinion on UIF-Peru reporting obligations | Peru | 🟡 High |

### Phase 2: Technical Compliance (Months 4-6)

| # | Action | Jurisdiction | Priority |
|---|--------|-------------|----------|
| 2.1 | Implement ISO/IEC 27001-aligned security measures | Peru | 🔴 Critical |
| 2.2 | Build SUNAT SEE integration for invoice generation (UBL 2.1 XML) | Peru | 🔴 Critical |
| 2.3 | Implement breach notification procedures (ANPD + SIC) | Both | 🟡 High |
| 2.4 | Create Security Document per Peru's new regulation | Peru | 🟡 High |
| 2.5 | Implement consent management system with audit trail | Both | 🟡 High |
| 2.6 | Build data export functionality for customer portability | Both | 🟡 High |
| 2.7 | Register with RNBD (Colombia) if asset threshold met | Colombia | 🟢 Medium |

### Phase 3: AI Governance (Months 7-9)

| # | Action | Jurisdiction | Priority |
|---|--------|-------------|----------|
| 3.1 | Conduct AI risk classification assessment per Law 31814 | Peru | 🔴 Critical |
| 3.2 | Document AI system capabilities, limitations, and decision-making logic | Both | 🟡 High |
| 3.3 | Implement bias monitoring for AI-driven features | Both | 🟡 High |
| 3.4 | Build explainability features for AI recommendations | Both | 🟡 High |
| 3.5 | Prepare for Colombia AI registry if PL 43/2025 passes | Colombia | 🟢 Medium |

### Phase 4: Scaling & Monitoring (Months 10-12+)

| # | Action | Jurisdiction | Priority |
|---|--------|-------------|----------|
| 4.1 | Appoint DPO per Peru's phased schedule | Peru | 🟡 High |
| 4.2 | Evaluate SBS sandbox participation for financial features | Peru | 🟢 Medium |
| 4.3 | Monitor Colombia AI law (PL 43/2025) progress | Colombia | 🟢 Medium |
| 4.4 | Conduct annual data protection audit | Both | 🟡 High |
| 4.5 | Update privacy policies for regulatory changes | Both | 🟡 High |
| 4.6 | Register IP (trademarks, software copyright) in both jurisdictions | Both | 🟢 Medium |

---

## 12. Risk Matrix

| Risk Area | Peru | Colombia | Severity | Likelihood | Mitigation |
|-----------|------|----------|----------|-----------|------------|
| **AI Regulation Non-Compliance** | Law 31814 effective | PL 43/2025 pending | High | Medium | Implement transparency & human oversight now |
| **Data Protection Violation** | Fines up to $120K | Fines up to $519K + criminal | High | Medium | Privacy-by-design; DPO appointment |
| **WhatsApp Account Suspension** | N/A (platform risk) | N/A (platform risk) | High | Low | Strict opt-in; quality monitoring |
| **AML/KYC Exposure** | UIF-Peru registration | SARLAFT compliance | Medium | Low | Legal opinion; avoid handling funds |
| **E-Invoicing Non-Compliance** | SUNAT penalties | N/A | Medium | Medium | Integrate PSE/OSE |
| **Labor Displacement Claims** | Low (augmentation tool) | Low | Low | Low | Positioning as productivity tool |
| **IP Disputes** | Data ownership ambiguity | Data ownership ambiguity | Medium | Low | Clear ToS; data processing agreements |
| **Cross-Border Data Transfer** | ANPD scrutiny | SIC scrutiny | Medium | Medium | Contractual safeguards; adequate-country hosting |

---

## 13. Official Regulatory Sources

### Peru
- **SBS (Superintendencia de Banca, Seguros y AFP):** https://www.sbs.gob.pe/
  - Resolution SBS N° 04142-2025 (Sandbox reform)
  - Resolution SBS N° 2429-2021 (Original sandbox)
  - Resolution SBS N° 02648-2024 (VASP regulation)
- **SMV (Superintendencia del Mercado de Valores):** https://www.smv.gob.pe/
  - Resolution SMV N° 021-2017-SMV/01 (Crowdfunding)
  - DU N° 013-2020 (MIPYME financing)
- **BCRP (Banco Central de Reserva del Perú):** https://www.bcrp.gob.pe/
  - Circular N° 024-2022-BCRP (Payment interoperability)
  - Legislative Decree N° 1665 (Payment systems reform 2024)
- **SUNAT:** https://www.sunat.gob.pe/
  - Resolution N° 000145/2024 (SIRE extension)
  - Resolution N° 000293-2024 (SIRE for NON-PRICOS)
- **ANPD (Autoridad Nacional de Protección de Datos Personales):** https://www.gob.pe/anpd
  - Law No. 29733 (Personal Data Protection Law)
  - Supreme Decree No. 016-2024-JUS (New regulation, effective March 30, 2025)
- **Congress / AI Law:**
  - Law 31814 (AI promotion law)
  - Draft implementing regulations (September 2025)
- **UIF-Peru:** https://www.sbs.gob.pe/prevencion-de-lavado-activos
  - Law 27693 (UIF creation)
  - Supreme Decree 018-2006-JUS (Transaction reporting)
  - Decreto Supremo N° 006-2023-JUS (VASPs as supervised entities)
- **INDECOPI:** https://www.indecopi.gob.pe/
  - Law No. 29571 (Consumer Protection Code)

### Colombia
- **SFC (Superintendencia Financiera de Colombia):** https://www.superfinanciera.gov.co/
  - Decree 1234 of 2020 (Regulatory Sandbox)
  - Decree 222 of 2020 (Banking as a Service)
  - InnovaSFC: innovasfc@superfinanciera.gov.co
- **SIC (Superintendencia de Industria y Comercio):** https://www.sic.gov.co/
  - Law 1581 of 2012 (General Data Protection)
  - Decree 1377 of 2013 (Implementing regulations)
  - External Circular 002/2024 (AI systems)
  - External Circular 001/2025 (Fintech/biometrics)
- **Congress / AI Law:**
  - PL 43/2025 (AI regulation bill, introduced by Executive)
- **Additional Laws:**
  - Law 1266 of 2008 (Financial Habeas Data)
  - Law 1273 of 2009 (Cybercrime)
  - Law 527 of 1999 (Electronic commerce)
  - Decree 2555 of 2010 (Financial regulation compilation)
  - Decree 1357 of 2018 (Crowdfunding)

### International References
- **FATF Recommendations:** https://www.fatf-gafi.org/
- **OECD AI Principles:** https://oecd.ai/en/ai-principles
- **UNESCO AI Ethics Recommendation:** https://www.unesco.org/en/artificial-intelligence/recommendation-ethics
- **FPF Comparative AI Bills (Aug 2025):** https://fpf.org/blog/ai-regulation-in-latin-america-overview-and-emerging-trends-in-key-proposals/

---

*This document should be reviewed by qualified legal counsel in both Peru and Colombia before finalizing any compliance strategy. Regulatory environments in both countries are evolving rapidly — quarterly reviews recommended.*

**Next Document:** `03-go-to-market-strategy.md` — Market entry sequencing based on regulatory readiness
