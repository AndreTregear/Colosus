# Conversational AI Success Metrics & Benchmarks for SMBs

**Classification:** Technology Research — Product KPIs  
**Date:** March 21, 2026  
**Sources:** Calabrio Bot Analytics (2025), ChatBench.org (2026), Freshworks (2025), Interakt WhatsApp API Benchmarks (2025), ChatArchitect (2025), TringTring AI (2025), Wsla.io (2026), Symbl.ai (2025), AgentiveAIQ (2025)

---

## 1. Executive Summary

As Yaya Platform moves from research to product development, defining success metrics is critical. This document synthesizes industry benchmarks for conversational AI performance — from WhatsApp-specific metrics to general chatbot KPIs — and translates them into a Yaya-specific measurement framework.

The key insight: **most chatbot metrics were designed for customer support deflection, not business management.** Yaya operates in a fundamentally different context — it's not answering questions about order status; it's running someone's business. This requires a novel metrics framework that blends conversational AI benchmarks with business operations KPIs.

---

## 2. Industry Benchmark Metrics: The Standard Framework

### 2.1 Core Operational Metrics

| Metric | Definition | Industry Average | Good | Excellent | Yaya Target |
|--------|-----------|-----------------|------|-----------|-------------|
| **First Response Time (FRT)** | Time from user message to first bot response | 12 min (human) / 6–15 sec (bot) | 5 min | 2 min | <3 sec (fully automated) |
| **Average Resolution Time** | Time from first message to issue/task resolved | 4 hours | 1 hour | 20 min | <2 min (for routine tasks) |
| **Task Completion Rate** | % of user requests successfully fulfilled by bot | 60% | 75% | 85%+ | 90%+ (for supported features) |
| **First Contact Resolution (FCR)** | % of queries resolved in first interaction | 60% | 75% | 85% | 80%+ |
| **Bot Deflection Rate** | % of queries resolved without human intervention | 30% | 50% | 70% | 95%+ (no human agents) |
| **Message Delivery Rate** | % of messages successfully delivered | 96% | 98% | 99%+ | 99%+ |

**Source note:** These benchmarks are from customer support contexts (Wsla.io 2026, ChatArchitect 2025). Yaya's context is different — there is no human agent to escalate to. The bot IS the product. This means Task Completion Rate and FCR are existential, not aspirational.

### 2.2 WhatsApp-Specific Benchmarks (Interakt 2025)

| Metric | Average (All SMBs) | Top 10% Performers | Yaya Target |
|--------|--------------------|--------------------|-------------|
| Message Open Rate | 96% | 99% | 98%+ (inherent to WhatsApp) |
| Click-Through Rate | 26% | 35% | N/A (Yaya is conversational, not campaign-based) |
| Conversion Rate | 12% | 18% | Track differently (see Section 4) |
| Customer Retention (post-purchase) | 65% | 82% | 85%+ (monthly active retention) |
| Average Message Frequency | 8/month | 12/month | 60+/month (daily business use) |

**Critical difference:** Most WhatsApp benchmarks measure marketing campaign performance. Yaya's usage pattern is fundamentally different — it's a daily operational tool, not a periodic marketing channel. Users should be sending 2–5+ messages per day, not 8 per month.

### 2.3 Customer Satisfaction Metrics

| Metric | Definition | Industry Benchmark | Yaya Target |
|--------|-----------|-------------------|-------------|
| **CSAT** | Customer satisfaction (1–5 scale) | 3.8/5 avg; 4.2 good; 4.6 excellent | 4.5+ |
| **NPS** | Net Promoter Score (-100 to +100) | 30 avg; 50 good; 70 excellent | 50+ at launch, 70+ by Month 12 |
| **Bot Experience Score (BES)** | Calabrio's unbiased bot experience metric (0–100) | Varies by industry | Establish baseline, improve quarterly |
| **Customer Effort Score (CES)** | Ease of resolving issue (1–10) | Industry average ~6.5 | 8+ (it should feel effortless) |

### 2.4 NLP/AI Performance Metrics

| Metric | Definition | Target |
|--------|-----------|--------|
| **Intent Recognition Accuracy** | Correctly classified user intents ÷ total queries | 85–95% |
| **Fallback Rate** | % of messages the bot couldn't understand | <10% (support); <5% for Yaya |
| **Sentiment Detection Accuracy** | Correctly identified positive/negative sentiment | >85% |
| **Voice-to-Text Accuracy** | STT accuracy for Peruvian Spanish voice notes | >90% word accuracy; >95% intent accuracy |
| **Entity Extraction Accuracy** | Correctly extracted business data (amounts, items, dates) | >95% (with confirmation step) |
| **Response Latency** | Time from message receipt to response sent | <2 seconds for text, <5 seconds for voice notes |

