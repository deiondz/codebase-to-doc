"use client";

import { UserButton } from "@daveyplate/better-auth-ui";
import { unzipSync, zipSync } from "fflate";
import {
  ChevronDown,
  FileArchive,
  File as FileIcon,
  FileText,
  Upload,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

import { GeneratedFilesStatsCard } from "~/app/convert/generated-files-stats-card";
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
import { cn } from "~/lib/utils";

const outputFormats: Array<{
  id: DocOutputFormat;
  label: string;
  icon: typeof FileText;
}> = [
  { id: "markdown", label: "Markdown", icon: FileText },
  { id: "plaintext", label: "Plain Text", icon: FileText },
  { id: "docx", label: "Word", icon: FileText },
  { id: "pdf", label: "PDF", icon: FileIcon },
];

const MEDIA_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".svg",
  ".bmp",
  ".ico",
  ".avif",
  ".mp4",
  ".mov",
  ".avi",
  ".mkv",
  ".webm",
  ".wmv",
  ".flv",
  ".m4v",
  ".3gp",
  ".mpeg",
  ".mpg",
]);

const MEDIA_DIR_NAMES = new Set([
  "image",
  "images",
  "img",
  "imgs",
  "video",
  "videos",
]);

interface PreparedZip {
  file: File;
  removedCount: number;
}

function shouldSkipMediaPath(rawPath: string): boolean {
  const normalized = rawPath.replaceAll("\\", "/").toLowerCase();
  const segments = normalized.split("/").filter(Boolean);
  if (segments.some((segment) => MEDIA_DIR_NAMES.has(segment))) {
    return true;
  }

  const lastSegment = segments.at(-1) ?? "";
  const dot = lastSegment.lastIndexOf(".");
  const ext = dot >= 0 ? lastSegment.slice(dot) : "";
  return MEDIA_EXTENSIONS.has(ext);
}

function toCodeOnlyZipFileName(name: string): string {
  if (name.toLowerCase().endsWith(".zip")) {
    return `${name.slice(0, -4)}-code-only.zip`;
  }
  return `${name}-code-only.zip`;
}

async function buildCodeOnlyZip(file: File): Promise<PreparedZip> {
  const zipBytes = new Uint8Array(await file.arrayBuffer());
  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipSync(zipBytes);
  } catch {
    return { file, removedCount: 0 };
  }

  const nextEntries: Record<string, Uint8Array> = {};
  let removedCount = 0;

  for (const [path, bytes] of Object.entries(entries)) {
    if (path.endsWith("/")) {
      continue;
    }
    if (shouldSkipMediaPath(path)) {
      removedCount += 1;
      continue;
    }
    nextEntries[path] = bytes;
  }

  if (removedCount === 0) {
    return { file, removedCount: 0 };
  }

  const rebuilt = zipSync(nextEntries, { level: 6 });
  const rebuiltData = new Uint8Array(rebuilt);
  const rebuiltFile = new File([rebuiltData.buffer], toCodeOnlyZipFileName(file.name), {
    type: "application/zip",
    lastModified: Date.now(),
  });
  return { file: rebuiltFile, removedCount };
}

function getProgressLabel(progress: {
  phase: string;
  current: number;
  total: number;
  path?: string;
  message?: string;
}) {
  if (progress.message) {
    return progress.message;
  }

  const label = progress.phase === "zip" ? "Zip" : "Build";
  const tail = progress.path ? ` - ${progress.path}` : "";
  return `${label}: ${progress.current}/${progress.total}${tail}`;
}

