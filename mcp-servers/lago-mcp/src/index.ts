#!/usr/bin/env node
/**
 * Lago Billing MCP Server
 * Exposes Lago REST API as MCP tools for OpenClaw agents.
 *
 * Tools:
 *  - list_subscriptions: List active subscriptions for a customer
 *  - get_subscription: Get subscription details
 *  - create_subscription: Subscribe a customer to a plan
 *  - cancel_subscription: Cancel a subscription
 *  - list_invoices: List invoices for a customer
 *  - create_invoice: Generate a one-off invoice
 *  - get_invoice: Get invoice details/PDF link
 *  - list_plans: List available subscription plans
 *  - record_usage: Record usage event for metered billing
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// ── Configuration ────────────────────────────────────

const LAGO_API_URL = process.env.LAGO_API_URL || "http://localhost:3000";
const LAGO_API_KEY = process.env.LAGO_API_KEY || "";

// ── Lago API Client ─────────────────────────────────

async function lagoFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  const url = `${LAGO_API_URL}/api/v1${endpoint}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(LAGO_API_KEY ? { Authorization: `Bearer ${LAGO_API_KEY}` } : {}),
    ...(options.headers as Record<string, string>) || {},
  };

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Lago API ${res.status}: ${text}`);
  }
  return res.json();
}

// ── Types ────────────────────────────────────────────

interface SubscriptionParams {
  external_customer_id: string;
  plan_code: string;
  external_id?: string;
  name?: string;
  billing_time?: "calendar" | "anniversary";
}

interface InvoiceItem {
  add_on_code: string;
  units: number;
  unit_amount_cents?: number;
  description?: string;
}

interface UsageEvent {
  transaction_id: string;
  external_subscription_id: string;
  code: string;
  timestamp?: number;
  properties?: Record<string, string | number>;
}

// ── Tool Definitions ─────────────────────────────────

const TOOLS = [
  {
    name: "list_subscriptions",
    description:
      "List active subscriptions for a customer. Returns subscription IDs, plan codes, and status.",
    inputSchema: {
      type: "object" as const,
      properties: {
        external_customer_id: {
          type: "string",
          description: "Customer external ID",
        },
        status: {
          type: "string",
          enum: ["active", "pending", "terminated", "canceled"],
          description: "Filter by status (default: active)",
        },
        page: { type: "number", description: "Page number (default 1)" },
        per_page: { type: "number", description: "Results per page (default 20)" },
      },
      required: ["external_customer_id"],
    },
  },
  {
    name: "get_subscription",
    description: "Get full details for a specific subscription including plan, status, and billing dates.",
    inputSchema: {
      type: "object" as const,
      properties: {
        external_id: {
          type: "string",
          description: "Subscription external ID",
        },
      },
      required: ["external_id"],
    },
  },
  {
    name: "create_subscription",
    description:
      "Subscribe a customer to a plan. Creates a new subscription and starts billing.",
    inputSchema: {
      type: "object" as const,
      properties: {
        external_customer_id: {
          type: "string",
          description: "Customer external ID",
        },
        plan_code: {
          type: "string",
          description: "Code of the plan to subscribe to",
        },
        external_id: {
          type: "string",
          description: "Unique external ID for this subscription (optional, auto-generated if omitted)",
        },
        name: {
          type: "string",
          description: "Display name for the subscription (optional)",
        },
        billing_time: {
          type: "string",
          enum: ["calendar", "anniversary"],
          description: "Billing alignment: calendar (start of month) or anniversary (subscription date). Default: calendar",
        },
      },
      required: ["external_customer_id", "plan_code"],
    },
  },
  {
    name: "cancel_subscription",
    description: "Cancel an active subscription. It will remain active until the end of the current billing period.",
    inputSchema: {
      type: "object" as const,
      properties: {
        external_id: {
          type: "string",
          description: "Subscription external ID to cancel",
        },
      },
      required: ["external_id"],
    },
  },
  {
    name: "list_invoices",
    description:
      "List invoices for a customer. Returns invoice numbers, amounts, status, and dates.",
    inputSchema: {
      type: "object" as const,
      properties: {
        external_customer_id: {
          type: "string",
          description: "Customer external ID",
        },
        status: {
          type: "string",
          enum: ["draft", "finalized", "voided", "pending"],
          description: "Filter by invoice status (optional)",
        },
        page: { type: "number", description: "Page number (default 1)" },
        per_page: { type: "number", description: "Results per page (default 20)" },
      },
      required: ["external_customer_id"],
    },
  },
  {
    name: "create_invoice",
    description:
      "Generate a one-off invoice for a customer with specific add-on charges.",
    inputSchema: {
      type: "object" as const,
      properties: {
        external_customer_id: {
          type: "string",
          description: "Customer external ID",
        },
        currency: {
          type: "string",
          description: "Currency code (e.g., USD, EUR, XOF)",
        },
        fees: {
          type: "array",
          items: {
            type: "object",
            properties: {
              add_on_code: { type: "string", description: "Add-on code to charge" },
              units: { type: "number", description: "Number of units" },
              unit_amount_cents: {
                type: "number",
                description: "Price per unit in cents (optional, uses add-on default if omitted)",
              },
              description: {
                type: "string",
                description: "Line item description (optional)",
              },
            },
            required: ["add_on_code", "units"],
          },
          description: "List of fee items to include on the invoice",
        },
      },
      required: ["external_customer_id", "currency", "fees"],
    },
  },
  {
    name: "get_invoice",
    description:
      "Get full invoice details including line items, amounts, and PDF download link.",
    inputSchema: {
      type: "object" as const,
      properties: {
        lago_id: {
          type: "string",
          description: "Lago invoice ID (UUID)",
        },
      },
      required: ["lago_id"],
    },
  },
  {
    name: "list_plans",
    description:
      "List all available subscription plans with their codes, prices, and billing intervals.",
    inputSchema: {
      type: "object" as const,
      properties: {
        page: { type: "number", description: "Page number (default 1)" },
        per_page: { type: "number", description: "Results per page (default 20)" },
      },
      required: [],
    },
  },
  {
    name: "record_usage",
    description:
      "Record a usage event for metered billing. Used to track consumption-based charges.",
    inputSchema: {
      type: "object" as const,
      properties: {
        transaction_id: {
          type: "string",
          description: "Unique idempotency key for this event",
        },
        external_subscription_id: {
          type: "string",
          description: "Subscription external ID to record usage against",
        },
        code: {
          type: "string",
          description: "Billable metric code",
        },
        timestamp: {
          type: "number",
          description: "Unix timestamp of the event (optional, defaults to now)",
        },
        properties: {
          type: "object",
          description: "Additional properties for the usage event (optional)",
          additionalProperties: true,
        },
      },
      required: ["transaction_id", "external_subscription_id", "code"],
    },
  },
];

// ── Tool Handlers ────────────────────────────────────

async function handleTool(name: string, args: Record<string, any>): Promise<string> {
  switch (name) {
    case "list_subscriptions": {
      const params = new URLSearchParams();
      params.set("external_customer_id", args.external_customer_id);
      if (args.status) params.set("status[]", args.status);
      if (args.page) params.set("page", String(args.page));
      if (args.per_page) params.set("per_page", String(args.per_page));
      const data = await lagoFetch(`/subscriptions?${params.toString()}`);
      return JSON.stringify(data, null, 2);
    }

    case "get_subscription": {
      const data = await lagoFetch(`/subscriptions/${encodeURIComponent(args.external_id)}`);
      return JSON.stringify(data, null, 2);
    }

    case "create_subscription": {
      const body: Record<string, any> = {
        external_customer_id: args.external_customer_id,
        plan_code: args.plan_code,
      };
      if (args.external_id) body.external_id = args.external_id;
      if (args.name) body.name = args.name;
      if (args.billing_time) body.billing_time = args.billing_time;

      const data = await lagoFetch("/subscriptions", {
        method: "POST",
        body: JSON.stringify({ subscription: body }),
      });
      return JSON.stringify(data, null, 2);
    }

    case "cancel_subscription": {
      const data = await lagoFetch(
        `/subscriptions/${encodeURIComponent(args.external_id)}`,
        { method: "DELETE" }
      );
      return JSON.stringify(data, null, 2);
    }

    case "list_invoices": {
      const params = new URLSearchParams();
      params.set("external_customer_id", args.external_customer_id);
      if (args.status) params.set("status", args.status);
      if (args.page) params.set("page", String(args.page));
      if (args.per_page) params.set("per_page", String(args.per_page));
      const data = await lagoFetch(`/invoices?${params.toString()}`);
      return JSON.stringify(data, null, 2);
    }

    case "create_invoice": {
      const fees = (args.fees as InvoiceItem[]).map((fee) => ({
        add_on_code: fee.add_on_code,
        units: fee.units,
        ...(fee.unit_amount_cents != null
          ? { unit_amount_cents: fee.unit_amount_cents }
          : {}),
        ...(fee.description ? { description: fee.description } : {}),
      }));

      const data = await lagoFetch("/invoices", {
        method: "POST",
        body: JSON.stringify({
          invoice: {
            external_customer_id: args.external_customer_id,
            currency: args.currency,
            fees,
          },
        }),
      });
      return JSON.stringify(data, null, 2);
    }

    case "get_invoice": {
      const data = await lagoFetch(`/invoices/${encodeURIComponent(args.lago_id)}`);
      return JSON.stringify(data, null, 2);
    }

    case "list_plans": {
      const params = new URLSearchParams();
      if (args.page) params.set("page", String(args.page));
      if (args.per_page) params.set("per_page", String(args.per_page));
      const qs = params.toString();
      const data = await lagoFetch(`/plans${qs ? `?${qs}` : ""}`);
      return JSON.stringify(data, null, 2);
    }

    case "record_usage": {
      const event: Record<string, any> = {
        transaction_id: args.transaction_id,
        external_subscription_id: args.external_subscription_id,
        code: args.code,
      };
      if (args.timestamp) event.timestamp = args.timestamp;
      if (args.properties) event.properties = args.properties;

      const data = await lagoFetch("/events", {
        method: "POST",
        body: JSON.stringify({ event }),
      });
      return JSON.stringify(data, null, 2);
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ── MCP Server Setup ─────────────────────────────────

const server = new Server(
  { name: "lago-mcp", version: "0.1.0" },
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

// ── Start ────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Lago MCP server running on stdio");
}

main().catch(console.error);
