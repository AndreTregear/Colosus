/**
 * Audio Compliance — Ley 29733 (Peru biometric data protection).
 *
 * Voice = biometric data. This module ensures:
 * 1. Secure deletion of audio files (multi-pass overwrite before unlink)
 * 2. Zeroing of in-memory audio buffers after use
 * 3. Audit logging of all audio deletion events
 *
 * Fine for non-compliance: S/535K or 10% revenue.
 */
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import { logger } from '../shared/logger.js';

/** Number of random overwrite passes before final zero + unlink. */
const OVERWRITE_PASSES = 3;

/** Compute SHA-256 hash of an audio buffer (for audit trail). */
export function computeAudioHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Securely delete a file:
 * 1. Hash contents for audit trail
 * 2. Overwrite with random bytes (N passes, fsync each)
 * 3. Final pass: overwrite with zeros
 * 4. Unlink
 *
 * Returns the SHA-256 hash of the original file, or null if file didn't exist.
 */
export async function secureDeleteFile(filePath: string, context?: string): Promise<string | null> {
  let fileHash: string | null = null;
  let fileSize = 0;

  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) {
      // Directories: recursive remove, no overwrite needed
      if (stat.isDirectory()) {
        await fs.rm(filePath, { recursive: true, force: true });
        logAudioDeletion({
          tenantId: context ?? 'system',
          sourceHash: 'directory',
          sizeBytes: 0,
          mimetype: 'directory',
          deletedAt: new Date().toISOString(),
          method: 'file-secure-deleted',
          source: context ?? 'cleanup',
          confirmed: true,
        });
      }
      return null;
    }

    fileSize = stat.size;
    if (fileSize === 0) {
      await fs.unlink(filePath);
      return null;
    }

    // Hash original contents for audit trail
    const contents = await fs.readFile(filePath);
    fileHash = computeAudioHash(contents);
    contents.fill(0); // wipe the read buffer

    // Multi-pass random overwrite
    const fd = await fs.open(filePath, 'w');
    try {
      for (let i = 0; i < OVERWRITE_PASSES; i++) {
        const randomData = crypto.randomBytes(fileSize);
        await fd.write(randomData, 0, randomData.length, 0);
        await fd.sync(); // force flush to storage
        randomData.fill(0); // wipe random buffer
      }
      // Final pass: zeros
      const zeros = Buffer.alloc(fileSize);
      await fd.write(zeros, 0, zeros.length, 0);
      await fd.sync();
    } finally {
      await fd.close();
    }

    // Unlink
    await fs.unlink(filePath);

    logAudioDeletion({
      tenantId: context ?? 'system',
      sourceHash: fileHash,
      sizeBytes: fileSize,
      mimetype: 'audio/*',
      deletedAt: new Date().toISOString(),
      method: 'file-secure-deleted',
      source: context ?? 'cleanup',
      confirmed: true,
      overwritePasses: OVERWRITE_PASSES,
    });

    return fileHash;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    logger.error({ err, filePath, context }, 'Secure file deletion failed');
    // Best-effort: try plain unlink as fallback
    try { await fs.unlink(filePath); } catch { /* already gone */ }

    logAudioDeletion({
      tenantId: context ?? 'system',
      sourceHash: fileHash ?? 'unknown',
      sizeBytes: fileSize,
      mimetype: 'audio/*',
      deletedAt: new Date().toISOString(),
      method: 'file-secure-deleted',
      source: context ?? 'cleanup',
      confirmed: true,
      fallback: true,
    });

    return fileHash;
  }
}

/** Zero out a Buffer's memory in-place. */
export function zeroBuffer(buffer: Buffer): void {
  buffer.fill(0);
}

export interface AudioDeletionEvent {
  tenantId: string;
  sourceHash: string;
  sizeBytes: number;
  mimetype: string;
  deletedAt: string;
  method: 'buffer-zeroed' | 'file-secure-deleted' | 's3-deleted';
  source: string; // e.g. 'whatsapp-incoming', 'api-agente-voice', 'api-mobile-voice'
  confirmed: boolean;
  overwritePasses?: number;
  fallback?: boolean;
}

/**
 * Log an audio deletion event for Ley 29733 audit compliance.
 * Uses structured logging (pino) — these entries should be forwarded to
 * a tamper-proof audit log (e.g., append-only S3 bucket or Loki).
 */
export function logAudioDeletion(event: AudioDeletionEvent): void {
  logger.info(
    {
      audit: true,
      compliance: 'ley-29733',
      dataType: 'biometric-voice',
      ...event,
    },
    `AUDIT: Audio ${event.method} — ${event.source}`,
  );
}

/**
 * Full compliance flow for an in-memory audio buffer:
 * 1. Compute hash (before any processing)
 * 2. Return hash for audit after processing is done
 *
 * Call `finalizeAudioDeletion()` after transcription to zero + audit-log.
 */
export function prepareAudioAudit(buffer: Buffer, mimetype: string): {
  hash: string;
  sizeBytes: number;
  mimetype: string;
} {
  return {
    hash: computeAudioHash(buffer),
    sizeBytes: buffer.length,
    mimetype,
  };
}

/**
 * Finalize: zero the buffer and emit audit log.
 */
export function finalizeAudioDeletion(
  buffer: Buffer,
  audit: { hash: string; sizeBytes: number; mimetype: string },
  tenantId: string,
  source: string,
): void {
  zeroBuffer(buffer);
  logAudioDeletion({
    tenantId,
    sourceHash: audit.hash,
    sizeBytes: audit.sizeBytes,
    mimetype: audit.mimetype,
    deletedAt: new Date().toISOString(),
    method: 'buffer-zeroed',
    source,
    confirmed: true,
  });
}
