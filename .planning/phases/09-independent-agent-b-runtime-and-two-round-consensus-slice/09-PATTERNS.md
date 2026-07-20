# Phase 09: independent-agent-b-runtime-and-two-round-consensus-slice - Pattern Map

**Mapped:** 2026-07-19
**Files analyzed:** 15
**Analogs found:** 15 / 15

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `flow/orchestrator/agent-b-runtime.mjs` | service | request-response | `flow/orchestrator/debate-prototype.mjs` | partial |
| `flow/orchestrator/agent-b-protocol.mjs` | utility | request-response | `flow/orchestrator/debate-contract.mjs` | role-match |
| `flow/orchestrator/interception.mjs` | utility | request-response | `flow/orchestrator/interception.mjs` | exact |
| `flow/orchestrator/context-pack.mjs` | utility | file-I/O | `flow/orchestrator/context-pack.mjs` | exact |
| `flow/orchestrator/run-manifest.mjs` | utility | file-I/O | `flow/orchestrator/run-manifest.mjs` | exact |
| `flow/lifecycle/engine.mjs` | service | request-response | `flow/lifecycle/engine.mjs` | exact |
| `flow/lifecycle/answer-schema.mjs` | utility | request-response | `flow/lifecycle/answer-schema.mjs` | exact |
| `flow/lifecycle/retry-policy.mjs` | utility | request-response | `flow/lifecycle/retry-policy.mjs` | exact |
| `flow/governance/discussion-log.mjs` | service | file-I/O | `flow/governance/discussion-log.mjs` | exact |
| `flow/governance/delegation-evidence.mjs` | utility | transform | `flow/governance/delegation-evidence.mjs` | exact |
| `flow/governance/escalation-policy.mjs` | utility | transform | `flow/governance/escalation-policy.mjs` | exact |
| `flow/cli.mjs` | controller | request-response | `flow/cli.mjs` | exact |
| `flow/tests/orchestrator-agent-b-runtime.test.mjs` | test | request-response | `flow/tests/orchestrator-context-pack.test.mjs` | role-match |
| `flow/tests/orchestrator-agent-b-scope-lock.test.mjs` | test | request-response | `flow/tests/orchestrator-debate-prototype.test.mjs` | role-match |
| `flow/tests/lifecycle-agent-b-delegation-e2e.test.mjs` | test | request-response | `flow/tests/lifecycle-retry.test.mjs` | role-match |

## Pattern Assignments

### `flow/orchestrator/agent-b-runtime.mjs` (service, request-response)

**Primary analog:** `flow/orchestrator/debate-prototype.mjs`

**Supporting analogs:** `flow/lifecycle/retry-policy.mjs`, `flow/orchestrator/run-manifest.mjs`, `flow/governance/discussion-log.mjs`

**Imports pattern** (`flow/orchestrator/debate-prototype.mjs` lines 1-3):
```javascript
import { sanitizeProviderMetadata } from "../governance/discussion-log.mjs";
import { validateDebateEventEnvelope } from "./debate-contract.mjs";
import { evaluateDebateDecision } from "./debate-policy.mjs";
```

**Config normalization + scope gate** (`flow/orchestrator/debate-prototype.mjs` lines 5-31, 37-43):
```javascript
export const DEFAULT_PROTOTYPE_CONFIG = Object.freeze({
  confidenceThreshold: 0.75,
  maxRounds: 3,
  maxInvalidAnswerRetries: 1,
  answerTimeoutMs: 5_000,
});

function normalizeConfig(policyConfig = {}) {
  return {
    confidenceThreshold: typeof policyConfig.confidenceThreshold === "number"
      ? policyConfig.confidenceThreshold
      : DEFAULT_PROTOTYPE_CONFIG.confidenceThreshold,
    maxRounds: Number.isInteger(policyConfig.maxRounds)
      ? policyConfig.maxRounds
      : DEFAULT_PROTOTYPE_CONFIG.maxRounds,
    maxInvalidAnswerRetries: Number.isInteger(policyConfig.maxInvalidAnswerRetries)
      ? policyConfig.maxInvalidAnswerRetries
      : DEFAULT_PROTOTYPE_CONFIG.maxInvalidAnswerRetries,
    answerTimeoutMs: Number.isInteger(policyConfig.answerTimeoutMs)
      ? policyConfig.answerTimeoutMs
      : DEFAULT_PROTOTYPE_CONFIG.answerTimeoutMs,
  };
}

if (!ALLOWED_WORKFLOWS.has(workflow)) {
  throw buildPrototypeError(
    "workflow_scope_violation",
    `Workflow '${workflow}' is out of scope. Phase-8 prototype supports only spec-phase and discuss-phase.`,
  );
}
```

