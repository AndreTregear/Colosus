import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import * as db from './db.js';
import { chat, chatStream } from './ai.js';
import { waManager, sseBus, broadcast } from './whatsapp.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const API_KEY = process.env.API_KEY || 'yaya-dev-key';
const JWT_SECRET = process.env.JWT_SECRET || 'yaya-jwt-secret-change-me';
const YAPE_LISTENER_URL = process.env.YAPE_LISTENER_URL || 'http://localhost:3001';

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'https://biz.yaya.sh,https://app.yaya.sh').split(',').map(s => s.trim());
app.use(cors({
  origin: (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.includes(origin)) cb(null, true);
    else cb(null, false);
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.static('public'));

// ── Rate limiting ─────────────────────────────────────────────
const apiLimiter = rateLimit({ windowMs: 60_000, max: 60, standardHeaders: true, legacyHeaders: false });
app.use('/api/', apiLimiter);

// ── Auth middleware ────────────────────────────────────────────

interface AuthRequest extends express.Request<Record<string, string>> {
  userId?: string;
}

function authMiddleware(req: AuthRequest, res: express.Response, next: express.NextFunction) {
  // Accept API key
  const apiKey = req.headers['x-api-key'] as string;
  if (apiKey && apiKey === API_KEY) {
    // API key auth — use demo user or header-specified user
    req.userId = (req.headers['x-user-id'] as string) || 'usr_demo_001';
    return next();
  }

  // Accept Bearer JWT
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) {
    const token = auth.slice(7);
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
      req.userId = payload.userId;
      return next();
    } catch {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }
  }

  return res.status(401).json({ error: 'Se requiere autenticación' });
}

// ── Health ─────────────────────────────────────────────────────

app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok', service: 'yaya-api', timestamp: new Date().toISOString() });
});

// ══════════════════════════════════════════════════════════════
//  AUTH
// ══════════════════════════════════════════════════════════════

app.post('/api/v1/auth/register', async (req, res) => {
  try {
    const { email, password, business_name, business_type, phone, city } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña son requeridos' });

    const existing = db.getUserByEmail(email);
    if (existing) return res.status(409).json({ error: 'Ya existe una cuenta con ese email' });

    const id = `usr_${uuidv4().slice(0, 12)}`;
    const hash = bcrypt.hashSync(password, 10);
    db.createUser(id, email, hash, business_name || '', business_type || '', phone || '', city || '');

    const token = jwt.sign({ userId: id }, JWT_SECRET, { expiresIn: '30d' });
    const user = db.getUserById(id);
    res.status(201).json({ token, user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña son requeridos' });

    const user = db.getUserByEmail(email);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
    const profile = db.getUserById(user.id);
    res.json({ token, user: profile });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/v1/auth/refresh-token', authMiddleware, (req: AuthRequest, res) => {
  const token = jwt.sign({ userId: req.userId }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token });
});

app.get('/api/v1/auth/me', authMiddleware, (req: AuthRequest, res) => {
  const user = db.getUserById(req.userId!);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(user);
});

// ══════════════════════════════════════════════════════════════
//  AGENT CHAT
// ══════════════════════════════════════════════════════════════

app.post('/api/v1/agent/chat', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Mensaje es requerido' });

    const accept = req.headers.accept || '';

    if (accept.includes('text/event-stream')) {
      await chatStream(req.userId!, message, res);
    } else {
      const response = await chat(req.userId!, message);

      // Save messages
      db.insertAgentMessage(uuidv4(), req.userId!, 'user', message);
      db.insertAgentMessage(uuidv4(), req.userId!, 'assistant', response.content, response.metadata ? JSON.stringify(response.metadata) : undefined);

      res.json({ message: response.content, role: 'assistant' });
    }
  } catch (err: any) {
    console.error('Agent chat error:', err.message);
    res.status(500).json({ error: 'Error al procesar el mensaje' });
  }
});

app.get('/api/v1/agent/history', authMiddleware, (req: AuthRequest, res) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;
  const messages = db.getAgentMessages(req.userId!, limit, offset);
  res.json({ messages: messages.reverse(), total: messages.length });
});

// ══════════════════════════════════════════════════════════════
//  ANALYTICS
// ══════════════════════════════════════════════════════════════

