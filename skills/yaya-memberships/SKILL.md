# yaya-memberships — Recurring Subscription & Membership Management

## Description
Full-featured membership and subscription management skill for gyms, academies, coworking spaces, clubs, and any recurring-fee business. Handles plan creation, member enrollment, renewals, payment collection via Yape/Plin, freezes, cancellations, class packs, attendance tracking, churn prevention, and revenue forecasting. Designed for the 15-25K gyms and 15-25K language academies in Peru where memberships are tracked in notebooks and WhatsApp groups, and where the personal relationship with the owner is the #1 retention driver. Works in Spanish as the primary language with natural voice-note understanding.

## When to Use
- Business owner wants to create or modify membership plans ("quiero crear un plan de S/149 al mes")
- A new member needs to be enrolled ("inscribe a Juan Pérez en plan Premium")
- Member asks about their membership status, expiration, or remaining classes
- Membership is expiring and needs renewal reminders sent via WhatsApp
- Member wants to freeze/pause their membership ("Juan viaja 2 semanas, congela su membresía")
- Member wants to cancel, upgrade, or downgrade their plan
- Business owner asks about revenue, churn, MRR, or member activity
- A member hasn't attended in 2+ weeks and needs proactive outreach
- Business owner wants to re-engage expired members ("manda mensaje a los que no renovaron")
- Voice note: "oye el Juan que viene los martes no ha pagado este mes, mándale un mensaje"
- Someone wants to try with a free trial ("dale 1 semana gratis a María")
- Family or corporate group enrollment is needed
- Business owner wants to sell class/session packs ("10 clases por S/200")

## Capabilities
- **Plan Management** — Define and modify membership plans: monthly, quarterly, annual, class packs. Support tiered pricing (Basic S/99/mo, Premium S/149/mo, Annual S/999/yr)
- **Member Enrollment** — Enroll members conversationally: "Inscribe a Juan Pérez en plan Premium, empieza hoy." Captures name, phone, plan, start date, payment method
- **Renewal Tracking** — Auto-detect memberships expiring in 3, 7, and 1 day(s). Send WhatsApp reminders with payment links or Yape instructions
- **Payment Collection** — Integrate with yaya-payments for Yape/Plin receipt verification. Track who's paid, who hasn't, and send targeted reminders
- **Freeze/Pause** — Freeze memberships for a configurable period (vacation, injury, travel). Automatically extend end date by freeze duration
- **Cancellation & Retention** — Handle cancellations with optional retention offers (1 month free, plan downgrade, freeze instead). Track cancellation reasons
- **Class/Session Packs** — Sell packs of N sessions (e.g., "10 clases por S/200"). Track remaining sessions, alert when running low (2 left)
- **Attendance Tracking** — Record attendance via WhatsApp check-in ("registra asistencia de Juan") or business owner confirmation. Track frequency patterns
- **Churn Alerts** — Proactive alerts when active members haven't attended in 2+ weeks. Suggest outreach messages for the business owner
- **Revenue Forecasting** — MRR (Monthly Recurring Revenue), expected renewals this month, churn rate, projected revenue. Compare month-over-month
- **Trial Management** — Create free trial periods (1 day, 1 week, 1 month). Auto-convert to paid plan or send conversion message at trial end
- **Family/Group Plans** — Family discounts (e.g., 20% off second member), corporate group enrollment with bulk pricing
- **Upgrade/Downgrade** — Change plan mid-cycle with automatic proration. Calculate credit or charge difference
- **Expired Member Re-engagement** — Generate list of members who didn't renew. Send personalized WhatsApp re-engagement messages with special offers
- **Member Stats** — Most active members, least active, payment history, lifetime value, attendance trends

## MCP Tools Required
- `postgres-mcp` — Primary: membership plans, enrollments, attendance records, session pack balances, freeze history, churn analytics
- `crm-mcp` — Member profiles, contact info, interaction history, segmentation (active, at-risk, churned)
- `whatsapp-mcp` — Renewal reminders, payment reminders, churn outreach, re-engagement campaigns, trial conversion messages
- `erpnext-mcp` — Revenue tracking, payment entries, financial reporting, MRR calculations

