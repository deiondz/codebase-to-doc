export const codebaseExportKeys = {
	all: ["codebase-export"] as const,
	progress: () => [...codebaseExportKeys.all, "progress"] as const,
};
