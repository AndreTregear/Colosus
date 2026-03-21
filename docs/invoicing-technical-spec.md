# Invoicing Technical Specification

## Overview

This document specifies the electronic invoicing subsystem for Yaya Platform, starting with Peru (SUNAT) as the v1 implementation and designed with a country-adapter architecture to support Mexico, Ecuador, Colombia, and Argentina in future releases.

The invoicing MCP server (`invoicing-mcp`) integrates with PSE/OSE providers to create, sign, submit, and track electronic tax documents (Comprobantes de Pago Electrónicos) on behalf of Yaya Platform clients.

---

## 1. Peru Tax System (v1 Implementation)

### 1.1 Tax Regimes

Peru's SUNAT (Superintendencia Nacional de Aduanas y de Administración Tributaria) defines four tax regimes for businesses. The regime determines document types allowed, tax rates, and reporting obligations.

| Regime | Income Tax (Renta) | IGV (18%) | Annual Revenue Limit | Allowed Documents |
|--------|-------------------|-----------|---------------------|-------------------|
| **NRUS** (Nuevo RUS) | Cuota fija: Cat.1 S/20, Cat.2 S/50 | Included in cuota | Cat.1: S/5,000/mes, Cat.2: S/8,000/mes | Solo boletas de venta y tickets |
| **RER** (Régimen Especial) | 1.5% ingresos netos mensuales | 18% sobre valor venta | S/525,000 anuales | Facturas, boletas, notas crédito/débito |
| **RMT** (Régimen MYPE Tributario) | 1% (hasta 300 UIT) o 1.5% (> 300 UIT) mensual | 18% sobre valor venta | 1,700 UIT anuales (~S/8,500,000) | Todos los CPE |
| **RG** (Régimen General) | 29.5% renta neta anual (pagos a cuenta mensuales 1.5% o coeficiente) | 18% sobre valor venta | Sin límite | Todos los CPE |

> **UIT 2025**: S/5,150 (Unidad Impositiva Tributaria, updated annually by MEF).

### 1.2 Business Owner Obligations by Regime

#### NRUS (Nuevo Régimen Único Simplificado)

- **Pago mensual**: Cuota fija (S/20 Categoría 1, S/50 Categoría 2) — covers both renta and IGV
- **Declaración mensual**: Pago fácil con Formulario 1611 (virtual o presencial)
- **Declaración anual**: No requiere
- **Libros contables**: No requiere
- **Comprobantes**: Solo boletas de venta y tickets (NO facturas)
- **Restricciones**: No permite deducir crédito fiscal IGV, no puede emitir facturas, no puede exportar

#### RER (Régimen Especial de Renta)

- **Pago mensual IGV**: 18% sobre ventas menos crédito fiscal (IGV de compras)
- **Pago mensual Renta**: 1.5% de ingresos netos
- **Declaración mensual**: PDT 621 (IGV-Renta mensual) o Formulario Virtual 621
- **Declaración anual**: No requiere
- **Libros contables**: Registro de Compras y Registro de Ventas (solo 2 libros)
- **Comprobantes**: Facturas, boletas, notas de crédito, notas de débito

#### RMT (Régimen MYPE Tributario)

- **Pago mensual IGV**: 18% sobre ventas menos crédito fiscal
- **Pago mensual Renta**: 1% de ingresos netos (hasta 300 UIT anuales) o 1.5% (si supera 300 UIT)
- **Declaración mensual**: PDT 621 o Formulario Virtual 621
- **Declaración anual**: Sí — Formulario Virtual 710 (Renta Anual)
- **Libros contables**:
  - Hasta 300 UIT ingresos: Registro de Ventas, Registro de Compras, Libro Diario Simplificado
  - Más de 300 UIT: contabilidad completa (Diario, Mayor, Inventarios y Balances)
- **Comprobantes**: Todos los CPE (facturas, boletas, notas, guías de remisión)
- **Beneficio**: Tasa reducida renta, suspensión de pagos a cuenta si pérdida

#### RG (Régimen General)

