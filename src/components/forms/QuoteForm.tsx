"use client";

import {
  Field,
  NumberInput,
  SectionCard,
  SegmentedControl,
  TextArea,
  TextInput,
} from "@/components/fields";
import { emptyLineItem } from "@/lib/factories";
import { computeTotals, lineTotal } from "@/lib/invoice-math";
import { formatQuoteAmount, hasAnyPrice } from "@/lib/quote";
import type { LineItem, QuoteData } from "@/lib/types";

const ACCEPTANCE_OPTIONS = [
  { value: "yes", label: "Include" },
  { value: "no", label: "Omit" },
] as const;

interface QuoteFormProps {
  data: QuoteData;
  onChange: (next: QuoteData) => void;
}

export function QuoteForm({ data, onChange }: QuoteFormProps) {
  const set = <K extends keyof QuoteData>(key: K, value: QuoteData[K]) =>
    onChange({ ...data, [key]: value });

  const updateItem = (id: string, patch: Partial<LineItem>) =>
    set(
      "items",
      data.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );

  const totals = computeTotals(data.items, data.taxRate, data.discount);
  const priced = hasAnyPrice(data.items);

  return (
    <div className="space-y-4">
      <SectionCard title="Quote details">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Quote number" hint="Optional.">
            <TextInput
              value={data.quoteNumber}
              onChange={(e) => set("quoteNumber", e.target.value)}
              placeholder="Q-0001"
            />
          </Field>
          <Field label="Issue date">
            <TextInput
              type="date"
              value={data.issueDate}
              onChange={(e) => set("issueDate", e.target.value)}
            />
          </Field>
          <Field label="Valid until">
            <TextInput
              type="date"
              value={data.validUntil}
              onChange={(e) => set("validUntil", e.target.value)}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Prepared for">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Client name">
            <TextInput
              value={data.clientName}
              onChange={(e) => set("clientName", e.target.value)}
              placeholder="Acme Corp"
            />
          </Field>
          <Field label="Client email">
            <TextInput
              type="email"
              value={data.clientEmail}
              onChange={(e) => set("clientEmail", e.target.value)}
              placeholder="hello@acme.com"
            />
          </Field>
        </div>
        <Field label="Client address">
          <TextArea
            value={data.clientAddress}
            onChange={(e) => set("clientAddress", e.target.value)}
            placeholder={"123 Main Street\nSpringfield, IL 62701"}
          />
        </Field>
        <Field label="Summary" hint="A short paragraph on what you are proposing.">
          <TextArea
            value={data.summary}
            onChange={(e) => set("summary", e.target.value)}
            placeholder="A redesign of the marketing site, delivered in three phases."
          />
        </Field>
      </SectionCard>

      <SectionCard
        title="Line items"
        description="Leave a unit price at zero and it prints as TBD rather than as free."
      >
        <div className="space-y-2">
          <div className="hidden grid-cols-[1fr_72px_112px_96px_28px] gap-2 text-xs font-medium text-neutral-500 sm:grid">
            <span>Description</span>
            <span className="text-right">Qty</span>
            <span className="text-right">Unit price</span>
            <span className="text-right">Amount</span>
            <span />
          </div>
          {data.items.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-[1fr_72px_112px_96px_28px] items-center gap-2"
            >
              <TextInput
                value={item.description}
                onChange={(e) => updateItem(item.id, { description: e.target.value })}
                placeholder="Discovery and design"
              />
              <NumberInput
                value={item.quantity}
                min={0}
                onValueChange={(quantity) => updateItem(item.id, { quantity })}
                className="text-right"
              />
              <NumberInput
                value={item.unitPrice}
                min={0}
                step={0.01}
                onValueChange={(unitPrice) => updateItem(item.id, { unitPrice })}
                className="text-right"
              />
              <span className="text-right text-sm text-neutral-600 tabular-nums">
                {formatQuoteAmount(lineTotal(item), data.currency, item.unitPrice > 0)}
              </span>
              <button
                type="button"
                onClick={() =>
                  set("items", data.items.filter((other) => other.id !== item.id))
                }
                className="grid h-7 w-7 place-items-center rounded-md text-neutral-400 transition hover:bg-red-50 hover:text-red-500"
                aria-label="Remove line item"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => set("items", [...data.items, emptyLineItem()])}
          className="rounded-lg border border-dashed border-neutral-300 px-3 py-2 text-sm text-neutral-500 transition hover:border-indigo-300 hover:text-indigo-600"
        >
          + Add line item
        </button>
        <div className="flex justify-end border-t border-neutral-100 pt-3 text-sm">
          <div className="space-y-1 text-right">
            <div className="text-neutral-500">
              Subtotal:{" "}
              <span className="tabular-nums text-neutral-800">
                {formatQuoteAmount(totals.subtotal, data.currency, priced)}
              </span>
            </div>
            <div className="font-semibold text-neutral-900">
              Total:{" "}
              <span className="tabular-nums">
                {formatQuoteAmount(totals.total, data.currency, priced)}
              </span>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Tax, terms, and acceptance">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tax rate (%)">
            <NumberInput
              value={data.taxRate}
              min={0}
              step={0.1}
              onValueChange={(taxRate) => set("taxRate", taxRate)}
            />
          </Field>
          <Field label={`Discount (${data.currency})`}>
            <NumberInput
              value={data.discount}
              min={0}
              step={0.01}
              onValueChange={(discount) => set("discount", discount)}
            />
          </Field>
        </div>
        <Field label="Terms" hint="Payment schedule, scope boundaries, what happens next.">
          <TextArea
            value={data.terms}
            onChange={(e) => set("terms", e.target.value)}
            placeholder="50% on acceptance, 50% on delivery. Prices exclude third-party costs."
          />
        </Field>
        <Field label="Notes">
          <TextArea
            value={data.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Anything else the client should know."
          />
        </Field>
        <Field label="Acceptance block" hint="A signature and date line at the end of the quote.">
          <SegmentedControl
            options={ACCEPTANCE_OPTIONS}
            value={data.showAcceptance ? "yes" : "no"}
            onChange={(value) => set("showAcceptance", value === "yes")}
          />
        </Field>
      </SectionCard>
    </div>
  );
}
