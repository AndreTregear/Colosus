import { Router } from 'express';
import multer from 'multer';
import { requireMobileOrDeviceAuth } from '../middleware/mobile-auth.js';
import { getTenantId } from '../../shared/validate.js';
import { handleGetPendingPayments } from './handlers/shared-handlers.js';
import * as productsRepo from '../../db/products-repo.js';
import * as ordersRepo from '../../db/orders-repo.js';
import * as sessionsRepo from '../../db/sessions-repo.js';
import { queryOne } from '../../db/pool.js';
import { mountProductRoutes } from './core/products-routes.js';
import { mountOrderRoutes } from './core/orders-routes.js';
import { mountPaymentRoutes } from './core/payments-routes.js';
import { mountCustomerRoutes } from './core/customers-routes.js';
import { mountSettingRoutes } from './core/settings-routes.js';
import { mountRefundRoutes } from './core/refunds-routes.js';
import * as ridersRepo from '../../db/riders-repo.js';
import * as plansRepo from '../../db/platform-plans-repo.js';
import * as tenantSubsRepo from '../../db/tenant-subscriptions-repo.js';
import * as subPaymentsRepo from '../../db/subscription-payments-repo.js';
import { getTenantSubscriptionStatus } from '../../services/subscription-service.js';
import { validateBody } from '../../shared/validate.js';
import { subscribeSchema } from '../../shared/validation.js';
import { tenantManager } from '../../bot/tenant-manager.js';
import * as aiPausedRepo from '../../db/ai-paused-repo.js';
import * as pgMessagesRepo from '../../db/pg-messages-repo.js';
import { saveMedia } from '../../shared/storage.js';
import { MAX_UPLOAD_SIZE_MB } from '../../config.js';
import { productExtractionRouter } from './api-product-extraction.js';
import { calendarMobileRouter } from './api-calendar.js';
import { logger } from '../../shared/logger.js';
import { setNotificationSettings } from '../../queue/daily-summary-scheduler.js';
import { setTenantFlows, toggleFlow } from '../../queue/followup-scheduler.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
    }
  },
});

const router = Router();
router.use(requireMobileOrDeviceAuth);

// ══════════════════════════════════════════════
// Product image upload (before mountProductRoutes)
// ══════════════════════════════════════════════

router.post('/upload/product-image', upload.single('image'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No image uploaded' });
    return;
  }
  const tenantId = getTenantId(req);
  const ext = req.file.mimetype === 'image/png' ? '.png'
    : req.file.mimetype === 'image/webp' ? '.webp' : '.jpg';
  const relativePath = await saveMedia(tenantId, 'products', req.file.buffer, ext);
  res.json({ imageUrl: relativePath });
});

// ══════════════════════════════════════════════
// Dashboard (mobile-only: aggregated stats)
// ══════════════════════════════════════════════

router.get('/dashboard', async (req, res) => {
  const tenantId = getTenantId(req);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    productsCount,
    totalOrders,
    pendingOrders,
    pendingPayments,
    session,
    todayStats,
  ] = await Promise.all([
    productsRepo.getProductsCount(tenantId),
    ordersRepo.getOrderCount(tenantId),
    ordersRepo.getOrderCount(tenantId, 'pending'),
    handleGetPendingPayments(tenantId),
    sessionsRepo.getSession(tenantId),
    queryOne<{ count: string; revenue: string }>(
      `SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as revenue
       FROM orders WHERE tenant_id = $1 AND created_at >= $2`,
      [tenantId, todayStart.toISOString()],
    ),
  ]);

  res.json({
    productsCount,
    ordersCount: totalOrders,
    pendingOrdersCount: pendingOrders,
    pendingPaymentsCount: pendingPayments.length,
    todayOrdersCount: Number(todayStats?.count ?? 0),
    todayRevenue: Number(todayStats?.revenue ?? 0),
    connectionStatus: session?.connectionStatus ?? 'disconnected',
  });
});

// ══════════════════════════════════════════════
// Shared CRUD routes (same logic as web, different auth)
// ══════════════════════════════════════════════

mountProductRoutes(router, '/products');
mountOrderRoutes(router, '/orders');
mountPaymentRoutes(router, '/payments');
mountCustomerRoutes(router, '/customers');
mountSettingRoutes(router, '/settings');
mountRefundRoutes(router, '/refunds');

// ══════════════════════════════════════════════
// Platform Subscription (subscription status + plans)
// ══════════════════════════════════════════════

router.get('/subscription', async (req, res) => {
  const tenantId = getTenantId(req);
  const status = await getTenantSubscriptionStatus(tenantId);
  res.json(status);
});

