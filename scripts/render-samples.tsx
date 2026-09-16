/**
 * Renders sample PDFs from all three templates for visual inspection.
 * Usage: npx tsx scripts/render-samples.tsx <output-dir>
 */
import { mkdirSync } from "node:fs";
import { renderToFile } from "@react-pdf/renderer";
import { InvoicePdf } from "../src/components/pdf/InvoicePdf";
import { NdaPdf } from "../src/components/pdf/NdaPdf";
import { QuestionnairePdf } from "../src/components/pdf/QuestionnairePdf";
import { ReportPdf } from "../src/components/pdf/ReportPdf";
import { createPdfTheme } from "../src/components/pdf/theme";
import { BRAND_PRESETS } from "../src/lib/brand-presets";
import { createQuestionnaireDoc, createReportDoc, DEFAULT_PROFILE } from "../src/lib/factories";
import { DEFAULT_BRANDING } from "../src/lib/profile-defaults";
import type { ReportData } from "../src/lib/report/schema";
import type { CompanyProfile, InvoiceData, NdaData } from "../src/lib/types";

const outDir = process.argv[2] ?? ".";
mkdirSync(outDir, { recursive: true });
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

/**
 * A filled-in Map, long enough to break across pages — the only way to see
 * whether section headings strand themselves and whether table rows split.
 */
const reportDoc = createReportDoc("map");
if (reportDoc.type !== "report") throw new Error("expected report doc");

let sampleSeq = 0;
const sampleId = () => `s${(sampleSeq += 1)}`;
const cells = (...values: string[]) => ({ id: sampleId(), cells: values });

const mapSample: ReportData = {
  ...reportDoc.data,
  heading: "How work moves through Riveroak Law",
  preparedFor: "Marie Delacroix",
  preparedForRole: "Managing Partner",
  documentDate: "2026-09-09",
  basedOn: "Based on our conversation of Sep 2, 2026",
  sections: reportDoc.data.sections.map((section) => {
    switch (section.key) {
      case "what-we-heard":
        return {
          ...section,
          blocks: [
            {
              id: sampleId(),
              kind: "prose",
              text:
                "Riveroak is a four-attorney family law practice in Baton Rouge, running on Clio with two paralegals and a part-time receptionist. Most new matters arrive by phone; the rest come from two referring firms and the website contact form.\n\nYou told us the practice turns away work it could take, and that the constraint is not attorney hours but the time between an enquiry arriving and someone deciding what to do with it. That is the thing this document is about.",
            },
            {
              id: sampleId(),
              kind: "quote",
              text:
                "Half of what I do on a Monday is retyping things that already exist somewhere else in the office.",
              attribution: "Marie Delacroix, Managing Partner",
            },
          ],
        };
      case "how-work-moves":
        return {
          ...section,
          blocks: [
            {
              ...section.blocks[0],
              rows: [
                cells("1", "Enquiry arrives by phone", "Reception", "Notepad", "~4 min", "x"),
                cells("2", "Details retyped into the intake sheet", "Reception", "Word", "~9 min", "x"),
                cells("3", "Conflict check against existing matters", "Paralegal", "Clio", "~6 min", "x"),
                cells("4", "Consultation booked and confirmed", "Reception", "Outlook", "~5 min", "x"),
                cells("5", "Matter opened", "Paralegal", "Clio", "~12 min", "x"),
                cells("6", "Engagement letter drafted from the last one", "Attorney", "Word", "~20 min", "x"),
                cells("7", "Signed letter filed and matter activated", "Paralegal", "Clio", "~4 min", ""),
              ],
            },
            {
              id: sampleId(),
              kind: "prose",
              text:
                "Steps 1 to 4 branch after hours: the answering service takes a message, which is transcribed the next morning and re-enters the flow at step 2. Referral enquiries skip step 1 and arrive by email, but are still retyped at step 2.",
            },
          ],
        };
      case "systems":
        return {
          ...section,
          blocks: [
            {
              ...section.blocks[0],
              rows: [
                cells("Clio", "$1,150/mo", "Matters, time, billing", "Contacts, conflict history"),
                cells("Microsoft 365", "$290/mo", "Email, documents, calendar", "Contacts, the intake sheet"),
                cells("Answering service", "$180/mo", "After-hours calls", "First contact details"),
              ],
            },
            {
              id: sampleId(),
              kind: "prose",
              text:
                "A new client's name, phone number and matter type are typed three times: once on the notepad at reception, once into the Word intake sheet, and once into Clio. The engagement letter then takes them a fourth time, by hand, from the previous letter.",
            },
          ],
        };
      case "where-time-goes":
        return {
          ...section,
          blocks: [
            {
              ...section.blocks[0],
              rows: [
                { id: sampleId(), step: "Retyping intake details", who: "Reception", perWeek: 14, minutesEach: 9 },
                { id: sampleId(), step: "Conflict check", who: "Paralegal", perWeek: 14, minutesEach: 6 },
                { id: sampleId(), step: "Opening a matter", who: "Paralegal", perWeek: 9, minutesEach: 12 },
                { id: sampleId(), step: "Drafting the engagement letter", who: "Attorney", perWeek: 9, minutesEach: 20 },
              ],
              assumptions:
                "Volumes are your estimate of a normal week, not a measured average; durations are the midpoint of the ranges you gave",
            },
          ],
        };
      case "leave-alone":
        return {
          ...section,
          blocks: [
            {
              ...section.blocks[0],
              items: [
                {
                  id: sampleId(),
                  term: "The consultation itself.",
                  text:
                    "Nothing about the first ninety minutes with a client should be faster. It is the work.",
                },
                {
                  id: sampleId(),
                  term: "The conflict check decision.",
                  text:
                    "Pulling the candidate matches can be automated; deciding whether a match is a conflict is an attorney applying judgement, and it should stay one.",
                },
                {
                  id: sampleId(),
                  term: "The answering service.",
                  text:
                    "It costs $180 a month and it means nobody misses a distressed caller at 9pm. Replacing it would save nothing worth the risk.",
                },
              ],
            },
          ],
        };
      case "honest-read":
        return {
          ...section,
          blocks: [
            {
              ...section.blocks[0],
              title: "There is something here.",
              text:
                "The same five facts are entered four times before a matter is active, and that repetition costs roughly nine hours a week across three people. The first thing to build is a single intake capture that writes to Clio once, and drafts the engagement letter from the same record. Everything downstream of a correct matter record is already working.\n\nWhat it would cost and what it would take is the next conversation, not this one.",
            },
          ],
        };
      default:
        return section;
    }
  }),
} as ReportData;

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

  await renderToFile(
    <ReportPdf profile={profile} data={mapSample} theme={theme} />,
    `${outDir}/sample-report-map.pdf`,
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
    `Rendered ${4 + BRAND_PRESETS.length} sample PDFs to ${outDir}\n`,
  );
})();
