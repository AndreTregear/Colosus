import { Router } from 'express';
import { getAIQueue, enqueueAIJob } from '../../queue/ai-queue.js';
import { getRateLimitStatus } from '../../queue/rate-limiter.js';
import { getRedisConnection } from '../../queue/redis.js';
import { parsePagination } from '../../shared/validate.js';

const router = Router();

// GET /api/queue/stats — global queue statistics
router.get('/stats', async (_req, res) => {
  const q = getAIQueue();
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    q.getWaitingCount(),
    q.getActiveCount(),
    q.getCompletedCount(),
    q.getFailedCount(),
    q.getDelayedCount(),
  ]);
  res.json({ waiting, active, completed, failed, delayed });
});

// GET /api/queue/stats/:tenantId — per-tenant queue + rate limit info
router.get('/stats/:tenantId', async (req, res) => {
  const { tenantId } = req.params;
  const rateStatus = await getRateLimitStatus(tenantId);

  const q = getAIQueue();
  const [waitingJobs, activeJobs] = await Promise.all([
    q.getWaiting(0, 100),
    q.getActive(0, 100),
  ]);

  const tenantWaiting = waitingJobs.filter((j: { data: { tenantId: string } }) => j.data.tenantId === tenantId).length;
  const tenantActive = activeJobs.filter((j: { data: { tenantId: string } }) => j.data.tenantId === tenantId).length;

  res.json({
    tenantId,
    queue: { waiting: tenantWaiting, active: tenantActive },
    rateLimit: rateStatus,
  });
});

// GET /api/queue/failed — paginated DLQ listing
router.get('/failed', async (req, res) => {
  const q = getAIQueue();
  const { limit, offset: start } = parsePagination(req.query);
  const jobs = await q.getFailed(start, start + limit - 1);

  res.json({
    total: await q.getFailedCount(),
    jobs: jobs.map((j: any) => ({
      id: j.id,
      tenantId: j.data.tenantId,
      jid: j.data.jid,
      text: j.data.text.substring(0, 200),
      attempts: j.attemptsMade,
      failedReason: j.failedReason,
      timestamp: j.data.timestamp,
      finishedOn: j.finishedOn,
    })),
  });
});

// POST /api/queue/failed/:jobId/retry — retry a failed job
router.post('/failed/:jobId/retry', async (req, res) => {
  const q = getAIQueue();
  const job = await q.getJob(req.params.jobId);
  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }
  await job.retry();
  res.json({ ok: true, jobId: job.id });
});

// DELETE /api/queue/failed/:jobId — remove a failed job
router.delete('/failed/:jobId', async (req, res) => {
  const q = getAIQueue();
  const job = await q.getJob(req.params.jobId);
  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }
  await job.remove();
  res.json({ ok: true });
});

// GET /api/queue/health — Redis connection + queue health
router.get('/health', async (_req, res) => {
  try {
    const redis = getRedisConnection();
    const pong = await redis.ping();
    const q = getAIQueue();
    const isPaused = await q.isPaused();
    res.json({
      redis: pong === 'PONG' ? 'connected' : 'error',
      queue: isPaused ? 'paused' : 'active',
    });
  } catch {
    res.status(503).json({ redis: 'disconnected', queue: 'unknown' });
  }
});

// POST /api/queue/test-message — inject a test message through the AI pipeline
router.post('/test-message', async (req, res) => {
  const { tenantId, jid, text } = req.body;
  if (!tenantId || !jid || !text) {
    res.status(400).json({ error: 'tenantId, jid, and text are required' });
    return;
  }
  const timestamp = Date.now();
  await enqueueAIJob({ tenantId, channel: 'whatsapp', jid, pushName: 'Test', text, timestamp });
  res.json({ ok: true, jobId: `whatsapp_${tenantId}_${jid}_${timestamp}` });
});

export { router as queueRouter };
