# yaya-bodega — Corner Store Operations for Peru's 500K+ Bodegas

## Description
The all-in-one bodega operations skill — purpose-built for the ~500,000 bodegas and corner stores that are Peru's largest business category. Bodegas are the backbone of neighborhood commerce: a single owner (often a señora) running a 20-50 m² shop, selling everything from leche Gloria to recargas Movistar, with daily revenue of S/200-500, 60-70% cash transactions, and zero formal systems. Today, everything lives in the bodeguera's head or in a cuaderno (paper notebook). Fiado is tracked by memory. Stock is ordered by intuition. The day's sales are a mystery until the drawer is empty.

María Flores — a bodeguera in Villa El Salvador — scored 61% PMF in Round 4, the only persona NOT launch-ready. This skill fills the remaining gaps by providing bodega-specific features that don't exist in any single skill: quick sale logging without formal invoicing, merma (loss/spoilage) tracking, distributor order templates for Gloria/Backus/Alicorp, mobile recharge and utility payment tracking (agente BCP/Interbank), seasonal stock planning (panetones in December, útiles escolares in March), and competitor price awareness. It orchestrates existing skills (yaya-cash, yaya-fiados, yaya-inventory, yaya-suppliers, yaya-crm, yaya-voice) into a single bodega-native experience.

The core design principle: **simpler than the cuaderno, or they won't use it.** A bodeguera serving 5 customers at once can't navigate menus or type product codes. She needs to say "Vendí 2 leches, 1 pan, 3 gaseosas" and have it recorded. She needs to say "¿Cuánto vendí esta semana?" and get a number. She needs to say "El arroz subió" and have her price list updated. Voice notes are first-class — many bodegueros have basic education and prefer speaking over typing.

## When to Use
- Bodeguera logs a quick sale ("vendí 2 leches y 1 pan", "salieron 3 gaseosas", "se llevó arroz")
- Bodeguera asks about cash in the drawer ("¿cuánto tengo en caja?", "cuánto llevo hoy", "¿cuadra la caja?")
- Customer buys on credit and needs fiado handoff ("llévalo, me pagas después", "se lo llevó fiado", "anótale")
- Bodeguera asks about stock levels ("¿me queda leche?", "¿cuánto arroz tengo?", "¿qué me falta?")
- Bodeguera wants to order from distributor ("hay que pedirle a Gloria", "llama a Backus", "hacer el pedido semanal")
- Distributor raises prices ("la leche subió", "el arroz subió a S/5", "actualiza los precios")
- Bodeguera asks about margins ("¿cuánto le gano a la leche?", "¿me conviene vender a ese precio?")
- Products expire, break, or go missing ("se venció el yogurt", "se rompieron 2 gaseosas", "me falta mercadería")
- Weekend or holiday approaching ("¿qué pido para el finde?", "viene Fiestas Patrias", "se acerca Navidad")
- Bodeguera asks about a regular customer ("¿la señora Rosa compra fiado?", "¿qué lleva siempre Don Pedro?")
- Customer requests mobile recharge ("recarga Movistar de 10 soles", "recarga Claro de 5")
- Customer pays a utility bill at the bodega ("pago de luz", "recibo de agua", "agente BCP")
- Bodeguera wants daily summary ("¿cómo me fue hoy?", "resumen del día", "cuéntame cómo estuvo")
- Bodeguera asks about weekly/monthly sales ("¿cuánto vendí esta semana?", "¿cómo va el mes?")
- Bodeguera asks about seasonal stock ("¿cuántos panetones pido?", "ya vienen las clases, ¿qué compro?")
- Bodeguera mentions competitor pricing ("la bodega de al lado vende más barato", "la vecina cobra menos por el arroz")
- A proactive low-stock alert fires for a common bodega product
- A distributor order reminder triggers via cron (weekly order day)
- A seasonal stock preparation reminder triggers (30 days before key season)

## Capabilities

### 1. Quick Sale Logging (Venta Rápida)
- **Instant recording** — "Vendí 2 leches, 1 pan, 3 gaseosas" → looks up prices, records sale without formal invoicing
- **Voice-first** — Process voice notes as sales: bodeguera dictates while serving customers
- **Batch sales** — Log multiple sales at once: "Hoy vendí: 5 arroces, 10 leches, 20 panes, 8 gaseosas"
- **Payment method tagging** — "Me pagó por Yape" / "en efectivo" / "con Plin" → auto-tag
- **No-price fallback** — If price not in catalog: "¿A cuánto la leche?" → records with stated price
- **Running daily total** — After each sale: "Venta: S/14.50 | Hoy llevas: S/187.00"
- **Integration: yaya-ledger** — Each quick sale creates a ledger entry for accounting
- **Integration: yaya-cash** — Cash sales auto-update cash drawer balance
- **Integration: yaya-inventory** — Stock decremented automatically after sale confirmation

### 2. Cash Drawer Management (Caja del Día)
- **Opening balance** — "Abro con S/200" or auto-assume yesterday's closing
- **Running balance** — Real-time cash tracking across all cash transactions
- **Closing reconciliation** — "Cierro caja, tengo S/480" → compares vs expected
- **Yape/Plin split** — "¿Cuánto entró por Yape?" → breaks down by payment method
- **Integration: yaya-cash** — Full handoff to yaya-cash for reconciliation, denomination tracking, shortage investigation

