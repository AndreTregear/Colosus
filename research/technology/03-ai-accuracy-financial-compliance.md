# AI Accuracy Requirements for Financial Compliance in SMB Contexts

## Defining Hallucination Tolerance for Yaya Platform

**Document Version:** 1.0  
**Date:** March 2026  
**Classification:** Architecture & Risk — PhD-Level Research  

---

## Executive Summary

AI accuracy in financial contexts is not a feature — it's an existential requirement. Recent research reveals that general-purpose LLMs hallucinate in **46–79% of responses** on factual queries (Vectara, 2025), and specifically in financial/accounting contexts, **50% of UK firms have already suffered direct financial losses** from clients relying on chatbot-generated tax and financial advice (Dext, 2026). For Yaya Platform — which will process sales records, generate invoices, provide financial insights, and potentially facilitate lending — the accuracy bar is not "good enough for chat" but "good enough for compliance." This document defines the accuracy requirements across Yaya's functional layers, maps the specific risks in Peru's regulatory environment, and designs a multi-layer validation architecture that achieves financial-grade accuracy while maintaining conversational naturalness.

---

## 1. The AI Hallucination Crisis in Financial Contexts

### 1.1 Current Hallucination Rates (2025–2026)

| Model/Context | Hallucination Rate | Source |
|---------------|-------------------|--------|
| OpenAI o4-mini (factual QA) | **79%** | Vectara, 2025 |
| OpenAI o3 (basic factual) | **51%** | Vectara, 2025 |
| All AI-generated text (general) | **46%** | Digitalisation World |
| ChatGPT on financial data | **up to 72%** | Nature, 2025 |
| Local LLMs on CPA exams | **41–60% failure rate** | J. Martin Consulting, 2025 |

### 1.2 Real-World Financial Damage

The Dext survey (Jan 2026) of 500 UK accountants reveals the **current state of AI-driven financial errors**:

**Top AI-Generated Errors in Business Accounting:**
- Incorrect Business Expenses: **46%** of firms reported
- VAT/Tax Miscalculations: **41%**
- Flawed Personal Tax Planning: **35%**
- Payroll & Business Tax Errors: **34%**

**Impact:**
- **50% of firms** have seen clients suffer direct financial losses from AI chatbot advice
- **93% of accountants** spend significant time fixing AI-driven mistakes
- **40% of practitioners** lose 4–10 hours/week correcting AI errors
- **33% of accountants** warn AI reliance could trigger business failures
- **72% of accountants** see clients challenging professional advice with "the AI said X"
- **92% of accountants** call for regulation of AI tools providing financial advice

**Source:** Dext via caalley.com (Jan 2026)

### 1.3 Legal Precedents

- **Air Canada:** Ordered to compensate a passenger after its chatbot provided false refund policy information
- **Mata v. Avianca:** Two attorneys sanctioned for using ChatGPT to draft a brief citing six nonexistent legal cases
- **Sage Copilot:** Suspended after exposing one client's business data to another client during invoice lookups

### 1.4 CPA Exam Performance of Local LLMs

Comprehensive testing of 16 LLM models across 61 CPA exams (J. Martin Consulting, July 2025):

| Area | Accuracy Range | Risk Level |
|------|---------------|------------|
| Tax Compliance (TCP) | 38.7%–48.0% | **EXTREME** |
| Financial Accounting (FAR) | 32.2%–54.0% | **EXTREME** |
| Regulation (REG) | 29.2%–55.2% | **EXTREME** |
| Auditing (AUD) | 26.2%–63.1% | **HIGH** |

**Critical finding:** No local LLM model achieved the 75% CPA passing threshold. The best performer (granite3.3:8b) scored 58.7% — still failing 4 out of 10 professional-level questions.

**Yaya implication:** Yaya's Qwen3.5-27B model (local deployment on RTX A5000) should be expected to perform similarly or worse on financial compliance tasks without domain-specific fine-tuning and RAG augmentation.

---

## 2. Accuracy Requirements by Yaya Feature Layer

### 2.1 Classification Framework

Not all of Yaya's features carry the same compliance risk. The accuracy requirement varies by the **consequence of error**:

