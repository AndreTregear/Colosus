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
 *  - process_refund: Initiate a refund for an order
 *  - search_payment_by_amount: Search recent payments by approximate amount
 *  - get_daily_collection_summary: Total collected today by payment method
 *  - create_return_authorization: Create a return/exchange authorization in ERPNext
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
  {
    name: "process_refund",
    description:
      "Initiate a refund for an order. Creates a refund record and a Return Payment Entry in ERPNext. For refunds above the configured threshold, requires prior owner approval (not enforced here — the skill must check before calling).",
    inputSchema: {
      type: "object" as const,
      properties: {
        order_id: {
          type: "string",
          description: "Original Sales Order ID (e.g., SO-00001)",
        },
        amount: {
          type: "number",
          description: "Refund amount (may be less than order total for partial refunds)",
        },
        reason: {
          type: "string",
          description: "Reason for refund (e.g., damaged, wrong_item, changed_mind, not_as_described)",
        },
        method: {
          type: "string",
          enum: ["mobile_money", "bank_transfer", "store_credit"],
          description: "Refund method",
        },
        return_authorization: {
          type: "string",
          description: "Return authorization ID / RMA number (optional)",
        },
        notes: {
          type: "string",
          description: "Additional notes (optional)",
        },
      },
      required: ["order_id", "amount", "reason", "method"],
    },
  },
  {
    name: "search_payment_by_amount",
    description:
      "Search recent payments by approximate amount (±5% tolerance). Useful for matching unidentified Yape or bank transfer payments when only the amount is known.",
    inputSchema: {
      type: "object" as const,
      properties: {
        amount: {
          type: "number",
          description: "Approximate payment amount to search for",
        },
        tolerance_percent: {
          type: "number",
          description: "Tolerance percentage for fuzzy matching (default: 5)",
        },
        from_date: {
          type: "string",
          description: "Start date for search range, ISO format (default: 7 days ago)",
        },
        to_date: {
          type: "string",
          description: "End date for search range, ISO format (default: today)",
        },
        payment_method: {
          type: "string",
          description: "Filter by payment method (optional)",
        },
        limit: { type: "number", description: "Max results (default 20)" },
      },
      required: ["amount"],
    },
  },
  {
    name: "get_daily_collection_summary",
    description:
      "Get total collected today (or a specific date) broken down by payment method (Yape, BCP, cash, etc.). Useful for end-of-day reconciliation.",
    inputSchema: {
      type: "object" as const,
      properties: {
        date: {
          type: "string",
          description: "Date to summarize, ISO format (default: today)",
        },
      },
      required: [],
    },
  },
  {
    name: "create_return_authorization",
    description:
      "Create a return merchandise authorization (RMA) in ERPNext. Links to the original Sales Order and records the return reason, items, and expected refund.",
    inputSchema: {
      type: "object" as const,
      properties: {
        order_id: {
          type: "string",
          description: "Original Sales Order ID",
        },
        reason: {
          type: "string",
          enum: ["damaged", "wrong_item", "size_issue", "changed_mind", "not_as_described", "other"],
          description: "Return reason",
        },
        items: {
          type: "array",
          description: "Items being returned (item_code, qty, optional reason per item)",
          items: {
            type: "object",
            properties: {
              item_code: { type: "string", description: "ERPNext Item Code" },
              qty: { type: "number", description: "Quantity to return" },
              reason: { type: "string", description: "Item-specific reason (optional)" },
            },
            required: ["item_code", "qty"],
          },
        },
        refund_method: {
          type: "string",
          enum: ["mobile_money", "bank_transfer", "store_credit"],
          description: "Preferred refund method",
        },
        customer_notes: {
          type: "string",
          description: "Customer's description of the issue (optional)",
        },
        has_photos: {
          type: "boolean",
          description: "Whether damage/issue photos were provided (optional)",
        },
      },
      required: ["order_id", "reason", "items"],
    },
  },
];

// ── Tool Handlers ────────────────────────────────────

