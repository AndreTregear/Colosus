# Test Results: Dra. Sofía Delgado — Appointments, Pricing & Payments (Scenarios 1–13)

**Persona:** Dra. Sofía Delgado Ramos, 38, dentista — Clínica Dental Sonrisa Perfecta, San Isidro, Lima  
**Business:** Clínica dental privada, ~120 citas/mes, S/45,000/mes, 5 empleados  
**Date:** 2026-03-20  
**Tester:** Subagent (Sofia-appt)  
**Scenarios Tested:** 1–13 (Appointments & Scheduling, Pricing & Quotations, Payments)

---

## Rating Scale

| Metric | Description |
|--------|-------------|
| **Handleable** | Can the platform handle this scenario with existing skills/tools? (0=impossible, 10=fully covered) |
| **Accuracy** | Would the response contain correct information? (0=wrong, 10=perfect) |
| **Speed** | How fast can the system respond? (0=minutes, 10=instant) |
| **Completeness** | Does the response address everything the user needs? (0=misses everything, 10=covers all) |
| **Delight** | Would the customer/owner be pleased with the experience? (0=frustrated, 10=delighted) |
| **Safety** | Does it avoid harm, data leaks, overbooking, financial errors? (0=dangerous, 10=safe) |

---

## APPOINTMENTS & SCHEDULING

---

### Scenario 1: New patient booking request

**Roleplay Message (patient → WhatsApp):**
> "Hola, quiero sacar una cita para limpieza dental. ¿Tienen disponibilidad esta semana?"

**Skills Involved:**
- `yaya-appointments` (primary) — availability check, smart booking flow
- `yaya-crm` (secondary) — auto-create contact if new patient, log interaction
- `yaya-sales` (minor) — conversational layer, product/service catalog context

**MCP Tools Required:**
- `erpnext-mcp` → `search_products` (look up "limpieza dental" in service catalog, get price/duration)
- `postgres-mcp` → query `appointments` table for available slots this week; query `providers` for working hours
- `crm-mcp` → `search_contacts` (check if returning patient), `create_contact` (if new), `log_interaction`

**Ratings:**

| Metric | Score | Notes |
|--------|-------|-------|
| Handleable | 9 | Fully covered by yaya-appointments. Service lookup, availability check, slot suggestion, booking confirmation — all specified in the skill. |
| Accuracy | 8 | Depends on services table being populated with dental-specific services (limpieza, duración, precio). If onboarding was done correctly, accurate. |
| Speed | 7 | Requires 2-3 MCP calls (service lookup + availability query + CRM check). Should respond in 3-5 seconds. |
| Completeness | 9 | Skill specifies: show services with duration/price, group slots by morning/afternoon, suggest 3-5 options, confirm full details before booking. |
| Delight | 9 | Natural conversational flow with emojis, price transparency, confirmation format. Dental patients expect efficiency — this delivers. |
| Safety | 9 | Conflict prevention built in. Double-booking protection. Timezone handled implicitly (America/Lima). |

**Gaps Identified:**
- **No pediatric vs. adult service distinction** in the data model. The `services` table has `name, duration, price` but no `age_range` or `patient_type` field. Sofía's clinic does pediatric dentistry — she'd need to tag services accordingly.
- **Provider specialty matching** — The skill mentions `providers.services[]` but doesn't specify specialty filtering (e.g., only orthodontist does brackets). Sofía has 2 dentists with different specialties.
- **No postgres-mcp server exists** in the MCP servers directory. The appointments data model references postgres-mcp but it's not implemented. This is a **critical gap** — appointments have no backend.

**Ideal Response:**
> ¡Hola! 👋 Con mucho gusto te agendo una limpieza dental.
>
> 🦷 Limpieza dental — 45 min — S/120
>
> Esta semana tenemos estos horarios disponibles:
>
> 📅 **Jueves 21 de marzo:**
> 🌅 Mañana: 9:00, 10:00, 11:30
> 🌇 Tarde: 3:00, 5:00
>
> 📅 **Viernes 22 de marzo:**
> 🌅 Mañana: 9:30, 11:00
> 🌇 Tarde: 2:30, 4:30
>
> ¿Cuál horario te acomoda mejor? 😊

---

### Scenario 2: Cancel and reschedule

**Roleplay Message (patient → WhatsApp):**
> "Necesito cancelar mi cita de mañana a las 3pm, ¿puedo reprogramar para el viernes?"

**Skills Involved:**
- `yaya-appointments` (primary) — cancellation + rescheduling flow
- `yaya-crm` (secondary) — log cancellation reason, update interaction history

**MCP Tools Required:**
- `postgres-mcp` → query `appointments` for patient's tomorrow 3PM appointment; update status to cancelled; query Friday availability; create new appointment
- `crm-mcp` → `log_interaction` (cancellation event)

**Ratings:**