| Layer | Feature | Consequence of Error | Required Accuracy | Validation Method |
|-------|---------|---------------------|-------------------|-------------------|
| **Critical** | E-invoice generation (SUNAT) | SUNAT penalties, legal liability | **99.9%+** | Deterministic rules, no LLM |
| **Critical** | Tax calculations | Under/overpayment, penalties | **99.9%+** | Deterministic rules, no LLM |
| **Critical** | Credit scoring outputs | Wrong loan decisions, regulatory risk | **99%+** | ML model with audit trail |
| **High** | Financial summaries (totals, trends) | Business decisions based on wrong data | **99%+** | RAG + validation layer |
| **High** | Payment verification | Wrong payment confirmations | **99%+** | API confirmation, not LLM |
| **Medium** | Inventory tracking | Ordering errors, stockouts/surplus | **95%+** | LLM + confirmation step |
| **Medium** | Customer reminders | Wrong customer contacted, wrong message | **95%+** | LLM + template confirmation |
| **Low** | Business advice/insights | Suboptimal but not damaging decisions | **90%+** | LLM with uncertainty flagging |
| **Low** | Conversational responses | Minor errors in casual interaction | **85%+** | Standard LLM |

### 2.2 The "No LLM Zone"

For **critical-layer features**, Yaya must NOT use LLM inference. These must use deterministic code:

1. **Mathematical calculations:** Sales totals, margins, tax amounts — always computed, never generated
2. **SUNAT invoice formatting:** UBL 2.1 XML generation — template-driven, never LLM-generated
3. **IGV (VAT) calculations:** 18% fixed rate — hardcoded, never hallucinated
4. **Date/time operations:** Invoice due dates, payment deadlines — system clock, not LLM
5. **Financial record integrity:** Transaction amounts once confirmed — stored in database, not re-interpreted by LLM

### 2.3 The "LLM with Guardrails" Zone

For **high-layer features**, the LLM can be used for interpretation and summarization, but outputs must be validated:

1. **Transaction extraction from voice notes:** LLM interprets "vendí 5 pollos a 12 soles" → system validates {"item": "pollo", "quantity": 5, "price": 12.00, "total": 60.00} → user confirms
2. **Financial trend analysis:** LLM summarizes data from database queries → numbers come from SQL, words come from LLM
3. **Expense categorization:** LLM suggests category → user confirms or corrects → system learns

### 2.4 The "LLM Free Zone"

For **low-layer features**, the LLM operates with minimal guardrails:

1. **Conversational engagement:** "¿Cómo va el día?" → natural response
2. **General business advice:** "¿Debería hacer una promoción?" → opinion-based, low risk
3. **Emotional support:** "El negocio está difícil" → empathetic response, no numerical claims

---

## 3. Peru-Specific Compliance Requirements

### 3.1 SUNAT E-Invoicing

Peru's electronic invoicing system is **fully mandatory** since January 2022. Key accuracy requirements:

| Element | Requirement | Error Tolerance |
|---------|-------------|-----------------|
| RUC (taxpayer ID) | 11-digit exact match | **Zero** |
| IGV calculation | 18% of taxable base | **Zero** (SUNAT validates) |
| UBL 2.1 XML format | Schema-compliant | **Zero** (rejected if malformed) |
| Digital signature | Accredited certificate | **Zero** |
| 24-hour delivery | Submit within 24h | **Zero** (penalties apply) |
| Document numbering | Sequential, no gaps | **Zero** |

**Yaya approach:** E-invoicing must be implemented as a **deterministic module** that uses the LLM only for extracting invoice details from conversation, then validates and formats using rule-based code. The LLM never generates the invoice XML directly.

### 3.2 Data Protection (Ley 29733, Updated 2025)

| Requirement | AI Implication | Risk |
|------------|----------------|------|
| Prior, informed, express consent | LLM must not assume consent | HIGH |
| ARCO rights (20 business day response) | Must be able to retrieve/delete all data | MEDIUM |
| Breach notification to ANPD | Must detect data exposure from LLM | HIGH |
| ISO/IEC 27001 alignment | LLM infrastructure must meet standard | MEDIUM |
| DPO appointment (by revenue tier) | Required when Yaya reaches revenue thresholds | LOW (initially) |

### 3.3 AI Law (Law 31814, Effective Dec 2025)

Peru's AI law classifies AI systems by risk:

