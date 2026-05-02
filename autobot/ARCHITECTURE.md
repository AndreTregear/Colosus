# Autobot Architecture

**agente.ceo** — WhatsApp-native AI business automation platform for LATAM SMBs.

Working directory: `/home/yaya/yaya_business/autobot/`

---

## How It Starts

```
src/index.ts          → loads .env, calls startPlatform()
  └─ src/platform.ts  → orchestrates all subsystems in order:
       1. Database migrations (schema.sql + numbered)
       2. Better Auth table migration + admin seed
       3. S3/MinIO bucket creation
       4. Express web server (port 3000)
       5. AI queue worker (BullMQ)
       6. Media queue worker (BullMQ)
       7. Data warehouse partition manager + ETL
       8. Call handler registration
       9. Auto-start all active tenants (WhatsApp workers)
      10. Health check monitor (30s interval)
      11. Schedulers: reminders, payment followup, payment expiration, daily summary, followup
      12. Event listeners (order/payment/appointment notifications)
      13. RL pipeline (A/B testing, rollout collection)
       → returns shutdown() function for graceful exit
```

There's also `src/cli.ts` for single-tenant CLI mode (`autobot start`, `autobot rules`).

---

## Directory Map

```
src/
├── index.ts                 # Entry point — loads env, starts platform
├── platform.ts              # Orchestrator — starts all subsystems
├── config.ts                # All env vars (70+ settings)
├── cli.ts                   # CLI mode (single tenant)
│
├── bot/                     # WhatsApp multi-tenant engine
│   ├── tenant-manager.ts    # Registry of all tenants, start/stop/send
│   ├── worker-bridge.ts     # IPC proxy to worker threads
│   ├── worker.ts            # Worker thread entry (runs Baileys)
│   ├── connection.ts        # Single-tenant connection (CLI mode)
│   ├── handler.ts           # Single-tenant message handler (CLI)
│   ├── rules-engine.ts      # Auto-reply rule matching
│   ├── health-check.ts      # Worker liveness monitor (30s)
│   ├── types.ts             # WorkerEvent, WorkerCommand types
│   └── providers/
│       ├── baileys.ts       # Baileys v7 WhatsApp client wrapper
│       ├── pg-auth-state.ts # Auth state stored in PostgreSQL
│       └── types.ts         # Provider interface
│
├── ai/                      # AI agent layer
│   ├── agents.ts            # Mastra agent definitions + business tools
│   ├── mastra-bridge.ts     # WhatsApp message → Mastra agent bridge
│   ├── task-engine.ts       # Background task queue with SSE
│   ├── client.ts            # Low-level OpenAI-compatible clients
│   ├── business-intelligence.ts  # Analytics insights via AI
│   ├── pii-scrubber.ts      # Redact sensitive data before LLM
│   ├── product-extraction.ts # Image → product matching
│   └── tools/
│       └── yape-tools.ts    # Yape payment check/confirm tools
│
├── auth/
│   └── auth.ts              # Better Auth config (sessions, SSO, admin)
│
├── web/                     # Express API + frontend
│   ├── server.ts            # Express app: CORS, routes, static files
│   ├── middleware/
│   │   ├── session-auth.ts  # requireSession, requireAdmin, requireTenantOwner
│   │   ├── mobile-auth.ts   # JWT auth for mobile app
│   │   ├── device-auth.ts   # Device token auth
│   │   ├── tenant-auth.ts   # Tenant isolation middleware
│   │   ├── auth-utils.ts    # Bearer token extraction
│   │   └── security-headers.ts  # CSP, HSTS, X-Frame-Options
│   ├── routes/              # 30+ route files (see API Surface below)
│   │   ├── core/            # Shared CRUD route factories
│   │   └── handlers/        # Shared handler functions
│   ├── shared/
│   │   └── route-helpers.ts
│   └── public/              # Static frontends (vanilla JS SPAs)
│       ├── index.html       # Landing page (dynamic WhatsApp number)
│       ├── dashboard/       # Merchant dashboard SPA
│       ├── admin/           # Admin console SPA
│       ├── customer/        # Customer portal SPA
│       ├── shared/          # Shared CSS/JS across SPAs
│       └── *.html/css/js    # Landing variants, terms, privacy
│
├── db/                      # Data access layer (34 repos)
│   ├── pool.ts              # PG pool: query(), queryOne(), transaction()
│   ├── base-repository.ts   # Generic CRUD with tenant isolation
│   ├── migrate.ts           # Schema + numbered migration runner
│   └── *-repo.ts            # Domain-specific repositories (see below)
│
├── services/                # Business logic layer
│   ├── index.ts             # Barrel exports
│   ├── order-service.ts     # Order lifecycle
│   ├── payment-service.ts   # Payment processing + Yape
│   ├── catalog-service.ts   # Product catalog
│   ├── cart-service.ts      # Shopping cart
│   ├── subscription-service.ts  # Plan tiers + quotas
│   ├── appointment-service.ts   # Booking + Cal.com sync
│   ├── delivery-service.ts  # Driver assignment + tracking
│   ├── notification-service.ts  # Event → WhatsApp notification
│   └── errors.ts            # ServiceError, NotFoundError
│
├── queue/                   # Async job processing (BullMQ + Redis)
│   ├── ai-queue.ts          # Main AI message processing queue
│   ├── redis.ts             # Redis connection singleton
│   ├── queue-factory.ts     # BullMQ queue creation helper
│   ├── rate-limiter.ts      # Per-tenant concurrency slots
│   ├── reminder-scheduler.ts        # Unpaid order reminders
│   ├── payment-followup-scheduler.ts # Payment follow-up
│   ├── payment-expiration-scheduler.ts  # Expire stale payments
│   ├── daily-summary-scheduler.ts   # Daily business report
│   ├── followup-scheduler.ts        # Customer re-engagement
│   └── scheduler-factory.ts # Scheduler creation helper
│
├── crypto/                  # Envelope encryption (per-tenant)
│   ├── envelope.ts          # AES-256-GCM encrypt/decrypt
│   ├── field-crypto.ts      # Per-field encryption helpers
│   ├── tenant-keys.ts       # Provision + unlock tenant DEKs
│   ├── key-cache.ts         # In-memory DEK cache
│   ├── key-rotation.ts      # Key rotation workflow
│   ├── backup.ts            # Key backup/recovery
│   ├── middleware.ts         # Express middleware for transparent encrypt/decrypt
│   └── index.ts             # Barrel
│
├── media/                   # Object storage + processing
│   ├── s3-client.ts         # S3/MinIO client (3 buckets)
│   ├── storage.ts           # saveMedia() → S3 upload
│   ├── media-queue.ts       # BullMQ: image resize, audio transcode
│   ├── streaming.ts         # Pre-signed URL generation
│   └── processors/
│       ├── ffmpeg.ts        # FFmpeg wrapper
│       ├── audio-processor.ts
│       └── video-processor.ts
│
├── voice/                   # Voice pipeline
│   ├── voice-pipeline.ts    # Audio → Whisper → LLM → Kokoro → Audio
│   └── call-handler.ts      # Reject calls + send voice note greeting
│
├── integrations/            # External service connectors
│   ├── sso-manager.ts       # Lago + Cal.com + Metabase account provisioning
│   ├── lago-client.ts       # Lago billing API
│   ├── calcom-client.ts     # Cal.com scheduling API
│   ├── metabase-client.ts   # Metabase BI API
│   ├── google-calendar.ts   # Google Calendar OAuth (stub)
│   └── tenant-provisioner.ts
│
├── shared/                  # Cross-cutting utilities
│   ├── events.ts            # Typed EventEmitter (appBus)
│   ├── types.ts             # Domain types (Order, Customer, Product, etc.)
│   ├── logger.ts            # Pino structured logger
│   ├── validation.ts        # Zod schemas for API input
│   ├── validate.ts          # Express middleware: validateBody(), getTenantId()
│   ├── message-utils.ts     # WhatsApp message splitting
│   ├── message-templates.ts # Notification templates (Spanish)
│   ├── cache.ts             # In-memory LRU cache
│   └── storage.ts           # Local file storage (uploads dir)
│
├── warehouse/               # Analytics data warehouse
│   ├── partitions.ts        # Monthly table partitions (message_log, events)
│   ├── etl-runner.ts        # Extract-Transform-Load into BI tables
│   └── training-export.ts   # Export data for model training
│
├── rl/                      # Reinforcement learning
│   ├── index.ts             # Initialize RL pipeline
│   ├── rollout-collector.ts # Collect interaction outcomes
│   ├── ab-test.ts           # A/B test different agent behaviors
│   └── training-scheduler.ts
│
└── payments/                # Payment gateway integrations
```

