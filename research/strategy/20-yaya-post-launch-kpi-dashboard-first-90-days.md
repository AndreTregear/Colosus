# Yaya Platform: Post-Launch KPI Dashboard & First 90 Days Metrics Framework

**Research Document #20 (Strategy)**
**Date:** March 21, 2026
**Category:** Strategy / Metrics
**Relevance:** Critical — defines what Andre should track from Day 1 to know if Yaya is working

---

## Executive Summary

Most SaaS founders track vanity metrics (signups, page views) and miss the signals that actually predict success or failure. For Yaya — a voice-first WhatsApp platform for informal Peruvian micro-enterprises — the standard SaaS playbook needs significant adaptation. This document defines the exact KPIs Andre should track from Day 1, the thresholds that signal product-market fit, and a weekly operating rhythm that keeps execution focused.

---

## 1. Why Standard SaaS Metrics Don't Apply Directly

Standard SaaS metrics assume:
- Web-based product with landing pages and trial signups
- Credit card on file at sign-up
- Self-service onboarding
- Large sample sizes (hundreds of trials/month)

Yaya's reality:
- WhatsApp-native (no landing page or web funnel)
- Payment via Yape, cash, or contador (no credit card)
- Onboarding is conversational (WhatsApp + voice)
- Small initial sample (1-50 users in first 90 days)
- Bilingual interface (Spanish, informal Peruvian)

This means traditional conversion funnels (visitor → trial → paid) don't exist. Yaya's funnel is:

```
Referral/Discovery → WhatsApp conversation → First voice note → 
Regular usage → Perceived value → Payment → Retention
```

---

## 2. The Yaya KPI Framework: Three Tiers

### Tier 1: North Star Metrics (Check Daily)

These are the metrics that directly indicate whether the business is working.

#### 2.1 Voice Notes Per Active User Per Day (VNPUAD)

**What it measures:** How many voice notes each active user sends per day.

**Why it matters:** Voice notes are Yaya's core interaction. If users aren't sending voice notes, they're not using the product. More voice notes = more data = more value from reports.

**Target thresholds:**

| Level | VNPUAD | Interpretation |
|---|---|---|
| 🔴 Danger | <1 | Users aren't using Yaya. Product problem. |
| 🟡 Concern | 1-3 | Minimal usage. May not see enough value. |
| 🟢 Good | 3-7 | Regular transaction logging. Core value delivered. |
| 🚀 Excellent | 7+ | Yaya is embedded in daily workflow. |

**How to measure:** Count total voice notes received / active users (users who sent ≥1 message in past 7 days).

#### 2.2 Weekly Active Users (WAU)

**What it measures:** Users who interacted with Yaya at least once in the past 7 days.

**Why it matters:** Better than DAU for a business tool — salon owners may not work every day, but should interact at least weekly.

**Target:** In first 90 days, WAU/Total users ratio should be >60%.

| Level | WAU/Total | Interpretation |
|---|---|---|
| 🔴 Danger | <40% | Most users have stopped using Yaya. |
| 🟡 Concern | 40-60% | Moderate engagement. Investigate drop-offs. |
| 🟢 Good | 60-80% | Healthy engagement. |
| 🚀 Excellent | >80% | Product is essential to daily operations. |

#### 2.3 Transcription Accuracy Rate (TAR)

**What it measures:** Percentage of voice notes where the financial data was transcribed correctly (no user correction needed).

**Why it matters:** This is Yaya's trust metric. Every incorrect transcription erodes confidence. A user who corrects Yaya 3 times in a row will stop using it.

| Level | TAR | Interpretation |
|---|---|---|
| 🔴 Danger | <85% | Users losing trust. Emergency fix needed. |
| 🟡 Concern | 85-92% | Acceptable but needs improvement. |
| 🟢 Good | 92-97% | Reliable. Users trust the system. |
| 🚀 Excellent | >97% | Near-human accuracy. Competitive moat. |

**How to measure:** Track user corrections (when user edits a Yaya-transcribed amount). Correction rate = 1 - TAR.

### Tier 2: Business Health Metrics (Check Weekly)

#### 2.4 Net Revenue (Monthly)

**What it measures:** Total subscription revenue collected.

**How to track:**
- Count paying users × price tier
- For contador-channel users: wholesale price
- Subtract payment processing fees

**First 90 days targets:**
- Month 1 (pilot): $0 (free for Customer Zero)
- Month 2: First paying users, S/29-290 (1-10 users)
- Month 3: S/290-1,450 (10-50 users at various tiers)

#### 2.5 Time to First Voice Note (TTFVN)

**What it measures:** Time from when a user first messages Yaya to when they send their first business voice note.

**Why it matters:** This is Yaya's "activation metric" — the moment the user experiences core value. If TTFVN is too long, the onboarding flow needs work.

