import fs from 'node:fs/promises';
import path from 'node:path';
import { S3_BUCKET_RAW, S3_BUCKET_PROCESSED } from '../../config.js';
import { getObject, putObject } from '../s3-client.js';
import * as mediaAssetsRepo from '../../db/media-assets-repo.js';
import {
  createTempPath,
  createTempDir,
  cleanupTemp,
  probe,
  transcode,
  generateThumbnail,
  generateHLS,
} from './ffmpeg.js';
import { logger } from '../../shared/logger.js';

/**
 * Process a video file:
 * 1. Download from S3
 * 2. Probe for metadata
 * 3. Transcode to MP4/H.264 (web-compatible)
 * 4. Generate thumbnail at 1s
 * 5. Generate HLS segments for adaptive streaming
 * 6. Extract audio track (for future transcription)
 * 7. Upload everything to S3
 * 8. Update media_assets record
 */
export async function processVideo(assetId: string, originalKey: string): Promise<void> {
  const inputPath = await createTempPath('.input');
  const mp4Path = await createTempPath('.mp4');
  const thumbPath = await createTempPath('.jpg');
  const audioPath = await createTempPath('.ogg');
  const hlsDir = await createTempDir();

  try {
    // Download original from S3
    const buffer = await getObject(S3_BUCKET_RAW, originalKey);
    await fs.writeFile(inputPath, buffer);

    // Probe metadata
    const meta = await probe(inputPath);
    logger.debug({ assetId, meta }, 'Video probe complete');

    // Determine base key (without extension)
    const baseKey = originalKey.replace(/\.[^.]+$/, '');

    // 1. Transcode to MP4
    await transcode(inputPath, mp4Path, {
      format: 'mp4',
      resolution: '720p',
      videoBitrate: '1500k',
      audioBitrate: '128k',
    });
    const mp4Buffer = await fs.readFile(mp4Path);
    const processedKey = `${baseKey}.mp4`;
    await putObject(S3_BUCKET_PROCESSED, processedKey, mp4Buffer, 'video/mp4');

    // 2. Generate thumbnail
    const thumbnailKey = `${baseKey}_thumb.jpg`;
    await generateThumbnail(inputPath, thumbPath, 1);
    const thumbBuffer = await fs.readFile(thumbPath);
    await putObject(S3_BUCKET_PROCESSED, thumbnailKey, thumbBuffer, 'image/jpeg');

    // 3. Generate HLS segments
    const hlsFiles = await generateHLS(inputPath, hlsDir, { segmentDuration: 6, resolution: '720p' });
    for (const file of hlsFiles) {
      const filePath = path.join(hlsDir, file);
      const fileBuffer = await fs.readFile(filePath);
      const contentType = file.endsWith('.m3u8') ? 'application/vnd.apple.mpegurl' : 'video/mp2t';
      await putObject(S3_BUCKET_PROCESSED, `${baseKey}/hls/${file}`, fileBuffer, contentType);
    }

    // 4. Extract audio track
    try {
      await transcode(inputPath, audioPath, {
        format: 'opus',
        audioBitrate: '64k',
        audioOnly: true,
      });
      const audioBuffer = await fs.readFile(audioPath);
      await putObject(S3_BUCKET_PROCESSED, `${baseKey}_audio.ogg`, audioBuffer, 'audio/ogg');
    } catch (err) {
      logger.warn({ assetId, err }, 'Audio extraction failed (video may have no audio track)');
    }

    // Update asset record
    await mediaAssetsRepo.updateProcessingStatus(assetId, 'completed', {
      processedKey,
      thumbnailKey,
      durationMs: meta.durationMs,
      width: meta.width,
      height: meta.height,
    });

    logger.info({
      assetId,
      processedKey,
      thumbnailKey,
      durationMs: meta.durationMs,
      hlsSegments: hlsFiles.length,
    }, 'Video processing complete');
  } catch (err) {
    logger.error({ assetId, err }, 'Video processing failed');
    await mediaAssetsRepo.updateProcessingStatus(assetId, 'failed');
    throw err;
  } finally {
    await cleanupTemp(inputPath, mp4Path, thumbPath, audioPath, hlsDir);
  }
}
