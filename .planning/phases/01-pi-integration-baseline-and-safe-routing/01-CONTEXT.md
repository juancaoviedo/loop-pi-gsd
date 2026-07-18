# Phase 1: Pi Integration Baseline and Safe Routing - Context

**Gathered:** 2026-07-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 1 delivers the thin deterministic kernel for Flow's two slash-command workflows. It defines the ownership split between Flow and Pi/gsd-pi, the canonical workflow ids that Flow accepts, and the fail-closed policy boundary that keeps Phase 1 from duplicating lifecycle semantics.

</domain>

<spec_lock>
## Requirements (locked via SPEC.md)

**6 requirements are locked.** See `01-SPEC.md` for full requirements, boundaries, and acceptance criteria.

Downstream agents MUST read `01-SPEC.md` before planning or implementing. Requirements are not duplicated here.

**In scope (from SPEC.md):**
- A phase-specific ownership contract for Flow vs Pi/gsd-pi.
- Exact-match canonical routing for `flow-create-additional-phases` and `flow-execute-all-phases`.
- Fail-closed policy gates for unsafe tool/use-path combinations.
- Use of existing Pi/gsd-pi workflow surfaces and write/gate hooks.
- Tests or checks that prove routing determinism and blocked execution paths.

**Out of scope (from SPEC.md):**
- Building the bootstrap document parser and phase-synthesis workflow in Phase 1 - that is Phase 2.
- Building the multi-phase execution loop that runs discuss, plan, execute, and verify - that is Phases 3 and 4.
- Building evidence, memory, and escalation governance - that is Phase 5.
- Adding a broader workflow catalog beyond the two canonical Flow slash-command workflows - that is future expansion, not the Phase 1 kernel.
- Reimplementing lifecycle semantics inside Flow - that would violate the Pi/gsd-pi ownership split and the CTRL-05 requirement.

</spec_lock>

<decisions>
## Implementation Decisions

### Ownership boundary and phase scope
- **D-01:** Flow owns intake normalization, canonical routing, and policy gating for the two slash-command workflows.
- **D-02:** Pi/gsd-pi remains the execution authority, workflow surface owner, and lifecycle machinery owner.
- **D-03:** Phase 1 stays thin and does not add a third workflow type or a generic workflow catalog.

### Canonical slash-command routing
- **D-04:** `flow-create-additional-phases` and `flow-execute-all-phases` are the only accepted Flow workflow ids for this phase.
- **D-05:** Routing should be exact-match and deterministic; malformed, unknown, or ambiguous input must fail before dispatch.
- **D-06:** The command normalization step belongs in the slash-command dispatch path before the workflow handler is reached.

### Policy gates and authoritative workflow surfaces
- **D-07:** Unauthorized tool/use-path combinations must fail closed before execution begins.
- **D-08:** The phase should keep progression on existing Pi/gsd-pi workflow hooks and write/gate seams rather than introducing a new lifecycle engine.
- **D-09:** The routing and policy contract should be verified with targeted tests at the existing slash-command, workflow-handler, register-hooks, token-gating, and write-gate seams.

### Claude's Discretion
- Exact helper placement inside the touched gsd-pi modules is left to implementation, so long as the control flow remains deterministic and fail-closed.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project intent and phase definition
- `.planning/PROJECT.md` — product direction, Phase 1 thin-kernel decision, and slash-command workflow framing.
- `.planning/REQUIREMENTS.md` — locked v1 requirements and phase traceability.
- `.planning/ROADMAP.md` — phase capability map and Phase 1 through Phase 5 split.
- `.planning/phases/01-pi-integration-baseline-and-safe-routing/01-SPEC.md` — locked Phase 1 requirements, boundaries, acceptance criteria, and ambiguity report.

