"use client";

import { GitHubIcon, UserButton } from "@daveyplate/better-auth-ui";
import { ArrowRight, FileCode2, Moon, Sun, Upload } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { GITHUB_REPO_URL } from "~/components/github-repo-link";
import { routes } from "~/lib/routes";
import { cn } from "~/lib/utils";
import { authClient } from "~/server/better-auth/client";

const steps = [
  {
    title: "Zip your project",
    body: "Export the folder as a .zip—no need to delete anything first.",
  },
  {
    title: "We filter the noise",
    body: "Skips node_modules, build output, large binaries, and similar clutter.",
  },
  {
    title: "Download one document",
    body: "Get PDF, Word, Markdown, or plain text—ready to read or submit.",
  },
] as const;

const benefits = [
  "Keeps folder structure and filenames",
  "Syntax-highlighted code in the export",
  "Multiple output formats in one flow",
] as const;

const shellBtn =
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg px-6 font-medium text-sm transition-colors";

export default function HomePage() {
  const [isDark, setIsDark] = useState(false);
  const { data: session } = authClient.useSession();

  useEffect(() => {
    const dark =
      localStorage.theme === "dark" ||
      (!("theme" in localStorage) &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.theme = next ? "dark" : "light";
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground antialiased">
      <header className="sticky top-0 z-50 border-border/40 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link
            className="flex items-center gap-2 font-semibold text-foreground"
            href={routes.home}
          >
            <FileCode2 aria-hidden className="h-6 w-6 text-primary" />
            CodebaseToDoc
          </Link>
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            <button
              aria-label={
                isDark ? "Switch to light theme" : "Switch to dark theme"
              }
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              onClick={toggleTheme}
              type="button"
            >
              {isDark ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
            {session ? (
              <div className="hidden items-center justify-center sm:flex">
                <UserButton size="icon" />
              </div>
            ) : (
              <Link
                className="hidden text-muted-foreground text-sm hover:text-foreground sm:inline"
                href={routes.auth.signIn}
              >
                Sign in
              </Link>
            )}
            <Link
              className={cn(
                shellBtn,
                "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
              href={routes.convert}
            >
              Convert
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 pt-16 pb-12 text-center md:pt-24 md:pb-16">
          <p className="mb-4 text-muted-foreground text-sm">
            Zip in → filtered source → one export file
          </p>
          <h1 className="text-balance font-bold text-4xl tracking-tight md:text-5xl">
            Turn a codebase into{" "}
            <span className="text-primary">a single document</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-balance text-lg text-muted-foreground leading-relaxed">
            Upload a project archive. The app keeps real source files and drops
            dependencies and junk so you get a readable PDF, Word doc, or
            Markdown—fast.
          </p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:justify-center">
            <Link
              className={cn(
                shellBtn,
                "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
              href={routes.convert}
            >
              <Upload aria-hidden className="h-5 w-5" />
              Start with a .zip
            </Link>
            <a
              className={cn(
                shellBtn,
                "border border-border bg-background hover:bg-muted"
              )}
              href={GITHUB_REPO_URL}
              rel="noopener noreferrer"
              target="_blank"
            >
              <GitHubIcon className="h-5 w-5" />
              Source on GitHub
            </a>
          </div>
        </section>

        <section className="border-border/50 border-y bg-muted/30">
          <div className="mx-auto max-w-5xl px-4 py-14">
            <h2 className="mb-8 text-center font-semibold text-foreground">
              How it works
            </h2>
            <ol className="grid gap-8 md:grid-cols-3 md:gap-6">
              {steps.map((step, i) => (
                <li className="text-center md:text-left" key={step.title}>
                  <div className="mb-3 flex justify-center md:justify-start">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 font-semibold text-primary text-sm">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-muted-foreground text-sm leading-relaxed">
                    {step.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-14">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-semibold text-foreground text-xl md:text-2xl">
              Built for sharing and submissions
            </h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              When you need one file that represents the whole repo—coursework,
              reviews, or handoffs—avoid pasting code by hand.
            </p>
            <ul className="mt-8 flex flex-col items-center justify-center gap-3">
              {benefits.map((line) => (
                <li className="flex gap-3 text-foreground text-sm" key={line}>
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-20">
          <div className="rounded-2xl bg-primary px-6 py-10 text-center text-primary-foreground md:px-12 md:py-12">
            <h2 className="font-semibold text-2xl md:text-3xl">
              Ready to generate a document?
            </h2>
            <p className="mx-auto mt-2 max-w-md text-primary-foreground/85 text-sm md:text-base">
              Sign in is required to export. After that, upload and pick your
              format on the convert page.
            </p>
            <Link
              className={cn(
                shellBtn,
                "mt-6 bg-background text-foreground hover:bg-background/90"
              )}
              href={routes.convert}
            >
              Go to convert
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-border/40 border-t py-8 text-center text-muted-foreground text-sm">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 md:flex-row md:justify-between">
          <span className="flex items-center gap-2 font-medium text-foreground">
            <FileCode2 aria-hidden className="h-4 w-4 text-primary" />
            CodebaseToDoc
          </span>
          <p>
            <a
              className="underline underline-offset-4 hover:text-foreground"
              href={GITHUB_REPO_URL}
              rel="noopener noreferrer"
              target="_blank"
            >
              GitHub
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
