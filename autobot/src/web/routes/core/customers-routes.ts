import type { Router } from 'express';
import * as customersRepo from '../../../db/customers-repo.js';
import { getTenantId } from '../../../shared/validate.js';
import { handleEntityResponse } from '../../shared/route-helpers.js';

export function mountCustomerRoutes(router: Router, prefix: string): void {
  router.get(`${prefix}`, async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Number(req.query.offset) || 0;
    const customers = await customersRepo.getAllCustomers(getTenantId(req), limit, offset);
    const count = await customersRepo.getCustomerCount(getTenantId(req));
    res.json({ customers, total: count, limit, offset });
  });

  router.get(`${prefix}/:id`, async (req, res) => {
    handleEntityResponse(res, await customersRepo.getCustomerById(getTenantId(req), Number(req.params.id)));
  });
}
