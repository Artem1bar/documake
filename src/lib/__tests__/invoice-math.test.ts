import { describe, expect, it } from "vitest";
import { computeTotals, lineTotal } from "../invoice-math";
import type { LineItem } from "../types";

function item(quantity: number, unitPrice: number): LineItem {
  return { id: "test", description: "", quantity, unitPrice };
}

describe("lineTotal", () => {
  it("multiplies quantity by unit price, rounded to cents", () => {
    expect(lineTotal(item(3, 19.99))).toBe(59.97);
  });

  it("avoids floating-point drift", () => {
    expect(lineTotal(item(3, 0.1))).toBe(0.3);
  });

  it("treats negative and non-finite inputs as zero", () => {
    expect(lineTotal(item(-2, 10))).toBe(0);
    expect(lineTotal(item(Number.NaN, 10))).toBe(0);
    expect(lineTotal(item(2, Number.POSITIVE_INFINITY))).toBe(0);
  });
});

describe("computeTotals", () => {
  it("returns zeros for an empty invoice", () => {
    expect(computeTotals([], 10, 5)).toEqual({
      subtotal: 0,
      tax: 0,
      discount: 0,
      total: 0,
    });
  });

  it("sums per-line rounded amounts", () => {
    const totals = computeTotals([item(2, 19.99), item(1, 5.5)], 0, 0);
    expect(totals.subtotal).toBe(45.48);
    expect(totals.total).toBe(45.48);
  });

  it("computes tax on the subtotal, rounding half-up at the cent", () => {
    const totals = computeTotals([item(1, 10.1)], 5, 0);
    expect(totals.tax).toBe(0.51);
    expect(totals.total).toBe(10.61);
  });

  it("applies a percentage tax rate exactly", () => {
    const totals = computeTotals([item(1, 100)], 8.25, 0);
    expect(totals.tax).toBe(8.25);
    expect(totals.total).toBe(108.25);
  });

  it("clamps the discount so the total never goes negative", () => {
    const totals = computeTotals([item(1, 10)], 0, 50);
    expect(totals.discount).toBe(10);
    expect(totals.total).toBe(0);
  });

  it("ignores invalid tax rates and discounts", () => {
    const totals = computeTotals([item(1, 100)], Number.NaN, -20);
    expect(totals.tax).toBe(0);
    expect(totals.discount).toBe(0);
    expect(totals.total).toBe(100);
  });
});
