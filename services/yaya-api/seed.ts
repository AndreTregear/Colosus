import { getDb } from './db.js';
import bcrypt from 'bcryptjs';

const db = getDb();

// Check if already seeded
const existingUser = db.prepare(`SELECT id FROM users LIMIT 1`).get();
if (existingUser) {
  console.log('Database already seeded. Skipping.');
  process.exit(0);
}

console.log('Seeding database...');

// ── Demo user ─────────────────────────────────────────────────
const userId = 'usr_demo_001';
const passwordHash = bcrypt.hashSync('yaya2024', 10);
db.prepare(`INSERT INTO users (id, email, password_hash, business_name, business_type, phone, city) VALUES (?, ?, ?, ?, ?, ?, ?)`)
  .run(userId, 'gladys@demo.com', passwordHash, 'Pollería Doña Gladys', 'restaurante', '964555123', 'Huancayo');

// ── Products ──────────────────────────────────────────────────
const products = [
  { id: 'prod_001', name: '1/4 Pollo a la Brasa', description: 'Cuarto de pollo a la brasa con papas y ensalada', price: 15, category: 'platos', stock: -1 },
  { id: 'prod_002', name: '1/2 Pollo a la Brasa', description: 'Medio pollo a la brasa con papas y ensalada', price: 28, category: 'platos', stock: -1 },
  { id: 'prod_003', name: 'Pollo Entero a la Brasa', description: 'Pollo entero a la brasa con papas y ensalada', price: 52, category: 'platos', stock: -1 },
  { id: 'prod_004', name: 'Papas Fritas', description: 'Porción de papas fritas crujientes', price: 8, category: 'extras', stock: -1 },
  { id: 'prod_005', name: 'Gaseosa Personal', description: 'Inca Kola o Coca-Cola 500ml', price: 5, category: 'bebidas', stock: 50 },
];

const insertProduct = db.prepare(`INSERT INTO products (id, user_id, name, description, price, category, stock) VALUES (?, ?, ?, ?, ?, ?, ?)`);
for (const p of products) {
  insertProduct.run(p.id, userId, p.name, p.description, p.price, p.category, p.stock);
}
console.log(`  ${products.length} products`);

// ── Customers ─────────────────────────────────────────────────
const customers = [
  { id: 'cust_001', name: 'María López', phone: '964111222', email: '', address: 'Jr. Real 456, Huancayo', notes: 'Cliente frecuente, siempre pide 1/2 pollo' },
  { id: 'cust_002', name: 'Juan Pérez', phone: '964333444', email: '', address: 'Av. Ferrocarril 789, Huancayo', notes: '' },
  { id: 'cust_003', name: 'Carmen Rojas', phone: '964555666', email: '', address: 'Jr. Ancash 123, Huancayo', notes: 'Pide para delivery los viernes' },
];

const insertCustomer = db.prepare(`INSERT INTO customers (id, user_id, name, phone, email, address, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`);
for (const c of customers) {
  insertCustomer.run(c.id, userId, c.name, c.phone, c.email, c.address, c.notes);
}
console.log(`  ${customers.length} customers`);

// ── Orders ────────────────────────────────────────────────────
const now = new Date();
const today = now.toISOString().slice(0, 10);
const yesterday = new Date(now.getTime() - 86400000).toISOString().slice(0, 10);

const insertOrder = db.prepare(`INSERT INTO orders (id, user_id, customer_id, status, total, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`);
const insertItem = db.prepare(`INSERT INTO order_items (id, order_id, product_id, product_name, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?)`);

// Order 1: paid, yesterday
insertOrder.run('ord_001', userId, 'cust_001', 'delivered', 61, 'Delivery a Jr. Real', `${yesterday}T19:30:00`);
insertItem.run('oi_001', 'ord_001', 'prod_002', '1/2 Pollo a la Brasa', 2, 28, 56);
insertItem.run('oi_002', 'ord_001', 'prod_005', 'Gaseosa Personal', 1, 5, 5);

// Order 2: pending, today
insertOrder.run('ord_002', userId, 'cust_003', 'pending', 60, 'Para recoger a las 7pm', `${today}T18:00:00`);
insertItem.run('oi_003', 'ord_002', 'prod_003', 'Pollo Entero a la Brasa', 1, 52, 52);
insertItem.run('oi_004', 'ord_002', 'prod_004', 'Papas Fritas', 1, 8, 8);

console.log('  2 orders');

// ── Payments ──────────────────────────────────────────────────
db.prepare(`INSERT INTO payments (id, user_id, sender_name, amount, status, order_id, captured_at, notification_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
  .run('pay_001', userId, 'María López', 61, 'confirmed', 'ord_001', `${yesterday}T19:35:00`, 'hash_demo_001', `${yesterday}T19:35:00`);

db.prepare(`INSERT INTO payments (id, user_id, sender_name, amount, status, order_id, captured_at, notification_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
  .run('pay_002', userId, 'Carmen Rojas', 60, 'pending', null, `${today}T18:10:00`, 'hash_demo_002', `${today}T18:10:00`);

console.log('  2 payments');

// ── Expenses ──────────────────────────────────────────────────
const expenses = [
  { id: 'exp_001', desc: 'Compra de pollos (proveedor San Fernando)', amount: 500, category: 'insumos', date: yesterday },
  { id: 'exp_002', desc: 'Gas para horno', amount: 80, category: 'servicios', date: yesterday },
  { id: 'exp_003', desc: 'Alquiler del local - Marzo', amount: 1200, category: 'alquiler', date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01` },
  { id: 'exp_004', desc: 'Bolsas y envases para delivery', amount: 45, category: 'insumos', date: today },
  { id: 'exp_005', desc: 'Sueldo ayudante de cocina', amount: 400, category: 'personal', date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-15` },
];

const insertExpense = db.prepare(`INSERT INTO expenses (id, user_id, description, amount, category, date) VALUES (?, ?, ?, ?, ?, ?)`);
for (const e of expenses) {
  insertExpense.run(e.id, userId, e.desc, e.amount, e.category, e.date);
}
console.log(`  ${expenses.length} expenses`);

// ── Agent welcome message ─────────────────────────────────────
db.prepare(`INSERT INTO agent_messages (id, user_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)`)
  .run('msg_001', userId, 'assistant', '¡Hola! Soy Yaya, tu asistente de negocio. 🐔 Estoy lista para ayudarte con tu pollería. Puedes preguntarme sobre tus ventas, pedidos, pagos, o lo que necesites. ¿En qué te ayudo?', `${today}T08:00:00`);

console.log('  1 welcome message');

// ── Settings ──────────────────────────────────────────────────
const insertSetting = db.prepare(`INSERT INTO settings (id, user_id, key, value) VALUES (?, ?, ?, ?)`);
insertSetting.run('set_001', userId, 'currency', 'PEN');
insertSetting.run('set_002', userId, 'language', 'es');
insertSetting.run('set_003', userId, 'business_hours', '11:00-22:00');
insertSetting.run('set_004', userId, 'notifications_enabled', 'true');

console.log('  4 settings');
console.log('\nSeed complete! Demo login: gladys@demo.com / yaya2024');
