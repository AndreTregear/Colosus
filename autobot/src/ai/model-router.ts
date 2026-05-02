/**
 * Model Router — intelligent routing between local and HPC backends.
 *
 * Infrastructure:
 *   Local:  Qwen3.5-35B-A3B  @ :8000  (65K ctx, ~2s latency)
 *   HPC:    Qwen3.5-122B     @ :18080 (262K ctx, ~4s latency, higher accuracy)
 *   HPC ASR: Qwen3-ASR-1.7B  @ :18082 (OpenAI-compatible /v1/audio/transcriptions)
 *   HPC TTS: Qwen3-TTS-1.7B  @ :18083 (OpenAI-compatible /v1/audio/speech, 9 voices)
 *
 * Routing strategy:
 *   - Customer chat (simple queries, quick replies) → LOCAL (speed wins)
 *   - Agentic tasks (multi-tool, CEO reports, complex reasoning) → HPC (accuracy wins)
 *   - STT → HPC ASR (dedicated model, no contention with LLM)
 *   - TTS → HPC TTS (9 voices, better quality)
 *   - Fallback: if HPC is down, route everything to LOCAL
 */

import { createOpenAI } from '@ai-sdk/openai';
import { logger } from '../shared/logger.js';

// ── Backend Config ──

export interface ModelBackend {
  name: string;
  baseURL: string;
  apiKey: string;
  model: string;
  maxContext: number;
  healthy: boolean;
  lastCheck: number;
  avgLatencyMs: number;
  requestCount: number;
  /** Circuit breaker: consecutive failure count */
  consecutiveFailures: number;
  /** Circuit breaker: 'closed' = normal, 'open' = tripped (skip requests) */
  circuitState: 'closed' | 'open';
  /** Timestamp when circuit was opened — used to know when to retry */
  circuitOpenedAt: number;
}

// Local LLM (vLLM `:8000`, Qwen3.6-35B-A3B AWQ). Bearer is supplied per-env
// via YAYA_LLM_KEY (or legacy VLLM_API_KEY / AI_API_KEY); no default literal
// so no key ships in the bundle.
const LOCAL_BASE = process.env.YAYA_LLM_URL || process.env.VLLM_API_BASE || 'http://localhost:8000/v1';
const LOCAL_KEY = process.env.YAYA_LLM_KEY || process.env.VLLM_API_KEY || process.env.AI_API_KEY || '';
const LOCAL_MODEL = process.env.YAYA_LLM_MODEL || process.env.VLLM_MODEL || 'cyankiwi/Qwen3.6-35B-A3B-AWQ-4bit';

const HPC_BASE = process.env.HPC_API_BASE || 'http://localhost:18080/v1';
const HPC_KEY = process.env.HPC_API_KEY || LOCAL_KEY;
const HPC_MODEL = process.env.HPC_MODEL || 'qwen3.5-122b';

export const HPC_ASR_BASE = process.env.HPC_ASR_BASE || 'http://localhost:18082/v1';
export const HPC_TTS_BASE = process.env.HPC_TTS_BASE || 'http://localhost:18083/v1';
export const HPC_TTS_VOICE = process.env.HPC_TTS_VOICE || 'vivian'; // Spanish-friendly

// ── Backends ──

export const backends: Record<string, ModelBackend> = {
  local: {
    name: 'local',
    baseURL: LOCAL_BASE,
    apiKey: LOCAL_KEY,
    model: LOCAL_MODEL,
    maxContext: 65_536,
    healthy: true,
    lastCheck: 0,
    avgLatencyMs: 0,
    requestCount: 0,
    consecutiveFailures: 0,
    circuitState: 'closed',
    circuitOpenedAt: 0,
  },
  hpc: {
    name: 'hpc',
    baseURL: HPC_BASE,
    apiKey: HPC_KEY,
    model: HPC_MODEL,
    maxContext: 262_144,
    healthy: true,
    lastCheck: 0,
    avgLatencyMs: 0,
    requestCount: 0,
    consecutiveFailures: 0,
    circuitState: 'closed',
    circuitOpenedAt: 0,
  },
};

// ── Health Checks & Circuit Breaker ──

