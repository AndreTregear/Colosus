import { Router } from 'express';
import { execFileSync } from 'node:child_process';
import { logger } from '../../shared/logger.js';
import { requireSecret, timingSafeStringEqual } from '../../shared/secrets.js';

const router = Router();

// POST /api/v1/admin/redeploy
// Body: { secret: string }
// Pulls latest code and triggers graceful restart
router.post('/redeploy', async (req, res) => {
  const { secret } = req.body as { secret?: string };
  let expected: string;
  try {
    expected = requireSecret('DEPLOY_SECRET');
  } catch (err) {
    logger.error({ err }, 'DEPLOY_SECRET not configured — refusing redeploy');
    res.status(503).json({ error: 'redeploy disabled' });
    return;
  }
  if (!secret || !timingSafeStringEqual(secret, expected)) {
    logger.warn({ ip: req.ip }, 'Unauthorized redeploy attempt');
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  try {
    logger.info({ ip: req.ip }, 'Darwin redeploy triggered');
    execFileSync('git', ['-C', '/home/yaya/YAYA', 'pull', '--ff-only'], {
      timeout: 30000,
      stdio: 'pipe',
    });
    res.json({ ok: true, message: 'Pulled latest. Restarting.' });
    setTimeout(() => process.exit(0), 1000);
  } catch (err) {
    logger.error({ err }, 'Redeploy failed');
    res.status(500).json({ error: 'Redeploy failed' }); // no error leak
  }
});

export { router as redeployRouter };
