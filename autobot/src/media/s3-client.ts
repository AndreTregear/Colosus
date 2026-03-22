import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
  type PutObjectCommandInput,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'node:crypto';
import {
  S3_ENDPOINT,
  S3_PORT,
  S3_ACCESS_KEY,
  S3_SECRET_KEY,
  S3_USE_SSL,
  S3_BUCKET_RAW,
  S3_BUCKET_PROCESSED,
  S3_BUCKET_EXPORTS,
  S3_PRESIGN_TTL,
} from '../config.js';
import { logger } from '../shared/logger.js';

const PROTOCOL = S3_USE_SSL ? 'https' : 'http';

let client: S3Client | null = null;

export function getS3Client(): S3Client {
  if (!client) {
    const endpoint = `${PROTOCOL}://${S3_ENDPOINT}:${S3_PORT}`;
    logger.debug({ endpoint }, 'Initializing S3 client');
    client = new S3Client({
      endpoint,
      region: 'us-east-1', // MinIO ignores region but SDK requires it
      credentials: {
        accessKeyId: S3_ACCESS_KEY,
        secretAccessKey: S3_SECRET_KEY,
      },
      forcePathStyle: true, // Required for MinIO
    });
  }
  return client;
}

/** Ensure a bucket exists, creating it if necessary. */
async function ensureBucket(bucket: string): Promise<void> {
  const s3 = getS3Client();
  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucket }));
    logger.debug({ bucket }, 'S3 bucket already exists');
  } catch {
    logger.info({ bucket }, 'Creating S3 bucket');
    await s3.send(new CreateBucketCommand({ Bucket: bucket }));
    logger.debug({ bucket }, 'S3 bucket created');
  }
}

/** Create all required buckets on startup. */
export async function ensureBuckets(): Promise<void> {
  await ensureBucket(S3_BUCKET_RAW);
  await ensureBucket(S3_BUCKET_PROCESSED);
  await ensureBucket(S3_BUCKET_EXPORTS);
  logger.info('S3 buckets verified');
}

/** Generate a unique S3 key for a tenant media file. */
export function generateKey(tenantId: string, category: string, extension: string): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(6).toString('hex');
  return `${tenantId}/${category}/${timestamp}-${random}${extension}`;
}

/** Upload a buffer to S3. */
export async function putObject(
  bucket: string,
  key: string,
  body: Buffer,
  contentType?: string,
): Promise<void> {
  logger.debug({ bucket, key, sizeBytes: body.length, contentType }, 'S3 putObject');
  const params: PutObjectCommandInput = { Bucket: bucket, Key: key, Body: body };
  if (contentType) params.ContentType = contentType;
  await getS3Client().send(new PutObjectCommand(params));
  logger.debug({ bucket, key }, 'S3 putObject complete');
}

/** Download an object from S3 as a Buffer. */
export async function getObject(bucket: string, key: string): Promise<Buffer> {
  logger.debug({ bucket, key }, 'S3 getObject');
  const result = await getS3Client().send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const stream = result.Body;
  if (!stream) throw new Error(`Empty body for ${bucket}/${key}`);
  // Collect stream into buffer
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

/** Get an object as a readable stream (for streaming responses). */
export async function getObjectStream(
  bucket: string,
  key: string,
  range?: string,
): Promise<{ body: AsyncIterable<Uint8Array>; contentLength?: number; contentRange?: string; contentType?: string }> {
  const params: { Bucket: string; Key: string; Range?: string } = { Bucket: bucket, Key: key };
  if (range) params.Range = range;
  const result = await getS3Client().send(new GetObjectCommand(params));
  return {
    body: result.Body as AsyncIterable<Uint8Array>,
    contentLength: result.ContentLength,
    contentRange: result.ContentRange,
    contentType: result.ContentType,
  };
}

/** Generate a presigned URL for direct download. */
export async function getPresignedUrl(
  bucket: string,
  key: string,
  expiresIn: number = S3_PRESIGN_TTL,
): Promise<string> {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(getS3Client(), command, { expiresIn });
}

/** Delete an object from S3. Silently ignores missing objects. */
export async function deleteObject(bucket: string, key: string): Promise<void> {
  logger.debug({ bucket, key }, 'S3 deleteObject');
  try {
    await getS3Client().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  } catch {
    // Ignore — object may not exist
  }
}

/** Get the size of an object without downloading it. */
export async function headObject(
  bucket: string,
  key: string,
): Promise<{ contentLength: number; contentType?: string } | null> {
  try {
    const result = await getS3Client().send(
      new GetObjectCommand({ Bucket: bucket, Key: key }),
    );
    return {
      contentLength: result.ContentLength ?? 0,
      contentType: result.ContentType,
    };
  } catch {
    return null;
  }
}
