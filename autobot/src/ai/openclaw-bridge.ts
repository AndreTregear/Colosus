/**
 * OpenClaw Bridge — calls the yaya-platform OpenClaw agent via CLI.
 *
 * Uses `openclaw agent --agent yaya-platform --message "..." --json`
 * to invoke the local OpenClaw agent running on Qwen3.5-27B via vLLM.
 *
 * OpenClaw handles: conversation memory, system prompt (SOUL.md),
 * skill selection, tool calling (exec, read, write, web_search, etc.)
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { logger } from '../shared/logger.js';

import * as businessContextRepo from '../db/business-context-repo.js';
import * as tenantsRepo from '../db/tenants-repo.js';

const execFileAsync = promisify(execFile);

export interface OpenClawBridgeResult {
  reply: string;
  imagesToSend: Array<{ imagePath: string; caption: string }>;
}

const OPENCLAW_BIN = process.env.OPENCLAW_BIN || 'openclaw';
const OPENCLAW_AGENT = process.env.OPENCLAW_AGENT || 'yaya-platform';
const OPENCLAW_TIMEOUT_MS = Number(process.env.OPENCLAW_TIMEOUT_MS) || 120_000;

interface OpenClawResponse {
  result?: {
    payloads?: Array<{ text: string; mediaUrl?: string | null }>;
    meta?: {
      durationMs?: number;
      agentMeta?: { model?: string; sessionId?: string };
    };
  };
  error?: string;
}

/**
 * Call the OpenClaw agent and return its reply.
 */
async function callOpenClaw(message: string, sessionId?: string): Promise<{ reply: string; durationMs: number }> {
  const startTime = Date.now();

  const args = [
    'agent',
    '--agent', OPENCLAW_AGENT,
    '--message', message,
    '--json',
  ];

  if (sessionId) {
    args.push('--session-id', sessionId);
  }

  try {
    logger.debug({ agent: OPENCLAW_AGENT, messageLength: message.length, sessionId }, 'Calling OpenClaw agent');

    const { stdout, stderr } = await execFileAsync(OPENCLAW_BIN, args, {
      timeout: OPENCLAW_TIMEOUT_MS,
      maxBuffer: 1024 * 1024, // 1MB
      env: { ...process.env },
    });

    if (stderr) {
      logger.debug({ stderr: stderr.slice(0, 500) }, 'OpenClaw stderr');
    }

    // Parse JSON — openclaw may output non-JSON before the JSON (warnings, config writes)
    // Find the first { that starts a JSON object
    const jsonStart = stdout.indexOf('{');
    if (jsonStart === -1) {
      logger.error({ stdout: stdout.slice(0, 500) }, 'OpenClaw returned no JSON');
      return { reply: '', durationMs: Date.now() - startTime };
    }

    const jsonStr = stdout.slice(jsonStart);
    const data: OpenClawResponse = JSON.parse(jsonStr);

    if (data.error) {
      logger.error({ error: data.error }, 'OpenClaw agent error');
      return { reply: '', durationMs: Date.now() - startTime };
    }

    const text = data.result?.payloads?.[0]?.text || '';
    const modelDuration = data.result?.meta?.durationMs || 0;

    logger.info({
      agent: OPENCLAW_AGENT,
      model: data.result?.meta?.agentMeta?.model,
      replyLength: text.length,
      modelDurationMs: modelDuration,
      totalDurationMs: Date.now() - startTime,
    }, 'OpenClaw agent replied');

    return { reply: text, durationMs: Date.now() - startTime };
  } catch (err: any) {
    if (err.killed) {
      logger.error({ timeoutMs: OPENCLAW_TIMEOUT_MS }, 'OpenClaw agent timed out');
    } else {
      logger.error({ err: err.message, code: err.code }, 'OpenClaw agent call failed');
    }
    return { reply: '', durationMs: Date.now() - startTime };
  }
}

/**
 * Build context string for the agent from tenant data.
 */
async function buildTenantContext(tenantId: string, jid: string, contactName?: string): Promise<string> {
  const tenant = await tenantsRepo.getTenantById(tenantId);
  const bizCtx = await businessContextRepo.getBusinessContext(tenantId);

  const parts: string[] = [];
  parts.push(`[Tenant: ${tenant?.name || 'Unknown'} (${tenantId})]`);
  parts.push(`[Customer: ${contactName || jid}]`);
  if (bizCtx?.businessType) parts.push(`[Business type: ${bizCtx.businessType}]`);
  if (bizCtx?.businessDescription) parts.push(`[Description: ${bizCtx.businessDescription}]`);

  return parts.join(' ');
}

/**
 * Process a customer message through OpenClaw.
 * Called from ai-queue.ts for incoming WhatsApp messages.
 */
export async function processWithOpenClaw(
  tenantId: string,
  channel: string,
  jid: string,
  text: string,
  onChunk: (chunk: string) => Promise<void>,
  imageMediaPath?: string,
): Promise<OpenClawBridgeResult> {
  const context = await buildTenantContext(tenantId, jid);
  const sessionId = `tenant-${tenantId}-${jid.split('@')[0]}`;

  let fullMessage = text;
  if (imageMediaPath) {
    fullMessage += `\n[Customer sent an image: ${imageMediaPath}]`;
  }

  // Prepend context so the agent knows who's talking
  const messageWithContext = `${context}\n\nCustomer message: ${fullMessage}`;

  const { reply } = await callOpenClaw(messageWithContext, sessionId);

  if (!reply) {
    const fallback = 'Lo siento, estoy teniendo dificultades técnicas. Por favor, intenta de nuevo en un momento.';
    await onChunk(fallback);
    return { reply: fallback, imagesToSend: [] };
  }

  // Send as single chunk (OpenClaw CLI doesn't stream)
  await onChunk(reply);
  return { reply, imagesToSend: [] };
}

/**
 * Process an owner/admin message through OpenClaw.
 * Called from ai-queue.ts for self-chat (owner messaging their own number).
 */
export async function processOwnerWithOpenClaw(
  tenantId: string,
  jid: string,
  text: string,
): Promise<{ reply: string }> {
  const tenant = await tenantsRepo.getTenantById(tenantId);
  const sessionId = `owner-${tenantId}`;

  const messageWithContext = `[Owner of ${tenant?.name || 'business'} (${tenantId})] [This is the business owner talking to you directly]\n\nOwner message: ${text}`;

  const { reply } = await callOpenClaw(messageWithContext, sessionId);

  return { reply: reply || 'Lo siento, hubo un error. Intenta de nuevo.' };
}

/**
 * Check if a JID is the business owner (self-chat).
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
