export const DEFAULT_DEBATE_POLICY = Object.freeze({
  confidenceThreshold: 0.75,
});

function uniqueSortedReasonCodes(reasonCodes) {
  return [...new Set(reasonCodes.filter((code) => typeof code === "string" && code.length > 0))].sort();
}

export function evaluateDebateDecision({ confidence, threshold, blockers = [] }) {
  const confidenceThreshold = typeof threshold === "number" && !Number.isNaN(threshold)
    ? threshold
    : DEFAULT_DEBATE_POLICY.confidenceThreshold;

  const normalizedConfidence = typeof confidence === "number" && !Number.isNaN(confidence) ? confidence : 0;
  const blockerReasons = uniqueSortedReasonCodes(blockers);

  let decision = "escalate-and-block";
  const reasonCodes = [...blockerReasons];

  if (reasonCodes.length === 0) {
    if (normalizedConfidence >= confidenceThreshold) {
      decision = "proceed";
      reasonCodes.push("threshold_satisfied");
    } else {
      reasonCodes.push("low_confidence");
    }
  }

  return {
    schemaVersion: 1,
    decision,
    reasonCodes: uniqueSortedReasonCodes(reasonCodes),
    policySnapshot: {
      confidenceThreshold,
      evaluatedConfidence: normalizedConfidence,
      blockerCount: blockerReasons.length,
    },
  };
}
