/**
 * Adapter Registry — Factory pattern for country adapter selection.
 * Maps ISO 3166-1 alpha-2 country codes to their adapter implementations.
 */

import type { CountryAdapter } from "./base.js";
import { peruApisunatAdapter } from "./peru-apisunat.js";
import { mexicoFacturapiAdapter } from "./mexico-facturapi.js";
import { colombiaMatiasAdapter } from "./colombia-matias.js";
import { panamaEfacturaAdapter } from "./panama-efactura.js";

// ── Registry ─────────────────────────────────────────────

const adapters: Record<string, CountryAdapter> = {
  PE: peruApisunatAdapter,
  MX: mexicoFacturapiAdapter,
  CO: colombiaMatiasAdapter,
  PA: panamaEfacturaAdapter,
};

/**
 * Get the adapter for a country code.
 * Throws if no adapter is registered for the given country.
 */
export function getAdapter(countryCode: string): CountryAdapter {
  const adapter = adapters[countryCode.toUpperCase()];
  if (!adapter) {
    const available = Object.keys(adapters).join(", ");
    throw new Error(
      `No adapter for country "${countryCode}". Available: ${available}`
    );
  }
  return adapter;
}

/**
 * List all registered country codes and their provider names.
 */
export function listAdapters(): Array<{ code: string; name: string; provider: string; currency: string }> {
  return Object.values(adapters).map((a) => ({
    code: a.countryCode,
    name: a.countryName,
    provider: a.providerName,
    currency: a.currency,
  }));
}
