/**
 * POST /api/webhooks/yayapay
 *
 * Receives webhook deliveries from yayapay-server. Verifies HMAC-SHA256
 * signature in the Stripe-style header `YayaPay-Signature: t=TS,v1=HEX`,
 * matching the scheme in yaya-backend/src/auth/webhook_sig.rs.
 *
 * On payment_intent.succeeded:
 *   1. Look up the user by yaya_intent_id
 *   2. Mark subscription active (idempotent on intent_id)
 *   3. Issue a Nubefact boleta (idempotent — derived serie+numero)
 *
 * This route MUST NOT require a session — it's server-to-server over
 * the tailnet. Signature is the only auth.
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import {
  activate,
  getSubscription,
  recordWebhookEvent,
} from '@/lib/subscriptions';
import { issueBoletaForIntent } from '@/lib/billing/issue-boleta';
import { planById } from '@/lib/billing/config';
import { queryOne } from '@/lib/business-db';

export const dynamic = 'force-dynamic';

const SIGNATURE_TOLERANCE_SECS = Number(
  process.env.YAYAPAY_WEBHOOK_TOLERANCE_SECS ?? 300,
);

function parseSignature(header: string): { t: number; v1: string } | null {
  let t: number | null = null;
  let v1: string | null = null;
  for (const part of header.split(',')) {
    const [key, val] = part.split('=');
    if (!key || !val) continue;
    if (key === 't') {
      const n = Number(val);
      if (Number.isFinite(n)) t = n;
    } else if (key === 'v1') {
      v1 = val;
    }
  }
  if (t === null || v1 === null) return null;
  return { t, v1 };
}

function timingSafeEq(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

function verify(
  payload: string,
  header: string | null,
  secret: string,
): { ok: true } | { ok: false; reason: string } {
  if (!header) return { ok: false, reason: 'missing signature header' };
  const parsed = parseSignature(header);
  if (!parsed) return { ok: false, reason: 'malformed signature header' };

  const nowSecs = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSecs - parsed.t) > SIGNATURE_TOLERANCE_SECS) {
    return { ok: false, reason: 'signature expired' };
  }

  const signed = `${parsed.t}.${payload}`;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(signed)
    .digest('hex');

  if (!timingSafeEq(parsed.v1, expected)) {
    return { ok: false, reason: 'bad signature' };
  }
  return { ok: true };
}

interface WebhookEnvelope {
  id: string;
  type: string;
  created: number;
  data: {
    object: {
      id: string;
      amount: number;
      currency: string;
      wallet_type: string;
      status: string;
      sender_name: string | null;
      description: string | null;
      expires_at: string;
      confirmed_at: string | null;
    };
  };
}

export async function POST(req: NextRequest) {
  const secret = process.env.YAYAPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error('YAYAPAY_WEBHOOK_SECRET not set — rejecting webhook');
    return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  }

  const sigHeader = req.headers.get('yayapay-signature');
  const rawBody = await req.text();

  const verdict = verify(rawBody, sigHeader, secret);
  if (!verdict.ok) {
    console.warn(
      JSON.stringify({
        level: 'warn',
        component: 'webhooks/yayapay',
        msg: 'signature rejected',
        reason: verdict.reason,
      }),
    );
    return NextResponse.json({ error: verdict.reason }, { status: 401 });
  }

  let evt: WebhookEnvelope;
  try {
    evt = JSON.parse(rawBody) as WebhookEnvelope;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const intent = evt.data?.object;
  if (!intent?.id) {
    return NextResponse.json({ error: 'missing_intent' }, { status: 400 });
  }

  // Replay protection — first write wins.
  const fresh = await recordWebhookEvent(intent.id, evt.type, evt);
  if (!fresh) {
    return NextResponse.json({ ok: true, replayed: true });
  }

  // Only act on succeeded; other events are recorded for audit.
  if (evt.type !== 'payment_intent.succeeded') {
    return NextResponse.json({ ok: true, noop: evt.type });
  }
  if (intent.status !== 'confirmed') {
    return NextResponse.json({ ok: true, noop: `status=${intent.status}` });
  }

  // Find the user this intent belongs to by joining our pending row.
  const pending = await queryOne<{
    user_id: string;
    plan: string;
    amount_cents: string;
  }>(
    `SELECT user_id, plan, amount_cents
       FROM agente_ceo_subscriptions
      WHERE yaya_intent_id = $1`,
    [intent.id],
  );

  if (!pending) {
    console.error(
      JSON.stringify({
        level: 'error',
        component: 'webhooks/yayapay',
        msg: 'intent not tied to any subscription',
        intent_id: intent.id,
      }),
    );
    return NextResponse.json(
      { error: 'unknown_intent' },
      { status: 404 },
    );
  }

  const plan = planById(pending.plan) ?? planById('monthly')!;

  await activate({
    userId: pending.user_id,
    intentId: intent.id,
    periodDays: plan.periodDays,
  });

  // Look up the user's name for the boleta "Cliente" field. Falls back
  // to "CLIENTE VARIOS" if unavailable — SUNAT accepts this for boletas.
  const userRow = await queryOne<{ name: string | null; email: string }>(
    `SELECT name, email FROM "user" WHERE id = $1`,
    [pending.user_id],
  ).catch(() => null);

  // Issue the boleta. Failure here does NOT revoke the subscription —
  // we'll retry via an out-of-band job. For now we record and return 200.
  const boleta = await issueBoletaForIntent({
    userId: pending.user_id,
    userName: userRow?.name ?? userRow?.email ?? 'CLIENTE VARIOS',
    intentId: intent.id,
    amountCents: Number(pending.amount_cents),
    description: plan.description,
  }).catch((err) => {
    console.error(
      JSON.stringify({
        level: 'error',
        component: 'webhooks/yayapay',
        msg: 'boleta issuance threw',
        intent_id: intent.id,
        error: err instanceof Error ? err.message : String(err),
      }),
    );
    return null;
  });

  const currentSub = await getSubscription(pending.user_id);

  return NextResponse.json({
    ok: true,
    subscription: {
      status: currentSub?.status,
      current_period_end: currentSub?.current_period_end,
    },
    boleta: boleta
      ? {
          ok: boleta.ok,
          serie: boleta.serie,
          numero: boleta.numero,
          pdf_url: boleta.pdfUrl,
          aceptada: boleta.aceptada,
        }
      : null,
  });
}