**Retry wrapper pattern** (`flow/lifecycle/retry-policy.mjs` lines 28-55):
```javascript
export async function runStepWithRetry({ step, policy, runner }) {
  if (typeof runner !== "function") {
    throw new Error("runStepWithRetry requires a runner function.");
  }

  const normalized = normalizePolicy(policy);
  let attempt = 0;

  while (true) {
    try {
      const result = await runner({ attempt });
      return {
        ok: true,
        attempts: attempt + 1,
        result,
      };
    } catch (error) {
      const canRetry = shouldRetryStep({ step, attempt, error, policy: normalized });
      if (!canRetry) {
        return {
          ok: false,
          attempts: attempt + 1,
          error,
        };
      }
      attempt += 1;
    }
  }
}
```

**Artifact persistence shape** (`flow/orchestrator/run-manifest.mjs` lines 4-15):
```javascript
export async function persistOrchestratorManifest({ projectRoot, runId, payload }) {
  if (!projectRoot || !runId || !payload) {
    throw new Error("Missing manifest inputs.");
  }

  const runDir = path.join(projectRoot, "flow", "runs", runId);
  await fs.mkdir(path.join(runDir, "phases"), { recursive: true });
  const manifestPath = path.join(runDir, "orchestrator-manifest.json");
  await fs.writeFile(manifestPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  return {
    manifestPath,
  };
}
```

**Sanitized provider metadata pattern** (`flow/governance/discussion-log.mjs` lines 9-18):
```javascript
export function sanitizeProviderMetadata(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {};
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(input)) {
    if (!PROVIDER_METADATA_ALLOWLIST.has(key)) continue;
    sanitized[key] = value;
  }
  return sanitized;
}
```

**Use for Phase 9:** Build the child-process manager with the same normalize-then-fail-closed structure as `runDebatePrototype`, wrap ask/answer attempts with `runStepWithRetry`, and persist startup/handshake/request/response/shutdown evidence under `flow/runs/<run-id>/agent-b/` with the same JSON file writing pattern as `persistOrchestratorManifest`.

---

### `flow/orchestrator/agent-b-protocol.mjs` (utility, request-response)

**Analog:** `flow/orchestrator/debate-contract.mjs`

**Contract error + supported roles** (lines 1-14):
```javascript
const SUPPORTED_SCHEMA_MAJOR = 1;

export const SUPPORTED_DEBATE_EVENT_TYPES = Object.freeze([
  "proposal",
  "critique",
  "revision",
  "vote",
  "consensus",
  "timeout",
  "error",
]);

const SUPPORTED_AGENT_ROLES = new Set(["agent-a", "agent-b"]);
```

**Fail-closed schema version check** (lines 78-93):
```javascript
export function assertSupportedSchemaMajor(schemaVersion) {
  if (schemaVersion === undefined || schemaVersion === null) {
    throw buildContractError("malformed_payload", "schemaVersion is required.");
  }

  const majorToken = String(schemaVersion).trim().split(".")[0];
  const major = Number(majorToken);
  if (!Number.isInteger(major) || major !== SUPPORTED_SCHEMA_MAJOR) {
    throw buildContractError(
      "unsupported_schema_major",
      `Unsupported schema major version: ${schemaVersion}. Supported major: ${SUPPORTED_SCHEMA_MAJOR}.`,
    );
  }

  return major;
}
```