| Metric | Score | Notes |
|--------|-------|-------|
| Handleable | 9 | Explicitly covered in yaya-appointments with reschedule example flow. |
| Accuracy | 8 | Needs to correctly identify the patient's appointment by phone number + datetime. Skill handles this. |
| Speed | 7 | 3 MCP calls: find appointment → cancel → check Friday availability. ~4 seconds. |
| Completeness | 9 | Finds existing appointment, confirms cancellation, shows Friday options, confirms new booking. |
| Delight | 9 | "Sin problema" approach — no guilt for cancelling. Empathy built into skill guidelines. |
| Safety | 9 | Cancellation policy respected (free window check). No double-booking on reschedule. |

**Gaps Identified:**
- **Cancellation reason not captured** in the example flow. The data model has `cancellation_reason` but the rescheduling flow doesn't prompt for it. For a clinic, knowing why patients cancel is valuable (personal, work, sick).
- **Same postgres-mcp gap** — no implementation for the appointments backend.
- **No automatic slot release notification** — if the cancelled slot could be offered to a waitlisted patient, that'd be ideal. Skill mentions waitlist but not waitlist-on-cancel triggers.

**Ideal Response:**
> Sin problema 👋 Encontré tu cita:
>
> 🦷 Limpieza dental — Viernes 21/03 a las 3:00 PM
>
> La cancelo y te busco opciones para el viernes...
>
> 📅 **Viernes 22 de marzo:**
> 🌅 Mañana: 9:00, 10:30
> 🌇 Tarde: 2:00, 4:00, 5:30
>
> ¿Cuál prefieres?

---

### Scenario 3: Pediatric inquiry with pricing

**Roleplay Message (patient/parent → WhatsApp):**
> "Mi hijo de 8 años necesita un control, ¿atienden niños? ¿Cuánto cuesta?"

**Skills Involved:**
- `yaya-appointments` — service catalog, availability
- `yaya-sales` — pricing inquiry handling
- `yaya-crm` — capture parent + child info, preferences

**MCP Tools Required:**
- `erpnext-mcp` → `search_products` (pediatric services), `get_item_price` (control infantil)
- `postgres-mcp` → availability check
- `crm-mcp` → `create_contact` (parent), note child's age

**Ratings:**

| Metric | Score | Notes |
|--------|-------|-------|
| Handleable | 7 | Partially covered. Service catalog can list pediatric services, but no structured pediatric workflow. |
| Accuracy | 7 | Price accuracy depends on ERPNext having pediatric-specific items. "Control infantil" may or may not be a distinct service item. |
| Speed | 7 | 2 MCP calls. |
| Completeness | 6 | Missing: age-appropriate provider recommendation, what a pediatric control includes, parent consent note, any special preparation needed. |
| Delight | 7 | Warm tone helps, but a parent wants reassurance about child-friendliness, not just pricing. |
| Safety | 8 | No medical advice given. But should note that CRM stores child age — minor data handling. |

**Gaps Identified:**
- **No dependent/family model** in CRM. The parent is the contact, but there's no structured way to link a child as a dependent patient. Sofía's receptionist currently handles this in a notebook.
- **No pediatric-specific service attributes** — age range, procedure description for parents, what to bring/prepare.
- **No provider preference by specialty** — pediatric dentist may not be both dentists. Need to route to the right one.
- **HIPAA/data sensitivity for minors** — CRM skill says "don't store sensitive personal info beyond what's needed" but doesn't address minor patient data specifically.

**Ideal Response:**
> ¡Hola! 👋 Claro que sí, atendemos niños en la Clínica Sonrisa Perfecta.
>
> Para un niño de 8 años, el servicio indicado es:
>
> 🦷 Control dental infantil — 30 min — S/80
> Incluye: revisión completa, limpieza básica, y recomendaciones de higiene
>
> 👩‍⚕️ Lo atiende la Dra. Sofía, especialista en odontopediatría.
>
> ¿Te gustaría agendar una cita? Tenemos disponibilidad esta semana 😊

---

### Scenario 4: Emergency appointment request

**Roleplay Message (patient → WhatsApp):**
> "ES URGENTE, me duele muchísimo una muela desde anoche, ¿pueden atenderme hoy?"

**Skills Involved:**
- `yaya-appointments` (primary) — emergency scheduling
- `yaya-escalation` (secondary) — ALL CAPS + urgency = potential escalation trigger, but this is a valid request not frustration
- `yaya-crm` — log urgency, update patient context

**MCP Tools Required:**
- `postgres-mcp` → check today's availability, find gaps between appointments or squeeze-in slots
- `crm-mcp` → `search_contacts`, `log_interaction` (urgency flag)

**Ratings:**

| Metric | Score | Notes |
|--------|-------|-------|
| Handleable | 7 | yaya-appointments mentions "walk-in awareness" and the persona specifically lists emergency scheduling as a daily task. But there's no explicit emergency/urgent priority queue in the data model. |
| Accuracy | 7 | Can check today's availability. But "squeezing in" an emergency between existing appointments requires understanding buffer times and procedure flexibility — not fully modeled. |
| Speed | 8 | Patient in pain needs immediate response. 1-2 MCP calls. |
| Completeness | 6 | Missing: triage questions (how bad? swelling? bleeding? fever?), emergency surcharge info, what to do while waiting (pain management tips). |
| Delight | 7 | Empathetic tone is there, but a dental emergency needs more urgency in the response — faster, shorter, action-oriented. |
| Safety | 7 | **Critical concern:** The agent should NOT provide medical advice (e.g., "take ibuprofen"). It should recognize this is urgent and route quickly. ALL CAPS detection in yaya-escalation might accidentally trigger escalation instead of emergency booking. |

