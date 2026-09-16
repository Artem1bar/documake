import {
  createBlock,
  emptyHoursRow,
  emptyListItem,
  emptyTableColumn,
  emptyTableRow,
} from "./blocks";
import { DEFAULT_WEEKS_PER_YEAR } from "./hours";
import type {
  ReportBlock,
  ReportData,
  ReportSection,
  ReportTemplateId,
  TableColumn,
} from "./schema";

function newId(): string {
  return crypto.randomUUID();
}

export const REPORT_TEMPLATE_IDS: readonly ReportTemplateId[] = ["map", "blank"] as const;

export const REPORT_TEMPLATE_LABELS: Record<ReportTemplateId, string> = {
  map: "The Map",
  blank: "Blank report",
};

/** The six sections of the source template, in the order it argues for. */
export const MAP_SECTION_KEYS = [
  "what-we-heard",
  "how-work-moves",
  "systems",
  "where-time-goes",
  "leave-alone",
  "honest-read",
] as const;

interface SectionPreset {
  key: string;
  title: string;
  /**
   * Authoring guidance, shown in the editor and never saved or printed. Kept
   * out of the document so improving it improves reports already written.
   */
  hint: string;
  blocks: () => ReportBlock[];
}

function column(
  header: string,
  overrides: Partial<Omit<TableColumn, "id" | "header">> = {},
): TableColumn {
  return { ...emptyTableColumn(header), ...overrides };
}

function table(columns: TableColumn[], rowCount: number): ReportBlock {
  return {
    id: newId(),
    kind: "table",
    caption: "",
    columns,
    rows: Array.from({ length: rowCount }, () => emptyTableRow(columns.length)),
  };
}

function prose(): ReportBlock {
  return { id: newId(), kind: "prose", text: "" };
}

/**
 * The Map: the free deliverable a prospect receives before spending anything,
 * so it carries the whole competence claim. Structure and guidance follow the
 * Weblux onboarding template it was lifted from; every field ships empty,
 * because a document that arrives pre-filled with plausible findings is worse
 * than no document.
 */
const MAP_SECTIONS: readonly SectionPreset[] = [
  {
    key: "what-we-heard",
    title: "What we heard",
    hint:
      "Half a page. The business, who does what, what they are trying to do more of. Written so they recognise themselves in it — this section earns the right to the rest. Quote one thing they actually said, verbatim, especially if it was “I just handle that manually”.",
    blocks: () => [prose(), createBlock("quote")],
  },
  {
    key: "how-work-moves",
    title: "How work moves today",
    hint:
      "The spine of the document. Numbered, first contact through to invoice paid. Every step gets an owner, a system and a rough duration, and the manual ones get marked. Where a step branches — after hours, new client versus existing — show the branch rather than flattening it. The branches are usually where the manual work lives.",
    blocks: () => [
      table(
        [
          column("#", { width: 24 }),
          column("Step"),
          column("Who", { width: 72 }),
          column("System", { width: 72 }),
          column("Time", { width: 50, align: "right" }),
          column("Manual", { kind: "marker", width: 54, align: "center" }),
        ],
        4,
      ),
      prose(),
    ],
  },
  {
    key: "systems",
    title: "Systems",
    hint:
      "What they pay for, what each is actually used for, and where two of them hold the same fact. Then a short paragraph naming every place the same fact lives twice — duplicate data is where the retyping is, and the retyping is the manual work.",
    blocks: () => [
      table(
        [
          column("System", { width: 92 }),
          column("Paid for", { width: 62 }),
          column("Actually used for"),
          column("Also holds"),
        ],
        3,
      ),
      prose(),
    ],
  },
  {
    key: "where-time-goes",
    title: "Where the time goes",
    hint:
      "The manual steps from the flow above, with hours against them. Ranges, and state the assumption. Do not invent precision — “~3–5 hrs/week” is credible, “4.2 hrs/week” starts an argument about the wrong thing.",
    blocks: () => [
      {
        id: newId(),
        kind: "hours",
        rows: [emptyHoursRow(), emptyHoursRow(), emptyHoursRow()],
        weeksPerYear: DEFAULT_WEEKS_PER_YEAR,
        assumptions: "",
      },
    ],
  },
  {
    key: "leave-alone",
    title: "What we would leave alone",
    hint:
      "Non-negotiable. At least two things they might expect you to flag, and why they are fine as they are. At least one should be a step where the manual part is load-bearing — a person applying judgement that should not be automated. That is the difference between a diagnosis and a quote.",
    blocks: () => [
      { id: newId(), kind: "list", style: "bullet", items: [emptyListItem(), emptyListItem()] },
    ],
  },
  {
    key: "honest-read",
    title: "The honest read",
    hint:
      "One paragraph, in one of three shapes. There is something here — name roughly what, with no price and no spec. There is something here, but not yet — what is blocking it is theirs to fix first. There is not enough here to justify a build — say what to do instead, and end the engagement in the same paragraph. The third one has to actually get sent when it is true; the first time it is softened into a maybe, the map stops being a diagnostic.",
    blocks: () => [{ id: newId(), kind: "callout", tone: "verdict", title: "", text: "" }],
  },
] as const;

const BLANK_SECTIONS: readonly SectionPreset[] = [
  {
    key: "",
    title: "",
    hint: "",
    blocks: () => [prose()],
  },
] as const;

const TEMPLATE_SECTIONS: Record<ReportTemplateId, readonly SectionPreset[]> = {
  map: MAP_SECTIONS,
  blank: BLANK_SECTIONS,
};

/** The closing line of The Map, which is part of the offer rather than decoration. */
const MAP_CLOSING =
  "This document is yours. It was free, it stays free, and there is nothing to sign.";

export function sectionHint(templateId: ReportTemplateId, key: string): string {
  const preset = TEMPLATE_SECTIONS[templateId].find((section) => section.key === key);
  return preset?.hint ?? "";
}

function toSection(preset: SectionPreset): ReportSection {
  return {
    id: newId(),
    key: preset.key,
    title: preset.title,
    blocks: preset.blocks(),
  };
}

export function createReportData(templateId: ReportTemplateId): ReportData {
  return {
    templateId,
    heading: "",
    preparedFor: "",
    preparedForRole: "",
    documentDate: "",
    basedOn: "",
    sections: TEMPLATE_SECTIONS[templateId].map(toSection),
    closing: templateId === "map" ? MAP_CLOSING : "",
  };
}

/** Placeholder copy for the header fields, per template. */
export const REPORT_HEADING_PLACEHOLDERS: Record<ReportTemplateId, string> = {
  map: "How work moves through Acme Ltd",
  blank: "Report title",
};

