/**
 * A/B Test Manager — evaluates new LoRA adapters before promotion.
 *
 * When a new adapter is trained:
 * 1. Create a test routing 10% of traffic to the candidate
 * 2. Compare metrics: re-query rate, explicit feedback, response quality
 * 3. After 48 hours or 100 interactions: promote or rollback
 */

import { query, queryOne } from '../db/pool.js';
import { logger } from '../shared/logger.js';

// ── Configuration ──

const DEFAULT_TRAFFIC_SPLIT = 0.10; // 10% to candidate
const MIN_INTERACTIONS = 100;
const MAX_DURATION_MS = 48 * 60 * 60 * 1000; // 48 hours
const IMPROVEMENT_THRESHOLD = 0.05; // 5% improvement required to promote

// ── Types ──

export interface ABTestMetrics {
  interactions: number;
  reQueryRate: number;
  positiveFeedback: number;
}

export interface ABTest {
  id: number;
  baseAdapter: string;
  candidateAdapter: string;
  trafficSplit: number;
  startedAt: string;
  endedAt: string | null;
  status: 'running' | 'promoted' | 'rolled-back';
  baseMetrics: ABTestMetrics;
  candidateMetrics: ABTestMetrics;
  result: string | null;
}

function defaultMetrics(): ABTestMetrics {
  return { interactions: 0, reQueryRate: 0, positiveFeedback: 0 };
}

// ── Manager ──

export class ABTestManager {
  private checkTimer: ReturnType<typeof setInterval> | null = null;
  private running = false;

  start(): void {
    if (this.running) return;
    this.running = true;

    // Check active tests every 15 minutes
    this.checkTimer = setInterval(() => this.evaluateActiveTests(), 15 * 60 * 1000);
    this.checkTimer.unref();

    logger.info('A/B test manager started');
  }

  stop(): void {
    this.running = false;
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
    logger.info('A/B test manager stopped');
  }

  /**
   * Create a new A/B test for a candidate LoRA adapter.
   * Returns the test ID.
   */
  async createTest(baseAdapter: string, candidateAdapter: string, trafficSplit = DEFAULT_TRAFFIC_SPLIT): Promise<number> {
    // Ensure no other test is already running
    const active = await queryOne<{ id: number }>(
      `SELECT id FROM rl_ab_tests WHERE status = 'running' LIMIT 1`,
    );
    if (active) {
      throw new Error(`A/B test ${active.id} is already running. Finish it before starting a new one.`);
    }

    const row = await queryOne<{ id: number }>(
      `INSERT INTO rl_ab_tests (base_adapter, candidate_adapter, traffic_split, status)
       VALUES ($1, $2, $3, 'running')
       RETURNING id`,
      [baseAdapter, candidateAdapter, trafficSplit],
    );
    const testId = row!.id;

    logger.info({ testId, baseAdapter, candidateAdapter, trafficSplit }, 'A/B test created');
    return testId;
  }

  /**
   * Route a request: returns which adapter to use.
   * If no test is active, always returns null (use default).
   */
  async routeRequest(): Promise<{ adapter: string; variant: 'base' | 'candidate' } | null> {
    const test = await this.getActiveTest();
    if (!test) return null;

    const useCandidate = Math.random() < test.trafficSplit;
    return {
      adapter: useCandidate ? test.candidateAdapter : test.baseAdapter,
      variant: useCandidate ? 'candidate' : 'base',
    };
  }

  /**
   * Record an interaction result for the active test.
   */
  async recordInteraction(variant: 'base' | 'candidate', wasReQuery: boolean, wasPositive: boolean): Promise<void> {
    const test = await this.getActiveTest();
    if (!test) return;

    const metricsCol = variant === 'base' ? 'base_metrics' : 'candidate_metrics';
    const current = variant === 'base' ? test.baseMetrics : test.candidateMetrics;

    const newInteractions = current.interactions + 1;
    const newReQueryCount = (current.reQueryRate * current.interactions) + (wasReQuery ? 1 : 0);
    const newPositiveCount = (current.positiveFeedback * current.interactions) + (wasPositive ? 1 : 0);

    const updatedMetrics: ABTestMetrics = {
      interactions: newInteractions,
      reQueryRate: newReQueryCount / newInteractions,
      positiveFeedback: newPositiveCount / newInteractions,
    };

    await query(
      `UPDATE rl_ab_tests SET ${metricsCol} = $1 WHERE id = $2`,
      [JSON.stringify(updatedMetrics), test.id],
    );
  }

