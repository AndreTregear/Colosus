/**
 * GET /api/billing/me
 *
 * Returns the current user's subscription row + boleta summary. Used by
 * /settings/billing to decide whether to show the paywall or the
 * "suscripción activa" view.
 */

import { NextResponse } from 'next/server';
import { requireServerSession } from '@/lib/server-session';
import { getSubscription } from '@/lib/subscriptions';

export const dynamic = 'force-dynamic';

export async function GET() {
  let session;
  try {
    session = await requireServerSession();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const sub = await getSubscription(session.user.id);
  if (!sub) {
    return NextResponse.json({ status: 'inactive' });
  }

  const now = Date.now();
  const active =
    sub.status === 'active' &&
    (!sub.current_period_end || sub.current_period_end.getTime() > now);

  return NextResponse.json({
    status: active ? 'active' : sub.status,
    current_period_end: sub.current_period_end,
    plan: sub.plan,
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
