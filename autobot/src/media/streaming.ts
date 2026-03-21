import { Router, type Request, type Response } from 'express';
import { S3_BUCKET_PROCESSED, S3_BUCKET_RAW } from '../config.js';
import { getObjectStream, headObject, getPresignedUrl } from './s3-client.js';
import * as mediaAssetsRepo from '../db/media-assets-repo.js';
import { logger } from '../shared/logger.js';

export const streamRouter = Router();

/** Safely extract a single string param from Express v5 params. */
function param(req: Request, name: string): string {
  const v = req.params[name];
  return Array.isArray(v) ? v[0] : v;
}

/**
 * GET /api/v1/stream/:assetId
 * Stream media with HTTP Range support (audio/video seeking).
 */
streamRouter.get('/:assetId', async (req: Request, res: Response) => {
  const assetId = param(req, 'assetId');
  try {
    const asset = await mediaAssetsRepo.getAssetById(assetId);
    if (!asset) {
      res.status(404).json({ error: 'Asset not found' });
      return;
    }

    // Prefer processed version, fall back to original
    const bucket = asset.processedKey ? S3_BUCKET_PROCESSED : S3_BUCKET_RAW;
    const key = asset.processedKey ?? asset.originalKey;

    const head = await headObject(bucket, key);
    if (!head) {
      res.status(404).json({ error: 'Media file not found in storage' });
      return;
    }

    const totalSize = head.contentLength;
    const contentType = head.contentType ?? asset.mimeType;
    const rangeHeader = req.headers.range;

    if (rangeHeader) {
      const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
      if (!match) {
        res.status(416).set('Content-Range', `bytes */${totalSize}`).end();
        return;
      }

      const start = parseInt(match[1], 10);
      const end = match[2] ? parseInt(match[2], 10) : totalSize - 1;

      if (start >= totalSize || end >= totalSize) {
        res.status(416).set('Content-Range', `bytes */${totalSize}`).end();
        return;
      }

      const chunkSize = end - start + 1;
      const stream = await getObjectStream(bucket, key, `bytes=${start}-${end}`);

      res.status(206);
      res.set({
        'Content-Range': `bytes ${start}-${end}/${totalSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': String(chunkSize),
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      });

      for await (const chunk of stream.body) {
        res.write(chunk);
      }
      res.end();
    } else {
      const stream = await getObjectStream(bucket, key);

      res.set({
        'Content-Length': String(totalSize),
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=3600',
      });

      for await (const chunk of stream.body) {
        res.write(chunk);
      }
      res.end();
    }
  } catch (err) {
    logger.error({ err, assetId }, 'Stream error');
    if (!res.headersSent) {
      res.status(500).json({ error: 'Stream failed' });
    }
  }
});

/**
 * GET /api/v1/stream/:assetId/hls/:file
 * Serve HLS playlist (.m3u8) and segments (.ts) from S3.
 */
streamRouter.get('/:assetId/hls/:file', async (req: Request, res: Response) => {
  const assetId = param(req, 'assetId');
  const filename = param(req, 'file');
  try {
    const asset = await mediaAssetsRepo.getAssetById(assetId);
    if (!asset) {
      res.status(404).json({ error: 'Asset not found' });
      return;
    }

    if (!/^[\w.-]+$/.test(filename)) {
      res.status(400).json({ error: 'Invalid filename' });
      return;
    }

    const baseKey = asset.originalKey.replace(/\.[^.]+$/, '');
    const hlsKey = `${baseKey}/hls/${filename}`;

    const contentType = filename.endsWith('.m3u8')
      ? 'application/vnd.apple.mpegurl'
      : 'video/mp2t';

    const stream = await getObjectStream(S3_BUCKET_PROCESSED, hlsKey);

    res.set({
      'Content-Type': contentType,
      'Cache-Control': filename.endsWith('.m3u8') ? 'no-cache' : 'public, max-age=86400',
    });

    for await (const chunk of stream.body) {
      res.write(chunk);
    }
    res.end();
  } catch (err) {
    logger.error({ err, assetId, file: filename }, 'HLS stream error');
    if (!res.headersSent) {
      res.status(404).json({ error: 'HLS segment not found' });
    }
  }
});

/**
 * GET /api/v1/stream/:assetId/thumbnail
 * Serve thumbnail image.
 */
streamRouter.get('/:assetId/thumbnail', async (req: Request, res: Response) => {
  const assetId = param(req, 'assetId');
  try {
    const asset = await mediaAssetsRepo.getAssetById(assetId);
    if (!asset || !asset.thumbnailKey) {
      res.status(404).json({ error: 'Thumbnail not found' });
      return;
    }

    const url = await getPresignedUrl(S3_BUCKET_PROCESSED, asset.thumbnailKey, 3600);
    res.redirect(302, url);
  } catch (err) {
    logger.error({ err, assetId }, 'Thumbnail error');
    if (!res.headersSent) {
      res.status(500).json({ error: 'Thumbnail failed' });
    }
  }
});
