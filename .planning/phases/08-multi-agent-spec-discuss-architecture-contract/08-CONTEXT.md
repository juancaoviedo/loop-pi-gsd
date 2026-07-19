# Phase 8: multi-agent-spec-discuss-architecture-contract - Context

**Gathered:** 2026-07-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 8 defines the implementation contract for ask/answer orchestration in `/gsd-spec-phase` and `/gsd-discuss-phase` only, with deterministic policy behavior and a runnable architecture prototype.

</domain>

<spec_lock>
## Requirements (locked via SPEC.md)

**5 requirements are locked.** See `08-SPEC.md` for full requirements, boundaries, and acceptance criteria.

Downstream agents MUST read `08-SPEC.md` before planning or implementing. Requirements are not duplicated here.

**In scope (from SPEC.md):**
- Architecture contract for ask/answer orchestration in `/gsd-spec-phase` and `/gsd-discuss-phase`
- Role ownership rules (Agent A asks/evaluates, Agent B answers)
- Versioned message schema definitions and validation rules
- Deterministic stop/escalate policy definitions with precedence and threshold semantics
- Runnable prototype that demonstrates deterministic decision output from sample transcripts

**Out of scope (from SPEC.md):**
- Spawning Agent B as a real independent process (Phase 9)
- Provider SDK integration (OpenAI/Anthropic/etc.) (Phase 9)
- Agora transport integration (Phase 11)
- N-agent (3+) debate orchestration (future phase)

</spec_lock>

<decisions>
## Implementation Decisions

### Message Schema Contract Shape
- **D-01:** Use per-event schemas with a shared base envelope.
- **D-02:** Enforce semantic major schema version in payload and fail closed on unknown major versions.
- **D-03:** Normalize free-text fields as UTF-8 strings with trim and NFC normalization before validation/decisioning.

### Stop/Escalate Policy Algorithm
- **D-04:** Preserve SPEC lock precedence: `escalate-and-block` overrides `proceed` whenever any blocking risk/conflict signal is present.
- **D-05:** Proceed only when `confidence >= threshold` and no blockers exist.
- **D-06:** Invalid or empty Agent B answer payload triggers bounded retries, then `escalate-and-block`.
- **D-07:** Preserve SPEC lock for deterministic reason-code outputs (stable replay/test assertions).

### Prototype Execution Seam
- **D-08:** Place the runnable phase-8 prototype in orchestration seam territory (root `flow/orchestrator/`), not governance-first or lifecycle-first.
- **D-09:** Expose prototype through a feature-flagged seam in `flow/cli.mjs` with explicit invocation mode for deterministic testing.
- **D-10:** Prototype output format follows locked SPEC contract: structured decision output suitable for deterministic replay checks.

### Validation and Observability Contract
- **D-11:** Mandatory envelope fields: `schemaVersion`, `runId`, `phaseNumber`, `eventType`, `timestampIso`, `correlationId`, `agentRole`, `confidence`.
- **D-12:** Do not persist raw provider response bodies; store sanitized provider metadata only (prohibition-safe logging).
- **D-13:** Validation remains fail-closed and emits explicit error events for malformed payloads.

### Claude's Discretion
- Prototype module placement details and naming are delegated to Claude, constrained by D-08 and existing root `flow/` conventions.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Locked phase contract
- `.planning/phases/08-multi-agent-spec-discuss-architecture-contract/08-SPEC.md` - Locked requirements, boundaries, acceptance criteria, edge coverage, prohibitions.

### Roadmap and requirement authority
- `.planning/ROADMAP.md` - Phase 8 goal and success criteria in milestone sequence.
- `.planning/REQUIREMENTS.md` - Active v1 requirement taxonomy and traceability baseline.
- `.planning/PROJECT.md` - Product-level constraints and reliability-first strategy.
- `.planning/STATE.md` - Current milestone/session status and roadmap evolution notes.

### Existing implementation seams
- `flow/cli.mjs` - Current orchestration and governance flow entrypoint where feature-flag seam will be introduced.
- `flow/orchestrator/interception.mjs` - Existing spec/discuss question-round routing metadata.
- `flow/orchestrator/context-pack.mjs` - Deterministic responder context-pack contract.
- `flow/lifecycle/answer-schema.mjs` - Existing answer validation fail-closed baseline.
- `flow/lifecycle/engine.mjs` - Retry/validation interaction path for responder payloads.
- `flow/governance/escalation-policy.mjs` - Existing risk/confidence escalation logic patterns.
- `flow/governance/delegation-evidence.mjs` - Delegation evidence normalization and required provenance fields.
- `flow/governance/discussion-log.mjs` - Persisted Q/A trace patterns.

### Regression guardrails
- `flow/tests/orchestrator-context-pack.test.mjs` - Context-pack/interception schema behavior expectations.
- `flow/tests/lifecycle-retry.test.mjs` - Fail-closed responder payload validation behavior.
- `flow/tests/governance-escalation.test.mjs` - Deterministic escalation trigger patterns.
- `flow/tests/governance-discussion-log.test.mjs` - Discussion log persistence behavior.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `buildInterceptionMetadata` (`flow/orchestrator/interception.mjs`) already encodes spec/discuss question-round routing and can anchor phase-8 event-family evolution.
- `buildResponderContextPack` (`flow/orchestrator/context-pack.mjs`) already provides deterministic allowlisted context ingestion and phase artifact loading.
- `assertValidResponderAnswer` (`flow/lifecycle/answer-schema.mjs`) provides a fail-closed validator pattern suitable for message-schema contract layering.
- `evaluateEscalation` (`flow/governance/escalation-policy.mjs`) provides deterministic policy normalization and reason collection patterns.

### Established Patterns
- Schema contracts consistently carry `schemaVersion: 1` across orchestration/lifecycle/governance artifacts.
- Fail-closed behavior is preferred for malformed responder payloads.
- Governance persistence records structured fields for auditability and replayability.

### Integration Points
- `flow/cli.mjs` is the central seam for adding a feature-flagged prototype invocation path.
- `flow/orchestrator/` is the best fit for phase-8 prototype flow because this phase is contract/orchestration oriented.
- Existing tests in `flow/tests/` provide deterministic pattern templates for new schema and policy checks.

</code_context>

<specifics>
## Specific Ideas

- Keep phase-8 implementation contract-first: define event schemas and deterministic policy before process isolation work.
- Emit stable decision reason codes to support replayability and verification in later phases.
- Keep an explicit conflict note: user preference for free-text decision summaries conflicts with locked SPEC deterministic output; maintain SPEC lock in this phase and re-open via `/gsd-spec-phase 8` only if that direction is intentionally changed.

</specifics>

<deferred>
## Deferred Ideas

- Multi-agent debate behavior (3+ agents) remains deferred beyond phase 8.
- If preferred later, free-text-only prototype decision output can be reconsidered via a formal SPEC revision before planning/execution.

</deferred>

---

*Phase: 08-multi-agent-spec-discuss-architecture-contract*
*Context gathered: 2026-07-19*
