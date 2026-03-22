# API Reference

Complete REST API documentation for Yaya Platform. All endpoints are served by Autobot on port 3000.

Base URL: `http://localhost:3000`

## Authentication Types

| Type | Mechanism | Header/Cookie | Used By |
|------|-----------|--------------|---------|
| **Public** | None | — | Registration, plans, health |
| **Session** | Better Auth cookie | Cookie (auto) | Web dashboard |
| **Admin** | Session + admin role | Cookie (auto) | Admin panel |
| **API Key** | Tenant API key | `X-API-Key: {key}` or `Authorization: Bearer {key}` | Service-to-service |
| **Mobile JWT** | Access token | `Authorization: Bearer {jwt}` | Android/iOS app |
| **Device** | Opaque device token | `Authorization: Bearer {token}` | Yape payment validator |

---

## Public Endpoints

No authentication required.

### POST /api/register

Create a new tenant and user account.

**Request:**
```json
{
  "email": "owner@bodega.pe",
  "password": "securepassword",
  "name": "María García",
  "businessName": "Bodega María"
}
```

**Response (201):**
```json
{
  "tenant": { "id": "uuid", "name": "Bodega María", "slug": "bodega-maria", "apiKey": "hex64" },
  "user": { "id": "uuid", "email": "owner@bodega.pe", "name": "María García" }
}
```

### GET /api/plans

List active platform subscription plans.

**Response (200):**
```json
{
  "plans": [
    { "id": "uuid", "name": "Free", "price": 0, "currency": "PEN", "features": [...] },
    { "id": "uuid", "name": "Pro", "price": 49.90, "currency": "PEN", "features": [...] }
  ]
}
```

### POST /api/website/leads

Public contact form submission. Rate limited: 5 requests/minute.

**Request:**
```json
{
  "name": "Juan",
  "email": "juan@gmail.com",
  "phone": "+51999888777",
  "message": "I want to try Yaya for my restaurant",
  "honeypot": ""
}
```

**Response (201):** `{ "ok": true }`

### GET /api/health

Health check endpoint.

**Response (200):** `{ "status": "ok" }`

---

## Session Endpoints (Web Dashboard)

Requires Better Auth session cookie (set after login at `/api/auth/sign-in`).

### Account Management

#### GET /api/account

Get tenant profile and settings.

**Response (200):**
```json
{
  "tenant": { "id": "uuid", "name": "Bodega María", "slug": "bodega-maria", "phone": "+51...", "settings": {...} },
  "user": { "id": "uuid", "email": "owner@bodega.pe", "name": "María García", "role": "user" }
}
```

#### PUT /api/account

Update tenant profile.

**Request:**
```json
{
  "name": "Bodega María Deluxe",
  "phone": "+51999888777",
  "settings": { "currency": "PEN", "timezone": "America/Lima", "language": "es" }
}
```

#### POST /api/account/api-key/rotate

Generate a new API key (invalidates the old one).

**Response (200):** `{ "apiKey": "new_hex64_key" }`

#### PUT /api/account/password

Change password. Revokes all other sessions.

**Request:** `{ "currentPassword": "old", "newPassword": "new" }`

### Bot Control

#### GET /api/account/status

Get WhatsApp bot connection status.

**Response (200):** `{ "status": "connected" | "disconnected" | "connecting", "phone": "+51..." }`

#### GET /api/account/qr

Get QR code for WhatsApp pairing.

**Response (200):** `{ "qr": "base64_qr_image" }`

#### POST /api/account/bot/start

Start the WhatsApp bot for this tenant.

#### POST /api/account/bot/stop

Stop the WhatsApp bot.

#### POST /api/account/bot/reset

Disconnect and re-initialize the bot (clears session).

#### POST /api/account/bot/toggle-autoreply

Toggle AI auto-reply on/off.

**Request:** `{ "enabled": true }`

### Dashboard

#### GET /api/web/dashboard

Combined dashboard data.

**Response (200):**
```json
{
  "revenue": { "today": 450.00, "week": 2800.00, "month": 12500.00 },
  "orders": { "today": 15, "pending": 3, "total": 340 },
  "payments": { "pending": 2, "confirmed": 338 },
  "topProducts": [{ "name": "Arroz", "quantity": 120, "revenue": 600 }]
}
```

#### GET /api/web/messages

Message log for this tenant.

**Query params:** `?page=1&limit=50&search=keyword`

**Response (200):**
```json
{
  "messages": [{ "id": 1, "jid": "51999888777@s.whatsapp.net", "text": "...", "direction": "in", "createdAt": "..." }],
  "total": 1500,
  "page": 1
}
```

#### GET /api/web/analytics/sales

Sales analytics.

**Query params:** `?period=week|month|year`

#### GET /api/web/analytics/comprehensive

Full analytics dashboard data (revenue, customers, products, payments).

### CRUD Routes (Dashboard)

