# SUNAT SIRE & E-Invoicing 2026: Building Yaya's Compliance Engine
## Technical Analysis of Peru's Evolving Tax Digitalization Requirements and Yaya's Integration Strategy

**Classification:** Technology Research — Tax Compliance Architecture  
**Date:** March 21, 2026  
**Sources:** EDICOM Group Peru E-Invoicing Guide (Updated March 2026), SUNAT Resolution 000033-2026/SUNAT, Estela Blog SUNAT Validation Updates (March 2026), Avalara Peru E-Invoice Guide (February 2026), SUNAT SIRE Official Publications (2026), iGEA ERP SIRE Guide (March 2026), Prolyam SIRE Guide (February 2026)

---

## Executive Summary

Peru's tax digitalization ecosystem is accelerating in 2026, with three critical developments that directly affect Yaya Platform:

1. **SIRE (Sistema Integrado de Registros Electrónicos)** became mandatory for principal taxpayers as of January 2026 and is expanding to all obligated taxpayers throughout 2026
2. **CPE validation rule updates** (effective February 15, 2026) changed IGV rate validation from 10% to 10.5%
3. **New airline ticket electronic declaration** (Resolution 000033-2026/SUNAT) effective August 1, 2026, signals SUNAT's continuing expansion of electronic reporting requirements

For Yaya, these developments create a **triple opportunity**: (a) SIRE compliance is painful for micro-businesses, creating demand for automated solutions; (b) the expanding electronic invoicing requirements push informal businesses toward formalization, growing Yaya's addressable market; and (c) building SUNAT compliance as a core capability creates a deep technical moat that WhatsApp chatbot competitors cannot easily replicate.

---

## 1. Peru's E-Invoicing Ecosystem: Current State

### 1.1 Key Components

| System | Function | Status (March 2026) |
|---|---|---|
| **SEE** (Sistema de Emisión Electrónica) | Framework for issuing electronic receipts (CPE) | Mandatory for 100% of taxpayers since 2022 |
| **CPE** (Comprobantes de Pago Electrónicos) | Electronic payment receipts (invoices, boletas, etc.) | UBL 2.1 XML format, digital signature required |
| **OSE** (Operador de Servicios Electrónicos) | Third-party validators of electronic receipts | Authorized validators include Nubefact, EDICOM, etc. |
| **PSE** (Proveedor de Servicios Electrónicos) | Service providers managing CPE lifecycle | Full lifecycle: generation → signing → validation → storage |
| **SIRE** (Sistema Integrado de Registros Electrónicos) | Electronic sales & purchase register system | Mandatory for principal taxpayers from January 2026 |
| **GRE** (Guía de Remisión Electrónica) | Electronic shipment guides | Mandatory for all goods transport |

### 1.2 Who Must Comply

**E-Invoicing (CPE):** ALL taxpayers with active RUC, except New Simplified Single Regime (NRUS). This includes every formalized micro-business in Peru.

**SIRE:** Taxpayers who:
- Emit electronic invoicing
- Exceed certain income thresholds
- Are in the General Regime or MYPE Tax Regime (Régimen MYPE Tributario)
- Issued more than 100 electronic receipts in the prior year

**Non-compliance penalties:**
- CPE: Fines up to **50% of applicable tax amount**; repeat offenders face business operation suspension
- SIRE: Automatic fines from **S/ 1,500 to S/ 15,000** depending on income level
- CPE not sent within 3 calendar days loses tax validity — cannot be used for tax credits or expense deductions

### 1.3 February 2026 Validation Rule Changes

SUNAT published updated CPE validation rules effective **February 15, 2026**:
- **IGV rate updated from 10% to 10.5%** in validation rules
- All electronic systems must adjust to the new rate or face rejections
- This is a critical example of why Yaya needs to maintain up-to-date tax rate tables

---

## 2. SIRE Deep Dive: The New Compliance Pain Point

### 2.1 What Is SIRE?

SIRE replaces the old Programa de Libros Electrónicos (PLE) with a more automated but more demanding system. Taxpayers must submit monthly:

| Register | Content | Deadline |
|---|---|---|
| **Registro de Ventas e Ingresos Electrónico (RVIE)** | All sales invoices and boletas issued (B2B and B2C) | Last business day of following month |
| **Registro de Compras Electrónico (RCE)** | All purchase invoices received with tax credits | Last business day of following month |
| **Summary of receipts** | Voided invoices, credit/debit notes | With RVIE |
| **Non-documented expense summary** | Expenses without receipts (limited to 6% of total expenses) | With RCE |

