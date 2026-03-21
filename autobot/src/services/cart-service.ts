import { getRedisConnection } from '../queue/redis.js';
import * as productsRepo from '../db/products-repo.js';
import * as customersRepo from '../db/customers-repo.js';
import { ServiceError } from './errors.js';
import type { Product } from '../shared/types.js';

const CART_TTL = 86400; // 24 hours

export interface CartItem {
  productId: number;
  quantity: number;
  addedAt: string;
}

export interface CartItemWithProduct extends CartItem {
  productName: string;
  unitPrice: number;
  subtotal: number;
}

function cartKey(tenantId: string, jid: string): string {
  return `cart:${tenantId}:${jid}`;
}

export async function getCart(tenantId: string, jid: string): Promise<CartItem[]> {
  const redis = getRedisConnection();
  const raw = await redis.get(cartKey(tenantId, jid));
  if (!raw) return [];
  try {
    return JSON.parse(raw) as CartItem[];
  } catch {
    return [];
  }
}

async function saveCart(tenantId: string, jid: string, items: CartItem[]): Promise<void> {
  const redis = getRedisConnection();
  const key = cartKey(tenantId, jid);
  if (items.length === 0) {
    await redis.del(key);
  } else {
    await redis.set(key, JSON.stringify(items), 'EX', CART_TTL);
  }
}

// Lua script for atomic cart add — prevents race conditions on concurrent messages
const ADD_ITEM_LUA = `
local key = KEYS[1]
local productId = tonumber(ARGV[1])
local quantity = tonumber(ARGV[2])
local addedAt = ARGV[3]
local ttl = tonumber(ARGV[4])

local raw = redis.call('GET', key)
local cart = {}
if raw then
  cart = cjson.decode(raw)
end

local found = false
for i, item in ipairs(cart) do
  if item.productId == productId then
    cart[i].quantity = item.quantity + quantity
    found = true
    break
  end
end

if not found then
  table.insert(cart, { productId = productId, quantity = quantity, addedAt = addedAt })
end

local encoded = cjson.encode(cart)
redis.call('SET', key, encoded, 'EX', ttl)
return encoded
`;

export async function addItem(
  tenantId: string,
  jid: string,
  productId: number,
  quantity: number,
): Promise<CartItem[]> {
  const product = await productsRepo.getProductById(tenantId, productId);
  if (!product) throw new ServiceError(`Product #${productId} not found`, 'PRODUCT_NOT_FOUND', 404);
  if (!product.active) throw new ServiceError(`Product "${product.name}" is not available`, 'PRODUCT_INACTIVE');

  const redis = getRedisConnection();
  const key = cartKey(tenantId, jid);
  const result = await redis.eval(
    ADD_ITEM_LUA, 1, key,
    productId, quantity, new Date().toISOString(), CART_TTL,
  ) as string;

  return JSON.parse(result) as CartItem[];
}

export async function removeItem(tenantId: string, jid: string, productId: number): Promise<CartItem[]> {
  const cart = await getCart(tenantId, jid);
  const filtered = cart.filter(i => i.productId !== productId);
  await saveCart(tenantId, jid, filtered);
  return filtered;
}

export async function updateQuantity(
  tenantId: string,
  jid: string,
  productId: number,
  quantity: number,
): Promise<CartItem[]> {
  const cart = await getCart(tenantId, jid);
  const item = cart.find(i => i.productId === productId);
  if (!item) throw new ServiceError('Item not in cart', 'NOT_IN_CART', 404);

  if (quantity <= 0) {
    return removeItem(tenantId, jid, productId);
  }

  item.quantity = quantity;
  await saveCart(tenantId, jid, cart);
  return cart;
}

export async function clearCart(tenantId: string, jid: string): Promise<void> {
  const redis = getRedisConnection();
  await redis.del(cartKey(tenantId, jid));
}

export async function getCartTotal(tenantId: string, jid: string): Promise<{
  items: CartItemWithProduct[];
  removedItems: Array<{ productId: number }>;
  total: number;
}> {
  const cart = await getCart(tenantId, jid);
  if (cart.length === 0) return { items: [], removedItems: [], total: 0 };

  const items: CartItemWithProduct[] = [];
  const removedItems: Array<{ productId: number }> = [];
  let total = 0;

  for (const item of cart) {
    const product = await productsRepo.getProductById(tenantId, item.productId);
    if (!product || !product.active) {
      removedItems.push({ productId: item.productId });
      continue;
    }

    const subtotal = product.price * item.quantity;
    total += subtotal;
    items.push({
      ...item,
      productName: product.name,
      unitPrice: product.price,
      subtotal,
    });
  }

  // Clean up unavailable items from the persisted cart
  if (removedItems.length > 0) {
    const validItems = cart.filter(i => !removedItems.some(r => r.productId === i.productId));
    await saveCart(tenantId, jid, validItems);
  }

  return { items, removedItems, total };
}

export async function convertCartToOrder(
  tenantId: string,
  jid: string,
  channel: string,
  deliveryType: string,
  deliveryAddress?: string,
  notes?: string,
): Promise<{ orderId: number; total: number; items: Array<{ productName: string; quantity: number; unitPrice: number }> }> {
  const cart = await getCart(tenantId, jid);
  if (cart.length === 0) throw new ServiceError('Cart is empty', 'CART_EMPTY');

  const customer = await customersRepo.getOrCreateCustomer(tenantId, jid, channel);

  // Import lazily to avoid circular deps
  const orderSvc = await import('./order-service.js');
  const order = await orderSvc.createOrder(
    tenantId,
    customer.id,
    cart.map(i => ({ productId: i.productId, quantity: i.quantity })),
    deliveryType,
    deliveryAddress ?? customer.address ?? undefined,
    notes,
  );

  await clearCart(tenantId, jid);

  return {
    orderId: order.id,
    total: order.total,
    items: order.items?.map(i => ({
      productName: i.productName,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
    })) ?? [],
  };
}