function getDateRange(range: string): { start: string; end: string } {
  const now = new Date();
  const end = now.toISOString().slice(0, 10);
  let start: string;
  if (range === 'today') {
    start = end;
  } else if (range === 'week') {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    start = d.toISOString().slice(0, 10);
  } else {
    const d = new Date(now);
    d.setDate(d.getDate() - 30);
    start = d.toISOString().slice(0, 10);
  }
  return { start, end };
}

app.get('/api/v1/analytics/summary', authMiddleware, (req: AuthRequest, res) => {
  const range = (req.query.range as string) || 'month';
  const { start, end } = getDateRange(range);

  const revenue = db.getRevenueTotal(req.userId!, start, end);
  const expenses = db.getExpensesTotal(req.userId!, start, end);
  const pending = db.getPendingPaymentsTotal(req.userId!);

  // Get previous period for trends
  const periodDays = range === 'today' ? 1 : range === 'week' ? 7 : 30;
  const prevEnd = new Date(new Date(start).getTime() - 86400000).toISOString().slice(0, 10);
  const prevStart = new Date(new Date(prevEnd).getTime() - periodDays * 86400000).toISOString().slice(0, 10);
  const prevRevenue = db.getRevenueTotal(req.userId!, prevStart, prevEnd);
  const prevExpenses = db.getExpensesTotal(req.userId!, prevStart, prevEnd);

  const revenueTrend = prevRevenue.revenue > 0 ? ((revenue.revenue - prevRevenue.revenue) / prevRevenue.revenue) * 100 : 0;
  const expensesTrend = prevExpenses.total > 0 ? ((expenses.total - prevExpenses.total) / prevExpenses.total) * 100 : 0;

  res.json({
    revenue: revenue.revenue,
    expenses: expenses.total,
    profit: revenue.revenue - expenses.total,
    pending_payments: pending.total,
    pending_payments_count: pending.count,
    order_count: revenue.order_count,
    trends: {
      revenue: Math.round(revenueTrend * 10) / 10,
      expenses: Math.round(expensesTrend * 10) / 10,
    },
    range,
    period: { start, end }
  });
});

app.get('/api/v1/analytics/revenue', authMiddleware, (req: AuthRequest, res) => {
  const range = (req.query.range as string) || 'week';
  const { start, end } = getDateRange(range);
  const data = db.getRevenue(req.userId!, start, end);
  res.json({ data, range, period: { start, end } });
});

app.get('/api/v1/analytics/expenses', authMiddleware, (req: AuthRequest, res) => {
  const range = (req.query.range as string) || 'week';
  const { start, end } = getDateRange(range);
  const byCategory = db.getExpensesByCategory(req.userId!, start, end);
  const total = db.getExpensesTotal(req.userId!, start, end);
  res.json({ data: byCategory, total: total.total, range, period: { start, end } });
});

app.get('/api/v1/analytics/top-products', authMiddleware, (req: AuthRequest, res) => {
  const range = (req.query.range as string) || 'month';
  const limit = parseInt(req.query.limit as string) || 10;
  const { start, end } = getDateRange(range);
  const data = db.getTopProducts(req.userId!, start, end, limit);
  res.json({ data, range, period: { start, end } });
});

// ══════════════════════════════════════════════════════════════
//  DASHBOARD (combined summary for the app home screen)
// ══════════════════════════════════════════════════════════════

app.get('/api/v1/dashboard', authMiddleware, (req: AuthRequest, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

  const todayRevenue = db.getRevenueTotal(req.userId!, today, today);
  const weekRevenue = db.getRevenueTotal(req.userId!, weekAgo, today);
  const todayExpenses = db.getExpensesTotal(req.userId!, today, today);
  const pending = db.getPendingPaymentsTotal(req.userId!);
  const recentOrders = db.getOrders(req.userId!).slice(0, 5);
  const topProducts = db.getTopProducts(req.userId!, weekAgo, today, 5);

  res.json({
    today: {
      revenue: todayRevenue.revenue,
      expenses: todayExpenses.total,
      profit: todayRevenue.revenue - todayExpenses.total,
      orders: todayRevenue.order_count,
    },
    week: {
      revenue: weekRevenue.revenue,
      orders: weekRevenue.order_count,
    },
    pending_payments: { total: pending.total, count: pending.count },
    recent_orders: recentOrders,
    top_products: topProducts,
  });
});

