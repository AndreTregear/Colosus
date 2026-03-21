# Round 2 Evaluation: Ana Castañeda — Ana Beauty MX (Monterrey)

**Evaluator:** Yaya Platform Test Suite  
**Date:** 2026-03-21  
**Focus:** Mexico market fit, Peru-centric gaps, platform readiness

---

## Scenario Evaluations

### Core Business (Scenarios 1-6)

**S1: "Cuántos sérums de vitamina C me quedan en stock..."** — Score: 7/10  
yaya-inventory handles stock checks well. Product catalog with named SKUs fits the retail model. MXN currency formatting needed but structurally sound.

**S2: "Me acaban de pedir 3 kits de rutina completa por WhatsApp..."** — Score: 7/10  
yaya-sales core flow — WhatsApp order → register → await payment. Multi-item orders work. SPEI payment pending confirmation is the gap (see payments).

**S3: "Ya se me acabaron las mascarillas faciales..."** — Score: 7/10  
yaya-inventory has reorder suggestions based on sales velocity. Supplier reorder tracking and last-purchase-date lookup are functional capabilities.

**S4: "Ventas de hoy desglosadas por canal..."** — Score: 6/10  
yaya-analytics can break down by channel IF channels are properly tagged. MercadoLibre/WhatsApp/Instagram as sales channels need configuration. The multi-channel concept exists but examples only show single-channel.

**S5: "Pedido de Saltillo de 1 crema + 1 protector solar con envío..."** — Score: 5/10  
yaya-sales can calculate order totals. No DHL/Estafeta shipping cost integration or rate lookup. Shipping calculation is manual. The "envío gratis arriba de $599" rule ($349 + $459 = $808 > $599 → free) requires business rules config.

**S6: "Acabo de lanzar el exfoliante nuevo a $339..."** — Score: 7/10  
yaya-inventory supports product catalog addition. Adding a new SKU with description and price is a clean flow. Category assignment works.

### Pricing & Payments (Scenarios 7-11)

**S7: "Cuánto me depositaron hoy por SPEI?..."** — Score: 2/10  
🚨 **PERU-CENTRIC FAIL.** yaya-payments cannot interface with Mexican banks for SPEI deposit verification. No Banorte, BBVA México, or any Mexican bank API. Cannot confirm 5 pending transfers.

**S8: "Clienta quiere pagar en Oxxo Pay pero le aparece error..."** — Score: 1/10  
🚨 **PERU-CENTRIC FAIL.** Oxxo Pay is completely absent from the platform. No Oxxo reference generation, no payment status checking, no troubleshooting. This is 10% of Ana's payment volume — gone.

**S9: "Actualizar precio del tónico, proveedor subió 15%..."** — Score: 7/10  
yaya-inventory + yaya-analytics can calculate margin-preserving prices. If cost was X and margin target is 55%: new_price = new_cost / (1 - 0.55). Math works perfectly. Price update in catalog is supported.

**S10: "Comisiones de MercadoLibre este mes..."** — Score: 3/10  
🚨 **NO MERCADOLIBRE INTEGRATION.** No MercadoLibre API connection. Can't pull commission data, fee breakdowns, or seller metrics. Ana's #1 sales channel (45% of revenue) is a black box to the platform.

**S11: "Clienta quiere 10 sets de regalo para su empresa, precio mayoreo..."** — Score: 6/10  
yaya-sales handles bulk/wholesale quotes. Discount calculation (15% off $899 × 10 = $7,641.50) is straightforward. No formal wholesale pricing tier but manual discounts work.

### Invoicing (Scenarios 12-16)

**S12: "Generar CFDI para la señora Martínez, RFC MARL850612XX3..."** — Score: 1/10  
🚨 **PERU-CENTRIC FAIL.** yaya-tax generates facturas/boletas via SUNAT. No CFDI 4.0 generation, no RFC validation (only RUC/DNI), no SAT portal integration. Cannot issue a single Mexican invoice.

**S13: "RFC mal y ya le generé la factura, cómo cancelo y rehago..."** — Score: 1/10  
🚨 **PERU-CENTRIC FAIL.** CFDI cancellation requires the new SAT cancellation process (motivo de cancelación, folio sustitución). yaya-tax only knows SUNAT's comunicación de baja. Completely different process.

