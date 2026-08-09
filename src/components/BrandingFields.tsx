"use client";

import { BRAND_PRESETS } from "@/lib/brand-presets";
import type { Branding, FontFamily } from "@/lib/types";
import { Field, SegmentedControl, TextInput } from "./fields";

const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

const FONT_OPTIONS: ReadonlyArray<{ value: FontFamily; label: string }> = [
  { value: "helvetica", label: "Sans" },
  { value: "times", label: "Serif" },
  { value: "courier", label: "Mono" },
];

interface BrandingFieldsProps {
  branding: Branding;
  onChange: (branding: Branding) => void;
}

export function BrandingFields({ branding, onChange }: BrandingFieldsProps) {
  const setAccent = (accentColor: string) => {
    // The text field is committed only once it is a valid colour, so a
    // half-typed hex never reaches the document.
    if (HEX_PATTERN.test(accentColor)) onChange({ ...branding, accentColor });
  };

  return (
    <>
      <Field label="Preset" hint="A starting point. Sets colour and type only — never company details.">
        <div className="flex flex-wrap gap-2">
          {BRAND_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => onChange(preset.branding)}
              title={preset.description}
              className="flex items-center gap-2 rounded-lg border border-neutral-300 px-3 py-1.5 text-xs text-neutral-700 transition hover:border-indigo-300 hover:bg-indigo-50"
            >
              <span
                aria-hidden
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: preset.branding.accentColor }}
              />
              {preset.label}
            </button>
          ))}
        </div>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Accent colour" hint="Used for headings and rules.">
          <div className="flex gap-2">
            <input
              type="color"
              value={branding.accentColor}
              onChange={(event) => setAccent(event.target.value)}
              aria-label="Accent colour"
              className="h-9 w-12 shrink-0 cursor-pointer rounded-lg border border-neutral-300 bg-white p-1"
            />
            <TextInput
              value={branding.accentColor}
              onChange={(event) => setAccent(event.target.value)}
              spellCheck={false}
              placeholder="#002b72"
            />
          </div>
        </Field>

        <Field label="Typeface" hint="Standard PDF faces — no downloads, renders anywhere.">
          <SegmentedControl
            options={FONT_OPTIONS}
            value={branding.fontFamily}
            onChange={(fontFamily) => onChange({ ...branding, fontFamily })}
          />
        </Field>
      </div>
    </>
  );
}
