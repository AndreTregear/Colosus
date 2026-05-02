/**
 * Admin-only API routes.
 * All routes here require session + admin role (enforced at mount point in server.ts).
 */
import { Router } from 'express';
import * as tenantsRepo from '../../db/tenants-repo.js';
import * as pgMessagesRepo from '../../db/pg-messages-repo.js';
import * as tokenUsageRepo from '../../db/token-usage-repo.js';
import * as subscriptionPaymentsRepo from '../../db/subscription-payments-repo.js';
import * as plansRepo from '../../db/platform-plans-repo.js';
import * as tenantSubsRepo from '../../db/tenant-subscriptions-repo.js';
import { getTenantSubscriptionStatus } from '../../services/subscription-service.js';
import { query, queryOne, transaction } from '../../db/pool.js';
import { tenantManager } from '../../bot/tenant-manager.js';
import { parsePagination, handleAction } from '../../shared/validate.js';
import { auth } from '../../auth/auth.js';
import { logger } from '../../shared/logger.js';
import type pg from 'pg';

const router = Router();

// Single-tenant mode uses a default tenant ID
const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';

// --- Platform metrics ---

router.get('/metrics', async (_req, res) => {
  const tenants = await tenantsRepo.getAllTenants();
  const statuses = await Promise.all(
    tenants.map(async (t) => {
      const status = await tenantManager.getStatus(t.id);
      return {
        id: t.id,
        name: t.name,
        slug: t.slug,
        phone: t.phone,
        tenantStatus: t.status,
        running: status.running,
        connectionStatus: status.session?.connectionStatus ?? 'disconnected',
        messagesHandled: status.messagesHandled,
        uptime: status.startedAt ? Math.floor((Date.now() - status.startedAt.getTime()) / 1000) : 0,
      };
    }),
  );
  res.json({ tenants: statuses, totalTenants: tenants.length });
});

// --- Token usage ---

router.get('/token-usage', async (req, res) => {
  const tenantId = req.query.tenantId as string | undefined;
  const from = req.query.from as string | undefined;
  const to = req.query.to as string | undefined;
  const usage = await tokenUsageRepo.getTokenUsage({ tenantId, from, to });
  res.json(usage);
});

router.get('/token-usage/summary', async (req, res) => {
  const from = req.query.from as string | undefined;
  const to = req.query.to as string | undefined;
  const summary = await tokenUsageRepo.getTokenUsageSummary({ from, to });
  res.json(summary);
});

// --- Cross-tenant messages ---

router.get('/messages', async (req, res) => {
  const tenantId = (req.query.tenantId as string) || DEFAULT_TENANT_ID;
  const { limit, offset } = parsePagination(req.query);
  const { conversations, total } = await pgMessagesRepo.getConversationList(tenantId, limit, offset);
  res.json({ conversations, total, limit, offset });
});

// --- Drop tenant connection ---

router.post('/tenants/:id/drop', async (req, res) => {
  await handleAction(res, () => tenantManager.stopTenant(req.params.id), { ok: true, message: 'Connection dropped' });
});

// POST /api/admin/tenants — create tenant with admin user
router.post('/tenants', async (req, res) => {
  const { name, slug, phone, adminEmail, adminPassword, planId } = req.body;
  
  if (!name || !slug || !adminEmail || !adminPassword) {
    res.status(400).json({ error: 'Name, slug, adminEmail, and adminPassword are required' });
    return;
  }
  
  if (adminPassword.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' });
    return;
  }
  
  try {
    // Check if slug already exists
    const existing = await tenantsRepo.getTenantBySlug(slug);
    if (existing) {
      res.status(409).json({ error: 'Slug already taken' });
      return;
    }
    
    // Create tenant
    const tenant = await tenantsRepo.createTenant({ 
      name, 
      slug, 
      phone,
      settings: { planId: planId || null }
    });
    
    // Create admin user for tenant
    try {
      await auth.api.signUpEmail({
        body: {
          email: adminEmail,
          password: adminPassword,
          name: name,
          tenantId: tenant.id
        },
      });

      // Update user with tenantId
      await query(
        'UPDATE "user" SET "tenantId" = $1 WHERE email = $2',
        [tenant.id, adminEmail]
      );
      
      logger.info({ tenantId: tenant.id, email: adminEmail }, 'Created tenant with admin user');
      
      res.status(201).json({
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          phone: tenant.phone,
        },
        admin: {
          email: adminEmail,
          tenantId: tenant.id,
        }
      });
    } catch (authErr) {
      // If user creation fails, delete the tenant
      await tenantsRepo.deleteTenant(tenant.id);
      logger.error({ err: authErr, email: adminEmail }, 'Failed to create admin user');
      res.status(400).json({ error: 'Failed to create admin user. Email may already exist.' });
    }
  } catch (err) {
    logger.error({ err, slug }, 'Failed to create tenant');
    res.status(500).json({ error: 'Failed to create tenant' });
  }
});

