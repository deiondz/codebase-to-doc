import { auth } from "~/server/better-auth";
import { getGeneratedFileStats } from "~/server/stats/generated-file-stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = await getGeneratedFileStats();
  return Response.json(stats);
}
