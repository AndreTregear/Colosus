# Yaya Platform — Architecture

## Overview

Yaya Platform is a multi-tenant, AI-powered business management system delivered entirely through WhatsApp. A single deployment serves multiple businesses, each isolated in their own database schema, with a shared AI agent that orchestrates open-source backend services via Model Context Protocol (MCP).

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CUSTOMER DEVICES                                 │
│                    WhatsApp (text + voice notes)                          │
└───────────────────────────────┬──────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         AUTOBOT (Node.js)                                │
│                                                                          │
│  ┌──────────────────┐  ┌────────────────┐  ┌────────────────────────┐  │
│  │ WhatsApp Gateway  │  │  Message Queue  │  │    Web Dashboard       │  │
│  │ (Baileys library) │  │  (BullMQ/Redis) │  │    + REST API          │  │
│  │                   │  │                 │  │    (port 3000)         │  │
│  │ • QR auth         │  │ • Concurrency   │  │                        │  │
│  │ • Message receive │  │ • Retry logic   │  │ • Tenant management    │  │
│  │ • Media download  │  │ • Rate limiting │  │ • QR code display      │  │
│  │ • Send responses  │  │                 │  │ • Analytics views      │  │
│  └────────┬─────────┘  └────────┬────────┘  └────────────────────────┘  │
│           │                     │                                        │
│           └─────────┬───────────┘                                        │
│                     ▼                                                    │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                    AI ENGINE                                        │  │
│  │                                                                     │  │
│  │  1. Load tenant config (SOUL.md, active skills)                    │  │
│  │  2. Build prompt with conversation history + MCP tool definitions  │  │
│  │  3. Send to LLM (vLLM / Qwen3.5-27B via OpenAI-compatible API)   │  │
│  │  4. Parse tool calls from LLM response                            │  │
│  │  5. Execute MCP tools → collect results                           │  │
│  │  6. Feed results back to LLM for final response                   │  │
│  │  7. Send response via WhatsApp                                    │  │
│  └──────────────────────────┬─────────────────────────────────────────┘  │
│                              │                                           │
│  ┌──────────────────────────▼─────────────────────────────────────────┐  │
│  │                    MCP SERVER LAYER                                  │  │
│  │                                                                      │  │
│  │  postgres-mcp ──── Safe SQL queries, index tuning                   │  │
│  │  lago-mcp ──────── Subscriptions, invoices, usage events            │  │
│  │  crm-mcp ──────── Contacts, deals, interaction logging             │  │
│  │  payments-mcp ─── Payment proof submission, status checks           │  │
│  │  voice-mcp ────── Whisper transcription + Kokoro TTS                │  │
│  │  whatsapp-mcp ─── Outbound messaging, media sending                │  │
│  │  appointments-mcp Cal.com bookings, slot queries                    │  │
│  │  invoicing-mcp ── Invoice generation, delivery                      │  │
│  │  forex-mcp ────── Currency conversion, exchange rates               │  │
│  │  erpnext-mcp ──── Products, orders, stock (Phase 2)                │  │
│  └──────────────────────────┬───────────────────────────────────────────┘  │
└──────────────────────────────┼──────────────────────────────────────────┘
                               │
            ┌──────────────────┼──────────────────┐
            ▼                  ▼                  ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────────────┐
