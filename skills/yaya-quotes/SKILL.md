# yaya-quotes — B2B Quotation / Cotización Generator

## Description
WhatsApp-native B2B quotation (cotización) generation for ferreterías, wholesalers, and any business that sends price quotes to clients. Creates professional cotizaciones from natural chat or voice notes, auto-calculates subtotals with IGV (18%), manages sequential numbering, tracks quote status through acceptance or expiry, and converts accepted quotes into orders — all via natural Spanish. Designed for the 40-60K+ Peruvian ferreterías and the broader B2B ecosystem (construction suppliers, wholesalers, manufacturers, distributors) where quoting is done daily via WhatsApp, phone calls, and handwritten notes. Replaces the mental calculator and the cuaderno de cotizaciones with a digital quotation system that integrates with inventory, CRM, and order management.

The skill bridges the gap between sales inquiry (yaya-sales handles customer chat) and order management (yaya-suppliers handles purchasing) by managing the outbound pricing step: what does the customer want, at what price, and did they accept?

## When to Use
- Business owner needs to create a quote ("cotízame", "hazme una cotización", "manda precio a", "cotización para")
- Customer asks for pricing ("¿a cuánto?", "¿cuánto cuesta?", "dame precio por volumen", "necesito cotización")
- Business owner receives a voice note requesting prices ("Cotízame 50 bolsas de cemento Pacasmayo")
- A quote needs follow-up ("¿qué pasó con la cotización de Juan?", "¿aceptó?")
- Business owner wants to convert a quote to an order ("el cliente aceptó la cotización", "conviértela en pedido")
- Business owner asks about quote history ("¿cuántas cotizaciones le he mandado a Juan?", "¿qué le coticé la vez pasada?")
- Business owner wants to check win rate ("¿cuántas cotizaciones se concretan?", "¿cuál es mi tasa de cierre?")
- A quote is about to expire (proactive reminder: 1 day before validity ends)
- A quote follow-up timer triggers (3 days after sending without response)
- Business owner needs bulk/volume pricing tiers ("dame precio por volumen", "¿cuánto si me lleva 100?")
- Business owner needs a quote in USD for import clients ("cotización en dólares")
- Business owner wants to send a quote via WhatsApp or generate a PDF
- Business owner compares competing quotes or pricing strategies

## Target Users
- **Ferreterías** — Quote daily to construction contractors (maestros de obra, ingenieros civiles). 40-60K+ in Peru.
- **Distribuidoras/mayoristas** — Send volume quotes to retailers and businesses. 20K+ in Peru.
- **Proveedores de construcción** — Aggregate materials quotes for projects (fierro, cemento, ladrillos, tuberías). 15K+.
- **Fabricantes locales** — Quote custom manufacturing orders (puertas, muebles, estructuras metálicas). 10K+.
- **Importadores** — Multi-currency quotes for goods priced in USD/CNY. 5K+.
- **Any B2B micro-business** that regularly sends price quotes to clients before confirming an order.

## Capabilities

### Core: Quick Quote Generation
- **Quote from chat** — "Cotización para Juan: 50 bolsas cemento a S/32, 20 fierros 1/2 a S/45, 100 ladrillos a S/0.80" → creates formatted cotización with line items, subtotal, IGV, total
- **Quote from voice** — Voice note: "Cotízame 50 bolsas de cemento Pacasmayo, 20 fierros de media, y dame precio por volumen" → transcribe, look up products/prices, generate quote
- **Auto-calculation** — Subtotal, IGV (18%), and total calculated automatically. No manual math.
- **Product lookup** — "50 bolsas cemento" → matches to "Cemento Pacasmayo Tipo I" from erpnext-mcp inventory with current price
- **Customer lookup** — "para Juan" → matches to "Juan Pérez, Constructora JP, RUC 20456789012" from crm-mcp
- **Multi-item quotes** — Single quote with unlimited line items, each with quantity, unit, unit price, line total
- **Quote from previous** — "Cotiza lo mismo que le mandé a Pedro la semana pasada pero con precios nuevos" → clones previous quote with updated prices

