# Phase 8: Multi-Agent Spec/Discuss Architecture Contract - Pattern Map

**Mapped:** 2026-07-19
**Files analyzed:** 10
**Analogs found:** 10 / 10

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `flow/orchestrator/debate-contract.mjs` | utility | transform | `flow/lifecycle/answer-schema.mjs` | dataflow-match |
| `flow/orchestrator/debate-policy.mjs` | service | transform | `flow/governance/escalation-policy.mjs` | exact |
| `flow/orchestrator/debate-prototype.mjs` | service | event-driven | `flow/lifecycle/engine.mjs` | role-match |
| `flow/cli.mjs` (modify) | route | request-response | `flow/cli.mjs` | exact |
| `flow/orchestrator/interception.mjs` (modify) | route | event-driven | `flow/orchestrator/interception.mjs` | exact |
| `flow/orchestrator/context-pack.mjs` (modify) | service | file-I/O | `flow/orchestrator/context-pack.mjs` | exact |
| `flow/governance/discussion-log.mjs` (modify) | service | file-I/O | `flow/governance/discussion-log.mjs` | exact |
| `flow/tests/orchestrator-debate-contract.test.mjs` | test | transform | `flow/tests/lifecycle-retry.test.mjs` | role-match |
| `flow/tests/orchestrator-debate-policy.test.mjs` | test | transform | `flow/tests/governance-escalation.test.mjs` | exact |
| `flow/tests/orchestrator-debate-prototype.test.mjs` | test | event-driven | `flow/tests/orchestrator-context-pack.test.mjs` | role-match |

## Pattern Assignments

### `flow/orchestrator/debate-contract.mjs` (utility, transform)

**Analog:** `flow/lifecycle/answer-schema.mjs`

**Validation shape pattern** (lines 1-33):
```javascript
export function validateResponderAnswer(payload) {
  const errors = [];
  if (!payload || typeof payload !== "object") {
    return { valid: false, errors: ["Responder payload must be an object."] };
  }
  // field-level checks collected into errors[]
  return { valid: errors.length === 0, errors };
}
```

**Fail-closed assertion pattern** (lines 35-43):
```javascript
export function assertValidResponderAnswer(payload) {
  const validation = validateResponderAnswer(payload);
  if (!validation.valid) {
    const error = new Error(`Invalid responder payload: ${validation.errors.join(" ")}`);
    error.retryable = false;
    throw error;
  }
  return payload;
}
```

Apply this shape to event-family validators: `validateEventEnvelope`, `assertValidDebateEvent`, and unknown-major rejection.

---

### `flow/orchestrator/debate-policy.mjs` (service, transform)

**Analog:** `flow/governance/escalation-policy.mjs`

**Default policy + merge pattern** (lines 1-12):
```javascript
export const DEFAULT_ESCALATION_POLICY = Object.freeze({
  riskThreshold: 0.7,
  confidenceThreshold: 0.6,
  escalateOnFailedVerification: true,
});

function normalizePolicy(policy = {}) {
  return { ...DEFAULT_ESCALATION_POLICY, ...policy };
}
```

**Deterministic reason collection pattern** (lines 14-43):
```javascript
const reasons = [];
if (cfg.escalateOnFailedVerification && hasFailedLifecycle) {
  reasons.push("lifecycle_failed_or_unverified");
}
for (const record of delegationRecords) {
  if (typeof record.riskScore === "number" && record.riskScore >= cfg.riskThreshold) {
    reasons.push(`high_risk:${record.questionId}`);
  }
}
const escalate = reasons.length > 0;
return { schemaVersion: 1, escalate, gateStatus: escalate ? "human-review-required" : "auto-approved", reasons, policy: cfg };
```

Use this with Phase 8 precedence lock: blocker reasons first, then threshold path.

---

### `flow/orchestrator/debate-prototype.mjs` (service, event-driven)

**Analog:** `flow/lifecycle/engine.mjs`

**Imported seam composition pattern** (lines 1-4):
```javascript
import { assertValidResponderAnswer } from "./answer-schema.mjs";
import { runStepWithRetry } from "./retry-policy.mjs";
```

**Step orchestration + fail-fast return pattern** (lines 36-78):
```javascript
for (const step of ORDERED_STEPS) {
  const execution = await runStepWithRetry({ step, policy, runner: async ({ attempt }) => stepExecutor({ step, attempt }) });
  if (!execution.ok) {
    finalizeLifecycleLedger(lifecycle, { status: "failed", terminalReason: `step:${step}` });
    return lifecycle;
  }
}
```

