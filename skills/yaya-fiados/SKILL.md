# yaya-fiados — Informal Credit Tab Tracking (Cuaderno de Fiados)

## Description
Digitizes the cuaderno de fiados — the paper notebook where bodegas, tiendas, panaderías, and small restaurants across LATAM track customer credit tabs. Fiado is the informal credit system built on confianza (trust) between neighbors: "llévalo, me pagas después." This skill records debts, tracks partial payments, generates aging reports, and creates culturally appropriate cobro reminders — all without destroying the trust relationships that make fiado work. Designed for the 500K+ bodegas in Peru alone (and millions across LATAM) where fiado represents 15-30% of daily sales.

## When to Use
- Business owner says a customer took products on credit ("se llevó fiado", "anótale", "se lo llevó sin pagar", "le fié")
- Business owner wants to add to an existing tab ("súmale", "pónselo a su cuenta", "se llevó otra cosa más")
- A customer makes a partial or full payment on their tab ("me abonó", "me pagó", "me dio algo a cuenta")
- Business owner asks who owes them money ("¿quién me debe?", "¿cuánto me deben?", "¿cómo andan los fiados?")
- Business owner wants to check a specific customer's balance ("¿cuánto me debe la señora María?")
- Business owner needs an aging report ("¿quién no me paga hace rato?", "¿quién me debe más tiempo?")
- Business owner wants to send a cobro reminder ("recuérdale que me debe", "mándale un mensajito")
- Business owner asks for a summary ("dame el resumen de fiados", "¿cuánto tengo en fiados?")
- Business owner wants to set credit limits ("no le fíes más de S/50", "ponle un límite")
- Business owner asks about a customer's payment history ("¿es buena paga?", "¿cuántas veces ha pagado tarde?")
- A voice note comes in describing a fiado transaction
- A fiado tab exceeds configured time or amount thresholds (bad debt alert)

## Capabilities
- **Tab Creation** — Open a new fiado tab from natural language: "La señora María se llevó 3 leches y 2 panes" → creates ledger entry with items, quantities, and prices looked up from ERPNext
- **Tab Addition** — Add items to an existing open tab: "Doña Rosa se llevó otra bolsa de arroz, súmale"
- **Partial Payment Recording** — Record abonos: "La vecina me pagó S/20 de lo que debe" → decrements balance, logs payment
- **Full Payment Recording** — Close a tab: "Don Pedro pagó todo lo que debía" → zeroes balance, marks tab as saldado
- **Balance Inquiry** — Check individual or aggregate balances: "¿Cuánto me debe Carmen?" or "¿Cuánto tengo en fiados total?"
- **Debtor Listing** — List all open tabs sorted by amount, age, or name
- **Aging Report** — Show tabs older than X days: "¿Quién no me paga hace más de 2 semanas?"
- **Cobro Reminder Generation** — Create warm, culturally appropriate WhatsApp messages for debt collection that preserve dignity and confianza
- **Daily/Weekly Summary** — Total outstanding, new fiados today, payments received, net movement
- **Credit Limits** — Set per-customer or global credit ceilings: "No le fíes más de S/50 a nadie"
- **Payment History** — Track payment patterns: punctuality, frequency, reliability scoring
- **Bad Debt Flagging** — Alert when a tab exceeds configurable time or amount thresholds
- **Voice Note Support** — Log fiado transactions via voice (transcribed via Whisper, processed as text)
- **CRM Integration** — Link fiado tabs to yaya-crm customer records for unified customer view
- **WhatsApp-Formatted Output** — All responses formatted for WhatsApp readability (bullet lists, emojis, NO tables)

## MCP Tools Required
- `postgres-mcp` — Primary: fiado ledger (tabs, line items, payments, balances), aging calculations, history queries, summary aggregations
- `crm-mcp` — Customer lookup/creation, link fiado data to CRM profiles, payment behavior tags
- `erpnext-mcp` — Product catalog and current prices for item lookup when recording fiados

## Data Model (Fiado Ledger)

