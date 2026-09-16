"use client";

import {
  Field,
  NumberInput,
  SegmentedControl,
  SelectInput,
  TextArea,
  TextInput,
  ItemControls,
  moveItem,
} from "@/components/fields";
import {
  emptyChecklistItem,
  emptyHoursRow,
  emptyListItem,
  emptyTableColumn,
  emptyTableRow,
  resizeRows,
} from "@/lib/report/blocks";
import { annualHours, formatHours, hoursTotals, weeklyHours } from "@/lib/report/hours";
import { cellAt } from "@/lib/report/schema";
import type {
  CalloutBlock,
  ChecklistBlock,
  HoursBlock,
  ListBlock,
  ProseBlock,
  QuoteBlock,
  ReportBlock,
  TableBlock,
  TableColumnKind,
} from "@/lib/report/schema";

const WEEKLY_DECIMALS = 1;
const ANNUAL_DECIMALS = 0;

const gridButton =
  "rounded-lg border border-dashed border-neutral-300 px-3 py-1.5 text-xs text-neutral-500 " +
  "transition hover:border-indigo-300 hover:text-indigo-600";

interface BlockFieldsProps<T extends ReportBlock> {
  block: T;
  onChange: (next: T) => void;
}

function ProseFields({ block, onChange }: BlockFieldsProps<ProseBlock>) {
  return (
    <TextArea
      rows={6}
      value={block.text}
      onChange={(e) => onChange({ ...block, text: e.target.value })}
      placeholder="Write in their vocabulary. A blank line starts a new paragraph."
    />
  );
}

function QuoteFields({ block, onChange }: BlockFieldsProps<QuoteBlock>) {
  return (
    <div className="space-y-3">
      <TextArea
        rows={3}
        value={block.text}
        onChange={(e) => onChange({ ...block, text: e.target.value })}
        placeholder="Something they actually said, verbatim."
      />
      <TextInput
        value={block.attribution}
        onChange={(e) => onChange({ ...block, attribution: e.target.value })}
        placeholder="Who said it"
      />
    </div>
  );
}

const COLUMN_KIND_OPTIONS: ReadonlyArray<{ value: TableColumnKind; label: string }> = [
  { value: "text", label: "Text" },
  { value: "marker", label: "Mark" },
];

