/**
 * Tests for the Web module — middleware and request helpers.
 */
import { describe, it, expect } from 'vitest';
import { getTenantId, getDeviceId, validateBody } from '../src/shared/validate.js';
import { createProductSchema } from '../src/shared/validation.js';
import type { Request, Response, NextFunction } from 'express';

// Helper to create a minimal mock request
function mockReq(overrides: Partial<Request> = {}): Request {
  return {
    tenantId: undefined,
    deviceId: undefined,
    body: {},
    ...overrides,
  } as unknown as Request;
}

// Helper to create a mock response
function mockRes() {
  const res = {
    statusCode: 200,
    body: null as unknown,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(data: unknown) {
      res.body = data;
      return res;
    },
  };
  return res as unknown as Response & { statusCode: number; body: unknown };
}

describe('web/shared/validate', () => {
  describe('getTenantId', () => {
    it('should return tenantId when present', () => {
      const req = mockReq({ tenantId: 'tenant-123' });
      expect(getTenantId(req)).toBe('tenant-123');
    });

    it('should throw when tenantId is missing', () => {
      const req = mockReq();
      expect(() => getTenantId(req)).toThrow('tenantId missing');
    });

    it('should throw when tenantId is undefined', () => {
      const req = mockReq({ tenantId: undefined });
      expect(() => getTenantId(req)).toThrow();
    });
  });

  describe('getDeviceId', () => {
    it('should return deviceId when present', () => {
      const req = mockReq({ deviceId: 42 });
      expect(getDeviceId(req)).toBe(42);
    });

    it('should throw when deviceId is missing', () => {
      const req = mockReq();
      expect(() => getDeviceId(req)).toThrow('deviceId missing');
    });
  });

  describe('validateBody', () => {
    it('should pass valid input and replace req.body with parsed data', () => {
      const middleware = validateBody(createProductSchema);
      const req = mockReq({
        body: { name: 'Test Product', price: 29.99 },
      });
      const res = mockRes();
      let nextCalled = false;
      const next: NextFunction = () => { nextCalled = true; };

      middleware(req, res, next);

      expect(nextCalled).toBe(true);
      expect(req.body.name).toBe('Test Product');
      expect(req.body.category).toBe('general'); // Default applied
    });

    it('should reject invalid input with 400 status', () => {
      const middleware = validateBody(createProductSchema);
      const req = mockReq({
        body: { price: -5 }, // Missing name, negative price
      });
      const res = mockRes();
      let nextCalled = false;
      const next: NextFunction = () => { nextCalled = true; };

      middleware(req, res, next);

      expect(nextCalled).toBe(false);
      expect(res.statusCode).toBe(400);
      expect((res.body as { error: string }).error).toBe('Validation failed');
      expect((res.body as { details: string[] }).details.length).toBeGreaterThan(0);
    });

    it('should include field paths in error details', () => {
      const middleware = validateBody(createProductSchema);
      const req = mockReq({
        body: { name: 'Test', price: 10, productType: 'invalid' },
      });
      const res = mockRes();
      const next: NextFunction = () => {};

      middleware(req, res, next);

      expect(res.statusCode).toBe(400);
      const details = (res.body as { details: string[] }).details;
      expect(details.some(d => d.includes('productType'))).toBe(true);
    });
  });
});
