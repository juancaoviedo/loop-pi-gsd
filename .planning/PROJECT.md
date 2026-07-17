# Flow

## What This Is

Flow is a general-purpose autonomous coding platform for building the system that builds software. It uses Pi as the agent execution surface and GSD as the structured workflow and project-memory layer to run software-development workflows that can shape work, create plans, execute phases, verify outcomes, and improve the factory over time.

The initial product focus is not the full factory at once, but the first two production workflows that prove the core thesis: the factory can read large product-definition inputs, convert them into structured GSD project artifacts, and then execute roadmap phases autonomously through the GSD lifecycle.

## Core Value

Turn ambiguous software intent into reliable, evidence-backed engineering execution through reusable AI developer workflows.

## Business Context

- **Customer**: Small engineering teams building software with agents
- **Revenue model**: Pending
- **Success metric**: Teams can create and advance software projects through repeatable autonomous workflows with high verification confidence
- **Strategy notes**: Start with two foundational workflows, then expand into the broader software factory

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Ingest a large architecture or product-definition document and initialize a GSD project from it.
- [ ] Autonomously execute roadmap phases through the full GSD lifecycle with evidence and verification.
- [ ] Establish a workflow-first factory architecture that can expand into additional job types such as feature, bugfix, chore, and hotfix pipelines.

### Out of Scope

- Fully automated, no-oversight shipping across all workflow types on day one — reliability and evidence must be proven first.
- Building every specialized factory workflow in the first release — v1 focuses on the two foundational workflows that enable the broader platform.

## Context

The product combines three ideas into one system:

- Pi provides the agent harness and execution environment.
- GSD provides the disciplined workflow grammar, project artifacts, and phase lifecycle.
- AI developer workflows provide the operating model: engineers, agents, and deterministic code are combined into repeatable software-production pipelines.

The long-term goal is a software development factory: a general-purpose platform that can intake work, route it into the right autonomous workflow, run isolated execution cells, verify outputs with deterministic checks, and accumulate project and workflow memory over time.

The first two workflows establish the platform core:

1. Project bootstrap workflow:
   Read a large markdown description of a product or system architecture, extract the intent, initialize a GSD project, and create or extend phases in ROADMAP.md.
2. Phase execution workflow:
   Read the roadmap, select phases, and autonomously run the GSD lifecycle needed to move a phase from definition to verified execution.

These workflows are deliberately foundational. If they work reliably, they become the substrate for broader factory capabilities such as ticket intake, workflow routing, multi-cell execution, hotfix orchestration, and automated phase expansion.

## Constraints

- **Reliability**: Evidence-backed execution is more important than raw autonomy — workflows must produce verifiable outputs.
- **Architecture**: The system is workflow-first, not prompt-first — deterministic routing and validation should own control flow.
- **Platform**: Pi and GSD are core building blocks — the product should compose them rather than reimplement them.
- **Scope**: The product is general-purpose, but initial delivery should focus on the two workflows that unlock the larger factory.
- **Execution model**: Parallel execution should be supported where safe because the platform is intended to scale through isolated runs.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Build a general-purpose autonomous coding platform | The goal is a software factory, not a single-purpose automation script | — Pending |
| Start with two foundational workflows | The platform needs a narrow proof surface before expanding into all factory workflows | — Pending |
| Use Pi as execution surface and GSD as process memory/workflow layer | Reuse strong existing primitives instead of rebuilding agent harness and SDLC control from scratch | — Pending |
| Favor workflow-first architecture | Routing, verification, and persistence must live in deterministic code rather than giant prompts | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-17 after initialization*