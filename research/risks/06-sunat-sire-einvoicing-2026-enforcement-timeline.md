# SUNAT SIRE & E-Invoicing 2026: Enforcement Timeline and Compliance Opportunity for Yaya

**Date:** March 21, 2026
**Category:** Risks & Compliance
**Research Cycle:** #17

---

## Executive Summary

Peru's tax digitization is accelerating in 2026 with two critical enforcement milestones: the mandatory SIRE (Sistema Integrado de Registros Electrónicos) rollout for major taxpayers starting January 2026, and updated CPE validation rules effective February 15, 2026. Additionally, SUNAT has just approved Resolution N° 000033-2026/SUNAT for airline tickets, signaling continued expansion of electronic compliance requirements. For Yaya, this creates a growing compliance urgency among micro-enterprises — and a concrete value proposition as the tool that makes e-invoicing painless.

---

## 1. The 2026 E-Invoicing Enforcement Landscape

### 1.1 Electronic Invoicing in Peru: Current State
Electronic invoicing (Comprobantes de Pago Electrónicos — CPE) has been **mandatory for all taxpayers since 2022**. The system is governed by SUNAT's Electronic Issuance System (SEE), regulated under Superintendency Resolution No. 300-2014/SUNAT and subsequent amendments.

### Key Facts
- **CPE format:** UBL 2.1 XML with digital signature
- **Submission deadline:** Within 3 calendar days of issuance
- **Retention requirement:** Minimum 5 years (digital archives)
- **Validation:** Via SUNAT directly or through authorized OSE (Electronic Services Operator)
- **Required for:** All registered taxpayers across all tax regimes (General, MYPE Tributario, Special, Agricultural, Cooperative)

### 1.2 Available Issuance Methods
| Method | Target User | Cost | Complexity |
|---|---|---|---|
| SUNAT SOL (web portal) | Small taxpayers, independents | Free | Low (manual, online) |
| PSE (Electronic Services Provider) | Medium-large companies | Paid | High (ERP integration) |
| SUNAT Mobile Apps | Micro-entrepreneurs, freelancers | Free | Very low |

**Critical observation:** SUNAT already offers free mobile apps for micro-entrepreneurs to issue CPE. However, these apps are separate from business management — they don't connect transaction recording to invoice generation. Yaya's opportunity is **bridging the gap between daily transaction tracking and automatic CPE generation.**

---

## 2. New Enforcement Milestones in 2026

### 2.1 SIRE (Sistema Integrado de Registros Electrónicos) — January 2026

The SIRE system is SUNAT's newest enforcement mechanism, requiring **digital submission of Sales/Income Registers (RVIE) and Purchase Registers (RCE)** in structured format.

#### Key Details
- **Mandatory as of January 2026** for "principales contribuyentes" (major taxpayers)
- Format: Structured XML via web service APIs or SIRE desktop application
- Purpose: Centralize and digitize accounting records, not just invoices
- **Gradual rollout expected:** Major taxpayers first, then medium, then micro

#### Implication for Yaya's Target Market
Micro-enterprises (Régimen MYPE Tributario, Régimen Especial) are **not yet required** to use SIRE. However, the trajectory is unmistakable — SUNAT is systematically closing the digital compliance loop. When SIRE requirements extend to MYPE tributario businesses (likely 2027-2028), enterprises using Yaya will already have structured digital records, giving them a massive compliance advantage.

### 2.2 Updated CPE Validation Rules — February 15, 2026

SUNAT published updated validation rules for electronic payment receipts with several critical changes:

- **IGV tax rate updated from 10% to 10.5%** in validation rules
- New validation conditions for Credit Notes and Debit Notes
- Adjusted rules for invoice totals, particularly IGV calculations
- Modified error and observation codes
- Applied across invoices, boletas, daily summaries, and related documents

#### Impact on Micro-Enterprises
Systems not updated to the new validation rules will produce **rejected invoices**. For micro-enterprises using SUNAT SOL, this is handled automatically. But for businesses using any third-party tools, compliance requires software updates. **Yaya must ensure its CPE generation module stays current with SUNAT validation changes.**

### 2.3 Resolution N° 000033-2026/SUNAT — Airline Ticket Declarations

