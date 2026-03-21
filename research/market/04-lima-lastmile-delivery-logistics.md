# Last-Mile Delivery Economics in Lima, Peru: Implications for Yaya Platform

**Research Document #04 — Market & Logistics Series**
**Date:** 2026-03-21
**Author:** Research Subagent (PhD Logistics & Supply Chain)
**Focus:** Last-mile delivery economics, SMB impact, and platform design implications

---

## Executive Summary

Lima's last-mile delivery ecosystem is a paradox: a $199M+ e-commerce last-mile market growing at double digits, yet plagued by the worst traffic congestion in Latin America, fragmented addresses, 25-35% platform commissions that crush SMB margins, and a 50% of e-commerce businesses lacking any shipment tracking technology. For Yaya Platform, this represents an extraordinary opportunity to build a logistics orchestration layer that aggregates carriers (Olva, Shalom, Chazki, Urbano), automates WhatsApp-based delivery coordination, and provides the tracking/reverse-logistics infrastructure that Peru's 70%+ SMB sellers desperately lack. This document analyzes the landscape across 12 dimensions and concludes with specific design implications.

---

## 1. Market Size: Last-Mile Delivery in Lima and Peru

### National Logistics Context

Peru's total logistics market was estimated at **US$46.2 billion** in 2024, with logistics costs representing approximately **15-16% of GDP** — significantly higher than developed economies at 8-10% (Banco Mundial; Capece Observatorio eCommerce 2024-2025). The third-party logistics services market sits around **US$14 billion**.

### E-commerce Last-Mile Specifically

According to the Cámara Peruana de Comercio Electrónico (Capece):

- **Total e-commerce logistics market (2024):** US$332 million
- **Last-mile delivery segment:** US$199.2 million (60% of total)
- **Fulfillment & warehousing:** US$82.9 million (25%)
- **Line-haul/middle-mile:** US$33.2 million (10%)
- **Reverse logistics:** US$16.6 million (5%)

The last-mile sector reached **US$636 million** in 2023 across all categories (courier, parcels, e-commerce), growing at approximately 3% after a pandemic-era spike of 50%+ annual growth.

### Latin American Context

The broader Latin American last-mile delivery market was valued at **US$11.85 billion** in 2024, projected to reach **US$43.66 billion** by 2033 at a **15.6% CAGR** (IMARC Group). Peru represents the 6th largest last-mile market in LATAM, accounting for approximately **4.2% of regional shipment volumes** (Envíame data).

### Geographic Distribution

- **Lima concentrates 70%** of all e-commerce deliveries (down from 90% in 2019)
- **43.9%** of all last-mile shipments (courier + parcels + e-commerce) go to Lima
- **Province growth accelerating:** Trujillo, Arequipa, Chiclayo, Piura, and Ica lead outside Lima
- Top 5 provincial cities handle **65% of non-Lima volume** (Olva Courier data)

**Sources:**
- https://www.ecommercenews.pe/trends-y-estudios/2025/tamano-del-sector-logistico-y-ultima-milla-en-peru-radiografia-del-mercado.html
- https://www.imarcgroup.com/latin-america-last-mile-delivery-market
- https://www.mordorintelligence.com/industry-reports/peru-freight-and-logistics-market
- https://www.ecommercenews.pe/comercio-electronico/2024/logistica-de-ultima-milla-peru.html

---

## 2. Delivery Companies Operating in Lima

### App-Based Platforms (Food & Quick Commerce)

The food delivery market in Peru exceeds **S/3,500 million annually** (2026), with **8+ million active users**. Three platforms dominate:

| Platform | Commission | Lima Coverage | Provincial Coverage | User Base |
|----------|-----------|---------------|--------------------|-----------| 
| **PedidosYa** | 25-32% | Highest (incl. peripheral districts) | Best — 15+ cities | Largest, NSE A-B-C-D |
| **Rappi** | 25-30% | High (all main districts) | Medium — Arequipa, Trujillo, Piura, Cusco | Large, NSE A-B-C+ |
| **Uber Eats** | 28-35% | High (central/residential) | Low (mainly Arequipa) | NSE A-B, highest ticket |

