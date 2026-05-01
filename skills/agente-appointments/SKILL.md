# agente-appointments — Appointment Booking, Scheduling & Calendar Sync

## Description
Full-featured conversational appointment booking skill for service businesses — salons, clinics, dental offices, consultants, tutors, personal trainers, and similar. Manages available slots, books appointments, sends WhatsApp reminders, handles cancellations and rescheduling, syncs with external calendars (Google, Outlook, CalDAV), and supports multi-provider scheduling. Designed for businesses that currently manage appointments via handwritten notebooks or chaotic WhatsApp threads. Works in Spanish as the primary language with natural date/time understanding.

## When to Use
- Customer asks to book, schedule, or reserve a time/cita ("quiero una cita", "quiero agendar", "necesito turno")
- Customer asks about availability ("¿tienen hora disponible?", "¿a qué hora atienden?", "¿hay espacio mañana?")
- Customer needs to cancel or reschedule an existing appointment
- Customer describes an urgent situation that needs emergency scheduling ("me duele mucho", "es urgente", "emergencia")
- It's time to send appointment reminders (24h and 2h before)
- Business owner needs to see their schedule for the day/week
- Customer asks about services offered and their duration/pricing
- Business owner wants to add/modify services, providers, or working hours
- Provider needs to sync their personal calendar (Google Calendar, Outlook, Nextcloud)

## Capabilities
- **Natural Language Booking** — Understand requests like "mañana a las 3", "el próximo lunes en la mañana", "para el sábado si tienen"
- **Availability Check** — Show open slots for a given day, service, and provider, grouped by morning/afternoon/evening
- **Smart Booking** — Book appointments conversationally, confirming service + date + time + provider before committing
- **Conflict Prevention** — Never double-book a provider; checks internal appointments AND synced external calendars
- **Calendar Sync** — Integrate with Google Calendar, Outlook, and CalDAV (Nextcloud, Apple Calendar, Radicale)
- **Reminders** — Send WhatsApp reminders at 24h and 2h before appointment
- **Cancellation** — Cancel with configurable policy (free cancellation window, grace period enforcement)
- **Rescheduling** — Move appointments to new slots while respecting availability
- **Service Catalog** — List available services with duration, pricing, and categories
- **Multi-Provider** — Let customer choose a specific provider ("con la Dra. García") or accept any available
- **Emergency Override** — Detect urgent language and squeeze in same-day appointments outside normal availability
- **Walk-in Awareness** — When slots are full, offer walk-in as alternative if business supports it
- **No-Show Tracking** — Track customers who don't show up; flag repeat no-shows for business owner review
- **Waitlist** — Offer to add customer to waitlist when no slots are available
- **Schedule View** — Business owner can request daily/weekly schedule summary with all providers

## MCP Tools Required
- `appointments-mcp` — Primary tool source:
  - **Booking:** `get_available_slots`, `book_appointment`, `cancel_appointment`, `reschedule_appointment`, `get_appointment`, `list_appointments`
  - **Services:** `list_services`, `create_service`
  - **Providers:** `list_providers`, `get_provider_schedule`, `set_working_hours`
  - **Reminders:** `send_reminder`, `list_no_shows`
  - **Calendar Sync:** `sync_google_calendar`, `sync_caldav`, `get_external_events`
- `crm-mcp` — Customer lookup, log booking interactions, customer preferences (preferred provider, preferred time)

## Behavior Guidelines

### Language & Tone
- **Primary language: Spanish** — All customer-facing messages in Spanish. Adapt to regional variants (Peru: "cita", Mexico: "cita/turno", Argentina: "turno")
- **Warm and professional** — Use friendly but not overly casual tone. Match the business's brand voice.
- **Use emojis sparingly but effectively** — ✅ for confirmations, 📅 for dates, 🕐 for times, ✂️💇🦷 for service-specific icons
- **Natural date/time language** — "mañana viernes a las 3 de la tarde" not "2026-03-21T15:00:00"

### Scheduling Logic
- **Always confirm the full appointment before booking:** service, date, time, provider (if applicable), price
- **Show availability in a scannable format** — Don't dump 20 time slots. Group by morning (🌅)/afternoon (🌇)/evening (🌙). Show the next 3-5 best options per group.
- **Respect buffer time** between appointments (configurable per environment, default 10 min)
- **Handle timezone implicitly** — All times in the business's local timezone. Never mention UTC to customers.
- **Check external calendars** before showing availability — synced Google/Outlook/CalDAV events block those times
- **Validate before booking** — Always call `get_available_slots` to verify a slot is open before calling `book_appointment`, even if the customer picked from the list (race condition protection)

