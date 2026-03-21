# Yaya Platform — Business Model Canvas & Financial Projections

**Date:** 2026-03-21  
**Author:** Yaya Platform Research  
**Status:** Strategic Document — Investor-Ready  
**Dependencies:** Synthesized from all 29 prior research documents  

---

## 1. Business Model Canvas

### 1.1 Customer Segments

**Primary (Phase 1 — Peru Beachhead):**
- **Female sole proprietors in Lima** running beauty salons, food service, or retail — the statistical majority of Peru's 3.5M registered MYPEs (market/05)
- Age 25–45, Android users, managing business entirely via WhatsApp
- Average monthly revenue: ~$567–$800 (INEI data)
- 53.4% started business out of necessity, not opportunity
- 86% informal (no SUNAT registration)

**Secondary (Phase 2 — Multi-Vertical Lima + Colombia):**
- Restaurants (80K–120K addressable in Peru)
- Retail/fashion micro-businesses
- Accountants and bookkeepers managing 20–50 SMB clients
- Colombian micro-businesses (21M Nequi users, Bre-B payment rails)

**Tertiary (Phase 3 — LATAM Scale):**
- Mexican informal businesses (8.5M, 63% of all SMBs)
- Brazilian micro-entrepreneurs (15M+ MEI registered)
- Mid-size SMBs ($500K–$5M revenue) upgrading from basic tools

### 1.2 Value Propositions

**For Micro-Business Owners:**
- "Tu negocio en una conversación" — manage your entire business through WhatsApp chat
- Zero learning curve: if you can send a WhatsApp message, you can use Yaya
- SUNAT-compliant invoicing via natural language ("Factura a Juan, 3 camisas a S/45")
- Automated appointment reminders that reduce no-shows by 40–67% (salon GTM)
- Inventory tracking by voice note — say what you sold, Yaya updates the count
- Daily/weekly business summary delivered as a WhatsApp message every morning
- Payment collection via Yape/Plin links sent directly to customers
- "Cheaper than free" — costs less than running "free" ERPNext ($13/month vs. $50–200/month TCO)

**For Accountants (Channel Partners):**
- Pre-organized client data (invoices, expenses, sales) — no more chasing paper receipts
- 20% recurring commission per referred client
- Dashboard access to all managed clients
- Reduces time spent per client by 60–80%

**For Future Embedded Finance Partners:**
- Credit scoring data from transaction histories of previously invisible informal businesses
- Distribution channel to 500K+ micro-businesses (at scale)
- Lower default rates through continuous cash flow visibility

### 1.3 Channels

**Acquisition Channels (ranked by expected efficiency):**

| Channel | CAC Est. | Phase | Notes |
|---------|----------|-------|-------|
| Word-of-mouth / peer referral | $2–5 | 1+ | Beauty salon networks are tight-knit; one salon owner tells 5 others |
| Accountant partner program | $15–25 | 2+ | Each accountant influences 20–50 SMBs; 20% recurring commission |
| Beauty supply distributors | $5–10 | 1–2 | L'Oréal Peru, Wella — they visit salons weekly |
| WhatsApp group seeding | $0–3 | 1+ | Target business-owner groups in Lima (thousands exist) |
| Instagram/Facebook ads → WhatsApp | $20–40 | 2+ | Click-to-WhatsApp ads; Meta's $10B/year channel |
| Business association partnerships | $10–20 | 2+ | APEMIPE, Cámaras de Comercio |
| SUNAT compliance pull (organic) | $0 | 1+ | Businesses searching for invoicing solutions find Yaya |
| Founder-as-Customer-Zero content | $0 | 1 | Andre's story as a Peruvian entrepreneur builds trust organically |

**Delivery Channels:**
- WhatsApp (primary — 97% of Peruvian entrepreneurs already here)
- Voice notes within WhatsApp (voice-first for low-literacy users)
- WhatsApp Web (for accountants/power users)
- Future: Telegram, SMS fallback (channel-agnostic architecture)

### 1.4 Customer Relationships

**Automated + Personal hybrid:**
- **Onboarding:** AI-guided 5-minute WhatsApp conversation — "Hola, soy Yaya. ¿Cómo se llama tu negocio?"
- **Daily engagement:** Morning business summary ("Ayer vendiste S/320 en 7 transacciones. Tienes 3 citas hoy.")
- **Proactive insights:** Weekly revenue trends, low-stock alerts, payment reminders
- **Human escalation:** WhatsApp support group for complex issues (community-driven)
- **Trust-building:** Never hallucinate financial data; show "source of truth" for every number
- **Retention hooks:** Transaction data accumulation (switching cost increases over time); daily business intelligence creates checking habit

