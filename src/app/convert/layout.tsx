import type { Metadata } from "next";
import type { ReactNode } from "react";

import { ConvertPageJsonLd } from "~/lib/seo/convert-json-ld";

const siteName = "Codebase to Doc";

const description =
  "Upload a zipped project folder and download documentation built from your source code. Export as Markdown, PDF, Word, or plain text—free, with smart filtering of dependencies and tooling noise.";

export const metadata: Metadata = {
  title: "Convert",
  description,
  keywords: [
    "codebase to documentation",
    "generate docs from source code",
    "repository zip to markdown",
    "export project as PDF documentation",
    "code to Word document",
    "developer documentation generator",
  ],
  alternates: {
    canonical: "/convert",
  },
  openGraph: {
    title: `Convert your codebase · ${siteName}`,
    description,
    url: "/convert",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Convert your codebase · ${siteName}`,
    description,
  },
};

export default function ConvertLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ConvertPageJsonLd />
      {children}
    </>
  );
}
