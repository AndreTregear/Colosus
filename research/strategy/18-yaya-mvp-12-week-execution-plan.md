# Yaya Platform: 12-Week MVP Execution Plan

**Date:** March 21, 2026  
**Category:** Strategy / Execution  
**Research Cycle:** #13  
**Sources:** Synthesized from 62+ research documents, tech stack analysis, Peru market data, WhatsApp API specifications, existing infrastructure audit (TOOLS.md)  

---

## 1. Executive Summary

After 60+ research documents and ~255,000 words of analysis, the research phase is complete. This document translates the entire research library into a concrete 12-week execution plan that takes Yaya from concept to first paying user. 

**The core thesis, validated by research:** A WhatsApp-native, voice-first business management platform for Peruvian micro-enterprises can be built on existing infrastructure (c.yaya.sh + d.yaya.sh), achieve near-zero marginal cost per user ($0.84/month), and distribute through the external accountant (contador) network for 30-50x GTM efficiency.

**What we're building in 12 weeks:**
1. WhatsApp bot that understands voice notes in Peruvian Spanish
2. Transaction recording (sales, expenses, fío/credit)
3. Instant financial queries ("¿cuánto vendí hoy?")
4. WhatsApp Flows for confirmations and structured input
5. Basic contador data export
6. One real salon owner using it daily

---

## 2. Infrastructure Audit: What We Already Have

### Available Infrastructure (from TOOLS.md)

| Resource | Specs | Role in Yaya | Status |
|---|---|---|---|
| **c.yaya.sh** | i9-10900X, 2× RTX A5000 (24GB each), 125GB RAM | AI inference (Whisper STT + Qwen3.5-27B LLM) | ✅ Running |
| **d.yaya.sh** | VPS (185.144.159.199), Debian | Web server, webhook handler, database | ✅ Running |
| **Qwen3.5-27B** | vLLM, 4-bit AWQ, TP=2, 32K context | NLU + conversation + report generation | ✅ Deployed at ai.yaya.sh |
| **Cloudflare Tunnels** | a/b/c/d.yaya.sh | SSL, DNS, reverse proxy | ✅ Configured |

### What Needs to Be Added

| Component | Where | Effort | Cost |
|---|---|---|---|
| **Whisper large-v3** | c.yaya.sh (Docker) | 1-2 days setup | $0 (self-hosted) |
| **FastAPI webhook server** | d.yaya.sh | Build in Week 1-2 | $0 |
| **PostgreSQL** | d.yaya.sh | Install + schema, 1 day | $0 |
| **Redis** | d.yaya.sh | Install, <1 hour | $0 |
| **Celery workers** | d.yaya.sh | Configure with Redis backend | $0 |
| **WhatsApp Business Account** | Meta Business Manager | 3-7 days verification | $0 (Cloud API) |
| **FFmpeg** | c.yaya.sh | apt install, 5 minutes | $0 |
| **Cloudflare Tunnel for webhook** | New subdomain (e.g., wa.yaya.sh) | 30 minutes | $0 |

**Total additional monthly cost: ~$0.** Everything runs on infrastructure Andre already owns and operates.

---

## 3. The 12-Week Plan

### Week 1-2: Foundation

**Goal:** WhatsApp webhook receiving messages, basic text echo, Whisper deployed.

**Tasks:**
1. **Meta Business Account Setup** (Day 1-3)
   - Create/verify Meta Business Account
   - Register a dedicated phone number for Yaya
   - Enable WhatsApp Cloud API
   - Configure webhook URL (d.yaya.sh via Cloudflare Tunnel)
   - Obtain permanent access token

2. **Webhook Server** (Day 2-5)
   - FastAPI application on d.yaya.sh
   - Webhook verification endpoint (GET)
   - Message receiving endpoint (POST)
   - Immediate 200 response + async processing
   - Basic text echo (send back what was received)
   - Logging all incoming message types

