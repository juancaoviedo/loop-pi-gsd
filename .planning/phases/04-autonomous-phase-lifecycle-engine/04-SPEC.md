---
phase: 04-autonomous-phase-lifecycle-engine
spec: 04
type: spec
requirements_locked: 7
---

# Phase 4: Autonomous Phase Lifecycle Engine - Specification

**Created:** 2026-07-18
**Ambiguity score:** 0.14 (gate: <= 0.20)
**Requirements:** 7 locked

## Goal

Implement deterministic per-phase lifecycle execution behind `/flow-execute-all-phases` so selected phases can progress through discuss, plan, execute, and verify with bounded retries, explicit status transitions, and verification gates.

## Background

Phase 3 introduced deterministic phase selection, isolation descriptors, interception metadata, and responder context-pack generation.
Phase 4 now adds the lifecycle engine that consumes that orchestration payload and performs autonomous progression with controlled failure handling.

The lifecycle chain is deterministic code-managed control flow; helper logic can be used for reusable sub-problems, but ordering and gate ownership must stay in deterministic modules.

## Requirements

1. **PHASE-02 (Lifecycle progression)**
   - Current: orchestrator prepares phase payloads but does not execute lifecycle steps.
   - Target: selected phases progress through required lifecycle steps in fixed order.
   - Acceptance: lifecycle runner emits step-by-step machine-readable outcomes for each selected phase.

2. **PHASE-03 (Status and artifacts updates)**
   - Current: no lifecycle step status transition artifact exists per selected phase run.
   - Target: lifecycle runner updates run-local phase status snapshots after each step.
   - Acceptance: per-phase lifecycle status artifact records transitions and timestamps for discuss/plan/execute/verify steps.

3. **PHASE-04 (Bounded repair/revision loop)**
   - Current: no retry controller exists for failed lifecycle steps.
   - Target: lifecycle engine applies bounded retries according to explicit policy.
   - Acceptance: on failure, retries execute up to configured maximum and then fail closed with deterministic terminal reason.

4. **INTD-03 (Responder answer schema validation)**
   - Current: interception metadata exists, but responder answers are not schema-validated before resume.
   - Target: lifecycle engine validates responder payload schema for intercepted question rounds before proceeding.
   - Acceptance: invalid responder payload blocks progression and emits structured validation error.

5. **VER-01 (Deterministic verification outputs)**
   - Current: no standard machine-readable verification output artifact is emitted.
   - Target: verify step emits deterministic machine-readable verification results per phase.
   - Acceptance: verification artifact includes checks, statuses, and aggregate verdict in stable JSON schema.

6. **VER-02 (Evidence bundle storage)**
   - Current: no lifecycle-level evidence bundle is persisted for selected phase runs.
   - Target: lifecycle run persists evidence bundle references and verification outputs in run-local artifacts.
   - Acceptance: per-phase lifecycle output includes evidence pointers and verification verdict payload.

7. **VER-03 (Completion gate)**
   - Current: no completion gate blocks lifecycle success on missing/failed verification evidence.
   - Target: lifecycle marks phase complete only when verification evidence is present and passing.
   - Acceptance: missing or failed verification result forces non-complete terminal status.

## Boundaries

**In scope:**
- Root Flow lifecycle runner for selected phase payloads.
- Deterministic step sequencing and status transition artifacts.
- Bounded retry policy implementation.
- Responder payload schema validation gate.
- Verification artifact emission and completion gate enforcement.

**Out of scope:**
- Human escalation policy orchestration (Phase 5).
- Cross-project memory reconciliation and evidence governance expansion (Phase 5).
- New workflow surfaces beyond `/flow-execute-all-phases`.

## Constraints

- Lifecycle control flow remains in root `flow/` modules.
- Step order is fixed and deterministic.
- Retry policy must be explicit (`maxRetries`, `retryableSteps`) and fail-closed.
- Verification artifact schema must remain stable and machine-readable.
- Completion requires verification pass; no override path in this phase.

## Acceptance Criteria

- [ ] PHASE-02: Selected phases execute lifecycle steps in deterministic order.
- [ ] PHASE-03: Lifecycle status transitions are persisted after each step.
- [ ] PHASE-04: Failed steps run bounded retries and terminate deterministically.
- [ ] INTD-03: Invalid responder payload schema blocks resume.
- [ ] VER-01: Verification outputs are emitted in stable machine-readable schema.
- [ ] VER-02: Evidence bundle references are persisted per phase lifecycle run.
- [ ] VER-03: Completion gate blocks success on failed/missing verification evidence.

## Prohibitions (must-NOT)

- Must not bypass verification gate to mark phase complete.
- Must not execute retry loops without explicit max retry bounds.
- Must not accept responder payloads that fail schema validation.
- Must not shift lifecycle ordering to non-deterministic agent choice.

## Ambiguity Report

| Dimension | Score | Min | Status | Notes |
|-----------|-------|-----|--------|-------|
| Goal Clarity | 0.92 | 0.75 | pass | Lifecycle scope and gate ownership are explicit |
| Boundary Clarity | 0.88 | 0.70 | pass | Phase 4 vs Phase 5 split is explicit |
| Constraint Clarity | 0.84 | 0.65 | pass | Ordering, retry, and verification constraints are explicit |
| Acceptance Criteria | 0.86 | 0.70 | pass | PHASE/INTD/VER requirements map to concrete checks |
| **Ambiguity** | 0.14 | <=0.20 | pass | Ready for context and planning |

---

*Phase: 04-autonomous-phase-lifecycle-engine*
*Next step: /gsd-discuss-phase 4*
