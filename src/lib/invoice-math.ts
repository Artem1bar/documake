import type { LineItem } from "./types";

/**
 * All arithmetic happens in integer cents to avoid floating-point drift
 * (0.1 + 0.2 !== 0.3). Amounts round half-up per line, which matches
 * standard invoicing practice.
 */

export interface InvoiceTotals {
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
}

function safeNumber(value: number): number {
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function toCents(amount: number): number {
  return Math.round(safeNumber(amount) * 100);
}

/** Line total in currency units, rounded to cents. */
export function lineTotal(item: LineItem): number {
  const cents = Math.round(
    safeNumber(item.quantity) * safeNumber(item.unitPrice) * 100,
  );
  return cents / 100;
}

export function computeTotals(
  items: readonly LineItem[],
  taxRatePercent: number,
  discountAmount: number,
): InvoiceTotals {
  const subtotalCents = items.reduce(
    (sum, item) => sum + toCents(lineTotal(item)),
    0,
  );
  const taxCents = Math.round(
    (subtotalCents * safeNumber(taxRatePercent)) / 100,
  );
  const beforeDiscount = subtotalCents + taxCents;
  const discountCents = Math.min(toCents(discountAmount), beforeDiscount);
  return {
    subtotal: subtotalCents / 100,
    tax: taxCents / 100,
    discount: discountCents / 100,
    total: (beforeDiscount - discountCents) / 100,
  };
}