- **Pago mensual IGV**: 18% sobre ventas menos crédito fiscal
- **Pagos a cuenta Renta**: Mayor entre 1.5% de ingresos mensuales o coeficiente (impuesto calculado año anterior / ingresos año anterior)
- **Declaración mensual**: PDT 621 o Formulario Virtual 621
- **Declaración anual**: Sí — Formulario Virtual 710 (Renta Anual), tasa 29.5% sobre renta neta
- **Libros contables**: Contabilidad completa — Libro Diario, Libro Mayor, Libro de Inventarios y Balances, Registro de Compras, Registro de Ventas, Libro Caja y Bancos
- **Comprobantes**: Todos los CPE
- **Particularidades**: Sin límite de ingresos, puede deducir todos los gastos permitidos, crédito fiscal completo

### 1.3 Monthly Declaration Schedule (PDT 621)

The declaration deadline depends on the last digit of the business RUC:

| Último dígito RUC | Fecha vencimiento (mes siguiente) |
|-------------------|----------------------------------|
| 0 | 12 del mes |
| 1 | 13 del mes |
| 2 | 14 del mes |
| 3 | 15 del mes |
| 4 | 16 del mes |
| 5 | 17 del mes |
| 6 | 18 del mes |
| 7 | 19 del mes |
| 8 | 20 del mes |
| 9 | 21 del mes |
| Buenos contribuyentes | 22 del mes |

> Dates shift to the next business day if they fall on weekends or holidays. SUNAT publishes an official calendar each year.

### 1.4 Electronic Invoicing (CPE) — Comprobantes de Pago Electrónicos

#### 1.4.1 Document Types

| Código | Tipo Documento | Descripción | Destinatario |
|--------|---------------|-------------|-------------|
| **01** | Factura | Invoice for businesses with RUC | Empresas (persona jurídica o natural con RUC que necesita crédito fiscal) |
| **03** | Boleta de Venta | Receipt for end consumers | Consumidores finales (DNI o sin documento) |
| **07** | Nota de Crédito | Credit note (anulación parcial/total, descuento, corrección) | Referencia a factura/boleta existente |
| **08** | Nota de Débito | Debit note (intereses, penalidades, aumento de precio) | Referencia a factura/boleta existente |
| **09** | Guía de Remisión Remitente | Dispatch guide (sender) | Transporte de mercancías |
| **31** | Guía de Remisión Transportista | Dispatch guide (carrier) | Transporte de mercancías |

#### 1.4.2 Series Format

- **Factura**: `F###-NNNNNNNN` (e.g., `F001-00000001`)
- **Boleta**: `B###-NNNNNNNN` (e.g., `B001-00000001`)
- **Nota Crédito**: `FC##-NNNNNNNN` (ref factura) or `BC##-NNNNNNNN` (ref boleta)
- **Nota Débito**: `FD##-NNNNNNNN` (ref factura) or `BD##-NNNNNNNN` (ref boleta)

Where `###` is a 3-digit series number and `NNNNNNNN` is an 8-digit correlative.

#### 1.4.3 XML UBL 2.1 Format

All CPEs must be formatted as XML documents following the UBL 2.1 (Universal Business Language) standard, with SUNAT-specific extensions. Key XML namespaces:

```xml
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2"
         xmlns:ds="http://www.w3.org/2000/09/xmldsig#"
         xmlns:sac="urn:sunat:names:specification:ubl:peru:schema:xsd:SunatAggregateComponents-1">
```

Required elements for a Factura:
- `cbc:UBLVersionID` → "2.1"
- `cbc:CustomizationID` → "2.0" (SUNAT version)
- `cbc:ID` → Series-correlative (e.g., "F001-00000001")
- `cbc:IssueDate`, `cbc:IssueTime`
- `cbc:InvoiceTypeCode` → "01" (factura), "03" (boleta)
- `cbc:DocumentCurrencyCode` → "PEN", "USD"
- `cac:Signature` → Digital signature reference
- `cac:AccountingSupplierParty` → Emisor (RUC, razón social, dirección)
- `cac:AccountingCustomerParty` → Receptor (RUC/DNI, nombre)
- `cac:TaxTotal` → IGV amount, ISC if applicable
- `cac:LegalMonetaryTotal` → Totals (line extension, tax inclusive, payable)
- `cac:InvoiceLine` → Line items (quantity, unit price, description, tax)

#### 1.4.4 Digital Signing

