import { Buffer } from "node:buffer";

import { unzipSync } from "fflate";
import type { SourceChunk } from "~/lib/codebase-to-doc/format";
import { buildDocument } from "~/lib/codebase-to-doc/format";
import { type RawEntry, tryProcessEntry } from "~/lib/codebase-to-doc/process";
import type { DocOutputFormat } from "~/lib/codebase-to-doc/types";
import {
  exportCodebaseDocx,
  exportCodebasePdf,
} from "~/server/codebase-to-doc/binary-export";

const MAX_ZIP_BYTES = 40 * 1024 * 1024;

export type ProgressFn = (p: {
  phase: "zip" | "build";
  current: number;
  total: number;
  path?: string;
  message?: string;
}) => void;

function sortChunksAndSkipped(
  chunks: SourceChunk[],
  skipped: Array<{ path: string; reason: string }>
): void {
  chunks.sort((a, b) => a.path.localeCompare(b.path));
  skipped.sort((a, b) => a.path.localeCompare(b.path));
}

export async function exportFromZipBuffer(
  zipBuffer: Buffer,
  format: DocOutputFormat,
  onProgress: ProgressFn
): Promise<{
  buffer: Buffer;
  filename: string;
  included: number;
  skipped: number;
}> {
  if (zipBuffer.length > MAX_ZIP_BYTES) {
    throw new Error(
      `Zip is too large (max ${Math.floor(MAX_ZIP_BYTES / (1024 * 1024))} MB).`
    );
  }

  onProgress({
    phase: "zip",
    current: 0,
    total: 1,
    message: "Reading archive…",
  });

  let unzipped: Record<string, Uint8Array>;
  try {
    unzipped = unzipSync(new Uint8Array(zipBuffer));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid zip archive.";
    throw new Error(msg);
  }

  const paths = Object.keys(unzipped).filter((p) => !p.endsWith("/"));
  const total = paths.length;
  const chunks: SourceChunk[] = [];
  const skippedItems: Array<{ path: string; reason: string }> = [];

  let i = 0;
  for (const rawPath of paths) {
    i += 1;
    onProgress({
      phase: "zip",
      current: i,
      total,
      path: rawPath,
    });

    const bytes = unzipped[rawPath];
    if (!bytes) {
      continue;
    }
    const entry: RawEntry = { rawPath, bytes };
    const outcome = tryProcessEntry(entry);
    if (outcome.ok) {
      chunks.push(outcome.chunk);
    } else {
      skippedItems.push(outcome.skip);
    }

    if (i % 32 === 0) {
      await new Promise((r) => setImmediate(r));
    }
  }

  sortChunksAndSkipped(chunks, skippedItems);

  if (chunks.length === 0) {
    throw new Error(
      "No text files to export. Files may be ignored, binary, or too large — try another zip."
    );
  }

  onProgress({
    phase: "build",
    current: 1,
    total: 1,
    message: "Building document…",
  });

  let buffer: Buffer;
  let filename: string;

  if (format === "markdown" || format === "plaintext") {
    const text = buildDocument(chunks, skippedItems, format);
    const ext = format === "markdown" ? "md" : "txt";
    filename = `codebase-export.${ext}`;
    buffer = Buffer.from(text, "utf8");
  } else if (format === "docx") {
    buffer = await exportCodebaseDocx(chunks, skippedItems);
    filename = "codebase-export.docx";
  } else {
    buffer = await exportCodebasePdf(chunks, skippedItems);
    filename = "codebase-export.pdf";
  }

  return {
    buffer,
    filename,
    included: chunks.length,
    skipped: skippedItems.length,
  };
}
