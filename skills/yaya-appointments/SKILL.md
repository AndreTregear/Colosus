# yaya-appointments — Appointment Booking & Scheduling

## Description
Conversational appointment booking skill for service businesses — salons, clinics, dental offices, consultants, tutors, personal trainers, and similar. Manages available slots, books appointments, sends WhatsApp reminders, handles cancellations and rescheduling. Designed for businesses that currently manage appointments via handwritten notebooks or chaotic WhatsApp threads.

## When to Use
- Customer asks to book, schedule, or reserve a time/cita
- Customer asks about availability ("¿tienen hora disponible?", "¿a qué hora atienden?")
- Customer needs to cancel or reschedule an existing appointment
- It's time to send an appointment reminder (coordinates with yaya-followup)
- Business owner needs to see their schedule for the day/week
- Customer asks about services offered and their duration/pricing

## Capabilities
- **Availability Check** — Show open slots for a given day, service, and provider
- **Smart Booking** — Book appointments conversationally, confirming service + date + time + provider
- **Conflict Prevention** — Never double-book a provider or resource
- **Reminders** — Send WhatsApp reminders at configured intervals (24h, 2h before)
- **Cancellation** — Cancel with configurable policy (free cancellation window, late cancellation fee)
- **Rescheduling** — Move appointments to new slots while respecting availability
- **Service Catalog** — List available services with duration and pricing
- **Provider Selection** — Let customer choose a specific provider or accept "whoever is available"
- **Waitlist** — If no slots available, offer to add customer to waitlist
- **Schedule View** — Business owner can request their daily/weekly schedule summary

## MCP Tools Required
- `erpnext-mcp` — Service items catalog (services as items), pricing
- `postgres-mcp` — Appointment storage, availability queries, schedule management
- `crm-mcp` — Customer lookup, log booking interactions, customer preferences (preferred provider, preferred time)

## Data Model (Postgres)
```sql
-- Core tables managed via postgres-mcp
appointments (
  id, customer_id, provider_id, service_id,
  start_time, end_time, status, -- booked/confirmed/cancelled/completed/no-show
  notes, reminder_sent_24h, reminder_sent_2h,
  created_at, cancelled_at, cancellation_reason
)

providers (
  id, name, whatsapp_number, services[], -- services they can perform
  working_hours, -- jsonb: {"mon": ["09:00-13:00", "15:00-19:00"], ...}
  break_duration -- minutes between appointments
)

services (
  id, name, duration_minutes, price, description, active
)
```

## Behavior Guidelines
- **Always confirm the full appointment before booking:** service, date, time, provider (if applicable)
- **Show availability in a scannable format** — Don't dump 20 time slots. Group by morning/afternoon/evening. Suggest the next 3-5 available options.
- **Respect buffer time** between appointments (configurable per provider)
- **Use natural date/time language** — "mañana a las 3 de la tarde" not "2026-03-21T15:00:00"
- **Handle timezone implicitly** — All times in the business's local timezone. Never mention UTC.
- **Cancellation empathy** — Don't guilt customers for cancelling. Make it easy.
- **No-show tracking** — After 3 no-shows, flag in CRM but don't refuse booking (business owner decides policy)
- **Walk-in awareness** — If the business accepts walk-ins, mention it as an alternative when slots are tight
- **Provider privacy** — Don't share provider personal phone numbers or schedules beyond availability

## Example Flows

### Booking a Haircut
```
Cliente: "Hola, quiero una cita para corte de pelo"
Agente: "¡Hola! 💇 Con mucho gusto te agendo.

         Tenemos estos servicios de corte:
         ✂️ Corte clásico — 30 min — S/25
         ✂️ Corte + barba — 45 min — S/40
         ✂️ Corte infantil — 20 min — S/15

         ¿Cuál te interesa?"
Cliente: "Corte clásico, para mañana si tienen"
Agente: [consulta disponibilidad]
Agente: "Mañana viernes tenemos estos horarios disponibles:

         🌅 Mañana: 9:00, 10:00, 11:30
         🌇 Tarde: 2:30, 4:00, 5:30

         ¿Cuál te acomoda mejor?"
Cliente: "A las 10"
Agente: "Perfecto, te confirmo:

         ✂️ Corte clásico
         📅 Viernes 21 de marzo
         🕐 10:00 AM
         💰 S/25

         ¿Confirmo tu cita?"
Cliente: "Sí, confírmala"
Agente: "¡Listo! Tu cita está confirmada ✅
         Te enviaré un recordatorio mañana temprano.

         📍 [dirección del negocio]

         ¡Te esperamos! 😊"
```

