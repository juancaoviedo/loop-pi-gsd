# Feature Landscape

**Domain:** General-purpose autonomous coding platform / software development factory
**Project:** Flow
**Researched:** 2026-07-17
**Confidence:** MEDIUM-HIGH (high on GSD workflow assumptions, medium on Pi/GSD-Pi specifics due limited local docs)

## Table Stakes

Features users expect in this category. Missing these makes the platform feel unsafe or incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Structured project bootstrap from long-form spec | Teams expect architecture/product docs to become actionable artifacts, not remain static docs | MEDIUM | Must parse large markdown and generate/extend `.planning/PROJECT.md`, `ROADMAP.md`, requirements, and phase scaffolding with traceability |
| Deterministic workflow routing (workflow-first control plane) | Teams expect predictable behavior from an execution platform, not prompt roulette | HIGH | Routing logic should be code-driven with explicit states and transitions (bootstrap -> discuss/plan/execute/verify) |
| End-to-end phase lifecycle execution | Autonomous coding products are expected to plan, execute, and verify, not just generate plans | HIGH | Must support discuss/plan/execute/verify loops with resumability and clear completion markers |
| Evidence-backed verification gates | Reliability-first teams expect proof, not claims | HIGH | Require deterministic checks, explicit gate outcomes (pre-flight/revision/escalation/abort), and stored verification artifacts |
| Failure handling and resumability | Long-running autonomous work must recover from failures and interruptions | MEDIUM | Pause/resume via handoff artifacts and checkpoint-aware orchestration should be first-class |
| Full traceability and audit log | Teams need to answer: what changed, why, and based on which requirement | MEDIUM | Link each plan and execution step to requirements, commits, summaries, and decision records |
| Workspace isolation for parallel runs | Small teams still need safe concurrency | HIGH | Isolated execution cells/worktrees prevent cross-task contamination and improve repeatability |
| Human escalation and approval touchpoints | Teams expect control over risky actions | MEDIUM | Explicit escalation gates for ambiguity, low-confidence outcomes, and revision-loop exhaustion |
| Operational observability | Reliability needs actionable signals | MEDIUM | Capture workflow status, retries, gate failures, and phase throughput as baseline telemetry |

## Differentiators

Features that make Flow meaningfully better than generic coding agents.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Bootstrap-to-roadmap compiler | Converts a large product definition directly into executable GSD structure | HIGH | Strong initial differentiator; should emit artifacts with quality checks, not just generated text |
| Lifecycle-native autonomous execution | Executes roadmap phases through full GSD lifecycle instead of one-shot code generation | HIGH | Creates repeatability and governance; aligns with reliability-first positioning |
| Reliability contract per workflow | Every workflow has explicit success criteria, gate rules, and evidence outputs | MEDIUM | Turns agent behavior into inspectable engineering process |
| Factory memory over time | Reuses prior decisions, summaries, and phase outcomes to improve future execution quality | HIGH | Compound advantage for small teams; requires disciplined artifact indexing and retrieval |
| Specialized workflow routing (future-ready) | Ticket/job routed to best workflow type (feature, bugfix, chore, hotfix, bootstrap) | HIGH | Foundation for software-factory vision; should start with deterministic heuristics before ML routing |
| Verification-aware autonomy | Autonomy level adapts to confidence and risk, escalating when evidence is weak | MEDIUM | Increases trust and reduces silent failures |

## Anti-Features (Avoid Early)

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Fully autonomous, no-approval production shipping on day one | High blast radius and poor trust during early product maturity | Keep human approvals at escalation gates and high-risk transitions |
| Too many workflow types in v1 | Spreads reliability effort thin and delays proof of core thesis | Ship two core workflows first: bootstrap and autonomous phase execution |
| Prompt-only orchestration | Non-deterministic control flow undermines repeatability and debugging | Implement workflow routing/state transitions in deterministic code |
| Multi-repo/multi-service orchestration from start | Coordination complexity can bury core value | Focus on single-project reliability, then expand to portfolio orchestration |
| Heavy autonomous self-modification of workflow engine | Increases unpredictable regressions | Treat workflow definitions as versioned, reviewed artifacts |
| Broad plugin marketplace before core stability | Integration surface amplifies failures and support burden | Start with curated integrations and strict capability contracts |
| Real-time collaboration and UI polish-first scope | Attractive but not central to reliability proof | Prioritize execution correctness, verification, and observability first |

## Feature Dependencies

```text
Document Ingestion + Intent Extraction
  -> GSD Artifact Generation (PROJECT/REQUIREMENTS/ROADMAP/phase skeleton)
  -> Phase Selection + Routing
  -> Discuss/Plan lifecycle execution
  -> Plan execution
  -> Verification gates + evidence capture
  -> Progress/state updates + memory index

Execution Isolation
  -> Safe Parallel Execution
  -> Higher Throughput

Traceability Layer
  -> Auditability
  -> Trust for autonomous operation

Escalation System
  -> Human approvals
  -> Controlled autonomy at high-risk boundaries
```

## Dependency Notes

- Bootstrap compiler requires robust ingestion first. Parsing and intent extraction quality directly determines roadmap and phase quality.
- Autonomous phase execution requires artifact completeness. If generated artifacts are low quality, execution reliability collapses.
- Verification gates require deterministic checks before judge-style evaluation. Code-based checks should be implemented before subjective evaluation layers.
- Safe parallelism requires isolation before concurrency. Add execution cells/worktrees first, then fan-out scheduling.
- Memory quality requires traceability discipline. Without consistent artifact links, memory retrieval will amplify noise.

## Complexity Notes by Capability Cluster

| Cluster | Complexity | Why |
|---------|------------|-----|
| Bootstrap pipeline (long markdown -> GSD artifacts) | HIGH | Requires robust parsing, schema/quality validation, and ambiguity handling |
| Lifecycle orchestration engine | HIGH | Stateful multi-step workflow with retries, resumability, and gates |
| Verification and evidence system | HIGH | Needs deterministic checks, clear thresholds, and artifactized outputs |
| Isolation + parallel execution cells | HIGH | Safety, reproducibility, and resource management concerns |
| Escalation and approval UX/flow | MEDIUM | Logic is straightforward, but policy design and edge handling matter |
| Traceability graph across artifacts/execution | MEDIUM | Mostly schema and linking discipline, but critical to trust |
| Memory retrieval and reuse | MEDIUM-HIGH | High long-term value; risk of low-signal recall if not curated |
| Workflow routing for multiple job types | MEDIUM initially, HIGH at scale | Start rule-based; complexity rises with specialization and load |

## MVP Recommendation (Flow v1)

Prioritize:
1. Project bootstrap workflow from large markdown into high-quality GSD artifacts and initial phases.
2. Autonomous phase execution workflow across discuss/plan/execute/verify with gate-enforced reliability.
3. Verification/evidence and resumability as first-class requirements, not add-ons.

Defer:
- Broad workflow catalog, portfolio-level scheduling, and deep plugin ecosystem until reliability metrics are stable.

## Sources

- `.planning/PROJECT.md` (product intent, constraints, scope boundaries)
- `/home/juan/.claude/gsd-core/references/artifact-types.md` (artifact contracts and lifecycle)
- `/home/juan/.claude/gsd-core/references/gates.md` (validation gate taxonomy)
- `/home/juan/.claude/gsd-core/references/agent-contracts.md` (completion/handoff contracts)
- `/home/juan/.claude/gsd-core/references/ai-evals.md` (verification and evaluation strategy)
