import type { Request, Response, NextFunction } from 'express';
import * as devicesRepo from '../../db/devices-repo.js';
import { extractBearerToken } from './auth-utils.js';

declare global {
  namespace Express {
    interface Request {
      deviceId?: number;
    }
  }
}

export async function requireDeviceAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = extractBearerToken(req);
  if (!token) {
    res.status(401).json({ error: 'Authorization token required' });
    return;
  }

  const device = await devicesRepo.getDeviceByToken(token);
  if (!device) {
    res.status(401).json({ error: 'Invalid device token' });
    return;
  }

  req.tenantId = device.tenantId;
  req.deviceId = device.id;
  devicesRepo.updateLastSeen(device.id).catch(() => {});
  next();
}
