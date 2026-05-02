# Security Model

How the Yaya Platform protects tenant data, enforces isolation, and handles authentication.

## Multi-Tenant Isolation

### Database Isolation (Schema-per-Tenant)

Every tenant gets their own PostgreSQL schema:

```
public/                  # Shared: tenants, users, sessions, platform_plans
agent/                   # Shared: conversations, message_log
client_{tenantId}/       # Tenant-specific: products, customers, orders, payments, subscriptions
```

Every database query sets `search_path = client_{tenantId}` before execution. This is enforced at the repository layer — all `*-repo.ts` files require a `tenantId` parameter.

### Hermes — AI Agent Sandbox

Hermes enforces tenant isolation at the AI layer. Policies are defined in `infra/hermes/`:

**Database policies:**
- `enforce-tenant-scope` — All SQL queries must include `tenant_id` filter
- `block-cross-tenant` — Deny `SELECT *` without `WHERE tenant_id`
- `enforce-search-path` — Set `search_path = client_{tenantId}` before execution
- `block-dangerous-sql` — Prevent DROP, TRUNCATE, ALTER, DELETE without tenant scope

**Storage policies:**
- S3 access restricted to `media-raw/{tenantId}/` prefix per tenant

**Rate limiting (per tenant):**
- 30 AI requests/minute
- 500 AI requests/hour
- 3 concurrent AI requests

**PII protection:**
- Strip credit card numbers from AI responses
- Strip national ID numbers (DNI, RUC for Peru)
- Strip phone numbers, emails, addresses from cross-tenant contexts

### Storage Isolation

MinIO paths are tenant-scoped: `media-raw/{tenantId}/filename`. Presigned URLs are generated per-tenant and expire after 5 minutes.

### Worker Isolation

Each tenant's WhatsApp connection runs in a separate Node.js worker thread (`bot/worker.ts`), managed by `bot/tenant-manager.ts`. Worker crashes are isolated — one tenant's connection failure doesn't affect others.

## Authentication

### Web Dashboard — Better Auth (Session-Based)

**Library:** Better Auth v1.5+
**Config:** `autobot/src/auth/auth.ts`
**Middleware:** `web/middleware/session-auth.ts`

- Session cookie with 7-day lifetime, auto-refreshed after 1 day
- Passwords hashed with bcrypt
- Roles: `admin` (platform admin) and `user` (tenant owner)
- `tenantId` is a server-side field — clients cannot set or modify it
- Password change revokes all other sessions

### Mobile App — JWT

**Config:** `web/routes/api-mobile-auth.ts`
**Middleware:** `web/middleware/mobile-auth.ts`

- Phone-based registration (E.164 format)
- Separate `mobile_users` table (not Better Auth)
- Access token: HS256 JWT, 7-day expiry, payload: `{ userId, tenantId, phone, type: 'access' }`
- Refresh token: HS256 JWT, 30-day expiry, payload: `{ userId, tenantId, type: 'refresh' }`
- Token rotation on refresh (new pair issued, old invalidated)
- Signed with `BETTER_AUTH_SECRET` (min 32 characters)

### API Key — Service-to-Service

**Middleware:** `web/middleware/tenant-auth.ts`

- 64-character hex key (32 random bytes)
- Sent via `X-API-Key` header or `Authorization: Bearer {key}`
- Looked up in `tenants.api_key` column
- Rotation endpoint: `POST /api/account/api-key/rotate`

### Device Token — Yape Payment Validator

**Middleware:** `web/middleware/device-auth.ts`

- Opaque bearer token stored in `devices.token` column
- Issued on device registration
- `last_seen_at` tracking on each request
- Used by the YapeReader Android app for payment notifications

## Data Encryption

### At Rest

- **Database:** PostgreSQL volumes can be encrypted at the filesystem/disk level
- **Object storage:** MinIO volumes can be encrypted at the filesystem level
- **Sensitive fields:** AES-256-GCM envelope encryption available for client-side data

### Envelope Encryption (Client-Side)

For sensitive data that needs field-level encryption:

