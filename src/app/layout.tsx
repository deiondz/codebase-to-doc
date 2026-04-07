import "~/styles/globals.css";
import type { Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import { TooltipProvider } from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";
import { Providers } from "./providers";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const siteName = "Codebase to Doc";

const defaultDescription =
  "Turn a zipped software project into readable documentation. Upload your repo archive and download Markdown, PDF, Word, or plain text—generated from your source files, with clutter like node_modules and tooling folders filtered out.";

const metadataBaseUrl =
  typeof process.env.BETTER_AUTH_URL === "string" &&
  process.env.BETTER_AUTH_URL.length > 0
    ? process.env.BETTER_AUTH_URL
    : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(metadataBaseUrl),
  title: {
    default: `${siteName} — Documentation from your codebase`,
    template: `%s · ${siteName}`,
  },
  description: defaultDescription,
  keywords: [
    "codebase documentation",
    "source code to docs",
    "repo documentation generator",
    "markdown from code",
    "project zip to PDF",
    "technical documentation export",
    "developer docs from repository",
  ],
  applicationName: siteName,
  authors: [{ name: "Blastbenchers" }],
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName,
    title: `${siteName} — Documentation from your codebase`,
    description: defaultDescription,
    images: [
      {
        url: "/image.png",
        width: 480,
        height: 360,
        alt: "Codebase to Doc — turn your project into documentation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} — Documentation from your codebase`,
    description: defaultDescription,
    images: ["/image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      className={cn(geist.variable, "font-mono", jetbrainsMono.variable)}
      lang="en"
    >
      <body className="flex min-h-screen flex-col">
        <div className="relative flex flex-1 flex-col">
          <Providers>
            <TooltipProvider>{children}</TooltipProvider>
          </Providers>
          <div className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] bg-background" />
        </div>
      </body>
    </html>
  );
}