```
fiado_tab:
  id, customer_id, customer_name, customer_phone
  status: open | saldado | castigado (written off)
  opened_at, last_activity_at, closed_at
  total_fiado (sum of all items ever added)
  total_paid (sum of all payments)
  balance (total_fiado - total_paid)
  credit_limit (per-customer, nullable)
  notes

fiado_line_item:
  id, tab_id
  description, quantity, unit_price, total
  recorded_at, recorded_via (text | voice)
  erpnext_item_code (nullable — linked if product found)

fiado_payment:
  id, tab_id
  amount, payment_method (efectivo | yape | plin | otro)
  recorded_at, notes
  is_full_payment (boolean)

fiado_reminder:
  id, tab_id
  sent_at, message_text, channel (whatsapp)
  response_received (boolean), response_text
```

## Behavior Guidelines
- **Confianza first, always.** Fiado is built on trust between neighbors. The skill must reinforce — never erode — this trust. Every feature, message, and interaction must respect the human relationship behind the debt.
- **Never be aggressive or threatening.** No "PAGUE SU DEUDA", no threats, no ultimatums. Cobro messages use warm language: "Un recordatorio cariñoso...", "Le escribo con todo cariño...". The bodeguero's reputation depends on treating people with dignidad.
- **Respond in the owner's language.** Default to natural Peruvian Spanish. Understand regional terms: fiado, fiar, apuntar, al fiado, me lo llevo después te pago, etc.
- **Look up prices automatically.** When the owner says "se llevó 3 leches", look up the price of leche in ERPNext. If multiple matches exist, ask. If no match, ask for the price: "¿A cuánto la leche?"
- **Confirm before recording.** Always confirm the total before saving: "Anoto: 3 leches a S/4.50 c/u + 2 panes a S/0.50 c/u = S/14.50 al fiado de la Sra. María. ¿Correcto?"
- **Handle fuzzy customer names gracefully.** "La señora María", "Doña María", "la María de la esquina", "la vecina del 302" could be the same person. Use CRM to resolve. If ambiguous, ask: "Tengo 2 Marías: María López (la del 302) y María Torres (la de la panadería). ¿Cuál es?"
- **Never expose fiado data to the customer directly.** The debtor should never see the full ledger or other people's debts. Cobro reminders only mention their own balance.
- **Respect the bodeguero's judgment.** If the owner decides to forgive a debt ("bórralo, ya no va a pagar"), respect it. Mark as castigado (written off), not deleted — keep it for records.
- **Warn, don't block, on credit limits.** When a customer is near or over their limit: "Ojo: la Sra. María ya tiene S/45 en fiados. Su límite es S/50. ¿Le fío igual?" Let the owner decide.
- **Voice notes are first-class.** Many bodegueros are busy and prefer to dictate: "Apúntale a Don Pedro 2 kilos de arroz y 1 aceite." Process transcribed voice exactly like text.
- **In the sierra/selva, fiado is even more informal.** Don't force structure. If the owner says "el vecino se llevó unas cositas, ponle 10 soles", record it as a lump sum without itemization.
- **Patterns, not confrontation.** The skill should help the owner see patterns (who pays late, who never pays) and make informed decisions — not force collection actions.
- **WhatsApp formatting only.** Use bullet points (•), emojis, and short lines. Never use tables, markdown tables, or wide formatting that breaks on mobile.

## Cobro Message Templates

Cobro messages are the most culturally sensitive part of this skill. They must be warm, preserve dignity, and use the language of confianza — not the language of debt collection.

### Escalation Levels

```
Nivel 1 — Recordatorio cariñoso (7 días)
Tone: Warm, almost casual. Like a friend reminding a friend.

"Hola [nombre] 👋 ¿Cómo está?
Le escribo de [negocio]. Solo para recordarle
con cariño que tiene una cuentita pendiente
de S/[monto] 📝

Cuando pueda pasarse, aquí estaremos 😊
¡Que tenga bonito día!"


Nivel 2 — Recordatorio amable (14 días)
Tone: Still warm, slightly more direct. Acknowledges life is busy.

"Hola [nombre], ¿todo bien? 🙏
Le comento que su cuentita en [negocio]
ya va en S/[monto].

Sé que a veces uno se olvida con tanto ajetreo,
por eso le aviso con confianza.

¿Le parece si se pasa esta semana? 😊
Cualquier abonito es bienvenido 💪"


Nivel 3 — Recordatorio directo (21+ días)
Tone: Direct but never aggressive. Explains the impact on the business.

"Hola [nombre], espero que esté bien.
Le escribo de [negocio] sobre su cuenta
pendiente de S/[monto].

Ya van [X] días y la verdad el negocito
es chiquito y cada solcito cuenta 🙏

¿Podemos coordinar cómo ponernos al día?
Puede ser en partes, no hay problema.

Gracias por su comprensión 🤝"


Nivel 4 — Escalación al dueño (30+ días)
No se envía mensaje automático al cliente.
Se notifica al dueño:

"⚠️ La cuenta de [nombre] lleva [X] días
pendiente por S/[monto].

Ya se enviaron [N] recordatorios sin respuesta.

Opciones:
• Enviar otro recordatorio
• Llamar personalmente
• Marcar como pérdida (castigar)

¿Qué prefieres hacer?"
```

