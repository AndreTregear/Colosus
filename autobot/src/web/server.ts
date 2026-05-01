import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { toNodeHandler } from 'better-auth/node';
import { auth } from '../auth/auth.js';
import { requireSession, requireAdmin, requireTenantOwner } from './middleware/session-auth.js';
import { logger } from '../shared/logger.js';
import { BETTER_AUTH_URL, UPLOADS_DIR } from '../config.js';
import { securityHeaders } from './middleware/security-headers.js';

// ── Route imports ──
import { rulesRouter } from './routes/api-rules.js';
import { messagesRouter } from './routes/api-messages.js';
import { statusRouter } from './routes/api-status.js';
import { qrRouter } from './routes/api-qr.js';
import { registerRouter } from './routes/api-register.js';
import { accountRouter } from './routes/api-account.js';
import { tenantsRouter } from './routes/api-tenants.js';
import { webRouter } from './routes/api-web.js';
import { dashboardApiRouter } from './routes/core/dashboard-routes.js';
import { adminRouter } from './routes/api-admin.js';
import { queueRouter } from './routes/api-queue.js';
import { subscriptionsRouter } from './routes/api-subscriptions.js';
import { customerSubscriptionsRouter, mobileCreatorRouter } from './routes/api-customer-subscriptions.js';
import { creatorPlansRouter } from './routes/api-creator-plans.js';
import { platformPlansRouter, adminPlansRouter } from './routes/api-platform-plans.js';
import { merchantAIRouter } from './routes/api-merchant-ai.js';
import { yapeRouter } from './routes/api-yape.js';
import { calendarRouter } from './routes/api-calendar.js';
import { mobileAuthRouter } from './routes/api-mobile-auth.js';
import { mobileRouter } from './routes/api-mobile.js';
import { mobileEventsRouter } from './routes/api-mobile-events.js';
import { mediaRouter } from './routes/media-routes.js';
import { streamRouter } from '../media/streaming.js';
import { encryptionRouter } from './routes/encryption-routes.js';
import { warehouseRouter } from './routes/warehouse-routes.js';
import { aiUsageAdminRouter } from './routes/api-ai-usage.js';
import { businessIntelligenceRouter } from './routes/api-business-intelligence.js';
import { leadsRouter } from './routes/api-leads.js';
import { websiteLeadsRouter } from './routes/api-website-leads.js';
import { ssoRouter } from './routes/api-sso.js';
// simulate route removed — was Mastra-only demo
import { redeployRouter } from './routes/api-redeploy.js';
import { shareRouter } from './routes/api-share.js';

