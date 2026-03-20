# yaya-notifications — Bulk Notifications & Outreach Campaigns

## Description
Manages bulk and segmented customer notifications via WhatsApp for small businesses. Handles restock alerts, payment reminders, promotional campaigns, and operational notices at scale. Unlike yaya-followup (which handles 1:1 proactive messages triggered by individual customer events), yaya-notifications orchestrates batch outreach to customer segments — think "notify all 47 customers who asked about Nike Air Max" or "send a payment reminder to everyone with pending orders." Respects opt-outs, enforces rate limits, and formats everything for WhatsApp (no markdown tables, ever).

## When to Use
- Business owner wants to notify customers about restocked items ("avísales a todos los que preguntaron por las Air Max")
- Business owner wants to send payment reminders in bulk ("manda recordatorio a todos los que deben")
- Business owner wants to run a promotional campaign ("manda una promo del 20% a mis mejores clientes")
- A customer requests to opt out of notifications ("no me manden más mensajes")
- Business owner asks about campaign performance ("¿cuántos leyeron el último mensaje?")
- Scheduled campaign triggers via OpenClaw cron

## Capabilities
- **Restock Notifications** — Notify customers who expressed interest in out-of-stock items when those items return to inventory
- **Payment Reminder Blasts** — Batch payment reminders to all customers with pending orders, respecting individual reminder sequences
- **Promotional Campaigns** — Send targeted promotions to customer segments (VIP, new, dormant, by purchase history)
- **Opt-Out Management** — Immediate processing of unsubscribe requests, sync with CRM
- **Rate Limiting** — Enforce max 1 promotional message per customer per week, no overlap with yaya-followup messages
- **Audience Segmentation** — Build target lists from CRM segments, purchase history, wishlist data, and custom filters
- **Message Personalization** — Merge customer name, relevant products, and amounts into message templates
- **Campaign Scheduling** — Schedule campaigns for optimal send times, stagger delivery to avoid WhatsApp rate limits
- **Delivery Tracking** — Track sent/delivered/read/responded status per message
- **A/B Testing** — Test message variants on small segments before full send (optional)

## MCP Tools Required
- `crm-mcp` — Customer segments, contact data, opt-out status, purchase history, wishlist/interest tracking
- `erpnext-mcp` — Stock levels (for restock alerts), pending orders (for payment reminders), product catalog
- `payments-mcp` — Pending payment details, payment methods for reminder context
- `postgres-mcp` — Campaign records, delivery tracking, rate limit state, opt-out log

## Audience Segments

Pre-built segments available from CRM:

| Segment | Criteria | Typical Use |
|---------|----------|-------------|
| VIP | >5 purchases OR LTV > S/1,000 | Early access, exclusive promos |
| New | First purchase in last 30 days | Welcome sequences, education |
| Regular | 2-5 purchases, active in 60 days | Cross-sell, loyalty rewards |
| Dormant | No activity in 30-90 days | Re-engagement offers |
| At-Risk | No activity in 90+ days | Win-back campaigns |
| Wishlist: [item] | Asked about specific out-of-stock item | Restock notifications |
| Pending Payment | Has unpaid orders | Payment reminders |
| Custom | Owner-defined filters | Any targeted campaign |

## Behavior Guidelines
- **NEVER send promotional messages to opted-out customers.** Check opt-out status before every send. This is non-negotiable.
- **NEVER send more than 1 promotional message per customer per week.** Track across all campaigns, not just the current one.
- **NEVER use markdown tables in WhatsApp messages.** They render as broken text. Use bullet lists with emojis instead.
- **Always confirm campaign details with the business owner before sending.** Show: audience size, message preview, estimated send time.
- **Personalize every message.** Use customer name and reference relevant products/orders. No generic blasts.
- **Stagger delivery.** Don't send 200 messages at once. Stagger over 15-30 minutes to respect WhatsApp rate limits and avoid blocks.
- **Include opt-out instructions in every promotional message.** Add "Responde SALIR para no recibir más promos" at the end.
- **Restock notifications are not promos.** They're service messages — the customer asked to be notified. These don't count toward the weekly promo limit.
- **Payment reminders are not promos.** They're transactional. These don't count toward the weekly promo limit but still respect the daily frequency cap from yaya-followup.
- **Morning sends perform best.** Default to 10 AM local time for promos. Payment reminders at 10 AM. Restock alerts ASAP (time-sensitive).
- **Track everything for the owner.** Every campaign gets a summary: sent, delivered, read, responded, opted-out.
- **Coordinate with yaya-followup.** Check if the customer already received a message today before adding to a campaign batch.

