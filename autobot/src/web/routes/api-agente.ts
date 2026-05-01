/**
 * agente.ceo API routes — integrated into autobot Express server.
 *
 * POST /api/agente/chat    — Mastra directAgent streaming (SSE)
 * POST /api/agente/voice   — Voice pipeline (STT -> LLM -> TTS)
 * GET  /api/agente/tasks   — List tasks / get single task / list templates
 * POST /api/agente/tasks   — Create / cancel / reprioritize tasks
 * GET  /api/agente/events  — SSE task lifecycle events
 */

import { Router, type Request, type Response } from 'express';
import { directAgent, setTenantId } from '../../ai/agents.js';
import {
  getAllTasks,
  getTask,
  createTaskFromAPI,
  cancelTask,
  reprioritize,
  onTaskEvent,
  markNotified,
  setVoiceContext,
  formatTask,
  TASK_TEMPLATES,
  type TaskEvent,
  type AgentTask,
} from '../../ai/task-engine.js';
import { logger } from '../../shared/logger.js';
import { prepareAudioAudit, finalizeAudioDeletion } from '../../voice/audio-compliance.js';

const router = Router();

// Health check
router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'agente' });
});

// ── Helpers ──

/** Sanitize text for TTS — strip markdown, emoji, excessive formatting. */
function sanitizeForTTS(text: string): string {
  return text
    .replace(/\*{1,3}(.*?)\*{1,3}/g, '$1')
    .replace(/_{1,2}(.*?)_{1,2}/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^[\s]*[-*+]\s+/gm, '')
    .replace(/^[\s]*\d+\.\s+(?=[A-Za-z])/gm, '')
    .replace(/^[-*_]{3,}$/gm, '')
    .replace(/^>\s+/gm, '')
    .replace(/<[^>]+>/g, '')
    .replace(/[*_~`#|\\[\]{}<>]/g, '')
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}]/gu, '')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

const WHISPER_URL = process.env.WHISPER_BASE_URL
  ? `${process.env.WHISPER_BASE_URL}/audio/transcriptions`
  : 'http://localhost:9300/v1/audio/transcriptions';
const WHISPER_KEY = process.env.WHISPER_API_KEY ?? '';

const TTS_URL = process.env.TTS_BASE_URL
  ? `${process.env.TTS_BASE_URL}/v1/audio/speech`
  : 'http://localhost:9400/v1/audio/speech';

const VLLM_API_BASE = process.env.VLLM_API_BASE || 'http://localhost:8000/v1';
const VLLM_API_KEY = process.env.VLLM_API_KEY || 'omnimoney';
const VLLM_MODEL = process.env.VLLM_MODEL || 'qwen3.5-35b-a3b';

// ── POST /chat — Streaming chat via Mastra directAgent ──

router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'messages array is required' });
      return;
    }
    if (messages.length > 50) {
      res.status(400).json({ error: 'Too many messages (max 50)' });
      return;
    }

    // Ensure tenant context is set
    const tenantId = (req as any).tenantId || process.env.DEFAULT_TENANT_ID || '';
    if (tenantId) setTenantId(tenantId);

    // Extract last user message
    const lastUserMsg = [...messages].reverse().find((m: { role: string }) => m.role === 'user');
    if (!lastUserMsg) {
      res.status(400).json({ error: 'No user message found' });
      return;
    }

    // Build context from recent history
    const history = messages.slice(0, -1);
    const context = history
      .filter((m: { role: string }) => m.role === 'user' || m.role === 'assistant')
      .slice(-6)
      .map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content.slice(0, 500),
      }));

    // Stream from directAgent
    const result = await directAgent.stream(lastUserMsg.content, {
      maxSteps: 4,
      context,
    });

    // Write SSE to Express response
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    try {
      for await (const chunk of result.textStream) {
        const sseData = JSON.stringify({
          id: `chat-${Date.now()}`,
          object: 'chat.completion.chunk',
          model: 'mastra-direct',
          choices: [{ index: 0, delta: { content: chunk }, finish_reason: null }],
        });
        res.write(`data: ${sseData}\n\n`);
      }
    } catch (err) {
      const errorChunk = JSON.stringify({
        id: `err-${Date.now()}`,
        object: 'chat.completion.chunk',
        choices: [{ index: 0, delta: { content: `Error: ${err instanceof Error ? err.message : err}` }, finish_reason: null }],
      });
      res.write(`data: ${errorChunk}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    logger.error({ err: error }, 'agente chat error');
    if (!res.headersSent) {
      res.status(500).json({ error: 'Chat processing failed' });
    }
  }
});

// ── POST /voice — STT -> LLM (tool calling) -> TTS pipeline ──