**Envelope validation pattern** (lines 95-151):
```javascript
export function validateDebateEventEnvelope(event) {
  if (!isObjectLike(event)) {
    throw buildContractError("malformed_payload", "Debate event must be an object.");
  }

  const normalizedEvent = normalizeDebateTextFields(event);

  assertSupportedSchemaMajor(normalizedEvent.schemaVersion);

  const requiredFields = [
    "runId",
    "phaseNumber",
    "eventType",
    "timestampIso",
    "correlationId",
    "agentRole",
    "confidence",
    "payload",
  ];

  for (const fieldName of requiredFields) {
    if (!(fieldName in normalizedEvent)) {
      throw buildContractError("malformed_payload", `Missing required field: ${fieldName}.`);
    }
  }

  validatePayloadByEventType(normalizedEvent.eventType, normalizedEvent.payload);
  return normalizedEvent;
}
```

**Use for Phase 9:** Keep one strict JSONL envelope validator with `schemaVersion`, `requestType`, `correlationId`, and payload requirements. Invalid lines should raise machine-readable contract errors first, not permissive parsing fallbacks.

---

### `flow/orchestrator/interception.mjs` (utility, request-response)

**Analog:** `flow/orchestrator/interception.mjs`

**Rule table pattern** (lines 1-16):
```javascript
const DEFAULT_INTERCEPT_RULES = Object.freeze([
  {
    workflow: "spec-phase",
    interactionType: "question-round",
    route: "responder-agent",
    policy: "deterministic-context-pack",
    contractScope: "phase8-spec-discuss-only",
  },
  {
    workflow: "discuss-phase",
    interactionType: "question-round",
    route: "responder-agent",
    policy: "deterministic-context-pack",
    contractScope: "phase8-spec-discuss-only",
  },
]);
```

**Metadata shape** (lines 18-33):
```javascript
export function buildInterceptionMetadata({ selectedPhases }) {
  return {
    schemaVersion: 1,
    interceptionEnabled: true,
    debateContract: {
      schemaVersion: "1.0.0",
      supportedWorkflows: ["spec-phase", "discuss-phase"],
      roleBoundary: "agent-a-controls-policy_agent-b-answer-only",
    },
    phases: selectedPhases.map((phase) => ({
      phaseNumber: phase.phaseNumber,
      phaseId: phase.id,
      rules: DEFAULT_INTERCEPT_RULES,
    })),
  };
}
```

**Use for Phase 9:** Extend the same static metadata table rather than inventing per-call routing logic. Add runtime-mode or transport metadata here if the child-process path needs to be discoverable downstream.

---

### `flow/orchestrator/context-pack.mjs` (utility, file-I/O)

**Analog:** `flow/orchestrator/context-pack.mjs`

**Allowlist + phase artifact collection** (lines 4-15, 19-37):
```javascript
const ALLOWLISTED_ARTIFACTS = Object.freeze([
  ".planning/PROJECT.md",
  ".planning/REQUIREMENTS.md",
  ".planning/ROADMAP.md",
  ".planning/STATE.md",
  ".planning/OBJECTIVE.md",
  ".planning/OBJECTIVE.html",
  ".planning/OBJECTIVE.pdf",
]);

async function collectPhaseArtifacts(projectRoot, selectedPhases) {
  const out = [];
  for (const phase of selectedPhases) {
    const phaseDir = await resolvePhaseDirectory(projectRoot, phase.phaseNumber);
    if (!phaseDir) continue;

    const candidates = [
      `${phaseDir}/DISCUSSION-LOG.md`,
      `${phaseDir}/${String(phase.phaseNumber).padStart(2, "0")}-SPEC.md`,
      `${phaseDir}/${String(phase.phaseNumber).padStart(2, "0")}-CONTEXT.md`,
      `${phaseDir}/${String(phase.phaseNumber).padStart(2, "0")}-01-PLAN.md`,
      `${phaseDir}/${String(phase.phaseNumber).padStart(2, "0")}-01-SUMMARY.md`,
    ];
```