// --- Users ---

router.get('/users', async (_req, res) => {
  const { rows } = await query(
    `SELECT u.id, u.name, u.email, u.role, u."tenantId", u."createdAt",
            t.name AS tenant_name, t.slug AS tenant_slug
     FROM "user" u
     LEFT JOIN tenants t ON t.id::text = u."tenantId"
     ORDER BY u."createdAt" DESC`,
  );
  res.json(rows.map(r => ({
    id: r.id,
    name: r.name,
    email: r.email,
    role: r.role || 'user',
    tenantId: r.tenantId,
    tenantName: r.tenant_name,
    tenantSlug: r.tenant_slug,
    createdAt: r.createdAt,
  })));
});

// --- Tenant subscriptions ---

router.get('/subscriptions', async (req, res) => {
  const status = req.query.status as string | undefined;
  const params: unknown[] = [];
  let where = '';
  if (status) {
    params.push(status);
    where = `WHERE ts.status = $${params.length}`;
  }
  const { rows } = await query(
    `SELECT ts.*, t.name AS tenant_name, pp.name AS plan_name, pp.price AS plan_price, pp.billing_cycle
     FROM tenant_subscriptions ts
     JOIN tenants t ON t.id = ts.tenant_id
     JOIN platform_plans pp ON pp.id = ts.plan_id
     ${where}
     ORDER BY ts.created_at DESC`,
    params,
  );
  res.json(rows.map(r => ({
    id: r.id,
    tenantId: r.tenant_id,
    tenantName: r.tenant_name,
    planId: r.plan_id,
    planName: r.plan_name,
    planPrice: Number(r.plan_price),
    billingCycle: r.billing_cycle,
    status: r.status,
    currentPeriodStart: r.current_period_start,
    currentPeriodEnd: r.current_period_end,
    cancelledAt: r.cancelled_at,
    createdAt: r.created_at,
  })));
});

// --- Subscription payments ---

