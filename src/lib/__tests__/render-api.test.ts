import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/render/route";
import { DEFAULT_PROFILE } from "../factories";
import { isAuthorized, RenderRequestSchema, resolveFilename } from "../render-request";
import type { InvoiceData, NdaData } from "../types";

const SECRET_ENV = "DOCUMAKE_RENDER_SECRET";

const invoiceData: InvoiceData = {
  invoiceNumber: "INV-0001",
  issueDate: "2026-08-09",
  dueDate: "2026-08-23",
  billToName: "Acme Corp",
  billToAddress: "123 Main Street",
  billToEmail: "billing@acme.com",
  items: [{ id: "1", description: "Design work", quantity: 2, unitPrice: 500 }],
  taxRate: 8.25,
  discount: 0,
  notes: "",
  currency: "USD",
};

const ndaData: NdaData = {
  effectiveDate: "2026-08-09",
  isMutual: true,
  partyBName: "Acme Corp",
  partyBAddress: "123 Main Street",
  purpose: "evaluating a potential business relationship",
  termYears: 2,
  survivalYears: 3,
  governingLaw: "the State of Texas, USA",
};

function post(body: unknown, headers: Record<string, string> = {}): Promise<Response> {
  return POST(
    new Request("http://localhost/api/render", {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

async function expectPdf(response: Response): Promise<void> {
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toBe("application/pdf");

  const bytes = new Uint8Array(await response.arrayBuffer());
  expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
  expect(bytes.byteLength).toBeGreaterThan(1000);
}

describe("RenderRequestSchema", () => {
  it("accepts a minimal request and defaults the profile away", () => {
    const result = RenderRequestSchema.safeParse({ type: "nda", data: ndaData });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown document type", () => {
    const result = RenderRequestSchema.safeParse({ type: "receipt", data: {} });
    expect(result.success).toBe(false);
  });

  it("rejects a payload whose data does not match its type", () => {
    const result = RenderRequestSchema.safeParse({
      type: "invoice",
      data: { items: "not a list" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects a filename carrying header-injection characters", () => {
    for (const filename of ['a"b', "a\nb", "../etc/passwd", "a/b"]) {
      const result = RenderRequestSchema.safeParse({ type: "nda", data: ndaData, filename });
      expect(result.success, `expected ${JSON.stringify(filename)} to be rejected`).toBe(false);
    }
  });
});

describe("resolveFilename", () => {
  it("falls back to a name derived from the document type", () => {
    expect(resolveFilename("invoice", undefined)).toBe("invoice.pdf");
    expect(resolveFilename("questionnaire", undefined)).toBe("questionnaire.pdf");
  });

  it("keeps a caller-supplied name and ensures a single .pdf suffix", () => {
    expect(resolveFilename("nda", "acme-nda")).toBe("acme-nda.pdf");
    expect(resolveFilename("nda", "acme-nda.pdf")).toBe("acme-nda.pdf");
  });
});

describe("isAuthorized", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows any request when no secret is configured", () => {
    vi.stubEnv(SECRET_ENV, "");
    expect(isAuthorized(null)).toBe(true);
    expect(isAuthorized("Bearer whatever")).toBe(true);
  });

  it("requires a matching bearer token when a secret is configured", () => {
    vi.stubEnv(SECRET_ENV, "s3cret");
    expect(isAuthorized("Bearer s3cret")).toBe(true);
    expect(isAuthorized("Bearer wrong")).toBe(false);
    expect(isAuthorized("s3cret")).toBe(false);
    expect(isAuthorized(null)).toBe(false);
  });

  it("does not accept a token that merely shares a prefix", () => {
    vi.stubEnv(SECRET_ENV, "s3cret");
    expect(isAuthorized("Bearer s3cretlonger")).toBe(false);
    expect(isAuthorized("Bearer s3cre")).toBe(false);
  });
});

describe("POST /api/render", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders an invoice", async () => {
    await expectPdf(await post({ type: "invoice", data: invoiceData, profile: DEFAULT_PROFILE }));
  });

  it("renders an NDA", async () => {
    await expectPdf(await post({ type: "nda", data: ndaData }));
  });

  it("renders a questionnaire", async () => {
    const response = await post({
      type: "questionnaire",
      data: {
        heading: "Client Intake",
        intro: "Please answer the questions below.",
        questions: [{ id: "q1", text: "Company name?", type: "short", options: [] }],
      },
    });
    await expectPdf(response);
  });

  it("renders without a profile by falling back to defaults", async () => {
    await expectPdf(await post({ type: "nda", data: ndaData }));
  });

  it("sets a content-disposition filename", async () => {
    const response = await post({ type: "nda", data: ndaData, filename: "acme-nda" });
    expect(response.headers.get("content-disposition")).toBe(
      'attachment; filename="acme-nda.pdf"',
    );
  });

  it("returns 400 with an error envelope for malformed JSON", async () => {
    const response = await post("{not json");
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      success: false,
      data: null,
      error: expect.stringContaining("JSON"),
    });
  });

  it("returns 400 with an error envelope for an invalid payload", async () => {
    const response = await post({ type: "invoice", data: { items: "not a list" } });
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.data).toBeNull();
    expect(typeof body.error).toBe("string");
  });

  it("returns 401 when a secret is configured and the token is missing", async () => {
    vi.stubEnv(SECRET_ENV, "s3cret");
    const response = await post({ type: "nda", data: ndaData });

    expect(response.status).toBe(401);
    expect((await response.json()).success).toBe(false);
  });

  it("returns 401 when a secret is configured and the token is wrong", async () => {
    vi.stubEnv(SECRET_ENV, "s3cret");
    const response = await post({ type: "nda", data: ndaData }, { authorization: "Bearer nope" });

    expect(response.status).toBe(401);
  });

  it("renders when the configured token matches", async () => {
    vi.stubEnv(SECRET_ENV, "s3cret");
    await expectPdf(
      await post({ type: "nda", data: ndaData }, { authorization: "Bearer s3cret" }),
    );
  });

  it("rejects before rendering, so an invalid payload cannot be used to burn CPU", async () => {
    vi.stubEnv(SECRET_ENV, "s3cret");
    const response = await post({ type: "invoice", data: { items: "not a list" } });

    // Auth is checked first: an unauthenticated caller learns nothing about validity.
    expect(response.status).toBe(401);
  });
});
