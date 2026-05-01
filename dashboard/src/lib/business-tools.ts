/**
 * Tier 1 Business Tools — System 1 (voice) + System 2 (OpenClaw MCP)
 *
 * Pure functions that query PostgreSQL directly. No ORM, no HTTP intermediary.
 * Designed for <500ms response time in the voice pipeline.
 *
 * Tools:
 *   business_metrics  — Revenue, orders, payments breakdown
 *   customer_lookup   — Find customer by name/phone + recent orders
 *   send_message      — Send WhatsApp message (gateway → fallback to OpenClaw)
 *   calendar_today    — Today's appointments
 *   payment_status    — Pending payments / specific order status
 */

import { query, queryOne } from './business-db';

const TENANT_ID = () => process.env.DEFAULT_TENANT_ID ?? '';

// ── Tool Definitions (OpenAI function-calling format) ──

export const BUSINESS_TOOL_DEFS = [
  {
    type: 'function' as const,
    function: {
      name: 'business_metrics',
      description:
        'Get business metrics: revenue, order count, payments by method, pending orders. Use when user asks "how is business?", "sales today?", "how much did we sell?".',
      parameters: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: ['today', 'week', 'month'],
            description: 'Time period. Default: today.',
          },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'customer_lookup',
      description:
        'Look up a customer by name or phone. Returns contact info and recent orders. Use when user asks about a specific customer.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Customer name or phone number',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'send_message',
      description:
        'Send a WhatsApp message to a customer. Use when user says "tell Juan...", "send a message to...", "remind Maria about...".',
      parameters: {
        type: 'object',
        properties: {
          phone: {
            type: 'string',
            description: 'Customer name or phone number',
          },
          message: {
            type: 'string',
            description: 'Message text to send',
          },
        },
        required: ['phone', 'message'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'calendar_today',
      description:
        'Get today\'s appointments and schedule. Use when user asks "what\'s on my schedule?", "appointments today?", "who\'s coming in?".',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'payment_status',
      description:
        'Check pending payments or a specific order\'s payment status. Use when user asks "pending payments?", "did Juan pay?", "status of order 5?".',
      parameters: {
        type: 'object',
        properties: {
          order_id: {
            type: 'number',
            description: 'Specific order ID to check',
          },
          customer_name: {
            type: 'string',
            description: 'Filter by customer name',
          },
        },
      },
    },
  },
];

// ── Dispatcher ──

export async function handleBusinessTool(
  name: string,
  args: Record<string, unknown>,
): Promise<string> {
  const tenantId = TENANT_ID();
  if (!tenantId) {
    return JSON.stringify({ error: 'No tenant configured. Set DEFAULT_TENANT_ID.' });
  }

  try {
    switch (name) {
      case 'business_metrics':
        return await businessMetrics(tenantId, (args.period as string) ?? 'today');
      case 'customer_lookup':
        return await customerLookup(tenantId, args.query as string);
      case 'send_message':
        return await sendMessage(tenantId, args.phone as string, args.message as string);
      case 'calendar_today':
        return await calendarToday(tenantId);
      case 'payment_status':
        return await paymentStatus(
          tenantId,
          args.order_id as number | undefined,
          args.customer_name as string | undefined,
        );
      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (err) {
    return JSON.stringify({ error: `Tool error: ${err}` });
  }
}

// ── business_metrics ──

async function businessMetrics(tenantId: string, period: string): Promise<string> {
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
        [tenantId],
      ),
      query<{ status: string; count: string }>(
        `SELECT status, COUNT(*) as count
         FROM orders o WHERE tenant_id = $1 AND ${dateFilter}
         GROUP BY status ORDER BY count DESC`,
        [tenantId],
      ),
      query<{ method: string; total: string; count: string }>(
        `SELECT p.method, COALESCE(SUM(p.amount), 0) as total, COUNT(*) as count
         FROM payments p
         JOIN orders o ON p.order_id = o.id AND o.tenant_id = p.tenant_id
         WHERE p.tenant_id = $1 AND p.status = 'confirmed'
           AND ${dateFilter.replace(/o\./g, 'o.')}
         GROUP BY p.method ORDER BY total DESC`,
        [tenantId],
      ),
      queryOne<{ count: string }>(
        `SELECT COUNT(*) as count FROM orders
         WHERE tenant_id = $1 AND status IN ('pending', 'payment_requested')`,
        [tenantId],
      ),
      queryOne<{ count: string }>(
        `SELECT COUNT(*) as count FROM customers WHERE tenant_id = $1`,
        [tenantId],
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

// ── customer_lookup ──

async function customerLookup(tenantId: string, searchQuery: string): Promise<string> {
  const customers = await query<{
    id: number;
    name: string;
    phone: string;
    jid: string;
    tags: unknown;
    created_at: string;
  }>(
    `SELECT id, name, phone, jid, tags, created_at
     FROM customers
     WHERE tenant_id = $1
       AND (name ILIKE $2 OR phone LIKE $3 OR jid LIKE $3)
     ORDER BY updated_at DESC LIMIT 5`,
    [tenantId, `%${searchQuery}%`, `%${searchQuery}%`],
  );

  if (customers.length === 0) {
    return JSON.stringify({ message: `No customer found matching "${searchQuery}".` });
  }

  const enriched = await Promise.all(
    customers.map(async (c) => {
      const orders = await query<{
        id: number;
        status: string;
        total: string;
        created_at: string;
      }>(
        `SELECT id, status, total, created_at FROM orders
         WHERE tenant_id = $1 AND customer_id = $2
         ORDER BY created_at DESC LIMIT 3`,
        [tenantId, c.id],
      );
      return { ...c, recent_orders: orders };
    }),
  );

  return JSON.stringify({ customers: enriched });
}

// ── send_message ──

async function sendMessage(
  tenantId: string,
  phone: string,
  message: string,
): Promise<string> {
  // Resolve name → JID if input doesn't look like a phone number
  let jid = phone;
  let displayName = phone;

  if (!/\d{5,}/.test(phone)) {
    const customer = await queryOne<{ jid: string; name: string }>(
      `SELECT jid, name FROM customers
       WHERE tenant_id = $1 AND name ILIKE $2
       LIMIT 1`,
      [tenantId, `%${phone}%`],
    );
    if (!customer) {
      return JSON.stringify({
        error: `No customer found matching "${phone}". Try using a phone number.`,
      });
    }
    jid = customer.jid;
    displayName = customer.name;
  } else {
    // Normalize phone to JID format
    const digits = phone.replace(/\D/g, '');
    jid = `${digits}@s.whatsapp.net`;
  }

  // Try direct gateway first (fast path)
  const gatewayUrl = process.env.WHATSAPP_GATEWAY_URL ?? 'http://localhost:3284';
  const account = process.env.WHATSAPP_ACCOUNT ?? 'default';

  try {
    const res = await fetch(`${gatewayUrl}/api/sessions/${account}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: jid,
        type: 'text',
        text: { body: message },
      }),
      signal: AbortSignal.timeout(3000),
    });

    if (res.ok) {
      return JSON.stringify({ sent: true, to: displayName, message: message.slice(0, 100) });
    }
    return JSON.stringify({ error: `Gateway error: ${res.status}. Verifica que WhatsApp esté conectado.` });
  } catch {
    return JSON.stringify({ error: 'WhatsApp gateway no disponible. Ve a Configuración para conectar.' });
  }
}

// ── calendar_today ──

async function calendarToday(tenantId: string): Promise<string> {
  const appointments = await query<{
    id: number;
    service_name: string;
    scheduled_at: string;
    duration_minutes: number;
    status: string;
    notes: string;
    customer_name: string;
  }>(
    `SELECT a.id, a.service_name, a.scheduled_at, a.duration_minutes,
            a.status, a.notes, c.name as customer_name
     FROM appointments a
     LEFT JOIN customers c ON c.id = a.customer_id AND c.tenant_id = a.tenant_id
     WHERE a.tenant_id = $1 AND a.scheduled_at::date = CURRENT_DATE
       AND a.status NOT IN ('cancelled')
     ORDER BY a.scheduled_at`,
    [tenantId],
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

// ── payment_status ──

async function paymentStatus(
  tenantId: string,
  orderId?: number,
  customerName?: string,
): Promise<string> {
  if (orderId) {
    const order = await queryOne<{
      id: number;
      status: string;
      total: string;
      created_at: string;
      customer_name: string;
    }>(
      `SELECT o.id, o.status, o.total, o.created_at, c.name as customer_name
       FROM orders o
       LEFT JOIN customers c ON c.id = o.customer_id AND c.tenant_id = o.tenant_id
       WHERE o.tenant_id = $1 AND o.id = $2`,
      [tenantId, orderId],
    );

    if (!order) {
      return JSON.stringify({ error: `Order #${orderId} not found.` });
    }

    const payments = await query<{
      method: string;
      amount: string;
      status: string;
      created_at: string;
    }>(
      `SELECT method, amount, status, created_at FROM payments
       WHERE tenant_id = $1 AND order_id = $2 ORDER BY created_at DESC`,
      [tenantId, orderId],
    );

    return JSON.stringify({ order, payments });
  }

  // General: pending payments
  const params: unknown[] = [tenantId];
  let customerFilter = '';
  if (customerName) {
    customerFilter = ' AND c.name ILIKE $2';
    params.push(`%${customerName}%`);
  }

  const pending = await query<{
    order_id: number;
    customer_name: string;
    total: string;
    status: string;
    created_at: string;
    last_payment_method: string;
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

  const totalPending = pending
    .reduce((sum, p) => sum + parseFloat(p.total), 0)
    .toFixed(2);

  return JSON.stringify({
    pending_count: pending.length,
    total_pending: totalPending,
    orders: pending,
  });
}
