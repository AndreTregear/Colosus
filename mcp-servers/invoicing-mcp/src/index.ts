#!/usr/bin/env node
/**
 * Invoicing MCP Server
 * Electronic invoicing with country-adapter pattern.
 * v1: Peru (SUNAT) via PSE provider REST API.
 *
 * Tools:
 *  - create_invoice: Create and submit factura/boleta
 *  - create_credit_note: Issue nota de crédito
 *  - create_debit_note: Issue nota de débito
 *  - void_invoice: Submit comunicación de baja
 *  - get_daily_summary: Generate resumen diario for boletas
 *  - lookup_ruc: Validate RUC and get empresa data
 *  - lookup_dni: Validate DNI number
 *  - get_invoice_status: Check status of a submitted invoice
 *  - list_invoices: List issued invoices with filters
 *  - get_tax_obligations: Get obligations for a business regime
 *  - calculate_tax: Calculate IGV and renta owed
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// ── Environment Configuration ────────────────────────────

const INVOICE_COUNTRY = process.env.INVOICE_COUNTRY || "PE";
const INVOICE_PSE_URL = process.env.INVOICE_PSE_URL || "";
const INVOICE_PSE_TOKEN = process.env.INVOICE_PSE_TOKEN || "";
const INVOICE_RUC = process.env.INVOICE_RUC || "";
const INVOICE_ENVIRONMENT = process.env.INVOICE_ENVIRONMENT || "beta";

// ── Types ────────────────────────────────────────────────

interface Address {
  street: string;
  district?: string;
  city: string;
  state: string;
  country: string;
  postal_code?: string;
  ubigeo?: string;
}

interface CustomerData {
  tax_id: string;
  tax_id_type: string;
  legal_name: string;
  trade_name?: string;
  address?: Address;
  email?: string;
}

interface LineItem {
  description: string;
  quantity: number;
  unit_code: string;
  unit_price: number;
  tax_type?: string;
  tax_rate?: number;
  discount?: number;
  item_code?: string;
}

interface InvoiceData {
  document_type: string;
  series?: string;
  currency: string;
  exchange_rate?: number;
  issue_date?: string;
  due_date?: string;
  customer: CustomerData;
  items: LineItem[];
  notes?: string;
  purchase_order?: string;
  payment_terms?: string;
}

interface CreditNoteData {
  reference_document: string;
  reference_type: string;
  reason_code: string;
  reason: string;
  currency: string;
  customer: CustomerData;
  items: LineItem[];
  notes?: string;
}

interface DebitNoteData {
  reference_document: string;
  reference_type: string;
  reason_code: string;
  reason: string;
  currency: string;
  customer: CustomerData;
  items: LineItem[];
  notes?: string;
}

interface VoidData {
  document_id: string;
  document_type: string;
  reason: string;
  void_date?: string;
}

interface DocumentResult {
  success: boolean;
  document_id: string;
  hash?: string;
  cdr_code?: string;
  cdr_description?: string;
  pdf_url?: string;
  xml_url?: string;
  sunat_response?: Record<string, unknown>;
}

interface TaxIdInfo {
  valid: boolean;
  tax_id: string;
  legal_name?: string;
  trade_name?: string;
  state?: string;
  address?: string;
  regime?: string;
}

interface ExchangeRateResult {
  from: string;
  to: string;
  date: string;
  buy_rate: number;
  sell_rate: number;
}

interface DocumentTypeInfo {
  code: string;
  name: string;
  description: string;
}

interface TaxRateInfo {
  tax_type: string;
  rate: number;
  description: string;
}

interface TaxObligation {
  obligation: string;
  frequency: string;
  form?: string;
  description: string;
}

interface TaxCalculationParams {
  regime: string;
  monthly_revenue: number;
  monthly_purchases: number;
  annual_revenue?: number;
}

interface TaxCalculationResult {
  regime: string;
  igv_ventas: number;
  igv_compras: number;
  igv_a_pagar: number;
  renta_mensual: number;
  total_mensual: number;
  breakdown: Record<string, unknown>;
}

// ── Country Adapter Interface ────────────────────────────

interface CountryAdapter {
  readonly countryCode: string;
  readonly countryName: string;
  readonly currency: string;

  createInvoice(data: InvoiceData): Promise<DocumentResult>;
  createCreditNote(data: CreditNoteData): Promise<DocumentResult>;
  createDebitNote(data: DebitNoteData): Promise<DocumentResult>;
  voidInvoice(data: VoidData): Promise<DocumentResult>;
  getDailySummary(date: string): Promise<DocumentResult>;

  validateTaxId(taxId: string): Promise<TaxIdInfo>;
  lookupDni(dni: string): Promise<TaxIdInfo>;
  getExchangeRate(from: string, to: string, date?: string): Promise<ExchangeRateResult>;

  getDocumentTypes(): DocumentTypeInfo[];
  getTaxRates(): TaxRateInfo[];
  getTaxObligations(regime: string): TaxObligation[];
  calculateTax(params: TaxCalculationParams): TaxCalculationResult;
}

// ── PSE API Client ───────────────────────────────────────

async function pseFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  if (!INVOICE_PSE_URL) {
    throw new Error("INVOICE_PSE_URL not configured. Set the PSE provider API URL.");
  }
  const url = `${INVOICE_PSE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(INVOICE_PSE_TOKEN ? { Authorization: `Bearer ${INVOICE_PSE_TOKEN}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PSE API ${res.status}: ${text}`);
  }
  return res.json();
}

// ── Peru Adapter ─────────────────────────────────────────

const IGV_RATE = 0.18;
const UIT_2025 = 5150;

const PERU_DOCUMENT_TYPES: DocumentTypeInfo[] = [
  { code: "01", name: "Factura", description: "Invoice for businesses with RUC — grants crédito fiscal IGV" },
  { code: "03", name: "Boleta de Venta", description: "Receipt for end consumers (DNI or anonymous)" },
  { code: "07", name: "Nota de Crédito", description: "Credit note — void, discount, or correct a factura/boleta" },
  { code: "08", name: "Nota de Débito", description: "Debit note — interest, penalties, or price increase" },
  { code: "09", name: "Guía de Remisión Remitente", description: "Dispatch guide issued by sender" },
  { code: "31", name: "Guía de Remisión Transportista", description: "Dispatch guide issued by carrier" },
];

const PERU_TAX_RATES: TaxRateInfo[] = [
  { tax_type: "IGV", rate: 18, description: "Impuesto General a las Ventas — 18% sobre valor venta" },
  { tax_type: "ICBPER", rate: 0.50, description: "Impuesto al Consumo de Bolsas Plásticas — S/0.50 por bolsa" },
  { tax_type: "EXO", rate: 0, description: "Exonerado de IGV (productos de primera necesidad, según Apéndice I TUO IGV)" },
  { tax_type: "INA", rate: 0, description: "Inafecto al IGV (educación, salud, etc.)" },
  { tax_type: "GRA", rate: 0, description: "Gratuita (transferencia gratuita, IGV asumido por emisor)" },
];

function getPeruTaxObligations(regime: string): TaxObligation[] {
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
      throw new Error(`Unknown regime: ${regime}. Valid regimes: NRUS, RER, RMT, RG`);
  }
}

function calculatePeruTax(params: TaxCalculationParams): TaxCalculationResult {
  const { regime, monthly_revenue, monthly_purchases } = params;
  const upper = regime.toUpperCase();

  const igv_ventas = Math.round(monthly_revenue * IGV_RATE * 100) / 100;
  const igv_compras = Math.round(monthly_purchases * IGV_RATE * 100) / 100;

  switch (upper) {
    case "NRUS": {
      // Cuota fija — no IGV/renta calculation needed
      const cuota = monthly_revenue <= 5000 ? 20 : 50;
      return {
        regime: "NRUS",
        igv_ventas: 0,
        igv_compras: 0,
        igv_a_pagar: 0,
        renta_mensual: cuota,
        total_mensual: cuota,
        breakdown: {
          cuota_fija: cuota,
          categoria: monthly_revenue <= 5000 ? 1 : 2,
          nota: "Cuota fija incluye renta e IGV. No se declara IGV por separado.",
          limite_mensual_compras: monthly_revenue <= 5000 ? 5000 : 8000,
          limite_mensual_ventas: monthly_revenue <= 5000 ? 5000 : 8000,
        },
      };
    }
    case "RER": {
      const igv_a_pagar = Math.max(0, Math.round((igv_ventas - igv_compras) * 100) / 100);
      const renta_mensual = Math.round(monthly_revenue * 0.015 * 100) / 100;
      return {
        regime: "RER",
        igv_ventas,
        igv_compras,
        igv_a_pagar,
        renta_mensual,
        total_mensual: Math.round((igv_a_pagar + renta_mensual) * 100) / 100,
        breakdown: {
          base_imponible_ventas: monthly_revenue,
          base_imponible_compras: monthly_purchases,
          tasa_igv: "18%",
          tasa_renta: "1.5%",
          credito_fiscal: igv_compras,
        },
      };
    }
    case "RMT": {
      const igv_a_pagar = Math.max(0, Math.round((igv_ventas - igv_compras) * 100) / 100);
      const annual_revenue = params.annual_revenue || monthly_revenue * 12;
      const renta_rate = annual_revenue <= 300 * UIT_2025 ? 0.01 : 0.015;
      const renta_mensual = Math.round(monthly_revenue * renta_rate * 100) / 100;
      return {
        regime: "RMT",
        igv_ventas,
        igv_compras,
        igv_a_pagar,
        renta_mensual,
        total_mensual: Math.round((igv_a_pagar + renta_mensual) * 100) / 100,
        breakdown: {
          base_imponible_ventas: monthly_revenue,
          base_imponible_compras: monthly_purchases,
          tasa_igv: "18%",
          tasa_renta: `${renta_rate * 100}%`,
          renta_rate_reason: annual_revenue <= 300 * UIT_2025
            ? `Ingresos anuales estimados (S/${annual_revenue.toLocaleString()}) ≤ 300 UIT (S/${(300 * UIT_2025).toLocaleString()}) → tasa 1%`
            : `Ingresos anuales estimados (S/${annual_revenue.toLocaleString()}) > 300 UIT (S/${(300 * UIT_2025).toLocaleString()}) → tasa 1.5%`,
          credito_fiscal: igv_compras,
          renta_anual_escala: "10% hasta 15 UIT + 29.5% exceso",
        },
      };
    }
    case "RG":
    case "GENERAL": {
      const igv_a_pagar = Math.max(0, Math.round((igv_ventas - igv_compras) * 100) / 100);
      const renta_mensual = Math.round(monthly_revenue * 0.015 * 100) / 100;
      return {
        regime: "RG",
        igv_ventas,
        igv_compras,
        igv_a_pagar,
        renta_mensual,
        total_mensual: Math.round((igv_a_pagar + renta_mensual) * 100) / 100,
        breakdown: {
          base_imponible_ventas: monthly_revenue,
          base_imponible_compras: monthly_purchases,
          tasa_igv: "18%",
          tasa_renta_pago_a_cuenta: "1.5% (o coeficiente si mayor)",
          credito_fiscal: igv_compras,
          tasa_renta_anual: "29.5% sobre renta neta",
          nota: "El pago a cuenta mensual se usa como crédito contra la renta anual",
        },
      };
    }
    default:
      throw new Error(`Unknown regime: ${regime}. Valid regimes: NRUS, RER, RMT, RG`);
  }
}

const peruAdapter: CountryAdapter = {
  countryCode: "PE",
  countryName: "Peru",
  currency: "PEN",

  async createInvoice(data: InvoiceData): Promise<DocumentResult> {
    const seriesPrefix = data.document_type === "01" ? "F" : "B";
    const defaultSeries = data.document_type === "01"
      ? (process.env.INVOICE_SERIES_FACTURA || "F001")
      : (process.env.INVOICE_SERIES_BOLETA || "B001");
    const series = data.series || defaultSeries;

    // Calculate line totals and taxes
    const lines = data.items.map((item, idx) => {
      const taxType = item.tax_type || "IGV";
      const taxRate = item.tax_rate ?? (taxType === "IGV" ? IGV_RATE : 0);
      const subtotal = Math.round(item.quantity * item.unit_price * 100) / 100;
      const discount = Math.round((item.discount || 0) * item.quantity * 100) / 100;
      const taxableAmount = subtotal - discount;
      const taxAmount = Math.round(taxableAmount * taxRate * 100) / 100;

      return {
        numero: idx + 1,
        codigo: item.item_code || "",
        descripcion: item.description,
        cantidad: item.quantity,
        unidad_medida: item.unit_code,
        valor_unitario: item.unit_price,
        precio_unitario: Math.round(item.unit_price * (1 + taxRate) * 100) / 100,
        subtotal: taxableAmount,
        igv: taxAmount,
        total: Math.round((taxableAmount + taxAmount) * 100) / 100,
        tipo_afectacion: taxType === "IGV" ? "10" : taxType === "EXO" ? "20" : taxType === "INA" ? "30" : "10",
      };
    });

    const totalGravada = lines.reduce((sum, l) => sum + l.subtotal, 0);
    const totalIgv = lines.reduce((sum, l) => sum + l.igv, 0);
    const totalVenta = lines.reduce((sum, l) => sum + l.total, 0);

    const payload = {
      operacion: "generar_comprobante",
      tipo_de_comprobante: parseInt(data.document_type),
      serie: series,
      moneda: data.currency === "USD" ? 2 : 1,
      tipo_cambio: data.exchange_rate || 1,
      fecha_de_emision: data.issue_date || new Date().toISOString().split("T")[0],
      fecha_de_vencimiento: data.due_date || null,
      cliente_tipo_de_documento: data.customer.tax_id_type === "RUC" ? 6 : data.customer.tax_id_type === "DNI" ? 1 : 0,
      cliente_numero_de_documento: data.customer.tax_id,
      cliente_denominacion: data.customer.legal_name,
      cliente_direccion: data.customer.address
        ? `${data.customer.address.street}, ${data.customer.address.district || ""}, ${data.customer.address.city}`
        : "",
      cliente_email: data.customer.email || "",
      observaciones: data.notes || "",
      orden_compra: data.purchase_order || "",
      condiciones_de_pago: data.payment_terms || "",
      total_gravada: Math.round(totalGravada * 100) / 100,
      total_igv: Math.round(totalIgv * 100) / 100,
      total_venta: Math.round(totalVenta * 100) / 100,
      items: lines.map((l) => ({
        unidad_de_medida: l.unidad_medida,
        codigo: l.codigo,
        descripcion: l.descripcion,
        cantidad: l.cantidad,
        valor_unitario: l.valor_unitario,
        precio_unitario: l.precio_unitario,
        subtotal: l.subtotal,
        tipo_de_igv: l.tipo_afectacion,
        igv: l.igv,
        total: l.total,
        anticipo_regularizacion: false,
      })),
      ruc_emisor: INVOICE_RUC,
      ambiente: INVOICE_ENVIRONMENT === "production" ? 1 : 0,
    };

    const result = await pseFetch("/invoice", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return {
      success: result.aceptada_por_sunat !== false,
      document_id: result.numero || `${series}-${result.correlativo}`,
      hash: result.hash || result.digest_value || null,
      cdr_code: result.sunat_code?.toString() || null,
      cdr_description: result.sunat_description || result.sunat_note || null,
      pdf_url: result.enlace_del_pdf || result.pdf_url || null,
      xml_url: result.enlace_del_xml || result.xml_url || null,
      sunat_response: result,
    };
  },

  async createCreditNote(data: CreditNoteData): Promise<DocumentResult> {
    const refPrefix = data.reference_document.startsWith("F") ? "FC" : "BC";
    const series = `${refPrefix}01`;

    const lines = data.items.map((item, idx) => {
      const taxRate = item.tax_rate ?? IGV_RATE;
      const subtotal = Math.round(item.quantity * item.unit_price * 100) / 100;
      const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
      return {
        numero: idx + 1,
        codigo: item.item_code || "",
        descripcion: item.description,
        cantidad: item.quantity,
        unidad_medida: item.unit_code,
        valor_unitario: item.unit_price,
        precio_unitario: Math.round(item.unit_price * (1 + taxRate) * 100) / 100,
        subtotal,
        igv: taxAmount,
        total: Math.round((subtotal + taxAmount) * 100) / 100,
        tipo_de_igv: "10",
      };
    });

    const totalGravada = lines.reduce((sum, l) => sum + l.subtotal, 0);
    const totalIgv = lines.reduce((sum, l) => sum + l.igv, 0);
    const totalVenta = lines.reduce((sum, l) => sum + l.total, 0);

    const payload = {
      operacion: "generar_comprobante",
      tipo_de_comprobante: 7,
      serie: series,
      moneda: data.currency === "USD" ? 2 : 1,
      fecha_de_emision: new Date().toISOString().split("T")[0],
      cliente_tipo_de_documento: data.customer.tax_id_type === "RUC" ? 6 : 1,
      cliente_numero_de_documento: data.customer.tax_id,
      cliente_denominacion: data.customer.legal_name,
      tipo_de_nota_de_credito: parseInt(data.reason_code) || 1,
      documento_que_se_modifica_tipo: parseInt(data.reference_type),
      documento_que_se_modifica_serie_numero: data.reference_document,
      motivo: data.reason,
      total_gravada: Math.round(totalGravada * 100) / 100,
      total_igv: Math.round(totalIgv * 100) / 100,
      total_venta: Math.round(totalVenta * 100) / 100,
      items: lines,
      ruc_emisor: INVOICE_RUC,
      ambiente: INVOICE_ENVIRONMENT === "production" ? 1 : 0,
    };

    const result = await pseFetch("/credit-note", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return {
      success: result.aceptada_por_sunat !== false,
      document_id: result.numero || `${series}-${result.correlativo}`,
      hash: result.hash || null,
      cdr_code: result.sunat_code?.toString() || null,
      cdr_description: result.sunat_description || null,
      pdf_url: result.enlace_del_pdf || null,
      xml_url: result.enlace_del_xml || null,
      sunat_response: result,
    };
  },

  async createDebitNote(data: DebitNoteData): Promise<DocumentResult> {
    const refPrefix = data.reference_document.startsWith("F") ? "FD" : "BD";
    const series = `${refPrefix}01`;

    const lines = data.items.map((item, idx) => {
      const taxRate = item.tax_rate ?? IGV_RATE;
      const subtotal = Math.round(item.quantity * item.unit_price * 100) / 100;
      const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
      return {
        numero: idx + 1,
        codigo: item.item_code || "",
        descripcion: item.description,
        cantidad: item.quantity,
        unidad_medida: item.unit_code,
        valor_unitario: item.unit_price,
        precio_unitario: Math.round(item.unit_price * (1 + taxRate) * 100) / 100,
        subtotal,
        igv: taxAmount,
        total: Math.round((subtotal + taxAmount) * 100) / 100,
        tipo_de_igv: "10",
      };
    });

    const totalGravada = lines.reduce((sum, l) => sum + l.subtotal, 0);
    const totalIgv = lines.reduce((sum, l) => sum + l.igv, 0);
    const totalVenta = lines.reduce((sum, l) => sum + l.total, 0);

    const payload = {
      operacion: "generar_comprobante",
      tipo_de_comprobante: 8,
      serie: series,
      moneda: data.currency === "USD" ? 2 : 1,
      fecha_de_emision: new Date().toISOString().split("T")[0],
      cliente_tipo_de_documento: data.customer.tax_id_type === "RUC" ? 6 : 1,
      cliente_numero_de_documento: data.customer.tax_id,
      cliente_denominacion: data.customer.legal_name,
      tipo_de_nota_de_debito: parseInt(data.reason_code) || 1,
      documento_que_se_modifica_tipo: parseInt(data.reference_type),
      documento_que_se_modifica_serie_numero: data.reference_document,
      motivo: data.reason,
      total_gravada: Math.round(totalGravada * 100) / 100,
      total_igv: Math.round(totalIgv * 100) / 100,
      total_venta: Math.round(totalVenta * 100) / 100,
      items: lines,
      ruc_emisor: INVOICE_RUC,
      ambiente: INVOICE_ENVIRONMENT === "production" ? 1 : 0,
    };

    const result = await pseFetch("/debit-note", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return {
      success: result.aceptada_por_sunat !== false,
      document_id: result.numero || `${series}-${result.correlativo}`,
      hash: result.hash || null,
      cdr_code: result.sunat_code?.toString() || null,
      cdr_description: result.sunat_description || null,
      pdf_url: result.enlace_del_pdf || null,
      xml_url: result.enlace_del_xml || null,
      sunat_response: result,
    };
  },

  async voidInvoice(data: VoidData): Promise<DocumentResult> {
    const payload = {
      operacion: "generar_anulacion",
      tipo_de_comprobante: parseInt(data.document_type),
      serie_numero: data.document_id,
      motivo: data.reason,
      fecha_de_comunicacion: data.void_date || new Date().toISOString().split("T")[0],
      ruc_emisor: INVOICE_RUC,
      ambiente: INVOICE_ENVIRONMENT === "production" ? 1 : 0,
    };

    const result = await pseFetch("/void", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return {
      success: result.aceptada_por_sunat !== false,
      document_id: data.document_id,
      cdr_code: result.sunat_code?.toString() || null,
      cdr_description: result.sunat_description || result.ticket || null,
      sunat_response: result,
    };
  },

  async getDailySummary(date: string): Promise<DocumentResult> {
    const payload = {
      operacion: "generar_resumen",
      fecha_de_emision: date,
      fecha_de_comunicacion: new Date().toISOString().split("T")[0],
      ruc_emisor: INVOICE_RUC,
      ambiente: INVOICE_ENVIRONMENT === "production" ? 1 : 0,
    };

    const result = await pseFetch("/summary", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return {
      success: result.aceptada_por_sunat !== false,
      document_id: result.ticket || result.numero || "",
      cdr_code: result.sunat_code?.toString() || null,
      cdr_description: result.sunat_description || "Resumen enviado. Usar ticket para consultar estado.",
      sunat_response: result,
    };
  },

  async validateTaxId(ruc: string): Promise<TaxIdInfo> {
    if (!/^\d{11}$/.test(ruc)) {
      return { valid: false, tax_id: ruc, legal_name: "Invalid RUC format (must be 11 digits)" };
    }
    try {
      const result = await pseFetch(`/ruc/${ruc}`);
      return {
        valid: true,
        tax_id: ruc,
        legal_name: result.razon_social || result.nombre_o_razon_social || "",
        trade_name: result.nombre_comercial || "",
        state: result.estado || result.estado_contribuyente || "",
        address: result.direccion || result.domicilio_fiscal || "",
        regime: result.regimen || "",
      };
    } catch {
      return { valid: false, tax_id: ruc, legal_name: "Could not validate RUC" };
    }
  },

  async lookupDni(dni: string): Promise<TaxIdInfo> {
    if (!/^\d{8}$/.test(dni)) {
      return { valid: false, tax_id: dni, legal_name: "Invalid DNI format (must be 8 digits)" };
    }
    try {
      const result = await pseFetch(`/dni/${dni}`);
      const nombre = result.nombre_completo
        || [result.nombres, result.apellido_paterno, result.apellido_materno].filter(Boolean).join(" ")
        || "";
      return {
        valid: true,
        tax_id: dni,
        legal_name: nombre,
      };
    } catch {
      return { valid: false, tax_id: dni, legal_name: "Could not validate DNI" };
    }
  },

  async getExchangeRate(from: string, to: string, date?: string): Promise<ExchangeRateResult> {
    const queryDate = date || new Date().toISOString().split("T")[0];
    try {
      const result = await pseFetch(`/exchange-rate?date=${queryDate}`);
      return {
        from,
        to,
        date: queryDate,
        buy_rate: result.compra || result.buy || 0,
        sell_rate: result.venta || result.sell || 0,
      };
    } catch {
      return { from, to, date: queryDate, buy_rate: 0, sell_rate: 0 };
    }
  },

  getDocumentTypes(): DocumentTypeInfo[] {
    return PERU_DOCUMENT_TYPES;
  },

  getTaxRates(): TaxRateInfo[] {
    return PERU_TAX_RATES;
  },

  getTaxObligations(regime: string): TaxObligation[] {
    return getPeruTaxObligations(regime);
  },

  calculateTax(params: TaxCalculationParams): TaxCalculationResult {
    return calculatePeruTax(params);
  },
};

// ── Adapter Registry ─────────────────────────────────────

const adapters: Record<string, CountryAdapter> = {
  PE: peruAdapter,
};

function getAdapter(): CountryAdapter {
  const adapter = adapters[INVOICE_COUNTRY];
  if (!adapter) {
    throw new Error(
      `No adapter for country "${INVOICE_COUNTRY}". Available: ${Object.keys(adapters).join(", ")}`
    );
  }
  return adapter;
}

// ── Tool Definitions ─────────────────────────────────────

const TOOLS = [
  {
    name: "create_invoice",
    description:
      "Create and submit an electronic invoice (factura or boleta). For factura (01): customer needs RUC. For boleta (03): customer needs DNI or can be anonymous. Returns SUNAT response, PDF link, and XML hash.",
    inputSchema: {
      type: "object" as const,
      properties: {
        document_type: {
          type: "string",
          enum: ["01", "03"],
          description: "01 = Factura (requires RUC), 03 = Boleta (requires DNI or anonymous)",
        },
        customer_tax_id: { type: "string", description: "Customer RUC (11 digits) or DNI (8 digits)" },
        customer_tax_id_type: {
          type: "string",
          enum: ["RUC", "DNI", "CE"],
          description: "Type of customer ID document",
        },
        customer_name: { type: "string", description: "Customer legal name (razón social)" },
        customer_address: { type: "string", description: "Customer address (optional)" },
        customer_email: { type: "string", description: "Customer email for sending PDF (optional)" },
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              description: { type: "string", description: "Item description" },
              quantity: { type: "number", description: "Quantity" },
              unit_price: { type: "number", description: "Unit price before IGV (valor unitario)" },
              unit_code: { type: "string", description: "Unit code: NIU (units), ZZ (service), KGM (kg). Default: NIU" },
              tax_type: { type: "string", enum: ["IGV", "EXO", "INA", "GRA"], description: "Tax type (default: IGV)" },
              item_code: { type: "string", description: "Internal item code (optional)" },
            },
            required: ["description", "quantity", "unit_price"],
          },
          description: "Line items for the invoice",
        },
        currency: { type: "string", enum: ["PEN", "USD"], description: "Currency (default: PEN)" },
        exchange_rate: { type: "number", description: "Exchange rate if USD (optional)" },
        notes: { type: "string", description: "Invoice notes/observations (optional)" },
        due_date: { type: "string", description: "Payment due date ISO format (optional)" },
        purchase_order: { type: "string", description: "Customer purchase order number (optional)" },
        payment_terms: { type: "string", description: "Payment terms description (optional)" },
      },
      required: ["document_type", "customer_tax_id", "customer_tax_id_type", "customer_name", "items"],
    },
  },
  {
    name: "create_credit_note",
    description:
      "Issue a credit note (nota de crédito) against an existing factura or boleta. Used for: void (01), correction (02), discount (03), or other adjustments.",
    inputSchema: {
      type: "object" as const,
      properties: {
        reference_document: { type: "string", description: "Original document ID (e.g., F001-00000001)" },
        reference_type: {
          type: "string",
          enum: ["01", "03"],
          description: "Type of referenced document: 01 = Factura, 03 = Boleta",
        },
        reason_code: {
          type: "string",
          enum: ["01", "02", "03", "04", "05", "06"],
          description: "Reason: 01=Anulación, 02=Corrección por error, 03=Descuento, 04=Devolución, 05=Bonificación, 06=Otros",
        },
        reason: { type: "string", description: "Description of why the credit note is issued" },
        customer_tax_id: { type: "string", description: "Customer RUC or DNI" },
        customer_tax_id_type: { type: "string", enum: ["RUC", "DNI", "CE"] },
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
            },
            required: ["description", "quantity", "unit_price"],
          },
          description: "Items being credited",
        },
        currency: { type: "string", enum: ["PEN", "USD"], description: "Currency (default: PEN)" },
      },
      required: ["reference_document", "reference_type", "reason_code", "reason", "customer_tax_id", "customer_tax_id_type", "customer_name", "items"],
    },
  },
  {
    name: "create_debit_note",
    description:
      "Issue a debit note (nota de débito) against an existing factura or boleta. Used for: interest (01), penalties (02), or price increases (03).",
    inputSchema: {
      type: "object" as const,
      properties: {
        reference_document: { type: "string", description: "Original document ID (e.g., F001-00000001)" },
        reference_type: {
          type: "string",
          enum: ["01", "03"],
          description: "Type of referenced document: 01 = Factura, 03 = Boleta",
        },
        reason_code: {
          type: "string",
          enum: ["01", "02", "03"],
          description: "Reason: 01=Intereses por mora, 02=Penalidades, 03=Aumento en el valor",
        },
        reason: { type: "string", description: "Description of why the debit note is issued" },
        customer_tax_id: { type: "string", description: "Customer RUC or DNI" },
        customer_tax_id_type: { type: "string", enum: ["RUC", "DNI", "CE"] },
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
            },
            required: ["description", "quantity", "unit_price"],
          },
          description: "Items being debited",
        },
        currency: { type: "string", enum: ["PEN", "USD"], description: "Currency (default: PEN)" },
      },
      required: ["reference_document", "reference_type", "reason_code", "reason", "customer_tax_id", "customer_tax_id_type", "customer_name", "items"],
    },
  },
  {
    name: "void_invoice",
    description:
      "Submit a comunicación de baja to void/annul an invoice. Must be done within 7 days of issuance. For facturas, submits directly. For boletas, included in resumen diario.",
    inputSchema: {
      type: "object" as const,
      properties: {
        document_id: { type: "string", description: "Document ID to void (e.g., F001-00000001)" },
        document_type: {
          type: "string",
          enum: ["01", "03"],
          description: "Document type: 01 = Factura, 03 = Boleta",
        },
        reason: { type: "string", description: "Reason for voiding the invoice" },
      },
      required: ["document_id", "document_type", "reason"],
    },
  },
  {
    name: "get_daily_summary",
    description:
      "Generate and submit a resumen diario for boletas issued on a given date. Boletas are batched and sent to SUNAT in a daily summary rather than individually. Returns a ticket number to check status.",
    inputSchema: {
      type: "object" as const,
      properties: {
        date: {
          type: "string",
          description: "Date for the summary in ISO format (e.g., 2025-01-15). Must be submitted by next business day.",
        },
      },
      required: ["date"],
    },
  },
  {
    name: "lookup_ruc",
    description:
      "Validate a RUC number and get business information from SUNAT: razón social, nombre comercial, dirección fiscal, estado del contribuyente, and régimen tributario. Use before issuing a factura.",
    inputSchema: {
      type: "object" as const,
      properties: {
        ruc: { type: "string", description: "RUC number (11 digits)" },
      },
      required: ["ruc"],
    },
  },
  {
    name: "lookup_dni",
    description:
      "Validate a DNI number and get the person's full name from RENIEC. Use before issuing a boleta to an identified consumer.",
    inputSchema: {
      type: "object" as const,
      properties: {
        dni: { type: "string", description: "DNI number (8 digits)" },
      },
      required: ["dni"],
    },
  },
  {
    name: "get_invoice_status",
    description:
      "Check the status of a submitted invoice or ticket (for resumen diario / comunicación de baja). Returns CDR status from SUNAT.",
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
      "List issued invoices with optional filters. Returns document ID, type, customer, total, date, and SUNAT status.",
    inputSchema: {
      type: "object" as const,
      properties: {
        from_date: { type: "string", description: "Start date filter, ISO format (optional)" },
        to_date: { type: "string", description: "End date filter, ISO format (optional)" },
        document_type: {
          type: "string",
          enum: ["01", "03", "07", "08"],
          description: "Filter by document type (optional)",
        },
        status: {
          type: "string",
          enum: ["accepted", "rejected", "pending", "voided"],
          description: "Filter by SUNAT status (optional)",
        },
        customer_tax_id: { type: "string", description: "Filter by customer RUC/DNI (optional)" },
        limit: { type: "number", description: "Max results (default 20)" },
      },
      required: [],
    },
  },
  {
    name: "get_tax_obligations",
    description:
      "For a given business tax regime (NRUS, RER, RMT, RG), return all obligations: what to declare, when, which forms to use, and what books to keep. Useful for onboarding and compliance reminders.",
    inputSchema: {
      type: "object" as const,
      properties: {
        regime: {
          type: "string",
          enum: ["NRUS", "RER", "RMT", "RG"],
          description: "Tax regime: NRUS, RER, RMT (Régimen MYPE Tributario), or RG (Régimen General)",
        },
      },
      required: ["regime"],
    },
  },
  {
    name: "calculate_tax",
    description:
      "Given a tax regime and monthly revenue/purchases, calculate IGV payable and renta (income tax) owed. Returns breakdown with crédito fiscal, rates applied, and total monthly obligation.",
    inputSchema: {
      type: "object" as const,
      properties: {
        regime: {
          type: "string",
          enum: ["NRUS", "RER", "RMT", "RG"],
          description: "Tax regime",
        },
        monthly_revenue: {
          type: "number",
          description: "Monthly sales revenue (base imponible, before IGV) in PEN",
        },
        monthly_purchases: {
          type: "number",
          description: "Monthly purchases (base imponible, before IGV) in PEN",
        },
        annual_revenue: {
          type: "number",
          description: "Estimated annual revenue in PEN (optional, used for RMT rate determination). If omitted, monthly × 12.",
        },
      },
      required: ["regime", "monthly_revenue", "monthly_purchases"],
    },
  },
];

// ── Tool Handlers ────────────────────────────────────────

async function handleTool(name: string, args: Record<string, any>): Promise<string> {
  const adapter = getAdapter();

  switch (name) {
    case "create_invoice": {
      const data: InvoiceData = {
        document_type: args.document_type,
        currency: args.currency || "PEN",
        exchange_rate: args.exchange_rate,
        due_date: args.due_date,
        notes: args.notes,
        purchase_order: args.purchase_order,
        payment_terms: args.payment_terms,
        customer: {
          tax_id: args.customer_tax_id,
          tax_id_type: args.customer_tax_id_type,
          legal_name: args.customer_name,
          address: args.customer_address ? { street: args.customer_address, city: "", state: "", country: "PE" } : undefined,
          email: args.customer_email,
        },
        items: (args.items || []).map((item: any) => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          unit_code: item.unit_code || "NIU",
          tax_type: item.tax_type || "IGV",
          item_code: item.item_code,
        })),
      };

      // Validate: factura requires RUC, boleta requires DNI or can be anonymous
      if (args.document_type === "01" && args.customer_tax_id_type !== "RUC") {
        throw new Error("Factura (01) requires customer with RUC. Use boleta (03) for DNI/anonymous customers.");
      }

      const result = await adapter.createInvoice(data);
      return JSON.stringify(result, null, 2);
    }

    case "create_credit_note": {
      const data: CreditNoteData = {
        reference_document: args.reference_document,
        reference_type: args.reference_type,
        reason_code: args.reason_code,
        reason: args.reason,
        currency: args.currency || "PEN",
        customer: {
          tax_id: args.customer_tax_id,
          tax_id_type: args.customer_tax_id_type,
          legal_name: args.customer_name,
        },
        items: (args.items || []).map((item: any) => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          unit_code: item.unit_code || "NIU",
        })),
      };
      const result = await adapter.createCreditNote(data);
      return JSON.stringify(result, null, 2);
    }

    case "create_debit_note": {
      const data: DebitNoteData = {
        reference_document: args.reference_document,
        reference_type: args.reference_type,
        reason_code: args.reason_code,
        reason: args.reason,
        currency: args.currency || "PEN",
        customer: {
          tax_id: args.customer_tax_id,
          tax_id_type: args.customer_tax_id_type,
          legal_name: args.customer_name,
        },
        items: (args.items || []).map((item: any) => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          unit_code: item.unit_code || "NIU",
        })),
      };
      const result = await adapter.createDebitNote(data);
      return JSON.stringify(result, null, 2);
    }

    case "void_invoice": {
      const result = await adapter.voidInvoice({
        document_id: args.document_id,
        document_type: args.document_type,
        reason: args.reason,
      });
      return JSON.stringify(result, null, 2);
    }

    case "get_daily_summary": {
      const result = await adapter.getDailySummary(args.date);
      return JSON.stringify(result, null, 2);
    }

    case "lookup_ruc": {
      const result = await adapter.validateTaxId(args.ruc);
      return JSON.stringify(result, null, 2);
    }

    case "lookup_dni": {
      const result = await adapter.lookupDni(args.dni);
      return JSON.stringify(result, null, 2);
    }

    case "get_invoice_status": {
      const result = await pseFetch(`/status/${args.document_id}`);
      return JSON.stringify(result, null, 2);
    }

    case "list_invoices": {
      const params = new URLSearchParams();
      if (args.from_date) params.set("from", args.from_date);
      if (args.to_date) params.set("to", args.to_date);
      if (args.document_type) params.set("type", args.document_type);
      if (args.status) params.set("status", args.status);
      if (args.customer_tax_id) params.set("customer", args.customer_tax_id);
      params.set("limit", String(args.limit || 20));

      const result = await pseFetch(`/invoices?${params.toString()}`);
      return JSON.stringify(result, null, 2);
    }

    case "get_tax_obligations": {
      const obligations = adapter.getTaxObligations(args.regime);
      return JSON.stringify({
        country: adapter.countryCode,
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

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ── MCP Server Setup ─────────────────────────────────────

const server = new Server(
  { name: "invoicing-mcp", version: "0.1.0" },
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
  console.error(`Invoicing MCP server running on stdio (country: ${INVOICE_COUNTRY}, env: ${INVOICE_ENVIRONMENT})`);
}

main().catch(console.error);
