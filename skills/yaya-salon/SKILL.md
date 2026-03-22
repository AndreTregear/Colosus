# yaya-salon — Beauty Salon & Spa Operations Management

## Description
WhatsApp-native salon operations management for Peru's 50-80K+ beauty salons, barbershops, and spas — plus an estimated 40K+ informal beauty businesses. Covers client service history with color formula tracking, no-show management with deposit enforcement, gift card/voucher lifecycle, walk-in scheduling, chair/station utilization, service-product combos, before/after photo management, stylist performance analytics, and client preference profiles — all via natural Spanish chat over WhatsApp.

Purpose-built for the reality of Peruvian salons: the owner is also a stylist (handles 4-6 clients/day), manages 4-8 staff on commissions (30-40%), juggles WhatsApp DMs and Instagram DMs for bookings, tracks nothing except a paper notebook, loses 15-20% of revenue to no-shows, sells retail products but doesn't know if it's profitable, and has loyal clients whose color formulas live only in the stylist's memory. When a stylist leaves, the formulas leave with her.

This skill is the salon-specific operational layer. It integrates with:
- **yaya-commissions** — Staff commission calculation and payout (handles the money side)
- **yaya-appointments** — Base appointment scheduling (handles time slots)
- **yaya-loyalty** — Points and rewards program (handles retention)
- **yaya-inventory** — Retail product stock (handles SKUs)
- **yaya-expenses** — Product purchase costs, salon overhead (handles P&L)
- **yaya-cash** — Daily register reconciliation (handles cuadre)
- **crm-mcp** — Client contact records (handles contact data)
- **whatsapp-mcp** — Outbound messaging (handles reminders, confirmations)

What yaya-salon adds that NO other skill covers:
1. **Color formula memory** — Per-client, per-visit chemical formulas (brand, shade, developer, technique)
2. **No-show deposit system** — Booking deposits, forfeit rules, deposit history, refund workflow
3. **Gift card/voucher lifecycle** — Creation, balance tracking, partial redemption, expiry, fraud prevention
4. **Walk-in management** — Real-time availability check across stylists, squeeze-in logic
5. **Chair/station utilization** — Revenue per chair-hour, idle time, optimal scheduling
6. **Service history with photos** — Before/after tracking linked to formulas and services
7. **Client beauty profile** — Hair type, skin type, allergies, preferences, scalp conditions, past reactions

73.8% of Peru's beauty salon owners are women. Average salon has 3-6 chairs and 2-5 employees. Monthly revenue: S/15-50K for established salons, S/5-15K for smaller ones. Typical services: corte (S/25-45), coloración (S/80-200), manicure (S/25-60), keratina (S/150-250), pestañas (S/80-150). Commission structure: 30-40% for seniors, 20-25% for juniors. Retail products are 15-25% of revenue. No-show rate: 15-20% nationwide. Instagram is the #1 client acquisition channel (80%+ for urban salons).

## When to Use
- Salon owner/stylist records or queries a color formula ("¿qué color le puse a la señora Pérez la última vez?", "usé Igora 6.1 con oxidante de 20vol")
- Client arrives and stylist needs their service history ("¿qué le hice la última vez a María?")
- Owner sets up or manages no-show deposit policy ("quiero cobrar S/20 de depósito para reservar")
- A no-show occurs and deposit needs to be processed ("no vino la clienta de las 3pm, pierde su depósito")
- Owner creates, sells, or redeems a gift card ("vender gift card de S/300", "clienta viene con gift card")
- Walk-in client arrives and needs to find available time ("acaba de llegar una sin cita, ¿hay hueco?")
- Owner asks about chair/station utilization ("¿cuántas horas estuvo vacía la silla de Ana?")
- Owner tracks before/after photos for a service ("guarda esta foto del antes y después del balayage")
- Owner builds or updates client beauty profile ("la clienta es alérgica al amoniaco", "tiene cuero cabelludo sensible")
- Owner asks about no-show statistics ("¿cuántos plantones tuve este mes?")
- Owner manages service menu with durations and pricing ("corte 45min S/35, coloración 2h S/120")
- Owner pairs retail product with service ("recomiéndale el shampoo sin sulfato a todas las de keratina")
- Owner asks about gift card balances or validity ("¿cuántas gift cards vendí este mes?", "¿es válida esta gift card?")
- Owner wants to send before/after photos to client via WhatsApp
- Owner wants to see service mix analysis ("¿qué servicios piden más?", "¿qué combo generar?")
- Stylist needs quick reference on a complex formula before client arrives

