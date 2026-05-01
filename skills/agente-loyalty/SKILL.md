# agente-loyalty — Customer Loyalty & Rewards Program

## Description
WhatsApp-native customer loyalty and rewards program for Latin American service businesses — salons, barbershops, restaurants, cafés, spas, clinics, and retail stores. Manages digital loyalty points, tier levels (Silver/Gold/VIP), reward redemption, birthday rewards, referral tracking, visit frequency monitoring, and lapsed customer re-engagement — all via natural Spanish chat over WhatsApp. Designed to replace the paper stamp cards that get lost, the honor-based "ya viniste 5 veces, te toca gratis" systems that leak money, and the complete absence of retention strategy in most LATAM micro-businesses.

Digital loyalty is a massive retention driver: a customer with a points balance is 3x more likely to return than one without. For salons, restaurants, and service businesses where 80% of revenue comes from repeat customers, even a simple points system can increase return rates by 20-30%. This skill turns the informal "le doy un descuento porque es clienta fija" into a structured, trackable, transparent program that rewards loyalty without leaking money.

Integrates with agente-crm for customer profiles, agente-appointments for visit tracking, agente-sales for purchase-based points, and WhatsApp for real-time loyalty updates. The business owner configures the program once; everything else happens automatically as customers interact with the business.

## When to Use
- Business owner wants to set up a loyalty program ("quiero dar puntos a mis clientes", "quiero premiar a mis clientas fieles")
- Customer makes a purchase or completes a service (auto-award points)
- Customer asks about their points ("¿Cuántos puntos tengo?", "¿qué puedo canjear?")
- Customer wants to redeem a reward ("quiero usar mis puntos", "¿puedo canjear mi corte gratis?")
- Business owner asks about loyalty metrics ("¿Cuántos clientes activos tengo?", "¿quién es mi mejor cliente?")
- A customer's birthday is approaching (auto-trigger birthday reward)
- A customer refers a new client ("Rosa me recomendó", "vengo de parte de María")
- A loyal customer hasn't visited in a while (re-engagement trigger)
- Business owner wants to see referral performance ("¿Quién me ha traído más clientes?")
- Business owner wants to create a special promotion ("doble puntos este fin de semana")
- Customer reaches a new tier level (auto-notification)
- Business owner wants to send loyalty updates via WhatsApp

## Target Users
- **Peluquerías/salones** — 50-80K in Peru. Repeat clients are everything. Stamp cards everywhere.
- **Barbershops** — Growing market. Young male clients respond well to gamified loyalty.
- **Restaurantes/pollerías** — 340K+. Frequent diners drive most revenue.
- **Cafeterías** — Classic loyalty card territory ("10 cafés = 1 gratis").
- **Spas/estéticas** — Higher ticket, lower frequency. Tier rewards work well.
- **Clínicas/consultorios** — Dental, dermatology. Loyalty = treatment plan adherence.
- **Tiendas retail** — Bodegas with regular customers, pet shops, farmacias.
- **Any service business** where repeat customers drive revenue and the owner wants to formalize retention.

## Capabilities

### Core: Points System
- **Automatic point earning** — Points awarded automatically when a sale or service is recorded: "1 punto por cada S/10 gastado" (configurable ratio)
- **Manual point award** — Owner can award bonus points: "Dale 50 puntos extra a María por su cumpleaños"
- **Points balance** — Real-time balance per customer, queryable by owner or customer
- **Points expiry** — Configurable expiration (default: 12 months from earn date). Notify before expiry.
- **Points history** — Full log of earned, redeemed, expired, and bonus points per customer
- **Rounding rules** — S/85 purchase at 1pt/S/10 = 8 points (round down). Configurable.
- **Service-specific multipliers** — "Coloración da doble puntos", "productos dan 1.5x" → different point rates per service/product category

### Core: Tier Levels
- **Tier structure** — Default tiers:
  - 🥈 **Silver** — 0-199 points (entry level, all new members)
  - 🥇 **Gold** — 200-499 points (regular customers)
  - 💎 **VIP** — 500+ points (top loyal customers)
- **Customizable tiers** — Owner can rename tiers, change thresholds, add/remove levels
- **Tier benefits** — Each tier unlocks perks:
  - Silver: earn points, birthday reward
  - Gold: 1.5x point earning, priority booking, birthday reward + 10% birthday discount
  - VIP: 2x point earning, priority booking, birthday reward + 20% birthday discount, exclusive promotions, free add-on per visit