3. **Whisper Deployment** (Day 3-7)
   - Deploy Whisper large-v3 on c.yaya.sh (Docker)
   - Configure for Spanish language priority
   - Test with sample Peruvian Spanish audio files
   - Benchmark latency (target: <800ms for 10s audio)
   - Create FFmpeg pipeline for OGG Opus → WAV conversion

4. **Infrastructure** (Day 5-7)
   - Install PostgreSQL on d.yaya.sh
   - Install Redis on d.yaya.sh
   - Configure Celery with Redis backend
   - Create database schema (users, transactions, clients)
   - Set up basic monitoring (uptime, error rates)

**Week 1-2 Deliverable:** Send a voice note to Yaya's WhatsApp number → receive the transcribed text back. Basic but functional end-to-end pipeline.

**Definition of Done:**
- [ ] WhatsApp webhook receives and processes messages
- [ ] Voice notes are downloaded, converted, and transcribed
- [ ] Transcribed text is sent back to user
- [ ] Text messages receive echo response
- [ ] All components logged and monitored
- [ ] Latency under 3 seconds for voice-to-response

---

### Week 3-4: Intelligence

**Goal:** NLU intent classification, entity extraction, transaction recording.

**Tasks:**
1. **NLU Pipeline** (Day 8-14)
   - Create prompt engineering for Qwen3.5-27B intent classification
   - Define intent categories: record_sale, record_expense, record_fio, query_balance, query_report, schedule, general, help
   - Entity extraction: amount, client_name, item/service, payment_method, date
   - Test with 100+ example Peruvian Spanish business phrases
   - Handle edge cases: partial information, ambiguous amounts, slang

2. **Transaction Recording** (Day 10-18)
   - Database models for transactions (type, amount, client, items, timestamp, payment_method)
   - Insert confirmed transactions into PostgreSQL
   - Deduplication logic (prevent double-recording)
   - Transaction modification (user says "eso no, fueron 50 no 45")

3. **Query Engine** (Day 14-21)
   - "¿Cuánto vendí hoy?" → SUM(sales) WHERE date = today
   - "¿Cuánto me debe Carmen?" → SUM(fio) WHERE client = Carmen AND status = pending
   - "¿Cuánto gasté esta semana?" → SUM(expenses) WHERE date >= week_start
   - Natural language query → SQL translation via LLM
   - Format responses naturally: "Hoy vendiste S/345 en 12 transacciones 📊"

4. **Conversation Context** (Day 15-21)
   - Redis-based conversation history (last 20 messages, 24h TTL)
   - Multi-turn support: "Vendí 50" → "¿A quién?" → "A María" → complete transaction
   - Context carryover: "Y también 30 más" → understand referent

**Week 3-4 Deliverable:** Voice note "Vendí un corte por 45 soles a María" → Yaya understands intent (sale), extracts entities (S/45, corte, María), asks for confirmation, records transaction. "¿Cuánto vendí hoy?" returns accurate answer.

**Definition of Done:**
- [ ] Intent classification accuracy >90% on test set
- [ ] Entity extraction captures amount, client, service correctly
- [ ] Transactions stored in PostgreSQL
- [ ] Basic queries return accurate results
- [ ] Multi-turn conversations maintain context
- [ ] Peruvian Spanish slang handled (luca, mango, etc.)

---

### Week 5-6: WhatsApp Flows

**Goal:** Structured interaction via Flows for confirmations, summaries, and onboarding.

**Tasks:**
1. **Core Flows Design + Build** (Day 22-30)
   - **Sale Confirmation Flow:** Post-voice-note confirmation with service, amount, client, payment method dropdown
   - **Daily Summary Flow:** End-of-day summary with sales total, expenses, transaction count
   - **Fío Tracking Flow:** Credit registration with client dropdown, amount, items
   - Build JSON definitions for each Flow
   - Submit for Meta template approval

2. **Onboarding Flow** (Day 25-32)
   - Welcome screen
   - Business type selection (salon, bodega, restaurant, tienda, other)
   - Name capture
   - First transaction tutorial
   - Designed for zero-literacy: minimal text, maximum buttons

