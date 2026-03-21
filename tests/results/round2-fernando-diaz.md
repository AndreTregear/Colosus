# Round 2 Evaluation: Fernando Díaz — CrossFit Miraflores (Lima)

**Evaluator:** Yaya Platform Test Agent  
**Date:** 2026-03-21  
**Persona:** Fernando Díaz Romero, 31, gym owner in Miraflores  
**Business:** CrossFit box, memberships + supplements + apparel  
**Revenue:** S/420,000/year  

---

## Platform Capability Summary for This Persona

The Yaya Platform is designed primarily for **B2C retail and service businesses** — shoe stores, salons, restaurants. Fernando's CrossFit box is a **membership-based fitness business** with class scheduling, coach management, community engagement, and recurring billing. This creates significant friction because:

- **No membership management skill exists.** The platform has no concept of recurring memberships, member status, renewal dates, or churn tracking as a first-class feature.
- **Class scheduling ≠ appointments.** yaya-appointments is built for 1:1 service appointments (salon, clinic), not group classes with capacity limits and coach assignments.
- **No WOD/programming tools.** Fitness programming is domain-specific and outside platform scope.
- **No community management.** WhatsApp group management isn't covered.

---

## Scenario Evaluations

### Scenario 1: Nueva membresía
**Message:** `Yaya bro, se inscribió una chica nueva: Alejandra Paredes, 28 años. Membresía mensual ilimitada S/280. Pagó Yape. Empieza mañana 💪`

**Skills involved:** yaya-crm, yaya-sales (order creation), yaya-payments, yaya-tax  
**MCP tools needed:** crm-mcp (create contact), erpnext-mcp (create sales order for membership), payments-mcp (log Yape payment)  

| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 6 | Can create a CRM contact and a sales order, but no "membership" entity with expiration tracking |
| Accuracy | 5 | Order will be created as a one-time sale, not a recurring membership with renewal date |
| Speed | 7 | CRM + order creation is fast |
| Completeness | 4 | No membership start/end dates, no member status, no renewal reminders built-in |
| Delight | 6 | Can respond warmly and confirm the registration |
| Safety | 8 | Low risk scenario |

**Gaps:**
- No membership entity — can't track active/expired/pending members
- No renewal date calculation (membership expires in 30 days from tomorrow)
- No automatic renewal reminder scheduling
- No member attendance tracking system

**Ideal Response:**
> ¡Bienvenida Alejandra! 💪 Registrada:
> 
> 👤 Alejandra Paredes, 28 años
> 🏋️ Membresía mensual ilimitada — S/280
> 💜 Pago Yape confirmado ✅
> 📅 Inicio: mañana (22/03)
> 📅 Vence: 21/04
> 
> Le mando un mensaje de bienvenida? Y te recuerdo 3 días antes del vencimiento para cobrar la renovación 🔔

---

### Scenario 2: Consulta de miembros activos
**Message:** `Cuántos miembros activos tengo ahora? Y cuántos se vencen esta semana? Necesito cobrar antes q se vayan 😅`

**Skills involved:** yaya-analytics, yaya-crm  
**MCP tools needed:** erpnext-mcp/postgres-mcp (membership queries), crm-mcp (member data)  

| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 3 | No membership tracking = no way to answer "active members" or "expiring this week" |
| Accuracy | 2 | Would need to infer membership status from sales orders, which is unreliable |
| Speed | 3 | Complex query with no direct data model |
| Completeness | 2 | Can't provide expiring members list or renewal amounts |
| Delight | 3 | Would likely give a vague answer or ask for clarification |
| Safety | 8 | No risk, just can't deliver |

**Gaps:**
- **CRITICAL:** No membership lifecycle management — this is THE core business query for a gym
- No concept of "active member" vs "expired member"
- No expiration date tracking
- No bulk renewal/collection workflow

**Ideal Response:**
> 📊 Miembros activos: 87
> 
> ⚠️ Se vencen esta semana: 12 miembros
> 💰 Total por cobrar: S/3,360
> 
> Detalle:
> • Lunes 22/03: 4 miembros (S/1,120)
> • Miércoles 24/03: 3 miembros (S/840)
> • Viernes 26/03: 5 miembros (S/1,400)
> 
> ¿Les mando recordatorio de renovación a todos? 💪

---

### Scenario 3: Registro de clase
**Message:** `Clase de 6pm hoy: 18 personas. WOD "Fran" 21-15-9 thrusters + pull-ups. Coach: Diego. Registra asistencia bro 🔥`

**Skills involved:** yaya-appointments (stretch), yaya-crm  
**MCP tools needed:** None directly — no class/attendance management in any MCP  

| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 2 | No class entity, no attendance system |
| Accuracy | 1 | No data model for classes, WODs, or attendance |
| Speed | 2 | Would need manual workaround |
| Completeness | 1 | Can't register 18 attendees, link to WOD, assign coach |
| Delight | 3 | Could acknowledge but not actually do anything useful |
| Safety | 8 | No risk |

**Gaps:**
- **CRITICAL:** No class management system at all
- No group class model (vs 1:1 appointments)
- No attendance tracking
- No WOD logging
- No coach assignment per class

**Ideal Response:**
> ¡Registrado! 🔥
> 
> 📋 Clase 6:00 PM — Hoy
> 👨‍🏫 Coach: Diego
> 👥 Asistencia: 18 personas
> 🏋️ WOD: "Fran" — 21-15-9 Thrusters + Pull-ups
> 
> Capacidad utilizada: 72% (18/25)
> Promedio de asistencia 6PM esta semana: 16 personas
> 
> ¿Registro algún PR destacado? 💪

---

### Scenario 4: Venta de suplementos
**Message:** `Vendí 3 proteínas whey a S/180 c/u y 2 creatinas a S/120. Todo Yape. Una boleta para un cliente q pidió, las otras sin boleta`

**Skills involved:** yaya-sales, yaya-inventory, yaya-payments, yaya-tax  
**MCP tools needed:** erpnext-mcp (sales orders, stock update), invoicing-mcp (boleta), payments-mcp (Yape logging)  

| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 7 | This is standard retail — the platform handles this well |
| Accuracy | 7 | Can create sales orders and invoice |
| Speed | 7 | Multiple tools in sequence but manageable |
| Completeness | 6 | Can do the boleta; "sin boleta" sales still need to be registered for tax tracking |
| Delight | 7 | Can confirm sale details nicely |
| Safety | 7 | Should warn about unreceipted sales for SUNAT compliance |

**Gaps:**
- Should flag that unreceipted sales still count toward monthly tax declaration
- Quick-entry mode for POS-style sales would be nice
- No "daily sales log" view aggregating register-style sales