### 3. Fiado Integration (Ventas al Crédito)
- **Seamless handoff** — "Se lo llevó fiado la señora María" → delegates to yaya-fiados for tab creation
- **Quick balance check** — "¿Cuánto me deben?" → queries yaya-fiados for total outstanding
- **Credit warning** — Before creating fiado: "Ojo: la Sra. María ya te debe S/45" → informed decision
- **Integration: yaya-fiados** — Full fiado lifecycle managed by yaya-fiados; yaya-bodega provides the entry point

### 4. Minimum Stock Alerts (Alertas de Stock)
- **Auto-detect low stock** — Track common bodega products (leche, arroz, aceite, azúcar, fideos, pan, gaseosas, cerveza, detergente, jabón) and alert when running low
- **Consumption-based** — "Vendes ~5 leches al día, te quedan 8 → te alcanzan para 1.5 días"
- **Smart thresholds** — Auto-calculate reorder points based on sales velocity, not fixed numbers
- **Weekend factor** — "Mañana es sábado, vendes 40% más gaseosas. Pide hoy"
- **Integration: yaya-inventory** — Stock levels from ERPNext; alerts via WhatsApp

### 5. Distributor Order Templates (Pedidos a Distribuidores)
- **Pre-built templates** — Common weekly orders to major distributors:
  - **Gloria** — Leche, yogurt, mantequilla, queso
  - **Backus** — Cerveza (Cristal, Pilsen, Cusqueña), gaseosas (Guaraná, Coca-Cola)
  - **P&G** — Detergente (Ariel, Ace), jabón (Bolívar), pañales (Pampers)
  - **Alicorp** — Aceite (Primor, Capri), fideos (Don Vittorio, Nicolini), margarina
  - **San Fernando** — Pollo, embutidos
  - **Molitalia** — Galletas (Costa, Fénix), conservas (Florida)
- **Quick reorder** — "Pide lo mismo que la semana pasada a Gloria" → duplicates last order
- **Adjust quantities** — "Pero esta vez 5 cajas más de leche" → modifies template
- **Send via WhatsApp** — "Mándale el pedido al distribuidor" → formatted message sent
- **Delivery day reminders** — "Mañana viene Gloria (martes). ¿Pediste?"
- **Integration: yaya-suppliers** — PO creation, delivery tracking, price history

### 6. Price List Management (Lista de Precios)
- **Bulk price update** — "La leche subió de S/4.50 a S/5.00" → updates catalog, recalculates margin
- **Distributor price change** — "Gloria subió 10% todo" → applies percentage increase to all Gloria products
- **Margin visibility** — "Le compro a S/3.80 y la vendo a S/5.00 → gano S/1.20 (24%)"
- **Margin alert** — "⚠️ Con el nuevo precio de compra, tu margen en la leche baja de 24% a 15%. ¿Subes el precio de venta?"
- **Price comparison** — "¿Cuánto le gano a cada producto?" → top margins and worst margins
- **Suggested retail** — "Para mantener 20% de margen, vende la leche a S/4.75"
- **Integration: erpnext-mcp** — Product catalog and pricing

### 7. Loss Prevention — Merma Tracking
- **Expired products** — "Se venció el yogurt, 5 unidades" → records loss with reason, adjusts stock
- **Breakage** — "Se rompieron 2 gaseosas" → records as merma por rotura
- **Theft suspicion** — "Me faltan 3 chocolates" → records as merma por faltante, tracks pattern
- **Monthly merma report** — "📊 Merma del mes: S/45 (S/20 vencidos, S/15 rotura, S/10 faltante)"
- **Expiration alerts** — "⚠️ Tienes 10 yogurts que vencen en 3 días. ¿Ponemos oferta?"
- **Merma as percentage of sales** — "Tu merma es 2.5% de ventas. Normal para una bodega es 2-4%"
- **Pattern detection** — "Los chocolates vienen faltando 3 meses seguidos. Revisa quién tiene acceso"

### 8. Weekend/Holiday Preparation (Preparación para Finde/Feriados)
- **Weekend forecast** — "Este finde necesitas: 30% más gaseosas, 20% más cerveza, 15% más pan"
- **Holiday forecast** — "Para Fiestas Patrias: pide triple de cerveza, doble de gaseosas, carne para anticuchos"
- **Historical patterns** — Based on previous weekends/holidays: "El año pasado vendiste S/1,200 en Fiestas Patrias vs S/400 un fin de semana normal"
- **Key Peruvian holidays:**
  - Fiestas Patrias (28-29 julio) — cerveza, gaseosas, carbón, carne
  - Navidad (25 diciembre) — panetón, chocolate caliente, espumante
  - Año Nuevo (1 enero) — espumante, uvas, lentejas (for luck)
  - Semana Santa — pescado, conservas
  - Día de la Madre (mayo) — chocolates, tortas, tarjetas
  - Fiestas Patrias chicas (regional celebrations)
- **Preparation checklist** — "📋 Checklist Fiestas Patrias: ✅ Cerveza pedida ⬜ Gaseosas ⬜ Carbón ⬜ Carne"
- **Integration: yaya-suppliers** — Auto-suggest increased order quantities

