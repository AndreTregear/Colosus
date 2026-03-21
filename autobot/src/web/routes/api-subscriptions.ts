import { Router } from 'express';
import * as tenantSubsRepo from '../../db/tenant-subscriptions-repo.js';
import * as plansRepo from '../../db/platform-plans-repo.js';
import * as subPaymentsRepo from '../../db/subscription-payments-repo.js';
import * as subscriptionService from '../../services/subscription-service.js';
import { ServiceError } from '../../services/errors.js';
import { requireTenantAuth } from '../middleware/tenant-auth.js';
import { validateBody, getTenantId } from '../../shared/validate.js';
import { subscribeSchema } from '../../shared/validation.js';

const router = Router();
router.use(requireTenantAuth);

// GET /api/subscription — get own platform subscription
router.get('/', async (req, res) => {
  const sub = await tenantSubsRepo.getSubscription(getTenantId(req));
  if (!sub) {
    res.json(null);
    return;
  }
  const plan = await plansRepo.getPlanById(sub.planId);
  res.json({ ...sub, plan });
});

// POST /api/subscription/subscribe — subscribe to a platform plan
router.post('/subscribe', validateBody(subscribeSchema), async (req, res) => {
  try {
    const result = await subscriptionService.subscribeTenant(getTenantId(req), req.body.planId);
    res.status(201).json({ ...result.subscription, plan: result.plan });
  } catch (err) {
    if (err instanceof ServiceError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    throw err;
  }
});

// POST /api/subscription/cancel — cancel subscription
router.post('/cancel', async (req, res) => {
  try {
    const cancelled = await subscriptionService.cancelTenantSubscription(getTenantId(req));
    res.json(cancelled);
  } catch (err) {
    if (err instanceof ServiceError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    throw err;
  }
});

// POST /api/subscription/pay — create a pending Yape payment for current period
router.post('/pay', async (req, res) => {
  const sub = await tenantSubsRepo.getSubscription(getTenantId(req));
  if (!sub) {
    res.status(404).json({ error: 'No active subscription found' });
    return;
  }
  const plan = await plansRepo.getPlanById(sub.planId);
  if (!plan || plan.price <= 0) {
    res.status(400).json({ error: 'Free plans do not require payment' });
    return;
  }

  const payment = await subPaymentsRepo.createPayment({
    tenantId: getTenantId(req),
    subscriptionType: 'platform',
    subscriptionId: sub.id,
    amount: plan.price,
    periodStart: sub.currentPeriodStart,
    periodEnd: sub.currentPeriodEnd,
  });
  res.status(201).json(payment);
});

export { router as subscriptionsRouter };