- **Auto-upgrade** — Customer automatically moves up when points threshold reached
- **Tier notification** — "¡Felicidades María! Subiste a nivel Gold 🥇 Ahora ganas 1.5x puntos"
- **Tier protection** — Tier doesn't drop for 6 months after qualification (configurable grace period)

### Core: Reward Redemption
- **Reward catalog** — Owner defines redeemable rewards with point costs:
  - "Corte de cabello gratis" — 150 puntos
  - "Manicure gratis" — 100 puntos
  - "20% descuento en coloración" — 80 puntos
  - "Tratamiento capilar gratis" — 200 puntos
  - "Café gratis" — 50 puntos
- **Redemption flow** — Customer asks or owner initiates: check points → show options → confirm → deduct points → apply reward
- **Partial redemption** — Allow using some points + cash for higher-value rewards (configurable)
- **Redemption history** — Track what was redeemed, when, by whom
- **Reward availability** — Owner can enable/disable rewards, set inventory limits ("solo 5 tratamientos gratis este mes")

### Core: Birthday Rewards
- **Birthday detection** — From CRM data (agente-crm stores birthday when known)
- **Auto birthday message** — Send WhatsApp message on birthday: "¡Feliz cumpleaños María! 🎂 Te regalamos 50 puntos extra y un 15% de descuento en tu próxima visita. Válido todo el mes."
- **Birthday reward window** — Configurable: day-of, entire birthday week, or entire birthday month (default: birthday month)
- **Birthday bonus points** — Configurable bonus points (default: 50)
- **Birthday discount** — Tier-dependent: Silver 0%, Gold 10%, VIP 20% (configurable)
- **Birthday visit tracking** — Track if the customer actually comes during their birthday window

### Core: Referral Tracking
- **Log referral** — "Rosa me recomendó" or owner logs: "María vino de parte de Rosa"
- **Referral reward** — Both parties get points: referrer gets bonus (default: 100 pts), new customer gets welcome bonus (default: 50 pts)
- **Referral chain** — Track who referred whom: Rosa → María → Carmen → builds referral tree
- **Top referrers** — "¿Quién me ha traído más clientes?" → ranked list with conversion counts
- **Referral confirmation** — Referral points only awarded after new customer's first purchase/service (prevents gaming)
- **Referral campaign** — Owner can boost referral rewards: "Este mes, doble puntos por cada referida"

### Core: Visit Frequency Tracking
- **Auto-track visits** — Every appointment (from agente-appointments) or purchase (from agente-sales) counts as a visit
- **Visit frequency** — Per customer: visits per month, average days between visits
- **Frequency trends** — "María venía cada 3 semanas, ahora cada 5. Podría estar yendo a otro lado 🤔"
- **Visit milestones** — "¡Tu visita #10! Te ganaste 50 puntos extra 🎉"
- **Consecutive visit bonus** — Bonus for N consecutive visits without gap: "5 visitas seguidas sin faltar = 25 puntos extra"

### Core: Lapsed Customer Re-Engagement
- **Lapse detection** — If a customer doesn't visit for 1.5x their average interval, flag as "at risk"
- **Auto re-engagement** — Send WhatsApp message: "¡Hola María! Te extrañamos 💜 Tienes 180 puntos acumulados. ¿Agendamos tu próxima cita?"
- **Win-back offer** — For customers dormant 60+ days: "Vuelve esta semana y te damos 2x puntos en tu servicio"
- **Escalation** — If customer doesn't respond to first message, wait 2 weeks, send final offer (one-time discount or bonus points). Then stop — don't spam.
- **Re-engagement tracking** — Track which win-back offers worked. "De 15 clientas dormidas, 8 volvieron con la promoción 2x puntos"
- **Integration with agente-crm** — Update customer segment (at_risk, dormant, churned) based on loyalty visit data

### Core: Digital Loyalty Card
- **Replace paper cards** — No more "perdí mi tarjeta de sellos". Everything digital, linked to phone number.
- **Points balance via WhatsApp** — Customer messages "puntos" and gets instant balance + tier + available rewards
- **No app needed** — Everything works via WhatsApp. No download, no login, no friction.
- **QR code (optional)** — Business can generate a QR code that customers scan to check points (links to WhatsApp flow)

### Core: WhatsApp Loyalty Updates
- **Points earned notification** — After each visit: "Ganaste 12 puntos hoy. Tu saldo: 180 puntos 🥇 Gold"
- **Tier upgrade notification** — "¡Subiste a VIP! 💎 Ahora ganas 2x puntos y tienes 20% de descuento en tu cumpleaños"
- **Points expiry warning** — 30 days before expiry: "⚠️ 45 puntos vencen el 15 de abril. ¡Úsalos antes!"
- **Monthly loyalty summary** — "Tu resumen del mes: ganaste 85 puntos, canjeaste 1 manicure, saldo: 235 pts 🥇"
- **Opt-in only** — Customer must opt in to receive loyalty messages. Respect "ya no quiero mensajes."

