# Vertical Market Analysis: Yaya Platform in Latin America

**Document Type:** Industry Vertical Analysis  
**Author:** Research Division  
**Date:** March 21, 2026  
**Classification:** Strategic — Internal Use  
**Methodology:** Multi-source triangulation using market research databases, government statistics, industry reports, and primary trade data  

---

## Executive Summary

This analysis evaluates ten vertical market opportunities for the Yaya Platform across Latin America, with emphasis on Peru as the beachhead market. After systematic scoring across market size, technology gap, pain-point severity, competitive density, and Yaya's differentiated capability (WhatsApp-native AI agent + MCP tooling), six verticals are selected for deep-dive analysis. The top six verticals—ranked by composite opportunity score—are:

1. **Restaurant & Food Service** — $86B+ LATAM market, massive SMB tail, WhatsApp ordering already dominant
2. **Retail & Fashion (Social/Conversational Commerce)** — $18.2B WhatsApp commerce volume in LATAM, 4.7M businesses selling via WhatsApp
3. **Beauty & Salon Services** — $155B global market, 20% no-show rate, near-zero digital tooling in Peru SMBs
4. **Healthcare & Dental (Private Clinics)** — $12.8B LATAM digital health market, 24% CAGR telehealth
5. **Tourism & Travel (Peru)** — $23B sector contribution, 4.16M international visitors (2025), WhatsApp as de facto booking channel
6. **Import/Export SMBs (Peru–China Corridor)** — $43.4B bilateral trade, crushing SUNAT documentation burden

Agricultural/AgriTech ($2.2B LATAM), construction, education, and manufacturing are assessed but deprioritized for initial go-to-market given Yaya's current architecture strengths.

---

## Methodology

Each vertical was evaluated against seven dimensions:

| Dimension | Weight | Description |
|-----------|--------|-------------|
| Total Addressable Market (TAM) | 20% | Revenue pool size in LATAM/Peru |
| Potential Customer Count | 15% | Number of SMBs/operators addressable |
| Technology Gap | 20% | Distance between current tooling and what Yaya can provide |
| Pain-Point Severity | 15% | Urgency and economic cost of unsolved problems |
| Competitive Moat | 10% | Defensibility against incumbents and new entrants |
| CAC/LTV Economics | 10% | Unit economics viability |
| Entry Complexity | 10% | Regulatory, technical, and go-to-market barriers |

Data sources include Fortune Business Insights, Grand View Research, Cognitive Market Research, IMARC Group, Aurora Inbox, Statista, OEC World, SUNAT, WTTC, and multiple industry-specific reports published between 2024 and 2026.

---

## Vertical 1: Restaurant & Food Service

### Market Overview

The Latin American quick-service restaurant (QSR) market alone was valued at **USD 86.2 billion in 2024**, projected to reach **USD 182.8 billion by 2032** at a 9.87% CAGR (Fortune Business Insights, 2026). The broader South American food service market was estimated at **USD 183.1 billion in 2025**, growing at 5.85% CAGR (Cognitive Market Research, 2025). The online food delivery market in LATAM exceeded **USD 3.8 billion in 2024**, with the broader delivery segment projected at **$30.52 billion by 2025** (Cocina Digital, 2025).

