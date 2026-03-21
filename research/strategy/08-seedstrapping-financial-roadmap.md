# Yaya Platform: Seedstrapping Financial Roadmap & Unit Economics Model

**Classification:** Strategy — Financial Planning  
**Date:** March 21, 2026  
**Research Cycle:** 6  
**Word Target:** 1,500+  

---

## 1. WHY SEEDSTRAPPING IS YAYA'S OPTIMAL PATH

The LATAM startup ecosystem in 2026 is undergoing a fundamental shift. VC funding grew +13.8% to US$4.1B in 2025, but with **fewer transactions and larger rounds** concentrated in mature companies (Sustainabl, Feb 2026). Only **2 unicorns emerged in 2025** versus 22 in 2021. The brutal reality: **only 15% of LATAM startups survive beyond three years**, primarily due to lack of validation, poor capital management, and absence of clear metrics.

Seedstrapping — raising a small seed round to validate, then growing through revenue rather than continuous fundraising — is the optimal strategy for Yaya because:

1. **Peru's VC market is tiny:** Only $35M in total VC deployed in Peru in 2025 (strategy/06). This is a shield, not a weakness — no well-funded competitor can blitz the market
2. **Yaya's unit economics support it:** 85%+ gross margins with local LLM infrastructure mean early revenue covers costs quickly
3. **AI-native advantage:** ICONIQ's 2025 report shows AI-native companies achieve 56% trial-to-paid conversion rates vs. 32% for traditional SaaS — better bootstrapping prospects
4. **Time > Money:** While VC-backed founders spend 142 days (median) raising seed rounds, Andre can be acquiring customers
5. **Capital efficiency is the new moat:** In a market where 85% of startups die, being capital-efficient is a survival advantage, not a compromise

### The Seedstrapping Model Defined

Per J.P. Morgan's definition (October 2025): "Seed strapping is a startup funding strategy where a company raises a single round of seed funding, then focuses on building a sustainable, positive cash flow business."

Per StartupToScaleup (June 2025): Seedstrapping = $150K-$500K, founder-led control, 12 months to cashflow or traction, speed + signal + focus.

**Yaya's target:** $0 external capital for Phase 1 (Customer Zero + 100-salon pilot), raise $250K-$500K pre-seed/seed only when product-market fit is validated (Month 6-9), then grow through revenue.

---

## 2. PRE-RAISE FINANCIAL MODEL (MONTHS 0-9)

### 2.1 Infrastructure Costs (Already Sunk/Available)

Andre has existing infrastructure that dramatically reduces capital requirements:

| Resource | Status | Monthly Cost | Notes |
|---|---|---|---|
| c.yaya.sh (i9-10900X, 2× RTX A5000, 125GB RAM) | ✅ Owned | ~$50 (electricity) | Runs LLM inference + Whisper STT |
| a.yaya.sh + b.yaya.sh (Debian servers) | ✅ Owned | ~$30 (electricity) | Application servers |
| d.yaya.sh (VPS) | ✅ Active | ~$20/month | Production relay |
| Qwen 3.5-27B (AWQ 4-bit) model | ✅ Deployed | $0 (local) | Via vllm-qwen35 Docker |
| WhatsApp Business API (Cloud API) | To provision | $0.52-3.02/user/month | Service messages free |
| Nubefact (SUNAT invoicing PSE) | To provision | S/70/month (~$19) | 500 documents included |
| Culqi (payment processing) | To provision | $0 setup, 3.44%/txn | Zero monthly fee |
| Domain + hosting | ✅ Active | ~$10/month | yaya.sh ecosystem |
| **Total fixed monthly cost** | | **~$130/month** | Before adding users |

**Critical insight:** Yaya's infrastructure costs are ~$130/month. Most SaaS startups budget $5,700/month in fixed overhead (FinancialModelsLab, 2025). Yaya starts at **44× lower overhead** because of owned hardware and local LLM deployment.

### 2.2 Variable Costs Per User