## Membership Lifecycle

```
1. DISCOVERY
   → Customer asks about plans or walks in
   → Show plan options with pricing

2. TRIAL (optional)
   → Create free trial (1 day / 1 week / 1 month)
   → Track attendance during trial
   → Send conversion message before trial ends

3. ENROLLMENT
   → Select plan + start date
   → Collect first payment (Yape/Plin/cash)
   → Verify via yaya-payments
   → Create membership record

4. ACTIVE MEMBERSHIP
   → Track attendance
   → Monitor engagement (churn alerts if inactive 2+ weeks)
   → Process monthly payments

5. RENEWAL
   → 7-day reminder → 3-day reminder → 1-day reminder
   → Payment verification
   → Auto-extend if paid

6. FREEZE (optional)
   → Member requests pause
   → Extend end date by freeze duration
   → Send "welcome back" message when freeze ends

7. UPGRADE/DOWNGRADE
   → Calculate proration
   → Switch plan mid-cycle

8. CANCELLATION
   → Retention offer (discount, freeze, downgrade)
   → If confirmed, mark as cancelled
   → Log cancellation reason

9. RE-ENGAGEMENT
   → 30-day post-cancellation: "¿Te gustaría volver?"
   → Special return offer
```

## Plan Types

### Recurring Plans
| Plan | Price | Billing | Typical Business |
|------|-------|---------|------------------|
| Básico | S/80-99/mo | Monthly | Traditional gyms |
| Premium | S/149-199/mo | Monthly | Functional/CrossFit gyms |
| Full Access | S/200-300/mo | Monthly | Premium gyms (Miraflores/San Isidro) |
| Trimestral | S/249-399/3mo | Quarterly | Academies, gyms |
| Anual | S/799-999/yr | Yearly | Loyalty discount |
| Inglés Básico | S/200-300/mo | Monthly | English academies |
| Inglés Intensivo | S/400-500/mo | Monthly | English academies |
| Coworking Flex | S/150-250/mo | Monthly | Coworking spaces |
| Coworking Dedicado | S/350-500/mo | Monthly | Coworking spaces |

### Session Packs
| Pack | Price | Sessions | Validity |
|------|-------|----------|----------|
| Pack 5 | S/100-120 | 5 classes | 30 days |
| Pack 10 | S/180-200 | 10 classes | 60 days |
| Pack 20 | S/320-350 | 20 classes | 90 days |
| Clase suelta | S/25-35 | 1 class | Same day |

## Behavior Guidelines

### Language & Tone
- **Primary language: Spanish** — All member-facing messages in Spanish. Use Peruvian Spanish naturally ("causa", "pe", "ya fue")
- **Warm and personal** — Gym/academy owners know their members by name. Mirror that warmth: "¡Hola Juan! ¿Cómo va el entrenamiento?"
- **Motivational on attendance** — Celebrate streaks, encourage after absences. Never guilt-trip.
- **Use emojis purposefully** — 💪 for gym, 📚 for academy, ✅ for confirmations, ⚠️ for expiring, 🏆 for milestones

### Enrollment & Payment
- **Always confirm enrollment details before creating:** plan, start date, price, payment method
- **Payment is king** — In Peru, Yape handles 60%+ of gym payments. Always offer Yape/Plin first, cash as fallback
- **Never store payment credentials.** Only process screenshots/receipts via yaya-payments
- **Track partial payments** — Some members pay in 2 parts. Track both and only mark as "paid" when complete
- **Grace period** — Allow 3-day grace period after expiration before suspending access. Configurable per business

### Retention & Churn
- **Churn is the #1 problem.** 30-40% of gym members don't renew after month 3. The skill's job is to fight this.
- **Personal touch matters more than discounts** — A WhatsApp message from "the gym" saying "te extrañamos" works better than 10% off
- **Track attendance patterns** — If a member who came 4x/week drops to 1x/week, that's a churn signal. Alert the owner BEFORE they cancel
- **Cancellation is not failure** — Make it easy. Never guilt. But always offer alternatives: freeze, downgrade, pause
- **Re-engagement windows** — Best chance to win back: 7 days after expiry, 30 days, 90 days. After 90 days, treat as new lead

