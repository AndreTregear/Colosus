/**
 * RL Pipeline & PII Scrubber — comprehensive tests.
 *
 * Categories:
 *  1. PII Scrubber (pure, no deps)
 *  2. Rollout Collector (appBus + temp JSONL, fake timers)
 *  3. A/B Test Manager (PostgreSQL)
 *  4. Training Scheduler (PostgreSQL + mocks)
 */
import { vi, describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

// Hoist env var so the rollout-collector module-level const picks it up
const TEST_ROLLOUT_DIR = vi.hoisted(() => {
  const dir = `/tmp/rl-test-${process.pid}`;
  process.env.RL_ROLLOUT_DIR = dir;
  return dir;
});

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  scrubPII,
  scrubConversation,
  RolloutCollector,
  ABTestManager,
  TrainingScheduler,
} from '../src/rl/index.js';
import { appBus } from '../src/shared/events.js';
import { query } from '../src/db/pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Probe DB connectivity (top-level await) so DB-dependent suites skip cleanly
let dbAvailable = false;
try {
  await query('SELECT 1');
  dbAvailable = true;
} catch {
  // PostgreSQL not reachable — A/B and Training Scheduler tests will be skipped
}

// ── Helpers ──

function emitMsg(direction: 'incoming' | 'outgoing', body: string, jid = '51999888777@s.whatsapp.net'): void {
  appBus.emit('message-logged', {
    jid,
    tenantId: 'test-tenant',
    direction,
    body,
    timestamp: new Date().toISOString(),
  });
}

function readJsonl(): unknown[] {
  const results: unknown[] = [];
  for (const f of fs.readdirSync(TEST_ROLLOUT_DIR).filter((n) => n.endsWith('.jsonl'))) {
    for (const line of fs.readFileSync(path.join(TEST_ROLLOUT_DIR, f), 'utf-8').split('\n')) {
      if (line.trim()) results.push(JSON.parse(line));
    }
  }
  return results;
}

// ═══════════════════════════════════════════════════════════════════════
// 1. PII Scrubber (pure, no dependencies)
// ═══════════════════════════════════════════════════════════════════════

