import fs from "node:fs/promises";
import path from "node:path";

export function buildReconciliationReport({ selectedPhases = [], lifecycleResults = [] }) {
  const runtimeByPhase = new Map(lifecycleResults.map((item) => [item.phaseNumber, item.status]));

  const mismatches = [];
  for (const phase of selectedPhases) {
    const runtimeStatus = runtimeByPhase.get(phase.phaseNumber) ?? "missing";
    const expected = "complete";
    if (runtimeStatus !== expected) {
      mismatches.push({
        phaseNumber: phase.phaseNumber,
        expected,
        actual: runtimeStatus,
      });
    }
  }

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    mismatchCount: mismatches.length,
    mismatches,
    reconciled: mismatches.length === 0,
  };
}

export async function persistReconciliationReport({ projectRoot, runId, report }) {
  const runDir = path.join(projectRoot, "flow", "runs", runId);
  await fs.mkdir(runDir, { recursive: true });
  const filePath = path.join(runDir, "memory-reconciliation.json");
  await fs.writeFile(filePath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return { filePath };
}