### 1.5 Revenue Streams

#### Primary: SaaS Subscriptions

| Tier | Name | Peru Price | USD | Target | Key Features |
|------|------|-----------|-----|--------|-------------|
| Free | Yaya Básico | S/0 | $0 | Viral distribution | 50 invoices/mo, 50 SKUs, 10 reminders |
| Starter | Yaya Negocio | S/49 | ~$13 | Core micro-business | 300 invoices, full inventory, scheduling, basic analytics, 3 users |
| Growth | Yaya Pro | S/149 | ~$40 | Growing SMBs | Unlimited invoices/SKUs, advanced analytics, payment collection, CRM, 10 users |
| Enterprise | Yaya Enterprise | S/399 | ~$107 | Multi-location | Multi-location, API access, custom integrations, unlimited users |

**Free tier strategy:** Not a lead magnet — a genuine product. 50 invoices/month is enough for the smallest micro-businesses. Viral distribution: every invoice sent includes a subtle "Powered by Yaya" footer. Conversion driver: hitting the 50-invoice limit triggers natural upgrade conversation.

#### Secondary: Transaction Revenue

| Stream | Take Rate | Phase | Notes |
|--------|-----------|-------|-------|
| Payment facilitation (Yape/Plin links) | 1.5–2.5% of TPV | Phase 2 | Processing fee embedded in convenience |
| Invoice factoring facilitation | 2–4% of factored value | Phase 3 | SUNAT electronic invoices are negotiable instruments |
| Working capital loan referrals | 1–3% origination fee | Phase 3 | Partner with CMACs/Financieras using Yaya's transaction data |
| Micro-insurance distribution | 5–15% premium share | Phase 3 | Business interruption, inventory insurance |

#### Tertiary: Platform Revenue

| Stream | Pricing | Phase | Notes |
|--------|---------|-------|-------|
| Accountant SaaS (multi-client dashboard) | S/99–299/month | Phase 2 | Per-accountant, not per-business |
| Anonymized market intelligence | Custom | Phase 3 | Aggregated industry benchmarks for brands, banks |
| API access for third-party developers | Usage-based | Phase 3 | Enable ecosystem of Yaya-powered tools |

### 1.6 Key Resources

| Resource | Type | Status | Notes |
|----------|------|--------|-------|
| Conversational AI engine | Technology | Build | WhatsApp-native NLU for Peruvian Spanish, voice note transcription |
| Local LLM infrastructure | Technology | Existing | 2x RTX A5000 on c.yaya.sh — $0.001/query vs. $0.01–0.05 cloud |
| SUNAT/Nubefact integration | Technology | Build (12–18 weeks) | PSE/OSE partner for electronic invoicing |
| WhatsApp Business API access | Technology | Acquire | Via official BSP or Baileys/WAHA bridge |
| Peruvian Spanish NLP training data | Data | Collect | Regional slang, voice note STT accuracy |
| Andre (founder) as Customer Zero | Human | Active | Living proof in Lima; strongest trust signal in Peru's *personalismo* culture |
| Peru business regulatory knowledge | Intellectual | Research complete | 29 research documents, 119K+ words |

### 1.7 Key Activities

**Phase 1 (Months 1–9):**
1. Build core conversational AI for appointment management + invoicing
2. Integrate Nubefact for SUNAT-compliant electronic invoicing
3. Develop WhatsApp-native onboarding flow (<5 min to first value)
4. Launch beauty salon pilot — 100 salons in Miraflores/San Borja
5. Iterate based on daily usage data and user feedback
6. Build transaction capture engine (every sale, payment, expense logged via chat)

**Phase 2 (Months 9–18):**
1. Expand verticals: restaurants, retail, tourism
2. Launch accountant partner program
3. Integrate Yape/Plin payment processing
4. Enter Colombia (Bogotá beachhead)
5. Develop analytics dashboard for power users

**Phase 3 (Months 18–36):**
1. Launch embedded finance features (credit scoring, loan facilitation)
2. Enter Mexico (CFDI compliance pull)
3. Prepare Brazil localization
4. Build marketplace/ecosystem features

### 1.8 Key Partners