---

## 3. Beyond Support Metrics: Business Management KPIs

Traditional chatbot metrics measure how well a bot answers questions. Yaya needs to measure how well it **runs a business**. This requires a novel framework.

### 3.1 The "Conversational ERP" Metrics Stack

**Layer 1: Conversational Quality** (Is the AI interaction good?)
- Intent recognition accuracy
- Fallback rate
- Response relevance score
- Confirmation acceptance rate (user agrees with AI's interpretation)
- Language naturalness (Peruvian Spanish fluency)

**Layer 2: Task Execution** (Did the business task get done?)
- Transaction recording accuracy (amount, items, date correct)
- Invoice generation success rate
- Appointment scheduling accuracy (correct time, correct client)
- Inventory update accuracy
- Payment reminder delivery rate

**Layer 3: Business Impact** (Did it help the business?)
- Time saved per user per day (measured by task count × estimated manual time)
- Revenue visibility improvement (% of transactions tracked vs. estimated total)
- No-show reduction rate (for appointment-based businesses)
- Payment collection improvement (faster payment, fewer defaults)
- Supplier order accuracy

**Layer 4: Platform Health** (Is the product growing?)
- Daily Active Users (DAU) / Monthly Active Users (MAU) ratio
- Messages per user per day
- Feature adoption breadth (how many features each user engages with)
- Organic referral rate (users who invite other businesses)
- Free-to-paid conversion rate
- Monthly churn rate
- Net Revenue Retention (NRR)

### 3.2 Yaya-Specific North Star Metrics

Based on the research, these are the metrics that matter most:

#### North Star #1: Daily Active Usage Rate
**Definition:** % of registered users who send at least 1 business message per day  
**Target:** 60%+ (comparable to WhatsApp's personal usage frequency)  
**Why it matters:** If users aren't using Yaya daily, they're still managing their business in their head or on paper. Daily usage = habit formation = retention.

#### North Star #2: Transaction Capture Rate
**Definition:** % of a business's actual transactions recorded in Yaya vs. total estimated transactions  
**Target:** 70%+ within 30 days of activation  
**Why it matters:** The more transactions captured, the more valuable the data becomes for analytics, credit scoring, and the switching cost moat. A user capturing only 20% of their transactions gets minimal value.

#### North Star #3: Time-to-First-Value (TTFV)
**Definition:** Time from first message to user's first "aha moment" (recording a sale, sending an invoice, scheduling an appointment)  
**Target:** <5 minutes  
**Why it matters:** 43% of SMB SaaS churn happens in the first 90 days (strategy/03). If the first interaction isn't immediately valuable, the user will never come back.

#### North Star #4: 30-Day Retention
**Definition:** % of users who are still active 30 days after first interaction  
**Target:** 60%+ (Month 6), 75%+ (Month 12)  
**Why it matters:** This is the metric that determines whether the business model works. At 5% monthly churn, LTV:CAC = 8x. At 10% monthly churn, it's unsustainable.

---

## 4. Benchmark Comparison: Yaya vs. Industry

### 4.1 What "Good" Looks Like for WhatsApp AI Bots

Based on TringTring AI research (2025), leading WhatsApp AI deployments achieve:

| Metric | Enterprise (Support) | SMB (Marketing) | Yaya Target (Business Ops) |
|--------|---------------------|-----------------|---------------------------|
| Containment Rate | 70–85% | 40–60% | 95%+ (no human fallback) |
| Intent Accuracy | 85–95% | 75–85% | 90%+ |
| CSAT | 4.0–4.5 | 3.5–4.0 | 4.5+ |
| Avg Resolution Time | 8.5 min | N/A | <2 min (task recording) |
| Bot Deflection | 70–85% | 40–60% | 95%+ |
| Conversation Length | 3–5 messages | 2–4 messages | 2–3 messages per task |

### 4.2 Forrester's Conversational AI Impact Data

Forrester data cited by TringTring AI (2025) shows that companies with conversational AI tied to analytics frameworks achieve:
- **32% higher conversion rates**
- **26% faster resolution times**
- **18% reduction in human escalation costs**

For Yaya, the equivalent would be:
- **32% faster transaction recording** (compared to paper/Excel)
- **26% less time spent on business administration** (per day)
- **18% improvement in payment collection** (through automated reminders)

### 4.3 WhatsApp Commerce Conversion Benchmarks

From Interakt's 2025 report:
- **Cart recovery messages** sent within 30 minutes convert **18–25%** of abandoned carts
- **Automated follow-ups** within 24 hours increase conversion probability by **27%**
- **Personalized + segmented campaigns** achieve highest CTRs

For Yaya's appointment-based businesses:
- **No-show reminder messages** should reduce no-shows by **40–67%** (based on industry data from GTM strategy)
- **Payment reminder messages** should improve same-day collection by **20–30%**
- **Daily summary messages** should drive **85%+ open rate** (WhatsApp utility messages)

---

## 5. The "Five Pillars" Framework for Yaya Success Measurement

### Pillar 1: Conversational Intelligence
*"Does Yaya understand what the user means?"*

| KPI | Measurement | Target (Launch) | Target (Month 12) |
|-----|------------|-----------------|-------------------|
| Intent Recognition Accuracy | % of messages correctly classified | 85% | 93% |
| Fallback Rate | % of messages triggering "I don't understand" | <15% | <5% |
| Voice Note Processing Success | % of voice notes correctly transcribed and parsed | 75% | 90% |
| Confirmation Acceptance Rate | % of times user confirms AI's interpretation on first try | 70% | 85% |
| Language Naturalness Score | User-rated naturalness of responses (1–5) | 3.5 | 4.5 |

### Pillar 2: Business Task Execution
*"Does Yaya actually get the work done?"*

| KPI | Measurement | Target (Launch) | Target (Month 12) |
|-----|------------|-----------------|-------------------|
| Transaction Recording Accuracy | % of recorded transactions with correct amount/items | 95% (with confirmation) | 98% |
| Invoice Generation Success | % of invoice requests that produce valid SUNAT-compliant invoices | 90% | 99% |
| Appointment Scheduling Accuracy | % of appointments correctly captured (time, client, service) | 90% | 97% |
| Payment Reminder Delivery | % of scheduled reminders actually delivered | 99% | 99.5% |
| Daily Summary Delivery | % of active users receiving their daily business summary | 95% | 99% |

### Pillar 3: User Engagement & Retention
*"Do users keep coming back?"*

| KPI | Measurement | Target (Launch) | Target (Month 12) |
|-----|------------|-----------------|-------------------|
| Daily Active Usage Rate | % of registered users active per day | 40% | 65% |
| Messages per User per Day | Average business messages sent | 3 | 8 |
| Feature Breadth Score | Average features used per user (out of total) | 2/8 | 5/8 |
| 7-Day Activation Rate | % of new users who complete a business task in first 7 days | 50% | 70% |
| 30-Day Retention | % of users still active after 30 days | 50% | 70% |
| 90-Day Retention | % of users still active after 90 days | 30% | 55% |
| Monthly Churn Rate | % of paying users who cancel | <8% | <4% |

### Pillar 4: Business Impact
*"Is Yaya making the user's business better?"*

| KPI | Measurement | Target (Phase 1) | Target (Phase 2) |
|-----|------------|-----------------|-------------------|
| Transaction Capture Rate | % of estimated total transactions recorded | 40% | 75% |
| Time Saved per Day | Estimated minutes saved on admin tasks | 20 min | 45 min |
| No-Show Reduction (beauty/health) | % reduction in appointment no-shows | 40% | 60% |
| Payment Collection Speed | Average days to receive payment | Reduce by 2 days | Reduce by 5 days |
| Revenue Visibility Score | % of business revenue tracked digitally | 30% | 70% |
| Sean Ellis "PMF" Score | % of users "very disappointed" without Yaya | 30% | 45%+ |

### Pillar 5: Financial Health
*"Is the business model working?"*

| KPI | Measurement | Target (Month 6) | Target (Month 18) |
|-----|------------|-----------------|-------------------|
| Free-to-Paid Conversion | % of free users who upgrade | 5% | 12% |
| ARPU (monthly) | Average revenue per paying user | $13 | $22 |
| LTV (12-month) | Average lifetime value | $120 | $240 |
| CAC (blended) | Average customer acquisition cost | $20 | $30 |
| LTV:CAC Ratio | | 6x | 8x |
| Gross Margin | Revenue minus COGS | 80% | 88% |
| Net Revenue Retention (NRR) | Revenue from existing users vs. 12 months prior | 90% | 110% |
| MRR Growth | Month-over-month MRR increase | 15% | 20% |

---

## 6. Measurement Infrastructure

### 6.1 What to Build from Day One

Yaya should instrument these analytics from the first user interaction:

1. **Message-level logging:** Every message in/out with timestamps, intent classification, confidence score, and entities extracted
2. **Task-level tracking:** Every business task (record sale, schedule appointment, send reminder) with start time, completion status, and accuracy
3. **Session-level metrics:** Session duration, messages per session, tasks per session
4. **User-level cohort tracking:** Sign-up date, activation date, feature adoption sequence, retention cohort
5. **Business-level impact:** Transaction volume trends, revenue trends, appointment fulfillment rates

### 6.2 Dashboard Architecture

**Real-Time Dashboard (Operations):**
- Active conversations right now
- Message queue depth
- Response latency (p50, p95, p99)
- Error rate / fallback rate
- Voice note processing queue

**Daily Dashboard (Product):**
- DAU/MAU ratio
- New user activations
- Feature adoption heatmap
- Churn signals (users going silent)
- Top 10 unrecognized intents (for model improvement)

**Weekly Dashboard (Business):**
- Retention cohort analysis
- Conversion funnel (free → paid)
- NPS / CSAT trends
- Revenue per user trends
- Feature-level engagement breakdown

**Monthly Dashboard (Strategy):**
- MRR / ARR
- LTV:CAC ratio
- NRR
- Market penetration (users vs. estimated TAM)
- Competitive intelligence updates

---

## 7. Common Pitfalls to Avoid

### 7.1 Vanity Metrics Trap
AgentiveAIQ's research (2025) highlights that **only 30% of companies track Goal Completion Rate** — the #1 indicator of chatbot success. Most track total chat volume (vanity metric). For Yaya, the equivalent is tracking "total messages" rather than "tasks completed." A user sending 50 messages because the AI can't understand them is not a success.

### 7.2 The Accuracy vs. Experience Trade-off
A bot that's 99% accurate but takes 10 confirmation steps is worse than one that's 95% accurate with 2 confirmations. Yaya must balance the "no LLM math" safety requirement (technology/03) with conversational flow. The target: **>95% accuracy with ≤2 confirmation steps per task**.

### 7.3 The "Support Metrics" Mistake
Applying customer support metrics (escalation rate, deflection rate, ticket volume) to a business management tool is misleading. Yaya doesn't have "tickets" — it has business tasks. Reframe all metrics in business operations language, not support language.

### 7.4 Ignoring the Offline Comparison
Yaya's competition isn't other software — it's **paper and memory**. Metrics should compare Yaya's performance against the manual alternative:
- How many transactions does a paper notebook miss per day? (Estimate: 15–30%)
- How many appointment no-shows happen without reminders? (Industry: 20–30%)
- How many hours per week does a business owner spend on admin? (Estimate: 8–12 hours)

If Yaya captures 80% of transactions (vs. 70% with paper), reduces no-shows by 50%, and saves 5 hours/week on admin, the ROI is clear and measurable.

---

## 8. Key Takeaways

1. **Standard chatbot metrics are insufficient for Yaya.** Business management requires a novel metrics framework that goes beyond support deflection and CSAT.

2. **The Five Pillars** — Conversational Intelligence, Task Execution, Engagement & Retention, Business Impact, Financial Health — provide a comprehensive measurement system.

3. **Time-to-First-Value (<5 minutes) is the most critical metric at launch.** If users don't experience immediate value, nothing else matters.

4. **Daily active usage is the North Star.** A user who uses Yaya daily is retained; one who uses it weekly is at risk; monthly users are already churning.

5. **Transaction Capture Rate determines the moat.** The more transactions captured, the stronger the lock-in, the better the credit scoring data, and the more valuable the daily summaries.

6. **Instrument analytics from Day 1.** Retrofitting analytics is expensive and you lose critical early-user data. Build the measurement infrastructure before the first user interaction.

7. **Compare against paper and memory, not competing software.** Yaya's real competition is the notebook and the WhatsApp chat scroll. Win that comparison and everything else follows.

---

*This metrics framework should be reviewed and updated quarterly as real user data becomes available. Initial targets are based on industry benchmarks; they should be recalibrated after the first 100 users provide actual performance data.*