router.post('/voice', async (req: Request, res: Response) => {
  const totalStart = Date.now();

  try {
    // Support both JSON and multipart/form-data
    // For multipart, use express-fileupload or multer middleware externally.
    // Here we handle JSON body with base64 audio and text input.
    const { audio, text, history: historyJson } = req.body;

    let transcription = text ?? '';
    let sttMs = 0;

    // Step 1: STT (if audio provided as base64, no text)
    if (audio && !text) {
      const sttStart = Date.now();
      const audioBuffer = Buffer.from(audio, 'base64');
      const audit = prepareAudioAudit(audioBuffer, 'audio/wav');

      try {
        const blob = new Blob([audioBuffer], { type: 'audio/wav' });

        const sttForm = new FormData();
        sttForm.append('file', blob, 'voice.wav');
        sttForm.append('model', 'large-v3-turbo');
        sttForm.append('language', 'es');

        const sttRes = await fetch(WHISPER_URL, {
          method: 'POST',
          headers: WHISPER_KEY ? { Authorization: `Bearer ${WHISPER_KEY}` } : {},
          body: sttForm,
        });

        if (!sttRes.ok) {
          res.status(500).json({ error: `STT failed: ${sttRes.status}` });
          return;
        }

        const sttData = (await sttRes.json()) as { text: string };
        transcription = sttData.text.trim();
        sttMs = Date.now() - sttStart;
      } finally {
        // Ley 29733: zero audio buffer immediately after transcription
        const tenantId = (req as any).tenantId || 'agente';
        finalizeAudioDeletion(audioBuffer, audit, tenantId, 'api-agente-voice');
      }
    }

    if (!transcription) {
      res.status(400).json({ error: 'No speech detected' });
      return;
    }

    // Set tenant context
    const tenantId = (req as any).tenantId || process.env.DEFAULT_TENANT_ID || '';
    if (tenantId) setTenantId(tenantId);

    // Parse history + set voice context for tasks
    let history: Array<{ role: string; content: string | null; tool_calls?: any[]; tool_call_id?: string }> = [];
    try {
      const parsed = historyJson
        ? (typeof historyJson === 'string' ? JSON.parse(historyJson) : historyJson)
        : [];
      if (Array.isArray(parsed)) {
        // Sanitize: only keep valid message objects, limit to 20 entries
        history = parsed.slice(0, 20).filter(
          (m: any) => m && typeof m === 'object' && typeof m.role === 'string'
        );
      }
    } catch {
      // Invalid history JSON — proceed with empty history
    }

    setVoiceContext(
      history
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role, content: m.content ?? '' })),
    );

    // Step 2: LLM with tool calling (raw vLLM for voice — lower latency than Mastra streaming)
    const llmStart = Date.now();

    // Build task context for system prompt
    const allTasks = getAllTasks();
    const completed = allTasks.filter((t) => t.status === 'completed' && t.result);
    const running = allTasks.filter((t) => t.status === 'running');

    let taskContext = '';
    if (completed.length > 0) {
      taskContext += '\n\n[Resultados de tareas completadas]\n';
      for (const t of completed.slice(-5)) {
        taskContext += `\n* "${t.description.slice(0, 60)}": ${t.result!.slice(0, 500)}\n`;
      }
    }
    if (running.length > 0) {
      taskContext += `\n[En proceso: ${running.map((t) => t.description.slice(0, 40)).join(', ')}]\n`;
    }

    const systemPrompt = `Asistente de voz del CEO. Respuestas cortas en espanol, 1-2 oraciones. Usa herramientas para datos de negocio. No inventes numeros. Sin markdown. /no_think${taskContext}`;

    // Use Mastra directAgent for tool-calling LLM (handles tool loop automatically)
    const result = await directAgent.generate(transcription, {
      maxSteps: 3,
      instructions: systemPrompt,
      context: history
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(-8)
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: (m.content ?? '').slice(0, 500) })),
    });

    let response = result.text || 'Entendido, estoy procesando tu solicitud.';
    const llmMs = Date.now() - llmStart;

    // Collect tool calls info from steps
    const toolCallsExecuted: Array<{ name: string; args: Record<string, unknown> }> = [];
    if (result.steps) {
      for (const step of result.steps) {
        if ((step as any).toolCalls) {
          for (const tc of (step as any).toolCalls) {
            toolCallsExecuted.push({ name: tc.toolName, args: tc.args });
          }
        }
      }
    }

    // Step 3: TTS
    const ttsStart = Date.now();
    let audioBase64 = '';
    try {
      const ttsRes = await fetch(TTS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    } catch { /* text-only fallback */ }
    const ttsMs = Date.now() - ttsStart;

    res.json({
      transcription,
      response,
      audio: audioBase64,
      toolCalls: toolCallsExecuted,
      model: VLLM_MODEL,
      timings: { sttMs, llmMs, ttsMs, totalMs: Date.now() - totalStart },
    });
  } catch (error) {
    logger.error({ err: error }, 'agente voice error');
    res.status(500).json({ error: 'Voice processing failed' });
  }
});