// ══════════════════════════════════════════════════════════════
//  PRODUCTS
// ══════════════════════════════════════════════════════════════

app.get('/api/v1/products', authMiddleware, (req: AuthRequest, res) => {
  const products = db.getProducts(req.userId!);
  res.json({ data: products });
});

app.get('/api/v1/products/search', authMiddleware, (req: AuthRequest, res) => {
  let products = db.getProducts(req.userId!);
  const q = (req.query.q as string || '').toLowerCase();
  const category = req.query.category as string;
  const minPrice = parseFloat(req.query.min_price as string);
  const maxPrice = parseFloat(req.query.max_price as string);

  if (q) products = products.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
  if (category) products = products.filter(p => p.category === category);
  if (!isNaN(minPrice)) products = products.filter(p => p.price >= minPrice);
  if (!isNaN(maxPrice)) products = products.filter(p => p.price <= maxPrice);

  res.json({ data: products });
});

app.post('/api/v1/products', authMiddleware, (req: AuthRequest, res) => {
  const { name, description, price, category, stock } = req.body;
  if (!name || price == null) return res.status(400).json({ error: 'Nombre y precio son requeridos' });

  const id = `prod_${uuidv4().slice(0, 8)}`;
  db.createProduct(id, req.userId!, name, description || '', price, category || '', stock ?? -1);
  const product = db.getProductById(req.userId!, id);
  res.status(201).json(product);
});

app.put('/api/v1/products/:id', authMiddleware, (req: AuthRequest, res) => {
  const product = db.getProductById(req.userId!, req.params.id);
  if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

  db.updateProduct(req.params.id, req.userId!, req.body);
  const updated = db.getProductById(req.userId!, req.params.id);
  res.json(updated);
});

app.delete('/api/v1/products/:id', authMiddleware, (req: AuthRequest, res) => {
  const product = db.getProductById(req.userId!, req.params.id);
  if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

  db.deleteProduct(req.params.id, req.userId!);
  res.json({ success: true });
});

// ══════════════════════════════════════════════════════════════
//  ORDERS
// ══════════════════════════════════════════════════════════════

app.get('/api/v1/orders', authMiddleware, (req: AuthRequest, res) => {
  const status = req.query.status as string | undefined;
  const orders = db.getOrders(req.userId!, status);
  res.json({ data: orders });
});

app.get('/api/v1/orders/:id', authMiddleware, (req: AuthRequest, res) => {
  const order = db.getOrderById(req.userId!, req.params.id);
  if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });
  res.json(order);
});

app.post('/api/v1/orders', authMiddleware, (req: AuthRequest, res) => {
  const { customer_id, items, notes } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Se requiere al menos un item' });
  }

  const id = `ord_${uuidv4().slice(0, 8)}`;
  const result = db.createOrder(id, req.userId!, customer_id || null, items, notes || '');
  const order = db.getOrderById(req.userId!, id);
  res.status(201).json(order);
});

app.put('/api/v1/orders/:id/status', authMiddleware, (req: AuthRequest, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: `Estado inválido. Opciones: ${validStatuses.join(', ')}` });
  }

  const order = db.getOrderById(req.userId!, req.params.id);
  if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });

  db.updateOrderStatus(req.params.id, req.userId!, status);
  const updated = db.getOrderById(req.userId!, req.params.id);
  res.json(updated);
});

// ══════════════════════════════════════════════════════════════
//  CUSTOMERS
// ══════════════════════════════════════════════════════════════

app.get('/api/v1/customers', authMiddleware, (req: AuthRequest, res) => {
  const customers = db.getCustomers(req.userId!);
  res.json({ data: customers });
});

app.get('/api/v1/customers/:id', authMiddleware, (req: AuthRequest, res) => {
  const customer = db.getCustomerById(req.userId!, req.params.id);
  if (!customer) return res.status(404).json({ error: 'Cliente no encontrado' });

  // Include order history
  const orders = db.getOrders(req.userId!).filter((o: any) => o.customer_id === req.params.id);
  res.json({ ...customer, orders });
});

app.post('/api/v1/customers', authMiddleware, (req: AuthRequest, res) => {
  const { name, phone, email, address, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'Nombre es requerido' });

  const id = `cust_${uuidv4().slice(0, 8)}`;
  db.createCustomer(id, req.userId!, name, phone || '', email || '', address || '', notes || '');
  const customer = db.getCustomerById(req.userId!, id);
  res.status(201).json(customer);
});

