import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { buildResponderContextPack } from "../orchestrator/context-pack.mjs";
import { buildInterceptionMetadata } from "../orchestrator/interception.mjs";
import { persistOrchestratorManifest } from "../orchestrator/run-manifest.mjs";

test("context pack uses allowlisted artifacts and deterministic structure", async () => {
  const projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), "flow-orch-pack-"));
  await fs.mkdir(path.join(projectRoot, ".planning"), { recursive: true });
  await fs.mkdir(path.join(projectRoot, ".planning", "phases", "03-phase-reader-and-execution-orchestrator"), { recursive: true });
  await fs.writeFile(path.join(projectRoot, ".planning", "PROJECT.md"), "# Project\n", "utf8");
  await fs.writeFile(path.join(projectRoot, ".planning", "REQUIREMENTS.md"), "# Requirements\n", "utf8");
  await fs.writeFile(path.join(projectRoot, ".planning", "ROADMAP.md"), "# Roadmap\n", "utf8");
  await fs.writeFile(path.join(projectRoot, ".planning", "STATE.md"), "# State\n", "utf8");
  await fs.writeFile(path.join(projectRoot, ".planning", "OBJECTIVE.md"), "# Objective\n", "utf8");
  await fs.writeFile(path.join(projectRoot, ".planning", "phases", "03-phase-reader-and-execution-orchestrator", "DISCUSSION-LOG.md"), "# Discussion\n", "utf8");
  await fs.writeFile(path.join(projectRoot, ".planning", "phases", "03-phase-reader-and-execution-orchestrator", "03-SPEC.md"), "# Spec\n", "utf8");
  await fs.writeFile(path.join(projectRoot, ".planning", "phases", "03-phase-reader-and-execution-orchestrator", "03-CONTEXT.md"), "# Context\n", "utf8");
  await fs.writeFile(path.join(projectRoot, ".planning", "phases", "03-phase-reader-and-execution-orchestrator", "03-01-PLAN.md"), "# Plan\n", "utf8");

  const selectedPhases = [{ phaseNumber: 3, id: "phase-03", name: "Three", goal: "Goal", requirements: ["PHASE-01"] }];
  const descriptors = [{ phaseNumber: 3, phaseContextPath: "/tmp/x", runId: "orchestrator-abc" }];

  try {
    const pack = await buildResponderContextPack({ projectRoot, selectedPhases, descriptors });
    assert.equal(pack.schemaVersion, 1);
    const expected = [
      ".planning/PROJECT.md",
      ".planning/REQUIREMENTS.md",
      ".planning/ROADMAP.md",
      ".planning/STATE.md",
      ".planning/OBJECTIVE.md",
      ".planning/phases/03-phase-reader-and-execution-orchestrator/DISCUSSION-LOG.md",
      ".planning/phases/03-phase-reader-and-execution-orchestrator/03-SPEC.md",
      ".planning/phases/03-phase-reader-and-execution-orchestrator/03-CONTEXT.md",
      ".planning/phases/03-phase-reader-and-execution-orchestrator/03-01-PLAN.md",
    ];
    assert.deepEqual(pack.artifactPaths.sort(), expected.sort());
    assert.equal(pack.phases[0].phaseNumber, 3);

    const interception = buildInterceptionMetadata({ selectedPhases });
    assert.equal(interception.interceptionEnabled, true);
    assert.equal(interception.phases[0].rules.length, 2);

    const payload = { runId: "orchestrator-abc", selectedPhases, descriptors, interception, contextPack: pack };
    const { manifestPath } = await persistOrchestratorManifest({ projectRoot, runId: "orchestrator-abc", payload });
    const saved = JSON.parse(await fs.readFile(manifestPath, "utf8"));
    assert.equal(saved.runId, "orchestrator-abc");
    assert.equal(saved.contextPack.schemaVersion, 1);
  } finally {
    await fs.rm(projectRoot, { recursive: true, force: true });
  }
});
