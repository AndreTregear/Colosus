import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { BETTER_AUTH_SECRET } from '../../config.js';
import { extractBearerToken } from './auth-utils.js';

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
    const payload = jwt.verify(token, BETTER_AUTH_SECRET, { algorithms: ['HS256'] }) as MobileJwtPayload & { type?: string };
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
