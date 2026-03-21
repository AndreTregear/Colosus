import * as productsRepo from '../db/products-repo.js';
import * as customersRepo from '../db/customers-repo.js';
import * as settingsRepo from '../db/settings-repo.js';
import { query } from '../db/pool.js';
import { appBus } from '../shared/events.js';
import type { Product } from '../shared/types.js';

// ── Stock Alerts (moved from products-repo.ts) ──

export async function checkStockAlerts(tenantId: string, lowStockThreshold: number = 5): Promise<void> {
  const all = await productsRepo.getAllProducts(tenantId);

  for (const product of all.filter(p => p.active && p.stock !== null && p.stock <= lowStockThreshold && p.stock > 0)) {
    appBus.emit('low-stock-alert', tenantId, product.id, product.name, product.stock!);
  }

  for (const product of all.filter(p => p.active && p.stock !== null && p.stock <= 0)) {
    await productsRepo.updateProduct(tenantId, product.id, { active: false });
    appBus.emit('out-of-stock', tenantId, product.id, product.name);
  }
}

// ── Inventory Status ──

export async function getInventoryStatus(tenantId: string): Promise<{
  totalActive: number;
  trackedProducts: number;
  unlimitedStockProducts: number;
  lowStockThreshold: number;
  lowStockItems: Array<{ id: number; name: string; category: string; currentStock: number | null; active: boolean }>;
  summary: string;
}> {
  const threshold = Number(await settingsRepo.getEffectiveSetting(tenantId, 'low_stock_threshold', '5'));
  const lowStock = await productsRepo.getLowStockProducts(tenantId, threshold);
  const allActive = await productsRepo.getActiveProducts(tenantId);

  const withStock = allActive.filter(p => p.stock !== null);
  const unlimited = allActive.filter(p => p.stock === null);

  return {
    totalActive: allActive.length,
    trackedProducts: withStock.length,
    unlimitedStockProducts: unlimited.length,
    lowStockThreshold: threshold,
    lowStockItems: lowStock.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      currentStock: p.stock,
      active: p.active,
    })),
    summary: lowStock.length > 0
      ? `${lowStock.length} product(s) with low stock (≤${threshold} units)`
      : 'All products have healthy stock levels.',
  };
}

// ── Recommendations (moved from get-recommendations.ts tool) ──

export async function getRecommendations(
  tenantId: string,
  customerJid?: string,
  channel?: string,
): Promise<{
  type: 'popular' | 'personalized';
  products?: Array<{ id: number; name: string; orderCount?: number; price?: number; category?: string }>;
  favoriteCategories?: string[];
  newRecommendations?: Array<{ id: number; name: string; price: number; category: string }>;
  reorderSuggestions?: Array<{ productId: number; category: string; previousQuantity: number }>;
  reason?: string;
}> {
  const customer = customerJid ? await customersRepo.getCustomerByJid(tenantId, customerJid, channel ?? 'whatsapp') : null;

  if (!customer) {
    const popular = await query<{ product_id: number; name: string; order_count: string }>(
      `SELECT p.id as product_id, p.name, COUNT(oi.id) as order_count
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       JOIN products p ON oi.product_id = p.id
       WHERE o.tenant_id = $1 AND p.active = true
       GROUP BY p.id, p.name
       ORDER BY order_count DESC LIMIT 5`,
      [tenantId],
    );
    return {
      type: 'popular',
      reason: 'New customer — showing most popular products',
      products: popular.rows.map(r => ({ id: r.product_id, name: r.name, orderCount: Number(r.order_count) })),
    };
  }

  const previouslyOrdered = await query<{ product_id: number; category: string; total_qty: string }>(
    `SELECT oi.product_id, p.category, SUM(oi.quantity) as total_qty
     FROM order_items oi
     JOIN orders o ON oi.order_id = o.id
     JOIN products p ON oi.product_id = p.id
     WHERE o.tenant_id = $1 AND o.customer_id = $2 AND o.status != 'cancelled'
     GROUP BY oi.product_id, p.category
     ORDER BY total_qty DESC`,
    [tenantId, customer.id],
  );

  const favoriteCategories = [...new Set(previouslyOrdered.rows.map(r => r.category))].slice(0, 3);
  const purchasedIds = previouslyOrdered.rows.map(r => r.product_id);

  const allActive = await productsRepo.getActiveProducts(tenantId);
  const newRecommendations = allActive
    .filter(p => favoriteCategories.includes(p.category) && !purchasedIds.includes(p.id))
    .slice(0, 5);

  const reorderSuggestions = previouslyOrdered.rows.slice(0, 3).map(r => ({
    productId: r.product_id,
    category: r.category,
    previousQuantity: Number(r.total_qty),
  }));

  return {
    type: 'personalized',
    favoriteCategories,
    newRecommendations: newRecommendations.map(p => ({ id: p.id, name: p.name, price: p.price, category: p.category })),
    reorderSuggestions,
  };
}

