import { getRedisConnection } from '../queue/redis.js';
import { logger } from '../shared/logger.js';

const DEK_PREFIX = 'dek:';
const DEFAULT_TTL = 7 * 24 * 60 * 60; // 7 days (match session TTL)

/**
 * Cache a DEK in Redis (memory only, never persisted to disk by default).
 */
export async function cacheDEK(tenantId: string, dek: Buffer, ttlSeconds?: number): Promise<void> {
  const redis = getRedisConnection();
  await redis.set(
    DEK_PREFIX + tenantId,
    dek.toString('base64'),
    'EX',
    ttlSeconds ?? DEFAULT_TTL,
  );
  logger.debug({ tenantId, ttl: ttlSeconds ?? DEFAULT_TTL }, 'DEK cached in Redis');
}

/**
 * Retrieve a cached DEK from Redis.
 * Returns null if expired or not found (tenant must re-authenticate).
 */
export async function getCachedDEK(tenantId: string): Promise<Buffer | null> {
  const redis = getRedisConnection();
  const encoded = await redis.get(DEK_PREFIX + tenantId);
  if (!encoded) return null;
  return Buffer.from(encoded, 'base64');
}

/**
 * Evict a DEK from Redis (on logout or session expiry).
 */
export async function evictDEK(tenantId: string): Promise<void> {
  const redis = getRedisConnection();
  await redis.del(DEK_PREFIX + tenantId);
  logger.debug({ tenantId }, 'DEK evicted from Redis');
}

/**
 * Check if a DEK is cached (tenant has an active session).
 */
export async function hasCachedDEK(tenantId: string): Promise<boolean> {
  const redis = getRedisConnection();
  return (await redis.exists(DEK_PREFIX + tenantId)) === 1;
}