| Partner | Type | Value Exchange |
|---------|------|---------------|
| Nubefact | PSE/OSE | SUNAT invoicing API; Yaya drives volume, Nubefact handles compliance |
| Yape (BCP) / Plin | Payment | Payment rails; Yaya drives transaction volume |
| L'Oréal Peru / Wella | Distribution | Access to their salon networks; Yaya helps salons manage better |
| APEMIPE / Cámaras de Comercio | Distribution | Credibility + access to organized business communities |
| CMACs / Microfinance institutions | Finance | Yaya provides credit data; partners provide capital |
| Meta / WhatsApp BSPs | Platform | API access; Yaya drives business messaging engagement |
| BVC (B Venture Capital) | Investment | Early-stage B2B LATAM fund active in Peru, Colombia, Brazil |

### 1.9 Cost Structure

#### Fixed Costs (Monthly, Phase 1)

| Item | Cost/Month | Notes |
|------|-----------|-------|
| Cloud infrastructure (LLM hosting) | $200–400 | Local inference on c.yaya.sh + minimal cloud for redundancy |
| WhatsApp API/BSP fees | $100–300 | Depends on volume; service messages are free post-July 2025 |
| Nubefact invoicing API | $50–150 | S/70/month base + per-document fees |
| Domain/hosting/misc SaaS | $50–100 | |
| Founder living costs (Lima) | $1,500–2,500 | Andre operating as Customer Zero |
| **Total Fixed (Phase 1)** | **$1,900–3,450** | |

#### Variable Costs (Per User/Month, at Scale)

| Item | Cost/User/Month | Notes |
|------|----------------|-------|
| LLM inference | $0.15–0.30 | Local inference at $0.001/query × ~200 queries/month |
| WhatsApp messaging | $0.05–0.15 | Service messages free; template messages ~$0.05 each |
| Nubefact per-document | $0.10–0.20 | ~S/0.14 per invoice × avg 50 invoices/month |
| Customer support (automated + human) | $0.10–0.20 | 95%+ AI containment rate |
| Infrastructure overhead | $0.15–0.25 | CDN, backups, monitoring |
| **Total Variable** | **$0.55–$1.10** | |

---

## 2. Unit Economics Model

### 2.1 Per-User Economics (Steady State, Month 18+)

| Metric | Conservative | Base | Optimistic |
|--------|-------------|------|-----------|
| Blended ARPU/month | $18 | $25 | $35 |
| COGS/user/month | $1.10 | $0.85 | $0.65 |
| **Gross Margin** | **93.9%** | **96.6%** | **98.1%** |
| Blended CAC | $40 | $25 | $15 |
| Average customer lifespan | 14 months | 18 months | 24 months |
| LTV | $236 | $434 | $826 |
| **LTV:CAC** | **5.9×** | **17.4×** | **55.1×** |
| CAC payback | 2.2 months | 1.0 months | 0.4 months |
| Monthly churn | 7.1% | 5.6% | 4.2% |

**Key assumptions:**
- ARPU blended across free (0%), Starter (70%), Growth (25%), Enterprise (5%) user mix
- COGS dominated by LLM inference; local deployment creates structural advantage
- CAC drops as word-of-mouth and network effects compound
- Churn improves as transaction data lock-in deepens

### 2.2 Revenue Build (36-Month Projection)

| Month | Paying Users | MRR | ARR (Run Rate) | Cumulative Revenue |
|-------|-------------|-----|----------------|-------------------|
| 3 | 15 | $225 | $2,700 | $338 |
| 6 | 75 | $1,500 | $18,000 | $4,500 |
| 9 | 200 | $4,000 | $48,000 | $16,500 |
| 12 | 500 | $10,000 | $120,000 | $52,500 |
| 18 | 2,000 | $50,000 | $600,000 | $262,500 |
| 24 | 8,000 | $200,000 | $2,400,000 | $1,012,500 |
| 30 | 25,000 | $625,000 | $7,500,000 | $3,387,500 |
| 36 | 60,000 | $1,500,000 | $18,000,000 | $9,112,500 |

**Growth assumptions:**
- Months 1–12: Founder-led, beauty salon beachhead, 30–50% MoM growth
- Months 12–18: Multi-vertical Lima + Colombia entry, 25–40% MoM
- Months 18–24: Accelerated by accountant channel + payment processing revenue
- Months 24–36: Mexico entry + embedded finance revenue kicks in
- Revenue mix shifts: SaaS 80% → 55% → 40% as transaction/finance revenue grows

### 2.3 Cash Flow & Funding Scenarios

#### Scenario A: Seedstrapping (No External Funding)

| Period | Revenue | Costs | Net | Cumulative |
|--------|---------|-------|-----|-----------|
| Months 1–6 | $4,500 | $21,000 | -$16,500 | -$16,500 |
| Months 7–12 | $48,000 | $36,000 | +$12,000 | -$4,500 |
| Months 13–18 | $210,000 | $95,000 | +$115,000 | +$110,500 |
| Months 19–24 | $750,000 | $280,000 | +$470,000 | +$580,500 |

