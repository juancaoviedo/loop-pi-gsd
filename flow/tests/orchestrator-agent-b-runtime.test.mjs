import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  sendDelegatedQuestion,
  startAgentB,
  stopAgentB,
} from "../orchestrator/agent-b-runtime.mjs";
import { validateAgentBEnvelope } from "../orchestrator/agent-b-protocol.mjs";

async function makeSandbox() {
  const projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), "flow-agent-b-runtime-"));
  const configPath = path.join(projectRoot, "agent-b.config.json");
  await fs.writeFile(configPath, JSON.stringify({
    providerId: "stub-b",
    modelId: "stub-model-b",
  }, null, 2));
  return { projectRoot, configPath };
}

test("agent-b runtime spawns separate process, gates readiness, answers, persists sanitized evidence, and shuts down", async () => {
  const { projectRoot, configPath } = await makeSandbox();
  const runId = "runtime-test-run";

  const session = await startAgentB({
    projectRoot,
    runId,
    phaseNumber: 9,
    config: { configPath },
  });

  assert.equal(Number.isInteger(session.pid), true);
  assert.notEqual(session.pid, process.pid);

  await assert.rejects(
    sendDelegatedQuestion(session, {
      workflow: "spec-phase",
      requestType: "spec-phase-question",
      question: "what changed?",
    }),
    { code: "agent_b.not_ready" },
  );

  await session.ready;

  const answer = await sendDelegatedQuestion(session, {
    workflow: "spec-phase",
    requestType: "spec-phase-question",
    question: "How should spec phase proceed?",
  });

  const validated = validateAgentBEnvelope(answer);
  assert.equal(validated.requestType, "answer");
  assert.equal(typeof validated.payload.answer, "string");
  assert.equal(validated.payload.answer.length > 0, true);

  await stopAgentB(session);
  assert.equal(session.closed, true);

  const evidenceDir = path.join(projectRoot, "flow", "runs", runId, "agent-b");
  const evidenceFiles = await fs.readdir(evidenceDir);
  assert.equal(evidenceFiles.length > 0, true);

  const content = await fs.readFile(path.join(evidenceDir, evidenceFiles[0]), "utf8");
  assert.equal(content.includes("apiKey"), false);
  assert.equal(content.includes("rawBody"), false);
});