### Freezes & Exceptions
- **Freeze is not cancellation** — Clearly explain: "Tu membresía se pausa, no se cancela. Cuando vuelvas, retomas donde quedaste"
- **Automatic unfreeze** — When freeze period ends, send "welcome back" message and resume billing cycle
- **Medical/emergency freezes** — Be extra empathetic. Don't enforce minimum freeze periods for medical reasons
- **Max freeze duration** — Configurable, default 30 days per year. Track freeze days used

### Privacy & Data
- **Never share member details with other members** — If someone asks "¿viene Juan a las 7?", don't confirm or deny
- **Payment status is private** — Only the business owner and the member themselves can see payment status
- **Member data belongs to the business** — Export capability for business owners

## Example Flows

### Creating a Membership Plan
```
Dueño: "Quiero crear un plan nuevo para CrossFit"
Agente: "¡Dale! Necesito estos datos para el plan:

         1. 📝 Nombre del plan
         2. 💰 Precio mensual
         3. 📋 ¿Qué incluye? (clases ilimitadas, horarios, etc.)

         ¿Cómo le ponemos?"

Dueño: "Plan CrossFit Elite, S/250 al mes, clases ilimitadas de lunes a sábado"
Agente: [crea plan en postgres-mcp]
Agente: "Plan creado ✅

         💪 CrossFit Elite
         💰 S/250.00/mes
         📋 Clases ilimitadas, lunes a sábado

         ¿Quieres que también cree un plan trimestral o anual con descuento?"

Dueño: "Sí, trimestral con 10% de descuento"
Agente: [crea plan trimestral]
Agente: "Listo ✅

         💪 CrossFit Elite Trimestral
         💰 S/675.00/trimestre (ahorro de S/75)
         📋 Mismos beneficios, 3 meses

         Ya puedes inscribir miembros en estos planes."
```

### Enrolling a New Member
```
Dueño: "Inscribe a Juan Pérez en plan Premium, empieza hoy"
Agente: "Registrando a Juan Pérez:

         👤 Juan Pérez
         💪 Plan Premium — S/149.00/mes
         📅 Inicio: hoy, 21 de marzo 2026
         📅 Vence: 21 de abril 2026
         💳 ¿Cómo pagó? (Yape/Plin/efectivo)"

Dueño: "Yape, ya me mandó el comprobante"
Agente: [verifica pago via yaya-payments, crea membresía en postgres-mcp, crea contacto en crm-mcp]
Agente: "¡Inscripción completa! ✅

         👤 Juan Pérez
         💪 Plan Premium
         📅 21/03/2026 → 21/04/2026
         💰 S/149.00 — Pagado (Yape) ✅

         Le envío mensaje de bienvenida por WhatsApp. 📱
         Le recordaré la renovación el 14 de abril."
```

### Renewal Reminder Flow
```
[7 días antes del vencimiento — automático]
WhatsApp → Juan: "¡Hola Juan! 👋 Tu membresía Premium vence el 21 de abril.

         💪 Plan Premium — S/149.00/mes
         📅 Vence: 21/04/2026

         Para renovar, envía tu Yape a:
         💜 999-888-777 (Gym FitPro)
         💰 S/149.00

         ¡Mándanos el comprobante por aquí y listo! ✅"

[3 días antes — si no ha pagado]
WhatsApp → Juan: "Hola Juan 💪 Tu membresía vence en 3 días.
         ¿Todo bien? Si necesitas pausar o cambiar de plan,
         cuéntanos y lo resolvemos. 🤝"

[Día de vencimiento — si no ha pagado]
WhatsApp → Juan: "Juan, tu membresía vence hoy 📅
         Renueva con Yape y sigue entrenando sin parar 💪

         ¿Necesitas ayuda con algo?"
```

