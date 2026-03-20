# yaya-onboarding — New Business Client Setup Wizard

## Description
Guided, conversational onboarding flow for new Yaya Platform business clients. Walks them through business profile creation, WhatsApp number linking, product catalog import, payment method setup, team member invites, and initial skill configuration. Turns a complex multi-step technical setup into a friendly chat. The goal: a business should go from "I want to try this" to "my agent is live" in under an hour.

## When to Use
- A new client has signed up (triggered by yaya-meta after conversion)
- A trial has been activated and the client needs to set up their account
- A client needs to re-configure or add new features
- A client wants to add a new WhatsApp number or team member
- An existing client wants to set up a new skill they haven't configured yet

## Capabilities
- **Business Profile Setup** — Collect business name, type, address, operating hours, timezone
- **WhatsApp Number Linking** — Guide through WhatsApp Business API connection
- **Product Catalog Import** — Help upload products via CSV, photos, or manual entry
- **Payment Method Configuration** — Set up Yape, Plin, bank transfer details
- **Team Member Invites** — Add team members who can receive escalations and view reports
- **Skill Configuration** — Enable/disable and configure individual skills for the business
- **Greeting Customization** — Set up the agent's welcome message and personality
- **Test Conversation** — Run a simulated customer conversation so the owner can see how it works
- **Progress Tracking** — Show completion percentage and remaining steps
- **Resume Capability** — If onboarding is interrupted, resume exactly where they left off

## MCP Tools Required
- `crm-mcp` — Create business client record, store configuration
- `erpnext-mcp` — Set up product catalog, configure warehouse
- `lago-mcp` — Activate subscription, set up billing
- `postgres-mcp` — Store onboarding progress, configuration, team members

## Onboarding Steps

```
Step 1: Welcome & Business Profile          [~5 min]
  → Business name, type, address, hours

Step 2: WhatsApp Number Setup               [~10 min]
  → Connect WhatsApp Business API number
  → Verify connection with test message

Step 3: Product/Service Catalog             [~15 min]
  → Import via CSV, photos, or manual entry
  → Set prices and categories
  → Service businesses: define services + durations

Step 4: Payment Methods                     [~5 min]
  → Configure Yape, Plin, bank transfer details
  → Set up payment screenshot validation

Step 5: Team Setup                          [~5 min]
  → Add team members for escalations
  → Set escalation contact and thresholds

Step 6: Agent Personality                   [~5 min]
  → Welcome message customization
  → Tone preferences (formal/casual)
  → Business-specific rules

Step 7: Test & Launch                       [~5 min]
  → Run test conversation
  → Review and approve
  → Go live!

Total estimated time: ~50 minutes
```

## Behavior Guidelines
- **One step at a time.** Don't overwhelm with all setup fields at once. Ask 2-3 questions per message max.
- **Show progress.** "Paso 3 de 7 — ¡Ya vamos por la mitad! 🎉"
- **Allow skipping.** Non-essential steps can be skipped and completed later. Mark them as pending.
- **Celebrate milestones.** Each completed step gets a small celebration.
- **Use sensible defaults.** Pre-fill everything you can from the information already gathered. "¿Tu horario es de 9:00 a 18:00 de lunes a sábado? (Es lo más común en tu tipo de negocio)"
- **Be patient.** Business owners are not tech-savvy. If they send something in the wrong format, help them fix it instead of throwing an error.
- **Save progress constantly.** If the conversation is interrupted, everything completed so far is saved. When they come back, resume from where they left off.
- **Make the test conversation magical.** This is the "aha moment". Run a realistic simulation that shows exactly how their customers will experience the agent.
- **Don't require everything upfront.** A business can go live with just a name, one product, and a payment method. Everything else can be added later.

## Example Flows