### Emergency Detection
Detect urgency keywords and override normal scheduling:
- Pain indicators: "me duele", "dolor", "emergencia", "urgente", "no aguanto"
- Health urgency: "sangra", "hinchado", "fiebre", "accidente"
- When detected:
  1. Acknowledge the urgency empathetically
  2. Check today's schedule for ANY gap, even short ones
  3. If a gap exists, offer it immediately
  4. If no gap, check if another provider can see them
  5. Last resort: offer walk-in with estimated wait time
  6. Never respond with "no hay espacio" to an emergency without exploring all options

### Multi-Provider Logic
- When customer doesn't specify a provider, check all active providers
- Present options clearly: "Con la Dra. García a las 10:00 o con el Dr. López a las 10:30"
- Remember customer preferences from CRM (preferred provider, preferred time of day)
- If preferred provider is unavailable, mention it: "La Dra. García tiene la agenda llena mañana, pero el Dr. López tiene disponible a las..."

### Walk-in vs Appointment Balance
- If the business accepts walk-ins AND schedule is full, mention: "La agenda está llena, pero puedes venir sin cita y te atendemos por orden de llegada"
- Never discourage walk-ins if the business supports them
- If a walk-in customer messages asking for availability and today is full, offer both: next available appointment + walk-in option

### Cancellation Empathy
- Don't guilt customers for cancelling. Make it easy.
- If within cancellation policy window, inform them gently and offer to reschedule instead
- If outside window (e.g., cancelling more than 24h before), cancel immediately
- Always offer to rebook: "Cita cancelada ✅ Cuando quieras reagendar, aquí estamos."

### Privacy
- Don't share provider personal phone numbers or full schedules
- Only show availability slots, not the reason a slot is blocked
- Don't share other customers' appointment details

## Example Flows

### Booking an Appointment (Full Flow)
```
Cliente: "Hola, quiero una cita para limpieza dental"
Agente: "¡Hola! 🦷 Con mucho gusto te agendo.

         Tenemos estos servicios de limpieza:
         1. 🦷 Limpieza básica — 30 min — S/80
         2. 🦷 Limpieza profunda — 60 min — S/150
         3. 🦷 Limpieza + blanqueamiento — 90 min — S/250

         ¿Cuál te interesa?"

Cliente: "La básica, para mañana si hay"
Agente: [llama get_available_slots con service_id y fecha de mañana]
Agente: "Mañana viernes tenemos estos horarios:

         🌅 Mañana:
         1. 9:00 AM — Dra. Sofía
         2. 10:30 AM — Dra. Sofía
         3. 11:00 AM — Dr. Méndez

         🌇 Tarde:
         4. 2:00 PM — Dra. Sofía
         5. 3:30 PM — Dr. Méndez
         6. 5:00 PM — Dra. Sofía

         ¿Cuál te acomoda?"

Cliente: "El 2, a las 10:30"
Agente: "Perfecto, te confirmo:

         🦷 Limpieza básica
         👩‍⚕️ Dra. Sofía
         📅 Viernes 21 de marzo
         🕐 10:30 AM
         ⏱️ 30 minutos
         💰 S/80

         ¿Confirmo tu cita?"

Cliente: "Sí, dale"
Agente: [llama book_appointment]
Agente: "¡Listo! Tu cita está confirmada ✅
         Referencia: #APT-127

         Te enviaré un recordatorio mañana temprano.
         📍 Av. Javier Prado 1234, San Isidro

         ¡Te esperamos! 😊"
```

### Rescheduling
```
Cliente: "Hola, necesito cambiar mi cita de mañana"
Agente: [busca cita por teléfono del cliente]
Agente: "Encontré tu cita:
         🦷 Limpieza básica — Viernes 21/03 a las 10:30 AM
         Con: Dra. Sofía

         ¿Para cuándo te gustaría reprogramarla?"

Cliente: "¿Tienen el sábado en la tarde?"
Agente: [llama get_available_slots para el sábado]
Agente: "El sábado con la Dra. Sofía:
         🌇 Tarde:
         1. 2:00 PM
         2. 3:30 PM
         3. 5:00 PM

         ¿Cuál prefieres?"

Cliente: "3:30"
Agente: [llama reschedule_appointment]
Agente: "¡Listo! Cita reprogramada ✅

         🦷 Limpieza básica
         👩‍⚕️ Dra. Sofía
         📅 Sábado 22 de marzo
         🕐 3:30 PM

         ¡Nos vemos el sábado! 👋"
```

