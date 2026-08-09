import { renderToBuffer } from "@react-pdf/renderer";
import { renderDocumentPdf } from "@/components/pdf/renderDocumentPdf";
import { DEFAULT_RENDER_PROFILE } from "@/lib/profile-defaults";
import {
  describeIssues,
  isAuthorized,
  RenderRequestSchema,
  resolveFilename,
  toDoc,
} from "@/lib/render-request";

// Runs on the Node runtime (the default), which `renderToBuffer` requires.

function errorResponse(status: number, error: string): Response {
  return Response.json({ success: false, data: null, error }, { status });
}

/**
 * Stateless PDF rendering. Takes a document type, its data, and an optional
 * company profile; returns the rendered PDF. Nothing is persisted, so this is
 * usable from other services without going through the browser app.
 */
export async function POST(request: Request): Promise<Response> {
  // Checked before anything else, so an unauthenticated caller cannot use
  // validation errors to probe the payload shape or spend CPU on a render.
  if (!isAuthorized(request.headers.get("authorization"))) {
    return errorResponse(401, "Unauthorized.");
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return errorResponse(400, "Request body must be valid JSON.");
  }

  const parsed = RenderRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return errorResponse(400, describeIssues(parsed.error));
  }

  const { profile = DEFAULT_RENDER_PROFILE, filename, type } = parsed.data;

  try {
    const pdf = await renderToBuffer(renderDocumentPdf(toDoc(parsed.data), profile));

    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${resolveFilename(type, filename)}"`,
        "content-length": String(pdf.byteLength),
        "cache-control": "no-store",
      },
    });
  } catch {
    // The payload validated, so this is a template or renderer fault. Keep the
    // detail in the server log rather than the response body.
    return errorResponse(500, "Failed to render the document.");
  }
}
