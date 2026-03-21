/**
 * Panama Adapter — eFacturaPTY
 * STUB with correct API shapes. HTTP calls marked as TODO.
 *
 * Auth: API credentials (user/password/QR from PAC)
 * Invoice: POST JSON → XML generation + digital signature + PAC authorization
 * Response includes CUFE (Código Único de Factura Electrónica)
 * Tax authority: DGI (Dirección General de Ingresos)
 * Tax: ITBMS 7% (Impuesto de Transferencia de Bienes Muebles y Servicios)
 * Environments: 1=production, 2=test
 *
 * Environment variables:
 *   EFACTURA_API_URL — eFacturaPTY API base URL
 *   EFACTURA_USER — API username
 *   EFACTURA_PASSWORD — API password
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

const EFACTURA_API_URL = process.env.EFACTURA_API_URL || "";
const EFACTURA_USER = process.env.EFACTURA_USER || "";
const EFACTURA_PASSWORD = process.env.EFACTURA_PASSWORD || "";
const EFACTURA_ENVIRONMENT = process.env.EFACTURA_ENVIRONMENT || "2"; // 2=test

const ITBMS_RATE = 0.07;

// ── Auth Token ───────────────────────────────────────────

let cachedToken: string | null = null;
let tokenExpiry = 0;

async function efacturaAuth(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry - 300_000) {
    return cachedToken;
  }

  if (!EFACTURA_API_URL || !EFACTURA_USER || !EFACTURA_PASSWORD) {
    throw new Error(
      "eFacturaPTY not configured. Set EFACTURA_API_URL, EFACTURA_USER, EFACTURA_PASSWORD."
    );
  }

  // TODO: Uncomment when activating Panama
  // const res = await fetch(`${EFACTURA_API_URL}/auth/login`, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ user: EFACTURA_USER, password: EFACTURA_PASSWORD }),
  // });
  // if (!res.ok) throw new Error(`eFacturaPTY auth failed: ${res.status}`);
  // const data = await res.json();
  // cachedToken = data.token;
  // tokenExpiry = Date.now() + (data.expires_in || 3600) * 1000;
  // return cachedToken!;

  throw new Error("Panama adapter not yet activated. Configure eFacturaPTY credentials.");
}

async function efacturaRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const token = await efacturaAuth();
  const url = `${EFACTURA_API_URL}${endpoint}`;

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
    throw new Error(`eFacturaPTY ${res.status}: ${text}`);
  }

  return res.json();
}

// ── Tax Constants ────────────────────────────────────────

const PANAMA_DOCUMENT_TYPES: DocumentTypeInfo[] = [
  { code: "01", name: "Factura de Operación Interna", description: "Factura estándar para ventas nacionales", maps_to: "invoice" },
  { code: "02", name: "Factura de Importación", description: "Factura para bienes importados", maps_to: "invoice" },
  { code: "03", name: "Factura de Exportación", description: "Factura para ventas de exportación (ITBMS 0%)", maps_to: "invoice" },
  { code: "04", name: "Nota de Crédito", description: "Nota de crédito referenciando factura original", maps_to: "credit_note" },
  { code: "05", name: "Nota de Débito", description: "Nota de débito por ajustes e intereses", maps_to: "debit_note" },
  { code: "06", name: "Nota de Crédito Genérica", description: "Nota de crédito sin referencia a documento específico", maps_to: "credit_note" },
  { code: "07", name: "Nota de Débito Genérica", description: "Nota de débito sin referencia a documento específico", maps_to: "debit_note" },
  { code: "08", name: "Factura de Zona Franca", description: "Factura para operaciones en zonas francas", maps_to: "invoice" },
];

const PANAMA_TAX_RATES: TaxRateInfo[] = [
  { tax_type: "ITBMS", rate: 7, description: "Impuesto de Transferencia de Bienes Muebles y Servicios — 7% general" },
  { tax_type: "ITBMS_10", rate: 10, description: "ITBMS 10% — bebidas alcohólicas y hospedaje" },
  { tax_type: "ITBMS_15", rate: 15, description: "ITBMS 15% — cigarrillos y derivados del tabaco" },
  { tax_type: "ITBMS_0", rate: 0, description: "ITBMS 0% — alimentos básicos, medicamentos, exportaciones" },
  { tax_type: "ISR", rate: 25, description: "Impuesto Sobre la Renta — 25% personas jurídicas" },
];

// ── Adapter ──────────────────────────────────────────────

export const panamaEfacturaAdapter: CountryAdapter = {
  countryCode: "PA",
  countryName: "Panama",
  currency: "PAB", // Balboa (at parity with USD, USD also legal tender)
  providerName: "eFacturaPTY",

  async createInvoice(data: InvoiceData): Promise<InvoiceResult> {
    // eFacturaPTY invoice payload shape:
    // POST /fe/invoice
    // {
    //   dDatFE: { // datos de la factura
    //     iAmb: 2,               // 1=prod, 2=test
    //     iTpEmis: 1,            // 1=normal
    //     iDoc: 1,               // tipo documento
    //     dNroDF: "001-001-0001", // número
    //     dPtoFacDF: "001",
    //     dFechaEm: "2026-03-21",
    //     iMoneda: "PAB",
    //   },
    //   gDatRec: { // receptor
    //     iTipoRec: 1,           // 1=contribuyente
    //     dRuc: "155888888-2-2023",
    //     dNombRec: "Empresa ABC",
    //     dDirecRec: "Ciudad de Panamá",
    //     cCorregRec: "01",
    //     dCorreoRec: "email@domain.com",
    //   },
    //   gItem: [{ // items
    //     dDescri: "Servicio",
    //     dCantCom: 1,
    //     dPrUnit: 100.00,
    //     dPrUnitDesc: 0,
    //     dValTotItem: 107.00,
    //     gITBMSItem: { dTasaITBMS: 1, dValITBMS: 7.00 },
    //   }],
    //   gTot: { // totales
    //     dTotNeto: 100.00,
    //     dTotITBMS: 7.00,
    //     dTotGravado: 107.00,
    //     dVTot: 107.00,
    //   }
    // }
    const items = data.items.map((item) => {
      const subtotal = Math.round(item.quantity * item.unit_price * 100) / 100;
      const taxAmount = Math.round(subtotal * (item.tax_rate ?? ITBMS_RATE) * 100) / 100;
      return {
        dDescri: item.description,
        dCantCom: item.quantity,
        dPrUnit: item.unit_price,
        dPrUnitDesc: item.discount || 0,
        dValTotItem: Math.round((subtotal + taxAmount) * 100) / 100,
        gITBMSItem: {
          dTasaITBMS: (item.tax_rate ?? ITBMS_RATE) === 0.07 ? 1 : (item.tax_rate ?? ITBMS_RATE) === 0.10 ? 2 : (item.tax_rate ?? ITBMS_RATE) === 0.15 ? 3 : 0,
          dValITBMS: taxAmount,
        },
        dCodCPBSabr: item.item_code || "",
      };
    });

    const totNeto = data.items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
    const totITBMS = data.items.reduce(
      (s, i) => s + i.quantity * i.unit_price * (i.tax_rate ?? ITBMS_RATE),
      0
    );

    const payload = {
      dDatFE: {
        iAmb: EFACTURA_ENVIRONMENT === "1" ? 1 : 2,
        iTpEmis: 1,
        iDoc: 1,
        dNroDF: data.series || "",
        dFechaEm: data.issue_date || new Date().toISOString().split("T")[0],
        iMoneda: data.currency || "PAB",
      },
      gDatRec: {
        iTipoRec: 1,
        dRuc: data.customer.tax_id,
        dNombRec: data.customer.name,
        dDirecRec: data.customer.address?.street || "",
        dCorreoRec: data.customer.email || "",
      },
      gItem: items,
      gTot: {
        dTotNeto: Math.round(totNeto * 100) / 100,
        dTotITBMS: Math.round(totITBMS * 100) / 100,
        dTotGravado: Math.round((totNeto + totITBMS) * 100) / 100,
        dVTot: Math.round((totNeto + totITBMS) * 100) / 100,
      },
      dObservaciones: data.notes || undefined,
    };

    // TODO: Uncomment when activating Panama
    // const result = await efacturaRequest("/fe/invoice", {
    //   method: "POST",
    //   body: JSON.stringify(payload),
    // });
    // return {
    //   id: result.id || "",
    //   number: result.numero || "",
    //   hash: result.cufe || "",          // CUFE = Código Único de Factura Electrónica
    //   status: result.success ? "accepted" : "rejected",
    //   tax_authority_response: result.dgi_response || result.message || "",
    //   pdf_url: result.pdf_url || "",
    //   xml_url: result.xml_url || "",
    //   raw_response: result,
    // };

    void payload;
    throw new Error("Panama adapter not yet activated. Configure eFacturaPTY credentials.");
  },

  async createCreditNote(data: InvoiceData): Promise<InvoiceResult> {
    const payload = {
      dDatFE: {
        iAmb: EFACTURA_ENVIRONMENT === "1" ? 1 : 2,
        iTpEmis: 1,
        iDoc: 4, // Nota de crédito
        dNroDF: data.series || "",
        dFechaEm: data.issue_date || new Date().toISOString().split("T")[0],
        iMoneda: data.currency || "PAB",
      },
      gDatRec: {
        dRuc: data.customer.tax_id,
        dNombRec: data.customer.name,
      },
      dDocRef: data.reference_document || "",
      dMotivo: data.reason || "Nota de crédito",
      gItem: data.items.map((item) => {
        const subtotal = Math.round(item.quantity * item.unit_price * 100) / 100;
        const taxAmount = Math.round(subtotal * (item.tax_rate ?? ITBMS_RATE) * 100) / 100;
        return {
          dDescri: item.description,
          dCantCom: item.quantity,
          dPrUnit: item.unit_price,
          dValTotItem: Math.round((subtotal + taxAmount) * 100) / 100,
          gITBMSItem: { dTasaITBMS: 1, dValITBMS: taxAmount },
        };
      }),
    };

    // TODO: Uncomment when activating Panama
    // const result = await efacturaRequest("/fe/invoice", { method: "POST", body: JSON.stringify(payload) });

    void payload;
    throw new Error("Panama adapter not yet activated.");
  },

  async createDebitNote(data: InvoiceData): Promise<InvoiceResult> {
    const payload = {
      dDatFE: {
        iAmb: EFACTURA_ENVIRONMENT === "1" ? 1 : 2,
        iTpEmis: 1,
        iDoc: 5, // Nota de débito
        dNroDF: data.series || "",
        dFechaEm: data.issue_date || new Date().toISOString().split("T")[0],
        iMoneda: data.currency || "PAB",
      },
      gDatRec: {
        dRuc: data.customer.tax_id,
        dNombRec: data.customer.name,
      },
      dDocRef: data.reference_document || "",
      dMotivo: data.reason || "Nota de débito",
      gItem: data.items.map((item) => {
        const subtotal = Math.round(item.quantity * item.unit_price * 100) / 100;
        const taxAmount = Math.round(subtotal * (item.tax_rate ?? ITBMS_RATE) * 100) / 100;
        return {
          dDescri: item.description,
          dCantCom: item.quantity,
          dPrUnit: item.unit_price,
          dValTotItem: Math.round((subtotal + taxAmount) * 100) / 100,
          gITBMSItem: { dTasaITBMS: 1, dValITBMS: taxAmount },
        };
      }),
    };

    // TODO: Uncomment when activating Panama
    // const result = await efacturaRequest("/fe/invoice", { method: "POST", body: JSON.stringify(payload) });

    void payload;
    throw new Error("Panama adapter not yet activated.");
  },

  async voidInvoice(
    documentId: string,
    _documentType: string,
    reason: string
  ): Promise<VoidResult> {
    // DGI: Anulación requires issuing a nota de crédito or specific anulación endpoint
    const payload = {
      cufe: documentId,
      motivo: reason,
    };

    // TODO: Uncomment when activating Panama
    // const result = await efacturaRequest("/fe/void", { method: "POST", body: JSON.stringify(payload) });

    void payload;
    throw new Error("Panama adapter not yet activated.");
  },

  async getDailySummary(_date: string): Promise<DailySummaryResult> {
    // Panama does not use daily summaries — all documents sent individually to DGI via PAC
    return {
      id: "",
      ticket: "",
      status: "accepted",
      tax_authority_response: "Not applicable for Panama. Documents are authorized individually by PAC/DGI.",
      raw_response: {},
    };
  },

  async lookupTaxId(taxId: string): Promise<TaxIdInfo> {
    // Panama RUC format: various (e.g., "8-888-1234", "155888888-2-2023 DV88")
    // Natural persons: cedula format (e.g., "8-888-1234")
    // Legal entities: registro mercantil format
    const hasDigits = /\d/.test(taxId);

    // TODO: DGI RUC lookup
    return {
      valid: hasDigits,
      tax_id: taxId,
      name: hasDigits ? "RUC format plausible (lookup not yet implemented)" : "Invalid RUC format",
      doc_type: "RUC",
    };
  },

  async getInvoiceStatus(documentId: string): Promise<InvoiceStatusResult> {
    // TODO: GET /fe/status/{cufe}
    void documentId;
    throw new Error("Panama adapter not yet activated.");
  },

  async listInvoices(params: InvoiceListParams): Promise<InvoiceListResult> {
    // TODO: GET /fe/invoices?from=...&to=...
    void params;
    throw new Error("Panama adapter not yet activated.");
  },

  getTaxObligations(regime: string): TaxObligation[] {
    const upper = regime.toUpperCase();
    switch (upper) {
      case "NATURAL":
      case "PERSONA_NATURAL":
        return [
          { obligation: "Declaración de renta", frequency: "Anual", form: "Formulario 100", description: "ISR escala progresiva: 0% hasta B/.11,000, 15% hasta B/.50,000, 25% exceso" },
          { obligation: "ITBMS", frequency: "Mensual", description: "ITBMS 7% si ingresos > B/.36,000 anuales" },
          { obligation: "Facturación electrónica", frequency: "Por operación", description: "Obligatorio a partir de 2025 según calendario DGI" },
        ];
      case "JURIDICA":
      case "PERSONA_JURIDICA":
        return [
          { obligation: "Declaración de renta", frequency: "Anual", form: "Formulario 100", description: "ISR 25% sobre renta neta gravable (fuente panameña)" },
          { obligation: "ITBMS mensual", frequency: "Mensual", form: "Formulario 430", description: "ITBMS 7% trasladado menos crédito fiscal" },
          { obligation: "Retenciones ISR", frequency: "Mensual", description: "Retener ISR a empleados y proveedores según tabla" },
          { obligation: "CSS (seguro social)", frequency: "Mensual", description: "Cuota patronal + cuota obrera a la Caja de Seguro Social" },
          { obligation: "Facturación electrónica", frequency: "Por operación", description: "FE autorizada por PAC con CUFE — obligatorio según cronograma DGI" },
        ];
      default:
        throw new Error(`Unknown Panama regime: ${regime}. Try: NATURAL, JURIDICA`);
    }
  },

  calculateTax(params: TaxCalculationParams): TaxCalculationResult {
    const itbmsVentas = Math.round(params.monthly_revenue * ITBMS_RATE * 100) / 100;
    const itbmsCompras = Math.round(params.monthly_purchases * ITBMS_RATE * 100) / 100;
    const itbmsPayable = Math.max(0, Math.round((itbmsVentas - itbmsCompras) * 100) / 100);

    // Simplified ISR: 25% for juridica, progressive for natural
    const isrRate = params.regime.toUpperCase() === "NATURAL" ? 0.15 : 0.25;
    // Monthly estimate of annual ISR
    const profitEstimate = Math.max(0, params.monthly_revenue - params.monthly_purchases);
    const isrMensual = Math.round(profitEstimate * isrRate * 100) / 100;

    return {
      regime: params.regime,
      tax_on_sales: itbmsVentas,
      tax_on_purchases: itbmsCompras,
      tax_payable: itbmsPayable,
      income_tax_monthly: isrMensual,
      total_monthly: Math.round((itbmsPayable + isrMensual) * 100) / 100,
      breakdown: {
        tasa_itbms: "7%",
        itbms_trasladado: itbmsVentas,
        itbms_credito_fiscal: itbmsCompras,
        tasa_isr: `${isrRate * 100}%`,
        nota: "ISR estimado mensual basado en utilidad bruta. Panamá aplica sistema territorial (solo renta de fuente panameña).",
        sistema_territorial: "Solo ingresos de fuente panameña son gravables",
      },
    };
  },

  getDocumentTypes(): DocumentTypeInfo[] {
    return PANAMA_DOCUMENT_TYPES;
  },

  getTaxRates(): TaxRateInfo[] {
    return PANAMA_TAX_RATES;
  },

  async healthCheck(): Promise<HealthCheckResult> {
    if (!EFACTURA_API_URL || !EFACTURA_USER || !EFACTURA_PASSWORD) {
      return {
        country: "PA",
        provider: "eFacturaPTY",
        environment: EFACTURA_ENVIRONMENT === "1" ? "production" : "test",
        authenticated: false,
        message: "eFacturaPTY credentials not configured (EFACTURA_API_URL, EFACTURA_USER, EFACTURA_PASSWORD)",
      };
    }

    return {
      country: "PA",
      provider: "eFacturaPTY",
      environment: EFACTURA_ENVIRONMENT === "1" ? "production" : "test",
      authenticated: false,
      message: "Panama adapter is a stub — not yet activated",
    };
  },
};