### Freeze/Pause Request
```
Dueño: "Juan quiere congelar su membresía por 2 semanas, se va de viaje"
Agente: [consulta membresía de Juan]
Agente: "Membresía de Juan Pérez:
         💪 Plan Premium — vence 21/04/2026

         ¿Congelo por 2 semanas a partir de hoy?
         Su nueva fecha de vencimiento sería: 5 de mayo 2026"

Dueño: "Sí, dale"
Agente: [congela membresía, actualiza fecha de vencimiento]
Agente: "Membresía congelada ❄️

         👤 Juan Pérez
         ❄️ Congelada: 21/03 → 04/04/2026 (14 días)
         📅 Nueva fecha de vencimiento: 05/05/2026

         Le envío un mensaje confirmando la pausa.
         El 4 de abril le mando un '¡Bienvenido de vuelta!' 💪"
```

### Cancellation with Retention
```
Miembro: "Quiero cancelar mi membresía"
Agente: "Entiendo, Juan. Antes de cancelar, ¿puedo preguntarte
         qué pasó? Nos ayuda a mejorar 🙏"

Miembro: "Ya no tengo tiempo, cambié de horario en el trabajo"
Agente: "Tiene sentido. Te cuento algunas opciones:

         1. ❄️ Congelar 1 mes gratis — vuelves cuando puedas
         2. 📉 Bajar a Plan Básico (S/99/mo) — menos clases, más flexible
         3. 🎟️ Pack de 10 clases (S/200) — vienes cuando puedas, sin compromiso mensual
         4. ❌ Cancelar definitivamente

         ¿Cuál te sirve más?"

Miembro: "El pack de 10 clases suena bien"
Agente: [cancela membresía mensual, crea pack de 10 sesiones]
Agente: "¡Perfecto! Cambié tu membresía:

         ❌ Plan Premium cancelado
         🎟️ Pack 10 clases activado — S/200
         📅 Válido hasta: 21/05/2026

         Vienes cuando quieras, sin presión. ¡Nos vemos! 💪"
```

### Class Pack & Session Tracking
```
Dueño: "Véndele 10 clases de yoga a María por S/200"
Agente: [crea pack de sesiones]
Agente: "Pack creado ✅

         👤 María García
         🧘 Pack 10 clases de Yoga — S/200
         📅 Válido hasta: 21/05/2026
         🎟️ Clases restantes: 10

         ¿Pagó por Yape o efectivo?"

[Después de una clase]
Dueño: "Registra asistencia de María"
Agente: [descuenta 1 sesión]
Agente: "Asistencia registrada ✅
         🧘 María García — Yoga
         🎟️ Clases restantes: 7 de 10

         A este ritmo le quedan para ~2 semanas más."

[Cuando quedan 2 clases]
WhatsApp → María: "¡Hola María! 🧘 Te quedan 2 clases de tu pack.
         ¿Quieres renovar? Pack 10 clases por S/200 💪
         O si prefieres, tenemos membresía mensual ilimitada
         desde S/149/mes."
```

### Attendance & Churn Alert
```
[Sistema detecta que Juan no asiste hace 2 semanas]
Agente → Dueño: "⚠️ Alerta de inactividad:

         👤 Juan Pérez — Plan Premium
         📅 Última asistencia: hace 15 días (6 de marzo)
         📊 Antes venía: 4 veces/semana
         💰 Membresía vence: 21/04/2026

         Esto es señal de posible abandono.
         ¿Le mando un mensaje? Sugiero:

         'Hola Juan! 💪 Te extrañamos en el gym.
          ¿Todo bien? Si necesitas ajustar horarios
          o tu plan, cuéntanos. ¡Acá te esperamos!'"

Dueño: "Sí, mándale eso"
Agente: [envía WhatsApp via whatsapp-mcp]
Agente: "Mensaje enviado ✅ Te aviso si responde."
```

