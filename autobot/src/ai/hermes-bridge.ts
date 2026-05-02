/**
 * Hermes Bridge — calls the yaya-platform Hermes agent via CLI.
 *
 * Uses `hermes agent --agent yaya-platform --message "..." --json`
 * to invoke the local Hermes agent running on Qwen3.5-27B via vLLM.
 *
 * Hermes handles: conversation memory, system prompt (SOUL.md),
 * skill selection, tool calling (exec, read, write, web_search, etc.)
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { logger } from '../shared/logger.js';

import * as businessContextRepo from '../db/business-context-repo.js';
import * as tenantsRepo from '../db/tenants-repo.js';
import { ensureTenantDbRole } from '../integrations/tenant-provisioner.js';

const execFileAsync = promisify(execFile);

/** Mirrors TenantDbCredentials from tenant-provisioner (not exported). */
interface DbCreds {
  role: string;
  password: string;
  host: string;
  port: number;
  database: string;
}

export interface HermesBridgeResult {
  reply: string;
  imagesToSend: Array<{ imagePath: string; caption: string }>;
}

const HERMES_BIN = process.env.HERMES_BIN || 'hermes';
const HERMES_AGENT = process.env.HERMES_AGENT || 'yaya-platform';
const HERMES_TIMEOUT_MS = Number(process.env.HERMES_TIMEOUT_MS) || 120_000;

interface HermesResponse {
  result?: {
    payloads?: Array<{ text: string; mediaUrl?: string | null }>;
    meta?: {
      durationMs?: number;
      agentMeta?: { model?: string; sessionId?: string };
    };
  };
  error?: string;
}

type CallErrorType = 'timeout' | 'empty' | 'parse_error' | 'agent_error';

/**
 * Call the Hermes agent and return its reply.
 */
async function callHermes(message: string, sessionId?: string, dbCreds?: DbCreds): Promise<{ reply: string; durationMs: number; error?: CallErrorType }> {
  const startTime = Date.now();

  const args = [
    'agent',
    '--agent', HERMES_AGENT,
    '--message', message,
    '--json',
  ];

  if (sessionId) {
    args.push('--session-id', sessionId);
  }

  try {
    logger.debug({ agent: HERMES_AGENT, messageLength: message.length, sessionId }, 'Calling Hermes agent');

    const env: Record<string, string> = { ...process.env } as Record<string, string>;
    if (dbCreds) {
      env.PGPASSWORD = dbCreds.password;
      env.PGHOST = dbCreds.host;
      env.PGPORT = String(dbCreds.port);
      env.PGUSER = dbCreds.role;
      env.PGDATABASE = dbCreds.database;
    }

    const { stdout, stderr } = await execFileAsync(HERMES_BIN, args, {
      timeout: HERMES_TIMEOUT_MS,
      maxBuffer: 1024 * 1024, // 1MB
      env,
    });

    if (stderr) {
      logger.debug({ stderr: stderr.slice(0, 500) }, 'Hermes stderr');
    }

    // Parse JSON — hermes may output non-JSON before the JSON (warnings, config writes)
    const jsonStart = stdout.indexOf('{');
    if (jsonStart === -1) {
      logger.error({ stdout: stdout.slice(0, 500) }, 'Hermes returned no JSON');
      return { reply: '', durationMs: Date.now() - startTime, error: 'empty' };
    }

    const jsonStr = stdout.slice(jsonStart);
    let data: HermesResponse;
    try {
      data = JSON.parse(jsonStr);
    } catch {
      logger.error({ jsonStr: jsonStr.slice(0, 500) }, 'Hermes returned invalid JSON');
      return { reply: '', durationMs: Date.now() - startTime, error: 'parse_error' };
    }

    if (data.error) {
      logger.error({ error: data.error }, 'Hermes agent error');
      return { reply: '', durationMs: Date.now() - startTime, error: 'agent_error' };
    }

    const text = data.result?.payloads?.[0]?.text || '';
    const modelDuration = data.result?.meta?.durationMs || 0;

    // Check for empty/garbage reply
    if (!text || text.trim().length === 0) {
      logger.warn({ agent: HERMES_AGENT }, 'Hermes returned empty reply');
      return { reply: '', durationMs: Date.now() - startTime, error: 'empty' };
    }

    logger.info({
      agent: HERMES_AGENT,
      model: data.result?.meta?.agentMeta?.model,
      replyLength: text.length,
      modelDurationMs: modelDuration,
      totalDurationMs: Date.now() - startTime,
    }, 'Hermes agent replied');

    return { reply: text, durationMs: Date.now() - startTime };
  } catch (err: any) {
    if (err.killed) {
      logger.error({ timeoutMs: HERMES_TIMEOUT_MS }, 'Hermes agent timed out');
      return { reply: '', durationMs: Date.now() - startTime, error: 'timeout' };
    } else {
      logger.error({ err: err.message, code: err.code }, 'Hermes agent call failed');
      return { reply: '', durationMs: Date.now() - startTime, error: 'agent_error' };
    }
  }
}

