import test from "node:test";
import assert from "node:assert/strict";

import { parseRoadmapPhases, selectTargetPhases } from "../orchestrator/select-phases.mjs";

const ROADMAP_SAMPLE = `
### Phase 1: A
**Goal:** Goal A
**Requirements:** R1, R2

### Phase 2: B
**Goal:** Goal B
**Requirements:** R3

### Phase 3: C
**Goal:** Goal C
**Requirements:** R4
`;

test("parseRoadmapPhases extracts numbered phases deterministically", () => {
  const phases = parseRoadmapPhases(ROADMAP_SAMPLE);
  assert.equal(phases.length, 3);
  assert.equal(phases[0].phaseNumber, 1);
  assert.equal(phases[2].name, "C");
  assert.deepEqual(phases[1].requirements, ["R3"]);
});

test("selectTargetPhases defaults to pending phases after completed count", () => {
  const phases = parseRoadmapPhases(ROADMAP_SAMPLE);
  const selected = selectTargetPhases({ phases, completedPhases: 1, currentPhase: 2, options: {} });
  assert.deepEqual(selected.map((phase) => phase.phaseNumber), [2, 3]);
});

test("selectTargetPhases respects explicit phase filter and limit", () => {
  const phases = parseRoadmapPhases(ROADMAP_SAMPLE);
  const selected = selectTargetPhases({
    phases,
    completedPhases: 0,
    currentPhase: 1,
    options: { phaseNumbers: [3, 1], limit: 1 },
  });
  assert.deepEqual(selected.map((phase) => phase.phaseNumber), [1]);
});