**Critical margin impact for restaurants:**
- On a S/50 order at 28% commission: restaurant keeps only S/21 after commission and food costs
- Many restaurants mark up delivery prices 10-20% vs. dine-in to compensate
- PedidosYa offers "own logistics" mode at 15-18% commission (SMB handles delivery)
- Average delivery fee charged to consumers: **S/5-9** depending on distance and time

PedidosYa acquired Glovo's Peru operations and inherited the largest restaurant base. Rappi positions as a "super app" (food, groceries, pharmacy, cash withdrawal). Uber Eats captures the premium segment.

### Parcel/Courier Companies (E-commerce)

| Company | Coverage | Strengths | Weaknesses |
|---------|----------|-----------|------------|
| **Olva Courier** | National (largest network) | 24h Lima, 24-48h provincial; digital tracking; calculator tool; emprendedor programs | Price transparency limited; insurance tiers complex |
| **Shalom** | 350+ agencies nationwide | Reaches rural/Amazon areas; air + ground; Shalom Pro for businesses | Poor app reviews; digital UX needs work; opaque pricing |
| **Chazki** | 6 cities in Peru; 50 cities across 8 LATAM countries | Same-day/express; AI route optimization; Shopify/Vtex integration; 150K packages/day globally | Primarily Lima-focused in Peru |
| **Urbano Express** | Lima + national | E-commerce integration; COD capability; photo proof of delivery | Smaller network than Olva/Shalom |
| **Envíame** | Multi-courier aggregator | 17+ operators integrated; comparison shopping | Aggregator layer, not direct operator |

**Olva Courier** is Peru's #1 logistics ally with the broadest coverage. Delivery windows: Lima Metro 24h, departmental capitals 24-48h. Insurance: free under S/100; 0.6% for S/101-500; 2% for S/3,001-10,000.

**Shalom** operates **350+ agencies** reaching even Amazonian regions, with ~120 in Lima Metro, ~70 in the north, ~80 in the south, and ~40 in the orient. Their Shalom Pro service offers businesses preferential rates and bulk shipping management.

**Chazki** is the star tech-enabled player. Born in Arequipa in 2015, the startup processes **150,000 packages daily** across LATAM. They use AI to predict locations from unstructured addresses — critical in Lima where Google Maps frequently fails. Their 2025 merger with LOK created a 25-city CEP platform. Express deliveries (<3 hours) now represent **35% of Chazki's services** (up from 5% two years prior).

**Sources:**
- https://www.panca.pe/blog/rappi-pedidosya-uber-eats-cual-elegir-restaurante/
- https://www.olvacourier.com
- https://shalomperu.com
- https://www.chazki.com/peru
- https://www.ecommercenews.pe/logistica/2025/chazki-la-startup-peruana-que-quiere-revolucionar-la-logistica-ultima-milla-en-america-latina.html
- https://enviame.io/empresas-de-ultima-milla-en-peru/
- https://nbr.pe/urbano-express-peru-punto-autorizado-nbr-envios-y-rastreo/

---

## 3. Informal Delivery Networks

### The Mototaxi and Independent Courier Ecosystem

Lima's informal transport sector is massive. Over **60% of daily commutes** are made using informal bus transport. After deregulation Decree 651 in 1991, informal transport units grew from 10,500 to 47,000 in a single decade. This same infrastructure extends to goods delivery.

**How SMBs use informal couriers:**
- **Mototaxis** operate in peripheral districts (Puente Piedra, Lurín, Villa El Salvador, San Juan de Lurigancho) where formal delivery apps have limited coverage
- Small businesses negotiate per-delivery rates with independent motorcycle couriers, typically **S/5-15** per delivery within a district
- WhatsApp groups connect SMBs with pools of available riders
- Payment is cash-based with no tracking, insurance, or accountability
- Informal couriers are the only option in zones delivery apps consider "high-danger" for their riders

**The coverage gap:** Apps like Rappi and PedidosYa have coverage limitations in peripheral Lima districts due to safety concerns and poor road infrastructure. Mototaxis fill this void but introduce quality/reliability risks that formal platforms avoid.

**Sources:**
- https://sites.utexas.edu/internationalplanning/informal-transport-as-social-infrastructure-in-lima-peru/
- https://en.wikipedia.org/wiki/Transport_in_Lima
- https://binswanger.com.pe/dark-kitchens-en-lima

---

## 4. Same-Day Delivery Expectations

