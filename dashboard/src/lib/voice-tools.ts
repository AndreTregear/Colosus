/**
 * Task Engine v3
 *
 * Features:
 *   - Priority queue with cancel/reprioritize
 *   - Task dependencies (blockedBy chain)
 *   - Progress updates (intermediate SSE events)
 *   - Task templates for common SMB operations
 *   - Shared between voice mode, chat, and dashboard
 */

import { BUSINESS_TOOL_DEFS, handleBusinessTool } from './business-tools';
import { directAgent } from '@/mastra';

// ── Types ──

export interface AgentTask {
  id: string;
  description: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  agent: string;
  template?: string;
  startedAt: number;
  completedAt?: number;
  result?: string;
  error?: string;
  progress?: string; // Latest progress update
  progressHistory: string[]; // All progress updates
  notified: boolean;
  blockedBy?: string; // Task ID that must complete first
  childOf?: string; // Parent task ID (for chained tasks)
}

// ── State ──

const tasks = new Map<string, AgentTask>();
const abortControllers = new Map<string, AbortController>(); // For cancellation
const cleanupTimers = new Map<string, ReturnType<typeof setTimeout>>(); // Prevent timer leaks
let taskCounter = 0;

// ── Cleanup ──

const TASK_RETENTION_MS = 5 * 60 * 1000; // Keep completed tasks for 5 minutes
const MAX_TASKS = 1000; // Safety valve

/** Schedule removal of a terminal task after retention period */
function scheduleTaskCleanup(taskId: string): void {
  // Clear any existing timer for this task (e.g., if status changed multiple times)
  const existing = cleanupTimers.get(taskId);
  if (existing) clearTimeout(existing);

  const timer = setTimeout(() => {
    tasks.delete(taskId);
    abortControllers.delete(taskId);
    cleanupTimers.delete(taskId);
  }, TASK_RETENTION_MS);

  // Unref so the timer doesn't keep the process alive
  if (timer && typeof timer === 'object' && 'unref' in timer) timer.unref();

  cleanupTimers.set(taskId, timer);
}

/** Safety valve: evict oldest terminal tasks when Map exceeds MAX_TASKS */
function evictIfNeeded(): void {
  if (tasks.size <= MAX_TASKS) return;

  const terminal = Array.from(tasks.values())
    .filter((t) => t.status === 'completed' || t.status === 'failed' || t.status === 'cancelled')
    .sort((a, b) => (a.completedAt ?? a.startedAt) - (b.completedAt ?? b.startedAt));

  // Remove oldest terminal tasks until we're under the limit
  for (const t of terminal) {
    if (tasks.size <= MAX_TASKS) break;
    tasks.delete(t.id);
    abortControllers.delete(t.id);
    const timer = cleanupTimers.get(t.id);
    if (timer) {
      clearTimeout(timer);
      cleanupTimers.delete(t.id);
    }
  }
}

// ── Listeners (SSE) ──

export type TaskEvent =
  | { type: 'task-created'; task: AgentTask }
  | { type: 'task-progress'; taskId: string; progress: string }
  | { type: 'task-complete'; task: AgentTask }
  | { type: 'task-failed'; task: AgentTask }
  | { type: 'task-cancelled'; taskId: string }
  | { type: 'task-started'; taskId: string };

type TaskListener = (event: TaskEvent) => void;
const listeners = new Set<TaskListener>();

export function onTaskEvent(fn: TaskListener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit(event: TaskEvent) {
  for (const fn of listeners) {
    try { fn(event); } catch { /* ignore */ }
  }
}

// ── Public API ──

export function getAllTasks(): AgentTask[] {
  return Array.from(tasks.values()).sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
    if (a.status === 'running' && b.status !== 'running') return -1;
    if (b.status === 'running' && a.status !== 'running') return 1;
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (b.status === 'pending' && a.status !== 'pending') return 1;
    const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (pDiff !== 0) return pDiff;
    return b.startedAt - a.startedAt;
  });
}

export function getTask(id: string): AgentTask | undefined {
  return tasks.get(id);
}

export function getUnnotifiedTasks(): AgentTask[] {
  return Array.from(tasks.values()).filter(
    (t) => (t.status === 'completed' || t.status === 'failed') && !t.notified,
  );
}

export function markNotified(taskId: string): void {
  const t = tasks.get(taskId);
  if (t) t.notified = true;
}

export function cancelTask(taskId: string): boolean {
  const t = tasks.get(taskId);
  if (!t || t.status === 'completed' || t.status === 'failed' || t.status === 'cancelled') {
    return false;
  }
  t.status = 'cancelled';
  t.completedAt = Date.now();
  const ac = abortControllers.get(taskId);
  if (ac) {
    ac.abort();
    abortControllers.delete(taskId);
  }
  emit({ type: 'task-cancelled', taskId });
  scheduleTaskCleanup(taskId);
  return true;
}

