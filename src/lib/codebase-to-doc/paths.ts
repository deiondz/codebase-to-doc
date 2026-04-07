import {
	ALLOWLIST_ENV_BASENAMES,
	IGNORE_DEV_ENV_BASENAME_LOWER,
	IGNORE_DIR_NAMES,
	IGNORE_FILE_NAMES,
	IGNORE_GIT_METADATA_BASENAME_LOWER,
	IGNORE_NPM_MANIFEST_BASENAME_LOWER,
} from "./constants";

/**
 * Normalizes a zip or folder entry path and rejects zip-slip / absolute paths.
 * Returns a posix-style relative path or null if unsafe.
 */
export function safeRelativePath(raw: string): string | null {
	const normalized = raw.replace(/\\/g, "/").trim();
	if (!normalized || normalized.includes("\0")) {
		return null;
	}
	if (normalized.startsWith("/") || normalized.startsWith("\\")) {
		return null;
	}
	if (/^[a-zA-Z]:[\\/]/.test(normalized)) {
		return null;
	}

	let s = normalized;
	while (s.startsWith("./")) {
		s = s.slice(2);
	}

	const segments = s.split("/").filter((seg) => seg !== "" && seg !== ".");
	const out: string[] = [];
	for (const seg of segments) {
		if (seg === "..") {
			return null;
		}
		if (seg.includes("\0")) {
			return null;
		}
		out.push(seg);
	}
	if (out.length === 0) {
		return null;
	}
	return out.join("/");
}

/** Minified bundles, source maps, TS incremental build info, etc. */
/** Cursor skill files, agent docs, and similar tooling filenames (case-insensitive where noted). */
export function isSkillOrAgentToolingBasename(basename: string): boolean {
	const lower = basename.toLowerCase();
	if (lower === "skill.md" || lower === "skills.md") {
		return true;
	}
	if (lower === "agents.md" || lower === "agent.md") {
		return true;
	}
	if (lower === "claude.md" || lower === "gemini.md") {
		return true;
	}
	if (lower === ".cursorrules" || lower === "cursorrules") {
		return true;
	}
	if (lower.endsWith(".skill.md")) {
		return true;
	}
	if (lower.endsWith(".agent.md")) {
		return true;
	}
	return false;
}

export function isBuildArtifactBasename(basename: string): boolean {
	const lower = basename.toLowerCase();
	if (lower.endsWith(".map")) {
		return true;
	}
	if (lower.endsWith(".tsbuildinfo")) {
		return true;
	}
	if (lower.endsWith(".min.js") || lower.endsWith(".min.css") || lower.endsWith(".min.mjs")) {
		return true;
	}
	if (lower.endsWith(".bundle.js") || lower.endsWith(".bundle.mjs")) {
		return true;
	}
	if (lower.endsWith(".chunk.js") || lower.endsWith(".chunk.mjs")) {
		return true;
	}
	return false;
}

/**
 * Editor backups, profiler output, Xcode user state — matched by suffix / pattern on basename.
 */
export function isEphemeralDevBasename(basename: string): boolean {
	const lower = basename.toLowerCase();
	if (lower.endsWith(".profraw")) {
		return true;
	}
	if (lower.endsWith(".swp") || lower.endsWith(".swo")) {
		return true;
	}
	if (lower.endsWith(".xcuserstate") || lower.endsWith(".xcscmblueprint")) {
		return true;
	}
	if (lower.endsWith("~") && lower.length > 1) {
		return true;
	}
	return false;
}

/** Secret / local env files; keeps `.env.example` and similar templates. */
export function isIgnoredEnvBasename(basename: string): boolean {
	if (ALLOWLIST_ENV_BASENAMES.has(basename)) {
		return false;
	}
	if (basename === ".env") {
		return true;
	}
	if (basename.startsWith(".env.")) {
		return true;
	}
	return false;
}

export function shouldIgnorePath(relativePath: string): boolean {
	const parts = relativePath.split("/");
	for (const part of parts) {
		if (IGNORE_DIR_NAMES.has(part)) {
			return true;
		}
	}
	const base = parts[parts.length - 1];
	if (!base) {
		return true;
	}
	if (IGNORE_FILE_NAMES.has(base)) {
		return true;
	}
	const baseLower = base.toLowerCase();
	if (IGNORE_NPM_MANIFEST_BASENAME_LOWER.has(baseLower)) {
		return true;
	}
	if (IGNORE_GIT_METADATA_BASENAME_LOWER.has(baseLower)) {
		return true;
	}
	if (IGNORE_DEV_ENV_BASENAME_LOWER.has(baseLower)) {
		return true;
	}
	if (isEphemeralDevBasename(base)) {
		return true;
	}
	if (isIgnoredEnvBasename(base)) {
		return true;
	}
	if (isBuildArtifactBasename(base)) {
		return true;
	}
	if (isSkillOrAgentToolingBasename(base)) {
		return true;
	}
	return false;
}