**Deterministic pack return shape** (lines 52-73):
```javascript
export async function buildResponderContextPack({ projectRoot, selectedPhases, descriptors }) {
  const artifacts = [];
  for (const relPath of ALLOWLISTED_ARTIFACTS) {
    const artifact = await readArtifactIfExists(projectRoot, relPath);
    if (artifact) artifacts.push(artifact);
  }

  const phaseArtifacts = await collectPhaseArtifacts(projectRoot, selectedPhases);
  artifacts.push(...phaseArtifacts);

  if (artifacts.length === 0) {
    throw new Error("No allowlisted artifacts available for context-pack generation.");
  }

  return {
    schemaVersion: 1,
    contractScope: "phase8-spec-discuss-only",
    contractSchemaVersion: "1.0.0",
    projectRoot,
    artifactPaths: artifacts.map((artifact) => artifact.path),
    artifacts,
```

**Use for Phase 9:** Reuse the current allowlist-and-collect pattern. If Agent B needs a startup handshake context summary, derive it from this deterministic pack instead of adding new ad hoc project reads.

---

### `flow/orchestrator/run-manifest.mjs` (utility, file-I/O)

**Analog:** `flow/orchestrator/run-manifest.mjs`

**Run-local directory convention** (lines 4-15):
```javascript
export async function persistOrchestratorManifest({ projectRoot, runId, payload }) {
  if (!projectRoot || !runId || !payload) {
    throw new Error("Missing manifest inputs.");
  }

  const runDir = path.join(projectRoot, "flow", "runs", runId);
  await fs.mkdir(path.join(runDir, "phases"), { recursive: true });
  const manifestPath = path.join(runDir, "orchestrator-manifest.json");
  await fs.writeFile(manifestPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
```

**Use for Phase 9:** Persist Agent B startup and request/response evidence inside the same `flow/runs/<run-id>/...` tree. Add an `agent-b/` subdirectory instead of introducing a second root artifact location.

---

### `flow/lifecycle/engine.mjs` (service, request-response)

**Analog:** `flow/lifecycle/engine.mjs`

**Step loop + retry integration** (lines 25-53):
```javascript
export async function runLifecycleForPhase({
  phase,
  descriptor,
  runId,
  policy,
  responderAnswer,
  stepExecutor = defaultStepExecutor,
}) {
  const ledger = createLifecycleLedger({ phase, runId });
  const lifecycle = {
    ...ledger,
    verification: null,
    evidenceRefs: [],
  };

  for (const step of ORDERED_STEPS) {
    recordStepStatus(lifecycle, { step, status: "started" });

    const execution = await runStepWithRetry({
      step,
      policy,
      runner: async ({ attempt }) => stepExecutor({ step, phase, descriptor, attempt, lifecycle }),
    });
```

**Fail-closed responder validation** (lines 54-77):
```javascript
    if (stepResult.requiresResponder === true) {
      try {
        assertValidResponderAnswer(responderAnswer);
      } catch (error) {
        recordStepStatus(lifecycle, {
          step,
          status: "failed",
          attempts: execution.attempts,
          error: error instanceof Error ? error.message : String(error),
        });
        finalizeLifecycleLedger(lifecycle, {
          status: "failed",
          terminalReason: `step:${step}`,
        });
        return lifecycle;
      }
      recordStepStatus(lifecycle, {
        step,
        status: "responder_validated",
        attempts: execution.attempts,
      });
    }
```

**Use for Phase 9:** Keep delegated Agent B responses on the lifecycle boundary that already validates and blocks progression. Extend the executor inputs or responderAnswer shape rather than adding a parallel execution gate outside the ledger.

---

### `flow/lifecycle/answer-schema.mjs` (utility, request-response)