CPEs must be signed with a digital certificate (Certificado Digital Tributario — CDT):
- **Format**: X.509 v3 certificate in PKCS#12 (.pfx/.p12) format
- **Signing algorithm**: RSA-SHA256 (XMLDSig enveloped signature)
- **Location**: `ext:UBLExtensions/ext:UBLExtension/ext:ExtensionContent/ds:Signature`
- **Providers**: Certificates from SUNAT-authorized entities (e.g., RENIEC, Camerfirma, Certidigital)

The signing flow:
1. Generate the XML document (without signature)
2. Canonicalize the XML (C14N)
3. Compute SHA-256 digest of the canonicalized XML
4. Sign the digest with the private key (RSA-SHA256)
5. Insert the `ds:Signature` element into `ext:UBLExtensions`

#### 1.4.5 Submission Paths

There are three ways to submit CPEs to SUNAT:

| Path | Description | Use Case |
|------|------------|----------|
| **Directo a SUNAT** | Submit XML directly to SUNAT web services (SOAP) | Large enterprises with in-house IT |
| **OSE** (Operador de Servicios Electrónicos) | Submit via authorized third-party operator who validates and forwards to SUNAT | Medium businesses, guaranteed SLA |
| **PSE** (Proveedor de Servicios Electrónicos) | Third-party builds and submits the CPE on behalf of the business | SMBs — **recommended for Yaya Platform** |

**Yaya Platform uses the PSE path**: we send structured JSON data to a PSE provider's REST API, which handles XML generation, signing, and SUNAT submission. This eliminates the need to manage digital certificates or XML generation ourselves.

#### 1.4.6 Submission Flow

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌────────┐
│ Yaya Agent   │────▶│ invoicing-mcp│────▶│ PSE Provider │────▶│ SUNAT  │
│ (via skill)  │     │ (MCP server) │     │ (REST API)   │     │        │
└─────────────┘     └──────────────┘     └──────────────┘     └────────┘
       │                    │                    │                   │
       │  create_invoice()  │                    │                   │
       │───────────────────▶│  POST /invoice     │                   │
       │                    │───────────────────▶│ Generate XML UBL  │
       │                    │                    │ Sign with CDT      │
       │                    │                    │ Submit to SUNAT   │
       │                    │                    │──────────────────▶│
       │                    │                    │                   │ Validate
       │                    │                    │   CDR (response)  │ & Store
       │                    │                    │◀──────────────────│
       │                    │  CDR + PDF + hash  │                   │
       │                    │◀───────────────────│                   │
       │   Result (JSON)    │                    │                   │
       │◀───────────────────│                    │                   │
```

**CDR** (Constancia de Recepción) is SUNAT's acknowledgment:
- **Aceptada**: Document accepted by SUNAT (código 0)
- **Aceptada con observaciones**: Accepted with warnings (códigos 100-1999)
- **Rechazada**: Rejected due to errors (códigos 2000+)

#### 1.4.7 SUNAT Environments

| Environment | SOAP Endpoint | REST (via PSE) |
|------------|---------------|----------------|
| **Beta** (testing) | `https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService` | Provider-specific beta URL |
| **Production** | `https://e-factura.sunat.gob.pe/ol-ti-itcpfegem/billService` | Provider-specific production URL |

Beta environment accepts any valid XML structure with test RUCs (e.g., 20000000001).

#### 1.4.8 Resumen Diario & Comunicación de Baja

| Document | Código | Purpose | Deadline |
|----------|--------|---------|----------|
| **Resumen Diario** | RC | Daily summary of boletas issued (batched submission) | Next business day after issuance |
| **Comunicación de Baja** | RA | Void/annul one or more invoices | Up to 7 days after issuance |

- Boletas are NOT sent individually to SUNAT — they are batched in a Resumen Diario
- Facturas ARE sent individually and receive immediate CDR
- Both Resumen Diario and Comunicación de Baja are asynchronous: submit → get ticket → poll for result

### 1.5 Third-Party PSE/OSE API Providers

These REST API providers handle XML generation, signing, and SUNAT submission:

