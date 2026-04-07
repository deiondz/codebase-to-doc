"use client";

import { UserButton } from "@daveyplate/better-auth-ui";
import { IconChevronDown } from "@tabler/icons-react";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

import { GitHubRepoLink } from "~/components/github-repo-link";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { Label } from "~/components/ui/label";
import { Progress } from "~/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import type { DocOutputFormat } from "~/lib/codebase-to-doc/types";
import {
  useCodebaseExport,
  useCodebaseExportProgress,
} from "~/lib/codebase-to-doc/use-codebase-export";
import MaxWidthContainer from "~/lib/ui-utills";
import { cn } from "~/lib/utils";
import { GeneratedFilesStatsCard } from "./generated-files-stats-card";

export default function ConvertPage() {
  const zipInputRef = useRef<HTMLInputElement>(null);

  const [format, setFormat] = useState<DocOutputFormat>("markdown");
  const [zipFile, setZipFile] = useState<File | null>(null);

  const { data: progress } = useCodebaseExportProgress();
  const { mutation, reset } = useCodebaseExport();

  const onZipChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      setZipFile(f ?? null);
      reset();
    },
    [reset]
  );

  const handleGenerate = () => {
    if (!zipFile) {
      toast.error("Choose a .zip file first.");
      return;
    }

    const fd = new FormData();
    fd.append("format", format);
    fd.append("zip", zipFile);
    mutation.mutate(fd);
  };

  const canGenerate = zipFile !== null;

  const progressPct =
    progress && progress.total > 0
      ? Math.min(100, Math.round((progress.current / progress.total) * 100))
      : 0;

  const progressLabel = (() => {
    if (!progress) {
      return null;
    }
    if (progress.message) {
      return progress.message;
    }
    let label = "Build";
    if (progress.phase === "zip") {
      label = "Zip";
    }
    const tail = progress.path ? ` — ${progress.path}` : "";
    return `${label}: ${progress.current}/${progress.total}${tail}`;
  })();

  let errorMessage: string | null = null;
  if (mutation.isError) {
    errorMessage =
      mutation.error instanceof Error
        ? mutation.error.message
        : "Could not build the document.";
  }

  const lastResult = mutation.isSuccess ? mutation.data : null;

  return (
    <MaxWidthContainer className="pt-10 pb-6 sm:pt-14 sm:pb-8">
      <div className="mb-6 flex w-full min-w-0 flex-wrap items-center justify-between gap-3 sm:mb-8">
        <UserButton />
        <GitHubRepoLink className="shrink-0" />
      </div>
      <div className="mb-6 flex min-w-0 flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-semibold text-xl tracking-tight sm:text-2xl">
            Codebase to document
          </h1>
          <p className="mt-1 text-pretty text-muted-foreground text-sm sm:text-base">
            Upload a .zip of your project and receive a document in your desired
            format. This tool is free to use and will always be free.
          </p>
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-6 lg:flex-row lg:items-start">
        <div className="w-full min-w-0 flex-1">
          <Card>
            <CardHeader>
              <CardTitle>Export</CardTitle>
              <CardDescription>
                Keeps core project sources; skips editor/AI tooling (e.g.{" "}
                <code className="text-[0.95em]">.cursor</code>,{" "}
                <code className="text-[0.95em]">.vscode</code>,{" "}
                <code className="text-[0.95em]">SKILL.md</code>, agent docs),
                plus <code className="text-[0.95em]">node_modules</code>,{" "}
                <code className="text-[0.95em]">.git</code> / git metadata,{" "}
                <code className="text-[0.95em]">package.json</code> and other
                manifests, build outputs, lockfiles, env files (templates like{" "}
                <code className="text-[0.95em]">.env.example</code> stay), and
                large or binary files.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <Label htmlFor="zip-input">Zip archive</Label>
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <Button
                    className="shrink-0"
                    onClick={() => zipInputRef.current?.click()}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Choose .zip
                  </Button>
                  <input
                    accept=".zip,application/zip"
                    className="sr-only"
                    id="zip-input"
                    onChange={onZipChange}
                    ref={zipInputRef}
                    type="file"
                  />
                  <span className="wrap-break-word min-w-0 max-w-full flex-1 text-muted-foreground text-sm sm:text-base">
                    {zipFile?.name ?? "No file selected"}
                  </span>
                </div>
                <Collapsible className="rounded-lg border border-border/60 bg-muted/20">
                  <CollapsibleTrigger
                    className={cn(
                      "group flex w-full min-w-0 items-start justify-between gap-2 px-3 py-2.5 text-left text-sm sm:items-center",
                      "text-foreground hover:bg-muted/40",
                      "data-[state=open]:rounded-t-lg data-[state=open]:border-border/60 data-[state=open]:border-b"
                    )}
                    type="button"
                  >
                    <span className="min-w-0 flex-1 font-medium leading-snug">
                      Don&apos;t have a .zip? Zip your project folder first
                    </span>
                    <IconChevronDown
                      aria-hidden
                      className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180"
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="border-border/60 border-t px-3 py-3 text-muted-foreground text-sm leading-relaxed">
                    <p className="mb-3">
                      This tool needs a single{" "}
                      <strong className="text-foreground">.zip</strong> of your
                      project root (the folder that has your source files).
                      Create one on your computer, then use{" "}
                      <strong className="text-foreground">Choose .zip</strong>{" "}
                      above.
                    </p>
                    <p className="mb-2 font-medium text-foreground">Windows</p>
                    <figure className="mb-4 overflow-hidden rounded-md border border-border/80 bg-muted/30">
                      <Image
                        alt="Windows 11 File Explorer: right-click menu with Compress to expanded, ZIP File selected"
                        className="h-auto max-h-[min(22rem,55vh)] w-full object-contain object-top-left"
                        height={420}
                        sizes="(max-width: 640px) 100vw, min(42rem, 90vw)"
                        src="/zip.png"
                        width={780}
                      />
                      <figcaption className="border-border/80 border-t px-3 py-2 text-muted-foreground text-xs leading-snug">
                        <span className="text-foreground">Windows 11:</span>{" "}
                        open{" "}
                        <strong className="text-foreground">
                          Compress to…
                        </strong>
                        , then choose{" "}
                        <strong className="text-foreground">ZIP File</strong>{" "}
                        (as in the screenshot).
                      </figcaption>
                    </figure>
                    <ol className="mb-4 list-decimal space-y-1.5 pl-5">
                      <li>
                        Open File Explorer and go to the folder that contains
                        your project.
                      </li>
                      <li>
                        Right-click the project folder (not a file inside it).
                      </li>
                      <li>
                        <strong className="text-foreground">Windows 11:</strong>{" "}
                        point to{" "}
                        <strong className="text-foreground">
                          Compress to…
                        </strong>
                        , then click{" "}
                        <strong className="text-foreground">ZIP File</strong>.{" "}
                        <strong className="text-foreground">Windows 10:</strong>{" "}
                        choose{" "}
                        <strong className="text-foreground">Send to</strong> →{" "}
                        <strong className="text-foreground">
                          Compressed (zipped) folder
                        </strong>
                        .
                      </li>
                      <li>
                        A new <code className="text-[0.9em]">.zip</code> appears
                        next to the folder. Upload that file here.
                      </li>
                    </ol>
                    <p className="mb-2 font-medium text-foreground">macOS</p>
                    <ol className="list-decimal space-y-1.5 pl-5">
                      <li>In Finder, right-click your project folder.</li>
                      <li>
                        Choose{" "}
                        <strong className="text-foreground">
                          Compress &quot;FolderName&quot;
                        </strong>
                        .
                      </li>
                      <li>
                        Upload the resulting{" "}
                        <code className="text-[0.9em]">.zip</code>.
                      </li>
                    </ol>
                  </CollapsibleContent>
                </Collapsible>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Output format</Label>
                <RadioGroup
                  className="grid gap-2 sm:grid-cols-2"
                  onValueChange={(v) => {
                    setFormat(v as DocOutputFormat);
                    reset();
                  }}
                  value={format}
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem id="fmt-md" value="markdown" />
                    <Label className="font-normal" htmlFor="fmt-md">
                      Markdown (.md)
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem id="fmt-txt" value="plaintext" />
                    <Label className="font-normal" htmlFor="fmt-txt">
                      Plain text (.txt)
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem id="fmt-docx" value="docx" />
                    <Label className="font-normal" htmlFor="fmt-docx">
                      Word (.docx)
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem id="fmt-pdf" value="pdf" />
                    <Label className="font-normal" htmlFor="fmt-pdf">
                      PDF (.pdf)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {mutation.isPending && progress ? (
                <div className="flex flex-col gap-2">
                  <Progress value={progressPct} />
                  <p className="break-all text-muted-foreground text-xs">
                    {progressLabel}
                  </p>
                </div>
              ) : null}

              {errorMessage ? (
                <p className="text-destructive text-xs" role="alert">
                  {errorMessage}
                </p>
              ) : null}

              {lastResult ? (
                <p className="text-muted-foreground text-xs">
                  Last download: {lastResult.included} file(s) included
                  {lastResult.skipped > 0
                    ? `, ${lastResult.skipped} skipped (see top of the file for the list)`
                    : ""}
                  .
                </p>
              ) : null}
            </CardContent>
            <CardFooter className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-end">
              <Button
                className="w-full sm:w-auto"
                disabled={!canGenerate || mutation.isPending}
                onClick={handleGenerate}
                type="button"
              >
                {mutation.isPending ? "Working…" : "Generate and download"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
      <div className="flex w-full min-w-0 flex-col items-stretch gap-6 pt-10 sm:items-center lg:flex-row lg:items-start lg:justify-center">
        <div className="w-full min-w-0 sm:max-w-md lg:max-w-sm lg:shrink-0">
          <GeneratedFilesStatsCard />
        </div>
        <figure className="flex w-full min-w-0 max-w-md flex-col items-center gap-3 self-center text-center sm:mt-0 lg:mt-0">
          <Image
            alt="Codebase to Doc illustration — export your repository as documentation"
            className="mx-auto h-auto max-h-40 w-full max-w-full rounded-xl object-contain sm:max-h-48"
            height={360}
            sizes="(max-width: 640px) 100vw, 28rem"
            src="/image.png"
            width={480}
          />
          <figcaption className="mt-2 text-muted-foreground text-sm italic">
            Made with ❤️ by <span className="font-bold">Blastbenchers</span>
          </figcaption>
        </figure>
      </div>
    </MaxWidthContainer>
  );
}
