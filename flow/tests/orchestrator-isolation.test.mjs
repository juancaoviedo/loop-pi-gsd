import test from "node:test";
import assert from "node:assert/strict";

import { buildIsolationDescriptors, buildOrchestratorRunId } from "../orchestrator/isolation.mjs";

const SELECTED = [
  { phaseNumber: 3, id: "phase-03", name: "Three" },
  { phaseNumber: 4, id: "phase-04", name: "Four" },
];

test("buildOrchestratorRunId is deterministic for identical inputs", () => {
  const first = buildOrchestratorRunId({ selectedPhases: SELECTED, stateDigest: "state-a" });
  const second = buildOrchestratorRunId({ selectedPhases: SELECTED, stateDigest: "state-a" });
  assert.equal(first, second);
});

test("buildIsolationDescriptors emits unique paths per selected phase", () => {
  const runId = buildOrchestratorRunId({ selectedPhases: SELECTED, stateDigest: "state-a" });
  const descriptors = buildIsolationDescriptors({
    runId,
    selectedPhases: SELECTED,
    projectRoot: "/tmp/project",
  });

  assert.equal(descriptors.length, 2);
  assert.notEqual(descriptors[0].phaseContextPath, descriptors[1].phaseContextPath);
  assert.ok(descriptors[0].phaseContextPath.includes("phase-03"));
  assert.ok(descriptors[1].phaseContextPath.includes("phase-04"));
});