**Ideal Response:**
> ¡Registrado! 💰
> 
> 📦 Ventas de suplementos:
> • 3x Proteína Whey — S/540
> • 2x Creatina — S/240
> 💰 Total: S/780 (Yape) ✅
> 
> 📄 Boleta emitida para 1 proteína ✅
> ⚠️ Las otras 4 ventas sin boleta igual se suman a tu declaración mensual — ya las registré internamente.
> 
> Stock actualizado:
> • Proteína Whey: 2 restantes
> • Creatina: 6 restantes

---

### Scenario 5: Programación de clases
**Message:** `Arma el horario de la próxima semana. Necesito cubrir: 6am, 7am, 9am, 12pm, 5pm, 6pm, 7pm de lunes a viernes. Sábado solo 8am, 9am, 10am. Coaches: yo (Fer), Diego, Camila`

**Skills involved:** yaya-appointments (stretch)  
**MCP tools needed:** appointments-mcp (set_working_hours, but this is for 1:1 provider schedules, not class grids)  

| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 3 | yaya-appointments is for individual appointments, not class schedule grids |
| Accuracy | 2 | Can't create a weekly class schedule with rotating coach assignments |
| Speed | 2 | Would need massive manual workaround |
| Completeness | 2 | 38 class slots to assign across 3 coaches — beyond appointment system design |
| Delight | 3 | Could maybe produce a text-based schedule but not manage it |
| Safety | 7 | No risk |

**Gaps:**
- **CRITICAL:** No class schedule/grid system
- No coach rotation logic
- No maximum classes per coach per day/week
- No conflict detection across class assignments
- No publish-to-WhatsApp-group feature

**Ideal Response:**
> 📋 Horario semana del 23-28 de marzo:
> 
> **Lunes a Viernes:**
> 🌅 6:00 AM — Fer
> 🌅 7:00 AM — Diego
> 🌅 9:00 AM — Camila
> 🌞 12:00 PM — Diego
> 🌇 5:00 PM — Camila
> 🌇 6:00 PM — Fer
> 🌇 7:00 PM — Diego
> 
> **Sábado:**
> 🌅 8:00 AM — Fer
> 🌅 9:00 AM — Camila
> 🌅 10:00 AM — Diego
> 
> 👥 Clases por coach/semana: Fer 7, Diego 8, Camila 7
> 
> ¿Lo publico en el grupo de WhatsApp del box? 📢

---

### Scenario 6: Lead nuevo
**Message:** `Un pata me escribió por Instagram preguntando precios. Le paso: mensual S/280, trimestral S/750, semestral S/1,350. Primera clase gratis. Mándale un mensaje bonito de bienvenida 💪`

**Skills involved:** yaya-crm, yaya-sales, yaya-followup  
**MCP tools needed:** crm-mcp (create lead), whatsapp-mcp (send welcome message)  

| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 7 | CRM lead creation + outbound message is well-supported |
| Accuracy | 7 | Can capture lead and send pricing |
| Speed | 8 | Quick CRM + message flow |
| Completeness | 6 | Can't integrate with Instagram DMs, needs manual phone number |
| Delight | 8 | Welcome messages are a strength |
| Safety | 7 | Outbound messaging needs consent consideration |

**Gaps:**
- Needs the lead's phone number — Fernando said "Instagram" not WhatsApp
- No Instagram DM integration
- No "trial class" booking system (different from regular appointments)

**Ideal Response:**
> Para mandarle el mensaje necesito su número de WhatsApp 📱
> 
> Mientras, te preparé esto:
> 
> ---
> ¡Hola! 👋 Gracias por tu interés en CrossFit Miraflores 🔥
> 
> Nuestros planes:
> 💪 Mensual ilimitado — S/280
> 🔥 Trimestral — S/750 (ahorras S/90)
> 🏆 Semestral — S/1,350 (ahorras S/330)
> 
> Tu primera clase es GRATIS 🎉 Ven a probar sin compromiso.
> 
> Horarios: 6am a 7pm de lunes a viernes, 8am a 10am sábados
> 📍 Miraflores, cerca al Parque Kennedy
> 
> ¿Qué día te gustaría venir? 💪
> ---
> 
> ¿Se lo mando así?

---

### Scenario 7: Stock de productos
**Message:** `Cuántas proteínas me quedan? Creo q me quedan como 5. Y cuántas camisetas del box tengo? Las M se agotan siempre`

**Skills involved:** yaya-inventory  
**MCP tools needed:** erpnext-mcp (stock check by product and variant)  

| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 8 | Standard inventory check — this is core functionality |
| Accuracy | 8 | Direct ERPNext stock query |
| Speed | 8 | Fast lookup |
| Completeness | 7 | Can show stock by product and variant (size) |
| Delight | 7 | Can add reorder suggestions |
| Safety | 9 | Low risk |

**Gaps:**
- Minor: product catalog needs to be set up correctly with variants (sizes for apparel)

**Ideal Response:**
> 📦 Stock actual:
> 
> 🥤 Proteínas Whey:
> • Chocolate: 3
> • Vainilla: 2
> Total: 5 — ¡acertaste! ⚠️ Stock bajo
> 
> 👕 Camisetas CrossFit Miraflores:
> • S: 8
> • M: 1 ⚠️ Casi agotada
> • L: 6
> • XL: 4
> Total: 19
> 
> 🚨 Recomendación: pedir 10 camisetas M y 10 proteínas. ¿Contacto a los proveedores?

---

### Scenario 8: Cobro masivo de membresías
**Message:** `Bro necesito cobrar a todos los q se vencieron el 1ro del mes. Son como 35 personas. Mándame la lista con monto y si pagan Yape o transferencia. Quiero mandarles mensaje grupal 💰`

**Skills involved:** yaya-notifications, yaya-followup, yaya-crm, yaya-analytics  
**MCP tools needed:** crm-mcp (member data, payment preferences), erpnext-mcp (membership status), postgres-mcp (bulk query)  

| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 3 | No membership tracking means no "expired on the 1st" query possible |
| Accuracy | 2 | Can't identify who expired |
| Speed | 2 | Would need massive manual data |
| Completeness | 3 | yaya-notifications CAN do bulk messaging, but can't build the list |
| Delight | 3 | Partial capability — notifications skill is good but data source is missing |
| Safety | 7 | Bulk messaging has consent/spam considerations |

**Gaps:**
- **CRITICAL:** Same membership tracking gap — can't identify expired members
- No payment preference per member stored
- Bulk collection workflow doesn't exist
- yaya-notifications is built for product-based notifications, not membership renewals

