/**
 * Peru Adapter — APISUNAT.pe (Lucode)
 * FULL IMPLEMENTATION for SUNAT electronic invoicing via PSE.
 *
 * Auth: POST /api/v1/auth/login → JWT
 * Invoices: POST /api/v1/invoice/send
 * PDF: GET /api/v1/invoice/pdf/{hash}
 * RUC/DNI: GET /api/v1/ruc/{ruc}, GET /api/v1/dni/{dni}
 *
 * Environment variables:
 *   APISUNAT_EMAIL, APISUNAT_PASSWORD — login credentials
 *   APISUNAT_RUC — issuer RUC (11 digits)
 *   APISUNAT_RAZON_SOCIAL — issuer legal name
 *   APISUNAT_ENVIRONMENT — "beta" (default, free testing) or "production"
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

const APISUNAT_BASE_URL = "https://back.apisunat.com";
const APISUNAT_EMAIL = process.env.APISUNAT_EMAIL || "";
const APISUNAT_PASSWORD = process.env.APISUNAT_PASSWORD || "";
const APISUNAT_RUC = process.env.APISUNAT_RUC || "";
const APISUNAT_RAZON_SOCIAL = process.env.APISUNAT_RAZON_SOCIAL || "";
const APISUNAT_ENVIRONMENT = process.env.APISUNAT_ENVIRONMENT || "beta";

const IGV_RATE = 0.18;
const UIT_2026 = 5350; // Updated annually by MEF

// ── JWT Auth ─────────────────────────────────────────────

let cachedToken: string | null = null;
let tokenExpiry = 0;

async function authenticate(): Promise<string> {
  // Token still valid (refresh 5 min before expiry)
  if (cachedToken && Date.now() < tokenExpiry - 300_000) {
    return cachedToken;
  }

  if (!APISUNAT_EMAIL || !APISUNAT_PASSWORD) {
    throw new Error(
      "APISUNAT credentials not configured. Set APISUNAT_EMAIL and APISUNAT_PASSWORD."
    );
  }

  const res = await fetch(`${APISUNAT_BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: APISUNAT_EMAIL,
      password: APISUNAT_PASSWORD,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`APISUNAT auth failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  cachedToken = data.token || data.access_token;
  if (!cachedToken) {
    throw new Error("APISUNAT auth response missing token");
  }

  // Default 1 hour expiry if not specified
  const expiresIn = data.expires_in || 3600;
  tokenExpiry = Date.now() + expiresIn * 1000;

  return cachedToken;
}

// ── HTTP Client ──────────────────────────────────────────

async function apisunatFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const token = await authenticate();
  const url = `${APISUNAT_BASE_URL}${endpoint}`;

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
    let detail = text;
    try {
      const parsed = JSON.parse(text);
      detail = parsed.message || parsed.error || text;
    } catch {
      /* raw text */
    }
    throw new Error(`APISUNAT ${res.status}: ${detail}`);
  }

  return res.json();
}

// ── Peru Tax Constants ───────────────────────────────────

const PERU_DOCUMENT_TYPES: DocumentTypeInfo[] = [
  { code: "01", name: "Factura", description: "Invoice for businesses with RUC — grants crédito fiscal IGV", maps_to: "invoice" },
  { code: "03", name: "Boleta de Venta", description: "Receipt for end consumers (DNI or anonymous)", maps_to: "receipt" },
  { code: "07", name: "Nota de Crédito", description: "Credit note — void, discount, or correct a factura/boleta", maps_to: "credit_note" },
  { code: "08", name: "Nota de Débito", description: "Debit note — interest, penalties, or price increase", maps_to: "debit_note" },
  { code: "09", name: "Guía de Remisión Remitente", description: "Dispatch guide issued by sender", maps_to: "invoice" },
  { code: "31", name: "Guía de Remisión Transportista", description: "Dispatch guide issued by carrier", maps_to: "invoice" },
];

