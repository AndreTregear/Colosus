import { Router } from 'express';
import * as plansRepo from '../../db/platform-plans-repo.js';
import { validateBody } from '../../shared/validate.js';
import { createPlatformPlanSchema, updatePlatformPlanSchema } from '../../shared/validation.js';

const router = Router();

// GET /api/plans — list active platform plans (public)
router.get('/', async (_req, res) => {
  const plans = await plansRepo.getAllPlans(true);
  res.json(plans);
});

// GET /api/plans/:id — plan details (public)
router.get('/:id', async (req, res) => {
  const plan = await plansRepo.getPlanById(Number(req.params.id));
  if (!plan) {
    res.status(404).json({ error: 'Plan not found' });
    return;
  }
  res.json(plan);
});

export { router as platformPlansRouter };

// Admin CRUD — mounted separately under /api/admin/plans
const adminRouter = Router();

adminRouter.get('/', async (_req, res) => {
  const plans = await plansRepo.getAllPlans(false);
  res.json(plans);
});

adminRouter.post('/', validateBody(createPlatformPlanSchema), async (req, res) => {
  const { name, slug, description, price, billingCycle, features, limits, sortOrder } = req.body;
  const plan = await plansRepo.createPlan({ name, slug, description, price, billingCycle, features, limits, sortOrder });
  res.status(201).json(plan);
});

adminRouter.put('/:id', validateBody(updatePlatformPlanSchema), async (req, res) => {
  const plan = await plansRepo.updatePlan(Number(req.params.id), req.body);
  if (!plan) {
    res.status(404).json({ error: 'Plan not found' });
    return;
  }
  res.json(plan);
});

export { adminRouter as adminPlansRouter };
