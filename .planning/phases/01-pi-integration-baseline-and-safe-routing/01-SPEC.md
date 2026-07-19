---
phase: 01-pi-integration-baseline-and-safe-routing
spec: 01
type: spec
requirements_locked: 6
---

# Phase 1: Pi Integration Baseline and Safe Routing - Specification

**Created:** 2026-07-18
**Ambiguity score:** 0.14 (gate: <= 0.20)
**Requirements:** 6 locked

## Goal

Phase 1 establishes a thin deterministic kernel for Flow's slash-command workflows so that `flow-create-additional-phases` and `flow-execute-all-phases` are normalized and validated in a root-level Flow layer (`flow/`), then routed through existing Pi/gsd-pi surfaces with fail-closed policy boundaries and no duplicate lifecycle engine.

## Background

The Flow roadmap and requirements are already in place, and the phase capability map now splits phases 1-5 across the two Flow slash-command workflows. The current repository has no Flow-specific SPEC for this phase yet, but the surrounding gsd-pi codebase already provides slash-command dispatch, workflow handlers, and register-hooks/policy seams that Phase 1 must compose rather than replace.

The missing piece is not another workflow engine. Phase 1 needs to lock the control-plane contract: what Flow owns in root `flow/`, what Pi/gsd-pi owns as host/bridge surfaces, which two canonical Flow workflow ids are accepted, and which tool/use-path combinations must be blocked before execution begins.

## Requirements

1. **Ownership boundary**: Flow and Pi/gsd-pi responsibilities are documented as a single, explicit contract for the two Flow slash-command workflows.
   - Current: The boundary is described in the roadmap and project docs, but there is no phase-specific contract that names the ownership split in one place.
   - Target: A concise boundary document states what Flow owns (intake normalization, routing, policy) and what Pi/gsd-pi owns (execution authority, workflow surfaces, lifecycle machinery) for the two canonical workflows.
   - Acceptance: The boundary document exists and explicitly names the Flow-owned and Pi-owned surfaces for both workflows.

2. **Canonical routing**: `flow-create-additional-phases` and `flow-execute-all-phases` resolve to fixed canonical workflow ids with exact-match dispatch.
   - Current: The roadmap names the two slash-command workflows, but there is no Flow-specific canonical router or normalizer.
   - Target: A deterministic intake layer maps the two accepted commands to canonical workflow ids and rejects unknown, malformed, or ambiguous slash input without dispatching a workflow.
   - Acceptance: Tests prove repeated identical input selects the same route, and invalid or ambiguous input is rejected before workflow dispatch.

3. **Fail-closed policy gates**: unauthorized tool/use-path combinations are blocked before execution begins.
   - Current: gsd-pi already has policy and write-gate seams, but Phase 1 does not yet lock a Flow-specific policy contract around the two workflows.
   - Target: Flow execution is constrained by explicit allow-lists so that unapproved tool or path combinations fail closed rather than being rerouted or downgraded.
   - Acceptance: Negative tests prove blocked tool/use-path combinations stop before execution and do not reach the workflow handler.

4. **Existing workflow surfaces remain authoritative**: phase progression uses Pi/gsd-pi workflow hooks and write/gate mechanisms only.
   - Current: gsd-pi already exposes workflow handlers and register-hooks surfaces, but Flow does not yet have a locked statement that it must not reimplement lifecycle semantics.
   - Target: Flow continues through existing Pi/gsd-pi workflow surfaces, and Phase 1 adds no separate lifecycle state machine or duplicate control loop.
   - Acceptance: The phase artifacts and tests show that progression still flows through the existing workflow handler and register-hooks seams, with no Flow-owned lifecycle engine introduced.

5. **Thin Phase 1 scope**: Phase 1 only enables the two slash-command workflows and does not expand the catalog.
   - Current: The roadmap now maps phases 2-5 to the two workflows, but Phase 1 is still the only phase that defines the kernel contract.
   - Target: Phase 1 stays limited to the two canonical workflows and the safety/routing boundary they require.
   - Acceptance: The phase does not introduce a third workflow type, a generalized workflow catalog, or any additional Flow command surface beyond the two canonical ids.

6. **Traceable safety story**: the phase makes its routing and safety claims falsifiable.
   - Current: The roadmap identifies the safety risks, but Phase 1 has not yet locked the checks that prove routing and policy behavior.
   - Target: The phase carries concrete, testable claims for routing determinism, policy rejection, and lifecycle-surface ownership.
   - Acceptance: The phase spec contains explicit pass/fail criteria and testable statements for routing, policy, and lifecycle boundaries.

## Boundaries

**In scope:**
- A phase-specific ownership contract for Flow vs Pi/gsd-pi.
- Exact-match canonical routing for `flow-create-additional-phases` and `flow-execute-all-phases`.
- Fail-closed policy gates for unsafe tool/use-path combinations.
- Use of existing Pi/gsd-pi workflow surfaces and write/gate hooks.
- Tests or checks that prove routing determinism and blocked execution paths.