### Core: Quote Numbering & Tracking
- **Sequential numbering** — COT-2026-001, COT-2026-002... auto-incremented per year
- **Status tracking** — Draft → Sent → Viewed → Accepted → Converted to Order / Rejected / Expired
- **Quote validity** — Default 7 days, configurable per quote or per business (3, 7, 15, 30 days)
- **Expiry alerts** — Proactive: "La cotización COT-2026-015 para Juan vence mañana. ¿Quieres extender o hacer seguimiento?"
- **Quote versioning** — Revise a quote: "Actualiza la cotización de Juan, baja el cemento a S/30" → creates v2, links to original

### Core: Pricing & Discounts
- **Volume discounts / bulk tiers** — Define tiers per product: 1-10 unidades = S/35, 11-50 = S/32, 51+ = S/30. Auto-apply based on quantity.
- **Client-specific pricing** — VIP clients get special rates: "Juan siempre paga S/30 por bolsa de cemento" → saved to client profile
- **Quote-level discounts** — "Dale 5% de descuento en toda la cotización" → applies percentage across all line items
- **Bundle pricing** — "Si lleva cemento + fierro + ladrillos, dale S/50 de descuento" → combo discount
- **Price comparison for customer** — Show savings on bulk: "Si llevas 100 en vez de 50, ahorras S/200 (de S/35 a S/32 por unidad)"
- **Margin protection** — Warn if a discount drops below cost: "Ojo: a S/28 estás vendiendo por debajo del costo (S/29.50)"
- **Currency support** — PEN (default), USD for import clients. Conversion via forex-mcp at SBS exchange rate of the day.

### Core: Quote Delivery
- **WhatsApp-formatted** — Send beautiful quote directly to client's WhatsApp via whatsapp-mcp with emojis, structure, totals
- **PDF generation** — Generate formal PDF cotización for clients who need a printed/emailed document (includes business logo, RUC, address)
- **Quote preview** — Show business owner the formatted quote before sending: "¿Así está bien? Mando?"
- **Delivery confirmation** — Log when and how the quote was sent (WhatsApp, PDF, phone, in-person)

### Core: Follow-up & Conversion
- **Auto follow-up** — 3 days after sending (configurable), if no response: "Han pasado 3 días y Juan no ha respondido a COT-2026-015. ¿Le mando un recordatorio?"
- **Follow-up message** — "Hola Juan, ¿pudiste revisar la cotización que te mandé? Los precios están vigentes hasta el viernes. Quedo atento 🙏"
- **Quote-to-order conversion** — "El cliente aceptó la cotización COT-2026-015, conviértela en pedido" → creates sales order from quote line items
- **Partial acceptance** — "Juan quiere solo el cemento y los fierros, no los ladrillos" → converts partial quote to order
- **Rejection tracking** — "Juan dijo que es muy caro" → logs rejection reason for analytics

### Quote History & Analytics
- **Per-customer history** — "¿Qué le he cotizado a Juan este año?" → list of all quotes with amounts and status
- **Win rate** — "¿Cuántas cotizaciones se concretan?" → accepted vs total, by period, by customer, by product
- **Revenue from quotes** — "¿Cuánto he facturado de cotizaciones este mes?" → sum of converted quotes
- **Average quote value** — Track average quote size over time
- **Time to accept** — Average days between sending a quote and customer accepting
- **Top quoted products** — Which products are quoted most, which convert best
- **Lost quote analysis** — Common rejection reasons, price sensitivity by product

## MCP Tools Required
- `erpnext-mcp` — Product catalog, current prices, stock availability, sales order creation from accepted quote
- `crm-mcp` — Customer lookup/creation, interaction logging, client-specific pricing, quote history per contact
- `postgres-mcp` — Quote records, line items, quote numbering sequences, pricing tiers, analytics, follow-up scheduling
- `whatsapp-mcp` — Send formatted quote to client, send follow-up reminders, receive acceptance/rejection responses
- `forex-mcp` — USD/PEN conversion at SBS daily rate for multi-currency quotes

## Data Model

### PostgreSQL Tables

