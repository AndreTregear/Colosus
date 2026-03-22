# Contributing to Yaya Platform

## What is Yaya Platform?

Yaya Platform is an AI-powered business operating system for Latin American micro-businesses. It turns WhatsApp — the channel 40M+ small businesses already use daily — into a complete business management tool: sales, inventory, payments, invoicing, scheduling, analytics, and more.

The vision: a bodega owner in Lima, a salon in Bogotá, or a restaurant in Mexico City sends a voice note to their WhatsApp, and Yaya handles the rest — logs the sale, updates inventory, sends the receipt, reminds the customer, and generates the tax invoice.

Everything runs locally on your own infrastructure. No cloud AI — your data stays yours.

## Repository Structure

```
yaya_platform/
├── autobot/                 # The core application — Node.js + TypeScript
│   ├── src/
│   │   ├── index.ts         # Entry point — boots the platform
│   │   ├── platform.ts      # Startup orchestrator — DB, Redis, bot, web server
│   │   ├── config.ts        # Environment-driven configuration
│   │   ├── web/             # Express API + dashboard (port 3000)
│   │   │   ├── server.ts    # Route mounting, middleware, security headers
│   │   │   ├── routes/      # 30 route files grouped by auth type
│   │   │   ├── middleware/   # Auth middleware (session, API key, JWT, device)
│   │   │   └── public/      # Dashboard HTML/JS (admin, customer, merchant)
│   │   ├── bot/             # WhatsApp gateway via Baileys
│   │   │   ├── tenant-manager.ts  # Multi-tenant bot orchestration
│   │   │   ├── worker.ts    # Worker threads for each tenant
│   │   │   ├── handler.ts   # Message routing and processing
│   │   │   └── providers/   # Baileys provider + PG auth state
│   │   ├── ai/              # AI engine — 53 tool files
│   │   │   ├── openclaw-bridge.ts  # OpenClaw API integration
│   │   │   ├── agent.ts     # Main agent orchestration
│   │   │   ├── client.ts    # Multi-model AI clients (text, vision, audio)
│   │   │   ├── system-prompt.ts    # Agent system prompts
│   │   │   └── tools/       # Customer + merchant AI tools
│   │   ├── queue/           # BullMQ job processing + schedulers
│   │   ├── db/              # 28 PostgreSQL repository files + migrations
│   │   ├── services/        # Business logic (subscriptions, payments, orders)
│   │   ├── integrations/    # OSS clients (Lago, Cal.com, Metabase, Google Cal)
│   │   ├── media/           # MinIO/S3 media storage + processing
│   │   ├── warehouse/       # Data warehouse ETL + training data export
│   │   ├── crypto/          # RSA envelope encryption
│   │   ├── auth/            # Better Auth configuration
│   │   └── shared/          # Types, validation, logging, events, cache
│   ├── tests/               # Test files
│   ├── dist/                # Compiled output (git-ignored)
│   └── package.json
├── skills/                  # 38 AI skill definitions (markdown files)
│   └── yaya-*/SKILL.md      # Each skill configures the AI agent's behavior
├── mcp-servers/             # 10 MCP servers — bridge AI to backend services
│   ├── postgres-mcp/        # Direct SQL with guardrails
│   ├── payments-mcp/        # Payment validation + processing
│   ├── invoicing-mcp/       # Electronic invoicing (SUNAT, DIAN)
│   ├── appointments-mcp/    # Cal.com booking bridge
│   ├── lago-mcp/            # Subscription billing bridge
│   ├── crm-mcp/             # Customer relationship management
│   ├── whatsapp-mcp/        # WhatsApp message sending
│   ├── voice-mcp/           # Whisper STT + Kokoro TTS
│   ├── forex-mcp/           # Exchange rates (SBS/BCR)
│   └── erpnext-mcp/         # ERPNext ERP (Phase 2)
├── services/                # Slim Docker wrappers for upstream OSS projects
│   ├── lago/                # Subscription billing
│   ├── calcom/              # Appointment scheduling
│   ├── metabase/            # Business intelligence
│   ├── invoiceshelf/        # Invoice generation
│   ├── vllm/                # Local LLM inference (Qwen3.5-27B)
│   ├── whisper/             # Speech-to-text
│   ├── tts/                 # Text-to-speech (Kokoro)
│   └── ...
├── android/                 # YapeReader — Android payment validator app
├── apps/                    # Standalone micro-apps
│   ├── business-insights/   # BI dashboard
│   └── payment-validator/   # Payment verification tool
├── infra/
│   ├── docker/              # init-db.sql, Dockerfiles
│   ├── nemoclaw/            # AI tenant isolation policies
│   ├── scripts/             # start.sh, stop.sh, backup.sh, deploy, setup
│   └── pilot/               # Pilot testing utilities
├── docs/                    # Extended documentation
├── research/                # Market research, competitive analysis (87 docs)
├── tests/                   # Platform-level test framework + personas
├── docker-compose.prod.yml  # One-command production deployment
├── .env.example             # Environment variable template
└── deploy.sh                # Build → tar → scp → restart script
```

