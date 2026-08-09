import { describe, expect, it } from "vitest";
import { createDoc, DEFAULT_PROFILE, formatInvoiceNumber } from "../factories";
import { parseDocs, parseProfile } from "../storage";
import { DocSchema, DOC_TYPES } from "../types";

describe("factories", () => {
  it.each(DOC_TYPES)("creates a schema-valid %s document", (type) => {
    const doc = createDoc(type, DEFAULT_PROFILE);
    const result = DocSchema.safeParse(doc);
    expect(result.success).toBe(true);
  });

  it("pre-fills invoices from the company profile", () => {
    const profile = {
      ...DEFAULT_PROFILE,
      currency: "EUR",
      defaultTaxRate: 20,
      invoicePrefix: "ACME-",
      nextInvoiceNumber: 7,
    };
    const doc = createDoc("invoice", profile);
    if (doc.type !== "invoice") throw new Error("expected invoice");
    expect(doc.data.invoiceNumber).toBe("ACME-0007");
    expect(doc.data.currency).toBe("EUR");
    expect(doc.data.taxRate).toBe(20);
  });

  it("pads invoice numbers to four digits", () => {
    expect(formatInvoiceNumber(DEFAULT_PROFILE)).toBe("INV-0001");
    expect(
      formatInvoiceNumber({ ...DEFAULT_PROFILE, nextInvoiceNumber: 12345 }),
    ).toBe("INV-12345");
  });
});

describe("parseDocs", () => {
  it("keeps valid documents and drops corrupt entries", () => {
    const valid = createDoc("nda", DEFAULT_PROFILE);
    const parsed = parseDocs([valid, { garbage: true }, 42, null]);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.id).toBe(valid.id);
  });

  it("returns an empty list for non-array input", () => {
    expect(parseDocs(null)).toEqual([]);
    expect(parseDocs("nonsense")).toEqual([]);
    expect(parseDocs({})).toEqual([]);
  });
});

describe("parseProfile", () => {
  it("falls back to defaults on corrupt data", () => {
    expect(parseProfile("nonsense")).toEqual(DEFAULT_PROFILE);
    expect(parseProfile(null)).toEqual(DEFAULT_PROFILE);
  });

  it("fills missing fields with defaults", () => {
    const parsed = parseProfile({ name: "Weblux" });
    expect(parsed.name).toBe("Weblux");
    expect(parsed.currency).toBe("USD");
    expect(parsed.nextInvoiceNumber).toBe(1);
  });
});
