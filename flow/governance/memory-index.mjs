import fs from "node:fs/promises";
import path from "node:path";

export function buildMemoryIndex({ runId, selectedPhases = [], lifecycleResults = [] }) {
  const outcomesByPhase = new Map(lifecycleResults.map((item) => [item.phaseNumber, item.status]));

  return {
    schemaVersion: 1,
    runId,
    generatedAt: new Date().toISOString(),
    links: selectedPhases.map((phase) => ({
      phaseNumber: phase.phaseNumber,
      phaseId: phase.id,
      requirements: phase.requirements ?? [],
      outcome: outcomesByPhase.get(phase.phaseNumber) ?? "unknown",
    })),
  };
}

export async function persistMemoryIndex({ projectRoot, runId, memoryIndex }) {
  const runDir = path.join(projectRoot, "flow", "runs", runId);
  await fs.mkdir(runDir, { recursive: true });
  const filePath = path.join(runDir, "memory-index.json");
  await fs.writeFile(filePath, `${JSON.stringify(memoryIndex, null, 2)}\n`, "utf8");
  return { filePath };
}
