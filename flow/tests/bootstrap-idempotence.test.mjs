import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { ingestSourceDocument } from "../bootstrap/ingest.mjs";
import { buildBootstrapModel } from "../bootstrap/model.mjs";
import { computePhaseSizing } from "../bootstrap/phase-sizing.mjs";
import { mergePlanningArtifacts } from "../bootstrap/merge-planning.mjs";

async function readArtifacts(root) {
  const files = [
    ".planning/PROJECT.md",
    ".planning/REQUIREMENTS.md",
    ".planning/ROADMAP.md",
    ".planning/STATE.md",
  ];

  const out = {};
  for (const rel of files) {
    out[rel] = await fs.readFile(path.join(root, rel), "utf8");
  }
  return out;
}

test("mergePlanningArtifacts is idempotent for identical input", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "flow-bootstrap-merge-"));
  const sourcePath = path.join(root, "source.md");
  await fs.writeFile(sourcePath, "# Product\n\n## Scope\n- Build API\n- Build UI\n- Add tests\n", "utf8");

  try {
    const source = await ingestSourceDocument({ filePath: sourcePath });
    const model = buildBootstrapModel({ source });
    const phaseSizing = computePhaseSizing({ workItems: model.workItems });

    await mergePlanningArtifacts({ projectRoot: root, model, phaseSizing, runId: "bootstrap-fixed" });
    const first = await readArtifacts(root);

    await mergePlanningArtifacts({ projectRoot: root, model, phaseSizing, runId: "bootstrap-fixed" });
    const second = await readArtifacts(root);

    assert.deepEqual(second, first);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
