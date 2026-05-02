import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { MOBILE_JWT_SECRET } from '../../config.js';
import { extractBearerToken } from './auth-utils.js';
import { auth } from '../../auth/auth.js';
import { fromNodeHeaders } from 'better-auth/node';

declare global {
  namespace Express {
    interface Request {
      mobileUserId?: number;
    }
  }
}

interface MobileJwtPayload {
  userId: number;
  tenantId: string;
  phone: string;
}

function verifyMobileJwt(token: string): MobileJwtPayload | null {
  try {
    const payload = jwt.verify(token, MOBILE_JWT_SECRET, { algorithms: ['HS256'] }) as MobileJwtPayload & { type?: string };
    // Reject refresh tokens used as access tokens
    if (payload.type === 'refresh') return null;
    return payload;
  } catch {
    return null;
  }
}

export async function requireMobileAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = extractBearerToken(req);
  if (!token) {
    res.status(401).json({ error: 'Authorization token required' });
    return;
  }

  const payload = verifyMobileJwt(token);
  if (!payload?.tenantId || !payload.userId) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  req.tenantId = payload.tenantId;
  req.mobileUserId = payload.userId;
  next();
}

export async function requireMobileOrDeviceAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = extractBearerToken(req);
  if (!token) {
    res.status(401).json({ error: 'Authorization token required' });
    return;
  }

  // Try JWT first (JWTs have dots)
  if (token.includes('.')) {
    const payload = verifyMobileJwt(token);
    if (payload?.tenantId && payload.userId) {
      req.tenantId = payload.tenantId;
      req.mobileUserId = payload.userId;
      return next();
    }
  }

  // Fall back to device token
  const { getDeviceByToken, updateLastSeen } = await import('../../db/devices-repo.js');
  const device = await getDeviceByToken(token);
  if (!device) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  req.tenantId = device.tenantId;
  req.deviceId = device.id;
  updateLastSeen(device.id).catch(() => {});
  next();
}

/**
 * Accepts EITHER a Better Auth cookie session (web dashboard) OR a mobile JWT
 * OR a device token. Sets req.tenantId. Used by routes that serve both web
 * and mobile clients — most notably media + streaming.
 */
export async function requireSessionOrMobile(req: Request, res: Response, next: NextFunction): Promise<void> {
  // Try cookie session first
  try {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    if (session?.user) {
      const user = session.user as { id: string; email: string; name: string; role?: string; tenantId?: string };
      if (user.tenantId) {
        req.sessionUser = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role || 'user',
          tenantId: user.tenantId,
        };
        req.tenantId = user.tenantId;
        return next();
      }
    }
  } catch {
    // fall through to bearer token
  }

  // Fall back to mobile JWT / device token
  return requireMobileOrDeviceAuth(req, res, next);
}
