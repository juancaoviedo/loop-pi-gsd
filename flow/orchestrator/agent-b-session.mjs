import {
  sendDelegatedQuestionWithPolicy,
  startAgentB,
  stopAgentB,
} from "./agent-b-runtime.mjs";
import { assertPhase9RuntimeScope } from "./agent-b-scope-lock.mjs";

const ALLOWED_WORKFLOWS = new Set(["spec-phase", "discuss-phase"]);

function buildSessionError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

export async function openAgentBSession({ projectRoot, runId, phaseNumber, config }) {
  const runtime = await startAgentB({
    projectRoot,
    runId,
    phaseNumber,
    config,
  });

  return {
    runtime,
    pid: runtime.pid,
    closed: false,
  };
}

export async function runDelegatedRound(session, { workflow, question, mode, transport }) {
  if (session.closed) {
    throw buildSessionError("agent_b.session_closed", "Agent B session is already closed.");
  }

  if (!ALLOWED_WORKFLOWS.has(workflow)) {
    throw buildSessionError(
      "workflow_scope_violation",
      `Workflow '${workflow}' is out of scope. Phase-9 runtime supports spec-phase and discuss-phase only.`,
    );
  }

  const requestType = workflow === "discuss-phase" ? "discuss-phase-question" : "spec-phase-question";
  assertPhase9RuntimeScope({ requestType, mode, transport });

  const outcome = await sendDelegatedQuestionWithPolicy(session.runtime, {
    workflow,
    requestType,
    question,
    mode,
    transport,
  }, {
    maxAttempts: session.runtime.maxAttempts,
    perTryTimeoutMs: session.runtime.perTryTimeoutMs,
  });

  if (outcome.disposition === "escalate-and-block") {
    return {
      authority: "agent-a",
      workflow,
      question,
      ...outcome,
    };
  }

  return {
    authority: "agent-a",
    workflow,
    question,
    disposition: outcome.disposition,
    attempts: outcome.attempts,
    answer: outcome.answerMessage.payload.answer,
    providerMetadata: outcome.answerMessage.payload.providerMetadata,
    rationaleSummary: `Delegated answer from Agent B for ${workflow}`,
    agentId: "agent-b",
    confidence: 0.75,
  };
}

export async function closeAgentBSession(session) {
  if (session.closed) return;
  session.closed = true;
  await stopAgentB(session.runtime);
}
