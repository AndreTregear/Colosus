# Yaya Platform — MCP Servers

## Overview

MCP (Model Context Protocol) servers bridge the gap between the LLM agent and business systems. Each server exposes a set of typed tools that the agent can call during conversation. All servers use stdio transport and run within the NemoClaw security sandbox.

```
  OpenClaw Agent
       │
       │ tool_call("search_products", {query: "nike 42"})
       ▼
  ┌─────────────┐      ┌──────────────┐
  │ erpnext-mcp │─────▶│  ERPNext API  │
  └─────────────┘      └──────────────┘
       │
       │ {results: [{item: "Air Max 90", price: 299, stock: 3}]}
       ▼
  OpenClaw Agent
```

## Available MCP Servers

### postgres-mcp

**Source:** `mcp-servers/postgres-mcp/` (git submodule from crystaldba/postgres-mcp)
**Transport:** stdio
**Language:** Python
**Status:** Production-ready

A general-purpose PostgreSQL MCP server for direct database access with safety controls.

#### Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `execute_sql` | Run a SQL query against the database | `query` (string), `params` (array, optional) |
| `explain_query` | Get the execution plan for a query | `query` (string) |
| `get_table_schema` | Get column definitions for a table | `table_name` (string) |
| `list_tables` | List all tables in the database | `schema` (string, optional) |
| `get_db_health` | Database health metrics (connections, size, cache hit ratio) | — |
| `suggest_indexes` | Suggest indexes for slow queries | `query` (string) |

#### Configuration

```bash
DATABASE_URI=postgresql://yaya:password@postgres:5432/yaya
```

#### NemoClaw Restrictions
- SELECT only on `agent.*` schema
- No DDL operations (CREATE, DROP, ALTER)
- No access to sensitive pg_catalog tables

---

### erpnext-mcp

**Source:** `mcp-servers/erpnext-mcp/` (custom TypeScript)
**Transport:** stdio
**Language:** TypeScript (Node.js)
**Status:** Production-ready

Exposes ERPNext REST API as MCP tools for product catalog, inventory, and order management.

#### Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `search_products` | Search product catalog by name/keyword | `query` (string), `limit` (number, default 10) |
| `get_product` | Get full product details (price, stock, description) | `item_code` (string) |
| `check_stock` | Check inventory across warehouses | `item_code` (string), `warehouse` (string, optional) |
| `create_order` | Create a new sales order | `customer` (string), `items` (array of {item_code, qty, rate?}), `notes` (string, optional) |
| `get_order` | Get order status and details | `order_id` (string, e.g., "SO-00001") |
| `list_customers` | Search customers by name/phone/email | `query` (string), `limit` (number, default 10) |

#### Configuration

```bash
ERPNEXT_URL=http://localhost:8080
ERPNEXT_API_KEY=your_api_key
ERPNEXT_API_SECRET=your_api_secret
```

#### Example Usage

Agent receives: *"Tienen zapatillas Nike talla 42?"*

```json
// Agent calls:
{
  "tool": "search_products",
  "arguments": {"query": "Nike 42", "limit": 5}
}

// Returns:
[
  {"item_code": "NIKE-AM90-42", "item_name": "Air Max 90 Talla 42", "standard_rate": 299, "stock_uom": "Nos"},
  {"item_code": "NIKE-REV6-42", "item_name": "Revolution 6 Talla 42", "standard_rate": 199, "stock_uom": "Nos"}
]
```

---

### crm-mcp (Planned)

**Source:** `mcp-servers/crm-mcp/`
**Transport:** stdio
**Language:** TypeScript (Node.js)
**Status:** In development

Exposes Atomic CRM (Supabase) data for contact and deal management.

#### Planned Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `search_contacts` | Find contacts by name, phone, or email | `query` (string), `limit` (number) |
| `get_contact` | Get full contact details + interaction history | `contact_id` (string) |
| `create_contact` | Create a new contact from conversation | `name` (string), `phone` (string), `email` (string, optional), `source` (string) |
| `update_contact` | Update contact fields | `contact_id` (string), `fields` (object) |
| `log_interaction` | Record a conversation/interaction | `contact_id` (string), `type` (string), `summary` (string) |
| `list_deals` | List deals for a contact or pipeline stage | `contact_id` (string, optional), `stage` (string, optional) |

#### Configuration

```bash
SUPABASE_URL=http://supabase-rest:3000
SUPABASE_SERVICE_KEY=your_service_key
```