const HEALTH_CHECK_INTERVAL_MS = 30_000; // 30s
const CIRCUIT_BREAKER_THRESHOLD = 3;     // consecutive failures to trip
const CIRCUIT_BREAKER_COOLDOWN_MS = 60_000; // 60s before retrying a tripped backend

async function checkHealth(backend: ModelBackend): Promise<boolean> {
  try {
    const res = await fetch(`${backend.baseURL}/models`, {
      headers: { Authorization: `Bearer ${backend.apiKey}` },
      signal: AbortSignal.timeout(3000),
    });
    backend.lastCheck = Date.now();
    if (res.ok) {
      // Success — reset circuit breaker
      backend.healthy = true;
      backend.consecutiveFailures = 0;
      if (backend.circuitState === 'open') {
        logger.info({ backend: backend.name }, 'Circuit breaker closed — backend recovered');
      }
      backend.circuitState = 'closed';
    } else {
      backend.healthy = false;
      backend.consecutiveFailures++;
      if (backend.consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD && backend.circuitState === 'closed') {
        backend.circuitState = 'open';
        backend.circuitOpenedAt = Date.now();
        logger.warn({ backend: backend.name, failures: backend.consecutiveFailures }, 'Circuit breaker OPEN — too many consecutive failures');
      }
    }
    return backend.healthy;
  } catch {
    backend.healthy = false;
    backend.lastCheck = Date.now();
    backend.consecutiveFailures++;
    if (backend.consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD && backend.circuitState === 'closed') {
      backend.circuitState = 'open';
      backend.circuitOpenedAt = Date.now();
      logger.warn({ backend: backend.name, failures: backend.consecutiveFailures }, 'Circuit breaker OPEN — too many consecutive failures');
    }
    return false;
  }
}

export async function ensureHealthy(name: 'local' | 'hpc'): Promise<boolean> {
  const b = backends[name];

  // Circuit breaker: if open, don't attempt until cooldown expires
  if (b.circuitState === 'open') {
    const elapsed = Date.now() - b.circuitOpenedAt;
    if (elapsed < CIRCUIT_BREAKER_COOLDOWN_MS) {
      // Still in cooldown — report unhealthy without hitting the endpoint
      return false;
    }
    // Cooldown expired — allow a probe to see if backend recovered
    logger.info({ backend: name, cooldownMs: elapsed }, 'Circuit breaker cooldown expired, probing backend');
  }

  if (Date.now() - b.lastCheck < HEALTH_CHECK_INTERVAL_MS) return b.healthy;
  return checkHealth(b);
}

/** Update running average latency for a backend. */
export function recordLatency(name: 'local' | 'hpc', ms: number): void {
  const b = backends[name];
  b.requestCount++;
  // Exponential moving average (α = 0.3)
  b.avgLatencyMs = b.requestCount === 1 ? ms : b.avgLatencyMs * 0.7 + ms * 0.3;
}

// ── Route Classification ──

export type RouteTarget = 'local' | 'hpc';

/**
 * Determine which backend to use based on task characteristics.
 *
 * LOCAL (35B, 65K ctx) — fast, for simple customer interactions:
 *   - Faster responses (~2.4s avg)
 *   - Customer-facing WhatsApp chats (speed wins)
 *
 * HPC (122B, 262K ctx) — accurate, for complex/agentic tasks:
 *   - Better text generation quality
 *   - Longer context window (262K vs 65K)
 *   - Tool calling now works (BUG-001 fixed via hpcFetch post-processing)
 *   - CEO/owner dashboard queries, multi-tool chains
 *
 * Routing: owner/agentic → HPC, customer chat → LOCAL.
 */
export function classifyRoute(opts: {
  isOwner?: boolean;
  messageLength?: number;
  historyLength?: number;
  needsTools?: boolean;
  forceBackend?: RouteTarget;
}): RouteTarget {
  // Explicit override
  if (opts.forceBackend) return opts.forceBackend;

  // Owner/CEO tasks benefit from HPC accuracy
  if (opts.isOwner) return 'hpc';

  // Default: local for speed on customer-facing chats
  return 'local';
}

// ── AI SDK Provider Factory ──

/**
 * BUG-001 fix: HPC Qwen3.5-122B tool-call function name mangling.
 *
 * The HPC model generates BOTH the structured tool_call AND a text-based
 * `<function=...>` format. vLLM doesn't strip the text portion, so function
 * names arrive as e.g. "product-catalog\n<function=product-catalog".
 *
 * This custom fetch wrapper intercepts chat/completions responses and strips
 * everything after the first newline in tool call function names.
 */