router.get('/payments', async (req, res) => {
  const status = req.query.status as string | undefined;
  const { limit, offset } = parsePagination(req.query);
  const params: unknown[] = [];
  let where = '';
  if (status) {
    params.push(status);
    where = `WHERE sp.status = $${params.length}`;
  }
  const countResult = await query(`SELECT count(*)::int AS total FROM subscription_payments sp ${where}`, params);
  const total = countResult.rows[0]?.total ?? 0;
  params.push(limit, offset);
  const { rows } = await query(
    `SELECT sp.*, t.name AS tenant_name
     FROM subscription_payments sp
     JOIN tenants t ON t.id = sp.tenant_id
     ${where}
     ORDER BY sp.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );
  res.json({
    total,
    payments: rows.map(r => ({
      id: r.id,
      tenantId: r.tenant_id,
      tenantName: r.tenant_name,
      subscriptionType: r.subscription_type,
      subscriptionId: r.subscription_id,
      amount: Number(r.amount),
      periodStart: r.period_start,
      periodEnd: r.period_end,
      status: r.status,
      paymentMethod: r.payment_method,
      reference: r.reference,
      confirmedAt: r.confirmed_at,
      createdAt: r.created_at,
    })),
  });
});

// --- Confirm a pending payment ---

router.post('/payments/:id/confirm', async (req, res) => {
  const id = Number(req.params.id);
  const row = await queryOne<{ tenant_id: string }>(
    `SELECT tenant_id FROM subscription_payments WHERE id = $1 AND status = 'pending'`,
    [id],
  );
  if (!row) {
    res.status(404).json({ error: 'Pending payment not found' });
    return;
  }
  const reference = req.body?.reference || 'admin-manual';
  const payment = await subscriptionPaymentsRepo.confirmPayment(row.tenant_id, id, reference);
  if (!payment) {
    res.status(400).json({ error: 'Could not confirm payment' });
    return;
  }
  res.json({ ok: true, payment });
});

// --- Unmatched Yape Payments ---

router.get('/unmatched-payments', async (req, res) => {
  const { limit, offset } = parsePagination(req.query);

  // Count total unmatched/pending notifications
  const countResult = await query(
    `SELECT count(*)::int AS total FROM yape_notifications WHERE status IN ('pending', 'unmatched')`,
  );
  const total = countResult.rows[0]?.total ?? 0;

  // Get notifications with potential order matches
  const { rows: notifications } = await query(
    `SELECT yn.id, yn.tenant_id, yn.device_id, yn.sender_name, yn.amount,
            yn.captured_at, yn.status, yn.matched_payment_id, yn.created_at,
            t.name AS tenant_name
     FROM yape_notifications yn
     LEFT JOIN tenants t ON t.id = yn.tenant_id
     WHERE yn.status IN ('pending', 'unmatched')
     ORDER BY yn.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset],
  );

  // For each notification, find potential matching orders
  const results = await Promise.all(
    notifications.map(async (n) => {
      const { rows: matches } = await query(
        `SELECT o.id AS order_id, o.total, o.status AS order_status, o.created_at AS order_created_at,
                c.name AS customer_name, c.jid AS customer_jid,
                p.id AS payment_id, p.status AS payment_status
         FROM orders o
         JOIN customers c ON o.customer_id = c.id AND o.tenant_id = c.tenant_id
         LEFT JOIN payments p ON p.order_id = o.id AND p.tenant_id = o.tenant_id AND p.status = 'pending'
         WHERE o.tenant_id = $1
           AND o.status = 'payment_requested'
           AND o.total = $2`,
        [n.tenant_id, n.amount],
      );

      return {
        id: n.id,
        tenantId: n.tenant_id,
        tenantName: n.tenant_name,
        deviceId: n.device_id,
        senderName: n.sender_name,
        amount: Number(n.amount),
        capturedAt: n.captured_at,
        status: n.status,
        matchedPaymentId: n.matched_payment_id,
        createdAt: n.created_at,
        potentialMatches: matches.map((m) => ({
          orderId: m.order_id,
          total: Number(m.total),
          orderStatus: m.order_status,
          orderCreatedAt: m.order_created_at,
          customerName: m.customer_name,
          customerJid: m.customer_jid,
          paymentId: m.payment_id,
          paymentStatus: m.payment_status,
        })),
      };
    }),
  );

  res.json({ total, notifications: results });
});

