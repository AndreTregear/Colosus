import type { Request, Response, NextFunction } from 'express';
import { auth } from '../../auth/auth.js';
import { fromNodeHeaders } from 'better-auth/node';
import { logger } from '../../shared/logger.js';

interface BetterAuthUser {
  id: string;
  email: string;
  name: string;
  role?: string;
  tenantId?: string;
}

declare global {
  namespace Express {
    interface Request {
      sessionUser?: {
        id: string;
        email: string;
        name: string;
        role: string;
        tenantId: string | null;
      };
    }
  }
}

export async function requireSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    if (!session) {
      logger.warn({ method: req.method, url: req.originalUrl }, 'Session validation returned null');
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const user = session.user as BetterAuthUser;
    req.sessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role || 'user',
      tenantId: user.tenantId || null,
    };
    req.tenantId = user.tenantId;
    next();
  } catch (err) {
    logger.error({ err, method: req.method, url: req.originalUrl }, 'Session validation threw');
    res.status(401).json({ error: 'Invalid session' });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.sessionUser?.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
}

// Param keys that, in any router we mount under requireTenantOwner, are
// expected to carry a tenant UUID. We check ALL of them — historically only
// `tenantId` was checked, but most tenant routers use `:id`, which made the
// ownership check silently pass.
const TENANT_PARAM_KEYS = ['tenantId', 'id'] as const;

export function requireTenantOwner(req: Request, res: Response, next: NextFunction): void {
  if (!req.sessionUser) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  // Admins bypass per-tenant ownership — they manage all tenants.
  if (req.sessionUser.role === 'admin') {
    return next();
  }
  if (!req.sessionUser.tenantId) {
    res.status(403).json({ error: 'No tenant associated with this account' });
    return;
  }
  for (const key of TENANT_PARAM_KEYS) {
    const v = req.params[key];
    if (typeof v === 'string' && v.length > 0 && v !== req.sessionUser.tenantId) {
      res.status(403).json({ error: 'Access denied: you can only access your own tenant' });
      return;
    }
  }
  next();
}

export function requireCustomer(req: Request, res: Response, next: NextFunction): void {
  if (!req.sessionUser?.tenantId) {
    res.status(403).json({ error: 'Tenant access required' });
    return;
  }
  next();
}

export function requireContador(req: Request, res: Response, next: NextFunction): void {
  if (req.sessionUser?.role !== 'contador') {
    res.status(403).json({ error: 'Contador access required' });
    return;
  }
  next();
}
