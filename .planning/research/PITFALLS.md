# Domain Pitfalls

**Domain:** General-purpose autonomous coding platform / software development factory (Pi + GSD)
**Project:** Flow
**Researched:** 2026-07-17

## Critical Pitfalls

### Pitfall 1: Orchestration Collapse (Workflow-Graph Entropy)
**Specific failure mode:**
The platform starts with two clean foundational workflows, then accumulates ad-hoc branches, hidden retries, and side-effectful hooks until control flow becomes non-deterministic and impossible to reason about. Failures route inconsistently, retries duplicate work, and different runs produce different outcomes for equivalent inputs.

**Early warning signs:**
- Same ticket/phase takes different paths across runs without explicit policy changes.
- Retry loops trigger without clear stop conditions or escalate too late.
- More incidents are caused by orchestration code than by application code.
- Team cannot explain end-to-end routing from intake to verified completion in one diagram.

**Prevention strategy:**
- Treat workflows as versioned state machines, not prompt scripts.
- Enforce explicit gate taxonomy (pre-flight, revision, escalation, abort) and bounded revision loops.
- Keep loop hooks declarative and auditable; forbid hidden mutable behavior inside hook handlers.
- Require per-workflow deterministic replay logs (input, route decision, gate outcomes, final state).

**Phase/layer that should address it:**
- **Phase:** Foundation architecture and workflow runtime phases (first two foundational workflows).
- **Layer:** Orchestration layer (routing engine, gate engine, loop-hook dispatcher).

---

### Pitfall 2: Prompt Overreach (Prompt Owns Control Flow)
**Specific failure mode:**
System behavior is embedded in giant prompts/skills instead of deterministic code boundaries. As complexity grows, prompt edits silently alter routing and policy behavior, creating brittle, non-testable control flow.

**Early warning signs:**
- Critical behavior changes are made by editing prompt text instead of code/config.
- A single "master skill" or mega-prompt controls planning, execution, validation, and escalation.
- Prompt changes repeatedly break unrelated workflows.
- Team cannot unit-test major control-flow decisions without full end-to-end agent runs.

**Prevention strategy:**
- Keep prompts task-scoped; move routing, branching, and policy to deterministic code.
- Enforce "small specialized skills" over giant skills.
- Separate agent cognition from workflow mechanics: agent proposes, code decides.
- Add structural plan-quality checks to block vague or scope-reduced plans before execution.

**Phase/layer that should address it:**
- **Phase:** Workflow design and skill architecture phase.
- **Layer:** Prompt/skill layer + orchestration policy layer.

---

### Pitfall 3: Weak Verification Theater (Checks Exist, Confidence Does Not)
**Specific failure mode:**
The factory reports success because files exist and commands ran, but outcomes are not actually validated. Stub implementations, false-green checks, and unverifiable assumptions pass through to production.

**Early warning signs:**
- Verification consists mostly of file existence and linter pass.
- Frequent "implemented" claims are followed by manual rework.
- Negative checks are bypassed by error-suppressing command patterns.
- Human verification is either absent or overloaded and ignored.

**Prevention strategy:**
- Enforce layered verification: existence, substance, wiring, functional behavior.
- Disallow fallback patterns that convert missing inputs into passing checks.
- Require explicit human verification bundles for UX/behavioral criteria when automation is insufficient.
- Track verification quality metrics: escaped defects, false positives, re-open rate, verifier disagreement.

**Phase/layer that should address it:**
- **Phase:** Verification framework phase and every execution phase thereafter.
- **Layer:** Verification layer (automated gates + human verification orchestration).

---

### Pitfall 4: Giant-Skill Anti-Pattern (Monolithic Agent Logic)
**Specific failure mode:**
A single giant skill accumulates planning, coding, testing, and deployment logic. This creates token-heavy brittle runs, weak observability, poor fault isolation, and expensive retries.

**Early warning signs:**
- One skill/prompt has many tools, many responsibilities, and frequent context overflow.
- Failures require re-running the entire pipeline instead of one stage.
- Minor changes require touching a large prompt body with broad blast radius.
- Debugging depends on transcript archaeology instead of stage-level logs.

**Prevention strategy:**
- Split workflows into stage agents with explicit contracts and handoff schemas.
- Keep stages independently testable and replayable.
- Define strict completion markers and interface contracts between stages.
- Use deterministic wrappers for state transitions so agent output is interpreted, not blindly trusted.

