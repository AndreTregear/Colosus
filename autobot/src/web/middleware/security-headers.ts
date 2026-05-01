import type { Request, Response, NextFunction } from 'express';

/**
 * Security Headers Middleware
 *
 * Applies defense-in-depth HTTP headers to all responses:
 * - HSTS: force HTTPS for 1 year (production only)
 * - CSP: restrict resource loading origins
 * - X-Content-Type-Options: prevent MIME sniffing
 * - X-Frame-Options: prevent clickjacking
 * - X-XSS-Protection: disabled (CSP is the modern replacement)
 * - Referrer-Policy: limit referrer leakage
 * - Permissions-Policy: disable unused browser APIs
 */
export function securityHeaders() {
  return (_req: Request, res: Response, next: NextFunction): void => {
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // Disable XSS auditor (modern browsers use CSP instead)
    res.setHeader('X-XSS-Protection', '0');

    // Limit referrer information
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Disable unused browser APIs
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(self), geolocation=()');

    // Content Security Policy
    res.setHeader(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: blob:",
        "connect-src 'self'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; '),
    );

    // HSTS — only in production and not for localhost
    if (
      process.env.NODE_ENV === 'production' &&
      _req.hostname !== 'localhost' &&
      _req.hostname !== '127.0.0.1'
    ) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    next();
  };
}
