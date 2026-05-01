/**
 * UBL 2.1 XML Generator for SUNAT Electronic Invoicing
 * Generates deterministic XML for Facturas (01) and Boletas (03).
 * Conforms to Peru SUNAT CPE schema: UBL 2.1 + SUNAT extensions.
 */

import type { SunatInvoice, SunatCreditNote, InvoiceItem, SunatDocumentType } from './types';
import { formatDocumentId } from './validator';

// ── Namespaces ──

const UBL_NS = 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2';
const CAC_NS = 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2';
const CBC_NS = 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2';
const EXT_NS = 'urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2';
const DS_NS = 'http://www.w3.org/2000/09/xmldsig#';
const SUNAT_NS = 'urn:sunat:names:specification:ubl:peru:schema:xsd:SunatAggregateComponents-1';

/** Map internal doc type to SUNAT numeric code */
const DOC_TYPE_MAP: Record<SunatDocumentType, string> = {
  '01': '01',
  '03': '03',
  '07': '07',
  '08': '08',
};

/** Map currency code to SUNAT numeric code */
const CURRENCY_MAP: Record<string, string> = {
  PEN: 'PEN',
  USD: 'USD',
};

/** Map identity doc type to SUNAT catalog 06 code */
const IDENTITY_DOC_MAP: Record<string, string> = {
  '0': '0',
  '1': '1',
  '4': '4',
  '6': '6',
  '7': '7',
  'A': 'A',
};

/**
 * Format number to exactly 2 decimal places for XML output.
 */
function fmt(n: number): string {
  return n.toFixed(2);
}

/**
 * XML-escape special characters.
 */
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Format date from YYYY-MM-DD to YYYY-MM-DD (pass-through, already correct for UBL).
 */
function fmtDate(date: string): string {
  return date;
}

/**
 * Generate the UBL 2.1 XML for a SUNAT invoice or boleta.
 * This output is deterministic — same input always produces same output.
 */
