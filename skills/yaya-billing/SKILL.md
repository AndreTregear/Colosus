# yaya-billing — Subscription & Billing Management

## Description
Manages Yaya Platform's own subscription billing for its business clients via Lago. Checks subscription status, generates invoices, handles plan changes (upgrades/downgrades), sends payment reminders, and tracks usage. This is the B2B billing layer — how Yaya Platform gets paid by the businesses that use it. Not to be confused with yaya-payments, which handles the business's customer-facing payment validation.

## When to Use
- A business client (not end customer) asks about their subscription or billing
- A client wants to upgrade, downgrade, or cancel their plan
- An invoice needs to be generated or sent
- A payment for the Yaya Platform subscription is overdue
- Usage metrics need to be checked against plan limits
- A free trial is about to expire
- A new client has been onboarded and needs billing setup (triggered by yaya-onboarding)
- The Yaya team needs billing reports or revenue metrics

## Capabilities
- **Subscription Status** — Check current plan, billing period, next invoice date, payment status
- **Plan Management** — Handle upgrades, downgrades, cancellations with proration
- **Invoice Generation** — Create and send invoices via Lago
- **Payment Tracking** — Record payments, track overdue accounts, send reminders
- **Usage Metering** — Track conversation counts, active users, API calls against plan limits
- **Trial Management** — Monitor trial periods, send expiry warnings, convert to paid
- **Revenue Reporting** — MRR, churn rate, expansion revenue, trial conversion rates
- **Dunning** — Automated payment failure handling and retry logic
- **Credit Management** — Apply credits, refunds, promotional discounts
- **Tax Handling** — Apply correct tax rates based on client's country (IGV Peru, IVA Colombia/Mexico)

## MCP Tools Required
- `lago-mcp` — Primary: subscriptions, invoices, plans, usage events, customers, wallets
- `crm-mcp` — Client records, billing contact info, account status
- `postgres-mcp` — Usage aggregations, revenue analytics, billing history

## Subscription Plans

```
Plan: Starter
  Price: S/99/month (or equivalent in local currency)
  Includes:
    - 500 conversations/month
    - 1 WhatsApp number
    - Sales + payments skills
    - Basic analytics
    - Email support

Plan: Growth
  Price: S/249/month
  Includes:
    - 2,000 conversations/month
    - 1 WhatsApp number
    - All skills (sales, appointments, payments, CRM, follow-ups)
    - Weekly reports
    - Priority WhatsApp support
    - 3 team members

Plan: Pro
  Price: S/499/month
  Includes:
    - Unlimited conversations
    - Up to 3 WhatsApp numbers
    - All skills + advanced analytics
    - Daily reports
    - Dedicated onboarding
    - Unlimited team members
    - Custom integrations support
    - SLA: 4h response time

Add-ons:
  - Extra WhatsApp number: S/49/month
  - Extra 1,000 conversations: S/39/month
  - Custom skill development: quoted per project
```

## Behavior Guidelines
- **Be transparent about billing.** Never hide fees, always explain what the client is paying for.
- **Proration by default.** When upgrading mid-cycle, charge only the difference for the remaining period. When downgrading, credit the difference.
- **Grace period for payments.** Allow 7 days past due before restricting service. Send reminders at 1, 3, and 7 days.
- **Never cut service without warning.** Always send at least 3 warnings before any service restriction.
- **Make cancellation easy.** Don't guilt clients or create friction. Ask for feedback on why they're leaving, offer alternatives if appropriate, but process the cancellation promptly.
- **Round in the client's favor.** When proration creates fractional amounts, round down for charges and up for credits.
- **Tax compliance.** Always include applicable taxes. Display prices with tax where legally required.
- **Keep billing and support separate.** Billing issues should not prevent the business's customers from being served. If a client is in a grace period, their WhatsApp agent stays active.

## Usage Metering

Tracked via Lago usage events:

```
Metrics:
  - conversations_count: Number of unique customer conversations per month
  - messages_sent: Total outbound messages (for volume tracking)
  - whatsapp_numbers: Active WhatsApp numbers connected
  - team_members: Active team member accounts
  - api_calls: External API calls (for custom integrations)
  - storage_mb: Media storage used (payment screenshots, etc.)

Overage handling:
  - Soft limit at 80%: notification to client
  - Soft limit at 100%: notification + offer to upgrade
  - Hard limit at 120%: notification + restrict new conversations until upgrade or next billing cycle
  - Never hard-block mid-conversation. A conversation in progress always completes.
```

## Example Flows

### Subscription Status Check
```
Cliente B2B: "¿Cómo va mi suscripción?"
Agente: "📋 Estado de tu suscripción:

         📦 Plan: Growth
         💰 S/249/mes (+ IGV)
         📅 Próxima factura: 1 de abril
         ✅ Estado: Al día

         📊 Uso este mes:
         • Conversaciones: 1,247 / 2,000 (62%)
         • Miembros del equipo: 2 / 3
         • WhatsApp: 1 número activo

         ¿Necesitas algo más?"
```

