/**
 * Mobile Agente API — for the Android app (agente-mobile)
 *
 * All routes require JWT auth via the mobile auth middleware.
 * The tenant is derived from the JWT token.
 *
 * POST /api/v1/mobile/agente/chat      — Chat with agent (returns JSON, not SSE)
 * POST /api/v1/mobile/agente/voice     — Voice message processing (audio in -> text + audio out)
 * GET  /api/v1/mobile/agente/tasks     — List tasks
 * POST /api/v1/mobile/agente/tasks     — Create task
 * GET  /api/v1/mobile/agente/dashboard — Business dashboard data (metrics, pending, calendar)
 */

import { Router } from 'express';
import multer from 'multer';
import { requireMobileOrDeviceAuth } from '../middleware/mobile-auth.js';
import { getTenantId } from '../../shared/validate.js';
import { query, queryOne } from '../../db/pool.js';
import { processOwnerWithHermes } from '../../ai/mastra-bridge.js';
import { transcribeAudio } from '../../ai/client.js';
import * as sessionsRepo from '../../db/sessions-repo.js';
import { logger } from '../../shared/logger.js';
import { MAX_UPLOAD_SIZE_MB } from '../../config.js';
import { prepareAudioAudit, finalizeAudioDeletion } from '../../voice/audio-compliance.js';

const router = Router();
router.use(requireMobileOrDeviceAuth);

// ── Audio upload config ──

const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'audio/ogg', 'audio/mpeg', 'audio/mp4', 'audio/wav',
      'audio/webm', 'audio/x-m4a', 'audio/aac',
      'application/ogg',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed (ogg, mp3, mp4, wav, webm, m4a, aac)'));
    }
  },
});

// ══════════════════════════════════════════════
// POST /chat — Chat with the business agent
// ══════════════════════════════════════════════

router.post('/chat', async (req, res) => {
  const tenantId = getTenantId(req);
  const { message } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    res.status(400).json({ error: 'message is required' });
    return;
  }

  if (message.length > 4096) {
    res.status(400).json({ error: 'Message too long (max 4096 characters)' });
    return;
  }

  try {
    const startTime = Date.now();
    const ownerJid = `${tenantId}@mobile-app`;
    const result = await processOwnerWithHermes(tenantId, ownerJid, message.trim());

    logger.info({ tenantId, durationMs: Date.now() - startTime }, 'Mobile agente chat completed');

    res.json({
      response: result.reply,
      durationMs: Date.now() - startTime,
    });
  } catch (err) {
    logger.error({ tenantId, err }, 'Mobile agente chat failed');
    res.status(500).json({ error: 'Failed to process your request' });
  }
});

// ══════════════════════════════════════════════
// POST /voice — Voice message: audio in -> STT -> LLM -> response
// ══════════════════════════════════════════════

router.post('/voice', audioUpload.single('audio'), async (req, res) => {
  const tenantId = getTenantId(req);

  if (!req.file) {
    res.status(400).json({ error: 'No audio file uploaded. Send as multipart form with field name "audio".' });
    return;
  }

  const timings: Record<string, number> = {};

  // Ley 29733: prepare audit trail before any processing
  const audit = prepareAudioAudit(req.file.buffer, req.file.mimetype);

  try {
    // 1. Speech-to-Text (Whisper)
    const sttStart = Date.now();
    let transcription: string;
    try {
      transcription = await transcribeAudio(req.file.buffer, req.file.mimetype);
    } finally {
      // Ley 29733: zero audio buffer immediately after transcription — voice is biometric data
      finalizeAudioDeletion(req.file.buffer, audit, tenantId, 'api-mobile-voice');
    }
    timings.sttMs = Date.now() - sttStart;

    if (!transcription || !transcription.trim()) {
      res.json({
        transcription: '',
        response: 'No pude entender el audio. Intenta de nuevo.',
        timings,
      });
      return;
    }

    // 2. LLM processing
    const llmStart = Date.now();
    const ownerJid = `${tenantId}@mobile-voice`;
    const result = await processOwnerWithHermes(tenantId, ownerJid, transcription.trim());
    timings.llmMs = Date.now() - llmStart;

    // 3. TTS is handled client-side on Android (using Android TTS engine)
    // The mobile app receives the text response and synthesizes speech locally.
    // This avoids server-side TTS latency and bandwidth for audio response.

    timings.totalMs = Date.now() - sttStart;

    logger.info({
      tenantId,
      transcriptionLength: transcription.length,
      ...timings,
    }, 'Mobile agente voice completed');

    res.json({
      transcription: transcription.trim(),
      response: result.reply,
      timings,
    });
  } catch (err) {
    logger.error({ tenantId, err }, 'Mobile agente voice processing failed');
    res.status(500).json({ error: 'Failed to process voice message' });
  }
});

