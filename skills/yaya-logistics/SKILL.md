# yaya-logistics — Shipping, Courier Integration & Delivery Management

## Description
WhatsApp-native shipping and delivery management for LATAM SMBs that ship products. Covers courier rate comparison (Olva, Shalom, Cruz del Sur, 99 Minutos, Rappi), shipment creation, guía de remisión generation (SUNAT requirement), real-time tracking, customer WhatsApp notifications, delivery confirmation with proof, contra-entrega (COD) cash collection, returns/failed delivery handling, bulk dispatch processing, and delivery cost tracking. Supports businesses with their own delivery drivers (motoboys) alongside third-party couriers.

**The #1 gap after Round 4 testing:** 16/20 personas need shipping — e-commerce sellers, ferreterías doing deliveries, wholesale distributors, retail shops shipping to provinces. Today, business owners manually call couriers, hand-write guías de remisión, WhatsApp tracking numbers to customers one by one, and lose track of COD collections. A single ferretería shipping 15 orders/day spends 2+ hours on logistics paperwork alone.

**Peru logistics reality:** Lima metropolitana expects same-day or next-day delivery. Provinces are 2-5 days via Olva/Shalom, or cheaper via bus cargo (Cruz del Sur). Contra-entrega is the dominant payment method for e-commerce (~60% of orders). Guía de remisión is a SUNAT legal requirement for transporting goods — businesses get fined without it. Most MYPEs have no logistics system — they use notebooks, WhatsApp groups, and memory.

## When to Use
- Business owner asks about shipping costs ("¿cuánto cuesta enviar a Arequipa?", "¿cuánto sale el envío?")
- Business owner wants to compare couriers ("¿qué me conviene, Olva o Shalom?", "¿cuál es más barato?")
- Business owner creates a shipment ("envía el pedido #234 a Trujillo", "despacha esto por Olva")
- Business owner needs a guía de remisión ("hazme la guía de remisión", "necesito la guía para SUNAT")
- Customer or owner asks about tracking ("¿dónde está mi pedido?", "¿ya llegó el envío de la Sra. González?")
- Business owner wants to notify customer ("avísale al cliente que ya salió su pedido")
- A delivery is confirmed or failed ("el pedido llegó", "el cliente no estaba", "dirección incorrecta")
- Business owner needs to process COD collections ("¿cuánto me deben de contra-entregas?", "¿ya cobraron?")
- Business owner handles returns ("el cliente devolvió el pedido", "quiere cambio")
- Business owner dispatches multiple orders ("tengo 20 pedidos para hoy, procesa todo")
- Business owner coordinates own drivers ("el moto sale a las 3", "asigna las entregas de hoy")
- Business owner asks about shipping costs as expenses ("¿cuánto gasté en envíos este mes?")
- A tracking status update arrives from a courier (proactive notification)
- Business owner needs to ship internationally ("tengo que enviar a Colombia por DHL")
- Business owner wants delivery zone/timing info ("¿cuánto demora a Cusco?", "¿llega hoy a Miraflores?")

## Target Users (by volume, largest first)
- **E-commerce sellers** (200K+) — Ship daily via multiple couriers, need rate comparison, bulk dispatch, COD tracking
- **Ferreterías** (100K+) — Heavy/bulky items, own delivery trucks + courier for provinces, guía de remisión critical
- **Tiendas/retail** (500K+) — Ship to customers in provinces, mostly Olva/Shalom, heavy COD usage
- **Wholesale distributors** — Large shipments, bus cargo (Cruz del Sur), multi-destination dispatch
- **Restaurants with delivery** (143K+) — Own motoboys for local delivery, Rappi integration for on-demand
- **Any business** that sends products to customers beyond walk-in pickup

## Capabilities

### Core: Courier Rate Lookup
- **Instant quote** — "¿Cuánto cuesta enviar 5 kg a Arequipa por Olva?" → Queries courier rate tables by weight, dimensions, origin, destination
- **Zone-based pricing** — Lima metropolitana, Lima provincias, costa, sierra, selva — each with different rates and transit times
- **Weight & dimension calculation** — "Tengo una caja de 40x30x20 cm, pesa 3 kg" → volumetric vs actual weight, uses the higher
- **Product catalog integration** — If product dimensions/weight are in ERPNext, auto-calculate: "El pedido #234 tiene 3 items, peso total 7.2 kg"
- **Surcharges included** — Insurance, COD fee, rural delivery surcharge, declared value — all factored into the quote

### Core: Multi-Courier Comparison
- **Side-by-side comparison** — Compare up to 5 couriers for the same shipment:
  ```
  📦 Envío: 5 kg a Arequipa

  🚚 Olva Courier
     💰 S/18.50  |  📅 2-3 días  |  ✅ COD disponible
     📍 Cobertura: toda la ciudad

  🚚 Shalom
     💰 S/15.00  |  📅 3-4 días  |  ✅ COD disponible
     📍 Cobertura: zona urbana

  🚌 Cruz del Sur Cargo
     💰 S/12.00  |  📅 2-3 días  |  ❌ Sin COD
     📍 Recojo en terminal

  ⚡ 99 Minutos (solo Lima)
     ❌ No disponible para Arequipa

  💡 Recomendación: Olva si necesitas COD y entrega a domicilio.
     Cruz del Sur si el cliente puede recoger en terminal y ahorras S/6.50.
  ```
- **Smart recommendation** — Factors in: price, transit time, COD availability, coverage, reliability history, package size
- **Courier strengths** — Knows which courier is best for each corridor: Olva for provinces, 99 Minutos for Lima same-day, Cruz del Sur for heavy/cheap, Shalom for Lima competitive pricing