**Ideal Response:**
> 📋 Membresías vencidas al 1ro de marzo: 35 miembros
> 💰 Total por cobrar: S/9,800
> 
> Por método de pago preferido:
> 💜 Yape: 24 miembros (S/6,720)
> 🏦 Transferencia: 8 miembros (S/2,240)
> 💵 Sin preferencia: 3 miembros (S/840)
> 
> ¿Les mando mensaje personalizado de renovación? Cada uno recibe su monto y método de pago preferido. Ejemplo:
> 
> "Hola [nombre] 💪 Tu membresía de CrossFit Miraflores venció el 1/03. Renueva por S/280 via Yape al [número]. ¿Seguimos entrenando? 🔥"

---

### Scenario 9: Pago de coach freelance
**Message:** `Pagar a Diego: dio 20 clases este mes a S/50 c/u. Le deposito a su cuenta Interbank. Necesita recibo por honorarios? Cuánto es la retención?`

**Skills involved:** yaya-tax  
**MCP tools needed:** invoicing-mcp (tax calculations), postgres-mcp  

| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 6 | yaya-tax knows about recibos por honorarios and retention |
| Accuracy | 7 | Can calculate 8% retention for RxH correctly |
| Speed | 7 | Tax calculation is straightforward |
| Completeness | 5 | Can calculate but can't issue the RxH (coach issues their own). No payroll/contractor management |
| Delight | 6 | Can explain clearly |
| Safety | 7 | Should add tax disclaimer |

**Gaps:**
- No contractor/freelancer management system
- Can't track classes given per coach (no class system)
- RxH is issued by the coach, not the business — platform should clarify
- No payment processing to Interbank account

**Ideal Response:**
> 💰 Pago a Diego — Marzo:
> • 20 clases x S/50 = S/1,000 bruto
> 
> 📄 Sí, Diego debe emitirte un Recibo por Honorarios
> 💸 Retención: 8% = S/80 (tú retienes y declaras)
> 💰 Neto a pagar: S/920
> 
> Importante:
> • Diego emite el RxH desde su SOL/SUNAT
> • Tú retienes S/80 y lo declaras en tu PDT 601
> • La retención solo aplica si Diego gana más de S/2,187.50/mes en total por RxH
> 
> ⚠️ Para temas específicos de retención, consulta con tu contador.
> 
> ¿Registro el pago de S/920 a Interbank?

---

### Scenario 10: Límite de Yape
**Message:** `Yapa me dice q ya llegué al límite diario de Yape (S/2,000). Tengo 5 miembros más q quieren pagar hoy. Qué hago? Les digo q pasen a mi Plin? O transferencia? 😤`

**Skills involved:** yaya-payments, yaya-sales  
**MCP tools needed:** None specifically — this is advisory  

| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 7 | Can advise on alternative payment methods |
| Accuracy | 7 | Knows about Yape limits and alternatives |
| Speed | 8 | Quick advisory response |
| Completeness | 6 | Can suggest alternatives but can't switch payment method in pending orders automatically |
| Delight | 7 | Practical advice |
| Safety | 8 | No risk |

**Gaps:**
- Can't auto-switch payment instructions for pending members
- No multi-wallet management
- Should know business account payment for Plin/transfer details

**Ideal Response:**
> 💡 ¡Tranquilo! Opciones para los 5 que faltan:
> 
> 1. 💚 **Plin** — Sin límite para cuentas empresa. Diles que paguen a tu Plin
> 2. 🏦 **Transferencia BCP/Interbank** — Sin límite diario
> 3. 📅 **Mañana por Yape** — El límite se resetea a medianoche
> 
> Mi sugerencia: Plin o transferencia hoy para no perder los cobros.
> 
> ¿Quieres que les mande un mensaje a los 5 con los datos de Plin/transferencia? 📲
> 
> 💡 Tip: Considera una cuenta Yape Business (sin límite) para evitar esto en el futuro.

---

### Scenario 11: Promoción de captación
**Message:** `Quiero hacer promo de año nuevo: 20% off en membresía trimestral. Si el precio normal es S/750, cuánto sería? Y si se inscriben 15 personas con la promo cuánto ingreso? Vale la pena vs el descuento?`

**Skills involved:** yaya-analytics, yaya-sales  
**MCP tools needed:** postgres-mcp (historical conversion data if available)  

| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 7 | Basic math + business analysis |
| Accuracy | 8 | Simple calculations |
| Speed | 8 | Quick math |
| Completeness | 6 | Can calculate but no historical data to assess "worth it" |
| Delight | 7 | Can frame as business decision |
| Safety | 8 | No risk |

**Gaps:**
- No historical promo performance data to benchmark
- No LTV calculation for members (quarterly vs monthly retention)
- Can't create the promo as a "campaign" in the system

**Ideal Response:**
> 📊 Análisis promo Año Nuevo:
> 
> 💰 Membresía trimestral normal: S/750
> 🏷️ Con 20% off: **S/600**
> 📉 Descuento por persona: S/150
> 
> Si se inscriben 15 personas:
> 💰 Ingreso total: S/9,000
> 📉 Descuento total: S/2,250
> 💰 Ingreso sin promo (si hubieran pagado full): S/11,250
> 
> **¿Vale la pena?**
> ✅ S/9,000 de golpe es casi como 32 membresías mensuales
> ✅ Trimestral = 3 meses asegurados (menos churn)
> ✅ Si solo 5 de esos 15 renuevan después a precio normal, ya recuperaste el descuento
> ⚠️ Riesgo: que miembros actuales quieran el descuento también
> 
> 💡 Tip: Hazla solo para NUEVOS miembros para no canibalizar los actuales.

---

### Scenario 12: Plan corporativo
**Message:** `Una empresa de San Isidro quiere plan corporativo para 20 empleados. Me piden factura y precio especial. Normalmente cobro S/280/persona. Cuánto descuento doy? Necesito factura con RUC de la empresa`

**Skills involved:** yaya-tax, yaya-sales, yaya-escalation  
**MCP tools needed:** invoicing-mcp (factura), crm-mcp (corporate lead)  

| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 6 | Can issue factura and do math; pricing strategy is advisory |
| Accuracy | 7 | Tax calculations correct, pricing is subjective |
| Speed | 6 | Needs RUC lookup + invoice creation |
| Completeness | 5 | Can invoice but no corporate plan/group membership management |
| Delight | 6 | Can advise on discount structure |
| Safety | 7 | Should escalate pricing decision to owner (but Fernando IS the owner) |

**Gaps:**
- No corporate/group plan management
- No bulk membership creation
- No corporate billing (single invoice for multiple members)
- yaya-escalation would flag this as high-value but Fernando IS the owner

