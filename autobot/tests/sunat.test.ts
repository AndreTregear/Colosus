/**
 * Tests for SUNAT electronic invoicing — IGV calculation, validation, XML generation.
 * All tests are deterministic and require no network.
 */
import { describe, it, expect } from 'vitest';
import {
  IGV_RATE,
  igvFromBase,
  igvFromTotal,
  buildItem,
  buildItemFromTotal,
  sumItems,
} from '../src/integrations/sunat/igv.js';
import {
  validateRuc,
  validateDni,
  validateSerie,
  validateNumero,
  validateIdentityDoc,
  validateInvoice,
  formatDocumentId,
  isBusinessRuc,
  isPersonaNaturalRuc,
} from '../src/integrations/sunat/validator.js';
import { generateInvoiceXml, generateCreditNoteXml } from '../src/integrations/sunat/xml-generator.js';
import type { SunatInvoice, SunatCreditNote } from '../src/integrations/sunat/types.js';

// ── IGV Calculation ──

describe('IGV calculation', () => {
  it('should compute 18% IGV from base', () => {
    const result = igvFromBase(100);
    expect(result.baseImponible).toBe(100);
    expect(result.igv).toBe(18);
    expect(result.total).toBe(118);
  });

  it('should extract base from total with IGV', () => {
    const result = igvFromTotal(118);
    expect(result.baseImponible).toBe(100);
    expect(result.igv).toBe(18);
    expect(result.total).toBe(118);
  });

  it('should handle small amounts', () => {
    const result = igvFromBase(1.50);
    expect(result.baseImponible).toBe(1.50);
    expect(result.igv).toBe(0.27);
    expect(result.total).toBe(1.77);
  });

  it('should be deterministic across multiple calls', () => {
    const r1 = igvFromBase(42.37);
    const r2 = igvFromBase(42.37);
    expect(r1).toEqual(r2);
  });

  it('should build item from base price', () => {
    const item = buildItem(2, 'Test product', 50.00);
    expect(item.valorUnitario).toBe(50.00);
    expect(item.subtotal).toBe(100.00);
    expect(item.igv).toBe(18.00);
    expect(item.total).toBe(118.00);
    expect(item.unidad).toBe('NIU');
  });

  it('should build item from total price (con IGV)', () => {
    const item = buildItemFromTotal(1, 'Service', 118.00, 'ZZ');
    expect(item.precioUnitario).toBe(118.00);
    expect(item.valorUnitario).toBe(100.00);
    expect(item.igv).toBe(18.00);
    expect(item.total).toBe(118.00);
    expect(item.unidad).toBe('ZZ');
  });

  it('should sum items correctly', () => {
    const items = [
      buildItem(2, 'Product A', 50.00),
      buildItem(3, 'Product B', 30.00),
    ];
    const totals = sumItems(items);
    expect(totals.totalGravado).toBe(190.00); // 100 + 90
    expect(totals.totalIgv).toBe(34.20);      // 18 + 16.20
    expect(totals.totalVenta).toBe(224.20);    // 118 + 106.20
  });

  it('should export IGV_RATE as 0.18', () => {
    expect(IGV_RATE).toBe(0.18);
  });
});

// ── RUC Validation ──

describe('RUC validation', () => {
  it('should accept valid empresa RUC (20)', () => {
    // Known valid RUC: 20100047218 (SUNAT itself)
    const result = validateRuc('20100047218');
    expect(result.valid).toBe(true);
  });

  it('should reject non-11-digit strings', () => {
    expect(validateRuc('1234567890').valid).toBe(false);
    expect(validateRuc('123456789012').valid).toBe(false);
    expect(validateRuc('abcdefghijk').valid).toBe(false);
  });

  it('should reject invalid prefix', () => {
    const result = validateRuc('30123456789');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('prefix');
  });

  it('should reject invalid check digit', () => {
    const result = validateRuc('20100047219'); // wrong check digit
    expect(result.valid).toBe(false);
    expect(result.error).toContain('check digit');
  });

  it('should identify business RUC', () => {
    expect(isBusinessRuc('20100047218')).toBe(true);
    expect(isBusinessRuc('10123456789')).toBe(false);
  });

  it('should identify persona natural RUC', () => {
    expect(isPersonaNaturalRuc('10123456789')).toBe(true);
    expect(isPersonaNaturalRuc('20100047218')).toBe(false);
  });
});

// ── DNI Validation ──

describe('DNI validation', () => {
  it('should accept valid 8-digit DNI', () => {
    expect(validateDni('12345678').valid).toBe(true);
  });

  it('should reject non-8-digit strings', () => {
    expect(validateDni('1234567').valid).toBe(false);
    expect(validateDni('123456789').valid).toBe(false);
  });
});

// ── Identity Document Validation ──

