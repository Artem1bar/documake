import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { formatDate } from "@/lib/format";
import type { ReportData, ReportSection } from "@/lib/report/schema";
import type { CompanyProfile } from "@/lib/types";
import { ReportBlockView } from "./ReportBlocks";
import type { PdfTheme } from "./theme";
import { muted } from "./theme";

/**
 * Points of section that must fit below a heading before it is allowed to sit
 * at the foot of a page. Roughly two lines plus the gap — enough that a title
 * never strands itself above a page break.
 */
const KEEP_WITH_SECTION = 64;

const styles = StyleSheet.create({
  company: {
    fontSize: 8.5,
    color: muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  heading: {
    fontSize: 19,
    marginBottom: 6,
    lineHeight: 1.25,
  },
  meta: {
    fontSize: 9,
    color: muted,
  },
  rule: {
    borderBottomWidth: 2,
    marginTop: 14,
    marginBottom: 4,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 12.5,
    marginBottom: 2,
  },
  closing: {
    marginTop: 26,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    fontSize: 9,
    color: muted,
  },
});

interface ReportPdfProps {
  profile: CompanyProfile;
  data: ReportData;
  theme: PdfTheme;
}

/**
 * "Prepared for Jane Doe, Managing Partner · Aug 8, 2026 · Based on our
 * conversation of Aug 1" — assembled from whichever parts were filled in, so a
 * half-filled header never prints a stray separator.
 */
function metaLine(data: ReportData): string {
  const who = [data.preparedFor, data.preparedForRole]
    .filter((part) => part.trim())
    .join(", ");

  return [
    who ? `Prepared for ${who}` : "",
    data.documentDate ? formatDate(data.documentDate) : "",
    data.basedOn,
  ]
    .filter((part) => part.trim())
    .join("  ·  ");
}

function Section({ section, theme }: { section: ReportSection; theme: PdfTheme }) {
  const blocks = section.blocks;
  if (!section.title.trim() && blocks.length === 0) return null;

  return (
    <View style={styles.section} minPresenceAhead={KEEP_WITH_SECTION}>
      {section.title ? (
        <Text
          style={[
            styles.sectionTitle,
            { fontFamily: theme.font.bold, color: theme.accent },
          ]}
        >
          {section.title}
        </Text>
      ) : null}
      {blocks.map((block) => (
        <ReportBlockView key={block.id} block={block} theme={theme} />
      ))}
    </View>
  );
}

export function ReportPdf({ profile, data, theme }: ReportPdfProps) {
  const pdfStyles = theme.styles;
  const title = data.heading || "Report";
  const meta = metaLine(data);

  return (
    <Document title={title} author={profile.name}>
      <Page size="A4" style={pdfStyles.page}>
        {profile.name ? <Text style={styles.company}>{profile.name}</Text> : null}
        <Text
          style={[
            styles.heading,
            { fontFamily: theme.font.bold, color: theme.accent },
          ]}
        >
          {title}
        </Text>
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
        <View style={[styles.rule, { borderBottomColor: theme.accent }]} />

        {data.sections.map((section) => (
          <Section key={section.id} section={section} theme={theme} />
        ))}

        {data.closing ? (
          <View style={styles.closing} wrap={false}>
            <Text style={{ fontFamily: theme.font.oblique }}>{data.closing}</Text>
          </View>
        ) : null}

        <View style={pdfStyles.footer} fixed>
          <Text>
            {title}
            {profile.name ? ` — ${profile.name}` : ""}
          </Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
