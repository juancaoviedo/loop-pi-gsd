export function normalizeDelegationRecords(records = []) {
  return records.map((record, index) => ({
    phaseNumber: typeof record.phaseNumber === "number" ? record.phaseNumber : null,
    questionId: record.questionId ?? `q-${index + 1}`,
    workflow: record.workflow ?? "unknown",
    agentId: record.agentId ?? "responder-agent",
    question: record.question ?? "",
    answer: record.answer ?? "",
    rationale: record.rationale ?? "",
    confidence: typeof record.confidence === "number" ? record.confidence : 0,
    riskScore: typeof record.riskScore === "number" ? record.riskScore : 0,
    conflict: record.conflict === true,
    escalationDisposition: record.escalationDisposition ?? "none",
    createdAt: record.createdAt ?? new Date().toISOString(),
  }));
}

export function validateDelegationRecord(record) {
  const required = ["questionId", "agentId", "question", "answer", "rationale", "confidence", "escalationDisposition"];
  const missing = required.filter((field) => !(field in record));
  return {
    valid: missing.length === 0,
    missing,
  };
}
