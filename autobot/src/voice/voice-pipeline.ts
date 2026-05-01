/**
 * Voice Pipeline — end-to-end voice message processing.
 *
 * Flow: audio buffer -> STT (Whisper) -> LLM (Mastra agent) -> TTS (Kokoro) -> audio buffer
 *
 * Used for processing incoming WhatsApp voice notes and returning
 * AI-generated voice note responses.
 */
import { logger } from '../shared/logger.js';
import {
  TTS_BASE_URL, TTS_MODEL, TTS_VOICE, TTS_LANG_CODE,
  WHISPER_BASE_URL, WHISPER_API_KEY, WHISPER_MODEL,
} from '../config.js';
import {
  HPC_ASR_BASE, HPC_TTS_BASE, HPC_TTS_VOICE,
  isHpcAsrAvailable, isHpcTtsAvailable,
} from '../ai/model-router.js';
import { extractTransactionWithAgent } from './nlu-agent.js';
import type { StructuredTransaction } from './nlu-extractor.js';
import { prepareAudioAudit, finalizeAudioDeletion } from './audio-compliance.js';

export interface VoicePipelineResult {
  transcription: string;
  transaction: StructuredTransaction | null;
  response: string;
  audioBuffer: Buffer;
  /** Whether TTS succeeded and audioBuffer contains valid audio */
  ttsAvailable: boolean;
  timings: { sttMs: number; nluMs: number; llmMs: number; ttsMs: number; totalMs: number };
}

/**
 * Synthesize text to speech. Tries HPC TTS (Qwen3-TTS) first, falls back to local Kokoro.
 * Returns an MP3 audio buffer.
 */
export async function synthesizeSpeech(text: string): Promise<Buffer> {
  // Strip markdown formatting for cleaner speech
  const cleaned = text.replace(/[*#_`\[\]]/g, '');
  // Truncate very long responses to keep voice notes reasonable
  const truncated = cleaned.length > 500 ? cleaned.slice(0, 500) + '...' : cleaned;

  // Try HPC TTS first (Qwen3-TTS — better quality, 9 voices, returns WAV)
  if (await isHpcTtsAvailable()) {
    try {
      const res = await fetch(`${HPC_TTS_BASE}/audio/speech`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: truncated,
          speaker: HPC_TTS_VOICE,
          language: 'Spanish',
          instruct: '',
        }),
        signal: AbortSignal.timeout(15_000),
      });
      if (res.ok) {
        logger.debug({ backend: 'hpc-tts', speaker: HPC_TTS_VOICE }, 'TTS via HPC');
        return Buffer.from(await res.arrayBuffer());
      }
    } catch (err) {
      logger.warn({ err }, 'HPC TTS failed, falling back to local Kokoro');
    }
  }

  // Fallback: local Kokoro TTS
  const res = await fetch(`${TTS_BASE_URL}/v1/audio/speech`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: TTS_MODEL,
      input: truncated,
      voice: TTS_VOICE,
      lang_code: TTS_LANG_CODE,
      response_format: 'mp3',
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`TTS failed: ${res.status} ${body}`);
  }

  return Buffer.from(await res.arrayBuffer());
}

/**
 * Transcribe audio buffer. Tries HPC ASR (Qwen3-ASR) first, falls back to Whisper.
 */
export async function transcribeSpeech(audioBuffer: Buffer, mimetype: string): Promise<string> {
  const ext = mimetype.includes('ogg') ? 'ogg'
    : mimetype.includes('mp4') ? 'm4a'
    : mimetype.includes('mpeg') ? 'mp3'
    : 'ogg';

  const makeBlob = () => {
    const arrayBuf = audioBuffer.buffer.slice(
      audioBuffer.byteOffset,
      audioBuffer.byteOffset + audioBuffer.byteLength,
    ) as ArrayBuffer;
    return new Blob([arrayBuf], { type: mimetype });
  };

  // Try HPC ASR first (Qwen3-ASR — dedicated model, no LLM contention)
  if (await isHpcAsrAvailable()) {
    try {
      const fd = new FormData();
      fd.append('file', makeBlob(), `voice.${ext}`);
      fd.append('language', 'auto'); // Qwen3-ASR auto-detects language
      const res = await fetch(`${HPC_ASR_BASE}/audio/transcriptions`, {
        method: 'POST',
        body: fd,
        signal: AbortSignal.timeout(10_000),
      });
      if (res.ok) {
        const { text } = await res.json() as { text: string };
        logger.debug({ backend: 'hpc-asr', textLength: text.length }, 'STT via HPC ASR');
        return text;
      }
    } catch (err) {
      logger.warn({ err }, 'HPC ASR failed, falling back to Whisper');
    }
  }

  // Fallback: local/cloud Whisper
  const fd = new FormData();
  fd.append('file', makeBlob(), `voice.${ext}`);
  fd.append('language', process.env.WHISPER_LANGUAGE || 'es');
  fd.append('model', WHISPER_MODEL);

  const headers: Record<string, string> = {};
  if (WHISPER_API_KEY) {
    headers['Authorization'] = `Bearer ${WHISPER_API_KEY}`;
  }

  const res = await fetch(`${WHISPER_BASE_URL}/audio/transcriptions`, {
    method: 'POST',
    headers,
    body: fd,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`STT failed: ${res.status} ${body}`);
  }

  const { text } = await res.json() as { text: string };
  return text;
}

