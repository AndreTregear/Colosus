/**
 * Tests for shared/validate.ts — Express middleware and request helpers.
 */
import { describe, it, expect, vi } from 'vitest';
import { validateBody, getTenantId, getDeviceId, parsePagination, handleAction } from '../src/shared/validate.js';
import { z } from 'zod';

function mockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('validateBody', () => {
  const schema = z.object({
    name: z.string().min(1),
    age: z.number().positive(),
  });

  it('should pass valid body and call next', () => {
    const req = { body: { name: 'Juan', age: 25 } } as any;
    const res = mockRes();
    const next = vi.fn();

    validateBody(schema)(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.body.name).toBe('Juan');
    expect(req.body.age).toBe(25);
  });

  it('should reject invalid body with 400', () => {
    const req = { body: { name: '', age: -1 } } as any;
    const res = mockRes();
    const next = vi.fn();

    validateBody(schema)(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Validation failed' }),
    );
  });

  it('should include error details', () => {
    const req = { body: {} } as any;
    const res = mockRes();
    const next = vi.fn();

    validateBody(schema)(req, res, next);

    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg.details).toBeDefined();
    expect(Array.isArray(jsonArg.details)).toBe(true);
    expect(jsonArg.details.length).toBeGreaterThan(0);
  });

  it('should coerce values through Zod', () => {
    const coerceSchema = z.object({
      limit: z.coerce.number().default(50),
    });
    const req = { body: { limit: '25' } } as any;
    const res = mockRes();
    const next = vi.fn();

    validateBody(coerceSchema)(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.body.limit).toBe(25);
  });
});

describe('getTenantId', () => {
  it('should return tenantId from request', () => {
    const req = { tenantId: 'tenant-abc' } as any;
    expect(getTenantId(req)).toBe('tenant-abc');
  });

  it('should throw when tenantId is missing', () => {
    const req = {} as any;
    expect(() => getTenantId(req)).toThrow('tenantId missing');
  });

  it('should throw when tenantId is empty', () => {
    const req = { tenantId: '' } as any;
    expect(() => getTenantId(req)).toThrow('tenantId missing');
  });
});

describe('getDeviceId', () => {
  it('should return deviceId from request', () => {
    const req = { deviceId: 42 } as any;
    expect(getDeviceId(req)).toBe(42);
  });

  it('should throw when deviceId is missing', () => {
    const req = {} as any;
    expect(() => getDeviceId(req)).toThrow('deviceId missing');
  });
});

describe('parsePagination', () => {
  it('should parse valid pagination params', () => {
    const result = parsePagination({ limit: '25', offset: '10' });
    expect(result).toEqual({ limit: 25, offset: 10 });
  });

  it('should use defaults for missing params', () => {
    const result = parsePagination({});
    expect(result).toEqual({ limit: 50, offset: 0 });
  });

  it('should throw for invalid params', () => {
    expect(() => parsePagination({ limit: '999' })).toThrow();
  });
});

describe('handleAction', () => {
  it('should return success body on success', async () => {
    const res = mockRes();
    await handleAction(res, async () => {});
    expect(res.json).toHaveBeenCalledWith({ ok: true });
  });

  it('should return custom success body', async () => {
    const res = mockRes();
    await handleAction(res, async () => {}, { status: 'done' });
    expect(res.json).toHaveBeenCalledWith({ status: 'done' });
  });

  it('should return 400 on failure', async () => {
    const res = mockRes();
    await handleAction(res, async () => {
      throw new Error('Something went wrong');
    });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Something went wrong' });
  });
});