### Consumer Behavior Shifts

Lima consumers are increasingly demanding but also pragmatic:

- **Express deliveries (<3 hours)** represent 35% of Chazki's services — a 7x increase in two years
- **Same-day + next-day** combined account for ~40% of all e-commerce shipments; **60% remain scheduled**
- **Next-day is king for SMBs:** 80% of SMB deliveries use next-day vs. same-day due to cost
- **90% of consumers** will wait 2-3 days if it saves on shipping (McKinsey study cited by Capece)
- **Click-and-collect** represents 70%+ of deliveries for large retailers like Grupo Falabella

### The Cost-Speed Tradeoff

For price-sensitive Peruvian consumers, **reliability beats speed**. The success of AliExpress and Temu in Peru — delivering 50,000-100,000+ packages/day from Asia — proves consumers will wait weeks for competitive prices. SMBs in Lima that can offer reliable next-day delivery at affordable prices occupy the sweet spot.

**Average ticket:** S/35-45 per delivery order. Frequency: 3-4 times per month per active user.

**Sources:**
- https://gestion.pe/economia/empresas/servicios-de-ultima-milla-que-nuevas-empresas-se-vienen-incorporando-noticia/
- https://www.ecommercenews.pe/trends-y-estudios/2025/tamano-del-sector-logistico-y-ultima-milla-en-peru-radiografia-del-mercado.html

---

## 5. Last-Mile Costs as Percentage of Product Price

This is the critical economic constraint for SMBs:

- **Last-mile represents up to 53%** of total shipping cost in e-commerce (Statista)
- **National logistics cost average:** 16% of product value (MTC Encuesta Nacional de Logística)
- **E-commerce last-mile distribution alone:** 18-20% of product value (Olva Courier director)
- **Full e-commerce logistics** (inventory, picking, packing, distribution): **30-40%** of product value
- **Peru's cost per kg:** US$0.83 — the **3rd most expensive** in major LATAM markets
- **Average cost per shipment:** US$4.10

### The SMB Margin Squeeze

For a typical SMB selling a S/50 product via delivery app:
- Platform commission: S/14 (28%)
- Product cost: S/15 (30%)
- Remaining: S/21 (42%) — before rent, labor, utilities

For an SMB shipping via courier (e.g., Olva):
- Shipping cost to consumer: S/8-15 (16-30% of product price)
- If SMB absorbs shipping ("free delivery"): margins collapse further

This cost structure explains why **50% of Peruvian e-commerce businesses lack tracking technology** — they can't afford the overhead, yet its absence drives 50%+ of INDECOPI complaints about e-commerce (non-delivery or late delivery).

**Sources:**
- https://agenciaorbita.org/e-commerce-en-peru-enfrenta-el-reto-de-rentabilizar-la-entrega-rapida-en-la-ultima-milla/
- https://www.ecommercenews.pe/comercio-electronico/2024/logistica-de-ultima-milla-peru.html

---

## 6. Geographic Challenges: Lima's Delivery Nightmare

### Traffic Congestion

Lima is the **most congested city in Latin America** (TomTom 2024):
- Average traffic speed during evening peak: **14.5 km/h**
- Morning peak: **17 km/h**; evening peak: **15.4 km/h**
- A 10-km commute that should take 15 minutes regularly takes **40+ minutes** in peak hours
- **25% of Lima residents** spend over 2 hours daily commuting
- Average public transport commute: **95 minutes** per trip
- Congestion costs equivalent to **1.8% of GDP** (World Bank)
- Transportation accounts for **40% of Lima's greenhouse gas emissions**
- Only **18% of jobs** accessible within 45 minutes by public/non-motorized transport

### Address System Failures

This is a critical pain point for delivery:
- **Google Maps doesn't recognize many addresses**, especially in peripheral districts
- Many street names are **duplicated across different districts** — causing routing errors
- Lack of standardized postal codes (a new postal code system exists but adoption is low)
- Chazki has built **AI to predict locations from unstructured address data** — a key differentiator
- **20% of delivery failures** in India (analogous market) are due to wrong/incomplete addresses

### District Fragmentation

Lima Metropolitan Area spans **43 districts** with wildly different:
- Security levels (some zones are no-go for delivery riders)
- Road quality (peripheral areas have "precarious paths")
- Density patterns (high density in center AND urban fringe, but different socioeconomic profiles)
- Delivery app coverage (Lima Top vs. Lima Norte vs. peripheral)

