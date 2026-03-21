/**
 * Tests for the Shared module — validation schemas and event bus.
 */
import { describe, it, expect } from 'vitest';
import {
  createProductSchema,
  updateProductSchema,
  registerSchema,
  paymentSyncSchema,
  batchPaymentSyncSchema,
  createTenantSchema,
  updateTenantSchema,
  updateOrderStatusSchema,
  updateSettingSchema,
  deviceRegisterSchema,
  subscribeSchema,
  createCreatorPlanSchema,
  createCustomerSubscriptionSchema,
  createPlatformPlanSchema,
  paginationSchema,
} from '../src/shared/validation.js';
import { appBus } from '../src/shared/events.js';

// --- Validation Schemas ---

describe('shared/validation', () => {
  describe('paginationSchema', () => {
    it('should accept valid pagination', () => {
      const result = paginationSchema.safeParse({ limit: '25', offset: '10' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(25);
        expect(result.data.offset).toBe(10);
      }
    });

    it('should use defaults when not provided', () => {
      const result = paginationSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
        expect(result.data.offset).toBe(0);
      }
    });

    it('should clamp limit to max 200', () => {
      const result = paginationSchema.safeParse({ limit: '500' });
      expect(result.success).toBe(false);
    });

    it('should reject negative offset', () => {
      const result = paginationSchema.safeParse({ offset: '-1' });
      expect(result.success).toBe(false);
    });
  });

  describe('createProductSchema', () => {
    it('should accept valid product input', () => {
      const result = createProductSchema.safeParse({
        name: 'Test Product',
        price: 29.99,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Test Product');
        expect(result.data.price).toBe(29.99);
        expect(result.data.category).toBe('general');
        expect(result.data.productType).toBe('physical');
        expect(result.data.active).toBe(true);
      }
    });

    it('should reject missing name', () => {
      const result = createProductSchema.safeParse({ price: 10 });
      expect(result.success).toBe(false);
    });

    it('should reject negative price', () => {
      const result = createProductSchema.safeParse({ name: 'Test', price: -5 });
      expect(result.success).toBe(false);
    });

    it('should default category to general', () => {
      const result = createProductSchema.safeParse({ name: 'Test', price: 10 });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.category).toBe('general');
    });

    it('should validate productType enum', () => {
      const result = createProductSchema.safeParse({
        name: 'Test', price: 10, productType: 'invalid',
      });
      expect(result.success).toBe(false);
    });

    it('should accept null stock', () => {
      const result = createProductSchema.safeParse({
        name: 'Test', price: 10, stock: null,
      });
      expect(result.success).toBe(true);
    });

    it('should reject negative stock', () => {
      const result = createProductSchema.safeParse({
        name: 'Test', price: 10, stock: -1,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateProductSchema', () => {
    it('should accept partial updates', () => {
      const result = updateProductSchema.safeParse({ price: 19.99 });
      expect(result.success).toBe(true);
    });

    it('should accept empty object', () => {
      const result = updateProductSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('registerSchema', () => {
    it('should accept valid registration', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'secure123',
        businessName: 'Mi Tienda',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = registerSchema.safeParse({
        email: 'not-an-email',
        password: 'secure123',
        businessName: 'Test',
      });
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'short',
        businessName: 'Test',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing businessName', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'secure123',
      });
      expect(result.success).toBe(false);
    });

    it('should allow optional name', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'secure123',
        businessName: 'Test',
        name: 'Juan',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('paymentSyncSchema', () => {
    it('should accept valid sync data', () => {
      const result = paymentSyncSchema.safeParse({
        senderName: 'Juan Perez',
        amount: 25.50,
        capturedAt: '2025-01-15T10:00:00Z',
        notificationHash: 'abc123',
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing senderName', () => {
      const result = paymentSyncSchema.safeParse({
        amount: 25.50,
        capturedAt: '2025-01-15T10:00:00Z',
        notificationHash: 'abc123',
      });
      expect(result.success).toBe(false);
    });

    it('should reject negative amount', () => {
      const result = paymentSyncSchema.safeParse({
        senderName: 'Test',
        amount: -10,
        capturedAt: '2025-01-15T10:00:00Z',
        notificationHash: 'abc',
      });
      expect(result.success).toBe(false);
    });

    it('should reject zero amount', () => {
      const result = paymentSyncSchema.safeParse({
        senderName: 'Test',
        amount: 0,
        capturedAt: '2025-01-15T10:00:00Z',
        notificationHash: 'abc',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('batchPaymentSyncSchema', () => {
    it('should accept valid batch', () => {
      const result = batchPaymentSyncSchema.safeParse({
        payments: [
          { senderName: 'A', amount: 10, capturedAt: '2025-01-15T10:00:00Z', notificationHash: 'h1' },
          { senderName: 'B', amount: 20, capturedAt: '2025-01-15T11:00:00Z', notificationHash: 'h2' },
        ],
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty payments array', () => {
      const result = batchPaymentSyncSchema.safeParse({ payments: [] });
      expect(result.success).toBe(false);
    });
  });

  describe('createTenantSchema', () => {
    it('should accept valid tenant', () => {
      const result = createTenantSchema.safeParse({
        name: 'My Store',
        slug: 'my-store',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid slug characters', () => {
      const result = createTenantSchema.safeParse({
        name: 'Test',
        slug: 'My Store!',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing name', () => {
      const result = createTenantSchema.safeParse({ slug: 'test' });
      expect(result.success).toBe(false);
    });
  });

  describe('updateOrderStatusSchema', () => {
    it('should accept valid order status', () => {
      for (const status of ['pending', 'confirmed', 'paid', 'cancelled']) {
        const result = updateOrderStatusSchema.safeParse({ status });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid status', () => {
      const result = updateOrderStatusSchema.safeParse({ status: 'invalid' });
      expect(result.success).toBe(false);
    });
  });

  describe('updateSettingSchema', () => {
    it('should accept string value', () => {
      expect(updateSettingSchema.safeParse({ value: 'hello' }).success).toBe(true);
    });

    it('should accept number value', () => {
      expect(updateSettingSchema.safeParse({ value: 42 }).success).toBe(true);
    });

    it('should accept boolean value', () => {
      expect(updateSettingSchema.safeParse({ value: true }).success).toBe(true);
    });

    it('should reject null value', () => {
      expect(updateSettingSchema.safeParse({ value: null }).success).toBe(false);
    });
  });

  describe('deviceRegisterSchema', () => {
    it('should accept valid device registration', () => {
      const result = deviceRegisterSchema.safeParse({
        businessName: 'Mi Tienda',
        phoneNumber: '51999999999',
        deviceId: 'device-abc-123',
        apiKey: 'key-xyz',
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing fields', () => {
      expect(deviceRegisterSchema.safeParse({ businessName: 'Test' }).success).toBe(false);
    });
  });

  describe('subscribeSchema', () => {
    it('should accept valid planId', () => {
      expect(subscribeSchema.safeParse({ planId: 1 }).success).toBe(true);
    });

    it('should reject non-positive planId', () => {
      expect(subscribeSchema.safeParse({ planId: 0 }).success).toBe(false);
      expect(subscribeSchema.safeParse({ planId: -1 }).success).toBe(false);
    });
  });

  describe('createCreatorPlanSchema', () => {
    it('should accept valid plan', () => {
      const result = createCreatorPlanSchema.safeParse({
        name: 'Premium',
        price: 9.99,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.billingCycle).toBe('monthly');
        expect(result.data.contentType).toBe('general');
      }
    });

    it('should reject missing name', () => {
      expect(createCreatorPlanSchema.safeParse({ price: 10 }).success).toBe(false);
    });
  });

  describe('createCustomerSubscriptionSchema', () => {
    it('should accept valid subscription', () => {
      const result = createCustomerSubscriptionSchema.safeParse({
        customerId: 1,
        planId: 2,
      });
      expect(result.success).toBe(true);
    });

    it('should reject non-positive IDs', () => {
      expect(createCustomerSubscriptionSchema.safeParse({
        customerId: 0, planId: 1,
      }).success).toBe(false);
    });
  });

  describe('createPlatformPlanSchema', () => {
    it('should accept valid platform plan', () => {
      const result = createPlatformPlanSchema.safeParse({
        name: 'Pro',
        slug: 'pro',
        price: 29.99,
        billingCycle: 'monthly',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid billingCycle', () => {
      expect(createPlatformPlanSchema.safeParse({
        name: 'Pro', slug: 'pro', price: 10, billingCycle: 'biweekly',
      }).success).toBe(false);
    });
  });
});

// --- Event Bus ---

describe('shared/events', () => {
  describe('appBus', () => {
    it('should emit and receive qr events', () =>
      new Promise<void>((resolve) => {
        appBus.on('qr', (tenantId, dataUrl) => {
          expect(tenantId).toBe('t1');
          expect(dataUrl).toBe('data:image/png;base64,...');
          resolve();
        });
        appBus.emit('qr', 't1', 'data:image/png;base64,...');
      }));

    it('should emit and receive connection-update events', () =>
      new Promise<void>((resolve) => {
        appBus.on('connection-update', (tenantId, state) => {
          expect(tenantId).toBe('t2');
          expect(state).toBe('open');
          resolve();
        });
        appBus.emit('connection-update', 't2', 'open');
      }));

    it('should emit and receive ai-job-enqueued events', () =>
      new Promise<void>((resolve) => {
        appBus.on('ai-job-enqueued', (tenantId, jid) => {
          expect(tenantId).toBe('t3');
          expect(jid).toBe('51999@s.whatsapp.net');
          resolve();
        });
        appBus.emit('ai-job-enqueued', 't3', '51999@s.whatsapp.net');
      }));

    it('should emit and receive yape-payment-synced events', () =>
      new Promise<void>((resolve) => {
        appBus.on('yape-payment-synced', (tenantId, notificationId) => {
          expect(tenantId).toBe('t4');
          expect(notificationId).toBe(42);
          resolve();
        });
        appBus.emit('yape-payment-synced', 't4', 42);
      }));
  });
});
