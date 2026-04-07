export type DocOutputFormat = "markdown" | "plaintext" | "docx" | "pdf";

export interface GenerateDocumentResult {
	blob: Blob;
	downloadFilename: string;
	includedFileCount: number;
	skipped: Array<{ path: string; reason: string }>;
}
