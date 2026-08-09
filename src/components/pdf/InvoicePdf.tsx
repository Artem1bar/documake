import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { computeTotals, lineTotal } from "@/lib/invoice-math";
import { formatDate, formatMoney } from "@/lib/format";
import type { CompanyProfile, InvoiceData } from "@/lib/types";
import type { PdfTheme } from "./theme";
import { hairline, muted, toLines } from "./theme";

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
});

interface InvoicePdfProps {
  profile: CompanyProfile;
  data: InvoiceData;
  theme: PdfTheme;
}

export function InvoicePdf({ profile, data, theme }: InvoicePdfProps) {
  const pdfStyles = theme.styles;
  const totals = computeTotals(data.items, data.taxRate, data.discount);
  const money = (amount: number) => formatMoney(amount, data.currency);

  return (
    <Document title={`Invoice ${data.invoiceNumber}`} author={profile.name}>
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
            {profile.taxId ? (
              <Text style={pdfStyles.small}>Tax ID: {profile.taxId}</Text>
            ) : null}
          </View>
          <View style={styles.metaBlock}>
            <Text style={pdfStyles.h1}>INVOICE</Text>
            <Text style={{ color: muted, marginTop: 4 }}>
              {data.invoiceNumber}
            </Text>
            <View style={styles.metaRow}>
              <Text style={pdfStyles.small}>Issue date:</Text>
              <Text>{formatDate(data.issueDate)}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={pdfStyles.small}>Due date:</Text>
              <Text style={pdfStyles.bold}>{formatDate(data.dueDate)}</Text>
            </View>
          </View>
        </View>

        <View style={{ marginBottom: 6 }}>
          <Text style={pdfStyles.label}>Billed to</Text>
          <Text style={pdfStyles.bold}>{data.billToName || "—"}</Text>
          {toLines(data.billToAddress).map((line) => (
            <Text key={line} style={pdfStyles.small}>
              {line}
            </Text>
          ))}
          {data.billToEmail ? (
            <Text style={pdfStyles.small}>{data.billToEmail}</Text>
          ) : null}
        </View>

        <View style={[styles.tableHeader, { borderBottomColor: theme.accent }]}>
          <Text style={[styles.colDescription, pdfStyles.label]}>
            Description
          </Text>
          <Text style={[styles.colQty, pdfStyles.label]}>Qty</Text>
          <Text style={[styles.colPrice, pdfStyles.label]}>Unit price</Text>
          <Text style={[styles.colAmount, pdfStyles.label]}>Amount</Text>
        </View>
        {data.items.map((item) => (
          <View key={item.id} style={styles.row} wrap={false}>
            <Text style={styles.colDescription}>
              {item.description || " "}
            </Text>
            <Text style={styles.colQty}>{item.quantity}</Text>
            <Text style={styles.colPrice}>{money(item.unitPrice)}</Text>
            <Text style={styles.colAmount}>{money(lineTotal(item))}</Text>
          </View>
        ))}

        <View style={styles.totals} wrap={false}>
          <View style={styles.totalsRow}>
            <Text style={pdfStyles.small}>Subtotal</Text>
            <Text>{money(totals.subtotal)}</Text>
          </View>
          {data.taxRate > 0 ? (
            <View style={styles.totalsRow}>
              <Text style={pdfStyles.small}>Tax ({data.taxRate}%)</Text>
              <Text>{money(totals.tax)}</Text>
            </View>
          ) : null}
          {totals.discount > 0 ? (
            <View style={styles.totalsRow}>
              <Text style={pdfStyles.small}>Discount</Text>
              <Text>-{money(totals.discount)}</Text>
            </View>
          ) : null}
          <View style={[styles.grandTotal, { borderTopColor: theme.accent }]}>
            <Text style={pdfStyles.bold}>Total due</Text>
            <Text style={[pdfStyles.bold, { fontSize: 12 }]}>
              {money(totals.total)}
            </Text>
          </View>
        </View>

        {data.notes ? (
          <View style={{ marginTop: 24 }} wrap={false}>
            <Text style={pdfStyles.label}>Notes</Text>
            <Text style={pdfStyles.small}>{data.notes}</Text>
          </View>
        ) : null}

        <View style={pdfStyles.footer} fixed>
          <Text>
            {data.invoiceNumber}
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