| Cost Component | Per User/Month | At 100 Users | At 500 Users |
|---|---|---|---|
| WhatsApp API (Cloud API) | $0.52-3.02 | $52-302 | $260-1,510 |
| LLM inference (local) | $0.20 | $20 | $100 |
| Nubefact invoicing (per-doc) | $0.50 (est. 12 docs/user) | $50 | $250 |
| Server bandwidth/storage | $0.10 | $10 | $50 |
| **Total variable COGS** | **$1.32-3.82** | **$132-382** | **$660-1,910** |

### 2.3 Revenue Projections

| Month | Users (Free) | Users (Paid) | Conv. Rate | MRR (S/) | MRR ($) |
|---|---|---|---|---|---|
| 1-2 | 10 | 0 | 0% | S/0 | $0 |
| 3 | 50 | 2 | 4% | S/98 | $26 |
| 4 | 100 | 5 | 5% | S/245 | $66 |
| 5 | 150 | 10 | 7% | S/490 | $132 |
| 6 | 250 | 20 | 8% | S/980 | $264 |
| 7 | 350 | 30 | 9% | S/1,470 | $396 |
| 8 | 450 | 45 | 10% | S/2,205 | $594 |
| 9 | 600 | 60 | 10% | S/2,940 | $792 |

**Assumptions:** S/49/month Starter tier, 10% conversion rate at maturity (conservatively below the AI-native 56% trial-to-paid benchmark but realistic for Peru's price-sensitive market), organic growth through word-of-mouth in beauty salon networks.

### 2.4 Monthly Cash Flow (Pre-Raise)

| Month | Revenue | COGS | Fixed | Net | Cumulative |
|---|---|---|---|---|---|
| 1 | $0 | $0 | $150 | -$150 | -$150 |
| 2 | $0 | $13 | $150 | -$163 | -$313 |
| 3 | $26 | $66 | $150 | -$190 | -$503 |
| 4 | $66 | $132 | $150 | -$216 | -$719 |
| 5 | $132 | $198 | $170 | -$236 | -$955 |
| 6 | $264 | $330 | $170 | -$236 | -$1,191 |
| 7 | $396 | $462 | $190 | -$256 | -$1,447 |
| 8 | $594 | $594 | $190 | -$190 | -$1,637 |
| 9 | $792 | $792 | $200 | -$200 | -$1,837 |

**Total pre-raise cash requirement: ~$2,000** — extraordinarily low because Yaya's infrastructure is already built and the variable costs are minimal with local LLM.

**Even if Andre adds a modest personal cost-of-living burn ($1,500/month in Lima), the total 9-month pre-raise requirement is ~$15,500.** This is fundable from personal savings without external capital.

---

## 3. POST-VALIDATION RAISE (MONTH 9-12)

### 3.1 Raise Timing Triggers

Raise when at least 3 of these are met:
- ✅ 500+ active users (free + paid)
- ✅ 40%+ Sean Ellis "very disappointed" score
- ✅ $500+ MRR from paying customers
- ✅ <4% monthly churn on paid accounts
- ✅ 3+ organic referrals per paying customer

### 3.2 Target Raise: $250K-$500K Pre-Seed

| Parameter | Value |
|---|---|
| Round size | $250K-$500K |
| Instrument | SAFE (post-money) or convertible note |
| Valuation cap | $2M-$3M |
| Dilution | 10-17% |
| Target investors | BVC (Peru/Colombia B2B), Platanus Ventures, Magma Partners (Chile), angel investors from Peruvian tech diaspora |
| Use of funds | See below |
| Timeline to raise | 60-90 days (smaller rounds close faster; LATAM median is faster than US 142-day median) |

### 3.3 Use of Funds

| Category | Amount | % | Purpose |
|---|---|---|---|
| Engineering (1 senior dev, 12 months) | $120K | 40% | Core product development, multi-vertical features |
| Growth & Sales (1 growth lead, 12 months) | $60K | 20% | Salon network expansion, accountant channel |
| WhatsApp API & infrastructure scaling | $30K | 10% | Official API costs at scale, CDN, monitoring |
| Legal & compliance | $15K | 5% | SUNAT homologation, data protection, company formation |
| Marketing & events | $30K | 10% | Beauty industry trade shows, influencer partnerships |
| Reserve / runway buffer | $45K | 15% | 6-month runway extension |
| **Total** | **$300K** | **100%** | **18-month runway post-raise** |

---

## 4. POST-RAISE GROWTH MODEL (MONTHS 9-24)

| Month | Free Users | Paid Users | MRR ($) | Payment Rev ($) | Total Rev ($) | Burn ($) |
|---|---|---|---|---|---|---|
| 9 | 600 | 60 | $792 | $50 | $842 | $200 |
| 12 | 1,500 | 150 | $1,980 | $200 | $2,180 | $12,500 |
| 15 | 3,000 | 350 | $4,620 | $600 | $5,220 | $15,000 |
| 18 | 5,000 | 600 | $7,920 | $1,200 | $9,120 | $18,000 |
| 21 | 8,000 | 1,000 | $13,200 | $2,500 | $15,700 | $20,000 |
| 24 | 12,000 | 1,500 | $19,800 | $4,500 | $24,300 | $22,000 |

**Break-even projected at Month 20-22** (~$18K-$22K monthly burn covered by revenue).

### 4.1 Revenue Mix Evolution

| Revenue Stream | Month 12 | Month 18 | Month 24 |
|---|---|---|---|
| SaaS subscriptions | 91% | 87% | 82% |
| Payment processing (Culqi 1% take rate) | 9% | 13% | 18% |
| Embedded finance | 0% | 0% | 0% (prep) |

### 4.2 Key Metrics at Month 24 (Seed Decision Point)

| Metric | Target | Benchmark |
|---|---|---|
| ARR | $290K | Ventia (LATAM bootstrapped CRM): $360K ARR at Year 4 |
| Paying customers | 1,500 | Across beauty, construction, education verticals |
| Monthly churn | <3.5% | LATAM SMB SaaS avg: 5-8% |
| CAC (blended) | $15-25 | LATAM SMB SaaS: $50-200 |
| LTV (12-month) | $150 | Conservative; increases with payment processing |
| LTV:CAC | 6-10× | Target: >3× |
| Gross margin | 85%+ | Local LLM advantage |
| NPS | 35+ | LATAM SaaS avg: 25-30 |

---

## 5. THE VENTIA BENCHMARK: LATAM BOOTSTRAPPED SaaS SUCCESS

Agustín Suárez's Ventia (Uruguay) provides a directly relevant benchmark (BizFortune, February 2026):

- **What:** CRM + sales performance SaaS for LATAM SMBs
- **Funding:** Fully bootstrapped to $360K ARR
- **Team:** Grew from 2 founders to 14 employees
- **Markets:** Uruguay → Colombia → Argentina
- **Timeline:** 4 years to $360K ARR
- **Key lesson:** "Every feature had to justify itself in real value"
- **Accelerators (non-dilutive):** Endeavor ScaleUp, Itaú Cubo, Mana Tech Miami

**Comparison to Yaya:**

| Factor | Ventia | Yaya (Projected) |
|---|---|---|
| Product | CRM for sales teams | Conversational ERP for micro-SMBs |
| Pricing | Higher ARPU (B2B mid-market) | Lower ARPU ($13-40) but larger TAM |
| Distribution | Direct sales | WhatsApp-native viral + accountant channel |
| Infrastructure | Cloud-based | Local LLM (cost moat) |
| Time to $360K ARR | ~4 years | Target: 2-2.5 years (faster due to larger TAM + viral mechanics) |
| VC need | Never raised | Seedstrap: $250-500K to accelerate after PMF |

---

## 6. DECISION FRAMEWORK: WHEN TO RAISE MORE

### 6.1 Seed Round ($1M-$3M) Triggers (Month 18-24)

Consider raising a proper seed round ONLY if:
1. Product-market fit is validated (40%+ Sean Ellis)
2. ARR exceeds $200K with <4% monthly churn
3. Multi-vertical expansion is proving out (2+ verticals working)
4. Colombia/Mexico market research shows clear demand
5. Well-funded competitor enters the space (defensive raise)

### 6.2 Stay Bootstrapped Conditions

Continue seedstrapping if:
1. Revenue covers burn by Month 20-22 (on track)
2. No funded competitor materializes
3. Organic growth exceeds 15% MoM
4. Embedded finance revenue begins materializing
5. Andre prefers control over speed

### 6.3 The Hybrid Path (Most Likely)

Based on the LATAM ecosystem analysis:

**Month 0-9:** Bootstrap with personal funds (~$15K total)
**Month 9-12:** Seedstrap raise ($250-500K from angels/micro-VCs)
**Month 12-24:** Revenue-funded growth toward break-even
**Month 24-30:** Decision point — raise seed ($1-3M) for multi-country expansion OR continue capital-efficient growth

This mirrors the "bootstrap to product-market fit, VC when ready" approach that both J.P. Morgan and LATAM ecosystem experts recommend (Sustainabl, 2026).

---

## 7. FINANCIAL MODEL SENSITIVITIES

### 7.1 Downside Scenario (Conversion 3%, Churn 6%)

- Month 24 paid users: 750 (vs. 1,500 base case)
- ARR: $145K
- Break-even: Month 26-28
- Cash requirement: Additional $50K beyond seedstrap raise
- **Verdict:** Still viable. Extend runway by reducing growth spend

### 7.2 Upside Scenario (Conversion 15%, Churn 3%)

- Month 24 paid users: 3,000
- ARR: $580K
- Break-even: Month 16-18
- Cash surplus: $50K+ by Month 24
- **Verdict:** Raise becomes optional. Could grow to $1M ARR without external capital

### 7.3 Catastrophic Scenario (WhatsApp bans Yaya's account)

- Revenue: Drops 80% within 30 days
- Mitigation: 60-day channel migration plan (see strategy/07)
- Cash requirement: $30K emergency fund for migration + communication
- **Verdict:** Seedstrap raise must include $30K channel-risk reserve

---

## 8. TAX AND LEGAL STRUCTURE

### 8.1 Recommended Entity

- **Peru SAC (Sociedad Anónima Cerrada):** Most common for startups; 2-20 shareholders; simpler governance than SA
- **Delaware C-Corp:** Only if planning US VC raise (not needed for seedstrap from LATAM angels)
- **Recommendation:** Start as Peru SAC; convert to Delaware C-Corp only for Series A

### 8.2 Tax Implications

- Peru corporate tax: 29.5% on profits
- IGV (VAT): 18% on SaaS subscriptions (must be included in pricing)
- S/49 price point = S/41.53 pre-tax revenue + S/7.47 IGV
- SUNAT RUC registration required before first sale
- Digital services tax: Peru has implemented it for foreign digital services, but Yaya is domestic

---

## 9. KEY TAKEAWAYS FOR ANDRE

1. **You need ~$15K to reach PMF validation (Month 9).** Not $452K. Not $1M. Fifteen thousand dollars. Your existing infrastructure does the heavy lifting.

2. **Break-even is achievable by Month 20-22** with a modest $250-500K seedstrap raise at Month 9.

3. **Ventia proves this works in LATAM.** $360K ARR, bootstrapped, 14 employees, 4 years. Yaya can do it faster with a larger TAM and WhatsApp-native distribution.

4. **The seedstrap model preserves 83-90% founder equity** versus 30-50% with traditional VC path. At $240M Year 5 target, that's the difference between $200M+ and $72-120M in founder value.

5. **Don't raise before PMF.** Every dollar raised before product-market fit is validated is dilution without leverage. Build, validate, then raise from strength.

6. **Payment processing revenue is the hidden accelerator.** At 1,500 paying users with 30% payment volume capture, Culqi processing revenue alone could reach $4,500/month — potentially covering 20% of burn.

---

*This document provides the financial roadmap for Yaya Platform's seedstrapping strategy. It should be read alongside strategy/05 (Business Model Canvas), strategy/06 (LATAM VC Landscape), and the executive synthesis. Sources: StartupToScaleup (2025), J.P. Morgan (2025), Metal.so (2025), FinancialModelsLab (2025), Sustainabl LATAM Ecosystem (2026), BizFortune/Ventia case study (2026), ICONIQ GTM Report (2025).*
