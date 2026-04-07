import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { generatedFileStatsKeys } from "~/lib/stats/query-keys";

import { postCodebaseExport } from "./fetch-export";
import { codebaseExportKeys } from "./query-keys";

const CONTENT_DISPOSITION_FILENAME = /filename="([^"]+)"/;

export type CodebaseExportProgress = {
	phase: string;
	current: number;
	total: number;
	path?: string;
	message?: string;
};

export type CodebaseExportResult = {
	included: number;
	skipped: number;
};

function triggerDownload(blob: Blob, filename: string) {
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.rel = "noopener";
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
}

function mimeForDownloadFilename(filename: string): string {
	if (filename.endsWith(".md")) {
		return "text/markdown;charset=utf-8";
	}
	if (filename.endsWith(".txt")) {
		return "text/plain;charset=utf-8";
	}
	if (filename.endsWith(".docx")) {
		return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
	}
	if (filename.endsWith(".pdf")) {
		return "application/pdf";
	}
	return "application/octet-stream";
}

function blobFromBase64Document(base64: string, filename: string): Blob {
	const binary = atob(base64);
	const len = binary.length;
	const bytes = new Uint8Array(len);
	for (let i = 0; i < len; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return new Blob([bytes], { type: mimeForDownloadFilename(filename) });
}

/**
 * Subscribes to progress updates written during `useCodebaseExport` mutations.
 */
export function useCodebaseExportProgress() {
	return useQuery({
		queryKey: codebaseExportKeys.progress(),
		queryFn: () => Promise.resolve(null as CodebaseExportProgress | null),
		enabled: false,
		initialData: null,
		staleTime: Number.POSITIVE_INFINITY,
		gcTime: 0,
	});
}

export function useCodebaseExport() {
	const queryClient = useQueryClient();

	const setProgress = useCallback(
		(next: CodebaseExportProgress | null) => {
			queryClient.setQueryData(codebaseExportKeys.progress(), next);
		},
		[queryClient],
	);

	const mutation = useMutation({
		mutationKey: [...codebaseExportKeys.all, "run"],
		mutationFn: async (formData: FormData): Promise<CodebaseExportResult> => {
			setProgress(null);

			const exportState = {
				current: null as null | {
					resultId: string;
					included: number;
					skipped: number;
					documentBase64?: string;
					filename?: string;
				},
			};

			await postCodebaseExport(formData, (ev) => {
				if (ev.type === "progress") {
					setProgress({
						phase: ev.phase,
						current: ev.current,
						total: ev.total,
						path: ev.path,
						message: ev.message,
					});
				} else if (ev.type === "error") {
					throw new Error(ev.message);
				} else if (ev.type === "complete") {
					exportState.current = {
						resultId: ev.resultId,
						included: ev.included,
						skipped: ev.skipped,
						documentBase64: ev.documentBase64,
						filename: ev.filename,
					};
				}
			});

			const done = exportState.current;
			if (!done) {
				throw new Error("Export finished without a result.");
			}

			if (done.documentBase64 && done.filename) {
				const blob = blobFromBase64Document(done.documentBase64, done.filename);
				triggerDownload(blob, done.filename);
			} else {
				const res = await fetch(`/api/codebase-to-doc/result/${done.resultId}`);
				if (!res.ok) {
					const detail = await res.text().catch(() => "");
					throw new Error(
						`Could not download the export (${res.status})${detail ? `: ${detail}` : ""}.`,
					);
				}
				const blob = await res.blob();
				const cd = res.headers.get("Content-Disposition");
				const match = cd?.match(CONTENT_DISPOSITION_FILENAME);
				const filename = match?.[1] ?? "codebase-export.md";
				triggerDownload(blob, filename);
			}

			const result: CodebaseExportResult = {
				included: done.included,
				skipped: done.skipped,
			};
			return result;
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: generatedFileStatsKeys.all,
			});
		},
		onSettled: () => {
			setProgress(null);
		},
	});

	const reset = useCallback(() => {
		mutation.reset();
		setProgress(null);
	}, [mutation.reset, setProgress]);

	return {
		mutation,
		reset,
	};
}
