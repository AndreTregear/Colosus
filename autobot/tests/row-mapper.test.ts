/**
 * Tests for db/row-mapper.ts — generic database row mapping.
 */
import { describe, it, expect } from 'vitest';
import { createRowMapper, mergeFields } from '../src/db/row-mapper.js';

describe('createRowMapper', () => {
  it('should map simple string columns', () => {
    const mapper = createRowMapper<{ name: string; slug: string }>({
      name: 'name',
      slug: 'slug',
    });
    const result = mapper({ name: 'Test', slug: 'test' });
    expect(result).toEqual({ name: 'Test', slug: 'test' });
  });

  it('should rename columns', () => {
    const mapper = createRowMapper<{ tenantId: string }>({
      tenantId: 'tenant_id',
    });
    const result = mapper({ tenant_id: 'abc-123' });
    expect(result).toEqual({ tenantId: 'abc-123' });
  });

  it('should convert date fields to ISO strings', () => {
    const mapper = createRowMapper<{ createdAt: string }>({
      createdAt: { col: 'created_at', type: 'date' },
    });
    const date = new Date('2025-01-15T10:00:00Z');
    const result = mapper({ created_at: date });
    expect(result.createdAt).toBe('2025-01-15T10:00:00.000Z');
  });

  it('should pass through non-Date values for date fields', () => {
    const mapper = createRowMapper<{ createdAt: string }>({
      createdAt: { col: 'created_at', type: 'date' },
    });
    const result = mapper({ created_at: '2025-01-15' });
    expect(result.createdAt).toBe('2025-01-15');
  });

  it('should convert number fields', () => {
    const mapper = createRowMapper<{ price: number }>({
      price: { col: 'price', type: 'number' },
    });
    const result = mapper({ price: '29.99' });
    expect(result.price).toBe(29.99);
  });

  it('should handle nullable number fields', () => {
    const mapper = createRowMapper<{ stock: number | null }>({
      stock: { col: 'stock', type: 'number?' },
    });
    expect(mapper({ stock: '10' }).stock).toBe(10);
    expect(mapper({ stock: null }).stock).toBeNull();
    expect(mapper({ stock: undefined }).stock).toBeNull();
  });

  it('should parse JSON fields', () => {
    const mapper = createRowMapper<{ tags: string[] }>({
      tags: { col: 'tags', type: 'json', default: [] },
    });
    expect(mapper({ tags: '["a","b"]' }).tags).toEqual(['a', 'b']);
    expect(mapper({ tags: ['a', 'b'] }).tags).toEqual(['a', 'b']);
  });

  it('should use JSON default on null', () => {
    const mapper = createRowMapper<{ tags: string[] }>({
      tags: { col: 'tags', type: 'json', default: [] },
    });
    expect(mapper({ tags: null }).tags).toEqual([]);
  });

  it('should use JSON default on invalid JSON string', () => {
    const mapper = createRowMapper<{ tags: string[] }>({
      tags: { col: 'tags', type: 'json', default: [] },
    });
    expect(mapper({ tags: 'not-json' }).tags).toEqual([]);
  });

  it('should handle string fields with defaults', () => {
    const mapper = createRowMapper<{ status: string }>({
      status: { col: 'status', type: 'string', default: 'active' },
    });
    expect(mapper({ status: 'inactive' }).status).toBe('inactive');
    expect(mapper({ status: null }).status).toBe('active');
    expect(mapper({ status: undefined }).status).toBe('active');
  });

  it('should handle complex multi-field mapping', () => {
    interface Product {
      id: number;
      tenantId: string;
      name: string;
      price: number;
      stock: number | null;
      tags: string[];
      createdAt: string;
    }

    const mapper = createRowMapper<Product>({
      id: { col: 'id', type: 'number' },
      tenantId: 'tenant_id',
      name: 'name',
      price: { col: 'price', type: 'number' },
      stock: { col: 'stock', type: 'number?' },
      tags: { col: 'tags', type: 'json', default: [] },
      createdAt: { col: 'created_at', type: 'date' },
    });

    const result = mapper({
      id: '5',
      tenant_id: 'tenant-1',
      name: 'Pizza',
      price: '15.50',
      stock: null,
      tags: '["food","popular"]',
      created_at: new Date('2025-03-01T12:00:00Z'),
    });

    expect(result).toEqual({
      id: 5,
      tenantId: 'tenant-1',
      name: 'Pizza',
      price: 15.5,
      stock: null,
      tags: ['food', 'popular'],
      createdAt: '2025-03-01T12:00:00.000Z',
    });
  });
});

describe('mergeFields', () => {
  it('should override with input values', () => {
    const existing = { name: 'old', price: 10, active: true };
    const input = { name: 'new' };
    const result = mergeFields(existing, input, ['name', 'price', 'active']);
    expect(result).toEqual({ name: 'new', price: 10, active: true });
  });

  it('should keep existing values when input is undefined', () => {
    const existing = { name: 'keep', price: 20 };
    const result = mergeFields(existing, {}, ['name', 'price']);
    expect(result).toEqual({ name: 'keep', price: 20 });
  });

  it('should allow setting falsy values', () => {
    const existing = { name: 'test', count: 5, active: true };
    const input = { count: 0, active: false };
    const result = mergeFields(existing, input, ['name', 'count', 'active']);
    expect(result).toEqual({ name: 'test', count: 0, active: false });
  });

  it('should only include specified fields', () => {
    const existing = { name: 'test', price: 10, secret: 'hidden' };
    const result = mergeFields(existing, { name: 'new' }, ['name', 'price']);
    expect(result).toEqual({ name: 'new', price: 10 });
    expect('secret' in result).toBe(false);
  });
});
