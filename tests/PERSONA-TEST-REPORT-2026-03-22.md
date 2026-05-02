# Persona Testing Report — March 22, 2026

## Test Environment
- **URL**: https://cx.yaya.sh
- **Server**: c.yaya.sh (Debian, i9-10900X, 125GB RAM)
- **Version**: commit 736ec19 (Mastra purge)
- **Services running**: autobot, PostgreSQL, Redis, MinIO, vLLM, Whisper, Kokoro TTS
- **Services NOT running**: Lago, Cal.com, Metabase, InvoiceShelf (docker-compose.prod.yml not deployed yet)

---

## 5 Test Personas (Most Common Peru Business Types)

### 1. 🍗 Pollería El Sabrosito (Restaurant)
**Profile**: Family-owned chicken restaurant in San Juan de Miraflores. 3 employees. Average 50 orders/day.

| Feature | Status | Notes |
|---------|--------|-------|
| Registration | ✅ PASS | Created tenant via /api/register |
| Login (web) | ✅ PASS | Better Auth returns token + session cookie |
| Login (mobile) | ✅ PASS | JWT returned, includes subscription status |
| Add products | ✅ PASS | 5 products added (pollo, chifa, bebidas), prices in Soles |
| List products | ✅ PASS | Returns tenant-scoped products only |
| Dashboard | ✅ PASS | Returns revenue=0, orders=0 (empty, correct) |
| Customer creation | ❌ FAIL | Web API missing POST /api/web/customers |
| Order creation | ❌ FAIL | Web API missing POST /api/web/orders |
| WhatsApp connect (web) | ❌ BLOCKED | /api/qr requires admin role, not tenant role |
| WhatsApp connect (mobile) | ⚠️ PARTIAL | Status + QR endpoint work, but QR shows "not yet" (tenant not started) |
| AI agent chat | ⚠️ DEGRADED | Returns fallback "hubo un error" — Hermes not running |
| Yape payment sync | ⚠️ UNTESTED | Requires Android app + Yape notifications |
| Analytics | ✅ PASS | Returns empty data correctly |
| Settings | ✅ PASS | Returns ai_enabled setting |

**Readiness**: 60% — Can register, add products, view dashboard. Blocked on WhatsApp pairing and order/customer creation from web.

---

### 2. 🏪 Bodega Don Carlos (Corner Store)
**Profile**: Neighborhood bodega in Los Olivos. Owner-operated. 200+ SKUs. Cash + Yape.

| Feature | Status | Notes |
|---------|--------|-------|
| Registration | ✅ PASS | |
| Product management | ✅ PASS | Can add/edit/delete products |
| Inventory tracking | ⚠️ PARTIAL | Stock field exists, no low-stock alerts yet |
| Multi-category products | ✅ PASS | Category field works |
| Cash register | ❌ MISSING | No quick POS/sale recording flow |
| Fiado (credit sales) | ❌ MISSING | Skill exists (yaya-fiados) but no backend |
| Supplier orders | ❌ MISSING | No purchase order flow |
| Daily cash reconciliation | ❌ MISSING | No cash flow tracking |

**Readiness**: 35% — Product catalog works. Missing core bodega operations: quick sales, fiados, cash tracking.

---

### 3. 💇‍♀️ Salón Bella María (Beauty Salon)
**Profile**: 3-chair salon in Miraflores. 2 stylists. Appointment-based. WhatsApp bookings.

| Feature | Status | Notes |
|---------|--------|-------|
| Registration | ✅ PASS | businessType="service" |
| Appointment booking | ❌ NOT CONNECTED | Cal.com not running, local DB fallback untested |
| Service catalog | ✅ PASS | Products work as services |
| Customer history | ❌ FAIL | Customer creation blocked on web |
| Reminder system | ⚠️ PARTIAL | Scheduler exists, needs WhatsApp connection |
| No-show tracking | ❌ MISSING | No appointment status tracking without Cal.com |
| Stylist assignment | ❌ MISSING | No employee/stylist management |
| Payment tracking | ⚠️ PARTIAL | Payment endpoints exist, Yape sync available |

**Readiness**: 25% — Service catalog works. Core salon feature (appointments) not functional without Cal.com or WhatsApp.

---

### 4. 🔧 Ferretería El Constructor (Hardware Store)
**Profile**: Construction supply store in Villa El Salvador. 500+ SKUs. B2B + B2C. Invoicing required.