export function generateInvoiceXml(invoice: SunatInvoice): string {
  const lines: string[] = [];

  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push(`<Invoice xmlns="${UBL_NS}"`);
  lines.push(`  xmlns:cac="${CAC_NS}"`);
  lines.push(`  xmlns:cbc="${CBC_NS}"`);
  lines.push(`  xmlns:ext="${EXT_NS}"`);
  lines.push(`  xmlns:ds="${DS_NS}"`);
  lines.push(`  xmlns:sac="${SUNAT_NS}">`);

  // ── Extensions (placeholder for digital signature) ──
  lines.push('  <ext:UBLExtensions>');
  lines.push('    <ext:UBLExtension>');
  lines.push('      <ext:ExtensionContent/>');
  lines.push('    </ext:UBLExtension>');
  lines.push('  </ext:UBLExtensions>');

  // ── UBL Version ──
  lines.push('  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>');
  lines.push('  <cbc:CustomizationID>2.0</cbc:CustomizationID>');

  // ── Document ID ──
  const docId = formatDocumentId(invoice.serie, invoice.numero);
  lines.push(`  <cbc:ID>${esc(docId)}</cbc:ID>`);

  // ── Issue date/time ──
  lines.push(`  <cbc:IssueDate>${fmtDate(invoice.fechaEmision)}</cbc:IssueDate>`);
  if (invoice.horaEmision) {
    lines.push(`  <cbc:IssueTime>${esc(invoice.horaEmision)}</cbc:IssueTime>`);
  }

  // ── Document type ──
  lines.push(`  <cbc:InvoiceTypeCode listID="0101" listAgencyName="PE:SUNAT" listName="Tipo de Documento" listURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo01">${DOC_TYPE_MAP[invoice.tipoDocumento]}</cbc:InvoiceTypeCode>`);

  // ── Notes ──
  if (invoice.observaciones) {
    lines.push(`  <cbc:Note languageLocaleID="1000"><![CDATA[${invoice.observaciones}]]></cbc:Note>`);
  }

  // ── Currency ──
  lines.push(`  <cbc:DocumentCurrencyCode listID="ISO 4217 Alpha" listAgencyName="United Nations Economic Commission for Europe" listName="Currency">${CURRENCY_MAP[invoice.moneda]}</cbc:DocumentCurrencyCode>`);

  // ── Order reference ──
  if (invoice.ordenCompra) {
    lines.push('  <cac:OrderReference>');
    lines.push(`    <cbc:ID>${esc(invoice.ordenCompra)}</cbc:ID>`);
    lines.push('  </cac:OrderReference>');
  }

  // ── Despatch reference ──
  if (invoice.guiaRemision) {
    lines.push('  <cac:DespatchDocumentReference>');
    lines.push(`    <cbc:ID>${esc(invoice.guiaRemision)}</cbc:ID>`);
    lines.push('    <cbc:DocumentTypeCode listAgencyName="PE:SUNAT" listName="Tipo de Documento" listURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo01">09</cbc:DocumentTypeCode>');
    lines.push('  </cac:DespatchDocumentReference>');
  }

  // ── Digital Signature Reference ──
  lines.push('  <cac:Signature>');
  lines.push(`    <cbc:ID>${esc(docId)}</cbc:ID>`);
  lines.push('    <cac:SignatoryParty>');
  lines.push('      <cac:PartyIdentification>');
  lines.push(`        <cbc:ID>${esc(invoice.emisor.ruc)}</cbc:ID>`);
  lines.push('      </cac:PartyIdentification>');
  lines.push('      <cac:PartyName>');
  lines.push(`        <cbc:Name><![CDATA[${invoice.emisor.razonSocial}]]></cbc:Name>`);
  lines.push('      </cac:PartyName>');
  lines.push('    </cac:SignatoryParty>');
  lines.push('    <cac:DigitalSignatureAttachment>');
  lines.push('      <cac:ExternalReference>');
  lines.push('        <cbc:URI>#SignatureSP</cbc:URI>');
  lines.push('      </cac:ExternalReference>');
  lines.push('    </cac:DigitalSignatureAttachment>');
  lines.push('  </cac:Signature>');

  // ── Supplier (Emisor) ──
  lines.push('  <cac:AccountingSupplierParty>');
  lines.push('    <cac:Party>');
  lines.push('      <cac:PartyIdentification>');
  lines.push(`        <cbc:ID schemeID="6" schemeName="Documento de Identidad" schemeAgencyName="PE:SUNAT" schemeURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06">${esc(invoice.emisor.ruc)}</cbc:ID>`);
  lines.push('      </cac:PartyIdentification>');
  if (invoice.emisor.nombreComercial) {
    lines.push('      <cac:PartyName>');
    lines.push(`        <cbc:Name><![CDATA[${invoice.emisor.nombreComercial}]]></cbc:Name>`);
    lines.push('      </cac:PartyName>');
  }
  lines.push('      <cac:PartyLegalEntity>');
  lines.push(`        <cbc:RegistrationName><![CDATA[${invoice.emisor.razonSocial}]]></cbc:RegistrationName>`);
  lines.push('        <cac:RegistrationAddress>');
  lines.push(`          <cbc:ID schemeName="Ubigeos" schemeAgencyName="PE:INEI">${esc(invoice.emisor.ubigeo || '150101')}</cbc:ID>`);
  lines.push('          <cbc:AddressTypeCode listAgencyName="PE:SUNAT" listName="Establecimientos anexos">0000</cbc:AddressTypeCode>');
  if (invoice.emisor.departamento) {
    lines.push(`          <cbc:CityName>${esc(invoice.emisor.departamento)}</cbc:CityName>`);
  }
  if (invoice.emisor.provincia) {
    lines.push(`          <cbc:CountrySubentity>${esc(invoice.emisor.provincia)}</cbc:CountrySubentity>`);
  }
  if (invoice.emisor.distrito) {
    lines.push(`          <cbc:District>${esc(invoice.emisor.distrito)}</cbc:District>`);
  }
  lines.push('          <cac:AddressLine>');
  lines.push(`            <cbc:Line><![CDATA[${invoice.emisor.direccion}]]></cbc:Line>`);
  lines.push('          </cac:AddressLine>');
  lines.push('          <cac:Country>');
  lines.push('            <cbc:IdentificationCode listID="ISO 3166-1" listAgencyName="United Nations Economic Commission for Europe" listName="Country">PE</cbc:IdentificationCode>');
  lines.push('          </cac:Country>');
  lines.push('        </cac:RegistrationAddress>');
  lines.push('      </cac:PartyLegalEntity>');
  lines.push('    </cac:Party>');
  lines.push('  </cac:AccountingSupplierParty>');

  // ── Customer (Receptor) ──
  lines.push('  <cac:AccountingCustomerParty>');
  lines.push('    <cac:Party>');
  lines.push('      <cac:PartyIdentification>');
  lines.push(`        <cbc:ID schemeID="${IDENTITY_DOC_MAP[invoice.receptor.tipoDocumento]}" schemeName="Documento de Identidad" schemeAgencyName="PE:SUNAT" schemeURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06">${esc(invoice.receptor.numDocumento)}</cbc:ID>`);
  lines.push('      </cac:PartyIdentification>');
  lines.push('      <cac:PartyLegalEntity>');
  lines.push(`        <cbc:RegistrationName><![CDATA[${invoice.receptor.razonSocial}]]></cbc:RegistrationName>`);
  if (invoice.receptor.direccion) {
    lines.push('        <cac:RegistrationAddress>');
    lines.push('          <cac:AddressLine>');
    lines.push(`            <cbc:Line><![CDATA[${invoice.receptor.direccion}]]></cbc:Line>`);
    lines.push('          </cac:AddressLine>');
    lines.push('        </cac:RegistrationAddress>');
  }
  lines.push('      </cac:PartyLegalEntity>');
  lines.push('    </cac:Party>');
  lines.push('  </cac:AccountingCustomerParty>');

  // ── Payment terms ──
  if (invoice.formaPago) {
    lines.push('  <cac:PaymentTerms>');
    lines.push(`    <cbc:ID>FormaPago</cbc:ID>`);
    lines.push(`    <cbc:PaymentMeansID>${invoice.formaPago}</cbc:PaymentMeansID>`);
    if (invoice.formaPago === 'Contado') {
      lines.push(`    <cbc:Amount currencyID="${invoice.moneda}">${fmt(invoice.totalVenta)}</cbc:Amount>`);
    }
    lines.push('  </cac:PaymentTerms>');
  }

  // ── Tax totals ──
  lines.push('  <cac:TaxTotal>');
  lines.push(`    <cbc:TaxAmount currencyID="${invoice.moneda}">${fmt(invoice.totalIgv)}</cbc:TaxAmount>`);
  lines.push('    <cac:TaxSubtotal>');
  lines.push(`      <cbc:TaxableAmount currencyID="${invoice.moneda}">${fmt(invoice.totalGravado)}</cbc:TaxableAmount>`);
  lines.push(`      <cbc:TaxAmount currencyID="${invoice.moneda}">${fmt(invoice.totalIgv)}</cbc:TaxAmount>`);
  lines.push('      <cac:TaxCategory>');
  lines.push('        <cac:TaxScheme>');
  lines.push('          <cbc:ID schemeName="Codigo de tributos" schemeAgencyName="PE:SUNAT" schemeURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo05">1000</cbc:ID>');
  lines.push('          <cbc:Name>IGV</cbc:Name>');
  lines.push('          <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>');
  lines.push('        </cac:TaxScheme>');
  lines.push('      </cac:TaxCategory>');
  lines.push('    </cac:TaxSubtotal>');
  lines.push('  </cac:TaxTotal>');

  // ── Legal monetary total ──
  lines.push('  <cac:LegalMonetaryTotal>');
  lines.push(`    <cbc:LineExtensionAmount currencyID="${invoice.moneda}">${fmt(invoice.totalGravado)}</cbc:LineExtensionAmount>`);
  lines.push(`    <cbc:TaxInclusiveAmount currencyID="${invoice.moneda}">${fmt(invoice.totalVenta)}</cbc:TaxInclusiveAmount>`);
  lines.push(`    <cbc:PayableAmount currencyID="${invoice.moneda}">${fmt(invoice.totalVenta)}</cbc:PayableAmount>`);
  lines.push('  </cac:LegalMonetaryTotal>');

  // ── Line items ──
  invoice.items.forEach((item, idx) => {
    lines.push(...generateItemXml(item, idx + 1, invoice.moneda));
  });

  lines.push('</Invoice>');
  return lines.join('\n');
}

