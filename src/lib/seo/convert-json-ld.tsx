const siteName = "Codebase to Doc";

const description =
  "Upload a zipped project folder and download documentation built from your source code. Export as Markdown, PDF, Word, or plain text—free, with smart filtering of dependencies and tooling noise.";

function baseUrl(): string {
  const raw = process.env.BETTER_AUTH_URL;
  if (typeof raw === "string" && raw.length > 0) {
    return raw.endsWith("/") ? raw.slice(0, -1) : raw;
  }
  return "http://localhost:3000";
}

export function ConvertPageJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: siteName,
    description,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Upload project as .zip",
      "Export documentation as Markdown, PDF, DOCX, or plain text",
      "Skips node_modules, build artifacts, and editor metadata",
    ],
    url: `${baseUrl()}/convert`,
  };

  return (
    <script
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
      type="application/ld+json"
    />
  );
}