**S14: "Cuántas facturas llevo emitidas este mes..."** — Score: 1/10  
🚨 **PERU-CENTRIC FAIL.** Cannot track CFDI emissions because it can't generate them. The invoice tracking infrastructure (list_invoices) exists but connects to SUNAT, not SAT.

**S15: "Aviso del SAT sobre diferencias en declaraciones..."** — Score: 1/10  
🚨 **PERU-CENTRIC FAIL.** SAT audit/discrepancy resolution requires knowledge of Mexican tax law, CFDI reconciliation with declaraciones provisionales, and ISR/IVA rules. yaya-tax only understands PDT 621 and IGV. A tax discrepancy with SAT is a serious legal matter — giving wrong guidance could cause real financial harm.

**S16: "Compró por MercadoLibre, MercadoLibre retuvo IVA..."** — Score: 1/10  
🚨 **PERU-CENTRIC FAIL.** MercadoLibre IVA retention for digital platforms is Mexico-specific tax legislation (Art. 18-J LIVA). The platform has no concept of marketplace tax retention, no understanding of how MercadoLibre acts as IVA withholding agent. Dangerously complex topic with zero support.

### Analytics (Scenarios 17-21)

**S17: "Top 5 productos más vendidos del mes pasado..."** — Score: 7/10  
yaya-analytics core capability. Product ranking by quantity and revenue is well-demonstrated in examples. Works perfectly for Ana's catalog of ~10 products.

**S18: "Ticket promedio por canal: ML, WhatsApp, Instagram..."** — Score: 5/10  
Requires channel attribution on orders. yaya-analytics can calculate averages but channel segmentation needs proper tagging. Multi-channel analytics are mentioned but not deeply implemented.

**S19: "Tasa de recompra, clientas de enero que volvieron en febrero..."** — Score: 6/10  
yaya-crm tracks customer purchase frequency. Cohort analysis (Jan buyers → Feb repeat) is possible via postgres queries. Not a pre-built report but feasible.

**S20: "Ventas de este mes vs mismo mes del año pasado..."** — Score: 7/10  
yaya-analytics explicitly supports YoY comparison. Example shows "vs mismo mes 2025: ↗️ +45%". Clean capability match.

**S21: "Cuánto estoy gastando en envíos como % de ventas..."** — Score: 5/10  
Shipping cost as expense category needs tracking. If shipping costs are logged as expenses, the percentage calculation works. No DHL/Estafeta cost integration for automatic tracking.

### Escalation (Scenarios 22-24)

**S22: "Paquete abierto y sin el sérum, DHL dice que entregaron completo..."** — Score: 6/10  
yaya-escalation handles shipping disputes. Can escalate to owner with context. No DHL claims API integration. Manual resolution process works.

**S23: "MercadoLibre pausó publicación por infracción de marca..."** — Score: 3/10  
🚨 **NO MERCADOLIBRE INTEGRATION.** Cannot interface with MercadoLibre's dispute/appeal system. No understanding of ML's brand protection process. Can only advise generally.

**S24: "Alguien clonó mi publicación en MercadoLibre..."** — Score: 3/10  
🚨 **NO MERCADOLIBRE INTEGRATION.** Can't report on MercadoLibre. No IMPI (Mexican IP office) integration. General advice only — "report it" — but no actionable automation.

### Edge Cases (Scenarios 25-30)

**S25: "RFC genérico XAXX010101000 pero quiere IVA desglosado..."** — Score: 1/10  
🚨 **PERU-CENTRIC FAIL.** The público en general RFC (XAXX010101000) and its IVA implications under CFDI 4.0 rules are Mexico-specific. yaya-tax has no knowledge of this. Wrong answer could cause SAT compliance issues.

**S26: "Venta de $12,500, mitad SPEI mitad Oxxo Pay..."** — Score: 2/10  
🚨 **PERU-CENTRIC FAIL.** Split payment across SPEI + Oxxo Pay. Neither payment method is supported. yaya-payments handles partial payments conceptually (abonos) but can't verify either Mexican payment rail.

**S27: "Clienta gringa quiere comprar desde Texas, paga en USD por PayPal..."** — Score: 3/10  
No PayPal integration. No cross-border e-commerce support. No USD/MXN conversion for invoicing. No understanding of Mexican customs/import rules for Texas shipments. Multiple layers of unsupported complexity.