// ══════════════════════════════════════════════════════════════
//  PAYMENTS
// ══════════════════════════════════════════════════════════════

app.get('/api/v1/payments/pending', authMiddleware, (req: AuthRequest, res) => {
  const payments = db.getPendingPayments(req.userId!);
  res.json({ data: payments });
});

app.get('/api/v1/payments/stats', authMiddleware, (req: AuthRequest, res) => {
  const stats = db.getPaymentStats(req.userId!);
  res.json(stats);
});

app.post('/api/v1/payments/confirm/:id', authMiddleware, (req: AuthRequest, res) => {
  db.confirmPayment(req.params.id, req.userId!, req.body.order_id);
  res.json({ success: true });
});

app.post('/api/v1/payments/:id/confirm', authMiddleware, (req: AuthRequest, res) => {
  db.confirmPayment(req.params.id, req.userId!, req.body.order_id);
  res.json({ success: true });
});

app.post('/api/v1/payments/:id/reject', authMiddleware, (req: AuthRequest, res) => {
  db.rejectPayment(req.params.id, req.userId!);
  res.json({ success: true });
});

// Yape sync endpoints (compatible with Android app and yape-listener)
app.post('/api/v1/payments/sync', authMiddleware, (req: AuthRequest, res) => {
  const { sender_name, amount, captured_at, notification_hash } = req.body;
  if (!amount || !notification_hash) return res.status(400).json({ error: 'amount y notification_hash son requeridos' });

  const id = `pay_${uuidv4().slice(0, 8)}`;
  const inserted = db.insertPayment(id, req.userId!, sender_name || '', amount, captured_at || new Date().toISOString(), notification_hash);

  if (inserted) {
    res.status(201).json({ id, status: 'pending', duplicate: false });
  } else {
    res.json({ id: null, status: 'duplicate', duplicate: true });
  }
});

app.post('/api/v1/yape/payments/sync', authMiddleware, (req: AuthRequest, res) => {
  const { sender_name, amount, captured_at, notification_hash } = req.body;
  if (!amount || !notification_hash) return res.status(400).json({ error: 'amount y notification_hash son requeridos' });

  const id = `pay_${uuidv4().slice(0, 8)}`;
  const inserted = db.insertPayment(id, req.userId!, sender_name || '', amount, captured_at || new Date().toISOString(), notification_hash);

  if (inserted) {
    res.status(201).json({ id, status: 'pending', duplicate: false });
  } else {
    res.json({ id: null, status: 'duplicate', duplicate: true });
  }
});

app.post('/api/v1/yape/payments/sync/batch', authMiddleware, (req: AuthRequest, res) => {
  const { payments } = req.body;
  if (!Array.isArray(payments)) return res.status(400).json({ error: 'Se requiere un array de payments' });

  const results = payments.map((p: any) => {
    const id = `pay_${uuidv4().slice(0, 8)}`;
    const inserted = db.insertPayment(id, req.userId!, p.sender_name || '', p.amount, p.captured_at || new Date().toISOString(), p.notification_hash);
    return { notification_hash: p.notification_hash, id: inserted ? id : null, duplicate: !inserted };
  });

  res.json({ results, synced: results.filter(r => !r.duplicate).length, duplicates: results.filter(r => r.duplicate).length });
});

// ══════════════════════════════════════════════════════════════
//  EXPENSES
// ══════════════════════════════════════════════════════════════

app.get('/api/v1/expenses', authMiddleware, (req: AuthRequest, res) => {
  const startDate = (req.query.start as string) || '2020-01-01';
  const endDate = (req.query.end as string) || new Date().toISOString().slice(0, 10);
  const expenses = db.getExpenses(req.userId!, startDate, endDate);
  res.json({ data: expenses });
});

app.post('/api/v1/expenses', authMiddleware, (req: AuthRequest, res) => {
  const { description, amount, category, date } = req.body;
  if (!amount) return res.status(400).json({ error: 'Monto es requerido' });

  const id = `exp_${uuidv4().slice(0, 8)}`;
  db.createExpense(id, req.userId!, description || '', amount, category || '', date || new Date().toISOString().slice(0, 10));
  res.status(201).json({ id, success: true });
});

