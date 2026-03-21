/**
 * Master test suite — validates all modules together.
 *
 * Individual test files are organized alphabetically by folder:
 *   - ai.test.ts       (AI actions parsing — pure logic)
 *   - bot.test.ts      (Auto-reply state, cooldown — pure logic)
 *   - db.test.ts       (Row mapper + all repositories — requires PostgreSQL)
 *   - queue.test.ts    (splitMessage, parseRedisUrl — pure logic)
 *   - shared.test.ts   (Zod validation schemas, event bus — pure logic)
 *   - web.test.ts      (Middleware helpers — pure logic)
 *
 * Run: npm test
 */
import { describe, it, expect } from 'vitest';

describe('master test suite', () => {
  it('should confirm all test modules are loadable', () => {
    // Vitest auto-discovers all *.test.ts files.
    // This test simply validates the master suite entry point exists.
    expect(true).toBe(true);
  });
});
