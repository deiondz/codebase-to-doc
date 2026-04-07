/** Max size per file before we skip (text extraction). */
export const MAX_TEXT_FILE_BYTES = 1024 * 1024;

/** Directory name segments to skip anywhere in the path. */
export const IGNORE_DIR_NAMES = new Set([
	".angular",
	".cache",
	".docusaurus",
	".eggs",
	".firebase",
	".fleet",
	".git",
	".gradle",
	".hg",
	".history",
	".hypothesis",
	".jest",
	".mypy_cache",
	".next",
	".npm",
	".nuxt",
	".nx",
	".nyc_output",
	".output",
	".parcel-cache",
	".pnpm",
	".pytest_cache",
	".ruff_cache",
	".serverless",
	".svelte-kit",
	".svn",
	".swc",
	".terraform",
	".tox",
	".turbo",
	".venv",
	".vercel",
	".vite",
	".vagrant",
	".vs",
	".yarn",
	".zed",
	"bower_components",
	"build",
	"coverage",
	"dist",
	"htmlcov",
	"jspm_packages",
	"node_modules",
	"out",
	"Pods",
	"storybook-static",
	"target",
	"temp",
	"tmp",
	"vendor",
	"venv",
	"__pycache__",
	"obj",
	/** Editor / AI tooling (skills, MCP, agent transcripts, etc.) */
	".cursor",
	".agents",
	".amazonq",
	".claude",
	".vscode",
	".idea",
	"agent-transcripts",
]);

/**
 * Exact file names to skip: lockfiles, package managers, dependency manifests, tool dep configs.
 */
export const IGNORE_FILE_NAMES = new Set([
	".DS_Store",
	".npmrc",
	".yarnrc",
	".yarnrc.yml",
	".pnp.cjs",
	".pnp.loader.mjs",
	"bunfig.toml",
	"Cargo.lock",
	"Cargo.toml",
	"composer.json",
	"composer.lock",
	"deno.lock",
	"Gemfile",
	"Gemfile.lock",
	"go.mod",
	"go.sum",
	"mix.lock",
	"Pipfile",
	"Pipfile.lock",
	"poetry.lock",
	"pyproject.toml",
	"requirements.txt",
]);

/**
 * Node/npm manifests and lockfiles — basename matched case-insensitively (e.g. `Package.json` from zips).
 */
export const IGNORE_NPM_MANIFEST_BASENAME_LOWER = new Set([
	"package.json",
	"package-lock.json",
	"npm-shrinkwrap.json",
	"pnpm-lock.yaml",
	"pnpm-workspace.yaml",
	"yarn.lock",
	"bun.lockb",
]);

/**
 * Git metadata files (not already under a skipped `.git/` dir) — basename matched case-insensitively.
 */
export const IGNORE_GIT_METADATA_BASENAME_LOWER = new Set([
	".gitignore",
	".gitattributes",
	".gitmodules",
	".gitkeep",
	".git-blame-ignore-revs",
	".mailmap",
]);

/**
 * Local overrides, tool caches, and OS junk — basename matched case-insensitively.
 */
export const IGNORE_DEV_ENV_BASENAME_LOWER = new Set([
	".eslintcache",
	".stylelintcache",
	".prettiercache",
	"thumbs.db",
	"ehthumbs.db",
	"desktop.ini",
	"dump.rdb",
	"docker-compose.override.yml",
	"docker-compose.override.yaml",
	"compose.override.yml",
	"compose.override.yaml",
	"local.settings.json",
]);

/** `.env` variants we still allow (templates / examples). */
export const ALLOWLIST_ENV_BASENAMES = new Set([
	".env.example",
	".env.sample",
	".env.template",
]);
