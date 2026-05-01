# agente-escalation — Human Escalation & Handoff

## Description
Detects when the AI agent cannot adequately serve a customer and performs a graceful handoff to the business owner or a human team member. This is the most critical safety skill in the platform — the #1 chatbot killer is trapping customers in frustrating loops. The agent must know when to admit it can't help and bring in a human fast.

## When to Use
- Customer shows signs of frustration (caps, repeated questions, emotional language)
- Customer explicitly asks to speak with a human or manager
- The agent has failed the same request 2+ times
- Order value exceeds the configured escalation threshold
- Complaint or refund request is detected
- The agent is uncertain about critical information (medical, legal, financial advice)
- Customer mentions negative experiences, threats, or social media escalation
- Conversation has gone in circles for 3+ exchanges without resolution

## Frustration Detection Signals

### Explicit Signals (immediate escalation)
- "Quiero hablar con alguien" / "Pásenme con un humano"
- "Gerente" / "supervisor" / "encargado" / "jefe" / "dueño"
- "Esto no sirve" / "no me entienden" / "bot inútil"
- "Voy a reclamar" / "INDECOPI" / "defensa del consumidor"
- "Voy a publicar en redes" / "TikTok" / "Facebook"

### Behavioral Signals (escalate after 2 occurrences)
- ALL CAPS messages or excessive punctuation (!!!, ???)
- Repeated identical or near-identical questions
- Customer correcting the agent ("No, te dije que..." / "Ya te dije...")
- Increasingly shorter responses (engagement dropping)
- Contradicting the agent's understanding
- Long pauses followed by terse messages

### Situational Signals (immediate escalation)
- Order value above `ESCALATION_THRESHOLD`
- Any mention of refund, devolución, reembolso
- Medical, legal, or financial questions the agent cannot answer
- Bulk/wholesale inquiries above configured limits
- Custom product requests outside standard catalog
- Allegations of wrong product, damaged goods, fraud

## Escalation Thresholds
- **Attempt-based:** 2 failed attempts at the same task → escalate
- **Value-based:** Order total > `ESCALATION_THRESHOLD` → flag for owner review
- **Time-based:** Conversation unresolved after 10 minutes of back-and-forth → escalate
- **Keyword-based:** Complaint keywords trigger immediate escalation
- **Sentiment-based:** 3 consecutive negative-sentiment messages → escalate

## Capabilities
- **Frustration Detection** — Monitor conversational signals for customer distress
- **Context Summarization** — Generate a concise summary of the conversation for the human agent, including: customer name, issue, what was tried, what failed, customer sentiment
- **Owner Notification** — Send WhatsApp message to business owner with full context
- **Graceful Handoff** — Inform the customer that a human is taking over, with estimated response time
- **Escalation Logging** — Record every escalation in CRM for pattern analysis
- **Cool-down Acknowledgment** — Validate the customer's frustration before handing off
- **Priority Routing** — Tag escalations as low/medium/high/critical based on signals

## MCP Tools Required
- `crm-mcp` — Log escalation event, retrieve customer history and context
- `erpnext-mcp` — Pull order details for context summary
- `postgres-mcp` — Query escalation patterns and history

## Behavior Guidelines
- **Never argue with a frustrated customer.** Acknowledge, apologize, escalate.
- **Never say "I'm just a bot."** Say "Voy a conectarte con [nombre del dueño/equipo] para ayudarte mejor."
- **Always summarize before handing off.** The human should never ask the customer to repeat themselves.
- **Set expectations.** Tell the customer when they can expect a response: "Te va a escribir [nombre] en los próximos [X] minutos."
- **Don't over-escalate.** Simple questions answered with slight impatience are not escalations. Use the threshold system.
- **Keep the door open.** After escalation, the agent remains available for other topics.
- **Log everything.** Every escalation feeds into analytics for improving the agent.
- **Business hours matter.** If outside business hours, acknowledge the delay honestly: "El equipo no está disponible ahora, pero te contactarán mañana a primera hora."