### Voice Note Processing
```
Dueño: [envía audio] "Oye el Juan que viene los martes no ha pagado
        este mes, mándale un mensaje"

Agente: [identifica: Juan, martes, pago pendiente]
Agente: [consulta postgres-mcp — encuentra Juan Pérez, plan Premium,
         pago de marzo pendiente, asiste martes y jueves]
Agente: "Encontré a Juan Pérez — Plan Premium (S/149/mo)
         📅 Pago de marzo: pendiente ⚠️
         📅 Venció: 21/03/2026

         Le mando recordatorio de pago por WhatsApp:
         'Hola Juan 👋 Tu membresía de marzo está pendiente
          de pago (S/149). Puedes enviar tu Yape a 999-888-777.
          ¡Mándanos el comprobante por aquí! 💪'

         ¿Lo envío?"

Dueño: [audio] "Sí dale"
Agente: [envía WhatsApp]
Agente: "Enviado ✅"
```

### Revenue Dashboard
```
Dueño: "¿Cómo va el negocio este mes?"
Agente: [consulta postgres-mcp + erpnext-mcp]
Agente: "📊 Resumen de membresías — Marzo 2026

         💰 MRR (Ingreso Mensual Recurrente): S/12,450
         📈 vs febrero: +8.2% (+S/945)

         👥 Miembros activos: 89
         • Plan Básico: 32 (S/3,168)
         • Plan Premium: 41 (S/6,109)
         • Plan Anual: 8 (S/666/mo equivalente)
         • Packs de clases: 8 (S/1,600)

         📅 Renovaciones este mes: 67
         • Renovados: 52 (77.6%) ✅
         • Pendientes: 11 ⚠️
         • No renovaron: 4 ❌

         📉 Churn rate: 5.9% (meta: <5%)
         ⚠️ En riesgo (sin asistir 2+ sem): 6 miembros
         🆕 Nuevos este mes: 12

         ¿Quieres ver detalle de los pendientes o los que están en riesgo?"
```

### Trial Management
```
Dueño: "Dale 1 semana gratis a María para que pruebe"
Agente: [crea trial en postgres-mcp, contacto en crm-mcp]
Agente: "Trial creado ✅

         👤 María López
         🆓 Prueba gratis: 1 semana
         📅 21/03/2026 → 28/03/2026
         💪 Acceso completo (igual que Plan Premium)

         Le envío mensaje de bienvenida:
         '¡Hola María! 🎉 Tu semana de prueba gratis está activa.
          Puedes venir cuando quieras hasta el 28 de marzo.
          ¡Te esperamos! 💪'

         El 26 de marzo le mando mensaje de conversión."

[2 días antes de que termine el trial]
WhatsApp → María: "¡Hola María! 💪 Tu semana de prueba termina el viernes.
         ¿Qué tal la experiencia?

         Si quieres seguir, tenemos:
         1. 💪 Plan Básico — S/99/mes
         2. 🔥 Plan Premium — S/149/mes (más horarios)
         3. 📅 Plan Anual — S/999/año (ahorra S/789)

         ¿Te interesa alguno?"
```

### Family/Group Plan
```
Dueño: "La familia Rodríguez quiere inscribirse: papá, mamá y el hijo"
Agente: "¡Genial! Con plan familiar aplica 20% de descuento
         a partir del segundo miembro:

         👤 Papá — Plan Premium: S/149.00
         👤 Mamá — Plan Premium: S/119.20 (20% desc)
         👤 Hijo — Plan Básico: S/79.20 (20% desc)

         💰 Total familiar: S/347.40/mes
         💰 Ahorro: S/99.60/mes vs individual

         ¿Confirmo la inscripción familiar?"

Dueño: "Sí, todos empiezan hoy"
Agente: [crea grupo familiar, 3 membresías vinculadas]
Agente: "Familia Rodríguez inscrita ✅

         👨‍👩‍👦 Grupo familiar: Rodríguez
         📅 Inicio: 21/03/2026
         💰 S/347.40/mes (ahorro 22%)

         La renovación de los 3 es el mismo día.
         Les envío bienvenida por WhatsApp."
```