  /** Evaluate all active tests and promote/rollback if thresholds are met. */
  private async evaluateActiveTests(): Promise<void> {
    const test = await this.getActiveTest();
    if (!test) return;

    const elapsed = Date.now() - new Date(test.startedAt).getTime();
    const totalInteractions = test.baseMetrics.interactions + test.candidateMetrics.interactions;

    // Not enough data yet?
    if (totalInteractions < MIN_INTERACTIONS && elapsed < MAX_DURATION_MS) {
      logger.debug(
        { testId: test.id, totalInteractions, elapsedMs: elapsed },
        'A/B test still collecting data',
      );
      return;
    }

    // Evaluate: candidate must beat base by IMPROVEMENT_THRESHOLD
    const decision = this.evaluateMetrics(test);

    if (decision === 'promote') {
      await this.concludeTest(test.id, 'promoted', `Candidate improved: positive feedback ${(test.candidateMetrics.positiveFeedback * 100).toFixed(1)}% vs base ${(test.baseMetrics.positiveFeedback * 100).toFixed(1)}%`);
      logger.info({ testId: test.id }, 'A/B test: candidate PROMOTED');
    } else {
      await this.concludeTest(test.id, 'rolled-back', `Candidate did not improve sufficiently: positive feedback ${(test.candidateMetrics.positiveFeedback * 100).toFixed(1)}% vs base ${(test.baseMetrics.positiveFeedback * 100).toFixed(1)}%`);
      logger.info({ testId: test.id }, 'A/B test: candidate ROLLED BACK');
    }
  }

  /** Compare candidate vs base metrics. */
  private evaluateMetrics(test: ABTest): 'promote' | 'rollback' {
    // Need at least some interactions on both sides
    if (test.candidateMetrics.interactions < 10 || test.baseMetrics.interactions < 10) {
      return 'rollback'; // Not enough data — don't promote
    }

    // Positive feedback improvement
    const feedbackImprovement = test.candidateMetrics.positiveFeedback - test.baseMetrics.positiveFeedback;

    // Re-query rate reduction (lower is better)
    const reQueryImprovement = test.baseMetrics.reQueryRate - test.candidateMetrics.reQueryRate;

    // Combined score: weighted average of improvements
    const score = feedbackImprovement * 0.6 + reQueryImprovement * 0.4;

    return score >= IMPROVEMENT_THRESHOLD ? 'promote' : 'rollback';
  }

  /** Mark a test as concluded. */
  private async concludeTest(testId: number, status: 'promoted' | 'rolled-back', result: string): Promise<void> {
    await query(
      `UPDATE rl_ab_tests
       SET status = $1, ended_at = now(), result = $2
       WHERE id = $3`,
      [status, result, testId],
    );
  }

  /** Get the currently active A/B test, if any. */
  async getActiveTest(): Promise<ABTest | null> {
    const row = await queryOne<{
      id: number;
      base_adapter: string;
      candidate_adapter: string;
      traffic_split: string;
      started_at: string;
      ended_at: string | null;
      status: string;
      base_metrics: ABTestMetrics | string;
      candidate_metrics: ABTestMetrics | string;
      result: string | null;
    }>(
      `SELECT id, base_adapter, candidate_adapter, traffic_split,
              started_at, ended_at, status, base_metrics, candidate_metrics, result
       FROM rl_ab_tests
       WHERE status = 'running'
       ORDER BY started_at DESC
       LIMIT 1`,
    );

    if (!row) return null;

    const parseMetrics = (m: ABTestMetrics | string): ABTestMetrics => {
      if (typeof m === 'string') {
        try { return JSON.parse(m) as ABTestMetrics; } catch { return defaultMetrics(); }
      }
      return { ...defaultMetrics(), ...m };
    };

    return {
      id: row.id,
      baseAdapter: row.base_adapter,
      candidateAdapter: row.candidate_adapter,
      trafficSplit: parseFloat(String(row.traffic_split)),
      startedAt: row.started_at,
      endedAt: row.ended_at,
      status: row.status as ABTest['status'],
      baseMetrics: parseMetrics(row.base_metrics),
      candidateMetrics: parseMetrics(row.candidate_metrics),
      result: row.result,
    };
  }

  /** Get recent test history. */
  async getRecentTests(limit = 10): Promise<ABTest[]> {
    const result = await query<{
      id: number;
      base_adapter: string;
      candidate_adapter: string;
      traffic_split: string;
      started_at: string;
      ended_at: string | null;
      status: string;
      base_metrics: ABTestMetrics | string;
      candidate_metrics: ABTestMetrics | string;
      result: string | null;
    }>(
      `SELECT id, base_adapter, candidate_adapter, traffic_split,
              started_at, ended_at, status, base_metrics, candidate_metrics, result
       FROM rl_ab_tests
       ORDER BY started_at DESC
       LIMIT $1`,
      [limit],
    );

    const parseMetrics = (m: ABTestMetrics | string): ABTestMetrics => {
      if (typeof m === 'string') {
        try { return JSON.parse(m) as ABTestMetrics; } catch { return defaultMetrics(); }
      }
      return { ...defaultMetrics(), ...m };
    };

    return result.rows.map((r) => ({
      id: r.id,
      baseAdapter: r.base_adapter,
      candidateAdapter: r.candidate_adapter,
      trafficSplit: parseFloat(String(r.traffic_split)),
      startedAt: r.started_at,
      endedAt: r.ended_at,
      status: r.status as ABTest['status'],
      baseMetrics: parseMetrics(r.base_metrics),
      candidateMetrics: parseMetrics(r.candidate_metrics),
      result: r.result,
    }));
  }
}
