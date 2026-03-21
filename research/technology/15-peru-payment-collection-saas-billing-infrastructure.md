# Peru Payment Collection Infrastructure for Micro-Enterprise SaaS Billing

**Research Document #15 (Technology)**
**Date:** March 21, 2026
**Category:** Technology / Payments
**Relevance:** Critical — directly determines whether Yaya can collect subscription revenue

---

## Executive Summary

Yaya's biggest unsolved tactical problem isn't AI accuracy or WhatsApp API costs — it's **how to collect S/29/month from a salon owner who doesn't have a credit card.** Peru's payment infrastructure has undergone a revolution since 2022 with mandatory Yape-Plin interoperability, but recurring SaaS billing for micro-enterprises remains a gap in the ecosystem. This document maps every viable collection channel, evaluates technical feasibility, and recommends a phased billing strategy.

---

## 1. The Payment Reality for Peruvian Micro-Enterprises

### 1.1 The Credit Card Problem

Peru has approximately 10.5 million credit cards in circulation (ASBANC, 2024), but distribution is heavily skewed toward formal-sector employees and Lima's middle class. Among micro-enterprise owners — Yaya's target market — credit card penetration is estimated at **15-25%** in Lima and **5-10%** in provinces (INEI ENAHO 2023).

This means **75-90% of Yaya's potential customers cannot pay via traditional SaaS billing** (credit card on file with Stripe/PayPal). Any SaaS billing strategy that begins with "enter your credit card" will exclude three-quarters of the addressable market.

### 1.2 How Peruvian Micro-Enterprises Actually Pay for Services

Based on ethnographic research (market/12) and payment behavior data:

| Payment Method | Adoption Among Target SMBs | Recurring Capable? | Notes |
|---|---|---|---|
| Cash | ~95% | No (manual) | Still dominant for services |
| Yape (BCP) | ~75-85% | **Yes (new, 2025)** | 14M+ active users |
| Plin (BBVA/IBK/Scotiabank) | ~40-50% | Limited | Interoperable with Yape since March 2023 |
| Bank transfer | ~30-40% | Yes (manual setup) | Requires bank account |
| Debit card | ~35-45% | Yes (via gateway) | Higher penetration than credit |
| Credit card | ~15-25% | Yes | Traditional SaaS model |

### 1.3 The Yape Revolution