│  AI Layer (GPU)   │ │   Data Layer     │ │   Business Services      │
│                   │ │                  │ │                          │
│ vLLM              │ │ PostgreSQL 16    │ │ Lago (billing)           │
│  Qwen3.5-27B AWQ  │ │  yaya db        │ │ InvoiceShelf (invoicing) │
│  2x GPU, TP=2     │ │  lago_db        │ │ Cal.com (scheduling)     │
│  32K context      │ │  calcom_db      │ │ Metabase (analytics)     │
│  Tool calling     │ │  metabase_db    │ │ Caddy (reverse proxy)    │
│                   │ │                  │ │                          │
│ Whisper           │ │ Redis 7         │ │ Phase 2:                 │
│  large-v3-turbo   │ │  Job queues     │ │  ERPNext (ERP)           │
│  Spanish, int8    │ │  Conv. cache    │ │  Karrio (shipping)       │
│                   │ │  Sessions       │ │  NeMo Guardrails (safety)│
│ Kokoro TTS        │ │                  │ │                          │
│  82M params       │ │ MinIO           │ │                          │
│  18+ voices       │ │  Media files    │ │                          │
│                   │ │  Invoices       │ │                          │
│                   │ │  Backups        │ │                          │
└──────────────────┘ └──────────────────┘ └──────────────────────────┘
```

## Multi-Tenancy

Yaya runs as a single deployment serving multiple businesses. Each business (tenant) is isolated at the database level using PostgreSQL schemas.

### Schema-per-Tenant Model

```
PostgreSQL (yaya database)
│
├── public/                        # Shared platform tables
│   ├── tenants                    # Tenant registry
│   ├── users                      # Platform users (Better Auth)
│   ├── sessions                   # Auth sessions
│   └── accounts                   # OAuth accounts
│
├── agent/                         # Core agent tables
│   ├── conversations              # All conversations across tenants
│   ├── messages                   # Message history
│   └── payment_validations        # Payment proof records
│
├── client_tienda_maria/           # Tenant: Tienda Maria
│   ├── config                     # Business config, SOUL.md, WhatsApp number
│   ├── products                   # Product catalog
│   ├── customers                  # Customer directory
│   ├── orders                     # Sales orders
│   ├── customer_memories          # AI memory per customer
│   └── conversations              # Tenant-specific conversation data
│
├── client_bodega_juan/            # Tenant: Bodega Juan
│   └── ...                        # Same schema, different data
│
└── ...                            # One schema per business
```

### How Tenant Isolation Works

1. **Registration**: Business owner signs up via web dashboard. A new schema `client_{slug}` is created with all business tables.
2. **WhatsApp binding**: Each tenant connects their own WhatsApp number by scanning a QR code. The Baileys session is stored per-tenant.
3. **Message routing**: When a message arrives, the autobot identifies the tenant by the receiving WhatsApp number, sets the PostgreSQL `search_path` to the tenant's schema, and processes in isolation.
4. **Data isolation**: All SQL queries from MCP servers use the tenant's schema. One tenant's data is never visible to another.
5. **Configuration**: Each tenant has their own SOUL.md (AI personality), active skills, product catalog, payment methods, and business hours.

### Shared Resources

These resources are shared across tenants (cost-efficient, single instance):

- **LLM inference** (vLLM) — Same model, different system prompts per tenant
- **Redis** — Separate key prefixes per tenant (`tenant:{id}:*`)
- **MinIO** — Separate bucket prefixes per tenant (`{tenant_id}/media/`, `{tenant_id}/invoices/`)
- **Lago** — Separate organizations per tenant
- **Business services** — Cal.com, Metabase, InvoiceShelf operate per-tenant via API keys/orgs

## Message Processing Pipeline

### Text Message Flow

```
1. RECEIVE
   Customer sends WhatsApp message
   │
   ├── Baileys WebSocket receives message event
   ├── Extract: sender phone, message text, media attachments
   └── Identify tenant by receiving WhatsApp number

2. QUEUE
   Message enters BullMQ job queue
   │
   ├── Rate limiting check (per-sender, per-tenant)
   ├── Deduplication (message ID)
   └── Job created with: { tenant_id, sender, text, media_urls }

3. PROCESS
   Queue worker picks up the job
   │
   ├── Load tenant config from DB (schema, SOUL.md, skills)
   ├── Load conversation history from DB (last N messages)
   ├── Select active skill based on conversation context
   └── Build prompt:
       ├── System: SOUL.md (tenant personality)
       ├── System: Skill instructions + MCP tool definitions
       ├── History: Previous messages
       └── User: Current message

4. AI INFERENCE
   Prompt sent to vLLM (Qwen3.5-27B)
   │
   ├── LLM processes with tool-calling enabled
   ├── Returns either:
   │   ├── Direct text response → go to step 6
   │   └── Tool call(s) → go to step 5
   └── Reasoning (thinking) tokens stripped from output

5. TOOL EXECUTION
   MCP tools called in sequence
   │
   ├── postgres-mcp: SQL query with tenant schema
   ├── lago-mcp: Billing API call
   ├── payments-mcp: Payment status check
   ├── voice-mcp: Audio transcription/synthesis
   └── Results collected → fed back to LLM for final response

6. RESPOND
   Final response sent to customer
   │
   ├── Format: text, image, document, or voice note
   ├── WhatsApp message sent via Baileys
   ├── Conversation + messages saved to DB
   └── Analytics event logged
```

### Voice Note Flow

```
1. Customer sends voice note (.ogg audio via WhatsApp)
2. Baileys downloads the audio file
3. voice-mcp → Whisper API (POST /transcribe)
   └── Whisper returns Spanish text transcription
4. Transcribed text enters the text message flow (step 3 above)
5. AI generates response text
6. If voice response appropriate:
   └── voice-mcp → Kokoro TTS (POST /api/v1/audio/speech)
       └── Returns MP3 → ffmpeg converts to .ogg Opus
           └── Sent as WhatsApp voice note