All mounted under `/api/web/`.

#### Products

- **GET /api/web/products** — List products (`?page=1&limit=20&search=`)
- **POST /api/web/products** — Create product (`{ name, price, description?, category?, stock? }`)
- **PUT /api/web/products/:id** — Update product
- **DELETE /api/web/products/:id** — Delete product
- **POST /api/web/products/:id/image** — Upload product image (multipart/form-data)

#### Orders

- **GET /api/web/orders** — List orders (`?page=1&limit=20&status=pending`)
- **POST /api/web/orders** — Create order (`{ customerId, items: [{ productId, quantity }] }`)
- **GET /api/web/orders/:id** — Get order detail
- **PUT /api/web/orders/:id/status** — Update status (`{ status: "confirmed" | "shipped" | "delivered" | "cancelled" }`)

#### Payments

- **GET /api/web/payments** — List payments
- **POST /api/web/payments/confirm** — Manually confirm a payment (`{ paymentId }`)

#### Customers

- **GET /api/web/customers** — List customers
- **POST /api/web/customers** — Create customer (`{ name, phone, email? }`)
- **PUT /api/web/customers/:id** — Update customer

#### Refunds

- **GET /api/web/refunds** — List refunds
- **POST /api/web/refunds** — Create refund request
- **PUT /api/web/refunds/:id/approve** — Approve refund

#### Settings

- **GET /api/web/settings** — Get tenant business settings
- **PUT /api/web/settings** — Update settings

### AI Chat

#### POST /api/merchant-ai/chat

Chat with AI assistant as the merchant (via OpenClaw).

**Request:** `{ "message": "How were my sales today?" }`

**Response (200):** `{ "reply": "You had 15 sales today totaling S/450..." }`

### Business Intelligence

#### GET /api/business/insights

AI-generated business insights.

#### POST /api/business/ask-ai

Ask a business question to the AI.

**Request:** `{ "question": "Which product should I restock?" }`

### Calendar

#### GET /api/calendar/connect

Get Google Calendar OAuth URL.

#### GET /api/calendar/callback

OAuth callback handler (redirects).

---

## Admin Endpoints

Requires session + admin role.

### GET /api/admin/metrics

Platform-wide metrics (all tenants).

**Response (200):**
```json
{
  "totalTenants": 45,
  "activeTenants": 38,
  "totalMessages": 125000,
  "totalOrders": 8500,
  "totalRevenue": 450000.00
}
```

### GET /api/admin/messages

Cross-tenant message log.

**Query params:** `?page=1&limit=50&tenantId=uuid`

### GET /api/admin/token-usage

AI token usage analytics.

### GET /api/admin/subscriptions

All tenant subscriptions.

### GET /api/admin/payments

Platform payment tracking.

### POST /api/admin/unmatched-payments/:id/match

Manually match an unmatched payment to a tenant/order.

**Request:** `{ "tenantId": "uuid", "orderId": "uuid" }`

### GET /api/admin/orders/expired

Find stale/expired orders across tenants.

### POST /api/admin/tenants

Create a tenant with admin user (admin provisioning).

**Request:** `{ "businessName": "...", "email": "...", "password": "..." }`

### PUT /api/admin/subscriptions/:tenantId

Override subscription tier for a tenant.

**Request:** `{ "planId": "uuid" }`

### AI Usage Analytics

- **GET /api/admin/ai-usage/summary** — Aggregate AI costs
- **GET /api/admin/ai-usage/by-tenant** — Per-tenant breakdown
- **GET /api/admin/ai-usage/daily** — Daily trend

---

## Tenant Endpoints (API Key or Session)

Accepts either `X-API-Key` header or session cookie.

### Subscriptions

- **GET /api/subscription** — Current subscription status
- **POST /api/subscription/subscribe** — Subscribe to a plan (`{ planId }`)
- **POST /api/subscription/cancel** — Cancel subscription
- **POST /api/subscription/pay** — Create Yape payment for subscription

### Creator Subscriptions (B2C)

For businesses that sell subscriptions to their own customers.

- **GET /api/creator/subscriptions** — List customer subscriptions
- **POST /api/creator/subscriptions** — Subscribe a customer (`{ customerId, planId }`)
- **GET /api/creator/plans** — List creator's plans
- **POST /api/creator/plans** — Create plan
- **PUT /api/creator/plans/:id** — Update plan
- **DELETE /api/creator/plans/:id** — Delete plan

### Leads

- **GET /api/leads** — List captured leads
- **PUT /api/leads/:id** — Update lead status

---

## Mobile Endpoints

For the Android/iOS app. JWT authentication (access token).

### Authentication

#### POST /api/v1/mobile/auth/register

Register a new mobile user.

**Request:**
```json
{
  "phone": "+51999888777",
  "password": "securepassword",
  "businessName": "Mi Bodega",
  "name": "Juan",
  "email": "juan@gmail.com"
}
```

