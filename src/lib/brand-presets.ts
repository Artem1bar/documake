import type { Branding } from "./types";

export interface BrandPreset {
  label: string;
  description: string;
  branding: Branding;
}

/**
 * Starting points for a profile's look — colour and typeface only. They set no
 * company details, so applying one never puts a name, address, or tax ID you
 * did not write into a document.
 *
 * Both accents are taken from sibling projects' own design tokens:
 *   - #002b72 — weblux `src/app/globals.css`, `--color-ink`
 *   - #bc4b00 — dave `packages/amber-ui/src/styles/ember.css`,
 *     `--accent-rgb: 188 75 0`
 */
export const BRAND_PRESETS: readonly BrandPreset[] = [
  {
    label: "Sample — Ink & Serif",
    description: "Deep navy with a serif face.",
    branding: { accentColor: "#002b72", fontFamily: "times" },
  },
  {
    label: "Sample — Ember",
    description: "Cognac with a grotesque face.",
    branding: { accentColor: "#bc4b00", fontFamily: "helvetica" },
  },
  {
    label: "Sample — Plain",
    description: "Near-black, no accent colour.",
    branding: { accentColor: "#111827", fontFamily: "helvetica" },
  },
] as const;
