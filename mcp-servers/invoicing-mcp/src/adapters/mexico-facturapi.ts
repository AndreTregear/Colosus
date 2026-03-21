/**
 * Mexico Adapter — Facturapi (facturapi.io)
 * STUB with correct API shapes. HTTP calls marked as TODO.
 *
 * Auth: API Key in header (Authorization: Bearer sk_test_... or sk_live_...)
 * Invoices: POST https://www.facturapi.io/v2/invoices
 * Customers: POST /v2/customers
 * Download: GET /v2/invoices/{id}/zip, /xml, /pdf
 * Cancel: DELETE /v2/invoices/{id}
 * CFDI 4.0, timbrado by PAC, IVA 16%
 *
 * Environment variables:
 *   FACTURAPI_API_KEY — sk_test_... (sandbox) or sk_live_... (production)
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

const FACTURAPI_API_KEY = process.env.FACTURAPI_API_KEY || "";
const FACTURAPI_BASE_URL = "https://www.facturapi.io/v2";

const IVA_RATE = 0.16;

// ── HTTP Client ──────────────────────────────────────────

async function facturapiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  if (!FACTURAPI_API_KEY) {
    throw new Error("FACTURAPI_API_KEY not configured. Set it to your Facturapi API key.");
  }

  const url = `${FACTURAPI_BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${FACTURAPI_API_KEY}`,
      ...(options.headers as Record<string, string> || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Facturapi ${res.status}: ${text}`);
  }

  return res.json();
}

// ── Tax Constants ────────────────────────────────────────

const MEXICO_DOCUMENT_TYPES: DocumentTypeInfo[] = [
  { code: "I", name: "Ingreso", description: "CFDI de ingreso — factura estándar", maps_to: "invoice" },
  { code: "E", name: "Egreso", description: "CFDI de egreso — nota de crédito", maps_to: "credit_note" },
  { code: "P", name: "Pago", description: "CFDI de recepción de pagos (complemento de pago)", maps_to: "receipt" },
  { code: "N", name: "Nómina", description: "CFDI de nómina — recibos de sueldo", maps_to: "invoice" },
  { code: "T", name: "Traslado", description: "CFDI de traslado — carta porte", maps_to: "invoice" },
];

const MEXICO_TAX_RATES: TaxRateInfo[] = [
  { tax_type: "IVA", rate: 16, description: "Impuesto al Valor Agregado — 16% general" },
  { tax_type: "IVA_0", rate: 0, description: "IVA tasa 0% — alimentos, medicinas, exportaciones" },
  { tax_type: "IVA_EXENTO", rate: 0, description: "IVA exento — servicios de salud, educación, vivienda" },
  { tax_type: "ISR", rate: 0, description: "Impuesto Sobre la Renta — variable por régimen (retenciones)" },
  { tax_type: "IEPS", rate: 0, description: "Impuesto Especial sobre Producción y Servicios — variable por producto" },
];

// ── Adapter ──────────────────────────────────────────────

export const mexicoFacturapiAdapter: CountryAdapter = {
  countryCode: "MX",
  countryName: "Mexico",
  currency: "MXN",
  providerName: "Facturapi",

  async createInvoice(data: InvoiceData): Promise<InvoiceResult> {
    // Facturapi CFDI payload shape:
    // POST /v2/invoices
    // {
    //   customer: { legal_name, tax_id, tax_system, address: { zip } },
    //   items: [{ quantity, product: { description, price, tax_included, taxes: [{ type: "IVA", rate: 0.16 }] } }],
    //   payment_form: "01", // efectivo
    //   use: "G03",         // gastos en general
    //   type: "I",          // ingreso
    //   currency: "MXN"
    // }
    const payload = {
      type: "I",
      customer: {
        legal_name: data.customer.name,
        tax_id: data.customer.tax_id,
        tax_system: data.customer.tax_system || "601",
        address: {
          zip: data.customer.address?.postal_code || "",
        },
        email: data.customer.email || undefined,
      },
      items: data.items.map((item) => ({
        quantity: item.quantity,
        product: {
          description: item.description,
          product_key: item.item_code || "01010101",
          price: item.unit_price,
          tax_included: false,
          unit_key: item.unit_code || "E48",
          taxes: [
            {
              type: "IVA",
              rate: item.tax_rate ?? IVA_RATE,
            },
          ],
        },
      })),
      payment_form: data.payment_form || "01",
      use: data.cfdi_use || "G03",
      currency: data.currency || "MXN",
    };

    // TODO: Uncomment when activating Mexico
    // const result = await facturapiRequest("/invoices", {
    //   method: "POST",
    //   body: JSON.stringify(payload),
    // });
    // return {
    //   id: result.id,
    //   number: result.folio_number?.toString() || "",
    //   hash: result.stamp?.uuid || "",
    //   status: result.status === "valid" ? "accepted" : "pending",
    //   tax_authority_response: result.stamp?.sat_cert_number || "",
    //   pdf_url: `${FACTURAPI_BASE_URL}/invoices/${result.id}/pdf`,
    //   xml_url: `${FACTURAPI_BASE_URL}/invoices/${result.id}/xml`,
    //   raw_response: result,
    // };

    void payload;
    throw new Error("Mexico adapter not yet activated. Set FACTURAPI_API_KEY and enable MX country.");
  },

  async createCreditNote(data: InvoiceData): Promise<InvoiceResult> {
    // Facturapi egreso (credit note):
    // POST /v2/invoices
    // { type: "E", relation: "01", related: ["UUID-of-original"], ...same shape }
    const payload = {
      type: "E",
      customer: {
        legal_name: data.customer.name,
        tax_id: data.customer.tax_id,
        tax_system: data.customer.tax_system || "601",
        address: { zip: data.customer.address?.postal_code || "" },
      },
      items: data.items.map((item) => ({
        quantity: item.quantity,
        product: {
          description: item.description,
          product_key: item.item_code || "01010101",
          price: item.unit_price,
          tax_included: false,
          unit_key: item.unit_code || "E48",
          taxes: [{ type: "IVA", rate: item.tax_rate ?? IVA_RATE }],
        },
      })),
      payment_form: data.payment_form || "01",
      use: data.cfdi_use || "G02",
      related: data.reference_document ? [data.reference_document] : [],
      relation: "01", // Nota de crédito de los documentos relacionados
      currency: data.currency || "MXN",
    };

    // TODO: Uncomment when activating Mexico
    // const result = await facturapiRequest("/invoices", { method: "POST", body: JSON.stringify(payload) });

    void payload;
    throw new Error("Mexico adapter not yet activated.");
  },

  async createDebitNote(data: InvoiceData): Promise<InvoiceResult> {
    // Mexico doesn't have "debit notes" as a separate CFDI type.
    // A supplementary invoice (CFDI de ingreso) with relation type "02" is used instead.
    const payload = {
      type: "I",
      customer: {
        legal_name: data.customer.name,
        tax_id: data.customer.tax_id,
        tax_system: data.customer.tax_system || "601",
        address: { zip: data.customer.address?.postal_code || "" },
      },
      items: data.items.map((item) => ({
        quantity: item.quantity,
        product: {
          description: item.description,
          product_key: item.item_code || "01010101",
          price: item.unit_price,
          tax_included: false,
          unit_key: item.unit_code || "E48",
          taxes: [{ type: "IVA", rate: item.tax_rate ?? IVA_RATE }],
        },
      })),
      payment_form: data.payment_form || "01",
      related: data.reference_document ? [data.reference_document] : [],
      relation: "02", // Nota de débito de los documentos relacionados
      currency: data.currency || "MXN",
    };

    // TODO: Uncomment when activating Mexico
    // const result = await facturapiRequest("/invoices", { method: "POST", body: JSON.stringify(payload) });

    void payload;
    throw new Error("Mexico adapter not yet activated.");
  },

  async voidInvoice(
    documentId: string,
    _documentType: string,
    _reason: string
  ): Promise<VoidResult> {
    // Facturapi cancel: DELETE /v2/invoices/{id}
    // Body: { motive: "02", substitution?: "UUID" }
    // Motives: 01=Comprobantes emitidos con errores con relación
    //          02=Comprobantes emitidos con errores sin relación
    //          03=No se llevó a cabo la operación
    //          04=Operación nominativa relacionada en una factura global

    // TODO: Uncomment when activating Mexico
    // const result = await facturapiRequest(`/invoices/${documentId}`, {
    //   method: "DELETE",
    //   body: JSON.stringify({ motive: "02" }),
    // });

    void documentId;
    throw new Error("Mexico adapter not yet activated.");
  },

  async getDailySummary(_date: string): Promise<DailySummaryResult> {
    // Mexico does not use daily summaries — all CFDIs are timbrado individually by PAC
    return {
      id: "",
      ticket: "",
      status: "accepted",
      tax_authority_response: "Not applicable for Mexico. All CFDIs are stamped individually by PAC.",
      raw_response: {},
    };
  },

  async lookupTaxId(taxId: string): Promise<TaxIdInfo> {
    // RFC validation: 12 chars (persona moral) or 13 chars (persona física)
    const isValid = /^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/.test(taxId.toUpperCase());

    // TODO: Facturapi can validate RFC via customer creation (test mode)
    // const result = await facturapiRequest("/customers", {
    //   method: "POST",
    //   body: JSON.stringify({ legal_name: "Validation", tax_id: taxId, tax_system: "601", address: { zip: "01000" } }),
    // });

    return {
      valid: isValid,
      tax_id: taxId,
      name: isValid ? "RFC format valid (lookup not yet implemented)" : "Invalid RFC format",
      doc_type: "RFC",
    };
  },

  async getInvoiceStatus(documentId: string): Promise<InvoiceStatusResult> {
    // TODO: GET /v2/invoices/{id}
    // const result = await facturapiRequest(`/invoices/${documentId}`);

    void documentId;
    throw new Error("Mexico adapter not yet activated.");
  },

  async listInvoices(params: InvoiceListParams): Promise<InvoiceListResult> {
    // TODO: GET /v2/invoices?page=1&limit=20
    // const query = new URLSearchParams();
    // if (params.limit) query.set("limit", String(params.limit));
    // const result = await facturapiRequest(`/invoices?${query.toString()}`);

    void params;
    throw new Error("Mexico adapter not yet activated.");
  },

  getTaxObligations(regime: string): TaxObligation[] {
    const upper = regime.toUpperCase();
    switch (upper) {
      case "RIF":
      case "RESICO":
        return [
          { obligation: "Declaración bimestral ISR", frequency: "Bimestral", description: "Personas físicas RESICO: 1-2.5% sobre ingresos facturados" },
          { obligation: "Declaración mensual IVA", frequency: "Mensual", description: "IVA 16% sobre ventas menos IVA acreditable" },
          { obligation: "Emisión de CFDI", frequency: "Por operación", description: "Emitir CFDI 4.0 por toda operación" },
          { obligation: "Declaración anual", frequency: "Anual", description: "Abril del año siguiente" },
        ];
      case "GENERAL":
      case "601":
        return [
          { obligation: "Declaración mensual ISR", frequency: "Mensual", form: "Declaración provisional", description: "Pagos provisionales ISR (coeficiente de utilidad o 1.78%)" },
          { obligation: "Declaración mensual IVA", frequency: "Mensual", description: "IVA 16% trasladado menos IVA acreditable" },
          { obligation: "Declaración anual", frequency: "Anual", form: "Declaración anual PM", description: "Marzo del año siguiente — tasa 30% sobre utilidad fiscal" },
          { obligation: "Contabilidad electrónica", frequency: "Mensual", description: "Envío de balanza de comprobación al SAT" },
          { obligation: "Emisión de CFDI", frequency: "Por operación", description: "CFDI 4.0 por toda operación (ingreso, egreso, pago, nómina)" },
        ];
      default:
        throw new Error(`Unknown Mexico regime: ${regime}. Try: RESICO, GENERAL, 601`);
    }
  },

  calculateTax(params: TaxCalculationParams): TaxCalculationResult {
    const ivaVentas = Math.round(params.monthly_revenue * IVA_RATE * 100) / 100;
    const ivaCompras = Math.round(params.monthly_purchases * IVA_RATE * 100) / 100;
    const ivaPayable = Math.max(0, Math.round((ivaVentas - ivaCompras) * 100) / 100);

    // Simplified — actual ISR depends on regime and income brackets
    const isrRate = params.regime.toUpperCase() === "RESICO" ? 0.02 : 0.0178;
    const isrMensual = Math.round(params.monthly_revenue * isrRate * 100) / 100;

    return {
      regime: params.regime,
      tax_on_sales: ivaVentas,
      tax_on_purchases: ivaCompras,
      tax_payable: ivaPayable,
      income_tax_monthly: isrMensual,
      total_monthly: Math.round((ivaPayable + isrMensual) * 100) / 100,
      breakdown: {
        tasa_iva: "16%",
        iva_trasladado: ivaVentas,
        iva_acreditable: ivaCompras,
        tasa_isr_provisional: `${isrRate * 100}%`,
        nota: "ISR provisional simplificado. El cálculo real depende del coeficiente de utilidad.",
      },
    };
  },

  getDocumentTypes(): DocumentTypeInfo[] {
    return MEXICO_DOCUMENT_TYPES;
  },

  getTaxRates(): TaxRateInfo[] {
    return MEXICO_TAX_RATES;
  },

  async healthCheck(): Promise<HealthCheckResult> {
    const isTest = FACTURAPI_API_KEY.startsWith("sk_test_");
    const isLive = FACTURAPI_API_KEY.startsWith("sk_live_");

    if (!FACTURAPI_API_KEY) {
      return {
        country: "MX",
        provider: "Facturapi",
        environment: "unconfigured",
        authenticated: false,
        message: "FACTURAPI_API_KEY not set",
      };
    }

    // TODO: Validate key with a lightweight API call
    // try {
    //   await facturapiRequest("/organizations/me");
    //   return { ... authenticated: true };
    // } catch { ... }

    return {
      country: "MX",
      provider: "Facturapi",
      environment: isTest ? "test" : isLive ? "live" : "unknown",
      authenticated: false,
      message: "Mexico adapter is a stub — not yet activated",
    };
  },
};
