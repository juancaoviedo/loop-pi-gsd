import fs from "node:fs/promises";
import path from "node:path";

const SUPPORTED_EXTENSIONS = Object.freeze({
  ".md": "markdown",
  ".markdown": "markdown",
  ".tex": "latex",
  ".html": "html",
  ".htm": "html",
  ".pdf": "pdf",
});

function stripHtmlTags(value) {
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(text) {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function decodePdfString(value) {
  return value
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\\\/g, "\\");
}

function extractPdfText(buffer) {
  const raw = buffer.toString("latin1");
  const parts = [];

  const parenMatches = raw.matchAll(/\(([^)]{2,400})\)\s*T[Jj]/g);
  for (const match of parenMatches) {
    parts.push(decodePdfString(match[1]));
  }

  const streamMatches = raw.matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g);
  for (const match of streamMatches) {
    const cleaned = match[1].replace(/[^\x20-\x7E\n]/g, " ").replace(/\s+/g, " ").trim();
    if (cleaned.length >= 8) parts.push(cleaned);
  }

  if (parts.length === 0) {
    const fallback = raw.replace(/[^\x20-\x7E\n]/g, " ").replace(/\s+/g, " ").trim();
    if (fallback) parts.push(fallback);
  }

  return parts.join("\n");
}

export function detectInputFormat(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return SUPPORTED_EXTENSIONS[ext] ?? null;
}

function sectionIdFromHeading(prefix, heading, index) {
  const slug = heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${prefix}-${String(index + 1).padStart(3, "0")}-${slug || "section"}`;
}

function segmentMarkdown(text) {
  const lines = normalizeText(text).split("\n");
  const sections = [];
  let current = null;

  function flush(endLine) {
    if (!current) return;
    current.endLine = endLine;
    current.content = current.content.join("\n").trim();
    sections.push(current);
    current = null;
  }

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const headingMatch = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
    if (headingMatch) {
      flush(i);
      current = {
        heading: headingMatch[2].trim(),
        level: headingMatch[1].length,
        startLine: i + 1,
        endLine: i + 1,
        content: [],
      };
      continue;
    }
    if (!current) {
      current = {
        heading: "Overview",
        level: 1,
        startLine: 1,
        endLine: 1,
        content: [],
      };
    }
    current.content.push(line);
  }

  flush(lines.length);
  return sections.map((section, index) => ({
    id: sectionIdFromHeading("md", section.heading, index),
    ...section,
  }));
}

function segmentLatex(text) {
  const normalized = normalizeText(text);
  const headingRegex = /\\(section|subsection|subsubsection)\*?\{([^}]+)\}/g;
  const matches = [...normalized.matchAll(headingRegex)];
  if (matches.length === 0) {
    return [{
      id: "tex-001-overview",
      heading: "Overview",
      level: 1,
      startLine: 1,
      endLine: normalized.split("\n").length,
      content: normalized.trim(),
    }];
  }

  const lines = normalized.split("\n");
  const sections = [];
  for (let i = 0; i < matches.length; i += 1) {
    const match = matches[i];
    const next = matches[i + 1];
    const startIndex = match.index ?? 0;
    const endIndex = next ? (next.index ?? normalized.length) : normalized.length;
    const chunk = normalized.slice(startIndex, endIndex);
    const startLine = normalized.slice(0, startIndex).split("\n").length;
    const endLine = startLine + chunk.split("\n").length - 1;
    const level = match[1] === "section" ? 1 : match[1] === "subsection" ? 2 : 3;
    sections.push({
      id: sectionIdFromHeading("tex", match[2].trim(), i),
      heading: match[2].trim(),
      level,
      startLine,
      endLine,
      content: chunk.replace(/^\\[a-z]+\*?\{[^}]+\}/, "").trim(),
    });
  }
  return sections;
}

function segmentHtml(text) {
  const normalized = normalizeText(text);
  const headingRegex = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
  const matches = [...normalized.matchAll(headingRegex)];

  if (matches.length === 0) {
    return [{
      id: "html-001-overview",
      heading: "Overview",
      level: 1,
      startLine: 1,
      endLine: normalized.split("\n").length,
      content: stripHtmlTags(normalized),
    }];
  }

  const sections = [];
  for (let i = 0; i < matches.length; i += 1) {
    const match = matches[i];
    const next = matches[i + 1];
    const startIndex = match.index ?? 0;
    const endIndex = next ? (next.index ?? normalized.length) : normalized.length;
    const chunk = normalized.slice(startIndex, endIndex);
    const heading = stripHtmlTags(match[2]);
    const startLine = normalized.slice(0, startIndex).split("\n").length;
    const endLine = startLine + chunk.split("\n").length - 1;

    sections.push({
      id: sectionIdFromHeading("html", heading || "section", i),
      heading: heading || `Section ${i + 1}`,
      level: Number(match[1]),
      startLine,
      endLine,
      content: stripHtmlTags(chunk.replace(match[0], "")).trim(),
    });
  }
  return sections;
}

function segmentPdf(text) {
  const normalized = normalizeText(text);
  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return [];
  }

  const sections = [];
  let current = null;

  function isHeadingCandidate(line) {
    return line.length <= 90 && (/^[A-Z0-9][A-Z0-9\s:-]+$/.test(line) || /:$/.test(line));
  }

  function flush(endLine) {
    if (!current) return;
    current.endLine = endLine;
    current.content = current.content.join("\n").trim();
    sections.push(current);
    current = null;
  }

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (isHeadingCandidate(line)) {
      flush(i + 1);
      current = { heading: line, level: 1, startLine: i + 1, endLine: i + 1, content: [] };
      continue;
    }
    if (!current) {
      current = { heading: "Overview", level: 1, startLine: i + 1, endLine: i + 1, content: [] };
    }
    current.content.push(line);
  }

  flush(lines.length);
  return sections.map((section, index) => ({
    id: sectionIdFromHeading("pdf", section.heading, index),
    ...section,
  }));
}

export function segmentSource({ format, text }) {
  switch (format) {
    case "markdown":
      return segmentMarkdown(text);
    case "latex":
      return segmentLatex(text);
    case "html":
      return segmentHtml(text);
    case "pdf":
      return segmentPdf(text);
    default:
      return [];
  }
}

export async function ingestSourceDocument({ filePath }) {
  if (!filePath) {
    throw new Error("Missing source file path.");
  }

  const format = detectInputFormat(filePath);
  if (!format) {
    throw new Error("Unsupported input format. Use .md, .tex, .pdf, .html, or .htm.");
  }

  const buffer = await fs.readFile(filePath);
  let text;
  if (format === "pdf") {
    text = extractPdfText(buffer);
  } else {
    text = normalizeText(buffer.toString("utf8"));
  }

  if (!text || text.trim().length === 0) {
    throw new Error("Input document is empty.");
  }

  const sections = segmentSource({ format, text }).filter((section) => section.content || section.heading);
  if (sections.length === 0) {
    throw new Error("No structured sections could be extracted from input document.");
  }

  return {
    filePath,
    format,
    text,
    sections,
  };
}