| Provider | URL | Pricing | Features |
|----------|-----|---------|----------|
| **Nubefact** | nubefact.com | From S/49/mes | REST API, dashboard, PDF generation |
| **API Perú** | apisperu.com | Pay-per-document | REST API, open-source PHP library |
| **API SUNAT** | apisunat.pe | Free tier available | REST API, RUC/DNI lookup |
| **Greenter** | greenter.dev | Open source | PHP library for XML generation/signing (self-hosted) |
| **Efact** | efact.pe | Enterprise | Full PSE/OSE, REST + SOAP |

**Recommended for Yaya Platform**: Use Nubefact or similar PSE REST API provider for simplicity. The `invoicing-mcp` server abstracts the provider behind an adapter interface.

### 1.6 Auxiliary SUNAT Services

| Service | Description | Use in Yaya |
|---------|-------------|-------------|
| **RUC Lookup** | Validate RUC and get empresa info (razón social, dirección, estado, régimen) | Before issuing factura — verify RUC is active |
| **DNI Lookup** | Validate DNI and get name (via RENIEC) | Before issuing boleta to identified consumer |
| **Tipo de Cambio** | Official SUNAT exchange rate USD/PEN for the day | Multi-currency invoices, USD transactions |

These services are available via third-party APIs (apisunat.pe, apisperu.com) since SUNAT doesn't offer a direct public REST API for lookups.

---

## 2. Multi-Country Adapter Architecture

### 2.1 Design Philosophy

Each country's tax authority has different requirements for electronic invoicing:
- **Document format**: Peru uses UBL 2.1 XML; Mexico uses CFDI 4.0 XML; Colombia uses UBL 2.1 but with DIAN extensions
- **Signing**: Each country has its own certificate requirements and signing flows
- **Submission**: SOAP vs REST, direct vs intermediary (PSE/PAC)
- **Tax types**: IGV (Peru), IVA (Mexico/Colombia), IVA (Ecuador), different rates and rules

The adapter pattern isolates country-specific logic so the MCP tools remain identical regardless of country.

### 2.2 Country Adapter Interface

```typescript
interface CountryAdapter {
  readonly countryCode: string;  // ISO 3166-1 alpha-2: "PE", "MX", "EC", "CO", "AR"
  readonly countryName: string;
  readonly currency: string;     // ISO 4217: "PEN", "MXN", "USD", "COP", "ARS"

  // Document operations
  createInvoice(data: InvoiceData): Promise<InvoiceResult>;
  createCreditNote(data: CreditNoteData): Promise<DocumentResult>;
  createDebitNote(data: DebitNoteData): Promise<DocumentResult>;
  voidInvoice(data: VoidData): Promise<VoidResult>;
  getDailySummary(date: string): Promise<SummaryResult>;

  // Lookups
  validateTaxId(taxId: string): Promise<TaxIdInfo>;
  getExchangeRate(from: string, to: string, date?: string): Promise<ExchangeRateResult>;

  // Metadata
  getDocumentTypes(): DocumentTypeInfo[];
  getTaxRates(): TaxRateInfo[];
  getTaxObligations(regime: string): TaxObligation[];
  calculateTax(params: TaxCalculationParams): TaxCalculationResult;
}
```

### 2.3 Country Adapters

#### Peru Adapter (v1 — Implemented)

- **Tax authority**: SUNAT
- **Document format**: UBL 2.1 XML (generated by PSE)
- **Signing**: X.509 CDT, RSA-SHA256 (handled by PSE)
- **Submission**: REST API to PSE provider (Nubefact, API Perú, etc.)
- **Tax types**: IGV (18%), ISC (variable), ICBPER (S/0.50 per bolsa plástica)
- **Tax ID**: RUC (11 digits) for businesses, DNI (8 digits) for individuals
- **Document types**: Factura (01), Boleta (03), Nota Crédito (07), Nota Débito (08), Guía Remisión (09/31)

#### Mexico Adapter (Future)

- **Tax authority**: SAT (Servicio de Administración Tributaria)
- **Document format**: CFDI 4.0 XML (Comprobante Fiscal Digital por Internet)
- **Signing**: CSD (Certificado de Sello Digital), FIEL for auth
- **Submission**: Via PAC (Proveedor Autorizado de Certificación) — equivalent to Peru's PSE
- **Tax types**: IVA (16%), ISR (variable by regime), IEPS (variable by product)
- **Tax ID**: RFC (13 chars persona física, 12 chars persona moral)
- **Key difference**: Complemento de Pago for payment tracking, Carta Porte for shipping

