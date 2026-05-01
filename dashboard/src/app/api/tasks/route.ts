/**
 * Tasks REST API
 *
 * GET  /api/tasks          — list all tasks
 * POST /api/tasks          — create a new task
 * POST /api/tasks/cancel   — cancel a task
 * POST /api/tasks/priority — reprioritize a task
 *
 * GET  /api/tasks/templates — list available task templates
 */

import { NextRequest } from 'next/server';
import {
  getAllTasks,
  getTask,
  createTaskFromAPI,
  cancelTask,
  reprioritize,
  TASK_TEMPLATES,
  type AgentTask,
} from '@/lib/voice-tools';
import { withActiveSubscription } from '@/lib/billing/entitlement';

export const dynamic = 'force-dynamic';

async function getImpl(req: NextRequest) {
  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  if (action === 'templates') {
    return Response.json({ templates: TASK_TEMPLATES });
  }

  const taskId = url.searchParams.get('id');
  if (taskId) {
    const task = getTask(taskId);
    if (!task) return Response.json({ error: 'Task not found' }, { status: 404 });
    return Response.json({ task });
  }

  const status = url.searchParams.get('status'); // filter by status
  let taskList = getAllTasks();
  if (status) {
    taskList = taskList.filter((t) => t.status === status);
  }

  return Response.json({
    tasks: taskList.map(formatTask),
    summary: {
      total: taskList.length,
      running: taskList.filter((t) => t.status === 'running').length,
      pending: taskList.filter((t) => t.status === 'pending').length,
      completed: taskList.filter((t) => t.status === 'completed').length,
      failed: taskList.filter((t) => t.status === 'failed').length,
    },
  });
}

async function postImpl(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  switch (action) {
    case 'create': {
      const task = createTaskFromAPI({
        description: body.description,
        priority: body.priority,
        template: body.template,
        after: body.after,
      });
      return Response.json({ task: formatTask(task) }, { status: 201 });
    }

    case 'cancel': {
      const ok = cancelTask(body.taskId);
      if (!ok) return Response.json({ error: 'Cannot cancel this task' }, { status: 400 });
      return Response.json({ cancelled: true, taskId: body.taskId });
    }

    case 'reprioritize': {
      const ok = reprioritize(body.taskId, body.priority);
      if (!ok) return Response.json({ error: 'Cannot reprioritize this task' }, { status: 400 });
      return Response.json({ reprioritized: true, taskId: body.taskId, priority: body.priority });
    }

    default:
      // Default: create task (backwards compatible)
      if (body.description) {
        const task = createTaskFromAPI({
          description: body.description,
          priority: body.priority,
          template: body.template,
          after: body.after,
        });
        return Response.json({ task: formatTask(task) }, { status: 201 });
      }
      return Response.json({ error: 'Missing action or description' }, { status: 400 });
  }
}

function formatTask(t: AgentTask) {
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

export const GET = withActiveSubscription(getImpl);
export const POST = withActiveSubscription(postImpl);