**Validation gate before continuing pattern** (lines 63-78):
```javascript
if (stepResult.requiresResponder === true) {
  try {
    assertValidResponderAnswer(responderAnswer);
  } catch (error) {
    recordStepStatus(lifecycle, { step, status: "failed", error: error.message });
    finalizeLifecycleLedger(lifecycle, { status: "failed", terminalReason: `step:${step}` });
    return lifecycle;
  }
}
```

Implement transcript replay determinism using this style: return immediately on first blocking condition.

---

### `flow/cli.mjs` (modify; route, request-response)

**Analog:** `flow/cli.mjs`

**Top-level import fan-in convention** (lines 6-25):
```javascript
import { buildInterceptionMetadata } from "./orchestrator/interception.mjs";
import { buildResponderContextPack } from "./orchestrator/context-pack.mjs";
```

**Arg parsing switch convention** (lines 49-100):
```javascript
for (let i = 0; i < argv.length; i += 1) {
  const token = argv[i];
  if (token === "--phase") { ... }
  else if (token === "--run-governance") { ... }
}
```

**Feature-gated execution branch convention** (lines 338-347):
```javascript
if (workflow === "flow-execute-all-phases" && argv.length > 3) {
  const result = await runExecutionOrchestrator({ argv: argv.slice(3) });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return;
}
```

Add a parallel branch for phase-8 prototype mode with deterministic JSON output.

---

### `flow/orchestrator/interception.mjs` (modify; route, event-driven)

**Analog:** `flow/orchestrator/interception.mjs`

**Rule-table constant pattern** (lines 1-14):
```javascript
const DEFAULT_INTERCEPT_RULES = Object.freeze([
  { workflow: "spec-phase", interactionType: "question-round", route: "responder-agent", policy: "deterministic-context-pack" },
  { workflow: "discuss-phase", interactionType: "question-round", route: "responder-agent", policy: "deterministic-context-pack" },
]);
```

**Versioned metadata return pattern** (lines 16-26):
```javascript
return {
  schemaVersion: 1,
  interceptionEnabled: true,
  phases: selectedPhases.map((phase) => ({ phaseNumber: phase.phaseNumber, phaseId: phase.id, rules: DEFAULT_INTERCEPT_RULES })),
};
```

Extend by adding Phase 8 event-family metadata without changing default workflow scope.

---

### `flow/orchestrator/context-pack.mjs` (modify; service, file-I/O)

**Analog:** `flow/orchestrator/context-pack.mjs`

**Allowlist constant + fs/path imports** (lines 1-12):
```javascript
import fs from "node:fs/promises";
import path from "node:path";
const ALLOWLISTED_ARTIFACTS = Object.freeze([".planning/PROJECT.md", ".planning/REQUIREMENTS.md", ...]);
```

**Directory resolution fallback pattern** (lines 14-24):
```javascript
try {
  const children = await fs.readdir(phasesDir, { withFileTypes: true });
  const match = children.find((item) => item.isDirectory() && item.name.startsWith(`${padded}-`));
  return match ? path.join(".planning", "phases", match.name) : null;
} catch {
  return null;
}
```

**Fail-closed empty artifact guard** (lines 68-70):
```javascript
if (artifacts.length === 0) {
  throw new Error("No allowlisted artifacts available for context-pack generation.");
}
```

Retain this pattern for debate prototype context inputs.

---

### `flow/governance/discussion-log.mjs` (modify; service, file-I/O)

**Analog:** `flow/governance/discussion-log.mjs`