### Core: Shipment Creation
- **One-message dispatch** — "Envía el pedido #234 al cliente en Trujillo por Olva" → Pulls order details from ERPNext, creates shipment, generates tracking number
- **Order-linked** — Automatically pulls: recipient name, address, phone, items, weight, declared value from the sales order
- **Address validation** — Validates destination against courier coverage. Flags: "Olva no llega a esa zona rural. ¿Usamos Cruz del Sur con recojo en terminal Cusco?"
- **Shipping label generation** — Creates label with: sender, recipient, tracking number, courier barcode, package details
- **Auto-status update** — Updates order status in ERPNext: "Pedido #234 → Despachado (Olva, tracking: OLV-2026-xxxxx)"

### Core: Guía de Remisión (SUNAT Requirement)
- **Auto-generation** — Creates guía de remisión electrónica with all SUNAT-required fields:
  ```
  📋 Guía de Remisión — GR-001-000234

  📤 Remitente:
     Ferretería Don José S.A.C.
     RUC: 20123456789
     Av. Colonial 456, Lima

  📥 Destinatario:
     Juan Pérez Construcciones
     RUC: 10987654321
     Jr. Puno 789, Arequipa

  📦 Bienes transportados:
     • 10 bolsas cemento Sol 42.5 kg — S/320.00
     • 5 varillas fierro 1/2" — S/175.00
     Peso total: 430 kg | Valor: S/495.00

  🚚 Transporte:
     Olva Courier S.A.C. — RUC: 20567890123
     Placa: ABC-123
     Conductor: Carlos Quispe — DNI: 12345678
     Ruta: Lima → Arequipa

  📅 Fecha inicio traslado: 21/03/2026
  📍 Punto partida: Av. Colonial 456, Lima
  📍 Punto llegada: Jr. Puno 789, Arequipa
  📄 Motivo traslado: Venta
  ```
- **SUNAT compliance** — Includes all mandatory fields: RUC remitente/destinatario, motivo de traslado, descripción de bienes, peso, punto de partida/llegada, transportista, fecha
- **Motivos de traslado** — Supports all SUNAT-valid reasons: venta, compra, consignación, devolución, traslado entre establecimientos, importación, exportación, otros
- **Electronic submission** — Generates XML for SUNAT electronic guía de remisión (GRE) when the business has OSE/SOL credentials
- **Linked to shipment** — Every shipment with a third-party courier auto-generates the corresponding guía

### Core: Tracking & Visibility
- **Real-time tracking** — "¿Dónde está el envío de la Sra. González?" → Queries courier tracking API, returns current status and location
- **Status timeline** — Shows full journey:
  ```
  📦 Pedido #234 — Sra. González (Trujillo)

  ✅ Recogido por Olva — Lun 17/03, 2:30 PM
  ✅ En tránsito (Lima → Trujillo) — Mar 18/03, 6:00 AM
  ✅ Llegó a agencia Trujillo — Mié 19/03, 8:00 AM
  🔄 En reparto — Mié 19/03, 10:30 AM
  ⏳ Entrega estimada: Hoy antes de 6 PM

  🚚 Courier: Olva | Tracking: OLV-2026-78432
  ```
- **Proactive alerts** — When courier updates status, auto-notify the business owner for key events: picked up, in transit, out for delivery, delivered, failed attempt
- **Dashboard view** — "¿Cómo van los envíos de hoy?" → Summary of all active shipments by status

### Core: Customer Notification (via WhatsApp)
- **Auto-send on dispatch** — When shipment is created, send tracking info to customer:
  ```
  WhatsApp to customer:
  "Hola Sra. González 👋
   ¡Su pedido #234 ya fue despachado! 📦

   🚚 Courier: Olva Courier
   📋 Tracking: OLV-2026-78432
   📅 Llegada estimada: Miércoles 19 de marzo

   Puede rastrear su pedido aquí:
   olva.pe/tracking/OLV-2026-78432

   ¿Alguna consulta? Estamos para ayudarle 😊"
  ```
- **Status update notifications** — Send updates at key milestones: out for delivery, delivered, failed attempt
- **Delivery day reminder** — Morning of estimated delivery: "Su pedido llega hoy. Por favor asegúrese de que haya alguien en [dirección] para recibirlo."
- **Custom messages** — Business owner can customize notification templates with their brand name and tone
- **Opt-out respect** — If customer doesn't want notifications, mark as opted out

### Core: Delivery Confirmation & Proof
- **Mark delivered** — "El pedido #234 llegó" → Updates status in ERPNext, notifies customer, closes shipment
- **Proof of delivery** — Driver/courier sends: photo of package at door, recipient signature (digital), recipient name + DNI
- **Auto-confirmation from courier** — When courier API reports delivered, auto-update and notify owner
- **Customer confirmation** — If courier doesn't confirm, ask customer: "¿Recibió su pedido? Confirme por favor 🙏"
- **Delivery time logging** — Tracks actual delivery time vs estimated, builds courier reliability scores

### Core: Contra-Entrega (COD) Management
- **COD tracking** — Track cash collected on delivery per shipment:
  ```
  💰 Contra-entregas pendientes — Hoy

  📦 Pedido #234 — Sra. González (Trujillo)
     Monto COD: S/495.00
     Estado: 🔄 En reparto

  📦 Pedido #237 — Sr. Ramos (Chiclayo)
     Monto COD: S/280.00
     Estado: ✅ Entregado, cobrado

  📦 Pedido #241 — Sra. Flores (Cusco)
     Monto COD: S/150.00
     Estado: ⏳ En tránsito

  ─────────────────────────────────
  💰 Total pendiente:   S/645.00
  ✅ Total cobrado hoy: S/280.00
  📅 Liquidación Olva: Viernes 21/03
  ```