### Promotions & Campaigns
- **Double points events** — "Doble puntos este sábado" → 2x multiplier for all transactions on specified dates
- **Category boost** — "Triple puntos en coloraciones toda la semana" → multiplier for specific services
- **Happy hour points** — "2x puntos de 2pm a 5pm" → time-based multiplier
- **Limited offers** — "Los primeros 10 clientes del día ganan 50 puntos extra"
- **Campaign tracking** — Track which promotions drive the most visits/revenue

### Integration: Cross-Skill Events

| Source Skill | Event Type | Loyalty Effect |
|-------------|-----------|---------------|
| agente-sales | Purchase completed | Award points based on amount |
| agente-appointments | Service completed | Award points, count visit |
| agente-crm | Birthday approaching | Trigger birthday reward flow |
| agente-crm | Customer segment change | Sync loyalty tier with CRM segment |
| agente-crm | New customer from referral | Award referral points to both parties |
| agente-notifications | WhatsApp message | Deliver loyalty updates to customer |

### Analytics & Reports
- **Program overview** — Total enrolled customers, active (visited in 30 days), tier distribution, total points outstanding
- **Redemption report** — Most popular rewards, redemption rate, average points per redemption
- **Referral report** — Top referrers, referral conversion rate, revenue from referred customers
- **Re-engagement report** — Lapsed customers contacted, win-back rate, revenue recovered
- **ROI calculation** — Cost of rewards given vs incremental revenue from loyalty members vs non-members

## MCP Tools Required
- `postgres-mcp` — Points balances, transaction log, tier records, reward catalog, referral chains, visit history, campaign config
- `crm-mcp` — Customer profiles, birthday data, segment updates, referral source tracking
- `agente-appointments` — Visit detection, service completion events
- `agente-sales` / `agente-ledger` — Purchase amounts for point calculation
- `agente-notifications` — WhatsApp messages for loyalty updates, birthday messages, re-engagement

## Database Schema

