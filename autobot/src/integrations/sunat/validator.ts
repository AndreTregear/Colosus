/**
 * SUNAT Validation — RUC, DNI, serie/numero, document structure
 *
 * All validation is deterministic and never touches a network.
 */

import type { SunatDocumentType, SunatInvoice } from './types.js';

// ── RUC Validation ──

/**
 * RUC (Registro Unico de Contribuyentes) — 11-digit tax ID.
 *
 * Structure: PP-NNNNNNNN-V
 *   PP = prefix: 10 (persona natural), 15 (persona natural sin negocio),
 *                17 (persona natural no domiciliada), 20 (persona juridica)
 *   NNNNNNNN = 8 digits
 *   V = check digit (mod 11 weighted)
 *
 * Weights (right to left, skipping check digit): 5, 4, 3, 2, 7, 6, 5, 4, 3, 2
 */
const RUC_WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
const VALID_RUC_PREFIXES = ['10', '15', '17', '20'];

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateRuc(ruc: string): ValidationResult {
  if (!/^\d{11}$/.test(ruc)) {
    return { valid: false, error: 'RUC must be exactly 11 digits' };
  }

  const prefix = ruc.substring(0, 2);
  if (!VALID_RUC_PREFIXES.includes(prefix)) {
    return { valid: false, error: `Invalid RUC prefix: ${prefix}. Expected one of: ${VALID_RUC_PREFIXES.join(', ')}` };
  }

  // Mod-11 check digit validation
  const digits = ruc.split('').map(Number);
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += digits[i] * RUC_WEIGHTS[i];
  }
  const remainder = sum % 11;
  const expected = remainder < 2 ? remainder : 11 - remainder;
  if (digits[10] !== expected) {
    return { valid: false, error: 'Invalid RUC check digit' };
  }

  return { valid: true };
}

/**
 * Check if RUC belongs to a business entity (persona juridica — prefix 20).
 */
export function isBusinessRuc(ruc: string): boolean {
  return ruc.startsWith('20');
}

/**
 * Check if RUC belongs to a natural person (prefix 10).
 */
export function isPersonaNaturalRuc(ruc: string): boolean {
  return ruc.startsWith('10');
}

// ── DNI Validation ──

export function validateDni(dni: string): ValidationResult {
  if (!/^\d{8}$/.test(dni)) {
    return { valid: false, error: 'DNI must be exactly 8 digits' };
  }
  return { valid: true };
}

// ── Identity Document Validation ──

export function validateIdentityDoc(tipo: string, numero: string): ValidationResult {
  switch (tipo) {
    case '6': // RUC
      return validateRuc(numero);
    case '1': // DNI
      return validateDni(numero);
    case '0': // Sin documento
      if (numero !== '0' && numero !== '-' && numero !== '') {
        return { valid: false, error: 'Sin documento should use "0", "-", or empty number' };
      }
      return { valid: true };
    case '4': // Carnet extranjeria
      if (numero.length < 5 || numero.length > 12) {
        return { valid: false, error: 'Carnet de extranjeria must be 5-12 characters' };
      }
      return { valid: true };
    case '7': // Pasaporte
      if (numero.length < 5 || numero.length > 12) {
        return { valid: false, error: 'Passport number must be 5-12 characters' };
      }
      return { valid: true };
    default:
      return { valid: false, error: `Unknown document type: ${tipo}` };
  }
}

// ── Serie/Numero Validation ──

/**
 * Validate serie format based on document type.
 *   Factura: F followed by 3 digits (F001, F002, etc.)
 *   Boleta:  B followed by 3 digits (B001, B002, etc.)
 *   NC ref factura: FC followed by 2 digits
 *   NC ref boleta:  BC followed by 2 digits
 *   ND ref factura: FD followed by 2 digits
 *   ND ref boleta:  BD followed by 2 digits
 */
export function validateSerie(serie: string, tipoDocumento: SunatDocumentType): ValidationResult {
  const patterns: Record<SunatDocumentType, RegExp> = {
    '01': /^F\d{3}$/,                    // Factura
    '03': /^B\d{3}$/,                    // Boleta
    '07': /^(FC|BC)\d{2}$/,             // Nota de credito
    '08': /^(FD|BD)\d{2}$/,             // Nota de debito
  };

  const pattern = patterns[tipoDocumento];
  if (!pattern) {
    return { valid: false, error: `Unknown document type: ${tipoDocumento}` };
  }

  if (!pattern.test(serie)) {
    return { valid: false, error: `Invalid serie "${serie}" for document type ${tipoDocumento}` };
  }

  return { valid: true };
}

