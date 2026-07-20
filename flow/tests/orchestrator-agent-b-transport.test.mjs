import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  sendDelegatedQuestionWithPolicy,
  startAgentB,
  stopAgentB,
} from "../orchestrator/agent-b-runtime.mjs";
import { AGENT_B_REASON_CODES } from "../orchestrator/agent-b-reason-codes.mjs";

async function makeSandbox(prefix) {
  const projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  return { projectRoot };
}

test("startAgentB fails closed on missing config path", async () => {
  const { projectRoot } = await makeSandbox("flow-agent-b-missing-");

  await assert.rejects(
    startAgentB({ projectRoot, runId: "missing-config", phaseNumber: 9, config: {} }),
    { code: AGENT_B_REASON_CODES.startup_config_missing },
  );
});

test("startAgentB fails closed on malformed config file", async () => {
  const { projectRoot } = await makeSandbox("flow-agent-b-invalid-");
  const configPath = path.join(projectRoot, "agent-b.config.json");
  await fs.writeFile(configPath, "{not-valid-json");

  await assert.rejects(
    startAgentB({ projectRoot, runId: "invalid-config", phaseNumber: 9, config: { configPath } }),
    { code: AGENT_B_REASON_CODES.startup_config_invalid },
  );
});

test("provider/model separation appears in handshake evidence", async () => {
  const { projectRoot } = await makeSandbox("flow-agent-b-provider-");
  const configPath = path.join(projectRoot, "agent-b.config.json");
  await fs.writeFile(configPath, JSON.stringify({
    providerId: "stub-b",
    modelId: "stub-model-b",
  }, null, 2));

  const session = await startAgentB({
    projectRoot,
    runId: "provider-separation",
    phaseNumber: 9,
    config: { configPath },
  });

  await session.ready;

  const outcome = await sendDelegatedQuestionWithPolicy(session, {
    workflow: "spec-phase",
    question: "hello",
  }, {
    maxAttempts: 2,
    perTryTimeoutMs: 250,
  });

  assert.equal(outcome.disposition, "proceed");
  await stopAgentB(session);

  const evidenceDir = path.join(projectRoot, "flow", "runs", "provider-separation", "agent-b");
  const files = await fs.readdir(evidenceDir);
  const handshakeFile = files.find((name) => name.includes("handshake")) ?? files[0];
  const handshake = JSON.parse(await fs.readFile(path.join(evidenceDir, handshakeFile), "utf8"));
  assert.equal(handshake.providerId, "stub-b");
  assert.equal(handshake.modelId, "stub-model-b");
});

test("empty answer retries then escalates with retry_exhausted + root cause", async () => {
  const { projectRoot } = await makeSandbox("flow-agent-b-empty-");
  const configPath = path.join(projectRoot, "agent-b.config.json");
  await fs.writeFile(configPath, JSON.stringify({
    providerId: "stub-b",
    modelId: "stub-model-b",
    testBehavior: "empty-answer",
    maxAttempts: 2,
    perTryTimeoutMs: 250,
  }, null, 2));

  const session = await startAgentB({
    projectRoot,
    runId: "empty-answer",
    phaseNumber: 9,
    config: { configPath },
  });

  const outcome = await sendDelegatedQuestionWithPolicy(session, {
    workflow: "spec-phase",
    question: "answer please",
  });

  assert.equal(outcome.disposition, "escalate-and-block");
  assert.ok(outcome.reasonCodes.includes("retry_exhausted"));
  assert.ok(outcome.reasonCodes.includes("agent_b.transport_empty_answer"));

  await stopAgentB(session);
});

test("non-responsive child times out and escalates", async () => {
  const { projectRoot } = await makeSandbox("flow-agent-b-timeout-");
  const configPath = path.join(projectRoot, "agent-b.config.json");
  await fs.writeFile(configPath, JSON.stringify({
    providerId: "stub-b",
    modelId: "stub-model-b",
    testBehavior: "non-responsive",
    maxAttempts: 2,
    perTryTimeoutMs: 40,
  }, null, 2));

  const session = await startAgentB({
    projectRoot,
    runId: "timeout-answer",
    phaseNumber: 9,
    config: { configPath },
  });

  const outcome = await sendDelegatedQuestionWithPolicy(session, {
    workflow: "spec-phase",
    question: "never answer",
  });

  assert.equal(outcome.disposition, "escalate-and-block");
  assert.ok(outcome.reasonCodes.includes("retry_exhausted"));
  assert.ok(outcome.reasonCodes.includes(AGENT_B_REASON_CODES.request_timeout));

  await stopAgentB(session);
});
