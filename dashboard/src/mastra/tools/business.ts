/**
 * Mastra-typed business tools — wraps the existing direct-PG functions
 * from business-tools.ts with Zod schemas for type-safe agent tool calling.
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { query, queryOne } from '@/lib/business-db';

const TENANT_ID = () => process.env.DEFAULT_TENANT_ID ?? '';

// ── Metrics ──

export const businessMetrics = createTool({
  id: 'business-metrics',
  description: 'Get business metrics: revenue, order count, payments by method, pending orders.',
  inputSchema: z.object({
    period: z.enum(['today', 'week', 'month']).default('today'),
  }),
  outputSchema: z.object({
    period: z.string(),
    revenue: z.string(),
    order_count: z.string(),
    pending_orders: z.string(),
    total_customers: z.string(),
    orders_by_status: z.array(z.object({ status: z.string(), count: z.string() })),
    payments_by_method: z.array(z.object({ method: z.string(), total: z.string(), count: z.string() })),
  }),
  execute: async ({ period }) => {
    const tenantId = TENANT_ID();
    let dateFilter: string;
    let periodLabel: string;
    switch (period) {
      case 'week': dateFilter = "o.created_at >= NOW() - INTERVAL '7 days'"; periodLabel = 'últimos 7 días'; break;
      case 'month': dateFilter = "o.created_at >= NOW() - INTERVAL '30 days'"; periodLabel = 'últimos 30 días'; break;
      default: dateFilter = 'o.created_at::date = CURRENT_DATE'; periodLabel = 'hoy';
    }
    const [rev, statuses, payments, pending, customers] = await Promise.all([
      queryOne<any>(`SELECT COALESCE(SUM(total),0) as total_revenue, COUNT(*) as order_count FROM orders o WHERE tenant_id=$1 AND ${dateFilter}`, [tenantId]),
      query<any>(`SELECT status, COUNT(*) as count FROM orders o WHERE tenant_id=$1 AND ${dateFilter} GROUP BY status ORDER BY count DESC`, [tenantId]),
      query<any>(`SELECT p.method, COALESCE(SUM(p.amount),0) as total, COUNT(*) as count FROM payments p JOIN orders o ON p.order_id=o.id AND o.tenant_id=p.tenant_id WHERE p.tenant_id=$1 AND p.status='confirmed' AND ${dateFilter} GROUP BY p.method ORDER BY total DESC`, [tenantId]),
      queryOne<any>(`SELECT COUNT(*) as count FROM orders WHERE tenant_id=$1 AND status IN ('pending','payment_requested')`, [tenantId]),
      queryOne<any>(`SELECT COUNT(*) as count FROM customers WHERE tenant_id=$1`, [tenantId]),
    ]);
    return {
      period: periodLabel,
      revenue: rev?.total_revenue ?? '0',
      order_count: rev?.order_count ?? '0',
      pending_orders: pending?.count ?? '0',
      total_customers: customers?.count ?? '0',
      orders_by_status: statuses,
      payments_by_method: payments,
    };
  },
});

// ── Customer Lookup ──

export const customerLookup = createTool({
  id: 'customer-lookup',
  description: 'Search for a customer by name or phone. Returns contact info and recent orders.',
  inputSchema: z.object({
    query: z.string().describe('Customer name or phone number'),
  }),
  outputSchema: z.object({
    customers: z.array(z.any()),
    message: z.string().optional(),
  }),
  execute: async ({ query: q }) => {
    const tenantId = TENANT_ID();
    const rows = await query<any>(
      `SELECT id, name, phone, jid, tags, created_at FROM customers WHERE tenant_id=$1 AND (name ILIKE $2 OR phone LIKE $3 OR jid LIKE $3) ORDER BY updated_at DESC LIMIT 5`,
      [tenantId, `%${q}%`, `%${q}%`],
    );
    if (rows.length === 0) return { customers: [], message: `No customer found matching "${q}".` };
    const enriched = await Promise.all(rows.map(async (c: any) => {
      const orders = await query<any>(
        `SELECT id, status, total, created_at FROM orders WHERE tenant_id=$1 AND customer_id=$2 ORDER BY created_at DESC LIMIT 3`,
        [tenantId, c.id],
      );
      return { ...c, recent_orders: orders };
    }));
    return { customers: enriched };
  },
});

// ── Payment Status ──

export const paymentStatus = createTool({
  id: 'payment-status',
  description: 'Check pending payments or a specific order payment status.',
  inputSchema: z.object({
    order_id: z.number().optional(),
    customer_name: z.string().optional(),
  }),
  outputSchema: z.object({
    pending_count: z.number().optional(),
    total_pending: z.string().optional(),
    orders: z.array(z.any()).optional(),
    order: z.any().optional(),
    payments: z.array(z.any()).optional(),
    message: z.string().optional(),
  }),
  execute: async ({ order_id, customer_name }) => {
    const tenantId = TENANT_ID();
    if (order_id) {
      const order = await queryOne<any>(
        `SELECT o.id, o.status, o.total, o.created_at, c.name as customer_name FROM orders o LEFT JOIN customers c ON c.id=o.customer_id AND c.tenant_id=o.tenant_id WHERE o.tenant_id=$1 AND o.id=$2`,
        [tenantId, order_id],
      );
      if (!order) return { message: `Order #${order_id} not found.` };
      const payments = await query<any>(`SELECT method, amount, status, created_at FROM payments WHERE tenant_id=$1 AND order_id=$2 ORDER BY created_at DESC`, [tenantId, order_id]);
      return { order, payments };
    }
    const params: unknown[] = [tenantId];
    let filter = '';
    if (customer_name) { filter = ' AND c.name ILIKE $2'; params.push(`%${customer_name}%`); }
    const pending = await query<any>(
      `SELECT o.id as order_id, c.name as customer_name, o.total, o.status, o.created_at FROM orders o LEFT JOIN customers c ON c.id=o.customer_id AND c.tenant_id=o.tenant_id WHERE o.tenant_id=$1 AND o.status IN ('pending','payment_requested')${filter} ORDER BY o.created_at DESC LIMIT 10`,
      params,
    );
    if (pending.length === 0) return { message: customer_name ? `No pending payments for "${customer_name}".` : 'No pending payments!' };
    const total = pending.reduce((s: number, p: any) => s + parseFloat(p.total), 0).toFixed(2);
    return { pending_count: pending.length, total_pending: total, orders: pending };
  },
});

// ── Calendar ──

export const calendarToday = createTool({
  id: 'calendar-today',
  description: "Get today's appointments and schedule.",
  inputSchema: z.object({}),
  outputSchema: z.object({
    count: z.number().optional(),
    appointments: z.array(z.any()).optional(),
    message: z.string().optional(),
  }),
  execute: async () => {
    const tenantId = TENANT_ID();
    const rows = await query<any>(
      `SELECT a.id, a.service_name, a.scheduled_at, a.duration_minutes, a.status, a.notes, c.name as customer_name FROM appointments a LEFT JOIN customers c ON c.id=a.customer_id AND c.tenant_id=a.tenant_id WHERE a.tenant_id=$1 AND a.scheduled_at::date=CURRENT_DATE AND a.status NOT IN ('cancelled') ORDER BY a.scheduled_at`,
      [tenantId],
    );
    if (rows.length === 0) return { message: 'No appointments scheduled for today.' };
    return { count: rows.length, appointments: rows };
  },
});

// ── Send Message ──

export const sendMessage = createTool({
  id: 'send-message',
  description: 'Send a WhatsApp message to a customer by name or phone number.',
  inputSchema: z.object({
    phone: z.string().describe('Customer name or phone number'),
    message: z.string().describe('Message text to send'),
  }),
  outputSchema: z.object({
    sent: z.boolean().optional(),
    queued: z.boolean().optional(),
    to: z.string(),
    message: z.string(),
    error: z.string().optional(),
  }),
  execute: async ({ phone, message }) => {
    const tenantId = TENANT_ID();
    let jid = phone;
    let displayName = phone;
    if (!/\d{5,}/.test(phone)) {
      const customer = await queryOne<any>(`SELECT jid, name FROM customers WHERE tenant_id=$1 AND name ILIKE $2 LIMIT 1`, [tenantId, `%${phone}%`]);
      if (!customer) return { to: phone, message, error: `No customer found matching "${phone}".` };
      jid = customer.jid;
      displayName = customer.name;
    } else {
      jid = `${phone.replace(/\D/g, '')}@s.whatsapp.net`;
    }
    const gatewayUrl = process.env.WHATSAPP_GATEWAY_URL ?? 'http://localhost:3284';
    const account = process.env.WHATSAPP_ACCOUNT ?? 'default';
    try {
      const res = await fetch(`${gatewayUrl}/api/sessions/${account}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: jid, type: 'text', text: { body: message } }),
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) return { sent: true, to: displayName, message: message.slice(0, 100) };
    } catch { /* gateway not available */ }
    return { queued: true, to: displayName, message: message.slice(0, 100) };
  },
});

// ── All tools as a record for Mastra agents ──

export const allBusinessTools = {
  businessMetrics,
  customerLookup,
  paymentStatus,
  calendarToday,
  sendMessage,
};
