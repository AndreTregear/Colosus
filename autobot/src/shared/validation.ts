/**
 * Zod schemas for runtime validation of all API inputs.
 * Each schema matches the shape expected by the corresponding route handler.
 */
import { z } from 'zod';
import type { OrderStatus, ProductType, BillingCycle, ContentType } from './types.js';

// ── Reusable Primitives ──────────────────────

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

const orderStatusEnum = z.enum([
  'pending', 'confirmed', 'payment_requested', 'paid',
  'preparing', 'shipped', 'delivered', 'cancelled', 'refunded',
]) satisfies z.ZodType<OrderStatus>;

const productTypeEnum = z.enum(['physical', 'digital']) satisfies z.ZodType<ProductType>;

const billingCycleEnum = z.enum([
  'free', 'monthly', 'quarterly', 'yearly', 'weekly', 'one_time',
]) satisfies z.ZodType<BillingCycle>;

const contentTypeEnum = z.enum([
  'blog', 'newsletter', 'agent', 'general',
]) satisfies z.ZodType<ContentType>;

// ── Tenants ──────────────────────────────────

export const createTenantSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'slug must be lowercase alphanumeric with hyphens only').min(1).max(100),
  settings: z.record(z.string(), z.unknown()).optional(),
});

export const updateTenantSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});

// ── Registration ─────────────────────────────

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().max(200).optional(),
  businessName: z.string().min(1).max(200),
});

// ── Products ─────────────────────────────────

export const createProductSchema = z.object({
  name: z.string().min(1).max(300),
  description: z.string().max(2000).default(''),
  price: z.number().nonnegative().max(999999),
  category: z.string().max(100).default('general'),
  productType: productTypeEnum.default('physical'),
  stock: z.number().int().min(0).nullable().default(null),
  imageUrl: z.string().max(500).nullable().default(null),
  active: z.boolean().default(true),
});

export const updateProductSchema = createProductSchema.partial();

// ── Customers ───────────────────────────────

export const createCustomerSchema = z.object({
  name: z.string().min(1).max(300),
  phone: z.string().max(50).nullable().optional(),
  channel: z.string().max(50).default('web'),
  jid: z.string().max(255).optional(),
  address: z.string().max(500).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

// ── Orders ───────────────────────────────────

export const createOrderSchema = z.object({
  customerId: z.number().int().positive().nullable().optional(),
  items: z.array(z.object({
    productId: z.number().int().positive(),
    quantity: z.number().int().min(1),
  })).min(1),
  deliveryType: z.string().max(50).default('none'),
  deliveryAddress: z.string().max(500).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: orderStatusEnum,
});

// ── Settings ─────────────────────────────────

export const updateSettingSchema = z.object({
  value: z.union([z.string(), z.number(), z.boolean()]),
});

// ── Yape / Devices ───────────────────────────

export const deviceRegisterSchema = z.object({
  businessName: z.string().min(1),
  phoneNumber: z.string().min(1),
  deviceId: z.string().min(1),
  apiKey: z.string().min(1),
});

// ── Payment Sync ─────────────────────────────

export const paymentSyncSchema = z.object({
  senderName: z.string().min(1),
  amount: z.number().positive(),
  capturedAt: z.union([z.string().min(1), z.number().int().positive()]),
  notificationHash: z.string().min(1),
});

export const batchPaymentSyncSchema = z.object({
  payments: z.array(paymentSyncSchema).min(1).max(100),
});

// ── Subscriptions ────────────────────────────

export const subscribeSchema = z.object({
  planId: z.number().int().positive(),
});

// ── Creator Plans ────────────────────────────

export const createCreatorPlanSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  price: z.number().nonnegative(),
  billingCycle: billingCycleEnum.default('monthly'),
  contentType: contentTypeEnum.default('general'),
  features: z.record(z.string(), z.unknown()).default({}),
});

export const updateCreatorPlanSchema = createCreatorPlanSchema.partial();

// ── Customer Subscriptions ───────────────────

export const createCustomerSubscriptionSchema = z.object({
  customerId: z.number().int().positive(),
  planId: z.number().int().positive(),
});

// ── Mobile Auth ──────────────────────────────

export const mobileRegisterSchema = z.object({
  phone: z.string().min(8).max(20).regex(/^\+\d{7,15}$/, 'Phone must be in E.164 format (e.g., +51999888777)'),
  password: z.string().min(8).max(128),
  businessName: z.string().min(1).max(200),
  name: z.string().max(200).optional(),
  email: z.string().email().optional(),
});

export const mobileLoginSchema = z.object({
  phone: z.string().min(8).max(20).regex(/^\+\d{7,15}$/),
  password: z.string().min(1).max(128),
});

// ── Platform Plans (Admin) ───────────────────

export const createPlatformPlanSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().regex(/^[a-z0-9-]+$/).min(1),
  description: z.string().nullable().optional(),
  price: z.number().nonnegative(),
  billingCycle: billingCycleEnum,
  features: z.record(z.string(), z.unknown()).default({}),
  limits: z.record(z.string(), z.unknown()).default({}),
  sortOrder: z.number().int().default(0),
});

export const updatePlatformPlanSchema = createPlatformPlanSchema.partial();
