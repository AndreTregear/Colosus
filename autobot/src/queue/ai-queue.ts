import fs from 'node:fs/promises';
import { DelayedError, type Job } from 'bullmq';
import { QueueFactory, registerQueue } from './queue-factory.js';
import { processWithAIStreaming } from '../ai/agent.js';
import { processWithOwnerAI, isOwnerChat } from '../ai/owner-agent.js';
import { tenantManager } from '../bot/tenant-manager.js';
import { acquireTenantSlot, releaseTenantSlot } from './rate-limiter.js';
import * as pgMessagesRepo from '../db/pg-messages-repo.js';
import { canTenantSendMessages } from '../services/subscription-service.js';
import { appBus } from '../shared/events.js';
import { logger } from '../shared/logger.js';
import { splitMessage } from '../shared/message-utils.js';
import { QUEUE_CONCURRENCY } from '../config.js';
import { isContactPaused } from '../db/ai-paused-repo.js';
import { AI_QUEUE_NAME, type AIJobData, type AIJobResult } from './types.js';

const MAX_OFFLINE_DELAYS = 3;
const OFFLINE_DELAY_MS = 30_000;
const CONCURRENCY_DELAY_MS = 5_000;

async function processAIJob(job: Job<AIJobData, AIJobResult>): Promise<AIJobResult> {
  const jobStartTime = Date.now();
  const { tenantId, channel, jid, pushName, text, imageMediaPath, fromMe } = job.data;
  const token = job.id; // For moveToDelayed

  logger.info({ tenantId, jid, jobId: job.id, attempt: job.attemptsMade + 1, textLength: text.length, hasImage: !!imageMediaPath, fromMe }, 'Processing AI job');

  // Connection-aware routing
  const bridge = tenantManager.getBridge(tenantId);
  if (!bridge?.isAlive()) {
    const delayCount = job.data._delayCount ?? 0;
    if (delayCount >= MAX_OFFLINE_DELAYS) {
      logger.error({ tenantId, jid, jobId: job.id, delayCount }, 'Tenant offline, AI reply undeliverable');
      appBus.emit('ai-job-failed', tenantId, jid, 'Tenant offline after max delay attempts');
      return { reply: '', chunksSent: 0 };
    }
    await job.updateData({ ...job.data, _delayCount: delayCount + 1 });
    try {
      await job.moveToDelayed(Date.now() + OFFLINE_DELAY_MS, token);
      logger.warn({ tenantId, jid, jobId: job.id, delayCount: delayCount + 1 }, 'Tenant offline, delaying AI job');
      throw new DelayedError();
    } catch (err) {
      if (err instanceof DelayedError) throw err;
      // Lock mismatch — job already moved (prior worker crash), just drop it
      logger.warn({ tenantId, jid, jobId: job.id, err }, 'Tenant offline, could not delay job (lock lost), dropping');
      return { reply: '', chunksSent: 0 };
    }
  }

  // Log incoming message
  await pgMessagesRepo.logMessagePg({
    tenantId, channel, jid, pushName,
    direction: 'incoming',
    body: text,
    timestamp: new Date().toISOString(),
  });

  // fromMe=true means owner is messaging their own number (self-chat) — skip subscription/pause checks
  const isSelfChat = fromMe === true || await isOwnerChat(tenantId, jid);

  if (!isSelfChat) {
    // Subscription check
    const canSend = await canTenantSendMessages(tenantId);
    if (!canSend) {
      logger.warn({ tenantId, jid, jobId: job.id }, 'Tenant out of free messages');
      try {
        await tenantManager.sendMessage(tenantId, jid, 'Lo siento, este negocio ha alcanzado su limite de mensajes gratuitos. El propietario debe actualizar su plan para continuar.');
      } catch { /* best effort */ }
      appBus.emit('ai-job-failed', tenantId, jid, 'Message limit reached');
      return { reply: '', chunksSent: 0 };
    }

    // AI pause check
    if (await isContactPaused(tenantId, jid)) {
      logger.info({ tenantId, jid, jobId: job.id }, 'AI paused for contact, skipping');
      return { reply: '', chunksSent: 0 };
    }
  }
  // Show typing indicator while processing
  tenantManager.sendPresenceUpdate(tenantId, jid, 'composing');

  if (isSelfChat) {
    logger.info({ tenantId, jid, jobId: job.id }, 'Routing owner message to unified owner agent');

    try {
      const { reply: response } = await processWithOwnerAI(tenantId, jid, text);

      if (response) {
        const chunks = splitMessage(response, 4000);
        for (const chunk of chunks) {
          await tenantManager.sendMessage(tenantId, jid, chunk);
        }

        await pgMessagesRepo.logMessagePg({
          tenantId, channel, jid, pushName: null,
          direction: 'outgoing',
          body: response,
          timestamp: new Date().toISOString(),
        });

        appBus.emit('message-logged', { tenantId, channel, jid, pushName: null, direction: 'outgoing', body: response, timestamp: new Date().toISOString() });
        logger.info({ tenantId, jid, jobId: job.id }, 'Owner agent replied');
      }

      return { reply: response, chunksSent: response ? splitMessage(response, 4000).length : 0 };
    } catch (error) {
      logger.error({ error, tenantId, jid, jobId: job.id, latencyMs: Date.now() - jobStartTime }, 'Owner agent processing failed');
      return { reply: '', chunksSent: 0 };
    }
  }

  // Per-tenant concurrency
  const slotAcquired = await acquireTenantSlot(tenantId, job.id!);
  if (!slotAcquired) {
    await job.moveToDelayed(Date.now() + CONCURRENCY_DELAY_MS, token);
    logger.debug({ tenantId, jid, jobId: job.id }, 'Tenant concurrency limit reached, delaying job');
    throw new DelayedError();
  }

  try {
    let chunksSent = 0;
    const result = await processWithAIStreaming(
      tenantId, channel, jid, text,
      async (chunk) => {
        await tenantManager.sendMessage(tenantId, jid, chunk);
        chunksSent++;
      },
      imageMediaPath,
    );

    if (result.reply) {
      // Send product images (after stream completes)
      for (const img of result.imagesToSend) {
        try {
          await fs.access(img.imagePath);
          await tenantManager.sendImage(tenantId, jid, img.imagePath, img.caption);
        } catch (err) {
          if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
            logger.warn({ tenantId, jid, imagePath: img.imagePath }, 'Product image file missing, skipping');
          } else {
            throw err;
          }
        }
      }

      await pgMessagesRepo.logMessagePg({
        tenantId, channel, jid, pushName: null,
        direction: 'outgoing',
        body: result.reply,
        timestamp: new Date().toISOString(),
      });

      appBus.emit('message-logged', { tenantId, channel, jid, pushName: null, direction: 'outgoing', body: result.reply, timestamp: new Date().toISOString() });
      appBus.emit('ai-job-completed', tenantId, jid);

      logger.info({ tenantId, jid, jobId: job.id, images: result.imagesToSend.length, chunksSent, hasVision: !!imageMediaPath, latencyMs: Date.now() - jobStartTime }, `AI replied to ${pushName || jid}`);

      return { reply: result.reply, chunksSent };
    }

    return { reply: '', chunksSent: 0 };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    const isSendError = errMsg.includes('timed out') || errMsg.includes('Not connected') || errMsg.includes('Worker exited') || errMsg.includes('Worker terminated') || errMsg.includes('Provider not running');
    logger.error({ error, tenantId, jid, jobId: job.id, isSendError }, isSendError ? 'WhatsApp delivery failed' : 'Sales agent processing failed');
    if (!isSendError) {
      try {
        await tenantManager.sendMessage(tenantId, jid, 'Lo siento, estoy teniendo dificultades tecnicas. Por favor, intenta de nuevo en un momento.');
      } catch { /* best effort */ }
    }
    throw error;
  } finally {
    await releaseTenantSlot(tenantId, job.id!);
  }
}

