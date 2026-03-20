# yaya-followup — Proactive Outreach & Follow-ups

## Description
Proactive customer engagement skill that initiates conversations instead of waiting for them. Handles abandoned conversation recovery, payment reminders, restock notifications, birthday/anniversary messages, and post-purchase satisfaction checks. Turns the agent from reactive to proactive — the difference between a chatbot and a sales team member.

## When to Use
- A conversation went cold with an unresolved intent (abandoned cart/inquiry)
- A pending order has been waiting for payment beyond the configured window
- An out-of-stock item a customer asked about is back in stock
- A customer's birthday or anniversary is coming up (from CRM data)
- A configurable period has passed since a purchase (satisfaction check)
- A scheduled follow-up reminder triggers via OpenClaw cron/heartbeat
- Payment installment is due
- Appointment reminder needs to be sent (coordinates with yaya-appointments)

## Capabilities
- **Abandoned Conversation Recovery** — Re-engage customers who showed interest but didn't complete an action
- **Payment Reminders** — Gentle, escalating reminders for unpaid orders
- **Restock Notifications** — Alert customers when items they asked about are available again
- **Birthday/Anniversary Messages** — Personalized greetings with optional promotional offers
- **Post-Purchase Check-ins** — "¿Cómo te fue con tu compra?" satisfaction surveys
- **Appointment Reminders** — Pre-appointment notifications (coordinates with yaya-appointments)
- **Installment Reminders** — For businesses offering payment plans
- **Re-engagement Campaigns** — Reach out to dormant customers with relevant offers
- **Smart Timing** — Send messages at optimal times based on customer's past interaction patterns
- **Frequency Capping** — Never spam a customer. Respect cooldown periods between outreach messages.

## MCP Tools Required
- `erpnext-mcp` — Order status, stock levels, product catalog, payment status
- `crm-mcp` — Customer data, birthdays, purchase history, interaction log, preferences, opt-out status
- `postgres-mcp` — Follow-up queue, scheduling, delivery tracking, customer engagement patterns

## Scheduling via OpenClaw Cron

Follow-up jobs are managed via OpenClaw's cron/heartbeat system:

```yaml
# Example cron schedule
followup_jobs:
  payment_reminders:
    schedule: "0 10 * * *"       # Daily at 10 AM
    description: "Check for unpaid orders older than 24h"

  abandoned_conversations:
    schedule: "0 11,16 * * *"    # Twice daily: 11 AM and 4 PM
    description: "Re-engage conversations abandoned in last 24h"

  restock_notifications:
    schedule: "*/30 * * * *"     # Every 30 minutes
    description: "Check restocked items against customer wishlists"

  birthday_messages:
    schedule: "0 8 * * *"        # Daily at 8 AM
    description: "Send birthday greetings for today's birthdays"

  satisfaction_checks:
    schedule: "0 14 * * *"       # Daily at 2 PM
    description: "Check-in on purchases delivered 3 days ago"

  dormant_reengagement:
    schedule: "0 10 * * 1"       # Mondays at 10 AM
    description: "Reach out to customers inactive for 30+ days"
```

## Behavior Guidelines
- **Never feel like spam.** Every outreach must provide value to the customer. If there's nothing useful to say, don't send anything.
- **Respect opt-outs immediately.** If a customer says "no me escriban más" or similar, mark them as opted-out in CRM and stop all proactive outreach.
- **Escalating tone for payment reminders:**
  - Reminder 1 (24h): Friendly, informational
  - Reminder 2 (48h): Gentle nudge with convenience
  - Reminder 3 (72h): Direct, mention order may be cancelled
  - After 3 reminders: Escalate to business owner, stop messaging customer
- **Smart timing:** Don't send messages before 8 AM or after 9 PM in the customer's timezone. Prefer times when the customer has historically been most responsive.
- **Personalization required.** Never send generic messages. Reference the specific product, order, or conversation.
- **Cooldown periods:**
  - Maximum 1 proactive message per customer per day
  - Minimum 4 hours between any two messages to the same customer
  - After a completed interaction, wait at least 24 hours before next outreach
- **Don't follow up on escalated conversations.** If a conversation was escalated to a human, don't send automated follow-ups — the human owns that relationship now.
- **Natural language, not templates.** Messages should feel like they're from a person, not a system.

## Follow-up Queue Priority
```
Priority 1 (immediate): Payment confirmation needed for processing orders
Priority 2 (same day): Abandoned conversations with high-value items
Priority 3 (next day): Post-purchase satisfaction checks
Priority 4 (weekly): Restock notifications, dormant customer re-engagement
Priority 5 (date-based): Birthday/anniversary messages
```

## Example Flows

### Abandoned Conversation Recovery
```
[24 hours after conversation went cold]

Agente: "Hola María 👋 Ayer estuvimos viendo las zapatillas Air Max
         talla 38. ¿Todavía te interesan?

         Por cierto, solo nos quedan 2 pares en esa talla 😊"

[If customer responds, continue sales flow normally]
[If no response after 48h, no more follow-ups on this topic]
```

