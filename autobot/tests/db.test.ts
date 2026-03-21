/**
 * Comprehensive DB module tests — requires PostgreSQL.
 * Tests row-mapper (pure logic) and all repository functions.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { closePool, query } from '../src/db/pool.js';
import { createRowMapper, mergeFields } from '../src/db/row-mapper.js';
import * as tenantsRepo from '../src/db/tenants-repo.js';
import * as productsRepo from '../src/db/products-repo.js';
import * as customersRepo from '../src/db/customers-repo.js';
import * as ordersRepo from '../src/db/orders-repo.js';
import * as settingsRepo from '../src/db/settings-repo.js';
import * as messagesRepo from '../src/db/pg-messages-repo.js';
import * as paymentsRepo from '../src/db/payments-repo.js';
import * as devicesRepo from '../src/db/devices-repo.js';
import * as yapeNotifRepo from '../src/db/yape-notifications-repo.js';
import * as tokenUsageRepo from '../src/db/token-usage-repo.js';

// --- Row Mapper (pure logic, no DB) ---

describe('db/row-mapper', () => {
  describe('createRowMapper', () => {
    it('should map simple string column renames', () => {
      const mapper = createRowMapper<{ tenantId: string }>({
        tenantId: 'tenant_id',
      });
      const result = mapper({ tenant_id: 'abc' });
      expect(result.tenantId).toBe('abc');
    });

    it('should map date columns to ISO strings', () => {
      const mapper = createRowMapper<{ createdAt: string }>({
        createdAt: { col: 'created_at', type: 'date' },
      });
      const date = new Date('2025-01-15T10:00:00Z');
      const result = mapper({ created_at: date });
      expect(result.createdAt).toBe(date.toISOString());
    });

    it('should map number columns via Number()', () => {
      const mapper = createRowMapper<{ price: number }>({
        price: { col: 'price', type: 'number' },
      });
      const result = mapper({ price: '29.99' });
      expect(result.price).toBe(29.99);
    });

    it('should map nullable numbers correctly', () => {
      const mapper = createRowMapper<{ stock: number | null }>({
        stock: { col: 'stock', type: 'number?' },
      });
      expect(mapper({ stock: '10' }).stock).toBe(10);
      expect(mapper({ stock: null }).stock).toBeNull();
    });

    it('should parse JSON columns', () => {
      const mapper = createRowMapper<{ features: Record<string, unknown> }>({
        features: { col: 'features', type: 'json', default: {} },
      });
      const result = mapper({ features: '{"key":"value"}' });
      expect(result.features).toEqual({ key: 'value' });
    });

    it('should handle corrupt JSON with default value', () => {
      const mapper = createRowMapper<{ features: Record<string, unknown> }>({
        features: { col: 'features', type: 'json', default: {} },
      });
      const result = mapper({ features: '{invalid json}' });
      expect(result.features).toEqual({});
    });

    it('should provide string defaults', () => {
      const mapper = createRowMapper<{ status: string }>({
        status: { col: 'status', type: 'string', default: 'pending' },
      });
      expect(mapper({ status: null }).status).toBe('pending');
      expect(mapper({ status: 'active' }).status).toBe('active');
    });
  });

  describe('mergeFields', () => {
    it('should keep existing values when input is undefined', () => {
      const result = mergeFields(
        { name: 'Old', price: 10 },
        {},
        ['name', 'price'],
      );
      expect(result.name).toBe('Old');
      expect(result.price).toBe(10);
    });

    it('should overwrite with input values when provided', () => {
      const result = mergeFields(
        { name: 'Old', price: 10 },
        { name: 'New' },
        ['name', 'price'],
      );
      expect(result.name).toBe('New');
      expect(result.price).toBe(10);
    });

    it('should handle empty input object', () => {
      const existing = { a: 1, b: 2 };
      const result = mergeFields(existing, {}, ['a', 'b']);
      expect(result).toEqual({ a: 1, b: 2 });
    });
  });
});

// --- Repository tests (require PostgreSQL) ---

let tenantA: string;
let tenantB: string;

beforeAll(async () => {
  const a = await tenantsRepo.createTenant({ name: 'DB Test A', slug: 'dbtest-a' });
  const b = await tenantsRepo.createTenant({ name: 'DB Test B', slug: 'dbtest-b' });
  tenantA = a.id;
  tenantB = b.id;
});

afterAll(async () => {
  try { await query("DELETE FROM tenants WHERE slug LIKE 'dbtest-%'"); } catch { /* PG not available */ }
  try { await closePool(); } catch { /* PG not available */ }
});

