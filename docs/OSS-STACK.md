# Open-Source Stack

Every open-source project that powers the Yaya Platform. We stand on the shoulders of giants.

---

## Core Infrastructure

### PostgreSQL 16

**What it does:** Primary database for all platform data — tenants, customers, products, orders, payments, messages, subscriptions, AI conversation history.

**Docker service:** `postgres`
**Port:** 5432
**Connection:** `autobot/src/db/pool.ts` via `DATABASE_URL` env var
**Key usage:**
- Schema-per-tenant isolation (`client_{tenantId}` search_path)
- Shared schemas for tenants, auth, sessions
- Separate databases for Lago (`lago_db`), Cal.com (`calcom_db`), Metabase (`metabase_db`)
- Initialized via `infra/docker/init-db.sql`

**License:** PostgreSQL License (permissive, similar to MIT)
**Docs:** https://www.postgresql.org/docs/16/
**Acknowledgment:** The world's most advanced open source relational database. PostgreSQL powers our entire data layer with rock-solid reliability.

---

### Redis 7

**What it does:** Message queue backend (BullMQ), conversation cache, rate limiting, Lago Sidekiq job processing.

**Docker service:** `redis`
**Port:** 6379
**Connection:** `autobot/src/queue/redis.ts` via `REDIS_URL` env var
**Key usage:**
- BullMQ job queues (AI processing, media, reminders, follow-ups)
- Rate limiting for AI requests per tenant
- Session caching
- Lago background job processing (Redis DB 1)

**License:** BSD 3-Clause (Redis 7 is pre-SSPL)
**Docs:** https://redis.io/docs/
**Acknowledgment:** Redis makes our real-time message processing possible. BullMQ on Redis handles thousands of WhatsApp messages per day with sub-second latency.

---

### MinIO

**What it does:** S3-compatible object storage for media files, voice notes, payment screenshots, invoices, backups, and training data exports.

**Docker service:** `minio`
**Ports:** 9000 (API), 9001 (Console)
**Connection:** `autobot/src/media/s3-client.ts` via `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`
**Key usage:**
- `media-raw` bucket — uploaded files (images, audio, video)
- `media-processed` bucket — transcoded media
- `warehouse-exports` bucket — training data exports
- Presigned URLs for secure temporary access (5-min expiry)
- Also used by Lago for invoice PDF storage

**License:** GNU AGPLv3
**Docs:** https://min.io/docs/minio/linux/index.html
**Acknowledgment:** MinIO gives us enterprise-grade object storage that runs anywhere. Self-hosted S3 compatibility means zero cloud vendor lock-in for media storage.

---

## Business Services

### Lago

**What it does:** Subscription billing, usage metering, invoicing, and dunning for the Yaya Platform's own B2B billing (charging business owners for their Yaya subscriptions).

**Docker services:** `lago-api`, `lago-worker`, `lago-clock`, `lago-front`, `lago-pdf`
**Ports:** 3001 (API), 8080 (Frontend)
**Connection:** `autobot/src/integrations/lago-client.ts` via `LAGO_API_URL`, `LAGO_API_KEY`
**Key API endpoints:**
- `POST /api/v1/customers` — Create billing customer
- `POST /api/v1/subscriptions` — Create subscription
- `GET /api/v1/invoices` — List invoices
- `POST /api/v1/events` — Track usage events
- `DELETE /api/v1/subscriptions/:id` — Terminate subscription

**License:** GNU AGPLv3
**Docs:** https://docs.getlago.com
**Acknowledgment:** Lago handles all our subscription billing complexity — from free tier limits to usage-based pricing. Its open-source model means we can customize billing logic without SaaS constraints.

---

### Cal.com

**What it does:** Appointment scheduling and calendar management for service businesses (salons, clinics, consultants). Handles availability, booking, reminders, and calendar sync.

**Docker service:** `calcom`
**Port:** 3002
**Connection:** `autobot/src/integrations/calcom-client.ts` via `CALCOM_URL`, `CALCOM_API_KEY`
**Key API endpoints:**
- `GET /api/v1/event-types` — List bookable event types
- `GET /api/v1/slots` — Check availability
- `POST /api/v1/bookings` — Create booking
- `PATCH /api/v1/bookings/:id/cancel` — Cancel booking

