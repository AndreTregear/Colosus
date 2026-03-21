# SUNAT & Nubefact Technical Integration: Building WhatsApp-Based Electronic Invoicing for Peruvian SMBs

**Date:** 2026-03-21  
**Author:** Yaya Platform Research  
**Status:** Research Document  

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [SUNAT Electronic Invoicing Requirements](#2-sunat-electronic-invoicing-requirements)
3. [OSE and PSE: The Intermediary Ecosystem](#3-ose-and-pse-the-intermediary-ecosystem)
4. [Nubefact as a Leading PSE/OSE](#4-nubefact-as-a-leading-pseose)
5. [Technical Integration Requirements](#5-technical-integration-requirements)
6. [Nubefact API Deep Dive](#6-nubefact-api-deep-dive)
7. [Pricing Tiers and Rate Limits](#7-pricing-tiers-and-rate-limits)
8. [WhatsApp-Based Invoice Automation](#8-whatsapp-based-invoice-automation)
9. [Compliance Requirements](#9-compliance-requirements)
10. [Alternative PSEs: Comparison](#10-alternative-pses-comparison)
11. [Common Integration Pitfalls and Best Practices](#11-common-integration-pitfalls-and-best-practices)
12. [Timeline and Cost Estimates](#12-timeline-and-cost-estimates)
13. [Sources](#13-sources)

---

## 1. Introduction

Peru's tax authority, SUNAT (Superintendencia Nacional de Aduanas y de Administración Tributaria), mandates electronic invoicing for an expanding universe of taxpayers. For a WhatsApp-based AI business platform targeting Peruvian SMBs and microenterprises, integrating SUNAT-compliant electronic invoicing is not optional—it's the core value proposition. This document analyzes the technical landscape, focusing on Nubefact as the primary PSE/OSE integration partner, and maps out a concrete path to building conversational invoice generation.

The opportunity is significant: Peru has over 2.3 million active RUC holders, the vast majority being small and micro enterprises. Many of these businesses still struggle with the complexity of electronic invoicing, creating a natural market for a WhatsApp-native solution that abstracts away the technical burden.

---

## 2. SUNAT Electronic Invoicing Requirements

### 2.1 Mandatory Electronic Document Types

SUNAT requires the following electronic documents (Comprobantes de Pago Electrónicos - CPE):

| Document Type | Code | Series Prefix | Use Case |
|---|---|---|---|
| **Factura Electrónica** | 1 | F (e.g., F001) | B2B sales, tax credit eligible |
| **Boleta de Venta Electrónica** | 2 | B (e.g., B001) | B2C sales, end consumers (DNI or anonymous) |
| **Nota de Crédito Electrónica** | 3 | F/B prefix | Corrections, returns, discounts on issued invoices |
| **Nota de Débito Electrónica** | 4 | F/B prefix | Interest charges, additional charges |
| **Comunicación de Baja** | — | — | Voiding previously issued documents |
| **Resumen Diario de Boletas** | — | — | Daily summary of boletas sent to SUNAT |

**Key distinctions:**
- **Facturas** require the buyer's RUC (11-digit tax ID) and are used between registered businesses. They generate tax credit (crédito fiscal) for IGV purposes.
- **Boletas** are issued to end consumers, identified by DNI (8 digits) or without identification for amounts under S/700. They do NOT generate tax credit.
- **Notas de Crédito** must reference the original document (type, series, number) and specify a reason code (e.g., `01` = anulación, `02` = corrección por error en descripción, etc.).
- **Notas de Débito** similarly reference the original and have reason codes (e.g., `01` = intereses por mora, `02` = aumento en el valor).

### 2.2 Tax Regime Fundamentals

- **IGV (Impuesto General a las Ventas):** 18% (16% IGV + 2% IPM) — applied to most goods and services.
- **Operations types:** Gravadas (taxed), Exoneradas (exempt), Inafectas (not subject to tax), Gratuitas (free transfers).
- **Currency:** Primary is PEN (Soles), but USD and EUR are supported with mandatory exchange rate (`tipo_de_cambio`).
- **ISC (Impuesto Selectivo al Consumo):** Applies to specific goods (fuel, alcohol, tobacco, vehicles).

### 2.3 UBL 2.1 Standard

Since September 2019 (per Resolución N° 133-2019/SUNAT), all electronic documents must comply with **UBL 2.1** (Universal Business Language). UBL 2.0 is no longer accepted. This affects the XML schema for all document types: facturas, boletas, notas de crédito/débito.

The UBL 2.1 migration was originally mandated by Resolución N° 164-2018/SUNAT:
- Emitters starting from October 1, 2018 onward: must use UBL 2.1 exclusively.
- Pre-existing emitters: had until March 2019 (later extended to September 2019) to migrate.

**For our platform:** Since we integrate via Nubefact's API (which abstracts the XML generation), we don't need to generate UBL 2.1 XML directly. Nubefact handles XML creation, digital signing, SUNAT submission, and CDR storage. We only need to send structured JSON or TXT data.

---

## 3. OSE and PSE: The Intermediary Ecosystem

### 3.1 PSE — Proveedor de Servicios Electrónicos

A PSE is an entity authorized by SUNAT to **emit electronic documents on behalf of the taxpayer**. Key characteristics:

- Uses **its own digital certificate** to sign documents (the taxpayer doesn't need to acquire one).
- The taxpayer must authorize the PSE via SUNAT Operaciones en Línea (Clave SOL) by performing an "alta de PSE."
- **Responsibility for document content remains with the emitter** (the business), not the PSE.
- PSEs must hold ISO/IEC-27001 certification.
- As of February 2026, there are 60+ authorized PSEs in SUNAT's official registry.
- Nubefact S.A. (RUC: 20600695771) has been authorized as PSE since May 24, 2016 (Resolución 034-005-0005315).

### 3.2 OSE — Operador de Servicios Electrónicos

An OSE is authorized by SUNAT to **validate and authorize** electronic documents. Where PSEs handle generation and signing, OSEs handle the validation step that would otherwise go through SUNAT's own servers.

- OSEs verify that CPEs comply with SUNAT's technical and business rules.
- They issue the **CDR (Constancia de Recepción)** confirming acceptance.
- Documents validated by an OSE with CDR are **legally valid for all purposes** (Resolución N° 117-2017).
- OSE authorization requirements are stricter: minimum capital of S/1,650,000, legal compliance checks, satisfactory test process with SUNAT.
- As of February 2026, there are ~20 authorized OSEs.
- Nubefact S.A. has been authorized as OSE since April 2, 2019 (Resolución 034-005-0011863).

### 3.3 Why This Matters for Our Platform

Being both PSE and OSE means Nubefact can handle the **entire lifecycle**:
1. **Generate** the XML from our JSON input
2. **Sign** it with their digital certificate
3. **Validate** it against SUNAT rules
4. **Issue CDR** confirming acceptance
5. **Store** PDF, XML, and CDR in the cloud
6. **Report** to SUNAT

This single-vendor approach simplifies our integration significantly—one API call handles everything.

---

## 4. Nubefact as a Leading PSE/OSE

### 4.1 Company Overview

- **Legal name:** NUBEFACT S.A.
- **RUC:** 20600695771
- **Address:** Calle Mártir José Olaya 129, Oficina 902, Miraflores, Lima
- **Contact:** +51 01 468 3535, WhatsApp: 987-281873
- **Website:** www.nubefact.com
- **Authorization:** PSE since 2016, OSE since 2019
- **Supported languages/frameworks:** PHP, Java, C#, VB.NET, Visual Basic, Visual FoxPro, Ruby, Python, and any language with HTTP capabilities

### 4.2 Why Nubefact for Our Platform

1. **Dual PSE + OSE authorization** — single integration point
2. **Simple REST API** — JSON or TXT input, no XML generation needed on our side
3. **Digital certificate included** in pricing — no separate purchase required
4. **Demo environment** available for testing (demo.nubefact.com)
5. **Competitive pricing** for SMB volumes
6. **Reseller (white-label) program** available for platform builders
7. **Proven market presence** — trusted by thousands of Peruvian businesses

---

## 5. Technical Integration Requirements

### 5.1 Architecture Overview

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────┐
│   WhatsApp   │────▶│  Yaya AI      │────▶│  Nubefact    │────▶│  SUNAT   │
│   User       │◀────│  Platform     │◀────│  API (OSE)   │◀────│  Systems │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────┘
   Conversational      JSON payload         XML generation        CDR
   commands            construction          Signing               Validation
                                            Validation
                                            PDF generation
```

### 5.2 Integration Requirements

To integrate with Nubefact's API, you need exactly **3 elements**:

1. **RUTA (URL endpoint):** Unique per-account API URL  
   Format: `https://www.nubefact.com/api/v1/{unique-uuid}`  
   Demo: `https://demo.nubefact.com/api/v1/03989d1a-6c8c-4b71-b1cd-7d37001deaa0`

2. **TOKEN:** API authentication token  
   Demo: `d0a80b88cde446d092025465bdb4673e103a0d881ca6479ebbab10664dbc5677`

3. **Payload:** JSON or TXT file with document data

### 5.3 Authentication

```
POST {RUTA}
Headers:
  Authorization: Token token="{YOUR_TOKEN}"
  Content-Type: application/json    # for JSON format
  # OR
  Content-Type: text/plain          # for TXT format
```

### 5.4 Document Format Standards

Nubefact accepts two formats:

**JSON format** (recommended for our platform):
- Structured key-value pairs
- Supports nested objects for items, guides, credit terms
- Easier to construct programmatically

**TXT format** (pipe-delimited):
- Legacy format, still supported
- Each field separated by `|` pipes
- Items prefixed with `item|`

For a modern WhatsApp platform, **JSON is the clear choice**.

---

## 6. Nubefact API Deep Dive

### 6.1 Operations

| Operation | Code | Description |
|---|---|---|
| `generar_comprobante` | 1 | Generate invoice/boleta/note |
| `generar_anulacion` | 2 | Void a document (comunicación de baja) |
| `generar_resumen` | 3 | Generate daily summary (boletas) |
| `consultar_anulacion` | 4 | Check voiding status |

### 6.2 Document Type Codes

| Code | Document |
|---|---|
| 1 | Factura |
| 2 | Boleta de Venta |
| 3 | Nota de Crédito |
| 4 | Nota de Débito |

### 6.3 JSON Payload Example: Factura Electrónica

```json
{
  "operacion": "generar_comprobante",
  "tipo_de_comprobante": 1,
  "serie": "F001",
  "numero": 1,
  "sunat_transaction": 1,
  "cliente_tipo_de_documento": 6,
  "cliente_numero_de_documento": "20600695771",
  "cliente_denominacion": "EMPRESA DEMO S.A.C.",
  "cliente_direccion": "AV. LARCO 1234, MIRAFLORES - LIMA - PERU",
  "cliente_email": "cliente@empresa.com",
  "cliente_email_1": "",
  "cliente_email_2": "",
  "fecha_de_emision": "21-03-2026",
  "fecha_de_vencimiento": "21-04-2026",
  "moneda": 1,
  "tipo_de_cambio": "",
  "porcentaje_de_igv": 18.00,
  "descuento_global": "",
  "total_descuento": "",
  "total_anticipo": "",
  "total_gravada": 500.00,
  "total_inafecta": "",
  "total_exonerada": "",
  "total_igv": 90.00,
  "total_gratuita": "",
  "total_otros_cargos": "",
  "total": 590.00,
  "percepcion_tipo": "",
  "percepcion_base_imponible": "",
  "total_percepcion": "",
  "total_incluido_percepcion": "",
  "total_impuestos_bolsas": "",
  "detraccion": false,
  "observaciones": "",
  "documento_que_se_modifica_tipo": "",
  "documento_que_se_modifica_serie": "",
  "documento_que_se_modifica_numero": "",
  "tipo_de_nota_de_credito": "",
  "tipo_de_nota_de_debito": "",
  "enviar_automaticamente_a_la_sunat": true,
  "enviar_automaticamente_al_cliente": false,
  "condiciones_de_pago": "",
  "medio_de_pago": "",
  "placa_vehiculo": "",
  "orden_compra_servicio": "",
  "formato_de_pdf": "",
  "generado_por_contingencia": "",
  "bienes_region_selva": "",
  "servicios_region_selva": "",
  "items": [
    {
      "unidad_de_medida": "NIU",
      "codigo": "001",
      "codigo_producto_sunat": "10000000",
      "descripcion": "Servicio de consultoría",
      "cantidad": 1,
      "valor_unitario": 500.00,
      "precio_unitario": 590.00,
      "descuento": "",
      "subtotal": 500.00,
      "tipo_de_igv": 1,
      "igv": 90.00,
      "total": 590.00,
      "anticipo_regularizacion": false,
      "anticipo_documento_serie": "",
      "anticipo_documento_numero": ""
    }
  ],
  "guias": [],
  "venta_al_credito": []
}
```

### 6.4 API Response Example (Success)

```json
{
  "tipo_de_comprobante": 1,
  "serie": "F001",
  "numero": 1,
  "enlace": "https://www.nubefact.com/cpe/d268f882-4554-a403c6712e6",
  "enlace_del_pdf": "https://www.nubefact.com/...",
  "enlace_del_xml": "https://www.nubefact.com/...",
  "enlace_del_cdr": "https://www.nubefact.com/...",
  "aceptada_por_sunat": true,
  "sunat_description": "La Factura numero F001-1, ha sido aceptada",
  "sunat_note": "",
  "sunat_responsecode": "0",
  "codigo_hash": "xMLFMnbgp1/bHEy572RKRTE9hPY=",
  "cadena_para_codigo_qr": "20600695771|01|F001|1|90.00|590.00|...",
  "codigo_de_barras": ""
}
```

### 6.5 Key Field Reference

**Client document types (`cliente_tipo_de_documento`):**
| Code | Type |
|---|---|
| 0 | No documento (boletas < S/700) |
| 1 | DNI (8 digits) |
| 4 | Carné de Extranjería |
| 6 | RUC (11 digits) — required for Facturas |
| 7 | Pasaporte |
| A | Cédula Diplomática |

**Currency codes (`moneda`):**
| Code | Currency |
|---|---|
| 1 | Soles (PEN) |
| 2 | Dólares (USD) |
| 3 | Euros (EUR) |

**IGV types per item (`tipo_de_igv`):**
| Code | Type |
|---|---|
| 1 | Gravado - Operación Onerosa |
| 2 | Gravado - Retiro por premio |
| 8 | Exonerado - Operación Onerosa |
| 9 | Inafecto - Operación Onerosa |
| 11-16 | Gravado - Gratuita (various) |
| 17 | Exonerado - Transferencia Gratuita |

### 6.6 Nota de Crédito Example

```json
{
  "operacion": "generar_comprobante",
  "tipo_de_comprobante": 3,
  "serie": "F001",
  "numero": 1,
  "documento_que_se_modifica_tipo": 1,
  "documento_que_se_modifica_serie": "F001",
  "documento_que_se_modifica_numero": 1,
  "tipo_de_nota_de_credito": 1,
  "...": "remaining fields similar to factura"
}
```

**Nota de Crédito reason codes (`tipo_de_nota_de_credito`):**
- `1` = Anulación de la operación
- `2` = Anulación por error en RUC
- `3` = Corrección por error en la descripción
- `4` = Descuento global
- `5` = Descuento por ítem
- `6` = Devolución total
- `7` = Devolución por ítem
- `10` = Otros conceptos

---

## 7. Pricing Tiers and Rate Limits

### 7.1 Nubefact Pricing (as of 2026)

| Plan | Monthly (billed annually) | Documents/Month | Includes |
|---|---|---|---|
| **Online** | S/70.00*/month (S/700/year) | Up to 500 | Web UI, certificate, PDF/XML/CDR |
| **API Integration (JSON/TXT)** | S/70.00*/month (S/700/year) | Up to 500 | REST API access, certificate, PDF/XML/CDR |
| **OSE Validation (XML)** | S/40.00*/month (S/400/year) | Up to 500 | XML validation service |
| **Reseller OSE** | Per-consumption pricing | Variable | White-label, test + production environments |

*Prices include IGV (18%).*

**Overage pricing (from Odoo/Nubefact integration data):**
- 1,001 – 5,000 documents: S/0.02 per document
- 5,001 – 10,000 documents: S/0.018 per document
- 10,000+ documents: S/0.015 per document

### 7.2 Rate Limits

Nubefact does not publicly document specific API rate limits per second. Based on community reports:
- The API is synchronous — each request processes and returns a response (including SUNAT validation) before you send the next.
- Typical response times: 1-5 seconds per document.
- For bulk operations, sequential processing is expected.
- No documented hard rate limit per minute, but practical throughput is ~12-60 documents/minute.

### 7.3 Cost Analysis for Our Platform

For a WhatsApp platform serving SMBs:
- **Per-tenant model:** Each business gets their own Nubefact account (S/700/year ≈ $185/year)
- **Reseller model (preferred):** We get a single reseller account and provision sub-accounts — pricing based on total volume across all tenants
- **Expected volume:** 50-200 docs/month for a typical micro-enterprise

At reseller rates, a platform serving 100 businesses averaging 100 docs/month = 10,000 docs/month. At S/0.015-0.02 per document, that's approximately S/150-200/month in Nubefact costs.

---

## 8. WhatsApp-Based Invoice Automation

### 8.1 Conversational Flow Design

A WhatsApp user should be able to generate an invoice through natural conversation:

**Example Flow — Factura Generation:**
```
User: "Factura para Empresa ABC, RUC 20512345678"
Bot:  "📋 Creando factura para EMPRESA ABC S.A.C.
       (RUC verificado ✅)
       ¿Qué productos o servicios incluyo?"

User: "1 servicio de mantenimiento por 500 soles"
Bot:  "📝 Factura F001-00042
       Cliente: EMPRESA ABC S.A.C. (20512345678)
       ─────────────────
       1x Servicio de mantenimiento
         Subtotal: S/500.00
       ─────────────────
       Gravada:  S/500.00
       IGV (18%): S/90.00
       TOTAL:    S/590.00
       
       ¿Confirmo y envío a SUNAT? (Sí/No)"

User: "Sí"
Bot:  "✅ Factura F001-00042 emitida y aceptada por SUNAT
       📄 PDF: [link]
       📧 Enviada a: contacto@empresaabc.com
       Hash: xMLFMnbgp1..."
```

**Example Flow — Boleta Rápida:**
```
User: "Boleta 150 soles venta de productos"
Bot:  "📋 Boleta B001-00089
       Sin cliente identificado
       1x Venta de productos: S/127.12 + IGV S/22.88 = S/150.00
       ¿Confirmo? (Sí/No)"
```

### 8.2 Technical Architecture for WhatsApp Integration

```
WhatsApp Business API (Cloud API)
        │
        ▼
  Webhook Receiver (our server)
        │
        ▼
  NLP/Intent Parser (AI layer)
        │
   ┌────┴────────────┐
   │  Invoice Intent  │
   │  detected        │
   └────┬────────────┘
        │
        ▼
  Data Extraction & Validation
   • RUC lookup (SUNAT API)
   • Product/service mapping
   • Amount calculations (IGV)
   • Series/number sequencing
        │
        ▼
  JSON Payload Builder
        │
        ▼
  Nubefact API Call
        │
        ▼
  Response Handler
   • Success → send PDF link to user
   • Error → parse error, ask for correction
```

### 8.3 Key Implementation Components

1. **RUC Validation Service:** Query SUNAT's public API to validate RUC, retrieve razón social, and address. This enables autocomplete: user types "RUC 20512345678" and we auto-fill the company name.

2. **Automatic IGV Calculation:** The platform should calculate `total_gravada`, `total_igv`, and `total` automatically. Users speak in totals ("500 soles") — the platform needs to know if that's inclusive or exclusive of IGV and handle accordingly.

3. **Sequential Numbering:** Critical — each series (F001, B001) must have strictly sequential numbers without gaps. The platform must maintain a counter per series per tenant, with concurrency protection.

4. **Product Catalog:** SUNAT requires `codigo_producto_sunat` (UNSPSC codes). The platform should maintain a simple catalog per tenant and suggest codes based on descriptions.

5. **Error Recovery:** If Nubefact returns an error, the WhatsApp conversation should explain the issue in plain language and guide the user to correct it.

---

## 9. Compliance Requirements

### 9.1 RUC Validation

- Every Factura requires a valid RUC (11 digits, starts with 10 or 20).
- RUC must have estado = ACTIVO and condición = HABIDO in SUNAT's systems.
- Boletas require DNI (8 digits) or can be anonymous for amounts < S/700.
- Our platform **must** validate RUC/DNI before sending to Nubefact to avoid rejection.

### 9.2 SUNAT Homologation Process

When using a PSE like Nubefact, the **homologation process is simplified** — the PSE has already been homologated. The business only needs to:

1. Register as emisor electrónico via SUNAT Operaciones en Línea (Clave SOL)
2. Perform "alta de PSE" selecting Nubefact
3. Perform "vinculación de OSE" selecting Nubefact
4. Wait 24 hours for activation

**However**, when NOT using a PSE (SEE-Del Contribuyente), full homologation involves:
- Registering a digital certificate
- Sending 50+ test facturas and notas
- Sending 50+ test boletas and notas
- Testing comunicaciones de baja and resúmenes diarios
- SUNAT validates XML structure, digital signature, arithmetic calculations
- Process takes 25-30 calendar days
- Failed homologation requires restarting from scratch

**For our platform:** Since we use Nubefact as PSE+OSE, our users skip the full homologation. They only need to do the PSE/OSE alta in Clave SOL. We can guide them through this via WhatsApp with step-by-step instructions.

### 9.3 Nubefact's Internal Homologation

Before a Nubefact account goes to production, Nubefact requires the following test documents via API:
- 1 Factura in Soles
- 1 Factura in Dólares
- 1 Factura for exonerated/inafectas operations
- 1 Factura for export
- 1 Nota de Crédito modifying a Factura
- 1 Nota de Débito modifying a Factura
- 1 Combined Factura (gravada + inafecta/exonerada)
- 1 SUNAT status query for Factura
- Same set for Boletas (8+ test documents)
- 1 Comunicación de Baja for Factura and Boleta
- 1 Status query for Comunicación de Baja

This must be done in the demo environment before production activation.

### 9.4 Document Retention

- Electronic documents must be retained for **5 years** (SUNAT fiscal period).
- Nubefact stores PDF, XML, and CDR in the cloud.
- Our platform should maintain its own records as backup.

---

## 10. Alternative PSEs: Comparison

### 10.1 Efact S.A.C.

- **RUC:** 20551093035
- **Authorization:** PSE since October 2015, OSE since October 2017 (one of the earliest)
- **Target market:** Medium to large enterprises
- **Products:** Efact Web (portal), Efact Dynamic+ (ERP integration)
- **Strengths:** Long track record, SUNAT preferred for large taxpayers
- **Weaknesses:** Less accessible API documentation, enterprise pricing, less SMB-friendly
- **API:** SOAP/XML-based integration (more complex than Nubefact's REST)

### 10.2 Alegra

- **PSE/OSE:** Uses Bizlinks S.A.C. as underlying PSE+OSE (not its own)
- **Target market:** SMBs and pymes
- **Product:** Full cloud accounting + invoicing platform
- **Pricing:** Subscription-based (from ~S/49/month for basic plans)
- **Strengths:** Beautiful UI, complete accounting suite, excellent onboarding
- **Weaknesses:** Not a PSE itself (depends on Bizlinks), no direct API for third-party integration, closed ecosystem
- **Relevance:** More of a competitor to our end product than an integration partner

### 10.3 Bsale

- **Target market:** Retail SMBs (POS-focused)
- **Product:** Point-of-sale + electronic invoicing
- **Presence:** Chile origin, expanded to Peru and Mexico
- **Strengths:** Strong POS integration, inventory management
- **Weaknesses:** Less API flexibility, focused on its own POS ecosystem
- **Relevance:** Competitor in the retail SMB space

### 10.4 Bizlinks S.A.C.

- **RUC:** 20478005017
- **Authorization:** PSE since February 2016, OSE since June 2018
- **Target market:** Mid-market, also powers other platforms (like Alegra)
- **Strengths:** Dual PSE+OSE, ISO 27001, proven infrastructure
- **API:** Available but less documented publicly than Nubefact
- **Relevance:** Potential alternative integration partner

### 10.5 Comparison Matrix

| Feature | Nubefact | Efact | Bizlinks | Alegra |
|---|---|---|---|---|
| Own PSE | ✅ | ✅ | ✅ | ❌ (uses Bizlinks) |
| Own OSE | ✅ | ✅ | ✅ | ❌ (uses Bizlinks) |
| REST API (JSON) | ✅ | ❌ (SOAP) | Partial | ❌ |
| SMB pricing | S/70/mo | Enterprise | Negotiable | S/49+/mo |
| Digital cert included | ✅ | ❌ | ✅ | ✅ (via Bizlinks) |
| Demo environment | ✅ | Limited | ✅ | N/A |
| Reseller program | ✅ | ❌ | ✅ | ❌ |
| Integration complexity | Low | High | Medium | N/A |
| Public documentation | Excellent | Limited | Limited | N/A |

**Recommendation:** Nubefact is the optimal choice for our WhatsApp platform due to:
- Simplest REST API (JSON-based)
- Best public documentation and code examples
- Competitive SMB pricing
- Reseller program enabling multi-tenant architecture
- Digital certificate included (critical for micro-enterprises)

---

## 11. Common Integration Pitfalls and Best Practices

### 11.1 Pitfalls

1. **Sequential numbering gaps:** If you generate number 42 and it fails, you CANNOT reuse 42 or skip to 44. You must resolve the failure for 42 before proceeding. Implement atomic counter management with database-level locking.

2. **IGV arithmetic precision:** SUNAT validates that `total_gravada * 0.18 = total_igv` (within rounding tolerance). Use 2 decimal places for totals, up to 10 decimal places for unit values. Always calculate from unit prices, not from totals.

3. **Date format:** Nubefact expects `DD-MM-YYYY`, not ISO format. Common bug for developers accustomed to `YYYY-MM-DD`.

4. **Timezone issues:** Peru is UTC-5 with no daylight saving. Documents dated "tomorrow" will be rejected. Always use Peru timezone.

5. **RUC validation before submission:** Sending a factura with an invalid or inactive RUC wastes the sequential number. Always pre-validate.

6. **Demo vs Production URLs:** Demo uses `demo.nubefact.com`, production uses `www.nubefact.com`. Ensure environment switching is clean.

7. **Boleta daily summaries:** Boletas are not sent individually to SUNAT — they're batched in a "resumen diario." Nubefact handles this automatically when `enviar_automaticamente_a_la_sunat` is true, but you should understand the delay.

8. **Credit notes must reference existing documents:** A nota de crédito for F001-42 can only be issued if F001-42 was successfully accepted by SUNAT. Always verify the original document status first.

9. **Character encoding:** All text must be UTF-8. Special characters in company names (ñ, tildes) must be properly encoded.

10. **Concurrent requests:** Nubefact's API is synchronous. Don't fire parallel requests for the same account — they may conflict on sequential numbering.

### 11.2 Best Practices

1. **Implement idempotency:** Use `codigo_unico` field to prevent duplicate submissions. If a request times out, retry with the same `codigo_unico` — Nubefact will return the existing document instead of creating a duplicate.

2. **Store Nubefact responses completely:** Save the entire JSON response including `enlace`, `enlace_del_pdf`, `enlace_del_xml`, `enlace_del_cdr`, `codigo_hash`, and `cadena_para_codigo_qr`.

3. **Build a local document registry:** Don't rely solely on Nubefact for document history. Maintain your own database with status tracking.

4. **Handle async SUNAT responses:** Some documents (especially anulaciones) are processed asynchronously. Implement polling for status via `consultar_anulacion` operation.

5. **Cache RUC data:** Once validated, cache the company name and address for 24-48 hours to reduce SUNAT API calls.

6. **Round IGV correctly:** Use Peru's rounding rules — round to 2 decimal places with standard rounding. The sum of line items' IGV may differ by ±0.01 from `total_gravada * 0.18` — SUNAT allows this tolerance.

7. **Test all document types:** Before launch, ensure your integration handles: gravadas, exoneradas, inafectas, multi-currency, credit notes, debit notes, and anulaciones.

---

## 12. Timeline and Cost Estimates

### 12.1 Development Timeline

| Phase | Duration | Activities |
|---|---|---|
| **Phase 1: Setup & Sandbox** | 1-2 weeks | Nubefact account creation, demo environment setup, API exploration, basic JSON payload construction |
| **Phase 2: Core Integration** | 3-4 weeks | Invoice generation service, sequential numbering, IGV calculation engine, RUC validation, error handling |
| **Phase 3: WhatsApp Conversational Layer** | 3-4 weeks | Intent detection for invoice commands, conversational flows, confirmation dialogs, PDF delivery |
| **Phase 4: Nubefact Homologation** | 1-2 weeks | Generate all required test documents, resolve any rejections, pass Nubefact's internal review |
| **Phase 5: Tenant Onboarding** | 2-3 weeks | PSE/OSE alta guide for users, tenant provisioning, production testing with real businesses |
| **Phase 6: Polish & Launch** | 2-3 weeks | Edge cases, error recovery, monitoring, documentation |
| **TOTAL** | **12-18 weeks** | |

### 12.2 Cost Estimates

**Development costs:**
- Backend integration development: 200-300 hours
- WhatsApp conversational design: 80-120 hours  
- Testing and QA: 60-100 hours
- Total developer hours: ~400-500 hours

**Recurring infrastructure costs (per month, at 100 tenants):**

| Item | Monthly Cost |
|---|---|
| Nubefact reseller (est. 10K docs) | S/150-200 (~$40-55) |
| WhatsApp Business API (Meta Cloud) | $0-100 (conversation-based) |
| Server infrastructure | $50-150 |
| **Total monthly** | **~$100-300** |

**Per-tenant economics:**
- Nubefact cost per tenant: ~S/2-7/month (at volume)
- Potential charge to user: S/30-50/month (including platform fee)
- **Gross margin: 80-90%** on the invoicing feature alone

### 12.3 Critical Path Items

1. **Nubefact reseller agreement** — Must be negotiated early; contact ose@nubefact.com or soporte@nubefact.com
2. **SUNAT PSE/OSE alta automation** — The manual Clave SOL process is a friction point for onboarding; consider creating video guides or even automating via RPA if legally permissible
3. **Sequential number management** — Must be bulletproof from day one; data corruption here means SUNAT compliance issues

---

## 13. Sources

### Official SUNAT Documentation
1. SUNAT - Guías y Manuales UBL 2.1: https://orientacion.sunat.gob.pe/7065-guias-y-manuales
2. SUNAT - Condiciones para incorporarse al SEE: https://orientacion.sunat.gob.pe/13-condiciones-para-incorporarse-el-sistema-de-emision-electronica
3. SUNAT - Guía de Homologación CPE: https://www.sunat.gob.pe/orientacion/comprobantesPago/pagoElectronico/guiaHomologacion-GEM.pdf
4. SUNAT - Padrón de OSE (actualizado Feb 2026): https://www.sunat.gob.pe/padronesnotificaciones/ose/ose-281217.pdf
5. SUNAT - Padrón de PSE: https://www.sunat.gob.pe/orientacion/padrones/pse/ProveedoresServiciosElectronicos-PSE.pdf
6. Resolución N° 164-2018/SUNAT (UBL 2.1 mandate): https://www.perucontable.com/tributaria/modifican-la-fecha-para-usar-obligatoriamente-la-version-2-1/
7. Resolución N° 133-2019/SUNAT (UBL 2.1 final deadline)
8. Resolución N° 117-2017/SUNAT (OSE normativa)
9. Resolución N° 108-2022/SUNAT (PSE registro simplificado)

### Nubefact Documentation
10. Nubefact - Integración API: https://www.nubefact.com/integracion
11. Nubefact - Manual API JSON V1: https://es.scribd.com/document/525258100/NUBEFACT-DOC-API-JSON-V1
12. Nubefact - Precios: https://www.nubefact.com/precios
13. Nubefact - Demo: https://demo.nubefact.com/login

### Government Portals
14. GOB.PE - Proveedores de Servicios Electrónicos (PSE): https://www.gob.pe/26399-proveedores-de-servicios-electronicos-pse
15. GOB.PE - Operador de Servicios Electrónicos (OSE): https://www.gob.pe/26777-operador-de-servicios-electronicos-ose

### Third-Party References
16. Bizlinks - Diferencia entre PSE y OSE: https://bizlinks.com.pe/cual-es-la-diferencia-entre-un-pse-y-un-ose/
17. Corvatech - Requisitos de facturación electrónica en Perú: https://www.corvatech.com/requisitos-facturacion-electronica/peru/
18. TCI Peru - UBL 2.1 obligatorio: https://www.tci.net.pe/uso-obligatorio-de-ubl-2-1-desde-setiembre/
19. WispHub - Integración NubeFact SUNAT: https://wisphub.net/documentacion/articulo/sunat-nubefact-perunousar-203/
20. Sovos - Peru e-Invoicing Requirements: https://sovos.com/pt-br/blog/tributos/peru-einvoicing-requirements-overhauled/
21. Alegra - Facturación Electrónica Perú: https://www.alegra.com/peru/factura-electronica/
22. Alegra - Habilitación FE: https://ayuda.alegra.com/per/habilitar-facturacion-electronica
23. HMG Forum - Nubefact VFP Integration: https://mail.hmgforum.com/viewtopic.php?t=6832
24. RSM Peru - Migración a Facturación Electrónica (presentation): https://www.rsm.global/peru/sites/default/files/media/eventos-novedades/rsm_evento_migracion_a_facturacion_electronica.pdf

---

*This document will be updated as integration progresses. Next steps: obtain Nubefact reseller account, build sandbox prototype, validate conversational flows with target users.*