### Payment Reminder Sequence
```
[Reminder 1 — 24 hours after order]
Agente: "Hola Carlos 👋 Te escribo por tu pedido #1234
         (Air Max 90 — S/299).

         Cuando puedas, el pago lo puedes hacer por:
         💜 Yape al 938-438-401
         🏦 BCP cuenta 123-456-789

         ¡Cualquier duda me avisas! 😊"

[Reminder 2 — 48 hours]
Agente: "Hola Carlos, solo te recuerdo que tu pedido #1234
         sigue pendiente de pago (S/299).

         Lo tenemos separado para ti. ¿Todo bien?
         ¿Necesitas ayuda con el pago? 🙏"

[Reminder 3 — 72 hours]
Agente: "Hola Carlos, tu pedido #1234 lleva 3 días pendiente
         de pago. Si no recibimos el pago hoy,
         lamentablemente tendremos que liberar el stock.

         Si ya pagaste, envíame el comprobante y lo verifico
         al toque 👍"

[After Reminder 3 — escalate to business owner, stop messaging]
```

### Restock Notification
```
Agente: "Hola Ana 🎉 ¡Buenas noticias!

         Las sandalias Havaianas talla 37 que preguntaste
         la semana pasada ya están disponibles.

         💰 S/49 — Solo llegaron 5 pares.

         ¿Te separo un par? 😊"
```

### Birthday Message
```
Agente: "¡Feliz cumpleaños, Laura! 🎂🎉

         De parte de todo el equipo de [Negocio], te deseamos
         un día increíble.

         Como regalo, tienes 15% de descuento en tu
         próxima compra. Solo menciona este mensaje 💝

         Válido hasta el [fecha]."
```

### Post-Purchase Satisfaction Check
```
[3 days after delivery]
Agente: "Hola Pedro 👋 ¿Cómo te fueron las zapatillas
         que compraste?

         Queremos asegurarnos de que todo esté perfecto.
         Si tienes algún problema, estoy aquí para ayudarte 😊"

[If positive response → ask for review/referral]
[If negative response → trigger yaya-escalation]
```

### Dormant Customer Re-engagement
```
[30+ days without interaction]
Agente: "Hola Sofía 👋 ¡Hace tiempo que no te vemos por aquí!

         Llegaron cosas nuevas que creo te van a gustar
         (basándome en lo que compraste antes):

         👟 Nike Revolution 7 — S/219
         👜 Mochila Nike Heritage — S/89

         ¿Te interesa algo? 😊"
```

## Configuration
- `FOLLOWUP_PAYMENT_REMINDER_HOURS` — Hours between payment reminders (default: "24,48,72")
- `FOLLOWUP_ABANDONED_HOURS` — Hours after which an unresolved conversation is considered abandoned (default: 24)
- `FOLLOWUP_SATISFACTION_DAYS` — Days after purchase to send satisfaction check (default: 3)
- `FOLLOWUP_DORMANT_DAYS` — Days of inactivity before customer is considered dormant (default: 30)
- `FOLLOWUP_QUIET_HOURS_START` — Start of quiet hours (default: "21:00")
- `FOLLOWUP_QUIET_HOURS_END` — End of quiet hours (default: "08:00")
- `FOLLOWUP_MAX_DAILY_PER_CUSTOMER` — Max proactive messages per customer per day (default: 1)
- `FOLLOWUP_COOLDOWN_HOURS` — Minimum hours between messages to same customer (default: 4)
- `FOLLOWUP_MAX_PAYMENT_REMINDERS` — Max payment reminders before escalation (default: 3)
- `FOLLOWUP_BIRTHDAY_DISCOUNT` — Discount percentage for birthday messages (default: 15)
- `FOLLOWUP_BIRTHDAY_VALIDITY_DAYS` — Days the birthday discount is valid (default: 7)
- `BUSINESS_TIMEZONE` — Timezone for scheduling (e.g., "America/Lima")

## Error Handling & Edge Cases
- **Customer opted out:** Check CRM opt-out flag before every outreach. Never message opted-out customers. This is non-negotiable.
- **Customer already in active conversation:** Don't send a scheduled follow-up if the customer is currently chatting. Defer to next window.
- **Order already paid/cancelled:** Before sending a payment reminder, re-check order status. Orders can be paid via other channels.
- **Item out of stock again:** Before sending a restock notification, verify current stock. Don't notify about items that sold out between the cron check and message send.
- **Customer blocked the number:** If WhatsApp reports delivery failure, mark in CRM and stop attempting. Don't retry indefinitely.
- **Duplicate follow-ups:** Use the follow-up queue with idempotency keys to prevent sending the same follow-up twice (e.g., on system restart).
- **Time zone edge cases:** Always resolve "today" and "tomorrow" relative to `BUSINESS_TIMEZONE`, not server time.
- **Holiday sensitivity:** Don't send sales/commercial follow-ups on major holidays or days of mourning. Birthday messages are fine.
- **Language preference:** If CRM has a language preference for the customer, use it. Default to Spanish.
