import type { DocumentProps } from "@react-pdf/renderer";
import type { ReactElement } from "react";
import type { CompanyProfile, Doc } from "@/lib/types";
import { InvoicePdf } from "./InvoicePdf";
import { NdaPdf } from "./NdaPdf";
import { QuestionnairePdf } from "./QuestionnairePdf";

/** Single entry point mapping a stored document to its PDF template. */
export function renderDocumentPdf(
  doc: Doc,
  profile: CompanyProfile,
): ReactElement<DocumentProps> {
  const element = (() => {
    switch (doc.type) {
      case "invoice":
        return <InvoicePdf profile={profile} data={doc.data} />;
      case "nda":
        return <NdaPdf profile={profile} data={doc.data} />;
      case "questionnaire":
        return <QuestionnairePdf profile={profile} data={doc.data} />;
    }
  })();
  // Every template renders a react-pdf <Document> at its root, which the
  // wrapper component's own props type cannot express.
  return element as ReactElement<DocumentProps>;
}
