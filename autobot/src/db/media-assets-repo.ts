import { query, queryOne } from './pool.js';
import { createRowMapper } from './row-mapper.js';
import type { MediaAsset, MediaCategory, ProcessingStatus } from '../media/types.js';

const rowToAsset = createRowMapper<MediaAsset>({
  id: 'id',
  tenantId: 'tenant_id',
  category: 'category',
  originalKey: 'original_key',
  processedKey: 'processed_key',
  mimeType: 'mime_type',
  sizeBytes: { col: 'size_bytes', type: 'number' },
  durationMs: { col: 'duration_ms', type: 'number?' },
  width: { col: 'width', type: 'number?' },
  height: { col: 'height', type: 'number?' },
  thumbnailKey: 'thumbnail_key',
  transcription: 'transcription',
  processingStatus: 'processing_status',
  metadata: { col: 'metadata', type: 'json', default: {} },
  encryptionTenantId: 'encryption_tenant_id',
  createdAt: { col: 'created_at', type: 'date' },
});

export async function createAsset(asset: {
  tenantId: string;
  category: MediaCategory;
  originalKey: string;
  mimeType: string;
  sizeBytes: number;
  durationMs?: number;
  metadata?: Record<string, unknown>;
  encryptionTenantId?: string;
}): Promise<MediaAsset> {
  const row = await queryOne<Record<string, unknown>>(
    `INSERT INTO media_assets (tenant_id, category, original_key, mime_type, size_bytes, duration_ms, metadata, encryption_tenant_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      asset.tenantId,
      asset.category,
      asset.originalKey,
      asset.mimeType,
      asset.sizeBytes,
      asset.durationMs ?? null,
      JSON.stringify(asset.metadata ?? {}),
      asset.encryptionTenantId ?? null,
    ],
  );
  return rowToAsset(row!);
}

export async function getAssetById(id: string): Promise<MediaAsset | null> {
  const row = await queryOne<Record<string, unknown>>(
    'SELECT * FROM media_assets WHERE id = $1',
    [id],
  );
  return row ? rowToAsset(row) : null;
}

export async function listAssets(
  tenantId: string,
  opts: { category?: MediaCategory; limit?: number; offset?: number } = {},
): Promise<{ assets: MediaAsset[]; total: number }> {
  const { category, limit = 50, offset = 0 } = opts;

  let where = 'WHERE tenant_id = $1';
  const params: unknown[] = [tenantId];

  if (category) {
    params.push(category);
    where += ` AND category = $${params.length}`;
  }

  const countResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) AS count FROM media_assets ${where}`,
    params,
  );
  const total = parseInt(countResult?.count ?? '0', 10);

  params.push(limit, offset);
  const result = await query<Record<string, unknown>>(
    `SELECT * FROM media_assets ${where} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );

  return { assets: result.rows.map(rowToAsset), total };
}

export async function updateProcessingStatus(
  id: string,
  status: ProcessingStatus,
  updates?: {
    processedKey?: string;
    thumbnailKey?: string;
    transcription?: string;
    durationMs?: number;
    width?: number;
    height?: number;
  },
): Promise<void> {
  const sets = ['processing_status = $2'];
  const params: unknown[] = [id, status];

  if (updates?.processedKey) {
    params.push(updates.processedKey);
    sets.push(`processed_key = $${params.length}`);
  }
  if (updates?.thumbnailKey) {
    params.push(updates.thumbnailKey);
    sets.push(`thumbnail_key = $${params.length}`);
  }
  if (updates?.transcription) {
    params.push(updates.transcription);
    sets.push(`transcription = $${params.length}`);
  }
  if (updates?.durationMs !== undefined) {
    params.push(updates.durationMs);
    sets.push(`duration_ms = $${params.length}`);
  }
  if (updates?.width !== undefined) {
    params.push(updates.width);
    sets.push(`width = $${params.length}`);
  }
  if (updates?.height !== undefined) {
    params.push(updates.height);
    sets.push(`height = $${params.length}`);
  }

  await query(`UPDATE media_assets SET ${sets.join(', ')} WHERE id = $1`, params);
}

export async function deleteAsset(id: string): Promise<MediaAsset | null> {
  const row = await queryOne<Record<string, unknown>>(
    'DELETE FROM media_assets WHERE id = $1 RETURNING *',
    [id],
  );
  return row ? rowToAsset(row) : null;
}

export async function getPendingAssets(limit: number = 10): Promise<MediaAsset[]> {
  const result = await query<Record<string, unknown>>(
    `SELECT * FROM media_assets WHERE processing_status = 'pending' ORDER BY created_at ASC LIMIT $1`,
    [limit],
  );
  return result.rows.map(rowToAsset);
}