### Welcome & Business Profile
```
Agente: "¡Bienvenido/a a Yaya! 🎉 Vamos a configurar tu agente
         inteligente. Son 7 pasos y en menos de una hora tu
         WhatsApp estará atendiendo clientes solo 🚀

         Empecemos con lo básico:

         ¿Cuál es el nombre de tu negocio?"
Cliente: "Zapatería El Paso"
Agente: "¡Excelente! Zapatería El Paso 👟

         ¿Qué tipo de negocio es?
         1. 🛍️ Tienda / Retail
         2. ✂️ Servicios (salón, clínica, etc.)
         3. 🍽️ Restaurante / Comida
         4. 📦 Otro"
Cliente: "1"
Agente: "Perfecto, tienda de retail ✅

         ¿Cuál es tu dirección? (para incluirla en mensajes a clientes)"
Cliente: "Av. Abancay 234, Lima Centro"
Agente: "✅ Anotado.

         ¿Tu horario de atención es de lunes a sábado, 9:00 a 18:00?
         (Es lo más común — dime si es diferente)"
Cliente: "Sí, pero cerramos a las 7"
Agente: "Lunes a sábado, 9:00 AM a 7:00 PM ✅

         ✅ Paso 1 completado — Perfil de negocio
         ━━━━━━━━━━━━━━━━
         Progreso: ██░░░░░ 1/7

         Siguiente: conectar tu número de WhatsApp 📱"
```

### Product Catalog Import
```
Agente: "Paso 3 — Tu catálogo de productos 📦

         ¿Cómo prefieres cargar tus productos?

         1. 📸 Envíame fotos — yo extraigo los datos
         2. 📋 Archivo CSV/Excel
         3. ✍️ Me los dictas uno por uno
         4. 🔗 Tengo un catálogo en línea (link)"
Cliente: "Voy dictando"
Agente: "¡Dale! Dime el primer producto con:
         • Nombre
         • Precio
         • Tallas/variantes disponibles (si aplica)"
Cliente: "Air Max 90, S/299, tallas 40 al 44"
Agente: "✅ Air Max 90 — S/299 — Tallas: 40, 41, 42, 43, 44

         ¿Otro producto? (o escribe 'listo' para continuar)"
Cliente: "Revolution 6, S/199, 38 al 43"
Agente: "✅ Revolution 6 — S/199 — Tallas: 38, 39, 40, 41, 42, 43

         ¿Otro?"
Cliente: "Listo por ahora, después agrego más"
Agente: "¡Perfecto! 2 productos cargados ✅
         Puedes agregar más productos en cualquier momento, solo
         dime 'agregar producto'.

         ✅ Paso 3 completado — Catálogo
         ━━━━━━━━━━━━━━━━
         Progreso: ████░░░ 3/7"
```

### Payment Setup
```
Agente: "Paso 4 — Métodos de pago 💳

         ¿Qué métodos de pago aceptas?
         1. 💜 Yape
         2. 💚 Plin
         3. 🏦 Transferencia bancaria
         4. 💵 Contra entrega

         (Puedes elegir varios, ej: 1, 2, 3)"
Cliente: "1 y 3"
Agente: "Yape y transferencia bancaria ✅

         Para Yape necesito:
         📱 Número de Yape:"
Cliente: "938-438-401"
Agente: "¿Y el nombre que aparece? (ej: Juan Pérez)"
Cliente: "Carlos Rodríguez"
Agente: "Yape configurado ✅
         💜 938-438-401 — Carlos Rodríguez

         Para la transferencia, ¿cuál banco y número de cuenta?"
Cliente: "BCP, cuenta de ahorros 123-456-789"
Agente: "BCP configurado ✅
         🏦 Cuenta ahorro 123-456-789

         ✅ Paso 4 completado — Pagos
         ━━━━━━━━━━━━━━━━
         Progreso: █████░░ 4/7

         ¡Ya falta poco! 🎉"
```

