/**
 * Extended tests for shared/validation.ts — mobile auth schemas and edge cases
 * not covered by the existing shared.test.ts.
 */
import { describe, it, expect } from 'vitest';
import {
  mobileRegisterSchema,
  mobileLoginSchema,
  createOrderSchema,
  createCustomerSchema,
  updateTenantSchema,
  updateCreatorPlanSchema,
  updatePlatformPlanSchema,
} from '../src/shared/validation.js';

describe('mobileRegisterSchema', () => {
  it('should accept valid E.164 phone', () => {
    const result = mobileRegisterSchema.safeParse({
      phone: '+51987654321',
      password: 'secure12345',
      businessName: 'Mi Tienda',
    });
    expect(result.success).toBe(true);
  });

  it('should reject phone without + prefix', () => {
    const result = mobileRegisterSchema.safeParse({
      phone: '51987654321',
      password: 'secure12345',
      businessName: 'Test',
    });
    expect(result.success).toBe(false);
  });

  it('should reject phone with letters', () => {
    const result = mobileRegisterSchema.safeParse({
      phone: '+51abc654321',
      password: 'secure12345',
      businessName: 'Test',
    });
    expect(result.success).toBe(false);
  });

  it('should reject short phone', () => {
    const result = mobileRegisterSchema.safeParse({
      phone: '+12345',
      password: 'secure12345',
      businessName: 'Test',
    });
    expect(result.success).toBe(false);
  });

  it('should accept optional email', () => {
    const result = mobileRegisterSchema.safeParse({
      phone: '+51987654321',
      password: 'secure12345',
      businessName: 'Test',
      email: 'user@example.com',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid email format', () => {
    const result = mobileRegisterSchema.safeParse({
      phone: '+51987654321',
      password: 'secure12345',
      businessName: 'Test',
      email: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });

  it('should reject short password', () => {
    const result = mobileRegisterSchema.safeParse({
      phone: '+51987654321',
      password: 'short',
      businessName: 'Test',
    });
    expect(result.success).toBe(false);
  });

  it('should reject empty business name', () => {
    const result = mobileRegisterSchema.safeParse({
      phone: '+51987654321',
      password: 'secure12345',
      businessName: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('mobileLoginSchema', () => {
  it('should accept valid login', () => {
    const result = mobileLoginSchema.safeParse({
      phone: '+51987654321',
      password: 'mypassword',
    });
    expect(result.success).toBe(true);
  });

  it('should reject missing password', () => {
    const result = mobileLoginSchema.safeParse({
      phone: '+51987654321',
    });
    expect(result.success).toBe(false);
  });

  it('should reject empty password', () => {
    const result = mobileLoginSchema.safeParse({
      phone: '+51987654321',
      password: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('createOrderSchema', () => {
  it('should accept valid order with items', () => {
    const result = createOrderSchema.safeParse({
      items: [{ productId: 1, quantity: 2 }],
    });
    expect(result.success).toBe(true);
  });

  it('should accept order with multiple items', () => {
    const result = createOrderSchema.safeParse({
      items: [
        { productId: 1, quantity: 1 },
        { productId: 2, quantity: 3 },
      ],
      deliveryType: 'delivery',
      deliveryAddress: 'Av. Lima 123',
      notes: 'Sin cebolla',
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty items array', () => {
    const result = createOrderSchema.safeParse({ items: [] });
    expect(result.success).toBe(false);
  });

  it('should reject zero quantity', () => {
    const result = createOrderSchema.safeParse({
      items: [{ productId: 1, quantity: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it('should reject negative productId', () => {
    const result = createOrderSchema.safeParse({
      items: [{ productId: -1, quantity: 1 }],
    });
    expect(result.success).toBe(false);
  });

  it('should accept optional customerId', () => {
    const result = createOrderSchema.safeParse({
      customerId: 5,
      items: [{ productId: 1, quantity: 1 }],
    });
    expect(result.success).toBe(true);
  });
});

describe('createCustomerSchema', () => {
  it('should accept valid customer', () => {
    const result = createCustomerSchema.safeParse({
      name: 'Juan Perez',
      phone: '+51987654321',
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty name', () => {
    const result = createCustomerSchema.safeParse({
      name: '',
    });
    expect(result.success).toBe(false);
  });

  it('should default channel to web', () => {
    const result = createCustomerSchema.safeParse({ name: 'Test' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.channel).toBe('web');
    }
  });

  it('should accept optional fields', () => {
    const result = createCustomerSchema.safeParse({
      name: 'Ana',
      phone: null,
      address: 'Calle 123',
      notes: 'VIP customer',
      jid: '51987654321@s.whatsapp.net',
    });
    expect(result.success).toBe(true);
  });
});

describe('updateTenantSchema', () => {
  it('should accept partial update', () => {
    expect(updateTenantSchema.safeParse({ name: 'New Name' }).success).toBe(true);
  });

  it('should accept settings update', () => {
    const result = updateTenantSchema.safeParse({
      settings: { timezone: 'America/Lima' },
    });
    expect(result.success).toBe(true);
  });

  it('should accept empty update', () => {
    expect(updateTenantSchema.safeParse({}).success).toBe(true);
  });
});

describe('updateCreatorPlanSchema', () => {
  it('should accept partial plan update', () => {
    expect(updateCreatorPlanSchema.safeParse({ price: 19.99 }).success).toBe(true);
  });

  it('should accept empty update', () => {
    expect(updateCreatorPlanSchema.safeParse({}).success).toBe(true);
  });
});

describe('updatePlatformPlanSchema', () => {
  it('should accept partial platform plan update', () => {
    expect(updatePlatformPlanSchema.safeParse({ name: 'Pro Plus' }).success).toBe(true);
  });
});
