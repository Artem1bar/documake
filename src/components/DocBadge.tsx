import type { DocType } from "@/lib/types";
import { DOC_TYPE_LABELS } from "@/lib/types";

const badgeStyles: Record<DocType, string> = {
  invoice: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  quote: "bg-sky-50 text-sky-700 ring-sky-200",
  sow: "bg-violet-50 text-violet-700 ring-violet-200",
  nda: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  questionnaire: "bg-amber-50 text-amber-700 ring-amber-200",
};

export function DocBadge({ type }: { type: DocType }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${badgeStyles[type]}`}
    >
      {DOC_TYPE_LABELS[type]}
    </span>
  );
}
