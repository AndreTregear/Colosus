import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import { S3_BUCKET_RAW, S3_BUCKET_PROCESSED, MEDIA_MAX_VIDEO_SIZE_MB } from '../../config.js';
import { saveMedia, deleteMedia } from '../../media/storage.js';
import { getPresignedUrl, deleteObject } from '../../media/s3-client.js';
import { enqueueMediaJob } from '../../media/media-queue.js';
import * as mediaAssetsRepo from '../../db/media-assets-repo.js';
import { getTenantId } from '../../shared/validate.js';
import { logger } from '../../shared/logger.js';
import type { MediaCategory, MediaProcessingJob } from '../../media/types.js';

export const mediaRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MEDIA_MAX_VIDEO_SIZE_MB * 1024 * 1024 },
});

function param(req: Request, name: string): string {
  const v = req.params[name];
  return Array.isArray(v) ? v[0] : v;
}

function mimeToCategory(mime: string): MediaCategory {
  if (mime.startsWith('audio/')) return 'voice';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('image/')) return 'image';
  return 'document';
}

function mimeToJobType(mime: string): MediaProcessingJob['type'] | null {
  if (mime.startsWith('audio/')) return 'transcode-audio';
  if (mime.startsWith('video/')) return 'transcode-video';
  return null;
}

/**
 * POST /api/v1/media/upload
 */
mediaRouter.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'No file provided' });
      return;
    }

    const category = (req.body.category as MediaCategory) || mimeToCategory(file.mimetype);
    const ext = '.' + (file.originalname.split('.').pop() || 'bin');

    const key = await saveMedia(tenantId, category, file.buffer, ext, file.mimetype);

    const asset = await mediaAssetsRepo.createAsset({
      tenantId,
      category,
      originalKey: key,
      mimeType: file.mimetype,
      sizeBytes: file.size,
    });

    const jobType = mimeToJobType(file.mimetype);
    if (jobType) {
      await enqueueMediaJob({
        assetId: asset.id,
        tenantId,
        type: jobType,
        originalKey: key,
        bucket: S3_BUCKET_RAW,
      });
    } else {
      await mediaAssetsRepo.updateProcessingStatus(asset.id, 'completed');
    }

    res.status(201).json({
      id: asset.id,
      category: asset.category,
      mimeType: asset.mimeType,
      sizeBytes: asset.sizeBytes,
      processingStatus: jobType ? 'pending' : 'completed',
      createdAt: asset.createdAt,
    });
  } catch (err) {
    logger.error({ err }, 'Media upload failed');
    res.status(500).json({ error: 'Upload failed' });
  }
});

/**
 * GET /api/v1/media
 */
mediaRouter.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const category = req.query.category as MediaCategory | undefined;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await mediaAssetsRepo.listAssets(tenantId, { category, limit, offset });
    res.json({ assets: result.assets, total: result.total, limit, offset });
  } catch (err) {
    logger.error({ err }, 'List media failed');
    res.status(500).json({ error: 'Failed to list media' });
  }
});

/**
 * GET /api/v1/media/:id
 */
mediaRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const asset = await mediaAssetsRepo.getAssetById(param(req, 'id'));
    if (!asset) {
      res.status(404).json({ error: 'Asset not found' });
      return;
    }
    res.json(asset);
  } catch (err) {
    logger.error({ err }, 'Get media failed');
    res.status(500).json({ error: 'Failed to get media' });
  }
});

/**
 * GET /api/v1/media/:id/url
 */
mediaRouter.get('/:id/url', async (req: Request, res: Response) => {
  try {
    const asset = await mediaAssetsRepo.getAssetById(param(req, 'id'));
    if (!asset) {
      res.status(404).json({ error: 'Asset not found' });
      return;
    }

    const bucket = asset.processedKey ? S3_BUCKET_PROCESSED : S3_BUCKET_RAW;
    const key = asset.processedKey ?? asset.originalKey;
    const url = await getPresignedUrl(bucket, key);

    res.json({ url, expiresIn: 300 });
  } catch (err) {
    logger.error({ err }, 'Get media URL failed');
    res.status(500).json({ error: 'Failed to get URL' });
  }
});

/**
 * DELETE /api/v1/media/:id
 */
mediaRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const asset = await mediaAssetsRepo.deleteAsset(param(req, 'id'));
    if (!asset) {
      res.status(404).json({ error: 'Asset not found' });
      return;
    }

    await deleteMedia(asset.originalKey, S3_BUCKET_RAW);
    if (asset.processedKey) {
      await deleteObject(S3_BUCKET_PROCESSED, asset.processedKey);
    }
    if (asset.thumbnailKey) {
      await deleteObject(S3_BUCKET_PROCESSED, asset.thumbnailKey);
    }

    res.json({ deleted: true, id: asset.id });
  } catch (err) {
    logger.error({ err }, 'Delete media failed');
    res.status(500).json({ error: 'Delete failed' });
  }
});
