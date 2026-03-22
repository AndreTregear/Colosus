# Autobot

Multi-tenant WhatsApp AI business management platform. Each tenant gets an isolated WhatsApp session, product catalog, order management, payments, and an AI agent powered by [OpenClaw](https://github.com/openclaw) — a skill-based agent framework with MCP server integration.

Built with TypeScript, Baileys, Express, PostgreSQL, Redis, and BullMQ.

## How It Works

```
WhatsApp → Autobot (Gateway) → OpenClaw (AI Agent) → MCP Servers → Backend Services
```

- **Autobot** is the multi-tenant WhatsApp gateway + web dashboard. It handles message routing, tenant isolation, queue management, and WhatsApp sessions via Baileys.
- **OpenClaw** is the AI agent brain with 38 business skills. It handles conversation memory, skill selection, LLM inference, and tool execution.
- **MCP servers** bridge OpenClaw to backend services: Lago (billing), Cal.com (scheduling), InvoiceShelf (invoicing), Metabase (analytics), PostgreSQL (data).
- New capabilities are added by writing a skill (markdown file) and configuring an MCP server — no custom tool code needed.

Every incoming WhatsApp message (private chats only — groups are skipped) is routed through OpenClaw. The agent:

- Knows the tenant's full product catalog (names, prices, stock, categories)
- Answers customer questions about products, pricing, and availability
- Collects customer info (name, location, address) naturally in conversation
- Processes WhatsApp location pins and saves coordinates to the customer profile
- Creates orders, calculates totals, and decrements stock atomically
- Sends payment instructions with the tenant's configured account
- Tracks order lifecycle: pending → payment_requested → paid → preparing → shipped → delivered

---

## Architecture

```
                    ┌─────────────────────────────────────────────┐
                    │           Autobot (Node.js)                  │
                    │                                             │
                    │  ┌─────────────┐    ┌───────────────────┐   │
                    │  │  Express    │    │  Tenant Manager   │   │
                    │  │  API Server │    │  (orchestrates    │   │
                    │  │  :3000      │    │   all workers)    │   │
                    │  └─────────────┘    └────────┬──────────┘   │
                    │                              │              │
                    │         ┌─────────────┬──────┴──────┐       │
                    │         │             │             │       │
                    │    ┌────▼────┐  ┌─────▼───┐  ┌─────▼───┐   │
                    │    │Worker A │  │Worker B │  │Worker N │   │
                    │    │(thread) │  │(thread) │  │(thread) │   │
                    │    │Baileys  │  │Baileys  │  │Baileys  │   │
                    │    └────┬────┘  └─────┬───┘  └─────┬───┘   │
                    │         │             │            │        │
                    └─────────┼─────────────┼────────────┼────────┘
                              │             │            │
                         WhatsApp      WhatsApp     WhatsApp
                         Session A     Session B    Session N

                    ┌─────────────────────────────────────────────┐
                    │           OpenClaw (AI Agent)                 │
                    │                                             │
                    │  Skills (38 markdown files)                 │
                    │  MCP Servers (postgres, lago, cal.com, ...) │
                    │  Conversation Memory                        │
                    │  LLM Inference (vLLM / Qwen3.5-27B)        │
                    └─────────────────────────────────────────────┘
```

### Message Flow

```
WhatsApp message arrives (private chat)
  │
  ▼
Worker Thread (Baileys) ─── parses message, posts WorkerEvent to main thread
  │
  ▼
Handler
  ├── fromMe or status@broadcast? → ignore
  ├── Location message? → save coords to customer profile, format as text
  ├── Log incoming message to DB
  ├── Auto-reply disabled? → stop
  ├── Per-JID cooldown (5s)? → stop
  ├── Group message? → stop
  ├── ai_enabled = 0? → stop
  ├── Per-tenant rate limit exceeded (Redis)? → stop
  └── Enqueue AI job (BullMQ)
                │
                ▼
         BullMQ Worker
           ├── Tenant offline? → delay job (up to 3x, 30s each)
           ├── Per-tenant concurrency slot available? → proceed / delay
           ├── POST to OpenClaw API with tenant context
           ├── Stream response chunks to WhatsApp
           ├── Send product images after stream completes
           ├── Send reply chunks via WhatsApp (split at 4000 chars)
           └── Log outgoing message
```

### Worker Thread Isolation

Each tenant runs a dedicated `worker_threads.Worker` with its own Baileys instance and database connection pool. Communication between main thread and workers uses structured message passing (`WorkerCommand` / `WorkerEvent`). This ensures:

- A crash in one tenant's WhatsApp session doesn't affect others
- CPU-intensive operations (crypto for Baileys) run in parallel
- Memory isolation between tenants

Workers send heartbeats every 10 seconds. The main thread considers a worker dead if no heartbeat arrives within 30 seconds.

### Reconnection Strategy

Workers use exponential backoff for reconnection: 2s base delay, 2x multiplier, 5-minute max, +/-20% jitter, up to 10 attempts before giving up. A health check service (30s interval) monitors worker heartbeats and respawns dead workers up to 3 times.

---

## Prerequisites

- Node.js 22+
- PostgreSQL 16+
- Redis 7+
- [claude-code-api](https://github.com/codingworkflow/claude-code-api) running locally

## Quick Start

### With Docker (recommended)

```bash
# Clone and configure
cp .env.example .env

# Start PostgreSQL + Redis + app
docker compose up -d

# Start claude-code-api separately (see its README)
```

**Admin Access (Demo)**

The app automatically creates an admin user on first startup using credentials from your `.env` file (defaults):
- **URL:** http://localhost:3000/admin
- **Email:** `admin@example.com`
- **Password:** `changeme`

You can change these defaults by editing the `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_NAME` variables in your `.env` file before starting the app.

### Without Docker

```bash
# Install dependencies
npm install

# Copy and edit environment config
cp .env.example .env

# Ensure PostgreSQL and Redis are running
# (edit DATABASE_URL and REDIS_URL in .env if needed)

# Run in development mode
npm run dev
```

On first run, create a tenant and start its session:

```bash
# Create a tenant
curl -X POST http://localhost:3000/api/tenants \
  -H "Content-Type: application/json" \
  -d '{"name": "My Business", "slug": "my-business"}'

# Start its WhatsApp session (use the tenant ID from the response)
curl -X POST http://localhost:3000/api/tenants/{id}/start

# Get QR code to scan
curl http://localhost:3000/api/tenants/{id}/qr
```

---

## Configuration

### Environment Variables

```bash
PORT=3000                                    # Web server port

# Database
DATABASE_URL=postgresql://autobot:autobot@localhost:5432/autobot

# Redis (queues + rate limiting)
REDIS_URL=redis://localhost:6379

# Messaging provider
MESSAGING_PROVIDER=baileys                   # Only 'baileys' supported currently

# AI (claude-code-api)
AI_BASE_URL=http://localhost:8001/v1         # claude-code-api endpoint
AI_MODEL=claude-sonnet-4-5-20250929          # Model name
AI_MAX_TOKENS=1024                           # Max tokens per AI response

# Queue
QUEUE_CONCURRENCY=10                         # Max parallel AI jobs
QUEUE_MAX_RETRIES=3                          # Retry attempts before DLQ
QUEUE_RETRY_DELAY_MS=5000                    # Initial retry delay (exponential)

# Business defaults (overridable per-tenant via settings API)
BUSINESS_NAME=Mi Negocio
YAPE_NUMBER=938438401
YAPE_NAME=Juan Perez
BUSINESS_CURRENCY=PEN
```

### Per-Tenant Settings

Stored in the `settings` table and configurable via `PUT /api/settings/:key`:

| Key | Default | Description |
|-----|---------|-------------|
| `ai_enabled` | `1` | Enable/disable AI replies (`0` or `1`) |
| `system_prompt` | built-in | Custom AI behavior instructions |
| `rate_limit_per_minute` | `60` | Max AI messages per minute for this tenant |
| `ai_concurrency` | `3` | Max parallel AI jobs for this tenant |
| `yape_number` | from env | Yape account number |
| `yape_name` | from env | Name on Yape account |
| `currency` | `PEN` | Currency code |

---

## API Reference

All tenant-scoped routes require authentication via `X-API-Key` header or `Authorization: Bearer {key}`. The API key is auto-generated when creating a tenant.

### Tenants (admin, no auth)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/tenants` | Create tenant (returns API key) |
| `GET` | `/api/tenants` | List all active tenants |
| `GET` | `/api/tenants/:id` | Get tenant details |
| `PATCH` | `/api/tenants/:id` | Update tenant name/settings |
| `DELETE` | `/api/tenants/:id` | Soft-delete tenant |
| `POST` | `/api/tenants/:id/start` | Start WhatsApp session |
| `POST` | `/api/tenants/:id/stop` | Stop WhatsApp session |
| `POST` | `/api/tenants/:id/reset` | Clear auth state and restart (re-scan QR) |
| `GET` | `/api/tenants/:id/status` | Connection status, uptime, message count |
| `GET` | `/api/tenants/:id/qr` | QR code status + data URL |

### Queue Monitoring (admin, no auth)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/queue/stats` | Global: waiting, active, completed, failed, delayed |
| `GET` | `/api/queue/stats/:tenantId` | Per-tenant queue depth + rate limit usage |
| `GET` | `/api/queue/failed` | Paginated dead-letter queue (`?start=0&limit=20`) |
| `POST` | `/api/queue/failed/:jobId/retry` | Retry a failed job |
| `DELETE` | `/api/queue/failed/:jobId` | Remove a failed job |
| `GET` | `/api/queue/health` | Redis connection + queue health |

### Products (tenant-scoped)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/products` | List products (`?search=...`, `?category=...`) |
| `GET` | `/api/products/categories` | List all categories |
| `GET` | `/api/products/:id` | Get product details |
| `POST` | `/api/products` | Create product |
| `PUT` | `/api/products/:id` | Update product |
| `DELETE` | `/api/products/:id` | Delete product |

### Orders (tenant-scoped)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/orders` | List orders (`?status=...`, `?limit=...`, `?offset=...`) |
| `GET` | `/api/orders/:id` | Get order with items and customer |
| `PUT` | `/api/orders/:id/status` | Update order status |

### Payments (tenant-scoped)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/payments/pending` | List pending payments with customer info |
| `POST` | `/api/payments/:id/confirm` | Confirm payment (optional `reference`) |
| `POST` | `/api/payments/:id/reject` | Reject payment |

### Other (tenant-scoped)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/rules` | List auto-reply rules |
| `POST` | `/api/rules` | Create rule (pattern, matchType, reply, scope, priority) |
| `PUT` | `/api/rules/:id` | Update rule |
| `DELETE` | `/api/rules/:id` | Delete rule |
| `GET` | `/api/messages` | Paginated message log (`?limit=...`, `?jid=...`) |
| `GET` | `/api/customers` | List customers |
| `GET` | `/api/customers/:id` | Customer details |
| `GET` | `/api/settings` | All settings as key-value |
| `PUT` | `/api/settings/:key` | Set a setting value |
| `GET` | `/api/status` | Bot status (connection, autoReply, counts) |
| `POST` | `/api/status/toggle-autoreply` | Toggle AI auto-reply |
| `GET` | `/api/qr` | QR code for this tenant |

---

## Database Schema

PostgreSQL with 14 tables across 2 migrations. All tenant-owned tables use `tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE`.

```
tenants                 -- Core tenant record (name, slug, api_key, status, settings JSONB)
+-- tenant_auth_creds   -- Baileys auth credentials (1 row per tenant)
+-- tenant_auth_keys    -- Baileys signal keys (pre-keys, sessions, sender-keys)
+-- tenant_sessions     -- Connection health (status, reconnect attempts, errors)
+-- rules               -- Auto-reply rules (pattern, match_type, reply, scope, priority)
+-- message_log         -- All messages (incoming/outgoing, JID, timestamp)
+-- products            -- Product catalog (name, price, category, product_type, stock, active)
+-- customers           -- Customer profiles (JID, name, phone, location, coordinates, address)
|   +-- orders          -- Orders (status, total, delivery_type, notes)
|       +-- order_items -- Line items (product, quantity, unit_price snapshot)
|       +-- payments    -- Payment records (method, amount, status, reference)
+-- conversations       -- AI conversation history (JSONB, auto-cleaned after 24h)
+-- settings            -- Key-value settings (ai_enabled, system_prompt, rate_limit, etc.)
```

---

## Queue System

AI message processing uses BullMQ backed by Redis.

| Setting | Default | Description |
|---------|---------|-------------|
| Concurrency | 10 | Parallel AI jobs across all tenants |
| Per-tenant concurrency | 3 | Max parallel AI jobs per tenant (configurable via `ai_concurrency` setting) |
| Max retries | 3 | Exponential backoff (5s, 10s, 20s) |
| Completed retention | 1,000 | Last N completed jobs kept |
| Failed retention | 5,000 | Last N failed jobs kept (DLQ) |

### Connection-Aware Routing

Before processing an AI job, the queue worker checks if the tenant's WhatsApp session is alive. If offline, the job is delayed (30s, up to 3 times) rather than wasting an AI call that can't be delivered.

### Rate Limiting

Per-tenant sliding window implemented via Redis sorted sets and an atomic Lua script. Default: 60 messages per minute per tenant. Configurable per-tenant via the `rate_limit_per_minute` setting.

A separate per-JID cooldown (5 seconds, in-memory, cleaned every 5 minutes) prevents the bot from replying too rapidly to the same contact.

### System Prompt Caching

The catalog portion of the AI system prompt (products, categories, payment config) is cached in Redis with a 60-second TTL. Customer-specific context (name, location, pending orders) is always fetched fresh. This eliminates ~80% of database queries under load.

---

## CLI

```bash
# Start server
autobot start                            # Bot + dashboard on port 3000
autobot start -p 8080                    # Custom port

# Manage tenants
autobot tenants list                     # List all tenants
autobot tenants create -n "Name" -s "slug"  # Create a new tenant

# View logs
autobot logs -t <tenantId>               # Last 20 messages
autobot logs -t <tenantId> -n 100        # Last 100 messages
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with tsx (development) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled app from `dist/` |
| `npm test` | Run tests (requires PostgreSQL) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run cli` | Run CLI tool directly |

---

## Testing

Tests require a running PostgreSQL instance. They run sequentially (no file parallelism) with a global setup that runs migrations once.

```bash
# Start PostgreSQL
docker compose up -d postgres

# Run tests
npm test
```

Current test coverage:
- **tenants-repo** (8 tests): CRUD, API key auth, soft-delete, slug uniqueness
- **repos** (7 tests): Tenant isolation for products, customers, settings, messages; order creation with stock decrement
- **api-tenants** (3 tests): API key authentication, key uniqueness

---

## Payment Flow

1. Customer orders via WhatsApp conversation with the AI
2. AI creates the order and sends Yape payment instructions (tenant's configured number + name + amount)
3. Customer pays via Yape
4. Admin confirms payment from the dashboard or API (`POST /api/payments/:id/confirm`)
5. Order status moves to "paid" and continues through fulfillment

---

## Startup Sequence

```
1. initDb()                          Connect to PostgreSQL, run pending migrations
2. createWebServer(PORT)             Start Express API on configured port
3. startAIWorker()                   Start BullMQ worker for AI job processing
4. autoStartTenants()                Spawn worker threads for all active tenants
5. startHealthCheck()                Monitor worker heartbeats (30s interval)
6. startConversationCleanup()        Clean stale AI conversations (1h interval)
7. startCooldownCleanup()            Purge expired JID cooldown entries (5m interval)
```

Graceful shutdown (SIGINT/SIGTERM): stop health check, stop cleanup timers, drain AI queue, stop all worker threads, close DB pool, close Redis.

---

## Project Structure

```
src/
+-- ai/                    # AI agent system
|   +-- agent.ts           #   Orchestrates Claude calls, parses actions, follow-up calls
|   +-- actions.ts         #   Executes AI actions (create_order, save_customer, etc.)
|   +-- system-prompt.ts   #   Builds context-aware prompt (catalog cached in Redis)
|   +-- cleanup.ts         #   Conversation history cleanup (24h TTL)
|   +-- client.ts          #   OpenAI-compatible client wrapper
+-- bot/                   # WhatsApp messaging & worker threads
|   +-- worker.ts          #   Worker thread entry (Baileys lifecycle)
|   +-- worker-bridge.ts   #   Main-thread proxy for workers
|   +-- tenant-manager.ts  #   Multi-tenant orchestrator
|   +-- handler.ts         #   Message routing (log, cooldown, rate limit, enqueue)
|   +-- rules-engine.ts    #   Keyword pattern matching (not yet wired into handler)
|   +-- health-check.ts    #   Worker heartbeat monitoring
|   +-- connection.ts      #   Legacy compat wrapper
|   +-- types.ts           #   BotInstance interface
|   +-- providers/
|       +-- baileys.ts     #     Baileys integration
|       +-- pg-auth-state.ts #   PostgreSQL auth state for Baileys
|       +-- types.ts       #     MessagingProvider interface
+-- db/                    # Database layer
|   +-- pool.ts            #   PostgreSQL connection pool + helpers
|   +-- database.ts        #   Init + migration runner
|   +-- migrate.ts         #   SQL migration engine
|   +-- migrations/        #   SQL migration files (001_schema, 002_fix_cascade)
|   +-- tenants-repo.ts    #   Tenant CRUD + API key management
|   +-- sessions-repo.ts   #   Connection health tracking
|   +-- products-repo.ts   #   Product catalog CRUD
|   +-- customers-repo.ts  #   Customer management
|   +-- orders-repo.ts     #   Order creation (transactional) + status
|   +-- payments-repo.ts   #   Payment confirmation/rejection
|   +-- messages-repo.ts   #   Message logging
|   +-- rules-repo.ts      #   Auto-reply rule CRUD
|   +-- conversations-repo.ts # AI conversation history
|   +-- settings-repo.ts   #   Per-tenant key-value settings
+-- queue/                 # BullMQ job queue
|   +-- ai-queue.ts        #   Queue + worker (connection-aware routing, chunked replies)
|   +-- rate-limiter.ts    #   Redis sliding window rate limiter + per-tenant concurrency
|   +-- redis.ts           #   Redis connection singleton
|   +-- types.ts           #   Job data/result interfaces
+-- shared/                # Shared utilities
|   +-- types.ts           #   All TypeScript interfaces
|   +-- events.ts          #   Typed EventEmitter (tenant-scoped)
|   +-- logger.ts          #   Pino logger
+-- web/                   # Express API server
|   +-- server.ts          #   App setup, route mounting
|   +-- middleware/
|   |   +-- tenant-auth.ts #     API key authentication
|   +-- routes/            #   11 route files (see API Reference)
|   +-- public/            #   SPA dashboard (HTML/CSS/JS)
+-- config.ts              # Environment variable loading
+-- cli.ts                 # CLI commands (start, tenants, logs)
+-- index.ts               # Application entrypoint
```

---

## Optimization Opportunities

### Worker Thread Pooling (High Impact)

Currently each active tenant spawns a dedicated worker thread running a full Baileys instance. At 50+ tenants this means 50+ threads, each consuming ~30-50MB of memory for the V8 isolate + Baileys socket.

**Optimization**: For tenants with low message volume, implement a worker pool where N worker threads service M tenants (N << M). Idle tenants could be evicted from workers and re-attached on demand, with session state persisted in PostgreSQL. This requires a connection multiplexer but would cut memory usage dramatically.

### Conversation History in Redis (Medium Impact)

Conversation history is stored as a JSON array in PostgreSQL with a 24-hour TTL. Under heavy load, frequent JSONB reads/writes for active conversations create I/O pressure on the database.

**Optimization**: Move active conversation history to Redis (fast reads/writes, natural TTL support) and only persist to PostgreSQL on conversation close or periodic flush. This would reduce database write amplification for the most frequently updated table.

---

## License

MIT
# yaIA
