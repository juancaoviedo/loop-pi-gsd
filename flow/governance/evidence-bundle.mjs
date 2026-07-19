import fs from "node:fs/promises";
import path from "node:path";

export function buildEvidenceBundle({ runId, manifestPath, lifecycleArtifacts = [], delegationRecords = [] }) {
  const phaseEvidence = lifecycleArtifacts.map((item) => ({
    phaseNumber: item.phaseNumber,
    status: item.status,
    artifact: item.filePath,
  }));

  return {
    schemaVersion: 1,
    runId,
    createdAt: new Date().toISOString(),
    manifestPath,
    phaseEvidence,
    delegationRecords,
    checkpoints: phaseEvidence.map((item) => ({
      phaseNumber: item.phaseNumber,
      checkpoint: item.status === "complete" ? "verified" : "requires-review",
      artifact: item.artifact,
    })),
  };
}

export async function persistEvidenceBundle({ projectRoot, runId, evidenceBundle }) {
  const runDir = path.join(projectRoot, "flow", "runs", runId);
  await fs.mkdir(runDir, { recursive: true });
  const filePath = path.join(runDir, "evidence-bundle.json");
  await fs.writeFile(filePath, `${JSON.stringify(evidenceBundle, null, 2)}\n`, "utf8");
  return { filePath };
}