### 2.2 How SIRE Works

1. SUNAT generates a **proposed register** based on electronic receipts in its system
2. Taxpayer reviews the proposal via SUNAT's portal or via web service API
3. Taxpayer can **accept** (if correct), **modify** (add/correct entries), or **replace** (upload own version)
4. Submitted register is processed by SUNAT (up to 24 hours)
5. SUNAT confirms acceptance or indicates errors

### 2.3 Why SIRE Is Painful for Micro-Businesses

The existing process requires micro-business owners to:

1. **Log into SUNAT's portal** monthly using Clave SOL credentials
2. **Review computer-generated proposals** — not always accurate
3. **Cross-reference with their own records** (often paper notebooks or Excel)
4. **Correct discrepancies** between SUNAT's data and their actual transactions
5. **Submit within deadlines** or face automatic fines

For a beauty salon owner or corner shop operator, this process is:
- **Time-consuming** — 2-4 hours/month for someone unfamiliar with the system
- **Confusing** — SUNAT's interface is designed for accountants, not entrepreneurs
- **Risky** — Mistakes lead to fines or lost tax credits
- **Often delegated** to accountants charging S/ 200-500/month

### 2.4 SIRE Compliance as Yaya Feature Opportunity

**The value proposition:** "Yaya handles your SUNAT registers. Just run your business on WhatsApp — we'll make sure everything is reported correctly."

| Traditional Process | Yaya-Automated Process |
|---|---|
| Manually log into SUNAT portal | Automatic via API |
| Review 10-50 line items in proposal | AI cross-references with Yaya transaction data |
| Fix discrepancies manually | Yaya flags and resolves discrepancies |
| Submit before deadline | Automatic submission with buffer |
| Hire accountant (S/ 200-500/month) | Included in $13/month subscription |

**Revenue impact:** If Yaya can replace even part of the accountant's role in SIRE compliance, the $13/month price point becomes incredibly attractive vs. S/ 200-500 for an accountant. This is potentially Yaya's **strongest value proposition** for formalized micro-businesses.

---

## 3. Technical Architecture: Yaya's SUNAT Compliance Engine

### 3.1 Integration Points

```
┌────────────────────┐
│   WhatsApp User    │
│  (Micro-business)  │
└────────┬───────────┘
         │ Messages via WhatsApp
         ▼
┌────────────────────┐
│   Yaya AI Engine   │
│  (LLM + Business   │
│   Logic Layer)     │
└────────┬───────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌────────────────┐
│Nubefact│ │  SUNAT APIs    │
│  (OSE) │ │                │
│        │ │ • CPE Emission │
│ • CPE  │ │ • SIRE Submit  │
│  Valid. │ │ • RUC Lookup   │
│ • CDR  │ │ • Tax Rates    │
└────────┘ └────────────────┘
```

### 3.2 CPE Generation Flow

1. **User requests invoice via WhatsApp**: "Hazme una factura para Rosa García por S/ 150 de corte y color"
2. **Yaya AI extracts**: Customer name, amount, service description, IGV calculation
3. **Yaya validates**: Customer RUC (if B2B), correct tax rate (10.5% IGV as of Feb 2026), service codes
4. **Yaya generates CPE**: UBL 2.1 XML format with digital signature
5. **Nubefact validates**: OSE validates and returns CDR (acceptance confirmation)
6. **SUNAT receives**: CPE registered in SUNAT's system
7. **User receives**: PDF/visual confirmation via WhatsApp
8. **Yaya stores**: XML, CDR, and metadata for 5-year retention requirement

### 3.3 SIRE Automation Flow

1. **Monthly trigger**: Yaya automatically aggregates all CPEs issued and received during the month
2. **Proposal retrieval**: Yaya fetches SUNAT's proposed registers via API
3. **Cross-reference**: AI compares Yaya's transaction data with SUNAT's proposal
4. **Discrepancy resolution**: 
   - Missing transactions → Yaya adds them
   - Incorrect amounts → Yaya flags for user confirmation
   - Unmatched items → User notified via WhatsApp for clarification
5. **Submission**: After user confirmation, Yaya submits corrected registers
6. **Confirmation**: CDR received, user notified of success/issues

### 3.4 Tax Rate Management

The February 2026 IGV rate change (10% → 10.5%) highlights a critical requirement:

- **Rate table must be maintained** and updated automatically
- **Region-specific rates** may apply (e.g., Amazon region exemptions)
- **Rate change notifications** — Yaya should proactively inform users: "¡Importante! La tasa del IGV cambió a 10.5%. Tus facturas ya están actualizadas."

