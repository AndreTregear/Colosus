import type { Channel } from '../bot/providers/types.js';

export interface AIJobData {
  tenantId: string;
  channel: Channel;
  jid: string;
  pushName: string | null;
  text: string;
  timestamp: number;
  /** Relative path to customer's image (saved in uploads dir) */
  imageMediaPath?: string;
  /** Already-transcribed audio text (processed via Whisper before enqueue) */
  audioTranscription?: string;
  /** True when the message was sent from the owner's own device (self-chat) */
  fromMe?: boolean;
  /** Internal counter for offline delay retries */
  _delayCount?: number;
}

export interface AIJobResult {
  reply: string;
  chunksSent: number;
}

export const AI_QUEUE_NAME = 'ai-processing';
