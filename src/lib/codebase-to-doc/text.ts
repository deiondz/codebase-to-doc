import { MAX_TEXT_FILE_BYTES } from "./constants";

export function isTooLarge(byteLength: number): boolean {
	return byteLength > MAX_TEXT_FILE_BYTES;
}

/** Any NUL byte → not treatable as text (also invalid in UTF-8). */
export function hasNullByte(bytes: Uint8Array): boolean {
	for (let i = 0; i < bytes.length; i++) {
		if (bytes[i] === 0) {
			return true;
		}
	}
	return false;
}

function decodeUtf8Strict(bytes: Uint8Array): string | null {
	try {
		return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
	} catch {
		return null;
	}
}

function decodeUtf16Strict(bytes: Uint8Array, encoding: "utf-16le" | "utf-16be"): string | null {
	try {
		return new TextDecoder(encoding, { fatal: true }).decode(bytes);
	} catch {
		return null;
	}
}

/**
 * Decode archive bytes as source text. Returns `null` if bytes are not plausible
 * text (invalid UTF-8/UTF-16). UTF-8 payloads must not contain raw NUL (binary).
 * BOM is checked before NUL rejection so UTF-16 (many `0x00` in ASCII) still works.
 */
export function decodeTextFile(bytes: Uint8Array): string | null {
	if (bytes.length === 0) {
		return "";
	}

	// UTF-8 BOM
	if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
		const payload = bytes.subarray(3);
		if (hasNullByte(payload)) {
			return null;
		}
		return decodeUtf8Strict(payload);
	}

	// UTF-16 LE BOM (same first two bytes as UTF-32 LE BOM; treat as UTF-16 only)
	if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
		return decodeUtf16Strict(bytes.subarray(2), "utf-16le");
	}

	// UTF-16 BE BOM
	if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
		return decodeUtf16Strict(bytes.subarray(2), "utf-16be");
	}

	if (hasNullByte(bytes)) {
		return null;
	}
	return decodeUtf8Strict(bytes);
}