**Gaps Identified:**
- **No emergency appointment type** in the data model. Emergencies need shorter slots, higher priority, and possibly different pricing.
- **No triage protocol** — dental emergencies range from mild discomfort to potential infection. The agent should ask 1-2 qualifying questions without practicing medicine.
- **Escalation skill conflict** — ALL CAPS + emotional language ("me duele muchísimo") triggers frustration detection signals. The system needs to distinguish between "frustrated with the bot" and "in pain requesting help." This is a **design gap**.
- **No walk-in vs. squeeze-in logic** — skill mentions walk-ins but doesn't specify how to find emergency slots in a packed schedule.
- **Medical disclaimer missing** — agent should say something like "No soy médico, pero te agendo lo antes posible."

**Ideal Response:**
> ¡Entiendo tu urgencia! 😟 Vamos a atenderte lo antes posible.
>
> 🚨 Tenemos un espacio de emergencia hoy a las 11:30 AM con la Dra. Sofía.
>
> 🦷 Evaluación de emergencia dental — 30 min — S/150
>
> Mientras tanto:
> ⚠️ Si hay hinchazón o fiebre, acude a urgencias.
>
> ¿Te confirmo la cita para las 11:30? 🙏

---

### Scenario 5: Bulk appointment reminders (owner request)

**Roleplay Message (Dra. Sofía → WhatsApp):**
> "¿Pueden recordarle a mis pacientes de mañana sus citas? Son 6 pacientes"

**Skills Involved:**
- `yaya-appointments` (primary) — reminder sending
- `yaya-notifications` (primary) — bulk notification orchestration
- `yaya-followup` — appointment reminder coordination

**MCP Tools Required:**
- `postgres-mcp` → query tomorrow's appointments (6 patients)
- `crm-mcp` → get patient contact info (phone numbers, names)
- WhatsApp sending (not an MCP tool — platform capability)

**Ratings:**

| Metric | Score | Notes |
|--------|-------|-------|
| Handleable | 8 | yaya-appointments has a reminder schedule (24h and 2h before). yaya-notifications handles batch sends. The skill interaction is well-defined. |
| Accuracy | 8 | Will correctly pull tomorrow's appointments and patient details. |
| Speed | 7 | Query + format + stagger send for 6 messages. yaya-notifications staggers batches of 20 with 30s intervals — 6 is well within one batch. |
| Completeness | 8 | Reminder template includes: patient name, service, time, address, confirmation prompt. |
| Delight | 8 | Owner gets confirmation of what was sent. Patients get a clean, actionable reminder. |
| Safety | 9 | Opt-out respected. No PHI in the reminder (service name is OK, not diagnosis). Rate limiting respected. |

**Gaps Identified:**
- **Owner vs. automated trigger ambiguity** — The 24h reminder should fire automatically via cron. Sofía shouldn't have to ask manually. This suggests the cron/heartbeat for appointment reminders isn't set up yet, or she doesn't trust it.
- **No confirmation tracking feedback** — After sending, yaya-notifications can report delivery/read status, but yaya-appointments doesn't specify feeding this back to the owner.
- **No patient response routing** — If a patient responds "Cambiar" to the reminder, that needs to route to yaya-appointments for rescheduling. The flow between skills isn't explicitly connected.
- **WhatsApp sending capability not implemented** — There's no MCP server for actually sending WhatsApp messages. This is a **platform-level gap**.

**Ideal Response:**
> ¡Claro, Doctora! 📋 Revisando las citas de mañana...
>
> Encontré 6 citas para mañana viernes 21/03:
>
> 1. Ana Martínez — Limpieza — 9:00 AM
> 2. Carlos Pérez — Control — 10:00 AM
> 3. María López — Resina — 11:00 AM
> 4. Pedro García — Blanqueamiento — 2:00 PM
> 5. Lucía Torres — Brackets (control) — 3:30 PM
> 6. Roberto Sánchez — Extracción — 5:00 PM
>
> 📤 Enviando recordatorios ahora...
>
> ✅ 6 recordatorios enviados. Te aviso si alguno responde para cambiar horario.

---

## PRICING & QUOTATIONS

---

### Scenario 6: Simple pricing inquiry

**Roleplay Message (patient → WhatsApp):**
> "¿Cuánto cuesta un blanqueamiento dental?"

**Skills Involved:**
- `yaya-sales` (primary) — pricing inquiry
- `yaya-inventory` / `yaya-appointments` — service catalog with prices

**MCP Tools Required:**
- `erpnext-mcp` → `search_products` ("blanqueamiento") or `get_item_price` (blanqueamiento dental)

