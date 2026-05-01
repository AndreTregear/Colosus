/**
 * Tests for shared/message-utils.ts — message splitting for WhatsApp.
 */
import { describe, it, expect } from 'vitest';
import { splitMessage } from '../src/shared/message-utils.js';

describe('splitMessage', () => {
  it('should return single chunk for short messages', () => {
    expect(splitMessage('hello', 100)).toEqual(['hello']);
  });

  it('should return single chunk when exactly at max length', () => {
    const msg = 'a'.repeat(100);
    expect(splitMessage(msg, 100)).toEqual([msg]);
  });

  it('should split long messages', () => {
    const msg = 'a'.repeat(250);
    const chunks = splitMessage(msg, 100);
    expect(chunks.length).toBeGreaterThan(1);
    // All content is preserved
    expect(chunks.join('')).toBe(msg);
  });

  it('should prefer splitting at newlines', () => {
    const line1 = 'a'.repeat(40);
    const line2 = 'b'.repeat(40);
    const line3 = 'c'.repeat(40);
    const msg = `${line1}\n${line2}\n${line3}`;
    const chunks = splitMessage(msg, 50);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0]).toBe(line1);
  });

  it('should handle empty string', () => {
    expect(splitMessage('', 100)).toEqual(['']);
  });

  it('should handle message with only newlines', () => {
    const msg = '\n\n\n';
    const result = splitMessage(msg, 100);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should handle very small maxLen', () => {
    const msg = 'hello world';
    const chunks = splitMessage(msg, 5);
    expect(chunks.length).toBeGreaterThan(1);
  });

  it('should handle unicode correctly', () => {
    const msg = '🔥'.repeat(30);
    const chunks = splitMessage(msg, 50);
    expect(chunks.join('')).toBe(msg);
  });
});
