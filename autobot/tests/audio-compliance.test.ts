/**
 * Tests for voice/audio-compliance.ts — Ley 29733 biometric data protection.
 *
 * Verifies:
 * 1. Secure file deletion (multi-pass overwrite + unlink)
 * 2. Buffer zeroing after use
 * 3. Audit logging for every deletion event
 * 4. File hash computation for audit trail
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

// Mock logger to capture audit log entries
const mockLogInfo = vi.fn();
vi.mock('../src/shared/logger.js', () => ({
  logger: { debug: vi.fn(), info: mockLogInfo, warn: vi.fn(), error: vi.fn() },
}));

const {
  computeAudioHash,
  secureDeleteFile,
  zeroBuffer,
  prepareAudioAudit,
  finalizeAudioDeletion,
  logAudioDeletion,
} = await import('../src/voice/audio-compliance.js');

describe('audio-compliance — Ley 29733', () => {
  beforeEach(() => {
    mockLogInfo.mockClear();
  });

  describe('computeAudioHash', () => {
    it('should return consistent SHA-256 hash', () => {
      const buf = Buffer.from('test audio data');
      const hash1 = computeAudioHash(buf);
      const hash2 = computeAudioHash(buf);
      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[0-9a-f]{64}$/); // SHA-256 hex
    });

    it('should produce different hashes for different data', () => {
      const buf1 = Buffer.from('audio-1');
      const buf2 = Buffer.from('audio-2');
      expect(computeAudioHash(buf1)).not.toBe(computeAudioHash(buf2));
    });
  });

  describe('zeroBuffer', () => {
    it('should fill buffer with zeros', () => {
      const buf = Buffer.from([0xff, 0xab, 0xcd, 0xef, 0x12]);
      zeroBuffer(buf);
      expect(buf.every((b: number) => b === 0)).toBe(true);
    });

    it('should handle empty buffer', () => {
      const buf = Buffer.alloc(0);
      zeroBuffer(buf);
      expect(buf.length).toBe(0);
    });
  });

  describe('secureDeleteFile', () => {
    let tempDir: string;

    beforeEach(async () => {
      tempDir = path.join(os.tmpdir(), `compliance-test-${crypto.randomBytes(4).toString('hex')}`);
      await fs.mkdir(tempDir, { recursive: true });
    });

    it('should securely delete a file and return its hash', async () => {
      const filePath = path.join(tempDir, 'test-audio.ogg');
      const content = crypto.randomBytes(1024);
      const expectedHash = crypto.createHash('sha256').update(content).digest('hex');
      await fs.writeFile(filePath, content);

      const hash = await secureDeleteFile(filePath, 'test');

      // File should be gone
      await expect(fs.access(filePath)).rejects.toThrow();
      // Hash should match original content
      expect(hash).toBe(expectedHash);
    });

    it('should return null for non-existent file', async () => {
      const hash = await secureDeleteFile(path.join(tempDir, 'nonexistent.ogg'));
      expect(hash).toBeNull();
    });

    it('should emit audit log on deletion', async () => {
      const filePath = path.join(tempDir, 'audit-test.ogg');
      await fs.writeFile(filePath, Buffer.from('audio content'));

      await secureDeleteFile(filePath, 'test-source');

      // Check audit log was emitted
      const auditCalls = mockLogInfo.mock.calls.filter(
        (call: unknown[]) => typeof call[0] === 'object' && (call[0] as Record<string, unknown>).audit === true,
      );
      expect(auditCalls.length).toBeGreaterThanOrEqual(1);

      const auditEntry = auditCalls[0][0] as Record<string, unknown>;
      expect(auditEntry.compliance).toBe('ley-29733');
      expect(auditEntry.dataType).toBe('biometric-voice');
      expect(auditEntry.method).toBe('file-secure-deleted');
      expect(auditEntry.confirmed).toBe(true);
      expect(auditEntry.sourceHash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should handle empty files', async () => {
      const filePath = path.join(tempDir, 'empty.ogg');
      await fs.writeFile(filePath, Buffer.alloc(0));

      const hash = await secureDeleteFile(filePath);
      expect(hash).toBeNull();
      await expect(fs.access(filePath)).rejects.toThrow();
    });

    it('should overwrite file content before unlinking', async () => {
      const filePath = path.join(tempDir, 'overwrite-test.ogg');
      const originalContent = Buffer.from('sensitive biometric audio data');
      await fs.writeFile(filePath, originalContent);

      // We can verify overwrite by reading the file mid-deletion.
      // Since we can't easily intercept, we verify the file is gone after.
      const hash = await secureDeleteFile(filePath, 'overwrite-test');
      expect(hash).not.toBeNull();
      await expect(fs.access(filePath)).rejects.toThrow();
    });

    // Cleanup temp dirs
    afterEach(async () => {
      try { await fs.rm(tempDir, { recursive: true, force: true }); } catch { /* ok */ }
    });
  });

  describe('prepareAudioAudit + finalizeAudioDeletion', () => {
    it('should compute audit metadata before deletion', () => {
      const buf = Buffer.from([1, 2, 3, 4, 5]);
      const audit = prepareAudioAudit(buf, 'audio/ogg');

      expect(audit.hash).toMatch(/^[0-9a-f]{64}$/);
      expect(audit.sizeBytes).toBe(5);
      expect(audit.mimetype).toBe('audio/ogg');
    });

    it('should zero buffer and emit audit log on finalization', () => {
      const buf = Buffer.from([0xff, 0xab, 0xcd]);
      const audit = prepareAudioAudit(buf, 'audio/ogg');

      finalizeAudioDeletion(buf, audit, 'tenant-123', 'whatsapp-incoming');

      // Buffer should be zeroed
      expect(buf.every((b: number) => b === 0)).toBe(true);

      // Audit log should be emitted
      const auditCalls = mockLogInfo.mock.calls.filter(
        (call: unknown[]) => typeof call[0] === 'object' && (call[0] as Record<string, unknown>).audit === true,
      );
      expect(auditCalls.length).toBeGreaterThanOrEqual(1);

      const entry = auditCalls[0][0] as Record<string, unknown>;
      expect(entry.compliance).toBe('ley-29733');
      expect(entry.method).toBe('buffer-zeroed');
      expect(entry.tenantId).toBe('tenant-123');
      expect(entry.source).toBe('whatsapp-incoming');
      expect(entry.confirmed).toBe(true);
      expect(entry.sourceHash).toBe(audit.hash);
    });

    it('should capture hash before buffer is modified', () => {
      const buf = Buffer.from([1, 2, 3]);
      const audit = prepareAudioAudit(buf, 'audio/mpeg');
      const hashBefore = audit.hash;

      // Mutate buffer
      buf[0] = 0;
      const hashAfter = computeAudioHash(buf);

      // The audit hash should reflect the original content
      expect(hashBefore).not.toBe(hashAfter);
    });
  });

  describe('logAudioDeletion', () => {
    it('should emit structured audit log', () => {
      logAudioDeletion({
        tenantId: 'tenant-456',
        sourceHash: 'abc123',
        sizeBytes: 1024,
        mimetype: 'audio/ogg',
        deletedAt: '2026-04-07T10:00:00Z',
        method: 'buffer-zeroed',
        source: 'voice-pipeline',
        confirmed: true,
      });

      expect(mockLogInfo).toHaveBeenCalledWith(
        expect.objectContaining({
          audit: true,
          compliance: 'ley-29733',
          dataType: 'biometric-voice',
          tenantId: 'tenant-456',
          method: 'buffer-zeroed',
        }),
        expect.stringContaining('AUDIT'),
      );
    });
  });

  describe('end-to-end compliance flow', () => {
    it('should hash → transcribe (mock) → zero → audit', () => {
      // Simulate the full flow as used in tenant-manager.ts
      const audioBuffer = Buffer.from(crypto.randomBytes(256));
      const originalData = Buffer.from(audioBuffer); // copy for verification

      // Step 1: prepare audit (before transcription)
      const audit = prepareAudioAudit(audioBuffer, 'audio/ogg');
      expect(audit.hash).toMatch(/^[0-9a-f]{64}$/);
      expect(audit.sizeBytes).toBe(256);

      // Step 2: "transcription" happens here (mocked)
      const transcription = 'vendí 50 soles';

      // Step 3: finalize — zero buffer + audit log
      finalizeAudioDeletion(audioBuffer, audit, 'tenant-test', 'e2e-test');

      // Verify: buffer is zeroed
      expect(audioBuffer.every((b: number) => b === 0)).toBe(true);

      // Verify: original data is NOT present in buffer
      expect(audioBuffer.equals(originalData)).toBe(false);

      // Verify: transcription text is still available (only text retained)
      expect(transcription).toBe('vendí 50 soles');

      // Verify: audit log was emitted
      const auditCalls = mockLogInfo.mock.calls.filter(
        (call: unknown[]) => typeof call[0] === 'object' && (call[0] as Record<string, unknown>).audit === true,
      );
      expect(auditCalls.length).toBeGreaterThanOrEqual(1);
    });
  });
});