**Ratings:**

| Metric | Score | Notes |
|--------|-------|-------|
| Handleable | 9 | This is the bread-and-butter use case. yaya-sales and yaya-appointments both handle service/price lookups. |
| Accuracy | 9 | Direct price lookup from ERPNext. As long as the service is in the catalog, price is accurate. |
| Speed | 9 | Single MCP call. Near-instant. |
| Completeness | 8 | Should include: price, duration, what's included, any variants (laser vs. gel). |
| Delight | 8 | This question gets asked "10x daily" per persona. A fast, clear answer with next-step CTA (booking) is delightful. |
| Safety | 9 | No sensitive info exposed. Price is public. |

**Gaps Identified:**
- **No service description/inclusions** in the basic data model. "Blanqueamiento dental" should specify what type (LED, laser, at-home kit), number of sessions, expected results. ERPNext `Item` has a `description` field but it may not be populated richly enough.
- **No before/after photos or social proof** — Sofía posts before/after on social media. Linking these in the pricing response would increase conversion.
- **Repeated question optimization** — persona says this gets asked 10x/day. Could be cached or templated for even faster response.

**Ideal Response:**
> ¡Hola! 😁 El blanqueamiento dental en Sonrisa Perfecta:
>
> ✨ Blanqueamiento LED profesional — S/350
> ⏱️ Duración: 1 hora (1 sesión)
> ✅ Incluye: evaluación previa, protección de encías, gel profesional
> 📈 Resultados: hasta 8 tonos más claro
>
> ¿Te gustaría agendar una cita? Tenemos disponibilidad esta semana 😊

---

### Scenario 7: Multi-service quotation

**Roleplay Message (patient → WhatsApp):**
> "Necesito una cotización completa: blanqueamiento + 2 resinas + limpieza"

**Skills Involved:**
- `yaya-sales` (primary) — multi-item quotation
- `yaya-appointments` — service pricing
- `yaya-billing` (minor) — if formal quotation/invoice needed

**MCP Tools Required:**
- `erpnext-mcp` → `get_item_price` × 3 services, then `create_quotation` (formal quote with items, quantities, prices)

**Ratings:**

| Metric | Score | Notes |
|--------|-------|-------|
| Handleable | 9 | ERPNext MCP has `create_quotation` tool. yaya-sales handles multi-item flows. |
| Accuracy | 8 | Prices come from ERPNext. Need to handle "2 resinas" correctly (qty=2). |
| Speed | 7 | 3-4 MCP calls (price lookups + quotation creation). ~5 seconds. |
| Completeness | 8 | Should show: itemized breakdown, total, estimated total time for all procedures, suggested scheduling. |
| Delight | 8 | A clean, professional quotation via WhatsApp — much better than "wait, let me check with the receptionist." |
| Safety | 8 | Quote validity period should be stated. Prices should match catalog. |

**Gaps Identified:**
- **No multi-session scheduling** — blanqueamiento + 2 resinas + limpieza might require 2-3 separate appointments. The quotation should suggest a treatment plan with session dates, not just prices.
- **No treatment plan concept** in the data model. Dental clinics commonly issue treatment plans (plan de tratamiento) that bundle services across multiple visits.
- **No bundle/package pricing** — If Sofía offers a package discount for multiple services, there's no mechanism for that in ERPNext pricing rules beyond manual pricing.
- **No formal PDF quotation** — WhatsApp message is fine, but some patients want a PDF quote to show their employer (for corporate dental benefits). No PDF generation capability.

**Ideal Response:**
> ¡Claro! Aquí va tu cotización completa 📋
>
> 🦷 **Cotización — Sonrisa Perfecta**
>
> ✨ Blanqueamiento LED — S/350
> 🔧 Resina dental (x2) — S/150 c/u — S/300
> 🪥 Limpieza dental profunda — S/120
>
> ━━━━━━━━━━━━━━━━
> 💰 **Total: S/770**
> ━━━━━━━━━━━━━━━━
>
> ⏱️ Tiempo total estimado: ~3 horas (recomendado en 2 citas)
> 📅 Cita 1: Limpieza + 2 resinas (~1.5 hrs)
> 📅 Cita 2: Blanqueamiento (~1 hr, después de 1 semana)
>
> Esta cotización es válida por 30 días.
> ¿Agendamos la primera cita? 😊

---

### Scenario 8: Payment plan inquiry

**Roleplay Message (patient → WhatsApp):**
> "¿Tienen planes de pago? No puedo pagar S/3,500 por los brackets de una vez"

**Skills Involved:**
- `yaya-sales` (primary) — payment guidance, plan inquiry
- `yaya-payments` — installment tracking
- `yaya-followup` — installment reminders

**MCP Tools Required:**
- `erpnext-mcp` → `get_item_price` (brackets/ortodoncia)
- `payments-mcp` → payment plan info (if configured)
- `crm-mcp` → `log_interaction` (high-value lead)

**Ratings:**

