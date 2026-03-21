import { Router } from 'express';
import { execSync } from 'child_process';
import { logger } from '../../shared/logger.js';

const router = Router();

const DEPLOY_SECRET = process.env.DEPLOY_SECRET || 'darwin-deploy-2026';

// POST /api/v1/admin/redeploy
// Body: { secret: string }
// Pulls latest code and triggers graceful restart
router.post('/redeploy', async (req, res) => {
  const { secret } = req.body as { secret?: string };
  if (!secret || secret !== DEPLOY_SECRET) {
    logger.warn({ ip: req.ip }, 'Unauthorized redeploy attempt');
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  try {
    logger.info({ ip: req.ip }, 'Darwin redeploy triggered');
    execSync('cd /home/yaya/YAYA && git pull', { timeout: 30000, stdio: 'pipe' });
    res.json({ ok: true, message: 'Pulled latest. Restarting.' });
    setTimeout(() => process.exit(0), 1000);
  } catch (err) {
    logger.error({ err }, 'Redeploy failed');
    res.status(500).json({ error: 'Redeploy failed' }); // no error leak
  }
});

export { router as redeployRouter };
