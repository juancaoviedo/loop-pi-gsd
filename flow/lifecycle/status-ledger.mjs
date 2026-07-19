export function createLifecycleLedger({ phase, runId }) {
  return {
    schemaVersion: 1,
    runId,
    phaseNumber: phase.phaseNumber,
    phaseId: phase.id,
    phaseName: phase.name,
    status: "pending",
    steps: [],
    startedAt: new Date().toISOString(),
    finishedAt: null,
    terminalReason: null,
  };
}

export function recordStepStatus(ledger, entry) {
  const next = {
    ...entry,
    timestamp: entry.timestamp ?? new Date().toISOString(),
  };
  ledger.steps.push(next);
  return next;
}

export function finalizeLifecycleLedger(ledger, { status, terminalReason = null }) {
  ledger.status = status;
  ledger.terminalReason = terminalReason;
  ledger.finishedAt = new Date().toISOString();
  return ledger;
}
