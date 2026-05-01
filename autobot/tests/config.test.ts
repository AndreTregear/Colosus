/**
 * Tests for config.ts — environment variable loading and defaults.
 *
 * Since config.ts reads process.env at import time, we test
 * the values that were loaded (from .env or defaults).
 */
import { describe, it, expect } from 'vitest';
import {
  WEB_PORT,
  DATABASE_URL,
  REDIS_URL,
  BETTER_AUTH_SECRET,
  BETTER_AUTH_URL,
  AI_TEMPERATURE,
  AI_MAX_TOKENS,
  QUEUE_CONCURRENCY,
  QUEUE_MAX_RETRIES,
  QUEUE_RETRY_DELAY_MS,
  MAX_UPLOAD_SIZE_MB,
  MEDIA_MAX_VIDEO_SIZE_MB,
  S3_PRESIGN_TTL,
  AI_MAX_COST_PER_REQUEST,
  USAGE_FLUSH_INTERVAL_MS,
  IMAGE_MAX_DIMENSION,
  IMAGE_QUALITY,
  BUSINESS_CURRENCY,
  TTS_VOICE,
  TTS_LANG_CODE,
} from '../src/config.js';

describe('config', () => {
  describe('required env vars', () => {
    it('should have DATABASE_URL', () => {
      expect(DATABASE_URL).toBeTruthy();
      expect(typeof DATABASE_URL).toBe('string');
    });

    it('should have REDIS_URL', () => {
      expect(REDIS_URL).toBeTruthy();
    });

    it('should have BETTER_AUTH_SECRET with min 32 chars', () => {
      expect(BETTER_AUTH_SECRET).toBeTruthy();
      expect(BETTER_AUTH_SECRET.length).toBeGreaterThanOrEqual(32);
    });
  });

  describe('server config', () => {
    it('should have a numeric port', () => {
      expect(typeof WEB_PORT).toBe('number');
      expect(WEB_PORT).toBeGreaterThan(0);
    });

    it('should have BETTER_AUTH_URL', () => {
      expect(BETTER_AUTH_URL).toBeTruthy();
      expect(BETTER_AUTH_URL).toMatch(/^https?:\/\//);
    });
  });

  describe('AI defaults', () => {
    it('should have reasonable temperature', () => {
      expect(AI_TEMPERATURE).toBeGreaterThanOrEqual(0);
      expect(AI_TEMPERATURE).toBeLessThanOrEqual(2);
    });

    it('should have reasonable max tokens', () => {
      expect(AI_MAX_TOKENS).toBeGreaterThan(0);
      expect(AI_MAX_TOKENS).toBeLessThanOrEqual(128000);
    });
  });

  describe('queue defaults', () => {
    it('should have valid concurrency', () => {
      expect(QUEUE_CONCURRENCY).toBeGreaterThan(0);
    });

    it('should have valid retry config', () => {
      expect(QUEUE_MAX_RETRIES).toBeGreaterThanOrEqual(0);
      expect(QUEUE_RETRY_DELAY_MS).toBeGreaterThan(0);
    });
  });

  describe('upload limits', () => {
    it('should have reasonable upload size', () => {
      expect(MAX_UPLOAD_SIZE_MB).toBeGreaterThan(0);
      expect(MAX_UPLOAD_SIZE_MB).toBeLessThanOrEqual(100);
    });

    it('should have reasonable video size', () => {
      expect(MEDIA_MAX_VIDEO_SIZE_MB).toBeGreaterThan(0);
      expect(MEDIA_MAX_VIDEO_SIZE_MB).toBeLessThanOrEqual(500);
    });
  });

  describe('S3 config', () => {
    it('should have presign TTL', () => {
      expect(S3_PRESIGN_TTL).toBeGreaterThan(0);
    });
  });

  describe('smart routing', () => {
    it('should have cost limits', () => {
      expect(AI_MAX_COST_PER_REQUEST).toBeGreaterThan(0);
    });
  });

  describe('usage tracking', () => {
    it('should have flush interval', () => {
      expect(USAGE_FLUSH_INTERVAL_MS).toBeGreaterThan(0);
    });
  });

  describe('image processing', () => {
    it('should have max dimension', () => {
      expect(IMAGE_MAX_DIMENSION).toBeGreaterThan(0);
    });

    it('should have quality between 1-100', () => {
      expect(IMAGE_QUALITY).toBeGreaterThan(0);
      expect(IMAGE_QUALITY).toBeLessThanOrEqual(100);
    });
  });

  describe('business defaults', () => {
    it('should have currency', () => {
      expect(BUSINESS_CURRENCY).toBeTruthy();
    });
  });

  describe('TTS config', () => {
    it('should have voice and lang code', () => {
      expect(TTS_VOICE).toBeTruthy();
      expect(TTS_LANG_CODE).toBeTruthy();
    });
  });
});
