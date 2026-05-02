/**
 * Yape Payment Tools for Mastra agents
 *
 * When a customer says "ya pagué por Yape" or "hice el pago",
 * the agent can check recent Yape notifications and confirm the payment.
 *
 * This is the MOAT — automated Yape payment validation via WhatsApp.
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { query, queryOne } from '../../db/pool.js';
import { logger } from '../../shared/logger.js';
import { getCurrentTenant } from '../tenant-context.js';

/**
 * Check for recent Yape payments that match a customer's pending order.
 * The agent calls this when a customer claims they paid.
 */
export const checkYapePayment = createTool({
  id: 'check-yape-payment',
  description: 'Check if a Yape payment was received for a customer. Use when customer says "ya pagué", "hice el pago por Yape", or asks about payment status.',
  inputSchema: z.object({
    customer_name: z.string().optional().describe('Customer name to match'),
    amount: z.number().optional().describe('Expected payment amount'),
    order_id: z.number().optional().describe('Order ID to check payment for'),
  }),
  execute: async ({ customer_name: _customer_name, amount, order_id }) => {
    const tenantId = getCurrentTenant();

    // Check Yape notifications received in the last 24h
    const notifications = await query<any>(
      `SELECT yn.id, yn.sender_name, yn.amount, yn.status, yn.captured_at,
              yn.matched_payment_id, p.order_id
       FROM yape_notifications yn
       LEFT JOIN payments p ON p.id = yn.matched_payment_id
       WHERE yn.tenant_id = $1
         AND yn.captured_at > NOW() - INTERVAL '24 hours'
       ORDER BY yn.captured_at DESC LIMIT 10`,
      [tenantId],
    );

    if (notifications.rows.length === 0) {
      return {
        found: false,
        message: 'No se han recibido pagos de Yape en las últimas 24 horas.',
      };
    }

    // If we have an order_id, check if it's already paid
    if (order_id) {
      const order = await queryOne<any>(
        `SELECT o.id, o.status, o.total, c.name as customer
         FROM orders o LEFT JOIN customers c ON c.id = o.customer_id AND c.tenant_id = o.tenant_id
         WHERE o.tenant_id = $1 AND o.id = $2`,
        [tenantId, order_id],
      );
      if (!order) return { found: false, message: `Pedido #${order_id} no encontrado.` };
      if (order.rows[0]?.status === 'paid') return { found: true, already_paid: true, message: `Pedido #${order_id} ya está pagado.` };

      // Look for matching notification
      const match = notifications.rows.find((n: any) =>
        parseFloat(n.amount) === parseFloat(order.rows[0]?.total) && n.status !== 'MATCHED',
      );
      if (match) {
        return {
          found: true,
          notification_id: match.id,
          amount: match.amount,
          sender: match.sender_name,
          order_id,
          message: `¡Encontré un pago de Yape por S/${match.amount} de ${match.sender_name}! Coincide con el pedido #${order_id}.`,
          can_confirm: true,
        };
      }
    }

    // Filter by amount if provided
    let filtered = notifications.rows;
    if (amount) {
      filtered = filtered.filter((n: any) => Math.abs(parseFloat(n.amount) - amount) < 0.01);
    }

    // Return what we found
    const unmatched = filtered.filter((n: any) => n.status !== 'MATCHED');
    const matched = filtered.filter((n: any) => n.status === 'MATCHED');

    return {
      found: unmatched.length > 0,
      unmatched_payments: unmatched.map((n: any) => ({
        id: n.id,
        sender: n.sender_name,
        amount: n.amount,
        time: n.captured_at,
      })),
      already_confirmed: matched.length,
      message: unmatched.length > 0
        ? `Hay ${unmatched.length} pago(s) de Yape sin confirmar.`
        : 'Todos los pagos recientes ya están confirmados.',
    };
  },
});

/**
 * Confirm a Yape payment against a pending order.
 * Called after check-yape-payment finds a match.
 */