### Pi / gsd-pi integration seams
- `external/gsd-pi/packages/gsd-agent-modes/src/modes/interactive/slash-command-handlers.ts` — current exact-match slash-command dispatch pattern in interactive mode.
- `external/gsd-pi/src/resources/extensions/gsd/commands/handlers/workflow.ts` — existing workflow command surface and plugin-mode dispatch.
- `external/gsd-pi/src/resources/extensions/gsd/bootstrap/register-hooks.ts` — tool-surface and policy-gate registration seam.
- `external/gsd-pi/src/resources/extensions/gsd/tests/commands-workflow-custom.test.ts` — routing coverage for workflow command dispatch.
- `external/gsd-pi/src/resources/extensions/gsd/tests/token-tool-gating.test.ts` — tool-surface reduction and gating coverage.
- `external/gsd-pi/src/resources/extensions/gsd/tests/write-gate-seam.test.ts` — write-gate and phase-surface contract coverage.

### Supporting Pi docs and contracts
- `external/gsd-pi/docs/dev/extending-pi/25-slash-command-subcommand-patterns.md` — slash-command subcommand conventions.
- `external/gsd-pi/docs/dev/ADR-040-write-gate-two-adapter-seam.md` — host vs child write-gate ownership.
- `external/gsd-pi/docs/dev/ADR-041-engine-hook-contract.md` — engine hook contract for register-hooks behavior.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `dispatchSlashCommand` in `external/gsd-pi/packages/gsd-agent-modes/src/modes/interactive/slash-command-handlers.ts` — shows the current exact-match slash-command dispatch style.
- `dispatchPluginByMode` in `external/gsd-pi/src/resources/extensions/gsd/commands/handlers/workflow.ts` — shows the existing workflow-mode handoff once a command has been canonicalized.
- `registerHooks` and the write-gate helpers in `external/gsd-pi/src/resources/extensions/gsd/bootstrap/register-hooks.ts` — central place for fail-closed tool and path policy.
- `buildMinimalGsdToolSet`, `buildMinimalAutoGsdToolSet`, and `requestHasGsdCustomType` in `external/gsd-pi/src/resources/extensions/gsd/bootstrap/register-hooks.ts` — useful patterns for request-scoped tool-surface reduction.

### Established Patterns
- Exact string matching is already used for slash-command dispatch in the interactive TUI path.
- Workflow dispatch already separates canonical command resolution from the underlying workflow execution mode.
- Policy and tool-surface reduction already live in bootstrap/register-hooks rather than in ad hoc call sites.
- Tests live next to the seam they protect and assert blocked cases, not just happy paths.

### Integration Points
- Flow intake normalization should plug in before the existing slash-command dispatch path canonicalizes to a workflow id.
- Canonical Flow workflow ids should hand off to the existing gsd-pi workflow handler rather than bypassing it.
- Policy enforcement should remain in the register-hooks/write-gate seam so unsafe tool or path combinations fail before execution starts.
- Routing and policy behavior should be covered by the existing workflow and gate test suites rather than by a separate Flow-owned lifecycle engine.

</code_context>

<specifics>
## Specific Ideas

- The two canonical Flow workflows are the only Phase 1 command surface: `/flow-create-additional-phases` and `/flow-execute-all-phases`.
- The phase should normalize command text deterministically before any workflow dispatch happens.
- Phase 1 should use the existing Pi/gsd-pi workflow handler and register-hooks/write-gate seams, not a parallel Flow lifecycle controller.
- Route rejection must happen on malformed, unknown, or ambiguous input so the user never falls through to a partially matched workflow.
- The helper-skill split belongs in later workflow design, but Phase 1 itself should stay focused on deterministic routing and policy.

</specifics>

<deferred>
## Deferred Ideas

- A broader workflow catalog beyond the two canonical Flow workflows — belongs to later expansion phases.
- The bootstrap document parser, large-document tranching, and phase generation mechanics — belongs to Phase 2.
- The multi-phase discuss/plan/execute/verify loop — belongs to Phases 3 and 4.
- Evidence bundles, memory reconciliation, and escalation governance — belongs to Phase 5.

</deferred>

---

*Phase: 1-pi-integration-baseline-and-safe-routing*
*Context gathered: 2026-07-18*