import { query, queryOne, transaction } from './pool.js';
import { createRowMapper } from './row-mapper.js';
import { logger } from '../shared/logger.js';
import type { Order, OrderItem, OrderWithItems, OrderItemInput, OrderStatus } from '../shared/types.js';
import type { OrderRow, OrderItemRow, ProductRow, CustomerRow } from './row-types.js';
import * as catalogService from '../services/catalog-service.js';

const rowToOrder = createRowMapper<Order>({
  id: 'id',
  tenantId: 'tenant_id',
  customerId: 'customer_id',
  status: 'status',
  total: { col: 'total', type: 'number' },
  deliveryType: 'delivery_type',
  deliveryAddress: 'delivery_address',
  notes: 'notes',
  reminderCount: { col: 'reminder_count', type: 'number' },
  lastReminderAt: { col: 'last_reminder_at', type: 'date' },
  createdAt: { col: 'created_at', type: 'date' },
  updatedAt: { col: 'updated_at', type: 'date' },
});

export async function createOrder(
  tenantId: string,
  customerId: number,
  items: OrderItemInput[],
  deliveryType: string,
  deliveryAddress?: string,
  notes?: string,
): Promise<OrderWithItems> {
  const result = await transaction(async (client) => {
    // Validate items and compute total
    let total = 0;
    const resolvedItems: { productId: number; quantity: number; unitPrice: number; productName: string }[] = [];

    for (const item of items) {
      const pRow = await client.query<ProductRow>('SELECT * FROM products WHERE tenant_id = $1 AND id = $2', [tenantId, item.productId]);
      const product = pRow.rows[0];
      if (!product) throw new Error(`Product ${item.productId} not found`);
      if (!product.active) throw new Error(`Product "${product.name}" is not available`);
      if (product.stock !== null && product.stock < item.quantity) {
        throw new Error(`Not enough stock for "${product.name}" (available: ${product.stock})`);
      }
      resolvedItems.push({
        productId: product.id,
        quantity: item.quantity,
        unitPrice: Number(product.price),
        productName: product.name,
      });
      total += Number(product.price) * item.quantity;
    }

    const orderResult = await client.query<OrderRow>(
      `INSERT INTO orders (tenant_id, customer_id, status, total, delivery_type, delivery_address, notes)
       VALUES ($1, $2, 'pending', $3, $4, $5, $6)
       RETURNING *`,
      [tenantId, customerId, total, deliveryType, deliveryAddress ?? null, notes ?? null],
    );
    const insertedOrder = orderResult.rows[0];
    if (!insertedOrder) throw new Error('Failed to create order');
    const orderId = insertedOrder.id;

    for (const item of resolvedItems) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)',
        [orderId, item.productId, item.quantity, item.unitPrice],
      );
      // Decrement stock for physical products
      const stockRow = (await client.query<ProductRow>('SELECT stock FROM products WHERE id = $1 FOR UPDATE', [item.productId])).rows[0];
      if (stockRow && stockRow.stock !== null) {
        await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2 AND stock >= $1', [item.quantity, item.productId]);
      }
    }

    // Build return value from data already in the transaction
    const orderRow = insertedOrder;
    const itemRows = await client.query<OrderItemRow>(
      `SELECT oi.*, p.name as product_name FROM order_items oi
       JOIN products p ON oi.product_id = p.id WHERE oi.order_id = $1`,
      [orderId],
    );
    const customerRow = await client.query<CustomerRow>(
      'SELECT name, jid FROM customers WHERE id = $1', [customerId],
    );

    return {
      ...rowToOrder(orderRow),
      items: itemRows.rows.map((r: OrderItemRow) => ({
        id: r.id,
        orderId: r.order_id,
        productId: r.product_id,
        quantity: r.quantity,
        unitPrice: Number(r.unit_price),
        productName: r.product_name ?? '',
      })),
      customerName: customerRow.rows[0]?.name ?? null,
      customerJid: customerRow.rows[0]?.jid ?? '',
    };
  });

  // Post-order stock check (non-blocking)
  catalogService.checkStockAlerts(tenantId).catch(e => logger.warn({ err: (e as Error).message, tenantId }, 'Stock alert check failed'));

  return result;
}

async function getOrderByIdInternal(tenantId: string, id: number): Promise<OrderWithItems | undefined> {
  const row = await queryOne<OrderRow>('SELECT * FROM orders WHERE tenant_id = $1 AND id = $2', [tenantId, id]);
  if (!row) return undefined;

  const order = rowToOrder(row);
  const itemResult = await query<OrderItemRow>(
    `SELECT oi.*, p.name as product_name FROM order_items oi
     JOIN products p ON oi.product_id = p.id WHERE oi.order_id = $1`,
    [id],
  );

  const customerRow = await queryOne<CustomerRow>('SELECT name, jid FROM customers WHERE id = $1', [row.customer_id]);

  return {
    ...order,
    items: itemResult.rows.map((r: OrderItemRow) => ({
      id: r.id,
      orderId: r.order_id,
      productId: r.product_id,
      quantity: r.quantity,
      unitPrice: Number(r.unit_price),
      productName: r.product_name ?? '',
    })),
    customerName: customerRow?.name ?? null,
    customerJid: customerRow?.jid ?? '',
  };
}