// Create and register the AI queue factory
const aiQueueFactory = new QueueFactory({
  name: AI_QUEUE_NAME,
  processor: processAIJob,
  concurrency: QUEUE_CONCURRENCY,
});

registerQueue(AI_QUEUE_NAME, aiQueueFactory);

// Export convenience functions
export const getAIQueue = () => aiQueueFactory.getQueue();

export async function enqueueAIJob(data: AIJobData): Promise<void> {
  const jobId = `${data.channel}_${data.tenantId}_${data.jid}_${data.timestamp}`;
  await aiQueueFactory.add('process-ai', data, { jobId });
  appBus.emit('ai-job-enqueued', data.tenantId, data.jid);
  logger.debug({ tenantId: data.tenantId, jid: data.jid, jobId }, 'AI job enqueued');
}

export function startAIWorker(): void {
  const worker = aiQueueFactory.getWorker();
  if (!worker) return;

  worker.on('completed', (job) => {
    if (job) logger.debug({ jobId: job.id, tenantId: job.data.tenantId }, 'AI job completed');
  });

  worker.on('failed', (job, err) => {
    if (!job) return;
    const isExhausted = job.attemptsMade >= (job.opts?.attempts ?? 3);
    if (isExhausted) {
      logger.error({ jobId: job.id, tenantId: job.data.tenantId, err, attempts: job.attemptsMade }, 'AI job moved to DLQ');
      appBus.emit('ai-job-failed', job.data.tenantId, job.data.jid, String(err));
      appBus.emit('tenant-error', job.data.tenantId, `AI processing failed for ${job.data.jid}`);
    } else {
      logger.warn({ jobId: job.id, tenantId: job.data.tenantId, err, attempt: job.attemptsMade }, 'AI job failed, will retry');
    }
  });

  worker.on('error', (err) => {
    logger.error({ err }, 'AI queue worker error');
  });

  logger.info({ concurrency: QUEUE_CONCURRENCY }, 'AI queue worker started');
}

export async function closeAIQueue(): Promise<void> {
  await aiQueueFactory.close();
  logger.info('AI queue closed');
}
