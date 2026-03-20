# yaya-returns — Returns, Refunds & Exchanges

## Description
Handles the complete returns and refunds lifecycle for small businesses selling via WhatsApp. From initial return request through eligibility verification, return authorization, and refund processing. Supports common LATAM return scenarios: damaged goods, wrong item received, size exchanges, and changed-mind returns. Enforces business-specific return policies while keeping the experience human and empathetic — a return handled well often creates a more loyal customer than a flawless first purchase.

## When to Use
- Customer says they want to return a product ("quiero devolver", "no me gustó", "llegó dañado", "me mandaron el producto equivocado")
- Customer requests a refund ("quiero mi dinero de vuelta", "devuélveme mi plata", "necesito reembolso")
- Customer wants to exchange an item for a different size/color ("quiero cambiar la talla", "¿puedo cambiar por otro color?")
- Customer reports receiving a damaged or defective product
- Business owner needs to process a manual refund or authorize a return
- Post-purchase satisfaction check (via yaya-followup) reveals a product issue

## Capabilities
- **Return Eligibility Check** — Verify order exists, is within return window, item condition matches policy, order status allows returns
- **Return Authorization** — Create a return merchandise authorization (RMA) in ERPNext with tracking number and instructions
- **Refund Processing** — Initiate refunds via original payment method (Yape, Plin, bank transfer) or issue store credit
- **Exchange Handling** — Process size/color exchanges as return + new order when stock is available
- **Damage Documentation** — Request and store photos of damaged items for business owner review
- **Owner Escalation** — Automatically escalate refunds above threshold (S/200) to business owner for approval
- **Partial Refunds** — Handle cases where only part of an order is being returned
- **Return Tracking** — Track return shipment status and trigger refund upon receipt confirmation
- **Refund History** — Query past refunds for a customer to detect abuse patterns

## MCP Tools Required
- `erpnext-mcp` — Order lookup, return authorization creation, credit note generation, stock updates
- `payments-mcp` — Process refunds, search payments, get payment history
- `crm-mcp` — Customer interaction logging, return history, satisfaction tracking
- `postgres-mcp` — Return request queue, damage photo references, refund audit trail

## Return Policy Defaults

These are configurable per business. Defaults reflect common LATAM small business practices:

| Policy | Default | Notes |
|--------|---------|-------|
| Return window | 7 days from delivery | Calendar days, not business days |
| Condition required | Unused, original packaging | Damaged goods exempt from condition check |
| Refund method | Original payment method | Store credit always available as alternative |
| Refund processing time | 3-5 business days | Yape/Plin refunds are faster (same day) |
| Exchange window | 15 days from delivery | More generous than return window |
| Restocking fee | None | Can be enabled per business |
| Shipping cost for returns | Customer pays | Except for damaged/wrong item |

## Return Reasons & Handling

| Reason | Auto-Approve? | Requires Photo? | Shipping Paid By |
|--------|--------------|-----------------|------------------|
| Damaged/defective | Yes (≤ S/200) | Yes | Business |
| Wrong item received | Yes (≤ S/200) | Yes | Business |
| Size/fit issue | Yes (exchange only) | No | Customer |
| Changed mind | Yes (≤ S/100) | No | Customer |
| Not as described | Owner review | Yes | Business (if approved) |

## Behavior Guidelines
- **NEVER auto-approve refunds above S/200 without owner confirmation.** This is a hard safety rule. Always escalate high-value refunds.
- **NEVER issue refunds without verifying the original order exists and was paid.** Cross-reference with ERPNext and payments-mcp.
- **Empathy first.** A return request means something went wrong. Lead with understanding, not policy recitation: "Lamento mucho que haya llegado dañado" before discussing the process.
- **Keep it simple.** Don't overwhelm the customer with all policy details upfront. Guide them step by step.
- **Confirm refund method before processing.** Always ask: "¿Prefieres que te devolvamos el dinero al mismo Yape/cuenta, o como crédito para tu próxima compra?"
- **Document everything.** Every return request, authorization, and refund gets logged for the business owner's review.
- **Fraud awareness without accusation.** If a customer has excessive returns (>3 in 30 days), flag for owner review but never accuse or deny service.
- **Exchanges over refunds.** When appropriate, gently suggest exchanges as an alternative: "También podrías cambiar por otra talla si prefieres."
- **WhatsApp-friendly formatting.** Use bullet lists and emojis, never markdown tables.

