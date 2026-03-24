import { BaseRepository } from './base-repository.js';
import { query, queryOne } from './pool.js';
import type { Payment } from '../shared/types.js';
import type { Spec } from './row-mapper.js';
import { encryptRecord, decryptRecord } from '../crypto/middleware.js';

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

// Decrypt payment entity — handles confirmedBy↔confirmed_by name mismatch
async function decPayment(tenantId: string, p: Payment | undefined): Promise<Payment | undefined> {
  if (!p) return undefined;
  const row = { reference: p.reference, confirmed_by: p.confirmedBy };
  const d = await decryptRecord(tenantId, 'payments', row);
  return { ...p, reference: (d.reference as string) ?? null, confirmedBy: (d.confirmed_by as string) ?? null };
}
async function decPayments(tenantId: string, ps: Payment[]): Promise<Payment[]> {
  return Promise.all(ps.map(p => decPayment(tenantId, p) as Promise<Payment>));
}

export const getPaymentById = async (tenantId: string, id: number) =>
  decPayment(tenantId, await repo.findById(id, tenantId));
export const getPaymentsByOrder = async (tenantId: string, orderId: number) => {
  const rows = await repo.findManyByColumn('order_id', orderId, tenantId);
  const sorted = rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return decPayments(tenantId, sorted);
};

export async function createPayment(tenantId: string, orderId: number, amount: number, method: string): Promise<Payment> {
  const result = await repo.create({ tenantId, orderId, amount, method, status: 'pending' } as Partial<Payment>, tenantId);
  return (await decPayment(tenantId, result))!;
}

export async function confirmPayment(tenantId: string, paymentId: number, reference?: string): Promise<Payment | undefined> {
  const encrypted = await encryptRecord(tenantId, 'payments', {
    reference: reference ?? null,
    confirmed_by: 'admin',
  });
  const row = await queryOne<Record<string, unknown>>(
    `UPDATE payments SET status = 'confirmed', reference = COALESCE($1, reference), confirmed_at = now(), confirmed_by = $4 WHERE tenant_id = $2 AND id = $3 RETURNING *`,
    [encrypted.reference ?? null, tenantId, paymentId, encrypted.confirmed_by],
  );
  if (!row) return undefined;
  const decrypted = await decryptRecord(tenantId, 'payments', row);
  return repo.toEntity(decrypted);
}

export async function rejectPayment(tenantId: string, paymentId: number): Promise<Payment | undefined> {
  const result = await repo.update(paymentId, { status: 'rejected' } as Partial<Payment>, tenantId);
  return decPayment(tenantId, result);
}

export async function getPendingPayments(tenantId: string): Promise<(Payment & { customerName: string | null; customerJid: string })[]> {
  const result = await query<Record<string, unknown>>(
    `SELECT p.*, c.name as customer_name, c.jid as customer_jid FROM payments p JOIN orders o ON p.order_id = o.id JOIN customers c ON o.customer_id = c.id WHERE p.tenant_id = $1 AND p.status = 'pending' ORDER BY p.created_at DESC`,
    [tenantId],
  );
  return Promise.all(result.rows.map(async r => {
    const decRow = await decryptRecord(tenantId, 'payments', r);
    const custDec = await decryptRecord(tenantId, 'customers', { name: decRow.customer_name });
    return {
      ...repo.toEntity(decRow),
      customerName: (custDec.name as string | null) ?? null,
      customerJid: String(decRow.customer_jid ?? ''),
    };
  }));
}

export async function getPendingPaymentsCount(tenantId: string): Promise<number> {
  return repo.count(tenantId, ["status = 'pending'"]);
}
