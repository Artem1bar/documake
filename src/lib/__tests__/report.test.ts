import { describe, expect, it } from "vitest";
import { createDoc, DEFAULT_PROFILE } from "../factories";
import { BLOCK_KINDS, createBlock, resizeRows } from "../report/blocks";
import { MAP_SECTION_KEYS, REPORT_TEMPLATE_IDS, createReportData, sectionHint } from "../report/presets";
import { ReportBlockSchema, ReportDataSchema, cellAt } from "../report/schema";
import type { ReportBlock, ReportData } from "../report/schema";
import { RenderRequestSchema, resolveFilename } from "../render-request";
import { DOC_TYPE_LABELS, DOC_TYPES, DocSchema } from "../types";

function reportDoc() {
  const doc = createDoc("report", DEFAULT_PROFILE);
  if (doc.type !== "report") throw new Error("expected report");
  return doc;
}

function blocksOf(data: ReportData, key: string): ReportBlock[] {
  const section = data.sections.find((candidate) => candidate.key === key);
  if (!section) throw new Error(`no section keyed ${key}`);
  return section.blocks;
}

describe("report document type", () => {
  it("is registered alongside the other templates", () => {
    expect(DOC_TYPES).toContain("report");
    expect(DOC_TYPE_LABELS.report).toBe("Report");
  });

  it("creates a schema-valid report", () => {
    expect(DocSchema.safeParse(reportDoc()).success).toBe(true);
  });

  it("fills every field from defaults when given an empty payload", () => {
    const parsed = ReportDataSchema.parse({});

    expect(parsed.sections).toEqual([]);
    expect(parsed.templateId).toBe("blank");
    expect(parsed.heading).toBe("");
  });

  it("leaves documents written before it existed readable", () => {
    const stored = { ...reportDoc(), type: "nda", data: {} };
    expect(DocSchema.safeParse(stored).success).toBe(true);
  });
});

describe("block vocabulary", () => {
  it("builds a schema-valid block for every kind it advertises", () => {
    for (const kind of BLOCK_KINDS) {
      const result = ReportBlockSchema.safeParse(createBlock(kind));
      expect(result.success, `${kind} did not parse`).toBe(true);
    }
  });

  it("gives every block a distinct id", () => {
    const ids = BLOCK_KINDS.map((kind) => createBlock(kind).id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("rejects a block kind outside the vocabulary", () => {
    expect(ReportBlockSchema.safeParse({ id: "x", kind: "chart" }).success).toBe(false);
  });
});

describe("cellAt", () => {
  it("reads a cell by column index", () => {
    expect(cellAt({ id: "r", cells: ["a", "b"] }, 1)).toBe("b");
  });

  it("returns an empty string for a row shorter than the header", () => {
    expect(cellAt({ id: "r", cells: ["a"] }, 4)).toBe("");
  });
});

describe("the map preset", () => {
  it("is offered as a template", () => {
    expect(REPORT_TEMPLATE_IDS).toContain("map");
    expect(REPORT_TEMPLATE_IDS).toContain("blank");
  });

  it("lays out the six sections of the source document, in order", () => {
    const data = createReportData("map");
    expect(data.sections.map((section) => section.key)).toEqual([...MAP_SECTION_KEYS]);
  });

  it("produces a schema-valid document", () => {
    expect(ReportDataSchema.safeParse(createReportData("map")).success).toBe(true);
  });

  it("marks the manual steps in the process flow, which is the point of that table", () => {
    const table = blocksOf(createReportData("map"), "how-work-moves").find(
      (block) => block.kind === "table",
    );

    expect(table?.kind === "table" && table.columns.some((c) => c.kind === "marker")).toBe(true);
  });

  it("counts the cost of those manual steps in an hours table", () => {
    expect(blocksOf(createReportData("map"), "where-time-goes").map((b) => b.kind)).toContain(
      "hours",
    );
  });

  it("ends on a verdict callout, so the honest read cannot be quietly softened", () => {
    expect(blocksOf(createReportData("map"), "honest-read").map((b) => b.kind)).toContain(
      "callout",
    );
  });

  it("carries the authoring guidance as a hint for every section", () => {
    for (const key of MAP_SECTION_KEYS) {
      expect(sectionHint("map", key).length, `${key} has no hint`).toBeGreaterThan(20);
    }
  });

  it("keeps hints out of the saved document, so improving the preset improves old ones", () => {
    const serialized = JSON.stringify(createReportData("map"));
    expect(serialized).not.toContain(sectionHint("map", "what-we-heard"));
  });

  it("starts blank reports genuinely blank", () => {
    expect(createReportData("blank").sections).toHaveLength(1);
  });

  it("invents no client name and no findings", () => {
    const data = createReportData("map");

    expect(data.preparedFor).toBe("");
    expect(data.heading).toBe("");
    const prose = blocksOf(data, "what-we-heard").find((block) => block.kind === "prose");
    expect(prose?.kind === "prose" && prose.text).toBe("");
  });
});

describe("resizeRows", () => {
  it("pads short rows when a column is added", () => {
    const rows = resizeRows([{ id: "r", cells: ["a", "b"] }], 4);
    expect(rows[0].cells).toEqual(["a", "b", "", ""]);
  });

  it("drops trailing cells when a column is removed", () => {
    const rows = resizeRows([{ id: "r", cells: ["a", "b", "c"] }], 2);
    expect(rows[0].cells).toEqual(["a", "b"]);
  });

  it("returns new rows rather than mutating the originals", () => {
    const original = { id: "r", cells: ["a"] };
    const resized = resizeRows([original], 3);

    expect(resized[0]).not.toBe(original);
    expect(original.cells).toEqual(["a"]);
  });
});

describe("the render API", () => {
  it("accepts a report", () => {
    const result = RenderRequestSchema.safeParse({
      type: "report",
      data: createReportData("map"),
    });

    expect(result.success).toBe(true);
  });

  it("rejects a report carrying a block kind outside the vocabulary", () => {
    const data = createReportData("map");
    const result = RenderRequestSchema.safeParse({
      type: "report",
      data: {
        ...data,
        sections: [{ id: "s", key: "", title: "", blocks: [{ id: "b", kind: "iframe" }] }],
      },
    });

    expect(result.success).toBe(false);
  });

  it("names the downloaded file after the type when none is given", () => {
    expect(resolveFilename("report", undefined)).toBe("report.pdf");
  });
});
