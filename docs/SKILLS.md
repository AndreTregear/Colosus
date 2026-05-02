# Skills System

Skills are the core abstraction that defines what the AI agent can do. Each skill is a markdown file that configures the agent's persona, capabilities, knowledge, and constraints for a specific business domain.

## How Skills Work

1. **Definition:** Each skill is a `SKILL.md` file inside `skills/yaya-{name}/`
2. **Loading:** Hermes reads skill files and injects them into the AI agent's system prompt
3. **Activation:** Skills are activated contextually based on the conversation topic
4. **Tools:** Skills reference MCP servers and AI tools they need access to
5. **Constraints:** Skills define what the agent can and cannot do (safety boundaries)

## How Skills Connect to MCP Servers

Skills declare which MCP servers they need. When a skill is active, the AI agent gains access to tools provided by those MCP servers:

```
Skill (SKILL.md)
  → declares: needs postgres-mcp, payments-mcp
  → Hermes grants access to those MCP server tools
  → AI agent can call: query_database, confirm_payment, etc.
```

Common MCP server usage by skills:
- **postgres-mcp** — Used by 33+ skills for database queries
- **payments-mcp** — yaya-payments, yaya-sales, yaya-billing
- **appointments-mcp** — yaya-appointments, yaya-salon
- **invoicing-mcp** — yaya-tax, yaya-tax-colombia, yaya-tax-brazil, yaya-tax-mexico
- **lago-mcp** — yaya-billing, yaya-memberships
- **crm-mcp** — yaya-crm, yaya-followup, yaya-notifications
- **whatsapp-mcp** — yaya-notifications, yaya-followup
- **voice-mcp** — Used when processing voice messages
- **forex-mcp** — yaya-payments, yaya-pix, multi-currency skills

## Complete Skill List (38 Skills)

### Sales & Customer Management

| Skill | Description |
|-------|-------------|
| **yaya-sales** | Conversational Sales Agent — WhatsApp-first product discovery, order creation, payment guidance for LATAM small businesses |
| **yaya-crm** | Customer Relationship Management — Full customer lifecycle via Atomic CRM: auto-contact creation, interaction logging, purchase history, segmentation |
| **yaya-followup** | Proactive Outreach & Follow-ups — Abandoned conversation recovery, payment reminders, restock notifications, birthday messages |
| **yaya-notifications** | Bulk Notifications & Outreach Campaigns — Restock alerts, promotional campaigns, segmented messaging, opt-out management |
| **yaya-escalation** | Human Escalation & Handoff — Detects frustration or complexity, performs graceful handoff to business owner or human agent |
| **yaya-loyalty** | Loyalty Programs & Referrals — Points-based loyalty, referral tracking, rewards management |
| **yaya-quotes** | Proposal & Quote Management — Generate and send price quotes, track acceptance, convert to orders |

### Finance & Payments

| Skill | Description |
|-------|-------------|
| **yaya-payments** | Payment Validation & Confirmation — OCR for Yape/Nequi/Plin screenshots, auto-confirms orders, reconciliation |
| **yaya-billing** | Subscription & Billing Management — Manages Yaya's own B2B billing via Lago: plans, upgrades, invoicing, dunning |
| **yaya-expenses** | Expense Tracking & Profit Calculation — Chat-based expense logging, P&L calculations, receipt OCR, recurring expenses |
| **yaya-ledger** | Simplified Daily Sales & Cash Ledger — Ultra-simple sales tracking for micro-retailers who don't use POS systems |
| **yaya-cash** | Cash Box & Float Management — Opening float, denomination tracking, change optimization, daily reconciliation |
| **yaya-fiados** | Informal Credit Tab Tracking (Cuaderno de Fiados) — Digitizes paper credit notebooks used across LATAM: tracks debts, partial payments, aging reports |
| **yaya-credit** | Customer Credit & Buy-Now-Pay-Later — Installment plans, credit limits, payment scheduling |
| **yaya-pix** | Pix Payment Integration (Brazil) — Brazilian Pix instant payment validation and reconciliation |
| **yaya-commissions** | Sales Commissions & Agent Payouts — Commission tracking, multi-tier structures, payout calculations |

### Tax & Compliance

| Skill | Description |
|-------|-------------|
| **yaya-tax** | Tax Compliance & Invoicing (Peru/SUNAT) — Invoice generation, RUC/DNI validation, IGV calculation, monthly declarations, deadline reminders |
| **yaya-tax-colombia** | Colombian Tax Compliance (DIAN) — Facturas electrónicas, NIT validation, IVA/retefuente, regime guidance |
| **yaya-tax-brazil** | Brazilian Tax Compliance (SEFAZ) — Nota Fiscal Eletrônica, CPF/CNPJ validation, ICMS/ISS/PIS/COFINS |
| **yaya-tax-mexico** | Mexican Tax Compliance (SAT) — CFDI electronic invoicing, RFC validation, IVA/ISR calculation |

