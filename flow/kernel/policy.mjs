import { FLOW_CANONICAL_WORKFLOWS, assertCanonicalFlowCommand } from "./commands.mjs";

const ALLOWED_CUSTOM_TYPES = new Set([
  FLOW_CANONICAL_WORKFLOWS.CREATE_ADDITIONAL_PHASES,
  FLOW_CANONICAL_WORKFLOWS.EXECUTE_ALL_PHASES,
]);

export function isFlowCustomType(customType) {
  return typeof customType === "string" && ALLOWED_CUSTOM_TYPES.has(customType);
}

export function enforceFlowPolicy({ customType, toolName, allowedToolsByWorkflow }) {
  const workflow = assertCanonicalFlowCommand(customType);
  const allowed = allowedToolsByWorkflow?.[workflow];
  if (!Array.isArray(allowed) || allowed.length === 0) {
    throw new Error(`No tool policy configured for ${workflow}.`);
  }
  if (!allowed.includes(toolName)) {
    throw new Error(`Tool ${toolName} is blocked for ${workflow}.`);
  }
  return true;
}
