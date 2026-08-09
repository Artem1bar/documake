"use client";

import Link from "next/link";
import { DocBadge } from "@/components/DocBadge";
import { deleteDoc } from "@/lib/storage";
import { useDocs, useProfile } from "@/lib/store-hooks";
import type { Doc, DocType } from "@/lib/types";

interface TemplateCard {
  type: DocType;
  title: string;
  description: string;
  accent: string;
  icon: string;
}

const TEMPLATES: readonly TemplateCard[] = [
  {
    type: "invoice",
    title: "Invoice",
    description: "Bill clients with line items, tax, discounts, and totals.",
    accent: "bg-emerald-100 text-emerald-700",
    icon: "$",
  },
  {
    type: "quote",
    title: "Quote",
    description: "Propose work with line items, a validity date, and an acceptance line.",
    accent: "bg-sky-100 text-sky-700",
    icon: "→",
  },
  {
    type: "sow",
    title: "SOW",
    description: "Agree scope, deliverables, milestones, and a payment schedule.",
    accent: "bg-violet-100 text-violet-700",
    icon: "≡",
  },
  {
    type: "nda",
    title: "NDA",
    description: "Protect confidential information with a mutual or one-way NDA.",
    accent: "bg-indigo-100 text-indigo-700",
    icon: "§",
  },
  {
    type: "questionnaire",
    title: "Questionnaire",
    description: "Collect structured answers from clients, partners, or candidates.",
    accent: "bg-amber-100 text-amber-700",
    icon: "?",
  },
];

function formatUpdatedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HomePage() {
  const docs = useDocs();
  const profile = useProfile();

  const handleDelete = (doc: Doc) => {
    if (!window.confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;
    deleteDoc(doc.id);
  };

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">
          What do you need today?
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Pick a template — your company details are filled in automatically.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {TEMPLATES.map((template) => (
            <Link
              key={template.type}
              href={`/new/${template.type}`}
              className="group rounded-xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
            >
              <span
                className={`grid h-9 w-9 place-items-center rounded-lg text-base font-bold ${template.accent}`}
              >
                {template.icon}
              </span>
              <h2 className="mt-3 text-sm font-semibold text-neutral-900">
                {template.title}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                {template.description}
              </p>
              <span className="mt-3 inline-block text-xs font-medium text-indigo-600 opacity-0 transition group-hover:opacity-100">
                Create →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {profile !== null && profile.name === "" ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-800">
          <span>
            Set up your company profile once, and every document fills itself
            in.
          </span>
          <Link
            href="/settings"
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-500"
          >
            Open Settings
          </Link>
        </div>
      ) : null}

      <section>
        <h2 className="text-sm font-semibold text-neutral-900">
          Recent documents
        </h2>
        {docs === null ? (
          <p className="mt-3 text-sm text-neutral-400">Loading…</p>
        ) : docs.length === 0 ? (
          <div className="mt-3 rounded-xl border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-400">
            No documents yet — create your first one above.
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white shadow-sm">
            {docs.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center gap-4 px-4 py-3 transition hover:bg-neutral-50"
              >
                <DocBadge type={doc.type} />
                <Link
                  href={`/documents/${doc.id}`}
                  className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-800 hover:text-indigo-600"
                >
                  {doc.title}
                </Link>
                <span className="hidden text-xs text-neutral-400 sm:block">
                  Updated {formatUpdatedAt(doc.updatedAt)}
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(doc)}
                  className="rounded-md px-2 py-1 text-xs text-neutral-400 transition hover:bg-red-50 hover:text-red-500"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
