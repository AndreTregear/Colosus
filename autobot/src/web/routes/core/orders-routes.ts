import type { Router } from 'express';
import { validateBody, getTenantId, parsePagination } from '../../../shared/validate.js';
import { updateOrderStatusSchema, createOrderSchema } from '../../../shared/validation.js';
import type { OrderStatus } from '../../../shared/types.js';
import { handleListOrders, handleGetOrder, handleUpdateOrderStatus } from '../handlers/shared-handlers.js';
import { handleEntityResponse } from '../../shared/route-helpers.js';
import * as ordersRepo from '../../../db/orders-repo.js';

export function mountOrderRoutes(router: Router, prefix: string): void {
  router.get(`${prefix}`, async (req, res) => {
    const tenantId = getTenantId(req);
    const { limit, offset } = parsePagination(req.query);
    const status = req.query.status as string | undefined;
    res.json(await handleListOrders(tenantId, { limit, offset, status }));
  });

  router.post(`${prefix}`, validateBody(createOrderSchema), async (req, res) => {
    const { customerId, items, deliveryType, deliveryAddress, notes } = req.body;
    const order = await ordersRepo.createOrder(
      getTenantId(req), customerId, items, deliveryType, deliveryAddress, notes,
    );
    res.status(201).json(order);
  });

  router.get(`${prefix}/:id`, async (req, res) => {
    handleEntityResponse(res, await handleGetOrder(getTenantId(req), Number(req.params.id)));
  });

  router.put(`${prefix}/:id/status`, validateBody(updateOrderStatusSchema), async (req, res) => {
    const { status } = req.body;
    handleEntityResponse(res, await handleUpdateOrderStatus(getTenantId(req), Number(req.params.id), status as OrderStatus));
  });
}
