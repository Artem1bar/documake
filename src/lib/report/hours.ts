import type { HoursRow } from "./schema";

/**
 * A working year, not a calendar one: 52 weeks less roughly four weeks of
 * public holidays and leave. Deliberately conservative — a map that overstates
 * the saving is the one that gets argued with instead of acted on. It is
 * stored per block and printed under the table, so a client who works a
 * different year can say so.
 */
export const DEFAULT_WEEKS_PER_YEAR = 48;

const MINUTES_PER_HOUR = 60;
const MAX_WEEKS_PER_YEAR = 52;

/** Persisted data is untrusted input: anything unusable counts as nothing. */
function positive(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function weeklyHours(row: HoursRow): number {
  return (positive(row.perWeek) * positive(row.minutesEach)) / MINUTES_PER_HOUR;
}

function safeWeeks(weeksPerYear: number): number {
  const weeks = positive(weeksPerYear);
  return weeks > 0 && weeks <= MAX_WEEKS_PER_YEAR ? weeks : DEFAULT_WEEKS_PER_YEAR;
}

export function annualHours(row: HoursRow, weeksPerYear: number): number {
  return weeklyHours(row) * safeWeeks(weeksPerYear);
}

export interface HoursTotals {
  weekly: number;
  annual: number;
}

export function hoursTotals(
  rows: readonly HoursRow[],
  weeksPerYear: number,
): HoursTotals {
  return rows.reduce<HoursTotals>(
    (totals, row) => ({
      weekly: totals.weekly + weeklyHours(row),
      annual: totals.annual + annualHours(row, weeksPerYear),
    }),
    { weekly: 0, annual: 0 },
  );
}

/**
 * Every figure here is an estimate built from a number someone gave in
 * conversation, so it prints with a tilde and never with more precision than
 * it has. Zero prints as nothing at all — an unfilled row should be quiet,
 * not announce "~0".
 */
export function formatHours(hours: number, decimals: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return "";

  // Round first, then re-check: a figure small enough to round away at this
  // precision should stay quiet rather than print as "~0".
  const rounded = Number.parseFloat(hours.toFixed(Math.max(0, decimals)));
  return rounded > 0 ? `~${rounded}` : "";
}
