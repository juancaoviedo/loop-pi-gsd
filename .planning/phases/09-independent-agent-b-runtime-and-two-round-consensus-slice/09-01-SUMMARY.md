---
phase: 09-independent-agent-b-runtime-and-two-round-consensus-slice
plan: 01
subsystem: orchestrator
tags: [agent-b, runtime, protocol, evidence]
requires: []
provides:
  - Real Agent B child-process runtime with startup handshake gate
  - Strict stdio JSONL protocol envelope validation and reason-code errors
  - Sanitized per-run evidence persistence under flow/runs/<run-id>/agent-b/
affects: [orchestrator, tests, governance]
tech-stack:
  added: []
  patterns: [child-process isolation, strict envelope validation, fail-closed startup]
key-files:
  created:
    - flow/orchestrator/agent-b-protocol.mjs
    - flow/orchestrator/agent-b-entry.mjs
    - flow/orchestrator/agent-b-runtime.mjs
    - flow/tests/orchestrator-agent-b-runtime.test.mjs
key-decisions:
  - "Gate delegated questions on explicit capability-echo startup handshake."
  - "Persist only sanitized provider metadata plus free-text answer evidence."
patterns-established:
  - "Parent/child stdio JSONL contract with correlation IDs"
  - "Real process-boundary runtime tests with clean shutdown assertions"
requirements-completed: [INTD-07]
coverage:
  - id: D1
    description: "Added strict envelope parser/validator with retryable malformed JSONL errors and schema checks."
    requirement: "INTD-07"
    verification:
      - kind: unit
        ref: "flow/orchestrator/agent-b-protocol.mjs"
        status: pass
    human_judgment: false
  - id: D2
    description: "Implemented child entry harness with capability echo and deterministic answer loop."
    requirement: "INTD-07"
    verification:
      - kind: integration
        ref: "flow/tests/orchestrator-agent-b-runtime.test.mjs"
        status: pass
    human_judgment: false
  - id: D3
    description: "Implemented parent runtime manager with separate pid, readiness gate, correlation waiters, and evidence writes."
    requirement: "INTD-07"
    verification:
      - kind: integration
        ref: "flow/tests/orchestrator-agent-b-runtime.test.mjs"
        status: pass
    human_judgment: false
duration: 45min
completed: 2026-07-19
status: complete
---

# Phase 9 Plan 01 Summary

Implemented the minimal independent Agent B runtime slice with strict protocol and evidence-backed ask/answer execution.

## Accomplishments
- Added the protocol contract (`agent-b-protocol.mjs`) with strict envelope validation and namespaced transport reason codes.
- Added a real child runtime entry (`agent-b-entry.mjs`) that emits capability echo and answers delegated spec/discuss questions.
- Added parent runtime manager (`agent-b-runtime.mjs`) with spawn, handshake readiness gate, correlated request/response, and sanitized evidence writes.
- Added runtime integration test coverage for separate pid, readiness guard, validated answers, sanitized evidence, and clean shutdown.

## Verification
- `node --test flow/tests/orchestrator-agent-b-runtime.test.mjs` passed.

## Deviations
- None.