export async function getOrderById(tenantId: string, id: number): Promise<OrderWithItems | undefined> {
  return getOrderByIdInternal(tenantId, id);
}

export async function getOrdersByCustomer(tenantId: string, customerId: number): Promise<Order[]> {
  const result = await query<OrderRow>(
    'SELECT * FROM orders WHERE tenant_id = $1 AND customer_id = $2 ORDER BY created_at DESC',
    [tenantId, customerId],
  );
  return result.rows.map(rowToOrder);
}

export async function getOrdersByStatus(tenantId: string, status: string): Promise<Order[]> {
  const result = await query<OrderRow>(
    'SELECT * FROM orders WHERE tenant_id = $1 AND status = $2 ORDER BY created_at DESC',
    [tenantId, status],
  );
  return result.rows.map(rowToOrder);
}

export async function getAllOrders(tenantId: string, options: { limit: number; offset: number; status?: string }): Promise<Order[]> {
  const conditions = ['tenant_id = $1'];
  const params: unknown[] = [tenantId];
  if (options.status) conditions.push(`status = $${params.push(options.status)}`);
  const result = await query<OrderRow>(
    `SELECT * FROM orders WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC LIMIT $${params.push(options.limit)} OFFSET $${params.push(options.offset)}`,
    params,
  );
  return result.rows.map(rowToOrder);
}

export async function updateOrderStatus(tenantId: string, id: number, status: OrderStatus): Promise<Order | undefined> {
  const row = await queryOne<OrderRow>(
    'UPDATE orders SET status = $1, updated_at = now() WHERE tenant_id = $2 AND id = $3 RETURNING *',
    [status, tenantId, id],
  );
  return row ? rowToOrder(row) : undefined;
}

