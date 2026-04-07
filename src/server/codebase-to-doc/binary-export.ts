import { Buffer } from "node:buffer";

import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import PDFDocument from "pdfkit";

import type { SourceChunk } from "~/lib/codebase-to-doc/format";

/**
 * PDF uses only standard 14 fonts (Helvetica, Courier). Embedded fonts hit fontkit bugs on large exports.
 * PDFKit’s WinAnsi encoder walks UTF-16 code units and mis-encodes many Unicode code points (looks like
 * “mojibake” in the PDF). We emit **ASCII + tab/LF/CR only**, with lossy punctuation mapping.
 */
const PDF_CODE_CHUNK_CHARS = 40_000;

/** Long single `text()` runs can stress layout; chunk while preserving wrapping. */
function writePdfCodeBlock(
  doc: InstanceType<typeof PDFDocument>,
  bodyText: string,
  textWidth: number
): void {
  if (bodyText.length <= PDF_CODE_CHUNK_CHARS) {
    doc.text(bodyText, {
      width: textWidth,
      align: "left",
      lineGap: 2,
    });
    return;
  }
  let offset = 0;
  while (offset < bodyText.length) {
    const slice = bodyText.slice(offset, offset + PDF_CODE_CHUNK_CHARS);
    offset += PDF_CODE_CHUNK_CHARS;
    doc.text(slice, {
      width: textWidth,
      align: "left",
      lineGap: 2,
      continued: offset < bodyText.length,
    });
  }
}

/** Avoid lone UTF-16 surrogates and NULs. */
function sanitizePdfText(s: string): string {
  const out: string[] = [];
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    if (code === 0) {
      continue;
    }
    if (code >= 0xd8_00 && code <= 0xdb_ff) {
      const low = i + 1 < s.length ? s.charCodeAt(i + 1) : 0;
      if (low >= 0xdc_00 && low <= 0xdf_ff) {
        out.push(s.slice(i, i + 2));
        i++;
        continue;
      }
      out.push("\uFFFD");
      continue;
    }
    if (code >= 0xdc_00 && code <= 0xdf_ff) {
      out.push("\uFFFD");
      continue;
    }
    out.push(s[i] ?? "");
  }
  return out.join("");
}

function isUnicodeSpaceCodePoint(cp: number): boolean {
  switch (cp) {
    case 0x00_20:
    case 0x00_a0:
    case 0x16_80:
    case 0x20_2f:
    case 0x20_5f:
    case 0x30_00:
    case 0xfe_ff:
      return true;
    default:
      if (cp >= 0x20_00 && cp <= 0x20_0a) {
        return true;
      }
      return false;
  }
}

/** Common non-ASCII punctuation → ASCII (anything else becomes `?`). */
const PDF_LOSSY_ASCII = new Map<number, string>([
  [0x00_ad, ""],
  [0x00_b7, "*"],
  [0x20_10, "-"],
  [0x20_11, "-"],
  [0x20_12, "-"],
  [0x20_13, "-"],
  [0x20_14, "-"],
  [0x20_15, "-"],
  [0x20_18, "'"],
  [0x20_19, "'"],
  [0x20_1a, ","],
  [0x20_1b, "'"],
  [0x20_1c, '"'],
  [0x20_1d, '"'],
  [0x20_1e, '"'],
  [0x20_22, "*"],
  [0x20_23, "*"],
  [0x20_26, "..."],
  [0x20_32, "'"],
  [0x20_33, '"'],
  [0x20_ac, "EUR"],
  [0x21_22, "(tm)"],
  [0x00_a9, "(c)"],
  [0x00_ae, "(R)"],
  [0x21_90, "<-"],
  [0x21_92, "->"],
  [0x21_94, "<->"],
]);

/**
 * Emit only bytes PDFKit’s StandardFont path handles reliably: tab, LF, CR, and ASCII printable.
 * Iterates full code points so UTF-16 surrogates are never split.
 */
