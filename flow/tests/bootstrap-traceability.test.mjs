import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { ingestSourceDocument } from "../bootstrap/ingest.mjs";
import { buildBootstrapModel } from "../bootstrap/model.mjs";
import { computePhaseSizing } from "../bootstrap/phase-sizing.mjs";
import { mergePlanningArtifacts } from "../bootstrap/merge-planning.mjs";
import { persistTraceMap } from "../bootstrap/trace-map.mjs";

test("persistTraceMap writes section-to-artifact mappings", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "flow-bootstrap-trace-"));
  const sourcePath = path.join(root, "source.html");
  await fs.writeFile(sourcePath, "<h1>Goal</h1><p>Build service</p><h2>Constraints</h2><p>Need tests and monitoring</p>", "utf8");

  try {
    const source = await ingestSourceDocument({ filePath: sourcePath });
    const model = buildBootstrapModel({ source });
    const phaseSizing = computePhaseSizing({ workItems: model.workItems });
    const writes = await mergePlanningArtifacts({
      projectRoot: root,
      model,
      phaseSizing,
      runId: "bootstrap-trace",
    });

    const { tracePath, trace } = await persistTraceMap({
      projectRoot: root,
      runId: "bootstrap-trace",
      model,
      phaseSizing,
      artifactWrites: writes,
    });

    const saved = JSON.parse(await fs.readFile(tracePath, "utf8"));

    assert.equal(saved.runId, "bootstrap-trace");
    assert.equal(saved.source.format, "html");
    assert.ok(saved.source.sections.length >= 1);
    assert.ok(saved.artifacts.length === 4);
    assert.ok(saved.phaseMappings.length === trace.phaseMappings.length);
    assert.ok(saved.phaseMappings[0].objectiveMappings[0].sourceSectionId);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
