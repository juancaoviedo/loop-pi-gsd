# Phase 8: multi-agent-spec-discuss-architecture-contract - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-07-19
**Phase:** 08-multi-agent-spec-discuss-architecture-contract
**Areas discussed:** Message schema contract shape, Stop/escalate policy algorithm, Prototype execution seam, Validation and observability contract

---

## Message schema contract shape

| Option | Description | Selected |
|--------|-------------|----------|
| Per-event schemas with shared base envelope | Base fields plus event-specific required fields. | ✓ |
| Single union schema for all events | One validator with conditional branches. | |
| Minimal schema (question/answer only) | Defer stop-check/escalate/error fields. | |

**User's choice:** Per-event schemas with shared base envelope
**Notes:** Also selected semantic major versioning and UTF-8 + trim + NFC normalization for text fields.

---

## Stop/escalate policy algorithm

| Option | Description | Selected |
|--------|-------------|----------|
| Escalate-and-block always overrides proceed | Blocking risk/conflict forces escalation. | |
| Proceed when answer is valid, flag risk only | Continue despite blocker with warning. | ✓ (initial) |
| Configurable precedence per run | Allow runtime override of precedence. | |

**User's choice:** Initial selection conflicted with locked SPEC requirement.
**Notes:** User explicitly chose to preserve SPEC lock as source of truth for this phase context. Final locked decision in CONTEXT keeps escalate-overrides-proceed and deterministic reason-code output.

---

## Prototype execution seam

| Option | Description | Selected |
|--------|-------------|----------|
| flow/orchestrator prototype module | Aligns with current interception/context-pack orchestration seam. | ✓ (Claude discretion) |
| flow/lifecycle prototype module | Lifecycle-first placement. | |
| flow/governance prototype module | Governance-first placement. | |

**User's choice:** "put it where you think is best"
**Notes:** Claude discretion applied within phase boundary; feature-flagged seam in flow/cli.mjs selected for deterministic invocation.

---

## Validation and observability contract

| Option | Description | Selected |
|--------|-------------|----------|
| Include raw provider response body in logs | Maximum debugging context but higher secret risk. | ✓ (initial) |
| Store sanitized provider metadata only | Keep observability while preserving prohibition-safe logging. | ✓ (resolved) |

**User's choice:** Final resolution is sanitized metadata only.
**Notes:** Mandatory envelope field set selected: schemaVersion, runId, phaseNumber, eventType, timestampIso, correlationId, agentRole, confidence.

---

## Claude's Discretion

- Prototype module placement details and naming under `flow/orchestrator/`.

## Deferred Ideas

- Re-open SPEC if the team wants free-text-only decision summaries instead of deterministic reason-code output.
- Multi-agent debate behavior remains deferred to later phases.
