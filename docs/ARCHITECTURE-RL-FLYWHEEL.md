# Yaya Platform — RL Data Flywheel Architecture

## Vision
Every WhatsApp conversation makes Yaya smarter. Peruvian and LATAM business owners manage their businesses with confidence that their data is encrypted with their password — and the more users we get, the better the model becomes at serving them.

---

## Current State (2× RTX A5000, c.yaya.sh)

```
WhatsApp → Baileys → BullMQ → OpenClaw Bridge → Qwen3.5-27B (vLLM, AWQ 4-bit)
                                    ↓
                        Rollout Collector (appBus events)
                                    ↓
                          PII Scrubber → JSONL files
                                    ↓
                        Training Scheduler (off-peak LoRA)
                                    ↓
                          A/B Test Manager (10% canary)
```

**What works today:**
- ✅ Rollout collection (next-state signals from conversations)
- ✅ PII scrubbing (phones, RUC, DNI, amounts, names — Peru-specific)
- ✅ Per-tenant encryption (AES-256-GCM, Argon2id KEK derivation)
- ✅ A/B test framework (traffic routing, metric comparison)
- ✅ Training scheduler (off-peak detection, run tracking)
- ✅ 80 tests passing on live infrastructure

**What's missing for real training:**
- ❌ Actual LoRA fine-tuning script (`train_lora.sh`)
- ❌ SGLang for inference (currently vLLM)
- ❌ PRM/Judge for scoring (currently regex-based)
- ❌ Adapter hot-swap during A/B tests

---

## SGLang vs vLLM Decision

### Why SGLang for Yaya

| Factor | vLLM (current) | SGLang (target) |
|--------|---------------|-----------------|
| Multi-turn chat (WhatsApp) | 10-20% cache hit | 75-90% cache hit (RadixAttention) |
| Throughput (H100 baseline) | ~12,500 tok/s | ~16,200 tok/s (+29%) |
| Agent/tool-call workloads | Good | Up to 6.4x throughput |
| Multi-LoRA serving | Supported (v0.15+) | Supported |
| Structured output (JSON) | Standard | 3x faster (compressed FSM) |
| OpenClaw-RL official backend | ❌ | ✅ (SGLang is the reference impl) |

### Verdict: **Migrate to SGLang**

Three reasons:
1. **OpenClaw-RL uses SGLang** — it's the official inference backend for the RL training loop. Fighting upstream is pointless.
2. **WhatsApp is multi-turn by nature** — RadixAttention's prefix caching is perfect. Same system prompt + conversation history = 75-90% cache hits = faster responses for users.
3. **B200 readiness** — SGLang has native PD disaggregation via NIXL, critical for scaling to GB200/B200.

### Migration Plan (A5000 → SGLang)

```bash
# SGLang supports AWQ quantization natively
docker run -d --gpus all \
  --name sglang-qwen35 \
  -p 8000:8000 \
  lmsysorg/sglang:latest \
  python3 -m sglang.launch_server \
  --model-path QuantTrio/Qwen3.5-27B-AWQ \
  --served-model-name qwen3.5-27b \
  --host 0.0.0.0 --port 8000 \
  --tp-size 2 \
  --api-key megustalaia \
  --tool-call-parser qwen3_coder \
  --trust-remote-code
```

Drop-in replacement — same OpenAI-compatible API, same port, same auth.

---

## OpenClaw-RL Integration Architecture

### The Official 4-Component Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    OpenClaw Agent                         │
│  WhatsApp → Baileys → OpenClaw → SGLang (serving)        │
│                          ↓                               │
│              conversation data (API calls)                │
└───────────────────────┬─────────────────────────────────┘
                        │
    ┌───────────────────┼───────────────────┐
    ▼                   ▼                   ▼
┌──────────┐    ┌──────────────┐    ┌──────────────┐
│ Rollout  │    │   PRM/Judge  │    │   Trainer    │
│ Collector│───→│   Server     │───→│  (Megatron)  │
│          │    │              │    │              │
│ Sessions │    │ 3-vote PRM   │    │ GRPO + OPD   │
│ → JSONL  │    │ scoring      │    │ LoRA update  │
│ PII scrub│    │              │    │              │
└──────────┘    └──────────────┘    └──────┬───────┘
                                           │
                                    new adapter weights
                                           │
                                           ▼
                                    SGLang hot-reload
