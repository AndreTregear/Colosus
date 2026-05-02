# Yaya Platform — Implementation Plan
## Privacy-First AI with Self-Improving Agents
### The Architecture for Y Combinator

**Date:** March 22, 2026
**Author:** Andre Tregear / Yaya AI
**Status:** Design Complete, Ready for Implementation

---

## Executive Summary

Yaya Platform combines two breakthrough capabilities into one product:

1. **Zero-knowledge per-tenant encryption** — customer business data is encrypted with keys only the customer controls. Not even Yaya (the platform operator) can read it.

2. **Self-improving AI via Hermes-RL** — every conversation makes the AI smarter, using reinforcement learning from natural conversation feedback. The model improves continuously without human labeling or access to raw customer data.

These two capabilities are not in conflict — they are complementary. The RL system learns from **behavioral patterns** (how to query, format, respond) while the encryption system protects **business data** (customer names, payment details, financial records). The AI gets better at being a business assistant without ever seeing unencrypted PII in its training loop.

**This is the moat.** No competitor can replicate it without building the same infrastructure from scratch.

---

## Part I: The Problem We Solve

### For the Business Owner (the customer)
40 million Latin American micro-businesses manage everything through WhatsApp and paper notebooks. They have no ERP, no CRM, no accounting system. They are invisible to the formal economy.

