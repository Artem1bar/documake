import { StyleSheet } from "@react-pdf/renderer";
import type { Branding, FontFamily } from "@/lib/types";

/**
 * Neutral tokens shared by every brand. Only the accent and the typeface vary
 * per profile — a document where everything is branded reads as noise.
 */
export const ink = "#111827";
export const muted = "#6b7280";
export const faint = "#9ca3af";
export const hairline = "#e5e7eb";

interface FontStack {
  regular: string;
  bold: string;
}

/**
 * The standard PDF families. They are built into every reader, so nothing is
 * embedded, nothing is licensed, and output is identical offline. Embedded
 * brand faces would be added here alongside a `Font.register` call.
 */
const FONT_STACKS: Record<FontFamily, FontStack> = {
  helvetica: { regular: "Helvetica", bold: "Helvetica-Bold" },
  times: { regular: "Times-Roman", bold: "Times-Bold" },
  courier: { regular: "Courier", bold: "Courier-Bold" },
};

function buildTheme(branding: Branding) {
  const font = FONT_STACKS[branding.fontFamily];
  const accent = branding.accentColor;

  return {
    accent,
    ink,
    muted,
    faint,
    hairline,
    font,
    styles: StyleSheet.create({
      page: {
        fontFamily: font.regular,
        fontSize: 10,
        color: ink,
        paddingTop: 48,
        paddingBottom: 64,
        paddingHorizontal: 52,
        lineHeight: 1.45,
      },
      h1: {
        fontSize: 20,
        fontFamily: font.bold,
        letterSpacing: 0.2,
        color: accent,
        // Explicit, because the page's 1.45 leaves a 20pt wordmark sitting on
        // top of whatever follows it.
        lineHeight: 1.3,
      },
      label: {
        fontSize: 7.5,
        fontFamily: font.bold,
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
        fontFamily: font.bold,
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
    }),
  };
}

export type PdfTheme = ReturnType<typeof buildTheme>;

/**
 * Themes are cached because the live preview re-renders on every keystroke and
 * `StyleSheet.create` is not free. The key space is small in practice; the cap
 * only guards against a colour picker being dragged through hundreds of values.
 */
const THEME_CACHE_LIMIT = 32;
const themeCache = new Map<string, PdfTheme>();

export function createPdfTheme(branding: Branding): PdfTheme {
  const key = `${branding.accentColor}|${branding.fontFamily}`;
  const cached = themeCache.get(key);
  if (cached) return cached;

  if (themeCache.size >= THEME_CACHE_LIMIT) themeCache.clear();

  const theme = buildTheme(branding);
  themeCache.set(key, theme);
  return theme;
}

/** Splits a multiline string into trimmed, non-empty lines for <Text> rendering. */
export function toLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}