### When to touch each directory

| Directory | When to touch it |
|-----------|-----------------|
| `autobot/src/web/routes/` | Adding/modifying API endpoints |
| `autobot/src/ai/tools/` | Adding AI capabilities (new tools the agent can call) |
| `autobot/src/db/` | New database tables or queries |
| `autobot/src/services/` | Business logic that multiple routes/tools share |
| `autobot/src/integrations/` | Connecting to a new external service |
| `autobot/src/bot/` | WhatsApp message handling changes |
| `autobot/src/queue/` | Background job processing or new schedulers |
| `skills/` | Defining new AI agent behaviors |
| `mcp-servers/` | New bridge between AI and a backend service |
| `infra/` | Deployment, Docker, or infrastructure changes |
| `docs/` | Documentation updates |

## Local Setup

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local autobot development)
- A GPU host running vLLM, Whisper, and Kokoro TTS (or remote endpoints)

### First Run

```bash
# 1. Clone and configure
git clone <repo-url> && cd yaya_platform
cp .env.example .env
# Edit .env — change all "changeme" values, set BETTER_AUTH_SECRET (min 32 chars)

# 2. Start infrastructure services
docker compose -f docker-compose.prod.yml --env-file .env up -d postgres redis minio

# 3. Start business services
docker compose -f docker-compose.prod.yml --env-file .env up -d lago-api lago-worker lago-front calcom metabase invoiceshelf

# 4. Run autobot locally (for development)
cd autobot
npm install
cp ../.env .env   # or symlink
npx tsx src/index.ts

# 5. Or run everything via Docker
docker compose -f docker-compose.prod.yml --env-file .env up -d
```

### Key Ports

| Service | Port | URL |
|---------|------|-----|
| Autobot (API + Dashboard) | 3000 | http://localhost:3000 |
| Lago API | 3001 | http://localhost:3001 |
| Lago Frontend | 8080 | http://localhost:8080 |
| Cal.com | 3002 | http://localhost:3002 |
| Metabase | 3003 | http://localhost:3003 |
| InvoiceShelf | 8090 | http://localhost:8090 |
| PostgreSQL | 5432 | — |
| Redis | 6379 | — |
| MinIO API | 9000 | http://localhost:9000 |
| MinIO Console | 9001 | http://localhost:9001 |
| vLLM (GPU host) | 8000 | http://gpu-host:8000 |
| Whisper (GPU host) | 9100 | http://gpu-host:9100 |
| Kokoro TTS (GPU host) | 9200 | http://gpu-host:9200 |

## How Autobot Works

### Startup Flow

```
index.ts → platform.ts
  ├── connectDatabase()      # PostgreSQL pool + migrations
  ├── connectRedis()         # Redis for BullMQ + caching
  ├── startTenantManager()   # Boot WhatsApp workers per tenant
  ├── startSchedulers()      # Payment follow-ups, reminders, daily summaries
  └── startWebServer()       # Express on port 3000
```

### Request Flow (Web Dashboard)

```
Browser → Express (server.ts)
  → session-auth middleware (Better Auth cookie)
  → route handler (e.g., api-dashboard.ts)
  → service layer (e.g., order-service.ts)
  → database repo (e.g., orders-repo.ts)
  → PostgreSQL (client_{tenantId} schema)
```

### Message Flow (WhatsApp → AI)

```
WhatsApp message → Baileys provider (connection.ts)
  → handler.ts (extract text/media, save to message_log)
  → BullMQ ai-queue (ai-queue.ts)
  → OpenClaw bridge (openclaw-bridge.ts)
  → AI agent processes with tools (agent.ts + tools/)
  → Response sent back via Baileys
  → Message logged to database
```

## Multi-Tenancy

Each business is a **tenant**. Isolation happens at multiple levels:

1. **Database**: PostgreSQL schema-per-tenant (`client_{tenantId}` search_path)
2. **WhatsApp**: Separate worker thread per tenant via `tenant-manager.ts`
3. **AI**: NemoClaw policies enforce `tenant_id` scoping on all queries
4. **Storage**: MinIO paths scoped to `media-raw/{tenantId}/`
5. **API**: Every authenticated request resolves to a `tenantId` via middleware

### Tenant table

The `tenants` table in the `public` schema stores:
- `id` (UUID), `name`, `slug`, `phone`, `api_key` (64-char hex)
- `status` (active/suspended), `settings` (JSONB), `created_at`

### Scoped queries

Every database repository accepts `tenantId` and sets `search_path = client_{tenantId}` before executing queries. This is the core isolation mechanism.

## AI Pipeline

```
WhatsApp message
  → ai-queue.ts (BullMQ job)
  → openclaw-bridge.ts (POST to OpenClaw API)
  → OpenClaw loads skill + MCP servers
  → AI agent calls tools (search products, create orders, etc.)
  → Response text returned
  → Baileys sends reply to WhatsApp
  → Message logged with token usage
```

### Key AI files