```

### Payment Validation Flow

```
1. Customer sends payment screenshot (Yape/Plin receipt)
2. Image stored in MinIO ({tenant_id}/payments/)
3. payment_validation record created (status: pending)
4. Business owner notified via WhatsApp
5. Owner confirms/rejects via:
   ├── WhatsApp reply ("confirma" / "rechaza")
   ├── Web dashboard
   └── Payment Validator mobile app
6. Status updated → customer notified
7. If confirmed → order marked as paid, inventory updated
```

## MCP Server Architecture

Each MCP server is a lightweight process that translates AI tool calls into backend service API calls. They use the Model Context Protocol's stdio transport.

```
┌──────────────────────────────────────────────────────────────┐
│                    AI Engine (Autobot)                         │
│                                                               │
│  LLM Response: {                                             │
│    "tool_calls": [{                                          │
│      "function": "search_products",                          │
│      "arguments": { "query": "cerveza", "limit": 5 }        │
│    }]                                                        │
│  }                                                            │
└──────────────────────┬───────────────────────────────────────┘
                       │ stdio (JSON-RPC)
                       ▼
┌──────────────────────────────────────────────────────────────┐
│                    postgres-mcp                                │
│                                                               │
│  1. Receive tool call: search_products({ query, limit })     │
│  2. Build safe SQL: SELECT * FROM products                   │
│     WHERE name ILIKE '%cerveza%' LIMIT 5                     │
│  3. Set search_path to tenant schema                         │
│  4. Execute against PostgreSQL                                │
│  5. Return structured result to AI Engine                    │
└──────────────────────────────────────────────────────────────┘
```

### MCP Server → Backend Service Mapping

| MCP Server | Transport | Backend | Skills Using It |
|-----------|-----------|---------|----------------|
| `postgres-mcp` | stdio | PostgreSQL | 33 (most critical) |
| `erpnext-mcp` | stdio | ERPNext API | 26 |
| `crm-mcp` | stdio | PostgreSQL (CRM tables) | 22 |
| `whatsapp-mcp` | stdio | Baileys (WhatsApp) | 17 |
| `lago-mcp` | stdio | Lago REST API | 5 |
| `invoicing-mcp` | stdio | InvoiceShelf API | 4 |
| `forex-mcp` | stdio | Exchange rate APIs | 4 |
| `appointments-mcp` | stdio | Cal.com REST API | 2 |
| `payments-mcp` | stdio | PostgreSQL + MinIO | 2 |
| `voice-mcp` | stdio | Whisper + Kokoro APIs | 1 |

## Security Model

### Tenant Isolation

- **Database**: PostgreSQL schema-level isolation. Each query runs with `SET search_path = client_{slug}`. Cross-tenant queries are impossible without explicit schema switching.
- **Storage**: MinIO objects are prefixed by tenant ID. Bucket policies prevent cross-tenant access.
- **Redis**: Keys are prefixed with `tenant:{id}:`. No key collisions between tenants.
- **WhatsApp sessions**: Each tenant's Baileys auth state is stored separately and encrypted.

### Data Privacy

- **Local inference**: All AI processing happens on-premise. No customer data is sent to external AI APIs.
- **No cloud dependencies**: PostgreSQL, Redis, MinIO, vLLM, Whisper, Kokoro all run locally.
- **Encryption at rest**: Database volumes can be encrypted at the filesystem level.
- **Auth**: Better Auth handles user authentication with bcrypt password hashing and session tokens.

### Network Security

```
Internet ──► Caddy (443) ──► autobot (3000)
                                │
                    ┌───────────┼───────────┐
                    ▼           ▼           ▼
               PostgreSQL    Redis      MinIO
               (5432)       (6379)     (9000)
                    ▲           ▲           ▲
                    └───────────┼───────────┘
                                │
              Lago ─────────────┤
              Cal.com ──────────┤
              Metabase ─────────┤
              InvoiceShelf ─────┘

