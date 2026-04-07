"use client";

import { UserButton } from "@daveyplate/better-auth-ui";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Progress } from "~/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import type { DocOutputFormat } from "~/lib/codebase-to-doc/types";
import {
  useCodebaseExport,
  useCodebaseExportProgress,
} from "~/lib/codebase-to-doc/use-codebase-export";
import MaxWidthContainer from "~/lib/ui-utills";

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
    <MaxWidthContainer className="py-14">
      <div className="mb-8 flex w-full flex-wrap items-center justify-between gap-4">
        <UserButton />
      </div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">
            Codebase to document
          </h1>
          <p className="mt-1 text-muted-foreground">
            Upload a .zip of your project. Export runs on the server; progress
            streams back while files are read and the document is built.
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href="/">Back home</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Export</CardTitle>
          <CardDescription>
            Keeps core project sources; skips editor/AI tooling (e.g.{" "}
            <code className="text-[0.95em]">.cursor</code>,{" "}
            <code className="text-[0.95em]">.vscode</code>,{" "}
            <code className="text-[0.95em]">SKILL.md</code>, agent docs), plus{" "}
            <code className="text-[0.95em]">node_modules</code>,{" "}
            <code className="text-[0.95em]">.git</code> / git metadata,{" "}
            <code className="text-[0.95em]">package.json</code> and other
            manifests, build outputs, lockfiles, env files (templates like{" "}
            <code className="text-[0.95em]">.env.example</code> stay), and large
            or binary files.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="zip-input">Zip archive</Label>
            <div className="flex flex-wrap items-center gap-2">
              <Button
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
              <span className="text-muted-foreground">
                {zipFile?.name ?? "No file selected"}
              </span>
            </div>
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
        <CardFooter className="border-t pt-4">
          <Button
            disabled={!canGenerate || mutation.isPending}
            onClick={handleGenerate}
            type="button"
          >
            {mutation.isPending ? "Working…" : "Generate and download"}
          </Button>
        </CardFooter>
      </Card>

      <figure className="mt-6 flex flex-col items-center gap-3 text-center">
        <Image
          alt=""
          className="mx-auto max-h-48 max-w-full rounded-xl object-contain"
          height={360}
          src="/image.png"
          width={480}
        />
        <figcaption className="mt-2 text-muted-foreground text-sm italic">
          Made with ❤️ by <span className="font-bold">Blastbenchers</span>
        </figcaption>
      </figure>
    </MaxWidthContainer>
  );
}