async function handleTool(name: string, args: Record<string, any>): Promise<string> {
  switch (name) {
    case "list_pending_payments": {
      const limit = args.limit || 20;
      const filters: (string | string[])[][] = [
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
      const filters: (string | string[])[][] = [
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

    case "process_refund": {
      // 1. Fetch original order to get customer and validate
      const order = await erpFetch(`/resource/Sales Order/${args.order_id}`);
      const customer = order.data.customer;
      const orderTotal = Number(order.data.grand_total);

      if (args.amount > orderTotal) {
        throw new Error(
          `Refund amount (${args.amount}) exceeds order total (${orderTotal})`
        );
      }

      // 2. Record refund in payments table
      const refundRecord = await paymentsFetch("/refunds", {
        method: "POST",
        body: JSON.stringify({
          order_id: args.order_id,
          customer,
          amount: args.amount,
          reason: args.reason,
          method: args.method,
          return_authorization: args.return_authorization || null,
          notes: args.notes || null,
          status: args.method === "store_credit" ? "completed" : "processing",
          created_at: new Date().toISOString(),
        }),
      });

      // 3. Create return Payment Entry in ERPNext (except for store credit)
      let erpPaymentEntry = null;
      if (args.method !== "store_credit") {
        const paymentEntry = {
          doctype: "Payment Entry",
          payment_type: "Pay",
          party_type: "Customer",
          party: customer,
          mode_of_payment:
            args.method === "mobile_money"
              ? "Mobile Money"
              : args.method === "bank_transfer"
                ? "Bank Transfer"
                : "Cash",
          paid_amount: args.amount,
          received_amount: args.amount,
          reference_no: args.return_authorization || `REFUND-${args.order_id}`,
          reference_date: new Date().toISOString().split("T")[0],
          remarks: `Refund for ${args.order_id}: ${args.reason}`,
          references: [
            {
              reference_doctype: "Sales Order",
              reference_name: args.order_id,
              allocated_amount: args.amount,
            },
          ],
        };

        const erpResult = await erpFetch("/resource/Payment Entry", {
          method: "POST",
          body: JSON.stringify({ data: paymentEntry }),
        });
        erpPaymentEntry = erpResult.data?.name;
      }

      // 4. For store credit, record in the credits ledger
      if (args.method === "store_credit") {
        await paymentsFetch("/store-credits", {
          method: "POST",
          body: JSON.stringify({
            customer,
            amount: args.amount,
            source_order: args.order_id,
            reason: args.reason,
            expires_at: new Date(
              Date.now() + 90 * 24 * 60 * 60 * 1000
            ).toISOString(),
          }),
        });
      }

      return JSON.stringify(
        {
          status: args.method === "store_credit" ? "completed" : "processing",
          refund_record: refundRecord,
          erpnext_payment_entry: erpPaymentEntry,
          order_id: args.order_id,
          customer,
          amount: args.amount,
          method: args.method,
          reason: args.reason,
        },
        null,
        2
      );
    }

    case "search_payment_by_amount": {
      const amount = Number(args.amount);
      const tolerancePercent = args.tolerance_percent || 5;
      const minAmount = amount * (1 - tolerancePercent / 100);
      const maxAmount = amount * (1 + tolerancePercent / 100);
      const limit = args.limit || 20;

      const today = new Date().toISOString().split("T")[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      const params = new URLSearchParams();
      params.set("min_amount", String(minAmount));
      params.set("max_amount", String(maxAmount));
      params.set("from_date", args.from_date || weekAgo);
      params.set("to_date", args.to_date || today);
      if (args.payment_method) params.set("payment_method", args.payment_method);
      params.set("limit", String(limit));

      const data = await paymentsFetch(
        `/payments/search?${params.toString()}`
      );

      // Enrich results with match quality
      const results = (data.payments || data || []).map((p: any) => ({
        ...p,
        difference: Math.abs(Number(p.amount) - amount),
        match_quality:
          Number(p.amount) === amount
            ? "exact"
            : Math.abs(Number(p.amount) - amount) <= amount * 0.02
              ? "very_close"
              : "approximate",
      }));

      results.sort(
        (a: { difference: number }, b: { difference: number }) =>
          a.difference - b.difference
      );

      return JSON.stringify(
        {
          search: {
            target_amount: amount,
            tolerance: `±${tolerancePercent}%`,
            range: { min: minAmount, max: maxAmount },
          },
          results,
          total_found: results.length,
        },
        null,
        2
      );
    }

    case "get_daily_collection_summary": {
      const date =
        args.date || new Date().toISOString().split("T")[0];

      // Fetch confirmed payments for the date from payments DB
      const data = await paymentsFetch(
        `/payments/summary?date=${date}`
      );

      // Also fetch from ERPNext Payment Entries for cross-reference
      const erpFilters = JSON.stringify([
        ["docstatus", "=", "1"],
        ["posting_date", "=", date],
        ["payment_type", "=", "Receive"],
      ]);
      const erpFields = JSON.stringify([
        "name",
        "mode_of_payment",
        "paid_amount",
        "party",
        "reference_no",
      ]);
      const erpData = await erpFetch(
        `/resource/Payment Entry?filters=${encodeURIComponent(erpFilters)}&fields=${encodeURIComponent(erpFields)}&limit_page_length=100&order_by=creation desc`
      );

      // Aggregate ERPNext entries by payment method
      const erpEntries = erpData.data || [];
      const byMethod: Record<
        string,
        { count: number; total: number; payments: any[] }
      > = {};

      for (const entry of erpEntries) {
        const method = entry.mode_of_payment || "Other";
        if (!byMethod[method]) {
          byMethod[method] = { count: 0, total: 0, payments: [] };
        }
        byMethod[method].count++;
        byMethod[method].total += Number(entry.paid_amount);
        byMethod[method].payments.push({
          id: entry.name,
          customer: entry.party,
          amount: entry.paid_amount,
          reference: entry.reference_no,
        });
      }

      const grandTotal = erpEntries.reduce(
        (sum: number, e: any) => sum + Number(e.paid_amount),
        0
      );

      return JSON.stringify(
        {
          date,
          grand_total: grandTotal,
          total_transactions: erpEntries.length,
          by_method: byMethod,
          payments_db_summary: data,
        },
        null,
        2
      );
    }

    case "create_return_authorization": {
      // 1. Fetch original order for validation
      const order = await erpFetch(
        `/resource/Sales Order/${args.order_id}`
      );
      const customer = order.data.customer;

      // 2. Verify the order is in a returnable state
      const status = order.data.status;
      const returnableStatuses = [
        "Completed",
        "To Deliver and Bill",
        "To Bill",
        "To Deliver",
      ];
      if (!returnableStatuses.includes(status)) {
        throw new Error(
          `Order ${args.order_id} has status "${status}" and is not eligible for returns`
        );
      }

      // 3. Calculate refund amount from the items being returned
      const orderItems = order.data.items || [];
      let refundAmount = 0;
      const returnItems = [];

      for (const returnItem of args.items) {
        const orderItem = orderItems.find(
          (oi: any) => oi.item_code === returnItem.item_code
        );
        if (!orderItem) {
          throw new Error(
            `Item ${returnItem.item_code} not found in order ${args.order_id}`
          );
        }
        if (returnItem.qty > orderItem.qty) {
          throw new Error(
            `Return qty (${returnItem.qty}) exceeds ordered qty (${orderItem.qty}) for ${returnItem.item_code}`
          );
        }
        const unitRate = Number(orderItem.rate);
        const itemRefund = unitRate * returnItem.qty;
        refundAmount += itemRefund;
        returnItems.push({
          item_code: returnItem.item_code,
          item_name: orderItem.item_name,
          qty: returnItem.qty,
          rate: unitRate,
          amount: itemRefund,
          reason: returnItem.reason || args.reason,
        });
      }

      // 4. Create the return authorization record in payments DB
      const rma = await paymentsFetch("/return-authorizations", {
        method: "POST",
        body: JSON.stringify({
          order_id: args.order_id,
          customer,
          reason: args.reason,
          items: returnItems,
          refund_amount: refundAmount,
          refund_method: args.refund_method || null,
          customer_notes: args.customer_notes || null,
          has_photos: args.has_photos || false,
          status: "authorized",
          created_at: new Date().toISOString(),
        }),
      });

      // 5. Create a Sales Return (negative Stock Entry) in ERPNext
      // so inventory is updated when the item is received back
      const stockEntry = {
        doctype: "Stock Entry",
        stock_entry_type: "Material Receipt",
        remarks: `Return for ${args.order_id} — RMA ${rma.id || rma.name || "pending"}`,
        items: returnItems.map((item) => ({
          item_code: item.item_code,
          qty: item.qty,
          s_warehouse: null,
          t_warehouse: "Stores - YP", // Default return warehouse
        })),
      };

      let stockEntryResult = null;
      try {
        const erpResult = await erpFetch("/resource/Stock Entry", {
          method: "POST",
          body: JSON.stringify({ data: stockEntry }),
        });
        stockEntryResult = erpResult.data?.name;
      } catch {
        // Stock entry creation is non-critical — log but don't fail
        stockEntryResult = "pending_manual_entry";
      }

      return JSON.stringify(
        {
          status: "authorized",
          rma_id: rma.id || rma.name,
          order_id: args.order_id,
          customer,
          reason: args.reason,
          items: returnItems,
          refund_amount: refundAmount,
          refund_method: args.refund_method || "pending_selection",
          stock_entry: stockEntryResult,
          has_photos: args.has_photos || false,
        },
        null,
        2
      );
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
