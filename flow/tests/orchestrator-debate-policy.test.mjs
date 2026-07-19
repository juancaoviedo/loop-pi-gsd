import test from "node:test";
import assert from "node:assert/strict";

import { evaluateDebateDecision } from "../orchestrator/debate-policy.mjs";

test("policy proceeds when confidence meets threshold and blockers are empty", () => {
  const result = evaluateDebateDecision({
    confidence: 0.8,
    threshold: 0.8,
    blockers: [],
  });

  assert.equal(result.decision, "proceed");
  assert.deepEqual(result.reasonCodes, ["threshold_satisfied"]);
});

test("blockers take precedence over threshold equality", () => {
  const result = evaluateDebateDecision({
    confidence: 0.9,
    threshold: 0.8,
    blockers: ["agent_b_timeout"],
  });

  assert.equal(result.decision, "escalate-and-block");
  assert.deepEqual(result.reasonCodes, ["agent_b_timeout"]);
});

test("reason ordering is deterministic and de-duplicated", () => {
  const result = evaluateDebateDecision({
    confidence: 0.4,
    threshold: 0.8,
    blockers: ["z_reason", "a_reason", "z_reason"],
  });

  assert.equal(result.decision, "escalate-and-block");
  assert.deepEqual(result.reasonCodes, ["a_reason", "z_reason"]);
});
