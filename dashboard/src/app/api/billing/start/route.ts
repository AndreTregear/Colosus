/**
 * POST /api/billing/start
 *
 * Authenticated user clicks "Pay with Yape" → we create a yayapay
 * payment intent and return the QR/deeplink + intent id. Frontend polls
 * /api/billing/status until the webhook arrives (or falls back to direct
 * poll of the yayapay server).
 *
 * Idempotent at the yayapay layer via idempotency_key derived from
 * (user_id, plan_id). Re-posting within the same expiration window
 * returns the existing intent.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireServerSession } from '@/lib/server-session';
import { createPaymentIntent, YayapayError } from '@/lib/yayapay/client';
import { planById } from '@/lib/billing/config';
import { markPending } from '@/lib/subscriptions';

export const dynamic = 'force-dynamic';

interface StartBody {
  plan?: string;
}

export async function POST(req: NextRequest) {
  let session;
  try {
    session = await requireServerSession();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  let body: StartBody = {};
  try {
    body = (await req.json()) as StartBody;
  } catch {
    // Empty body is OK — default to monthly plan
  }

  const plan = planById(body.plan ?? 'monthly');
  if (!plan) {
    return NextResponse.json(
      { error: 'invalid_plan', message: 'Plan desconocido.' },
      { status: 400 },
    );
  }

  const idempotencyKey = `user_${session.user.id}_plan_${plan.id}`;

  try {
    const intent = await createPaymentIntent({
      amountCents: plan.amountCents,
      walletType: 'YAPE',
      description: plan.description,
      idempotencyKey,
    });

    await markPending(
      session.user.id,
      intent.id,
      plan.amountCents,
      plan.id,
    );

    return NextResponse.json({
      intent_id: intent.id,
      amount_cents: intent.amount,
      amount_soles: (intent.amount / 100).toFixed(2),
      currency: intent.currency,
      status: intent.status,
      wallet_type: intent.wallet_type,
      qr_data: intent.qr_data,
      payment_link: intent.payment_link,
      expires_at: intent.expires_at,
      plan: {
        id: plan.id,
        label: plan.label,
        description: plan.description,
      },
    });
  } catch (e) {
    if (e instanceof YayapayError) {
      return NextResponse.json(
        {
          error: e.type ?? 'yayapay_error',
          message: e.message,
        },
        { status: e.status >= 400 && e.status < 600 ? e.status : 502 },
      );
    }
    console.error('billing/start unexpected error', e);
    return NextResponse.json(
      { error: 'internal_error', message: 'No se pudo iniciar el pago.' },
      { status: 500 },
    );
  }
}
