---
phase: 01-pi-integration-baseline-and-safe-routing
plan: 01
type: summary
status: complete
execution_pass: rerun-root-flow-placement
---

# Phase 1 Plan 01 Summary (Rerun)

## Outcome

Phase 1 was re-executed with a higher-level architecture: Flow kernel logic now lives in the repository root under `flow/`, and `external/gsd-pi` keeps only a thin slash-command bridge.

## Architecture Choice

Flow is the product-level control plane and should not be embedded deeply in extension internals.

This rerun moves deterministic Flow behavior to root-level modules and leaves gsd-pi as a host adapter. That reduces coupling and keeps future Flow evolution independent from gsd-pi internals.

## What Changed

### Root-level Flow kernel

- Added boundary contract: `flow/docs/phase-1-boundary.md`
- Added root CLI entrypoint: `flow/cli.mjs`
- Added canonical routing kernel: `flow/kernel/commands.mjs`
- Added fail-closed policy helper: `flow/kernel/policy.mjs`
- Added root kernel tests: `flow/tests/kernel.test.mjs`
- Added root architecture guide: `flow/README.md`

### gsd-pi bridge only

- Kept only slash-command forwarding for `/flow-create-additional-phases` and `/flow-execute-all-phases` in `external/gsd-pi/packages/gsd-agent-modes/src/modes/interactive/slash-command-handlers.ts`
- Updated bridge test assertions in `external/gsd-pi/packages/gsd-agent-modes/src/modes/interactive/slash-command-handlers.test.ts`
- Reverted prior deep Flow logic changes in gsd-pi (`workflow.ts`, `register-hooks.ts`, related tests) so Flow logic remains outside.

## Verification

- Root Flow kernel tests:
  - `cd /home/juan/codes/loop-pi-gsd && node --test flow/tests/kernel.test.mjs`
  - Result: pass (4/4)
- gsd-pi bridge tests:
  - `cd /home/juan/codes/loop-pi-gsd/external/gsd-pi && node --import ./src/resources/extensions/gsd/tests/resolve-ts.mjs --experimental-strip-types --test packages/gsd-agent-modes/src/modes/interactive/slash-command-handlers.test.ts`
  - Result: pass (5/5)

## Deviations from Plan

None.

## Self-Check: PASSED