The World Bank approved a **US$150 million program** in October 2024 for Phase 1 of Lima's urban mobility transformation — but delivery infrastructure improvements will take years.

**Sources:**
- https://latinamericanpost.com/economy-en/traffic-crisis-chokes-peruvian-capitals-growth-and-daily-life/
- https://kylenewcombe.substack.com/p/addressing-traffic-congestion-in
- https://www.worldbank.org/en/news/press-release/2024/10/15/modernizing-traffic-management-in-lima-with-world-bank-support
- https://en.wikipedia.org/wiki/Transport_in_Lima

---

## 7. WhatsApp as Delivery Coordination Infrastructure

### Peru's De Facto Logistics Communication Layer

WhatsApp is ubiquitous in Peru's delivery ecosystem and functions as the primary coordination tool at multiple levels:

**SMB → Customer:**
- Order confirmation and expected delivery time
- Live location sharing during delivery
- Delivery photo proof (driver photographs package at door)
- Post-delivery feedback collection

**SMB → Courier/Driver:**
- Dispatch coordination via WhatsApp groups
- Route instructions (especially for addresses Google Maps can't find)
- Real-time problem resolution (customer not home, gate locked, etc.)
- COD payment confirmation

**Key Statistics (WhatsApp Business API for logistics):**
- **98% message open rate** vs. 75% for SMS and 20% for email
- **40-60% reduction** in "Where Is My Order?" (WISMO) support calls
- **45-60% NDR (Non-Delivery Report) resolution rate** via WhatsApp bots vs. 15-25% via phone
- **Up to 50% RTO (Return to Origin) reduction** with WhatsApp-based NDR management
- Cost per message: **US$0.005-0.01** vs. US$0.15-0.30 for SMS

**Peruvian SMB Reality:**
- Most SMBs coordinate deliveries through personal WhatsApp, not Business API
- Delivery photos sent via WhatsApp serve as informal "proof of delivery"
- 15-25% of sales for ghost kitchen operators come through WhatsApp direct ordering (avoiding platform commissions)
- The gap between what's possible with WhatsApp Business API and what SMBs actually use is enormous

**Sources:**
- https://www.chatarchitect.com/news/whatsapp-in-logistics-track-orders-and-update-clients-automatically
- https://www.interakt.shop/es/whatsapp-business-api/logistics-delivery-tracking/
- https://www.panca.pe/blog/ghost-kitchen-tendencia-restaurantes-peru/

---

## 8. Return Logistics: The SMB Pain Point

### The Scale of the Problem

Reverse logistics (devoluciones) represents only **5% of Peru's e-commerce logistics market** (~US$16.6M), but its impact on SMB profitability is outsized:

- **20-30% of products sold online** are returned (vs. 10% for in-store purchases)
- **Over 50% of INDECOPI complaints** about e-commerce relate to non-delivery or late delivery — returns amplify this
- Transportation costs account for **up to 60%** of total reverse logistics costs
- In LATAM, customs/regulatory frameworks are "not set up for handling product returns"

### Peru-Specific Challenges

- **No standardized returns infrastructure:** Unlike Brazil or Mexico, Peru lacks widespread return drop-off networks
- **COD returns are devastating:** When a COD customer refuses a package, the SMB loses product margin PLUS delivery cost PLUS return shipping
- **Limited formal reverse logistics providers:** Olva and Shalom offer returns services, but processes are manual and slow
- **Provincial returns are economically unviable** for low-value items — many SMBs write off products rather than pay return shipping
- Urbano Express and NBR offer return logistics management, but primarily for Lima
- Shalom Pro includes "logística inversa" for business clients, but adoption among micro-SMBs is low

### What Leading Markets Do

India's experience (analogous to Peru's COD-heavy market) shows that WhatsApp-based NDR management can:
- Cut return-to-origin rates by **48%**
- Convert **35% of COD orders** to prepaid via payment links
- Save businesses **₹3.5 lakh/month** (~US$400) on 5,000 COD orders