- `ai/openclaw-bridge.ts` — HTTP client to OpenClaw API
- `ai/agent.ts` — Agent orchestration, tool registry
- `ai/client.ts` — Multi-model clients (text: DeepSeek, vision: Kimi, audio: Qwen Omni)
- `ai/system-prompt.ts` — Dynamic system prompt generation
- `ai/tools/` — 53 tool implementations (product search, order creation, payment validation, etc.)

## How to Add a New Feature

### Add a new API route

1. Create `autobot/src/web/routes/api-your-feature.ts`
2. Export a function that takes `(router: Router)` and registers routes
3. Mount in `server.ts`:
   ```typescript
   import { registerYourFeatureRoutes } from './routes/api-your-feature.js';
   registerYourFeatureRoutes(tenantRouter); // or adminRouter, mobileRouter, etc.
   ```
4. Use appropriate middleware: `requireSession`, `requireTenantAuth`, `requireMobileAuth`, `requireAdmin`
5. Run `npx tsc --noEmit` to verify

### Add a new AI skill

1. Create `skills/yaya-yourskill/SKILL.md`
2. Define the skill's persona, capabilities, tools, and constraints
3. Reference MCP servers the skill needs
4. OpenClaw will auto-discover the skill on next restart

### Add a new MCP server

1. Create `mcp-servers/yourservice-mcp/`
2. Follow the existing pattern (package.json, src/index.ts, tool definitions)
3. Register in OpenClaw configuration
4. Reference from relevant skills

### Add a new database table

1. Add the migration SQL to `autobot/src/db/migrate.ts`
2. Create a repository file: `autobot/src/db/yourtable-repo.ts`
3. Follow existing pattern: `getTenantPool()` → `SET search_path` → query
4. Add TypeScript types to `autobot/src/shared/types.ts`
5. Add Zod validation to `autobot/src/shared/validation.ts`

### Add a new dashboard page

1. Add HTML to `autobot/src/web/public/dashboard/`
2. Create corresponding API routes
3. Link from the dashboard navigation

## Deployment

### Production deployment flow

```bash
# On dev machine:
cd autobot && npm run build    # TypeScript → dist/
cd .. && bash deploy.sh        # Builds tar, scp to server, restarts

# deploy.sh does:
#   1. npx tsc (compile)
#   2. tar -czf autobot.tar.gz (package)
#   3. scp to production host
#   4. ssh: extract, npm install --production, systemctl restart autobot
```

### Infrastructure

- **Caddy** handles reverse proxy + automatic HTTPS via Let's Encrypt
- **systemd** manages the autobot process
- **Docker Compose** runs all backend services
- GPU services (vLLM, Whisper, Kokoro) run separately on the GPU host

## Testing

### Type checking

```bash
cd autobot && npx tsc --noEmit
```

### Test framework

The `tests/` directory contains:
- `framework/` — Test harness for running conversation simulations
- `personas/` — Simulated customer personas (bodega owner, salon, restaurant, etc.)
- `results/` — PMF evaluation results across 7 rounds

### Running tests

```bash
cd autobot && npm test
```

## Code Conventions

- **TypeScript strict mode** — `strict: true` in tsconfig, no `any` without justification
- **ES Modules** — All imports use `.js` extension (TypeScript ESM convention)
- **Pino logging** — Use `logger.info/warn/error()`, never `console.log`
- **Structured errors** — Custom error classes in `services/errors.ts`
- **Zod validation** — All request bodies validated via Zod schemas
- **Repository pattern** — Database access through `*-repo.ts` files, never raw SQL in routes
- **Tenant scoping** — Every query must include `tenantId` context
- **Environment config** — All config in `config.ts`, never read `process.env` directly elsewhere

### Import conventions

```typescript
// ESM — always use .js extension for local imports
import { config } from '../config.js';
import { logger } from '../shared/logger.js';
import { getTenantId } from '../shared/validate.js';
```

## Do NOT Touch List

| Item | Why |
|------|-----|
| `research/` | 87 market research documents — reference only, not code |
| `tests/results/` | Historical PMF evaluation data — append only |
| `android/` | Standalone Android app (YapeReader) — separate build system |
| `infra/nemoclaw/` | Security policies — changes require security review |
| `autobot/src/auth/auth.ts` | Better Auth core setup — changes break all sessions |
| `docker-compose.prod.yml` service names | Changing names breaks inter-service DNS |
| `.env.example` key names | Changing names breaks existing deployments |

## Further Reading

- [Architecture](docs/ARCHITECTURE.md) — System design and data flow
- [API Reference](docs/API.md) — Full REST API documentation
- [OSS Stack](docs/OSS-STACK.md) — Every open-source project we integrate
- [Skills Guide](docs/SKILLS.md) — The 38 AI skills and how to create new ones
- [Security Model](docs/SECURITY.md) — Auth, encryption, tenant isolation
- [Deployment Guide](docs/deployment.md) — Production deployment details
- [MCP Servers](docs/mcp-servers.md) — How MCP servers work