All internal services communicate on the yaya-net Docker bridge network.
Only ports 80/443 (Caddy) are exposed to the internet.
Service ports (5432, 6379, etc.) are optionally exposed for admin access.
```

## Deployment Model

### Single docker-compose (Production)

```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d
```

This brings up:
- **Core**: PostgreSQL, Redis, MinIO
- **App**: Autobot (AI agent + web dashboard), Caddy (TLS)
- **Business**: Lago (billing), InvoiceShelf, Cal.com, Metabase
- **MCP**: postgres-mcp

### GPU Services (Separate Host)

GPU-intensive services run on a dedicated machine (or the same machine with NVIDIA GPUs):

```bash
# On GPU host (e.g., c.yaya.sh with 2x A100)
# vLLM, Whisper, Kokoro TTS run independently
# Autobot connects via AI_BASE_URL, WHISPER_URL, TTS_URL env vars
```

These are external to the main docker-compose because:
1. They require NVIDIA GPU runtime and specific drivers
2. They can serve multiple platform instances
3. They have different scaling characteristics (GPU-bound vs CPU-bound)
4. Model downloads and GPU memory management need manual oversight

### Resource Requirements

| Component | RAM | CPU | GPU | Disk |
|-----------|-----|-----|-----|------|
| PostgreSQL | 2 GB | 2 cores | — | 50 GB+ |
| Redis | 512 MB | 1 core | — | 1 GB |
| MinIO | 512 MB | 1 core | — | 100 GB+ |
| Autobot | 1 GB | 2 cores | — | 1 GB |
| Lago (api+worker+clock) | 2 GB | 2 cores | — | 1 GB |
| Cal.com | 1 GB | 1 core | — | 1 GB |
| Metabase | 2 GB | 2 cores | — | 1 GB |
| InvoiceShelf | 512 MB | 1 core | — | 1 GB |
| vLLM (Qwen3.5-27B) | 32 GB | 4 cores | 2x 24GB+ | 30 GB |
| Whisper | 4 GB | 2 cores | 1x 8GB+ | 5 GB |
| Kokoro TTS | 2 GB | 1 core | 1x 4GB+ | 2 GB |
| **Total (no GPU)** | **~10 GB** | **12 cores** | — | **~160 GB** |
| **Total (with GPU)** | **~48 GB** | **16 cores** | **2x 24GB** | **200 GB** |

## Port Map

| Port | Service | Protocol | Exposed |
|------|---------|----------|---------|
| 80 | Caddy (HTTP→HTTPS redirect) | HTTP | Public |
| 443 | Caddy (reverse proxy, yaya.sh + cx.yaya.sh) | HTTPS | Public |
| 3000 | Autobot (unified: landing + dashboard + API + WhatsApp) | HTTP | Internal |
| 3001 | Lago API | HTTP | Internal |
| 3002 | Cal.com | HTTP | Internal |
| 3003 | Metabase | HTTP | Internal |
| 5432 | PostgreSQL | TCP | Internal* |
| 6379 | Redis | TCP | Internal* |
| 8080 | Lago Frontend | HTTP | Internal |
| 8090 | InvoiceShelf | HTTP | Internal |
| 9000 | MinIO API | HTTP | Internal* |
| 9001 | MinIO Console | HTTP | Internal* |
| 8000 | vLLM (GPU host) | HTTP | GPU host |
| 9100 | Whisper (GPU host) | HTTP | GPU host |
| 9200 | Kokoro TTS (GPU host) | HTTP | GPU host |

*\* Optionally exposed for admin/debug access*

## Database Schema

### init-db.sql (runs on first boot)

The initialization script creates per-service databases and roles:

```sql
-- Main yaya database (created by POSTGRES_DB env var)
-- Extensions: uuid-ossp, pgcrypto, pg_trgm

