# Phase 3: Phase Reader and Execution Orchestrator - Context

**Gathered:** 2026-07-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 3 implements deterministic orchestration behavior for `/flow-execute-all-phases` before full lifecycle execution begins.

Implementation placement is locked:
- Flow orchestration logic in root `flow/`.
- gsd-pi remains thin command bridge only.

</domain>

<spec_lock>
## Requirements (locked via SPEC.md)

- PHASE-01: deterministic roadmap phase loading and selection.
- SAFE-02: isolated execution descriptors for selected phases.
- INTD-01: interactive interception/routing metadata generation.
- INTD-02: deterministic responder context-pack generation.

Downstream agents must read `03-SPEC.md` before planning/execution.

</spec_lock>

<decisions>
## Implementation Decisions

- **D-01:** `/flow-execute-all-phases` is the only workflow surface in this phase.
- **D-02:** Selection policy defaults to deterministic eligibility: pending phases only, ordered by roadmap sequence, optional explicit filters.
- **D-03:** Run isolation descriptors are materialized under `flow/runs/<run-id>/` with one phase-specific subcontext per selected phase.
- **D-04:** Interactive interception metadata is emitted as structured orchestration output; no inline responder execution in this phase.
- **D-05:** Context packs are assembled from allowlisted artifacts only (`PROJECT`, `REQUIREMENTS`, `ROADMAP`, phase plan/context files when present).
- **D-06:** Context-pack schema is versioned and stable to avoid downstream coupling drift.

</decisions>

<canonical_refs>
## Canonical References

### Product and requirement sources
- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`
- `.planning/phases/03-phase-reader-and-execution-orchestrator/03-SPEC.md`

### Existing Flow seams
- `flow/cli.mjs`
- `flow/kernel/commands.mjs`
- `flow/kernel/policy.mjs`
- `flow/bootstrap/*` (phase generation outputs consumed by selector)

### gsd-pi thin adapter seam
- `external/gsd-pi/packages/gsd-agent-modes/src/modes/interactive/slash-command-handlers.ts`

</canonical_refs>

<code_context>
## Existing Code Insights

- Root Flow currently includes deterministic command handling and bootstrap generation.
- There is no dedicated phase reader/selector module for `/flow-execute-all-phases` yet.
- There is no run-isolation descriptor generator or responder context-pack module yet.

</code_context>

<specifics>
## Specific Ideas

- Introduce orchestration modules under `flow/orchestrator/`:
  1) roadmap loading and deterministic phase selection,
  2) per-phase run descriptor generation,
  3) interactive interception declaration,
  4) responder context-pack builder.
- Integrate orchestrator entry in `flow/cli.mjs` for `flow-execute-all-phases` with optional selection flags.
- Persist orchestration payload per run for observability and replayability.

</specifics>

<deferred>
## Deferred Ideas

- Lifecycle command chain execution remains Phase 4.
- Policy-gated human escalation logic remains Phase 5.

</deferred>

---

*Phase: 03-phase-reader-and-execution-orchestrator*
*Context gathered: 2026-07-18*
