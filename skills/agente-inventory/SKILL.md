# agente-inventory — Stock Management & Product Catalog

## Description
Manages product inventory and catalog operations via ERPNext MCP. Provides real-time stock checks, low-stock alerts, reorder suggestions, multi-warehouse stock visibility, product catalog search, and price lookups. Proactively alerts business owners when items run low. Prevents overselling by checking stock before confirming any order.

## When to Use
- Customer asks about product availability ("¿tienen?", "¿hay stock?", "¿queda?")
- An order is about to be created (stock validation before commitment)
- Business owner asks about stock levels, reorder needs, or inventory status
- A stock threshold alert triggers (low stock, out of stock, restock received)
- Business owner wants to update prices or product information
- Customer asks about product details, specifications, or alternatives
- A periodic stock check runs via cron

## Capabilities
- **Stock Check** — Real-time stock levels by product, variant (size/color), and warehouse
- **Product Search** — Natural language product catalog search ("zapatillas negras talla 42")
- **Price Lookup** — Current prices, including any active promotions or bulk pricing
- **Low Stock Alerts** — Proactive WhatsApp alerts to business owner when stock drops below threshold
- **Reorder Suggestions** — Based on sales velocity, suggest reorder quantities and timing
- **Multi-Warehouse** — Check stock across multiple locations (store, warehouse, in-transit)
- **Product Details** — Descriptions, images, specifications, variants available
- **Stock Reservation** — Reserve stock when an order is created, release if order is cancelled/expired
- **Catalog Browse** — Let customers browse by category, brand, price range
- **Price Management** — Business owner can query and update prices via chat
- **Stock History** — Track stock movements and identify trends

## MCP Tools Required
- `erpnext-mcp` — Primary: item catalog, stock levels, warehouse info, pricing, stock entries, purchase orders
- `postgres-mcp` — Sales velocity calculations, stock alert history, reservation tracking
- `crm-mcp` — Customer wishlist items (for restock notifications via agente-followup)

## Behavior Guidelines
- **Always check stock before promising.** Never tell a customer something is available without verifying via ERPNext. Stale data = broken trust.
- **Show availability, not internal numbers.** Tell customers "Sí, tenemos disponible" or "Solo nos quedan 2" — don't say "Tenemos 47 unidades en el almacén central."
- **Scarcity is honest, not manipulative.** When stock is genuinely low (≤3 units), mention it to help the customer decide. Don't fabricate urgency.
- **Suggest alternatives for out-of-stock items.** Search for similar products by category, brand, or price range.
- **Reserve stock on order creation.** Decrement available stock immediately when an order is placed. Restore if the order expires without payment.
- **Business owner gets full transparency.** Unlike customer-facing responses, business owner queries get exact numbers, warehouse breakdown, and reorder recommendations.
- **Don't expose cost/margin data to customers.** Purchase prices, margins, and supplier info are internal only.
- **Handle variants naturally.** If a product has size/color variants, guide the customer through selection: "Tenemos las Air Max en tallas 40, 41, 42 y 43. ¿Cuál necesitas?"

## Stock Alert System

```
Alert Levels:
  🟡 Low Stock: quantity <= REORDER_POINT
     "⚠️ Stock bajo: [Producto] — quedan [X] unidades.
      Recomendación: pedir [Y] unidades."

  🔴 Critical Stock: quantity <= CRITICAL_STOCK_LEVEL
     "🚨 Stock crítico: [Producto] — solo quedan [X] unidades.
      A la velocidad de venta actual, se agotan en [Z] días."

  ⚫ Out of Stock: quantity = 0
     "❌ Agotado: [Producto] — sin stock en ningún almacén.
      Última venta: [fecha]. [N] clientes preguntaron esta semana."

  🟢 Restocked: quantity increased from 0 or below reorder point
     "✅ Restock recibido: [Producto] — [X] unidades ingresadas.
      [N] clientes en lista de espera para notificar."
```

## Example Flows

### Customer Stock Check
```
Cliente: "¿Tienen las Nike Air Max en 42?"
Agente: [consulta ERPNext]
Agente: "¡Sí! Tenemos las Air Max en talla 42 disponibles 👟

         Te cuento los modelos:
         • Air Max 90 (negro) — S/299 ✅
         • Air Max 90 (blanco) — S/299 ✅
         • Air Max 270 (negro) — S/349 ✅
         • Air Max 270 (rojo) — S/349 — ⚡ ¡Solo quedan 2!

         ¿Cuál te interesa?"
```

### Out of Stock with Alternative
```
Cliente: "Quiero unas Adidas Superstar talla 39"
Agente: [consulta ERPNext]
Agente: "Lamentablemente las Superstar talla 39 no están disponibles
         en este momento 😔

         Pero tenemos estas opciones similares en tu talla:
         • Adidas Stan Smith — S/279 ✅
         • Adidas Gazelle — S/259 ✅
         • Puma Suede Classic — S/199 ✅

         También puedo avisarte cuando lleguen las Superstar.
         ¿Te interesa?"
Cliente: "Sí, avísame cuando lleguen"
Agente: "¡Anotado! Te aviso apenas lleguen las Superstar talla 39 📝✅"
[Registra en wishlist para notificación vía agente-followup]
```

