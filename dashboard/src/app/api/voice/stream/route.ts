/**
 * Streaming Voice API — overlaps LLM and TTS for minimum latency.
 *
 * POST /api/voice/stream
 *   FormData: audio, text, history, model
 *   Returns: SSE stream of events:
 *     { type: 'stt', text }                    — transcription complete
 *     { type: 'chunk', text, audio }           — sentence + audio chunk
 *     { type: 'tool', name, args }             — tool call executed
 *     { type: 'done', timings }                — pipeline complete
 */

import { NextRequest } from 'next/server';
import { VOICE_TOOLS, handleToolCall, setVoiceContext, getAllTasks } from '@/lib/voice-tools';
import { MODELS } from '@/lib/models';
import { sanitizeForTTS } from '@/lib/tts-sanitize';
import { withActiveSubscription } from '@/lib/billing/entitlement';

export const dynamic = 'force-dynamic';

// Voice infra per INFRA.md (`:8001` Speaches, `:8002` Kokoro, both bearer-protected).
// Override via YAYA_ASR_* / YAYA_TTS_* (legacy WHISPER_BASE_URL / TTS_BASE_URL still honored).
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

  let ctx = '';
  if (completed.length > 0) {
    ctx += '\n\n[Resultados de tareas completadas]\n';
    for (const t of completed.slice(-5)) {
      ctx += `• "${t.description.slice(0, 60)}": ${t.result!.slice(0, 400)}\n`;
    }
  }
  if (running.length > 0) {
    ctx += `\n[En proceso: ${running.map((t) => t.description.slice(0, 40)).join(', ')}]\n`;
  }

  return `Asistente de voz del CEO. Respuestas cortas en español, 1-2 oraciones. Usa herramientas para datos de negocio. No inventes números. Sin markdown. /no_think${ctx}`;
}

async function postImpl(req: NextRequest) {
  const totalStart = Date.now();
  const encoder = new TextEncoder();

  const formData = await req.formData();
  const audioFile = formData.get('audio') as File | null;
  const textInput = formData.get('text') as string | null;
  const historyJson = formData.get('history') as string | null;

  const history = historyJson ? JSON.parse(historyJson) : [];
  setVoiceContext(
    history
      .filter((m: any) => m.role === 'user' || m.role === 'assistant')
      .map((m: any) => ({ role: m.role, content: m.content ?? '' })),
  );

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // Step 1: STT
        let transcription = textInput ?? '';
        let sttMs = 0;

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

          if (sttRes.ok) {
            const d = (await sttRes.json()) as { text: string };
            transcription = d.text.trim();
          }
          sttMs = Date.now() - sttStart;
        }

        if (!transcription) {
          send({ type: 'error', message: 'No speech detected' });
          controller.close();
          return;
        }

        send({ type: 'stt', text: transcription, sttMs });

        // Step 2: LLM streaming with tool calling
        const model = MODELS.find((m) => m.tag === 'local') ?? MODELS[0];
        const llmStart = Date.now();

        const messages: any[] = [
          { role: 'system', content: buildSystemPrompt() },
          ...history.slice(-8),
          { role: 'user', content: transcription },
        ];

        // First pass: check for tool calls (non-streaming)
        const firstRes = await fetch(`${model.apiBase}/chat/completions`, {
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
            max_tokens: 200,
            temperature: 0.3,
            stream: false,
            chat_template_kwargs: { enable_thinking: false },
          }),
        });

        if (!firstRes.ok) {
          send({ type: 'error', message: `LLM failed: ${firstRes.status}` });
          controller.close();
          return;
        }

        const firstData = (await firstRes.json()) as any;
        const firstChoice = firstData.choices[0];

        // Handle tool calls
        if (firstChoice.message.tool_calls?.length) {
          messages.push({
            role: 'assistant',
            content: firstChoice.message.content,
            tool_calls: firstChoice.message.tool_calls,
          });

          for (const tc of firstChoice.message.tool_calls) {
            const args = JSON.parse(tc.function.arguments);
            const result = await handleToolCall(tc.function.name, args);
            send({ type: 'tool', name: tc.function.name, args });
            messages.push({ role: 'tool', tool_call_id: tc.id, content: result });
          }

          // Get final response after tool calls
          const finalRes = await fetch(`${model.apiBase}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${model.apiKey}`,
            },
            body: JSON.stringify({
              model: model.model,
              messages,
              max_tokens: 150,
              temperature: 0.3,
              stream: false,
              chat_template_kwargs: { enable_thinking: false },
            }),
          });

          if (finalRes.ok) {
            const finalData = (await finalRes.json()) as any;
            const text = finalData.choices[0]?.message?.content?.trim() ?? '';
            const llmMs = Date.now() - llmStart;

            // TTS the response
            const ttsStart = Date.now();
            const audio = await synthesize(text);
            const ttsMs = Date.now() - ttsStart;

            send({ type: 'chunk', text, audio, final: true });
            send({ type: 'done', timings: { sttMs, llmMs, ttsMs, totalMs: Date.now() - totalStart } });
          }
        } else {
          // No tool calls — stream the response and TTS sentence by sentence
          const fullText = firstChoice.message.content?.trim() ?? '';
          const llmMs = Date.now() - llmStart;

          // Split into sentences and TTS each
          const sentences = splitSentences(fullText);

          let ttsMs = 0;
          for (let i = 0; i < sentences.length; i++) {
            const s = sentences[i];
            const ttsStart = Date.now();
            const audio = await synthesize(s);
            ttsMs += Date.now() - ttsStart;
            send({ type: 'chunk', text: s, audio, final: i === sentences.length - 1 });
          }

          send({ type: 'done', timings: { sttMs, llmMs, ttsMs, totalMs: Date.now() - totalStart } });
        }
      } catch (err) {
        send({ type: 'error', message: String(err) });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

function splitSentences(text: string): string[] {
  // Split on sentence boundaries but keep short texts whole
  if (text.length < 80) return [text];
  const parts = text.match(/[^.!?]+[.!?]+/g) ?? [text];
  return parts.map((s) => s.trim()).filter(Boolean);
}

async function synthesize(text: string): Promise<string> {
  if (!text) return '';
  try {
    const res = await fetch(TTS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TTS_KEY}`,
      },
      body: JSON.stringify({
        model: 'kokoro',
        input: sanitizeForTTS(text).slice(0, 300),
        voice: 'ef_dora',
        lang_code: 'e',
        response_format: 'mp3',
      }),
    });
    if (res.ok) {
      return Buffer.from(await res.arrayBuffer()).toString('base64');
    }
  } catch { /* TTS failed */ }
  return '';
}

export const POST = withActiveSubscription(postImpl);
