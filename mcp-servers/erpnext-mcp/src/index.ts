#!/usr/bin/env node
/**
 * ERPNext MCP Server
 * Exposes ERPNext REST API as MCP tools for OpenClaw agents.
 *
 * Tools:
 *  - search_products: Search product catalog
 *  - get_product: Get product details + stock
 *  - check_stock: Check inventory for an item
 *  - create_order: Create a sales order
 *  - get_order: Get order status
 *  - list_orders: List recent orders with filters
 *  - update_order: Update an existing sales order
 *  - cancel_order: Cancel a sales order
 *  - list_customers: Search customers
 *  - create_customer: Create a new customer
 *  - get_item_price: Get pricing for an item including discounts
 *  - create_quotation: Create a price quotation
 *  - create_payment_entry: Record a payment against a sales order
 *  - create_purchase_order: Create a purchase order to a supplier
 *  - create_item: Add a new product to the catalog
 *  - update_item: Update item details (price, description, etc.)
 *  - get_sales_summary: Aggregate sales data for a date range
 *  - get_customer_balance: Get outstanding balance for a customer
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
  {
    name: "create_payment_entry",
    description:
      "Record a payment received against a sales order. Use after verifying payment (e.g., Yape screenshot).",
    inputSchema: {
      type: "object" as const,
      properties: {
        sales_order: { type: "string", description: "Sales Order ID (e.g., SO-00001)" },
        amount: { type: "number", description: "Payment amount received" },
        payment_method: {
          type: "string",
          enum: ["Cash", "Bank Transfer", "Yape", "Plin", "Credit Card", "Other"],
          description: "Mode of payment",
        },
        reference_number: {
          type: "string",
          description: "Payment reference number or transaction ID (optional)",
        },
        date: {
          type: "string",
          description: "Payment date, ISO format (optional, defaults to today)",
        },
      },
      required: ["sales_order", "amount", "payment_method"],
    },
  },
  {
    name: "create_purchase_order",
    description:
      "Create a purchase order to a supplier for restocking inventory.",
    inputSchema: {
      type: "object" as const,
      properties: {
        supplier: { type: "string", description: "Supplier name" },
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              item_code: { type: "string" },
              qty: { type: "number" },
              rate: { type: "number", description: "Price per unit" },
            },
            required: ["item_code", "qty", "rate"],
          },
          description: "List of items to order from supplier",
        },
        schedule_date: {
          type: "string",
          description: "Expected delivery date, ISO format (optional)",
        },
        notes: { type: "string", description: "Order notes (optional)" },
      },
      required: ["supplier", "items"],
    },
  },
  {
    name: "create_item",
    description: "Add a new product to the ERPNext catalog.",
    inputSchema: {
      type: "object" as const,
      properties: {
        item_name: { type: "string", description: "Product name" },
        item_code: {
          type: "string",
          description: "Unique item code (optional, auto-generated if omitted)",
        },
        item_group: {
          type: "string",
          description: "Item group/category (e.g., Products, Raw Material)",
        },
        standard_rate: { type: "number", description: "Standard selling price" },
        description: { type: "string", description: "Product description (optional)" },
        stock_uom: { type: "string", description: "Unit of measure (default: Nos)" },
        is_stock_item: {
          type: "boolean",
          description: "Whether to track stock (default: true)",
        },
      },
      required: ["item_name", "item_group", "standard_rate"],
    },
  },
  {
    name: "update_item",
    description:
      "Update an existing product's details such as price, description, or stock settings.",
    inputSchema: {
      type: "object" as const,
      properties: {
        item_code: { type: "string", description: "ERPNext Item Code" },
        standard_rate: { type: "number", description: "New standard selling price (optional)" },
        description: { type: "string", description: "Updated description (optional)" },
        item_name: { type: "string", description: "Updated product name (optional)" },
        disabled: { type: "boolean", description: "Set to true to disable the item (optional)" },
      },
      required: ["item_code"],
    },
  },
  {
    name: "get_sales_summary",
    description:
      "Get aggregate sales data: total revenue, order count, and top-selling products for a date range.",
    inputSchema: {
      type: "object" as const,
      properties: {
        from_date: { type: "string", description: "Start date, ISO format (e.g., 2025-01-01)" },
        to_date: { type: "string", description: "End date, ISO format (e.g., 2025-01-31)" },
        customer: { type: "string", description: "Filter by customer (optional)" },
      },
      required: ["from_date", "to_date"],
    },
  },
  {
    name: "get_customer_balance",
    description:
      "Get the total outstanding balance for a customer across all unpaid invoices and orders.",
    inputSchema: {
      type: "object" as const,
      properties: {
        customer: { type: "string", description: "Customer name" },
      },
      required: ["customer"],
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

    case "create_payment_entry": {
      // Get sales order to resolve customer and currency
      const so = await erpFetch(`/resource/Sales Order/${args.sales_order}`);
      const soData = so.data;
      const paymentDate = args.date || new Date().toISOString().split("T")[0];

      const payment: Record<string, any> = {
        doctype: "Payment Entry",
        payment_type: "Receive",
        party_type: "Customer",
        party: soData.customer,
        paid_amount: args.amount,
        received_amount: args.amount,
        target_exchange_rate: 1,
        paid_to_account_currency: soData.currency || "PEN",
        mode_of_payment: args.payment_method,
        reference_no: args.reference_number || "",
        reference_date: paymentDate,
        posting_date: paymentDate,
        references: [
          {
            reference_doctype: "Sales Order",
            reference_name: args.sales_order,
            allocated_amount: args.amount,
          },
        ],
      };

      const data = await erpFetch("/resource/Payment Entry", {
        method: "POST",
        body: JSON.stringify({ data: payment }),
      });
      return JSON.stringify(data.data, null, 2);
    }

    case "create_purchase_order": {
      const scheduleDate =
        args.schedule_date || new Date().toISOString().split("T")[0];
      const po: Record<string, any> = {
        doctype: "Purchase Order",
        supplier: args.supplier,
        items: args.items.map((item: any) => ({
          item_code: item.item_code,
          qty: item.qty,
          rate: item.rate,
          schedule_date: scheduleDate,
        })),
      };
      if (args.notes) po.notes = args.notes;

      const data = await erpFetch("/resource/Purchase Order", {
        method: "POST",
        body: JSON.stringify({ data: po }),
      });
      return JSON.stringify(data.data, null, 2);
    }

    case "create_item": {
      const item: Record<string, any> = {
        doctype: "Item",
        item_name: args.item_name,
        item_group: args.item_group,
        standard_rate: args.standard_rate,
        stock_uom: args.stock_uom || "Nos",
        is_stock_item: args.is_stock_item !== false ? 1 : 0,
      };
      if (args.item_code) item.item_code = args.item_code;
      if (args.description) item.description = args.description;

      const data = await erpFetch("/resource/Item", {
        method: "POST",
        body: JSON.stringify({ data: item }),
      });
      return JSON.stringify(data.data, null, 2);
    }

    case "update_item": {
      const updates: Record<string, any> = {};
      if (args.standard_rate !== undefined) updates.standard_rate = args.standard_rate;
      if (args.description !== undefined) updates.description = args.description;
      if (args.item_name !== undefined) updates.item_name = args.item_name;
      if (args.disabled !== undefined) updates.disabled = args.disabled ? 1 : 0;

      if (Object.keys(updates).length === 0) {
        throw new Error(
          "No fields to update. Provide standard_rate, description, item_name, or disabled."
        );
      }

      const data = await erpFetch(
        `/resource/Item/${encodeURIComponent(args.item_code)}`,
        {
          method: "PUT",
          body: JSON.stringify({ data: updates }),
        }
      );
      return JSON.stringify(data.data, null, 2);
    }

    case "get_sales_summary": {
      // Fetch submitted sales orders in the date range
      const soFilters: any[][] = [
        ["transaction_date", ">=", args.from_date],
        ["transaction_date", "<=", args.to_date],
        ["docstatus", "=", 1],
      ];
      if (args.customer) {
        soFilters.push(["customer", "like", `%${args.customer}%`]);
      }

      const orders = await erpFetch(
        `/resource/Sales Order?filters=${encodeURIComponent(JSON.stringify(soFilters))}&fields=${encodeURIComponent(JSON.stringify(["name", "customer", "grand_total", "status", "transaction_date", "currency"]))}&limit_page_length=0`
      );

      const orderList: any[] = orders.data || [];
      const totalRevenue = orderList.reduce(
        (sum: number, o: any) => sum + (o.grand_total || 0),
        0
      );

      // Fetch order items to compute top products
      const productCounts: Record<string, { qty: number; revenue: number }> = {};
      for (const order of orderList) {
        try {
          const detail = await erpFetch(
            `/resource/Sales Order/${order.name}`
          );
          const items: any[] = detail.data?.items || [];
          for (const it of items) {
            if (!productCounts[it.item_code]) {
              productCounts[it.item_code] = { qty: 0, revenue: 0 };
            }
            productCounts[it.item_code].qty += it.qty || 0;
            productCounts[it.item_code].revenue += it.amount || 0;
          }
        } catch {
          // Skip orders whose details we can't fetch
        }
      }

      const topProducts = Object.entries(productCounts)
        .sort(([, a], [, b]) => b.revenue - a.revenue)
        .slice(0, 10)
        .map(([item_code, stats]) => ({ item_code, ...stats }));

      return JSON.stringify(
        {
          from_date: args.from_date,
          to_date: args.to_date,
          total_revenue: totalRevenue,
          order_count: orderList.length,
          currency: orderList[0]?.currency || "PEN",
          top_products: topProducts,
        },
        null,
        2
      );
    }

    case "get_customer_balance": {
      // Unpaid sales invoices
      const invFilters = [
        ["customer", "=", args.customer],
        ["docstatus", "=", 1],
        ["outstanding_amount", ">", 0],
      ];
      const invoices = await erpFetch(
        `/resource/Sales Invoice?filters=${encodeURIComponent(JSON.stringify(invFilters))}&fields=${encodeURIComponent(JSON.stringify(["name", "grand_total", "outstanding_amount", "posting_date", "currency"]))}&limit_page_length=0`
      );
      const invoiceList: any[] = invoices.data || [];
      const totalOutstanding = invoiceList.reduce(
        (sum: number, inv: any) => sum + (inv.outstanding_amount || 0),
        0
      );

      // Unpaid sales orders (billed but not fully paid)
      const soFilters = [
        ["customer", "=", args.customer],
        ["docstatus", "=", 1],
        ["status", "in", ["To Deliver and Bill", "To Bill"]],
      ];
      const salesOrders = await erpFetch(
        `/resource/Sales Order?filters=${encodeURIComponent(JSON.stringify(soFilters))}&fields=${encodeURIComponent(JSON.stringify(["name", "grand_total", "advance_paid", "status", "transaction_date", "currency"]))}&limit_page_length=0`
      );
      const soList: any[] = salesOrders.data || [];
      const unbilledTotal = soList.reduce(
        (sum: number, s: any) => sum + ((s.grand_total || 0) - (s.advance_paid || 0)),
        0
      );

      return JSON.stringify(
        {
          customer: args.customer,
          outstanding_invoices: totalOutstanding,
          unbilled_orders: unbilledTotal,
          total_balance: totalOutstanding + unbilledTotal,
          currency: invoiceList[0]?.currency || soList[0]?.currency || "PEN",
          invoice_count: invoiceList.length,
          unpaid_order_count: soList.length,
          invoices: invoiceList,
          orders: soList,
        },
        null,
        2
      );
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
