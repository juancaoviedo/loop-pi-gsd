import { sanitizeProviderMetadata } from "./discussion-log.mjs";

function normalizeAgentBRound(record, index) {
  const answer = record.answer ?? record.answerMessage?.payload?.answer ?? "";
  const providerMetadata = sanitizeProviderMetadata(
    record.providerMetadata
      ?? record.answerMessage?.payload?.providerMetadata
      ?? record.governanceEvidence?.providerMetadata,
  );

  return {
    phaseNumber: typeof record.phaseNumber === "number" ? record.phaseNumber : null,
    questionId: record.questionId ?? `q-${index + 1}`,
    workflow: record.workflow ?? "unknown",
    agentId: "agent-b",
    authority: "agent-a",
    question: record.question ?? "",
    answer,
    rationale: record.rationaleSummary ?? record.rationale ?? "",
    confidence: typeof record.confidence === "number" ? record.confidence : 0.75,
    riskScore: typeof record.riskScore === "number" ? record.riskScore : 0,
    conflict: record.conflict === true,
    escalationDisposition: record.disposition ?? record.escalationDisposition ?? "none",
    providerMetadata,
    createdAt: record.createdAt ?? new Date().toISOString(),
  };
}

export function normalizeDelegationRecords(records = []) {
  return records.map((record, index) => {
    if (record.agentId === "agent-b" || record.authority === "agent-a") {
      return normalizeAgentBRound(record, index);
    }

    return {
      phaseNumber: typeof record.phaseNumber === "number" ? record.phaseNumber : null,
      questionId: record.questionId ?? `q-${index + 1}`,
      workflow: record.workflow ?? "unknown",
      agentId: record.agentId ?? "responder-agent",
      authority: record.authority ?? "agent-a",
      question: record.question ?? "",
      answer: record.answer ?? "",
      rationale: record.rationale ?? "",
      confidence: typeof record.confidence === "number" ? record.confidence : 0,
      riskScore: typeof record.riskScore === "number" ? record.riskScore : 0,
      conflict: record.conflict === true,
      escalationDisposition: record.escalationDisposition ?? "none",
      providerMetadata: sanitizeProviderMetadata(record.providerMetadata),
      createdAt: record.createdAt ?? new Date().toISOString(),
    };
  });
}

export function validateDelegationRecord(record) {
  const required = ["questionId", "agentId", "question", "answer", "rationale", "confidence", "escalationDisposition"];
  const missing = required.filter((field) => !(field in record));
  return {
    valid: missing.length === 0,
    missing,
  };
}
