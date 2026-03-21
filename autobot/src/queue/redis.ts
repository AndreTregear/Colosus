import { Redis } from 'ioredis';
import { REDIS_URL } from '../config.js';
import { logger } from '../shared/logger.js';

let connection: Redis | null = null;

export function getRedisConnection(): Redis {
  if (!connection) {
    connection = new Redis(REDIS_URL, {
      maxRetriesPerRequest: null, // Required by BullMQ
      enableReadyCheck: false,
    });
    connection.on('error', (err: Error) => {
      logger.error({ err }, 'Redis connection error');
    });
    connection.on('connect', () => {
      logger.info('Redis connected');
    });
  }
  return connection;
}

/** Parse redis:// URL into BullMQ-compatible connection options */
export function parseRedisUrl(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port) || 6379,
    password: parsed.password || undefined,
    db: parsed.pathname ? parseInt(parsed.pathname.slice(1)) || 0 : 0,
    maxRetriesPerRequest: null as null,
  };
}

export async function closeRedis(): Promise<void> {
  if (connection) {
    await connection.quit();
    connection = null;
  }
}