### 9. Neighborhood Customer Profiles (Clientes del Barrio)
- **Regular tracking** — Auto-build profiles from purchase history: "Doña Rosa: viene diario, compra leche y pan, paga en efectivo"
- **Usual purchases** — "¿Qué lleva siempre Don Pedro?" → "Cerveza Pilsen (viernes), cigarros, galletas para la hija"
- **Credit status** — Instant check: "¿La Sra. Carmen compra fiado?" → "Sí, tiene S/25 pendiente, buena paga (paga en <7 días)"
- **Customer notes** — "Doña Lucía es diabética, no le vendas azúcar" → saved as profile note
- **Birthday/special dates** — "El cumpleaños de la hija de Don José es el 15 de abril" → reminder for potential sale
- **Integration: yaya-crm** — Full customer profiles stored in CRM, fiado data from yaya-fiados

### 10. Mobile Recharge Tracking (Recargas)
- **Log recharge** — "Recarga Movistar S/10 para 987654321" → records service provided
- **Supported operators** — Claro, Movistar, Entel, Bitel
- **Commission tracking** — "Hoy hiciste 12 recargas por S/85 total. Comisión estimada: S/6.80"
- **Daily recharge summary** — "📱 Recargas hoy: 12 (S/85) | Comisión: ~S/6.80"
- **Popular amounts** — S/3, S/5, S/10, S/20, S/30 (auto-suggest based on patterns)
- **Float management** — "Tu saldo de recargas está bajo. Recarga tu float"

### 11. Utility Payment Tracking (Pagos de Servicios)
- **Log payment service** — "Cobré recibo de luz S/85 para la Sra. María" → records service
- **Supported services:**
  - Agente BCP
  - Agente Interbank
  - Agente BBVA
  - Pagos de luz (Enel, Luz del Sur, Electro)
  - Pagos de agua (Sedapal, EPS)
  - Pagos de cable/internet
  - Western Union / envíos de dinero
- **Commission tracking** — "Hoy cobraste 8 recibos (S/620 total). Comisión estimada: S/12.40"
- **Daily services summary** — "🏦 Servicios hoy: 8 pagos + 12 recargas = S/19.20 comisión"
- **Cash flow note** — Utility payments are pass-through: customer's money goes to the bank, only commission is income. The skill tracks this so it doesn't inflate sales numbers.

### 12. Daily Summary via Voice Note (Resumen por Audio)
- **End-of-day voice summary** — At configured time (default 9 PM), sends voice note:
  "Hola, hoy vendiste S/385 en total: S/260 en efectivo y S/125 por Yape. Tus productos más vendidos fueron leche, pan y gaseosas. La caja cuadra con una diferencia de menos 5 soles, normal. Mañana es sábado, acuérdate de pedir más gaseosas. ¡Buen descanso!"
- **Voice on demand** — "Cuéntame cómo estuvo el día" → generates and sends voice summary
- **Integration: yaya-voice** — TTS via Kokoro, sent as WhatsApp voice note
- **Integration: yaya-cash** — Cash reconciliation data
- **Integration: yaya-analytics** — Sales and trend data

### 13. Simplified Reporting (Reportes Sencillos)
- **Daily sales** — "¿Cuánto vendí hoy?" → "Hoy: S/385 (23 ventas). Ayer: S/320. Vas bien 📈"
- **Weekly sales** — "¿Cuánto vendí esta semana?" → "Esta semana: S/2,150 (lun-vie). La semana pasada: S/1,980. +8.6% 📈"
- **Monthly sales** — "¿Cómo va el mes?" → "Marzo lleva S/8,200 en 15 días. Proyección: ~S/16,400"
- **Best sellers** — "¿Qué se vende más?" → "Top 5: leche (45), pan (38), gaseosas (30), arroz (12), aceite (8)"
- **Worst sellers** — "¿Qué no se mueve?" → "Sin movimiento esta semana: conservas de durazno, gelatina fresa, jabón Marsella"
- **Cash vs Yape** — "¿Cuánto entró por Yape?" → "Yape: S/125 (32% del total). Efectivo: S/260 (68%)"
- **Profit estimate** — "¿Cuánto gané esta semana?" → "Ventas: S/2,150 - Costo estimado: S/1,720 = Ganancia bruta: ~S/430 (20%)"
- **No charts, no tables** — All reports formatted for WhatsApp readability

### 14. Seasonal Stock Planning (Stock por Temporada)
- **Automatic seasonal reminders** — Triggered 30 days before key seasons:
  - **Marzo** — Campaña escolar: cuadernos, lápices, colores, mochilas, forros, etiquetas
  - **Abril** — Semana Santa: conservas de pescado, atún, lentejas
  - **Mayo** — Día de la Madre: chocolates, tortas, tarjetas
  - **Junio** — Día del Padre: cerveza premium, whisky, herramientas
  - **Julio** — Fiestas Patrias: cerveza extra, carbón, gaseosas, banderas peruanas
  - **Agosto** — Temporada de frío (sierra): chocolate caliente, emoliente
  - **Octubre** — Señor de los Milagros: turrón de Doña Pepa, mazamorra morada
  - **Noviembre** — Preparación navideña: primeros panetones, chocolate caliente
  - **Diciembre** — Navidad: panetón (Donofrio, Gloria, Todino), chocolate caliente, espumante, uvas
  - **Enero** — Campaña de verano: agua, bebidas frías, helados, bloqueador
