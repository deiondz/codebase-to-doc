import type { SourceChunk } from "./format";
import { buildDocument } from "./format";
import { safeRelativePath, shouldIgnorePath } from "./paths";
import { decodeTextFile, isTooLarge } from "./text";
import type { DocOutputFormat, GenerateDocumentResult } from "./types";

export interface RawEntry {
	/** Raw path as provided by zip key or webkitRelativePath (before normalization). */
	rawPath: string;
	bytes: Uint8Array;
}

export type ProcessOutcome =
	| { ok: true; chunk: SourceChunk }
	| { ok: false; skip: { path: string; reason: string } };

export function tryProcessEntry(entry: RawEntry): ProcessOutcome {
	const safe = safeRelativePath(entry.rawPath);
	if (safe === null) {
		return { ok: false, skip: { path: entry.rawPath, reason: "unsafe path" } };
	}

	if (shouldIgnorePath(safe)) {
		return { ok: false, skip: { path: safe, reason: "ignored path" } };
	}

	if (isTooLarge(entry.bytes.length)) {
		return { ok: false, skip: { path: safe, reason: "file too large" } };
	}

	const content = decodeTextFile(entry.bytes);
	if (content === null) {
		return {
			ok: false,
			skip: { path: safe, reason: "binary, invalid UTF-8, or unsupported encoding" },
		};
	}
	return { ok: true, chunk: { path: safe, content } };
}

export type CollectProgress = {
	phase: "process";
	current: number;
	total: number;
	path?: string;
};

export function collectFromRawEntries(
	entries: RawEntry[],
	options?: { onProgress?: (p: CollectProgress) => void },
): {
	chunks: SourceChunk[];
	skipped: Array<{ path: string; reason: string }>;
} {
	const skipped: Array<{ path: string; reason: string }> = [];
	const chunks: SourceChunk[] = [];
	const total = entries.length;
	let current = 0;

	for (const entry of entries) {
		current += 1;
		options?.onProgress?.({
			phase: "process",
			current,
			total,
			path: entry.rawPath,
		});

		const outcome = tryProcessEntry(entry);
		if (outcome.ok) {
			chunks.push(outcome.chunk);
		} else {
			skipped.push(outcome.skip);
		}
	}

	chunks.sort((a, b) => a.path.localeCompare(b.path));
	skipped.sort((a, b) => a.path.localeCompare(b.path));

	return { chunks, skipped };
}

export function finalizeDocument(
	chunks: SourceChunk[],
	skipped: Array<{ path: string; reason: string }>,
	format: DocOutputFormat,
): GenerateDocumentResult {
	if (format === "docx" || format === "pdf") {
		throw new Error(
			"Word and PDF export runs on the server — use the convert page or POST /api/codebase-to-doc.",
		);
	}
	const ext = format === "markdown" ? "md" : "txt";
	const text = buildDocument(chunks, skipped, format);
	const mime =
		format === "markdown" ? "text/markdown;charset=utf-8" : "text/plain;charset=utf-8";
	return {
		blob: new Blob([text], { type: mime }),
		downloadFilename: `codebase-export.${ext}`,
		includedFileCount: chunks.length,
		skipped,
	};
}
