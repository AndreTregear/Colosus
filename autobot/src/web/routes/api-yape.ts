import { Router } from 'express';
import crypto from 'node:crypto';
import * as tenantsRepo from '../../db/tenants-repo.js';
import * as devicesRepo from '../../db/devices-repo.js';
import * as paymentService from '../../services/payment-service.js';
import { requireDeviceAuth } from '../middleware/device-auth.js';
import { DEVICE_TOKEN_HMAC_SECRET } from '../../config.js';
import { logger } from '../../shared/logger.js';
import { validateBody, getTenantId, getDeviceId } from '../../shared/validate.js';
import { deviceRegisterSchema, paymentSyncSchema, batchPaymentSyncSchema } from '../../shared/validation.js';
import { encryptRecord } from '../../crypto/middleware.js';

const router = Router();

// --- Health check (no auth) ---

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// --- Device registration (no auth — uses API key in body) ---

router.post('/devices/register', validateBody(deviceRegisterSchema), async (req, res) => {
  const { businessName, phoneNumber, deviceId, apiKey } = req.body;

  const tenant = await tenantsRepo.getTenantByApiKey(apiKey);
  if (!tenant || tenant.status !== 'active') {
    res.status(401).json({ error: 'Invalid or inactive API key' });
    return;
  }

  const token = crypto
    .createHmac('sha256', DEVICE_TOKEN_HMAC_SECRET)
    .update(`${deviceId}:${tenant.id}:${Date.now()}`)
    .digest('hex');

  const device = await devicesRepo.createDevice(tenant.id, deviceId, businessName, phoneNumber, token);

  logger.info({ tenantId: tenant.id, deviceId }, 'Yaya device registered');

  res.status(201).json({
    businessId: tenant.id,
    token: device.token,
  });
});

// --- Payment sync (device auth required) ---

router.post('/payments/sync', requireDeviceAuth, validateBody(paymentSyncSchema), async (req, res) => {
  const tenantId = getTenantId(req);
  const deviceId = getDeviceId(req);
  const { senderName, amount, capturedAt, notificationHash } = req.body;

  // Encrypt sender_name before persisting
  const encrypted = await encryptRecord(tenantId, 'yape_notifications', { sender_name: senderName });
  const result = await paymentService.syncYapeNotification(
    tenantId, deviceId, encrypted.sender_name as string, Number(amount), new Date(capturedAt), notificationHash,
  );

  res.json({ id: String(result.notificationId), status: result.status });
});

// --- Batch payment sync (device auth required) ---

router.post('/payments/sync/batch', requireDeviceAuth, validateBody(batchPaymentSyncSchema), async (req, res) => {
  const tenantId = getTenantId(req);
  const deviceId = getDeviceId(req);
  const { payments } = req.body;

  const results: { id: string; status: string }[] = [];

  // Process sequentially to avoid race conditions in matching
  for (const p of payments) {
    const { senderName, amount, capturedAt, notificationHash } = p;
    // Encrypt sender_name before persisting
    const encrypted = await encryptRecord(tenantId, 'yape_notifications', { sender_name: senderName });
    const result = await paymentService.syncYapeNotification(
      tenantId, deviceId, encrypted.sender_name as string, Number(amount), new Date(capturedAt), notificationHash,
    );
    results.push({ id: String(result.notificationId), status: result.status });
  }

  res.json({ results });
});

export { router as yapeRouter };
