/**
 * Tests for tenant-scoped repos — requires PostgreSQL.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { closePool, query } from '../src/db/pool.js';
import * as tenantsRepo from '../src/db/tenants-repo.js';
import * as productsRepo from '../src/db/products-repo.js';
import * as customersRepo from '../src/db/customers-repo.js';
import * as ordersRepo from '../src/db/orders-repo.js';
import * as settingsRepo from '../src/db/settings-repo.js';
import * as messagesRepo from '../src/db/pg-messages-repo.js';

let tenantA: string;
let tenantB: string;

beforeAll(async () => {
  // Create two test tenants
  const a = await tenantsRepo.createTenant({ name: 'Tenant A', slug: 'repo-test-a' });
  const b = await tenantsRepo.createTenant({ name: 'Tenant B', slug: 'repo-test-b' });
  tenantA = a.id;
  tenantB = b.id;
});

afterAll(async () => {
  try { await query("DELETE FROM tenants WHERE slug LIKE 'repo-test-%'"); } catch { /* PG not available */ }
  try { await closePool(); } catch { /* PG not available */ }
});

describe('products-repo tenant isolation', () => {
  it('should isolate products between tenants', async () => {
    await productsRepo.createProduct(tenantA, {
      name: 'Product A', description: '', price: 10, category: 'food',
      productType: 'physical', stock: 5, imageUrl: null, active: true,
    });
    await productsRepo.createProduct(tenantB, {
      name: 'Product B', description: '', price: 20, category: 'food',
      productType: 'physical', stock: 3, imageUrl: null, active: true,
    });

    const aProducts = await productsRepo.getAllProducts(tenantA);
    const bProducts = await productsRepo.getAllProducts(tenantB);

    expect(aProducts.map(p => p.name)).toContain('Product A');
    expect(aProducts.map(p => p.name)).not.toContain('Product B');
    expect(bProducts.map(p => p.name)).toContain('Product B');
    expect(bProducts.map(p => p.name)).not.toContain('Product A');
  });
});

describe('customers-repo', () => {
  it('should create and retrieve customer by JID', async () => {
    const customer = await customersRepo.getOrCreateCustomer(tenantA, '51999999999@s.whatsapp.net');
    expect(customer.jid).toBe('51999999999@s.whatsapp.net');
    expect(customer.tenantId).toBe(tenantA);

    // Calling again should return the same customer
    const same = await customersRepo.getOrCreateCustomer(tenantA, '51999999999@s.whatsapp.net');
    expect(same.id).toBe(customer.id);
  });

  it('should isolate customers between tenants', async () => {
    await customersRepo.getOrCreateCustomer(tenantA, '51111111111@s.whatsapp.net');
    await customersRepo.getOrCreateCustomer(tenantB, '51111111111@s.whatsapp.net');

    const aCustomers = await customersRepo.getAllCustomers(tenantA);
    const bCustomers = await customersRepo.getAllCustomers(tenantB);

    // Same JID should exist in both tenants independently
    expect(aCustomers.some(c => c.jid === '51111111111@s.whatsapp.net')).toBe(true);
    expect(bCustomers.some(c => c.jid === '51111111111@s.whatsapp.net')).toBe(true);

    // But with different IDs
    const aId = aCustomers.find(c => c.jid === '51111111111@s.whatsapp.net')!.id;
    const bId = bCustomers.find(c => c.jid === '51111111111@s.whatsapp.net')!.id;
    expect(aId).not.toBe(bId);
  });

  it('should update customer location', async () => {
    const customer = await customersRepo.updateCustomerLocation(
      tenantA, 'whatsapp', '51222222222@s.whatsapp.net', -12.0464, -77.0428, 'Lima', 'Av. Arequipa 123',
    );
    expect(customer.locationLat).toBeCloseTo(-12.0464);
    expect(customer.locationLng).toBeCloseTo(-77.0428);
    expect(customer.address).toBe('Av. Arequipa 123');
  });
});

describe('settings-repo tenant isolation', () => {
  it('should isolate settings between tenants', async () => {
    await settingsRepo.setSetting(tenantA, 'business_name', 'A Business');
    await settingsRepo.setSetting(tenantB, 'business_name', 'B Business');

    expect(await settingsRepo.getSetting(tenantA, 'business_name')).toBe('A Business');
    expect(await settingsRepo.getSetting(tenantB, 'business_name')).toBe('B Business');
  });
});

describe('pg-messages-repo', () => {
  it('should log and retrieve messages per tenant', async () => {
    const testJid = '51333333333@s.whatsapp.net';
    await messagesRepo.logMessagePg({
      tenantId: tenantA,
      channel: 'whatsapp',
      jid: testJid,
      pushName: 'Test User',
      direction: 'incoming',
      body: 'Hola',
      timestamp: new Date().toISOString(),
    });

    const { conversations: aConversations } = await messagesRepo.getConversationList(tenantA, 10, 0);
    const { conversations: bConversations } = await messagesRepo.getConversationList(tenantB, 10, 0);

    expect(aConversations.some(c => c.lastMessage === 'Hola')).toBe(true);
    expect(bConversations.some(c => c.lastMessage === 'Hola')).toBe(false);
  });

  it('should isolate messages between tenants', async () => {
    const testJidA = '51333333334@s.whatsapp.net';
    const testJidB = '51333333334@s.whatsapp.net'; // Same JID, different tenant

    await messagesRepo.logMessagePg({
      tenantId: tenantA,
      channel: 'whatsapp',
      jid: testJidA,
      pushName: 'User A',
      direction: 'incoming',
      body: 'Message from tenant A',
      timestamp: new Date().toISOString(),
    });

    await messagesRepo.logMessagePg({
      tenantId: tenantB,
      channel: 'whatsapp',
      jid: testJidB,
      pushName: 'User B',
      direction: 'incoming',
      body: 'Message from tenant B',
      timestamp: new Date().toISOString(),
    });

    const { conversations: aConversations } = await messagesRepo.getConversationList(tenantA, 10, 0);
    const { conversations: bConversations } = await messagesRepo.getConversationList(tenantB, 10, 0);

    expect(aConversations.some(c => c.lastMessage === 'Message from tenant A')).toBe(true);
    expect(aConversations.some(c => c.lastMessage === 'Message from tenant B')).toBe(false);
    expect(bConversations.some(c => c.lastMessage === 'Message from tenant B')).toBe(true);
    expect(bConversations.some(c => c.lastMessage === 'Message from tenant A')).toBe(false);
  });
});

describe('orders-repo', () => {
  it('should create an order with items transactionally', async () => {
    const product = await productsRepo.createProduct(tenantA, {
      name: 'Test Order Product', description: '', price: 15.50, category: 'test',
      productType: 'physical', stock: 10, imageUrl: null, active: true,
    });
    const customer = await customersRepo.getOrCreateCustomer(tenantA, '51444444444@s.whatsapp.net');

    const order = await ordersRepo.createOrder(
      tenantA, customer.id,
      [{ productId: product.id, quantity: 2 }],
      'delivery', 'Av. Test 456',
    );

    expect(order.total).toBeCloseTo(31.00);
    expect(order.items).toHaveLength(1);
    expect(order.items[0].quantity).toBe(2);
    expect(order.status).toBe('pending');

    // Stock should be decremented
    const updatedProduct = await productsRepo.getProductById(tenantA, product.id);
    expect(updatedProduct!.stock).toBe(8);
  });
});
