export type MediaCategory = 'voice' | 'image' | 'video' | 'document' | 'product-image';

export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface MediaAsset {
  id: string;
  tenantId: string;
  category: MediaCategory;
  originalKey: string;
  processedKey: string | null;
  mimeType: string;
  sizeBytes: number;
  durationMs: number | null;
  width: number | null;
  height: number | null;
  thumbnailKey: string | null;
  transcription: string | null;
  processingStatus: ProcessingStatus;
  metadata: Record<string, unknown>;
  encryptionKeyId: string | null;
  createdAt: string;
}

export interface MediaProbe {
  durationMs: number;
  width: number;
  height: number;
  codec: string;
  bitrate: number;
  sampleRate?: number;
  channels?: number;
}

export interface TranscodeOpts {
  format: string;
  audioBitrate?: string;
  videoBitrate?: string;
  resolution?: '360p' | '720p' | '1080p';
  audioOnly?: boolean;
}

export interface HLSOpts {
  segmentDuration: number; // seconds per segment
  resolution?: '360p' | '720p';
}

export interface EncryptedPayload {
  encryptedData: string;  // base64
  wrappedDek: string;     // base64 — DEK encrypted with tenant's RSA public key
  iv: string;             // base64
  authTag: string;        // base64
  keyFingerprint: string; // SHA-256 of the public key used
  algorithm: string;      // 'aes-256-gcm'
}

export interface MediaProcessingJob {
  assetId: string;
  tenantId: string;
  type: 'transcode-audio' | 'transcode-video' | 'generate-thumbnail' | 'extract-audio';
  originalKey: string;
  bucket: string;
}