**Analog:** `flow/lifecycle/answer-schema.mjs`

**Payload validator pattern** (lines 1-33):
```javascript
export function validateResponderAnswer(payload) {
  const errors = [];

  if (!payload || typeof payload !== "object") {
    return {
      valid: false,
      errors: ["Responder payload must be an object."],
    };
  }

  if (typeof payload.questionId !== "string" || payload.questionId.trim().length === 0) {
    errors.push("questionId must be a non-empty string.");
  }

  if (typeof payload.answer !== "string" || payload.answer.trim().length === 0) {
    errors.push("answer must be a non-empty string.");
  }
```

**Assertion wrapper** (lines 35-43):
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

**Use for Phase 9:** Keep free-text answer support inside a strict validated envelope. If Phase 9 adds correlation or request type fields, mirror this split between pure validation and an assertion wrapper that marks invalid answers as fail-closed.

---

### `flow/lifecycle/retry-policy.mjs` (utility, request-response)

**Analog:** `flow/lifecycle/retry-policy.mjs`

**Policy normalization** (lines 1-26):
```javascript
const DEFAULT_RETRYABLE_STEPS = Object.freeze(["discuss", "plan", "execute", "verify"]);

export const DEFAULT_RETRY_POLICY = Object.freeze({
  maxRetries: 1,
  retryableSteps: DEFAULT_RETRYABLE_STEPS,
});

function normalizePolicy(policy = {}) {
  const merged = {
    ...DEFAULT_RETRY_POLICY,
    ...policy,
  };

  if (!Number.isInteger(merged.maxRetries) || merged.maxRetries < 0) {
    throw new Error("Invalid retry policy: maxRetries must be a non-negative integer.");
  }
```

**Retry predicate** (lines 28-34):
```javascript
export function shouldRetryStep({ step, attempt, error, policy }) {
  const normalized = normalizePolicy(policy);
  if (!normalized.retryableSteps.includes(step)) return false;
  if (attempt >= normalized.maxRetries) return false;
  if (error && error.retryable === false) return false;
  return true;
}
```

**Use for Phase 9:** Preserve this `error.retryable === false` contract. Protocol and startup failures that should retry must set `retryable = true`; schema-invalid final answers should remain non-retryable unless Phase 9 explicitly classifies them as transport/protocol failures first.

---

### `flow/governance/discussion-log.mjs` (service, file-I/O)

**Analog:** `flow/governance/discussion-log.mjs`

**Provider allowlist** (lines 4-18):
```javascript
const PROVIDER_METADATA_ALLOWLIST = new Set([
  "providerName",
  "providerLatencyMs",
  "providerStatusCode",
  "providerRequestId",
]);

export function sanitizeProviderMetadata(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {};
  }
```

**Markdown rendering + append pattern** (lines 30-68):
```javascript
function renderEntry({ runId, phaseNumber, records }) {
  const lines = [
    `### Run ${runId} - Phase ${String(phaseNumber).padStart(2, "0")}`,
    "",
    "| Timestamp | Question Id | Agent | Question | Answer | Confidence | Escalation | Provider Metadata |",
    "|-----------|-------------|-------|----------|--------|------------|------------|-------------------|",
  ];
  ...
}

