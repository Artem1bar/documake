import { StyleSheet, Text, View } from "@react-pdf/renderer";
import {
  annualHours,
  formatHours,
  hoursTotals,
  weeklyHours,
} from "@/lib/report/hours";
import { cellAt } from "@/lib/report/schema";
import type {
  CalloutTone,
  HoursBlock,
  ReportBlock,
  TableAlign,
  TableBlock,
  TableColumn,
} from "@/lib/report/schema";
import type { PdfTheme } from "./theme";
import { hairline, muted, toParagraphs } from "./theme";

const WEEKLY_DECIMALS = 1;
const ANNUAL_DECIMALS = 0;

const styles = StyleSheet.create({
  block: {
    marginTop: 10,
  },
  paragraph: {
    marginBottom: 6,
    textAlign: "justify",
  },
  quote: {
    borderLeftWidth: 2,
    paddingLeft: 12,
    paddingVertical: 2,
    marginVertical: 4,
  },
  quoteAttribution: {
    fontSize: 9,
    color: muted,
    marginTop: 4,
  },
  caption: {
    fontSize: 8.5,
    color: muted,
    marginBottom: 5,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1.5,
    paddingBottom: 5,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: hairline,
    paddingVertical: 6,
  },
  totalRow: {
    flexDirection: "row",
    paddingTop: 6,
  },
  cell: {
    paddingRight: 8,
  },
  headerCell: {
    fontSize: 7.5,
    color: muted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    paddingRight: 8,
  },
  marker: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    alignSelf: "center",
  },
  assumptions: {
    fontSize: 8.5,
    color: muted,
    marginTop: 6,
  },
  listItem: {
    flexDirection: "row",
    marginBottom: 5,
  },
  bullet: {
    width: 16,
    color: muted,
  },
  checkbox: {
    width: 9,
    height: 9,
    borderWidth: 1,
    borderColor: muted,
    borderRadius: 2,
    marginRight: 8,
    marginTop: 2.5,
  },
  callout: {
    borderLeftWidth: 3,
    borderRadius: 2,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginVertical: 4,
  },
  calloutTitle: {
    marginBottom: 4,
  },
});

interface BlockProps {
  block: ReportBlock;
  theme: PdfTheme;
}

/** Fixed-width columns keep their width; the rest share what is left. */
function columnStyle(column: TableColumn) {
  const align: TableAlign = column.align;
  return column.width > 0
    ? { width: column.width, textAlign: align }
    : { flex: 1, textAlign: align };
}

function markerAlignment(align: TableAlign) {
  if (align === "right") return "flex-end" as const;
  if (align === "center") return "center" as const;
  return "flex-start" as const;
}

function TableCell({
  column,
  value,
  theme,
}: {
  column: TableColumn;
  value: string;
  theme: PdfTheme;
}) {
  // A marker column carries no text: any non-empty cell prints as a dot, which
  // is what makes a column of manual steps readable at a glance.
  if (column.kind === "marker") {
    return (
      <View
        style={[
          styles.cell,
          columnStyle(column),
          // Centred against the row's full height, so a dot lines up with the
          // text beside it instead of floating at the top of a tall row.
          { alignItems: markerAlignment(column.align), justifyContent: "center" },
        ]}
      >
        {value.trim() ? (
          <View style={[styles.marker, { backgroundColor: theme.accent }]} />
        ) : null}
      </View>
    );
  }

  return <Text style={[styles.cell, columnStyle(column)]}>{value}</Text>;
}

