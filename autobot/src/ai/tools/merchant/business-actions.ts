import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { query } from '../../../db/pool.js';
import { getTenantId, type YayaToolContext } from '../types.js';

export const dailyBriefingTool = createTool({
  id: 'get_daily_briefing',
  description:
    'Get a quick daily business summary: orders, revenue, pending payments, new customers. ' +
    'Use when owner says "brief me", "resumen", "cómo va el negocio", "qué pasó hoy".',
  inputSchema: z.object({}),
  execute: async (_input, context: YayaToolContext) => {
    const tenantId = getTenantId(context);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const yesterdayStart = new Date(todayStart.getTime() - 86400_000);

    const [todayOrders, yesterdayOrders, pendingPayments, newCustomers, aiConversations] =
      await Promise.all([
        query<{ count: string; revenue: string }>(
          `SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as revenue
           FROM orders WHERE tenant_id = $1 AND created_at >= $2`,
          [tenantId, todayStart.toISOString()],
        ),
        query<{ count: string; revenue: string }>(
          `SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as revenue
           FROM orders WHERE tenant_id = $1 AND created_at >= $2 AND created_at < $3`,
          [tenantId, yesterdayStart.toISOString(), todayStart.toISOString()],
        ),
        query<{ count: string; total: string }>(
          `SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total
           FROM orders WHERE tenant_id = $1 AND status = 'payment_requested'`,
          [tenantId],
        ),
        query<{ count: string }>(
          `SELECT COUNT(*) as count FROM customers
           WHERE tenant_id = $1 AND created_at >= $2`,
          [tenantId, todayStart.toISOString()],
        ),
        query<{ count: string }>(
          `SELECT COUNT(DISTINCT jid) as count FROM agent_evaluations
           WHERE tenant_id = $1 AND created_at >= $2`,
          [tenantId, todayStart.toISOString()],
        ),
      ]);

    const todayRev = Number(todayOrders.rows[0].revenue);
    const yesterdayRev = Number(yesterdayOrders.rows[0].revenue);
    const revChange = yesterdayRev > 0
      ? `${((todayRev - yesterdayRev) / yesterdayRev * 100).toFixed(0)}% vs ayer`
      : 'primer día con datos';

    return [
      `📊 Resumen de hoy:`,
      `• Pedidos: ${todayOrders.rows[0].count} — Ingresos: ${todayRev.toFixed(2)} (${revChange})`,
      `• Pagos pendientes: ${pendingPayments.rows[0].count} — Total: ${Number(pendingPayments.rows[0].total).toFixed(2)}`,
      `• Nuevos clientes: ${newCustomers.rows[0].count}`,
      `• Conversaciones AI: ${aiConversations.rows[0].count}`,
    ].join('\n');
  },
});

export const searchConversationsTool = createTool({
  id: 'search_conversations',
  description: 'Search recent conversations by customer name/JID and optional keyword.',
  inputSchema: z.object({
    customer_name_or_jid: z.string().describe('Customer name or JID to search'),
    keyword: z.string().optional().describe('Keyword to search in message body'),
    days: z.number().int().positive().optional().describe('How many days back to search (default: 7)'),
  }),
  execute: async (input, context: YayaToolContext) => {
    const tenantId = getTenantId(context);
    const since = new Date(Date.now() - (input.days ?? 7) * 86400_000).toISOString();
    const result = await query<{ jid: string; direction: string; body: string; timestamp: string }>(
      `SELECT m.jid, m.direction, m.body, m.timestamp
       FROM message_log m
       WHERE m.tenant_id = $1
         AND m.timestamp >= $2
         AND (m.jid ILIKE $3 OR EXISTS (
           SELECT 1 FROM customers c WHERE c.tenant_id = $1 AND c.jid = m.jid AND c.name ILIKE $3
         ))
         ${input.keyword ? `AND m.body ILIKE $4` : ''}
       ORDER BY m.timestamp DESC LIMIT 5`,
      input.keyword
        ? [tenantId, since, `%${input.customer_name_or_jid}%`, `%${input.keyword}%`]
        : [tenantId, since, `%${input.customer_name_or_jid}%`],
    );

    if (result.rows.length === 0) return 'No se encontraron conversaciones.';

    return result.rows
      .map(r => {
        const dir = r.direction === 'incoming' ? '👤' : '🤖';
        const time = new Date(r.timestamp).toLocaleDateString('es-PE');
        const preview = r.body.slice(0, 100) + (r.body.length > 100 ? '...' : '');
        return `${dir} [${time}] ${preview}`;
      })
      .join('\n');
  },
});

