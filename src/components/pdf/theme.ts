import { StyleSheet } from "@react-pdf/renderer";

export const ink = "#111827";
export const muted = "#6b7280";
export const faint = "#9ca3af";
export const hairline = "#e5e7eb";

export const pdfStyles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: ink,
    paddingTop: 48,
    paddingBottom: 64,
    paddingHorizontal: 52,
    lineHeight: 1.45,
  },
  h1: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.2,
  },
  label: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  small: {
    fontSize: 9,
    color: muted,
  },
  bold: {
    fontFamily: "Helvetica-Bold",
  },
  hr: {
    borderBottomWidth: 1,
    borderBottomColor: hairline,
    marginVertical: 14,
  },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 52,
    right: 52,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: faint,
  },
});

/** Splits a multiline string into trimmed, non-empty lines for <Text> rendering. */
export function toLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}