/**
 * Generate XML for a single invoice line item.
 */
function generateItemXml(item: InvoiceItem, lineId: number, currency: string): string[] {
  const lines: string[] = [];

  lines.push(`  <cac:InvoiceLine>`);
  lines.push(`    <cbc:ID>${lineId}</cbc:ID>`);
  lines.push(`    <cbc:InvoicedQuantity unitCode="${esc(item.unidad)}" unitCodeListID="UN/ECE rec 20" unitCodeListAgencyName="United Nations Economic Commission for Europe">${item.cantidad}</cbc:InvoicedQuantity>`);
  lines.push(`    <cbc:LineExtensionAmount currencyID="${currency}">${fmt(item.subtotal)}</cbc:LineExtensionAmount>`);

  // Pricing reference (price with IGV for display)
  lines.push('    <cac:PricingReference>');
  lines.push('      <cac:AlternativeConditionPrice>');
  lines.push(`        <cbc:PriceAmount currencyID="${currency}">${fmt(item.precioUnitario)}</cbc:PriceAmount>`);
  lines.push('        <cbc:PriceTypeCode listName="Tipo de Precio" listAgencyName="PE:SUNAT" listURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo16">01</cbc:PriceTypeCode>');
  lines.push('      </cac:AlternativeConditionPrice>');
  lines.push('    </cac:PricingReference>');

  // Tax total for this line
  lines.push('    <cac:TaxTotal>');
  lines.push(`      <cbc:TaxAmount currencyID="${currency}">${fmt(item.igv)}</cbc:TaxAmount>`);
  lines.push('      <cac:TaxSubtotal>');
  lines.push(`        <cbc:TaxableAmount currencyID="${currency}">${fmt(item.subtotal)}</cbc:TaxableAmount>`);
  lines.push(`        <cbc:TaxAmount currencyID="${currency}">${fmt(item.igv)}</cbc:TaxAmount>`);
  lines.push('        <cac:TaxCategory>');
  lines.push('          <cbc:Percent>18.00</cbc:Percent>');
  lines.push('          <cbc:TaxExemptionReasonCode listAgencyName="PE:SUNAT" listName="Afectacion del IGV" listURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo07">10</cbc:TaxExemptionReasonCode>');
  lines.push('          <cac:TaxScheme>');
  lines.push('            <cbc:ID schemeName="Codigo de tributos" schemeAgencyName="PE:SUNAT" schemeURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo05">1000</cbc:ID>');
  lines.push('            <cbc:Name>IGV</cbc:Name>');
  lines.push('            <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>');
  lines.push('          </cac:TaxScheme>');
  lines.push('        </cac:TaxCategory>');
  lines.push('      </cac:TaxSubtotal>');
  lines.push('    </cac:TaxTotal>');

  // Item details
  lines.push('    <cac:Item>');
  lines.push(`      <cbc:Description><![CDATA[${item.descripcion}]]></cbc:Description>`);
  lines.push('    </cac:Item>');

  // Price (base price without IGV)
  lines.push('    <cac:Price>');
  lines.push(`      <cbc:PriceAmount currencyID="${currency}">${fmt(item.valorUnitario)}</cbc:PriceAmount>`);
  lines.push('    </cac:Price>');

  lines.push('  </cac:InvoiceLine>');
  return lines;
}

