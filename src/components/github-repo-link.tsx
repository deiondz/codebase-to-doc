"use client";

import { IconBrandGithub } from "@tabler/icons-react";
import Link from "next/link";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";

export const GITHUB_REPO_URL = "https://github.com/deiondz/codebase-to-doc";

export function GitHubRepoLink({ className }: { className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          aria-label="Codebase to Doc on GitHub"
          className={cn(
            "inline-flex size-9 items-center justify-center rounded-md border border-border/60 bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            className
          )}
          href={GITHUB_REPO_URL}
          rel="noopener noreferrer"
          target="_blank"
        >
          <IconBrandGithub aria-hidden className="size-5" />
        </Link>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        Contribute to the project on GitHub
      </TooltipContent>
    </Tooltip>
  );
}