### Cobro Message Rules
- **Never send without owner approval.** Always show the message to the owner first: "¿Le mando este recordatorio a Doña Rosa?"
- **Maximum 1 reminder per customer per week.** Never bombard.
- **Stop after 3 unanswered reminders.** Escalate to owner instead of continuing to message.
- **If customer responds with hardship** ("estoy sin trabajo", "me enfermé"), flag to owner with empathy: "Doña Rosa dice que está pasando un momento difícil. ¿Quieres darle más tiempo?"
- **Never mention other debtors.** Each message is private and individual.
- **Use the owner's business name,** not "sistema automático" or "bot." The message should feel like it came from the owner.
- **Time of day matters.** Only send between 8 AM and 7 PM. Never on Sundays or major holidays.

## Example Flows

### Opening a New Tab
```
Dueño: "La señora María se llevó 3 leches y 2 panes, anótalo como fiado"
Agente: [busca precios en ERPNext]
Agente: "📝 Anoto fiado para Sra. María:

         • 3 leches Gloria — S/4.50 c/u = S/13.50
         • 2 panes francés — S/0.50 c/u = S/1.00

         💰 Total fiado: S/14.50

         ¿Confirmo? ✅"
Dueño: "Sí"
Agente: [registra en postgres, vincula con CRM]
Agente: "Listo, anotado ✅
         La Sra. María ahora debe S/14.50"
```

### Adding to an Existing Tab
```
Dueño: "Doña Rosa se llevó otra bolsa de arroz, súmale"
Agente: [busca precio arroz en ERPNext, busca tab abierto de Doña Rosa]
Agente: "📝 Le sumo a la cuenta de Doña Rosa:

         • 1 arroz Costeño 1kg — S/4.20

         Cuenta anterior: S/28.00
         ➕ Nuevo: S/4.20
         💰 Total ahora: S/32.20

         ¿Confirmo? ✅"
Dueño: "Dale"
Agente: "Listo ✅ Doña Rosa ahora debe S/32.20"
```

### Partial Payment
```
Dueño: "La vecina me pagó S/20 de lo que debe"
Agente: [busca en CRM quién es "la vecina"]
Agente: "¿La vecina es Carmen Huamán (la del 302)? Debe S/45.00"
Dueño: "Sí, esa"
Agente: "📝 Registro abono de Doña Carmen:

         💵 Pago: S/20.00
         Deuda anterior: S/45.00
         💰 Nuevo saldo: S/25.00

         ¿Confirmo? ✅"
Dueño: "Sí"
Agente: "Listo ✅ Doña Carmen ahora debe S/25.00
         Le quedan S/25.00 por pagar"
```

### Full Payment
```
Dueño: "Don Pedro pagó todo lo que debía"
Agente: [busca tab de Don Pedro]
Agente: "✅ Don Pedro tenía una deuda de S/67.50.
         Registro el pago completo y cierro su cuenta.

         ¿Confirmo?"
Dueño: "Sí"
Agente: "¡Listo! ✅ Don Pedro está al día.
         Cuenta saldada 🎉"
```

### Balance Inquiry — Individual
```
Dueño: "¿Cuánto me debe la señora Carmen?"
Agente: [consulta postgres]
Agente: "📋 Sra. Carmen Huamán:

         💰 Debe: S/25.00

         📝 Detalle:
         • 12/03 — 2 leches, 1 arroz, 1 aceite (S/28.00)
         • 15/03 — 1 pan, 2 gaseosas (S/7.00)
         • 18/03 — 1 detergente (S/10.00)
         💵 Abono 16/03 — S/20.00

         ⏱️ Fiado más antiguo: 9 días"
```

