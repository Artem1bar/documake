import { formatMoney } from "./format";
import type { Milestone } from "./types";

/**
 * The shape a new statement of work starts with: a payment split across three
 * milestones. Percentages only — the fee itself stays unset, because inventing
 * a number is worse than leaving it visibly open.
 */
export const DEFAULT_MILESTONE_SPLIT: readonly number[] = [40, 40, 20];

export function percentTotal(milestones: readonly Milestone[]): number {
  return milestones.reduce((sum, milestone) => sum + milestone.paymentPercent, 0);
}

/** A schedule that does not add up to 100% is worth flagging before it is sent. */
export function isSplitBalanced(milestones: readonly Milestone[]): boolean {
  return percentTotal(milestones) === 100;
}

/** Integer-cent arithmetic, matching the invoice and quote line maths. */
export function milestoneAmount(totalFee: number, paymentPercent: number): number {
  const fee = Number.isFinite(totalFee) && totalFee > 0 ? totalFee : 0;
  const percent = Number.isFinite(paymentPercent) ? paymentPercent : 0;
  return Math.round(fee * percent) / 100;
}

/**
 * A statement of work is normally agreed before the fee is fixed, so an unset
 * fee prints as "TBD" rather than as zero.
 */
export function formatSowAmount(amount: number, currency: string, priced: boolean): string {
  return priced ? formatMoney(amount, currency) : "TBD";
}

export function isPriced(totalFee: number): boolean {
  return Number.isFinite(totalFee) && totalFee > 0;
}
