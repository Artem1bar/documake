import { z } from "zod";

export const CompanyProfileSchema = z.object({
  name: z.string().default(""),
  address: z.string().default(""),
  email: z.string().default(""),
  phone: z.string().default(""),
  taxId: z.string().default(""),
  currency: z.string().default("USD"),
  invoicePrefix: z.string().default("INV-"),
  nextInvoiceNumber: z.number().int().min(1).default(1),
  paymentTermsDays: z.number().int().min(0).default(14),
  defaultTaxRate: z.number().min(0).default(0),
  defaultGoverningLaw: z.string().default(""),
});
export type CompanyProfile = z.infer<typeof CompanyProfileSchema>;

export const LineItemSchema = z.object({
  id: z.string(),
  description: z.string().default(""),
  quantity: z.number().default(1),
  unitPrice: z.number().default(0),
});
export type LineItem = z.infer<typeof LineItemSchema>;

export const InvoiceDataSchema = z.object({
  invoiceNumber: z.string().default(""),
  issueDate: z.string().default(""),
  dueDate: z.string().default(""),
  billToName: z.string().default(""),
  billToAddress: z.string().default(""),
  billToEmail: z.string().default(""),
  items: z.array(LineItemSchema).default([]),
  taxRate: z.number().default(0),
  discount: z.number().default(0),
  notes: z.string().default(""),
  currency: z.string().default("USD"),
});
export type InvoiceData = z.infer<typeof InvoiceDataSchema>;

export const NdaDataSchema = z.object({
  effectiveDate: z.string().default(""),
  isMutual: z.boolean().default(true),
  partyBName: z.string().default(""),
  partyBAddress: z.string().default(""),
  purpose: z.string().default(""),
  termYears: z.number().min(0).default(2),
  survivalYears: z.number().min(0).default(3),
  governingLaw: z.string().default(""),
});
export type NdaData = z.infer<typeof NdaDataSchema>;

export const QuestionTypeSchema = z.enum([
  "short",
  "long",
  "choice",
  "yesno",
  "rating",
]);
export type QuestionType = z.infer<typeof QuestionTypeSchema>;

export const QuestionSchema = z.object({
  id: z.string(),
  text: z.string().default(""),
  type: QuestionTypeSchema.default("short"),
  options: z.array(z.string()).default([]),
});
export type Question = z.infer<typeof QuestionSchema>;

export const QuestionnaireDataSchema = z.object({
  heading: z.string().default(""),
  intro: z.string().default(""),
  questions: z.array(QuestionSchema).default([]),
});
export type QuestionnaireData = z.infer<typeof QuestionnaireDataSchema>;

const docMeta = {
  id: z.string(),
  title: z.string().default("Untitled"),
  createdAt: z.string(),
  updatedAt: z.string(),
};

export const DocSchema = z.discriminatedUnion("type", [
  z.object({ ...docMeta, type: z.literal("invoice"), data: InvoiceDataSchema }),
  z.object({ ...docMeta, type: z.literal("nda"), data: NdaDataSchema }),
  z.object({
    ...docMeta,
    type: z.literal("questionnaire"),
    data: QuestionnaireDataSchema,
  }),
]);
export type Doc = z.infer<typeof DocSchema>;
export type DocType = Doc["type"];

export const DOC_TYPES: readonly DocType[] = [
  "invoice",
  "nda",
  "questionnaire",
] as const;

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  invoice: "Invoice",
  nda: "NDA",
  questionnaire: "Questionnaire",
};

export function isDocType(value: string): value is DocType {
  return (DOC_TYPES as readonly string[]).includes(value);
}