- **Historical reference** — "El año pasado vendiste 40 panetones en diciembre. ¿Pedimos 50 este año?"
- **Margin opportunity** — "Los panetones tienen 25-30% de margen. Es tu mes más rentable"
- **Countdown** — "Faltan 45 días para Navidad. Los distribuidores se quedan sin stock en la primera semana de diciembre. ¡Pide ya!"

### 15. Competitor Awareness (La Bodega de al Lado)
- **Log competitor price** — "La bodega de Doña Carmen vende la leche a S/4.80" → records for comparison
- **Price comparison** — "Tú vendes la leche a S/5.00, la vecina a S/4.80. Diferencia: S/0.20"
- **Strategic advice** — "Si bajas S/0.10 tu margen baja de 24% a 22%. ¿Vale la pena por el volumen?"
- **Don't obsess** — "Tu ventaja no es solo el precio: horario, fiado, cercanía, confianza. No bajes a perder"
- **Track key products only** — Focus on 10-15 productos ancla (milk, rice, oil, soda, beer, bread, sugar, noodles, detergent, eggs)
- **No espionage** — This is about informed pricing, not surveillance. Casual neighborhood knowledge only

## MCP Tools Required
- `postgres-mcp` — Primary: quick sales log, merma records, recharge/services tracking, competitor prices, seasonal plans, customer profiles (bodega-specific extensions)
- `erpnext-mcp` — Product catalog, stock levels, pricing, stock adjustments for merma
- `whatsapp-mcp` — Distributor order messages, voice note summaries, proactive alerts
- `crm-mcp` — Neighborhood customer profiles, regular purchase patterns, credit status

## Data Model

```sql
-- ══════════════════════════════════════════════════════════
-- QUICK SALES (simple sale log without formal invoicing)
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS bodega.quick_sales (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID NOT NULL,
    sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total NUMERIC(10,2) NOT NULL,
    payment_method TEXT DEFAULT 'efectivo' CHECK (payment_method IN (
        'efectivo', 'yape', 'plin', 'tarjeta', 'mixto'
    )),
    recorded_via TEXT DEFAULT 'text' CHECK (recorded_via IN ('text', 'voice')),
    is_fiado BOOLEAN DEFAULT FALSE,
    fiado_tab_id UUID,                 -- reference to yaya-fiados tab if credit sale
    customer_id UUID,                  -- reference to crm contact if known
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bodega.quick_sale_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sale_id UUID NOT NULL REFERENCES bodega.quick_sales(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    product_code TEXT,                 -- ERPNext item code if matched
    quantity NUMERIC(10,3) NOT NULL DEFAULT 1,
    unit_price NUMERIC(10,2) NOT NULL,
    total NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_qs_business_date ON bodega.quick_sales(business_id, sale_date);
CREATE INDEX idx_qs_payment ON bodega.quick_sales(payment_method);
CREATE INDEX idx_qsi_sale ON bodega.quick_sale_items(sale_id);
CREATE INDEX idx_qsi_product ON bodega.quick_sale_items(product_code);

-- ══════════════════════════════════════════════════════════
-- MERMA (loss/spoilage/breakage/theft tracking)
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS bodega.merma (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID NOT NULL,
    product_name TEXT NOT NULL,
    product_code TEXT,
    quantity NUMERIC(10,3) NOT NULL,
    unit_cost NUMERIC(10,2),           -- cost price for loss calculation
    total_loss NUMERIC(10,2),
    reason TEXT NOT NULL CHECK (reason IN (
        'vencido', 'rotura', 'faltante', 'dañado', 'otro'
    )),
    notes TEXT,
    recorded_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_merma_business ON bodega.merma(business_id, recorded_at);
CREATE INDEX idx_merma_reason ON bodega.merma(reason);

-- ══════════════════════════════════════════════════════════
-- MOBILE RECHARGES
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS bodega.recharges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID NOT NULL,
    operator TEXT NOT NULL CHECK (operator IN (
        'claro', 'movistar', 'entel', 'bitel'
    )),
    amount NUMERIC(10,2) NOT NULL,
    phone_number TEXT,                 -- customer's phone (optional)
    commission NUMERIC(10,2),          -- estimated commission earned
    payment_method TEXT DEFAULT 'efectivo',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_recharges_business ON bodega.recharges(business_id, created_at);

-- ══════════════════════════════════════════════════════════
-- UTILITY PAYMENTS / AGENT SERVICES
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS bodega.service_payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID NOT NULL,
    service_type TEXT NOT NULL CHECK (service_type IN (
        'luz', 'agua', 'cable', 'internet', 'telefono',
        'agente_bcp', 'agente_interbank', 'agente_bbva',
        'western_union', 'giro', 'otro'
    )),
    amount NUMERIC(10,2) NOT NULL,     -- customer's bill amount
    commission NUMERIC(10,2),          -- bodega's commission
    customer_name TEXT,
    reference_number TEXT,             -- receipt/transaction reference
    payment_method TEXT DEFAULT 'efectivo',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sp_business ON bodega.service_payments(business_id, created_at);
CREATE INDEX idx_sp_type ON bodega.service_payments(service_type);

-- ══════════════════════════════════════════════════════════
-- COMPETITOR PRICES
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS bodega.competitor_prices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID NOT NULL,
    competitor_name TEXT NOT NULL,      -- "Bodega de Doña Carmen"
    product_name TEXT NOT NULL,
    product_code TEXT,                  -- ERPNext item code if matched
    price NUMERIC(10,2) NOT NULL,
    our_price NUMERIC(10,2),           -- our price at time of recording
    notes TEXT,
    recorded_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cp_business ON bodega.competitor_prices(business_id, recorded_at);
CREATE INDEX idx_cp_product ON bodega.competitor_prices(product_name);

-- ══════════════════════════════════════════════════════════
-- SEASONAL STOCK PLANS
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS bodega.seasonal_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID NOT NULL,
    season TEXT NOT NULL,               -- 'navidad_2026', 'fiestas_patrias_2026', 'escolar_2027'
    year INTEGER NOT NULL,
    status TEXT DEFAULT 'planned' CHECK (status IN (
        'planned', 'ordering', 'stocked', 'completed'
    )),
    planned_items JSONB,               -- [{product, quantity, supplier, estimated_cost}]
    actual_sales JSONB,                -- filled after season ends
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_season_business ON bodega.seasonal_plans(business_id, year, season);

-- ══════════════════════════════════════════════════════════
-- DISTRIBUTOR ORDER TEMPLATES
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS bodega.order_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID NOT NULL,
    supplier_name TEXT NOT NULL,        -- "Gloria", "Backus", etc.
    supplier_id UUID,                   -- reference to suppliers table
    template_name TEXT NOT NULL,        -- "Pedido semanal Gloria"
    items JSONB NOT NULL,              -- [{product_name, quantity, unit, estimated_price}]
    order_day TEXT,                     -- "lunes", "martes", etc.
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ot_business ON bodega.order_templates(business_id, supplier_name);
```

