# Flow Kernel (Root-Level)

This folder hosts Flow's deterministic control-plane kernel at the project root.

## Why this folder exists

Flow is a higher-level orchestration product that composes Pi/gsd-pi. Keeping core Flow routing and policy logic outside `external/gsd-pi` avoids coupling product behavior to extension internals.

## Layout

- `cli.mjs`: small command-line entrypoint for canonical Flow command handling.
- `kernel/commands.mjs`: exact-match normalization and canonical workflow registry.
- `kernel/policy.mjs`: fail-closed policy helpers for workflow/tool allowlists.
- `tests/kernel.test.mjs`: focused tests for determinism and policy blocking.

## Bridge contract with gsd-pi

`external/gsd-pi` may keep a thin adapter that forwards `/flow-*` slash commands into this folder.
The adapter should not duplicate normalization or policy logic.
