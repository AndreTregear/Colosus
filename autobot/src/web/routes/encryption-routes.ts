import { Router, type Request, type Response } from 'express';
import { getCachedDEK, evictDEK, hasCachedDEK } from '../../crypto/key-cache.js';
import { unlockTenantKeys } from '../../crypto/tenant-keys.js';
import { encryptField, decryptField, isEncrypted } from '../../crypto/field-crypto.js';
import { rotateKEK } from '../../crypto/key-rotation.js';
import { createRecoveryBackup, recoverFromBackup } from '../../crypto/backup.js';
import { getTenantId } from '../../shared/validate.js';
import { logger } from '../../shared/logger.js';

export const encryptionRouter = Router();

/**
 * POST /api/v1/encryption/unlock
 * Unlock tenant keys by providing password. Called after login.
 */
encryptionRouter.post('/unlock', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { password } = req.body;
    if (!password || typeof password !== 'string') {
      res.status(400).json({ error: 'password is required' });
      return;
    }

    const ok = await unlockTenantKeys(tenantId, password);
    if (!ok) {
      res.status(401).json({ error: 'Failed to unlock encryption keys' });
      return;
    }

    res.json({ ok: true, message: 'Encryption keys unlocked' });
  } catch (err) {
    logger.error({ err }, 'Unlock encryption keys failed');
    res.status(500).json({ error: 'Failed to unlock keys' });
  }
});

/**
 * POST /api/v1/encryption/lock
 * Evict DEK from cache (on logout).
 */
encryptionRouter.post('/lock', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    await evictDEK(tenantId);
    res.json({ ok: true, message: 'Encryption keys locked' });
  } catch (err) {
    logger.error({ err }, 'Lock encryption keys failed');
    res.status(500).json({ error: 'Failed to lock keys' });
  }
});

/**
 * GET /api/v1/encryption/status
 * Check if tenant DEK is cached (keys are unlocked).
 */
encryptionRouter.get('/status', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const unlocked = await hasCachedDEK(tenantId);
    res.json({ unlocked });
  } catch (err) {
    logger.error({ err }, 'Encryption status check failed');
    res.status(500).json({ error: 'Failed to check status' });
  }
});

/**
 * POST /api/v1/encryption/encrypt
 * Encrypt a single value using the tenant's cached DEK.
 */
encryptionRouter.post('/encrypt', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { value, table, column } = req.body;
    if (!value || typeof value !== 'string') {
      res.status(400).json({ error: 'value (string) is required' });
      return;
    }

    const dek = await getCachedDEK(tenantId);
    if (!dek) {
      res.status(403).json({ error: 'Encryption keys not unlocked. Call /unlock first.' });
      return;
    }

    const encrypted = encryptField(
      value,
      dek,
      tenantId,
      table || '_manual',
      column || '_value',
    );
    res.json({ encrypted });
  } catch (err) {
    logger.error({ err }, 'Encrypt value failed');
    res.status(500).json({ error: 'Encryption failed' });
  }
});

/**
 * POST /api/v1/encryption/decrypt
 * Decrypt a single value using the tenant's cached DEK.
 */
encryptionRouter.post('/decrypt', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { value, table, column } = req.body;
    if (!value || typeof value !== 'string') {
      res.status(400).json({ error: 'value (string) is required' });
      return;
    }

    if (!isEncrypted(value)) {
      res.status(400).json({ error: 'Value does not appear to be encrypted' });
      return;
    }

    const dek = await getCachedDEK(tenantId);
    if (!dek) {
      res.status(403).json({ error: 'Encryption keys not unlocked. Call /unlock first.' });
      return;
    }

    const decrypted = decryptField(
      value,
      dek,
      tenantId,
      table || '_manual',
      column || '_value',
    );
    if (decrypted === null) {
      res.status(400).json({ error: 'Decryption failed (wrong key or tampered data)' });
      return;
    }

    res.json({ decrypted });
  } catch (err) {
    logger.error({ err }, 'Decrypt value failed');
    res.status(500).json({ error: 'Decryption failed' });
  }
});

/**
 * POST /api/v1/encryption/rotate
 * Rotate KEK — change password encryption without re-encrypting data.
 */
encryptionRouter.post('/rotate', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || typeof oldPassword !== 'string') {
      res.status(400).json({ error: 'oldPassword is required' });
      return;
    }
    if (!newPassword || typeof newPassword !== 'string') {
      res.status(400).json({ error: 'newPassword is required' });
      return;
    }
    if (newPassword.length < 8) {
      res.status(400).json({ error: 'newPassword must be at least 8 characters' });
      return;
    }

    const ok = await rotateKEK(tenantId, oldPassword, newPassword);
    if (!ok) {
      res.status(401).json({ error: 'Key rotation failed (wrong old password?)' });
      return;
    }

    res.json({ ok: true, message: 'Encryption key rotated successfully' });
  } catch (err) {
    logger.error({ err }, 'Key rotation failed');
    res.status(500).json({ error: 'Key rotation failed' });
  }
});

/**
 * POST /api/v1/encryption/backup
 * Create a recovery backup for disaster recovery.
 */
encryptionRouter.post('/backup', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { recoveryPublicKey } = req.body;
    if (!recoveryPublicKey || typeof recoveryPublicKey !== 'string') {
      res.status(400).json({ error: 'recoveryPublicKey (PEM) is required' });
      return;
    }

    const backup = await createRecoveryBackup(tenantId, recoveryPublicKey);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="yaya-backup-${tenantId}.bin"`);
    res.send(backup);
  } catch (err) {
    logger.error({ err }, 'Backup creation failed');
    res.status(500).json({ error: 'Backup creation failed' });
  }
});

/**
 * POST /api/v1/encryption/recover
 * Recover encryption keys from a backup with a new password.
 */
encryptionRouter.post('/recover', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { backup, recoveryPrivateKey, newPassword } = req.body;
    if (!backup || typeof backup !== 'string') {
      res.status(400).json({ error: 'backup (base64) is required' });
      return;
    }
    if (!recoveryPrivateKey || typeof recoveryPrivateKey !== 'string') {
      res.status(400).json({ error: 'recoveryPrivateKey (PEM) is required' });
      return;
    }
    if (!newPassword || typeof newPassword !== 'string') {
      res.status(400).json({ error: 'newPassword is required' });
      return;
    }

    const backupBuf = Buffer.from(backup, 'base64');
    const ok = await recoverFromBackup(tenantId, backupBuf, recoveryPrivateKey, newPassword);
    if (!ok) {
      res.status(400).json({ error: 'Recovery failed (invalid backup or key)' });
      return;
    }

    res.json({ ok: true, message: 'Encryption keys recovered from backup' });
  } catch (err) {
    logger.error({ err }, 'Recovery from backup failed');
    res.status(500).json({ error: 'Recovery failed' });
  }
});