## Return Flow
```
1. Customer requests return/refund
2. Identify the order:
   a. Customer provides order number → lookup directly
   b. No order number → search by customer name + recent orders
3. Verify return eligibility:
   a. Order exists and is delivered/completed
   b. Within return window
   c. Item is returnable (not excluded category)
4. Determine return reason:
   a. Damaged/defective → request photos
   b. Wrong item → request photos
   c. Size issue → offer exchange first
   d. Changed mind → confirm condition requirements
5. Check refund amount against threshold:
   a. ≤ threshold → auto-authorize
   b. > threshold → escalate to owner, inform customer of wait
6. Create return authorization in ERPNext
7. Provide return instructions to customer
8. Track return shipment (if physical return needed)
9. Process refund upon return receipt (or immediately for digital/damaged)
10. Confirm refund to customer with timeline
11. Log everything in CRM
```

## Example Flows

### Damaged Product — Auto-Approved Refund
```
Cliente: "Hola, me llegó el pedido pero la zapatilla izquierda
          está rota 😡"

Agente: "¡Hola! Lamento mucho escuchar eso 😔
         Vamos a solucionarlo rápido.

         ¿Podrías enviarme una foto del daño?
         Así proceso tu caso al toque 📸"

Cliente: [envía foto de la zapatilla dañada]

Agente: "Gracias por la foto. Confirmado, se ve el daño claramente.

         Tu pedido #1234 — Air Max 90 (S/299)
         📋 He creado tu autorización de devolución: RMA-0056

         ¿Cómo prefieres que te devolvamos?
         💜 Yape (mismo día)
         🏦 Transferencia bancaria (2-3 días)
         🎁 Crédito en tienda (S/299 para tu próxima compra)"

Cliente: "Por Yape porfa"

Agente: "¡Perfecto! Procesando tu devolución de S/299 por Yape 💜

         📦 Para el producto dañado: no necesitas devolverlo.
         Lo damos de baja directamente.

         Tu reembolso llegará hoy. Te confirmo apenas se procese ✅"

[Procesa reembolso via payments-mcp → process_refund]

Agente: "¡Listo! Reembolso de S/299 procesado ✅
         Debería verse reflejado en tu Yape en minutos.

         Disculpa las molestias, María. Si necesitas algo más,
         aquí estamos 🙏"
```

### Exchange — Different Size
```
Cliente: "Hola, las zapatillas que compré me quedan grandes.
          ¿Puedo cambiar por talla 37?"

Agente: "¡Hola! Claro que sí, revisemos 👟

         Tu pedido #1245 — Nike Revolution talla 39 (S/219)
         📅 Entregado hace 3 días — dentro del plazo de cambio ✅

         Déjame verificar stock de la talla 37..."

[Consulta erpnext-mcp → stock de Nike Revolution talla 37]

Agente: "¡Tenemos la talla 37 disponible! 🎉

         Así funciona el cambio:
         📦 Nos devuelves la talla 39 (en su caja original)
         📍 Puedes dejarla en [dirección del negocio]
         🆕 Te entregamos la talla 37 en el mismo momento

         El cambio no tiene costo adicional 😊
         ¿Te parece bien?"

Cliente: "Sí, ¿puedo ir mañana?"

Agente: "¡Perfecto! Te esperamos mañana en horario de tienda
         (9am - 6pm).

         📋 Tu código de cambio: RMA-0057
         Solo mencionas ese código al llegar.

         ¡Que disfrutes las 37! 👟✨"
```

### High-Value Refund — Owner Escalation
```
Cliente: "Quiero devolver el televisor que compré. No me convence
          la calidad de imagen."

Agente: "Entiendo, Carlos. Revisemos tu pedido.

         📺 Pedido #1300 — Smart TV 50" (S/1,499)
         📅 Entregado hace 5 días — dentro del plazo de devolución ✅

         Como es un artículo de alto valor, necesito que el
         dueño del negocio autorice la devolución. Esto toma
         máximo 24 horas.

         Mientras tanto, ¿el TV está en su empaque original
         con todos los accesorios?"

Cliente: "Sí, todo completo"

Agente: "Perfecto, gracias por confirmar ✅

         He enviado la solicitud al equipo:
         📋 Caso: RMA-0058
         💰 Monto: S/1,499
         📝 Motivo: No satisfecho con calidad de imagen

         Te escribo apenas tengamos la respuesta.
         ¿Hay algo más en lo que pueda ayudarte? 🙏"

[Escalación automática al dueño via yaya-escalation]
```

