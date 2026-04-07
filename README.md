# Codebase to Doc

Open-source web app that turns a **zipped project folder** into a **single downloadable document**—Markdown, plain text, Word (`.docx`), or PDF. It focuses on real source files and skips common noise (dependencies, build output, editor tooling, large binaries, and similar) so the result is easier to read and share.

Sign-in is required to generate exports. Authentication is powered by [Better Auth](https://www.better-auth.com/) with email verification and optional Google OAuth.

## Features

- **Upload a `.zip`** of your repository or project root and pick an output format.
- **Progress feedback** during processing (server-sent events).
- **Sensible filtering** so generated docs emphasize source code, not `node_modules`, `.git`, lockfiles, env files, or bulky binaries.
- **Stats** on generated files for transparency (see the convert UI).

## Tech stack

| Area | Choice |
|------|--------|
| Framework | [Next.js](https://nextjs.org/) (App Router) |
| UI | React, [Tailwind CSS](https://tailwindcss.com/), [Radix](https://www.radix-ui.com/)-based components |
| Auth | [Better Auth](https://www.better-auth.com/) + [MongoDB](https://www.mongodb.com/) adapter |
| Data | MongoDB |
| Validation / env | [Zod](https://zod.dev/), [@t3-oss/env-nextjs](https://env.t3.gg/) |
| Package manager | [Bun](https://bun.sh) (`bun.lock`) |
| Document output | e.g. `docx`, `pdfkit`, `fflate` for zip handling |

Scaffold history: bootstrapped from [create-t3-app](https://create.t3.gg/) (this repo has evolved beyond the default template).

## Prerequisites

- **[Bun](https://bun.sh)** (see `packageManager` in [`package.json`](package.json); lockfile: `bun.lock`)
- **MongoDB** reachable from the app (local or hosted)

## Getting started

1. **Clone the repository**

   ```bash
   git clone <your-fork-or-upstream-url>
   cd codebase-to-doc
   ```

2. **Install dependencies**

   ```bash
   bun install
   ```

3. **Environment variables**

   Copy `.env.example` to `.env` and fill in values. The canonical schema lives in [`src/env.js`](src/env.js). At minimum you typically need:

   | Variable | Purpose |
   |----------|---------|
   | `MONGODB_URI` | MongoDB connection string (include database name in the path or use `MONGODB_DB_NAME`) |
   | `ZEPTOMAIL_API_KEY` | Transactional email (verification, password reset) via [ZeptoMail](https://www.zoho.com/zeptomail/) |
   | `BETTER_AUTH_SECRET` | Secret for signing sessions (required in production) |
   | `BETTER_AUTH_URL` | Public site URL, e.g. `http://localhost:3000` in dev, `https://your-domain.com` in production (required in production) |

   Optional:

   | Variable | Purpose |
   |----------|---------|
   | `BETTER_AUTH_GOOGLE_CLIENT_ID` / `BETTER_AUTH_GOOGLE_CLIENT_SECRET` | Enable **Sign in with Google** when both are set |

   For builds where validating every variable is awkward (e.g. some Docker flows), you can set `SKIP_ENV_VALIDATION`—see [`src/env.js`](src/env.js).

4. **Run the dev server**

   ```bash
   bun run dev
   ```

   Open [http://localhost:3000](http://localhost:3000), sign up or sign in, then open **Codebase to document** (`/convert`) to upload a zip and download the generated file.

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Development server (Turbopack) |
| `bun run build` | Production build |
| `bun run start` | Start production server |
| `bun run preview` | Build then start locally |
| `bun run typecheck` | TypeScript (`tsc --noEmit`) |
| `bun run check` | [Biome](https://biomejs.dev/) lint/format (project rules) |

## Project layout (high level)

- `src/app/` — App Router pages and API routes (`/api/codebase-to-doc`, auth UI, etc.)
- `src/lib/codebase-to-doc/` — Client hooks and shared types for exports
- `src/server/codebase-to-doc/` — Server-side zip → document pipeline
- `src/server/better-auth/` — Auth configuration

## Contributing

Contributions are welcome.

1. Open an issue first if you plan a large change, so we can align on direction.
2. Fork the repo, create a branch, and keep commits focused.
3. Run **`bun run typecheck`** and **`bun run check`** before opening a pull request.
4. Describe **what** changed and **why** in the PR (user-visible behavior, env changes, or breaking changes).

Please keep secrets and local `.env` files out of commits.

## License

This repository does not yet include a `LICENSE` file in the root. If you maintain a fork, add one (for example MIT or Apache-2.0) so others know how they may use and redistribute the code.

## Credits

Made with care by **Blastbenchers**.
