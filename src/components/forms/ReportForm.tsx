"use client";

import { useState } from "react";
import {
  Field,
  ItemControls,
  SectionCard,
  TextArea,
  TextInput,
  moveItem,
} from "@/components/fields";
import { BlockFields } from "@/components/forms/BlockFields";
import {
  BLOCK_KIND_HINTS,
  BLOCK_KIND_LABELS,
  BLOCK_KINDS,
  createBlock,
  emptySection,
} from "@/lib/report/blocks";
import { REPORT_HEADING_PLACEHOLDERS, sectionHint } from "@/lib/report/presets";
import type { BlockKind, ReportBlock, ReportData, ReportSection } from "@/lib/report/schema";

interface ReportFormProps {
  data: ReportData;
  onChange: (next: ReportData) => void;
}

function AddBlockMenu({ onAdd }: { onAdd: (kind: BlockKind) => void }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-dashed border-neutral-300 px-3 py-2 text-sm text-neutral-500 transition hover:border-indigo-300 hover:text-indigo-600"
      >
        + Add block
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-2">
      <div className="grid gap-1 sm:grid-cols-2">
        {BLOCK_KINDS.map((kind) => (
          <button
            key={kind}
            type="button"
            onClick={() => {
              onAdd(kind);
              setOpen(false);
            }}
            className="rounded-md px-2.5 py-2 text-left transition hover:bg-white"
          >
            <span className="block text-sm font-medium text-neutral-800">
              {BLOCK_KIND_LABELS[kind]}
            </span>
            <span className="block text-xs text-neutral-500">{BLOCK_KIND_HINTS[kind]}</span>
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="mt-1 px-2.5 py-1 text-xs text-neutral-500 hover:text-neutral-800"
      >
        Cancel
      </button>
    </div>
  );
}

export function ReportForm({ data, onChange }: ReportFormProps) {
  const set = <K extends keyof ReportData>(key: K, value: ReportData[K]) =>
    onChange({ ...data, [key]: value });

  const updateSection = (id: string, patch: Partial<ReportSection>) =>
    set(
      "sections",
      data.sections.map((section) =>
        section.id === id ? { ...section, ...patch } : section,
      ),
    );

  const updateBlock = (sectionId: string, block: ReportBlock) =>
    set(
      "sections",
      data.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              blocks: section.blocks.map((other) =>
                other.id === block.id ? block : other,
              ),
            }
          : section,
      ),
    );

  return (
    <div className="space-y-4">
      <SectionCard title="Header" description="Who it is for, and what it is based on.">
        <Field label="Title">
          <TextInput
            value={data.heading}
            onChange={(e) => set("heading", e.target.value)}
            placeholder={REPORT_HEADING_PLACEHOLDERS[data.templateId]}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Prepared for">
            <TextInput
              value={data.preparedFor}
              onChange={(e) => set("preparedFor", e.target.value)}
              placeholder="Marie Delacroix"
            />
          </Field>
          <Field label="Their role">
            <TextInput
              value={data.preparedForRole}
              onChange={(e) => set("preparedForRole", e.target.value)}
              placeholder="Managing Partner"
            />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Date">
            <TextInput
              type="date"
              value={data.documentDate}
              onChange={(e) => set("documentDate", e.target.value)}
            />
          </Field>
          <Field label="Based on">
            <TextInput
              value={data.basedOn}
              onChange={(e) => set("basedOn", e.target.value)}
              placeholder="Based on our conversation of Sep 2, 2026"
            />
          </Field>
        </div>
      </SectionCard>

      {data.sections.map((section, sectionIndex) => {
        const hint = sectionHint(data.templateId, section.key);

        return (
          <section
            key={section.id}
            className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <TextInput
                value={section.title}
                onChange={(e) => updateSection(section.id, { title: e.target.value })}
                placeholder={`Section ${sectionIndex + 1}`}
                className="flex-1 font-medium"
              />
              <ItemControls
                label={`section ${sectionIndex + 1}`}
                canMoveUp={sectionIndex > 0}
                canMoveDown={sectionIndex < data.sections.length - 1}
                onMoveUp={() => set("sections", moveItem(data.sections, sectionIndex, -1))}
                onMoveDown={() => set("sections", moveItem(data.sections, sectionIndex, 1))}
                onRemove={() =>
                  set(
                    "sections",
                    data.sections.filter((other) => other.id !== section.id),
                  )
                }
              />
            </div>

            {/* Guidance from the template it came from. Never saved, never printed. */}
            {hint ? (
              <p className="mt-2 border-l-2 border-neutral-200 pl-3 text-xs leading-relaxed text-neutral-500">
                {hint}
              </p>
            ) : null}

            <div className="mt-4 space-y-3">
              {section.blocks.map((block, blockIndex) => (
                <div
                  key={block.id}
                  className="space-y-3 rounded-lg border border-neutral-200 p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                      {BLOCK_KIND_LABELS[block.kind]}
                    </span>
                    <ItemControls
                      label={`${BLOCK_KIND_LABELS[block.kind]} block`}
                      canMoveUp={blockIndex > 0}
                      canMoveDown={blockIndex < section.blocks.length - 1}
                      onMoveUp={() =>
                        updateSection(section.id, {
                          blocks: moveItem(section.blocks, blockIndex, -1),
                        })
                      }
                      onMoveDown={() =>
                        updateSection(section.id, {
                          blocks: moveItem(section.blocks, blockIndex, 1),
                        })
                      }
                      onRemove={() =>
                        updateSection(section.id, {
                          blocks: section.blocks.filter((other) => other.id !== block.id),
                        })
                      }
                    />
                  </div>
                  <BlockFields
                    block={block}
                    onChange={(next) => updateBlock(section.id, next)}
                  />
                </div>
              ))}
              <AddBlockMenu
                onAdd={(kind) =>
                  updateSection(section.id, {
                    blocks: [...section.blocks, createBlock(kind)],
                  })
                }
              />
            </div>
          </section>
        );
      })}

      <button
        type="button"
        onClick={() => set("sections", [...data.sections, emptySection()])}
        className="w-full rounded-xl border border-dashed border-neutral-300 px-3 py-3 text-sm text-neutral-500 transition hover:border-indigo-300 hover:text-indigo-600"
      >
        + Add section
      </button>

      <SectionCard title="Closing" description="The last line of the document.">
        <TextArea
          rows={2}
          value={data.closing}
          onChange={(e) => set("closing", e.target.value)}
          placeholder="This document is yours. It was free, it stays free, and there is nothing to sign."
        />
      </SectionCard>
    </div>
  );
}
