/**
 * Voice Mode API
 *
 * POST /api/voice
 *   FormData: audio, text, history
 *   Returns: { transcription, response, audio, toolCalls, model, timings }
 *
 * Pipeline: Whisper turbo → Qwen 3.5 35B-A3B (tool calling) → Kokoro TTS
 */

import { NextRequest } from 'next/server';
import {
  VOICE_TOOLS, handleToolCall, setVoiceContext, getAllTasks,
} from '@/lib/voice-tools';
import { MODELS } from '@/lib/models';
import { sanitizeForTTS } from '@/lib/tts-sanitize';
import { withActiveSubscription } from '@/lib/billing/entitlement';

export const dynamic = 'force-dynamic';

// Voice infra per INFRA.md (`:8001` Speaches, `:8002` Kokoro, both bearer-protected).
// Override via YAYA_ASR_* / YAYA_TTS_*; legacy WHISPER_BASE_URL / TTS_BASE_URL still honored.
const _ASR_BASE = (process.env.YAYA_ASR_URL || process.env.WHISPER_BASE_URL || 'http://localhost:8001').replace(/\/+$/, '');
const _TTS_BASE = (process.env.YAYA_TTS_URL || process.env.TTS_BASE_URL || 'http://localhost:8002').replace(/\/+$/, '');
const WHISPER_URL = _ASR_BASE.endsWith('/v1') ? `${_ASR_BASE}/audio/transcriptions` : `${_ASR_BASE}/v1/audio/transcriptions`;
const WHISPER_KEY = process.env.YAYA_ASR_KEY || process.env.WHISPER_API_KEY || 'welcometothepresent';
const WHISPER_MODEL_ID = process.env.YAYA_ASR_MODEL || process.env.WHISPER_MODEL || 'deepdml/faster-whisper-large-v3-turbo-ct2';

const TTS_URL = `${_TTS_BASE}/v1/audio/speech`;
const TTS_KEY = process.env.YAYA_TTS_KEY || process.env.TTS_API_KEY || 'welcometothepresent';

function buildSystemPrompt(): string {
  const tasks = getAllTasks();
  const completed = tasks.filter((t) => t.status === 'completed' && t.result);
  const running = tasks.filter((t) => t.status === 'running');

  let taskContext = '';
  if (completed.length > 0) {
    taskContext += '\n\n[Resultados de tareas completadas]\n';
    for (const t of completed.slice(-5)) {
      taskContext += `\n• "${t.description.slice(0, 60)}": ${t.result!.slice(0, 500)}\n`;
    }
  }
  if (running.length > 0) {
    taskContext += `\n[En proceso: ${running.map((t) => t.description.slice(0, 40)).join(', ')}]\n`;
  }

  return `Asistente de voz del CEO. Respuestas cortas en español, 1-2 oraciones. Usa herramientas para datos de negocio. No inventes números. Sin markdown. /no_think${taskContext}`;
}

interface ConversationMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string | null;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: { name: string; arguments: string };
  }>;
  tool_call_id?: string;
}

async function postImpl(req: NextRequest) {
  const totalStart = Date.now();

  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File | null;
    const historyJson = formData.get('history') as string | null;
    const textInput = formData.get('text') as string | null;

    let transcription = textInput ?? '';
    let sttMs = 0;

    // Step 1: STT
    if (audioFile && !textInput) {
      const sttStart = Date.now();
      const sttForm = new FormData();
      sttForm.append('file', audioFile, 'voice.wav');
      sttForm.append('model', WHISPER_MODEL_ID);
      sttForm.append('language', 'es');

      const sttRes = await fetch(WHISPER_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${WHISPER_KEY}` },
        body: sttForm,
      });

      if (!sttRes.ok) {
        return Response.json({ error: `STT failed: ${sttRes.status}` }, { status: 500 });
      }

      const sttData = (await sttRes.json()) as { text: string };
      transcription = sttData.text.trim();
      sttMs = Date.now() - sttStart;
    }

    if (!transcription) {
      return Response.json({ error: 'No speech detected' }, { status: 400 });
    }

    // Parse history + set voice context for Hermes tasks
    const history: ConversationMessage[] = historyJson ? JSON.parse(historyJson) : [];
    setVoiceContext(
      history
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role, content: m.content ?? '' })),
    );

    // Step 2: LLM with tool calling
    const llmStart = Date.now();
    const model = MODELS.find((m) => m.tag === 'local') ?? MODELS[0];

    const messages: ConversationMessage[] = [
      { role: 'system', content: buildSystemPrompt() },
      ...history.slice(-8),
      { role: 'user', content: transcription },
    ];

    let response = '';
    const toolCallsExecuted: Array<{ name: string; args: Record<string, unknown>; result: string }> = [];

    for (let i = 0; i < 3; i++) {
      const llmRes = await fetch(`${model.apiBase}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${model.apiKey}`,
        },
        body: JSON.stringify({
          model: model.model,
          messages,
          tools: VOICE_TOOLS,
          tool_choice: 'auto',
          max_tokens: 300,
          temperature: 0.3,
          stream: false,
          chat_template_kwargs: { enable_thinking: false },
        }),
      });

      if (!llmRes.ok) {
        return Response.json({ error: `LLM failed: ${llmRes.status}` }, { status: 500 });
      }

      const llmData = (await llmRes.json()) as {
        choices: Array<{
          message: {
            content: string | null;
            tool_calls?: Array<{ id: string; type: 'function'; function: { name: string; arguments: string } }>;
          };
        }>;
      };

      const choice = llmData.choices[0];

      if (choice.message.tool_calls?.length) {
        messages.push({
          role: 'assistant',
          content: choice.message.content,
          tool_calls: choice.message.tool_calls,
        });

        for (const tc of choice.message.tool_calls) {
          const args = JSON.parse(tc.function.arguments);
          const result = await handleToolCall(tc.function.name, args);
          toolCallsExecuted.push({ name: tc.function.name, args, result });
          messages.push({ role: 'tool', tool_call_id: tc.id, content: result });
        }
      } else {
        response = choice.message.content?.trim() ?? '';
        break;
      }
    }

    const llmMs = Date.now() - llmStart;
    if (!response) response = 'Entendido, estoy procesando tu solicitud.';

    // Step 3: TTS
    const ttsStart = Date.now();
    let audioBase64 = '';
    try {
      const ttsRes = await fetch(TTS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TTS_KEY}`,
        },
        body: JSON.stringify({
          model: 'kokoro',
          input: sanitizeForTTS(response).slice(0, 500),
          voice: 'ef_dora',
          lang_code: 'e',
          response_format: 'mp3',
        }),
      });
      if (ttsRes.ok) {
        audioBase64 = Buffer.from(await ttsRes.arrayBuffer()).toString('base64');
      }
    } catch { /* text-only */ }
    const ttsMs = Date.now() - ttsStart;

    return Response.json({
      transcription,
      response,
      audio: audioBase64,
      toolCalls: toolCallsExecuted,
      model: model.model,
      timings: { sttMs, llmMs, ttsMs, totalMs: Date.now() - totalStart },
    });
  } catch (error) {
    return Response.json({ error: `Voice error: ${error}` }, { status: 500 });
  }
}

export const POST = withActiveSubscription(postImpl);
