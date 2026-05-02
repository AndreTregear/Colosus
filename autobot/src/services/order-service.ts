import * as ordersRepo from '../db/orders-repo.js';
import * as paymentsRepo from '../db/payments-repo.js';
import * as refundsRepo from '../db/refunds-repo.js';
import * as customersRepo from '../db/customers-repo.js';
import * as settingsRepo from '../db/settings-repo.js';
import { BUSINESS_CURRENCY } from '../config.js';
import { appBus } from '../shared/events.js';
import { NotFoundError, InvalidTransitionError, OwnershipError } from './errors.js';
import type { Order, OrderWithItems, OrderStatus, OrderItemInput } from '../shared/types.js';

// ── State Machine ──

const TRANSITIONS: Record<string, OrderStatus[]> = {
  pending:           ['confirmed', 'payment_requested', 'cancelled'],
  confirmed:         ['payment_requested', 'cancelled'],
  payment_requested: ['paid', 'cancelled'],
  paid:              ['preparing', 'refunded'],
  preparing:         ['ready', 'refunded'],
  ready:             ['shipped', 'delivered'],
  shipped:           ['delivered'],
  delivered:         [],
  cancelled:         [],
  refunded:          [],
};

function assertTransition(current: OrderStatus, target: OrderStatus): void {
  const allowed = TRANSITIONS[current];
  if (!allowed || !allowed.includes(target)) {
    throw new InvalidTransitionError('order', current, target);
  }
}

// ── Helpers ──

async function getOrderOrThrow(tenantId: string, orderId: number): Promise<OrderWithItems> {
  const order = await ordersRepo.getOrderById(tenantId, orderId);
  if (!order) throw new NotFoundError('order', orderId);
  return order;
}

// ── Ownership Verification ──

export async function verifyOwnership(
  tenantId: string,
  orderId: number,
  customerJid: string,
  channel: string = 'whatsapp',
): Promise<OrderWithItems> {
  const order = await getOrderOrThrow(tenantId, orderId);
  const customer = await customersRepo.getCustomerByJid(tenantId, customerJid, channel);
  if (!customer || order.customerId !== customer.id) {
    throw new OwnershipError();
  }
  return order;
}

// ── Order Lifecycle ──

export async function createOrder(
  tenantId: string,
  customerId: number,
  items: OrderItemInput[],
  deliveryType: string,
  deliveryAddress?: string,
  notes?: string,
): Promise<OrderWithItems> {
  const order = await ordersRepo.createOrder(tenantId, customerId, items, deliveryType, deliveryAddress, notes);
  appBus.emit('order-created', tenantId, order.id, order.customerJid);
  return order;
}

export async function confirmOrder(tenantId: string, orderId: number): Promise<Order> {
  const order = await getOrderOrThrow(tenantId, orderId);
  assertTransition(order.status, 'confirmed');
  const updated = await ordersRepo.updateOrderStatus(tenantId, orderId, 'confirmed');
  return updated!;
}

export async function cancelOrder(
  tenantId: string,
  orderId: number,
  _cancelledBy: { customerId?: number; adminId?: string },
  reason?: string,
): Promise<Order> {
  const order = await getOrderOrThrow(tenantId, orderId);
  assertTransition(order.status, 'cancelled');
  // TODO: restore stock for cancelled orders (future improvement)
  const updated = await ordersRepo.updateOrderStatus(tenantId, orderId, 'cancelled');
  appBus.emit('order-cancelled', tenantId, orderId, reason);
  return updated!;
}