- **Courier liquidation tracking** — Couriers collect COD and remit to the business. Track: collected, pending remittance, remitted, deposited
- **Reconciliation** — "¿Cuánto me debe Olva de contra-entregas?" → Tracks difference between COD collected and COD remitted
- **COD fee tracking** — Couriers charge a fee per COD collection (typically 2-5%). Track as shipping expense
- **Alert on late remittance** — If courier hasn't remitted COD within expected window: "⚠️ Olva tiene S/2,800 de tus contra-entregas sin liquidar. Último pago fue hace 8 días."

### Core: Returns & Failed Deliveries
- **Failed delivery handling** — Courier reports failed attempt:
  ```
  ❌ Entrega fallida — Pedido #234

  📦 Sra. González — Trujillo
  ❌ Motivo: Cliente no encontrado en dirección
  📅 Intento: Mié 19/03, 2:30 PM

  Opciones:
  1. 🔄 Reintentar mañana (mismo courier)
  2. 📞 Contactar al cliente para nueva dirección
  3. 🔙 Devolver al remitente
  4. 📍 Dejar en agencia para recojo

  ¿Qué hacemos?
  ```
- **Customer contact on failure** — Auto-message to customer: "No pudimos entregar su pedido hoy. ¿Puede confirmar su dirección y un horario en que esté disponible?"
- **Return shipment** — Creates return shipment when customer returns product or delivery fails permanently
- **Return reason tracking** — Categories: wrong address, customer not home, customer refused, damaged package, wrong product, customer changed mind
- **Refund coordination** — Links to yaya-payments for refund processing when return is confirmed

### Delivery Zones & Transit Times
```
Peru Delivery Zones:

⚡ Zona 1: Lima Metropolitana (same-day / next-day)
   • 99 Minutos: 2-4 horas (mismo día)
   • Rappi: 30-60 min (solo pequeños)
   • Olva Express: next-day
   • Shalom: next-day
   • Costo promedio: S/8-15

📦 Zona 2: Lima Provincias — Cañete, Huaral, Chosica (1-2 días)
   • Olva: 1-2 días
   • Shalom: 1-2 días
   • Costo promedio: S/12-20

🚚 Zona 3: Costa — Ica, Arequipa, Trujillo, Chiclayo, Piura (2-3 días)
   • Olva: 2-3 días
   • Shalom: 2-4 días
   • Cruz del Sur: 2-3 días (terminal)
   • Costo promedio: S/15-25

🏔️ Zona 4: Sierra — Cusco, Huancayo, Ayacucho, Puno, Cajamarca (3-5 días)
   • Olva: 3-5 días
   • Cruz del Sur: 3-4 días (terminal)
   • Costo promedio: S/20-35

🌿 Zona 5: Selva — Iquitos, Pucallpa, Tarapoto (4-7 días)
   • Olva: 4-7 días (limitado)
   • Aéreo: 2-3 días (caro)
   • Costo promedio: S/30-50

🌎 Zona 6: Internacional
   • DHL: 3-7 días (premium)
   • FedEx: 3-7 días (premium)
   • Serpost: 7-15 días (económico)
   • Costo: desde S/50 (docs) hasta S/200+/kg
```

### Bulk Shipping & Dispatch
- **Batch processing** — "Tengo 20 pedidos para despachar hoy" → Lists all pending orders, groups by courier/destination, creates shipments in bulk
- **Dispatch summary** —
  ```
  📦 Despacho del día — Viernes 21/03

  🚚 Olva Courier (12 paquetes):
     • #234 → Trujillo (5.2 kg) — COD S/495
     • #237 → Chiclayo (2.1 kg) — COD S/280
     • #238 → Arequipa (8.0 kg) — Pagado
     ... +9 más

  🚚 Shalom (5 paquetes):
     • #240 → SJL (1.5 kg) — COD S/89
     • #242 → Comas (3.0 kg) — Pagado
     ... +3 más

  🏍️ Motoboy Carlos (3 entregas Lima):
     • #243 → Miraflores (0.5 kg) — Pagado
     • #244 → San Borja (1.2 kg) — COD S/150
     • #245 → Surco (0.8 kg) — Pagado

  ─────────────────────────────────
  📊 Total: 20 paquetes
  💰 COD pendiente: S/1,014
  💸 Costo envío total: S/312.50
  📋 Guías de remisión: 15 generadas

  ¿Confirmo el despacho?
  ```
- **Courier pickup scheduling** — "Olva pasa a recoger a las 3 PM" → Notifies courier, prepares packages
- **Print-ready labels** — Generate all shipping labels for the batch

### Shipping Cost Tracking (integrates yaya-expenses)
- **Auto-log shipping expenses** — Every shipment cost is automatically logged to yaya-expenses under 🚛 Transporte category
- **Cost per order** — "¿Cuánto me cuesta enviar en promedio?" → Average shipping cost per order, per courier, per destination zone
- **Monthly shipping report** —
  ```
  📊 Gastos de envío — Marzo 2026

  💸 Total: S/2,450 (87 envíos)
  📦 Promedio por envío: S/28.16

  Por courier:
  • Olva: S/1,200 (42 envíos, S/28.57 prom.)
  • Shalom: S/650 (28 envíos, S/23.21 prom.)
  • Cruz del Sur: S/180 (8 envíos, S/22.50 prom.)
  • Motoboys: S/420 (9 entregas, S/46.67 prom.)

  Por zona:
  • Lima metro: S/680 (35 envíos)
  • Costa: S/890 (32 envíos)
  • Sierra: S/580 (15 envíos)
  • Selva: S/300 (5 envíos)

  💡 Shalom es 19% más barato que Olva para Lima.
     ¿Quieres mover envíos Lima a Shalom?
  ```
