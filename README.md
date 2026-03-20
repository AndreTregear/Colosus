# Yaya Platform

A conversational CEO assistant powered by OpenClaw that helps small businesses manage sales, leads, billing, and payments — all from WhatsApp.

## Architecture

```
Customer (WhatsApp/Telegram)
        │
        ▼
┌─ NemoClaw (OpenShell Sandbox) ──────────┐
│                                          │
│  OpenClaw Agent                          │
│  ├── Skills (sales, billing, CRM...)     │
│  ├── MCP Servers                         │
│  │   ├── ERPNext MCP (inventory, orders) │
│  │   ├── Atomic CRM MCP (contacts)       │
│  │   ├── Lago MCP (subscriptions)        │
│  │   └── Postgres MCP (direct queries)   │
│  └── Local LLM (Qwen3.5-27B)            │
│      + Whisper (voice transcription)     │
│                                          │
│  Policy: deny-by-default YAML            │
│  Privacy: all inference local             │
└──────────────────────────────────────────┘
        │
        ▼
┌─ Data Layer ────────────────────────────┐
│  ERPNext (ERP)    │  Atomic CRM         │
│  Lago (Billing)   │  PostgreSQL/Redis   │
│  MinIO (Media)    │                     │
└─────────────────────────────────────────┘
```

## Stack

| Layer | Technology | License |
|-------|-----------|---------|
| Security | NemoClaw + OpenShell | Apache 2.0 |
| Agent | OpenClaw | — |
| LLM | Qwen3.5-27B AWQ (local) | Apache 2.0 |
| Voice | faster-whisper large-v3-turbo (local GPU) | MIT |
| CRM | Atomic CRM (Supabase/Postgres) | MIT |
| ERP | ERPNext (Frappe Framework) | GPL |
| Billing | Lago | AGPL |
| Guardrails | NVIDIA NeMo Guardrails | Apache 2.0 |
| MCP Glue | Postgres MCP Pro + custom servers | Apache 2.0 |
| Channels | WhatsApp, Telegram (via OpenClaw) | — |

## Proprietary Components (the moat)

- **Payment Validator App** — Mobile app for Yape/Nequi/Plin payment confirmation
- **Business Insights App** — BI dashboards on mobile

## Structure

```
yaya_platform/
├── infra/              # Docker, NemoClaw policies, deploy scripts
│   ├── docker/         # docker-compose for full stack
│   ├── nemoclaw/       # OpenShell security policies (YAML)
│   └── scripts/        # Setup, deploy, backup scripts
├── services/           # Third-party services (git submodules)
│   ├── erpnext/        # ERPNext (Frappe)
│   ├── crm/            # Atomic CRM
│   ├── lago/           # Lago billing
│   ├── whisper/        # Whisper API service
│   └── vllm/           # vLLM config
├── mcp-servers/        # Custom MCP servers
│   ├── erpnext-mcp/    # ERPNext → MCP tools
│   ├── lago-mcp/       # Lago → MCP tools
│   └── crm-mcp/        # Atomic CRM → MCP tools
├── skills/             # OpenClaw agent skills
│   ├── yaya-sales/     # Conversational selling
│   ├── yaya-billing/   # Subscription & payment management
│   ├── yaya-crm/       # Customer relationship management
│   ├── yaya-analytics/ # Business insights & reporting
│   ├── yaya-inventory/ # Stock management & alerts
│   └── yaya-onboarding/# New business setup wizard
├── apps/               # Mobile applications
│   ├── payment-validator/
│   └── business-insights/
└── docs/               # Documentation
```

## Quick Start

```bash
# Clone with submodules
git clone --recursive git@github.com:AndreTregear/yaya_platform.git
cd yaya_platform

# Start everything
./infra/scripts/setup.sh

# Or with NemoClaw security
curl -fsSL https://nvidia.com/nemoclaw.sh | bash
nemoclaw onboard
```

## Development

See [docs/](docs/) for detailed setup guides.

## License

Platform code: MIT
Individual services retain their own licenses (see stack table above).
