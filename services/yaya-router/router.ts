#!/usr/bin/env tsx
/**
 * Yaya Router — Smart load balancer for vLLM-Omni GPU workers.
 *
 * Routes inference requests across multiple GPU endpoints with:
 * - Health checking (periodic /v1/models pings)
 * - Weighted least-connections routing
 * - Sticky sessions for multi-turn conversations
 * - Request queuing with backpressure
 * - Graceful failover when workers go down
 * - Per-worker metrics (latency, success rate, throughput)
 *
 * Phase 1: Central router. Phase 2: Federated. Phase 3: Decentralized.
 *
 * Usage:
 *   WORKERS=http://hpc:8080,http://hpc:8081,http://hpc:8082,http://hpc:8083 tsx router.ts
 */

import http from 'http';

// ── Configuration ──

const PORT = parseInt(process.env.ROUTER_PORT || '8091');
const WORKERS_RAW = process.env.WORKERS || 'http://localhost:8080,http://localhost:8081,http://localhost:8082,http://localhost:8083';
const HEALTH_INTERVAL_MS = parseInt(process.env.HEALTH_INTERVAL_MS || '10000');
const WORKER_API_KEY = process.env.WORKER_API_KEY || 'omnimoney';
const ROUTER_API_KEY = process.env.ROUTER_API_KEY || ''; // Optional auth for clients
const MAX_QUEUE_PER_WORKER = parseInt(process.env.MAX_QUEUE_PER_WORKER || '50');
const REQUEST_TIMEOUT_MS = parseInt(process.env.REQUEST_TIMEOUT_MS || '60000');
const STICKY_TTL_MS = parseInt(process.env.STICKY_TTL_MS || '300000'); // 5 min session stickiness

// ── Worker State ──

interface WorkerState {
  url: string;
  healthy: boolean;
  activeConnections: number;
  totalRequests: number;
  totalErrors: number;
  avgLatencyMs: number;
  latencyWindow: number[]; // last N latencies
  lastHealthCheck: number;
  lastError: string | null;
  weight: number; // configurable weight (higher = more traffic)
}

const workers: WorkerState[] = WORKERS_RAW.split(',').map(url => ({
  url: url.trim(),
  healthy: true, // assume healthy until proven otherwise
  activeConnections: 0,
  totalRequests: 0,
  totalErrors: 0,
  avgLatencyMs: 0,
  latencyWindow: [],
  lastHealthCheck: 0,
  lastError: null,
  weight: 1,
}));

// ── Session Stickiness ──

const sessionMap = new Map<string, { workerIndex: number; expiresAt: number }>();

function cleanExpiredSessions() {
  const now = Date.now();
  for (const [key, val] of sessionMap) {
    if (val.expiresAt < now) sessionMap.delete(key);
  }
}

setInterval(cleanExpiredSessions, 60000);

// ── Worker Selection ──

