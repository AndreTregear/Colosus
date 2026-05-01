/**
 * Tests for web/middleware/security-headers.ts — HTTP security headers.
 */
import { describe, it, expect, vi } from 'vitest';
import { securityHeaders } from '../src/web/middleware/security-headers.js';

function createMockReqRes(hostname = 'localhost', nodeEnv?: string) {
  if (nodeEnv !== undefined) process.env.NODE_ENV = nodeEnv;

  const headers: Record<string, string> = {};
  const req = { hostname } as any;
  const res = {
    setHeader: vi.fn((name: string, value: string) => {
      headers[name] = value;
    }),
    getHeaders: () => headers,
  } as any;
  const next = vi.fn();

  return { req, res, next, headers };
}

describe('securityHeaders', () => {
  const middleware = securityHeaders();

  it('should set X-Content-Type-Options', () => {
    const { req, res, next } = createMockReqRes();
    middleware(req, res, next);
    expect(res.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
    expect(next).toHaveBeenCalled();
  });

  it('should set X-Frame-Options to DENY', () => {
    const { req, res, next } = createMockReqRes();
    middleware(req, res, next);
    expect(res.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
  });

  it('should disable X-XSS-Protection', () => {
    const { req, res, next } = createMockReqRes();
    middleware(req, res, next);
    expect(res.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '0');
  });

  it('should set Referrer-Policy', () => {
    const { req, res, next } = createMockReqRes();
    middleware(req, res, next);
    expect(res.setHeader).toHaveBeenCalledWith('Referrer-Policy', 'strict-origin-when-cross-origin');
  });

  it('should set Permissions-Policy allowing microphone(self)', () => {
    const { req, res, next } = createMockReqRes();
    middleware(req, res, next);
    const call = res.setHeader.mock.calls.find((c: any) => c[0] === 'Permissions-Policy');
    expect(call).toBeTruthy();
    expect(call[1]).toContain('microphone=(self)');
    expect(call[1]).toContain('camera=()');
  });

  it('should set Content-Security-Policy', () => {
    const { req, res, next } = createMockReqRes();
    middleware(req, res, next);
    const call = res.setHeader.mock.calls.find((c: any) => c[0] === 'Content-Security-Policy');
    expect(call).toBeTruthy();
    const csp = call[1] as string;
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("img-src 'self' data: blob:");
  });

  it('should NOT set HSTS on localhost', () => {
    const { req, res, next } = createMockReqRes('localhost', 'production');
    middleware(req, res, next);
    const hstsCall = res.setHeader.mock.calls.find((c: any) => c[0] === 'Strict-Transport-Security');
    expect(hstsCall).toBeUndefined();
    delete process.env.NODE_ENV;
  });

  it('should NOT set HSTS in non-production', () => {
    const { req, res, next } = createMockReqRes('agente.ceo', 'development');
    middleware(req, res, next);
    const hstsCall = res.setHeader.mock.calls.find((c: any) => c[0] === 'Strict-Transport-Security');
    expect(hstsCall).toBeUndefined();
    delete process.env.NODE_ENV;
  });

  it('should set HSTS in production for non-localhost', () => {
    const { req, res, next } = createMockReqRes('agente.ceo', 'production');
    middleware(req, res, next);
    const hstsCall = res.setHeader.mock.calls.find((c: any) => c[0] === 'Strict-Transport-Security');
    expect(hstsCall).toBeTruthy();
    expect(hstsCall[1]).toContain('max-age=31536000');
    delete process.env.NODE_ENV;
  });

  it('should call next()', () => {
    const { req, res, next } = createMockReqRes();
    middleware(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
