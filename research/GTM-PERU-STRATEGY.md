# Yaya Platform — Go-to-Market Strategy: Peru
### Consolidated Research Synthesis | April 2026

---

## Executive Summary

Yaya is a **WhatsApp-native, voice-first AI business management platform** targeting Peru's 6M+ micro-enterprises. The product turns WhatsApp voice notes into structured business operations — sales tracking, invoicing, appointment scheduling, payment reconciliation, and SUNAT compliance — with zero learning curve.

**Why Peru, why now:**
- 97% of Peruvian entrepreneurs already use WhatsApp for business
- 86.8% of MYPEs are informal — no incumbent software serves them
- 75% of micro-businesses use ZERO business software (compete against paper, not software)
- SUNAT e-invoicing enforcement is rolling downmarket, creating compliance urgency
- Yape (20M+ users) has normalized digital payments, but no tool reconciles them
- No funded competitor occupies WhatsApp-native micro-enterprise ERP in Peru

**The opportunity:** S/155.7B in annual MYPE sales (14.2% of GDP) managed through notebooks, WhatsApp chats, and memory. Yaya digitizes this with a voice note.

---

## 1. Target Market

### 1.1 Market Sizing

| Level | Segment | Size | Yaya Relevance |
|-------|---------|------|----------------|
| TAM | All LATAM MYPEs | 30M+ businesses | Long-term |
| SAM | Peru MYPEs using WhatsApp for business | ~3.5M businesses | Medium-term |
| SOM (Year 1) | Lima beauty salons with 1-5 employees | ~15,000-25,000 | Beachhead |
| Target (Month 12) | Active paying users | 500 | Operational goal |

### 1.2 Beachhead: Beauty Salons in Lima

**Why salons first:**
- S/10B market (2025), growing 7% YoY, 120 new companies in 2025
- 80-85% women-owned (51% of new businesses in Peru are women-led)
- 20-30% no-show rate costs S/3,000-4,500/month per salon — Yaya recovers S/1,500-2,250
- 8-18 daily transactions = perfect voice note density for habit formation
- 50%+ revenue loss from no-shows = immediate, measurable ROI (40x subscription cost)
- No WhatsApp-native competitor exists in Peru beauty
- Operators' hands are busy 86% of the day — voice-first is not optional, it's required

**Customer Zero Profile — "Rosa":**
- Female, age 28-45
- Lima middle-income district (Jesús María, Lince, Pueblo Libre, Surquillo, Los Olivos)
- 2-4 employees, S/6,000-12,000/month revenue
- 60+ WhatsApp voice notes/day (already habituated)
- Pays a contador S/150-250/month for compliance
- Tracks sales in a notebook, debts ("fío") in memory
- S/2,000-3,000 in untracked customer credit at any given time

### 1.3 Expansion Verticals (Post-Validation)

| Phase | Vertical | Timing | Why |
|-------|----------|--------|-----|
| 2 | Education/Tutoring (academias) | Month 9-12 | Similar ops to salons, high ARPU (S/80-150/mo) |
| 2 | Restaurants/food businesses | Month 9-12 | Heavy WhatsApp usage, daily transaction density |
| 3 | Construction micro-enterprises | Month 15+ | 100K+ informal, cash flow tracking is #1 pain |
| 3 | Agriculture (acopiadores) | Month 18+ | 10-30+ txns/day, cooperative distribution channel |

### 1.4 Geographic Expansion

| Phase | Region | Timing | Readiness |
|-------|--------|--------|-----------|
| 1 | Lima (middle-income districts) | Launch | 89.1% internet, 50% national GDP |
| 2 | Arequipa, Trujillo, Cusco | Month 9-12 | 75-85% internet, strong WhatsApp |
| 3 | Piura, Chiclayo, Huancayo | Month 15-18 | Growing digital adoption |
| 4 | Iquitos, Tacna, Ayacucho | Month 24+ | Emerging, needs S/29 Lite tier |

---

## 2. Competitive Landscape

### 2.1 Direct Competitors — None in Our Segment

The critical insight: **Yaya competes against paper and memory, not software.** 75% of Peru MYPEs use zero business tools.

