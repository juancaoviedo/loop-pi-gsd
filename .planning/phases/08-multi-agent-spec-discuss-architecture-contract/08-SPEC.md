# Phase 8: Multi-Agent Spec/Discuss Architecture Contract - Specification

**Created:** 2026-07-19
**Ambiguity score:** 0.10 (gate: <= 0.20)
**Requirements:** 5 locked

## Goal

Define a deterministic ask-and-answer architecture contract for `/gsd-spec-phase` and `/gsd-discuss-phase` that enables independent agent reasoning inputs while preserving fail-closed workflow control.

## Background

Flow currently supports delegated interaction through deterministic interception metadata and context packs, plus schema validation and governance logging primitives. Existing behavior is route-and-payload based (`responder-agent`) but does not yet define a formal architecture contract for independent ask/answer orchestration with explicit stop/escalate policy semantics for phase authoring workflows.

## Requirements

1. **Workflow scope lock**: Phase 8 defines architecture only for `/gsd-spec-phase` and `/gsd-discuss-phase` ask/answer orchestration.
   - Current: Interception rules route question rounds to `responder-agent`, but scope and behavior are not explicitly locked to this contract phase.
   - Target: Architecture contract explicitly limits behavior to spec/discuss ask/answer orchestration and rejects scope expansion to multi-agent debate or transport/runtime implementation.
   - Acceptance: Contract includes explicit in-scope and out-of-scope lists; non-spec/discuss workflow events are defined as out of contract and rejected by policy.

2. **Role ownership contract**: Agent A asks and evaluates stop conditions; Agent B answers in schema-conformant form.
   - Current: Delegation records imply responder behavior, but role boundaries and authority are not fully codified for this phase.
   - Target: Contract states Agent A is question orchestrator and policy evaluator; Agent B is answer producer only; role-switch/control directives from Agent B are invalid.
   - Acceptance: Contract specifies that Agent B control directives are ignored and logged; only Agent A can evaluate stop/escalate transitions.

3. **Versioned message schemas**: Question, answer, stop-check, escalate, and error events are versioned and validated.
   - Current: Responder payload schema validation exists for core fields, but no phase-level message family contract exists.
   - Target: A v1 schema set defines required fields, validation rules, and normalization expectations (UTF-8 text handling) for all ask/answer control events.
   - Acceptance: Schema section lists required fields and pass/fail validation outcomes for empty, malformed, and valid payloads.

4. **Deterministic stop/escalate policy**: Proceed/escalate outcomes are deterministic and fail-closed.
   - Current: Escalation logic exists in governance modules, but phase-8 architecture policy is not locked for spec/discuss ask/answer flow.
   - Target: Contract defines precedence and threshold boundaries, including equality handling and conflict precedence.
   - Acceptance: Policy states `confidence >= threshold` may proceed only when no blocking risk/conflict is present; any blocking risk/conflict takes escalate precedence and blocks continuation.

5. **Runnable architecture prototype**: Prototype demonstrates deterministic decisioning from sample transcripts.
   - Current: There is no phase-8 scoped prototype that demonstrates ask/answer contract outputs for this architecture.
   - Target: A minimal prototype accepts sample question/answer transcripts, validates schema, and emits deterministic `proceed` or `escalate-and-block` output.
   - Acceptance: Replaying identical transcript plus policy config returns identical decision output and identical reason codes.

## Boundaries

**In scope:**
- Architecture contract for ask/answer orchestration in `/gsd-spec-phase` and `/gsd-discuss-phase`
- Role ownership rules (Agent A asks/evaluates, Agent B answers)
- Versioned message schema definitions and validation rules
- Deterministic stop/escalate policy definitions with precedence and threshold semantics
- Runnable prototype that demonstrates deterministic decision output from sample transcripts

**Out of scope:**
- Spawning Agent B as a real independent process - deferred to Phase 9 runtime slice
- Provider SDK integration (OpenAI/Anthropic/etc.) - deferred to Phase 9 runtime wiring
- Agora transport integration - deferred to Phase 11
- N-agent (3+) debate orchestration - deferred to future multi-agent expansion after ask/answer baseline

## Constraints

- Phase 8 is contract-first and policy-first; implementation depth is limited to architecture scaffolding and prototype demonstration.
- Workflow behavior must remain fail-closed under malformed or missing answer payloads.
- Contract language must remain compatible with existing deterministic routing/context-pack patterns in root `flow/` modules.
- No assumption of chain-of-thought persistence is allowed in architecture outputs.

