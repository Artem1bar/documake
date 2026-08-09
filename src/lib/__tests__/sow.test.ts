import { describe, expect, it } from "vitest";
import { createDoc, DEFAULT_PROFILE } from "../factories";
import {
  DEFAULT_MILESTONE_SPLIT,
  formatSowAmount,
  isPriced,
  isSplitBalanced,
  milestoneAmount,
  percentTotal,
} from "../sow";
import type { Milestone } from "../types";
import { DOC_TYPE_LABELS, DOC_TYPES, DocSchema, SowDataSchema } from "../types";

function milestone(paymentPercent: number, id = "1"): Milestone {
  return { id, name: "", deliverables: "", dueDate: "", paymentPercent };
}

function sowDoc() {
  const doc = createDoc("sow", DEFAULT_PROFILE);
  if (doc.type !== "sow") throw new Error("expected sow");
  return doc;
}

describe("sow document type", () => {
  it("is registered alongside the other templates", () => {
    expect(DOC_TYPES).toContain("sow");
    expect(DOC_TYPE_LABELS.sow).toBe("SOW");
  });

  it("creates a schema-valid statement of work", () => {
    expect(DocSchema.safeParse(createDoc("sow", DEFAULT_PROFILE)).success).toBe(true);
  });

  it("fills every field from defaults when given an empty payload", () => {
    const parsed = SowDataSchema.parse({});

    expect(parsed.milestones).toEqual([]);
    expect(parsed.totalFee).toBe(0);
    expect(parsed.currency).toBe("USD");
  });

  it("rejects a payment percentage outside 0-100", () => {
    for (const paymentPercent of [-1, 101]) {
      const result = SowDataSchema.safeParse({ milestones: [milestone(paymentPercent)] });
      expect(result.success, `expected ${paymentPercent} to be rejected`).toBe(false);
    }
  });
});

describe("createDoc('sow')", () => {
  it("starts with the default milestone split", () => {
    expect(sowDoc().data.milestones.map((m) => m.paymentPercent)).toEqual([
      ...DEFAULT_MILESTONE_SPLIT,
    ]);
  });

  it("invents no fee and no milestone names", () => {
    const data = sowDoc().data;

    expect(data.totalFee).toBe(0);
    expect(data.milestones.every((m) => m.name === "")).toBe(true);
  });

  it("ships no pre-written legal text", () => {
    const data = sowDoc().data;

    expect(data.assumptions).toBe("");
    expect(data.changeControl).toBe("");
    expect(data.scope).toBe("");
    expect(data.outOfScope).toBe("");
  });

  it("takes currency and governing law from the profile", () => {
    const doc = createDoc("sow", {
      ...DEFAULT_PROFILE,
      currency: "GBP",
      defaultGoverningLaw: "England and Wales",
    });
    if (doc.type !== "sow") throw new Error("expected sow");

    expect(doc.data.currency).toBe("GBP");
    expect(doc.data.governingLaw).toBe("England and Wales");
  });
});

describe("payment schedule", () => {
  it("defaults to a split that adds up to 100%", () => {
    expect(DEFAULT_MILESTONE_SPLIT.reduce((a, b) => a + b, 0)).toBe(100);
  });

  it("sums the scheduled percentages", () => {
    expect(percentTotal([milestone(40), milestone(40, "2"), milestone(20, "3")])).toBe(100);
    expect(percentTotal([])).toBe(0);
  });

  it("flags a schedule that does not add up to 100%", () => {
    expect(isSplitBalanced([milestone(40), milestone(40, "2"), milestone(20, "3")])).toBe(true);
    expect(isSplitBalanced([milestone(50), milestone(40, "2")])).toBe(false);
    expect(isSplitBalanced([])).toBe(false);
  });

  it("computes a milestone amount in whole cents", () => {
    expect(milestoneAmount(10000, 40)).toBe(4000);
    expect(milestoneAmount(10000, 20)).toBe(2000);
    expect(milestoneAmount(999.99, 33.33)).toBe(333.3);
  });

  it("treats a missing or invalid fee as nothing owed", () => {
    expect(milestoneAmount(0, 40)).toBe(0);
    expect(milestoneAmount(Number.NaN, 40)).toBe(0);
    expect(milestoneAmount(-100, 40)).toBe(0);
  });

  it("reports whether a fee has been set", () => {
    expect(isPriced(0)).toBe(false);
    expect(isPriced(Number.NaN)).toBe(false);
    expect(isPriced(5000)).toBe(true);
  });

  it("prints TBD until a fee is set", () => {
    expect(formatSowAmount(0, "USD", false)).toBe("TBD");
    expect(formatSowAmount(4000, "USD", true)).toBe("$4,000.00");
  });
});
