#!/usr/bin/env node
/**
 * Payment Validation MCP Server
 * Validates payments against ERPNext orders and a custom Postgres payments table.
 *
 * Tools:
 *  - list_pending_payments: List orders awaiting payment
 *  - match_payment: Match a payment against pending orders
 *  - confirm_payment: Mark an order as paid
 *  - get_payment_methods: Get configured payment methods
 *  - create_payment_reminder: Schedule a payment reminder
 *  - get_payment_history: Get payment history for a customer
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// ── Configuration ────────────────────────────────────

const ERPNEXT_URL = process.env.ERPNEXT_URL || "http://localhost:8080";
const ERPNEXT_API_KEY = process.env.ERPNEXT_API_KEY || "";
const ERPNEXT_API_SECRET = process.env.ERPNEXT_API_SECRET || "";
const PAYMENTS_DB_URL = process.env.PAYMENTS_DB_URL || "";
const PAYMENTS_API_URL = process.env.PAYMENTS_API_URL || "";
const PAYMENTS_API_KEY = process.env.PAYMENTS_API_KEY || "";

// ── ERPNext API Client ───────────────────────────────

async function erpFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  const url = `${ERPNEXT_URL}/api${endpoint}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(ERPNEXT_API_KEY
      ? { Authorization: `token ${ERPNEXT_API_KEY}:${ERPNEXT_API_SECRET}` }
      : {}),
    ...(options.headers as Record<string, string>) || {},
  };

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ERPNext API ${res.status}: ${text}`);
  }
  return res.json();
}

// ── Payments DB Client (Postgres REST / custom API) ──

async function paymentsFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const url = `${PAYMENTS_API_URL}${endpoint}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(PAYMENTS_API_KEY ? { Authorization: `Bearer ${PAYMENTS_API_KEY}` } : {}),
    ...(options.headers as Record<string, string>) || {},
  };

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Payments API ${res.status}: ${text}`);
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("json")) {
    return res.json();
  }
  return {};
}

// ── Types ────────────────────────────────────────────

interface PaymentMatch {
  order_id: string;
  customer: string;
  order_amount: number;
  payment_amount: number;
  match_confidence: "exact" | "close" | "partial" | "none";
  difference: number;
}

// ── Tool Definitions ─────────────────────────────────

const TOOLS = [
  {
    name: "list_pending_payments",
    description:
      "List sales orders awaiting payment. Returns order IDs, customers, amounts, and dates.",
    inputSchema: {
      type: "object" as const,
      properties: {
        customer: {
          type: "string",
          description: "Filter by customer name (optional)",
        },
        from_date: {
          type: "string",
          description: "Start date filter, ISO format (optional)",
        },
        to_date: {
          type: "string",
          description: "End date filter, ISO format (optional)",
        },
        limit: { type: "number", description: "Max results (default 20)" },
      },
      required: [],
    },
  },
  {
    name: "match_payment",
    description:
      "Match a received payment (amount, reference, date) against pending orders. Returns best matches with confidence scores.",
    inputSchema: {
      type: "object" as const,
      properties: {
        amount: {
          type: "number",
          description: "Payment amount received",
        },
        reference: {
          type: "string",
          description: "Payment reference or transaction ID",
        },
        date: {
          type: "string",
          description: "Payment date (ISO format)",
        },
        customer: {
          type: "string",
          description: "Customer name to narrow matching (optional)",
        },
        payment_method: {
          type: "string",
          description: "Payment method used (e.g., mobile_money, bank_transfer, cash)",
        },
      },
      required: ["amount"],
    },
  },
  {
    name: "confirm_payment",
    description:
      "Mark an order as paid. Records the payment in the payments table and updates the order status in ERPNext.",
    inputSchema: {
      type: "object" as const,
      properties: {
        order_id: {
          type: "string",
          description: "Sales Order ID (e.g., SO-00001)",
        },
        amount: {
          type: "number",
          description: "Amount paid",
        },
        payment_method: {
          type: "string",
          enum: ["mobile_money", "bank_transfer", "cash", "card", "other"],
          description: "Payment method",
        },
        reference: {
          type: "string",
          description: "Payment reference or transaction ID",
        },
        date: {
          type: "string",
          description: "Payment date (ISO format, defaults to today)",
        },
        notes: {
          type: "string",
          description: "Payment notes (optional)",
        },
      },
      required: ["order_id", "amount", "payment_method"],
    },
  },
  {
    name: "get_payment_methods",
    description:
      "Get configured payment methods for the business (mobile money numbers, bank accounts, etc.).",
    inputSchema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "create_payment_reminder",
    description:
      "Schedule a payment reminder for a customer with a pending order.",
    inputSchema: {
      type: "object" as const,
      properties: {
        order_id: {
          type: "string",
          description: "Sales Order ID",
        },
        customer: {
          type: "string",
          description: "Customer name",
        },
        phone: {
          type: "string",
          description: "Customer phone number for reminder",
        },
        amount: {
          type: "number",
          description: "Amount due",
        },
        reminder_date: {
          type: "string",
          description: "When to send the reminder (ISO datetime)",
        },
        message: {
          type: "string",
          description: "Custom reminder message (optional, uses default template if omitted)",
        },
        channel: {
          type: "string",
          enum: ["whatsapp", "sms"],
          description: "Reminder channel (default: whatsapp)",
        },
      },
      required: ["order_id", "customer", "phone", "amount", "reminder_date"],
    },
  },
  {
    name: "get_payment_history",
    description:
      "Get payment history for a customer. Shows all past payments with dates, amounts, and methods.",
    inputSchema: {
      type: "object" as const,
      properties: {
        customer: {
          type: "string",
          description: "Customer name",
        },
        from_date: {
          type: "string",
          description: "Start date filter, ISO format (optional)",
        },
        to_date: {
          type: "string",
          description: "End date filter, ISO format (optional)",
        },
        limit: { type: "number", description: "Max results (default 20)" },
      },
      required: ["customer"],
    },
  },
];

// ── Tool Handlers ────────────────────────────────────

async function handleTool(name: string, args: Record<string, any>): Promise<string> {
  switch (name) {
    case "list_pending_payments": {
      const limit = args.limit || 20;
      const filters: string[][] = [
        ["docstatus", "=", "1"],
        ["status", "in", ["To Deliver and Bill", "To Bill"]],
      ];
      if (args.customer) {
        filters.push(["customer", "like", `%${args.customer}%`]);
      }
      if (args.from_date) {
        filters.push(["transaction_date", ">=", args.from_date]);
      }
      if (args.to_date) {
        filters.push(["transaction_date", "<=", args.to_date]);
      }

      const data = await erpFetch(
        `/resource/Sales Order?filters=${encodeURIComponent(JSON.stringify(filters))}&fields=${encodeURIComponent(JSON.stringify(["name", "customer", "grand_total", "transaction_date", "status", "currency"]))}&limit_page_length=${limit}&order_by=transaction_date desc`
      );
      return JSON.stringify(data.data, null, 2);
    }

    case "match_payment": {
      // Fetch pending orders, optionally filtered by customer
      const filters: string[][] = [
        ["docstatus", "=", "1"],
        ["status", "in", ["To Deliver and Bill", "To Bill"]],
      ];
      if (args.customer) {
        filters.push(["customer", "like", `%${args.customer}%`]);
      }

      const data = await erpFetch(
        `/resource/Sales Order?filters=${encodeURIComponent(JSON.stringify(filters))}&fields=${encodeURIComponent(JSON.stringify(["name", "customer", "grand_total", "transaction_date", "currency"]))}&limit_page_length=50&order_by=transaction_date desc`
      );

      const orders = data.data || [];
      const amount = Number(args.amount);
      const tolerance = amount * 0.02; // 2% tolerance for close matches

      const matches: PaymentMatch[] = orders
        .map((order: any) => {
          const orderAmount = Number(order.grand_total);
          const difference = Math.abs(orderAmount - amount);
          let match_confidence: PaymentMatch["match_confidence"];

          if (difference === 0) {
            match_confidence = "exact";
          } else if (difference <= tolerance) {
            match_confidence = "close";
          } else if (amount >= orderAmount * 0.5 && amount <= orderAmount * 1.5) {
            match_confidence = "partial";
          } else {
            match_confidence = "none";
          }

          return {
            order_id: order.name,
            customer: order.customer,
            order_amount: orderAmount,
            payment_amount: amount,
            match_confidence,
            difference,
          };
        })
        .filter((m: PaymentMatch) => m.match_confidence !== "none")
        .sort((a: PaymentMatch, b: PaymentMatch) => {
          const rank = { exact: 0, close: 1, partial: 2, none: 3 };
          return rank[a.match_confidence] - rank[b.match_confidence] || a.difference - b.difference;
        });

      return JSON.stringify(
        {
          payment: { amount: args.amount, reference: args.reference, date: args.date },
          matches,
          total_matches: matches.length,
        },
        null,
        2
      );
    }

    case "confirm_payment": {
      // 1. Record payment in payments table
      const payment = await paymentsFetch("/payments", {
        method: "POST",
        body: JSON.stringify({
          order_id: args.order_id,
          amount: args.amount,
          payment_method: args.payment_method,
          reference: args.reference || null,
          payment_date: args.date || new Date().toISOString().split("T")[0],
          notes: args.notes || null,
          status: "confirmed",
        }),
      });

      // 2. Create Payment Entry in ERPNext
      const paymentEntry = {
        doctype: "Payment Entry",
        payment_type: "Receive",
        party_type: "Customer",
        mode_of_payment: args.payment_method === "mobile_money"
          ? "Mobile Money"
          : args.payment_method === "bank_transfer"
            ? "Bank Transfer"
            : args.payment_method === "cash"
              ? "Cash"
              : args.payment_method === "card"
                ? "Credit Card"
                : "Cash",
        paid_amount: args.amount,
        received_amount: args.amount,
        reference_no: args.reference || args.order_id,
        reference_date: args.date || new Date().toISOString().split("T")[0],
        references: [
          {
            reference_doctype: "Sales Order",
            reference_name: args.order_id,
            allocated_amount: args.amount,
          },
        ],
      };

      // Fetch the order to get customer name
      const order = await erpFetch(`/resource/Sales Order/${args.order_id}`);
      (paymentEntry as any).party = order.data.customer;

      const erpPayment = await erpFetch("/resource/Payment Entry", {
        method: "POST",
        body: JSON.stringify({ data: paymentEntry }),
      });

      return JSON.stringify(
        {
          status: "confirmed",
          payment_record: payment,
          erpnext_payment_entry: erpPayment.data?.name,
          order_id: args.order_id,
        },
        null,
        2
      );
    }

    case "get_payment_methods": {
      const data = await paymentsFetch("/payment-methods");
      return JSON.stringify(data, null, 2);
    }

    case "create_payment_reminder": {
      const reminder = {
        order_id: args.order_id,
        customer: args.customer,
        phone: args.phone,
        amount: args.amount,
        reminder_date: args.reminder_date,
        message: args.message || null,
        channel: args.channel || "whatsapp",
        status: "scheduled",
      };

      const data = await paymentsFetch("/reminders", {
        method: "POST",
        body: JSON.stringify(reminder),
      });
      return JSON.stringify(data, null, 2);
    }

    case "get_payment_history": {
      const params = new URLSearchParams();
      params.set("customer", args.customer);
      if (args.from_date) params.set("from_date", args.from_date);
      if (args.to_date) params.set("to_date", args.to_date);
      params.set("limit", String(args.limit || 20));

      const data = await paymentsFetch(`/payments?${params.toString()}`);
      return JSON.stringify(data, null, 2);
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ── MCP Server Setup ─────────────────────────────────

const server = new Server(
  { name: "payments-mcp", version: "0.1.0" },
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
  console.error("Payments MCP server running on stdio");
}

main().catch(console.error);
