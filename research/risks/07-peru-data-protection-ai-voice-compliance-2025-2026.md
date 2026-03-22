# Peru Data Protection & AI Compliance for Voice-First SaaS (2025–2026)
## Yaya Platform's Regulatory Obligations Under Ley 29733, Supreme Decree 016-2024-JUS, and Law 31814

**Date:** March 22, 2026  
**Author:** Yaya Research Division  
**Version:** 1.0  
**Classification:** Compliance — Critical Path  

---

## Executive Summary

Yaya Platform operates at the intersection of three regulatory regimes that entered force or were strengthened in 2025: Peru's updated Personal Data Protection Law (PDPL, Ley 29733 as amended by Supreme Decree 016-2024-JUS, effective March 30, 2025), Peru's AI governance framework (Law 31814, July 2023, with implementing regulation Supreme Decree 115-2025-PCM), and WhatsApp/Meta's Business Platform policies. Because Yaya processes voice notes (potentially classifiable as biometric data), financial transaction records, and client contact information — all through an AI-powered system — the compliance requirements are non-trivial but navigable.

This document maps the specific obligations, deadlines, risk areas, and a practical compliance roadmap for Yaya's first 18 months of operation.

---

## 1. Peru's Updated Data Protection Framework (March 2025)

### 1.1 What Changed

Supreme Decree 016-2024-JUS completely replaced the 2013 regulatory framework on March 30, 2025. Key changes relevant to Yaya:

| Requirement | Old Regulation (2013) | New Regulation (2025) | Yaya Impact |
|---|---|---|---|
| Territorial scope | Peru-based processors | Includes foreign companies serving Peruvian users | Cloud infrastructure abroad requires compliance |
| Biometric data | Listed as sensitive | Expanded: "data derived from biometric data which by itself renders a data subject identifiable" | Voice prints from voice notes may qualify |
| Data Protection Officer | Not required (private sector) | Required based on revenue thresholds (phased) | Micro companies: deadline Nov 30, 2028 |
| Breach notification | No mandatory notification | 48-hour notification to ANPD for serious incidents | Requires incident response procedures |
| Security standards | General requirements | Aligned with ISO/IEC 27001 | Technical security documentation mandatory |
| Consent | Prior, informed, express | Prior, informed, express, unequivocal; written for sensitive data | Voice note processing needs explicit written consent |
| Data retention records | Basic logging | Continuous traceability records, 2-year minimum retention, secure disposal | Full audit trail for all data interactions |

### 1.2 Sensitive Personal Data: The Voice Note Question

The critical compliance question for Yaya: **Are voice notes "biometric data" under Peruvian law?**

**The new definition (post-March 2025):** "Biometric data, including data derived from biometric data which by itself renders a data subject identifiable."

**Analysis:**
- Voice notes sent for transcription are audio recordings of a specific person
- If Yaya stores the raw audio (even temporarily), the voice is an identifiable biometric characteristic
- If Yaya only stores the transcribed text and immediately deletes the audio, the biometric data argument is weaker
- However, voice patterns in audio files are inherently identifying — ANPD would likely classify them as biometric

**Recommendation:** Treat voice note audio as sensitive personal data. This means:
1. Written consent (not just verbal or click-through) for voice processing
2. Explicit disclosure of purpose, retention, and third-party processing (Whisper/OpenAI for STT)
3. ARCO rights must be operationalized for voice data
4. Immediate deletion of audio after transcription minimizes exposure

### 1.3 ANPD Enforcement Posture (2023–2026)

The ANPD has been increasingly active:
- **2023:** S/2.7 million in fines across 272 complaints (Baker McKenzie, Jan 2025)
- **Focus areas:** Consent violations, database registration failures, cross-border transfer non-disclosure
- **Digital services:** The authority "tends to focus on enforcing the Law in the context of digital services" (Baker McKenzie)
- **Maximum fines:** Up to S/535,000 (~USD $144,000) for very severe infringements, or 10% of gross annual income (whichever is less)

For a startup like Yaya, the 10% cap means early fines would be relatively small in absolute terms, but reputational damage and enforcement action could be existential.