## Behavior Guidelines

### The Cuaderno Principle
- **Simpler than paper, or they won't adopt it.** Every interaction must be faster than writing in a cuaderno. If the bodeguera has to type more than one sentence, the UX has failed.
- **Voice is the default input.** Many bodegueros speak faster than they type, and some have limited literacy. A voice note saying "Vendí 3 leches y 2 panes" must work just as well as text.
- **One message = one action.** Don't require multi-step flows for simple operations. "Vendí 2 leches" should be logged in ONE confirmation message, not a wizard.
- **Confirmation is brief.** "Anotado ✅ S/9.00 | Hoy: S/187.00" — not a full receipt with 10 lines.
- **Don't teach, don't lecture.** Bodegueros know their business. Don't explain what a margin is. Just show the number.

### Language & Tone
- **Natural Peruvian Spanish.** Use "bodega" not "tienda de conveniencia". Use "fiado" not "crédito informal". Use "sencillo" not "denominaciones menores".
- **Informal but respectful.** "Tú" not "usted" (unless the bodeguero uses usted). "Dale" not "Entendido". "Listo" not "Operación completada".
- **Numbers are clear.** Always S/ prefix, two decimals: S/14.50. Round where natural: "vendiste como S/385 hoy" is fine for summaries.
- **WhatsApp formatting.** Bullet points (•), emojis for visual scanning, short lines. NO tables, NO markdown tables. Everything must be readable on a cracked 5.5" smartphone screen.

### Bodega Realities
- **The owner IS the business.** No employees, no shifts, no departments. One person, open 6 AM to 10 PM, 7 days a week.
- **Interruptions are constant.** A bodeguera might start logging a sale and get interrupted by 3 customers. The skill must handle partial inputs and resume gracefully.
- **Cash is king.** 60-70% of transactions are cash. Yape is growing fast but cash isn't going away. Both are first-class.
- **Fiado is life.** 15-30% of sales may be fiado. It's not optional — refusing fiado means losing customers. The skill must make fiado easy, not scary.
- **Margins are thin.** Typical gross margin is 15-25%. A S/0.50 price increase matters. Every sol counts.
- **Space is limited.** 20-50 m². Storage is a shelf, a corner, or the living room behind the counter. Stock management is about survival, not optimization.
- **The distributor schedule rules everything.** Gloria comes Tuesdays. Backus comes Thursdays. Miss the order window and you're out of stock until next week.
- **Family = workforce.** The husband, wife, or teenage child may take over temporarily. The system should work for anyone in the family, not just the registered owner.

### Privacy & Sensitivity
- **Never share a customer's fiado status with anyone else.** If another customer asks "¿cuánto debe la Rosa?", refuse.
- **Sales data is private.** Only share with the business owner (or authorized family members).
- **Merma by "faltante" (suspected theft) is sensitive.** Don't accuse. Use language like "hay productos que no cuadran" not "te están robando".
- **Competitor data stays private.** Never tell the competitor what the bodega charges.

## Example Flows

### Quick Sale — Simple
```
Bodeguera: "Vendí 2 leches y 1 pan"
Agente: [busca precios en ERPNext]
Agente: "Anotado ✅
         • 2 leches Gloria — S/4.50 c/u
         • 1 pan francés — S/0.50

         💰 Venta: S/9.50
         📊 Hoy llevas: S/196.50 (18 ventas)"
```

### Quick Sale — Voice Note
```
Bodeguera: [nota de voz: "Acaba de salir arroz, aceite
           y 3 gaseosas, todo en efectivo"]
Agente: [transcribe, busca precios]
Agente: "Anotado ✅
         • 1 arroz 1kg — S/4.20
         • 1 aceite Primor 1L — S/9.90
         • 3 gaseosas 500ml — S/2.50 c/u

         💰 Venta: S/21.60 (efectivo)
         📊 Hoy llevas: S/218.10"
```

