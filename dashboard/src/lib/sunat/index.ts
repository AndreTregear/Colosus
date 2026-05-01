/**
 * SUNAT Electronic Invoicing — Peru
 * Barrel export for the sunat integration module.
 */

// Types
export type {
  SunatDocumentType,
  CurrencyCode,
  IdentityDocType,
  Supplier,
  Customer,
  InvoiceItem,
  SunatInvoice,
  SunatCreditNote,
  SunatDebitNote,
  NubefactConfig,
  NubefactRequest,
  NubefactItem,
  NubefactResponse,
  SerieTracker,
  IgvBreakdown,
} from './types';

// IGV calculation
export {
  IGV_RATE,
  igvFromBase,
  igvFromTotal,
  buildItem,
  buildItemFromTotal,
  sumItems,
} from './igv';

// Validation
export {
  validateRuc,
  validateDni,
  validateIdentityDoc,
  validateSerie,
  validateNumero,
  formatDocumentId,
  validateInvoice,
  isBusinessRuc,
  isPersonaNaturalRuc,
} from './validator';

// XML generation
export {
  generateInvoiceXml,
  generateCreditNoteXml,
} from './xml-generator';

// Nubefact API client
export {
  sendInvoice,
  sendCreditNote,
  sendDebitNote,
  isServiceAvailable,
} from './nubefact';
