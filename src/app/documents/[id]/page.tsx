"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { DocBadge } from "@/components/DocBadge";
import { InvoiceForm } from "@/components/forms/InvoiceForm";
import { NdaForm } from "@/components/forms/NdaForm";
import { QuestionnaireForm } from "@/components/forms/QuestionnaireForm";
import { QuoteForm } from "@/components/forms/QuoteForm";
import { deleteDoc, upsertDoc } from "@/lib/storage";
import { useDocs, useProfile } from "@/lib/store-hooks";
import type { Doc } from "@/lib/types";

const PdfPreview = dynamic(() => import("@/components/PdfPreview"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center rounded-xl border border-neutral-200 bg-neutral-100 text-sm text-neutral-400">
      Loading preview…
    </div>
  ),
});

export default function DocumentEditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const docs = useDocs();
  const profile = useProfile();
  const doc = docs?.find((entry) => entry.id === params.id) ?? null;

  if (docs !== null && doc === null) {
    return (
      <div className="py-16 text-center text-sm text-neutral-500">
        <p>This document does not exist (it may have been deleted).</p>
        <Link href="/" className="mt-2 inline-block text-indigo-600 hover:underline">
          Back to documents
        </Link>
      </div>
    );
  }

  if (doc === null || profile === null) {
    return <p className="py-16 text-center text-sm text-neutral-400">Loading…</p>;
  }

  const update = (next: Doc) => {
    upsertDoc({ ...next, updatedAt: new Date().toISOString() });
  };

  const handleDelete = () => {
    if (!window.confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;
    deleteDoc(doc.id);
    router.push("/");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/"
          className="text-sm text-neutral-400 transition hover:text-neutral-700"
        >
          ← All documents
        </Link>
        <DocBadge type={doc.type} />
        <input
          value={doc.title}
          onChange={(e) => update({ ...doc, title: e.target.value })}
          className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 text-lg font-semibold text-neutral-900 outline-none transition hover:border-neutral-200 focus:border-indigo-300 focus:bg-white"
          aria-label="Document title"
        />
        <span className="hidden text-xs text-neutral-400 sm:block">
          Saved locally
        </span>
        <button
          type="button"
          onClick={handleDelete}
          className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs text-neutral-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          Delete
        </button>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div>
          {doc.type === "invoice" ? (
            <InvoiceForm
              data={doc.data}
              onChange={(data) => update({ ...doc, data })}
            />
          ) : null}
          {doc.type === "quote" ? (
            <QuoteForm
              data={doc.data}
              onChange={(data) => update({ ...doc, data })}
            />
          ) : null}
          {doc.type === "nda" ? (
            <NdaForm
              data={doc.data}
              onChange={(data) => update({ ...doc, data })}
            />
          ) : null}
          {doc.type === "questionnaire" ? (
            <QuestionnaireForm
              data={doc.data}
              onChange={(data) => update({ ...doc, data })}
            />
          ) : null}
        </div>
        <div className="h-[75vh] lg:sticky lg:top-20 lg:h-[calc(100vh-7.5rem)]">
          <PdfPreview doc={doc} profile={profile} />
        </div>
      </div>
    </div>
  );
}