---

## How Everything Connects

### The Message Flow (Incoming WhatsApp → AI Reply)

This is the core loop. Here's exactly what happens when a customer sends "Hola":

```
1. Baileys (in worker thread)
   └─ receives raw WhatsApp message
   └─ posts WorkerEvent{type:'message'} to parent via IPC

2. WorkerBridge (in main thread)
   └─ receives event, calls messageHandler callback

3. TenantManager.handleMessage()
   └─ downloads media (images/audio) → saves to S3
   └─ transcribes audio via Whisper (if voice note)
   └─ enqueues AIJobData to BullMQ 'ai-processing' queue

4. AI Queue Worker (ai-queue.ts)
   └─ checks: is tenant connected? (if not, delay up to 90s)
   └─ logs incoming message to PostgreSQL
   └─ detects: is this the owner? → different prompt
   └─ checks subscription quota (message count)
   └─ checks AI pause status for this contact
   └─ acquires per-tenant concurrency slot

5. Mastra Bridge (mastra-bridge.ts)
   └─ sets tenant context (for tool queries)
   └─ loads business context from DB
   └─ calls whatsappAgent.generate(prompt, {maxSteps: 4})
       └─ Mastra may call tools (businessMetrics, paymentStatus, etc.)
       └─ each tool queries PostgreSQL with tenant_id
   └─ returns reply text

6. Back in AI Queue Worker
   └─ splits reply into ≤4000 char chunks
   └─ sends each chunk via TenantManager.sendMessage()
   └─ logs outgoing message to PostgreSQL
   └─ if voice message: synthesizes reply via Kokoro TTS → sends audio

7. TenantManager.sendMessage()
   └─ WorkerBridge.sendMessage() → IPC to worker thread
   └─ Worker → Baileys.sendText() → WhatsApp
```

