import fs from 'node:fs/promises';
import { S3_BUCKET_RAW, S3_BUCKET_PROCESSED } from '../../config.js';
import { getObject, putObject } from '../s3-client.js';
import * as mediaAssetsRepo from '../../db/media-assets-repo.js';
import { createTempPath, cleanupTemp, probe, transcode } from './ffmpeg.js';
import { logger } from '../../shared/logger.js';

/**
 * Process an audio file:
 * 1. Download from S3
 * 2. Probe for metadata (duration, codec, etc.)
 * 3. Transcode to OGG/Opus (optimal for storage + streaming)
 * 4. Upload processed version to S3
 * 5. Update media_assets record
 */
export async function processAudio(assetId: string, originalKey: string): Promise<void> {
  const inputPath = await createTempPath('.input');
  const outputPath = await createTempPath('.ogg');

  try {
    // Download original from S3
    const buffer = await getObject(S3_BUCKET_RAW, originalKey);
    await fs.writeFile(inputPath, buffer);

    // Probe metadata
    const meta = await probe(inputPath);
    logger.debug({ assetId, meta }, 'Audio probe complete');

    // Transcode to OGG/Opus
    await transcode(inputPath, outputPath, {
      format: 'opus',
      audioBitrate: '64k',
    });

    // Upload processed file
    const processedKey = originalKey.replace(/\.[^.]+$/, '.ogg');
    const processedBuffer = await fs.readFile(outputPath);
    await putObject(S3_BUCKET_PROCESSED, processedKey, processedBuffer, 'audio/ogg');

    // Update asset record
    await mediaAssetsRepo.updateProcessingStatus(assetId, 'completed', {
      processedKey,
      durationMs: meta.durationMs,
    });

    logger.info({ assetId, processedKey, durationMs: meta.durationMs }, 'Audio processing complete');
  } catch (err) {
    logger.error({ assetId, err }, 'Audio processing failed');
    await mediaAssetsRepo.updateProcessingStatus(assetId, 'failed');
    throw err;
  } finally {
    await cleanupTemp(inputPath, outputPath);
  }
}
