/**
 * Billing configuration — pricing, Nubefact, fiscal identity.
 *
 * All fiscal data for the issuer (your RUC) lives here, loaded from env.
 * Customer data (the "Cliente" on the boleta) is built per-issuance
 * from the authenticated session.
 */

import type { NubefactConfig, Supplier } from '@/lib/sunat/types';

// ── Pricing ──────────────────────────────────────────────────────────────

export type PlanId = 'monthly' | 'annual';

export interface Plan {
  id: PlanId;
  label: string;
  description: string;
  amountCents: number; // PEN centimos, IGV-inclusive
  periodDays: number;
}

export const PLANS: Record<PlanId, Plan> = {
  monthly: {
    id: 'monthly',
    label: 'Plan Mensual',
    description: 'Suscripción Agente CEO — 30 días',
    amountCents: Number(process.env.AGENTE_CEO_PRICE_MONTHLY_CENTS ?? 4900), // S/ 49.00
    periodDays: 30,
  },
  annual: {
    id: 'annual',
    label: 'Plan Anual',
    description: 'Suscripción Agente CEO — 365 días',
    amountCents: Number(process.env.AGENTE_CEO_PRICE_ANNUAL_CENTS ?? 49000), // S/ 490.00
    periodDays: 365,
  },
};

export function planById(id: string): Plan | null {
  return (PLANS as Record<string, Plan>)[id] ?? null;
}

// ── Nubefact (fiscal PSE) ────────────────────────────────────────────────

export function nubefactConfig(): NubefactConfig {
  const apiUrl = process.env.NUBEFACT_API_URL;
  const apiToken = process.env.NUBEFACT_API_TOKEN;
  if (!apiUrl || !apiToken) {
    throw new Error(
      'NUBEFACT_API_URL / NUBEFACT_API_TOKEN not set — cannot issue boletas',
    );
  }
  return { apiUrl, apiToken };
}

/**
 * Issuer — your registered RUC on Nubefact.
 * "supplier" in SUNAT terminology is the party issuing the document.
 */
export function issuerSupplier(): Supplier {
  const ruc = process.env.ISSUER_RUC;
  const razonSocial = process.env.ISSUER_RAZON_SOCIAL;
  const nombreComercial =
    process.env.ISSUER_NOMBRE_COMERCIAL ?? razonSocial ?? '';
  const direccion = process.env.ISSUER_DIRECCION ?? '';
  const ubigeo = process.env.ISSUER_UBIGEO ?? '150101'; // Lima Cercado default
  const departamento = process.env.ISSUER_DEPARTAMENTO ?? 'LIMA';
  const provincia = process.env.ISSUER_PROVINCIA ?? 'LIMA';
  const distrito = process.env.ISSUER_DISTRITO ?? 'LIMA';

  if (!ruc || !razonSocial) {
    throw new Error(
      'ISSUER_RUC / ISSUER_RAZON_SOCIAL not set — cannot issue boletas',
    );
  }

  return {
    ruc,
    razonSocial,
    nombreComercial,
    direccion,
    ubigeo,
    departamento,
    provincia,
    distrito,
  };
}

// ── Serie + numero management ───────────────────────────────────────────

/**
 * Boleta serie. Nubefact typically uses B001..B999 for boletas.
 * Configurable in case you run multiple series.
 */
export const BOLETA_SERIE = process.env.BOLETA_SERIE ?? 'B001';

/**
 * Derive a deterministic numero from an intent id so retries don't
 * double-issue. Nubefact is also idempotent on (serie, numero), so this
 * is defense in depth.
 *
 * Strategy: take the last 7 hex chars of the intent id (which is
 * `txn_<24hex>`), parse as int, modulo 9_999_999. This gives a stable,
 * 1..9_999_999 value that fits Nubefact's 8-digit numero field.
 */
export function deriveBoletaNumero(intentId: string): number {
  const hex = intentId.replace(/^txn_/, '').slice(-7);
  const n = parseInt(hex, 16);
  if (Number.isNaN(n) || n === 0) {
    // Fallback: wall-clock minute counter
    return Math.floor(Date.now() / 60_000) % 9_999_999;
  }
  return (n % 9_999_999) + 1;
}
