const DEFAULT_INTERCEPT_RULES = Object.freeze([
  {
    workflow: "spec-phase",
    interactionType: "question-round",
    route: "responder-agent",
    policy: "deterministic-context-pack",
    contractScope: "phase8-spec-discuss-only",
  },
  {
    workflow: "discuss-phase",
    interactionType: "question-round",
    route: "responder-agent",
    policy: "deterministic-context-pack",
    contractScope: "phase8-spec-discuss-only",
  },
]);

export function buildAgentBInterceptionRuntime({ workflow, transport = "stdio-jsonl", scope = "spec-discuss-ask-answer-only" }) {
  return {
    workflow,
    transport,
    scope,
    roleBoundary: "agent-a-controls-policy_agent-b-answer-only",
    phase9Runtime: true,
  };
}

export function buildInterceptionMetadata({ selectedPhases }) {
  return {
    schemaVersion: 1,
    interceptionEnabled: true,
    debateContract: {
      schemaVersion: "1.0.0",
      supportedWorkflows: ["spec-phase", "discuss-phase"],
      roleBoundary: "agent-a-controls-policy_agent-b-answer-only",
    },
    phases: selectedPhases.map((phase) => ({
      phaseNumber: phase.phaseNumber,
      phaseId: phase.id,
      rules: DEFAULT_INTERCEPT_RULES,
    })),
  };
}