3. **Flow Integration** (Day 28-35)
   - Voice note → NLU → Auto-trigger appropriate confirmation Flow
   - Flow response webhook handling
   - Flow data → transaction recording pipeline
   - Fallback to text-only if Flow rendering fails

4. **Interactive Menu** (Day 30-35)
   - Persistent "Menú" trigger
   - List message with options: Registrar venta, Ver resumen, Clientes con fío, Ayuda
   - Route each option to appropriate Flow or response

**Week 5-6 Deliverable:** Full voice-to-Flow-to-database pipeline. User speaks → Yaya shows Flow confirmation → user taps confirm → data recorded. Onboarding takes <3 minutes.

**Definition of Done:**
- [ ] 3+ WhatsApp Flows approved and functional
- [ ] Onboarding Flow completes in <3 minutes
- [ ] Voice → Flow → Database pipeline end-to-end
- [ ] Interactive menu working with list messages
- [ ] Flows render correctly on Android (primary target)

---

### Week 7-8: Features and Polish

**Goal:** Client directory, fío tracking, expense categorization, daily summaries.

**Tasks:**
1. **Client Directory** (Day 36-42)
   - Auto-create client entries from transactions
   - Track purchase history per client
   - Fío (credit) ledger per client
   - "¿Quiénes me deben?" → list of clients with outstanding credit

2. **Fío System** (Day 38-45)
   - Register credit ("Le fié 30 a Carmen")
   - Track outstanding amounts per client
   - Record payments ("Carmen pagó 15 de lo que debía")
   - Automated reminders (configurable: after 7/14/30 days)
   - Summary: total outstanding fío, aging breakdown

3. **Expense Categorization** (Day 40-46)
   - Auto-categorize expenses: supplies, utilities, rent, transport, other
   - Learn from corrections ("No, eso es para insumos")
   - Monthly expense breakdown by category

4. **Automated Daily Summary** (Day 42-49)
   - Utility template message sent at configurable time (default: 9 PM)
   - Today's sales total, expense total, net
   - Outstanding fío reminder
   - Tomorrow's appointments (if scheduling implemented)
   - Only sent if user had activity that day (saves template costs)

5. **Error Handling and Edge Cases** (Day 43-49)
   - Graceful handling of unrecognized audio (noise, music)
   - Timeout handling for slow STT
   - Multi-language detection (some users may switch to Quechua phrases)
   - Profanity/non-business message handling
   - Rate limiting to prevent abuse

**Week 7-8 Deliverable:** Complete feature set for salon/bodega MVP. Client management, fío tracking, expense categorization, daily automated summaries.

**Definition of Done:**
- [ ] Client directory auto-populated from transactions
- [ ] Fío tracking with register/payment/reminder cycle
- [ ] Expenses auto-categorized with correction learning
- [ ] Daily summary sent as utility template at 9 PM
- [ ] Error handling covers all edge cases gracefully

---

### Week 9-10: Customer Zero

**Goal:** Real-world testing with one salon owner in Lima.

**Tasks:**
1. **Customer Zero Recruitment** (Day 50-53)
   - Identify candidate through Andre's network or contador connection
   - Ideal: Lima salon owner, active WhatsApp user, 10+ daily transactions
   - In-person onboarding (or via video call)
   - Set expectations: "You're testing something new, we want your feedback"

2. **Onboarding and Training** (Day 53-56)
   - Guide through onboarding Flow
   - Demonstrate voice recording workflow
   - Show daily summary and query capabilities
   - Introduce fío tracking
   - Provide "cheat sheet" card: key voice commands

3. **Daily Monitoring** (Day 56-63)
   - Monitor all interactions for errors/confusion
   - Daily check-in with Customer Zero (brief WhatsApp message)
   - Track metrics: messages/day, voice vs. text ratio, Flow completion rate, error rate
   - Fix bugs same-day

4. **Accuracy Measurement** (Day 58-63)
   - Compare Yaya's recorded transactions to Customer Zero's notebook (if kept)
   - Measure STT accuracy on real salon audio (hair dryers, music, chatter)
   - Identify Peruvian Spanish vocabulary gaps
   - Adjust NLU prompts based on real usage patterns

