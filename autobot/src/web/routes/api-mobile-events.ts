import { Router, type Request, type Response } from 'express';
import { requireMobileOrDeviceAuth } from '../middleware/mobile-auth.js';
import { getTenantId } from '../../shared/validate.js';
import { appBus } from '../../shared/events.js';
import { logger } from '../../shared/logger.js';

const router = Router();
router.use(requireMobileOrDeviceAuth);

// Per-tenant SSE connection tracking (max 3 concurrent connections per tenant)
const MAX_SSE_PER_TENANT = 3;
const tenantConnections = new Map<string, number>();

router.get('/', (req: Request, res: Response) => {
  const tenantId = getTenantId(req);

  // Enforce SSE connection limit per tenant
  const current = tenantConnections.get(tenantId) ?? 0;
  if (current >= MAX_SSE_PER_TENANT) {
    res.status(429).json({ error: 'Too many SSE connections' });
    return;
  }
  tenantConnections.set(tenantId, current + 1);

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();

  const send = (event: string, data: Record<string, unknown>) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  // Heartbeat
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30_000);

  // Event listeners scoped to this tenant
  const onConnectionUpdate = (tid: string, state: string) => {
    if (tid !== tenantId) return;
    send('connection-update', { status: state });
  };
  const onMessageLogged = (msg: any) => {
    if (msg.tenantId && msg.tenantId !== tenantId) return;
    send('new-message', {
      jid: msg.jid,
      direction: msg.direction,
      preview: (msg.body || '').slice(0, 100),
      timestamp: msg.timestamp,
      pushName: msg.pushName,
    });
  };
  const onTenantError = (tid: string, error: string) => {
    if (tid !== tenantId) return;
    send('health-alert', { message: error });
  };
  const onTenantHealthAlert = (tid: string, message: string) => {
    if (tid !== tenantId) return;
    send('health-alert', { message });
  };
  const onPaymentMatched = (tid: string, paymentId: number, orderId: number, customerJid: string) => {
    if (tid !== tenantId) return;
    send('payment-matched', { paymentId, orderId, customerJid });
  };
  const onAiJobFailed = (tid: string, jid: string, reason: string) => {
    if (tid !== tenantId) return;
    send('ai-uncertainty', { jid, reason });
  };

  appBus.on('connection-update', onConnectionUpdate);
  appBus.on('message-logged', onMessageLogged);
  appBus.on('tenant-error', onTenantError);
  appBus.on('tenant-health-alert', onTenantHealthAlert);
  appBus.on('yape-payment-matched', onPaymentMatched);
  appBus.on('ai-job-failed', onAiJobFailed);

  // Send initial connection event (no tenantId leaked)
  send('connected', { ok: true });

  req.on('close', () => {
    clearInterval(heartbeat);
    appBus.removeListener('connection-update', onConnectionUpdate);
    appBus.removeListener('message-logged', onMessageLogged);
    appBus.removeListener('tenant-error', onTenantError);
    appBus.removeListener('tenant-health-alert', onTenantHealthAlert);
    appBus.removeListener('yape-payment-matched', onPaymentMatched);
    appBus.removeListener('ai-job-failed', onAiJobFailed);
    // Decrement connection count
    const count = tenantConnections.get(tenantId) ?? 1;
    if (count <= 1) {
      tenantConnections.delete(tenantId);
    } else {
      tenantConnections.set(tenantId, count - 1);
    }
    logger.debug({ tenantId }, 'SSE client disconnected');
  });
});

export { router as mobileEventsRouter };
