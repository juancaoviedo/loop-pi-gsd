import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { buildEvidenceBundle, persistEvidenceBundle } from "../governance/evidence-bundle.mjs";
import { persistImmutableRunMetadata } from "../governance/run-metadata.mjs";

test("immutable metadata is written once per run id", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "flow-gov-meta-"));
  try {
    const first = await persistImmutableRunMetadata({
      projectRoot: root,
      runId: "orchestrator-test",
      metadata: { selectedPhases: [{ phaseNumber: 5 }], policyVersion: 1 },
    });
    const second = await persistImmutableRunMetadata({
      projectRoot: root,
      runId: "orchestrator-test",
      metadata: { selectedPhases: [{ phaseNumber: 999 }], policyVersion: 2 },
    });

    assert.equal(first.created, true);
    assert.equal(second.created, false);
    assert.equal(second.metadata.policyVersion, 1);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("evidence bundle persists checkpoints and artifacts", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "flow-gov-evidence-"));
  try {
    const bundle = buildEvidenceBundle({
      runId: "orchestrator-test",
      manifestPath: "flow/runs/orchestrator-test/orchestrator-manifest.json",
      lifecycleArtifacts: [{ phaseNumber: 5, status: "complete", filePath: "flow/runs/x/phases/phase-05/lifecycle-result.json" }],
      delegationRecords: [{ questionId: "q-1", agentId: "a-1" }],
    });

    const { filePath } = await persistEvidenceBundle({
      projectRoot: root,
      runId: "orchestrator-test",
      evidenceBundle: bundle,
    });

    const saved = JSON.parse(await fs.readFile(filePath, "utf8"));
    assert.equal(saved.runId, "orchestrator-test");
    assert.equal(saved.phaseEvidence.length, 1);
    assert.equal(saved.checkpoints[0].checkpoint, "verified");
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