-- lago_db: Lago billing service data
-- calcom_db: Cal.com scheduling data
-- metabase_db: Metabase internal metadata
```

### Autobot Schemas (applied by the app on startup)

```
schema.sql                    # Core tables: tenants, products, customers, orders
schema-customer-memories.sql  # AI memory per customer (preferences, history)
schema-subscriptions.sql      # Subscription/plan management
schema-warehouse.sql          # Warehouse/inventory tracking
```

## Unified Platform

Autobot is the single application that serves everything. The previous `yaya-api` dashboard has been merged into Autobot.

### What Autobot Serves

| Route | What | Auth |
|-------|------|------|
| `/` | Landing page (marketing site) | Public |
| `/dashboard` | Merchant dashboard (SPA) | Session (Better Auth) |
| `/admin` | Platform admin panel | Session + Admin role |
| `/customer` | Customer portal | Session + Tenant link |
| `/api/auth/*` | Authentication (Better Auth) | Public |
| `/api/web/*` | Dashboard API (CRUD, analytics) | Tenant auth |
| `/api/merchant-ai/chat` | AI chat (dashboard + mobile) | Tenant or mobile auth |
| `/api/v1/mobile/*` | Android app API | Mobile auth |
| `/api/business/*` | Business intelligence | Session |

### Onboarding Flow

```
1. User visits yaya.sh → landing page
2. Clicks "Registrarse" → /api/register creates user + tenant
3. Better Auth session established (cookie-based)
4. Redirected to /dashboard → merchant SPA loads
5. Navigate to "Agente Chat" → /api/qr generates WhatsApp QR
6. User scans QR with WhatsApp → Baileys connection established
7. AI (via Hermes) auto-configures business:
   └── Asks about products, pricing, hours, payment methods
8. Customers message the WhatsApp number
9. AI handles conversations, owner monitors via dashboard
```

## Hermes Tenant Isolation

Hermes enforces tenant data isolation within Hermes. Each tenant's AI agent is sandboxed to only access their own data.

### Policy Rules (infra/hermes/tenant-policy.yaml)

- **enforce-tenant-scope**: All database queries must include `tenant_id` matching the request context
- **restrict-file-access**: S3 access restricted to `media-raw/{tenantId}/` prefix
- **block-cross-tenant**: Deny queries without `tenant_id` filter
- **enforce-search-path**: PostgreSQL queries must set `search_path` to tenant schema
- **block-dangerous-sql**: Prevent `DROP`, `TRUNCATE`, `ALTER` operations
- **pii-guard**: Strip credit card numbers, DNI, RUC from AI responses
- **tenant-rate-limit**: 30 req/min, 500 req/hour, 3 concurrent per tenant

### How It Works

```
Dashboard/WhatsApp → Autobot → Hermes API
                                    │
                              Hermes checks:
                              ├── Is tenant_id in every query?
                              ├── Is search_path set correctly?
                              ├── Any cross-tenant data access?
                              ├── Any dangerous SQL?
                              └── PII in response?
                                    │
                              MCP Server executes
                                    │
                              Response filtered → User
```

## Hermes Integration

Autobot delegates all AI processing to Hermes, an external agent framework accessed via HTTP API.

### How It Works

1. **Message arrives** → BullMQ worker picks up the job
2. **Bridge call** → `hermes-bridge.ts` sends a POST to `${HERMES_API_URL}/chat` with the message text and tenant context (tenantId, channel, contactJid, isOwner, imageUrl)
3. **Hermes processes** → selects appropriate skill, builds prompt, calls LLM, executes MCP tools
4. **Response returns** → streamed via SSE (or JSON fallback) back to the bridge
5. **Bridge forwards** → chunks streamed to WhatsApp via Baileys

### Per-Tenant Context Injection

Every request to Hermes includes tenant context as metadata:

```json
{
  "message": "quiero 2 cervezas",
  "context": {
    "tenantId": "uuid",
    "channel": "whatsapp",
    "contactJid": "51999888777@s.whatsapp.net",
    "isOwner": false,
    "imageUrl": "s3://media-raw/tenant/image.jpg"
  }
}
```

Hermes uses this context to:
- Set the PostgreSQL `search_path` to the tenant's schema (via postgres-mcp)
- Load the tenant's SOUL.md and active skills
- Determine whether to use owner-mode or customer-mode skills

### Skill Selection and Routing

Hermes maintains a library of 38 business skills (markdown files). Each skill defines:
- When it should activate (trigger conditions)
- What MCP tools it needs
- System prompt instructions for the LLM

Skill selection happens inside Hermes based on conversation context — Autobot does not participate in routing decisions.

### MCP Server Lifecycle

MCP servers are managed by Hermes, not Autobot. Each server:
- Communicates via stdio (JSON-RPC)
- Has access to tenant-scoped resources (database schema, API keys)
- Is stateless per request

### Adding New Capabilities

To add a new business capability:
1. Write a skill file (markdown) defining the behavior
2. Configure the MCP server(s) it needs in Hermes
3. No code changes in Autobot required

This architecture means the AI logic is entirely managed through skills and MCP configs — no custom tool code in Autobot.

## Technology Decisions

### Why Qwen3.5-27B?
- Best open-weight model at this size for tool-calling
- Native `qwen3_coder` tool-call parser in vLLM
- Strong Spanish language performance
- Fits on 2x consumer GPUs (RTX 4090) with AWQ quantization

### Why Baileys (not WhatsApp Business API)?
- Zero cost (no per-message fees)
- No Meta approval process needed
- Direct WebSocket connection
- Full feature access (voice notes, reactions, status)
- Tradeoff: unofficial, can get blocked at scale

### Why MCP (not direct API calls)?
- Standardized tool interface for the LLM
- Safety layer between AI and data (query validation, rate limits)
- Decoupled: swap backend services without changing AI prompts
- Auditable: every tool call is logged

### Why schema-per-tenant (not DB-per-tenant)?
- Simpler operations: one PostgreSQL instance, one backup job
- Shared connection pool (critical at scale)
- Easy cross-tenant analytics for platform operators
- Tradeoff: slightly weaker isolation vs separate databases
