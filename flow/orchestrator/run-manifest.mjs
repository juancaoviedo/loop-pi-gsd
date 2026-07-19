import fs from "node:fs/promises";
import path from "node:path";

export async function persistOrchestratorManifest({ projectRoot, runId, payload }) {
  if (!projectRoot || !runId || !payload) {
    throw new Error("Missing manifest inputs.");
  }

  const runDir = path.join(projectRoot, "flow", "runs", runId);
  await fs.mkdir(path.join(runDir, "phases"), { recursive: true });
  const manifestPath = path.join(runDir, "orchestrator-manifest.json");
  await fs.writeFile(manifestPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  return {
    manifestPath,
  };
}
