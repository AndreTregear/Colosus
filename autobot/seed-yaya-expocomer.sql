-- Yaya AI Cybersecurity — Expocomer 2026 Seed Data
-- Run after schema.sql against the default tenant (00000000-0000-0000-0000-000000000001)

-- Set business type to lead_capture
INSERT INTO settings (tenant_id, key, value)
VALUES ('00000000-0000-0000-0000-000000000001', 'business_type', 'lead_capture')
ON CONFLICT (tenant_id, key) DO UPDATE SET value = 'lead_capture', updated_at = now();

-- Configure business context
INSERT INTO business_context (tenant_id, business_name, business_description, business_type, services_offered, tone_of_voice, special_instructions)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Yaya AI & Cybersecurity',
  'We build secure AI systems that businesses own and control. Observable by design, with guardrails and safety at the utmost priority. Your brand, your voice, your chatbot — running on YOUR infrastructure.',
  'lead_capture',
  ARRAY[
    'Custom AI Chatbots — Your brand, your voice, trained on your business data. WhatsApp, web, and multi-channel. You own the infrastructure.',
    'AI Security & Guardrails — Prompt injection defense, content filtering, rate limiting, input validation. Built-in safety for any AI deployment.',
    'Observable AI Systems — Full traceability with LangFuse integration. Every AI decision logged, auditable, and explainable. No black boxes.',
    'AI Infrastructure Setup — Self-hosted LLM deployment on your servers. No vendor lock-in, no data leaving your environment. GPU optimization included.',
    'WhatsApp Commerce Automation — AI-powered sales, support, and order management via WhatsApp. Handles payments, inventory, and customer relationships.',
    'Penetration Testing & Security Audits — AI-assisted vulnerability assessment for your applications and infrastructure. OWASP top 10 coverage.',
    'Compliance Automation — Automated compliance checks and reporting for GDPR, SOX, and industry-specific regulations.',
    'AI Training & Workshops — Hands-on training for your team on secure AI development, prompt engineering, and AI operations.'
  ],
  'friendly',
  'You are representing Yaya at Expocomer 2026 in Panama City. When leads mention the expo, acknowledge it warmly. Always set lead source to "expocomer_2026". Offer to schedule a live demo at our booth or a virtual follow-up after the expo. When possible, capture their company size and industry. Respond in whatever language the prospect writes (Spanish or English). Default to Spanish if unclear. Be confident and technical when needed, but never boring.'
)
ON CONFLICT (tenant_id) DO UPDATE SET
  business_name = EXCLUDED.business_name,
  business_description = EXCLUDED.business_description,
  business_type = EXCLUDED.business_type,
  services_offered = EXCLUDED.services_offered,
  tone_of_voice = EXCLUDED.tone_of_voice,
  special_instructions = EXCLUDED.special_instructions,
  last_updated_at = now(),
  context_version = business_context.context_version + 1;
