import fs from "node:fs/promises";
import path from "node:path";

const ARTIFACTS = [
  ".planning/PROJECT.md",
  ".planning/REQUIREMENTS.md",
  ".planning/ROADMAP.md",
  ".planning/STATE.md",
];

function withBlock(existing, marker, content) {
  const start = `<!-- FLOW:${marker}:START -->`;
  const end = `<!-- FLOW:${marker}:END -->`;
  const block = `${start}\n${content.trim()}\n${end}\n`;

  if (!existing || existing.trim().length === 0) {
    return `${block}`;
  }

  const regex = new RegExp(`${start}[\\s\\S]*?${end}\\n?`, "m");
  if (regex.test(existing)) {
    return existing.replace(regex, block);
  }

  return `${existing.trimEnd()}\n\n${block}`;
}

function renderProjectBlock(model) {
  const constraints = model.project.constraints?.trim() || "- None captured";
  return [
    "## Flow Bootstrap Snapshot",
    "",
    `- Source format: ${model.source.format}`,
    `- Source sections: ${model.source.sectionCount}`,
    `- Project title: ${model.project.title}`,
    "",
    "### Summary",
    model.project.summary || "No summary extracted.",
    "",
    "### Constraints",
    constraints,
  ].join("\n");
}

function renderRequirementsBlock(model) {
  const lines = ["## Flow Bootstrap Requirements", ""];
  for (const requirement of model.requirements) {
    lines.push(`- ${requirement.id}: ${requirement.text}`);
  }
  if (model.requirements.length === 0) {
    lines.push("- None extracted");
  }
  return lines.join("\n");
}

function renderRoadmapBlock(phaseSizing) {
  const lines = ["## Flow Bootstrap Additional Phases", ""];
  for (const phase of phaseSizing.phases) {
    const firstObjective = phase.objectives[0]?.title ?? "No objective";
    lines.push(`- Phase ${String(phase.phaseNumber).padStart(2, "0")}: complexity ${phase.complexity} - ${firstObjective}`);
  }
  if (phaseSizing.phases.length === 0) {
    lines.push("- No phases generated");
  }
  return lines.join("\n");
}

function renderStateBlock({ runId, model, phaseSizing }) {
  return [
    "## Flow Bootstrap Runtime",
    "",
    `- Last bootstrap run: ${runId}`,
    `- Source file: ${model.source.filePath}`,
    `- Source format: ${model.source.format}`,
    `- Generated phases: ${phaseSizing.phaseCount}`,
    `- Total complexity: ${phaseSizing.totalComplexity}`,
  ].join("\n");
}

async function ensureFile(filePath) {
  try {
    await fs.access(filePath);
  } catch {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, "", "utf8");
  }
}

export async function mergePlanningArtifacts({ projectRoot, model, phaseSizing, runId }) {
  if (!projectRoot || !model || !phaseSizing || !runId) {
    throw new Error("Missing merge inputs.");
  }

  const writes = [];
  for (const relPath of ARTIFACTS) {
    const absolutePath = path.join(projectRoot, relPath);
    await ensureFile(absolutePath);
    const existing = await fs.readFile(absolutePath, "utf8");

    let marker;
    let content;
    if (relPath.endsWith("PROJECT.md")) {
      marker = "BOOTSTRAP-PROJECT";
      content = renderProjectBlock(model);
    } else if (relPath.endsWith("REQUIREMENTS.md")) {
      marker = "BOOTSTRAP-REQUIREMENTS";
      content = renderRequirementsBlock(model);
    } else if (relPath.endsWith("ROADMAP.md")) {
      marker = "BOOTSTRAP-ROADMAP";
      content = renderRoadmapBlock(phaseSizing);
    } else {
      marker = "BOOTSTRAP-STATE";
      content = renderStateBlock({ runId, model, phaseSizing });
    }

    const next = withBlock(existing, marker, content);
    if (next !== existing) {
      await fs.writeFile(absolutePath, next, "utf8");
    }

    writes.push({
      artifact: relPath,
      marker,
      changed: next !== existing,
      sourceSectionIds: model.source.sectionIds,
    });
  }

  return writes;
}