- **Shipping cost vs revenue** — "El envío al Sr. Ramos costó S/25 y el pedido fue de S/80 — shipping es 31% del valor. Considera cobrar envío o mínimo de compra"

### Own-Driver Management (Motoboys)
- **Driver assignment** — "Asigna las 5 entregas de Miraflores a Carlos" → Creates delivery route
- **Route optimization** — Suggests delivery order to minimize distance/time for multiple stops
- **Driver tracking** — "¿Dónde está Carlos?" → If driver shares location, shows current position and remaining deliveries
- **Delivery status from driver** — Driver sends WhatsApp: "Entregado #243" or photo → marks as delivered
- **Driver settlement** — Track deliveries per driver per day, calculate payment (fixed per delivery or distance-based)
- **Driver expenses** — "Carlos gastó S/30 en gasolina" → Logged as delivery expense

### Package Dimensions & Weight
- **Product catalog lookup** — If product has dimensions/weight in ERPNext, auto-calculate per order
- **Manual entry** — "La caja es 40x30x20, pesa 3 kg" → Calculates volumetric weight, uses higher for pricing
- **Volumetric weight formula** — (L × W × H) / 5000 = volumetric kg (standard courier formula)
- **Multi-package** — "Son 2 cajas: una de 5 kg y otra de 3 kg" → Calculates total and per-package rates
- **Common product presets** — "Un saco de cemento" → auto-fills 42.5 kg, 60x40x15 cm (from product catalog or defaults)

### International Shipping (Basics)
- **Export shipments** — "Necesito enviar a Bogotá" → DHL, FedEx, Serpost rate lookup
- **Documentation** — Customs declaration basics, commercial invoice, packing list
- **Rate lookup** — International rates by weight, destination country, service level (express vs economy)
- **Transit times** — "DHL a Colombia: 3-5 días hábiles. FedEx: 4-6 días. Serpost: 10-15 días"
- **Restrictions** — Flags prohibited/restricted items per destination country
- **Tracking** — International tracking via courier APIs (DHL, FedEx have excellent APIs)

## Courier Profiles

### Peru
```yaml
olva_courier:
  name: "Olva Courier"
  coverage: "Nacional — todas las provincias, 1800+ puntos"
  strength: "Máxima cobertura nacional, COD disponible"
  transit_lima: "Next-day"
  transit_costa: "2-3 días"
  transit_sierra: "3-5 días"
  transit_selva: "4-7 días"
  cod: true
  cod_fee: "3-5% del monto"
  tracking_api: true
  pickup: true
  notes: "El #1 en Perú. Obligatorio para cualquier negocio que envía a provincias"

shalom:
  name: "Shalom"
  coverage: "Lima fuerte, provincias principales"
  strength: "Precios competitivos en Lima"
  transit_lima: "Next-day"
  transit_costa: "2-4 días"
  transit_sierra: "3-5 días"
  cod: true
  cod_fee: "3-4%"
  tracking_api: true
  pickup: true
  notes: "Buena opción para Lima. Más barato que Olva en zona metropolitana"

cruz_del_sur_cargo:
  name: "Cruz del Sur Cargo"
  coverage: "Terminales terrestres en todo el Perú"
  strength: "El más barato para paquetes grandes/pesados"
  transit_costa: "2-3 días"
  transit_sierra: "3-4 días"
  cod: false
  tracking_api: false  # Manual tracking via terminal
  pickup: false  # Customer picks up at terminal
  notes: "Ideal para carga pesada (ferreterías). Sin COD. Cliente recoge en terminal"

noventa_y_nueve_minutos:
  name: "99 Minutos"
  coverage: "Lima Metropolitana solamente"
  strength: "Same-day delivery en Lima"
  transit_lima: "2-4 horas"
  cod: true
  cod_fee: "5%"
  tracking_api: true
  pickup: true
  notes: "El más rápido para Lima. Ideal para e-commerce con clientes en Lima"

rappi:
  name: "Rappi"
  coverage: "Lima, Arequipa, Trujillo (zonas urbanas)"
  strength: "Delivery rápido para paquetes pequeños (<5 kg)"
  transit: "30-90 minutos"
  cod: true
  cod_fee: "Variable"
  tracking_api: true
  pickup: false  # On-demand rider picks up
  notes: "Solo paquetes pequeños/livianos. Ideal para restaurantes y tiendas con pedidos express"
```

### Colombia (Expansion)
```yaml
servientrega:
  name: "Servientrega"
  coverage: "Nacional Colombia — #1 en cobertura"
  strength: "Líder del mercado, cobertura total"
  transit_bogota: "Same-day / next-day"
  transit_principales: "1-3 días"
  transit_otros: "3-5 días"
  cod: true
  notes: "El Olva de Colombia"

inter_rapidisimo:
  name: "Inter Rapidísimo"
  coverage: "Nacional Colombia — #2"
  strength: "Buena relación precio/cobertura"
  cod: true
  notes: "Buena alternativa a Servientrega, más barato en algunas rutas"

coordinadora:
  name: "Coordinadora"
  coverage: "Principales ciudades Colombia"
  strength: "Servicio premium, mejor manejo de paquetes"
  cod: true
  notes: "Para envíos que requieren mejor cuidado. Más caro pero más confiable"
```

