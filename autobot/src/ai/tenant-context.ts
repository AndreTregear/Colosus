/**
 * Per-request tenant context for AI tools.
 *
 * Mastra tool `execute` functions don't receive request-scoped data through
 * their arguments — historically we used a module-level global, which races
 * under concurrent traffic from multiple tenants. AsyncLocalStorage scopes
 * the tenant id to the async context tree of whoever called `runWithTenant`,
 * so concurrent agent invocations stay isolated.
 *
 * Usage at the call site (mastra-bridge.ts):
 *   await runWithTenant(tenantId, async () => {
 *     const result = await agent.generate(...);
 *   });
 *
 * Usage inside a tool execute:
 *   const tenantId = getCurrentTenant();
 */

import { AsyncLocalStorage } from 'node:async_hooks';

interface TenantStore {
  tenantId: string;
}

const storage = new AsyncLocalStorage<TenantStore>();

export function runWithTenant<T>(tenantId: string, fn: () => Promise<T> | T): Promise<T> | T {
  return storage.run({ tenantId }, fn);
}

/** Returns the tenant id for the current async context. Throws if unset. */
export function getCurrentTenant(): string {
  const store = storage.getStore();
  if (!store?.tenantId) {
    throw new Error('No tenant context — wrap the call in runWithTenant(tenantId, ...)');
  }
  return store.tenantId;
}

/** Returns the tenant id or null. Use only when "no tenant" is meaningful. */
export function getCurrentTenantOrNull(): string | null {
  return storage.getStore()?.tenantId ?? null;
}