/**
 * Process a voice message through the full pipeline:
 * STT -> LLM (via provided generate function) -> TTS
 *
 * The `generateResponse` callback lets the caller plug in any LLM agent
 * (Mastra directAgent, OpenClaw, etc.) without coupling to a specific implementation.
 */
export async function processVoiceMessage(
  audioBuffer: Buffer,
  mimetype: string,
  generateResponse: (transcription: string) => Promise<string>,
): Promise<VoicePipelineResult> {
  const totalStart = Date.now();

  // Ley 29733: prepare audit trail before processing
  const audit = prepareAudioAudit(audioBuffer, mimetype);

  // 1. STT — fatal if both HPC ASR and Whisper fail (no transcription = no text to work with)
  const sttStart = Date.now();
  let transcription: string;
  try {
    transcription = await transcribeSpeech(audioBuffer, mimetype);
  } catch (sttErr) {
    // Ley 29733: still delete audio even on STT failure
    finalizeAudioDeletion(audioBuffer, audit, 'voice-pipeline', 'voice-pipeline');
    throw new Error(`STT fatal: both HPC ASR and Whisper failed — no transcription possible. Cause: ${sttErr instanceof Error ? sttErr.message : String(sttErr)}`);
  } finally {
    // Ley 29733: zero audio buffer immediately after transcription — voice is biometric data
    finalizeAudioDeletion(audioBuffer, audit, 'voice-pipeline', 'voice-pipeline');
  }
  const sttMs = Date.now() - sttStart;

  if (!transcription.trim()) {
    throw new Error('Empty transcription — no speech detected');
  }

  logger.debug({ sttMs, transcriptionLength: transcription.length }, 'Voice STT complete');

  // 2. NLU — LLM-backed extraction with regex pre-filter + validation
  const nluStart = Date.now();
  const transaction = await extractTransactionWithAgent(transcription);
  const nluMs = Date.now() - nluStart;

  if (transaction) {
    logger.info(
      {
        nluMs,
        type: transaction.type,
        amount: transaction.amount?.value,
        currency: transaction.amount?.currency,
        category: transaction.category,
        vendor: transaction.vendor,
        confidence: transaction.confidence,
        fields: transaction.extractedFields,
      },
      'Voice NLU extraction complete',
    );
  }

  // 3. LLM
  const llmStart = Date.now();
  const response = await generateResponse(transcription);
  const llmMs = Date.now() - llmStart;

  logger.debug({ llmMs, responseLength: response.length }, 'Voice LLM complete');

  // 4. TTS — non-fatal: if TTS fails, return text-only result
  const ttsStart = Date.now();
  let responseAudio: Buffer;
  let ttsAvailable = true;
  try {
    responseAudio = await synthesizeSpeech(response);
  } catch (ttsErr) {
    logger.warn({ err: ttsErr }, 'TTS failed — returning text-only result (no audio)');
    responseAudio = Buffer.alloc(0);
    ttsAvailable = false;
  }
  const ttsMs = Date.now() - ttsStart;

  const totalMs = Date.now() - totalStart;

  logger.info(
    { sttMs, nluMs, llmMs, ttsMs, totalMs, ttsAvailable, inputChars: transcription.length, outputChars: response.length },
    'Voice pipeline complete',
  );

  return {
    transcription,
    transaction,
    response,
    audioBuffer: responseAudio,
    ttsAvailable,
    timings: { sttMs, nluMs, llmMs, ttsMs, totalMs },
  };
}
