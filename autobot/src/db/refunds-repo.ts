import { BaseRepository } from './base-repository.js';
import type { Refund } from '../shared/types.js';
import type { Spec } from './row-mapper.js';

const refundSpec: Spec<Refund> = {
  id: 'id',
  tenantId: 'tenant_id',
  orderId: { col: 'order_id', type: 'number' },
  paymentId: { col: 'payment_id', type: 'number' },
  amount: { col: 'amount', type: 'number' },
  reason: 'reason',
  status: 'status',
  refundedBy: 'refunded_by',
  createdAt: { col: 'created_at', type: 'date' },
  completedAt: { col: 'completed_at', type: 'date' },
};

const repo = new BaseRepository<Refund>({
  table: 'refunds',
  spec: refundSpec,
  tenantColumn: 'tenant_id',
});

export const getRefundById = (tenantId: string, id: number) => repo.findById(id, tenantId);
export const getRefundsByOrder = (tenantId: string, orderId: number) =>
  repo.findManyByColumn('order_id', orderId, tenantId).then(rows =>
    rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  );
export const getAllRefunds = (tenantId: string, options: { limit: number; offset: number }) =>
  repo.findAll(tenantId, { orderBy: 'created_at', orderDir: 'DESC', limit: options.limit, offset: options.offset });

export async function createRefund(
  tenantId: string,
  orderId: number,
  paymentId: number,
  amount: number,
  reason?: string,
  refundedBy: string = 'agent',
): Promise<Refund> {
  return repo.create({
    tenantId, orderId, paymentId, amount, reason: reason || null, refundedBy,
    status: 'completed', completedAt: new Date().toISOString(),
  } as Partial<Refund>, tenantId);
}
