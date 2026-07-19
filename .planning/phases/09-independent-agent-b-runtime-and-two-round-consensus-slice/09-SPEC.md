# Phase 9: Independent Agent B Runtime and Two-Round Consensus Slice - Specification

**Created:** 2026-07-19
**Ambiguity score:** 0.11 (gate: <= 0.20)
**Requirements:** 5 locked

## Goal

Run Agent B as a real second `gsd-pi` instance in a separate OS process with its own provider/model configuration, and make both `/gsd-spec-phase` and `/gsd-discuss-phase` complete end-to-end ask/answer delegation through that isolated runtime.

## Background

Phase 8 already established the ask/answer architecture contract, deterministic stop/escalate policy, and a prototype decision seam under `flow/orchestrator/`. Current code contains deterministic interception metadata, context-pack assembly, responder answer validation, escalation policy logic, and a prototype decision path, but it still treats Agent B as a route/payload concept rather than a live separate runtime. There is no real spawned Agent B process, no separate `gsd-pi` runtime boundary, no exercised different-provider path, and no end-to-end process communication for `/gsd-spec-phase` and `/gsd-discuss-phase`.

## Requirements

1. **Real Agent B process**: Agent B runs as a real second `gsd-pi` instance in a separate OS process.
   - Current: Agent B is represented as routing metadata and prototype logic, not a real isolated runtime.
   - Target: Agent B is launched as a separate OS process with its own pid, isolated runtime config, isolated credentials, and isolated logs.
   - Acceptance: Runtime evidence proves Agent B has its own pid and config path, and startup failure does not fall back silently to in-process execution.

2. **Independent provider/model path**: Agent B can use a different provider/model path than Agent A.
   - Current: Provider-specific separation is not exercised through a live second runtime.
   - Target: Agent B config can point to a different provider/model than Agent A, and that difference is actually exercised in automated tests.
   - Acceptance: Automated tests run Agent A and Agent B with distinct provider/model config values and verify Agent B uses its configured path.

3. **Both workflow surfaces work end-to-end**: `/gsd-spec-phase` and `/gsd-discuss-phase` both complete delegated ask/answer through the separate Agent B process.
   - Current: Ask/answer logic exists only as architecture/prototype baseline, not as a live independent runtime slice.
   - Target: Both workflow surfaces send structured questions to the real Agent B process and receive structured answers back through the isolated runtime boundary.
   - Acceptance: End-to-end tests pass for both workflow surfaces; if only one surface works, phase 9 is incomplete.

4. **Fail-closed runtime behavior**: Invalid, empty, timed-out, or failed Agent B responses trigger bounded retries and then escalate-and-block.
   - Current: Fail-closed validation and escalation patterns exist in-process, but not yet across a real second runtime boundary.
   - Target: Process communication errors and malformed responses are normalized into bounded retry behavior followed by `escalate-and-block` with stable reason codes.
   - Acceptance: Automated tests verify bounded retries, stable machine-readable reason codes, and blocked continuation after exhaustion.

5. **Phase 9 scope lock**: Phase 9 delivers real independent ask/answer runtime only, not debate/consensus expansion.
   - Current: Roadmap title still references "two-round consensus slice," but the decided direction is ask/answer isolation first.
   - Target: Multi-agent debate/consensus behavior and Agora transport integration remain explicitly out of scope for this phase, while Agent A remains final workflow authority.
   - Acceptance: Runtime config rejects or disables consensus/debate and Agora transport paths for phase-9 execution, and Agent B never becomes final artifact authority.

## Boundaries

**In scope:**
- Real second `gsd-pi` instance for Agent B in a separate OS process
- Separate runtime config, provider/model path, credentials, and logs for Agent B
- End-to-end ask/answer delegation for `/gsd-spec-phase` and `/gsd-discuss-phase`
- Bounded retry and fail-closed escalation behavior across the real process boundary
- Automated tests proving separate process execution and distinct provider/model configuration

**Out of scope:**
- Multi-agent debate or two-round consensus behavior - deferred until future multi-agent phases
- Agora transport integration - deferred to Phase 11
- Governance-grade transcript expansion beyond what existing phases already persist - handled in later governance-focused work
- Changing final artifact authority away from Agent A - phase 9 preserves current workflow authority model

## Constraints

- Agent B must be a separate OS process, not just a separate terminal tab, worker thread, or in-process abstraction.
- Agent B runtime must be implemented as a second `gsd-pi` instance in this phase.
- Runtime behavior must remain fail-closed; startup failure, malformed payloads, timeouts, or provider failures must never silently downgrade to same-process behavior.
- Provider/model difference must be test-exercised, not only documented or left theoretical.
- Ask/answer behavior is the only live runtime interaction mode for this phase.