export function reprioritize(taskId: string, priority: AgentTask['priority']): boolean {
  const t = tasks.get(taskId);
  if (!t || t.status === 'completed' || t.status === 'failed') return false;
  t.priority = priority;
  return true;
}

// ── Task Templates ──

export interface TaskTemplate {
  id: string;
  name: string;
  nameEs: string;
  description: string;
  prompt: string;
  priority: AgentTask['priority'];
  estimatedTime: string;
}

export const TASK_TEMPLATES: TaskTemplate[] = [
  {
    id: 'daily-summary',
    name: 'Daily Summary',
    nameEs: 'Resumen del día',
    description: 'Generate a summary of today\'s business activity',
    prompt: 'Genera un resumen completo de la actividad del negocio hoy: ventas, pedidos, pagos pendientes, clientes nuevos, citas completadas. Incluye recomendaciones para mañana.',
    priority: 'normal',
    estimatedTime: '30s',
  },
  {
    id: 'payment-followup',
    name: 'Payment Follow-up',
    nameEs: 'Seguimiento de pagos',
    description: 'Review and follow up on all pending payments',
    prompt: 'Revisa todos los pagos pendientes. Para cada uno, identifica cuánto tiempo lleva pendiente y sugiere una acción: enviar recordatorio, marcar como urgente, o cerrar. Lista los clientes que deben.',
    priority: 'high',
    estimatedTime: '20s',
  },
  {
    id: 'market-research',
    name: 'Market Research',
    nameEs: 'Investigación de mercado',
    description: 'Research competitors and market trends in your area',
    prompt: 'Investiga el mercado local para mi tipo de negocio. Busca tendencias, precios de la competencia, y oportunidades. Enfócate en el mercado peruano / latinoamericano.',
    priority: 'normal',
    estimatedTime: '60s',
  },
  {
    id: 'customer-analysis',
    name: 'Customer Analysis',
    nameEs: 'Análisis de clientes',
    description: 'Analyze customer patterns and top clients',
    prompt: 'Analiza los patrones de clientes: quiénes compran más, frecuencia de compra, productos favoritos, clientes que no han comprado recientemente. Sugiere estrategias de retención.',
    priority: 'normal',
    estimatedTime: '30s',
  },
  {
    id: 'weekly-report',
    name: 'Weekly Report',
    nameEs: 'Reporte semanal',
    description: 'Generate a comprehensive weekly business report',
    prompt: 'Genera un reporte semanal completo: ingresos totales, comparación con semana anterior, top clientes, productos más vendidos, pagos cobrados vs pendientes, citas realizadas. Formato ejecutivo.',
    priority: 'normal',
    estimatedTime: '45s',
  },
];

// ── Voice Conversation Context ──

let _voiceContext = '';

export function setVoiceContext(history: Array<{ role: string; content: string }>): void {
  if (history.length === 0) { _voiceContext = ''; return; }
  _voiceContext = history
    .slice(-6)
    .map((m) => `${m.role === 'user' ? 'Usuario' : 'Agente'}: ${m.content}`)
    .join('\n');
}

// ── Tool Definitions (for LLM function calling) ──

