# yaya-suppliers — Supplier & Purchase Order Management

## Description
WhatsApp-native supplier management and purchase ordering for LATAM small businesses. Tracks suppliers, manages purchase orders, records deliveries, compares prices across vendors, and generates reorder alerts — all via natural Spanish chat. Designed for the 1.3M+ Peruvian MYPEs (bodegas, ferreterías, restaurants, tiendas) where purchasing is done informally via phone calls, WhatsApp messages, and market visits with zero documentation. Replaces the mental supplier rolodex with a digital one, turns scattered WhatsApp purchase conversations into trackable orders, and finally answers "¿quién me vende más barato?" and "¿qué tengo que pedir esta semana?"

The skill bridges the gap between expense tracking (yaya-expenses records the spend) and inventory (what's in stock) by managing what happens in between: who do I buy from, what do I order, when does it arrive, and am I getting a good price?

## When to Use
- Business owner mentions a supplier ("mi proveedor", "el distribuidor", "en el mercado", "el mayorista")
- Business owner wants to place or track an order ("necesito pedir", "ya pedí", "encargué", "hice un pedido")
- Business owner receives a delivery ("llegó la mercadería", "me trajeron", "recibí el pedido")
- Business owner asks about supplier prices ("¿a cuánto me vende?", "¿quién me da más barato?")
- Business owner asks what to reorder ("¿qué tengo que pedir?", "¿qué me falta?")
- Business owner has a supplier issue ("no llegó", "vino incompleto", "me cobró de más", "mala calidad")
- Business owner compares suppliers for the same product ("¿compro de X o de Y?")
- Business owner returns from market/mayorista and wants to log what they bought
- Business owner wants to know spending by supplier ("¿cuánto le he comprado a X?")
- Business owner prepares for a market trip ("¿qué necesito comprar mañana en el mercado?")
- A reorder point is hit (stock drops below minimum for a tracked item)
- A scheduled weekly order reminder triggers via cron

## Target Users
- **Bodegueras/bodegueros** — Buy from distributors (Backus, Gloria, Alicorp) + mayoristas. 500K+ in Peru.
- **Ferreterías** — Buy from fabricantes and distribuidoras. Complex B2B credit terms. 200K+ in Peru.
- **Restaurantes/pollerías** — Daily market purchases + weekly distributor orders. 143K+ in Peru.
- **Tiendas de abarrotes** — Similar to bodegas, simpler supply chain. 300K+ in Peru.
- **Peluquerías/salones** — Product suppliers (shampoo, tintes, etc.). 50-80K in Peru.
- **Any micro-business** that buys from suppliers and wants to track it

## Capabilities

### Core: Supplier Registry
- **Add supplier from chat** — "Mi proveedor de arroz es Don Carlos, su cel es 987654321" → creates supplier record with name, phone, category
- **Fuzzy supplier lookup** — "El de los pollos" → matches "Avícola San Fernando" via product category or nickname
- **Supplier categories** — Auto-tag: distribuidor, mayorista, fabricante, mercado, importador, freelance/artesano
- **Contact info** — Phone, WhatsApp, address, delivery days, payment terms
- **Supplier notes** — Free-text notes: "Siempre llega tarde los lunes", "Pedir antes de las 2pm", "Acepta devolver si viene mal"
- **Multiple suppliers per product** — Track 2-3 suppliers for the same item, with price comparison
- **CRM integration** — Suppliers stored as contacts with tag "proveedor" in crm-mcp, with extended supplier data in suppliers table

### Core: Purchase Orders
- **Create PO from chat** — "Pedirle a Avícola 50 pollos a S/15 c/u para mañana" → creates PO with items, quantities, prices, expected delivery date
- **Multi-item PO** — "Pide a Gloria: 20 cajas de leche, 10 de yogurt, 5 de mantequilla" → single PO, multiple line items
- **Quick reorder** — "Pide lo mismo que la semana pasada a [proveedor]" → duplicates last PO to same supplier
- **PO status tracking** — Draft → Sent → Confirmed → Delivered → Paid. Each status change logged with timestamp.
- **Send PO via WhatsApp** — "Mándale el pedido por WhatsApp" → uses whatsapp-mcp to send formatted order to supplier's phone
- **PO from voice** — "Necesito 100 bolsas de cemento Pacasmayo" via voice note → creates PO
- **Partial delivery** — "Llegaron solo 40 de los 50 pollos" → records partial receipt, flags pending balance
- **PO history** — "¿Qué le pedí a Gloria el mes pasado?" → retrieves historical POs

### Core: Delivery Reception
- **Log delivery** — "Llegó el pedido de Avícola" → marks PO as delivered, records actual quantities
- **Quantity verification** — "Pedí 50 pero llegaron 48" → records discrepancy, suggests action (claim, adjust)
- **Quality check notes** — "3 pollos vinieron mal" → records quality issue, links to supplier rating
- **Auto-expense creation** — Delivered PO automatically creates expense in yaya-expenses (category: inventario/materiales)
- **Receipt photo** — Send photo of guía de remisión or factura → linked to PO record

### Core: Price Tracking & Comparison
- **Price history** — Every PO records unit prices. "¿A cuánto me vendía el arroz Don Carlos en enero?" → retrieves historical prices
- **Price alerts** — "El pollo subió de S/15 a S/18" → proactive alert with margin impact (integrates with yaya-expenses COGS)
- **Supplier comparison** — "¿Quién me vende el cemento más barato?" → compares last price from each supplier for that item
- **Market price logging** — After market visit: "Hoy el lenguado estaba a S/45 en San Pedro" → records market price for trend tracking
- **Price trend charts** — "¿Cómo ha variado el precio del pollo?" → shows price history over weeks/months (text-based for WhatsApp)

### Reorder Management
- **Reorder points** — "Avísame cuando tenga menos de 10 bolsas de cemento" → sets minimum stock threshold
- **Weekly reorder list** — Cron generates: "📋 Pedidos sugeridos esta semana:\n• Arroz (stock bajo) → Don Carlos: 20 sacos a S/85\n• Leche (se acaba jueves) → Gloria: 15 cajas a S/42\n• Cemento (pedido mensual) → Pacasmayo: 100 bolsas a S/28"
- **Seasonal adjustments** — After enough data: "Ojo: en diciembre siempre pides 40% más pollo. ¿Quieres que ajuste?"
- **Shopping list for market** — "¿Qué necesito comprar mañana en el mercado?" → generates prioritized list based on stock levels and consumption patterns

### Supplier Performance
- **Delivery reliability** — Tracks on-time vs late deliveries per supplier: "Avícola: 85% a tiempo, Gloria: 95% a tiempo"
- **Quality scoring** — Tracks quality issues per supplier: "Don Carlos: 2 reclamos en 20 pedidos (90% calidad)"
- **Price stability** — "Gloria no ha subido precios en 6 meses. Avícola subió 3 veces."
- **Payment terms tracking** — "Gloria: contado. Avícola: crédito 15 días. Pacasmayo: crédito 30 días."
- **Spending by supplier** — "Este mes le compraste S/4,500 a Gloria, S/3,200 a Avícola, S/1,800 a Don Carlos"

### Supplier Issues & Claims
- **Log complaint** — "Avícola me mandó pollos chicos" → records complaint with date, details, severity
- **Track resolution** — "Me dieron nota de crédito por S/50" → links resolution to complaint
- **Dispute history** — "¿Cuántas veces he tenido problema con Avícola?" → lists all complaints, resolutions
- **Blacklist supplier** — "No le compres más a X" → marks supplier as inactive with reason

## MCP Tools Required
- `postgres-mcp` — Supplier records, purchase orders, deliveries, price history, reorder points, complaints
- `crm-mcp` — Supplier as contact (tag: "proveedor"), interaction logging for orders/deliveries/complaints
- `erpnext-mcp` — Product catalog lookup for item matching, stock levels for reorder calculations
- `whatsapp-mcp` — Send PO to supplier via WhatsApp, receive delivery confirmations, send payment reminders
- `forex-mcp` — Currency conversion for imported goods (USD/CNY/EUR → PEN)

## Data Model

### PostgreSQL Tables

```sql
-- ══════════════════════════════════════════════════════════
-- SUPPLIERS (extends crm-mcp contacts with supplier-specific data)
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS business.suppliers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    contact_id UUID REFERENCES business.contacts(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    phone TEXT,
    whatsapp TEXT,
    address TEXT,
    category TEXT CHECK (category IN (
        'distribuidor', 'mayorista', 'fabricante',
        'mercado', 'importador', 'artesano', 'otro'
    )),
    payment_terms TEXT DEFAULT 'contado' CHECK (payment_terms IN (
        'contado', 'credito_7', 'credito_15', 'credito_30',
        'credito_60', 'consignacion', 'mixto'
    )),
    credit_limit NUMERIC(12,2),
    delivery_days TEXT[],             -- ['lunes', 'miercoles', 'viernes']
    lead_time_days INTEGER DEFAULT 1, -- days from order to delivery
    minimum_order NUMERIC(12,2),      -- minimum order amount
    notes TEXT,
    rating NUMERIC(3,2) DEFAULT 5.0,  -- 1.0 to 5.0 composite rating
    is_active BOOLEAN DEFAULT TRUE,
    deactivated_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_contact ON business.suppliers(contact_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_category ON business.suppliers(category);
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON business.suppliers(is_active);
CREATE INDEX IF NOT EXISTS idx_suppliers_name_trgm ON business.suppliers USING gin (name gin_trgm_ops);

-- ══════════════════════════════════════════════════════════
-- SUPPLIER PRODUCTS (what each supplier sells and at what price)
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS business.supplier_products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    supplier_id UUID NOT NULL REFERENCES business.suppliers(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    product_code TEXT,                 -- ERPNext item code if linked
    unit TEXT DEFAULT 'unidad',        -- unidad, kg, caja, saco, bolsa, litro, docena
    current_price NUMERIC(12,2),
    currency TEXT DEFAULT 'PEN',
    last_price_update TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sp_supplier ON business.supplier_products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_sp_product_trgm ON business.supplier_products USING gin (product_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_sp_code ON business.supplier_products(product_code);

-- ══════════════════════════════════════════════════════════
-- PRICE HISTORY (track every price change)
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS business.price_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    supplier_product_id UUID NOT NULL REFERENCES business.supplier_products(id) ON DELETE CASCADE,
    price NUMERIC(12,2) NOT NULL,
    currency TEXT DEFAULT 'PEN',
    source TEXT DEFAULT 'po',          -- po (from purchase order), manual, market_visit, invoice
    recorded_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ph_product ON business.price_history(supplier_product_id, recorded_at DESC);

-- ══════════════════════════════════════════════════════════
-- PURCHASE ORDERS
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS business.purchase_orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    supplier_id UUID NOT NULL REFERENCES business.suppliers(id) ON DELETE RESTRICT,
    po_number TEXT,                     -- auto-generated: PO-2026-001
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft', 'sent', 'confirmed', 'partial',
        'delivered', 'paid', 'cancelled', 'disputed'
    )),
    order_date TIMESTAMPTZ DEFAULT now(),
    expected_delivery DATE,
    actual_delivery TIMESTAMPTZ,
    subtotal NUMERIC(12,2) DEFAULT 0,
    tax_amount NUMERIC(12,2) DEFAULT 0,   -- IGV if applicable
    total NUMERIC(12,2) DEFAULT 0,
    currency TEXT DEFAULT 'PEN',
    payment_method TEXT,               -- efectivo, transferencia, credito
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN (
        'pending', 'partial', 'paid', 'credit'
    )),
    notes TEXT,
    sent_via TEXT,                      -- whatsapp, phone, in_person, email
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_po_supplier ON business.purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_po_status ON business.purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_po_date ON business.purchase_orders(order_date DESC);
CREATE INDEX IF NOT EXISTS idx_po_delivery ON business.purchase_orders(expected_delivery);

-- ══════════════════════════════════════════════════════════
-- PURCHASE ORDER LINE ITEMS
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS business.po_line_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    po_id UUID NOT NULL REFERENCES business.purchase_orders(id) ON DELETE CASCADE,
    supplier_product_id UUID REFERENCES business.supplier_products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity NUMERIC(12,3) NOT NULL,
    unit TEXT DEFAULT 'unidad',
    unit_price NUMERIC(12,2) NOT NULL,
    total NUMERIC(12,2) NOT NULL,
    received_quantity NUMERIC(12,3) DEFAULT 0,
    quality_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_poli_po ON business.po_line_items(po_id);

-- ══════════════════════════════════════════════════════════
-- DELIVERY RECEIPTS
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS business.delivery_receipts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    po_id UUID NOT NULL REFERENCES business.purchase_orders(id) ON DELETE CASCADE,
    received_at TIMESTAMPTZ DEFAULT now(),
    received_by TEXT,
    is_complete BOOLEAN DEFAULT TRUE,
    discrepancy_notes TEXT,
    quality_issues TEXT,
    photo_url TEXT,                     -- guía de remisión photo
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dr_po ON business.delivery_receipts(po_id);

-- ══════════════════════════════════════════════════════════
-- SUPPLIER COMPLAINTS
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS business.supplier_complaints (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    supplier_id UUID NOT NULL REFERENCES business.suppliers(id) ON DELETE CASCADE,
    po_id UUID REFERENCES business.purchase_orders(id) ON DELETE SET NULL,
    complaint_type TEXT NOT NULL CHECK (complaint_type IN (
        'late_delivery', 'short_delivery', 'quality',
        'wrong_product', 'overcharge', 'damaged', 'other'
    )),
    description TEXT NOT NULL,
    severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status TEXT DEFAULT 'open' CHECK (status IN (
        'open', 'in_progress', 'resolved', 'unresolved'
    )),
    resolution TEXT,
    credit_amount NUMERIC(12,2),       -- nota de crédito received
    created_at TIMESTAMPTZ DEFAULT now(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sc_supplier ON business.supplier_complaints(supplier_id);
CREATE INDEX IF NOT EXISTS idx_sc_status ON business.supplier_complaints(status);

-- ══════════════════════════════════════════════════════════
-- REORDER POINTS
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS business.reorder_points (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_name TEXT NOT NULL,
    product_code TEXT,                  -- ERPNext item code if linked
    preferred_supplier_id UUID REFERENCES business.suppliers(id) ON DELETE SET NULL,
    minimum_stock NUMERIC(12,3) NOT NULL,
    reorder_quantity NUMERIC(12,3) NOT NULL,
    unit TEXT DEFAULT 'unidad',
    check_frequency TEXT DEFAULT 'weekly' CHECK (check_frequency IN (
        'daily', 'weekly', 'monthly'
    )),
    last_checked TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rp_product ON business.reorder_points(product_name);
CREATE INDEX IF NOT EXISTS idx_rp_supplier ON business.reorder_points(preferred_supplier_id);
```

## Response Formats (WhatsApp-Optimized)

### Supplier Created
```
✅ Proveedor registrado:
👤 *Don Carlos* (mayorista)
📱 987 654 321
🚛 Entrega: lunes y jueves
💰 Pago: contado
📝 "Pedir antes de las 2pm"
```

### Purchase Order Created
```
📦 *Pedido #PO-2026-042*
🏪 Avícola San Fernando
📅 Para: mañana (22 mar)

• 50 pollos enteros — S/15.00 c/u = S/750.00
• 20 kg menudencia — S/8.00/kg = S/160.00

💰 *Total: S/910.00*
💳 Pago: crédito 15 días

¿Lo mando por WhatsApp al proveedor? 📲
```

### PO Sent via WhatsApp (message to supplier)
```
Hola Don Fernando, buenos días 🙌
Le mando el pedido para mañana:

📦 50 pollos enteros a S/15 c/u
📦 20 kg menudencia a S/8/kg

Total: S/910

¿Me confirma? 🙏
```

### Delivery Received
```
✅ *Pedido #PO-2026-042 recibido*
🏪 Avícola San Fernando
📅 22 mar 2026, 6:15 AM

Recibido:
• 48/50 pollos enteros ⚠️ (-2)
• 20/20 kg menudencia ✅

⚠️ *Faltaron 2 pollos* (S/30.00)
→ ¿Quieres que le reclame al proveedor?

💸 Gasto registrado: S/880.00 (inventario)
```

### Price Comparison
```
📊 *Comparación: Cemento Portland*

🏪 Pacasmayo Directo
   S/28.50/bolsa — última compra: 15 mar
   🚛 Entrega: 2-3 días
   ⭐ 4.8/5.0

🏪 Distribuidora Arequipa
   S/29.00/bolsa — última compra: 10 mar
   🚛 Entrega: mismo día
   ⭐ 4.2/5.0

🏪 Maestro (emergencia)
   S/34.90/bolsa — precio retail
   🚛 Entrega: inmediata
   ⭐ —

💡 *Pacasmayo* es S/0.50 más barato pero tarda 2 días.
Para urgencias, *Distribuidora Arequipa* entrega hoy.
```

### Reorder Alert (proactive)
```
⚠️ *Alerta de stock bajo*

📦 Arroz Extra — quedan ~5 sacos
   🔄 Mínimo: 10 sacos
   👤 Proveedor sugerido: Don Carlos (mayorista)
   💰 Último precio: S/85/saco
   📱 ¿Le pido 20 sacos? (total ~S/1,700)

📦 Aceite Primor 1L — quedan ~8 cajas
   🔄 Mínimo: 12 cajas
   👤 Proveedor sugerido: Gloria Distribuciones
   💰 Último precio: S/42/caja
   📱 ¿Agrego al pedido de Gloria? (total ~S/168)
```

### Supplier Spending Summary
```
📊 *Compras del mes — Marzo 2026*

🏪 *Gloria Distribuciones* — S/4,500
   12 pedidos | 100% a tiempo | 0 reclamos ⭐

🏪 *Avícola San Fernando* — S/3,200
   8 pedidos | 87% a tiempo | 1 reclamo ⚠️

🏪 *Don Carlos (mayorista)* — S/1,800
   4 pedidos | 75% a tiempo | 0 reclamos

💰 *Total compras: S/9,500*
📈 vs febrero: +8% (S/8,800)
```

### Market Trip Shopping List
```
🛒 *Lista para el mercado mañana*

Basado en tu stock y ventas:
1. 🐔 Pollo (10 unidades) — ayer estaba a S/15/u
2. 🐟 Lenguado (8 kg) — ayer a S/45/kg
3. 🍋 Limones (2 sacos) — ayer a S/25/saco
4. 🧅 Cebolla (1 saco) — ayer a S/18/saco
5. 🌶️ Ají amarillo (3 kg) — ayer a S/12/kg

💰 *Presupuesto estimado: S/540*
📝 Tip: Los sábados el lenguado baja ~S/3/kg

¿Quieres agregar algo más? ✏️
```

### Weekly Order Summary
```
📋 *Resumen semanal de pedidos*
Semana del 15 al 21 de marzo

📦 Pedidos realizados: 6
✅ Entregados completos: 4
⚠️ Entregados con faltantes: 1
⏳ Pendientes: 1

💰 Total compras: S/4,250
💳 Pagado: S/3,100
📝 Crédito pendiente: S/1,150

🏆 Mejor proveedor: Gloria (100% a tiempo)
⚠️ Pendiente: Reclamar S/30 a Avícola (2 pollos faltantes)
```

## Interaction Flows

### Flow 1: Registrar Proveedor
```
Owner: "Mi nuevo proveedor de aceite es Juan Pérez, 976543210, viene los martes"
Yaya: "✅ Proveedor registrado:
       👤 *Juan Pérez*
       📱 976 543 210
       🚛 Entrega: martes
       💰 Pago: contado (¿quieres cambiar?)
       
       ¿Qué productos te vende? Así los registro con precios."
Owner: "Aceite Primor 1L a S/42 la caja y aceite a granel a S/7.50 el litro"
Yaya: "✅ Productos de Juan Pérez:
       • Aceite Primor 1L — S/42.00/caja
       • Aceite a granel — S/7.50/litro
       
       Listo, cuando necesites pedirle algo, dime nomás 👍"
```

### Flow 2: Crear y Enviar Pedido
```
Owner: "Pídele a Gloria 20 cajas de leche y 10 de yogurt para el jueves"
Yaya: "📦 *Pedido para Gloria Distribuciones*
       📅 Entrega: jueves 23 mar
       
       • 20 cajas leche Gloria — S/38.00 c/u = S/760.00
       • 10 cajas yogurt Gloria — S/45.00 c/u = S/450.00
       
       💰 *Total: S/1,210.00*
       
       ¿Se lo mando por WhatsApp? 📲"
Owner: "Sí, mándale"
Yaya: "✅ Pedido #PO-2026-043 enviado a Gloria por WhatsApp 📲
       Te aviso cuando confirmen."
```

### Flow 3: Recibir Entrega con Faltante
```
Owner: "Llegó el pedido de Gloria pero faltan 2 cajas de yogurt"
Yaya: "📦 Recibiendo pedido #PO-2026-043 de Gloria...
       
       ✅ 20/20 cajas leche — completo
       ⚠️ 8/10 cajas yogurt — *faltan 2*
       
       Faltante: 2 cajas yogurt (S/90.00)
       
       ¿Qué hacemos?
       1️⃣ Reclamar las 2 cajas faltantes
       2️⃣ Pedir nota de crédito por S/90
       3️⃣ Dejarlo así por ahora"
Owner: "Reclámale las 2 cajas"
Yaya: "📲 Le mandé mensaje a Gloria:
       'Hola, del pedido de hoy faltaron 2 cajas de yogurt. 
        ¿Pueden enviarlas mañana? Gracias 🙏'
       
       ⚠️ Reclamo #1 registrado. Te aviso si responden."
```

### Flow 4: Comparar Precios
```
Owner: "¿Quién me vende el arroz más barato?"
Yaya: "📊 *Comparación: Arroz Extra (saco 50kg)*
       
       🏪 Don Carlos (mayorista)
          S/85.00/saco — compra del 18 mar
          Entrega: lunes, jueves | Pago: contado
       
       🏪 Distribuidora Lima
          S/88.00/saco — compra del 5 mar
          Entrega: cualquier día | Pago: crédito 15d
       
       💡 Don Carlos es S/3 más barato.
       Pero Distribuidora Lima te da crédito 15 días.
       
       ¿Cuántos sacos necesitas? Te armo el pedido."
```

### Flow 5: Lista de Compras para Mercado
```
Owner: "¿Qué necesito comprar mañana en el mercado?"
Yaya: "🛒 *Lista para el mercado — sábado 22 mar*
       
       Basado en tu stock y ventas de la semana:
       
       🔴 Urgente:
       1. 🐔 Pollo (15 u) — ayer S/15/u — quedan solo 3
       2. 🍋 Limones (3 sacos) — ayer S/25/saco — se acabaron hoy
       
       🟡 Esta semana:
       3. 🐟 Pescado lenguado (10 kg) — ayer S/45/kg
       4. 🧅 Cebolla (2 sacos) — ayer S/18/saco
       
       🟢 Puede esperar:
       5. 🌶️ Ají (5 kg) — ayer S/12/kg — tienes para 3 días
       
       💰 *Presupuesto estimado: S/780*
       💡 Tip: El sábado es buen día para lenguado
       
       ¿Quieres ajustar cantidades? ✏️"
```

## Integration Points

### With yaya-expenses
- Delivered POs automatically create an expense entry (category: inventario/materiales)
- Supplier spending is visible in expense reports
- Price changes trigger COGS recalculation and margin alerts
- Market purchases logged as expenses with supplier attribution

### With yaya-fiados
- Supplier credit terms (crédito 15/30 días) tracked as "proveedor fiados" — reverse direction
- Outstanding supplier credit shown in financial summaries

### With crm-mcp
- Suppliers stored as contacts with tag "proveedor" + extended data in suppliers table
- All orders, deliveries, complaints logged as interactions
- Supplier segmentation: by reliability, spend, category

### With yaya-analytics
- Purchase patterns feed demand forecasting
- "You bought 30% more pollo in December" → seasonal planning
- Spending trends by category visible in dashboards

### With yaya-inventory / erpnext-mcp
- Stock levels trigger reorder alerts
- Received deliveries update inventory counts
- Product codes linked between PO items and inventory items

### With whatsapp-mcp
- Send POs to suppliers via WhatsApp
- Send complaint/claim messages
- Receive delivery confirmations (future: automated via webhook)

## Proactive Behaviors
- **Reorder alerts** — When stock drops below minimum, suggest order with preferred supplier and last price
- **Price change alerts** — When a supplier's price differs from last order: "Ojo: el pollo subió S/3 (+20%)"
- **Delivery reminders** — Morning of expected delivery: "Hoy llega pedido de Gloria (20 cajas leche + 10 yogurt)"
- **Payment reminders** — Credit approaching due date: "Le debes S/1,210 a Gloria (vence en 3 días)"
- **Weekly purchase summary** — Sunday night: total purchases, by supplier, pending claims, credit balances
- **Supplier rating updates** — Monthly: "Avícola bajó a 4.2⭐ — 2 entregas tarde y 1 reclamo de calidad"

## Edge Cases
- **No price on file** — "No tengo precio registrado para [producto] de [proveedor]. ¿A cuánto te lo vende?"
- **Unknown supplier** — "No tengo registrado a ese proveedor. ¿Me das su nombre y teléfono?"
- **Duplicate supplier** — "Ya tienes un proveedor llamado 'Carlos'. ¿Es el mismo Carlos de la calle Gamarra o es otro?"
- **Market purchase (no PO)** — "Entendido, compraste en el mercado sin pedido previo. Lo registro como compra directa."
- **Multi-currency** — "Pedido en USD al proveedor de China: forex-mcp convierte a PEN al tipo de cambio SBS del día"
- **Voice note** — "Escuché: 'Pídele a Avícola 50 pollos para mañana'. ¿Confirmo el pedido?"
- **Supplier doesn't respond** — "Gloria no ha confirmado el pedido de hace 4 horas. ¿Quieres que le mande otro mensaje o la llamas?"

## Cultural Notes
- Use informal, warm tone with suppliers ("Don", "Doña", first names)
- Respect that many supplier relationships are decades-old and personal
- Never send aggressive messages to suppliers — business relationships are sacred
- Market purchases are inherently informal — don't over-structure them
- Credit terms ("me fía") are normal in B2B — track without judgment
- "Guía de remisión" is the physical delivery document — ask for photo when relevant
- Price negotiation is expected — provide data to support, not dictate
