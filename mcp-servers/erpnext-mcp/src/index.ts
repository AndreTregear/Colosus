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
 *  - update_order: Update an existing sales order
 *  - cancel_order: Cancel a sales order
 *  - list_orders: List recent orders with filters
 *  - list_customers: Search customers
 *  - create_customer: Create a new customer
 *  - check_stock: Check inventory for an item
 *  - get_item_price: Get pricing for an item including discounts
 *  - create_quotation: Create a price quotation
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
  {
    name: "create_customer",
    description: "Create a new customer in ERPNext. Returns the created customer record.",
    inputSchema: {
      type: "object" as const,
      properties: {
        customer_name: { type: "string", description: "Full customer name" },
        customer_type: {
          type: "string",
          enum: ["Individual", "Company"],
          description: "Customer type (default: Individual)",
        },
        mobile_no: { type: "string", description: "Mobile number (optional)" },
        email_id: { type: "string", description: "Email address (optional)" },
        customer_group: {
          type: "string",
          description: "Customer group (e.g., Commercial, Individual). Optional.",
        },
        territory: {
          type: "string",
          description: "Territory (optional)",
        },
      },
      required: ["customer_name"],
    },
  },
  {
    name: "update_order",
    description: "Update an existing sales order. Can modify items, notes, or delivery date.",
    inputSchema: {
      type: "object" as const,
      properties: {
        order_id: { type: "string", description: "Sales Order ID (e.g., SO-00001)" },
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
          description: "Updated list of items (replaces existing items)",
        },
        delivery_date: { type: "string", description: "New delivery date (ISO format, optional)" },
        notes: { type: "string", description: "Updated order notes (optional)" },
      },
      required: ["order_id"],
    },
  },
  {
    name: "cancel_order",
    description: "Cancel a submitted sales order. The order must be in a cancellable state.",
    inputSchema: {
      type: "object" as const,
      properties: {
        order_id: { type: "string", description: "Sales Order ID (e.g., SO-00001)" },
        reason: { type: "string", description: "Cancellation reason (optional)" },
      },
      required: ["order_id"],
    },
  },
  {
    name: "list_orders",
    description:
      "List recent sales orders with optional filters by customer, status, or date range.",
    inputSchema: {
      type: "object" as const,
      properties: {
        customer: { type: "string", description: "Filter by customer name (optional)" },
        status: {
          type: "string",
          enum: ["Draft", "To Deliver and Bill", "To Bill", "To Deliver", "Completed", "Cancelled"],
          description: "Filter by order status (optional)",
        },
        from_date: { type: "string", description: "Start date filter, ISO format (optional)" },
        to_date: { type: "string", description: "End date filter, ISO format (optional)" },
        limit: { type: "number", description: "Max results (default 20)" },
      },
      required: [],
    },
  },
  {
    name: "get_item_price",
    description:
      "Get pricing for an item including standard rate, price list rates, and any applicable discounts.",
    inputSchema: {
      type: "object" as const,
      properties: {
        item_code: { type: "string", description: "ERPNext Item Code" },
        price_list: {
          type: "string",
          description: "Price list name (optional, defaults to Standard Selling)",
        },
        customer: {
          type: "string",
          description: "Customer name to check for customer-specific pricing (optional)",
        },
        qty: {
          type: "number",
          description: "Quantity to check for volume discounts (optional)",
        },
      },
      required: ["item_code"],
    },
  },
  {
    name: "create_quotation",
    description:
      "Create a price quotation for a customer. Can be converted to a sales order later.",
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
          description: "List of items for the quotation",
        },
        valid_till: {
          type: "string",
          description: "Quotation validity date (ISO format, optional)",
        },
        notes: { type: "string", description: "Quotation notes (optional)" },
      },
      required: ["customer", "items"],
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

    case "create_customer": {
      const customer: Record<string, any> = {
        doctype: "Customer",
        customer_name: args.customer_name,
        customer_type: args.customer_type || "Individual",
      };
      if (args.mobile_no) customer.mobile_no = args.mobile_no;
      if (args.email_id) customer.email_id = args.email_id;
      if (args.customer_group) customer.customer_group = args.customer_group;
      if (args.territory) customer.territory = args.territory;

      const data = await erpFetch("/resource/Customer", {
        method: "POST",
        body: JSON.stringify({ data: customer }),
      });
      return JSON.stringify(data.data, null, 2);
    }

    case "update_order": {
      const updates: Record<string, any> = {};
      if (args.items) {
        updates.items = args.items.map((item: any) => ({
          item_code: item.item_code,
          qty: item.qty,
          ...(item.rate ? { rate: item.rate } : {}),
        }));
      }
      if (args.delivery_date) updates.delivery_date = args.delivery_date;
      if (args.notes) updates.notes = args.notes;

      if (Object.keys(updates).length === 0) {
        throw new Error("No fields to update. Provide items, delivery_date, or notes.");
      }

      const data = await erpFetch(`/resource/Sales Order/${args.order_id}`, {
        method: "PUT",
        body: JSON.stringify({ data: updates }),
      });
      return JSON.stringify(data.data, null, 2);
    }

    case "cancel_order": {
      // ERPNext cancel uses the method endpoint to amend docstatus
      const data = await erpFetch(
        `/method/frappe.client.cancel`,
        {
          method: "POST",
          body: JSON.stringify({
            doctype: "Sales Order",
            name: args.order_id,
          }),
        }
      );
      const result: Record<string, any> = {
        order_id: args.order_id,
        status: "Cancelled",
      };
      if (args.reason) result.reason = args.reason;
      return JSON.stringify(result, null, 2);
    }

    case "list_orders": {
      const limit = args.limit || 20;
      const filters: string[][] = [];
      if (args.customer) {
        filters.push(["customer", "like", `%${args.customer}%`]);
      }
      if (args.status) {
        filters.push(["status", "=", args.status]);
      }
      if (args.from_date) {
        filters.push(["transaction_date", ">=", args.from_date]);
      }
      if (args.to_date) {
        filters.push(["transaction_date", "<=", args.to_date]);
      }

      const filtersParam = filters.length > 0
        ? `&filters=${encodeURIComponent(JSON.stringify(filters))}`
        : "";
      const data = await erpFetch(
        `/resource/Sales Order?fields=${encodeURIComponent(JSON.stringify(["name", "customer", "grand_total", "status", "transaction_date", "delivery_date", "currency"]))}&limit_page_length=${limit}&order_by=transaction_date desc${filtersParam}`
      );
      return JSON.stringify(data.data, null, 2);
    }

    case "get_item_price": {
      const priceList = args.price_list || "Standard Selling";
      // Get item standard rate
      const item = await erpFetch(
        `/resource/Item/${encodeURIComponent(args.item_code)}?fields=["item_code","item_name","standard_rate","stock_uom"]`
      );

      // Get price list rate
      const priceFilters = [
        ["item_code", "=", args.item_code],
        ["price_list", "=", priceList],
      ];
      const prices = await erpFetch(
        `/resource/Item Price?filters=${encodeURIComponent(JSON.stringify(priceFilters))}&fields=["price_list_rate","currency","min_qty","valid_from","valid_upto"]&limit_page_length=10`
      );

      // Check for pricing rules / discounts
      const pricingRuleFilters = [
        ["apply_on", "=", "Item Code"],
        ["items", "like", `%${args.item_code}%`],
        ["disable", "=", 0],
      ];
      let pricingRules: any[] = [];
      try {
        const rules = await erpFetch(
          `/resource/Pricing Rule?filters=${encodeURIComponent(JSON.stringify(pricingRuleFilters))}&fields=["name","title","discount_percentage","discount_amount","min_qty","valid_from","valid_upto"]&limit_page_length=10`
        );
        pricingRules = rules.data || [];
      } catch {
        // Pricing rules may not be accessible; continue without them
      }

      return JSON.stringify(
        {
          item: item.data,
          price_list_rates: prices.data || [],
          pricing_rules: pricingRules,
        },
        null,
        2
      );
    }

    case "create_quotation": {
      const quotation: Record<string, any> = {
        doctype: "Quotation",
        quotation_to: "Customer",
        party_name: args.customer,
        items: args.items.map((item: any) => ({
          item_code: item.item_code,
          qty: item.qty,
          ...(item.rate ? { rate: item.rate } : {}),
        })),
      };
      if (args.valid_till) quotation.valid_till = args.valid_till;
      if (args.notes) quotation.notes = args.notes;

      const data = await erpFetch("/resource/Quotation", {
        method: "POST",
        body: JSON.stringify({ data: quotation }),
      });
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
