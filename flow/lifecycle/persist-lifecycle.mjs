import fs from "node:fs/promises";
import path from "node:path";

export async function persistLifecycleResult({ descriptor, lifecycleResult }) {
  if (!descriptor?.phaseContextPath) {
    throw new Error("Missing phaseContextPath in descriptor.");
  }

  const dirPath = descriptor.phaseContextPath;
  await fs.mkdir(dirPath, { recursive: true });

  const filePath = path.join(dirPath, "lifecycle-result.json");
  await fs.writeFile(filePath, `${JSON.stringify(lifecycleResult, null, 2)}\n`, "utf8");

  return {
    filePath,
  };
}
