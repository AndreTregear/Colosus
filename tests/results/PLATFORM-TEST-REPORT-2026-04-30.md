# Yaya Platform — Full Test Report

**Date:** 2026-04-30
**Branch:** main (working tree dirty — 19 modified files)
**Test base:** http://localhost:3000 (autobot booted from `/home/yaya/colosus/autobot` via `tsx --env-file=.env src/index.ts`)
**Backing services:** Postgres `yaya_business` (93 tables), Redis 7, MinIO, vLLM (Qwen3.6-35B-A3B-AWQ-4bit) :8000, Speaches ASR :8001, Kokoro TTS :8002 — all healthy.

## Headline

| Layer | Result |
|---|---|
| Vitest suite (52 files / 956 tests) | **933 pass / 23 fail** |
| `/api/v1/health` checks | postgres, redis, vllm, whisper all `ok` |
| Admin REST surface | 9/9 endpoints return real JSON with valid session |
| End-to-end agent chat (`/api/merchant-ai/chat`) | **Broken** — pgcrypto missing |
| LLM (vLLM Qwen3.6) | OK (4.6s/80 tokens) but reasoning-mode swallows output unless `enable_thinking:false` |
| PM2 `yaya-business` (production runner) | **stopped** — 46,707 restarts |

## Coverage by file

```
✓  43 files  green
❯   9 files  one or more failures
```

Green-pass highlights: `crypto` (74), `sunat` (49), `voice-pipeline` (47), `shared` (47), `confirmation-flow` (37), `db` (37), `rl-pipeline` (37), `task-engine` (23), `user-journey-live` (23), `nlu-agent-live` (18), `persona-live` (11), `api-admin` (49), `api-mobile` (23), `api-mobile-crud` (14), `api-leads` (14), `api-yape` (10), `api-queue` (10), `api-rules` (11), `api-subscription` (10), `api-creator` (8), `api-business-intelligence` (8), `audio-compliance` (14), `pii-scrubber` (22), `field-crypto` (19), `validation-extended` (27).

## 23 Failures — root-cause grouped

### 1. Persona-live-v2 (10 fails) — LLM reasoning-mode swallows output
All ten persona scenarios (`María`, `Carlos`, `Doña Rosa`, `Valentina`, `Pedro`, `Carmen`, `Diego`, `FULL FUNNEL`, `CEO uses tools`, `gibberish`) hit `Test timed out` (60s/120s/180s). Reproduced directly against vLLM: with default settings the model consumes all completion tokens on `reasoning_content` and returns `content: null`. Adding `chat_template_kwargs: {enable_thinking: false}` fixes it (`content: "Hola"`).
**Fix:** set `enable_thinking: false` on the agent's chat completion call (Mastra/whatsappAgent), or budget enough max_tokens for hybrid-mode reasoning.

### 2. cache.test.ts (4 fails) — `BoundedMap is not a constructor`
`TypeError: __vite_ssr_import_1__.BoundedMap is not a constructor` on every test in the suite. Either `BoundedMap` is no longer exported from the cache module, or it was converted from class to factory.
**Fix:** restore `export class BoundedMap` or update the import path/test usage.

### 3. api-web*.test.ts (4 fails) — products endpoint returns object, tests expect array
`api-web.test.ts 4.3, 4.6, 4.12` and `api-web-crud.test.ts 11.6` all expect `Array.isArray(json)` from `GET /api/web/products`. Live response is now an object (likely `{products: [...], total, ...}` paginated shape).
**Fix:** either revert to bare-array contract or update tests to read `body.products`.

### 4. e2e-flows.test.ts (2 fails) — auth limiter (20/15min) fires mid-suite
`21.1` and `21.2` — multi-step register→login→CRUD flows. Each call uses `/api/auth/sign-in/email` or `/api/v1/mobile/auth/register`, both bound by the 20-req auth limiter. By the time these run after sibling tests they're rate-limited.
**Fix:** either bump limiter via env, allowlist by IP for tests, or stagger tests across windows. Not a code bug per se.

### 5. api-account.test.ts 7.2 (1) — admin without tenantId can read tenant-scoped account
`GET /api/account` with admin cookie expected `403`, got `200`. The `requireSession` middleware lets the admin through but `accountRouter` doesn't enforce a tenant.
**Fix:** add tenant guard on `/api/account`.

### 6. auth.test.ts 2.5 (1) — sign-out returns 403
Sign-out path returns 403 instead of 200. Could be CSRF/origin check or session already invalidated by a sibling test reusing the cookie.
**Fix:** investigate Better Auth sign-out config.