| Competitor | What They Do | Funding | Why Not a Threat |
|------------|-------------|---------|------------------|
| **Alegra** | Cloud accounting (S/49-259/mo) | Established | Computer-dependent, forms-based, no voice, no WhatsApp-native |
| **Vambe** (Chile) | AI sales agents for B2C | $17.85M | Mid-market only, no ERP/ops depth, economics don't work below $200/mo |
| **YaVendió** (Peru) | WhatsApp AI sales bot | $850K | Sales-only (no ops/ERP), enterprise focus, 500 paid clients |
| **Darwin AI** (Brazil) | AI employees for customer support | $7M | Customer-facing, not owner-facing |
| **Jelou** (Ecuador) | Financial transaction AI | $13M | Enterprise infrastructure, Krealo/Yape investor = watch closely |
| **Treble** (Colombia) | WhatsApp CRM | $15M | Enterprise HubSpot integration, not micro-business |
| **MiChamba** (Mexico) | WhatsApp task management | $2.25M | Enterprise clients (Pemex, Hilton), closest philosophical match — **monitor** |
| **SUNAT SOL** | Free invoicing | Free | Terrible UX (15-field web form), no integration |

### 2.2 Platform Threats

| Threat | Probability | Impact | Mitigation |
|--------|------------|--------|------------|
| Meta builds ERP features | 10% | High | Meta's $60B AI capex is ads-focused, not SMB ops |
| Meta Business AI cannibalizes | 25% | Medium | Different use case: customer-facing vs. owner-facing |
| Meta restricts API access | 20% | High | Channel abstraction architecture (SMS, Telegram, PWA) |
| Meta acquires LATAM competitor | 15% | Medium | Meta prefers infrastructure buys |
| Mercado Libre enters space | 15% | High | Position as "anti-platform" — own your customers |

### 2.3 Competitive Moat (Time to Build)

1. **Features** (6-18 months) — weakest, copyable
2. **Data lock-in** (12-36 months) — transaction history creates switching costs
3. **Workflow embedding** (18-48 months) — daily operations depend on Yaya
4. **Network effects** (Year 2-3) — AI improves with each business, contador network compounds
5. **Trust/cultural embedding** (permanent) — relationship-based, fragile but unassailable once earned

---

## 3. MVP Requirements & Gap Analysis

### 3.1 What's Already Built ✅

| Feature | Status | Notes |
|---------|--------|-------|
| WhatsApp multi-tenant gateway | ✅ Functional | Baileys v7, worker thread isolation |
| AI agent (Mastra framework) | ✅ Functional | Context-aware, tool execution, streaming |
| Voice pipeline (STT/TTS) | ✅ Architected | Whisper + Kokoro, needs .env config |
| Payment tracking (Yape) | ✅ Functional | Mobile notification sync, auto-matching |
| Product catalog & orders | ✅ Functional | CRUD, stock management, order lifecycle |
| Web dashboard | ✅ Functional | Analytics, orders, customers, payments |
| Appointment scheduling | ✅ Functional | Cal.com integration, reminders |
| Auth & multi-tenancy | ✅ Functional | Better Auth, role-based, tenant isolation |
| Media handling | ✅ Functional | S3/MinIO, image compression, audio processing |

### 3.2 MVP Blockers — Must Build Before Launch ❌

These are features the research identifies as essential for the beachhead that are NOT yet implemented:

| # | Feature | Why It's a Blocker | Effort |
|---|---------|-------------------|--------|
| 1 | **Voice note → transaction recording** | Core value prop. Rosa sends "corte de pelo para María, sesenta soles" → structured sale record. Without this, there is no product. | High — STT pipeline exists but business-logic extraction (NLU intent → structured transaction) needs wiring |
| 2 | **Daily sales summary via WhatsApp** | #1 retention driver. "Hoy vendiste S/480 en 12 servicios. Tu mejor día esta semana." Habit formation requires daily variable reward. | Medium — data queries exist, needs automated scheduled delivery |
| 3 | **Fío (informal credit) tracking** | S/2,000-3,000 in untracked credit per salon. "María te debe S/120 desde hace 15 días" = immediate, tangible value. Highest-impact feature after voice recording. | Medium — customer + payment tables exist, needs credit ledger logic |
| 4 | **SUNAT invoice generation (CPE)** | Compliance wedge. Voice note → boleta/factura via Nubefact API. Research identifies this as the #1 feature that locks in retention through regulatory dependency. | High — Nubefact integration not built, UBL 2.1 XML generation needed, IGV calc (deterministic, NOT LLM) |
| 5 | **WhatsApp Flows for confirmations** | Voice note ambiguity (88-94% STT accuracy) needs confirmation UI. "¿Registrar venta: Corte de pelo, S/60, María López?" with Confirm/Edit buttons. Research says this is non-negotiable for financial accuracy. | Medium — WhatsApp Flows API integration needed |
| 6 | **Contador dashboard** | Distribution channel multiplier. Free portal for accountants to view client transactions, export for SIRE. One contador = 30-50 referrals. Research calls this the single highest-leverage growth channel. | Medium — web dashboard exists, needs contador-specific views + auth |
| 7 | **Onboarding flow (< 5 minutes)** | 43% of SMB SaaS churn happens in first 90 days. Research mandates: first voice note → first value in under 5 minutes. Progressive disclosure (appointments Week 1, insights Week 2, inventory Month 2). | Medium — needs guided first-run experience |
| 8 | **Peruvian Spanish voice optimization** | Domain-specific initial_prompt for Whisper improves financial term accuracy 5-10%. Salon vocabulary: "brushing", "tinte", "keratina", "lucas", "yapeame". Without this, STT errors on key terms destroy trust. | Low — configuration change + prompt engineering |
| 9 | **Audio deletion post-transcription** | Peru data protection law (Ley 29733, updated March 2025) classifies voice as biometric data. Must delete audio immediately after STT. Self-hosted Whisper keeps data in-country. Non-compliance fine: S/535,000 or 10% revenue. | Low — architectural change, delete after Whisper processing |
| 10 | **Channel abstraction layer** | WhatsApp platform dependency risk rated 55.5/100. Research says adding SMS/Telegram abstraction costs 2-3 dev days and $0. Insurance against Meta policy changes. | Low — architecture refactor, no new features |

