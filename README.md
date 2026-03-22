# Yaya Platform

**The AI-powered business operating system for Latin American micro-enterprises.**

Full business management — billing, invoicing, scheduling, analytics, payments, inventory — all through WhatsApp conversations in Spanish.

## The Problem

40 million small businesses across Latin America manage everything through WhatsApp messages and paper notebooks. The corner store owner tracks sales on a notepad. The salon books appointments via text. The restaurant counts inventory by memory. Traditional ERP software is too expensive, too complex, and requires a computer most don't have.

## The Solution

An AI agent that lives inside WhatsApp and orchestrates a full suite of open-source business tools — all through natural conversation in Spanish.

The business owner scans a QR code, and Yaya becomes their AI-powered business manager:

- **"Yaya, registra una venta de 3 cervezas"** → Records the sale, updates inventory, generates receipt
- **"Cuanto vendimos esta semana?"** → Pulls analytics, sends a chart via WhatsApp
- **"Agenda una cita para Maria manana a las 3"** → Books the appointment, sends confirmation
- **"Manda la factura al cliente"** → Generates SUNAT-compliant invoice, delivers via WhatsApp
- *(sends voice note)* → Transcribes, processes, responds with voice

## Architecture

ONE unified app (Autobot) serves everything: landing page, merchant dashboard, mobile API, WhatsApp gateway, and AI agent.

```
User → WhatsApp / Web / Android
         │
         ▼
    Autobot (Express, port 3000)         ← yaya.sh
    ├── WhatsApp Gateway (Baileys, multi-tenant)
    ├── Landing Page (/)
    ├── Merchant Dashboard (/dashboard)
    ├── Admin Panel (/admin)
    ├── Customer Portal (/customer)
    ├── Mobile API (/api/v1/mobile/*)
    ├── REST API (/api/*)
    └── AI Bridge → OpenClaw Agent
                    ├── 38 Skills (markdown)
                    ├── MCP Servers → Backend Services
                    └── NemoClaw (tenant isolation)
```

**Routing**: `yaya.sh` serves the landing page on port 3000. `cx.yaya.sh` routes to the same app (nginx → 3000).

**AI**: All intelligence is delegated to OpenClaw via HTTP. Autobot is stateless — it sends tenant context and gets responses back. NemoClaw enforces tenant data isolation within OpenClaw.

**Dashboard**: Each merchant gets a full business dashboard at `/dashboard` with analytics, product/order/customer CRUD, payment management, AI chat, and settings.

**Onboarding flow**: Register → Login → Scan QR → AI configures business → Start selling.

## Tech Stack

| Component | Technology | Purpose | License |
|-----------|-----------|---------|---------|
| AI Agent | Autobot (Node.js + Baileys) | WhatsApp bot, message processing, web dashboard | MIT |
| LLM | Qwen3.5-27B AWQ via vLLM | Natural language understanding, tool calling | Apache 2.0 |
| Speech-to-Text | faster-whisper large-v3-turbo | Voice note transcription (Spanish) | MIT |
| Text-to-Speech | Kokoro 82M via kokoro-web | Voice replies in WhatsApp | Apache 2.0 |
| Billing | Lago | Subscriptions, usage metering, invoicing | AGPL |
| Invoicing | InvoiceShelf | Detailed invoices, estimates, SUNAT compliance | AGPL |
| Scheduling | Cal.com | Appointments, calendar, availability | AGPL / EE |
| Analytics | Metabase | BI dashboards, SQL analytics, reports | AGPL |
| MCP Glue | 10 custom MCP servers | Bridge AI to backend services | MIT |
| Database | PostgreSQL 16 | Shared multi-tenant data store | PostgreSQL |
| Cache | Redis 7 | Job queues, session cache, rate limiting | BSD |
| Storage | MinIO | S3-compatible file/media storage | AGPL |
| Reverse Proxy | Caddy 2 | Automatic HTTPS, TLS termination | Apache 2.0 |
| *Phase 2* | ERPNext | Full ERP (inventory, manufacturing, HR) | GPL |
| *Phase 2* | Karrio | Universal shipping API, label generation | Apache 2.0 |
| AI Safety | NemoClaw | Tenant isolation, PII filtering, content guardrails | Apache 2.0 |

## The 38 Skills

The AI agent has 38 specialized business skills, each with domain-specific prompts and MCP tool access:

