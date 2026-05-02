# Yaya Platform — Skills Guide

## What Are Skills?

Skills are modular capability definitions that tell the Hermes agent *how* to handle specific types of conversations. Each skill defines:

- **When** to activate (trigger conditions)
- **What** tools to use (MCP server dependencies)
- **How** to behave (personality, guardrails, escalation rules)
- **Configuration** variables (per-business customization)

Skills are not code — they are structured markdown documents (`SKILL.md`) that the agent loads into its context when handling a conversation.

## Skill Architecture

```
skills/
├── yaya-sales/           # Conversational selling
│   └── SKILL.md
├── yaya-billing/         # Subscription & payment management
│   └── SKILL.md
├── yaya-crm/             # Customer relationship management
│   └── SKILL.md
├── yaya-analytics/       # Business insights & reporting
│   └── SKILL.md
├── yaya-inventory/       # Stock management & alerts
│   └── SKILL.md
└── yaya-onboarding/      # New business setup wizard
    └── SKILL.md
```

## How Skills Work

```
1. Customer message arrives via WhatsApp
   │
2. Agent evaluates message intent
   │
3. Agent selects appropriate skill based on "When to Use" section
   │
4. Skill's SKILL.md is loaded into agent context
   │
5. Agent follows skill's behavior guidelines
   │
6. Agent uses skill's declared MCP tools to fulfill request
   │
7. Response generated following skill's personality rules
```

## Existing Skills

### yaya-sales

**Status:** Implemented

The primary skill for handling customer conversations. Manages the entire sales flow from initial inquiry to payment confirmation.

**Capabilities:**
- Product discovery and search via ERPNext
- Price negotiation with configurable discount rules
- Order creation and modification
- Payment guidance (Yape, Plin, Nequi, bank transfer)
- Lead capture to CRM
- Follow-up scheduling
- Spanish voice note transcription

**MCP Tools Used:**
- `erpnext-mcp`: search_products, get_product, check_stock, create_order, get_order, list_customers
- `crm-mcp`: search_contacts, create_contact, log_interaction
- `postgres-mcp`: Complex reporting queries
- `lago-mcp`: Check subscription status

### yaya-billing (Planned)

Manages subscriptions, invoices, and payment history for business customers.

**Planned Capabilities:**
- View and explain invoices
- Subscription status checks
- Plan upgrades/downgrades
- Payment history
- Billing dispute handling

### yaya-crm (Planned)

Customer relationship management for the business owner.

**Planned Capabilities:**
- Contact lookup and management
- Deal pipeline tracking
- Activity logging
- Customer segmentation
- Follow-up reminders

### yaya-analytics (Planned)

Business intelligence and reporting.

**Planned Capabilities:**
- Sales reports (daily/weekly/monthly)
- Top products and customers
- Revenue trends
- Inventory alerts
- Cash flow summaries

### yaya-inventory (Planned)

Stock management and reorder alerts.

**Planned Capabilities:**
- Stock level checks
- Low-stock alerts
- Reorder suggestions
- Warehouse management
- Stock movement history

### yaya-onboarding (Planned)

Guided setup for new business clients.

**Planned Capabilities:**
- Business profile setup
- Product catalog import
- Payment method configuration
- Team member invitations
- First sale walkthrough

## Creating a New Skill

### Step 1: Create the Directory

```bash
mkdir -p skills/yaya-newskill
```

### Step 2: Write SKILL.md

Create `skills/yaya-newskill/SKILL.md` following this template:

```markdown
# yaya-newskill — Short Description

## Description
One paragraph explaining what this skill does and why it exists.

## When to Use
- Bullet points describing trigger conditions
- When does the agent activate this skill?
- What types of messages or intents match?

## Capabilities
- **Capability Name** — What it does
- **Another Capability** — What it does

## MCP Tools Required
- `mcp-server-name` — Which tools and why
- `another-mcp` — Which tools and why

## Behavior Guidelines
- How should the agent behave?
- What tone and language to use?
- What should the agent NEVER do?
- When should it escalate?

## Example Flows
### Flow Name
\```
Customer: "example message"
Agent: [describes what happens]
Agent: "example response"
\```

## Configuration
- `VARIABLE_NAME` — What it controls
```

### Step 3: Declare MCP Dependencies

List every MCP tool the skill needs in the "MCP Tools Required" section. The agent will only have access to tools that are:
1. Declared in the skill
2. Allowed by the Hermes policy
3. Available from running MCP servers

### Step 4: Define Behavior Boundaries

Be explicit about:
- **Language**: What language(s) does the agent use?
- **Tone**: Professional? Casual? Warm?
- **Limits**: What should the agent refuse to do?
- **Escalation**: When should it hand off to a human?
- **Safety**: What information must never be shared?

### Step 5: Add Example Flows

Include at least 2-3 realistic conversation examples. These serve as few-shot examples for the LLM and help maintain consistency.

### Step 6: Test

1. Deploy to a test client: `./infra/scripts/deploy-client.sh --name "Test" --whatsapp "+0000000"`
2. Send test messages via WhatsApp
3. Verify the agent activates the correct skill
4. Check MCP tool calls in logs
5. Verify Hermes policy compliance

## Per-Client Skill Customization

When deploying a client, skills are copied to their `clients/<slug>/skills/` directory. You can then customize:

### SOUL.md

Each client has a `config/SOUL.md` that overrides skill defaults:

```markdown
# Yaya Agent — Tienda Maria

You are the virtual assistant for **Tienda Maria**.

## Payment Methods
- **Yape**: Send to 938438401 (Maria Lopez)

## Special Rules
- Always mention free shipping on orders over S/100
- Offer 10% discount for first-time customers
```

### Environment Variables

Skills reference configuration variables that are set per-client in their `.env`:

```bash
BUSINESS_NAME=Tienda Maria
BUSINESS_CURRENCY=PEN
PAYMENT_METHODS=yape,plin
YAPE_NUMBER=938438401
YAPE_NAME=Maria Lopez
ESCALATION_THRESHOLD=500
BUSINESS_HOURS=09:00-18:00
```

## Skill Selection Logic

When multiple skills could handle a message, the agent uses this priority:

1. **Explicit context**: If the conversation is already in a specific flow (e.g., mid-order), continue with that skill
2. **Intent match**: Match the message intent to skill "When to Use" conditions
3. **Default**: Fall back to `yaya-sales` for general customer inquiries

## Best Practices

1. **One skill per domain** — Don't create a skill that does everything. Keep responsibilities focused.

2. **Declare all tools** — If a skill uses a tool, it must be listed. Undeclared tool usage will be blocked by Hermes.

3. **Write realistic examples** — The LLM uses examples as behavioral anchors. Make them reflect real conversations.

4. **Test with voice** — Many LATAM customers send voice notes. Test that Whisper transcription + skill handling works end-to-end.

5. **Set clear escalation rules** — Always define when the agent should stop and involve a human. Over-escalation is better than under-escalation.

6. **Respect cultural context** — Skills for LATAM businesses should use appropriate greetings, formality levels, and communication styles for the target market.
