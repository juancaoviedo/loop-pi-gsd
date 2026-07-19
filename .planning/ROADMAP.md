# Roadmap: Flow

## Milestone 1 - Factory Foundations

Milestone 1 is the thin deterministic kernel for Flow's slash-command workflows. It exists to define command surfaces, routing, and safety boundaries, while later phases provide the workflow behavior that actually expands and executes the roadmap.

Implementation placement for Milestone 1 is explicit: Flow kernel logic lives in the root `flow/` folder. `external/gsd-pi` keeps only thin bridge code at integration seams.

## Phase Capability Map

The roadmap below is organized around two slash-command workflows, with deterministic code and focused helper skills underneath them.

| Phase | Workflow surface | Helper skill role | Deterministic code role | Primary outcome |
|-------|------------------|-------------------|-------------------------|-----------------|
| 1 | `/flow-create-additional-phases` and `/flow-execute-all-phases` command routing entrypoints | Minimal or none; keep helper logic out of the control plane unless it is strictly for parsing or normalization | Root-level `flow/` exact-match normalization, canonical workflow registry, policy gates, and thin Pi/gsd-pi bridge boundaries | A thin kernel that safely routes Flow commands without duplicating lifecycle semantics |
| 2 | `/flow-create-additional-phases` | Document ingestion helpers for large markdown, HTML, PDF, or LaTeX sources; structure extraction helpers for headings, constraints, and intent | Chunking, phase boundary proposal, merge/dedupe against ROADMAP.md, phase addition writes | A deterministic bootstrap workflow that turns a large source document into roadmap phases |
| 3 | `/flow-execute-all-phases` orchestration entrypoint | Phase/context loader helpers and responder-agent packing helpers for interactive questions | Phase enumeration, selection, checkpointing, and ordered dispatch into the GSD lifecycle chain | A deterministic orchestration workflow that can select and prepare phases for execution |
| 4 | `/flow-execute-all-phases` per-phase lifecycle loop | Summary/context pack helpers and verification-result helpers | Fixed GSD command chain, resume logic, bounded retries, and verification gate enforcement | A deterministic phase execution engine that progresses each phase through discuss, plan, execute, and verify |
| 5 | `/flow-execute-all-phases` evidence and escalation closure | Evidence bundling helpers, provenance helpers, and escalation summarizers | Evidence persistence, memory reconciliation, risk thresholds, and controlled escalation gates | An auditable reliability layer that preserves provenance across all Flow phase runs |

The rule of thumb is simple: if the step must always happen in the same order, it belongs in deterministic code or workflow logic; if the step is a reusable subproblem inside a workflow, it can be a helper skill.

### Phase 1: Pi Integration Baseline and Safe Routing

**Goal:** Establish the deterministic kernel for Flow's slash-command workflows, with Pi/gsd-pi as the execution authority and with routing/policy boundaries that do not duplicate lifecycle semantics.
**Mode:** mvp
**Requirements:** BOOT-01, BOOT-02, CTRL-01, CTRL-02, CTRL-05, SAFE-01
**Success Criteria:**

1. Integration boundaries between Flow and Pi/gsd-pi are defined, with ownership split documented (what Flow orchestrates vs what Pi/gsd-pi already guarantees).
2. Slash-command intake can be normalized and routed deterministically into the two Flow workflows: `flow-create-additional-phases` and `flow-execute-all-phases`.
3. Policy boundaries prevent unauthorized tool/use-path combinations during execution.
4. Phase progression uses Pi/gsd-pi workflow surfaces and write/gate mechanisms rather than a duplicate lifecycle engine.
5. Flow kernel code for these concerns lives in root `flow/` with only a thin bridge retained in `external/gsd-pi`.

### Phase 2: Bootstrap Workflow (Large Markdown -> Project Artifacts)

**Goal:** Deliver the first end-to-end factory workflow behind `/flow-create-additional-phases`, turning a large product-definition markdown file into usable GSD project artifacts.
**Mode:** mvp
**Requirements:** BOOT-03, BOOT-04
**Success Criteria:**

1. A large markdown input can generate coherent project artifacts (`PROJECT`, `REQUIREMENTS`, `ROADMAP`, `STATE`).
2. Generated artifacts include traceability links back to source sections.
3. Generated project output can be reviewed and advanced through standard GSD commands without manual rework.

### Phase 3: Phase Reader and Execution Orchestrator

**Goal:** Build the deterministic orchestration workflow behind `/flow-execute-all-phases`, reading roadmap phases and preparing autonomous phase execution with isolation.
**Mode:** mvp
**Requirements:** PHASE-01, SAFE-02, INTD-01, INTD-02
**Success Criteria:**

1. System can load roadmap phases and select target phases for execution.
2. Selected phases run in isolated execution contexts.
3. Orchestrator can hand off phase context into the lifecycle chain reliably.
4. Interactive workflow question rounds can be intercepted and routed to responder agents with deterministic context packs.

### Phase 4: Autonomous Phase Lifecycle Engine

**Goal:** Execute phases through the GSD lifecycle chain autonomously with deterministic retries and verification hooks as part of `/flow-execute-all-phases`.
**Mode:** mvp
**Requirements:** PHASE-02, PHASE-03, PHASE-04, INTD-03, VER-01, VER-02, VER-03
**Success Criteria:**

1. For a selected phase, lifecycle execution progresses through required GSD steps without manual sequencing.
2. Failed checks trigger bounded repair/revision loops with preserved context.
3. Each run produces machine-readable verification outputs and blocks completion on failed gates.
4. Delegated interactive answers are schema-validated before blocked steps are resumed.

