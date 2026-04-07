import type { CodebaseExportSsePayload } from "./sse-payload";

/**
 * POST multipart to `/api/codebase-to-doc` and invoke `onEvent` for each SSE JSON payload.
 */
export async function postCodebaseExport(
	formData: FormData,
	onEvent: (e: CodebaseExportSsePayload) => void,
): Promise<void> {
	const res = await fetch("/api/codebase-to-doc", {
		method: "POST",
		body: formData,
	});

	if (!res.ok) {
		let msg = `Request failed (${res.status})`;
		try {
			const j = JSON.parse(await res.text()) as { error?: string };
			if (j.error) {
				msg = j.error;
			}
		} catch {
			// ignore
		}
		throw new Error(msg);
	}

	if (!res.body) {
		throw new Error("No response body");
	}

	const reader = res.body.getReader();
	const decoder = new TextDecoder();
	let buf = "";

	while (true) {
		const { done, value } = await reader.read();
		if (done) {
			break;
		}
		buf += decoder.decode(value, { stream: true });
		const parts = buf.split("\n\n");
		buf = parts.pop() ?? "";
		for (const block of parts) {
			const trimmed = block.trim();
			if (!trimmed.startsWith("data: ")) {
				continue;
			}
			try {
				const data = JSON.parse(trimmed.slice(6)) as CodebaseExportSsePayload;
				onEvent(data);
			} catch {
				// malformed chunk; continue
			}
		}
	}
}
