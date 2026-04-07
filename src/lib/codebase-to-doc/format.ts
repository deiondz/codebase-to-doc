import type { DocOutputFormat } from "./types";

const EXT_TO_LANG: Record<string, string> = {
	ts: "typescript",
	tsx: "tsx",
	mts: "typescript",
	cts: "typescript",
	js: "javascript",
	jsx: "jsx",
	mjs: "javascript",
	cjs: "javascript",
	json: "json",
	jsonc: "jsonc",
	md: "markdown",
	mdx: "mdx",
	css: "css",
	scss: "scss",
	sass: "sass",
	less: "less",
	html: "html",
	htm: "html",
	vue: "vue",
	svelte: "svelte",
	py: "python",
	rb: "ruby",
	rs: "rust",
	go: "go",
	java: "java",
	kt: "kotlin",
	swift: "swift",
	c: "c",
	h: "c",
	cpp: "cpp",
	cc: "cpp",
	cxx: "cpp",
	hpp: "cpp",
	cs: "csharp",
	fs: "fsharp",
	ex: "elixir",
	exs: "elixir",
	erl: "erlang",
	hs: "haskell",
	sh: "bash",
	bash: "bash",
	zsh: "bash",
	ps1: "powershell",
	sql: "sql",
	yml: "yaml",
	yaml: "yaml",
	toml: "toml",
	xml: "xml",
	svg: "svg",
	prisma: "prisma",
	graphql: "graphql",
	gql: "graphql",
};

export function fenceLangForPath(relativePath: string): string {
	const last = relativePath.split("/").pop() ?? relativePath;
	const dot = last.lastIndexOf(".");
	if (dot <= 0) {
		return "";
	}
	const ext = last.slice(dot + 1).toLowerCase();
	return EXT_TO_LANG[ext] ?? ext;
}

/** Builds a Markdown code fence that won't break if the code contains backticks. */
function fencedCodeBlock(lang: string, content: string): string {
	let maxRun = 0;
	const re = /`+/g;
	let m: RegExpExecArray | null;
	while ((m = re.exec(content)) !== null) {
		maxRun = Math.max(maxRun, m[0].length);
	}
	const tickCount = Math.max(3, maxRun + 1);
	const ticks = "`".repeat(tickCount);
	return `${ticks}${lang}\n${content}\n${ticks}`;
}

export interface SourceChunk {
	path: string;
	content: string;
}

function formatSkippedMarkdown(
	skipped: Array<{ path: string; reason: string }>,
): string {
	if (skipped.length === 0) {
		return "";
	}
	const lines = skipped.map(
		(s) => `- \`${s.path}\` — ${s.reason}`,
	);
	return `## Skipped files\n\n${lines.join("\n")}\n\n---\n\n`;
}

function formatSkippedPlain(
	skipped: Array<{ path: string; reason: string }>,
): string {
	if (skipped.length === 0) {
		return "";
	}
	const lines = skipped.map((s) => `- ${s.path} (${s.reason})`);
	return `SKIPPED FILES\n${lines.join("\n")}\n\n${"=".repeat(40)}\n\n`;
}

export function buildDocument(
	chunks: SourceChunk[],
	skipped: Array<{ path: string; reason: string }>,
	format: DocOutputFormat,
): string {
	const header =
		format === "markdown"
			? formatSkippedMarkdown(skipped)
			: formatSkippedPlain(skipped);

	const parts: string[] = [header];

	if (format === "markdown") {
		for (const c of chunks) {
			const lang = fenceLangForPath(c.path);
			parts.push(`## ${c.path}\n\n${fencedCodeBlock(lang, c.content)}`);
		}
		return parts.join("\n\n");
	}

	for (const c of chunks) {
		parts.push(`${"=".repeat(10)} ${c.path} ${"=".repeat(10)}\n\n${c.content}`);
	}
	return parts.join("\n\n");
}