### Sales & CRM
| Skill | What it does |
|-------|-------------|
| `yaya-sales` | Conversational selling, product recommendations, order taking |
| `yaya-crm` | Customer relationship management, contact tracking |
| `yaya-followup` | Automated follow-ups, re-engagement campaigns |
| `yaya-loyalty` | Loyalty programs, points, rewards |
| `yaya-quotes` | Price quotes, proposals, negotiations |

### Finance & Payments
| Skill | What it does |
|-------|-------------|
| `yaya-billing` | Subscription management, payment tracking |
| `yaya-payments` | Yape/Plin/bank transfer validation |
| `yaya-pix` | Brazil Pix payment processing |
| `yaya-cash` | Cash flow tracking, daily reconciliation |
| `yaya-expenses` | Expense recording, categorization |
| `yaya-ledger` | General ledger, double-entry bookkeeping |
| `yaya-fiados` | Credit sales tracking (Latin American "fiado" system) |
| `yaya-credit` | Customer credit management, limits |
| `yaya-commissions` | Sales commission calculation |
| `yaya-payroll` | Employee payroll processing |

### Tax & Compliance
| Skill | What it does |
|-------|-------------|
| `yaya-tax` | Tax calculation, reporting (Peru/SUNAT) |
| `yaya-tax-brazil` | Brazilian tax compliance (NF-e, ICMS) |
| `yaya-tax-colombia` | Colombian tax compliance (DIAN) |
| `yaya-tax-mexico` | Mexican tax compliance (SAT/CFDI) |

### Operations & Inventory
| Skill | What it does |
|-------|-------------|
| `yaya-inventory` | Stock tracking, low-stock alerts, reorder |
| `yaya-production` | Production planning, batch tracking |
| `yaya-suppliers` | Supplier management, purchase orders |
| `yaya-logistics` | Shipping, delivery tracking |
| `yaya-returns` | Returns processing, refunds |
| `yaya-bodega` | Warehouse management, storage locations |

### Scheduling & Communication
| Skill | What it does |
|-------|-------------|
| `yaya-appointments` | Appointment booking via Cal.com |
| `yaya-memberships` | Membership plans, recurring services |
| `yaya-notifications` | Automated notifications, reminders |
| `yaya-escalation` | Escalation to human operator |
| `yaya-voice` | Voice note processing, voice replies |

### Analytics & Intelligence
| Skill | What it does |
|-------|-------------|
| `yaya-analytics` | Business insights, KPI dashboards |
| `yaya-forecast` | Demand forecasting, trend analysis |
| `yaya-meta` | Meta-skill: routing, context management |
| `yaya-onboarding` | New business setup wizard |

### Industry-Specific
| Skill | What it does |
|-------|-------------|
| `yaya-restaurant` | Menu management, table orders, kitchen flow |
| `yaya-pharmacy` | Medication inventory, prescriptions, expiry tracking |
| `yaya-salon` | Appointment + stylist management, service catalog |
| `yaya-agro` | Agricultural supply tracking, harvest cycles |

## Quick Start

### Prerequisites
- Docker + Docker Compose v2
- GPU host running vLLM, Whisper, Kokoro TTS (separate machine or same host)

### Deploy

```bash
git clone https://github.com/AetheriumLabs/yaya_platform.git
cd yaya_platform

# Configure
cp .env.example .env
# Edit .env — set passwords, AI endpoints, domain

# Launch everything
docker compose -f docker-compose.prod.yml up -d

# Check status
docker compose -f docker-compose.prod.yml ps
```

That's it. One command brings up the autobot, Lago billing, InvoiceShelf, Cal.com, Metabase, PostgreSQL, Redis, MinIO, and Caddy with automatic HTTPS.

### First-time Setup (Onboarding)

1. Open `https://your-domain.com` → landing page
2. Click "Registrarse" → create account (email + business name)
3. Log in → redirected to `/dashboard`
4. Go to "Agente Chat" → scan WhatsApp QR code
5. AI auto-configures your business (products, pricing, hours)
6. Customers message your WhatsApp number → Yaya handles conversations
7. Monitor everything from the dashboard: sales, orders, payments, analytics

## How It Works

```
1. Business owner signs up via web dashboard
2. Scans QR code → WhatsApp connection established (Baileys)
3. AI sets up their business: products, pricing, payment methods
4. Customers message the WhatsApp number
5. AI handles the conversation:
   ├── Understands intent (sale, question, appointment, complaint)
   ├── Calls MCP tools (query DB, create invoice, book slot)
   ├── Processes payments (Yape screenshot → validation → confirmation)
   └── Responds in natural Peruvian/LATAM Spanish
6. Business owner gets daily summaries, alerts, analytics via WhatsApp
```

