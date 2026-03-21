import type { Router } from 'express';
import { getTenantId, parsePagination } from '../../../shared/validate.js';
import * as refundsRepo from '../../../db/refunds-repo.js';

export function mountRefundRoutes(router: Router, prefix: string): void {
  router.get(`${prefix}`, async (req, res) => {
    try {
      const tenantId = getTenantId(req);
      const { limit, offset } = parsePagination(req.query);
      const refunds = await refundsRepo.getAllRefunds(tenantId, { limit, offset });
      res.json(refunds);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  router.get(`${prefix}/order/:orderId`, async (req, res) => {
    try {
      const tenantId = getTenantId(req);
      const refunds = await refundsRepo.getRefundsByOrder(tenantId, Number(req.params.orderId));
      res.json(refunds);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });
}
