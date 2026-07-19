import fs from "node:fs/promises";
import path from "node:path";

export async function persistImmutableRunMetadata({ projectRoot, runId, metadata }) {
  if (!projectRoot || !runId || !metadata) {
    throw new Error("Missing immutable metadata inputs.");
  }

  const runDir = path.join(projectRoot, "flow", "runs", runId);
  await fs.mkdir(runDir, { recursive: true });
  const filePath = path.join(runDir, "run-metadata.json");

  try {
    const existing = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(existing);
    return {
      filePath,
      metadata: parsed,
      created: false,
      immutable: true,
    };
  } catch {
    const payload = {
      schemaVersion: 1,
      immutable: true,
      createdAt: new Date().toISOString(),
      ...metadata,
    };
    await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    return {
      filePath,
      metadata: payload,
      created: true,
      immutable: true,
    };
  }
}