**License:** GNU AGPLv3 (Cal.com Enterprise features require license)
**Docs:** https://cal.com/docs
**Acknowledgment:** Cal.com provides world-class scheduling infrastructure. Our salon and clinic tenants book appointments through WhatsApp, powered by Cal.com's robust availability engine.

---

### Metabase

**What it does:** Business intelligence dashboards, SQL analytics, and data visualization. Business owners access dashboards via links sent through WhatsApp.

**Docker service:** `metabase`
**Port:** 3003
**Connection:** `autobot/src/integrations/metabase-client.ts` via `METABASE_URL`, `METABASE_API_KEY`
**Key API endpoints:**
- `POST /api/card/:id/query` — Execute a saved question
- `GET /api/dashboard/:id` — Get dashboard
- `GET /api/dashboard/:id/cards` — Get dashboard question results

**License:** GNU AGPLv3
**Docs:** https://www.metabase.com/docs/latest/
**Acknowledgment:** Metabase turns our PostgreSQL data into beautiful dashboards that micro-business owners can actually understand. No BI expertise needed.

---

### InvoiceShelf

**What it does:** Invoice and estimate generation with support for tax compliance. Used for generating detailed invoices, especially for SUNAT (Peru) and DIAN (Colombia) compliance.

**Docker service:** `invoiceshelf`
**Port:** 8090
**Connection:** Via `INVOICESHELF_API_URL` env var
**Key API endpoints:**
- Invoice CRUD
- Estimate generation
- Tax calculation
- PDF export

**License:** GNU AGPLv3
**Docs:** https://invoiceshelf.com/docs
**Acknowledgment:** InvoiceShelf handles our multi-country invoicing needs. Its flexibility lets us support Peru's SUNAT, Colombia's DIAN, Brazil's SEFAZ, and Mexico's SAT from a single system.

---

## AI / ML Layer

### vLLM + Qwen3.5-27B

**What it does:** Local large language model inference. Qwen3.5-27B is the primary text model, served via vLLM's OpenAI-compatible API. Handles all conversational AI — sales, support, business operations.

**Runs on:** GPU host (external to Docker Compose)
**Port:** 8000
**Connection:** `autobot/src/ai/client.ts` via `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL`
**Key API endpoints:**
- `POST /v1/chat/completions` — OpenAI-compatible chat API

**Licenses:**
- vLLM: Apache 2.0
- Qwen3.5-27B: Apache 2.0 (Alibaba Cloud)

**Docs:**
- vLLM: https://docs.vllm.ai
- Qwen: https://qwen.readthedocs.io

**Acknowledgment:** vLLM's PagedAttention makes it possible to serve a 27B parameter model on a single GPU with production throughput. Qwen 3.5 provides exceptional multilingual performance, especially in Spanish — critical for our LATAM market.

---

### Whisper (OpenAI)

**What it does:** Speech-to-text transcription. Converts WhatsApp voice notes to text so the AI can process them. Supports Spanish, Portuguese, and 90+ other languages.

**Runs on:** GPU host (external to Docker Compose)
**Port:** 9100
**Connection:** `autobot/src/ai/client.ts` via `WHISPER_URL`
**Key API endpoints:**
- `POST /asr` — Transcribe audio file

**License:** MIT
**Docs:** https://github.com/openai/whisper
**Acknowledgment:** Whisper makes voice-first interaction possible. In LATAM, many micro-business owners prefer voice notes over typing — Whisper bridges that gap seamlessly.

---

### Kokoro TTS

**What it does:** Text-to-speech synthesis. Generates natural-sounding voice responses sent as WhatsApp voice notes. Supports Spanish and Portuguese voices.

**Runs on:** GPU host (external to Docker Compose)
**Port:** 9200
**Connection:** `autobot/src/ai/client.ts` via `TTS_URL`, `TTS_API_KEY`
**Key API endpoints:**
- `POST /v1/audio/speech` — Generate speech from text