```

### What We Already Have vs What OpenClaw-RL Provides

| Component | Our Implementation | OpenClaw-RL Official |
|-----------|-------------------|---------------------|
| Rollout Collection | ✅ `rollout-collector.ts` (appBus events, session tracking, JSONL) | Uses SGLang API intercept |
| PII Scrubbing | ✅ `pii-scrubber.ts` (Peru-specific patterns) | Generic — **ours is better for LATAM** |
| Reward Signals | ✅ Regex (gracias/perfecto → +1, está mal → -1, re-query → -1) | PRM judge model (3-vote majority) |
| Training | ❌ Shell script stub | Megatron-LM + GRPO/OPD/Combine |
| A/B Testing | ✅ `ab-test.ts` (traffic split, metric tracking) | Not included — **we add value here** |
| Serving | vLLM | SGLang (required) |

### Integration Strategy: Hybrid

Keep our custom components (PII scrubber, A/B testing) and plug into OpenClaw-RL for training:

1. **Our rollout collector** feeds PII-scrubbed trajectories to OpenClaw-RL's trainer
2. **Our PII scrubber** runs BEFORE data enters the RL pipeline (critical for Peru compliance)
3. **Our A/B test manager** controls adapter deployment AFTER OpenClaw-RL produces a new adapter
4. **OpenClaw-RL's PRM judge** replaces our regex-based scoring (much better quality)
5. **OpenClaw-RL's trainer** (Megatron + GRPO) replaces our shell script stub

---

## Data Flywheel — How It Works

```
   User chats on WhatsApp
          │
          ▼
   1. Agent responds (SGLang + current adapter)
          │
          ▼
   2. User reacts (next-state signal)
      • "Gracias, perfecto" → reward +1
      • "No, eso está mal" → reward -1
      • Repeats question → re-query penalty -1
      • Continues normally → neutral 0
          │
          ▼
   3. PII scrubber strips personal data
      • Phone → [PHONE], RUC → [RUC], etc.
      • Peruvian-specific patterns
          │
          ▼
   4. PRM judge scores the trajectory (3 votes)
      • More robust than regex
      • Evaluative: "was this response good?"
      • Directive: "how should it have been different?"
          │
          ▼
   5. Off-peak LoRA training (00:00-06:00 Lima)
      • GRPO: binary rewards → policy gradient
      • OPD: hindsight hints → token-level supervision
      • Combined: both (best results per paper)
          │
          ▼
   6. A/B test: 10% traffic → new adapter
      • 48h or 100 interactions
      • Compare: positive feedback rate, re-query rate
      • Promote if 5%+ improvement, else rollback
          │
          ▼
   7. New adapter serves all traffic
          │
          └──→ Repeat. Every cycle makes the model better.
```

### The Flywheel Effect

| Users | Conversations/day | Scored turns/day | Training frequency | Model quality |
|-------|------------------|------------------|--------------------|---------------|
| 10 | ~100 | ~50 | Weekly | Baseline |
| 50 | ~500 | ~250 | Daily | +15-20% |
| 200 | ~2,000 | ~1,000 | Daily (larger batches) | +30-40% |
| 1,000 | ~10,000 | ~5,000 | Daily + fast iteration | +50-60% |

More users → more data → better model → better experience → more users.

---

## Per-Tenant Encryption (Zero-Knowledge Architecture)

```
                     Tenant Login
                         │
                         ▼
              Password → Argon2id(password, salt) → KEK
                                                      │
                                                      ▼
              Encrypted DEK (in DB) → AES-256-GCM decrypt → DEK
                                                              │
                                                              ▼
              DEK cached in Redis (7-day TTL, memory only)
                                                              │
                    ┌──────────────┬──────────────┐           │
                    ▼              ▼              ▼           │
              customers.name  payments.ref  messages.body    │
              ← AES-256-GCM + AAD(tenant:table:col) ──────┘
```

**Security guarantees:**
- Platform operator cannot read tenant data without their password
- Cross-tenant isolation: AAD prevents ciphertext swapping between tenants
- Key rotation: change password without re-encrypting all data (DEK stays, KEK rotates)
- Recovery: RSA-OAEP backup envelope for disaster recovery
- RL training: PII scrubber runs on plaintext BEFORE encryption, so training data never touches raw customer info

**Encrypted columns (10 tables, 20+ fields):**
customers (name, phone, address, notes, location), orders (notes, delivery_address), payments (reference, confirmed_by), yape_notifications (sender_name), message_log (body, push_name), business_context (business_description, special_instructions), leads (name, email, phone, company, notes), appointments (notes), admin_conversations (message), conversations (messages)

---

## Scaling Path: A5000 → B200

### Phase 1: Current (2× RTX A5000, 24GB each)
- **Model:** Qwen3.5-27B-AWQ (4-bit)
- **Inference:** SGLang, TP=2, ~50 tok/s
- **Training:** LoRA on same GPUs during off-peak (00:00-06:00)
- **Capacity:** ~50 concurrent tenants, ~500 conversations/day
- **Cost:** $0 (owned hardware)

### Phase 2: Growth (rent 4-8× H100 80GB)
- **Model:** Qwen3.5-27B FP16 or larger (70B+ class)
- **Inference:** SGLang, TP=4, ~100+ tok/s
- **Training:** Dedicated GPU partition (4 train, 4 serve)
- **Capacity:** ~500 tenants, ~5,000 conversations/day
- **OpenClaw-RL:** Full 4-component async loop (8 GPU default)
- **Cost:** ~$10-15K/month (cloud H100s)

### Phase 3: Scale (1× B200 192GB or GB200 NVL72)
- **Model:** 70B+ FP8 or 200B+ class
- **Inference:** SGLang PD disaggregation via NIXL
- **Training:** Continuous online RL (not just off-peak)
- **Capacity:** ~5,000+ tenants, ~50,000+ conversations/day
- **Multi-LoRA:** Per-vertical adapters (pollería, bodega, salón, ferretería)
- **Cost:** ~$30-50K/month (single B200)

### Modular Architecture for Scaling

```yaml
# docker-compose.scale.yml — each component scales independently