### Emergency Override
```
Cliente: "Hola me duele mucho una muela, necesito que me vean hoy 😭"
Agente: "¡Entiendo que estés con dolor! Vamos a buscar cómo atenderte hoy mismo.

         [consulta agenda de todos los proveedores para hoy]

         Encontré una opción:
         🚨 Hoy a las 12:30 PM con el Dr. Méndez
         (Es un espacio entre citas, puede ser una evaluación rápida de 20 min)

         ¿Te funciona?"

Cliente: "Sí, por favor!"
Agente: [llama book_appointment con horario de emergencia]
Agente: "¡Agendado! ✅

         🦷 Evaluación de emergencia
         👨‍⚕️ Dr. Méndez
         📅 Hoy, jueves 20 de marzo
         🕐 12:30 PM

         📍 Av. Javier Prado 1234, San Isidro
         Llega 5 minutos antes si puedes. ¡Ánimo! 💪"
```

### No Availability — Alternatives
```
Cliente: "Quiero cita para mañana con la Dra. Sofía"
Agente: [consulta disponibilidad]
Agente: "Mañana la Dra. Sofía tiene la agenda completa 😔

         Te puedo ofrecer:
         1. 📅 Pasado mañana (sábado) a las 9:00 o 11:00 con la Dra. Sofía
         2. 👨‍⚕️ Mañana con el Dr. Méndez a las 10:00 o 3:00
         3. 📝 Te anoto en lista de espera por si se abre un espacio mañana
         4. 🚶 Puedes venir sin cita mañana y te atendemos por orden de llegada

         ¿Qué prefieres?"
```

### Cancellation
```
Cliente: "Tengo que cancelar mi cita del sábado"
Agente: [busca cita]
Agente: "Sin problema, encontré tu cita:
         🦷 Limpieza básica — Sábado 22/03 a las 3:30 PM
         Con: Dra. Sofía

         ¿Confirmo la cancelación?"

Cliente: "Sí, cancela"
Agente: [llama cancel_appointment]
Agente: "Cita cancelada ✅
         Cuando quieras reagendar, aquí estamos. 👋"
```

### Late Cancellation (Within Policy Window)
```
Cliente: "Necesito cancelar mi cita de mañana a las 9"
Agente: [verifica política de cancelación — la cita es en menos de 24h]
Agente: "Tu cita es en menos de 24 horas:
         🦷 Limpieza profunda — Mañana viernes a las 9:00 AM

         Nuestra política permite cancelar sin cargo con más de 24h de anticipación.
         En este caso, ¿prefieres:
         1. 🔄 Reprogramar para otro día (sin cargo)
         2. ❌ Cancelar de todas formas

         ¿Qué prefieres?"

Cliente: "Mejor la reprogramo"
Agente: "¡Perfecto! ¿Para cuándo te gustaría?"
```

### Ambiguous Time Handling
```
Cliente: "Quiero cita para el martes a las 3"
Agente: "¿3 de la tarde, verdad? 🕐"

Cliente: "Sí"
Agente: [procede con 15:00]
```

### Past Date Handling
```
Cliente: "Quiero cita para el lunes 17"
Agente: "Ese lunes ya pasó 📅
         ¿Quisiste decir el próximo lunes 24 de marzo?"
```

### Holiday Handling
```
Cliente: "¿Tienen disponible el 1 de mayo?"
Agente: "El 1 de mayo estamos cerrados por Día del Trabajo 🏖️
         ¿Te agendo para el viernes 2 de mayo? Estos son los horarios disponibles:
         ..."
```

### Multiple Services Back-to-Back
```
Cliente: "Quiero corte y barba para el sábado"
Agente: [calcula duración combinada: 30min + 20min = 50min]
Agente: "¡Claro! Corte + barba (50 min total). El sábado tenemos:

         🌅 Mañana:
         1. 9:00 AM — Carlos
         2. 10:00 AM — Carlos

         🌇 Tarde:
         3. 2:00 PM — Carlos
         4. 4:00 PM — Carlos

         ¿Cuál te queda bien?"
```

### Business Owner: Daily Schedule View
```
Dueño: "¿Cómo está la agenda de hoy?"
Agente: [llama list_appointments para hoy, todos los proveedores]
Agente: "📋 Agenda de hoy — Jueves 20 de marzo

         👩‍⚕️ Dra. Sofía:
         • 9:00 — María López (Limpieza básica) ✅
         • 10:00 — Pedro García (Revisión) 📋
         • 11:30 — Ana Torres (Blanqueamiento) 📋
         • 2:00 — Luis Ramos (Limpieza profunda) 📋
         • 4:00 — ❌ Cancelada
         • 5:00 — Rosa Díaz (Revisión) 📋

         👨‍⚕️ Dr. Méndez:
         • 9:30 — Juan Pérez (Extracción) 📋
         • 11:00 — Carmen Silva (Limpieza básica) 📋
         • 3:00 — Libre
         • 4:30 — Ricardo Flores (Revisión) 📋

         Total: 9 citas programadas, 1 cancelada, 1 espacio libre"
```