### Balance Inquiry — Who Owes the Most
```
Dueño: "¿Quién me debe más?"
Agente: [consulta postgres]
Agente: "📊 Top deudores:

         1. Don José Quispe — S/120.00 (hace 23 días)
         2. Sra. Rosa Mendoza — S/87.50 (hace 15 días)
         3. Sra. Carmen Huamán — S/25.00 (hace 9 días)
         4. Don Miguel Torres — S/18.00 (hace 4 días)
         5. Sra. Ana Flores — S/12.00 (hace 2 días)

         💰 Total en fiados: S/262.50
         👥 5 clientes con deuda abierta"
```

### List All Debtors
```
Dueño: "Dame la lista de todos los fiados"
Agente: [consulta postgres]
Agente: "📋 Fiados abiertos — 8 clientes:

         👤 Don José Quispe — S/120.00 ⚠️ (23 días)
         👤 Sra. Rosa Mendoza — S/87.50 (15 días)
         👤 Doña Lucía Vargas — S/56.00 (12 días)
         👤 Sra. Carmen Huamán — S/25.00 (9 días)
         👤 Don Miguel Torres — S/18.00 (4 días)
         👤 Sra. Ana Flores — S/12.00 (2 días)
         👤 Don Carlos Rojas — S/8.50 (1 día)
         👤 Sra. Patricia Luna — S/5.00 (hoy)

         💰 Total en fiados: S/332.00
         ⚠️ 1 cuenta con más de 21 días"
```

### Aging Report
```
Dueño: "¿Quién no me paga hace más de 2 semanas?"
Agente: [consulta postgres]
Agente: "⚠️ Fiados con más de 14 días:

         🔴 Don José Quispe — S/120.00 (23 días)
            Último abono: nunca
            Recordatorios enviados: 2

         🟡 Sra. Rosa Mendoza — S/87.50 (15 días)
            Último abono: hace 8 días (S/15.00)
            Recordatorios enviados: 1

         💰 Total vencido (>14 días): S/207.50

         ¿Quieres que les envíe un recordatorio? 📩"
```

### Sending a Cobro Reminder
```
Dueño: "Mándale un mensajito a Don José recordándole"
Agente: "Le enviaría este mensaje a Don José:

         'Hola Don José 👋 ¿Cómo está?
         Le escribo de [Bodega]. Solo para recordarle
         con cariño que tiene una cuentita pendiente
         de S/120.00 📝

         Ya van unos días y la verdad el negocito
         es chiquito y cada solcito cuenta 🙏

         ¿Podemos coordinar cómo ponernos al día?
         Puede ser en partes, no hay problema.

         Gracias por su comprensión 🤝'

         ¿Lo envío? 📩"
Dueño: "Sí, mándalo"
Agente: [envía vía WhatsApp]
Agente: "Enviado ✅ Te aviso si responde"
```

### Daily Summary
```
Dueño: "¿Cómo anduvieron los fiados hoy?"
Agente: [consulta postgres]
Agente: "📊 Resumen de fiados — hoy 21/03/2026:

         📝 Nuevos fiados: 3 (S/42.50)
         💵 Pagos recibidos: 2 (S/35.00)
         📈 Movimiento neto: +S/7.50

         💰 Total pendiente: S/332.00
         👥 Clientes con deuda: 8
         ⚠️ Cuentas vencidas (>14 días): 2 (S/207.50)

         👍 Doña Lucía abonó S/15.00
         👍 Don Carlos pagó todo (S/22.00)
         📝 Sra. Patricia se llevó fiado (S/5.00)"
```

### Credit Limit Setting
```
Dueño: "No le fíes más de S/50 a nadie"
Agente: "✅ Límite de fiado global establecido: S/50.00

         Esto aplica a todos los clientes.
         Te avisaré cuando alguien se acerque al límite.

         ⚠️ Ojo: 2 clientes ya superan este límite:
         • Don José Quispe — S/120.00
         • Sra. Rosa Mendoza — S/87.50

         ¿Qué hacemos con ellos? Las opciones son:
         • Dejar su deuda actual pero no fiarles más
         • Ponerles un límite diferente
         • No aplicarles límite"
```

