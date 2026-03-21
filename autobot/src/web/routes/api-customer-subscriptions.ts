import { Router } from 'express';
import * as custSubsRepo from '../../db/customer-subscriptions-repo.js';
import * as creatorPlansRepo from '../../db/creator-plans-repo.js';
import * as subPaymentsRepo from '../../db/subscription-payments-repo.js';
import { requireTenantAuth } from '../middleware/tenant-auth.js';
import { requireDeviceAuth } from '../middleware/device-auth.js';
import { validateBody, getTenantId, parsePagination } from '../../shared/validate.js';
import { createCustomerSubscriptionSchema } from '../../shared/validation.js';

// --- Tenant-scoped routes (session/API key auth) ---
const router = Router();
router.use(requireTenantAuth);

// GET /api/creator/subscriptions — list customer subscriptions
router.get('/', async (req, res) => {
  const { limit, offset } = parsePagination(req.query);
  const filters: custSubsRepo.SubscriptionFilters = {
    customerId: req.query.customerId ? Number(req.query.customerId) : undefined,
    planId: req.query.planId ? Number(req.query.planId) : undefined,
    status: req.query.status as string | undefined,
    limit,
    offset,
  };
  const subs = await custSubsRepo.getSubscriptions(getTenantId(req), filters);
  const total = await custSubsRepo.getSubscriptionCount(getTenantId(req), filters.status);
  res.json({ subscriptions: subs, total });
});

// POST /api/creator/subscriptions — subscribe a customer to a plan
router.post('/', validateBody(createCustomerSubscriptionSchema), async (req, res) => {
  const { customerId, planId } = req.body;
  const plan = await creatorPlansRepo.getPlanById(getTenantId(req), planId);
  if (!plan || !plan.active) {
    res.status(404).json({ error: 'Plan not found or inactive' });
    return;
  }

  const sub = await custSubsRepo.subscribe(getTenantId(req), customerId, plan.id, plan.billingCycle);

  // Create pending payment if plan has a price
  if (plan.price > 0) {
    await subPaymentsRepo.createPayment({
      tenantId: getTenantId(req),
      subscriptionType: 'creator',
      subscriptionId: sub.id,
      amount: plan.price,
      periodStart: sub.currentPeriodStart,
      periodEnd: sub.currentPeriodEnd,
    });
  }

  res.status(201).json(sub);
});

// POST /api/creator/subscriptions/:id/cancel — cancel customer subscription
router.post('/:id/cancel', async (req, res) => {
  const sub = await custSubsRepo.cancelSubscription(getTenantId(req), Number(req.params.id));
  if (!sub) {
    res.status(404).json({ error: 'Subscription not found' });
    return;
  }
  res.json(sub);
});

// GET /api/creator/subscriptions/:id/payments — payment history
router.get('/:id/payments', async (req, res) => {
  const payments = await subPaymentsRepo.getPaymentsBySubscription(getTenantId(req), 'creator', Number(req.params.id));
  res.json(payments);
});

// POST /api/creator/subscriptions/:id/pay — create renewal payment
router.post('/:id/pay', async (req, res) => {
  const sub = await custSubsRepo.getSubscription(getTenantId(req), Number(req.params.id));
  if (!sub) {
    res.status(404).json({ error: 'Subscription not found' });
    return;
  }
  const plan = await creatorPlansRepo.getPlanById(getTenantId(req), sub.planId);
  if (!plan || plan.price <= 0) {
    res.status(400).json({ error: 'Free plans do not require payment' });
    return;
  }

  const payment = await subPaymentsRepo.createPayment({
    tenantId: getTenantId(req),
    subscriptionType: 'creator',
    subscriptionId: sub.id,
    amount: plan.price,
    periodStart: sub.currentPeriodStart,
    periodEnd: sub.currentPeriodEnd,
  });
  res.status(201).json(payment);
});

export { router as customerSubscriptionsRouter };

// --- Mobile-facing routes (device auth) ---
const mobileRouter = Router();
mobileRouter.use(requireDeviceAuth);

// GET /api/v1/creator/plans — list tenant's creator plans
mobileRouter.get('/plans', async (req, res) => {
  const plans = await creatorPlansRepo.getPlans(getTenantId(req));
  res.json(plans);
});

// GET /api/v1/creator/subscriptions — list customer subscriptions
mobileRouter.get('/subscriptions', async (req, res) => {
  const { limit, offset } = parsePagination(req.query);
  const filters: custSubsRepo.SubscriptionFilters = {
    customerId: req.query.customerId ? Number(req.query.customerId) : undefined,
    status: req.query.status as string | undefined,
    limit,
    offset,
  };
  const subs = await custSubsRepo.getSubscriptions(getTenantId(req), filters);
  const total = await custSubsRepo.getSubscriptionCount(getTenantId(req), filters.status);
  res.json({ subscriptions: subs, total });
});

// POST /api/v1/creator/subscriptions — subscribe customer
mobileRouter.post('/subscriptions', validateBody(createCustomerSubscriptionSchema), async (req, res) => {
  const { customerId, planId } = req.body;
  const plan = await creatorPlansRepo.getPlanById(getTenantId(req), planId);
  if (!plan || !plan.active) {
    res.status(404).json({ error: 'Plan not found or inactive' });
    return;
  }

  const sub = await custSubsRepo.subscribe(getTenantId(req), customerId, plan.id, plan.billingCycle);

  if (plan.price > 0) {
    await subPaymentsRepo.createPayment({
      tenantId: getTenantId(req),
      subscriptionType: 'creator',
      subscriptionId: sub.id,
      amount: plan.price,
      periodStart: sub.currentPeriodStart,
      periodEnd: sub.currentPeriodEnd,
    });
  }

  res.status(201).json(sub);
});

// POST /api/v1/creator/subscriptions/:id/cancel — cancel
mobileRouter.post('/subscriptions/:id/cancel', async (req, res) => {
  const sub = await custSubsRepo.cancelSubscription(getTenantId(req), Number(req.params.id));
  if (!sub) {
    res.status(404).json({ error: 'Subscription not found' });
    return;
  }
  res.json(sub);
});

export { mobileRouter as mobileCreatorRouter };