While not directly relevant to salons, this resolution (mandatory August 1, 2026) demonstrates SUNAT's continuing expansion of electronic compliance:
- New mandatory XML declarations for airline tickets
- Replaces old PDT form with UBL 2.1 electronic format
- Direct submission via web services

The pattern is clear: SUNAT is converting every paper-based process to structured electronic format, sector by sector.

---

## 3. The Micro-Enterprise Compliance Gap

### 3.1 Current Reality
Most Peruvian micro-enterprises in the informal economy handle tax compliance in one of three ways:

1. **Full compliance via contador:** The accountant handles everything — CPE generation, SIRE (when applicable), tax declarations. Business owner is passive.
2. **Partial compliance via SUNAT SOL:** Owner manually enters invoices on SUNAT's free portal. Tedious but functional.
3. **Non-compliance:** Operating without formal invoicing, risking fines and exclusion from formal supply chains.

### 3.2 The Pain Points
- **Manual double-entry:** Transaction happens → owner records in notebook → later enters into SUNAT SOL (if they remember). Information is recorded twice, often inconsistently.
- **IGV calculation errors:** The IGV rate change to 10.5% means manual calculations are more error-prone.
- **Missing deadlines:** 3-day CPE submission window is easy to miss for busy salon owners.
- **Contador dependency:** If the contador is slow or makes errors, the business suffers.

### 3.3 Yaya's Value Proposition in This Context
Yaya can collapse the entire workflow:
```
Voice note: "Corte de cabello a María, cuarenta soles"
→ Transaction recorded
→ CPE (boleta de venta) auto-generated in UBL 2.1
→ Submitted to SUNAT within 3-day window
→ Stored for 5-year retention requirement
→ Registered for SIRE when required
→ Sent to contador for monthly reconciliation
```

This is not a nice-to-have — it's a **compliance necessity** that currently requires either manual effort or expensive accounting software.

---

## 4. CPE Types Relevant to Yaya's Salon Users

| CPE Type | Use Case | Yaya Support Priority |
|---|---|---|
| **Boleta de venta electrónica** | Sales to consumers (most salon transactions) | **P0 — Critical** |
| **Factura electrónica** | B2B sales (products to other businesses) | P1 — Important |
| **Nota de crédito electrónica** | Refunds, corrections | P1 — Important |
| **Nota de débito electrónica** | Additional charges | P2 — Later |
| **Guía de remisión electrónica** | Product shipments | P3 — Not applicable to salons |

For a beauty salon, **95%+ of transactions will be boletas de venta** (sales to consumers). The boleta doesn't allow tax credit deduction for the buyer, but it does:
- Prove the transaction occurred
- Support the salon's tax declarations
- Create a digital record for SUNAT audits
- Establish formality for banking/credit access

---

## 5. Technical Integration Requirements

### 5.1 SUNAT SOL API Integration
For Yaya to auto-generate CPEs, it needs to connect to SUNAT's electronic issuance system. Options:

| Approach | Complexity | Cost | Time to Implement |
|---|---|---|---|
| **SUNAT SOL web portal** (manual) | Very low | Free | N/A (user does it) |
| **SUNAT API (direct)** | High | Free | 4-8 weeks |
| **Via PSE provider** (Nubefact, etc.) | Medium | $50-200/month | 2-4 weeks |
| **Via OSE provider** | Medium-High | $100-500/month | 3-6 weeks |

**Recommended approach for MVP:**
1. **Phase 1 (Month 1-3):** Generate CPE data but output as formatted text/PDF that the user or contador manually submits via SUNAT SOL. Zero integration cost.
2. **Phase 2 (Month 4-6):** Integrate with Nubefact or similar PSE to enable one-click CPE submission from Yaya.
3. **Phase 3 (Month 7+):** Direct SUNAT API integration for full automation.

### 5.2 Digital Signature Requirements
- CPE requires digital signature (certificado digital)
- For SOL issuance: SUNAT handles the signature
- For PSE/direct API: Business needs its own digital certificate
- **Most micro-enterprises don't have digital certificates**
- Solution: Yaya can aggregate via a PSE partnership, signing on behalf of the business

