# Agent Interaction Language

This document defines the shared language for autonomous two-agent operation in this project.

## Core Terms

- Agent A: the GSD execution agent that runs workflow commands and asks interactive questions.
- Agent B: the responder agent that answers Agent A questions using project artifacts.
- OBJECTIVE artifact: the extended project description file in .planning.

## OBJECTIVE Artifact Contract

Accepted filenames:
- OBJECTIVE.md
- OBJECTIVE.pdf
- OBJECTIVE.html

Location:
- .planning/

Default precedence when multiple versions exist:
1. OBJECTIVE.md
2. OBJECTIVE.html
3. OBJECTIVE.pdf

## Phase Discussion Trace Contract

Every phase directory under .planning/phases must include DISCUSSION-LOG.md.
This file stores question-and-answer traces generated during phase interaction rounds.

## Minimum Context Agent B Must Read Before Answering

Global artifacts:
- .planning/PROJECT.md
- .planning/REQUIREMENTS.md
- .planning/ROADMAP.md
- .planning/STATE.md
- .planning/OBJECTIVE.md or .planning/OBJECTIVE.html or .planning/OBJECTIVE.pdf

Phase-local artifacts (if present):
- DISCUSSION-LOG.md
- NN-SPEC.md
- NN-CONTEXT.md
- NN-01-PLAN.md
- NN-01-SUMMARY.md

## Interaction Record Fields

Each Q/A round should preserve at least:
- questionId
- agentId
- workflow
- question
- answer
- rationale
- confidence
- riskScore
- conflict
- escalationDisposition
- createdAt

## Governance Outcome Rules

- High risk, low confidence, conflict, or failed lifecycle status can trigger human-review-required.
- Finalization is blocked when escalation gate is human-review-required.
