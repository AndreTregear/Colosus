-- Default platform plans for yaya.sh
-- Run after schema-subscriptions.sql

-- Deactivate old plans that are no longer offered
UPDATE platform_plans SET active = false WHERE slug IN ('starter', 'pro');

-- Upsert the current plan lineup
INSERT INTO platform_plans (name, slug, description, price, billing_cycle, features, limits, sort_order)
VALUES
  (
    'Gratis',
    'free',
    'Para empezar. 100 mensajes para probar el servicio.',
    0,
    'free',
    '{"whatsapp": true, "ai_messages": true}',
    '{"total_messages": 100}',
    0
  ),
  (
    'Premium Mensual',
    'premium-monthly',
    'Mensajes ilimitados. Todo incluido.',
    100,
    'monthly',
    '{"whatsapp": true, "ai_messages": true, "unlimited": true}',
    '{"total_messages": -1}',
    1
  ),
  (
    'Premium Trimestral',
    'premium-quarterly',
    'Mensajes ilimitados. Ahorra con el plan trimestral.',
    200,
    'quarterly',
    '{"whatsapp": true, "ai_messages": true, "unlimited": true}',
    '{"total_messages": -1}',
    2
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  billing_cycle = EXCLUDED.billing_cycle,
  features = EXCLUDED.features,
  limits = EXCLUDED.limits,
  sort_order = EXCLUDED.sort_order,
  active = true;

-- Auto-assign free plan to existing tenants that have no subscription
INSERT INTO tenant_subscriptions (tenant_id, plan_id, status, current_period_start, current_period_end)
SELECT t.id, p.id, 'active', now(), now() + INTERVAL '100 years'
FROM tenants t
CROSS JOIN platform_plans p
WHERE p.slug = 'free'
  AND t.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM tenant_subscriptions ts WHERE ts.tenant_id = t.id AND ts.status = 'active'
  );
