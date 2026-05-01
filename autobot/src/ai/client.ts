import OpenAI from 'openai';
import {
  AI_BASE_URL, AI_API_KEY, AI_MODEL,
  VISION_BASE_URL, VISION_API_KEY, VISION_MODEL,
  WHISPER_BASE_URL, WHISPER_API_KEY, WHISPER_MODEL,
} from '../config.js';
import { logger } from '../shared/logger.js';
import { qwenNoThinkFetch } from './qwen-fetch.js';

let client: OpenAI | null = null;
let visionClient: OpenAI | null = null;

export function getAIClient(): OpenAI {
  if (!client) {
    logger.debug({ baseUrl: AI_BASE_URL, model: AI_MODEL }, 'Initializing AI client');
    client = new OpenAI({ baseURL: AI_BASE_URL, apiKey: AI_API_KEY, fetch: qwenNoThinkFetch });
  }
  return client;
}

export function getModelId(): string {
  return AI_MODEL;
}

export function getVisionClient(): OpenAI {
  if (!visionClient) {
    logger.debug({ baseUrl: VISION_BASE_URL, model: VISION_MODEL }, 'Initializing Vision client');
    visionClient = new OpenAI({ baseURL: VISION_BASE_URL, apiKey: VISION_API_KEY });
  }
  return visionClient;
}

export function getVisionModelId(): string {
  return VISION_MODEL;
}

/** Transcribe audio buffer using OpenAI Whisper API format. */
export async function transcribeAudio(buffer: Buffer, mimetype: string): Promise<string> {
  const ext = mimetype.includes('ogg') ? 'ogg'
    : mimetype.includes('mp4') ? 'm4a'
    : mimetype.includes('mpeg') ? 'mp3'
    : 'ogg';

  logger.debug({ mimetype, ext, bufferSize: buffer.length, model: WHISPER_MODEL, baseUrl: WHISPER_BASE_URL }, 'Transcribing audio via Whisper');
  const startTime = Date.now();

  const formData = new FormData();
  const arrayBuf = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
  const blob = new Blob([arrayBuf], { type: mimetype });
  formData.append('file', blob, `audio.${ext}`);
  formData.append('model', WHISPER_MODEL);
  formData.append('language', process.env.WHISPER_LANGUAGE || 'es');

  const response = await fetch(`${WHISPER_BASE_URL}/audio/transcriptions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${WHISPER_API_KEY}` },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.text();
    logger.error({ status: response.status, error: err, latencyMs: Date.now() - startTime }, 'Whisper API error');
    throw new Error(`Whisper API error ${response.status}: ${err}`);
  }

  const result = await response.json() as { text: string };
  logger.debug({ transcriptionLength: result.text.length, latencyMs: Date.now() - startTime }, 'Whisper transcription complete');
  return result.text;
}