### Phase 5: Evidence, Memory, and Controlled Escalation

**Goal:** Add reliability governance: evidence bundles, memory reconciliation, and risk-based escalation for the slash-command workflows and their phase runs.
**Mode:** mvp
**Requirements:** CTRL-03, CTRL-04, INTD-04, INTD-05, VER-04, MEM-01, MEM-02, MEM-03, SAFE-03
**Success Criteria:**

1. Every phase run stores an evidence bundle and authoritative verdict history.
2. Project memory preserves provenance and reconciles markdown projections with runtime state.
3. High-risk or low-confidence outcomes escalate to explicit human review gates.
4. Delegated interactive rounds record agent identity, rationale summary, and escalation decisions in auditable artifacts.

## Milestone 2 - Factory Expansion (Planned)

### Phase 6: Multi-Workflow Intake and Routing Expansion

**Goal:** Extend factory intake beyond roadmap-driven execution to normalized ticket sources.
**Mode:** mvp
**Requirements:** FACT-01, FACT-02
**Success Criteria:**

1. External ticket sources can be normalized into factory jobs.
2. Router can select among at least four workflow types.
3. Routing decisions are auditable and configurable.

### Phase 7: Optimization, Governance, and Integrations

**Goal:** Add optimization loops, governance controls, and platform integrations.
**Mode:** mvp
**Requirements:** FACT-03, GOV-01, GOV-02, GOV-03, INT-01, INT-02
**Success Criteria:**

1. Factory can use historical run quality/cost data to improve routing/model choices.
2. Teams can configure autonomy and escalation policies by role.
3. CI/CD and extension integrations support controlled expansion without degrading reliability.

### Phase 8: Multi-Agent Spec/Discuss Architecture Contract

**Goal:** Define a deterministic architecture contract for independent multi-agent debate limited to `/gsd-spec-phase` and `/gsd-discuss-phase`.
**Mode:** mvp
**Requirements:** INTD-06, CONS-01, SAFE-04
**Plans:** 2/2 plans complete
Plans:

- [x] 08-01-PLAN.md — Establish deterministic contract baseline, prototype seam, and replay determinism for happy-path + role boundaries.
- [x] 08-02-PLAN.md — Harden full failure-mode matrix, bounded timeout/retry behavior, and sanitized governance persistence.

**Success Criteria:**

1. Agent roles, boundaries, and ownership are explicit: Agent A orchestrates and writes final artifacts; Agent B critiques and proposes revisions.
2. Message schemas are versioned and validated for proposal, critique, revision, vote, consensus, timeout, and error events.
3. Debate policy is deterministic: bounded rounds, timeout behavior, and escalation conditions are machine-enforced.
4. Failure-mode matrix covers malformed payloads, provider failures, no-response windows, and unresolved disagreement.

### Phase 9: Independent Agent B Runtime and Two-Round Consensus Slice

**Goal:** Implement a minimal production slice with Agent B as a fully separate process using an independent model provider, with two-round consensus for spec/discuss only.
**Mode:** mvp
**Requirements:** INTD-07, CONS-02, VER-05
**Plans:** 3 plans
Plans:
**Wave 1**

- [ ] 09-01-PLAN.md — Real separate-process Agent B + strict JSONL protocol + happy-path spec-phase ask/answer slice.

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 09-02-PLAN.md — Dedicated fail-closed config/provider isolation + bounded retry/timeout escalate-and-block failure policy.

**Wave 3** *(blocked on Wave 2 completion)*

- [ ] 09-03-PLAN.md — Both surfaces end-to-end on one phase-scoped process + scope lock + Agent A authority + delegation evidence.

**Success Criteria:**

1. Agent B runs in an isolated process with separate runtime config, provider credentials, and logs.
2. `/gsd-spec-phase` and `/gsd-discuss-phase` execute two deterministic debate rounds before final artifact generation.
3. Consensus policy decides pass/escalate deterministically and blocks artifact finalization on unresolved disagreement.
4. End-to-end tests prove independent process communication, retries, and fail-closed behavior.

### Phase 10: Governance-Grade Debate Transcript and Consensus Evidence

**Goal:** Persist complete debate provenance and consensus decisions as auditable governance artifacts aligned with reliability gates.
**Mode:** mvp
**Requirements:** MEM-04, MEM-05, GOV-04, SAFE-05
**Success Criteria:**

1. Every debate round stores structured transcript entries with timestamps, correlation IDs, agent identity, and confidence metadata.
2. Consensus outcomes persist rationale, unresolved objections, policy version, and escalation disposition.
3. Debate evidence is included in run evidence bundles and memory reconciliation outputs.
4. Finalization gates block completion when transcript integrity or consensus evidence is incomplete.

### Phase 11: Agora-Backed Agent Communication Isolation

**Goal:** Integrate `external/agora` transport primitives to provide signed, isolated agent-to-agent communication for multi-agent debate workflows.
**Mode:** mvp
**Requirements:** INT-03, SAFE-06, GOV-05
**Success Criteria:**

1. Debate message exchange uses signed envelopes and explicit peer identity boundaries.
2. Agent A and Agent B can communicate through direct and relay-backed paths without sharing process memory.
3. Transport-layer failures are surfaced into deterministic retry/escalation behavior.
4. Security and operational constraints are documented for key management, relay trust, and trace retention.

---
*Roadmap defined: 2026-07-17*
*Project mode: Vertical MVP*