## Acceptance Criteria

- [ ] Contract explicitly limits scope to `/gsd-spec-phase` and `/gsd-discuss-phase` ask/answer orchestration
- [ ] Agent A and Agent B role ownership and authority boundaries are explicitly defined and testable
- [ ] Versioned v1 message schemas exist for question, answer, stop-check, escalate, and error events
- [ ] Empty or malformed payload behavior is fail-closed and produces explicit error handling semantics
- [ ] Deterministic precedence rule is defined: blocking risk/conflict overrides proceed
- [ ] Threshold boundary rule is defined: confidence `>=` threshold can proceed only when no blocking condition exists
- [ ] Runnable prototype emits deterministic `proceed` or `escalate-and-block` for sample transcripts
- [ ] Replay of identical transcript/config yields identical decision and reason codes

## Edge Coverage

**Coverage:** 8/8 applicable edges resolved - 0 unresolved

| Category | Requirement | Status | Resolution / Reason |
|----------|-------------|--------|---------------------|
| unclassified | R1 | ✅ covered | Scope leak is handled by explicit contract rejection of non-spec/discuss events (Acceptance 1) |
| unclassified | R2 | ✅ covered | Agent B role-change/control directives are invalid, ignored, and logged (Acceptance 2) |
| adjacency | R3 | ✅ covered | Threshold equality behavior is fixed as `>= threshold` with blocking-condition override (Acceptance 6) |
| empty | R3 | ✅ covered | Empty required fields are fail-closed with explicit error handling and retry semantics (Acceptance 4) |
| encoding | R3 | ✅ covered | UTF-8/normalization expectations are defined in message schema contract (Acceptance 3) |
| ordering | R3 | ✅ covered | Precedence order for competing stop signals is deterministic and documented (Acceptance 5) |
| unclassified | R4 | ✅ covered | Conflict precedence is locked: escalate-and-block overrides proceed (Acceptance 5) |
| unclassified | R5 | ✅ covered | Deterministic replay must produce identical decision and reason codes (Acceptance 8) |

## Prohibitions (must-NOT)

**Coverage:** 4/4 applicable prohibitions resolved - 0 unresolved

| Prohibition (must-NOT statement) | Requirement | Status | Verification / Reason |
|----------------------------------|-------------|--------|------------------------|
| The system must NOT persist private chain-of-thought or hidden reasoning traces in phase artifacts. | R2, R3 | resolved | verification: judgment |
| Agent B must NOT directly write or mutate final spec/discuss artifacts in Phase 8. | R2 | resolved | verification: test |
| Orchestration must NOT proceed when stop/escalation policy indicates block. | R4 | resolved | verification: test |
| Message/event logging must NOT include provider credentials or secret tokens. | R3, R5 | resolved | verification: test |

## Ambiguity Report

| Dimension | Score | Min | Status | Notes |
|-----------|-------|-----|--------|-------|
| Goal Clarity | 0.95 | 0.75 | ✓ | Goal narrowed from debate to ask/answer contract for spec/discuss |
| Boundary Clarity | 0.90 | 0.70 | ✓ | Explicit out-of-scope decisions for process spawn, provider wiring, and Agora transport |
| Constraint Clarity | 0.82 | 0.65 | ✓ | Fail-closed behavior, deterministic precedence, and compatibility constraints are explicit |
| Acceptance Criteria | 0.88 | 0.70 | ✓ | Pass/fail checklist and deterministic replay criterion defined |
| **Ambiguity** | 0.10 | <=0.20 | ✓ | Gate passed |

## Interview Log

| Round | Perspective | Question summary | Decision locked |
|-------|-------------|------------------|-----------------|
| 1 | Researcher | Primary risk and target artifact for phase 8 | Address all three risks; produce architecture + schemas + runnable prototype |
| 2 | Researcher + Simplifier | MVP core and prototype scope | Keep role contract, schema contract, deterministic policy; no real process or network transport yet |
| 3 | Boundary Keeper | Role correction and out-of-scope locking | Agent A asks/evaluates, Agent B answers; spawn/provider wiring/Agora deferred |
| 3 | Failure Analyst | Edge and prohibition closure | Deterministic precedence, threshold boundary, fail-closed payload handling, and must-NOT constraints locked |

---

*Phase: 08-multi-agent-spec-discuss-architecture-contract*
*Spec created: 2026-07-19*
*Next step: /gsd-discuss-phase 8 - implementation decisions (how to realize the locked contract above)*