| Metric | Score | Notes |
|--------|-------|-------|
| Handleable | 5 | **Partially handled.** No explicit payment plan/installment skill. yaya-payments handles partial payments, and yaya-followup mentions installment reminders, but there's no structured installment plan creation tool. |
| Accuracy | 5 | Would need business rules: how many installments? Interest? Down payment? These aren't configured anywhere. |
| Speed | 6 | Response is straightforward once plans are defined, but plan creation requires multiple tool calls or doesn't exist. |
| Completeness | 4 | Missing: installment options, down payment requirement, what happens if patient misses a payment, interest/surcharge. |
| Delight | 5 | Patient asking about financing needs reassurance. A generic "ask the receptionist" would be disappointing. |
| Safety | 7 | Financial commitment — must be clear about terms. Should not auto-commit patient to a plan without their explicit consent. |

**Gaps Identified:**
- **No installment plan data model** — This is a **significant gap** for dental clinics. Brackets/ortodoncia are Sofía's highest-ticket item. Patients commonly need 3-12 month payment plans. There's no `payment_plans` table, no installment tracking, no plan template configuration.
- **No credit assessment** — Should the clinic extend credit? What's the no-show/default risk?
- **yaya-followup mentions installment reminders** but there's no installment to remind about — the creation is missing.
- **Legal/regulatory gap** — In Peru, offering payment plans may have consumer credit implications. The agent should not make binding financial commitments.

**Ideal Response:**
> ¡Claro que sí! Entendemos que los brackets son una inversión importante 😊
>
> 🦷 **Ortodoncia (brackets metálicos) — S/3,500**
>
> Tenemos estas opciones de pago:
>
> 📋 **Plan 1:** 3 cuotas de S/1,167 (sin interés)
> 📋 **Plan 2:** 6 cuotas de S/600 (S/3,600 total)
> 📋 **Plan 3:** 12 cuotas de S/320 (S/3,840 total)
>
> 💳 Cuota inicial: S/500 (incluida en todos los planes)
> 📅 Fecha de pago: inicio de cada mes
> 💜 Se acepta Yape, Plin, transferencia o tarjeta
>
> El tratamiento empieza al pagar la cuota inicial.
> ¿Cuál plan te acomoda más? 🙏

---

### Scenario 9: Tax/invoice inquiry

**Roleplay Message (patient → WhatsApp):**
> "¿El precio incluye IGV? Necesito factura para mi empresa"

**Skills Involved:**
- `yaya-sales` — pricing clarification
- `yaya-billing` — IGV handling, invoice generation
- `forex-mcp` — `calculate_igv` tool

**MCP Tools Required:**
- `forex-mcp` → `calculate_igv` (calculate IGV breakdown for service price)
- `erpnext-mcp` → invoice generation capability (Sales Invoice, not just Sales Order)

**Ratings:**

| Metric | Score | Notes |
|--------|-------|-------|
| Handleable | 7 | forex-mcp has `calculate_igv`. yaya-billing handles tax. ERPNext can generate invoices. But the flow for a patient requesting a factura (vs. boleta) isn't explicitly covered. |
| Accuracy | 8 | IGV is 18% — well-known and implemented in forex-mcp. Price + IGV calculation is straightforward. |
| Speed | 8 | 1-2 MCP calls. |
| Completeness | 6 | Missing: boleta vs. factura distinction (Peru-specific), RUC requirement for factura, electronic invoicing (facturación electrónica SUNAT). |
| Delight | 6 | Patient needs a clear answer: "yes/no IGV included, and yes we can issue factura." Should be crisp. |
| Safety | 8 | Tax compliance is important. Must not misrepresent IGV inclusion. |

**Gaps Identified:**
- **No boleta vs. factura logic** — In Peru, businesses issue boletas (for individuals) or facturas (for companies, with RUC). This is a fundamental Peru tax requirement not modeled in any skill.
- **No RUC collection flow** — To issue a factura, Sofía needs the patient's company RUC and razón social. No skill prompts for this.
- **No electronic invoicing (SUNAT)** — Peru requires electronic invoicing for businesses above a certain threshold. ERPNext may handle this with the right module, but it's not in the MCP tools.
- **Sofía's own RUC is in the persona** (10456789012, persona natural con negocio) but there's no place to configure this in the platform.
- **yaya-billing is for Yaya Platform's own subscriptions**, not for the business's invoicing to their customers. This is a **scope confusion** — there's no skill for helping Sofía's clinic generate invoices to patients.

**Ideal Response:**
> ¡Hola! Los precios publicados **no incluyen IGV**.
>
> Ejemplo con un blanqueamiento de S/350:
> 💰 Precio base: S/350
> 📋 IGV (18%): S/63
> 💵 **Total con IGV: S/413**
>
> Para emitir **factura** necesito:
> 📝 RUC de tu empresa
> 🏢 Razón social
>
> Si es para uso personal, emitimos **boleta** automáticamente.
>
> ¿Me compartes los datos de tu empresa? 😊

---

## PAYMENTS

---

### Scenario 10: Payment confirmation with Yape screenshot

**Roleplay Message (patient → WhatsApp):**
> [Sends Yape screenshot S/250] "Ya pagué mi cita de hoy"

