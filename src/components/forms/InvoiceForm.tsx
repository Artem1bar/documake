"use client";

import {
  Field,
  NumberInput,
  SectionCard,
  TextArea,
  TextInput,
} from "@/components/fields";
import { emptyLineItem } from "@/lib/factories";
import { formatMoney } from "@/lib/format";
import { computeTotals, lineTotal } from "@/lib/invoice-math";
import type { InvoiceData, LineItem } from "@/lib/types";

interface InvoiceFormProps {
  data: InvoiceData;
  onChange: (next: InvoiceData) => void;
}

export function InvoiceForm({ data, onChange }: InvoiceFormProps) {
  const set = <K extends keyof InvoiceData>(key: K, value: InvoiceData[K]) =>
    onChange({ ...data, [key]: value });

  const updateItem = (id: string, patch: Partial<LineItem>) =>
    set(
      "items",
      data.items.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    );

  const totals = computeTotals(data.items, data.taxRate, data.discount);

  return (
    <div className="space-y-4">
      <SectionCard title="Invoice details">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Invoice number">
            <TextInput
              value={data.invoiceNumber}
              onChange={(e) => set("invoiceNumber", e.target.value)}
            />
          </Field>
          <Field label="Issue date">
            <TextInput
              type="date"
              value={data.issueDate}
              onChange={(e) => set("issueDate", e.target.value)}
            />
          </Field>
          <Field label="Due date">
            <TextInput
              type="date"
              value={data.dueDate}
              onChange={(e) => set("dueDate", e.target.value)}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Bill to">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Client name">
            <TextInput
              value={data.billToName}
              onChange={(e) => set("billToName", e.target.value)}
              placeholder="Acme Corp"
            />
          </Field>
          <Field label="Client email">
            <TextInput
              type="email"
              value={data.billToEmail}
              onChange={(e) => set("billToEmail", e.target.value)}
              placeholder="billing@acme.com"
            />
          </Field>
        </div>
        <Field label="Client address">
          <TextArea
            value={data.billToAddress}
            onChange={(e) => set("billToAddress", e.target.value)}
            placeholder={"123 Main Street\nSpringfield, IL 62701"}
          />
        </Field>
      </SectionCard>

      <SectionCard title="Line items">
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
                onChange={(e) =>
                  updateItem(item.id, { description: e.target.value })
                }
                placeholder="Design work"
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
                onValueChange={(unitPrice) =>
                  updateItem(item.id, { unitPrice })
                }
                className="text-right"
              />
              <span className="text-right text-sm text-neutral-600 tabular-nums">
                {formatMoney(lineTotal(item), data.currency)}
              </span>
              <button
                type="button"
                onClick={() =>
                  set(
                    "items",
                    data.items.filter((other) => other.id !== item.id),
                  )
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
                {formatMoney(totals.subtotal, data.currency)}
              </span>
            </div>
            <div className="font-semibold text-neutral-900">
              Total due:{" "}
              <span className="tabular-nums">
                {formatMoney(totals.total, data.currency)}
              </span>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Tax, discount, and notes">
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
        <Field
          label="Notes"
          hint="Payment instructions, bank details, or a thank-you note."
        >
          <TextArea
            value={data.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Payment due within 14 days by bank transfer."
          />
        </Field>
      </SectionCard>
    </div>
  );
}
