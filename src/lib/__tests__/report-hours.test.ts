import { describe, expect, it } from "vitest";
import {
  annualHours,
  DEFAULT_WEEKS_PER_YEAR,
  formatHours,
  hoursTotals,
  weeklyHours,
} from "../report/hours";
import type { HoursRow } from "../report/schema";

function row(perWeek: number, minutesEach: number, id = "r1"): HoursRow {
  return { id, step: "", who: "", perWeek, minutesEach };
}

describe("weeklyHours", () => {
  it("turns a frequency and a per-run duration into hours", () => {
    expect(weeklyHours(row(6, 20))).toBe(2);
  });

  it("keeps fractions rather than rounding them away", () => {
    expect(weeklyHours(row(3, 25))).toBeCloseTo(1.25, 10);
  });

  it("is zero for a row that has not been filled in", () => {
    expect(weeklyHours(row(0, 0))).toBe(0);
  });

  it("treats non-finite values as zero", () => {
    expect(weeklyHours(row(Number.NaN, 20))).toBe(0);
    expect(weeklyHours(row(6, Number.POSITIVE_INFINITY))).toBe(0);
  });

  it("clamps negatives to zero rather than crediting time back", () => {
    expect(weeklyHours(row(-6, 20))).toBe(0);
  });
});

describe("annualHours", () => {
  it("multiplies the weekly figure by the stated working year", () => {
    expect(annualHours(row(6, 20), 48)).toBe(96);
  });

  it("falls back to the default working year when given a nonsense one", () => {
    for (const weeks of [0, -4, 90, Number.NaN]) {
      expect(annualHours(row(6, 20), weeks)).toBe(2 * DEFAULT_WEEKS_PER_YEAR);
    }
  });

  it("uses a working year shorter than the calendar year", () => {
    expect(DEFAULT_WEEKS_PER_YEAR).toBeLessThan(52);
  });
});

describe("hoursTotals", () => {
  it("sums weekly and annual across every row", () => {
    const totals = hoursTotals([row(6, 20, "a"), row(2, 30, "b")], 48);

    expect(totals.weekly).toBe(3);
    expect(totals.annual).toBe(144);
  });

  it("is zero for an empty table", () => {
    expect(hoursTotals([], 48)).toEqual({ weekly: 0, annual: 0 });
  });
});

describe("formatHours", () => {
  it("marks every figure as an estimate", () => {
    expect(formatHours(2.5, 1)).toBe("~2.5");
  });

  it("drops a trailing zero decimal", () => {
    expect(formatHours(2, 1)).toBe("~2");
  });

  it("rounds annual figures to whole hours", () => {
    expect(formatHours(95.6, 0)).toBe("~96");
  });

  it("shows nothing at all for zero, rather than an emphatic ~0", () => {
    expect(formatHours(0, 1)).toBe("");
    expect(formatHours(Number.NaN, 1)).toBe("");
  });
});