### 3.3 Nice-to-Have for Launch (Not Blockers)

- Expense categorization and tracking
- Inventory management beyond stock counts
- Multi-language support (Quechua regions)
- Customer segmentation/targeting
- Broadcast messaging
- Mobile app for dashboard (web-first is fine)

---

## 4. Pricing Strategy

### 4.1 Pricing Tiers

| Tier | Price | Target | Key Features |
|------|-------|--------|--------------|
| **Gratis** | S/0 | Trial/informal | 30 voice notes/month, basic sales tracking, 1 user |
| **Emprendedor** | S/19/month | Price-sensitive MYPEs | 200 voice notes, daily summary, fío tracking, 1 user |
| **Negocio** | S/49/month | Core target (Rosa) | Unlimited voice, SUNAT invoicing, appointment reminders, 3 users |
| **Pro** | S/79/month | Growing businesses | Everything + contador export, advanced analytics, 5 users |

### 4.2 Pricing Rationale

- **S/19 is below the phone plan anchor** (S/20-30/month) — impulse-affordable
- **S/49 matches Alegra's entry tier** but at 10x lower cognitive cost (voice vs. forms)
- **S/49 = 1.6-3.3% of Rosa's monthly revenue** — well within impulse range
- **Weekly payment option** (S/5/week via Yape) reduces commitment anxiety
- **No auto-renewal** — trust is earned, not trapped. Research shows Peru's trust deficit (54% low trust) means forced billing destroys relationships

### 4.3 Unit Economics

| Metric | Value | Notes |
|--------|-------|-------|
| ARPU | S/13-49/month (~$3.50-$13) | Blended across tiers |
| COGS per user | $0.90-1.48/month | WhatsApp API + LLM + STT + infra |
| Gross margin | 87-94% | Self-hosted AI on existing RTX A5000 |
| WhatsApp API cost | $0.38/month/user | Service messages free (user-initiated) |
| LLM inference | $0.12/month/user | Hybrid: self-hosted Qwen (70%) + API fallback (30%) |
| CAC (blended) | $4.28 | Contador channel + organic + ads |
| LTV | $120+ | At 4% monthly churn, 25-month lifetime |
| LTV:CAC | 28x | Extremely capital-efficient |
| Break-even | ~12 paying users | On current infrastructure |
| Profitability threshold | ~300 paying users at S/29 avg | ~$1.2K MRR |

---

## 5. Go-to-Market Channels

### 5.1 Channel Strategy (Ranked by Impact)

#### Channel 1: Contador (Accountant) Network — **PRIMARY**
- **Mechanism:** Free Yaya dashboard for contadores → they onboard their 30-50 MYPE clients → 20% recurring revenue share
- **Why it works:** 46,000-77,000 practicing contadores in Peru. Each one is a trusted advisor to dozens of MYPEs. SIRE mandate creates compliance urgency they pass to clients.
- **Economics:** One satisfied contador = 30-50 client referrals at near-zero CAC
- **Switching costs:** Once contador workflows adapt to Yaya's export format, they resist changing
- **Target:** 5-10 contadores in first 6 months = 150-500 referred users
- **Playbook:** Identify contadores serving Lima salons → offer free dashboard + revenue share → they become the onboarding channel