function pdfAsciiForStandardFonts(s: string): string {
  const cleaned = sanitizePdfText(s.normalize("NFC"));
  const parts: string[] = [];
  for (let i = 0; i < cleaned.length; ) {
    const cp = cleaned.codePointAt(i) ?? 0;
    i += cp > 0xff_ff ? 2 : 1;

    if (cp === 0) {
      continue;
    }
    if (cp === 9 || cp === 10 || cp === 13) {
      parts.push(String.fromCodePoint(cp));
      continue;
    }
    if (isUnicodeSpaceCodePoint(cp)) {
      parts.push(" ");
      continue;
    }
    if (cp >= 32 && cp <= 126) {
      parts.push(String.fromCodePoint(cp));
      continue;
    }
    const sub = PDF_LOSSY_ASCII.get(cp);
    if (sub !== undefined) {
      parts.push(sub);
      continue;
    }
    parts.push("?");
  }
  return parts.join("");
}

const PDF_PT = {
  title: 17,
  section: 12,
  skippedLine: 10,
  path: 11,
  code: 10.5,
} as const;

/** Strip characters illegal in WordprocessingML text runs. */
function sanitizeDocxText(s: string): string {
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    if (code < 32 && code !== 9 && code !== 10 && code !== 13) {
      continue;
    }
    if (code === 127) {
      continue;
    }
    out += s[i];
  }
  return out;
}

export async function exportCodebaseDocx(
  chunks: SourceChunk[],
  skipped: Array<{ path: string; reason: string }>
): Promise<Buffer> {
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      text: "Codebase export",
      heading: HeadingLevel.TITLE,
    })
  );

  if (skipped.length > 0) {
    children.push(
      new Paragraph({
        text: "Skipped files",
        heading: HeadingLevel.HEADING_1,
      })
    );
    for (const s of skipped) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: sanitizeDocxText(s.path), bold: true }),
            new TextRun({ text: ` — ${sanitizeDocxText(s.reason)}` }),
          ],
        })
      );
    }
  }

  for (const c of chunks) {
    children.push(
      new Paragraph({
        text: sanitizeDocxText(c.path),
        heading: HeadingLevel.HEADING_2,
      })
    );
    for (const line of c.content.split("\n")) {
      const safe = sanitizeDocxText(line);
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: safe.length > 0 ? safe : "\u00a0",
              font: "Consolas",
              size: 20,
            }),
          ],
          spacing: { after: 0, line: 240 },
          indent: { left: 360 },
        })
      );
    }
    children.push(
      new Paragraph({
        text: "",
        spacing: { after: 120 },
        includeIfEmpty: true,
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        children,
      },
    ],
  });

  const buf = await Packer.toBuffer(doc);
  return Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
}

export function exportCodebasePdf(
  chunks: SourceChunk[],
  skipped: Array<{ path: string; reason: string }>
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const parts: Buffer[] = [];
    const doc = new PDFDocument({
      margin: 42,
      autoFirstPage: true,
      size: "LETTER",
    });
    doc.on("data", (chunk: Buffer) => {
      parts.push(chunk);
    });
    doc.on("end", () => {
      resolve(Buffer.concat(parts));
    });
    doc.on("error", reject);

    const page = doc.page;
    const textWidth = page.width - page.margins.left - page.margins.right;

    doc
      .font("Helvetica-Bold")
      .fontSize(PDF_PT.title)
      .fillColor("#111111")
      .text("Codebase export", {
        align: "center",
      });
    doc.moveDown(1.1);

    if (skipped.length > 0) {
      doc
        .font("Helvetica-Bold")
        .fontSize(PDF_PT.section)
        .text("Skipped files", {
          align: "left",
        });
      doc.moveDown(0.35);
      doc.font("Helvetica").fontSize(PDF_PT.skippedLine);
      for (const s of skipped) {
        doc.text(
          `* ${pdfAsciiForStandardFonts(s.path)} - ${pdfAsciiForStandardFonts(s.reason)}`,
          {
            width: textWidth,
            lineGap: 1.5,
          }
        );
      }
      doc.moveDown(0.9);
    }

    for (const c of chunks) {
      const pathText = pdfAsciiForStandardFonts(c.path);
      const bodyText = pdfAsciiForStandardFonts(c.content);
      doc
        .font("Helvetica-Bold")
        .fontSize(PDF_PT.path)
        .fillColor("#111111")
        .text(pathText, {
          width: textWidth,
        });
      doc.moveDown(0.25);
      doc.font("Courier").fontSize(PDF_PT.code).fillColor("#111111");
      writePdfCodeBlock(doc, bodyText, textWidth);
      doc.moveDown(0.75);
    }

    doc.end();
  });
}
