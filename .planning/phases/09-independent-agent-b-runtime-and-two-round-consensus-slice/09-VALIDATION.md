---
phase: 09
slug: independent-agent-b-runtime-and-two-round-consensus-slice
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-19
---

# Phase 09 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node test runner |
| **Config file** | `package.json` / in-repo Node test conventions |
| **Quick run command** | `node --test flow/tests/*agent* flow/tests/*debate* flow/tests/*lifecycle*` |
| **Full suite command** | `node --test flow/tests/*.test.mjs` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test flow/tests/*agent* flow/tests/*debate* flow/tests/*lifecycle*`
- **After every plan wave:** Run `node --test flow/tests/*.test.mjs`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 0/1 | INTD-07 | T-09-01 | Agent B startup, handshake, config isolation, and shutdown fail closed with no silent in-process fallback | unit/integration | `node --test flow/tests/*agent*` | ❌ W0 | ⬜ pending |
| 09-02-01 | 02 | 1 | CONS-02 | T-09-02 | Phase-9 scope rejects consensus/debate authority expansion while preserving ask/answer transport semantics | unit | `node --test flow/tests/*debate*` | ❌ W0 | ⬜ pending |
| 09-03-01 | 03 | 2 | VER-05 | T-09-03 | Spec/discuss end-to-end delegated flows retry deterministically, emit stable reason codes, and block on exhaustion | integration | `node --test flow/tests/*lifecycle* flow/tests/*agent*` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `flow/tests/orchestrator-agent-b-runtime.test.mjs` — lifecycle + handshake + shutdown coverage for Agent B process runtime
- [ ] `flow/tests/orchestrator-agent-b-transport.test.mjs` — JSONL envelope, free-text payload, timeout, and retry exhaustion coverage
- [ ] `flow/tests/orchestrator-agent-b-workflows.test.mjs` — delegated `/gsd-spec-phase` and `/gsd-discuss-phase` end-to-end coverage

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Alternate real provider/model credentials in non-test environment | INTD-07 | CI should use stub providers; real credentials must not be stored in repo | Run phase-9 execution in a local sandbox with separate Agent A/B config files and verify sanitized evidence/log outputs under `flow/runs/<run-id>/agent-b/` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
