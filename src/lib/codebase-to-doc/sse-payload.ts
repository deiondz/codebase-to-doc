/** SSE JSON payloads for POST /api/codebase-to-doc (shared client + server). */
export type CodebaseExportSsePayload =
	| {
			type: "progress";
			phase: "zip" | "build";
			current: number;
			total: number;
			path?: string;
			message?: string;
	  }
	| {
			type: "complete";
			resultId: string;
			included: number;
			skipped: number;
			/** Present when small enough to embed; avoids a second GET (helps serverless). */
			documentBase64?: string;
			filename?: string;
	  }
	| { type: "error"; message: string };