function TableBlockView({ block, theme }: { block: TableBlock; theme: PdfTheme }) {
  if (block.columns.length === 0) return null;

  return (
    <View style={styles.block}>
      {block.caption ? <Text style={styles.caption}>{block.caption}</Text> : null}
      {/* `fixed` repeats the header on every page this table spans, and only
          those — verified, not assumed. A table that breaks keeps its column
          names instead of stranding rows under nothing. */}
      <View style={[styles.tableHeader, { borderBottomColor: theme.accent }]} fixed>
        {block.columns.map((column) => (
          <Text key={column.id} style={[styles.headerCell, columnStyle(column)]}>
            {column.header}
          </Text>
        ))}
      </View>
      {block.rows.map((row) => (
        // Rows stay whole across a page break; the table itself may split.
        <View key={row.id} style={styles.row} wrap={false}>
          {block.columns.map((column, index) => (
            <TableCell
              key={column.id}
              column={column}
              value={cellAt(row, index)}
              theme={theme}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const HOURS_COLUMNS = [
  { key: "step", label: "Step", style: { flex: 1, paddingRight: 8 } },
  { key: "who", label: "Who", style: { width: 78, paddingRight: 8 } },
  { key: "perWeek", label: "Per week", style: { width: 52, textAlign: "right" as const } },
  { key: "each", label: "Each", style: { width: 52, textAlign: "right" as const } },
  { key: "weekly", label: "Weekly", style: { width: 56, textAlign: "right" as const } },
  { key: "annual", label: "Annual", style: { width: 58, textAlign: "right" as const } },
] as const;

function HoursBlockView({ block, theme }: { block: HoursBlock; theme: PdfTheme }) {
  const totals = hoursTotals(block.rows, block.weeksPerYear);

  return (
    <View style={styles.block}>
      <View style={[styles.tableHeader, { borderBottomColor: theme.accent }]} fixed>
        {HOURS_COLUMNS.map((column) => (
          <Text key={column.key} style={[styles.headerCell, column.style]}>
            {column.label}
          </Text>
        ))}
      </View>
      {block.rows.map((row) => (
        <View key={row.id} style={styles.row} wrap={false}>
          <Text style={HOURS_COLUMNS[0].style}>{row.step}</Text>
          <Text style={HOURS_COLUMNS[1].style}>{row.who}</Text>
          <Text style={HOURS_COLUMNS[2].style}>{row.perWeek || ""}</Text>
          <Text style={HOURS_COLUMNS[3].style}>
            {row.minutesEach ? `${row.minutesEach} min` : ""}
          </Text>
          <Text style={HOURS_COLUMNS[4].style}>
            {formatHours(weeklyHours(row), WEEKLY_DECIMALS)}
          </Text>
          <Text style={HOURS_COLUMNS[5].style}>
            {formatHours(annualHours(row, block.weeksPerYear), ANNUAL_DECIMALS)}
          </Text>
        </View>
      ))}
      <View style={styles.totalRow} wrap={false}>
        <Text style={[HOURS_COLUMNS[0].style, { fontFamily: theme.font.bold }]}>
          Total
        </Text>
        <Text style={HOURS_COLUMNS[1].style} />
        <Text style={HOURS_COLUMNS[2].style} />
        <Text style={HOURS_COLUMNS[3].style} />
        <Text style={[HOURS_COLUMNS[4].style, { fontFamily: theme.font.bold }]}>
          {formatHours(totals.weekly, WEEKLY_DECIMALS)}
        </Text>
        <Text style={[HOURS_COLUMNS[5].style, { fontFamily: theme.font.bold }]}>
          {formatHours(totals.annual, ANNUAL_DECIMALS)}
        </Text>
      </View>
      {/* The working year travels with the number it produced, so nobody has to
          reverse-engineer where the annual figure came from. */}
      <Text style={[styles.assumptions, { fontFamily: theme.font.oblique }]}>
        Assumptions: a {block.weeksPerYear}-week working year
        {block.assumptions ? `. ${block.assumptions}` : "."}
      </Text>
    </View>
  );
}

const CALLOUT_TONES: Record<CalloutTone, { border: string; background: string }> = {
  // The verdict borrows the brand accent: it is the part that must be read.
  verdict: { border: "", background: "#f9fafb" },
  note: { border: muted, background: "#f9fafb" },
  warning: { border: "#b45309", background: "#fffbeb" },
};

export function ReportBlockView({ block, theme }: BlockProps) {
  switch (block.kind) {
    case "prose": {
      const paragraphs = toParagraphs(block.text);
      if (paragraphs.length === 0) return null;
      return (
        <View style={styles.block}>
          {paragraphs.map((paragraph, index) => (
            <Text key={index} style={styles.paragraph}>
              {paragraph}
            </Text>
          ))}
        </View>
      );
    }

    case "quote": {
      if (!block.text.trim()) return null;
      return (
        <View
          style={[styles.block, styles.quote, { borderLeftColor: theme.accent }]}
          wrap={false}
        >
          <Text style={{ fontFamily: theme.font.oblique }}>{block.text}</Text>
          {block.attribution ? (
            <Text style={styles.quoteAttribution}>— {block.attribution}</Text>
          ) : null}
        </View>
      );
    }

    case "table":
      return <TableBlockView block={block} theme={theme} />;

    case "hours":
      return <HoursBlockView block={block} theme={theme} />;

    case "list": {
      const items = block.items.filter((item) => item.term || item.text);
      if (items.length === 0) return null;
      return (
        <View style={styles.block}>
          {items.map((item, index) => (
            <View key={item.id} style={styles.listItem} wrap={false}>
              <Text style={styles.bullet}>
                {block.style === "number" ? `${index + 1}.` : "•"}
              </Text>
              <Text style={{ flex: 1 }}>
                {item.term ? (
                  <Text style={{ fontFamily: theme.font.bold }}>
                    {item.term}
                    {item.text ? "  " : ""}
                  </Text>
                ) : null}
                {item.text}
              </Text>
            </View>
          ))}
        </View>
      );
    }

    case "checklist": {
      const items = block.items.filter((item) => item.text.trim());
      if (items.length === 0) return null;
      return (
        <View style={styles.block}>
          {items.map((item) => (
            <View key={item.id} style={styles.listItem} wrap={false}>
              <View style={styles.checkbox} />
              <Text style={{ flex: 1 }}>{item.text}</Text>
            </View>
          ))}
        </View>
      );
    }

    case "callout": {
      if (!block.title.trim() && !block.text.trim()) return null;
      const tone = CALLOUT_TONES[block.tone];
      return (
        <View
          style={[
            styles.block,
            styles.callout,
            {
              borderLeftColor: tone.border || theme.accent,
              backgroundColor: tone.background,
            },
          ]}
          wrap={false}
        >
          {block.title ? (
            <Text style={[styles.calloutTitle, { fontFamily: theme.font.bold }]}>
              {block.title}
            </Text>
          ) : null}
          {toParagraphs(block.text).map((paragraph, index) => (
            <Text key={index} style={index > 0 ? { marginTop: 5 } : undefined}>
              {paragraph}
            </Text>
          ))}
        </View>
      );
    }
  }
}

