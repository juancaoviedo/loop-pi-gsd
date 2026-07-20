export const AGENT_B_REASON_CODES = Object.freeze({
  startup_config_missing: "startup_config_missing",
  startup_config_invalid: "startup_config_invalid",
  startup_spawn_error: "startup_spawn_error",
  startup_handshake_failed: "startup_handshake_failed",
  transport_malformed_jsonl: "agent_b.transport_malformed_jsonl",
  transport_schema_invalid: "agent_b.transport_schema_invalid",
  transport_empty_answer: "agent_b.transport_empty_answer",
  request_timeout: "agent_b.request_timeout",
  process_crashed: "agent_b.process_crashed",
  retry_exhausted: "retry_exhausted",
});

export function classifyAgentBFailure(error) {
  const code = error?.code;

  if (code && Object.values(AGENT_B_REASON_CODES).includes(code)) {
    return code;
  }

  if (error?.name === "AbortError" || error?.name === "TimeoutError") {
    return AGENT_B_REASON_CODES.request_timeout;
  }

  if (error?.message?.includes?.("timed out")) {
    return AGENT_B_REASON_CODES.request_timeout;
  }

  if (code === "ERR_CHILD_PROCESS_STDIO_MAXBUFFER") {
    return AGENT_B_REASON_CODES.process_crashed;
  }

  return AGENT_B_REASON_CODES.transport_malformed_jsonl;
}

export function buildEscalateAndBlock({ rootCauseCode, attempts }) {
  return {
    disposition: "escalate-and-block",
    reasonCodes: [AGENT_B_REASON_CODES.retry_exhausted, rootCauseCode],
    attempts,
  };
}
