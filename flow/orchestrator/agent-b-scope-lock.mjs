export const PHASE9_DISABLED_MODES = Object.freeze(new Set([
  "consensus",
  "debate",
  "two-round-consensus",
  "agora",
  "relay-transport",
]));

export const SCOPE_REASON_CODES = Object.freeze({
  consensus_disabled: "scope.phase9_consensus_disabled",
  agora_disabled: "scope.phase9_agora_disabled",
});

function buildScopeError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

export function assertPhase9RuntimeScope(request = {}) {
  const mode = String(request.mode ?? "").toLowerCase();
  const transport = String(request.transport ?? "").toLowerCase();
  const requestType = String(request.requestType ?? "").toLowerCase();

  if (["consensus", "debate", "two-round-consensus"].includes(mode)) {
    throw buildScopeError(SCOPE_REASON_CODES.consensus_disabled, `Mode '${mode}' is disabled in phase 9.`);
  }

  if (mode === "agora" || transport === "agora" || transport === "relay-transport") {
    throw buildScopeError(SCOPE_REASON_CODES.agora_disabled, "Agora/relay transport is disabled in phase 9.");
  }

  if (requestType && requestType !== "spec-phase-question" && requestType !== "discuss-phase-question") {
    throw buildScopeError(SCOPE_REASON_CODES.consensus_disabled, `requestType '${requestType}' is out of scope in phase 9.`);
  }

  if (PHASE9_DISABLED_MODES.has(mode) || PHASE9_DISABLED_MODES.has(transport)) {
    throw buildScopeError(SCOPE_REASON_CODES.consensus_disabled, "Requested mode is outside phase-9 ask/answer scope.");
  }

  return true;
}
