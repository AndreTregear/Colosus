/**
 * Colombia Adapter — MATIAS API (matias-api.com)
 * STUB with correct API shapes. HTTP calls marked as TODO.
 *
 * Auth: OAuth 2.0 (POST token with client_id/client_secret → Bearer token)
 * Invoices: POST https://api.matias-api.com/invoice
 * Response: { success, document_key, number }
 * Tax authority: DIAN (Dirección de Impuestos y Aduanas Nacionales)
 * CUFE: Código Único de Factura Electrónica (per-document UUID)
 * IVA: 19%
 *
 * Environment variables:
 *   MATIAS_CLIENT_ID — OAuth client ID
 *   MATIAS_CLIENT_SECRET — OAuth client secret
 */

import type { CountryAdapter } from "./base.js";
import type {
  InvoiceData,
  InvoiceResult,
  VoidResult,
  TaxIdInfo,
  TaxObligation,
  TaxCalculationParams,
  TaxCalculationResult,
  DocumentTypeInfo,
  TaxRateInfo,
  InvoiceStatusResult,
  InvoiceListParams,
  InvoiceListResult,
  DailySummaryResult,
  HealthCheckResult,
} from "../types.js";

// ── Configuration ────────────────────────────────────────

const MATIAS_CLIENT_ID = process.env.MATIAS_CLIENT_ID || "";
const MATIAS_CLIENT_SECRET = process.env.MATIAS_CLIENT_SECRET || "";
const MATIAS_BASE_URL = "https://api.matias-api.com";

const IVA_RATE = 0.19;

// ── OAuth Token ──────────────────────────────────────────

let cachedToken: string | null = null;
let tokenExpiry = 0;

async function matiasAuth(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry - 300_000) {
    return cachedToken;
  }

  if (!MATIAS_CLIENT_ID || !MATIAS_CLIENT_SECRET) {
    throw new Error("MATIAS_CLIENT_ID and MATIAS_CLIENT_SECRET not configured.");
  }

  // TODO: Uncomment when activating Colombia
  // const res = await fetch(`${MATIAS_BASE_URL}/oauth/token`, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/x-www-form-urlencoded" },
  //   body: new URLSearchParams({
  //     grant_type: "client_credentials",
  //     client_id: MATIAS_CLIENT_ID,
  //     client_secret: MATIAS_CLIENT_SECRET,
  //   }),
  // });
  // if (!res.ok) throw new Error(`MATIAS auth failed: ${res.status}`);
  // const data = await res.json();
  // cachedToken = data.access_token;
  // tokenExpiry = Date.now() + (data.expires_in || 3600) * 1000;
  // return cachedToken!;

  throw new Error("Colombia adapter not yet activated. Set MATIAS_CLIENT_ID and MATIAS_CLIENT_SECRET.");
}

