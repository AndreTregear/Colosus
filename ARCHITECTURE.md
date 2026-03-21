# Yaya Platform Architecture

WhatsApp-native business operating system for LATAM micro/small businesses, powered by AI skills that compose MCP servers for data access.

## Directory Structure

```
yaya_platform/
├── skills/          # 36 AI business skills (SKILL.md + prompts)
├── services/        # 13 Docker services (slim wrappers + our code)
├── mcp-servers/     # 10 Model Context Protocol servers
├── autobot/         # WhatsApp AI bot (Baileys multi-tenant)
├── android/         # YapeReader payment interceptor app
├── research/        # 87 market/tech/strategy research docs
├── tests/           # PMF test personas + evaluation rounds
└── docs/            # Architecture, deployment, guides
```

## Core Architecture

```
User (WhatsApp) → Autobot (Baileys) → AI Skills → MCP Servers → Services/APIs
                                                       ↓
                                              PostgreSQL / ERPNext / Lago
```

## Skills (36)

Each skill is a focused AI capability for a specific business function. Skills compose MCP server tools to access data and take actions.

| Category | Skills |
|----------|--------|
| **Sales & CRM** | yaya-sales, yaya-crm, yaya-quotes, yaya-followup, yaya-notifications, yaya-loyalty, yaya-onboarding |
| **Money** | yaya-ledger, yaya-cash, yaya-expenses, yaya-billing, yaya-payments, yaya-commissions, yaya-payroll |
| **Credit** | yaya-fiados (informal B2C), yaya-credit (formal B2B) |
| **Inventory** | yaya-inventory, yaya-forecast, yaya-suppliers, yaya-production |
| **Logistics** | yaya-logistics, yaya-returns |
| **Scheduling** | yaya-appointments, yaya-memberships |
| **Analytics** | yaya-analytics |
| **Tax & Invoicing** | yaya-tax, yaya-tax-brazil, yaya-tax-colombia, yaya-tax-mexico |
| **Verticals** | yaya-bodega, yaya-restaurant, yaya-pharmacy |
| **Platform** | yaya-voice, yaya-meta, yaya-escalation, yaya-pix |

## MCP Servers (10)

| Server | Purpose | Skills Using |
|--------|---------|-------------|
| postgres-mcp | Query builder, index tuning, safe SQL | 33 |
| erpnext-mcp | Products, orders, invoices, stock (ERPNext API) | 26 |
| crm-mcp | Contacts, deals, interactions (Supabase) | 22 |
| whatsapp-mcp | Outbound WhatsApp messaging | 17 |
| lago-mcp | Subscriptions, metered billing (Lago API) | 5 |
| invoicing-mcp | Multi-country e-invoicing (Peru/Mexico/Colombia/Panama) | 4 |
| forex-mcp | Exchange rates, currency conversion, Peru SBS rates | 4 |
| appointments-mcp | Booking, calendar sync, Cal.com bridge | 2 |
| payments-mcp | Payment validation, matching, refunds | 2 |
| voice-mcp | Whisper STT + Kokoro TTS pipeline | 1 |

## Services (13)

### Our Code
| Service | Purpose |
|---------|---------|
| tts | Kokoro TTS server (GPU-accelerated, OpenAI-compatible API) |
| yape-listener | Yape payment webhook receiver |
| whisper | Whisper speech-to-text container |
| vllm | vLLM inference server (placeholder) |

### Upstream (slim Docker wrappers)
| Service | Upstream Image | Purpose |
|---------|---------------|---------|
| calcom | `calcom.docker.scarf.sh/calcom/cal.com` | Scheduling platform |
| metabase | `metabase/metabase` | Business intelligence |
| karrio | `karrio.docker.scarf.sh/karrio/server` | Shipping API (30+ carriers) |
| lago | `getlago/api` + `getlago/front` | Usage-based billing |
| erpnext | `frappe/erpnext` | ERP (config + images only) |
| nemo-guardrails | `nemoguardrails` (PyPI) | AI safety guardrails |
| invoiceshelf | `serversideup/php` | Invoice management |
| crm | `marmelab/atomic-crm` (built from upstream) | CRM dashboard |
| easyappointments | `alextselegidis/easyappointments` | Appointment UI |

## Mobile & Bot

- **autobot/** — Multi-tenant WhatsApp AI bot (Baileys). Handles conversations, orders, payments, product catalogs. Each tenant gets an isolated WhatsApp session.
- **android/** — YapeReader app. Intercepts Yape payment notifications on Android, syncs to backend. MVVM + Jetpack Compose, offline-first with Room DB.

## Data Flow

```
1. Customer sends WhatsApp message
2. Autobot receives via Baileys, routes to AI skill
3. Skill calls MCP server tools (query DB, create order, send message)
4. MCP servers interact with services (ERPNext, Lago, PostgreSQL)
5. Response flows back through WhatsApp

Payment flow:
1. Skill requests Yape payment → sends instructions via whatsapp-mcp
2. Customer pays via Yape app
3. YapeReader (Android) intercepts notification → POSTs to yape-listener
4. payments-mcp validates and confirms → skill sends confirmation
```
