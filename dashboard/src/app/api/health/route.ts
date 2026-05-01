/**
 * GET /api/health
 *
 * Shallow health probe for Uptime Kuma / Caddy. Returns 200 if the
 * process is alive and can reach its critical dependencies (postgres +
 * yayapay-server over the tailnet). Returns 503 otherwise.
 *
 * Deliberately not behind auth — but it IS a public-ish endpoint so
 * we don't leak internals. Output is intentionally boring.
 */

import { NextResponse } from 'next/server';
import { query } from '@/lib/business-db';
import { ping as yayapayPing } from '@/lib/yayapay/client';

export const dynamic = 'force-dynamic';

interface Check {
  name: string;
  ok: boolean;
  ms: number;
  error?: string;
}

async function timed<T>(
  name: string,
  fn: () => Promise<T>,
): Promise<Check> {
  const start = Date.now();
  try {
    await fn();
    return { name, ok: true, ms: Date.now() - start };
  } catch (e) {
    return {
      name,
      ok: false,
      ms: Date.now() - start,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function GET() {
  const checks: Check[] = await Promise.all([
    timed('postgres', async () => {
      await query(`SELECT 1 AS ok`);
    }),
    timed('yayapay', async () => {
      const ok = await yayapayPing();
      if (!ok) throw new Error('yayapay /health non-200');
    }),
  ]);

  const allOk = checks.every((c) => c.ok);
  return NextResponse.json(
    {
      status: allOk ? 'ok' : 'degraded',
      service: 'agente-ceo',
      checks: checks.map((c) => ({
        name: c.name,
        ok: c.ok,
        ms: c.ms,
        ...(c.error ? { error: c.error } : {}),
      })),
      timestamp: new Date().toISOString(),
    },
    { status: allOk ? 200 : 503 },
  );
}
