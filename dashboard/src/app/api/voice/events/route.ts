/**
 * Task Events SSE — pushes task lifecycle events to all connected clients.
 *
 * Events:
 *   task-created   — new task assigned
 *   task-started   — pending task began execution
 *   task-progress  — intermediate update
 *   task-complete  — finished with result (includes TTS audio)
 *   task-failed    — failed with error
 *   task-cancelled — user cancelled
 */

import { NextRequest } from 'next/server';
import { onTaskEvent, markNotified, type TaskEvent, type AgentTask } from '@/lib/voice-tools';
import { MODELS } from '@/lib/models';
import { sanitizeForTTS } from '@/lib/tts-sanitize';
import { withActiveSubscription } from '@/lib/billing/entitlement';

// Kokoro TTS per INFRA.md (`:8002`, bearer `welcometothepresent`).
const _TTS_BASE = (process.env.YAYA_TTS_URL || process.env.TTS_BASE_URL || 'http://localhost:8002').replace(/\/+$/, '');
const TTS_URL = `${_TTS_BASE}/v1/audio/speech`;
const TTS_KEY = process.env.YAYA_TTS_KEY || process.env.TTS_API_KEY || 'welcometothepresent';

export const dynamic = 'force-dynamic';

async function getImpl(_req: NextRequest) {
  const encoder = new TextEncoder();

  // Hoist cleanup so both start() and cancel() can access it
  let cleanup: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;

      const keepalive = setInterval(() => {
        try { controller.enqueue(encoder.encode(': keepalive\n\n')); }
        catch {
          // Stream died — clean up immediately
          if (!closed) { closed = true; doCleanup(); }
        }
      }, 15000);

      const unsubscribe = onTaskEvent(async (event: TaskEvent) => {
        if (closed) return;
        try {
          switch (event.type) {
            case 'task-created':
            case 'task-started':
            case 'task-cancelled': {
              const data = JSON.stringify(event);
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
              break;
            }

            case 'task-progress': {
              const data = JSON.stringify(event);
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
              break;
            }

            case 'task-complete':
            case 'task-failed': {
              const task = event.task;
              const { summary, audio } = await summarizeAndSpeak(task);
              markNotified(task.id);

              const data = JSON.stringify({
                type: event.type,
                taskId: task.id,
                description: task.description.slice(0, 100),
                priority: task.priority,
                text: summary,
                result: task.result?.slice(0, 2000),
                error: task.error,
                audio,
                elapsed: task.completedAt
                  ? `${((task.completedAt - task.startedAt) / 1000).toFixed(1)}s`
                  : 'unknown',
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
              break;
            }
          }
        } catch {
          // Stream write failed — client disconnected
          if (!closed) { closed = true; doCleanup(); }
        }
      });

      function doCleanup() {
        clearInterval(keepalive);
        unsubscribe();
      }

      cleanup = () => {
        if (!closed) { closed = true; doCleanup(); }
      };
    },
    cancel() {
      cleanup?.();
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

async function summarizeAndSpeak(
  task: AgentTask,
): Promise<{ summary: string; audio: string }> {
  const model = MODELS.find((m) => m.tag === 'local') ?? MODELS[0];

  const resultText = task.status === 'failed'
    ? `Tarea falló: ${task.error}`
    : task.result ?? 'Sin resultado';

  const res = await fetch(`${model.apiBase}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${model.apiKey}`,
    },
    body: JSON.stringify({
      model: model.model,
      messages: [
        {
          role: 'system',
          content: 'Resume el resultado en 1-2 oraciones cortas en español para leer en voz alta. Empieza con "Listo," o "Terminé de". /no_think',
        },
        {
          role: 'user',
          content: `Tarea: "${task.description}"\n\nResultado:\n${resultText.slice(0, 1500)}`,
        },
      ],
      max_tokens: 80,
      temperature: 0.5,
      stream: false,
      chat_template_kwargs: { enable_thinking: false },
    }),
  });

  let summary = 'Tarea completada.';
  if (res.ok) {
    const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
    summary = data.choices[0]?.message?.content?.trim() ?? summary;
  }

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
        input: sanitizeForTTS(summary).slice(0, 300),
        voice: 'ef_dora',
        lang_code: 'e',
        response_format: 'mp3',
      }),
    });
    if (ttsRes.ok) {
      audioBase64 = Buffer.from(await ttsRes.arrayBuffer()).toString('base64');
    }
  } catch { /* TTS failed */ }

  return { summary, audio: audioBase64 };
}

export const GET = withActiveSubscription(getImpl);