**Phase/layer that should address it:**
- **Phase:** Agent specialization and execution-cell design phase.
- **Layer:** Agent contract layer + workflow composition layer.

---

### Pitfall 5: Memory Drift (Project Truth Divergence)
**Specific failure mode:**
Operational memory (state files, summaries, decisions, context docs) drifts from actual code and execution results. The factory then plans/executes from stale assumptions and compounds errors over time.

**Early warning signs:**
- ROADMAP/state indicate done while code/tests contradict.
- Same decisions are repeatedly debated because canonical memory is unclear.
- Summaries omit deviations or verification caveats.
- Resume operations behave unpredictably after pauses.

**Prevention strategy:**
- Treat project memory as a transactional system: controlled writes, schema validation, and provenance.
- Require completion artifacts (summary + evidence) before advancing state.
- Run periodic memory reconciliation against repo reality (files, tests, commits, phase outputs).
- Add drift detectors: contradiction scans between state docs and current code/test status.

**Phase/layer that should address it:**
- **Phase:** Project memory and persistence phase.
- **Layer:** Memory/state layer (STATE/ROADMAP/phase artifacts/provenance index).

---

### Pitfall 6: Poor Phase Routing (Wrong Workflow for Work Type)
**Specific failure mode:**
General-purpose platform routes tasks to the wrong workflow profile (feature vs bugfix vs hotfix vs chore), causing over/under-validation, wasted compute, or risky shortcuts.

**Early warning signs:**
- Hotfixes follow slow feature workflow or features follow under-validated chore workflow.
- Routing overrides become common manual interventions.
- Similar tickets regularly bounce between phases/workflows.
- Throughput improves while defect/revert rate worsens.

**Prevention strategy:**
- Build explicit intake classification with confidence thresholds and fallback-to-human on ambiguity.
- Define workflow eligibility criteria and non-negotiable guardrails per workflow type.
- Capture routing rationales in logs and audit misroutes weekly.
- Start with only two foundational workflows and prove routing quality before expansion.

**Phase/layer that should address it:**
- **Phase:** Intake/routing phase (immediately after foundational workflow delivery).
- **Layer:** Routing/classification layer + policy engine.

---

### Pitfall 7: Unsafe Autonomy (Action Without Trust Boundaries)
**Specific failure mode:**
Autonomous execution performs high-impact actions (merge, deploy, destructive edits, secret usage) without sufficient trust boundaries, policy checks, or escalation paths.

**Early warning signs:**
- Automation can ship or mutate production-critical systems without explicit risk gates.
- Credentials/secrets are broadly available to generic workflows.
- Untrusted external text is consumed as executable instruction.
- Incident recovery relies on ad-hoc manual heroics.

**Prevention strategy:**
- Enforce untrusted-input boundaries for all fetched/external content.
- Add policy-as-code gates for privileged operations (merge/deploy/destructive commands).
- Require escalation gates for ambiguous, high-risk, or low-confidence decisions.
- Implement least-privilege execution cells with scoped credentials and immutable audit trails.

**Phase/layer that should address it:**
- **Phase:** Safety/security architecture phase (must precede broad autonomy expansion).
- **Layer:** Security/safety layer + privilege and execution sandbox layer.

---

### Pitfall 8: Parallelism Without Isolation (Cross-Cell Interference)
**Specific failure mode:**
Parallel execution cells share mutable base assumptions or branch/worktree state incorrectly, leading to base mismatch, merge conflicts, or nondeterministic outcomes.

**Early warning signs:**
- Wave N succeeds, Wave N+1 fails immediately due to stale base/reference mismatch.
- Frequent branch/worktree hygiene failures and unexpected lock issues.
- Parallel runs produce hidden race conditions in shared artifacts.

**Prevention strategy:**
- Enforce per-wave base checks and degrade safely to sequential mode when base integrity is uncertain.
- Use strict workspace/worktree isolation rules and explicit merge protocols.
- Require deterministic artifact ownership to prevent concurrent overwrite collisions.
- Add wave-level health checks before and after parallel execution bursts.

**Phase/layer that should address it:**
- **Phase:** Parallel execution and scaling phase.
- **Layer:** Execution-cell runtime layer + git/worktree orchestration layer.

