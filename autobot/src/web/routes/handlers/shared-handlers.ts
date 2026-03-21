/**
 * Shared handler logic for orders and payments, used by both the
 * dashboard API routes (api-orders, api-payments) and mobile routes
 * (api-mobile).  Each function accepts already-extracted parameters
 * (tenantId, ids, etc.) and returns a result object — route files
 * remain responsible for req/res concerns (auth, param extraction,
 * serialisation).
 */
import * as ordersRepo from '../../../db/orders-repo.js';
import * as paymentsRepo from '../../../db/payments-repo.js';
import * as orderService from '../../../services/order-service.js';
import type { Order, OrderWithItems, OrderStatus, Payment } from '../../../shared/types.js';

// ── Orders ──────────────────────────────────────────────────────────

export interface ListOrdersParams {
  limit: number;
  offset: number;
  status?: string;
}

export interface ListOrdersResult {
  orders: Order[];
  total: number;
}

export async function handleListOrders(
  tenantId: string,
  params: ListOrdersParams,
): Promise<ListOrdersResult> {
  const [orders, total] = await Promise.all([
    ordersRepo.getAllOrders(tenantId, params),
    ordersRepo.getOrderCount(tenantId, params.status),
  ]);
  return { orders, total };
}

export async function handleGetOrder(
  tenantId: string,
  orderId: number,
): Promise<OrderWithItems | undefined> {
  return ordersRepo.getOrderById(tenantId, orderId);
}

export async function handleUpdateOrderStatus(
  tenantId: string,
  orderId: number,
  status: OrderStatus,
): Promise<Order | undefined> {
  return ordersRepo.updateOrderStatus(tenantId, orderId, status);
}

// ── Payments ────────────────────────────────────────────────────────

export async function handleGetPendingPayments(
  tenantId: string,
): Promise<(Payment & { customerName: string | null; customerJid: string })[]> {
  return paymentsRepo.getPendingPayments(tenantId);
}

export async function handleConfirmPayment(
  tenantId: string,
  paymentId: number,
  reference?: string,
): Promise<Payment | undefined> {
  const payment = await paymentsRepo.getPaymentById(tenantId, paymentId);
  if (!payment) return undefined;
  await orderService.markPaid(tenantId, payment.orderId, paymentId, reference);
  return paymentsRepo.getPaymentById(tenantId, paymentId) as Promise<Payment>;
}

export async function handleRejectPayment(
  tenantId: string,
  paymentId: number,
): Promise<Payment | undefined> {
  return paymentsRepo.rejectPayment(tenantId, paymentId);
}