| Level | TTFVN | Interpretation |
|---|---|---|
| 🔴 Danger | >24 hours | Onboarding is broken or confusing. |
| 🟡 Concern | 4-24 hours | User needed coaching or returned later. |
| 🟢 Good | 30 min - 4 hours | Natural onboarding, possibly after business hours. |
| 🚀 Excellent | <30 minutes | Immediate understanding and adoption. |

#### 2.6 Day 7 Retention

**What it measures:** Percentage of users who are still active 7 days after first interaction.

**Why it matters:** Standard SaaS benchmark. For WhatsApp-native products, Day 7 retention is the critical window — if a user returns after a week, they're likely to stay.

| Level | Day 7 Retention | Interpretation |
|---|---|---|
| 🔴 Danger | <30% | Product is not sticky. Fundamental issue. |
| 🟡 Concern | 30-50% | Some value, but many dropping off. |
| 🟢 Good | 50-70% | Healthy for early-stage micro-SaaS. |
| 🚀 Excellent | >70% | Strong product-market fit signal. |

#### 2.7 Day 30 Retention

Same as above but at 30-day mark. Expected to be lower.

| Level | Day 30 Retention | Interpretation |
|---|---|---|
| 🔴 Danger | <20% | Product doesn't have lasting value. |
| 🟡 Concern | 20-40% | Needs investigation. |
| 🟢 Good | 40-60% | Good for early micro-SaaS. |
| 🚀 Excellent | >60% | Exceptional. Scale with confidence. |

#### 2.8 Revenue Per Voice Note (RPVN)

**What it measures:** Average monetary value recorded per voice note.

**Why it matters:** Higher RPVN means users are recording more valuable transactions, which means Yaya's data is more valuable to them. Also indicates whether users are logging ALL transactions or just some.

**Example:** If a salon does S/1,500/week and sends 30 voice notes, RPVN = S/50. If they only log big transactions, RPVN might be S/150 but they're missing 70% of their revenue.

#### 2.9 Payment Success Rate

**What it measures:** Percentage of billing attempts that successfully collect payment.

| Level | Success Rate | Interpretation |
|---|---|---|
| 🔴 Danger | <70% | Major billing infrastructure issue. |
| 🟡 Concern | 70-85% | Need better dunning / follow-up. |
| 🟢 Good | 85-95% | Healthy for LATAM micro-enterprise market. |
| 🚀 Excellent | >95% | Exceptional collection rate. |

**Benchmark:** Yape's 93% approval rate suggests this is achievable.

### Tier 3: Strategic Metrics (Check Monthly)

#### 2.10 Contador Acquisition Rate

**What it measures:** Number of new contadores onboarded per month.

**Why it matters:** Each contador brings 15-30 pre-supported users. This is the scaling lever.

**Target:** 1-2 contadores/month in first 90 days → 3-5/month by Month 6.

#### 2.11 Organic Referral Rate

