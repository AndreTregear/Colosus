# Yaya Platform: Scaling Unit Economics from 1 to 10,000 Users

**Date:** March 21, 2026  
**Category:** Strategy / Unit Economics  
**Research Cycle:** #15  
**Sources:** SaaS unit economics benchmarks (CloudZero 2025, ful.io 2026, SaasRise/iContact case study), LATAM SaaS churn data (strategy/03), Yaya cost model (strategy/05, strategy/18), WhatsApp API pricing (strategy/13, strategy/17), Peru salon market data (market/14), infrastructure audit (TOOLS.md)

---

## 1. Executive Summary

The research library has extensively covered Yaya's near-zero MVP cost structure and the $1.30 cost to reach the first user. What hasn't been modeled is **what happens when Yaya scales.** This document builds a bottoms-up unit economics model from 1 to 10,000 users, identifying the critical inflection points where costs jump, where infrastructure breaks, and where pricing must evolve. The core finding: Yaya's self-hosted AI infrastructure creates an extraordinary cost advantage at scale, but WhatsApp API costs become the dominant expense by ~500 users, and infrastructure requires a major upgrade at ~2,000 users. The model shows Yaya can reach profitability at ~300 paying users with the current pricing assumption of S/29-49/month.

---

## 2. Yaya's Unique Cost Structure

Unlike typical SaaS companies that scale costs linearly with cloud infrastructure, Yaya has a hybrid model:

| Cost Category | Scales With | Current State |
|--------------|------------|---------------|
| AI Inference (Whisper + LLM) | Message volume | $0 (self-hosted on c.yaya.sh) |
| WhatsApp API | Per message | $0 (service convos free, small volumes) |
| Database & Storage | Data volume | $0 (PostgreSQL on d.yaya.sh) |
| Hosting & Network | Always-on infrastructure | $0 (existing servers) |
| Andre's Time | Everything (at MVP stage) | Priceless but finite |

**Key insight:** At the MVP stage, virtually all costs are fixed ($0 marginal cost per user). This is unusual for AI-powered SaaS and creates a window where unit economics look infinite. But this masks real scaling constraints.

---

## 3. Cost Model by User Tier

### 3.1 Tier 1: 1-50 Users (Validation Phase)

**Infrastructure:**
- c.yaya.sh handles all AI inference (Whisper + Qwen3.5-27B)
- d.yaya.sh handles webhook, database, message routing
- Existing infrastructure is more than sufficient

**Per-User Costs:**

| Component | Cost/User/Month | Notes |
|-----------|----------------|-------|
| Whisper inference | $0 | ~20 voice notes/day × 50 users = 1,000 notes/day; c.yaya.sh with 2x RTX A5000 handles this trivially |
| LLM inference | $0 | ~30 LLM calls/day × 50 users = 1,500 calls/day; Qwen3.5-27B at ~15 tok/s handles easily |
| WhatsApp API | $0-0.10 | Service conversations are free; occasional utility templates ~S/0.08 each |
| Database | $0 | PostgreSQL on d.yaya.sh, minimal storage |
| Bandwidth | $0 | Existing server bandwidth covers this |
| **Total marginal cost** | **~$0.10/user/month** | |

**Revenue model:** Free tier or S/29/month (~$7.50/month)
**Gross margin:** >98% (nearly all revenue is gross profit)
**Break-even:** Immediate at any price point above $0.10/month

**Bottleneck at this tier:** Andre's time, not infrastructure.

### 3.2 Tier 2: 50-500 Users (Early Traction)

**Infrastructure changes needed:**
- None for AI inference (c.yaya.sh can handle 10x more)
- PostgreSQL tuning and indexing required at ~200 users
- Redis cache recommended for session management
- Monitoring and alerting needed (Grafana/Prometheus)

**Per-User Costs:**

| Component | Cost/User/Month | Notes |
|-----------|----------------|-------|
| Whisper inference | $0 | 500 users × 20 notes/day = 10,000/day; c.yaya.sh at ~4x faster with faster-whisper = fine |
| LLM inference | $0 | 500 × 30 calls = 15,000/day; may need batching optimization but fits in 2x A5000 |
| WhatsApp API | $0.50-1.50 | Daily summary template (utility: ~$0.04/msg × 30 days = $1.20) + occasional marketing |
| Database | $0 | Still fits on d.yaya.sh |
| Support (Andre) | $2-5 | Andre handles customer issues; ~30 min/user/month average |
| **Total marginal cost** | **~$2.50-6.50/user/month** | |

**Revenue model:** S/29-49/month ($7.50-12.70/month)
**Gross margin:** 50-70% (support costs dominate)
**Break-even point:** ~300 paying users at S/29/month