### Operations & Inventory

| Skill | Description |
|-------|-------------|
| **yaya-inventory** | Stock Management & Product Catalog — Real-time stock checks, low-stock alerts, reorder suggestions via ERPNext |
| **yaya-suppliers** | Supplier & Purchase Order Management — Supplier registry, PO creation/tracking, delivery reception, price history |
| **yaya-returns** | Returns, Refunds & Exchanges — Complete returns lifecycle: eligibility checks, refund processing, exchange handling |
| **yaya-logistics** | Order Fulfillment & Last-Mile Delivery — Delivery assignment, tracking, route optimization |
| **yaya-forecast** | Demand Forecasting & Reorder Optimization — Sales trend analysis, demand prediction, optimal reorder points |
| **yaya-production** | Production & Manufacturing Workflow — Production orders, BOM tracking, quality control |

### Scheduling & Services

| Skill | Description |
|-------|-------------|
| **yaya-appointments** | Appointment Booking & Calendar Sync — Full scheduling for service businesses: booking, reminders, no-show tracking, Google/Outlook sync |
| **yaya-memberships** | Recurring Subscriptions & Memberships — Gym/academy memberships: renewals, freezes, cancellations, churn prevention |
| **yaya-payroll** | Staff Payment & Shift Tracking — Shift management, wage calculation, payment tracking for small business staff |

### Analytics & Intelligence

| Skill | Description |
|-------|-------------|
| **yaya-analytics** | Business Intelligence & Reporting — Daily/weekly/monthly reports, product performance, customer metrics, payment analytics |
| **yaya-forecast** | Demand Forecasting — Sales trend analysis, demand prediction, inventory optimization |

### Platform & Onboarding

| Skill | Description |
|-------|-------------|
| **yaya-meta** | Yaya Platform Sales & Self-Onboarding — The skill that sells Yaya itself: demos, pricing, lead capture, trial setup |
| **yaya-onboarding** | New Business Setup Wizard — Guided onboarding: business profile, WhatsApp linking, catalog import, payment setup |

### Industry-Specific

| Skill | Description |
|-------|-------------|
| **yaya-bodega** | Bodega & Micro-Retail Operations — Specialized for corner stores/bodegas: quick sales, inventory, fiados integration |
| **yaya-restaurant** | Restaurant & Food Service — Menu management, table orders, kitchen workflow, delivery integration |
| **yaya-salon** | Salon & Beauty Services — Appointment-centric: stylist scheduling, service catalog, product sales |
| **yaya-pharmacy** | Pharmacy Operations & DIGEMID Compliance — Drug safety, controlled substance tracking, Peru DIGEMID compliance |
| **yaya-agro** | Agricultural & Farming Operations — Crop tracking, harvest forecasting, livestock management, weather integration |

## How to Create a New Skill

### 1. Create the skill directory

```bash
mkdir -p skills/yaya-yourskill
```

### 2. Write the SKILL.md file

```markdown
# yaya-yourskill — Your Skill Title

One-line description of what this skill does.

## Persona

You are a [role description]. You help [target users] with [specific tasks].

## Capabilities

- Capability 1
- Capability 2
- Capability 3

## MCP Servers

- **postgres-mcp** — For database queries
- **other-mcp** — For specific integration

## Tools

- tool_name_1 — Description
- tool_name_2 — Description

## Constraints

- Never do X
- Always confirm before Y
- Escalate to human when Z

## Language

- Primary: Spanish (es-PE, es-CO, es-MX)
- Secondary: Portuguese (pt-BR)
- Adapt to user's dialect and formality level

## Examples

### Example 1: [Scenario]
User: "..."
Agent: "..."
```

### 3. Reference MCP servers

Ensure the MCP servers your skill needs are listed. Hermes uses this to grant tool access.

### 4. Test the skill

Restart Hermes and test via WhatsApp or the merchant AI chat endpoint (`POST /api/merchant-ai/chat`).

## Skill File Conventions

- **Title format:** `# yaya-{name} — Human-Readable Title`
- **Language:** Write in English, but include Spanish/Portuguese example dialogues
- **Constraints section:** Always include safety boundaries and escalation triggers
- **Be specific:** Vague skills produce vague AI behavior. Include concrete examples.
- **Reference tools by name:** The AI needs to know exactly which tools are available
- **Keep it focused:** One skill = one domain. Don't combine unrelated capabilities.