router.get('/plans', async (_req, res) => {
  const plans = await plansRepo.getAllPlans(true);
  res.json(plans);
});

router.post('/subscription/subscribe', validateBody(subscribeSchema), async (req, res) => {
  const tenantId = getTenantId(req);
  const { planId } = req.body;
  const plan = await plansRepo.getPlanById(planId);
  if (!plan || !plan.active) {
    res.status(404).json({ error: 'Plan not found or inactive' });
    return;
  }

  const sub = await tenantSubsRepo.subscribe(tenantId, plan.id, plan.billingCycle);

  // If paid plan, create a pending payment
  if (plan.price > 0) {
    await subPaymentsRepo.createPayment({
      tenantId,
      subscriptionType: 'platform',
      subscriptionId: sub.id,
      amount: plan.price,
      periodStart: sub.currentPeriodStart,
      periodEnd: sub.currentPeriodEnd,
    });
  }

  // Return subscription status (matches PlatformSubscriptionStatus DTO)
  const status = await getTenantSubscriptionStatus(tenantId);
  res.status(201).json(status);
});

// ══════════════════════════════════════════════
// Rider location updates (delivery tracking)
// ══════════════════════════════════════════════

router.put('/riders/:id/location', async (req, res) => {
  const tenantId = getTenantId(req);
  const riderId = Number(req.params.id);
  const { lat, lng } = req.body;

  if (typeof lat !== 'number' || typeof lng !== 'number') {
    res.status(400).json({ error: 'lat and lng are required as numbers' });
    return;
  }

  const rider = await ridersRepo.updateRiderLocation(tenantId, riderId, lat, lng);
  if (!rider) {
    res.status(404).json({ error: 'Rider not found' });
    return;
  }

  res.json({ success: true, locationUpdatedAt: rider.locationUpdatedAt });
});

// ══════════════════════════════════════════════
// WhatsApp Connection (Feature 1A)
// ══════════════════════════════════════════════

router.get('/whatsapp/status', async (req, res) => {
  const tenantId = getTenantId(req);
  const status = await tenantManager.getStatus(tenantId);
  const session = status.session;
  res.json({
    connectionStatus: session?.connectionStatus ?? 'disconnected',
    phoneNumber: (await queryOne('SELECT phone FROM tenants WHERE id = $1', [tenantId]))?.phone ?? null,
    lastConnectedAt: session?.lastConnectedAt ?? null,
    lastQrAt: session?.lastQrAt ?? null,
    reconnectAttempts: session?.reconnectAttempts ?? 0,
    errorMessage: session?.errorMessage ?? null,
    workerRunning: status.running,
    qrAvailable: status.qrAvailable,
  });
});

router.get('/whatsapp/qr', async (req, res) => {
  const tenantId = getTenantId(req);
  const status = await tenantManager.getStatus(tenantId);
  if (status.session?.connectionStatus === 'connected') {
    res.json({ status: 'connected', qr: null });
  } else {
    const qr = tenantManager.getQr(tenantId);
    res.json({ status: qr ? 'waiting' : 'disconnected', qr });
  }
});

router.post('/whatsapp/connect', async (req, res) => {
  const tenantId = getTenantId(req);
  const bridge = tenantManager.getBridge(tenantId);
  if (bridge?.isRunning()) {
    res.json({ ok: true, alreadyRunning: true });
    return;
  }
  await tenantManager.startTenant(tenantId);
  res.json({ ok: true });
});

router.post('/whatsapp/disconnect', async (req, res) => {
  const tenantId = getTenantId(req);
  await tenantManager.stopTenant(tenantId);
  res.json({ ok: true });
});

router.post('/whatsapp/reset', async (req, res) => {
  const tenantId = getTenantId(req);
  await tenantManager.resetTenant(tenantId);
  res.json({ ok: true });
});

// ══════════════════════════════════════════════
// Conversations (Feature 2A)
// ══════════════════════════════════════════════

// WhatsApp JID formats: @s.whatsapp.net, @lid, @g.us, @broadcast
const JID_REGEX = /^[\d]+@(s\.whatsapp\.net|lid|g\.us|broadcast)$|^[\d]+-[\d]+@g\.us$/;
const MAX_MESSAGE_LENGTH = 4096;

function validateJid(jid: string): boolean {
  return JID_REGEX.test(jid);
}

