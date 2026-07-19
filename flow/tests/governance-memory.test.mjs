import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { buildMemoryIndex, persistMemoryIndex } from "../governance/memory-index.mjs";
import { buildReconciliationReport, persistReconciliationReport } from "../governance/reconcile-memory.mjs";

test("memory index links selected phases to requirements and outcomes", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "flow-gov-memory-"));
  try {
    const memoryIndex = buildMemoryIndex({
      runId: "orchestrator-test",
      selectedPhases: [{ phaseNumber: 5, id: "phase-05", requirements: ["MEM-01", "VER-04"] }],
      lifecycleResults: [{ phaseNumber: 5, status: "complete" }],
    });

    const { filePath } = await persistMemoryIndex({
      projectRoot: root,
      runId: "orchestrator-test",
      memoryIndex,
    });

    const saved = JSON.parse(await fs.readFile(filePath, "utf8"));
    assert.equal(saved.links[0].phaseNumber, 5);
    assert.equal(saved.links[0].outcome, "complete");
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("reconciliation reports mismatches between planned and runtime status", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "flow-gov-reconcile-"));
  try {
    const report = buildReconciliationReport({
      selectedPhases: [{ phaseNumber: 5, id: "phase-05" }, { phaseNumber: 6, id: "phase-06" }],
      lifecycleResults: [{ phaseNumber: 5, status: "complete" }, { phaseNumber: 6, status: "failed" }],
    });

    assert.equal(report.reconciled, false);
    assert.equal(report.mismatchCount, 1);
    assert.equal(report.mismatches[0].phaseNumber, 6);

    const { filePath } = await persistReconciliationReport({
      projectRoot: root,
      runId: "orchestrator-test",
      report,
    });

    const saved = JSON.parse(await fs.readFile(filePath, "utf8"));
    assert.equal(saved.mismatchCount, 1);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
