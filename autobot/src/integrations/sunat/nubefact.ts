/**
 * Nubefact API Client — SUNAT electronic invoicing via Nubefact PSE
 * https://www.nubefact.com/documentacion
 *
 * Nubefact handles digital signing, SUNAT submission, and CDR retrieval.
 * We build the request payload; Nubefact does the rest.
 */

import { logger } from '../../shared/logger.js';
import type {
  SunatInvoice,
  SunatCreditNote,
  SunatDebitNote,
  NubefactConfig,
  NubefactRequest,
  NubefactItem,
  NubefactResponse,
  InvoiceItem,
  CurrencyCode,
  SunatDocumentType,
  IdentityDocType,
} from './types.js';
import { validateInvoice } from './validator.js';

const TIMEOUT_MS = 15_000;

// ── Nubefact Mappings ──

/** Map SUNAT doc type to Nubefact numeric type */
const NUBEFACT_DOC_TYPE: Record<SunatDocumentType, number> = {
  '01': 1,  // Factura
  '03': 2,  // Boleta
  '07': 3,  // Nota de crédito
  '08': 4,  // Nota de débito
};

/** Map currency to Nubefact code */
const NUBEFACT_CURRENCY: Record<CurrencyCode, number> = {
  PEN: 1,
  USD: 2,
};

/** Map identity doc type to Nubefact code */
const NUBEFACT_IDENTITY_DOC: Record<IdentityDocType, string> = {
  '0': '0',
  '1': '1',
  '4': '4',
  '6': '6',
  '7': '7',
  'A': 'A',
};

// ── API Client ──

/**
 * Send an invoice to Nubefact for SUNAT processing.
 * Returns the Nubefact response with PDF/XML links and SUNAT acceptance status.
 */
export async function sendInvoice(
  config: NubefactConfig,
  invoice: SunatInvoice,
): Promise<NubefactResponse> {
  // Validate before sending
  const validationErrors = validateInvoice(invoice);
  if (validationErrors.length > 0) {
    const msgs = validationErrors.map(e => e.error).filter(Boolean);
    throw new Error(`Invoice validation failed: ${msgs.join('; ')}`);
  }

  const payload = buildNubefactRequest(invoice);
  return nubefactFetch(config, payload);
}

/**
 * Send a credit note to Nubefact.
 */
export async function sendCreditNote(
  config: NubefactConfig,
  note: SunatCreditNote,
): Promise<NubefactResponse> {
  const payload = buildCreditNoteRequest(note);
  return nubefactFetch(config, payload);
}

/**
 * Send a debit note to Nubefact.
 */
export async function sendDebitNote(
  config: NubefactConfig,
  note: SunatDebitNote,
): Promise<NubefactResponse> {
  const payload = buildDebitNoteRequest(note);
  return nubefactFetch(config, payload);
}

/**
 * Check Nubefact API availability.
 */
export async function isServiceAvailable(config: NubefactConfig): Promise<boolean> {
  try {
    const res = await fetch(config.apiUrl, {
      method: 'HEAD',
      signal: AbortSignal.timeout(3_000),
    });
    return res.status !== 0;
  } catch {
    return false;
  }
}

// ── Request Builders ──

function buildNubefactRequest(invoice: SunatInvoice): NubefactRequest {
  return {
    operacion: 'generar_comprobante',
    tipo_de_comprobante: NUBEFACT_DOC_TYPE[invoice.tipoDocumento],
    serie: invoice.serie,
    numero: invoice.numero,
    sunat_transaction: 1, // Venta interna
    cliente_tipo_de_documento: NUBEFACT_IDENTITY_DOC[invoice.receptor.tipoDocumento],
    cliente_numero_de_documento: invoice.receptor.numDocumento,
    cliente_denominacion: invoice.receptor.razonSocial,
    cliente_direccion: invoice.receptor.direccion || '',
    cliente_email: '',
    cliente_email_1: '',
    cliente_email_2: '',
    fecha_de_emision: formatDateNubefact(invoice.fechaEmision),
    fecha_de_vencimiento: '',
    moneda: NUBEFACT_CURRENCY[invoice.moneda],
    tipo_de_cambio: '',
    porcentaje_de_igv: 18.00,
    descuento_global: '',
    total_descuento: '',
    total_anticipo: '',
    total_gravada: invoice.totalGravado,
    total_inafecta: '',
    total_exonerada: '',
    total_igv: invoice.totalIgv,
    total_gratuita: '',
    total_otros_cargos: '',
    total: invoice.totalVenta,
    percepcion_tipo: '',
    percepcion_base_imponible: '',
    total_percepcion: '',
    detraccion: false,
    observaciones: invoice.observaciones || '',
    documento_que_se_modifica_tipo: 0,
    documento_que_se_modifica_serie: '',
    documento_que_se_modifica_numero: '',
    tipo_de_nota_de_credito: 0,
    tipo_de_nota_de_debito: 0,
    enviar_automaticamente_a_la_sunat: true,
    enviar_automaticamente_al_cliente: false,
    codigo_unico: '',
    condicion_de_pago: invoice.formaPago || 'Contado',
    medio_de_pago: '',
    placa_vehiculo: '',
    orden_compra_servicio: invoice.ordenCompra || '',
    tabla_personalizada_codigo: '',
    formato_de_pdf: '',
    items: invoice.items.map(mapItemToNubefact),
  };
}