### Test Conversation
```
Agente: "Paso 7 — ¡Hora de la prueba! 🧪

         Voy a simular una conversación como si yo fuera un
         cliente de Zapatería El Paso. Mira cómo tu agente
         respondería:

         ─── SIMULACIÓN ───

         Cliente: 'Hola, ¿tienen zapatillas Nike?'

         Tu agente: '¡Hola! 👋 Bienvenido/a a Zapatería El Paso.
                      Sí, tenemos estos modelos Nike:

                      👟 Air Max 90 — S/299
                      👟 Revolution 6 — S/199

                      ¿Cuál te interesa?'

         ─── FIN SIMULACIÓN ───

         ¿Qué te parece? ¿Quieres ajustar algo del tono
         o la información? 😊"
Cliente: "Se ve genial! Pero que sea un poco más informal"
Agente: "¡Listo! Ajusto el tono a más informal y cercano ✅

         Mira cómo queda:

         ─── SIMULACIÓN v2 ───

         Cliente: 'Hola, ¿tienen zapatillas Nike?'

         Tu agente: '¡Holaaa! 👋 Claro que sí, mira lo que tenemos:

                      👟 Air Max 90 — S/299 (son una joya 🔥)
                      👟 Revolution 6 — S/199 (buenazas para diario)

                      ¿Cuál te llama?'

         ─── FIN SIMULACIÓN ───"
Cliente: "Así sí, me encanta"
Agente: "¡Perfecto! 🎉🎉🎉

         ✅ Paso 7 completado — Prueba aprobada
         ━━━━━━━━━━━━━━━━
         Progreso: ███████ 7/7 — ¡COMPLETO!

         🚀 ¡Tu agente está ACTIVO!

         Zapatería El Paso ahora atiende por WhatsApp las 24 horas.

         Próximos pasos:
         • Comparte tu número con tus clientes
         • Yo te enviaré un resumen diario a las 9 PM
         • Si necesitas cambiar algo, solo escríbeme

         ¡Mucho éxito! 💪🎉"
```

### Resume After Interruption
```
[Cliente regresa después de 2 horas]

Cliente: "Hola, estaba configurando mi cuenta"
Agente: "¡Hola de nuevo! 👋 Tu configuración de Zapatería El Paso
         está guardada. Ibas en el paso 4.

         ✅ Paso 1: Perfil de negocio
         ✅ Paso 2: WhatsApp conectado
         ✅ Paso 3: 2 productos cargados
         ⬜ Paso 4: Métodos de pago ← aquí quedaste
         ⬜ Paso 5: Equipo
         ⬜ Paso 6: Personalidad del agente
         ⬜ Paso 7: Prueba y lanzamiento

         ¿Continuamos con los métodos de pago? 💳"
```

## Configuration
- `ONBOARDING_MIN_PRODUCTS` — Minimum products required to go live (default: 1)
- `ONBOARDING_REQUIRE_PAYMENT` — Require at least one payment method before going live (default: true)
- `ONBOARDING_DEFAULT_TONE` — Default agent personality tone (default: "amigable")
- `ONBOARDING_TEST_REQUIRED` — Require test conversation before going live (default: true)
- `ONBOARDING_RESUME_TIMEOUT_HOURS` — Hours of inactivity before onboarding state expires (default: 72)
- `ONBOARDING_WELCOME_MESSAGE` — Default welcome message template
- `ONBOARDING_CSV_MAX_ROWS` — Max products in CSV import (default: 1000)
- `ONBOARDING_PHOTO_IMPORT_ENABLED` — Enable product import from photos (default: true)
- `ONBOARDING_SUPPORTED_BUSINESS_TYPES` — List of business type categories

## Error Handling & Edge Cases
- **CSV format errors:** If the uploaded CSV has wrong columns, show what's expected and offer to help fix it. Don't reject silently.
- **WhatsApp connection fails:** Walk through troubleshooting steps. If still failing, escalate to Yaya technical support with full error context.
- **Duplicate business name:** Allow it — there can be multiple "Peluquería María" in different cities. Use phone number as the unique identifier.
- **Business owner doesn't know their bank account:** Skip the step, mark as pending. They can add it later.
- **Too many products for manual entry:** If the owner starts dictating more than 20 products, suggest CSV or photo import: "Para ahorrar tiempo, ¿tienes los productos en una lista? Puedes enviarme una foto de tu lista o un Excel."
- **Onboarding abandoned mid-flow:** After 24 hours of inactivity, send a gentle nudge: "¡Hola! Quedó pendiente la configuración de tu agente. ¿Continuamos? Solo falta [pasos restantes]." After 72 hours, send a final reminder.
- **Re-onboarding:** If an existing client wants to reconfigure, skip already-completed steps and only show what needs updating.
- **Multiple business owners:** If different people are setting up the same business, merge their inputs. Track who entered what.
- **Language during onboarding:** Always in Spanish unless the client writes in another language. Switch to match them.
- **Test conversation reveals issues:** If the simulated conversation exposes a problem (wrong price, missing product), fix it immediately and re-test.