```sql
-- ══════════════════════════════════════════════════════════
-- QUOTES (cotizaciones)
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS business.quotes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    quote_number TEXT NOT NULL UNIQUE,       -- COT-2026-001
    version INTEGER DEFAULT 1,               -- v1, v2 for revisions
    parent_quote_id UUID REFERENCES business.quotes(id) ON DELETE SET NULL,  -- links revised quotes
    customer_contact_id UUID,                -- crm-mcp contact reference
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    customer_ruc TEXT,                        -- for formal quotes
    customer_company TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft', 'sent', 'viewed', 'accepted',
        'partial', 'rejected', 'expired', 'cancelled'
    )),
    subtotal NUMERIC(12,2) DEFAULT 0,
    discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed', NULL)),
    discount_value NUMERIC(12,2) DEFAULT 0,
    discount_amount NUMERIC(12,2) DEFAULT 0, -- calculated discount in currency
    subtotal_after_discount NUMERIC(12,2) DEFAULT 0,
    igv_rate NUMERIC(5,4) DEFAULT 0.18,      -- 18% IGV
    igv_amount NUMERIC(12,2) DEFAULT 0,
    total NUMERIC(12,2) DEFAULT 0,
    currency TEXT DEFAULT 'PEN',
    exchange_rate NUMERIC(12,6),              -- USD→PEN rate if currency is USD
    payment_terms TEXT DEFAULT 'contado' CHECK (payment_terms IN (
        'contado', 'credito_15', 'credito_30',
        'credito_60', '50_50', 'otro'
    )),
    payment_terms_note TEXT,                  -- free text for custom terms
    validity_days INTEGER DEFAULT 7,
    valid_until DATE,
    delivery_terms TEXT,                      -- "Entrega en Lima incluida", "Puesto en obra", "Recojo en tienda"
    delivery_cost NUMERIC(12,2) DEFAULT 0,
    notes TEXT,                               -- additional notes for the quote
    rejection_reason TEXT,
    sent_via TEXT,                            -- whatsapp, pdf, phone, email, in_person
    sent_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    converted_order_id TEXT,                  -- ERPNext sales order ID if converted
    followup_at TIMESTAMPTZ,                 -- next follow-up scheduled
    followup_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quotes_number ON business.quotes(quote_number);
CREATE INDEX IF NOT EXISTS idx_quotes_customer ON business.quotes(customer_contact_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON business.quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_valid_until ON business.quotes(valid_until);
CREATE INDEX IF NOT EXISTS idx_quotes_followup ON business.quotes(followup_at) WHERE followup_at IS NOT NULL AND status = 'sent';
CREATE INDEX IF NOT EXISTS idx_quotes_created ON business.quotes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_customer_name_trgm ON business.quotes USING gin (customer_name gin_trgm_ops);

-- ══════════════════════════════════════════════════════════
-- QUOTE LINE ITEMS
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS business.quote_line_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    quote_id UUID NOT NULL REFERENCES business.quotes(id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    product_code TEXT,                        -- ERPNext item code if linked
    product_name TEXT NOT NULL,
    description TEXT,
    quantity NUMERIC(12,3) NOT NULL,
    unit TEXT DEFAULT 'unidad',              -- unidad, bolsa, varilla, millar, kg, metro, caja, plancha
    unit_price NUMERIC(12,2) NOT NULL,
    discount_percent NUMERIC(5,2) DEFAULT 0,
    line_total NUMERIC(12,2) NOT NULL,       -- quantity * unit_price * (1 - discount_percent/100)
    pricing_tier_applied TEXT,               -- e.g., "51+ units @ S/30.00"
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_qli_quote ON business.quote_line_items(quote_id);
CREATE INDEX IF NOT EXISTS idx_qli_product ON business.quote_line_items(product_code);

-- ══════════════════════════════════════════════════════════
-- PRICING TIERS (bulk/volume pricing per product)
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS business.pricing_tiers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_code TEXT,                        -- ERPNext item code
    product_name TEXT NOT NULL,
    min_quantity NUMERIC(12,3) NOT NULL,
    max_quantity NUMERIC(12,3),               -- NULL = unlimited (top tier)
    unit_price NUMERIC(12,2) NOT NULL,
    currency TEXT DEFAULT 'PEN',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pt_product ON business.pricing_tiers(product_code);
CREATE INDEX IF NOT EXISTS idx_pt_product_name_trgm ON business.pricing_tiers USING gin (product_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_pt_active ON business.pricing_tiers(is_active) WHERE is_active = TRUE;

-- ══════════════════════════════════════════════════════════
-- CLIENT PRICING (customer-specific prices)
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS business.client_pricing (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_contact_id UUID NOT NULL,       -- crm-mcp contact reference
    product_code TEXT,
    product_name TEXT NOT NULL,
    special_price NUMERIC(12,2) NOT NULL,
    currency TEXT DEFAULT 'PEN',
    valid_from DATE DEFAULT CURRENT_DATE,
    valid_until DATE,                        -- NULL = indefinite
    notes TEXT,                              -- "Precio especial por volumen mensual", "Cliente desde 2020"
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cp_customer ON business.client_pricing(customer_contact_id);
CREATE INDEX IF NOT EXISTS idx_cp_product ON business.client_pricing(product_code);
CREATE INDEX IF NOT EXISTS idx_cp_active ON business.client_pricing(is_active) WHERE is_active = TRUE;

-- ══════════════════════════════════════════════════════════
-- QUOTE SEQUENCE (for numbering COT-YYYY-NNN)
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS business.quote_sequences (
    year INTEGER NOT NULL PRIMARY KEY,
    last_number INTEGER NOT NULL DEFAULT 0
);

-- Function to get next quote number
CREATE OR REPLACE FUNCTION business.next_quote_number(p_year INTEGER DEFAULT EXTRACT(YEAR FROM now())::INTEGER)
RETURNS TEXT AS $$
DECLARE
    v_next INTEGER;
BEGIN
    INSERT INTO business.quote_sequences (year, last_number)
    VALUES (p_year, 1)
    ON CONFLICT (year) DO UPDATE SET last_number = business.quote_sequences.last_number + 1
    RETURNING last_number INTO v_next;
    RETURN 'COT-' || p_year || '-' || LPAD(v_next::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;
```

