import type { Router } from 'express';
import { getTenantId } from '../../../shared/validate.js';
import { handleGetPendingPayments, handleConfirmPayment, handleRejectPayment } from '../handlers/shared-handlers.js';
import { handleEntityResponse } from '../../shared/route-helpers.js';

export function mountPaymentRoutes(router: Router, prefix: string): void {
  router.get(`${prefix}/pending`, async (req, res) => {
    res.json(await handleGetPendingPayments(getTenantId(req)));
  });

  router.post(`${prefix}/:id/confirm`, async (req, res) => {
    const reference = req.body.reference as string | undefined;
    handleEntityResponse(res, await handleConfirmPayment(getTenantId(req), Number(req.params.id), reference));
  });

  router.post(`${prefix}/:id/reject`, async (req, res) => {
    handleEntityResponse(res, await handleRejectPayment(getTenantId(req), Number(req.params.id)));
  });
}