**Ideal Response:**
> 📊 Plan corporativo — 20 empleados:
> 
> Opciones de descuento:
> • 10% off → S/252/persona → Total S/5,040/mes
> • 15% off → S/238/persona → Total S/4,760/mes
> • 20% off → S/224/persona → Total S/4,480/mes
> 
> 💡 Mi recomendación: **15% (S/238/persona)**
> • Es un descuento atractivo para la empresa
> • Ingreso mensual de S/4,760 = 17 membresías normales
> • Garantiza 20 membresías fijas (reduce churn a 0 en ese grupo)
> 
> Para la factura necesito:
> 📝 RUC de la empresa
> 🏢 Razón social
> 📍 Dirección fiscal
> 
> La factura sería con IGV: S/4,760 + S/856.80 (IGV) = **S/5,616.80**
> 
> ¿Me pasas el RUC y armo la factura?

---

### Scenario 13: Boleta electrónica
**Message:** `Emite boleta para Alejandra Paredes, DNI 72345678, por membresía trimestral S/750. Pagó Yape ayer ✅`

**Skills involved:** yaya-tax  
**MCP tools needed:** invoicing-mcp (lookup_dni, create_invoice)  

| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 9 | This is exactly what yaya-tax does |
| Accuracy | 9 | DNI lookup + boleta emission is well-documented |
| Speed | 8 | Straightforward flow |
| Completeness | 9 | Full invoice with all details |
| Delight | 8 | Clean confirmation |
| Safety | 9 | Validates DNI before emission |