## Response Formats (WhatsApp-Optimized)

### Quote Created (Preview for Business Owner)
```
📋 *Cotización #COT-2026-015*
👤 Juan Pérez — Constructora JP
📅 Válida hasta: 28 mar 2026 (7 días)

  Cant.   Producto                    P.Unit    Total
  50      Cemento Pacasmayo Tipo I    S/32.00   S/1,600.00
  20      Fierro corrugado 1/2"       S/45.00   S/900.00
  100     Ladrillo King Kong 18H      S/0.80    S/80.00

                              Subtotal: S/2,580.00
                             IGV (18%): S/464.40
                              *TOTAL:   S/3,044.40*

💳 Pago: contado
🚛 Entrega: incluida en Lima

¿La mando por WhatsApp a Juan? 📲
```

### Quote Sent to Client (WhatsApp Message)
```
Hola Juan, buenos días 🙌

Le mando la cotización que me pidió:

📋 *Cotización #COT-2026-015*
📅 Válida hasta: 28 mar 2026

• 50 bolsas Cemento Pacasmayo — S/32.00 c/u = S/1,600.00
• 20 varillas Fierro 1/2" — S/45.00 c/u = S/900.00
• 100 Ladrillos King Kong 18H — S/0.80 c/u = S/80.00

  Subtotal: S/2,580.00
  IGV (18%): S/464.40
  *TOTAL: S/3,044.40*

💳 Pago: contado
🚛 Entrega incluida en Lima

Cualquier consulta me avisa 🙏
```

### Quote with Volume Discount
```
📋 *Cotización #COT-2026-018*
👤 Pedro Quispe — Constructora PQ
📅 Válida hasta: 4 abr 2026

  Cant.   Producto              P.Unit    Total
  100     Cemento Pacasmayo     S/30.00   S/3,000.00 💰
          ↳ Precio volumen (51+ unid. = S/30 vs S/35 regular)
  50      Fierro 1/2"           S/43.00   S/2,150.00 💰
          ↳ Precio volumen (51+ unid. = S/43 vs S/45 regular)

                              Subtotal: S/5,150.00
                   💰 Ahorro por volumen: S/600.00
                             IGV (18%): S/927.00
                              *TOTAL:   S/6,077.00*

📊 *Comparación:*
Sin descuento por volumen → S/6,785.00
Con descuento por volumen → S/6,077.00
💰 *Te ahorras S/708.00 (10.4%)*
```