**Skills Involved:**
- `yaya-payments` (primary) — receipt OCR, order matching, confirmation
- `yaya-crm` — log payment interaction
- `yaya-appointments` — update appointment as paid

**MCP Tools Required:**
- Vision/OCR (Qwen3.5-27B) — extract amount, reference, date, sender from Yape screenshot
- `payments-mcp` → `match_payment` (find pending order for S/250), `confirm_payment`
- `erpnext-mcp` → `create_payment_entry` (record payment against sales order)
- `crm-mcp` → `log_interaction` (payment received)

**Ratings:**

| Metric | Score | Notes |
|--------|-------|-------|
| Handleable | 8 | yaya-payments is specifically designed for this. OCR → match → confirm flow is well-documented. |
| Accuracy | 7 | Depends on Qwen3.5-27B vision OCR quality for Yape screenshots. Yape has a consistent UI, so extraction should be reliable. Amount matching with ±1% tolerance. |
| Speed | 6 | OCR + match + confirm = 3-4 operations. OCR via self-hosted LLM may take 2-5 seconds. Total ~8 seconds. |
| Completeness | 8 | Confirms amount, reference, date. Cross-references with pending appointments. Updates order status. |
| Delight | 9 | "¡Pago confirmado! ✅" — this is the moment patients love. Instant validation instead of "la recepcionista lo verifica mañana." |
| Safety | 8 | Duplicate detection (receipt hash). Confirms with patient before processing. Never stores full account numbers. |

**Gaps Identified:**
- **Appointment-payment linking** — yaya-payments matches against sales orders (ERPNext), but dental appointments live in postgres (`appointments` table). There's no link between the appointment and the ERPNext sales order. **How does a Yape payment get matched to a dental appointment?** This is a **critical integration gap**.
- **S/250 matching ambiguity** — What if two patients have S/250 pending? The matching logic works on amount + customer, but patient identification from a Yape screenshot relies on sender name matching the patient name. Yape shows only first name + last initial.
- **No pre-payment for appointments** — The current flow assumes sales orders exist. For dental clinics, the payment often happens at the time of the visit, not as a pre-paid order. The "pending order" model doesn't fit perfectly.

**Ideal Response:**
> ¡Recibido! 📸 Veo tu pago:
>
> 💜 Yape por S/250.00
> 📝 Referencia: YP-2026-XYZ789
> 📅 Fecha: 20/03/2026
>
> ✅ Esto coincide con tu cita de hoy — Limpieza + control dental.
>
> ¡Pago confirmado! ✅ Te esperamos en tu cita. 😊

---

### Scenario 11: Patient balance inquiry

**Roleplay Message (patient → WhatsApp):**
> "¿Cuánto debo en total? Creo que me falta pagar la segunda cuota de los brackets"

**Skills Involved:**
- `yaya-payments` — balance lookup
- `yaya-sales` — order history context