// ══════════════════════════════════════════════════════════════
//  SETTINGS
// ══════════════════════════════════════════════════════════════

app.get('/api/v1/settings', authMiddleware, (req: AuthRequest, res) => {
  const settings = db.getSettings(req.userId!);
  res.json(settings);
});

app.put('/api/v1/settings', authMiddleware, (req: AuthRequest, res) => {
  for (const [key, value] of Object.entries(req.body)) {
    db.setSetting(req.userId!, key, String(value));
  }
  const settings = db.getSettings(req.userId!);
  res.json(settings);
});

// ══════════════════════════════════════════════════════════════
//  WHATSAPP
// ══════════════════════════════════════════════════════════════

app.get('/api/v1/whatsapp/status', authMiddleware, (_req: AuthRequest, res) => {
  res.json(waManager.getStatus());
});

app.post('/api/v1/whatsapp/connect', authMiddleware, async (req: AuthRequest, res) => {
  try {
    await waManager.connect(req.userId!);
    res.json({ ok: true, status: waManager.getStatus() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/v1/whatsapp/qr', authMiddleware, (_req: AuthRequest, res) => {
  const qr = waManager.getQR();
  if (qr) {
    res.json({ qr });
  } else {
    const status = waManager.getStatus();
    res.json({ qr: null, status: status.status });
  }
});

app.post('/api/v1/whatsapp/disconnect', authMiddleware, async (_req: AuthRequest, res) => {
  await waManager.disconnect();
  res.json({ ok: true });
});

app.get('/api/v1/whatsapp/messages', authMiddleware, (req: AuthRequest, res) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const messages = db.getWaMessages(req.userId!, limit);
  res.json({ data: messages.reverse() });
});

app.post('/api/v1/whatsapp/send', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { to, message } = req.body;
    if (!to || !message) return res.status(400).json({ error: 'Se requiere "to" y "message"' });

    // Normalize JID
    const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
    await waManager.sendMessage(jid, message);

    // Store outgoing message
    const msgId = `wa_${uuidv4().slice(0, 12)}`;
    db.insertWaMessage(msgId, req.userId!, jid, 'Yo', true, message, 'text');

    broadcast('wa:message', {
      id: msgId,
      remote_jid: jid,
      contact_name: 'Yo',
      from_me: true,
      content: message,
      created_at: new Date().toISOString(),
    });

    res.json({ ok: true, id: msgId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── SSE stream for real-time updates ─────────────────────────

// SSE needs query-param auth since EventSource can't send headers
app.get('/api/v1/events', (req: AuthRequest, res, next) => {
  const token = req.query.token as string;
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
      req.userId = payload.userId;
      return next();
    } catch {
      return res.status(401).json({ error: 'Token inválido' });
    }
  }
  return authMiddleware(req, res, next);
}, (req: AuthRequest, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  // Send initial status
  res.write(`data: ${JSON.stringify({ event: 'wa:status', data: waManager.getStatus() })}\n\n`);

  const handler = (payload: { event: string; data: any }) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  sseBus.on('sse', handler);

  // Heartbeat every 30s
  const heartbeat = setInterval(() => {
    res.write(`: heartbeat\n\n`);
  }, 30000);

  req.on('close', () => {
    sseBus.off('sse', handler);
    clearInterval(heartbeat);
  });
});

// ══════════════════════════════════════════════════════════════
//  START SERVER
// ══════════════════════════════════════════════════════════════

// Initialize DB on startup
db.getDb();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Yaya API running on http://0.0.0.0:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/v1/health`);
  
  // Auto-reconnect WhatsApp if we have saved auth state
  const database = db.getDb();
  const credCount = database.prepare("SELECT count(*) as c FROM wa_auth_creds").get() as any;
  if (credCount?.c > 0) {
    console.log('[WA] Found saved auth state, auto-reconnecting...');
    // Find the user ID (demo user for now)
    const user = database.prepare("SELECT id FROM users LIMIT 1").get() as any;
    if (user) {
      waManager.connect(user.id).then(() => {
        console.log('[WA] Auto-reconnect initiated');
      }).catch((err: any) => {
        console.error('[WA] Auto-reconnect failed:', err.message);
      });
    }
  }
});

export default app;
