import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import readline from "node:readline";

import { sanitizeProviderMetadata } from "../governance/discussion-log.mjs";
import { loadAgentBConfig } from "./agent-b-config.mjs";
import {
  AGENT_B_PROTOCOL_SCHEMA_MAJOR,
  encodeAgentBRequest,
  parseAgentBLine,
  validateAgentBEnvelope,
} from "./agent-b-protocol.mjs";
import {
  AGENT_B_REASON_CODES,
  buildEscalateAndBlock,
  classifyAgentBFailure,
} from "./agent-b-reason-codes.mjs";

export const DEFAULT_AGENT_B_FAILURE_POLICY = Object.freeze({
  maxAttempts: 2,
  perTryTimeoutMs: 300_000,
});

function buildError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function buildRequestType(workflow) {
  if (workflow === "discuss-phase") return "discuss-phase-question";
  return "spec-phase-question";
}

function buildCorrelationId() {
  return `corr-${crypto.randomUUID()}`;
}

function normalizePolicy(policy = {}, session = {}) {
  return {
    maxAttempts: Number.isInteger(policy.maxAttempts)
      ? policy.maxAttempts
      : (Number.isInteger(session.maxAttempts) ? session.maxAttempts : DEFAULT_AGENT_B_FAILURE_POLICY.maxAttempts),
    perTryTimeoutMs: Number.isInteger(policy.perTryTimeoutMs)
      ? policy.perTryTimeoutMs
      : (Number.isInteger(session.perTryTimeoutMs) ? session.perTryTimeoutMs : DEFAULT_AGENT_B_FAILURE_POLICY.perTryTimeoutMs),
  };
}

function createAbortableDeferred({ timeoutMs }) {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  const signal = AbortSignal.timeout(timeoutMs);
  const onAbort = () => {
    const error = buildError(AGENT_B_REASON_CODES.request_timeout, `Agent B request timed out after ${timeoutMs}ms`);
    error.name = "AbortError";
    error.retryable = true;
    reject(error);
  };

  signal.addEventListener("abort", onAbort, { once: true });

  return {
    promise,
    resolve(value) {
      signal.removeEventListener("abort", onAbort);
      resolve(value);
    },
    reject(error) {
      signal.removeEventListener("abort", onAbort);
      reject(error);
    },
  };
}

export async function persistAgentBEvidence({ projectRoot, runId, record }) {
  const evidenceDir = path.join(projectRoot, "flow", "runs", runId, "agent-b");
  await fs.mkdir(evidenceDir, { recursive: true });

  const filePath = path.join(evidenceDir, `${Date.now()}-${Math.random().toString(16).slice(2)}.json`);
  const payload = {
    kind: record.kind ?? "event",
    timestampIso: record.timestampIso ?? new Date().toISOString(),
    phaseNumber: record.phaseNumber ?? null,
    workflow: record.workflow ?? null,
    question: record.question ?? null,
    answer: record.answer ?? null,
    rationaleSummary: record.rationaleSummary ?? null,
    authority: record.authority ?? "agent-a",
    reasonCodes: record.reasonCodes ?? [],
    disposition: record.disposition ?? "proceed",
    attempt: record.attempt ?? null,
    providerId: record.providerId ?? null,
    modelId: record.modelId ?? null,
    providerMetadata: sanitizeProviderMetadata(record.providerMetadata),
  };

  await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return { filePath };
}