### The Web Dashboard Flow

```
Browser → agente.ceo/dashboard
  └─ serves dashboard/index.html (vanilla JS SPA)
  └─ SPA checks /api/auth/get-session (Better Auth cookie)
  └─ if no session: shows login/register screen
  └─ on login: Better Auth sets session cookie

Dashboard Chat:
  POST /api/agente/chat {message}
  └─ requireSession middleware validates cookie
  └─ sets tenant context from user.tenantId
  └─ calls directAgent.stream(message)
  └─ SSE response: token-by-token streaming

Dashboard Voice:
  POST /api/agente/voice (audio blob)
  └─ Whisper STT → text
  └─ directAgent.generate(text) → reply
  └─ Kokoro TTS → audio reply
  └─ returns {text, audioUrl}
```

### The Mobile App Flow

```
Mobile App → POST /api/v1/mobile/auth/register
  └─ creates tenant + mobile user
  └─ returns JWT access token + refresh token

Mobile API calls:
  GET /api/v1/mobile/dashboard     (aggregated stats)
  GET /api/v1/mobile/products      (product CRUD)
  GET /api/v1/mobile/orders        (order management)
  GET /api/v1/mobile/conversations  (WhatsApp message history)
  POST /api/v1/mobile/conversations/:jid/send  (send WhatsApp message)
  GET /api/v1/mobile/whatsapp/qr   (get QR code for connection)
  └─ all authenticated via JWT in Authorization header
  └─ mobile-auth.ts validates token, sets req.tenantId
```