## MCP Server Integration

The AI agent uses [Model Context Protocol](https://modelcontextprotocol.io) (MCP) to safely interact with backend services. Each MCP server exposes a set of tools the LLM can call:

| MCP Server | Backend Service | Key Tools |
|-----------|----------------|-----------|
| `postgres-mcp` | PostgreSQL | SQL queries, index tuning, health checks |
| `lago-mcp` | Lago | get_subscription, list_invoices, create_event |
| `crm-mcp` | PostgreSQL | search_contacts, create_contact, log_interaction |
| `payments-mcp` | PostgreSQL + MinIO | submit_proof, check_status, list_pending |
| `voice-mcp` | Whisper + Kokoro | transcribe_audio, synthesize_speech, voice_reply |
| `whatsapp-mcp` | Baileys | send_message, send_media, send_template |
| `appointments-mcp` | Cal.com | create_booking, list_slots, cancel_booking |
| `invoicing-mcp` | InvoiceShelf | create_invoice, send_invoice, list_invoices |
| `forex-mcp` | Exchange rate APIs | convert_currency, get_rate |
| `erpnext-mcp` | ERPNext (Phase 2) | search_products, create_order, check_stock |

## The Moat

**Local LLM inference** — All AI processing happens on-premise. No data leaves the server. This gives us privacy compliance (critical for financial data in LATAM), predictable costs ($0 per inference after hardware), and independence from API providers.

**Cultural fluency** — The AI speaks natural Peruvian/LATAM Spanish, understands local business customs (fiados, yape, bodegas), and handles country-specific tax compliance (SUNAT, DIAN, SAT).

**WhatsApp-native UX** — No app to download, no website to learn. The business owner already lives in WhatsApp. We meet them there.

**Open-source stack** — Every backend service is open-source. No vendor lock-in. The platform can be self-hosted on a single machine.

## Port Map

| Port | Service | Routes | Description |
|------|---------|--------|-------------|
| 80/443 | Caddy | `yaya.sh`, `cx.yaya.sh` | HTTPS reverse proxy |
| 3000 | Autobot | `/`, `/dashboard`, `/admin`, `/customer`, `/api/*` | Unified platform (landing + dashboard + API + WhatsApp) |
| 3001 | Lago API | | Billing REST API |
| 3002 | Cal.com | | Scheduling UI |
| 3003 | Metabase | | Analytics dashboards |
| 5432 | PostgreSQL | | Database |
| 6379 | Redis | | Cache + queues |
| 8080 | Lago Frontend | | Billing admin UI |
| 8090 | InvoiceShelf | | Invoice management UI |
| 9000 | MinIO API | | Object storage |
| 9001 | MinIO Console | | Storage admin UI |
| 8000* | vLLM | | LLM API (GPU host) |
| 9100* | Whisper | | Speech-to-text (GPU host) |
| 9200* | Kokoro TTS | | Text-to-speech (GPU host) |

*\* GPU services run on separate host*

## Project Structure

```
yaya_platform/
├── autobot/                 # THE unified platform (Node.js + Express)
│   └── src/web/public/
│       ├── index.html       # Landing page (yaya.sh)
│       ├── dashboard/       # Merchant dashboard SPA
│       ├── admin/           # Admin panel
│       └── customer/        # Customer portal
├── android/                 # Android app (Kotlin, Jetpack Compose)
├── skills/                  # 38 AI business skills (prompt + MCP config)
├── mcp-servers/             # 10 MCP servers bridging AI to services
├── infra/                   # Infrastructure configs
│   ├── nemoclaw/            # NemoClaw tenant isolation policies
│   ├── docker/              # Shared docker-compose, init-db.sql
│   └── scripts/             # Setup, deploy, backup
├── services/                # Third-party service configs (Lago, Cal.com, etc.)
├── docs/                    # Architecture, deployment guides
├── docker-compose.prod.yml  # Full production stack (one command)
└── deploy.sh                # Deploy to production
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — System design, data flow, multi-tenancy, security
- [Deployment](docs/deployment.md) — Production deployment guide
- [MCP Servers](docs/mcp-servers.md) — MCP server development guide
- [Skills Guide](docs/skills-guide.md) — How to create and configure AI skills
- [Invoicing Spec](docs/invoicing-technical-spec.md) — Multi-country invoicing technical spec
- [Appointments](docs/appointments-guide.md) — Cal.com integration guide

## License

Platform code (autobot, MCP servers, skills): **MIT**

Individual services retain their own licenses — see the tech stack table above.
