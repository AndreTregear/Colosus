/**
 * Tests for shared/cache.ts — TTL-based function memoization.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createCache, BoundedMap } from '../src/shared/cache.js';

describe('createCache', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should call fetchFn on first call', async () => {
    const fn = vi.fn().mockResolvedValue('result');
    const cached = createCache(fn, 1000);
    const result = await cached();
    expect(result).toBe('result');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should return cached value within TTL', async () => {
    const fn = vi.fn().mockResolvedValue('result');
    const cached = createCache(fn, 1000);

    await cached();
    vi.advanceTimersByTime(500);
    const result = await cached();

    expect(result).toBe('result');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should re-fetch after TTL expires', async () => {
    const fn = vi.fn()
      .mockResolvedValueOnce('first')
      .mockResolvedValueOnce('second');
    const cached = createCache(fn, 1000);

    const r1 = await cached();
    expect(r1).toBe('first');

    vi.advanceTimersByTime(1001);
    const r2 = await cached();
    expect(r2).toBe('second');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should cache different types', async () => {
    const fn = vi.fn().mockResolvedValue({ count: 42 });
    const cached = createCache(fn, 5000);
    const result = await cached();
    expect(result).toEqual({ count: 42 });
  });

  it('should handle fetchFn throwing', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fail'));
    const cached = createCache(fn, 1000);
    await expect(cached()).rejects.toThrow('fail');
  });

  it('should retry after fetchFn failure', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('recovered');
    const cached = createCache(fn, 1000);

    await expect(cached()).rejects.toThrow('fail');
    const result = await cached();
    expect(result).toBe('recovered');
  });
});

describe('BoundedMap', () => {
  it('should behave like a regular Map within bounds', () => {
    const map = new BoundedMap<string, number>(3);
    map.set('a', 1);
    map.set('b', 2);
    map.set('c', 3);
    expect(map.size).toBe(3);
    expect(map.get('a')).toBe(1);
    expect(map.get('b')).toBe(2);
    expect(map.get('c')).toBe(3);
  });

  it('should evict oldest entries when exceeding maxSize', () => {
    const map = new BoundedMap<string, number>(3);
    map.set('a', 1);
    map.set('b', 2);
    map.set('c', 3);
    map.set('d', 4); // should evict 'a'
    expect(map.size).toBe(3);
    expect(map.has('a')).toBe(false);
    expect(map.get('d')).toBe(4);
  });

  it('should refresh position on re-set of existing key', () => {
    const map = new BoundedMap<string, number>(3);
    map.set('a', 1);
    map.set('b', 2);
    map.set('c', 3);
    map.set('a', 10); // refresh 'a', now 'b' is oldest
    map.set('d', 4); // should evict 'b', not 'a'
    expect(map.size).toBe(3);
    expect(map.has('b')).toBe(false);
    expect(map.get('a')).toBe(10);
  });

  it('should handle maxSize of 1', () => {
    const map = new BoundedMap<string, number>(1);
    map.set('a', 1);
    map.set('b', 2);
    expect(map.size).toBe(1);
    expect(map.has('a')).toBe(false);
    expect(map.get('b')).toBe(2);
  });
});