export async function startAgentB({ projectRoot, runId, phaseNumber, config = {} }) {
  const loaded = await loadAgentBConfig({ projectRoot, configPath: config.configPath });
  if (!loaded.ok) {
    throw buildError(loaded.reasonCode, "Agent B startup failed: config missing or invalid.");
  }

  const resolvedConfig = loaded.config;
  const entryPath = path.join(path.dirname(new URL(import.meta.url).pathname), "agent-b-entry.mjs");
  const child = spawn(process.execPath, [entryPath], {
    stdio: ["pipe", "pipe", "pipe"],
    env: {
      ...process.env,
      AGENT_B_CONFIG_PATH: loaded.resolvedPath,
      AGENT_B_PROVIDER_ID: resolvedConfig.providerId,
      AGENT_B_MODEL_ID: resolvedConfig.modelId,
      AGENT_B_TEST_BEHAVIOR: resolvedConfig.testBehavior ?? "",
    },
  });

  const session = {
    child,
    pid: child.pid,
    runId,
    phaseNumber,
    projectRoot,
    providerId: resolvedConfig.providerId,
    modelId: resolvedConfig.modelId,
    maxAttempts: resolvedConfig.maxAttempts,
    perTryTimeoutMs: resolvedConfig.perTryTimeoutMs,
    pendingByCorrelation: new Map(),
    isReady: false,
    closed: false,
  };

  const ready = new Promise((resolve, reject) => {
    const readyTimeout = setTimeout(() => {
      const error = buildError(AGENT_B_REASON_CODES.startup_handshake_failed, "Agent B handshake timed out.");
      error.retryable = false;
      reject(error);
    }, 5_000);

    const settleReady = async (message) => {
      if (session.isReady) return;
      session.isReady = true;
      clearTimeout(readyTimeout);
      await persistAgentBEvidence({
        projectRoot,
        runId,
        record: {
          kind: "handshake",
          phaseNumber,
          providerId: message.payload.providerId,
          modelId: message.payload.modelId,
          providerMetadata: {
            providerName: "stub-provider-b",
          },
        },
      });
      resolve(message);
    };

    const onStdoutLine = async (line) => {
      try {
        const parsed = parseAgentBLine(line);
        const message = validateAgentBEnvelope(parsed);

        if (message.requestType === "capability-echo") {
          await settleReady(message);
          return;
        }

        const deferred = session.pendingByCorrelation.get(message.correlationId);
        if (!deferred) return;
        session.pendingByCorrelation.delete(message.correlationId);

        if (message.requestType === "error") {
          const err = buildError(
            message.payload?.code ?? AGENT_B_REASON_CODES.transport_schema_invalid,
            message.payload?.message ?? "Agent B transport error.",
          );
          err.retryable = true;
          deferred.reject(err);
          return;
        }

        deferred.resolve(message);
      } catch (error) {
        const deferred = [...session.pendingByCorrelation.values()][0];
        if (deferred) {
          session.pendingByCorrelation.clear();
          deferred.reject(error);
        }
      }
    };

    const stdoutLines = readline.createInterface({
      input: child.stdout,
      crlfDelay: Infinity,
    });

    stdoutLines.on("line", (line) => {
      onStdoutLine(line).catch(reject);
    });

    child.once("error", (error) => {
      const startupError = buildError(AGENT_B_REASON_CODES.startup_spawn_error, error.message);
      startupError.retryable = false;
      reject(startupError);
    });

    child.on("close", (code) => {
      session.closed = true;
      if (!session.isReady) {
        const error = buildError(AGENT_B_REASON_CODES.startup_handshake_failed, `Agent B exited before handshake (code ${code}).`);
        error.retryable = false;
        reject(error);
      }

      for (const pending of session.pendingByCorrelation.values()) {
        const crash = buildError(AGENT_B_REASON_CODES.process_crashed, `Agent B child exited with code ${code}.`);
        crash.retryable = true;
        pending.reject(crash);
      }
      session.pendingByCorrelation.clear();
    });
  });

  session.ready = ready;
  return session;
}

async function sendSingleDelegatedQuestion({ session, request, timeoutMs }) {
  const requestType = request.requestType ?? buildRequestType(request.workflow);
  const correlationId = request.correlationId ?? buildCorrelationId();
  const envelope = {
    schemaVersion: `${AGENT_B_PROTOCOL_SCHEMA_MAJOR}.0.0`,
    requestType,
    correlationId,
    agentRole: "agent-a",
    payload: {
      question: request.question,
      mode: request.mode,
      transport: request.transport,
    },
  };

  validateAgentBEnvelope(envelope);

  const deferred = createAbortableDeferred({ timeoutMs });
  session.pendingByCorrelation.set(correlationId, deferred);
  session.child.stdin.write(encodeAgentBRequest(envelope));

  const response = await deferred.promise;
  validateAgentBEnvelope(response);
  return response;
}