const PERU_TAX_RATES: TaxRateInfo[] = [
  { tax_type: "IGV", rate: 18, description: "Impuesto General a las Ventas — 18% sobre valor venta" },
  { tax_type: "ICBPER", rate: 0.50, description: "Impuesto al Consumo de Bolsas Plásticas — S/0.50 por bolsa" },
  { tax_type: "EXO", rate: 0, description: "Exonerado de IGV (productos de primera necesidad, Apéndice I TUO IGV)" },
  { tax_type: "INA", rate: 0, description: "Inafecto al IGV (educación, salud, etc.)" },
  { tax_type: "GRA", rate: 0, description: "Gratuita (transferencia gratuita, IGV asumido por emisor)" },
];

// ── Document Type Mapping ────────────────────────────────

function mapDocumentType(docType: string): number {
  switch (docType) {
    case "invoice": return 1;   // Factura
    case "receipt": return 3;   // Boleta
    case "credit_note": return 7;
    case "debit_note": return 8;
    default: return parseInt(docType) || 1;
  }
}

function mapDocTypeCode(docType: string): string {
  switch (docType) {
    case "invoice": return "01";
    case "receipt": return "03";
    case "credit_note": return "07";
    case "debit_note": return "08";
    default: return docType;
  }
}

function mapCustomerDocType(docType: string): number {
  switch (docType.toUpperCase()) {
    case "RUC": return 6;
    case "DNI": return 1;
    case "CE": return 4;       // Carné de extranjería
    case "PASSPORT": return 7;
    default: return 0;         // Sin documento
  }
}

function mapTaxAffectationType(taxType?: string): string {
  switch (taxType?.toUpperCase()) {
    case "IGV": return "10";   // Gravado - Operación Onerosa
    case "EXO": return "20";   // Exonerado - Operación Onerosa
    case "INA": return "30";   // Inafecto - Operación Onerosa
    case "GRA": return "21";   // Gratuito
    default: return "10";
  }
}

// ── Line Item Builder ────────────────────────────────────

function buildLineItems(items: InvoiceData["items"]) {
  return items.map((item, idx) => {
    const taxRate = item.tax_rate ?? IGV_RATE;
    const subtotal = Math.round(item.quantity * item.unit_price * 100) / 100;
    const discount = Math.round((item.discount || 0) * item.quantity * 100) / 100;
    const taxableAmount = subtotal - discount;
    const taxAmount = Math.round(taxableAmount * taxRate * 100) / 100;

    return {
      numero: idx + 1,
      codigo: item.item_code || "",
      descripcion: item.description,
      cantidad: item.quantity,
      unidad_de_medida: item.unit_code,
      valor_unitario: item.unit_price,
      precio_unitario: Math.round(item.unit_price * (1 + taxRate) * 100) / 100,
      subtotal: taxableAmount,
      tipo_de_igv: mapTaxAffectationType(item.tax_type),
      igv: taxAmount,
      total: Math.round((taxableAmount + taxAmount) * 100) / 100,
      anticipo_regularizacion: false,
    };
  });
}

function computeTotals(lines: ReturnType<typeof buildLineItems>) {
  const totalGravada = Math.round(lines.reduce((s, l) => s + l.subtotal, 0) * 100) / 100;
  const totalIgv = Math.round(lines.reduce((s, l) => s + l.igv, 0) * 100) / 100;
  const totalVenta = Math.round(lines.reduce((s, l) => s + l.total, 0) * 100) / 100;
  return { totalGravada, totalIgv, totalVenta };
}

// ── Result Parser ────────────────────────────────────────

function parseResult(result: any, series: string): InvoiceResult {
  const accepted = result.aceptada_por_sunat !== false && result.success !== false;
  const number = result.numero || (result.correlativo ? `${series}-${result.correlativo}` : "");
  const hash = result.hash || result.digest_value || "";

  let status: InvoiceResult["status"] = "pending";
  if (accepted) status = "accepted";
  if (result.aceptada_por_sunat === false || result.success === false) status = "rejected";

  return {
    id: result.id?.toString() || number,
    number,
    hash,
    status,
    tax_authority_response: result.sunat_description || result.sunat_note || result.message || "",
    pdf_url: result.enlace_del_pdf || result.pdf_url || "",
    xml_url: result.enlace_del_xml || result.xml_url || "",
    raw_response: result,
  };
}