## Acceptance Criteria

- [ ] Agent B runs as a separate OS process with its own pid and isolated runtime config
- [ ] Agent B startup failure does not silently fall back to same-process or same-provider execution
- [ ] Agent B can be configured to use a different provider/model path than Agent A
- [ ] Automated tests exercise distinct provider/model config values between Agent A and Agent B
- [ ] `/gsd-spec-phase` completes delegated ask/answer through the separate Agent B process
- [ ] `/gsd-discuss-phase` completes delegated ask/answer through the separate Agent B process
- [ ] Invalid, empty, timed-out, or failed Agent B responses trigger bounded retries then `escalate-and-block`
- [ ] Exhausted failures emit stable machine-readable reason codes
- [ ] Consensus/debate and Agora transport paths are rejected or disabled in phase-9 runtime scope
- [ ] Agent B never becomes final artifact authority

## Edge Coverage

**Coverage:** 5/5 applicable edges resolved - 0 unresolved

| Category | Requirement | Status | Resolution / Reason |
|----------|-------------|--------|---------------------|
| unclassified | R1 | ✅ covered | Real isolation requires separate OS process evidence: independent pid, config, and no silent fallback (Acceptance 1-2) |
| unclassified | R2 | ✅ covered | Provider/model separation must be exercised in automated tests, not only configurable in theory (Acceptance 3-4) |
| unclassified | R3 | ✅ covered | Both `/gsd-spec-phase` and `/gsd-discuss-phase` are mandatory for completion (Acceptance 5-6) |
| unclassified | R4 | ✅ covered | Failure exhaustion must escalate-and-block with stable reason codes (Acceptance 7-8) |
| unclassified | R5 | ✅ covered | Consensus/debate and Agora paths must be explicitly rejected or disabled in phase 9 runtime scope (Acceptance 9-10) |

## Prohibitions (must-NOT)

**Coverage:** 4/4 applicable prohibitions resolved - 0 unresolved

| Prohibition (must-NOT statement) | Requirement | Status | Verification / Reason |
|----------------------------------|-------------|--------|------------------------|
| The separate Agent B runtime must NOT persist private chain-of-thought or hidden reasoning traces. | R1, R2 | resolved | verification: judgment |
| Agent B must NOT become final artifact authority; Agent A remains workflow authority. | R3, R5 | resolved | verification: test |
| Agent B runtime/logging must NOT leak provider credentials or secret tokens. | R1, R2, R4 | resolved | verification: test |
| The system must NOT silently fall back to in-process or same-provider behavior when separate-process startup fails. | R1, R4 | resolved | verification: test |

## Ambiguity Report

| Dimension | Score | Min | Status | Notes |
|-----------|-------|-----|--------|-------|
| Goal Clarity | 0.95 | 0.75 | ✓ | Real separate `gsd-pi` runtime plus both workflow surfaces are explicit |
| Boundary Clarity | 0.92 | 0.70 | ✓ | Consensus/debate and Agora explicitly deferred; Agent A authority preserved |
| Constraint Clarity | 0.82 | 0.65 | ✓ | Separate OS process, provider difference, and fail-closed behavior are explicit |
| Acceptance Criteria | 0.86 | 0.70 | ✓ | Concrete end-to-end and failure-path checks defined |
| **Ambiguity** | 0.11 | <=0.20 | ✓ | Gate passed |

## Interview Log

| Round | Perspective | Question summary | Decision locked |
|-------|-------------|------------------|-----------------|
| 1 | Researcher | Primary phase-9 outcome and workflow scope | Real separate process and different provider support are both required; ask/answer only for now |
| 2 | Researcher + Simplifier | MVP runtime model and phase-fail conditions | Agent B is a second `gsd-pi` instance; both spec/discuss must work; separate process and provider difference are mandatory |
| 3 | Boundary Keeper | How to treat roadmap consensus wording and out-of-scope items | Consensus/debate deferred; Agora deferred; Agent A remains final authority |
| 4 | Failure Analyst | Real-process proof, provider-proof, fail-closed behavior, and must-NOTs | Separate pid/config required; stable reason codes; no secret leakage; no silent fallback |

---

*Phase: 09-independent-agent-b-runtime-and-two-round-consensus-slice*
*Spec created: 2026-07-19*
*Next step: /gsd-discuss-phase 9 - implementation decisions (how to build what's specified above)*