### Quick Sale — Goes to Fiado
```
Bodeguera: "Doña Rosa se llevó leche y pan, anótale fiado"
Agente: [busca precios, verifica fiado de Doña Rosa]
Agente: "📝 Fiado para Doña Rosa:
         • 1 leche Gloria — S/4.50
         • 2 panes — S/1.00

         ⚠️ Ojo: Doña Rosa ya te debe S/32.00
         Nuevo total: S/37.50

         ¿Anoto el fiado? ✅"
Bodeguera: "Sí"
Agente: "Listo ✅ Doña Rosa ahora debe S/37.50"
```

### Cash Drawer — Closing
```
Bodeguera: "Cierro con S/480"
Agente: [consulta yaya-cash]
Agente: "📊 Cierre de caja — Viernes 21/03

         💰 Apertura:         S/   200.00
         ➕ Ventas efectivo:   S/   310.00
         ➕ Cobros fiado:      S/    25.00
         ➖ Gastos:            S/   -40.00
         ➖ Retiro personal:   S/   -20.00
         ─────────────────────────────────
         📊 Esperado:          S/   475.00
         💵 Contaste:          S/   480.00
         ✅ Diferencia:        +S/    5.00 (normal)

         ¡Cuadra perfecto! 🎯
         📱 Yape del día: S/125.00

         Total ventas hoy: S/435.00 💪"
```

### Merma — Expired Products
```
Bodeguera: "Se vencieron 5 yogurts"
Agente: [busca precio costo en ERPNext]
Agente: "😔 Registro merma:
         • 5 yogurts Gloria — costo S/2.80 c/u

         💸 Pérdida: S/14.00

         📊 Merma del mes: S/38.00
         • Vencidos: S/28.00
         • Rotura: S/10.00

         Tip: Pon los yogurts más viejos al frente
         del mostrador (primero que entra, primero
         que sale) 👍"
```

### Distributor Order Template
```
Bodeguera: "Hay que pedirle a Gloria"
Agente: [recupera último pedido a Gloria]
Agente: "📦 Pedido semanal Gloria:

         Basado en tu último pedido + ventas:
         • 10 cajas leche Gloria 1L — S/38 c/u
         • 5 cajas yogurt Gloria — S/42 c/u
         • 3 cajas mantequilla — S/35 c/u

         💰 Total estimado: S/795.00

         ¿Lo mando igual, o ajusto algo?"
Bodeguera: "Ponle 12 cajas de leche, el resto igual"
Agente: "📦 Pedido Gloria actualizado:
         • 12 cajas leche → S/456.00
         • 5 cajas yogurt → S/210.00
         • 3 cajas mantequilla → S/105.00
         💰 Total: S/771.00

         ¿Se lo mando por WhatsApp? 📲"
Bodeguera: "Dale"
Agente: "Enviado ✅ Te aviso cuando confirmen"
```

### Price Update — Distributor Raised Prices
```
Bodeguera: "La leche subió, ahora me la venden a S/4.00"
Agente: "📝 Actualizo precio de compra:
         Leche Gloria 1L: S/3.80 → S/4.00

         ⚠️ Impacto en tu margen:
         Antes: vendías a S/4.50, ganabas S/0.70 (16%)
         Ahora: vendés a S/4.50, ganás S/0.50 (11%)

         💡 Para mantener 16% de margen, tendrías
         que vender a S/4.75.

         ¿Subes el precio de venta?"
Bodeguera: "Ponlo a S/5.00"
Agente: "Actualizado ✅
         Leche Gloria 1L: S/5.00
         Nuevo margen: S/1.00 (20%) 💪"
```

### Mobile Recharge
```
Bodeguera: "Recarga Movistar de 10 soles al 987654321"
Agente: "📱 Recarga registrada:
         • Movistar — S/10.00
         • Número: 987 654 321
         • Comisión: ~S/0.80

         📊 Recargas hoy: 8 (S/55) | Comisión: ~S/4.40"
```

### Utility Payment
```
Bodeguera: "La señora pagó su recibo de luz, S/85"
Agente: "🏦 Pago de servicio registrado:
         • Luz — S/85.00
         • Comisión: ~S/1.50

         📊 Servicios hoy: 4 pagos + 8 recargas
         💰 Comisión total del día: ~S/10.40"
```

### Weekly Summary — Simplified
```
Bodeguera: "¿Cuánto vendí esta semana?"
Agente: "📊 Tu semana (lun 16 — sab 21 mar):

         💰 Ventas totales: S/2,350
         💵 Efectivo: S/1,550 (66%)
         📱 Yape/Plin: S/800 (34%)

         🔝 Más vendido: leche (52), pan (45), gaseosas (38)

         📊 vs semana pasada: +12% 📈

         💸 Merma: S/14 (normal ✅)
         📝 Fiados nuevos: S/65 | Cobrados: S/40

         💰 Ganancia bruta estimada: ~S/470 (20%)

         ¡Buena semana! 💪"
```

