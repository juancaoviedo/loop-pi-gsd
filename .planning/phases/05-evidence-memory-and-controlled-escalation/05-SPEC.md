---
phase: 05-evidence-memory-and-controlled-escalation
spec: 05
type: spec
requirements_locked: 9
---

# Phase 5: Evidence, Memory, and Controlled Escalation - Specification

**Created:** 2026-07-18
**Ambiguity score:** 0.14 (gate: <= 0.20)
**Requirements:** 9 locked

## Goal

Implement reliability governance for Flow phase runs: persist evidence bundles and immutable run metadata, reconcile project memory with runtime outputs, and enforce policy-gated escalation for high-risk or low-confidence outcomes.

## Background

Phase 4 implemented deterministic lifecycle execution with verification gates.
Phase 5 adds auditability and risk governance so runs are not only deterministic, but also forensically traceable and safely escalated when outcomes are risky.

## Requirements

1. **CTRL-03 (Pause/resume and checkpoints)**
   - Target: governance artifacts support checkpoint markers and resumable run state references.
2. **CTRL-04 (Immutable run metadata)**
   - Target: each run persists immutable metadata snapshot (run id, selected phases, verdicts, timestamps, policy version).
3. **INTD-04 (Escalation policy gate)**
   - Target: low-confidence, conflicting, or high-risk outcomes escalate deterministically to human review status.
4. **INTD-05 (Delegation evidence provenance)**
   - Target: delegated interaction records include agent identity, rationale summary, and escalation disposition.
5. **VER-04 (Human review escalation path)**
   - Target: verification/risk failures can route to explicit human-review-required gate.
6. **MEM-01 (Project memory linkage)**
   - Target: governance memory links requirements, phases, runs, and outcomes.
7. **MEM-02 (Decision provenance)**
   - Target: persisted records maintain provenance for key decisions and revisions.
8. **MEM-03 (Markdown/runtime reconciliation)**
   - Target: memory reconciliation reports differences between projected planning state and runtime run outcomes.
9. **SAFE-03 (Policy-gated high-risk finalization)**
   - Target: high-risk actions cannot finalize without explicit escalation-gate decision.

## Boundaries

**In scope:**
- Evidence bundle creation and persistence per run.
- Immutable run metadata snapshot persistence.
- Escalation policy engine and human-review gate decisions.
- Delegation interaction evidence schema and persistence.
- Memory index and reconciliation report generation.

**Out of scope:**
- External review UI implementation.
- Cross-project portfolio governance analytics.
- Runtime model-routing optimization loops (Phase 7).

## Constraints

- Governance logic stays in root flow modules.
- Evidence and metadata artifacts are append-only for a run id.
- Escalation policy is deterministic and configurable via explicit thresholds.
- High-risk outcomes cannot be marked finalized without gate approval state.
- Responder context must include OBJECTIVE artifact and phase-local discussion/planning artifacts when available.

## Acceptance Criteria

- [ ] CTRL-03/CTRL-04: each run stores immutable metadata and checkpoint-ready state pointers.
- [ ] INTD-04/INTD-05: delegated interactions include provenance and trigger deterministic escalation when policy conditions match.
- [ ] VER-04/SAFE-03: risky or failed outcomes produce human-review-required gate state and block finalization.
- [ ] MEM-01/MEM-02/MEM-03: memory index links run facts and emits reconciliation report against planning/runtime state.
- [ ] DISCUSSION-LOG.md in each phase captures agent-to-agent Q/A history for interactive rounds.
- [ ] Placement rule holds: implementation in root flow with thin bridge in external/gsd-pi.

## Prohibitions (must-NOT)

- Must not overwrite immutable run metadata after initial write.
- Must not finalize high-risk outcomes without escalation gate resolution.
- Must not persist delegation evidence without provenance fields.
- Must not store governance logic in deep external/gsd-pi internals.

## Ambiguity Report

| Dimension | Score | Min | Status | Notes |
|-----------|-------|-----|--------|-------|
| Goal Clarity | 0.91 | 0.75 | pass | Governance outcome and artifacts are explicit |
| Boundary Clarity | 0.87 | 0.70 | pass | Scope excludes UI and portfolio expansion |
| Constraint Clarity | 0.84 | 0.65 | pass | Immutability and escalation rules are explicit |
| Acceptance Criteria | 0.86 | 0.70 | pass | Requirement groups map to concrete checks |
| **Ambiguity** | 0.14 | <=0.20 | pass | Ready for context and planning |

---

*Phase: 05-evidence-memory-and-controlled-escalation*
*Next step: /gsd-discuss-phase 5*