**Total external capital needed: ~$20–30K** (founder savings + early revenue)
**Break-even: Month 10–11**
**Tradeoff:** Slower geographic expansion; Peru-only for 18+ months

#### Scenario B: Seed Round ($250K–$500K)

| Use of Funds | Amount | Impact |
|-------------|--------|--------|
| Product development (6 months, 2 engineers) | $120,000 | Accelerate core product by 3–4 months |
| Lima pilot marketing + salon onboarding | $40,000 | 500 pilot users vs. 200 in bootstrap scenario |
| Colombia market entry | $60,000 | Enter Colombia by Month 12 vs. Month 18 |
| Legal + SUNAT compliance | $30,000 | Proper corporate structure + IP protection |
| Working capital buffer | $50,000 | 6-month runway extension |

**Fundraising timing:** Month 9–12 (after 200+ paying users, validated PMF)
**Target investors:** B Venture Capital (Peru/Colombia/Brazil), EWA Capital (Lima), Salkantay Ventures, NXTP (Argentina syndicate)
**Expected terms:** $250–500K at $2–4M pre-money valuation (SAFE or convertible note)

#### Scenario C: Accelerator + Seed ($100K + $500K)

Join Y Combinator, 500 Global, or Platanus (LATAM-focused) for initial $100–150K + network + credibility. Follow with seed round at higher valuation ($4–6M).

**Recommended path: Scenario A → B hybrid.** Seedstrap to 200+ paying users and validated PMF, then raise seed round from position of strength. This aligns with the 2026 LATAM VC reality: "investors are writing bigger checks to fewer companies" (Cuantico VP) and "the problem is not the lack of money but the scarcity of startups ready to receive it" (Gestión).

---

## 3. Revenue Mix Evolution

| Stream | Year 1 | Year 2 | Year 3 | Year 5 (Projected) |
|--------|--------|--------|--------|---------------------|
| SaaS subscriptions | 95% | 70% | 55% | 40% |
| Payment processing | 3% | 18% | 25% | 25% |
| Embedded finance | 0% | 5% | 12% | 25% |
| Accountant/partner SaaS | 2% | 5% | 5% | 5% |
| Data/marketplace | 0% | 2% | 3% | 5% |

**The flywheel:**
1. **Invoicing** (compliance pull) → drives adoption at near-zero CAC
2. **Transaction capture** → creates daily engagement + data asset
3. **Payment processing** → adds revenue layer + deepens lock-in
4. **Credit scoring** → enables embedded finance (highest-margin revenue)
5. **Financial identity** → creates deepest moat (leaving = losing credit history)

---

## 4. Competitive Moat Analysis

### Moat Layers (Cumulative Over Time)

| Moat Layer | Timeline | Depth | How It Works |
|-----------|----------|-------|-------------|
| **Cost structure** | Day 1 | Medium | Local LLM = 8–18× cost advantage over cloud-dependent competitors |
| **Cultural fluency** | Month 1–6 | Medium | Peruvian Spanish NLU + *personalismo* design = hard to replicate |
| **SUNAT integration** | Month 3–9 | Medium | Nubefact partnership + compliance expertise |
| **Transaction data** | Month 6–18 | High | More data → better AI → better insights → deeper lock-in |
| **Network effects** | Month 12–24 | High | Salon → stylist → supplier → accountant → network grows |
| **Financial identity** | Month 18–36 | Very High | Leaving Yaya = losing credit history; deepest possible moat |
| **Ecosystem** | Month 24+ | Very High | Third-party integrations, accountant networks, API ecosystem |

### Defensibility Against Specific Threats

| Threat | Defense |
|--------|---------|
| Meta builds native AI commerce | Yaya's value is in ERP depth (inventory, invoicing, analytics), not just chat. Meta won't build vertical SaaS. |
| Vambe/Darwin AI expand to ERP | They'd need to rebuild from B2C sales automation to full business management — 18+ month pivot. Yaya's head start in Peru + SUNAT integration is non-trivial. |
| Mercado Libre launches SMB tools | MELI's incentive is platform lock-in; Yaya helps SMBs build direct customer relationships (opposite value prop). |
| Local copycats | Network effects + transaction data lock-in + accountant channel create compound switching costs. |

---

## 5. Key Financial Metrics Dashboard