### 3.5 Data Retention Requirements

| Data Type | Retention Period | Storage Requirement |
|---|---|---|
| CPE XML files | 5 years | Digital, integrity guaranteed |
| CDR (acceptance confirmations) | 5 years | Digital |
| Rejection notices | 5 years | Digital |
| Daily summaries | 5 years | Digital |
| Graphical representations (PDF) | 1 year (minimum, for recipient access) | Digital |
| SIRE submissions | 5 years | Digital |

**For Yaya:** This means building a robust archival system. At scale (10,000 users × 50 CPEs/month × 5 years), that's **30 million documents** requiring guaranteed integrity and accessibility.

---

## 4. Electronic Factoring: The Fintech Bridge

### 4.1 CPE as Negotiable Instrument

Under Peru's regulatory framework, electronic invoices can become **negotiable instruments** (títulos valores). This enables:

1. **Invoice factoring** — Businesses sell unpaid invoices to financial institutions for immediate cash
2. **Electronic acceptance** — Buyers must confirm acceptance within **8 business days** or the invoice is automatically accepted (tacit acceptance)
3. **Specialized platforms** connect businesses with financial institutions for invoice-backed financing

### 4.2 Yaya's Factoring Opportunity

If Yaya generates and manages a micro-business's invoices, it has:
- **Real-time visibility into outstanding receivables** — Yaya knows which invoices are unpaid
- **Automatic acceptance tracking** — Yaya can notify when the 8-day window is closing
- **Factoring facilitation** — Connect users with factoring platforms for immediate liquidity

**Revenue model:** Commission-based factoring referral (1-3% of invoice value) could become a significant revenue stream:
- Average micro-business monthly invoicing: S/ 5,000-15,000
- Average factoring rate: 2-4% monthly
- Yaya's referral commission: 0.5-1%
- Per-user revenue: S/ 25-150/month — **potentially larger than the subscription fee**

### 4.3 Connection to Credit Scoring

Invoice data + payment behavior + SIRE compliance history = credit scoring inputs:

| Data Point | Source | Credit Signal |
|---|---|---|
| Monthly invoice volume | CPE records | Business activity level |
| Invoice payment timing | Factoring/payment tracking | Cash flow health |
| SIRE compliance consistency | SIRE submissions | Business formality/reliability |
| Customer concentration | Invoice analysis | Revenue diversification |
| Growth trend | Monthly comparison | Business trajectory |

**Cross-reference:** fintech/02-peru-sme-lending-microfinance.md — This data stack could power Yaya's future credit scoring engine

---

## 5. The Formalization Funnel: Informal → Yaya User

### 5.1 The Problem

86% of Peru's MYPEs are informal — they don't have a RUC and don't issue electronic invoices. SUNAT's expanding requirements create pressure to formalize:

| SUNAT Requirement | Pressure Point |
|---|---|
| CPE mandatory for all RUC holders | Can't invoice without it |
| SIRE reporting mandatory | Monthly reporting adds burden |
| GRE for goods transport | Can't ship without it |
| IGV validation strictness | Errors lead to fines |
| 3-day submission deadline | Tight timeline |

### 5.2 Yaya's Formalization Value Proposition

For businesses considering formalization:

**Without Yaya:**
1. Register for RUC (requires going to SUNAT office)
2. Get digital certificate (S/ 100-300/year)
3. Choose electronic issuing method (SOL portal is free but complex, PSE costs money)
4. Learn SUNAT's systems
5. Issue invoices correctly in UBL 2.1 XML
6. Maintain records for 5 years
7. Submit SIRE monthly
8. Hire accountant (S/ 200-500/month)

**With Yaya:**
1. Register for RUC (still required, but Yaya could guide through the process)
2. Tell Yaya: "Quiero facturar" — Yaya handles everything else
3. Issue invoices by saying: "Factura para Rosa, S/ 150, corte y color"
4. SIRE submitted automatically
5. $13/month vs. S/ 200-500/month for an accountant

**The pitch to informal businesses:** "Formalízate sin dolor. Yaya hace tus facturas, tu SIRE, y tu contabilidad básica — todo desde WhatsApp, por S/ 50 al mes."

### 5.3 Market Sizing

| Segment | Size | Yaya Relevance |
|---|---|---|
| Fully formalized MYPEs with electronic invoicing | ~500,000 | Immediate market — reduce accounting costs |
| Recently formalized (2022-2026) | ~200,000 | High — struggling with new e-invoicing requirements |
| Informal considering formalization | ~1,000,000+ | Future market — Yaya as the reason to formalize |
| Total addressable | ~1,700,000+ | Long-term with formalization facilitation |

