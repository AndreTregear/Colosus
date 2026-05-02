/**
 * Hermes-RL Pipeline — barrel exports + initialization.
 *
 * Components:
 * - PII Scrubber: strips customer data from training trajectories
 * - Rollout Collector: captures conversation sessions + next-state signals
 * - Training Scheduler: triggers LoRA fine-tuning during off-peak hours
 * - A/B Test Manager: evaluates new adapters before promotion
 */

export { scrubPII, scrubConversation } from '../ai/pii-scrubber.js';
export { RolloutCollector } from './rollout-collector.js';
export { TrainingScheduler } from './training-scheduler.js';
export { ABTestManager } from './ab-test.js';

import { RolloutCollector } from './rollout-collector.js';
import { TrainingScheduler } from './training-scheduler.js';
import { ABTestManager } from './ab-test.js';
import { logger } from '../shared/logger.js';

let rolloutCollector: RolloutCollector | null = null;
let trainingScheduler: TrainingScheduler | null = null;
let abTestManager: ABTestManager | null = null;

/** Start all RL pipeline components. Call once during platform startup. */
export function initializeRLPipeline(): void {
  rolloutCollector = new RolloutCollector();
  rolloutCollector.start();

  trainingScheduler = new TrainingScheduler(rolloutCollector);
  trainingScheduler.start();

  abTestManager = new ABTestManager();
  abTestManager.start();

  logger.info('RL pipeline initialized (rollout collector + training scheduler + A/B test manager)');
}

/** Stop all RL pipeline components. Call during platform shutdown. */
export function stopRLPipeline(): void {
  abTestManager?.stop();
  trainingScheduler?.stop();
  rolloutCollector?.stop();

  abTestManager = null;
  trainingScheduler = null;
  rolloutCollector = null;

  logger.info('RL pipeline stopped');
}

/** Access singleton instances for monitoring/API endpoints. */
export function getRolloutCollector(): RolloutCollector | null {
  return rolloutCollector;
}

export function getTrainingScheduler(): TrainingScheduler | null {
  return trainingScheduler;
}

export function getABTestManager(): ABTestManager | null {
  return abTestManager;
}