export async function getOrderCount(tenantId: string, status?: string): Promise<number> {
  const conditions = ['tenant_id = $1'];
  const params: unknown[] = [tenantId];
  if (status) conditions.push(`status = $${params.push(status)}`);
  const row = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM orders WHERE ${conditions.join(' AND ')}`, params);
  return Number(row?.count ?? 0);
}

export async function getOrdersByDateRange(
  tenantId: string,
  startDate: Date,
  endDate: Date
): Promise<OrderWithItems[]> {
  // Single query with JOINs instead of N+1
  const result = await query<OrderRow & { customer_name: string; customer_jid: string }>(
    `SELECT o.*, c.name as customer_name, c.jid as customer_jid
     FROM orders o
     LEFT JOIN customers c ON o.customer_id = c.id
     WHERE o.tenant_id = $1
       AND o.created_at >= $2
       AND o.created_at <= $3
     ORDER BY o.created_at DESC`,
    [tenantId, startDate, endDate],
  );

  if (result.rows.length === 0) return [];

  const orderIds = result.rows.map(r => r.id);
  const itemsResult = await query<OrderItemRow>(
    `SELECT oi.*, p.name as product_name
     FROM order_items oi
     JOIN products p ON oi.product_id = p.id
     WHERE oi.order_id = ANY($1)`,
    [orderIds],
  );

  // Group items by order_id
  const itemsByOrderId = new Map<number, OrderItemRow[]>();
  for (const item of itemsResult.rows) {
    const list = itemsByOrderId.get(item.order_id) || [];
    list.push(item);
    itemsByOrderId.set(item.order_id, list);
  }

  return result.rows.map(row => ({
    ...rowToOrder(row),
    items: (itemsByOrderId.get(row.id) || []).map((r: OrderItemRow) => ({
      id: r.id,
      orderId: r.order_id,
      productId: r.product_id,
      quantity: r.quantity,
      unitPrice: Number(r.unit_price),
      productName: r.product_name ?? '',
    })),
    customerName: row.customer_name ?? null,
    customerJid: row.customer_jid ?? '',
  }));
}

/**
 * Get orders that need payment follow-up reminders.
 * Finds orders in 'payment_requested' status older than hoursAfterRequest
 * that haven't exceeded maxReminders.
 */
export async function getOrdersNeedingPaymentReminder(
  tenantId?: string,
  hoursAfterRequest: number = 4,
  maxReminders: number = 3,
): Promise<(Order & { customerJid: string; customerChannel: string })[]> {
  const params: unknown[] = [maxReminders, hoursAfterRequest];
  let tenantFilter = '';
  if (tenantId) {
    params.push(tenantId);
    tenantFilter = `AND o.tenant_id = $${params.length}`;
  }
  const result = await query<OrderRow & { customer_jid: string; customer_channel: string }>(
    `SELECT o.*, c.jid as customer_jid, c.channel as customer_channel
     FROM orders o
     JOIN customers c ON o.customer_id = c.id AND o.tenant_id = c.tenant_id
     WHERE o.status = 'payment_requested'
       AND o.reminder_count < $1
       AND (o.last_reminder_at IS NULL OR o.last_reminder_at < now() - ($2 || ' hours')::INTERVAL)
       AND o.updated_at < now() - ($2 || ' hours')::INTERVAL
       ${tenantFilter}
     ORDER BY o.created_at`,
    params,
  );
  return result.rows.map(r => ({
    ...rowToOrder(r),
    customerJid: String(r.customer_jid),
    customerChannel: String(r.customer_channel),
  }));
}

export async function incrementReminderCount(tenantId: string, orderId: number): Promise<void> {
  await query(
    'UPDATE orders SET reminder_count = reminder_count + 1, last_reminder_at = now() WHERE tenant_id = $1 AND id = $2',
    [tenantId, orderId],
  );
}

/**
 * Modify an existing order's items. Replaces all current items with a new list.
 * Only allowed for orders that haven't been paid yet (pending, confirmed, payment_requested).
 */
export async function modifyOrder(
  tenantId: string,
  orderId: number,
  newItems: { productId: number; quantity: number }[],
): Promise<OrderWithItems> {
  return transaction(async (client) => {
    // Get current order and validate status
    const orderResult = await client.query<OrderRow>(
      'SELECT * FROM orders WHERE tenant_id = $1 AND id = $2 FOR UPDATE',
      [tenantId, orderId],
    );
    const orderRow = orderResult.rows[0];
    if (!orderRow) throw new Error(`Order #${orderId} not found`);

    const allowedStatuses = ['pending', 'confirmed', 'payment_requested'];
    if (!allowedStatuses.includes(orderRow.status)) {
      throw new Error(`Cannot modify order in "${orderRow.status}" status. Only pending, confirmed, or payment_requested orders can be modified.`);
    }

    // Get existing items and restore stock
    const existingItems = await client.query<OrderItemRow>(
      'SELECT * FROM order_items WHERE order_id = $1',
      [orderId],
    );
    for (const item of existingItems.rows) {
      const stockRow = (await client.query<ProductRow>('SELECT stock FROM products WHERE id = $1 FOR UPDATE', [item.product_id])).rows[0];
      if (stockRow && stockRow.stock !== null) {
        await client.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [item.quantity, item.product_id]);
      }
    }

    // Delete old items
    await client.query('DELETE FROM order_items WHERE order_id = $1', [orderId]);

    // Insert new items and compute total
    let total = 0;
    const resolvedItems: { productId: number; quantity: number; unitPrice: number; productName: string }[] = [];

    for (const item of newItems) {
      const pRow = await client.query<ProductRow>('SELECT * FROM products WHERE tenant_id = $1 AND id = $2', [tenantId, item.productId]);
      const product = pRow.rows[0];
      if (!product) throw new Error(`Product ${item.productId} not found`);
      if (!product.active) throw new Error(`Product "${product.name}" is not available`);
      if (product.stock !== null && product.stock < item.quantity) {
        throw new Error(`Not enough stock for "${product.name}" (available: ${product.stock})`);
      }
      resolvedItems.push({
        productId: product.id,
        quantity: item.quantity,
        unitPrice: Number(product.price),
        productName: product.name,
      });
      total += Number(product.price) * item.quantity;
    }

    for (const item of resolvedItems) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)',
        [orderId, item.productId, item.quantity, item.unitPrice],
      );
      const stockRow = (await client.query<ProductRow>('SELECT stock FROM products WHERE id = $1 FOR UPDATE', [item.productId])).rows[0];
      if (stockRow && stockRow.stock !== null) {
        await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2 AND stock >= $1', [item.quantity, item.productId]);
      }
    }

    // Update order total
    const updatedOrder = await client.query<OrderRow>(
      'UPDATE orders SET total = $1, updated_at = now() WHERE tenant_id = $2 AND id = $3 RETURNING *',
      [total, tenantId, orderId],
    );

    const customerRow = await client.query<CustomerRow>(
      'SELECT name, jid FROM customers WHERE id = $1', [orderRow.customer_id],
    );

    return {
      ...rowToOrder(updatedOrder.rows[0]),
      items: resolvedItems.map(i => ({
        id: 0,
        orderId,
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        productName: i.productName,
      })),
      customerName: customerRow.rows[0]?.name ?? null,
      customerJid: customerRow.rows[0]?.jid ?? '',
    };
  });
}
