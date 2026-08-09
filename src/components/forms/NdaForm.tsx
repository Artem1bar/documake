"use client";

import {
  Field,
  NumberInput,
  SectionCard,
  SegmentedControl,
  TextArea,
  TextInput,
} from "@/components/fields";
import type { NdaData } from "@/lib/types";

interface NdaFormProps {
  data: NdaData;
  onChange: (next: NdaData) => void;
}

export function NdaForm({ data, onChange }: NdaFormProps) {
  const set = <K extends keyof NdaData>(key: K, value: NdaData[K]) =>
    onChange({ ...data, [key]: value });

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        This is a general template, not legal advice. Have a lawyer review it
        before relying on it for anything important.
      </div>

      <SectionCard title="Agreement">
        <Field
          label="Type"
          hint={
            data.isMutual
              ? "Both sides can share and must protect confidential information."
              : "Your company discloses; the counterparty must protect."
          }
        >
          <SegmentedControl
            options={[
              { value: "mutual", label: "Mutual" },
              { value: "oneway", label: "One-way" },
            ]}
            value={data.isMutual ? "mutual" : "oneway"}
            onChange={(value) => set("isMutual", value === "mutual")}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Effective date">
            <TextInput
              type="date"
              value={data.effectiveDate}
              onChange={(e) => set("effectiveDate", e.target.value)}
            />
          </Field>
          <Field label="Term (years)">
            <NumberInput
              value={data.termYears}
              min={0}
              step={1}
              onValueChange={(termYears) => set("termYears", termYears)}
            />
          </Field>
          <Field label="Survival (years)">
            <NumberInput
              value={data.survivalYears}
              min={0}
              step={1}
              onValueChange={(survivalYears) =>
                set("survivalYears", survivalYears)
              }
            />
          </Field>
        </div>
        <Field
          label="Governing law"
          hint="For example: the State of Delaware, USA"
        >
          <TextInput
            value={data.governingLaw}
            onChange={(e) => set("governingLaw", e.target.value)}
            placeholder="the State of Delaware, USA"
          />
        </Field>
      </SectionCard>

      <SectionCard
        title="Counterparty"
        description="Your side is filled in automatically from Settings."
      >
        <Field label="Company or person">
          <TextInput
            value={data.partyBName}
            onChange={(e) => set("partyBName", e.target.value)}
            placeholder="Acme Corp"
          />
        </Field>
        <Field label="Address">
          <TextArea
            value={data.partyBAddress}
            onChange={(e) => set("partyBAddress", e.target.value)}
            placeholder={"123 Main Street\nSpringfield, IL 62701"}
          />
        </Field>
      </SectionCard>

      <SectionCard title="Purpose">
        <Field
          label="Why is information being shared?"
          hint={'Completes the sentence: "for the purpose of …"'}
        >
          <TextArea
            value={data.purpose}
            onChange={(e) => set("purpose", e.target.value)}
            placeholder="evaluating a potential partnership between the parties"
          />
        </Field>
      </SectionCard>
    </div>
  );
}