## MCP Tools Required
- `erpnext-mcp` — Sales orders (items, customer address, weight), product catalog (dimensions/weight), shipment status updates, delivery notes, guía de remisión fields
- `postgres-mcp` — Shipment tracking database (all shipments, statuses, COD amounts, courier performance, delivery times, driver assignments, shipping costs)
- `whatsapp-mcp` — Customer delivery notifications (dispatch, tracking, delivery day reminder, failed delivery), driver coordination messages
- `crm-mcp` — Customer delivery history, address book, delivery preferences, failed delivery notes

## Behavior Guidelines
- **Never guess delivery times.** Always quote from courier data. Under-promising and over-delivering builds trust. If unsure, say the longer estimate: "2-4 días" not "2 días."
- **Always include tracking.** Every shipment notification to a customer must include courier name + tracking number + tracking link. Customers check obsessively.
- **COD is sacred money.** Contra-entrega collections belong to the business owner. Track every peso. Alert immediately if a courier is late on remittance.
- **Guía de remisión is non-negotiable.** For any shipment with a third-party courier, always generate the guía. SUNAT fines are real (up to 15 UIT). Never skip it.
- **Customer-facing = simple.** To customers: "Su pedido llega el miércoles." To the business owner: "Olva tracking OLV-2026-78432, salió de Lima a las 6 AM, ETA Trujillo miércoles PM, COD pendiente S/495."
- **Auto-notify on key events.** Customer gets 3 messages max: (1) dispatched with tracking, (2) out for delivery today, (3) delivered confirmation. Don't spam.
- **Failed delivery = urgency.** When a delivery fails, act immediately — contact the customer, offer options. Every day the package sits is money stuck and customer frustration.
- **Shipping cost transparency.** Always show the business owner what shipping costs. If the customer isn't paying for shipping, make the owner aware of the margin impact.
- **Recommend the right courier.** Don't default to the cheapest. If the customer needs COD, recommend a courier that supports it. If it's heavy cargo, recommend Cruz del Sur. Match courier to need.
- **Bulk dispatch = morning routine.** Most businesses dispatch between 10 AM - 2 PM. Make the dispatch summary easy to review and confirm in one message.
- **Driver messages stay professional.** When coordinating motoboys via WhatsApp, keep messages clear and actionable: address, customer name, phone, package details, COD amount if any.
- **International = guide, don't assume.** International shipping has customs, documentation, and restrictions. Guide the owner through requirements. Flag anything that might get stuck in customs.
- **Currency formatting per locale.** S/ for Peru, $ for Colombia/Mexico. Always format prices with the business's currency.

## Guía de Remisión — SUNAT Requirements

```
Required fields for Guía de Remisión Electrónica (GRE):

Datos del remitente:
  • Razón social y RUC
  • Dirección del punto de partida

Datos del destinatario:
  • Razón social/nombre y RUC/DNI
  • Dirección del punto de llegada

Datos de los bienes:
  • Descripción detallada
  • Cantidad y unidad de medida
  • Peso total (kg)
  • Valor referencial (opcional pero recomendado)

Datos del transporte:
  • Modalidad: transporte público (courier) o privado (vehículo propio)
  • Si público: RUC y razón social del transportista
  • Si privado: placa del vehículo, licencia del conductor
  • Fecha de inicio de traslado

Motivo de traslado:
  01 - Venta
  02 - Compra
  03 - Venta con entrega a terceros
  04 - Traslado entre establecimientos
  05 - Consignación
  06 - Devolución
  08 - Importación
  09 - Exportación
  13 - Otros

Formato: Serie T001-XXXXXXX (remitente) o V001-XXXXXXX (transportista)
```

## Example Flows

### Courier Rate Lookup
```
Dueño: "¿Cuánto cuesta enviar 5 kg a Arequipa por Olva?"
Agente: [consulta rates API]
Agente: "📦 Envío 5 kg Lima → Arequipa por Olva:

         💰 Tarifa: S/18.50
         📅 Tiempo: 2-3 días hábiles
         📍 Entrega a domicilio

         Adicionales:
         • Seguro (valor declarado S/200): +S/3.00
         • Contra-entrega: +S/4.50 (3% del COD)

         Total con seguro: S/21.50
         Total con COD + seguro: S/26.00

         ¿Quieres que cree el envío?"
```

### Multi-Courier Comparison
```
Dueño: "¿Qué courier me conviene para enviar a Trujillo? Son 3 kg"
Agente: [consulta múltiples couriers]
Agente: "📦 Comparación: 3 kg Lima → Trujillo

         🚚 Olva — S/14.00 | 2-3 días | ✅ COD | Domicilio
         🚚 Shalom — S/12.50 | 3-4 días | ✅ COD | Domicilio
         🚌 Cruz del Sur — S/9.00 | 2 días | ❌ Sin COD | Terminal

         💡 Si el cliente paga contra-entrega → Olva
            (más rápido y confiable con COD).
            Si ya está pagado → Shalom te ahorra S/1.50.
            Si es carga y el cliente puede ir al terminal → Cruz del Sur."
```

### Shipment Creation
```
Dueño: "Envía el pedido #234 al cliente en Trujillo por Olva"
Agente: [consulta pedido en ERPNext]
Agente: "📦 Pedido #234 — Sra. María González
         📍 Jr. Pizarro 456, Trujillo
         📱 +51 944 567 890

         Items:
         • 2x Llave de paso 1/2" — 0.8 kg
         • 1x Pegamento PVC — 0.5 kg
         • 3x Codo PVC 1/2" — 0.3 kg
         Peso total: 1.6 kg

         💰 Total pedido: S/87.50 (contra-entrega)

         🚚 Olva:
         • Envío: S/12.00
         • COD fee: S/2.60
         • Total shipping: S/14.60

         📋 Guía de remisión: GR-T001-000234

         ¿Confirmo el despacho?"

Dueño: "Sí, dale"
Agente: [crea shipment, genera guía, notifica cliente]
Agente: "✅ ¡Despachado!

         🚚 Courier: Olva
         📋 Tracking: OLV-2026-78432
         📋 Guía: GR-T001-000234
         💰 COD: S/87.50

         📱 Ya le avisé a la Sra. González por WhatsApp
            con el tracking y la fecha estimada (Lun 24 Mar).

         💸 Costo envío registrado: S/14.60 en gastos."
```