### Daily Summary via Voice Note
```
Agente: [genera resumen, envía como nota de voz]
Agente: 🔊 "Hola, te cuento cómo estuvo tu día.
         Vendiste trescientos ochenta y cinco soles en
         total: doscientos sesenta en efectivo y ciento
         veinticinco por Yape. Lo que más salió fue
         leche, pan y gaseosas. La caja cuadra perfecto,
         diferencia de solo cinco solcitos. Mañana es
         sábado, acuérdate de que te falta pedir gaseosas
         a Backus. ¡Buen descanso!"

         [también envía resumen en texto]

         📊 Resumen 21/03:
         💰 S/385 | 💵 S/260 | 📱 S/125
         ✅ Caja cuadra (+S/5)
         ⚠️ Pedir gaseosas mañana"
```

### Seasonal Stock — Christmas Preparation
```
Agente: [alerta proactiva — 1 de noviembre]
Agente: "🎄 ¡Se acerca Navidad!

         El año pasado vendiste:
         • 40 panetones (ganancia: S/280)
         • 15 espumantes (ganancia: S/90)
         • 20 chocolates calientes (ganancia: S/60)
         • Decoraciones varias (ganancia: S/45)

         📊 Total ganancia navideña: S/475
         (¡tu mejor mes del año!)

         📋 Recomendación 2026:
         • 50 panetones (Donofrio, Gloria, Todino)
         • 20 espumantes
         • 25 chocolates calientes
         • Uvas, lentejas (para Año Nuevo)

         💰 Inversión estimada: S/1,200
         📈 Ganancia estimada: S/580

         ⚠️ Pide los panetones YA.
         Los distribuidores se quedan sin stock
         la primera semana de diciembre.

         ¿Te armo el pedido? 📦"
```

### Competitor Price Awareness
```
Bodeguera: "La bodega de la esquina vende la leche a S/4.80"
Agente: "📊 Comparación de precio:

         🥛 Leche Gloria 1L:
         • Tú: S/5.00
         • Bodega esquina: S/4.80
         • Diferencia: S/0.20

         Tu margen actual: S/1.00 (20%)
         Si bajas a S/4.80: S/0.80 (16%)
         Si bajas a S/4.90: S/0.90 (18%)

         💡 Antes de bajar precio, piensa:
         ¿Tus clientes se van por S/0.20?
         Tu ventaja: horario, fiado, cercanía,
         confianza. Eso vale más que S/0.20.

         Pero si quieres competir, S/4.90 es
         un buen punto medio. ¿Cambio el precio?"
```

### Weekend Preparation
```
Bodeguera: "¿Qué necesito para el finde?"
Agente: [analiza historial de sábados y domingos]
Agente: "📋 Preparación fin de semana:

         Basado en tus últimos 4 fines de semana:

         📈 Lo que sube en finde:
         • Gaseosas: +40% (normal 10/día, finde 14/día)
         • Cerveza: +60% (normal 5/día, finde 8/día)
         • Pan: +20% (normal 15/día, finde 18/día)
         • Snacks: +30%

         📦 Tu stock actual vs lo que necesitas:
         • Gaseosas: 15 ✅ (necesitas ~28, tienes)
         • Cerveza: 8 ⚠️ (necesitas ~16, faltan 8)
         • Pan: cubrir con panadero ✅
         • Snacks: 12 ✅

         🍺 Sugiero pedir a Backus:
         • 1 caja Pilsen (12u) + 1 caja Cristal (12u)

         ¿Le pido a Backus? 📲"
```

### Low Stock Alert — Proactive
```
Agente: [alerta proactiva — jueves 8 AM]
Agente: "⚠️ Stock bajo detectado:

         🥛 Leche Gloria — quedan ~6 (vendes 5/día)
            → Te alcanza para 1 día más
            → Gloria viene el martes... son 5 días 🔴

         🍚 Arroz 1kg — quedan ~4 (vendes 2/día)
            → Te alcanza para 2 días
            → Puedes pedirle al mayorista hoy

         💡 Sugerencia:
         Pide leche al mayorista para cubrir hasta
         el martes. El arroz puede esperar al sábado.

         ¿Armo los pedidos?"
```

## Scheduling via OpenClaw Cron

```yaml
bodega_jobs:
  daily_summary:
    schedule: "0 21 * * *"              # Every day at 9 PM
    description: "Send daily bodega summary (voice + text)"

  stock_check:
    schedule: "0 8 * * *"               # Every day at 8 AM
    description: "Check stock levels, send low stock alerts"

  distributor_reminder:
    schedule: "0 7 * * 1,3"             # Monday and Wednesday at 7 AM
    description: "Remind about distributor orders (Gloria=martes, Backus=jueves)"

  weekly_summary:
    schedule: "0 10 * * 0"              # Sunday at 10 AM
    description: "Weekly sales, merma, fiados, and profit summary"

  merma_check:
    schedule: "0 9 * * 1"               # Monday at 9 AM
    description: "Check for products nearing expiration date"

  seasonal_alert:
    schedule: "0 9 1 * *"               # 1st of every month at 9 AM
    description: "Check for upcoming seasonal stock needs (30-day lookahead)"

  weekend_prep:
    schedule: "0 8 * * 4"               # Thursday at 8 AM
    description: "Weekend preparation suggestions based on patterns"

  monthly_report:
    schedule: "0 10 1 * *"              # 1st of month at 10 AM
    description: "Monthly bodega performance: sales, merma, fiados, margins"
```