**MCP Tools Required:**
- `erpnext-mcp` → `get_customer_balance` (total outstanding)
- `payments-mcp` → `get_payment_history` (past payments to show what's been paid)

**Ratings:**

| Metric | Score | Notes |
|--------|-------|-------|
| Handleable | 7 | `get_customer_balance` exists in erpnext-mcp and gives outstanding invoices + unbilled orders. `get_payment_history` shows past payments. |
| Accuracy | 7 | Depends on ERPNext having accurate records. If installment plans aren't formalized in ERPNext, the balance may not reflect "segunda cuota de brackets." |
| Speed | 7 | 2 MCP calls. |
| Completeness | 5 | **Major gap:** No installment plan tracking. The patient thinks in terms of "cuotas" (installments), but the system tracks raw order balances. Can't say "you've paid cuota 1, cuota 2 is S/1,167 due March 30." |
| Delight | 6 | Patient wants a simple "you owe X, next payment is Y by Z date." Without installment structure, the answer is just a raw number. |
| Safety | 8 | Only shows the patient their own balance. No cross-patient data leak. |

**Gaps Identified:**
- **Installment plan tracking is missing** (same as Scenario 8). Patient references "segunda cuota" but there's no cuota structure in the system.
- **Payment schedule visibility** — Patient should see: total treatment cost, what's been paid, remaining balance, next payment amount and due date.
- **No payment plan summary tool** — Would need something like `get_installment_plan(customer, order_id)` returning structured payment schedule.
- **Patient identity verification** — Balance is sensitive financial info. How does the system verify the WhatsApp number matches the patient? CRM phone lookup, but what if someone else uses the patient's phone?

**Ideal Response:**
> ¡Hola! Revisando tu cuenta... 🔍
>
> 🦷 **Ortodoncia (brackets) — Plan de pago**
>
> 💰 Total tratamiento: S/3,500
> ✅ Cuota 1 (pagada 15/02): S/1,167
> ⏳ **Cuota 2 (pendiente, vence 15/03): S/1,167** ← esta te falta
> ⏳ Cuota 3 (vence 15/04): S/1,166
>
> 📊 **Saldo pendiente total: S/2,333**
>
> Puedes pagar por:
> 💜 Yape al 987-654-321
> 🏦 BCP cuenta 191-123-456-789
>
> ¿Necesitas ayuda con el pago? 😊

---

### Scenario 12: Owner queries patient debt

**Roleplay Message (Dra. Sofía → WhatsApp):**
> "Mi paciente María López tiene 3 citas sin pagar, cuánto debe?"

**Skills Involved:**
- `yaya-payments` — balance inquiry
- `yaya-crm` — customer lookup, interaction history
- `yaya-analytics` — payment collection context

**MCP Tools Required:**
- `crm-mcp` → `search_contacts` ("María López")
- `erpnext-mcp` → `get_customer_balance` (María López)
- `payments-mcp` → `get_payment_history` (María López)

**Ratings:**

| Metric | Score | Notes |
|--------|-------|-------|
| Handleable | 8 | CRM search + balance lookup + payment history. All tools exist. Owner queries are explicitly allowed in yaya-crm. |
| Accuracy | 7 | Depends on all 3 appointments having associated sales orders/invoices in ERPNext. If appointments and billing are disconnected, the balance won't reflect "3 citas sin pagar." |
| Speed | 7 | 3 MCP calls. |
| Completeness | 7 | Can show total balance and unpaid invoices. But "3 citas sin pagar" implies appointment-level granularity that may not exist in ERPNext if invoices are created per-visit. |
| Delight | 8 | Owner gets clear, actionable info: who owes, how much, for what. |
| Safety | 9 | Owner is authorized to see patient financial data. CRM skill specifies owner queries get full transparency. |

**Gaps Identified:**
- **Appointment-invoice linking gap** (recurring theme). "3 citas sin pagar" means 3 appointments each with a service rendered but no payment. If invoices exist per appointment, this works. If not, the system can only show a total balance.
- **No accounts receivable aging** — For a clinic owner, knowing that one appointment is 3 months overdue vs. 3 days overdue changes the follow-up strategy.
- **Bulk patient debt query** — Sofía might want "all patients who owe money," not just one. This would need a custom query across all customers.

**Ideal Response:**
> 📋 **María López** — Saldo pendiente:
>
> 🦷 Cita 05/03 — Resina dental — S/150 ⚠️ 15 días sin pagar
> 🦷 Cita 12/03 — Limpieza — S/120 ⚠️ 8 días sin pagar
> 🦷 Cita 19/03 — Control ortodoncia — S/80 ⚠️ 1 día sin pagar
>
> 💰 **Total pendiente: S/350**
>
> ¿Quieres que le envíe un recordatorio de pago? 📩

---

### Scenario 13: End-of-day collection summary

**Roleplay Message (Dra. Sofía → WhatsApp):**
> "Dame el resumen de cobros de hoy"

**Skills Involved:**
- `yaya-analytics` (primary) — daily collection report
- `yaya-payments` — collection data

**MCP Tools Required:**
- `payments-mcp` → `get_daily_collection_summary` (today's collections by payment method)
- `erpnext-mcp` → `get_sales_summary` (today's sales)

**Ratings:**

| Metric | Score | Notes |
|--------|-------|-------|
| Handleable | 9 | `get_daily_collection_summary` exists in payments-mcp and gives exactly this: total collected by payment method. yaya-analytics has daily summary format. |
| Accuracy | 8 | Data comes from confirmed payments in ERPNext + payments DB. Cross-referenced. |
| Speed | 7 | 2 MCP calls. |
| Completeness | 8 | Shows: total collected, breakdown by Yape/Plin/BCP/cash, number of transactions. |
| Delight | 9 | This is one of Sofía's pain points: "payment tracking nightmare." An instant end-of-day reconciliation is a game-changer. |
| Safety | 9 | Only shared with the business owner. Financial data is private. |

**Gaps Identified:**
- **No pending/uncollected highlight** — Summary should also show what was billed today but NOT yet collected, so Sofía knows what to follow up on.
- **No cash vs. digital reconciliation** — For a dental clinic, cash payments are common. The system needs manual cash input confirmation. The agent knows about Yape screenshots but not about the cash the receptionist collected.
- **No appointment-linked view** — Sofía thinks in terms of "patients I saw today and what they paid," not raw payment entries. The summary should be organized by appointment/patient, not just by payment method.
- **Discrepancy detection** — If 8 patients were seen but only 5 payments recorded, that should be flagged.

**Ideal Response:**
> 📊 **Resumen de cobros — Viernes 20/03**
>
> 💰 **Total cobrado hoy: S/1,230**
>
> Por método de pago:
> 💜 Yape: S/650 (4 pagos)
> 🏦 BCP: S/300 (1 transferencia)
> 💵 Efectivo: S/200 (2 pagos)
> 💚 Plin: S/80 (1 pago)
>
> 📋 **Detalle por paciente:**
> ✅ Ana M. — Limpieza — S/120 (Yape)
> ✅ Carlos P. — Resinas x2 — S/300 (BCP)
> ✅ María L. — Control — S/80 (Plin)
> ✅ Pedro G. — Blanqueamiento — S/350 (Yape)
> ✅ Lucía T. — Brackets control — S/180 (Yape)
> ✅ Roberto S. — Extracción — S/200 (Efectivo)
> ✅ Jorge R. — Limpieza — S/120 (Efectivo) ← walk-in
> ⚠️ Diana F. — Resina — S/150 — **NO PAGÓ** (pendiente)
>
> 📊 8 pacientes atendidos, 7 cobrados, 1 pendiente
> ⚠️ Pendiente de cobro: S/150
>
> ¿Envío recordatorio de pago a Diana? 📩

---

## SUMMARY SCORECARD

| Scenario | Handleable | Accuracy | Speed | Completeness | Delight | Safety | **Avg** |
|----------|-----------|----------|-------|-------------|---------|--------|---------|
| 1. New booking | 9 | 8 | 7 | 9 | 9 | 9 | **8.5** |
| 2. Cancel/reschedule | 9 | 8 | 7 | 9 | 9 | 9 | **8.5** |
| 3. Pediatric inquiry | 7 | 7 | 7 | 6 | 7 | 8 | **7.0** |
| 4. Emergency | 7 | 7 | 8 | 6 | 7 | 7 | **7.0** |
| 5. Bulk reminders | 8 | 8 | 7 | 8 | 8 | 9 | **8.0** |
| 6. Price inquiry | 9 | 9 | 9 | 8 | 8 | 9 | **8.7** |
| 7. Multi-service quote | 9 | 8 | 7 | 8 | 8 | 8 | **8.0** |
| 8. Payment plan | 5 | 5 | 6 | 4 | 5 | 7 | **5.3** |
| 9. Tax/factura | 7 | 8 | 8 | 6 | 6 | 8 | **7.2** |
| 10. Yape confirmation | 8 | 7 | 6 | 8 | 9 | 8 | **7.7** |
| 11. Patient balance | 7 | 7 | 7 | 5 | 6 | 8 | **6.7** |
| 12. Patient debt query | 8 | 7 | 7 | 7 | 8 | 9 | **7.7** |
| 13. Daily collection | 9 | 8 | 7 | 8 | 9 | 9 | **8.3** |
| **AVERAGE** | **7.8** | **7.5** | **7.2** | **7.1** | **7.6** | **8.3** | **7.6** |

---

## CRITICAL GAPS (Priority Order)

### 🔴 P0 — Blockers

1. **No postgres-mcp server implementation** — The `appointments` data model (appointments, providers, services tables) references postgres-mcp, but no postgres MCP server exists in `/mcp-servers/`. Without this, appointment booking, scheduling, and availability checks have **no backend**. This blocks Scenarios 1-5 entirely.

2. **No WhatsApp message sending capability** — Skills reference sending WhatsApp messages (reminders, notifications, follow-ups) but there's no MCP tool or platform capability for actually sending messages. This blocks Scenario 5 and all notification-dependent flows.

### 🟠 P1 — Major Feature Gaps

3. **No installment/payment plan system** — Dental clinics heavily rely on payment plans for high-ticket procedures (brackets S/3,500, implants S/4,000+). No data model, creation flow, or tracking exists. Blocks Scenarios 8 and 11.

4. **Appointment-payment integration gap** — Appointments live in postgres, payments/orders in ERPNext. There's no link between "dental appointment" and "sales order/invoice." This makes payment confirmation (Scenario 10), patient balance queries (11-12), and collection summaries (13) unreliable for service businesses.

5. **No Peru-specific invoicing (boleta/factura)** — yaya-billing is for Yaya Platform's own billing, not the client business's invoicing. Sofía needs to issue boletas and facturas to patients, compliant with SUNAT electronic invoicing requirements. Blocks Scenario 9.

### 🟡 P2 — Moderate Gaps

6. **Emergency appointment handling** — No emergency slot type, triage protocol, or priority queue. Escalation skill may incorrectly intercept emergency requests as frustration (ALL CAPS false positive).

7. **Pediatric/dependent patient model** — No way to model parent-child relationships in CRM. No age-specific services or provider-specialty routing.

8. **Service business catalog richness** — Services need more than name/price/duration. Need: description, what's included, preparation instructions, contraindications, session count.

9. **Appointment-to-patient-detail view for collections** — End-of-day summary should be organized by patient/appointment, not just payment method aggregation.

10. **Reminder response routing** — When a patient responds to a reminder ("Cambiar"), no defined routing from yaya-notifications back to yaya-appointments for rescheduling.

### 🟢 P3 — Nice to Have

11. **Treatment plan bundles** — Multi-service packages with discounted pricing and multi-session scheduling.
12. **PDF quotation/invoice generation** — For patients who need formal documents.
13. **No-show analytics** — Sofía's 15-20% no-show rate is killing revenue. Tracking and acting on this data would be high value.
14. **Cash payment recording** — Manual cash input by receptionist to match against appointments.
15. **Before/after photo integration** — Link procedure photos to pricing responses for social proof.