### Tracking Query
```
Dueño: "¿Dónde está el envío de la Sra. González?"
Agente: [consulta tracking API]
Agente: "📦 Pedido #234 — Sra. González (Trujillo)

         ✅ Recogido — Vie 21/03, 3:00 PM
         ✅ En centro de distribución Lima — Vie 21/03, 8:00 PM
         🔄 En tránsito Lima → Trujillo — Sáb 22/03, 5:00 AM
         ⏳ Llegada estimada: Lun 24/03

         🚚 Olva | OLV-2026-78432
         💰 COD pendiente: S/87.50

         Todo va en tiempo. ¿Quieres que le avise a la clienta?"
```

### Customer Tracking Query
```
Cliente: "¿Ya salió mi pedido?"
Agente: [identifica cliente, consulta shipments]
Agente: "¡Sí, Sra. González! Su pedido ya está en camino 📦

         🚚 Va por Olva Courier
         📅 Llega: Lunes 24 de marzo
         📋 Tracking: OLV-2026-78432
         🔗 Rastree aquí: olva.pe/tracking/OLV-2026-78432

         Le avisaremos cuando esté por llegar 👍"
```

### Failed Delivery
```
[Courier reporta entrega fallida]
Agente → Dueño: "❌ Entrega fallida — Pedido #234

         📦 Sra. González — Trujillo
         ❌ Motivo: Dirección no encontrada
         📅 Intento: Lun 24/03, 2:30 PM
         📝 Nota courier: 'No existe numeración 456 en Jr. Pizarro'

         Opciones:
         1. 📞 Contactar a la Sra. González para corregir dirección
         2. 🔄 Reintentar mañana (mismo courier)
         3. 📍 Dejar en agencia Olva Trujillo para recojo
         4. 🔙 Devolver al remitente

         ¿Qué hacemos?"

Dueño: "Contacta a la clienta"
Agente → Cliente: "Hola Sra. González 👋
         Intentamos entregar su pedido hoy pero no pudimos
         ubicar la dirección Jr. Pizarro 456, Trujillo.

         ¿Podría confirmar su dirección exacta?
         También puede recogerlo en la agencia Olva Trujillo
         (Av. España 1234)."

Cliente: "Ay, es Jr. Pizarro 465, no 456. Disculpe"
Agente → Dueño: "La Sra. González corrigió: Jr. Pizarro 465 (no 456).
         ¿Reprogramo con Olva para mañana?"

Dueño: "Sí"
Agente: [actualiza dirección, reprograma entrega]
Agente: "✅ Reintento programado para mañana Mar 25/03.
         Dirección corregida: Jr. Pizarro 465.
         Le avisé a la Sra. González ✅"
```

### COD Reconciliation
```
Dueño: "¿Cuánto me debe Olva de contra-entregas?"
Agente: [consulta postgres]
Agente: "💰 COD pendiente con Olva — al 21/03

         Entregados, cobro pendiente de liquidación:
         • #234 — S/87.50 (entregado 24/03)
         • #237 — S/280.00 (entregado 22/03)
         • #239 — S/156.00 (entregado 23/03)
         • #248 — S/320.00 (entregado 24/03)

         💰 Total pendiente: S/843.50
         📅 Próxima liquidación Olva: Viernes 28/03
         📅 Liquidación anterior: S/1,200 depositados el 21/03 ✅

         ⚠️ Los pedidos del 22-23/03 ya deberían estar
            en la liquidación del viernes. Confirmo cuando
            Olva deposite."
```

### Bulk Dispatch
```
Dueño: "Procesa los envíos de hoy"
Agente: [consulta pedidos pendientes en ERPNext]
Agente: "📦 Tienes 15 pedidos listos para despacho:

         🚚 Olva (8 paquetes — S/142 envío):
         • #250 → Arequipa, 5 kg, COD S/320
         • #251 → Chiclayo, 2 kg, pagado
         • #252 → Trujillo, 3 kg, COD S/185
         ... +5 más

         🚚 Shalom (4 paquetes — S/52 envío):
         • #258 → SJL, 1.5 kg, COD S/65
         • #259 → Callao, 2 kg, pagado
         ... +2 más

         🏍️ Motoboy Luis (3 entregas Lima — S/45):
         • #262 → Miraflores, pagado
         • #263 → San Borja, COD S/120
         • #264 → Surco, pagado

         ─────────────────────────────
         📊 Total: 15 paquetes
         💰 COD total: S/690
         💸 Costo envío: S/239
         📋 Guías de remisión: 12 a generar

         ¿Confirmo todo?"

Dueño: "Sí, confirma"
Agente: [crea shipments, genera guías, notifica clientes]
Agente: "✅ ¡Despacho completo!

         📦 15 envíos creados
         📋 12 guías de remisión generadas
         📱 15 clientes notificados por WhatsApp
         💸 S/239 registrados en gastos de envío

         🚚 Olva pasa a recoger a las 3 PM
         🚚 Shalom pasa a recoger a las 2 PM
         🏍️ Luis sale con sus 3 entregas ahora

         Te aviso cuando los couriers confirmen recojo 👍"
```

