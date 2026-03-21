import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { query } from '../../db/pool.js';
import { getTenantId, type YayaToolContext } from './types.js';

/**
 * Lets the AI agent search through media assets — find voice messages,
 * images, videos shared by customers. Useful for referencing past
 * conversations and media context.
 */
export const searchMediaTool = createTool({
  id: 'search_media',
  description: 'Search media assets (voice messages, images, videos) stored in the system. Filter by category. Returns metadata, transcriptions, and processing status.',
  inputSchema: z.object({
    category: z.enum(['voice', 'image', 'video', 'document', 'product-image']).optional()
      .describe('Filter by media category'),
    limit: z.number().int().min(1).max(50).optional()
      .describe('Max results to return (default 10)'),
  }),
  execute: async (input, context: YayaToolContext) => {
    const tenantId = getTenantId(context);

    let where = 'WHERE ma.tenant_id = $1';
    const params: unknown[] = [tenantId];

    if (input.category) {
      params.push(input.category);
      where += ` AND ma.category = $${params.length}`;
    }

    params.push(input.limit || 10);
    const result = await query<Record<string, unknown>>(
      `SELECT ma.id, ma.category, ma.mime_type, ma.size_bytes, ma.duration_ms,
              ma.transcription, ma.processing_status, ma.created_at
       FROM media_assets ma
       ${where}
       ORDER BY ma.created_at DESC
       LIMIT $${params.length}`,
      params,
    );

    return JSON.stringify({
      count: result.rows.length,
      assets: result.rows.map(r => ({
        id: r.id,
        category: r.category,
        mimeType: r.mime_type,
        sizeBytes: Number(r.size_bytes),
        durationMs: r.duration_ms ? Number(r.duration_ms) : null,
        transcription: r.transcription ?? null,
        status: r.processing_status,
        createdAt: r.created_at,
      })),
    });
  },
});