## Target Users
- **Peluquerías/salones de belleza** — 50-80K in Peru. Core target. Women-led, commission-based, Instagram-driven.
- **Barberías** — Growing market, especially in Lima. 10-15K estimated. Younger male demographic.
- **Spas** — Higher ticket, longer services. 5-10K estimated. Facial, body treatments, massage.
- **Nail studios** — Standalone nail art and manicure/pedicure salons. 10-20K estimated.
- **Centros de estética** — Medical aesthetics crossover. Botox, facial peels, dermapen. 5K+ estimated.
- **Maquillaje profesional** — Event makeup artists. Mostly freelance, work from home or salon.
- **Mobile beauty services** — Home-visit stylists (a domicilio). Growing post-COVID segment.

## Capabilities

### Core: Color Formula History
The #1 operational pain point in salons. When a regular client returns for a touch-up, the stylist needs to know EXACTLY what was used last time. Currently this information lives in the stylist's memory (unreliable), a paper notebook (gets lost), or nowhere (client gets a different result and complains). When a stylist leaves, all formula knowledge leaves with her.

- **Record formula from chat** — "Le puse a María: Igora 6.1 + 7.1 (mezcla 50/50), oxidante 20vol, técnica: raíces + medios. Tiempo: 35min" → stored permanently linked to client and date
- **Query formula by client** — "¿Qué color le puse a la señora Rodríguez?" → returns last formula with date, product brand, shade codes, developer volume, technique notes
- **Formula history** — Full timeline: "María: Mar 2025 — Igora 6.1+7.1 20vol, Ene 2025 — Igora 7.1 30vol, Nov 2024 — Wella Koleston 6/1 20vol" → shows color journey
- **Supported formula fields:**
  - **Brand** — Igora (Schwarzkopf), Koleston/Illumina (Wella), Majirel (L'Oréal), Alfaparf, Issue, etc.
  - **Shade code(s)** — Standard numbering: 6.1 (rubio oscuro ceniza), 7.44 (rubio cobrizo intenso), etc.
  - **Mix ratio** — "50/50 de 6.1 y 7.1", "2:1 de base y reflejo"
  - **Developer/oxidante** — 10vol (3%), 20vol (6%), 30vol (9%), 40vol (12%)
  - **Technique** — Raíces, medios, puntas, balayage, ombré, highlights (mechitas), full head (completo), decoloración, toner
  - **Processing time** — Minutes on hair. Important for repeat results.
  - **Special notes** — "Cuero cabelludo sensible, usar protector", "No soporta más de 20vol", "Canas resistentes en sienes"
- **Auto-suggest on appointment** — When client has appointment for "coloración", show last formula before arrival: "Ojo: la señora López viene a las 3pm para color. Última vez: Igora 6.1+7.1, 20vol, 35min (hace 6 semanas)"
- **Formula search by product** — "¿A quién le puse Igora 7.44?" → lists clients using that shade (useful for product restock)
- **Transition tracking** — "María está yendo de castaño oscuro a rubio" → multi-visit plan with intermediate formulas
- **Allergic reaction logging** — "La clienta tuvo reacción al amoniaco" → permanently flagged, shows alert on future bookings

### Core: No-Show Management & Deposit System
15-20% no-show rate = S/2,000-5,000/month in lost revenue for a typical salon. The only effective deterrent is a booking deposit, but managing deposits manually is a nightmare. This system automates the entire lifecycle.

- **Configure deposit policy** — "Cobrar S/20 de depósito para cualquier cita" or "S/30 para coloración, S/20 para corte, sin depósito para manicure"
- **Service-specific deposits** — Higher deposits for longer/more expensive services (keratina S/50, coloración S/30, corte S/15)
- **Deposit collection tracking** — "La señora López pagó S/20 de depósito por Yape para su cita del jueves" → recorded with payment method, date, linked appointment
- **No-show forfeit** — When client doesn't show: "La clienta de las 3pm no vino" → auto-marks as no-show, deposit forfeited, sends gentle notification
- **Grace period** — Configurable: "Si llega 15 min tarde, todavía se atiende. Después de 15 min, se pierde la cita y el depósito"
- **Deposit refund** — "La señora canceló con 24h de anticipación, devuélvele su depósito" → refund logged (policy: cancel >24h = refund, <24h = forfeit, configurable)
- **Deposit application** — "El depósito de S/20 se descuenta del servicio total" → at checkout, deposit deducted from bill
- **No-show statistics** — "¿Cuántos plantones tuve este mes?" → count, lost revenue estimate, repeat offenders
- **Repeat no-show flagging** — Client with 3+ no-shows gets flagged: "⚠️ Ojo: esta clienta tiene 3 plantones previos. ¿Cobrar depósito más alto o exigir pago completo?"
- **No-show rate by day/time** — "Los lunes a las 2pm tienen 30% de no-shows" → scheduling intelligence
- **Cancellation vs. no-show distinction** — Cancellation (advance notice) ≠ no-show (ghost). Different treatment, different stats.
- **WhatsApp confirmation flow** — 24h before: send reminder via whatsapp-mcp. If no response, flag as at-risk. 2h before: second reminder. This alone reduces no-shows by 40-50%.

### Core: Gift Card / Voucher Management
Salons sell gift cards (popular for Mother's Day, birthdays, Christmas) but track them in paper notebooks. Cards get lost, duplicated, used fraudulently, or expire without the owner knowing how much liability is outstanding.

- **Create gift card** — "Vender gift card de S/300 a nombre de Ana para su mamá" → generates unique code, records purchaser, recipient (optional), amount, creation date, expiry date (default: 12 months)
- **Gift card code** — Auto-generated alphanumeric code (GC-XXXX-XXXX) or owner can set custom: "El código es MAMÁ2026"
- **Partial redemption** — "Clienta usa gift card GC-1234 para corte S/35 y manicure S/25. Total S/60. Saldo restante: S/240" → decrements balance
- **Balance query** — "¿Cuánto le queda a la gift card GC-1234?" → current balance, transaction history
- **Full redemption** — "Usar todo el saldo de la gift card" → zero balance, mark as fully redeemed
- **Expiry management** — Default 12 months. Alert 30 days before expiry: "Tienes 3 gift cards que vencen el próximo mes (S/450 total). ¿Notificar a los titulares?"
- **Fraud prevention** — Duplicate code check, redemption requires owner confirmation, transaction log shows all uses
- **Outstanding liability** — "¿Cuánto tengo en gift cards sin usar?" → total outstanding balance (financial liability)
- **Gift card sales report** — "Vendí S/2,400 en gift cards este mes" → revenue recognition timing
- **Boleta on gift card sale** — Integrates with yaya-tax: gift card sale generates boleta at purchase time
- **Top-up** — "La clienta quiere agregar S/100 a su gift card" → increases balance
- **Gift card as payment method** — Appears alongside Yape, efectivo, POS in payment options

### Core: Walk-In Management
40-50% of salon clients in Peru walk in without an appointment. The owner needs to quickly check if any stylist has an opening and slot the client in without disrupting existing appointments.

- **Real-time availability** — "Acaba de llegar una clienta sin cita, quiere corte. ¿Hay hueco?" → checks all stylists' schedules for the next available slot
- **Service duration awareness** — Considers service length: "Corte (45min) — Ana tiene hueco de 2:00-3:00. Paola está libre de 2:30 en adelante"
- **Squeeze-in logic** — Identifies gaps between appointments: "Ana tiene 30min libres entre la coloración de las 11 y el corte de las 12:30 — no alcanza para keratina (3h) pero sí para manicure (45min)"
- **Walk-in vs appointment priority** — Walk-ins are lower priority than booked clients. If a stylist is running late with current client, walk-in waits
- **Wait time estimate** — "Si esperas 20 minutos, Ana te puede atender. ¿O prefieres agendar para mañana?"
- **Walk-in conversion tracking** — "¿Cuántos walk-ins convertí este mes?" → walk-in count, revenue from walk-ins, conversion to repeat appointments
- **Auto-create appointment** — Walk-in accepted → creates appointment retroactively for record-keeping

### Core: Chair/Station Utilization
Salon profitability depends on maximizing chair-hours. An empty chair is pure loss (rent, utilities, opportunity cost). Most owners have no idea how utilized their chairs are.

- **Revenue per chair-hour** — "Silla de Ana: S/42/hora promedio. Silla de Paola: S/38/hora. Silla vacía: S/0" → identifies most productive stations
- **Utilization rate** — "Hoy Ana estuvo ocupada 6 de 8 horas (75%). Paola 5/8 (62%). Silla 3 estuvo vacía todo el día (0%)"
- **Idle time tracking** — Gaps between appointments. "De 10 a 12 estuvieron todas ocupadas. De 2 a 3 había 2 sillas vacías"
- **Optimal scheduling suggestions** — "Los martes tienes 40% utilización. Considera horario reducido o promociones para llenar"
- **Daily/weekly/monthly views** — Utilization trends over time
- **Revenue opportunity** — "3 sillas vacías × 2 horas promedio × S/40/hora = S/240 de revenue perdido hoy"
- **Peak hours identification** — "Tus horas pico: sábados 10am-1pm (100% utilización). Tus horas flojas: martes-miércoles 2-4pm (30%)"
- **Suggestion integration** — Feed into yaya-appointments for availability display, into marketing for promo timing

### Core: Client Beauty Profile
Beyond contact info (handled by crm-mcp), salons need beauty-specific client data that affects service delivery and safety.

- **Hair profile** — Type (liso/ondulado/rizado/crespo), texture (fino/medio/grueso), condition (sano/dañado/procesado), natural color, current color, porosity, length
- **Skin profile** — Type (normal/seca/grasa/mixta/sensible), tone (for makeup services), known allergies
- **Scalp conditions** — Dermatitis, psoriasis, caspa, sensibilidad. Important for product selection
- **Allergy alerts** — ⚠️ "ALÉRGICA AL AMONIACO" — shows prominently on every booking. Critical safety info
- **Patch test history** — "Última prueba de alergia: 15-ene-2026, negativa" → regulatory compliance in some jurisdictions
- **Product preferences** — "Prefiere productos veganos", "Solo usa Schwarzkopf", "No le gusta el olor a keratina"
- **Service preferences** — "No le gusta que le laven el pelo con agua muy caliente", "Le gusta conversar", "Prefiere silencio"
- **Contraindications** — Pregnant (avoid certain chemicals), medications (blood thinners → avoid waxing), recent procedures
- **Photo gallery** — Before/after photos linked to services and formulas. "Así le quedó la última vez"
- **Notes field** — Free-form: "Siempre llega 10min tarde", "Viene con su hija de 5 años", "Pide café con leche"

### Support: Service Menu Management
While yaya-inventory handles product SKUs, salons need a service-specific menu with durations, pricing tiers, and stylist assignments.

- **Service catalog** — Full service list with: name, duration, price, category, required level (junior/senior), products typically used
- **Price tiers** — "Corte con Ana (senior): S/45. Corte con Lucía (junior): S/30" → stylist-based pricing
- **Duration buffer** — Auto-add 15min between appointments for cleanup, setup, consultation
- **Category organization** — Cabello, uñas, facial, corporal, maquillaje, depilación, barbería
- **Combo/package creation** — "Paquete Novia: prueba maquillaje + prueba peinado + día del evento = S/450 (vs S/550 por separado)"
- **Seasonal services** — "Alisado brasileño solo en temporada baja (ene-mar)"
- **Service upgrades** — "¿Le ofrecemos tratamiento de hidratación por S/30 adicional?" → upsell suggestions

### Support: Product-Service Pairing
Connect retail sales to services for cross-selling and inventory planning.

- **Auto-recommend** — After keratina service: "Recomendar shampoo sin sulfato (S/38) para mantenimiento" → appears in checkout flow
- **Product usage tracking** — "Para esta coloración se usaron: 1 tubo Igora 6.1 (S/18), 1/2 tubo Igora 7.1 (S/9), 100ml oxidante (S/5) = S/32 de producto" → links to commission deductions and COGS
- **Restock alerts** — "Solo quedan 3 tubos de Igora 6.1 — esta semana tienes 5 coloraciones programadas que lo usan" → proactive warning
- **Best-sellers** — "Shampoo Schwarzkopf: 15 vendidos este mes (S/570). Tratamiento keratin: 8 vendidos (S/400)"

### Support: Before/After Photo Management
Instagram is the #1 client acquisition channel. Before/after transformations drive 80% of salon Instagram engagement.

- **Photo pair storage** — "Guarda el antes y después del balayage de María" → linked to client, service, formula, date
- **Client consent tracking** — "¿Puedo subir la foto a Instagram?" → consent flag stored per photo pair
- **Portfolio building** — "Muéstrame todos mis balayages del último mes" → portfolio for Instagram planning
- **Client reference** — "Quiero el mismo color que me hiciste en diciembre" → pull up the photo + formula
- **Share via WhatsApp** — "Mándale la foto del resultado a la clienta" → via whatsapp-mcp

### Support: No-Show Analytics & Trends
Go beyond counting no-shows — understand patterns and take action.

- **No-show heatmap** — By day of week × time of day: "Lunes 2-4pm: 35% no-show rate. Sábado AM: 5%"
- **Client no-show score** — "María tiene 0 no-shows en 12 visitas (excelente). Lucía tiene 3 en 5 (riesgo alto)"
- **Revenue impact** — "Este mes: 18 no-shows × S/85 ticket promedio = S/1,530 perdidos. Depósitos cobrados: S/360. Pérdida neta: S/1,170"
- **Deposit ROI** — "Desde que implementaste depósitos (feb 2026), no-shows bajaron de 18% a 9%. Revenue recuperado: S/2,400/mes"
- **Actionable insights** — "Tus 3 clientas con más no-shows: Lucía (3), Andrea (2), Katia (2). ¿Bloquear o exigir pago completo?"

## Integration Map

```
┌─────────────────────────────────────────────────────────┐
│                     yaya-salon                          │
│  Color Formulas │ No-Shows │ Gift Cards │ Walk-ins     │
│  Chair Util     │ Beauty Profile │ Photos │ Service Menu│
└─────────┬───────┬──────────┬─────────┬─────────────────┘
          │       │          │         │
    ┌─────▼──┐ ┌──▼────┐ ┌──▼────┐ ┌──▼──────────┐
    │commis- │ │appoint│ │loyalty│ │  inventory  │
    │sions   │ │ments  │ │       │ │  (retail)   │
    └────────┘ └───────┘ └───────┘ └─────────────┘
          │       │          │         │
    ┌─────▼──┐ ┌──▼────┐ ┌──▼────┐ ┌──▼──────────┐
    │expenses│ │crm-mcp│ │cash   │ │ whatsapp-mcp│
    └────────┘ └───────┘ └───────┘ └─────────────┘
```

## Data Model

### salon_color_formulas
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| client_id | UUID | FK → contacts |
| stylist_id | UUID | FK → contacts (staff) |
| service_date | DATE | When the service was performed |
| brand | TEXT | Product brand (Igora, Wella, L'Oréal, etc.) |
| shades | JSONB | Array of shade codes with ratios: [{"code":"6.1","parts":1},{"code":"7.1","parts":1}] |
| developer_vol | INTEGER | Developer volume: 10, 20, 30, 40 |
| technique | TEXT | Application technique (raíces, balayage, highlights, full, toner, decoloración) |
| processing_time_min | INTEGER | Minutes on hair |
| products_used | JSONB | Products and quantities used |
| notes | TEXT | Free-form notes (sensitivities, special handling) |
| photos | JSONB | Before/after photo references |
| created_at | TIMESTAMPTZ | Record creation |

### salon_gift_cards
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| code | TEXT | Unique gift card code (GC-XXXX-XXXX) |
| purchaser_id | UUID | FK → contacts (who bought it) |
| recipient_name | TEXT | Intended recipient (optional) |
| original_amount | DECIMAL | Original value |
| current_balance | DECIMAL | Remaining balance |
| currency | TEXT | PEN (default) |
| status | TEXT | active, fully_redeemed, expired, cancelled |
| expires_at | DATE | Expiration date |
| created_at | TIMESTAMPTZ | When created/sold |

### salon_gift_card_transactions
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| gift_card_id | UUID | FK → salon_gift_cards |
| type | TEXT | purchase, redemption, top_up, refund, expiry |
| amount | DECIMAL | Transaction amount |
| service_description | TEXT | What was purchased |
| processed_by | TEXT | Staff member who processed |
| created_at | TIMESTAMPTZ | Transaction time |

### salon_deposits
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| client_id | UUID | FK → contacts |
| appointment_id | UUID | FK → appointments |
| amount | DECIMAL | Deposit amount |
| payment_method | TEXT | yape, efectivo, transferencia, pos |
| status | TEXT | paid, applied, forfeited, refunded |
| paid_at | TIMESTAMPTZ | When deposit was received |
| resolved_at | TIMESTAMPTZ | When applied/forfeited/refunded |
| resolution_note | TEXT | Reason for resolution |

### salon_no_shows
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| client_id | UUID | FK → contacts |
| appointment_id | UUID | FK → appointments |
| scheduled_service | TEXT | What was booked |
| estimated_revenue_lost | DECIMAL | Revenue that would have been earned |
| deposit_forfeited | DECIMAL | Deposit amount forfeited (0 if none) |
| occurred_at | TIMESTAMPTZ | Appointment date/time |

### salon_client_profiles
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| client_id | UUID | FK → contacts (unique) |
| hair_type | TEXT | liso, ondulado, rizado, crespo |
| hair_texture | TEXT | fino, medio, grueso |
| hair_condition | TEXT | sano, dañado, muy_procesado |
| natural_color | TEXT | Natural hair color |
| current_color | TEXT | Current color description |
| skin_type | TEXT | normal, seca, grasa, mixta, sensible |
| allergies | TEXT[] | Known allergies (amoniaco, PPD, látex, etc.) |
| contraindications | TEXT[] | Medical conditions affecting services |
| preferences | JSONB | Service/product preferences |
| notes | TEXT | Free-form notes |
| photos | JSONB | Photo gallery references |
| updated_at | TIMESTAMPTZ | Last profile update |

### salon_services_menu
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Service name |
| category | TEXT | cabello, uñas, facial, corporal, maquillaje, depilación, barbería |
| duration_min | INTEGER | Standard duration in minutes |
| buffer_min | INTEGER | Cleanup/setup buffer (default 15) |
| price | DECIMAL | Base price |
| senior_price | DECIMAL | Price with senior stylist (optional) |
| junior_price | DECIMAL | Price with junior stylist (optional) |
| commission_rate | DECIMAL | Override commission rate (optional, else use stylist default) |
| products_typical | JSONB | Typical products used (for restock planning) |
| requires_patch_test | BOOLEAN | Whether service needs allergy test first |
| min_stylist_level | TEXT | junior, senior, specialist |
| is_active | BOOLEAN | Currently offered |
| sort_order | INTEGER | Display order within category |

## Conversation Examples

### Recording a Color Formula
```
Owner: "Le puse a la señora Rodríguez Igora 6.1 con un poquito de 7.1, mitad y mitad, con oxidante de 20. Le hice raíces y medios, 35 minutos."

Yaya: "✅ Fórmula guardada para Sra. Rodríguez:
🎨 Igora 6.1 + 7.1 (50/50)
💧 Oxidante 20vol
✂️ Técnica: raíces + medios
⏱️ 35 minutos
📅 21 marzo 2026

La próxima vez que venga, te recuerdo esta fórmula automáticamente 💇‍♀️"
```

### Querying a Formula
```
Owner: "¿Qué color le puse a María la última vez? Era un castaño pero no recuerdo"

Yaya: "María Gutiérrez — última coloración 15-feb-2026:
🎨 Igora 6.1 (rubio oscuro ceniza) + 7.1 (rubio ceniza)
   Proporción: 2:1
💧 Oxidante 20vol
✂️ Raíces completas + refrescar medios
⏱️ 40 minutos
📝 Nota: canas resistentes en sienes, aplicar primero ahí

Anterior (12-dic-2025): Igora 7.1 sola, 20vol, full head.
Se oscureció 1 nivel entre diciembre y febrero."
```

### Walk-In Check
```
Owner: "Oye acaba de llegar una clienta sin cita y quiere balayage"

Yaya: "Balayage necesita ~2.5-3 horas. Veamos disponibilidad:

❌ Ana: ocupada hasta las 5pm (2 coloraciones seguidas)
✅ Paola: libre de 2:30 en adelante — le alcanza perfecto
❌ Sofía (junior): libre pero balayage requiere senior

👉 Paola puede atenderla a las 2:30. ¿La agendo?
¿O prefiere volver mañana? Mañana hay más opciones."
```

### Gift Card Sale
```
Owner: "Una clienta quiere comprar un gift card de S/300 para regalar"

Yaya: "🎁 Gift Card creada:
Código: GC-8K4M-2R7P
Valor: S/300.00
Válida hasta: 21-mar-2027 (12 meses)

¿Quién la compra? Para la boleta.
¿Nombre de quien la recibe? (opcional, para personalizar)"
```

### Gift Card Redemption
```
Owner: "Viene una clienta con gift card GC-8K4M-2R7P, quiere corte y manicure"

Yaya: "🎁 Gift Card GC-8K4M-2R7P — Válida ✅
Saldo: S/300.00

Servicios hoy:
• Corte: S/35
• Manicure: S/25
Total: S/60

Saldo después: S/240.00
¿Confirmo el cobro?"
```

### No-Show Processing
```
Owner: "la clienta de las 3pm no vino 😤"

Yaya: "😤 Plantón registrado — Lucía Vargas, 3:00pm
Servicio: Coloración (S/120)

📌 Depósito de S/20 → RETENIDO (política: plantón = pierde depósito)
💸 Revenue perdido: S/100 (neto después de depósito)

⚠️ Ojo: Lucía tiene 2 plantones previos (dic 2025, feb 2026).
¿Quieres exigirle pago completo adelantado la próxima vez?

¿Le mando un mensaje por WhatsApp? Tengo una plantilla amable:
'Hola Lucía, hoy no pudimos atenderte en tu cita de las 3pm. Tu depósito de S/20 no es reembolsable según nuestra política. Si deseas reagendar, estamos para ti 💇‍♀️'"
```

### No-Show Statistics
```
Owner: "¿Cuántos plantones tuve este mes?"

Yaya: "📊 No-shows — Marzo 2026:
Total: 14 plantones de 92 citas (15.2%)
Revenue perdido: S/1,680 estimado
Depósitos cobrados: S/280

🔴 Top infractoras:
1. Lucía Vargas — 3 plantones (S/360 perdidos)
2. Andrea Castillo — 2 plantones (S/200 perdidos)
3. Katia Montes — 2 plantones (S/250 perdidos)

📅 Peor día: Lunes (22% no-show rate)
📅 Mejor día: Sábado (5% no-show rate)

💡 Sugerencia: Con depósito obligatorio en todas las citas, otros salones reportan reducción de no-shows del 50%. ¿Quieres activar depósito para todos los servicios?"
```

### Chair Utilization Report
```
Owner: "¿Cómo están las sillas esta semana?"

Yaya: "🪑 Utilización semanal (lun-sáb):

Ana (senior): 78% | S/45/hora | ⭐ Más productiva
Paola (senior): 65% | S/38/hora
Sofía (junior): 55% | S/28/hora
Katy (junior): 42% | S/22/hora | 📉 Más baja

📊 Promedio salón: 60% utilización
💰 Revenue por hora disponible: S/33
🕐 Horas vacías: 38h de 96h totales = S/1,254 de oportunidad perdida

💡 Martes y miércoles 2-4pm tienen <30% ocupación.
¿Creamos una promo 'Happy Hour' para esas horas?"
```

### Client Beauty Profile
```
Owner: "La clienta nueva dice que es alérgica al amoniaco"

Yaya: "⚠️ Alerta de alergia registrada:
Cliente: [nombre]
🚫 ALÉRGICA AL AMONIACO

Esto aparecerá en ROJO en cada cita futura.
Opciones sin amoniaco:
• Igora Vibrance (semi-permanente, sin amoniaco)
• Wella Color Touch (demi-permanente)
• Alfaparf Evolution of the Color (libre de amoniaco)
• L'Oréal INOA (oil-based, sin amoniaco)

¿Le hago prueba de parche primero? Recomendado para clientas con alergias conocidas."
```

## Cron Jobs / Proactive Behaviors

### Daily (7:00 AM)
- **Today's schedule preview** — "Buenos días 💇‍♀️ Hoy tienes 12 citas. 3 coloraciones (fórmulas adjuntas), 5 cortes, 2 manicures, 1 keratina, 1 facial"
- **Formula prep** — For each coloración/chemical service today, show client name + last formula
- **No-show risk alert** — Flag clients with history: "⚠️ Lucía Vargas tiene cita a las 3pm. Tiene 3 plantones previos. Confirmar asistencia."

### Per-Appointment (2 hours before)
- **Client reminder** — via whatsapp-mcp: "Hola [nombre], te recordamos tu cita hoy a las [hora] en Beauty Studio Carmen. ¡Te esperamos! 💅"
- **Deposit check** — If deposit required but not paid: "La cita de las 3pm no tiene depósito. ¿Confirmar o cancelar?"

### Weekly (Saturday evening)
- **No-show summary** — Count, revenue impact, repeat offenders
- **Chair utilization report** — Per-stylist productivity
- **Gift card expiry warning** — Cards expiring in next 30 days
- **Service popularity** — What's trending, what's declining

### Monthly
- **No-show trend** — Month-over-month comparison
- **Gift card liability** — Total outstanding balance
- **Client retention** — Returning vs new vs lapsed clients
- **Service mix analysis** — Revenue breakdown by service category

## Edge Cases

### Stylist Leaves and Takes Clients
- All color formulas remain in the system (linked to salon, not stylist)
- Client contact info preserved in crm-mcp
- "Ana se fue. ¿Quiénes son sus clientas?" → list all clients whose last service was with Ana
- "Mándales mensaje a las clientas de Ana: 'Tu próxima cita será con Paola, misma calidad de siempre'"

### Client Disputes Color Result
- Pull up exact formula used: "Le puse exactamente lo mismo que la vez pasada: Igora 6.1+7.1, 20vol"
- If formula was different from what client requested, notes provide evidence
- Before/after photos serve as visual documentation

### Gift Card Fraud Attempt
- Code doesn't exist → "❌ Este código de gift card no existe en el sistema"
- Already fully redeemed → "❌ Esta gift card ya fue utilizada completamente el 15-feb-2026"
- Expired → "❌ Esta gift card venció el 21-dic-2025. Política: no extensión después del vencimiento"

### Product Out of Stock During Service
- "Se me acabó el Igora 6.1 a mitad de coloración" → suggest equivalent alternatives based on formula history
- Flag for immediate restock via yaya-inventory

### Pregnant Client
- Auto-flag contraindication: "⚠️ La clienta está embarazada. Evitar: tintes con amoniaco, keratina con formol, ciertos tratamientos químicos"
- Suggest pregnancy-safe alternatives

## Metrics & KPIs

| Metric | Description | Target |
|--------|-------------|--------|
| No-show rate | No-shows / total appointments | <10% with deposits |
| Chair utilization | Occupied hours / available hours | >70% |
| Revenue per chair-hour | Total revenue / total available chair-hours | >S/35/hour |
| Gift card liability | Outstanding gift card balances | Track monthly |
| Client retention rate | Clients who return within 60 days | >65% |
| Walk-in conversion | Walk-ins that become repeat clients | >40% |
| Formula reuse rate | Color services using stored formula | >80% (after 3 months) |
| Deposit collection rate | Appointments with deposit / total appointments | >80% for high-value services |

## Notes
- **Privacy:** Color formulas and beauty profiles contain personal health-like information (allergies, conditions). Never share between clients. Only staff and owner access.
- **Language:** All communication in natural Peruvian Spanish. Beauty industry uses English terms freely (balayage, highlights, nail art, glow up) — recognize and use them naturally.
- **Photos:** Before/after photos require explicit client consent before sharing on any social platform. Store consent flag per photo.
- **Cultural sensitivity:** In Peru, beauty services are deeply personal. The agent should be warm, expressive, and use beauty industry vocabulary naturally. Emoji use is expected: 💇‍♀️💅✨🎨💄
