/**
 * Rollout Collector — captures OpenClaw agent conversations for RL training.
 *
 * Hooks into autobot's message pipeline (appBus events) to collect:
 * - User messages (input)
 * - Agent responses (output)
 * - Next-state signals (user's reaction to the response)
 *
 * Writes PII-scrubbed trajectories to JSONL files for the RL trainer.
 */

import fs from 'node:fs';
import path from 'node:path';
import { appBus } from '../shared/events.js';
import { scrubPII } from '../ai/pii-scrubber.js';
import { logger } from '../shared/logger.js';
import type { MessageLog } from '../shared/types.js';

// ── Types ──

export interface TrajectoryTurn {
  role: 'user' | 'assistant';
  content: string; // PII-scrubbed
  reward?: number; // -1, 0, +1
  rewardSource?: 'explicit' | 'requery' | 'correction' | 'silence';
  timestamp: number;
}

export interface Trajectory {
  sessionId: string;
  tenantId: string;
  turns: TrajectoryTurn[];
  completedAt?: number;
}

// ── Reward signal detection ──

const POSITIVE_PATTERNS = [
  /\b(?:gracias|perfecto|listo|genial|excelente|ok(?:ay)?|bien|correcto|exacto|buenísimo)\b/i,
  /👍|✅|🙏|💯|🎉/,
];

const CORRECTION_PATTERNS = [
  /\b(?:no[,.]?\s+(?:es|era|eso)|está\s*mal|incorrecto|equivocado|error|te\s+equivocas)\b/i,
  /\b(?:corrige|corrígeme|corregir|no\s+así)\b/i,
];

const REQUERY_MIN_SIMILARITY = 0.6;

// ── Session management ──

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const SILENCE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const ROLLOUT_DIR = process.env.RL_ROLLOUT_DIR || '/tmp/rl-rollouts';

function sessionKey(tenantId: string, jid: string): string {
  return `${tenantId}:${jid}`;
}

/** Simple Jaccard similarity on word sets for re-query detection. */
function textSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(Boolean));
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(Boolean));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let intersection = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) intersection++;
  }
  return intersection / (wordsA.size + wordsB.size - intersection);
}

function todayFileName(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `rollouts-${yyyy}-${mm}-${dd}.jsonl`;
}

// ── Collector ──

export class RolloutCollector {
  /** Active sessions: key → trajectory */
  private sessions = new Map<string, Trajectory>();
  /** Timer refs for silence detection */
  private silenceTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private running = false;

  start(): void {
    if (this.running) return;
    this.running = true;

    // Ensure output directory exists
    fs.mkdirSync(ROLLOUT_DIR, { recursive: true });

    appBus.on('message-logged', (msg) => this.handleMessage(msg));
    appBus.on('ai-job-completed', (tenantId, jid) => this.handleJobCompleted(tenantId, jid));
    appBus.on('ai-job-failed', (tenantId, jid, reason) => this.handleJobFailed(tenantId, jid, reason));

    logger.info({ rolloutDir: ROLLOUT_DIR }, 'Rollout collector started');
  }

  stop(): void {
    this.running = false;
    // Flush all open sessions
    for (const [key, trajectory] of this.sessions) {
      this.flushTrajectory(trajectory);
      this.sessions.delete(key);
    }
    for (const timer of this.silenceTimers.values()) {
      clearTimeout(timer);
    }
    this.silenceTimers.clear();
    logger.info('Rollout collector stopped');
  }

  /** Get or create a session for a tenant+jid pair. */
  private getOrCreateSession(tenantId: string, jid: string): Trajectory {
    const key = sessionKey(tenantId, jid);
    const existing = this.sessions.get(key);

    if (existing) {
      const lastTurn = existing.turns[existing.turns.length - 1];
      const elapsed = lastTurn ? Date.now() - lastTurn.timestamp : Infinity;
      if (elapsed < SESSION_TIMEOUT_MS) {
        return existing;
      }
      // Session expired — flush and create new
      this.flushTrajectory(existing);
    }

    const session: Trajectory = {
      sessionId: `${tenantId}_${jid}_${Date.now()}`,
      tenantId,
      turns: [],
    };
    this.sessions.set(key, session);
    return session;
  }

  /** Process an incoming or outgoing message. */
  private handleMessage(msg: MessageLog): void {
    if (!this.running || !msg.tenantId) return;

    const tenantId = msg.tenantId;
    const jid = msg.jid;
    const key = sessionKey(tenantId, jid);
    const session = this.getOrCreateSession(tenantId, jid);

    if (msg.direction === 'incoming') {
      // Check for next-state signals on the previous assistant turn
      this.scoreLastAssistantTurn(session, msg.body);

      session.turns.push({
        role: 'user',
        content: scrubPII(msg.body),
        timestamp: Date.now(),
      });
    } else if (msg.direction === 'outgoing') {
      session.turns.push({
        role: 'assistant',
        content: scrubPII(msg.body),
        timestamp: Date.now(),
      });

      // Start silence timer — if user doesn't respond within 5 min, mark neutral
      this.resetSilenceTimer(key, session);
    }
  }