describe('db/tenants-repo', () => {
  it('should create a tenant with auto-generated API key', async () => {
    const tenant = await tenantsRepo.createTenant({ name: 'DB Tenant Test', slug: 'dbtest-tenant' });
    expect(tenant.apiKey).toHaveLength(64);
    expect(tenant.status).toBe('active');
    await query("DELETE FROM tenants WHERE slug = 'dbtest-tenant'");
  });

  it('should find tenant by API key', async () => {
    const t = await tenantsRepo.createTenant({ name: 'Key Test', slug: 'dbtest-key' });
    const found = await tenantsRepo.getTenantByApiKey(t.apiKey);
    expect(found).toBeDefined();
    expect(found!.id).toBe(t.id);
    await query("DELETE FROM tenants WHERE slug = 'dbtest-key'");
  });

  it('should reject duplicate slugs', async () => {
    await expect(tenantsRepo.createTenant({ name: 'Dup', slug: 'dbtest-a' })).rejects.toThrow();
  });
});

describe('db/products-repo', () => {
  it('should create and retrieve product', async () => {
    const product = await productsRepo.createProduct(tenantA, {
      name: 'DB Test Product', description: 'Desc', price: 15.50, category: 'food',
      productType: 'physical', stock: 10, imageUrl: null, active: true,
    });
    expect(product.id).toBeDefined();
    expect(product.name).toBe('DB Test Product');
    expect(product.price).toBeCloseTo(15.50);
  });

  it('should isolate products between tenants', async () => {
    await productsRepo.createProduct(tenantA, {
      name: 'Only A', description: '', price: 5, category: 'test',
      productType: 'physical', stock: 1, imageUrl: null, active: true,
    });
    const bProducts = await productsRepo.getAllProducts(tenantB);
    expect(bProducts.map(p => p.name)).not.toContain('Only A');
  });

  it('should search products by name', async () => {
    await productsRepo.createProduct(tenantA, {
      name: 'Chocolate Cake', description: '', price: 20, category: 'pastry',
      productType: 'physical', stock: 5, imageUrl: null, active: true,
    });
    const results = await productsRepo.searchProducts(tenantA, 'Chocolate');
    expect(results.some(p => p.name === 'Chocolate Cake')).toBe(true);
  });

  it('should get categories', async () => {
    const categories = await productsRepo.getCategories(tenantA);
    expect(Array.isArray(categories)).toBe(true);
  });
});

describe('db/customers-repo', () => {
  it('should create and retrieve customer by JID', async () => {
    const customer = await customersRepo.getOrCreateCustomer(tenantA, '51888888888@s.whatsapp.net');
    expect(customer.jid).toBe('51888888888@s.whatsapp.net');
    expect(customer.tenantId).toBe(tenantA);
  });

  it('should get or create customer idempotently', async () => {
    const first = await customersRepo.getOrCreateCustomer(tenantA, '51777777777@s.whatsapp.net');
    const second = await customersRepo.getOrCreateCustomer(tenantA, '51777777777@s.whatsapp.net');
    expect(first.id).toBe(second.id);
  });

  it('should update customer location', async () => {
    const customer = await customersRepo.updateCustomerLocation(
      tenantA, 'whatsapp', '51666666666@s.whatsapp.net', -12.0464, -77.0428, 'Lima', 'Av. Test 123',
    );
    expect(customer.locationLat).toBeCloseTo(-12.0464);
    expect(customer.address).toBe('Av. Test 123');
  });
});

