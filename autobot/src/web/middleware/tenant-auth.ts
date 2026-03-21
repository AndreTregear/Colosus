import type { Request, Response, NextFunction } from 'express';
import * as tenantsRepo from '../../db/tenants-repo.js';
import { auth } from '../../auth/auth.js';
import { fromNodeHeaders } from 'better-auth/node';
import { extractApiKey } from './auth-utils.js';

declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
    }
  }
}

export async function requireTenantAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const apiKey = extractApiKey(req);
  if (apiKey) {
    const tenant = await tenantsRepo.getTenantByApiKey(apiKey);
    if (!tenant) {
      res.status(401).json({ error: 'Invalid API key' });
      return;
    }
    req.tenantId = tenant.id;
    return next();
  }

  try {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    const tenantId = (session?.user as { tenantId?: string } | undefined)?.tenantId;
    if (tenantId) {
      req.tenantId = tenantId;
      return next();
    }
  } catch { /* fall through */ }

  res.status(401).json({ error: 'Authentication required. Send API key via X-API-Key header or log in.' });
}