### Rescheduling
```
Cliente: "Hola, necesito cambiar mi cita de mañana"
Agente: [busca cita] "Encontré tu cita:
         ✂️ Corte clásico — Viernes 21/03 a las 10:00 AM

         ¿Para cuándo te gustaría reprogramarla?"
Cliente: "¿Tienen el sábado en la tarde?"
Agente: [consulta disponibilidad]
Agente: "El sábado tenemos disponible:
         🌇 Tarde: 2:00, 3:30, 5:00

         ¿Cuál prefieres?"
Cliente: "3:30"
Agente: "¡Listo! Cita reprogramada ✅

         ✂️ Corte clásico
         📅 Sábado 22 de marzo
         🕐 3:30 PM

         ¡Nos vemos el sábado! 👋"
```

### No Availability
```
Cliente: "Quiero cita para mañana con la doctora García"
Agente: [consulta disponibilidad]
Agente: "Mañana la Dra. García tiene la agenda completa 😔

         Te puedo ofrecer:
         1. 📅 Pasado mañana (sábado) a las 9:00 o 11:00 con la Dra. García
         2. 👩‍⚕️ Mañana con el Dr. López a las 10:00 o 3:00
         3. 📝 Te anoto en lista de espera por si se abre un espacio mañana

         ¿Qué prefieres?"
```

### Cancellation
```
Cliente: "Tengo que cancelar mi cita del sábado"
Agente: "Sin problema, encontré tu cita:
         ✂️ Corte clásico — Sábado 22/03 a las 3:30 PM

         ¿Confirmo la cancelación?"
Cliente: "Sí, cancela"
Agente: "Cita cancelada ✅ Cuando quieras reagendar, aquí estamos. 👋"
```

## Reminder Schedule
```
24 hours before:
  "Hola [nombre] 👋 Te recordamos tu cita mañana:
   [servicio] a las [hora]
   📍 [dirección]

   ¿Todo confirmado? Responde 'Sí' para confirmar o
   'Cambiar' si necesitas reprogramar."

2 hours before:
  "¡Hola! Tu cita es en 2 horas ⏰
   [servicio] a las [hora]
   📍 [dirección]

   ¡Te esperamos!"
```

## Configuration
- `APPOINTMENT_SLOT_DURATION` — Default slot duration in minutes (default: 30)
- `APPOINTMENT_BUFFER` — Buffer time between appointments in minutes (default: 10)
- `APPOINTMENT_ADVANCE_DAYS` — How many days ahead customers can book (default: 30)
- `REMINDER_HOURS_BEFORE` — Comma-separated hours before appointment to send reminders (default: "24,2")
- `CANCELLATION_WINDOW_HOURS` — Free cancellation window in hours before appointment (default: 24)
- `LATE_CANCELLATION_FEE` — Fee for cancelling within the window (default: 0)
- `WAITLIST_ENABLED` — Enable waitlist when no slots available (default: true)
- `NO_SHOW_THRESHOLD` — Number of no-shows before flagging customer (default: 3)
- `BUSINESS_TIMEZONE` — Timezone for all scheduling (e.g., "America/Lima")
- `BUSINESS_ADDRESS` — Physical address to include in confirmations and reminders

## Error Handling & Edge Cases
- **Double-booking attempt:** If a race condition causes two customers to book the same slot, detect on write and offer the second customer the next available slot. Never silently overbook.
- **Past-date booking:** If customer asks for a date that already passed, ask: "Esa fecha ya pasó. ¿Quisiste decir [próxima fecha similar]?"
- **Ambiguous time:** "A las 3" — Ask: "¿3 de la tarde, verdad?" Don't assume.
- **Provider on leave:** If a provider is marked unavailable for a date range, don't show their slots. Offer alternatives.
- **Holiday closures:** Respect configured holidays. If customer tries to book on a holiday: "Ese día estamos cerrados por [motivo]. ¿Te agendo para el [siguiente día hábil]?"
- **Multiple services:** If customer wants to book two services back-to-back, combine the durations and find a slot that fits the total time.
- **Walk-in overflow:** If schedule is full but business accepts walk-ins, mention: "La agenda está llena, pero puedes venir sin cita y te atendemos por orden de llegada."
- **Timezone edge cases:** All dates/times stored in UTC, displayed in `BUSINESS_TIMEZONE`. Never expose UTC to customers.
- **Reminder delivery failure:** If a WhatsApp reminder fails to deliver, log the failure but don't retry excessively. The 2-hour reminder serves as backup.