function buildCreditNoteRequest(note: SunatCreditNote): NubefactRequest {
  return {
    operacion: 'generar_comprobante',
    tipo_de_comprobante: NUBEFACT_DOC_TYPE['07'],
    serie: note.serie,
    numero: note.numero,
    sunat_transaction: 1,
    cliente_tipo_de_documento: NUBEFACT_IDENTITY_DOC[note.receptor.tipoDocumento],
    cliente_numero_de_documento: note.receptor.numDocumento,
    cliente_denominacion: note.receptor.razonSocial,
    cliente_direccion: note.receptor.direccion || '',
    cliente_email: '',
    cliente_email_1: '',
    cliente_email_2: '',
    fecha_de_emision: formatDateNubefact(note.fechaEmision),
    fecha_de_vencimiento: '',
    moneda: NUBEFACT_CURRENCY[note.moneda],
    tipo_de_cambio: '',
    porcentaje_de_igv: 18.00,
    descuento_global: '',
    total_descuento: '',
    total_anticipo: '',
    total_gravada: note.totalGravado,
    total_inafecta: '',
    total_exonerada: '',
    total_igv: note.totalIgv,
    total_gratuita: '',
    total_otros_cargos: '',
    total: note.totalVenta,
    percepcion_tipo: '',
    percepcion_base_imponible: '',
    total_percepcion: '',
    detraccion: false,
    observaciones: note.motivoAnulacion,
    documento_que_se_modifica_tipo: NUBEFACT_DOC_TYPE[note.tipoDocumentoRef],
    documento_que_se_modifica_serie: note.serieRef,
    documento_que_se_modifica_numero: String(note.numeroRef),
    tipo_de_nota_de_credito: Number(note.codigoMotivo),
    tipo_de_nota_de_debito: 0,
    enviar_automaticamente_a_la_sunat: true,
    enviar_automaticamente_al_cliente: false,
    codigo_unico: '',
    condicion_de_pago: '',
    medio_de_pago: '',
    placa_vehiculo: '',
    orden_compra_servicio: '',
    tabla_personalizada_codigo: '',
    formato_de_pdf: '',
    items: note.items.map(mapItemToNubefact),
  };
}

function buildDebitNoteRequest(note: SunatDebitNote): NubefactRequest {
  return {
    operacion: 'generar_comprobante',
    tipo_de_comprobante: NUBEFACT_DOC_TYPE['08'],
    serie: note.serie,
    numero: note.numero,
    sunat_transaction: 1,
    cliente_tipo_de_documento: NUBEFACT_IDENTITY_DOC[note.receptor.tipoDocumento],
    cliente_numero_de_documento: note.receptor.numDocumento,
    cliente_denominacion: note.receptor.razonSocial,
    cliente_direccion: note.receptor.direccion || '',
    cliente_email: '',
    cliente_email_1: '',
    cliente_email_2: '',
    fecha_de_emision: formatDateNubefact(note.fechaEmision),
    fecha_de_vencimiento: '',
    moneda: NUBEFACT_CURRENCY[note.moneda],
    tipo_de_cambio: '',
    porcentaje_de_igv: 18.00,
    descuento_global: '',
    total_descuento: '',
    total_anticipo: '',
    total_gravada: note.totalGravado,
    total_inafecta: '',
    total_exonerada: '',
    total_igv: note.totalIgv,
    total_gratuita: '',
    total_otros_cargos: '',
    total: note.totalVenta,
    percepcion_tipo: '',
    percepcion_base_imponible: '',
    total_percepcion: '',
    detraccion: false,
    observaciones: note.motivoDebito,
    documento_que_se_modifica_tipo: NUBEFACT_DOC_TYPE[note.tipoDocumentoRef],
    documento_que_se_modifica_serie: note.serieRef,
    documento_que_se_modifica_numero: String(note.numeroRef),
    tipo_de_nota_de_credito: 0,
    tipo_de_nota_de_debito: Number(note.codigoMotivo),
    enviar_automaticamente_a_la_sunat: true,
    enviar_automaticamente_al_cliente: false,
    codigo_unico: '',
    condicion_de_pago: '',
    medio_de_pago: '',
    placa_vehiculo: '',
    orden_compra_servicio: '',
    tabla_personalizada_codigo: '',
    formato_de_pdf: '',
    items: note.items.map(mapItemToNubefact),
  };
}

function mapItemToNubefact(item: InvoiceItem): NubefactItem {
  return {
    unidad_de_medida: item.unidad,
    codigo: '',
    descripcion: item.descripcion,
    cantidad: item.cantidad,
    valor_unitario: item.valorUnitario,
    precio_unitario: item.precioUnitario,
    descuento: 0,
    subtotal: item.subtotal,
    tipo_de_igv: 1, // Gravado — Operación Onerosa
    igv: item.igv,
    total: item.total,
    anticipo_regularizacion: false,
    anticipo_documento_serie: '',
    anticipo_documento_numero: '',
  };
}

// ── HTTP Layer ──

async function nubefactFetch(
  config: NubefactConfig,
  payload: NubefactRequest,
): Promise<NubefactResponse> {
  const url = config.apiUrl;

  logger.info({
    tipo: payload.tipo_de_comprobante,
    serie: payload.serie,
    numero: payload.numero,
  }, 'Sending document to Nubefact');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Token token="${config.apiToken}"`,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  const body = await res.json() as NubefactResponse;

  if (!res.ok || body.errors) {
    logger.error({
      status: res.status,
      errors: body.errors,
      sunat_description: body.sunat_description,
    }, 'Nubefact API error');
    throw new Error(`Nubefact error: ${body.errors || body.sunat_description || `HTTP ${res.status}`}`);
  }

  logger.info({
    serie: body.serie,
    numero: body.numero,
    aceptada: body.aceptada_por_sunat,
    hash: body.codigo_hash,
  }, 'Nubefact response received');

  return body;
}

// ── Helpers ──

/** Convert YYYY-MM-DD to DD-MM-YYYY (Nubefact format) */
function formatDateNubefact(isoDate: string): string {
  const [y, m, d] = isoDate.split('-');
  return `${d}-${m}-${y}`;
}
