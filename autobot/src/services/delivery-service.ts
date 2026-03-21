import * as deliveryRepo from '../db/delivery-assignments-repo.js';
import * as ridersRepo from '../db/riders-repo.js';
import * as ordersRepo from '../db/orders-repo.js';
import * as customersRepo from '../db/customers-repo.js';
import { tenantManager } from '../bot/tenant-manager.js';
import { appBus } from '../shared/events.js';
import { logger } from '../shared/logger.js';
import { NotFoundError } from './errors.js';
import type { DeliveryAssignment, Rider } from '../shared/types.js';

// ── Rider Assignment ──

export async function assignRider(
  tenantId: string,
  orderId: number,
  riderId?: number,
): Promise<{ assignment: DeliveryAssignment; rider: Rider }> {
  const order = await ordersRepo.getOrderById(tenantId, orderId);
  if (!order) throw new NotFoundError('order', orderId);

  // Check if already assigned
  const existing = await deliveryRepo.getAssignmentByOrder(tenantId, orderId);
  if (existing && existing.status !== 'cancelled') {
    const existingRider = await ridersRepo.getRiderById(tenantId, existing.riderId);
    if (existingRider) {
      return { assignment: existing, rider: existingRider };
    }
  }

  let rider: Rider | undefined;
  if (riderId) {
    rider = await ridersRepo.getRiderById(tenantId, riderId);
    if (!rider) throw new NotFoundError('rider', riderId);
  } else {
    const available = await ridersRepo.getAvailableRiders(tenantId);
    if (available.length === 0) {
      throw new NotFoundError('available rider', 0);
    }
    rider = available[0]!;
  }

  const assignment = await deliveryRepo.createAssignment(tenantId, orderId, rider.id);
  await ridersRepo.updateRiderStatus(tenantId, rider.id, 'busy');

  appBus.emit('rider-assigned', tenantId, orderId, rider.id);
  return { assignment, rider };
}

// ── Status Transitions ──

export async function markPickedUp(tenantId: string, assignmentId: number): Promise<DeliveryAssignment> {
  const updated = await deliveryRepo.updateAssignmentStatus(tenantId, assignmentId, 'picked_up');
  if (!updated) throw new NotFoundError('delivery assignment', assignmentId);
  return updated;
}

export async function markDelivered(tenantId: string, assignmentId: number): Promise<DeliveryAssignment> {
  const updated = await deliveryRepo.updateAssignmentStatus(tenantId, assignmentId, 'delivered');
  if (!updated) throw new NotFoundError('delivery assignment', assignmentId);

  // Free the rider
  await ridersRepo.updateRiderStatus(tenantId, updated.riderId, 'available');
  appBus.emit('delivery-completed', tenantId, updated.orderId, assignmentId);
  return updated;
}

export async function cancelAssignment(tenantId: string, assignmentId: number): Promise<DeliveryAssignment> {
  const updated = await deliveryRepo.updateAssignmentStatus(tenantId, assignmentId, 'cancelled');
  if (!updated) throw new NotFoundError('delivery assignment', assignmentId);
  await ridersRepo.updateRiderStatus(tenantId, updated.riderId, 'available');
  return updated;
}

// ── Rider Notification ──

export async function notifyRider(
  tenantId: string,
  riderId: number,
  orderId: number,
  customMessage?: string,
): Promise<string> {
  const rider = await ridersRepo.getRiderById(tenantId, riderId);
  if (!rider) throw new NotFoundError('rider', riderId);
  if (!rider.whatsappJid) throw new Error(`Rider ${rider.name} does not have a WhatsApp number configured.`);

  let message = customMessage;
  if (!message) {
    const order = await ordersRepo.getOrderById(tenantId, orderId);
    const customer = order?.customerId
      ? await customersRepo.getCustomerById(tenantId, order.customerId)
      : null;

    const items = order?.items?.map(i => `${i.quantity}x ${i.productName}`).join(', ') || 'items';
    message = `Nuevo pedido #${orderId}. ${items}. `;
    if (customer?.name) message += `Cliente: ${customer.name}. `;
    if (customer?.address || customer?.location) {
      message += `Entregar a: ${customer.address || customer.location}. `;
    }
    if (customer?.locationLat && customer?.locationLng) {
      message += `Maps: https://maps.google.com/maps?q=${customer.locationLat},${customer.locationLng}`;
    }
  }

  await tenantManager.sendMessage(tenantId, rider.whatsappJid, message);
  return message;
}

// ── Read-Only ──

export const getAssignmentByOrder = deliveryRepo.getAssignmentByOrder;
export const getAvailableRiders = ridersRepo.getAvailableRiders;
export const getRiderById = ridersRepo.getRiderById;