#### Channel 2: Click-to-WhatsApp Ads — **SECONDARY**
- **Mechanism:** Facebook/Instagram ads targeting Lima salon owners → click opens WhatsApp → Yaya onboards them in-chat
- **Cost:** $5-15/lead, with 72-hour free messaging window
- **Conversion advantage:** 45-60% CTR (vs. 2-5% email) — WhatsApp native ads are 10-20x more effective
- **Target:** 100-200 leads/month at $1,000-2,000 ad spend

#### Channel 3: Beauty Supply Distributors — **PARTNERSHIP**
- **Mechanism:** Partner with distributors who visit salons weekly → distribute Yaya QR codes → commission per activation
- **Cost:** $0-$270 setup, ongoing commission
- **Why it works:** Distributors have existing trust relationships and regular physical access

#### Channel 4: WhatsApp Groups & Word-of-Mouth — **ORGANIC**
- **Mechanism:** Lima salon owner WhatsApp groups (5,000-15,000 members) → share success stories → viral referral program
- **Cost:** $0
- **Benchmark:** Zapia achieved 90%+ word-of-mouth growth through one killer feature (voice transcription)

#### Channel 5: Beauty Schools — **LONG-TERM**
- **Mechanism:** Partner with cosmetology schools → Yaya is the "business tool" students learn on → graduate as users
- **Cost:** $0
- **Payoff:** Slow but creates pipeline of digitally-native salon owners

### 5.2 Referral Program
- Existing user refers new salon → both get 1 month free (Emprendedor tier)
- Target: 20%+ organic referral rate by Month 3
- Benchmark: WhatsApp-native products see 30-50% viral coefficients in LATAM

---

## 6. Launch Timeline

### 6.1 Recommended Sequence

| Phase | Dates | Milestone | Key Activities |
|-------|-------|-----------|----------------|
| **Build MVP** | Apr-Jun 2026 | Core features functional | Wire voice→transaction pipeline, SUNAT integration, WhatsApp Flows, daily summary, fío tracking |
| **Customer Zero** | Jul 2026 | 1 real salon using daily | Andre (founder) + 1 salon owner, 5+ voice notes/day, iterate based on real usage |
| **Closed Beta** | Aug-Sep 2026 | 10-20 salons | Recruit via 2-3 contadores, white-glove onboarding, measure activation/retention |
| **Open Beta** | Oct-Nov 2026 | 50-100 salons | Light ad spend, refine pricing, prepare for seasonal peak |
| **Peak Season** | Dec 2026 | Prove value during highest-revenue month | Salons earn 140-180% of average → Yaya tracks it → "you made S/X this December" = retention lock |
| **Public Launch** | Jan 2027 | Full commercial launch | January = fresh pain (40-50% revenue drop), new year motivation, time to evaluate tools |
| **Scale** | Feb-Jun 2027 | 500 active users | Contador program at scale, second vertical testing, regional expansion to Arequipa/Trujillo |

### 6.2 Why January 2027 for Public Launch

Research on salon seasonal patterns reveals:
- **December** is 140-180% of average monthly revenue — owners are too busy to adopt new tools
- **January** brings a 40-50% revenue drop — owners feel the pain acutely and have time to try solutions
- **New year motivation** aligns with "get organized" psychology
- Users who survive January's slow season with Yaya's insights are retained through the year

### 6.3 PMF Signals to Watch

| Signal | Target | Measurement |
|--------|--------|-------------|
| Voice notes per user per day | ≥3 (target ≥5) | Daily active usage |
| Day 7 retention | ≥60% | Cohort analysis |
| Day 30 retention | ≥40% | Cohort analysis |
| Time to first voice note | <5 minutes | Onboarding funnel |
| Organic referral rate | ≥20% | Referral tracking |
| Monthly churn | <5% (target <4%) | Cohort analysis |
| NPS | ≥50 | Monthly survey |

---

## 7. Risk Assessment & Mitigation

### 7.1 Critical Risks

