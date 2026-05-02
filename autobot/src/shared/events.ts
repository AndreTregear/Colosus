import { EventEmitter } from 'node:events';
import type { MessageLog } from './types.js';

type EventMap = {
  qr: [dataUrl: string];
  'connection-update': [tenantId: string, state: 'open' | 'connecting' | 'close'];
  'message-logged': [msg: MessageLog];
  'bot-started': [];
  'bot-stopped': [];
  'tenant-error': [tenantId: string, error: string];
  'tenant-stopped': [tenantId: string];
  'tenant-started': [tenantId: string];
  'tenant-health-alert': [tenantId: string, message: string];
  'yape-payment-matched': [tenantId: string, paymentId: number, orderId: number, customerJid: string];
  'yape-payment-synced': [tenantId: string, notificationId: number];
  'yayapay-intent-created': [intentId: string, clientReferenceId: string | null, amount: number];
  'yayapay-payment-succeeded': [intentId: string, clientReferenceId: string | null, amount: number, senderName: string | null];
  'yayapay-payment-expired': [intentId: string, clientReferenceId: string | null];
  'low-stock-alert': [tenantId: string, productId: number, productName: string, currentStock: number];
  'out-of-stock': [tenantId: string, productId: number, productName: string];
  'ai-job-enqueued': [tenantId: string, jid: string];
  'ai-job-failed': [tenantId: string, jid: string, reason: string];
  'ai-job-completed': [tenantId: string, jid: string];
  'human-handoff-requested': [tenantId: string, customerJid: string, reason: string];
  'daily-summary-ready': [tenantId: string, data: { title: string; body: string; data: Record<string, unknown> }];
  'order-created': [tenantId: string, orderId: number, customerJid: string];
  'order-cancelled': [tenantId: string, orderId: number, reason?: string];
  'order-paid': [tenantId: string, orderId: number, customerJid: string];
  'order-refunded': [tenantId: string, orderId: number, amount: number];
  'order-delivered': [tenantId: string, orderId: number, customerJid: string];
  'appointment-booked': [tenantId: string, appointmentId: number, customerJid: string];
  'appointment-cancelled': [tenantId: string, appointmentId: number];
  'rider-assigned': [tenantId: string, orderId: number, riderId: number];
  'delivery-completed': [tenantId: string, orderId: number, assignmentId: number];
  'confirmation-requested': [tenantId: string, jid: string, confirmationId: string, action: string];
  'confirmation-accepted': [tenantId: string, jid: string, confirmationId: string, action: string, fields: any];
  'confirmation-cancelled': [tenantId: string, jid: string, confirmationId: string];
};

class TypedEmitter extends EventEmitter {
  override emit<K extends keyof EventMap>(event: K, ...args: EventMap[K]): boolean {
    return super.emit(event, ...args);
  }

  override on<K extends keyof EventMap>(event: K, listener: (...args: EventMap[K]) => void): this {
    return super.on(event, listener as (...args: unknown[]) => void);
  }
}

export const appBus = new TypedEmitter();
