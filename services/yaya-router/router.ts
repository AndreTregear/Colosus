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

import * as http from 'http';
import * as https from 'https';
import Redis from 'ioredis';

// ── Configuration ──

const PORT = parseInt(process.env.ROUTER_PORT || '8091');
const WORKERS_RAW = process.env.WORKERS || 'http://localhost:8080,http://localhost:8081,http://localhost:8082,http://localhost:8083';
const HEALTH_INTERVAL_MS = parseInt(process.env.HEALTH_INTERVAL_MS || '10000');
const WORKER_API_KEY = process.env.WORKER_API_KEY || '';
if (!WORKER_API_KEY) {
  console.error('[yaya-router] WORKER_API_KEY env var is required');
  process.exit(1);
}
const ROUTER_API_KEY = process.env.ROUTER_API_KEY || ''; // Optional auth for clients
const MAX_QUEUE_PER_WORKER = parseInt(process.env.MAX_QUEUE_PER_WORKER || '50');
const REQUEST_TIMEOUT_MS = parseInt(process.env.REQUEST_TIMEOUT_MS || '60000');
const STICKY_TTL_MS = parseInt(process.env.STICKY_TTL_MS || '300000'); // 5 min session stickiness
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const redis = new Redis(REDIS_URL);

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

async function selectWorker(sessionKey?: string): Promise<WorkerState | null> {
  // Check sticky session in Redis
  if (sessionKey) {
    const cachedIndex = await redis.get(`session:${sessionKey}`);
    if (cachedIndex !== null) {
      const idx = parseInt(cachedIndex);
      const w = workers[idx];
      if (w && w.healthy && w.activeConnections < MAX_QUEUE_PER_WORKER) {
        await redis.expire(`session:${sessionKey}`, Math.floor(STICKY_TTL_MS / 1000)); // refresh TTL
        return w;
      }
      // Worker unhealthy or overloaded — fall through to pick new one
      await redis.del(`session:${sessionKey}`);
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

  // Set sticky session in Redis
  if (sessionKey) {
    await redis.set(`session:${sessionKey}`, best.i.toString(), 'EX', Math.floor(STICKY_TTL_MS / 1000));
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
): Promise<void> {
  const startTime = Date.now();
  worker.activeConnections++;
  worker.totalRequests++;

  return new Promise((resolve) => {
    const targetUrl = new URL(`${worker.url}${req.url}`);
    const isHttps = targetUrl.protocol === 'https:';
    const requester = isHttps ? https : http;

    const proxyReq = requester.request(
      targetUrl,
      {
        method: req.method,
        headers: {
          ...req.headers,
          'authorization': `Bearer ${WORKER_API_KEY}`,
          'host': targetUrl.host,
        },
        timeout: REQUEST_TIMEOUT_MS,
      },
      (proxyRes) => {
        const latencyMs = Date.now() - startTime;
        
        // Update latency tracking
        worker.latencyWindow.push(latencyMs);
        if (worker.latencyWindow.length > 100) worker.latencyWindow.shift();
        worker.avgLatencyMs = worker.latencyWindow.reduce((a, b) => a + b, 0) / worker.latencyWindow.length;

        // Forward response headers
        res.writeHead(proxyRes.statusCode || 200, {
          ...proxyRes.headers,
          'X-Yaya-Worker': worker.url,
          'X-Yaya-Latency': String(latencyMs),
        });

        // Pipe response
        proxyRes.pipe(res);
        proxyRes.on('end', () => {
          worker.activeConnections--;
          resolve();
        });
      }
    );

    proxyReq.on('error', (err: any) => {
      worker.activeConnections--;
      worker.totalErrors++;
      const latencyMs = Date.now() - startTime;

      // Mark worker as potentially unhealthy after repeated errors
      if (worker.totalErrors > 3 && worker.totalErrors / worker.totalRequests > 0.3) {
        worker.healthy = false;
        console.warn(`[Router] Worker ${worker.url} marked unhealthy (error rate: ${(worker.totalErrors / worker.totalRequests * 100).toFixed(1)}%)`);
      }

      if (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT') {
        res.writeHead(504, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Worker timeout or reset', worker: worker.url, latencyMs }));
      } else {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Worker error', message: err.message, worker: worker.url }));
      }
      resolve();
    });

    proxyReq.on('timeout', () => {
      proxyReq.destroy();
      // Error handler will be called by destroy()
    });

    // Pipe the incoming request body directly to the proxy request
    req.pipe(proxyReq);
  });
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

  // Extract session key for stickiness ONLY from headers
  const sessionKey = (req.headers['x-session-id'] as string) || (req.headers['authorization'] as string);

  // Select worker (now async)
  const worker = await selectWorker(sessionKey);
  if (!worker) {
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'No healthy workers available',
      workers: workers.map(w => ({ url: w.url, healthy: w.healthy, active: w.activeConnections })),
    }));
    return;
  }

  // Proxy the request (now streams req -> worker)
  await proxyRequest(req, res, worker);
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