Yape, launched by BCP (Peru's largest bank), has fundamentally changed how Peruvians move money:

- **14 million+ active users** as of 2025 (in a country of 33 million)
- **93% transaction approval rate** (Yape internal data via EBANX, July 2025)
- **S/2,000 daily transaction limit** per user
- Features: P2P transfers, bill payments, microloans, QR payments, marketplace
- **Yape now supports recurring payments and on-file payments** through merchant integrations (EBANX partnership, July 2025)

The EBANX-Yape partnership is particularly significant: "Yape supports both recurring and one-click and on-file payments through a simple user enrollment process" (EBANX press release, July 10, 2025). This means automated recurring billing through Yape is now technically possible for the first time.

---

## 2. Payment Collection Channels: Technical Analysis

### 2.1 Channel 1: Yape via Payment Gateway (Recommended Primary)

**How it works:**
- User enrolls their Yape account with Yaya through a one-time OTP (One-Time Password) verification
- Each month, Yaya triggers a payment request through a payment gateway (PayU, EBANX, or Pay-me)
- User receives notification in Yape app, approves payment
- Gateway confirms payment to Yaya's backend

**Technical integration options:**

| Gateway | Yape Support | Recurring | API Quality | Peru-Focused | Cost |
|---|---|---|---|---|---|
| PayU Latam | ✅ Yes | ✅ (via OTP) | Good REST API | Yes | 3.5-4.5% + fees |
| EBANX | ✅ Yes (direct) | ✅ On-file | Good | Brazil-focused but Peru covered | 3-5% |
| Pay-me | ✅ Yes | ✅ Subscriptions API | Good | Peru-native | 3-4% |
| Nuvei | ✅ Yes (Billetera QR) | Limited | Enterprise-grade | Global | 2.5-3.5% |
| Monnet Payments | ✅ Yes (Yape OCP) | ✅ Subscriptions | Good | LATAM-focused | 3-4% |

**Recommended:** Pay-me (Peru-native, has explicit subscription/recurring API for Yape) or Monnet Payments (has Yape subscription creation + cancellation + webhook support).

**PayU integration flow (documented):**
```
POST /payments-api/4.0/service.cgi
{
  "transaction": {
    "paymentMethod": "YAPE",
    "extraParameters": { "OTP": "<user_otp>" },
    "payer": {
      "contactPhone": "<yape_phone_number>",
      "dniNumber": "<user_dni>"
    }
  }
}
```

**Key limitation:** Yape OTP-based payments require the user to generate a new OTP code for each transaction. True "set and forget" recurring billing (like a credit card on file) requires the on-file enrollment flow available through EBANX or Monnet's subscription API.

**Cost analysis at scale:**
- At S/29/month subscription price
- Gateway fee: ~3.5% = S/1.02 per transaction
- Per transaction in USD: ~$0.27
- At 300 users: ~$81/month in payment processing fees
- At 1,000 users: ~$270/month

### 2.2 Channel 2: WhatsApp-Native Payment Reminder + Yape QR

**How it works:**
- Yaya sends a WhatsApp message on billing day with a Yape QR code
- User scans QR code with Yape app and pays
- Yaya's backend checks for payment via webhook/polling

**Advantages:**
- Zero payment gateway fees (direct Yape P2P transfer)
- Natural in the WhatsApp conversation flow
- User already in the app they trust

**Disadvantages:**
- Manual action required each month (higher friction = higher churn)
- Need to register as Yape merchant for QR payments
- No automated retry for failed/forgotten payments
- Reconciliation complexity

**Best for:** Initial MVP / Customer Zero phase (0-50 users) where Andre can manually verify payments.

### 2.3 Channel 3: Agente Corresponsal (Cash Collection)

**How it works:**
- User walks to an Agente BCP (bodega with banking terminal) and makes a cash deposit to Yaya's bank account with a reference number
- Yaya's system matches the deposit to the user account

**Peru's agent network is massive:**
- BCP alone has **10,500 agentes corresponsales** nationwide (2024)
- 60% are in provinces outside Lima
- 40.3 million transactions per month across the network
- Average transaction: S/170-200
- Deposit/withdrawal limits: S/1,000 per transaction, S/2,500 per day

**Technical implementation:**
- Register a BCP business account
- Generate unique reference codes for each user (e.g., "YAYA-0001")
- Monitor account for incoming deposits via BCP API or manual reconciliation
- Match deposit + reference to user account

**Cost:** Essentially zero (BCP doesn't charge agents or customers for deposits)

**Best for:** Users in provinces without reliable internet, cash-only businesses, as fallback option.

### 2.4 Channel 4: Contador-Mediated Collection

**How it works:**
- Contador (accountant) bundles payments from their 15-30 salon clients
- Contador pays Yaya a single monthly invoice for all clients
- Yaya gives contador a wholesale discount (e.g., S/22/user instead of S/29)

**Advantages:**
- Dramatically simplifies billing (15-30 individual payments → 1 invoice)
- Contador is motivated by the margin
- Reduces involuntary churn (contador handles payment issues)
- Contador already has a trust relationship with the salon owner

**This is the killer billing strategy.** It aligns with the contador distribution channel (market/13) and solves the payment collection problem simultaneously. The contador becomes both the sales channel AND the billing channel.

**Financial model:**
- Retail price: S/29/month
- Contador wholesale: S/22/month
- Contador margin: S/7/user/month × 20 users = S/140/month passive income
- Yaya's effective ARPU: S/22 (24% discount)
- But: zero collection costs, zero churn from payment failures

### 2.5 Channel 5: Direct Bank Transfer (Debit Card)

**How it works:**
- User provides debit card details
- Yaya processes monthly recurring charge via payment gateway

**Technical:** Same gateways as credit card (PayU, Stripe where available)

**Penetration:** Debit cards are more common than credit (~35-45% of target market), but many micro-enterprise owners' debit cards are Yape-linked BCP cards. Going through Yape directly is simpler.

---

## 3. Recommended Phased Billing Strategy

### Phase 1: Customer Zero (0-10 users, MVP)
**Method:** WhatsApp QR code + manual Yape transfer
- Andre generates a Yape QR code monthly
- Sends via WhatsApp: "Hola María, tu suscripción de Yaya para abril es S/29. Escanea este código para pagar 🙏"
- Manually checks Yape for incoming payments
- **Cost:** $0 in payment infrastructure
- **Time:** 5 min/user/month

### Phase 2: Early Pilot (10-50 users)
**Method:** Pay-me or Monnet subscription API for Yape recurring
- Integrate subscription billing API
- Users enroll once, get charged monthly
- Webhook notifications for successful/failed payments
- **Cost:** ~3.5% per transaction + integration time (~1 week)
- **Fallback:** WhatsApp QR for users who fail enrollment

### Phase 3: Contador Channel (50-300 users)
**Method:** Contador wholesale billing + Yape recurring for direct users
- Contadores pay monthly invoice (bank transfer or single Yape payment)
- Direct users on Yape recurring
- Introduce annual prepayment option (S/290/year = 2 months free)
- **Revenue split:** ~60% via contador channel, ~40% direct
- **Effective ARPU:** ~S/25 blended

### Phase 4: Scale (300-1,000+ users)
**Method:** Multi-method with automated dunning
- Yape recurring (primary)
- Debit/credit card via Stripe (now available in Peru) or PayU
- Contador invoicing
- Agente corresponsal as fallback
- WhatsApp dunning sequence for failed payments:
  - Day 0: Payment failed notification
  - Day 3: Reminder with alternative payment methods
  - Day 7: "Your Yaya reports will pause in 3 days"
  - Day 10: Service paused (not cancelled — data preserved)
  - Day 30: Final notice before archival

---

## 4. Peru Interoperability Mandate: Impact on Yaya

The BCRP (Central Bank of Peru) mandated payment interoperability in phases:

- **Phase 1 (March 2023):** Yape ↔ Plin interoperability ✅ Complete
- **Phase 2 (June 2023):** Extended to all banks and QR registry ✅ Complete
- **Phase 3 (September 2023):** Full QR interoperability ✅ Complete
- **Phase 4 (ongoing):** Fintech integration into CCE (Cámara de Compensación Electrónica)

**Impact for Yaya:** By accepting Yape, Yaya effectively accepts payments from Plin users too (through interoperable QR). This covers approximately **85-90% of digital wallet users in Peru.**

---

## 5. Cost Comparison: Collection Methods at Scale

| Method | Users | Revenue/mo | Collection Cost | Net Revenue | Net Margin |
|---|---|---|---|---|---|
| WhatsApp QR (manual) | 50 | S/1,450 | S/0 + 2h Andre time | S/1,450 | 100% (but time cost) |
| Yape recurring (gateway) | 300 | S/8,700 | S/305 (3.5%) | S/8,395 | 96.5% |
| Contador wholesale | 300 | S/6,600 | S/0 | S/6,600 | 100% (but lower ARPU) |
| Blended (60% cont + 40% direct) | 500 | S/9,360 | S/204 | S/9,156 | 97.8% |

---

## 6. Critical Technical Decision: Payment Provider Selection

### Recommended: Monnet Payments (Pay-me)

**Why:**
1. Peru-native company, understands local market
2. Explicit Yape subscription API (create/cancel/webhook)
3. Supports QR code payments as backup
4. Reasonable pricing (~3-4%)
5. Good API documentation in Spanish
6. Supports both one-shot and on-file Yape payments

**Integration timeline:** ~1 week for basic Yape subscription billing

**Alternative:** PayU Latam (larger company, more stable, but Yape payments require OTP per transaction — no true recurring without additional setup)

---

## 7. Key Risks and Mitigations

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Yape changes recurring payment terms | Low | High | Multi-channel billing; debit card fallback |
| Gateway reliability issues | Medium | Medium | Implement 2 gateways; manual fallback |
| User doesn't approve monthly charge | Medium | High | WhatsApp reminders; dunning sequence |
| Cash-only users can't pay digitally | Medium | Medium | Agente corresponsal option; contador bundle |
| Peru regulatory changes to payment processing | Low | Medium | Monitor BCRP/SBS regulations |

---

## 8. Conclusions and Recommendations

1. **Start with WhatsApp QR + manual Yape** (Phase 1). Zero cost, works today.
2. **Integrate Monnet/Pay-me Yape subscription API** before reaching 50 users.
3. **The contador channel solves billing AND distribution simultaneously.** This is the single most important insight: contadores eliminate individual payment collection entirely.
4. **Never require a credit card.** Any onboarding flow that demands a credit card will lose 75%+ of the addressable market.
5. **Annual prepayment (S/290/year) offered in September-October** locks users through the high-churn January-February window (connecting to seasonal research, market/15).
6. **Yape's 93% approval rate** is remarkable for the market — higher than credit cards in Peru (~70-80%).

The payment collection problem is solvable. It requires a different approach than Silicon Valley SaaS (no Stripe subscription page), but the tools exist and the infrastructure is mature.

---

*Sources: PayU Latam Developer Documentation (2024), EBANX-Yape press release (July 2025), Pay-me API Documentation, Monnet Payments Yape OCP Guide, BCRP Interoperability White Paper (2023), BCP Agente Corresponsal data (Microfinanzas.pe, 2024), CGAP Peru Banking Agents Analysis*