## Escalation Message Format
The message sent to the business owner via WhatsApp follows this structure:
```
🚨 Escalación — [PRIORIDAD]

👤 Cliente: [nombre] ([teléfono])
🕐 Duración: [X] minutos
📋 Resumen: [resumen de 2-3 líneas]

❌ Problema: [descripción del issue]
🔄 Intentos: [qué intentó el agente]
💰 Pedido: [# pedido, monto] (si aplica)

⚠️ Señales: [frustración/queja/solicitud explícita]

Último mensaje del cliente:
"[mensaje textual]"
```

## Example Flows

### Frustration Detection & Handoff
```
Cliente: "Hola, quiero saber el estado de mi pedido #1234"
Agente: [consulta ERPNext] "Tu pedido #1234 está en preparación, te lo enviaremos mañana."
Cliente: "Me dijeron eso AYER también!!"
Agente: "Entiendo tu molestia, tienes toda la razón en estar pendiente. Déjame verificar con más detalle..."
Agente: [consulta falla o info insuficiente]
Cliente: "SIEMPRE ME DICEN LO MISMO. QUIERO HABLAR CON ALGUIEN."
Agente: "Tienes toda la razón, lamento mucho la demora. Voy a conectarte con María
         (la encargada) para que te dé una respuesta concreta. Ella te escribirá en
         los próximos 15 minutos. 🙏"
[Envía resumen completo a María vía WhatsApp]
```

### High-Value Order Escalation
```
Cliente: "Necesito 500 unidades de las camisetas para un evento corporativo"
Agente: "¡Qué buen pedido! 💪 Para un volumen así, quiero asegurarme de darte
         la mejor atención. Te voy a conectar con Carlos, nuestro encargado de
         ventas corporativas, para que te arme una cotización especial."
[Envía contexto a Carlos: cliente nuevo, pedido corporativo, 500 unidades]
```

### Refund Request
```
Cliente: "La zapatilla llegó con un defecto, quiero mi devolución"
Agente: "Lamento mucho eso 😔. Entiendo perfectamente — nadie quiere recibir un
         producto con defecto. Voy a pasar tu caso directamente a nuestro equipo
         para que te resuelvan lo más rápido posible.

         ¿Podrías enviarme una foto del defecto? Se la paso al equipo junto con
         tu caso para agilizar todo."
[Recopila foto, envía resumen + foto al dueño]
```

## Configuration
- `ESCALATION_THRESHOLD` — Order value above which to auto-escalate (e.g., 1000 PEN)
- `ESCALATION_CONTACTS` — WhatsApp numbers of team members who receive escalations (comma-separated)
- `ESCALATION_PRIMARY` — Primary contact name and number for default escalation
- `BUSINESS_HOURS` — Hours during which escalations get immediate routing (e.g., "09:00-18:00")
- `ESCALATION_RESPONSE_TIME` — Promised response time to tell the customer (e.g., "15 minutos")
- `MAX_ATTEMPTS_BEFORE_ESCALATION` — Number of failed attempts before auto-escalation (default: 2)
- `BULK_ORDER_THRESHOLD` — Quantity threshold for wholesale/corporate escalation (e.g., 50)

## Error Handling & Edge Cases
- **Owner unreachable:** If the escalation message fails to deliver, retry once, then tell the customer: "Estamos teniendo dificultades para contactar al equipo. Por favor llama al [teléfono] o déjanos tu mensaje y te contactamos lo antes posible."
- **Outside business hours:** Queue the escalation. Inform customer of next business day. Set auto-reminder for owner at start of next business day.
- **Repeated escalations from same customer:** Flag in CRM as recurring issue. Include history in escalation message.
- **Customer calms down:** If frustration signals stop after acknowledgment, offer to continue helping. Don't force escalation if customer is now satisfied.
- **Multiple issues:** Create separate escalation entries per issue, but send as one consolidated message to the owner.
- **Language mismatch:** If customer writes in Portuguese, English, or other language, still escalate and note the language in the summary.