export default function ConvertPage() {
  const zipInputRef = useRef<HTMLInputElement>(null);
  const [format, setFormat] = useState<DocOutputFormat>("markdown");
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [isPreparingZip, setIsPreparingZip] = useState(false);
  const [isZipHelpOpen, setIsZipHelpOpen] = useState(false);

  const { mutation, reset } = useCodebaseExport();
  const { data: progress } = useCodebaseExportProgress();

  const onZipChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null;
      setZipFile(file);
      reset();
    },
    [reset]
  );

  const handleGenerate = useCallback(async () => {
    if (!zipFile) {
      toast.error("Choose a .zip file first.");
      return;
    }

    setIsPreparingZip(true);
    let uploadZip = zipFile;
    try {
      const prepared = await buildCodeOnlyZip(zipFile);
      uploadZip = prepared.file;
      if (prepared.removedCount > 0) {
        toast.message(
          `Removed ${prepared.removedCount} image/video file(s) before upload.`
        );
      }
    } catch {
      toast.error("Could not pre-process zip. Uploading original archive.");
    } finally {
      setIsPreparingZip(false);
    }

    const fd = new FormData();
    fd.append("format", format);
    fd.append("zip", uploadZip);
    mutation.mutate(fd);
  }, [format, mutation, zipFile]);

  const progressPct =
    progress && progress.total > 0
      ? Math.min(100, Math.round((progress.current / progress.total) * 100))
      : 0;

  const progressLabel = progress ? getProgressLabel(progress) : null;
  const canGenerate = Boolean(zipFile) && !isPreparingZip;
  let ctaLabel = "Generate & Download";
  if (isPreparingZip) {
    ctaLabel = "Preparing code-only archive...";
  } else if (mutation.isPending) {
    ctaLabel = "Generating Document...";
  }
  const errorMessage =
    mutation.error instanceof Error ? mutation.error.message : null;
  const lastResult = mutation.isSuccess ? mutation.data : null;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-10 pb-12 sm:pt-14 md:px-8">
      <div className="mb-10 flex w-full flex-wrap items-center justify-between gap-4">
        <UserButton size="icon" />
        <GitHubRepoLink className="shrink-0" />
      </div>

      <div className="mb-10 max-w-2xl">
        <h1 className="font-bold text-3xl tracking-tight sm:text-4xl">
          Codebase to Document
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Upload a .zip of your project and instantly convert it into a clean,
          AI-ready document. Free to use, forever.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
        <div className="flex flex-col gap-6 lg:col-span-8">
          <Card>
            <CardHeader className="border-b bg-muted/20 pb-6">
              <CardTitle className="text-xl">Export Configuration</CardTitle>
              <CardDescription className="mt-2 text-sm">
                We automatically clean your codebase by skipping unnecessary
                files (like <code className="text-xs">node_modules</code>,{" "}
                <code className="text-xs">.git</code>, lockfiles, and binaries)
                to ensure a high-quality output.
              </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col gap-8 pt-8">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 font-bold text-primary text-xs">
                    1
                  </span>
                  <Label className="font-semibold text-base">
                    Upload Project Archive
                  </Label>
                </div>

                <button
                  aria-label="Select zip file"
                  className={cn(
                    "group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all hover:bg-muted/50",
                    zipFile
                      ? "border-primary bg-primary/5 hover:bg-primary/10"
                      : "border-muted-foreground/25"
                  )}
                  onClick={() => zipInputRef.current?.click()}
                  type="button"
                >
                  <input
                    accept=".zip,application/zip"
                    className="sr-only"
                    id="zip-input"
                    onChange={onZipChange}
                    ref={zipInputRef}
                    type="file"
                  />

                  {zipFile ? (
                    <>
                      <div className="mb-3 rounded-full bg-primary/20 p-3 text-primary">
                        <FileArchive size={32} />
                      </div>
                      <h3 className="font-semibold text-foreground">
                        {zipFile.name}
                      </h3>
                      <p className="mt-1 text-muted-foreground text-sm">
                        Click to change file
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="mb-3 rounded-full bg-muted p-3 text-muted-foreground transition-colors group-hover:bg-primary/20 group-hover:text-primary">
                        <Upload size={32} />
                      </div>
                      <h3 className="font-semibold text-foreground">
                        Select a .zip file
                      </h3>
                      <p className="mt-1 text-muted-foreground text-sm">
                        Browse your computer for your project archive
                      </p>
                    </>
                  )}
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 font-bold text-primary text-xs">
                    2
                  </span>
                  <Label className="font-semibold text-base">
                    Output Format
                  </Label>
                </div>

                <RadioGroup
                  className="grid grid-cols-2 gap-3 sm:grid-cols-4"
                  onValueChange={(value) => {
                    setFormat(value as DocOutputFormat);
                    reset();
                  }}
                  value={format}
                >
                  {outputFormats.map((fmt) => (
                    <Label
                      className={cn(
                        "flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-all hover:bg-muted/50",
                        format === fmt.id
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-muted bg-transparent text-muted-foreground"
                      )}
                      htmlFor={`fmt-${fmt.id}`}
                      key={fmt.id}
                    >
                      <RadioGroupItem
                        className="sr-only"
                        id={`fmt-${fmt.id}`}
                        value={fmt.id}
                      />
                      <fmt.icon
                        className={
                          format === fmt.id
                            ? "text-primary"
                            : "text-muted-foreground"
                        }
                        size={24}
                      />
                      <span className="font-medium text-sm">{fmt.label}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              <div className="flex flex-col gap-2 empty:hidden">
                {mutation.isPending && progress && (
                  <div className="fade-in slide-in-from-bottom-2 flex animate-in flex-col gap-2 rounded-lg bg-muted/50 p-4">
                    <div className="flex justify-between font-medium text-sm">
                      <span className="truncate pr-4 text-muted-foreground">
                        {progressLabel}
                      </span>
                      <span>{progressPct}%</span>
                    </div>
                    <Progress className="h-2 w-full" value={progressPct} />
                  </div>
                )}

                {errorMessage && (
                  <p
                    className="rounded-lg bg-destructive/10 p-3 text-destructive text-sm"
                    role="alert"
                  >
                    {errorMessage}
                  </p>
                )}

                {lastResult && (
                  <p className="rounded-lg bg-green-500/10 p-3 text-green-700 text-sm dark:text-green-400">
                    <strong>Success!</strong> {lastResult.included} file(s)
                    included
                    {lastResult.skipped > 0
                      ? ` (${lastResult.skipped} skipped).`
                      : "."}
                  </p>
                )}
              </div>
            </CardContent>

            <CardFooter className="border-t bg-muted/20 px-6 py-4">
              <Button
                className="w-full sm:ml-auto sm:w-auto"
                disabled={!canGenerate || mutation.isPending || isPreparingZip}
                onClick={handleGenerate}
                type="button"
              >
                {ctaLabel}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-4">
          <GeneratedFilesStatsCard />

          <Collapsible
            className="rounded-xl border bg-card"
            onOpenChange={setIsZipHelpOpen}
            open={isZipHelpOpen}
          >
            <CollapsibleTrigger
              className={cn(
                "group flex w-full items-center justify-between gap-2 px-5 py-4 text-left font-semibold text-foreground transition-colors hover:bg-muted/50",
                isZipHelpOpen && "border-b bg-muted/20"
              )}
            >
              Don't have a .zip?
              <ChevronDown
                className={cn(
                  "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200",
                  isZipHelpOpen && "rotate-180"
                )}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="px-5 py-4 text-muted-foreground text-sm leading-relaxed">
              <p className="mb-4">
                You need a single{" "}
                <strong className="text-foreground">.zip</strong> of your
                project's root folder.
              </p>

              <div className="space-y-4">
                <div>
                  <h4 className="mb-1 font-semibold text-foreground">
                    Windows
                  </h4>
                  <ul className="list-disc space-y-1 pl-4">
                    <li>Right-click your project folder.</li>
                    <li>
                      Select{" "}
                      <strong className="text-foreground">
                        Compress to...
                      </strong>{" "}
                      -&gt;{" "}
                      <strong className="text-foreground">ZIP File</strong>.
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="mb-1 font-semibold text-foreground">macOS</h4>
                  <ul className="list-disc space-y-1 pl-4">
                    <li>Right-click your project folder in Finder.</li>
                    <li>
                      Select{" "}
                      <strong className="text-foreground">
                        Compress "Folder Name"
                      </strong>
                      .
                    </li>
                  </ul>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <figure className="mt-4 flex w-full flex-col items-center text-center opacity-90 transition-opacity hover:opacity-100">
            <img
              alt="Illustration representing codebase documentation"
              className="h-auto w-full rounded-2xl object-contain"
              height={240}
              src="./image.png"
              width={320}
            />
            <figcaption className="mt-4 font-medium text-muted-foreground text-xs tracking-wide">
              MADE WITH ❤️ BY{" "}
              <span className="font-bold text-foreground">BLASTBENCHERS</span>
            </figcaption>
          </figure>
        </div>
      </div>
    </div>
  );
}
