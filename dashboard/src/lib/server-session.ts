/**
 * Server-side session validation.
 *
 * Better Auth lives on the yaya-business backend; agente-ceo proxies
 * /api/auth/* to it. To validate a session from a server route or
 * middleware we forward the user's cookies to AUTH_BACKEND_URL/api/auth/get-session
 * and parse the response.
 *
 * Use getServerSession() from any API route to get the authenticated user.
 * Returns null if the cookie is missing, expired, or the auth backend is down.
 */

import { headers } from 'next/headers';

const AUTH_BACKEND =
  process.env.AUTH_BACKEND_URL ?? 'http://localhost:3000';

export interface SessionUser {
  id: string;
  email: string;
  name?: string;
  image?: string | null;
  // Tenant from the yaya-business multi-tenant model. May be null for
  // legacy single-tenant prototype users; fall back to DEFAULT_TENANT_ID.
  tenantId?: string | null;
}

export interface ServerSession {
  user: SessionUser;
  sessionId: string;
  expiresAt?: string;
}

/**
 * Parse a Better Auth `/api/auth/get-session` response.
 * Returns null if the user is not authenticated.
 */
export async function getServerSession(): Promise<ServerSession | null> {
  const hdrs = await headers();
  const cookie = hdrs.get('cookie');
  if (!cookie) return null;

  // Cheap pre-check: no session cookie at all → don't waste an HTTP call
  if (!cookie.includes('better-auth.session_token')) return null;

  let res: Response;
  try {
    res = await fetch(`${AUTH_BACKEND}/api/auth/get-session`, {
      method: 'GET',
      headers: { cookie },
      // Avoid Next's fetch cache — sessions must always be fresh
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    return null;
  }

  if (!res.ok) return null;

  const data = (await res.json().catch(() => null)) as
    | {
        user?: SessionUser;
        session?: { id?: string; expiresAt?: string };
      }
    | null;

  if (!data?.user || !data.session?.id) return null;

  return {
    user: data.user,
    sessionId: data.session.id,
    expiresAt: data.session.expiresAt,
  };
}

/**
 * Helper for API routes that REQUIRE a session.
 * Throws a Response (caller should let it propagate).
 */
export async function requireServerSession(): Promise<ServerSession> {
  const session = await getServerSession();
  if (!session) {
    throw new Response(
      JSON.stringify({ error: 'Not authenticated' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }
  return session;
}
