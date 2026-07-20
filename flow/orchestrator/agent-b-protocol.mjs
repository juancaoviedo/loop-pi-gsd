const PROTOCOL_SCHEMA_MAJOR = 1;

export const AGENT_B_PROTOCOL_SCHEMA_MAJOR = PROTOCOL_SCHEMA_MAJOR;
export const SUPPORTED_REQUEST_TYPES = Object.freeze(new Set([
  "handshake",
  "capability-echo",
  "spec-phase-question",
  "discuss-phase-question",
  "answer",
  "error",
]));

function isObjectLike(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function buildProtocolError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function assertSupportedSchemaMajor(schemaVersion) {
  const majorToken = String(schemaVersion ?? "").trim().split(".")[0];
  const major = Number(majorToken);
  if (!Number.isInteger(major) || major !== PROTOCOL_SCHEMA_MAJOR) {
    throw buildProtocolError(
      "agent_b.transport_schema_invalid",
      `Unsupported schema major version: ${schemaVersion}.`,
    );
  }
}

function assertNonEmptyString(value, fieldName, code = "agent_b.transport_schema_invalid") {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw buildProtocolError(code, `${fieldName} must be a non-empty string.`);
  }
}

export function parseAgentBLine(line) {
  try {
    return JSON.parse(line);
  } catch (error) {
    const wrapped = buildProtocolError("agent_b.transport_malformed_jsonl", `Invalid JSONL message: ${error.message}`);
    wrapped.retryable = true;
    throw wrapped;
  }
}

export function validateAgentBEnvelope(message) {
  if (!isObjectLike(message)) {
    throw buildProtocolError("agent_b.transport_schema_invalid", "Message must be an object.");
  }

  const required = ["schemaVersion", "requestType", "correlationId", "agentRole", "payload"];
  for (const field of required) {
    if (!(field in message)) {
      throw buildProtocolError("agent_b.transport_schema_invalid", `Missing field: ${field}.`);
    }
  }

  assertSupportedSchemaMajor(message.schemaVersion);
  assertNonEmptyString(message.requestType, "requestType");
  if (!SUPPORTED_REQUEST_TYPES.has(message.requestType)) {
    throw buildProtocolError("agent_b.transport_schema_invalid", `Unsupported requestType: ${message.requestType}.`);
  }
  assertNonEmptyString(message.correlationId, "correlationId");
  assertNonEmptyString(message.agentRole, "agentRole");

  if (!isObjectLike(message.payload)) {
    throw buildProtocolError("agent_b.transport_schema_invalid", "payload must be an object.");
  }

  if (message.requestType === "answer") {
    assertNonEmptyString(message.payload.answer, "payload.answer", "agent_b.transport_empty_answer");
  }

  return message;
}

export function encodeAgentBRequest(request) {
  return `${JSON.stringify(request)}\n`;
}