export async function requestPayment(
  tenantId: string,
  orderId: number,
  method: string = 'yape',
): Promise<{ payment: { id: number; amount: number; status: string }; yapeNumber: string | null; yapeName: string | null; currency: string }> {
  const order = await getOrderOrThrow(tenantId, orderId);
  assertTransition(order.status, 'payment_requested');

  // Idempotent: return existing pending payment if one exists
  const existingPayments = await paymentsRepo.getPaymentsByOrder(tenantId, orderId);
  const existingPending = existingPayments.find(p => p.status === 'pending');

  const yapeNumber = await settingsRepo.getEffectiveSetting(tenantId, 'yape_number') ?? null;
  const yapeName = await settingsRepo.getEffectiveSetting(tenantId, 'yape_name') ?? null;
  const currency = await settingsRepo.getEffectiveSetting(tenantId, 'currency', BUSINESS_CURRENCY);

  if (existingPending) {
    return {
      payment: { id: existingPending.id, amount: existingPending.amount, status: existingPending.status },
      yapeNumber, yapeName, currency,
    };
  }

  const payment = await paymentsRepo.createPayment(tenantId, orderId, order.total, method);
  await ordersRepo.updateOrderStatus(tenantId, orderId, 'payment_requested');

  return {
    payment: { id: payment.id, amount: payment.amount, status: payment.status },
    yapeNumber, yapeName, currency,
  };
}

export async function markPaid(
  tenantId: string,
  orderId: number,
  paymentId: number,
  reference?: string,
): Promise<Order> {
  const order = await getOrderOrThrow(tenantId, orderId);
  assertTransition(order.status, 'paid');
  await paymentsRepo.confirmPayment(tenantId, paymentId, reference);
  const updated = await ordersRepo.updateOrderStatus(tenantId, orderId, 'paid');
  appBus.emit('order-paid', tenantId, orderId, order.customerJid);
  return updated!;
}

export async function refundOrder(
  tenantId: string,
  orderId: number,
  reason?: string,
): Promise<{ refundId: number; amount: number }> {
  const order = await getOrderOrThrow(tenantId, orderId);
  assertTransition(order.status, 'refunded');

  const payments = await paymentsRepo.getPaymentsByOrder(tenantId, orderId);
  const confirmedPayment = payments.find(p => p.status === 'confirmed');
  if (!confirmedPayment) {
    throw new NotFoundError('confirmed payment', orderId);
  }

  const refund = await refundsRepo.createRefund(
    tenantId, orderId, confirmedPayment.id,
    confirmedPayment.amount, reason, 'agent',
  );
  await ordersRepo.updateOrderStatus(tenantId, orderId, 'refunded');
  appBus.emit('order-refunded', tenantId, orderId, refund.amount);

  return { refundId: refund.id, amount: refund.amount };
}

export async function modifyOrder(
  tenantId: string,
  orderId: number,
  newItems: { productId: number; quantity: number }[],
): Promise<OrderWithItems> {
  // modifyOrder in repo already validates status (pending/confirmed/payment_requested)
  return ordersRepo.modifyOrder(tenantId, orderId, newItems);
}

// ── Simple State Transitions ──

export async function startPreparing(tenantId: string, orderId: number): Promise<Order> {
  const order = await getOrderOrThrow(tenantId, orderId);
  assertTransition(order.status, 'preparing');
  return (await ordersRepo.updateOrderStatus(tenantId, orderId, 'preparing'))!;
}

export async function markReady(tenantId: string, orderId: number): Promise<Order> {
  const order = await getOrderOrThrow(tenantId, orderId);
  assertTransition(order.status, 'ready');
  return (await ordersRepo.updateOrderStatus(tenantId, orderId, 'ready'))!;
}

export async function markShipped(tenantId: string, orderId: number): Promise<Order> {
  const order = await getOrderOrThrow(tenantId, orderId);
  assertTransition(order.status, 'shipped');
  return (await ordersRepo.updateOrderStatus(tenantId, orderId, 'shipped'))!;
}

export async function markDelivered(tenantId: string, orderId: number): Promise<Order> {
  const order = await getOrderOrThrow(tenantId, orderId);
  assertTransition(order.status, 'delivered');
  const updated = (await ordersRepo.updateOrderStatus(tenantId, orderId, 'delivered'))!;
  appBus.emit('order-delivered', tenantId, orderId, '');
  return updated;
}

// ── Read-Only Pass-Throughs ──

export const getOrder = ordersRepo.getOrderById;
export const getOrdersByCustomer = ordersRepo.getOrdersByCustomer;
export const getOrdersByStatus = ordersRepo.getOrdersByStatus;
export const getOrdersByDateRange = ordersRepo.getOrdersByDateRange;
export const getAllOrders = ordersRepo.getAllOrders;
export const getOrderCount = ordersRepo.getOrderCount;
