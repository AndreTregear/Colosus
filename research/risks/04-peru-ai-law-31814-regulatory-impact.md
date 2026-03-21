# Peru's AI Law (Ley 31814) & DS 115-2025-PCM: Regulatory Impact on Yaya Platform
## What Peru's Pioneering AI Regulation Means for Conversational AI Business Tools

**Classification:** Regulatory Research — AI Compliance Analysis  
**Date:** March 21, 2026  
**Sources:** Gobierno del Perú (gob.pe, March 2026), DS 115-2025-PCM (September 2025), Ley 31814 (2023), CEPAL AI in LATAM Report (February 2026), Yoel Molina LAC AI Regulation Analysis (November 2025), Demarest Brazil AI Bill Analysis (March 2026)

---

## Executive Summary

Peru is one of the first countries in Latin America to have both an AI law (Ley N.º 31814, enacted 2023) **and** its implementing regulations (Decreto Supremo N.º 115-2025-PCM, approved September 9, 2025). This makes Peru's AI regulatory environment more advanced than Brazil (where Bill 2,338/2023 is still moving through the Chamber of Deputies), Mexico (dozens of competing bills, no unified law), and most other LATAM countries.

For Yaya Platform, this regulatory landscape creates **both significant opportunity and manageable compliance obligations**. The law explicitly includes provisions to support MIPYMEs (micro, small, and medium enterprises) in AI adoption, creates regulatory sandbox mechanisms, and classifies AI systems by risk level. Yaya's core functions — invoicing, scheduling, inventory management — likely fall under **low to moderate risk**, while any future credit scoring or financial decision-making features would require **high-risk compliance**.

**Key finding:** Peru's AI law is an **asset, not a liability** for Yaya. It creates a regulatory moat (compliance complexity deters casual entrants), provides government-backed innovation support for MIPYMEs, and positions Yaya as a responsible AI provider in a market where regulatory trust matters.

---

## 1. The Regulatory Framework: Ley 31814 + DS 115-2025-PCM

### 1.1 Overview

Peru's AI regulatory stack consists of two primary instruments:

| Instrument | Date | Function |
|---|---|---|
| **Ley N.º 31814** | Enacted 2023 | Framework law promoting AI for economic/social development |
| **DS 115-2025-PCM** | September 9, 2025 | Implementing regulations (Reglamento) with specific obligations |

**Governing Authority:** Presidencia del Consejo de Ministros (PCM) through the Secretaría de Gobierno y Transformación Digital (SGTD), which serves as the national technical-normative authority for AI governance.

The law declares it in the national interest to promote:
- Digital talent leveraging emerging technologies
- AI use for improving public services, education, health, and other sectors
- The SGTD must submit an **annual report to Congress** on AI implementation progress

### 1.2 Six Guiding Principles

The law establishes six foundational principles for AI development and use:

1. **Risk-Based Security Standards** — Promotes a risk-based approach to AI use and development
2. **Multi-Stakeholder Participation** — Encourages participation from individuals, businesses, organizations, and public/private institutions
3. **Internet Governance** — Promotes development and application of principles, norms, and rules governing internet evolution
4. **Digital Society** — Values information and knowledge from digital technologies for social and economic welfare
5. **Ethical Development for Responsible AI** — Ethics as the fundamental basis for identifying responsibilities in AI systems
6. **AI Privacy** — AI must not transgress personal privacy; must act securely for positive citizen impact

### 1.3 Risk Classification System

The regulations define a tiered risk classification system:

| Risk Level | Description | Yaya Relevance |
|---|---|---|
| **Prohibited** | Uses that violate fundamental rights | Not applicable to Yaya |
| **High Risk** | AI in health, education, justice, finance, basic services | Credit scoring, financial analytics features |
| **Moderate Risk** | AI affecting decisions but with human oversight | Business management recommendations |
| **Low Risk** | AI for routine automation and efficiency | Invoicing, scheduling, inventory |

**Critical point:** High-risk AI systems require:
- Mandatory human supervision
- Impact assessments
- Updated records of data sources, algorithm logic, and social/ethical impacts
- Compliance with NTP-ISO/IEC 42001:2025 (AI management systems standard)

---

## 2. Obligations for Private Sector Companies

### 2.1 General Obligations (All AI Systems)

Companies developing or implementing AI must:

1. **Maintain updated records** on high-risk system operations, data sources used, algorithm logic, and social/ethical impacts
2. **Implement internal policies and protocols** for security, privacy, transparency, and accountability
3. **Promote training and awareness** of AI risks and ethics among their teams
4. **Guarantee human supervision** in high-risk systems affecting fundamental rights in health, education, justice, finance, and basic services

### 2.2 Yaya-Specific Compliance Analysis