```sql
-- Loyalty program configuration (one per business)
CREATE TABLE IF NOT EXISTS business.loyalty_config (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id INTEGER NOT NULL UNIQUE,
    program_name TEXT DEFAULT 'Programa de Fidelidad',
    points_per_currency NUMERIC(6,2) DEFAULT 1.0,  -- points per S/10 spent (default: 1 pt per S/10)
    currency_unit NUMERIC(6,2) DEFAULT 10.0,        -- spend unit (e.g., 10 = 1pt per S/10)
    points_rounding TEXT DEFAULT 'down' CHECK (points_rounding IN ('down', 'up', 'nearest')),
    points_expiry_months INTEGER DEFAULT 12,
    tier_grace_months INTEGER DEFAULT 6,
    referral_reward_referrer INTEGER DEFAULT 100,
    referral_reward_referee INTEGER DEFAULT 50,
    birthday_bonus_points INTEGER DEFAULT 50,
    birthday_window TEXT DEFAULT 'month' CHECK (birthday_window IN ('day', 'week', 'month')),
    lapse_multiplier NUMERIC(3,1) DEFAULT 1.5,      -- 1.5x avg interval = lapsed
    re_engagement_enabled BOOLEAN DEFAULT TRUE,
    whatsapp_notifications BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tier definitions
CREATE TABLE IF NOT EXISTS business.loyalty_tiers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id INTEGER NOT NULL,
    tier_name TEXT NOT NULL,                    -- Silver, Gold, VIP
    tier_order INTEGER NOT NULL,               -- 1, 2, 3 (ascending)
    min_points INTEGER NOT NULL,               -- threshold to reach this tier
    points_multiplier NUMERIC(3,1) DEFAULT 1.0, -- 1.0, 1.5, 2.0
    birthday_discount_pct NUMERIC(5,2) DEFAULT 0,
    perks TEXT,                                 -- JSON or text description of tier benefits
    emoji TEXT,                                 -- 🥈, 🥇, 💎
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(business_id, tier_order)
);

-- Customer loyalty accounts
CREATE TABLE IF NOT EXISTS business.loyalty_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id INTEGER NOT NULL,
    customer_id UUID,                          -- link to CRM contact
    customer_name TEXT NOT NULL,
    customer_phone TEXT,                        -- for WhatsApp
    points_balance INTEGER DEFAULT 0,
    lifetime_points INTEGER DEFAULT 0,         -- total ever earned
    tier_id UUID REFERENCES business.loyalty_tiers(id),
    tier_qualified_at TIMESTAMPTZ,
    total_visits INTEGER DEFAULT 0,
    total_spend NUMERIC(12,2) DEFAULT 0,
    last_visit_date DATE,
    avg_visit_interval_days INTEGER,           -- calculated from visit history
    birthday DATE,
    birthday_reward_used_year INTEGER,          -- year of last birthday reward used
    referred_by UUID REFERENCES business.loyalty_members(id),
    referral_count INTEGER DEFAULT 0,
    whatsapp_opt_in BOOLEAN DEFAULT TRUE,
    enrolled_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lm_business ON business.loyalty_members(business_id);
CREATE INDEX IF NOT EXISTS idx_lm_customer ON business.loyalty_members(customer_id);
CREATE INDEX IF NOT EXISTS idx_lm_phone ON business.loyalty_members(customer_phone);
CREATE INDEX IF NOT EXISTS idx_lm_tier ON business.loyalty_members(tier_id);
CREATE INDEX IF NOT EXISTS idx_lm_last_visit ON business.loyalty_members(business_id, last_visit_date);

-- Points transactions (earn, redeem, expire, bonus, adjust)
CREATE TABLE IF NOT EXISTS business.loyalty_points_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES business.loyalty_members(id) ON DELETE CASCADE,
    business_id INTEGER NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN (
        'earn', 'redeem', 'expire', 'bonus', 'referral', 'birthday', 'adjust', 'campaign'
    )),
    points INTEGER NOT NULL,                   -- positive for earn, negative for redeem/expire
    balance_after INTEGER NOT NULL,
    description TEXT,                           -- "Compra S/120 → 12 pts", "Canjeo: corte gratis"
    source_type TEXT,                           -- sale, appointment, manual, campaign, referral
    source_id UUID,                             -- link to sale/appointment/campaign record
    expires_at TIMESTAMPTZ,                    -- when these earned points expire
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lpl_member ON business.loyalty_points_log(member_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lpl_expiry ON business.loyalty_points_log(expires_at) WHERE transaction_type = 'earn' AND points > 0;
CREATE INDEX IF NOT EXISTS idx_lpl_type ON business.loyalty_points_log(transaction_type, created_at);

-- Reward catalog
CREATE TABLE IF NOT EXISTS business.loyalty_rewards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id INTEGER NOT NULL,
    reward_name TEXT NOT NULL,                  -- "Corte de cabello gratis"
    reward_description TEXT,
    points_cost INTEGER NOT NULL,               -- 150 points
    reward_type TEXT DEFAULT 'service' CHECK (reward_type IN (
        'service', 'discount', 'product', 'add_on', 'other'
    )),
    discount_pct NUMERIC(5,2),                 -- for discount type rewards
    inventory_limit INTEGER,                    -- NULL = unlimited
    inventory_remaining INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lr_business ON business.loyalty_rewards(business_id, is_active);

-- Redemption records
CREATE TABLE IF NOT EXISTS business.loyalty_redemptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES business.loyalty_members(id) ON DELETE CASCADE,
    reward_id UUID NOT NULL REFERENCES business.loyalty_rewards(id),
    points_spent INTEGER NOT NULL,
    redemption_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lred_member ON business.loyalty_redemptions(member_id, redemption_date DESC);
CREATE INDEX IF NOT EXISTS idx_lred_reward ON business.loyalty_redemptions(reward_id);

-- Referral records
CREATE TABLE IF NOT EXISTS business.loyalty_referrals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id INTEGER NOT NULL,
    referrer_id UUID NOT NULL REFERENCES business.loyalty_members(id),
    referee_id UUID NOT NULL REFERENCES business.loyalty_members(id),
    referral_date DATE DEFAULT CURRENT_DATE,
    first_purchase_date DATE,                  -- when referee made first purchase
    referrer_points_awarded INTEGER DEFAULT 0,
    referee_points_awarded INTEGER DEFAULT 0,
    is_converted BOOLEAN DEFAULT FALSE,        -- true after referee's first purchase
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lref_referrer ON business.loyalty_referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_lref_business ON business.loyalty_referrals(business_id, referral_date DESC);

-- Visit history (for frequency tracking)
CREATE TABLE IF NOT EXISTS business.loyalty_visits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES business.loyalty_members(id) ON DELETE CASCADE,
    business_id INTEGER NOT NULL,
    visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    visit_type TEXT DEFAULT 'service' CHECK (visit_type IN (
        'service', 'purchase', 'walk_in'
    )),
    amount_spent NUMERIC(12,2) DEFAULT 0,
    points_earned INTEGER DEFAULT 0,
    source_type TEXT,                           -- appointment, sale, manual
    source_id UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lv_member ON business.loyalty_visits(member_id, visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_lv_business ON business.loyalty_visits(business_id, visit_date);

-- Campaigns / promotions
CREATE TABLE IF NOT EXISTS business.loyalty_campaigns (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id INTEGER NOT NULL,
    campaign_name TEXT NOT NULL,                -- "Doble puntos fin de semana"
    campaign_type TEXT NOT NULL CHECK (campaign_type IN (
        'multiplier', 'bonus', 'referral_boost', 'category_boost'
    )),
    points_multiplier NUMERIC(3,1) DEFAULT 2.0,
    bonus_points INTEGER,
    applies_to TEXT,                            -- NULL = all, or service category/product
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lc_business ON business.loyalty_campaigns(business_id, is_active, start_date);
```