// ── Adapter ──────────────────────────────────────────────

export const peruApisunatAdapter: CountryAdapter = {
  countryCode: "PE",
  countryName: "Peru",
  currency: "PEN",
  providerName: "APISUNAT.pe",

  // ── createInvoice ────────────────────────────────────

  async createInvoice(data: InvoiceData): Promise<InvoiceResult> {
    const docTypeCode = mapDocTypeCode(data.document_type);
    const defaultSeries = docTypeCode === "01"
      ? (process.env.INVOICE_SERIES_FACTURA || "F001")
      : (process.env.INVOICE_SERIES_BOLETA || "B001");
    const series = data.series || defaultSeries;

    const lines = buildLineItems(data.items);
    const { totalGravada, totalIgv, totalVenta } = computeTotals(lines);

    const customerAddress = data.customer.address
      ? `${data.customer.address.street}, ${data.customer.address.district || ""}, ${data.customer.address.city}`.replace(/, ,/g, ",")
      : "";

    const payload = {
      operacion: "generar_comprobante",
      tipo_de_comprobante: mapDocumentType(data.document_type),
      serie: series,
      moneda: data.currency === "USD" ? 2 : 1,
      tipo_cambio: data.exchange_rate || 1,
      fecha_de_emision: data.issue_date || new Date().toISOString().split("T")[0],
      fecha_de_vencimiento: data.due_date || null,
      cliente_tipo_de_documento: mapCustomerDocType(data.customer.doc_type),
      cliente_numero_de_documento: data.customer.tax_id,
      cliente_denominacion: data.customer.name,
      cliente_direccion: customerAddress,
      cliente_email: data.customer.email || "",
      observaciones: data.notes || "",
      orden_compra: data.purchase_order || "",
      condiciones_de_pago: data.payment_method || "",
      total_gravada: totalGravada,
      total_igv: totalIgv,
      total_venta: totalVenta,
      items: lines,
      ruc_emisor: APISUNAT_RUC,
      ambiente: APISUNAT_ENVIRONMENT === "production" ? 1 : 0,
    };

    const result = await apisunatFetch("/api/v1/invoice/send", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return parseResult(result, series);
  },

  // ── createCreditNote ─────────────────────────────────

  async createCreditNote(data: InvoiceData): Promise<InvoiceResult> {
    if (!data.reference_document) {
      throw new Error("Credit note requires reference_document (original invoice number)");
    }

    const refPrefix = data.reference_document.startsWith("F") ? "FC" : "BC";
    const series = data.series || `${refPrefix}01`;

    const lines = buildLineItems(data.items);
    const { totalGravada, totalIgv, totalVenta } = computeTotals(lines);

    const payload = {
      operacion: "generar_comprobante",
      tipo_de_comprobante: 7,
      serie: series,
      moneda: data.currency === "USD" ? 2 : 1,
      fecha_de_emision: data.issue_date || new Date().toISOString().split("T")[0],
      cliente_tipo_de_documento: mapCustomerDocType(data.customer.doc_type),
      cliente_numero_de_documento: data.customer.tax_id,
      cliente_denominacion: data.customer.name,
      tipo_de_nota_de_credito: parseInt(data.reason_code || "1") || 1,
      documento_que_se_modifica_tipo: parseInt(data.reference_document_type || "01"),
      documento_que_se_modifica_serie_numero: data.reference_document,
      motivo: data.reason || "",
      total_gravada: totalGravada,
      total_igv: totalIgv,
      total_venta: totalVenta,
      items: lines,
      ruc_emisor: APISUNAT_RUC,
      ambiente: APISUNAT_ENVIRONMENT === "production" ? 1 : 0,
    };

    const result = await apisunatFetch("/api/v1/invoice/send", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return parseResult(result, series);
  },

  // ── createDebitNote ──────────────────────────────────

  async createDebitNote(data: InvoiceData): Promise<InvoiceResult> {
    if (!data.reference_document) {
      throw new Error("Debit note requires reference_document (original invoice number)");
    }

    const refPrefix = data.reference_document.startsWith("F") ? "FD" : "BD";
    const series = data.series || `${refPrefix}01`;

    const lines = buildLineItems(data.items);
    const { totalGravada, totalIgv, totalVenta } = computeTotals(lines);

    const payload = {
      operacion: "generar_comprobante",
      tipo_de_comprobante: 8,
      serie: series,
      moneda: data.currency === "USD" ? 2 : 1,
      fecha_de_emision: data.issue_date || new Date().toISOString().split("T")[0],
      cliente_tipo_de_documento: mapCustomerDocType(data.customer.doc_type),
      cliente_numero_de_documento: data.customer.tax_id,
      cliente_denominacion: data.customer.name,
      tipo_de_nota_de_debito: parseInt(data.reason_code || "1") || 1,
      documento_que_se_modifica_tipo: parseInt(data.reference_document_type || "01"),
      documento_que_se_modifica_serie_numero: data.reference_document,
      motivo: data.reason || "",
      total_gravada: totalGravada,
      total_igv: totalIgv,
      total_venta: totalVenta,
      items: lines,
      ruc_emisor: APISUNAT_RUC,
      ambiente: APISUNAT_ENVIRONMENT === "production" ? 1 : 0,
    };

    const result = await apisunatFetch("/api/v1/invoice/send", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return parseResult(result, series);
  },

  // ── voidInvoice ──────────────────────────────────────

  async voidInvoice(
    documentId: string,
    documentType: string,
    reason: string
  ): Promise<VoidResult> {
    const payload = {
      operacion: "generar_anulacion",
      tipo_de_comprobante: parseInt(documentType) || 1,
      serie_numero: documentId,
      motivo: reason,
      fecha_de_comunicacion: new Date().toISOString().split("T")[0],
      ruc_emisor: APISUNAT_RUC,
      ambiente: APISUNAT_ENVIRONMENT === "production" ? 1 : 0,
    };

    const result = await apisunatFetch("/api/v1/invoice/send", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const accepted = result.aceptada_por_sunat !== false && result.success !== false;

    return {
      id: documentId,
      status: accepted ? "accepted" : "rejected",
      tax_authority_response: result.sunat_description || result.message || "",
      ticket: result.ticket || undefined,
      raw_response: result,
    };
  },

  // ── getDailySummary ──────────────────────────────────

  async getDailySummary(date: string): Promise<DailySummaryResult> {
    const payload = {
      operacion: "generar_resumen",
      fecha_de_emision: date,
      fecha_de_comunicacion: new Date().toISOString().split("T")[0],
      ruc_emisor: APISUNAT_RUC,
      ambiente: APISUNAT_ENVIRONMENT === "production" ? 1 : 0,
    };

    const result = await apisunatFetch("/api/v1/invoice/send", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const accepted = result.aceptada_por_sunat !== false && result.success !== false;

    return {
      id: result.numero || "",
      ticket: result.ticket || "",
      status: accepted ? "accepted" : "pending",
      tax_authority_response:
        result.sunat_description || "Resumen enviado. Usar ticket para consultar estado.",
      raw_response: result,
    };
  },

  // ── lookupTaxId ──────────────────────────────────────

  async lookupTaxId(taxId: string): Promise<TaxIdInfo> {
    // Determine if RUC (11 digits) or DNI (8 digits)
    const isRuc = /^\d{11}$/.test(taxId);
    const isDni = /^\d{8}$/.test(taxId);

    if (!isRuc && !isDni) {
      return {
        valid: false,
        tax_id: taxId,
        name: "Invalid format. RUC must be 11 digits, DNI must be 8 digits.",
        doc_type: isRuc ? "RUC" : "DNI",
      };
    }

    try {
      if (isRuc) {
        const result = await apisunatFetch(`/api/v1/ruc/${taxId}`);
        return {
          valid: true,
          tax_id: taxId,
          name: result.razon_social || result.nombre_o_razon_social || "",
          trade_name: result.nombre_comercial || "",
          state: result.estado || result.estado_contribuyente || "",
          address: result.direccion || result.domicilio_fiscal || "",
          regime: result.regimen || "",
          doc_type: "RUC",
        };
      } else {
        const result = await apisunatFetch(`/api/v1/dni/${taxId}`);
        const nombre =
          result.nombre_completo ||
          [result.nombres, result.apellido_paterno, result.apellido_materno]
            .filter(Boolean)
            .join(" ") ||
          "";
        return {
          valid: true,
          tax_id: taxId,
          name: nombre,
          doc_type: "DNI",
        };
      }
    } catch {
      return {
        valid: false,
        tax_id: taxId,
        name: `Could not validate ${isRuc ? "RUC" : "DNI"}`,
        doc_type: isRuc ? "RUC" : "DNI",
      };
    }
  },

  // ── getInvoiceStatus ─────────────────────────────────

  async getInvoiceStatus(documentId: string): Promise<InvoiceStatusResult> {
    const result = await apisunatFetch(`/api/v1/invoice/status/${documentId}`);

    let status: InvoiceStatusResult["status"] = "pending";
    if (result.aceptada_por_sunat === true || result.success === true) status = "accepted";
    if (result.aceptada_por_sunat === false || result.success === false) status = "rejected";

    return {
      id: documentId,
      number: result.numero || documentId,
      status,
      tax_authority_response: result.sunat_description || result.message || "",
      raw_response: result,
    };
  },

  // ── listInvoices ─────────────────────────────────────

  async listInvoices(params: InvoiceListParams): Promise<InvoiceListResult> {
    const query = new URLSearchParams();
    if (params.from_date) query.set("from", params.from_date);
    if (params.to_date) query.set("to", params.to_date);
    if (params.document_type) query.set("type", params.document_type);
    if (params.status) query.set("status", params.status);
    if (params.customer_tax_id) query.set("customer", params.customer_tax_id);
    query.set("limit", String(params.limit || 20));

    const result = await apisunatFetch(`/api/v1/invoice/list?${query.toString()}`);

    // Normalize response — APISUNAT may return array or { data, total }
    const items = Array.isArray(result) ? result : result.data || result.invoices || [];

    return {
      invoices: items.map((inv: any) => ({
        id: inv.id?.toString() || inv.numero || "",
        number: inv.numero || "",
        document_type: inv.tipo_de_comprobante?.toString() || "",
        customer_name: inv.cliente_denominacion || "",
        customer_tax_id: inv.cliente_numero_de_documento || "",
        total: inv.total_venta || inv.total || 0,
        currency: inv.moneda === 2 ? "USD" : "PEN",
        issue_date: inv.fecha_de_emision || "",
        status: inv.aceptada_por_sunat === false ? "rejected" as const : "accepted" as const,
      })),
      total_count: result.total || items.length,
    };
  },

  // ── Tax Metadata ─────────────────────────────────────

  getTaxObligations(regime: string): TaxObligation[] {
    const upper = regime.toUpperCase();
    switch (upper) {
      case "NRUS":
        return [
          { obligation: "Cuota fija mensual", frequency: "Mensual", form: "Formulario 1611", description: "Pago único de S/20 (Cat.1) o S/50 (Cat.2) que cubre renta e IGV" },
          { obligation: "Emisión de boletas", frequency: "Por operación", description: "Solo puede emitir boletas de venta y tickets, NO facturas" },
        ];
      case "RER":
        return [
          { obligation: "Declaración IGV-Renta", frequency: "Mensual", form: "PDT 621 / Formulario Virtual 621", description: "Declarar y pagar IGV (18%) + Renta (1.5% ingresos netos)" },
          { obligation: "Registro de Compras", frequency: "Mensual", description: "Mantener actualizado el Registro de Compras" },
          { obligation: "Registro de Ventas", frequency: "Mensual", description: "Mantener actualizado el Registro de Ventas" },
          { obligation: "Emisión de CPE", frequency: "Por operación", description: "Facturas, boletas, notas de crédito/débito electrónicas" },
        ];
      case "RMT":
        return [
          { obligation: "Declaración IGV-Renta mensual", frequency: "Mensual", form: "PDT 621 / Formulario Virtual 621", description: "Declarar y pagar IGV (18%) + Renta (1% hasta 300 UIT, 1.5% si excede)" },
          { obligation: "Declaración Renta Anual", frequency: "Anual", form: "Formulario Virtual 710", description: "Declaración anual con escala progresiva: 10% hasta 15 UIT, 29.5% exceso" },
          { obligation: "Libros contables simplificados", frequency: "Mensual", description: "Registro de Ventas, Registro de Compras, Libro Diario Simplificado (hasta 300 UIT)" },
          { obligation: "Emisión de CPE", frequency: "Por operación", description: "Todos los comprobantes electrónicos incluyendo guías de remisión" },
        ];
      case "RG":
      case "GENERAL":
        return [
          { obligation: "Declaración IGV-Renta mensual", frequency: "Mensual", form: "PDT 621 / Formulario Virtual 621", description: "Declarar y pagar IGV (18%) + pagos a cuenta Renta (1.5% o coeficiente)" },
          { obligation: "Declaración Renta Anual", frequency: "Anual", form: "Formulario Virtual 710", description: "Renta neta × 29.5%, menos pagos a cuenta realizados durante el año" },
          { obligation: "Contabilidad completa", frequency: "Mensual", description: "Libro Diario, Mayor, Inventarios y Balances, Registro Compras, Registro Ventas, Caja y Bancos" },
          { obligation: "Emisión de CPE", frequency: "Por operación", description: "Todos los comprobantes electrónicos" },
          { obligation: "DAOT", frequency: "Anual", form: "Formulario Virtual 3500", description: "Declaración Anual de Operaciones con Terceros (si operaciones > 2 UIT con un tercero)" },
        ];
      default:
        throw new Error(`Unknown Peru regime: ${regime}. Valid: NRUS, RER, RMT, RG`);
    }
  },

  calculateTax(params: TaxCalculationParams): TaxCalculationResult {
    const { regime, monthly_revenue, monthly_purchases } = params;
    const upper = regime.toUpperCase();

    const igvVentas = Math.round(monthly_revenue * IGV_RATE * 100) / 100;
    const igvCompras = Math.round(monthly_purchases * IGV_RATE * 100) / 100;

    switch (upper) {
      case "NRUS": {
        const cuota = monthly_revenue <= 5000 ? 20 : 50;
        return {
          regime: "NRUS",
          tax_on_sales: 0,
          tax_on_purchases: 0,
          tax_payable: 0,
          income_tax_monthly: cuota,
          total_monthly: cuota,
          breakdown: {
            cuota_fija: cuota,
            categoria: monthly_revenue <= 5000 ? 1 : 2,
            nota: "Cuota fija incluye renta e IGV. No se declara IGV por separado.",
            limite_mensual: monthly_revenue <= 5000 ? 5000 : 8000,
          },
        };
      }
      case "RER": {
        const igvPayable = Math.max(0, Math.round((igvVentas - igvCompras) * 100) / 100);
        const rentaMensual = Math.round(monthly_revenue * 0.015 * 100) / 100;
        return {
          regime: "RER",
          tax_on_sales: igvVentas,
          tax_on_purchases: igvCompras,
          tax_payable: igvPayable,
          income_tax_monthly: rentaMensual,
          total_monthly: Math.round((igvPayable + rentaMensual) * 100) / 100,
          breakdown: {
            base_imponible_ventas: monthly_revenue,
            base_imponible_compras: monthly_purchases,
            tasa_igv: "18%",
            tasa_renta: "1.5%",
            credito_fiscal: igvCompras,
          },
        };
      }
      case "RMT": {
        const igvPayable = Math.max(0, Math.round((igvVentas - igvCompras) * 100) / 100);
        const annualRevenue = params.annual_revenue || monthly_revenue * 12;
        const rentaRate = annualRevenue <= 300 * UIT_2026 ? 0.01 : 0.015;
        const rentaMensual = Math.round(monthly_revenue * rentaRate * 100) / 100;
        return {
          regime: "RMT",
          tax_on_sales: igvVentas,
          tax_on_purchases: igvCompras,
          tax_payable: igvPayable,
          income_tax_monthly: rentaMensual,
          total_monthly: Math.round((igvPayable + rentaMensual) * 100) / 100,
          breakdown: {
            base_imponible_ventas: monthly_revenue,
            base_imponible_compras: monthly_purchases,
            tasa_igv: "18%",
            tasa_renta: `${rentaRate * 100}%`,
            renta_rate_reason: annualRevenue <= 300 * UIT_2026
              ? `Ingresos anuales (S/${annualRevenue.toLocaleString()}) <= 300 UIT (S/${(300 * UIT_2026).toLocaleString()}) → 1%`
              : `Ingresos anuales (S/${annualRevenue.toLocaleString()}) > 300 UIT (S/${(300 * UIT_2026).toLocaleString()}) → 1.5%`,
            credito_fiscal: igvCompras,
            renta_anual_escala: "10% hasta 15 UIT + 29.5% exceso",
          },
        };
      }
      case "RG":
      case "GENERAL": {
        const igvPayable = Math.max(0, Math.round((igvVentas - igvCompras) * 100) / 100);
        const rentaMensual = Math.round(monthly_revenue * 0.015 * 100) / 100;
        return {
          regime: "RG",
          tax_on_sales: igvVentas,
          tax_on_purchases: igvCompras,
          tax_payable: igvPayable,
          income_tax_monthly: rentaMensual,
          total_monthly: Math.round((igvPayable + rentaMensual) * 100) / 100,
          breakdown: {
            base_imponible_ventas: monthly_revenue,
            base_imponible_compras: monthly_purchases,
            tasa_igv: "18%",
            tasa_renta_pago_a_cuenta: "1.5% (o coeficiente si mayor)",
            credito_fiscal: igvCompras,
            tasa_renta_anual: "29.5% sobre renta neta",
            nota: "El pago a cuenta mensual se usa como crédito contra la renta anual",
          },
        };
      }
      default:
        throw new Error(`Unknown Peru regime: ${regime}. Valid: NRUS, RER, RMT, RG`);
    }
  },

  getDocumentTypes(): DocumentTypeInfo[] {
    return PERU_DOCUMENT_TYPES;
  },

  getTaxRates(): TaxRateInfo[] {
    return PERU_TAX_RATES;
  },

  // ── Health Check ─────────────────────────────────────

  async healthCheck(): Promise<HealthCheckResult> {
    try {
      await authenticate();
      return {
        country: "PE",
        provider: "APISUNAT.pe",
        environment: APISUNAT_ENVIRONMENT,
        authenticated: true,
        message: `Connected to APISUNAT.pe (${APISUNAT_ENVIRONMENT}). RUC: ${APISUNAT_RUC || "not set"}`,
      };
    } catch (err: any) {
      return {
        country: "PE",
        provider: "APISUNAT.pe",
        environment: APISUNAT_ENVIRONMENT,
        authenticated: false,
        message: `Auth failed: ${err.message}`,
      };
    }
  },
};