#### Ecuador Adapter (Future)

- **Tax authority**: SRI (Servicio de Rentas Internas)
- **Document format**: XML with SRI schema
- **Signing**: Electronic signature (firma electrónica) via BCE or Security Data
- **Submission**: Direct to SRI web services (offline + online modes)
- **Tax types**: IVA (15%), IR (variable), ICE (variable)
- **Tax ID**: RUC (13 digits), Cédula (10 digits)
- **Key difference**: Supports offline mode with claves de contingencia

#### Colombia Adapter (Future)

- **Tax authority**: DIAN (Dirección de Impuestos y Aduanas Nacionales)
- **Document format**: UBL 2.1 XML with DIAN extensions
- **Signing**: Digital certificate from authorized CA
- **Submission**: Via technological provider or direct to DIAN
- **Tax types**: IVA (19%), ICA (variable by municipality), Retefuente (variable)
- **Tax ID**: NIT (9 digits + verification digit)
- **Key difference**: CUFE (Código Único de Factura Electrónica) unique per document

#### Argentina Adapter (Future)

- **Tax authority**: AFIP / ARCA (Agencia de Recaudación y Control Aduanero)
- **Document format**: Custom XML for WSFE (Web Service Factura Electrónica)
- **Signing**: Certificado digital AFIP (X.509)
- **Submission**: Direct to AFIP SOAP web services (WSAA for auth, WSFE for invoicing)
- **Tax types**: IVA (21%, 10.5%, 27%), Ingresos Brutos (variable by province), Ganancias
- **Tax ID**: CUIT (11 digits)
- **Key difference**: Two-step auth (WSAA token + WSFE), Monotributo simplified regime

### 2.4 Common Data Model

```typescript
// Shared across all country adapters
interface InvoiceData {
  document_type: string;       // Country-specific code ("01", "03", etc.)
  series?: string;             // Series prefix (auto-assigned if omitted)
  currency: string;            // ISO 4217
  exchange_rate?: number;      // If currency != country default
  issue_date?: string;         // ISO 8601, defaults to today
  due_date?: string;           // Payment due date
  customer: CustomerData;
  items: LineItem[];
  notes?: string;
  purchase_order?: string;     // Customer PO reference
  payment_terms?: string;
}

interface CustomerData {
  tax_id: string;              // RUC, RFC, NIT, CUIT, etc.
  tax_id_type: string;         // "RUC", "DNI", "CE", "RFC", "NIT", etc.
  legal_name: string;          // Razón social
  trade_name?: string;         // Nombre comercial
  address?: Address;
  email?: string;
}

interface LineItem {
  description: string;
  quantity: number;
  unit_code: string;           // UN/ECE code: "NIU" (units), "KGM" (kg), "ZZ" (service)
  unit_price: number;          // Price before tax
  tax_type?: string;           // "IGV", "IVA", "EXO" (exonerated), "INA" (inafecto)
  tax_rate?: number;           // Override default (e.g., 0 for exonerated)
  discount?: number;           // Discount amount per unit
  item_code?: string;          // Internal reference
}

interface Address {
  street: string;
  district?: string;
  city: string;
  state: string;
  country: string;             // ISO 3166-1 alpha-2
  postal_code?: string;
  ubigeo?: string;             // Peru: 6-digit UBIGEO code
}
```

### 2.5 Architecture Diagram

```
┌──────────────────────────────────────────────────────────┐
│                      MCP Tools Layer                      │
│  create_invoice | create_credit_note | void_invoice | ... │
└───────────────────────────┬──────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────┐
│                    Adapter Registry                       │
│         getAdapter(country) → CountryAdapter              │
└───────┬──────────┬──────────┬──────────┬─────────────────┘
        │          │          │          │
        ▼          ▼          ▼          ▼
  ┌──────────┐ ┌────────┐ ┌────────┐ ┌────────┐
  │ Peru     │ │ Mexico │ │ Ecuador│ │Colombia│  ...
  │ Adapter  │ │ Adapter│ │ Adapter│ │ Adapter│
  │ (SUNAT)  │ │ (SAT)  │ │ (SRI)  │ │ (DIAN) │
  └────┬─────┘ └───┬────┘ └───┬────┘ └───┬────┘
       │           │          │           │
       ▼           ▼          ▼           ▼
  ┌──────────┐ ┌────────┐ ┌────────┐ ┌────────┐
  │ PSE API  │ │PAC API │ │SRI WS  │ │DIAN WS │
  │(Nubefact)│ │(Factur)│ │        │ │        │
  └──────────┘ └────────┘ └────────┘ └────────┘
```

