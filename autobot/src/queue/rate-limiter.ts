import { getRedisConnection } from './redis.js';
import * as settingsRepo from '../db/settings-repo.js';
import { createCache } from '../shared/cache.js';
import { logger } from '../shared/logger.js';

const DEFAULT_RATE_LIMIT = 60;
const DEFAULT_RATE_WINDOW_SEC = 60;
const DEFAULT_AI_CONCURRENCY = 3;
const CONCURRENCY_STALE_MS = 5 * 60 * 1000; // 5 minutes — auto-cleanup dead entries

const CACHE_TTL_MS = 60_000;

// Per-tenant caches (keyed by tenantId, created on demand)
const rateCaches = new Map<string, () => Promise<{ limit: number; windowSec: number }>>();
const concurrencyCaches = new Map<string, () => Promise<number>>();

function getTenantRateConfig(tenantId: string): Promise<{ limit: number; windowSec: number }> {
  let cached = rateCaches.get(tenantId);
  if (!cached) {
    cached = createCache(async () => {
      const limitStr = await settingsRepo.getSetting(tenantId, 'rate_limit_per_minute');
      const limit = limitStr ? parseInt(limitStr, 10) : DEFAULT_RATE_LIMIT;
      return { limit, windowSec: DEFAULT_RATE_WINDOW_SEC };
    }, CACHE_TTL_MS);
    rateCaches.set(tenantId, cached);
  }
  return cached();
}

/**
 * Check if a tenant is within their rate limit.
 * Returns true if allowed, false if rate-limited.
 * Atomically increments the counter if allowed.
 */
export async function checkAndIncrementRateLimit(tenantId: string): Promise<boolean> {
  const redis = getRedisConnection();
  const { limit, windowSec } = await getTenantRateConfig(tenantId);

  const key = `ratelimit:${tenantId}`;
  const now = Date.now();
  const windowStart = now - (windowSec * 1000);

  const luaScript = `
    local key = KEYS[1]
    local now = tonumber(ARGV[1])
    local windowStart = tonumber(ARGV[2])
    local limit = tonumber(ARGV[3])
    local windowSec = tonumber(ARGV[4])

    redis.call('ZREMRANGEBYSCORE', key, '-inf', windowStart)

    local count = redis.call('ZCARD', key)

    if count < limit then
      redis.call('ZADD', key, now, now .. '-' .. math.random(1000000))
      redis.call('EXPIRE', key, windowSec + 1)
      return 1
    else
      return 0
    end
  `;

  const result = await redis.eval(luaScript, 1, key, now, windowStart, limit, windowSec);
  if (result === 0) {
    logger.warn({ tenantId, limit, windowSec }, 'Rate limit exceeded');
  }
  return result === 1;
}

/**
 * Get current rate limit usage for monitoring.
 */
export async function getRateLimitStatus(tenantId: string): Promise<{
  current: number;
  limit: number;
  windowSec: number;
}> {
  const redis = getRedisConnection();
  const { limit, windowSec } = await getTenantRateConfig(tenantId);

  const key = `ratelimit:${tenantId}`;
  const windowStart = Date.now() - (windowSec * 1000);

  await redis.zremrangebyscore(key, '-inf', windowStart);
  const current = await redis.zcard(key);

  return { current, limit, windowSec };
}

// ---- Per-Tenant AI Concurrency Limiter ----

function getTenantConcurrencyLimit(tenantId: string): Promise<number> {
  let cached = concurrencyCaches.get(tenantId);
  if (!cached) {
    cached = createCache(async () => {
      const limitStr = await settingsRepo.getSetting(tenantId, 'ai_concurrency');
      return limitStr ? parseInt(limitStr, 10) : DEFAULT_AI_CONCURRENCY;
    }, CACHE_TTL_MS);
    concurrencyCaches.set(tenantId, cached);
  }
  return cached();
}

/**
 * Try to acquire a concurrency slot for a tenant.
 * Returns true if a slot is available, false if at capacity.
 * Uses a Redis sorted set with job IDs scored by timestamp.
 */
export async function acquireTenantSlot(tenantId: string, jobId: string): Promise<boolean> {
  const redis = getRedisConnection();
  const limit = await getTenantConcurrencyLimit(tenantId);
  const key = `concurrency:${tenantId}`;
  const now = Date.now();
  const staleThreshold = now - CONCURRENCY_STALE_MS;

  const luaScript = `
    local key = KEYS[1]
    local now = tonumber(ARGV[1])
    local staleThreshold = tonumber(ARGV[2])
    local limit = tonumber(ARGV[3])
    local jobId = ARGV[4]

    -- Clean stale entries (dead jobs older than 5 min)
    redis.call('ZREMRANGEBYSCORE', key, '-inf', staleThreshold)

    local count = redis.call('ZCARD', key)

    if count < limit then
      redis.call('ZADD', key, now, jobId)
      redis.call('EXPIRE', key, 600)
      return 1
    else
      return 0
    end
  `;

  const result = await redis.eval(luaScript, 1, key, now, staleThreshold, limit, jobId);
  return result === 1;
}

/**
 * Release a concurrency slot after job completion (success or failure).
 */
export async function releaseTenantSlot(tenantId: string, jobId: string): Promise<void> {
  try {
    const redis = getRedisConnection();
    await redis.zrem(`concurrency:${tenantId}`, jobId);
  } catch {
    // Best-effort — stale entries will be cleaned up automatically
  }
}
