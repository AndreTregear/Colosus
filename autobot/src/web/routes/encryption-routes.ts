import { Router, type Request, type Response } from 'express';
import { validatePublicKey, keyFingerprint, encryptField, parseEncryptedField } from '../../crypto/envelope.js';
import * as encKeysRepo from '../../db/encryption-keys-repo.js';
import { getTenantId } from '../../shared/validate.js';
import { logger } from '../../shared/logger.js';

export const encryptionRouter = Router();

function param(req: Request, name: string): string {
  const v = req.params[name];
  return Array.isArray(v) ? v[0] : v;
}

/**
 * POST /api/v1/encryption/keys
 */
encryptionRouter.post('/keys', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { publicKey } = req.body;
    if (!publicKey || typeof publicKey !== 'string') {
      res.status(400).json({ error: 'publicKey (PEM format) is required' });
      return;
    }

    if (!validatePublicKey(publicKey)) {
      res.status(400).json({ error: 'Invalid RSA public key' });
      return;
    }

    const fingerprint = keyFingerprint(publicKey);

    const existing = await encKeysRepo.getKeyByFingerprint(tenantId, fingerprint);
    if (existing) {
      res.status(409).json({ error: 'Key already registered', keyId: existing.id });
      return;
    }

    const key = await encKeysRepo.registerKey(tenantId, publicKey, fingerprint);

    res.status(201).json({
      id: key.id,
      fingerprint: key.keyFingerprint,
      status: key.status,
      createdAt: key.createdAt,
    });
  } catch (err) {
    logger.error({ err }, 'Register encryption key failed');
    res.status(500).json({ error: 'Failed to register key' });
  }
});

/**
 * GET /api/v1/encryption/keys
 */
encryptionRouter.get('/keys', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const keys = await encKeysRepo.listKeys(tenantId);

    res.json(keys.map(k => ({
      id: k.id,
      fingerprint: k.keyFingerprint,
      algorithm: k.algorithm,
      status: k.status,
      createdAt: k.createdAt,
      rotatedAt: k.rotatedAt,
    })));
  } catch (err) {
    logger.error({ err }, 'List encryption keys failed');
    res.status(500).json({ error: 'Failed to list keys' });
  }
});

/**
 * POST /api/v1/encryption/keys/:id/rotate
 */
encryptionRouter.post('/keys/:id/rotate', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);

    const oldKey = await encKeysRepo.getKeyById(param(req, 'id'));
    if (!oldKey || oldKey.tenantId !== tenantId) {
      res.status(404).json({ error: 'Key not found' });
      return;
    }

    const { publicKey } = req.body;
    if (!publicKey || !validatePublicKey(publicKey)) {
      res.status(400).json({ error: 'Valid new publicKey (PEM format) is required' });
      return;
    }

    const fingerprint = keyFingerprint(publicKey);
    await encKeysRepo.rotateKey(oldKey.id);
    const newKey = await encKeysRepo.registerKey(tenantId, publicKey, fingerprint);

    res.json({
      rotatedKeyId: oldKey.id,
      newKey: {
        id: newKey.id,
        fingerprint: newKey.keyFingerprint,
        status: newKey.status,
        createdAt: newKey.createdAt,
      },
    });
  } catch (err) {
    logger.error({ err }, 'Rotate encryption key failed');
    res.status(500).json({ error: 'Failed to rotate key' });
  }
});

/**
 * POST /api/v1/encryption/encrypt
 */
encryptionRouter.post('/encrypt', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { value } = req.body;
    if (!value || typeof value !== 'string') {
      res.status(400).json({ error: 'value (string) is required' });
      return;
    }

    const activeKey = await encKeysRepo.getActiveKey(tenantId);
    if (!activeKey) {
      res.status(404).json({ error: 'No active encryption key. Register a key first.' });
      return;
    }

    const encrypted = encryptField(value, activeKey.publicKey);
    res.json({ encrypted, keyFingerprint: activeKey.keyFingerprint, keyId: activeKey.id });
  } catch (err) {
    logger.error({ err }, 'Encrypt value failed');
    res.status(500).json({ error: 'Encryption failed' });
  }
});

/**
 * POST /api/v1/encryption/decrypt-request
 */
encryptionRouter.post('/decrypt-request', async (req: Request, res: Response) => {
  try {
    getTenantId(req); // auth check

    const { encryptedFields } = req.body;
    if (!Array.isArray(encryptedFields)) {
      res.status(400).json({ error: 'encryptedFields (array of base64 strings) is required' });
      return;
    }

    const results = encryptedFields.map((field: string) => {
      try {
        const payload = parseEncryptedField(field);
        return {
          wrappedDek: payload.wrappedDek,
          iv: payload.iv,
          authTag: payload.authTag,
          encryptedData: payload.encryptedData,
          keyFingerprint: payload.keyFingerprint,
          algorithm: payload.algorithm,
        };
      } catch {
        return { error: 'Invalid encrypted field' };
      }
    });

    res.json({ fields: results });
  } catch (err) {
    logger.error({ err }, 'Decrypt request failed');
    res.status(500).json({ error: 'Decrypt request failed' });
  }
});
