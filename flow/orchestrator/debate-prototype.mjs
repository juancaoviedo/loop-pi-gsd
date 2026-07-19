import { sanitizeProviderMetadata } from "../governance/discussion-log.mjs";
import { validateDebateEventEnvelope } from "./debate-contract.mjs";
import { evaluateDebateDecision } from "./debate-policy.mjs";

const ALLOWED_WORKFLOWS = new Set(["spec-phase", "discuss-phase"]);

export const DEFAULT_PROTOTYPE_CONFIG = Object.freeze({
  confidenceThreshold: 0.75,
  maxRounds: 3,
  maxInvalidAnswerRetries: 1,
  answerTimeoutMs: 5_000,
});

function buildPrototypeError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function normalizeConfig(policyConfig = {}) {
  return {
    confidenceThreshold: typeof policyConfig.confidenceThreshold === "number"
      ? policyConfig.confidenceThreshold
      : DEFAULT_PROTOTYPE_CONFIG.confidenceThreshold,
    maxRounds: Number.isInteger(policyConfig.maxRounds)
      ? policyConfig.maxRounds
      : DEFAULT_PROTOTYPE_CONFIG.maxRounds,
    maxInvalidAnswerRetries: Number.isInteger(policyConfig.maxInvalidAnswerRetries)
      ? policyConfig.maxInvalidAnswerRetries
      : DEFAULT_PROTOTYPE_CONFIG.maxInvalidAnswerRetries,
    answerTimeoutMs: Number.isInteger(policyConfig.answerTimeoutMs)
      ? policyConfig.answerTimeoutMs
      : DEFAULT_PROTOTYPE_CONFIG.answerTimeoutMs,
  };
}

function mapContractErrorToReasonCode(errorCode) {
  if (errorCode === "unsupported_schema_major") return "unsupported_schema_major";
  if (errorCode === "unknown_event_type") return "unknown_event_type";
  return "malformed_payload";
}

export function runDebatePrototype({ workflow, transcript = [], policyConfig = {} }) {
  if (!ALLOWED_WORKFLOWS.has(workflow)) {
    throw buildPrototypeError(
      "workflow_scope_violation",
      `Workflow '${workflow}' is out of scope. Phase-8 prototype supports only spec-phase and discuss-phase.`,
    );
  }

  if (!Array.isArray(transcript)) {
    throw buildPrototypeError("malformed_payload", "transcript must be an array of debate events.");
  }

  const config = normalizeConfig(policyConfig);
  const transcriptWindow = transcript.slice(0, Math.max(0, config.maxRounds));
  const blockerReasons = [];

  let invalidAnswerRetries = 0;
  let latestConfidence = 0;
  let roundsConsumed = 0;
  let sawAgentBAnswer = false;
  let sanitizedProviderMetadata = {};

  for (const candidate of transcriptWindow) {
    roundsConsumed += 1;

    let event;
    try {
      event = validateDebateEventEnvelope(candidate);
    } catch (error) {
      blockerReasons.push(mapContractErrorToReasonCode(error.code));
      continue;
    }

    if (event.agentRole === "agent-b") {
      // Agent B is strictly answer-only in Phase 8 and cannot issue policy control directives.
      if (event.payload?.controlDirective !== undefined || event.eventType !== "critique") {
        blockerReasons.push("agent_b_control_directive");
      }

      if (event.eventType === "timeout") {
        blockerReasons.push("agent_b_timeout");
        continue;
      }

      if (event.eventType === "error") {
        blockerReasons.push("provider_error");
        continue;
      }

      const answerText = typeof event.payload.answer === "string"
        ? event.payload.answer
        : (typeof event.payload.text === "string" ? event.payload.text : "");

      if (answerText.length === 0) {
        invalidAnswerRetries += 1;
        if (invalidAnswerRetries > config.maxInvalidAnswerRetries) {
          blockerReasons.push("invalid_answer_retries_exhausted");
        }
      } else {
        sawAgentBAnswer = true;
        latestConfidence = event.confidence;
      }

      if (event.payload?.disagreement === true) {
        blockerReasons.push("unresolved_disagreement");
      }

      sanitizedProviderMetadata = sanitizeProviderMetadata(event.payload?.providerMetadata);
      continue;
    }

    if (event.eventType === "consensus" && event.payload.status === "unresolved") {
      blockerReasons.push("unresolved_disagreement");
    }
  }

  if (!sawAgentBAnswer) {
    blockerReasons.push("agent_b_timeout");
  }

  const decision = evaluateDebateDecision({
    confidence: latestConfidence,
    threshold: config.confidenceThreshold,
    blockers: blockerReasons,
  });

  return {
    ...decision,
    roundsConsumed,
    schemaVersion: 1,
    policySnapshot: {
      ...decision.policySnapshot,
      maxRounds: config.maxRounds,
      maxInvalidAnswerRetries: config.maxInvalidAnswerRetries,
      answerTimeoutMs: config.answerTimeoutMs,
    },
    governanceEvidence: {
      providerMetadata: sanitizedProviderMetadata,
    },
  };
}
