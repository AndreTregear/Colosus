/**
 * Abstract base adapter interface for country-specific invoicing providers.
 * Each country implements this interface with its own provider integration.
 */

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

export interface CountryAdapter {
  /** ISO 3166-1 alpha-2 country code */
  readonly countryCode: string;
  /** Human-readable country name */
  readonly countryName: string;
  /** ISO 4217 default currency code */
  readonly currency: string;
  /** Provider name (e.g., "APISUNAT", "Facturapi", "MATIAS") */
  readonly providerName: string;

  // ── Document Operations ──────────────────────────────

  /** Create and submit an invoice or receipt */
  createInvoice(data: InvoiceData): Promise<InvoiceResult>;

  /** Issue a credit note against an existing document */
  createCreditNote(data: InvoiceData): Promise<InvoiceResult>;

  /** Issue a debit note against an existing document */
  createDebitNote(data: InvoiceData): Promise<InvoiceResult>;

  /** Void/annul an existing document */
  voidInvoice(documentId: string, documentType: string, reason: string): Promise<VoidResult>;

  /** Generate daily summary (boleta batch for Peru, may be no-op for other countries) */
  getDailySummary(date: string): Promise<DailySummaryResult>;

  // ── Lookups ──────────────────────────────────────────

  /** Validate a tax ID (RUC, RFC, NIT, RUC-PA) and get entity info */
  lookupTaxId(taxId: string): Promise<TaxIdInfo>;

  /** Get invoice status by ID */
  getInvoiceStatus(documentId: string): Promise<InvoiceStatusResult>;

  /** List invoices with filters */
  listInvoices(params: InvoiceListParams): Promise<InvoiceListResult>;

  // ── Tax Metadata ─────────────────────────────────────

  /** Get tax obligations for a business regime */
  getTaxObligations(regime: string): TaxObligation[];

  /** Calculate tax for given revenue/purchases */
  calculateTax(params: TaxCalculationParams): TaxCalculationResult;

  /** Get supported document types for this country */
  getDocumentTypes(): DocumentTypeInfo[];

  /** Get tax rates for this country */
  getTaxRates(): TaxRateInfo[];

  // ── Health ───────────────────────────────────────────

  /** Check provider connectivity and authentication */
  healthCheck(): Promise<HealthCheckResult>;
}
