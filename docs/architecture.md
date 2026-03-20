# Yaya Platform — Architecture

## Overview

Yaya Platform is a conversational CEO assistant that helps Latin American small businesses manage sales, leads, billing, and payments — all through WhatsApp and Telegram. Every component runs on-premise with no cloud dependencies for inference or data storage.

## System Architecture

```
                     ┌─────────────────────┐
                     │   Customer Device    │
                     │  WhatsApp / Telegram │
                     └─────────┬───────────┘
                               │
                               ▼
                ┌──────────────────────────────┐
                │      Messaging Gateway       │
                │  (OpenClaw Channel Adapter)   │
                └──────────────┬───────────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     ▼                     │
         │  ┌──────────────────────────────────────┐ │
         │  │        NemoClaw (OpenShell)           │ │
         │  │    Deny-by-default Security Sandbox   │ │
         │  │                                       │ │
         │  │  ┌─────────────────────────────────┐  │ │
         │  │  │       OpenClaw Agent Core        │  │ │
         │  │  │                                  │  │ │
         │  │  │  ┌───────────┐ ┌──────────────┐ │  │ │
         │  │  │  │  Skills   │ │  MCP Servers  │ │  │ │
         │  │  │  │           │ │              │ │  │ │
         │  │  │  │ • sales   │ │ • erpnext    │ │  │ │
         │  │  │  │ • billing │ │ • crm        │ │  │ │
         │  │  │  │ • crm     │ │ • lago       │ │  │ │
         │  │  │  │ • analytics│ │ • payments  │ │  │ │
         │  │  │  │ • inventory│ │ • postgres  │ │  │ │
         │  │  │  │ • onboard │ │              │ │  │ │
         │  │  │  └───────────┘ └──────┬───────┘ │  │ │
         │  │  │                       │         │  │ │
         │  │  └───────────────────────┼─────────┘  │ │
         │  │                          │            │ │
         │  │    policy.yaml enforced  │            │ │
         │  └──────────────────────────┼────────────┘ │
         │                             │              │
         │         Security Boundary   │              │
         └─────────────────────────────┼──────────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                    ▼                  ▼                  ▼
         ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
         │   AI Layer    │   │ Data Layer   │   │  Services    │
         │              │   │              │   │              │
         │ vLLM (GPU)   │   │ PostgreSQL   │   │ Lago API     │
         │ Qwen3.5-27B  │   │ Redis        │   │ Lago Worker  │
         │              │   │ MinIO        │   │ Lago UI      │
         │ Whisper (GPU)│   │              │   │              │
         │ large-v3-turbo│  │              │   │ Supabase     │
         └──────────────┘   └──────────────┘   │ (Atomic CRM) │
                                                └──────────────┘
```

## Component Details

### AI Layer

```
┌──────────────────────────────────────────────────────────┐
│                      AI Layer (GPU)                       │
│                                                           │
│  ┌────────────────────────┐  ┌─────────────────────────┐ │
│  │  vLLM                  │  │  Whisper                 │ │
│  │                        │  │                          │ │
│  │  Model: Qwen3.5-27B   │  │  Model: large-v3-turbo   │ │
│  │  Quant: AWQ Marlin     │  │  Compute: int8           │ │
│  │  TP Size: 2 GPUs       │  │  Device: cuda (GPU 0)    │ │
│  │  Context: 32768 tok    │  │  Language: es             │ │
│  │  Prefix caching: on    │  │                          │ │
│  │  Tool calling: auto    │  │  Port: 9100              │ │
│  │                        │  │  POST /transcribe        │ │
│  │  Port: 8000            │  │  GET  /health            │ │
│  │  OpenAI-compatible API │  │                          │ │
│  └────────────────────────┘  └─────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

- **vLLM** serves Qwen3.5-27B-AWQ via an OpenAI-compatible API on port 8000. Uses tensor parallelism across 2 GPUs with prefix caching for repeated conversation contexts. Native tool-calling support via `qwen3_coder` parser enables the agent to invoke MCP tools directly.

- **Whisper** (faster-whisper) transcribes Spanish voice notes from WhatsApp. Runs on GPU 0 with int8 quantization. The Flask server accepts audio files and returns transcribed text.

### MCP Server Layer

```
┌──────────────────────────────────────────────────────────┐
│                    MCP Servers (stdio)                     │
│                                                           │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐ │
│  │ erpnext-mcp  │ │   crm-mcp    │ │    lago-mcp      │ │
│  │              │ │              │ │                  │ │
│  │ search_prods │ │ search_cont  │ │ get_subscription │ │
│  │ get_product  │ │ get_contact  │ │ list_invoices    │ │
│  │ check_stock  │ │ create_cont  │ │ create_event     │ │
│  │ create_order │ │ update_cont  │ │ get_plan         │ │
│  │ get_order    │ │ log_interact │ │                  │ │
│  │ list_cust    │ │ list_deals   │ │                  │ │
│  └──────┬───────┘ └──────┬───────┘ └────────┬─────────┘ │
│         │                │                   │           │
│  ┌──────┴───────┐ ┌──────┴───────┐ ┌────────┴─────────┐ │
│  │ payments-mcp │ │ postgres-mcp │ │                   │ │
│  │              │ │              │ │                   │ │
│  │ submit_proof │ │ SQL queries  │ │                   │ │
│  │ check_status │ │ Index tuning │ │                   │ │
│  │ list_pending │ │ Health check │ │                   │ │
│  └──────────────┘ └──────────────┘ └───────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

