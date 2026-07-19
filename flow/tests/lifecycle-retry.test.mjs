import test from "node:test";
import assert from "node:assert/strict";

import { runLifecycleForPhase } from "../lifecycle/engine.mjs";
import { validateResponderAnswer } from "../lifecycle/answer-schema.mjs";

test("lifecycle retries a retryable failed step within configured bounds", async () => {
  const attemptsByStep = new Map();
  const phase = { phaseNumber: 4, id: "phase-04", name: "Lifecycle" };
  const descriptor = { phaseContextPath: "/tmp/x" };

  const lifecycle = await runLifecycleForPhase({
    phase,
    descriptor,
    runId: "orchestrator-abc",
    policy: { maxRetries: 1, retryableSteps: ["execute"] },
    stepExecutor: async ({ step }) => {
      const attempt = (attemptsByStep.get(step) ?? 0) + 1;
      attemptsByStep.set(step, attempt);

      if (step === "execute" && attempt === 1) {
        const error = new Error("transient execute error");
        error.retryable = true;
        throw error;
      }

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

  assert.equal(attemptsByStep.get("execute"), 2);
  assert.equal(lifecycle.status, "complete");
});

test("lifecycle blocks resume when responder payload schema is invalid", async () => {
  const phase = { phaseNumber: 4, id: "phase-04", name: "Lifecycle" };
  const descriptor = { phaseContextPath: "/tmp/x" };

  const lifecycle = await runLifecycleForPhase({
    phase,
    descriptor,
    runId: "orchestrator-abc",
    responderAnswer: { questionId: "q-1", answer: "", confidence: 1.2 },
    policy: { maxRetries: 0 },
    stepExecutor: async ({ step }) => {
      if (step === "discuss") {
        return { requiresResponder: true };
      }
      if (step === "verify") {
        return { checks: [{ name: "tests", status: "pass" }], evidenceRefs: ["evidence://ok"] };
      }
      return { output: "ok" };
    },
  });

  assert.equal(lifecycle.status, "failed");
  assert.ok(String(lifecycle.terminalReason).includes("step:discuss"));

  const validation = validateResponderAnswer({ questionId: "q-1", answer: "x", confidence: 0.9 });
  assert.equal(validation.valid, true);
});