## Behavior Guidelines

### Language & Tone
- **Primary language: Spanish** — Natural Peruvian Spanish for all customer-facing and owner messages
- **Celebratory tone** — Loyalty is about positive reinforcement. Use 🎉, ⭐, 💎 generously.
- **Simple points language** — "Tienes 180 puntos" not "Tu balance acumulado de puntos de fidelidad es de 180 unidades"
- **Use customer names** — "¡María, ganaste 12 puntos!" not "Estimado cliente"
- **Numbers matter** — Always show exact point balances and costs. "150 puntos = corte gratis" is clear.

### Customer-Facing Communication
- **Keep it short** — WhatsApp messages should be 3-5 lines max for routine updates
- **Show progress** — "Te faltan 20 puntos para tu próximo canjeo 🎯" motivates return visits
- **Never spam** — Maximum 2 loyalty messages per week per customer. Birthday + one update.
- **Respect opt-out** — If customer says "no me mandes más", immediately stop. Update opt-in to false.
- **Redemption should feel like a win** — "¡Canjeaste tu corte gratis! 🎉 Bien merecido" not "150 puntos deducidos de su cuenta"

### Owner-Facing Communication
- **Show ROI** — "Tu programa de lealtad generó 45 visitas extra este mes (clientes que volvieron por sus puntos)"
- **Keep metrics simple** — Don't overwhelm with data. Top 3 insights per report.
- **Flag gaming** — If a customer pattern looks suspicious (splitting purchases to earn more points), flag it.
- **Reward cost tracking** — Always show the cost of rewards given vs revenue generated.

### Privacy & Data
- **Points balances are personal** — Never share one customer's points with another
- **Referral data is sensitive** — Don't tell Customer A that Customer B referred them (unless both know)
- **Birthday data** — Only use for birthday rewards, never share or expose

## Example Flows

### Setting Up the Loyalty Program
```
Dueña: "Quiero dar puntos a mis clientas, como una tarjeta de fidelidad"
Agente: "¡Buena idea! 🎉 Te ayudo a configurar tu programa de lealtad.

         Propuesta estándar para salones:
         ⭐ 1 punto por cada S/10 gastado
         🥈 Silver: 0-199 pts (nivel inicial)
         🥇 Gold: 200-499 pts (1.5x puntos)
         💎 VIP: 500+ pts (2x puntos)

         Premios sugeridos:
         • Corte gratis — 150 puntos
         • Manicure gratis — 100 puntos
         • 20% descuento coloración — 80 puntos
         • Tratamiento capilar gratis — 200 puntos

         ¿Quieres usar esta configuración o ajustar algo?"

Dueña: "Sí pero que el corte sea 120 puntos, quiero que sea alcanzable"
Agente: "Perfecto ✅ Ajustado: corte gratis = 120 puntos.

         Con un ticket promedio de S/80, una clienta
         gana ~8 puntos por visita. En 15 visitas
         tendría su corte gratis. ¡Buen balance! 💪

         ¿Activo el programa ya? Las clientas que
         vengan desde hoy empiezan a acumular puntos."

Dueña: "Sí, actívalo"
Agente: "✅ Programa de lealtad activado!

         Así funciona:
         1. Cada clienta gana puntos automáticamente
         2. Les mando un mensaje con sus puntos
         3. Cuando tengan suficiente, pueden canjear

         ¿Quieres que inscriba a tus clientas actuales
         del CRM y les dé puntos de bienvenida?"
```

