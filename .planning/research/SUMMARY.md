# Project Research Summary

**Project:** Flow
**Domain:** General-purpose autonomous coding platform / software development factory (Pi + GSD)
**Researched:** 2026-07-17
**Confidence:** MEDIUM

## Executive Summary

Flow should be built as a reliability-first autonomous engineering platform with deterministic orchestration in the control plane and bounded agent execution in isolated cells. The research converges on a workflow-first architecture where two initial workflows anchor the product: (1) bootstrap from large markdown into high-quality GSD artifacts and (2) autonomous roadmap phase execution through discuss -> plan -> execute -> verify. Experts build this category by making state transitions, routing, and gates code-authoritative, while keeping agents task-scoped and contract-bound.

The recommended approach is to implement a host-authoritative lifecycle kernel first, then layer unit contracts, policy enforcement, and evidence-first verification before expanding autonomy breadth. Technology choices align to this posture: Node.js + TypeScript for unified runtime discipline, Temporal for durable workflow control, PostgreSQL as system of record, and Kubernetes isolation with gVisor for untrusted code execution. Observability is not optional; OpenTelemetry with metrics/log/trace correlation is required to debug retries, gate failures, and workflow regressions.

The largest risks are orchestration entropy, prompt-driven control flow, verification theater, and memory drift. Mitigation is explicit and implementation-oriented: versioned state machines, deterministic routing and gate taxonomy, bounded retries with escalation, machine-readable verification verdicts tied to evidence, and transactional memory/provenance rules. Flow should optimize for validated outcomes rather than throughput until foundational reliability KPIs are consistently met.

## Key Findings

### Recommended Stack

The stack is opinionated around operational predictability and durable workflow execution rather than maximum flexibility. Keep a single runtime in v1 (Node.js 22 LTS + TypeScript 5.9 strict), use Temporal as the durable workflow backbone, and treat PostgreSQL as authoritative process memory with object storage for immutable evidence. Use Redis only for ephemeral cache/rate-limit concerns, not as source-of-truth lifecycle queueing.

The infrastructure model should prioritize containment and auditability: Kubernetes-managed execution with gVisor isolation, strict network policy (Cilium), and unified telemetry via OpenTelemetry -> Prometheus/Loki/Tempo/Grafana. UI should remain pragmatic and operationally focused (Next.js + React + TanStack Query + Radix/Tailwind) to surface run state, gates, retries, and evidence quickly.

**Core technologies:**
- Node.js 22 LTS + TypeScript 5.9 strict: control and execution runtime consistency, strong contracts, lower integration risk.
- Temporal (TypeScript SDK): durable orchestration for retries, pause/resume, and long-running workflow state.
- PostgreSQL (17/18 validated): authoritative transactional store for lifecycle state, metadata, and provenance.
- Kubernetes + gVisor + Cilium: isolated execution cells with least privilege and strong boundary controls.
- OpenTelemetry + Prometheus + Grafana/Tempo/Loki: end-to-end observability for reliability operations.

### Expected Features

Flow v1 must deliver trustable automation, not just autonomous activity. Table-stake expectations include deterministic workflow routing, full phase lifecycle execution, evidence-backed gates, resumability, traceability, and human escalation points. Differentiation comes from turning large markdown into executable GSD structure and running roadmap phases through lifecycle-native autonomy with explicit reliability contracts.

**Must have (table stakes):**
- Structured bootstrap from large markdown to GSD artifacts with traceability.
- Deterministic routing and lifecycle orchestration (no prompt roulette).
- Evidence-backed verification gates with persisted outcomes.
- Failure handling, pause/resume, and checkpoint-aware recovery.
- Full auditability linking requirements, execution, and completion evidence.

**Should have (competitive):**
- Bootstrap-to-roadmap compiler with quality checks.
- Reliability contracts per workflow (success criteria, gate rules, evidence bundle).
- Factory memory that reuses proven decisions/outcomes with provenance.
- Verification-aware autonomy that escalates on low confidence/high risk.