### Payment History
```
Dueño: "¿Cuántas veces ha pagado tarde Don José?"
Agente: [consulta postgres]
Agente: "📋 Historial de Don José Quispe:

         📊 Resumen:
         • Fiados totales: 12 veces
         • Pagó a tiempo (<7 días): 3 veces (25%)
         • Pagó tarde (7-30 días): 5 veces (42%)
         • Pagó muy tarde (>30 días): 2 veces (17%)
         • Pendiente actual: S/120.00 (23 días)
         • Deudas castigadas: 2 (S/45.00 total)

         💡 Patrón: Don José suele pagar cuando
         le recuerdan. Paga más seguido a fin de
         mes (posiblemente cuando cobra).

         ¿Quieres enviarle un recordatorio? 📩"
```

### Write-Off (Castigar Deuda)
```
Dueño: "La Sra. López se mudó, ya no va a pagar. Bórralo."
Agente: "📝 Marco como castigada (pérdida) la deuda
         de Sra. López por S/34.00.

         No se borra del sistema — queda en el
         historial como deuda castigada.

         ¿Confirmo? ❌💰"
Dueño: "Sí"
Agente: "Listo ✅ Deuda de Sra. López (S/34.00) marcada
         como castigada. Ya no aparece en fiados activos."
```

### Voice Note Fiado
```
Dueño: [envía nota de voz: "Apúntale a la señora del 302
         dos kilos de arroz y un aceite grande"]
Agente: [transcribe vía Whisper]
Agente: [identifica "señora del 302" → Carmen Huamán via CRM]
Agente: [busca precios en ERPNext]
Agente: "📝 Anoto fiado para Sra. Carmen Huamán (la del 302):

         • 2 arroz Costeño 1kg — S/4.20 c/u = S/8.40
         • 1 aceite Primor 1L — S/9.90

         Cuenta anterior: S/25.00
         ➕ Nuevo: S/18.30
         💰 Total ahora: S/43.30

         ¿Confirmo? ✅"
```

### Lump Sum Recording (Sierra/Selva Style)
```
Dueño: "El vecino se llevó unas cositas, ponle 10 soles"
Agente: "📝 Anoto fiado:

         👤 ¿Qué vecino? ¿Tiene nombre o cómo lo identifico?"
Dueño: "El Don Julio, el de la chacra"
Agente: [busca en CRM, no encuentra]
Agente: "No tengo registrado a un Don Julio.
         ¿Creo un registro nuevo como 'Don Julio — el de la chacra'?"
Dueño: "Sí"
Agente: [crea contacto en CRM, registra fiado]
Agente: "Listo ✅ Don Julio (el de la chacra):
         • Varios productos — S/10.00
         Fiado registrado 📝"
```

### Customer Hardship Response
```
[Recordatorio enviado a Doña Rosa, ella responde:]
Doña Rosa: "Ay, es que perdí mi trabajo y estoy ajustada 😔"

Agente: [notifica al dueño]
Agente: "📩 Doña Rosa respondió al recordatorio.
         Dice que perdió su trabajo y está pasando
         un momento difícil 😔

         Su deuda es de S/87.50.

         ¿Qué prefieres hacer?
         • Darle más tiempo sin enviar más recordatorios
         • Ofrecerle pagar en cuotas chiquitas
         • Perdonar parte de la deuda
         • Otra cosa"
```

## Scheduling via OpenClaw Cron

```yaml
fiado_jobs:
  daily_summary:
    schedule: "0 21 * * *"           # Every day at 9 PM
    description: "Send daily fiado summary to business owner"

  aging_check:
    schedule: "0 9 * * 1"            # Mondays at 9 AM
    description: "Check for tabs older than FIADO_AGING_WARN_DAYS and alert"

  bad_debt_alert:
    schedule: "0 9 1,15 * *"         # 1st and 15th of month at 9 AM
    description: "Flag tabs exceeding FIADO_BAD_DEBT_DAYS or FIADO_BAD_DEBT_AMOUNT"

  weekly_summary:
    schedule: "0 10 * * 6"           # Saturdays at 10 AM
    description: "Weekly fiado summary: totals, trends, aging"
```

