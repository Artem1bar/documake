import { formatMoney } from "./format";
import type { LineItem } from "./types";

/** How long a new quote stays valid, in days from its issue date. */
export const QUOTE_VALIDITY_DAYS = 30;

/** True once at least one line carries a price. */
export function hasAnyPrice(items: readonly LineItem[]): boolean {
  return items.some((item) => item.unitPrice > 0);
}

/**
 * Quotes are written before the numbers are settled, so an amount with no
 * price behind it reads as "TBD" rather than a confident zero — a quote that
 * says $0.00 is a quote that says the work is free.
 */
export function formatQuoteAmount(
  amount: number,
  currency: string,
  priced: boolean,
): string {
  return priced ? formatMoney(amount, currency) : "TBD";
}
