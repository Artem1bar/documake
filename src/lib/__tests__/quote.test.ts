import { describe, expect, it } from "vitest";
import { createDoc, DEFAULT_PROFILE } from "../factories";
import { computeTotals } from "../invoice-math";
import { formatQuoteAmount, hasAnyPrice, QUOTE_VALIDITY_DAYS } from "../quote";
import type { LineItem } from "../types";
import { DOC_TYPE_LABELS, DOC_TYPES, DocSchema, QuoteDataSchema } from "../types";

function item(overrides: Partial<LineItem> = {}): LineItem {
  return { id: "1", description: "Work", quantity: 1, unitPrice: 0, ...overrides };
}

describe("quote document type", () => {
  it("is registered alongside the other templates", () => {
    expect(DOC_TYPES).toContain("quote");
    expect(DOC_TYPE_LABELS.quote).toBe("Quote");
  });

  it("creates a schema-valid quote", () => {
    expect(DocSchema.safeParse(createDoc("quote", DEFAULT_PROFILE)).success).toBe(true);
  });

  it("fills every field from defaults when given an empty payload", () => {
    const parsed = QuoteDataSchema.parse({});

    expect(parsed.items).toEqual([]);
    expect(parsed.currency).toBe("USD");
    expect(parsed.quoteNumber).toBe("");
  });
});

describe("createDoc('quote')", () => {
  it("takes currency and tax rate from the profile", () => {
    const doc = createDoc("quote", {
      ...DEFAULT_PROFILE,
      currency: "EUR",
      defaultTaxRate: 19,
    });
    if (doc.type !== "quote") throw new Error("expected quote");

    expect(doc.data.currency).toBe("EUR");
    expect(doc.data.taxRate).toBe(19);
  });

  it("sets a validity date ahead of the issue date", () => {
    const doc = createDoc("quote", DEFAULT_PROFILE);
    if (doc.type !== "quote") throw new Error("expected quote");

    expect(doc.data.issueDate).not.toBe("");
    expect(doc.data.validUntil > doc.data.issueDate).toBe(true);
  });

  it("starts with no invented prices", () => {
    const doc = createDoc("quote", DEFAULT_PROFILE);
    if (doc.type !== "quote") throw new Error("expected quote");

    expect(doc.data.items.every((line) => line.unitPrice === 0)).toBe(true);
    expect(doc.data.discount).toBe(0);
  });

  it("does not consume an invoice number", () => {
    const doc = createDoc("quote", { ...DEFAULT_PROFILE, nextInvoiceNumber: 7 });
    if (doc.type !== "quote") throw new Error("expected quote");

    expect(doc.data.quoteNumber).not.toContain("0007");
  });

  it("uses a sensible default validity window", () => {
    expect(QUOTE_VALIDITY_DAYS).toBeGreaterThan(0);
  });
});

describe("quote money display", () => {
  it("reports whether any line carries a price", () => {
    expect(hasAnyPrice([])).toBe(false);
    expect(hasAnyPrice([item(), item({ id: "2" })])).toBe(false);
    expect(hasAnyPrice([item(), item({ id: "2", unitPrice: 100 })])).toBe(true);
  });

  it("shows TBD rather than a false zero", () => {
    expect(formatQuoteAmount(0, "USD", false)).toBe("TBD");
    expect(formatQuoteAmount(250, "USD", false)).toBe("TBD");
  });

  it("formats real amounts as money", () => {
    expect(formatQuoteAmount(250, "USD", true)).toBe("$250.00");
    expect(formatQuoteAmount(0, "USD", true)).toBe("$0.00");
  });

  it("totals only the priced lines when a quote is partly priced", () => {
    const lines = [item({ unitPrice: 100 }), item({ id: "2", unitPrice: 0 })];
    const totals = computeTotals(lines, 0, 0);

    expect(totals.subtotal).toBe(100);
    expect(hasAnyPrice(lines)).toBe(true);
  });

  it("reuses invoice arithmetic, including integer-cent safety", () => {
    const totals = computeTotals(
      [item({ quantity: 3, unitPrice: 0.1 }), item({ id: "2", quantity: 1, unitPrice: 0.2 })],
      0,
      0,
    );

    expect(totals.subtotal).toBe(0.5);
  });
});