---

## 3. MCP Server Configuration

### 3.1 Environment Variables

**Global:**

| Variable | Default | Description |
|----------|---------|-------------|
| `INVOICE_COUNTRY` | `PE` | ISO 3166-1 alpha-2: PE, MX, CO, PA |
| `INVOICE_SERIES_FACTURA` | `F001` | Default series for facturas (Peru) |
| `INVOICE_SERIES_BOLETA` | `B001` | Default series for boletas (Peru) |

**Peru (APISUNAT.pe):**

| Variable | Description |
|----------|-------------|
| `APISUNAT_EMAIL` | Login email |
| `APISUNAT_PASSWORD` | Login password |
| `APISUNAT_RUC` | Issuer RUC (11 digits) |
| `APISUNAT_RAZON_SOCIAL` | Issuer legal name |
| `APISUNAT_ENVIRONMENT` | `beta` (default) or `production` |

**Mexico (Facturapi):**

| Variable | Description |
|----------|-------------|
| `FACTURAPI_API_KEY` | `sk_test_...` or `sk_live_...` |

**Colombia (MATIAS):**

| Variable | Description |
|----------|-------------|
| `MATIAS_CLIENT_ID` | OAuth client ID |
| `MATIAS_CLIENT_SECRET` | OAuth client secret |

**Panama (eFacturaPTY):**

| Variable | Description |
|----------|-------------|
| `EFACTURA_API_URL` | API base URL |
| `EFACTURA_USER` | API username |
| `EFACTURA_PASSWORD` | API password |
| `EFACTURA_ENVIRONMENT` | `1` (production) or `2` (test, default) |

### 3.2 Docker Integration

```yaml
invoicing-mcp:
  build:
    context: ../../mcp-servers/invoicing-mcp
    dockerfile: Dockerfile
  environment:
    INVOICE_COUNTRY: PE
    APISUNAT_EMAIL: ${APISUNAT_EMAIL}
    APISUNAT_PASSWORD: ${APISUNAT_PASSWORD}
    APISUNAT_RUC: ${APISUNAT_RUC}
    APISUNAT_RAZON_SOCIAL: ${APISUNAT_RAZON_SOCIAL}
    APISUNAT_ENVIRONMENT: ${APISUNAT_ENVIRONMENT:-beta}
  networks:
    - yaya-net
```

### 3.3 MCP Tool Summary

| Tool | Description | Countries |
|------|------------|-----------|
| `create_invoice` | Create invoice or receipt | PE, MX, CO, PA |
| `create_credit_note` | Issue credit note against existing document | PE, MX, CO, PA |
| `create_debit_note` | Issue debit note against existing document | PE, MX, CO, PA |
| `void_invoice` | Void/annul a document | PE, MX, CO, PA |
| `get_daily_summary` | Generate daily batch summary (Peru boletas) | PE (others: n/a) |
| `lookup_tax_id` | Validate RUC/RFC/NIT/cédula and get entity data | PE, MX, CO, PA |
| `get_invoice_status` | Check document submission status | PE, MX, CO, PA |
| `list_invoices` | List issued invoices with filters | PE, MX, CO, PA |
| `get_tax_obligations` | Get obligations for a business regime | PE, MX, CO, PA |
| `calculate_tax` | Calculate tax payable for given revenue | PE, MX, CO, PA |
| `health_check` | Check provider connectivity and auth | PE, MX, CO, PA |

---

## 4. Tax Calculation Reference

### 4.1 IGV Calculation