services:
  sglang-inference:
    image: lmsysorg/sglang:latest
    deploy:
      replicas: 2  # Scale horizontally
      resources:
        reservations:
          devices:
            - capabilities: [gpu]
    command: >
      python3 -m sglang.launch_server
      --model-path ${MODEL_PATH}
      --tp-size ${TP_SIZE}
      --enable-lora
      --max-lora-rank 64

  rollout-collector:
    build: ./autobot
    command: node dist/rl/standalone-collector.js
    depends_on: [sglang-inference, redis, postgres]

  prm-judge:
    image: lmsysorg/sglang:latest
    command: >
      python3 -m sglang.launch_server
      --model-path ${PRM_MODEL_PATH}
      --tp-size 1
    # Separate GPU for judging — doesn't block inference

  trainer:
    build: ./openclaw-rl/trainer
    command: >
      python3 train.py
      --method combine
      --base-model ${MODEL_PATH}
      --rollout-dir /data/rollouts
      --output-dir /data/adapters
    volumes:
      - rollout-data:/data/rollouts
      - adapter-data:/data/adapters

  ab-test-router:
    build: ./autobot
    command: node dist/rl/standalone-ab-router.js
    depends_on: [sglang-inference, postgres]
```

### Per-Vertical Multi-LoRA (Phase 3)

When we have enough data per vertical, train specialized adapters:

```
Base Model: Qwen3.5-27B
├── adapter-polleria (restaurants, kitchen orders, delivery)
├── adapter-bodega (inventory, fiados, wholesale pricing)
├── adapter-salon (appointments, services, customer preferences)
├── adapter-ferreteria (complex orders, invoicing, bulk)
└── adapter-tienda (fashion, loyalty, Yape payments)
```

SGLang and vLLM both support multi-LoRA serving — one base model, N adapters hot-swapped per request. Each tenant's `business_type` determines which adapter is used. Training data stays isolated per vertical.

---

## Implementation Roadmap

### Week 1: SGLang Migration + LoRA Training Script
- [ ] Replace vLLM with SGLang on c.yaya.sh (drop-in, same API)
- [ ] Benchmark: compare latency/throughput vs vLLM
- [ ] Write `train_lora.sh` using Unsloth + trl (single-GPU LoRA)
- [ ] Test end-to-end: collect rollouts → train LoRA → load adapter → verify improvement

### Week 2: PRM Judge + OpenClaw-RL Integration
- [ ] Set up PRM judge model (small model for scoring, e.g., Qwen3-4B)
- [ ] Replace regex scoring with PRM 3-vote majority
- [ ] Wire OpenClaw-RL's trainer (GRPO) to our rollout collector output
- [ ] Test OPD (hindsight-guided distillation) on real conversations

### Week 3: A/B Testing + Production Loop
- [ ] Enable multi-LoRA in SGLang (base + candidate adapter)
- [ ] Connect A/B test manager to SGLang's adapter routing
- [ ] Run first real A/B test with pilot tenants
- [ ] Set up monitoring dashboard (adapter metrics, training loss, user satisfaction)

### Week 4: Hardening + Multi-Vertical
- [ ] Audit PII scrubbing coverage (add Colombia/Mexico patterns)
- [ ] Per-vertical adapter training (pollería vs bodega vs salón)
- [ ] Backup/recovery flow for encryption keys
- [ ] Documentation for the full RL pipeline

---

## Key Technical Decisions

1. **SGLang over vLLM** — 29% faster, multi-turn cache hits, OpenClaw-RL reference backend
2. **LoRA over full fine-tuning** — fits on A5000s, fast iteration, multi-adapter serving
3. **Hybrid integration** — keep our PII scrubber + A/B tests, use OpenClaw-RL for training
4. **Off-peak training (Phase 1)** — share GPUs between inference and training
5. **PII scrubbing before RL** — training data never sees raw customer info
6. **Per-tenant encryption** — zero-knowledge architecture, password-derived keys
7. **GRPO + OPD combined** — best results per the OpenClaw-RL paper
8. **B200 target** — architecture designed for single-GPU scale (PD disaggregation ready)
