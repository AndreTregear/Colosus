#!/usr/bin/env node
/**
 * Invoicing MCP Server — Multi-Country Provider Adapter Pattern
 *
 * Supports: Peru (APISUNAT.pe), Mexico (Facturapi), Colombia (MATIAS), Panama (eFacturaPTY)
 * Country selection via INVOICE_COUNTRY env var (default: PE).
 *
 * Tools:
 *  1. create_invoice       — Create and submit invoice/receipt
 *  2. create_credit_note   — Issue credit note against existing document
 *  3. create_debit_note    — Issue debit note against existing document
 *  4. void_invoice         — Void/annul a document
 *  5. get_daily_summary    — Generate daily summary (Peru boletas batch)
 *  6. lookup_tax_id        — Validate tax ID (RUC/RFC/NIT/RUC-PA)
 *  7. get_invoice_status   — Check status of submitted document
 *  8. list_invoices        — List issued invoices with filters
 *  9. get_tax_obligations  — Get obligations for a business regime
 * 10. calculate_tax        — Calculate tax owed for given revenue
 * 11. health_check         — Check provider connectivity
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { getAdapter, listAdapters } from "./adapters/registry.js";
import type { InvoiceData, LineItem } from "./types.js";

// ── Configuration ────────────────────────────────────────

const INVOICE_COUNTRY = process.env.INVOICE_COUNTRY || "PE";

// ── Tool Definitions ─────────────────────────────────────

const TOOLS = [
  {
    name: "create_invoice",
    description:
      "Create and submit an electronic invoice or receipt. Document type depends on country: Peru (factura 01/boleta 03), Mexico (CFDI ingreso), Colombia (FE), Panama (factura interna). Returns tax authority response, PDF link, and document hash.",
    inputSchema: {
      type: "object" as const,
      properties: {
        document_type: {
          type: "string",
          enum: ["invoice", "receipt"],
          description: "invoice = factura/CFDI/FE (business-to-business), receipt = boleta (consumer, Peru only)",
        },
        customer_tax_id: { type: "string", description: "Customer tax ID (RUC, RFC, NIT, cédula)" },
        customer_doc_type: {
          type: "string",
          enum: ["RUC", "DNI", "CE", "RFC", "NIT", "RUC-PA", "PASSPORT"],
          description: "Customer ID document type",
        },
        customer_name: { type: "string", description: "Customer legal name" },
        customer_address: { type: "string", description: "Customer address (optional)" },
        customer_email: { type: "string", description: "Customer email (optional)" },
        customer_tax_system: { type: "string", description: "Mexico only: customer tax regime code (e.g., 601)" },
        customer_postal_code: { type: "string", description: "Mexico only: customer postal code (required for CFDI 4.0)" },
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              description: { type: "string", description: "Item description" },
              quantity: { type: "number", description: "Quantity" },
              unit_price: { type: "number", description: "Unit price before tax" },
              tax_rate: { type: "number", description: "Tax rate as decimal (0.18 for IGV, 0.16 for IVA, 0.07 for ITBMS). Default: country standard rate" },
              unit_code: { type: "string", description: "Unit code: NIU (units), ZZ (service), KGM (kg). Default: NIU" },
              tax_type: { type: "string", description: "Tax type: IGV, IVA, ITBMS, EXO, INA, GRA. Default: country standard" },
              item_code: { type: "string", description: "Internal item/product code (optional)" },
            },
            required: ["description", "quantity", "unit_price"],
          },
          description: "Line items",
        },
        currency: { type: "string", description: "ISO 4217 currency code (PEN, MXN, COP, USD, PAB). Default: country standard" },
        payment_method: { type: "string", description: "Payment method/terms (optional)" },
        notes: { type: "string", description: "Invoice notes/observations (optional)" },
        series: { type: "string", description: "Document series (optional, auto-assigned if omitted)" },
        due_date: { type: "string", description: "Payment due date ISO format (optional)" },
        exchange_rate: { type: "number", description: "Exchange rate for foreign currency (optional)" },
        purchase_order: { type: "string", description: "Customer purchase order number (optional)" },
        cfdi_use: { type: "string", description: "Mexico only: CFDI use code (default: G03)" },
        payment_form: { type: "string", description: "Mexico only: payment form code (default: 01 = cash)" },
      },
      required: ["document_type", "customer_tax_id", "customer_doc_type", "customer_name", "items"],
    },
  },
  {
    name: "create_credit_note",
    description:
      "Issue a credit note against an existing invoice. Used for: voids, corrections, discounts, returns. Requires reference to original document.",
    inputSchema: {
      type: "object" as const,
      properties: {
        reference_document: { type: "string", description: "Original document number (e.g., F001-00000001, UUID)" },
        reference_document_type: { type: "string", description: "Type of referenced document (01, 03, I, FE)" },
        reason_code: {
          type: "string",
          description: "Reason code. Peru: 01=void, 02=correction, 03=discount. Mexico: 01=NC de documentos relacionados",
        },
        reason: { type: "string", description: "Description of why the credit note is issued" },
        customer_tax_id: { type: "string", description: "Customer tax ID" },
        customer_doc_type: { type: "string", enum: ["RUC", "DNI", "CE", "RFC", "NIT", "RUC-PA"] },
        customer_name: { type: "string", description: "Customer legal name" },
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              description: { type: "string" },
              quantity: { type: "number" },
              unit_price: { type: "number" },
              unit_code: { type: "string" },
              tax_rate: { type: "number" },
            },
            required: ["description", "quantity", "unit_price"],
          },
          description: "Items being credited",
        },
        currency: { type: "string", description: "Currency (default: country standard)" },
      },
      required: ["reference_document", "reference_document_type", "reason_code", "reason", "customer_tax_id", "customer_doc_type", "customer_name", "items"],
    },
  },
  {
    name: "create_debit_note",
    description:
      "Issue a debit note against an existing invoice. Used for: interest charges, penalties, price increases.",
    inputSchema: {
      type: "object" as const,
      properties: {
        reference_document: { type: "string", description: "Original document number" },
        reference_document_type: { type: "string", description: "Type of referenced document" },
        reason_code: {
          type: "string",
          description: "Reason code. Peru: 01=interest, 02=penalties, 03=price increase",
        },
        reason: { type: "string", description: "Description of why the debit note is issued" },
        customer_tax_id: { type: "string", description: "Customer tax ID" },
        customer_doc_type: { type: "string", enum: ["RUC", "DNI", "CE", "RFC", "NIT", "RUC-PA"] },
        customer_name: { type: "string", description: "Customer legal name" },
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              description: { type: "string" },
              quantity: { type: "number" },
              unit_price: { type: "number" },
              unit_code: { type: "string" },
              tax_rate: { type: "number" },
            },
            required: ["description", "quantity", "unit_price"],
          },
          description: "Items being debited",
        },
        currency: { type: "string", description: "Currency (default: country standard)" },
      },
      required: ["reference_document", "reference_document_type", "reason_code", "reason", "customer_tax_id", "customer_doc_type", "customer_name", "items"],
    },
  },
  {
    name: "void_invoice",
    description:
      "Void/annul an existing invoice. Peru: comunicación de baja (within 7 days). Mexico: cancelación CFDI. Colombia: nota de crédito. Panama: anulación via PAC.",
    inputSchema: {
      type: "object" as const,
      properties: {
        document_id: { type: "string", description: "Document ID or number to void" },
        document_type: { type: "string", description: "Document type code (01, 03, I, FE)" },
        reason: { type: "string", description: "Reason for voiding" },
      },
      required: ["document_id", "document_type", "reason"],
    },
  },
  {
    name: "get_daily_summary",
    description:
      "Generate daily summary for batch submission (Peru: resumen diario for boletas). Not applicable in Mexico/Colombia/Panama where documents are sent individually.",
    inputSchema: {
      type: "object" as const,
      properties: {
        date: {
          type: "string",
          description: "Date for the summary in ISO format (e.g., 2026-03-21)",
        },
      },
      required: ["date"],
    },
  },
  {
    name: "lookup_tax_id",
    description:
      "Validate a tax ID and get entity information. Peru: RUC (11 digits) or DNI (8 digits). Mexico: RFC (12-13 chars). Colombia: NIT (9-10 digits). Panama: RUC (various formats).",
    inputSchema: {
      type: "object" as const,
      properties: {
        tax_id: { type: "string", description: "Tax ID to validate (RUC, RFC, NIT, cédula)" },
      },
      required: ["tax_id"],
    },
  },
  {
    name: "get_invoice_status",
    description:
      "Check the status of a submitted document. Returns tax authority acceptance/rejection and response details.",
    inputSchema: {
      type: "object" as const,
      properties: {
        document_id: { type: "string", description: "Document ID or ticket number to check" },
      },
      required: ["document_id"],
    },
  },
  {
    name: "list_invoices",
    description:
      "List issued invoices with optional filters by date, type, status, or customer.",
    inputSchema: {
      type: "object" as const,
      properties: {
        from_date: { type: "string", description: "Start date filter, ISO format (optional)" },
        to_date: { type: "string", description: "End date filter, ISO format (optional)" },
        document_type: { type: "string", description: "Filter by document type code (optional)" },
        status: {
          type: "string",
          enum: ["accepted", "rejected", "pending"],
          description: "Filter by status (optional)",
        },
        customer_tax_id: { type: "string", description: "Filter by customer tax ID (optional)" },
        limit: { type: "number", description: "Max results (default 20)" },
      },
      required: [],
    },
  },
  {
    name: "get_tax_obligations",
    description:
      "Get tax obligations for a given business regime. Peru: NRUS/RER/RMT/RG. Mexico: RESICO/GENERAL. Colombia: SIMPLE/ORDINARIO. Panama: NATURAL/JURIDICA.",
    inputSchema: {
      type: "object" as const,
      properties: {
        regime: {
          type: "string",
          description: "Tax regime code (country-specific)",
        },
      },
      required: ["regime"],
    },
  },
  {
    name: "calculate_tax",
    description:
      "Calculate tax payable for a given regime, monthly revenue, and purchases. Returns tax breakdown including sales tax, income tax, and total monthly obligation.",
    inputSchema: {
      type: "object" as const,
      properties: {
        regime: { type: "string", description: "Tax regime code" },
        monthly_revenue: { type: "number", description: "Monthly sales revenue (before tax)" },
        monthly_purchases: { type: "number", description: "Monthly purchases (before tax)" },
        annual_revenue: { type: "number", description: "Estimated annual revenue (optional, used for rate determination)" },
      },
      required: ["regime", "monthly_revenue", "monthly_purchases"],
    },
  },
  {
    name: "health_check",
    description:
      "Check invoicing provider connectivity and authentication status. Returns country, provider, environment, and auth status.",
    inputSchema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
];

// ── Default Tax Rates by Country ─────────────────────────

function getDefaultTaxRate(country: string): number {
  switch (country) {
    case "PE": return 0.18;  // IGV
    case "MX": return 0.16;  // IVA
    case "CO": return 0.19;  // IVA
    case "PA": return 0.07;  // ITBMS
    default: return 0.18;
  }
}

// ── Build InvoiceData from Tool Args ─────────────────────

function buildItems(args: Record<string, any>, country: string): LineItem[] {
  const defaultRate = getDefaultTaxRate(country);
  return (args.items || []).map((item: any) => ({
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    tax_rate: item.tax_rate ?? defaultRate,
    unit_code: item.unit_code || "NIU",
    tax_type: item.tax_type,
    item_code: item.item_code,
    discount: item.discount,
  }));
}

function buildCustomer(args: Record<string, any>): InvoiceData["customer"] {
  return {
    tax_id: args.customer_tax_id,
    doc_type: args.customer_doc_type,
    name: args.customer_name,
    address: args.customer_address
      ? { street: args.customer_address, city: "", state: "", country: INVOICE_COUNTRY }
      : undefined,
    email: args.customer_email,
    tax_system: args.customer_tax_system,
  };
}

// ── Tool Handlers ────────────────────────────────────────

async function handleTool(name: string, args: Record<string, any>): Promise<string> {
  const adapter = getAdapter(INVOICE_COUNTRY);

  switch (name) {
    case "create_invoice": {
      const data: InvoiceData = {
        document_type: args.document_type,
        customer: buildCustomer(args),
        items: buildItems(args, INVOICE_COUNTRY),
        currency: args.currency || adapter.currency,
        payment_method: args.payment_method,
        notes: args.notes,
        series: args.series,
        issue_date: args.issue_date,
        due_date: args.due_date,
        exchange_rate: args.exchange_rate,
        purchase_order: args.purchase_order,
        cfdi_use: args.cfdi_use,
        payment_form: args.payment_form,
      };

      // Peru validation: factura requires RUC, boleta requires DNI
      if (INVOICE_COUNTRY === "PE") {
        if (args.document_type === "invoice" && args.customer_doc_type !== "RUC") {
          throw new Error("Peru factura requires customer with RUC. Use 'receipt' for DNI/anonymous customers.");
        }
      }

      const result = await adapter.createInvoice(data);
      return JSON.stringify(result, null, 2);
    }

    case "create_credit_note": {
      const data: InvoiceData = {
        document_type: "credit_note",
        customer: buildCustomer(args),
        items: buildItems(args, INVOICE_COUNTRY),
        currency: args.currency || adapter.currency,
        reference_document: args.reference_document,
        reference_document_type: args.reference_document_type,
        reason_code: args.reason_code,
        reason: args.reason,
      };
      const result = await adapter.createCreditNote(data);
      return JSON.stringify(result, null, 2);
    }

    case "create_debit_note": {
      const data: InvoiceData = {
        document_type: "debit_note",
        customer: buildCustomer(args),
        items: buildItems(args, INVOICE_COUNTRY),
        currency: args.currency || adapter.currency,
        reference_document: args.reference_document,
        reference_document_type: args.reference_document_type,
        reason_code: args.reason_code,
        reason: args.reason,
      };
      const result = await adapter.createDebitNote(data);
      return JSON.stringify(result, null, 2);
    }

    case "void_invoice": {
      const result = await adapter.voidInvoice(
        args.document_id,
        args.document_type,
        args.reason
      );
      return JSON.stringify(result, null, 2);
    }

    case "get_daily_summary": {
      const result = await adapter.getDailySummary(args.date);
      return JSON.stringify(result, null, 2);
    }

    case "lookup_tax_id": {
      const result = await adapter.lookupTaxId(args.tax_id);
      return JSON.stringify(result, null, 2);
    }

    case "get_invoice_status": {
      const result = await adapter.getInvoiceStatus(args.document_id);
      return JSON.stringify(result, null, 2);
    }

    case "list_invoices": {
      const result = await adapter.listInvoices({
        from_date: args.from_date,
        to_date: args.to_date,
        document_type: args.document_type,
        status: args.status,
        customer_tax_id: args.customer_tax_id,
        limit: args.limit,
      });
      return JSON.stringify(result, null, 2);
    }

    case "get_tax_obligations": {
      const obligations = adapter.getTaxObligations(args.regime);
      return JSON.stringify({
        country: adapter.countryCode,
        country_name: adapter.countryName,
        regime: args.regime,
        obligations,
      }, null, 2);
    }

    case "calculate_tax": {
      const result = adapter.calculateTax({
        regime: args.regime,
        monthly_revenue: args.monthly_revenue,
        monthly_purchases: args.monthly_purchases,
        annual_revenue: args.annual_revenue,
      });
      return JSON.stringify(result, null, 2);
    }

    case "health_check": {
      const result = await adapter.healthCheck();
      const countries = listAdapters();
      return JSON.stringify({
        ...result,
        active_country: INVOICE_COUNTRY,
        available_countries: countries,
      }, null, 2);
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ── MCP Server Setup ─────────────────────────────────────

const server = new Server(
  { name: "invoicing-mcp", version: "1.0.0" },
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

// ── Start ────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  const adapter = getAdapter(INVOICE_COUNTRY);
  console.error(
    `Invoicing MCP v1.0.0 | ${adapter.countryName} (${adapter.countryCode}) | Provider: ${adapter.providerName} | Country env: ${INVOICE_COUNTRY}`
  );
}

main().catch(console.error);
