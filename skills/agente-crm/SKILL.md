# agente-crm — Customer Relationship Management

## Description
Manages the full customer lifecycle through Atomic CRM via MCP. Automatically creates and updates contacts from WhatsApp conversations, logs every interaction, tracks customer preferences and purchase history, and segments customers for targeted engagement. The CRM skill is the memory of the business — without it, every conversation starts from scratch.

## When to Use
- A new customer messages the business for the first time
- Customer information needs to be looked up for context during any conversation
- A purchase, interaction, or notable event needs to be logged
- Business owner asks about customer history, segments, or metrics
- Customer preferences need to be stored or retrieved (sizes, favorites, allergies, etc.)
- Customer segmentation needs updating (VIP, new, dormant, at-risk)
- A contact needs to be merged (same customer, different phone numbers)

## Capabilities
- **Auto-Contact Creation** — Automatically create CRM contacts when new customers message via WhatsApp
- **Contact Enrichment** — Build customer profiles over time from conversation data (name, preferences, sizes, addresses)
- **Interaction Logging** — Log every meaningful interaction: inquiries, purchases, complaints, escalations
- **Purchase History** — Track what each customer has bought, when, and how much they've spent
- **Preference Tracking** — Remember customer preferences (product sizes, colors, delivery preferences, dietary restrictions, preferred payment method, preferred provider)
- **Customer Segmentation** — Automatically categorize customers:
  - **VIP** — Top 10% by spend or frequency
  - **Regular** — Active in last 30 days, repeat purchases
  - **New** — First purchase or first 30 days
  - **Dormant** — No interaction in 60+ days
  - **At-Risk** — Was regular/VIP, declining engagement
  - **Churned** — No interaction in 90+ days
- **Lifetime Value** — Calculate and track customer lifetime value (CLV)
- **Tag Management** — Custom tags per customer (wholesale, referred-by-X, prefers-morning, etc.)
- **Merge Contacts** — Detect and merge duplicate contacts (same person, different numbers)
- **Export** — Generate customer lists for the business owner on demand

## MCP Tools Required
- `crm-mcp` — Primary: all CRUD operations on contacts, deals, interactions, tags, notes
- `erpnext-mcp` — Purchase history, order data, payment records
- `postgres-mcp` — Complex queries, aggregations, segmentation calculations

## Automatic Data Capture

The CRM skill passively captures data from every conversation:

```
From first message:
  → Phone number (WhatsApp ID)
  → First message timestamp
  → Source (WhatsApp, Telegram, etc.)

From conversation:
  → Name (when customer introduces themselves or provides it)
  → Location (when mentioned: district, city, delivery address)
  → Preferences (sizes, colors, dietary needs, etc.)
  → Sentiment trend (positive, neutral, negative interactions)

From transactions:
  → Products purchased (items, quantities, prices)
  → Payment methods used
  → Order frequency
  → Average order value
  → Total lifetime spend

From behavior:
  → Response time patterns (when they usually message)
  → Language preference
  → Communication style (formal/informal)
  → Products viewed but not purchased
```

