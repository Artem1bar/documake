"use client";

import {
  Field,
  NumberInput,
  SectionCard,
  TextArea,
  TextInput,
} from "@/components/fields";
import { formatSowAmount, isPriced, isSplitBalanced, milestoneAmount, percentTotal } from "@/lib/sow";
import type { Milestone, SowData } from "@/lib/types";

function newMilestone(): Milestone {
  return {
    id: crypto.randomUUID(),
    name: "",
    deliverables: "",
    dueDate: "",
    paymentPercent: 0,
  };
}

interface SowFormProps {
  data: SowData;
  onChange: (next: SowData) => void;
}

export function SowForm({ data, onChange }: SowFormProps) {
  const set = <K extends keyof SowData>(key: K, value: SowData[K]) =>
    onChange({ ...data, [key]: value });

  const updateMilestone = (id: string, patch: Partial<Milestone>) =>
    set(
      "milestones",
      data.milestones.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
    );

  const priced = isPriced(data.totalFee);
  const scheduled = percentTotal(data.milestones);
  const balanced = isSplitBalanced(data.milestones);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        This is a general template, not legal advice. Have a lawyer review it
        before relying on it for anything important.
      </div>

      <SectionCard title="Statement of work">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="SOW number" hint="Optional.">
            <TextInput
              value={data.sowNumber}
              onChange={(e) => set("sowNumber", e.target.value)}
              placeholder="SOW-0001"
            />
          </Field>
          <Field label="Effective date">
            <TextInput
              type="date"
              value={data.effectiveDate}
              onChange={(e) => set("effectiveDate", e.target.value)}
            />
          </Field>
        </div>
        <Field label="Project name">
          <TextInput
            value={data.projectName}
            onChange={(e) => set("projectName", e.target.value)}
            placeholder="Marketing site redesign"
          />
        </Field>
      </SectionCard>

      <SectionCard title="Client">
        <Field label="Client name">
          <TextInput
            value={data.clientName}
            onChange={(e) => set("clientName", e.target.value)}
            placeholder="Acme Corp"
          />
        </Field>
        <Field label="Client address">
          <TextArea
            value={data.clientAddress}
            onChange={(e) => set("clientAddress", e.target.value)}
            placeholder={"123 Main Street\nSpringfield, IL 62701"}
          />
        </Field>
      </SectionCard>

      <SectionCard
        title="Scope"
        description="Sections you leave blank are left out of the document entirely."
      >
        <Field label="Background">
          <TextArea
            value={data.background}
            onChange={(e) => set("background", e.target.value)}
            placeholder="Why this work is happening."
          />
        </Field>
        <Field label="Scope of work">
          <TextArea
            value={data.scope}
            onChange={(e) => set("scope", e.target.value)}
            placeholder="What you will deliver."
          />
        </Field>
        <Field label="Out of scope" hint="What this engagement explicitly does not cover.">
          <TextArea
            value={data.outOfScope}
            onChange={(e) => set("outOfScope", e.target.value)}
            placeholder="Anything not listed above."
          />
        </Field>
      </SectionCard>

      <SectionCard
        title="Milestones and payment schedule"
        description="Leave the fee unset and every amount prints as TBD."
      >
        <Field label={`Total fee (${data.currency})`} hint="Leave at zero while the fee is open.">
          <NumberInput
            value={data.totalFee}
            min={0}
            step={0.01}
            onValueChange={(totalFee) => set("totalFee", totalFee)}
          />
        </Field>

        <div className="space-y-3">
          {data.milestones.map((entry, index) => (
            <div key={entry.id} className="rounded-lg border border-neutral-200 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-500">
                  Milestone {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    set(
                      "milestones",
                      data.milestones.filter((other) => other.id !== entry.id),
                    )
                  }
                  className="rounded-md px-2 text-neutral-400 transition hover:bg-red-50 hover:text-red-500"
                  aria-label={`Remove milestone ${index + 1}`}
                >
                  ×
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_130px_80px]">
                <Field label="Name">
                  <TextInput
                    value={entry.name}
                    onChange={(e) => updateMilestone(entry.id, { name: e.target.value })}
                    placeholder="Discovery"
                  />
                </Field>
                <Field label="Due">
                  <TextInput
                    type="date"
                    value={entry.dueDate}
                    onChange={(e) => updateMilestone(entry.id, { dueDate: e.target.value })}
                  />
                </Field>
                <Field label="Payment %">
                  <NumberInput
                    value={entry.paymentPercent}
                    min={0}
                    max={100}
                    onValueChange={(paymentPercent) =>
                      updateMilestone(entry.id, { paymentPercent })
                    }
                    className="text-right"
                  />
                </Field>
              </div>
              <div className="mt-3">
                <Field label="Deliverables">
                  <TextArea
                    value={entry.deliverables}
                    onChange={(e) =>
                      updateMilestone(entry.id, { deliverables: e.target.value })
                    }
                    rows={2}
                    placeholder="What is handed over at this milestone."
                  />
                </Field>
              </div>
              <p className="mt-2 text-right text-sm text-neutral-500">
                Amount:{" "}
                <span className="tabular-nums text-neutral-800">
                  {formatSowAmount(
                    milestoneAmount(data.totalFee, entry.paymentPercent),
                    data.currency,
                    priced,
                  )}
                </span>
              </p>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => set("milestones", [...data.milestones, newMilestone()])}
          className="rounded-lg border border-dashed border-neutral-300 px-3 py-2 text-sm text-neutral-500 transition hover:border-indigo-300 hover:text-indigo-600"
        >
          + Add milestone
        </button>

        <p
          className={`text-sm ${balanced ? "text-neutral-500" : "text-amber-700"}`}
        >
          Scheduled: {scheduled}% of the total fee
          {balanced ? "" : " — this does not add up to 100%."}
        </p>
      </SectionCard>

      <SectionCard title="Assumptions, change control, and law">
        <Field
          label="Assumptions"
          hint="What you are relying on the client to provide or decide."
        >
          <TextArea
            value={data.assumptions}
            onChange={(e) => set("assumptions", e.target.value)}
            placeholder="Content and approvals provided within five working days."
          />
        </Field>
        <Field label="Change control" hint="How scope changes get agreed and priced.">
          <TextArea
            value={data.changeControl}
            onChange={(e) => set("changeControl", e.target.value)}
            placeholder="Changes are agreed in writing before work on them begins."
          />
        </Field>
        <Field label="Governing law">
          <TextInput
            value={data.governingLaw}
            onChange={(e) => set("governingLaw", e.target.value)}
            placeholder="the State of Texas, USA"
          />
        </Field>
      </SectionCard>
    </div>
  );
}
