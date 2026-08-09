import type { DocumentProps } from "@react-pdf/renderer";
import type { ReactElement } from "react";
import { DEFAULT_BRANDING } from "@/lib/profile-defaults";
import type { Doc, RenderProfile } from "@/lib/types";
import { InvoicePdf } from "./InvoicePdf";
import { NdaPdf } from "./NdaPdf";
import { QuestionnairePdf } from "./QuestionnairePdf";
import { createPdfTheme } from "./theme";

/** Single entry point mapping a stored document to its PDF template. */
export function renderDocumentPdf(
  doc: Doc,
  profile: RenderProfile,
): ReactElement<DocumentProps> {
  const theme = createPdfTheme(profile.branding ?? DEFAULT_BRANDING);

  const element = (() => {
    switch (doc.type) {
      case "invoice":
        return <InvoicePdf profile={profile} data={doc.data} theme={theme} />;
      case "nda":
        return <NdaPdf profile={profile} data={doc.data} theme={theme} />;
      case "questionnaire":
        return (
          <QuestionnairePdf profile={profile} data={doc.data} theme={theme} />
        );
    }
  })();
  // Every template renders a react-pdf <Document> at its root, which the
  // wrapper component's own props type cannot express.
  return element as ReactElement<DocumentProps>;
}
