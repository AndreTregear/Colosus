import type { ToolExecutionContext } from '@mastra/core/tools';

/**
 * Shape of the request context values set by the queue worker
 * before invoking any agent. Tools access these via
 * `context.requestContext?.get('tenantId')` etc.
 */
export interface YayaRequestContext {
  tenantId: string;
  channel: string;
  jid: string;
}

/**
 * Convenience type alias for tool execute() context param.
 * Uses `any` for the RequestContext generic to avoid variance issues
 * with createTool's inferred types.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type YayaToolContext = ToolExecutionContext<any, any, any>;

/**
 * Helper to extract tenantId from tool execution context.
 * Throws if missing (should never happen in normal flow).
 */
export function getTenantId(context: YayaToolContext): string {
  const tenantId = String(context.requestContext?.get('tenantId') ?? '');
  if (!tenantId) throw new Error('Missing tenantId in requestContext');
  return tenantId;
}

export function getChannel(context: YayaToolContext): string {
  return String(context.requestContext?.get('channel') ?? 'whatsapp');
}

export function getJid(context: YayaToolContext): string {
  const jid = String(context.requestContext?.get('jid') ?? '');
  if (!jid) throw new Error('Missing jid in requestContext');
  return jid;
}