**Defer (v2+):**
- Broad workflow catalog beyond initial two workflows.
- Plugin marketplace and broad multi-repo orchestration.
- Excessive UI/collaboration scope before execution correctness metrics stabilize.

### Architecture Approach

The architecture should enforce a strict control-plane/execution-plane split. Control plane owns intake normalization, deterministic router, lifecycle transitions, gate engine, policy/trust boundaries, authoritative state, and publication. Execution plane owns bounded implementation work in isolated cells under unit contracts (tools, writable paths, output schema). Completion publishing must remain control-plane-only and contingent on passing deterministic verification with current-source evidence.

**Major components:**
1. Intake Adapter + Workflow Router: normalize untrusted input and deterministically select workflow entrypoint.
2. Lifecycle Orchestrator + Gate Engine: drive state machine transitions with bounded retries/escalation.
3. State Authority + Projection Layer: DB as truth, markdown as projection/review surface.
4. Dispatcher + Execution Cells: contract-bound unit execution with strict tool/policy boundaries.
5. Verification Worker + Closeout Publisher: evidence-first verdict and authoritative completion publish.

### Critical Pitfalls

1. **Orchestration collapse:** prevent workflow-graph entropy with versioned state machines, explicit gates, deterministic replay logs.
2. **Prompt overreach:** keep prompts task-scoped; move routing/policy/branching into deterministic code.
3. **Weak verification theater:** require layered verification (existence, substance, wiring, behavior) and hard fail on weak evidence.
4. **Memory drift:** enforce transactional memory writes with provenance and periodic reconciliation against repo truth.
5. **Unsafe autonomy:** apply untrusted-input boundaries, least privilege, and mandatory escalation for high-risk actions.

## Implications for Roadmap

Based on combined research, Flow should be phased around reliability primitives first, then autonomy breadth.

### Phase 1: Lifecycle Kernel and State Authority
**Rationale:** all other capabilities depend on deterministic state transitions and durable lineage.
**Delivers:** canonical workflow entities, idempotent transitions, checkpoints, retry budgets, authoritative DB schema.
**Addresses:** deterministic routing and resumability table stakes.
**Avoids:** orchestration collapse, prompt-owned control flow.

### Phase 2: Unit Contracts, Policy, and Execution Isolation
**Rationale:** bounded autonomy and safety must be in place before meaningful execution throughput.
**Delivers:** unit manifest schema, tool/writable-scope enforcement, execution-cell runtime, least-privilege policies.
**Uses:** Kubernetes isolation stack (including gVisor), policy engine guardrails.
**Avoids:** unsafe autonomy, cross-cell interference.

### Phase 3: Workflow A - Large Markdown Bootstrap
**Rationale:** first workflow proves intake-to-artifact transformation and grounds all downstream planning.
**Delivers:** ingestion normalization, intent extraction, contradiction checks, PROJECT/REQUIREMENTS/ROADMAP/phase scaffold generation with quality gates.
**Implements:** intake adapter, router path A, projection validation.
**Avoids:** memory drift and prompt overreach during bootstrap.

### Phase 4: Workflow B - Autonomous Phase Execution (Discuss/Plan/Execute/Verify)
**Rationale:** second workflow proves reliability-first autonomy on roadmap-driven delivery.
**Delivers:** phase selection, dispatch pipeline, bounded recovery, deterministic post-unit closeout.
**Addresses:** end-to-end lifecycle execution table stakes and differentiator.
**Avoids:** giant-skill anti-pattern via stage-specialized agents/contracts.

### Phase 5: Verification and Evidence Governance
**Rationale:** validated outcomes are product truth; publication must be evidence-gated.
**Delivers:** deterministic verification workers, verdict model, evidence bundles, fail/esc escalation pathways, current-source match checks.
**Uses:** OTel-linked run evidence and provenance indexing.
**Avoids:** weak verification theater and reliability reversal.

### Phase 6: Observability, Memory Improvement, and Controlled Expansion
**Rationale:** once reliability baseline is proven, optimize learning loops and scale safely.
**Delivers:** run-level telemetry dashboards, memory quality scoring, drift detectors, initial routed workflow expansion criteria.
**Addresses:** factory memory differentiator and future workflow specialization.
**Avoids:** premature workflow sprawl and low-signal memory accumulation.

