#!/usr/bin/env node
/**
 * ERPNext MCP Server
 * Exposes ERPNext REST API as MCP tools for OpenClaw agents.
 *
 * Tools:
 *  - search_products: Search product catalog
 *  - get_product: Get product details + stock
 *  - create_order: Create a sales order
 *  - get_order: Get order status
 *  - list_customers: Search customers
 *  - check_stock: Check inventory for an item
 *  - create_invoice: Generate a sales invoice
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const ERPNEXT_URL = process.env.ERPNEXT_URL || "http://localhost:8080";
const ERPNEXT_API_KEY = process.env.ERPNEXT_API_KEY || "";
const ERPNEXT_API_SECRET = process.env.ERPNEXT_API_SECRET || "";

// ── ERPNext API Client ────────────────────────────────

async function erpFetch(endpoint: string, options: RequestInit = {}) {
  const url = `${ERPNEXT_URL}/api${endpoint}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(ERPNEXT_API_KEY
      ? { Authorization: `token ${ERPNEXT_API_KEY}:${ERPNEXT_API_SECRET}` }
      : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ERPNext API ${res.status}: ${text}`);
  }
  return res.json();
}

// ── Tool Definitions ──────────────────────────────────

const TOOLS = [
  {
    name: "search_products",
    description:
      "Search the product catalog by name, category, or keyword. Returns matching items with prices and stock.",
    inputSchema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Search term" },
        limit: { type: "number", description: "Max results (default 10)" },
      },
      required: ["query"],
    },
  },
  {
    name: "get_product",
    description: "Get full details for a specific product including price, stock, and description.",
    inputSchema: {
      type: "object" as const,
      properties: {
        item_code: { type: "string", description: "ERPNext Item Code" },
      },
      required: ["item_code"],
    },
  },
  {
    name: "check_stock",
    description: "Check current stock quantity for an item across warehouses.",
    inputSchema: {
      type: "object" as const,
      properties: {
        item_code: { type: "string", description: "ERPNext Item Code" },
        warehouse: { type: "string", description: "Warehouse name (optional)" },
      },
      required: ["item_code"],
    },
  },
  {
    name: "create_order",
    description:
      "Create a new sales order for a customer. Requires customer name and list of items.",
    inputSchema: {
      type: "object" as const,
      properties: {
        customer: { type: "string", description: "Customer name" },
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              item_code: { type: "string" },
              qty: { type: "number" },
              rate: { type: "number", description: "Price per unit (optional)" },
            },
            required: ["item_code", "qty"],
          },
          description: "List of items to order",
        },
        notes: { type: "string", description: "Order notes (optional)" },
      },
      required: ["customer", "items"],
    },
  },
  {
    name: "get_order",
    description: "Get the status and details of an existing sales order.",
    inputSchema: {
      type: "object" as const,
      properties: {
        order_id: { type: "string", description: "Sales Order ID (e.g., SO-00001)" },
      },
      required: ["order_id"],
    },
  },
  {
    name: "list_customers",
    description: "Search customers by name, phone, or email.",
    inputSchema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Search term" },
        limit: { type: "number", description: "Max results (default 10)" },
      },
      required: ["query"],
    },
  },
];

// ── Tool Handlers ─────────────────────────────────────

async function handleTool(name: string, args: Record<string, any>): Promise<string> {
  switch (name) {
    case "search_products": {
      const limit = args.limit || 10;
      const data = await erpFetch(
        `/resource/Item?filters=[["item_name","like","%${args.query}%"]]&fields=["item_code","item_name","standard_rate","stock_uom","item_group"]&limit_page_length=${limit}`
      );
      return JSON.stringify(data.data, null, 2);
    }

    case "get_product": {
      const data = await erpFetch(`/resource/Item/${args.item_code}`);
      return JSON.stringify(data.data, null, 2);
    }

    case "check_stock": {
      const filters = args.warehouse
        ? `[["item_code","=","${args.item_code}"],["warehouse","=","${args.warehouse}"]]`
        : `[["item_code","=","${args.item_code}"]]`;
      const data = await erpFetch(
        `/resource/Bin?filters=${filters}&fields=["warehouse","actual_qty","projected_qty"]`
      );
      return JSON.stringify(data.data, null, 2);
    }

    case "create_order": {
      const order = {
        doctype: "Sales Order",
        customer: args.customer,
        items: args.items.map((item: any) => ({
          item_code: item.item_code,
          qty: item.qty,
          ...(item.rate ? { rate: item.rate } : {}),
        })),
        ...(args.notes ? { notes: args.notes } : {}),
      };
      const data = await erpFetch("/resource/Sales Order", {
        method: "POST",
        body: JSON.stringify({ data: order }),
      });
      return JSON.stringify(data.data, null, 2);
    }

    case "get_order": {
      const data = await erpFetch(`/resource/Sales Order/${args.order_id}`);
      return JSON.stringify(data.data, null, 2);
    }

    case "list_customers": {
      const limit = args.limit || 10;
      const data = await erpFetch(
        `/resource/Customer?filters=[["customer_name","like","%${args.query}%"]]&fields=["name","customer_name","mobile_no","email_id"]&limit_page_length=${limit}`
      );
      return JSON.stringify(data.data, null, 2);
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ── MCP Server Setup ──────────────────────────────────

const server = new Server(
  { name: "erpnext-mcp", version: "0.1.0" },
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

// ── Start ─────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("ERPNext MCP server running on stdio");
}

main().catch(console.error);