## Behavior Guidelines
- **Capture silently.** Don't interrupt the conversation to ask for CRM data. Extract naturally from context.
- **Never expose CRM data to customers.** A customer should never see their "segment" or "lifetime value". This data is for the business owner only.
- **Ask for name naturally.** If the customer hasn't introduced themselves: "¿Con quién tengo el gusto?" — not "Please provide your full name for our records."
- **Don't over-profile.** Only store data that's useful for the business relationship. Don't store sensitive personal information beyond what's needed (no government IDs, no medical info unless it's a clinic).
- **Respect data requests.** If a customer asks what data you have about them, provide it transparently. If they ask to be deleted, comply immediately (GDPR/privacy best practice).
- **Segment automatically but allow overrides.** Business owner can manually tag a customer as VIP regardless of spend.
- **Keep it current.** If a customer provides a new address or changes preferences, update immediately. Don't accumulate stale data.
- **Merge carefully.** When merging duplicate contacts, prefer the record with more data. Never auto-merge without high confidence (same name + phone overlap). Flag ambiguous cases for business owner.

## Segmentation Rules

```
VIP:
  - Total spend in top 10% of all customers, OR
  - 5+ purchases in last 90 days, OR
  - Manually tagged as VIP by business owner

Regular:
  - At least 1 purchase in last 30 days
  - Not VIP

New:
  - First interaction within last 30 days
  - 0-1 purchases

At-Risk:
  - Was Regular or VIP
  - No interaction in 31-59 days
  - Declining order frequency

Dormant:
  - No interaction in 60-89 days

Churned:
  - No interaction in 90+ days
  - Had at least 1 previous purchase
```

## Example Flows

### New Customer Auto-Registration
```
[New WhatsApp number messages for the first time]

Agente: "¡Hola! 👋 Bienvenido/a a [Negocio]. ¿En qué te puedo ayudar?"
Cliente: "Hola, soy Ana. ¿Tienen vestidos de fiesta?"

[CRM auto-creates contact:
  name: Ana
  phone: +51987654321
  source: whatsapp
  first_contact: 2026-03-20
  segment: new
  interests: [vestidos, fiesta]
]

Agente: "¡Hola Ana! Claro que sí, tenemos varios modelos..."
```

### Business Owner Queries Customer
```
Dueño: "¿Qué me puedes decir de la clienta Ana Martínez?"
Agente: [consulta CRM]
Agente: "📋 Ana Martínez — +51 987 654 321

         📊 Resumen:
         • Cliente desde: enero 2026
         • Segmento: Regular
         • Compras: 4 pedidos, total S/892
         • Última compra: hace 12 días
         • Promedio por pedido: S/223

         ❤️ Preferencias:
         • Talla: M
         • Estilo: vestidos casuales y de fiesta
         • Pago: siempre por Yape
         • Horario: suele escribir entre 7-9 PM

         📝 Notas recientes:
         • Preguntó por vestidos rojos (15/03)
         • Feliz con su última compra (12/03)"
```

### Preference Update
```
Cliente: "Ah, por cierto, cambié de dirección. Ahora estoy en Av. Larco 456, Miraflores"
Agente: "¡Anotado! Actualicé tu dirección de envío a Av. Larco 456, Miraflores ✅"

[CRM actualiza:
  address: "Av. Larco 456, Miraflores"
  address_updated: 2026-03-20
]
```

### Customer Segment Report
```
Dueño: "¿Cuántos clientes VIP tengo?"
Agente: [consulta CRM + postgres]
Agente: "📊 Resumen de segmentos:

         💎 VIP: 23 clientes (12% del total)
            Gasto promedio: S/1,450/mes

         👥 Regulares: 89 clientes (46%)
         🆕 Nuevos (último mes): 34 clientes (18%)
         ⚠️ En riesgo: 15 clientes (8%)
         😴 Dormidos: 28 clientes (15%)

         ¿Quieres ver el detalle de algún segmento?"
```

### Data Deletion Request
```
Cliente: "Quiero que borren mis datos"
Agente: "Entendido, respetamos tu decisión. Voy a eliminar tu información
         de nuestro sistema. Esto incluye tu historial de compras,
         preferencias y datos de contacto.

         Ten en cuenta que no podremos recuperar esta información después.
         ¿Confirmas que deseas proceder?"
Cliente: "Sí, confirmo"
Agente: [elimina contacto del CRM]
Agente: "Listo, tus datos han sido eliminados ✅
         Si en el futuro quieres volver, serás bienvenido/a.
         ¡Que te vaya bien! 👋"
```

## Configuration
- `CRM_AUTO_CREATE_CONTACTS` — Auto-create contacts for new WhatsApp numbers (default: true)
- `CRM_SEGMENT_REFRESH_HOURS` — How often to recalculate segments (default: 24)
- `CRM_VIP_PERCENTILE` — Top percentile for VIP classification (default: 10)
- `CRM_DORMANT_DAYS` — Days without interaction to classify as dormant (default: 60)
- `CRM_CHURNED_DAYS` — Days without interaction to classify as churned (default: 90)
- `CRM_AT_RISK_DAYS` — Days without interaction for at-risk flag (default: 31)
- `CRM_DATA_RETENTION_DAYS` — Days to retain interaction logs (default: 365)
- `CRM_MERGE_AUTO` — Auto-merge high-confidence duplicates (default: false)
- `CRM_OWNER_QUERIES_ENABLED` — Allow business owner to query customer data via chat (default: true)

## Error Handling & Edge Cases
- **Name extraction ambiguity:** If a message says "pregúntale a María", that's not the customer's name. Only extract names from self-introductions or direct statements.
- **Multiple people on one phone:** Some families share a WhatsApp number. If conversation patterns suggest multiple users, note it but don't create separate contacts — flag for business owner.
- **Phone number changes:** If a customer says "este es mi nuevo número", create a link between old and new contacts. Don't delete the old record — migrate the history.
- **Conflicting data:** If a customer gives different sizes in different conversations, keep the most recent one as primary but retain history.
- **CRM unavailable:** If the CRM MCP is unreachable, continue the conversation normally. Queue CRM updates and process them when connectivity is restored.
- **Spam contacts:** If a phone number sends only spam/irrelevant messages, don't create a CRM contact. Flag as spam after 2 irrelevant messages.
- **Business owner vs customer:** Distinguish between the business owner querying CRM data and a customer interaction. Business owner messages should trigger different flows (reports, queries) vs customer-facing flows (silent data capture).
- **PII in notes:** Don't store payment credentials, passwords, or government IDs in CRM notes, even if the customer sends them. Acknowledge receipt and note "payment info received" without the actual data.
