"use client";

import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { useGeneratedFileStats } from "~/lib/stats/use-generated-file-stats";

export function GeneratedFilesStatsCard() {
  const { data, isLoading, isError } = useGeneratedFileStats();

  let content: ReactNode;
  if (isLoading) {
    content = <Skeleton className="h-11 w-28" />;
  } else if (isError) {
    content = (
      <p className="text-muted-foreground text-sm">Could not load stats.</p>
    );
  } else {
    content = (
      <>
        <p className="font-semibold text-4xl tabular-nums tracking-tight">
          {(data?.totalGeneratedFiles ?? 0).toLocaleString()}
        </p>
        {data?.updatedAt ? (
          <p className="mt-2 text-muted-foreground text-xs">
            Last activity{" "}
            {new Date(data.updatedAt).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        ) : (
          <p className="mt-2 text-muted-foreground text-xs">
            No exports recorded yet.
          </p>
        )}
      </>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Wow, we've made a lot of documents!
        </CardTitle>
        <CardDescription>Total documents generated so far.</CardDescription>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
