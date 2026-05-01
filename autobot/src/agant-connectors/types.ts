/**
 * Oficina Connectors — Shared types
 *
 * Every piece of data from any app gets normalized into a DataRecord
 * for the librarian/indexer. Actions use typed per-connector interfaces.
 */

// ─── Universal Data Record ───────────────────────────────────
// The librarian indexes these. Every email, event, file, invoice,
// contact becomes one of these for unified search.

export type DataKind =
  | 'email'
  | 'calendar_event'
  | 'contact'
  | 'file'
  | 'invoice'
  | 'customer'
  | 'product'
  | 'order'
  | 'task'
  | 'workflow'
  | 'meeting_recording'
  | 'note';

export interface DataRecord {
  /** Globally unique: "<source>:<kind>:<id>" e.g. "stalwart:email:abc123" */
  id: string;
  /** Which connector produced this */
  source: 'erpnext' | 'nextcloud' | 'stalwart' | 'n8n';
  /** What kind of thing this is */
  kind: DataKind;
  /** Human-readable title/subject */
  title: string;
  /** Plain-text body for full-text search / LLM context */
  body: string;
  /** When this was created/sent/scheduled */
  timestamp: Date;
  /** When we last fetched/updated this record */
  indexed_at: Date;
  /** Free-form metadata specific to the kind */
  metadata: Record<string, unknown>;
  /** People involved (names, emails, phone numbers) */
  participants: string[];
  /** Tags/labels/categories */
  tags: string[];
  /** URL to view this in the source app */
  source_url: string;
}

// ─── Connector Interface ─────────────────────────────────────
// Every connector implements this. Read side extracts DataRecords,
// write side provides typed actions.

export interface Connector<TActions = unknown> {
  /** Connector name */
  name: string;
  /** Test connectivity */
  healthCheck(): Promise<boolean>;
  /** Extract all records modified since the given date */
  extractSince(since: Date): Promise<DataRecord[]>;
  /** Typed action methods */
  actions: TActions;
}

// ─── HTTP helpers ────────────────────────────────────────────

export interface HttpClientConfig {
  baseUrl: string;
  headers?: Record<string, string>;
  timeout?: number;
}

export async function httpJson<T>(
  config: HttpClientConfig,
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const url = `${config.baseUrl}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...config.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(config.timeout ?? 15000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${method} ${path} → ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

export async function httpText(
  config: HttpClientConfig,
  method: string,
  path: string,
  body?: string,
  extraHeaders?: Record<string, string>,
): Promise<string> {
  const url = `${config.baseUrl}${path}`;
  const res = await fetch(url, {
    method,
    headers: { ...config.headers, ...extraHeaders },
    body,
    signal: AbortSignal.timeout(config.timeout ?? 15000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${method} ${path} → ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.text();
}
