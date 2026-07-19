import test from "node:test";
import assert from "node:assert/strict";

import {
  assertSupportedSchemaMajor,
  normalizeDebateTextFields,
  validateDebateEventEnvelope,
} from "../orchestrator/debate-contract.mjs";

function makeEvent(overrides = {}) {
  return {
    schemaVersion: "1.0.0",
    runId: "run-1",
    phaseNumber: 8,
    eventType: "critique",
    timestampIso: "2026-07-19T00:00:00.000Z",
    correlationId: "corr-1",
    agentRole: "agent-b",
    confidence: 0.85,
    payload: { answer: "Looks good." },
    ...overrides,
  };
}

test("validateDebateEventEnvelope accepts valid envelope", () => {
  const event = validateDebateEventEnvelope(makeEvent());
  assert.equal(event.eventType, "critique");
  assert.equal(event.payload.answer, "Looks good.");
});

test("assertSupportedSchemaMajor fails closed on unknown schema major", () => {
  assert.throws(() => assertSupportedSchemaMajor("2.0.0"), {
    code: "unsupported_schema_major",
  });
});

test("validateDebateEventEnvelope rejects unknown event type", () => {
  assert.throws(() => validateDebateEventEnvelope(makeEvent({ eventType: "mystery" })), {
    code: "unknown_event_type",
  });
});

test("validateDebateEventEnvelope rejects malformed payload body", () => {
  assert.throws(() => validateDebateEventEnvelope(makeEvent({ payload: {} })), {
    code: "malformed_payload",
  });
});

test("normalizeDebateTextFields trims and normalizes free-text fields", () => {
  const normalized = normalizeDebateTextFields({
    text: "  cafe\u0301  ",
    nested: {
      answer: "  ready  ",
    },
  });

  assert.equal(normalized.text, "caf\u00E9");
  assert.equal(normalized.nested.answer, "ready");
});
