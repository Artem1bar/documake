import { addDaysIso, todayIso } from "./format";
import type { CompanyProfile, Doc, LineItem, Question } from "./types";
import { CompanyProfileSchema } from "./types";

export const DEFAULT_PROFILE: CompanyProfile = CompanyProfileSchema.parse({});

function newId(): string {
  return crypto.randomUUID();
}

export function emptyLineItem(): LineItem {
  return { id: newId(), description: "", quantity: 1, unitPrice: 0 };
}

export function emptyQuestion(): Question {
  return { id: newId(), text: "", type: "short", options: [] };
}

export function formatInvoiceNumber(profile: CompanyProfile): string {
  return `${profile.invoicePrefix}${String(profile.nextInvoiceNumber).padStart(4, "0")}`;
}

export function createInvoiceDoc(profile: CompanyProfile): Doc {
  const now = new Date().toISOString();
  const issueDate = todayIso();
  const invoiceNumber = formatInvoiceNumber(profile);
  return {
    id: newId(),
    type: "invoice",
    title: `Invoice ${invoiceNumber}`,
    createdAt: now,
    updatedAt: now,
    data: {
      invoiceNumber,
      issueDate,
      dueDate: addDaysIso(issueDate, profile.paymentTermsDays),
      billToName: "",
      billToAddress: "",
      billToEmail: "",
      items: [emptyLineItem()],
      taxRate: profile.defaultTaxRate,
      discount: 0,
      notes: "",
      currency: profile.currency,
    },
  };
}

export function createNdaDoc(profile: CompanyProfile): Doc {
  const now = new Date().toISOString();
  return {
    id: newId(),
    type: "nda",
    title: "Non-Disclosure Agreement",
    createdAt: now,
    updatedAt: now,
    data: {
      effectiveDate: todayIso(),
      isMutual: true,
      partyBName: "",
      partyBAddress: "",
      purpose:
        "evaluating and pursuing a potential business relationship between the parties",
      termYears: 2,
      survivalYears: 3,
      governingLaw: profile.defaultGoverningLaw,
    },
  };
}

export function createQuestionnaireDoc(): Doc {
  const now = new Date().toISOString();
  return {
    id: newId(),
    type: "questionnaire",
    title: "Questionnaire",
    createdAt: now,
    updatedAt: now,
    data: {
      heading: "Client Intake Questionnaire",
      intro:
        "Please answer the questions below. Your responses help us prepare for our work together.",
      questions: [
        { id: newId(), text: "What is your company name?", type: "short", options: [] },
        {
          id: newId(),
          text: "Briefly describe your project and its goals.",
          type: "long",
          options: [],
        },
        {
          id: newId(),
          text: "What is your approximate budget range?",
          type: "choice",
          options: ["Under $5,000", "$5,000 – $20,000", "$20,000 – $50,000", "Over $50,000"],
        },
        {
          id: newId(),
          text: "Do you have an existing brand or design guidelines?",
          type: "yesno",
          options: [],
        },
        {
          id: newId(),
          text: "How urgent is this project?",
          type: "rating",
          options: [],
        },
      ],
    },
  };
}

export function createDoc(type: Doc["type"], profile: CompanyProfile): Doc {
  switch (type) {
    case "invoice":
      return createInvoiceDoc(profile);
    case "nda":
      return createNdaDoc(profile);
    case "questionnaire":
      return createQuestionnaireDoc();
  }
}