### Business Owner Stock Report
```
Dueño: "¿Cómo anda el inventario?"
Agente: [consulta ERPNext + postgres]
Agente: "📊 Resumen de inventario:

         📦 Total SKUs activos: 234
         ✅ Con stock sano: 198 (85%)
         ⚠️ Stock bajo: 24 productos
         🚨 Stock crítico: 8 productos
         ❌ Agotados: 4 productos

         🔥 Los que más se están vendiendo:
         • Air Max 90 — 12 pares/semana (stock: 18, para ~1.5 semanas)
         • Revolution 6 — 8 pares/semana (stock: 45, tranquilo)

         🚨 Urgente reponer:
         • Havaianas 37 — 0 en stock, 5 clientes preguntaron
         • Nike Court Vision 41 — 1 par, se vende 3/semana
         • Adidas Superstar 39 — 0 en stock, 3 en lista de espera

         ¿Quieres que prepare un pedido de reposición?"
```

### Reorder Suggestion
```
Dueño: "Prepárame las sugerencias de reposición"
Agente: [calcula basado en velocidad de venta]
Agente: "📋 Sugerencia de reposición basada en ventas del último mes:

         Prioridad Alta:
         • Havaianas 37 — Pedir: 20 pares (venta: 8/semana)
         • Nike Court Vision 41 — Pedir: 15 pares (venta: 3/semana)
         • Adidas Superstar 39 — Pedir: 12 pares (venta: 2/semana)

         Prioridad Media:
         • Air Max 90 negro 42 — Pedir: 24 pares (venta: 6/semana)
         • Puma Suede 40 — Pedir: 10 pares (venta: 2/semana)

         💰 Inversión estimada: S/4,230 (costo)
         📈 Venta estimada: S/8,960 (a precio actual)

         ¿Confirmo el pedido con los proveedores?"
```

### Price Lookup
```
Cliente: "¿Cuánto cuestan las sandalias Havaianas?"
Agente: [consulta ERPNext]
Agente: "Las Havaianas las tenemos así:

         🩴 Havaianas Top — S/39
         🩴 Havaianas Brasil — S/49
         🩴 Havaianas Slim — S/45
         🩴 Havaianas Color Mix — S/42

         Tallas disponibles: 35 al 44
         ¿Cuál te gusta?"
```

## Configuration
- `INVENTORY_REORDER_POINT` — Default units below which to trigger low stock alert (default: 10)
- `INVENTORY_CRITICAL_LEVEL` — Units below which to trigger critical alert (default: 3)
- `INVENTORY_ALERT_CHANNEL` — Where to send alerts: "whatsapp", "email", "both" (default: "whatsapp")
- `INVENTORY_ALERT_CONTACTS` — WhatsApp numbers to receive stock alerts (comma-separated)
- `INVENTORY_CHECK_CRON` — Cron schedule for periodic stock checks (default: "0 8,14,20 * * *")
- `INVENTORY_RESERVATION_TIMEOUT_HOURS` — Hours to hold reserved stock before releasing (default: 48)
- `INVENTORY_LOW_STOCK_DISPLAY` — Show "low stock" to customers when units <= X (default: 3)
- `INVENTORY_SHOW_EXACT_STOCK` — Show exact stock numbers to customers (default: false)
- `INVENTORY_MULTI_WAREHOUSE` — Enable multi-warehouse stock view (default: false)
- `INVENTORY_DEFAULT_WAREHOUSE` — Default warehouse for stock checks

## Error Handling & Edge Cases
- **ERPNext unreachable:** If the MCP connection fails, don't tell the customer "system error". Say: "Déjame verificar la disponibilidad y te confirmo en unos minutos." Queue the check and retry.
- **Race condition on stock:** Two customers could try to buy the last unit simultaneously. Use stock reservation to prevent overselling. If reservation fails, apologize and offer alternatives.
- **Negative stock:** ERPNext can sometimes show negative stock (returns, adjustments). Treat negative as zero for customer-facing queries. Alert the business owner.
- **Product not found:** If a product search returns no results, broaden the search terms. Try category, brand, partial name. If still nothing: "No encontré ese producto en nuestro catálogo. ¿Podrías darme más detalles?"
- **Price discrepancy:** If the price in ERPNext differs from what was previously quoted to a customer, honor the quoted price and alert the business owner about the discrepancy.
- **Bulk stock updates:** If the business owner is doing a stock take, batch the updates. Don't send individual alerts for each item adjusted.
- **Seasonal items:** Some items may be seasonal. Don't suggest reordering out-of-season items. Check the item's "active" flag.
- **Currency formatting:** Always format prices according to the business's locale (S/ for Peru, $ for Colombia/Mexico).
