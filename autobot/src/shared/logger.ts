import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  ...(isProduction
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname',
          },
        },
      }),
});

/** Mask a secret string, showing only the first 4 chars. */
function mask(value: string | undefined): string {
  if (!value) return '(not set)';
  if (value.length <= 4) return '****';
  return value.substring(0, 4) + '****';
}

/** Print platform config summary on startup. */
export function logStartupBanner(): void {
  const cfg = {
    nodeEnv: process.env.NODE_ENV || 'development',
    logLevel: logger.level,
    port: process.env.PORT || '3000',
    dbHost: process.env.DATABASE_URL?.replace(/\/\/.*:.*@/, '//***:***@') || '(not set)',
    redisUrl: process.env.REDIS_URL?.replace(/\/\/.*:.*@/, '//***:***@') || '(not set)',
    aiModel: process.env.AI_MODEL || 'deepseek-chat',
    aiBaseUrl: process.env.AI_BASE_URL || 'https://api.deepseek.com/v1',
    aiApiKey: mask(process.env.AI_API_KEY),
    visionModel: process.env.VISION_MODEL || process.env.AI_MODEL || 'deepseek-chat',
    whisperModel: process.env.WHISPER_MODEL || 'whisper-1',
    s3Endpoint: process.env.S3_ENDPOINT || 'localhost',
    s3Port: process.env.S3_PORT || '9000',
    queueConcurrency: process.env.QUEUE_CONCURRENCY || '10',
    betterAuthUrl: process.env.BETTER_AUTH_URL || `http://localhost:${process.env.PORT || '3000'}`,
  };

  logger.info('='.repeat(60));
  logger.info('  AUTOBOT PLATFORM — Startup Configuration');
  logger.info('='.repeat(60));
  logger.info({ ...cfg }, 'Platform config');
  logger.info('='.repeat(60));
}
