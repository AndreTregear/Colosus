import { findByAmount, findByAmountAndName, type PaymentRow } from "./db.js";

export interface MatchResult {
  found: boolean;
  payment: PaymentRow | null;
  candidates: PaymentRow[];
}

/**
 * Find an unmatched payment within ±tolerance of the given amount.
 * Returns the most recent match if multiple exist.
 */
export function matchByAmount(amount: number, tolerance: number = 1.0): MatchResult {
  const candidates = findByAmount(amount, tolerance);
  if (candidates.length === 0) {
    return { found: false, payment: null, candidates: [] };
  }

  // Prefer exact match, then closest
  const exact = candidates.find((p) => p.amount === amount);
  const best =
    exact || candidates.sort((a, b) => Math.abs(a.amount - amount) - Math.abs(b.amount - amount))[0];

  return { found: true, payment: best, candidates };
}

/**
 * Find an unmatched payment matching both amount (±tolerance) and sender name (partial).
 */
export function matchByAmountAndName(
  amount: number,
  senderName: string,
  tolerance: number = 1.0
): MatchResult {
  const candidates = findByAmountAndName(amount, senderName, tolerance);
  if (candidates.length === 0) {
    return { found: false, payment: null, candidates: [] };
  }

  const exact = candidates.find((p) => p.amount === amount);
  const best =
    exact || candidates.sort((a, b) => Math.abs(a.amount - amount) - Math.abs(b.amount - amount))[0];

  return { found: true, payment: best, candidates };
}
