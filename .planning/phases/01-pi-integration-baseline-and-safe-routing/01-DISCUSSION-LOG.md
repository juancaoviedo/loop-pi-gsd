# Phase 1: Pi Integration Baseline and Safe Routing - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-18
**Phase:** 01-pi-integration-baseline-and-safe-routing
**Areas discussed:** ownership boundary, canonical routing, policy gates, scope thinness

---

## Ownership boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Flow owns only routing/policy | Flow normalizes input, routes commands, and enforces policy; Pi/gsd-pi remains execution authority | ✓ |
| Flow owns a new lifecycle kernel | Flow reimplements lifecycle semantics and execution control | |
| Hybrid ownership | Flow and Pi/gsd-pi share lifecycle authority | |

**User's choice:** Auto-selected by Claude: Flow owns routing/policy only; Pi/gsd-pi owns execution authority and lifecycle machinery.
**Notes:** Kept the phase thin and aligned to the roadmap decision that Flow should compose Pi/gsd-pi rather than replace it.

## Canonical routing

| Option | Description | Selected |
|--------|-------------|----------|
| Exact-match canonical ids | Only `flow-create-additional-phases` and `flow-execute-all-phases` are accepted; invalid input fails closed | ✓ |
| Prefix/alias matching | Allow partial names or aliases to route to Flow workflows | |
| Freeform workflow lookup | Search a registry at runtime and dispatch the best match | |

**User's choice:** Auto-selected by Claude: exact-match canonical ids.
**Notes:** This keeps routing deterministic and avoids accidental dispatch on malformed or ambiguous input.

## Policy gates and workflow surfaces

| Option | Description | Selected |
|--------|-------------|----------|
| Fail-closed before execution | Reject unapproved tool/use-path combinations before they can reach the workflow handler | ✓ |
| Warn and continue | Allow execution to proceed, then surface a warning | |
| Post-execution audit only | Let execution happen and check it after the fact | |

**User's choice:** Auto-selected by Claude: fail-closed before execution.
**Notes:** The existing register-hooks and write-gate seams already model this shape, so Phase 1 should preserve and strengthen that contract.

## Scope thinness

| Option | Description | Selected |
|--------|-------------|----------|
| Only the two canonical workflows | No extra workflow catalog in Phase 1 | ✓ |
| Expand the command catalog now | Add a broader Flow workflow registry in the kernel phase | |
| Delay the decision | Leave the catalog shape open for later phases | |

**User's choice:** Auto-selected by Claude: only the two canonical workflows.
**Notes:** Phases 2-5 already own the remaining workflow behavior; Phase 1 should not grow beyond the kernel.

## Claude's Discretion

- Exact helper placement in `slash-command-handlers.ts`, `workflow.ts`, and `register-hooks.ts`.
- Test file naming and the minimal shape of the boundary doc, so long as the checks remain deterministic and fail-closed.

## Deferred Ideas

- Broader workflow catalog expansion — future phase work.
- Bootstrap parser and phase-generation mechanics — Phase 2.
- Multi-phase lifecycle loop — Phases 3 and 4.
- Evidence and escalation governance — Phase 5.