### Upgrade/Downgrade Mid-Cycle
```
Miembro: "Quiero subir a Premium, estoy en Básico"
Agente: [consulta membresía actual]
Agente: "Tu plan actual:
         💪 Plan Básico — S/99/mes
         📅 Vence: 5/04/2026 (quedan 15 días)

         Si subes a Premium (S/149/mes):
         💰 Diferencia proporcional: S/25.00 (15 días restantes)
         📅 Tu plan Premium empieza hoy
         📅 Siguiente cobro completo: 5 de abril (S/149)

         ¿Confirmo el upgrade? Puedes pagar los S/25 por Yape 💜"

Miembro: "Dale, te mando el Yape"
Agente: [espera comprobante, verifica via yaya-payments]
Agente: "¡Upgrade confirmado! 🔥

         💪 Plan Premium activo
         📅 Desde hoy hasta 05/04/2026
         💰 S/25.00 pagado ✅

         ¡Ahora tienes acceso a todos los horarios! 💪"
```

### Expired Member Re-engagement
```
Dueño: "Manda mensaje a todos los que no renovaron este mes"
Agente: [consulta postgres-mcp — 12 miembros no renovaron en marzo]
Agente: "Encontré 12 miembros que no renovaron en marzo:

         📋 Lista:
         1. Carlos Ruiz — Premium (S/149) — venció 3/03
         2. Ana Torres — Básico (S/99) — venció 7/03
         3. Pedro Gómez — Premium (S/149) — venció 10/03
         ... y 9 más

         💰 Ingreso potencial si regresan: S/1,547/mes

         ¿Les envío un mensaje de re-engagement? Sugiero:
         'Hola [nombre] 👋 Te extrañamos en [gym].
          Tenemos una promo especial para ti: vuelve este
          mes y tu primera semana es GRATIS 🎉
          ¿Te interesa? Escríbenos!'

         ¿Lo envío a los 12 o quieres ajustar el mensaje?"

Dueño: "Sí, mándalo a todos"
Agente: [envía 12 mensajes via whatsapp-mcp]
Agente: "Enviados 12 mensajes de re-engagement ✅
         Te aviso cuando respondan."
```

### Member Stats Query
```
Dueño: "¿Quiénes son mis mejores miembros?"
Agente: [consulta postgres-mcp + crm-mcp]
Agente: "🏆 Top 5 miembros más activos — Marzo 2026

         1. 🥇 María García — 22 asistencias, 14 meses seguidos
         2. 🥈 Carlos Ruiz — 20 asistencias, 8 meses seguidos
         3. 🥉 Ana Torres — 18 asistencias, 11 meses seguidos
         4. 💪 Pedro Gómez — 16 asistencias, 6 meses seguidos
         5. 💪 Luis Ramos — 15 asistencias, 9 meses seguidos

         😴 Miembros menos activos (activos pero pocas visitas):
         1. Rosa Díaz — 2 asistencias este mes (pagó Premium)
         2. Jorge Flores — 3 asistencias (pagó Premium)
         3. Carmen Silva — 3 asistencias (pagó Básico)

         ⚠️ Rosa y Jorge son candidatos a cancelar.
         ¿Les mando un mensaje motivacional?"
```

## Churn Risk Scoring

```
Alto Riesgo (🔴):
  - No asiste en 14+ días, AND
  - Tenía frecuencia regular previa (3+ veces/semana), OR
  - Membresía vence en 7 días y no ha renovado

Riesgo Medio (🟡):
  - Frecuencia bajó 50%+ vs promedio de últimas 4 semanas, OR
  - Membresía vence en 14 días y no ha renovado, OR
  - Pidió información sobre cancelación o congelamiento

Riesgo Bajo (🟢):
  - Asistencia estable o creciente
  - Pagos al día
  - Interactúa con el negocio (pregunta horarios, etc.)
```

## Renewal Reminder Schedule

```
Día -7:  📱 "Tu membresía vence en 1 semana" + instrucciones de pago
Día -3:  📱 "Faltan 3 días" + opciones si necesita cambiar plan
Día -1:  📱 "Vence mañana" + último recordatorio
Día 0:   📱 "Venció hoy" + gracia de 3 días
Día +3:  📱 "Tu membresía expiró" + oferta de reactivación
Día +7:  📱 "Te extrañamos" + oferta especial
Día +30: 📱 Re-engagement con promoción
Día +90: 📱 Último intento, tratar como nuevo lead
```

