/**
 * SSO Manager — handles cross-service identity for tenants.
 *
 * On tenant registration: auto-creates corresponding accounts in Lago, Cal.com, Metabase.
 * On SSO request: generates auth tokens/links for each service.
 * Stores mapping: tenantId → lago_customer_id, calcom_user_id, metabase_user_id
 */

import { query, queryOne } from '../db/pool.js';
import { logger } from '../shared/logger.js';
import {
  LAGO_API_URL, LAGO_API_KEY,
  CALCOM_API_URL, CALCOM_API_KEY,
  METABASE_API_URL, METABASE_API_KEY,
} from '../config.js';

// ── Types ──

interface ServiceAccount {
  tenantId: string;
  service: string;
  externalId: string;
  externalEmail: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

// ── DB helpers ──

export async function getServiceAccount(tenantId: string, service: string): Promise<ServiceAccount | undefined> {
  const row = await queryOne<Record<string, unknown>>(
    'SELECT * FROM tenant_service_accounts WHERE tenant_id = $1 AND service = $2',
    [tenantId, service],
  );
  if (!row) return undefined;
  return {
    tenantId: String(row.tenant_id),
    service: String(row.service),
    externalId: String(row.external_id),
    externalEmail: row.external_email ? String(row.external_email) : null,
    metadata: (row.metadata as Record<string, unknown>) || {},
    createdAt: String(row.created_at),
  };
}

async function upsertServiceAccount(
  tenantId: string,
  service: string,
  externalId: string,
  externalEmail?: string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  await query(
    `INSERT INTO tenant_service_accounts (tenant_id, service, external_id, external_email, metadata)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (tenant_id, service) DO UPDATE SET
       external_id = EXCLUDED.external_id,
       external_email = COALESCE(EXCLUDED.external_email, tenant_service_accounts.external_email),
       metadata = tenant_service_accounts.metadata || EXCLUDED.metadata`,
    [tenantId, service, externalId, externalEmail ?? null, JSON.stringify(metadata)],
  );
}

// ── Lago SSO ──

async function ensureLagoCustomer(tenantId: string, tenantName: string): Promise<string | null> {
  const existing = await getServiceAccount(tenantId, 'lago');
  if (existing) return existing.externalId;

  if (!LAGO_API_KEY) return null;

  try {
    const res = await fetch(`${LAGO_API_URL}/api/v1/customers`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${LAGO_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer: { external_id: tenantId, name: tenantName, currency: 'PEN' } }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) {
      // Customer may already exist — try to fetch
      const getRes = await fetch(`${LAGO_API_URL}/api/v1/customers/${encodeURIComponent(tenantId)}`, {
        headers: { 'Authorization': `Bearer ${LAGO_API_KEY}` },
        signal: AbortSignal.timeout(8_000),
      });
      if (getRes.ok) {
        const data = await getRes.json() as { customer: { lago_id: string } };
        await upsertServiceAccount(tenantId, 'lago', data.customer.lago_id);
        return data.customer.lago_id;
      }
      return null;
    }
    const data = await res.json() as { customer: { lago_id: string } };
    await upsertServiceAccount(tenantId, 'lago', data.customer.lago_id);
    return data.customer.lago_id;
  } catch (err) {
    logger.error({ err, tenantId }, 'Failed to create Lago customer');
    return null;
  }
}

export async function getLagoPortalUrl(tenantId: string, tenantName: string): Promise<string | null> {
  const lagoId = await ensureLagoCustomer(tenantId, tenantName);
  if (!lagoId || !LAGO_API_KEY) return null;

  try {
    const res = await fetch(`${LAGO_API_URL}/api/v1/customers/${encodeURIComponent(tenantId)}/portal_url`, {
      headers: { 'Authorization': `Bearer ${LAGO_API_KEY}` },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    const data = await res.json() as { customer: { portal_url: string } };
    return data.customer.portal_url || null;
  } catch (err) {
    logger.error({ err, tenantId }, 'Failed to get Lago portal URL');
    return null;
  }
}

// ── Cal.com SSO ──

async function ensureCalcomUser(tenantId: string, tenantName: string, email: string): Promise<string | null> {
  const existing = await getServiceAccount(tenantId, 'calcom');
  if (existing) return existing.externalId;

  if (!CALCOM_API_KEY) return null;

  try {
    const sep = '/v2/users'.includes('?') ? '&' : '?';
    const res = await fetch(`${CALCOM_API_URL}/api/users${sep}apiKey=${CALCOM_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        name: tenantName,
        username: `tenant-${tenantId.slice(0, 8)}`,
      }),
      signal: AbortSignal.timeout(8_000),
    });

    if (!res.ok) {
      // User may already exist
      const body = await res.text();
      logger.warn({ status: res.status, body, tenantId }, 'Cal.com user creation failed, may already exist');
      // Try to find by email
      const searchRes = await fetch(`${CALCOM_API_URL}/api/users?apiKey=${CALCOM_API_KEY}&email=${encodeURIComponent(email)}`, {
        signal: AbortSignal.timeout(8_000),
      });
      if (searchRes.ok) {
        const data = await searchRes.json() as { users?: Array<{ id: number }> };
        if (data.users?.[0]) {
          const userId = String(data.users[0].id);
          await upsertServiceAccount(tenantId, 'calcom', userId, email);
          return userId;
        }
      }
      return null;
    }

    const data = await res.json() as { user: { id: number } };
    const userId = String(data.user.id);
    await upsertServiceAccount(tenantId, 'calcom', userId, email);
    return userId;
  } catch (err) {
    logger.error({ err, tenantId }, 'Failed to create Cal.com user');
    return null;
  }
}

export async function getCalcomLoginUrl(tenantId: string, tenantName: string, email: string): Promise<string | null> {
  await ensureCalcomUser(tenantId, tenantName, email);
  // Cal.com doesn't have a direct "login link" API — redirect to the Cal.com instance
  // The user will need to authenticate there. In a self-hosted setup, you can configure
  // SAML/OIDC for true SSO. For now, redirect to the Cal.com dashboard.
  return CALCOM_API_KEY ? `${CALCOM_API_URL}` : null;
}

// ── Metabase SSO ──

async function ensureMetabaseUser(tenantId: string, tenantName: string, email: string): Promise<string | null> {
  const existing = await getServiceAccount(tenantId, 'metabase');
  if (existing) return existing.externalId;

  if (!METABASE_API_KEY) return null;

  // Metabase doesn't have a simple "create user" flow via API key.
  // We store the tenant mapping and use the embed/SSO URL approach.
  await upsertServiceAccount(tenantId, 'metabase', tenantId, email);
  return tenantId;
}

export async function getMetabaseSsoUrl(tenantId: string, tenantName: string, email: string): Promise<string | null> {
  await ensureMetabaseUser(tenantId, tenantName, email);

  if (!METABASE_API_KEY) return null;

  // For self-hosted Metabase, use the embedding approach:
  // Generate a signed embed URL for the tenant's dashboard.
  // If METABASE_EMBED_SECRET is configured, use JWT signing.
  // Otherwise, redirect to Metabase with the API key session.
  try {
    // Get or create a session token for the Metabase API
    const res = await fetch(`${METABASE_API_URL}/api/dashboard`, {
      headers: { 'X-API-KEY': METABASE_API_KEY },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    const dashboards = await res.json() as Array<{ id: number; name: string }>;
    // Find a tenant-specific dashboard or use the first available
    const tenantDash = dashboards.find(d => d.name.toLowerCase().includes('tenant'));
    const dashId = tenantDash?.id || dashboards[0]?.id;
    if (!dashId) return `${METABASE_API_URL}`;
    return `${METABASE_API_URL}/dashboard/${dashId}`;
  } catch (err) {
    logger.error({ err, tenantId }, 'Failed to get Metabase SSO URL');
    return `${METABASE_API_URL}`;
  }
}

// ── Tenant Registration Hook ──

export async function onTenantRegistered(tenantId: string, tenantName: string, email: string): Promise<void> {
  // Fire-and-forget: create accounts in all services
  const results = await Promise.allSettled([
    ensureLagoCustomer(tenantId, tenantName),
    ensureCalcomUser(tenantId, tenantName, email),
    ensureMetabaseUser(tenantId, tenantName, email),
  ]);

  for (const r of results) {
    if (r.status === 'rejected') {
      logger.warn({ err: r.reason, tenantId }, 'SSO account creation failed for a service');
    }
  }
}