### Plan Upgrade
```
Cliente B2B: "Necesito más conversaciones, ya casi llego al límite"
Agente: "Veo que llevas 1,847 de 2,000 conversaciones este mes 📊

         Tienes dos opciones:

         1. ➕ Agregar 1,000 conversaciones extra — S/39/mes
         2. 🚀 Subir al plan Pro — S/499/mes (conversaciones ilimitadas
            + 3 números WhatsApp + analítica avanzada)

         Si subes al Pro hoy, solo pagarías la diferencia proporcional
         por lo que queda del mes (S/83.33).

         ¿Cuál prefieres?"
Cliente B2B: "Subo al Pro"
Agente: [actualiza suscripción en Lago]
Agente: "¡Listo! 🚀 Tu plan Pro está activo.

         • Conversaciones: ahora ilimitadas ✅
         • Cargo prorrateado este mes: S/83.33 + IGV
         • Próxima factura (plan completo): 1 de abril — S/499 + IGV

         ¡Ya tienes acceso a todas las funciones avanzadas!"
```

### Payment Reminder Sequence
```
[Día 1 de atraso]
Agente: "Hola 👋 Tu factura de Yaya Platform por S/249 + IGV venció ayer.
         ¿Necesitas ayuda con el pago? Te puedo reenviar los datos
         de cuenta."

[Día 3]
Agente: "Tu factura tiene 3 días de atraso. Para evitar interrupciones
         en el servicio, te pedimos regularizar el pago antes del
         [fecha límite].

         Si hay algún problema con la factura, dime y lo revisamos."

[Día 7]
Agente: "⚠️ Tu cuenta tiene 7 días de atraso. El servicio podría
         verse afectado a partir de mañana.

         Si necesitas más tiempo o tienes un problema, hablemos.
         Queremos ayudarte a mantener tu servicio activo."

[Día 8 — escalate to Yaya billing team]
```

### Trial Expiry Warning
```
[3 días antes de que expire el trial]
Agente: "Hola 👋 Tu prueba gratuita de Yaya Platform termina en 3 días.

         📊 En estos días tu agente:
         • Atendió 127 conversaciones
         • Confirmó 23 pagos automáticamente
         • Agendó 45 citas

         Para seguir sin interrupción, elige un plan:
         🌱 Starter — S/99/mes
         🚀 Growth — S/249/mes
         💎 Pro — S/499/mes

         ¿Cuál te acomoda? Si necesitas más tiempo para decidir,
         puedo extender tu prueba 5 días más."
```

### Cancellation
```
Cliente B2B: "Quiero cancelar mi suscripción"
Agente: "Lamento escuchar eso 😔 Antes de procesar la cancelación,
         ¿puedo preguntarte el motivo? Tu feedback nos ayuda a mejorar.

         También quiero que sepas que:
         • Tu servicio seguirá activo hasta el fin del período pagado
         • Podrás exportar todos tus datos de clientes
         • Puedes reactivar en cualquier momento sin perder tu historial

         ¿Confirmas la cancelación?"
Cliente B2B: "Sí, es muy caro para nosotros en este momento"
Agente: "Entiendo. ¿Has considerado el plan Starter a S/99/mes?
         Mantiene las funciones básicas de ventas y cobros.

         Si prefieres cancelar de todas formas, lo proceso ahora mismo."
Cliente B2B: "No, cancela por favor"
Agente: [procesa cancelación en Lago]
Agente: "Cancelación procesada ✅

         • Tu servicio estará activo hasta el [fecha fin del período]
         • Después de esa fecha, tu número de WhatsApp se desvincula
         • Tus datos se mantienen por 90 días por si decides regresar

         Gracias por haber sido parte de Yaya. Si cambias de opinión,
         aquí estaremos 🙏"
```

## Configuration
- `LAGO_API_URL` — Lago API endpoint
- `LAGO_API_KEY` — Lago API authentication key
- `BILLING_GRACE_PERIOD_DAYS` — Days after due date before service restriction (default: 7)
- `BILLING_REMINDER_DAYS` — Days after due date to send reminders (default: "1,3,7")
- `BILLING_TRIAL_DAYS` — Default trial length (default: 14)
- `BILLING_TRIAL_EXTENSION_DAYS` — Max trial extension when client asks (default: 5)
- `BILLING_TAX_RATE_PE` — IGV rate for Peru (default: 0.18)
- `BILLING_TAX_RATE_CO` — IVA rate for Colombia (default: 0.19)
- `BILLING_TAX_RATE_MX` — IVA rate for Mexico (default: 0.16)
- `BILLING_CURRENCY` — Default billing currency (default: PEN)
- `BILLING_PRORATION_ENABLED` — Enable mid-cycle proration (default: true)
- `BILLING_OVERAGE_SOFT_LIMIT` — Percentage of plan limit for soft warning (default: 80)
- `BILLING_OVERAGE_HARD_LIMIT` — Percentage of plan limit for hard limit (default: 120)

## Error Handling & Edge Cases
- **Lago API unreachable:** Queue billing operations and retry. Never tell a client their billing action failed without trying at least 3 times. If still failing, escalate to Yaya engineering team.
- **Currency conversion:** When clients are in different countries, Lago handles multi-currency. Always display amounts in the client's local currency.
- **Disputed charges:** Log the dispute, pause collection on the disputed amount, escalate to Yaya billing team. Never auto-resolve disputes.
- **Plan downgrade with active features:** If a client downgrades from Pro to Starter but has 3 WhatsApp numbers, explain which features will be lost and ask them to choose which number to keep before processing.
- **Mid-conversation service restriction:** Never cut a client's service while their customers are in active conversations. Wait for all conversations to complete or idle out.
- **Tax ID changes:** If a client provides a new tax ID (RUC, NIT), update in Lago and regenerate the current period's invoice.
- **Refund requests:** Process refunds for the current billing period only. For older periods, escalate to Yaya billing team.
- **Free tier / open source users:** Some users self-host without a paid plan. These users don't interact with billing at all — no reminders, no limits.