describe('identity document validation', () => {
  it('should validate RUC when tipo is 6', () => {
    const result = validateIdentityDoc('6', '20100047218');
    expect(result.valid).toBe(true);
  });

  it('should validate DNI when tipo is 1', () => {
    const result = validateIdentityDoc('1', '12345678');
    expect(result.valid).toBe(true);
  });

  it('should accept sin documento', () => {
    expect(validateIdentityDoc('0', '0').valid).toBe(true);
    expect(validateIdentityDoc('0', '-').valid).toBe(true);
  });
});

// ── Serie/Numero Validation ──

describe('serie validation', () => {
  it('should accept F### for factura', () => {
    expect(validateSerie('F001', '01').valid).toBe(true);
    expect(validateSerie('F999', '01').valid).toBe(true);
  });

  it('should reject B### for factura', () => {
    expect(validateSerie('B001', '01').valid).toBe(false);
  });

  it('should accept B### for boleta', () => {
    expect(validateSerie('B001', '03').valid).toBe(true);
  });

  it('should reject F### for boleta', () => {
    expect(validateSerie('F001', '03').valid).toBe(false);
  });

  it('should accept FC/BC for nota de credito', () => {
    expect(validateSerie('FC01', '07').valid).toBe(true);
    expect(validateSerie('BC01', '07').valid).toBe(true);
  });
});

describe('numero validation', () => {
  it('should accept valid numbers', () => {
    expect(validateNumero(1).valid).toBe(true);
    expect(validateNumero(99999999).valid).toBe(true);
  });

  it('should reject zero or negative', () => {
    expect(validateNumero(0).valid).toBe(false);
    expect(validateNumero(-1).valid).toBe(false);
  });

  it('should reject numbers > 8 digits', () => {
    expect(validateNumero(100000000).valid).toBe(false);
  });
});

describe('formatDocumentId', () => {
  it('should format serie-numero with zero-padded 8-digit numero', () => {
    expect(formatDocumentId('F001', 1)).toBe('F001-00000001');
    expect(formatDocumentId('B001', 12345)).toBe('B001-00012345');
  });
});

// ── Full Invoice Validation ──

describe('invoice validation', () => {
  function makeValidFactura(): SunatInvoice {
    const items = [buildItem(2, 'Producto A', 50.00)];
    const totals = sumItems(items);
    return {
      tipoDocumento: '01',
      serie: 'F001',
      numero: 1,
      fechaEmision: '2026-04-07',
      moneda: 'PEN',
      emisor: {
        ruc: '20100047218',
        razonSocial: 'Test Business SAC',
        direccion: 'Av. Test 123, Lima',
      },
      receptor: {
        tipoDocumento: '6',
        numDocumento: '20100047218',
        razonSocial: 'Cliente SAC',
      },
      items,
      ...totals,
    };
  }

  it('should pass for valid factura', () => {
    const errors = validateInvoice(makeValidFactura());
    expect(errors).toHaveLength(0);
  });

  it('should fail if factura receptor is not RUC', () => {
    const inv = makeValidFactura();
    inv.receptor.tipoDocumento = '1';
    inv.receptor.numDocumento = '12345678';
    const errors = validateInvoice(inv);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.error?.includes('RUC'))).toBe(true);
  });

  it('should fail if items are empty', () => {
    const inv = makeValidFactura();
    inv.items = [];
    const errors = validateInvoice(inv);
    expect(errors.some(e => e.error?.includes('at least one item'))).toBe(true);
  });

  it('should fail if totals don\'t match items', () => {
    const inv = makeValidFactura();
    inv.totalGravado = 999;
    const errors = validateInvoice(inv);
    expect(errors.some(e => e.error?.includes('totalGravado'))).toBe(true);
  });
});

// ── XML Generation ──

