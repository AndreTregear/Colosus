import type { Router } from 'express';
import * as settingsRepo from '../../../db/settings-repo.js';
import { validateBody, getTenantId } from '../../../shared/validate.js';
import { updateSettingSchema } from '../../../shared/validation.js';

export function mountSettingRoutes(router: Router, prefix: string): void {
  router.get(`${prefix}`, async (req, res) => {
    res.json(await settingsRepo.getAllSettings(getTenantId(req)));
  });

  router.put(`${prefix}/:key`, validateBody(updateSettingSchema), async (req, res) => {
    const { value } = req.body;
    await settingsRepo.setSetting(getTenantId(req), req.params['key'] as string, String(value));
    res.json({ ok: true });
  });
}