| Feature | Status | Notes |
|---------|--------|-------|
| Registration | ✅ PASS | |
| Large product catalog | ✅ PASS | Products support categories, descriptions |
| Invoicing (SUNAT) | ❌ NOT CONNECTED | InvoiceShelf not running |
| Bulk pricing | ❌ MISSING | No quantity-based pricing |
| Credit accounts | ❌ MISSING | No B2B credit/fiado system |
| Purchase orders | ❌ MISSING | No supplier management |
| Delivery tracking | ❌ MISSING | Delivery service exists in code but not exposed |
| Tax calculation | ❌ NOT CONNECTED | Skill exists but no backend |

**Readiness**: 20% — Product catalog works. Missing critical features: invoicing, bulk pricing, credit accounts.

---

### 5. 👗 Tienda de Ropa Lucía (Clothing Store)
**Profile**: Women's clothing store in Gamarra. Instagram/WhatsApp sales. Yape-heavy.

| Feature | Status | Notes |
|---------|--------|-------|
| Registration | ✅ PASS | |
| Product catalog with images | ⚠️ PARTIAL | Upload endpoint exists, MinIO running |
| Order management | ❌ FAIL | No web order creation |
| WhatsApp sales conversation | ❌ BLOCKED | Needs WhatsApp + Hermes |
| Yape payment validation | ⚠️ UNTESTED | Endpoints exist, need Android app |
| Customer tagging | ❌ MISSING | Tags field exists in DB but no web UI |
| Shipping/delivery | ❌ MISSING | Karrio not deployed |
| Social media integration | ❌ MISSING | No Instagram/social connection |

**Readiness**: 25% — Product listing works. Core flow (WhatsApp → order → Yape → confirm) not operational.

---

## Summary: Critical Bugs & Blockers

### 🔴 Blockers (must fix to launch)

1. **WhatsApp QR pairing requires admin role** — Regular tenant owners can't connect WhatsApp via web dashboard. Only mobile API works. Fix: Change `/api/qr` from `requireAdmin` to `requireSession` with tenant-scoping.

2. **Missing web CRUD for customers & orders** — Web dashboard can only READ customers/orders, not CREATE. The mobile API has these endpoints but the web dashboard doesn't. Fix: Add POST routes to core customer/order routes.

3. **Hermes not running** — The AI agent bridge returns fallback errors. Without this, no conversational features work. Fix: Deploy an Hermes instance and set HERMES_API_URL.

4. **Spanish character slug generation** — "Pollería" becomes "poller-a", "Salón" becomes "sal-n". Breaks readability and could cause duplicates. Fix: Use proper transliteration (ñ→n, á→a, etc.).

### 🟡 High Priority (needed for first vertical)

5. **No appointment flow end-to-end** — Cal.com not deployed. The local fallback in appointment-service.ts is untested.

6. **No invoicing** — InvoiceShelf not deployed. Critical for any business that needs SUNAT compliance.

7. **No quick sale recording** — No POS-like "record a sale" flow. Products exist but there's no simple "I just sold 2 pollos" path.

8. **Tenant auto-start on WhatsApp connect** — When a new tenant scans QR, their WhatsApp worker should auto-start. Currently only pre-existing tenants auto-start.

### 🟢 Working Well

- Registration flow (both web and mobile)
- Multi-tenancy (data properly scoped by tenant_id)
- Product CRUD (full lifecycle via web API)
- Dashboard API (returns correct aggregate data)
- Mobile auth (JWT + refresh tokens)
- Subscription tracking (free plan auto-assigned)
- AI agent fallback (graceful error when Hermes unavailable)
- Debug logging (comprehensive structured logs)
- Systemd auto-restart (survives crashes and reboots)

---

## Recommended Launch Sequence

Based on this testing, here's the order of business types to target:

| Priority | Business Type | Why | Readiness | Blocker to Fix |
|----------|--------------|-----|-----------|---------------|
| 1 | **Pollería/Restaurant** | Product catalog works, high volume, clear ROI from WhatsApp orders | 60% | Web customer/order creation, WhatsApp QR for non-admins |
| 2 | **Tienda de Ropa** | WhatsApp-native sales already happening, Yape payments natural fit | 25% | WhatsApp + order flow + Yape validation |
| 3 | **Salón de Belleza** | Appointment booking is killer feature once Cal.com deployed | 25% | Cal.com deployment, appointment flow |
| 4 | **Bodega** | High SKU count works, but needs POS/quick-sale flow | 35% | Quick sale recording, fiado system |
| 5 | **Ferretería** | Needs invoicing + bulk pricing, heaviest requirements | 20% | InvoiceShelf, bulk pricing, credit accounts |

**Bottom line**: Fix the 4 blockers → pollerías and clothing stores are ready for pilot.
