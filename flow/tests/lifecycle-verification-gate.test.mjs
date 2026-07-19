import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { buildVerificationResult, enforceVerificationGate } from "../lifecycle/verification.mjs";
import { runLifecycleForPhase } from "../lifecycle/engine.mjs";
import { persistLifecycleResult } from "../lifecycle/persist-lifecycle.mjs";

test("verification gate fails when checks fail or evidence is missing", () => {
  const failed = buildVerificationResult({ checks: [{ name: "tests", status: "fail" }] });
  const gateA = enforceVerificationGate({ verification: failed, evidenceRefs: ["evidence://x"] });
  assert.equal(gateA.passed, false);

  const passed = buildVerificationResult({ checks: [{ name: "tests", status: "pass" }] });
  const gateB = enforceVerificationGate({ verification: passed, evidenceRefs: [] });
  assert.equal(gateB.passed, false);
});

test("lifecycle cannot complete when verify gate fails and persists output", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "flow-lifecycle-"));
  const descriptor = { phaseContextPath: path.join(root, "phase-04") };
  const phase = { phaseNumber: 4, id: "phase-04", name: "Lifecycle" };

  try {
    const lifecycle = await runLifecycleForPhase({
      phase,
      descriptor,
      runId: "orchestrator-x",
      stepExecutor: async ({ step }) => {
        if (step === "verify") {
          return {
            checks: [{ name: "tests", status: "fail", details: "failed tests" }],
            evidenceRefs: ["evidence://phase-04/verify"],
          };
        }
        return { output: `${step} ok` };
      },
    });

    assert.equal(lifecycle.status, "failed");
    assert.ok(String(lifecycle.terminalReason).includes("Verification gate failed"));

    const persisted = await persistLifecycleResult({
      descriptor,
      lifecycleResult: { phaseNumber: 4, lifecycle },
    });

    const saved = JSON.parse(await fs.readFile(persisted.filePath, "utf8"));
    assert.equal(saved.phaseNumber, 4);
    assert.equal(saved.lifecycle.status, "failed");
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
