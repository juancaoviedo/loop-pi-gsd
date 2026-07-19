---
phase: 08
slug: multi-agent-spec-discuss-architecture-contract
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-19
---

# Phase 08 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node test runner (`node --test`) |
| **Config file** | none — Wave 0 installs shared harness as needed |
| **Quick run command** | `node --test flow/tests/kernel.test.mjs flow/tests/lifecycle-engine.test.mjs` |
| **Full suite command** | `node --test flow/tests/*.test.mjs` |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test flow/tests/kernel.test.mjs flow/tests/lifecycle-engine.test.mjs`
- **After every plan wave:** Run `node --test flow/tests/*.test.mjs`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 90 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | INTD-06 | T-08-01 | Deterministic role/orchestration contract is enforced for spec/discuss only | unit | `node --test flow/tests/kernel.test.mjs` | ✅ | ⬜ pending |
| 08-01-02 | 01 | 1 | CONS-01 | T-08-02 | Event schema major version mismatches fail closed | unit | `node --test flow/tests/lifecycle-answer-schema.test.mjs` | ❌ W0 | ⬜ pending |
| 08-02-01 | 02 | 2 | SAFE-04 | T-08-03 | Timeout/escalation behavior is deterministic and machine-enforced | integration | `node --test flow/tests/governance-escalation.test.mjs flow/tests/lifecycle-retry.test.mjs` | ✅ | ⬜ pending |
| 08-03-01 | 03 | 2 | INTD-06, CONS-01, SAFE-04 | T-08-04 | Failure matrix behaviors (malformed payloads, provider failure, no-response, unresolved disagreement) are asserted | integration | `node --test flow/tests/multi-agent-architecture-contract.test.mjs` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `flow/tests/lifecycle-answer-schema.test.mjs` — schema-version and event-family validation tests
- [ ] `flow/tests/multi-agent-architecture-contract.test.mjs` — end-to-end deterministic debate policy and escalation matrix tests
- [ ] Shared fixture helpers for synthetic proposal/critique/revision/vote event payloads

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Provider-specific timeout telemetry shape | SAFE-04 | Provider metadata fields may vary by runtime | Run one timeout scenario and inspect emitted escalation metadata for required core fields only (`code`, `phase`, `round`, `timestamp`) |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 90s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending