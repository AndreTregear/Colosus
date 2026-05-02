# The Yaya Blueprint

## Secure AI Agents in Production — A Replicable Architecture

*How to build an encrypted, self-improving, multi-tenant AI agent platform that serves real businesses through messaging.*

---

## Who This Is For

You're an agent (or human) building an AI assistant for a specific domain — health clinics, personal trainers, restaurants, law firms, whatever. Your users are non-technical. They don't install apps. They use WhatsApp, Telegram, or SMS. They need an AI that knows their business, protects their data, and gets better over time.

This document is your blueprint. It's opinionated. It works. We built it, tested it, and shipped it.

---

## Table of Contents

1. [Guiding Philosophy](#guiding-philosophy)
2. [System Architecture](#system-architecture)
3. [The Five Pillars](#the-five-pillars)
4. [Security as a Design Pattern](#security-as-a-design-pattern)
5. [The Data Flywheel (Hermes-RL)](#the-data-flywheel)
6. [Multi-Tenancy Done Right](#multi-tenancy)
7. [Persona Testing](#persona-testing)
8. [OSS-First Integration Pattern](#oss-first-integration)
9. [Adapting to a New Domain](#adapting-to-a-new-domain)
10. [Reference Implementation](#reference-implementation)

---

## Guiding Philosophy

### 1. Security Is Not a Feature — It's the Architecture

Most AI platforms treat security as a checkbox. Encryption at rest? Check. Auth? Check. But the AI itself has unrestricted access to all tenant data through its prompts.

**Our approach:** Security lives in the database kernel, not in the AI's instructions. PostgreSQL Row-Level Security (RLS) ensures that even if the AI goes rogue, it physically cannot access another tenant's data. Encryption keys are derived from the user's password — we (the platform operators) cannot read their data even if we wanted to.

This isn't paranoia. It's the only architecture that lets you tell a Peruvian bodega owner "your competitor cannot see your sales data" and actually mean it.

### 2. The AI Should Get Smarter From Use

Static models decay. Your best model today is your worst model in six months. The platform must have a built-in feedback loop: conversations generate training data, training data improves the model, the improved model generates better conversations.

This is the Hermes-RL flywheel. It's not optional — it's what makes you defensible against competitors who just wrap GPT-4.

### 3. Build on OSS, Don't Reinvent

For every component you're about to write custom code for, ask: "Is there an open-source project with 1000+ GitHub stars that does this?" If yes, add it to docker-compose and write an MCP tool for the agent to use it.

Billing? Lago. Scheduling? Cal.com. Analytics? Metabase. Voice? Whisper + Kokoro. Invoicing? InvoiceShelf. Every OSS project you integrate is 10,000 hours of engineering you didn't have to do.

### 4. WhatsApp Is the Universal Interface

In Latin America, Africa, South Asia, and Southeast Asia, WhatsApp IS the internet. Your users don't download apps. They don't open browsers. They send WhatsApp messages. Design for this reality.

This means: short messages, voice note support, image processing (payment screenshots), no complex UI flows. The AI should handle everything through conversation.

### 5. One Command Deploy

If it takes more than `./start.sh` to go from zero to running, you've failed. New developers, new servers, disaster recovery — all should be one command. Docker Compose is your friend. Encode every dependency, every database migration, every secret generation into the startup script.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      MESSAGING LAYER                         │
│  WhatsApp (Baileys) │ Telegram │ SMS │ Web Chat              │
└────────────┬────────────────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────────────────┐
│                    GATEWAY (Autobot)                          │
│  Multi-tenant router │ BullMQ queue │ Rate limiter            │
│  Message log │ Media processor │ Encryption middleware        │
└────────────┬────────────────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────────────────┐
│                    AI BRAIN (Hermes)                        │
│  Agent framework │ Skills │ Memory │ Tool calling             │
│  ┌──────────────────────────────────────────────┐            │
│  │  Hermes Security Sandbox                    │            │
│  │  Landlock │ Seccomp │ Network namespaces       │            │
│  │  Deny-by-default policy                       │            │
│  └──────────────────────────────────────────────┘            │
└────────────┬────────────────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────────────────┐
│                    LLM SERVING                               │
│  vLLM/SGLang │ Qwen3.5-27B │ Multi-LoRA adapters            │
│  ┌──────────────────────────────────────────────┐            │
│  │  Hermes-RL Training Loop                    │            │
│  │  Rollout collector → PII scrubber → Trainer   │            │
│  │  A/B test manager → Adapter hot-swap          │            │
│  └──────────────────────────────────────────────┘            │
└────────────┬────────────────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────────────────┐
│                    DATA LAYER                                │
│  PostgreSQL (RLS) │ Redis │ MinIO (S3)                       │
│  Per-tenant encryption │ Argon2id key derivation             │
│  ┌──────────────────────────────────────────────┐            │
│  │  OSS Services (MCP-connected)                 │            │
│  │  Lago (billing) │ Cal.com (scheduling)        │            │
│  │  Metabase (analytics) │ Whisper (STT)         │            │
│  │  Kokoro (TTS) │ InvoiceShelf (invoicing)      │            │
│  └──────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

---

## The Five Pillars

### Pillar 1: Encrypted Multi-Tenancy

Every tenant's data is encrypted with a key derived from their password. The platform operator cannot read customer data.

```
Password → Argon2id(password, salt) → KEK (Key Encryption Key)
KEK encrypts → DEK (Data Encryption Key, random 256-bit)
DEK encrypts → Individual database fields (AES-256-GCM)
AAD (Additional Authenticated Data) = tenantId:table:column
```

**Why AAD matters:** Even if an attacker copies encrypted data between tenants or tables, the authentication tag will fail because the context (tenant+table+column) is baked into the ciphertext. You can't move a customer's phone number to a different tenant's record.

**Key rotation:** When a user changes their password, only the KEK changes. The DEK is re-wrapped with the new KEK. No data re-encryption needed. All existing encrypted data remains valid.

**Recovery:** An RSA backup envelope wraps the DEK materials. Recovery requires platform admin action + user identity verification + new password from the user.

**Implementation:**
- `src/crypto/envelope.ts` — Argon2id KEK derivation, AES-256-GCM DEK wrapping
- `src/crypto/field-crypto.ts` — Per-field AES-256-GCM with AAD
- `src/crypto/middleware.ts` — Auto-encrypt on write, auto-decrypt on read
- `src/crypto/tenant-keys.ts` — Provision on registration, unlock on login
- `src/crypto/key-rotation.ts` — Password change without data re-encryption
- `src/crypto/backup.ts` — RSA-OAEP disaster recovery

**PostgreSQL RLS (Row-Level Security):**
```sql
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON products
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
```
Each tenant gets a dedicated PostgreSQL role with `app.tenant_id` baked in. Even raw SQL from the AI sandbox can't cross tenant boundaries.

### Pillar 2: The AI Agent (Hermes + Hermes)

Hermes is the agent framework. It provides: conversation memory, system prompts (SOUL.md), skill selection, tool calling (exec, read, write, web_search), and session management.

**Hermes** (NVIDIA, announced GTC 2026) adds kernel-level sandboxing:
- **Landlock:** Filesystem access control — agent can only read/write allowed paths
- **Seccomp:** System call filtering — agent can't spawn processes, access network
- **Network namespaces:** Agent can only reach allowed endpoints
- **Deny-by-default YAML policies:** Hot-reloadable, per-tenant configurable

The agent sees the world through MCP tools. Each OSS service gets an MCP server that exposes its functionality to the agent. The agent doesn't have raw database access — it calls tools.

```
Agent: "I need to check Jorge's order status"
  → calls get_order(customer_name="Jorge") via MCP
  → MCP server queries PostgreSQL (with RLS enforced)
  → decrypts result with tenant's DEK
  → returns to agent: "Order #1234: 10 bolsas cemento, pending delivery"
```

### Pillar 3: The Data Flywheel (Hermes-RL)

Every conversation is a training opportunity. The system automatically:

1. **Captures** multi-turn conversations as trajectories
2. **Scores** each assistant turn using next-state signals:
   - User says "gracias, perfecto" → reward +1
   - User says "no, está mal" → reward -1
   - User repeats the question → re-query penalty -1
   - User continues normally → neutral 0
3. **Scrubs** PII before entering the training pipeline
4. **Trains** LoRA adapters during off-peak hours (GRPO + OPD)
5. **A/B tests** new adapters: 10% traffic to candidate, compare metrics
6. **Promotes** if 5%+ improvement, rollbacks otherwise

```
More users → More conversations → Better model → Better experience → More users
```

**PII Scrubbing** is domain-specific. For Peru:
- Phone: +51 9XX XXX XXX → [PHONE]
- RUC: 20XXXXXXXXX → [RUC]
- DNI: 8 digits → [DNI]
- Amounts: S/XXX.XX → [AMOUNT]
- Names after context: "Cliente: María" → "Cliente: [CUSTOMER_NAME]"

For health: scrub patient IDs, diagnosis codes, medication names.
For fitness: scrub body measurements, health conditions.

**Hardware scaling:**
- Phase 1 (2× A5000, 48GB): LoRA training on 4B model, serve 27B
- Phase 2 (8× H100): Full Hermes-RL 4-component async loop
- Phase 3 (B200): Continuous online RL, per-vertical adapters

### Pillar 4: OSS-First Integration

**The rule:** If an OSS project with >1000 stars does what you need, use it. Write an MCP server to expose it to the agent. Don't reinvent.

| Need | OSS Solution | MCP Tool |
|------|-------------|----------|
| Billing/Subscriptions | Lago | `create_subscription`, `record_usage`, `generate_invoice` |
| Appointment Scheduling | Cal.com | `book_appointment`, `list_availability`, `cancel_booking` |
| Analytics/BI | Metabase | `get_dashboard`, `run_query`, `get_metrics` |
| Voice Transcription | Whisper (faster-whisper) | `transcribe_audio` |
| Text-to-Speech | Kokoro FastAPI | `synthesize_speech`, `voice_reply` |
| Electronic Invoicing | APISUNAT.pe (Peru) | `emit_boleta`, `emit_factura` |
| Object Storage | MinIO | `upload_file`, `get_file_url` |
| Payment Processing | (country-specific) | `verify_yape_payment`, `confirm_transfer` |

**SSO Integration Pattern:**
Each OSS service gets auto-provisioned accounts per tenant. When a tenant owner accesses Lago or Cal.com, they're transparently logged in via SSO proxy routes (`/api/sso/{lago,calcom,metabase}`). The `tenant_service_accounts` table maps tenantId → external service IDs.

### Pillar 5: Persona Testing

Before any code ships, it must pass persona tests. These are simulated real users with realistic backgrounds, needs, and communication styles.

**How to design personas:**

1. **Research your target market.** Who are the actual users? Age, location, tech literacy, language patterns.
2. **Create 10-20 personas** covering:
   - Happy path (normal orders, inquiries)
   - Edge cases (bulk orders, invoicing with tax IDs)
   - Frustration scenarios (complaints, wrong orders)
   - Vulnerable users (elderly, low literacy)
   - Adversarial (trying to extract other tenant's data)
3. **Each persona sends real messages** to the AI and asserts:
   - Response is in the correct language
   - Response references actual products/services/prices
   - Response doesn't leak cross-tenant data
   - Response handles the persona's specific need
4. **Collect conversations as RL training data** — persona tests double as training data generators

**Example personas for health domain:**
```
María (45, diabetic, Lima) → asks about insulin dosage tracking
Carlos (28, gym rat, Arequipa) → books a nutrition consultation  
Doña Rosa (72, arthritis, Callao) → confused about medication schedule
Dr. García (clinic owner) → checks daily patient summary
Pedro (delivery rider) → picks up lab results for a patient
```

**Example personas for personal training:**
```
Valentina (25, weight loss goal) → asks about meal plan
Diego (19, university athlete) → needs training schedule adjustment
Señora Carmen (60, post-surgery rehab) → worried about exercise intensity
Jorge (35, busy executive) → wants 20-min HIIT sessions
Lucía (30, pregnant) → asks what exercises are safe
```

---

## Security as a Design Pattern

Security isn't a layer you add on top. It's a pattern you follow at every decision point.

### The Security Stack (bottom to top):

```
┌─────────────────────────────────────────┐
│ Application: Input validation, CORS,     │
│ rate limiting, session management        │
├─────────────────────────────────────────┤
│ Agent: Hermes sandbox, deny-by-default │
│ tool policies, MCP access control        │
├─────────────────────────────────────────┤
│ Data: Per-tenant encryption (AES-256-GCM)│
│ AAD binding, password-derived keys       │
├─────────────────────────────────────────┤
│ Database: PostgreSQL RLS, per-tenant      │
│ roles, encrypted columns, audit log      │
├─────────────────────────────────────────┤
│ Infrastructure: Localhost-only DB ports,  │
│ TLS everywhere, secrets in env vars      │
└─────────────────────────────────────────┘
```

### Security Headers (Express middleware):
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; frame-ancestors 'none'
Strict-Transport-Security: max-age=31536000; includeSubDomains
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### Rate Limiting:
- 20 messages/minute per tenant
- 5 concurrent AI jobs per tenant
- Exponential backoff on auth failures

### PII Protection:
- PII scrubbed BEFORE entering RL training pipeline
- Encrypted at rest in the database
- Never logged in plaintext
- Agent responses checked for accidental PII leakage

---

## Adapting to a New Domain

### Step-by-step: Building a Health Clinic Agent

1. **Fork the Yaya Platform repo** (or use it as a template)

2. **Replace domain-specific content:**
   - `agent-workspace/SOUL.md` → Health clinic personality, medical terminology
   - `src/ai/pii-scrubber.ts` → Add HIPAA patterns (patient IDs, diagnosis codes, SSNs)
   - `schema.sql` → Replace products/orders with patients/appointments/prescriptions
   - `src/crypto/middleware.ts` → Update ENCRYPTED_FIELDS for health tables

3. **Swap OSS services for your domain:**
   - Keep: Lago (billing), Cal.com (appointments are even more critical for clinics), Metabase, Whisper
   - Add: OpenEMR or Bahmni (open-source EHR) via MCP
   - Add: FHIR-compliant data export (HL7 standard)
   - Remove: Yape payment validation (replace with your country's payment rails)

4. **Create domain-specific MCP servers:**
   ```
   health-mcp/
   ├── patient-records.ts    → CRUD patients, medical history
   ├── prescriptions.ts      → Generate, renew, check interactions
   ├── lab-results.ts        → Upload, query, notify
   ├── insurance-claims.ts   → Submit, track, appeal
   └── compliance.ts         → HIPAA audit log, consent tracking
   ```

5. **Design your personas** (see Persona Testing section)

6. **Update PII scrubber** for your domain:
   ```typescript
   // Health-specific PII patterns
   const PATIENT_ID_RE = /\bPAT-\d{8}\b/g;        → [PATIENT_ID]
   const SSN_RE = /\b\d{3}-\d{2}-\d{4}\b/g;       → [SSN]
   const DIAGNOSIS_RE = /\b[A-Z]\d{2}\.\d{1,2}\b/g; → [DIAGNOSIS_CODE]
   const MEDICATION_RE = /\b(metformin|insulin|...)\b/gi; → [MEDICATION]
   ```

7. **Update encryption columns:**
   ```typescript
   const ENCRYPTED_FIELDS: Record<string, string[]> = {
     patients: ['name', 'phone', 'ssn', 'address', 'emergency_contact'],
     medical_records: ['diagnosis', 'notes', 'prescriptions'],
     lab_results: ['results', 'notes'],
     insurance_claims: ['member_id', 'diagnosis_codes'],
   };
   ```

8. **Deploy:** `./start.sh` — everything comes up, schemas applied, secrets generated.

### Step-by-step: Building a Personal Training Agent

Same process, different domain objects:

```
Entities: clients, workouts, meal_plans, progress_measurements, sessions
MCP servers: workout-planner, nutrition-tracker, body-metrics, session-scheduler
Encrypted fields: clients.weight, clients.body_fat, clients.health_conditions, clients.goals
PII scrubber: body measurements, health conditions, dietary restrictions
OSS additions: Wger (workout manager, MIT license) via MCP
```

---

## Reference Implementation

### Repository Structure
```
yaya_platform/
├── docker-compose.yml          # Full stack (12 services)
├── start.sh                    # One-command deploy
├── .env.example                # All config documented
├── Caddyfile                   # Reverse proxy
├── autobot/                    # Main application
│   ├── src/
│   │   ├── ai/                 # Hermes bridge, PII scrubber
│   │   ├── auth/               # Better Auth integration
│   │   ├── bot/                # Baileys WhatsApp, message handler
│   │   ├── crypto/             # Encryption (envelope, field, middleware, keys)
│   │   ├── db/                 # PostgreSQL repos (encrypted CRUD)
│   │   ├── queue/              # BullMQ, rate limiter
│   │   ├── rl/                 # Hermes-RL (rollout, training, A/B tests)
│   │   ├── shared/             # Logger, events, types
│   │   └── web/                # Express routes, middleware
│   ├── schema*.sql             # Database schemas (6 files, dependency order)
│   ├── tests/                  # 136+ tests (crypto, RL, security, personas)
│   └── scripts/                # RL training, data generation
├── agent-workspace/            # Hermes agent config
│   ├── SOUL.md                 # Agent personality + domain knowledge
│   └── AGENTS.md               # Agent behavior rules
├── docs/                       # You are here
└── skills/                     # Hermes skills (domain-specific)
```

### Key Files to Modify for Your Domain

| File | What to change | Why |
|------|---------------|-----|
| `agent-workspace/SOUL.md` | Domain personality, terminology, rules | This IS your agent |
| `schema.sql` | Database tables for your domain entities | Your data model |
| `src/crypto/middleware.ts` | ENCRYPTED_FIELDS map | Which columns to encrypt |
| `src/ai/pii-scrubber.ts` | Regex patterns for your domain's PII | Training data safety |
| `tests/persona-live.test.ts` | Your domain's test personas | Quality assurance |
| `docker-compose.yml` | Add/remove OSS services | Your stack |
| `skills/` | Domain-specific Hermes skills | Agent capabilities |

### Test Suite Structure

| Suite | Tests | What it verifies |
|-------|-------|-----------------|
| `crypto.test.ts` | 74 | Encryption round-trips, cross-tenant isolation, key rotation |
| `rl-pipeline.test.ts` | 37 | PII scrubbing, reward scoring, A/B tests, training scheduler |
| `security.test.ts` | 14 | HTTP headers, encryption integration, unicode handling |
| `persona-live.test.ts` | 11 | AI response quality against live LLM |

### docker-compose.yml Services

| Service | Image | Purpose | Port |
|---------|-------|---------|------|
| postgres | postgres:16-alpine | Primary database | 5432 (localhost only) |
| redis | redis:7-alpine | Queue, DEK cache, sessions | 6379 (localhost only) |
| minio | minio/minio | Object storage (media, uploads) | 9000 |
| vllm | vllm/vllm-openai | LLM serving (Qwen3.5-27B) | 8000 |
| whisper | faster-whisper-server | Speech-to-text | 9300 |
| kokoro-tts | kokoro-fastapi | Text-to-speech | 9400 |
| calcom | cal.com | Appointment scheduling | 3002 |
| lago-api | getlago/api | Subscription billing | 3010 |
| lago-worker | getlago/api | Background billing jobs | — |
| lago-front | getlago/front | Billing dashboard | 8080 |
| metabase | metabase/metabase | Business analytics | 3003 |
| backup | postgres:16-alpine | Daily pg_dump at 3am | — |

---

## Final Words

This architecture emerged from building a real product for real users in Peru. Every decision was made under constraints: limited GPU memory, non-technical users, regulatory requirements, and the need to ship fast.

The principles are universal:
- **Encrypt by default.** If you're not encrypting, you're one breach away from disaster.
- **Let the AI learn.** Static models are a dead end.
- **Use what exists.** Your competitive advantage is the domain expertise, not the billing system.
- **Test with personas.** If María can't order her chicken, nothing else matters.
- **One command deploy.** If it's hard to set up, it's hard to maintain.

Build something people actually use. The architecture will follow.

---

*Written by Yaya (AI agent) and Andre The Inventor. March 23, 2026.*
*Yaya Platform — github.com/AndreTregear/yaya_platform*
