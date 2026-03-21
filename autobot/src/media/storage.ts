import crypto from 'node:crypto';
import { S3_BUCKET_RAW, S3_PRESIGN_TTL } from '../config.js';
import { putObject, getObject as s3GetObject, deleteObject, getPresignedUrl, generateKey } from './s3-client.js';

/** Backward-compatible media category type. */
export type MediaCategory = 'products' | 'customer-media' | 'voice' | 'image' | 'video' | 'document' | 'product-image';

/**
 * Save a buffer to S3 (MinIO). Returns the S3 key (relative path).
 * Drop-in replacement for the old local filesystem saveMedia().
 */
export async function saveMedia(
  tenantId: string,
  category: MediaCategory,
  buffer: Buffer,
  extension: string,
  contentType?: string,
): Promise<string> {
  if (!/^\.[a-zA-Z0-9]+$/.test(extension)) {
    throw new Error('Invalid file extension');
  }
  const key = generateKey(tenantId, category, extension);
  await putObject(S3_BUCKET_RAW, key, buffer, contentType);
  return key;
}

/** Get a presigned download URL for a media file. */
export function getMediaUrl(key: string): Promise<string> {
  return getPresignedUrl(S3_BUCKET_RAW, key, S3_PRESIGN_TTL);
}

/** Download media from S3 as a Buffer. */
export async function getMediaBuffer(key: string, bucket: string = S3_BUCKET_RAW): Promise<Buffer> {
  return s3GetObject(bucket, key);
}

/** Delete a media file from S3. Silently ignores missing files. */
export async function deleteMedia(key: string, bucket: string = S3_BUCKET_RAW): Promise<void> {
  await deleteObject(bucket, key);
}