### Phase Ordering Rationale

- Reliability dependencies are strict: state authority -> policy/isolation -> workflows -> verification governance -> expansion.
- Workflow A must precede Workflow B because autonomous execution quality depends on artifact quality from bootstrap.
- Verification infrastructure is elevated to a standalone phase to prevent false-green delivery pressure.
- Expansion is gated by reliability KPIs (defect escape, re-open rate, verifier disagreement, rollback frequency).

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (Isolation and Policy):** runtime hardening details, least-privilege credential model, and policy exception governance.
- **Phase 5 (Verification Governance):** verification tiering strategy and evidence cost/latency tradeoffs at scale.
- **Phase 6 (Expansion):** routing-classifier confidence thresholds and misroute remediation loops.

Phases with standard patterns (can usually skip research-phase):
- **Phase 1 (Lifecycle Kernel):** well-understood state machine and idempotency patterns.
- **Phase 3 (Bootstrap baseline):** schema-driven ingestion and projection checks are established patterns.
- **Phase 4 (Core orchestration):** discuss/plan/execute/verify lifecycle pattern is well-documented in GSD references.

## Guardrails

- Deterministic code owns routing, gates, retries, and completion publishing.
- Agent outputs are proposals; host runtime decides state transitions.
- No completion publication without passing deterministic verification and attached evidence.
- Markdown artifacts are projections, not authority; DB remains canonical truth.
- All external/fetched content is treated as untrusted input.
- High-risk actions require explicit escalation/approval and immutable audit trail.
- Parallel execution requires worktree/cell isolation plus base-integrity checks.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Strong alignment with reliability-first architecture; some infrastructure choices still pattern-driven and need operational validation. |
| Features | MEDIUM-HIGH | Table stakes/differentiators are well-grounded in domain and GSD workflow constraints. |
| Architecture | MEDIUM | Control/execution split and host-authoritative lifecycle are clear; Pi internals remain partially opaque. |
| Pitfalls | HIGH | Pitfalls and mitigations strongly corroborated by GSD references and reliability anti-pattern literature. |

**Overall confidence:** MEDIUM

### Gaps to Address

- Pi-specific runtime mechanics and extension seams require deeper implementation-time validation.
- Quantitative SLO targets for verification latency/cost and retry budgets are not yet fixed.
- Multi-tenant and multi-region scaling assumptions remain future-state and should not shape v1 architecture prematurely.
- Memory quality governance thresholds (promote/prune/reconcile cadence) need empirical tuning after early runs.

## Sources

### Primary (HIGH confidence)
- `.planning/PROJECT.md` - product intent, scope boundaries, reliability-first constraints.
- `$HOME/.claude/gsd-core/references/gates.md` - gate taxonomy and lifecycle controls.
- `$HOME/.claude/gsd-core/references/agent-contracts.md` - stage contracts, completion semantics.
- `$HOME/.claude/gsd-core/references/verification-patterns.md` - evidence-first verification design.
- `$HOME/.claude/gsd-core/references/untrusted-input-boundary.md` - trust-boundary rules.
- `$HOME/.claude/gsd-core/references/loop-hook-dispatch.md` - deterministic hook dispatch guidance.
- `$HOME/.claude/gsd-core/references/execute-phase-wave-guard.md` - parallel wave isolation safeguards.

### Secondary (MEDIUM confidence)
- `.planning/research/STACK.md`
- `.planning/research/FEATURES.md`
- `.planning/research/ARCHITECTURE.md`
- `.planning/research/PITFALLS.md`
- https://github.com/open-gsd/gsd-core
- https://github.com/open-gsd/gsd-pi

### Tertiary (LOW confidence)
- https://pi.ai (limited technical depth for implementation details)
- General pattern inferences on deferred eventing and scaling choices pending live workload data

---
*Research completed: 2026-07-17*
*Ready for roadmap: yes*