function TableFields({ block, onChange }: BlockFieldsProps<TableBlock>) {
  const setColumns = (columns: TableBlock["columns"]) =>
    // Rows are resized with the header so a cell never belongs to a column
    // that is no longer there.
    onChange({ ...block, columns, rows: resizeRows(block.rows, columns.length) });

  const setCell = (rowId: string, index: number, value: string) =>
    onChange({
      ...block,
      rows: block.rows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              cells: block.columns.map((_, i) => (i === index ? value : cellAt(row, i))),
            }
          : row,
      ),
    });

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {block.columns.map((column, index) => (
          <div key={column.id} className="flex items-center gap-2">
            <TextInput
              value={column.header}
              onChange={(e) =>
                setColumns(
                  block.columns.map((other) =>
                    other.id === column.id ? { ...other, header: e.target.value } : other,
                  ),
                )
              }
              placeholder={`Column ${index + 1}`}
              className="flex-1"
            />
            <SelectInput
              value={column.kind}
              onChange={(e) =>
                setColumns(
                  block.columns.map((other) =>
                    other.id === column.id
                      ? { ...other, kind: e.target.value as TableColumnKind }
                      : other,
                  ),
                )
              }
              className="w-24"
            >
              {COLUMN_KIND_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectInput>
            <ItemControls
              label={`column ${index + 1}`}
              canMoveUp={index > 0}
              canMoveDown={index < block.columns.length - 1}
              onMoveUp={() => setColumns(moveItem(block.columns, index, -1))}
              onMoveDown={() => setColumns(moveItem(block.columns, index, 1))}
              onRemove={() =>
                setColumns(block.columns.filter((other) => other.id !== column.id))
              }
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => setColumns([...block.columns, emptyTableColumn()])}
          className={gridButton}
        >
          + Column
        </button>
      </div>

      <div className="space-y-2 border-t border-neutral-200 pt-3">
        {block.rows.map((row, rowIndex) => (
          <div key={row.id} className="flex items-center gap-2">
            {block.columns.map((column, index) =>
              column.kind === "marker" ? (
                <label
                  key={column.id}
                  className="flex w-20 items-center justify-center gap-1.5 text-xs text-neutral-500"
                >
                  <input
                    type="checkbox"
                    checked={cellAt(row, index).trim().length > 0}
                    onChange={(e) => setCell(row.id, index, e.target.checked ? "x" : "")}
                    className="h-3.5 w-3.5 accent-indigo-600"
                  />
                  Mark
                </label>
              ) : (
                <TextInput
                  key={column.id}
                  value={cellAt(row, index)}
                  onChange={(e) => setCell(row.id, index, e.target.value)}
                  placeholder={column.header || `Column ${index + 1}`}
                  className="min-w-0 flex-1"
                />
              ),
            )}
            <ItemControls
              label={`row ${rowIndex + 1}`}
              canMoveUp={rowIndex > 0}
              canMoveDown={rowIndex < block.rows.length - 1}
              onMoveUp={() => onChange({ ...block, rows: moveItem(block.rows, rowIndex, -1) })}
              onMoveDown={() => onChange({ ...block, rows: moveItem(block.rows, rowIndex, 1) })}
              onRemove={() =>
                onChange({ ...block, rows: block.rows.filter((other) => other.id !== row.id) })
              }
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            onChange({ ...block, rows: [...block.rows, emptyTableRow(block.columns.length)] })
          }
          className={gridButton}
        >
          + Row
        </button>
      </div>
    </div>
  );
}

function HoursFields({ block, onChange }: BlockFieldsProps<HoursBlock>) {
  const totals = hoursTotals(block.rows, block.weeksPerYear);

  const updateRow = (id: string, patch: Partial<HoursBlock["rows"][number]>) =>
    onChange({
      ...block,
      rows: block.rows.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    });

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {block.rows.map((row, index) => (
          <div key={row.id} className="flex items-center gap-2">
            <TextInput
              value={row.step}
              onChange={(e) => updateRow(row.id, { step: e.target.value })}
              placeholder="Step"
              className="min-w-0 flex-1"
            />
            <TextInput
              value={row.who}
              onChange={(e) => updateRow(row.id, { who: e.target.value })}
              placeholder="Who"
              className="w-28"
            />
            <NumberInput
              value={row.perWeek}
              onValueChange={(perWeek) => updateRow(row.id, { perWeek })}
              min={0}
              className="w-20"
              aria-label="Times per week"
            />
            <NumberInput
              value={row.minutesEach}
              onValueChange={(minutesEach) => updateRow(row.id, { minutesEach })}
              min={0}
              className="w-20"
              aria-label="Minutes each"
            />
            <span className="w-24 text-right text-xs tabular-nums text-neutral-500">
              {formatHours(weeklyHours(row), WEEKLY_DECIMALS) || "—"} /wk
            </span>
            <span className="w-24 text-right text-xs tabular-nums text-neutral-500">
              {formatHours(annualHours(row, block.weeksPerYear), ANNUAL_DECIMALS) || "—"} /yr
            </span>
            <ItemControls
              label={`step ${index + 1}`}
              canMoveUp={index > 0}
              canMoveDown={index < block.rows.length - 1}
              onMoveUp={() => onChange({ ...block, rows: moveItem(block.rows, index, -1) })}
              onMoveDown={() => onChange({ ...block, rows: moveItem(block.rows, index, 1) })}
              onRemove={() =>
                onChange({ ...block, rows: block.rows.filter((other) => other.id !== row.id) })
              }
            />
          </div>
        ))}
        <div className="flex items-center justify-between gap-2 border-t border-neutral-200 pt-2 text-xs">
          <button
            type="button"
            onClick={() => onChange({ ...block, rows: [...block.rows, emptyHoursRow()] })}
            className={gridButton}
          >
            + Step
          </button>
          <span className="font-medium tabular-nums text-neutral-700">
            Total {formatHours(totals.weekly, WEEKLY_DECIMALS) || "—"} /wk ·{" "}
            {formatHours(totals.annual, ANNUAL_DECIMALS) || "—"} /yr
          </span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
        <Field label="Working year" hint="Weeks">
          <NumberInput
            value={block.weeksPerYear}
            onValueChange={(weeksPerYear) => onChange({ ...block, weeksPerYear })}
            min={1}
            max={52}
          />
        </Field>
        <Field label="Assumptions" hint="Printed under the table. Name each one.">
          <TextArea
            rows={2}
            value={block.assumptions}
            onChange={(e) => onChange({ ...block, assumptions: e.target.value })}
            placeholder="Volumes are your estimate of a normal week, not a measured average"
          />
        </Field>
      </div>
    </div>
  );
}

function ListFields({ block, onChange }: BlockFieldsProps<ListBlock>) {
  return (
    <div className="space-y-3">
      <SegmentedControl
        options={[
          { value: "bullet" as const, label: "Bulleted" },
          { value: "number" as const, label: "Numbered" },
        ]}
        value={block.style}
        onChange={(style) => onChange({ ...block, style })}
      />
      <div className="space-y-2">
        {block.items.map((item, index) => (
          <div key={item.id} className="flex items-start gap-2">
            <TextInput
              value={item.term}
              onChange={(e) =>
                onChange({
                  ...block,
                  items: block.items.map((other) =>
                    other.id === item.id ? { ...other, term: e.target.value } : other,
                  ),
                })
              }
              placeholder="Bold lead-in (optional)"
              className="w-48"
            />
            <TextArea
              rows={2}
              value={item.text}
              onChange={(e) =>
                onChange({
                  ...block,
                  items: block.items.map((other) =>
                    other.id === item.id ? { ...other, text: e.target.value } : other,
                  ),
                })
              }
              placeholder="Why it is fine as it is"
              className="min-w-0 flex-1"
            />
            <ItemControls
              label={`item ${index + 1}`}
              canMoveUp={index > 0}
              canMoveDown={index < block.items.length - 1}
              onMoveUp={() => onChange({ ...block, items: moveItem(block.items, index, -1) })}
              onMoveDown={() => onChange({ ...block, items: moveItem(block.items, index, 1) })}
              onRemove={() =>
                onChange({ ...block, items: block.items.filter((o) => o.id !== item.id) })
              }
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange({ ...block, items: [...block.items, emptyListItem()] })}
          className={gridButton}
        >
          + Item
        </button>
      </div>
    </div>
  );
}

function ChecklistFields({ block, onChange }: BlockFieldsProps<ChecklistBlock>) {
  return (
    <div className="space-y-2">
      {block.items.map((item, index) => (
        <div key={item.id} className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 shrink-0 rounded-sm border border-neutral-300" />
          <TextInput
            value={item.text}
            onChange={(e) =>
              onChange({
                ...block,
                items: block.items.map((other) =>
                  other.id === item.id ? { ...other, text: e.target.value } : other,
                ),
              })
            }
            placeholder="Something to be worked through"
            className="min-w-0 flex-1"
          />
          <ItemControls
            label={`line ${index + 1}`}
            canMoveUp={index > 0}
            canMoveDown={index < block.items.length - 1}
            onMoveUp={() => onChange({ ...block, items: moveItem(block.items, index, -1) })}
            onMoveDown={() => onChange({ ...block, items: moveItem(block.items, index, 1) })}
            onRemove={() =>
              onChange({ ...block, items: block.items.filter((o) => o.id !== item.id) })
            }
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange({ ...block, items: [...block.items, emptyChecklistItem()] })}
        className={gridButton}
      >
        + Line
      </button>
    </div>
  );
}

function CalloutFields({ block, onChange }: BlockFieldsProps<CalloutBlock>) {
  return (
    <div className="space-y-3">
      <SegmentedControl
        options={[
          { value: "verdict" as const, label: "Verdict" },
          { value: "note" as const, label: "Note" },
          { value: "warning" as const, label: "Warning" },
        ]}
        value={block.tone}
        onChange={(tone) => onChange({ ...block, tone })}
      />
      <TextInput
        value={block.title}
        onChange={(e) => onChange({ ...block, title: e.target.value })}
        placeholder="There is something here."
      />
      <TextArea
        rows={5}
        value={block.text}
        onChange={(e) => onChange({ ...block, text: e.target.value })}
        placeholder="One paragraph. No price, no spec."
      />
    </div>
  );
}

interface BlockEditorProps {
  block: ReportBlock;
  onChange: (next: ReportBlock) => void;
}

/**
 * Dispatches to the editor for a block's kind. The narrowing is per-case so
 * each editor receives its own block type rather than the union.
 */
export function BlockFields({ block, onChange }: BlockEditorProps) {
  switch (block.kind) {
    case "prose":
      return <ProseFields block={block} onChange={onChange} />;
    case "quote":
      return <QuoteFields block={block} onChange={onChange} />;
    case "table":
      return <TableFields block={block} onChange={onChange} />;
    case "hours":
      return <HoursFields block={block} onChange={onChange} />;
    case "list":
      return <ListFields block={block} onChange={onChange} />;
    case "checklist":
      return <ChecklistFields block={block} onChange={onChange} />;
    case "callout":
      return <CalloutFields block={block} onChange={onChange} />;
  }
}