/**
 * Get the appropriate Spanish fallback message for an error type.
 */
function getFallbackMessage(error?: CallErrorType): string {
  switch (error) {
    case 'timeout':
      return 'Estoy procesando tu solicitud, dame un momento...';
    case 'empty':
    case 'parse_error':
    case 'agent_error':
    default:
      return 'Lo siento, tuve un problema. \u00bfPodr\u00edas repetirme?';
  }
}

/**
 * Build context string for the agent from tenant data.
 * Injects RLS-scoped DB credentials so the agent uses a tenant-specific PostgreSQL role.
 */
async function buildTenantContext(tenantId: string, jid: string, contactName?: string): Promise<{ context: string; dbCreds: DbCreds }> {
  const [tenant, bizCtx, dbCreds] = await Promise.all([
    tenantsRepo.getTenantById(tenantId),
    businessContextRepo.getBusinessContext(tenantId),
    ensureTenantDbRole(tenantId),
  ]);

  const tenantName = tenant?.name || 'Unknown';
  const parts: string[] = [];
  parts.push(`[Tenant: ${tenantName} (${tenantId})]`);
  parts.push(`[Customer: ${contactName || jid}]`);
  if (bizCtx?.businessType) parts.push(`[Business type: ${bizCtx.businessType}]`);
  if (bizCtx?.businessDescription) parts.push(`[Description: ${bizCtx.businessDescription}]`);

  // RLS-enforced DB access — credentials passed via environment variables, NOT in prompt text
  parts.push(`\nDATABASE ACCESS: You have a dedicated database connection scoped to this tenant.`);
  parts.push(`Use the database tool for all queries. Row-Level Security is enforced — you can only see data for tenant ${tenantId}.`);

  return { context: parts.join(' '), dbCreds };
}

/**
 * Process a customer message through Hermes.
 * Called from ai-queue.ts for incoming WhatsApp messages.
 * Never throws — all errors are caught and return a friendly fallback.
 */
export async function processWithHermes(
  tenantId: string,
  _channel: string,
  jid: string,
  text: string,
  onChunk: (chunk: string) => Promise<void>,
  imageMediaPath?: string,
): Promise<HermesBridgeResult> {
  try {
    const { context, dbCreds } = await buildTenantContext(tenantId, jid);
    const sessionId = `t-${tenantId.slice(0,8)}-${Date.now()}`;

    let fullMessage = text;
    if (imageMediaPath) {
      fullMessage += `\n[Customer sent an image: ${imageMediaPath}]`;
    }

    const messageWithContext = `${context}\n\nCustomer message: ${fullMessage}`;

    const { reply, error } = await callHermes(messageWithContext, sessionId, dbCreds);

    if (!reply) {
      const fallback = getFallbackMessage(error);
      await onChunk(fallback);
      return { reply: fallback, imagesToSend: [] };
    }

    // Send as single chunk (Hermes CLI doesn't stream)
    await onChunk(reply);
    return { reply, imagesToSend: [] };
  } catch (err) {
    logger.error({ err, tenantId, jid }, 'Hermes bridge processWithHermes failed');
    const fallback = getFallbackMessage();
    try { await onChunk(fallback); } catch { /* best effort */ }
    return { reply: fallback, imagesToSend: [] };
  }
}

/**
 * Process an owner/admin message through Hermes.
 * Called from ai-queue.ts for self-chat (owner messaging their own number).
 * Never throws — all errors are caught and return a friendly fallback.
 */
export async function processOwnerWithHermes(
  tenantId: string,
  jid: string,
  text: string,
): Promise<{ reply: string }> {
  try {
    const [tenant, dbCreds] = await Promise.all([
      tenantsRepo.getTenantById(tenantId),
      ensureTenantDbRole(tenantId),
    ]);
    const sessionId = `o-${tenantId.slice(0,8)}-${Date.now()}`;

    const parts: string[] = [];
    parts.push(`[Owner of ${tenant?.name || 'business'} (${tenantId})] [This is the business owner talking to you directly]`);
    parts.push(`\nDATABASE ACCESS: You have a dedicated database connection scoped to this tenant.`);
    parts.push(`Use the database tool for all queries. Row-Level Security is enforced — you can only see data for tenant ${tenantId}.`);

    const messageWithContext = `${parts.join(' ')}\n\nOwner message: ${text}`;

    const { reply, error } = await callHermes(messageWithContext, sessionId, dbCreds);

    return { reply: reply || getFallbackMessage(error) };
  } catch (err) {
    logger.error({ err, tenantId, jid }, 'Hermes bridge processOwnerWithHermes failed');
    return { reply: getFallbackMessage() };
  }
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