**What it measures:** Percentage of new users who came from existing user referrals (not Andre's direct outreach or contador channel).

**Why it matters:** Organic referrals signal genuine product satisfaction and reduce CAC to ~$0.

**Target:** >20% of new users from referrals by Month 3.

#### 2.12 Feature Adoption Map

Track which features users actually use:

| Feature | % Users Using | Priority |
|---|---|---|
| Voice note transaction logging | Must be ~100% | Core — if <90%, product is failing |
| Daily sales summary (auto) | Target >70% | High — this is the "aha moment" |
| Weekly report | Target >50% | High — weekly reflection value |
| Client name recognition | Target >40% | Medium — builds client database |
| Expense tracking | Target >30% | Medium — extends value beyond revenue |
| SUNAT boleta/factura | Target >20% | Low initially — compliance value |

#### 2.13 Net Promoter Score (NPS) — Peruvian-Adapted

Standard NPS ("On a scale of 0-10, how likely are you to recommend...") doesn't translate well to informal Peruvian micro-enterprise owners. Instead, use a culturally adapted version:

**Yaya's NPS question (via WhatsApp):**
"¿Le recomendarías Yaya a una amiga que tiene salón? 🙏"
- "¡Sí, claro!" → Promoter
- "Tal vez" / "Depende" → Passive
- "No" / no response → Detractor

**Better signal:** Actually track referrals. If users spontaneously share Yaya with colleagues, that's a stronger signal than any survey.

---

## 3. The Dashboard: What Andre Sees Every Morning

### Daily View (Mobile-Friendly, WhatsApp-Delivered)

Yaya should send Andre a daily operational summary via WhatsApp at 8:00 AM:

```
📊 Yaya Dashboard — Marzo 21, 2026

👥 Users: 12 active / 15 total (80% WAU)
🎙️ Voice notes yesterday: 47 (3.9/user avg)
✅ Transcription accuracy: 94.2% (2 corrections)
💰 Total recorded revenue: S/2,340
📈 Busiest user: María (Salón Bella) — 8 notes
⚠️ Inactive >3 days: Carmen (last active Mar 18)

🔔 Action needed:
- Follow up with Carmen (3 days inactive)
- Review 2 transcription corrections (accuracy issue?)
```

### Weekly View (Detailed, in Yaya Admin Panel or Spreadsheet)

| Metric | This Week | Last Week | Trend | Target |
|---|---|---|---|---|
| WAU | 12 | 10 | 📈 +20% | >60% of total |
| Voice notes/user/day | 3.9 | 3.2 | 📈 +22% | >3 |
| Transcription accuracy | 94.2% | 93.1% | 📈 +1.1% | >92% |
| Revenue recorded | S/16,380 | S/14,200 | 📈 +15% | Growing |
| Day 7 retention | 67% | 50% | 📈 +17% | >50% |
| Paying users | 8 | 5 | 📈 +60% | Growing |
| MRR | S/232 | S/145 | 📈 +60% | Growing |
| Payment success | 100% | 80% | 📈 +20% | >85% |
| Contadores onboarded | 1 | 0 | 📈 New! | 1-2/month |

### Monthly View (Strategic)

Monthly synthesis document with:
1. All metrics trends graphed
2. Cohort analysis (how are March signups behaving vs. April signups?)
3. Revenue and expense breakdown
4. Top user insights (who's getting most value? why?)
5. Churn analysis (who left? why?)
6. Feature requests and product feedback summary
7. Competitive landscape changes
8. Next month priorities

---

## 4. Product-Market Fit Signals for Yaya

### The Sean Ellis Test (Adapted)

Traditional: "How would you feel if you could no longer use [product]?"
- Very disappointed → 40%+ means PMF

**Yaya version (via WhatsApp):**
"Imagínate que Yaya desaparece mañana. ¿Qué harías?"
- "¡No! ¿Cómo voy a llevar mis cuentas?" → Very disappointed
- "Buscaría otra cosa" → Somewhat disappointed
- "No importa, uso mi cuadernito" → Not disappointed

**PMF signal:** >40% of active users say "Very disappointed"

### Behavioral PMF Signals (No Survey Needed)

These behavioral patterns indicate PMF without asking:

| Signal | Threshold | PMF Indicator? |
|---|---|---|
| Day 30 retention >50% | ✅ Yes | Users finding lasting value |
| Voice notes/day >5 for power users | ✅ Yes | Embedded in workflow |
| Organic referrals >20% of new users | ✅ Yes | Users advocating |
| Users share daily summary screenshots | ✅ Yes | Proud of the data |
| Users ask for new features | ✅ Yes | Invested in the product |
| Users resist cancellation when payment fails | ✅ Yes | Would rather fix payment than lose Yaya |

### Anti-PMF Signals (Red Flags)

| Signal | Threshold | Warning |
|---|---|---|
| Day 7 retention <30% | 🔴 | Product not sticky |
| Voice notes/day <1 for most users | 🔴 | Not using core feature |
| >3 transcription corrections per day per user | 🔴 | Accuracy driving users away |
| Users ask "what does Yaya do?" after 1 week | 🔴 | Value proposition unclear |
| Contador refuses to recommend to other clients | 🔴 | Expert intermediary sees no value |

---

## 5. First 90 Days: Week-by-Week Operating Rhythm

### Weeks 1-4: Customer Zero (1-3 users)

**Focus:** Onboarding experience and transcription accuracy.

**Daily:**
- Review every voice note and transcription manually
- Note every error and confusion point
- Talk to Customer Zero daily (WhatsApp check-in)

**Weekly:**
- Analyze: What caused each transcription error?
- Fix: Update Whisper fine-tuning data with corrections
- Measure: TTFVN, accuracy rate, voice notes per day
- Document: Write down every piece of feedback verbatim

**Key question:** Does Customer Zero send voice notes without prompting by Day 7?

### Weeks 5-8: Early Pilot (5-15 users)

**Focus:** Retention and habitual usage.

**Daily:**
- Check WAU and voice note volumes
- Follow up with users who've gone 2+ days inactive
- Review and fix transcription errors

**Weekly:**
- Cohort analysis: Are Week 5 signups behaving differently from Week 1?
- NPS check: Ask 2-3 users the PMF question
- Feature prioritization: What are users asking for?
- Contador outreach: Can existing users introduce their contador?

**Key question:** Are 50%+ of users still active at Day 30?

### Weeks 9-12: Expanded Pilot (15-50 users)

**Focus:** Payment, scalability, and contador channel.

**Daily:**
- Dashboard review (automated by now)
- Payment collection monitoring

**Weekly:**
- Revenue tracking (MRR, payment success rate)
- Churn analysis (who left? exit interview via WhatsApp)
- Contador effectiveness (how many users per contador?)
- Feature adoption map (what features drive retention?)

**Key question:** Would 40%+ of users be "very disappointed" if Yaya disappeared?

---

## 6. Metrics Implementation: Technical Requirements

### 6.1 Data Model

Every metric above can be derived from four database tables:

```sql
-- Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(15),
    name VARCHAR(100),
    created_at TIMESTAMP,
    contador_id INTEGER REFERENCES contadores(id),
    channel VARCHAR(20)  -- 'direct', 'contador', 'referral'
);

-- Voice Notes
CREATE TABLE voice_notes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    received_at TIMESTAMP,
    duration_seconds INTEGER,
    transcription TEXT,
    financial_amount DECIMAL(10,2),
    was_corrected BOOLEAN DEFAULT FALSE,
    correction_text TEXT
);

-- Payments
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    amount DECIMAL(10,2),
    method VARCHAR(20),  -- 'yape', 'cash', 'contador', 'card'
    status VARCHAR(20),  -- 'success', 'failed', 'pending'
    attempted_at TIMESTAMP,
    completed_at TIMESTAMP
);

-- Sessions (for activity tracking)
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    started_at TIMESTAMP,
    messages_count INTEGER,
    voice_notes_count INTEGER
);
```

### 6.2 Dashboard Generation

For MVP, the daily dashboard can be a simple Python script that queries PostgreSQL and formats the WhatsApp message. No need for Metabase/Grafana until 100+ users.

```python
# Daily dashboard generator (runs at 8:00 AM via cron)
def generate_daily_dashboard():
    yesterday = date.today() - timedelta(days=1)
    
    active_users = count_active_users(past_days=7)
    total_users = count_total_users()
    voice_notes = count_voice_notes(date=yesterday)
    avg_per_user = voice_notes / max(active_users, 1)
    corrections = count_corrections(date=yesterday)
    accuracy = 1 - (corrections / max(voice_notes, 1))
    total_revenue = sum_recorded_revenue(date=yesterday)
    inactive_users = get_inactive_users(days_inactive=3)
    
    return format_whatsapp_dashboard(...)
```

---

## 7. Key Insights

1. **Voice notes per day is the single most important metric.** Not MRR, not signups — voice notes. If users are sending voice notes, everything else follows. If they're not, nothing else matters.

2. **Transcription accuracy is the trust metric.** Every correction erodes confidence. Target 92%+ from Day 1, which means the Whisper fine-tuning (technology/16) must be done before Customer Zero onboarding.

3. **The first 90 days are qualitative, not quantitative.** With 1-50 users, statistical significance is impossible. Instead, focus on depth: understand exactly why each user behaves as they do. Talk to every churned user.

4. **Andre's daily time cost is a hidden KPI.** If Andre spends >2 hours/day on Yaya operations at 20 users, the model doesn't scale. Track this explicitly.

5. **Don't launch a web dashboard.** The daily summary via WhatsApp is the dashboard. Andre checks WhatsApp anyway. Building a separate admin panel before 100 users is premature optimization.

6. **Cohort the contadores separately.** Contador-referred users will behave differently than direct users (lower churn, lower engagement per user but steadier). Don't mix them in aggregate metrics.

7. **The "screenshot test"** is the ultimate PMF signal: when a salon owner screenshots her daily Yaya summary and shares it on her personal WhatsApp status (stories), Yaya has achieved product-market fit. This is unmeasurable but observable.

---

## 8. Metrics That DON'T Matter in the First 90 Days

| Metric | Why It Doesn't Matter Yet |
|---|---|
| CAC (Customer Acquisition Cost) | Andre is doing all acquisition personally. CAC = Andre's time. |
| LTV (Lifetime Value) | Need 6+ months of data to calculate meaningfully. |
| MRR Growth Rate % | Percentages are meaningless with <50 users. |
| Churn Rate (%) | One user leaving = 10% churn at 10 users. Misleading. |
| Traffic / Page Views | No website. WhatsApp-native. |
| Social Media Followers | Irrelevant for informal B2B in Peru. |
| App Downloads | No app. WhatsApp-native. |

---

*Sources: SaaS Consult 90-Day Launch Strategy (2025), Startups for the Rest of Us Episode 434 (SaaS KPIs), OnePrism PMF Metrics (2025), Oxx Go-To-Market Fit KPIs Framework (2025), Sean Ellis PMF Survey methodology, adapted for Peruvian micro-enterprise context based on prior Yaya research (market/12, market/14, strategy/19)*
