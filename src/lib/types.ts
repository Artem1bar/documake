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

/**
 * The three standard PDF font families. They need no embedding and no font
 * files, so documents render identically offline and on any machine. Embedded
 * brand fonts can be added later as extra members here.
 */
export const FontFamilySchema = z.enum(["helvetica", "times", "courier"]);
export type FontFamily = z.infer<typeof FontFamilySchema>;

export const BrandingSchema = z.object({
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "must be a six-digit hex colour, e.g. #002b72")
    .default("#111827"),
  fontFamily: FontFamilySchema.default("helvetica"),
});
export type Branding = z.infer<typeof BrandingSchema>;

/** Everything a template needs to render: company details plus branding. */
export const RenderProfileSchema = CompanyProfileSchema.extend({
  branding: BrandingSchema.default(() => BrandingSchema.parse({})),
});
export type RenderProfile = z.infer<typeof RenderProfileSchema>;

/** A render profile the app also stores, so it needs an identity of its own. */
export const BrandProfileSchema = RenderProfileSchema.extend({
  id: z.string(),
  label: z.string().default("Untitled profile"),
});
export type BrandProfile = z.infer<typeof BrandProfileSchema>;

export const ProfileStoreSchema = z.object({
  profiles: z.array(BrandProfileSchema).default([]),
  activeProfileId: z.string().default(""),
});
export type ProfileStore = z.infer<typeof ProfileStoreSchema>;

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

export const QuoteDataSchema = z.object({
  quoteNumber: z.string().default(""),
  issueDate: z.string().default(""),
  validUntil: z.string().default(""),
  clientName: z.string().default(""),
  clientAddress: z.string().default(""),
  clientEmail: z.string().default(""),
  summary: z.string().default(""),
  items: z.array(LineItemSchema).default([]),
  taxRate: z.number().default(0),
  discount: z.number().default(0),
  currency: z.string().default("USD"),
  terms: z.string().default(""),
  notes: z.string().default(""),
  showAcceptance: z.boolean().default(true),
});
export type QuoteData = z.infer<typeof QuoteDataSchema>;

export const MilestoneSchema = z.object({
  id: z.string(),
  name: z.string().default(""),
  deliverables: z.string().default(""),
  dueDate: z.string().default(""),
  paymentPercent: z.number().min(0).max(100).default(0),
});
export type Milestone = z.infer<typeof MilestoneSchema>;

export const SowDataSchema = z.object({
  sowNumber: z.string().default(""),
  effectiveDate: z.string().default(""),
  projectName: z.string().default(""),
  clientName: z.string().default(""),
  clientAddress: z.string().default(""),
  background: z.string().default(""),
  scope: z.string().default(""),
  outOfScope: z.string().default(""),
  milestones: z.array(MilestoneSchema).default([]),
  totalFee: z.number().min(0).default(0),
  currency: z.string().default("USD"),
  assumptions: z.string().default(""),
  changeControl: z.string().default(""),
  governingLaw: z.string().default(""),
});
export type SowData = z.infer<typeof SowDataSchema>;

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
  z.object({ ...docMeta, type: z.literal("quote"), data: QuoteDataSchema }),
  z.object({ ...docMeta, type: z.literal("sow"), data: SowDataSchema }),
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
  "quote",
  "sow",
  "nda",
  "questionnaire",
] as const;

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  invoice: "Invoice",
  quote: "Quote",
  sow: "SOW",
  nda: "NDA",
  questionnaire: "Questionnaire",
};

export function isDocType(value: string): value is DocType {
  return (DOC_TYPES as readonly string[]).includes(value);
}