| Yaya Feature | Risk Classification | Required Actions |
|---|---|---|
| Appointment scheduling | **Low** | Standard privacy protocols |
| Inventory management | **Low** | Standard data handling |
| Invoice generation (SUNAT) | **Low-Moderate** | Records of algorithm logic for tax calculations |
| Business analytics/reporting | **Moderate** | Human oversight for recommendations |
| Credit scoring (future) | **HIGH** | Full impact assessment, human supervision, NTP-ISO/IEC 42001, algorithm transparency |
| Financial decision support | **HIGH** | Full compliance stack required |

**Strategic implication:** Yaya's current MVP features (scheduling, invoicing, inventory) fall in the low-risk category with minimal compliance overhead. The future fintech features (credit scoring, lending recommendations) will require significant additional compliance work — but this is **exactly the moat** that prevents competitors from easily adding financial features.

---

## 3. MIPYME Support Provisions

### 3.1 Government-Backed Innovation Support

The regulations explicitly incorporate:

- **Regulatory sandboxes** (entornos de prueba controlada) for testing AI systems in controlled environments
- **Innovation laboratories** to promote AI experimentation
- **Specific MIPYME support measures**, coordinated with the Ministerio de Producción (PRODUCE)
- **Progressive, scaled implementation timelines** adapted to different actors' capacities and resources

### 3.2 What This Means for Yaya

Peru's government is actively creating infrastructure to help startups like Yaya:

1. **Regulatory sandbox access** — Yaya could apply to test its AI business management system in a government-supervised environment, gaining credibility and regulatory approval
2. **PRODUCE coordination** — The Ministry of Production is specifically tasked with supporting MIPYME AI adoption, potentially creating partnerships or grant opportunities
3. **Progressive timelines** — Smaller companies get more time to comply, reducing Yaya's early-stage regulatory burden
4. **Government endorsement** — Being compliant with Peru's AI law positions Yaya as a trustworthy provider vs. unregulated competitors

### 3.3 The Regulatory Sandbox Opportunity

The sandbox provision is particularly strategic for Yaya:

- **Credibility signal**: "Yaya operates within Peru's AI regulatory sandbox" is a powerful trust signal for micro-business owners who are skeptical of AI
- **Investor appeal**: Regulatory sandbox participation demonstrates maturity and compliance-readiness, important for the "flight to quality" investor environment documented in strategy/12
- **Data access**: Sandbox participation could provide access to government datasets or validation environments
- **First-mover advantage**: Few LATAM AI startups are positioned to take advantage of Peru's sandbox framework yet

---

## 4. LATAM Regulatory Context: Peru vs. Peers

### 4.1 Comparative Regulatory Maturity

| Country | AI Law Status | Implementing Regulations | Enforcement Body |
|---|---|---|---|
| **Peru** | ✅ Enacted (Ley 31814, 2023) | ✅ Approved (DS 115-2025-PCM, Sep 2025) | SGTD/PCM |
| **Brazil** | ⏳ Bill 2,338/2023 in Chamber of Deputies | ❌ Not yet | ANPD (interim guidance) |
| **Chile** | ⏳ Draft AI bill + updated national policy | ❌ Not yet | N/A |
| **Colombia** | 📋 CONPES 4144 (policy, not law) | N/A (policy only) | N/A |
| **Mexico** | ⏳ Multiple competing bills, no unified law | ❌ Not yet | N/A |
| **Argentina** | ⏳ Proposals including AI system registry | ❌ Not yet | N/A |
| **Ecuador** | ✅ AI Regulation for data protection (2026) | ✅ SPDP regulation | Data Protection Authority |

**Peru's advantage:** Being one of only two LATAM countries (alongside Ecuador's narrower data-protection-focused regulation) with both a law AND implementing regulations gives Peru — and Yaya — a first-mover advantage in regulated AI deployment.

### 4.2 Brazil's Pending AI Law: Implications for Yaya's Expansion

Brazil's Bill 2,338/2023 is risk-based (similar to Peru's framework) and includes:
- Mandatory AI Impact Assessments for high-risk systems
- Strict liability for consumer-facing AI failures
- Registration and certification requirements
- ANPD as the regulatory authority

When Brazil's law passes (expected 2026-2027), Yaya's compliance experience in Peru will translate directly, giving a competitive advantage vs. local Brazilian entrants starting from scratch.

**New bills in February 2026:**
- **Bill 704/2026**: Focuses AI on anti-corruption and reducing inequalities
- **Bill 762/2026**: Requires AI Impact Assessments for high-impact systems, mandatory certification, strict liability for consumer harm

### 4.3 The CEPAL/ECLAC Landscape

According to CEPAL's 2026 analysis, at least **272 AI systems** are deployed in the public sector across 20 LATAM countries. Key finding: "use now, ask questions later" is the dominant approach. Yaya's compliance-first approach positions it against this trend — a differentiator for risk-conscious businesses and investors.

---

## 5. Compliance Roadmap for Yaya Platform

### 5.1 Phase 1: MVP Launch (Current Features)