export const comparePeriodsTool = createTool({
  id: 'compare_periods',
  description: 'Compare current vs previous week or month for revenue, orders, or customers.',
  inputSchema: z.object({
    period: z.enum(['week', 'month']).describe('Comparison period'),
    metric: z.enum(['revenue', 'orders', 'customers']).describe('Metric to compare'),
  }),
  execute: async (input, context: YayaToolContext) => {
    const tenantId = getTenantId(context);
    const now = new Date();
    let currentStart: Date;
    let previousStart: Date;
    let previousEnd: Date;

    if (input.period === 'week') {
      currentStart = new Date(now.getTime() - 7 * 86400_000);
      previousEnd = currentStart;
      previousStart = new Date(now.getTime() - 14 * 86400_000);
    } else {
      currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
      previousEnd = currentStart;
      previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    }

    let selectExpr: string;
    if (input.metric === 'revenue') selectExpr = 'COALESCE(SUM(total), 0)';
    else if (input.metric === 'orders') selectExpr = 'COUNT(*)';
    else selectExpr = 'COUNT(DISTINCT customer_id)';

    const [current, previous] = await Promise.all([
      query<{ value: string }>(
        `SELECT ${selectExpr} as value FROM orders WHERE tenant_id = $1 AND created_at >= $2`,
        [tenantId, currentStart.toISOString()],
      ),
      query<{ value: string }>(
        `SELECT ${selectExpr} as value FROM orders WHERE tenant_id = $1 AND created_at >= $2 AND created_at < $3`,
        [tenantId, previousStart.toISOString(), previousEnd.toISOString()],
      ),
    ]);

    const curr = Number(current.rows[0].value);
    const prev = Number(previous.rows[0].value);
    const pctChange = prev > 0 ? ((curr - prev) / prev * 100).toFixed(1) : 'N/A';
    const arrow = curr >= prev ? '📈' : '📉';

    const metricLabel = { revenue: 'Ingresos', orders: 'Pedidos', customers: 'Clientes' }[input.metric];
    const fmt = input.metric === 'revenue' ? (v: number) => v.toFixed(2) : (v: number) => String(Math.round(v));

    return `${arrow} ${metricLabel} — Esta ${input.period === 'week' ? 'semana' : 'mes'}: ${fmt(curr)} | Anterior: ${fmt(prev)} | Cambio: ${pctChange}%`;
  },
});

export const getInventoryAlertsTool = createTool({
  id: 'get_inventory_alerts',
  description: 'Show products that are out of stock, low stock, or have had no sales in 30 days.',
  inputSchema: z.object({}),
  execute: async (_input, context: YayaToolContext) => {
    const tenantId = getTenantId(context);

    const [outOfStock, lowStock, deadStock] = await Promise.all([
      query<{ id: number; name: string }>(
        `SELECT id, name FROM products WHERE tenant_id = $1 AND active = true AND stock = 0`,
        [tenantId],
      ),
      query<{ id: number; name: string; stock: number }>(
        `SELECT id, name, stock FROM products WHERE tenant_id = $1 AND active = true AND stock > 0 AND stock <= 5`,
        [tenantId],
      ),
      query<{ id: number; name: string }>(
        `SELECT p.id, p.name FROM products p
         WHERE p.tenant_id = $1 AND p.active = true
           AND NOT EXISTS (
             SELECT 1 FROM order_items oi
             JOIN orders o ON o.id = oi.order_id
             WHERE o.tenant_id = $1 AND oi.product_id = p.id
               AND o.created_at >= now() - interval '30 days'
           )`,
        [tenantId],
      ),
    ]);

    const lines: string[] = [];
    if (outOfStock.rows.length > 0) {
      lines.push(`🔴 Sin stock (${outOfStock.rows.length}): ${outOfStock.rows.map(p => p.name).join(', ')}`);
    }
    if (lowStock.rows.length > 0) {
      lines.push(`🟡 Stock bajo: ${lowStock.rows.map(p => `${p.name} (${p.stock})`).join(', ')}`);
    }
    if (deadStock.rows.length > 0) {
      lines.push(`⚪ Sin ventas en 30d: ${deadStock.rows.map(p => p.name).join(', ')}`);
    }
    return lines.length > 0 ? lines.join('\n') : '✅ Inventario saludable.';
  },
});
