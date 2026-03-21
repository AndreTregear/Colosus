import { Queue, Worker, type Job } from 'bullmq';
import { parseRedisUrl } from '../queue/redis.js';
import { REDIS_URL, QUEUE_MAX_RETRIES, QUEUE_RETRY_DELAY_MS, MEDIA_QUEUE_CONCURRENCY } from '../config.js';
import { processAudio } from './processors/audio-processor.js';
import { processVideo } from './processors/video-processor.js';
import * as mediaAssetsRepo from '../db/media-assets-repo.js';
import { logger } from '../shared/logger.js';
import type { MediaProcessingJob } from './types.js';

const MEDIA_QUEUE_NAME = 'media-processing';

let queue: Queue | null = null;
let worker: Worker | null = null;

// ── Queue (enqueue side) ──

export function getMediaQueue(): Queue {
  if (!queue) {
    queue = new Queue(MEDIA_QUEUE_NAME, {
      connection: parseRedisUrl(REDIS_URL),
      defaultJobOptions: {
        attempts: QUEUE_MAX_RETRIES,
        backoff: { type: 'exponential', delay: QUEUE_RETRY_DELAY_MS },
        removeOnComplete: { count: 500 },
        removeOnFail: { count: 2000 },
      },
    });
  }
  return queue;
}

export async function enqueueMediaJob(data: MediaProcessingJob): Promise<void> {
  const q = getMediaQueue();
  const jobId = `media_${data.assetId}_${data.type}`;
  await q.add(data.type, data, { jobId });
  logger.debug({ assetId: data.assetId, type: data.type, jobId }, 'Media job enqueued');
}

// ── Worker (processor side) ──

async function processMediaJob(job: Job<MediaProcessingJob>): Promise<void> {
  const { assetId, tenantId, type, originalKey } = job.data;

  logger.info({ assetId, tenantId, type, jobId: job.id, attempt: job.attemptsMade + 1 }, 'Processing media job');

  // Mark as processing
  await mediaAssetsRepo.updateProcessingStatus(assetId, 'processing');

  switch (type) {
    case 'transcode-audio':
      await processAudio(assetId, originalKey);
      break;

    case 'transcode-video':
      await processVideo(assetId, originalKey);
      break;

    case 'generate-thumbnail': {
      // Thumbnail generation is part of video processing, but can be triggered independently
      const { generateThumbnail, createTempPath, cleanupTemp } = await import('./processors/ffmpeg.js');
      const { getObject, putObject } = await import('./s3-client.js');
      const { S3_BUCKET_RAW, S3_BUCKET_PROCESSED } = await import('../config.js');
      const fs = await import('node:fs/promises');

      const inputPath = await createTempPath('.input');
      const thumbPath = await createTempPath('.jpg');

      try {
        const buffer = await getObject(S3_BUCKET_RAW, originalKey);
        await fs.writeFile(inputPath, buffer);
        await generateThumbnail(inputPath, thumbPath, 1);

        const thumbBuffer = await fs.readFile(thumbPath);
        const thumbnailKey = originalKey.replace(/\.[^.]+$/, '_thumb.jpg');
        await putObject(S3_BUCKET_PROCESSED, thumbnailKey, thumbBuffer, 'image/jpeg');

        await mediaAssetsRepo.updateProcessingStatus(assetId, 'completed', { thumbnailKey });
      } finally {
        await cleanupTemp(inputPath, thumbPath);
      }
      break;
    }

    case 'extract-audio': {
      // Extract audio from video for transcription
      const { transcode: transcodeFile, createTempPath: tmpPath, cleanupTemp: cleanup } = await import('./processors/ffmpeg.js');
      const { getObject: getObj, putObject: putObj } = await import('./s3-client.js');
      const { S3_BUCKET_RAW, S3_BUCKET_PROCESSED } = await import('../config.js');
      const fsModule = await import('node:fs/promises');

      const inputFile = await tmpPath('.input');
      const audioFile = await tmpPath('.ogg');

      try {
        const buf = await getObj(S3_BUCKET_RAW, originalKey);
        await fsModule.writeFile(inputFile, buf);
        await transcodeFile(inputFile, audioFile, { format: 'opus', audioBitrate: '64k', audioOnly: true });

        const audioBuf = await fsModule.readFile(audioFile);
        const audioKey = originalKey.replace(/\.[^.]+$/, '_audio.ogg');
        await putObj(S3_BUCKET_PROCESSED, audioKey, audioBuf, 'audio/ogg');

        await mediaAssetsRepo.updateProcessingStatus(assetId, 'completed', {
          processedKey: audioKey,
        });
      } finally {
        await cleanup(inputFile, audioFile);
      }
      break;
    }

    default:
      logger.warn({ type }, 'Unknown media job type');
  }
}

export function startMediaWorker(): void {
  if (worker) return;

  worker = new Worker(MEDIA_QUEUE_NAME, processMediaJob, {
    connection: parseRedisUrl(REDIS_URL),
    concurrency: MEDIA_QUEUE_CONCURRENCY,
  });

  worker.on('completed', (job) => {
    if (job) {
      logger.debug({ jobId: job.id, assetId: job.data.assetId }, 'Media job completed');
    }
  });

  worker.on('failed', (job, err) => {
    if (job) {
      const isExhausted = job.attemptsMade >= (job.opts?.attempts ?? QUEUE_MAX_RETRIES);
      if (isExhausted) {
        logger.error(
          { jobId: job.id, assetId: job.data.assetId, err, attempts: job.attemptsMade },
          'Media job exhausted all retries',
        );
      } else {
        logger.warn(
          { jobId: job.id, assetId: job.data.assetId, err, attempt: job.attemptsMade },
          'Media job failed, will retry',
        );
      }
    }
  });

  worker.on('error', (err) => {
    logger.error({ err }, 'Media queue worker error');
  });

  logger.info({ concurrency: MEDIA_QUEUE_CONCURRENCY }, 'Media queue worker started');
}

export async function closeMediaQueue(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
    logger.info('Media queue worker closed');
  }
  if (queue) {
    await queue.close();
    queue = null;
  }
}
