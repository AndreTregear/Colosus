/**
 * Shared types for the multi-country invoicing MCP server.
 * All types are universal — they work for any country adapter.
 */

// ── Document Types ───────────────────────────────────────

export type DocumentType = "invoice" | "receipt" | "credit_note" | "debit_note";

export type InvoiceStatus = "accepted" | "rejected" | "pending";

// ── Address ──────────────────────────────────────────────

export interface Address {
  street: string;
  district?: string;
  city: string;
  state: string;
  country: string;
  postal_code?: string;
  /** Peru: 6-digit UBIGEO code */
  ubigeo?: string;
}

// ── Customer ─────────────────────────────────────────────

export interface CustomerData {
  tax_id: string;
  /** Country-specific doc type: RUC, DNI, CE, RFC, NIT, RUC-PA, etc. */
  doc_type: string;
  name: string;
  address?: Address;
  email?: string;
  /** Mexico: tax_system (régimen fiscal del receptor) */
  tax_system?: string;
}

// ── Line Items ───────────────────────────────────────────

export interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  /** Tax rate as decimal (0.18 for 18%, 0.16 for 16%, etc.) */
  tax_rate: number;
  /** UN/ECE unit code: NIU (units), ZZ (service), KGM (kg), HUR (hour) */
  unit_code: string;
  /** Internal item/product code */
  item_code?: string;
  /** Tax type label (IGV, IVA, ITBMS, EXO, INA, GRA) */
  tax_type?: string;
  /** Per-unit discount amount */
  discount?: number;
}

// ── Invoice Data (input) ─────────────────────────────────

export interface InvoiceData {
  document_type: DocumentType;
  customer: CustomerData;
  items: LineItem[];
  currency: string;
  payment_method?: string;
  notes?: string;
  series?: string;
  issue_date?: string;
  due_date?: string;
  exchange_rate?: number;
  purchase_order?: string;
  /** Credit/debit note: reference to original document */
  reference_document?: string;
  /** Credit/debit note: type of referenced document */
  reference_document_type?: string;
  /** Credit/debit note: reason code */
  reason_code?: string;
  /** Credit/debit note: reason description */
  reason?: string;
  /** Mexico: CFDI use code (e.g., G03 = gastos en general) */
  cfdi_use?: string;
  /** Mexico: payment form code */
  payment_form?: string;
}

// ── Invoice Result (output) ──────────────────────────────

export interface InvoiceResult {
  /** Provider's internal document ID */
  id: string;
  /** Document number (e.g., F001-00000123, AAA-000001) */
  number: string;
  /** XML hash / CUFE / UUID depending on country */
  hash: string;
  status: InvoiceStatus;
  /** Tax authority response message */
  tax_authority_response: string;
  pdf_url: string;
  xml_url: string;
  /** Raw response from the provider API */
  raw_response: any;
}

// ── Void Result ──────────────────────────────────────────

export interface VoidResult {
  id: string;
  status: InvoiceStatus;
  tax_authority_response: string;
  /** Ticket number for async void operations (Peru resumen/baja) */
  ticket?: string;
  raw_response: any;
}

// ── Tax ID Validation ────────────────────────────────────

export interface TaxIdInfo {
  valid: boolean;
  tax_id: string;
  name?: string;
  trade_name?: string;
  state?: string;
  address?: string;
  regime?: string;
  /** Country-specific doc type validated (RUC, RFC, NIT, etc.) */
  doc_type?: string;
}

// ── Tax Obligations ──────────────────────────────────────

export interface TaxObligation {
  obligation: string;
  frequency: string;
  form?: string;
  description: string;
}

// ── Tax Calculation ──────────────────────────────────────

export interface TaxCalculationParams {
  regime: string;
  monthly_revenue: number;
  monthly_purchases: number;
  annual_revenue?: number;
}

export interface TaxCalculationResult {
  regime: string;
  tax_on_sales: number;
  tax_on_purchases: number;
  tax_payable: number;
  income_tax_monthly: number;
  total_monthly: number;
  breakdown: Record<string, unknown>;
}

// ── Country Metadata ─────────────────────────────────────

export interface DocumentTypeInfo {
  code: string;
  name: string;
  description: string;
  maps_to: DocumentType;
}

export interface TaxRateInfo {
  tax_type: string;
  rate: number;
  description: string;
}

// ── List / Status ────────────────────────────────────────

export interface InvoiceStatusResult {
  id: string;
  number: string;
  status: InvoiceStatus;
  tax_authority_response: string;
  raw_response: any;
}

export interface InvoiceListParams {
  from_date?: string;
  to_date?: string;
  document_type?: string;
  status?: string;
  customer_tax_id?: string;
  limit?: number;
}

export interface InvoiceListResult {
  invoices: Array<{
    id: string;
    number: string;
    document_type: string;
    customer_name: string;
    customer_tax_id: string;
    total: number;
    currency: string;
    issue_date: string;
    status: InvoiceStatus;
  }>;
  total_count: number;
}

// ── Daily Summary (Peru-specific but generalized) ────────

export interface DailySummaryResult {
  id: string;
  ticket: string;
  status: InvoiceStatus;
  tax_authority_response: string;
  raw_response: any;
}

// ── Health Check ─────────────────────────────────────────

export interface HealthCheckResult {
  country: string;
  provider: string;
  environment: string;
  authenticated: boolean;
  message: string;
}
