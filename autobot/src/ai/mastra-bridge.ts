/**
 * Mastra Bridge — routes customer/owner messages to the right AI backend.
 *
 * Routing strategy:
 *   Customer → LOCAL 35B (speed) by default, HPC 122B for complex conversations
 *   Owner/CEO → HPC 122B always (accuracy + larger context for reports)
 *   Fallback → if primary backend is down, use the other
 *
 * Uses shared agents from ./agents.ts (same agents used by the Express API).
 */

import { whatsappAgent, whatsappAgentHpc, directAgent, directAgentHpc } from './agents.js';
import { runWithTenant } from './tenant-context.js';
import { classifyRoute, ensureHealthy, recordLatency, type RouteTarget } from './model-router.js';
import { logger } from '../shared/logger.js';

import * as businessContextRepo from '../db/business-context-repo.js';
import * as tenantsRepo from '../db/tenants-repo.js';
import { getConversationHistory } from '../db/pg-messages-repo.js';

// ── Bridge Interface (same as openclaw-bridge.ts) ──

export interface HermesBridgeResult {
  reply: string;
  imagesToSend: Array<{ imagePath: string; caption: string }>;
  routedTo?: RouteTarget;
}

/**
 * Process a customer message through Mastra agent.
 * Automatically routes to local (35B) or HPC (122B) based on complexity.
 */
export async function processWithHermes(
  tenantId: string,
  _channel: string,
  jid: string,
  text: string,
  onChunk: (chunk: string) => Promise<void>,
  imageMediaPath?: string,
): Promise<HermesBridgeResult> {
  const startTime = Date.now();

  return runWithTenant(tenantId, async () => {
  try {
    // Build context
    const bizCtx = await businessContextRepo.getBusinessContext(tenantId).catch(() => null);
    const tenant = await tenantsRepo.getTenantById(tenantId).catch(() => null);

    let systemContext = '';
    if (tenant?.name) systemContext += `Negocio: ${tenant.name}. `;
    if (bizCtx?.businessType) systemContext += `Tipo: ${bizCtx.businessType}. `;
    if (bizCtx?.businessDescription) systemContext += `${bizCtx.businessDescription}. `;

    let prompt = text;
    if (imageMediaPath) prompt += `\n[El cliente envió una imagen: ${imageMediaPath}]`;

    // Pass customer JID so agent can create orders without asking for phone
    const customerContext = `[Cliente WhatsApp: ${jid}]`;

    // Load recent conversation history for multi-turn context (last 4 messages = ~2 turns)
    let historyContext = '';
    let historyLength = 0;
    try {
      const history = await getConversationHistory(tenantId, jid, 4);
      historyLength = history.messages.length;
      if (historyLength > 0) {
        const lines = history.messages.map(m => {
          const body = m.body.length > 120 ? m.body.slice(0, 120) + '...' : m.body;
          return m.direction === 'incoming' ? `Cliente: ${body}` : `Tú: ${body}`;
        });
        historyContext = `\n[Historial]\n${lines.join('\n')}\n[Fin]`;
      }
    } catch { /* no history available — first message */ }

    // Route to the appropriate backend
    let target = classifyRoute({
      isOwner: false,
      messageLength: text.length,
      historyLength,
    });

    // Check health, fallback if needed
    if (!await ensureHealthy(target)) {
      const fallback: RouteTarget = target === 'hpc' ? 'local' : 'hpc';
      if (await ensureHealthy(fallback)) {
        logger.warn({ target, fallback }, 'Primary backend unhealthy, routing to fallback');
        target = fallback;
      }
    }

    const agent = target === 'hpc' ? whatsappAgentHpc : whatsappAgent;

    const instructions = systemContext
      ? `${systemContext}\nSiempre usa product-catalog para precios. Usa create-order con el JID del cliente cuando confirme su pedido. Responde conciso en español. /no_think`
      : undefined;

    let result;
    try {
      result = await agent.generate(`${customerContext}${historyContext}\n${prompt}`, {
        maxSteps: 6,
        instructions,
      });
    } catch (retryErr) {
      logger.warn({ retryErr, tenantId, jid }, 'Agent failed, retrying without history');
      result = await agent.generate(`${customerContext}\n${prompt}`, {
        maxSteps: 6,
        instructions,
      });
    }

    const latencyMs = Date.now() - startTime;
    recordLatency(target, latencyMs);

    const reply = result.text || 'Lo siento, tuve un problema. ¿Podrías repetirme?';

    logger.info({
      tenantId, jid, replyLength: reply.length,
      durationMs: latencyMs, backend: target,
    }, 'Mastra agent replied');

    await onChunk(reply);
    return { reply, imagesToSend: [], routedTo: target };
  } catch (err) {
    logger.error({ err, tenantId, jid, durationMs: Date.now() - startTime }, 'Mastra agent failed');
    const fallback = 'Lo siento, tuve un problema. ¿Podrías repetirme?';
    try { await onChunk(fallback); } catch { /* best effort */ }
    return { reply: fallback, imagesToSend: [] };
  }
  });
}