### 1.4 DPO Requirement Timeline

| Company Size | Revenue Threshold | DPO Deadline |
|---|---|---|
| Large | >2,300 UIT (~$3.28M) | November 30, 2025 |
| Medium | 1,700–2,300 UIT | November 30, 2026 |
| Small | 150–1,700 UIT (~$217K–$2.5M) | November 30, 2027 |
| Micro | <150 UIT (~$217K) | November 30, 2028 |

**Yaya's position:** As a pre-revenue startup, Yaya falls in the micro category with a November 2028 deadline. However, appointing a DPO equivalent early (even informally) demonstrates good faith and compliance culture — valuable for investor presentations and ANPD interactions.

---

## 2. Peru's AI Governance Framework (Law 31814 + SD 115-2025-PCM)

### 2.1 Risk Classification for Yaya

Peru adopts a risk-based AI classification system similar to the EU AI Act:

**Yaya's AI components and likely classifications:**

| AI Component | Function | Risk Level | Rationale |
|---|---|---|---|
| Voice transcription (Whisper) | Converts audio to text | Medium | Speech processing, no decision-making |
| NLU/Intent extraction | Parses business transactions from text | Medium | Interpretive but non-critical |
| Inventory management AI | Tracks stock from voice commands | Low–Medium | Business operational, not rights-impacting |
| Financial record-keeping | Records revenue/expenses | High | Financial data, potential credit scoring impact |
| SUNAT invoice generation | Creates tax-compliant documents | High | Tax compliance, legal consequences of errors |
| Business analytics/insights | Daily summaries, trend analysis | Medium | Advisory, no automated decisions |
| Credit scoring (future) | Embedded finance data model | High | Explicitly listed as high-risk in Law 31814 |

### 2.2 Obligations for High-Risk AI Components

For Yaya's invoicing and financial components (classified high-risk):