## Configuration
- `FIADO_DEFAULT_CURRENCY` — Currency for fiado amounts (default: "PEN")
- `FIADO_GLOBAL_CREDIT_LIMIT` — Default max fiado per customer, 0 = unlimited (default: 0)
- `FIADO_AGING_WARN_DAYS` — Days after which a tab is flagged as aging (default: 14)
- `FIADO_BAD_DEBT_DAYS` — Days after which a tab is flagged as potential bad debt (default: 30)
- `FIADO_BAD_DEBT_AMOUNT` — Amount above which a tab is flagged as potential bad debt (default: 100)
- `FIADO_REMINDER_LEVEL_1_DAYS` — Days before first cobro reminder (default: 7)
- `FIADO_REMINDER_LEVEL_2_DAYS` — Days before second cobro reminder (default: 14)
- `FIADO_REMINDER_LEVEL_3_DAYS` — Days before third cobro reminder (default: 21)
- `FIADO_REMINDER_ESCALATE_DAYS` — Days before escalating to owner (default: 30)
- `FIADO_MAX_REMINDERS` — Max reminders before escalation to owner (default: 3)
- `FIADO_REMINDER_COOLDOWN_DAYS` — Minimum days between reminders to same customer (default: 7)
- `FIADO_AUTO_REMIND` — Auto-send reminders without owner approval (default: false)
- `FIADO_QUIET_HOURS_START` — No reminders after this hour (default: "19:00")
- `FIADO_QUIET_HOURS_END` — No reminders before this hour (default: "08:00")
- `FIADO_NO_REMIND_DAYS` — Days of week to never send reminders, comma-separated (default: "0" — Sunday)
- `FIADO_REQUIRE_ITEM_LOOKUP` — Require ERPNext item match for every line item (default: false)
- `FIADO_ALLOW_LUMP_SUM` — Allow recording fiados without itemization (default: true)
- `FIADO_DAILY_SUMMARY_ENABLED` — Send daily fiado summary (default: true)
- `FIADO_WEEKLY_SUMMARY_ENABLED` — Send weekly fiado summary (default: true)
- `BUSINESS_TIMEZONE` — Timezone for scheduling and quiet hours (e.g., "America/Lima")

## Error Handling & Edge Cases
- **Ambiguous customer name:** "La señora María" could match multiple people. Always check CRM for matches and ask the owner to clarify if there are 2+ matches. Never guess — guessing creates double entries that are hard to fix.
- **Customer not in CRM:** If the customer doesn't exist, ask the owner for a name and any identifying detail. Create a minimal CRM contact. Nicknames and references are fine ("Don Julio, el de la chacra").
- **Product not in ERPNext:** If the product can't be found in the catalog, ask the owner for the price. Record with the owner's description and price. Don't block the fiado over a missing catalog entry.
- **Duplicate tab detection:** If a customer already has an open tab and the owner says "anótale fiado", add to the existing tab — don't create a new one. Confirm: "La Sra. María ya tiene una cuenta de S/14.50. ¿Le sumo a esa?"
- **Negative balance (overpayment):** If a payment exceeds the balance, flag it: "Doña Carmen pagó S/50 pero solo debía S/25. Queda un saldo a favor de S/25. ¿Lo dejo como crédito para la próxima compra o le devuelves la diferencia?"
- **Zero-amount fiado:** Reject: "No puedo registrar un fiado por S/0. ¿Cuánto fue?"
- **Currency confusion:** In border areas, customers might mix currencies (soles/pesos/dólares). Always confirm currency if there's any ambiguity.
- **Tab already closed:** If the owner tries to add to a saldado tab, open a new one: "La cuenta anterior de Don Pedro ya está saldada. ¿Abro una nueva?"
- **ERPNext unavailable:** Record the fiado with the owner's stated price. Mark as "price unverified." Reconcile prices when ERPNext is back online.
- **CRM unavailable:** Record the fiado with the customer name as text. Queue CRM linkage for when connectivity is restored.
- **Multiple people with same name:** Use phone number, address reference, or nickname as differentiator. Store in CRM: "María López (la del 302)" vs "María Torres (la panadería)".
- **Owner says "borra eso":** If the owner wants to undo a just-recorded entry, delete it. If it was recorded more than 24 hours ago, mark as reversed (not deleted) for audit purposes.
- **Seasonal debt patterns:** In agricultural areas (sierra/selva), customers may only pay after harvest. The skill should recognize this and not flag as bad debt during normal agricultural cycles if the owner has noted the pattern.
- **Family tabs:** Some families share a tab ("ponle a la cuenta de los Quispe"). Support family/household-level tabs, not just individual.
- **Fiado for services, not just products:** Some businesses fiar services (haircuts, meals, repairs). Don't require an ERPNext item — accept description + amount.
- **Death or long-term absence of debtor:** If the owner reports a customer has passed away or moved permanently, offer to write off gracefully. Never suggest contacting family for collection.
