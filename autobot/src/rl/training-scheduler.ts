/**
 * Training Scheduler — triggers LoRA fine-tuning during off-peak hours.
 *
 * Checks every hour:
 * - Is it off-peak? (00:00-06:00 Lima time, UTC-5)
 * - Are there enough new trajectories? (min 50 scored turns)
 * - Is a training run already in progress?
 *
 * If all conditions met, launches the LoRA training job.
 */

import { execFile } from 'node:child_process';
import { query, queryOne } from '../db/pool.js';
import { logger } from '../shared/logger.js';
import type { RolloutCollector } from './rollout-collector.js';

// ── Configuration ──

const CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const MIN_SCORED_TURNS = 50;
const OFF_PEAK_START_HOUR = 0; // 00:00 Lima
const OFF_PEAK_END_HOUR = 6;   // 06:00 Lima
const LIMA_TZ = 'America/Lima';

const TRAINING_SCRIPT = process.env.RL_TRAINING_SCRIPT || '/opt/hermes-rl/train_lora.sh';
const BASE_MODEL = process.env.RL_BASE_MODEL || 'Qwen/Qwen3.5-27B-AWQ';

// ── Types ──

export interface TrainingRun {
  id: number;
  startedAt: string;
  completedAt: string | null;
  status: string;
  trajectoriesCount: number;
  adapterPath: string | null;
  baseModel: string;
  metrics: Record<string, unknown>;
  error: string | null;
}

// ── Scheduler ──

export class TrainingScheduler {
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private trainingInProgress = false;

  constructor(private rolloutCollector: RolloutCollector) {}

  start(): void {
    if (this.running) return;
    this.running = true;

    // Check immediately on start, then every hour
    this.check();
    this.timer = setInterval(() => this.check(), CHECK_INTERVAL_MS);
    this.timer.unref();

    logger.info({ checkIntervalMs: CHECK_INTERVAL_MS, minScoredTurns: MIN_SCORED_TURNS }, 'Training scheduler started');
  }

  stop(): void {
    this.running = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    logger.info('Training scheduler stopped');
  }

  /** Main check: should we train now? */
  private async check(): Promise<void> {
    try {
      if (this.trainingInProgress) {
        logger.debug('Training already in progress, skipping check');
        return;
      }

      if (!this.isOffPeak()) {
        logger.debug('Not off-peak hours, skipping training check');
        return;
      }

      const scoredTurns = this.rolloutCollector.countScoredTurnsToday();
      if (scoredTurns < MIN_SCORED_TURNS) {
        logger.debug({ scoredTurns, required: MIN_SCORED_TURNS }, 'Not enough scored turns for training');
        return;
      }

      // Check if there's already a recent successful run today
      const recentRun = await queryOne<{ id: number }>(
        `SELECT id FROM rl_training_runs
         WHERE started_at > now() - interval '24 hours'
           AND status IN ('running', 'completed')
         LIMIT 1`,
      );
      if (recentRun) {
        logger.debug({ runId: recentRun.id }, 'Recent training run exists, skipping');
        return;
      }

      logger.info({ scoredTurns }, 'Conditions met — launching LoRA training');
      await this.launchTraining(scoredTurns);
    } catch (err) {
      logger.error({ err }, 'Training scheduler check failed');
    }
  }

  /** Check if current time is within off-peak hours in Lima timezone. */
  private isOffPeak(): boolean {
    const limaHour = new Date().toLocaleString('en-US', {
      timeZone: LIMA_TZ,
      hour: 'numeric',
      hour12: false,
    });
    const hour = parseInt(limaHour, 10);
    return hour >= OFF_PEAK_START_HOUR && hour < OFF_PEAK_END_HOUR;
  }

  /** Launch the LoRA training script and track it in the database. */
  private async launchTraining(trajectoriesCount: number): Promise<void> {
    this.trainingInProgress = true;

    // Record the training run
    const row = await queryOne<{ id: number }>(
      `INSERT INTO rl_training_runs (status, trajectories_count, base_model)
       VALUES ('running', $1, $2)
       RETURNING id`,
      [trajectoriesCount, BASE_MODEL],
    );
    const runId = row?.id ?? 0;

    try {
      const adapterPath = await this.executeTraining(runId);

      await query(
        `UPDATE rl_training_runs
         SET status = 'completed', completed_at = now(), adapter_path = $1
         WHERE id = $2`,
        [adapterPath, runId],
      );

      logger.info({ runId, adapterPath }, 'LoRA training completed');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      await query(
        `UPDATE rl_training_runs
         SET status = 'failed', completed_at = now(), error = $1
         WHERE id = $2`,
        [errorMsg, runId],
      );
      logger.error({ runId, err }, 'LoRA training failed');
    } finally {
      this.trainingInProgress = false;
    }
  }

  /** Execute the Hermes-RL training script. Returns the adapter output path. */
  private executeTraining(runId: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const adapterPath = `/opt/hermes-rl/adapters/run-${runId}`;

      execFile(
        TRAINING_SCRIPT,
        [
          '--base-model', BASE_MODEL,
          '--output', adapterPath,
          '--run-id', String(runId),
        ],
        { timeout: 4 * 60 * 60 * 1000 }, // 4-hour timeout
        (error, stdout, stderr) => {
          if (error) {
            logger.error({ runId, stderr: stderr.slice(0, 1000) }, 'Training script error');
            reject(error);
            return;
          }
          logger.info({ runId, stdout: stdout.slice(0, 500) }, 'Training script output');
          resolve(adapterPath);
        },
      );
    });
  }

  /** Get recent training runs for monitoring. */
  async getRecentRuns(limit = 10): Promise<TrainingRun[]> {
    const result = await query<{
      id: number;
      started_at: string;
      completed_at: string | null;
      status: string;
      trajectories_count: number;
      adapter_path: string | null;
      base_model: string;
      metrics: Record<string, unknown>;
      error: string | null;
    }>(
      `SELECT id, started_at, completed_at, status, trajectories_count,
              adapter_path, base_model, metrics, error
       FROM rl_training_runs
       ORDER BY started_at DESC
       LIMIT $1`,
      [limit],
    );

    return result.rows.map((r) => ({
      id: r.id,
      startedAt: r.started_at,
      completedAt: r.completed_at,
      status: r.status,
      trajectoriesCount: r.trajectories_count,
      adapterPath: r.adapter_path,
      baseModel: r.base_model,
      metrics: r.metrics,
      error: r.error,
    }));
  }
}
