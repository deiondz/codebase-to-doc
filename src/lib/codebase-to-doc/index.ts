import { unzipSync } from "fflate";

import { collectFromRawEntries, finalizeDocument, type RawEntry } from "./process";
import type { DocOutputFormat, GenerateDocumentResult } from "./types";

export type { DocOutputFormat, GenerateDocumentResult } from "./types";

const EMPTY_MESSAGE =
	"No text files to export. Files may be ignored, binary, or too large — try another zip.";

export async function generateFromZip(
	file: File,
	format: DocOutputFormat,
): Promise<GenerateDocumentResult> {
	let data: Uint8Array;
	try {
		const buf = await file.arrayBuffer();
		data = new Uint8Array(buf);
	} catch {
		throw new Error("Could not read the zip file.");
	}

	let unzipped: Record<string, Uint8Array>;
	try {
		unzipped = unzipSync(data);
	} catch (e) {
		const msg = e instanceof Error ? e.message : "Invalid zip archive.";
		throw new Error(msg);
	}

	const entries: RawEntry[] = Object.entries(unzipped).map(([rawPath, bytes]) => ({
		rawPath,
		bytes,
	}));

	const { chunks, skipped } = collectFromRawEntries(entries);
	if (chunks.length === 0) {
		throw new Error(EMPTY_MESSAGE);
	}
	return finalizeDocument(chunks, skipped, format);
}
