import crypto from "node:crypto";
import path from "node:path";

function deterministicHash(payload) {
  return crypto.createHash("sha1").update(payload).digest("hex").slice(0, 12);
}

export function buildOrchestratorRunId({ selectedPhases, stateDigest = "" }) {
  const seed = JSON.stringify({
    selectedPhases: selectedPhases.map((phase) => ({ n: phase.phaseNumber, name: phase.name })),
    stateDigest,
  });
  return `orchestrator-${deterministicHash(seed)}`;
}

export function buildIsolationDescriptors({ runId, selectedPhases, projectRoot }) {
  if (!runId) throw new Error("Missing runId for isolation descriptors.");
  if (!Array.isArray(selectedPhases) || selectedPhases.length === 0) {
    throw new Error("No selected phases provided for isolation descriptors.");
  }

  const descriptors = selectedPhases.map((phase) => ({
    phaseNumber: phase.phaseNumber,
    phaseId: phase.id,
    phaseName: phase.name,
    runId,
    rootContextPath: path.join(projectRoot, "flow", "runs", runId),
    phaseContextPath: path.join(projectRoot, "flow", "runs", runId, "phases", `phase-${String(phase.phaseNumber).padStart(2, "0")}`),
    allowlistProfile: "flow-execute-all-phases",
  }));

  const seen = new Set();
  for (const descriptor of descriptors) {
    if (seen.has(descriptor.phaseContextPath)) {
      throw new Error("Isolation descriptor collision detected.");
    }
    seen.add(descriptor.phaseContextPath);
  }

  return descriptors;
}
