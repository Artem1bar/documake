/**
 * Renders sample PDFs from all three templates for visual inspection.
 * Usage: npx tsx scripts/render-samples.tsx <output-dir>
 */
import { renderToFile } from "@react-pdf/renderer";
import { InvoicePdf } from "../src/components/pdf/InvoicePdf";
import { NdaPdf } from "../src/components/pdf/NdaPdf";
import { QuestionnairePdf } from "../src/components/pdf/QuestionnairePdf";
import { createPdfTheme } from "../src/components/pdf/theme";
import { BRAND_PRESETS } from "../src/lib/brand-presets";
import { createQuestionnaireDoc, DEFAULT_PROFILE } from "../src/lib/factories";
import { DEFAULT_BRANDING } from "../src/lib/profile-defaults";
import type { CompanyProfile, InvoiceData, NdaData } from "../src/lib/types";

const outDir = process.argv[2] ?? ".";
const theme = createPdfTheme(DEFAULT_BRANDING);

const profile: CompanyProfile = {
  ...DEFAULT_PROFILE,
  name: "Weblux AI LLC",
  address: "100 Startup Way, Suite 5\nAustin, TX 78701",
  email: "hello@weblux.ai",
  phone: "+1 (512) 555-0142",
  taxId: "EIN 12-3456789",
  defaultTaxRate: 8.25,
  defaultGoverningLaw: "the State of Texas, USA",
};

const invoice: InvoiceData = {
  invoiceNumber: "INV-0001",
  issueDate: "2026-08-08",
  dueDate: "2026-08-22",
  billToName: "Acme Corp",
  billToAddress: "123 Main Street\nSpringfield, IL 62701",
  billToEmail: "billing@acme.com",
  items: [
    { id: "1", description: "Website design and development", quantity: 3, unitPrice: 1250 },
    { id: "2", description: "Managed hosting (monthly)", quantity: 12, unitPrice: 24.99 },
    { id: "3", description: "Logo refresh", quantity: 1, unitPrice: 450 },
  ],
  taxRate: 8.25,
  discount: 100,
  notes:
    "Payment due within 14 days by bank transfer. Please reference the invoice number.",
  currency: "USD",
};

const nda: NdaData = {
  effectiveDate: "2026-08-08",
  isMutual: true,
  partyBName: "Acme Corp",
  partyBAddress: "123 Main Street\nSpringfield, IL 62701",
  purpose:
    "evaluating and pursuing a potential business relationship between the parties",
  termYears: 2,
  survivalYears: 3,
  governingLaw: "the State of Texas, USA",
};

const questionnaireDoc = createQuestionnaireDoc();
if (questionnaireDoc.type !== "questionnaire") {
  throw new Error("expected questionnaire doc");
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

(async () => {
  await renderToFile(
    <InvoicePdf profile={profile} data={invoice} theme={theme} />,
    `${outDir}/sample-invoice.pdf`,
  );
  await renderToFile(
    <NdaPdf profile={profile} data={nda} theme={theme} />,
    `${outDir}/sample-nda.pdf`,
  );
  await renderToFile(
    <QuestionnairePdf profile={profile} data={questionnaireDoc.data} theme={theme} />,
    `${outDir}/sample-questionnaire.pdf`,
  );

  // One invoice per brand preset, so theming changes are easy to eyeball.
  for (const preset of BRAND_PRESETS) {
    await renderToFile(
      <InvoicePdf
        profile={profile}
        data={invoice}
        theme={createPdfTheme(preset.branding)}
      />,
      `${outDir}/brand-${slug(preset.label)}.pdf`,
    );
  }

  process.stdout.write(
    `Rendered ${3 + BRAND_PRESETS.length} sample PDFs to ${outDir}\n`,
  );
})();