/**
 * Generate UBL 2.1 XML for a nota de credito (07).
 */
export function generateCreditNoteXml(note: SunatCreditNote): string {
  const docId = formatDocumentId(note.serie, note.numero);
  const refDocId = formatDocumentId(note.serieRef, note.numeroRef);
  const out: string[] = [];

  out.push('<?xml version="1.0" encoding="UTF-8"?>');
  out.push('<CreditNote xmlns="urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2"');
  out.push(`  xmlns:cac="${CAC_NS}"`);
  out.push(`  xmlns:cbc="${CBC_NS}"`);
  out.push(`  xmlns:ext="${EXT_NS}">`);
  out.push('  <ext:UBLExtensions>');
  out.push('    <ext:UBLExtension>');
  out.push('      <ext:ExtensionContent/>');
  out.push('    </ext:UBLExtension>');
  out.push('  </ext:UBLExtensions>');
  out.push('  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>');
  out.push('  <cbc:CustomizationID>2.0</cbc:CustomizationID>');
  out.push(`  <cbc:ID>${esc(docId)}</cbc:ID>`);
  out.push(`  <cbc:IssueDate>${note.fechaEmision}</cbc:IssueDate>`);
  out.push(`  <cbc:DocumentCurrencyCode>${CURRENCY_MAP[note.moneda]}</cbc:DocumentCurrencyCode>`);

  // Discrepancy reference
  out.push('  <cac:DiscrepancyResponse>');
  out.push(`    <cbc:ReferenceID>${esc(refDocId)}</cbc:ReferenceID>`);
  out.push(`    <cbc:ResponseCode>${esc(note.codigoMotivo)}</cbc:ResponseCode>`);
  out.push(`    <cbc:Description><![CDATA[${note.motivoAnulacion}]]></cbc:Description>`);
  out.push('  </cac:DiscrepancyResponse>');

  // Billing reference
  out.push('  <cac:BillingReference>');
  out.push('    <cac:InvoiceDocumentReference>');
  out.push(`      <cbc:ID>${esc(refDocId)}</cbc:ID>`);
  out.push(`      <cbc:DocumentTypeCode>${note.tipoDocumentoRef}</cbc:DocumentTypeCode>`);
  out.push('    </cac:InvoiceDocumentReference>');
  out.push('  </cac:BillingReference>');

  // Signature
  out.push('  <cac:Signature>');
  out.push(`    <cbc:ID>${esc(docId)}</cbc:ID>`);
  out.push('    <cac:SignatoryParty>');
  out.push('      <cac:PartyIdentification>');
  out.push(`        <cbc:ID>${esc(note.emisor.ruc)}</cbc:ID>`);
  out.push('      </cac:PartyIdentification>');
  out.push('      <cac:PartyName>');
  out.push(`        <cbc:Name><![CDATA[${note.emisor.razonSocial}]]></cbc:Name>`);
  out.push('      </cac:PartyName>');
  out.push('    </cac:SignatoryParty>');
  out.push('    <cac:DigitalSignatureAttachment>');
  out.push('      <cac:ExternalReference>');
  out.push('        <cbc:URI>#SignatureSP</cbc:URI>');
  out.push('      </cac:ExternalReference>');
  out.push('    </cac:DigitalSignatureAttachment>');
  out.push('  </cac:Signature>');

  // Supplier
  out.push('  <cac:AccountingSupplierParty>');
  out.push('    <cac:Party>');
  out.push('      <cac:PartyIdentification>');
  out.push(`        <cbc:ID schemeID="6">${esc(note.emisor.ruc)}</cbc:ID>`);
  out.push('      </cac:PartyIdentification>');
  out.push('      <cac:PartyLegalEntity>');
  out.push(`        <cbc:RegistrationName><![CDATA[${note.emisor.razonSocial}]]></cbc:RegistrationName>`);
  out.push('      </cac:PartyLegalEntity>');
  out.push('    </cac:Party>');
  out.push('  </cac:AccountingSupplierParty>');

  // Customer
  out.push('  <cac:AccountingCustomerParty>');
  out.push('    <cac:Party>');
  out.push('      <cac:PartyIdentification>');
  out.push(`        <cbc:ID schemeID="${IDENTITY_DOC_MAP[note.receptor.tipoDocumento]}">${esc(note.receptor.numDocumento)}</cbc:ID>`);
  out.push('      </cac:PartyIdentification>');
  out.push('      <cac:PartyLegalEntity>');
  out.push(`        <cbc:RegistrationName><![CDATA[${note.receptor.razonSocial}]]></cbc:RegistrationName>`);
  out.push('      </cac:PartyLegalEntity>');
  out.push('    </cac:Party>');
  out.push('  </cac:AccountingCustomerParty>');

  // Tax total
  out.push('  <cac:TaxTotal>');
  out.push(`    <cbc:TaxAmount currencyID="${note.moneda}">${fmt(note.totalIgv)}</cbc:TaxAmount>`);
  out.push('    <cac:TaxSubtotal>');
  out.push(`      <cbc:TaxableAmount currencyID="${note.moneda}">${fmt(note.totalGravado)}</cbc:TaxableAmount>`);
  out.push(`      <cbc:TaxAmount currencyID="${note.moneda}">${fmt(note.totalIgv)}</cbc:TaxAmount>`);
  out.push('      <cac:TaxCategory>');
  out.push('        <cac:TaxScheme>');
  out.push('          <cbc:ID>1000</cbc:ID>');
  out.push('          <cbc:Name>IGV</cbc:Name>');
  out.push('          <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>');
  out.push('        </cac:TaxScheme>');
  out.push('      </cac:TaxCategory>');
  out.push('    </cac:TaxSubtotal>');
  out.push('  </cac:TaxTotal>');

  // Legal monetary total
  out.push('  <cac:LegalMonetaryTotal>');
  out.push(`    <cbc:LineExtensionAmount currencyID="${note.moneda}">${fmt(note.totalGravado)}</cbc:LineExtensionAmount>`);
  out.push(`    <cbc:TaxInclusiveAmount currencyID="${note.moneda}">${fmt(note.totalVenta)}</cbc:TaxInclusiveAmount>`);
  out.push(`    <cbc:PayableAmount currencyID="${note.moneda}">${fmt(note.totalVenta)}</cbc:PayableAmount>`);
  out.push('  </cac:LegalMonetaryTotal>');

  // Credit note line items
  note.items.forEach((item, idx) => {
    out.push(`  <cac:CreditNoteLine>`);
    out.push(`    <cbc:ID>${idx + 1}</cbc:ID>`);
    out.push(`    <cbc:CreditedQuantity unitCode="${esc(item.unidad)}">${item.cantidad}</cbc:CreditedQuantity>`);
    out.push(`    <cbc:LineExtensionAmount currencyID="${note.moneda}">${fmt(item.subtotal)}</cbc:LineExtensionAmount>`);
    out.push('    <cac:PricingReference>');
    out.push('      <cac:AlternativeConditionPrice>');
    out.push(`        <cbc:PriceAmount currencyID="${note.moneda}">${fmt(item.precioUnitario)}</cbc:PriceAmount>`);
    out.push('        <cbc:PriceTypeCode>01</cbc:PriceTypeCode>');
    out.push('      </cac:AlternativeConditionPrice>');
    out.push('    </cac:PricingReference>');
    out.push('    <cac:TaxTotal>');
    out.push(`      <cbc:TaxAmount currencyID="${note.moneda}">${fmt(item.igv)}</cbc:TaxAmount>`);
    out.push('      <cac:TaxSubtotal>');
    out.push(`        <cbc:TaxableAmount currencyID="${note.moneda}">${fmt(item.subtotal)}</cbc:TaxableAmount>`);
    out.push(`        <cbc:TaxAmount currencyID="${note.moneda}">${fmt(item.igv)}</cbc:TaxAmount>`);
    out.push('        <cac:TaxCategory>');
    out.push('          <cbc:Percent>18.00</cbc:Percent>');
    out.push('          <cbc:TaxExemptionReasonCode>10</cbc:TaxExemptionReasonCode>');
    out.push('          <cac:TaxScheme>');
    out.push('            <cbc:ID>1000</cbc:ID>');
    out.push('            <cbc:Name>IGV</cbc:Name>');
    out.push('            <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>');
    out.push('          </cac:TaxScheme>');
    out.push('        </cac:TaxCategory>');
    out.push('      </cac:TaxSubtotal>');
    out.push('    </cac:TaxTotal>');
    out.push('    <cac:Item>');
    out.push(`      <cbc:Description><![CDATA[${item.descripcion}]]></cbc:Description>`);
    out.push('    </cac:Item>');
    out.push('    <cac:Price>');
    out.push(`      <cbc:PriceAmount currencyID="${note.moneda}">${fmt(item.valorUnitario)}</cbc:PriceAmount>`);
    out.push('    </cac:Price>');
    out.push('  </cac:CreditNoteLine>');
  });

  out.push('</CreditNote>');
  return out.join('\n');
}