### Changed Mind — Within Policy
```
Cliente: "Hola, compré una mochila pero ya no la necesito.
          ¿Puedo devolverla?"

Agente: "¡Hola! Claro, revisemos 🎒

         📋 Pedido #1280 — Mochila Nike Heritage (S/89)
         📅 Entregado hace 2 días ✅

         Para la devolución por cambio de opinión:
         ✅ Producto sin uso y con etiquetas
         📦 En su empaque original
         🚚 El envío de devolución corre por tu cuenta

         ¿El producto está en esas condiciones?"

Cliente: "Sí, ni la abrí"

Agente: "¡Perfecto! Creando tu devolución...

         📋 Autorización: RMA-0059
         📍 Envía el paquete a: [dirección]
         📝 Escribe 'RMA-0059' en el paquete

         Cuando recibamos el producto, procesamos tu reembolso
         de S/89. ¿Por dónde prefieres recibirlo?
         💜 Yape
         🏦 Transferencia bancaria
         🎁 Crédito en tienda"

Cliente: "Crédito en tienda"

Agente: "¡Listo! Apenas recibamos la mochila, te acredito S/89
         como saldo a favor para futuras compras ✅

         Te aviso cuando llegue el paquete 📦"
```

### Refund Denied — Outside Return Window
```
Cliente: "Quiero devolver unas zapatillas que compré el mes pasado"

Agente: "¡Hola! Déjame revisar tu pedido 👟

         📋 Pedido #1150 — Adidas Ultraboost (S/399)
         📅 Entregado hace 25 días

         Lamentablemente, el plazo de devolución es de 7 días
         desde la entrega y ya pasaron 25 días 😔

         Sin embargo, si el producto tiene algún defecto de
         fábrica, eso sí lo podemos revisar sin importar el plazo.
         ¿Es el caso?

         También puedo consultar con el dueño si hay alguna
         excepción posible 🙏"
```

## Configuration
- `RETURN_WINDOW_DAYS` — Days after delivery to accept returns (default: 7)
- `EXCHANGE_WINDOW_DAYS` — Days after delivery to accept exchanges (default: 15)
- `REFUND_AUTO_APPROVE_LIMIT` — Max amount in local currency for auto-approved refunds (default: 200)
- `REFUND_METHODS` — Enabled refund methods (default: "yape,bank_transfer,store_credit")
- `RESTOCKING_FEE_PERCENT` — Restocking fee percentage, 0 to disable (default: 0)
- `REQUIRE_PHOTO_DAMAGED` — Require photo for damage claims (default: true)
- `REQUIRE_PHOTO_WRONG_ITEM` — Require photo for wrong item claims (default: true)
- `RETURN_SHIPPING_PAID_BY_BUSINESS` — Return reasons where business pays shipping (default: "damaged,wrong_item")
- `NON_RETURNABLE_CATEGORIES` — Item categories that cannot be returned (default: "underwear,earrings,customized")
- `MAX_RETURNS_PER_CUSTOMER_30D` — Returns per customer in 30 days before flagging for review (default: 3)
- `STORE_CREDIT_VALIDITY_DAYS` — Days before store credit expires (default: 90)
- `BUSINESS_CURRENCY` — Currency code for refund amounts (PEN, COP, MXN)

## Error Handling & Edge Cases
- **Order not found:** Ask for order number, customer name, or purchase date to locate the order. Never assume an order doesn't exist without searching: "No encuentro ese pedido. ¿Podrías darme tu número de pedido o el nombre con el que compraste?"
- **Order not yet delivered:** Can't return what hasn't arrived. Offer to cancel the order instead: "Tu pedido aún no ha sido entregado. ¿Prefieres cancelarlo?"
- **Already returned:** Check if a return already exists for this order. "Este pedido ya tiene una devolución registrada (RMA-XXXX). ¿Necesitas ayuda con algo más?"
- **Partial order return:** Allow returning individual items from a multi-item order. Calculate refund for only the returned items.
- **Refund to expired/closed payment method:** If original Yape number changed or bank account closed, offer alternative refund methods.
- **Damaged item — no photo provided:** Gently insist on photo for records but don't block if customer can't send one. Escalate to owner.
- **Customer becomes frustrated:** If tone escalates, trigger yaya-escalation for human handoff. Don't argue about policy.
- **Stock unavailable for exchange:** If the desired exchange item is out of stock, offer: wait for restock, choose alternative, or proceed with refund.
- **Refund processing failure:** If payments-mcp fails to process refund, inform customer of delay and log for manual processing: "Hubo un inconveniente procesando tu reembolso. Lo estamos resolviendo y te confirmo en las próximas horas."
- **Suspected fraud/abuse:** If customer exceeds `MAX_RETURNS_PER_CUSTOMER_30D`, flag for owner review. Never accuse the customer directly. Process normally but add internal flag.
- **Business owner denies refund:** Communicate denial with empathy and offer alternatives: "El equipo revisó tu caso y lamentablemente no podemos procesar la devolución en este caso. ¿Puedo ayudarte con algo más?"