### 7. security-headers.test.ts (1) — Permissions-Policy strips microphone
`Permissions-Policy: camera=(), microphone=(), geolocation=()` — test expects `microphone=(self)`. With `microphone=()` the dashboard cannot record audio for voice features.
**Fix:** in security-headers middleware change `microphone=()` → `microphone=(self)`.

### 8. agents.test.ts (0 tests)
Empty file. Either delete or fill in.

## Live-system bugs found (not in tests)

### B1. pgcrypto extension missing on production DB — agent chat fully broken
`POST /api/merchant-ai/chat` triggers `provisionTenantDatabase()` → `create_tenant_role(uuid)` PL/pgSQL → `encode(gen_random_bytes(24), 'hex')` → `function gen_random_bytes(integer) does not exist`. The DB only has `plpgsql`; `pgcrypto` is not installed. Every owner-facing AI chat call returns the canned fallback `"Lo siento, tuve un problema. ¿Podrías repetirme?"`.
**Fix (one-liner):**
```bash
docker exec yaya_business-postgres-1 psql -U yaya_prod -d yaya_business \
  -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"
```

### B2. Tenant worker thread crashes on Baileys ESM resolution
On startup the active tenant `dffdcdae-...` worker exits with `Cannot find module '/home/yaya/colosus/autobot/src/bot/providers/baileys.js' imported from .../bot/worker.ts`. Source file is `baileys.ts`. Worker thread spawned by tsx isn't applying tsx's TS resolver to `.js` → `.ts` rewriting.
**Fix:** spawn worker with `--import tsx` or rewrite import to extension-less / `.ts` path, or compile to `dist` and run worker from compiled output.

### B3. PM2 `yaya-business` is dead
Stopped, 46,707 restarts over recent days, empty error logs. Production traffic to autobot is currently dropping. Likely the same Baileys ESM error in worker thread or schema-rls.sql being deleted in working tree.

### B4. `/api/v1/account*` and `/api/agente/*` paths fall through to SPA HTML
`GET /api/v1/account`, `/api/v1/account/qr`, `/api/agente/health`, `/api/agente/chat` all return the dashboard HTML (or 404). The mounted prefix is `/api/account` and `/api/v1/mobile/agente` (no `/api/agente` exists). Either kill the dead routes or mount them at the documented paths — the `api-agente.ts` doc-comment claims `POST /api/agente/chat` which does not exist.

### B5. In-memory rate limit with 300 req/15min global is fragile under test/CI
Vitest + smoke tests easily exhaust it; `run-tests.sh` already pre-caches an admin cookie to avoid the auth one. Consider bumping or per-IP-resetting in dev.

## Verified-working surface (REST, with admin session cookie)

```
GET  /api/v1/health                 → 200  postgres+redis+vllm+whisper ok
GET  /api/admin/users               → 200  6.7KB JSON, real users
GET  /api/admin/messages            → 200  {conversations:[],total:0}
GET  /api/admin/metrics             → 200  per-tenant metrics
GET  /api/admin/payments            → 200  {total:0,payments:[]}
GET  /api/admin/orders/expired      → 200  []
GET  /api/admin/subscriptions       → 200  3KB JSON
GET  /api/admin/unmatched-payments  → 200  6 notifications
GET  /api/admin/token-usage         → 200  []
GET  /api/admin/users               → 200  multiple test tenants
POST /api/auth/sign-in/email        → 200  Better Auth token + cookie
GET  /openapi.json                  → 200
```

## Recommendations (ranked)

1. **CRITICAL** — `CREATE EXTENSION pgcrypto` on `yaya_business` DB. Owner-AI chat is fully broken until this lands.
2. **CRITICAL** — set `enable_thinking: false` (or budget ≥ 1024 max_tokens) wherever the autobot calls Qwen3.6 hybrid model. 10 test failures are all this.
3. **HIGH** — fix Baileys `.js` import in worker thread; restart PM2 `yaya-business`.
4. **HIGH** — `BoundedMap` export regression in cache module.
5. **MEDIUM** — settle `/api/web/products` array-vs-object contract and update either tests or callers.
6. **MEDIUM** — admin-without-tenantId guard on `/api/account`.
7. **LOW** — Permissions-Policy `microphone=(self)` so dashboard mic works.
8. **LOW** — remove unused `/api/agente/*` routes or mount them.
9. **LOW** — auth rate limit tuning for test harness, or `app.use` skip when `NODE_ENV=test`.

## Artifacts

- Vitest verbose log: `/tmp/vitest-clean.log` (1680 lines, run took 1116s)
- Autobot stdout: `/tmp/autobot-test.log`
- Admin session cookie: `/tmp/yc.txt`
