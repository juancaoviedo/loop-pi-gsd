# Technology Stack

**Project:** Flow
**Researched:** 2026-07-17
**Decision posture:** Reliability-first for autonomous engineering execution

## Recommended Stack

### Core Framework
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Node.js | 22 LTS | Primary runtime for control plane and workers | Pi and GSD surfaces are Node/TypeScript-centric; keeping one runtime avoids cross-language operational drag in v1. |
| TypeScript | 5.9+ (strict) | Main language across orchestration, adapters, and workflow code | Strong type contracts reduce orchestration regressions and make workflow boundaries explicit for a reliability-first product. |
| Temporal (TypeScript SDK + Temporal Server/Cloud) | Current stable | Durable workflow orchestration and retries | Flow's core unit is long-running, failure-prone workflow execution; Temporal gives durable state, retries, signals, timers, and execution visibility out of the box. |
| Fastify | 5.x | API gateway/control-plane HTTP surface | Lower overhead and strong schema-first validation for operational APIs, compared to heavier alternatives. |

### Database
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| PostgreSQL | 17 (or 18 once internal validation passes) | Source of truth for projects, workflow metadata, evidence index, tenant/config data | Mature transactional guarantees and operational predictability; best fit for reliability-first process memory and auditability. |
| pgvector (optional, scoped) | Current stable | Semantic retrieval for phase/doc recall only | Useful for recall workflows, but keep secondary to deterministic artifact memory in v1. |

### Infrastructure
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Kubernetes | 1.31+ | Orchestration for control-plane services and worker fleets | Required for controlled parallelism, autoscaling, and strong operational controls as autonomous workload volume increases. |
| containerd + gVisor RuntimeClass | Current stable | Execution isolation for untrusted or generated code tasks | gVisor adds defense-in-depth at runtime for code execution surfaces where agent output may be unsafe. |
| Cilium | 1.16+ | Network policy and observability at cluster edge | Enforces strict cell-to-cell boundaries and helps prevent lateral movement between execution cells. |
| object storage (S3-compatible) | Current stable | Artifact/evidence storage (logs, test outputs, snapshots) | Keeps immutable workflow evidence outside primary DB and supports replay/forensics. |

### Queueing and Eventing
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Temporal task queues | Current stable | Primary durable work scheduling | Avoids split-brain between orchestrator and separate job queue; one durability model for retries and visibility. |
| Redis | 8.x | Ephemeral cache, rate limits, short-lived coordination only | Fast operational cache; do not treat as system-of-record queue for critical lifecycle transitions. |
| NATS JetStream (defer unless needed) | Current stable | Optional high-throughput event fan-out for non-critical signals | Add only when product analytics/event fan-out outgrows direct DB + Temporal signaling patterns. |

### Observability
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| OpenTelemetry (SDK + Collector) | Current stable | Unified traces/metrics/log context | Critical for correlating agent actions, tool calls, workflow retries, and phase outcomes end-to-end. |
| Prometheus | Current stable | Metrics and SLO alerting | Battle-tested metrics storage and alerting for control-plane and worker health. |
| Grafana + Tempo + Loki | Current stable | Unified dashboards, traces, and logs | Gives operators one place to debug failed or flaky workflows with shared correlation IDs. |

### UI
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js (App Router) + React 19 | Current stable | Operator and team-facing web console | Strong ecosystem and production tooling for building workflow visibility surfaces quickly. |
| Tailwind CSS + Radix UI | Current stable | Pragmatic design system primitives | Fast assembly of consistent operations UI without heavy custom design-system investment in v1. |
| TanStack Query | 5.x | Data-fetching/cache in UI | Predictable async state for workflow timelines, run details, and evidence views. |

## Recommended Logical Topology

1. API/control plane (Fastify, TypeScript)
2. Workflow engine (Temporal service)
3. Workflow workers (TypeScript workers calling Pi + GSD adapters)
4. Process memory and metadata (PostgreSQL)
5. Evidence store (S3-compatible object storage)
6. Isolated execution cells (Kubernetes Jobs/Pods with gVisor RuntimeClass)
7. Observability plane (OTel Collector -> Prometheus/Tempo/Loki/Grafana)