**Response (201):**
```json
{
  "token": "jwt_access_token",
  "refreshToken": "jwt_refresh_token",
  "tenant": { "id": "uuid", "name": "Mi Bodega" },
  "user": { "id": 1, "phone": "+51999888777" },
  "subscription": { "plan": "free", "status": "active" }
}
```

#### POST /api/v1/mobile/auth/login

**Request:** `{ "phone": "+51999888777", "password": "..." }`

**Response (200):** Same shape as register.

#### POST /api/v1/mobile/auth/refresh

**Request:** `{ "refreshToken": "jwt_refresh_token" }`

**Response (200):** `{ "token": "new_jwt", "refreshToken": "new_refresh_jwt" }`

### Mobile Dashboard

#### GET /api/v1/mobile/dashboard

Aggregated business stats for the mobile home screen.

#### GET /api/v1/mobile/subscription

Current subscription status.

### WhatsApp Control

- **GET /api/v1/mobile/whatsapp/status** — Connection status
- **GET /api/v1/mobile/whatsapp/qr** — QR code for pairing

### Conversations

- **GET /api/v1/mobile/conversations** — List recent conversations
- **POST /api/v1/mobile/conversations/:jid/send** — Send a message (`{ text: "..." }`)
- **POST /api/v1/mobile/conversations/:jid/pause-ai** — Pause AI for a contact (`{ minutes: 30 }`)

### Mobile CRUD

Same as dashboard CRUD but mounted under `/api/v1/mobile/`:
- `/api/v1/mobile/products`, `/api/v1/mobile/orders`, `/api/v1/mobile/payments`
- `/api/v1/mobile/customers`, `/api/v1/mobile/refunds`, `/api/v1/mobile/settings`

### Calendar (Mobile)

- **POST /api/v1/mobile/calendar/sync** — Sync calendar events
- **GET /api/v1/mobile/calendar/events** — List upcoming events
- **GET /api/v1/mobile/calendar/availability** — Check availability

---

## Device Endpoints

For hardware devices (Yape payment validator app).

### POST /api/v1/yape/devices/register

Register a new device. Requires tenant API key.

**Request:**
```json
{
  "businessName": "Bodega María",
  "phoneNumber": "+51999888777",
  "deviceId": "android-device-uuid",
  "apiKey": "tenant_api_key"
}
```

**Response (201):** `{ "token": "opaque_device_token", "deviceId": "..." }`

### POST /api/v1/yape/payments/sync

Submit a Yape payment notification. Requires device token.

**Request:**
```json
{
  "amount": 25.50,
  "senderName": "Juan Pérez",
  "senderPhone": "+51999777666",
  "referenceCode": "YAP123456",
  "timestamp": "2026-03-22T10:30:00Z"
}
```

### POST /api/v1/yape/payments/sync/batch

Submit multiple payment notifications at once.

**Request:** `{ "payments": [{ ...same as above }] }`

---

## Media Endpoints

Requires mobile or session auth.

- **POST /api/v1/media/upload** — Upload media (multipart, max 50MB video / 10MB other)
- **GET /api/v1/media** — List media assets
- **GET /api/v1/media/:id/url** — Get presigned S3 URL (5-min expiry)
- **DELETE /api/v1/media/:id** — Delete media
- **GET /api/v1/stream** — Stream media

---

## Encryption Endpoints

Client-side envelope encryption (AES-256-GCM + RSA key wrapping).

- **POST /api/v1/encryption/keys** — Register RSA public key
- **GET /api/v1/encryption/keys** — List registered keys
- **POST /api/v1/encryption/keys/:id/rotate** — Rotate key (marks old as rotated)
- **POST /api/v1/encryption/encrypt** — Encrypt data with tenant's active key
- **POST /api/v1/encryption/decrypt-request** — Parse encrypted field metadata

---

## Data Warehouse Endpoints

Analytics and training data export.

- **GET /api/v1/warehouse/summary** — Warehouse analytics summary
- **POST /api/v1/warehouse/export/training** — Export training data (JSONL or CSV)
- **GET /api/v1/warehouse/interactions** — Query interaction facts
- **GET /api/v1/warehouse/daily-volume** — Daily message volume metrics

---

## Rate Limits

| Scope | Window | Limit |
|-------|--------|-------|
| Global (`/api/*`) | 15 min | 300 requests |
| Auth endpoints | 15 min | 20 requests |
| Registration | 15 min | 20 requests |
| Mobile auth | 15 min | 20 requests |
| Website leads | 1 min | 5 requests |

Rate limit headers are included in responses:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

## Error Format

All errors return JSON:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE"
}
```

Common status codes:
- `400` — Validation error (bad request body)
- `401` — Not authenticated
- `403` — Not authorized (wrong role or tenant)
- `404` — Resource not found
- `429` — Rate limited
- `500` — Internal server error