Brazil controls ~45% of the market, Mexico ~26%, with Peru, Colombia, and Chile forming the next tier. Peru specifically has a vibrant food culture (Lima is repeatedly ranked among the world's top culinary cities) with tens of thousands of restaurants ranging from cevicherías to pollerías.

### Number of Potential Customers

Peru alone has approximately **2.29 million MSMEs** (Statista/PRODUCE, 2023–2024), with wholesale/retail trade and "other services" (which includes food service) as the two largest categories. Across LATAM, **4.7 million businesses** are now actively selling via WhatsApp (Aurora Inbox, 2026), with food and beverages representing **19% of WhatsApp commerce volume** and achieving the **highest conversion rate at 61%**.

Conservative estimate for Peru food-service SMBs addressable by Yaya: **80,000–120,000** restaurants and food businesses in Lima, Arequipa, Cusco, and Trujillo.

### Current Technology Usage

- **Rappi** operates in 9 LATAM countries (including Peru as a "core market"), charging restaurants 15–30% commission (Cocina Digital, 2025).
- **PedidosYa** leads in Argentina, Uruguay, and Paraguay with similar commission structures.
- **iFood** dominates Brazil with 83% market share and 60M monthly orders.
- **31% of Latin Americans still don't own smartphones**; many order via WhatsApp messages or phone calls to local motoboys (Independent.org, 2023).
- Only partial POS integration exists. Most SMB restaurants manage orders through personal WhatsApp, handwritten notes, or basic spreadsheets.

### Pain Points Yaya Can Solve

| Pain Point | Severity | Yaya Solution |
|------------|----------|---------------|
| High delivery platform commissions (15–30%) | Critical | Direct WhatsApp ordering with AI agent, zero commission |
| Order management chaos (WhatsApp + phone + walk-in) | High | Unified order intake via WhatsApp Business API with structured processing |
| No customer data/CRM | High | Automated customer profiles, order history, reorder suggestions |
| Inventory/menu management | Medium | MCP-integrated menu tools, stock alerts |
| Payment friction | Medium | Payment link generation (Yape, Plin, Mercado Pago integration) |
| Scheduling/staffing | Medium | Demand forecasting based on order patterns |

### Key MCP Tools/Skills Needed

- `whatsapp-business-api` — Message handling, catalog management, order processing
- `payment-gateway` — Yape/Plin/Mercado Pago link generation
- `pos-integration` — Connection to basic POS systems
- `menu-manager` — Dynamic menu with prices, availability, images
- `customer-crm` — Profile building, order history, preferences
- `analytics-dashboard` — Daily/weekly sales reports

### Competitive Threats

| Competitor | Threat Level | Weakness |
|------------|-------------|----------|
| Rappi/PedidosYa/iFood | High | 15–30% commissions destroy margins for SMBs; not WhatsApp-native |
| Aurora Inbox | Medium | LATAM WhatsApp commerce platform, but generic (not restaurant-specific) |
| Jelou | Medium | AI chat automation, lacks vertical depth |
| Local WhatsApp bots | Low | Fragmented, no ecosystem, poor AI |

**Key insight:** Rappi's strength is consumer demand aggregation, but restaurants lose 15–30% per order. A Yaya agent that enables direct WhatsApp ordering while maintaining the convenience customers expect creates a powerful value proposition: **same customer experience, 0% commission**.

### CAC and LTV Estimates

- **CAC:** $15–30 per restaurant (WhatsApp-based outreach, referrals from early adopters, food association partnerships)
- **Monthly ARPU:** $25–50 (tiered pricing: basic free tier → premium with analytics/CRM)
- **Churn:** Estimated 5–8% monthly in first year, declining to 3–4% as habits form
- **LTV (24-month):** $360–720
- **LTV:CAC ratio:** 12–24x (excellent)

### Entry Strategy

1. **Phase 1 (Months 1–3):** Lima pilot with 50 pollerías and cevicherías in Miraflores/San Isidro. Free tier with WhatsApp order management. Prove conversion rates.
2. **Phase 2 (Months 4–6):** Expand to 500 restaurants. Launch premium tier with CRM, analytics, and payment integration.
3. **Phase 3 (Months 7–12):** Geographic expansion to Arequipa, Cusco, Trujillo. Begin Brazil/Colombia market entry planning.
4. **Partnership lever:** Asociación Peruana de Gastronomía (APEGA), local culinary schools.

---

## Vertical 2: Retail & Fashion (Conversational Commerce)

### Market Overview

Latin American e-commerce is projected at **$191 billion in 2025** (Uniqbe, 2026). Within this, **conversational commerce via WhatsApp** has emerged as a distinct, rapidly growing channel:

- **Total LATAM conversational commerce volume: $18.2 billion in 2026**, growing at 35% YoY (Aurora Inbox, 2026)
- **WhatsApp accounts for 72% of this volume** (up from 64% in 2025)
- **4.7 million businesses** actively sell via WhatsApp across LATAM, growing at 42% annually
- **168 million users** have made at least one WhatsApp purchase
- Fashion and apparel is the **#1 category at 28% of volume** with 52% conversion rate

In Peru specifically, **66% of businesses with digital presence** sell actively via WhatsApp, with an average order value of $37 and **47% annual growth** (Aurora Inbox, 2026). This is one of the fastest adoption rates in the region.

### Number of Potential Customers

Peru's ~1 million wholesale/retail MSMEs represent the broadest addressable base. Focusing on fashion, clothing, and accessories retailers actively using Instagram and WhatsApp:

- **Estimated addressable in Peru:** 50,000–80,000 fashion/retail SMBs
- **LATAM-wide:** 1.5–2 million fashion retail SMBs using WhatsApp for sales

### Current Technology Usage

- **WhatsApp Business** (free tier) is the dominant tool — manual catalog sharing, voice notes, photo messages
- **Instagram Shopping** is used for discovery but transactions close on WhatsApp
- **Mercado Libre** serves as the formal marketplace, but SMBs prefer WhatsApp's zero-commission direct sales
- **No CRM, no inventory sync, no automated responses** for the vast majority
- Payment via bank transfer/Pix (52% Brazil), Yape (Peru), cash on delivery (17% Peru)

**Critical data point:** WhatsApp commerce with AI assistance achieves **45–55% conversion rates** versus 1.5–2.1% for mobile e-commerce websites. This is a **13–19x improvement** (Aurora Inbox, 2026). Businesses with AI agents report **340% increase in service capacity** and **67% increase in sales**.

### Pain Points Yaya Can Solve

| Pain Point | Severity | Yaya Solution |
|------------|----------|---------------|
| Manual WhatsApp response limits growth | Critical | 24/7 AI agent handles inquiries, qualifies leads, processes orders |
| No inventory visibility across channels | High | MCP-integrated inventory sync (WhatsApp ↔ Instagram ↔ physical stock) |
| Lost sales from slow response times | High | Sub-30-second AI response (vs. 23-minute human average) |
| No catalog management | High | WhatsApp Business API catalog automation, visual product cards |
| Cart abandonment / follow-up | Medium | Automated cart recovery messages (28% recovery rate) |
| Customer data scattered across chats | Medium | Unified CRM from WhatsApp conversation history |

### Key MCP Tools/Skills Needed

- `whatsapp-catalog` — Product listing, pricing, availability
- `inventory-sync` — Cross-channel stock management
- `payment-link-generator` — Multi-provider (Yape, Mercado Pago, bank transfer)
- `order-tracker` — Status updates, delivery coordination
- `instagram-integration` — DM-to-WhatsApp handoff, story product tagging
- `customer-analytics` — Purchase history, segment-based promotions

### Competitive Threats

| Competitor | Threat Level | Weakness |
|------------|-------------|----------|
| Aurora Inbox | High | Direct competitor in WhatsApp commerce; CRM + AI focus. Priced $99–329/mo |
| Jelou | Medium | AI chat automation. Less commerce-specific |
| Shopify + WhatsApp plugins | Medium | Requires Shopify subscription; complex for LATAM SMBs |
| Mercado Libre | Low-Medium | Marketplace model, not conversational; charges commissions |

### CAC and LTV Estimates

- **CAC:** $20–40 (Instagram ads targeting business accounts, WhatsApp group outreach, referral programs)
- **Monthly ARPU:** $30–80 (freemium → premium with AI agent, analytics)
- **Churn:** 6–10% monthly (high churn risk from price sensitivity; mitigated by stickiness of AI agent integration)
- **LTV (24-month):** $400–960
- **LTV:CAC ratio:** 10–24x

### Entry Strategy

1. **Phase 1:** Target Instagram-active fashion sellers in Lima (Gamarra textile district as hub). Offer free WhatsApp catalog + basic AI responder.
2. **Phase 2:** Upsell to full AI sales agent with payment processing. Partner with fashion trade shows and Instagram fashion communities.
3. **Phase 3:** Expand to beauty/cosmetics sellers (natural adjacent vertical). Begin dropshipping support tools for China-sourced products.

---

## Vertical 3: Beauty & Salon Services

### Market Overview

The global beauty salon market was valued at **USD 155.6 billion in 2022**, growing at 8% CAGR (Grand View Research). The beauty appointment service market globally is projected at **$15 billion by 2032**, growing at **16% CAGR** (HTF Market Insights, 2025). Latin America's beauty market is among the world's most vibrant, with Brazil ranking as the **4th largest beauty market globally**.

Peru has a dedicated market tracked by 6W Research, with both spa/beauty salon and salon service categories showing active growth through 2031. Culturally, beauty services are deeply integrated into Peruvian daily life—haircuts, manicures, and skincare are not luxuries but routine expenditures across all socioeconomic classes.

### Number of Potential Customers

- **Peru:** Estimated 40,000–60,000 registered beauty/salon businesses, with significant informal sector adding potentially another 30,000+
- **LATAM:** 500,000+ salon/spa businesses
- Peru's ~2.29M MSMEs include a substantial services component; beauty/personal care is among the highest-density SMB categories per capita

### Current Technology Usage

- **Appointment booking:** Overwhelmingly via WhatsApp messages and phone calls. Less than 10% use any formal booking software in Peru.
- **Booking platforms (Fresha, Booksy, Vagaro):** Strong in US/Europe but negligible penetration in Peru and most of LATAM outside Brazil
- **No-show management:** Virtually non-existent. Salons lose an estimated **20% of appointments** to no-shows (Salon Today Industry Report), costing a typical salon **$3,600/month** (Salon Business Report, 2025)
- **Marketing:** Instagram is primary marketing channel; appointment conversion happens via WhatsApp DM
- **Payment:** Cash dominant, with growing Yape/Plin adoption

**Critical data point:** **40% of salon clients prefer online appointment booking** (Gitnux, 2023), but very few LATAM salons offer it. Automated SMS/WhatsApp reminders reduce no-shows by **50–67%** (multiple sources). This represents a massive, immediately monetizable gap.

### Pain Points Yaya Can Solve

| Pain Point | Severity | Yaya Solution |
|------------|----------|---------------|
| 20%+ no-show rate | Critical | Automated WhatsApp confirmation/reminder sequence (24h, 2h before) |
| Manual appointment booking via WhatsApp | High | AI agent handles scheduling, rescheduling, cancellation via natural conversation |
| No client history/preferences | High | CRM with service history, preferred stylist, product preferences |
| Revenue leakage from underbooked slots | High | Waitlist management, last-minute slot promotions via WhatsApp broadcast |
| Marketing is ad hoc | Medium | Before/after photo sharing, automated review requests, loyalty programs |
| Staff scheduling complexity | Medium | Calendar sync, staff availability management |

### Key MCP Tools/Skills Needed

- `appointment-scheduler` — Calendar management with conflict detection
- `whatsapp-reminder` — Automated confirmation and reminder sequences
- `client-crm` — Service history, preferences, notes
- `waitlist-manager` — Fill cancelled slots automatically
- `instagram-gallery` — Before/after portfolio management
- `payment-processing` — Deposits for high-value services, Yape/Plin integration
- `loyalty-program` — Visit tracking, rewards, referral bonuses

### Competitive Threats

| Competitor | Threat Level | Weakness |
|------------|-------------|----------|
| Fresha | Medium | Global leader but minimal LATAM penetration; English-centric; requires app adoption |
| Booksy | Medium | Similar to Fresha; weak in Peru |
| Square Appointments | Low | US-focused; requires Square payment ecosystem |
| Local appointment apps | Low | Fragmented, poor AI, low adoption |

**Key insight:** The beauty vertical has a **"blue ocean" in Peru** — no dominant digital booking platform, WhatsApp is already the booking channel, and the no-show problem creates an immediate, quantifiable ROI. A Yaya agent that simply sends WhatsApp reminders and handles rescheduling saves $3,600/month for the average salon.

### CAC and LTV Estimates

- **CAC:** $10–20 (referral-driven; beauty professionals are tightly networked via Instagram and WhatsApp groups)
- **Monthly ARPU:** $15–35 (scheduling + reminders as entry, CRM + marketing as premium)
- **Churn:** 4–6% monthly (high stickiness once calendar is migrated)
- **LTV (24-month):** $240–560
- **LTV:CAC ratio:** 12–28x (exceptional)

### Entry Strategy

1. **Phase 1:** Target 100 beauty salons in Lima's Miraflores and San Borja districts. Free WhatsApp reminder bot to demonstrate no-show reduction. Metric: prove 40%+ no-show reduction in 30 days.
2. **Phase 2:** Launch full appointment management AI agent. Charge $15–25/month.
3. **Phase 3:** Expand to Arequipa, Cusco. Add Instagram integration for portfolio marketing.
4. **Partnership lever:** Beauty supply distributors (L'Oréal, Wella Peru), beauty schools, Instagram beauty influencer communities.

---

## Vertical 4: Healthcare & Dental (Private Clinics)

### Market Overview

The Latin American digital health market was valued at **USD 12.82 billion in 2024**, projected to reach **USD 66.4 billion by 2033** at a 20.05% CAGR (Market Data Forecast, 2025). The telehealth market specifically was valued at **USD 5.05 billion in 2023** (Grand View Research), with the broader telemedicine market at **USD 2.52 billion in 2024** growing at 17.23% CAGR (Market Data Forecast).

Brazil leads with 36.5% of the LATAM telemedicine market. Peru is in the "Rest of LATAM" category but has shown **notable progress** with NGOs deploying low-cost cloud-connected diagnostic kits in rural clinics (Market Data Forecast, 2025). Peru's medical boards have been cautious about telemedicine endorsement, but post-COVID regulatory softening continues.

### Number of Potential Customers

- **Peru:** Estimated 15,000–25,000 private clinics, medical offices, and dental practices
- **LATAM:** 200,000+ private healthcare facilities
- Dental practices specifically: Peru has approximately 25,000+ licensed dentists, with many operating independent practices

### Current Technology Usage

- **Appointment scheduling:** Phone calls and WhatsApp dominate in private clinics (Peru/Colombia/Argentina). Less than 15% use digital scheduling systems.
- **Electronic Health Records (EHR):** Adoption varies dramatically. Major hospitals may have systems; private clinics largely use paper or basic spreadsheets.
- **Telemedicine:** Surged during COVID-19 but adoption varies. Brazil leads (legalized via Law No. 14,510/2022); Peru lags behind.
- **Key platforms:** Doctoralia (leading in appointment booking across multiple LATAM countries); Teladoc Health (global player with LATAM presence); local startups emerging.
- **No-show rate for dental:** **30% without automated reminders** (American Dental Association); healthcare overall **27%** (BMC Health Services Research, 2024).

### Pain Points Yaya Can Solve

| Pain Point | Severity | Yaya Solution |
|------------|----------|---------------|
| 27–30% no-show rates | Critical | WhatsApp appointment reminders, confirmation flows |
| Appointment scheduling overload | High | AI agent handles booking, rescheduling via WhatsApp conversation |
| Patient follow-up gaps | High | Automated post-visit follow-up, medication reminders |
| Prescription/lab result delivery | Medium | Secure document sharing via WhatsApp |
| Patient data fragmentation | Medium | Basic patient CRM (non-PHI approach, or encrypted for compliance) |
| Marketing for private practices | Medium | Service promotion, patient testimonials, WhatsApp broadcasts |

### Key MCP Tools/Skills Needed

- `appointment-scheduler` — With HIPAA-awareness considerations for future expansion
- `whatsapp-reminder` — Appointment confirmation sequences
- `patient-crm` — Visit history, preferences (non-clinical data)
- `document-share` — Secure lab results, prescription images
- `telemedicine-bridge` — Video consultation scheduling and link sharing
- `billing-integration` — Invoice generation, payment link sharing

### Competitive Threats

| Competitor | Threat Level | Weakness |
|------------|-------------|----------|
| Doctoralia | High | Strong LATAM presence in appointment booking; well-funded | 
| Teladoc Health | Medium | Enterprise-focused; expensive for small clinics |
| Local clinic management software | Medium | Desktop-based; not WhatsApp-native |
| Government telehealth programs | Low | Public sector focus; not serving private clinics |

### CAC and LTV Estimates

- **CAC:** $40–80 (medical professionals require trust-building; longer sales cycles)
- **Monthly ARPU:** $40–80 (higher willingness to pay than beauty/food)
- **Churn:** 3–5% monthly (very sticky once integrated into practice workflow)
- **LTV (24-month):** $600–1,200
- **LTV:CAC ratio:** 7.5–15x (good)

### Entry Strategy

1. **Phase 1:** Target 50 dental practices in Lima. Appointment reminder bot via WhatsApp (no-show reduction pitch). Dentistry chosen because: high no-show rates, relatively standardized appointments, strong professional associations.
2. **Phase 2:** Expand to general private clinics. Add patient CRM and follow-up automation.
3. **Phase 3:** Introduce telemedicine scheduling and integration with lab result delivery.
4. **Regulatory note:** Must navigate LATAM health data regulations carefully. Start with non-clinical data only (scheduling, reminders, general CRM). Avoid storing or transmitting PHI initially.

---

## Vertical 5: Tourism & Travel (Peru)

### Market Overview

Peru's tourism sector is projected to contribute over **USD 23 billion** to GDP in 2025, representing **7.8% of the economy** (WTTC, 2026). The sector supports **1.17 million jobs** (6.6% of total employment).

Key statistics (2024–2025):
- **4.16 million international visitors in 2025** (up 4.1% from 2024, still 21% below 2019's 4.37M record)
- **Machu Picchu:** 1.45M visitors in 2025 (97.4% of 2019 levels)
- **International visitor spending:** USD 5+ billion in 2025 (up 9.4% from 2024)
- **Domestic tourism spending:** USD 12 billion (2025 forecast)
- **Top source markets:** Chile (25%), United States (18%), Ecuador (8%)

Peru's Travel & Tourism revenue is expected to reach **$1.96 billion in 2025**, growing to $2.29B by 2029 (Statista). The government is actively diversifying beyond Machu Picchu to Ayacucho, Cajamarca, Ica, and secondary Cusco circuits.

### Number of Potential Customers

- **Tour operators and travel agencies:** Estimated 5,000–8,000 in Peru
- **Hotels and lodging:** 20,000+ registered establishments
- **Restaurants serving tourists:** 10,000+ in Cusco, Lima, and other tourist areas
- **Adventure/activity providers:** 2,000–4,000 (trekking, river rafting, cultural tours)
- **Total addressable SMBs:** 30,000–45,000 tourism-related businesses

### Current Technology Usage

- **WhatsApp is the de facto booking channel** for small/medium tour operators, especially for international tourists who already use the app
- **Booking.com, Airbnb, TripAdvisor** dominate accommodation but charge 15–25% commissions
- **Peruvians prefer travel agencies** for complete packages (Euromonitor/Scotts International, 2024)
- **High informality:** Many guides and small operators handle everything via personal WhatsApp
- **Machu Picchu ticketing:** Rigid system with 1,000 of 4,500 daily slots reserved for walk-ups, creating "logistical headaches" (Rio Times, 2026)
- **Payment challenge:** International tourists need to pay in USD/EUR; local providers prefer PEN; currency conversion friction is real

### Pain Points Yaya Can Solve

| Pain Point | Severity | Yaya Solution |
|------------|----------|---------------|
| Multilingual customer communication | Critical | AI agent responding in English, Spanish, Portuguese, French, German |
| WhatsApp inquiry overload (especially from international tourists) | High | 24/7 AI response to pricing, availability, itinerary questions |
| Booking management across WhatsApp, email, OTAs | High | Unified booking CRM with channel aggregation |
| Currency/payment friction | High | Multi-currency payment link generation |
| Itinerary coordination (multi-day tours) | Medium | Automated itinerary sharing, daily updates, meeting point reminders |
| Review/feedback collection | Medium | Post-trip automated review request via WhatsApp |

### Key MCP Tools/Skills Needed

- `multilingual-agent` — Fluent AI in 5+ languages
- `booking-manager` — Availability calendar, reservation confirmation
- `payment-multicurrency` — USD/EUR/PEN payment links
- `itinerary-builder` — Day-by-day tour plan generation and sharing
- `review-collector` — Automated TripAdvisor/Google review requests
- `weather-integration` — Real-time conditions for outdoor activities
- `document-share` — Ticket confirmations, maps, vouchers via WhatsApp

### Competitive Threats

| Competitor | Threat Level | Weakness |
|------------|-------------|----------|
| Booking.com / Airbnb / GetYourGuide | High | Massive demand aggregation; but 15–25% commissions |
| TripAdvisor | Medium | Review/discovery platform, not operational tool |
| Local booking software | Low | Fragmented, language limitations |
| WhatsApp bots (generic) | Low | Not tourism-specialized, no multilingual AI |

### CAC and LTV Estimates

- **CAC:** $25–50 (tourism trade shows, PromPerú partnerships, Cusco operator associations)
- **Monthly ARPU:** $30–60 (seasonal variation significant)
- **Churn:** 5–8% monthly (high seasonality risk; mitigate with off-season pricing)
- **LTV (24-month):** $400–840
- **LTV:CAC ratio:** 8–17x

### Entry Strategy

1. **Phase 1:** Target 50 tour operators in Cusco. Multilingual WhatsApp AI agent for international tourist inquiries. The pitch: "Never miss a booking inquiry from an American tourist at 2am Lima time."
2. **Phase 2:** Expand to Lima hotels, Iquitos jungle lodges, and Sacred Valley activity providers.
3. **Phase 3:** Integrate with PromPerú and Perú Travel Mart 2026 (scheduled May 2026, 190 international buyers, $18.5M projected commercial activity).
4. **Key differentiator:** Multilingual capability is a massive moat. Most local software can only handle Spanish.

---

## Vertical 6: Import/Export SMBs (Peru–China Corridor)

### Market Overview

Peru–China bilateral trade reached **USD 43.36 billion in 2024**, growing 15.1% YoY (China Briefing, 2025). China is Peru's **largest trading partner**, accounting for over 30% of Peru's total foreign trade. Key figures:

- **Peru exports to China:** USD 29.42 billion (2024) — primarily copper ore ($24.9B), fishmeal ($1.47B), copper articles ($1.26B)
- **China exports to Peru:** USD 13.94 billion (2024) — machinery ($2.12B), electronics ($1.95B), vehicles ($1.33B), steel ($983M), plastics ($961M)
- **Peru's trade surplus with China:** USD 15.48 billion

The upgraded Peru–China FTA (signed November 2024) introduces new chapters on e-commerce, global supply chains, and competition policy, signaling further trade expansion.

**SMB context:** Peru had **2,326,126 formal MSMEs in 2024** (PRODUCE, 2025). The wholesale/retail trade sector is the #1 MSME category (~1 million businesses). Many of these businesses import consumer goods from China — electronics, toys, clothing, household items — through the major import hubs of Lima (Mesa Redonda, Gamarra) and Tacna (ZOFRATACNA free trade zone).

### Number of Potential Customers

- **Import-focused SMBs in Peru:** Estimated 15,000–30,000 businesses regularly importing from China
- **Export-focused SMBs (non-traditional):** 5,000–10,000 (agricultural products, textiles, crafts)
- **Customs brokers and freight forwarders:** 2,000–3,000 licensed operators
- **Total addressable:** 25,000–45,000 businesses involved in Peru–China trade corridor

### Current Technology Usage

- **SUNAT (customs):** Peru's tax/customs authority requires extensive documentation: Customs Merchandise Declaration (DAM), commercial invoice, bill of lading, packing list, insurance letter, plus sector-specific certificates (DIGESA for food, SENASA for agriculture) (Trade.gov, 2022)
- **SUNAT Easy Export:** Simplified mechanism for micro/small businesses, but still requires RUC, Clave SOL, and navigating digital platform
- **Over 50 distinct customs procedures** listed on SUNAT's website, each with specific documentation requirements (SUNAT Procedures & Regulations)
- **Documentation:** Largely manual, paper-intensive. Errors in commercial invoices have a dedicated procedure (INTA-PE.00.01). Tariff classification is complex.
- **Communication with Chinese suppliers:** WeChat + WhatsApp + email. Language barrier is severe.
- **Payment:** International wire transfers, Letters of Credit, increasingly Alipay/WeChat Pay for smaller transactions

### Pain Points Yaya Can Solve

| Pain Point | Severity | Yaya Solution |
|------------|----------|---------------|
| SUNAT documentation complexity (50+ procedures) | Critical | AI-guided document preparation, checklist automation, error prevention |
| Chinese supplier communication barrier | Critical | Bilingual AI agent (Spanish–Mandarin) for price negotiation, order confirmation |
| Tariff classification uncertainty | High | MCP tool for harmonized code lookup, duty calculation |
| Shipping/logistics tracking fragmentation | High | Consolidated tracking across suppliers, freight forwarders, customs |
| Certificate of origin management | Medium | Template generation, submission tracking |
| Currency conversion and payment timing | Medium | Exchange rate monitoring, payment scheduling recommendations |

### Key MCP Tools/Skills Needed

- `sunat-document-generator` — DAM preparation, declaration templates
- `tariff-classifier` — Harmonized System code lookup with Peru-specific duties
- `translation-agent` — Spanish ↔ Mandarin business communication
- `shipping-tracker` — Multi-carrier tracking (sea freight, air cargo)
- `certificate-manager` — Sanitary, origin, and trade certificates
- `exchange-rate-monitor` — PEN/USD/CNY rate alerts
- `supplier-crm` — Chinese supplier contact management, order history

### Competitive Threats

| Competitor | Threat Level | Weakness |
|------------|-------------|----------|
| Customs brokers (traditional) | Medium | Human-intensive, expensive, but trusted; Yaya augments rather than replaces |
| SUNAT digital platform | Low | Government system; functional but not user-friendly, no guidance |
| Generic trade management SaaS | Low | Not Peru-specific, not SUNAT-integrated |
| Chinese trade platforms (Alibaba) | Low | Supplier discovery, not customs/documentation |

**Key insight:** This is a **niche but high-value** vertical. Import/export documentation errors cost businesses days of delays and potential fines. The Peru–China corridor specifically has a massive language barrier that an AI translation agent can bridge. The recently upgraded FTA creates new complexity (5 new chapters) that SMBs need help navigating.

### CAC and LTV Estimates

- **CAC:** $50–100 (trade association partnerships, Gamarra/Mesa Redonda outreach, customs broker referrals)
- **Monthly ARPU:** $50–120 (high value justified by cost of documentation errors)
- **Churn:** 3–5% monthly (very sticky for active importers)
- **LTV (24-month):** $800–2,000
- **LTV:CAC ratio:** 8–20x

### Entry Strategy

1. **Phase 1:** Target 100 Gamarra district importers (textiles from China). Offer SUNAT document preparation assistant via WhatsApp.
2. **Phase 2:** Add Chinese supplier communication agent (bilingual). Integrate shipment tracking.
3. **Phase 3:** Expand to Mesa Redonda (electronics importers) and ZOFRATACNA operators.
4. **Partnership lever:** Lima Chamber of Commerce, Peruvian-Chinese Chamber of Commerce, customs broker associations.

---

## Deprioritized Verticals (Summary)

### Agriculture/AgriTech
- **Market:** $2.2B LATAM (IMARC, 2024), growing at 17.6% CAGR
- **Why deprioritized:** Requires IoT/sensor integration that exceeds Yaya's current WhatsApp-centric architecture. Smallholder farmers have very low digital literacy. Long sales cycles. Better suited for later-stage Yaya with hardware partnerships.
- **Future potential:** High. When Yaya develops MCP tools for satellite imagery interpretation and supply chain coordination, re-evaluate.

### Construction & Home Services
- **Market:** Multi-billion dollar construction sector, strong urbanization trends
- **Why deprioritized:** Project-based (not recurring), complex stakeholder management, low WhatsApp-commerce readiness. Home services (plumbing, electrical) has potential but is extremely fragmented and informal.
- **Future potential:** Medium. Home services booking via WhatsApp is a natural extension of the beauty/salon vertical once proven.

### Education/Tutoring
- **Market:** Growing, especially post-COVID online tutoring
- **Why deprioritized:** Lower ARPU, high churn, dominated by platforms (Platzi, Coursera, local alternatives). Scheduling/management pain points exist but less acute than beauty/healthcare.
- **Future potential:** Medium. Virtual tutoring coordination via WhatsApp has legs in Peru's growing middle class.

### Manufacturing/Textiles
- **Market:** Arequipa and other textile regions
- **Why deprioritized:** B2B-oriented, complex supply chains, lower volume of businesses. Better addressed through the import/export vertical's natural expansion.
- **Future potential:** Medium. Natural extension of Vertical 6 (import/export) when expanding to export-focused manufacturers.

---

## Cross-Vertical Synthesis

### Shared Infrastructure Requirements

All six priority verticals share a common technology stack requirement:

1. **WhatsApp Business API integration** — The foundational layer. Every vertical transacts through WhatsApp.
2. **AI conversational agent** — Natural language understanding in Spanish (primary) + Portuguese (Brazil expansion) + English (tourism) + Mandarin (import/export).
3. **Payment link generation** — Yape, Plin, Mercado Pago, bank transfers. Multi-currency for tourism/trade.
4. **CRM backbone** — Customer profiles, interaction history, preferences. Shared data model across verticals.
5. **Analytics dashboard** — Revenue tracking, conversion rates, customer segments.

### Recommended Launch Sequence

| Priority | Vertical | Rationale |
|----------|----------|-----------|
| 1 | Beauty/Salon | Lowest CAC, highest LTV:CAC ratio, clearest ROI story (no-show reduction), fastest to prove |
| 2 | Restaurant/Food Service | Largest market, strong WhatsApp ordering dynamics, anti-Rappi commission narrative |
| 3 | Retail/Fashion (Conversational Commerce) | Biggest absolute market, but more competitive; leverage beauty learnings |
| 4 | Tourism | Seasonal but high-value; multilingual moat; PromPerú partnership potential |
| 5 | Healthcare/Dental | Higher regulatory complexity; start after appointment management is proven in beauty |
| 6 | Import/Export | Niche but lucrative; requires specialized SUNAT tooling; longer development cycle |

### Total Addressable Market Summary (Peru)

| Vertical | Addressable SMBs (Peru) | Monthly ARPU Range | TAM (Annual, Peru) |
|----------|------------------------|--------------------|--------------------|
| Beauty/Salon | 60,000–90,000 | $15–35 | $10.8M–$37.8M |
| Restaurant/Food Service | 80,000–120,000 | $25–50 | $24M–$72M |
| Retail/Fashion | 50,000–80,000 | $30–80 | $18M–$76.8M |
| Tourism | 30,000–45,000 | $30–60 | $10.8M–$32.4M |
| Healthcare/Dental | 15,000–25,000 | $40–80 | $7.2M–$24M |
| Import/Export | 25,000–45,000 | $50–120 | $15M–$64.8M |
| **Total** | **260,000–405,000** | — | **$85.8M–$307.8M** |

Expanding to LATAM (conservative 5x multiplier for Brazil/Mexico/Colombia) yields a **regional TAM of $430M–$1.5B annually** across all six verticals.

---

## Sources

1. Fortune Business Insights. "Latin America and Caribbean Quick Service Restaurants Market Size, Share, Growth." Report FBI108600. Last Updated March 2026.
2. Cognitive Market Research. "South America Food Service Market Report 2025." Published March 2025.
3. Cognitive Market Research. "South America Full Service Restaurants Market Report." Published May 2024.
4. Aurora Inbox. "Estadísticas de Ecommerce por WhatsApp en Latinoamérica 2026." Published March 2026.
5. Grand View Research. "Beauty Salon Market Size, Share & Trends Analysis Report."
6. Grand View Research. "Latin America Telehealth Market Report." Market size valued at USD 5.05B in 2023.
7. Market Data Forecast. "Latin America Digital Health Market Size, Share, Trends & Growth Forecast (2024-2033)."
8. Market Data Forecast. "Latin America Telemedicine Market Research Report (2025-2033)."
9. HTF Market Insights. "Beauty Appointment Service Market Research Report." Report ID 4360622.
10. 6W Research. "Peru Spas and Beauty Salons Market (2025-2031)."
11. IMARC Group. "Latin America Agritech Market 2033."
12. Hologram.io. "From 50% water savings to 25% yield increases: Latin America's AgTech revolution." August 2025.
13. AgFunder News. "LATAM agrifoodtech & climate tech in 2025." August 2025.
14. J.P. Morgan Private Bank. "AgTech in Latin America: Small-scale solutions in a large-scale transformation."
15. J.P. Morgan Private Bank. "Wired for growth? Latin America's digital infrastructure crossroads."
16. BusinessWire/ResearchAndMarkets. "Latin America Construction Industry Report 2025-2029." November 2025.
17. Uniqbe. "E-Commerce Trends in Latin America 2025." January 2026.
18. Zintego. "How Social Commerce is Transforming Ecommerce in Latin America." May 2025.
19. Greenbook. "Why Latin American Consumers Trust WhatsApp More Than Corporate Emails." February 2025.
20. Hello24.ai. "Boost Sales with a WhatsApp Button for eCommerce in Latin America." June 2025.
21. U.S. International Trade Administration (Trade.gov). "Peru - Import Requirements and Documentation." August 2022.
22. SUNAT. "Easy Export" program documentation and "Procedures and Regulations" directory.
23. Peru-China Free Trade Agreement, Chapter 4: Customs Procedures and Trade Facilitation.
24. China Briefing. "China-Peru Trade 2.0: What the Future Holds under the Upgraded FTA." August 2025.
25. OEC World. "Peru (PER) and China (CHN) Trade." 2023 data.
26. Government of China. "China-Peru trade ties continue to deepen over past years." November 2024.
27. WTTC/TourExpi. "Peru's tourism sector on track for historic record in 2025." March 2026.
28. Rio Times. "Peru Pushes Tourism Beyond Machu Picchu as Limits Bite." March 2026.
29. GoWithGuide. "Tourism in Peru 2025." February 2025.
30. Peru Explorer. "Exploring Peru Tourism Trends: Insights and Forecasts." June 2025.
31. Cocina Digital. "What is the Best Food Delivery App for a Restaurant in Latin America?" 2025.
32. Americas Quarterly. "Colombia's First Unicorn Keeps Delivering" (Rappi profile). January 2025.
33. Buenos Aires Times. "US$5-billion delivery app Rappi sweeps Latin America." October 2024.
34. SchedulingKit. "50 Appointment No-Show Statistics (2026)." 2026.
35. Fresha. "The Hidden Cost of Cancellations: How No-Shows Are Reshaping the Beauty Industry." February 2026.
36. Statista. "Number of MSMEs in Peru by sector" and "by region." November 2024.
37. PRODUCE/ProducEmpresarial. "Desempeño económico de las MYPE 2024." May 2025.
38. Scotts International/Euromonitor. "Travel in Peru." September 2024.
39. OpenPR/IMARC. "New Projections Reveal a USD 4.7 Billion Future for the Latin American Telehealth Sector." October 2025.
40. Market Report Analytics. "Telehealth Services Market in Latin America 2025-2033."
41. EHL Research. "Serving the Future: The 2025 Global Foodservice Outlook."
42. World Economic Forum. "Latin America in the Intelligent Age: A New Path for Growth." 2025.

---

*Document generated March 21, 2026. Data current as of publication dates noted in sources. Market projections should be validated quarterly as LATAM economic conditions are dynamic.*