process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err);
  // Give time for logs to flush, then exit
  setTimeout(() => process.exit(1), 1000);
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createWebServer(port: number = 3000): void {
  const app = express();
  app.set('trust proxy', 1); // trust first proxy (Caddy / Cloudflare)

  // ── Security headers (CSP, HSTS, X-Frame-Options, etc.) ──
  app.use(securityHeaders());

  // ── CORS — restrict to known origins ──
  const allowedOrigins: string[] = [];
  if (BETTER_AUTH_URL) {
    allowedOrigins.push(BETTER_AUTH_URL);
    // Also allow the http variant for local/proxy access
    if (BETTER_AUTH_URL.startsWith('https://')) {
      allowedOrigins.push(BETTER_AUTH_URL.replace('https://', 'http://'));
    }
  }
  // Support extra origins via ALLOWED_ORIGINS env var (comma-separated)
  if (process.env.ALLOWED_ORIGINS) {
    allowedOrigins.push(...process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean));
  }
  if (allowedOrigins.length === 0) {
    allowedOrigins.push('http://localhost:3000', 'http://localhost:' + port);
  }
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // Return false instead of Error to avoid 500 — browser handles the rejection
        logger.debug({ origin, allowedOrigins }, 'CORS origin rejected');
        callback(null, false);
      }
    },
    credentials: true,
  }));

  app.use(express.json({ limit: '1mb' }));

  // ── Request logging middleware ──
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const latencyMs = Date.now() - start;
      // Skip noisy health checks and static assets at debug level
      if (req.path === '/api/v1/health') return;
      if (!req.path.startsWith('/api/')) return;
      logger.debug({ method: req.method, path: req.path, status: res.statusCode, latencyMs }, 'HTTP request');
    });
    next();
  });

  // ── Rate limiting ──
  const isTestEnv = process.env.NODE_ENV === 'test';

  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later' },
    skip: (req) => isTestEnv || req.path === '/v1/health' || req.path.startsWith('/internal/'),
  });
  app.use('/api/', globalLimiter);

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: 'Too many auth attempts, please try again later' },
    skip: () => isTestEnv,
  });
  app.use('/api/auth/', authLimiter);
  app.use('/api/register', authLimiter);
  app.use('/api/v1/mobile/auth', authLimiter);

  const leadsLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5,
    message: { error: 'Too many submissions, please try again later' },
    skip: () => isTestEnv,
  });
  app.use('/api/website/leads', leadsLimiter);

  // Static frontend files
  app.use(express.static(path.resolve(__dirname, 'public')));

  // Serve uploaded media files (product images, etc.)
  app.use('/media', express.static(path.resolve(UPLOADS_DIR)));

  // ── Better Auth handler (sign-in, sign-up, sign-out, session) ──
  app.all('/api/auth/{*splat}', toNodeHandler(auth));

  // ── Health check (no auth) ──
  // Returns 200 if all critical deps are reachable, 503 otherwise
  app.get('/api/v1/health', async (_req, res) => {
    const checks: Record<string, { status: 'ok' | 'error'; latencyMs?: number; error?: string }> = {};

    // Postgres
    try {
      const start = Date.now();
      const { getPool } = await import('../db/pool.js');
      await getPool().query('SELECT 1');
      checks.postgres = { status: 'ok', latencyMs: Date.now() - start };
    } catch (e: any) {
      checks.postgres = { status: 'error', error: e.message };
    }

    // Redis
    try {
      const start = Date.now();
      const { getRedisConnection } = await import('../queue/redis.js');
      await getRedisConnection().ping();
      checks.redis = { status: 'ok', latencyMs: Date.now() - start };
    } catch (e: any) {
      checks.redis = { status: 'error', error: e.message };
    }

    // vLLM
    try {
      const start = Date.now();
      const resp = await fetch(`${process.env.AI_BASE_URL || 'http://localhost:8000/v1'}/models`, {
        headers: { Authorization: `Bearer ${process.env.AI_API_KEY || ''}` },
        signal: AbortSignal.timeout(3000),
      });
      checks.vllm = resp.ok
        ? { status: 'ok', latencyMs: Date.now() - start }
        : { status: 'error', error: `HTTP ${resp.status}` };
    } catch (e: any) {
      checks.vllm = { status: 'error', error: e.message };
    }

    // Whisper
    try {
      const start = Date.now();
      const whisperBase = (process.env.WHISPER_BASE_URL || 'http://localhost:9300/v1').replace(/\/v1\/?$/, '');
      const resp = await fetch(`${whisperBase}/health`, {
        signal: AbortSignal.timeout(3000),
      });
      checks.whisper = resp.ok
        ? { status: 'ok', latencyMs: Date.now() - start }
        : { status: 'error', error: `HTTP ${resp.status}` };
    } catch (e: any) {
      checks.whisper = { status: 'error', error: e.message };
    }

    const critical = ['postgres', 'redis'];
    const allCriticalOk = critical.every(k => checks[k]?.status === 'ok');
    const allOk = Object.values(checks).every(c => c.status === 'ok');

    res.status(allCriticalOk ? 200 : 503).json({
      status: allCriticalOk ? (allOk ? 'healthy' : 'degraded') : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks,
    });
  });

  // ── Internal dev routes (no auth — admin use only, port 3000 should not be public-facing) ──
  app.use('/api/internal', queueRouter);

  // ── Public routes (no auth required) ──
  app.use('/api/register', registerRouter);
  app.use('/api/plans', platformPlansRouter);
  app.use('/api/v1/yape', yapeRouter);
  app.use('/api/v1/mobile/auth', mobileAuthRouter);
  app.use('/api/website/leads', websiteLeadsRouter);
  app.use('/api/v1/share', shareRouter);

  app.use('/api/v1/darwin', redeployRouter); // secret-based auth, separate from session-based admin

  // ── Admin routes (session + admin role) ──
  app.use('/api/rules', requireSession, requireAdmin, rulesRouter);
  app.use('/api/messages', requireSession, requireAdmin, messagesRouter);
  app.use('/api/status', requireSession, requireTenantOwner, statusRouter);
  app.use('/api/qr', requireSession, requireTenantOwner, qrRouter);
  app.use('/api/admin', requireSession, requireAdmin, adminRouter);
  app.use('/api/admin/plans', requireSession, requireAdmin, adminPlansRouter);
  app.use('/api/admin/ai-usage', requireSession, requireAdmin, aiUsageAdminRouter);
  app.use('/api/tenants', requireSession, requireTenantOwner, tenantsRouter);
  app.use('/api/queue', requireSession, requireAdmin, queueRouter);

  // ── Tenant routes (auth middleware applied inside routers) ──
  app.use('/api/account', requireSession, requireTenantOwner, accountRouter);
  app.use('/api/business', requireSession, businessIntelligenceRouter);
  app.use('/api/web/dashboard', dashboardApiRouter);
  app.use('/api/web', webRouter);
  app.use('/api/subscription', subscriptionsRouter);
  app.use('/api/creator/subscriptions', customerSubscriptionsRouter);
  app.use('/api/creator/plans', creatorPlansRouter);
  app.use('/api/calendar', calendarRouter);
  app.use('/api/merchant-ai', merchantAIRouter);
  app.use('/api/leads', requireSession, leadsRouter);
  app.use('/api/sso', requireSession, ssoRouter);

  // ── Media Server routes ──
  app.use('/api/v1/media', mediaRouter);
  app.use('/api/v1/stream', streamRouter);

  // ── Encryption routes ──
  app.use('/api/v1/encryption', requireSession, encryptionRouter);

  // ── Data Warehouse routes ──
  app.use('/api/v1/warehouse', warehouseRouter);

  // ── Mobile / Device routes (auth middleware inside routers) ──
  app.use('/api/v1/mobile', mobileRouter);
  app.use('/api/v1/mobile/events', mobileEventsRouter);
  app.use('/api/v1/creator', mobileCreatorRouter);

  // SPA fallback — serve appropriate index.html based on route
  app.get('/dashboard/{*splat}', requireSession, (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'public/dashboard/index.html'));
  });
  app.get('/dashboard', requireSession, (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'public/dashboard/index.html'));
  });

  app.get('/admin/{*splat}', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'public/admin/index.html'));
  });

  app.get('/customer/{*splat}', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'public/customer/index.html'));
  });

  // Root fallback (exclude /media paths so missing files return 404)
  app.get('/{*splat}', (req, res, next) => {
    if (req.path.startsWith('/media/')) return next();
    res.sendFile(path.resolve(__dirname, 'public/index.html'));
  });

  // Global error handler — must be LAST (after all routes including SPA fallbacks)
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error({ err: err.message }, 'Unhandled route error');
    res.status(500).json({ error: 'Internal server error' });
  });

  app.listen(port, () => {
    logger.info(`Dashboard running at http://localhost:${port}`);
  });
}