## Configuration
- `MEMBERSHIP_GRACE_PERIOD_DAYS` — Days after expiry before suspending access (default: 3)
- `MEMBERSHIP_RENEWAL_REMINDERS` — Days before expiry to send reminders (default: "7,3,1")
- `MEMBERSHIP_MAX_FREEZE_DAYS` — Maximum freeze days per year (default: 30)
- `MEMBERSHIP_MIN_FREEZE_DAYS` — Minimum freeze duration (default: 7)
- `MEMBERSHIP_FAMILY_DISCOUNT` — Percentage discount for additional family members (default: 20)
- `MEMBERSHIP_PRORATION_ENABLED` — Enable mid-cycle proration for upgrades/downgrades (default: true)
- `MEMBERSHIP_TRIAL_DEFAULT_DAYS` — Default trial period in days (default: 7)
- `MEMBERSHIP_CHURN_ALERT_DAYS` — Days of inactivity before churn alert (default: 14)
- `MEMBERSHIP_SESSION_LOW_ALERT` — Alert when session pack has this many remaining (default: 2)
- `MEMBERSHIP_REENGAGEMENT_DAYS` — Days after expiry for re-engagement messages (default: "7,30,90")
- `MEMBERSHIP_RETENTION_OFFER_ENABLED` — Show retention offers on cancellation (default: true)
- `MEMBERSHIP_AUTO_RENEW` — Auto-renew if payment is confirmed (default: false)
- `MEMBERSHIP_PAYMENT_METHODS` — Accepted payment methods (default: "yape,plin,cash")
- `MEMBERSHIP_CURRENCY` — Currency code (default: "PEN")
- `BUSINESS_YAPE_NUMBER` — Business Yape number for payment instructions
- `BUSINESS_TIMEZONE` — Timezone (default: "America/Lima")

## Error Handling & Edge Cases
- **Duplicate enrollment:** If a member already has an active plan and someone tries to enroll them again, flag it: "Juan ya tiene Plan Premium activo (vence 21/04). ¿Quieres renovar anticipadamente o cambiar de plan?"
- **Payment mismatch:** If the Yape amount doesn't match the plan price, handle via yaya-payments partial payment flow. Don't block enrollment for minor rounding differences.
- **Freeze during freeze:** If a member tries to freeze an already-frozen membership, explain: "La membresía de Juan ya está congelada hasta el 04/04. ¿Quieres extender el congelamiento?"
- **Freeze exceeds annual limit:** If freeze request would exceed `MAX_FREEZE_DAYS`, inform: "Juan ya usó 20 de sus 30 días de congelamiento este año. Solo le quedan 10 días disponibles."
- **Upgrade with pending payment:** If a member wants to upgrade but hasn't paid the current month, require current payment first before processing the upgrade.
- **Expired session pack:** If a session pack's validity period expired with remaining sessions, offer to extend or create a new pack. Don't silently delete unused sessions.
- **Bulk enrollment errors:** If enrolling a family/group and one member fails (e.g., duplicate), process the others and report the specific failure.
- **Voice note ambiguity:** If a voice note mentions "Juan" but there are multiple Juans, ask: "Tengo a Juan Pérez (Premium) y Juan García (Básico). ¿A cuál te refieres?"
- **Off-hours messages:** If a member sends a message outside business hours, acknowledge and queue: "¡Recibido! Te respondemos mañana temprano. 🌙"
- **WhatsApp delivery failure:** If a reminder fails to deliver, log the failure and suggest the owner contact the member directly.
- **Currency rounding:** Always round to 2 decimal places for PEN. Show prices with S/ prefix.
- **Mid-month enrollment:** If a member enrolls mid-month, their cycle starts from enrollment date, not the 1st of the month. Calculate prorated amounts from enrollment date.