1. Tenant registers their RSA public key via `POST /api/v1/encryption/keys`
2. Server generates a random 256-bit AES key (DEK) per encryption request
3. Data encrypted with AES-256-GCM (produces: ciphertext, IV, auth tag)
4. DEK wrapped with tenant's RSA public key (RSA-OAEP, SHA-256)
5. DEK zeroed from memory after wrapping
6. Only the tenant can decrypt (server never holds the private key)

Key management:
- Key fingerprint tracking (SHA-256)
- Key statuses: `active`, `rotated`, `revoked`
- Key rotation: old key marked `rotated`, new key registered

### In Transit

- **External:** HTTPS enforced via Caddy with automatic Let's Encrypt certificates
- **HSTS:** `Strict-Transport-Security: max-age=31536000; includeSubDomains` in production
- **Internal:** Docker bridge network (services communicate over private network, no encryption needed)

## Security Headers

Applied to all responses:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 0              (CSP preferred over XSS filter)
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy: default-src 'self'; ...
```

## Rate Limiting

Express-rate-limit protects against abuse:

| Scope | Window | Limit |
|-------|--------|-------|
| Global API | 15 min | 300 requests |
| Auth endpoints | 15 min | 20 requests |
| Registration | 15 min | 20 requests |
| Mobile auth | 15 min | 20 requests |
| Website leads | 1 min | 5 requests |

AI processing has additional per-tenant rate limiting via `queue/rate-limiter.ts`.

## CORS Policy

- Allowed origins: restricted to `BETTER_AUTH_URL` value
- Requests with no origin are allowed (mobile apps, server-to-server)
- Credentials enabled for session cookies

## Local AI Inference — Privacy by Design

All AI processing runs on your own infrastructure:

- **LLM (Qwen3.5-27B):** Self-hosted via vLLM — no text sent to cloud APIs
- **Speech-to-text (Whisper):** Self-hosted — voice notes transcribed locally
- **Text-to-speech (Kokoro):** Self-hosted — voice responses generated locally
- **No telemetry:** No data sent to Anthropic, OpenAI, Google, or any third party

This is critical for LATAM compliance and customer trust. Business conversations contain sensitive financial data, customer information, and proprietary pricing.

## What Data We Store

| Data Type | Where | Retention |
|-----------|-------|-----------|
| Tenant profiles | `public.tenants` | Until account deletion |
| User credentials | `public.user` (bcrypt hashed) | Until account deletion |
| WhatsApp messages | `agent.message_log` | Indefinite (tenant can request deletion) |
| Customer contacts | `client_{id}.customers` | Until tenant deletes |
| Orders & payments | `client_{id}.orders`, `client_{id}.payments` | Indefinite (financial records) |
| Media files | MinIO `media-raw/{tenantId}/` | Until tenant deletes |
| AI conversation history | `agent.conversations` | Indefinite (used for context) |
| Session data | `public.session` | 7 days (auto-expire) |

## What We Don't Store

- Credit card numbers (we use Yape/Plin/Nequi — no card data)
- Raw passwords (only bcrypt hashes)
- Private encryption keys (only public keys for envelope encryption)
- Cloud AI API logs (all inference is local)
- Third-party analytics or tracking data

## GDPR / Privacy Considerations for LATAM

While GDPR is an EU regulation, we follow its principles as best practice, especially given LATAM's emerging privacy laws (Peru's LPDP, Brazil's LGPD, Colombia's Law 1581):

- **Data minimization:** We only store data necessary for business operations
- **Purpose limitation:** Customer data is used only to serve the business owner
- **Right to access:** Tenants can export all their data via warehouse endpoints
- **Right to deletion:** Tenants can request account and data deletion
- **Consent:** End customers interacting via WhatsApp are informed by the business owner
- **Data portability:** Training data export in JSONL/CSV format
- **Local processing:** No cross-border data transfer to cloud AI providers
- **Encryption:** Field-level encryption available for sensitive data

### LATAM-Specific Compliance

- **Peru (LPDP):** Personal data processing with legitimate interest basis (business relationship)
- **Brazil (LGPD):** Data processing under contractual necessity basis
- **Colombia (Law 1581):** Explicit consent model, data localization preferences supported
- **Mexico (LFPDPPP):** Privacy notice obligations, purpose limitation

## Reporting Security Issues

If you discover a security vulnerability, please report it responsibly. Do not open a public issue. Contact the maintainers directly.