MCP (Model Context Protocol) servers expose business system APIs as structured tools that the LLM can call. All servers use stdio transport within the NemoClaw sandbox.

### Data Layer

```
┌──────────────────────────────────────────────────────────┐
│                       Data Layer                          │
│                                                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │  PostgreSQL 16 (port 5432)                         │  │
│  │                                                     │  │
│  │  Databases:                                         │  │
│  │    yaya     — Agent workspace, conversations,       │  │
│  │              payment validations, client schemas    │  │
│  │    lago_db  — Lago billing data                    │  │
│  │    crm_db   — Shared CRM data                      │  │
│  │                                                     │  │
│  │  Schemas per client: client_{slug}/                │  │
│  └────────────────────────────────────────────────────┘  │
│                                                           │
│  ┌──────────────────────┐  ┌──────────────────────────┐  │
│  │  Redis 7 (port 6379) │  │  MinIO (ports 9000/9001) │  │
│  │                       │  │                          │  │
│  │  • Conversation cache │  │  Buckets:                │  │
│  │  • Lago Sidekiq queue │  │    lago/     invoices    │  │
│  │  • Rate limiting      │  │    media/    voice notes │  │
│  │  • Session store      │  │    backups/  DB dumps    │  │
│  └──────────────────────┘  └──────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### Business Services

```
┌──────────────────────────────────────────────────────────┐
│                   Business Services                       │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  Lago Billing                                        │ │
│  │                                                      │ │
│  │  lago-api    (port 3001)  Rails API                 │ │
│  │  lago-worker              Sidekiq background jobs   │ │
│  │  lago-front  (port 8080)  React admin dashboard     │ │
│  │                                                      │ │
│  │  Manages: subscriptions, invoices, usage metering   │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  Supabase Stack (Atomic CRM)                         │ │
│  │                                                      │ │
│  │  supabase-db       (port 54322)  PostgreSQL 15      │ │
│  │  supabase-auth                   GoTrue auth        │ │
│  │  supabase-rest     (port 54321)  PostgREST API      │ │
│  │  supabase-realtime               WebSocket changes  │ │
│  │  supabase-studio   (port 54323)  Admin dashboard    │ │
│  │  supabase-meta                   DB metadata API    │ │
│  │                                                      │ │
│  │  Manages: contacts, companies, deals, activities    │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

### Security Model

