/**
 * IGV (Impuesto General a las Ventas) Calculation — Peru
 *
 * Rate: 18% (16% IGV + 2% IPM)
 * All calculations use integer centimos to avoid floating-point drift.
 * Public API accepts/returns soles as numbers rounded to 2 decimal places.
 */

import type { IgvBreakdown, InvoiceItem } from './types.js';

/** IGV rate as a fraction (18%) */
export const IGV_RATE = 0.18;

/** IGV rate as basis points for integer math (1800 = 18.00%) */
const IGV_BPS = 1800n;
const BPS_DIVISOR = 10000n;

// ── Helpers: integer centimo math ──

/** Convert soles to centimos (integer). Rounds to nearest centimo. */
function toCentimos(soles: number): bigint {
  return BigInt(Math.round(soles * 100));
}

/** Convert centimos back to soles (2 decimal places). */
function toSoles(centimos: bigint): number {
  const n = Number(centimos);
  return Math.round(n) / 100;
}

// ── Public API ──

/**
 * Calculate IGV from a base amount (sin IGV).
 * base = 100.00 → igv = 18.00 → total = 118.00
 */
export function igvFromBase(baseAmount: number): IgvBreakdown {
  const baseCent = toCentimos(baseAmount);
  const igvCent = (baseCent * IGV_BPS + BPS_DIVISOR / 2n) / BPS_DIVISOR; // rounded
  const totalCent = baseCent + igvCent;
  return {
    baseImponible: toSoles(baseCent),
    igv: toSoles(igvCent),
    total: toSoles(totalCent),
  };
}

/**
 * Extract IGV from a total amount (con IGV).
 * total = 118.00 → base = 100.00 → igv = 18.00
 */
export function igvFromTotal(totalAmount: number): IgvBreakdown {
  const totalCent = toCentimos(totalAmount);
  // base = total / 1.18, but in integer: base = total * 10000 / 11800
  const baseCent = (totalCent * BPS_DIVISOR + 5900n) / (BPS_DIVISOR + IGV_BPS);
  const igvCent = totalCent - baseCent;
  return {
    baseImponible: toSoles(baseCent),
    igv: toSoles(igvCent),
    total: toSoles(totalCent),
  };
}

/**
 * Build a complete InvoiceItem from quantity, description, and unit price (sin IGV).
 */
export function buildItem(
  cantidad: number,
  descripcion: string,
  valorUnitario: number,
  unidad: string = 'NIU',
): InvoiceItem {
  const valorCent = toCentimos(valorUnitario);
  const igvUnitCent = (valorCent * IGV_BPS + BPS_DIVISOR / 2n) / BPS_DIVISOR;
  const precioUnitCent = valorCent + igvUnitCent;
  const cantBig = BigInt(Math.round(cantidad * 10000));
  const subtotalCent = (valorCent * cantBig + 5000n) / 10000n;
  const igvTotalCent = (subtotalCent * IGV_BPS + BPS_DIVISOR / 2n) / BPS_DIVISOR;
  const totalCent = subtotalCent + igvTotalCent;

  return {
    cantidad,
    unidad,
    descripcion,
    valorUnitario: toSoles(valorCent),
    precioUnitario: toSoles(precioUnitCent),
    igv: toSoles(igvTotalCent),
    subtotal: toSoles(subtotalCent),
    total: toSoles(totalCent),
  };
}

/**
 * Build an InvoiceItem from quantity, description, and unit price CON IGV (sale price).
 */
export function buildItemFromTotal(
  cantidad: number,
  descripcion: string,
  precioUnitario: number,
  unidad: string = 'NIU',
): InvoiceItem {
  const precioCent = toCentimos(precioUnitario);
  // valorUnitario = precioUnitario / 1.18
  const valorCent = (precioCent * BPS_DIVISOR + 5900n) / (BPS_DIVISOR + IGV_BPS);
  const igvUnitCent = precioCent - valorCent;
  const cantBig = BigInt(Math.round(cantidad * 10000));
  const subtotalCent = (valorCent * cantBig + 5000n) / 10000n;
  const igvTotalCent = (igvUnitCent * cantBig + 5000n) / 10000n;
  const totalCent = subtotalCent + igvTotalCent;

  return {
    cantidad,
    unidad,
    descripcion,
    valorUnitario: toSoles(valorCent),
    precioUnitario: toSoles(precioCent),
    igv: toSoles(igvTotalCent),
    subtotal: toSoles(subtotalCent),
    total: toSoles(totalCent),
  };
}

/**
 * Sum items into invoice totals. Deterministic — totals derived from items only.
 */
export function sumItems(items: InvoiceItem[]): {
  totalGravado: number;
  totalIgv: number;
  totalVenta: number;
} {
  let gravadoCent = 0n;
  let igvCent = 0n;
  let ventaCent = 0n;
  for (const item of items) {
    gravadoCent += toCentimos(item.subtotal);
    igvCent += toCentimos(item.igv);
    ventaCent += toCentimos(item.total);
  }
  return {
    totalGravado: toSoles(gravadoCent),
    totalIgv: toSoles(igvCent),
    totalVenta: toSoles(ventaCent),
  };
}
