# LLM Inference Cost Optimization for WhatsApp-Native AI SaaS Platforms Serving Micro-Enterprises at Scale

**Research Document — March 2026**
**Context:** Yaya Platform — WhatsApp-native AI business management for Peruvian micro-enterprises (S/29–79/month)

---

## Executive Summary

Building a WhatsApp-native AI business management platform for micro-enterprises at S/29–79/month (~$8–21 USD) demands ruthless inference cost optimization. At these price points, LLM inference costs can easily consume 40–60% of revenue if not carefully managed [1]. This document analyzes the full landscape of cost optimization strategies—from model selection and caching to architecture patterns and voice pipeline economics—providing a concrete roadmap for achieving sustainable unit economics at every growth stage.

The core thesis: **a well-designed cascade architecture combining small open-source models for 85–90% of requests, semantic caching for repeated queries, and frontier APIs only for complex reasoning can achieve per-user inference costs of $0.30–1.50/month**, well within the margin envelope for a S/29–79 subscription.

---

## 1. Current LLM Inference Cost Landscape (Early 2026)

The LLM pricing market has undergone dramatic compression. GPT-4-level performance that cost $30/million input tokens in 2023 now costs $0.15–2.50/million tokens depending on provider [1][2]. The key pricing data points as of Q1 2026:

### Frontier Models (Commercial APIs)

| Model | Input ($/1M tokens) | Output ($/1M tokens) | Best Use Case |
|-------|---------------------|----------------------|---------------|
| GPT-4o | $2.50 | $10.00 | General-purpose, vision |
| GPT-4o Mini | $0.15 | $0.60 | High-volume lightweight tasks |
| Claude Sonnet 4 | $3.00 | $15.00 | Complex reasoning, coding |
| Claude Haiku 3.5 | $0.25 | $1.25 | Classification, extraction |
| Gemini 3 Flash | $0.075 | $0.30 | Cost-sensitive, high-speed |
| DeepSeek V3.2 | $0.27 | $1.10 | Best value general tasks |

*Sources: [2][3][4]*

### Open-Source Models (Hosted via Together.ai, Groq, etc.)

| Model | Input ($/1M tokens) | Output ($/1M tokens) | Notes |
|-------|---------------------|----------------------|-------|
| Llama 3.3 70B | $0.18 | $0.40 | Strong general performance |
| Llama 4 Maverick | ~$0.40 | ~$0.40 | 400B MoE, 17B active |
| Qwen 3 4B | ~$0.02 | ~$0.06 | Ultra-cheap small model |
| Mistral Small 3 | $0.10 | $0.30 | Fast inference, edge-ready |
| DeepSeek R1 | $0.55 | $2.19 | Reasoning, chain-of-thought |

*Sources: [2][3][5]*

### Critical Pricing Insight

Output tokens cost 3–8× more than input tokens across virtually all providers [1][2]. For a conversational business management platform where responses average 100–300 tokens and inputs average 50–150 tokens, **output cost dominates the equation**. This makes output-efficient prompt design and small-model routing especially impactful.

**For Yaya's context:** A typical business query (e.g., "¿Cuánto vendí hoy?") might use ~800 input tokens (system prompt + context + user message) and ~200 output tokens. At GPT-4o Mini pricing: $(800 × $0.15 + 200 × $0.60)/1M = $0.00024/query. At 50 queries/user/day: ~$0.36/user/month. Manageable, but this assumes no caching and optimal routing.

---

## 2. Self-Hosted vs API-Based Inference Trade-Offs

### When APIs Win (Yaya's Current Stage)

For startups processing under 50 million tokens per day, **API-based inference is almost always cheaper** after accounting for total cost of ownership [6][7]. The math is unambiguous:

| Monthly Volume | API Cost (GPT-4o Mini) | Self-Host Cost (A100) | Winner |
|----------------|------------------------|-----------------------|--------|
| 1M tokens | $0.45 | $1,440 | API (3,200× cheaper) |
| 10M tokens | $4.50 | $1,440 | API (320× cheaper) |
| 100M tokens | $45 | $1,440 | API (32× cheaper) |
| 500M tokens | $225 | $1,440 | API (6× cheaper) |
| 1B tokens | $450 | $1,440 | API (3× cheaper) |
| 3.9B tokens | $1,755 | $1,440 | Self-host (1.2× cheaper) |

*Source: [6]*