// ── GET /tasks — List tasks, get single task, or list templates ──

router.get('/tasks', (req: Request, res: Response) => {
  const action = req.query.action as string | undefined;

  if (action === 'templates') {
    res.json({ templates: TASK_TEMPLATES });
    return;
  }

  const taskId = req.query.id as string | undefined;
  if (taskId) {
    const task = getTask(taskId);
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    res.json({ task: formatTask(task) });
    return;
  }

  const statusFilter = req.query.status as string | undefined;
  let taskList = getAllTasks();
  if (statusFilter) {
    taskList = taskList.filter((t) => t.status === statusFilter);
  }

  res.json({
    tasks: taskList.map(formatTask),
    summary: {
      total: taskList.length,
      running: taskList.filter((t) => t.status === 'running').length,
      pending: taskList.filter((t) => t.status === 'pending').length,
      completed: taskList.filter((t) => t.status === 'completed').length,
      failed: taskList.filter((t) => t.status === 'failed').length,
    },
  });
});

// ── POST /tasks — Create, cancel, or reprioritize tasks ──

router.post('/tasks', (req: Request, res: Response) => {
  const { action } = req.body;

  // Ensure tenant context
  const tenantId = (req as any).tenantId || process.env.DEFAULT_TENANT_ID || '';
  if (tenantId) setTenantId(tenantId);

  switch (action) {
    case 'create': {
      const task = createTaskFromAPI({
        description: req.body.description,
        priority: req.body.priority,
        template: req.body.template,
        after: req.body.after,
      });
      res.status(201).json({ task: formatTask(task) });
      return;
    }

    case 'cancel': {
      const ok = cancelTask(req.body.taskId);
      if (!ok) {
        res.status(400).json({ error: 'Cannot cancel this task' });
        return;
      }
      res.json({ cancelled: true, taskId: req.body.taskId });
      return;
    }

    case 'reprioritize': {
      const ok = reprioritize(req.body.taskId, req.body.priority);
      if (!ok) {
        res.status(400).json({ error: 'Cannot reprioritize this task' });
        return;
      }
      res.json({ reprioritized: true, taskId: req.body.taskId, priority: req.body.priority });
      return;
    }

    default: {
      // Default: create task (backwards compatible)
      if (req.body.description) {
        const task = createTaskFromAPI({
          description: req.body.description,
          priority: req.body.priority,
          template: req.body.template,
          after: req.body.after,
        });
        res.status(201).json({ task: formatTask(task) });
        return;
      }
      res.status(400).json({ error: 'Missing action or description' });
    }
  }
});

// ── GET /events — SSE stream of task lifecycle events ──

router.get('/events', (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  // Keepalive
  const keepalive = setInterval(() => {
    try { res.write(': keepalive\n\n'); } catch { clearInterval(keepalive); }
  }, 15000);

  const unsubscribe = onTaskEvent(async (event: TaskEvent) => {
    try {
      switch (event.type) {
        case 'task-created':
        case 'task-started':
        case 'task-cancelled':
        case 'task-progress': {
          res.write(`data: ${JSON.stringify(event)}\n\n`);
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
          res.write(`data: ${data}\n\n`);
          break;
        }
      }
    } catch {
      // Emit raw event on failure
      try { res.write(`data: ${JSON.stringify(event)}\n\n`); } catch { /* connection closed */ }
    }
  });

  // Cleanup on connection close
  req.on('close', () => {
    clearInterval(keepalive);
    unsubscribe();
  });
});

// ── Helper: Summarize completed task + generate TTS audio ──

async function summarizeAndSpeak(
  task: AgentTask,
): Promise<{ summary: string; audio: string }> {
  const resultText = task.status === 'failed'
    ? `Tarea fallo: ${task.error}`
    : task.result ?? 'Sin resultado';

  // Use vLLM directly for summarization (fast, no Mastra overhead)
  let summary = 'Tarea completada.';
  try {
    const llmRes = await fetch(`${VLLM_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${VLLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: VLLM_MODEL,
        messages: [
          {
            role: 'system',
            content: 'Resume el resultado en 1-2 oraciones cortas en espanol para leer en voz alta. Empieza con "Listo," o "Termine de". /no_think',
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

    if (llmRes.ok) {
      const data = (await llmRes.json()) as { choices: Array<{ message: { content: string } }> };
      summary = data.choices[0]?.message?.content?.trim() ?? summary;
    }
  } catch (err) {
    logger.warn({ err }, 'Task summary generation failed');
  }

  // TTS
  let audioBase64 = '';
  try {
    const ttsRes = await fetch(TTS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
  } catch { /* TTS failed — text-only */ }

  return { summary, audio: audioBase64 };
}

export { router as agenteRouter };