const hpcFetch: typeof globalThis.fetch = async (input, init) => {
  const res = await globalThis.fetch(input, init);
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;
  if (url.includes('/chat/completions')) {
    const body = await res.json();
    let cleaned = false;
    for (const choice of (body as any).choices || []) {
      for (const tc of choice.message?.tool_calls || []) {
        if (tc.function?.name && tc.function.name.includes('\n')) {
          const original = tc.function.name;
          tc.function.name = tc.function.name.split('\n')[0].trim();
          cleaned = true;
          logger.debug({ original, cleaned: tc.function.name }, 'BUG-001: cleaned mangled tool call name');
        }
      }
      // Also clean streaming delta tool calls if present
      for (const tc of choice.delta?.tool_calls || []) {
        if (tc.function?.name && tc.function.name.includes('\n')) {
          tc.function.name = tc.function.name.split('\n')[0].trim();
          cleaned = true;
        }
      }
    }
    if (cleaned) {
      logger.info('BUG-001: post-processed HPC response to fix mangled tool call names');
    }
    return new Response(JSON.stringify(body), {
      status: res.status,
      statusText: res.statusText,
      headers: res.headers,
    });
  }
  return res;
};

const providers = new Map<string, ReturnType<typeof createOpenAI>>();

function getProvider(name: 'local' | 'hpc'): ReturnType<typeof createOpenAI> {
  if (!providers.has(name)) {
    const b = backends[name];
    providers.set(name, createOpenAI({
      apiKey: b.apiKey,
      baseURL: b.baseURL,
      ...(name === 'hpc' ? { fetch: hpcFetch } : {}),
    }));
  }
  return providers.get(name)!;
}

/** Get a Mastra-compatible model for the given backend. */
export function getModel(target: RouteTarget) {
  const b = backends[target];
  const provider = getProvider(target);
  return provider(b.model);
}

/** Get the model for a routed request, with automatic fallback. */
export async function getRoutedModel(opts: Parameters<typeof classifyRoute>[0]) {
  let target = classifyRoute(opts);

  // Check health, fallback if needed
  const healthy = await ensureHealthy(target);
  if (!healthy) {
    const fallback = target === 'hpc' ? 'local' : 'hpc';
    const fallbackHealthy = await ensureHealthy(fallback);
    if (fallbackHealthy) {
      logger.warn({ target, fallback }, `${target} unhealthy, falling back to ${fallback}`);
      target = fallback;
    } else {
      // Both down — try local anyway (it's on the same machine)
      logger.error('Both backends unhealthy, trying local as last resort');
      target = 'local';
    }
  }

  return { model: getModel(target), target, backend: backends[target] };
}

/** Get stats for all backends. */
export function getRouterStats() {
  return Object.fromEntries(
    Object.entries(backends).map(([name, b]) => [name, {
      healthy: b.healthy,
      model: b.model,
      maxContext: b.maxContext,
      avgLatencyMs: Math.round(b.avgLatencyMs),
      requestCount: b.requestCount,
      lastCheck: b.lastCheck ? new Date(b.lastCheck).toISOString() : 'never',
      circuitState: b.circuitState,
      consecutiveFailures: b.consecutiveFailures,
      circuitOpenedAt: b.circuitOpenedAt ? new Date(b.circuitOpenedAt).toISOString() : 'never',
    }]),
  );
}

// ── ASR / TTS Helpers ──

/** Check if HPC ASR is available. */
export async function isHpcAsrAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${HPC_ASR_BASE.replace('/v1', '')}/health`, {
      signal: AbortSignal.timeout(2000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Check if HPC TTS is available. */
export async function isHpcTtsAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${HPC_TTS_BASE.replace('/v1', '')}/health`, {
      signal: AbortSignal.timeout(2000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

logger.debug({
  local: `${LOCAL_BASE} (${LOCAL_MODEL})`,
  hpc: `${HPC_BASE} (${HPC_MODEL})`,
  hpcAsr: HPC_ASR_BASE,
  hpcTts: HPC_TTS_BASE,
}, 'Model router initialized');
