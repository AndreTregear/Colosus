/**
 * @deprecated Use src/media/storage.ts for new code.
 * This module is kept for backward compatibility during the migration window.
 * Local-filesystem operations are preserved so existing files can still be read
 * while we migrate to S3/MinIO.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { UPLOADS_DIR } from '../config.js';

const UPLOADS_ROOT = path.resolve(UPLOADS_DIR);

export type MediaCategory = 'products' | 'customer-media';

async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

/** @deprecated Use saveMedia from src/media/storage.ts */
export async function saveMedia(
  tenantId: string,
  category: MediaCategory,
  buffer: Buffer,
  extension: string,
): Promise<string> {
  const dir = path.join(UPLOADS_ROOT, tenantId, category);
  await ensureDir(dir);
  if (!/^\.[a-zA-Z0-9]+$/.test(extension)) {
    throw new Error('Invalid file extension');
  }
  const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${extension}`;
  const fullPath = path.join(dir, filename);
  await fs.writeFile(fullPath, buffer);
  return path.posix.join(tenantId, category, filename);
}

/** Get absolute filesystem path from a relative media path. Rejects path traversal. */
export function getAbsolutePath(relativePath: string): string {
  const fullPath = path.resolve(UPLOADS_ROOT, relativePath);
  if (!fullPath.startsWith(UPLOADS_ROOT)) {
    throw new Error('Invalid media path');
  }
  return fullPath;
}

/** @deprecated Use deleteMedia from src/media/storage.ts */
export async function deleteMedia(relativePath: string): Promise<void> {
  const fullPath = getAbsolutePath(relativePath);
  await fs.unlink(fullPath).catch(() => {});
}

/** @deprecated Use getMediaUrl from src/media/storage.ts */
export function getMediaUrl(relativePath: string): string {
  return `/media/${relativePath}`;
}

export const UPLOADS_ROOT_PATH = UPLOADS_ROOT;
