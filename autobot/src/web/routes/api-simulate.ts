import { Router } from 'express';
import { Agent } from '@mastra/core/agent';
import { textModel, salesMemory, pgStore } from '../../ai/mastra.js';
import { queryOne, query } from '../../db/pool.js';
import { logger } from '../../shared/logger.js';

const DARWIN_TENANT_SLUG = 'demo-darwin';
let cachedTenantId: string | null = null;

async function getDarwinTenantId(): Promise<string> {
  if (cachedTenantId) return cachedTenantId;
  const row = await queryOne<{ id: string }>(
    'SELECT id FROM tenants WHERE slug = $1',
    [DARWIN_TENANT_SLUG],
  );
  if (!row) throw new Error('Darwin demo tenant not found — run ensureDarwinTenant() first');
  cachedTenantId = row.id;
  return cachedTenantId;
}

async function getSellerPrompt(tenantId: string): Promise<string> {
  const row = await queryOne<{ value: string }>(
    'SELECT value FROM settings WHERE tenant_id = $1 AND key = $2',
    [tenantId, 'system_prompt'],
  );
  return row?.value || 'Eres un asistente de ventas de Yaya Commerce. Responde en español de manera amigable y profesional.';
}

// Single agent instance — instructions loaded dynamically from DB on each call
let sellerAgent: Agent | null = null;

function getSellerAgent(): Agent {
  if (sellerAgent) return sellerAgent;
  sellerAgent = new Agent({
    id: 'darwin-seller',
    name: 'Darwin Seller Agent',
    model: textModel,
    instructions: async () => {
      const tenantId = await getDarwinTenantId();
      return getSellerPrompt(tenantId);
    },
    memory: salesMemory,
  });
  return sellerAgent;
}

const router = Router();

/**
 * POST /api/v1/simulate/chat
 * Unauthenticated endpoint for Darwin Lab buyer agents to talk to the sales agent.
 */
router.post('/chat', async (req, res) => {
  const { message, sessionId, personaId } = req.body;

  if (!message || typeof message !== 'string') {
    res.status(400).json({ error: 'message is required' });
    return;
  }
  if (!sessionId || typeof sessionId !== 'string') {
    res.status(400).json({ error: 'sessionId is required' });
    return;
  }

  try {
    const agent = getSellerAgent();
    const threadId = `darwin:${sessionId}`;
    const resourceId = `darwin:${personaId || 'buyer'}`;

    const result = await agent.stream([message], {
      maxSteps: 5,
      memory: { thread: threadId, resource: resourceId },
    });

    // Collect full response (non-streaming for HTTP response)
    const reader = result.textStream.getReader();
    let reply = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      reply += value;
    }
    reader.releaseLock();

    // Strip DeepSeek <think> blocks
    reply = reply.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

    res.json({ reply, sessionId });
  } catch (err) {
    logger.error({ err, sessionId }, 'Simulate chat failed');
    res.status(500).json({ error: 'Failed to process message' });
  }
});

/**
 * POST /api/v1/simulate/prompt
 * Update the seller's system prompt (called by Darwin evolver).
 */
router.post('/prompt', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'prompt is required' });
    return;
  }

  try {
    const tenantId = await getDarwinTenantId();
    await query(
      `INSERT INTO settings (tenant_id, key, value, updated_at)
       VALUES ($1, 'system_prompt', $2, now())
       ON CONFLICT (tenant_id, key) DO UPDATE SET value = $2, updated_at = now()`,
      [tenantId, prompt],
    );
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, 'Failed to update seller prompt');
    res.status(500).json({ error: 'Failed to update prompt' });
  }
});

/**
 * GET /api/v1/simulate/prompt
 * Read the current seller prompt.
 */
router.get('/prompt', async (_req, res) => {
  try {
    const tenantId = await getDarwinTenantId();
    const prompt = await getSellerPrompt(tenantId);
    res.json({ prompt });
  } catch (err) {
    logger.error({ err }, 'Failed to read seller prompt');
    res.status(500).json({ error: 'Failed to read prompt' });
  }
});

/**
 * Ensure the demo-darwin tenant exists in the database.
 * Called once on platform startup — idempotent.
 */
export async function ensureDarwinTenant(): Promise<void> {
  const existing = await queryOne<{ id: string }>(
    'SELECT id FROM tenants WHERE slug = $1',
    [DARWIN_TENANT_SLUG],
  );
  if (existing) {
    cachedTenantId = existing.id;
    return;
  }

  const row = await queryOne<{ id: string }>(
    `INSERT INTO tenants (name, slug, phone, api_key, status, settings)
     VALUES ('Darwin Sales Lab', $1, '', replace(gen_random_uuid()::text, '-', ''), 'active', '{}')
     RETURNING id`,
    [DARWIN_TENANT_SLUG],
  );
  if (!row) throw new Error('Failed to create Darwin demo tenant');

  await query(
    `INSERT INTO settings (tenant_id, key, value) VALUES
       ($1, 'system_prompt', ''),
       ($1, 'ai_enabled', '1'),
       ($1, 'business_type', 'lead_capture')
     ON CONFLICT (tenant_id, key) DO NOTHING`,
    [row.id],
  );

  await query(
    `INSERT INTO tenant_sessions (tenant_id) VALUES ($1) ON CONFLICT DO NOTHING`,
    [row.id],
  );

  cachedTenantId = row.id;
  logger.info({ tenantId: row.id }, 'Darwin demo tenant created');
}

export { router as simulateRouter };