export const VOICE_TOOLS = [
  ...BUSINESS_TOOL_DEFS,
  {
    type: 'function' as const,
    function: {
      name: 'assign_task',
      description:
        'Assign a complex task to the background agent. Use ONLY for research, analysis, multi-step work, web search. Results delivered automatically.',
      parameters: {
        type: 'object',
        properties: {
          description: { type: 'string', description: 'What the agent should do' },
          priority: { type: 'string', enum: ['low', 'normal', 'high', 'urgent'] },
          template: { type: 'string', description: 'Optional template ID: daily-summary, payment-followup, market-research, customer-analysis, weekly-report' },
          after: { type: 'string', description: 'Optional task ID — this task starts only after that one completes' },
        },
        required: ['description'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'check_tasks',
      description: 'Check status of background tasks.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'cancel_task',
      description: 'Cancel a running background task.',
      parameters: {
        type: 'object',
        properties: { task_id: { type: 'string' } },
        required: ['task_id'],
      },
    },
  },
];

// ── Tool Dispatcher ──

const BUSINESS_TOOLS = new Set([
  'business_metrics', 'customer_lookup', 'send_message', 'calendar_today', 'payment_status',
]);

export async function handleToolCall(
  name: string,
  args: Record<string, unknown>,
): Promise<string> {
  if (BUSINESS_TOOLS.has(name)) return handleBusinessTool(name, args);

  switch (name) {
    case 'assign_task':
      return assignTask(
        args.description as string,
        (args.priority as AgentTask['priority']) ?? 'normal',
        args.template as string | undefined,
        args.after as string | undefined,
      );
    case 'check_tasks':
      return checkTasks();
    case 'cancel_task':
      return JSON.stringify({ cancelled: cancelTask(args.task_id as string) });
    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}

// ── Task Execution ──

function assignTask(
  description: string,
  priority: AgentTask['priority'],
  templateId?: string,
  afterTaskId?: string,
): string {
  taskCounter++;
  const id = `task-${taskCounter}`;

  // Resolve template
  const template = templateId ? TASK_TEMPLATES.find((t) => t.id === templateId) : undefined;
  const taskDesc = template ? template.prompt : description;
  const taskPriority = template?.priority ?? priority;

  const task: AgentTask = {
    id,
    description: template?.nameEs ?? description,
    priority: taskPriority,
    status: afterTaskId ? 'pending' : 'running',
    agent: 'yaya-platform',
    template: templateId,
    startedAt: Date.now(),
    notified: false,
    progressHistory: [],
    blockedBy: afterTaskId,
  };

  tasks.set(id, task);
  evictIfNeeded();
  emit({ type: 'task-created', task });

  if (afterTaskId) {
    // Dependency — wait for parent to complete
    const unsub = onTaskEvent((evt) => {
      if (
        (evt.type === 'task-complete' || evt.type === 'task-failed') &&
        'task' in evt &&
        evt.task.id === afterTaskId
      ) {
        unsub();
        if (evt.type === 'task-complete') {
          task.status = 'running';
          task.startedAt = Date.now();
          emit({ type: 'task-started', taskId: id });
          executeTask(id, taskDesc);
        } else {
          task.status = 'failed';
          task.error = `Blocked by failed task ${afterTaskId}`;
          task.completedAt = Date.now();
          emit({ type: 'task-failed', task });
          scheduleTaskCleanup(id);
        }
      }
    });
  } else {
    executeTask(id, taskDesc);
  }

  return JSON.stringify({
    task_id: id,
    status: task.status,
    message: afterTaskId
      ? `Tarea "${task.description.slice(0, 50)}" en cola — esperando tarea ${afterTaskId}.`
      : `Tarea "${task.description.slice(0, 50)}" asignada. Te aviso cuando termine.`,
  });
}

function executeTask(taskId: string, prompt: string): void {
  const task = tasks.get(taskId);
  if (!task) return;

  const ac = new AbortController();
  abortControllers.set(taskId, ac);

  const contextBlock = _voiceContext
    ? `[Contexto de conversación]\n${_voiceContext}\n\n[Tarea]\n${prompt}`
    : prompt;

  // Emit progress
  task.progress = 'Procesando...';
  task.progressHistory.push('Procesando...');
  emit({ type: 'task-progress', taskId, progress: 'Procesando...' });

  // Run Mastra agent — no process spawn, just an async function call
  (async () => {
    try {
      const result = await directAgent.generate(contextBlock, {
        maxSteps: 8,
        abortSignal: ac.signal,
        onStepFinish: (step: any) => {
          // Emit progress on each tool call
          if (step.toolCalls?.length > 0) {
            const toolNames = step.toolCalls.map((tc: any) => tc.toolName).join(', ');
            const progress = `Usando: ${toolNames}`;
            task.progress = progress;
            task.progressHistory.push(progress);
            emit({ type: 'task-progress', taskId, progress });
          }
        },
      });

      abortControllers.delete(taskId);
      if (task.status === 'cancelled') return;

      task.completedAt = Date.now();
      task.result = result.text || 'Tarea completada.';
      task.status = 'completed';
      emit({ type: 'task-complete', task });
      scheduleTaskCleanup(taskId);
      evictIfNeeded();
    } catch (err) {
      abortControllers.delete(taskId);
      if (task.status === 'cancelled') return;

      task.completedAt = Date.now();
      task.status = 'failed';
      task.error = err instanceof Error ? err.message : String(err);
      emit({ type: 'task-failed', task });
      scheduleTaskCleanup(taskId);
      evictIfNeeded();
    }
  })();
}

function checkTasks(): string {
  const all = getAllTasks().slice(0, 15).map((t) => ({
    id: t.id,
    description: t.description.slice(0, 80),
    status: t.status,
    priority: t.priority,
    progress: t.progress,
    elapsed: t.completedAt
      ? `${((t.completedAt - t.startedAt) / 1000).toFixed(1)}s`
      : `${((Date.now() - t.startedAt) / 1000).toFixed(0)}s`,
    hasResult: !!t.result,
    blockedBy: t.blockedBy,
  }));

  if (all.length === 0) return JSON.stringify({ message: 'No hay tareas asignadas.' });
  return JSON.stringify({ tasks: all });
}

// ── Public: Create task from dashboard/API (not voice) ──

export function createTaskFromAPI(opts: {
  description: string;
  priority?: AgentTask['priority'];
  template?: string;
  after?: string;
}): AgentTask {
  const result = assignTask(
    opts.description,
    opts.priority ?? 'normal',
    opts.template,
    opts.after,
  );
  const parsed = JSON.parse(result);
  return tasks.get(parsed.task_id)!;
}
