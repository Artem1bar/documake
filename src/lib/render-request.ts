import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import type { Doc, DocType } from "./types";
import {
  InvoiceDataSchema,
  NdaDataSchema,
  QuestionnaireDataSchema,
  QuoteDataSchema,
  RenderProfileSchema,
  SowDataSchema,
} from "./types";

/**
 * Characters allowed in a caller-supplied filename. Deliberately narrow: the
 * value lands in a Content-Disposition header, where a quote or a newline
 * would let a caller inject headers of their own.
 */
const FILENAME_PATTERN = /^[A-Za-z0-9 ._-]{1,120}$/;

const SECRET_ENV = "DOCUMAKE_RENDER_SECRET";

/** Synthetic id for the stateless render path; never appears in output. */
const API_DOC_ID = "api-render";

const renderBase = {
  profile: RenderProfileSchema.optional(),
  filename: z.string().regex(FILENAME_PATTERN).optional(),
};

export const RenderRequestSchema = z.discriminatedUnion("type", [
  z.object({ ...renderBase, type: z.literal("invoice"), data: InvoiceDataSchema }),
  z.object({ ...renderBase, type: z.literal("quote"), data: QuoteDataSchema }),
  z.object({ ...renderBase, type: z.literal("sow"), data: SowDataSchema }),
  z.object({ ...renderBase, type: z.literal("nda"), data: NdaDataSchema }),
  z.object({
    ...renderBase,
    type: z.literal("questionnaire"),
    data: QuestionnaireDataSchema,
  }),
]);
export type RenderRequest = z.infer<typeof RenderRequestSchema>;

/**
 * Wraps a request payload in the `Doc` shape the templates expect. The
 * metadata is synthetic because the API stores nothing — templates read only
 * `profile` and `data`, so none of it reaches the page.
 */
export function toDoc(request: RenderRequest): Doc {
  const timestamp = new Date().toISOString();
  const meta = {
    id: API_DOC_ID,
    title: "",
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  switch (request.type) {
    case "invoice":
      return { ...meta, type: "invoice", data: request.data };
    case "quote":
      return { ...meta, type: "quote", data: request.data };
    case "sow":
      return { ...meta, type: "sow", data: request.data };
    case "nda":
      return { ...meta, type: "nda", data: request.data };
    case "questionnaire":
      return { ...meta, type: "questionnaire", data: request.data };
  }
}

export function resolveFilename(type: DocType, filename: string | undefined): string {
  const base = filename?.trim() || type;
  return base.toLowerCase().endsWith(".pdf") ? base : `${base}.pdf`;
}

/** Constant-time comparison over digests, so both inputs are always equal length. */
function safeEqual(a: string, b: string): boolean {
  return timingSafeEqual(
    createHash("sha256").update(a).digest(),
    createHash("sha256").update(b).digest(),
  );
}

/**
 * Bearer-token check, modelled on the hub's CRON_SECRET pattern: the endpoint
 * is open when no secret is configured, and closed to everything but an exact
 * match once one is.
 */
export function isAuthorized(authorizationHeader: string | null): boolean {
  const secret = process.env[SECRET_ENV];
  if (!secret) return true;
  if (!authorizationHeader) return false;

  return safeEqual(authorizationHeader, `Bearer ${secret}`);
}

/** Flattens zod issues into one line, without echoing the submitted values. */
export function describeIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.join(".");
      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join("; ");
}