### Quote Follow-up Reminder (to Business Owner)
```
⏰ *Seguimiento de cotizaciones*

📋 COT-2026-015 — Juan Pérez (Constructora JP)
   💰 S/3,044.40 | Enviada hace 3 días
   📅 Vence en 4 días
   → ¿Le mando un recordatorio por WhatsApp?

📋 COT-2026-012 — María Torres (Obras Torres)
   💰 S/8,250.00 | Enviada hace 5 días
   📅 Vence en 2 días
   → ¿Le mando un recordatorio o extendemos?

📋 COT-2026-010 — Carlos Ruiz
   💰 S/1,500.00 | ⚠️ Venció ayer
   → ¿Quieres renovar con precios actualizados?
```

### Quote Accepted / Conversion to Order
```
✅ *Cotización #COT-2026-015 aceptada*
👤 Juan Pérez — Constructora JP
💰 Total: S/3,044.40

📦 Pedido creado: #ORD-2026-089
• 50 bolsas Cemento Pacasmayo — S/1,600.00
• 20 varillas Fierro 1/2" — S/900.00
• 100 Ladrillos King Kong 18H — S/80.00

💳 Condiciones: contado
🚛 Entrega: programar con cliente

¿Coordino la entrega con Juan? 📲
```

### Quote History (Per Customer)
```
📊 *Historial de cotizaciones — Juan Pérez*

📋 COT-2026-015 | 21 mar | S/3,044.40 | ✅ Aceptada
📋 COT-2026-008 | 5 mar  | S/1,850.00 | ✅ Aceptada
📋 COT-2026-003 | 15 ene | S/5,200.00 | ❌ Rechazada (precio)
📋 COT-2025-089 | 10 dic | S/2,100.00 | ✅ Aceptada

📈 Resumen:
• 4 cotizaciones totales
• 3 aceptadas (75% tasa de cierre) ⭐
• Valor promedio: S/3,048.60
• Total facturado: S/6,994.40
• Tiempo promedio de respuesta: 2.3 días
```

### Win Rate Dashboard
```
📊 *Cotizaciones — Marzo 2026*

📋 Total enviadas: 24
✅ Aceptadas: 15 (62.5%)
❌ Rechazadas: 4 (16.7%)
⏳ Pendientes: 3
⌛ Expiradas: 2

💰 Valor total cotizado: S/85,400
💰 Valor aceptado: S/52,100 (61%)

🏆 Top productos cotizados:
1. Cemento Pacasmayo — 18 cotiz. (70% aceptación)
2. Fierro 1/2" — 14 cotiz. (65% aceptación)
3. Ladrillo King Kong — 10 cotiz. (80% aceptación)

📉 Razones de rechazo:
• Precio alto — 3 veces
• Eligió competencia — 1 vez

💡 Tip: Ladrillos tiene la mejor tasa de cierre.
Los clientes que reciben seguimiento aceptan 25% más.
```

### USD Quote (Multi-currency)
```
📋 *Cotización #COT-2026-022*
👤 Import Solutions SAC
📅 Válida hasta: 4 abr 2026
💱 Tipo de cambio: 1 USD = S/3.72 (SBS 21 mar)

  Cant.   Producto              P.Unit     Total
  200     Panel solar 400W      $85.00     $17,000.00
  50      Inversor 5KW          $320.00    $16,000.00

                      Subtotal USD: $33,000.00
                     IGV (18%) USD: $5,940.00
                      *TOTAL USD:   $38,940.00*

  Equivalente en soles: S/144,856.80

💳 Pago: 50% adelanto, 50% contra entrega
```

## Interaction Flows

### Flow 1: Quick Quote from Chat
```
Owner: "Cotización para Juan Pérez: 50 bolsas cemento a S/32, 20 fierros 1/2 a S/45, 100 ladrillos a S/0.80"
Yaya: [looks up Juan Pérez in crm-mcp → finds Constructora JP]
Yaya: [creates quote with line items, calculates IGV]
Yaya: "📋 *Cotización #COT-2026-015*
       👤 Juan Pérez — Constructora JP

       • 50 Cemento Pacasmayo — S/32.00 c/u = S/1,600.00
       • 20 Fierro 1/2" — S/45.00 c/u = S/900.00
       • 100 Ladrillo King Kong — S/0.80 c/u = S/80.00

       Subtotal: S/2,580.00
       IGV (18%): S/464.40
       *Total: S/3,044.40*

       Válida 7 días. ¿La mando por WhatsApp a Juan? 📲"
Owner: "Sí, mándale"
Yaya: [sends via whatsapp-mcp]
Yaya: "✅ Cotización #COT-2026-015 enviada a Juan (987 654 321) 📲
       Te aviso si responde. Seguimiento automático en 3 días."
```

