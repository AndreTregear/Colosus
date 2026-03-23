import type { Router } from 'express';
import * as customersRepo from '../../../db/customers-repo.js';
import { getTenantId, validateBody } from '../../../shared/validate.js';
import { createCustomerSchema } from '../../../shared/validation.js';
import { handleEntityResponse } from '../../shared/route-helpers.js';
import { encryptRecord, decryptRecord, decryptRecords } from '../../../crypto/middleware.js';

export function mountCustomerRoutes(router: Router, prefix: string): void {
  router.get(`${prefix}`, async (req, res) => {
    const tenantId = getTenantId(req);
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Number(req.query.offset) || 0;
    const customers = await customersRepo.getAllCustomers(tenantId, limit, offset);
    const decrypted = await decryptRecords(tenantId, 'customers', customers as Record<string, any>[]);
    const count = await customersRepo.getCustomerCount(tenantId);
    res.json({ customers: decrypted, total: count, limit, offset });
  });

  router.post(`${prefix}`, validateBody(createCustomerSchema), async (req, res) => {
    const tenantId = getTenantId(req);
    const encrypted = await encryptRecord(tenantId, 'customers', req.body) as typeof req.body;
    const customer = await customersRepo.createCustomer(tenantId, encrypted);
    const decrypted = await decryptRecord(tenantId, 'customers', customer as Record<string, any>);
    res.status(201).json(decrypted);
  });

  router.get(`${prefix}/:id`, async (req, res) => {
    const tenantId = getTenantId(req);
    const customer = await customersRepo.getCustomerById(tenantId, Number(req.params.id));
    if (customer) {
      const decrypted = await decryptRecord(tenantId, 'customers', customer as Record<string, any>);
      res.json(decrypted);
    } else {
      res.status(404).json({ error: 'Customer not found' });
    }
  });
}
