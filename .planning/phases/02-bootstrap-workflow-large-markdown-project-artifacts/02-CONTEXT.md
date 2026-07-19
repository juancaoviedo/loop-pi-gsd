# Phase 2: Bootstrap Workflow (Extended Documents -> Project Artifacts) - Context

**Gathered:** 2026-07-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 2 implements the first functional bootstrap workflow behind `/flow-create-additional-phases`.

Implementation placement is locked:
- Flow logic in root `flow/`.
- gsd-pi only forwards `/flow-*` commands through thin bridge seams.

</domain>

<spec_lock>
## Requirements (locked via SPEC.md)

- BOOT-03: bootstrap creates/updates key `.planning/` artifacts from supported source documents (Markdown, LaTeX, PDF, HTML).
- BOOT-04: bootstrap persists source-to-artifact traceability.

Downstream agents must read `02-SPEC.md` before planning/execution.

</spec_lock>

<decisions>
## Implementation Decisions

- **D-01:** `/flow-create-additional-phases` remains the only workflow surface for this phase.
- **D-02:** Parsing, mapping, merge policy, and trace generation live in root `flow/` modules.
- **D-02a:** Supported bootstrap input formats for this phase are Markdown (`.md`), LaTeX (`.tex`), PDF (`.pdf`), and HTML (`.html`, `.htm`).
- **D-02b:** All supported source formats normalize into one canonical intermediate model before merge logic runs.
- **D-03:** gsd-pi bridge remains thin and does not absorb bootstrap parsing logic.
- **D-04:** Bootstrap merge policy must preserve existing `.planning/ROADMAP.md` phase ordering unless source explicitly maps to additive/targeted updates.
- **D-05:** A persisted trace artifact is mandatory for each bootstrap run.
- **D-06:** Phase count is determined by deterministic complexity partitioning over normalized work items, not by free-form model choice.
- **D-07:** Default sizing controls are `target_complexity_per_phase=10`, `min_phases=5`, `max_phases=50`; these are configurable but must be explicit in run config.
- **D-08:** Phase boundaries must maximize independent verifiability (each phase must map to acceptance checks and evidence outputs).

</decisions>

<canonical_refs>
## Canonical References

### Product and requirement sources
- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/phases/02-bootstrap-workflow-large-markdown-project-artifacts/02-SPEC.md`

### Existing Flow kernel seams
- `flow/cli.mjs`
- `flow/kernel/commands.mjs`
- `flow/kernel/policy.mjs`
- `flow/tests/kernel.test.mjs`

### gsd-pi thin adapter seam
- `external/gsd-pi/packages/gsd-agent-modes/src/modes/interactive/slash-command-handlers.ts`
- `external/gsd-pi/packages/gsd-agent-modes/src/modes/interactive/slash-command-handlers.test.ts`

</canonical_refs>

<code_context>
## Existing Code Insights

- Phase 1 already established canonical command normalization and fail-closed policy helpers in root `flow/`.
- The current bridge in gsd-pi forwards `/flow-create-additional-phases` and `/flow-execute-all-phases` to root Flow CLI.
- There is no Phase 2 bootstrap parser, mapper, merge engine, or trace artifact writer yet.

</code_context>

<specifics>
## Specific Ideas

- Introduce a bootstrap pipeline in root `flow/` with explicit stages:
  1) source load and heading segmentation,
  2) format-aware extraction and intent normalization into a shared intermediate model,
  3) deterministic work-item scoring and phase partitioning,
  4) deterministic artifact merge,
  5) trace map persistence.
- Keep file writes bounded to the four BOOT-03 artifact targets.
- Persist trace map under `flow/runs/` or a similarly scoped run artifact location.

</specifics>

<deferred>
## Deferred Ideas

- Any phase execution automation remains Phase 3+.

</deferred>

---

*Phase: 02-bootstrap-workflow-large-markdown-project-artifacts*
*Context gathered: 2026-07-18*
