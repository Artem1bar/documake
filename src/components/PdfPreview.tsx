"use client";

import { useEffect, useMemo, useState } from "react";
import { usePDF } from "@react-pdf/renderer";
import { renderDocumentPdf } from "@/components/pdf/renderDocumentPdf";
import type { CompanyProfile, Doc } from "@/lib/types";

function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

function toFileName(title: string): string {
  const slug = title
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug || "document"}.pdf`;
}

interface PdfPreviewProps {
  doc: Doc;
  profile: CompanyProfile;
}

export default function PdfPreview({ doc, profile }: PdfPreviewProps) {
  const debouncedDoc = useDebounced(doc, 400);
  const debouncedProfile = useDebounced(profile, 400);
  const element = useMemo(
    () => renderDocumentPdf(debouncedDoc, debouncedProfile),
    [debouncedDoc, debouncedProfile],
  );
  const [instance, updateInstance] = usePDF({ document: element });

  useEffect(() => {
    updateInstance(element);
  }, [element, updateInstance]);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-neutral-400">
            Live preview
          </span>
          {instance.loading ? (
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
              Rendering…
            </span>
          ) : null}
        </div>
        {instance.url ? (
          <a
            href={instance.url}
            download={toFileName(doc.title)}
            className="rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500"
          >
            Download PDF
          </a>
        ) : (
          <span className="rounded-lg bg-neutral-200 px-3.5 py-2 text-sm font-medium text-neutral-400">
            Download PDF
          </span>
        )}
      </div>
      {instance.error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          The preview failed to render: {String(instance.error)}
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 shadow-inner">
          {instance.url ? (
            <iframe
              title="PDF preview"
              src={`${instance.url}#toolbar=0&navpanes=0`}
              className="h-full w-full"
            />
          ) : (
            <div className="grid h-full place-items-center text-sm text-neutral-400">
              Preparing preview…
            </div>
          )}
        </div>
      )}
    </div>
  );
}
