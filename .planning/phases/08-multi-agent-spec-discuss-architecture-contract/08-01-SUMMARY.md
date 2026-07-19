---
phase: 08-multi-agent-spec-discuss-architecture-contract
plan: 01
subsystem: orchestrator
tags: [determinism, contract, policy, cli]
requires: []
provides:
  - Deterministic debate contract envelope validation with schema-major gating
  - Pure policy evaluator with stable reason-code ordering
  - Runnable phase-8 prototype seam and feature-flagged CLI entry
affects: [spec-phase, discuss-phase, governance]
tech-stack:
  added: []
  patterns: [fail-closed contract validation, deterministic reason sorting]
key-files:
  created:
    - flow/orchestrator/debate-contract.mjs
    - flow/orchestrator/debate-policy.mjs
    - flow/orchestrator/debate-prototype.mjs
    - flow/tests/orchestrator-debate-prototype.test.mjs
  modified:
    - flow/cli.mjs
key-decisions:
  - "Use per-event envelope validation with strict required fields and schema-major fail-closed gate."
  - "Keep policy pure and deterministic: blockers always outrank threshold checks."
patterns-established:
  - "Contract-first orchestration: validate then evaluate policy"
  - "Replay determinism via sorted/de-duplicated reason codes"
requirements-completed: [INTD-06, CONS-01]
coverage:
  - id: D1
    description: "Implemented event-envelope validation and schema-major fail-closed contract."
    requirement: "INTD-06"
    verification:
      - kind: unit
        ref: "flow/tests/orchestrator-debate-contract.test.mjs#validateDebateEventEnvelope accepts valid envelope"
        status: pass
    human_judgment: false
  - id: D2
    description: "Implemented deterministic proceed/escalate policy with stable reason ordering."
    requirement: "CONS-01"
    verification:
      - kind: unit
        ref: "flow/tests/orchestrator-debate-policy.test.mjs#reason ordering is deterministic and de-duplicated"
        status: pass
    human_judgment: false
  - id: D3
    description: "Implemented replay-stable prototype behavior and role-boundary baseline."
    requirement: "INTD-06"
    verification:
      - kind: integration
        ref: "flow/tests/orchestrator-debate-prototype.test.mjs#replay of identical transcript/config is deterministic"
        status: pass
    human_judgment: false
duration: 45min
completed: 2026-07-19
status: complete
---

# Phase 8 Plan 01 Summary

**Shipped a deterministic phase-8 debate contract and prototype seam that enforces Agent A/Agent B boundaries and replay-stable decisions.**

## Performance

- **Duration:** 45 min
- **Completed:** 2026-07-19
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments
- Added `debate-contract`, `debate-policy`, and `debate-prototype` orchestration modules.
- Added feature-flagged CLI entry seam for prototype execution scope.
- Added deterministic replay and role-boundary prototype tests.

## Task Commits

Each task was completed in this execution run. Commits were not created by this orchestrator session.

## Files Created/Modified
- `flow/orchestrator/debate-contract.mjs` - Envelope schema checks, per-event validation, text normalization.
- `flow/orchestrator/debate-policy.mjs` - Deterministic blocker-precedence decision function.
- `flow/orchestrator/debate-prototype.mjs` - Bounded transcript evaluation and deterministic decision output.
- `flow/tests/orchestrator-debate-prototype.test.mjs` - Replay and role-boundary baseline tests.
- `flow/cli.mjs` - `--phase8-debate-prototype` execution seam.

## Decisions Made
- Kept all plan-01 logic in orchestrator scope to preserve phase boundary.
- Mapped malformed/unknown/unsupported contract failures to deterministic blocker reason codes.

## Deviations from Plan

None - plan goals were delivered as specified.

## Issues Encountered

- Initial mismatch: empty critique answers were rejected by contract layer before retry logic.
- Resolution: adjusted critique payload validation to allow empty string values so retry exhaustion policy can handle escalation deterministically.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 02 can now harden the full failure matrix and governance sanitization on top of the stable contract/prototype baseline.