**Markdown table renderer pattern** (lines 12-28):
```javascript
const lines = [
  `### Run ${runId} - Phase ${String(phaseNumber).padStart(2, "0")}`,
  "",
  "| Timestamp | Question Id | Agent | Question | Answer | Confidence | Escalation |",
  "|-----------|-------------|-------|----------|--------|------------|------------|",
];
```

**Sanitize pipe characters before writing** (line 22):
```javascript
String(record.question ?? "").replace(/\|/g, "\\|")
```

**Append or bootstrap file pattern** (lines 36-47):
```javascript
let existing = "";
try { existing = await fs.readFile(filePath, "utf8"); }
catch { existing = "# DISCUSSION LOG\n\n## Session Entries\n\n"; }
await fs.writeFile(filePath, `${next}\n`, "utf8");
```

For D-12, keep this append path but persist only sanitized metadata fields from Phase 8 events.

---

### `flow/tests/orchestrator-debate-contract.test.mjs` (test, transform)

**Analog:** `flow/tests/lifecycle-retry.test.mjs`

**Node test + strict assert import convention** (lines 1-5):
```javascript
import test from "node:test";
import assert from "node:assert/strict";
```

**Fail-closed invalid payload assertion style** (lines 45-71):
```javascript
const lifecycle = await runLifecycleForPhase({ responderAnswer: { questionId: "q-1", answer: "", confidence: 1.2 }, ... });
assert.equal(lifecycle.status, "failed");
```

Use this pattern to assert unknown schema major, unknown eventType, malformed payload.

---

### `flow/tests/orchestrator-debate-policy.test.mjs` (test, transform)

**Analog:** `flow/tests/governance-escalation.test.mjs`

**Deterministic reason assertions** (lines 33-41):
```javascript
const result = evaluateEscalation({ ... });
assert.equal(result.escalate, true);
assert.ok(result.reasons.some((reason) => reason.startsWith("high_risk:")));
assert.ok(result.reasons.some((reason) => reason.startsWith("low_confidence:")));
```

**Policy threshold override setup pattern** (lines 33-37):
```javascript
policy: { riskThreshold: 0.7, confidenceThreshold: 0.6 }
```

Mirror this to test precedence: conflict/risk blockers override proceed even when confidence >= threshold.

---

### `flow/tests/orchestrator-debate-prototype.test.mjs` (test, event-driven)

**Analog:** `flow/tests/orchestrator-context-pack.test.mjs`

**Filesystem-backed deterministic fixture setup** (lines 12-24):
```javascript
const projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), "flow-orch-pack-"));
await fs.mkdir(path.join(projectRoot, ".planning", "phases", "03-phase-reader-and-execution-orchestrator"), { recursive: true });
```

**Manifest replay assertion style** (lines 49-53):
```javascript
const payload = { runId: "orchestrator-abc", selectedPhases, descriptors, interception, contextPack: pack };
const { manifestPath } = await persistOrchestratorManifest({ projectRoot, runId: "orchestrator-abc", payload });
const saved = JSON.parse(await fs.readFile(manifestPath, "utf8"));
assert.equal(saved.contextPack.schemaVersion, 1);
```

Use same pattern for replay tests: identical transcript + policy => identical decision + reasonCodes.

## Shared Patterns

### Schema Versioning and Fail-Closed Validation
**Source:** `flow/lifecycle/answer-schema.mjs` (lines 1-43), `flow/orchestrator/interception.mjs` (lines 16-26)
**Apply to:** `flow/orchestrator/debate-contract.mjs`, `flow/orchestrator/debate-prototype.mjs`
```javascript
return { schemaVersion: 1, ... };
if (!validation.valid) {
  const error = new Error(`Invalid responder payload: ${validation.errors.join(" ")}`);
  error.retryable = false;
  throw error;
}
```

### Deterministic Precedence and Reason Collection
**Source:** `flow/governance/escalation-policy.mjs` (lines 14-43)
**Apply to:** `flow/orchestrator/debate-policy.mjs`, `flow/orchestrator/debate-prototype.mjs`
```javascript
const reasons = [];
// push blocker reasons first
const escalate = reasons.length > 0;
return { escalate, reasons, policy: cfg };
```

### Bounded Retry Semantics
**Source:** `flow/lifecycle/retry-policy.mjs` (lines 28-64)
**Apply to:** `flow/orchestrator/debate-prototype.mjs`
```javascript
if (attempt >= normalized.maxRetries) return false;
if (error && error.retryable === false) return false;
```

### File I/O Guardrails and Markdown Persistence
**Source:** `flow/orchestrator/context-pack.mjs` (lines 48-70), `flow/governance/discussion-log.mjs` (lines 30-47)
**Apply to:** `flow/governance/discussion-log.mjs`, prototype transcript persistence utilities
```javascript
try { existing = await fs.readFile(filePath, "utf8"); }
catch { existing = "# DISCUSSION LOG\n\n## Session Entries\n\n"; }
```

### Test Conventions
**Source:** `flow/tests/lifecycle-retry.test.mjs` (lines 1-71), `flow/tests/governance-escalation.test.mjs` (lines 1-45), `flow/tests/orchestrator-context-pack.test.mjs` (lines 1-57)
**Apply to:** all new `flow/tests/orchestrator-debate-*.test.mjs`
```javascript
import test from "node:test";
import assert from "node:assert/strict";
```

## No Analog Found

None. All Phase 8 likely files have strong role/dataflow analogs in existing `flow/orchestrator`, `flow/lifecycle`, `flow/governance`, and `flow/tests` modules.

## Metadata

**Analog search scope:** `flow/orchestrator/`, `flow/lifecycle/`, `flow/governance/`, `flow/tests/`
**Files scanned:** 33
**Pattern extraction date:** 2026-07-19
