import { assertValidResponderAnswer } from "./answer-schema.mjs";
import { runStepWithRetry } from "./retry-policy.mjs";
import { createLifecycleLedger, finalizeLifecycleLedger, recordStepStatus } from "./status-ledger.mjs";
import { buildVerificationResult, enforceVerificationGate } from "./verification.mjs";

const ORDERED_STEPS = Object.freeze(["discuss", "plan", "execute", "verify"]);

function defaultStepExecutor({ step, phase }) {
  if (step === "verify") {
    return {
      checks: [
        { name: "lint", status: "pass", details: `lint ok for phase ${phase.phaseNumber}` },
        { name: "tests", status: "pass", details: `tests ok for phase ${phase.phaseNumber}` },
      ],
      evidenceRefs: [`evidence://${phase.id}/verify`],
    };
  }

  return {
    output: `${step} complete for ${phase.id}`,
  };
}

export async function runLifecycleForPhase({
  phase,
  descriptor,
  runId,
  policy,
  responderAnswer,
  stepExecutor = defaultStepExecutor,
}) {
  const ledger = createLifecycleLedger({ phase, runId });
  const lifecycle = {
    ...ledger,
    verification: null,
    evidenceRefs: [],
  };

  for (const step of ORDERED_STEPS) {
    recordStepStatus(lifecycle, { step, status: "started" });

    const execution = await runStepWithRetry({
      step,
      policy,
      runner: async ({ attempt }) => stepExecutor({ step, phase, descriptor, attempt, lifecycle }),
    });

    if (!execution.ok) {
      recordStepStatus(lifecycle, {
        step,
        status: "failed",
        attempts: execution.attempts,
        error: execution.error instanceof Error ? execution.error.message : String(execution.error),
      });
      finalizeLifecycleLedger(lifecycle, {
        status: "failed",
        terminalReason: `step:${step}`,
      });
      return lifecycle;
    }

    const stepResult = execution.result ?? {};

    if (stepResult.requiresResponder === true) {
      try {
        assertValidResponderAnswer(responderAnswer);
      } catch (error) {
        recordStepStatus(lifecycle, {
          step,
          status: "failed",
          attempts: execution.attempts,
          error: error instanceof Error ? error.message : String(error),
        });
        finalizeLifecycleLedger(lifecycle, {
          status: "failed",
          terminalReason: `step:${step}`,
        });
        return lifecycle;
      }
      recordStepStatus(lifecycle, {
        step,
        status: "responder_validated",
        attempts: execution.attempts,
      });
    }

    if (step === "verify") {
      const verification = buildVerificationResult({
        checks: stepResult.checks ?? [],
      });
      const evidenceRefs = stepResult.evidenceRefs ?? [];
      const gate = enforceVerificationGate({ verification, evidenceRefs });

      lifecycle.verification = verification;
      lifecycle.evidenceRefs = evidenceRefs;

      recordStepStatus(lifecycle, {
        step,
        status: gate.passed ? "completed" : "gate_failed",
        attempts: execution.attempts,
        verdict: verification.verdict,
      });

      if (!gate.passed) {
        finalizeLifecycleLedger(lifecycle, {
          status: "failed",
          terminalReason: gate.reason,
        });
        return lifecycle;
      }

      continue;
    }

    recordStepStatus(lifecycle, {
      step,
      status: "completed",
      attempts: execution.attempts,
    });
  }

  finalizeLifecycleLedger(lifecycle, { status: "complete" });
  return lifecycle;
}

export async function runLifecycleForSelectedPhases({
  runId,
  selectedPhases,
  descriptors,
  policy,
  responderAnswer,
  stepExecutor,
}) {
  const results = [];
  for (const phase of selectedPhases) {
    const descriptor = descriptors.find((item) => item.phaseNumber === phase.phaseNumber);
    if (!descriptor) {
      throw new Error(`Missing descriptor for phase ${phase.phaseNumber}.`);
    }
    const result = await runLifecycleForPhase({
      phase,
      descriptor,
      runId,
      policy,
      responderAnswer,
      stepExecutor,
    });
    results.push({
      phaseNumber: phase.phaseNumber,
      phaseId: phase.id,
      status: result.status,
      terminalReason: result.terminalReason,
      lifecycle: result,
    });
  }
  return results;
}