```
┌──────────────────────────────────────────────────────────┐
│             NemoClaw Security (policy.yaml)                │
│                                                           │
│  ┌─────────────────┐  ┌────────────────────────────────┐ │
│  │ Network Policy   │  │  Filesystem Policy             │ │
│  │                  │  │                                │ │
│  │ ALLOW:           │  │  ALLOW:                        │ │
│  │  localhost:8000  │  │   /app/workspace  (rw)         │ │
│  │  localhost:9100  │  │   /tmp            (rw)         │ │
│  │  localhost:5432  │  │   /app/skills     (ro)         │ │
│  │  localhost:6379  │  │   /app/mcp-servers (ro)        │ │
│  │  localhost:9000  │  │                                │ │
│  │  localhost:3001  │  │  DENY: *                       │ │
│  │  localhost:8080  │  └────────────────────────────────┘ │
│  │  localhost:54321 │                                     │
│  │  localhost:54323 │  ┌────────────────────────────────┐ │
│  │  localhost:3002  │  │  Inference Policy              │ │
│  │                  │  │                                │ │
│  │ DENY: *          │  │  local_only: true              │ │
│  │ (no internet)    │  │  PII stripping: enabled        │ │
│  └─────────────────┘  │  Cloud fallback: disabled      │ │
│                        └────────────────────────────────┘ │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  Content Safety                                      │ │
│  │                                                      │ │
│  │  • PII detection + masking                          │ │
│  │  • Topic control (sales-related only)               │ │
│  │  • Credential guard (never output secrets)          │ │
│  │  • Blocked: politics, religion, internal data       │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

## Port Map

| Port  | Service            | Protocol | Description                    |
|-------|--------------------|----------|--------------------------------|
| 5432  | PostgreSQL         | TCP      | Main database (yaya, lago, crm)|
| 6379  | Redis              | TCP      | Cache, queues, sessions        |
| 8000  | vLLM               | HTTP     | OpenAI-compatible LLM API      |
| 8080  | Lago Frontend      | HTTP     | Billing admin dashboard         |
| 9000  | MinIO API          | HTTP     | S3-compatible object storage    |
| 9001  | MinIO Console      | HTTP     | MinIO admin dashboard           |
| 9100  | Whisper            | HTTP     | Voice transcription API         |
| 3001  | Lago API           | HTTP     | Billing REST API                |
| 3002  | Payment Validator  | HTTP     | Mobile app webhook (planned)   |
| 54321 | Supabase REST      | HTTP     | PostgREST API for CRM          |
| 54322 | Supabase DB        | TCP      | CRM PostgreSQL instance        |
| 54323 | Supabase Studio    | HTTP     | CRM admin dashboard            |

## Multi-Tenant Architecture

Each business client gets an isolated schema within the main PostgreSQL database:

```
PostgreSQL (yaya database)
├── public/            # Shared platform tables
├── agent/             # Core agent tables (conversations, messages, payments)
├── client_tienda_maria/   # Client: Tienda Maria
│   ├── config
│   ├── conversations
│   └── messages
├── client_bodega_juan/    # Client: Bodega Juan
│   ├── config
│   ├── conversations
│   └── messages
└── ...
```

Each client also gets:
- A dedicated NemoClaw policy (extends base policy)
- A SOUL.md personality configuration
- Copies of relevant skills with client-specific configuration
- An API key for authentication

## Data Flow: Customer Message

```
1. Customer sends WhatsApp message
   │
2. OpenClaw receives via channel adapter
   │
3. NemoClaw sandbox validates the request
   │
4. Agent loads SOUL.md + active skill (yaya-sales)
   │
5. Message → vLLM (Qwen3.5-27B) with tool definitions
   │
6. LLM decides to call tool (e.g., search_products)
   │
7. MCP server executes against ERPNext API
   │
8. Tool result → back to LLM for response generation
   │
9. LLM generates natural language response
   │
10. NemoClaw content safety filters applied
    │
11. Response sent back via WhatsApp
```

## Data Flow: Voice Note

```
1. Customer sends voice note via WhatsApp
   │
2. OpenClaw receives audio file
   │
3. Audio → Whisper API (POST /transcribe)
   │
4. Whisper returns Spanish text transcription
   │
5. Transcribed text enters normal message flow (step 4 above)
```

## Data Flow: Payment Validation

```
1. Customer sends payment screenshot via WhatsApp
   │
2. Agent stores screenshot in MinIO (media/ bucket)
   │
3. Agent creates payment_validation record (status: pending)
   │
4. Payment Validator mobile app polls for pending validations
   │
5. Business owner confirms/rejects on mobile app
   │
6. Status updated → agent notifies customer
```

## Technology Stack

| Layer        | Technology                     | Version   | License    |
|-------------|-------------------------------|-----------|------------|
| Security     | NemoClaw + OpenShell           | —         | Apache 2.0 |
| Agent        | OpenClaw                       | —         | Proprietary|
| LLM          | Qwen3.5-27B AWQ (via vLLM)    | latest    | Apache 2.0 |
| Voice        | faster-whisper large-v3-turbo  | latest    | MIT        |
| CRM          | Atomic CRM (Supabase)          | latest    | MIT        |
| ERP          | ERPNext (Frappe)               | v15       | GPL        |
| Billing      | Lago                           | v1.20.1   | AGPL       |
| Guardrails   | NVIDIA NeMo Guardrails         | latest    | Apache 2.0 |
| MCP          | Postgres MCP + custom servers  | latest    | Apache 2.0 |
| Database     | PostgreSQL                     | 16-alpine | PostgreSQL |
| Cache        | Redis                          | 7-alpine  | BSD        |
| Storage      | MinIO                          | latest    | AGPL       |
| Channels     | WhatsApp, Telegram             | —         | Via OpenClaw|

## Hardware Requirements

### Minimum (Development)
- 2x NVIDIA GPU (24GB+ VRAM each, e.g., RTX 4090)
- 64GB RAM
- 500GB SSD
- 8-core CPU

### Recommended (Production at c.yaya.sh)
- 2x NVIDIA A100 80GB (or equivalent)
- 128GB RAM
- 1TB NVMe SSD
- 16-core CPU
- Redundant network connectivity