```
IGV = Valor Venta × 0.18
Precio Venta = Valor Venta + IGV = Valor Venta × 1.18

// Reverse from precio venta:
Valor Venta = Precio Venta / 1.18
IGV = Precio Venta - Valor Venta
```

### 4.2 Monthly Tax Payment (RER/RMT)

```
// RER
Renta Mensual = Ingresos Netos × 0.015
IGV a Pagar = IGV Ventas - IGV Compras (crédito fiscal)

// RMT (hasta 300 UIT)
Renta Mensual = Ingresos Netos × 0.01
IGV a Pagar = IGV Ventas - IGV Compras

// RMT (más de 300 UIT)
Renta Mensual = Ingresos Netos × 0.015
IGV a Pagar = IGV Ventas - IGV Compras
```

### 4.3 Annual Renta (RMT/RG)

```
// RMT Renta Anual (escala progresiva)
Hasta 15 UIT:   10%
Más de 15 UIT:  29.5%

// RG Renta Anual
Renta Neta × 29.5%
Minus: pagos a cuenta mensuales realizados
```

---

## 5. Security Considerations

- **PSE tokens**: Stored as environment variables, never logged or exposed via MCP responses
- **Digital certificates**: Managed by the PSE provider, not stored in Yaya Platform
- **PII handling**: RUC/DNI data is transient — used for validation and document creation, not stored beyond what's in ERPNext
- **Audit trail**: All invoicing operations logged with timestamps and SUNAT CDR references
- **Rate limiting**: PSE providers enforce their own limits; `invoicing-mcp` adds local rate limiting to prevent accidental floods
- **Beta/Production separation**: Environment variable controls which endpoint is used; defaults to beta to prevent accidental production submissions

---

## 6. Multi-Country Provider Adapters (v1.0)

As of v1.0, the invoicing MCP server uses a **Provider Adapter Pattern** supporting 4 countries with dedicated API providers. All Gosocket references have been removed.

### 6.1 File Structure

```
mcp-servers/invoicing-mcp/src/
├── index.ts                        # MCP server (tools + routing)
├── types.ts                        # Universal shared types
└── adapters/
    ├── base.ts                     # Abstract adapter interface
    ├── registry.ts                 # Adapter registry (factory)
    ├── peru-apisunat.ts            # Peru via APISUNAT.pe (FULL)
    ├── mexico-facturapi.ts         # Mexico via Facturapi (stub)
    ├── colombia-matias.ts          # Colombia via MATIAS API (stub)
    └── panama-efactura.ts          # Panama via eFacturaPTY (stub)
```

### 6.2 Provider Summary

| Country | Provider | API Base | Auth | Tax | Status |
|---------|----------|----------|------|-----|--------|
| **Peru (PE)** | APISUNAT.pe | `back.apisunat.com` | JWT (email/password login) | IGV 18% | **FULL** |
| **Mexico (MX)** | Facturapi | `facturapi.io/v2` | API Key (Bearer) | IVA 16% | Stub |
| **Colombia (CO)** | MATIAS API | `api.matias-api.com` | OAuth 2.0 (client credentials) | IVA 19% | Stub |
| **Panama (PA)** | eFacturaPTY | Configurable | User/password login | ITBMS 7% | Stub |

### 6.3 Peru — APISUNAT.pe (Full Implementation)