router.post('/unmatched-payments/:id/match', async (req, res) => {
  const notifId = Number(req.params.id);
  const { paymentId } = req.body;
  if (!paymentId) {
    res.status(400).json({ error: 'paymentId is required' });
    return;
  }

  try {
    await transaction(async (client: pg.PoolClient) => {
      // Verify notification exists and is pending/unmatched
      const notif = (await client.query(
        `SELECT * FROM yape_notifications WHERE id = $1 AND status IN ('pending', 'unmatched') FOR UPDATE`,
        [notifId],
      )).rows[0];
      if (!notif) throw new Error('Notification not found or already resolved');

      // Verify payment exists and is pending
      const payment = (await client.query(
        `SELECT * FROM payments WHERE id = $1 AND status = 'pending' FOR UPDATE`,
        [paymentId],
      )).rows[0];
      if (!payment) throw new Error('Payment not found or not pending');

      // Update yape notification
      await client.query(
        `UPDATE yape_notifications SET matched_payment_id = $1, status = 'confirmed' WHERE id = $2`,
        [paymentId, notifId],
      );

      // Update payment
      await client.query(
        `UPDATE payments SET status = 'confirmed', confirmed_by = 'admin', confirmed_at = now() WHERE id = $1`,
        [paymentId],
      );

      // Update order
      await client.query(
        `UPDATE orders SET status = 'paid', updated_at = now() WHERE id = $1`,
        [payment.order_id],
      );
    });

    logger.info({ notifId, paymentId }, 'Admin manually matched yape notification to payment');
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.post('/unmatched-payments/:id/dismiss', async (req, res) => {
  const notifId = Number(req.params.id);
  const row = await queryOne(
    `SELECT id FROM yape_notifications WHERE id = $1 AND status IN ('pending', 'unmatched')`,
    [notifId],
  );
  if (!row) {
    res.status(404).json({ error: 'Notification not found or already resolved' });
    return;
  }

  await query(
    `UPDATE yape_notifications SET status = 'dismissed' WHERE id = $1`,
    [notifId],
  );
  logger.info({ notifId }, 'Admin dismissed yape notification');
  res.json({ ok: true });
});

// --- Expired / Stale Orders ---

router.get('/orders/expired', async (_req, res) => {
  const { rows } = await query(
    `SELECT o.id, o.tenant_id, o.customer_id, o.total, o.status,
            o.reminder_count, o.created_at, o.updated_at,
            c.name AS customer_name, c.jid AS customer_jid,
            t.name AS tenant_name
     FROM orders o
     JOIN customers c ON o.customer_id = c.id AND o.tenant_id = c.tenant_id
     LEFT JOIN tenants t ON t.id = o.tenant_id
     WHERE o.status = 'payment_requested'
       AND o.created_at < now() - INTERVAL '24 hours'
     ORDER BY o.created_at ASC`,
  );

  res.json(rows.map((r) => ({
    id: r.id,
    tenantId: r.tenant_id,
    tenantName: r.tenant_name,
    customerId: r.customer_id,
    customerName: r.customer_name,
    customerJid: r.customer_jid,
    total: Number(r.total),
    status: r.status,
    reminderCount: r.reminder_count,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  })));
});

router.post('/orders/:id/expire', async (req, res) => {
  const orderId = Number(req.params.id);

  try {
    await transaction(async (client: pg.PoolClient) => {
      // Lock and verify order
      const order = (await client.query(
        `SELECT * FROM orders WHERE id = $1 AND status = 'payment_requested' FOR UPDATE`,
        [orderId],
      )).rows[0];
      if (!order) throw new Error('Order not found or not in payment_requested status');

      // Cancel the order
      await client.query(
        `UPDATE orders SET status = 'cancelled', updated_at = now() WHERE id = $1`,
        [orderId],
      );

      // Restore stock for all order items
      const items = (await client.query(
        `SELECT oi.product_id, oi.quantity FROM order_items oi WHERE oi.order_id = $1`,
        [orderId],
      )).rows;

      for (const item of items) {
        await client.query(
          `UPDATE products SET stock = stock + $1 WHERE id = $2 AND stock IS NOT NULL`,
          [item.quantity, item.product_id],
        );
      }

      // Expire any pending payments for this order
      await client.query(
        `UPDATE payments SET status = 'expired' WHERE order_id = $1 AND status = 'pending'`,
        [orderId],
      );
    });

    logger.info({ orderId }, 'Admin expired stale order and restored stock');
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// --- Set tenant subscription tier (admin override) ---

router.put('/subscriptions/:tenantId', async (req, res) => {
  const { tenantId } = req.params;
  const { planId, skipPayment } = req.body;

  if (!planId || typeof planId !== 'number') {
    res.status(400).json({ error: 'planId (number) is required' });
    return;
  }

  const tenant = await tenantsRepo.getTenantById(tenantId);
  if (!tenant) {
    res.status(404).json({ error: 'Tenant not found' });
    return;
  }

  const plan = await plansRepo.getPlanById(planId);
  if (!plan) {
    res.status(404).json({ error: 'Plan not found' });
    return;
  }

  try {
    const subscription = await tenantSubsRepo.subscribe(tenantId, plan.id, plan.billingCycle);

    // If it's a paid plan assigned by admin, optionally create a pending payment
    if (plan.price > 0 && !skipPayment) {
      await subscriptionPaymentsRepo.createPayment({
        tenantId,
        subscriptionType: 'platform',
        subscriptionId: subscription.id,
        amount: plan.price,
        periodStart: subscription.currentPeriodStart,
        periodEnd: subscription.currentPeriodEnd,
      });
    }

    const status = await getTenantSubscriptionStatus(tenantId);

    logger.info({ tenantId, planId, planSlug: plan.slug }, 'Admin changed tenant subscription tier');
    res.json({ ok: true, subscription: status });
  } catch (err) {
    logger.error({ err, tenantId, planId }, 'Failed to change tenant subscription');
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

// --- Cancel tenant subscription (admin) ---

router.delete('/subscriptions/:tenantId', async (req, res) => {
  const { tenantId } = req.params;
  const sub = await tenantSubsRepo.getSubscription(tenantId);
  if (!sub) {
    res.status(404).json({ error: 'No active subscription found' });
    return;
  }
  const cancelled = await tenantSubsRepo.cancelSubscription(tenantId, sub.id);
  if (!cancelled) {
    res.status(400).json({ error: 'Failed to cancel subscription' });
    return;
  }
  logger.info({ tenantId, subscriptionId: sub.id }, 'Admin cancelled tenant subscription');
  res.json({ ok: true, subscription: cancelled });
});

export { router as adminRouter };