---

### Pitfall 9: Reliability Reversal (Autonomy Optimized Before Evidence)
**Specific failure mode:**
Roadmap pressure pushes autonomous throughput first; reliability instrumentation and evidence quality are deferred. Platform appears productive but accumulates hidden quality debt.

**Early warning signs:**
- "More tasks completed" but rising rollbacks, reverts, or post-merge fixes.
- Verification is waived to hit speed goals.
- Roadmap milestones measured by activity, not validated outcomes.

**Prevention strategy:**
- Define reliability-first release criteria for every workflow (must-pass evidence package).
- Block autonomy expansion until foundational workflow reliability targets are met.
- Use conservative rollout stages: shadow mode -> supervised mode -> limited autonomy -> scaled autonomy.
- Track defect escape and confidence metrics as first-class product KPIs.

**Phase/layer that should address it:**
- **Phase:** Product governance and rollout phase.
- **Layer:** Product operations layer + verification governance.

---

### Pitfall 10: Factory Without Specialized Cells (Generalist Bottleneck)
**Specific failure mode:**
Platform stays "general-purpose" at runtime by keeping one generic workflow/agent profile for everything, causing poor performance on specialized scenarios (hotfix, migration, large refactor, security patch).

**Early warning signs:**
- One-size-fits-all workflow with many conditional branches and fragile prompts.
- Hotfix SLA misses because workflow is overburdened by generic process.
- Security-sensitive tasks run through the same path as low-risk chores.

**Prevention strategy:**
- Evolve from two foundational workflows to specialized execution cells with clear routing boundaries.
- Maintain shared core primitives (verification, memory, policy) while specializing execution strategies.
- Benchmark workflows by task class (latency, cost, defect escape, recovery speed).

**Phase/layer that should address it:**
- **Phase:** Workflow expansion phase (post-foundation, post-reliability proof).
- **Layer:** Workflow catalog layer + router and execution-cell strategy layer.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Foundational Workflow 1 (bootstrap from large product doc) | Prompt overreach + memory drift during initial extraction | Deterministic extraction schema, provenance capture, and reconciliation before roadmap writes |
| Foundational Workflow 2 (autonomous phase execution) | Weak verification theater | Layered verification + mandatory evidence bundle before state advance |
| Routing expansion (feature/bugfix/chore/hotfix) | Poor phase routing | Typed workflow eligibility rules + confidence-based fallback to human |
| Parallel execution scale-up | Parallelism without isolation | Wave/base integrity guard + controlled degrade-to-sequential fallback |
| Autonomy expansion | Unsafe autonomy | Policy gates, least privilege, escalation for low confidence/high risk |
| Memory evolution | Memory drift | Transactional memory updates + periodic drift audits |

## Confidence Notes

- **HIGH confidence:** GSD workflow/verification/gating anti-patterns and reliability guidance grounded in local gsd-core references.
- **MEDIUM confidence:** General autonomous coding factory pitfalls from domain patterns and Flow project constraints.
- **LOW confidence:** Pi-specific product mechanics due limited machine-readable public docs retrieved in this run.

## Sources

### Project Context
- `.planning/PROJECT.md` (Flow mission, constraints, workflow-first and reliability-first decisions)

### GSD Core References (local)
- `$HOME/.claude/gsd-core/references/universal-anti-patterns.md`
- `$HOME/.claude/gsd-core/references/verification-patterns.md`
- `$HOME/.claude/gsd-core/references/untrusted-input-boundary.md`
- `$HOME/.claude/gsd-core/references/agent-contracts.md`
- `$HOME/.claude/gsd-core/references/planner-antipatterns.md`
- `$HOME/.claude/gsd-core/references/gates.md`
- `$HOME/.claude/gsd-core/references/loop-hook-dispatch.md`
- `$HOME/.claude/gsd-core/references/execute-phase-wave-guard.md`
- `$HOME/.claude/gsd-core/references/execute-phase-context-guard.md`
- `$HOME/.claude/gsd-core/references/checkpoints.md`

### Public Context (limited retrieval quality in this run)
- https://pi.ai (general product surface; limited extractability)
- https://github.com/opengsd/gsd-core (target repo URL)
- https://github.com/opengsd/gsd-pi (target repo URL)
- https://docs.opengsd.dev (target docs URL)
