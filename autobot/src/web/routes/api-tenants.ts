/**
 * Tenant management + session lifecycle API.
 * These endpoints are unprotected (admin-level) for now.
 * Real admin auth comes in Phase 4.
 */
import { Router } from 'express';
import * as tenantsRepo from '../../db/tenants-repo.js';
import * as sessionsRepo from '../../db/sessions-repo.js';
import { tenantManager } from '../../bot/tenant-manager.js';
import { validateBody, handleAction } from '../../shared/validate.js';
import { createTenantSchema, updateTenantSchema } from '../../shared/validation.js';

const router = Router();

// --- Tenant CRUD ---

router.post('/', validateBody(createTenantSchema), async (req, res) => {
  const { name, slug, settings } = req.body;

  // Check uniqueness
  const existing = await tenantsRepo.getTenantBySlug(slug);
  if (existing) {
    res.status(409).json({ error: 'slug already taken' });
    return;
  }

  const tenant = await tenantsRepo.createTenant({ name, slug, settings });
  res.status(201).json(tenant);
});

router.get('/', async (_req, res) => {
  const tenants = await tenantsRepo.getAllTenants();
  res.json(tenants);
});

router.get('/:id', async (req, res) => {
  const tenant = await tenantsRepo.getTenantById(req.params.id);
  if (!tenant) {
    res.status(404).json({ error: 'Tenant not found' });
    return;
  }
  res.json(tenant);
});

router.patch('/:id', validateBody(updateTenantSchema), async (req, res) => {
  const { name, settings } = req.body;
  const tenant = await tenantsRepo.updateTenant(req.params['id'] as string, { name, settings });
  if (!tenant) {
    res.status(404).json({ error: 'Tenant not found' });
    return;
  }
  res.json(tenant);
});

router.delete('/:id', async (req, res) => {
  // Stop session first
  try {
    await tenantManager.stopTenant(req.params.id);
  } catch { /* may not be running */ }

  const deleted = await tenantsRepo.deleteTenant(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Tenant not found' });
    return;
  }
  res.status(204).end();
});

// --- Session lifecycle ---

router.post('/:id/start', async (req, res) => {
  await handleAction(res, () => tenantManager.startTenant(req.params.id), { ok: true, message: 'Tenant session starting' });
});

router.post('/:id/stop', async (req, res) => {
  await handleAction(res, () => tenantManager.stopTenant(req.params.id), { ok: true, message: 'Tenant session stopped' });
});

router.post('/:id/reset', async (req, res) => {
  await handleAction(res, () => tenantManager.resetTenant(req.params.id), { ok: true, message: 'Tenant session reset — scan new QR' });
});

router.get('/:id/status', async (req, res) => {
  const tenant = await tenantsRepo.getTenantById(req.params.id);
  if (!tenant) {
    res.status(404).json({ error: 'Tenant not found' });
    return;
  }

  const status = await tenantManager.getStatus(req.params.id);
  res.json({
    tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug, phone: tenant.phone },
    ...status,
    uptime: status.startedAt ? Math.floor((Date.now() - status.startedAt.getTime()) / 1000) : 0,
  });
});

export async function getQrResponse(tenantId: string) {
  const session = await sessionsRepo.getSession(tenantId);
  if (session?.connectionStatus === 'connected') return { status: 'connected', qr: null };
  const qr = tenantManager.getQr(tenantId);
  return qr ? { status: 'waiting', qr } : { status: 'disconnected', qr: null };
}

router.get('/:id/qr', async (req, res) => {
  const tenant = await tenantsRepo.getTenantById(req.params.id);
  if (!tenant) {
    res.status(404).json({ error: 'Tenant not found' });
    return;
  }
  res.json(await getQrResponse(req.params.id));
});

export { router as tenantsRouter };
