export const DEFAULT_ESCALATION_POLICY = Object.freeze({
  riskThreshold: 0.7,
  confidenceThreshold: 0.6,
  escalateOnFailedVerification: true,
});

function normalizePolicy(policy = {}) {
  return {
    ...DEFAULT_ESCALATION_POLICY,
    ...policy,
  };
}

export function evaluateEscalation({ policy, lifecycleResults = [], delegationRecords = [] }) {
  const cfg = normalizePolicy(policy);
  const reasons = [];

  const hasFailedLifecycle = lifecycleResults.some((result) => result.status !== "complete");
  if (cfg.escalateOnFailedVerification && hasFailedLifecycle) {
    reasons.push("lifecycle_failed_or_unverified");
  }

  for (const record of delegationRecords) {
    if (typeof record.riskScore === "number" && record.riskScore >= cfg.riskThreshold) {
      reasons.push(`high_risk:${record.questionId}`);
    }
    if (typeof record.confidence === "number" && record.confidence < cfg.confidenceThreshold) {
      reasons.push(`low_confidence:${record.questionId}`);
    }
    if (record.conflict === true) {
      reasons.push(`conflict:${record.questionId}`);
    }
  }

  const escalate = reasons.length > 0;
  return {
    schemaVersion: 1,
    escalate,
    gateStatus: escalate ? "human-review-required" : "auto-approved",
    reasons,
    policy: cfg,
  };
}
