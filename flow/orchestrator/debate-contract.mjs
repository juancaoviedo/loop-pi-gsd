const SUPPORTED_SCHEMA_MAJOR = 1;

export const SUPPORTED_DEBATE_EVENT_TYPES = Object.freeze([
  "proposal",
  "critique",
  "revision",
  "vote",
  "consensus",
  "timeout",
  "error",
]);

const SUPPORTED_AGENT_ROLES = new Set(["agent-a", "agent-b"]);
const EVENT_TYPE_SET = new Set(SUPPORTED_DEBATE_EVENT_TYPES);

function buildContractError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function isObjectLike(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeText(value) {
  return value.trim().normalize("NFC");
}

function assertNonEmptyString(value, fieldName) {
  if (typeof value !== "string" || normalizeText(value).length === 0) {
    throw buildContractError("malformed_payload", `${fieldName} must be a non-empty string.`);
  }
}

function assertTimestamp(value) {
  assertNonEmptyString(value, "timestampIso");
  if (Number.isNaN(Date.parse(value))) {
    throw buildContractError("malformed_payload", "timestampIso must be a valid ISO-8601 timestamp.");
  }
}

function validatePayloadByEventType(eventType, payload) {
  if (!isObjectLike(payload)) {
    throw buildContractError("malformed_payload", "payload must be an object.");
  }

  if (eventType === "proposal" || eventType === "revision") {
    assertNonEmptyString(payload.text, "payload.text");
    return;
  }

  if (eventType === "critique") {
    const candidate = payload.answer ?? payload.text;
    if (typeof candidate !== "string") {
      throw buildContractError("malformed_payload", "payload.answer|text must be a string.");
    }
    return;
  }

  if (eventType === "vote") {
    assertNonEmptyString(payload.vote, "payload.vote");
    return;
  }

  if (eventType === "consensus") {
    assertNonEmptyString(payload.status, "payload.status");
    return;
  }

  if (eventType === "timeout") {
    assertNonEmptyString(payload.reason, "payload.reason");
    return;
  }

  if (eventType === "error") {
    assertNonEmptyString(payload.code, "payload.code");
    assertNonEmptyString(payload.message, "payload.message");
  }
}

export function normalizeDebateTextFields(value) {
  if (typeof value === "string") {
    return normalizeText(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeDebateTextFields(item));
  }

  if (isObjectLike(value)) {
    const normalized = {};
    for (const [key, nestedValue] of Object.entries(value)) {
      normalized[key] = normalizeDebateTextFields(nestedValue);
    }
    return normalized;
  }

  return value;
}

export function assertSupportedSchemaMajor(schemaVersion) {
  if (schemaVersion === undefined || schemaVersion === null) {
    throw buildContractError("malformed_payload", "schemaVersion is required.");
  }

  const majorToken = String(schemaVersion).trim().split(".")[0];
  const major = Number(majorToken);
  if (!Number.isInteger(major) || major !== SUPPORTED_SCHEMA_MAJOR) {
    throw buildContractError(
      "unsupported_schema_major",
      `Unsupported schema major version: ${schemaVersion}. Supported major: ${SUPPORTED_SCHEMA_MAJOR}.`,
    );
  }

  return major;
}

export function validateDebateEventEnvelope(event) {
  if (!isObjectLike(event)) {
    throw buildContractError("malformed_payload", "Debate event must be an object.");
  }

  const normalizedEvent = normalizeDebateTextFields(event);

  assertSupportedSchemaMajor(normalizedEvent.schemaVersion);

  const requiredFields = [
    "runId",
    "phaseNumber",
    "eventType",
    "timestampIso",
    "correlationId",
    "agentRole",
    "confidence",
    "payload",
  ];

  for (const fieldName of requiredFields) {
    if (!(fieldName in normalizedEvent)) {
      throw buildContractError("malformed_payload", `Missing required field: ${fieldName}.`);
    }
  }

  assertNonEmptyString(normalizedEvent.runId, "runId");
  assertNonEmptyString(normalizedEvent.correlationId, "correlationId");
  assertTimestamp(normalizedEvent.timestampIso);

  const phaseNumber = Number(normalizedEvent.phaseNumber);
  if (!Number.isInteger(phaseNumber) || phaseNumber <= 0) {
    throw buildContractError("malformed_payload", "phaseNumber must be a positive integer.");
  }

  if (!EVENT_TYPE_SET.has(normalizedEvent.eventType)) {
    throw buildContractError("unknown_event_type", `Unknown debate event type: ${normalizedEvent.eventType}.`);
  }

  if (!SUPPORTED_AGENT_ROLES.has(normalizedEvent.agentRole)) {
    throw buildContractError("malformed_payload", `Unsupported agentRole: ${normalizedEvent.agentRole}.`);
  }

  if (typeof normalizedEvent.confidence !== "number" || Number.isNaN(normalizedEvent.confidence)) {
    throw buildContractError("malformed_payload", "confidence must be a number between 0 and 1.");
  }
  if (normalizedEvent.confidence < 0 || normalizedEvent.confidence > 1) {
    throw buildContractError("malformed_payload", "confidence must be a number between 0 and 1.");
  }

  validatePayloadByEventType(normalizedEvent.eventType, normalizedEvent.payload);
  return normalizedEvent;
}
