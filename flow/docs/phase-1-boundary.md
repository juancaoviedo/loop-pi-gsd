# Flow Phase 1 Boundary Contract (Root-Level Kernel)

## Placement

Flow kernel code lives in the repository root under `flow/`.

Pi/gsd-pi keeps only a thin slash-command adapter that forwards to `flow/cli.mjs`.

## Ownership Split

### Flow owns

- Canonical command normalization for:
  - `flow-create-additional-phases`
  - `flow-execute-all-phases`
- Fail-closed command validation.
- Fail-closed workflow/tool policy helpers.

### Pi/gsd-pi owns

- Interactive slash-command entrypoint.
- Session/runtime/tooling host behavior.
- Existing workflow surfaces and lifecycle machinery.

## Guardrails

- No duplicate lifecycle engine in Flow Phase 1.
- No broad workflow catalog expansion in Phase 1.
- Unknown or malformed input must fail before dispatch.
- Non-allowlisted tools must fail closed.