**S28: "50 sérums pero 8 vienen con envase dañado..."** — Score: 5/10  
yaya-inventory can adjust stock (mark 8 as damaged). No supplier claims/RMA module for inbound merchandise. Stock write-off works but supplier negotiation is manual.

**S29: "Compró kit hace 35 días, quiere devolución, política dice 30 días..."** — Score: 7/10  
yaya-returns handles this well! Policy enforcement (30 days max), empathetic denial, alternative suggestions (exchange, store credit). One of the best-matched scenarios.

**S30: "Buen Fin 20% en todo PERO no en Kit Glow Box..."** — Score: 4/10  
yaya-notifications can send promotional campaigns. But no dynamic pricing/discount engine that applies rules per-product with exclusions. Would need manual price changes on each item except the kit.

---

## Summary

| Metric | Value |
|--------|-------|
| **Overall Score** | **4.1/10** |
| **PMF Readiness (Mexico)** | **~22%** |

### Top 3 Strengths
1. **Product catalog and inventory management** — Ana's ~10 SKU catalog fits perfectly into yaya-inventory. Stock checks, reorder alerts, new product additions all work cleanly.
2. **Customer analytics and CRM** — Top products, recompra rates, YoY comparisons, customer segmentation — yaya-analytics + yaya-crm serve Ana's data-driven personality well.
3. **Returns and customer service** — yaya-returns handles the 35-day-old return denial with empathy and alternatives. The policy enforcement + relationship preservation balance is strong.

### Top 3 Gaps
1. 🚨 **Tax/invoicing is 100% Peru** — CFDI 4.0, RFC, SAT, MercadoLibre IVA retention, público en general invoicing — all absent. 5 scenarios score 1/10. Ana can't invoice a single customer.
2. 🚨 **No MercadoLibre integration** — 45% of Ana's revenue flows through ML. No order sync, no commission tracking, no dispute resolution, no listing management. The platform is blind to her biggest channel.
3. 🚨 **Payment rails are 100% Peru** — SPEI (35% of payments), MercadoPago (40%), Oxxo Pay (10%) = 85% of Ana's payment volume is invisible. Only contra-entrega (15%) doesn't need platform verification.

### Key Insight
**Ana is paradoxically the best AND worst fit.** She's the most tech-savvy persona, data-driven, comfortable with tools — exactly the early adopter profile. Her e-commerce business model (catalog, orders, shipping) maps cleanly to the platform's retail-oriented architecture. BUT: 85% of her payments use Mexican rails the platform doesn't support, 45% of her revenue comes from MercadoLibre which has zero integration, and she can't issue a single CFDI. The platform would serve Ana well as an inventory tracker and CRM — maybe 25% of her needs. For the other 75%, she'd need workarounds that would frustrate a data-driven operator who expects systems to talk to each other. Ana would likely trial it, see the integrations gap, and churn — saying "it's a cool concept but it doesn't connect to my actual tools."

### Cross-Persona Mexico Market Summary

| Gap | Guadalupe | Roberto | Ana | Severity |
|-----|-----------|---------|-----|----------|
| CFDI/SAT invoicing | ❌ | ❌ | ❌ | **BLOCKER** |
| SPEI payment verification | ❌ | ❌ | ❌ | **BLOCKER** |
| MercadoPago/Oxxo Pay | ❌ | N/A | ❌ | **BLOCKER** |
| Mexican IVA rules | ❌ | ❌ | ❌ | **BLOCKER** |
| IMSS/payroll | ❌ | ❌ | N/A | HIGH |
| MercadoLibre integration | N/A | N/A | ❌ | HIGH |
| CoDi | ❌ | N/A | N/A | MEDIUM |
| Mexican labor law | ❌ | ❌ | N/A | MEDIUM |
| Food waste/recipe costing | ❌ | N/A | N/A | MEDIUM |
| Delivery platform integration | ❌ | N/A | N/A | MEDIUM |

**Bottom line: The Yaya Platform is currently a Peru-first product. Entering Mexico requires building: (1) a complete SAT/CFDI tax module, (2) Mexican payment rail integrations (SPEI, MercadoPago, Oxxo Pay, CoDi), and (3) MercadoLibre as a sales channel. Without these three, PMF in Mexico is 0%.**
