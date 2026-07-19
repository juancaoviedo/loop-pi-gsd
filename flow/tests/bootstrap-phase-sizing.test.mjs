import test from "node:test";
import assert from "node:assert/strict";

import { computePhaseSizing, scoreWorkItem } from "../bootstrap/phase-sizing.mjs";

function sampleWorkItems(count) {
  return Array.from({ length: count }, (_, idx) => ({
    id: `w-${idx + 1}`,
    sectionId: `s-${Math.ceil((idx + 1) / 2)}`,
    title: `Implement API module ${idx + 1}`,
    detail: "Build API, database migration, tests, and monitoring for reliability and security.",
  }));
}

test("scoreWorkItem returns deterministic structured score", () => {
  const item = sampleWorkItems(1)[0];
  const first = scoreWorkItem(item);
  const second = scoreWorkItem(item);

  assert.deepEqual(first, second);
  assert.ok(first.score >= 4);
});

test("computePhaseSizing clamps phase count within min and max", () => {
  const workItems = sampleWorkItems(20);
  const sizing = computePhaseSizing({
    workItems,
    config: {
      minPhases: 5,
      maxPhases: 50,
      targetComplexityPerPhase: 10,
    },
  });

  assert.ok(sizing.phaseCount >= 5);
  assert.ok(sizing.phaseCount <= 50);
  assert.equal(sizing.phases.length, sizing.phaseCount);
});

test("computePhaseSizing remains stable for identical inputs", () => {
  const workItems = sampleWorkItems(12);
  const config = { minPhases: 5, maxPhases: 50, targetComplexityPerPhase: 11 };

  const first = computePhaseSizing({ workItems, config });
  const second = computePhaseSizing({ workItems, config });

  assert.equal(first.phaseCount, second.phaseCount);
  assert.deepEqual(first.phases, second.phases);
});

test("computePhaseSizing splits oversized item into parts", () => {
  const workItems = [{
    id: "w-big",
    sectionId: "s-1",
    title: "Huge integration effort",
    detail: "This work depends on API, database, migration, security, compliance, tests, benchmarking, monitoring, and rollback strategy. ".repeat(30),
  }];

  const sizing = computePhaseSizing({
    workItems,
    config: { minPhases: 1, maxPhases: 10, targetComplexityPerPhase: 8 },
  });

  const objectives = sizing.phases.flatMap((phase) => phase.objectives);
  assert.ok(objectives.length >= 2);
  assert.ok(objectives.some((item) => item.parentItemId === "w-big"));
});