// ── Business Hours (moved from get-business-hours.ts tool) ──

const DAY_NAMES: Record<string, string> = {
  '0': 'Sunday', '1': 'Monday', '2': 'Tuesday', '3': 'Wednesday',
  '4': 'Thursday', '5': 'Friday', '6': 'Saturday',
};

export async function getBusinessHours(tenantId: string): Promise<{
  configured: boolean;
  timezone: string;
  currentTime?: string;
  currentDay?: string;
  isOpenNow?: boolean;
  todayHours?: { open: string; close: string } | null;
  weeklySchedule?: Array<{ day: string; open: string; close: string }>;
  message?: string;
}> {
  const hoursJson = await settingsRepo.getEffectiveSetting(tenantId, 'business_hours', '');
  const timezone = await settingsRepo.getEffectiveSetting(tenantId, 'timezone', 'America/Lima');

  if (!hoursJson) {
    return {
      configured: false,
      timezone,
      message: 'Business hours not configured. Assume available during standard hours (9am-6pm, Mon-Sat).',
    };
  }

  const hours = JSON.parse(hoursJson);
  const now = new Date();
  const localNow = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  const currentDay = String(localNow.getDay());
  const currentTime = `${String(localNow.getHours()).padStart(2, '0')}:${String(localNow.getMinutes()).padStart(2, '0')}`;

  const todaySchedule = hours.schedule?.[currentDay] as { open: string; close: string } | undefined;
  const isOpenNow = todaySchedule
    ? currentTime >= todaySchedule.open && currentTime < todaySchedule.close
    : false;

  const schedule = Object.entries(hours.schedule || {}).map(([day, times]: [string, unknown]) => ({
    day: DAY_NAMES[day] || day,
    open: (times as { open: string }).open,
    close: (times as { close: string }).close,
  }));

  return {
    configured: true,
    timezone,
    currentTime,
    currentDay: DAY_NAMES[currentDay],
    isOpenNow,
    todayHours: todaySchedule || null,
    weeklySchedule: schedule,
  };
}

// ── Sales Analytics (moved from api-web.ts) ──

export async function getSalesAnalytics(tenantId: string, period: string): Promise<{
  total: number;
  count: number;
  avgOrderValue: number;
  change: number;
  period: string;
}> {
  const now = new Date();
  const startDate = new Date();
  if (period === 'today') {
    startDate.setHours(0, 0, 0, 0);
  } else if (period === '7d') {
    startDate.setDate(now.getDate() - 7);
  } else {
    startDate.setDate(now.getDate() - 30);
  }

  const { rows } = await query(
    `SELECT
      COALESCE(SUM(total), 0) as total_sales,
      COUNT(*) as order_count,
      COALESCE(AVG(total), 0) as avg_order_value
     FROM orders
     WHERE tenant_id = $1 AND created_at >= $2`,
    [tenantId, startDate],
  );

  const prevStart = new Date(startDate);
  prevStart.setTime(startDate.getTime() - (now.getTime() - startDate.getTime()));

  const { rows: prevRows } = await query(
    `SELECT COALESCE(SUM(total), 0) as total_sales
     FROM orders
     WHERE tenant_id = $1 AND created_at >= $2 AND created_at < $3`,
    [tenantId, prevStart, startDate],
  );

  const currentSales = parseFloat(String(rows[0]?.total_sales ?? 0));
  const prevSales = parseFloat(String(prevRows[0]?.total_sales ?? 0));
  const change = prevSales > 0 ? Math.round(((currentSales - prevSales) / prevSales) * 100) : 0;

  return {
    total: currentSales,
    count: parseInt(String(rows[0]?.order_count ?? 0)),
    avgOrderValue: parseFloat(String(rows[0]?.avg_order_value ?? 0)),
    change,
    period,
  };
}