---

## 6. Competitive Analysis: Tax Compliance Solutions in Peru

### 6.1 Current Market

| Solution | Target | Monthly Cost | WhatsApp? | AI? |
|---|---|---|---|---|
| **SUNAT SOL Portal** | All taxpayers | Free | ❌ | ❌ |
| **Nubefact** | SMEs | $15-50/month | ❌ | ❌ |
| **EDICOM** | Medium-large enterprises | $100+/month | ❌ | ❌ |
| **iGEA ERP** | SMEs | $30-80/month | ❌ | ❌ |
| **Accountant** | Everyone | S/ 200-500/month | ❌ | ❌ |
| **Yaya Platform** | Micro-businesses | $13/month | ✅ | ✅ |

**No existing solution combines:** WhatsApp interface + AI assistance + e-invoicing + SIRE automation at a price point accessible to micro-businesses.

### 6.2 Technical Moat Analysis

Building SUNAT compliance requires:
1. **Understanding UBL 2.1 XML specification** — Complex technical standard
2. **Digital certificate management** — Security infrastructure
3. **OSE integration** (Nubefact or similar) — API integration + validation handling
4. **SIRE API integration** — Monthly reporting automation
5. **Tax rate management** — Staying current with SUNAT validation changes
6. **5-year data retention** — Archival infrastructure
7. **Error handling** — Graceful management of rejections, corrections, resubmissions

A WhatsApp chatbot competitor wanting to add "invoicing" can't just generate a PDF — they need the entire compliance stack. This is a **12-18 month technical investment** that Yaya building early creates as a durable moat.

---

## 7. Implementation Roadmap

### Phase 1: Basic CPE Generation (MVP)
- **Timeline:** Month 1-2
- **Scope:** Generate boletas de venta (B2C receipts) via Nubefact API
- **User experience:** "Hazme una boleta por S/ 80 de manicure para Rosa"
- **Technical:** Nubefact API integration, basic UBL 2.1 generation, CDR handling

### Phase 2: Full Invoicing (Facturas)
- **Timeline:** Month 2-4
- **Scope:** B2B invoices with RUC validation, IGV calculation, credit/debit notes
- **User experience:** "Factura para Salón María, RUC 20512345678, por S/ 1,200 de productos"
- **Technical:** RUC lookup API, IGV calculation engine, multi-receipt type support

### Phase 3: SIRE Automation
- **Timeline:** Month 4-6
- **Scope:** Automated monthly SIRE proposal review and submission
- **User experience:** "Tu reporte SIRE de febrero está listo. ¿Lo reviso contigo?"
- **Technical:** SIRE API integration, cross-referencing engine, discrepancy detection

### Phase 4: Factoring Integration
- **Timeline:** Month 8-12
- **Scope:** Invoice factoring facilitation
- **User experience:** "Tienes S/ 8,000 en facturas por cobrar. ¿Quieres convertirlas en efectivo hoy?"
- **Technical:** Factoring platform APIs, acceptance tracking, financial partner integration

---

## 8. Key Takeaways for Andre

1. **SIRE is your killer feature.** Monthly SUNAT reporting is a genuine pain point for micro-businesses. Automating it via WhatsApp at $13/month vs. S/ 200-500/month for an accountant is an irresistible value proposition.

2. **The IGV rate change shows why this is hard.** SUNAT updated validation rules on February 15, 2026, changing the IGV rate to 10.5%. Any compliance system must stay current with these changes. This ongoing maintenance requirement is itself a moat.

3. **Electronic factoring is your fintech bridge.** Invoice data → factoring referrals → credit scoring. Each step builds on the last, and it all starts with being the system that generates invoices.

4. **Formalization is a growth engine.** 86% of MYPEs are informal. As SUNAT tightens enforcement, millions of businesses will need to formalize. Yaya can be "the reason I went formal" — a massive growth catalyst.

5. **No competitor has this stack.** No one combines WhatsApp + AI + CPE generation + SIRE automation + factoring at a micro-business price point. Building this first creates 12-18 months of technical moat.

6. **5-year data retention is infrastructure investment.** Plan for archival storage from day one. At scale, you'll manage millions of documents. Cloud-based archival (S3 Glacier or similar) keeps costs minimal.

---

*This document provides the technical depth needed to architect Yaya's SUNAT compliance engine — the feature that transforms Yaya from "AI chatbot" to "business operating system" and creates the deepest technical moat in the competitive landscape.*
