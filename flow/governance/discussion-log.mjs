import fs from "node:fs/promises";
import path from "node:path";

const PROVIDER_METADATA_ALLOWLIST = new Set([
  "providerName",
  "providerLatencyMs",
  "providerStatusCode",
  "providerRequestId",
]);

export function sanitizeProviderMetadata(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {};
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(input)) {
    if (!PROVIDER_METADATA_ALLOWLIST.has(key)) continue;
    sanitized[key] = value;
  }
  return sanitized;
}

function sanitizeDiscussionRecord(record) {
  return {
    ...record,
    providerMetadata: sanitizeProviderMetadata(record.providerMetadata),
  };
}

async function resolvePhaseDirectory(projectRoot, phaseNumber) {
  const phasesDir = path.join(projectRoot, ".planning", "phases");
  const padded = String(phaseNumber).padStart(2, "0");
  const children = await fs.readdir(phasesDir, { withFileTypes: true });
  const match = children.find((item) => item.isDirectory() && item.name.startsWith(`${padded}-`));
  return match ? path.join(phasesDir, match.name) : null;
}

function renderEntry({ runId, phaseNumber, records }) {
  const lines = [
    `### Run ${runId} - Phase ${String(phaseNumber).padStart(2, "0")}`,
    "",
    "| Timestamp | Question Id | Agent | Question | Answer | Confidence | Escalation | Provider Metadata |",
    "|-----------|-------------|-------|----------|--------|------------|------------|-------------------|",
  ];

  for (const rawRecord of records) {
    const record = sanitizeDiscussionRecord(rawRecord);
    const providerMetadata = JSON.stringify(record.providerMetadata ?? {});
    lines.push(
      `| ${record.createdAt ?? ""} | ${record.questionId ?? ""} | ${record.agentId ?? ""} | ${String(record.question ?? "").replace(/\|/g, "\\|")} | ${String(record.answer ?? "").replace(/\|/g, "\\|")} | ${record.confidence ?? ""} | ${record.escalationDisposition ?? ""} | ${providerMetadata.replace(/\|/g, "\\|")} |`,
    );
  }

  lines.push("", "");
  return lines.join("\n");
}

export async function appendDiscussionLog({ projectRoot, runId, phaseNumber, records }) {
  if (!Array.isArray(records) || records.length === 0) return null;

  const phaseDir = await resolvePhaseDirectory(projectRoot, phaseNumber);
  if (!phaseDir) return null;

  const filePath = path.join(phaseDir, "DISCUSSION-LOG.md");
  let existing = "";
  try {
    existing = await fs.readFile(filePath, "utf8");
  } catch {
    existing = "# DISCUSSION LOG\n\n## Session Entries\n\n";
  }

  const entry = renderEntry({ runId, phaseNumber, records });
  const next = `${existing.trimEnd()}\n\n${entry}`;
  await fs.writeFile(filePath, `${next}\n`, "utf8");
  return { filePath };
}