### The Registration Flow

```
POST /api/register {email, password, name, businessName}
  └─ derives slug from businessName (Spanish transliteration)
  └─ creates tenant in DB
  └─ creates Better Auth user linked to tenant
  └─ first-ever user → promoted to admin
  └─ provisions envelope encryption keys
  └─ auto-assigns free plan
  └─ fire-and-forget: creates accounts in Lago, Cal.com, Metabase
```

---

## Database Layer

**PostgreSQL** — single database, all tables tenant-isolated via `tenant_id` FK.

### Connection

```typescript
// src/db/pool.ts
getPool()      → PG Pool (max 20 connections)
query(sql, p)  → pg.QueryResult
queryOne(sql, p) → single row or null
transaction(fn) → auto-commit/rollback
```

### Key Tables

| Table | Purpose |
|-------|---------|
| `user` / `session` / `account` | Better Auth (web login) |
| `tenants` | Business accounts (name, slug, phone, settings) |
| `tenant_auth_creds` / `tenant_auth_keys` | WhatsApp auth state (Baileys) |
| `tenant_sessions` | WhatsApp connection health |
| `mobile_users` | Mobile app accounts (phone + bcrypt password) |
| `message_log` | All WhatsApp messages (in/out, per-tenant) |
| `products` | Product catalog |
| `customers` | Customer records (jid, phone, tags) |
| `orders` / `order_items` | Order management |
| `payments` | Payment records |
| `refunds` | Refund records |
| `appointments` | Booking system |
| `auto_reply_rules` | Rule-based auto-replies |
| `business_context` | Business info for AI context |
| `customer_memories` | AI memory per customer |
| `encryption_keys` | Tenant DEKs (encrypted) |
| `platform_plans` / `tenant_subscriptions` | SaaS billing |
| `subscription_payments` | Subscription payment tracking |
| `yape_notifications` | Yape payment webhook data |
| `devices` | Mobile device tokens |
| `leads` | Sales leads |
| `riders` / `delivery_assignments` | Delivery tracking |
| `media_assets` | Media metadata + processing status |
| `token_usage` | AI token consumption tracking |

### Repository Pattern

34 repo files in `src/db/`. Each exports functions like:
```typescript
// Example: products-repo.ts
getProducts(tenantId, filters) → Product[]
getProductById(tenantId, id) → Product | null
createProduct(tenantId, data) → Product
updateProduct(tenantId, id, data) → Product
deleteProduct(tenantId, id) → void
```

All use parameterized queries (no ORM, no SQL injection).

---

## AI System

### Mastra Framework

Replaced Hermes CLI. Two shared agents defined in `src/ai/agents.ts`:

| Agent | ID | Use Case | System Prompt |
|-------|-----|----------|---------------|
| `directAgent` | `ceo-direct` | Voice mode, dashboard chat | "Asistente de voz del CEO. Respuestas cortas." |
| `whatsappAgent` | `whatsapp-agent` | Customer WhatsApp messages | "Eres el asistente de WhatsApp para un negocio." |

Both agents use the same model: **vLLM** (local Qwen 3.5 35B-A3B on port 8000).

### Business Tools (available to both agents)

| Tool | What It Does |
|------|-------------|
| `business-metrics` | Revenue, orders, payments by period (today/week/month) |
| `customer-lookup` | Search customer by name/phone, returns recent orders |
| `payment-status` | Check pending payments or specific order status |
| `calendar-today` | Today's appointments list |
| `send-message` | Send WhatsApp message to customer by name or phone |
| `check-yape-payment` | Verify if Yape payment was received |
| `confirm-yape-payment` | Mark Yape payment as confirmed |