### Automatic Points After Service
```
[María completó un servicio de coloración por S/120]

Agente → María (WhatsApp):
"¡Gracias por tu visita, María! ✨
 Ganaste 12 puntos hoy.

 📊 Tu saldo: 168 puntos 🥈 Silver
 🎯 ¡Te faltan solo 32 puntos para Gold!

 ¿Sabías que en nivel Gold ganas 1.5x puntos? 🥇"
```

### Customer Asks About Points
```
María: "Hola, ¿cuántos puntos tengo?"
Agente: "¡Hola María! 👋 Aquí va tu resumen:

         📊 Puntos: 168 🥈 Silver
         📅 Próximo nivel (Gold): te faltan 32 pts
         🎁 Puedes canjear:
            • 20% descuento coloración — 80 pts ✅
            • Manicure gratis — 100 pts ✅
            • Corte gratis — 120 pts ✅

         ¿Quieres canjear algo o seguir acumulando?"

María: "¡Quiero el corte gratis!"
Agente: "✅ ¡Canjeado! 🎉

         ✂️ Corte de cabello gratis
         ➖ 120 puntos usados
         📊 Nuevo saldo: 48 puntos

         Dile a [Negocio] cuando vayas que tienes
         tu corte gratis canjeado. ¡Disfrútalo! 💇‍♀️"

[Agente notifica a la dueña]:
"📋 Canjeo registrado:
 👤 María Flores canjeó: corte gratis (120 pts)
 📊 Su saldo: 48 puntos (baja de Silver a Silver)"
```

### Birthday Reward
```
[CRM indica que mañana es cumpleaños de María]

Agente → María (WhatsApp):
"🎂 ¡Feliz cumpleaños María! 🎉

 Te regalamos:
 🎁 50 puntos extra (ya en tu cuenta)
 💝 Todo el mes tienes vigente tu regalo

 📊 Tu saldo: 98 puntos 🥈 Silver

 ¡Que la pases lindo! 🎈✨"

[Agente notifica a la dueña]:
"🎂 Mañana cumple años María Flores.
 Le envié 50 puntos de regalo.
 Saldo actual: 98 puntos."
```

### Referral Flow
```
[Nueva clienta llega]
Nueva clienta: "Hola, vengo de parte de Rosa Pérez"
Agente: [registra referencia: Rosa → nueva clienta]
Agente: "¡Bienvenida! 👋 Rosa es una de nuestras
         mejores clientas. ¿Cómo te llamas?"

Nueva clienta: "Carmen Díaz"
Agente: "¡Hola Carmen! Te inscribimos en nuestro
         programa de fidelidad 🎉

         🎁 Puntos de bienvenida: 50 (por venir
            recomendada por Rosa)

         A Rosa también le daremos 100 puntos de
         regalo por haberte traído 💜

         ¿En qué servicio te podemos atender hoy?"

[Agente notifica a la dueña]:
"🤝 Nueva referida:
 👤 Carmen Díaz (referida por Rosa Pérez)
 🎁 Carmen: +50 pts bienvenida
 🎁 Rosa: +100 pts referencia (pendiente hasta
    primera compra de Carmen)"

[Después de que Carmen paga su primer servicio]:
Agente → Rosa (WhatsApp):
"¡Hola Rosa! 🎉 Carmen Díaz, tu referida, ya
 tuvo su primera visita. ¡Gracias por recomendarnos!

 🎁 Te ganaste 100 puntos extra
 📊 Tu saldo: 380 puntos 🥇 Gold

 Ya has traído 3 clientas nuevas. ¡Eres increíble! 💜"
```

### Tier Upgrade
```
[María completa un servicio y su saldo llega a 200 puntos]

Agente → María (WhatsApp):
"🎉 ¡FELICIDADES MARÍA! 🎉

 Subiste a nivel 🥇 GOLD

 Tus nuevos beneficios:
 ⭐ 1.5x puntos en cada visita
 🎂 10% descuento en tu cumpleaños
 📅 Reserva prioritaria de citas

 📊 Puntos: 200 🥇 Gold
 ¡Gracias por tu preferencia! 💛"
```

