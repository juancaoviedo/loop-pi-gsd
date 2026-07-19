# Phase 09: independent-agent-b-runtime-and-two-round-consensus-slice - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-19
**Phase:** 09-independent-agent-b-runtime-and-two-round-consensus-slice
**Areas discussed:** Agent B process lifecycle, A↔B transport contract, Config and provider isolation, Failure reason-code matrix and retry policy

---

## Agent B process lifecycle

| Option | Description | Selected |
|--------|-------------|----------|
| Run-scoped sidecar process | Start once per phase execution run and reuse for all delegated questions in that run. | |
| Question-scoped process | Spawn a fresh process per delegated question. | |
| Workspace daemon process | Keep one long-lived process across runs. | |
| Phase-scoped lifecycle (clarified in discussion) | Keep Agent B alive for both spec and discuss in the same phase, then terminate after discuss. | ✓ |

**User's choice:** Phase-scoped lifecycle with Agent B alive across spec + discuss, then terminate after discuss.
**Notes:** Startup requires explicit handshake + capability echo. Shutdown is graceful with timeout then force-kill. Evidence stored under `flow/runs/<run-id>/agent-b/`.

---

## A↔B transport contract

| Option | Description | Selected |
|--------|-------------|----------|
| Stdio JSONL request/response | Child-process newline-delimited envelope exchange. | ✓ |
| Local Unix domain socket | Explicit socket lifecycle and additional connection management. | |
| Loopback HTTP | Familiar protocol with larger local attack/config surface. | |

**User's choice:** Stdio JSONL request/response with strict schema envelope and free-text answer field in payload.
**Notes:** Invalid/malformed responses are retryable first, then escalate-and-block on exhaustion. Timeout chosen as 5 minutes per try.

---

## Config and provider isolation

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated Agent B config file path | Separate provider/model/runtime path for Agent B. | ✓ |
| Shared config with Agent B overrides | Shared baseline with override fields. | |
| Environment-only dynamic config | Flexible dynamic env sourcing only. | |

**User's choice:** Dedicated Agent B config path with fail-closed startup if invalid/missing.
**Notes:** Logs/evidence must use strict redaction/allowlisted provider metadata; tests should prove distinct A/B provider-model execution via handshake + persisted evidence.

---

## Failure reason-code matrix and retry policy

| Option | Description | Selected |
|--------|-------------|----------|
| 3 attempts total | Initial + two retries. | |
| 2 attempts total | Stricter bounded retries. | ✓ |
| 5 attempts total | Higher resilience with slower escalation. | |

**User's choice:** Retry cap is 2 attempts total.
**Notes:** Timeout remains 5 minutes per try. Failures map to stable namespaced reason codes by class. Exhaustion disposition is always `escalate-and-block` with `retry_exhausted` + root-cause code.

---

## Claude's Discretion

- None delegated.

## Deferred Ideas

- Debate/consensus expansion deferred to future phases.
- Agora transport integration deferred to Phase 11.
