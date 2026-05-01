/**
 * SUNAT Electronic Invoicing Types
 * Comprobantes de Pago Electronicos (CPE) — Peru
 */

// ── Document Types ──

/** SUNAT document type codes */
export type SunatDocumentType =
  | '01'  // Factura
  | '03'  // Boleta de Venta
  | '07'  // Nota de Credito
  | '08'; // Nota de Debito

/** Supported currency codes */
export type CurrencyCode = 'PEN' | 'USD';

/** Customer identity document types */
export type IdentityDocType =
  | '0'   // Sin documento
  | '1'   // DNI
  | '4'   // Carnet de extranjeria
  | '6'   // RUC
  | '7'   // Pasaporte
  | 'A';  // Cedula diplomatica

// ── Supplier (Emisor) ──

export interface Supplier {
  ruc: string;           // 11-digit RUC
  razonSocial: string;   // Legal business name
  nombreComercial?: string;
  direccion: string;
  ubigeo?: string;       // 6-digit district code
  departamento?: string;
  provincia?: string;
  distrito?: string;
}

// ── Customer (Receptor) ──

export interface Customer {
  tipoDocumento: IdentityDocType;
  numDocumento: string;  // RUC (11), DNI (8), etc.
  razonSocial: string;   // Name or business name
  direccion?: string;
}

// ── Line Items ──

export interface InvoiceItem {
  cantidad: number;
  unidad: string;          // SUNAT unit code (NIU = item, ZZ = service)
  descripcion: string;
  valorUnitario: number;   // Unit price WITHOUT IGV (base price)
  precioUnitario: number;  // Unit price WITH IGV (sale price)
  igv: number;             // IGV amount for this line
  subtotal: number;        // cantidad * valorUnitario (before IGV)
  total: number;           // cantidad * precioUnitario (with IGV)
}

// ── Invoice Document ──

export interface SunatInvoice {
  // Document identification
  tipoDocumento: SunatDocumentType;
  serie: string;           // F001, B001, etc.
  numero: number;          // Correlative number
  fechaEmision: string;    // YYYY-MM-DD
  horaEmision?: string;    // HH:MM:SS
  moneda: CurrencyCode;

  // Parties
  emisor: Supplier;
  receptor: Customer;

  // Line items
  items: InvoiceItem[];

  // Totals (all deterministic from items)
  totalGravado: number;    // Total taxable base (sum of item subtotals)
  totalIgv: number;        // Total IGV
  totalVenta: number;      // Grand total (totalGravado + totalIgv)

  // Optional
  observaciones?: string;
  formaPago?: 'Contado' | 'Credito';
  ordenCompra?: string;    // Purchase order reference
  guiaRemision?: string;   // Dispatch guide reference
}

// ── Credit/Debit Note ──

export interface SunatCreditNote {
  tipoDocumento: '07';
  serie: string;
  numero: number;
  fechaEmision: string;
  moneda: CurrencyCode;
  emisor: Supplier;
  receptor: Customer;
  items: InvoiceItem[];
  totalGravado: number;
  totalIgv: number;
  totalVenta: number;
  // Reference to original document
  tipoDocumentoRef: '01' | '03';
  serieRef: string;
  numeroRef: number;
  motivoAnulacion: string;
  codigoMotivo: string;  // e.g., '01' = anulacion, '02' = correccion
}

export interface SunatDebitNote {
  tipoDocumento: '08';
  serie: string;
  numero: number;
  fechaEmision: string;
  moneda: CurrencyCode;
  emisor: Supplier;
  receptor: Customer;
  items: InvoiceItem[];
  totalGravado: number;
  totalIgv: number;
  totalVenta: number;
  tipoDocumentoRef: '01' | '03';
  serieRef: string;
  numeroRef: number;
  motivoDebito: string;
  codigoMotivo: string;  // e.g., '01' = intereses, '02' = penalidad
}

// ── Nubefact API Types ──

export interface NubefactConfig {
  apiUrl: string;
  apiToken: string;
}

export interface NubefactItem {
  unidad_de_medida: string;
  codigo: string;
  descripcion: string;
  cantidad: number;
  valor_unitario: number;
  precio_unitario: number;
  descuento: number;
  subtotal: number;
  tipo_de_igv: number;    // 1 = gravado, 9 = exonerado, etc.
  igv: number;
  total: number;
  anticipo_regularizacion: boolean;
  anticipo_documento_serie: string;
  anticipo_documento_numero: string;
}

export interface NubefactRequest {
  operacion: string;           // "generar_comprobante"
  tipo_de_comprobante: number; // 1 = factura, 2 = boleta, 3 = NC, 4 = ND
  serie: string;
  numero: number;
  sunat_transaction: number;   // 1 = venta interna
  cliente_tipo_de_documento: string;
  cliente_numero_de_documento: string;
  cliente_denominacion: string;
  cliente_direccion: string;
  cliente_email: string;
  cliente_email_1: string;
  cliente_email_2: string;
  fecha_de_emision: string;    // DD-MM-YYYY (Nubefact format)
  fecha_de_vencimiento: string;
  moneda: number;              // 1 = PEN, 2 = USD
  tipo_de_cambio: string;
  porcentaje_de_igv: number;   // 18.00
  descuento_global: string;
  total_descuento: string;
  total_anticipo: string;
  total_gravada: number;
  total_inafecta: string;
  total_exonerada: string;
  total_igv: number;
  total_gratuita: string;
  total_otros_cargos: string;
  total: number;
  percepcion_tipo: string;
  percepcion_base_imponible: string;
  total_percepcion: string;
  detraccion: boolean;
  observaciones: string;
  documento_que_se_modifica_tipo: number;
  documento_que_se_modifica_serie: string;
  documento_que_se_modifica_numero: string;
  tipo_de_nota_de_credito: number;
  tipo_de_nota_de_debito: number;
  enviar_automaticamente_a_la_sunat: boolean;
  enviar_automaticamente_al_cliente: boolean;
  codigo_unico: string;
  condicion_de_pago: string;
  medio_de_pago: string;
  placa_vehiculo: string;
  orden_compra_servicio: string;
  tabla_personalizada_codigo: string;
  formato_de_pdf: string;
  items: NubefactItem[];
}

export interface NubefactResponse {
  tipo_de_comprobante: number;
  serie: string;
  numero: number;
  sunat_description: string;
  sunat_note: string;
  sunat_responsecode: string;
  sunat_soap_error: string;
  enlace: string;               // PDF URL
  enlace_del_cdr: string;       // CDR XML URL
  enlace_del_xml: string;       // Signed XML URL
  aceptada_por_sunat: boolean;
  cadena_para_codigo_qr: string;
  codigo_hash: string;
  codigo_de_barras: string;
  pdf_bytes: string;            // Base64 PDF
  errors?: string;
}

// ── Serie/Numero Tracking ──

export interface SerieTracker {
  tenantId: string;
  tipoDocumento: SunatDocumentType;
  serie: string;
  ultimoNumero: number;
}

// ── IGV Calculation Result ──

export interface IgvBreakdown {
  baseImponible: number;  // Taxable base
  igv: number;            // IGV amount (18%)
  total: number;          // baseImponible + igv
}
