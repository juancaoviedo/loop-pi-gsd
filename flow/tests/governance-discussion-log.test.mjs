import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { appendDiscussionLog } from "../governance/discussion-log.mjs";

test("appendDiscussionLog writes agent-to-agent trace into phase DISCUSSION-LOG", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "flow-gov-discussion-"));
  const phaseDir = path.join(root, ".planning", "phases", "05-evidence-memory-and-controlled-escalation");
  await fs.mkdir(phaseDir, { recursive: true });
  await fs.writeFile(path.join(phaseDir, "DISCUSSION-LOG.md"), "# DISCUSSION LOG\n\n## Session Entries\n", "utf8");

  try {
    const appended = await appendDiscussionLog({
      projectRoot: root,
      runId: "orchestrator-test",
      phaseNumber: 5,
      records: [
        {
          questionId: "phase-05-default",
          agentId: "responder-agent",
          question: "What context should be used?",
          answer: "Use PROJECT, REQUIREMENTS, ROADMAP, STATE, OBJECTIVE, and phase artifacts.",
          confidence: 0.8,
          escalationDisposition: "none",
          createdAt: "2026-07-19T00:00:00Z",
        },
      ],
    });

    assert.ok(appended.filePath.endsWith("DISCUSSION-LOG.md"));
    const saved = await fs.readFile(appended.filePath, "utf8");
    assert.ok(saved.includes("Run orchestrator-test - Phase 05"));
    assert.ok(saved.includes("What context should be used?"));
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