describe('PII Scrubber', () => {
  // ── Phone numbers ──

  it.each([
    ['+51 987 654 321', 'Llama al +51 987 654 321', 'Llama al [PHONE]'],
    ['51 987654321', 'Su cel es 51 987654321', 'Su cel es [PHONE]'],
    ['9XXXXXXXX', 'Manda al 987654321', 'Manda al [PHONE]'],
  ])('replaces phone %s → [PHONE]', (_label, input, expected) => {
    expect(scrubPII(input)).toBe(expected);
  });

  // ── Emails ──

  it('replaces emails → [EMAIL]', () => {
    expect(scrubPII('Escribe a juan.perez@gmail.com hoy')).toBe('Escribe a [EMAIL] hoy');
  });

  // ── RUC ──

  it('replaces RUC 10XXXXXXXXX → [RUC]', () => {
    expect(scrubPII('RUC 10123456789')).toBe('RUC [RUC]');
  });

  it('replaces RUC 20XXXXXXXXX → [RUC]', () => {
    expect(scrubPII('factura a 20567890123')).toBe('factura a [RUC]');
  });

  // ── DNI ──

  it('replaces DNI with context keyword → [DNI]', () => {
    expect(scrubPII('DNI: 12345678')).toBe('[DNI]');
    expect(scrubPII('documento 87654321')).toBe('[DNI]');
  });

  it('replaces standalone 8-digit numbers as potential DNI', () => {
    expect(scrubPII('código 87654321 listo')).toBe('código [DNI] listo');
  });

  // ── Amounts ──

  it.each([
    ['S/100', 'cuesta S/100', 'cuesta [AMOUNT]'],
    ['S/.50.00', 'pago de S/.50.00', 'pago de [AMOUNT]'],
    ['S/ 2,545', 'total S/ 2,545', 'total [AMOUNT]'],
  ])('replaces amount %s → [AMOUNT]', (_label, input, expected) => {
    expect(scrubPII(input)).toBe(expected);
  });

  // ── Yape / Plin sender names ──

  it('replaces Yape sender name → [CUSTOMER_NAME]', () => {
    expect(scrubPII('Yape de María García')).toBe('Yape de [CUSTOMER_NAME]');
  });

  it('replaces Plin sender name → [CUSTOMER_NAME]', () => {
    expect(scrubPII('Plin de Juan Carlos')).toBe('Plin de [CUSTOMER_NAME]');
  });

  // ── Names after context patterns ──

  it('replaces name after "Cliente:"', () => {
    expect(scrubPII('Cliente: Pedro Sánchez')).toBe('Cliente: [CUSTOMER_NAME]');
  });

  it('replaces name after "Señora"', () => {
    expect(scrubPII('Señora Ana López llegó')).toBe('Señora [CUSTOMER_NAME] llegó');
  });

  // ── Multiple PII in one string ──

  it('scrubs multiple PII types in one string', () => {
    const input = 'Cliente: Rosa Flores, tel +51 999 888 777, DNI: 12345678, pago S/250';
    const result = scrubPII(input);
    expect(result).toContain('[CUSTOMER_NAME]');
    expect(result).toContain('[PHONE]');
    expect(result).toContain('[DNI]');
    expect(result).toContain('[AMOUNT]');
    expect(result).not.toMatch(/Rosa|Flores|999.*888.*777|12345678|S\/250/);
  });

  // ── scrubConversation ──

  it('scrubConversation preserves roles and does not mutate original', () => {
    const msgs = [
      { role: 'user', content: 'Mi número es 987654321' },
      { role: 'assistant', content: 'Anotado, 987654321' },
    ];
    const result = scrubConversation(msgs);
    expect(result[0]).toEqual({ role: 'user', content: expect.stringContaining('[PHONE]') });
    expect(result[1]).toEqual({ role: 'assistant', content: expect.stringContaining('[PHONE]') });
    expect(msgs[0].content).toContain('987654321'); // original unchanged
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 2. Rollout Collector (appBus events + JSONL output, no DB)
// ═══════════════════════════════════════════════════════════════════════

describe('Rollout Collector', () => {
  let collector: RolloutCollector;

  beforeAll(() => fs.mkdirSync(TEST_ROLLOUT_DIR, { recursive: true }));
  afterAll(() => fs.rmSync(TEST_ROLLOUT_DIR, { recursive: true, force: true }));

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-23T12:00:00Z'));
    // Clean rollout files between tests
    for (const f of fs.readdirSync(TEST_ROLLOUT_DIR)) fs.unlinkSync(path.join(TEST_ROLLOUT_DIR, f));
    collector = new RolloutCollector();
    collector.start();
  });

  afterEach(() => {
    collector.stop();
    appBus.removeAllListeners();
    vi.useRealTimers();
  });

  it('captures incoming + outgoing messages as turns', () => {
    emitMsg('incoming', 'hola');
    emitMsg('outgoing', 'bienvenido');
    emitMsg('incoming', 'gracias'); // scores the assistant turn → enables flush
    collector.stop();

    const turns = (readJsonl()[0] as any).turns;
    expect(turns).toHaveLength(3);
    expect(turns[0]).toMatchObject({ role: 'user', content: 'hola' });
    expect(turns[1]).toMatchObject({ role: 'assistant', content: 'bienvenido' });
    expect(turns[2]).toMatchObject({ role: 'user', content: 'gracias' });
  });

  it('scores positive feedback (gracias, perfecto) as reward +1', () => {
    emitMsg('incoming', 'quiero pizza');
    emitMsg('outgoing', 'tenemos hawaiana');
    emitMsg('incoming', 'perfecto, gracias!');
    collector.stop();

    const assistant = (readJsonl()[0] as any).turns.find((t: any) => t.role === 'assistant');
    expect(assistant.reward).toBe(1);
    expect(assistant.rewardSource).toBe('explicit');
  });

  it('scores emoji feedback (👍) as reward +1', () => {
    emitMsg('incoming', 'info');
    emitMsg('outgoing', 'aquí tienes');
    emitMsg('incoming', '👍');
    collector.stop();

    const assistant = (readJsonl()[0] as any).turns.find((t: any) => t.role === 'assistant');
    expect(assistant.reward).toBe(1);
  });

  it('scores correction patterns (está mal, incorrecto) as reward -1', () => {
    emitMsg('incoming', 'precio de la grande');
    emitMsg('outgoing', 'cuesta 25 soles');
    emitMsg('incoming', 'eso está mal, es 20');
    collector.stop();

    const assistant = (readJsonl()[0] as any).turns.find((t: any) => t.role === 'assistant');
    expect(assistant.reward).toBe(-1);
    expect(assistant.rewardSource).toBe('correction');
  });

  it('detects re-query via Jaccard similarity → reward -1', () => {
    emitMsg('incoming', 'quiero pedir una pizza grande');
    emitMsg('outgoing', 'procesando tu orden');
    // Similar message (Jaccard ≈ 0.8 ≥ 0.6 threshold)
    emitMsg('incoming', 'quiero pedir pizza grande');
    collector.stop();

    const assistant = (readJsonl()[0] as any).turns.find((t: any) => t.role === 'assistant');
    expect(assistant.reward).toBe(-1);
    expect(assistant.rewardSource).toBe('requery');
  });

  it('scores silence timeout as neutral (reward 0)', () => {
    emitMsg('incoming', 'hola');
    emitMsg('outgoing', 'buenas tardes');

    vi.advanceTimersByTime(5 * 60 * 1000); // 5-min silence timeout fires
    collector.stop();

    const assistant = (readJsonl()[0] as any).turns.find((t: any) => t.role === 'assistant');
    expect(assistant.reward).toBe(0);
    expect(assistant.rewardSource).toBe('silence');
  });

  it('creates new session after 30-min gap', () => {
    // Session 1
    emitMsg('incoming', 'hola');
    emitMsg('outgoing', 'buenas');
    emitMsg('incoming', 'gracias'); // scores → session 1 can flush

    vi.advanceTimersByTime(31 * 60 * 1000); // exceed 30-min session timeout

    // Session 2 (old session flushed, new one created)
    emitMsg('incoming', 'otra consulta');
    emitMsg('outgoing', 'dime');
    emitMsg('incoming', 'listo'); // scores → session 2 can flush
    collector.stop();

    expect(readJsonl()).toHaveLength(2); // two separate trajectories
  });

  it('applies PII scrubbing to trajectory content', () => {
    emitMsg('incoming', 'mi cel es 987654321');
    emitMsg('outgoing', 'anotado el 987654321');
    emitMsg('incoming', 'ok');
    collector.stop();

    const turns = (readJsonl()[0] as any).turns;
    expect(turns[0].content).toContain('[PHONE]');
    expect(turns[0].content).not.toContain('987654321');
    expect(turns[1].content).toContain('[PHONE]');
  });

  it('writes valid JSONL with sessionId, turns, completedAt', () => {
    emitMsg('incoming', 'test');
    emitMsg('outgoing', 'response');
    emitMsg('incoming', 'bien');
    collector.stop();

    const entry = readJsonl()[0] as any;
    expect(entry.sessionId).toMatch(/^test-tenant_/);
    expect(Array.isArray(entry.turns)).toBe(true);
    expect(typeof entry.completedAt).toBe('number');
    expect(entry).not.toHaveProperty('tenantId'); // stripped from output
  });

  it('marks failed AI jobs with reward -1 and [AGENT_ERROR]', () => {
    emitMsg('incoming', 'necesito ayuda');
    appBus.emit('ai-job-failed', 'test-tenant', '51999888777@s.whatsapp.net', 'timeout');
    collector.stop();

    const turns = (readJsonl()[0] as any).turns;
    const errTurn = turns.find((t: any) => t.content === '[AGENT_ERROR]');
    expect(errTurn).toBeDefined();
    expect(errTurn.role).toBe('assistant');
    expect(errTurn.reward).toBe(-1);
    expect(errTurn.rewardSource).toBe('correction');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 3. A/B Test Manager (requires PostgreSQL)
// ═══════════════════════════════════════════════════════════════════════

describe.skipIf(!dbAvailable)('A/B Test Manager', () => {
  let mgr: ABTestManager;

  beforeAll(async () => {
    const sql = fs.readFileSync(path.join(__dirname, '..', 'schema-rl.sql'), 'utf-8');
    await query(sql);
  });

  beforeEach(async () => {
    await query('DELETE FROM rl_ab_tests');
    mgr = new ABTestManager();
  });

  afterEach(() => mgr.stop());

  it('creates a test and verifies only one active at a time', async () => {
    const id = await mgr.createTest('adapter-v1', 'adapter-v2');
    expect(id).toBeGreaterThan(0);

    const active = await mgr.getActiveTest();
    expect(active!.status).toBe('running');
    expect(active!.baseAdapter).toBe('adapter-v1');
    expect(active!.candidateAdapter).toBe('adapter-v2');
    expect(active!.trafficSplit).toBeCloseTo(0.10);

    await expect(mgr.createTest('adapter-v1', 'adapter-v3')).rejects.toThrow(/already running/);
  });

  it('routes request based on traffic split', async () => {
    await mgr.createTest('base-v1', 'candidate-v2', 0.10);
    const spy = vi.spyOn(Math, 'random');

    spy.mockReturnValueOnce(0.05); // < 0.10 → candidate
    const r1 = await mgr.routeRequest();
    expect(r1!.variant).toBe('candidate');
    expect(r1!.adapter).toBe('candidate-v2');

    spy.mockReturnValueOnce(0.50); // ≥ 0.10 → base
    expect((await mgr.routeRequest())!.variant).toBe('base');

    spy.mockRestore();
  });

  it('returns null routing when no test is active', async () => {
    expect(await mgr.routeRequest()).toBeNull();
  });

  it('records interactions and updates metrics', async () => {
    await mgr.createTest('base', 'candidate');

    await mgr.recordInteraction('base', false, true); // positive, no requery
    await mgr.recordInteraction('base', true, false); // requery, not positive
    await mgr.recordInteraction('candidate', false, true); // positive

    const t = await mgr.getActiveTest();
    expect(t!.baseMetrics.interactions).toBe(2);
    expect(t!.baseMetrics.positiveFeedback).toBe(0.5);
    expect(t!.baseMetrics.reQueryRate).toBe(0.5);
    expect(t!.candidateMetrics.interactions).toBe(1);
    expect(t!.candidateMetrics.positiveFeedback).toBe(1);
  });

  it('promotes candidate when improvement ≥ 5%', async () => {
    const id = await mgr.createTest('base', 'candidate');
    // Set metrics: candidate significantly better (score = 0.20*0.6 + 0.10*0.4 = 0.16 ≥ 0.05)
    await query('UPDATE rl_ab_tests SET base_metrics=$1, candidate_metrics=$2 WHERE id=$3', [
      JSON.stringify({ interactions: 50, reQueryRate: 0.15, positiveFeedback: 0.60 }),
      JSON.stringify({ interactions: 50, reQueryRate: 0.05, positiveFeedback: 0.80 }),
      id,
    ]);

    await (mgr as any).evaluateActiveTests();

    const [test] = await mgr.getRecentTests(1);
    expect(test.status).toBe('promoted');
    expect(test.endedAt).not.toBeNull();
    expect(test.result).toContain('Candidate improved');
  });

  it('rolls back when candidate does not improve enough', async () => {
    const id = await mgr.createTest('base', 'candidate');
    // Candidate worse (score = -0.05*0.6 + 0*0.4 = -0.03 < 0.05)
    await query('UPDATE rl_ab_tests SET base_metrics=$1, candidate_metrics=$2 WHERE id=$3', [
      JSON.stringify({ interactions: 50, reQueryRate: 0.10, positiveFeedback: 0.60 }),
      JSON.stringify({ interactions: 50, reQueryRate: 0.10, positiveFeedback: 0.55 }),
      id,
    ]);

    await (mgr as any).evaluateActiveTests();

    const [test] = await mgr.getRecentTests(1);
    expect(test.status).toBe('rolled-back');
    expect(test.result).toContain('did not improve');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 4. Training Scheduler (requires PostgreSQL + mocks)
// ═══════════════════════════════════════════════════════════════════════

describe.skipIf(!dbAvailable)('Training Scheduler', () => {
  let scheduler: TrainingScheduler;
  let mockCollector: RolloutCollector;

  beforeAll(async () => {
    const sql = fs.readFileSync(path.join(__dirname, '..', 'schema-rl.sql'), 'utf-8');
    await query(sql);
  });

  beforeEach(async () => {
    await query('DELETE FROM rl_training_runs');
    mockCollector = { countScoredTurnsToday: vi.fn().mockReturnValue(0) } as unknown as RolloutCollector;
    scheduler = new TrainingScheduler(mockCollector);
  });

  afterEach(() => {
    scheduler.stop();
    vi.useRealTimers();
  });

  it('detects off-peak hours (00:00-06:00 Lima / UTC-5)', () => {
    vi.useFakeTimers();

    // Lima 02:00 → off-peak
    vi.setSystemTime(new Date('2026-03-23T07:00:00Z'));
    expect((scheduler as any).isOffPeak()).toBe(true);

    // Lima 10:00 → NOT off-peak
    vi.setSystemTime(new Date('2026-03-23T15:00:00Z'));
    expect((scheduler as any).isOffPeak()).toBe(false);

    // Lima 00:00 → off-peak (boundary)
    vi.setSystemTime(new Date('2026-03-23T05:00:00Z'));
    expect((scheduler as any).isOffPeak()).toBe(true);
  });

  it('skips when not enough scored turns', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-23T07:00:00Z'));
    (mockCollector.countScoredTurnsToday as any).mockReturnValue(10); // < 50

    await (scheduler as any).check();

    expect((await query('SELECT * FROM rl_training_runs')).rows).toHaveLength(0);
  });

  it('skips when training already in progress', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-23T07:00:00Z'));
    (mockCollector.countScoredTurnsToday as any).mockReturnValue(100);
    (scheduler as any).trainingInProgress = true;

    await (scheduler as any).check();

    expect((await query('SELECT * FROM rl_training_runs')).rows).toHaveLength(0);
  });

  it('records training run in DB when conditions are met', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-23T07:00:00Z'));
    (mockCollector.countScoredTurnsToday as any).mockReturnValue(60);
    vi.spyOn(scheduler as any, 'executeTraining').mockResolvedValue('/opt/adapters/run-1');

    await (scheduler as any).check();

    const { rows } = await query<{
      status: string;
      trajectories_count: number;
      adapter_path: string;
    }>('SELECT status, trajectories_count, adapter_path FROM rl_training_runs');

    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe('completed');
    expect(rows[0].trajectories_count).toBe(60);
    expect(rows[0].adapter_path).toBe('/opt/adapters/run-1');
  });
});
