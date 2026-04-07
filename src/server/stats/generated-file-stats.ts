import type { GeneratedFileStatsPayload } from "~/lib/stats/types";
import { db } from "~/server/db/mongo";

/** One document in this collection tracks global generated-export count. */
export const GENERATED_FILE_STATS_COLLECTION = "generated_file_stats";

/** Fixed id so there is only ever one stats document (upserted in place). */
export const GENERATED_FILE_STATS_DOC_ID = "singleton" as const;

interface GeneratedFileStatsDoc {
  _id: typeof GENERATED_FILE_STATS_DOC_ID;
  createdAt: Date;
  totalGeneratedFiles: number;
  updatedAt: Date;
}

/**
 * Reads the singleton stats document for display. Returns zeros if missing or on error.
 */
export async function getGeneratedFileStats(): Promise<GeneratedFileStatsPayload> {
  try {
    const doc = await db
      .collection<GeneratedFileStatsDoc>(GENERATED_FILE_STATS_COLLECTION)
      .findOne({ _id: GENERATED_FILE_STATS_DOC_ID });
    if (!doc) {
      return { totalGeneratedFiles: 0, updatedAt: null };
    }
    return {
      totalGeneratedFiles: doc.totalGeneratedFiles ?? 0,
      updatedAt:
        doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : null,
    };
  } catch (e) {
    console.error("[generated-file-stats] Failed to read stats", e);
    return { totalGeneratedFiles: 0, updatedAt: null };
  }
}

/**
 * Increments once per completed delivery (inline SSE payload or GET download).
 * Never throws: MongoDB errors are logged so export/download responses still succeed.
 */
export async function recordGeneratedExport(): Promise<void> {
  try {
    await db
      .collection<GeneratedFileStatsDoc>(GENERATED_FILE_STATS_COLLECTION)
      .updateOne(
        { _id: GENERATED_FILE_STATS_DOC_ID },
        {
          $inc: { totalGeneratedFiles: 1 },
          $set: { updatedAt: new Date() },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true }
      );
  } catch (e) {
    console.error("[generated-file-stats] Failed to upsert counter", e);
  }
}
