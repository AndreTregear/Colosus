import { QueueFactory } from './queue-factory.js';
import { logger } from '../shared/logger.js';
import type { Job } from 'bullmq';

export interface SchedulerOptions<T> {
  name: string;
  checkIntervalMs: number;
  processor: (job: Job<T>) => Promise<void>;
  scanner: () => Promise<T[]>;
  getJobId: (data: T) => string;
  concurrency?: number;
}

export class SchedulerFactory<T> {
  private factory: QueueFactory;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private scanner: () => Promise<T[]>;
  private getJobId: (data: T) => string;
  private checkIntervalMs: number;

  constructor(options: SchedulerOptions<T>) {
    this.factory = new QueueFactory({
      name: options.name,
      processor: options.processor as (job: Job) => Promise<unknown>,
      concurrency: options.concurrency ?? 5,
      defaultJobOptions: { removeOnComplete: 100, removeOnFail: 500 },
    });
    this.scanner = options.scanner;
    this.getJobId = options.getJobId;
    this.checkIntervalMs = options.checkIntervalMs;
  }

  start(): void {
    this.factory.getWorker();
    this.intervalId = setInterval(async () => {
      try {
        const items = await this.scanner();
        for (const item of items) {
          await this.factory.add('process', item, { jobId: this.getJobId(item) });
        }
      } catch (err) {
        logger.error({ err, scheduler: this.factory.getQueue().name }, 'Scheduler scan failed');
      }
    }, this.checkIntervalMs);
    logger.info({ scheduler: this.factory.getQueue().name, intervalMs: this.checkIntervalMs }, 'Scheduler started');
  }

  async stop(): Promise<void> {
    if (this.intervalId) { clearInterval(this.intervalId); this.intervalId = null; }
    await this.factory.close();
  }

  getQueue() { return this.factory.getQueue(); }
}
