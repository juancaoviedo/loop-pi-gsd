# Phase 09: independent-agent-b-runtime-and-two-round-consensus-slice - Context

**Gathered:** 2026-07-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 9 implements a real separate-process Agent B runtime for delegated ask/answer in spec and discuss workflows, with deterministic fail-closed behavior across process boundaries.

</domain>

<spec_lock>
## Requirements (locked via SPEC.md)

**5 requirements are locked.** See `09-SPEC.md` for full requirements, boundaries, and acceptance criteria.

Downstream agents MUST read `09-SPEC.md` before planning or implementing. Requirements are not duplicated here.

**In scope (from SPEC.md):**
- Real second `gsd-pi` instance for Agent B in a separate OS process
- Separate runtime config, provider/model path, credentials, and logs for Agent B
- End-to-end ask/answer delegation for `/gsd-spec-phase` and `/gsd-discuss-phase`
- Bounded retry and fail-closed escalation behavior across the real process boundary
- Automated tests proving separate process execution and distinct provider/model configuration

**Out of scope (from SPEC.md):**
- Multi-agent debate or two-round consensus behavior - deferred until future multi-agent phases
- Agora transport integration - deferred to Phase 11
- Governance-grade transcript expansion beyond what existing phases already persist - handled in later governance-focused work
- Changing final artifact authority away from Agent A - phase 9 preserves current workflow authority model

</spec_lock>

<decisions>
## Implementation Decisions

### Agent B Process Lifecycle
- **D-01:** Agent B lifecycle is phase-scoped: start before delegated spec/discuss flow for a phase, stay alive across both workflow surfaces in that phase, terminate after discuss completes.
- **D-02:** Startup readiness requires explicit handshake and capability echo before first delegated question.
- **D-03:** Shutdown is graceful stop with bounded timeout, then force-kill if still alive.
- **D-04:** Per-phase Agent B runtime evidence persists under `flow/runs/<run-id>/agent-b/`.

### A-B Transport Contract
- **D-05:** IPC transport for phase 9 is stdio JSONL request/response.
- **D-06:** Every exchange uses a strict correlation envelope with explicit `requestType` and deterministic metadata.
- **D-07:** Malformed/schema-invalid responses are treated as retryable transport/protocol failures first, then escalate-and-block on exhaustion.
- **D-08:** Payload supports natural-language free-text answer in a required payload field, while envelope validation remains fail-closed.

### Config and Provider Isolation
- **D-09:** Agent B must load from a dedicated Agent B config path (not shared fallback).
- **D-10:** Missing/invalid Agent B config fails closed at startup with stable startup reason code.
- **D-11:** Logging/evidence uses strict redaction and allowlisted provider metadata only (no secret leakage).
- **D-12:** Tests must inject distinct stub provider/model IDs for A vs B and assert separation via handshake + persisted evidence.

### Failure Policy and Reason Codes
- **D-13:** Retry cap defaults to 2 attempts total for delegated Agent B failures.
- **D-14:** Per-try timeout defaults to 5 minutes.
- **D-15:** Failure reasons use stable namespaced machine-readable reason codes by class.
- **D-16:** Retry exhaustion always emits `escalate-and-block` with both `retry_exhausted` and root-cause reason code.

### Claude's Discretion
- No explicit discretion areas were delegated; implementation is constrained by the locked decisions above.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Locked phase and roadmap authority
- `.planning/phases/09-independent-agent-b-runtime-and-two-round-consensus-slice/09-SPEC.md` - Locked requirements, boundaries, acceptance criteria, and prohibitions for phase 9.
- `.planning/ROADMAP.md` - Phase 9 goal and success criteria in milestone sequence.
- `.planning/PROJECT.md` - Product-level reliability and workflow-first constraints.
- `.planning/REQUIREMENTS.md` - Requirement taxonomy and traceability baseline.
- `.planning/STATE.md` - Current phase progression and session resume state.

### Existing orchestration and runtime seams
- `flow/cli.mjs` - Current workflow entrypoint and prototype feature seams.
- `flow/orchestrator/interception.mjs` - Delegation routing metadata for spec/discuss.
- `flow/orchestrator/context-pack.mjs` - Deterministic context-pack construction for delegated rounds.
- `flow/lifecycle/engine.mjs` - Lifecycle execution path where delegated answer validation is enforced.
- `flow/lifecycle/answer-schema.mjs` - Fail-closed response schema validation baseline.
- `flow/lifecycle/retry-policy.mjs` - Retry policy normalization and bounded retries.

### Governance and policy seams
- `flow/orchestrator/debate-contract.mjs` - Schema major/version and event validation patterns.
- `flow/orchestrator/debate-policy.mjs` - Deterministic decision/reason-code policy patterns.
- `flow/governance/discussion-log.mjs` - Sanitized provider metadata persistence shape.
- `flow/governance/delegation-evidence.mjs` - Delegation evidence structure and agent identity baseline.
- `flow/governance/escalation-policy.mjs` - Existing deterministic escalation patterns.

### Regression and behavior tests
- `flow/tests/orchestrator-context-pack.test.mjs` - Context-pack and interception contract expectations.
- `flow/tests/lifecycle-retry.test.mjs` - Retry and invalid responder handling expectations.
- `flow/tests/governance-escalation.test.mjs` - Escalation determinism checks.
- `flow/tests/governance-discussion-log.test.mjs` - Sanitized discussion-log persistence checks.
- `flow/tests/orchestrator-debate-prototype.test.mjs` - Timeout/provider-error and deterministic reason-code patterns.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `buildInterceptionMetadata` in `flow/orchestrator/interception.mjs` already models delegated spec/discuss routing.
- `buildResponderContextPack` in `flow/orchestrator/context-pack.mjs` provides deterministic context loading for delegated requests.
- `assertValidResponderAnswer` in `flow/lifecycle/answer-schema.mjs` is a strong fail-closed validation baseline.
- `runStepWithRetry` in `flow/lifecycle/retry-policy.mjs` already defines bounded retry mechanics.
- Governance modules already sanitize provider metadata and persist structured evidence.

### Established Patterns
- Schema-bearing runtime artifacts consistently include explicit `schemaVersion`.
- Fail-closed behavior with explicit escalation is preferred over permissive fallback.
- Deterministic machine-readable reason codes are already used in policy-oriented orchestration paths.

### Integration Points
- Add process lifecycle and IPC implementation at orchestration/lifecycle seams (`flow/orchestrator/` and `flow/lifecycle/`).
- Persist runtime/evidence artifacts under run-local paths (`flow/runs/<run-id>/...`) for replayability.
- Extend existing governance/evidence writers rather than introducing parallel formats.

</code_context>

<specifics>
## Specific Ideas

- Keep Agent B alive through both spec and discuss for the same phase to preserve phase-local continuity.
- Keep payload answer text freeform natural language, but only inside a strict validated envelope.
- Use a larger default timeout (5 minutes per try) to tolerate slower model responses.

</specifics>

<deferred>
## Deferred Ideas

- Multi-agent debate/consensus expansion remains deferred to future phases per scope lock.
- Agora transport remains deferred to phase 11.

</deferred>

---

*Phase: 09-independent-agent-b-runtime-and-two-round-consensus-slice*
*Context gathered: 2026-07-19*