export async function appendDiscussionLog({ projectRoot, runId, phaseNumber, records }) {
  if (!Array.isArray(records) || records.length === 0) return null;

  const phaseDir = await resolvePhaseDirectory(projectRoot, phaseNumber);
  if (!phaseDir) return null;

  const filePath = path.join(phaseDir, "DISCUSSION-LOG.md");
```

**Use for Phase 9:** Any persisted Agent B transcript or summary should sanitize provider metadata the same way before it reaches markdown or JSON evidence.

---

### `flow/governance/delegation-evidence.mjs` (utility, transform)

**Analog:** `flow/governance/delegation-evidence.mjs`

**Normalization shape** (lines 1-15):
```javascript
export function normalizeDelegationRecords(records = []) {
  return records.map((record, index) => ({
    phaseNumber: typeof record.phaseNumber === "number" ? record.phaseNumber : null,
    questionId: record.questionId ?? `q-${index + 1}`,
    workflow: record.workflow ?? "unknown",
    agentId: record.agentId ?? "responder-agent",
    question: record.question ?? "",
    answer: record.answer ?? "",
    rationale: record.rationale ?? "",
    confidence: typeof record.confidence === "number" ? record.confidence : 0,
    riskScore: typeof record.riskScore === "number" ? record.riskScore : 0,
    conflict: record.conflict === true,
```

**Validation helper** (lines 17-24):
```javascript
export function validateDelegationRecord(record) {
  const required = ["questionId", "agentId", "question", "answer", "rationale", "confidence", "escalationDisposition"];
  const missing = required.filter((field) => !(field in record));
  return {
    valid: missing.length === 0,
    missing,
  };
}
```

**Use for Phase 9:** Extend this record shape for `agent-b`, `correlationId`, `configPath`, or `pid` evidence instead of inventing a second evidence record schema.

---

### `flow/governance/escalation-policy.mjs` (utility, transform)

**Analog:** `flow/governance/escalation-policy.mjs`

**Deterministic escalation result** (lines 1-34):
```javascript
export const DEFAULT_ESCALATION_POLICY = Object.freeze({
  riskThreshold: 0.7,
  confidenceThreshold: 0.6,
  escalateOnFailedVerification: true,
});

export function evaluateEscalation({ policy, lifecycleResults = [], delegationRecords = [] }) {
  const cfg = normalizePolicy(policy);
  const reasons = [];

  const hasFailedLifecycle = lifecycleResults.some((result) => result.status !== "complete");
  if (cfg.escalateOnFailedVerification && hasFailedLifecycle) {
    reasons.push("lifecycle_failed_or_unverified");
  }
  ...
  return {
    schemaVersion: 1,
    escalate,
    gateStatus: escalate ? "human-review-required" : "auto-approved",
    reasons,
    policy: cfg,
  };
}
```

**Use for Phase 9:** Keep stable reason-code aggregation in one deterministic object. Phase 9-specific failures like startup invalid config, malformed JSONL, timeout, and retry exhaustion should normalize into this same machine-readable style.

---

### `flow/cli.mjs` (controller, request-response)

**Analog:** `flow/cli.mjs`

**Flag parsing pattern** (lines 49-107):
```javascript
function parseExecutionArgs(argv) {
  const result = {
    phaseNumbers: [],
    limit: null,
    runLifecycle: false,
    maxRetries: null,
    runGovernance: false,
    riskThreshold: null,
    confidenceThreshold: null,
    phase8DebatePrototype: false,
    phase8Workflow: null,
    phase8TranscriptJson: null,
  };
```

**Scoped execution branch** (lines 168-182):
```javascript
  if (options.phase8DebatePrototype) {
    const transcript = parsePhase8Transcript(options.phase8TranscriptJson);
    const result = runDebatePrototype({
      workflow: options.phase8Workflow,
      transcript,
      policyConfig: {
        confidenceThreshold: options.confidenceThreshold === null ? undefined : options.confidenceThreshold,
        maxInvalidAnswerRetries: options.maxRetries === null ? undefined : options.maxRetries,
      },
    });

    return {
      workflow: "phase8-debate-prototype",
      scope: "spec-discuss-only",
      result,
    };
  }
```

**Use for Phase 9:** Follow the same explicit flag parsing and isolated execution branch if Phase 9 introduces a runtime-specific CLI mode or test harness entrypoint. Scope-lock errors should still surface as direct thrown errors, not silent skips.

---

### `flow/tests/orchestrator-agent-b-runtime.test.mjs` (test, request-response)

**Primary analog:** `flow/tests/orchestrator-context-pack.test.mjs`

**Temp project fixture pattern** (lines 1-31):
```javascript
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

test("context pack uses allowlisted artifacts and deterministic structure", async () => {
  const projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), "flow-orch-pack-"));
  await fs.mkdir(path.join(projectRoot, ".planning"), { recursive: true });
  await fs.mkdir(path.join(projectRoot, ".planning", "phases", "03-phase-reader-and-execution-orchestrator"), { recursive: true });
```

**Manifest assertion pattern** (lines 31-56):
```javascript
    const payload = { runId: "orchestrator-abc", selectedPhases, descriptors, interception, contextPack: pack };
    const { manifestPath } = await persistOrchestratorManifest({ projectRoot, runId: "orchestrator-abc", payload });
    const saved = JSON.parse(await fs.readFile(manifestPath, "utf8"));
    assert.equal(saved.runId, "orchestrator-abc");
    assert.equal(saved.contextPack.schemaVersion, 1);
```

**Use for Phase 9:** Create temp project roots, write minimal planning fixtures, then assert pid/config-path/handshake evidence via saved run artifacts instead of only checking in-memory return values.

---

### `flow/tests/orchestrator-agent-b-scope-lock.test.mjs` (test, request-response)

**Analog:** `flow/tests/orchestrator-debate-prototype.test.mjs`

**Base event factory** (lines 6-15):
```javascript
function baseEvent(overrides = {}) {
  return {
    schemaVersion: "1.0.0",
    runId: "run-proto",
    phaseNumber: 8,
    timestampIso: "2026-07-19T10:00:00.000Z",
    correlationId: "corr-42",
    ...overrides,
  };
}
```

**Scope-lock assertion** (lines 163-167):
```javascript
test("prototype enforces scope lock to spec/discuss only", () => {
  assert.throws(() => {
    runDebatePrototype({ workflow: "execute-phase", transcript: [] });
  }, { code: "workflow_scope_violation" });
});
```

**Use for Phase 9:** Copy this direct `assert.throws(..., { code })` style for consensus/debate/Agora rejection tests. Phase 9 scope lock should be a hard error with a stable code.

---

### `flow/tests/lifecycle-agent-b-delegation-e2e.test.mjs` (test, request-response)

**Primary analog:** `flow/tests/lifecycle-retry.test.mjs`

**Retryable failure harness** (lines 6-37):
```javascript
test("lifecycle retries a retryable failed step within configured bounds", async () => {
  const attemptsByStep = new Map();
  const phase = { phaseNumber: 4, id: "phase-04", name: "Lifecycle" };
  const descriptor = { phaseContextPath: "/tmp/x" };

  const lifecycle = await runLifecycleForPhase({
    phase,
    descriptor,
    runId: "orchestrator-abc",
    policy: { maxRetries: 1, retryableSteps: ["execute"] },
    stepExecutor: async ({ step }) => {
      const attempt = (attemptsByStep.get(step) ?? 0) + 1;
      attemptsByStep.set(step, attempt);
```

**Fail-closed invalid responder assertion** (lines 39-69):
```javascript
test("lifecycle blocks resume when responder payload schema is invalid", async () => {
  const lifecycle = await runLifecycleForPhase({
    phase,
    descriptor,
    runId: "orchestrator-abc",
    responderAnswer: { questionId: "q-1", answer: "", confidence: 1.2 },
    policy: { maxRetries: 0 },
    stepExecutor: async ({ step }) => {
      if (step === "discuss") {
        return { requiresResponder: true };
      }
```

**Use for Phase 9:** Keep the e2e matrix inside `runLifecycleForPhase` with injected retryable timeouts, malformed protocol responses, and startup failures. Assert final lifecycle status and reason codes after exhaustion.

## Shared Patterns

### Strict Envelope Validation
**Sources:** `flow/orchestrator/debate-contract.mjs`, `flow/lifecycle/answer-schema.mjs`
**Apply to:** `flow/orchestrator/agent-b-protocol.mjs`, `flow/lifecycle/engine.mjs`, `flow/tests/lifecycle-agent-b-delegation-e2e.test.mjs`
```javascript
assertSupportedSchemaMajor(normalizedEvent.schemaVersion);

for (const fieldName of requiredFields) {
  if (!(fieldName in normalizedEvent)) {
    throw buildContractError("malformed_payload", `Missing required field: ${fieldName}.`);
  }
}

const validation = validateResponderAnswer(payload);
if (!validation.valid) {
  const error = new Error(`Invalid responder payload: ${validation.errors.join(" ")}`);
  error.retryable = false;
  throw error;
}
```

### Retry And Exhaustion Semantics
**Sources:** `flow/lifecycle/retry-policy.mjs`, `flow/governance/escalation-policy.mjs`
**Apply to:** `flow/orchestrator/agent-b-runtime.mjs`, `flow/lifecycle/engine.mjs`, `flow/tests/lifecycle-agent-b-delegation-e2e.test.mjs`
```javascript
if (!normalized.retryableSteps.includes(step)) return false;
if (attempt >= normalized.maxRetries) return false;
if (error && error.retryable === false) return false;

return {
  schemaVersion: 1,
  escalate,
  gateStatus: escalate ? "human-review-required" : "auto-approved",
  reasons,
  policy: cfg,
};
```

### Sanitized Provider Metadata
**Source:** `flow/governance/discussion-log.mjs`
**Apply to:** `flow/orchestrator/agent-b-runtime.mjs`, `flow/governance/discussion-log.mjs`, `flow/governance/delegation-evidence.mjs`
```javascript
const PROVIDER_METADATA_ALLOWLIST = new Set([
  "providerName",
  "providerLatencyMs",
  "providerStatusCode",
  "providerRequestId",
]);

for (const [key, value] of Object.entries(input)) {
  if (!PROVIDER_METADATA_ALLOWLIST.has(key)) continue;
  sanitized[key] = value;
}
```

### Run-Local Evidence Persistence
**Source:** `flow/orchestrator/run-manifest.mjs`
**Apply to:** `flow/orchestrator/agent-b-runtime.mjs`, `flow/tests/orchestrator-agent-b-runtime.test.mjs`
```javascript
const runDir = path.join(projectRoot, "flow", "runs", runId);
await fs.mkdir(path.join(runDir, "phases"), { recursive: true });
const manifestPath = path.join(runDir, "orchestrator-manifest.json");
await fs.writeFile(manifestPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
```

### Scope Lock And Stable Error Codes
**Sources:** `flow/orchestrator/debate-prototype.mjs`, `flow/tests/orchestrator-debate-prototype.test.mjs`
**Apply to:** `flow/cli.mjs`, `flow/orchestrator/agent-b-runtime.mjs`, `flow/tests/orchestrator-agent-b-scope-lock.test.mjs`
```javascript
if (!ALLOWED_WORKFLOWS.has(workflow)) {
  throw buildPrototypeError(
    "workflow_scope_violation",
    `Workflow '${workflow}' is out of scope. Phase-8 prototype supports only spec-phase and discuss-phase.`,
  );
}

assert.throws(() => {
  runDebatePrototype({ workflow: "execute-phase", transcript: [] });
}, { code: "workflow_scope_violation" });
```

## No Exact Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `flow/orchestrator/agent-b-runtime.mjs` | service | request-response | No existing spawned-process supervisor under `flow/orchestrator/`; compose from `debate-prototype`, `retry-policy`, `run-manifest`, and governance sanitization patterns. |
| `flow/orchestrator/agent-b-protocol.mjs` | utility | request-response | No existing JSONL request/response contract module; closest local analog is the strict event-envelope validator in `debate-contract.mjs`. |

## Metadata

**Analog search scope:** `flow/orchestrator/`, `flow/lifecycle/`, `flow/governance/`, `flow/tests/`, `flow/cli.mjs`
**Files scanned:** 13
**Pattern extraction date:** 2026-07-19