## Configuration
- `BODEGA_QUICK_SALE_CONFIRM` — Require confirmation before logging sale (default: true)
- `BODEGA_SHOW_RUNNING_TOTAL` — Show running daily total after each sale (default: true)
- `BODEGA_VOICE_SUMMARY_ENABLED` — Send daily voice note summary (default: true)
- `BODEGA_VOICE_SUMMARY_TIME` — Time for daily voice summary (default: "21:00")
- `BODEGA_TEXT_SUMMARY_ENABLED` — Also send text version of daily summary (default: true)
- `BODEGA_LOW_STOCK_CHECK_ENABLED` — Enable proactive low stock alerts (default: true)
- `BODEGA_LOW_STOCK_DAYS_THRESHOLD` — Alert when stock covers fewer than X days (default: 2)
- `BODEGA_MERMA_ALERT_PERCENT` — Alert when monthly merma exceeds this % of sales (default: 4)
- `BODEGA_RECHARGE_COMMISSION_RATE` — Default commission rate for recharges (default: 0.08, i.e., 8%)
- `BODEGA_SERVICE_COMMISSION_RATE` — Default commission rate for utility payments (default: 0.02, i.e., 2%)
- `BODEGA_COMPETITOR_TRACK_PRODUCTS` — Number of key products to track competitor prices (default: 15)
- `BODEGA_SEASONAL_LOOKAHEAD_DAYS` — Days before season to start alerting (default: 30)
- `BODEGA_WEEKEND_PREP_DAY` — Day of week for weekend preparation alert (default: "jueves")
- `BODEGA_DISTRIBUTOR_TEMPLATES_ENABLED` — Enable distributor order templates (default: true)
- `BODEGA_DEFAULT_MARGIN_TARGET` — Default target gross margin % (default: 20)
- `BUSINESS_TIMEZONE` — Timezone (default: "America/Lima")
- `BUSINESS_CURRENCY` — Currency code (default: "PEN")

## Integration Points

### With yaya-cash
- Quick sales (efectivo) auto-update cash drawer balance
- End-of-day reconciliation via yaya-cash
- Recharge and service payment cash tracked in cash drawer

### With yaya-fiados
- "Se lo llevó fiado" seamlessly creates/appends fiado tab via yaya-fiados
- Quick balance checks routed to yaya-fiados
- Fiado collections recorded as cash-in via yaya-cash

### With yaya-inventory / erpnext-mcp
- Quick sales auto-decrement stock
- Merma adjusts stock levels
- Low stock alerts based on ERPNext quantities + sales velocity
- Price lookups from product catalog

### With yaya-suppliers
- Distributor order templates create POs via yaya-suppliers
- Delivery tracking and price history maintained by yaya-suppliers
- Reorder suggestions based on supplier schedules

### With yaya-crm
- Neighborhood customer profiles stored as CRM contacts
- Purchase history, fiado status, and notes linked to profiles
- Regular purchase patterns tracked for recommendations

### With yaya-voice
- Daily summary voice notes via Kokoro TTS
- Voice input transcription via Whisper
- Voice-first interaction for bodegueros who prefer speaking

### With yaya-analytics
- Sales data feeds simplified reporting
- Weekend/holiday patterns from historical analytics
- Seasonal comparisons year-over-year

## Error Handling & Edge Cases
- **Product not in catalog:** "No tengo registrado ese producto. ¿A cuánto lo vendiste?" — record with stated price, don't block the sale.
- **Ambiguous product name:** "¿Qué leche? Tengo Gloria 1L (S/4.50), Gloria 400ml (S/2.80), y Ideal (S/3.50)." Only ask if more than one match AND the price difference matters.
- **Interrupted sale:** If the bodeguera starts a sale and doesn't confirm, hold it for 5 minutes. Then: "¿Anoto la venta de 2 leches y 1 pan (S/9.50)? O ignoro." Don't lose partial input.
- **No internet:** Queue all transactions locally. When connection returns, sync. Never lose a sale because of connectivity.
- **Voice note unclear:** If transcription confidence is low: "No escuché bien. ¿Dijiste 2 leches o 2 aceites?" Never guess quantities or products.
- **Price not set:** If a product has no price in the system: "¿A cuánto vendiste el [producto]?" — don't refuse to log the sale.
- **Merma dispute:** If the bodeguera says "me faltan productos" and the system shows no stock movement, don't accuse anyone. Say: "Según el registro, el último movimiento fue [date]. Puede ser que una venta no se registró, o que el conteo inicial era diferente. ¿Registro como merma por faltante?"
- **Family member using the system:** If someone other than the registered owner sends a message from the same WhatsApp number, treat them as authorized unless the owner has restricted access.
- **Distributor doesn't come:** "¿No llegó Gloria hoy? Registro que no hubo entrega. ¿Quieres que le mande un mensaje? ¿O pedimos a otro proveedor?"
- **End of month cash crunch:** Many bodegueros run low on cash at end of month (customers' payday is far). Don't suggest extra purchases. Focus on cash flow preservation.
- **Dual-purpose bodega:** Many bodegas also sell prepared food (sándwiches, jugos), or run a small internet/gaming café. Accept these as regular sales without forcing categorization.
- **Power outage tracking:** In some areas, power outages cause ice cream/frozen product loss. "¿Se fue la luz? ¿Se derritieron helados? Registro como merma si hay pérdida."
- **Seasonal product returns:** Unsold panetones in January, unsold school supplies in April. Help track what didn't sell: "Te sobraron 8 panetones. ¿Los devuelves al distribuidor o los vendes con descuento?"