**Sources:**
- https://www.dhl.com/content/dam/dhl/global/core/documents/pdf/glo-core-ecommerce-latam-en.pdf
- https://www.ecommercenews.pe/trends-y-estudios/2025/tamano-del-sector-logistico-y-ultima-milla-en-peru-radiografia-del-mercado.html
- https://waba.nxccontrols.in/blog/whatsapp-business-api-for-logistics-courier-shipment-tracking-ndr-management-rto-reduction-2026

---

## 9. Cold Chain & Food Delivery Logistics

### Dark Kitchen Boom in Lima

Lima's food delivery market is valued at **US$700.7 million**, making Peru the **3rd largest** delivery food market in LATAM. The dark kitchen model has exploded:

- **280+ dark kitchen spaces** in Lima across 18 locations
- **6 major operators:** Cocinas Ocultas (largest, ~50% market share), República Cocinera, Wicuk, El Ingrediente Secreto, Muncher, Capital Kitchen
- Occupancy rates: **78-80%** average
- Monthly rent: **US$994** (small 8-15m²) to **US$2,159** (large 23-44m²)
- **15% of restaurants** on delivery platforms operate exclusively as ghost kitchens
- Investment to start: **S/15,000-30,000** (vs. S/100,000+ for traditional restaurant)
- Savings: **40% lower investment** vs. traditional restaurant model

### Cold Chain Infrastructure

Peru's cold chain is developing rapidly, driven by agro-exports:
- Blueberry exports topped **326,000 tons** in 2024-25
- Class A cold warehouses expanding along coastal highway (Trujillo-Lima corridor)
- Temperature-controlled storage growing at **5.58% CAGR** (2026-2031)
- IoT temperature monitoring becoming standard for premium logistics
- However, **91.65% of warehouse space** remains non-temperature-controlled

### Food Delivery Challenge for SMBs

For food SMBs, the cold chain challenge is hyper-local:
- Maintaining food temperature/quality during 30-60 minute delivery windows in Lima traffic
- Platform commissions (25-35%) compress margins on already tight food cost structures
- Ghost kitchens are designed for a **5km delivery radius** — beyond that, quality degrades
- Consumer segments A, B, C (25-45 years old) drive demand; **25% of their budgets** go to food/beverage

**Sources:**
- https://binswanger.com.pe/dark-kitchens-en-lima
- https://cocinasocultas.com/blog/dark-kitchen-peru/
- https://www.panca.pe/blog/ghost-kitchen-tendencia-restaurantes-peru/
- https://www.mordorintelligence.com/industry-reports/peru-freight-and-logistics-market

---

## 10. Delivery Tracking Apps Used by Peruvian SMBs

### Current Landscape

The tracking technology gap is Peru's most striking logistics deficiency:

- **50% of Peruvian e-commerce businesses lack any shipment tracking or management technology** (Envíame data)
- Peru ranks among the **lowest in LATAM** for shipment tracking capability (Banco Mundial LPI)

### Tools in Use

| Tool/Platform | Type | Users | Key Feature |
|--------------|------|-------|-------------|
| **Chazki Platform** | Proprietary SaaS | Corporate clients (Mercado Libre, Falabella) | AI route optimization, GPS tracking, Shopify/Vtex integration |
| **Olva Courier App** | Carrier tracking | Individual/SMB shippers | Tracking by remito number, photo proof |
| **Shalom App / Shalom Pro** | Carrier tracking | SMBs with volume | Bulk management, alerts (UX issues reported) |
| **Envíame** | Multi-courier aggregator | E-commerce businesses | 17+ carrier integration, single dashboard |
| **NBR** | Multi-courier point | Emprendedores/PYMEs | Physical drop-off + multi-carrier comparison |
| **PANCA** | Restaurant POS+delivery | Restaurants/ghost kitchens | Multi-platform order integration, SUNAT billing |
| **Personal WhatsApp** | Informal tracking | Majority of micro-SMBs | Manual status updates, delivery photos |

### The Technology Gap

The core problem: Chazki, Envíame, and PANCA serve corporate/medium businesses. **Micro-SMBs (the vast majority)** rely on:
1. Calling the courier company for status
2. WhatsApp messages from drivers
3. Manual tracking on courier websites
4. No tracking at all — customer calls to complain

**Sources:**
- https://www.ecommercenews.pe/comercio-electronico/2024/logistica-de-ultima-milla-peru.html
- https://www.chazki.com/peru
- https://enviame.io/empresas-de-ultima-milla-en-peru/