| Risk | Severity | Probability | Mitigation |
|------|----------|-------------|------------|
| **WhatsApp account ban** | Existential | Medium (using Baileys = unofficial API) | Migrate to official Cloud API before launch. Baileys fine for dev, not production. Research explicitly warns: "bans are permanent with no appeals" |
| **LLM hallucination on financial data** | High | High | All tax/financial calculations must be deterministic (rule engine), NEVER LLM-generated. Confirmation flows before data commit. Five-layer validation architecture |
| **STT errors on amounts** | High | Medium | WhatsApp Flows confirmation UI for every financial transaction. Domain-specific Whisper prompts. "¿Registrar S/60?" before committing |
| **Trust destruction from data loss** | Existential | Low | PostgreSQL with backups. "Trust builds slowly but breaks instantly — one data loss = game over" |
| **Meta policy changes** | High | 20% over 3 years | Channel abstraction (Day 1), SMS fallback (Month 6), Telegram (Month 9), PWA (Month 12) |
| **Churn from informality** | High | High | Habit formation design (streak mechanics, daily summaries, variable rewards). Target: reduce from 8.9% baseline to <4.5% |
| **Peru data protection violation** | Medium | Medium | Self-host Whisper (audio never leaves Peru), delete audio post-transcription, register database with ANPD, draft Spanish privacy policy |
| **Competitor with more funding** | Medium | Medium | Speed to market + depth in micro-enterprise segment. $60M+ in adjacent competitor funding validates category but none serve our segment |

### 7.2 Regulatory Requirements (Non-Negotiable for Launch)

| Requirement | Deadline | Status |
|-------------|----------|--------|
| Privacy policy (Spanish) covering voice processing | Before Customer Zero | Not started |
| WhatsApp consent flow (explicit opt-in) | Before Customer Zero | Not started |
| ANPD database registration | Before launch | Not started (free) |
| AI disclosure to users (Law 31814) | Before launch | Not started |
| Self-hosted Whisper (audio stays in Peru) | Before launch | Architecture ready (c.yaya.sh) |
| Audio deletion after transcription | Before launch | Not implemented |
| SUNAT CPE submission (if invoicing feature) | With invoicing launch | Not started |
| DPO appointment | Nov 2028 (micro grace) | Not urgent |

### 7.3 The Baileys Risk — Action Required

**This is the single biggest unaddressed technical risk.** The current WhatsApp integration uses Baileys (unofficial API). Research repeatedly flags:

> "Meta detection improving; bans are permanent with no appeals."
> "R1: WhatsApp account ban via unofficial API/Baileys — Score 20/25 (Existential)"

**Recommendation:** Use Baileys for development and Customer Zero testing. Migrate to official WhatsApp Cloud API before closed beta (August 2026). The Cloud API setup requires:
- Meta Business Account verification (RUC + utility bill)
- WhatsApp Business Account creation
- Phone number registration
- Webhook configuration

This is a **hard blocker** for any commercial launch.

---

## 8. Financial Roadmap

### 8.1 Seedstrapping Path

| Phase | Timeline | Capital Needed | Source |
|-------|----------|---------------|--------|
| Pre-revenue | Months 0-6 | $15K | Founder savings |
| Customer Zero → Beta | Months 6-9 | $5-10K | Early revenue + savings |
| Pre-seed raise | Month 9-12 | $250-500K | SAFE/convertible note at $2-4M pre-money |
| Scale to 500 users | Months 12-18 | From raise | Team expansion (engineer + designer) |
| Seed round | Month 24-30 | $1-3M | After proving unit economics at 500+ users |

### 8.2 Infrastructure Costs (Current)

Existing infrastructure (c.yaya.sh + d.yaya.sh) supports up to 2,000-5,000 DAU at ~$130/month. No additional infrastructure investment needed until significant scale.

### 8.3 Non-Dilutive Funding Available

| Source | Amount | Type |
|--------|--------|------|
| ProInnóvate (Innovadores) | Up to S/67,000 (~$18K) | Government grant, no equity |
| ProInnóvate (Dinámicos) | Up to S/150,000 (~$40K) | Government grant, no equity |
| Total available | ~$58K | Apply immediately |

### 8.4 Revenue Projections

| Milestone | Users (Paying) | MRR | Timeline |
|-----------|---------------|-----|----------|
| Break-even | 12 | ~$160 | Month 6-7 |
| Profitability | 300 | ~$1,200 | Month 12-15 |
| Pre-seed ready | 200+ | $5K+ | Month 9-12 |
| Seed ready | 2,000+ | $20K+ | Month 24-30 |
| $1M ARR | 24,000 | $83K | Year 2-3 |

---

## 9. International Expansion Roadmap

### Peru First, Then...

