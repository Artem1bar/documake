"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { createDoc } from "@/lib/factories";
import { loadProfile, saveProfile, upsertDoc } from "@/lib/storage";
import { isDocType } from "@/lib/types";

export default function NewDocumentPage() {
  const params = useParams<{ type: string }>();
  const router = useRouter();
  const started = useRef(false);
  const requestedType = params.type;
  const type = isDocType(requestedType) ? requestedType : null;

  useEffect(() => {
    // Guard against React strict-mode double-invocation creating two docs.
    if (type === null || started.current) return;
    started.current = true;

    const profile = loadProfile();
    const doc = createDoc(type, profile);
    if (type === "invoice") {
      saveProfile({
        ...profile,
        nextInvoiceNumber: profile.nextInvoiceNumber + 1,
      });
    }
    upsertDoc(doc);
    router.replace(`/documents/${doc.id}`);
  }, [type, router]);

  if (type === null) {
    return (
      <div className="py-16 text-center text-sm text-neutral-500">
        <p>That template does not exist.</p>
        <Link href="/" className="mt-2 inline-block text-indigo-600 hover:underline">
          Back to documents
        </Link>
      </div>
    );
  }

  return (
    <p className="py-16 text-center text-sm text-neutral-400">
      Preparing your document…
    </p>
  );
}
