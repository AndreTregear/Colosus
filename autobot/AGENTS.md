# Autobot — AI Agent Instructions

Instructions for AI agents working in the autobot codebase.

## Architecture Overview

Autobot is a unified Node.js + TypeScript application serving four roles from a single process on port 3000:

1. **WhatsApp Gateway** — Connects to WhatsApp via Baileys, one worker thread per tenant
2. **AI Engine** — Processes messages through Hermes (skills + MCP servers)
3. **REST API** — Express server with 100+ endpoints for dashboard, mobile app, admin
4. **Web Dashboard** — Static HTML/JS served from `src/web/public/`

## The 4 Layers

### bot/ — WhatsApp Gateway

Manages WhatsApp connections via the Baileys library.

| File | Purpose |
|------|---------|
| `tenant-manager.ts` | Orchestrates per-tenant bot workers |
| `worker.ts` | Worker thread — one per active tenant |
| `worker-bridge.ts` | Main thread ↔ worker IPC messaging |
| `connection.ts` | Baileys connection lifecycle (connect, reconnect, QR) |
| `handler.ts` | Incoming message router (text, image, audio, video) |
| `rules-engine.ts` | Keyword matching rules (exact, contains, regex) |
| `health-check.ts` | Periodic connection health monitoring |
| `providers/baileys.ts` | Baileys adapter implementing provider interface |
| `providers/pg-auth-state.ts` | WhatsApp session persistence in PostgreSQL |

**Message flow**: WhatsApp → Baileys → handler.ts → save media to MinIO → log to message_log → enqueue BullMQ job → AI processes → reply via Baileys

### queue/ — Job Processing

BullMQ-based background job processing backed by Redis.

| File | Purpose |
|------|---------|
| `ai-queue.ts` | Core AI job processor — text + image → Hermes → reply |
| `queue-factory.ts` | Queue registration and creation |
| `redis.ts` | Redis connection management |
| `rate-limiter.ts` | Per-tenant AI concurrency control |
| `reminder-scheduler.ts` | Order reminder cron jobs |
| `payment-followup-scheduler.ts` | Payment follow-up automation |
| `payment-expiration-scheduler.ts` | Expire stale payment requests |
| `daily-summary-scheduler.ts` | Daily business summary generation |
| `followup-scheduler.ts` | Customer follow-up flows |
| `scheduler-factory.ts` | Scheduler registration |

### integrations/ — OSS Service Clients

HTTP clients for external services. Each follows the same pattern: typed methods wrapping REST API calls.

| File | Service | Key Methods |
|------|---------|-------------|
| `lago-client.ts` | Lago (billing) | createCustomer, createSubscription, listInvoices, trackUsage |
| `calcom-client.ts` | Cal.com (scheduling) | getEventTypes, checkAvailability, createBooking, cancelBooking |
| `metabase-client.ts` | Metabase (BI) | executeQuestion, getDashboard, getDashboardQuestionResults |
| `google-calendar.ts` | Google Calendar | getAuthUrl, handleCallback, createEvent, getUpcomingEvents |

**Pattern for new integrations:**
```typescript
// integrations/yourservice-client.ts
import { config } from '../config.js';
import { logger } from '../shared/logger.js';

const BASE_URL = config.yourServiceUrl;
const API_KEY = config.yourServiceApiKey;

export async function listThings(tenantId: string): Promise<Thing[]> {
  const res = await fetch(`${BASE_URL}/api/things`, {
    headers: { 'Authorization': `Bearer ${API_KEY}` }
  });
  if (!res.ok) throw new Error(`yourservice: ${res.status}`);
  return res.json();
}
```

### web/ — Express API + Dashboard

Express server mounting 30 route files across different auth scopes.

**Route organization:**