router.get('/conversations', async (req, res) => {
  const tenantId = getTenantId(req);
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const offset = Number(req.query.offset) || 0;
  const { conversations, total } = await pgMessagesRepo.getConversationList(tenantId, limit, offset);
  // Enrich with ai paused status
  const pausedSet = await aiPausedRepo.getPausedContacts(tenantId);
  const enriched = conversations.map(c => ({
    ...c,
    aiPaused: pausedSet.has(c.jid),
  }));
  res.json({ conversations: enriched, total });
});

router.get('/conversations/:jid/messages', async (req, res) => {
  const tenantId = getTenantId(req);
  const jid = decodeURIComponent(req.params.jid);
  if (!validateJid(jid)) {
    res.status(400).json({ error: 'Invalid JID format' });
    return;
  }
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Number(req.query.offset) || 0;
  const { messages, total, customerName } = await pgMessagesRepo.getConversationMessages(tenantId, jid, limit, offset);
  const aiPaused = await aiPausedRepo.isContactPaused(tenantId, jid);
  res.json({ messages, total, customerName, aiPaused });
});

router.post('/conversations/:jid/pause-ai', async (req, res) => {
  const tenantId = getTenantId(req);
  const jid = decodeURIComponent(req.params.jid);
  if (!validateJid(jid)) {
    res.status(400).json({ error: 'Invalid JID format' });
    return;
  }
  const { paused } = req.body;
  if (typeof paused !== 'boolean') {
    res.status(400).json({ error: 'paused must be a boolean' });
    return;
  }
  if (paused) {
    await aiPausedRepo.pauseContact(tenantId, jid);
  } else {
    await aiPausedRepo.resumeContact(tenantId, jid);
  }
  res.json({ ok: true, aiPaused: paused });
});

router.post('/conversations/:jid/send', async (req, res) => {
  const tenantId = getTenantId(req);
  const jid = decodeURIComponent(req.params.jid);
  if (!validateJid(jid)) {
    res.status(400).json({ error: 'Invalid JID format' });
    return;
  }
  const { message } = req.body;
  if (!message || typeof message !== 'string' || !message.trim()) {
    res.status(400).json({ error: 'message is required' });
    return;
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    res.status(400).json({ error: `Message too long (max ${MAX_MESSAGE_LENGTH} characters)` });
    return;
  }
  const trimmed = message.trim();
  try {
    await tenantManager.sendMessage(tenantId, jid, trimmed);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Unknown error';
    logger.error({ tenantId, jid, err: errMsg }, 'Failed to send message from mobile app');
    res.status(502).json({ error: 'Message could not be delivered via WhatsApp', detail: errMsg });
    return;
  }
  await pgMessagesRepo.logMessagePg({
    tenantId, channel: 'whatsapp', jid, pushName: null,
    direction: 'outgoing', body: trimmed,
    timestamp: new Date().toISOString(),
  });
  res.json({ ok: true });
});

// ══════════════════════════════════════════════
// Feature 1: 3-Minute Onboarding (Voice/Photo Products)
// ══════════════════════════════════════════════

router.use('/products/extract', productExtractionRouter);

// ══════════════════════════════════════════════
// Feature 2: Daily Summary Settings
// ══════════════════════════════════════════════

router.get('/notifications/settings', async (req, res) => {
  const tenantId = getTenantId(req);
  const { getNotificationSettings } = await import('../../queue/daily-summary-scheduler.js');
  const settings = getNotificationSettings(tenantId);
  res.json(settings || { enabled: true, time: '06:00', timezone: 'America/Lima' });
});

router.post('/notifications/settings', async (req, res) => {
  const tenantId = getTenantId(req);
  const { enabled, time, timezone } = req.body;
  
  setNotificationSettings(tenantId, {
    enabled: enabled ?? true,
    time: time || '06:00',
    timezone: timezone || 'America/Lima',
  });
  
  res.json({ ok: true });
});

// ══════════════════════════════════════════════
// Feature 4: Google Calendar
// ══════════════════════════════════════════════

router.use('/calendar', calendarMobileRouter);

// ══════════════════════════════════════════════
// Feature 5: Follow-up Flows Settings
// ══════════════════════════════════════════════

router.get('/followup-flows', async (req, res) => {
  const tenantId = getTenantId(req);
  const { getTenantFlows } = await import('../../queue/followup-scheduler.js');
  const flows = getTenantFlows(tenantId);
  res.json(flows);
});

router.post('/followup-flows/:type/toggle', async (req, res) => {
  const tenantId = getTenantId(req);
  const { type } = req.params;
  const { enabled } = req.body;
  
  toggleFlow(tenantId, type as any, enabled);
  res.json({ ok: true });
});

export { router as mobileRouter };