### 5.3 Factoring Opportunity
Peru's electronic invoicing framework supports **factoring electrónico** — using CPEs as negotiable instruments for short-term financing. If a salon's electronic invoice is accepted by the buyer (auto-accepted after 8 business days), it can be used to access credit via factoring platforms.

This creates a future Yaya product extension: **help salon owners access working capital based on their receivables.** The financial data Yaya collects becomes the creditworthiness proof.

---

## 6. SUNAT Enforcement Trajectory: 2026-2028 Predictions

### Confirmed
- ✅ SIRE mandatory for major taxpayers: January 2026
- ✅ Updated CPE validation rules: February 15, 2026
- ✅ Airline ticket electronic declarations: August 1, 2026

### Highly Likely (2026-2027)
- SIRE extension to medium taxpayers (MYPE Tributario larger bracket)
- Increased audit frequency using AI-powered cross-referencing of CPE data
- Interoperability requirements between CPE systems and banking

### Probable (2027-2028)
- SIRE extension to all registered taxpayers including micro-enterprises
- Mandatory real-time CPE reporting (reducing 3-day window to same-day)
- Integration of CPE data with Yape/digital payment records for automatic reconciliation

### Possible (2028+)
- SUNAT access to WhatsApp Business transaction data (regulatory precedent from Brazil's PIX/Nota Fiscal integration)
- Automatic tax calculation and deduction from digital wallet transactions

---

## 7. Competitive Landscape: E-Invoicing Solutions in Peru

### Existing Solutions
| Solution | Target | Price | WhatsApp? | Voice? |
|---|---|---|---|---|
| **SUNAT SOL** | All taxpayers | Free | No | No |
| **Nubefact** | SMEs | $15-50/month | No | No |
| **Efact** | Medium companies | $30-100/month | No | No |
| **Bsale** | Retail/restaurants | $20-60/month | Limited | No |
| **Alegra** | Small businesses | $10-30/month | No | No |
| **ContaPyme** | Micro-enterprises | Free-$15/month | No | No |

### The Gap Yaya Fills
None of these solutions:
- Accept voice notes as transaction input
- Operate primarily through WhatsApp
- Target the informal micro-enterprise segment specifically
- Bundle business management + compliance in a single conversational interface
- Connect contadores to their clients' real-time data

Yaya's e-invoicing is not competing with Nubefact — it's making Nubefact unnecessary for micro-enterprises by embedding compliance into the daily workflow.

---

## 8. Strategic Recommendations

### For MVP (Pre-SUNAT Integration)
1. **Generate formatted transaction summaries** that contadores can use to batch-create CPEs in SUNAT SOL
2. **Include IGV calculations** using the updated 10.5% rate
3. **Track CPE deadlines** — remind salon owners when a transaction is approaching the 3-day submission window

### For V2 (Post-MVP)
4. **Partner with a PSE (Nubefact recommended)** for one-click CPE generation
5. **Build the contador dashboard** showing all client transactions ready for batch CPE submission
6. **Implement UBL 2.1 export** so data can flow to any SUNAT-compatible system

### For Narrative/Fundraising
7. **Position Yaya as "compliance-as-a-service"** — the tool that keeps micro-enterprises compliant automatically
8. **Use SIRE trajectory** as urgency driver — "SIRE is coming for micro-enterprises by 2027-2028; Yaya users will be ready"
9. **Factoring potential** as long-term revenue play — Yaya's transaction data enables micro-enterprise credit access

---

## 9. Key Sources

- EDICOM Group: "Factura electrónica en Perú" (updated March 20, 2026)
- gob.pe: "Emitir factura electrónica - SEE SOL" (March 19, 2026)
- gob.pe: "Sistema de Emisión Electrónica (SEE) - SOL" (March 4, 2026)
- Estela Blog: "SUNAT actualiza las reglas de validación de los CPE" (March 6, 2026)
- EDICOM Group (English): "Electronic Invoice in Peru" (March 20, 2026)
- SUNAT Resolution N° 000033-2026/SUNAT (airline ticket declarations)

---

*This document provides the current March 2026 SUNAT enforcement landscape with specific implications for Yaya's compliance strategy, significantly updating and expanding technology/10-sunat-sire-einvoicing-2026-compliance-engine.md with real-time regulatory data.*
