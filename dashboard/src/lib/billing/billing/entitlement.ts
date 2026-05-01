/**
 * Entitlement gate for paid routes.
 *
 * Wrap any Next.js API route handler that should require an active
 * subscription. Returns a 401 for unauthenticated requests, 402 for
 * authenticated-but-unpaid.
 *
 * Usage:
 *   export const POST = withActiveSubscription(async (req, ctx) => {
 *     // ctx.session and ctx.subscription are guaranteed here
 *   });
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, type ServerSession } from '@/lib/server-session';
import { getSubscription, type Subscription } from '@/lib/subscriptions';

export interface GatedContext {
  session: ServerSession;
  subscription: Subscription;
}

export type GatedHandler = (
  req: NextRequest,
  ctx: GatedContext,
) => Promise<Response>;

export function withActiveSubscription(handler: GatedHandler) {
  return async (req: NextRequest): Promise<Response> => {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: 'not_authenticated', message: 'Inicia sesión para continuar.' },
        { status: 401 },
      );
    }

    const sub = await getSubscription(session.user.id);
    const now = Date.now();
    const active =
      sub?.status === 'active' &&
      (!sub.current_period_end ||
        sub.current_period_end.getTime() > now);

    if (!active) {
      return NextResponse.json(
        {
          error: 'payment_required',
          message:
            'Suscripción inactiva. Activa tu plan en /settings/billing para usar Agente CEO.',
          checkout_url: '/settings/billing',
        },
        { status: 402 },
      );
    }

    return handler(req, { session, subscription: sub });
  };
}
