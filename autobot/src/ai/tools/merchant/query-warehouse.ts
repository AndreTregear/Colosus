import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { query } from '../../../db/pool.js';
import { getTenantId, type YayaToolContext } from '../types.js';

/**
 * Lets the merchant AI agent query warehouse interaction data —
 * message volumes, media usage, AI performance, all sliced by time.
 */
export const queryInteractionsTool = createTool({
  id: 'query_interactions',
  description: 'Query the data warehouse for interaction analytics — message volumes, voice notes, images, AI responses, broken down by type and time period. Use this to understand communication patterns.',
  inputSchema: z.object({
    period: z.enum(['today', 'week', 'month']).describe('Time period to analyze'),
    interaction_type: z.enum(['message_in', 'message_out', 'ai_response', 'voice_note', 'image', 'video']).optional()
      .describe('Filter by specific interaction type'),
  }),
  execute: async (input, context: YayaToolContext) => {
    const tenantId = getTenantId(context);
    let dateFilter: string;
    const now = new Date();

    switch (input.period) {
      case 'today':
        dateFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        break;
      case 'week':
        dateFilter = new Date(now.getTime() - 7 * 86400_000).toISOString();
        break;
      case 'month':
        dateFilter = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        break;
      default:
        dateFilter = new Date(now.getTime() - 30 * 86400_000).toISOString();
    }

    let where = 'WHERE tenant_id = $1 AND created_at >= $2';
    const params: unknown[] = [tenantId, dateFilter];

    if (input.interaction_type) {
      params.push(input.interaction_type);
      where += ` AND interaction_type = $${params.length}`;
    }

    const totals = await query<Record<string, unknown>>(
      `SELECT interaction_type, COUNT(*) AS count
       FROM wh_fact_interactions ${where}
       GROUP BY interaction_type ORDER BY count DESC`,
      params,
    );

    const dailyTrend = await query<Record<string, unknown>>(
      `SELECT date_trunc('day', created_at) AS day, COUNT(*) AS count
       FROM wh_fact_interactions ${where}
       GROUP BY day ORDER BY day DESC LIMIT 14`,
      params,
    );

    return JSON.stringify({
      period: input.period,
      breakdown: totals.rows.map(r => ({
        type: r.interaction_type,
        count: Number(r.count),
      })),
      dailyTrend: dailyTrend.rows.map(r => ({
        day: r.day,
        count: Number(r.count),
      })),
    });
  },
});

/**
 * Lets the merchant AI query warehouse for AI session performance —
 * how well the AI is performing, token usage, outcomes.
 */
export const queryAIPerformanceTool = createTool({
  id: 'query_ai_performance',
  description: 'Get AI performance analytics from the warehouse — total sessions, token usage, cost breakdown by model. Use this to understand AI usage and optimize costs.',
  inputSchema: z.object({
    period: z.enum(['today', 'week', 'month']).describe('Time period to analyze'),
  }),
  execute: async (input, context: YayaToolContext) => {
    const tenantId = getTenantId(context);
    let dateFilter: string;
    const now = new Date();

    switch (input.period) {
      case 'today':
        dateFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        break;
      case 'week':
        dateFilter = new Date(now.getTime() - 7 * 86400_000).toISOString();
        break;
      case 'month':
        dateFilter = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        break;
      default:
        dateFilter = new Date(now.getTime() - 30 * 86400_000).toISOString();
    }

    const stats = await query<Record<string, unknown>>(
      `SELECT
         COUNT(*) AS total_sessions,
         SUM(total_tokens) AS total_tokens,
         AVG(total_tokens) AS avg_tokens_per_session,
         COUNT(DISTINCT model) AS models_used
       FROM wh_fact_ai_sessions
       WHERE tenant_id = $1 AND created_at >= $2`,
      [tenantId, dateFilter],
    );

    const byModel = await query<Record<string, unknown>>(
      `SELECT model, COUNT(*) AS sessions, SUM(total_tokens) AS tokens
       FROM wh_fact_ai_sessions
       WHERE tenant_id = $1 AND created_at >= $2
       GROUP BY model ORDER BY sessions DESC`,
      [tenantId, dateFilter],
    );

    const row = stats.rows[0];
    return JSON.stringify({
      period: input.period,
      totalSessions: Number(row?.total_sessions ?? 0),
      totalTokens: Number(row?.total_tokens ?? 0),
      avgTokensPerSession: Math.round(Number(row?.avg_tokens_per_session ?? 0)),
      byModel: byModel.rows.map(r => ({
        model: r.model,
        sessions: Number(r.sessions),
        tokens: Number(r.tokens),
      })),
    });
  },
});

/**
 * Lets the merchant AI query media storage analytics — how much
 * media is stored, types breakdown, storage usage.
 */
export const queryMediaAnalyticsTool = createTool({
  id: 'query_media_analytics',
  description: 'Get media storage analytics — total assets, storage size, breakdown by category (voice, image, video), transcription coverage, and processing status.',
  inputSchema: z.object({}),
  execute: async (_input, context: YayaToolContext) => {
    const tenantId = getTenantId(context);

    const byCategory = await query<Record<string, unknown>>(
      `SELECT category, COUNT(*) AS count,
              SUM(size_bytes) AS total_bytes,
              COUNT(*) FILTER (WHERE transcription IS NOT NULL) AS transcribed
       FROM media_assets
       WHERE tenant_id = $1
       GROUP BY category ORDER BY count DESC`,
      [tenantId],
    );

    const processingStatus = await query<Record<string, unknown>>(
      `SELECT processing_status, COUNT(*) AS count
       FROM media_assets
       WHERE tenant_id = $1
       GROUP BY processing_status`,
      [tenantId],
    );

    const totalSize = byCategory.rows.reduce(
      (sum, r) => sum + Number(r.total_bytes ?? 0), 0,
    );

    return JSON.stringify({
      totalAssets: byCategory.rows.reduce((sum, r) => sum + Number(r.count), 0),
      totalSizeMB: Math.round(totalSize / 1024 / 1024 * 100) / 100,
      byCategory: byCategory.rows.map(r => ({
        category: r.category,
        count: Number(r.count),
        sizeMB: Math.round(Number(r.total_bytes ?? 0) / 1024 / 1024 * 100) / 100,
        transcribed: Number(r.transcribed),
      })),
      processingStatus: processingStatus.rows.map(r => ({
        status: r.processing_status,
        count: Number(r.count),
      })),
    });
  },
});

/**
 * Export training data for AI fine-tuning.
 */
export const exportTrainingDataTool = createTool({
  id: 'export_training_data',
  description: 'Export conversation data as training datasets for AI fine-tuning. Supports JSONL and CSV formats. Data can be anonymized to remove PII. Returns a download URL valid for 1 hour.',
  inputSchema: z.object({
    format: z.enum(['jsonl', 'csv']).describe('Export format — JSONL for AI training, CSV for spreadsheets'),
    anonymize: z.boolean().default(true).describe('Whether to strip PII (phone numbers, emails, names) from the export'),
  }),
  execute: async (input, context: YayaToolContext) => {
    const tenantId = getTenantId(context);
    const { exportTrainingData } = await import('../../../warehouse/training-export.js');

    const result = await exportTrainingData({
      tenantId,
      format: input.format as 'jsonl' | 'csv',
      anonymize: input.anonymize,
    });

    return JSON.stringify({
      downloadUrl: result.url,
      rowCount: result.rowCount,
      format: input.format,
      anonymized: input.anonymize,
      expiresIn: '1 hour',
    });
  },
});