export function validateNumero(numero: number): ValidationResult {
  if (!Number.isInteger(numero) || numero < 1 || numero > 99999999) {
    return { valid: false, error: 'Numero must be an integer between 1 and 99999999' };
  }
  return { valid: true };
}

/**
 * Format serie-numero as the standard SUNAT ID.
 * e.g., "F001", 1 → "F001-00000001"
 */
export function formatDocumentId(serie: string, numero: number): string {
  return `${serie}-${String(numero).padStart(8, '0')}`;
}

// ── Document-Level Validation ──

/**
 * Validate a complete invoice structure before submission.
 * Returns all errors found (not just the first).
 */
export function validateInvoice(invoice: SunatInvoice): ValidationResult[] {
  const errors: ValidationResult[] = [];

  // Document type
  if (invoice.tipoDocumento !== '01' && invoice.tipoDocumento !== '03') {
    errors.push({ valid: false, error: `Invoice tipoDocumento must be "01" (factura) or "03" (boleta), got "${invoice.tipoDocumento}"` });
  }

  // Serie
  const serieResult = validateSerie(invoice.serie, invoice.tipoDocumento);
  if (!serieResult.valid) errors.push(serieResult);

  // Numero
  const numResult = validateNumero(invoice.numero);
  if (!numResult.valid) errors.push(numResult);

  // Date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(invoice.fechaEmision)) {
    errors.push({ valid: false, error: 'fechaEmision must be YYYY-MM-DD format' });
  }

  // Currency
  if (invoice.moneda !== 'PEN' && invoice.moneda !== 'USD') {
    errors.push({ valid: false, error: `moneda must be "PEN" or "USD", got "${invoice.moneda}"` });
  }

  // Emisor RUC
  const rucResult = validateRuc(invoice.emisor.ruc);
  if (!rucResult.valid) errors.push({ valid: false, error: `Emisor RUC: ${rucResult.error}` });

  // Receptor document
  const receptorResult = validateIdentityDoc(invoice.receptor.tipoDocumento, invoice.receptor.numDocumento);
  if (!receptorResult.valid) errors.push({ valid: false, error: `Receptor: ${receptorResult.error}` });

  // Factura requires RUC as receptor
  if (invoice.tipoDocumento === '01' && invoice.receptor.tipoDocumento !== '6') {
    errors.push({ valid: false, error: 'Factura requires receptor with RUC (tipoDocumento "6")' });
  }

  // Items
  if (!invoice.items || invoice.items.length === 0) {
    errors.push({ valid: false, error: 'Invoice must have at least one item' });
  }

  for (let i = 0; i < (invoice.items?.length ?? 0); i++) {
    const item = invoice.items[i];
    if (item.cantidad <= 0) {
      errors.push({ valid: false, error: `Item ${i + 1}: cantidad must be > 0` });
    }
    if (item.valorUnitario < 0) {
      errors.push({ valid: false, error: `Item ${i + 1}: valorUnitario must be >= 0` });
    }
    if (!item.descripcion || item.descripcion.trim().length === 0) {
      errors.push({ valid: false, error: `Item ${i + 1}: descripcion is required` });
    }
  }

  // Totals consistency check (centimo-level tolerance)
  const expectedGravado = invoice.items?.reduce((s, i) => s + i.subtotal, 0) ?? 0;
  const expectedIgv = invoice.items?.reduce((s, i) => s + i.igv, 0) ?? 0;
  const expectedTotal = invoice.items?.reduce((s, i) => s + i.total, 0) ?? 0;

  if (Math.abs(invoice.totalGravado - expectedGravado) > 0.02) {
    errors.push({ valid: false, error: `totalGravado (${invoice.totalGravado}) does not match sum of item subtotals (${expectedGravado})` });
  }
  if (Math.abs(invoice.totalIgv - expectedIgv) > 0.02) {
    errors.push({ valid: false, error: `totalIgv (${invoice.totalIgv}) does not match sum of item IGV (${expectedIgv})` });
  }
  if (Math.abs(invoice.totalVenta - expectedTotal) > 0.02) {
    errors.push({ valid: false, error: `totalVenta (${invoice.totalVenta}) does not match sum of item totals (${expectedTotal})` });
  }

  return errors;
}
