import { Router } from 'express';
import multer from 'multer';
import { requireTenantAuth } from '../middleware/tenant-auth.js';
import * as productsRepo from '../../db/products-repo.js';
import { getTenantId } from '../../shared/validate.js';
import { saveMedia, deleteMedia } from '../../shared/storage.js';
import { MAX_UPLOAD_SIZE_MB } from '../../config.js';
import { query } from '../../db/pool.js';
import { parsePagination } from '../../shared/validate.js';
import { mountProductRoutes } from './core/products-routes.js';
import { mountOrderRoutes } from './core/orders-routes.js';
import { mountPaymentRoutes } from './core/payments-routes.js';
import { mountCustomerRoutes } from './core/customers-routes.js';
import { mountSettingRoutes } from './core/settings-routes.js';
import { mountRefundRoutes } from './core/refunds-routes.js';
import * as catalogService from '../../services/catalog-service.js';
import { logger } from '../../shared/logger.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
    }
  },
});

const router = Router();
router.use(requireTenantAuth);

// Shared CRUD routes (same logic as mobile, different auth)
mountProductRoutes(router, '/products');
mountOrderRoutes(router, '/orders');
mountPaymentRoutes(router, '/payments');
mountCustomerRoutes(router, '/customers');
mountSettingRoutes(router, '/settings');
mountRefundRoutes(router, '/refunds');

// ── Tenant message log ──────────────────────────

router.get('/messages', async (req, res) => {
  const tenantId = getTenantId(req);
  const { limit, offset } = parsePagination(req.query);
  const { rows } = await query(
    'SELECT id, jid, push_name AS "pushName", direction, body, timestamp FROM message_log WHERE tenant_id = $1 ORDER BY timestamp DESC LIMIT $2 OFFSET $3',
    [tenantId, limit, offset],
  );
  const countResult = await query('SELECT COUNT(*)::int AS total FROM message_log WHERE tenant_id = $1', [tenantId]);
  res.json({ messages: rows, total: countResult.rows[0].total, limit, offset });
});

// ── Product image upload (web-only) ──────────────────────────

router.post('/products/:id/image', upload.single('image'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No image uploaded' });
    return;
  }
  const tenantId = getTenantId(req);
  const productId = Number(req.params.id);
  const product = await productsRepo.getProductById(tenantId, productId);
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }

  if (product.imageUrl) {
    await deleteMedia(product.imageUrl);
  }

  const ext = req.file.mimetype === 'image/png' ? '.png'
    : req.file.mimetype === 'image/webp' ? '.webp' : '.jpg';
  const relativePath = await saveMedia(tenantId, 'products', req.file.buffer, ext);
  const updated = await productsRepo.updateProduct(tenantId, productId, { imageUrl: relativePath });
  res.json(updated);
});

router.delete('/products/:id/image', async (req, res) => {
  const tenantId = getTenantId(req);
  const productId = Number(req.params.id);
  const product = await productsRepo.getProductById(tenantId, productId);
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }

  if (product.imageUrl) {
    await deleteMedia(product.imageUrl);
    await productsRepo.updateProduct(tenantId, productId, { imageUrl: null });
  }
  res.json({ ok: true });
});

// ── Analytics endpoints ──────────────────────────

router.get('/analytics/sales', async (req, res) => {
  const tenantId = getTenantId(req);
  const period = req.query.period as string || '30d';
  try {
    const result = await catalogService.getSalesAnalytics(tenantId, period);
    res.json(result);
  } catch (err) {
    logger.error({ err, tenantId }, 'Failed to get sales analytics');
    res.status(500).json({ error: 'Failed to load sales data' });
  }
});

router.get('/analytics', async (req, res) => {
  const tenantId = getTenantId(req);
  const days = Math.min(parseInt(req.query.period as string) || 30, 90);
  try {
    const result = await catalogService.getComprehensiveAnalytics(tenantId, days);
    res.json(result);
  } catch (err) {
    logger.error({ err, tenantId }, 'Failed to get analytics');
    res.status(500).json({ error: 'Failed to load analytics' });
  }
});

export { router as webRouter };
