/**
 * Call Handler — detect incoming WhatsApp calls, reject them,
 * and prompt the caller to send a voice note instead.
 *
 * Baileys can detect calls and reject them, but cannot answer or stream audio.
 * So we reject the call and immediately send a voice note greeting that tells
 * the caller to send a voice message for an instant AI-powered reply.
 */
import { tenantManager } from '../bot/tenant-manager.js';
import { synthesizeSpeech } from './voice-pipeline.js';
import { logger } from '../shared/logger.js';
import type { WACallEvent } from '../shared/types.js';

/** Track handled call IDs to avoid duplicate processing */
const handledCalls = new Set<string>();

/** Greeting text synthesized and sent as a voice note to callers */
const CALL_GREETING_TEXT =
  'Hola! Soy tu asistente de negocio. No puedo contestar llamadas todavia, ' +
  'pero enviame un mensaje de voz y te respondo al instante con audio.';

/** Fallback text message if TTS fails */
const CALL_FALLBACK_TEXT =
  'Vi tu llamada. Enviame un mensaje de voz y te respondo al instante con audio.';

/**
 * Handle incoming WhatsApp call events for a tenant.
 * Called by the WorkerBridge when the Baileys worker forwards call events.
 */
export function handleCallEvents(tenantId: string, events: WACallEvent[]): void {
  for (const event of events) {
    if (event.status === 'offer' && !handledCalls.has(event.id)) {
      handledCalls.add(event.id);

      logger.info(
        { tenantId, callId: event.id, from: event.from, isVideo: event.isVideo },
        'Incoming WhatsApp call — rejecting and sending voice prompt',
      );

      handleIncomingCall(tenantId, event).catch(err =>
        logger.error({ err, tenantId, callId: event.id }, 'Failed to handle incoming call'),
      );

      // Prevent unbounded memory growth
      if (handledCalls.size > 200) {
        const entries = [...handledCalls];
        entries.slice(0, 100).forEach(id => handledCalls.delete(id));
      }
    }
  }
}

async function handleIncomingCall(tenantId: string, call: WACallEvent): Promise<void> {
  // 1. Reject the call (best-effort)
  try {
    tenantManager.rejectCall(tenantId, call.id, call.from);
  } catch {
    // best-effort — call may have already ended
  }

  // 2. Wait briefly for the rejection to propagate before sending the voice note
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 3. Try to send a voice note greeting
  try {
    const audioBuffer = await synthesizeSpeech(CALL_GREETING_TEXT);
    await tenantManager.sendAudio(tenantId, call.from, audioBuffer, 'audio/mpeg', true);
    logger.info({ tenantId, callId: call.id, from: call.from }, 'Sent voice note greeting after rejected call');
  } catch (err) {
    logger.warn({ err, tenantId, callId: call.id }, 'TTS greeting failed, falling back to text');
    // Fallback: send text message
    try {
      await tenantManager.sendMessage(tenantId, call.from, CALL_FALLBACK_TEXT);
    } catch (textErr) {
      logger.error({ err: textErr, tenantId, callId: call.id }, 'Text fallback also failed');
    }
  }
}