5. **Iterate** (Day 60-70)
   - Prioritize fixes based on Customer Zero feedback
   - Rapid iteration cycles (push updates daily)
   - Focus on the interactions that happen most (likely: record_sale, query_balance)

**Week 9-10 Deliverable:** One real person using Yaya daily for 2+ weeks. Measured accuracy, real usage patterns, genuine feedback.

**Definition of Done:**
- [ ] Customer Zero recording 5+ transactions daily via voice
- [ ] STT accuracy >90% in real salon environment
- [ ] Daily summary received and found useful
- [ ] Customer Zero would recommend to a friend (qualitative)
- [ ] Bug backlog under 5 critical issues

---

### Week 11-12: Contador Integration + Growth Prep

**Goal:** Basic contador dashboard, data export, prepare for 10-user expansion.

**Tasks:**
1. **Contador Dashboard** (Day 64-74)
   - Simple web dashboard (Next.js or plain HTML — keep it minimal)
   - Login for contador (email + password)
   - View client list and monthly summaries
   - Transaction detail view with date filtering
   - Export to CSV (formatted for common accounting software import)
   - SIRE-compatible data format for purchase/sales registers

2. **Contador Data Flow** (Day 68-77)
   - Client (salon owner) grants access to their contador via WhatsApp confirmation Flow
   - Contador sees aggregated data (not individual voice notes)
   - Monthly report auto-generated and exportable
   - Notification to contador when monthly data is ready

3. **Multi-User Support** (Day 70-77)
   - Ensure clean data isolation between users
   - Test concurrent usage (5+ users simultaneously)
   - Onboarding Flow refinement based on Customer Zero learnings
   - Prepare for 10-user beta (5 salon owners via Customer Zero + contador referral)

4. **Documentation and Monitoring** (Day 75-84)
   - System architecture documentation
   - Runbook for common issues
   - Alerting for system downtime, error spikes
   - Cost tracking dashboard (WhatsApp API usage, compute costs)
   - Analytics: DAU, messages per user, voice vs. text ratio, Flow completion rates

**Week 11-12 Deliverable:** Contador dashboard functional, 10-user beta ready, monitoring in place.

**Definition of Done:**
- [ ] Contador can log in and view client financial summaries
- [ ] CSV export works with proper SUNAT-compatible formatting
- [ ] 10 user accounts provisioned and tested
- [ ] System handles concurrent usage without errors
- [ ] Monitoring and alerting operational

---

## 4. Success Metrics

### MVP Success Criteria (End of Week 12)

| Metric | Target | Measurement |
|---|---|---|
| Customer Zero daily usage | 5+ transactions/day via voice | Database transaction count |
| STT accuracy (real environment) | >90% on financial utterances | Manual review of 100 samples |
| Transaction recording accuracy | >95% after confirmation | User-verified records |
| System uptime | >99% during business hours (8AM-9PM) | Monitoring alerts |
| Voice-to-response latency | <3 seconds average | Webhook timing logs |
| Onboarding completion rate | >80% of new users | Flow analytics |
| Customer Zero NPS | >8 (would recommend) | Direct feedback |
| Contador time savings | >30% vs. current process | Contador interview |

### North Star Metrics (Post-MVP)

| Metric | 3-Month Target | 12-Month Target |
|---|---|---|
| Active users (weekly) | 50 | 500 |
| Transactions recorded/month | 5,000 | 100,000 |
| Contador partners | 5 | 50 |
| Monthly revenue | S/0 (free beta) | S/5,000+ |
| User retention (30-day) | >60% | >70% |

---

## 5. Risk Mitigation

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Whisper struggles with salon noise | Medium | High | Fine-tune on noisy audio; add confirmation loop |
| Meta rejects Flow templates | Low | Medium | Submit early; have text-only fallback |
| c.yaya.sh downtime | Low | High | Fallback to cloud STT (Whisper API); monitoring |
| WhatsApp Business Account verification delays | Medium | High | Start Day 1; have backup number |