### Flow 2: Quote from Voice Note
```
Owner: [voice note] "Cotízame 50 bolsas de cemento Pacasmayo, 20 fierros de media, y dame precio por volumen para el maestro Carlos del proyecto en San Isidro"
Yaya: [transcribes voice → looks up "maestro Carlos" in crm-mcp]
Yaya: [looks up products in erpnext-mcp → finds prices]
Yaya: [applies volume pricing tiers for 50 bolsas]
Yaya: "📋 *Cotización #COT-2026-016*
       👤 Carlos Mendoza — Proyecto San Isidro

       • 50 Cemento Pacasmayo Tipo I — S/32.00 c/u = S/1,600.00
         ↳ Precio volumen: 51+ a S/30.00 (ahorra S/100 más)
       • 20 Fierro corrugado 1/2" — S/45.00 c/u = S/900.00

       Subtotal: S/2,500.00
       IGV (18%): S/450.00
       *Total: S/2,950.00*

       💡 Si lleva 51+ bolsas de cemento, baja a S/30 c/u
       (total con 51 bolsas: S/2,880 + IGV = S/3,398.40)

       ¿Mando a Carlos? 📲"
```

### Flow 3: Follow-up and Conversion
```
[3 days after quote sent, no response]
Yaya: "⏰ Han pasado 3 días y Carlos no respondió a COT-2026-016 (S/2,950).
       ¿Le mando un recordatorio? 📲"
Owner: "Sí, mándale"
Yaya: [sends via whatsapp-mcp]
Yaya: "📲 Recordatorio enviado:
       'Hola Carlos, ¿pudiste revisar la cotización del cemento
        y fierro? Los precios están vigentes hasta el viernes.
        Quedo atento 🙏'

       Te aviso si responde."

[Later that day]
Owner: "Carlos aceptó, pero solo quiere el cemento, no el fierro"
Yaya: "✅ Cotización #COT-2026-016 — aceptación parcial

       ✅ 50 Cemento Pacasmayo — S/1,600.00
       ❌ 20 Fierro 1/2" — rechazado

       Subtotal: S/1,600.00
       IGV (18%): S/288.00
       *Total: S/1,888.00*

       📦 Pedido #ORD-2026-092 creado.
       ¿Coordino entrega con Carlos? 📲"
```

### Flow 4: Volume Pricing Comparison
```
Owner: "El maestro Pedro quiere saber cuánto le sale si lleva 100 bolsas de cemento en vez de 30"
Yaya: "📊 *Comparación de precios — Cemento Pacasmayo*

       📦 30 bolsas:
       • S/35.00 c/u (precio estándar)
       • Subtotal: S/1,050.00 + IGV = S/1,239.00

       📦 100 bolsas:
       • S/30.00 c/u (precio volumen 51+)
       • Subtotal: S/3,000.00 + IGV = S/3,540.00

       💰 Precio por bolsa baja de S/35 a S/30 (-14.3%)

       ¿Le mando esta comparación a Pedro? 📲"
```

### Flow 5: Revise Existing Quote
```
Owner: "Actualiza la cotización de Juan, baja el cemento a S/30 y agrega 50 tubos PVC a S/12"
Yaya: [looks up last quote to Juan → COT-2026-015]
Yaya: "📋 *Cotización #COT-2026-015 v2* (revisada)
       👤 Juan Pérez — Constructora JP

       • 50 Cemento Pacasmayo — ~S/32.00~ S/30.00 c/u = S/1,500.00 ⬇️
       • 20 Fierro 1/2" — S/45.00 c/u = S/900.00
       • 100 Ladrillo King Kong — S/0.80 c/u = S/80.00
       • 50 Tubo PVC 4" — S/12.00 c/u = S/600.00 🆕

       Subtotal: S/3,080.00
       IGV (18%): S/554.40
       *Total: S/3,634.40*

       (vs anterior: S/3,044.40 → +S/590.00)

       ¿Le mando la versión actualizada a Juan? 📲"
```