All tools are tenant-aware: they read `getTenantId()` and query only that tenant's data.

**Key constraint:** System prompts must be short (< 2 sentences) for reliable tool calling with Qwen models. Temperature 0.3.

### Task Engine

In-memory task queue (`src/ai/task-engine.ts`) for long-running background tasks:
- Priority levels: urgent, high, normal, low
- SSE streaming of task events
- Templates: `daily-summary`, `payment-followup`, `market-research`
- Uses `directAgent.generate()` for execution

---

## Queue System (BullMQ + Redis)

| Queue | Purpose | Concurrency |
|-------|---------|-------------|
| `ai-processing` | WhatsApp message → AI response | 10 (configurable) |
| `media-processing` | Image resize, audio transcode | 3 |
| `reminders` | Unpaid order reminders | 1 (cron) |
| `payment-followup` | Payment follow-up messages | 1 (cron) |
| `payment-expiration` | Expire stale payments | 1 (cron) |
| `daily-summary` | Daily business report | 1 (cron per tenant) |
| `followup` | Customer re-engagement | 1 (cron) |

### Per-Tenant Concurrency

`src/queue/rate-limiter.ts` ensures only 1 AI job runs per tenant at a time. Additional jobs get delayed 5s. This prevents expensive concurrent LLM calls for the same business.

---

## Event Bus

`src/shared/events.ts` — typed `EventEmitter` singleton (`appBus`).

31 event types including:
- `qr`, `connection-update` — WhatsApp connection lifecycle
- `message-logged` — message saved to DB
- `order-created`, `order-paid`, `order-delivered` — order lifecycle
- `yape-payment-matched` — Yape payment auto-confirmed
- `ai-job-enqueued`, `ai-job-completed`, `ai-job-failed` — AI processing
- `human-handoff-requested` — AI defers to human
- `daily-summary-ready` — daily report generated

`notification-service.ts` listens to these events and sends WhatsApp notifications.

---

## Authentication

### Three Auth Systems

| System | Method | Routes | Middleware |
|--------|--------|--------|------------|
| **Better Auth** | Session cookie | `/api/auth/*`, dashboard | `requireSession` |
| **Mobile JWT** | Bearer token (HS256) | `/api/v1/mobile/*` | `requireMobileAuth` |
| **Device Token** | Opaque string | `/api/v1/mobile/*` | `requireMobileOrDeviceAuth` |

### Better Auth Features
- Email/password registration + login
- Session expiry: 7 days
- Admin/user roles
- Optional SSO via OIDC (Authentik) — conditional on `OIDC_CLIENT_ID`
- Custom `tenantId` field on user

### Route Protection

```typescript
// Public (no auth)
app.use('/api/register', registerRouter);
app.use('/api/plans', platformPlansRouter);
app.use('/api/v1/yape', yapeRouter);
app.use('/api/v1/mobile/auth', mobileAuthRouter);

// Session required
app.use('/api/agente', requireSession, agenteRouter);
app.use('/api/account', requireSession, accountRouter);

// Admin only
app.use('/api/rules', requireSession, requireAdmin, rulesRouter);
app.use('/api/admin', requireSession, requireAdmin, adminRouter);

// Mobile JWT
router.use(requireMobileOrDeviceAuth);  // in api-mobile.ts
```

---

## Crypto Layer

Per-tenant **envelope encryption** for sensitive data at rest:

```
Registration → provisionTenantKeys(tenantId, password)
  └─ generates random DEK (Data Encryption Key)
  └─ encrypts DEK with password-derived KEK
  └─ stores encrypted DEK in PostgreSQL

Login → unlockTenantKeys(tenantId, password)
  └─ decrypts DEK from DB
  └─ caches plaintext DEK in Redis for session

field-crypto.ts → encrypt/decrypt individual fields
  └─ AES-256-GCM with tenant's DEK
  └─ used for payment details, customer PII
```

---

## Media Pipeline

