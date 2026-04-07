import { Buffer } from "node:buffer";

import type { CodebaseExportSsePayload } from "~/lib/codebase-to-doc/sse-payload";
import type { DocOutputFormat } from "~/lib/codebase-to-doc/types";
import { exportFromZipBuffer } from "~/server/codebase-to-doc/pipeline";
import { putExportResult } from "~/server/codebase-to-doc/result-store";
import { auth } from "~/server/better-auth";

export const runtime = "nodejs";
export const maxDuration = 120;
export const dynamic = "force-dynamic";

function encodeSse(payload: CodebaseExportSsePayload): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`);
}

export async function POST(request: Request): Promise<Response> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return new Response(
      JSON.stringify({ error: "Expected multipart form data" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return new Response(JSON.stringify({ error: "Could not read upload" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const formatRaw = formData.get("format");
  if (
    formatRaw !== "markdown" &&
    formatRaw !== "plaintext" &&
    formatRaw !== "docx" &&
    formatRaw !== "pdf"
  ) {
    return new Response(
      JSON.stringify({ error: "Invalid or missing format" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
  const format = formatRaw as DocOutputFormat;

  const zipField = formData.get("zip");
  const zipFile =
    zipField instanceof File && zipField.size > 0 ? zipField : null;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (payload: CodebaseExportSsePayload) => {
        controller.enqueue(encodeSse(payload));
      };

      try {
        if (!zipFile) {
          send({ type: "error", message: "Send a non-empty .zip file." });
          controller.close();
          return;
        }

        const buf = Buffer.from(await zipFile.arrayBuffer());
        const result = await exportFromZipBuffer(buf, format, (p) => {
          send({
            type: "progress",
            phase: p.phase,
            current: p.current,
            total: p.total,
            path: p.path,
            message: p.message,
          });
        });
        const resultId = putExportResult(result.buffer, result.filename);
        /** Inline when modest so the client need not GET a separate route (fixes isolate / serverless). */
        const MAX_INLINE_BYTES = 3 * 1024 * 1024;
        const payload: CodebaseExportSsePayload = {
          type: "complete",
          resultId,
          included: result.included,
          skipped: result.skipped,
          ...(result.buffer.length <= MAX_INLINE_BYTES
            ? {
                documentBase64: result.buffer.toString("base64"),
                filename: result.filename,
              }
            : {}),
        };
        send(payload);
        controller.close();
      } catch (e) {
        const message = e instanceof Error ? e.message : "Export failed";
        send({ type: "error", message });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
