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
} from './types.js';

// IGV calculation
export {
  IGV_RATE,
  igvFromBase,
  igvFromTotal,
  buildItem,
  buildItemFromTotal,
  sumItems,
} from './igv.js';

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
} from './validator.js';

// XML generation
export {
  generateInvoiceXml,
  generateCreditNoteXml,
} from './xml-generator.js';

// Nubefact API client
export {
  sendInvoice,
  sendCreditNote,
  sendDebitNote,
  isServiceAvailable,
} from './nubefact.js';