---

## 11. Karrio Integration Opportunity for Yaya Platform

### What Karrio Offers

Karrio is an **open-source, self-hosted multi-carrier shipping API** (https://karrio.io, GitHub: karrioapi/karrio). Key capabilities:

- **Universal shipping API:** Single interface to connect multiple carrier accounts
- **Live rate fetching:** Query rates from multiple carriers simultaneously
- **Label generation:** Automated shipping label creation
- **Package tracking:** Real-time delivery status via webhooks
- **REST + GraphQL API:** Developer-friendly integration
- **Generic carrier support:** Can model carriers without native API integrations
- **Self-hosted:** Full data sovereignty — critical for Peru's regulatory environment

### Currently Supported Carriers

Karrio natively supports ~50 carriers including DHL Express, FedEx, UPS, USPS, Canada Post, Aramex, and others. **No Peruvian carriers are natively supported** (no Olva, Shalom, Chazki, Urbano, or Serpost).

### Integration Strategy for Yaya

1. **Generic Carrier Adapter:** Karrio's "generic carrier" concept allows modeling carriers without their own APIs. For Olva and Shalom (which lack modern APIs), Yaya could build adapters that:
   - Screen-scrape tracking data from Olva/Shalom websites
   - Map to Karrio's universal tracking schema
   - Generate standardized webhooks for status updates

2. **Chazki Native Integration:** Chazki has a modern platform with API integrations (Shopify, Vtex). A Karrio carrier extension for Chazki would be straightforward.

3. **Rate Aggregation:** Yaya could use Karrio to let SMBs fetch live rates from Olva, Shalom, Chazki, and Urbano simultaneously — something no Peruvian platform currently offers to micro-SMBs.

4. **WhatsApp Bridge:** Connect Karrio tracking webhooks → WhatsApp Business API → automated customer notifications. This closes the tracking gap for the 50% of SMBs with no tracking technology.

5. **Open-Source Advantage:** Self-hosting Karrio means:
   - No per-shipment SaaS fees (critical at Peru's tight margins)
   - Custom carrier extensions without vendor lock-in
   - Data stays within Yaya's infrastructure
   - Community contributions for Peruvian carrier support

**Sources:**
- https://www.karrio.io
- https://docs.karrio.io/reference/openapi
- https://github.com/karrioapi/karrio
- https://news.ycombinator.com/item?id=35727026

---

## 12. Lima vs. Provincial Delivery: What SMBs in Cusco and Arequipa Face

### The Provincial Reality

Provincial e-commerce is growing rapidly (from 10% of volume in 2019 to 30% in 2024), but faces distinct challenges:

**Infrastructure Gaps:**
- Poor road quality, especially in Andean regions
- Limited internet connectivity for real-time tracking
- No fulfillment centers outside Lima (being slowly addressed)
- Political instability has caused road blockades affecting delivery reliability
- Many provincial addresses are **not recognized by Google Maps** — street names duplicated across districts

**Delivery Times:**
- Lima Metro: 24h standard
- Departmental capitals (Arequipa, Cusco, Trujillo): 24-48h
- Secondary cities: 48-72h+
- Remote/transshipment areas: variable, up to a week

**Cost Premiums:**
- Shipping to provinces costs 2-3x Lima metro rates
- Return shipping from provinces is often economically unviable for items under S/50
- Air freight available to 14 destinations via Shalom but at significant premium

**Provincial Leaders:**
- **Shalom** has the deepest provincial reach with 350+ agencies, including Amazonian regions
- **Olva Courier** covers all departmental capitals
- **Chazki** expanded to 6 Peruvian cities in 2025: Lima, Trujillo, Arequipa, Chiclayo, Piura, Huancayo
- **PedidosYa** has the best provincial coverage among delivery apps (15+ cities)

**Cusco/Arequipa Specifics:**
- Arequipa is Chazki's birthplace — the company was founded at Universidad San Pablo de Arequipa
- Both cities have growing e-commerce ecosystems driven by tourism commerce and local manufacturing
- SMBs in these cities face a **dual challenge:** shipping TO customers across Peru AND receiving inventory FROM Lima suppliers
- Shalom's Daniel Mamani notes that e-commerce has "democratized access" for provincial entrepreneurs — but logistics costs remain a barrier

**Cross-border dynamic:**
- 50,000-100,000+ packages/day entering Peru from Asian marketplaces (Temu, Shein, AliExpress)
- This cross-border volume is reshaping consumer expectations even in provinces
- Chazki now offers "crossborder last-mile" for Shein/Temu shipments

**Sources:**
- https://www.ecommercenews.pe/trends-y-estudios/2025/tamano-del-sector-logistico-y-ultima-milla-en-peru-radiografia-del-mercado.html
- https://www.ecommercenews.pe/logistica/2025/chazki-la-startup-peruana-que-quiere-revolucionar-la-logistica-ultima-milla-en-america-latina.html

---

## Implications for Yaya Platform's Logistics Skill Design

### Core Architecture Recommendations

1. **Multi-Carrier Orchestration Layer (via Karrio)**
   - Self-host Karrio as the shipping backbone
   - Build custom carrier extensions for: Olva Courier, Shalom, Chazki, Urbano Express
   - Implement rate comparison engine: SMB inputs package details → gets quotes from all carriers → selects best option
   - Track all shipments through a unified dashboard regardless of carrier

2. **WhatsApp-Native Delivery Experience**
   - Auto-send tracking updates to end customers via WhatsApp Business API
   - Delivery photo proof via WhatsApp (driver → system → customer)
   - Failed delivery bot: instant rescheduling options via WhatsApp quick-reply buttons
   - COD confirmation: pre-delivery WhatsApp to confirm cash availability (reduce refusals by 25-35%)
   - Address confirmation: WhatsApp location-pin sharing for addresses Google Maps can't resolve

3. **Address Intelligence Module**
   - Implement fuzzy address matching (like Chazki's AI approach)
   - District disambiguation engine (many street names duplicated across Lima's 43 districts)
   - WhatsApp location-pin as primary address input for deliveries
   - Plus-code or what3words integration as backup for unmapped areas

4. **Reverse Logistics Automation**
   - Pre-delivery WhatsApp notifications to reduce failed deliveries
   - Automated NDR management: customer gets immediate WhatsApp with reschedule/redirect options
   - COD-to-prepaid conversion via payment links in WhatsApp messages
   - Return label generation through Karrio for supported carriers
   - For low-value items: automated "keep it" policy decision engine based on return cost vs. item value

5. **Provincial Coverage Strategy**
   - Default to Shalom for deep provincial reach (350+ agencies)
   - Use Olva for departmental capitals (faster, better digital experience)
   - Chazki for same-day/express in the 6 covered cities
   - Build estimated delivery time engine factoring in actual road/connectivity conditions
   - Consider relay model: Chazki for Lima → Shalom for provincial last-mile

6. **Cost Optimization for SMBs**
   - Target reducing last-mile costs from 18-20% to 12-15% of product value through carrier aggregation and route optimization
   - Batch shipment consolidation: group multiple SMB shipments to same district/province
   - Dark store/micro-fulfillment partnerships: position inventory closer to demand centers
   - Free-tier tracking: zero cost for basic WhatsApp tracking (monetize premium features)

7. **Ghost Kitchen / Food SMB Module**
   - Integration with PANCA-type POS systems
   - Multi-platform order aggregation (Rappi + PedidosYa + Uber Eats + WhatsApp direct)
   - Real-time kitchen-to-delivery handoff tracking
   - Temperature/quality window alerts (order age tracking)

### Priority Sequencing

| Phase | Feature | Impact | Effort |
|-------|---------|--------|--------|
| **P0** | WhatsApp delivery notifications (track + proof) | High — addresses 50% tracking gap | Medium |
| **P0** | Olva + Shalom + Chazki carrier integration | High — covers 80%+ of shipments | High |
| **P1** | Multi-carrier rate comparison | High — saves SMBs 10-20% on shipping | Medium |
| **P1** | Failed delivery / NDR WhatsApp bot | High — reduces returns 25-50% | Medium |
| **P2** | Address intelligence / location-pin input | Medium — reduces delivery failures 20% | High |
| **P2** | Reverse logistics automation | Medium — $16.6M market growing | Medium |
| **P3** | Provincial relay optimization | Medium — growing 30% of market | High |
| **P3** | Food/ghost kitchen module | Niche — specific vertical | Medium |

---

## Source Index

1. Capece Observatorio eCommerce 2024-2025 — https://www.ecommercenews.pe/trends-y-estudios/2025/tamano-del-sector-logistico-y-ultima-milla-en-peru-radiografia-del-mercado.html
2. IMARC Latin America Last-Mile Delivery Market — https://www.imarcgroup.com/latin-america-last-mile-delivery-market
3. Mordor Intelligence Peru Freight & Logistics — https://www.mordorintelligence.com/industry-reports/peru-freight-and-logistics-market
4. 6WResearch Peru Last-Mile Delivery Market — https://www.6wresearch.com/industry-report/peru-last-mile-delivery-market
5. PANCA Blog: Rappi vs PedidosYa vs Uber Eats — https://www.panca.pe/blog/rappi-pedidosya-uber-eats-cual-elegir-restaurante/
6. Olva Courier Official — https://www.olvacourier.com / https://registrodeenvios.olvacourier.com
7. Shalom Peru — https://shalomperu.com
8. Chazki Peru — https://www.chazki.com/peru
9. EcommerceNews: Chazki Startup Profile — https://www.ecommercenews.pe/logistica/2025/chazki-la-startup-peruana-que-quiere-revolucionar-la-logistica-ultima-milla-en-america-latina.html
10. Envíame: Empresas de Última Milla en Perú — https://enviame.io/empresas-de-ultima-milla-en-peru/
11. NBR / Urbano Express — https://nbr.pe/urbano-express-peru-punto-autorizado-nbr-envios-y-rastreo/
12. Lima Traffic Crisis — https://latinamericanpost.com/economy-en/traffic-crisis-chokes-peruvian-capitals-growth-and-daily-life/
13. Lima Traffic Academic Analysis — https://kylenewcombe.substack.com/p/addressing-traffic-congestion-in
14. World Bank Lima Mobility Program — https://www.worldbank.org/en/news/press-release/2024/10/15/modernizing-traffic-management-in-lima-with-world-bank-support
15. Informal Transport Lima (UT Austin) — https://sites.utexas.edu/internationalplanning/informal-transport-as-social-infrastructure-in-lima-peru/
16. Transport in Lima (Wikipedia) — https://en.wikipedia.org/wiki/Transport_in_Lima
17. WhatsApp Business API for Logistics — https://www.chatarchitect.com/news/whatsapp-in-logistics-track-orders-and-update-clients-automatically
18. WhatsApp for Logistics (India Case Study) — https://waba.nxccontrols.in/blog/whatsapp-business-api-for-logistics-courier-shipment-tracking-ndr-management-rto-reduction-2026
19. DHL E-commerce in Latin America (PDF) — https://www.dhl.com/content/dam/dhl/global/core/documents/pdf/glo-core-ecommerce-latam-en.pdf
20. Karrio Official — https://www.karrio.io
21. Karrio API Docs — https://docs.karrio.io/reference/openapi
22. Karrio GitHub — https://github.com/karrioapi/karrio
23. Karrio HN Launch — https://news.ycombinator.com/item?id=35727026
24. Gestión: Servicios de Última Milla — https://gestion.pe/economia/empresas/servicios-de-ultima-milla-que-nuevas-empresas-se-vienen-incorporando-noticia/
25. Agencia Orbita: Última Milla Peru — https://agenciaorbita.org/e-commerce-en-peru-enfrenta-el-reto-de-rentabilizar-la-entrega-rapida-en-la-ultima-milla/
26. EcommerceNews: Logística de Última Milla Peru — https://www.ecommercenews.pe/comercio-electronico/2024/logistica-de-ultima-milla-peru.html
27. Dark Kitchens Lima (Binswanger) — https://binswanger.com.pe/dark-kitchens-en-lima
28. Dark Kitchen Peru (Cocinas Ocultas) — https://cocinasocultas.com/blog/dark-kitchen-peru/
29. Ghost Kitchens Peru (PANCA) — https://www.panca.pe/blog/ghost-kitchen-tendencia-restaurantes-peru/
30. LACCEI Lima Last-Mile Research Paper — https://laccei.org/LACCEI2024-CostaRica/full-papers/Contribution_700_final_a.pdf

---

*Document generated for Yaya Platform strategic planning. Data current as of March 2026.*
