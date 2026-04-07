import { useQuery } from "@tanstack/react-query";

import { generatedFileStatsKeys } from "./query-keys";
import type { GeneratedFileStatsPayload } from "./types";

async function fetchGeneratedFileStats(): Promise<GeneratedFileStatsPayload> {
  const res = await fetch("/api/stats/generated-files", {
    cache: "no-store",
  });
  if (res.status === 401) {
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    throw new Error("Could not load stats");
  }
  return res.json() as Promise<GeneratedFileStatsPayload>;
}

export function useGeneratedFileStats() {
  return useQuery({
    queryKey: generatedFileStatsKeys.all,
    queryFn: fetchGeneratedFileStats,
  });
}