## Campaign Flow
```
1. Business owner requests a notification/campaign
2. Determine campaign type:
   a. Restock notification → pull wishlist/interest data
   b. Payment reminder → pull pending orders
   c. Promotional → define segment and offer
3. Build audience list:
   a. Query CRM for matching customers
   b. Filter out opted-out customers
   c. Filter out customers who hit weekly promo limit
   d. Filter out customers contacted today (coordinate with yaya-followup)
4. Compose message:
   a. Use WhatsApp-friendly format (bullets, emojis, no tables)
   b. Personalize with customer name and relevant details
   c. Add opt-out footer for promotional messages
5. Preview for business owner:
   a. Show audience count
   b. Show sample message (with real customer data)
   c. Show estimated send time and stagger plan
6. Owner confirms → schedule or send immediately
7. Execute send with staggering (batches of 20, 30-second intervals)
8. Track delivery status
9. Process any opt-out responses in real-time
10. Generate campaign summary for owner
```

## Example Flows

### Restock Notification
```
Dueño: "Llegaron las Air Max 90 negras. Avísales a todos
         los que preguntaron."

Agente: "¡Perfecto! Revisando quién preguntó por Air Max 90 negras...

         📋 Encontré 12 clientes que preguntaron por este modelo:
         👤 8 preguntaron la última semana
         👤 4 preguntaron hace más de 2 semanas

         📝 Mensaje que enviaré:
         ━━━━━━━━━━━━━━━━
         '¡Hola [nombre]! 🎉
         Las Air Max 90 negras que preguntaste ya llegaron.
         👟 Tallas disponibles: 38, 39, 40, 41, 42
         💰 S/349

         ¿Te separo un par? Solo llegaron pocas unidades 😊'
         ━━━━━━━━━━━━━━━━

         ¿Lo envío a los 12 clientes?"

Dueño: "Sí, mándalo"

Agente: "¡Enviando! 📤
         Se enviarán en lotes de 20 cada 30 segundos.
         Te aviso cuando termine con el resumen ✅"

[Después del envío]

Agente: "✅ Campaña completada — Air Max 90 restock

         📊 Resumen:
         📤 Enviados: 12
         ✅ Entregados: 11
         👀 Leídos: 8
         💬 Respondieron: 5
         ❌ No entregado: 1 (María López — número inactivo)

         De los 5 que respondieron, 3 quieren comprar 🎉
         Ya los estoy atendiendo con yaya-sales."
```

### Promotional Campaign
```
Dueño: "Quiero hacer una promo de 20% para mis clientes VIP
         este fin de semana"

Agente: "¡Buena idea! Preparemos la campaña 🎯

         👥 Clientes VIP: 34 en total
         ✅ Elegibles (no recibieron promo esta semana): 29
         ❌ Opt-out: 2
         ❌ Ya recibieron promo esta semana: 3

         📝 Mensaje propuesto:
         ━━━━━━━━━━━━━━━━
         '¡Hola [nombre]! 💜
         Este fin de semana tienes 20% de descuento en toda
         la tienda por ser cliente VIP 🌟

         🛍️ Válido: viernes a domingo
         💰 Descuento se aplica en cualquier producto
         📱 Solo menciona este mensaje al comprar

         ¿Te interesa algo en particular? Te ayudo a elegir 😊

         Responde SALIR para no recibir más promos.'
         ━━━━━━━━━━━━━━━━

         📅 Envío programado: viernes 10:00 AM
         👥 Audiencia: 29 clientes

         ¿Confirmas o quieres ajustar algo?"

Dueño: "Perfecto, confírmalo"

Agente: "✅ Campaña programada:
         📅 Viernes 10:00 AM
         👥 29 clientes VIP
         🏷️ 20% descuento fin de semana

         Te enviaré el resumen después del envío 📊"
```

### Bulk Payment Reminders
```
Dueño: "¿Cuántos pedidos pendientes de pago hay? Mándales
         recordatorio a todos"

Agente: "Revisando pedidos pendientes...

         📋 Pedidos pendientes de pago: 15
         💰 Total por cobrar: S/4,230

         Detalle por antigüedad:
         🟡 Menos de 24h: 4 pedidos (S/1,120) — aún temprano
         🟠 24-48h: 6 pedidos (S/1,890) — recordatorio amable
         🔴 Más de 48h: 5 pedidos (S/1,220) — recordatorio firme

         ¿Envío recordatorios a los de 24h+ (11 clientes)?
         Los de menos de 24h los dejamos para mañana."

Dueño: "Sí, a los de 24 horas para arriba"

Agente: "📤 Enviando 11 recordatorios...
         Cada mensaje va personalizado con el número de pedido,
         monto y métodos de pago.

         Ejemplo (Carlos Pérez — S/299, 36h pendiente):
         ━━━━━━━━━━━━━━━━
         'Hola Carlos 👋 Te recuerdo que tu pedido #1234
         (Air Max 90 — S/299) sigue pendiente de pago.

         Puedes pagar por:
         💜 Yape al 938-438-401
         🏦 BCP cuenta 123-456-789

         Lo tenemos separado para ti 😊
         ¿Necesitas ayuda con el pago?'
         ━━━━━━━━━━━━━━━━

         Te aviso cuando termine ✅"

[Después del envío]

Agente: "✅ Recordatorios enviados: 11

         📊 Resumen:
         📤 Enviados: 11
         ✅ Entregados: 11
         👀 Leídos: 7
         💬 Respondieron: 3 (2 dicen que pagan hoy, 1 pide plazo)

         Los que respondieron ya están en conversación 💬"
```