### Business Risks

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Customer Zero drops out | Medium | High | Recruit 2-3 candidates; offer incentives |
| Users don't trust AI with finances | Medium | High | Confirmation loops; contador endorsement |
| Contador sees Yaya as threat | Low | Medium | Position as tool for contador, not replacement |
| Meta policy changes | Low | High | Diversify: plan Telegram backup |

---

## 6. What We're NOT Building in MVP

Explicitly out of scope for the 12-week plan:

- ❌ SUNAT e-invoicing integration (research done, but implementation is Phase 2)
- ❌ Payment processing (IziPay/Yape integration is Phase 2)
- ❌ Inventory management
- ❌ Multi-language support (Spanish only in MVP)
- ❌ Mobile app (WhatsApp IS the app)
- ❌ Advanced analytics / ML predictions
- ❌ Appointment scheduling with customer notifications
- ❌ Marketing features (WhatsApp broadcasts to customers)

Each of these is documented in the research library and ready for Phase 2 implementation.

---

## 7. Phase 2 Roadmap (Post-MVP, Month 4-12)

| Phase | Timeline | Key Features | Revenue |
|---|---|---|---|
| **2A: Growth** | Month 4-6 | 50 users, 5 contadores, appointment scheduling, expense photos (OCR) | Free beta → S/15/month pilots |
| **2B: Compliance** | Month 6-8 | SUNAT e-invoicing (Nubefact API), SIRE data export, boletas | S/15-30/month tiers |
| **2C: Payments** | Month 8-10 | IziPay integration, Yape Code, payment links in WhatsApp | Transaction fees + subscription |
| **2D: Embedded Finance** | Month 10-12 | Credit scoring (from fío data), working capital referral partnerships | Revenue share on financial products |

---

## 8. Weekly Cadence

**Every Monday:** Review metrics, prioritize week's tasks
**Every Friday:** Demo to Andre (even if internal), document learnings
**Daily:** Push code, test, fix. Ship something every day.

**Communication:** All progress documented in `/yaya_platform/dev/` directory. Git commits with descriptive messages. Weekly summary in memory files.

---

## 9. The 10 Commandments of Yaya MVP

1. **Voice first, always.** If a user can't do it by speaking, it's not done right.
2. **Confirm before recording.** Never commit financial data without user confirmation.
3. **5 seconds or less.** Voice note to response must feel instant.
4. **WhatsApp IS the app.** Never send users to a website, download, or external link.
5. **One user, deeply.** Customer Zero's feedback > 1,000 survey responses.
6. **The contador is your co-founder.** Their endorsement is worth 50 Facebook ads.
7. **Wrong is worse than missing.** A wrong transaction destroys trust. Missing a feature doesn't.
8. **Ship daily, iterate hourly.** Perfect is the enemy of launched.
9. **Cost must stay near zero.** If it costs money, it better make more money.
10. **The research is done. Build.**

---

## 10. Thesis Statement

### Thesis 25: Yaya's MVP Can Be Built in 12 Weeks on Existing Infrastructure at Near-Zero Additional Cost, Achieving First Paying Potential by Week 12

**Evidence: ★★★★★**
- All critical infrastructure already deployed: c.yaya.sh (GPUs + LLM), d.yaya.sh (VPS), Cloudflare tunnels
- WhatsApp Cloud API is free for service conversations (post-July 2025 pricing)
- Whisper large-v3 + Qwen3.5-27B provide zero-cost STT + NLU on existing hardware
- WhatsApp Flows proven in LATAM markets with 2-8x conversion improvement
- Contador channel documented with clear GTM sequence
- 12-week timeline aligns with AI MVP best practices ($10K-35K at commercial rates; ~$0 with self-hosted infrastructure)
- Sources: Full research library (60+ documents), infrastructure audit, WhatsApp API documentation

---

*This is the final research-to-execution bridge. The research library has answered every strategic, market, competitive, technical, and regulatory question. The remaining question is execution speed. The 12-week plan is designed to be aggressive but achievable for a solo founder with AI-native development tools. The first voice note recorded by a real salon owner will teach more than the next 10 research documents.*