**Key insight:** Support costs (Andre's time) dominate at this tier, not infrastructure. This is the classic SMB SaaS trap — each customer requires human attention but pays little.

**Critical metrics to track:**
- Support tickets per user per month (target: <1)
- Self-service resolution rate (target: >80%)
- Onboarding time per user (target: <15 min, already documented in market/14)

### 3.3 Tier 3: 500-2,000 Users (Scaling Phase)

**Infrastructure changes needed:**
- ⚠️ **First real infrastructure investment required**
- Whisper inference starts hitting GPU utilization ceiling at ~1,000 users
- LLM inference needs optimization (batching, caching common responses)
- Database needs dedicated server or managed PostgreSQL
- WhatsApp API costs become significant line item

**Whisper Capacity Analysis:**

```
Users: 1,000
Voice notes/day: 20,000
Average voice note: 15 seconds
Processing time (faster-whisper, A5000): ~2 seconds per note
Sequential capacity (1 GPU): 43,200 notes/day (24h × 3,600s / 2s)
With 2 GPUs: 86,400 notes/day
Headroom at 1,000 users: 4.3x
Headroom at 2,000 users: 2.15x ← Starting to get tight
```

**LLM Capacity Analysis:**

```
Users: 1,000
LLM calls/day: 30,000
Average call: ~500 input tokens, ~200 output tokens
Qwen3.5-27B throughput (2x A5000, TP=2): ~15 tok/s
Time per call: ~13 seconds (200 output tokens / 15 tok/s)
Sequential capacity: 6,646 calls/day
With batching (vLLM continuous batching): ~10-15x throughput = 66,000-100,000 calls/day
Headroom at 1,000 users: 2.2-3.3x
Headroom at 2,000 users: 1.1-1.65x ← Critical threshold
```

**Per-User Costs:**

| Component | Cost/User/Month | Notes |
|-----------|----------------|-------|
| Whisper inference | $0 (self-hosted) | Still fits on c.yaya.sh with optimization |
| LLM inference | $0 (self-hosted) | Needs aggressive caching of common patterns |
| WhatsApp API | $1.50-3.00 | Daily summaries + notifications + confirmations |
| Database (managed) | $0.50 | May need dedicated PostgreSQL instance ($50-100/month / users) |
| Support (1 hire) | $2-4 | Part-time support person in Peru (~$500-800/month) |
| Infrastructure maintenance | $0.50 | Monitoring, backups, updates |
| **Total marginal cost** | **~$5-8/user/month** | |

**Revenue model:** S/39-69/month ($10-17.80/month) — price increase justified by proven value
**Gross margin:** 40-55%
**Key decision point:** At ~2,000 users, Andre must either:
- Option A: Add a second GPU server (~$3,000-5,000 one-time for used hardware, or ~$150-300/month cloud)
- Option B: Move Whisper to cloud (Deepgram/AssemblyAI at ~$0.006/15sec = $0.12/user/day = $3.60/user/month)
- Option C: Switch to a smaller, faster LLM for simple transaction parsing (most messages are simple)

**Recommended:** Option C first (optimize LLM usage), Option A second (add hardware when needed).

### 3.4 Tier 4: 2,000-10,000 Users (Growth Phase)

**Infrastructure transformation required:**
This is where Yaya transitions from "indie project on Andre's servers" to "real infrastructure."

**Required changes:**
- Dedicated AI inference cluster (2-4 GPUs for Whisper, separate from LLM)
- Managed database with read replicas
- Load balancer and horizontal scaling for webhook servers
- CDN for voice note storage
- WhatsApp Business API: likely need multiple phone numbers and BSP relationship
- Support team: 2-4 people in Peru
- Engineering hire: at least 1 additional developer

**Cost Structure at 10,000 Users:**

| Component | Monthly Cost | Per User |
|-----------|-------------|----------|
| AI inference (3-4 GPUs, colocated or cloud) | $600-2,000 | $0.06-0.20 |
| WhatsApp API (10K users × ~30 template msgs × $0.04) | $12,000-15,000 | $1.20-1.50 |
| Database (managed, replicated) | $200-500 | $0.02-0.05 |
| Storage (voice notes, backups) | $100-300 | $0.01-0.03 |
| Support team (3 people @ $800-1,200/month) | $2,400-3,600 | $0.24-0.36 |
| Engineering (1 additional dev @ $1,500-2,500) | $1,500-2,500 | $0.15-0.25 |
| Operations, legal, accounting | $500-1,000 | $0.05-0.10 |
| Contingency (10%) | $1,730-2,490 | $0.17-0.25 |
| **Total** | **$19,030-27,390** | **$1.90-2.74** |

**Revenue at 10,000 users:**
- Average price: S/49/month ($12.65/month)
- Monthly revenue: $126,500
- Monthly cost: ~$23,000
- **Gross margin: ~82%**
- **Monthly profit: ~$103,500**
- **Annual profit: ~$1.24 million**

**The WhatsApp API cost dominance:**
At scale, WhatsApp API messaging is 50-65% of total costs. This is the strongest argument for developing the multi-channel strategy outlined in risks/05. If Yaya can shift even 30% of users to a free channel (Telegram or PWA), monthly savings at 10,000 users would be ~$4,000-5,000.

---

## 4. Unit Economics Summary Table

| Metric | 50 Users | 500 Users | 2,000 Users | 10,000 Users |
|--------|----------|-----------|-------------|--------------|
| Monthly Revenue | $375 | $3,750 | $20,000 | $126,500 |
| Monthly Cost | $5 | $2,500 | $12,000 | $23,000 |
| Gross Margin | 98.7% | 33.3% | 40% | 82% |
| Cost/User/Month | $0.10 | $5.00 | $6.00 | $2.30 |
| Revenue/User/Month | $7.50 | $7.50 | $10.00 | $12.65 |
| LTV:CAC (est.) | ∞ (no CAC) | 6:1 | 5:1 | 8:1 |
| Payback Period | Immediate | <1 month | 2 months | <1 month |

**The "Valley of Death" is 100-500 users:** This is where Andre's time becomes the constraint, support costs spike, but revenue hasn't yet justified hires. The research points to two strategies:
1. **Contador channel** (market/13) — contadores handle first-line support for their clients
2. **Voice-based self-service** — Yaya itself handles common support queries via conversational AI

---

## 5. SaaS Benchmark Comparison

### 5.1 Global SaaS Benchmarks (2025-2026)

| Metric | Good | Great | Elite | Yaya (Projected) |
|--------|------|-------|-------|-------------------|
| LTV:CAC | 3:1 | 4-5:1 | 6x+ | 6-8:1 ✅ |
| Payback Period | 18 months | 12 months | <9 months | <2 months ✅ |
| Annual Churn | 10-15% | 5-10% | <5% | Target: 8-12% |
| Gross Margin | 60% | 70% | 80%+ | 82% at scale ✅ |
| CAC | Varies | Lower is better | Near-zero | ~$10-25 via contadores ✅ |

### 5.2 LATAM SMB SaaS Comparison

LATAM SMB SaaS faces unique challenges (from strategy/03):
- Higher churn rates (15-25% annually for micro-enterprise segment)
- Lower ARPU ($5-20/month typical for micro-enterprise tools)
- Higher support costs (lower digital literacy)
- Payment collection challenges (credit card penetration ~25% in Peru)

**Yaya's advantages vs. LATAM norms:**
1. **Near-zero CAC via contador channel** — most LATAM SaaS spends $50-200 per SMB acquisition
2. **Self-hosted AI eliminates the largest variable cost** — competitors using OpenAI/Anthropic APIs pay $0.50-3/user/month for AI
3. **WhatsApp-native = zero training cost** — no app download, no learning curve
4. **Voice-first = lower support burden** — users interact naturally, reducing confusion-driven tickets

**Yaya's challenges vs. LATAM norms:**
1. **Payment collection** — micro-enterprises don't have credit cards; need Yape/Plin/cash payment integration
2. **Churn risk from informality** — informal businesses open and close frequently; ~40% of target market
3. **Price sensitivity** — S/29-49/month is 0.5-1% of monthly revenue for target businesses, but feels significant to low-income owners

---

## 6. Pricing Strategy Evolution

### 6.1 Phase 1: MVP (0-50 users) — Free

**Price: S/0 (Free)**
- Rationale: Validate product-market fit, build reference customers
- Revenue: $0
- Duration: Months 1-3 of operation

### 6.2 Phase 2: Early Adoption (50-200 users) — Freemium

**Free Tier:** Basic voice recording + daily summary (limited to 10 transactions/day)
**Paid Tier: S/29/month** (~$7.50) — Unlimited transactions + reports + contador export
- Rationale: Free tier drives adoption; paid tier captures businesses that use it heavily
- Expected conversion: 30-40% free → paid (high because value is immediately tangible)

### 6.3 Phase 3: Growth (200-2,000 users) — Tiered Pricing

| Tier | Price (S//month) | Features |
|------|-----------------|----------|
| Básico | S/19 | 20 transactions/day, weekly summary |
| Profesional | S/49 | Unlimited, daily summary, contador export, credit tracking |
| Negocio | S/99 | Multi-location, employee management, inventory, priority support |

### 6.4 Phase 4: Scale (2,000+ users) — Value-Based Pricing

At scale, Yaya has enough data to prove its value. Pricing can evolve to:
- **Percentage of tracked revenue:** 0.5-1% of transactions recorded through Yaya (common in fintech)
- **Contador licensing:** Contadores pay S/199-499/month for a dashboard managing 20-50 clients
- **Financial services commissions:** Lending, insurance, payment processing referral fees

### 6.5 Payment Collection Strategy for Peru

| Method | Penetration | Cost | Best For |
|--------|-------------|------|----------|
| Yape (BCP) | ~70% of adults | 0% | Monthly auto-payment |
| Plin (Interbank) | ~40% of adults | 0% | Monthly auto-payment |
| Bank transfer | Universal | Varies | Annual prepayment |
| Cash via agent network | Universal | ~2-3% | Unbanked users |
| Credit card (Stripe/Mercado Pago) | ~25% | 3.5-4.5% | Higher-income segment |

**Recommended:** Yape as primary payment method. S/29-49 is within Yape's comfortable transfer range. Set up monthly recurring payment reminder via WhatsApp.

---

## 7. The Path to $1 Million ARR

Working backwards from $1M ARR:

```
$1,000,000 / 12 months = $83,333/month MRR
$83,333 / $10 average revenue per user = 8,333 paying users
Assuming 35% free-to-paid conversion and 15% annual churn:
Need ~24,000 total users (8,333 paying / 35% conversion)
At 500 new users/month growth: ~4 years from first user
At 1,000 new users/month growth: ~2 years from first user
```

**The contador accelerator:** If each contador manages 15-30 clients and Yaya signs up 50 contadores in Lima:
- 50 contadores × 20 clients average = 1,000 businesses
- At 40% adoption rate = 400 paying users
- Timeline to first 400 paying users: 6-12 months via contador channel

**$1M ARR is achievable in 2-3 years** with the contador distribution model and 500+ new users/month organic growth.

---

## 8. Key Risks to Unit Economics

### 8.1 WhatsApp Pricing Increases
If Meta doubles per-message pricing, Yaya's cost at 10,000 users jumps from $23K to ~$35K/month. Still profitable, but gross margin drops from 82% to 72%. **Mitigation:** Multi-channel strategy (risks/05).

### 8.2 GPU Cloud Costs
If c.yaya.sh fails and inference must move to cloud, monthly AI costs go from $0 to $500-2,000. **Mitigation:** Keep hardware current; budget for 1 replacement GPU every 2-3 years (~$1,500-3,000).

### 8.3 Churn Exceeds Projections
LATAM micro-enterprise churn can reach 25-30% annually. At 30% churn with 500 users, Yaya loses 150 users/year and must acquire 150+ just to stay flat. **Mitigation:** Focus on retention (contador sticky channel, daily value delivery).

### 8.4 Price Sensitivity Floor
If S/29/month is too high for the target market, ARPU drops. At S/19/month, break-even pushes to 450+ users instead of 300. **Mitigation:** Freemium model absorbs price-sensitive users while paid tier captures willingness-to-pay.

---

## 9. Key Thesis

### Thesis 30: Yaya's Self-Hosted AI Creates a 10-20x Cost Advantage Over Cloud-Dependent Competitors, Making Profitability Achievable at ~300 Users
**Evidence: ★★★★☆**

A competitor using OpenAI GPT-4 for NLU + Deepgram for STT would pay $2-5/user/month in AI costs alone. Yaya pays $0 (self-hosted). This structural advantage means Yaya can offer lower prices, sustain freemium tiers, and reach profitability at ~300 paying users versus competitors who need 1,000+ users. The four-star rating (not five) reflects uncertainty about scaling hardware costs and whether the self-hosted advantage persists beyond 5,000 users where dedicated cloud infrastructure may be more reliable.

### Thesis 31: WhatsApp API Costs Will Be Yaya's Largest Expense by 500 Users, Representing 50-65% of Total Costs at Scale
**Evidence: ★★★★★**

At $0.04/utility template message × 30 daily summaries/month × 10,000 users = $12,000/month in WhatsApp API costs alone. This is 2-3x all other costs combined. The multi-channel strategy in risks/05 is not just a platform risk mitigation — it's a unit economics optimization.

---

*This document fills the gap between "near-zero MVP cost" (extensively documented) and "what does profitability look like at scale" (previously unaddressed). The model shows Yaya's path to profitability is unusually short for a SaaS business (~300 users), but the "valley of death" between 100-500 users — where Andre's time is the bottleneck — must be navigated carefully. The contador distribution channel is the key to crossing this valley efficiently.*
