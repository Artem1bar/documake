import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { formatDate } from "@/lib/format";
import { formatSowAmount, isPriced, milestoneAmount, percentTotal } from "@/lib/sow";
import type { CompanyProfile, SowData } from "@/lib/types";
import type { PdfTheme } from "./theme";
import { hairline, muted, toLines } from "./theme";

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  metaBlock: {
    alignItems: "flex-end",
  },
  metaRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 2,
  },
  parties: {
    flexDirection: "row",
    gap: 32,
    marginBottom: 4,
  },
  party: {
    flex: 1,
  },
  section: {
    marginTop: 16,
  },
  body: {
    textAlign: "justify",
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1.5,
    paddingBottom: 6,
    marginTop: 8,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: hairline,
    paddingVertical: 7,
  },
  colMilestone: { flex: 1, paddingRight: 8 },
  colDue: { width: 78 },
  colPercent: { width: 46, textAlign: "right" },
  colAmount: { width: 85, textAlign: "right" },
  scheduleTotal: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 8,
  },
  warning: {
    marginTop: 6,
    fontSize: 8.5,
    color: muted,
  },
});

interface SowPdfProps {
  profile: CompanyProfile;
  data: SowData;
  theme: PdfTheme;
}

/** Renders a heading plus the author's own words, or nothing at all. */
function Prose({
  heading,
  text,
  theme,
}: {
  heading: string;
  text: string;
  theme: PdfTheme;
}) {
  if (!text) return null;

  return (
    <View style={styles.section} wrap={false}>
      <Text style={theme.styles.label}>{heading}</Text>
      <Text style={styles.body}>{text}</Text>
    </View>
  );
}

export function SowPdf({ profile, data, theme }: SowPdfProps) {
  const pdfStyles = theme.styles;
  const priced = isPriced(data.totalFee);
  const scheduled = percentTotal(data.milestones);

  return (
    <Document
      title={data.projectName ? `SOW — ${data.projectName}` : "Statement of Work"}
      author={profile.name}
    >
      <Page size="A4" style={pdfStyles.page}>
        <View style={styles.headerRow}>
          <View style={{ maxWidth: 250 }}>
            <Text style={{ fontSize: 14, fontFamily: theme.font.bold }}>
              {profile.name || "Your Company"}
            </Text>
            {toLines(profile.address).map((line) => (
              <Text key={line} style={pdfStyles.small}>
                {line}
              </Text>
            ))}
          </View>
          <View style={styles.metaBlock}>
            <Text style={pdfStyles.h1}>STATEMENT OF WORK</Text>
            {data.sowNumber ? (
              <Text style={{ color: muted, marginTop: 4 }}>{data.sowNumber}</Text>
            ) : null}
            {data.effectiveDate ? (
              <View style={styles.metaRow}>
                <Text style={pdfStyles.small}>Effective:</Text>
                <Text>{formatDate(data.effectiveDate)}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {data.projectName ? (
          <View style={{ marginBottom: 10 }}>
            <Text style={pdfStyles.label}>Project</Text>
            <Text style={pdfStyles.bold}>{data.projectName}</Text>
          </View>
        ) : null}

        <View style={styles.parties}>
          <View style={styles.party}>
            <Text style={pdfStyles.label}>Supplier</Text>
            <Text style={pdfStyles.bold}>{profile.name || "—"}</Text>
          </View>
          <View style={styles.party}>
            <Text style={pdfStyles.label}>Client</Text>
            <Text style={pdfStyles.bold}>{data.clientName || "—"}</Text>
            {toLines(data.clientAddress).map((line) => (
              <Text key={line} style={pdfStyles.small}>
                {line}
              </Text>
            ))}
          </View>
        </View>

        <Prose heading="Background" text={data.background} theme={theme} />
        <Prose heading="Scope of work" text={data.scope} theme={theme} />
        <Prose heading="Out of scope" text={data.outOfScope} theme={theme} />

        {data.milestones.length > 0 ? (
          <View style={styles.section}>
            <Text style={pdfStyles.label}>Milestones and payment schedule</Text>
            <View style={[styles.tableHeader, { borderBottomColor: theme.accent }]}>
              <Text style={[styles.colMilestone, pdfStyles.label]}>
                Milestone and deliverables
              </Text>
              <Text style={[styles.colDue, pdfStyles.label]}>Due</Text>
              <Text style={[styles.colPercent, pdfStyles.label]}>%</Text>
              <Text style={[styles.colAmount, pdfStyles.label]}>Amount</Text>
            </View>
            {data.milestones.map((entry, index) => (
              <View key={entry.id} style={styles.row} wrap={false}>
                <View style={styles.colMilestone}>
                  <Text style={pdfStyles.bold}>
                    {index + 1}. {entry.name || "—"}
                  </Text>
                  {entry.deliverables ? (
                    <Text style={pdfStyles.small}>{entry.deliverables}</Text>
                  ) : null}
                </View>
                <Text style={styles.colDue}>
                  {entry.dueDate ? formatDate(entry.dueDate) : "TBD"}
                </Text>
                <Text style={styles.colPercent}>{entry.paymentPercent}%</Text>
                <Text style={styles.colAmount}>
                  {formatSowAmount(
                    milestoneAmount(data.totalFee, entry.paymentPercent),
                    data.currency,
                    priced,
                  )}
                </Text>
              </View>
            ))}
            <View style={styles.scheduleTotal}>
              <Text style={pdfStyles.bold}>Total</Text>
              <Text style={pdfStyles.bold}>
                {formatSowAmount(data.totalFee, data.currency, priced)}
              </Text>
            </View>
            {scheduled !== 100 ? (
              <Text style={styles.warning}>
                Payment schedule covers {scheduled}% of the total fee.
              </Text>
            ) : null}
          </View>
        ) : null}

        <Prose heading="Assumptions" text={data.assumptions} theme={theme} />
        <Prose heading="Change control" text={data.changeControl} theme={theme} />

        {data.governingLaw ? (
          <View style={styles.section} wrap={false}>
            <Text style={pdfStyles.label}>Governing law</Text>
            <Text>{data.governingLaw}</Text>
          </View>
        ) : null}

        <View style={pdfStyles.footer} fixed>
          <Text>
            {data.sowNumber || "Statement of Work"}
            {data.projectName ? ` — ${data.projectName}` : ""}
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
