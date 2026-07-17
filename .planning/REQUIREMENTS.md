# Requirements: Flow

**Defined:** 2026-07-17
**Core Value:** Turn ambiguous software intent into reliable, evidence-backed engineering execution through reusable AI developer workflows.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Intake & Bootstrap

- [ ] **BOOT-01**: User can provide a large markdown product or architecture file as factory input.
- [ ] **BOOT-02**: System can parse the file and extract project intent, constraints, and scope candidates.
- [ ] **BOOT-03**: System can initialize `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, and `.planning/STATE.md` from extracted intent.
- [ ] **BOOT-04**: Bootstrap run records traceability from source document sections to generated artifacts.

### Workflow Control

- [ ] **CTRL-01**: System routes jobs deterministically to the correct workflow type.
- [ ] **CTRL-02**: System enforces an explicit lifecycle state machine with idempotent transitions.
- [ ] **CTRL-03**: System supports pause/resume and recovery from checkpoints without losing phase context.
- [ ] **CTRL-04**: System records immutable run metadata for each workflow execution.
- [ ] **CTRL-05**: System applies GSD workflow rules through Pi/gsd-pi workflow surfaces instead of reimplementing lifecycle semantics from scratch.

### Phase Execution

- [ ] **PHASE-01**: System can read phases from ROADMAP and select a phase for execution.
- [ ] **PHASE-02**: For a selected phase, system can run the GSD lifecycle chain needed for autonomous progression.
- [ ] **PHASE-03**: System can update phase status and artifacts after each lifecycle step.
- [ ] **PHASE-04**: System can loop revision and repair when checks fail, within defined retry policies.

### Interactive Delegation

- [ ] **INTD-01**: System can intercept interactive question rounds from spec/discuss workflows and route them to a responder agent.
- [ ] **INTD-02**: Responder agent receives deterministic context packs (project artifacts, roadmap, source intent) before answering.
- [ ] **INTD-03**: System validates responder answers against required schema before resuming blocked workflow steps.
- [ ] **INTD-04**: System applies policy-gated escalation to human when confidence is low, answers conflict, or risk threshold is exceeded.
- [ ] **INTD-05**: Every delegated question/answer round is persisted as auditable evidence with provenance.

### Verification & Evidence

- [ ] **VER-01**: Each phase execution produces deterministic verification outputs (lint/test/type/build or equivalent checks).
- [ ] **VER-02**: System stores evidence bundles and a machine-readable verdict per phase run.
- [ ] **VER-03**: System blocks completion when required verification evidence is missing or fails.
- [ ] **VER-04**: System can escalate to human review for high-risk or low-confidence outcomes.

### Memory & Traceability

- [ ] **MEM-01**: System persists project memory that links requirements, phases, runs, and outcomes.
- [ ] **MEM-02**: System preserves decision provenance for generated plans and revisions.
- [ ] **MEM-03**: System can reconcile markdown projections with authoritative runtime state.

### Reliability & Safety

- [ ] **SAFE-01**: System enforces least-privilege execution boundaries for autonomous runs.
- [ ] **SAFE-02**: System isolates parallel runs to avoid cross-run state contamination.
- [ ] **SAFE-03**: High-risk actions require explicit policy-gated escalation before finalization.

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Factory Expansion

- **FACT-01**: System can ingest tickets from external systems (GitHub Issues, Jira, Linear) and normalize them into workflow jobs.
- **FACT-02**: System can route across a broader workflow catalog (feature, bugfix, chore, hotfix, refactor, docs).
- **FACT-03**: System can optimize routing/model selection using historical run quality and cost metrics.

### Collaboration & Governance

- **GOV-01**: Team can define role-based policy profiles for autonomy levels and escalation rules.
- **GOV-02**: Team can approve/reject workflow transitions through structured review gates in a dedicated interface.
- **GOV-03**: System can provide portfolio-level dashboards across multiple projects.

### Integrations

- **INT-01**: System can integrate with CI/CD systems to synchronize verification and release status.
- **INT-02**: System can support plugin-style workflow extensions with capability contracts.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Fully unsupervised production shipping in v1 | Reliability-first strategy requires evidence and controlled escalation before zero-touch release trust is established |
| Broad plugin marketplace in v1 | Too much integration surface before core workflow reliability is proven |
| Multi-repo portfolio orchestration in v1 | Adds complexity before single-project factory reliability is validated |
| Replacing Pi or GSD internals | Flow should compose existing Pi and GSD capabilities rather than fork/rebuild the core platforms |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| BOOT-01 | Phase 1 | Pending |
| BOOT-02 | Phase 1 | Pending |
| BOOT-03 | Phase 2 | Pending |
| BOOT-04 | Phase 2 | Pending |
| CTRL-01 | Phase 1 | Pending |
| CTRL-02 | Phase 1 | Pending |
| CTRL-05 | Phase 1 | Pending |
| CTRL-03 | Phase 5 | Pending |
| CTRL-04 | Phase 5 | Pending |
| PHASE-01 | Phase 3 | Pending |
| PHASE-02 | Phase 4 | Pending |
| PHASE-03 | Phase 4 | Pending |
| PHASE-04 | Phase 4 | Pending |
| INTD-01 | Phase 3 | Pending |
| INTD-02 | Phase 3 | Pending |
| INTD-03 | Phase 4 | Pending |
| INTD-04 | Phase 5 | Pending |
| INTD-05 | Phase 5 | Pending |
| VER-01 | Phase 4 | Pending |
| VER-02 | Phase 4 | Pending |
| VER-03 | Phase 4 | Pending |
| VER-04 | Phase 5 | Pending |
| MEM-01 | Phase 5 | Pending |
| MEM-02 | Phase 5 | Pending |
| MEM-03 | Phase 5 | Pending |
| SAFE-01 | Phase 1 | Pending |
| SAFE-02 | Phase 3 | Pending |
| SAFE-03 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 28 total
- Mapped to phases: 28
- Unmapped: 0

---
*Requirements defined: 2026-07-17*
*Last updated: 2026-07-17 after initialization*