export async function getComprehensiveAnalytics(tenantId: string, days: number): Promise<{
  totalSales: number;
  totalOrders: number;
  newCustomers: number;
  totalCustomers: number;
  conversionRate: number;
  topProducts: Array<{ id: number; name: string; category: string; sales: number; unitsSold: number }>;
  categories: Array<{ name: string; sales: number }>;
  topCustomers: Array<{ id: number; name: string; phone: string | null; orders: number; spent: number }>;
  period: { days: number; start: Date };
}> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { rows: salesRows } = await query(
    `SELECT COALESCE(SUM(total), 0) as total_sales, COUNT(*) as order_count
     FROM orders WHERE tenant_id = $1 AND created_at >= $2`,
    [tenantId, startDate],
  );

  const { rows: customerRows } = await query(
    `SELECT COUNT(*) as new_customers FROM customers WHERE tenant_id = $1 AND created_at >= $2`,
    [tenantId, startDate],
  );

  const { rows: totalCustRows } = await query(
    `SELECT COUNT(*) as total_customers FROM customers WHERE tenant_id = $1`,
    [tenantId],
  );

  const { rows: productRows } = await query<{ id: number; name: string; category: string; sales_count: string; units_sold: string; revenue: string }>(
    `SELECT p.id, p.name, p.category,
      COUNT(oi.id) as sales_count, SUM(oi.quantity) as units_sold,
      SUM(oi.quantity * oi.unit_price) as revenue
     FROM products p
     LEFT JOIN order_items oi ON oi.product_id = p.id
     LEFT JOIN orders o ON o.id = oi.order_id AND o.created_at >= $2
     WHERE p.tenant_id = $1
     GROUP BY p.id, p.name, p.category
     ORDER BY revenue DESC LIMIT 5`,
    [tenantId, startDate],
  );

  const { rows: categoryRows } = await query<{ category: string; sales: string }>(
    `SELECT p.category, SUM(oi.quantity * oi.unit_price) as sales
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     JOIN orders o ON o.id = oi.order_id
     WHERE o.tenant_id = $1 AND o.created_at >= $2
     GROUP BY p.category ORDER BY sales DESC`,
    [tenantId, startDate],
  );

  const { rows: topCustomerRows } = await query<{ id: number; name: string; phone: string | null; order_count: string; total_spent: string }>(
    `SELECT c.id, c.name, c.phone,
      COUNT(o.id) as order_count, SUM(o.total) as total_spent
     FROM customers c
     LEFT JOIN orders o ON o.customer_id = c.id AND o.created_at >= $2
     WHERE c.tenant_id = $1
     GROUP BY c.id, c.name, c.phone
     ORDER BY total_spent DESC LIMIT 10`,
    [tenantId, startDate],
  );

  const { rows: msgRows } = await query(
    `SELECT COUNT(*) as message_count FROM message_log
     WHERE tenant_id = $1 AND direction = 'incoming' AND timestamp >= $2`,
    [tenantId, startDate],
  );

  const totalOrders = parseInt(String(salesRows[0]?.order_count ?? 0));
  const totalMessages = parseInt(String(msgRows[0]?.message_count ?? 0));

  return {
    totalSales: parseFloat(String(salesRows[0]?.total_sales ?? 0)),
    totalOrders,
    newCustomers: parseInt(String(customerRows[0]?.new_customers ?? 0)),
    totalCustomers: parseInt(String(totalCustRows[0]?.total_customers ?? 0)),
    conversionRate: totalMessages > 0 ? Math.round((totalOrders / totalMessages) * 100) : 0,
    topProducts: productRows.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      sales: parseFloat(String(p.revenue ?? 0)),
      unitsSold: parseInt(String(p.units_sold ?? 0)),
    })),
    categories: categoryRows.map(c => ({
      name: c.category || 'Uncategorized',
      sales: parseFloat(String(c.sales ?? 0)),
    })),
    topCustomers: topCustomerRows.map(c => ({
      id: c.id,
      name: c.name || 'Unknown',
      phone: c.phone,
      orders: parseInt(String(c.order_count ?? 0)),
      spent: parseFloat(String(c.total_spent ?? 0)),
    })),
    period: { days, start: startDate },
  };
}