| Yaya Feature | Likely Classification | Obligation |
|--------------|----------------------|------------|
| Sales recording chatbot | **Limited Risk** | Transparency disclosure, opt-out |
| Financial insights/advice | **Limited Risk → High Risk** | Transparency + human oversight |
| Credit scoring | **High Risk** | Enhanced oversight, documentation, bias monitoring |
| Employment-related decisions | **Prohibited unless compliant** | N/A (Yaya doesn't make HR decisions) |

**Compliance action:** Every Yaya interaction must begin with: "Soy Yaya, un asistente de inteligencia artificial. Para hablar con una persona, escribe 'humano' en cualquier momento."

---

## 4. Multi-Layer Validation Architecture

### 4.1 The "Trust Architecture" for Financial AI

Yaya's accuracy architecture must operate on five layers:

```
Layer 5: HUMAN ESCALATION
    ↑ (when confidence < threshold or user requests)
Layer 4: BUSINESS RULE VALIDATION
    ↑ (IGV = 18%, invoice format, date logic)
Layer 3: DATA VERIFICATION (RAG)
    ↑ (cross-reference against stored transactions, SUNAT rules)
Layer 2: LLM INTERPRETATION
    ↑ (extract intent, quantities, amounts from natural language)
Layer 1: USER INPUT
    (voice note, text message, image of receipt)
```

### 4.2 RAG (Retrieval-Augmented Generation)

For financial accuracy, Yaya's LLM must be augmented with:

1. **Transaction database:** All previously recorded sales, expenses, and payments
2. **SUNAT tax rules:** Current IGV rates, exemptions, deadlines
3. **Product catalog:** User's own products with prices
4. **Customer history:** Previous orders, preferences, outstanding balances
5. **Supplier data:** Current prices, delivery schedules, payment terms

The LLM should **never generate financial data from training weights** — it should always retrieve from verified sources and use the LLM only for natural language formatting.

### 4.3 Confirmation Flow Design

For every financial action, Yaya must implement a confirmation step:

**Example flow:**

```
User: "Vendí 3 tortas de chocolate a 25 soles y 2 de vainilla a 20"
Yaya: "Entendido. Registro:
  • 3 tortas de chocolate × S/25 = S/75
  • 2 tortas de vainilla × S/20 = S/40
  Total: S/115
  ¿Correcto? 👍 o corregir"
User: 👍
Yaya: "Registrado. Ventas del día: S/485"
```

The confirmation step is **non-negotiable** for financial transactions. It must:
- Show itemized details
- Display calculated totals
- Require explicit user confirmation (👍, "sí", or voice confirmation)
- Allow easy correction without starting over

### 4.4 Uncertainty Flagging

When Yaya's confidence in interpretation is below threshold, it must flag uncertainty:

```
User: [voice note, noisy background] "...algo de pollo... treinta..."
Yaya: "No estoy seguro si escuché bien. ¿Fueron:
  A) 30 pollos
  B) Pollo por S/30
  C) Otra cosa — dime de nuevo"
```

### 4.5 Audit Trail Requirements

Every financial interaction must generate an audit record:

| Field | Content |
|-------|---------|
| Timestamp | ISO 8601 |
| User input | Original text/voice transcription |
| LLM interpretation | Structured data extracted |
| Confidence score | 0–1 scale |
| Validation result | PASS/FAIL/FLAGGED |
| User confirmation | Confirmed/Corrected/Rejected |
| Final record | Stored transaction |

This audit trail serves dual purposes:
1. **Regulatory compliance:** Demonstrates due diligence under Law 31814
2. **Model improvement:** Provides training data for fine-tuning accuracy

---

## 5. Voice Note Accuracy: The Critical Challenge

### 5.1 Why Voice Accuracy Matters More for Yaya

Yaya's vision is voice-first — business owners speak naturally, and Yaya interprets. This means Yaya faces a **dual accuracy challenge**:

1. **Speech-to-Text accuracy:** Converting Peruvian Spanish voice notes to text
2. **Semantic extraction accuracy:** Extracting business data from transcribed text

### 5.2 Speech-to-Text Challenges in Peru

| Challenge | Description | Mitigation |
|-----------|-------------|------------|
| Peruvian Spanish accents | Distinct phonology from European/Mexican Spanish | Fine-tune on Peruvian speech data |
| Quechua-influenced vocabulary | Borrowed words and code-switching | Include in training corpus |
| Background noise | Market noise, street sounds, kitchen sounds | Noise reduction preprocessing |
| Informal speech | Slang, abbreviations, incomplete sentences | Train on informal business speech |
| Numbers in speech | "Treinta y cinco" vs. "35" | Robust number extraction pipeline |
| Currency ambiguity | "Soles" vs. "dólares" vs. implicit | Default to soles, confirm for large amounts |

### 5.3 Accuracy Targets for Voice Pipeline

| Stage | Target Accuracy | Current State-of-Art |
|-------|-----------------|---------------------|
| Speech-to-Text (clean audio) | >95% | ~95% (Whisper v3) |
| Speech-to-Text (noisy audio) | >85% | ~80–85% |
| Number extraction | >98% | ~95% with specialized models |
| Intent classification | >90% | ~85–90% |
| Overall voice-to-data accuracy | >90% | ~75–80% |

**The gap:** Current end-to-end accuracy of ~75–80% is **insufficient** for financial records. The confirmation step bridges this gap by letting the user correct errors before they become records.

---

## 6. Model Quantization and Accuracy Tradeoffs

### 6.1 The Cost-Accuracy Dilemma

Yaya deploys Qwen3.5-27B with 4-bit AWQ quantization on RTX A5000 GPUs. This creates a specific accuracy risk:

- **4-bit quantization cuts compute costs by ~50%** but degrades accuracy
- Community reports show **35–70% performance gaps** between providers using the same model at different quantization levels
- "Fast, cheap, accurate — you can only pick two" (Reddit developer consensus)

### 6.2 Mitigation Strategies

1. **Layer-appropriate model selection:**
   - Financial extraction: Use full-precision model or specialized fine-tuned model
   - Conversational responses: 4-bit quantized model is acceptable
   - Tax calculations: No model at all — deterministic code

2. **Fine-tuning on domain data:**
   - Collect Peruvian business conversation data
   - Fine-tune on sales transaction extraction tasks
   - Fine-tune on Peruvian Spanish informal speech patterns
   - Expected improvement: 10–20% on domain-specific tasks

3. **Ensemble approach:**
   - For critical extractions, run through two models and compare
   - Disagreement triggers human review or additional confirmation

---

## 7. Benchmarking AI Accuracy for Yaya's Use Cases

### 7.1 Proposed Yaya Accuracy Benchmark Suite

To measure and track Yaya's accuracy over time:

| Test Category | Test Description | Target Score |
|---------------|------------------|-------------|
| Sales extraction (text) | "Vendí 5 pollos a S/12 cada uno" → correct structured data | >98% |
| Sales extraction (voice, clean) | Same as above, from voice note | >95% |
| Sales extraction (voice, noisy) | Same as above, noisy environment | >85% |
| Multi-item transaction | "3 pollos, 2 tortas, 1 bebida" → all items correct | >92% |
| Financial summary | "¿Cuánto vendí esta semana?" → correct total from DB | >99% |
| Tax calculation | IGV on S/1,000 invoice → S/180 | **100%** (deterministic) |
| Invoice generation | Complete SUNAT-compliant boleta | **100%** (deterministic) |
| Customer identification | "María me debe" → correct customer lookup | >90% |
| Expense categorization | "Compré harina por S/200" → correct category | >85% |
| Credit insight accuracy | "Tu negocio creció 15% este mes" → correct percentage | >99% |

### 7.2 Continuous Monitoring

- **Daily automated testing** against benchmark suite
- **Weekly accuracy reports** tracking improvement/degradation
- **Monthly human review** of flagged low-confidence interactions
- **Quarterly fine-tuning cycles** based on accumulated correction data

---

## 8. Competitive Analysis: How Others Handle Financial AI Accuracy

### 8.1 Enterprise Approaches

| Company | Approach | Accuracy Claim |
|---------|----------|----------------|
| DataSnipper | Audit-ready AI with Excel integration | 500K+ finance professionals, zero LLM-only |
| MindBridge | Analyzes 100% of transactions (not samples) | Deterministic + ML hybrid |
| AgentiveAIQ | Dual RAG + Knowledge Graph | "95% error reduction vs. LLMs" |
| Thomson Reuters | Human-centered AI for audit | "Enhance, not replace professional judgment" |

### 8.2 SMB Approaches

| Company | Approach | Relevant to Yaya? |
|---------|----------|-------------------|
| Sage Copilot | AI assistant for accounting (suspended after data breach) | **Cautionary tale** |
| Khatabook (India) | Simple ledger — minimal AI inference | Yes — keep it simple |
| Vyapar (India) | Rule-based invoicing with some AI | Yes — deterministic core |
| QuickBooks AI | AI categorization with human review | Yes — confirmation pattern |

**The lesson from the market:** Every successful financial AI system uses a **hybrid architecture** where the AI handles interpretation and presentation, but calculations and compliance are deterministic. No one trusts pure LLM output for financial data.

---

## 9. Regulatory Risk Matrix

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| SUNAT penalty for incorrect invoice | Medium | HIGH | Deterministic invoice generation, no LLM |
| Customer financial loss from wrong data | Medium | HIGH | Confirmation flows, audit trails |
| ANPD complaint for data exposure | Low | HIGH | Data isolation, encryption, access controls |
| Law 31814 non-compliance (AI disclosure) | Low | MEDIUM | Built-in transparency at conversation start |
| Credit scoring bias | Medium | HIGH | Bias monitoring, explainability requirements |
| Voice misinterpretation leading to wrong record | High (initially) | MEDIUM | Confirmation step, uncertainty flagging |

---

## 10. Key Takeaways for Yaya Platform

1. **Never trust the LLM with numbers.** All financial calculations must be deterministic. The LLM's job is to *understand what the user said* and *present results in natural language* — not to *compute* anything.

2. **Confirmation is not optional.** Every financial transaction must show the user what Yaya understood and get explicit confirmation before recording. This is both a UX feature and a regulatory requirement.

3. **The 99.9% bar for invoicing is real.** SUNAT validates every electronic invoice against its schema. A single malformed XML will be rejected. Invoice generation must be completely rule-based.

4. **Voice accuracy will be Yaya's biggest technical challenge.** End-to-end voice-to-structured-data accuracy of ~75–80% is insufficient. The confirmation step bridges the gap, but investment in Peruvian Spanish speech recognition is critical.

5. **Audit trails are mandatory under Law 31814.** Every AI interaction that influences a business decision must be traceable. Build this from day one — retrofitting is nearly impossible.

6. **4-bit quantization is acceptable for conversation, not for extraction.** Consider running critical financial extraction tasks on a higher-precision model or fine-tuned specialist.

7. **The Dext study is a warning.** 50% of UK firms have lost money from chatbot financial advice. Yaya must be better than ChatGPT — and the way to be better is to **not use LLMs for the parts that matter most**.

8. **RAG is the minimum viable architecture.** Yaya's LLM must always retrieve data from verified sources (transaction database, SUNAT rules, product catalog) rather than generating from training weights.

9. **Credit scoring has the highest regulatory risk.** If Yaya provides credit scores or lending recommendations, it enters "high-risk AI" territory under Law 31814, requiring enhanced oversight, bias monitoring, and documentation.

10. **Start simple, get accurate, then expand.** Launch with sales logging (medium accuracy requirement, confirmation step). Add invoicing only after achieving 99.9%+ deterministic accuracy. Add credit scoring only after establishing robust audit infrastructure.

---

## Sources

1. Vectara, "LLM Hallucination Benchmarks" (2025)
2. Dext/caalley.com, "AI 'Slop' in the Books: The Rising Cost of Fixing Chatbot Errors" (Jan 2026)
3. Nature, "LLM Hallucinations in Financial Contexts" (2025)
4. J. Martin Consulting, "AI Accounting Weekly Newsletter Issue #6: LLM CPA Exam Performance" (Jul 2025)
5. AgentiveAIQ, "Do Chatbots Hallucinate? How to Stop It in Business AI" (Sep 2025)
6. AgentiveAIQ, "Why ChatGPT Can't Replace Financial AI Tools" (Sep 2025)
7. BizTech Magazine, "LLM Hallucinations: Implications for Financial Institutions" (Aug 2025)
8. IBM, "AI in Financial Services" (2023, 2025)
9. DataSnipper, "Financial AI Audit Tools" (2025)
10. Dialzara, "KPI Chatbot Metrics: Essential Guide to Tracking AI Success in 2025" (Sep 2025)
11. Haptik, "WhatsApp Chatbot Performance Optimization" (2023)
12. Aurora Inbox, "Key Metrics to Measure WhatsApp Chatbot Success" (May 2025)
13. TringTring.ai, "WhatsApp Analytics: Measuring AI Bot Performance and ROI" (Oct 2025)
14. Peru Law 31814, AI Promotion Law and implementing regulations (Dec 2025)
15. SUNAT, Electronic Invoicing Technical Requirements

---

*This document defines the accuracy framework for Yaya Platform. It should be reviewed by the engineering team during architecture design and updated as Peru's AI regulatory landscape evolves.*
