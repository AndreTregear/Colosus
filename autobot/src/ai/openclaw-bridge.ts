/**
 * OpenClaw Bridge — replaces the Mastra-based AI engine.
 *
 * Delegates all AI processing to the OpenClaw agent API via HTTP.
 * OpenClaw handles conversation memory, skill selection, and MCP tool execution.
 * This bridge is stateless — it just forwards tenant context and returns replies.
 */

import { OPENCLAW_API_URL, OPENCLAW_API_KEY } from '../config.js';
import { logger } from '../shared/logger.js';

// Re-export isOwnerChat from the DB layer directly (no Mastra dependency)
import * as businessContextRepo from '../db/business-context-repo.js';
import * as tenantsRepo from '../db/tenants-repo.js';

export interface OpenClawBridgeResult {
  reply: string;
  imagesToSend: Array<{ imagePath: string; caption: string }>;
}

interface OpenClawChatRequest {
  message: string;
  context: {
    tenantId: string;
    channel: string;
    contactJid: string;
    contactName?: string;
    isOwner: boolean;
    imageUrl?: string;
  };
}

interface OpenClawChatResponse {
  reply: string;
  images?: Array<{ imagePath: string; caption: string }>;
}

const REQUEST_TIMEOUT_MS = 120_000;

/**
 * Process a customer message through OpenClaw with streaming support.
 * Uses SSE if the OpenClaw API supports it, otherwise falls back to a single POST.
 */
export async function processWithOpenClaw(
  tenantId: string,
  channel: string,
  jid: string,
  text: string,
  onChunk: (chunk: string) => Promise<void>,
  imageMediaPath?: string,
): Promise<OpenClawBridgeResult> {
  const url = `${OPENCLAW_API_URL}/chat`;

  const body: OpenClawChatRequest = {
    message: text,
    context: {
      tenantId,
      channel,
      contactJid: jid,
      isOwner: false,
      ...(imageMediaPath && { imageUrl: imageMediaPath }),
    },
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream, application/json',
        ...(OPENCLAW_API_KEY && { 'Authorization': `Bearer ${OPENCLAW_API_KEY}` }),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'unknown');
      logger.error({ tenantId, jid, status: response.status, errorText }, 'OpenClaw API error');
      return { reply: 'Lo siento, estoy teniendo dificultades técnicas. Por favor, intenta de nuevo en un momento.', imagesToSend: [] };
    }

    const contentType = response.headers.get('content-type') || '';

    // SSE streaming path
    if (contentType.includes('text/event-stream') && response.body) {
      return await handleSSEStream(response.body, onChunk, tenantId, jid);
    }

    // JSON fallback (non-streaming)
    const data = await response.json() as OpenClawChatResponse;

    if (data.reply) {
      await onChunk(data.reply);
    }

    return {
      reply: data.reply || '',
      imagesToSend: data.images || [],
    };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'TimeoutError') {
      logger.error({ tenantId, jid, timeoutMs: REQUEST_TIMEOUT_MS }, 'OpenClaw request timed out');
    } else {
      logger.error({ err, tenantId, jid }, 'OpenClaw bridge error');
    }
    return { reply: 'Lo siento, estoy teniendo dificultades técnicas. Por favor, intenta de nuevo en un momento.', imagesToSend: [] };
  }
}

/**
 * Process an owner/admin message through OpenClaw (non-streaming).
 */
export async function processOwnerWithOpenClaw(
  tenantId: string,
  jid: string,
  text: string,
): Promise<{ reply: string }> {
  const url = `${OPENCLAW_API_URL}/chat`;

  const body: OpenClawChatRequest = {
    message: text,
    context: {
      tenantId,
      channel: 'whatsapp',
      contactJid: jid,
      isOwner: true,
    },
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(OPENCLAW_API_KEY && { 'Authorization': `Bearer ${OPENCLAW_API_KEY}` }),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'unknown');
      logger.error({ tenantId, jid, status: response.status, errorText }, 'OpenClaw owner API error');
      return { reply: 'Lo siento, hubo un error. Intenta de nuevo.' };
    }

    const data = await response.json() as OpenClawChatResponse;
    return { reply: data.reply || 'Entendido. ¿Hay algo más que necesites?' };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'TimeoutError') {
      logger.error({ tenantId, jid, timeoutMs: REQUEST_TIMEOUT_MS }, 'OpenClaw owner request timed out');
    } else {
      logger.error({ err, tenantId, jid }, 'OpenClaw owner bridge error');
    }
    return { reply: 'Lo siento, hubo un error. Intenta de nuevo.' };
  }
}

/**
 * Check if a JID is the business owner (self-chat).
 * Inlined from owner-agent.ts — queries tenant_admin_settings directly.
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

// ── SSE Stream Handler ──

async function handleSSEStream(
  body: ReadableStream<Uint8Array>,
  onChunk: (chunk: string) => Promise<void>,
  tenantId: string,
  jid: string,
): Promise<OpenClawBridgeResult> {
  const decoder = new TextDecoder();
  const reader = body.getReader();
  let fullReply = '';
  let images: Array<{ imagePath: string; caption: string }> = [];
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE lines
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();

        if (data === '[DONE]') continue;

        try {
          const event = JSON.parse(data) as {
            type?: string;
            text?: string;
            chunk?: string;
            reply?: string;
            images?: Array<{ imagePath: string; caption: string }>;
          };

          if (event.type === 'chunk' || event.chunk || event.text) {
            const chunk = event.chunk || event.text || '';
            if (chunk) {
              fullReply += chunk;
              await onChunk(chunk);
            }
          } else if (event.type === 'done' || event.reply) {
            // Final event with complete reply and images
            if (event.reply) fullReply = event.reply;
            if (event.images) images = event.images;
          }
        } catch {
          // Non-JSON SSE data — treat as plain text chunk
          if (data) {
            fullReply += data;
            await onChunk(data);
          }
        }
      }
    }
  } catch (err) {
    logger.error({ err, tenantId, jid }, 'SSE stream read error');
  } finally {
    reader.releaseLock();
  }

  return { reply: fullReply, imagesToSend: images };
}