async function matiasRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const token = await matiasAuth();
  const url = `${MATIAS_BASE_URL}${endpoint}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers as Record<string, string> || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`MATIAS ${res.status}: ${text}`);
  }

  return res.json();
}

// ── Tax Constants ────────────────────────────────────────

const COLOMBIA_DOCUMENT_TYPES: DocumentTypeInfo[] = [
  { code: "FE", name: "Factura Electrónica", description: "Factura electrónica de venta — documento tributario principal", maps_to: "invoice" },
  { code: "NC", name: "Nota Crédito", description: "Nota crédito electrónica — anulación, devolución, descuento", maps_to: "credit_note" },
  { code: "ND", name: "Nota Débito", description: "Nota débito electrónica — intereses, ajustes", maps_to: "debit_note" },
  { code: "DS", name: "Documento Soporte", description: "Documento soporte en adquisiciones a no obligados a facturar", maps_to: "invoice" },
  { code: "NE", name: "Nómina Electrónica", description: "Documento soporte de pago de nómina electrónica", maps_to: "invoice" },
];

const COLOMBIA_TAX_RATES: TaxRateInfo[] = [
  { tax_type: "IVA", rate: 19, description: "Impuesto al Valor Agregado — 19% tarifa general" },
  { tax_type: "IVA_5", rate: 5, description: "IVA tarifa reducida — 5% (algunos alimentos, medicinas)" },
  { tax_type: "IVA_0", rate: 0, description: "IVA excluido o exento — 0%" },
  { tax_type: "ICA", rate: 0, description: "Impuesto de Industria y Comercio — variable por municipio (0.2-1.4%)" },
  { tax_type: "RETEFUENTE", rate: 0, description: "Retención en la fuente — variable por concepto" },
  { tax_type: "RETEIVA", rate: 15, description: "Retención de IVA — 15% del IVA (para grandes contribuyentes)" },
];

// ── MATIAS Document Type Mapping ─────────────────────────

function mapDocType(docType: string): number {
  switch (docType) {
    case "invoice": return 1;   // FE
    case "credit_note": return 4; // NC
    case "debit_note": return 5;  // ND
    default: return 1;
  }
}

// ── Adapter ──────────────────────────────────────────────

export const colombiaMatiasAdapter: CountryAdapter = {
  countryCode: "CO",
  countryName: "Colombia",
  currency: "COP",
  providerName: "MATIAS",

  async createInvoice(data: InvoiceData): Promise<InvoiceResult> {
    // MATIAS invoice payload shape:
    // POST /invoice
    // {
    //   type_document_id: 1,          // 1=FE, 4=NC, 5=ND
    //   customer: {
    //     identification_number: "NIT",
    //     name: "Razón social",
    //     municipality_id: 1,         // DANE code
    //     email: "email@domain.com",
    //     merchant_registration: "0"
    //   },
    //   legal_monetary_totals: {
    //     line_extension_amount: "1000.00",
    //     tax_exclusive_amount: "1000.00",
    //     tax_inclusive_amount: "1190.00",
    //     payable_amount: "1190.00"
    //   },
    //   invoice_lines: [{
    //     unit_measure_id: 70,        // unidad
    //     invoiced_quantity: "1",
    //     line_extension_amount: "1000.00",
    //     description: "Servicio",
    //     tax_totals: [{ tax_id: 1, tax_amount: "190.00", percent: "19.00", taxable_amount: "1000.00" }],
    //     allowance_charges: []
    //   }]
    // }
    const payload = {
      type_document_id: mapDocType(data.document_type),
      customer: {
        identification_number: data.customer.tax_id,
        name: data.customer.name,
        email: data.customer.email || "",
        merchant_registration: "0",
      },
      invoice_lines: data.items.map((item) => {
        const subtotal = Math.round(item.quantity * item.unit_price * 100) / 100;
        const taxAmount = Math.round(subtotal * (item.tax_rate ?? IVA_RATE) * 100) / 100;
        return {
          unit_measure_id: 70,
          invoiced_quantity: item.quantity.toString(),
          line_extension_amount: subtotal.toFixed(2),
          description: item.description,
          tax_totals: [
            {
              tax_id: 1, // IVA
              tax_amount: taxAmount.toFixed(2),
              percent: ((item.tax_rate ?? IVA_RATE) * 100).toFixed(2),
              taxable_amount: subtotal.toFixed(2),
            },
          ],
        };
      }),
      legal_monetary_totals: (() => {
        const lineTotal = data.items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
        const taxTotal = data.items.reduce(
          (s, i) => s + i.quantity * i.unit_price * (i.tax_rate ?? IVA_RATE),
          0
        );
        return {
          line_extension_amount: lineTotal.toFixed(2),
          tax_exclusive_amount: lineTotal.toFixed(2),
          tax_inclusive_amount: (lineTotal + taxTotal).toFixed(2),
          payable_amount: (lineTotal + taxTotal).toFixed(2),
        };
      })(),
      notes: data.notes || undefined,
    };

    // TODO: Uncomment when activating Colombia
    // const result = await matiasRequest("/invoice", {
    //   method: "POST",
    //   body: JSON.stringify(payload),
    // });
    // return {
    //   id: result.document_key || "",
    //   number: result.number || "",
    //   hash: result.cufe || "",        // CUFE = Código Único de Factura Electrónica
    //   status: result.success ? "accepted" : "rejected",
    //   tax_authority_response: result.message || "",
    //   pdf_url: result.pdf_url || "",
    //   xml_url: result.xml_url || "",
    //   raw_response: result,
    // };

    void payload;
    throw new Error("Colombia adapter not yet activated. Configure MATIAS_CLIENT_ID and MATIAS_CLIENT_SECRET.");
  },

  async createCreditNote(data: InvoiceData): Promise<InvoiceResult> {
    // Same as createInvoice but type_document_id=4 and includes reference
    const payload = {
      type_document_id: 4, // NC
      billing_reference: {
        number: data.reference_document || "",
        uuid: data.reference_document || "",
        issue_date: data.issue_date || new Date().toISOString().split("T")[0],
      },
      discrepancy_response: {
        correction_invoice_id: data.reason_code || "2",
        description: data.reason || "Nota crédito",
      },
      customer: {
        identification_number: data.customer.tax_id,
        name: data.customer.name,
        email: data.customer.email || "",
      },
      invoice_lines: data.items.map((item) => {
        const subtotal = Math.round(item.quantity * item.unit_price * 100) / 100;
        const taxAmount = Math.round(subtotal * (item.tax_rate ?? IVA_RATE) * 100) / 100;
        return {
          unit_measure_id: 70,
          invoiced_quantity: item.quantity.toString(),
          line_extension_amount: subtotal.toFixed(2),
          description: item.description,
          tax_totals: [{ tax_id: 1, tax_amount: taxAmount.toFixed(2), percent: ((item.tax_rate ?? IVA_RATE) * 100).toFixed(2), taxable_amount: subtotal.toFixed(2) }],
        };
      }),
    };

    // TODO: Uncomment when activating Colombia
    // const result = await matiasRequest("/invoice", { method: "POST", body: JSON.stringify(payload) });

    void payload;
    throw new Error("Colombia adapter not yet activated.");
  },

  async createDebitNote(data: InvoiceData): Promise<InvoiceResult> {
    const payload = {
      type_document_id: 5, // ND
      billing_reference: {
        number: data.reference_document || "",
        uuid: data.reference_document || "",
        issue_date: data.issue_date || new Date().toISOString().split("T")[0],
      },
      discrepancy_response: {
        correction_invoice_id: data.reason_code || "1",
        description: data.reason || "Nota débito",
      },
      customer: {
        identification_number: data.customer.tax_id,
        name: data.customer.name,
        email: data.customer.email || "",
      },
      invoice_lines: data.items.map((item) => {
        const subtotal = Math.round(item.quantity * item.unit_price * 100) / 100;
        const taxAmount = Math.round(subtotal * (item.tax_rate ?? IVA_RATE) * 100) / 100;
        return {
          unit_measure_id: 70,
          invoiced_quantity: item.quantity.toString(),
          line_extension_amount: subtotal.toFixed(2),
          description: item.description,
          tax_totals: [{ tax_id: 1, tax_amount: taxAmount.toFixed(2), percent: ((item.tax_rate ?? IVA_RATE) * 100).toFixed(2), taxable_amount: subtotal.toFixed(2) }],
        };
      }),
    };

    // TODO: Uncomment when activating Colombia
    // const result = await matiasRequest("/invoice", { method: "POST", body: JSON.stringify(payload) });

    void payload;
    throw new Error("Colombia adapter not yet activated.");
  },

  async voidInvoice(
    documentId: string,
    _documentType: string,
    reason: string
  ): Promise<VoidResult> {
    // MATIAS: POST /invoice/cancel or /credit-note to void
    // DIAN doesn't support direct void — a credit note (NC) is required
    const payload = {
      document_key: documentId,
      reason,
    };

    // TODO: Uncomment when activating Colombia
    // const result = await matiasRequest("/invoice/cancel", { method: "POST", body: JSON.stringify(payload) });

    void payload;
    throw new Error("Colombia adapter not yet activated.");
  },

  async getDailySummary(_date: string): Promise<DailySummaryResult> {
    // Colombia does not use daily summaries — all documents sent individually to DIAN
    return {
      id: "",
      ticket: "",
      status: "accepted",
      tax_authority_response: "Not applicable for Colombia. All documents are sent individually to DIAN.",
      raw_response: {},
    };
  },

  async lookupTaxId(taxId: string): Promise<TaxIdInfo> {
    // NIT validation: 9 digits + verification digit (10 total with hyphen)
    const cleanNit = taxId.replace(/[-\s]/g, "");
    const isValid = /^\d{9,10}$/.test(cleanNit);

    // TODO: DIAN RUT lookup via MATIAS or DIAN web service
    return {
      valid: isValid,
      tax_id: taxId,
      name: isValid ? "NIT format valid (lookup not yet implemented)" : "Invalid NIT format (expected 9-10 digits)",
      doc_type: "NIT",
    };
  },

  async getInvoiceStatus(documentId: string): Promise<InvoiceStatusResult> {
    // TODO: GET /invoice/{document_key}/status
    // const result = await matiasRequest(`/invoice/${documentId}/status`);

    void documentId;
    throw new Error("Colombia adapter not yet activated.");
  },

  async listInvoices(params: InvoiceListParams): Promise<InvoiceListResult> {
    // TODO: GET /invoices?from=...&to=...
    void params;
    throw new Error("Colombia adapter not yet activated.");
  },

  getTaxObligations(regime: string): TaxObligation[] {
    const upper = regime.toUpperCase();
    switch (upper) {
      case "SIMPLE":
        return [
          { obligation: "Anticipo bimestral SIMPLE", frequency: "Bimestral", form: "Formulario 2593", description: "Anticipo unificado (renta + ICA) — tarifa 1.8-14.5% según ingreso y actividad" },
          { obligation: "Declaración anual SIMPLE", frequency: "Anual", form: "Formulario 260", description: "Declaración anual consolidada del Régimen Simple" },
          { obligation: "Facturación electrónica", frequency: "Por operación", description: "Obligatorio emitir factura electrónica para todos los sujetos del SIMPLE" },
        ];
      case "ORDINARIO":
      case "GENERAL":
        return [
          { obligation: "Declaración de renta", frequency: "Anual", description: "Tarifa 35% para personas jurídicas sobre renta líquida gravable" },
          { obligation: "Declaración de IVA", frequency: "Bimestral", form: "Formulario 300", description: "IVA 19% — bimestral o cuatrimestral según ingresos" },
          { obligation: "Retención en la fuente", frequency: "Mensual", form: "Formulario 350", description: "Declarar y pagar retenciones practicadas" },
          { obligation: "ICA", frequency: "Bimestral/Anual", description: "Impuesto de Industria y Comercio — tarifa según municipio y actividad" },
          { obligation: "Facturación electrónica", frequency: "Por operación", description: "Factura electrónica con validación previa DIAN (resolución de numeración requerida)" },
        ];
      default:
        throw new Error(`Unknown Colombia regime: ${regime}. Try: SIMPLE, ORDINARIO`);
    }
  },

  calculateTax(params: TaxCalculationParams): TaxCalculationResult {
    const ivaVentas = Math.round(params.monthly_revenue * IVA_RATE * 100) / 100;
    const ivaCompras = Math.round(params.monthly_purchases * IVA_RATE * 100) / 100;
    const ivaPayable = Math.max(0, Math.round((ivaVentas - ivaCompras) * 100) / 100);

    // Simplified renta estimate
    const rentaRate = params.regime.toUpperCase() === "SIMPLE" ? 0.025 : 0.035;
    const rentaMensual = Math.round(params.monthly_revenue * rentaRate * 100) / 100;

    return {
      regime: params.regime,
      tax_on_sales: ivaVentas,
      tax_on_purchases: ivaCompras,
      tax_payable: ivaPayable,
      income_tax_monthly: rentaMensual,
      total_monthly: Math.round((ivaPayable + rentaMensual) * 100) / 100,
      breakdown: {
        tasa_iva: "19%",
        iva_generado: ivaVentas,
        iva_descontable: ivaCompras,
        tasa_renta_estimada: `${rentaRate * 100}%`,
        nota: "Cálculo simplificado. La renta real depende de deducciones y actividad económica.",
      },
    };
  },

  getDocumentTypes(): DocumentTypeInfo[] {
    return COLOMBIA_DOCUMENT_TYPES;
  },

  getTaxRates(): TaxRateInfo[] {
    return COLOMBIA_TAX_RATES;
  },

  async healthCheck(): Promise<HealthCheckResult> {
    if (!MATIAS_CLIENT_ID || !MATIAS_CLIENT_SECRET) {
      return {
        country: "CO",
        provider: "MATIAS",
        environment: "unconfigured",
        authenticated: false,
        message: "MATIAS_CLIENT_ID and MATIAS_CLIENT_SECRET not set",
      };
    }

    return {
      country: "CO",
      provider: "MATIAS",
      environment: "unknown",
      authenticated: false,
      message: "Colombia adapter is a stub — not yet activated",
    };
  },
};
