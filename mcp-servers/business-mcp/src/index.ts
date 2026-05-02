#!/usr/bin/env node
/**
 * Business MCP Server
 *
 * Exposes Tier 1 business tools to Hermes agents via direct PostgreSQL queries.
 * Same logic as the voice tools in agente-ceo — single source of truth for
 * business data access.
 *
 * Tools:
 *   business_metrics  — Revenue, orders, payments breakdown
 *   customer_lookup   — Find customer by name/phone + recent orders
 *   send_message      — Send WhatsApp message via gateway
 *   calendar_today    — Today's appointments
 *   payment_status    — Pending payments / order status
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import pg from 'pg';

// ── Database ──

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 3,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 3000,
  statement_timeout: 10000,
});

async function query<T extends pg.QueryResultRow>(sql: string, params?: unknown[]): Promise<T[]> {
  const result = await pool.query<T>(sql, params);
  return result.rows;
}

async function queryOne<T extends pg.QueryResultRow>(sql: string, params?: unknown[]): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

const TENANT_ID = process.env.DEFAULT_TENANT_ID ?? '';

// ── MCP Server ──

const server = new Server(
  { name: 'business-mcp', version: '0.1.0' },
  { capabilities: { tools: {} } },
);

// ── Tool Definitions ──

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'business_metrics',
      description:
        'Get business metrics: revenue, order count, payments by method, pending orders. Periods: today, week, month.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          period: {
            type: 'string',
            enum: ['today', 'week', 'month'],
            description: 'Time period. Default: today.',
          },
        },
      },
    },
    {
      name: 'customer_lookup',
      description: 'Search for a customer by name or phone number. Returns contact info and recent orders.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          query: { type: 'string', description: 'Customer name or phone number' },
        },
        required: ['query'],
      },
    },
    {
      name: 'send_message',
      description: 'Send a WhatsApp message to a customer by name or phone number.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          phone: { type: 'string', description: 'Customer name or phone number' },
          message: { type: 'string', description: 'Message text to send' },
        },
        required: ['phone', 'message'],
      },
    },
    {
      name: 'calendar_today',
      description: "Get today's appointments and schedule.",
      inputSchema: { type: 'object' as const, properties: {} },
    },
    {
      name: 'payment_status',
      description: 'Check pending payments or payment status for a specific order.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          order_id: { type: 'number', description: 'Specific order ID to check' },
          customer_name: { type: 'string', description: 'Filter by customer name' },
        },
      },
    },
  ],
}));

// ── Tool Handlers ──

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  if (!TENANT_ID) {
    return { content: [{ type: 'text', text: 'Error: DEFAULT_TENANT_ID not set.' }] };
  }

  try {
    let result: string;

    switch (name) {
      case 'business_metrics':
        result = await businessMetrics((args.period as string) ?? 'today');
        break;
      case 'customer_lookup':
        result = await customerLookup(args.query as string);
        break;
      case 'send_message':
        result = await sendMessage(args.phone as string, args.message as string);
        break;
      case 'calendar_today':
        result = await calendarToday();
        break;
      case 'payment_status':
        result = await paymentStatus(
          args.order_id as number | undefined,
          args.customer_name as string | undefined,
        );
        break;
      default:
        result = JSON.stringify({ error: `Unknown tool: ${name}` });
    }

    return { content: [{ type: 'text', text: result }] };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `Error: ${err instanceof Error ? err.message : err}` }],
      isError: true,
    };
  }
});

// ── Business Logic (mirrors agente-ceo/src/lib/business-tools.ts) ──

async function businessMetrics(period: string): Promise<string> {
  let dateFilter: string;
  let periodLabel: string;

  switch (period) {
    case 'week':
      dateFilter = "o.created_at >= NOW() - INTERVAL '7 days'";
      periodLabel = 'últimos 7 días';
      break;
    case 'month':
      dateFilter = "o.created_at >= NOW() - INTERVAL '30 days'";
      periodLabel = 'últimos 30 días';
      break;
    default:
      dateFilter = 'o.created_at::date = CURRENT_DATE';
      periodLabel = 'hoy';
  }

  const [revenue, ordersByStatus, paymentsByMethod, pendingCount, customerCount] =
    await Promise.all([
      queryOne<{ total_revenue: string; order_count: string }>(
        `SELECT COALESCE(SUM(total), 0) as total_revenue, COUNT(*) as order_count
         FROM orders o WHERE tenant_id = $1 AND ${dateFilter}`,
        [TENANT_ID],
      ),
      query<{ status: string; count: string }>(
        `SELECT status, COUNT(*) as count
         FROM orders o WHERE tenant_id = $1 AND ${dateFilter}
         GROUP BY status ORDER BY count DESC`,
        [TENANT_ID],
      ),
      query<{ method: string; total: string; count: string }>(
        `SELECT p.method, COALESCE(SUM(p.amount), 0) as total, COUNT(*) as count
         FROM payments p
         JOIN orders o ON p.order_id = o.id AND o.tenant_id = p.tenant_id
         WHERE p.tenant_id = $1 AND p.status = 'confirmed'
           AND ${dateFilter}
         GROUP BY p.method ORDER BY total DESC`,
        [TENANT_ID],
      ),
      queryOne<{ count: string }>(
        `SELECT COUNT(*) as count FROM orders
         WHERE tenant_id = $1 AND status IN ('pending', 'payment_requested')`,
        [TENANT_ID],
      ),
      queryOne<{ count: string }>(
        `SELECT COUNT(*) as count FROM customers WHERE tenant_id = $1`,
        [TENANT_ID],
      ),
    ]);

  return JSON.stringify({
    period: periodLabel,
    revenue: revenue?.total_revenue ?? '0',
    order_count: revenue?.order_count ?? '0',
    orders_by_status: ordersByStatus,
    payments_by_method: paymentsByMethod,
    pending_orders: pendingCount?.count ?? '0',
    total_customers: customerCount?.count ?? '0',
  });
}

async function customerLookup(searchQuery: string): Promise<string> {
  const customers = await query<{
    id: number; name: string; phone: string; jid: string; tags: unknown; created_at: string;
  }>(
    `SELECT id, name, phone, jid, tags, created_at
     FROM customers
     WHERE tenant_id = $1 AND (name ILIKE $2 OR phone LIKE $3 OR jid LIKE $3)
     ORDER BY updated_at DESC LIMIT 5`,
    [TENANT_ID, `%${searchQuery}%`, `%${searchQuery}%`],
  );

  if (customers.length === 0) {
    return JSON.stringify({ message: `No customer found matching "${searchQuery}".` });
  }

  const enriched = await Promise.all(
    customers.map(async (c) => {
      const orders = await query<{ id: number; status: string; total: string; created_at: string }>(
        `SELECT id, status, total, created_at FROM orders
         WHERE tenant_id = $1 AND customer_id = $2
         ORDER BY created_at DESC LIMIT 3`,
        [TENANT_ID, c.id],
      );
      return { ...c, recent_orders: orders };
    }),
  );

  return JSON.stringify({ customers: enriched });
}

async function sendMessage(phone: string, message: string): Promise<string> {
  let jid = phone;
  let displayName = phone;

  if (!/\d{5,}/.test(phone)) {
    const customer = await queryOne<{ jid: string; name: string }>(
      `SELECT jid, name FROM customers WHERE tenant_id = $1 AND name ILIKE $2 LIMIT 1`,
      [TENANT_ID, `%${phone}%`],
    );
    if (!customer) {
      return JSON.stringify({ error: `No customer found matching "${phone}".` });
    }
    jid = customer.jid;
    displayName = customer.name;
  } else {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 15) {
      return JSON.stringify({ error: 'Invalid phone number: must be 10-15 digits.' });
    }
    jid = `${digits}@s.whatsapp.net`;
  }

  const gatewayUrl = process.env.WHATSAPP_GATEWAY_URL ?? 'http://localhost:3284';
  const account = process.env.WHATSAPP_ACCOUNT ?? 'default';

  try {
    const res = await fetch(`${gatewayUrl}/api/sessions/${account}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: jid, type: 'text', text: { body: message } }),
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      return JSON.stringify({ sent: true, to: displayName, message: message.slice(0, 200) });
    }
    return JSON.stringify({ error: `Gateway error: ${res.status}` });
  } catch (err) {
    return JSON.stringify({ error: `Could not send message: ${err instanceof Error ? err.message : err}` });
  }
}

async function calendarToday(): Promise<string> {
  const appointments = await query<{
    id: number; service_name: string; scheduled_at: string;
    duration_minutes: number; status: string; notes: string; customer_name: string;
  }>(
    `SELECT a.id, a.service_name, a.scheduled_at, a.duration_minutes,
            a.status, a.notes, c.name as customer_name
     FROM appointments a
     LEFT JOIN customers c ON c.id = a.customer_id AND c.tenant_id = a.tenant_id
     WHERE a.tenant_id = $1 AND a.scheduled_at::date = CURRENT_DATE
       AND a.status NOT IN ('cancelled')
     ORDER BY a.scheduled_at`,
    [TENANT_ID],
  );

  if (appointments.length === 0) {
    return JSON.stringify({ message: 'No appointments scheduled for today.' });
  }

  return JSON.stringify({
    date: new Date().toISOString().split('T')[0],
    count: appointments.length,
    appointments,
  });
}

async function paymentStatus(orderId?: number, customerName?: string): Promise<string> {
  if (orderId) {
    const order = await queryOne<{
      id: number; status: string; total: string; created_at: string; customer_name: string;
    }>(
      `SELECT o.id, o.status, o.total, o.created_at, c.name as customer_name
       FROM orders o
       LEFT JOIN customers c ON c.id = o.customer_id AND c.tenant_id = o.tenant_id
       WHERE o.tenant_id = $1 AND o.id = $2`,
      [TENANT_ID, orderId],
    );

    if (!order) return JSON.stringify({ error: `Order #${orderId} not found.` });

    const payments = await query<{ method: string; amount: string; status: string; created_at: string }>(
      `SELECT method, amount, status, created_at FROM payments
       WHERE tenant_id = $1 AND order_id = $2 ORDER BY created_at DESC`,
      [TENANT_ID, orderId],
    );

    return JSON.stringify({ order, payments });
  }

  const params: unknown[] = [TENANT_ID];
  let customerFilter = '';
  if (customerName) {
    customerFilter = ' AND c.name ILIKE $2';
    params.push(`%${customerName}%`);
  }

  const pending = await query<{
    order_id: number; customer_name: string; total: string;
    status: string; created_at: string; last_payment_method: string;
  }>(
    `SELECT o.id as order_id, c.name as customer_name, o.total, o.status, o.created_at,
            (SELECT method FROM payments WHERE order_id = o.id ORDER BY created_at DESC LIMIT 1)
              as last_payment_method
     FROM orders o
     LEFT JOIN customers c ON c.id = o.customer_id AND c.tenant_id = o.tenant_id
     WHERE o.tenant_id = $1
       AND o.status IN ('pending', 'payment_requested')${customerFilter}
     ORDER BY o.created_at DESC LIMIT 10`,
    params,
  );

  if (pending.length === 0) {
    return JSON.stringify({
      message: customerName
        ? `No pending payments for "${customerName}".`
        : 'No pending payments. All caught up!',
    });
  }

  const totalPending = pending.reduce((sum, p) => sum + parseFloat(p.total), 0).toFixed(2);
  return JSON.stringify({ pending_count: pending.length, total_pending: totalPending, orders: pending });
}

// ── Start ──

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('business-mcp server running on stdio');
}

main().catch((err) => {
  console.error('business-mcp fatal:', err);
  process.exit(1);
});
