# Yaya Platform

AI-powered business operating system for Latin American micro-businesses. Yaya turns WhatsApp — the channel 40M+ small businesses already use — into a complete business management tool: sales, inventory, payments, invoicing, scheduling, analytics, and more.

Everything runs on your own infrastructure. Local AI inference means your data never leaves your servers.

## Architecture

```
                         ┌─────────────────────────────┐
                         │        WhatsApp Users        │
                         │   (Customers & Merchants)    │
                         └─────────────┬───────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                     Autobot (Port 3000)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │
│  │ WhatsApp │  │   REST   │  │   Web    │  │   AI Engine    │  │
│  │ Gateway  │  │   API    │  │Dashboard │  │  (Hermes)    │  │
│  │(Baileys) │  │(Express) │  │  (HTML)  │  │ 38 Skills      │  │
│  └────┬─────┘  └────┬─────┘  └──────────┘  │ 10 MCP Servers │  │
│       │              │                       └───────┬────────┘  │
│       └──────┬───────┘                               │           │
│              ▼                                       ▼           │
│  ┌───────────────────┐                   ┌───────────────────┐  │
│  │   BullMQ/Redis    │                   │   Hermes        │  │
│  │  (Job Processing) │                   │ (Tenant Sandbox)  │  │
│  └───────────────────┘                   └───────────────────┘  │
└──────────────────────────────────┬───────────────────────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              ▼                    ▼                     ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   Data Layer     │  │ Business Services│  │   AI Layer       │
│                  │  │                  │  │   (GPU Host)     │
│ PostgreSQL 16    │  │ Lago (Billing)   │  │                  │
│ Redis 7          │  │ Cal.com (Sched.) │  │ vLLM/Qwen 27B   │
│ MinIO (S3)       │  │ Metabase (BI)    │  │ Whisper (STT)    │
│                  │  │ InvoiceShelf     │  │ Kokoro (TTS)     │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

## Quick Start

```bash
# Clone and configure
git clone <repo-url> && cd yaya_platform
cp .env.example .env
# Edit .env — set BETTER_AUTH_SECRET, passwords, AI endpoints

# Start everything
docker compose -f docker-compose.prod.yml --env-file .env up -d

# Dashboard: http://localhost:3000
# Admin login: ADMIN_EMAIL / ADMIN_PASSWORD from .env
```

For local development of Autobot:

```bash
cd autobot && npm install && npx tsx src/index.ts
```

## Documentation

| Document | Description |
|----------|-------------|
| [Contributing Guide](CONTRIBUTING.md) | Setup, architecture, how to add features, code conventions |
| [Architecture](docs/ARCHITECTURE.md) | System design, data flow, multi-tenancy model |
| [API Reference](docs/API.md) | Full REST API — 100+ endpoints grouped by auth type |
| [OSS Stack](docs/OSS-STACK.md) | Every open-source project we integrate with |
| [Skills Guide](docs/SKILLS.md) | The 38 AI skills and how to create new ones |
| [Security Model](docs/SECURITY.md) | Auth, encryption, tenant isolation, privacy |
| [Deployment](docs/deployment.md) | Production deployment guide |
| [MCP Servers](docs/mcp-servers.md) | MCP server development and integration |
| [Autobot Agent Guide](autobot/AGENTS.md) | AI agent instructions for working in the codebase |

## 38 AI Skills

Organized by business domain:

**Sales & CRM:** sales, crm, followup, notifications, escalation, loyalty, quotes
**Finance:** payments, billing, expenses, ledger, cash, fiados, credit, pix, commissions
**Tax & Compliance:** tax (Peru/SUNAT), tax-colombia (DIAN), tax-brazil (SEFAZ), tax-mexico (SAT)
**Operations:** inventory, suppliers, returns, logistics, forecast, production
**Scheduling:** appointments, memberships, payroll
**Analytics:** analytics, forecast
**Platform:** meta (self-sales), onboarding
**Industry:** bodega, restaurant, salon, pharmacy, agro

## Tech Stack

| Layer | Technology | License |
|-------|-----------|---------|
| Language model | Qwen3.5-27B via vLLM | Apache 2.0 |
| Speech-to-text | Whisper | MIT |
| Text-to-speech | Kokoro | Apache 2.0 |
| WhatsApp | Baileys | MIT |
| Billing | Lago | AGPLv3 |
| Scheduling | Cal.com | AGPLv3 |
| Analytics | Metabase | AGPLv3 |
| Invoicing | InvoiceShelf | AGPLv3 |
| Database | PostgreSQL 16 | PostgreSQL License |
| Queue/Cache | Redis 7 | BSD 3-Clause |
| Object Storage | MinIO | AGPLv3 |
| Reverse Proxy | Caddy | Apache 2.0 |
| Auth | Better Auth | MIT |
| Job Queue | BullMQ | MIT |

## Screenshots

*Coming soon*

## Acknowledgments

Yaya Platform is built entirely on open-source software. We are deeply grateful to:

- **[PostgreSQL](https://postgresql.org)** — The world's most advanced open-source database
- **[Redis](https://redis.io)** — In-memory data store powering our real-time processing
- **[MinIO](https://min.io)** — S3-compatible object storage without cloud lock-in
- **[Lago](https://getlago.com)** — Open-source billing that makes subscription management simple
- **[Cal.com](https://cal.com)** — Scheduling infrastructure for the world
- **[Metabase](https://metabase.com)** — Business intelligence for everyone
- **[InvoiceShelf](https://invoiceshelf.com)** — Clean, flexible invoicing
- **[vLLM](https://vllm.ai)** — High-throughput LLM serving with PagedAttention
- **[Qwen](https://qwen.readthedocs.io)** — Exceptional multilingual language model (Alibaba Cloud)
- **[Whisper](https://github.com/openai/whisper)** — Robust speech recognition (OpenAI)
- **[Kokoro](https://github.com/hexgrad/kokoro)** — Natural text-to-speech synthesis
- **[Baileys](https://github.com/WhiskeySockets/Baileys)** — WhatsApp Web API for Node.js
- **[Better Auth](https://better-auth.com)** — TypeScript-first authentication
- **[BullMQ](https://bullmq.io)** — Reliable Redis-based job queues
- **[Caddy](https://caddyserver.com)** — Automatic HTTPS reverse proxy
- **[Pino](https://getpino.io)** — High-performance Node.js logging
- **[Zod](https://zod.dev)** — TypeScript-first schema validation

And to every contributor and maintainer behind these projects. You make platforms like Yaya possible.

## License

See [LICENSE](LICENSE) for details.