describe('db/orders-repo', () => {
  it('should create an order with items transactionally', async () => {
    const product = await productsRepo.createProduct(tenantA, {
      name: 'Order Test Product', description: '', price: 10, category: 'test',
      productType: 'physical', stock: 20, imageUrl: null, active: true,
    });
    const customer = await customersRepo.getOrCreateCustomer(tenantA, '51555555555@s.whatsapp.net');
    const order = await ordersRepo.createOrder(
      tenantA, customer.id,
      [{ productId: product.id, quantity: 3 }],
      'delivery', 'Av. Test',
    );
    expect(order.total).toBeCloseTo(30);
    expect(order.items).toHaveLength(1);
    expect(order.status).toBe('pending');
  });

  it('should update order status', async () => {
    const product = await productsRepo.createProduct(tenantA, {
      name: 'Status Test', description: '', price: 5, category: 'test',
      productType: 'physical', stock: 10, imageUrl: null, active: true,
    });
    const customer = await customersRepo.getOrCreateCustomer(tenantA, '51444444441@s.whatsapp.net');
    const order = await ordersRepo.createOrder(tenantA, customer.id, [{ productId: product.id, quantity: 1 }], 'none');
    const updated = await ordersRepo.updateOrderStatus(tenantA, order.id, 'confirmed');
    expect(updated!.status).toBe('confirmed');
  });

  it('should get order count', async () => {
    const count = await ordersRepo.getOrderCount(tenantA);
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

describe('db/payments-repo', () => {
  it('should create pending payment', async () => {
    const product = await productsRepo.createProduct(tenantA, {
      name: 'Payment Test', description: '', price: 25, category: 'test',
      productType: 'physical', stock: 10, imageUrl: null, active: true,
    });
    const customer = await customersRepo.getOrCreateCustomer(tenantA, '51333333331@s.whatsapp.net');
    const order = await ordersRepo.createOrder(tenantA, customer.id, [{ productId: product.id, quantity: 1 }], 'none');
    const payment = await paymentsRepo.createPayment(tenantA, order.id, 25, 'yape');
    expect(payment.status).toBe('pending');
    expect(payment.amount).toBeCloseTo(25);
  });

  it('should confirm payment', async () => {
    const product = await productsRepo.createProduct(tenantA, {
      name: 'Confirm Test', description: '', price: 15, category: 'test',
      productType: 'physical', stock: 10, imageUrl: null, active: true,
    });
    const customer = await customersRepo.getOrCreateCustomer(tenantA, '51333333332@s.whatsapp.net');
    const order = await ordersRepo.createOrder(tenantA, customer.id, [{ productId: product.id, quantity: 1 }], 'none');
    const payment = await paymentsRepo.createPayment(tenantA, order.id, 15, 'yape');
    const confirmed = await paymentsRepo.confirmPayment(tenantA, payment.id, 'ref-123');
    expect(confirmed!.status).toBe('confirmed');
  });
});

describe('db/pg-messages-repo', () => {
  it('should log and retrieve messages per tenant', async () => {
    const testJid = '51111111112@s.whatsapp.net';
    await messagesRepo.logMessagePg({
      tenantId: tenantA,
      channel: 'whatsapp',
      jid: testJid,
      pushName: 'Test',
      direction: 'incoming',
      body: 'DB test message',
      timestamp: new Date().toISOString(),
    });
    const { messages } = await messagesRepo.getConversationMessages(tenantA, testJid, 10, 0);
    expect(messages.some(m => m.body === 'DB test message')).toBe(true);
  });

  it('should get conversation list with unread counts', async () => {
    const { conversations } = await messagesRepo.getConversationList(tenantA, 10, 0);
    expect(Array.isArray(conversations)).toBe(true);
  });

  it('should get message count for tenant', async () => {
    const count = await messagesRepo.getMessageCountForTenant(tenantA);
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it('should mark conversation as read', async () => {
    const testJid = '51111111113@s.whatsapp.net';
    await messagesRepo.logMessagePg({
      tenantId: tenantA,
      channel: 'whatsapp',
      jid: testJid,
      pushName: 'Test',
      direction: 'incoming',
      body: 'Test message for read tracking',
      timestamp: new Date().toISOString(),
    });
    await messagesRepo.markConversationAsRead(tenantA, testJid);
    // Verify unread count is 0 after marking as read
    const { conversations } = await messagesRepo.getConversationList(tenantA, 10, 0);
    const conv = conversations.find(c => c.jid === testJid);
    expect(conv?.unreadCount).toBe(0);
  });
});

describe('db/settings-repo', () => {
  it('should set and get setting by key', async () => {
    await settingsRepo.setSetting(tenantA, 'test_key', 'test_value');
    const val = await settingsRepo.getSetting(tenantA, 'test_key');
    expect(val).toBe('test_value');
  });

  it('should isolate settings between tenants', async () => {
    await settingsRepo.setSetting(tenantA, 'isolated_key', 'val_a');
    await settingsRepo.setSetting(tenantB, 'isolated_key', 'val_b');
    expect(await settingsRepo.getSetting(tenantA, 'isolated_key')).toBe('val_a');
    expect(await settingsRepo.getSetting(tenantB, 'isolated_key')).toBe('val_b');
  });

  it('should get effective setting with fallback chain', async () => {
    const val = await settingsRepo.getEffectiveSetting(tenantA, 'nonexistent_key', 'default_val');
    expect(val).toBe('default_val');
  });
});

describe('db/devices-repo', () => {
  it('should create device and find by token', async () => {
    const device = await devicesRepo.createDevice(tenantA, 'dev-test-1', 'Test Biz', '51999', 'token-abc');
    expect(device.token).toBe('token-abc');
    const found = await devicesRepo.getDeviceByToken('token-abc');
    expect(found).toBeDefined();
    expect(found!.deviceId).toBe('dev-test-1');
  });
});

describe('db/yape-notifications-repo', () => {
  it('should create notification and find by hash', async () => {
    const device = await devicesRepo.createDevice(tenantA, 'dev-notif-1', 'Notif Biz', '51888', 'token-notif');
    const notif = await yapeNotifRepo.createNotification(
      tenantA, device.id, 'Juan', 25.50, new Date(), 'hash-abc-123',
    );
    expect(notif.senderName).toBe('Juan');
    const found = await yapeNotifRepo.getByHash('hash-abc-123');
    expect(found).toBeDefined();
    expect(found!.amount).toBeCloseTo(25.50);
  });

  it('should get unmatched notifications', async () => {
    const unmatched = await yapeNotifRepo.getUnmatchedByTenant(tenantA);
    expect(Array.isArray(unmatched)).toBe(true);
  });
});

describe('db/token-usage-repo', () => {
  it('should record token usage', async () => {
    await tokenUsageRepo.recordTokenUsage(tenantA, 'test-model', 100, 50);
    // Should not throw
  });

  it('should get summary', async () => {
    const summary = await tokenUsageRepo.getTokenUsageSummary({});
    expect(summary).toBeDefined();
  });
});