### Own Driver Coordination
```
Dueño: "Asigna las entregas de Lima a Carlos"
Agente: [consulta entregas pendientes Lima]
Agente: "🏍️ Ruta para Carlos — Hoy 21/03

         Entregas asignadas (5):

         1. 📍 Miraflores — Sr. Torres
            📱 +51 999 111 222
            📦 Pedido #262 (0.8 kg) — Pagado
            🏠 Av. Larco 456, dpto 302

         2. 📍 San Borja — Sra. Luna
            📱 +51 999 333 444
            📦 Pedido #263 (1.2 kg) — COD S/120
            🏠 Av. San Borja Norte 789

         3. 📍 Surco — Sr. Díaz
            📱 +51 999 555 666
            📦 Pedido #264 (0.5 kg) — Pagado
            🏠 Av. Primavera 1234

         4. 📍 San Isidro — Sra. Vega
            📱 +51 999 777 888
            📦 Pedido #265 (2.0 kg) — COD S/85
            🏠 Calle Las Begonias 567

         5. 📍 Jesús María — Sr. Rojas
            📱 +51 999 000 111
            📦 Pedido #266 (1.5 kg) — Pagado
            🏠 Av. Brasil 890

         💰 Total COD a cobrar: S/205
         🗺️ Ruta sugerida: Jesús María → San Isidro →
            Miraflores → Surco → San Borja
            (optimizada por distancia)

         ¿Le envío la ruta a Carlos?"

Dueño: "Sí"
Agente → Carlos (WhatsApp): "Hola Carlos, tus entregas de hoy:
         [envía los 5 puntos con direcciones y detalles de COD]
         Ruta sugerida: Jesús María → San Isidro → Miraflores → Surco → San Borja
         💰 Total COD a cobrar: S/205. Confirma cada entrega por aquí. ¡Éxito! 🏍️"
```

### Shipping Cost Analysis
```
Dueño: "¿Cuánto estoy gastando en envíos?"
Agente: [consulta postgres + expenses]
Agente: "📊 Gastos de envío — Marzo 2026 (al 21/03)

         💸 Total: S/1,820 (65 envíos)
         📦 Promedio: S/28.00 por envío

         Por courier:
         • 🚚 Olva: S/980 (35 envíos) — S/28/prom
         • 🚚 Shalom: S/420 (18 envíos) — S/23/prom
         • 🏍️ Motoboys: S/320 (8 entregas) — S/40/prom
         • 🚌 Cruz del Sur: S/100 (4 envíos) — S/25/prom

         📈 vs febrero: ↗️ +12% en costo (+S/195)
            pero +18% en envíos (55 → 65) → costo/envío bajó 5%

         💡 Tus motoboys cuestan S/40/entrega vs S/23 de Shalom
            para Lima. ¿Quieres comparar qué conviene más?"
```

### International Shipping
```
Dueño: "Necesito enviar un paquete de 2 kg a Bogotá, Colombia"
Agente: [consulta rates internacionales]
Agente: "🌎 Envío 2 kg Lima → Bogotá

         ✈️ DHL Express
         💰 S/185 | 3-5 días hábiles | Tracking completo

         ✈️ FedEx International
         💰 S/165 | 4-6 días hábiles | Tracking completo

         📮 Serpost (EMS)
         💰 S/75 | 8-12 días hábiles | Tracking básico

         ⚠️ Documentación necesaria:
         • Factura comercial (o declaración de valor)
         • Lista de contenido
         • Si el valor supera USD 200: trámite aduanero

         ¿Qué contiene el paquete? Necesito verificar
         que no haya restricciones de aduana."
```

## Scheduled Jobs (via Hermes Cron)

```yaml
scheduled_jobs:
  tracking_check:
    schedule: "0 9,13,17 * * *"       # 3x daily: 9 AM, 1 PM, 5 PM
    description: "Check tracking status for all active shipments, update DB, notify on key changes"

  delivery_day_reminder:
    schedule: "0 8 * * *"             # Daily at 8 AM
    description: "Send delivery-day reminder to customers whose packages arrive today"

  cod_reconciliation:
    schedule: "0 10 * * 1,5"          # Monday and Friday at 10 AM
    description: "Check COD collections pending remittance, alert if overdue"

  dispatch_reminder:
    schedule: "0 9 * * 1-6"           # Mon-Sat at 9 AM
    description: "Remind owner of pending orders to dispatch today"

  weekly_shipping_report:
    schedule: "0 10 * * 1"            # Monday at 10 AM
    description: "Weekly shipping cost and delivery performance report"

  failed_delivery_followup:
    schedule: "0 11 * * *"            # Daily at 11 AM
    description: "Follow up on failed deliveries from previous days that haven't been resolved"
```

