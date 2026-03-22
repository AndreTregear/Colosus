/**
 * Metabase API Client — BI dashboards, saved questions, scheduled reports
 * Used for pre-built analytics; real-time queries still go direct to PostgreSQL.
 */

import { METABASE_API_URL, METABASE_API_KEY } from '../config.js';
import { logger } from '../shared/logger.js';

const TIMEOUT_MS = 15_000; // dashboards can be slow

// ── Helpers ──

function headers(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-API-KEY': METABASE_API_KEY,
  };
}

async function metabaseFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T | null> {
  const url = `${METABASE_API_URL}${path}`;
  try {
    const res = await fetch(url, {
      ...init,
      headers: { ...headers(), ...(init.headers as Record<string, string> ?? {}) },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      logger.error({ status: res.status, body, path }, 'Metabase API error');
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    logger.error({ err, path }, 'Metabase API request failed');
    return null;
  }
}

// ── Health ──

export async function isServiceAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${METABASE_API_URL}/api/health`, {
      signal: AbortSignal.timeout(3_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ── Saved Questions (Cards) ──

export interface MetabaseCard {
  id: number;
  name: string;
  description?: string;
  display: string;
}

export interface MetabaseQueryResult {
  data: {
    rows: unknown[][];
    cols: Array<{ name: string; display_name: string; base_type: string }>;
  };
  row_count: number;
}

export async function runSavedQuestion(cardId: number, parameters?: Record<string, string>): Promise<MetabaseQueryResult | null> {
  const body = parameters ? { parameters: Object.entries(parameters).map(([key, value]) => ({ type: 'category', value, target: ['variable', ['template-tag', key]] })) } : {};
  return metabaseFetch<MetabaseQueryResult>(`/api/card/${cardId}/query`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function getCard(cardId: number): Promise<MetabaseCard | null> {
  return metabaseFetch<MetabaseCard>(`/api/card/${cardId}`);
}

export async function listCards(): Promise<MetabaseCard[]> {
  const result = await metabaseFetch<MetabaseCard[]>('/api/card');
  return result ?? [];
}

// ── Dashboards ──

export interface MetabaseDashboard {
  id: number;
  name: string;
  description?: string;
  dashcards: Array<{
    id: number;
    card_id: number | null;
    card?: MetabaseCard;
  }>;
}

export async function getDashboard(dashboardId: number): Promise<MetabaseDashboard | null> {
  return metabaseFetch<MetabaseDashboard>(`/api/dashboard/${dashboardId}`);
}

export async function listDashboards(): Promise<Array<{ id: number; name: string; description?: string }>> {
  const result = await metabaseFetch<Array<{ id: number; name: string; description?: string }>>('/api/dashboard');
  return result ?? [];
}

// ── Convenience: run all cards in a dashboard and return results ──

export async function runDashboardQuestions(
  dashboardId: number,
  parameters?: Record<string, string>,
): Promise<Map<number, MetabaseQueryResult>> {
  const dashboard = await getDashboard(dashboardId);
  if (!dashboard) return new Map();

  const cardIds = dashboard.dashcards
    .map(dc => dc.card_id)
    .filter((id): id is number => id !== null);

  const results = new Map<number, MetabaseQueryResult>();
  const settled = await Promise.allSettled(
    cardIds.map(async (cardId) => {
      const data = await runSavedQuestion(cardId, parameters);
      if (data) results.set(cardId, data);
    }),
  );

  for (const s of settled) {
    if (s.status === 'rejected') {
      logger.error({ err: s.reason, dashboardId }, 'Failed to run dashboard card');
    }
  }

  return results;
}
