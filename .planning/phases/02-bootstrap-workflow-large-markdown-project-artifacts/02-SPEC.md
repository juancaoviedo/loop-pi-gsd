---
phase: 02-bootstrap-workflow-large-markdown-project-artifacts
spec: 02
type: spec
requirements_locked: 2
---

# Phase 2: Bootstrap Workflow (Extended Documents -> Project Artifacts) - Specification

**Created:** 2026-07-18
**Ambiguity score:** 0.16 (gate: <= 0.20)
**Requirements:** 2 locked

## Goal

Deliver the first end-to-end bootstrap workflow behind `/flow-create-additional-phases` so a large product-definition input can produce coherent GSD project artifacts with source traceability.

## Background

Phase 1 established a root-level Flow kernel in `flow/` and a thin gsd-pi bridge. Phase 2 should build the first real product behavior in that root Flow layer: ingest source documents (Markdown, LaTeX, PDF, or HTML), extract structured intent, and write/update `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, and `.planning/STATE.md` with clear traceability.

The phase must remain deterministic and evidence-backed. The objective is not an open-ended AI rewrite of planning files; it is a bounded workflow with explicit parsing, merge, and trace rules.

## Requirements

1. **BOOT-03 (Artifact initialization/update)**
   - Current: root Flow kernel has canonical command and policy helpers but no bootstrap artifact pipeline.
   - Target: `flow-create-additional-phases` ingests a supported source document (Markdown, LaTeX, PDF, or HTML) and deterministically initializes or extends `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, and `.planning/STATE.md`.
   - Acceptance: Given a valid supported source document, the workflow produces coherent artifacts (create when missing, update when present) without breaking existing phase structure.

2. **BOOT-04 (Traceability)**
   - Current: no source-to-artifact mapping output is produced.
   - Target: bootstrap run records section-level trace links from source document into generated/updated artifact content.
   - Acceptance: A machine-readable trace map is persisted per run and references both source section ids/headings and artifact targets.

## Boundaries

**In scope:**
- Root Flow bootstrap command implementation in `flow/`.
- Multi-format ingestion (Markdown, LaTeX, PDF, HTML) and section extraction.
- Deterministic artifact update policy for the four `.planning/` files.
- Source-to-artifact trace map generation.
- Tests for parsing, merge behavior, and traceability output.

**Out of scope:**
- Executing lifecycle phases (Phase 3+).
- Interactive delegation loops (Phase 3+).
- Evidence governance and escalation controls beyond bootstrap trace records (Phase 5).
- New workflow types beyond `/flow-create-additional-phases` and `/flow-execute-all-phases`.

## Constraints

- Flow implementation remains in root `flow/`; gsd-pi remains a thin adapter.
- Updates to `.planning/` must be deterministic and idempotent for same input.
- Existing roadmap phases must not be destroyed by bootstrap merges.
- Trace output must be persisted for each bootstrap run.

## Phase Sizing Policy (How many phases are created)

The bootstrap workflow must deterministically choose phase count and boundaries from normalized source intent.

- A phase is the smallest independently verifiable delivery slice that can be validated with explicit acceptance checks.
- Candidate work items are scored with a deterministic complexity rubric across four dimensions:
   - breadth (how many subsystems are touched)
   - dependency depth (how many prerequisites/blockers)
   - risk/uncertainty (novelty, ambiguity, failure impact)
   - verification surface (how much testing and validation is needed)
- The workflow computes total complexity and partitions items into phase buckets using a target complexity per phase.
- Default controls:
   - `target_complexity_per_phase = 10`
   - `min_phases = 5`
   - `max_phases = 50`
- Resulting phase count is clamped to `[min_phases, max_phases]` and must be stable for the same input and configuration.
- If a single item exceeds target complexity, it must be split into sub-slices before roadmap emission.

## Acceptance Criteria

- [ ] BOOT-03: Bootstrap can create/update `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, and `.planning/STATE.md` from a supported source document (Markdown, LaTeX, PDF, HTML).
- [ ] BOOT-03: Re-running with the same source is idempotent (no unbounded drift).
- [ ] BOOT-03: Phase count and boundaries are derived by deterministic sizing policy and remain stable for identical inputs/config.
- [ ] BOOT-04: A persisted trace map links source sections to artifact edits.
- [ ] Phase 1 placement rule holds: Flow behavior in root `flow/`, only bridge code in `external/gsd-pi`.

## Prohibitions (must-NOT)

- Must not implement bootstrap control flow inside `external/gsd-pi` core workflow handlers.
- Must not mutate unrelated roadmap phases when processing a focused source update.
- Must not emit artifact text without trace references for newly generated sections.

## Ambiguity Report

| Dimension | Score | Min | Status | Notes |
|-----------|-------|-----|--------|-------|
| Goal Clarity | 0.90 | 0.75 | pass | Bootstrap outcome is explicit |
| Boundary Clarity | 0.87 | 0.70 | pass | Phase 2 vs 3/4/5 boundaries are explicit |
| Constraint Clarity | 0.81 | 0.65 | pass | Placement, idempotence, and merge constraints are explicit |
| Acceptance Criteria | 0.84 | 0.70 | pass | BOOT-03 and BOOT-04 have concrete checks |
| **Ambiguity** | 0.16 | <=0.20 | pass | Ready for discuss/context and planning |

---

*Phase: 02-bootstrap-workflow-large-markdown-project-artifacts*
*Next step: /gsd-discuss-phase 2*