function selectWorker(sessionKey?: string): WorkerState | null {
  // Check sticky session
  if (sessionKey) {
    const sticky = sessionMap.get(sessionKey);
    if (sticky && sticky.expiresAt > Date.now()) {
      const w = workers[sticky.workerIndex];
      if (w.healthy && w.activeConnections < MAX_QUEUE_PER_WORKER) {
        sticky.expiresAt = Date.now() + STICKY_TTL_MS; // refresh TTL
        return w;
      }
      // Worker unhealthy or overloaded — fall through to pick new one
      sessionMap.delete(sessionKey);
    }
  }

  // Weighted least-connections
  const healthy = workers
    .map((w, i) => ({ w, i }))
    .filter(({ w }) => w.healthy && w.activeConnections < MAX_QUEUE_PER_WORKER);

  if (healthy.length === 0) return null;

  // Score: lower is better
  // score = active_connections / weight - bonus for low latency
  let best = healthy[0];
  let bestScore = Infinity;

  for (const candidate of healthy) {
    const score = candidate.w.activeConnections / candidate.w.weight
      + (candidate.w.avgLatencyMs / 10000); // small latency factor
    if (score < bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  // Set sticky session
  if (sessionKey) {
    sessionMap.set(sessionKey, { workerIndex: best.i, expiresAt: Date.now() + STICKY_TTL_MS });
  }

  return best.w;
}

// ── Health Checking ──

async function checkWorkerHealth(worker: WorkerState): Promise<void> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const resp = await fetch(`${worker.url}/v1/models`, {
      headers: { 'Authorization': `Bearer ${WORKER_API_KEY}` },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (resp.ok) {
      if (!worker.healthy) {
        console.log(`[Router] Worker ${worker.url} is now HEALTHY`);
      }
      worker.healthy = true;
      worker.lastError = null;
    } else {
      worker.healthy = false;
      worker.lastError = `HTTP ${resp.status}`;
      console.warn(`[Router] Worker ${worker.url} health check failed: ${resp.status}`);
    }
  } catch (err: any) {
    worker.healthy = false;
    worker.lastError = err.message;
    if (worker.lastHealthCheck > 0) { // Don't spam on first check
      console.warn(`[Router] Worker ${worker.url} unreachable: ${err.message}`);
    }
  }
  worker.lastHealthCheck = Date.now();
}

async function runHealthChecks() {
  await Promise.allSettled(workers.map(w => checkWorkerHealth(w)));
}

// Initial health check, then periodic
runHealthChecks();
setInterval(runHealthChecks, HEALTH_INTERVAL_MS);

// ── Request Proxying ──

async function proxyRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  worker: WorkerState,
  body: Buffer,
): Promise<void> {
  const startTime = Date.now();
  worker.activeConnections++;
  worker.totalRequests++;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${WORKER_API_KEY}`,
      'Content-Type': req.headers['content-type'] || 'application/json',
    };

    // Forward accept header for streaming
    if (req.headers.accept) headers['Accept'] = req.headers.accept;

    const workerResp = await fetch(`${worker.url}${req.url}`, {
      method: req.method || 'POST',
      headers,
      body: ['GET', 'HEAD'].includes(req.method || '') ? undefined : body,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const latencyMs = Date.now() - startTime;

    // Update latency tracking
    worker.latencyWindow.push(latencyMs);
    if (worker.latencyWindow.length > 100) worker.latencyWindow.shift();
    worker.avgLatencyMs = worker.latencyWindow.reduce((a, b) => a + b, 0) / worker.latencyWindow.length;

    // Forward response headers
    res.writeHead(workerResp.status, {
      'Content-Type': workerResp.headers.get('content-type') || 'application/json',
      'X-Yaya-Worker': worker.url,
      'X-Yaya-Latency': String(latencyMs),
    });

    // Stream response body
    if (workerResp.body) {
      const reader = workerResp.body.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
      } finally {
        reader.releaseLock();
      }
    }

    res.end();
  } catch (err: any) {
    worker.totalErrors++;
    const latencyMs = Date.now() - startTime;

    if (err.name === 'AbortError') {
      res.writeHead(504, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Worker timeout', worker: worker.url, latencyMs }));
    } else {
      // Mark worker as potentially unhealthy after repeated errors
      if (worker.totalErrors > 3 && worker.totalErrors / worker.totalRequests > 0.3) {
        worker.healthy = false;
        console.warn(`[Router] Worker ${worker.url} marked unhealthy (error rate: ${(worker.totalErrors / worker.totalRequests * 100).toFixed(1)}%)`);
      }

      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Worker error', message: err.message, worker: worker.url }));
    }
  } finally {
    worker.activeConnections--;
  }
}

// ── HTTP Server ──

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // Router status endpoint
  if (req.url === '/status' || req.url === '/health') {
    const healthyCount = workers.filter(w => w.healthy).length;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: healthyCount > 0 ? 'ok' : 'degraded',
      workers: workers.map(w => ({
        url: w.url,
        healthy: w.healthy,
        activeConnections: w.activeConnections,
        totalRequests: w.totalRequests,
        totalErrors: w.totalErrors,
        avgLatencyMs: Math.round(w.avgLatencyMs),
        lastError: w.lastError,
      })),
      sessions: sessionMap.size,
      timestamp: new Date().toISOString(),
    }));
    return;
  }

  // Metrics endpoint (Prometheus-compatible)
  if (req.url === '/metrics') {
    const lines: string[] = [];
    for (const w of workers) {
      const label = `worker="${w.url}"`;
      lines.push(`yaya_worker_healthy{${label}} ${w.healthy ? 1 : 0}`);
      lines.push(`yaya_worker_active_connections{${label}} ${w.activeConnections}`);
      lines.push(`yaya_worker_total_requests{${label}} ${w.totalRequests}`);
      lines.push(`yaya_worker_total_errors{${label}} ${w.totalErrors}`);
      lines.push(`yaya_worker_avg_latency_ms{${label}} ${Math.round(w.avgLatencyMs)}`);
    }
    lines.push(`yaya_router_sessions ${sessionMap.size}`);
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(lines.join('\n') + '\n');
    return;
  }

  // Auth check (optional)
  if (ROUTER_API_KEY) {
    const auth = req.headers.authorization;
    if (!auth || !auth.includes(ROUTER_API_KEY)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
  }

  // Read request body
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  const body = Buffer.concat(chunks);

  // Extract session key for stickiness (use a user/tenant ID if available)
  let sessionKey: string | undefined;
  try {
    if (body.length > 0) {
      const parsed = JSON.parse(body.toString());
      // Use custom header or body field for session routing
      sessionKey = req.headers['x-session-id'] as string
        || parsed.user
        || parsed.session_id
        || undefined;
    }
  } catch { /* not JSON, that's fine */ }

  // Select worker
  const worker = selectWorker(sessionKey);
  if (!worker) {
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'No healthy workers available',
      workers: workers.map(w => ({ url: w.url, healthy: w.healthy, active: w.activeConnections })),
    }));
    return;
  }

  // Proxy the request
  await proxyRequest(req, res, worker, body);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Yaya Router running on http://0.0.0.0:${PORT}`);
  console.log(`   Workers: ${workers.map(w => w.url).join(', ')}`);
  console.log(`   Health check interval: ${HEALTH_INTERVAL_MS}ms`);
  console.log(`   Max queue per worker: ${MAX_QUEUE_PER_WORKER}`);
  console.log(`   Session stickiness TTL: ${STICKY_TTL_MS}ms`);
  console.log(`\n   Status:  http://localhost:${PORT}/status`);
  console.log(`   Metrics: http://localhost:${PORT}/metrics`);
  console.log();
});
