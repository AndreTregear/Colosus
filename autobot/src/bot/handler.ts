import type { WASocket, proto } from '@whiskeysockets/baileys';
import { getEnabledRulesSorted } from '../db/pg-rules-repo.js';
import { logMessagePg } from '../db/pg-messages-repo.js';
import { matchRule } from './rules-engine.js';
import { incrementMessagesHandled } from './connection.js';
import { logger } from '../shared/logger.js';

// Single-tenant mode uses a default tenant ID
const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';

let autoReplyEnabled = true;

export function setAutoReplyEnabled(v: boolean): void {
  autoReplyEnabled = v;
}

export function isAutoReplyEnabled(): boolean {
  return autoReplyEnabled;
}

// Rate limit: track last reply time per JID to avoid spamming
const lastReplyMap = new Map<string, number>();
const RATE_LIMIT_MS = 3000; // Minimum 3 seconds between replies to same JID

export async function handleIncomingMessage(
  sock: WASocket,
  msg: proto.IWebMessageInfo,
): Promise<void> {
  // Skip own messages, status broadcasts, protocol messages
  if (!msg.key || msg.key.fromMe) return;
  if (!msg.key.remoteJid || msg.key.remoteJid === 'status@broadcast') return;
  if (!msg.message) return;

  // Extract text content
  const text =
    msg.message.conversation ||
    msg.message.extendedTextMessage?.text ||
    null;

  if (!text) return;

  const jid = msg.key.remoteJid;
  const isGroup = jid.endsWith('@g.us');
  const pushName = msg.pushName || null;

  logger.debug({
    channel: 'whatsapp',
    jid,
    isGroup,
    pushName,
    type: msg.message.conversation ? 'conversation' : 'extendedText',
    textLength: text.length,
  }, 'Incoming message (single-tenant handler)');

  // Log the incoming message
  await logMessagePg({
    tenantId: DEFAULT_TENANT_ID,
    channel: 'whatsapp',
    jid,
    pushName,
    direction: 'incoming',
    body: text,
    timestamp: new Date().toISOString(),
  });
  incrementMessagesHandled();

  if (!autoReplyEnabled) return;

  // Rate limit check
  const now = Date.now();
  const lastReply = lastReplyMap.get(jid);
  if (lastReply && now - lastReply < RATE_LIMIT_MS) return;

  // Match against rules
  const rules = await getEnabledRulesSorted(DEFAULT_TENANT_ID);
  const matched = matchRule(text, jid, isGroup, rules);

  if (!matched) return;

  // Send reply
  await sock.sendMessage(jid, { text: matched.reply });
  lastReplyMap.set(jid, now);

  // Log the outgoing reply
  await logMessagePg({
    tenantId: DEFAULT_TENANT_ID,
    channel: 'whatsapp',
    jid,
    pushName: null,
    direction: 'outgoing',
    body: matched.reply,
    timestamp: new Date().toISOString(),
  });

  logger.info(`Replied to ${pushName || jid} with rule "${matched.name}"`);
}
