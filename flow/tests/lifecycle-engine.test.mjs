import test from "node:test";
import assert from "node:assert/strict";

import { runLifecycleForPhase } from "../lifecycle/engine.mjs";

test("runLifecycleForPhase executes deterministic step order and completes", async () => {
  const observed = [];
  const phase = { phaseNumber: 4, id: "phase-04", name: "Lifecycle" };
  const descriptor = { phaseContextPath: "/tmp/x" };

  const lifecycle = await runLifecycleForPhase({
    phase,
    descriptor,
    runId: "orchestrator-abc",
    stepExecutor: async ({ step }) => {
      observed.push(step);
      if (step === "verify") {
        return {
          checks: [
            { name: "lint", status: "pass" },
            { name: "tests", status: "pass" },
          ],
          evidenceRefs: ["evidence://phase-04/verify"],
        };
      }
      return { output: `${step} ok` };
    },
  });

  assert.deepEqual(observed, ["discuss", "plan", "execute", "verify"]);
  assert.equal(lifecycle.status, "complete");
  assert.equal(lifecycle.steps.filter((step) => step.status === "completed").length >= 4, true);
  assert.equal(lifecycle.verification.verdict, "pass");
});