/**
 * Process an owner/admin message through the HPC-backed directAgent.
 * CEO always gets the big model (122B, 262K ctx).
 */
export async function processOwnerWithHermes(
  tenantId: string,
  jid: string,
  text: string,
): Promise<{ reply: string; routedTo?: RouteTarget }> {
  const startTime = Date.now();

  return runWithTenant(tenantId, async () => {
  try {
    const tenant = await tenantsRepo.getTenantById(tenantId).catch(() => null);

    // Load recent owner conversation for context continuity (last 4 messages)
    let ownerHistory = '';
    try {
      const history = await getConversationHistory(tenantId, jid, 4);
      if (history.messages.length > 0) {
        const lines = history.messages.map(m => {
          const body = m.body.length > 120 ? m.body.slice(0, 120) + '...' : m.body;
          return m.direction === 'incoming' ? `Tú: ${body}` : `Asistente: ${body}`;
        });
        ownerHistory = `\n[Historial]\n${lines.join('\n')}\n[Fin]\n`;
      }
    } catch { /* no history */ }

    // CEO prefers HPC (122B, more accurate), falls back to local (35B, always available)
    let target: RouteTarget = 'local';
    let agent = directAgent; // local by default

    if (await ensureHealthy('hpc')) {
      target = 'hpc';
      agent = directAgentHpc;
    }

    const instructions = `Asistente del dueño de ${tenant?.name || 'este negocio'}. SIEMPRE usa herramientas: business-metrics, customer-lookup, payment-status, product-catalog. Responde conciso en español. /no_think`;

    let result;
    try {
      result = await agent.generate(`${ownerHistory}${text}`, {
        maxSteps: 6,
        instructions,
      });
    } catch (retryErr) {
      logger.warn({ retryErr, tenantId, jid }, 'Owner agent failed, retrying without history');
      result = await agent.generate(text, {
        maxSteps: 6,
        instructions,
      });
    }

    const latencyMs = Date.now() - startTime;
    recordLatency(target, latencyMs);

    const reply = result.text || 'Lo siento, tuve un problema. ¿Podrías repetirme?';

    logger.info({ tenantId, jid, replyLength: reply.length, durationMs: latencyMs, backend: target }, 'Mastra owner agent replied');
    return { reply, routedTo: target };
  } catch (err) {
    logger.error({ err, tenantId, jid, durationMs: Date.now() - startTime }, 'Mastra owner agent failed');
    return { reply: 'Lo siento, tuve un problema. ¿Podrías repetirme?' };
  }
  });
}

/**
 * Check if a JID is the business owner (unchanged from openclaw-bridge).
 */
export async function isOwnerChat(tenantId: string, jid: string): Promise<boolean> {
  const settings = await businessContextRepo.getAdminSettings(tenantId);

  if (settings?.ownerJid) {
    return businessContextRepo.isOwner(tenantId, jid);
  }

  if (settings?.autoDetectOwner !== false) {
    const tenant = await tenantsRepo.getTenantById(tenantId);
    if (tenant?.phone) {
      const normalizedTenantPhone = tenant.phone.replace(/\D/g, '');
      const normalizedJid = jid.split('@')[0].replace(/\D/g, '');

      if (normalizedTenantPhone === normalizedJid) {
        await businessContextRepo.setOwnerJid(tenantId, jid);
        logger.info({ tenantId, ownerJid: jid }, 'Auto-detected owner from self-chat');
        return true;
      }
    }
  }

  return false;
}