### Flow 6: USD Quote for Import Client
```
Owner: "Cotización en dólares para Import Solutions: 200 paneles solares a $85 y 50 inversores a $320"
Yaya: [fetches today's exchange rate from forex-mcp: 1 USD = S/3.72]
Yaya: "📋 *Cotización #COT-2026-022*
       👤 Import Solutions SAC
       💱 TC: 1 USD = S/3.72 (SBS hoy)

       • 200 Panel solar 400W — $85.00 c/u = $17,000.00
       • 50 Inversor 5KW — $320.00 c/u = $16,000.00

       Subtotal: $33,000.00
       IGV (18%): $5,940.00
       *Total: $38,940.00* (≈ S/144,856.80)

       ¿La mando? 📲"
```

## Integration Points

### With yaya-sales
- Incoming customer inquiries about pricing trigger quote generation
- "¿A cuánto el cemento?" → yaya-sales handles conversation, yaya-quotes generates formal cotización if needed
- Accepted quotes feed back into sales pipeline metrics

### With yaya-inventory / erpnext-mcp
- Product lookup pulls names, codes, and current prices from inventory
- Stock check before quoting: "Ojo: solo quedan 30 bolsas de cemento, cotizaste 50. ¿Quieres confirmar?"
- Accepted quote → sales order triggers stock reservation

### With yaya-crm / crm-mcp
- Customer lookup by name, phone, or company for auto-fill
- Every quote logged as interaction on the customer's CRM record
- Client-specific pricing stored per contact
- Quote win rate contributes to customer segmentation (high-value, price-sensitive, etc.)

### With yaya-suppliers
- When accepting a quote creates an order that exceeds current stock, suggest a purchase order to restock
- "Aceptaron 100 bolsas de cemento pero solo tienes 60. ¿Pedimos 50 a Pacasmayo?"

### With yaya-tax / invoicing-mcp
- IGV calculation follows yaya-tax rules (18% for Peru)
- Accepted and converted quotes can trigger factura generation
- RUC validation for formal quotes that will become facturas

### With yaya-analytics
- Quote volume, win rates, and average values feed business dashboards
- Product-level conversion rates help optimize pricing strategy
- Seasonal quoting patterns: "En verano cotizas 40% más fierro — ¿ajustamos stock?"

### With yaya-followup
- Quote follow-up reminders integrate with general follow-up system
- Avoid duplicating reminders if yaya-followup already has a pending task for the same customer

### With whatsapp-mcp
- Send formatted quotes to clients
- Send follow-up reminders
- Receive responses (acceptance, rejection, questions)

### With forex-mcp
- Real-time USD/PEN conversion for multi-currency quotes
- Lock exchange rate at time of quote creation

## Proactive Behaviors
- **Follow-up reminders** — 3 days after sending a quote without response (configurable): "Juan no ha respondido a COT-2026-015. ¿Le recuerdo?"
- **Expiry alerts** — 1 day before a quote expires: "La cotización para María vence mañana. ¿Extiendo o hago seguimiento?"
- **Price change alerts** — When inventory prices change for actively quoted products: "El cemento subió de S/30 a S/32. Tienes 3 cotizaciones pendientes con el precio anterior."
- **Stock alerts for pending quotes** — When stock drops below sum of pending quotes: "Solo quedan 40 bolsas de cemento pero tienes cotizaciones pendientes por 80 bolsas."
- **Weekly quote summary** — Sunday evening: total quotes sent, accepted, expired, pending, win rate, total value
- **Win rate insights** — Monthly: "Tu tasa de cierre mejoró de 55% a 62%. Los clientes que reciben seguimiento aceptan 25% más."
- **Repeat customer nudge** — "Juan no ha pedido cotización en 30 días. La última fue por cemento. ¿Le ofrecemos precios?"

