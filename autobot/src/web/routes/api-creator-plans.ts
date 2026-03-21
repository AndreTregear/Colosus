import { Router } from 'express';
import * as creatorPlansRepo from '../../db/creator-plans-repo.js';
import { requireTenantAuth } from '../middleware/tenant-auth.js';
import { validateBody, getTenantId } from '../../shared/validate.js';
import { createCreatorPlanSchema, updateCreatorPlanSchema } from '../../shared/validation.js';

const router = Router();
router.use(requireTenantAuth);

// GET /api/creator/plans — list my plans
router.get('/', async (req, res) => {
  const includeInactive = req.query.all === 'true';
  const plans = await creatorPlansRepo.getPlans(getTenantId(req), !includeInactive);
  res.json(plans);
});

// POST /api/creator/plans — create a plan
router.post('/', validateBody(createCreatorPlanSchema), async (req, res) => {
  const { name, description, price, billingCycle, contentType, features } = req.body;
  const plan = await creatorPlansRepo.createPlan(getTenantId(req), {
    name,
    description,
    price,
    billingCycle,
    contentType,
    features,
  });
  res.status(201).json(plan);
});

// PUT /api/creator/plans/:id — update plan
router.put('/:id', validateBody(updateCreatorPlanSchema), async (req, res) => {
  const plan = await creatorPlansRepo.updatePlan(getTenantId(req), Number(req.params.id), req.body);
  if (!plan) {
    res.status(404).json({ error: 'Plan not found' });
    return;
  }
  res.json(plan);
});

// DELETE /api/creator/plans/:id — deactivate plan
router.delete('/:id', async (req, res) => {
  const deleted = await creatorPlansRepo.deletePlan(getTenantId(req), Number(req.params.id));
  if (!deleted) {
    res.status(404).json({ error: 'Plan not found' });
    return;
  }
  res.json({ ok: true });
});

export { router as creatorPlansRouter };
