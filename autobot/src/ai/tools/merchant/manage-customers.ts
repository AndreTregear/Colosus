import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { query } from '../../../db/pool.js';
import * as customersRepo from '../../../db/customers-repo.js';
import * as memoriesRepo from '../../../db/customer-memories-repo.js';
import { tenantManager } from '../../../bot/tenant-manager.js';
import { getTenantId, type YayaToolContext } from '../types.js';

export const sendPaymentReminderTool = createTool({
  id: 'send_payment_reminder',
  description: 'Send a payment reminder WhatsApp message to a customer with a pending order.',
  inputSchema: z.object({
    customer_jid: z.string().optional().describe('Customer JID (phone@s.whatsapp.net)'),
    customer_name: z.string().optional().describe('Customer name to search by'),
    order_id: z.number().int().optional().describe('Specific order ID to reference'),
    custom_message: z.string().optional().describe('Custom reminder message (uses default if not provided)'),
  }),
  execute: async (input, context: YayaToolContext) => {
    const tenantId = getTenantId(context);
    // Find the customer
    let jid = input.customer_jid;
    if (!jid && input.customer_name) {
      const result = await query<{ jid: string; name: string }>(
        `SELECT jid, name FROM customers WHERE tenant_id = $1 AND name ILIKE $2 LIMIT 1`,
        [tenantId, `%${input.customer_name}%`],
      );
      jid = result.rows[0]?.jid;
    }
    if (!jid) return `❌ No se encontró al cliente "${input.customer_name || input.customer_jid}".`;

    const customer = await customersRepo.getCustomerByJid(tenantId, jid);
    const name = customer?.name || input.customer_name || 'estimado cliente';

    const message = input.custom_message ||
      `Hola ${name} 👋 Te recordamos que tienes un pedido pendiente de pago. ` +
      (input.order_id ? `Pedido #${input.order_id}. ` : '') +
      `Por favor comunícate con nosotros para completar tu compra. ¡Gracias!`;

    await tenantManager.sendMessage(tenantId, jid, message);
    return `✅ Recordatorio enviado a ${name} (${jid})`;
  },
});

export const getCustomerDetailTool = createTool({
  id: 'get_customer_detail',
  description: 'Get full profile of a customer: contact info, last 5 orders, and memories.',
  inputSchema: z.object({
    customer_name: z.string().optional().describe('Customer name to search'),
    customer_jid: z.string().optional().describe('Customer JID'),
  }),
  execute: async (input, context: YayaToolContext) => {
    const tenantId = getTenantId(context);
    let jid = input.customer_jid;
    if (!jid && input.customer_name) {
      const result = await query<{ jid: string }>(
        `SELECT jid FROM customers WHERE tenant_id = $1 AND name ILIKE $2 LIMIT 1`,
        [tenantId, `%${input.customer_name}%`],
      );
      jid = result.rows[0]?.jid;
    }
    if (!jid) return `Customer "${input.customer_name || input.customer_jid}" not found.`;

    const [customer, ordersResult, memories] = await Promise.all([
      customersRepo.getCustomerByJid(tenantId, jid),
      query<{ id: number; status: string; total: string; created_at: string }>(
        `SELECT id, status, total, created_at FROM orders WHERE tenant_id = $1 AND customer_id = (
          SELECT id FROM customers WHERE tenant_id = $1 AND jid = $2 LIMIT 1
        ) ORDER BY created_at DESC LIMIT 5`,
        [tenantId, jid],
      ),
      memoriesRepo.getMemoriesForCustomer(tenantId, jid, 'whatsapp'),
    ]);

    if (!customer) return `Customer "${input.customer_name || input.customer_jid}" not found.`;

    const orderLines = ordersResult.rows
      .map(o => `  #${o.id} ${o.status} — ${Number(o.total).toFixed(2)} (${new Date(o.created_at).toLocaleDateString('es-PE')})`)
      .join('\n');

    const memLines = memoriesRepo.formatMemoriesForPrompt(memories);

    return [
      `👤 ${customer.name || 'Sin nombre'} | ${customer.phone || jid}`,
      customer.address ? `📍 ${customer.address}` : '',
      ordersResult.rows.length > 0 ? `\n📦 Últimos pedidos:\n${orderLines}` : '\nSin pedidos.',
      memLines ? `\n🧠 Memorias:\n${memLines}` : '',
    ].filter(Boolean).join('\n');
  },
});

export const listPendingPaymentsTool = createTool({
  id: 'list_pending_payments',
  description: 'List orders with pending payments. Use when owner asks "quién me debe" or "pagos pendientes".',
  inputSchema: z.object({
    days_overdue: z.number().int().positive().optional().describe('Minimum days pending (default: 1)'),
  }),
  execute: async (input, context: YayaToolContext) => {
    const tenantId = getTenantId(context);
    const days = input.days_overdue ?? 1;
    const result = await query<{
      order_id: number;
      customer_name: string;
      total: string;
      created_at: string;
    }>(
      `SELECT o.id as order_id, c.name as customer_name, o.total, o.created_at
       FROM orders o
       LEFT JOIN customers c ON c.id = o.customer_id AND c.tenant_id = o.tenant_id
       WHERE o.tenant_id = $1
         AND o.status = 'payment_requested'
         AND o.created_at < now() - interval '1 hour' * $2
       ORDER BY o.created_at ASC`,
      [tenantId, days * 24],
    );

    if (result.rows.length === 0) return '✅ No hay pagos pendientes.';

    const totalAmount = result.rows.reduce((sum, r) => sum + Number(r.total), 0);
    const lines = result.rows.map(r => {
      const daysAgo = Math.floor((Date.now() - new Date(r.created_at).getTime()) / 86400_000);
      return `  #${r.order_id} ${r.customer_name || 'Sin nombre'} — ${Number(r.total).toFixed(2)} (hace ${daysAgo}d)`;
    });

    return `💰 ${result.rows.length} pagos pendientes — Total: ${totalAmount.toFixed(2)}\n${lines.join('\n')}`;
  },
});
