import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = process.env.DB_PATH || './data/yaya.db';

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  const dbPath = path.resolve(DB_PATH);
  _db = new Database(dbPath);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');

  initSchema(_db);
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      business_name TEXT NOT NULL DEFAULT '',
      business_type TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      city TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      price REAL NOT NULL,
      category TEXT NOT NULL DEFAULT '',
      image_url TEXT NOT NULL DEFAULT '',
      stock INTEGER NOT NULL DEFAULT -1,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      customer_id TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      total REAL NOT NULL DEFAULT 0,
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_id TEXT,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL,
      subtotal REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT '',
      sender_name TEXT NOT NULL DEFAULT '',
      amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      order_id TEXT,
      captured_at TEXT,
      notification_hash TEXT UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL DEFAULT '',
      date TEXT NOT NULL DEFAULT (date('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS agent_messages (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      metadata TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL DEFAULT '',
      UNIQUE(user_id, key),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_products_user ON products(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
    CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
    CREATE INDEX IF NOT EXISTS idx_expenses_user ON expenses(user_id);
    CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
    CREATE INDEX IF NOT EXISTS idx_agent_messages_user ON agent_messages(user_id);
    CREATE INDEX IF NOT EXISTS idx_customers_user ON customers(user_id);
    CREATE INDEX IF NOT EXISTS idx_settings_user ON settings(user_id);

    -- WhatsApp auth state (Baileys)
    CREATE TABLE IF NOT EXISTS wa_auth_creds (
      user_id TEXT PRIMARY KEY,
      creds TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS wa_auth_keys (
      user_id TEXT NOT NULL,
      key_type TEXT NOT NULL,
      key_id TEXT NOT NULL,
      key_data TEXT NOT NULL,
      PRIMARY KEY (user_id, key_type, key_id)
    );

    -- WhatsApp messages
    CREATE TABLE IF NOT EXISTS wa_messages (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      remote_jid TEXT NOT NULL,
      contact_name TEXT NOT NULL DEFAULT '',
      from_me INTEGER NOT NULL DEFAULT 0,
      content TEXT NOT NULL DEFAULT '',
      msg_type TEXT NOT NULL DEFAULT 'text',
      ai_response TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_wa_messages_user ON wa_messages(user_id);
    CREATE INDEX IF NOT EXISTS idx_wa_messages_jid ON wa_messages(remote_jid);
  `);
}

// ── User queries ──────────────────────────────────────────────

export function createUser(id: string, email: string, passwordHash: string, businessName: string, businessType: string, phone: string, city: string) {
  const db = getDb();
  db.prepare(`INSERT INTO users (id, email, password_hash, business_name, business_type, phone, city) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(id, email, passwordHash, businessName, businessType, phone, city);
}

export function getUserByEmail(email: string) {
  return getDb().prepare(`SELECT * FROM users WHERE email = ?`).get(email) as any;
}

export function getUserById(id: string) {
  return getDb().prepare(`SELECT id, email, business_name, business_type, phone, city, created_at FROM users WHERE id = ?`).get(id) as any;
}

// ── Product queries ───────────────────────────────────────────

export function getProducts(userId: string) {
  return getDb().prepare(`SELECT * FROM products WHERE user_id = ? AND active = 1 ORDER BY name`).all(userId) as any[];
}

export function getProductById(userId: string, id: string) {
  return getDb().prepare(`SELECT * FROM products WHERE id = ? AND user_id = ?`).get(id, userId) as any;
}

export function createProduct(id: string, userId: string, name: string, description: string, price: number, category: string, stock: number) {
  getDb().prepare(`INSERT INTO products (id, user_id, name, description, price, category, stock) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(id, userId, name, description, price, category, stock);
}

export function updateProduct(id: string, userId: string, fields: Record<string, any>) {
  const sets: string[] = [];
  const values: any[] = [];
  for (const [k, v] of Object.entries(fields)) {
    if (['name', 'description', 'price', 'category', 'image_url', 'stock', 'active'].includes(k)) {
      sets.push(`${k} = ?`);
      values.push(v);
    }
  }
  if (sets.length === 0) return;
  sets.push(`updated_at = datetime('now')`);
  values.push(id, userId);
  getDb().prepare(`UPDATE products SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`).run(...values);
}

export function deleteProduct(id: string, userId: string) {
  getDb().prepare(`UPDATE products SET active = 0, updated_at = datetime('now') WHERE id = ? AND user_id = ?`).run(id, userId);
}

// ── Customer queries ──────────────────────────────────────────

export function getCustomers(userId: string) {
  return getDb().prepare(`SELECT * FROM customers WHERE user_id = ? ORDER BY name`).all(userId) as any[];
}

export function getCustomerById(userId: string, id: string) {
  return getDb().prepare(`SELECT * FROM customers WHERE id = ? AND user_id = ?`).get(id, userId) as any;
}

export function createCustomer(id: string, userId: string, name: string, phone: string, email: string, address: string, notes: string) {
  getDb().prepare(`INSERT INTO customers (id, user_id, name, phone, email, address, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(id, userId, name, phone, email, address, notes);
}

// ── Order queries ─────────────────────────────────────────────

export function getOrders(userId: string, status?: string) {
  if (status) {
    return getDb().prepare(`SELECT o.*, c.name as customer_name FROM orders o LEFT JOIN customers c ON o.customer_id = c.id WHERE o.user_id = ? AND o.status = ? ORDER BY o.created_at DESC`).all(userId, status) as any[];
  }
  return getDb().prepare(`SELECT o.*, c.name as customer_name FROM orders o LEFT JOIN customers c ON o.customer_id = c.id WHERE o.user_id = ? ORDER BY o.created_at DESC`).all(userId) as any[];
}

export function getOrderById(userId: string, id: string) {
  const order = getDb().prepare(`SELECT o.*, c.name as customer_name FROM orders o LEFT JOIN customers c ON o.customer_id = c.id WHERE o.id = ? AND o.user_id = ?`).get(id, userId) as any;
  if (!order) return null;
  order.items = getDb().prepare(`SELECT * FROM order_items WHERE order_id = ?`).all(id) as any[];
  return order;
}

export function createOrder(id: string, userId: string, customerId: string | null, items: Array<{product_id?: string; product_name: string; quantity: number; unit_price: number}>, notes: string) {
  const db = getDb();
  const total = items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);

  const insertOrder = db.prepare(`INSERT INTO orders (id, user_id, customer_id, total, notes) VALUES (?, ?, ?, ?, ?)`);
  const insertItem = db.prepare(`INSERT INTO order_items (id, order_id, product_id, product_name, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?)`);

  const tx = db.transaction(() => {
    insertOrder.run(id, userId, customerId, total, notes);
    for (const item of items) {
      const itemId = crypto.randomUUID();
      insertItem.run(itemId, id, item.product_id || null, item.product_name, item.quantity, item.unit_price, item.quantity * item.unit_price);
    }
  });
  tx();
  return { id, total };
}

export function updateOrderStatus(id: string, userId: string, status: string) {
  getDb().prepare(`UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?`).run(status, id, userId);
}

// ── Payment queries ───────────────────────────────────────────

export function getPendingPayments(userId: string) {
  return getDb().prepare(`SELECT * FROM payments WHERE user_id = ? AND status = 'pending' ORDER BY created_at DESC`).all(userId) as any[];
}

export function confirmPayment(id: string, userId: string, orderId?: string) {
  getDb().prepare(`UPDATE payments SET status = 'confirmed', order_id = COALESCE(?, order_id) WHERE id = ? AND user_id = ?`).run(orderId || null, id, userId);
}

export function rejectPayment(id: string, userId: string) {
  getDb().prepare(`UPDATE payments SET status = 'rejected' WHERE id = ? AND user_id = ?`).run(id, userId);
}

export function insertPayment(id: string, userId: string, senderName: string, amount: number, capturedAt: string, notificationHash: string) {
  try {
    getDb().prepare(`INSERT INTO payments (id, user_id, sender_name, amount, captured_at, notification_hash) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(id, userId, senderName, amount, capturedAt, notificationHash);
    return true;
  } catch {
    return false; // duplicate hash
  }
}

export function getPaymentStats(userId: string) {
  const today = new Date().toISOString().slice(0, 10);
  return getDb().prepare(`
    SELECT
      COALESCE(SUM(amount), 0) as total_received,
      COUNT(*) as count,
      COALESCE(SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END), 0) as confirmed,
      COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) as pending
    FROM payments WHERE user_id = ? AND date(created_at) = ?
  `).get(userId, today) as any;
}

// ── Expense queries ───────────────────────────────────────────

export function getExpenses(userId: string, startDate: string, endDate: string) {
  return getDb().prepare(`SELECT * FROM expenses WHERE user_id = ? AND date >= ? AND date <= ? ORDER BY date DESC`).all(userId, startDate, endDate) as any[];
}

export function getExpensesByCategory(userId: string, startDate: string, endDate: string) {
  return getDb().prepare(`
    SELECT category, SUM(amount) as total, COUNT(*) as count
    FROM expenses WHERE user_id = ? AND date >= ? AND date <= ?
    GROUP BY category ORDER BY total DESC
  `).all(userId, startDate, endDate) as any[];
}

export function createExpense(id: string, userId: string, description: string, amount: number, category: string, date: string) {
  getDb().prepare(`INSERT INTO expenses (id, user_id, description, amount, category, date) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(id, userId, description, amount, category, date);
}

// ── Analytics queries ─────────────────────────────────────────

export function getRevenue(userId: string, startDate: string, endDate: string) {
  return getDb().prepare(`
    SELECT date(created_at) as date, SUM(total) as revenue, COUNT(*) as order_count
    FROM orders WHERE user_id = ? AND date(created_at) >= ? AND date(created_at) <= ?
      AND status NOT IN ('cancelled')
    GROUP BY date(created_at) ORDER BY date
  `).all(userId, startDate, endDate) as any[];
}

export function getRevenueTotal(userId: string, startDate: string, endDate: string) {
  return getDb().prepare(`
    SELECT COALESCE(SUM(total), 0) as revenue, COUNT(*) as order_count
    FROM orders WHERE user_id = ? AND date(created_at) >= ? AND date(created_at) <= ?
      AND status NOT IN ('cancelled')
  `).get(userId, startDate, endDate) as any;
}

export function getExpensesTotal(userId: string, startDate: string, endDate: string) {
  return getDb().prepare(`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM expenses WHERE user_id = ? AND date >= ? AND date <= ?
  `).get(userId, startDate, endDate) as any;
}

export function getPendingPaymentsTotal(userId: string) {
  return getDb().prepare(`
    SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count
    FROM payments WHERE user_id = ? AND status = 'pending'
  `).get(userId) as any;
}

export function getTopProducts(userId: string, startDate: string, endDate: string, limit: number) {
  return getDb().prepare(`
    SELECT oi.product_name, SUM(oi.quantity) as total_sold, SUM(oi.subtotal) as total_revenue
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE o.user_id = ? AND date(o.created_at) >= ? AND date(o.created_at) <= ?
      AND o.status NOT IN ('cancelled')
    GROUP BY oi.product_name ORDER BY total_revenue DESC LIMIT ?
  `).all(userId, startDate, endDate, limit) as any[];
}

// ── Agent message queries ─────────────────────────────────────

export function getAgentMessages(userId: string, limit: number, offset: number) {
  return getDb().prepare(`SELECT * FROM agent_messages WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(userId, limit, offset) as any[];
}

export function insertAgentMessage(id: string, userId: string, role: string, content: string, metadata?: string) {
  getDb().prepare(`INSERT INTO agent_messages (id, user_id, role, content, metadata) VALUES (?, ?, ?, ?, ?)`)
    .run(id, userId, role, content, metadata || null);
}

// ── Settings queries ──────────────────────────────────────────

export function getSettings(userId: string) {
  const rows = getDb().prepare(`SELECT key, value FROM settings WHERE user_id = ?`).all(userId) as any[];
  const obj: Record<string, string> = {};
  for (const r of rows) obj[r.key] = r.value;
  return obj;
}

export function setSetting(userId: string, key: string, value: string) {
  getDb().prepare(`INSERT INTO settings (id, user_id, key, value) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value`)
    .run(crypto.randomUUID(), userId, key, value);
}

// ── WhatsApp auth state queries ─────────────────────────────

export function getWaAuthCreds(userId: string) {
  return getDb().prepare(`SELECT creds FROM wa_auth_creds WHERE user_id = ?`).get(userId) as any;
}

export function upsertWaAuthCreds(userId: string, creds: string) {
  getDb().prepare(`INSERT INTO wa_auth_creds (user_id, creds) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET creds = excluded.creds, updated_at = datetime('now')`)
    .run(userId, creds);
}

export function getWaAuthKeys(userId: string, keyType: string, keyIds: string[]) {
  if (keyIds.length === 0) return [];
  const placeholders = keyIds.map(() => '?').join(', ');
  return getDb().prepare(`SELECT key_id, key_data FROM wa_auth_keys WHERE user_id = ? AND key_type = ? AND key_id IN (${placeholders})`)
    .all(userId, keyType, ...keyIds) as any[];
}

export function upsertWaAuthKey(userId: string, keyType: string, keyId: string, keyData: string) {
  getDb().prepare(`INSERT INTO wa_auth_keys (user_id, key_type, key_id, key_data) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, key_type, key_id) DO UPDATE SET key_data = excluded.key_data`)
    .run(userId, keyType, keyId, keyData);
}

export function deleteWaAuthKey(userId: string, keyType: string, keyId: string) {
  getDb().prepare(`DELETE FROM wa_auth_keys WHERE user_id = ? AND key_type = ? AND key_id = ?`).run(userId, keyType, keyId);
}

export function clearWaAuth(userId: string) {
  const db = getDb();
  db.prepare(`DELETE FROM wa_auth_creds WHERE user_id = ?`).run(userId);
  db.prepare(`DELETE FROM wa_auth_keys WHERE user_id = ?`).run(userId);
}

// ── WhatsApp message queries ────────────────────────────────

export function insertWaMessage(id: string, userId: string, remoteJid: string, contactName: string, fromMe: boolean, content: string, msgType: string, aiResponse?: string) {
  getDb().prepare(`INSERT INTO wa_messages (id, user_id, remote_jid, contact_name, from_me, content, msg_type, ai_response) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(id, userId, remoteJid, contactName, fromMe ? 1 : 0, content, msgType, aiResponse || null);
}

export function getWaMessages(userId: string, limit: number = 50) {
  return getDb().prepare(`SELECT * FROM wa_messages WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`).all(userId, limit) as any[];
}