```
Incoming WhatsApp image/audio/video
  └─ Baileys decrypts → raw buffer
  └─ tenant-manager saves to S3 (media-raw bucket)
  └─ enqueues media-processing job
  └─ worker: resize/transcode → S3 (media-processed bucket)

Dashboard/API media access
  └─ streaming.ts → generates pre-signed S3 URL (5min TTL)
  └─ client fetches directly from S3
```

Three S3 buckets: `media-raw`, `media-processed`, `warehouse-exports`.

---

## Voice Pipeline

```
Voice Note (WhatsApp):
  audio buffer → Whisper STT → text
  text → whatsappAgent.generate() → reply text
  reply text → Kokoro TTS → audio buffer
  audio buffer → send as WhatsApp voice note

Dashboard Voice Mode:
  browser MediaRecorder → POST /api/agente/voice
  server: Whisper STT → directAgent.generate() → Kokoro TTS
  response: {text, audioUrl}
```

---

## External Integrations

| Service | Purpose | Config |
|---------|---------|--------|
| **vLLM** (local) | Qwen 3.5 35B-A3B | `VLLM_API_BASE`, port 8000 |
| **Whisper** (local) | Speech-to-text | `WHISPER_BASE_URL`, port 9300 |
| **Kokoro** (local) | Text-to-speech | `TTS_BASE_URL`, port 9400 |
| **MinIO** (Docker) | Object storage (S3-compatible) | `S3_ENDPOINT`, port 9000 |
| **Redis** (Docker) | BullMQ queues + key cache | `REDIS_URL`, port 6379 |
| **PostgreSQL** (Docker) | Primary database | `DATABASE_URL`, port 5432 |
| **Lago** | Usage-based billing | `LAGO_API_URL` |
| **Cal.com** | Appointment scheduling | `CALCOM_API_URL` |
| **Metabase** | Business intelligence dashboards | `METABASE_API_URL` |
| **Authentik** | OIDC SSO provider | `OIDC_CLIENT_ID` |
| **HPC** (UFL) | 4x B200 GPUs, Qwen 3.5 122B | ports 18080-18083 |
| **DeepSeek** | Cloud AI fallback | `AI_BASE_URL` |

---

## Frontend SPAs

All vanilla JavaScript (no React/Vue/Svelte). Served as static files from `src/web/public/`.

| SPA | Path | Purpose |
|-----|------|---------|
| Landing | `/` | Marketing page, dynamic admin phone in CTA |
| Dashboard | `/dashboard` | Merchant panel: chat, voice, orders, products, payments, analytics |
| Admin | `/admin` | System admin: users, tenants, plans, health |
| Customer | `/customer` | Customer self-service: order tracking, payments |

The dashboard SPA handles its own auth (login/register screens built-in). No server-side rendering.

---

## API Surface Summary

**50+ API endpoints** across 30 route files:

```
Auth:           /api/auth/*           (Better Auth)
Registration:   /api/register         (self-service signup)
SSO:            /api/sso/*            (Lago, Cal.com, Metabase redirects)

CEO Agent:      /api/agente/chat      (streaming AI chat — SSE)
                /api/agente/voice     (STT → LLM → TTS)
                /api/agente/tasks     (background task CRUD)
                /api/agente/events    (SSE task events)

Business:       /api/web/*            (dashboard data)
                /api/rules/*          (auto-reply rules)
                /api/messages/*       (message logs)
                /api/status/*         (connection status)
                /api/qr/*             (WhatsApp QR codes)

Commerce:       /api/web/dashboard/*  (orders, products, customers, payments, settings, refunds)
                /api/leads/*          (lead management)

Subscriptions:  /api/subscription/*   (tenant plan management)
                /api/creator/*        (creator/merchant plans)
                /api/plans/*          (public plan listing)

AI:             /api/merchant-ai/*    (merchant AI endpoints)
                /api/business/*       (business intelligence)
                /api/admin/ai-usage/* (token usage tracking)

Calendar:       /api/calendar/*       (Google Calendar sync)

Payments:       /api/v1/yape/*        (Yape webhooks)

Media:          /api/v1/media/*       (upload/fetch)
                /api/v1/stream/*      (pre-signed URLs)

Encryption:     /api/v1/encryption/*  (key management)
Warehouse:      /api/v1/warehouse/*   (analytics export)

Mobile:         /api/v1/mobile/auth/* (register, login, refresh)
                /api/v1/mobile/*      (full mobile API)
                /api/v1/mobile/agente/* (mobile AI chat)
                /api/v1/mobile/dashboard/* (mobile widgets)
                /api/v1/mobile/events/* (push notifications)

Admin:          /api/admin/*          (user/tenant management)
                /api/admin/plans/*    (plan CRUD)
                /api/internal/*       (dev tools, queue inspection)

Deploy:         /api/v1/darwin/*      (redeploy trigger)
Website:        /api/website/leads/*  (website form submissions)
```