Existing solutions fail because they require:
- A computer (most only have a phone)
- Technical literacy (most have secondary education)
- Monthly commitment (most don't trust subscriptions)
- Data sharing with a foreign company (most don't trust cloud services)

### For the Investor (Y Combinator)
The LATAM SMB SaaS market is $42B but has near-zero penetration because existing products don't fit the user. Yaya is the first platform that:
- Lives inside WhatsApp (no download, no learning curve)
- Speaks natural Peruvian/LATAM Spanish
- Runs entirely on local infrastructure (privacy by architecture)
- Gets better with every interaction (self-improving AI)
- Makes customer data cryptographically impossible for even us to read

---

## Part II: Technical Architecture

### The Stack (All Open Source)

```
┌─────────────────────────────────────────────────────────────────┐
│                    CUSTOMER (WhatsApp)                           │
│               Voice notes, text, payment screenshots             │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│              AUTOBOT (Express.js Gateway)                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────────┐ │
│  │ Baileys  │ │ REST API │ │Dashboard │ │ Crypto Middleware   │ │
│  │(WhatsApp)│ │(Express) │ │  (HTML)  │ │ Encrypt ↔ Decrypt  │ │
│  └────┬─────┘ └────┬─────┘ └──────────┘ └────────┬───────────┘ │
│       │            │                              │             │
│  ┌────▼────────────▼──────────────────────────────▼───────────┐ │
│  │              ENVELOPE ENCRYPTION LAYER                      │ │
│  │  KEK (from password) → DEK (per tenant) → AES-256-GCM      │ │
│  │  DEK cached in Redis (memory only, TTL = session)           │ │
│  └─────────────────────────┬───────────────────────────────────┘ │
└─────────────────────────────┼───────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌──────────────────┐ ┌───────────────┐ ┌──────────────────┐
│   ENCRYPTED DB   │ │ HERMES      │ │  HERMES-RL     │
│                  │ │ AGENT         │ │  (ASYNC RL LOOP) │
│ PII: ciphertext  │ │               │ │                  │
│ Prices: plaintext│ │ Sandboxed per │ │ Rollout → PRM →  │
│ Totals: plaintext│ │ tenant (Docker│ │ Train → Deploy   │
│ Stock: plaintext │ │ + PG RLS)     │ │                  │
│                  │ │               │ │ Learns from      │
│ AES-256-GCM     │ │ Qwen3.5-27B   │ │ conversation     │
│ Per-tenant DEK   │ │ via vLLM      │ │ patterns only    │
│ DEK encrypted    │ │ (65K context) │ │ (PII scrubbed)   │
│ with KEK         │ │               │ │                  │
└──────────────────┘ └───────────────┘ └──────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌──────────────────┐ ┌───────────────┐ ┌──────────────────┐
│ Lago (Billing)   │ │ Cal.com       │ │ Metabase         │
│ Subscriptions    │ │ Scheduling    │ │ Analytics        │
└──────────────────┘ └───────────────┘ └──────────────────┘
```

### Security Layers (Defense in Depth)

| Layer | What | How | Even if compromised... |
|-------|------|-----|----------------------|
| **1. Envelope Encryption** | PII encrypted with per-tenant AES-256-GCM key | DEK per tenant, KEK derived from password via Argon2id | DB dump = useless ciphertext |
| **2. PostgreSQL RLS** | Row-level security on all tables | Per-tenant DB role with `app.tenant_id` | SQL injection = only own data |
| **3. OpenShell Sandbox** | Each agent in Docker container | Kernel-level isolation (Landlock, seccomp) | Agent escape = limited blast radius |
| **4. Network Isolation** | Sandbox on internal Docker network | Deny-by-default egress policy | Exfiltration blocked |
| **5. Key Derivation** | KEK from password, DEK from KEK | Argon2id (memory-hard, GPU-resistant) | Password crack = only one tenant |
| **6. Ephemeral Keys** | DEK in Redis, TTL = session | Evicted on logout/expiry | Redis dump = keys expired |

---

## Part III: Encryption Implementation

### Prior Art & Literature

| Reference | What they did | What we learn |
|-----------|--------------|---------------|
| **AWS DynamoDB + ABAC** (AWS Security Blog, 2022) | Per-tenant encryption with KMS encryption context. ABAC prevents cross-tenant decryption. | Encryption context as tenant isolation primitive. Session-scoped credentials. |
| **AWS Multi-Tenant KMS Strategy** (AWS Architecture Blog, Aug 2025) | Single KMS key per tenant across services. Cross-account role delegation. | Centralized key management scales. Alias-based access control. |
| **VE3 Cryptographic Tenancy** (Feb 2026) | Per-tenant ALE with CMK/DEK hierarchy. "Cryptographic silos." | Zero-trust means even the provider can't read data. Three pillars: Tenant Resolver, Key Resolver, Crypto Engine. |
| **Replicon BYOK** (Nov 2024) | Tenant-specific encryption for SaaS with Aurora + KMS. | Enterprise customers demand key ownership. |
| **Signal Protocol** | Double Ratchet, per-message keys, forward secrecy. | Gold standard for messaging encryption. Inspiration for our key derivation chain. |
| **Boxcryptor / Tresorit** | Zero-knowledge file encryption for cloud storage. | Client-side encryption is marketable and understood by users. |

### Encryption Design

#### What Gets Encrypted (PII / Sensitive)
- `customers.name`, `customers.phone`, `customers.address`, `customers.notes`
- `orders.notes`, `orders.delivery_address`
- `payments.reference`, `payments.confirmed_by`
- `yape_notifications.sender_name`
- `message_log.body`, `message_log.push_name`
- `business_context.business_description`, `business_context.special_instructions`
- `leads.name`, `leads.email`, `leads.phone`, `leads.company`
- `appointments.notes`
- `admin_conversations.message`

#### What Stays Plaintext (Needed for Queries/Aggregation)
- `tenant_id`, `id`, `status`, `created_at`, `updated_at`
- `products.name`, `products.price`, `products.stock`, `products.category`
- `orders.total`, `orders.status`
- `payments.amount`, `payments.status`, `payments.method`
- `appointments.scheduled_at`, `appointments.duration_minutes`, `appointments.status`
- `token_usage.*`, `ai_usage_events.*`

#### Key Hierarchy

```
User Password
     │
     ▼ Argon2id(password, salt, t=3, m=65536, p=4)
     │
     KEK (Key Encryption Key) — 256 bits
     │    Never stored. Derived on every login.
     │    Used only to decrypt the DEK.
     │
     ▼ AES-256-GCM(KEK, encrypted_dek)
     │
     DEK (Data Encryption Key) — 256 bits
     │    Generated once per tenant (on registration).
     │    Stored encrypted (as encrypted_dek) in tenant_encryption_keys table.
     │    Cached in Redis during active session (TTL = session length).
     │
     ▼ AES-256-GCM(DEK, plaintext_field, aad=tenant_id+table+column)
     │
     Ciphertext (stored in PostgreSQL)
          Includes: nonce (12 bytes) + ciphertext + auth tag (16 bytes)
          AAD: tenant_id + table_name + column_name (prevents ciphertext swapping)
```

#### Implementation Steps

**Step 1: Schema Changes**
```sql
-- Store encrypted DEKs
CREATE TABLE tenant_encryption_keys (
    tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
    encrypted_dek BYTEA NOT NULL,        -- DEK encrypted with KEK
    dek_salt BYTEA NOT NULL,             -- Salt for Argon2id
    dek_nonce BYTEA NOT NULL,            -- Nonce used to encrypt DEK
    key_version INT NOT NULL DEFAULT 1,  -- For key rotation
    created_at TIMESTAMPTZ DEFAULT now(),
    rotated_at TIMESTAMPTZ
);

-- Encrypted columns store BYTEA instead of TEXT
-- Migration: ALTER TABLE customers ALTER COLUMN name TYPE BYTEA USING name::bytea;
-- (with encryption applied during migration)
```

**Step 2: Crypto Engine Module**
```
autobot/src/crypto/
├── envelope.ts       — KEK derivation (Argon2id), DEK encrypt/decrypt
├── field-crypto.ts   — Per-field AES-256-GCM encrypt/decrypt with AAD
├── key-cache.ts      — Redis DEK cache (set on login, TTL = session)
├── middleware.ts      — Express middleware: decrypt on read, encrypt on write
└── migration.ts      — One-time encryption of existing plaintext data
```

**Step 3: Repository Middleware**
Each repo that handles PII gets a transparent encryption layer:
```typescript
// Before: repo returns plaintext
const customer = await customersRepo.getById(tenantId, id);
// customer.name = "María García"

// After: repo returns decrypted (if DEK is in cache)
const customer = await customersRepo.getById(tenantId, id);
// customer.name = "María García" (decrypted transparently)
// In DB: customer.name = 0x1a2b3c4d... (AES-256-GCM ciphertext)
```

**Step 4: Login Flow Changes**
```
1. User enters email + password
2. Better Auth validates credentials (bcrypt check)
3. System derives KEK = Argon2id(password, tenant_salt)
4. System decrypts DEK = AES-256-GCM.decrypt(encrypted_dek, KEK)
5. System stores DEK in Redis: SET dek:{tenantId} {DEK} EX {session_ttl}
6. All subsequent requests use the cached DEK for encrypt/decrypt
7. On logout/expiry: DEL dek:{tenantId} — data is locked
```

**Step 5: What the AI Agent Sees**
```
User: "Cuántos clientes tengo?"
Agent: exec → psql query → SELECT name, phone FROM customers WHERE tenant_id = X
DB returns: encrypted blobs
Autobot middleware: decrypts with DEK from Redis
Agent sees: "María García, +51999888777"
Agent responds: "Tienes 23 clientes. Los más recientes son María García y..."

RL training sees: "User asked for customer count → Agent queried DB → formatted response"
RL DOES NOT see: "María García" (PII scrubbed from training data)
```

---

## Part IV: Hermes-RL Integration

### Prior Art & Literature

| Reference | Key Insight |
|-----------|-------------|
| **Hermes-RL** (Gen-Verse, Princeton, Feb 2026) | Async RL from conversation feedback. Binary RL + OPD. No manual labeling. |
| **Hermes-RL Technical Report** (arXiv:2603.10165, Mar 2026) | #1 HuggingFace Daily Papers. Next-state signals as universal learning interface. |
| **GRPO** (DeepSeek, 2024) | Group Relative Policy Optimization — RL without a critic model. |
| **DPO/SDPO** (Rafailov et al., 2023; extended 2026) | Direct Preference Optimization — simpler than PPO, no reward model needed. |
| **Constitutional AI** (Anthropic, 2023) | Self-supervision with principles. Relevant for safety during RL. |
| **Slime Framework** (Tsinghua THUDM) | Megatron-based RL training backbone. 4,400+ GitHub stars. |

### How Hermes-RL Works for Yaya

```
┌──────────────────────────────────────────────────────────┐
│                 LIVE SERVING (24/7)                        │
│                                                           │
│  Business owner sends WhatsApp message                    │
│           ↓                                               │
│  Autobot → Hermes Agent (Qwen3.5-27B via vLLM)         │
│           ↓                                               │
│  Agent responds with business data                        │
│           ↓                                               │
│  User reaction = NEXT-STATE SIGNAL                        │
│  • "perfecto" → positive (Binary RL: +1)                  │
│  • "no, eso está mal" → negative + directive (OPD hint)   │
│  • re-query same question → implicit negative              │
│  • 👍 reaction → positive                                  │
│  • silence → neutral (skip)                               │
└──────────────────────┬────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│              ROLLOUT COLLECTOR (async)                     │
│                                                           │
│  1. Intercepts conversation via Hermes extension         │
│  2. Classifies turns: main-line (trainable) vs side       │
│  3. Extracts next-state signal from user reaction         │
│  4. PII SCRUBBER removes customer names, phones, amounts  │
│     • "María García" → "[CUSTOMER_NAME]"                  │
│     • "+51999888777" → "[PHONE]"                          │
│     • "S/1,847" → "[AMOUNT]"                              │
│  5. Writes sanitized trajectory to training buffer        │
└──────────────────────┬────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│              PRM JUDGE (async, on GPU)                     │
│                                                           │
│  Process Reward Model scores each turn:                   │
│  • Binary RL: was the response helpful? (+1 / -1 / skip)  │
│  • OPD: extract hindsight hint from user correction       │
│  • Majority voting across 3 evaluations for robustness    │
│                                                           │
│  Judge model: same Qwen3.5-27B (or smaller PRM)           │
│  Runs on same GPU during idle time                        │
└──────────────────────┬────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│              POLICY TRAINER (async, on GPU)                │
│                                                           │
│  LoRA fine-tuning on scored trajectories:                  │
│  • Rank 16-32 LoRA adapters (fits on 2×A5000)            │
│  • Combined method: Binary RL + OPD                       │
│  • Trains during low-traffic hours (midnight-6am Lima)    │
│  • Checkpoint every 100 training steps                    │
│  • A/B test: new adapter vs current on 10% of traffic     │
│  • Promote if: response quality improves > 5%             │
│                                                           │
│  Training data is PII-scrubbed:                           │
│  • No customer names, phones, or financial amounts        │
│  • Only behavioral patterns and response structures       │
└──────────────────────────────────────────────────────────┘
```

### What the Model Learns (without seeing PII)

| Signal | What it learns | Example |
|--------|---------------|---------|
| User re-queries | The response format was confusing | "Show inventory as a table, not a paragraph" |
| User correction | A specific behavior was wrong | "Don't suggest discounts below 10%" |
| User thumbs up | The response pattern works | "Summarize sales with emojis and bullet points" |
| Tool call success | The SQL query pattern works | "JOIN orders+products for revenue queries" |
| Tool call failure | The SQL was wrong | "Always include GROUP BY with aggregate functions" |
| Peruvian Spanish corrections | Language/cultural patterns | "Use 'jefito' not 'estimado señor'" |

### Implementation Steps

**Step 1: Install Hermes-RL extension on c.yaya.sh**
```bash
# The RL training headers extension intercepts conversations
cd ~/yaya_platform
git clone https://github.com/Gen-Verse/Hermes-RL.git
cd Hermes-RL/extensions/rl-training-headers
# Install into Hermes
```

**Step 2: PII Scrubber** (`autobot/src/ai/pii-scrubber.ts`)
```typescript
// Regex + NER-based PII removal from training data
// Replaces: names, phones, RUCs, amounts, addresses
// With: [CUSTOMER_NAME], [PHONE], [RUC], [AMOUNT], [ADDRESS]
// Preserves: query patterns, response structure, tool calls
```

**Step 3: LoRA Training Configuration**
```bash
# Fits on 2×A5000 (24GB each)
# Base model: Qwen3.5-27B-AWQ (already loaded in vLLM)
# LoRA rank: 16 (trade-off: quality vs VRAM)
# Training during off-peak: 00:00-06:00 Lima time
# Checkpoint: every 100 steps
# Evaluation: 10% A/B traffic split
```

**Step 4: Rollout Collector**
- Hook into autobot's `ai-queue.ts` (already logs all conversations)
- After response + user reaction, emit to rollout buffer
- PII scrubber processes before writing to training JSONL

**Step 5: Deployment Pipeline**
```
New LoRA adapter trained
     ↓
A/B test on 10% of traffic (1-2 days)
     ↓
Compare metrics: response quality, user re-queries, tool call success
     ↓
If improved > 5%: promote to production
     ↓
vLLM hot-swaps LoRA adapter (no restart needed)
```

---

## Part V: Hardware Requirements

### Current Infrastructure (c.yaya.sh)
- **CPU:** Intel i9-10900X (10 cores, 20 threads)
- **RAM:** 125GB DDR4
- **GPU:** 2× NVIDIA RTX A5000 (24GB VRAM each)
- **Storage:** SSD (plenty)
- **Network:** Gigabit + Cloudflare Tunnel

### Capacity Planning

| Component | Current | With Encryption | With RL | With Both |
|-----------|---------|-----------------|---------|-----------|
| vLLM (inference) | 40GB VRAM | Same | Shared with training | Time-sliced |
| LoRA training | N/A | N/A | 8-12GB VRAM | Off-peak hours |
| Crypto (Argon2id) | N/A | ~50ms/login | N/A | ~50ms/login |
| Redis (DEK cache) | ~10MB | +~1KB/tenant | Same | Same |
| PostgreSQL | ~500MB | +~30% (ciphertext overhead) | Same | +~30% |
| Rollout buffer | N/A | N/A | ~100MB/day | ~100MB/day |

**Verdict:** Current hardware is sufficient for MVP (up to ~1,000 tenants). RL training during off-peak hours shares GPU with inference. Encryption adds minimal overhead.

---

## Part VI: Implementation Timeline

### Phase 1: Encryption (Weeks 1-2)
- [ ] Day 1-2: `crypto/envelope.ts` — Argon2id KEK derivation, AES-256-GCM DEK management
- [ ] Day 3-4: `crypto/field-crypto.ts` — Per-field encrypt/decrypt with AAD
- [ ] Day 5-6: `crypto/key-cache.ts` — Redis DEK cache, session lifecycle
- [ ] Day 7-8: `crypto/middleware.ts` — Transparent encrypt/decrypt in repos
- [ ] Day 9-10: Schema migration + encrypt existing data
- [ ] Day 11-12: Login flow changes (KEK derivation on auth)
- [ ] Day 13-14: Testing + security audit

### Phase 2: RL Pipeline (Weeks 3-4)
- [ ] Day 15-16: PII scrubber (`pii-scrubber.ts`)
- [ ] Day 17-18: Rollout collector (hook into ai-queue.ts)
- [ ] Day 19-20: Hermes-RL extension installation
- [ ] Day 21-22: PRM judge configuration
- [ ] Day 23-24: LoRA training pipeline (off-peak scheduler)
- [ ] Day 25-26: A/B testing framework
- [ ] Day 27-28: Monitoring + metrics dashboard

### Phase 3: Production Hardening (Weeks 5-6)
- [ ] OpenShell sandbox integration (Hermes)
- [ ] Key rotation mechanism
- [ ] BYOK (Bring Your Own Key) for enterprise tenants
- [ ] Disaster recovery (encrypted backups with separate KEK)
- [ ] Security penetration testing
- [ ] GDPR/LATAM data protection compliance documentation

---

## Part VII: The YC Pitch

### One-liner
"Yaya is the AI-powered WhatsApp OS for Latin American small businesses — with zero-knowledge encryption and a self-improving AI that gets smarter every day."

### Why Now
1. **WhatsApp is the OS** — 92% penetration in LATAM, 20M+ businesses already use it
2. **E-invoicing mandates** — Peru/Mexico/Colombia forcing digital adoption
3. **LLM costs collapsed** — local inference at $0/query makes $13/month pricing viable
4. **Hermes-RL just released** — first practical framework for continuous agent improvement
5. **Trust deficit** — LATAM has the lowest institutional trust globally; zero-knowledge encryption is a differentiator, not a feature

### Competitive Advantage
| Us | Them |
|----|------|
| Zero-knowledge encryption (can't read customer data) | Standard cloud storage (they read everything) |
| Self-improving AI (gets better daily) | Static model (same mistakes forever) |
| Local inference ($0/query) | Cloud API ($0.01-0.05/query) |
| WhatsApp-native (no download) | Separate app (requires behavior change) |
| Open-source stack (no vendor lock-in) | Proprietary (locked in) |
| LATAM-native Spanish (cultural fluency) | Translated English (awkward) |

### Metrics to Track
- **Daily Active Tenants** — businesses using Yaya today
- **Messages Processed** — volume of WhatsApp interactions
- **AI Quality Score** — % of responses without re-queries (improves with RL)
- **Encryption Coverage** — % of PII fields encrypted
- **Model Improvement Rate** — quality improvement per week of RL training
- **NPS** — tenant satisfaction score

### The Flywheel
```
More tenants → More conversations → Better RL training → Better AI
     ↑                                                       │
     └──── Better AI → Higher retention → More referrals ────┘
```

---

## Part VIII: Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Encryption slows queries | Medium | Only PII is encrypted; aggregation columns stay plaintext |
| DEK loss = data loss | Critical | Encrypted backup of all DEKs with separate recovery KEK |
| RL makes model worse | High | A/B testing gate; automatic rollback if quality drops |
| GPU contention (inference vs training) | Medium | Time-slice: training only during off-peak hours |
| PII leaks into training data | Critical | Regex + NER scrubber; manual audit of training samples |
| WhatsApp account ban | High | Channel-agnostic core; Telegram/SMS fallback ready |
| Key derivation too slow | Low | Argon2id tuned to ~50ms; cached DEK avoids re-derivation |

---

## Appendix: File Map

```
autobot/src/
├── crypto/                    ← NEW: Encryption layer
│   ├── envelope.ts            — KEK/DEK management (Argon2id + AES-256-GCM)
│   ├── field-crypto.ts        — Per-field encrypt/decrypt with AAD
│   ├── key-cache.ts           — Redis DEK cache (session lifecycle)
│   ├── middleware.ts          — Transparent repo encryption
│   └── migration.ts          — One-time plaintext→ciphertext migration
├── ai/
│   ├── hermes-bridge.ts     — Hermes agent invocation (existing)
│   ├── pii-scrubber.ts        ← NEW: Strip PII from RL training data
│   └── client.ts              — vLLM/Whisper clients (existing)
├── integrations/
│   ├── tenant-provisioner.ts  — DB role + encryption key provisioning
│   ├── lago-client.ts         — Billing (existing)
│   ├── calcom-client.ts       — Scheduling (existing)
│   └── sso-manager.ts         — SSO for OSS services (existing)
├── rl/                        ← NEW: RL pipeline
│   ├── rollout-collector.ts   — Capture conversation trajectories
│   ├── training-scheduler.ts  — Off-peak LoRA training trigger
│   └── ab-test.ts             — A/B test new adapters before promotion
└── [existing: bot/, db/, web/, queue/, media/, services/, shared/]

infra/
├── hermes-rl/               ← NEW: RL configuration
│   ├── run_qwen35_27b_lora.sh — LoRA training launch script
│   ├── pii-scrub-config.yaml  — PII scrubbing rules
│   └── ab-test-config.yaml    — A/B testing parameters
├── hermes/
│   └── tenant-policy.yaml     — OpenShell sandbox policy (existing)
└── docker/
    └── docker-compose.prod.yml — Full stack (existing)
```

---

*This document is the technical foundation for Yaya Platform's YC application. It demonstrates that privacy-first AI and self-improving agents are not trade-offs — they are the same architecture.*
