import { describe, expect, it } from "vitest";
import { createPdfTheme } from "@/components/pdf/theme";
import { BRAND_PRESETS } from "../brand-presets";
import { DEFAULT_BRANDING } from "../profile-defaults";
import type { Branding, FontFamily } from "../types";
import { BrandingSchema } from "../types";

function branding(overrides: Partial<Branding> = {}): Branding {
  return { ...DEFAULT_BRANDING, ...overrides };
}

describe("createPdfTheme", () => {
  const expectedFonts: Record<
    FontFamily,
    { regular: string; bold: string; oblique: string }
  > = {
    helvetica: {
      regular: "Helvetica",
      bold: "Helvetica-Bold",
      oblique: "Helvetica-Oblique",
    },
    times: { regular: "Times-Roman", bold: "Times-Bold", oblique: "Times-Italic" },
    courier: { regular: "Courier", bold: "Courier-Bold", oblique: "Courier-Oblique" },
  };

  it.each(Object.keys(expectedFonts) as FontFamily[])(
    "maps %s to its standard PDF font names",
    (fontFamily) => {
      const theme = createPdfTheme(branding({ fontFamily }));

      expect(theme.font).toEqual(expectedFonts[fontFamily]);
      expect(theme.styles.page.fontFamily).toBe(expectedFonts[fontFamily].regular);
      expect(theme.styles.bold.fontFamily).toBe(expectedFonts[fontFamily].bold);
    },
  );

  it("applies the accent colour to the document heading", () => {
    const theme = createPdfTheme(branding({ accentColor: "#002b72" }));

    expect(theme.accent).toBe("#002b72");
    expect(theme.styles.h1.color).toBe("#002b72");
  });

  it("gives the heading an explicit line height, so it cannot sit on the line below", () => {
    expect(createPdfTheme(branding()).styles.h1.lineHeight).toBeDefined();
  });

  it("keeps body text neutral rather than tinting everything with the accent", () => {
    const theme = createPdfTheme(branding({ accentColor: "#bc4b00" }));

    expect(theme.styles.page.color).toBe(theme.ink);
    expect(theme.styles.small.color).toBe(theme.muted);
  });

  it("reuses the theme for identical branding", () => {
    const first = createPdfTheme(branding({ accentColor: "#123456" }));
    const second = createPdfTheme(branding({ accentColor: "#123456" }));

    expect(second).toBe(first);
  });

  it("builds a distinct theme per accent and per typeface", () => {
    const navy = createPdfTheme(branding({ accentColor: "#002b72" }));
    const cognac = createPdfTheme(branding({ accentColor: "#bc4b00" }));
    const serif = createPdfTheme(branding({ accentColor: "#002b72", fontFamily: "times" }));

    expect(cognac).not.toBe(navy);
    expect(serif).not.toBe(navy);
  });

  it("stays correct after the cache is evicted", () => {
    // More distinct brandings than the cache holds, then re-request the first.
    for (let index = 0; index < 40; index += 1) {
      createPdfTheme(branding({ accentColor: `#${index.toString(16).padStart(6, "0")}` }));
    }

    expect(createPdfTheme(branding({ accentColor: "#000001" })).accent).toBe("#000001");
  });
});

describe("brand presets", () => {
  it("every preset is valid branding", () => {
    for (const preset of BRAND_PRESETS) {
      expect(BrandingSchema.safeParse(preset.branding).success, preset.label).toBe(true);
    }
  });

  it("every preset is labelled as a sample, so none reads as a real brand", () => {
    for (const preset of BRAND_PRESETS) {
      expect(preset.label.startsWith("Sample")).toBe(true);
    }
  });

  it("presets carry no company identity, only colour and type", () => {
    for (const preset of BRAND_PRESETS) {
      expect(Object.keys(preset.branding).sort()).toEqual(["accentColor", "fontFamily"]);
    }
  });
});