## Edge Cases
- **Unknown customer** — "No tengo registrado a ese cliente. ¿Me das su nombre completo, teléfono y empresa?"
- **No price on file** — "No tengo precio de [producto] en inventario. ¿A cuánto lo cotizo?"
- **Product not found** — "No encontré 'fierros de media' exacto. ¿Te refieres a Fierro corrugado 1/2" (12mm)?"
- **Quote already expired** — "Esa cotización venció hace 3 días. ¿Quieres generar una nueva con precios actualizados?"
- **Duplicate quote** — "Ya le mandaste cotización a Juan hoy (COT-2026-015). ¿Quieres actualizar esa o crear una nueva?"
- **Discount below cost** — "Ojo: a ese precio (S/28) estás por debajo del costo (S/29.50). ¿Confirmas?"
- **Partial voice understanding** — "Escuché: '50 bolsas cemento, 20 fierros de...' ¿fierro de 1/2, 3/8, o 5/8?"
- **Multi-currency ambiguity** — "¿La cotización es en soles o dólares? El cliente pidió en USD."
- **Large quote (many items)** — Quotes with 20+ items: break WhatsApp message into sections, offer PDF alternative
- **Customer asks for quote by phone** — "Cotización telefónica registrada. ¿Le mando confirmación por WhatsApp?"
- **Competitor price matching** — "Juan dice que en la competencia le dan el cemento a S/29. ¿Quieres igualar? Tu costo es S/28."

## Cultural Notes
- **Cotización is daily life** — Ferreterías send 5-15 cotizaciones per day. Speed matters more than perfection.
- **WhatsApp is the channel** — 95% of quotes go via WhatsApp. PDF is for formal licitaciones or companies with purchasing departments.
- **Voice notes are common** — "Cotízame..." is often a voice note from a maestro de obra on the construction site. Parse naturally.
- **"Precio por volumen"** — Every B2B buyer expects to ask for volume pricing. Always have tiers ready.
- **IGV must be visible** — Peruvian law requires showing IGV separately. Some customers ask "¿ese precio incluye IGV?" — always clarify.
- **Informal relationships** — "El maestro", "Don Juan", "la ingeniera" — use familiar forms. The relationship often predates the business.
- **Payment terms vary** — Contractors ("maestros de obra") usually pay contado. Construction companies ("constructoras") expect crédito 30 días.
- **Delivery expectations** — In Lima, many ferreterías include delivery within a radius. "Puesto en obra" vs "recojo en tienda" matters.
- **Haggling is normal** — Expect the first price to be negotiated. Provide margin room but protect minimum margin.
- **"Pásame los precios"** — Casual way of asking for a cotización. Don't over-formalize unless the customer asks.
- **Guía de remisión** — Formal delivery document required when sending goods. Mention when relevant for delivery.
- **RUC for facturas** — Formal quotes to companies need the client's RUC. Ask proactively: "¿Necesitas factura? ¿Me das tu RUC?"

## Configuration
- `QUOTE_VALIDITY_DAYS` — Default quote validity in days (default: 7)
- `QUOTE_FOLLOWUP_DAYS` — Days after sending before follow-up reminder (default: 3)
- `QUOTE_IGV_RATE` — IGV rate (default: 0.18)
- `QUOTE_CURRENCY` — Default currency (default: PEN)
- `QUOTE_INCLUDE_DELIVERY` — Whether to include delivery by default (default: false)
- `QUOTE_DELIVERY_RADIUS_KM` — Free delivery radius in km (default: 0, meaning no free delivery)
- `QUOTE_DELIVERY_COST` — Default delivery cost if not free (default: 0)
- `QUOTE_MARGIN_FLOOR` — Minimum margin percentage before warning (default: 0.05, i.e., 5%)
- `QUOTE_MAX_FOLLOWUPS` — Maximum automatic follow-ups before stopping (default: 2)
- `QUOTE_PDF_ENABLED` — Enable PDF generation option (default: true)
- `QUOTE_BUSINESS_NAME` — Business name for PDF header
- `QUOTE_BUSINESS_RUC` — Business RUC for PDF header
- `QUOTE_BUSINESS_ADDRESS` — Business address for PDF header
- `QUOTE_BUSINESS_PHONE` — Business phone for PDF header
- `QUOTE_BUSINESS_LOGO_URL` — Logo URL for PDF header
- `QUOTE_PAYMENT_TERMS` — Default payment terms (default: contado)