export const confirmYapePayment = createTool({
  id: 'confirm-yape-payment',
  description: 'Confirm a Yape payment and mark the order as paid. Use AFTER check-yape-payment finds a match.',
  inputSchema: z.object({
    notification_id: z.number().describe('Yape notification ID from check-yape-payment'),
    order_id: z.number().describe('Order ID to mark as paid'),
  }),
  execute: async ({ notification_id, order_id }) => {
    const tenantId = getCurrentTenant();

    try {
      // Get the notification
      const notif = await queryOne<any>(
        `SELECT id, sender_name, amount, status FROM yape_notifications WHERE tenant_id = $1 AND id = $2`,
        [tenantId, notification_id],
      );
      if (!notif) return { confirmed: false, error: 'Notificación no encontrada.' };

      // Get the order
      const order = await queryOne<any>(
        `SELECT id, status, total, customer_id FROM orders WHERE tenant_id = $1 AND id = $2`,
        [tenantId, order_id],
      );
      if (!order) return { confirmed: false, error: 'Pedido no encontrado.' };

      // Block re-confirming an order that's already paid — the AI may
      // (incorrectly) try to "confirm" the same order twice.
      if (order.status === 'paid') {
        return { confirmed: false, error: `Pedido #${order_id} ya está pagado.` };
      }

      // Refuse to mark a notification that's already matched somewhere else.
      if (notif.status === 'MATCHED') {
        return { confirmed: false, error: 'Esa notificación ya fue usada para confirmar otro pedido.' };
      }

      // CRITICAL: amount must match. Without this, a prompt-injected agent
      // can confirm a S/. 1000 order with a S/. 1 notification.
      const notifAmt = Number(notif.amount);
      const orderAmt = Number(order.total);
      if (!Number.isFinite(notifAmt) || !Number.isFinite(orderAmt) || Math.abs(notifAmt - orderAmt) > 0.01) {
        logger.warn(
          { tenantId, notification_id, order_id, notifAmt, orderAmt },
          'Yape confirm rejected: amount mismatch',
        );
        return {
          confirmed: false,
          error: `El monto del pago Yape (S/${notifAmt}) no coincide con el total del pedido (S/${orderAmt}).`,
        };
      }

      // Create or update payment record
      const existingPayment = await queryOne<any>(
        `SELECT id FROM payments WHERE tenant_id = $1 AND order_id = $2 AND method = 'yape' LIMIT 1`,
        [tenantId, order_id],
      );

      let paymentId: number;
      if (existingPayment) {
        paymentId = existingPayment.id;
        await query(
          `UPDATE payments SET status = 'confirmed', reference = $3, confirmed_at = NOW(), confirmed_by = 'agent' WHERE tenant_id = $1 AND id = $2`,
          [tenantId, paymentId, `yape:${notif.sender_name}:notif:${notification_id}`],
        );
      } else {
        const result = await query<any>(
          `INSERT INTO payments (tenant_id, order_id, method, amount, status, reference, confirmed_at, confirmed_by)
           VALUES ($1, $2, 'yape', $3, 'confirmed', $4, NOW(), 'agent') RETURNING id`,
          [tenantId, order_id, notif.amount, `yape:${notif.sender_name}:notif:${notification_id}`],
        );
        paymentId = result.rows[0]?.id;
      }

      // Update order status
      await query(
        `UPDATE orders SET status = 'paid', updated_at = NOW() WHERE tenant_id = $1 AND id = $2`,
        [tenantId, order_id],
      );

      // Mark notification as matched
      await query(
        `UPDATE yape_notifications SET status = 'MATCHED', matched_payment_id = $3 WHERE tenant_id = $1 AND id = $2`,
        [tenantId, notification_id, paymentId],
      );

      logger.info({ tenantId, orderId: order_id, paymentId, notificationId: notification_id },
        'Yape payment confirmed by agent');

      return {
        confirmed: true,
        payment_id: paymentId,
        order_id,
        amount: notif.amount,
        message: `¡Pago confirmado! Pedido #${order_id} marcado como pagado (S/${notif.amount} por Yape).`,
      };
    } catch (err) {
      logger.error({ err, tenantId, notification_id, order_id }, 'Failed to confirm Yape payment');
      return { confirmed: false, error: 'Error al confirmar el pago.' };
    }
  },
});

export const yapeTools = { checkYapePayment, confirmYapePayment };