**License:** Apache 2.0
**Docs:** https://github.com/hexgrad/kokoro
**Acknowledgment:** Kokoro's lightweight architecture delivers natural-sounding Spanish TTS on modest GPU hardware. Voice responses make Yaya feel like a real assistant, not a chatbot.

---

## Platform Libraries

### Baileys

**What it does:** WhatsApp Web API client. Connects to WhatsApp without the official Business API, enabling free WhatsApp integration for micro-businesses that can't afford Meta's per-message pricing.

**Used in:** `autobot/src/bot/providers/baileys.ts`
**License:** MIT
**Docs:** https://github.com/WhiskeySockets/Baileys
**Acknowledgment:** Baileys is the backbone of our WhatsApp integration. It enables small businesses to have AI-powered WhatsApp without per-message costs.

---

### Better Auth

**What it does:** Authentication framework for the web dashboard. Handles user registration, login, session management, password hashing, and role-based access control.

**Used in:** `autobot/src/auth/auth.ts`
**License:** MIT
**Docs:** https://www.better-auth.com/docs
**Acknowledgment:** Better Auth provides a clean, TypeScript-first auth experience that just works. Session management, admin roles, and password security out of the box.

---

### BullMQ

**What it does:** Job queue for background processing. Handles AI message processing, media transcoding, scheduled reminders, payment follow-ups, and daily summary generation.

**Used in:** `autobot/src/queue/`
**License:** MIT
**Docs:** https://docs.bullmq.io
**Acknowledgment:** BullMQ handles our message processing pipeline with reliable retries, concurrency control, and scheduled jobs. Essential for handling WhatsApp message bursts.

---

### Pino

**What it does:** High-performance structured JSON logging.

**Used in:** `autobot/src/shared/logger.ts`
**License:** MIT
**Docs:** https://getpino.io
**Acknowledgment:** Pino's low-overhead logging keeps our hot path fast while providing structured logs for debugging.

---

### Zod

**What it does:** TypeScript-first schema validation for API request bodies.

**Used in:** `autobot/src/shared/validation.ts`
**License:** MIT
**Docs:** https://zod.dev
**Acknowledgment:** Zod ensures every API request is validated with type-safe schemas, catching bad input before it reaches business logic.

---

### Caddy

**What it does:** Reverse proxy with automatic HTTPS via Let's Encrypt. Handles TLS termination, HTTP→HTTPS redirect, and proxying to Autobot.

**Docker service:** `caddy`
**Ports:** 80, 443
**Config:** `autobot/Caddyfile`
**License:** Apache 2.0
**Docs:** https://caddyserver.com/docs/
**Acknowledgment:** Caddy makes HTTPS effortless. Zero certificate management — it just works.

---

## Summary Table

| Project | Role | Service | Port | License |
|---------|------|---------|------|---------|
| PostgreSQL 16 | Primary database | `postgres` | 5432 | PostgreSQL |
| Redis 7 | Queues, cache | `redis` | 6379 | BSD 3-Clause |
| MinIO | Object storage | `minio` | 9000/9001 | AGPLv3 |
| Lago | Subscription billing | `lago-api` | 3001/8080 | AGPLv3 |
| Cal.com | Scheduling | `calcom` | 3002 | AGPLv3 |
| Metabase | Analytics/BI | `metabase` | 3003 | AGPLv3 |
| InvoiceShelf | Invoicing | `invoiceshelf` | 8090 | AGPLv3 |
| vLLM | LLM inference | external | 8000 | Apache 2.0 |
| Qwen3.5-27B | Language model | external | — | Apache 2.0 |
| Whisper | Speech-to-text | external | 9100 | MIT |
| Kokoro | Text-to-speech | external | 9200 | Apache 2.0 |
| Baileys | WhatsApp client | in-process | — | MIT |
| Better Auth | Authentication | in-process | — | MIT |
| BullMQ | Job queues | in-process | — | MIT |
| Pino | Logging | in-process | — | MIT |
| Zod | Validation | in-process | — | MIT |
| Caddy | Reverse proxy | `caddy` | 80/443 | Apache 2.0 |

---

*Yaya Platform is built entirely on open-source software. We are grateful to every maintainer and contributor who makes these projects possible. If you use Yaya, consider supporting these upstream projects — they are the foundation everything runs on.*