### Lapsed Customer Re-Engagement
```
[María no viene hace 45 días, su promedio es cada 21 días]

Agente → María (WhatsApp):
"¡Hola María! 💜 Hace un tiempo que no te vemos.

 📊 Tienes 200 puntos acumulados 🥇 Gold
 🎁 Puedes canjear:
    • Corte gratis (120 pts)
    • Manicure gratis (100 pts)
    • Tratamiento capilar (200 pts)

 ¿Te agendamos una cita esta semana? 😊"

[Si no responde en 14 días]:
Agente → María (WhatsApp):
"María, esta semana tenemos 2x puntos en todos
 los servicios ⭐⭐ Solo para clientas Gold y VIP.

 📊 Tus 200 puntos siguen ahí esperándote.
 ⚠️ 85 puntos vencen el 15 de mayo.

 ¿Te reservo hora? 📅"
```

### Business Owner — Loyalty Dashboard
```
Dueña: "¿Cómo va el programa de fidelidad?"
Agente: "📊 Programa de Lealtad — Marzo 2026

         👥 MIEMBROS
         • Total inscritas: 142
         • Activas (visitaron este mes): 68 (48%)
         • 💎 VIP: 8 (6%)
         • 🥇 Gold: 25 (18%)
         • 🥈 Silver: 109 (77%)

         ⭐ PUNTOS
         • Puntos otorgados este mes: 2,450
         • Puntos canjeados: 680
         • Puntos pendientes (total): 12,800
         • Valor estimado pendiente: ~S/1,920

         🎁 CANJEOS DEL MES
         • 4 cortes gratis
         • 2 manicures gratis
         • 1 tratamiento capilar
         • Costo estimado: S/310

         🤝 REFERIDOS
         • Nuevas clientas por referencia: 6
         • Top referidora: Rosa Pérez (3 referidas)
         • Ingreso por referidas: S/720

         📈 RETENCIÓN
         • Clientas que volvieron por sus puntos: 23
         • Ingreso estimado por lealtad: S/2,760
         • ROI del programa: 8.9x (S/2,760 vs S/310)

         💡 Tu programa se está pagando solo.
         Las clientas Gold y VIP gastan 2.3x más
         que las Silver. ¡Sigue así! 🚀"
```

### Top Referrers Report
```
Dueña: "¿Quién me ha traído más clientas?"
Agente: "🤝 Top Referidoras — 2026

         🥇 Rosa Pérez — 8 referidas
            Ingreso generado: S/3,200
            Puntos ganados: 800

         🥈 Carmen Díaz — 5 referidas
            Ingreso generado: S/1,850
            Puntos ganados: 500

         🥉 Lucía Torres — 4 referidas
            Ingreso generado: S/1,400
            Puntos ganados: 400

         📊 Total: 28 clientas por referencia
         💰 Ingreso total: S/9,800
         ⭐ Costo en puntos: 2,800 pts (~S/420)

         Rosa es tu mejor embajadora 💜
         ¿Quieres darle un premio especial?"
```

### Points Expiry Warning
```
Agente → María (WhatsApp):
"⚠️ Hola María, un recordatorio:

 45 de tus puntos vencen el 15 de abril.
 📊 Saldo actual: 98 puntos

 Con 100 puntos puedes canjear un manicure
 gratis. ¡Te faltan solo 2 puntos! 🎯

 Una visita más y lo tienes. ¿Agendamos? 📅"
```

### Double Points Campaign
```
Dueña: "Quiero hacer doble puntos este sábado"
Agente: "✅ Campaña creada:

         ⭐⭐ DOBLE PUNTOS
         📅 Sábado 22 de marzo
         🕐 Todo el día
         📋 Aplica a: todos los servicios

         ¿Quieres que les avise a tus clientas
         por WhatsApp?"

Dueña: "Sí, avísales a las Gold y VIP"
Agente: "Enviando a 33 clientas (25 Gold + 8 VIP)...

         Mensaje:
         '⭐⭐ ¡DOBLE PUNTOS este sábado!
          Todos los servicios ganan 2x puntos.
          Solo por ser Gold/VIP 💎
          ¿Te reservamos hora? 📅'

         ✅ Enviado a 33 clientas.
         Te aviso el sábado cuántas vinieron 📊"
```

