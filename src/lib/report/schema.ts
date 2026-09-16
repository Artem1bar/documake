import { z } from "zod";

/**
 * A report is a sectioned document — prose, tables, a costed hours table, a
 * verdict — rather than a fixed set of fields like an invoice. The unit of
 * reuse is therefore the block, not the report: a template such as The Map is
 * a list of sections holding these blocks, which makes it data rather than
 * code, and makes the next report in the playbook nearly free.
 *
 * The vocabulary stays deliberately small. A block earns its place when two
 * documents need it; anything rarer is a table or a paragraph.
 */

const blockBase = { id: z.string() };

/**
 * A `marker` column prints a dot when its cell is non-empty. That is the
 * manual-step column of a process flow — the whole visual point of that table —
 * kept general instead of hard-coding a map-specific block.
 */
export const TableColumnKindSchema = z.enum(["text", "marker"]);
export type TableColumnKind = z.infer<typeof TableColumnKindSchema>;

export const TableAlignSchema = z.enum(["left", "center", "right"]);
export type TableAlign = z.infer<typeof TableAlignSchema>;

export const TableColumnSchema = z.object({
  id: z.string(),
  header: z.string().default(""),
  kind: TableColumnKindSchema.default("text"),
  align: TableAlignSchema.default("left"),
  /** Fixed width in points. Zero means share the leftover space evenly. */
  width: z.number().min(0).max(400).default(0),
});
export type TableColumn = z.infer<typeof TableColumnSchema>;

export const TableRowSchema = z.object({
  id: z.string(),
  cells: z.array(z.string()).default([]),
});
export type TableRow = z.infer<typeof TableRowSchema>;

/**
 * Cells and columns can drift apart — a column added to a table full of rows,
 * or a payload written by an older build. Every read goes through here so a
 * short row renders as blanks instead of throwing.
 */
export function cellAt(row: TableRow, index: number): string {
  return row.cells[index] ?? "";
}

export const HoursRowSchema = z.object({
  id: z.string(),
  step: z.string().default(""),
  who: z.string().default(""),
  /** How many times the step runs each week. */
  perWeek: z.number().default(0),
  /** How long one run takes. Minutes, because that is how people answer. */
  minutesEach: z.number().default(0),
});
export type HoursRow = z.infer<typeof HoursRowSchema>;

export const ListItemSchema = z.object({
  id: z.string(),
  /** Optional bold lead-in, for the "**Step.** Why it is fine" shape. */
  term: z.string().default(""),
  text: z.string().default(""),
});
export type ListItem = z.infer<typeof ListItemSchema>;

export const ChecklistItemSchema = z.object({
  id: z.string(),
  text: z.string().default(""),
});
export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;

export const ListStyleSchema = z.enum(["bullet", "number"]);
export type ListStyle = z.infer<typeof ListStyleSchema>;

export const CalloutToneSchema = z.enum(["verdict", "note", "warning"]);
export type CalloutTone = z.infer<typeof CalloutToneSchema>;

export const ProseBlockSchema = z.object({
  ...blockBase,
  kind: z.literal("prose"),
  text: z.string().default(""),
});

export const QuoteBlockSchema = z.object({
  ...blockBase,
  kind: z.literal("quote"),
  text: z.string().default(""),
  attribution: z.string().default(""),
});

export const TableBlockSchema = z.object({
  ...blockBase,
  kind: z.literal("table"),
  caption: z.string().default(""),
  columns: z.array(TableColumnSchema).default([]),
  rows: z.array(TableRowSchema).default([]),
});

export const HoursBlockSchema = z.object({
  ...blockBase,
  kind: z.literal("hours"),
  rows: z.array(HoursRowSchema).default([]),
  /**
   * Stored on the block and printed under the table. The source template is
   * explicit that unstated assumptions start an argument about the wrong
   * thing, so the working year travels with the number it produced.
   */
  weeksPerYear: z.number().default(48),
  assumptions: z.string().default(""),
});

export const ListBlockSchema = z.object({
  ...blockBase,
  kind: z.literal("list"),
  style: ListStyleSchema.default("bullet"),
  items: z.array(ListItemSchema).default([]),
});

export const ChecklistBlockSchema = z.object({
  ...blockBase,
  kind: z.literal("checklist"),
  items: z.array(ChecklistItemSchema).default([]),
});

export const CalloutBlockSchema = z.object({
  ...blockBase,
  kind: z.literal("callout"),
  tone: CalloutToneSchema.default("note"),
  title: z.string().default(""),
  text: z.string().default(""),
});

export const ReportBlockSchema = z.discriminatedUnion("kind", [
  ProseBlockSchema,
  QuoteBlockSchema,
  TableBlockSchema,
  HoursBlockSchema,
  ListBlockSchema,
  ChecklistBlockSchema,
  CalloutBlockSchema,
]);
export type ReportBlock = z.infer<typeof ReportBlockSchema>;
export type BlockKind = ReportBlock["kind"];

export const ReportSectionSchema = z.object({
  id: z.string(),
  /**
   * Ties a section back to the preset it came from, so its authoring guidance
   * can be looked up at edit time. Empty for sections the author added.
   */
  key: z.string().default(""),
  title: z.string().default(""),
  blocks: z.array(ReportBlockSchema).default([]),
});
export type ReportSection = z.infer<typeof ReportSectionSchema>;

export const ReportTemplateIdSchema = z.enum(["blank", "map"]);
export type ReportTemplateId = z.infer<typeof ReportTemplateIdSchema>;

export const ReportDataSchema = z.object({
  templateId: ReportTemplateIdSchema.default("blank"),
  heading: z.string().default(""),
  preparedFor: z.string().default(""),
  preparedForRole: z.string().default(""),
  documentDate: z.string().default(""),
  /** Free text, e.g. "Based on our conversation of Aug 1, 2026". */
  basedOn: z.string().default(""),
  sections: z.array(ReportSectionSchema).default([]),
  closing: z.string().default(""),
});
export type ReportData = z.infer<typeof ReportDataSchema>;

export type ProseBlock = z.infer<typeof ProseBlockSchema>;
export type QuoteBlock = z.infer<typeof QuoteBlockSchema>;
export type TableBlock = z.infer<typeof TableBlockSchema>;
export type HoursBlock = z.infer<typeof HoursBlockSchema>;
export type ListBlock = z.infer<typeof ListBlockSchema>;
export type ChecklistBlock = z.infer<typeof ChecklistBlockSchema>;
export type CalloutBlock = z.infer<typeof CalloutBlockSchema>;