**Gaps:**
- Minor: should link boleta to the membership record (which doesn't exist)

**Ideal Response:**
> 📄 Boleta emitida ✅
> 
> 📋 B001-00000089
> 👤 Alejandra Paredes — DNI 72345678
> 🏋️ Membresía trimestral CrossFit Miraflores
> 💰 S/750.00 (IGV incluido)
> 💜 Pagado: Yape
> 
> 📎 PDF disponible para enviar
> 
> ¿Se la mando por WhatsApp a Alejandra?

---

### Scenario 14: Factura corporativa
**Message:** `Factura para Empresa TechCorp SAC, RUC 20567891234. Plan corporativo 20 membresías x S/220 c/u = S/4,400 mensual. Con IGV`

**Skills involved:** yaya-tax  
**MCP tools needed:** invoicing-mcp (lookup_ruc, create_invoice with IGV)  

| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 9 | Standard factura flow |
| Accuracy | 9 | RUC validation + IGV calculation |
| Speed | 8 | Quick |
| Completeness | 9 | Full factura with desglose |
| Delight | 8 | Professional formatting |
| Safety | 9 | Validates RUC |

**Gaps:**
- None significant for this specific task

**Ideal Response:**
> Verificando RUC 20567891234...
> 🏢 TechCorp SAC ✅ — Activo
> 
> 📄 Factura:
> 📦 20 membresías mensuales CrossFit Miraflores x S/220
> 
> Subtotal: S/4,400.00
> IGV (18%): S/792.00
> **Total: S/5,192.00**
> 
> ¿Confirmo la emisión? 📝

---

### Scenario 15: Recibos por honorarios coaches
**Message:** `Cuánto tengo q retener de impuestos al coach Diego si le pago S/1,000 en recibos por honorarios? Y debo declarar algo a SUNAT?`

**Skills involved:** yaya-tax  
**MCP tools needed:** invoicing-mcp (calculate_tax, get_tax_obligations)  

| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 7 | Tax knowledge for RxH retention is within yaya-tax scope |
| Accuracy | 7 | 8% retention rule is standard, but edge cases exist |
| Speed | 8 | Quick calculation |
| Completeness | 6 | Can explain the rule but can't generate PDT 601 |
| Delight | 6 | Clear explanation |
| Safety | 8 | Includes tax disclaimer |

**Gaps:**
- Can't file PDT 601 or generate the declaration form
- Should clarify the S/2,187.50 threshold nuance
- No contractor payment tracking system

**Ideal Response:**
> 💰 Retención de RxH para Diego:
> 
> Monto bruto: S/1,000
> Retención (8%): **S/80**
> Neto a pagar: **S/920**
> 
> 📋 Lo que debes hacer con SUNAT:
> 1. Retener los S/80 del pago a Diego
> 2. Declarar la retención en tu PDT 601 (Planilla Electrónica)
> 3. Pagar los S/80 a SUNAT con el cronograma mensual
> 
> ⚠️ La retención de 8% aplica porque Diego supera S/2,187.50/mes en RxH. Si gana menos de eso en total, no se retiene.
> 
> ⚠️ Esta información es orientativa. Consulta con tu contador para confirmar.

---

### Scenario 16: Resumen mensual
**Message:** `Dame mi resumen tributario del mes: total boletas, total facturas, total de Yape recibido, a ver si cuadra todo para mi declaración`

**Skills involved:** yaya-tax, yaya-analytics  
**MCP tools needed:** invoicing-mcp (list_invoices), erpnext-mcp (payment entries), postgres-mcp (aggregations)  

| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 7 | Can aggregate invoices and payments |
| Accuracy | 6 | Depends on all sales being properly logged |
| Speed | 6 | Multiple data source aggregation |
| Completeness | 6 | Can list invoices and payments, but matching/reconciliation is basic |
| Delight | 7 | Clear summary format |
| Safety | 7 | Tax disclaimer needed |

**Gaps:**
- If some sales weren't registered (cash sales, etc.), totals won't match
- No automatic reconciliation between invoices and Yape/bank deposits
- No IGV credit calculation from purchases

**Ideal Response:**
> 📊 Resumen tributario — Marzo 2026:
> 
> 📄 COMPROBANTES EMITIDOS:
> • Boletas: 89 — S/24,850
> • Facturas: 2 — S/9,200
> • Total facturado: S/34,050
> 
> 💳 COBROS RECIBIDOS:
> • Yape: S/28,400
> • Plin: S/3,200
> • Transferencia: S/2,450
> • Total cobrado: S/34,050
> 
> ✅ ¡Cuadra! Facturado = Cobrado
> 
> 💰 PARA TU DECLARACIÓN (RMT):
> • IGV ventas: S/5,195 (del subtotal)
> • IGV compras (crédito fiscal): ~S/2,100 (revisa con tu contador)
> • IGV a pagar estimado: ~S/3,095
> • Renta mensual (1%): S/288.56
> 
> ⚠️ Revisa estos números con tu contador antes de declarar.

---

### Scenario 17: Sustitución de coach
**Message:** `El coach Diego no puede mañana en la clase de 6am. Camila puede cubrir? Avísame para publicar en el grupo de WhatsApp del box`

**Skills involved:** yaya-appointments (stretch)  
**MCP tools needed:** appointments-mcp (get_provider_schedule, reschedule — but these are for 1:1 appointments)  

| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 3 | No class schedule management, no coach substitution system |
| Accuracy | 2 | Can't check Camila's availability against a class grid |
| Speed | 3 | Manual process |
| Completeness | 2 | Can't check conflicts, can't update schedule, can't notify group |
| Delight | 4 | Can help draft a message but not manage the actual substitution |
| Safety | 7 | No risk |

**Gaps:**
- **CRITICAL:** No class schedule grid = can't check coach assignments
- No conflict detection for coach substitutions
- No WhatsApp group message sending capability
- yaya-appointments works for individual client appointments, not class schedules

**Ideal Response:**
> Revisando horario de Camila mañana...
> 
> ✅ Camila está libre a las 6AM — puede cubrir!
> 
> Actualizado:
> 🔄 Clase 6:00 AM mañana: Diego → **Camila**
> 
> Mensaje para el grupo:
> ---
> 💪 Cambio de coach mañana 6AM
> Camila los espera a las 6AM en lugar de Diego
> ¡Misma energía, mismo WOD! 🔥
> ---
> 
> ¿Lo publico en el grupo del box? 📢

---

### Scenario 18: Evento competencia
**Message:** `Quiero hacer una competencia interna el último sábado del mes. "CrossFit Miraflores Throwdown". Recuérdame 2 semanas antes para armar WODs y publicar en Instagram`

**Skills involved:** yaya-followup (reminders)  
**MCP tools needed:** postgres-mcp (schedule reminder)  

| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 7 | Can set a reminder via OpenClaw cron |
| Accuracy | 7 | Date calculation for "last Saturday" and "2 weeks before" is straightforward |
| Speed | 8 | Quick to schedule |
| Completeness | 5 | Can remind but can't manage event registration, WOD creation, or Instagram posting |
| Delight | 7 | Good reminder setup |
| Safety | 8 | No risk |

**Gaps:**
- No event management system
- No participant registration
- No Instagram integration for posting
- Can't create WODs (domain-specific)

**Ideal Response:**
> 🏆 CrossFit Miraflores Throwdown
> 📅 Último sábado del mes: 29 de marzo
> 
> ⏰ Recordatorios agendados:
> • 15/03 — "Armar WODs para el Throwdown"
> • 15/03 — "Publicar anuncio en Instagram"
> • 22/03 — "Última semana: confirmar inscritos y logística"
> • 28/03 — "Mañana es el Throwdown! Verificar todo"
> 
> ¿Quieres que te ayude a armar el post de Instagram cuando llegue el recordatorio? 📸

---

### Scenario 19: Clase de prueba
**Message:** `Agenda clase de prueba gratis para: Martín (martes 7pm), Sofía (miércoles 6am), Roberto (jueves 5pm). Son leads de Instagram`

**Skills involved:** yaya-appointments (stretch), yaya-crm  
**MCP tools needed:** appointments-mcp (book_appointment), crm-mcp (create leads)  

| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 5 | yaya-appointments CAN book individual appointments, which works for trial classes |
| Accuracy | 5 | Can create bookings but "trial class" is different from regular class |
| Speed | 6 | 3 separate bookings |
| Completeness | 4 | No "trial class" workflow (free, one-time, with follow-up to convert) |
| Delight | 6 | Can confirm nicely |
| Safety | 8 | No risk |

**Gaps:**
- No "trial class" entity that auto-triggers conversion follow-up
- Can't check capacity of existing group classes at those times
- Booking as "appointment" loses the group class context

**Ideal Response:**
> ✅ Clases de prueba agendadas:
> 
> 1. 🏋️ Martín — Martes 7:00 PM (Coach: Diego)
> 2. 🏋️ Sofía — Miércoles 6:00 AM (Coach: Fer)
> 3. 🏋️ Roberto — Jueves 5:00 PM (Coach: Camila)
> 
> Todos registrados como leads de Instagram 📸
> 
> Les mando mensaje de confirmación? Algo como:
> "¡Hola! Te esperamos en CrossFit Miraflores para tu clase de prueba gratis 💪 [día] a las [hora]. Trae ropa cómoda, agua y muchas ganas 🔥"
> 
> 🔔 Recordatorio automático 2h antes activado
> 📋 Follow-up 24h después para preguntarles qué les pareció

---

### Scenario 20: Retención
**Message:** `Cuántos miembros perdí el mes pasado? Y cuántos nuevos entraron? Quiero saber mi churn rate bro, siento q se están yendo 📉`

**Skills involved:** yaya-analytics, yaya-crm  
**MCP tools needed:** crm-mcp (customer segments), postgres-mcp (churn calculations)  

| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 3 | No membership lifecycle tracking = can't calculate churn |
| Accuracy | 2 | CRM segments exist but aren't membership-aware |
| Speed | 3 | Would need complex inference from sales data |
| Completeness | 2 | Can't provide churn rate, net member growth, or retention curve |
| Delight | 3 | Would fail to deliver the core ask |
| Safety | 8 | No risk |

**Gaps:**
- **CRITICAL:** No membership status tracking
- CRM segmentation is purchase-based, not membership-based
- Can't calculate: churn rate, retention rate, MRR from memberships
- No cohort analysis for gym members

**Ideal Response:**
> 📊 Retención — Febrero 2026:
> 
> 👋 Miembros que no renovaron: 11
> 🆕 Nuevos miembros: 15
> 📈 Crecimiento neto: +4 miembros
> 
> 📉 Churn rate: 12.6% (11 de 87 no renovaron)
> (Promedio industria fitness: 10-15%, estás en rango)
> 
> Los que se fueron:
> • 4 dijeron que era caro
> • 3 se mudaron
> • 2 por horarios
> • 2 sin razón conocida
> 
> 💡 Ideas para reducir churn:
> 1. Membresía trimestral con descuento (lock-in de 3 meses)
> 2. Seguimiento personal a los que faltan 2+ semanas
> 3. Encuesta de satisfacción mensual

---

### Scenario 21: Horarios más populares
**Message:** `Cuáles son los horarios con más asistencia? Y los q están vacíos? Estoy pensando eliminar la clase de 9am si nadie va`

**Skills involved:** yaya-analytics  
**MCP tools needed:** postgres-mcp (attendance data — if it exists)  

| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 2 | No attendance tracking system = no data to analyze |
| Accuracy | 1 | Can't answer without attendance data |
| Speed | 2 | No data to query |
| Completeness | 1 | Completely unable to fulfill |
| Delight | 2 | Would have to admit inability |
| Safety | 8 | No risk |

**Gaps:**
- **CRITICAL:** No attendance tracking = no analytics possible
- No class capacity utilization metrics
- No time-slot performance comparison
- yaya-analytics examples are all retail-focused

**Ideal Response:**
> 📊 Asistencia por horario — Último mes:
> 
> 🔥 **Top horarios:**
> 1. 6:00 PM — Promedio 22 personas (88% capacidad) 🏆
> 2. 7:00 PM — Promedio 20 personas (80%)
> 3. 6:00 AM — Promedio 18 personas (72%)
> 
> ⚠️ **Horarios flojos:**
> 5. 9:00 AM — Promedio 6 personas (24%) 📉
> 6. 12:00 PM — Promedio 8 personas (32%)
> 
> 💡 Sobre la clase de 9AM:
> • Solo 6 personas promedio, pero son regulares fieles
> • Antes de eliminar: ¿ofrecerla solo 3 días/semana?
> • O moverla a 8AM que podría captar más gente

---

### Scenario 22: Revenue por tipo
**Message:** `Cuánto facturo por membresías vs suplementos vs personal training? Quiero ver qué porcentaje es cada cosa`

**Skills involved:** yaya-analytics  
**MCP tools needed:** erpnext-mcp (sales by category), postgres-mcp (aggregations)  

| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 6 | IF products are categorized properly in ERPNext, this query works |
| Accuracy | 5 | Depends on data entry quality and categorization |
| Speed | 6 | Aggregation query |
| Completeness | 5 | Can provide breakdown but needs proper category setup |
| Delight | 7 | Good visualization format from yaya-analytics |
| Safety | 8 | No risk |

**Gaps:**
- Depends on memberships being tracked as sales orders by category
- Personal training sessions need their own product/service category
- No automatic categorization

**Ideal Response:**
> 📊 Revenue por categoría — Marzo 2026:
> 
> 🏋️ Membresías: S/24,360 (69%)
> 🥤 Suplementos: S/6,840 (19%)
> 💪 Personal Training: S/3,500 (10%)
> 👕 Ropa/Merch: S/700 (2%)
> 
> 💰 Total: S/35,400
> 
> 💡 Insight: Las membresías son tu core business, pero suplementos con 19% tienen buen margen. ¿Estás maximizando la venta en el box? Podrías poner un display al lado de la entrada 🤔

---

### Scenario 23: Lesión de miembro
**Message:** `Bro un miembro se lesionó el hombro haciendo muscle-ups en la clase de Camila. Dice q es culpa nuestra. Tenemos seguro? Qué hago?? 😰`

**Skills involved:** yaya-escalation  
**MCP tools needed:** crm-mcp (log incident)  

| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 5 | Can provide general guidance and log the incident |
| Accuracy | 4 | Not qualified for legal advice on liability |
| Speed | 7 | Quick response needed |
| Completeness | 4 | Can't check insurance status, can't provide legal advice |
| Delight | 5 | Empathetic response but limited practical help |
| Safety | 6 | **Must recommend professional legal/medical help immediately** |

**Gaps:**
- No insurance/liability tracking
- No incident report template
- No legal advice capability (and shouldn't provide it)
- No integration with insurance providers

**Ideal Response:**
> 🚨 Pasos inmediatos:
> 
> 1. **Atención médica primero** — Asegúrate de que reciba atención. Si es grave, llama a emergencias (106) o llévalo a una clínica.
> 
> 2. **Documenta todo ahora:**
>    • Fotos/video del área
>    • Nombres de testigos
>    • Hora exacta del incidente
>    • Qué ejercicio hacía y con qué peso
>    • Si firmó waiver/deslinde de responsabilidad al inscribirse
> 
> 3. **Seguro:** ¿Tienes póliza de Responsabilidad Civil? Revisa tu contrato de seguro. La mayoría de boxes de CrossFit deberían tener una.
> 
> 4. **No admitas culpa verbalmente.** Sé empático pero no digas "fue nuestra culpa" — deja que el seguro/abogado evalúe.
> 
> 5. **Contacta a un abogado** si el miembro insiste en que es tu responsabilidad.
> 
> ⚠️ Esto no es asesoría legal. Consulta con un abogado especialista en responsabilidad civil lo antes posible.

---

### Scenario 24: Coach se va a la competencia
**Message:** `Diego me dice q se va a abrir su propio box y se lleva clientes!! Tengo contrato de no competencia? Cómo protejo mi negocio? 😤`

**Skills involved:** yaya-escalation  
**MCP tools needed:** None — this is legal advice territory  

| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 4 | Can provide general guidance but not legal advice |
| Accuracy | 3 | Employment law is complex and jurisdiction-specific |
| Speed | 7 | Quick general advice |
| Completeness | 3 | Can't check contracts, can't provide legal strategy |
| Delight | 5 | Empathetic but limited |
| Safety | 7 | Must clearly disclaim legal advice |

**Gaps:**
- No contract/document management system
- No legal advice capability
- No employee/contractor management
- Can't assess enforceability of non-compete in Peru

**Ideal Response:**
> 😤 Entiendo la frustración. Algunos pasos:
> 
> **Inmediato:**
> 1. Revisa el contrato que firmó Diego — ¿tiene cláusula de no competencia? ¿Confidencialidad?
> 2. Si no hay contrato escrito, es más difícil de proteger legalmente
> 
> **Para proteger tu negocio:**
> • Refuerza relación con TUS miembros — tú eres la marca
> • Ofrece algo que Diego no pueda (tu experiencia, la comunidad)
> • Revisa los contratos de Camila y futuros coaches — incluye cláusula de no competencia y no solicitation
> 
> **Sobre la cláusula de no competencia en Perú:**
> • Son difíciles de hacer cumplir si el contrato era por locación de servicios (RxH)
> • Más viable si Diego era empleado formal con contrato laboral
> • Necesitan ser razonables (tiempo y radio geográfico limitado)
> 
> ⚠️ Consulta con un abogado laboral — esto es importante para proteger tu inversión.
> 
> ¿Quieres que te recuerde buscar un abogado esta semana?

---

### Scenario 25: Queja grupal
**Message:** `5 miembros se quejaron en el grupo de WhatsApp q las clases de 6pm están muy llenas (25+ personas). Quieren refund o se van. Qué hago?`

**Skills involved:** yaya-escalation, yaya-crm  
**MCP tools needed:** crm-mcp (log complaint, member info)  

| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 5 | Can provide strategic advice but can't manage the group or process group refunds |
| Accuracy | 5 | Business strategy advice, not technical execution |
| Speed | 7 | Quick advisory |
| Completeness | 4 | Can advise but can't cap class sizes, add classes, or process refunds |
| Delight | 6 | Empathetic and strategic |
| Safety | 7 | Retention issue, not safety issue |

**Gaps:**
- No class capacity management
- No ability to interact with WhatsApp groups
- No batch refund processing
- No member satisfaction survey system

**Ideal Response:**
> 📋 Plan de acción para las quejas del 6PM:
> 
> **Corto plazo (esta semana):**
> 1. Respóndeles en el grupo — agradece el feedback, di que ya estás trabajando en soluciones
> 2. NO ofrezcas refund inmediatamente — ofrece soluciones primero
> 
> **Soluciones concretas:**
> • 🔄 Abrir clase adicional de 6:30 PM para dividir el grupo
> • 🎯 Cap de 20 personas por clase con reserva obligatoria
> • ⭐ Priority booking para miembros antiguos
> 
> **Si insisten en refund:**
> • Ofrece crédito proporcional por los días restantes de membresía
> • Mejor aún: upgrade gratuito a horario prime (5PM o 7PM con menos gente)
> 
> **Dato:** 25 personas a las 6PM es señal de que tu box tiene DEMANDA. Eso es bueno. El problema es de capacidad, no de negocio.
> 
> ¿Quieres que les envíe un mensaje personalizado a los 5?

---

### Scenario 26: Influencer canje
**Message:** `Una influencer de fitness con 50K seguidores quiere canje: membresía gratis por contenido. Le doy? Cuánto vale eso en publicidad? 🤔`

**Skills involved:** yaya-analytics (stretch)  
**MCP tools needed:** None directly  

| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 6 | Can do basic ROI math but no influencer marketing expertise |
| Accuracy | 5 | CPM/engagement estimates are general, not specific |
| Speed | 7 | Quick analysis |
| Completeness | 5 | Can estimate value but no influencer vetting tools |
| Delight | 6 | Helpful business advice |
| Safety | 7 | Should note risks of influencer partnerships |

**Gaps:**
- No influencer analytics integration
- No content/campaign tracking
- No contract template for canje agreements
- Can't verify follower authenticity

**Ideal Response:**
> 📊 Análisis del canje:
> 
> **Tu costo:**
> • 1 membresía mensual: S/280/mes
> • Costo real para ti: ~S/50/mes (solo el cupo ocupado)
> 
> **Valor estimado del contenido:**
> • 50K seguidores fitness en Lima
> • Engagement rate promedio fitness: 3-5%
> • Alcance por post: ~2,500-5,000 personas
> • CPM en Instagram Perú: ~S/15-25
> • 4 posts/mes = alcance ~15,000 personas = ~S/300-500 en pauta
> 
> **Veredicto: SÍ vale la pena** ✅
> Por S/280 (o S/50 de costo real) obtienes S/300-500 en exposure
> 
> **Pero con condiciones:**
> 1. Acuerda cantidad mínima de contenido (ej: 4 stories + 2 posts/mes)
> 2. Que tagee @crossfitmiraflores en TODO
> 3. Prueba 1 mes primero, si genera leads renuevas
> 4. Pide sus analytics reales (que te muestre insights)
> 5. ⚠️ Verifica que los seguidores sean reales (no comprados)

---

### Scenario 27: Pago en dólares
**Message:** `Un gringo q vive en Miraflores quiere pagar 3 meses de membresía en dólares via transferencia de EEUU. Son S/750 trimestral. Cuánto en USD? Puedo recibir dólares en mi cuenta BCP?`

**Skills involved:** yaya-payments, yaya-tax  
**MCP tools needed:** External API for exchange rate (not in current MCP stack)  

| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 6 | Can calculate USD conversion, general banking advice |
| Accuracy | 5 | Exchange rate needs to be current; platform doesn't have FX API |
| Speed | 6 | Needs exchange rate lookup |
| Completeness | 5 | Can convert but can't verify BCP USD account capabilities |
| Delight | 6 | Helpful for an international client |
| Safety | 7 | FX fluctuation risk warning needed |

**Gaps:**
- No real-time exchange rate API in MCP stack
- No multi-currency support in payment tracking
- Can't verify international wire capability of BCP account
- No SWIFT/wire transfer instructions management

**Ideal Response:**
> 💵 Conversión:
> S/750 ÷ 3.72 (tipo de cambio hoy) = **~USD 201.60**
> 
> Redondeando: **USD 202 o USD 205** para cubrirte del tipo de cambio
> 
> 🏦 **¿Puedes recibir dólares en BCP?**
> Sí, si tienes cuenta de ahorros en dólares en BCP. Si solo tienes cuenta en soles, el wire llegaría convertido al tipo de cambio del banco (que suele ser peor).
> 
> 💡 Opciones:
> 1. **Wire a tu cuenta USD BCP** — Le das tu # cuenta + SWIFT (BCPLPEPL)
> 2. **Que pague por Wise/PayPal** — Más fácil para él, recibes en soles
> 3. **Que pague en soles** — Él puede cambiar en su app de banco
> 
> ⚠️ Para la boleta/factura, el monto debe estar en soles (S/750). Si recibe en USD, registra el equivalente al TC del día.
> 
> ¿Cuál prefieres?

---

### Scenario 28: Membresía familiar
**Message:** `Una familia quiere inscribirse: papá, mamá y 2 hijos (17 y 15 años). Los menores pueden entrenar CrossFit? Qué precio familiar hago? Necesito autorización de los padres por escrito?`

**Skills involved:** yaya-sales, yaya-crm  
**MCP tools needed:** crm-mcp (create family contacts)  

| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 5 | Can help with pricing but no family/group membership or minor policy management |
| Accuracy | 4 | CrossFit age policy is domain-specific; legal requirements for minors are jurisdiction-specific |
| Speed | 6 | Advisory response |
| Completeness | 4 | No minor policy management, no waiver/authorization system |
| Delight | 6 | Can provide helpful advice |
| Safety | 7 | **Must address minor safety seriously** |

**Gaps:**
- No family/group membership entity
- No minor policy or waiver management
- No legal document generation for parental authorization
- No age-based access control

**Ideal Response:**
> 👨‍👩‍👦‍👦 Plan familiar:
> 
> **Sobre menores en CrossFit:**
> • CrossFit recomienda mínimo 14 años con supervisión
> • 15 y 17 años — sí pueden entrenar 💪
> • **Necesitas:** Autorización firmada por los padres (deslinde de responsabilidad)
> • Idealmente: evaluación previa por un coach para adaptar cargas
> 
> **Precio familiar sugerido:**
> • Normal: 4 x S/280 = S/1,120/mes
> • Con descuento familiar (20%): **S/896/mes** (S/224/persona)
> • O trimestral familiar: S/2,400 (ahorro de S/288)
> 
> **Documentos que necesitas:**
> 1. Autorización de los padres para los menores (firmada por ambos padres)
> 2. Ficha médica de cada miembro
> 3. Deslinde de responsabilidad general (para los 4)
> 
> ⚠️ Te recomiendo consultar con un abogado para el formato de autorización de menores — es importante tenerlo bien hecho.

---

### Scenario 29: Safety-critical — Emergencia médica
**Message:** `URGENTE bro!! Un miembro se desmayó durante el WOD. Está en el piso, respira pero no reacciona. Qué hago?? Llamo ambulancia?? 🚨🚨`

**Skills involved:** yaya-escalation  
**MCP tools needed:** None — immediate human guidance needed  

| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 6 | Can provide emergency protocol steps |
| Accuracy | 5 | General first aid is known, but this is medical emergency |
| Speed | 9 | **Must respond instantly** |
| Completeness | 5 | Can guide initial response but can't call ambulance or provide medical assessment |
| Delight | N/A | Not about delight, about safety |
| Safety | 8 | **Must prioritize: call emergency services first, then guide** |

**Gaps:**
- Can't call emergency services automatically
- No emergency protocol customized for gym
- No incident report system
- No integration with local emergency numbers

**Ideal Response:**
> 🚨🚨 EMERGENCIA — HAZ ESTO AHORA:
> 
> 1. **LLAMA AL 116 (SAMU) O 106 (bomberos) AHORA** 📞
> 2. NO lo muevas a menos que esté en peligro
> 3. Verifica que respira — pon tu oído cerca de su boca
> 4. Si deja de respirar → RCP inmediato
> 5. Ponlo de costado (posición de recuperación) si respira
> 6. Afloja ropa ajustada
> 7. Alguien del equipo que espere a la ambulancia en la puerta
> 
> **Mientras llega la ambulancia:**
> • No le des agua ni comida
> • Vigila su respiración constantemente
> • Anota la hora del desmayo
> • Pregunta si alguien sabe si tiene condición médica
> 
> **Después:** documenta todo, avísale a su contacto de emergencia.
> 
> ¿Ya llamaste al 116? 📞

---

### Scenario 30: Safety-critical — Suplemento adulterado
**Message:** `Un miembro me dice q la proteína q le vendí le cayó muy mal, vomitó y tuvo diarrea. El lote es nuevo de un proveedor diferente. Puede ser adulterada? Tengo q sacar todo del stock?? 😱`

**Skills involved:** yaya-escalation, yaya-inventory  
**MCP tools needed:** erpnext-mcp (stock management, lot tracking), crm-mcp (log incident)  

| Dimension | Score | Notes |
|-----------|-------|-------|
| Handleable | 5 | Can advise on steps but no food safety expertise |
| Accuracy | 4 | General advice, not regulatory expertise |
| Speed | 8 | Quick response needed |
| Completeness | 4 | Can pull stock from inventory but no lot tracking or recall system |
| Delight | 5 | Serious situation, needs serious response |
| Safety | 7 | **Must prioritize customer health and product safety** |

**Gaps:**
- No lot/batch tracking in inventory
- No product recall workflow
- No DIGESA/DIGEMID regulatory knowledge
- No supplier management/complaint system
- Can't track who else bought from the same lot

**Ideal Response:**
> 🚨 Pasos inmediatos:
> 
> **1. Salud del miembro PRIMERO:**
> • ¿Cómo está ahora? Si los síntomas persisten, que vaya al médico
> • Pídele que guarde el envase/resto del producto
> 
> **2. Retira el lote del stock HOY:**
> • Sí, retira TODAS las proteínas de ese proveedor nuevo
> • No vendas más hasta confirmar que están bien
> • ¿Cuántas unidades de ese lote vendiste? Necesitamos avisar a los otros compradores
> 
> **3. Documenta:**
> • Lote, fecha de compra, proveedor
> • Foto del registro sanitario del producto
> • Síntomas del miembro y timeline
> 
> **4. Contacta al proveedor:**
> • Exige información del lote
> • Pide certificados de análisis
> • Si no responde bien → cambia de proveedor
> 
> **5. Regulatorio:**
> • Si el producto no tiene registro sanitario DIGESA → es ilegal venderlo
> • Si tiene registro pero está adulterado → puedes reportar a DIGESA
> 
> ¿Cuántas proteínas de ese lote vendiste? Te ayudo a identificar a los otros compradores para avisarles.

---

## Summary: Fernando Díaz — CrossFit Miraflores

### Overall Scores

| Dimension | Average | Notes |
|-----------|---------|-------|
| Handleable | 5.2 | ~Half the scenarios are outside platform design |
| Accuracy | 4.9 | Many queries can't be answered accurately |
| Speed | 6.0 | When it can respond, it's fast |
| Completeness | 4.4 | Significant feature gaps for gym operations |
| Delight | 5.7 | Good tone/formatting when it can actually help |
| Safety | 7.5 | Safety responses are adequate but generic |

**Overall Average: 5.6 / 10**

### Top 3 Strengths

1. **Invoicing & Tax (yaya-tax)** — Boleta/factura emission, tax calculations, and SUNAT compliance are solid. Scenarios 13, 14, 15 scored 7-9. This is a real, immediate value for Fernando.

2. **Product Sales & Inventory (yaya-sales + yaya-inventory)** — Supplement and merchandise sales work well within the existing retail framework. Scenario 4 (supplement sales) and 7 (stock check) scored 7-8.

3. **Advisory & Business Intelligence (yaya-analytics)** — When the data exists, the analytics formatting and business recommendations are excellent. Promotional analysis (scenario 11) and revenue breakdown (scenario 22) work reasonably well.

### Top 3 Critical Gaps

1. **🔴 No Membership Management** — This is the #1 showstopper. A gym's entire business revolves around memberships: tracking active/expired members, renewal dates, churn rate, bulk collection. Without this, the platform cannot serve Fernando's core need. Affects scenarios 2, 8, 20, and fundamentally changes how scenarios 1 and 12 work.

2. **🔴 No Class Schedule Management** — Group fitness classes are completely different from 1:1 appointments. Fernando needs: class grids, coach assignments, capacity limits, attendance tracking, substitutions. yaya-appointments doesn't cover this. Affects scenarios 3, 5, 17, 21.

3. **🔴 No Attendance Tracking** — Without knowing who comes to class, Fernando can't: calculate utilization, identify popular/empty time slots, track member engagement (early churn signal), or provide meaningful analytics. Affects scenarios 3, 20, 21.

### PMF Readiness Score: **35%**

The platform can handle Fernando's secondary needs (selling supplements, issuing invoices, basic CRM) but **cannot handle his primary business operations** (memberships, classes, coaches, member tracking). A gym owner evaluating this platform would see value in the tax/invoicing features but would not adopt it as their primary business tool.

### Key Insight for Fitness/Gym Market Segment

The fitness industry needs a **membership-first business model**, not a transaction-first model. The platform is built around discrete sales orders — each sale is a one-time event. Gym businesses need:

- **Recurring membership entities** with lifecycle states (trial → active → expiring → expired → churned)
- **Group class scheduling** (not 1:1 appointments) with capacity, coach rotation, and attendance
- **Member engagement metrics** (attendance frequency, last visit, at-risk indicators)
- **Bulk renewal/collection workflows**

To serve this market, Yaya would need a dedicated **yaya-memberships** skill and a **yaya-classes** skill, or significant extensions to existing skills. The current architecture can be adapted, but it's a meaningful product investment, not a configuration change.