**Provider**: APISUNAT.pe (also known as apisunat.com / Lucode)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/login` | POST | Auth with email/password → JWT token |
| `/api/v1/invoice/send` | POST | Send invoice/credit note/debit note/void/summary |
| `/api/v1/invoice/xml` | POST | Generate XML only (no SUNAT submission) |
| `/api/v1/invoice/pdf/{hash}` | GET | Get PDF for a document |
| `/api/v1/invoice/status/{id}` | GET | Check document status |
| `/api/v1/invoice/list` | GET | List invoices with filters |
| `/api/v1/ruc/{ruc}` | GET | RUC lookup (business info) |
| `/api/v1/dni/{dni}` | GET | DNI lookup (person name) |

**Key details**:
- Document types: 01=Factura, 03=Boleta, 07=Nota Crédito, 08=Nota Débito
- Series: F###-NNNNNNNN (factura), B###-NNNNNNNN (boleta)
- Environment: beta (free testing, 20 docs/month) or production (paid plans from S/8)
- No digital certificate needed (PSE uses their own)
- Plans: S/8 (100 docs), S/15 (200), S/21 (300), S/35 (700)

**Environment variables**:
```
APISUNAT_EMAIL=your@email.com
APISUNAT_PASSWORD=yourpassword
APISUNAT_RUC=20123456789
APISUNAT_RAZON_SOCIAL=Mi Empresa S.A.C.
APISUNAT_ENVIRONMENT=beta    # or production
```

### 6.4 Mexico — Facturapi (Stub)

**Provider**: Facturapi (facturapi.io)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v2/invoices` | POST | Create CFDI (ingreso, egreso, pago) |
| `/v2/customers` | POST | Create/validate customer |
| `/v2/invoices/{id}/pdf` | GET | Download PDF |
| `/v2/invoices/{id}/xml` | GET | Download XML |
| `/v2/invoices/{id}/zip` | GET | Download ZIP (PDF + XML) |
| `/v2/invoices/{id}` | DELETE | Cancel CFDI (with motive code) |

**Key details**:
- CFDI 4.0, timbrado by PAC (Proveedor Autorizado de Certificación)
- Cancel motives: 01=con relación, 02=sin relación, 03=no se realizó, 04=global
- Test keys: `sk_test_...`, Live keys: `sk_live_...`
- Complemento de Pago for payment tracking

**Environment variables**:
```
FACTURAPI_API_KEY=sk_test_xxxxx    # or sk_live_xxxxx
```

### 6.5 Colombia — MATIAS API (Stub)

**Provider**: MATIAS API (matias-api.com)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/oauth/token` | POST | OAuth 2.0 token (client credentials) |
| `/invoice` | POST | Create FE, NC, ND, DS, NE |
| `/invoice/{key}/status` | GET | Check document status |

**Key details**:
- Tax authority: DIAN (Dirección de Impuestos y Aduanas Nacionales)
- CUFE (Código Único de Factura Electrónica) per document
- Document types: FE (factura), NC (nota crédito), ND (nota débito), DS (documento soporte), NE (nómina)
- Plans from 96,000 COP/year (500 docs)
- DIAN does not support direct void — requires nota de crédito

**Environment variables**:
```
MATIAS_CLIENT_ID=your_client_id
MATIAS_CLIENT_SECRET=your_client_secret
```

### 6.6 Panama — eFacturaPTY (Stub)

**Provider**: eFacturaPTY

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/login` | POST | Auth with user/password |
| `/fe/invoice` | POST | Send invoice (XML + signature + PAC auth) |
| `/fe/status/{cufe}` | GET | Check by CUFE |
| `/fe/void` | POST | Void document |

**Key details**:
- Tax authority: DGI (Dirección General de Ingresos)
- CUFE (Código Único de Factura Electrónica) per document
- ITBMS rates: 7% general, 10% alcohol/hospitality, 15% tobacco
- Environments: 1=production, 2=test
- PAB (Balboa) at parity with USD (both legal tender)
- Panama uses territorial tax system (only local-source income taxed)

**Environment variables**:
```
EFACTURA_API_URL=https://api.efacturapty.com
EFACTURA_USER=your_user
EFACTURA_PASSWORD=your_password
EFACTURA_ENVIRONMENT=2    # 1=production, 2=test
```

### 6.7 Adding a New Country

To add a new country adapter:

1. Create `adapters/{country}-{provider}.ts` implementing `CountryAdapter` from `base.ts`
2. Register it in `adapters/registry.ts`
3. Set `INVOICE_COUNTRY={code}` to activate

The MCP tools (index.ts) require **no changes** — they delegate to the adapter.

---

## 7. Roadmap

| Phase | Scope | Status |
|-------|-------|--------|
| **v1.0** | Peru via APISUNAT.pe (full), MX/CO/PA stubs | **Current** |
| **v1.1** | Mexico via Facturapi (activate) | Next |
| **v1.2** | Colombia via MATIAS (activate) | Planned |
| **v1.3** | Panama via eFacturaPTY (activate) | Planned |
| **v2.0** | Ecuador — SRI electronic invoicing | Future |
| **v2.1** | Argentina — AFIP/ARCA WSFE | Future |
