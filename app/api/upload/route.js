import { NextResponse } from "next/server";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import mammoth from "mammoth";
import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({
        error: "No file uploaded",
        fileName: "",
        text: "",
      });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uint8Array = new Uint8Array(bytes);

    let extractedText = "";
    const fileName = file.name || "";
    const lowerName = fileName.toLowerCase();

    if (file.type === "application/pdf" || lowerName.endsWith(".pdf")) {
      const pdf = await pdfjsLib.getDocument({
        data: uint8Array,
        disableWorker: true,
      }).promise;

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        const pageText = textContent.items
          .map((item) => item.str)
          .join(" ");

        extractedText += `\n\n--- Page ${i} ---\n${pageText}`;
      }
    } else if (lowerName.endsWith(".docx")) {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else if (lowerName.endsWith(".pptx")) {
      extractedText = await extractPptxText(buffer);
    } else if (
      file.type === "text/plain" ||
      lowerName.endsWith(".txt") ||
      lowerName.endsWith(".md")
    ) {
      extractedText = new TextDecoder("utf-8").decode(uint8Array);
    } else {
      extractedText = new TextDecoder("utf-8").decode(uint8Array);
    }

    extractedText = extractedText.trim();

    if (!extractedText) {
      return NextResponse.json({
        fileName,
        text: "",
        warning:
          "No readable text found. This may be a scanned image PDF or image-only file.",
      });
    }

   const chunks = extractedText.match(
  /.{1,1500}(\s|$)/g
) || [];

return NextResponse.json({
  fileName: file.name,
  text: extractedText,
  chunks,
});
  } catch (error) {
    console.error("Upload API error:", error);

    return NextResponse.json({
      error: error.message,
      fileName: "",
      text: "",
    });
  }
}

async function extractPptxText(buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const parser = new XMLParser({
    ignoreAttributes: false,
  });

  const slideFiles = Object.keys(zip.files)
    .filter((name) => name.startsWith("ppt/slides/slide") && name.endsWith(".xml"))
    .sort((a, b) => {
      const numA = Number(a.match(/slide(\d+)\.xml/)?.[1] || 0);
      const numB = Number(b.match(/slide(\d+)\.xml/)?.[1] || 0);
      return numA - numB;
    });

  let text = "";

  for (let i = 0; i < slideFiles.length; i++) {
    const xml = await zip.files[slideFiles[i]].async("text");
    const parsed = parser.parse(xml);

    const slideText = [];
    collectText(parsed, slideText);

    text += `\n\n--- Slide ${i + 1} ---\n${slideText.join(" ")}`;
  }

  return text.trim();
}

function collectText(node, output) {
  if (!node) return;

  if (typeof node === "string") {
    output.push(node);
    return;
  }

  if (Array.isArray(node)) {
    node.forEach((item) => collectText(item, output));
    return;
  }

  if (typeof node === "object") {
    for (const key of Object.keys(node)) {
      if (key === "a:t" && typeof node[key] === "string") {
        output.push(node[key]);
      } else {
        collectText(node[key], output);
      }
    }
  }
}