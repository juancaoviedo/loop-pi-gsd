import fs from "node:fs/promises";
import path from "node:path";

const ALLOWLISTED_ARTIFACTS = Object.freeze([
  ".planning/PROJECT.md",
  ".planning/REQUIREMENTS.md",
  ".planning/ROADMAP.md",
  ".planning/STATE.md",
  ".planning/OBJECTIVE.md",
  ".planning/OBJECTIVE.html",
  ".planning/OBJECTIVE.pdf",
]);

async function resolvePhaseDirectory(projectRoot, phaseNumber) {
  const phasesDir = path.join(projectRoot, ".planning", "phases");
  const padded = String(phaseNumber).padStart(2, "0");
  try {
    const children = await fs.readdir(phasesDir, { withFileTypes: true });
    const match = children.find((item) => item.isDirectory() && item.name.startsWith(`${padded}-`));
    return match ? path.join(".planning", "phases", match.name) : null;
  } catch {
    return null;
  }
}

async function collectPhaseArtifacts(projectRoot, selectedPhases) {
  const out = [];
  for (const phase of selectedPhases) {
    const phaseDir = await resolvePhaseDirectory(projectRoot, phase.phaseNumber);
    if (!phaseDir) continue;

    const candidates = [
      `${phaseDir}/DISCUSSION-LOG.md`,
      `${phaseDir}/${String(phase.phaseNumber).padStart(2, "0")}-SPEC.md`,
      `${phaseDir}/${String(phase.phaseNumber).padStart(2, "0")}-CONTEXT.md`,
      `${phaseDir}/${String(phase.phaseNumber).padStart(2, "0")}-01-PLAN.md`,
      `${phaseDir}/${String(phase.phaseNumber).padStart(2, "0")}-01-SUMMARY.md`,
    ];

    for (const relPath of candidates) {
      const artifact = await readArtifactIfExists(projectRoot, relPath);
      if (artifact) out.push(artifact);
    }
  }
  return out;
}

async function readArtifactIfExists(projectRoot, relPath) {
  const absolutePath = path.join(projectRoot, relPath);
  try {
    const content = await fs.readFile(absolutePath, "utf8");
    return { path: relPath, content };
  } catch {
    return null;
  }
}

export async function buildResponderContextPack({ projectRoot, selectedPhases, descriptors }) {
  const artifacts = [];
  for (const relPath of ALLOWLISTED_ARTIFACTS) {
    const artifact = await readArtifactIfExists(projectRoot, relPath);
    if (artifact) artifacts.push(artifact);
  }

  const phaseArtifacts = await collectPhaseArtifacts(projectRoot, selectedPhases);
  artifacts.push(...phaseArtifacts);

  if (artifacts.length === 0) {
    throw new Error("No allowlisted artifacts available for context-pack generation.");
  }

  return {
    schemaVersion: 1,
    contractScope: "phase8-spec-discuss-only",
    contractSchemaVersion: "1.0.0",
    projectRoot,
    artifactPaths: artifacts.map((artifact) => artifact.path),
    artifacts,
    phases: selectedPhases.map((phase) => ({
      phaseNumber: phase.phaseNumber,
      phaseId: phase.id,
      phaseName: phase.name,
      goal: phase.goal,
      requirements: phase.requirements,
      contractScope: "phase8-spec-discuss-only",
      descriptor: descriptors.find((descriptor) => descriptor.phaseNumber === phase.phaseNumber) ?? null,
    })),
  };
}