**True self-hosting cost is 3–5× the raw GPU price** when including DevOps engineering ($145K/year), model updates, networking, storage, and downtime management [7][8]. A realistic monthly cost for a single A100 deployment:

| Component | Monthly Cost |
|-----------|-------------|
| GPU rental (A100 80GB) | $1,440 |
| DevOps time (15 hrs × $100/hr) | $1,500 |
| Infrastructure overhead | $300 |
| **True monthly cost** | **$3,240** |

*Source: [6]*

### When Self-Hosting Makes Sense

Self-hosting becomes viable when:
1. **Volume exceeds 100M+ tokens/day** consistently [7]
2. **Custom fine-tuned models** outperform general APIs for your domain [6]
3. **Data sovereignty** requirements prohibit third-party APIs
4. **Existing GPU infrastructure** (like Yaya's c.yaya.sh with 2× RTX A5000) can be utilized at near-zero marginal cost

### Yaya's Hybrid Advantage

Yaya already operates a self-hosted Qwen 3.5-27B (AWQ 4-bit) on dual RTX A5000s at c.yaya.sh. This infrastructure, already paid for, can serve as the backbone for high-volume simple queries at near-zero marginal cost, while routing complex reasoning to commercial APIs. This is the optimal hybrid approach for the current stage.

---

## 3. Model Distillation and Fine-Tuning for Domain-Specific Tasks

### The Distillation Pipeline for Peruvian Business Spanish

Knowledge distillation—training a smaller "student" model to mimic a larger "teacher" model—is the most promising path to domain-specific cost optimization [9][10]. The approach for Yaya:

**Step 1: Generate Training Data**
Use Claude Sonnet or GPT-4o to process thousands of representative business queries in Peruvian Spanish:
- Sales tracking: "¿Cuánto vendí de arroz esta semana?"
- Inventory: "¿Cuántas cajas de cerveza me quedan?"
- Invoicing: "Genera una boleta para 3 pollos a S/25 cada uno"
- Financial insights: "¿Cuál es mi ganancia del mes?"

**Step 2: Fine-Tune a Small Model**
Using QLoRA (Quantized Low-Rank Adaptation), fine-tune a Qwen 3 4B or Mistral Small 3.2 on the teacher-generated dataset. QLoRA enables fine-tuning of models up to 65B parameters on a single 48GB GPU while preserving 16-bit fine-tuning performance [10].

**Step 3: Validate and Deploy**
The distilled model handles 85–90% of routine queries. Research shows distilled models retain ~97% of teacher performance on domain-specific tasks while being 40% smaller and 60% faster [10][11].

### Key Considerations for Peruvian Spanish

- **Peruvian business vocabulary**: Terms like "boleta," "factura," "RUC," "SUNAT," "bodega," "chacra" must be well-represented in training data
- **Mixed formality**: Micro-enterprise owners use informal Spanish with regional expressions
- **Numerical reasoning**: Accurate arithmetic for prices in Soles, tax calculations (IGV 18%), inventory counts
- **Qwen models show strong multilingual support** across 119 languages including Spanish [12], making them excellent base models for fine-tuning

### Cost of Fine-Tuning

Using QLoRA on the existing RTX A5000 infrastructure (c.yaya.sh), fine-tuning a 4B–7B model costs essentially nothing beyond engineering time. The GPT-4o teacher data generation for ~50,000 examples: ~$50–100 in API costs.

---

## 4. Prompt Optimization Techniques

Prompt optimization delivers 1.5–3× cost savings with zero infrastructure changes [1].

### Technique 1: System Prompt Compression
Replace verbose system prompts with concise, structured instructions. A typical business assistant prompt can be reduced from 2,000 tokens to 400 tokens:

```
# Before (2,000 tokens)
"You are a helpful business assistant for small businesses in Peru..."
[Long description of capabilities, personality, edge cases]

# After (400 tokens)  
"Asistente de gestión para microempresas peruanas. Responde en español.
Capacidades: ventas, inventario, facturación, reportes financieros.
Formato: conciso, números exactos, moneda en Soles (S/).
Contexto del negocio: {business_context}"
```

**Savings:** 1,600 tokens × 50 queries/day × 30 days = 2.4M tokens/user/month saved on input alone.

### Technique 2: Structured Output Constraints
Request JSON or structured responses instead of natural language for data operations:

```
Output format: {"sales_total": number, "items_sold": number, "summary": "string<50chars"}
```

This reduces output tokens by 50–70% for data queries compared to free-form responses.

### Technique 3: Context Window Management
Instead of sending full conversation history, maintain a rolling summary:
- Keep last 3 messages verbatim
- Summarize older context into a compressed state object
- Pre-compute and cache business context (inventory state, daily sales totals)

### Technique 4: Tiered Prompt Complexity
Simple queries (greetings, confirmations) use minimal prompts (~200 tokens). Complex queries (financial analysis, multi-step operations) get full context (~800 tokens).

---

## 5. Caching Strategies

Caching is among the highest-impact optimizations for WhatsApp business platforms, where query patterns are highly repetitive [13][14].

### Semantic Caching

Business queries exhibit strong semantic similarity. "¿Cuánto vendí hoy?" and "¿Cuáles son mis ventas del día?" are semantically identical. Semantic caching uses embedding similarity to return cached responses:

**Implementation Architecture:**
```
User Query → Embedding (text-embedding-3-small: $0.00002/query)
  → Vector Search (FAISS/Redis) → Cosine Similarity > 0.95?
    → YES: Return cached response (cost: $0)
    → NO: Call LLM, cache result
```

**Expected Results for Business Queries:**
- Cache hit rate: 40–60% (business queries are highly repetitive) [15]
- Cost savings: 40–60% of LLM API costs eliminated
- Latency: 50ms (cached) vs 1,200ms (LLM call) — 24× faster [15]

GPTCache achieves 61.6–68.8% cache hit rates with 97%+ positive hit accuracy in production [13]. For Yaya's use case, common queries like daily sales totals, inventory checks, and pricing lookups are prime caching candidates.

### Provider-Level Prompt Caching

Anthropic offers 90% cost reduction on cached prompt prefixes ($0.30/M vs $3.00/M), with break-even at just 1.4 reads per cached prefix [13]. OpenAI offers automatic 50% caching with no code changes for prompts over 1,024 tokens [13].

**For Yaya:** The system prompt + business context prefix is identical across all queries for a given user. Caching this prefix saves 400–800 tokens per query at 50–90% discount.

### Response Caching for Business Data

Cache deterministic responses with TTL:
- Daily sales total: Cache for 5 minutes (updates on new sale)
- Inventory count: Cache for 1 minute
- Monthly report: Cache for 1 hour
- Price list: Cache for 24 hours

**Estimated combined caching savings: 50–70% of total inference cost.**

---

## 6. Router/Cascade Architecture

Smart routing is the single most impactful cost optimization strategy, with potential savings of 86–98.5% compared to routing everything through a frontier model [2].

### Proposed Three-Tier Architecture for Yaya

```
User Message (WhatsApp)
    │
    ▼
[Intent Classifier] ← Self-hosted Qwen 3.5-27B or fine-tuned 4B model
    │
    ├── SIMPLE (70% of traffic) → Self-hosted Qwen / Cached Response
    │   Examples: "Hola", "¿Cuánto vendí?", "Agrega 5 pollos al inventario"
    │   Cost: ~$0/query (self-hosted) or $0.0001/query (GPT-4o Mini)
    │
    ├── MODERATE (25% of traffic) → GPT-4o Mini / DeepSeek V3
    │   Examples: "Genera factura para cliente X", "¿Qué producto me da más ganancia?"
    │   Cost: ~$0.0003/query
    │
    └── COMPLEX (5% of traffic) → Claude Sonnet 4 / GPT-4o
        Examples: "Analiza mis finanzas del trimestre", "¿Debería subir precios?"
        Cost: ~$0.003/query
```

### Cost Comparison

| Approach | Cost per 1,500 queries/month (per user) |
|----------|----------------------------------------|
| All Claude Sonnet 4 | $4.50 |
| All GPT-4o Mini | $0.36 |
| **Cascade (70/25/5)** | **$0.12** |

The cascade architecture reduces per-user inference cost from $4.50 to $0.12—a **97% reduction**—while maintaining quality where it matters [2].

### Intent Classification

The router itself can be extremely lightweight:
- Rule-based classification for obvious patterns (greetings, simple CRUD)
- A fine-tuned classifier (< 1B parameters) for ambiguous queries
- Self-hosted on existing infrastructure at zero marginal cost

---

## 7. Batch Processing vs Real-Time Inference

WhatsApp's asynchronous nature provides a natural opportunity for batch optimization.

### Real-Time (Immediate Response Required)
- Direct user queries expecting immediate answers
- Sale recording confirmations
- Inventory updates
- Target latency: < 3 seconds

### Batch-Eligible (Can Be Delayed)
- Daily/weekly/monthly financial reports
- Inventory reorder suggestions
- Business insights and recommendations
- End-of-day summaries

**Batch API savings:** OpenAI's batch endpoint offers 50% cost reduction over real-time pricing [1]. Processing nightly reports for 10,000 users in batch vs real-time:

| Processing Mode | Cost for 10K users' nightly reports |
|----------------|-------------------------------------|
| Real-time (GPT-4o Mini) | $15/night |
| Batch (GPT-4o Mini, 50% off) | $7.50/night |
| Self-hosted batch (Qwen 3.5-27B) | ~$0/night (fixed infra cost) |

### Pre-Computation Strategy

Pre-compute common analytics during off-peak hours:
- Calculate daily totals, running averages, top products at midnight
- Store results in database, serve instantly when queried
- Only invoke LLM for natural language formatting of pre-computed data

---

## 8. Voice-to-Text Pipeline Cost Optimization

Voice messages are critical for Peruvian micro-enterprises—many business owners prefer voice over text. The STT pipeline must be cost-optimized.

### Commercial STT Pricing (2026)

| Provider | Streaming ($/min) | Batch ($/min) | Languages | Latency |
|----------|-------------------|---------------|-----------|---------|
| Deepgram Nova-3 | $0.0077 | $0.0043 | 31+ | ~300ms |
| AssemblyAI | $0.0025 | $0.0045 | 99+ | ~300ms |
| OpenAI Whisper API | — | $0.006 | 100+ | batch only |
| Google STT v2 | $0.016 | $0.003 | 125+ | ~350ms |
| AWS Transcribe | $0.024 | $0.024 | 100+ | 600-800ms |

*Sources: [16][17]*

### Self-Hosted Whisper Strategy

For maximum cost optimization at scale, self-hosting Whisper models on existing GPU infrastructure:

| Model | Parameters | WER | Speed (RTFx) | VRAM | Best For |
|-------|-----------|-----|-------------|------|----------|
| Whisper Large V3 | 1.55B | 7.4% | ~50× | ~10GB | Multilingual accuracy |
| Whisper Large V3 Turbo | 809M | 7.75% | 216× | ~6GB | Speed + multilingual |
| Distil-Whisper | 756M | ~7.5% | 300+× | ~5GB | English fast |
| Faster-Whisper (CTranslate2) | — | same | 4× base | less | Optimized inference |

*Source: [18]*

### Recommended Voice Pipeline for Yaya

```
WhatsApp Voice Message
    │
    ▼
[Faster-Whisper Large V3 Turbo] ← Self-hosted on c.yaya.sh RTX A5000
    │ (Cost: ~$0/message, uses existing GPU)
    │ (Speed: 216× real-time = 1 min audio processed in 0.28 seconds)
    ▼
Transcribed Text → Standard LLM Pipeline
```

**Cost analysis at scale:**
- 10,000 users × 5 voice messages/day × 15 seconds avg = 12,500 minutes/day
- **Self-hosted Whisper:** $0/day (fixed GPU cost already accounted for)
- **Deepgram API:** $53.75/day ($1,612/month)
- **AssemblyAI:** $31.25/day ($937/month)

Self-hosting Whisper on existing infrastructure saves $940–1,600/month at 10K users.

### Spanish Language Considerations

Whisper Large V3 performs well on Spanish, including Latin American accents. For Peruvian-specific vocabulary (business terms, place names), keyword boosting or a small fine-tuned adapter can improve accuracy. The Turbo variant maintains 99+ language support with only 1–2% accuracy reduction vs the full model [18].

---

## 9. Infrastructure Cost Modeling: Cost Per User Per Month

### Assumptions
- 50 text queries/user/day, 5 voice messages/user/day
- Average query: 800 input tokens, 200 output tokens
- Cascade routing: 70% simple, 25% moderate, 5% complex
- 50% semantic cache hit rate on text queries
- Voice processing self-hosted

### Cost Model by Scale

| Users | Text LLM Cost | Voice STT Cost | Caching Infra | Total Infra | **Cost/User/Month** |
|-------|---------------|----------------|---------------|-------------|---------------------|
| **100** | $6/mo | $0 (self-hosted) | $5/mo | $50/mo | **$0.50** |
| **1,000** | $60/mo | $0 (self-hosted) | $20/mo | $200/mo | **$0.20** |
| **10,000** | $600/mo | $0 (self-hosted) | $100/mo | $1,200/mo | **$0.12** |
| **100,000** | $6,000/mo | $500/mo (need more GPUs) | $500/mo | $12,000/mo | **$0.12** |

### Revenue vs Cost Analysis

| Plan | Price (Soles) | Price (USD) | Inference Cost/User | **Margin** |
|------|---------------|-------------|---------------------|------------|
| Basic (S/29) | S/29 | ~$7.70 | $0.12–0.50 | **93–98%** |
| Pro (S/49) | S/49 | ~$13.00 | $0.15–0.60 | **95–99%** |
| Premium (S/79) | S/79 | ~$21.00 | $0.20–0.80 | **96–99%** |

**At all price points, inference costs represent less than 7% of revenue** with proper optimization. The dominant costs will be WhatsApp Business API fees, server infrastructure, and engineering—not LLM inference.

---

## 10. Open-Source Model Strategies for LATAM Spanish

### Model Comparison for Spanish Performance

| Model | Parameters | Spanish Quality | License | Self-Host Feasible? |
|-------|-----------|----------------|---------|---------------------|
| Qwen 3.5-27B | 27B (AWQ 4-bit) | Excellent (119 languages) | Apache 2.0 | ✅ Already running |
| Qwen 3 4B | 4B | Very Good | Apache 2.0 | ✅ Single GPU |
| Llama 4 Scout | 109B (17B active) | Excellent | Llama License | ⚠️ Needs more VRAM |
| Mistral Small 3.2 | 24B | Strong (European Spanish focus) | Apache 2.0 | ✅ Single GPU |
| Mistral Large 2 | 123B | Excellent (80+ languages) | Apache 2.0 | ❌ Too large |
| Gemma 3 4B | 4B | Good (140+ languages) | Google ToU | ✅ Single GPU |

*Sources: [5][12][19]*

### Recommendations for Peruvian Spanish

1. **Qwen models are the strongest choice** for multilingual deployments. Qwen 3 supports 119 languages with Apache 2.0 licensing—the cleanest for commercial use [12]. The existing Qwen 3.5-27B on c.yaya.sh is an excellent base.

2. **Mistral models excel at European languages** including Spanish, with Mistral's French origins driving strong multilingual capabilities [19]. Mistral Small 3.2 (24B) runs on a single RTX 4090 and delivers 3× faster inference than Llama 3.3 70B [19].

3. **Fine-tuning a Qwen 3 4B on Peruvian business Spanish** creates an ultra-efficient model for 85% of queries. At 4B parameters with 4-bit quantization, it needs only ~3GB VRAM and can run alongside the 27B model on the existing A5000 infrastructure.

4. **Llama 4 Maverick** (400B MoE, 17B active) offers frontier-quality Spanish via hosted APIs at ~$0.40/M tokens—useful as an API fallback for complex queries.

### Why Open-Source Wins for This Use Case

- **Cost:** $0 per token for self-hosted inference (fixed GPU cost)
- **Customization:** Fine-tune for Peruvian business vocabulary
- **Privacy:** Business financial data never leaves your infrastructure
- **Licensing:** Apache 2.0 (Qwen, Mistral) = zero commercial restrictions

---

## 11. Edge Deployment Possibilities

### On-Device Opportunities

While WhatsApp is the primary interface (limiting traditional edge deployment), several operations can be pushed to lightweight edge processing:

| Operation | Model/Approach | Hardware | Latency |
|-----------|---------------|----------|---------|
| Intent classification | Rule engine + Qwen3-0.6B | Any server CPU | <10ms |
| Entity extraction | Regex + small NER model | CPU | <5ms |
| Number parsing (Soles) | Deterministic parser | CPU | <1ms |
| Greeting detection | Keyword matching | CPU | <1ms |
| Language detection | fastText classifier | CPU | <1ms |

### Server-Side "Edge" Processing

For operations that don't need LLM inference:
- **Sale recording:** Parse "Vendí 3 pollos a S/25" with regex + simple NLP → direct database write
- **Inventory lookup:** Direct database query, format with template
- **Price check:** Cache-based lookup, no LLM needed
- **Greeting/farewell:** Template responses

**Estimated 30–40% of all messages can be handled without any LLM call**, using deterministic processing pipelines. This represents the most cost-effective "edge" optimization—zero inference cost, sub-10ms latency.

### Future: On-Device Models via WhatsApp

As WhatsApp evolves and Meta integrates on-device AI (Llama-based), there may be future opportunities to run small models directly on users' phones for offline-capable basic operations. Gemma 3 4B and Qwen3-0.6B already run on smartphones [20].

---

## 12. Recommendations: Inference Architecture by Growth Stage

### Stage 1: MVP / Early Traction (0–500 users)

**Architecture:** API-first with smart routing

| Component | Choice | Cost |
|-----------|--------|------|
| Simple queries | GPT-4o Mini API | $0.15/$0.60 per M tokens |
| Complex queries | Claude Sonnet 4 API | $3/$15 per M tokens |
| Voice-to-text | Self-hosted Whisper Turbo (c.yaya.sh) | $0 marginal |
| Caching | Redis semantic cache | $10/month |
| **Total inference** | | **$20–50/month** |

**Priorities:**
- Validate product-market fit, don't over-optimize
- Collect real query data for future fine-tuning
- Implement basic intent routing (rule-based)
- Set up prompt caching with Anthropic/OpenAI

### Stage 2: Growth (500–5,000 users)

**Architecture:** Hybrid self-hosted + API

| Component | Choice | Cost |
|-----------|--------|------|
| Simple queries (70%) | Self-hosted Qwen 3.5-27B (c.yaya.sh) | $0 marginal |
| Moderate queries (25%) | GPT-4o Mini or DeepSeek V3 API | ~$100/month |
| Complex queries (5%) | Claude Sonnet 4 API | ~$50/month |
| Voice-to-text | Self-hosted Whisper Turbo | $0 marginal |
| Semantic caching | Redis + FAISS | $30/month |
| **Total inference** | | **$180–300/month** |

**Priorities:**
- Fine-tune Qwen 3 4B on collected query data (Peruvian business Spanish)
- Implement full semantic caching pipeline
- Build deterministic handlers for top 20 query patterns
- Pre-compute daily analytics in batch

### Stage 3: Scale (5,000–50,000 users)

**Architecture:** Dedicated GPU cluster + API overflow

| Component | Choice | Cost |
|-----------|--------|------|
| Simple queries | Fine-tuned Qwen 3 4B (dedicated GPU) | $500/month (cloud GPU) |
| Moderate queries | Self-hosted Qwen 3.5-27B cluster | $1,000/month |
| Complex queries | Claude Sonnet 4 / GPT-4o API | $300/month |
| Voice-to-text | Whisper cluster (2–4 GPUs) | $800/month |
| Caching + infra | Redis cluster + vector DB | $200/month |
| **Total inference** | | **$2,800–4,000/month** |
| **Cost per user** | | **$0.08–0.16** |

**Priorities:**
- Distill Claude/GPT-4o knowledge into larger self-hosted model
- Implement batch processing for all reports and analytics
- Deploy model-specific fine-tunes for accounting, inventory, invoicing
- A/B test model quality continuously

### Stage 4: Market Leader (50,000+ users)

**Architecture:** Full self-hosted with API safety net

| Component | Choice | Cost |
|-----------|--------|------|
| All routine queries | Custom fine-tuned models on GPU cluster | $5,000/month |
| Edge cases + fallback | Commercial APIs | $1,000/month |
| Voice pipeline | Dedicated Whisper cluster | $2,000/month |
| ML ops team | 1–2 engineers | $8,000/month |
| Infrastructure | Multi-GPU servers, load balancers | $3,000/month |
| **Total** | | **$19,000/month** |
| **Cost per user (100K)** | | **$0.19** |

At 100,000 users paying an average of S/49 ($13), monthly revenue is $1.3M. Inference infrastructure at $19K represents **1.5% of revenue**—extremely healthy unit economics.

---

## Key Takeaways

1. **LLM inference costs are NOT the bottleneck** for Yaya's unit economics at any scale, with proper architecture
2. **Cascade routing (small model → medium → large) saves 90–97%** compared to using a single frontier model
3. **Semantic caching eliminates 40–60% of LLM calls** for repetitive business queries
4. **Self-hosted open-source models** (Qwen, Mistral) on existing GPU infrastructure provide near-zero marginal cost for routine queries
5. **Voice-to-text should be self-hosted** from day one using Whisper Turbo on existing A5000 GPUs
6. **Fine-tuning a small model** (4B–7B) on Peruvian business Spanish data is the highest-ROI investment for long-term cost optimization
7. **30–40% of queries need no LLM at all** — deterministic parsing handles simple CRUD operations
8. **Start with APIs, migrate to self-hosted** as volume justifies the operational complexity

---

## Sources

[1] AI Superior, "LLM Inference Cost 2026: Complete Pricing Guide," March 2026. https://aisuperior.com/llm-token-cost/

[2] Silicon Data, "Understanding LLM Cost Per Token: A 2026 Practical Guide," March 2026. https://www.silicondata.com/blog/llm-cost-per-token

[3] ClawRouters, "AI Token Costs in 2026: Why Smart Routing is No Longer Optional," March 2026. https://www.clawrouters.com/blog/ai-token-costs-2026-smart-routing

[4] CloudIDR, "Complete LLM Pricing Comparison 2026: We Analyzed 60+ Models," March 2026. https://www.cloudidr.com/blog/llm-pricing-comparison-2026

[5] Decode's Future, "LLM API Pricing Guide 2026: Every Major Model Compared," March 2026. https://www.decodesfuture.com/articles/llm-api-pricing-guide-2026-every-major-model-compared

[6] DevTK, "Self-Hosting LLMs vs API: The Real Cost Breakdown (2026)," February 2026. https://devtk.ai/en/blog/self-hosting-llm-vs-api-cost-2026/

[7] AI Pricing Master, "Self-Hosting AI Models vs API Pricing: Complete Cost Analysis (2026)," January 2026. https://www.aipricingmaster.com/blog/self-hosting-ai-models-cost-vs-api

[8] BrainCuber, "Self-Hosted LLMs vs API-Based LLMs: Cost & Performance Analysis," March 2026. https://www.braincuber.com/blog/self-hosted-llms-vs-api-based-llms-cost-performance-analysis

[9] Xue et al., "Scheduled Checkpoint Distillation for Domain-Specific LLMs," arXiv:2601.10114, January 2026. https://arxiv.org/html/2601.10114v1

[10] Intuition Labs, "Fine-Tuning vs Distillation vs Prompt Engineering for LLMs," April 2025. https://intuitionlabs.ai/articles/llms-fine-tuning-vs-distillation-vs-prompting

[11] Saxena et al., "Streamlining LLMs: Adaptive Knowledge Distillation for Tailored Language Models," NAACL 2025. https://aclanthology.org/2025.naacl-srw.43/

[12] Shakudo, "Top 9 Large Language Models as of March 2026," March 2026. https://www.shakudo.io/blog/top-9-large-language-models

[13] Introl, "Prompt Caching Infrastructure: Reducing LLM Costs and Latency," December 2025. https://introl.com/blog/prompt-caching-infrastructure-llm-cost-latency-reduction-guide-2025

[14] AWS, "Optimize LLM response costs and latency with effective caching," February 2026. https://aws.amazon.com/blogs/database/optimize-llm-response-costs-and-latency-with-effective-caching/

[15] DEV Community, "Semantic Caching Cut Our LLM Costs by 40%," December 2025. https://dev.to/kuldeep_paul/semantic-caching-cut-our-llm-costs-by-40-4383

[16] Deepgram, "Speech-to-Text API Pricing Breakdown," January 2026. https://deepgram.com/learn/speech-to-text-api-pricing-breakdown-2025

[17] Deepgram, "Best Speech-to-Text APIs in 2025," January 2026. https://deepgram.com/learn/best-speech-to-text-apis

[18] Northflank, "Best open source speech-to-text (STT) model in 2026," January 2026. https://northflank.com/blog/best-open-source-speech-to-text-stt-model-in-2026-benchmarks

[19] Let's Data Science, "Open Source LLMs 2026: The Definitive Comparison," March 2026. https://letsdatascience.com/blog/open-source-llms-in-2026-the-definitive-comparison

[20] Local AI Master, "Small Language Models 2026: Phi-4, Gemma 3, Qwen 3," March 2026. https://localaimaster.com/blog/small-language-models-guide-2026
