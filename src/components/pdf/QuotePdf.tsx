import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { formatDate } from "@/lib/format";
import { computeTotals, lineTotal } from "@/lib/invoice-math";
import { formatQuoteAmount, hasAnyPrice } from "@/lib/quote";
import type { CompanyProfile, QuoteData } from "@/lib/types";
import type { PdfTheme } from "./theme";
import { faint, hairline, muted, toLines } from "./theme";

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  metaBlock: {
    alignItems: "flex-end",
  },
  metaRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 2,
  },
  summary: {
    marginBottom: 6,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1.5,
    paddingBottom: 6,
    marginTop: 18,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: hairline,
    paddingVertical: 7,
  },
  colDescription: { flex: 1, paddingRight: 8 },
  colQty: { width: 50, textAlign: "right" },
  colPrice: { width: 80, textAlign: "right" },
  colAmount: { width: 85, textAlign: "right" },
  totals: {
    marginTop: 12,
    marginLeft: "auto",
    width: 220,
    gap: 5,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1.5,
    paddingTop: 7,
    marginTop: 3,
  },
  acceptance: {
    marginTop: 26,
    borderTopWidth: 1,
    borderTopColor: hairline,
    paddingTop: 14,
  },
  signatures: {
    flexDirection: "row",
    gap: 32,
    marginTop: 10,
  },
  signatureBlock: {
    flex: 1,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: faint,
    marginTop: 24,
    marginBottom: 3,
  },
});

interface QuotePdfProps {
  profile: CompanyProfile;
  data: QuoteData;
  theme: PdfTheme;
}

export function QuotePdf({ profile, data, theme }: QuotePdfProps) {
  const pdfStyles = theme.styles;
  const totals = computeTotals(data.items, data.taxRate, data.discount);
  const priced = hasAnyPrice(data.items);
  const amount = (value: number) => formatQuoteAmount(value, data.currency, priced);

  return (
    <Document
      title={data.quoteNumber ? `Quote ${data.quoteNumber}` : "Quote"}
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
            {profile.email ? (
              <Text style={pdfStyles.small}>{profile.email}</Text>
            ) : null}
            {profile.phone ? (
              <Text style={pdfStyles.small}>{profile.phone}</Text>
            ) : null}
          </View>
          <View style={styles.metaBlock}>
            <Text style={pdfStyles.h1}>QUOTE</Text>
            {data.quoteNumber ? (
              <Text style={{ color: muted, marginTop: 4 }}>{data.quoteNumber}</Text>
            ) : null}
            <View style={styles.metaRow}>
              <Text style={pdfStyles.small}>Issued:</Text>
              <Text>{formatDate(data.issueDate)}</Text>
            </View>
            {data.validUntil ? (
              <View style={styles.metaRow}>
                <Text style={pdfStyles.small}>Valid until:</Text>
                <Text style={pdfStyles.bold}>{formatDate(data.validUntil)}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={{ marginBottom: 6 }}>
          <Text style={pdfStyles.label}>Prepared for</Text>
          <Text style={pdfStyles.bold}>{data.clientName || "—"}</Text>
          {toLines(data.clientAddress).map((line) => (
            <Text key={line} style={pdfStyles.small}>
              {line}
            </Text>
          ))}
          {data.clientEmail ? (
            <Text style={pdfStyles.small}>{data.clientEmail}</Text>
          ) : null}
        </View>

        {data.summary ? (
          <View style={{ marginTop: 12 }}>
            <Text style={pdfStyles.label}>Summary</Text>
            <Text style={styles.summary}>{data.summary}</Text>
          </View>
        ) : null}

        <View style={[styles.tableHeader, { borderBottomColor: theme.accent }]}>
          <Text style={[styles.colDescription, pdfStyles.label]}>Description</Text>
          <Text style={[styles.colQty, pdfStyles.label]}>Qty</Text>
          <Text style={[styles.colPrice, pdfStyles.label]}>Unit price</Text>
          <Text style={[styles.colAmount, pdfStyles.label]}>Amount</Text>
        </View>
        {data.items.map((item) => (
          <View key={item.id} style={styles.row} wrap={false}>
            <Text style={styles.colDescription}>{item.description || " "}</Text>
            <Text style={styles.colQty}>{item.quantity}</Text>
            <Text style={styles.colPrice}>
              {formatQuoteAmount(item.unitPrice, data.currency, item.unitPrice > 0)}
            </Text>
            <Text style={styles.colAmount}>
              {formatQuoteAmount(lineTotal(item), data.currency, item.unitPrice > 0)}
            </Text>
          </View>
        ))}

        <View style={styles.totals} wrap={false}>
          <View style={styles.totalsRow}>
            <Text style={pdfStyles.small}>Subtotal</Text>
            <Text>{amount(totals.subtotal)}</Text>
          </View>
          {priced && data.taxRate > 0 ? (
            <View style={styles.totalsRow}>
              <Text style={pdfStyles.small}>Tax ({data.taxRate}%)</Text>
              <Text>{amount(totals.tax)}</Text>
            </View>
          ) : null}
          {priced && totals.discount > 0 ? (
            <View style={styles.totalsRow}>
              <Text style={pdfStyles.small}>Discount</Text>
              <Text>-{amount(totals.discount)}</Text>
            </View>
          ) : null}
          <View style={[styles.grandTotal, { borderTopColor: theme.accent }]}>
            <Text style={pdfStyles.bold}>Total</Text>
            <Text style={[pdfStyles.bold, { fontSize: 12 }]}>
              {amount(totals.total)}
            </Text>
          </View>
        </View>

        {data.terms ? (
          <View style={{ marginTop: 22 }} wrap={false}>
            <Text style={pdfStyles.label}>Terms</Text>
            <Text style={pdfStyles.small}>{data.terms}</Text>
          </View>
        ) : null}

        {data.notes ? (
          <View style={{ marginTop: 16 }} wrap={false}>
            <Text style={pdfStyles.label}>Notes</Text>
            <Text style={pdfStyles.small}>{data.notes}</Text>
          </View>
        ) : null}

        {data.showAcceptance ? (
          <View style={styles.acceptance} wrap={false}>
            <Text style={pdfStyles.label}>Acceptance</Text>
            <Text style={pdfStyles.small}>
              To accept this quote, sign below and return a copy.
              {data.validUntil
                ? ` This quote is valid until ${formatDate(data.validUntil)}.`
                : ""}
            </Text>
            <View style={styles.signatures}>
              <View style={styles.signatureBlock}>
                <View style={styles.signatureLine} />
                <Text style={pdfStyles.small}>
                  Signed for {data.clientName || "the client"}
                </Text>
              </View>
              <View style={styles.signatureBlock}>
                <View style={styles.signatureLine} />
                <Text style={pdfStyles.small}>Date</Text>
              </View>
            </View>
          </View>
        ) : null}

        <View style={pdfStyles.footer} fixed>
          <Text>
            {data.quoteNumber || "Quote"}
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