### Opt-Out Handling
```
Cliente: "SALIR"

Agente: "Entendido, María. He removido tu número de nuestra
         lista de promociones ✅

         Ya no recibirás mensajes promocionales.
         Si en algún momento quieres volver a recibirlos,
         solo escríbenos 'ACTIVAR'.

         Eso sí, los mensajes sobre tus pedidos activos
         (confirmaciones, entregas) los seguirás recibiendo
         normalmente 📦"

[Actualiza CRM → opt_out_promo = true]
[Log en postgres-mcp → opt_out_log]
```

### Customer Asks to Opt Out Naturally
```
Cliente: "Oye ya no me manden tantos mensajes porfa"

Agente: "¡Disculpa las molestias! 🙏
         Te he quitado de las notificaciones promocionales.

         Solo recibirás mensajes sobre:
         📦 Tus pedidos activos
         💰 Pagos pendientes

         Nada de promos. ¿Así está bien?"

Cliente: "Sí gracias"

Agente: "¡Listo! Cualquier cosa que necesites, aquí estamos 😊"
```

## Scheduling via OpenClaw Cron

```yaml
notification_jobs:
  restock_alerts:
    schedule: "*/15 * * * *"       # Every 15 minutes
    description: "Check newly restocked items against customer interests"

  payment_reminder_batch:
    schedule: "0 10 * * *"         # Daily at 10 AM
    description: "Batch payment reminders for orders pending 24h+"

  scheduled_campaigns:
    schedule: "*/5 * * * *"        # Every 5 minutes
    description: "Execute scheduled campaigns at their send time"

  campaign_status_update:
    schedule: "0 */2 * * *"        # Every 2 hours
    description: "Update delivery/read status for active campaigns"

  weekly_opt_out_audit:
    schedule: "0 9 * * 1"          # Mondays at 9 AM
    description: "Audit opt-out list consistency between DB and CRM"
```

## Configuration
- `NOTIFICATION_MAX_PROMO_PER_WEEK` — Max promotional messages per customer per week (default: 1)
- `NOTIFICATION_STAGGER_BATCH_SIZE` — Messages per batch during staggered send (default: 20)
- `NOTIFICATION_STAGGER_INTERVAL_SECONDS` — Seconds between batches (default: 30)
- `NOTIFICATION_DEFAULT_SEND_TIME` — Default time for promotional sends (default: "10:00")
- `NOTIFICATION_QUIET_HOURS_START` — No sends after this time (default: "21:00")
- `NOTIFICATION_QUIET_HOURS_END` — No sends before this time (default: "08:00")
- `NOTIFICATION_OPT_OUT_KEYWORDS` — Keywords that trigger opt-out (default: "SALIR,salir,NO MÁS,no más,basta")
- `NOTIFICATION_OPT_IN_KEYWORDS` — Keywords that trigger opt-in (default: "ACTIVAR,activar")
- `NOTIFICATION_RESTOCK_LOOKBACK_DAYS` — How far back to check customer interest for restock alerts (default: 30)
- `NOTIFICATION_REQUIRE_OWNER_APPROVAL` — Require owner confirmation before sending campaigns (default: true)
- `NOTIFICATION_PROMO_FOOTER` — Footer appended to all promotional messages (default: "Responde SALIR para no recibir más promos.")
- `BUSINESS_TIMEZONE` — Timezone for scheduling (e.g., "America/Lima")

## Error Handling & Edge Cases
- **WhatsApp rate limit hit:** If sends start failing due to rate limits, pause the campaign, increase stagger interval, and resume. Notify business owner of delay.
- **Customer number changed/invalid:** If delivery fails, mark contact as unreachable in CRM. Don't retry indefinitely — 2 attempts max.
- **Duplicate sends on system restart:** Use idempotency keys per campaign + customer. If a message was already sent (check postgres-mcp), skip.
- **Opt-out during active campaign:** If a customer opts out mid-campaign, immediately stop remaining sends to that customer and process the opt-out.
- **Item sells out during restock campaign:** Before each batch, re-check stock. If item is out of stock again, stop sending and notify owner: "Las Air Max se agotaron antes de terminar la campaña. Se notificaron 8 de 12 clientes."
- **Owner cancels campaign mid-send:** Immediately stop pending batches. Already-sent messages can't be recalled — inform owner of partial send count.
- **Customer responds to campaign:** Route to yaya-sales or appropriate skill. The campaign message becomes the start of a conversation.
- **Overlap with yaya-followup:** Before including a customer in a campaign batch, check if yaya-followup already messaged them today. If so, skip and include in next batch.
- **Holiday blackout:** Don't send promotional campaigns on major holidays (configurable per country). Transactional messages (payment reminders, order updates) are fine.
- **Empty audience:** If all customers in the target segment are filtered out (opted-out, already contacted, rate limited), inform owner: "No hay clientes elegibles para esta campaña hoy. 3 están opt-out y 2 ya recibieron promo esta semana."
