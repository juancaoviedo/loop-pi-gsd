import test from "node:test";
import assert from "node:assert/strict";

import { runDebatePrototype } from "../orchestrator/debate-prototype.mjs";

function baseEvent(overrides = {}) {
  return {
    schemaVersion: "1.0.0",
    runId: "run-proto",
    phaseNumber: 8,
    timestampIso: "2026-07-19T10:00:00.000Z",
    correlationId: "corr-42",
    ...overrides,
  };
}

test("happy path returns proceed for valid spec/discuss transcript", () => {
  const transcript = [
    baseEvent({
      eventType: "proposal",
      agentRole: "agent-a",
      confidence: 0.9,
      payload: { text: "Need architecture direction." },
    }),
    baseEvent({
      eventType: "critique",
      agentRole: "agent-b",
      confidence: 0.92,
      payload: {
        answer: "This contract is deterministic and role-safe.",
        providerMetadata: {
          providerName: "demo-provider",
          providerLatencyMs: 22,
          providerStatusCode: 200,
          providerRequestId: "req-1",
          apiKey: "SECRET",
          rawBody: "never-persist",
        },
      },
    }),
  ];

  const result = runDebatePrototype({
    workflow: "spec-phase",
    transcript,
    policyConfig: {
      confidenceThreshold: 0.8,
      maxRounds: 4,
      maxInvalidAnswerRetries: 1,
    },
  });

  assert.equal(result.decision, "proceed");
  assert.deepEqual(result.reasonCodes, ["threshold_satisfied"]);
  assert.equal(result.roundsConsumed, 2);
  assert.deepEqual(result.governanceEvidence.providerMetadata, {
    providerName: "demo-provider",
    providerLatencyMs: 22,
    providerStatusCode: 200,
    providerRequestId: "req-1",
  });
});

test("replay of identical transcript/config is deterministic", () => {
  const transcript = [
    baseEvent({
      eventType: "proposal",
      agentRole: "agent-a",
      confidence: 0.7,
      payload: { text: "Propose deterministic decision path." },
    }),
    baseEvent({
      eventType: "critique",
      agentRole: "agent-b",
      confidence: 0.88,
      payload: { answer: "Proceed with sorted reason codes." },
    }),
  ];

  const config = {
    confidenceThreshold: 0.8,
    maxRounds: 3,
    maxInvalidAnswerRetries: 1,
    answerTimeoutMs: 3000,
  };

  const first = runDebatePrototype({ workflow: "discuss-phase", transcript, policyConfig: config });
  const second = runDebatePrototype({ workflow: "discuss-phase", transcript, policyConfig: config });

  assert.deepEqual(second, first);
});

test("agent-b control directive is blocked by role boundary", () => {
  const transcript = [
    baseEvent({
      eventType: "proposal",
      agentRole: "agent-a",
      confidence: 0.9,
      payload: { text: "Question from Agent A" },
    }),
    baseEvent({
      eventType: "critique",
      agentRole: "agent-b",
      confidence: 0.95,
      payload: {
        answer: "Proceed immediately.",
        controlDirective: "force_proceed",
      },
    }),
  ];

  const result = runDebatePrototype({ workflow: "spec-phase", transcript });
  assert.equal(result.decision, "escalate-and-block");
  assert.ok(result.reasonCodes.includes("agent_b_control_directive"));
});

test("no response timeout escalates deterministically", () => {
  const result = runDebatePrototype({
    workflow: "discuss-phase",
    transcript: [],
    policyConfig: { confidenceThreshold: 0.8 },
  });

  assert.equal(result.decision, "escalate-and-block");
  assert.ok(result.reasonCodes.includes("agent_b_timeout"));
});

test("invalid answer retries exhaust to blocker", () => {
  const transcript = [
    baseEvent({
      eventType: "critique",
      agentRole: "agent-b",
      confidence: 0.7,
      payload: { answer: "" },
    }),
    baseEvent({
      eventType: "critique",
      agentRole: "agent-b",
      confidence: 0.7,
      payload: { answer: "" },
    }),
  ];

  const result = runDebatePrototype({
    workflow: "spec-phase",
    transcript,
    policyConfig: { maxInvalidAnswerRetries: 1 },
  });

  assert.equal(result.decision, "escalate-and-block");
  assert.ok(result.reasonCodes.includes("invalid_answer_retries_exhausted"));
});

test("unresolved disagreement escalates deterministically", () => {
  const transcript = [
    baseEvent({
      eventType: "critique",
      agentRole: "agent-b",
      confidence: 0.81,
      payload: { answer: "I disagree.", disagreement: true },
    }),
    baseEvent({
      eventType: "consensus",
      agentRole: "agent-a",
      confidence: 0.81,
      payload: { status: "unresolved" },
    }),
  ];

  const result = runDebatePrototype({ workflow: "discuss-phase", transcript });
  assert.equal(result.decision, "escalate-and-block");
  assert.ok(result.reasonCodes.includes("unresolved_disagreement"));
});

test("prototype enforces scope lock to spec/discuss only", () => {
  assert.throws(() => {
    runDebatePrototype({ workflow: "execute-phase", transcript: [] });
  }, { code: "workflow_scope_violation" });
});
