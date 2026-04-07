import { auth } from "~/server/better-auth";
import { takeExportResult } from "~/server/codebase-to-doc/result-store";
import { recordGeneratedExport } from "~/server/stats/generated-file-stats";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: Request,
  context: RouteContext
): Promise<Response> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await context.params;
  const result = takeExportResult(id);
  if (!result) {
    return new Response("Not found or expired", { status: 404 });
  }

  await recordGeneratedExport();

  const mime = (() => {
    const name = result.filename;
    if (name.endsWith(".md")) {
      return "text/markdown; charset=utf-8";
    }
    if (name.endsWith(".txt")) {
      return "text/plain; charset=utf-8";
    }
    if (name.endsWith(".docx")) {
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    }
    if (name.endsWith(".pdf")) {
      return "application/pdf";
    }
    return "application/octet-stream";
  })();

  return new Response(new Uint8Array(result.buffer), {
    headers: {
      "Content-Type": mime,
      "Content-Disposition": `attachment; filename="${result.filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