| Metric | Target (Month 6) | Target (Month 12) | Target (Month 24) | Target (Month 36) |
|--------|------------------|--------------------|--------------------|---------------------|
| Total Users (free + paid) | 300 | 2,000 | 30,000 | 200,000 |
| Paying Users | 75 | 500 | 8,000 | 60,000 |
| Free-to-Paid Conversion | 25% | 25% | 27% | 30% |
| MRR | $1,500 | $10,000 | $200,000 | $1,500,000 |
| Blended ARPU | $20 | $20 | $25 | $25 |
| Gross Margin | 90% | 93% | 96% | 97% |
| Monthly Churn | 8% | 6% | 5% | 4% |
| CAC (blended) | $30 | $25 | $20 | $15 |
| LTV:CAC | 5× | 8× | 15× | 20× |
| CAC Payback | 1.5 mo | 1.3 mo | 0.8 mo | 0.6 mo |
| Net Revenue Retention | 95% | 105% | 115% | 120% |
| Sean Ellis Score | 30% | 45% | 55% | 60% |

---

## 6. Sensitivity Analysis

### What Kills the Model?

| Risk Scenario | Impact | Probability | Mitigation |
|--------------|--------|-------------|------------|
| Churn >10% monthly | LTV drops below $100; LTV:CAC inverts | Medium | Financial-services-level data lock-in; daily value delivery |
| Free-to-paid conversion <5% | Revenue target missed by 5×; can't self-fund | Medium | Aggressive free-tier limits; "cheaper than free ERP" messaging |
| WhatsApp API ban | Total platform disruption | Low-Medium | Channel-agnostic architecture; 60-day migration plan |
| ARPU compression (<$10) | Need 3× users for same revenue | Low | Multi-tier pricing; embedded finance upside |
| Peru macro crisis | Business closures, reduced spending | Medium | $13/month is <3% of average MYPE revenue; recession-resistant pricing |
| LLM hallucination incident | Trust destroyed; potential regulatory action | Low | Deterministic validation layer; zero numerical hallucination policy |

### What Supercharges the Model?

| Upside Scenario | Impact | Probability | Driver |
|----------------|--------|-------------|--------|
| WhatsApp opens official AI agent channel | Eliminates API risk; legitimizes the category | Medium | Meta's $1B messaging revenue + January 2026 AI agent experiments |
| Peru mandates e-invoicing for micro-businesses | Massive compliance-driven adoption wave | Medium | SUNAT trend toward universal digitization |
| Embedded finance launches successfully | Revenue mix shifts; ARPU doubles | Medium | Transaction data moat enables credit scoring |
| Viral loop catches fire (salon→stylist→supplier) | CAC approaches $0; exponential growth | Medium | Network effects in tightly-knit business communities |

---

## 7. Strategic Recommendations

### Immediate Actions (Next 30 Days)

1. **Register Yaya Platform SAS** in Peru — corporate entity needed for SUNAT integration and eventual fundraising
2. **Secure WhatsApp Business API access** — apply through official BSP or establish Baileys/WAHA bridge with number rotation
3. **Begin Nubefact API integration** — start sandbox testing; target 12-week integration timeline
4. **Build core conversational AI prototype** — appointment management flow for beauty salons
5. **Identify 10 beta salons** in Miraflores/San Borja — founder-led recruitment

### Fundraising Readiness Checklist

- [ ] 200+ paying users
- [ ] Sean Ellis score >40%
- [ ] Monthly churn <6%
- [ ] Unit economics validated (LTV:CAC >5×)
- [ ] Revenue growing >20% MoM
- [ ] SUNAT invoicing integration live
- [ ] Customer testimonials (video, WhatsApp screenshots)
- [ ] One-page executive summary + pitch deck
- [ ] Data room prepared (financials, metrics, legal)

---

## Sources

- Cuantico VP, *Latin America VC Report 2026* (February 2026)
- Gestión, "Las 10 startups más prometedoras de Perú en 2026" (February 2026)
- Gestión, "Más capital pero menos startups" (March 2026)
- Latin Times, "What's in Store for Latin America's Venture Capital Landscape in 2026" (March 2026)
- LATAM Republic, "Latin America VC Report 2026" (February 2026)
- CB Insights, "Top 50 Latin America Venture Investors 2026" (March 2026)
- Early Check Newsletter, "New Infrastructure" #28 (March 2026)
- UseInvent, "The $45B WhatsApp Business Economy" (2026 Guide)
- ThatRound, "What is Seedstrapping?" (March 2026)
- Sustainabl, "Future of Latin America's Startup Ecosystem" (February 2026)
- All 29 prior Yaya Platform research documents