  /** When an AI job completes, the assistant turn is already logged via message-logged. */
  private handleJobCompleted(_tenantId: string, _jid: string): void {
    // No-op: the response is captured via the 'message-logged' event.
    // This hook exists for future enrichment (e.g., tool call capture).
  }

  /** When an AI job fails, mark the session with a negative signal. */
  private handleJobFailed(tenantId: string, jid: string, _reason: string): void {
    const session = this.getOrCreateSession(tenantId, jid);
    // If the last turn was from the user, add a synthetic failed-assistant turn
    const lastTurn = session.turns[session.turns.length - 1];
    if (lastTurn?.role === 'user') {
      session.turns.push({
        role: 'assistant',
        content: '[AGENT_ERROR]',
        reward: -1,
        rewardSource: 'correction',
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Score the previous assistant turn based on the user's next message.
   * This is the "next-state signal" from OpenClaw-RL.
   */
  private scoreLastAssistantTurn(session: Trajectory, userMessage: string): void {
    const lastAssistant = this.findLastUnscored(session, 'assistant');
    if (!lastAssistant) return;

    // Positive feedback?
    if (POSITIVE_PATTERNS.some((p) => p.test(userMessage))) {
      lastAssistant.reward = 1;
      lastAssistant.rewardSource = 'explicit';
      return;
    }

    // Correction?
    if (CORRECTION_PATTERNS.some((p) => p.test(userMessage))) {
      lastAssistant.reward = -1;
      lastAssistant.rewardSource = 'correction';
      return;
    }

    // Re-query? Compare with the previous user message
    const lastUser = this.findLastTurn(session, 'user');
    if (lastUser && textSimilarity(lastUser.content, userMessage) >= REQUERY_MIN_SIMILARITY) {
      lastAssistant.reward = -1;
      lastAssistant.rewardSource = 'requery';
      return;
    }

    // Default: neutral (user continued conversation normally)
    lastAssistant.reward = 0;
    lastAssistant.rewardSource = 'silence';
  }

  private findLastUnscored(session: Trajectory, role: string): TrajectoryTurn | undefined {
    for (let i = session.turns.length - 1; i >= 0; i--) {
      const turn = session.turns[i];
      if (turn.role === role && turn.reward === undefined) return turn;
    }
    return undefined;
  }

  private findLastTurn(session: Trajectory, role: string): TrajectoryTurn | undefined {
    for (let i = session.turns.length - 1; i >= 0; i--) {
      if (session.turns[i].role === role) return session.turns[i];
    }
    return undefined;
  }

  /** Start/reset a timer that marks the last assistant turn as neutral on silence. */
  private resetSilenceTimer(key: string, session: Trajectory): void {
    const existing = this.silenceTimers.get(key);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      const lastAssistant = this.findLastUnscored(session, 'assistant');
      if (lastAssistant) {
        lastAssistant.reward = 0;
        lastAssistant.rewardSource = 'silence';
      }
      this.silenceTimers.delete(key);
    }, SILENCE_TIMEOUT_MS);

    // Prevent timer from blocking process exit
    timer.unref();
    this.silenceTimers.set(key, timer);
  }

  /** Write a completed trajectory to the daily JSONL file. */
  private flushTrajectory(trajectory: Trajectory): void {
    // Only flush if we have at least one scored assistant turn
    const scoredTurns = trajectory.turns.filter((t) => t.role === 'assistant' && t.reward !== undefined);
    if (scoredTurns.length === 0) return;

    trajectory.completedAt = Date.now();

    // Strip tenantId from the output (kept only for session grouping)
    const output = {
      sessionId: trajectory.sessionId,
      turns: trajectory.turns.map(({ role, content, reward, rewardSource }) => ({
        role,
        content,
        ...(reward !== undefined ? { reward, rewardSource } : {}),
      })),
      completedAt: trajectory.completedAt,
    };

    const filePath = path.join(ROLLOUT_DIR, todayFileName());

    try {
      fs.appendFileSync(filePath, JSON.stringify(output) + '\n');
      logger.debug(
        { sessionId: trajectory.sessionId, turns: trajectory.turns.length, scored: scoredTurns.length },
        'Flushed trajectory',
      );
    } catch (err) {
      logger.error({ err, filePath }, 'Failed to write rollout trajectory');
    }
  }

  /** Expose session count for monitoring. */
  getActiveSessionCount(): number {
    return this.sessions.size;
  }

  /** Count scored turns across all today's rollouts (for training threshold). */
  countScoredTurnsToday(): number {
    const filePath = path.join(ROLLOUT_DIR, todayFileName());
    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      let count = 0;
      for (const line of data.split('\n')) {
        if (!line.trim()) continue;
        try {
          const traj = JSON.parse(line) as { turns: Array<{ reward?: number }> };
          count += traj.turns.filter((t) => t.reward !== undefined).length;
        } catch {
          // skip malformed lines
        }
      }
      return count;
    } catch {
      return 0;
    }
  }
}