---

### lago-mcp (Planned)

**Source:** `mcp-servers/lago-mcp/`
**Transport:** stdio
**Language:** TypeScript (Node.js)
**Status:** In development

Exposes Lago billing API for subscription and invoice management.

#### Planned Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `get_customer_subscription` | Get active subscriptions for a customer | `external_id` (string) |
| `list_invoices` | List invoices for a customer | `external_id` (string), `status` (string, optional) |
| `create_event` | Record a billable event | `external_customer_id` (string), `code` (string), `properties` (object) |
| `get_plan` | Get plan details and pricing | `plan_code` (string) |

#### Configuration

```bash
LAGO_API_URL=http://lago-api:3000
LAGO_API_KEY=your_api_key
```

---

### payments-mcp (Planned)

**Source:** `mcp-servers/payments-mcp/`
**Transport:** stdio
**Language:** TypeScript (Node.js)
**Status:** In development

Handles payment validation for local LATAM payment methods (Yape, Plin, Nequi).

#### Planned Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `submit_payment_proof` | Submit a payment screenshot for validation | `order_id` (string), `method` (string), `amount` (number), `proof_url` (string) |
| `check_payment_status` | Check if a payment has been validated | `payment_id` (string) |
| `list_pending_payments` | List payments awaiting validation | `status` (string, default "pending") |

#### Configuration

```bash
DATABASE_URI=postgresql://yaya:password@postgres:5432/yaya
MINIO_ENDPOINT=http://minio:9000
MINIO_ACCESS_KEY=your_key
MINIO_SECRET_KEY=your_secret
```

## Building a New MCP Server

### Step 1: Create the Directory

```bash
mkdir -p mcp-servers/my-mcp/src
cd mcp-servers/my-mcp
```

### Step 2: Initialize the Project

```bash
npm init -y
npm install @modelcontextprotocol/sdk
npm install -D typescript @types/node
```

### Step 3: Define Tools

Create `src/index.ts`:

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const TOOLS = [
  {
    name: "my_tool",
    description: "What this tool does",
    inputSchema: {
      type: "object" as const,
      properties: {
        param1: { type: "string", description: "First parameter" },
      },
      required: ["param1"],
    },
  },
];

async function handleTool(
  name: string,
  args: Record<string, any>
): Promise<string> {
  switch (name) {
    case "my_tool":
      // Your implementation here
      return JSON.stringify({ result: "success" });
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

const server = new Server(
  { name: "my-mcp", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    const result = await handleTool(name, args || {});
    return { content: [{ type: "text", text: result }] };
  } catch (error: any) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("My MCP server running on stdio");
}

main().catch(console.error);
```

### Step 4: Create Dockerfile

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist/ ./dist/
CMD ["node", "dist/index.js"]
```

### Step 5: Add to NemoClaw Policy

Add your server to `infra/nemoclaw/policy.yaml`:

```yaml
mcp_servers:
  allowed:
    - name: "my-mcp"
      transport: stdio
      description: "What it does"
      tools:
        - my_tool
```

### Step 6: Register in Docker Compose

Add to `infra/docker/docker-compose.yml`:

```yaml
my-mcp:
  build:
    context: ../../mcp-servers/my-mcp
    dockerfile: Dockerfile
  environment:
    MY_CONFIG: ${MY_CONFIG_VAR}
  depends_on:
    postgres:
      condition: service_healthy
  restart: unless-stopped
  networks:
    - yaya-net
```

## MCP Tool Design Guidelines

1. **Clear naming**: Use `verb_noun` format (e.g., `search_products`, `create_order`)
2. **Descriptive schemas**: Every parameter needs a description — the LLM reads these
3. **Return JSON**: Always return structured JSON that the LLM can parse
4. **Error handling**: Return errors as `isError: true` with a human-readable message
5. **Idempotency**: Prefer idempotent operations where possible
6. **Minimal scope**: Each tool should do one thing well
7. **Security**: Never expose credentials, internal IDs, or system details in tool responses

## Debugging MCP Servers

### Check logs

```bash
docker compose --env-file .env logs -f erpnext-mcp
```

### Test tools manually

Use the MCP CLI inspector:

```bash
npx @modelcontextprotocol/inspector mcp-servers/erpnext-mcp/dist/index.js
```

### Verify tool registration

Check that the agent sees your tools:

```bash
# List tools from a running MCP server
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | \
  node mcp-servers/erpnext-mcp/dist/index.js
```