export async function sendDelegatedQuestion(session, request) {
  if (!session.isReady) {
    const notReady = buildError("agent_b.not_ready", "Agent B session is not ready yet.");
    notReady.retryable = true;
    throw notReady;
  }

  const response = await sendSingleDelegatedQuestion({
    session,
    request,
    timeoutMs: session.perTryTimeoutMs ?? DEFAULT_AGENT_B_FAILURE_POLICY.perTryTimeoutMs,
  });

  if (typeof response.payload?.answer !== "string" || response.payload.answer.trim().length === 0) {
    const empty = buildError(AGENT_B_REASON_CODES.transport_empty_answer, "Agent B returned an empty answer.");
    empty.retryable = true;
    throw empty;
  }

  await persistAgentBEvidence({
    projectRoot: session.projectRoot,
    runId: session.runId,
    record: {
      kind: "answer-round",
      phaseNumber: session.phaseNumber,
      workflow: request.workflow,
      question: request.question,
      answer: response.payload.answer,
      rationaleSummary: `Answer generated by ${session.modelId}`,
      providerId: session.providerId,
      modelId: session.modelId,
      providerMetadata: response.payload.providerMetadata,
    },
  });

  return response;
}

export async function sendDelegatedQuestionWithPolicy(session, request, policy = {}) {
  await session.ready;
  session.isReady = true;

  const mergedPolicy = normalizePolicy(policy, session);
  let rootCauseCode = AGENT_B_REASON_CODES.transport_malformed_jsonl;

  for (let attempt = 1; attempt <= mergedPolicy.maxAttempts; attempt += 1) {
    try {
      const response = await sendSingleDelegatedQuestion({
        session,
        request,
        timeoutMs: mergedPolicy.perTryTimeoutMs,
      });

      if (typeof response.payload?.answer !== "string" || response.payload.answer.trim().length === 0) {
        throw buildError(AGENT_B_REASON_CODES.transport_empty_answer, "Agent B returned an empty answer.");
      }

      await persistAgentBEvidence({
        projectRoot: session.projectRoot,
        runId: session.runId,
        record: {
          kind: "answer-attempt",
          phaseNumber: session.phaseNumber,
          workflow: request.workflow,
          question: request.question,
          answer: response.payload.answer,
          rationaleSummary: `Attempt ${attempt} succeeded`,
          authority: "agent-a",
          attempt,
          disposition: "proceed",
          providerId: session.providerId,
          modelId: session.modelId,
          providerMetadata: response.payload.providerMetadata,
        },
      });

      return {
        disposition: "proceed",
        attempts: attempt,
        answerMessage: response,
      };
    } catch (error) {
      rootCauseCode = classifyAgentBFailure(error);

      await persistAgentBEvidence({
        projectRoot: session.projectRoot,
        runId: session.runId,
        record: {
          kind: "answer-attempt",
          phaseNumber: session.phaseNumber,
          workflow: request.workflow,
          question: request.question,
          rationaleSummary: `Attempt ${attempt} failed`,
          attempt,
          disposition: "retrying",
          reasonCodes: [rootCauseCode],
          authority: "agent-a",
          providerId: session.providerId,
          modelId: session.modelId,
        },
      });

      if (attempt >= mergedPolicy.maxAttempts) {
        const escalation = buildEscalateAndBlock({ rootCauseCode, attempts: attempt });
        await persistAgentBEvidence({
          projectRoot: session.projectRoot,
          runId: session.runId,
          record: {
            kind: "answer-final",
            phaseNumber: session.phaseNumber,
            workflow: request.workflow,
            question: request.question,
            rationaleSummary: "Retries exhausted",
            authority: "agent-a",
            disposition: escalation.disposition,
            reasonCodes: escalation.reasonCodes,
            attempt,
            providerId: session.providerId,
            modelId: session.modelId,
          },
        });
        return escalation;
      }
    }
  }

  return buildEscalateAndBlock({ rootCauseCode, attempts: mergedPolicy.maxAttempts });
}

export async function stopAgentB(session) {
  if (!session || session.closed) return;
  session.closed = true;

  await new Promise((resolve) => {
    let settled = false;

    const done = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    const timeout = setTimeout(() => {
      try {
        session.child.kill("SIGKILL");
      } catch {
        // no-op
      }
      done();
    }, 1_000);

    session.child.once("close", () => {
      clearTimeout(timeout);
      done();
    });

    try {
      session.child.stdin.end();
      session.child.kill("SIGTERM");
    } catch {
      clearTimeout(timeout);
      done();
    }
  });
}