## Configuration
- `LOYALTY_POINTS_PER_CURRENCY` — Points earned per currency unit spent (default: 1)
- `LOYALTY_CURRENCY_UNIT` — Spend amount per point unit, e.g., 10 = 1pt per S/10 (default: 10)
- `LOYALTY_POINTS_ROUNDING` — Rounding rule for points: "down", "up", "nearest" (default: "down")
- `LOYALTY_POINTS_EXPIRY_MONTHS` — Months before earned points expire (default: 12, 0 = never)
- `LOYALTY_TIER_NAMES` — Comma-separated tier names (default: "Silver,Gold,VIP")
- `LOYALTY_TIER_THRESHOLDS` — Comma-separated point thresholds (default: "0,200,500")
- `LOYALTY_TIER_MULTIPLIERS` — Comma-separated point multipliers per tier (default: "1.0,1.5,2.0")
- `LOYALTY_TIER_GRACE_MONTHS` — Months before tier can drop after qualifying (default: 6)
- `LOYALTY_BIRTHDAY_BONUS_POINTS` — Bonus points for birthday (default: 50)
- `LOYALTY_BIRTHDAY_WINDOW` — Birthday reward validity: "day", "week", "month" (default: "month")
- `LOYALTY_BIRTHDAY_DISCOUNT_BY_TIER` — Comma-separated discount pct per tier (default: "0,10,20")
- `LOYALTY_REFERRAL_REWARD_REFERRER` — Points for referrer (default: 100)
- `LOYALTY_REFERRAL_REWARD_REFEREE` — Points for new customer (default: 50)
- `LOYALTY_REFERRAL_ON_FIRST_PURCHASE` — Only award referral points after first purchase (default: true)
- `LOYALTY_LAPSE_MULTIPLIER` — Multiplier of avg interval to trigger lapse (default: 1.5)
- `LOYALTY_RE_ENGAGEMENT_ENABLED` — Enable automatic re-engagement messages (default: true)
- `LOYALTY_RE_ENGAGEMENT_MAX_ATTEMPTS` — Max re-engagement messages before stopping (default: 2)
- `LOYALTY_WHATSAPP_NOTIFICATIONS` — Enable WhatsApp loyalty notifications (default: true)
- `LOYALTY_MAX_MESSAGES_PER_WEEK` — Max loyalty messages per customer per week (default: 2)
- `LOYALTY_EXPIRY_WARNING_DAYS` — Days before expiry to send warning (default: 30)
- `LOYALTY_VISIT_MILESTONE_INTERVAL` — Visits between milestone celebrations (default: 10)
- `LOYALTY_VISIT_MILESTONE_BONUS` — Bonus points for visit milestones (default: 50)
- `LOYALTY_AUTO_ENROLL` — Auto-enroll new customers in loyalty program (default: true)
- `BUSINESS_TIMEZONE` — Timezone (default: "America/Lima")
- `BUSINESS_CURRENCY` — Currency code (default: "PEN")

## Error Handling & Edge Cases
- **Customer not enrolled:** If a customer asks about points but isn't in the program, offer to enroll: "Todavía no estás en nuestro programa de puntos. ¿Quieres inscribirte? Es gratis y empiezas a ganar puntos hoy 🎉"
- **Insufficient points for redemption:** "Necesitas 120 puntos para el corte gratis, y tienes 98. Te faltan 22 puntos — una visita más y lo tienes 🎯"
- **Reward out of stock:** "Lo sentimos, los tratamientos gratis de este mes ya se agotaron. ¿Quieres canjear otro premio o esperar al próximo mes?"
- **Double redemption attempt:** If customer tries to redeem same reward twice in a day: "Ya canjeaste un corte gratis hoy. ¿Querías canjear otro premio diferente?"
- **Points gaming:** If a customer splits a S/100 purchase into 10×S/10 to game rounding: flag to owner. System should count by transaction total, not item level.
- **Referral to self:** If a customer tries to refer themselves (different phone, same name): check CRM for duplicates. Flag ambiguous cases.
- **Birthday unknown:** If CRM doesn't have birthday data, skip birthday rewards silently. Optionally ask during next visit: "¿Cuándo es tu cumpleaños? Te tenemos un regalo 🎂"
- **Inactive customer reactivation:** If a churned customer returns, welcome them back warmly. Don't expire all their points at once — give a grace period.
- **Negative points balance:** Should never happen. If redemption would go negative, block it. If a refund reduces points below zero due to reversal, set to zero and flag.
- **Program configuration change:** If owner changes points ratio or tier thresholds, apply going forward only. Don't retroactively adjust existing balances.
- **WhatsApp opt-out:** If a customer says "no más mensajes" or similar, immediately update opt-in to false. Confirm: "Entendido, no te enviaremos más mensajes de puntos. Tus puntos siguen activos si quieres consultarlos en cualquier momento 👍"
- **Bulk enrollment:** If owner wants to enroll all existing CRM customers at once, process in batches. Show progress: "Inscribiendo 142 clientas... 50/142... 100/142... ✅ Listo."
- **Multiple businesses:** If a customer visits multiple businesses on the platform, points are per-business. Don't mix.
- **Currency change:** If business currency changes (rare), convert existing points at current ratio. Log the conversion.