### Double-Booking Prevention
```
[Dos clientes intentan reservar el mismo horario simultáneamente]

Cliente B: "Confirmo la cita de las 10:30"
Agente: [llama book_appointment — falla por conflicto]
Agente: "¡Ups! Ese horario acaba de ser reservado por otro paciente 😅

         El siguiente horario disponible con la Dra. Sofía es a las 11:00.
         ¿Te funciona?"
```

## Reminder Schedule

### 24-Hour Reminder
```
Hola [nombre] 👋 Te recordamos tu cita mañana:
🦷 [servicio] a las [hora]
👩‍⚕️ Con: [proveedor]
📍 [dirección]

¿Todo confirmado? Responde 'Sí' para confirmar o 'Cambiar' si necesitas reprogramar.
```

### 2-Hour Reminder
```
¡Hola! Tu cita es en 2 horas ⏰
🦷 [servicio] a las [hora]
👩‍⚕️ Con: [proveedor]
📍 [dirección]

¡Te esperamos!
```

### No-Show Follow-up (next day)
```
Hola [nombre], notamos que no pudiste asistir a tu cita de ayer.
¿Te gustaría reprogramarla? Estamos para ayudarte. 😊
```

## Configuration
- `APPOINTMENTS_DATABASE_URL` — PostgreSQL connection string for appointment data
- `APPOINTMENT_BUFFER` — Buffer time between appointments in minutes (default: 10)
- `APPOINTMENT_ADVANCE_DAYS` — How many days ahead customers can book (default: 30)
- `CANCELLATION_WINDOW_HOURS` — Free cancellation window in hours before appointment (default: 24)
- `BUSINESS_TIMEZONE` — Timezone for all scheduling (e.g., "America/Lima")
- `BUSINESS_ADDRESS` — Physical address to include in confirmations and reminders
- `WHATSAPP_API_URL` — WhatsApp Business API endpoint for sending reminders
- `WHATSAPP_API_TOKEN` — WhatsApp API authentication token
- `GOOGLE_CLIENT_ID` — Google OAuth2 Client ID (for Google Calendar sync)
- `GOOGLE_CLIENT_SECRET` — Google OAuth2 Client Secret
- `GOOGLE_REDIRECT_URI` — OAuth2 callback URL
- `REMINDER_HOURS_BEFORE` — Comma-separated hours before appointment to send reminders (default: "24,2")
- `WAITLIST_ENABLED` — Enable waitlist when no slots available (default: true)
- `NO_SHOW_THRESHOLD` — Number of no-shows before flagging customer (default: 3)
- `WALK_IN_ENABLED` — Whether the business accepts walk-ins (default: false)
- `LATE_CANCELLATION_FEE` — Fee for cancelling within the window, 0 = no fee (default: 0)

## Error Handling & Edge Cases
- **Double-booking attempt:** If a race condition causes two customers to book the same slot, detect on write and offer the second customer the next available slot. Never silently overbook.
- **Past-date booking:** If customer asks for a date that already passed, ask: "Esa fecha ya pasó. ¿Quisiste decir [próxima fecha similar]?"
- **Ambiguous time:** "A las 3" → Ask: "¿3 de la tarde, verdad?" Don't assume AM/PM unless context is clear.
- **Provider on leave:** If a provider is marked unavailable for a date range, don't show their slots. Offer alternatives.
- **Holiday closures:** Respect configured holidays. If customer tries to book on a holiday: "Ese día estamos cerrados por [motivo]. ¿Te agendo para el [siguiente día hábil]?"
- **Multiple services:** If customer wants to book two services back-to-back, combine the durations and find a slot that fits the total time.
- **Walk-in overflow:** If schedule is full but business accepts walk-ins, mention: "La agenda está llena, pero puedes venir sin cita y te atendemos por orden de llegada."
- **Timezone edge cases:** All dates/times stored in UTC, displayed in `BUSINESS_TIMEZONE`. Never expose UTC to customers.
- **Reminder delivery failure:** If a WhatsApp reminder fails to deliver, log the failure but don't retry excessively. The 2-hour reminder serves as backup.
- **External calendar conflict:** If a synced calendar event blocks a slot that was previously available, inform the customer and offer the next available time.
- **OAuth token expiry:** If Google Calendar token expires during sync, trigger re-authorization flow.
- **Customer not found:** If we can't match the customer's phone number, proceed with booking using the info they provide — don't block them.
- **Outside business hours:** If customer asks for a time outside working hours: "Ese horario está fuera de nuestro horario de atención. Atendemos de [hora] a [hora]. ¿Te busco un horario disponible?"
