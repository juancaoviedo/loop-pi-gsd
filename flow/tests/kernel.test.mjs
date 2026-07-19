import test from "node:test";
import assert from "node:assert/strict";

import {
  FLOW_CANONICAL_WORKFLOWS,
  assertCanonicalFlowCommand,
  normalizeFlowCommand,
} from "../kernel/commands.mjs";
import { enforceFlowPolicy, isFlowCustomType } from "../kernel/policy.mjs";

test("normalizeFlowCommand accepts only exact canonical flow commands", () => {
  assert.equal(normalizeFlowCommand("/flow-create-additional-phases"), FLOW_CANONICAL_WORKFLOWS.CREATE_ADDITIONAL_PHASES);
  assert.equal(normalizeFlowCommand("flow-create-additional-phases"), FLOW_CANONICAL_WORKFLOWS.CREATE_ADDITIONAL_PHASES);
  assert.equal(normalizeFlowCommand("/flow-execute-all-phases"), FLOW_CANONICAL_WORKFLOWS.EXECUTE_ALL_PHASES);
  assert.equal(normalizeFlowCommand("flow-execute-all-phases"), FLOW_CANONICAL_WORKFLOWS.EXECUTE_ALL_PHASES);
  assert.equal(normalizeFlowCommand("/flow-create-additional-phases extra"), null);
  assert.equal(normalizeFlowCommand("/flow-unknown"), null);
});

test("assertCanonicalFlowCommand fails closed for malformed input", () => {
  assert.throws(() => assertCanonicalFlowCommand(""), /Unsupported Flow command/);
  assert.throws(() => assertCanonicalFlowCommand("/flow-create-additional-phases extra"), /Unsupported Flow command/);
});

test("isFlowCustomType identifies only the two canonical custom types", () => {
  assert.equal(isFlowCustomType("flow-create-additional-phases"), true);
  assert.equal(isFlowCustomType("flow-execute-all-phases"), true);
  assert.equal(isFlowCustomType("gsd-run"), false);
  assert.equal(isFlowCustomType("flow-other"), false);
});

test("enforceFlowPolicy blocks non-allowlisted tools", () => {
  const allowedToolsByWorkflow = {
    [FLOW_CANONICAL_WORKFLOWS.CREATE_ADDITIONAL_PHASES]: ["read", "grep"],
    [FLOW_CANONICAL_WORKFLOWS.EXECUTE_ALL_PHASES]: ["read", "grep", "subagent"],
  };

  assert.equal(
    enforceFlowPolicy({
      customType: FLOW_CANONICAL_WORKFLOWS.EXECUTE_ALL_PHASES,
      toolName: "subagent",
      allowedToolsByWorkflow,
    }),
    true,
  );

  assert.throws(
    () =>
      enforceFlowPolicy({
        customType: FLOW_CANONICAL_WORKFLOWS.CREATE_ADDITIONAL_PHASES,
        toolName: "subagent",
        allowedToolsByWorkflow,
      }),
    /blocked/,
  );
});