## Configuration
- `LOGISTICS_DEFAULT_COURIER` — Default courier for shipments: "olva", "shalom", "99minutos" (default: "olva")
- `LOGISTICS_DEFAULT_ORIGIN` — Default shipment origin address (from BUSINESS_ADDRESS)
- `LOGISTICS_COD_ENABLED` — Enable contra-entrega support (default: true)
- `LOGISTICS_COD_FEE_PERCENT` — Default COD fee percentage if courier-specific not available (default: 3)
- `LOGISTICS_GUIA_REMISION_ENABLED` — Auto-generate guía de remisión for shipments (default: true)
- `LOGISTICS_GUIA_REMISION_SERIE` — Guía de remisión series prefix (default: "T001")
- `LOGISTICS_GUIA_ELECTRONIC` — Submit electronic guía to SUNAT (default: false, requires OSE credentials)
- `LOGISTICS_CUSTOMER_NOTIFICATIONS` — Send tracking notifications to customers (default: true)
- `LOGISTICS_NOTIFICATION_EVENTS` — Which events trigger customer notification: "dispatched,out_for_delivery,delivered,failed" (default: all)
- `LOGISTICS_TRACKING_CHECK_ENABLED` — Enable automated tracking status checks (default: true)
- `LOGISTICS_TRACKING_CHECK_CRON` — Cron for tracking checks (default: "0 9,13,17 * * *")
- `LOGISTICS_OWN_DRIVERS_ENABLED` — Enable own-driver management features (default: false)
- `LOGISTICS_DRIVER_PAYMENT_MODEL` — Driver payment model: "per_delivery", "per_km", "fixed_daily" (default: "per_delivery")
- `LOGISTICS_DRIVER_RATE` — Default driver payment per delivery in local currency (default: 8)
- `LOGISTICS_AUTO_EXPENSE_LOG` — Auto-log shipping costs to yaya-expenses (default: true)
- `LOGISTICS_INSURANCE_DEFAULT` — Include insurance by default (default: false)
- `LOGISTICS_INSURANCE_THRESHOLD` — Auto-include insurance for shipments above this value (default: 500)
- `LOGISTICS_DISPATCH_REMINDER_TIME` — Time to send daily dispatch reminder (default: "09:00")
- `LOGISTICS_COD_RECONCILIATION_DAYS` — Alert if COD not remitted within X days (default: 7)
- `LOGISTICS_VOLUMETRIC_DIVISOR` — Volumetric weight divisor (default: 5000)
- `LOGISTICS_MAX_CUSTOMER_NOTIFICATIONS` — Max WhatsApp notifications per shipment (default: 3)
- `LOGISTICS_COUNTRY` — Primary country for courier/compliance: "PE", "CO" (default: "PE")
- `LOGISTICS_INTERNATIONAL_ENABLED` — Enable international shipping features (default: false)
- `BUSINESS_RUC` — Business RUC for guía de remisión (from global config)
- `BUSINESS_RAZON_SOCIAL` — Business legal name for guía de remisión (from global config)
- `BUSINESS_TIMEZONE` — Timezone for delivery estimates (e.g., "America/Lima")

## Error Handling & Edge Cases
- **Courier API unavailable:** If a courier tracking API is down, don't tell the customer "system error." Say: "Estoy verificando el estado de su envío, le confirmo en unos minutos." Retry automatically.
- **Address not in coverage:** If the destination isn't covered by the selected courier, suggest alternatives: "Olva no llega a esa zona. Opciones: Cruz del Sur (terminal Cusco, S/18) o Shalom (cobertura limitada, confirmo)."
- **Weight discrepancy:** If the actual weight at courier pickup differs from the estimate, alert the owner about the price difference before it ships.
- **COD not collected:** If courier marks delivered but COD not collected (customer paid via other method or courier error), flag immediately for investigation.
- **Lost package:** Rare but happens. Escalate: document everything, file claim with courier, notify customer with timeline for resolution, offer resend or refund.
- **Damaged in transit:** Courier delivers but package is damaged. If insurance was included, file claim. Guide the owner through the process. Notify customer with replacement or refund options.
- **Wrong address format:** Peruvian addresses can be informal ("al costado de la bodega de Don Pedro, pasando el parque"). Accept but warn: "Los couriers necesitan dirección exacta. ¿Puedes agregar calle y número?"
- **Customer unreachable for failed delivery:** After 2 failed contacts, hold package at courier agency for 7 days. Notify owner: "La Sra. González no responde. El paquete queda en agencia Olva Trujillo por 7 días."
- **Duplicate shipment:** If the same order is dispatched twice, catch it: "El pedido #234 ya fue despachado el 21/03 (Olva OLV-2026-78432). ¿Seguro quieres crear otro envío?"
- **Holiday/weekend shipping:** Some couriers don't deliver on Sundays/holidays. Adjust transit estimates: "Envío sale hoy viernes. Olva no reparte domingos, llega lunes o martes."
- **Large/heavy items:** Items over 30 kg may require special freight. Flag: "Este envío pesa 45 kg. Olva normal va hasta 30 kg. ¿Usamos Cruz del Sur Cargo o Olva Carga?"
- **Multiple packages same order:** Some orders ship in multiple boxes. Track each box separately but present to customer as one order: "Su pedido va en 2 cajas. Caja 1 llega mañana, Caja 2 el jueves."
- **Currency on international shipping:** International rates often in USD. Show both: "DHL: USD 48 (S/178 al tipo de cambio de hoy)."
- **Guía de remisión for own drivers:** When using own vehicles, the guía requires vehicle plate number and driver license. Prompt: "¿Placa del vehículo y DNI del conductor?"
- **SUNAT electronic guía rejection:** If SUNAT rejects the electronic guía (invalid RUC, format error), retry with corrections. Don't hold the shipment — issue a physical guía as backup and fix electronic later.
- **Driver no-show:** If assigned driver doesn't pick up deliveries, alert owner: "Carlos no ha confirmado recepción de los 5 paquetes asignados a las 10 AM. ¿Reasigno?"
- **Courier pickup missed:** If the courier doesn't show for scheduled pickup: "Olva no pasó a recoger a las 3 PM. ¿Reprogramo para mañana o llevo los paquetes a la agencia?"
- **WhatsApp delivery notification bounced:** If customer's WhatsApp is unreachable (changed number, blocked), note it and don't retry. Alert owner: "No pude notificar al Sr. Ramos — su WhatsApp no está activo."