| Market | Timing | Why | Key Adaptation |
|--------|--------|-----|----------------|
| **Colombia** | Month 18-24 | Same language, 2.1M WhatsApp Business accounts, DIAN e-invoicing more mature, natural next market | Medellín first (startup culture), Nequi integration (21M+ users), DIAN compliance |
| **Mexico** | Month 30-36 | 5.4M micro-enterprises (3-4x Peru), 77M WhatsApp users | CFDI e-invoicing (most complex globally, 6-9 months dev), massive market but hard |
| **Brazil** | Month 36+ | Largest LATAM market, Pix integration, CADE protections for AI | Portuguese localization, LGPD compliance, Nota Fiscal integration |

---

## 10. Key Strategic Decisions

### 10.1 Decisions Already Made (Validated by Research)

1. **WhatsApp-native, not an app** — 97% already there, zero download friction
2. **Voice-first** — 86% of owner time is operative work, hands are busy
3. **Beauty salons as beachhead** — highest pain (no-shows), best density, women-led
4. **Lima first** — 89% internet, 50% GDP, highest salon density
5. **Contador as distribution** — 30-50x referral multiplier, proven in India (Vyapar 27K partners)
6. **Self-hosted AI** — $0.001/query local vs $0.01-0.05 cloud, data sovereignty

### 10.2 Decisions That Need to Be Made

| Decision | Options | Research Recommendation | Risk |
|----------|---------|------------------------|------|
| **Baileys vs. Cloud API** | Keep Baileys / Migrate to Cloud API | Migrate before commercial launch | High — existential ban risk |
| **S/19 vs. S/29 entry tier** | Lower price = more adoption / Higher = better unit economics | A/B test during beta. Start at S/19 | Medium — can always increase |
| **Free tier scope** | Generous free (Khatabook model) / Limited free (Vyapar model) | Limited free (30 voice notes) — enough to prove value, not enough to sustain | Low |
| **SUNAT invoicing in MVP** | Include / Defer to v2 | Include — it's the compliance wedge that locks retention | High effort, high reward |
| **Weekly vs. monthly billing** | Weekly S/5 via Yape / Monthly S/19+ | Offer both. Weekly reduces commitment anxiety for informal businesses | Low |

---

## 11. Success Metrics — First 90 Days Post-Launch

### North Star Metrics
- **VNPUAD** (Voice Notes Per Active User Per Day): Target >3
- **WAU** (Weekly Active Users as % of registered): Target >60%
- **TAR** (Transcription Accuracy Rate): Target >92%

### Business Health
- Time to First Voice Note: <5 minutes
- Day 7 Retention: >60%
- Day 30 Retention: >40%
- Free-to-Paid Conversion: >5%
- Monthly Churn (paid): <5%
- Contador Acquisition: 1-2/month
- Organic Referral Rate: >20% by Month 3

### Financial
- MRR tracking against projections
- CAC by channel
- ARPU by tier
- Gross margin (target >85%)

---

## 12. One-Page Summary

**Product:** WhatsApp voice note → structured business operations for Peru's micro-enterprises

**Beachhead:** Beauty salons in Lima (S/10B market, 20-30% no-show pain, 86% hands-busy)

**Differentiation:** Competes against paper, not software. Voice-first. Zero learning curve. SUNAT compliance built in.

**Pricing:** S/0-79/month (core at S/19-49). Weekly Yape payment option.

**Distribution:** Contador network (30-50x multiplier) + Click-to-WhatsApp ads + beauty distributor partnerships

**Timeline:** MVP by June 2026 → Customer Zero July → Beta Aug-Nov → Public Launch January 2027

**Economics:** 87-94% gross margin, 28x LTV:CAC, break-even at 12 users, profitable at 300

**Blockers:** (1) Voice→transaction pipeline wiring, (2) SUNAT/Nubefact integration, (3) WhatsApp Flows confirmations, (4) Baileys → Cloud API migration, (5) Contador dashboard, (6) Data protection compliance (audio deletion + privacy policy)

**Funding:** Seedstrap to PMF → $250-500K pre-seed at Month 9-12 → $1-3M seed at Month 24-30. Apply to ProInnóvate for $18-40K non-dilutive immediately.

**Expansion:** Peru → Colombia (Month 18) → Mexico (Month 30) → Brazil (Month 36)

**Why we win:** No one else is building a voice-first conversational ERP for the 3M+ Peruvian micro-businesses that use zero software. $60M+ in adjacent competitor funding proves the category. India's Vyapar (10M users, $15.5M ARR) proves the model. We're building what Africa, India, and Brazil have validated — but localized for Peru and powered by AI that didn't exist 18 months ago.
