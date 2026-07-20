import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { closeAgentBSession, openAgentBSession, runDelegatedRound } from "../orchestrator/agent-b-session.mjs";
import { assertPhase9RuntimeScope, SCOPE_REASON_CODES } from "../orchestrator/agent-b-scope-lock.mjs";
import { normalizeDelegationRecords } from "../governance/delegation-evidence.mjs";

async function makeSandbox() {
  const projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), "flow-agent-b-workflow-"));
  const configPath = path.join(projectRoot, "agent-b.config.json");
  await fs.writeFile(configPath, JSON.stringify({
    providerId: "stub-b",
    modelId: "stub-model-b",
  }, null, 2));
  return { projectRoot, configPath };
}

test("phase-scoped session serves spec/discuss on same pid and closes cleanly", async () => {
  const { projectRoot, configPath } = await makeSandbox();
  const session = await openAgentBSession({
    projectRoot,
    runId: "workflow-e2e",
    phaseNumber: 9,
    config: { configPath },
  });

  const firstPid = session.pid;
  assert.equal(Number.isInteger(firstPid), true);

  const specRound = await runDelegatedRound(session, {
    workflow: "spec-phase",
    question: "spec question",
  });

  const discussRound = await runDelegatedRound(session, {
    workflow: "discuss-phase",
    question: "discuss question",
  });

  assert.equal(session.pid, firstPid);
  assert.equal(specRound.authority, "agent-a");
  assert.equal(discussRound.authority, "agent-a");
  assert.equal(typeof specRound.answer, "string");
  assert.equal(typeof discussRound.answer, "string");

  const normalized = normalizeDelegationRecords([
    { ...specRound, phaseNumber: 9, questionId: "q-spec" },
    { ...discussRound, phaseNumber: 9, questionId: "q-discuss" },
  ]);

  assert.equal(normalized[0].agentId, "agent-b");
  assert.equal(normalized[0].authority, "agent-a");
  assert.equal(normalized[1].authority, "agent-a");

  await closeAgentBSession(session);

  await assert.rejects(
    runDelegatedRound(session, {
      workflow: "spec-phase",
      question: "should fail",
    }),
    { code: "agent_b.session_closed" },
  );

  const evidenceDir = path.join(projectRoot, "flow", "runs", "workflow-e2e", "agent-b");
  const files = await fs.readdir(evidenceDir);
  assert.equal(files.length >= 2, true);

  const sample = JSON.parse(await fs.readFile(path.join(evidenceDir, files[0]), "utf8"));
  assert.equal("apiKey" in (sample.providerMetadata ?? {}), false);
  assert.equal("rawBody" in (sample.providerMetadata ?? {}), false);
});

test("scope-lock rejects consensus/debate/agora and allows ask-answer types", () => {
  assert.throws(
    () => assertPhase9RuntimeScope({ mode: "consensus" }),
    { code: SCOPE_REASON_CODES.consensus_disabled },
  );

  assert.throws(
    () => assertPhase9RuntimeScope({ transport: "agora" }),
    { code: SCOPE_REASON_CODES.agora_disabled },
  );

  assert.equal(assertPhase9RuntimeScope({ requestType: "spec-phase-question" }), true);
  assert.equal(assertPhase9RuntimeScope({ requestType: "discuss-phase-question" }), true);
});