// ══════════════════════════════════════════════
// GET /tasks — List tasks for this tenant
// ══════════════════════════════════════════════

router.get('/tasks', async (req, res) => {
  const tenantId = getTenantId(req);
  const status = (req.query.status as string) || null;
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const offset = Number(req.query.offset) || 0;

  try {
    const params: unknown[] = [tenantId, limit, offset];
    let statusFilter = '';
    if (status) {
      statusFilter = ' AND status = $4';
      params.push(status);
    }

    const result = await query<Record<string, unknown>>(
      `SELECT id, title, description, status, priority, due_date, created_at, updated_at
       FROM tasks
       WHERE tenant_id = $1${statusFilter}
       ORDER BY
         CASE WHEN status = 'pending' THEN 0 WHEN status = 'in_progress' THEN 1 ELSE 2 END,
         COALESCE(due_date, '9999-12-31') ASC,
         created_at DESC
       LIMIT $2 OFFSET $3`,
      params,
    );

    const countResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*)::text as count FROM tasks WHERE tenant_id = $1${status ? ' AND status = $2' : ''}`,
      status ? [tenantId, status] : [tenantId],
    );

    res.json({
      tasks: result.rows.map(r => ({
        id: r.id,
        title: r.title,
        description: r.description,
        status: r.status,
        priority: r.priority,
        dueDate: r.due_date,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      })),
      total: Number(countResult?.count ?? 0),
    });
  } catch (err) {
    logger.error({ tenantId, err }, 'Failed to fetch tasks');
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// ══════════════════════════════════════════════
// POST /tasks — Create a new task
// ══════════════════════════════════════════════

router.post('/tasks', async (req, res) => {
  const tenantId = getTenantId(req);
  const { title, description, priority, dueDate } = req.body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    res.status(400).json({ error: 'title is required' });
    return;
  }

  if (title.length > 500) {
    res.status(400).json({ error: 'Title too long (max 500 characters)' });
    return;
  }

  const validPriorities = ['low', 'medium', 'high', 'urgent'];
  const taskPriority = priority && validPriorities.includes(priority) ? priority : 'medium';

  try {
    const result = await queryOne<Record<string, unknown>>(
      `INSERT INTO tasks (tenant_id, title, description, status, priority, due_date)
       VALUES ($1, $2, $3, 'pending', $4, $5)
       RETURNING id, title, description, status, priority, due_date, created_at, updated_at`,
      [tenantId, title.trim(), description?.trim() || null, taskPriority, dueDate || null],
    );

    if (!result) {
      res.status(500).json({ error: 'Failed to create task' });
      return;
    }

    res.status(201).json({
      id: result.id,
      title: result.title,
      description: result.description,
      status: result.status,
      priority: result.priority,
      dueDate: result.due_date,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
    });
  } catch (err) {
    logger.error({ tenantId, err }, 'Failed to create task');
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// ══════════════════════════════════════════════
// PATCH /tasks/:id — Update task status/details
// ══════════════════════════════════════════════

router.patch('/tasks/:id', async (req, res) => {
  const tenantId = getTenantId(req);
  const taskId = Number(req.params.id);
  const { title, description, status, priority, dueDate } = req.body;

  if (isNaN(taskId)) {
    res.status(400).json({ error: 'Invalid task ID' });
    return;
  }

  const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
  const validPriorities = ['low', 'medium', 'high', 'urgent'];

  const sets: string[] = [];
  const params: unknown[] = [tenantId, taskId];
  let paramIdx = 3;

  if (title !== undefined) {
    sets.push(`title = $${paramIdx++}`);
    params.push(title.trim());
  }
  if (description !== undefined) {
    sets.push(`description = $${paramIdx++}`);
    params.push(description?.trim() || null);
  }
  if (status !== undefined) {
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      return;
    }
    sets.push(`status = $${paramIdx++}`);
    params.push(status);
  }
  if (priority !== undefined) {
    if (!validPriorities.includes(priority)) {
      res.status(400).json({ error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` });
      return;
    }
    sets.push(`priority = $${paramIdx++}`);
    params.push(priority);
  }
  if (dueDate !== undefined) {
    sets.push(`due_date = $${paramIdx++}`);
    params.push(dueDate || null);
  }

  if (sets.length === 0) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }

  sets.push('updated_at = now()');

  try {
    const result = await queryOne<Record<string, unknown>>(
      `UPDATE tasks SET ${sets.join(', ')} WHERE tenant_id = $1 AND id = $2
       RETURNING id, title, description, status, priority, due_date, created_at, updated_at`,
      params,
    );

    if (!result) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    res.json({
      id: result.id,
      title: result.title,
      description: result.description,
      status: result.status,
      priority: result.priority,
      dueDate: result.due_date,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
    });
  } catch (err) {
    logger.error({ tenantId, err }, 'Failed to update task');
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// ══════════════════════════════════════════════
// DELETE /tasks/:id — Delete a task
// ══════════════════════════════════════════════

router.delete('/tasks/:id', async (req, res) => {
  const tenantId = getTenantId(req);
  const taskId = Number(req.params.id);

  if (isNaN(taskId)) {
    res.status(400).json({ error: 'Invalid task ID' });
    return;
  }

  try {
    const result = await queryOne<{ id: number }>(
      `DELETE FROM tasks WHERE tenant_id = $1 AND id = $2 RETURNING id`,
      [tenantId, taskId],
    );

    if (!result) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    res.json({ ok: true });
  } catch (err) {
    logger.error({ tenantId, err }, 'Failed to delete task');
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// ══════════════════════════════════════════════
// GET /dashboard — Aggregated business dashboard for mobile
// ══════════════════════════════════════════════

router.get('/dashboard', async (req, res) => {
  const tenantId = getTenantId(req);

  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [metrics, pendingPayments, todayAppointments, recentMessages, session] = await Promise.all([
      // Today's metrics: revenue, order count, pending count
      queryOne<{ revenue: string; orders: string; pending: string }>(
        `SELECT
           COALESCE((SELECT SUM(total) FROM orders WHERE tenant_id = $1 AND created_at >= $2), 0)::text AS revenue,
           COALESCE((SELECT COUNT(*) FROM orders WHERE tenant_id = $1 AND created_at >= $2), 0)::text AS orders,
           COALESCE((SELECT COUNT(*) FROM orders WHERE tenant_id = $1 AND status IN ('pending', 'payment_requested')), 0)::text AS pending`,
        [tenantId, todayStart.toISOString()],
      ),

      // Pending payments (up to 5)
      query<{ id: number; customer: string; total: string }>(
        `SELECT o.id, COALESCE(c.name, 'Sin nombre') AS customer, o.total::text
         FROM orders o
         LEFT JOIN customers c ON c.id = o.customer_id AND c.tenant_id = o.tenant_id
         WHERE o.tenant_id = $1 AND o.status IN ('pending', 'payment_requested')
         ORDER BY o.created_at DESC LIMIT 5`,
        [tenantId],
      ),

      // Today's appointments
      query<{ scheduled_at: string; service_name: string; customer: string; status: string }>(
        `SELECT a.scheduled_at, a.service_name, COALESCE(c.name, 'Sin nombre') AS customer, a.status
         FROM appointments a
         LEFT JOIN customers c ON c.id = a.customer_id AND c.tenant_id = a.tenant_id
         WHERE a.tenant_id = $1 AND a.scheduled_at::date = CURRENT_DATE AND a.status NOT IN ('cancelled')
         ORDER BY a.scheduled_at`,
        [tenantId],
      ),

      // Recent messages (last 10)
      query<{ direction: string; body: string; jid: string; push_name: string; timestamp: string }>(
        `SELECT direction, body, jid, push_name, timestamp
         FROM message_log
         WHERE tenant_id = $1
         ORDER BY timestamp DESC LIMIT 10`,
        [tenantId],
      ),

      // WhatsApp session status
      sessionsRepo.getSession(tenantId),
    ]);

    res.json({
      metrics: {
        revenue: metrics?.revenue ?? '0',
        orders: Number(metrics?.orders ?? 0),
        pending: Number(metrics?.pending ?? 0),
      },
      pendingPayments: pendingPayments.rows.map(r => ({
        orderId: r.id,
        customer: r.customer,
        amount: r.total,
      })),
      todayAppointments: todayAppointments.rows.map(r => ({
        time: new Date(r.scheduled_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false }),
        customer: r.customer,
        service: r.service_name,
        status: r.status,
      })),
      recentMessages: recentMessages.rows.map(r => ({
        from: r.push_name || r.jid?.split('@')[0] || 'Desconocido',
        text: r.body?.substring(0, 100) || '',
        time: r.timestamp,
        direction: r.direction,
      })),
      connectionStatus: session?.connectionStatus ?? 'disconnected',
    });
  } catch (err) {
    logger.error({ tenantId, err }, 'Mobile agente dashboard failed');
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

export { router as mobileAgenteRouter };
