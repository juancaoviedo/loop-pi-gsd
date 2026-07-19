# Phase 4: Autonomous Phase Lifecycle Engine - Context

**Gathered:** 2026-07-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 4 executes selected phases through deterministic lifecycle sequencing inside `/flow-execute-all-phases`.

Implementation placement remains locked:
- Flow lifecycle engine in root `flow/`.
- gsd-pi remains thin bridge only.

</domain>

<spec_lock>
## Requirements (locked via SPEC.md)

- PHASE-02: deterministic lifecycle chain execution.
- PHASE-03: status/artifact updates after each lifecycle step.
- PHASE-04: bounded repair/retry loop.
- INTD-03: schema validation for delegated responder answers.
- VER-01/02/03: deterministic verification outputs, evidence persistence, and completion gate.

Downstream agents must read `04-SPEC.md` before planning/execution.

</spec_lock>

<decisions>
## Implementation Decisions

- **D-01:** Lifecycle step order is fixed: `discuss -> plan -> execute -> verify`.
- **D-02:** Retry policy is explicit and bounded (`maxRetries`, retryable step set) and defaults to fail-closed.
- **D-03:** Each step transition appends machine-readable status entry to phase lifecycle artifact.
- **D-04:** Verification step emits stable structured check outputs and aggregate verdict.
- **D-05:** Completion gate requires verification verdict `pass` and non-empty evidence references.
- **D-06:** Responder answer validation uses stable schema guard before resuming blocked interactive step.

</decisions>

<canonical_refs>
## Canonical References

### Product and requirement sources
- `.planning/ROADMAP.md`
- `.planning/STATE.md`
- `.planning/REQUIREMENTS.md`
- `.planning/phases/04-autonomous-phase-lifecycle-engine/04-SPEC.md`

### Existing Flow execution seams
- `flow/cli.mjs`
- `flow/orchestrator/select-phases.mjs`
- `flow/orchestrator/isolation.mjs`
- `flow/orchestrator/context-pack.mjs`
- `flow/orchestrator/interception.mjs`
- `flow/orchestrator/run-manifest.mjs`

</canonical_refs>

<code_context>
## Existing Code Insights

- Phase 3 currently builds orchestration payloads but does not execute lifecycle steps.
- Run manifest persistence exists and can be extended for lifecycle outputs.
- No retry controller, lifecycle status ledger, or verification gate module exists yet.

</code_context>

<specifics>
## Specific Ideas

- Introduce lifecycle modules under `flow/lifecycle/`:
  1) runner with fixed chain sequencing,
  2) retry policy evaluator,
  3) responder schema validation,
  4) verification output and gate evaluation,
  5) status/evidence persistence.
- Add CLI mode for lifecycle execution after orchestration payload generation.
- Persist per-phase lifecycle output in run-local files for replayability.

</specifics>

<deferred>
## Deferred Ideas

- Human escalation policy integration remains Phase 5.
- Portfolio-wide evidence rollups remain Phase 5+.

</deferred>

---

*Phase: 04-autonomous-phase-lifecycle-engine*
*Context gathered: 2026-07-18*