describe('XML generation', () => {
  function makeTestInvoice(): SunatInvoice {
    const items = [
      buildItem(2, 'Arroz Extra 5kg', 15.25),
      buildItem(1, 'Aceite Vegetal 1L', 8.90, 'NIU'),
    ];
    const totals = sumItems(items);
    return {
      tipoDocumento: '03',
      serie: 'B001',
      numero: 42,
      fechaEmision: '2026-04-07',
      horaEmision: '14:30:00',
      moneda: 'PEN',
      emisor: {
        ruc: '20100047218',
        razonSocial: 'Bodega Doña Maria EIRL',
        nombreComercial: 'Bodega Doña Maria',
        direccion: 'Jr. Huallaga 234, Cercado de Lima',
        ubigeo: '150101',
        departamento: 'LIMA',
        provincia: 'LIMA',
        distrito: 'LIMA',
      },
      receptor: {
        tipoDocumento: '1',
        numDocumento: '12345678',
        razonSocial: 'Juan Perez',
      },
      items,
      ...totals,
      formaPago: 'Contado',
    };
  }

  it('should generate valid XML string', () => {
    const xml = generateInvoiceXml(makeTestInvoice());
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<Invoice xmlns=');
  });

  it('should include UBL 2.1 version', () => {
    const xml = generateInvoiceXml(makeTestInvoice());
    expect(xml).toContain('<cbc:UBLVersionID>2.1</cbc:UBLVersionID>');
    expect(xml).toContain('<cbc:CustomizationID>2.0</cbc:CustomizationID>');
  });

  it('should format document ID as serie-numero padded to 8 digits', () => {
    const xml = generateInvoiceXml(makeTestInvoice());
    expect(xml).toContain('<cbc:ID>B001-00000042</cbc:ID>');
  });

  it('should include emisor RUC with schemeID 6', () => {
    const xml = generateInvoiceXml(makeTestInvoice());
    expect(xml).toContain('schemeID="6"');
    expect(xml).toContain('20100047218');
  });

  it('should include receptor document', () => {
    const xml = generateInvoiceXml(makeTestInvoice());
    expect(xml).toContain('schemeID="1"');
    expect(xml).toContain('12345678');
  });

  it('should include IGV tax scheme', () => {
    const xml = generateInvoiceXml(makeTestInvoice());
    expect(xml).toContain('<cbc:Name>IGV</cbc:Name>');
    expect(xml).toContain('<cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>');
    expect(xml).toContain('<cbc:Percent>18.00</cbc:Percent>');
  });

  it('should include all line items', () => {
    const xml = generateInvoiceXml(makeTestInvoice());
    expect(xml).toContain('Arroz Extra 5kg');
    expect(xml).toContain('Aceite Vegetal 1L');
    // Should have 2 InvoiceLine elements
    const lineCount = (xml.match(/<cac:InvoiceLine>/g) || []).length;
    expect(lineCount).toBe(2);
  });

  it('should include monetary totals', () => {
    const xml = generateInvoiceXml(makeTestInvoice());
    expect(xml).toContain('LineExtensionAmount');
    expect(xml).toContain('TaxInclusiveAmount');
    expect(xml).toContain('PayableAmount');
  });

  it('should include payment terms when specified', () => {
    const xml = generateInvoiceXml(makeTestInvoice());
    expect(xml).toContain('FormaPago');
    expect(xml).toContain('Contado');
  });

  it('should be deterministic — same input produces same output', () => {
    const inv = makeTestInvoice();
    const xml1 = generateInvoiceXml(inv);
    const xml2 = generateInvoiceXml(inv);
    expect(xml1).toBe(xml2);
  });

  it('should include digital signature reference', () => {
    const xml = generateInvoiceXml(makeTestInvoice());
    expect(xml).toContain('<cac:Signature>');
    expect(xml).toContain('#SignatureSP');
  });

  it('should include country code PE', () => {
    const xml = generateInvoiceXml(makeTestInvoice());
    expect(xml).toContain('>PE</cbc:IdentificationCode>');
  });
});

// ── Credit Note XML ──

describe('credit note XML generation', () => {
  function makeTestCreditNote(): SunatCreditNote {
    const items = [buildItem(1, 'Item devuelto', 50.00)];
    const totals = sumItems(items);
    return {
      tipoDocumento: '07',
      serie: 'FC01',
      numero: 1,
      fechaEmision: '2026-04-07',
      moneda: 'PEN',
      emisor: {
        ruc: '20100047218',
        razonSocial: 'Bodega Doña Maria EIRL',
        direccion: 'Jr. Huallaga 234, Cercado de Lima',
      },
      receptor: {
        tipoDocumento: '6',
        numDocumento: '20100047218',
        razonSocial: 'Cliente SAC',
      },
      items,
      ...totals,
      tipoDocumentoRef: '01',
      serieRef: 'F001',
      numeroRef: 42,
      motivoAnulacion: 'Devolucion de mercaderia',
      codigoMotivo: '01',
    };
  }

  it('should generate valid credit note XML', () => {
    const xml = generateCreditNoteXml(makeTestCreditNote());
    expect(xml).toContain('<CreditNote');
    expect(xml).toContain('</CreditNote>');
  });

  it('should include discrepancy response referencing original invoice', () => {
    const xml = generateCreditNoteXml(makeTestCreditNote());
    expect(xml).toContain('<cac:DiscrepancyResponse>');
    expect(xml).toContain('F001-00000042');
    expect(xml).toContain('Devolucion de mercaderia');
  });

  it('should include billing reference with document type', () => {
    const xml = generateCreditNoteXml(makeTestCreditNote());
    expect(xml).toContain('<cac:BillingReference>');
    expect(xml).toContain('<cbc:DocumentTypeCode>01</cbc:DocumentTypeCode>');
  });

  it('should use CreditNoteLine (not InvoiceLine)', () => {
    const xml = generateCreditNoteXml(makeTestCreditNote());
    expect(xml).toContain('<cac:CreditNoteLine>');
    expect(xml).toContain('CreditedQuantity');
    expect(xml).not.toContain('<cac:InvoiceLine>');
  });

  it('should be deterministic', () => {
    const note = makeTestCreditNote();
    expect(generateCreditNoteXml(note)).toBe(generateCreditNoteXml(note));
  });
});