## Prescriptive Fit For Flow

- Use Pi as the execution harness at workflow step boundaries, not as the primary state machine.
- Use GSD as workflow/process-memory grammar and lifecycle authority (`ROADMAP.md`, phases, verification artifacts), persisted and indexed in Postgres.
- Let Temporal own long-running control flow: retries, pauses, resumptions, human-in-loop checkpoints, and failure recovery.
- Treat each autonomous phase execution as a durable workflow with explicit evidence outputs (tests, checks, artifacts, decision logs).
- Isolate all code-mutating or untrusted operations in dedicated runtime cells with least-privilege credentials and strict network policy.

## What Not To Use Yet (And Why)

| Category | Avoid for v1 | Why Not Yet |
|----------|---------------|-------------|
| Language mix | Python/Go control plane split | Reliability priority favors one runtime and one operational toolchain initially. |
| Data layer | Multi-database polyglot (e.g., separate graph DB + vector DB + OLAP) | Premature complexity; start with PostgreSQL + object storage and add specialized stores only on proven pain. |
| Orchestration | Custom in-house workflow engine | High reliability risk and hidden edge cases versus durable off-the-shelf workflow runtime. |
| Queueing | Kafka as primary workflow queue | Excellent for event streams, but overkill for initial workflow durability needs; increases ops surface early. |
| Isolation | Bare Docker without hardened sandbox | Insufficient for untrusted generated-code execution threat model. |
| Service mesh | Full mesh rollout on day one | Adds latency and operational burden before traffic and team size justify it. |
| UI architecture | Micro-frontends | Slows shipping and hurts consistency for a small team v1 control console. |
| Memory strategy | “LLM memory only” without deterministic artifacts | Violates evidence-backed reliability requirement; memory must be auditable and replayable. |

## Confidence Levels

Method note: confidence values use seam classification outputs available in this environment. Provider tiers observed: `context7/ref/jina/firecrawl = MEDIUM`, `exa/webfetch/github/websearch/tavily/brave/perplexity = LOW`.

| Decision Area | Confidence | Reason |
|---------------|------------|--------|
| Node.js + TypeScript as primary runtime/language | MEDIUM | Strong direct alignment with Pi/GSD ecosystem signals; proven fit for v1 integration velocity and reliability discipline. |
| Temporal as orchestration backbone | MEDIUM | Durable workflow model strongly matches long-running autonomous lifecycle requirements and retry semantics. |
| PostgreSQL as primary store | MEDIUM | Mature reliability profile and ACID guarantees align with evidence-backed process-memory needs. |
| Kubernetes + gVisor execution isolation | MEDIUM | Widely adopted orchestration plus explicit untrusted-code isolation support; good match for execution-cell model. |
| OTel + Prometheus + Grafana/Tempo/Loki observability | MEDIUM | Standardized telemetry and correlated debugging stack fit workflow-heavy operational demands. |
| Redis as cache (not source-of-truth queue) | LOW | Recommendation is pattern-driven and conservative; queue role depends on observed workload profile in implementation. |
| Deferring Kafka/NATS until proven need | LOW | Correct for many early-stage systems but requires validation with actual throughput/event fan-out requirements. |

## Installation Baseline

```bash
# Core runtime + API + workflow SDK
npm install typescript tsx fastify @temporalio/client @temporalio/worker @temporalio/workflow zod

# Data + cache
npm install pg ioredis

# Observability
npm install @opentelemetry/api @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node

# UI
npm install next react react-dom @tanstack/react-query tailwindcss @radix-ui/react-slot

# Dev and quality
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin vitest
```

## Sources

- open-gsd/gsd-core repository surfaces (workflow and .planning lifecycle signals)
- open-gsd/gsd-pi repository surfaces (Node/TS + MCP + workflow bridge signals)
- https://temporal.io/
- https://www.postgresql.org/
- https://kubernetes.io/
- https://gvisor.dev/
- https://opentelemetry.io/
- https://redis.io/
