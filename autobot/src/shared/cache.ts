export function createCache<T>(fetchFn: () => Promise<T>, ttlMs: number) {
  let value: T | undefined;
  let expiresAt = 0;
  return async (): Promise<T> => {
    if (Date.now() < expiresAt && value !== undefined) return value;
    value = await fetchFn();
    expiresAt = Date.now() + ttlMs;
    return value;
  };
}

export class BoundedMap<K, V> {
  private readonly map = new Map<K, V>();
  constructor(private readonly maxSize: number) {}

  get size(): number { return this.map.size; }
  has(key: K): boolean { return this.map.has(key); }
  get(key: K): V | undefined { return this.map.get(key); }
  delete(key: K): boolean { return this.map.delete(key); }
  clear(): void { this.map.clear(); }

  set(key: K, value: V): this {
    // Re-set bumps the key to "newest" by deleting then inserting again.
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, value);
    while (this.map.size > this.maxSize) {
      const oldest = this.map.keys().next().value as K;
      this.map.delete(oldest);
    }
    return this;
  }
}