| Action | Timeline | Effort |
|---|---|---|
| Draft internal AI ethics policy | Pre-launch | Low |
| Document algorithm logic for invoicing/scheduling | Pre-launch | Low |
| Implement basic privacy-by-design in data handling | Pre-launch | Medium |
| Create transparency disclosures for WhatsApp users | Pre-launch | Low |
| Register with SGTD digital ecosystem (if required) | Month 1-2 | Low |

**Estimated cost:** Minimal — these are documentation and process steps, not technical rebuilds

### 5.2 Phase 2: Growth Features

| Action | Timeline | Effort |
|---|---|---|
| Apply for regulatory sandbox participation | Month 3-6 | Medium |
| Implement human-in-the-loop for business recommendations | Month 3-6 | Medium |
| Build audit trail for AI-generated outputs | Month 3-6 | Medium |
| Engage with PRODUCE MIPYME support programs | Month 3-6 | Low |

### 5.3 Phase 3: Fintech Features (Credit Scoring, Lending)

| Action | Timeline | Effort |
|---|---|---|
| Conduct full AI Impact Assessment | Pre-feature launch | High |
| Implement NTP-ISO/IEC 42001:2025 management system | Pre-feature launch | High |
| Establish mandatory human supervision mechanisms | Pre-feature launch | High |
| Document data sources, algorithm logic, social impacts | Ongoing | High |
| Prepare for SBS (financial regulator) coordination | Pre-feature launch | High |

**Estimated cost:** Significant — but this compliance investment is itself a moat. Competitors wanting to offer similar fintech features must make the same investment.

---

## 6. Risk Assessment

### 6.1 Regulatory Risks

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Yaya classified as high-risk for invoicing features | Low | Medium | Document that invoicing follows SUNAT rules, not autonomous decisions |
| Regulatory sandbox application rejected | Low | Low | Continue operations normally; sandbox is optional |
| Enforcement action for non-compliance | Very Low | High | Proactive compliance from day one |
| Regulation changes making compliance harder | Medium | Medium | Progressive timelines give adaptation windows |
| Cross-border compliance complexity (expansion) | Medium | Medium | Peru experience prepares for Brazil/Colombia laws |

### 6.2 Regulatory Opportunities

| Opportunity | Probability | Impact | Action |
|---|---|---|---|
| Sandbox participation provides credibility | High | High | Apply early |
| PRODUCE grants/support for MIPYME AI | Medium | High | Engage with PRODUCE |
| Compliance differentiator vs. competitors | High | Medium | Market as "regulatory-compliant AI" |
| Peru experience translates to Brazil expansion | High | High | Document compliance processes |
| Government partnership opportunities | Medium | High | Position as MIPYME AI compliance solution |

---

## 7. Strategic Recommendations

### 7.1 For Andre

1. **Peru's AI law is your friend, not your enemy.** The regulatory framework explicitly supports MIPYMEs, creates innovation sandboxes, and establishes progressive timelines. Yaya's current features are low-risk. The compliance burden is minimal for the MVP.

2. **Apply for the regulatory sandbox early.** Being in a government-supervised AI sandbox is a massive credibility signal for both customers and investors. Few companies are taking advantage of this yet.

3. **The fintech moat is real.** High-risk classification for financial features means any competitor wanting to add credit scoring or lending to a WhatsApp bot needs full AI Impact Assessments, NTP-ISO/IEC 42001 compliance, and human oversight mechanisms. This is expensive and complex — exactly the barrier Yaya wants between itself and imitators.

4. **Use compliance in your investor pitch.** "We operate within Peru's AI regulatory framework — one of only two fully enacted AI laws in Latin America" differentiates Yaya from the "move fast and break things" competitors.

5. **Coordinate with PRODUCE.** The Ministry of Production is specifically tasked with supporting MIPYME AI adoption. This could mean grants, partnerships, pilot programs, or government endorsements.

### 7.2 One-Line Investor Pitch Addition

*"Peru enacted Latin America's most comprehensive AI law in 2023 and approved its regulations in September 2025. Yaya is building from day one within this framework — our compliance-first approach creates both credibility with micro-business owners and a regulatory moat against casual entrants."*

---

## 8. Cross-References

- **risks/01-risk-analysis.md** — Update WhatsApp platform risk; add AI regulatory compliance as a new risk category
- **risks/03-regulatory-sandbox-peru-colombia.md** — This document supersedes the sandbox section with Peru-specific regulatory sandbox details under DS 115-2025-PCM
- **strategy/01-gtm-strategy.md** — Add regulatory sandbox application to GTM timeline
- **strategy/05-business-model-canvas.md** — Add regulatory compliance as a key activity
- **technology/06-sunat-nubefact-integration.md** — Cross-reference SUNAT compliance with AI law requirements for invoicing

---

*This document fills a critical gap in the research library. Peru's AI law is one of only a handful of enacted AI regulations in Latin America, and its specific provisions for MIPYMEs, regulatory sandboxes, and risk classification directly impact Yaya's strategy, compliance roadmap, and competitive positioning.*
