/**
 * GET /api/billing/status?intent_id=...
 *
 * Polled by the /settings/billing page while waiting for payment. Reads
 * the subscription row (authoritative — flipped by the webhook handler)
 * and falls back to a direct yayapay lookup if the webhook is late.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireServerSession } from '@/lib/server-session';
import { getPaymentIntent, YayapayError } from '@/lib/yayapay/client';
import { getSubscription } from '@/lib/subscriptions';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  let session;
  try {
    session = await requireServerSession();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const intentId = req.nextUrl.searchParams.get('intent_id');
  if (!intentId) {
    return NextResponse.json(
      { error: 'missing_intent_id' },
      { status: 400 },
    );
  }

  // Authoritative: read our subscription row first.
  const sub = await getSubscription(session.user.id);

  // If the subscription is already active and tied to this intent, return.
  if (sub && sub.yaya_intent_id === intentId && sub.status === 'active') {
    return NextResponse.json({
      status: 'active',
      subscription_status: sub.status,
      current_period_end: sub.current_period_end,
      boleta: sub.boleta_pdf_url
        ? {
            serie: sub.boleta_serie,
            numero: sub.boleta_numero,
            pdf_url: sub.boleta_pdf_url,
            aceptada: sub.boleta_aceptada,
          }
        : null,
    });
  }

  // Otherwise check the upstream intent — webhook may be in flight.
  try {
    const intent = await getPaymentIntent(intentId);
    return NextResponse.json({
      status: intent.status, // 'pending' | 'confirmed' | 'expired' | 'canceled'
      subscription_status: sub?.status ?? 'inactive',
      sender_name: intent.sender_name,
      confirmed_at: intent.confirmed_at,
      expires_at: intent.expires_at,
    });
  } catch (e) {
    if (e instanceof YayapayError) {
      return NextResponse.json(
        { error: e.type ?? 'yayapay_error', message: e.message },
        { status: e.status },
      );
    }
    throw e;
  }
}