1. **Lifecycle documentation:** Full records of system operation, training data, social impact assessments
2. **Human oversight:** Mechanisms for users to review, correct, and override AI-generated invoices/records
3. **Algorithmic transparency:** Clear information about system purpose, functions, and possible decisions (without revealing trade secrets)
4. **Security and privacy policies:** Documented, reviewed, and updated
5. **Staff training:** Personnel must be trained on AI risks (relevant for future hires)
6. **Labeling:** Users must be informed when interacting with AI (Yaya's WhatsApp persona makes this implicit, but explicit disclosure is advisable)

### 2.3 Implementation Timeline

The AI regulation phases in by sector:
- **Economy and finance:** September 2026
- **Commerce and labor:** September 2027
- **For SMEs:** Two years grace for small enterprises, three years for microenterprises

**Yaya's position:** As a microenterprise building tools for commerce, Yaya benefits from the longest grace periods. However, building compliance into the architecture from day one is far cheaper than retrofitting.

---

## 3. Cross-Border Data Transfer Considerations

### 3.1 Yaya's Data Flows

Yaya's architecture involves multiple cross-border data transfers:

| Data Flow | Origin | Destination | Data Type | Legal Basis Needed |
|---|---|---|---|---|
| Voice notes → STT | Peru (user) | Cloud (likely US — OpenAI Whisper API) | Audio/biometric | Consent + adequate safeguards |
| Transcribed text → LLM | Peru (server) | Cloud (US — OpenAI/Anthropic) | Business data, names | Consent + contract |
| Financial records → backup | Peru (server) | Cloud (region TBD) | Financial PII | Consent + adequate safeguards |
| SUNAT integration | Peru (server) | Peru (SUNAT) | Tax invoices | Legal obligation (no consent needed) |

### 3.2 Requirements

- **Notification to ANPD:** Cross-border transfers must be reported to the ANPD
- **Adequate safeguards:** Standard contractual clauses or equivalent protective mechanisms
- **User disclosure:** Privacy notice must clearly state that data is processed internationally
- **Data residency option:** Consider keeping primary database in Peru (AWS Lima region or local provider) to minimize transfer obligations

### 3.3 The STT Provider Question

Using OpenAI's Whisper API means sending audio (sensitive/biometric data) to a US-based processor. Options:

1. **Self-hosted Whisper:** Deploy Whisper locally (on c.yaya.sh or cloud GPU in South America). Eliminates cross-border audio transfer entirely. **Recommended for MVP.**
2. **OpenAI API with DPA:** Use OpenAI's Data Processing Agreement. Audio must still be disclosed in privacy notice.
3. **Hybrid:** Self-hosted for audio transcription, cloud API only for text-based LLM processing (reduces biometric data exposure).

**Recommendation:** Self-host Whisper for voice processing. Send only anonymized/de-identified text to cloud LLMs. This dramatically simplifies compliance.

---

## 4. Practical Compliance Checklist for Yaya MVP

### Phase 1: Pre-Launch (Before First User)

- [ ] Draft bilingual privacy policy (Spanish/English) covering:
  - Voice note processing and deletion policy
  - Financial data collection and use
  - Cross-border data transfers
  - ARCO rights and how to exercise them
  - Third-party processors (list all)
- [ ] Design consent flow in WhatsApp onboarding:
  - First message explains data processing clearly
  - User must send explicit written consent ("Acepto") before processing begins
  - Separate consent for voice vs. text processing
  - Easy withdrawal mechanism ("Cancelar datos")
- [ ] Register database with ANPD (free registration)
- [ ] Implement audio deletion policy: raw voice notes deleted within 1 hour of transcription
- [ ] Deploy Whisper self-hosted to eliminate cross-border audio transfer
- [ ] Create Security Document (mandatory under new regulation):
  - Access management procedures
  - Privilege management and verification
  - Data lifecycle policies
- [ ] Implement audit trail: log all data interactions with timestamps, 2-year retention

### Phase 2: Post-Launch (First 6 Months)

- [ ] ARCO request handling procedure:
  - Access: User can request all data Yaya holds about them
  - Rectification: Mechanism to correct business records
  - Cancellation: Full data deletion on request (with SUNAT retention exceptions)
  - Opposition: Opt out of analytics/insights processing
- [ ] Breach response procedure:
  - Detection → internal assessment → ANPD notification (48 hours) → user notification
  - Template notifications pre-drafted
- [ ] ISO 27001-aligned security measures documented
- [ ] Vendor assessment for all third-party processors

### Phase 3: Scaling (6–18 Months)

- [ ] Appoint informal DPO/Privacy Lead
- [ ] Conduct Privacy Impact Assessment for embedded finance features
- [ ] Review and update AI lifecycle documentation for high-risk components
- [ ] Prepare for AI regulation compliance (September 2026 for finance sector)

---

## 5. Voice Data Architecture: Compliance by Design

The optimal architecture for Yaya minimizes regulatory surface area:

```
User sends voice note via WhatsApp
    ↓
WhatsApp Cloud API delivers audio file (OGG/Opus)
    ↓
Yaya backend downloads audio to Peru-hosted server
    ↓
Self-hosted Whisper transcribes audio → text
    ↓
Audio file DELETED (within minutes, logged)
    ↓
Transcribed text processed by NLU (text-only)
    ↓
Structured data (transactions, inventory) stored in Peru DB
    ↓
Text-only queries sent to cloud LLM (if needed)
    ↓
Response delivered via WhatsApp text message
```

**Key compliance properties:**
- Audio never leaves Peru → no cross-border biometric transfer
- Audio deleted immediately → minimal data retention risk
- Only text sent to cloud LLMs → standard PII handling, not biometric
- Full audit trail at each step → traceability requirement met
- User consent collected before any processing begins

---

## 6. SUNAT Data: Special Regulatory Carve-Out

SUNAT-related data (invoices, tax records) has a separate legal basis:

- **No consent needed:** Processing for SUNAT compliance is a legal obligation (exemption under PDPL)
- **Retention required:** Tax records must be retained for the period required by tax law (typically 5 years)
- **Cannot be deleted on ARCO request:** User can request deletion of non-tax data, but tax records are legally protected
- **SUNAT integration is domestic:** No cross-border transfer issues

This creates a clean separation: tax compliance data has its own legal basis and retention rules, while business analytics and voice data require consent-based processing.

---

## 7. Competitive Advantage Through Compliance

Most of Yaya's competitors (informal WhatsApp-based tools, paper notebooks, even Alegra to some degree) do not fully comply with Peru's updated data protection laws. Yaya can turn compliance into a competitive advantage:

1. **Trust signal:** "Tus datos están protegidos — cumplimos con la Ley de Protección de Datos Personales" in onboarding
2. **Formalization gateway:** Businesses using Yaya are partially formalized — their data is protected, their invoices are compliant. This is attractive to the growing number of businesses being pushed toward formalization by SUNAT.
3. **Investor narrative:** Compliance-by-design is increasingly important for VC due diligence, especially for fintech-adjacent products
4. **ANPD relationship:** Early voluntary compliance can lead to positive regulatory relationships, especially as ANPD expands enforcement to digital services

---

## 8. Risk Assessment Matrix

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| ANPD enforcement action for consent failure | Medium (30%) | High | Robust onboarding consent flow |
| Voice notes classified as biometric → enhanced obligations | High (70%) | Medium | Self-host Whisper, delete audio immediately |
| Cross-border transfer violation (cloud LLM) | Low (15%) | Medium | DPA with providers, ANPD notification |
| AI regulation non-compliance (high-risk classification) | Low (10%) | Medium | Microenterprise grace period to Sep 2028+ |
| Data breach notification failure | Low (20%) | High | Pre-built incident response procedure |
| User ARCO request unhandled | Medium (25%) | Medium | Automated ARCO response system |
| Competitor uses compliance as negative marketing | Very Low (5%) | Low | Proactive compliance positioning |

---

## 9. Key Recommendations for Andre

### 1. Self-Host Whisper from Day One
This single architectural decision eliminates the most complex compliance issue (cross-border biometric transfer). c.yaya.sh has the GPU capacity (2× RTX A5000) to run Whisper v3 locally. The cost is already sunk.

### 2. Treat Voice Notes as Sensitive Data
Don't wait for ANPD to make a ruling. Assume voice audio is biometric/sensitive. Design the consent flow accordingly. If ANPD later clarifies otherwise, you've over-complied (which is always better than under-complying).

### 3. Delete Audio Immediately After Transcription
This is the single most impactful privacy measure. If you don't retain the audio, you don't have biometric data to protect. Log the deletion for audit purposes.

### 4. The Grace Period Is Your Friend — But Don't Rely on It
Micro-enterprise grace periods (DPO by Nov 2028, AI compliance by Sep 2028+) give Yaya breathing room, but building compliance into the architecture now is 10× cheaper than retrofitting later. The MVP should ship with privacy-by-design.

### 5. Compliance Is a Moat, Not a Cost
In a market where 75% of micro-enterprises use no digital tools and the informal economy has zero data protection, Yaya's compliance positioning is a trust signal that competitors cannot match without significant investment.

---

## 10. Sources and Legal References

- Peru Personal Data Protection Law No. 29733 (PDPL)
- Supreme Decree 016-2024-JUS (New Regulation, effective March 30, 2025)
- Law 31814 (AI Governance, July 2023)
- Supreme Decree 115-2025-PCM (AI Regulation Implementation)
- Law 32314 (Cybercrime/AI Criminal Liability, April 2025)
- DLA Piper Data Protection Guide — Peru (2025)
- Secure Privacy — Peru Compliance Guide (2025)
- Baker McKenzie — Peru Regulators & Enforcement Priorities (January 2025)
- CMS Expert Guide — Data Protection and Cybersecurity Laws, Peru (2025)
- Nemko Digital — Peru AI Regulation Explained (2025)

---

*This document maps Yaya Platform's specific obligations under Peru's updated data protection and AI governance frameworks. The core finding: compliance is achievable with architectural decisions made at the design stage (self-hosted STT, immediate audio deletion, consent-first onboarding). The grace periods for micro-enterprises provide 2+ years of runway, but building compliance into the MVP is both cheaper and strategically superior.*
