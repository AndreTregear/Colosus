/**
 * Task Engine — background task execution with priority queue, cancellation,
 * dependencies, progress events, and SSE streaming.
 *
 * Ported from agente-ceo/src/lib/voice-tools.ts into autobot's Express world.
 * Uses the shared directAgent from ./agents.ts.
 */

import { directAgent } from './agents.js';
import { logger } from '../shared/logger.js';

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
  progress?: string;
  progressHistory: string[];
  notified: boolean;
  blockedBy?: string;
  childOf?: string;
}

// ── State ──

const tasks = new Map<string, AgentTask>();
const abortControllers = new Map<string, AbortController>();
let taskCounter = 0;

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
    try { fn(event); } catch { /* ignore listener errors */ }
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
    nameEs: 'Resumen del dia',
    description: 'Generate a summary of today\'s business activity',
    prompt: 'Genera un resumen completo de la actividad del negocio hoy: ventas, pedidos, pagos pendientes, clientes nuevos, citas completadas. Incluye recomendaciones para manana.',
    priority: 'normal',
    estimatedTime: '30s',
  },
  {
    id: 'payment-followup',
    name: 'Payment Follow-up',
    nameEs: 'Seguimiento de pagos',
    description: 'Review and follow up on all pending payments',
    prompt: 'Revisa todos los pagos pendientes. Para cada uno, identifica cuanto tiempo lleva pendiente y sugiere una accion: enviar recordatorio, marcar como urgente, o cerrar. Lista los clientes que deben.',
    priority: 'high',
    estimatedTime: '20s',
  },
  {
    id: 'market-research',
    name: 'Market Research',
    nameEs: 'Investigacion de mercado',
    description: 'Research competitors and market trends in your area',
    prompt: 'Investiga el mercado local para mi tipo de negocio. Busca tendencias, precios de la competencia, y oportunidades. Enfocate en el mercado peruano / latinoamericano.',
    priority: 'normal',
    estimatedTime: '60s',
  },
  {
    id: 'customer-analysis',
    name: 'Customer Analysis',
    nameEs: 'Analisis de clientes',
    description: 'Analyze customer patterns and top clients',
    prompt: 'Analiza los patrones de clientes: quienes compran mas, frecuencia de compra, productos favoritos, clientes que no han comprado recientemente. Sugiere estrategias de retencion.',
    priority: 'normal',
    estimatedTime: '30s',
  },
  {
    id: 'weekly-report',
    name: 'Weekly Report',
    nameEs: 'Reporte semanal',
    description: 'Generate a comprehensive weekly business report',
    prompt: 'Genera un reporte semanal completo: ingresos totales, comparacion con semana anterior, top clientes, productos mas vendidos, pagos cobrados vs pendientes, citas realizadas. Formato ejecutivo.',
    priority: 'normal',
    estimatedTime: '45s',
  },
];

// ── Voice Context (for task prompts) ──

let _voiceContext = '';

export function setVoiceContext(history: Array<{ role: string; content: string }>): void {
  if (history.length === 0) { _voiceContext = ''; return; }
  _voiceContext = history
    .slice(-6)
    .map((m) => `${m.role === 'user' ? 'Usuario' : 'Agente'}: ${m.content}`)
    .join('\n');
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
  emit({ type: 'task-created', task });

  if (afterTaskId) {
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
      ? `Tarea "${task.description.slice(0, 50)}" en cola -- esperando tarea ${afterTaskId}.`
      : `Tarea "${task.description.slice(0, 50)}" asignada. Te aviso cuando termine.`,
  });
}

function executeTask(taskId: string, prompt: string): void {
  const task = tasks.get(taskId);
  if (!task) return;

  const ac = new AbortController();
  abortControllers.set(taskId, ac);

  const contextBlock = _voiceContext
    ? `[Contexto de conversacion]\n${_voiceContext}\n\n[Tarea]\n${prompt}`
    : prompt;

  task.progress = 'Procesando...';
  task.progressHistory.push('Procesando...');
  emit({ type: 'task-progress', taskId, progress: 'Procesando...' });

  (async () => {
    try {
      const result = await directAgent.generate(contextBlock, {
        maxSteps: 8,
        abortSignal: ac.signal,
        onStepFinish: (step: any) => {
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
      logger.info({ taskId, elapsed: task.completedAt - task.startedAt }, 'Task completed');
    } catch (err) {
      abortControllers.delete(taskId);
      if (task.status === 'cancelled') return;

      task.completedAt = Date.now();
      task.status = 'failed';
      task.error = err instanceof Error ? err.message : String(err);
      emit({ type: 'task-failed', task });
      logger.error({ taskId, err: task.error }, 'Task failed');
    }
  })();
}

// ── Public: Create task from dashboard/API ──

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

// ── Format helper ──

export function formatTask(t: AgentTask) {
  return {
    id: t.id,
    description: t.description,
    priority: t.priority,
    status: t.status,
    template: t.template,
    progress: t.progress,
    progressHistory: t.progressHistory,
    result: t.result?.slice(0, 2000),
    error: t.error,
    elapsed: t.completedAt
      ? `${((t.completedAt - t.startedAt) / 1000).toFixed(1)}s`
      : `${((Date.now() - t.startedAt) / 1000).toFixed(0)}s`,
    startedAt: t.startedAt,
    completedAt: t.completedAt,
    blockedBy: t.blockedBy,
  };
}
