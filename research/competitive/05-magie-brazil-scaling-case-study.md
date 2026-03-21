# Case Study: How Magie (Brazil) Built the WhatsApp-Native Bank — Lessons for LATAM AI Platforms

**Date:** 2026-03-21  
**Author:** Yaya Platform Research  
**Category:** Competitive Intelligence / Case Study  
**Status:** Complete

---

## Executive Summary

Magie is a São Paulo-based fintech that has built what may be the most compelling proof-of-concept for "ambient finance" in Latin America: a fully functional banking experience that lives entirely inside WhatsApp. Founded in 2024 by Luiz Ramalho and João Camargo, the company has grown to **400,000+ users**, processed over **R$2 billion (~US$340M) in transaction volume**, raised **US$10M+ in funding** from Lux Capital and Canary, and is now pivoting from a consumer freemium model to a **B2B white-label infrastructure play**. This case study examines Magie's journey, technology, growth strategy, and the transferable lessons for building a WhatsApp-based AI business platform for LATAM SMBs — specifically in Peru.

---

## 1. Founding Story: The Origins of Magie

### The Founders

**Luiz Ramalho** (CEO) is an economist from PUC-Rio who began his career at Goldman Sachs and The Blackstone Group in investment banking. In 2017, he pivoted into crypto, founding Polvo Technologies, a quantitative crypto fund. Through Polvo, he incubated **Fingerprints DAO**, which became one of the world's largest collections of on-chain generative art NFTs — with a portfolio valued at over $200 million, backed by Andreessen Horowitz and Union Square Ventures, and collaborating with brands like Mercedes-Benz NXT. Before founding Magie, Ramalho served as a Venture Partner at Canary, Brazil's leading early-stage VC firm, where he explored emerging fintech theses.

**João Camargo** (CPO) co-founded the company and leads product development, focusing on the conversational UX that defines Magie's user experience.

### The Problem Statement

Ramalho's dual background — Wall Street finance and tech entrepreneurship — gave him a unique vantage point. He saw "deep-seated inefficiencies and misalignment between clients and institutions" in Brazilian banking. Traditional banks push their own products regardless of customer interest. Even the neobank revolution (Nubank, Inter) still required downloading and navigating dedicated apps.

The insight was deceptively simple: **Brazilians already conduct their financial lives on WhatsApp.** They forward boletos (payment slips), share Pix keys, and discuss money — all inside WhatsApp. Forcing them to leave that context to open a banking app created unnecessary friction. What if the bank just... came to WhatsApp?

### The Name

"Magie" is an homage to **Lizzie Magie**, the original inventor of the board game that became Monopoly. Magie designed the game to illustrate the dangers of wealth concentration. The startup's name signals its mission: democratizing financial services that were traditionally reserved for the ultra-wealthy (private banking, impartial financial advice).

---

## 2. Product Evolution: From R$13M to R$2B+

### Timeline

| Period | Milestone |
|--------|-----------|
| **Late 2023** | Concept development; founders manually handled transactions |
| **Q1 2024** | Pilot launch; R$13M in transactions processed manually |
| **Apr 2024** | Official launch with Canary backing (R$6M pre-seed) |
| **Aug 2024** | Seed round: $4M from Lux Capital (total $5.1M / R$28M); 12,000+ users; R$100M+ transacted |
| **Sep 2024** | 14,000 clients; R$140M transacted; target 80-100K users by year-end |
| **2025** | Business accounts (PJ) launched; standalone app launched as complement; 400,000+ users |
| **Jan 2026** | Second round: $5M from Lux Capital (total $10M+); R$2B+ transacted; B2B pivot announced |

### Core Product Features

