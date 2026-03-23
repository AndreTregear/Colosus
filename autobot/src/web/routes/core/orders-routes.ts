import type { Router } from 'express';
import { validateBody, getTenantId, parsePagination } from '../../../shared/validate.js';
import { updateOrderStatusSchema, createOrderSchema } from '../../../shared/validation.js';
import type { OrderStatus } from '../../../shared/types.js';
import { handleListOrders, handleGetOrder, handleUpdateOrderStatus } from '../handlers/shared-handlers.js';
import { handleEntityResponse } from '../../shared/route-helpers.js';
import { encryptRecord, decryptRecord, decryptRecords } from '../../../crypto/middleware.js';
import * as ordersRepo from '../../../db/orders-repo.js';

export function mountOrderRoutes(router: Router, prefix: string): void {
  router.get(`${prefix}`, async (req, res) => {
    const tenantId = getTenantId(req);
    const { limit, offset } = parsePagination(req.query);
    const status = req.query.status as string | undefined;
    const result = await handleListOrders(tenantId, { limit, offset, status });
    result.orders = (await decryptRecords(tenantId, 'orders', result.orders as unknown as Record<string, unknown>[])) as unknown as typeof result.orders;
    res.json(result);
  });

  router.post(`${prefix}`, validateBody(createOrderSchema), async (req, res) => {
    const tenantId = getTenantId(req);
    const { customerId, items, deliveryType, deliveryAddress, notes } = req.body;
    const encrypted = await encryptRecord(tenantId, 'orders', { notes, delivery_address: deliveryAddress });
    const order = await ordersRepo.createOrder(
      tenantId, customerId, items, deliveryType,
      encrypted.delivery_address as string | undefined,
      encrypted.notes as string | undefined,
    );
    res.status(201).json(await decryptRecord(tenantId, 'orders', order as unknown as Record<string, unknown>));
  });

  router.get(`${prefix}/:id`, async (req, res) => {
    const tenantId = getTenantId(req);
    const order = await handleGetOrder(tenantId, Number(req.params.id));
    if (order) {
      handleEntityResponse(res, await decryptRecord(tenantId, 'orders', order as unknown as Record<string, unknown>));
    } else {
      handleEntityResponse(res, undefined);
    }
  });

  router.put(`${prefix}/:id/status`, validateBody(updateOrderStatusSchema), async (req, res) => {
    const { status } = req.body;
    handleEntityResponse(res, await handleUpdateOrderStatus(getTenantId(req), Number(req.params.id), status as OrderStatus));
  });
}