| Auth Scope | Middleware | Mount Point | Route Files |
|------------|-----------|-------------|-------------|
| Public | None | `/api/` | api-register, api-plans, api-leads |
| Session (dashboard) | `requireSession` | `/api/` | api-account, api-dashboard, api-analytics |
| Admin | `requireSession` + `requireAdmin` | `/api/admin/` | api-admin, api-admin-ai-usage |
| Tenant (API key or session) | `requireTenantAuth` | `/api/` | api-subscription, api-creator-subscriptions |
| Mobile JWT | `requireMobileAuth` | `/api/v1/mobile/` | api-mobile-auth, api-mobile, core/* |
| Device token | `requireDeviceAuth` | `/api/v1/` | api-yape |

**CRUD routes** (products, orders, payments, customers, refunds, settings) live in `routes/core/` and are mounted twice: once under `/api/web/` (dashboard) and once under `/api/v1/mobile/` (mobile app).

## How to Add a New API Route

1. **Create the route file:**
   ```typescript
   // src/web/routes/api-yourfeature.ts
   import { Router } from 'express';
   import { getTenantId } from '../../shared/validate.js';
   import { logger } from '../../shared/logger.js';

   export function registerYourFeatureRoutes(router: Router): void {
     router.get('/yourfeature', async (req, res) => {
       try {
         const tenantId = getTenantId(req);
         // ... your logic
         res.json({ data });
       } catch (err) {
         logger.error({ err }, 'yourfeature failed');
         res.status(500).json({ error: 'Internal error' });
       }
     });
   }
   ```

2. **Mount in server.ts:**
   ```typescript
   import { registerYourFeatureRoutes } from './routes/api-yourfeature.js';
   // Choose the right router based on auth requirements:
   registerYourFeatureRoutes(tenantRouter);  // needs tenant context
   ```

3. **Add Zod validation** (if accepting request body):
   ```typescript
   // In shared/validation.ts
   export const yourFeatureSchema = z.object({
     name: z.string().min(1),
     value: z.number().positive(),
   });
   ```

4. **Verify:** `npx tsc --noEmit`

## How to Add a New Database Table

1. **Add migration** in `src/db/migrate.ts`:
   ```sql
   CREATE TABLE IF NOT EXISTS your_table (
     id SERIAL PRIMARY KEY,
     tenant_id TEXT NOT NULL REFERENCES tenants(id),
     name TEXT NOT NULL,
     created_at TIMESTAMPTZ DEFAULT now()
   );
   ```

2. **Create repository** `src/db/yourtable-repo.ts`:
   ```typescript
   import pool from './pool.js';

   export async function getItems(tenantId: string) {
     const client = await pool.connect();
     try {
       await client.query(`SET search_path = client_${tenantId}`);
       const { rows } = await client.query('SELECT * FROM your_table ORDER BY created_at DESC');
       return rows;
     } finally {
       client.release();
     }
   }
   ```

3. **Add types** in `src/shared/types.ts`:
   ```typescript
   export interface YourItem {
     id: number;
     tenantId: string;
     name: string;
     createdAt: Date;
   }
   ```

4. **Verify:** `npx tsc --noEmit`

## How to Add a New OSS Integration

Follow the Lago client pattern:

1. **Add config** in `src/config.ts`:
   ```typescript
   yourServiceUrl: process.env.YOUR_SERVICE_URL || 'http://localhost:PORT',
   yourServiceApiKey: process.env.YOUR_SERVICE_API_KEY || '',
   ```

2. **Create client** `src/integrations/yourservice-client.ts`
3. **Add env vars** to `.env.example` and `docker-compose.prod.yml`
4. **Create service** in `src/services/` if business logic is needed
5. **Verify:** `npx tsc --noEmit`

## Key Files to Read First

Start here to understand the codebase:

1. **`src/config.ts`** — Every environment variable and default value
2. **`src/platform.ts`** — Startup sequence, what connects to what
3. **`src/shared/types.ts`** — All TypeScript interfaces (Tenant, Customer, Order, Payment, etc.)
4. **`src/shared/logger.ts`** — Pino logger setup, log levels, startup banner
5. **`src/web/server.ts`** — Express setup, all route mounting, middleware stack
6. **`src/bot/tenant-manager.ts`** — How multi-tenant WhatsApp works
7. **`src/ai/hermes-bridge.ts`** — How messages reach the AI
8. **`src/db/pool.ts`** — PostgreSQL connection pool

## Common Gotchas

### ESM imports require .js extension

TypeScript compiles to ESM. All local imports must use `.js`:

```typescript
// CORRECT
import { config } from '../config.js';

// WRONG — will fail at runtime
import { config } from '../config';
import { config } from '../config.ts';
```

### dotenv ordering matters

`config.ts` calls `dotenv.config()` at import time. If you import config after other modules that read `process.env`, they'll get undefined values. Always import config first or ensure `dotenv.config()` runs before any env access.

### PostgreSQL pool management

Always release clients back to the pool:

```typescript
const client = await pool.connect();
try {
  await client.query(`SET search_path = client_${tenantId}`);
  // ... your queries
} finally {
  client.release(); // ALWAYS release, even on error
}
```

Never call `pool.end()` in request handlers — that kills the shared pool.

### Tenant ID is always required

Every database operation needs a `tenantId`. Use `getTenantId(req)` from `shared/validate.ts` — it throws a 400 if missing. Never access data without tenant scoping.

### BullMQ jobs are processed asynchronously

When you enqueue a job, the response goes back to the user immediately. The AI processing happens in the background via `ai-queue.ts`. Don't try to return AI results synchronously from the WhatsApp handler.

### Auth middleware order

Middleware must be applied in the correct order in `server.ts`:
1. Global middleware (CORS, security headers, rate limiting, body parsing)
2. Public routes (no auth)
3. Auth routes (Better Auth handlers)
4. Protected routes (with auth middleware)

## Build and Verify

Always run before committing:

```bash
npx tsc --noEmit
```

This type-checks the entire project without emitting files. Fix all errors before pushing.

For a full build:

```bash
npm run build    # Compiles to dist/
```
