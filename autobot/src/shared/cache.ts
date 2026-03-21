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
