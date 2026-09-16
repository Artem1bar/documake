import type {
  BlockKind,
  ChecklistItem,
  HoursRow,
  ListItem,
  ReportBlock,
  ReportSection,
  TableColumn,
  TableRow,
} from "./schema";
import { DEFAULT_WEEKS_PER_YEAR } from "./hours";

function newId(): string {
  return crypto.randomUUID();
}

/** The order the editor offers them in: prose first, because most of a report is prose. */
export const BLOCK_KINDS: readonly BlockKind[] = [
  "prose",
  "table",
  "hours",
  "list",
  "checklist",
  "quote",
  "callout",
] as const;

export const BLOCK_KIND_LABELS: Record<BlockKind, string> = {
  prose: "Paragraphs",
  table: "Table",
  hours: "Hours table",
  list: "List",
  checklist: "Checklist",
  quote: "Quote",
  callout: "Callout",
};

export const BLOCK_KIND_HINTS: Record<BlockKind, string> = {
  prose: "Plain paragraphs. Blank lines separate them.",
  table: "Any tabular content. A marker column prints a dot for the rows it applies to.",
  hours: "Frequency and duration per step; weekly and annual totals are worked out for you.",
  list: "Bulleted or numbered. The bold lead-in is optional.",
  checklist: "One empty tick box per line, for something to be worked through on a call.",
  quote: "A verbatim line, set apart. Their words, not a paraphrase.",
  callout: "A single point that has to be read. Use it sparingly or it stops working.",
};

export function emptyTableColumn(header = ""): TableColumn {
  return { id: newId(), header, kind: "text", align: "left", width: 0 };
}

export function emptyTableRow(columnCount: number): TableRow {
  return { id: newId(), cells: Array.from({ length: columnCount }, () => "") };
}

export function emptyHoursRow(): HoursRow {
  return { id: newId(), step: "", who: "", perWeek: 0, minutesEach: 0 };
}

export function emptyListItem(): ListItem {
  return { id: newId(), term: "", text: "" };
}

export function emptyChecklistItem(): ChecklistItem {
  return { id: newId(), text: "" };
}

export function emptySection(title = ""): ReportSection {
  return { id: newId(), key: "", title, blocks: [createBlock("prose")] };
}

/** A new block of the requested kind, ready to edit and already schema-valid. */
export function createBlock(kind: BlockKind): ReportBlock {
  const id = newId();

  switch (kind) {
    case "prose":
      return { id, kind, text: "" };
    case "quote":
      return { id, kind, text: "", attribution: "" };
    case "table": {
      const columns = [emptyTableColumn(), emptyTableColumn()];
      return {
        id,
        kind,
        caption: "",
        columns,
        rows: [emptyTableRow(columns.length), emptyTableRow(columns.length)],
      };
    }
    case "hours":
      return {
        id,
        kind,
        rows: [emptyHoursRow(), emptyHoursRow()],
        weeksPerYear: DEFAULT_WEEKS_PER_YEAR,
        assumptions: "",
      };
    case "list":
      return { id, kind, style: "bullet", items: [emptyListItem(), emptyListItem()] };
    case "checklist":
      return { id, kind, items: [emptyChecklistItem(), emptyChecklistItem()] };
    case "callout":
      return { id, kind, tone: "note", title: "", text: "" };
  }
}

/** Keeps every row as wide as the header when a column is added or removed. */
export function resizeRows(rows: readonly TableRow[], columnCount: number): TableRow[] {
  return rows.map((row) => ({
    ...row,
    cells: Array.from({ length: columnCount }, (_, index) => row.cells[index] ?? ""),
  }));
}
