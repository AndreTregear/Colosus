import { Router } from 'express';
import * as tenantsRepo from '../../db/tenants-repo.js';
import { tenantManager } from '../../bot/tenant-manager.js';
import { getQrResponse } from './api-tenants.js';
import * as settingsRepo from '../../db/settings-repo.js';
import { getTenantSubscriptionStatus } from '../../services/subscription-service.js';
import { logger } from '../../shared/logger.js';

const router = Router();

function getTenantId(req: import('express').Request): string | null {
  return req.sessionUser?.tenantId || null;
}

// GET /api/account — get own tenant profile
router.get('/', async (req, res) => {
  const tenantId = req.sessionUser?.tenantId;
  if (!tenantId) {
    res.status(403).json({ error: 'No tenant linked to this account' });
    return;
  }
  const tenant = await tenantsRepo.getTenantById(tenantId);
  if (!tenant) {
    res.status(404).json({ error: 'Tenant not found' });
    return;
  }
  res.json({
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    phone: tenant.phone,
    apiKey: tenant.apiKey,
    status: tenant.status,
    settings: tenant.settings,
    createdAt: tenant.createdAt,
  });
});

// POST /api/account/api-key/rotate — generate new API key
router.post('/api-key/rotate', async (req, res) => {
  const tenantId = req.sessionUser?.tenantId;
  if (!tenantId) {
    res.status(403).json({ error: 'No tenant linked to this account' });
    return;
  }
  const tenant = await tenantsRepo.rotateApiKey(tenantId);
  if (!tenant) {
    res.status(404).json({ error: 'Tenant not found or inactive' });
    return;
  }
  res.json({ apiKey: tenant.apiKey });
});

// ── Bot management (tenant-scoped) ──

router.get('/status', async (req, res) => {
  const tenantId = getTenantId(req);
  if (!tenantId) { res.status(403).json({ error: 'No tenant linked' }); return; }
  const status = await tenantManager.getStatus(tenantId);
  const tenant = await tenantsRepo.getTenantById(tenantId);
  const aiEnabled = await settingsRepo.getEffectiveSetting(tenantId, 'ai_enabled', '1');
  const subscription = await getTenantSubscriptionStatus(tenantId);
  res.json({
    running: status.running,
    connection: status.session?.connectionStatus ?? 'disconnected',
    autoReplyEnabled: aiEnabled !== '0',
    phoneNumber: tenant?.phone ?? null,
    uptime: status.startedAt ? Math.floor((Date.now() - status.startedAt.getTime()) / 1000) : 0,
    messagesHandled: status.messagesHandled,
    subscription,
  });
});

router.get('/qr', async (req, res) => {
  const tenantId = getTenantId(req);
  if (!tenantId) { res.status(403).json({ error: 'No tenant linked' }); return; }
  res.json(await getQrResponse(tenantId));
});

router.post('/bot/start', async (req, res) => {
  const tenantId = getTenantId(req);
  if (!tenantId) { res.status(403).json({ error: 'No tenant linked' }); return; }
  await tenantManager.startTenant(tenantId);
  res.json({ ok: true });
});

router.post('/bot/stop', async (req, res) => {
  const tenantId = getTenantId(req);
  if (!tenantId) { res.status(403).json({ error: 'No tenant linked' }); return; }
  await tenantManager.stopTenant(tenantId);
  res.json({ ok: true });
});

router.post('/bot/reset', async (req, res) => {
  const tenantId = getTenantId(req);
  if (!tenantId) { res.status(403).json({ error: 'No tenant linked' }); return; }
  await tenantManager.resetTenant(tenantId);
  res.json({ ok: true });
});

router.post('/bot/toggle-autoreply', async (req, res) => {
  const tenantId = getTenantId(req);
  if (!tenantId) { res.status(403).json({ error: 'No tenant linked' }); return; }
  const { enabled } = req.body;
  await settingsRepo.setSetting(tenantId, 'ai_enabled', enabled ? '1' : '0');
  res.json({ autoReplyEnabled: Boolean(enabled) });
});

// PUT /api/account/profile — update user profile
router.put('/profile', async (req, res) => {
  const userId = req.sessionUser?.id;
  if (!userId) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const { name } = req.body;
  if (!name || typeof name !== 'string') {
    res.status(400).json({ error: 'Name is required' });
    return;
  }
  try {
    const { auth } = await import('../../auth/auth.js');
    await auth.api.updateUser({
      body: { name },
      headers: new Headers({ cookie: req.headers.cookie || '' }),
    });
    res.json({ ok: true, name });
  } catch (err) {
    logger.error({ err, userId }, 'Failed to update profile');
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// PUT /api/account/password — change password
router.put('/password', async (req, res) => {
  const userId = req.sessionUser?.id;
  if (!userId) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'Current and new password are required' });
    return;
  }
  if (newPassword.length < 8) {
    res.status(400).json({ error: 'New password must be at least 8 characters' });
    return;
  }
  try {
    const { auth } = await import('../../auth/auth.js');
    await auth.api.changePassword({
      body: { currentPassword, newPassword, revokeOtherSessions: true },
      headers: new Headers({ cookie: req.headers.cookie || '' }),
    });
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err, userId }, 'Failed to change password');
    res.status(400).json({ error: 'Current password is incorrect or password change failed' });
  }
});

export { router as accountRouter };
