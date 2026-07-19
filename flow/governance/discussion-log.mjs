import fs from "node:fs/promises";
import path from "node:path";

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
    "| Timestamp | Question Id | Agent | Question | Answer | Confidence | Escalation |",
    "|-----------|-------------|-------|----------|--------|------------|------------|",
  ];

  for (const record of records) {
    lines.push(
      `| ${record.createdAt ?? ""} | ${record.questionId ?? ""} | ${record.agentId ?? ""} | ${String(record.question ?? "").replace(/\|/g, "\\|")} | ${String(record.answer ?? "").replace(/\|/g, "\\|")} | ${record.confidence ?? ""} | ${record.escalationDisposition ?? ""} |`,
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