1. **Pix via WhatsApp**: Send instant payments by text, voice note, or photo
2. **Boleto payment**: Forward a PDF or photo of a boleto; OCR extracts details and pays it
3. **Voice commands**: "Magie, pay Maria R$50" — voice-to-transaction processing
4. **Bill tracking**: Alerts for upcoming boletos linked to user's CPF (tax ID)
5. **Savings**: 100% CDI daily yield on balances — competitive with top neobanks
6. **Contact memory**: Saves recipient Pix keys; no need to re-enter payment details
7. **Multi-bank integration**: Users can pay from any connected bank, even with zero Magie balance
8. **PIN/biometric security**: Every transaction above a threshold requires 6-digit PIN or biometric auth

### The "Great Abstraction"

Magie's strategic genius is that it is **not a bank** — it is an **interface layer**. The company operates on a Bank-as-a-Service (BaaS) platform via Celcoin, meaning it doesn't hold a banking license (though it's exploring obtaining an IP/ITP license from Banco Central). Its true product is the reduction of cognitive load: a traditional bill payment requires 6-8 app interactions; Magie requires one: "open WhatsApp, send photo."

---

## 3. Core Technology: The AI Engine

### Conversational AI Architecture

Magie's technology stack combines multiple components:

- **Large Language Models (LLMs)**: Multiple LLM models in combination for natural language understanding across text, audio, and image inputs
- **Semantic search**: Used to maintain conversational context and understand ambiguous requests
- **OCR (Optical Character Recognition)**: Extracts payment details from boleto photos, PDFs, and forwarded images
- **Speech-to-text**: Processes voice notes (critical for Brazil, where voice messages are the default communication mode)
- **Intent classification**: Distinguishes between payment requests, balance inquiries, scheduling, and general questions — with guardrails to keep the bot focused on financial tasks
- **Transaction execution layer**: API integration with Pix network, banking partners, and Celcoin BaaS infrastructure

### How Scale Is Handled

The document processing pipeline follows this flow:

```
User Input (text/voice/image) 
  → Input Classification (LLM)
  → Data Extraction (OCR for images, STT for audio, NLU for text)
  → Intent Resolution (payment, query, scheduling)
  → Recipient/Amount Resolution (contact lookup, semantic matching)
  → Transaction Preparation (API calls to Pix/banking partners)
  → Security Gate (PIN/biometric verification)
  → Execution (Celcoin BaaS → Pix network)
  → Confirmation (WhatsApp message to user)
```

The key insight: each "document" processed (a boleto photo, a voice command, a forwarded message) goes through a multi-stage AI pipeline. At R$2B+ in transaction volume and 400K+ users, this system handles significant throughput — though exact document counts aren't publicly disclosed in the "70M documents" framing. What is clear is that the system processes hundreds of thousands of financial interactions monthly across multiple input modalities.

### Early Manual Phase

A remarkable detail: during the first two months (Nov-Dec 2023), **all transactions were handled manually by the founders themselves**. This allowed them to deeply understand user behavior, edge cases, and failure modes before automating. The conversation engine was automated starting January 2024.

---

## 4. Business Model: From Freemium to B2B Infrastructure

### Phase 1: Freemium Consumer (2024-2025)

- Core services are **free** for individual users
- Revenue model deferred in favor of user acquisition and data collection
- "Our goal is to really build something with a lot of retention first" — Ramalho
- User data fuels continuous LLM refinement and accuracy improvement

### Phase 2: Premium Subscription (Planned)

- Premium tier for advanced financial advice, investment recommendations, and decision support
- Leveraging Open Finance APIs to provide impartial, cross-bank comparisons
- Positioning as an "equalizer" — democratized private banking

### Phase 3: B2B White-Label Infrastructure (2026+)

The January 2026 $5M round marked a decisive **B2B pivot**:

- **White-label financial agents**: Companies can deploy Magie's conversational AI technology under their own brand
- **Target verticals**: Finance, retail, telecommunications
- **Value proposition**: "Every organization, through AI, will have agents that mediate the relationship between the company and the consumer" — Ramalho
- **Controlled rollout**: Working with carefully selected enterprise partners; gradual onboarding throughout 2026
- **Revenue model**: B2B SaaS / enterprise contracts (pricing not publicly disclosed, but likely per-transaction or per-agent seat)

This evolution — from consumer tool to enterprise infrastructure — is the most strategically significant move in Magie's history. It transforms the company from a neobank competitor into a **picks-and-shovels provider** for conversational commerce.

---

## 5. Key Metrics

| Metric | Value | Date |
|--------|-------|------|
| Total funding raised | US$10M+ | Jan 2026 |
| Users | 400,000+ | Jan 2026 |
| Transaction volume | R$2B+ (~US$340M) | Jan 2026 |
| Team size | ~28 employees | 2025 |
| Lead investors | Lux Capital, Canary | — |
| Angel investors | Ramp founders | Aug 2024 |
| BaaS partner | Celcoin | — |
| Early milestone | R$1B transacted (first "billion-real" threshold) | Mid-2025 |

### Growth Trajectory

- Apr 2024: R$13M transacted → Aug 2024: R$100M → Sep 2024: R$140M → 2025: R$1B+ → Jan 2026: R$2B+
- User growth: 12K (Aug 2024) → 14K (Sep 2024) → 80-100K target (Dec 2024) → 400K+ (Jan 2026)
- This represents roughly **30x transaction growth** and **30x user growth** in 18 months

---

## 6. Funding History

### Pre-Seed (Early 2024)
- **Amount**: R$6M (~US$1.1M)
- **Investor**: Canary (Brazil's leading early-stage VC)
- **Use**: Initial product development, pilot launch

### Seed Round (August 2024)
- **Amount**: R$22M (~US$4M) from Lux Capital
- **Total raised**: R$28M (~US$5.1M)
- **Lead**: Lux Capital (their first-ever investment in Brazil/LATAM)
- **Participation**: Canary
- **Angel investors**: Founders of Ramp (fintech valued at $8B)
- **Strategic partner**: Amazon Web Services
- **Use**: User acquisition, security infrastructure, Open Finance integration, facial recognition

### Follow-On Round (January 2026)
- **Amount**: US$5M
- **Lead**: Lux Capital (repeat)
- **Total raised**: US$10M+
- **Use**: B2B product development, team expansion, LATAM expansion evaluation

### Investor Significance

Lux Capital manages $5B+ in assets and holds one of the world's premier AI portfolios (Hugging Face, Runway, Together AI). Magie is their **only investment in Latin America** — a powerful signal of conviction in the WhatsApp-native finance thesis.

---

## 7. WhatsApp Integration Strategy

### Why WhatsApp-First Works in Brazil

- **99% smartphone penetration** of WhatsApp in Brazil
- **93% daily active usage**; 24+ hours/month average engagement
- Brazilians call it "Zap" — it's the de facto digital operating system
- **79% of users** have messaged a brand on WhatsApp
- **62% have completed a purchase** within WhatsApp
- Voice messages are the dominant communication mode (critical for Magie's voice-to-payment feature)

### Navigating Meta's WhatsApp Business API

While Magie hasn't publicly detailed its exact API architecture, the company operates through Meta's WhatsApp Business API ecosystem. Key considerations:

1. **Message templates**: For outbound notifications (bill reminders, transaction confirmations)
2. **Session messages**: For interactive conversations (payment flows, balance inquiries)
3. **Rate limits**: Managed through careful queue management and user verification tiers
4. **Media handling**: Image and document processing for boleto/receipt uploads
5. **Webhook reliability**: Critical for real-time transaction confirmation

### Scale Challenges

At 400K+ users sending voice notes, photos, and forwarded messages, the system must handle:
- High-throughput media processing (images, PDFs, audio files)
- Variable message quality (blurry photos, noisy audio, abbreviations)
- Conversation state management across millions of concurrent threads
- WhatsApp's 24-hour session window constraints for business messaging

---

## 8. Go-to-Market Strategy

### First 1,000 Customers

1. **Manual concierge**: Founders personally handled transactions for early users, building trust and understanding behavior patterns
2. **Invite-only access**: Created scarcity and exclusivity; wait-list model
3. **High-income target**: Initially focused on high-income professionals ("people who value their time and have many payments")
4. **Word-of-mouth**: WhatsApp is inherently viral — users share payment experiences within existing chats
5. **Canary network**: Leveraged VC's connections in São Paulo tech/finance ecosystem

### Growth Channels

- **Organic WhatsApp virality**: Every payment involves two parties; recipients discover Magie naturally
- **Wait-list psychology**: Controlled growth maintained service quality and created demand
- **PR/media coverage**: TechCrunch, Brazilian press (Startse, Exame, Mobile Time) amplified the story
- **Security as marketing**: Users promoted Magie as a way to remove banking apps from phones (anti-theft benefit in Brazil)
- **CDI yield**: 100% CDI daily returns attracted savings-conscious users

### Partnerships

- **Celcoin**: BaaS infrastructure provider
- **Open Finance**: Integration with Brazil's open banking framework for multi-bank access
- **Banking institutions**: Target B2B clients for white-label deployment
- **AWS**: Cloud infrastructure partner

---

## 9. Competitive Positioning in Brazil

### vs. Nubank
Nubank rewired consumer behavior (proving people would trust a digital bank), but still requires its own app. Magie builds on top of the behavioral shift Nubank created, while eliminating the app entirely. They're complementary: Magie can connect to Nubank accounts via Open Finance.

### vs. Traditional Banks (Itaú, Bradesco, Banco do Brasil)
Traditional banks have WhatsApp bots, but these are typically rule-based customer service chatbots — not transactional AI agents. Magie's LLM-powered conversational engine is generations ahead in natural language understanding.

### vs. Other WhatsApp Fintechs
- **WhatsApp Pay (Meta)**: Native payment feature within WhatsApp, but limited to simple P2P transfers. Lacks Magie's AI intelligence, bill tracking, and financial assistant capabilities.
- **Pagô**: São Paulo-based payment startup, but smaller scale and less AI-sophisticated.

### Magie's Moat
1. **First-mover in conversational banking**: Established brand and user base
2. **Data flywheel**: 400K+ users training the AI engine continuously
3. **Lux Capital backing**: Only LATAM investment for a $5B fund
4. **B2B pivot**: Moving from competing with neobanks to enabling them

---

## 10. Cultural Factors: Why WhatsApp-First Works

### Brazil-Specific Dynamics

1. **WhatsApp as Operating System**: In Brazil, WhatsApp isn't just messaging — it's how business gets done. Doctors confirm appointments, stores take orders, and families coordinate finances — all on "Zap."

2. **Voice Message Culture**: Brazilians send voice notes far more than typed messages. Magie's voice-to-transaction feature is not a nice-to-have — it's essential for product-market fit.

3. **Phone Theft Anxiety**: Brazil has one of the world's highest smartphone theft rates. Users genuinely feel safer with Magie because they can remove banking apps from their phones. The phone becomes a terminal, not a vault.

4. **Financial Complexity**: The Brazilian boleto system, multiple Pix key formats, and fragmented banking landscape create genuine pain. Magie abstracts this complexity.

5. **Open Finance Regulatory Tailwind**: Brazil's Central Bank has been among the most progressive globally in mandating open banking, creating the API infrastructure that Magie leverages.

6. **Pix as Foundation**: Brazil's instant payment system Pix processed ~42 billion transactions by 2023. It is the financial rail that makes Magie possible — without Pix, the real-time, 24/7, low-cost transaction layer wouldn't exist.

### Applicability to Peru

Peru shares several of these dynamics:
- WhatsApp penetration is 90%+ among smartphone users
- Yape (BCP) and Plin (Interbank) have created Pix-like instant payment behavior
- Voice message culture is strong across LATAM
- Phone theft is a real concern in Lima and other cities
- Open Banking regulation is emerging (SBS regulatory framework)

However, Peru **lacks** Brazil's scale (220M vs 33M population) and regulatory maturity (Pix is years ahead of Yape/Plin interoperability).

---

## 11. Challenges Faced

### Regulatory

- **LGPD Compliance**: Brazil's data privacy law (analogous to GDPR) imposes strict obligations on financial data handling. Magie must encrypt, anonymize, and provide data portability.
- **Banco Central Licensing**: Currently operating via Celcoin BaaS; exploring obtaining an IP (Instituição de Pagamento) or ITP (Iniciador de Transação de Pagamento) license for greater autonomy.
- **Open Finance Integration**: Requires compliance with BCB's open banking technical standards and data-sharing consent frameworks.

### Technical

- **Accuracy at scale**: OCR must correctly read boletos in poor lighting, at angles, and in various formats. Voice recognition must handle Brazilian Portuguese accents, slang, and background noise.
- **Security vs. convenience**: Balancing PIN requirements with the "magic" of frictionless payments. Too many prompts kill the UX; too few create fraud risk.
- **Multi-model orchestration**: Combining multiple LLMs, OCR engines, and STT systems while maintaining response time under a few seconds.
- **WhatsApp API limitations**: Rate limits, media size constraints, 24-hour session windows, and Meta's evolving policies.

### Market

- **Monetization timing**: The company has been free for two years. Converting free users to paying subscribers (or B2B revenue) is the critical next challenge.
- **Trust in AI for finance**: Users need to trust that an AI chatbot won't make a $10,000 mistake. Building that confidence takes time and flawless execution.
- **Competition from incumbents**: As Magie proves the model works, traditional banks and neobanks will build similar WhatsApp integration.

---

## 12. Comparison with Other WhatsApp-Native Fintech Plays in LATAM

| Company | Country | Use Case | WhatsApp Role | Scale | Funding |
|---------|---------|----------|---------------|-------|---------|
| **Magie** | Brazil | Full banking (Pix, boletos, savings) | Primary interface | 400K users, R$2B+ transacted | $10M+ |
| **Félix Pago** | US→Mexico/Central America | Cross-border remittances | Primary interface | 300K+ users, ~$2B transferred since 2022 | $15.5M Series A |
| **Tpaga** | Colombia | Digital banking | Secondary channel | — | — |
| **Truora** | Colombia | Identity/onboarding | Enabler for banks | — | — |
| **WhatsApp Pay** | Brazil | P2P payments | Native feature | 500K+ bill payments/month (Claro alone) | Meta-backed |

### Félix Pago: The Closest Parallel

Félix Pago (San Francisco, 2021) is the most instructive comparison:
- Also WhatsApp-native, but focused on US→LATAM remittances
- Uses **USDC stablecoins** as settlement rail (vs. Magie using Pix)
- Grew 12x year-over-year in 2024; sent $1B in a single year
- Partnered with Nubank Mexico for 5.5M user distribution
- Key insight shared with Magie: immigrants were already using WhatsApp in the remittance flow (photographing Western Union receipts and sending to family)

Both companies validate the same thesis: **don't build an app for a behavior that already lives on WhatsApp.**

---

## 13. Lessons for Yaya Platform: What to Replicate, What to Avoid

### Replicate ✅

1. **Start with the behavior, not the technology**: Magie succeeded because Brazilians were already sharing boletos and Pix keys on WhatsApp. For Peru: map the existing WhatsApp financial behaviors of SMBs (invoice sharing, Yape screenshots, price inquiries) and build the AI layer on top.

2. **Manual-first, then automate**: Magie's founders personally handled transactions for two months. This builds deep user empathy and catches edge cases that automated systems miss. For Yaya: concierge-onboard the first 100 businesses manually.

3. **Freemium for traction, B2B for revenue**: Magie's consumer freemium model built 400K users and trained the AI, but the money is in B2B white-label. For Yaya: consider free SMB tools as the data flywheel, with monetization via enterprise/platform contracts.

4. **Multi-modal input (text + voice + image)**: Voice notes are how LATAM communicates. Image processing is how documents move. Supporting all three input modes is table stakes, not a feature.

5. **Security as a feature, not a constraint**: Magie turned phone theft anxiety into a selling point. For Peru: position WhatsApp-native tools as reducing the attack surface of having multiple banking/finance apps.

6. **Leverage existing payment rails**: Magie didn't build its own payment network — it built the best interface for Pix. For Yaya: integrate deeply with Yape, Plin, and SUNAT (tax authority) APIs rather than reinventing rails.

7. **Controlled growth via invite/wait-list**: Quality over quantity in early stages preserves UX and builds word-of-mouth demand.

### Avoid ⚠️

1. **Don't delay monetization too long**: Magie's two-year free period works with $10M in VC backing. Without similar funding, the Yaya platform needs revenue from day one or very early on. Consider transaction-based fees or tiered subscriptions from launch.

2. **Don't target high-income first**: Magie initially focused on high-income users ("renda alta"), then broadened. For LATAM SMBs, the pyramid is inverted — the largest opportunity is in micro and small businesses that lack any financial tooling. Start wide, not exclusive.

3. **Don't depend solely on WhatsApp**: Magie eventually launched its own app as a complement. Meta's API policies, pricing, and rate limits can change without warning. Build WhatsApp-first but have a fallback channel (web dashboard, Telegram).

4. **Don't underestimate regulatory complexity per country**: Magie operates in one regulatory environment (BCB + LGPD). Expanding across LATAM means navigating SBS (Peru), SFC (Colombia), CNBV (Mexico) — each with different rules. Build regulatory compliance as a modular layer.

5. **Don't try to be a bank unless you have to**: Magie's BaaS approach (using Celcoin) avoids the cost and time of banking licenses. For Peru: partner with licensed entities (Caja Arequipa, Interbank) rather than seeking SBS licensure.

### Key Success Factors Transferable to Peru

1. **WhatsApp penetration**: ✅ Peru has 90%+ smartphone WhatsApp penetration
2. **Instant payment rails**: ⚠️ Yape/Plin exist but lack Pix's universality and open API
3. **Open Banking regulation**: ⚠️ Peru's SBS has frameworks but implementation lags Brazil by 3-4 years
4. **Voice message culture**: ✅ Peruvians send voice notes extensively
5. **Document processing need**: ✅ Peruvian SMBs handle facturas, boletas, and guías de remisión constantly
6. **Phone security concerns**: ✅ Lima has significant phone theft; same anti-theft value proposition applies
7. **Regulatory environment**: ⚠️ SUNAT electronic invoicing is mature; SBS fintech sandbox is available but slow

---

## 14. Strategic Implications for Yaya Platform

Magie validates three critical hypotheses for the Yaya platform:

1. **WhatsApp is a viable primary interface for financial services in LATAM** — not just notifications, but full transactional capabilities including document processing, voice commands, and multi-bank operations.

2. **The B2B white-label model is the sustainable business** — consumer tools are the flywheel, but enterprise infrastructure is the revenue engine. Yaya should build SMB tools as the training ground and data moat, then offer white-label AI agents to larger enterprises.

3. **AI + local payment rails + WhatsApp = product-market fit** — the convergence of these three elements creates a defensible product. Peru's equivalent formula: **AI + Yape/Plin + WhatsApp + SUNAT integration**.

The biggest gap between Magie's Brazil and Yaya's Peru is **payment rail maturity**. Pix is a government-built, universal, open API. Yape and Plin are private, closed, and not interoperable. Advocating for (or building bridges around) payment rail openness is a strategic priority.

---

## Sources

1. **TechCrunch** — "Lux Capital made its first investment in Brazil, a $4M seed for AI fintech Magie" (Aug 22, 2024). https://techcrunch.com/2024/08/22/lux-capital-made-its-first-investment-in-brazil-a-4m-seed-for-ai-fintech-magie/

2. **LATAM Fintech Hub** — "Fintech Brasileña Magie capta US$5M para crear una vertical B2B para pagos vía WhatsApp" (Jan 19, 2026). https://www.latamfintech.co/articles/fintech-brasilena-magie-capta-us-5m-para-crea-una-vertical-b2b-para-pagos-via-whatsapp

3. **Geeks Economy** — "From WhatsApp to R$1 Billion: How Luiz Ramalho's AI Fintech Magie is Redefining Banking in Brazil" (Jun 17, 2025). https://www.geekseconomy.com/finance/from-whatsapp-to-r1-billion-how-luiz-ramalhos-ai-fintech-magie-is-redefining-banking-in-brazil/

4. **Mobile Time** — "Magie: banco no WhatsApp movimenta R$140 milhões" (Sep 20, 2024). https://www.mobiletime.com.br/noticias/20/09/2024/magie-banco-no-whatsapp/

5. **Startups LATAM** — "Startup brasileña Magie recauda US$5 millones con uso de WhatsApp" (Jan 20, 2026). https://startupslatam.com/startup-brasilena-magie-recauda-us-5-millones-con-uso-de-whatsapp/

6. **TI Inside** — "Magie recebe aporte de R$28 milhões" (Aug 22, 2024). https://tiinside.com.br/22/08/2024/magie-recebe-aporte-de-r28-milhoes/

7. **LatamList** — "Magie raises $5.1M seed round led by Lux Capital" (Oct 22, 2024). https://latamlist.com/magie-raises-5-1m-seed-round-led-by-lux-capital/

8. **Canary Portfolio** — Magie company page. https://www.canary.com.br/portfolio/magie/

9. **Emerging Fintech** — "WhatsApp: The Operating System Powering Latin America's Fintech Revolution" (May 6, 2025). https://www.emergingfintech.co/p/whatsapp-the-operating-system-powering

10. **Cliente SA** — "Magie lança plataforma de transações bancárias integrada ao WhatsApp" (Apr 26, 2024). https://portal.clientesa.com.br/magie-lanca-plataforma-de-transacoes-bancarias-integrada-ao-whatsapp/

11. **Canary Cast Podcast** — "Magie: Mudando a relação entre bancos e clientes" (Dec 11, 2024). Apple Podcasts.

12. **FundedIQ** — Magie funding record: $4M Seed, Aug 2024, São Paulo. https://fundediq.co/funded-startups-brazil/

13. **Startup Seeker** — Magie company profile. https://startup-seeker.com/company/magie~com~br

14. **The SaaS News** — "Magie Secures $4 Million in Seed Round" (Aug 26, 2024). https://www.thesaasnews.com/news/magie-secures-4-million-in-seed-round

15. **Forbes Brasil** — "Galeria de arte NFT? Case de curadoria brasileira torna-se global" (Apr 2022). https://forbes.com.br/forbes-tech/2022/04/curadoria-em-arte-nft-criada-por-brasileiros-torna-se-case-global/

16. **Axios Pro Fintech** — "Remittance startup Felix Pago raises $2.8M" (Dec 20, 2023). https://www.axios.com/pro/fintech-deals/newsletters/2023/12/20/fintech-for-latam-transfers

17. **dLocal Press Release** — "dLocal and Félix launch instant, stablecoin-funded WhatsApp remittances across Latin America" (Nov 13, 2025). https://www.dlocal.com/press-releases/dlocal-and-felix-launch-instant-stablecoin-funded-whatsapp-remittances-across-latin-america/

---

*Note: The original task framing referenced "70M+ financial documents processed." Based on comprehensive research, Magie's publicly reported metrics focus on transaction volume (R$2B+) and user count (400K+) rather than document count. The document processing capability is core to the product (OCR on boletos, invoice photos, forwarded messages), but a specific "70M documents" figure was not found in verified sources. This case study uses the confirmed metrics throughout.*
