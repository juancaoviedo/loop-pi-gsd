# Roadmap: Flow

## Milestone 1 - Factory Foundations

### Phase 1: Pi Integration Baseline and Safe Routing
**Goal:** Establish Pi/gsd-pi as the execution authority, then layer deterministic routing and policy boundaries without duplicating existing lifecycle semantics.
**Mode:** mvp
**Requirements:** BOOT-01, BOOT-02, CTRL-01, CTRL-02, CTRL-05, SAFE-01
**Success Criteria:**
1. Integration boundaries between Flow and Pi/gsd-pi are defined, with ownership split documented (what Flow orchestrates vs what Pi/gsd-pi already guarantees).
2. Intake jobs can be normalized and routed to a workflow class deterministically.
3. Policy boundaries prevent unauthorized tool/use-path combinations during execution.
4. Phase progression uses Pi/gsd-pi workflow surfaces and write/gate mechanisms rather than a duplicate lifecycle engine.

### Phase 2: Bootstrap Workflow (Large Markdown -> Project Artifacts)
**Goal:** Deliver the first end-to-end factory workflow that turns a large product-definition markdown file into usable GSD project artifacts.
**Mode:** mvp
**Requirements:** BOOT-03, BOOT-04
**Success Criteria:**
1. A large markdown input can generate coherent project artifacts (`PROJECT`, `REQUIREMENTS`, `ROADMAP`, `STATE`).
2. Generated artifacts include traceability links back to source sections.
3. Generated project output can be reviewed and advanced through standard GSD commands without manual rework.

### Phase 3: Phase Reader and Execution Orchestrator
**Goal:** Build the second foundational workflow that reads roadmap phases and prepares autonomous phase execution with isolation.
**Mode:** mvp
**Requirements:** PHASE-01, SAFE-02, INTD-01, INTD-02
**Success Criteria:**
1. System can load roadmap phases and select target phases for execution.
2. Selected phases run in isolated execution contexts.
3. Orchestrator can hand off phase context into the lifecycle chain reliably.
4. Interactive workflow question rounds can be intercepted and routed to responder agents with deterministic context packs.

### Phase 4: Autonomous Phase Lifecycle Engine
**Goal:** Execute phases through the GSD lifecycle chain autonomously with deterministic retries and verification hooks.
**Mode:** mvp
**Requirements:** PHASE-02, PHASE-03, PHASE-04, INTD-03, VER-01, VER-02, VER-03
**Success Criteria:**
1. For a selected phase, lifecycle execution progresses through required GSD steps without manual sequencing.
2. Failed checks trigger bounded repair/revision loops with preserved context.
3. Each run produces machine-readable verification outputs and blocks completion on failed gates.
4. Delegated interactive answers are schema-validated before blocked steps are resumed.

### Phase 5: Evidence, Memory, and Controlled Escalation
**Goal:** Add reliability governance: evidence bundles, memory reconciliation, and risk-based escalation.
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

---
*Roadmap defined: 2026-07-17*
*Project mode: Vertical MVP*