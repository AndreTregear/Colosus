/**
 * Express middleware and request helpers for safe input handling.
 */
import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { paginationSchema } from './validation.js';

/**
 * Express middleware that validates req.body against a Zod schema.
 * On success, replaces req.body with the parsed (and coerced) value.
 * On failure, responds with 400 and structured error details.
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`);
      res.status(400).json({ error: 'Validation failed', details: errors });
      return;
    }
    req.body = result.data;
    next();
  };
}

/**
 * Safely extract tenantId from request, throwing if missing.
 * Replaces all `req.tenantId!` non-null assertions.
 */
export function getTenantId(req: Request): string {
  const id = req.tenantId;
  if (!id) throw new Error('tenantId missing — auth middleware not applied');
  return id;
}

/**
 * Safely extract deviceId from request, throwing if missing.
 * Replaces all `req.deviceId!` non-null assertions.
 */
export function getDeviceId(req: Request): number {
  const id = req.deviceId;
  if (!id) throw new Error('deviceId missing — device auth middleware not applied');
  return id;
}

/**
 * Parse and validate pagination query params (limit, offset) through paginationSchema.
 * Returns clamped, defaulted values — replaces all manual `Math.min(Number(req.query.limit) || 50, 200)` patterns.
 */
export function parsePagination(query: Request['query']): { limit: number; offset: number } {
  return paginationSchema.parse(query);
}

/**
 * Run an async operation and send the result as JSON.
 * On failure, responds with 400 and the error message.
 * Replaces the repeated try/catch pattern in tenant lifecycle routes.
 */
export async function handleAction(
  res: Response,
  action: () => Promise<void>,
  successBody: Record<string, unknown> = { ok: true },
): Promise<void> {
  try {
    await action();
    res.json(successBody);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}