**Out of scope:**
- Building the bootstrap document parser and phase-synthesis workflow in Phase 1 - that is Phase 2.
- Building the multi-phase execution loop that runs discuss, plan, execute, and verify - that is Phases 3 and 4.
- Building evidence, memory, and escalation governance - that is Phase 5.
- Adding a broader workflow catalog beyond the two canonical Flow slash-command workflows - that is future expansion, not the Phase 1 kernel.
- Reimplementing lifecycle semantics inside Flow - that would violate the Pi/gsd-pi ownership split and the CTRL-05 requirement.

## Constraints

- Phase 1 must implement Flow command normalization/policy in root `flow/` while composing existing Pi/gsd-pi workflow surfaces through a thin bridge.
- Canonical routing must be deterministic and exact-match for the two accepted command ids.
- Policy enforcement must fail closed on any unapproved tool or use-path combination.
- The phase must stay thin and not expand into the later bootstrap or execution workflows.

## Acceptance Criteria

- [ ] The phase documents the Flow vs Pi/gsd-pi ownership split for the two canonical slash-command workflows.
- [ ] `flow-create-additional-phases` and `flow-execute-all-phases` route deterministically and reject malformed or ambiguous input.
- [ ] Unauthorized tool/use-path combinations fail closed before execution begins.
- [ ] Phase progression continues through existing Pi/gsd-pi workflow surfaces and write/gate hooks.
- [ ] Phase 1 does not introduce a third workflow type or a duplicate lifecycle engine.

## Edge Coverage

**Coverage:** 4/4 applicable edges resolved · 0 unresolved

| Category | Requirement | Status | Resolution / Reason |
|----------|-------------|--------|---------------------|
| ownership split | R1 | ✅ covered | Acceptance criterion 1 locks the Flow/Pi contract in a phase-specific boundary doc |
| exact-match routing | R2 | 🧪 backstop | Acceptance criterion 2 requires deterministic routing and rejection of malformed or ambiguous input |
| policy bypass | R3 | ✅ covered | Acceptance criterion 3 requires fail-closed rejection before execution begins |
| duplicate lifecycle engine | R4 | 🧪 backstop | Acceptance criterion 4 and out-of-scope list prevent Flow from taking ownership of lifecycle semantics |

## Prohibitions (must-NOT)

**Coverage:** 4/4 applicable prohibitions resolved · 0 unresolved

| Prohibition (must-NOT statement) | Requirement | Status | Verification / Reason |
|----------------------------------|-------------|--------|------------------------|
| Flow must not introduce a separate lifecycle state machine for the two canonical workflows. | R4 | resolved | judgment: architecture review of Phase 1 artifacts and touched code paths |
| Flow must not dispatch unknown, malformed, or ambiguous slash input to any workflow. | R2 | resolved | test: routing tests assert invalid inputs are rejected before dispatch |
| Flow must not allow unapproved tool/use-path combinations to reach execution. | R3 | resolved | test: policy-gate tests assert blocked execution paths fail closed |
| Flow must not add a third workflow type or broaden the catalog in Phase 1. | R5 | resolved | judgment: roadmap and phase scope review confirm the phase stays thin |

## Ambiguity Report

| Dimension | Score | Min | Status | Notes |
|-----------|-------|-----|--------|-------|
| Goal Clarity | 0.93 | 0.75 | ✓ | The phase outcome is narrow and measurable |
| Boundary Clarity | 0.92 | 0.70 | ✓ | In-scope and out-of-scope boundaries are explicit |
| Constraint Clarity | 0.81 | 0.65 | ✓ | Determinism, fail-closed gates, and no duplicate lifecycle engine are explicit |
| Acceptance Criteria | 0.86 | 0.70 | ✓ | Each requirement has a pass/fail verifier |
| **Ambiguity** | 0.14 | <=0.20 | ✓ | The phase is clear enough for planning |

## Interview Log

| Round | Perspective | Question summary | Decision locked |
|-------|-------------|------------------|-----------------|
| 1 | Researcher | What exists today in the codebase and roadmap? | gsd-pi already has slash-command dispatch and policy seams; Flow-specific kernel still needs to be locked |
| 2 | Simplifier | What is the irreducible core of Phase 1? | Only the two canonical workflows, exact-match routing, and fail-closed policy gates |
| 3 | Boundary Keeper | What is explicitly out of scope? | Phases 2-5 implementation, broader workflow catalog, and any duplicate lifecycle engine |
| 4 | Failure Analyst | What would invalidate the phase if requirements were wrong? | Unknown or ambiguous commands must not dispatch, and policy bypass must fail closed |

---

*Phase: 01-pi-integration-baseline-and-safe-routing*
*Spec created: 2026-07-18*
*Next step: /gsd-discuss-phase 1 - implementation decisions (how to build what's specified above)*