---

## Multi-Tenant Isolation

Every layer enforces tenant boundaries:

- **Database:** All queries include `WHERE tenant_id = $1`
- **WhatsApp:** Separate worker thread per tenant
- **AI:** `setTenantId()` before every agent call, tools read tenant context
- **Auth:** Session → user → tenantId, JWT → tenantId
- **Encryption:** Per-tenant DEKs, never shared
- **Queues:** Per-tenant concurrency slots
- **QR Codes:** Scoped per-tenant in Map (not global)
- **Events:** Include tenantId in all event payloads

---

## Key Dependencies

```json
{
  "@whiskeysockets/baileys": "^7.0.0-rc.9",  // WhatsApp Web client
  "@mastra/core": "^1.22.0",                  // Agentic AI framework
  "@ai-sdk/openai": "^3.0.51",                // OpenAI-compatible SDK
  "ai": "^6.0.149",                           // Vercel AI SDK
  "better-auth": "^1.5.1",                    // Authentication
  "bullmq": "^5.70.1",                        // Job queues
  "express": "^5.2.1",                        // HTTP server
  "pg": "^8.19.0",                            // PostgreSQL
  "ioredis": "^5.10.0",                       // Redis
  "@aws-sdk/client-s3": "^3.1001.0",          // S3/MinIO
  "zod": "^4.3.6",                            // Schema validation
  "jsonwebtoken": "^9.0.3",                   // Mobile JWT
  "bcryptjs": "^3.0.3",                       // Password hashing
  "sharp": "^0.34.5",                         // Image processing
  "langfuse": "^3.38.6"                       // AI observability
}
```

---

## Environment Variables (Key Ones)

```bash
# Core
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
BETTER_AUTH_SECRET=...      # 32+ char secret
BETTER_AUTH_URL=https://agente.ceo
PORT=3000

# AI (local vLLM)
VLLM_API_KEY=...
VLLM_API_BASE=http://localhost:8000/v1
VLLM_MODEL=qwen3.5-35b-a3b
AI_API_KEY=...              # fallback cloud provider

# Voice
WHISPER_BASE_URL=http://localhost:9300/v1
TTS_BASE_URL=http://localhost:9400

# Storage
S3_ENDPOINT=localhost
S3_PORT=9000
S3_ACCESS_KEY=...
S3_SECRET_KEY=...

# Optional Integrations
LAGO_API_URL=http://lago-api:3000
CALCOM_API_URL=http://calcom:3000
METABASE_API_URL=http://metabase:3000
OIDC_CLIENT_ID=...         # enables SSO
```

---

## Running

```bash
# Development
npm run dev          # tsx src/index.ts (with hot reload)

# Production
npm run build        # tsc → dist/
npm start            # node dist/index.js

# CLI mode (single tenant)
npm run cli -- start
npm run cli -- rules list
```

Requires: PostgreSQL, Redis, MinIO running (via Docker Compose or system services).
Optional: vLLM, Whisper, Kokoro for AI features.
