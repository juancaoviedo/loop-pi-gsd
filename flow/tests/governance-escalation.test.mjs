import test from "node:test";
import assert from "node:assert/strict";

import { evaluateEscalation } from "../governance/escalation-policy.mjs";
import { normalizeDelegationRecords, validateDelegationRecord } from "../governance/delegation-evidence.mjs";

test("escalation triggers for failed lifecycle outcomes", () => {
  const result = evaluateEscalation({
    lifecycleResults: [{ phaseNumber: 5, status: "failed" }],
    delegationRecords: [],
  });

  assert.equal(result.escalate, true);
  assert.equal(result.gateStatus, "human-review-required");
  assert.ok(result.reasons.includes("lifecycle_failed_or_unverified"));
});

test("escalation triggers for high risk and low confidence delegation", () => {
  const records = normalizeDelegationRecords([
    {
      questionId: "q-1",
      workflow: "discuss-phase",
      agentId: "responder-agent",
      question: "What should be prioritized?",
      answer: "Prioritize reliability gates first.",
      rationale: "ambiguous",
      confidence: 0.4,
      riskScore: 0.9,
      escalationDisposition: "pending-policy",
    },
  ]);

  const result = evaluateEscalation({
    policy: { riskThreshold: 0.7, confidenceThreshold: 0.6 },
    lifecycleResults: [{ phaseNumber: 5, status: "complete" }],
    delegationRecords: records,
  });

  assert.equal(result.escalate, true);
  assert.ok(result.reasons.some((reason) => reason.startsWith("high_risk:")));
  assert.ok(result.reasons.some((reason) => reason.startsWith("low_confidence:")));

  const validity = validateDelegationRecord(records[0]);
  assert.equal(validity.valid, true);
});
