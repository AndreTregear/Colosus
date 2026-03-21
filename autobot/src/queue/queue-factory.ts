import { Queue, Worker, type Job, type JobsOptions, type WorkerOptions, type QueueOptions } from 'bullmq';
import { parseRedisUrl } from './redis.js';
import { REDIS_URL, QUEUE_MAX_RETRIES, QUEUE_RETRY_DELAY_MS } from '../config.js';
import { logger } from '../shared/logger.js';

export interface QueueFactoryOptions {
  name: string;
  processor?: (job: Job) => Promise<unknown>;
  workerOptions?: Partial<WorkerOptions>;
  queueOptions?: Partial<QueueOptions>;
  defaultJobOptions?: JobsOptions;
  concurrency?: number;
}

export class QueueFactory {
  private name: string;
  private processor?: (job: Job) => Promise<unknown>;
  private workerOptions: Partial<WorkerOptions>;
  private queueOpts: Partial<QueueOptions>;
  private defaultJobOptions: JobsOptions;
  private concurrency: number;
  private queue: Queue | null = null;
  private worker: Worker | null = null;

  constructor(options: QueueFactoryOptions) {
    this.name = options.name;
    this.processor = options.processor;
    this.workerOptions = options.workerOptions ?? {};
    this.queueOpts = options.queueOptions ?? {};
    this.defaultJobOptions = options.defaultJobOptions ?? {};
    this.concurrency = options.concurrency ?? 1;
  }

  getQueue(): Queue {
    if (!this.queue) {
      const redisConn = parseRedisUrl(REDIS_URL);
      this.queue = new Queue(this.name, {
        connection: redisConn,
        defaultJobOptions: {
          attempts: QUEUE_MAX_RETRIES,
          backoff: { type: 'exponential', delay: QUEUE_RETRY_DELAY_MS },
          removeOnComplete: { count: 1000 },
          removeOnFail: { count: 5000 },
          ...this.defaultJobOptions,
        },
        ...this.queueOpts,
      });
      logger.debug({ queue: this.name }, 'Queue initialized');
    }
    return this.queue;
  }

  getWorker(): Worker | null {
    if (!this.processor) return null;
    if (!this.worker) {
      const redisConn = parseRedisUrl(REDIS_URL);
      this.worker = new Worker(
        this.name,
        async (job) => {
          logger.info({ queue: this.name, jobId: job.id, attempt: job.attemptsMade + 1 }, 'Processing job');
          return this.processor!(job);
        },
        {
          connection: redisConn,
          concurrency: this.concurrency,
          ...this.workerOptions,
        },
      );
      logger.info({ queue: this.name, concurrency: this.concurrency }, 'Worker initialized');
    }
    return this.worker;
  }

  async add(jobName: string, data: unknown, opts?: JobsOptions): Promise<Job> {
    const q = this.getQueue();
    return q.add(jobName, data, opts);
  }

  async addBulk(jobs: { name: string; data: unknown; opts?: JobsOptions }[]): Promise<Job[]> {
    const q = this.getQueue();
    return q.addBulk(jobs.map(j => ({ name: j.name, data: j.data, opts: j.opts })));
  }

  async schedule(jobName: string, data: unknown, delayMs: number, opts?: JobsOptions): Promise<Job> {
    return this.add(jobName, data, { ...opts, delay: delayMs });
  }

  async getJobCounts(): Promise<{ waiting: number; active: number; completed: number; failed: number; delayed: number }> {
    return this.getQueue().getJobCounts() as Promise<{ waiting: number; active: number; completed: number; failed: number; delayed: number }>;
  }

  async close(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
    }
    if (this.queue) {
      await this.queue.close();
      this.queue = null;
    }
  }
}

// Global registry for managing all queues
const queueRegistry = new Map<string, QueueFactory>();

export function registerQueue(name: string, factory: QueueFactory): void {
  queueRegistry.set(name, factory);
}

export function getQueueFactory(name: string): QueueFactory | undefined {
  return queueRegistry.get(name);
}

export async function closeAllQueues(): Promise<void> {
  logger.info('Closing all queues...');
  for (const [name, factory] of queueRegistry) {
    await factory.close();
    logger.debug({ queue: name }, 'Queue closed');
  }
  queueRegistry.clear();
}
