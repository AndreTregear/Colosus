import { BaseRepository } from './base-repository.js';
import { query, queryOne } from './pool.js';
import type { Payment } from '../shared/types.js';
import type { Spec } from './row-mapper.js';

const paymentSpec: Spec<Payment> = {
  id: 'id',
  tenantId: 'tenant_id',
  orderId: 'order_id',
  method: 'method',
  amount: { col: 'amount', type: 'number' },
  status: 'status',
  reference: 'reference',
  confirmedAt: { col: 'confirmed_at', type: 'date' },
  confirmedBy: 'confirmed_by',
  createdAt: { col: 'created_at', type: 'date' },
};

const repo = new BaseRepository<Payment>({
  table: 'payments',
  spec: paymentSpec,
  tenantColumn: 'tenant_id',
});

export const getPaymentById = (tenantId: string, id: number) => repo.findById(id, tenantId);
export const getPaymentsByOrder = (tenantId: string, orderId: number) =>
  repo.findManyByColumn('order_id', orderId, tenantId).then(rows => rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

export async function createPayment(tenantId: string, orderId: number, amount: number, method: string): Promise<Payment> {
  return repo.create({ tenantId, orderId, amount, method, status: 'pending' } as Partial<Payment>, tenantId);
}

export async function confirmPayment(tenantId: string, paymentId: number, reference?: string): Promise<Payment | undefined> {
  const row = await queryOne<Record<string, unknown>>(
    `UPDATE payments SET status = 'confirmed', reference = COALESCE($1, reference), confirmed_at = now(), confirmed_by = 'admin' WHERE tenant_id = $2 AND id = $3 RETURNING *`,
    [reference ?? null, tenantId, paymentId],
  );
  return row ? repo.toEntity(row) : undefined;
}

export async function rejectPayment(tenantId: string, paymentId: number): Promise<Payment | undefined> {
  return repo.update(paymentId, { status: 'rejected' } as Partial<Payment>, tenantId);
}

export async function getPendingPayments(tenantId: string): Promise<(Payment & { customerName: string | null; customerJid: string })[]> {
  const result = await query<Record<string, unknown>>(
    `SELECT p.*, c.name as customer_name, c.jid as customer_jid FROM payments p JOIN orders o ON p.order_id = o.id JOIN customers c ON o.customer_id = c.id WHERE p.tenant_id = $1 AND p.status = 'pending' ORDER BY p.created_at DESC`,
    [tenantId],
  );
  return result.rows.map(r => ({
    ...repo.toEntity(r),
    customerName: (r.customer_name as string | null) ?? null,
    customerJid: String(r.customer_jid ?? ''),
  }));
}

export async function getPendingPaymentsCount(tenantId: string): Promise<number> {
  return repo.count(tenantId, ["status = 'pending'"]);
}
