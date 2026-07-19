export const FLOW_CANONICAL_WORKFLOWS = Object.freeze({
  CREATE_ADDITIONAL_PHASES: "flow-create-additional-phases",
  EXECUTE_ALL_PHASES: "flow-execute-all-phases",
});

const FLOW_INPUT_TO_CANONICAL = Object.freeze({
  "/flow-create-additional-phases": FLOW_CANONICAL_WORKFLOWS.CREATE_ADDITIONAL_PHASES,
  "/flow-execute-all-phases": FLOW_CANONICAL_WORKFLOWS.EXECUTE_ALL_PHASES,
  "flow-create-additional-phases": FLOW_CANONICAL_WORKFLOWS.CREATE_ADDITIONAL_PHASES,
  "flow-execute-all-phases": FLOW_CANONICAL_WORKFLOWS.EXECUTE_ALL_PHASES,
});

export function normalizeFlowCommand(input) {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (/\s/.test(trimmed)) return null;
  return FLOW_INPUT_TO_CANONICAL[trimmed] ?? null;
}

export function assertCanonicalFlowCommand(input) {
  const canonical = normalizeFlowCommand(input);
  if (!canonical) {
    throw new Error(
      "Unsupported Flow command. Use flow-create-additional-phases or flow-execute-all-phases.",
    );
  }
  return canonical;
}
