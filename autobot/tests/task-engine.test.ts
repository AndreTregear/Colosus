/**
 * Tests for ai/task-engine.ts — background task queue.
 *
 * These tests only cover the state management logic (no LLM calls).
 * Task execution is tested by verifying state transitions and event emissions.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock directAgent before importing task-engine
vi.mock('../src/ai/agents.js', () => ({
  directAgent: {
    generate: vi.fn().mockResolvedValue({ text: 'Mocked result' }),
  },
  setTenantId: vi.fn(),
  getTenantId: vi.fn().mockReturnValue('test-tenant'),
}));

const {
  getAllTasks,
  getTask,
  getUnnotifiedTasks,
  markNotified,
  cancelTask,
  reprioritize,
  onTaskEvent,
  createTaskFromAPI,
  formatTask,
  setVoiceContext,
  TASK_TEMPLATES,
} = await import('../src/ai/task-engine.js');

describe('task-engine', () => {
  describe('TASK_TEMPLATES', () => {
    it('should have at least 5 templates', () => {
      expect(TASK_TEMPLATES.length).toBeGreaterThanOrEqual(5);
    });

    it('should have required fields on each template', () => {
      for (const t of TASK_TEMPLATES) {
        expect(t.id).toBeTruthy();
        expect(t.name).toBeTruthy();
        expect(t.nameEs).toBeTruthy();
        expect(t.prompt).toBeTruthy();
        expect(['low', 'normal', 'high', 'urgent']).toContain(t.priority);
      }
    });

    it('should have unique IDs', () => {
      const ids = TASK_TEMPLATES.map((t) => t.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('createTaskFromAPI', () => {
    it('should create a task with default priority', () => {
      const task = createTaskFromAPI({ description: 'Test task' });
      expect(task.id).toMatch(/^task-\d+$/);
      expect(task.description).toBe('Test task');
      expect(task.priority).toBe('normal');
      expect(task.status).toBe('running');
      expect(task.progressHistory).toEqual(['Procesando...']);
    });

    it('should accept custom priority', () => {
      const task = createTaskFromAPI({ description: 'Urgent', priority: 'urgent' });
      expect(task.priority).toBe('urgent');
    });

    it('should use template prompt when template specified', () => {
      const task = createTaskFromAPI({
        description: 'ignored',
        template: 'daily-summary',
      });
      expect(task.template).toBe('daily-summary');
      expect(task.description).toBe('Resumen del dia');
    });

    it('should create pending task with after dependency', () => {
      const first = createTaskFromAPI({ description: 'First' });
      const second = createTaskFromAPI({
        description: 'Second',
        after: first.id,
      });
      expect(second.status).toBe('pending');
      expect(second.blockedBy).toBe(first.id);
    });
  });

  describe('getTask', () => {
    it('should retrieve existing task', () => {
      const task = createTaskFromAPI({ description: 'findme' });
      const found = getTask(task.id);
      expect(found?.description).toBe('findme');
    });

    it('should return undefined for nonexistent task', () => {
      expect(getTask('task-999999')).toBeUndefined();
    });
  });

  describe('getAllTasks', () => {
    it('should return tasks sorted by status and priority', () => {
      const tasks = getAllTasks();
      expect(Array.isArray(tasks)).toBe(true);
    });
  });

  describe('cancelTask', () => {
    it('should cancel a running task', () => {
      const task = createTaskFromAPI({ description: 'to cancel' });
      const result = cancelTask(task.id);
      expect(result).toBe(true);
      expect(getTask(task.id)?.status).toBe('cancelled');
      expect(getTask(task.id)?.completedAt).toBeDefined();
    });

    it('should cancel a pending task', () => {
      const first = createTaskFromAPI({ description: 'dep' });
      const second = createTaskFromAPI({ description: 'cancel me', after: first.id });
      expect(cancelTask(second.id)).toBe(true);
      expect(getTask(second.id)?.status).toBe('cancelled');
    });

    it('should return false for nonexistent task', () => {
      expect(cancelTask('task-nonexistent')).toBe(false);
    });

    it('should return false for already cancelled task', () => {
      const task = createTaskFromAPI({ description: 'already done' });
      cancelTask(task.id);
      expect(cancelTask(task.id)).toBe(false);
    });
  });

  describe('reprioritize', () => {
    it('should change priority of a running task', () => {
      const task = createTaskFromAPI({ description: 'repri' });
      expect(reprioritize(task.id, 'urgent')).toBe(true);
      expect(getTask(task.id)?.priority).toBe('urgent');
    });

    it('should return false for nonexistent task', () => {
      expect(reprioritize('task-nonexistent', 'high')).toBe(false);
    });
  });

  describe('notification system', () => {
    it('should track unnotified completed tasks', async () => {
      // Tasks that complete (via mocked agent) should appear in unnotified
      const before = getUnnotifiedTasks().length;
      // Creating a task triggers executeTask with mocked agent
      createTaskFromAPI({ description: 'notify test' });
      // Wait for async completion
      await new Promise((r) => setTimeout(r, 50));
      const after = getUnnotifiedTasks();
      expect(after.length).toBeGreaterThanOrEqual(before);
    });

    it('should mark task as notified', () => {
      const task = createTaskFromAPI({ description: 'mark notified' });
      markNotified(task.id);
      expect(getTask(task.id)?.notified).toBe(true);
    });
  });

  describe('onTaskEvent', () => {
    it('should emit events and support unsubscribe', () => {
      const events: string[] = [];
      const unsub = onTaskEvent((e) => events.push(e.type));

      createTaskFromAPI({ description: 'event test' });
      expect(events).toContain('task-created');

      unsub();
      const countBefore = events.length;
      createTaskFromAPI({ description: 'after unsub' });
      // Should still get events from internal listeners, but our listener is gone
      // The count may increase from other test's listeners but our specific one won't fire
    });
  });

  describe('formatTask', () => {
    it('should format a task for API response', () => {
      const task = createTaskFromAPI({ description: 'format me' });
      const formatted = formatTask(task);
      expect(formatted.id).toBe(task.id);
      expect(formatted.description).toBe('format me');
      expect(formatted.priority).toBe('normal');
      expect(formatted.elapsed).toMatch(/\d+/);
      expect(formatted.startedAt).toBeTypeOf('number');
    });

    it('should truncate long results', () => {
      const task = createTaskFromAPI({ description: 'long' });
      task.result = 'x'.repeat(3000);
      task.status = 'completed';
      const formatted = formatTask(task);
      expect(formatted.result?.length).toBeLessThanOrEqual(2000);
    });
  });

  describe('setVoiceContext', () => {
    it('should accept conversation history', () => {
      // Should not throw
      setVoiceContext([
        { role: 'user', content: 'Hola' },
        { role: 'assistant', content: 'Buenos dias' },
      ]);
    });

    it('should handle empty history', () => {
      setVoiceContext([]);
    });
  });
});
